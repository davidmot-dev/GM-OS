/**
 * **Les contacts et la fortune de Crimes** — C7 (2026-10-23), livre p. 428-431.
 *
 * Un contact a une **loyauté de base**, celle de la fiche, et une loyauté
 * **actuelle** : chaque appel en retire un point « pour la durée du scénario »,
 * et la base revient à la fin du scénario (p. 429-430). On tient donc les appels
 * à part, sans jamais effacer la base. La fortune a deux valeurs distinctes : un
 * **niveau** de 1 à 4 et une **jauge** qui « fonctionne comme la névrose » (p. 431).
 */

export interface ContactDeCrimes {
    nom: string;
    /** La loyauté de base, celle de la fiche (0 à 4). */
    base: number;
    /** Les appels du scénario en cours : autant de points de loyauté en moins. */
    appels: number;
}

export const loyauteActuelle = (c: Pick<ContactDeCrimes, 'base' | 'appels'>) => Math.max(0, c.base - c.appels);

/**
 * Une demande au-delà de ce que la loyauté permet : une contrepartie, ou un
 * test de loyauté « Social GARDE X, X étant le niveau du contact » (p. 429).
 */
export const testDeLoyaute = (c: Pick<ContactDeCrimes, 'base'>) => `Social GARDE ${Math.max(1, c.base)}`;

/** Un contact d'au moins 3 en loyauté qui disparaît coûte un point de psychose (p. 430). */
export const pertePsychotique = (c: Pick<ContactDeCrimes, 'base'>) => c.base >= 3;

/** Les quatre niveaux de fortune (p. 431). */
export const NIVEAUX_DE_FORTUNE: Record<number, string> = {
    1: 'proche de la mendicité',
    2: 'travail régulier, s’en sort correctement',
    3: 'classe moyenne, une certaine aisance',
    4: 'classes aisées, moyens conséquents',
};

/**
 * Le seuil de la jauge, que le livre ne chiffre pas : par défaut, la fin de la
 * piste imprimée (dix ronds). Point à confirmer par le meneur (registre C7).
 */
export const SEUIL_DE_FORTUNE_PAR_DEFAUT = 10;

export interface MouvementDeFortune {
    niveau: number;
    jauge: number;
    /** Le niveau a changé : la jauge a atteint son seuil ou zéro. */
    change?: 'monte' | 'descend';
    ligne: string;
}

/**
 * Un point de jauge en plus (une rétribution) ou en moins (un achat conséquent,
 * ou le dépassement de ses limites financières), p. 431. La jauge au seuil fait
 * monter le niveau, la jauge à zéro le fait descendre ; elle repart alors à la
 * moitié du seuil, comme la névrose redescend à la moitié (p. 409) — sans quoi un
 * niveau gagné à zéro se reperdrait aussitôt.
 */
export function mouvementDeFortune(niveau: number, jauge: number, delta: 1 | -1, seuil = SEUIL_DE_FORTUNE_PAR_DEFAUT): MouvementDeFortune {
    const n = Math.min(4, Math.max(1, niveau));
    const s = Math.max(2, seuil);
    const brute = Math.min(s, Math.max(0, jauge + delta));
    const milieu = Math.floor(s / 2);
    if (brute >= s && n < 4) {
        return { niveau: n + 1, jauge: milieu, change: 'monte', ligne: `Fortune : jauge au seuil (${s}), niveau ${n} → ${n + 1}, jauge repartie à ${milieu}` };
    }
    if (brute <= 0 && n > 1) {
        return { niveau: n - 1, jauge: milieu, change: 'descend', ligne: `Fortune : jauge à zéro, niveau ${n} → ${n - 1}, jauge repartie à ${milieu}` };
    }
    return { niveau: n, jauge: brute, ligne: `Fortune : jauge ${jauge} → ${brute} (niveau ${n})` };
}
