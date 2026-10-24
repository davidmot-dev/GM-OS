/**
 * **Le Haut-Rêve de Rêve de Dragon** — 24/10/2026, à la demande de David
 * (« on va finir rêve de dragons »). Livre du Haut-Rêve 2.3.1, p. 181–210,
 * pages **imprimées** (PDF = imprimée + 1). Les tables ont été relues sur les
 * pages rendues en image, pas sur le texte extrait : celui-ci mélangeait les
 * colonnes de la table des rencontres.
 *
 * Ce module ne tient que des tables et des calculs. Ce qui s'écrit sur une
 * fiche vit dans `session/logic/hautReveDuVoyageur.ts`.
 */

import { bandesDuJet, type BandesDuJet } from './revesDeDragons';

/** Les quatorze genres de terres, tels que la carte des TMR les nomme. */
export type GenreDeTerre = 'cite' | 'sanctuaire' | 'plaines' | 'pont' | 'collines' | 'foret' | 'monts' | 'desert'
    | 'fleuve' | 'lac' | 'marais' | 'gouffre' | 'necropole' | 'desolation';

/** Le nom des terres, tel que la carte l'écrit. */
export const NOM_DES_TERRES: Readonly<Record<GenreDeTerre, string>> = {
    cite: 'cité', sanctuaire: 'sanctuaire', plaines: 'plaines', pont: 'pont', collines: 'collines', foret: 'forêt', monts: 'monts',
    desert: 'désert', fleuve: 'fleuve', lac: 'lac', marais: 'marais', gouffre: 'gouffre', necropole: 'nécropole', desolation: 'désolation',
};

/** Les sept colonnes de la table des rencontres (p. 183). */
const COLONNE: Readonly<Record<GenreDeTerre, number>> = {
    cite: 0, sanctuaire: 0, plaines: 1, pont: 1, collines: 2, foret: 2, monts: 3, desert: 3,
    fleuve: 4, lac: 4, marais: 5, gouffre: 5, necropole: 6, desolation: 6,
};

/** Fleuve, lac et marais : la case doit être maîtrisée, force 7 (p. 187). */
export const estHumide = (genre: GenreDeTerre) => genre === 'fleuve' || genre === 'lac' || genre === 'marais';
export const FORCE_DES_CASES_HUMIDES = 7;

export type IdDeRencontre = 'messager' | 'passeur' | 'fleur' | 'mangeur' | 'changeur' | 'briseur' | 'reflet'
    | 'tourbillon-blanc' | 'tourbillon-noir' | 'reve-de-dragon' | 'passeur-fou' | 'tourbillon-rouge';

export interface Rencontre {
    id: IdDeRencontre;
    nom: string;
    /** Les dés de la force, « 2d4 », ou « 7+ddr » pour le Rêve de Dragon. */
    force: string;
    /** Les bornes du d100 par colonne ; `null` : cette terre ne la connaît pas. */
    bornes: readonly ([number, number] | null)[];
    maitrisee: string;
    nonMaitrisee: string;
    /** Points de refoulement si on la refoule (p. 183, 186, 197). */
    refoulement: number;
    /** On peut la laisser passer sans la maîtriser ni se dérober (Messager, Passeur, p. 184). */
    ignorable?: boolean;
    /** Une prison : on lutte de round en round, sans dérobade ni refoulement une fois engagé (p. 185). */
    prison?: { reveParRound: number; vieParRound: number; deriveParRound: number };
}

const B = (...b: ([number, number] | null)[]) => b;

