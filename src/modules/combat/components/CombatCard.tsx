import React, { useState } from 'react';
import { useCombatStore, type Combatant } from '../useCombatStore';
import { X, Shield, Plus, Minus, PlusCircle, Edit2 } from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import { gmPrompt } from '../../../stores/useModalStore';

const PRESET_STATUSES = [
    { name: 'Poison', icon: '🤢', duration: 3 },
    { name: 'En feu', icon: '🔥', duration: 3 },
    { name: 'Étourdi', icon: '💫', duration: 1 },
    { name: 'À terre', icon: '⏬', duration: 0 },
    { name: 'Concentration', icon: '🧠', duration: 0 },
    { name: 'Invisibilité', icon: '👻', duration: 10 },
    { name: 'Béni', icon: '✨', duration: 10 },
    { name: 'Maudit', icon: '💀', duration: 10 },
];

interface CombatCardProps {
    combatant: Combatant;
    isActive: boolean;
}

const CombatCard: React.FC<CombatCardProps> = ({ combatant, isActive }) => {
    const { updateCombatant, removeCombatant, removeStatus, setInitiative, addStatus } = useCombatStore();
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
        <div className={`relative flex flex-col p-3 mb-2 rounded-xl transition-all duration-300 bg-obsidian-light/30 border border-gray-700/50 ${isActive ? 'ring-2 ring-gm-crimson shadow-glow-crimson' : ''
            } ${isDead && !isActive ? 'opacity-50 grayscale' : ''}`}>

            <div className="flex items-center w-full">
                {/* Initiative Input */}
                <div className="flex flex-col items-center mr-4">
                    <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">Init</span>
                    <input
                        type="number"
                        value={combatant.init === 0 ? '' : combatant.init}
                        placeholder="0"
                        onChange={handleInitChange}
                        className="w-12 h-10 bg-obsidian-dark text-white rounded text-center text-lg font-bold border-none focus:ring-1 focus:ring-gm-crimson custom-scrollbar"
                    />
                </div>

                {/* Avatar / Icon */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-obsidian-dark flex items-center justify-center border-2 border-gm-crimson/50 shrink-0">
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
                            className="font-bold text-lg text-slate-100 truncate max-w-[200px] cursor-pointer hover:text-gm-crimson transition-colors flex items-center gap-2" 
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
                            className={`text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-700/50 ${showStatusMenu ? 'text-white bg-gray-700/50' : ''}`}
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
                                    className="inline-flex items-center gap-1 bg-obsidian-dark px-2 py-0.5 rounded text-xs border border-gray-600/50 group cursor-pointer hover:bg-red-900/40"
                                    onClick={() => removeStatus(combatant.id, status.id)}
                                    title="Cliquer pour dissiper"
                                >
                                    <span>{status.icon}</span>
                                    <span className={status.duration > 0 ? "text-slate-300" : "text-gm-cyan"}>
                                        {status.duration > 0 ? `${status.duration}t` : '∞'}
                                    </span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Health Control */}
                <div className="flex flex-col items-center mx-4 bg-obsidian/50 rounded-lg p-2 border border-gm-crimson/20">
                    <div className="flex items-center gap-2">
                        <button
                            className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded p-1"
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
                            className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded p-1"
                            onClick={() => updateCombatant(combatant.id, { hp: combatant.hp + 1 })}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">/ {combatant.hpMax} PV</span>
                </div>

                {/* Delete button */}
                <button
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
                    onClick={() => removeCombatant(combatant.id)}
                    title="Supprimer du combat"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Expansible Status Panel */}
            {showStatusMenu && (
                <div className="mt-3 pt-3 border-t border-gray-700/50 w-full animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 bg-obsidian-dark/50 p-2 rounded border border-gray-800 w-fit">
                            <span className="text-sm text-slate-300">Durée :</span>
                            <div className="flex items-center">
                                <button
                                    className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded-l text-white"
                                    onClick={() => setCustomDuration(Math.max(0, customDuration - 1))}
                                >-</button>
                                <input
                                    type="number"
                                    min="0"
                                    value={customDuration}
                                    onChange={(e) => setCustomDuration(parseInt(e.target.value) || 0)}
                                    className="w-12 bg-obsidian text-center text-white py-0.5 border-y border-gray-700 outline-none text-sm custom-scrollbar"
                                    title="0 = Infini"
                                />
                                <button
                                    className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded-r text-white"
                                    onClick={() => setCustomDuration(customDuration + 1)}
                                >+</button>
                            </div>
                            <span className="text-xs text-slate-500 italic ml-2">(0 = Infini)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_STATUSES.map((status, idx) => (
                                <button
                                    key={idx}
                                    className="flex items-center gap-1.5 bg-obsidian hover:bg-gm-crimson/20 border border-gray-700 hover:border-gm-crimson/50 px-2 py-1.5 rounded transition-colors text-sm"
                                    onClick={() => {
                                        addStatus(combatant.id, { ...status, duration: customDuration });
                                        setShowStatusMenu(false);
                                    }}
                                >
                                    <span>{status.icon}</span>
                                    <span className="text-slate-200">{status.name}</span>
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
