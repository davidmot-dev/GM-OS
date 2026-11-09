import type { DieResult, RollResult } from '../DiceEngine';
import type { DegreDeReussite } from '../degresDeReussite';

/**
 * **Le test d'Argyropée** — 08/11/2026, à la demande de David (« finir le pilote »,
 * livre 2 *Règles & Bestiaire*, pages **imprimées**).
 *
 * Le pilote forgé comparait le d10 seul à « compétence + métier » et exigeait dix
 * réussites d'un seul dé : chaque test échouait. Le livre additionne :
 * **Test = 1d10 + compétence + bonus de métier**, le d10 allant **de 0 à 9**, et lit le
 * total sur des paliers fixes (p. 44) : 0 échec critique, 1-7 échec, 8-9 réussite
 * partielle, 10-14 réussite, 15 et plus réussite critique. Le Conteur ajoute un
 * modificateur global (chaque source de −5 à +5, cumulées), l'entraide +1 par aidant
 * jusqu'à +5 (p. 45).
 *
 * Décisions de David du 08/11/2026 : le métier se **choisit au jet** parmi ceux de la
 * fiche (« aucun » par défaut, p. 44 : 0 pour une compétence étrangère au métier) ; un
 * total **nul ou négatif** — possible sous un malus — est un **échec critique**.
 *
 * Le **Panache** se dépense après le tirage : chaque point ajoute 1 au dé, qui ne
 * dépasse jamais 9 ; jamais sur un dé de dégâts (p. 84-85). Le Conteur peut refuser une
 * dépense qui n'est pas décrite avec fougue : l'outil compte, il n'arbitre pas.
 *
 * Tout ici est pur : des dés et des nombres entrent, un résultat sort. Le panneau de
 * jet lance les dés et écrit sur la fiche, jamais ce module.
 */

/** Un métier de la fiche : les champs qui portent son nom et son bonus. */
export interface MetierDArgyropee {
    /** Le champ du nom du métier. */
    nom?: string;
    /** Le champ du bonus de métier (0 à +5, selon le rang). */
    bonus: string;
}

/** Ce que le pilote nomme pour Argyropée (`jet.argyropee`). */
export interface RegleDArgyropee {
    /** Le champ des points de Panache journaliers, que dépense le joueur après le tirage (p. 84). */
    panache?: string;
    /** Les métiers de la fiche, dans l'ordre : le joueur en choisit un, ou aucun, au jet. */
    metiers?: MetierDArgyropee[];
    /** Le nom du personnage, pour titrer le journal. */
    nom?: string;
    /** Le bonus permanent de Panache, ajouté au regain du matin (p. 84). */
    panacheBonus?: string;
    /** Les points de santé : sous 0, l'avatar est inconscient — plus d'Exubérance (p. 52, 86). */
    sante?: string;
    /** La Faveur divine (p. 81) : la compétence Sciences religieuses et les prières dites ce jour. */
    faveur?: { competence: string; prieres: string };
    /**
     * La magie (p. 135-136, 127) : les champs des sorts connus, les deux domaines des
     * humeurs (le même deux fois : sorts discrets pour 1 point), le Panache dépensé en
     * sorts dans le combat en cours, et la case de la silenciada.
     */
    magie?: { sorts: string[]; domaines?: string[]; combat: string; silenciada?: string };
    /**
     * La Guigne (p. 176-177) : le Panache dépensé aux tests depuis le réveil — repère du
     * Conteur — et les points qu'elle offre au prochain regain du matin.
     */
    guigne?: { depense: string; offert: string };
}

