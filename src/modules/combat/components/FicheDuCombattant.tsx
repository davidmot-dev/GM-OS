import React from 'react';
import { BookMarked, Users } from 'lucide-react';
import { useModalStore } from '../../../stores/useModalStore';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useBestiaireStore } from '../useBestiaireStore';
import { gmToast } from '../../../stores/useToastStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { HealthInterpreter } from '../../session/logic/HealthInterpreter';
import { champsAMontrer, ficheDuCombattant } from '../logic/ficheDuCombattant';
import { decrireLaSante, santeDeDepart, valeurDuChamp } from '../logic/SanteDuCombattant';
import { nomDeGabarit, origineOuDefaut } from '../logic/promotionDuCombattant';
import { archetypeParId } from '../logic/archetypes';

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
    const updateCombatant = useCombatStore(e => e.updateCombatant);
    const { players, entities, customSheetTemplates, getActiveDriver, addEntity, activeCampaignId } = useSessionOSStore();
    const enregistrerAuBestiaire = useBestiaireStore(e => e.enregistrer);

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
    const origine2 = origineOuDefaut(combattant.origineFabriquee);
    const dejaEnCampagne = !!combattant.sourceEntityId || !!combattant.sourcePlayerId;

    const rangerAuBestiaire = () => {
        if (!driver) {
            gmToast('Aucun système de jeu actif : le gabarit n’aurait pas d’échelle.', 'error');
            return;
        }
        const nom = nomDeGabarit(combattant.name);
        enregistrerAuBestiaire({
            jeuId: driver.id,
            nom,
            archetypeId: origine2.archetypeId,
            rangId: origine2.rangId,
            sheetData: valeurs as Record<string, number | string | boolean>,
            notes: combattant.roleplayingNotes || archetypeParId(origine2.archetypeId).resume,
        });
        gmToast(`« ${nom} » est au bestiaire`, 'success');
    };

    const verserDansLaCampagne = () => {
        if (!activeCampaignId) {
            gmToast('Aucune campagne ouverte : rien où le ranger.', 'error');
            return;
        }
        const depart = santeDeDepart(
            driver?.combat?.santeDeDepart,
            champ => valeurDuChamp(valeurs, champ),
        ) ?? combattant.hpMax ?? 10;

        /*
          **On garde le nom de l'exemplaire, numéro compris.** Le bestiaire range
          un modèle — « Tireur » —, la campagne accueille un individu : celui-là
          est « Tireur 2 », il a peut-être déjà encaissé, et le renommer
          empêcherait le meneur de le retrouver dans l'ordre du tour.
        */
        addEntity({
            name: combattant.name,
            type: 'monster',
            role: 'hostile',
            status: 'alive',
            avatar: combattant.avatar || '',
            hp: combattant.hp ?? depart,
            maxHp: combattant.hpMax ?? depart,
            ac: 0,
            speed: 0,
            initiative: combattant.init ?? 0,
            description: archetypeParId(origine2.archetypeId).resume,
            roleplayingNotes: combattant.roleplayingNotes || '',
            gmSecretInfo: combattant.gmSecretInfo || '',
            linkedMapIds: [],
            campaignId: activeCampaignId,
            templateId: gabarit?.id,
            sheetData: valeurs,
            healthSystem: combattant.healthSystem
                ?? HealthInterpreter.createDefault(driver?.combat?.defaultHealthType ?? 'hp'),
        } as Parameters<typeof addEntity>[0]);

        /*
          **Et le combattant est RATTACHÉ à la fiche qu'on vient de créer.** Sans
          ce lien, on aurait deux exemplaires de la même créature — celui du
          plateau et celui de la campagne — qui divergeraient dès le premier coup
          encaissé. *Promouvoir, ce n'est pas copier : c'est donner une adresse à
          ce qui n'en avait pas.*

          ⛔ **L'identifiant se relit, il ne se devine pas.** Première version :
          je fabriquais un `crypto.randomUUID()` et le passais à `addEntity`.
          Mais `addEntity` pose le sien (`e-${Date.now()}`) et **ignore celui
          qu'on lui donne** — le rattachement aurait donc pointé vers une fiche
          inexistante, et la carte de combat aurait cherché en silence une
          entité qui n'existe pas. On relit donc ce qui a réellement été créé.
        */
        const cree = [...useSessionOSStore.getState().entities]
            .reverse()
            .find(e => e.campaignId === activeCampaignId && e.name === combattant.name);

        if (cree) {
            updateCombatant(combattant.id, { sourceEntityId: cree.id });
        } else {
            /* Le PNJ existe quand même : seul le lien manque, et on le dit. */
            gmToast('PNJ créé, mais le combattant n’a pas pu y être rattaché.', 'warning');
        }
        gmToast(`« ${combattant.name} » rejoint la campagne`, 'success');
    };

    return (
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <header className="space-y-1">
                <h3 className="text-lg font-black text-app-text">{combattant.name}</h3>
                <p className="text-ui-10 font-black uppercase tracking-widest text-slate-500">
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
                    <h4 className="text-ui-9 font-black uppercase tracking-[0.2em] text-slate-500">
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
                                    <span className="text-ui-11 text-slate-400 truncate">{champ.label}</span>
                                    <span className="text-sm font-black font-mono text-app-text shrink-0">
                                        {affichage}
                                        {champ.max ? <span className="text-ui-9 text-slate-600 font-bold"> / {champ.max}</span> : null}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}

            {combattant.roleplayingNotes && (
                <section className="space-y-1">
                    <h4 className="text-ui-9 font-black uppercase tracking-[0.2em] text-slate-500">Comment il se bat</h4>
                    <p className="text-xs text-slate-300 italic">{combattant.roleplayingNotes}</p>
                </section>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-app-border/30">
                <button
                    onClick={rangerAuBestiaire}
                    className="flex-1 px-3 py-2 rounded-xl border border-app-border/50 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all text-ui-10 font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                    title="Ranger ce modèle pour le refabriquer plus tard"
                >
                    <BookMarked size={12} /> Au bestiaire
                </button>
                {/*
                  Le versement en campagne ne s'offre que pour ce qui n'y est pas
                  déjà : le proposer sur un PJ ou un PNJ enregistré fabriquerait
                  un doublon de lui-même.
                */}
                {!dejaEnCampagne && (
                    <button
                        onClick={verserDansLaCampagne}
                        className="flex-1 px-3 py-2 rounded-xl border border-app-border/50 text-slate-300 hover:text-accent hover:border-accent/40 transition-all text-ui-10 font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                        title="En faire un PNJ de la campagne, et l’y rattacher"
                    >
                        <Users size={12} /> Dans la campagne
                    </button>
                )}
            </div>

            <footer className="pt-1 text-ui-9 font-bold uppercase tracking-widest text-slate-600">
                {origine === 'campagne' && 'Valeurs lues sur la fiche de campagne — à jour.'}
                {origine === 'combattant' && 'Valeurs portées par le combattant — il n’existe que sur ce plateau.'}
                {origine === 'aucune' && 'Ce combattant n’a aucune caractéristique enregistrée.'}
            </footer>
        </div>
    );
};

export default FicheDuCombattant;
