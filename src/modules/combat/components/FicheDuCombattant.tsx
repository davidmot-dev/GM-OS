import React from 'react';
import { useModalStore } from '../../../stores/useModalStore';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { champsAMontrer, ficheDuCombattant } from '../logic/ficheDuCombattant';
import { decrireLaSante } from '../logic/SanteDuCombattant';

/**
 * **La fiche d'un combattant, en lecture.**
 *
 * *Question de David le 2026-09-03 : « comment faire pour revoir la fiche de ces
 * nouveaux combattants ? »* La réponse était : on ne pouvait pas. Les
 * adversaires de la Fabrique portent leurs caractéristiques **sur eux** — ils
 * n'ont pas de fiche en campagne —, et rien dans Combat-OS ne savait montrer
 * autre chose que les deux ou trois jauges déclarées par le pilote.
 *
 * **En lecture seule, et c'est un choix.** Les jauges de la carte de combat se
 * modifient déjà d'un clic ; ce panneau sert à *revoir* — savoir ce que vaut
 * l'adversaire qu'on vient de fabriquer. Y remettre des champs modifiables
 * ferait deux endroits pour changer la même valeur, et *deux écrivains pour une
 * même donnée est le défaut que ce projet paie le plus souvent.*
 *
 * Il dit aussi **d'où viennent les valeurs** : de la campagne ou du plateau. Un
 * PJ montre sa fiche à jour, un adversaire fabriqué montre la sienne — et
 * savoir lequel évite de chercher une modification là où elle ne sera pas.
 */
export const FicheDuCombattant: React.FC = () => {
    const { defaultValue } = useModalStore();
    const combatants = useCombatStore(e => e.combatants);
    const { players, entities, customSheetTemplates, getActiveDriver } = useSessionOSStore();

    const combatantId = (defaultValue as { combatantId?: string } | undefined)?.combatantId;
    const combattant = combatants.find(c => c.id === combatantId);

    if (!combattant) {
        return (
            <p className="p-8 text-center text-slate-500 text-sm">
                Ce combattant n’est plus sur le plateau.
            </p>
        );
    }

    const source = combattant.isPlayer
        ? players.flatMap(p => p.characters).find(c => c.id === combattant.sourcePlayerId)
        : entities.find(e => e.id === combattant.sourceEntityId);

    const driver = getActiveDriver();
    const gabarits = [...DEFAULT_SHEET_TEMPLATES, ...(customSheetTemplates || [])];
    const { valeurs, gabarit, origine } = ficheDuCombattant(
        combattant, source, gabarits, driver?.templateId,
    );

    const blocs = champsAMontrer(gabarit);
    const sante = decrireLaSante(combattant);

    return (
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <header className="space-y-1">
                <h3 className="text-lg font-black text-app-text">{combattant.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {combattant.isPlayer ? 'Personnage joueur' : `Camp : ${combattant.faction}`}
                    {sante ? ` · ${sante}` : ''}
                </p>
            </header>

            {blocs.length === 0 && (
                <p className="text-sm text-slate-400">
                    {gabarit
                        ? 'Ce gabarit ne déclare aucune caractéristique à afficher.'
                        : 'Aucun gabarit de fiche : le système de jeu actif n’en déclare pas.'}
                </p>
            )}

            {blocs.map(bloc => (
                <section key={bloc.section} className="space-y-2">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {bloc.section}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
                        {bloc.champs.map(champ => {
                            const valeur = valeurs[champ.id];
                            /*
                              **Un champ vide se dit « — », jamais « 0 ».** Un
                              zéro affiché se lit comme une valeur du jeu, et il
                              ferait croire à un adversaire incapable là où il
                              n'y a qu'une case jamais remplie.
                            */
                            const affichage = valeur === undefined || valeur === null || valeur === ''
                                ? '—'
                                : typeof valeur === 'boolean' ? (valeur ? 'oui' : 'non') : String(valeur);

                            return (
                                <div key={champ.id} className="flex items-baseline justify-between gap-3 border-b border-app-border/20 pb-1">
                                    <span className="text-[11px] text-slate-400 truncate">{champ.label}</span>
                                    <span className="text-sm font-black font-mono text-app-text shrink-0">
                                        {affichage}
                                        {champ.max ? <span className="text-[9px] text-slate-600 font-bold"> / {champ.max}</span> : null}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}

            {combattant.roleplayingNotes && (
                <section className="space-y-1">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Comment il se bat</h4>
                    <p className="text-xs text-slate-300 italic">{combattant.roleplayingNotes}</p>
                </section>
            )}

            <footer className="pt-1 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                {origine === 'campagne' && 'Valeurs lues sur la fiche de campagne — à jour.'}
                {origine === 'combattant' && 'Valeurs portées par le combattant — il n’existe que sur ce plateau.'}
                {origine === 'aucune' && 'Ce combattant n’a aucune caractéristique enregistrée.'}
            </footer>
        </div>
    );
};

export default FicheDuCombattant;