/** Ce que le joueur règle avant de lancer. */
export interface ChoixDArgyropee {
    /** L'index du métier retenu dans `metiers`, ou −1 : aucun (compétence étrangère au métier). */
    metier: number;
    /** Le modificateur global du Conteur : chaque source de −5 à +5, cumulées (p. 45). */
    modificateur: number;
    /** Les aidants d'un test en coopération : +1 chacun, +5 au plus (p. 45). */
    aidants: number;
    /** Action complexe : les AUTRES compétences réunies avec la compétence du jet (p. 46). */
    complexe: string[];
    /** Test en opposition : une série de tests jusqu'à 5 succès (p. 46). */
    opposition: boolean;
    /**
     * Le score de l'adversaire dans la même compétence : compétence + métier + modificateurs.
     * Pour un PNJ (`adversairePnj`), seulement son bonus de carrière et ses modificateurs :
     * le degré de compétence se tire à chaque manche (p. 185).
     */
    adversaire: number;
    /** L'adversaire est un PNJ du bestiaire : son degré de compétence se tire au d6 à chaque test (p. 185). */
    adversairePnj: boolean;
    /** La compétence fait partie de ses compétences privilégiées : 1d6, sinon 1d6 divisé par deux. */
    adversairePrivilegiee: boolean;
    /** Faveur divine : le joueur a prié avant le jet — deux d10, le meilleur gardé (p. 81). */
    faveur: boolean;
}

export const CHOIX_D_ARGYROPEE: ChoixDArgyropee = {
    metier: -1, modificateur: 0, aidants: 0, complexe: [], opposition: false, adversaire: 0,
    adversairePnj: false, adversairePrivilegiee: true, faveur: false,
};

export type BilanDArgyropee = 'reussite-critique' | 'reussite' | 'reussite-partielle' | 'echec' | 'echec-critique';

export const LIBELLES_D_ARGYROPEE: Record<BilanDArgyropee, string> = {
    'reussite-critique': 'Réussite critique',
    reussite: 'Réussite',
    'reussite-partielle': 'Réussite partielle',
    echec: 'Échec',
    'echec-critique': 'Échec critique',
};

/** Ce que dit chaque palier, avec les mots du livre (p. 44). */
export const SENS_DES_PALIERS: Record<BilanDArgyropee, string> = {
    'reussite-critique': 'succès avec bonus ; au combat, dégâts lancés deux fois ou une manœuvre gratuite',
    reussite: 'l’action réussit',
    'reussite-partielle': 'objectif atteint en partie, ou atteint avec une petite complication',
    echec: 'l’action échoue, sans plus de conséquences',
    'echec-critique': 'échec aux répercussions néfastes ou graves',
};

/** Les paliers, du plus bas au plus haut : le total minimal de chacun (p. 44). */
export const PALIERS_D_ARGYROPEE: readonly { bilan: BilanDArgyropee; des: number }[] = [
    { bilan: 'echec', des: 1 },
    { bilan: 'reussite-partielle', des: 8 },
    { bilan: 'reussite', des: 10 },
    { bilan: 'reussite-critique', des: 15 },
];

const DEGRES: Record<BilanDArgyropee, DegreDeReussite> = {
    'reussite-critique': 'reussite-particuliere',
    reussite: 'reussite-significative',
    'reussite-partielle': 'reussite-normale',
    echec: 'echec-normal',
    'echec-critique': 'echec-total',
};

const REUSSITES: ReadonlySet<BilanDArgyropee> = new Set(['reussite-critique', 'reussite', 'reussite-partielle']);

/** Le dé le plus haut : un d10 d'Argyropée va de 0 à 9 (p. 44, 85). */
export const FACE_MAXIMALE = 9;

/** Un nombre entier, ou 0. */
export function entierDArgyropee(valeur: unknown): number {
    const n = Math.trunc(Number(valeur));
    return Number.isFinite(n) ? n : 0;
}

const borner = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Le palier d'un total. Nul ou négatif : échec critique (décision de David, 08/11/2026). */
export function bilanDArgyropee(total: number): BilanDArgyropee {
    if (total <= 0) return 'echec-critique';
    if (total <= 7) return 'echec';
    if (total <= 9) return 'reussite-partielle';
    if (total <= 14) return 'reussite';
    return 'reussite-critique';
}

/**
 * La face lue sur le d10 du moteur, qui rend 1 à 10 : le 10 est le « 0 » du dé
 * physique. Le livre numérote le d10 de 0 à 9, la face 0 valant zéro (p. 44).
 */
export function faceDuD10(valeurDuMoteur: number): number {
    const v = entierDArgyropee(valeurDuMoteur);
    return v >= 10 || v <= 0 ? 0 : v;
}

/** Le bonus d'entraide : +1 par aidant, +5 au plus (p. 45). */
export function bonusDesAidants(aidants: number): number {
    return borner(entierDArgyropee(aidants), 0, 5);
}

