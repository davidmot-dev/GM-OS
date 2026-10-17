import React, { useId, useState } from 'react';
import { Info } from 'lucide-react';
import type { SheetField } from '../../../../data/defaultSheetTemplates';
import type { GameDriver } from '../../../../types/drivers';
import { useDescriptionDeLEntree, useReferentiel } from '../../hooks/useReferentiel';
import { direLesDetails, entreesDuNom, nomsDuReferentiel, type EntreeDeReferentiel } from '../../logic/referentiels';

type PiloteDuJeu = Pick<GameDriver, 'id' | 'name'> & { corpusId?: string; ragPath?: string };

/**
 * **Un champ relié à un référentiel du jeu** — 2026-10-17, les Vécus de Nephilim.
 *
 * La saisie propose les noms de la liste, sans s'y limiter : un joueur peut
 * inventer son Vécu. Un nom qui s'y trouve gagne un bouton ⓘ, qui ouvre ce que
 * le corpus en dit — ses détails et sa description. Sans référentiel lisible, le
 * champ redevient un champ texte ordinaire.
 */
const DescriptionDeLEntree: React.FC<{ pilote: PiloteDuJeu; chemin: string; entree: EntreeDeReferentiel }> = ({ pilote, chemin, entree }) => {
    const description = useDescriptionDeLEntree(pilote, chemin, entree);
    return (
        <div className="space-y-1">
            <p className="text-ui-10 font-black uppercase tracking-widest text-accent/80">{entree.nom}</p>
            {entree.details && <p className="text-ui-10 text-app-text/50">{direLesDetails(entree)}</p>}
            {description && <p className="text-ui-11 text-app-text/80 leading-relaxed whitespace-pre-line">{description}</p>}
        </div>
    );
};

const ChampDuReferentiel: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
    pilote: PiloteDuJeu | null | undefined;
}> = ({ field, value, onChange, pilote }) => {
    const referentiel = useReferentiel(pilote, field.referentiel);
    const liste = useId();
    const [ouvert, setOuvert] = useState(false);
    const entrees = entreesDuNom(referentiel, value);

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
                    {nomsDuReferentiel(referentiel).map(nom => <option key={nom} value={nom} />)}
                </datalist>
            )}
            {ouvert && entrees.length > 0 && pilote && field.referentiel && (
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 space-y-3" data-description-du-referentiel>
                    {entrees.length > 1 && (
                        <p className="text-ui-10 text-app-text/50">{entrees.length} entrées portent ce nom, d’une époque à l’autre :</p>
                    )}
                    {entrees.map((e, i) => <DescriptionDeLEntree key={i} pilote={pilote} chemin={field.referentiel!} entree={e} />)}
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
