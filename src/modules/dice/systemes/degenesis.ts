import type { DieResult, RollResult } from '../DiceEngine';
import type { DegreDeReussite } from '../degresDeReussite';

/**
 * **Le jet de Degenesis (KatharSys)** — 30/10/2026, à la demande de David (« finir le
 * pilote », livre de base français Katharsys, pages **imprimées** : PDF − 1).
 *
 * Le pilote forgé additionnait l'attribut et la compétence en un SEUIL par dé, ne
 * lançait aucun dé (réserve de base à zéro) et exigeait quatre réussites. Le livre
 * (p. 18-19) : la **valeur d'action** (VA) vaut attribut + compétence ± modificateurs
 * en dés ; on lance autant de d6, chaque 4, 5 ou 6 est un succès ; au-delà de 12, on
 * ne lance que 12 dés et le surplus devient des **succès automatiques**. L'action
 * réussit si les succès atteignent la difficulté (1 facile … 10 tentative désespérée).
 * Les 6 sont aussi des **déclencheurs** (DC), qui ne comptent que sur une réussite
 * (p. 19) ; un échec dont les 1 dépassent les succès est un **échec critique**.
 * Chaque Traumatisme retire 1D (p. 105, 107) ; chaque point d'Égo dépensé à
 * l'initiative ajoute 1D à la première action du round (p. 100).
 *
 * Tout ici est pur : des dés et des nombres entrent, un résultat sort. Le panneau de
 * jet lance les dés et écrit sur la fiche, jamais ce module.
 */

/** Ce que le pilote nomme pour Degenesis (`jet.degenesis`). */
export interface RegleDeDegenesis {
    /** Les Traumatismes subis : −1D chacun à toute valeur d'action (p. 105). */
    traumatismes?: string;
    /** Les points d'Égo actuels, que le joueur dépense pour +1D (p. 100). */
    ego?: string;
}

/** L'échelle de difficulté du livre : le nombre de succès requis (p. 18). */
export const DIFFICULTES_DE_DEGENESIS = [
    { succes: 1, label: 'Facile' },
    { succes: 2, label: 'Délicate' },
    { succes: 4, label: 'Difficile' },
    { succes: 6, label: 'Très difficile' },
    { succes: 8, label: 'Presque impossible' },
    { succes: 10, label: 'Tentative désespérée' },
] as const;

/** Les modificateurs du livre, toujours en dés (p. 102-106). */
export const MODIFICATEURS_DE_DEGENESIS = [
    { des: -2, label: 'Déplacement de plus de 2 m' },
    { des: -2, label: "Changer d'arme" },
    { des: -4, label: 'Portée longue' },
    { des: -8, label: 'Portée extrême' },
    { des: -4, label: 'Combat à deux mains' },
    { des: -1, label: 'Faible visibilité, brouillard' },
    { des: -2, label: 'Clair de lune' },
    { des: -4, label: 'Obscurité' },
] as const;

/** Ce que les déclencheurs disent de la réussite (p. 19). */
export const QUALITES_DES_DECLENCHEURS = ['bien', 'remarquable', 'excellent', 'brillant', 'exceptionnel', 'légendaire'] as const;

/** Les dés au-delà de douze ne se lancent pas : ils sont des succès d'office (p. 18). */
export const PLAFOND_DE_DEGENESIS = 12;

/** Au plus trois points d'Égo dépensés au round, hors Potentiels (p. 100). */
export const EGO_PAR_ROUND = 3;

/** Ce que le joueur règle avant de lancer. */
export interface ChoixDeDegenesis {
    /** La somme des modificateurs en dés : portée, déplacement, maniabilité, environnement… */
    modificateur: number;
    /** Les points d'Égo dépensés pour cette action : +1D chacun (p. 100). */
    ego: number;
}

export const CHOIX_DE_DEGENESIS: ChoixDeDegenesis = { modificateur: 0, ego: 0 };

