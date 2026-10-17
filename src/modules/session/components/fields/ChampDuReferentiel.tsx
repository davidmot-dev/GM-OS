import React, { useId, useState } from 'react';
import { Info } from 'lucide-react';
import type { SheetField } from '../../../../data/defaultSheetTemplates';
import type { GameDriver } from '../../../../types/drivers';
import { useDescriptionDeLEntree, useReferentiel } from '../../hooks/useReferentiel';
import { direLesDetails, entreesDuNom, entreesSelon, estPermise, libelleCourt, liesALaValeur, nomsDuReferentiel, origineDansLaFiche, type EntreeDeReferentiel } from '../../logic/referentiels';

type PiloteDuJeu = Pick<GameDriver, 'id' | 'name'> & { corpusId?: string; ragPath?: string };

/**
 * **Un champ relié à un référentiel du jeu** — 2026-10-17, les Vécus de Nephilim.
 *
 * La saisie propose les noms de la liste, sans s'y limiter : un joueur peut
 * inventer son Vécu. Un nom qui s'y trouve gagne un bouton ⓘ, qui ouvre ce que
 * le corpus en dit — ses détails et sa description. Sans référentiel lisible, le
 * champ redevient un champ texte ordinaire.
 */
const DescriptionDeLEntree: React.FC<{ pilote: PiloteDuJeu; chemin: string; entree: EntreeDeReferentiel; horsDeLaFiche?: string }> = ({ pilote, chemin, entree, horsDeLaFiche }) => {
    const description = useDescriptionDeLEntree(pilote, chemin, entree);
    return (
        <div className="space-y-1">
            <p className="text-ui-10 font-black uppercase tracking-widest text-accent/80">{entree.nom}</p>
            {entree.details && <p className="text-ui-10 text-app-text/50">{direLesDetails(entree)}</p>}
            {horsDeLaFiche && <p className="text-ui-10 text-etat-alerte">{horsDeLaFiche}</p>}
            {description && <p className="text-ui-11 text-app-text/80 leading-relaxed whitespace-pre-line">{description}</p>}
        </div>
    );
};

