/**
 * **Le réglage du compresseur de Voice-OS, sur un seul curseur.**
 *
 * *Chantier ouvert le 2026-09-03 : « je ne suis pas toujours content du
 * résultat ».*
 *
 * Le compresseur était figé à **8:1, seuil −24 dB, attaque 3 ms** — et un
 * commentaire l'annonçait comme « broadcast ». Ce n'est pas un compresseur à ce
 * taux-là, c'est un limiteur : tout sort au même niveau, un murmure comme un
 * cri. Trois conséquences, dont deux qui débordent du module :
 *
 * - **La voix perd son jeu.** Un meneur qui baisse la voix pour un secret
 *   voudrait qu'on l'entende baisser la voix.
 * - **Voice-to-Light n'a plus rien à suivre** : la lumière traduit un niveau
 *   qui ne bouge plus.
 * - **Ça pousse vers la saturation** : un signal ramené au plafond en
 *   permanence n'a plus de marge pour ce qui vient après — et il venait un
 *   formant à +16 dB et deux voies sommées.
 *
 * **On ne remplace pas un réglage figé par un autre réglage figé.** Le bon
 * niveau de compression dépend du micro, de la pièce et de la voix : il se
 * trouve à l'oreille, en une minute, et il ne se devine pas. D'où un curseur —
 * et **100 % reproduit exactement le réglage d'avant**, pour que rien ne soit
 * perdu et que la comparaison soit possible.
 */

export interface ReglageDuCompresseur {
    /** En dB. */
    seuil: number;
    /** Le taux, 1 signifiant « aucune compression ». */
    taux: number;
    /** La largeur du genou, en dB. */
    genou: number;
    /** En secondes. */
    attaque: number;
    /** En secondes. */
    relachement: number;
}

/** Ce que valait le compresseur avant le 2026-09-03 — soit le curseur à 100. */
export const REGLAGE_D_ORIGINE: ReglageDuCompresseur = {
    seuil: -24, taux: 8, genou: 6, attaque: 0.003, relachement: 0.15,
};

/**
 * Le réglage correspondant à une position du curseur (0 à 100).
 *
 * À **0**, le taux vaut 1 : le compresseur est traversé sans rien faire, quel
 * que soit le seuil. À **100**, on retrouve `REGLAGE_D_ORIGINE` à l'identique.
 * Entre les deux, tout bouge ensemble et dans le même sens — *un curseur qui
 * durcit le taux mais adoucit l'attaque ne veut plus rien dire.*
 */
export function reglageDuCompresseur(compression: number): ReglageDuCompresseur {
    const c = Math.max(0, Math.min(100, compression)) / 100;
    return {
        seuil: -12 - c * 12,
        taux: 1 + c * 7,
        genou: 12 - c * 6,
        /* Plus on compresse, plus l'attaque est vive : c'est ce qui tient les
           consonnes. Moins on compresse, plus elle est douce, pour ne pas
           pomper. */
        attaque: 0.003 + (1 - c) * 0.007,
        relachement: 0.15 + (1 - c) * 0.15,
    };
}