/** La table des rencontres (p. 183), et la table spéciale des queues (p. 195). */
export const RENCONTRES: readonly Rencontre[] = [
    { id: 'messager', nom: 'Messager des rêves', force: '2d4', bornes: B([1, 25], [1, 20], [1, 15], [1, 10], [1, 5], [1, 2], null), refoulement: 1, ignorable: true,
        maitrisee: 'Peut être envoyé jusqu’à sa force en cases : le sort se lance depuis sa case, ce round-ci. Pas de case humide à maîtriser pour lui.', nonMaitrisee: 'Disparaît.' },
    { id: 'passeur', nom: 'Passeur des rêves', force: '2d4', bornes: B([26, 50], [21, 40], [16, 30], [11, 20], [6, 10], [3, 4], null), refoulement: 1, ignorable: true,
        maitrisee: 'Téléporte le demi-rêve jusqu’à sa force en cases, sans fatigue ni nouvelle rencontre. Une case humide d’arrivée se maîtrise.', nonMaitrisee: 'Disparaît.' },
    { id: 'fleur', nom: 'Fleur des rêves', force: '1d6', bornes: B([51, 65], [41, 55], [31, 42], [21, 26], [11, 13], [5, 5], null), refoulement: 1,
        maitrisee: 'Le rêve augmente de sa force.', nonMaitrisee: 'Disparaît.' },
    { id: 'mangeur', nom: 'Mangeur de rêve', force: '1d6', bornes: B([66, 70], [56, 60], [43, 54], [27, 44], [14, 37], [6, 29], [1, 20]), refoulement: 1,
        maitrisee: 'Disparaît.', nonMaitrisee: 'Le rêve diminue de sa force.' },
    { id: 'changeur', nom: 'Changeur de rêve', force: '2d6', bornes: B([71, 80], [61, 75], [55, 69], [45, 59], [38, 49], [30, 39], [21, 30]), refoulement: 1,
        maitrisee: 'Téléporte le demi-rêve sur une case du même genre, au choix, sans limite de distance.', nonMaitrisee: 'Le téléporte sur une case du même genre choisie par le meneur ; seul le genre est dit.' },
    { id: 'briseur', nom: 'Briseur de rêve', force: '2d6', bornes: B([81, 85], [76, 82], [70, 82], [60, 75], [50, 65], [40, 60], [31, 50]), refoulement: 1,
        maitrisee: 'Disparaît ; on tire un nouveau d7 de rencontre.', nonMaitrisee: 'Brise la concentration : le haut-rêvant quitte les TMR ; il peut remonter le round suivant.' },
    { id: 'reflet', nom: 'Reflet d’ancien rêve', force: '2d6', bornes: B([86, 90], [83, 88], [83, 88], [76, 85], [66, 79], [61, 75], [51, 65]), refoulement: 1,
        prison: { reveParRound: 0, vieParRound: 0, deriveParRound: 0 },
        maitrisee: 'Disparaît : le round redevient normal.', nonMaitrisee: 'Emprisonne le demi-rêve sur sa case ; nouvelle maîtrise chaque round, 1 point de fatigue par round.' },
    { id: 'tourbillon-blanc', nom: 'Tourbillon blanc', force: '2d6', bornes: B([91, 94], [89, 93], [89, 93], [86, 92], [80, 89], [76, 86], [66, 80]), refoulement: 1,
        prison: { reveParRound: 1, vieParRound: 0, deriveParRound: 1 },
        maitrisee: 'Disparaît.', nonMaitrisee: 'Emporte le demi-rêve : 1 fatigue et 1 rêve par round de défaite ; dérive d’autant de cases dans une direction tirée.' },
    { id: 'tourbillon-noir', nom: 'Tourbillon noir', force: '2d8', bornes: B([95, 97], [94, 97], [94, 97], [93, 97], [90, 97], [87, 97], [81, 97]), refoulement: 1,
        prison: { reveParRound: 2, vieParRound: 0, deriveParRound: 2 },
        maitrisee: 'Disparaît.', nonMaitrisee: 'Comme le blanc, mais 2 rêves par round de défaite et une dérive double.' },
    { id: 'reve-de-dragon', nom: 'Rêve de Dragon', force: '7+ddr', bornes: B([98, 100], [98, 100], [98, 100], [98, 100], [98, 100], [98, 100], [98, 100]), refoulement: 2,
        maitrisee: 'Le rêve augmente de sa force ; un point de seuil regagné ; une particulière donne une tête de Dragon.', nonMaitrisee: 'Une queue de Dragon, deux sur un échec total.' },
    { id: 'passeur-fou', nom: 'Passeur fou', force: '2d8', bornes: [], refoulement: 2,
        maitrisee: 'Disparaît.', nonMaitrisee: 'Emporte le demi-rêve jusqu’au plus proche sort en réserve, qu’il déclenche ; sinon d’autant de cases que sa force.' },
    { id: 'tourbillon-rouge', nom: 'Tourbillon rouge', force: '2d8', bornes: [], refoulement: 3,
        prison: { reveParRound: 2, vieParRound: 1, deriveParRound: 4 },
        maitrisee: 'Disparaît.', nonMaitrisee: 'Tourbillon vampire : chaque round de défaite, dérive de 4 cases, 2 rêves et 1 point de vie.' },
];

