import React from 'react';
import { ResolvedImage } from '../ResolvedImage';
import type { Combatant } from '../../modules/combat/useCombatStore';
import { abregerLaSante } from '../../modules/combat/logic/SanteDuCombattant';

interface HubCombatTrackerProps {
    combatants: Combatant[];
    currentTurnIdx: number;
    round: number;
}

export const HubCombatTracker: React.FC<HubCombatTrackerProps> = ({ 
    combatants, 
    currentTurnIdx, 
    round 
}) => {
    const visibleCombatants = combatants.filter(c => 
        c.isPlayer || !c.statuses.some(s => {
            const n = s.name.toLowerCase();
            return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
        })
    );

    if (visibleCombatants.length === 0) return null;

    // Find active combatant among visible ones
    const realActiveCombatant = combatants[currentTurnIdx];
    const activeCombatant = (realActiveCombatant && (realActiveCombatant.isPlayer || !realActiveCombatant.statuses.some(s => {
        const n = s.name.toLowerCase();
        return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
    }))) ? realActiveCombatant : null;
    
    const upcomingCombatants = visibleCombatants.filter(c => combatants.indexOf(c) > currentTurnIdx);

    return (
        <div className="fixed right-0 top-0 w-80 h-full z-50 bg-app-surface/40 backdrop-blur-xl border-l border-app-border/40 flex flex-col gap-4 p-6 shadow-2xl animate-in slide-in-from-right duration-500 pointer-events-auto" aria-label="Combat Tracker">
            <div className="flex items-center justify-between mb-4 border-b border-app-border/40 pb-4">
                <div className="flex flex-col">
                    <h1 className="text-app-text text-xl font-bold tracking-tight">Initiative</h1>
                    <p className="text-rose-400 text-xs font-bold uppercase">Round {round} • Tour {currentTurnIdx + 1}</p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {/* Active Turn */}
                {activeCombatant && (
                    <div className="flex flex-col gap-4 px-4 py-4 rounded-xl bg-rose-500/10 ring-1 ring-rose-500/40 shadow-glow-crimson relative overflow-hidden transition-all duration-700">
                        <div className="flex items-center gap-4">
                            <ResolvedImage className="size-10 rounded-full border-2 border-rose-500" src={activeCombatant.avatar} alt={activeCombatant.name} fallback={activeCombatant.name.charAt(0)} />
                            <div className="flex flex-col">
                                <p className="text-app-text text-sm font-bold leading-none">{activeCombatant.name}</p>
                                <p className="text-rose-400 text-ui-10 font-bold uppercase mt-1">Tour Actif</p>
                            </div>
                            <div className="ml-auto text-rose-500 material-symbols-outlined">double_arrow</div>
                        </div>

                        {/*
                            **L'état de santé, quel que soit le modèle.**

                            Ces deux blocs lisaient `healthSystem.data` à la
                            main, chacun de son côté, et ne connaissaient que
                            trois modèles au mieux : un combattant en anatomie
                            n'affichait **rien**, et les cases manquaient dans la
                            file d'attente. `abregerLaSante` les connaît tous les
                            cinq — le rendu reste ici, la lecture non.

                            Les points de vie restent tus, et c'est la même règle
                            qu'avant : le Hub est l'écran partagé de la table, et
                            le compte exact des PV d'un adversaire renseigne les
                            joueurs sur ce que le MJ n'a pas choisi de leur dire.
                            Elle vit désormais dans `abregerLaSante`, qui se tait
                            par défaut, plutôt que dans la mémoire de celui qui
                            écrira le prochain écran.
                        */}
                        {abregerLaSante(activeCombatant) && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-rose-500/20">
                                <div className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40">
                                    <span className="text-ui-10 font-black text-blue-400 uppercase tracking-tighter">
                                        {abregerLaSante(activeCombatant)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Queue */}
                {upcomingCombatants.slice(0, 5).map((combatant, idx) => (
                    <div key={combatant.id} className="flex flex-col gap-2 p-3 rounded-xl bg-app-text/5 border border-app-border/10 opacity-80 hover:opacity-100 hover:bg-app-text/10 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <ResolvedImage className="size-10 rounded-full border border-app-border/20 group-hover:border-app-text transition-colors" src={combatant.avatar} alt={combatant.name} fallback={combatant.name.charAt(0)} />
                            <div className="flex flex-col">
                                <p className="text-app-text text-sm font-medium leading-tight">{combatant.name}</p>
                                <p className="text-app-text/40 text-ui-10 uppercase tracking-tighter">{idx === 0 ? 'Suivant' : 'À venir'}</p>
                            </div>

                            {/* Pas de barre de vie ici non plus : une barre dit la
                                même chose qu'un nombre, en moins précis. */}
                        </div>
                        
                        {/* La même lecture que pour le tour actif, en plus petit. */}
                        {abregerLaSante(combatant) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-ui-8 font-black text-blue-400 uppercase px-1.5 rounded bg-blue-500/10 border border-blue-500/20">
                                    {abregerLaSante(combatant)}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
