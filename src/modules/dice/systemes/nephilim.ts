import type { EchelleDuJet } from '../degresDeReussite';

/**
 * **Le jet de Nephilim Légende** — 2026-10-17, d'après le corpus du jeu
 * (`docs/systems/nephilim/rules/resolution-des-jets.md`).
 *
 * *« La valeur cible se calcule en additionnant les degrés d'un Vécu (passé ou
 * contemporain) et optionnellement les degrés d'un Ka-élément correspondant à
 * l'approche choisie, modifiés par des bonus ou malus en degrés, puis en
 * multipliant le total par dix. »* On lance un d100, réussi s'il est inférieur
 * ou égal à la cible.
 *
 * - **Réussite critique** : un double (11, 22… 99) réussi ;
 * - **maladresse** : un double raté, ou le « 00 », qui échoue toujours ;
 * - **marge de réussite** : le chiffre des dizaines, plus un point par degré
 *   au-delà de dix.
 *
 * Sans ce calcul, le pilote additionnait les degrés et les comparait au d100 :
 * un Vécu 4 avec Ka 5 donnait 9 % au lieu de 90. *Facteur dix, dans le sens qui
 * fait échouer tout le monde.*
 */
export interface CibleDeNephilim {
    /** Le total en degrés : Vécu + Ka + circonstances. */
    degres: number;
    /** Le pourcentage à ne pas dépasser. */
    chances: number;
    echelle: EchelleDuJet;
    explication: string;
    remarques: string[];
}

/**
 * @param vecu       le degré du Vécu retenu (passé ou contemporain)
 * @param ajustement le Ka d'approche et les circonstances, en degrés (±5)
 */
export function cibleDeNephilim(vecu: number, ajustement: number): CibleDeNephilim {
    const degres = Math.max(0, Math.floor(vecu + ajustement));
    const chances = degres * 10;
    const auDela = Math.max(0, degres - 10);
    const signe = ajustement >= 0 ? `+ ${ajustement}` : `− ${-ajustement}`;
    const remarques = auDela > 0
        ? [`${auDela} degré${auDela > 1 ? 's' : ''} au-delà de dix : +${auDela} à la marge de réussite.`]
        : [];
    return {
        degres,
        chances,
        explication: ajustement ? `(${vecu} ${signe}) × 10 = ${chances} %` : `${vecu} × 10 = ${chances} %`,
        remarques,
        echelle: {
            chances,
            particuliere: null,
            significative: null,
            echecParticulier: null,
            echecTotal: null,
            doubles: true,
            bonusDeMarge: auDela,
        },
    };
}