/** La réserve d'une action : combien de dés se lancent, combien de succès sont acquis. */
export interface ReserveDeDegenesis {
    /** Attribut + compétence. */
    base: number;
    modificateur: number;
    ego: number;
    traumatismes: number;
    /** La valeur d'action modifiée. */
    valeur: number;
    /** Les dés lancés : jamais plus de douze, jamais moins de zéro. */
    des: number;
    /** Les succès d'office, au-delà de douze dés. */
    automatiques: number;
}

const entier = (n: unknown) => Math.trunc(Number(n) || 0);

/** VA = attribut + compétence ± modificateurs ; 12 dés au plus, le reste en succès (p. 18). */
export function reserveDeDegenesis(base: number, choix: Partial<ChoixDeDegenesis>, traumatismes = 0): ReserveDeDegenesis {
    const modificateur = entier(choix.modificateur);
    const ego = Math.max(0, entier(choix.ego));
    const trauma = Math.max(0, entier(traumatismes));
    const valeur = entier(base) + modificateur + ego - trauma;
    return {
        base: entier(base), modificateur, ego, traumatismes: trauma, valeur,
        des: Math.max(0, Math.min(PLAFOND_DE_DEGENESIS, valeur)),
        automatiques: Math.max(0, valeur - PLAFOND_DE_DEGENESIS),
    };
}

/** « 2 déclencheurs : remarquable » ; au-delà de six, toujours légendaire. */
export function qualiteDesDeclencheurs(declencheurs: number): string | undefined {
    if (declencheurs <= 0) return undefined;
    return QUALITES_DES_DECLENCHEURS[Math.min(declencheurs, QUALITES_DES_DECLENCHEURS.length) - 1];
}

/** Une action de plus par tranche de deux déclencheurs au jet d'initiative (p. 100-101). */
export function actionsDuRound(declencheurs: number): number {
    return 1 + Math.floor(Math.max(0, declencheurs) / 2);
}

export type BilanDeDegenesis = 'reussite' | 'echec' | 'echec-critique';

export const LIBELLES_DE_DEGENESIS: Record<BilanDeDegenesis, string> = {
    reussite: 'Réussite',
    echec: 'Échec',
    'echec-critique': 'Échec critique',
};

export interface JetDeDegenesis extends RollResult {
    degenesis: {
        des: number[];
        automatiques: number;
        succes: number;
        /** Les 6, comptés seulement sur une réussite (p. 19). */
        declencheurs: number;
        /** Les 6 obtenus, même sur un échec : une confrontation à égalité se départage par eux (p. 19). */
        six: number;
        uns: number;
        difficulte: number;
        bilan: BilanDeDegenesis;
        libelle: string;
        qualite?: string;
    };
}

/** Le degré du moteur : la qualité de la réussite se lit aux déclencheurs. */
function degreDe(bilan: BilanDeDegenesis, declencheurs: number): DegreDeReussite {
    if (bilan === 'echec-critique') return 'echec-total';
    if (bilan === 'echec') return 'echec-normal';
    return declencheurs >= 3 ? 'reussite-particuliere' : declencheurs >= 1 ? 'reussite-significative' : 'reussite-normale';
}

/**
 * Résout un jet déjà lancé. Échec : moins de succès que la difficulté ; échec critique :
 * échec, et plus de 1 que de succès (p. 19). Les succès automatiques comptent comme
 * des succès, sans être des 6.
 */
