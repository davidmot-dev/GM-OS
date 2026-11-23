import React, { useState } from 'react';
import PanneauDeJet from '../../session/components/PanneauJetDeFiche';
import { AppliquerALaCible } from './AppliquerALaCible';
import { DegatsDArgyropee } from './DegatsDArgyropee';
import { DommagesDeNephilim } from './DommagesDeNephilim';
import { DommagesDuVoyageur } from './DommagesDuVoyageur';
import { attaqueDuVoyageur } from '../logic/dommagesDuVoyageur';
import type { RollResult } from '../../dice/DiceEngine';
import { armesDeBarbarians, armesDArgyropee, armesDeNoc, armesDeShadowrun, attaqueDeCrimes, attaqueDeNoc, attaqueDeDegenesis, attaqueDeDeltaGreen, attaqueDeShadowrun, attaqueDeStarTrek, attaqueDeTorg, ndDeTorg, type ArmeProposee } from '../logic/attaqueDeLAdversaire';
import DommagesDeltaGreen from './DommagesDeltaGreen';
import type { ProtectionLue } from '../logic/protectionDeLaCible';
import { ecrireLaFicheDuCombattant, valeursDuCombattant } from '../ficheDesCombattants';
import { useCombatStore } from '../useCombatStore';
import { champsProposes, composantesARetenir, compositionValable } from '../../dice/demandeDeJet';
import { cleCocDuCombattant, libelleDeLAttaque, regleDesDegats } from '../logic/jetDuCombattant';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **Lancer un test pour un adversaire** — Vampire, 17/11/2026. David : « je ne sais pas lancer de
 * jet à partir de la fiche d'un lieutenant », puis « oui fais le ».
 *
 * La fiche d'un combattant s'ouvrait en lecture seule : un adversaire posé depuis le bestiaire
 * (« Armes à feu 5 », p. 371) n'avait aucun panneau de jet, ni au plateau ni en PNJ de campagne. Le
 * panneau est celui d'un personnage — même descripteur, mêmes menus, même mécanique —, sur les
 * valeurs que la fiche du combattant montre déjà. Il écrit par `ecrireLaFicheDuCombattant`, le seul
 * écrivain : sur la fiche de campagne d'un PNJ rattaché, sur le plateau sinon. Une relance par la
 * Volonté, un test d'Exaltation y laissent donc leurs marques, comme chez un joueur.
 *
 * **Ouvert par « Attaquer »** (registre § 263, T5 à T7, 19/11/2026) : la cible de la carte en tête,
 * la dernière attaque du combattant proposée d'emblée (décision D4 de David), et, après le jet,
 * « Appliquer à [cible] » (`AppliquerALaCible`). Ouvert par « Fiche », il reste tel qu'avant : rien
 * n'y est retenu, prérempli ni appliqué.
 *
 * Qui peut lancer d'ici : `logic/jetDuCombattant.ts`.
 */
