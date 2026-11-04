import { actionsDuRound, EGO_PAR_ROUND, lancerDegenesis, reserveDeDegenesis, type JetDeDegenesis } from './degenesis';

/**
 * **Le combat de Degenesis : le round, la défense et les dégâts nets** — DEG-A1 et DEG-A2,
 * 03/11/2026, à la demande de David (« on va commencer DEG-A1 et DEG-A2 »). Livre de base
 * français Katharsys, pages **imprimées** (PDF − 1).
 *
 * - **Le round** (p. 100-101) : avant le jet d'initiative, chacun dépense de 0 à 3 points
 *   d'Égo — aucun s'il est pris par surprise ; chacun ajoute 1D à l'initiative **et à la
 *   toute première action du round**, pas aux suivantes. Le score est le nombre de succès ;
 *   une action, plus une par paire de déclencheurs ; aucun succès : une action à 0.
 * - **La défense** (p. 102, 106) : passive, c'est la difficulté de l'attaque (1, +1 actif et
 *   debout, +1 couvert partiel, +4 couvert total, +1 en mouvement) ; active, elle **coûte une
 *   action** et devient une confrontation que le défenseur gagne à égalité ; sans action
 *   restante, il ne lui reste que la passive. Une parade au corps à corps gagnée avec trois
 *   déclencheurs blesse l'assaillant ; une esquive, jamais.
 * - **Les dégâts** (p. 103, 107, 155-156, 160) : dégâts de l'arme (F = PHY + Force, divisé et
 *   arrondi au-dessus) + déclencheurs + Potentiels, moins **une** armure. « Mortel » va en
 *   Traumatismes sans armure ; une arme sonique ignore l'armure ; la pénétration annule une
 *   armure inférieure ou égale ; l'étourdissement va à l'Égo, armure comprise.
 *
 * Tout ici est pur : des nombres et des textes de fiche entrent, un résultat sort.
 */

const entier = (n: unknown) => Math.trunc(Number(n) || 0);

/**
 * Ce que le pilote nomme pour le combat (`jet.degenesis.combat`, pilote 2.1.0) : des champs
 * de la fiche, jamais des valeurs. Sans ce bloc, le panneau garde le jet d'avant.
 */
export interface RegleDuCombatDeDegenesis {
    /** Les champs dont la somme est F : PHY + Force (p. 103). */
    force: string[];
    /** Les compétences dont le jet est une attaque : Corps à corps, Lutte, Armes à projectiles (p. 102). */
    attaques: string[];
    /** Celles qui tirent : ni parade ni contre-attaque contre elles, l'esquive seule (p. 102, 106). */
    aDistance?: string[];
    armes: { nom: string; degats: string; maniabilite?: string; proprietes?: string }[];
    armures: { nom?: string; valeur: string }[];
    /** Les champs additionnés pour chaque défense active (p. 102). */
    defenses: Partial<Record<GenreDeDefense, string[]>>;
}

/** « +1D », « −2D », « -3D », « 0 » : la maniabilité en dés (p. 103). Illisible : 0. */
export function lireLaManiabilite(texte: unknown): number {
    const m = /([+\-−–]?)\s*(\d+)/.exec(String(texte ?? ''));
    if (!m) return 0;
    return (m[1] && m[1] !== '+' ? -1 : 1) * Number(m[2]);
}

/** La maniabilité d'une arme de la fiche, en dés. */
export const maniabiliteDe = (valeurs: Record<string, unknown>, arme: { maniabilite?: string } | undefined) =>
    arme?.maniabilite ? lireLaManiabilite(valeurs[arme.maniabilite]) : 0;

/** La somme des champs nommés, lue sur une fiche. */
export const sommeDesChamps = (valeurs: Record<string, unknown>, champs: readonly string[] | undefined) =>
    (champs ?? []).reduce((s, c) => s + entier(valeurs[c]), 0);

/* ───────────────────────────── Le round ───────────────────────────── */

