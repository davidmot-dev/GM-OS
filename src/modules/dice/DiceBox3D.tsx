import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { type RollRecord } from '../../stores/useDiceStore';

interface DiceBox3DProps {
    active: boolean;
    lastRoll: RollRecord | null;
}

// ------------------------------------------------------------------
// UTILS: Geometric constants for typical dice
// ------------------------------------------------------------------

/**
 * Creates a Pentagonal Trapezohedron (True D10 Shape)
 */
function createD10Geometry(radius: number = 1.2): THREE.BufferGeometry {
    const vertices: number[] = [];
    // Standard coordinates provided by user (scaled by radius/1.0 factor)
    const scale = radius; 
    const hPole = 1.5 * scale;
    const hEquator = 0.5 * scale;
    const rEquator = 1.0 * scale;

    // Pole 1 (Top)
    vertices.push(0, hPole, 0); // Index 0
    
    // Equatorial set 1 (Upper) - Theta 0, 72, 144, 216, 288
    for (let i = 0; i < 5; i++) {
        const phi = (i * 72) * (Math.PI / 180);
        vertices.push(rEquator * Math.cos(phi), hEquator, rEquator * Math.sin(phi)); // Indices 1-5
    }

    // Pole 2 (Bottom)
    vertices.push(0, -hPole, 0); // Index 6

    // Equatorial set 2 (Lower) - Theta 36, 108, 180, 252, 324
    for (let i = 0; i < 5; i++) {
        const phi = (i * 72 + 36) * (Math.PI / 180);
        vertices.push(rEquator * Math.cos(phi), -hEquator, rEquator * Math.sin(phi)); // Indices 7-11
    }

    // Faces (Indices)
    const indices: number[] = [];
    
    // Top Half (5 Kites: PoleT -> Ui -> Li -> Unext)
    for (let i = 0; i < 5; i++) {
        const uCurrent = i + 1;
        const uNext = ((i + 1) % 5) + 1;
        const lCurrent = i + 7;
        
        // Kite triangles (Wound CCW from outside)
        indices.push(0, lCurrent, uCurrent);
        indices.push(0, uNext, lCurrent);
    }

    // Bottom Half (5 Kites: PoleB -> Li -> Unext -> Lnext)
    for (let i = 0; i < 5; i++) {
        const lCurrent = i + 7;
        const lNext = ((i + 1) % 5) + 7;
        const uNext = ((i + 1) % 5) + 1;
        
        // Kite triangles (Wound CCW from outside)
        indices.push(6, uNext, lCurrent);
        indices.push(6, lNext, uNext);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

const DICE_GEOMETRIES: Record<number, THREE.BufferGeometry> = {
    4: new THREE.TetrahedronGeometry(1.2),
    6: new THREE.BoxGeometry(1.4, 1.4, 1.4),
    8: new THREE.OctahedronGeometry(1.4),
    10: createD10Geometry(1.2),
    12: new THREE.DodecahedronGeometry(1.4),
    20: new THREE.IcosahedronGeometry(1.4),
    100: new THREE.SphereGeometry(1.4, 32, 32),
};

const DICE_EDGES: Record<number, THREE.EdgesGeometry> = {
    4: new THREE.EdgesGeometry(DICE_GEOMETRIES[4]),
    6: new THREE.EdgesGeometry(DICE_GEOMETRIES[6]),
    8: new THREE.EdgesGeometry(DICE_GEOMETRIES[8]),
    10: new THREE.EdgesGeometry(DICE_GEOMETRIES[10]),
    12: new THREE.EdgesGeometry(DICE_GEOMETRIES[12]),
    20: new THREE.EdgesGeometry(DICE_GEOMETRIES[20]),
    100: new THREE.EdgesGeometry(DICE_GEOMETRIES[100]),
};

const EDGE_MATERIAL = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.4,
    linewidth: 2 // Note: webgl linewidth is limited to 1 in most browsers, but we keep it for consistency
});

