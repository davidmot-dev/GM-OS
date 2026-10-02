import React, { useState } from 'react';
import { useMapStore } from '../useMapStore';
import { useMapUIStore } from '../useMapUIStore';
import type { MapToken } from '../types';
import { useCombatStore, type StatusEffect } from '../../combat/useCombatStore';
import { fractionDeVie, estHorsDeCombat } from '../../combat/logic/SanteDuCombattant';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { Shield, Trash2, Eye, EyeOff, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { crossWindowSync } from '../../../services/CrossWindowEventService';
import { useTokenLock } from '../hooks/useTokenLock';

interface MapTokenNodeProps {
    token: MapToken;
    isProjectedView?: boolean;
    localZoom?: number;
}

const MapTokenNode: React.FC<MapTokenNodeProps> = ({ token, isProjectedView = false, localZoom }) => {
    const { t } = useTranslation(['modules', 'common']);
    const { 
        updateToken, updateProjectedToken, removeToken, zoom: gmZoom 
    } = useMapStore();
    const {
        currentTool, setIsDraggingToken, selectedTokenId, setSelectedTokenId
    } = useMapUIStore();
    const { combatants, currentTurnIdx } = useCombatStore();

    // On lie le token à son combattant s'il existe
    const combatant = combatants.find(c => c.id === token.linkedCombatantId);
    const isCurrentTurn = !!token.linkedCombatantId && combatants[currentTurnIdx]?.id === token.linkedCombatantId;
    const isVisible = token.isVisible !== false;
    const isActuallyInvisibleInCombat = combatant?.statuses.some(s => {
        const n = s.name.toLowerCase();
        return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
    });
    const displayInvisible = !isVisible || isActuallyInvisibleInCombat;
    
    const avatarToUse = token.avatar || combatant?.avatar;
    const resolvedAvatar = useMediaUrl(avatarToUse || undefined);
    const isSelected = selectedTokenId === token.id;

    const [isDragging, setIsDragging] = useState(false);

    const isLockedByOther = useTokenLock(token.id);
    const isInteractable = (isProjectedView || currentTool === 'move_token') && !isLockedByOther;

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isInteractable || e.button !== 0) return;
        
        // Try to take control
        if (!crossWindowSync.requestLock(token.id)) return;

        // Empêche la propagation au canvas de Fog of War en-dessous SEULEMENT si on veut bouger le pion
        e.stopPropagation();
        
        // Important pour capturer le pointeur même si on sort du pion
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        setIsDragging(true);
        setIsDraggingToken(true);
        
        // Gérer la sélection pour le Cerveau Tactique
        setSelectedTokenId(token.id);
    };


    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.stopPropagation();

        // On utilise movementX/Y qui est relatif et indépendant de l'origine
        // On divise par le zoom approprié (local si projeté, sinon GM)
        const effectiveZoom = isProjectedView ? (localZoom || 1) : gmZoom;
        const dx = e.movementX / effectiveZoom;
        const dy = e.movementY / effectiveZoom;

        const moveFn = isProjectedView ? updateProjectedToken : updateToken;
        const newPos = { 
            x: token.x + dx, 
            y: token.y + dy 
        };
        
        moveFn(token.id, newPos);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.stopPropagation();

        crossWindowSync.releaseLock(token.id);

        setIsDragging(false);
        setIsDraggingToken(false);
        const target = e.currentTarget as HTMLElement;
        target.releasePointerCapture(e.pointerId);
    };

    // Calcul de l'aura de santé (similaire à CombatCard).
    // Sans jauge, le jeton garde son anneau neutre : une couleur de santé
    // impliquerait une santé mesurée, et il n'y en a pas.
    let ringColor = 'ring-app-border';
    if (combatant) {
        const part = fractionDeVie(combatant);
        if (estHorsDeCombat(combatant)) ringColor = 'ring-app-border opacity-50 grayscale';
        else if (part === null) ringColor = 'ring-app-border';
        else if (part <= 0.25) ringColor = 'ring-etat-danger';
        else if (part <= 0.5) ringColor = 'ring-etat-alerte';
        else ringColor = 'ring-etat-succes';
    }

    // Modificateur pour le tour actif
    if (isCurrentTurn) {
        ringColor = 'ring-accent shadow-glow-accent animate-pulse';
    }

    return (
        <div
            className={`absolute rounded-full shadow-lg border-2 border-app-bg bg-app-surface flex items-center justify-center transition-all group ${isInteractable ? 'cursor-grab hover:ring-4 hover:z-40 active:cursor-grabbing' : 'cursor-default'
                } ring-2 ${ringColor} ${isDragging ? 'z-50 ring-4' : 'z-30'} ${isSelected ? 'ring-etat-info shadow-[0_0_20px_rgba(14,165,233,0.5)] z-40' : ''} ${displayInvisible ? (isProjectedView ? 'hidden' : 'opacity-40 grayscale-[0.5]') : ''} ${isLockedByOther ? 'opacity-70 saturate-50' : ''}`}
            style={{
                left: token.x,
                top: token.y,
                width: 48 * token.size,
                height: 48 * token.size,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto',
                touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
                // La suppression par clic droit doit TOUJOURS fonctionner pour le MJ
                e.preventDefault();
                e.stopPropagation();
                if (!isLockedByOther) removeToken(token.id);
            }}
        >
            {/* Lock Indicator */}
            {isLockedByOther && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-etat-danger/20 rounded-full animate-pulse">
                    <Lock size={20 * token.size} className="text-etat-danger drop-shadow-lg" />
                </div>
            )}

            {/* Trash Button on Hover */}
            {isInteractable && (
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            updateToken(token.id, { isVisible: !isVisible });
                        }}
                        className={`p-1 rounded-full shadow-lg border border-app-text/20 transition-colors ${isVisible ? 'bg-etat-info hover:bg-etat-info/85 text-app-bg' : 'bg-app-surface-2 hover:bg-app-muted text-app-text'}`}
                        title={isVisible ? t('map.token.hide') : t('map.token.show')}
                    >
                        {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeToken(token.id);
                        }}
                        className="bg-etat-danger text-app-bg p-1 rounded-full shadow-lg hover:bg-etat-danger/90 border border-app-border"
                        title={t('map.token.remove')}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}

            {/* Avatar image */}
            {avatarToUse && resolvedAvatar ? (
                <img src={resolvedAvatar} alt="avatar" className="w-full h-full object-cover rounded-full pointer-events-none" />
            ) : (
                <Shield size={24 * token.size} className={combatant?.isPlayer ? 'text-gm-violet' : 'text-gm-crimson'} />
            )}

            {/* Status indicators */}
            {combatant && combatant.statuses.length > 0 && (
                <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-obsidian border border-app-border rounded-full px-1.5 py-0.5 flex gap-0.5 pointer-events-none shadow-xl z-20">
                    {combatant.statuses.slice(0, 3).map((s: StatusEffect) => (
                        <span key={s.id} className="text-ui-12 leading-none drop-shadow-md">{s.icon}</span>
                    ))}
                    {combatant.statuses.length > 3 && <span className="text-ui-10 text-app-muted font-bold ml-0.5">+{combatant.statuses.length - 3}</span>}
                </div>
            )}

            {/* Hover Tooltip (Name + HP) */}
            <div className="absolute -bottom-8 whitespace-nowrap bg-app-bg/90 backdrop-blur-sm border border-app-border text-xs px-2 py-1 rounded opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-50 text-app-text shadow-xl font-bold">
                {combatant ? `${combatant.name} (${combatant.hp}/${combatant.hpMax})` : (token.name || t('map.token.defaultName'))}
            </div>
        </div>
    );
};

export default MapTokenNode;
