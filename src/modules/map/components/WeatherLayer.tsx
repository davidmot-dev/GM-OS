import React, { useRef, useEffect } from 'react';
import { useMapStore } from '../useMapStore';
import type { WeatherType } from '../types';

interface WeatherLayerProps {
    isProjectedView?: boolean;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    opacity: number;
}

const WeatherLayer: React.FC<WeatherLayerProps> = ({ isProjectedView = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    
    const weatherType = useMapStore(state => isProjectedView ? state.projectedWeatherType : state.weatherType);
    const weatherIntensity = useMapStore(state => isProjectedView ? state.projectedWeatherIntensity : state.weatherIntensity);
    const mapWidth = useMapStore(state => isProjectedView ? state.projectedMapWidth : state.mapWidth);
    const mapHeight = useMapStore(state => isProjectedView ? state.projectedMapHeight : state.mapHeight);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = mapWidth;
        canvas.height = mapHeight;
        
        // Reset particles on type change
        particles.current = [];
    }, [mapWidth, mapHeight, weatherType]);

    useEffect(() => {
        if (weatherType === 'none') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const createParticle = (type: WeatherType): Particle => {
            switch (type) {
                case 'rain':
                    return {
                        x: Math.random() * mapWidth,
                        y: Math.random() * mapHeight - mapHeight,
                        vx: (Math.random() - 0.5) * 2,
                        vy: 15 + Math.random() * 10,
                        size: 1 + Math.random() * 2,
                        life: 1,
                        opacity: 0.3 + Math.random() * 0.4
                    };
                case 'snow':
                    return {
                        x: Math.random() * mapWidth,
                        y: Math.random() * mapHeight - mapHeight,
                        vx: (Math.random() - 0.5) * 2,
                        vy: 2 + Math.random() * 3,
                        size: 2 + Math.random() * 4,
                        life: 1,
                        opacity: 0.5 + Math.random() * 0.5
                    };
                case 'smoke':
                    return {
                        x: Math.random() * mapWidth,
                        y: mapHeight + 50,
                        vx: (Math.random() - 0.5) * 1,
                        vy: -(1 + Math.random() * 2),
                        size: 20 + Math.random() * 40,
                        life: 0.5 + Math.random() * 0.5,
                        opacity: 0.1 + Math.random() * 0.2
                    };
                default:
                    return { x: 0, y: 0, vx: 0, vy: 0, size: 0, life: 0, opacity: 0 };
            }
        };

        const updateAndDraw = () => {
            ctx.clearRect(0, 0, mapWidth, mapHeight);

            // Add new particles based on intensity
            const particleCount = weatherType === 'smoke' ? 2 : Math.floor(20 * weatherIntensity);
            for (let i = 0; i < particleCount; i++) {
                if (particles.current.length < 1000) {
                    particles.current.push(createParticle(weatherType));
                }
            }

            // Update and draw
            particles.current = particles.current.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                
                if (weatherType === 'smoke') {
                    p.life -= 0.002;
                    p.size += 0.2;
                    ctx.fillStyle = `rgba(150, 150, 150, ${p.opacity * p.life})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (weatherType === 'rain') {
                    ctx.strokeStyle = `rgba(174, 194, 224, ${p.opacity})`;
                    ctx.lineWidth = p.size;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.vx, p.y + 10);
                    ctx.stroke();
                } else if (weatherType === 'snow') {
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Bounds check
                if (weatherType === 'smoke') return p.life > 0;
                return p.y < mapHeight && p.x >= 0 && p.x <= mapWidth;
            });

            animationFrameId = requestAnimationFrame(updateAndDraw);
        };

        animationFrameId = requestAnimationFrame(updateAndDraw);
        return () => cancelAnimationFrame(animationFrameId);
    }, [weatherType, weatherIntensity, mapWidth, mapHeight]);

    if (weatherType === 'none') return null;

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-25"
            style={{ mixBlendMode: weatherType === 'smoke' ? 'screen' : 'normal' }}
        />
    );
};

export default WeatherLayer;
