/**
 * **Star Trek Adventures, deuxième édition, jusqu'au bout** — 23/10/2026, à la
 * demande de David (« on va faire toute les améliorations de Star Trek », le
 * livre de base français sous la main). Les pages citées sont les pages
 * **imprimées** du Livre de Base (PDF = imprimée + 4).
 *
 * Ce module ne tient que ce qui touche **un personnage** : la tâche et ses
 * dés d'aide, la Détermination, le Stress, les blessures, la Réputation, la
 * création. Le vaisseau, la bataille spatiale et les tâches étendues, communs
 * à la table, vivent dans le module du jeu `star-trek-operations`.
 *
 * Tout ici est pur : la fiche entre, des nombres et des phrases sortent.
 */

import type { RollResult } from '../DiceEngine';
import { degreDepuisLeBooleen } from '../degresDeReussite';

/** Ce que GM-OS tient sur la fiche pour Star Trek, à côté des champs du jeu. */
export const CLE_STAR_TREK = '_gmos_star_trek';

/** Ce que le pilote nomme pour Star Trek (`jet.starTrek`). Chaque partie absente ne propose rien. */
export interface RegleDeStarTrek {
    /** Les six attributs et les six fonctions, pour la création et la progression (p. 132, 167). */
    attributs?: string[];
    fonctions?: string[];
    /** La Forme fixe le Stress maximal (p. 277). */
    forme?: string;
    /** La jauge de Stress ; et le maximum écrit sur la fiche, quand un talent l'a changé (Robuste, +2). */
    stress?: { courant: string; maximum?: string };
    /** La Protection de l'armure, qui réduit la gravité d'une blessure (p. 292). */
    protection?: string;
    determination?: string;
    reputation?: string;
    /** La Réputation remplace la fonction auprès de qui ne connaît que votre nom (p. 169). */
    composanteFonction?: string;
}

/** Une blessure, nommée par un trait (« Brûlure »), sa gravité, létale ou étourdissante (p. 290–292). */
export interface BlessureStarTrek {
    id: string;
    nom: string;
    gravite: number;
    letale: boolean;
    /** Traitée sur le terrain : ses pénalités sont annulées, elle peut se rouvrir (p. 292). */
    traitee: boolean;
}

export interface SuiviDeStarTrek {
    version: 1;
    blessures: BlessureStarTrek[];
    /** Vaincu : à terre, plus d'action jusqu'à la fin de la scène, sauf premiers secours (p. 292). */
    vaincu: boolean;
    /** L'attribut bloqué quand le personnage est épuisé (p. 278). */
    attributBloque?: string;
    /** Les points de Réprimande reçus aux jets de Réputation : ils élargissent la marge (p. 172). */
    reprimandes: number;
    mort?: boolean;
    recus: string[];
}

const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
type Valeurs = Record<string, unknown>;

export function lireStarTrek(v: Valeurs): SuiviDeStarTrek {
    const s = v[CLE_STAR_TREK] as SuiviDeStarTrek | undefined;
    return s?.version === 1 && Array.isArray(s.blessures) && Array.isArray(s.recus)
        ? s : { version: 1, blessures: [], vaincu: false, reprimandes: 0, recus: [] };
}
const copie = (v: Valeurs): SuiviDeStarTrek => structuredClone(lireStarTrek(v));
const ecrit = (s: SuiviDeStarTrek) => ({ [CLE_STAR_TREK]: s });

// ——— La tâche (p. 253–259) ———

/** La marge de complication : 1 (un 20) à 5 (de 16 à 20), jamais plus (p. 258–259). */
export const margeBornee = (marge: number) => Math.min(5, Math.max(1, Math.trunc(marge) || 1));
/** Le plus petit résultat qui complique, pour une marge donnée. */
export const seuilDeComplication = (marge: number) => 21 - margeBornee(marge);

