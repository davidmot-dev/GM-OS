import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { type RollRecord } from '../../stores/useDiceStore';
import {
    facesDeLaGeometrie,
    geometrieAPlat,
    geometrieDuD10,
    orientationPourMontrer,
    poserLesChiffres,
    valeursDesFaces,
    type FaceDuDe,
} from './logic/facesDuDe';
import {
    couleurDuDe,
    FACES_DU_SOLIDE,
    grilleDeLAtlas,
    inscriptionAmbigue,
    inscriptionDeLaFace,
    RECETTES,
    STYLE_PAR_DEFAUT,
    TAILLE_DU_CHIFFRE,
    type StyleDeDes,
} from './logic/stylesDeDes';
import { PLAFOND_DE_CHUTE_MS } from './logic/choregraphieDuJet';
import { placementDuJet, separerLesDes } from './logic/separationDesDes';

/**
 * **Le jet de dés en 3D du Player Hub.**
 *
 * ⛔ Le 2026-09-17, David : *« lorsque je jette les dés et que je projette sur
 * Player Hub, les dés en 3D sont affreux »*. Quatre causes, dont trois ne se
 * règlent pas — elles manquaient :
 *
 * | | Ce qu'il y avait |
 * | --- | --- |
 * | **Aucun chiffre** | des solides colorés nus — *un dé sans chiffres n'est pas un dé* |
 * | **L'atterrissage tiré au sort** | `Math.round(Math.random() * 4) * Math.PI / 2` : la face du dessus n'avait aucun rapport avec le résultat |
 * | **Du verre sans rien à réfracter** | pas de carte d'environnement, fond transparent : *un matériau physique sans environnement rend du gris* |
 * | Un d100 **sphérique** | une sphère n'est pas un dé |
 *
 * ⛔ **Et un cinquième, qui vidait la scène** : le nettoyage de démontage
 * appelait `dispose()` sur les géométries **partagées au niveau du module**. Au
 * remontage suivant — un simple aller-retour de projection — elles étaient
 * mortes, et plus rien ne s'affichait. *Ce qui est partagé par tous ne se libère
 * pas par un.*
 *
 * Les calculs qui décident **quelle face porte quelle valeur** vivent dans
 * `logic/facesDuDe.ts`, où ils sont vérifiés.
 */

interface DiceBox3DProps {
    active: boolean;
    lastRoll: RollRecord | null;
    style?: StyleDeDes;
    /**
     * Appelé **une fois par jet**, quand tous les dés sont posés.
     *
     * ⚠️ Il est aussi appelé au bout de {@link PLAFOND_DE_CHUTE_MS} même si un dé
     * remue encore : *un dé qui micro-rebondit indéfiniment ne doit pas retenir
     * le résultat en otage.*
     */
    onRepos?: () => void;
}

/** Le demi-côté du tapis. Les dés y sont tenus par des murs invisibles. */
const RAYON_DU_TAPIS = 6.5;

/**
 * ⭐ **Les géométries vivent ici et ne sont JAMAIS libérées.**
 *
 * Elles sont partagées par toutes les instances du composant et construites une
 * seule fois — chiffres compris. C'est précisément ce que l'ancien nettoyage
 * détruisait au premier démontage.
 */
interface SolideDuDe {
    geometrie: THREE.BufferGeometry;
    faces: FaceDuDe[];
    valeurs: number[];
    /** Hauteur du centre quand le dé repose sur une face. */
    rayonInterieur: number;
    /**
     * Le rayon de la sphère qui empêche ce dé d'en croiser un autre.
     *
     * ⭐ **La moyenne des rayons inscrit et circonscrit**, et elle se calcule par
     * solide : 79 % du rayon circonscrit sur un cube, 90 % sur un icosaèdre.
     * *Une constante unique aurait été fausse pour cinq dés sur six.* Voir
     * `logic/separationDesDes`.
     */
    rayonDeCollision: number;
}

const SOLIDES = new Map<number, SolideDuDe>();

