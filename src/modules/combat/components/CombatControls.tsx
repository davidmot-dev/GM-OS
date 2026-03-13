import React, { useState } from 'react';
import { useCombatStore } from '../useCombatStore';
import { gmToast } from '../../../stores/useToastStore';
import { gmConfirm, gmPrompt } from '../../../stores/useModalStore';
import { 
    UserPlus, RefreshCw, Dices, Save, Play, Skull, 
    ArrowDown01, ArrowUp10, Sparkles 
} from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';

const CombatControls: React.FC = () => {
    const {
        round,
        rollAutoInitiative,
        sortInitiative,
        nextTurn,
        addCombatant,
        clearCombatants,
        syncCombatantHPToSession
    } = useCombatStore();

    const { 
        activeCampaignId, 
        selectedSessionId, 
        addTimelineEvent,
        getActiveDriver
    } = useSessionOSStore();

    const activeDriver = getActiveDriver();

    const [diceMax, setDiceMax] = useState<number>(20);

    const handleAddCombatant = () => {
        gmPrompt('Nom du nouveau combattant :', 'Nouveau Combattant', (name) => {
            if (name.trim()) {
                addCombatant({
                    name: name.trim(),
                    init: 0,
                    hp: 10,
                    hpMax: 10,
                    isPlayer: false,
                    statuses: []
                });
            }
        });
    };

    const handleSaveCombat = () => {
        if (!activeCampaignId) {
            gmToast("Aucune campagne active pour l'export.", "error");
            return;
        }

        const combatants = useCombatStore.getState().combatants;
        if (combatants.length === 0) {
            gmToast("Aucun combattant à exporter.", "warning");
            return;
        }

        // 1. Generate Markdown Summary
        const dateStr = new Date().toLocaleDateString('fr-FR', { 
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        });

        let content = `### ⚔️ Rapport de Combat - ${dateStr}\n\n`;
        content += `**Fin du Round :** ${round}\n\n`;
        
        content += `#### Participants :\n`;
        
        const players = combatants.filter(c => c.isPlayer);
        const enemies = combatants.filter(c => !c.isPlayer);

        if (players.length > 0) {
            content += `\n**Alliés & Joueurs :**\n`;
            players.forEach(c => {
                const statusStr = c.statuses.length > 0 ? ` [${c.statuses.map(s => s.name).join(', ')}]` : '';
                content += `- **${c.name}** : ${c.hp}/${c.hpMax} PV${statusStr}\n`;
            });
        }

        if (enemies.length > 0) {
            content += `\n**Ennemis :**\n`;
            enemies.forEach(c => {
                const statusStr = c.statuses.length > 0 ? ` [${c.statuses.map(s => s.name).join(', ')}]` : '';
                content += `- **${c.name}** : ${c.hp}/${c.hpMax} PV${statusStr}\n`;
            });
        }

        // 2. Create Timeline Event
        addTimelineEvent({
            campaignId: activeCampaignId,
            sessionId: selectedSessionId || undefined,
            date: dateStr,
            title: `Combat - Round ${round}`,
            description: content,
            type: 'combat',
            involvedEntityIds: combatants.map(c => c.sourceEntityId || c.sourcePlayerId).filter(Boolean) as string[]
        });

        gmToast("Résumé de combat exporté dans la Chronologie !");
    };

    return (
        <aside className="w-80 bg-app-surface/40 border-l border-app-border/50 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">

            {/* Header */}
            <h2 className="text-xl font-display font-bold text-app-text mb-2 uppercase tracking-widest border-b border-app-border/50 pb-2">
                Contrôles
            </h2>

            {/* Active Driver Indicator */}
            <div className="mb-6 flex flex-col gap-1">
                <span className="text-[10px] text-app-text/30 font-black uppercase tracking-widest">Système Actif</span>
                <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 group transition-all ${activeDriver ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-app-bg/50 border-app-border/20 text-app-text/40'}`}>
                    <Sparkles size={14} className={activeDriver ? 'animate-pulse' : 'opacity-20'} />
                    <span className="text-xs font-black uppercase tracking-wider truncate">
                        {activeDriver?.name || 'Standard Dice-OS'}
                    </span>
                </div>
            </div>

            {/* Main Action: Next Turn */}
            <div className="bg-gm-crimson/10 border border-gm-crimson/30 p-4 rounded-xl mb-6 shadow-glow-crimson flex flex-col items-center">
                <div className="text-app-text/70 text-sm uppercase tracking-wider mb-2">
                    Round <span className="text-app-text font-bold text-xl ml-1">{round.toString().padStart(2, '0')}</span>
                </div>
                <button
                    onClick={nextTurn}
                    className="w-full bg-gm-crimson hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-glow-crimson group"
                >
                    <span className="text-lg">TOUR SUIVANT</span>
                    <Play fill="currentColor" size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Auto Initiative */}
            <div className="mb-6 space-y-3">
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <select
                            className="bg-app-bg border border-app-border rounded-lg text-app-text px-3 py-2 outline-none focus:border-gm-crimson flex-1"
                            value={diceMax}
                            onChange={(e) => setDiceMax(Number(e.target.value))}
                        >
                            <option value={4}>d4</option>
                            <option value={6}>d6</option>
                            <option value={8}>d8</option>
                            <option value={10}>d10</option>
                            <option value={12}>d12</option>
                            <option value={20}>d20</option>
                            <option value={100}>d100</option>
                        </select>
                        <button
                            onClick={() => rollAutoInitiative({ diceMax })}
                            className="bg-app-bg hover:bg-gm-crimson/20 border border-gm-crimson/50 text-gm-crimson px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors flex-1"
                            title="Jette l'initiative standard pour tous ceux à 0"
                        >
                            <Dices size={18} />
                            <span>Standard</span>
                        </button>
                    </div>

                    {activeDriver?.combat.initiativeFormula && (
                        <button
                            onClick={() => rollAutoInitiative({ formula: activeDriver.combat.initiativeFormula })}
                            className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-500 font-black py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all shadow-glow-amber/5 group"
                            title={`Jette l'initiative via le système ${activeDriver.name}`}
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                                <span className="text-[11px] uppercase tracking-widest">Jet Système</span>
                            </div>
                            <span className="text-[9px] opacity-60 font-mono tracking-tighter">[{activeDriver.combat.initiativeFormula}]</span>
                        </button>
                    )}
                </div>
            </div>

            {/* List Management */}
            <div className="space-y-2 mb-6">
                <button
                    onClick={handleAddCombatant}
                    className="w-full bg-app-bg hover:bg-app-surface border border-app-border hover:border-app-border/80 text-app-text/80 hover:text-app-text px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <UserPlus size={18} />
                    <span>Ajouter Combattant</span>
                </button>

                <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                        onClick={() => sortInitiative(false)}
                        className="bg-app-bg hover:bg-app-surface border border-app-border text-app-text/80 hover:text-app-text p-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
                        title="Trier (Décroissant)"
                    >
                        <ArrowDown01 size={16} /> Trie
                    </button>
                    <button
                        onClick={() => sortInitiative(true)}
                        className="bg-app-bg hover:bg-app-surface border border-app-border text-app-text/80 hover:text-app-text p-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
                        title="Trier (Croissant)"
                    >
                        <ArrowUp10 size={16} /> Trie
                    </button>
                </div>
            </div>

            {/* Sync & Advanced */}
            <div className="mt-auto space-y-4 pt-6 border-t border-app-border">
                <button
                    onClick={() => {
                        syncCombatantHPToSession();
                        gmToast("Points de Vie synchronisés !");
                    }}
                    className="w-full bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-glow-emerald"
                >
                    <RefreshCw size={18} />
                    <span>Sync PV vers Session</span>
                </button>

                <button 
                    onClick={handleSaveCombat} 
                    className="w-full bg-app-bg hover:bg-app-surface/60 border border-app-border flex items-center justify-center gap-2 py-3 rounded-lg text-app-text/70 hover:text-app-text transition-all shadow-lg group" 
                    title="Sauvegarder et terminer le combat"
                >
                    <Save size={18} className="group-hover:scale-110 transition-transform" /> 
                    <span className="font-bold uppercase tracking-wider text-xs">Fin de combat</span>
                </button>

                <button
                    onClick={() => {
                        gmConfirm('Voulez-vous vraiment vider la liste des combattants ?', () => {
                            clearCombatants();
                        });
                    }}
                    className="w-full mt-4 bg-red-900/20 hover:bg-red-900/50 text-red-500 hover:text-red-400 py-2 border border-red-900/50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Skull size={16} />
                    <span>Reset Combat</span>
                </button>
            </div>
        </aside>
    );
};

export default CombatControls;