/** Ce que le meneur déclare avant l'initiative. */
export interface DeclarationDuRound {
    /** Les points d'Égo dépensés : 0 à 3 (p. 100). */
    ego: number;
    /** Pris par surprise ou en embuscade : aucun Égo (p. 100). */
    surpris: boolean;
    /** PSY + Réactivité saisi pour un adversaire sans fiche (le « jet général » du MJ, p. 101). */
    va?: number;
}

export const DECLARATION_DU_ROUND: DeclarationDuRound = { ego: 0, surpris: false };

/** Ce que le jet d'initiative a donné à un combattant pour ce round. */
export interface EtatDuRound {
    score: number;
    declencheurs: number;
    actions: number;
    utilisees: number;
    /** Les dés d'Égo dus à la première action : payés une fois, à l'initiative. */
    bonusEgo: number;
    /** La première action a eu lieu : le bonus est épuisé (p. 100). */
    bonusUtilise: boolean;
}

/** Ce qu'il peut dépenser : trois au plus, ce qu'il a, rien s'il est surpris. */
export function egoPermis(disponible: number | undefined, surpris: boolean): number {
    if (surpris || disponible === undefined) return 0;
    return Math.max(0, Math.min(EGO_PAR_ROUND, entier(disponible)));
}

/**
 * Le jet d'initiative d'un combattant : PSY + Réactivité + l'Égo dépensé, −1D par
 * Traumatisme (p. 100, 105). L'Égo se paie ici, une fois, et revient à la première action.
 */
export function lancerLInitiative(
    va: number, traumatismes: number, declaration: DeclarationDuRound, egoDisponible: number | undefined, de: () => number,
): { etat: EtatDuRound; jet: JetDeDegenesis; egoPaye: number } {
    const egoPaye = Math.min(entier(declaration.ego), egoPermis(egoDisponible, declaration.surpris));
    const jet = lancerDegenesis(reserveDeDegenesis(va, { ego: egoPaye }, traumatismes), 1, de);
    const declencheurs = jet.degenesis.six;
    return {
        etat: {
            score: jet.degenesis.succes, declencheurs,
            actions: actionsDuRound(declencheurs), utilisees: 0, bonusEgo: egoPaye, bonusUtilise: egoPaye === 0,
        },
        jet, egoPaye,
    };
}

/**
 * L'ordre du round (p. 101) : le score le plus haut d'abord ; à égalité, les joueurs agissent
 * ensemble (simultané) et annoncent avant un PNJ du même score.
 */
export function ordonnerLInitiative<T extends { id: string; score: number; joueur: boolean }>(lignes: T[]): (T & { simultane: boolean })[] {
    const triees = [...lignes].sort((a, b) => b.score - a.score || Number(b.joueur) - Number(a.joueur));
    return triees.map(l => ({
        ...l,
        simultane: l.joueur && triees.some(o => o.id !== l.id && o.joueur && o.score === l.score),
    }));
}

export const actionsRestantes = (e: EtatDuRound) => Math.max(0, e.actions - e.utilisees);

/** Le bonus que la prochaine action recevrait : celui de l'Égo, si c'est la première. */
export const bonusDeLaProchaineAction = (e: EtatDuRound | undefined) =>
    e && !e.bonusUtilise && e.utilisees === 0 ? e.bonusEgo : 0;

/**
 * Une action se dépense — attaque, défense active, rechargement… La première reçoit les dés
 * d'Égo payés à l'initiative ; les suivantes, jamais (p. 100). Sans action restante, `null` :
 * le combattant n'a plus que des actions gratuites et sa défense passive (p. 102).
 */
export function depenserUneAction(e: EtatDuRound): { etat: EtatDuRound; bonus: number } | null {
    if (actionsRestantes(e) === 0) return null;
    return { etat: { ...e, utilisees: e.utilisees + 1, bonusUtilise: true }, bonus: bonusDeLaProchaineAction(e) };
}

/** Rendre la dernière action dépensée, quand le meneur s'est trompé. Le bonus ne revient pas. */
export function rendreUneAction(e: EtatDuRound): EtatDuRound {
    return { ...e, utilisees: Math.max(0, e.utilisees - 1) };
}

/* ─────────────────────────── La défense ─────────────────────────── */

export interface FacteursDeDefense {
    actifDebout: boolean;
    couvertPartiel: boolean;
    couvertTotal: boolean;
    enMouvement: boolean;
    divers: number;
}

