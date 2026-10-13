import type { DegreDeReussite } from '../degresDeReussite';

/**
 * **Le jet de Torg Eternity** — 2026-10-13, le « point 5 » de l'évaluation des
 * pilotes.
 *
 * *« Le joueur lance un dé à vingt faces. Sur dix ou vingt, le dé explose
 * (relance cumulée). Le total du dé est converti en valeur bonus via la Table des
 * Bonus et s'ajoute à la compétence ou à l'attribut pour donner le total
 * d'action. Ce total doit égaler ou dépasser le Niveau de Difficulté »*
 * (`docs/systems/torg/rules/resolution-des-jets.md`).
 *
 * Le pilote ne porte aucun de ces nombres : il déclare `tableDeBonus: 'torg'`,
 * comme Rêves de Dragons déclare sa table de résolution. *Un modèle qui dérive
 * une table de nombres produit des nombres plausibles et faux.*
 */

/**
 * **La Table des Bonus**, page 109 du livre de base.
 *
 * ⚠️ Transcrite le 2026-10-13 depuis le carnet NotebookLM « Torg » (une source
 * citée), **pas depuis le corpus** : la fiche `resolution-des-jets.md` dit
 * elle-même ne pas la contenir. À relire contre le livre.
 *
 * Chaque ligne : le plus petit total du dé qui donne ce bonus. Le 1 n'y figure
 * pas : c'est un échec, quel que soit le reste.
 */
export const TABLE_DES_BONUS: readonly { des: number; bonus: number }[] = [
    { des: 2, bonus: -8 },
    { des: 3, bonus: -6 },
    { des: 5, bonus: -4 },
    { des: 7, bonus: -2 },
    { des: 9, bonus: -1 },
    { des: 11, bonus: 0 },
    { des: 13, bonus: 1 },
    { des: 15, bonus: 2 },
    { des: 16, bonus: 3 },
    { des: 17, bonus: 4 },
    { des: 18, bonus: 5 },
    { des: 19, bonus: 6 },
    { des: 20, bonus: 7 },
];

/**
 * Le bonus d'un total du dé.
 *
 * Au-delà de 20 — après une explosion —, **+1 par tranche de cinq** : 21–25
 * donnent +8, 26–30 +9, et ainsi de suite.
 */
export function bonusDeTorg(totalDuDe: number): number {
    if (totalDuDe > 20) return 7 + Math.ceil((totalDuDe - 20) / 5);
    let bonus = TABLE_DES_BONUS[0].bonus;
    for (const ligne of TABLE_DES_BONUS) if (totalDuDe >= ligne.des) bonus = ligne.bonus;
    return bonus;
}

/** Les dés d'un jet : le premier, puis les relances d'une explosion. */
export function lancerLeDeDeTorg(lancer: () => number): number[] {
    const des = [lancer()];
    // Un 1 au premier dé est un échec critique : on ne relance rien.
    while (des[des.length - 1] === 10 || des[des.length - 1] === 20) des.push(lancer());
    return des;
}

/** Les niveaux de succès du livre, et leur rang sur l'échelle commune de GM-OS. */
const NIVEAUX: readonly { margeMin: number; nom: string; degre: DegreDeReussite }[] = [
    { margeMin: 10, nom: 'Succès Spectaculaire', degre: 'reussite-particuliere' },
    { margeMin: 5, nom: 'Succès Supérieur', degre: 'reussite-significative' },
    { margeMin: 0, nom: 'Succès Simple', degre: 'reussite-normale' },
];

export interface JetDeTorg {
    des: number[];
    totalDuDe: number;
    /** Un 1 au premier dé : l'action échoue, aucune Possibilité ne le rattrape. */
    echecCritique: boolean;
    bonus: number;
    totalDAction: number;
    /** Total d'action moins Niveau de Difficulté. */
    marge: number;
    /** Le mot du livre : « Succès Supérieur », « Échec critique »… */
    nom: string;
    degre: DegreDeReussite;
}

/** Ce que donne un jet, pour un niveau (attribut + compétence) et un Niveau de Difficulté. */
export function resoudreLeJetDeTorg(niveau: number, difficulte: number, des: number[]): JetDeTorg {
    const totalDuDe = des.reduce((s, d) => s + d, 0);
    const echecCritique = des[0] === 1;
    const bonus = bonusDeTorg(totalDuDe);
    const totalDAction = niveau + bonus;
    const marge = totalDAction - difficulte;

    if (echecCritique) {
        return { des, totalDuDe, echecCritique, bonus, totalDAction, marge, nom: 'Échec critique', degre: 'echec-total' };
    }
    if (marge < 0) {
        return { des, totalDuDe, echecCritique, bonus, totalDAction, marge, nom: 'Échec', degre: 'echec-normal' };
    }
    const niveauDeSucces = NIVEAUX.find(n => marge >= n.margeMin)!;
    return { des, totalDuDe, echecCritique, bonus, totalDAction, marge, nom: niveauDeSucces.nom, degre: niveauDeSucces.degre };
}

/** Le résultat en une ligne, pour l'écran et le journal. */
export function direLeJetDeTorg(j: JetDeTorg, niveau: number, difficulte: number): string {
    const de = j.des.length > 1 ? `${j.des.join(' + ')} = ${j.totalDuDe}` : `${j.totalDuDe}`;
    const signe = j.bonus >= 0 ? `+${j.bonus}` : `${j.bonus}`;
    return `${j.nom} — dé ${de} → bonus ${signe} ; total d'action ${j.totalDAction} (niveau ${niveau}) contre ND ${difficulte}`
        + (j.echecCritique ? '' : `, marge ${j.marge >= 0 ? '+' : ''}${j.marge}`);
}