/**
 * Le modificateur global du Conteur. Chaque malus ou bonus va de −5 à +5, mais ceux « en
 * provenance de diverses sources peuvent se cumuler pour former un modificateur global »
 * (p. 45) : le livre ne borne pas le total, l'outil non plus. Le corpus forgé disait
 * « −5 à +5 » pour le global — relu contre le livre le 08/11/2026.
 */
export function modificateurBorne(modificateur: number): number {
    return entierDArgyropee(modificateur);
}

/** Un métier proposé au jet : son index, son libellé et son bonus lus sur la fiche. */
export interface MetierProposeDArgyropee {
    index: number;
    libelle: string;
    bonus: number;
}

/**
 * Les métiers que la fiche porte vraiment : un métier sans nom ni bonus n'est pas
 * proposé. Le bonus est borné à 0 … +5 (rang de Profane à Virtuose, p. 44).
 */
export function metiersDeLaFiche(regle: RegleDArgyropee | undefined, valeurs: Record<string, unknown>): MetierProposeDArgyropee[] {
    return (regle?.metiers ?? []).flatMap((m, index) => {
        const nom = m.nom ? String(valeurs[m.nom] ?? '').trim() : '';
        const bonus = borner(entierDArgyropee(valeurs[m.bonus]), 0, 5);
        if (!nom && !bonus) return [];
        return [{ index, libelle: nom || `Métier ${index + 1}`, bonus }];
    });
}

/** Le bonus du métier choisi, 0 si aucun ou s'il n'est plus sur la fiche. */
export function bonusDuMetierChoisi(proposes: readonly MetierProposeDArgyropee[], choix: number): number {
    return proposes.find(m => m.index === choix)?.bonus ?? 0;
}

export interface JetDArgyropee extends RollResult {
    argyropee: {
        /** La face tirée, 0 à 9. */
        de: number;
        /** Les points de Panache ajoutés au dé après le tirage. */
        panache: number;
        /** Le dé après le Panache, 9 au plus. */
        deFinal: number;
        competence: number;
        metier: number;
        modificateur: number;
        aidants: number;
        total: number;
        bilan: BilanDArgyropee;
        libelle: string;
        /** L'action complexe, quand le test réunit plusieurs compétences (p. 46). */
        complexe?: ActionComplexe;
        /** Faveur divine : les deux faces tirées, la meilleure gardée (p. 81). */
        faveur?: readonly [number, number];
        /** Un PNJ : le d6 tiré pour son degré de compétence, et s'il est privilégié (p. 185). */
        pnj?: TirageDuPnj;
    };
}

/** Le degré de compétence d'un PNJ, tiré pour un test (p. 185). */
export interface TirageDuPnj {
    d6: number;
    privilegiee: boolean;
}

/** Ce qu'un test porte en plus de ses nombres : la Faveur divine, le tirage d'un PNJ. */
export interface ExtrasDArgyropee {
    faveur?: readonly [number, number];
    pnj?: TirageDuPnj;
}

/** L'issue d'une action complexe (p. 46). */
export type IssueComplexe = 'reussie' | 'partiellement-ratee' | 'ratee';

export const LIBELLES_COMPLEXES: Record<IssueComplexe, string> = {
    reussie: 'Action complexe réussie',
    'partiellement-ratee': 'Action partiellement ratée',
    ratee: 'Action complexe ratée',
};

export interface ActionComplexe {
    /** Les degrés des compétences réunies, la principale en tête. */
    competences: number[];
    /** La plus haute, qui sert au rattrapage d'un échec. */
    meilleure: number;
    /** Le dé, la meilleure compétence et les mêmes bonus : 8 ou plus, l'action n'est que partiellement ratée. */
    totalDeRattrapage: number;
    issue: IssueComplexe;
}

const signe = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);

/**
 * La compétence d'une action complexe : la moyenne des degrés requis, arrondie à
 * l'inférieur (p. 46 : Escalade 1 et Furtivité 4 donnent 2).
 */
export function moyenneDesCompetences(competences: readonly number[]): number {
    const valeurs = competences.map(entierDArgyropee);
    return valeurs.length ? Math.floor(valeurs.reduce((a, b) => a + b, 0) / valeurs.length) : 0;
}

