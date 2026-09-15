import React from 'react';
import { valeursPossibles } from '../logic/formeDeLaTable';
import type { TableData } from '../types';

/**
 * **La portée du dé, dessinée — et les trous avec.**
 *
 * ⭐ **C'est le cœur de l'Atelier.** Le reste de l'écran fait gagner du temps ;
 * cette bande-là fait voir ce qu'aucune relecture ne montre.
 *
 * Un trou de couverture est invisible dans un fichier JSON : les bornes se
 * suivent, chaque entrée est plausible, et il faudrait tenir la liste des
 * valeurs du dé dans sa tête pour remarquer ce qui manque. À la table, il ne
 * produit pas une erreur — *il produit un résultat plausible et faux*, parce que
 * `resolveEntry` rend la plus proche sans jamais dire qu'il n'a rien trouvé.
 *
 * ⚠️ **Une valeur, une case — pas un intervalle mis à l'échelle.** Un `d66` n'a
 * pas 56 valeurs entre 11 et 66, il en a 36 : dessiner un ruban continu
 * mentirait exactement là où la bande doit être juste. *Ce qui n'est pas
 * tirable n'est pas dessiné.*
 */

interface Props {
    table: TableData;
    /** Survolée dans la grille : sa part de la bande s'éclaire. */
    entreeSurvolee?: number | null;
}

/** Au-delà, on ne dessine plus une case par valeur — l'écran n'y survivrait pas. */
const CASES_MAXIMALES = 240;

export const BandeDeCouverture: React.FC<Props> = ({ table, entreeSurvolee }) => {
    const possibles = valeursPossibles(table.dice);

    if (!possibles) {
        return (
            <p className="text-xs italic text-app-text/40">
                La portée de ce dé ne peut pas être dessinée : formule illisible, ou trop de valeurs.
            </p>
        );
    }

    if (possibles.length > CASES_MAXIMALES) {
        const couvertes = possibles.filter(v =>
            (table.entries ?? []).some(e => v >= e.min && v <= e.max)).length;
        return (
            <p className="text-xs text-app-text/50">
                {possibles.length} valeurs possibles — trop pour les dessiner.{' '}
                <span className={couvertes === possibles.length ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                    {couvertes} couverte(s).
                </span>
            </p>
        );
    }

    /* Combien d'entrées couvrent chaque valeur, et laquelle en premier : c'est
       celle-là que le moteur rendra, les suivantes ne serviront jamais. */
    const cases = possibles.map(valeur => {
        const rangs = (table.entries ?? [])
            .map((e, rang) => ({ e, rang }))
            .filter(({ e }) => Number.isInteger(e.min) && Number.isInteger(e.max)
                && valeur >= e.min && valeur <= e.max)
            .map(({ rang }) => rang);
        return { valeur, rangs };
    });

    const trous = cases.filter(c => c.rangs.length === 0).length;
    const doubles = cases.filter(c => c.rangs.length > 1).length;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-[2px]" role="img"
                aria-label={`Couverture du dé : ${cases.length - trous} valeurs sur ${cases.length}`}>
                {cases.map(({ valeur, rangs }) => {
                    const survolee = entreeSurvolee != null && rangs.includes(entreeSurvolee);
                    const couleur = rangs.length === 0
                        ? 'bg-red-600'
                        : rangs.length > 1
                            ? 'bg-amber-500'
                            : survolee ? 'bg-accent' : 'bg-emerald-600/60';
                    return (
                        <span
                            key={valeur}
                            title={rangs.length === 0
                                ? `${valeur} — aucune entrée. Le moteur rendra la plus proche.`
                                : rangs.length > 1
                                    ? `${valeur} — ${rangs.length} entrées ; seule la première sera tirée.`
                                    : `${valeur} — entrée n° ${rangs[0] + 1}`}
                            className={`h-4 w-4 rounded-[3px] transition-colors ${couleur} ${
                                survolee ? 'ring-1 ring-accent' : ''}`}
                        />
                    );
                })}
            </div>

            <p className="text-ui-9 uppercase tracking-widest text-app-text/40 flex flex-wrap gap-x-4 gap-y-1">
                <span>{cases.length} valeurs tirables</span>
                {trous > 0 && (
                    <span className="text-red-400 font-bold">{trous} sans entrée</span>
                )}
                {doubles > 0 && (
                    <span className="text-amber-400 font-bold">{doubles} prises deux fois</span>
                )}
                {trous === 0 && doubles === 0 && (
                    <span className="text-emerald-400">couverture complète</span>
                )}
            </p>
        </div>
    );
};

export default BandeDeCouverture;
