import React, { useState } from 'react';
import { useCombatStore, type Combatant } from '../useCombatStore';
import { X, Shield, Plus, Minus, PlusCircle, Edit2 } from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import { gmPrompt } from '../../../stores/useModalStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { Link2 } from 'lucide-react';

const PRESET_STATUSES = [
    { name: 'Poison', icon: '🤢', duration: 3 },
    { name: 'En feu', icon: '🔥', duration: 3 },
    { name: 'Étourdi', icon: '💫', duration: 1 },
    { name: 'À terre', icon: '⏬', duration: 0 },
    { name: 'Concentration', icon: '🧠', duration: 0 },
    { name: 'Invisibilité', icon: '👻', duration: 10 },
    { name: 'Béni', icon: '✨', duration: 10 },
    { name: 'Maudit', icon: '💀', duration: 10 },
    { name: 'Soin', icon: '✨', duration: 1 },
    { name: 'Froid', icon: '❄️', duration: 3 },
    { name: 'Foudre', icon: '⚡', duration: 1 },
];

interface CombatCardProps {
    combatant: Combatant;
    isActive: boolean;
}

const CombatCard: React.FC<CombatCardProps> = ({ combatant, isActive }) => {
    const { 
        updateCombatant, 
        removeCombatant, 
        removeStatus, 
        setInitiative, 
        addStatus 
    } = useCombatStore();
    const { getActiveDriver } = useSessionOSStore();
    const activeDriver = getActiveDriver();
    
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [customDuration, setCustomDuration] = useState<number>(3);

    // Calcul de couleur HP
    let hpColorClass = 'text-green-400';
    if (combatant.hp <= 0) hpColorClass = 'text-gray-500';
    else if (combatant.hp <= combatant.hpMax * 0.25) hpColorClass = 'text-red-500';
    else if (combatant.hp <= combatant.hpMax * 0.5) hpColorClass = 'text-yellow-400';

    const handleHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        updateCombatant(combatant.id, { hp: val });
    };

    const handleInitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        setInitiative(combatant.id, val);
    };

    const isDead = combatant.hp <= 0;

    return (
        <div className={`relative flex flex-col p-3 mb-2 rounded-xl transition-all duration-300 bg-app-surface/40 border border-app-border/50 ${isActive ? 'ring-2 ring-gm-crimson shadow-glow-crimson' : ''
            } ${isDead && !isActive ? 'opacity-50 grayscale' : ''}`}>

            <div className="flex items-center w-full">
                {/* Initiative Input */}
                <div className="flex flex-col items-center mr-5 shrink-0">
                    <span className="text-[10px] text-app-text/50 uppercase font-black tracking-[0.2em] mb-1.5 mr-0.5">INIT</span>
                    <input
                        type="number"
                        value={combatant.init === 0 ? '' : combatant.init}
                        placeholder="0"
                        onChange={handleInitChange}
                        className="w-20 h-14 bg-app-bg text-app-text rounded-xl text-center text-2xl font-black border border-app-border shadow-inner focus:ring-2 focus:ring-gm-crimson/50 transition-all"
                    />
                </div>

                {/* Avatar / Icon */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-app-bg flex items-center justify-center border-2 border-gm-crimson/50 shrink-0">
                    <ResolvedImage 
                        src={combatant.avatar} 
                        alt={combatant.name} 
                        className="w-full h-full object-cover" 
                        fallback={<Shield className={combatant.isPlayer ? 'text-gm-violet' : 'text-gm-crimson'} size={24} />}
                    />
                </div>

                {/* Info : Name & Statuses */}
                <div className="flex-1 ml-4 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 relative group/name">
                        <div 
                            className="font-bold text-lg text-app-text truncate max-w-[200px] cursor-pointer hover:text-gm-crimson transition-colors flex items-center gap-2" 
                            title="Cliquer pour renommer"
                            onClick={() => {
                                gmPrompt(`Renommer ${combatant.name} :`, combatant.name, (newName) => {
                                    if (newName.trim()) updateCombatant(combatant.id, { name: newName.trim() });
                                });
                            }}
                        >
                            {combatant.name}
                            <Edit2 size={12} className="opacity-0 group-hover/name:opacity-50 transition-opacity" />
                        </div>
                        <button
                            className={`text-app-text/50 hover:text-app-text transition-colors p-1 rounded hover:bg-app-surface/50 ${showStatusMenu ? 'text-app-text bg-app-surface/50' : ''}`}
                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                            title="Ajouter une altération d'état"
                        >
                            <PlusCircle size={16} />
                        </button>
                    </div>

                    {combatant.statuses.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {combatant.statuses.map(status => (
                                <span
                                    key={status.id}
                                    className="inline-flex items-center gap-1 bg-app-bg px-2 py-0.5 rounded text-xs border border-app-border/50 group cursor-pointer hover:bg-red-500/20"
                                    onClick={() => removeStatus(combatant.id, status.id)}
                                    title="Cliquer pour dissiper"
                                >
                                    <span>{status.icon}</span>
                                    <span className={status.duration > 0 ? "text-app-text/70" : "text-gm-cyan"}>
                                        {status.duration > 0 ? `${status.duration}t` : '∞'}
                                    </span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Health Control */}
                <div className="flex flex-col items-center mx-4 bg-app-bg/50 rounded-lg p-2 border border-gm-crimson/20 relative group">
                    {combatant.sourcePlayerId && (
                        <div className="absolute -top-1 -right-1 text-accent animate-pulse" title="Synchronisé avec la fiche">
                            <Link2 size={10} />
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            className="text-app-text/40 hover:text-app-text hover:bg-app-surface/50 rounded p-1"
                            onClick={() => updateCombatant(combatant.id, { hp: combatant.hp - 1 })}
                        >
                            <Minus size={14} />
                        </button>
                        <input
                            type="number"
                            value={combatant.hp}
                            onChange={handleHpChange}
                            className={`w-14 bg-transparent text-center text-xl font-bold p-0 border-none focus:ring-0 ${hpColorClass}`}
                        />
                        <button
                            className="text-app-text/40 hover:text-app-text hover:bg-app-surface/50 rounded p-1"
                            onClick={() => updateCombatant(combatant.id, { hp: combatant.hp + 1 })}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <span className="text-xs text-app-text/50 mt-1">/ {combatant.hpMax} PV</span>
                </div>

                {/* Delete button */}
                <button
                    className="w-8 h-8 flex items-center justify-center text-app-text/40 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
                    onClick={() => removeCombatant(combatant.id)}
                    title="Supprimer du combat"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Extra Stats Bars (Dynamic from System) */}
            {activeDriver && activeDriver.combat.statsToTrack.length > 0 && (
                <div className="mt-3 flex gap-3 px-2">
                    {activeDriver.combat.statsToTrack
                        .filter(s => s.isResource)
                        .map((statMapping, idx) => {
                        const statName = statMapping.label;
                        const extra = combatant.extraStats?.[statMapping.fieldId] || { value: 10, max: 10 };
                        const percent = Math.min(100, Math.max(0, (extra.value / extra.max) * 100));
                        
                        // Color coding based on stat name
                        let barColor = 'bg-indigo-500';
                        if (statName.toLowerCase().includes('san')) barColor = 'bg-purple-500';
                        if (statName.toLowerCase().includes('mp') || statName.toLowerCase().includes('mana')) barColor = 'bg-blue-500';
                        if (statName.toLowerCase().includes('xp') || statName.toLowerCase().includes('exp')) barColor = 'bg-amber-500';

                        return (
                            <div key={idx} className="flex-1 flex flex-col gap-1">
                                <div className="flex justify-between items-center px-0.5">
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-app-text/40">{statName}</span>
                                    <span className="text-[8px] font-bold text-app-text/60">{extra.value}</span>
                                </div>
                                <div className="h-1 bg-app-bg rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className={`h-full ${barColor} transition-all duration-500 shadow-sm`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Expansible Status Panel */}
            {showStatusMenu && (
                <div className="mt-3 pt-3 border-t border-app-border/50 w-full animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 bg-app-bg/50 p-2 rounded border border-app-border w-fit">
                            <span className="text-sm text-app-text/70">Durée :</span>
                            <div className="flex items-center">
                                <button
                                    className="px-2 py-0.5 bg-app-surface hover:bg-app-surface/80 rounded-l text-app-text"
                                    onClick={() => setCustomDuration(Math.max(0, customDuration - 1))}
                                >-</button>
                                <input
                                    type="number"
                                    min="0"
                                    value={customDuration}
                                    onChange={(e) => setCustomDuration(parseInt(e.target.value) || 0)}
                                    className="w-12 bg-app-bg text-center text-app-text py-0.5 border-y border-app-border outline-none text-sm custom-scrollbar"
                                    title="0 = Infini"
                                />
                                <button
                                    className="px-2 py-0.5 bg-app-surface hover:bg-app-surface/80 rounded-r text-app-text"
                                    onClick={() => setCustomDuration(customDuration + 1)}
                                >+</button>
                            </div>
                            <span className="text-xs text-app-text/50 italic ml-2">(0 = Infini)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_STATUSES.map((status, idx) => (
                                <button
                                    key={idx}
                                    className="flex items-center gap-1.5 bg-app-bg hover:bg-gm-crimson/20 border border-app-border hover:border-gm-crimson/50 px-2 py-1.5 rounded transition-colors text-sm"
                                    onClick={() => {
                                        addStatus(combatant.id, { ...status, duration: customDuration });
                                        setShowStatusMenu(false);
                                    }}
                                >
                                    <span>{status.icon}</span>
                                    <span className="text-app-text/80">{status.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CombatCard;