const PlayerDiceBox3D: React.FC<DiceBox3DProps> = ({ active, lastRoll }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        dice: THREE.Mesh[];
        clock: THREE.Clock;
    } | null>(null);



    // ------------------------------------------------------------------
    // SCENE INITIALIZATION
    // ------------------------------------------------------------------
    useEffect(() => {
        console.log("🎲 [Dice3D] Initializing Scene...");
        if (!containerRef.current) {
            console.error("🎲 [Dice3D] No container ref!");
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 10, 15);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true,
            powerPreference: "high-performance",
            premultipliedAlpha: false
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        
        // Explicit Canvas Styling
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.pointerEvents = 'none';
        
        containerRef.current.innerHTML = ''; // Clear any existing
        containerRef.current.appendChild(renderer.domElement);

        console.log("🎲 [Dice3D] Renderer initialized and appended to DOM");

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        scene.add(hemiLight);

        const pointLight = new THREE.PointLight(0x06b6d4, 25, 100);
        pointLight.position.set(10, 15, 10);
        scene.add(pointLight);

        const spotLight = new THREE.SpotLight(0xffffff, 20);
        spotLight.position.set(-10, 20, 5);
        scene.add(spotLight);

        const clock = new THREE.Clock();
        sceneRef.current = { scene, camera, renderer, dice: [], clock };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            
            // Clean up static resources
            Object.values(DICE_GEOMETRIES).forEach(g => g.dispose());
            Object.values(DICE_EDGES).forEach(g => g.dispose());
            EDGE_MATERIAL.dispose();

            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    // ------------------------------------------------------------------
    // ANIMATION LOOP
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!sceneRef.current) return;

        let animationFrameId: number;

        const animate = () => {
            if (!sceneRef.current) return;
            const { scene, camera, renderer, dice, clock } = sceneRef.current;
            const delta = clock.getDelta();

            dice.forEach((die: any) => {
                // Simplified physics
                if (die.velocity.y > -20) {
                    die.velocity.y -= 30 * delta; // Gravity
                }

                die.position.add(die.velocity.clone().multiplyScalar(delta));

                // Bounce ground
                if (die.position.y < 0) {
                    die.position.y = 0;
                    die.velocity.y *= -0.5; // Bounce damping
                    die.angularVelocity.multiplyScalar(0.7); // Friction
                }

                // Spin
                die.rotation.x += die.angularVelocity.x * delta;
                die.rotation.y += die.angularVelocity.y * delta;
                die.rotation.z += die.angularVelocity.z * delta;

                // Stop check
                if (Math.abs(die.velocity.y) < 0.1 && die.position.y <= 0.1) {
                    // Smoothly rotate to show result face
                    const targetRotation = die.targetRotation;
                    if (targetRotation) {
                        die.rotation.x = THREE.MathUtils.lerp(die.rotation.x, targetRotation.x, 0.1);
                        die.rotation.y = THREE.MathUtils.lerp(die.rotation.y, targetRotation.y, 0.1);
                        die.rotation.z = THREE.MathUtils.lerp(die.rotation.z, targetRotation.z, 0.1);
                    }
                }
            });

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(animate);
        };

        if (active) {
            animate();
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [active]);

    // ------------------------------------------------------------------
    // SPAWN DICE ON ROLL
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!active || !lastRoll || !sceneRef.current) return;

        const { scene, dice } = sceneRef.current;
        
        // Clean previous dice
        dice.forEach(d => scene.remove(d));
        dice.length = 0;

        const rollCount = lastRoll.rolls.length;
        const spacing = 3;

        console.log("🎲 [Dice3D] Spawning dice group", lastRoll.id, "count:", rollCount);
        lastRoll.rolls.forEach((r, i) => {
            const sides = r.sides || 20;
            const geometry = DICE_GEOMETRIES[sides] || DICE_GEOMETRIES[20];
            
            // Premium Crystal Material
            const material = new THREE.MeshPhysicalMaterial({
                color: r.isCritMax ? 0x10b981 : (r.isCritMin ? 0xf43f5e : (r.source === 'gear' ? 0xfacc15 : 0x06b6d4)),
                metalness: 0.2,
                roughness: 0.05,
                transmission: 0.7,
                thickness: 1.0,
                ior: 1.45,
                emissive: r.isExploded ? 0xffffff : 0x000000,
                emissiveIntensity: r.isExploded ? 1.0 : 0.2,
                side: THREE.DoubleSide // Safety for visibility
            });

            const mesh = new THREE.Mesh(geometry, material) as any;
            
            // Initial position (higher, drop faster)
            const x = (i - (rollCount - 1) / 2) * spacing;
            mesh.position.set(x, 12 + Math.random() * 3, (Math.random() - 0.5) * 5);
            
            // Random initial velocities
            mesh.velocity = new THREE.Vector3((Math.random() - 0.5) * 8, -15 - Math.random() * 10, (Math.random() - 0.5) * 8);
            mesh.angularVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40
            );

            mesh.targetRotation = new THREE.Euler(
                Math.round(Math.random() * 4) * Math.PI / 2,
                Math.round(Math.random() * 4) * Math.PI / 2,
                Math.round(Math.random() * 4) * Math.PI / 2
            );

            scene.add(mesh);
            
            // --- ADD SHARP EDGES ---
            const edges = DICE_EDGES[sides] || DICE_EDGES[20];
            const edgeLines = new THREE.LineSegments(edges, EDGE_MATERIAL);
            mesh.add(edgeLines);
            
            dice.push(mesh);
        });

    }, [active, lastRoll?.id]); // Added 'active' to dependencies to catch transitions

    return (
        <div 
            ref={containerRef} 
            className={`fixed inset-0 z-[65] pointer-events-none transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}
        />
    );
};

export default PlayerDiceBox3D;