export const rencontre = (id: IdDeRencontre): Rencontre => RENCONTRES.find(r => r.id === id)!;

/** Le genre de rencontre selon la terre et le d100 (p. 183). */
export function rencontreDuD100(genre: GenreDeTerre, d100: number): Rencontre {
    if (!Number.isInteger(d100) || d100 < 1 || d100 > 100) throw new Error('Rencontre : un d100 de 1 à 100.');
    const colonne = COLONNE[genre];
    const trouvee = RENCONTRES.find(r => { const b = r.bornes[colonne]; return b && d100 >= b[0] && d100 <= b[1]; });
    if (!trouvee) throw new Error(`Aucune rencontre pour ${d100} en ${genre}.`);
    return trouvee;
}

/** La table spéciale (1d7) d'une « Mauvaise rencontre en perspective » (p. 195) : la force s'y ajoute. */
export const TABLE_SPECIALE: readonly { id: IdDeRencontre; force: string; bonus: number }[] = [
    { id: 'mangeur', force: '1d6', bonus: 0 }, { id: 'mangeur', force: '2d6', bonus: 0 }, { id: 'reflet', force: '2d6', bonus: 4 },
    { id: 'tourbillon-blanc', force: '2d6', bonus: 4 }, { id: 'tourbillon-noir', force: '2d8', bonus: 4 },
    { id: 'passeur-fou', force: '2d8', bonus: 0 }, { id: 'tourbillon-rouge', force: '2d8', bonus: 0 },
];

/**
 * Le d7 de rencontre : un d8 dont le 8 se relance (p. 182). Seul le 7 amène une
 * rencontre.
 */
export function d7DeRencontre(d8: readonly number[]): { valeur: number; rencontre: boolean } {
    if (!d8.length || d8.some(x => !Number.isInteger(x) || x < 1 || x > 8) || d8.slice(0, -1).some(x => x !== 8) || d8.at(-1) === 8) {
        throw new Error('d7 : relancer chaque 8 jusqu’à un résultat de 1 à 7.');
    }
    return { valeur: d8.at(-1)!, rencontre: d8.at(-1) === 7 };
}

/**
 * Le ddr : un d8 dont le 8 vaut zéro, relancé et ajouté sur un 7 (p. 187).
 * Les tirages sont donnés **de 0 à 7** — le 8 du dé déjà converti en zéro.
 */
export function ddr(tirages: readonly number[]): number {
    if (!tirages.length || tirages.length > 100 || tirages.some((x, i) => !Number.isInteger(x) || x < 0 || x > 7 || (i < tirages.length - 1 && x !== 7))
        || tirages.at(-1) === 7) throw new Error('ddr : valeurs de 0 à 7 (le 8 vaut zéro), relancer et ajouter chaque 7.');
    return tirages.reduce((n, x) => n + x, 0);
}

/** Les bornes d'une force tirée, pour contrôler une saisie : « 2d4 » de 2 à 8. */
export function bornesDeLaForce(force: string, bonus = 0): [number, number] {
    const m = /^(\d)d(\d)$/.exec(force);
    if (!m) return [7, Infinity];
    return [Number(m[1]) + bonus, Number(m[1]) * Number(m[2]) + bonus];
}

/** Maîtriser : rêve actuel en caractéristique, la meilleure voie, moins la force ; l'état général s'applique (p. 183, 191). */
export function jetDeMaitrise(reveActuel: number, meilleureVoie: number, force: number, etatGeneral = 0): BandesDuJet & { ajustement: number } {
    const ajustement = meilleureVoie - force + Math.min(0, etatGeneral);
    return { ...bandesDuJet(Math.max(0, reveActuel), ajustement), ajustement };
}

