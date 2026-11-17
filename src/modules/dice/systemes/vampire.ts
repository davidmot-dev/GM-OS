import type { DieResult, RollResult } from '../DiceEngine';
import type { DegreDeReussite } from '../degresDeReussite';

/**
 * **Le jet de Vampire : la Mascarade (V5)** — 17/11/2026, à la demande de David (« finir le
 * pilote », livre de base français, pages **imprimées** : PDF − 4, mesuré le 17/11).
 *
 * Le pilote forgé additionnait l'attribut et la compétence en un SEUIL par dé, ne lançait
 * aucun dé (réserve de base à zéro) et exigeait trois réussites : même défaut que
 * Degenesis. Le livre :
 *
 * - **Groupement** (p. 118) : un d10 par point de l'attribut et de la compétence (ou d'un
 *   second attribut, ou d'une discipline) ; une spécialité ajoute un dé ; sans la
 *   compétence, l'attribut seul, sans pénalité. Jamais moins d'un dé (p. 118, 120).
 * - **Résultat** (p. 119-120) : chaque 6 ou plus est une réussite ; la difficulté est le
 *   nombre de réussites à atteindre (« et non le chiffre minimum qu'un dé doit donner,
 *   qui est toujours de 6 »). **Chaque paire de 10 vaut quatre réussites** : trois 10 en
 *   valent cinq, quatre en valent huit. Une victoire avec au moins une paire est une
 *   victoire critique. La marge est l'excédent (p. 121). Un échec avec au moins une
 *   réussite peut devenir une victoire à la Pyrrhus (p. 121-122) ; sans réussite, c'est
 *   un échec total (p. 122).
 * - **Dés de Soif** (p. 205-207) : autant de dés ordinaires que la Soif sont REMPLACÉS
 *   par des dés de Soif — le groupement garde sa taille ; s'il est plus petit que la Soif,
 *   tous ses dés sont de Soif. Jamais de Soif sur un jet de Volonté, d'Humanité, ni sur
 *   un test (p. 205). Une victoire critique avec au moins un 10 de Soif est un **triomphe
 *   brutal** ; un échec avec au moins un 1 de Soif est un **échec bestial** — jamais sur
 *   une victoire, quel que soit le nombre de 1 (p. 207-208).
 * - **Volonté** (p. 122, 205) : un point relance jusqu'à **trois dés ordinaires** ; jamais
 *   les dés de Soif, jamais un jet de jauge (Volonté, Humanité).
 * - **Test d'Exaltation** (p. 123, 211) : un seul dé, réussi sur 6 ; un échec ajoute 1 à la
 *   Soif. Une grande Puissance du sang fait lancer deux dés et garder le meilleur. À 5 de
 *   Soif, on n'exalte plus le sang volontairement ; un test imposé et raté appelle un jet
 *   contre la frénésie de Soif, difficulté 4 (p. 211, 220).
 * - **Compulsions** (p. 208) : 1-3 Soif, 4-5 Domination, 6-7 Destruction, 8-9 Paranoïa,
 *   0 Compulsion de clan (relancer pour un Caitiff ou un Sang Clair).
 *
 * Tout ici est pur : des dés et des nombres entrent, un résultat sort. Le panneau de jet
 * lance les dés et écrit sur la fiche, jamais ce module.
 */

/** Ce que le pilote nomme pour Vampire (`jet.vampire`). */
export interface RegleDeVampire {
    /** La Soif actuelle, de 0 à 5 (p. 205) : autant de dés de Soif. */
    soif: string;
    /** La Volonté restante : un point se dépense pour relancer (p. 122). Absente : pas de relance d'ici. */
    volonte?: string;
    /**
     * Les champs dont le jet est un **jet de jauge** — la Volonté, l'Humanité : retenus au
     * menu, ils excluent les dés de Soif et la relance par la Volonté (p. 119, 122, 205).
     */
    jauges?: string[];
    /*
      Les spécialités ne sont pas nommées ici : chaque compétence de la fiche porte son texte
      par `libelleSur` (« Mêlée — Couteaux » au menu du jet, p. 118, 159), et le panneau le lit
      là. Les nommer aussi dans le pilote aurait fait deux écrivains pour la même donnée.
    */
}

/** La Soif ne descend pas sous 0 et ne monte pas au-dessus de 5 (p. 205). */
export const SOIF_MAXIMALE = 5;