/**
 * Résout un test déjà tiré. `competence` est la compétence retenue, `metier` le bonus du
 * métier choisi. Avec `complexe` (au moins deux degrés), c'est une **action complexe**
 * (p. 46) : la compétence est la moyenne arrondie à l'inférieur ; un succès, même
 * partiel, accomplit parfaitement l'action ; un échec se relit avec la seule compétence
 * la plus haute ajoutée au même dé — si ce total aurait réussi (8 ou plus), l'action
 * n'est que partiellement ratée, sinon elle rate complètement. Le livre ne cite que la
 * compétence pour ce rattrapage (son exemple est « sans bonus de carrière ») : le métier,
 * le modificateur et l'entraide y restent, puisque seule la compétence change.
 */
export function resoudreArgyropee(
    de: number, competence: number, metier: number,
    reglages: { modificateur: number; aidants: number }, panache = 0, complexe?: readonly number[],
    extras: ExtrasDArgyropee = {},
): JetDArgyropee {
    const degres = complexe && complexe.length >= 2 ? complexe.map(entierDArgyropee) : null;
    const comp = degres ? moyenneDesCompetences(degres) : entierDArgyropee(competence);
    const face = borner(entierDArgyropee(de), 0, FACE_MAXIMALE);
    const points = borner(entierDArgyropee(panache), 0, FACE_MAXIMALE - face);
    const deFinal = face + points;
    const modificateur = modificateurBorne(reglages.modificateur);
    const aidants = bonusDesAidants(reglages.aidants);
    const autres = entierDArgyropee(metier) + modificateur + aidants;
    const ajouts = comp + autres;
    const total = deFinal + ajouts;
    const bilan = bilanDArgyropee(total);
    let reussi = REUSSITES.has(bilan);
    let libelle = LIBELLES_D_ARGYROPEE[bilan];
    let degre = DEGRES[bilan];
    let sens = SENS_DES_PALIERS[bilan];
    let action: ActionComplexe | undefined;
    if (degres) {
        const meilleure = Math.max(...degres);
        const totalDeRattrapage = deFinal + meilleure + autres;
        const issue: IssueComplexe = reussi ? 'reussie' : REUSSITES.has(bilanDArgyropee(totalDeRattrapage)) ? 'partiellement-ratee' : 'ratee';
        action = { competences: degres, meilleure, totalDeRattrapage, issue };
        libelle = LIBELLES_COMPLEXES[issue];
        sens = issue === 'reussie' ? 'un succès, même partiel, accomplit parfaitement l’action complexe'
            : issue === 'partiellement-ratee' ? `avec la seule meilleure compétence (${meilleure}), ${totalDeRattrapage} aurait réussi`
            : `même avec la seule meilleure compétence (${meilleure}), ${totalDeRattrapage} échoue`;
        degre = issue === 'reussie' ? DEGRES[bilan] : bilan === 'echec-critique' ? 'echec-total'
            : issue === 'partiellement-ratee' ? 'echec-normal' : 'echec-particulier';
        reussi = issue === 'reussie';
    }
    const rolls: DieResult[] = [{
        val: deFinal, sides: 10,
        isCritMax: bilan === 'reussite-critique', isCritMin: bilan === 'echec-critique',
    }];
    const { faveur, pnj } = extras;
    const parties = [
        `dé ${face}${faveur ? ` (Faveur divine : ${faveur[0]} et ${faveur[1]})` : ''}${points ? ` + ${points} Panache` : ''}`,
        degres ? `moyenne ${comp} (${degres.join(', ')})`
            : pnj ? `compétence ${comp} (${pnj.privilegiee ? `1d6 = ${pnj.d6}` : `1d6 = ${pnj.d6}, divisé par 2`})`
            : `compétence ${comp}`,
        metier ? `métier ${entierDArgyropee(metier)}` : '',
        aidants ? `entraide ${aidants}` : '',
    ].filter(Boolean).join(' + ');
    return {
        total,
        rolls,
        modifier: ajouts,
        successes: reussi ? 1 : 0,
        fails: 0,
        tagSuccess: reussi,
        degre,
        totalDisplay: `${libelle} — ${parties}${modificateur ? ` ${signe(modificateur)}` : ''} = ${total} (${sens})`,
        argyropee: {
            de: face, panache: points, deFinal, competence: comp, metier: entierDArgyropee(metier),
            modificateur, aidants, total, bilan, libelle, ...(action ? { complexe: action } : {}),
            ...(faveur ? { faveur } : {}), ...(pnj ? { pnj } : {}),
        },
    };
}

