import React, { useRef, useEffect } from 'react';
import { useMapStore } from '../useMapStore';
import type { MagicEffect } from '../types';

interface MagicLayerProps {
    isProjectedView?: boolean;
}

const MagicLayer: React.FC<MagicLayerProps> = ({ isProjectedView = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const effects = useMapStore(state => isProjectedView ? state.projectedMagicEffects : state.magicEffects);
    const mapWidth = useMapStore(state => isProjectedView ? state.projectedMapWidth : state.mapWidth);
    const mapHeight = useMapStore(state => isProjectedView ? state.projectedMapHeight : state.mapHeight);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = mapWidth || 1920;
        canvas.height = mapHeight || 1080;
    }, [mapWidth, mapHeight, effects?.length]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !effects || effects.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const currentWidth = canvas.width;
        const currentHeight = canvas.height;

        const render = (time: number) => {
            ctx.clearRect(0, 0, currentWidth, currentHeight);

            effects.forEach(effect => {
                ctx.save();
                ctx.translate(effect.x, effect.y);
                ctx.rotate((effect.rotation * Math.PI) / 180);
                ctx.globalAlpha = effect.opacity ?? 1;

                drawEffect(ctx, effect, time);

                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        const drawEffect = (ctx: CanvasRenderingContext2D, effect: MagicEffect, time: number) => {
            const t = time / 1000;

            // Define the shape path
            ctx.beginPath();
            if (effect.type === 'circle') {
                ctx.arc(0, 0, effect.width, 0, Math.PI * 2);
            } else if (effect.type === 'rect') {
                ctx.rect(-effect.width/2, -effect.height/2, effect.width, effect.height);
            } else if (effect.type === 'cone') {
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, effect.width, -Math.PI/6, Math.PI/6);
                ctx.lineTo(0, 0);
                ctx.closePath();
            } else if (effect.type === 'line') {
                ctx.rect(0, -20, effect.width, 40);
            }

            // Clip to shape for certain styles or just use as path
            ctx.save();
            if (effect.type !== 'line') ctx.clip();

            switch (effect.style) {
                case 'fire': drawFire(ctx, effect, t); break;
                case 'ice': drawIce(ctx, effect); break;
                case 'acid': drawAcid(ctx, effect, t); break;
                case 'electric': drawElectric(ctx, effect); break;
                case 'arcane': drawArcane(ctx, effect, t); break;
                case 'darkness': drawDarkness(ctx, effect, t); break;
                case 'poison': drawPoison(ctx, effect, t); break;
            }
            
            ctx.restore();

            // Optional: Draw outline
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        };

        const drawFire = (ctx: CanvasRenderingContext2D, effect: MagicEffect, t: number) => {
            const pulse = 1 + Math.sin(t * 5) * 0.05;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, effect.width * pulse);
            grad.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
            grad.addColorStop(0.4, 'rgba(255, 80, 0, 0.6)');
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fill();

            // Bits of "flame"
            for(let i=0; i<10; i++) {
                const angle = (t + i) * 2;
                const dist = (Math.sin(t * 3 + i) * 0.5 + 0.5) * effect.width;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 5, 0, Math.PI*2);
                ctx.fillStyle = 'rgba(255, 150, 0, 0.4)';
                ctx.fill();
            }
        };

        const drawIce = (ctx: CanvasRenderingContext2D, effect: MagicEffect) => {
            ctx.fillStyle = 'rgba(200, 240, 255, 0.3)';
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(150, 220, 255, 0.5)';
            ctx.lineWidth = 2;
            
            // Draw internal "shards"
            ctx.beginPath();
            for(let i=0; i<8; i++) {
                const x = (Math.sin(i * 1.5) * effect.width * 0.6);
                const y = (Math.cos(i * 1.5) * effect.width * 0.6);
                ctx.moveTo(x - 10, y);
                ctx.lineTo(x + 10, y);
                ctx.moveTo(x, y - 10);
                ctx.lineTo(x, y + 10);
            }
            ctx.stroke();
        };

        const drawAcid = (ctx: CanvasRenderingContext2D, effect: MagicEffect, t: number) => {
            ctx.fillStyle = 'rgba(120, 255, 50, 0.3)';
            ctx.fill();
            
            // Bubbles
            for(let i=0; i<8; i++) {
                const bt = (t + i * 0.7) % 2;
                const bx = (Math.sin(i * 1.1 + t) * effect.width * 0.7);
                const by = (Math.cos(i * 1.3 + t) * effect.width * 0.7);
                ctx.beginPath();
                ctx.arc(bx, by, 2 + bt * 8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(150, 255, 100, ${(2-bt)/4})`;
                ctx.fill();
            }
        };

        const drawElectric = (ctx: CanvasRenderingContext2D, effect: MagicEffect) => {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(0, 150, 255, 1)';

            const startX = (effect.type === 'line' || effect.type === 'cone') ? 0 : -effect.width/2;
            
            // Arcs
            for(let a=0; a<3; a++) {
                ctx.beginPath();
                ctx.moveTo(startX, 0);
                let curX = startX;
                const segments = 8;
                for(let i=1; i<=segments; i++) {
                    curX += effect.width/segments;
                    ctx.lineTo(curX, (Math.random() - 0.5) * 40);
                }
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        };


        const drawArcane = (ctx: CanvasRenderingContext2D, effect: MagicEffect, t: number) => {
            const rot = t * 0.5;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, effect.width);
            grad.addColorStop(0, 'rgba(180, 50, 255, 0.6)');
            grad.addColorStop(0.7, 'rgba(100, 0, 255, 0.3)');
            grad.addColorStop(1, 'rgba(50, 0, 150, 0)');
            ctx.fillStyle = grad;
            ctx.fill();

            // Runes/Circles
            ctx.strokeStyle = 'rgba(200, 100, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, effect.width * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.save();
            ctx.rotate(rot);
            ctx.strokeRect(-effect.width*0.5, -effect.width*0.5, effect.width, effect.width);
            ctx.restore();
        };

        const drawDarkness = (ctx: CanvasRenderingContext2D, effect: MagicEffect, t: number) => {
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, effect.width);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
            grad.addColorStop(0.8, 'rgba(20, 10, 30, 0.8)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fill();

            // Tentacles/Swirls
            ctx.strokeStyle = 'rgba(50, 0, 80, 0.3)';
            ctx.lineWidth = 4;
            for(let i=0; i<6; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, effect.width * 0.5, i * 1, i * 1 + Math.sin(t + i));
                ctx.stroke();
            }
        };

        const drawPoison = (ctx: CanvasRenderingContext2D, effect: MagicEffect, t: number) => {
            ctx.fillStyle = 'rgba(150, 50, 150, 0.4)';
            ctx.fill();
            
            // Particles
            for(let i=0; i<12; i++) {
                const x = Math.sin(t*2 + i) * effect.width * 0.8;
                const y = Math.cos(t*1.5 + i) * effect.width * 0.8;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(100, 255, 0, 0.3)';
                ctx.fill();
            }
        };

        animationFrameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameId);
    }, [effects, mapWidth, mapHeight]);


    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-[17]"
            style={{ mixBlendMode: 'normal' }}
        />
    );
};

export default MagicLayer;