/** Un d20 lancé pour une tâche : ce qu'il rapporte. */
export function lireUnDe(val: number, seuil: number, critique: number, complication: number) {
    const reussites = val <= critique ? 2 : val <= seuil ? 1 : 0;
    return { reussites, complique: val >= complication };
}

/** Un dé d'aide : un assistant, ou le vaisseau, avec son propre seuil et sa propre spécialisation (p. 178, 255). */
export interface DeDAide {
    label: string;
    seuil: number;
    /** Sous ou égal : deux réussites. La fonction si l'assistant a la spécialisation ; toujours pour le vaisseau. */
    critique: number;
    /** Une énergie redirigée vers ce système : le dé vaut 1 (p. 185). */
    vautUn?: boolean;
}

export interface DeDuJet { val: number; aide?: string; critique: number; seuil: number }

/**
 * **Compte une tâche** : les dés du personnage, puis ceux de l'aide — qui ne
 * comptent que si le personnage obtient au moins une réussite (p. 256). Les
 * complications des assistants comptent toujours.
 */
export function compterLaTache(des: DeDuJet[], complication: number) {
    let base = 0, aides = 0, complications = 0;
    for (const d of des) {
        const lu = lireUnDe(d.val, d.seuil, d.critique, complication);
        if (lu.complique) complications++;
        if (d.aide) aides += lu.reussites; else base += lu.reussites;
    }
    return { reussites: base > 0 ? base + aides : 0, base, aides, complications, aidesPerdues: base === 0 && aides > 0 };
}

/** Ce que coûtent les assistants : le premier est gratuit, chacun des suivants 1 Impulsion ou 1 Menace (p. 255). Le vaisseau n'en fait pas partie. */
export const coutDesAssistants = (nombre: number) => Math.max(0, nombre - 1);

/**
 * **La tâche en opposition** (p. 256–258) : le personnage réactif lance d'abord,
 * ses réussites font la difficulté (moins un par facteur qui le gêne, jamais
 * sous zéro). Si l'actif échoue, le réactif gagne autant d'Impulsion qu'il
 * manquait de réussites — à dépenser aussitôt ; pour un PNJ, de la Menace.
 */
export function oppositionDeLaTache(reussitesDuReactif: number, facteursContreLeReactif: number, reussitesDeLActif: number) {
    const difficulte = Math.max(0, reussitesDuReactif - Math.max(0, facteursContreLeReactif));
    const reussi = reussitesDeLActif >= difficulte;
    return { difficulte, reussi, impulsionDuReactif: reussi ? 0 : difficulte - reussitesDeLActif };
}

/** Difficulté 0 : réussie sans lancer, sans Impulsion ni complication ; lancer quand même rapporte 1 Impulsion par réussite (p. 254). */
export const tacheSimple = (difficulte: number) => difficulte <= 0;

// ——— La Détermination (p. 261–263) ———

/** On ne dépense de la Détermination qu'avec un idéal ou une directive qui s'aligne ; on n'en garde pas plus de 3. */
export const DETERMINATION_MAX = 3;
export function gagnerDeLaDetermination(avant: number) {
    const apres = Math.min(DETERMINATION_MAX, Math.max(0, avant) + 1);
    return { apres, perdue: apres === avant };
}

// ——— Le Stress (p. 277–278) ———

/** Le Stress maximal : la Forme, ou le maximum écrit sur la fiche quand un talent l'a changé. */
export function stressMaximal(regle: RegleDeStarTrek, v: Valeurs) {
    const ecritSurLaFiche = regle.stress?.maximum ? n(v[regle.stress.maximum]) : 0;
    return ecritSurLaFiche > 0 ? ecritSurLaFiche : (regle.forme ? n(v[regle.forme]) : 0);
}

export function etatDuStress(regle: RegleDeStarTrek, v: Valeurs) {
    const max = stressMaximal(regle, v);
    const courant = regle.stress ? Math.min(max || Infinity, Math.max(0, n(v[regle.stress.courant]))) : 0;
    return { courant, max, epuise: max > 0 && courant >= max };
}