/**
 * Tire et résout : `d10` rend le d10 du moteur (1 à 10), lu de 0 à 9. `complexe` :
 * les degrés des compétences réunies d'une action complexe.
 */
export function lancerArgyropee(
    competence: number, metier: number, reglages: { modificateur: number; aidants: number }, d10: () => number,
    complexe?: readonly number[], faveur = false,
): JetDArgyropee {
    if (!faveur) return resoudreArgyropee(faceDuD10(d10()), competence, metier, reglages, 0, complexe);
    const faces = [faceDuD10(d10()), faceDuD10(d10())] as const;
    return resoudreArgyropee(Math.max(...faces), competence, metier, reglages, 0, complexe, { faveur: faces });
}

/*
  **La Faveur divine** (p. 81) : « en adressant une courte prière à la Mère des Labours
  ou au Père de l'Industrie avant de lancer un dé (n'importe lequel), un joueur peut
  lancer deux fois ce dé et conserver le meilleur des deux résultats. Il ne peut le
  faire qu'une seule fois par dé », autant de fois par jour que de points en Sciences
  religieuses. Elle se déclare AVANT le jet : le panneau la coche dans « Préparer ».
*/

/** Les prières qu'il reste aujourd'hui : Sciences religieuses moins celles déjà dites. */
export function prieresRestantes(sciencesReligieuses: unknown, dites: unknown): number {
    return Math.max(0, entierDArgyropee(sciencesReligieuses) - Math.max(0, entierDArgyropee(dites)));
}

/*
  **Le Panache de la journée** (p. 84-85) : chaque matin, après 6 à 8 heures de sommeil,
  l'avatar regagne 1d10 + 10 points, plus ses bonus permanents ; le reste de la veille
  est perdu au coucher. Un solide repas rend 3 points, un verre ou un grignotage 1. La
  Guigne réglée offre 3 points « au prochain jet matinal de regain » (p. 177).
*/

export const PANACHE_DU_REPAS = 3;
export const PANACHE_DE_LA_COLLATION = 1;

/** Le regain du matin : le d10 du moteur lu de 0 à 9, + 10, + le bonus permanent, + l'offrande de la Guigne. */
export function regainDuMatin(valeurDuMoteur: number, bonus: unknown, guigne: unknown): { de: number; panache: number } {
    const de = faceDuD10(valeurDuMoteur);
    return { de, panache: de + 10 + Math.max(0, entierDArgyropee(bonus)) + Math.max(0, entierDArgyropee(guigne)) };
}

/*
  **L'Exubérance** (p. 85-86) : devant un danger qui devrait à coup sûr anéantir l'avatar
  ou un allié, il sacrifie TOUT son Panache restant pour berner la mort. Il lui faut au
  moins 3 points et être encore conscient — un avatar sous 0 point de santé est
  inconscient (p. 52). À tout moment, même hors de son tour. Le Conteur valide le récit.
*/

export const SEUIL_DE_L_EXUBERANCE = 3;

/** Pourquoi l'Exubérance est impossible, ou `null` si elle l'est. */
export function obstacleALExuberance(panache: number, sante?: number): string | null {
    if (sante !== undefined && sante < 0) return 'l’avatar est inconscient (santé sous 0)';
    if (panache < SEUIL_DE_L_EXUBERANCE) return `il faut au moins ${SEUIL_DE_L_EXUBERANCE} points de Panache`;
    return null;
}