export const FACTEURS_DE_DEFENSE: FacteursDeDefense = { actifDebout: true, couvertPartiel: false, couvertTotal: false, enMouvement: false, divers: 0 };

export const LIBELLES_DES_FACTEURS: Record<Exclude<keyof FacteursDeDefense, 'divers'>, { label: string; valeur: number }> = {
    actifDebout: { label: 'Actif et debout', valeur: 1 },
    couvertPartiel: { label: 'Couvert partiel (bouclier)', valeur: 1 },
    couvertTotal: { label: 'Couvert total', valeur: 4 },
    enMouvement: { label: 'En mouvement (plus de 2 m)', valeur: 1 },
};

/** La défense passive : la difficulté de l'attaque (p. 106). Une valeur de base de 1. */
export function defensePassive(f: FacteursDeDefense): number {
    let d = 1;
    for (const k of Object.keys(LIBELLES_DES_FACTEURS) as (keyof typeof LIBELLES_DES_FACTEURS)[]) if (f[k]) d += LIBELLES_DES_FACTEURS[k].valeur;
    return Math.max(0, d + entier(f.divers));
}

/** Les trois manières de se défendre activement (p. 102). */
export type GenreDeDefense = 'esquive' | 'parade-corps-a-corps' | 'parade-lutte';

export const LIBELLES_DES_DEFENSES: Record<GenreDeDefense, string> = {
    esquive: 'Esquive — AGI + Mobilité',
    'parade-corps-a-corps': 'Parade — PHY + Corps à corps',
    'parade-lutte': 'Parade — PHY + Lutte',
};

export interface IssueDeLaDefense {
    touche: boolean;
    /** Le défenseur l'emporte avec trois déclencheurs en parant au corps à corps (p. 106). */
    contreAttaque: boolean;
    texte: string;
}

export function contreLaPassive(succesDeLAttaque: number, defense: number): IssueDeLaDefense {
    const touche = succesDeLAttaque >= defense;
    return { touche, contreAttaque: false, texte: `Défense passive ${defense} : ${succesDeLAttaque} succès ${touche ? '≥' : '<'} ${defense} — ${touche ? 'touché' : 'manqué'}.` };
}

/**
 * La défense active : le défenseur réussit s'il égale ou dépasse les succès de l'attaquant
 * (p. 102). La contre-attaque demande **plus** de succès et trois déclencheurs, une parade
 * (pas une esquive) et une attaque au corps à corps (p. 106).
 */
export function contreLActive(
    succesDeLAttaque: number, defense: { succes: number; six: number }, genre: GenreDeDefense, corpsACorps: boolean,
): IssueDeLaDefense {
    const pare = defense.succes >= succesDeLAttaque;
    const contreAttaque = corpsACorps && genre !== 'esquive' && defense.succes > succesDeLAttaque && defense.six >= 3;
    const verbe = genre === 'esquive' ? 'esquivé' : 'paré';
    return {
        touche: !pare, contreAttaque,
        texte: `Défense active : ${defense.succes} succès contre ${succesDeLAttaque} — ${pare ? verbe : 'touché'}.`
            + (contreAttaque ? ' Trois déclencheurs : il contre-attaque et blesse son assaillant (p. 106).' : ''),
    };
}

/* ─────────────────────────── Les dégâts ─────────────────────────── */

/** « 4+F/2 » avec PHY + Force 7 : 4 + 4 = 8 ; « DC », « Trauma », « Égo » ne sont pas des points. */
export function lireLesDegats(texte: string, force: number): { base: number; detail: string } | null {
    const propre = String(texte ?? '').replace(/\b(DC|trauma\w*)\b|[ée]go/gi, ' ').replace(/\s+/g, '');
    if (!propre || /^[-—–]+$/.test(propre)) return null;
    const termes = propre.split('+').filter(Boolean);
    if (!termes.length) return null;
    let base = 0;
    const morceaux: string[] = [];
    for (const t of termes) {
        const f = /^F(?:\/(\d+))?$/i.exec(t);
        if (f) {
            const diviseur = Number(f[1] ?? 1) || 1;
            const v = Math.ceil(Math.max(0, force) / diviseur);
            base += v;
            morceaux.push(`${f[1] ? `F/${diviseur}` : 'F'} (${force} → ${v})`);
        } else if (/^\d+$/.test(t)) {
            base += Number(t);
            morceaux.push(t);
        } else return null;
    }
    return { base, detail: morceaux.join(' + ') };
}