/** Le tableau des difficultés (p. 119) : le nombre de réussites requises. */
export const DIFFICULTES_DE_VAMPIRE = [
    { reussites: 1, label: 'Anodine' },
    { reussites: 2, label: 'Simple' },
    { reussites: 3, label: 'Modérée' },
    { reussites: 4, label: 'Délicate' },
    { reussites: 5, label: 'Difficile' },
    { reussites: 6, label: 'Très difficile' },
    { reussites: 7, label: 'Presque impossible' },
] as const;

/** « Nous vous conseillons de limiter les modificateurs […] à trois dés ajoutés ou retirés » (p. 120). */
export const MODIFICATEUR_CONSEILLE = 3;

/** Ce que le joueur règle avant de lancer. */
export interface ChoixDeVampire {
    /** Une spécialité de la compétence s'applique : un dé de plus (p. 118). */
    specialite: boolean;
    /** Les dés que le conteur ajoute ou retire (p. 120). */
    modificateur: number;
    /** Un jet de jauge — Volonté, Humanité : aucun dé de Soif (p. 205). */
    sansSoif: boolean;
}

export const CHOIX_DE_VAMPIRE: ChoixDeVampire = { specialite: false, modificateur: 0, sansSoif: false };

/** Le groupement d'un jet : combien de dés, dont combien de Soif. */
export interface ReserveDeVampire {
    /** Les traits additionnés. */
    base: number;
    specialite: number;
    modificateur: number;
    /** Le groupement, jamais moins d'un dé. */
    total: number;
    /** La Soif lue sur la fiche, bornée de 0 à 5. */
    soif: number;
    /** Les dés de Soif : la Soif, ou tout le groupement s'il est plus petit. */
    desDeSoif: number;
    /** Les dés ordinaires qui restent. */
    ordinaires: number;
    sansSoif: boolean;
}

const entier = (n: unknown) => Math.trunc(Number(n) || 0);
const borner = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Le groupement et ses dés de Soif (p. 118, 120, 205). */
export function reserveDeVampire(base: number, choix: Partial<ChoixDeVampire>, soifDeLaFiche: unknown): ReserveDeVampire {
    const specialite = choix.specialite ? 1 : 0;
    const modificateur = entier(choix.modificateur);
    const total = Math.max(1, entier(base) + specialite + modificateur);
    const soif = borner(entier(soifDeLaFiche), 0, SOIF_MAXIMALE);
    const sansSoif = !!choix.sansSoif;
    const desDeSoif = sansSoif ? 0 : Math.min(soif, total);
    return { base: entier(base), specialite, modificateur, total, soif, desDeSoif, ordinaires: total - desDeSoif, sansSoif };
}

export type BilanDeVampire = 'triomphe-brutal' | 'victoire-critique' | 'victoire' | 'echec' | 'echec-bestial' | 'echec-total';

export const LIBELLES_DE_VAMPIRE: Record<BilanDeVampire, string> = {
    'triomphe-brutal': 'Triomphe brutal',
    'victoire-critique': 'Victoire critique',
    victoire: 'Victoire',
    echec: 'Échec',
    'echec-bestial': 'Échec bestial',
    'echec-total': 'Échec total',
};

export interface JetDeVampire extends RollResult {
    vampire: {
        ordinaires: number[];
        soif: number[];
        reussites: number;
        /** Les paires de 10, chacune une réussite critique (p. 120). */
        paires: number;
        difficulte: number;
        /** L'excédent de réussites d'une victoire (p. 121). */
        marge: number;
        bilan: BilanDeVampire;
        libelle: string;
        /** Un 10 sur un dé de Soif (le triomphe brutal, s'il y a critique). */
        dixDeSoif: boolean;
        /** Un 1 sur un dé de Soif (l'échec bestial, si le jet échoue). */
        unDeSoif: boolean;
        /** La Volonté a déjà relancé ce jet. */
        relance?: boolean;
        /** Les dés ordinaires relancés, par leur rang. */
        relances?: number[];
    };
}

/** Les réussites d'un groupement : les 6 et plus, et deux de plus par paire de 10 (p. 120). */
export function compterLesReussites(des: readonly number[]): { reussites: number; paires: number } {
    const dix = des.filter(v => v === 10).length;
    const paires = Math.floor(dix / 2);
    return { reussites: des.filter(v => v >= 6).length + 2 * paires, paires };
}