const construireLeSolide = (sides: number): SolideDuDe => {
    const nbFaces = FACES_DU_SOLIDE[sides] ?? 20;
    const brut =
        nbFaces === 4 ? new THREE.TetrahedronGeometry(1.25) :
        nbFaces === 6 ? new THREE.BoxGeometry(1.5, 1.5, 1.5) :
        nbFaces === 8 ? new THREE.OctahedronGeometry(1.45) :
        nbFaces === 10 ? geometrieDuD10(1.25) :
        nbFaces === 12 ? new THREE.DodecahedronGeometry(1.35) :
        new THREE.IcosahedronGeometry(1.4);

    const geometrie = geometrieAPlat(brut);
    const faces = facesDeLaGeometrie(geometrie);
    const valeurs = valeursDesFaces(faces);
    const { colonnes, lignes } = grilleDeLAtlas(nbFaces);
    poserLesChiffres(geometrie, faces, valeurs, colonnes, lignes);
    geometrie.computeVertexNormals();

    const rayonInterieur = Math.min(...faces.map(f => Math.abs(f.centre.dot(f.normale))));

    const position = geometrie.getAttribute('position');
    let rayonExterieur = 0;
    const sommet = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
        rayonExterieur = Math.max(rayonExterieur, sommet.fromBufferAttribute(position, i).length());
    }

    return {
        geometrie, faces, valeurs, rayonInterieur,
        rayonDeCollision: (rayonInterieur + rayonExterieur) / 2,
    };
};

const solideDuDe = (sides: number): SolideDuDe => {
    const cle = FACES_DU_SOLIDE[sides] ? sides : 20;
    let solide = SOLIDES.get(cle);
    if (!solide) {
        solide = construireLeSolide(cle);
        SOLIDES.set(cle, solide);
    }
    return solide;
};

/**
 * Peint l'atlas des chiffres d'un dé.
 *
 * ⚠️ **La couleur du dé est peinte DANS la texture**, et le matériau reste blanc.
 * Autrement il faudrait multiplier la texture par la couleur — et un chiffre
 * clair multiplié par un dé coloré cesse d'être clair. *Le contraste du chiffre
 * doit survivre à la couleur du dé, parce que cette couleur porte une
 * information* (critique, équipement).
 */
const peindreLAtlas = (sides: number, couleur: number, style: StyleDeDes): THREE.CanvasTexture => {
    const nbFaces = FACES_DU_SOLIDE[sides] ?? 20;
    const { colonnes, lignes } = grilleDeLAtlas(nbFaces);
    const recette = RECETTES[style];

    const cote = 512;
    const toile = document.createElement('canvas');
    toile.width = cote;
    toile.height = cote;
    const ctx = toile.getContext('2d')!;

    ctx.fillStyle = `#${couleur.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, cote, cote);

    const largeur = cote / colonnes;
    const hauteur = cote / lignes;
    const corps = Math.min(largeur, hauteur) * (TAILLE_DU_CHIFFRE[sides] ?? 0.3);

    ctx.fillStyle = recette.chiffres;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${corps}px "Segoe UI", system-ui, sans-serif`;

    for (let v = 1; v <= nbFaces; v++) {
        const colonne = (v - 1) % colonnes;
        const ligne = Math.floor((v - 1) / colonnes);
        const cx = (colonne + 0.5) * largeur;
        const cy = (ligne + 0.5) * hauteur;
        const texte = inscriptionDeLaFace(sides, v);

        ctx.fillText(texte, cx, cy);
        /* *Un 6 et un 9 posés sur une table sont le même dessin.* */
        if (inscriptionAmbigue(texte)) {
            const l = ctx.measureText(texte).width * 0.7;
            ctx.fillRect(cx - l / 2, cy + corps * 0.42, l, Math.max(2, corps * 0.07));
        }
    }

    const texture = new THREE.CanvasTexture(toile);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
};

/** Un dé en vol : le maillage, plus ce qu'il faut pour le faire tomber. */
interface DeEnVol extends THREE.Mesh {
    vitesse: THREE.Vector3;
    rotationVive: THREE.Vector3;
    cible: THREE.Quaternion;
    repos: number;
    pose: boolean;
    rayonDeCollision: number;
}

