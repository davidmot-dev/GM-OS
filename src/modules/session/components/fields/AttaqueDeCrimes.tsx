import React from 'react';
import { useCombatStore } from '../../../combat/useCombatStore';
import { useSessionOSStore } from '../../useSessionOSStore';
import { ecrireLaFicheDuCombattant } from '../../../combat/ficheDesCombattants';
import { ficheDuCombattant } from '../../../combat/logic/ficheDuCombattant';
import {
    ARMES_A_FEU, ARMES_BLANCHES, ARMES_DE_CRIMES, LIBELLES_DES_MANOEUVRES, LOCALISATIONS, incidentsDuTir, resoudreLAttaque,
    type ArmeDeCrimes, type Manoeuvre, type ReglagesDAttaque,
} from '../../../dice/systemes/armesDeCrimes';
import { LIBELLES_DES_ATTEINTES, physiqueActuel, poserUneAtteinte, potentielActuel, type JetGarde } from '../../../dice/systemes/potentielGarde';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { Combatant } from '../../../combat/types';

/**
 * **L'attaque de Crimes** — C6 (2026-10-22), livre p. 344–346 et 389–395.
 *
 * À « Préparer », l'arme, la distance d'un tir, les réussites de l'adversaire
 * en opposition, la cible et sa protection. Au résultat, le calcul du livre —
 * succès excédentaires + arme − Physique de la victime − protection, au moins
 * 1 (p. 393) —, et, au meneur, « Infliger » : les marques s'écrivent sur la fiche de la
 * cible, avec la règle des atteintes (C2). Les incidents d'une arme à feu
 * sur un échec critique se rappellent ; le meneur choisit.
 */


type Atteintes = NonNullable<NonNullable<DescripteurDeJet['garde']>['atteintes']>;
const entier = (v: string) => Math.max(0, Math.floor(Number(v) || 0));

/** La fiche d'un combattant, par la même porte que la carte de combat. */
function useFicheDeLaCible(cibleId: string): { combattant?: Combatant; valeurs: Record<string, unknown> } {
    const combattant = useCombatStore(s => s.combatants.find(c => c.id === cibleId));
    const players = useSessionOSStore(s => s.players);
    const entities = useSessionOSStore(s => s.entities);
    if (!combattant) return { valeurs: {} };
    const source = combattant.isPlayer
        ? players.flatMap(p => p.characters).find(c => c.id === combattant.sourcePlayerId)
        : entities.find(e => e.id === combattant.sourceEntityId);
    return { combattant, valeurs: ficheDuCombattant(combattant, source, [], null).valeurs };
}


const champ = 'bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50';
const etiquette = 'text-ui-9 font-black uppercase tracking-widest text-app-text/40';

