import React from 'react';
import { ChevronRight, Shield } from 'lucide-react';
import { type RemoteCombatant } from '../types/remote.types';
import { woundLabel } from '../../session/logic/HealthInterpreter';

/**
 * **Le suivi de combat, densifié le 2026-09-05.**
 *
 * L'en-tête occupait 120 px pour un chiffre et un bouton — alors que le round et
 * « Suivant » sont la même information, *où en est le tour*, et se lisent mieux
 * sur une seule ligne. Les combattants passaient en une ou deux colonnes ; ils en
 * prennent jusqu'à trois sur une tablette en paysage, ce qui met une initiative
 * de six à l'écran sans défilement.
 */

interface RemoteCombatTrackerProps {
    combat: {
        combatants: RemoteCombatant[];
        currentTurnIdx: number;
        round: number;
    };
    isAventureMode: boolean;
    onNextTurn: () => void;
    onUpdateHp: (id: string, delta: number) => void;
}

const RemoteCombatTracker: React.FC<RemoteCombatTrackerProps> = ({
    combat,
    isAventureMode,
    onNextTurn,
    onUpdateHp
}) => {
    if (!combat?.combatants?.length) {
        return (
            <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.02]">
                <p className="text-sm italic text-slate-500">Aucun combat en cours.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 px-3 h-12 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="flex items-baseline gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Round</span>
                    <span className="text-xl font-black text-white tabular-nums">{combat.round ?? 1}</span>
                </span>
                <button
                    onClick={onNextTurn}
                    className="px-5 py-2 bg-accent text-app-bg rounded-lg flex items-center gap-1.5 font-black uppercase text-[11px] active:scale-95 transition-all"
                >
                    Suivant <ChevronRight size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1200px]:grid-cols-3 gap-2">
                {combat.combatants.map((c, i) => {
                    const isActive = i === combat.currentTurnIdx;
                    return (
                        <div key={c.id} className={`p-2.5 rounded-xl border transition-colors ${isActive ? 'bg-accent/10 border-accent' : 'bg-white/[0.03] border-white/5'}`}>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-black text-[11px] tabular-nums transition-colors ${isActive ? 'bg-accent text-app-bg' : 'bg-white/10'}`}>{c.init}</div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`font-bold text-sm truncate transition-colors ${isActive ? 'text-accent' : 'text-slate-200'}`}>{c.name}</span>
                                        <span className="text-[8px] uppercase text-slate-500">{c.isPlayer ? 'Joueur' : 'Ennemi'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {(!isAventureMode || c.isPlayer) && (
                                        <>
                                            <button
                                                onClick={() => onUpdateHp(c.id, -1)}
                                                aria-label={`Retirer un point de vie à ${c.name}`}
                                                className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center active:scale-90"
                                            >
                                                -
                                            </button>
                                            <div className="flex flex-col items-center min-w-[28px]">
                                                <span className="text-xs font-black tabular-nums">{c.hp}</span>
                                                <span className="text-[8px] text-slate-500">PV</span>
                                            </div>
                                            <button
                                                onClick={() => onUpdateHp(c.id, 1)}
                                                aria-label={`Ajouter un point de vie à ${c.name}`}
                                                className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center active:scale-90"
                                            >
                                                +
                                            </button>
                                        </>
                                    )}
                                    {isAventureMode && !c.isPlayer && (
                                        <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest italic pr-1">Caché</div>
                                    )}
                                </div>
                            </div>

                            {c.healthSystem && (
                                <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-2 items-center">
                                    {/*
                                        Les formes lues sont celles que le MJ
                                        écrit. L'état de gravité vient du champ
                                        `state`, calculé par `HealthInterpreter`,
                                        au lieu d'être redeviné à partir d'un
                                        libellé que personne ne garantissait.
                                    */}
                                    {c.healthSystem.type === 'wounds' && (
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            c.healthSystem.state === 'healthy' ? 'border-emerald-500/30 text-emerald-400' :
                                            c.healthSystem.state === 'dead' ? 'bg-rose-600 text-white animate-pulse' :
                                            'border-amber-500 text-amber-400'
                                        }`}>
                                            {woundLabel(c.healthSystem) || 'Sain'}
                                        </span>
                                    )}
                                    {c.healthSystem.type === 'clocks' && (
                                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-[10px] font-bold text-blue-400 tabular-nums">
                                                {Number(c.healthSystem.data.filled ?? 0)} / {Number(c.healthSystem.data.segments ?? 0)}
                                            </span>
                                        </div>
                                    )}
                                    {c.healthSystem.type === 'boxes' && (
                                        <div className="flex gap-1">
                                            {((c.healthSystem.data.boxes as { filled: boolean }[]) ?? []).map((b, bi) => (
                                                <div
                                                    key={bi}
                                                    className={`w-2 h-2 rounded-sm border ${b.filled ? 'bg-orange-500 border-orange-400' : 'border-white/20'}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {c.healthSystem.type === 'anatomy' && (
                                        <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold uppercase">
                                            <Shield size={10} />
                                            {Object.values((c.healthSystem.data.parts as Record<string, { status: string }>) ?? {})
                                                .filter(p => p.status !== 'healthy').length} Blessures
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RemoteCombatTracker;