const PlayerDiceBox3D: React.FC<DiceBox3DProps> = ({ active, lastRoll, style = STYLE_PAR_DEFAUT, onRepos }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        des: DeEnVol[];
        horloge: THREE.Clock;
        aLiberer: { dispose: () => void }[];
    } | null>(null);
    const styleRef = useRef(style);
    styleRef.current = style;
    /* La référence évite de relancer la boucle d'animation à chaque rendu du hub. */
    const onReposRef = useRef(onRepos);
    onReposRef.current = onRepos;
    /** Le signal de pose n'est envoyé qu'une fois par jet. */
    const reposAnnonceRef = useRef(false);
    const departDuJetRef = useRef(0);

    // ------------------------------------------------------------------
    // LA SCÈNE
    // ------------------------------------------------------------------
    useEffect(() => {
        const contenant = containerRef.current;
        if (!contenant) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
        camera.position.set(0, 12.5, 13.5);
        camera.lookAt(0, 0.5, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        const toile = renderer.domElement;
        toile.style.position = 'absolute';
        toile.style.inset = '0';
        toile.style.width = '100%';
        toile.style.height = '100%';
        toile.style.pointerEvents = 'none';
        contenant.appendChild(toile);

        /*
          ⭐ **L'environnement, sans quoi rien de tout ceci n'a de sens.**

          `RoomEnvironment` est une petite pièce éclairée dont `PMREMGenerator`
          tire une carte d'irradiance. C'est elle que le poli des dés réfléchit et
          que le verre réfracte. *Sans elle, `roughness: 0.05` ne produit qu'un
          gris uniforme — ce qui était exactement le rendu d'avant.*
        */
        const pmrem = new THREE.PMREMGenerator(renderer);
        const environnement = pmrem.fromScene(new RoomEnvironment(), 0.04);
        scene.environment = environnement.texture;
        pmrem.dispose();

        /* Une ambiante basse : le relief d'un dé vient de l'écart entre ses
           faces, et une ambiante forte l'efface. */
        scene.add(new THREE.AmbientLight(0xffffff, 0.25));

        const cle = new THREE.DirectionalLight(0xffffff, 2.4);
        cle.position.set(6, 14, 8);
        cle.castShadow = true;
        cle.shadow.mapSize.set(1024, 1024);
        cle.shadow.camera.near = 1;
        cle.shadow.camera.far = 40;
        cle.shadow.camera.left = -12;
        cle.shadow.camera.right = 12;
        cle.shadow.camera.top = 12;
        cle.shadow.camera.bottom = -12;
        cle.shadow.bias = -0.0015;
        scene.add(cle);

        const contre = new THREE.DirectionalLight(0x9ad8ff, 0.7);
        contre.position.set(-8, 5, -9);
        scene.add(contre);

        /*
          Le sol ne se voit pas — il ne reçoit que l'ombre. *Sans contact au sol,
          des dés « posés » flottent dans le vide,* et c'est une bonne part de ce
          qui rendait la scène irréelle.
        */
        const matiereDuSol = new THREE.ShadowMaterial({ opacity: 0.38 });
        const sol = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), matiereDuSol);
        sol.rotation.x = -Math.PI / 2;
        sol.receiveShadow = true;
        scene.add(sol);

        const horloge = new THREE.Clock();
        sceneRef.current = {
            scene, camera, renderer, des: [], horloge,
            aLiberer: [environnement.texture, matiereDuSol, sol.geometry],
        };

        /*
          ⚠️ **On mesure le contenant, pas la fenêtre.** L'ancien rendu prenait
          `window.innerWidth/innerHeight` alors que la toile est étirée à 100 % de
          son parent : dès que les deux diffèrent, l'image est étirée et les dés
          deviennent des œufs.
        */
        const redimensionner = () => {
            const l = contenant.clientWidth || 1;
            const h = contenant.clientHeight || 1;
            camera.aspect = l / h;
            camera.updateProjectionMatrix();
            renderer.setSize(l, h, false);
        };
        redimensionner();
        const observateur = new ResizeObserver(redimensionner);
        observateur.observe(contenant);

        return () => {
            observateur.disconnect();
            const courant = sceneRef.current;
            sceneRef.current = null;
            if (!courant) return;

            /*
              ⛔ **On ne libère QUE ce que cette instance a créé.** Les géométries
              des dés sont partagées au niveau du module : l'ancien nettoyage les
              détruisait, et le remontage suivant n'affichait plus rien.
            */
            courant.des.forEach(de => {
                const matiere = de.material as THREE.MeshPhysicalMaterial;
                matiere.map?.dispose();
                matiere.dispose();
            });
            courant.aLiberer.forEach(o => o.dispose());
            courant.renderer.dispose();
            toile.remove();
        };
    }, []);

    // ------------------------------------------------------------------
    // LA CHUTE
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!active) return;
        let image = 0;

        const animer = () => {
            image = requestAnimationFrame(animer);
            const courant = sceneRef.current;
            if (!courant) return;
            const { scene, camera, renderer, des, horloge } = courant;
            const dt = Math.min(horloge.getDelta(), 1 / 30);

            des.forEach(de => {
                if (de.pose) {
                    /* Posé : on finit d'amener la bonne face vers le ciel. */
                    de.quaternion.slerp(de.cible, 1 - Math.pow(0.001, dt));
                    de.position.y += (de.repos - de.position.y) * (1 - Math.pow(0.001, dt));
                    return;
                }

                de.vitesse.y -= 38 * dt;
                de.position.addScaledVector(de.vitesse, dt);

                /* Les murs : *un dé qui sort du cadre est un dé qu'on n'a pas vu
                   tomber.* Ils rendent aussi la chute plus vivante. */
                (['x', 'z'] as const).forEach(axe => {
                    if (Math.abs(de.position[axe]) > RAYON_DU_TAPIS) {
                        de.position[axe] = Math.sign(de.position[axe]) * RAYON_DU_TAPIS;
                        de.vitesse[axe] *= -0.55;
                        de.rotationVive.multiplyScalar(0.85);
                    }
                });

                if (de.position.y < de.repos) {
                    de.position.y = de.repos;
                    de.vitesse.y *= -0.38;
                    de.vitesse.x *= 0.72;
                    de.vitesse.z *= 0.72;
                    de.rotationVive.multiplyScalar(0.62);
                }

                de.rotateX(de.rotationVive.x * dt);
                de.rotateY(de.rotationVive.y * dt);
                de.rotateZ(de.rotationVive.z * dt);

                const calme = de.vitesse.length() < 1.2 && de.rotationVive.length() < 2.2;
                if (calme && de.position.y <= de.repos + 0.05) {
                    de.pose = true;
                    de.vitesse.set(0, 0, 0);
                    de.rotationVive.set(0, 0, 0);
                }
            });

            /*
              ⛔ **Les dés ne se voyaient pas entre eux.** La chute ne connaissait
              que le sol et les murs : deux dés lancés au même endroit se
              traversaient et finissaient posés l'un DANS l'autre — *la seule
              chose qu'un vrai dé ne fait jamais* (David, 2026-09-17).

              ⚠️ **La séparation s'applique aussi aux dés posés**, et c'est le
              point : un dé qui se pose contre un autre déjà immobile doit encore
              être repoussé. La limiter aux dés en vol laisserait précisément
              l'imbrication finale, celle qu'on voit.
            */
            if (des.length > 1) {
                separerLesDes(des);
                des.forEach(de => {
                    /* La séparation peut pousser un dé sous le sol ou hors du
                       tapis : on le ramène tout de suite. */
                    de.position.y = Math.max(de.position.y, de.repos);
                    de.position.x = THREE.MathUtils.clamp(de.position.x, -RAYON_DU_TAPIS, RAYON_DU_TAPIS);
                    de.position.z = THREE.MathUtils.clamp(de.position.z, -RAYON_DU_TAPIS, RAYON_DU_TAPIS);
                });
            }

            /*
              ⭐ **La pose est un événement, pas une durée.** Combien de temps met
              un jet à se poser ? *Ça dépend* — du nombre de dés, des rebonds, du
              hasard des vitesses. Une durée fixe couperait les dés en plein vol
              ou les laisserait posés à ne rien faire.

              ⛔ **Avec son échéance quand même** : passé le plafond, on déclare la
              pose même si un dé remue encore. *Un signal qu'on attend sans filet,
              c'est un écran figé le jour où il ne vient pas.*
            */
            if (!reposAnnonceRef.current && des.length > 0) {
                const tropLong = performance.now() - departDuJetRef.current > PLAFOND_DE_CHUTE_MS;
                if (tropLong || des.every(de => de.pose)) {
                    reposAnnonceRef.current = true;
                    onReposRef.current?.();
                }
            }

            renderer.render(scene, camera);
        };

        animer();
        return () => cancelAnimationFrame(image);
    }, [active]);

    // ------------------------------------------------------------------
    // LE JET
    // ------------------------------------------------------------------
    useEffect(() => {
        const courant = sceneRef.current;
        if (!active || !lastRoll || !courant) return;

        const { scene, des } = courant;
        des.forEach(de => {
            scene.remove(de);
            const matiere = de.material as THREE.MeshPhysicalMaterial;
            matiere.map?.dispose();
            matiere.dispose();
        });
        des.length = 0;

        reposAnnonceRef.current = false;
        departDuJetRef.current = performance.now();

        const recette = RECETTES[styleRef.current] ?? RECETTES[STYLE_PAR_DEFAUT];
        const nombre = lastRoll.rolls.length;

        /*
          ⛔ **L'ancien écart RÉTRÉCISSAIT quand les dés étaient nombreux** :
          `Math.min(3, 13 / n)`. À dix dés il tombait à 1,3 — *moins que la
          largeur d'un dé.* Ils naissaient donc imbriqués, et la séparation avait
          à défaire un nœud au lieu d'éviter un contact.

          ⭐ ***Ce qu'on empêche pendant la chute, il faut d'abord ne pas le créer
          au départ.*** L'écart est maintenant un plancher : quand la rangée
          déborde du tapis, on passe à la rangée suivante.
        */
        const rayonMax = Math.max(...lastRoll.rolls.map(r => solideDuDe(r.sides || 20).rayonDeCollision));
        const places = placementDuJet(nombre, rayonMax * 2.3, RAYON_DU_TAPIS);

        lastRoll.rolls.forEach((r, i) => {
            const sides = r.sides || 20;
            const solide = solideDuDe(sides);
            const nbFaces = FACES_DU_SOLIDE[sides] ?? 20;

            const texture = peindreLAtlas(sides, couleurDuDe(r), styleRef.current);
            const matiere = new THREE.MeshPhysicalMaterial({
                map: texture,
                metalness: recette.metalness,
                roughness: recette.roughness,
                transmission: recette.transmission,
                thickness: recette.thickness,
                ior: recette.ior,
                clearcoat: recette.clearcoat,
                clearcoatRoughness: recette.clearcoatRoughness,
                envMapIntensity: recette.envMapIntensity,
                flatShading: true,
                /*
                  ⚠️ **L'atténuation ne vaut que pour le verre.** C'est elle qui
                  teinte ce qui traverse le volume : sans elle, `transmission`
                  lave la couleur du dé et les critiques deviennent des glaçons
                  — *or cette couleur porte une information, pas une décoration.*
                */
                ...(recette.attenue ? {
                    attenuationColor: new THREE.Color(couleurDuDe(r)),
                    attenuationDistance: 1.6,
                } : {}),
            });

            const de = new THREE.Mesh(solide.geometrie, matiere) as unknown as DeEnVol;
            de.castShadow = true;
            de.repos = solide.rayonInterieur;

            de.rayonDeCollision = solide.rayonDeCollision;
            /* Les hauteurs sont décalées : *dix dés lâchés au même instant
               atterrissent en bloc, et ça ne ressemble à rien.* */
            de.position.set(places[i].x, 10 + i * 1.1 + Math.random() * 2, places[i].z);
            de.quaternion.setFromEuler(new THREE.Euler(
                Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2,
            ));
            de.vitesse = new THREE.Vector3((Math.random() - 0.5) * 4, -9 - Math.random() * 5, (Math.random() - 0.5) * 4);
            de.rotationVive = new THREE.Vector3(
                (Math.random() - 0.5) * 26, (Math.random() - 0.5) * 26, (Math.random() - 0.5) * 26,
            );

            /*
              ⭐ **L'orientation finale n'est plus tirée au sort : elle montre le
              résultat.** On prend la face qui porte la valeur du dé et on l'amène
              vers le ciel.

              ⚠️ **`val` n'est pas toujours un nombre** : les dés Fate rendent
              un symbole, et d'autres systèmes une chaîne d'affichage. Un dé dont
              la valeur n'est pas lisible sur ce solide se pose sur une face au
              hasard plutôt que de figer le dé sur rien — *un dé qui ne sait pas
              quoi montrer doit quand même finir sa chute.*
            */
            const brut = typeof r.val === 'number' ? r.val : Number(r.val);
            /* Le d100 compte par dizaines : 70 se lit sur la face « 7 », et 00 sur la dixième. */
            const valeurLue = sides === 100
                ? (Number.isFinite(brut) ? (Math.round(brut / 10) || 10) : Number.NaN)
                : brut;
            const lisible = Number.isFinite(valeurLue) && valeurLue >= 1 && valeurLue <= nbFaces;
            const iFace = solide.valeurs.indexOf(
                lisible ? valeurLue : 1 + Math.floor(Math.random() * nbFaces),
            );
            de.cible = orientationPourMontrer(solide.faces[iFace].normale, Math.random() * Math.PI * 2);
            de.pose = false;

            scene.add(de);
            des.push(de);
        });
    }, [active, lastRoll?.id, style]);

    return (
        <div
            ref={containerRef}
            className={`fixed inset-0 z-[80] pointer-events-none transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}
        />
    );
};

export default PlayerDiceBox3D;
