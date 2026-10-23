import React from 'react';
import {
    LIBELLES_DES_ATTEINTES, etatDuPhysique, poserUneAtteinte, potentielActuel,
    type Atteinte, type MarquesDuPotentiel,
} from '../../../dice/systemes/potentielGarde';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';

/**
 * **Les atteintes des Potentiels** — Crimes, C2 (2026-10-22), livre p. 395–396.
 *
 * Une ligne par Potentiel : sa valeur de départ, ses marques — traits de
 * fatigue, croix d'épuisement, étoiles de blessure — et sa valeur actuelle, celle
 * que le jet lance. Poser une marque suit la règle du livre : une marque plus
 * grave **prend la place** d'une marque moindre déjà notée. La fatigue s'efface
 * à « Fin de scène », l'épuisement à « Bonne nuit » (bandeau du meneur) ; une
 * blessure se soigne ici, d'un point à la fois.
 *
 * Sous le panneau de jet, sur la fiche du meneur et sur la tablette.
 */
const SIGNES: Record<Atteinte, string> = { fatigue: '／', epuisement: '✕', blessures: '★' };

const AtteintesDesPotentiels: React.FC<{
    regle: NonNullable<NonNullable<DescripteurDeJet['garde']>['atteintes']>;
    valeurs: Record<string, unknown>;
    libelleDe: (champ: string) => string;
    ecrire: (maj: Record<string, number>) => void;
    /** Une ligne au journal : « Physique : +1 Blessure → actuel 2 ». */
    consigner: (ligne: string) => void;
}> = ({ regle, valeurs, libelleDe, ecrire, consigner }) => {
    const nombre = (champ: string) => Math.max(0, Number(valeurs[champ]) || 0);

    return (
        <section data-atteintes className="flex flex-col gap-2">
            {Object.entries(regle.parPotentiel).map(([potentiel, champs]) => {
                const base = Number(valeurs[potentiel]) || 0;
                const m: MarquesDuPotentiel = {
                    fatigue: nombre(champs.fatigue), epuisement: nombre(champs.epuisement), blessures: nombre(champs.blessures),
                };
                const actuel = potentielActuel(base, m);
                const nom = libelleDe(potentiel);
                const etat = potentiel === regle.incapacite ? etatDuPhysique(actuel) : null;
                const changer = (apres: MarquesDuPotentiel, quoi: string) => {
                    ecrire({ [champs.fatigue]: apres.fatigue, [champs.epuisement]: apres.epuisement, [champs.blessures]: apres.blessures });
                    consigner(`${nom} : ${quoi} → actuel ${potentielActuel(base, apres)}`);
                };
                const marques = (['blessures', 'epuisement', 'fatigue'] as const).flatMap(a => Array.from({ length: m[a] }, () => a));
                return (
                    <div key={potentiel} data-atteintes-du-potentiel={potentiel}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-app-border/30 px-3 py-2 text-xs">
                        <span className="w-20 font-black uppercase tracking-widest text-ui-9 text-app-text/60">{nom}</span>
                        <span className="font-mono text-app-text/50" title="Valeur de départ">{base}</span>
                        <span className="font-mono text-etat-danger" aria-label={`${m.fatigue} fatigue, ${m.epuisement} épuisement, ${m.blessures} blessure`}>
                            {marques.map(a => SIGNES[a]).join(' ') || '—'}
                        </span>
                        <span className="font-mono">
                            actuel <strong className={`text-base ${actuel < base ? 'text-etat-alerte' : 'text-accent'}`}>{actuel}</strong>
                        </span>
                        <span className="ml-auto flex flex-wrap gap-1">
                            {(['fatigue', 'epuisement', 'blessures'] as const).map(a => (
                                <button key={a} type="button" onClick={() => changer(poserUneAtteinte(m, a), `+1 ${LIBELLES_DES_ATTEINTES[a]}`)}
                                    title={a === 'fatigue' ? 'Un trait : s’efface en fin de scène'
                                        : a === 'epuisement' ? 'Une croix, à la place d’un trait s’il y en a : une par bonne nuit'
                                            : 'Une étoile, à la place d’une croix ou d’un trait s’il y en a : se soigne'}
                                    className="px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50">
                                    + {LIBELLES_DES_ATTEINTES[a]}
                                </button>
                            ))}
                            <button type="button" disabled={m.blessures === 0}
                                onClick={() => changer({ ...m, blessures: m.blessures - 1 }, 'une blessure soignée')}
                                title="Un point de blessure regagné : stabilisation, soins, guérison — au jugement du meneur (p. 396)"
                                className="px-2 py-0.5 rounded-md border border-etat-succes/40 text-etat-succes text-ui-10 font-bold disabled:opacity-30">
                                Soigner
                            </button>
                        </span>
                        {etat && <p className="basis-full text-ui-11 font-bold text-etat-danger">{etat}</p>}
                    </div>
                );
            })}
        </section>
    );
};

export default AtteintesDesPotentiels;