/*
  **La magie** (p. 135-136) : tout sort coûte 1 point de Panache et s'accompagne d'une
  lueur ; 1 point de plus l'efface. Un personnage dont les deux humeurs donnent le même
  domaine lance chaque sort « comme si 2 points avaient été dépensés » : discret pour 1
  point, la lueur seulement s'il la veut. Sans Panache, plus de magie. **Silenciada**
  (p. 127, 136) : si 7 points de Panache ou plus servent aux sorts en un seul combat,
  20 % de chances de devenir muet — 2 tests de Sens magique pour s'en défaire. Décision
  de David du 09/11/2026 : les 20 % se tirent une fois, au point qui fait atteindre 7.
*/

export const SEUIL_DE_LA_SILENCIADA = 7;
export const CHANCES_DE_SILENCIADA = 20;

/** Les deux humeurs donnent le même domaine de magie (p. 136). */
export function doubleHumeur(domaines: readonly unknown[]): boolean {
    const d = domaines.map(x => String(x ?? '').trim().toLocaleLowerCase('fr'));
    return d.length === 2 && !!d[0] && d[0] === d[1];
}

/** Le coût d'un sort : 1 avec sa lueur, 2 sans ; 1 toujours pour une double humeur (p. 136). */
export function coutDuSort(discret: boolean, doubleHumeurDuPersonnage: boolean): number {
    return doubleHumeurDuPersonnage || !discret ? 1 : 2;
}

/** Après un sort : le Panache magique du combat, et si ce sort lui fait atteindre le seuil de la silenciada. */
export function magieDuCombatApres(avant: unknown, cout: number): { apres: number; franchit: boolean } {
    const a = Math.max(0, entierDArgyropee(avant));
    const apres = a + Math.max(0, entierDArgyropee(cout));
    return { apres, franchit: a < SEUIL_DE_LA_SILENCIADA && apres >= SEUIL_DE_LA_SILENCIADA };
}

/** Le d100 de la silenciada : 20 ou moins, le personnage devient muet (p. 127). */
export function silenciadaContractee(d100: number): boolean {
    return entierDArgyropee(d100) <= CHANCES_DE_SILENCIADA;
}

/*
  **La Guigne** (p. 176-177) : un épisode de malchance quand la table a dépensé beaucoup
  de Panache pour rehausser ses tests en peu de temps — « à-peu-près 6 points par joueur
  en moins d'une heure intradiégétique, mais ce n'est qu'un exemple » ; la magie n'y
  compte pas. Le Conteur n'a pas à tenir de compte : l'outil donne un repère, sans
  alerte (décision de David du 09/11/2026). Réglée, elle offre 3 points à chaque joueur
  au prochain regain du matin.
*/

export const REPERE_DE_LA_GUIGNE = 6;
export const OFFRANDE_DE_LA_GUIGNE = 3;

/*
  **Le dé de compétence des PNJ** (p. 185) : un PNJ n'a pas de degrés fixes. À chaque
  test, son degré se tire : 1d6 pour une compétence privilégiée, 1d6 divisé par deux
  (arrondi à l'inférieur) sinon, plus le bonus de sa carrière. Le d6 n'est pas conservé.
  Les animaux et créatures n'ont pas de bonus de carrière (p. 196).
*/

/** Le degré de compétence tiré pour un PNJ. */
export function degreDuPnj(d6: number, privilegiee: boolean): number {
    const de = borner(entierDArgyropee(d6), 1, 6);
    return privilegiee ? de : Math.floor(de / 2);
}

/** Le test d'un PNJ : le d6 de sa compétence, le d10, sa carrière et le modificateur du Conteur. */
export function lancerUnPnj(
    reglages: { privilegiee: boolean; carriere: number; modificateur: number; aidants?: number },
    d6: () => number, d10: () => number,
): JetDArgyropee {
    const tire = borner(entierDArgyropee(d6()), 1, 6);
    return resoudreArgyropee(faceDuD10(d10()), degreDuPnj(tire, reglages.privilegiee), reglages.carriere,
        { modificateur: reglages.modificateur, aidants: reglages.aidants ?? 0 }, 0, undefined,
        { pnj: { d6: tire, privilegiee: reglages.privilegiee } });
}

/*
  **Le test en opposition** (p. 46) : « chaque personnage fait, en même temps, une série
  de tests dans la compétence en question […] jusqu'à ce que l'une des deux parties
  obtienne 5 succès (un succès critique compte comme 2 succès, un succès mitigé comme un
  succès normal). En cas d'égalité, les deux camps n'arrivent pas à se mettre d'accord. »
*/