/**
 * **Subir du Stress au lieu d'une conséquence** (p. 277) : autant que la gravité.
 * Ce qui ne tient plus dans la jauge devient une complication.
 */
export function subirDuStress(courant: number, max: number, gravite: number) {
    const place = Math.max(0, max - courant);
    const pris = Math.min(place, Math.max(0, gravite));
    return { apres: courant + pris, deborde: gravite > place, epuise: courant + pris >= max && max > 0 };
}

export type Repos = 'repit' | 'pause' | 'sommeil';
export const REPOS: Record<Repos, { label: string; efface: number | 'tout'; duree: string }> = {
    repit: { label: 'Répit', efface: 4, duree: 'quelques minutes' },
    pause: { label: 'Pause', efface: 8, duree: 'une demi-heure à quelques heures' },
    sommeil: { label: 'Sommeil', efface: 'tout', duree: 'plusieurs heures' },
};

/**
 * **Réduire le Stress** (p. 278) : 2 Impulsion par case après une tâche réussie, 3 cases
 * au plus de cette façon ; ou le repos. Un personnage épuisé ne se soulage que
 * par le repos ou l'aide d'autrui.
 */
export function reduireLeStress(courant: number, mode: Repos | { impulsion: number }) {
    if (typeof mode === 'object') {
        const cases = Math.min(3, Math.floor(Math.max(0, mode.impulsion) / 2), courant);
        return { apres: courant - cases, cout: cases * 2 };
    }
    const efface = REPOS[mode].efface;
    return { apres: efface === 'tout' ? 0 : Math.max(0, courant - efface), cout: 0 };
}

// ——— Les blessures (p. 290–293) ———

/**
 * La gravité qui touche : la Protection la réduit, jamais sous 1 ; une arme
 * Perforante l'ignore (p. 242, 292). Les dépenses d'Impulsion pour l'augmenter
 * (2 par point, 1 si Puissante, deux fois au plus) se font avant (p. 290).
 */
export function graviteSubie(gravite: number, protection: number, perforant = false) {
    return Math.max(1, gravite - (perforant ? 0 : Math.max(0, protection)));
}
/** Augmenter la gravité d'une attaque réussie : +1 par 2 Impulsion (1 si Puissante), deux fois au plus (p. 290, 242). */
export function augmenterLaGravite(fois: number, puissante = false) {
    const f = Math.min(2, Math.max(0, Math.trunc(fois)));
    return { plus: f, cout: f * (puissante ? 1 : 2) };
}

/**
 * **Encaisser une blessure** (p. 292) : le personnage peut l'éviter en prenant
 * autant de Stress que sa gravité ; sinon il est blessé **et vaincu**. Vaincu
 * avec une blessure létale, il est mourant et meurt à la fin de la scène si
 * personne ne le soigne.
 */
export function infligerUneBlessure(v: Valeurs, b: Omit<BlessureStarTrek, 'traitee'>, recu: string) {
    const s = copie(v);
    if (s.recus.includes(recu) || s.mort) return {};
    s.blessures.push({ ...b, traitee: false });
    s.vaincu = true;
    s.recus.push(recu);
    return ecrit(s);
}

export function etatDesBlessures(v: Valeurs) {
    const s = lireStarTrek(v);
    const mourant = s.vaincu && s.blessures.some(b => b.letale) && !s.mort;
    return { ...s, mourant };
}

/** Premiers secours : Audace + Médecine, difficulté 2 — le patient n'est plus vaincu (p. 292). */
export function premiersSecours(v: Valeurs) { const s = copie(v); s.vaincu = false; return ecrit(s); }

/** Traiter sur le terrain : Audace + Médecine, difficulté = gravité ; les pénalités s'annulent (p. 292). */
export function traiterUneBlessure(v: Valeurs, id: string) {
    const s = copie(v);
    s.blessures = s.blessures.map(b => b.id === id ? { ...b, traitee: true } : b);
    return ecrit(s);
}
/** Une complication rouvre une blessure traitée (p. 292). */
export function rouvrirUneBlessure(v: Valeurs, id: string) {
    const s = copie(v);
    s.blessures = s.blessures.map(b => b.id === id ? { ...b, traitee: false } : b);
    return ecrit(s);
}