export const JetDuCombattant: React.FC<{
    combattant: Combatant;
    driver: GameDriver;
    gabarit: SheetTemplate;
    valeurs: Record<string, unknown>;
    campaignId?: string | null;
    /**
     * La cible de la carte (§ 263, T5) : dite en tête du jet, pour que le meneur sache qui il
     * attaque sans revenir au plateau. Le coup lui sera appliqué en un geste en T7.
     */
    cible?: (Pick<Combatant, 'id' | 'name'> & Partial<Pick<Combatant, 'sourcePlayerId' | 'sourceEntityId'>>) | null;
    /** Ouverte par « Attaquer » : le jet passe au premier plan, et l'attaque se retient (T6). */
    auPremierPlan?: boolean;
    /** T9 : les armes du catalogue et la protection de la cible, pour « Appliquer à [cible] ». */
    armes?: readonly ArmeProposee[];
    protectionDeLaCible?: ProtectionLue | null;
    /** T9 : le jet d'attaque proposé quand l'adversaire n'a pas encore de dernière attaque. */
    attaqueProposee?: Record<string, string> | null;
}> = ({ combattant, driver, gabarit, valeurs, campaignId, cible, auPremierPlan = false, armes, protectionDeLaCible, attaqueProposee }) => {
    /*
      **La dernière attaque, relue contre la fiche d'aujourd'hui** : un champ qui a disparu, ou une
      composante devenue obligatoire, la rendent inutilisable — on le dit, on ne préremplit pas un
      jet faux (`compositionValable`, la même garde que les jets demandés aux joueurs).
    */
    const retenue = auPremierPlan ? combattant.derniereAttaque : undefined;
    const proposee = retenue ? compositionValable({ champs: retenue.champs }, driver.jet, gabarit.sections, valeurs) : null;
    // T9 : sans dernière attaque, le jet de l'arme (Vigueur + Corps à corps, ou Agilité + Armes à feu).
    /*
      T12 : une composante obligatoire qui n'a qu'un champ possible (le Stress d'Alien, `niveau_de_stress`)
      se remplit d'office ; sinon `compositionValable` refuserait l'attaque entière. Rien n'est deviné
      quand il y a un choix.
    */
    const completer = (champs: Record<string, string>) => Object.fromEntries([
        ...Object.entries(champs),
        ...composantesARetenir(driver.jet).flatMap(c => {
            if (champs[c.id] || c.facultative) return [];
            const possibles = champsProposes(c, gabarit.sections, valeurs);
            return possibles.length === 1 ? [[c.id, possibles[0].id]] : [];
        }),
    ]);
    // § 267, T15 : Rêve de Dragon — l'arme se lit sur la fiche du Voyageur (son gabarit), que la carte connaît ici.
    const reveDeDragon = driver.jet?.cible?.mecanique === 'reves-de-dragons';
    const attaqueDeDepart = attaqueProposee ?? (reveDeDragon && auPremierPlan ? attaqueDuVoyageur(valeurs, gabarit) : null);
    const parDefaut = auPremierPlan && !retenue && attaqueDeDepart
        ? compositionValable({ champs: completer(attaqueDeDepart) }, driver.jet, gabarit.sections, valeurs) : null;
    // § 267, T5 : Star Trek — la nature de l'attaque règle la difficulté (1 au contact, 2 à distance, p. 290).
    const attaqueST = driver.jet?.starTrek && auPremierPlan && cible ? attaqueDeStarTrek(valeurs) : null;
    /*
      § 267, T12 : Torg — le ND est la défense de la cible, lue sur sa fiche : Esquive à distance, Armes de
      mêlée ou Combat à mains nues au contact (p. 115).
    */
    const attaqueTorg = driver.jet?.torg && auPremierPlan && cible ? attaqueDeTorg(valeurs) : null;
    const porteurDeLaCible = attaqueTorg && cible ? useCombatStore.getState().combatants.find(c => c.id === cible.id) : undefined;
    const ndTorg = attaqueTorg && porteurDeLaCible ? ndDeTorg(attaqueTorg, valeursDuCombattant(porteurDeLaCible)) : undefined;
    // § 267, T14 : NOC — le niveau requis par défaut (1 au contact, 0 à courte portée, p. 250).
    const attaqueNoc = driver.jet?.destin?.fiel && auPremierPlan && cible ? attaqueDeNoc(valeurs) : null;
    const porteurNoc = attaqueNoc && cible ? useCombatStore.getState().combatants.find(c => c.id === cible.id) : undefined;
    const ficheNoc = porteurNoc ? valeursDuCombattant(porteurNoc) : undefined;
    const initiale = (proposee ?? parDefaut) && attaqueST ? { ...(proposee ?? parDefaut)!, difficulte: attaqueST.difficulte }
        : !proposee && parDefaut && attaqueNoc ? { ...parDefaut, difficulte: attaqueNoc.difficulte }
        : (proposee ?? parDefaut) && ndTorg ? { ...(proposee ?? parDefaut)!, difficulte: ndTorg.nd } : proposee ?? parDefaut;
    const retenir = auPremierPlan
        ? ({ champs }: { champs: Record<string, string> }) => useCombatStore.getState().retenirLAttaque(combattant.id, {
            champs, libelle: libelleDeLAttaque(champs, gabarit, valeurs),
        })
        : undefined;
    // T7 : le dernier résultat affiché, pour « Appliquer à [cible] » — seulement ouvert par « Attaquer ».
    const [dernierResultat, setDernierResultat] = useState<RollResult | null>(null);
    /*
      T18 : Dune n'a pas de points de vie, donc pas de « Appliquer à [cible] ». Son attaque réussie
      s'applique dans les suites du test (`AttaqueDune`), la cible de la carte déjà choisie.
    */
    const dune = !!driver.jet?.dune;
    // § 267, T0 à T3 : un jeu dont le coup passe par sa propre porte (Dune, COC, Delta Green) n'a pas « Appliquer à [cible] ».
    const parSaPorte = regleDesDegats(driver) === 'porte-du-jeu';
    const suivreLeResultat = auPremierPlan && cible && !dune ? setDernierResultat : undefined;
    // T3 : Delta Green enchaîne sur sa carte de dégâts, l'arme de l'attaque proposée choisie.
    const regleDG = driver.jet?.deltaGreen;
    const armeDG = regleDG ? attaqueDeDeltaGreen(valeurs)?.arme : undefined;
    const [tirageDG, setTirageDG] = useState(0);
    const suivre = suivreLeResultat ? (r: RollResult) => { setDernierResultat(r); setTirageDG(n => n + 1); } : undefined;
    // § 267, T10 : Shadowrun — les armes de la fiche de l'attaquant (leur VD) et l'opposition préparée (p. 66-67).
    const shadowrun = driver.jet?.shadowrun && auPremierPlan && cible ? attaqueDeShadowrun(valeurs) : null;
    const armesDuCoup = attaqueNoc && !armes?.length ? armesDeNoc(valeurs).map(({ trait: _t, distance: _d, ...a }) => a)
        : attaqueTorg && !armes?.length
        ? (attaqueTorg.degats !== undefined ? [{ libelle: String(valeurs.armes ?? '').split(/[\n;]/)[0].trim() || 'Mains nues', degats: attaqueTorg.degats }] : [])
        : driver.jet?.shadowrun && !armes?.length
        ? armesDeShadowrun(valeurs).filter(a => Number.isFinite(a.degats)).map(({ melee: _melee, ...a }) => a) : armes;

    return (
        <details data-jet-du-combattant {...(auPremierPlan ? { 'data-ouvert-sur-le-jet': '' } : {})}
            className={`rounded-xl border p-3 ${auPremierPlan ? 'border-accent/60' : 'border-app-border/40'}`} open>
            <summary className="cursor-pointer text-ui-10 font-black uppercase tracking-widest text-app-text">
                {cible ? `${combattant.name} attaque ${cible.name}` : `Lancer un test pour ${combattant.name}`}
            </summary>
            {cible && (
                <p data-cible-de-l-attaque={cible.id} className="pt-2 text-ui-11 text-app-muted">
                    Cible : <span className="font-black text-app-text">{cible.name}</span> — celle que vise la carte.
                </p>
            )}
            {retenue && (
                <p data-derniere-attaque={proposee ? 'proposee' : 'perimee'} className="pt-1 text-ui-11 text-app-muted">
                    {proposee
                        ? <>Dernière attaque, proposée : <span className="font-black text-app-text">{retenue.libelle}</span></>
                        : <>La dernière attaque ({retenue.libelle}) ne se lit plus sur cette fiche : à recomposer.</>}
                </p>
            )}
            {ndTorg && cible && (
                <p data-nd-de-torg className="pt-1 text-ui-11 text-app-muted">
                    ND : <span className="font-black text-app-text">{ndTorg.libelle} de {cible.name}, {ndTorg.nd}</span> (p. 115).
                </p>
            )}
            {parDefaut && (
                <p data-attaque-par-defaut className="pt-1 text-ui-11 text-app-muted">
                    Attaque proposée : <span className="font-black text-app-text">{libelleDeLAttaque(attaqueDeDepart ?? {}, gabarit, valeurs)}</span>
                    {armes?.[0] ? ` (${armes[0].libelle})` : ''}
                </p>
            )}
            <div className="pt-3">
                <PanneauDeJet key={combattant.id} descripteur={driver.jet!} dice={driver.dice} template={gabarit} valeurs={valeurs}
                    personnageId={combattant.id} campaignId={campaignId ?? undefined}
                    ecrireSurLaFiche={maj => ecrireLaFicheDuCombattant(combattant, maj)}
                    {...(initiale ? { compositionInitiale: initiale } : {})}
                    // T12 : l'arme proposée est aussi celle du panneau (Alien : le tir l'exige).
                    {...(auPremierPlan && armes?.[0]?.id !== undefined ? { equipementAlienInitial: armes[0].id } : {})}
                    {...(retenir ? { surLeLancer: retenir } : {})}
                    {...(suivre ? { surLeResultat: suivre } : {})}
                    {...(dune ? { duneDuCombattant: { ennemi: combattant.faction === 'enemy', ...(auPremierPlan && cible ? { cible: cible.id } : {}) } } : {})}
                    // § 267, T2 : la cible de la carte, défenseur et cible des DM de COC.
                    {...(driver.jet?.coc && auPremierPlan && cible ? { cocDuCombattant: { cible: cleCocDuCombattant(cible) } } : {})}
                    // § 267, T5 : la tâche d'un PNJ de Star Trek, payée en Menace, et la cible de la blessure.
                    // § 267, T8 : Degenesis — l'arme de l'adversaire choisie d'emblée ; sa carte d'attaque vise sa cible.
                    {...(driver.jet?.degenesis?.combat && auPremierPlan && cible ? { degenesisDuCombattant: {
                        arme: attaqueDeDegenesis(driver.jet.degenesis.combat, valeurs)?.arme,
                    } } : {})}
                    // § 267, T9 : RuneQuest — « Porter le coup » vise la cible de la carte, pas celle du rang en cours.
                    {...(driver.jet?.runequest && auPremierPlan && cible ? { runequestDuCombattant: { cible: cible.id } } : {})}
                    {...(shadowrun ? { shadowrunDuCombattant: { epreuve: shadowrun.epreuve } } : {})}
                    // § 267, T13 : Crimes — la cible de la carte et l'arme reconnue, dans l'attaque du panneau.
                    {...(driver.jet?.garde?.armes && auPremierPlan && cible ? { crimesDuCombattant: {
                        cible: cible.id, ...(attaqueDeCrimes(valeurs).arme ? { arme: attaqueDeCrimes(valeurs).arme } : {}),
                    } } : {})}
                    // § 267, T14 : NOC — le camp du Rouage décide du Fiel ; la réserve de table lui est donc transmise.
                    {...(attaqueNoc ? { nocDuCombattant: { camp: combattant.faction === 'enemy' ? 'hostile' : 'allie' } } : {})}
                    {...(attaqueNoc && driver.ressourcesDeTable?.length ? { ressourcesDeTable: driver.ressourcesDeTable } : {})}
                    // La réserve de table, pour Star Trek : ailleurs, le surplus d'un adversaire irait à l'Impulsion des joueurs.
                    {...(attaqueST && cible && driver.ressourcesDeTable?.length ? { ressourcesDeTable: driver.ressourcesDeTable } : {})}
                    // Dune (23/11/2026) : un PNJ ennemi paie en Menace et y verse son reliquat (livre, p. 240). Sans la réserve
                    // de table, le panneau masquait ses dépenses, désactivait « Terminer le test » dès qu'il restait de
                    // l'Impulsion, et le reliquat se perdait. Un PNJ allié n'y a pas accès : son surplus irait aux joueurs.
                    {...(dune && combattant.faction === 'enemy' && driver.ressourcesDeTable?.length ? { ressourcesDeTable: driver.ressourcesDeTable } : {})}
                    {...(attaqueST && cible ? { starTrekDuCombattant: {
                        ennemi: combattant.faction === 'enemy', nature: attaqueST.nature, cible: cible.id,
                        ...(attaqueST.gravite ? { gravite: attaqueST.gravite } : {}),
                    } } : {})} />
            </div>
            {suivreLeResultat && cible && dernierResultat && !parSaPorte && <AppliquerALaCible cible={cible} resultat={dernierResultat} driver={driver}
                armes={armesDuCoup} protectionDeLaCible={protectionDeLaCible}
                {...(driver.jet?.barbarians ? { barbarians: { armes: armesDeBarbarians(valeurs), vigueur: Number(valeurs.vigueur ?? 0) || 0 } } : {})}
                {...(ficheNoc ? { noc: { constitution: Math.trunc(Number(ficheNoc.constitution) || 0), armure: Math.trunc(Number(ficheNoc.armure) || 0) } } : {})} />}
            {/* § 267, T7 : Argyropée — les dégâts de l'arme, la parade et la protection X/Y de la cible (p. 48-52). */}
            {suivreLeResultat && cible && dernierResultat && driver.jet?.argyropee && (
                <DegatsDArgyropee key={tirageDG} cibleId={cible.id} armes={armesDArgyropee(valeurs)} reussie={!!dernierResultat.tagSuccess}
                    critique={(dernierResultat as { argyropee?: { bilan?: string } }).argyropee?.bilan === 'reussite-critique'} />
            )}
            {/* § 267, T11 : Nephilim — les degrés de dommages, puis la cible choisit comment les absorber (p. 129-136). */}
            {suivreLeResultat && cible && dernierResultat && driver.jet?.nephilim && (
                <DommagesDeNephilim key={tirageDG} cibleId={cible.id} regle={driver.jet.nephilim} valeursDeLAttaquant={valeurs}
                    reussie={!!dernierResultat.tagSuccess} critique={dernierResultat.degre === 'reussite-particuliere'} />
            )}
            {/* § 267, T15 : Rêve de Dragon — le +dom total, puis l'encaissement de la cible (p. 125-129). */}
            {suivreLeResultat && cible && dernierResultat && reveDeDragon && (
                <DommagesDuVoyageur key={tirageDG} cibleId={cible.id} gabarit={gabarit} valeursDeLAttaquant={valeurs}
                    reussie={!!dernierResultat.tagSuccess} particuliere={dernierResultat.degre === 'reussite-particuliere'} />
            )}
            {suivreLeResultat && cible && dernierResultat && regleDG && (
                <div className="mt-3" data-degats-apres-l-attaque>
                    <DommagesDeltaGreen key={tirageDG} attaquant={combattant} regle={regleDG} ouverte armeInitiale={armeDG}
                        reussie={!!dernierResultat.tagSuccess} critiqueDuJet={dernierResultat.degre === 'reussite-particuliere'} />
                </div>
            )}
        </details>
    );
};