/**
 * Le test de refoulement (p. 183) : un d20 **supérieur** aux points de
 * refoulement, et l'on s'en tire ; égal ou inférieur, un souffle de Dragon, et
 * le compteur revient à zéro.
 */
export function testDeRefoulement(points: number, d20: number): { souffle: boolean; points: number } {
    if (!Number.isInteger(d20) || d20 < 1 || d20 > 20) throw new Error('Test de refoulement : un d20.');
    return d20 > points ? { souffle: false, points } : { souffle: true, points: 0 };
}

/**
 * Le coût d'un sort selon le jet (p. 188–189). Réussite : son coût ;
 * particulière : la moitié, au moins 1 ; échec : rien ; échec total : 150 %.
 */
export function coutDuSort(r: number, degre: import('../degresDeReussite').DegreDeReussite): number {
    if (degre === 'reussite-particuliere') return Math.max(1, Math.floor(r / 2));
    if (degre === 'echec-total') return Math.floor(r * 1.5);
    return degre.startsWith('reussite') ? r : 0;
}

/** Un effet de Dragon tiré : son nom, ce qu'il fait, sa durée, son prix de refoulement. */
export interface EffetDeTable {
    de: number; a: number; nom: string; effet: string;
    /** Points de refoulement pour l'annuler ; absent : pas refoulable. */
    refoulable?: number;
    duree?: 'jour' | 'ddr' | 'satisfaction' | 'definitif' | 'immediat';
    /** Une sous-table à tirer (désir lancinant, idée fixe, souvenir obsessionnel). */
    sousTable?: 'desirs' | 'idees' | 'souvenir';
}

const E = (de: number, a: number, nom: string, effet: string, extra: Partial<EffetDeTable> = {}): EffetDeTable => ({ de, a, nom, effet, ...extra });

/** Queues de Dragon (p. 195–198). Les non haut-rêvants relancent sous 29. */
export const QUEUES_DE_DRAGON: readonly EffetDeTable[] = [
    E(1, 4, 'Mauvaise rencontre en perspective', 'La prochaine rencontre en TMR se tire sur la table spéciale (1d7).'),
    E(5, 8, 'Pèlerinage', 'Plus de haut-rêve tant que le demi-rêve n’a pas atteint une case tirée au hasard (un Passeur peut l’y porter, pas un Messager).'),
    E(9, 12, 'Conquête', 'Plus de haut-rêve tant qu’une case tirée au hasard (non humide) n’est pas atteinte et maîtrisée à −7.'),
    E(13, 16, 'Inertie draconique', 'Pendant un jour, chaque case ou round en TMR coûte 2 points de fatigue.', { duree: 'jour' }),
    E(17, 20, 'Urgence draconique', 'Besoin irrésistible de déclencher le plus proche sort en réserve ; se dérober d’une rencontre vaut refouler la queue.', { refoulable: 2 }),
    E(21, 24, 'Réinsertion aléatoire', 'Le meneur replace secrètement le demi-rêve sur la carte.', { duree: 'immediat' }),
    E(25, 28, 'Montée laborieuse', 'Pendant un jour, monter coûte 2 rêves, 3 en accéléré.', { duree: 'jour' }),
    E(29, 33, 'Coup de barre', 'Prise immédiate de 3d6 points de fatigue.', { duree: 'immediat' }),
    E(34, 38, 'Insomnie', 'Impossible de dormir, donc de rêver, pendant un jour.', { duree: 'jour' }),
    E(39, 43, 'Dépouillement', 'Donner toute sa monnaie au premier inconnu rencontré ; aucune dépense d’ici là.', { refoulable: 2 }),
    E(44, 48, 'Amnésie sélective', 'Pendant un jour, une compétence tirée au hasard (pas le Draconic) revient au niveau de base.', { duree: 'jour' }),
    E(49, 60, 'Souvenir obsessionnel de l’archétype', 'Les prochaines XP de stress vont dans une compétence tirée au hasard.', { sousTable: 'souvenir' }),
    E(61, 65, 'Coup de foudre fatal', 'Amour fou pour la première personne inconnue de sexe opposé et de même espèce ; traité comme un désir lancinant.', { refoulable: 2, duree: 'satisfaction' }),
    E(66, 70, 'Masque de Narcos', 'Pendant 1d7 jours à compter du lendemain, APPARENCE et Beauté baissent de 1d6.'),
    E(71, 85, 'Désir lancinant', 'Un désir (1d20) ; pas d’XP d’exercice tant qu’il n’est pas satisfait. Refoulable pour 1 point.', { refoulable: 1, duree: 'satisfaction', sousTable: 'desirs' }),
    E(86, 100, 'Idée fixe', 'Une idée fixe (1d20) jusqu’à la fin du Château Dormant du lendemain. Refoulable pour 1 point.', { refoulable: 1, duree: 'jour', sousTable: 'idees' }),
];