function degreDe(bilan: BilanDeVampire): DegreDeReussite {
    switch (bilan) {
        case 'triomphe-brutal':
        case 'victoire-critique': return 'reussite-particuliere';
        case 'victoire': return 'reussite-normale';
        case 'echec': return 'echec-normal';
        case 'echec-bestial': return 'echec-particulier';
        case 'echec-total': return 'echec-total';
    }
}

/**
 * Résout un jet déjà lancé (p. 119-122, 205-208). `difficulte` : les réussites requises —
 * celles de l'adversaire dans un jet en opposition, où l'égalité profite à qui agit (p. 123).
 */
export function resoudreVampire(ordinaires: readonly number[], soif: readonly number[], difficulte: number, relances?: number[]): JetDeVampire {
    const { reussites, paires } = compterLesReussites([...ordinaires, ...soif]);
    const requises = Math.max(0, entier(difficulte));
    const victoire = reussites >= requises;
    const dixDeSoif = soif.includes(10);
    const unDeSoif = soif.includes(1);
    const bilan: BilanDeVampire = victoire
        ? (paires > 0 ? (dixDeSoif ? 'triomphe-brutal' : 'victoire-critique') : 'victoire')
        // L'échec bestial l'emporte sur l'échec total : le 1 de Soif dit pourquoi (p. 207).
        : unDeSoif ? 'echec-bestial'
        : reussites === 0 ? 'echec-total' : 'echec';
    const marge = victoire ? reussites - requises : 0;
    const libelle = LIBELLES_DE_VAMPIRE[bilan];
    const relancesSet = new Set(relances ?? []);
    // Les 10 qui forment les paires sont marqués critiques ; un 10 dépareillé n'est qu'une réussite.
    let dixAMarquer = 2 * paires;
    const marquer = (v: number) => {
        if (v === 10 && dixAMarquer > 0) { dixAMarquer--; return true; }
        return false;
    };
    const rolls: DieResult[] = [
        ...ordinaires.map((v, i) => ({ val: v, sides: 10, source: 'base' as const, isCritMax: marquer(v), isCritMin: false, ...(relancesSet.has(i) ? { relance: true } : {}) })),
        ...soif.map(v => ({ val: v, sides: 10, source: 'gear' as const, isCritMax: marquer(v), isCritMin: v === 1 })),
    ];
    const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
    const detail = [
        pluriel(reussites, 'réussite'),
        paires > 0 ? `${pluriel(paires, 'paire')} de 10` : '',
        victoire ? `marge ${marge}` : '',
    ].filter(Boolean).join(', ');
    return {
        total: reussites,
        rolls,
        modifier: 0,
        successes: reussites,
        // Les 1 ordinaires ne coûtent rien ; le 1 de Soif est dit dans le bilan.
        fails: 0,
        tagSuccess: victoire,
        degre: degreDe(bilan),
        totalDisplay: `${libelle} — ${detail} (difficulté ${requises})`,
        vampire: {
            ordinaires: [...ordinaires], soif: [...soif], reussites, paires, difficulte: requises, marge, bilan, libelle, dixDeSoif, unDeSoif,
            ...(relances ? { relance: true, relances: [...relances] } : {}),
        },
    };
}

/** Lance et résout : `de` rend un d10 de 1 à 10 (le panneau lui passe le moteur). */
export function lancerVampire(reserve: Pick<ReserveDeVampire, 'ordinaires' | 'desDeSoif'>, difficulte: number, de: () => number): JetDeVampire {
    const ordinaires = Array.from({ length: Math.max(0, reserve.ordinaires) }, de);
    const soif = Array.from({ length: Math.max(0, reserve.desDeSoif) }, de);
    return resoudreVampire(ordinaires, soif, difficulte);
}

/** Trois dés ordinaires au plus par point de Volonté (p. 122). */
export const RELANCE_MAXIMALE = 3;

/**
 * Pourquoi la Volonté ne relance pas ce jet, ou `undefined` si elle le peut. Un seul point par
 * jet ici : le livre décrit une dépense pour « relancer jusqu'à trois dés ordinaires » (p. 122).
 */
export function relanceImpossible(jet: JetDeVampire['vampire'], sansSoif: boolean, volonte: number | undefined): string | undefined {
    if (jet.relance) return 'La Volonté a déjà relancé ce jet.';
    if (sansSoif) return 'Pas de Volonté sur un jet de jauge (Volonté, Humanité) — p. 122.';
    if (jet.ordinaires.length === 0) return 'Aucun dé ordinaire : les dés de Soif ne se relancent jamais (p. 205).';
    if (volonte !== undefined && volonte < 1) return 'Plus de Volonté à dépenser.';
    return undefined;
}

