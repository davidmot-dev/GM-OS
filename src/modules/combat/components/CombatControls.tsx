import React, { useState } from 'react';
import { useCombatStore } from '../useCombatStore';
import { gmToast } from '../../../stores/useToastStore';
import { gmConfirm, gmPrompt } from '../../../stores/useModalStore';
import { 
    UserPlus, RefreshCw, Dices, Save, Play, Skull, 
    ArrowDown01, ArrowUp10, Sparkles, Zap, Activity
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

    const handleAutoInitiative = () => {
        console.log("[CombatControls] Clicking Jet Système", { 
            formula: activeDriver?.combat.initiativeFormula,
            sort: activeDriver?.combat.initiativeSort,
            cards: activeDriver?.combat.initiativeCards 
        });
        
        if (activeDriver?.combat.initiativeFormula) {
            rollAutoInitiative({ 
                formula: activeDriver.combat.initiativeFormula,
                sortOrder: activeDriver.combat.initiativeSort || 'desc',
                cards: activeDriver.combat.initiativeCards,
                resolver: (stat) => {
                    console.log("[CombatControls] Resolving stat:", stat);
                    return 0;
                }
            });
        } else {
            console.log("[CombatControls] Fallback to standard dice roll", diceMax);
            rollAutoInitiative({ diceMax });
        }
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

            {/* Intelligent Initiative Section */}
            <div className="flex flex-col gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 backdrop-blur-md mb-6 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Auto Initiative</h3>
                    </div>
                </div>

                {activeDriver?.combat.initiativeFormula && (
                    <button
                        onClick={handleAutoInitiative}
                        className="group relative overflow-hidden flex flex-col items-center justify-center py-4 px-6 bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white rounded-xl border border-indigo-400/30 shadow-lg shadow-indigo-900/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
                            <span className="font-black tracking-tighter text-lg uppercase">Jet Système</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-[9px] text-indigo-100 font-medium opacity-90">
                            <span className="px-2 py-0.5 bg-black/20 rounded-md backdrop-blur-sm border border-white/10 tracking-widest uppercase">
                                {activeDriver.combat.initiativeCards 
                                    ? `CARTES UNIQUE (1-${activeDriver.combat.initiativeCards})` 
                                    : activeDriver.combat.initiativeFormula}
                            </span>
                            <span className="opacity-60 italic uppercase tracking-tighter">
                                {activeDriver.combat.initiativeSort === 'asc' ? 'Ordre Croissant' : 'Ordre Décroissant'}
                            </span>
                        </div>
                    </button>
                )}

                <div className="flex gap-2">
                    <select
                        className="bg-app-bg border border-app-border rounded-lg text-app-text px-2 py-2 outline-none focus:border-gm-crimson text-xs flex-1"
                        value={diceMax}
                        onChange={(e) => setDiceMax(Number(e.target.value))}
                    >
                        {[4, 6, 8, 10, 12, 20, 100].map(d => (
                            <option key={d} value={d}>d{d}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => rollAutoInitiative({ diceMax })}
                        className="bg-app-bg hover:bg-gm-crimson/20 border border-gm-crimson/50 text-gm-crimson px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors flex-[2] text-xs font-bold uppercase tracking-tighter"
                        title="Jette l'initiative standard pour tous ceux à 0"
                    >
                        <Dices size={14} />
                        <span>Standard</span>
                    </button>
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
