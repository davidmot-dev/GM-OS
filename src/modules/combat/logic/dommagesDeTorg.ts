/**
 * **Les dommages de Torg Eternity** — 2026-10-13, d'après la Table des
 * Dommages du livre de base, transcrite depuis le carnet NotebookLM « Torg »
 * (`docs/systems/torg/rules/sante-et-blessures.md` la résume).
 *
 * | Dommages − Résistance | Effet                         |
 * | --------------------- | ----------------------------- |
 * | −6 ou moins           | rien                          |
 * | −5 à −1               | 1 Choc                        |
 * | 0 à 4                 | 2 Choc                        |
 * | 5 à 9                 | 1 Blessure, 2 Choc            |
 * | 10 à 14               | 2 Blessures, 4 Choc           |
 * | et ainsi de suite     | +1 Blessure, +2 Choc par 5    |
 *
 * Exemples du livre : 11 contre Résistance 10 → 2 Choc ; 29 contre 17 → 2
 * Blessures et 4 Choc.
 */

export interface DommagesDeTorg {
    /** Dommages moins Résistance. */
    ecart: number;
    blessures: number;
    choc: number;
}

export function dommagesDeTorg(degats: number, resistance: number): DommagesDeTorg {
    const ecart = Math.floor(degats) - Math.floor(resistance);
    if (ecart <= -6) return { ecart, blessures: 0, choc: 0 };
    if (ecart < 0) return { ecart, blessures: 0, choc: 1 };
    const blessures = Math.floor(ecart / 5);
    return { ecart, blessures, choc: blessures > 0 ? 2 * blessures : 2 };
}

/**
 * Le Choc ajouté, plafonné : *« Ignorez tout nouveau point de Choc après cette
 * valeur »*. Le KO tombe quand le Choc **dépasse** le maximum — à égalité, on
 * reste debout.
 */
export function ajouterLeChoc(actuel: number, ajout: number, max: number | null): { valeur: number; ko: boolean } {
    const total = Math.max(0, actuel) + Math.max(0, ajout);
    if (max === null || !Number.isFinite(max)) return { valeur: total, ko: false };
    return { valeur: Math.min(total, max), ko: total > max };
}

/** Le coup en une phrase, pour le journal et l'écran. */
export function direLesDommages(degats: number, resistance: number, d: DommagesDeTorg, ko: boolean): string {
    const effets = d.blessures === 0 && d.choc === 0
        ? 'aucun effet'
        : [d.blessures > 0 ? `${d.blessures} Blessure${d.blessures > 1 ? 's' : ''}` : '', `${d.choc} Choc`].filter(Boolean).join(', ');
    return `${degats} dommages contre Résistance ${resistance} : ${effets}${ko ? ' — KO, le Choc dépasse son maximum' : ''}`;
}