/**
 * Les dés ordinaires qu'on relance par défaut : d'abord les échecs, pour gagner des réussites.
 * Le joueur peut en choisir d'autres — un 10 ordinaire, pour défaire un triomphe brutal
 * (p. 205, l'exemple de David p. 206).
 */
export function relancesProposees(jet: JetDeVampire['vampire']): number[] {
    return jet.ordinaires.map((v, i) => ({ v, i })).filter(d => d.v < 6).slice(0, RELANCE_MAXIMALE).map(d => d.i);
}

/** Relance au plus trois dés ordinaires, choisis par leur rang ; les dés de Soif ne bougent pas (p. 122, 205). */
export function relancerVampire(jet: JetDeVampire['vampire'], rangs: readonly number[], de: () => number): JetDeVampire {
    const choisis = [...new Set(rangs)].filter(i => i >= 0 && i < jet.ordinaires.length).slice(0, RELANCE_MAXIMALE);
    const ordinaires = jet.ordinaires.map((v, i) => (choisis.includes(i) ? de() : v));
    return resoudreVampire(ordinaires, jet.soif, jet.difficulte, choisis);
}

/** Le test d'Exaltation (p. 211) : un dé, ou deux en gardant le meilleur. */
export interface TestDExaltation {
    des: number[];
    reussi: boolean;
    soifAvant: number;
    soifApres: number;
    /**
     * Raté à 5 de Soif : jet contre la frénésie de Soif, difficulté 4 — « chaque fois que le
     * joueur d'un vampire rate un test d'Exaltation alors que la Soif du vampire est déjà à 5 »
     * (p. 220, relu le 17/11). Au réveil, c'est la torpeur (p. 219) : le conteur en juge.
     */
    frenesie: boolean;
    texte: string;
}

export function resoudreLExaltation(des: readonly number[], soifDeLaFiche: unknown): TestDExaltation {
    const soifAvant = borner(entier(soifDeLaFiche), 0, SOIF_MAXIMALE);
    const reussi = des.some(v => v >= 6);
    const frenesie = !reussi && soifAvant >= SOIF_MAXIMALE;
    const soifApres = reussi ? soifAvant : Math.min(SOIF_MAXIMALE, soifAvant + 1);
    const lu = des.length > 1 ? `${des.join(' et ')}, le meilleur gardé` : String(des[0]);
    const texte = frenesie
        ? `Test d'Exaltation raté à 5 de Soif (${lu}) : jet contre la frénésie de Soif, difficulté 4 — au réveil, la torpeur (p. 219-220).`
        : reussi ? `Test d'Exaltation réussi (${lu}) : la Soif reste à ${soifAvant}.`
        : `Test d'Exaltation raté (${lu}) : Soif ${soifAvant} → ${soifApres}.`;
    return { des: [...des], reussi, soifAvant, soifApres, frenesie, texte };
}

/** Lance le test : deux dés si la Puissance du sang le permet pour ce test (p. 211, 216). */
export function testerLExaltation(soifDeLaFiche: unknown, deuxDes: boolean, de: () => number): TestDExaltation {
    return resoudreLExaltation(Array.from({ length: deuxDes ? 2 : 1 }, de), soifDeLaFiche);
}

/** Le tableau des Compulsions aléatoires (p. 208) ; le 10 du dé est le 0. */
export function compulsionAleatoire(de: number): { nom: string; effet: string } {
    const v = entier(de);
    if (v <= 3) return { nom: 'Soif', effet: '−2 dés à toute action qui ne vise pas à se nourrir, jusqu’à étancher 1 point de Soif (p. 208).' };
    if (v <= 5) return { nom: 'Domination', effet: '−2 dés à toute action qui n’établit pas sa domination ; pas de travail d’équipe (p. 208).' };
    if (v <= 7) return { nom: 'Destruction', effet: '−2 dés à toute action qui ne fait pas aussitôt du mal ou ne détruit pas, jusqu’à neutraliser, détruire ou faire fuir une cible (p. 209).' };
    if (v <= 9) return { nom: 'Paranoïa', effet: '−2 dés à toute action qui ne l’éloigne pas d’une menace, jusqu’à environ une heure passée en lieu sûr (p. 209).' };
    return { nom: 'Compulsion de clan', effet: 'Celle du clan du personnage ; relancer pour un Caitiff ou un Sang Clair (p. 208).' };
}
