import React from 'react';
import { Bouton } from '../../../components/socle/Bouton';
import { Panneau } from '../../../components/socle/Panneau';
import { Etiquette } from '../../../components/socle/Etiquette';
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
            <Panneau as="div" habillage="libre" className="text-center py-16 rounded-2xl border border-app-text/5 bg-app-text/[0.02]">
                <p className="text-sm italic text-app-muted">Aucun combat en cours.</p>
            </Panneau>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <Panneau as="div" habillage="libre" className="flex items-center justify-between gap-3 px-3 h-12 rounded-xl bg-app-text/[0.03] border border-app-text/5">
                <span className="flex items-baseline gap-2">
                    <span className="text-ui-10 font-black uppercase tracking-widest text-app-muted">Round</span>
                    <span className="text-xl font-black text-app-text tabular-nums">{combat.round ?? 1}</span>
                </span>
                <Bouton habillage="libre" cibleTactile
                    onClick={onNextTurn}
                    className="px-5 py-2 bg-accent text-app-on-accent rounded-lg flex items-center gap-1.5 font-black uppercase text-ui-11 active:scale-95 transition-all"
                >
                    Suivant <ChevronRight size={16} />
                </Bouton>
            </Panneau>

            <div className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1200px]:grid-cols-3 gap-2">
                {combat.combatants.map((c, i) => {
                    const isActive = i === combat.currentTurnIdx;
                    return (
                        <Panneau as="div" habillage="libre" key={c.id} className={`p-2.5 rounded-xl border transition-colors ${isActive ? 'bg-accent/10 border-accent' : 'bg-app-text/[0.03] border-app-text/5'}`}>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-black text-ui-11 tabular-nums transition-colors ${isActive ? 'bg-accent text-app-on-accent' : 'bg-app-text/10'}`}>{c.init}</div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`font-bold text-sm truncate transition-colors ${isActive ? 'text-accent' : 'text-app-text'}`}>{c.name}</span>
                                        <span className="text-ui-8 uppercase text-app-muted">{c.isPlayer ? 'Joueur' : 'Ennemi'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {(!isAventureMode || c.isPlayer) && (
                                        <>
                                            <Bouton habillage="libre" cibleTactile
                                                onClick={() => onUpdateHp(c.id, -1)}
                                                aria-label={`Retirer un point de vie à ${c.name}`}
                                                className="min-w-[44px] w-9 h-9 rounded-lg bg-etat-danger/20 text-etat-danger flex items-center justify-center active:scale-90"
                                            >
                                                -
                                            </Bouton>
                                            <div className="flex flex-col items-center min-w-[28px]">
                                                <span className="text-xs font-black tabular-nums">{c.hp}</span>
                                                <span className="text-ui-8 text-app-muted">PV</span>
                                            </div>
                                            <Bouton habillage="libre" cibleTactile
                                                onClick={() => onUpdateHp(c.id, 1)}
                                                aria-label={`Ajouter un point de vie à ${c.name}`}
                                                className="min-w-[44px] w-9 h-9 rounded-lg bg-etat-succes/20 text-etat-succes flex items-center justify-center active:scale-90"
                                            >
                                                +
                                            </Bouton>
                                        </>
                                    )}
                                    {isAventureMode && !c.isPlayer && (
                                        <div className="text-ui-10 font-black uppercase text-app-subtle tracking-widest italic pr-1">Caché</div>
                                    )}
                                </div>
                            </div>

                            {c.healthSystem && (
                                <div className="mt-2 pt-2 border-t border-app-text/5 flex flex-wrap gap-2 items-center">
                                    {/*
                                        Les formes lues sont celles que le MJ
                                        écrit. L'état de gravité vient du champ
                                        `state`, calculé par `HealthInterpreter`,
                                        au lieu d'être redeviné à partir d'un
                                        libellé que personne ne garantissait.
                                    */}
                                    {c.healthSystem.type === 'wounds' && (
                                        <Etiquette habillage="libre" ton={c.healthSystem.state === 'healthy' ? 'succes' : c.healthSystem.state === 'dead' ? 'danger' : 'alerte'} className={`text-ui-10 font-black uppercase px-2 py-0.5 rounded-full border ${
                                            c.healthSystem.state === 'healthy' ? 'border-etat-succes/30 text-etat-succes' :
                                            c.healthSystem.state === 'dead' ? 'bg-etat-danger text-app-bg animate-pulse' :
                                            'border-etat-alerte text-etat-alerte'
                                        }`}>
                                            {woundLabel(c.healthSystem) || 'Sain'}
                                        </Etiquette>
                                    )}
                                    {c.healthSystem.type === 'clocks' && (
                                        <div className="flex items-center gap-1.5 bg-app-text/5 px-2 py-0.5 rounded-full border border-app-text/10">
                                            <div className="w-2 h-2 rounded-full bg-etat-info" />
                                            <span className="text-ui-10 font-bold text-etat-info tabular-nums">
                                                {Number(c.healthSystem.data.filled ?? 0)} / {Number(c.healthSystem.data.segments ?? 0)}
                                            </span>
                                        </div>
                                    )}
                                    {c.healthSystem.type === 'boxes' && (
                                        <div className="flex gap-1">
                                            {((c.healthSystem.data.boxes as { filled: boolean }[]) ?? []).map((b, bi) => (
                                                <div
                                                    key={bi}
                                                    className={`w-2 h-2 rounded-sm border ${b.filled ? 'bg-etat-alerte border-etat-alerte' : 'border-app-text/20'}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {c.healthSystem.type === 'anatomy' && (
                                        <div className="flex items-center gap-1 text-ui-10 text-etat-danger font-bold uppercase">
                                            <Shield size={10} />
                                            {Object.values((c.healthSystem.data.parts as Record<string, { status: string }>) ?? {})
                                                .filter(p => p.status !== 'healthy').length} Blessures
                                        </div>
                                    )}
                                </div>
                            )}
                        </Panneau>
                    );
                })}
            </div>
        </div>
    );
};

export default RemoteCombatTracker;