/**
 * **L'intervention médicale** qui guérit (p. 292) : Maîtrise + Médecine, difficulté
 * égale à la gravité, +1 à la difficulté et à la marge si la blessure n'a pas été
 * traitée ; elle dure autant d'heures que la gravité.
 */
export function intervention(b: BlessureStarTrek) {
    return { difficulte: b.gravite + (b.traitee ? 0 : 1), marge: b.traitee ? 1 : 2, heures: b.gravite };
}
export function guerirUneBlessure(v: Valeurs, id: string) {
    const s = copie(v);
    s.blessures = s.blessures.filter(b => b.id !== id);
    return ecrit(s);
}
/** L'étourdissement s'estompe : les blessures étourdissantes s'effacent, et le personnage n'est plus vaincu s'il n'a rien de létal (p. 292). */
export function reprendreConnaissance(v: Valeurs) {
    const s = copie(v);
    s.blessures = s.blessures.filter(b => b.letale);
    if (!s.blessures.length) s.vaincu = false;
    return ecrit(s);
}
export function marquerLaMort(v: Valeurs, mort: boolean) {
    const s = copie(v);
    if (mort) s.mort = true; else delete s.mort;
    return ecrit(s);
}
export function bloquerUnAttribut(v: Valeurs, attribut: string | undefined) {
    const s = copie(v);
    if (attribut) s.attributBloque = attribut; else delete s.attributBloque;
    return ecrit(s);
}

// ——— La Réputation (p. 169–172) ———

/** Les questions de fin de mission, à répondre par oui ou par non (p. 171). */
export const INFLUENCES_POSITIVES = [
    'La mission a-t-elle été couronnée de succès ?',
    'Avez-vous utilisé de manière positive une ou plusieurs directives de la mission ?',
    'Avez-vous obéi aux ordres de vos supérieurs ?',
    'Avez-vous empêché un combat ou évité une escalade des hostilités ?',
    'Avez-vous établi un terrain d’entente ou une coopération pacifique ?',
    'Avez-vous contribué directement à sauver des vies ?',
    'Avez-vous pris toutes les mesures raisonnables pour porter secours ?',
];
export const INFLUENCES_NEGATIVES = [
    'La mission a-t-elle échoué ?',
    'Avez-vous contesté l’une des directives de la mission ?',
    'Avez-vous désobéi à vos supérieurs ?',
    'Des membres d’équipage sous votre commandement ont-ils été tués ?',
    'Avez-vous recouru à la force hors de la défense ?',
    'Avez-vous recouru à la force létale ?',
    'Avez-vous pris des risques inutiles ?',
    'Avez-vous causé ou permis la perte de vies innocentes ?',
    'Avez-vous menti, triché, menacé ou contraint ?',
    'Avez-vous permis un comportement contraire à l’éthique ?',
];

/** La chance de Réprimande : un 20 avec aucune réprimande, de 15 à 20 avec cinq ou plus (p. 172). */
export const complicationDeReputation = (reprimandes: number) => 20 - Math.min(5, Math.max(0, reprimandes));

/**
 * **Le jet de Réputation** (p. 171) : seuil 7 + Réputation, autant de d20 que
 * d'influences positives (sans plafond), difficulté égale aux négatives ; un dé
 * sous la Réputation vaut deux réussites. Au-delà de la difficulté, des points de
 * Gloire ; en deçà, une Réprimande par réussite manquante, plus une par 20 — ou
 * par dé dans la marge que les réprimandes passées ont élargie.
 */