/** Les succès qu'un test apporte à l'opposition : 2 sur un critique, 1 sur une réussite, même partielle. */
export function succesDOpposition(bilan: BilanDArgyropee): number {
    return bilan === 'reussite-critique' ? 2 : REUSSITES.has(bilan) ? 1 : 0;
}

/** Une manche : les deux tests faits en même temps. */
export interface MancheDOpposition {
    joueur: JetDArgyropee;
    adversaire: JetDArgyropee;
}

export type IssueDOpposition = 'joueur' | 'adversaire' | 'egalite';

export interface BilanDOpposition {
    joueur: number;
    adversaire: number;
    /** `null` tant que personne n'a atteint l'objectif. */
    issue: IssueDOpposition | null;
}

export const SUCCES_DE_L_OPPOSITION = 5;

/** Le compte des succès après les manches jouées, et l'issue si l'objectif est atteint. */
export function bilanDeLOpposition(manches: readonly MancheDOpposition[], objectif = SUCCES_DE_L_OPPOSITION): BilanDOpposition {
    const joueur = manches.reduce((n, m) => n + succesDOpposition(m.joueur.argyropee.bilan), 0);
    const adversaire = manches.reduce((n, m) => n + succesDOpposition(m.adversaire.argyropee.bilan), 0);
    const issue = joueur >= objectif && adversaire >= objectif ? 'egalite'
        : joueur >= objectif ? 'joueur' : adversaire >= objectif ? 'adversaire' : null;
    return { joueur, adversaire, issue };
}

/**
 * Le test de l'adversaire : son score (compétence + métier + modificateurs) et un d10.
 * Un PNJ (`pnj`) n'a que son bonus de carrière et ses modificateurs : son degré de
 * compétence se tire au d6 à chaque manche (p. 185).
 */
export function lancerLAdversaire(score: number, d10: () => number, pnj?: { privilegiee: boolean; d6: () => number }): JetDArgyropee {
    if (pnj) return lancerUnPnj({ privilegiee: pnj.privilegiee, carriere: score, modificateur: 0 }, pnj.d6, d10);
    return resoudreArgyropee(faceDuD10(d10()), score, 0, { modificateur: 0, aidants: 0 });
}

/** Les points de Panache qu'on peut encore ajouter au dé : jusqu'à 9 (p. 85). */
export function panacheEncorePossible(jet: JetDArgyropee['argyropee']): number {
    return Math.max(0, FACE_MAXIMALE - jet.deFinal);
}

/** Ajoute `points` de Panache au dé déjà tiré, sans le porter au-delà de 9 (p. 84-85). */
export function depenserLePanache(jet: JetDArgyropee, points: number): JetDArgyropee {
    const a = jet.argyropee;
    const ajout = borner(entierDArgyropee(points), 0, panacheEncorePossible(a));
    if (!ajout) return jet;
    return resoudreArgyropee(a.de, a.competence, a.metier, { modificateur: a.modificateur, aidants: a.aidants }, a.panache + ajout,
        a.complexe?.competences, { faveur: a.faveur, pnj: a.pnj });
}

/** Un palier que le Panache permet encore d'atteindre, et son coût. */
export interface PalierAtteignable {
    bilan: BilanDArgyropee;
    cout: number;
}

/**
 * Les paliers au-dessus du résultat que le Panache peut encore atteindre — le
 * joueur voit ce qu'un point achète avant de le dépenser (p. 85 : « il est facile pour
 * le joueur de déterminer si la dépense de points de Panache est nécessaire »).
 */
export function paliersAtteignables(jet: JetDArgyropee['argyropee']): PalierAtteignable[] {
    const possible = panacheEncorePossible(jet);
    return PALIERS_D_ARGYROPEE
        .filter(p => p.des > jet.total && p.des - jet.total <= possible)
        .map(p => ({ bilan: p.bilan, cout: p.des - jet.total }));
}

/** Les points de Panache lus sur la fiche, jamais négatifs. */
export function panacheDeLaFiche(valeur: unknown): number {
    return Math.max(0, entierDArgyropee(valeur));
}