export const PreparationDeLAttaque: React.FC<{
    reglages: ReglagesDAttaque;
    changer: (r: Partial<ReglagesDAttaque>) => void;
    atteintes?: Atteintes;
}> = ({ reglages, changer, atteintes }) => {
    const combattants = useCombatStore(s => s.combatants);
    const { valeurs } = useFicheDeLaCible(reglages.cible);
    const arme = ARMES_DE_CRIMES.find(a => a.id === reglages.arme);
    const physiqueLu = physiqueActuel(atteintes, valeurs);
    const distance = reglages.distance.trim() === '' ? undefined : Number(reglages.distance);
    const horsDePortee = arme?.famille === 'feu' && distance !== undefined && arme.portee
        ? distance > arme.portee * 2 ? `au-delà de ${arme.portee * 2} m : tir impossible`
            : distance > arme.portee ? `au-delà de ${arme.portee} m : une réussite de moins` : null
        : null;
    return (
        <div data-attaque-de-crimes className="flex flex-wrap items-center gap-3 basis-full">
            <label className="flex items-center gap-2">
                <span className={etiquette}>Arme</span>
                <select value={reglages.arme} onChange={e => changer({ arme: e.target.value })} className={`${champ} max-w-56`}>
                    <option value="">— aucune —</option>
                    <optgroup label="Armes blanches">
                        {ARMES_BLANCHES.map(a => <option key={a.id} value={a.id}>{a.nom} (Physique{a.degats ? ` + ${a.degats}` : ''}, {LIBELLES_DES_ATTEINTES[a.atteinte].toLowerCase()})</option>)}
                    </optgroup>
                    <optgroup label="Armes à feu">
                        {ARMES_A_FEU.map(a => <option key={a.id} value={a.id}>{a.nom} ({a.portee} m, {a.degats})</option>)}
                    </optgroup>
                </select>
            </label>
            {arme && (
                <>
                    {/* Les manœuvres (p. 391-394) : des possibilités en plus d'une attaque simple. */}
                    <label className="flex items-center gap-2">
                        <span className={etiquette}>Manœuvre</span>
                        <select value={reglages.manoeuvre} onChange={e => changer({ manoeuvre: e.target.value as Manoeuvre })} className={champ} data-manoeuvre>
                            {(Object.keys(LIBELLES_DES_MANOEUVRES) as Manoeuvre[]).map(m => <option key={m} value={m}>{LIBELLES_DES_MANOEUVRES[m]}</option>)}
                        </select>
                    </label>
                    {reglages.manoeuvre === 'viser' && (
                        <label className="flex items-center gap-2" title="Viser coûte une réussite ; il faut deux succès de plus que l'adversaire pour toucher où l'on veut (p. 392)">
                            <span className={etiquette}>Localisation</span>
                            <select value={reglages.localisation} onChange={e => changer({ localisation: e.target.value })} className={champ} data-localisation>
                                {[...new Set(Object.values(LOCALISATIONS))].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </label>
                    )}
                    {arme.famille === 'feu' && (
                        <label className="flex items-center gap-2" title={`Portée utile ${arme.portee} m, maximale ${(arme.portee ?? 0) * 2} m (p. 389)`}>
                            <span className={etiquette}>Distance (m)</span>
                            <input type="number" min={0} value={reglages.distance} onChange={e => changer({ distance: e.target.value })} className={`${champ} w-20`} data-distance />
                        </label>
                    )}
                    <label className="flex items-center gap-2" title="Les réussites de l’adversaire en opposition (mêlée) ; 0 pour un tir sur une cible qui ne riposte pas">
                        <span className={etiquette}>Réussites adverses</span>
                        <input type="number" min={0} value={reglages.adverses} onChange={e => changer({ adverses: e.target.value })} className={`${champ} w-14`} data-adverses />
                    </label>
                    <label className="flex items-center gap-2">
                        <span className={etiquette}>Cible</span>
                        <select value={reglages.cible} onChange={e => changer({ cible: e.target.value })} className={`${champ} max-w-48`} data-cible>
                            <option value="">— hors combat —</option>
                            {combattants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </label>
                    {physiqueLu === undefined ? (
                        <label className="flex items-center gap-2">
                            <span className={etiquette}>Physique de la cible</span>
                            <input type="number" min={0} value={reglages.physiqueCible} onChange={e => changer({ physiqueCible: e.target.value })} className={`${champ} w-14`} data-physique-cible />
                        </label>
                    ) : <span className={etiquette}>Physique de la cible {physiqueLu}</span>}
                    <label className="flex items-center gap-2" title="Protection de la cible, couvert compris : de 1 (petit obstacle) à 3 (derrière un mur), p. 389">
                        <span className={etiquette}>Protection</span>
                        <input type="number" min={0} value={reglages.protection} onChange={e => changer({ protection: e.target.value })} className={`${champ} w-14`} data-protection />
                    </label>
                    {arme.famille === 'feu' && (
                        <span className="text-ui-10 text-app-text/40 font-mono">
                            {arme.coups} coup{(arme.coups ?? 1) > 1 ? 's' : ''} par assaut, {arme.munitions} munitions, rechargement {arme.rechargement} assaut{(arme.rechargement ?? 0) > 1 ? 's' : ''}
                            {arme.degatsMinores ? `, ${arme.degatsMinores} en tir multiple` : ''}
                        </span>
                    )}
                    {horsDePortee && <span className="text-ui-11 font-bold text-etat-alerte">{horsDePortee}</span>}
                </>
            )}
        </div>
    );
};

export const IssueDeLAttaque: React.FC<{
    reglages: ReglagesDAttaque;
    resultat: JetGarde;
    physiqueAttaquant: number;
    atteintes?: Atteintes;
    /** Le meneur seul inflige : une tablette n'écrit pas la fiche d'un autre. */
    peutInfliger: boolean;
    infligee: string | null;
    onInfligee: (ligne: string) => void;
    /** Le degré de maîtrise de l'attaquant (la compétence) : la feinte s'y limite. */
    maitrise?: number;
    /**
     * Les munitions de l'arme à feu, tenues sur la fiche de l'attaquant (règle optionnelle,
     * p. 390) : « −1 munition » et « Recharger », d'un clic — rien ne se retire tout seul.
     */
    munitions?: { valeur: number; ecrire: (n: number) => void };
}> = ({ reglages, resultat, physiqueAttaquant, atteintes, peutInfliger, infligee, onInfligee, maitrise, munitions }) => {
    const { combattant, valeurs } = useFicheDeLaCible(reglages.cible);
    const arme = ARMES_DE_CRIMES.find(a => a.id === reglages.arme) as ArmeDeCrimes | undefined;
    if (!arme) return null;
    const physiqueLu = physiqueActuel(atteintes, valeurs);
    const issue = resoudreLAttaque({
        arme, reussites: resultat.garde.reussites, adverses: entier(reglages.adverses),
        physiqueAttaquant, physiqueCible: physiqueLu ?? entier(reglages.physiqueCible), protection: entier(reglages.protection),
        ...(reglages.distance.trim() !== '' ? { distance: Number(reglages.distance) } : {}),
        manoeuvre: reglages.manoeuvre, localisation: reglages.localisation,
        des: resultat.rolls.map(d => Number(d.val)), ...(maitrise ? { maitrise } : {}),
    });
    const incidents = resultat.garde.bilan === 'echec-critique' ? incidentsDuTir(arme, resultat.garde.uns) : [];
    const nom = combattant?.name ?? 'la cible';
    const atteinte = LIBELLES_DES_ATTEINTES[issue.atteinte].toLowerCase();
    const potentiel = atteintes?.incapacite ?? 'physique';
    const marques = atteintes?.parPotentiel[potentiel];

    const infliger = () => {
        if (!combattant || !marques) return;
        let m = {
            fatigue: Math.max(0, Number(valeurs[marques.fatigue]) || 0),
            epuisement: Math.max(0, Number(valeurs[marques.epuisement]) || 0),
            blessures: Math.max(0, Number(valeurs[marques.blessures]) || 0),
        };
        for (let i = 0; i < issue.degats; i++) m = poserUneAtteinte(m, issue.atteinte);
        ecrireLaFicheDuCombattant(combattant, { [marques.fatigue]: m.fatigue, [marques.epuisement]: m.epuisement, [marques.blessures]: m.blessures });
        const actuel = potentielActuel(Number(valeurs[potentiel]) || 0, m);
        onInfligee(`${nom} : +${issue.degats} ${atteinte}${issue.degats > 1 ? 's' : ''} (${arme.nom}) → Physique actuel ${actuel}`);
    };

    return (
        <div data-issue-de-l-attaque className="basis-full flex flex-col gap-1 border-t border-app-border/30 pt-2 text-xs">
            {issue.impossible ? (
                <p className="font-bold text-etat-alerte">{issue.impossible}</p>
            ) : issue.touche ? (
                <p className="flex flex-wrap items-center gap-2">
                    <strong className="text-etat-danger">Touché : {issue.degats} {atteinte}{issue.degats > 1 ? 's' : ''}</strong>
                    <span className="font-mono text-app-text/50">{issue.calcul}</span>
                    {peutInfliger && combattant && marques && !infligee && (
                        <button type="button" onClick={infliger} data-infliger
                            className="px-3 py-1 rounded-lg border border-etat-danger/50 text-etat-danger text-ui-10 font-black uppercase tracking-widest hover:bg-etat-danger/10">
                            Infliger à {nom}
                        </button>
                    )}
                    {infligee && <span className="font-mono text-etat-danger">{infligee}</span>}
                    {/* L'initiative narrative (p. 388) : Combat-OS garde son ordre, le meneur le change s'il le veut. */}
                    <span className="basis-full text-app-text/60" data-initiative-suivante>
                        Il aura l'initiative de l'assaut suivant : « celui qui a blessé l'autre » (p. 388).
                    </span>
                </p>
            ) : issue.calcul && (reglages.manoeuvre === 'immobiliser') ? (
                <p className="font-mono text-app-text/60">{issue.calcul}</p>
            ) : reglages.manoeuvre === 'feinter' ? null : (
                <p className="text-app-text/60">
                    {issue.malusDePortee ? 'Manqué, la portée utile dépassée coûtant une réussite.' : entier(reglages.adverses) > 0 ? 'Pas de blessure : l’adversaire tient l’assaut (égalité ou mieux).' : 'Manqué.'}
                </p>
            )}
            {issue.localisations && (
                <p className="text-app-text/70" data-localisation-du-coup>
                    Localisation : {issue.localisations.join(' ou ')}{issue.localisations.length > 1 ? ' (égalité : le vainqueur choisit)' : ''}
                </p>
            )}
            {(issue.effets ?? []).map(e => <p key={e} className="text-etat-alerte">{e}</p>)}
            {incidents.map(i => <p key={i} className="text-etat-alerte">{i}</p>)}
            {arme.famille === 'feu' && munitions && (
                <p className="flex flex-wrap items-center gap-2" data-munitions>
                    <span className="font-mono">Munitions {munitions.valeur}/{arme.munitions}</span>
                    <button type="button" disabled={munitions.valeur <= 0} onClick={() => munitions.ecrire(munitions.valeur - 1)}
                        className="px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold disabled:opacity-30">−1 munition</button>
                    <button type="button" onClick={() => munitions.ecrire(arme.munitions ?? 0)}
                        title={`Recharger prend ${arme.rechargement} assaut${(arme.rechargement ?? 0) > 1 ? 's' : ''} ; un personnage angoissé (plus de 3) peut en perdre un de plus (p. 390)`}
                        className="px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold">Recharger ({arme.rechargement} assaut{(arme.rechargement ?? 0) > 1 ? 's' : ''})</button>
                </p>
            )}
        </div>
    );
};