export function jetDeReputation(reputation: number, positives: number, negatives: number, reprimandesPassees: number, de: () => number) {
    const seuil = 7 + reputation;
    const complication = complicationDeReputation(reprimandesPassees);
    const des = Array.from({ length: Math.max(0, positives) }, () => de());
    const reussites = des.reduce((s, d) => s + (d <= reputation ? 2 : d <= seuil ? 1 : 0), 0);
    const complications = des.filter(d => d >= complication).length;
    const reussi = reussites >= negatives;
    return {
        seuil, difficulte: negatives, des, reussites, complications, reussi,
        gloire: reussi ? reussites - negatives : 0,
        reprimandes: reussi ? 0 : negatives - reussites + complications,
    };
}
/** Améliorer sa Réputation coûte autant de Gloire que le niveau visé, une fois par aventure (p. 172). */
export const coutDeLaReputation = (visee: number) => Math.max(0, visee);
export const NIVEAUX_DE_REPUTATION = [
    'Tout juste digne du titre d’officier', 'Dossier médiocre', 'Dossier un peu incertain',
    'Dossier solide (départ)', 'Dossier irréprochable', 'Dossier exemplaire',
];
export function noterLesReprimandes(v: Valeurs, total: number) {
    const s = copie(v);
    s.reprimandes = Math.max(0, total);
    return ecrit(s);
}

// ——— La Menace (p. 264) ———

/** La Menace de départ : deux points par personnage joueur présent, à ajuster au ton de la mission. */
export const menaceDeDepart = (personnages: number, parPersonnage = 2) => Math.max(0, personnages) * parPersonnage;

// ——— La création et la progression (p. 132, 167–169) ———

/**
 * **Les bornes de la création** (p. 132) : un attribut au plus à 12, aucun au-dessus ;
 * une fonction au plus à 5, aucune au-dessus. On contrôle, on n'écrit rien.
 */
export function controleDeCreation(regle: RegleDeStarTrek, v: Valeurs) {
    const constats: string[] = [];
    const lire = (ids: string[] | undefined) => (ids ?? []).map(id => ({ id, valeur: n(v[id]) }));
    const attributs = lire(regle.attributs), fonctions = lire(regle.fonctions);
    const au12 = attributs.filter(a => a.valeur === 12).length;
    if (attributs.some(a => a.valeur > 12)) constats.push('Un attribut dépasse 12.');
    if (au12 > 1) constats.push(`${au12} attributs à 12 : un seul permis.`);
    if (attributs.some(a => a.valeur < 7)) constats.push('Un attribut est sous 7.');
    const a5 = fonctions.filter(f => f.valeur === 5).length;
    if (fonctions.some(f => f.valeur > 5)) constats.push('Une fonction dépasse 5.');
    if (a5 > 1) constats.push(`${a5} fonctions à 5 : une seule permise.`);
    return { constats, conforme: constats.length === 0,
        sommeDesAttributs: attributs.reduce((s, a) => s + a.valeur, 0), sommeDesFonctions: fonctions.reduce((s, f) => s + f.valeur, 0) };
}

/** Ce qu'un jalon ou un arc narratif permet d'augmenter (p. 167, 169). */
export function progressionPossible(genre: 'jalon' | 'arc', quoi: 'attribut' | 'fonction', valeur: number) {
    const plafond = genre === 'jalon' ? (quoi === 'attribut' ? 11 : 4) : (quoi === 'attribut' ? 12 : 5);
    return { possible: valeur < plafond, plafond };
}

// ——— Le tour de conflit (p. 277, 288–293) ———

export const RAPPELS_DU_CONFLIT = [
    'Un tour par round : une action majeure et une action mineure ; +1 mineure pour 1 Impulsion, +1 majeure pour 2 (difficulté +1), deux majeures au plus (p. 288–289).',
    'Les camps alternent ; garder l’initiative coûte 2 Impulsion, et l’allié qui la reçoit doit céder ensuite (p. 277).',
    'Corps à corps : Audace + Sécurité, difficulté 1, en opposition si la cible peut se défendre ; à distance : Maîtrise + Sécurité, difficulté 2, en opposition si elle est à couvert (p. 290).',
    'Létal : +1 Menace (escalade). Gravité +1 pour 2 Impulsion, deux fois au plus (p. 290).',
    'Éviter une blessure : autant de Stress que sa gravité (p. 292). Protection : la gravité baisse, jamais sous 1.',
    'Au contact d’un adversaire, toute tâche autre que le corps à corps : difficulté +1 (p. 286).',
    'À terre : +1 difficulté aux tirs à portée moyenne et au-delà, 2 Impulsion bonus aux attaques au contact et à portée courte (p. 288).',
    'Viser (mineure) : relancer un d20 de l’attaque ; deux avec une arme Précise (p. 288, 242).',
];