/** Ombres de Thanatos (p. 199) : la prochaine queue de qui a usé ou augmenté Thanatos. */
export const OMBRES_DE_THANATOS: readonly EffetDeTable[] = [
    E(1, 3, 'Mauvaise rencontre en perspective', 'Comme la queue standard.'),
    E(4, 6, 'Pèlerinage', 'Comme la queue standard.'),
    E(7, 9, 'Conquête', 'Comme la queue standard.'),
    E(10, 12, 'Inertie draconique', 'Comme la queue standard.', { duree: 'jour' }),
    E(13, 15, 'Urgence draconique', 'Comme la queue standard.', { refoulable: 4 }),
    E(16, 18, 'Réinsertion aléatoire', 'Comme la queue standard.', { duree: 'immediat' }),
    E(19, 21, 'Montée laborieuse', 'Comme la queue standard.', { duree: 'jour' }),
    E(22, 24, 'Coup de barre', 'Comme la queue standard.', { duree: 'immediat' }),
    E(25, 27, 'Insomnie', 'Comme la queue standard.', { duree: 'jour' }),
    E(28, 30, 'Dépouillement', 'Comme la queue standard.', { refoulable: 4 }),
    E(31, 33, 'Amnésie sélective', 'Comme la queue standard.', { duree: 'jour' }),
    E(34, 38, 'Souvenir morbide de l’archétype', 'Les prochaines XP de stress vont en Thanatos.'),
    E(39, 42, 'Désir de boire du sang chaud', 'Désir thanataire.', { refoulable: 2, duree: 'satisfaction' }),
    E(43, 46, 'Désir de dormir dans un cercueil', 'Désir thanataire.', { refoulable: 2, duree: 'satisfaction' }),
    E(47, 50, 'Désir d’assister à une pendaison', 'Désir thanataire.', { refoulable: 2, duree: 'satisfaction' }),
    E(51, 54, 'Désir de parler à un crâne (humain)', 'Désir thanataire : quinze minutes au moins.', { refoulable: 2, duree: 'satisfaction' }),
    E(55, 58, 'Désir d’entendre hurler de terreur', 'Désir thanataire : un hurlement humain.', { refoulable: 2, duree: 'satisfaction' }),
    E(59, 62, 'Désir de blesser une femme', 'Désir thanataire : une blessure légère au moins.', { refoulable: 2, duree: 'satisfaction' }),
    E(63, 66, 'Désir de blesser un enfant', 'Désir thanataire : une blessure légère au moins.', { refoulable: 2, duree: 'satisfaction' }),
    E(67, 70, 'Désir d’escalade difficile', 'Désir thanataire : 4d6 m, difficulté 1d4−4.', { refoulable: 2, duree: 'satisfaction' }),
    E(71, 73, 'Injurier la première personne inconnue rencontrée', 'À la première occasion.', { refoulable: 4 }),
    E(74, 76, 'Couardise irraisonnée', 'Au prochain combat : fuir, se cacher ou se rendre ; aucune magie.', { refoulable: 4 }),
    E(77, 85, 'Héroïsme forcené', 'Au prochain combat : foncer en tête en mêlée ; aucune magie.', { refoulable: 4 }),
    E(86, 95, 'Haine fatale', 'Haine pour la première personne inconnue de même sexe et espèce, jusqu’à la blesser gravement ou l’humilier.', { refoulable: 4, duree: 'satisfaction' }),
    E(96, 100, 'Infarctus', 'Perte immédiate de 4 points de vie et 8 d’endurance ; regagnés après un jour complet.', { duree: 'immediat' }),
];