export interface ProprietesDeLArme {
    mortel: boolean;
    /** La valeur d'armure que l'arme traverse. */
    penetration?: number;
    /** Les dégâts vont à l'Égo ; la valeur entre parenthèses, si l'arme n'a pas d'autres dégâts. */
    etourdissement?: { degats?: string };
    /** Une arme sonique ignore l'armure ; ses dégâts disent la piste (« 1+DC Trauma », « 1+DC Égo »). */
    sonique?: 'traumatismes' | 'ego';
}

export const SANS_PROPRIETE: ProprietesDeLArme = { mortel: false };

/** Ce que les propriétés et la colonne des dégâts de la fiche disent de l'arme (p. 155-156, 160). */
export function lireLesProprietes(proprietes: string, degats = ''): ProprietesDeLArme {
    const p = String(proprietes ?? '');
    const pen = /p[ée]n[ée]tration\s*\(\s*(\d+)\s*\)/i.exec(p);
    const etour = /[ée]tourdissement\s*(?:\(([^)]*)\))?/i.exec(p);
    const d = String(degats ?? '');
    const sonique = /\bDC\b/i.test(d) && /trauma/i.test(d) ? 'traumatismes' as const
        : /\bDC\b/i.test(d) && /[ée]go/i.test(d) ? 'ego' as const : undefined;
    return {
        mortel: /\bmortel/i.test(p),
        ...(pen ? { penetration: Number(pen[1]) } : {}),
        // « Étourdissement (F/2) » sur un coup de pied : les dégâts sont entre parenthèses (p. 156).
        ...(etour ? { etourdissement: etour[1]?.trim() ? { degats: etour[1].trim() } : {} } : {}),
        ...(sonique ? { sonique } : {}),
    };
}

export type PisteDuCoup = 'blessures' | 'traumatismes' | 'ego';

export const LIBELLES_DES_PISTES: Record<PisteDuCoup, string> = {
    blessures: 'Blessures superficielles',
    traumatismes: 'Traumatismes',
    ego: 'Égo',
};

export interface CoupDeDegenesis {
    bruts: number;
    /** La valeur de l'armure retenue, et ce qu'elle retire vraiment. */
    armure: number;
    armureRetiree: number;
    nets: number;
    piste: PisteDuCoup;
    texte: string;
}

/**
 * Dégâts = arme + déclencheurs (+ Potentiels) ; Blessures = dégâts − armure (p. 107). Une
 * seule armure : la meneuse choisit celle qui protège, elles ne s'additionnent pas.
 */
export function calculerLeCoup(c: {
    base: number; declencheurs: number; potentiels?: number; armure: number; proprietes: ProprietesDeLArme;
}): CoupDeDegenesis {
    const bruts = Math.max(0, entier(c.base) + Math.max(0, entier(c.declencheurs)) + entier(c.potentiels));
    const armure = Math.max(0, entier(c.armure));
    const p = c.proprietes;
    const piste: PisteDuCoup = p.mortel ? 'traumatismes' : p.sonique ?? (p.etourdissement ? 'ego' : 'blessures');
    const ignoree = p.mortel ? 'mortel' : p.sonique ? 'sonique' : p.penetration !== undefined && armure > 0 && armure <= p.penetration ? `pénétration (${p.penetration})` : null;
    const armureRetiree = ignoree ? 0 : Math.min(armure, bruts);
    const nets = bruts - armureRetiree;
    const calcul = armure === 0 ? `${bruts}` : ignoree ? `${bruts} (armure ${armure} ignorée : ${ignoree})` : `${bruts} − armure ${armure} = ${nets}`;
    return { bruts, armure, armureRetiree, nets, piste, texte: `${calcul} → ${LIBELLES_DES_PISTES[piste]}` };
}