// ——— Le résultat au panneau ———

/**
 * **Le résultat d'une tâche, dés d'aide compris** — pour le panneau de jet. Les
 * dés du personnage, puis ceux des assistants et du vaisseau, chacun nommé ; la
 * Détermination « Occasion parfaite » fait d'un dé un 1 avant le lancer (p. 262).
 */
export function resultatDeStarTrek(des: DeDuJet[], complication: number, difficulte: number): RollResult {
    const c = compterLaTache(des, complication);
    const reussi = c.reussites >= difficulte;
    const detail = c.aides > 0 ? (c.aidesPerdues ? ` (l’aide ne compte pas : aucune réussite du personnage)` : ` (dont ${c.aides} de l’aide)`) : '';
    return {
        total: c.reussites,
        rolls: des.map(d => ({
            val: d.val, sides: 20,
            isCritMax: d.val <= d.critique, isCritMin: d.val >= complication,
            ...(d.aide ? { displayStr: d.aide, cssClass: 'aide-star-trek' } : {}),
        })),
        modifier: 0,
        successes: c.reussites,
        tagSuccess: reussi,
        degre: degreDepuisLeBooleen(reussi),
        totalDisplay: `${c.reussites} réussite${c.reussites > 1 ? 's' : ''}${detail}`,
    };
}

/** Relancer les dés choisis — Éclair d'inspiration, viser : le nouveau résultat remplace l'ancien, même moins bon (p. 253). */
export function relancerDes(des: DeDuJet[], indices: number[], de: () => number): DeDuJet[] {
    return des.map((d, i) => indices.includes(i) ? { ...d, val: de() } : d);
}

// ——— Ce que le panneau règle avant le lancer ———

export type NatureStarTrek = 'test' | 'melee' | 'distance';
export interface AssistantStarTrek { nom: string; seuil: number; critique: number }
export interface ChoixStarTrek {
    nature: NatureStarTrek;
    marge: number;
    idealAligne: boolean;
    occasionParfaite: boolean;
    assistants: AssistantStarTrek[];
    vaisseau: { label: string; seuil: number; critique: number; energie: boolean } | null;
    opposition: { reussites: number; facteurs: number } | null;
}
export const CHOIX_STAR_TREK: ChoixStarTrek = { nature: 'test', marge: 1, idealAligne: false, occasionParfaite: false, assistants: [], vaisseau: null, opposition: null };

/**
 * **Les dés d'une tâche, prêts à compter** : ceux du personnage (l'Occasion
 * parfaite fait du premier un 1, p. 262), puis un d20 par assistant et celui du
 * vaisseau — à 1 si l'énergie a été redirigée vers son système (p. 185).
 */
export function desDeLaTache(base: number[], seuil: number, critique: number, choix: ChoixStarTrek, de: () => number): DeDuJet[] {
    const propres = base.map((val, i) => ({ val: i === 0 && choix.occasionParfaite ? 1 : val, seuil, critique }));
    const aides = choix.assistants.map(a => ({ val: de(), seuil: a.seuil, critique: a.critique, aide: a.nom }));
    const vaisseau = choix.vaisseau ? [{ val: choix.vaisseau.energie ? 1 : de(), seuil: choix.vaisseau.seuil, critique: choix.vaisseau.critique, aide: choix.vaisseau.label }] : [];
    return [...propres, ...aides, ...vaisseau];
}
