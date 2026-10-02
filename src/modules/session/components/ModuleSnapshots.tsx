import React from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Pause, Play, Volume2, EyeOff, HeartCrack, CheckCircle, Skull, Zap, Layers, Swords, Dices, Repeat } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { fractionDeVie } from '../../combat/logic/SanteDuCombattant';
import { useMusicStore } from '../../music/useMusicStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { Panneau, Etiquette } from '../../../components/socle';
import { CockpitMessenger } from './CockpitMessenger';

/**
 * **Ce qui tourne ailleurs, en lecture rapide** — la colonne droite du
 * cockpit, refonte L5, étape 2 : le combat et son round, les conditions, les
 * deux platines, les cartes, le jet rapide et son historique.
 */
const ModuleSnapshots: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { rollDice, diceRolls, clearDiceRolls } = useSessionOSStore();
    const { combatants, currentTurnIdx, round } = useCombatStore();
    const { deckA, deckB, masterVolume, setMasterVolume, playDeck, stopDeck } = useMusicStore();
    const setActiveModule = useSessionStore(s => s.setActiveModule);

    const lastRoll = diceRolls[0];

    const allActiveStatuses = combatants.flatMap(c =>
        (c.statuses || []).map(s => ({ ...s, combatantName: c.name }))
    );

    const getStatusIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('blind') || n.includes('aveugl')) return <EyeOff size={14} className="text-etat-alerte" />;
        if (n.includes('fear') || n.includes('peur') || n.includes('fright')) return <HeartCrack size={14} className="text-etat-danger" />;
        if (n.includes('inspired') || n.includes('inspir')) return <Zap size={14} className="text-etat-info" />;
        if (n.includes('poison') || n.includes('toxin') || n.includes('bleed') || n.includes('saign')) return <Skull size={14} className="text-etat-succes" />;
        return <CheckCircle size={14} className="text-app-muted" />;
    };

    const titre = (icone: React.ReactNode, libelle: React.ReactNode, aside?: React.ReactNode) => (
        <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
            <h4 className="flex min-w-0 items-center gap-2 text-ui-10 font-black uppercase tracking-widest text-app-muted">
                <span className="shrink-0 text-accent">{icone}</span>
                <span className="truncate">{libelle}</span>
            </h4>
            {aside}
        </div>
    );

    return (
        <aside className="h-full col-span-3 bg-app-surface/60 border-l border-app-border p-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
            {/* Le combat : l'ordre, le tour actif, et la porte vers Combat-OS */}
            <Panneau className="flex-shrink-0">
                {titre(<Swords size={14} />, t('modules:session.snapshots.combat_order'),
                    combatants.length > 0 && <Etiquette ton="danger" className="whitespace-nowrap">{t('modules:session.snapshots.round_hash', { number: round })}</Etiquette>)}
                <div className="space-y-1.5 px-3 pb-3">
                    {combatants.slice(0, 6).map((c, idx) => {
                        const isCurrentTurn = idx === currentTurnIdx;
                        const part = fractionDeVie(c);
                        return (
                            <div
                                key={c.id}
                                title={isCurrentTurn ? t('modules:session.snapshots.agencement.tour_actif') : undefined}
                                className={`flex items-center gap-3 rounded-lg border px-2 py-1.5 transition-all ${
                                    isCurrentTurn ? 'border-accent/50 bg-accent/10' : 'border-transparent opacity-70'
                                }`}
                            >
                                <span className={`w-8 shrink-0 text-center font-mono text-sm font-black ${isCurrentTurn ? 'text-accent' : 'text-app-muted'}`}>{c.init}</span>
                                <div className="min-w-0 flex-1">
                                    <p className={`truncate text-xs font-black uppercase ${isCurrentTurn ? 'text-app-text' : 'text-app-muted'}`}>{c.name}</p>
                                    {part !== null && (
                                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-app-bg">
                                            <div
                                                className={`h-full transition-all duration-500 ${part > 0.5 ? 'bg-etat-succes' : part > 0.25 ? 'bg-etat-alerte' : 'bg-etat-danger'}`}
                                                style={{ width: `${part * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {combatants.length > 6 && (
                        <p className="text-center text-ui-10 italic text-app-subtle">{t('modules:session.snapshots.others_count', { count: combatants.length - 6 })}</p>
                    )}
                    {combatants.length === 0 && (
                        <p className="py-2 text-center text-ui-10 italic text-app-subtle">{t('session.snapshots.no_active_encounter')}</p>
                    )}
                    <button
                        onClick={() => setActiveModule('combat')}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-app-border py-2 text-ui-10 font-black uppercase tracking-widest text-accent transition-all hover:border-accent/50 hover:bg-accent/10"
                    >
                        <Swords size={12} />{t('modules:session.snapshots.agencement.ouvrir_combat')}
                    </button>
                </div>
            </Panneau>

            {/* Les conditions actives, par combattant */}
            <Panneau className="flex-shrink-0">
                {titre(<Zap size={14} />, t('session.snapshots.active_conditions'),
                    allActiveStatuses.length > 0 && <Etiquette>{allActiveStatuses.length}</Etiquette>)}
                <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                    {allActiveStatuses.slice(0, 8).map((s, idx) => (
                        <span key={idx} className="flex max-w-full items-center gap-1.5 rounded-md border border-app-border bg-app-bg/40 px-2 py-1" title={`${s.name} (${s.combatantName})`}>
                            <span className="shrink-0">{getStatusIcon(s.name)}</span>
                            <span className="truncate text-ui-10 text-app-text"><span className="font-bold">{s.combatantName}</span> · {s.name}</span>
                        </span>
                    ))}
                    {allActiveStatuses.length > 8 && (
                        <span className="text-ui-10 italic text-app-subtle">{t('modules:session.snapshots.others_count', { count: allActiveStatuses.length - 8 })}</span>
                    )}
                    {allActiveStatuses.length === 0 && <p className="text-ui-10 italic text-app-subtle">{t('session.snapshots.no_condition')}</p>}
                </div>
            </Panneau>

            {/* Les deux platines, chacune avec son titre, son état et sa boucle */}
            <Panneau className="flex-shrink-0">
                {titre(<Music size={14} />, t('session.snapshots.audio_environment'))}
                <div className="space-y-2 px-3 pb-3">
                    {([['A', deckA], ['B', deckB]] as const).map(([lettre, platine]) => (
                        <div key={lettre} className={`flex items-center gap-3 rounded-lg border p-2 ${platine.isPlaying ? 'border-accent/40 bg-accent/5' : 'border-app-border bg-app-bg/40'}`}>
                            <span className={`w-6 shrink-0 text-center font-display text-sm font-black ${platine.isPlaying ? 'text-accent' : 'text-app-subtle'}`}>{lettre}</span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-app-text">{platine.activeTrackLabel || t('session.snapshots.audio_silence')}</p>
                                <p className="flex items-center gap-1.5 text-ui-9 font-black uppercase tracking-widest text-app-muted">
                                    {platine.isPlaying ? t('modules:session.snapshots.agencement.en_lecture') : t('modules:session.snapshots.agencement.a_l_arret')}
                                    {platine.isLooping && <Repeat size={10} className="text-accent" />}
                                </p>
                            </div>
                            <button
                                onClick={() => platine.isPlaying ? stopDeck(lettre) : playDeck(lettre)}
                                disabled={!platine.isPlaying && !platine.activePadId}
                                className="shrink-0 rounded-md p-1.5 text-app-muted transition-colors hover:text-accent disabled:opacity-30"
                                title={t('session.snapshots.audio_deck_label', { deck: lettre })}
                            >
                                {platine.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                        <Volume2 size={14} className="shrink-0 text-app-muted" />
                        <div className="relative h-1.5 flex-1 rounded-full bg-app-bg">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={masterVolume}
                                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                title={t('modules:session.snapshots.agencement.volume_general')}
                            />
                            <div className="h-full rounded-full bg-accent transition-all duration-150" style={{ width: `${masterVolume * 100}%` }} />
                        </div>
                        <span className="w-9 shrink-0 text-right font-mono text-ui-10 font-bold text-app-text">{Math.round(masterVolume * 100)}%</span>
                    </div>
                </div>
            </Panneau>

            {/* Les cartes du destin, et la messagerie du cockpit */}
            <Panneau className="flex-shrink-0">
                {titre(<Layers size={14} />, t('session.snapshots.cards_destiny'),
                    <button onClick={() => useSessionOSStore.getState().setCurrentView('deck-library')} className="text-ui-10 font-black uppercase tracking-widest text-accent hover:underline">
                        {t('session.snapshots.manage')}
                    </button>)}
                <div className="space-y-3 px-3 pb-3">
                    <button
                        onClick={() => useSessionOSStore.getState().setCurrentView('deck-player')}
                        className="group flex w-full items-center gap-3 rounded-lg border border-app-border bg-app-bg/40 p-2 transition-all hover:border-gm-gold/40"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-app-border text-app-muted transition-colors group-hover:text-gm-gold">
                            <Layers size={16} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-app-text transition-colors group-hover:text-gm-gold">Deck-OS</span>
                    </button>
                    <CockpitMessenger />
                </div>
            </Panneau>

            {/* Le jet rapide, et ce qu'il a donné */}
            <Panneau className="mt-auto flex-shrink-0">
                {titre(<Dices size={14} />, t('session.snapshots.quick_roll'),
                    diceRolls.length > 0 && (
                        <button onClick={() => clearDiceRolls()} className="text-ui-10 font-black uppercase tracking-widest text-app-subtle hover:text-etat-danger">
                            {t('modules:session.snapshots.agencement.effacer')}
                        </button>
                    ))}
                <div className="px-3 pb-3">
                    <div className="grid grid-cols-7 gap-1">
                        {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
                            <button
                                key={sides}
                                onClick={() => rollDice(sides)}
                                className={`flex h-11 flex-col items-center justify-center rounded-lg border transition-all ${sides === 20
                                        ? 'border-accent/50 bg-accent/15 hover:bg-accent/25'
                                        : 'border-app-border bg-app-bg/40 hover:border-accent/40'
                                    }`}
                            >
                                <span className={`font-mono text-ui-9 ${sides === 20 ? 'text-accent' : 'text-app-muted'}`}>d{sides === 100 ? '%' : sides}</span>
                                <span className="text-xs font-bold text-app-text">{lastRoll?.die === sides ? lastRoll.result : '–'}</span>
                            </button>
                        ))}
                    </div>
                    {/* Le bouton « Historique » effaçait les jets : on montre
                        désormais les derniers, et « Effacer » dit ce qu'il fait. */}
                    {diceRolls.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {diceRolls.slice(0, 5).map(jet => (
                                <div key={jet.timestamp} className="flex items-center justify-between rounded-md bg-app-bg/40 px-2 py-1 text-ui-10">
                                    <span className="font-mono text-app-subtle">{new Date(jet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="font-bold text-app-muted">d{jet.die === 100 ? '%' : jet.die}</span>
                                    <span className="font-mono font-black text-app-text">{jet.result}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Panneau>
        </aside>
    );
};

export default ModuleSnapshots;