/** Souffles de Dragon (p. 201–202). Aucun n'est refoulable ; les non haut-rêvants relancent sous 61. */
export const SOUFFLES_DE_DRAGON: readonly EffetDeTable[] = [
    E(1, 5, 'Sommeil sans rêve', 'Plus de rêve pendant ddr jours, pas même de récupération dans les Hautes Terres.', { duree: 'ddr' }),
    E(6, 10, 'Mauvaises rencontres en perspective', 'Les ddr prochaines rencontres se tirent sur la table spéciale.', { duree: 'ddr' }),
    E(11, 15, 'Périple', 'Aucune magie (sauf réserve) avant de s’être purifié dans les 6 sanctuaires (−3) ou les 8 nécropoles (−5) ; 1d2 décide.'),
    E(16, 20, 'Fermeture des cités', 'Les 22 cités sont fermées tant qu’elles ne sont pas reconquises (rêve actuel/Draconic à −9).'),
    E(21, 25, 'Débordement', 'Une case tirée au hasard se maîtrise désormais comme une case humide. Définitif.', { duree: 'definitif' }),
    E(26, 30, 'Impraticabilité des ponts', 'Pendant ddr jours, les ponts se maîtrisent comme des cases humides.', { duree: 'ddr' }),
    E(31, 35, 'Désorientation', 'Pendant ddr jours, un genre de case n’existe plus : y entrer vaut sortie de la carte.', { duree: 'ddr' }),
    E(36, 40, 'Trou noir', 'Une case tirée au hasard disparaît définitivement ; un sort qui y était en réserve est annulé.', { duree: 'definitif' }),
    E(41, 45, 'Péage', 'Pendant ddr jours, traverser un pont ou entrer dans une cité coûte un point de rêve.', { duree: 'ddr' }),
    E(46, 50, 'Montée laborieuse', 'Pendant ddr jours, monter coûte 2 rêves, 3 en accéléré.', { duree: 'ddr' }),
    E(51, 55, 'Double résistance du Fleuve', 'Pendant ddr jours, toute case humide se maîtrise deux fois de suite.', { duree: 'ddr' }),
    E(56, 60, 'Confusion draconique', 'Perte d’un sort ou rituel tiré au hasard, réapprenable pour la moitié des points ; bonus de case perdus.'),
    E(61, 65, 'Épuisement', 'Pendant ddr jours, chaque prise de fatigue augmente d’un point.', { duree: 'ddr' }),
    E(66, 70, 'Perte dans une caractéristique', 'Une caractéristique (1d12) perd 1d7 points pendant ddr jours ; puis jet à la difficulté perdue, un point définitif sur un échec.', { duree: 'ddr' }),
    E(71, 75, 'Vieillissement instantané', '1d7 ans ; CONSTITUTION ajustée de moins ce nombre, un point définitif sur un échec.', { duree: 'immediat' }),
    E(76, 79, 'Non-combativité', 'Perte d’un niveau dans une compétence de combat tirée au hasard.', { duree: 'definitif' }),
    E(80, 83, 'Je-m’en-foutisme', 'Perte d’un niveau dans une compétence tirée au hasard, hors combat et connaissances.', { duree: 'definitif' }),
    E(84, 88, 'Paresse intellectuelle', 'Perte d’un niveau dans une connaissance tirée au hasard, voies de Draconic comprises.', { duree: 'definitif' }),
    E(89, 100, 'Queue de Dragon perpétuelle', '7 + ddr queues de Dragon, l’une après l’autre.'),
];

