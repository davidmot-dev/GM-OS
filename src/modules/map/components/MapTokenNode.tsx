import React, { useState, useRef } from 'react';
import { useMapStore, type MapToken } from '../useMapStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { Shield } from 'lucide-react';

interface MapTokenNodeProps {
    token: MapToken;
}

const MapTokenNode: React.FC<MapTokenNodeProps> = ({ token }) => {
    const { currentTool, updateToken } = useMapStore();
    const { combatants, currentTurnIdx } = useCombatStore();

    // On lie le token à son combattant s'il existe
    const combatant = combatants.find(c => c.id === token.linkedCombatantId);
    const isCurrentTurn = combatants[currentTurnIdx]?.id === token.linkedCombatantId;

    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ x: number; y: number } | null>(null);

    const isInteractable = currentTool === 'move_token';

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isInteractable) return;
        // Empêche la propagation au canvas de Fog of War en-dessous
        e.stopPropagation();
        e.preventDefault();

        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        // On enregistre le décalage entre le clic de la souris et le centre du token
        dragRef.current = {
            x: e.clientX - token.x,
            y: e.clientY - token.y
        };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !dragRef.current) return;
        e.stopPropagation();
        e.preventDefault();

        const newX = e.clientX - dragRef.current.x;
        const newY = e.clientY - dragRef.current.y;

        updateToken(token.id, { x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.stopPropagation();
        e.preventDefault();

        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        dragRef.current = null;
    };

    // Calcul de l'aura de santé (similaire à CombatCard)
    let ringColor = 'ring-gray-600';
    if (combatant) {
        if (combatant.hp <= 0) ringColor = 'ring-gray-500 opacity-50 grayscale';
        else if (combatant.hp <= combatant.hpMax * 0.25) ringColor = 'ring-red-500';
        else if (combatant.hp <= combatant.hpMax * 0.5) ringColor = 'ring-yellow-400';
        else ringColor = 'ring-green-400';
    }

    // Modificateur pour le tour actif
    if (isCurrentTurn) {
        ringColor = 'ring-gm-cyan shadow-glow-cyan animate-pulse';
    }

    return (
        <div
            className={`absolute rounded-full shadow-lg border-2 border-obsidian bg-obsidian-dark flex items-center justify-center transition-shadow group ${isInteractable ? 'cursor-grab hover:ring-4 hover:z-40 active:cursor-grabbing' : 'pointer-events-none'
                } ring-2 ${ringColor} ${isDragging ? 'z-50 ring-4' : 'z-30'}`}
            style={{
                left: token.x,
                top: token.y,
                width: 48 * token.size,
                height: 48 * token.size,
                transform: 'translate(-50%, -50%)',
                pointerEvents: isInteractable ? 'auto' : 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Avatar image */}
            {token.avatar ? (
                <img src={token.avatar} alt="avatar" className="w-full h-full object-cover rounded-full pointer-events-none" />
            ) : (
                <Shield size={24 * token.size} className={combatant?.isPlayer ? 'text-gm-violet' : 'text-gm-crimson'} />
            )}

            {/* Status indicators */}
            {combatant && combatant.statuses.length > 0 && (
                <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-obsidian border border-gray-700 rounded-full px-1.5 py-0.5 flex gap-0.5 pointer-events-none shadow-xl z-20">
                    {combatant.statuses.slice(0, 3).map(s => (
                        <span key={s.id} className="text-[12px] leading-none drop-shadow-md">{s.icon}</span>
                    ))}
                    {combatant.statuses.length > 3 && <span className="text-[10px] text-gray-400 font-bold ml-0.5">+{combatant.statuses.length - 3}</span>}
                </div>
            )}

            {/* Hover Tooltip (Name + HP) */}
            <div className="absolute -bottom-8 whitespace-nowrap bg-obsidian/90 backdrop-blur-sm border border-gray-700 text-xs px-2 py-1 rounded opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-50 text-slate-200 shadow-xl font-bold">
                {combatant ? `${combatant.name} (${combatant.hp}/${combatant.hpMax})` : 'Token'}
            </div>
        </div>
    );
};

export default MapTokenNode;
