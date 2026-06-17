import React, { useState } from 'react';
import { useSessionOSStore, type Entity } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { Swords, ChevronRight, Zap } from 'lucide-react';
import type { EncounterTemplate } from '../../../types/drivers';

interface EncounterRollPanelProps {
    onClose?: () => void;
}

export const EncounterRollPanel: React.FC<EncounterRollPanelProps> = ({ onClose }) => {
    const { getActiveDriver, generateEncounter } = useSessionOSStore();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const driver = getActiveDriver();
    const templates = driver?.encounterTemplates || [];

    if (!driver || templates.length === 0) {
        return (
            <div className="p-10 text-center space-y-4">
                <Swords className="w-16 h-16 mx-auto mb-4 text-slate-700 opacity-20" />
                <p className="text-slate-400 font-medium">Aucun template de rencontre configuré.</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Allez dans le Rule Engine pour en créer.</p>
            </div>
        );
    }

    const handleGenerate = () => {
        if (!selectedTemplateId) return;
        setIsGenerating(true);
        
        // Brief delay for UX/Animation
        setTimeout(() => {
            const spawnedEntities = generateEncounter(selectedTemplateId);
            
            // 1. Add all spawned entities to Combat OS
            if (spawnedEntities && spawnedEntities.length > 0) {
                const combatStore = useCombatStore.getState();
                spawnedEntities.forEach((entity: Entity) => {
                    combatStore.addCombatant({
                        name: entity.name,
                        init: 0,
                        hp: entity.hp,
                        hpMax: entity.maxHp,
                        avatar: entity.avatar,
                        isPlayer: false,
                        faction: entity.role === 'boss' ? 'enemy' : 'enemy', // Hostile from encounter is always enemy
                        sourceEntityId: entity.id,
                        statuses: []
                    });
                });

                // 2. Jump to Combat OS module
                useSessionStore.getState().setActiveModule('combat');
            }

            setIsGenerating(false);
            if (onClose) onClose();
        }, 800);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 bg-rose-500/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/20">
                        <Swords size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-white uppercase tracking-tight italic">Déclencheur de Rencontre</h3>
                        <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest opacity-60">Système: {driver.name}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block px-1">Templates Disponibles</p>
                {templates.map((template: EncounterTemplate) => (
                    <button
                        key={template.id}
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${
                            selectedTemplateId === template.id
                                ? 'bg-rose-500/20 border-rose-500/40 shadow-lg shadow-rose-500/10'
                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                    >
                        {selectedTemplateId === template.id && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 shadow-glow-rose" />
                        )}
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedTemplateId === template.id ? 'bg-rose-500 text-black' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'}`}>
                                    <Zap size={14} />
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm tracking-tight ${selectedTemplateId === template.id ? 'text-rose-100' : 'text-slate-300'}`}>
                                        {template.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">
                                        {template.entities.length} Types d'unités
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${selectedTemplateId === template.id ? 'translate-x-1 text-rose-400' : 'text-slate-700 group-hover:text-slate-500'}`} />
                        </div>
                    </button>
                ))}
            </div>

            {/* Action */}
            <div className="p-6 bg-black/20 border-t border-white/5">
                <button
                    onClick={handleGenerate}
                    disabled={!selectedTemplateId || isGenerating}
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all duration-500 ${
                        !selectedTemplateId || isGenerating
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                            : 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_10px_30px_-10px_rgba(225,29,72,0.4)] hover:-translate-y-1 active:scale-95'
                    }`}
                >
                    {isGenerating ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Zap size={16} className="fill-current" />
                    )}
                    {isGenerating ? 'Déploiement...' : 'Déclencher la rencontre'}
                </button>
            </div>
        </div>
    );
};