/** Têtes de Dragon, table 1 : tous personnages (p. 202–204). */
export const TETES_DE_DRAGON: readonly EffetDeTable[] = [
    E(1, 7, 'Augmentation de caractéristique', 'Tester les caractéristiques une à une au d20 : la première battue gagne un point (sauf TAILLE et dérivées).', { duree: 'definitif' }),
    E(8, 14, 'Souvenir immédiat de l’archétype', 'Une compétence sous l’archétype monte d’un niveau, ou jusqu’à +3 si elle est inférieure.', { duree: 'definitif' }),
    E(15, 21, 'Don limité de réussite', 'Sept réussites significatives automatiques sur une compétence choisie (ajustement final > −11).'),
    E(22, 28, 'Don de double chance', 'Regagner 2 points de chance au lieu d’un. Unique.', { duree: 'definitif' }),
    E(29, 34, 'Don de voir la magie', 'VUE à zéro : voir l’aura des zones, objets et créatures enchantés. Cumulable.', { duree: 'definitif' }),
    E(35, 40, 'Don de haut-rêve', 'Accès aux TMR ; un non haut-rêvant garde ses voies à −11. Peut être refusé.', { duree: 'definitif' }),
    E(41, 46, 'Don de sentir les haut-rêvants', 'EMPATHIE à zéro, après un round de conversation. Cumulable.', { duree: 'definitif' }),
    E(47, 52, 'Don de sentir le mensonge', 'EMPATHIE à zéro devine un mensonge volontaire. Cumulable.', { duree: 'definitif' }),
    E(53, 58, 'Don de résistance à la magie', '+1 aux JR contre Hypnos et Thanatos. Cumulable.', { duree: 'definitif' }),
    E(59, 64, 'Don de non-résistance à la magie', 'Ne pas résister volontairement à un effet magique. Unique.', { duree: 'definitif' }),
    E(65, 70, 'Don de contrôler son sommeil', 'VOLONTÉ à zéro : s’endormir à volonté, se réveiller à l’heure dite. Cumulable.', { duree: 'definitif' }),
    E(71, 76, 'Don limité de résistance au poison', 'Une réussite normale en CONSTITUTION vainc un poison. Unique.', { duree: 'definitif' }),
    E(77, 82, 'Don limité de résistance à la maladie', 'Une réussite normale en CONSTITUTION vainc une maladie. Unique.', { duree: 'definitif' }),
    E(83, 88, 'Don d’apprivoiser les animaux', 'EMPATHIE à zéro : un animal devient amical ou neutre. Cumulable.', { duree: 'definitif' }),
    E(89, 94, 'Don d’orientation', 'EMPATHIE à zéro : retrouver le nord ou une direction. Cumulable.', { duree: 'definitif' }),
    E(95, 100, 'Don limité de guérison', 'Un point de tâche de plus en Chirurgie ; l’échec total devient particulier. Unique.', { duree: 'definitif' }),
];

/** Têtes de Dragon, table 2 : haut-rêvants (p. 204–206). */
export const TETES_DES_HAUT_REVANTS: readonly EffetDeTable[] = [
    E(1, 10, 'Don de double-rêve', 'Récupération du rêve : 1 ddr toutes les demi-heures. Unique.', { duree: 'definitif' }),
    E(11, 20, 'Don de déplacement accéléré', 'L’accéléré ne coûte plus de point de rêve supplémentaire. Unique.', { duree: 'definitif' }),
    E(21, 30, 'Augmentation du seuil de rêve', 'Seuil +2, jusqu’au double du RÊVE. Cumulable.', { duree: 'definitif' }),
    E(31, 40, 'Connaissance intuitive d’un nouveau sort', 'Un sort ou rituel tiré au hasard.', { duree: 'definitif' }),
    E(41, 50, 'Terre d’attache', 'Une case non humide où se téléporter à tout round, pour un point de fatigue et un d7. Cumulable.', { duree: 'definitif' }),
    E(51, 60, 'Présent des cités', 'Chaque cité offre une Fleur, un Passeur ou un Messager maîtrisé (2d6), une fois ; jusqu’à les avoir toutes visitées.'),
    E(61, 70, 'Réserve en sécurité', 'Entrer sur une case de réserve sans déclencher le sort. Unique.', { duree: 'definitif' }),
    E(71, 80, 'Réserve extensible', 'Une case (hors fleuve) accepte plusieurs sorts en réserve, dans la limite des niveaux. Cumulable.', { duree: 'definitif' }),
    E(81, 90, 'Quête des eaux', 'Un lac ou un marais choisi, une fois maîtrisé, ne se maîtrise plus jamais. Cumulable.', { duree: 'definitif' }),
    E(91, 100, 'Connaissance du Fleuve', 'Se téléporter d’une case de fleuve à une autre, pour un point de fatigue. Unique.', { duree: 'definitif' }),
];

