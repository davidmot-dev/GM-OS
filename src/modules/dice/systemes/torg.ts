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

/**
 * **Les dés d'un test, après coup** — la Possibilité, « Un de plus ! », la
 * relance d'une compétence favorisée (carnet NotebookLM « Torg », 2026-10-13) :
 *
 * - la Possibilité se dépense **après avoir vu le premier dé**, une par test ;
 *   son d20 s'ajoute au total du dé **avant** la Table des Bonus, et un 1 à 9
 *   y vaut 10 *« sans toutefois accorder un autre jet »* ;
 * - « Un de plus ! » est un d20 de plus, **sans** ce minimum ;
 * - une compétence favorisée relance le **premier** dé, une fois, sauf sur un
 *   échec critique ; on garde le nouveau résultat ;
 * - sans entraînement, *« ne peut effectuer un nouveau jet quand il obtient
 *   un 20 au dé, uniquement quand il obtient un 10 »*.
 */
export interface DesDeTorg {
    /** Le premier dé et ses relances. */
    premier: number[];
    possibilite?: number[];
    unDePlus?: number[];
    /** La compétence favorisée a déjà servi. */
    relance?: boolean;
}

/** Un d20 et ses relances : sur 10, et sur 20 si le personnage est entraîné. */
export function lancerUneChaine(lancer: () => number, entraine = true): number[] {
    const des = [lancer()];
    const explose = (d: number) => d === 10 || (entraine && d === 20);
    while (explose(des[des.length - 1])) des.push(lancer());
    return des;
}

/** Le dé d'une Possibilité : un 1 à 9 vaut 10, sans relance ; un 10 ou un 20 naturel explose. */
export function lancerLaPossibilite(lancer: () => number, entraine = true): number[] {
    const premier = lancer();
    if (premier < 10) return [10];
    const des = [premier];
    const explose = (d: number) => d === 10 || (entraine && d === 20);
    while (explose(des[des.length - 1])) des.push(lancer());
    return des;
}

export interface OptionsDeTorg {
    /** L'échec critique va de 1 à cette valeur — 1 d'ordinaire, jusqu'à 4 selon le risque. */
    plageCritique?: number;
    /** Ce qu'on retire au total d'action : −1 par Blessure, jusqu'à −3. */
    malus?: number;
    /** D'où vient le malus, pour le dire. */
    raisonDuMalus?: string;
}

const somme = (des?: number[]) => (des ?? []).reduce((s, d) => s + d, 0);

/** Ce que donne un test complet : le premier dé, puis ce qui s'y est ajouté. */
export function resoudreTorg(niveau: number, difficulte: number, des: DesDeTorg, options: OptionsDeTorg = {}): JetDeTorg {
    const totalDuDe = somme(des.premier) + somme(des.possibilite) + somme(des.unDePlus);
    const echecCritique = des.premier[0] <= Math.max(1, options.plageCritique ?? 1);
    const bonus = bonusDeTorg(totalDuDe);
    const malus = Math.max(0, options.malus ?? 0);
    const totalDAction = niveau - malus + bonus;
    const marge = totalDAction - difficulte;
    const tous = [...des.premier, ...(des.possibilite ?? []), ...(des.unDePlus ?? [])];
    const base = { des: tous, totalDuDe, echecCritique, bonus, totalDAction, marge };
    if (echecCritique) return { ...base, nom: 'Échec critique', degre: 'echec-total' };
    if (marge < 0) return { ...base, nom: 'Échec', degre: 'echec-normal' };
    const n = NIVEAUX.find(x => marge >= x.margeMin)!;
    return { ...base, nom: n.nom, degre: n.degre };
}

/** Le test en une ligne : les dés et leur origine, le bonus, le malus, le verdict. */
export function direTorg(j: JetDeTorg, des: DesDeTorg, niveau: number, difficulte: number, options: OptionsDeTorg = {}): string {
    const morceaux = [des.premier.join(' + ')];
    if (des.possibilite) morceaux.push(`Possibilité ${des.possibilite.join(' + ')}`);
    if (des.unDePlus) morceaux.push(`Un de plus ${des.unDePlus.join(' + ')}`);
    const de = morceaux.length > 1 || des.premier.length > 1 ? `${morceaux.join(' + ')} = ${j.totalDuDe}` : `${j.totalDuDe}`;
    const signe = j.bonus >= 0 ? `+${j.bonus}` : `${j.bonus}`;
    const malus = options.malus ? `, −${options.malus}${options.raisonDuMalus ? ` ${options.raisonDuMalus}` : ''}` : '';
    if (j.echecCritique) return `Échec critique — premier dé ${des.premier[0]} : l'action échoue, aucune Possibilité n'y change rien`;
    return `${j.nom} — dé ${de} → bonus ${signe} ; total d'action ${j.totalDAction} (niveau ${niveau}${malus}) contre ND ${difficulte}, marge ${j.marge >= 0 ? '+' : ''}${j.marge}`;
}

/**
 * **L'Annulation des dommages** (carnet « Torg », 2026-10-13) : *« immédiatement
 * après que les dommages ont été calculés, mais avant qu'ils ne prennent effet »*,
 * une Possibilité et un test de Réalité contre ND 10. Elle n'annule que l'attaque
 * en cours, jamais des dommages déjà subis ; une tentative par attaque.
 */
export const ND_DE_L_ANNULATION = 10;

/** Ce qu'annule un test, selon son niveau de succès. */
export function ceQueLAnnulationAnnule(j: Pick<JetDeTorg, 'degre'>): string {
    switch (j.degre) {
        case 'reussite-particuliere': return "annule toutes les Blessures et tout le Choc de l'attaque";
        case 'reussite-significative': return "annule 2 Blessures et tout le Choc de l'attaque";
        case 'reussite-normale': return "annule 1 Blessure et tout le Choc de l'attaque";
        default: return "rien n'est annulé";
    }
}
