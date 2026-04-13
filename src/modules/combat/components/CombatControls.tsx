import React, { useState } from 'react';
import { useCombatStore } from '../useCombatStore';
import { gmToast } from '../../../stores/useToastStore';
import { gmConfirm, gmPrompt } from '../../../stores/useModalStore';
import { 
    UserPlus, RefreshCw, Dices, Save, Play, Skull, 
    ArrowDown01, ArrowUp10, Sparkles, Zap, Activity,
    MonitorPlay, MonitorOff, Sword, Shield
} from 'lucide-react';
import { gmCustom } from '../../../stores/useModalStore';
import { Select } from '../../../components/common/Select';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useTranslation } from 'react-i18next';

const CombatControls: React.FC = () => {
    const {
        round,
        rollAutoInitiative,
        sortInitiative,
        nextTurn,
        addCombatant,
        clearCombatants,
        syncCombatantHPToSession,
        propagateStatusToSession,
        isCombatProjected,
        setIsCombatProjected
    } = useCombatStore();

    const { t } = useTranslation(['modules', 'common']);

    const {
        activeCampaignId,
        selectedSessionId,
        addTimelineEvent,
        getActiveDriver
    } = useSessionOSStore();

    const activeDriver = getActiveDriver();
    const [diceMax, setDiceMax] = useState<number>(20);

    const handleAddCombatant = () => {
        gmPrompt(`${t('combat.card.rename_prompt', { name: '' })}`, t('combat.controls.add_combatant'), (name) => {
            if (name.trim()) {
                addCombatant({
                    name: name.trim(),
                    init: 0,
                    hp: 10,
                    hpMax: 10,
                    isPlayer: false,
                    faction: 'enemy',
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
                resolver: (stat, combatant) => {
                    const sessionStore = useSessionOSStore.getState();
                    const getStatValue = (data: Record<string, unknown>, statName: string) => {
                        const lowStat = statName.toLowerCase();
                        // 1. Check sheetData case-insensitively
                        const entry = Object.entries(data || {}).find(([k]) => k.toLowerCase() === lowStat);
                        if (entry !== undefined) return Number(entry[1]) || 0;
                        return undefined;
                    };
                    let val = 0;

                    if (combatant.isPlayer && combatant.sourcePlayerId) {
                        const char = sessionStore.players
                            .flatMap(p => p.characters)
                            .find(c => c.id === combatant.sourcePlayerId);
                        
                        if (char) {
                            const sheetVal = getStatValue(char.sheetData, stat);
                            if (sheetVal !== undefined) {
                                val = sheetVal;
                            } else {
                                // Fallback to standard fields
                                const lowStat = stat.toLowerCase();
                                if ((char as unknown as Record<string, unknown>)[lowStat] !== undefined) {
                                    val = Number((char as unknown as Record<string, unknown>)[lowStat]) || 0;
                                }
                            }
                        }
                    } else if (combatant.sourceEntityId) {
                        const entity = sessionStore.entities.find(e => e.id === combatant.sourceEntityId);
                        if (entity) {
                            const sheetVal = getStatValue(entity.sheetData || {}, stat);
                            if (sheetVal !== undefined) {
                                val = sheetVal;
                            } else {
                                // Fallback to standard fields
                                const lowStat = stat.toLowerCase();
                                if ((entity as unknown as Record<string, unknown>)[lowStat] !== undefined) {
                                    val = Number((entity as unknown as Record<string, unknown>)[lowStat]) || 0;
                                }
                            }
                        }
                    }
                    
                    if (Number.isNaN(val)) val = 0;
                    
                    console.log(`[CombatControls] Resolving "${stat}" for ${combatant.name} -> ${val} (Source: ${combatant.isPlayer ? 'PC' : 'NPC'})`);
                    return val;
                }
            });
        } else {
            console.log("[CombatControls] Fallback to standard dice roll", diceMax);
            rollAutoInitiative({ diceMax });
        }
    };

    const handleSaveCombat = () => {
        if (!activeCampaignId) {
            gmToast(t('combat.messages.no_campaign'), "error");
            return;
        }

        const combatants = useCombatStore.getState().combatants;
        if (combatants.length === 0) {
            gmToast(t('combat.messages.no_combatants'), "warning");
            return;
        }

        const dateStr = new Date().toLocaleDateString(navigator.language, { 
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        });

        let content = t('combat.report.header', { date: dateStr });
        content += t('combat.report.round', { round });
        content += t('combat.report.participants');
        
        const players = combatants.filter(c => c.isPlayer);
        const enemies = combatants.filter(c => !c.isPlayer);

        if (players.length > 0) {
            content += t('combat.report.players_section');
            players.forEach(c => {
                const statusStr = c.statuses.length > 0 ? ` [${c.statuses.map(s => t(`combat.status.presets.${s.name.toLowerCase().replace(/\s/g, '_')}`, { defaultValue: s.name })).join(', ')}]` : '';
                content += t('combat.report.entry', { name: c.name, hp: c.hp, hpMax: c.hpMax, statuses: statusStr });
            });
        }

        if (enemies.length > 0) {
            content += t('combat.report.enemies_section');
            enemies.forEach(c => {
                const statusStr = c.statuses.length > 0 ? ` [${c.statuses.map(s => t(`combat.status.presets.${s.name.toLowerCase().replace(/\s/g, '_')}`, { defaultValue: s.name })).join(', ')}]` : '';
                content += t('combat.report.entry', { name: c.name, hp: c.hp, hpMax: c.hpMax, statuses: statusStr });
            });
        }

        addTimelineEvent({
            campaignId: activeCampaignId,
            sessionId: selectedSessionId || undefined,
            date: dateStr,
            title: t('combat.report.title', { round }),
            description: content,
            type: 'combat',
            involvedEntityIds: combatants.map(c => c.sourceEntityId || c.sourcePlayerId).filter(Boolean) as string[]
        });

        // 🆕 Propagation of statuses (e.g. Mort) to Session OS entities
        propagateStatusToSession();
        // and final HP sync just in case
        syncCombatantHPToSession();

        gmToast(t('modules:combat.messages.exported'));
    };

    return (
        <aside className="w-80 bg-app-surface/40 border-l border-app-border/50 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">

            {/* Header */}
            <div className="flex items-center justify-between mb-2 border-b border-app-border/50 pb-2">
                <h2 className="text-xl font-display font-bold text-app-text uppercase tracking-widest">
                    {t('modules:combat.controls.title_full', { defaultValue: 'CONTRÔLES DE COMBAT' })}
                </h2>
                <button
                    onClick={() => setIsCombatProjected(!isCombatProjected)}
                    className={`p-2 rounded-lg transition-all duration-300 flex items-center gap-2 group ${
                        isCombatProjected 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald/20' 
                        : 'bg-red-500/10 text-red-400/50 border border-red-500/10 opacity-60 grayscale'
                    }`}
                    title={isCombatProjected ? t('modules:projection.deactivate') : t('modules:projection.activate')}
                >
                    {isCombatProjected ? <MonitorPlay size={18} /> : <MonitorOff size={18} />}
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                        {isCombatProjected ? 'ON' : 'OFF'}
                    </span>
                </button>
            </div>

            {/* Active Driver Indicator */}
            <div className="mb-6 flex flex-col gap-1">
                <span className="text-[10px] text-app-text/30 font-black uppercase tracking-widest">{t('modules:combat.controls.active_system')}</span>
                <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 group transition-all ${activeDriver ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-app-bg/50 border-app-border/20 text-app-text/40'}`}>
                    <Sparkles size={14} className={activeDriver ? 'animate-pulse' : 'opacity-20'} />
                    <span className="text-xs font-black uppercase tracking-wider truncate">
                        {activeDriver?.name || t('modules:combat.controls.auto_init.standard_dice_os')}
                    </span>
                </div>
            </div>

            {/* Main Action: Next Turn */}
            <div className="bg-gm-crimson/10 border border-gm-crimson/30 p-4 rounded-xl mb-6 shadow-glow-crimson flex flex-col items-center">
                <div className="text-app-text/70 text-sm uppercase tracking-wider mb-2">
                    {t('modules:combat.controls.round')} <span className="text-app-text font-bold text-xl ml-1">{round.toString().padStart(2, '0')}</span>
                </div>
                <button
                    onClick={nextTurn}
                    className="w-full bg-gm-crimson hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-glow-crimson group"
                >
                    <span className="text-lg">{t('modules:combat.controls.next_turn')}</span>
                    <Play fill="currentColor" size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Intelligent Initiative Section */}
            <div className="flex flex-col gap-4 p-4 bg-app-surface/40 rounded-xl border border-app-border/50 backdrop-blur-md mb-6 shadow-lg">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-accent" />
                        <h3 className="font-bold text-app-text/70 uppercase tracking-wider text-[10px]">{t('modules:combat.controls.auto_init.title')}</h3>
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
                            <span className="font-black tracking-tighter text-lg uppercase">{t('modules:combat.controls.auto_init.system')}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-[9px] text-indigo-100 font-medium opacity-90">
                            <span className="px-2 py-0.5 bg-white/20 rounded-md backdrop-blur-sm border border-white/10 tracking-widest uppercase">
                                {activeDriver.combat.initiativeCards 
                                    ? t('modules:combat.controls.auto_init.cards', { max: activeDriver.combat.initiativeCards }) 
                                    : t('modules:combat.controls.auto_init.formula', { formula: activeDriver.combat.initiativeFormula })}
                            </span>
                            <span className="opacity-60 italic uppercase tracking-tighter">
                                {activeDriver.combat.initiativeSort === 'asc' ? t('modules:combat.controls.auto_init.asc') : t('modules:combat.controls.auto_init.desc')}
                            </span>
                        </div>
                    </button>
                )}

                <div className="flex gap-2">
                    <Select
                        value={diceMax.toString()}
                        onChange={(value) => setDiceMax(Number(value))}
                        options={[4, 6, 8, 10, 12, 20, 100].map(d => ({
                            value: d.toString(),
                            label: `d${d}`,
                            icon: <Dices size={14} className="text-app-accent/60" />
                        }))}
                        className="flex-1 min-w-[100px]"
                        title={t('common:actions.select_dice')}
                    />
                    <button
                        onClick={() => rollAutoInitiative({ diceMax })}
                        className="bg-app-bg hover:bg-gm-crimson/20 border border-gm-crimson/50 text-gm-crimson px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors flex-[2] text-xs font-bold uppercase tracking-tighter"
                        title={t('modules:combat.controls.auto_init.standard_tooltip')}
                    >
                        <Dices size={14} />
                        <span>{t('modules:combat.controls.auto_init.standard')}</span>
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
                    <span>{t('modules:combat.controls.add_combatant')}</span>
                </button>

                <button
                    onClick={() => gmCustom('damage-calc')}
                    className="w-full bg-gm-crimson/10 hover:bg-gm-crimson/20 border border-gm-crimson/30 text-gm-crimson px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-glow-crimson/10 group"
                >
                    <Zap size={18} className="group-hover:animate-pulse" />
                    <span className="font-bold uppercase tracking-widest text-xs">{t('modules:combat.controls.damage_calc')}</span>
                </button>

                <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                         onClick={() => sortInitiative(false)}
                        className="bg-app-bg hover:bg-app-surface border border-app-border text-app-text/80 hover:text-app-text p-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
                        title={t('modules:combat.controls.sort_desc')}
                    >
                        <ArrowDown01 size={16} /> {t('common:actions.sort')}
                    </button>
                    <button
                        onClick={() => sortInitiative(true)}
                        className="bg-app-bg hover:bg-app-surface border border-app-border text-app-text/80 hover:text-app-text p-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
                        title={t('modules:combat.controls.sort_asc')}
                    >
                        <ArrowUp10 size={16} /> {t('common:actions.sort')}
                    </button>
                </div>
            </div>

            {/* Sync & Advanced */}
            <div className="mt-auto space-y-4 pt-6 border-t border-app-border">
                <button
                     onClick={() => {
                        syncCombatantHPToSession();
                        gmToast(t('modules:combat.messages.hp_synced'));
                    }}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                    <RefreshCw size={18} />
                    <span>{t('modules:combat.controls.sync_hp')}</span>
                </button>

                 <button 
                    onClick={handleSaveCombat} 
                    className="w-full bg-app-bg hover:bg-app-surface/60 border border-app-border flex items-center justify-center gap-2 py-3 rounded-lg text-app-text/70 hover:text-app-text transition-all shadow-lg group" 
                    title={t('modules:combat.controls.end_combat')}
                >
                    <Save size={18} className="group-hover:scale-110 transition-transform" /> 
                    <span className="font-bold uppercase tracking-wider text-xs">{t('modules:combat.controls.end_combat')}</span>
                </button>

                 <button
                    onClick={() => {
                        gmConfirm(t('modules:combat.messages.reset_confirm'), () => {
                            clearCombatants();
                        });
                    }}
                    className="w-full mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-600 py-2 border border-red-500/30 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Skull size={16} />
                    <span>{t('modules:combat.controls.reset_combat')}</span>
                </button>
            </div>
        </aside>
    );
};

export default CombatControls;
