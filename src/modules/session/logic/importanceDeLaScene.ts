import type { ImportanceDeScene } from '../../../types/trame.types';

/**
 * **Le rang d'une scène dans l'intrigue, et la seule façon de le montrer.**
 *
 * Demandé par David le 2026-09-22 : *« indiquer qu'une scène fait partie de
 * l'intrigue principale, ou est secondaire, voire optionnelle, et que cela se
 * reflète visuellement (par exemple en gras, en italique ou autre) ».*
 *
 * ⭐ **Pourquoi un module et pas quatre `className` en ligne.** Une ligne de
 * scène s'affiche sur **quatre écrans** — la trame, la préparation de séance, le
 * panneau en séance, et la tablette du meneur. C'est la leçon déjà payée par
 * `PastilleDePreparation` : *quatre calculs séparés du même signe finissent par
 * ne plus dire la même chose de la même scène, et personne ne le verrait,
 * puisque chaque écran reste cohérent avec lui-même.*
 *
 * ---
 *
 * ⛔ **Le langage visuel doit franchir DEUX mondes de style.** Les écrans du
 * meneur emploient les jetons du thème (`text-app-text`, `border-accent`) ; la
 * tablette a sa propre palette d'ardoise (`text-slate-200`) et un titre déjà en
 * `font-bold`. Un « gras pour l'intrigue principale » écrit à la main aurait
 * donc été invisible là-bas.
 *
 * D'où la règle de ce module : **on ne rend que l'écart, jamais la base.**
 *
 * | Rang | Poids du titre | Ce que ça donne |
 * | --- | --- | --- |
 * | `principale` | `font-black` | plus lourd que la base, dans les deux mondes |
 * | `secondaire` | *rien* | exactement l'apparence d'hier |
 * | `optionnelle` | `italic font-normal` | italique, et **allégée** même là où la base est en gras |
 * | *absente* | *rien* | exactement l'apparence d'hier |
 *
 * ⭐ *Un champ neuf ne doit jamais rendre faux ce qui marchait avant lui* — les
 * deux lignes vides de cette table sont la raison pour laquelle une scène non
 * classée et une scène secondaire ne rendent **aucune** classe.
 */

/** Les trois rangs, dans l'ordre où on les offre au meneur. */
export const IMPORTANCES: readonly ImportanceDeScene[] = ['principale', 'secondaire', 'optionnelle'] as const;

/** Comment on les nomme à l'écran — au singulier, tel qu'on parle d'une scène. */
export const LIBELLE_DE_L_IMPORTANCE: Record<ImportanceDeScene, string> = {
    principale: 'Intrigue principale',
    secondaire: 'Intrigue secondaire',
    optionnelle: 'Optionnelle',
};

/** Le mot court, pour un bouton ou une étiquette étroite. */
export const MOT_DE_L_IMPORTANCE: Record<ImportanceDeScene, string> = {
    principale: 'Principale',
    secondaire: 'Secondaire',
    optionnelle: 'Optionnelle',
};

/**
 * Le rang d'une scène, ou `null` quand elle n'a pas été jugée.
 *
 * ⚠️ **Une valeur inconnue rend `null`, jamais elle-même.** Elle irait sinon
 * chercher une classe absente dans les tables ci-dessous, donc `undefined`, donc
 * `class="undefined"` dans le DOM — et un titre sans style que personne ne
 * saurait expliquer. *Une valeur fausse se rattrape à l'entrée ou pas du tout* —
 * la leçon du titre projeté, le 2026-09-21.
 */
export function importanceDeLaScene(scene: { importance?: unknown } | null | undefined): ImportanceDeScene | null {
    const valeur = scene?.importance;
    return IMPORTANCES.includes(valeur as ImportanceDeScene) ? (valeur as ImportanceDeScene) : null;
}

/**
 * Les classes à ajouter au titre de la scène.
 *
 * **Rien pour `secondaire` et pour l'absence** : voir la table du haut. On
 * concatène ce retour aux classes existantes du titre, on ne les remplace pas —
 * le barré d'une scène terminée et le grisé d'une scène jamais jouée restent la
 * même mécanique qu'avant.
 */
export function styleDuTitre(importance: ImportanceDeScene | null): string {
    switch (importance) {
        case 'principale': return 'font-black';
        /* `font-normal` est là pour la tablette, dont le titre est en gras par
           défaut : sans lui, une scène optionnelle y serait en gras italique,
           c'est-à-dire plus appuyée qu'une scène secondaire. */
        case 'optionnelle': return 'italic font-normal';
        default: return '';
    }
}

/**
 * Le liseré vertical posé au bord de la ligne, et son ombre en pointillé.
 *
 * **Pourquoi un liseré en plus du poids du texte.** Un gras isolé au milieu
 * d'une liste de quinze lignes ne se remarque pas ; une colonne de liserés se
 * lit d'un seul coup d'œil, et c'est ce qu'on cherche en préparant une séance :
 * *ce qui est obligatoire ce soir, et ce qu'on coupera si l'heure tourne.*
 *
 * ⛔ **Une étiquette en toutes lettres était le premier réflexe, et c'était le
 * mauvais** : la ligne porte déjà jusqu'à trois étiquettes — « en cours »,
 * « prévue », « improvisée » — et *la place qu'on prend là est prise au titre*,
 * qui se tronque. Le liseré ne coûte que deux pixels.
 *
 * ⚠️ **`transparent` plutôt que rien.** Le liseré est rendu pour *toutes* les
 * scènes, invisible quand il n'y a pas de rang : sinon les titres des scènes
 * classées seraient décalés de deux pixels par rapport aux autres, et la colonne
 * qu'on cherche à lire serait précisément celle qui n'existerait plus.
 */
export function couleurDuLisere(importance: ImportanceDeScene | null): string {
    switch (importance) {
        /* `sky` et pas l'accent : ce liseré vit aussi sur la tablette, qui n'a
           pas les jetons du thème. Et pas `amber`, qui dit déjà « improvisée »
           sur ces mêmes lignes. */
        case 'principale': return 'rgb(56 189 248 / 0.75)';
        case 'optionnelle': return 'rgb(56 189 248 / 0.4)';
        default: return 'transparent';
    }
}

/** Plein pour l'intrigue principale, pointillé pour l'optionnelle. */
export function lisereEstPointille(importance: ImportanceDeScene | null): boolean {
    return importance === 'optionnelle';
}

/**
 * De quoi composer une infobulle sans écraser celle qui existait.
 *
 * Trois de ces quatre écrans posaient déjà un `title` — « Close avec son acte,
 * sans avoir été jouée », ou le titre complet de la scène quand il est tronqué.
 * *Le remplacer par le rang aurait échangé une information contre une autre*,
 * et on aurait perdu la plus rare des deux.
 */
export function infobulle(...morceaux: (string | false | null | undefined)[]): string | undefined {
    const gardes = morceaux.filter((m): m is string => typeof m === 'string' && m.trim().length > 0);
    return gardes.length > 0 ? gardes.join(' — ') : undefined;
}

/** Ce que l'infobulle dit du rang, ou rien quand la scène n'a pas été jugée. */
export function infobulleDeLImportance(importance: ImportanceDeScene | null): string | undefined {
    return importance ? LIBELLE_DE_L_IMPORTANCE[importance] : undefined;
}
