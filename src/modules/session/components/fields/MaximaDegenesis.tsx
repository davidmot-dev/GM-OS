import React, { useMemo } from 'react';
import {
    appliquerLEgoMaximal, calculerLesMaxima, declarerLaBranche,
    type ChoixDeLaBranche, type LigneDuMaximum, type RegleDesMaximaDeDegenesis,
} from '../../../dice/systemes/maximaDeDegenesis';
import { santeDeDepart, valeurDuChamp } from '../../../combat/logic/SanteDuCombattant';

/**
 * **La carte « Maxima » de Degenesis** — DEG-A3, 04/11/2026, à la demande de David (« on
 * commence DEG-A3 et DEG-A4 », carte choisie le même jour). À côté du test, comme les
 * attributs calculés de RuneQuest.
 *
 * La branche de l'Égo (Concentration ou Pulsions) et celle de la Sporulation (Foi ou Volonté)
 * se déduisent de la compétence remplie ; deux remplies, ou aucune, et le meneur choisit — la
 * contradiction est dite (p. 26). L'Égo maximal s'applique ; les trois autres maxima sont des
 * formules du pilote, expliquées et comparées. Rien ne remplit la jauge d'Égo.
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const boutonPrincipal = 'px-3 py-1 rounded-md bg-accent text-app-on-accent text-ui-10 font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const entier = (v: unknown) => Math.trunc(Number(v) || 0);

const Branche: React.FC<{
    titre: string;
    paire: 'ego' | 'sporulations';
    choix: ChoixDeLaBranche;
    valeurs: Record<string, unknown>;
    abreviations?: Record<string, string>;
    declarer: (paire: 'ego' | 'sporulations', cle: string) => void;
    retirer: (competence: string, libelle: string) => void;
}> = ({ titre, paire, choix, valeurs, abreviations, declarer, retirer }) => (
    <fieldset className="flex flex-col gap-1" data-branche-degenesis={paire}>
        <legend className={etiquette}>{titre}</legend>
        <div className="flex flex-wrap items-center gap-3">
            {choix.branches.map(b => (
                <label key={b.cle} className="flex items-center gap-1">
                    <input type="radio" name={`branche-${paire}`} checked={choix.retenue?.cle === b.cle} onChange={() => declarer(paire, b.cle)} />
                    {b.libelle} — {abreviations?.[b.attribut] ?? b.attribut} {entier(valeurs[b.attribut])} + {entier(valeurs[b.competence])}
                </label>
            ))}
            {choix.deduite && <span className="italic text-app-text/50">déduite de la fiche</span>}
        </div>
        {!choix.retenue && (
            <span className="italic text-app-text/60">
                {choix.branches.map(b => b.libelle).join(' et ')} sont {choix.branches.some(b => entier(valeurs[b.competence]) > 0) ? 'toutes deux remplies' : 'toutes deux vides'} : choisissez la branche retenue (p. 26).
            </span>
        )}
        {choix.retenue && choix.contradictoires.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-etat-alerte/50 bg-etat-alerte/10 px-2 py-1" data-contradiction-degenesis={paire}>
                <span>
                    {[choix.retenue, ...choix.contradictoires].map(b => b.libelle).join(' et ')} sont toutes deux remplies : elles s’excluent (p. 26).
                    Le maximum suit {choix.retenue.libelle}.
                </span>
                {choix.contradictoires.map(b => (
                    <button key={b.cle} type="button" className={bouton} onClick={() => retirer(b.competence, b.libelle)}>Mettre {b.libelle} à 0</button>
                ))}
            </div>
        )}
    </fieldset>
);

const Ligne: React.FC<{ l: LigneDuMaximum; appliquer: () => void }> = ({ l, appliquer }) => (
    <tr className="border-t border-app-border/20 align-top" data-maximum={l.cle}>
        <td className="py-1 pr-2">{l.libelle}</td>
        <td className="py-1 px-2 text-center font-mono">{l.surLaFiche ?? '—'}</td>
        <td className={`py-1 px-2 text-center font-mono ${l.identique ? '' : 'font-black text-accent'}`}>{l.calcule ?? '?'}</td>
        <td className="py-1 px-2 text-app-text/60">{l.detail}{l.note ? <span className="block italic">{l.note}</span> : null}</td>
        <td className="py-1 pl-2 text-right">
            {l.identique
                ? <span className="text-ui-9 font-black uppercase tracking-widest text-etat-succes">identique</span>
                : l.ecrivable && l.calcule !== null
                    ? <button type="button" className={bouton} onClick={appliquer}>Appliquer</button>
                    : <span className="text-ui-9 text-app-text/50">{l.calcule === null ? 'branche à choisir' : 'formule du pilote'}</span>}
        </td>
    </tr>
);

export const MaximaDegenesis: React.FC<{
    regle: RegleDesMaximaDeDegenesis;
    valeurs: Record<string, unknown>;
    /** Les jauges suivies par le pilote : leur formule de maximum se compare au calcul. */
    jauges: { fieldId: string; max?: string }[];
    appliquer: (maj: Record<string, unknown>) => void;
    consigner: (ligne: string) => void;
}> = ({ regle, valeurs, jauges, appliquer, consigner }) => {
    const maxima = useMemo(() => {
        const duPilote = (jauge: string) => {
            const formule = jauges.find(j => j.fieldId === jauge)?.max;
            return formule ? santeDeDepart(formule, c => valeurDuChamp(valeurs, c)) : null;
        };
        return calculerLesMaxima(regle, valeurs, duPilote);
    }, [regle, valeurs, jauges]);
    const ego = maxima.lignes.find(l => l.cle === 'ego')!;
    const aAppliquer = ego.ecrivable && ego.calcule !== null && !ego.identique ? 1 : 0;
    const abr = regle.abreviations;

    const appliquerLEgo = () => {
        const maj = appliquerLEgoMaximal(regle, valeurs, maxima);
        if (!Object.keys(maj).length) return;
        appliquer(maj);
        const jauge = regle.ego.jauge && regle.ego.jauge in maj ? ` ; Égo actuel ramené à ${String(maj[regle.ego.jauge])}` : '';
        consigner(`Égo maximal ${ego.surLaFiche ?? '—'} → ${ego.calcule} : ${ego.detail}${jauge}.`);
    };
    const declarer = (paire: 'ego' | 'sporulations', cle: string) => {
        appliquer(declarerLaBranche(valeurs, paire, cle));
        const b = (paire === 'ego' ? maxima.ego : maxima.sporulations)?.branches.find(x => x.cle === cle);
        consigner(`Branche ${paire === 'ego' ? 'de l’Égo' : 'de la Sporulation'} : ${b?.libelle ?? cle} (p. 26).`);
    };
    const retirer = (competence: string, libelle: string) => {
        appliquer({ [competence]: 0 });
        consigner(`${libelle} ${entier(valeurs[competence])} → 0 : elle s’exclut avec la branche retenue (p. 26).`);
    };

    return (
        <div data-maxima-degenesis className="flex flex-col gap-3 text-xs">
            <Branche titre="Branche de l’Égo" paire="ego" choix={maxima.ego} valeurs={valeurs} abreviations={abr} declarer={declarer} retirer={retirer} />
            {maxima.sporulations && (
                <Branche titre="Branche de la Sporulation" paire="sporulations" choix={maxima.sporulations} valeurs={valeurs} abreviations={abr} declarer={declarer} retirer={retirer} />
            )}
            <table className="w-full border-collapse">
                <thead>
                    <tr className={etiquette}>
                        <th className="text-left font-black pb-1">Jauge</th><th className="px-2 font-black">Sur la fiche</th>
                        <th className="px-2 font-black">Calculé</th><th className="px-2 text-left font-black">Détail</th><th />
                    </tr>
                </thead>
                <tbody>{maxima.lignes.map(l => <Ligne key={l.cle} l={l} appliquer={appliquerLEgo} />)}</tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-app-border/30 pt-2">
                <span className="italic text-app-text/60">
                    Un maximum qui change ne remplit pas la jauge : l’Égo actuel ({entier(valeurs[regle.ego.jauge ?? ''])}) reste, ramené au maximum s’il le dépasse.
                    Les Sporulations subies ne bougent pas.
                </span>
                <button type="button" className={boutonPrincipal} disabled={!aAppliquer} onClick={appliquerLEgo}>Appliquer tout ({aAppliquer})</button>
            </div>
        </div>
    );
};