/** Désirs lancinants (1d20, p. 197). */
export const DESIRS_LANCINANTS: readonly string[] = [
    'Danser nu sous la pluie', 'Traire une vache', 'Manger du poisson', 'Manger des champignons', 'Se soûler, minimum pas frais',
    'Gagner de l’argent, minimum 10 deniers', 'Faire des bulles de savon', 'Entendre braire un âne',
    'Danser avec un(e) partenaire inconnu(e) de Beauté 13 minimum', 'Construire une cabane', 'Acquérir une chèvre', 'Se rouler dans la boue',
    'Embrasser un cochon sur le groin', 'Briser un objet de verre', 'Casser 3d6 œufs en les jetant à terre', 'Passer une nuit sur une échelle',
    'Se faire raser la tête', 'Masochisme : perdre 3 points d’endurance minimum en 1 round', 'Mégalomanie : être acclamé par 10 personnes au moins',
    'Pisser dans un violon (luth, mandoline…)',
];

/** Idées fixes (1d20, p. 198). */
export const IDEES_FIXES: readonly string[] = [
    'Ne s’exprimer que par des cris d’animaux', 'Garder les yeux bandés', 'Ne dire que « non » ou une négation analogue',
    'Garder sur soi 3d6 kilos de cailloux', 'Traîner son épée en laisse (ou sa meilleure arme)', 'Garder une main sur la tête',
    'Avoir le visage noirci à la cendre', 'Cracher dans toute nourriture ou boisson aperçue', 'Anorexie : ne rien avaler, pas même une potion',
    'Aller tout nu, sans porter le moindre paquet ni objet', 'Vider sur sa tête toute fiole ou flacon aperçu',
    'Appeler les hommes « madame » et les femmes « messire »', 'Ne marcher qu’à quatre pattes', 'Boulimie : manger au moins un point de sust par heure',
    'Refuser de se déplacer autrement que porté', 'Ne pas franchir de porte (une fenêtre, oui)', 'Faire le mort',
    'Éteindre tout feu rencontré', 'Refuser de se délester du moindre objet, ni donner ni prêter', 'Refuser de monter dans les TMR',
];

/** La table d'un effet, avec ce que le d100 tombe. */
export function effetDuD100(table: readonly EffetDeTable[], d100: number): EffetDeTable {
    if (!Number.isInteger(d100) || d100 < 1 || d100 > 100) throw new Error('Un d100 de 1 à 100.');
    return table.find(e => d100 >= e.de && d100 <= e.a)!;
}

/** Ce qu'un non haut-rêvant relance : sous 29 pour une queue, sous 61 pour un souffle (p. 195, 201). */
export const RELANCE_DES_NON_HAUT_REVANTS = { queue: 29, souffle: 61 } as const;

/**
 * Le nombre de sorts qu'une voie tient en réserve : **son niveau** (p. 192).
 * Il faut +1 au moins pour en garder un.
 */
export const limiteDeReserve = (niveauDeLaVoie: number) => Math.max(0, niveauDeLaVoie);

/** Les quatre voies, et le champ de la fiche qui porte leur niveau (le pilote écrit « onrios »). */
export const VOIES_DU_DRACONIC = [
    { id: 'oniros', nom: 'Oniros', champ: 'onrios' }, { id: 'hypnos', nom: 'Hypnos', champ: 'hypnos' },
    { id: 'narcos', nom: 'Narcos', champ: 'narcos' }, { id: 'thanatos', nom: 'Thanatos', champ: 'thanatos' },
] as const;

/** La voie qu'un texte libre désigne (« Hypnos », « hyp. »…), ou `null`. */
export function voieNommee(texte: string): typeof VOIES_DU_DRACONIC[number] | null {
    const t = texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return VOIES_DU_DRACONIC.find(v => t.startsWith(v.id.slice(0, 3)) || t.includes(v.id)) ?? null;
}