const ChampDuReferentiel: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
    pilote: PiloteDuJeu | null | undefined;
    /** Les valeurs de la fiche, pour les champs qui restreignent la liste (`referentielSelon`). */
    valeurs?: Record<string, unknown>;
    /** Tous les champs de la fiche : libellés des incarnations, Vécus qui en dépendent, degrés. */
    champsDeLaFiche?: SheetField[];
}> = ({ field, value, onChange, pilote, valeurs = {}, champsDeLaFiche = [] }) => {
    const referentiel = useReferentiel(pilote, field.referentiel);
    /*
      **Le lien dans l'autre sens** (2026-10-18) : les champs dont la liste suit
      celui-ci — les Vécus qui suivent une incarnation. On lit leur liste pour
      dire lesquels viennent de l'époque saisie ici.
    */
    const dependants = champsDeLaFiche.filter(c => c.referentielSelon?.champs.includes(field.id));
    const referentielDesDependants = useReferentiel(pilote, dependants[0]?.referentiel);
    const liste = useId();
    const [ouvert, setOuvert] = useState(false);
    const entrees = entreesDuNom(referentiel, value);
    /*
      **La liste suit d'autres champs** — un Vécu de Nephilim vient d'une époque
      incarnée : on ne propose que les entrées de ces époques, quand il y en a.
    */
    const selon = field.referentielSelon;
    const valeursSelon = selon ? selon.champs.map(c => valeurs[c]) : [];
    const permises = selon ? entreesSelon(referentiel, selon.detail, valeursSelon) : null;
    const saisies = valeursSelon.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    const proposees = permises && referentiel ? { ...referentiel, entrees: permises } : referentiel;
    const horsDeLaFiche = (e: EntreeDeReferentiel) => selon && saisies.length > 0 && !estPermise(e, selon.detail, valeursSelon)
        ? `${selon.detail} « ${e.details?.[selon.detail] ?? '?'} » : absente des ${selon.libelle ?? 'champs'} de la fiche.`
        : undefined;

    /* L'étiquette d'un Vécu : l'incarnation dont il vient, sous le même nom que le champ. */
    const libelleDe = (id: string) => libelleCourt(champsDeLaFiche.find(c => c.id === id)?.label ?? id);
    const origine = selon && entrees.length > 0 ? origineDansLaFiche(entrees, selon.detail, selon.champs, valeurs) : null;
    const autresDetails = (e: EntreeDeReferentiel) => Object.entries(e.details ?? {})
        .filter(([cle]) => cle !== selon?.detail && cle !== 'Ère' && cle !== 'Page')
        .map(([cle, v]) => `${cle} : ${v}`).join(' · ');

    /* La ligne d'une incarnation : les Vécus de la fiche qui viennent de son époque. */
    const detailDesDependants = dependants[0]?.referentielSelon?.detail;
    const lies = dependants.length > 0 && detailDesDependants
        ? liesALaValeur(referentielDesDependants, detailDesDependants, value, dependants.map(d => ({
            nom: String(valeurs[d.id] ?? ''),
            degre: valeurs[champsDeLaFiche.find(c => c.libelleSur === d.id)?.id ?? ''],
        })))
        : [];

    return (
        <div className="p-3 bg-app-bg/40 rounded-xl border border-app-border/40 space-y-2" data-champ-du-referentiel={field.id}>
            <div className="flex items-center gap-3">
                <label htmlFor={field.id} className="text-ui-10 font-black uppercase tracking-widest text-app-text/40 w-28 flex-shrink-0">{field.label}</label>
                <input
                    id={field.id}
                    type="text"
                    value={value}
                    list={referentiel ? liste : undefined}
                    onChange={e => onChange(e.target.value)}
                    title={referentiel ? `${field.label} — ${referentiel.titre} proposés` : field.label}
                    className="flex-1 bg-transparent text-app-text text-sm font-medium focus:outline-none border-b border-app-border focus:border-accent/50 transition-colors pb-0.5"
                />
                {entrees.length > 0 && (
                    <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert}
                        aria-label={`Ce que dit le corpus de « ${value.trim()} »`}
                        className={`p-1 rounded-md border transition-colors ${ouvert ? 'border-accent/60 text-accent' : 'border-app-border/40 text-app-text/50 hover:text-accent'}`}>
                        <Info size={13} />
                    </button>
                )}
            </div>
            {referentiel && (
                <datalist id={liste}>
                    {nomsDuReferentiel(proposees).map(nom => <option key={nom} value={nom} />)}
                </datalist>
            )}
            {selon && entrees.length > 0 && (origine ? (
                <p className="text-ui-10 font-bold text-accent" data-origine-du-vecu>
                    ↳ {libelleDe(origine.champ)} — {origine.valeur}{autresDetails(origine.entree) ? ` · ${autresDetails(origine.entree)}` : ''}
                </p>
            ) : (
                <p className={`text-ui-10 font-bold ${saisies.length > 0 ? 'text-etat-alerte' : 'text-app-text/50'}`} data-origine-du-vecu>
                    {saisies.length > 0
                        ? `${selon.detail} « ${entrees.map(e => e.details?.[selon.detail]).filter(Boolean).join(' » ou « ')} » : absente des ${selon.libelle ?? 'champs'}.`
                        : `${selon.detail} : ${entrees.map(e => e.details?.[selon.detail]).filter(Boolean).join(' ou ')}.`}
                </p>
            ))}
            {dependants.length > 0 && value.trim() !== '' && referentielDesDependants && (
                <p className="text-ui-10 text-app-text/60" data-vecus-de-l-incarnation>
                    {lies.length > 0
                        ? <>Vécus de cette {libelleCourt(field.label).replace(/\s*\d+$/, '').toLowerCase()} : <strong className="text-accent">{lies.map(v => (v.degre !== undefined && v.degre !== '' ? `${v.nom.trim()} (${v.degre})` : v.nom.trim())).join(' · ')}</strong></>
                        : 'Aucun Vécu de la fiche ne vient encore de cette époque.'}
                </p>
            )}
            {permises && (
                <p className="text-ui-10 text-app-text/40" data-liste-restreinte>
                    {permises.length} {referentiel?.titre.toLowerCase() ?? 'entrées'} proposés — {selon?.libelle ?? 'selon la fiche'} : {saisies.join(', ')}.
                </p>
            )}
            {ouvert && entrees.length > 0 && pilote && field.referentiel && (
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 space-y-3" data-description-du-referentiel>
                    {entrees.length > 1 && (
                        <p className="text-ui-10 text-app-text/50">{entrees.length} entrées portent ce nom, d’une époque à l’autre :</p>
                    )}
                    {entrees.map((e, i) => <DescriptionDeLEntree key={i} pilote={pilote} chemin={field.referentiel!} entree={e} horsDeLaFiche={horsDeLaFiche(e)} />)}
                </div>
            )}
        </div>
    );
};

/**
 * **La ligne d'aide du jet** : le Vécu retenu, s'il est dans la liste, avec ses
 * détails et le début de sa description — de quoi juger s'il s'applique.
 */
export const LigneDuReferentiel: React.FC<{ pilote: PiloteDuJeu | null | undefined; chemin: string; nom: string }> = ({ pilote, chemin, nom }) => {
    const referentiel = useReferentiel(pilote, chemin);
    const entrees = entreesDuNom(referentiel, nom);
    const description = useDescriptionDeLEntree(pilote, chemin, entrees[0]);
    if (entrees.length === 0) return null;
    const debut = description && description.length > 220 ? `${description.slice(0, 220).replace(/\s+\S*$/, '')}…` : description;
    return (
        <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-ui-11 space-y-1" data-ligne-du-referentiel>
            <p>
                <span className="font-black text-accent/80">{entrees[0].nom}</span>
                {entrees[0].details && <span className="text-app-text/50"> — {direLesDetails(entrees[0])}</span>}
                {entrees.length > 1 && <span className="text-app-text/40"> (et {entrees.length - 1} autre{entrees.length > 2 ? 's' : ''} du même nom)</span>}
            </p>
            {debut && <p className="text-app-text/70 leading-relaxed">{debut}</p>}
        </div>
    );
};

export default ChampDuReferentiel;