export function resoudreDegenesis(des: readonly number[], automatiques: number, difficulte: number): JetDeDegenesis {
    const succes = des.filter(v => v >= 4).length + Math.max(0, automatiques);
    const six = des.filter(v => v === 6).length;
    const uns = des.filter(v => v === 1).length;
    const reussi = succes >= difficulte;
    const bilan: BilanDeDegenesis = reussi ? 'reussite' : uns > succes ? 'echec-critique' : 'echec';
    const declencheurs = reussi ? six : 0;
    const qualite = qualiteDesDeclencheurs(declencheurs);
    const libelle = LIBELLES_DE_DEGENESIS[bilan] + (qualite ? ` ${qualite}` : '');
    const rolls: DieResult[] = des.map(v => ({ val: v, sides: 6, isCritMax: v >= 4, isCritMin: v === 1 }));
    const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
    const detail = [
        `${succes} succès`,
        automatiques > 0 ? `dont ${automatiques} d'office` : '',
        reussi && declencheurs > 0 ? pluriel(declencheurs, 'déclencheur') : '',
        bilan === 'echec-critique' ? pluriel(uns, 'un') : '',
    ].filter(Boolean).join(', ');
    return {
        total: succes,
        rolls,
        modifier: automatiques,
        successes: succes,
        // Les 1 ne sont pas des « fléaux » : ils ne comptent que pour l'échec critique, dit dans le bilan.
        fails: 0,
        tagSuccess: reussi,
        degre: degreDe(bilan, declencheurs),
        totalDisplay: `${libelle} — ${detail} (difficulté ${difficulte})`,
        degenesis: { des: [...des], automatiques, succes, declencheurs, six, uns, difficulte, bilan, libelle, qualite },
    };
}

/** Lance et résout : `de` rend un d6 (le panneau lui passe le moteur). */
export function lancerDegenesis(reserve: Pick<ReserveDeDegenesis, 'des' | 'automatiques'>, difficulte: number, de: () => number): JetDeDegenesis {
    return resoudreDegenesis(Array.from({ length: reserve.des }, de), reserve.automatiques, difficulte);
}

/**
 * Une confrontation : chacun lance, le plus de succès l'emporte ; à égalité, le plus de
 * 6 ; sinon égalité, que celui qui a pris l'initiative de l'action perd quand il faut
 * un vainqueur (p. 19-20).
 */
export function confrontation(
    a: { succes: number; six: number }, b: { succes: number; six: number },
): 'a' | 'b' | 'egalite' {
    if (a.succes !== b.succes) return a.succes > b.succes ? 'a' : 'b';
    if (a.six !== b.six) return a.six > b.six ? 'a' : 'b';
    return 'egalite';
}

/** Ce que la santé du personnage dit de lui (p. 94, 107). */
export interface SanteDeDegenesis {
    /** Blessures superficielles et Traumatismes subis, après le coup. */
    blessures: number;
    traumatismes: number;
    /** Ce que la jauge de santé restante perd : les deux pistes à la fois. */
    retenus: number;
    /** Ce qui n'a trouvé de place nulle part : le personnage était déjà perdu. */
    perdus: number;
    mort: boolean;
}

/**
 * **Un coup qui frappe la chair** (p. 107) : les dégâts cochent d'abord les Blessures
 * superficielles ; au-delà de leur maximum, le reste devient des Traumatismes. Quand
 * les Traumatismes atteignent leur maximum, le personnage ne peut plus être sauvé.
 * L'armure est déjà retirée des dégâts saisis.
 */
export function encaisserDegenesis(
    degats: number, actuel: { blessures: number; traumatismes: number },
    max: { blessures: number; traumatismes: number },
): SanteDeDegenesis {
    const d = Math.max(0, entier(degats));
    const b0 = Math.max(0, entier(actuel.blessures)), t0 = Math.max(0, entier(actuel.traumatismes));
    const surBlessures = Math.min(d, Math.max(0, max.blessures - b0));
    const surTrauma = Math.min(d - surBlessures, Math.max(0, max.traumatismes - t0));
    const traumatismes = t0 + surTrauma;
    return {
        blessures: b0 + surBlessures, traumatismes,
        retenus: surBlessures + surTrauma, perdus: d - surBlessures - surTrauma,
        mort: traumatismes >= max.traumatismes,
    };
}

/** Le soin efface d'abord les Blessures superficielles ; un Traumatisme se soigne à part. */
export function soignerDegenesis(points: number, blessures: number): { blessures: number; rendus: number } {
    const rendus = Math.min(Math.max(0, entier(points)), Math.max(0, entier(blessures)));
    return { blessures: Math.max(0, entier(blessures)) - rendus, rendus };
}
