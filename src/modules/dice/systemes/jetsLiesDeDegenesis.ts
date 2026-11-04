import { confrontation, qualiteDesDeclencheurs, LIBELLES_DE_DEGENESIS, type JetDeDegenesis } from './degenesis';

/**
 * **Les jets liés de Degenesis : aide, combinaison, confrontation, action complexe** —
 * DEG-A4, 04/11/2026, à la demande de David (« on commence DEG-A3 et DEG-A4 ») ; choix du
 * même jour : l'aide et l'action complexe, GM-OS lance la réserve de l'adversaire. Livre de
 * base français Katharsys, pages **imprimées** (PDF − 1).
 *
 * - **Confrontation** (p. 19-20) : la difficulté de chacun vaut les succès de l'autre ; le plus
 *   de succès l'emporte, à égalité le plus de 6 ; sinon statu quo, ou, quand il faut un
 *   vainqueur, celui qui a pris l'initiative de l'action perd.
 * - **Combinaison de tests** (p. 20) : le second test ne se tente qu'après la réussite du
 *   premier ; les déclencheurs du premier s'ajoutent à ceux du second, **seulement** s'il
 *   réussit. Ils se comptent une fois : le report se consomme.
 * - **Action complexe** (p. 21) : un objectif de succès sur plusieurs jets ; chaque déclencheur
 *   compte comme un succès de plus. En coopération, les succès et déclencheurs de l'équipe
 *   s'additionnent (p. 21).
 * - **Aide** (p. 21) : l'assistant fait le même test, difficulté +1 ; s'il réussit, ses
 *   déclencheurs deviennent autant de dés de bonus pour le personnage aidé. Plusieurs
 *   assistants : chacun a +1. Les dés d'aide entrent dans la valeur d'action, donc sous le
 *   plafond de 12 dés et le surplus en succès d'office (p. 18).
 *
 * Tout ici est pur.
 */

const entier = (n: unknown) => Math.max(0, Math.trunc(Number(n) || 0));

/** La difficulté de plus que subit un assistant (p. 21). */
export const DIFFICULTE_DE_L_AIDE = 1;

/** Les dés qu'une aide apporte : ses déclencheurs, seulement sur une réussite (p. 21). */
export const desDeLAide = (jet: JetDeDegenesis) => (jet.degenesis.bilan === 'reussite' ? jet.degenesis.declencheurs : 0);

/**
 * **La combinaison** : le second jet reçoit les déclencheurs reportés du premier, s'il réussit.
 * Le jet rendu les compte dans `declencheurs` (l'attaque, le journal et la qualité les lisent
 * donc une seule fois) et garde `reportes` pour le dire.
 */
export function combinerLesDeclencheurs(jet: JetDeDegenesis, reportes: number): JetDeDegenesis {
    const n = entier(reportes);
    const d = jet.degenesis;
    if (n === 0) return jet;
    if (d.bilan !== 'reussite') return { ...jet, degenesis: { ...d, reportes: n, reportesPerdus: true } };
    const declencheurs = d.declencheurs + n;
    const qualite = qualiteDesDeclencheurs(declencheurs);
    const libelle = LIBELLES_DE_DEGENESIS.reussite + (qualite ? ` ${qualite}` : '');
    return {
        ...jet,
        totalDisplay: `${libelle} — ${d.succes} succès, ${d.declencheurs} déclencheur${d.declencheurs > 1 ? 's' : ''} + ${n} reporté${n > 1 ? 's' : ''} (difficulté ${d.difficulte})`,
        degenesis: { ...d, declencheurs, qualite, libelle, reportes: n },
    };
}

/** « 1 déclencheur + 2 reportés = 3 déclencheurs (p. 20) », ou ce qui s'est perdu. */
export function texteDeLaCombinaison(jet: JetDeDegenesis): string | undefined {
    const d = jet.degenesis;
    if (!d.reportes) return undefined;
    if (d.reportesPerdus) return `Le second test échoue : les ${d.reportes} déclencheur${d.reportes > 1 ? 's' : ''} du premier sont perdus (p. 20).`;
    const propres = d.declencheurs - d.reportes;
    return `${propres} déclencheur${propres > 1 ? 's' : ''} + ${d.reportes} reporté${d.reportes > 1 ? 's' : ''} = ${d.declencheurs} déclencheur${d.declencheurs > 1 ? 's' : ''} (p. 20).`;
}

/* ───────────────────────────── Confrontation ───────────────────────────── */

export interface CampDeLaConfrontation { nom: string; succes: number; six: number }

export interface IssueDeLaConfrontation {
    gagnant: 'a' | 'b' | 'egalite';
    /** Ce qui a tranché. */
    par: 'succes' | 'six' | 'initiative' | 'statu-quo';
    texte: string;
}

/**
 * `initiative` : le camp qui a pris l'initiative de l'action, quand il faut un vainqueur ;
 * absent, une égalité parfaite reste un statu quo (p. 20).
 */
export function issueDeLaConfrontation(a: CampDeLaConfrontation, b: CampDeLaConfrontation, initiative?: 'a' | 'b'): IssueDeLaConfrontation {
    const camp = (x: CampDeLaConfrontation) => `${x.nom} ${x.succes} succès, ${x.six} six`;
    const tete = `${camp(a)} contre ${camp(b)} — `;
    const r = confrontation(a, b);
    if (r !== 'egalite') {
        const g = r === 'a' ? a : b;
        const par = a.succes !== b.succes ? 'succes' : 'six';
        return { gagnant: r, par, texte: `${tete}${g.nom} l’emporte${par === 'six' ? ' aux six' : ''} (p. 19).` };
    }
    if (initiative) {
        const perdant = initiative === 'a' ? a : b;
        const g = initiative === 'a' ? b : a;
        return { gagnant: initiative === 'a' ? 'b' : 'a', par: 'initiative', texte: `${tete}égalité parfaite : ${perdant.nom} a pris l’initiative et perd, ${g.nom} l’emporte (p. 20).` };
    }
    return { gagnant: 'egalite', par: 'statu-quo', texte: `${tete}égalité parfaite : statu quo, ou l’on repart à zéro (p. 19).` };
}

/* ───────────────────────────── Action complexe ───────────────────────────── */

export interface VersementALAction { qui: string; succes: number; six: number; total: number }

export interface ActionComplexe {
    id: string;
    nom: string;
    objectif: number;
    versements: VersementALAction[];
}

/** Ce qu'un jet verse : ses succès, plus un par déclencheur (p. 21). Chaque 6 compte double. */
export function versementDuJet(qui: string, jet: JetDeDegenesis): VersementALAction {
    const d = jet.degenesis;
    // Un jet sans succès n'a pas réussi : ses 6 n'existent pas (il n'y en a d'ailleurs aucun).
    const six = d.succes > 0 ? d.six : 0;
    return { qui, succes: d.succes, six, total: d.succes + six };
}

export const cumulDeLAction = (a: ActionComplexe) => a.versements.reduce((s, v) => s + v.total, 0);
export const actionAtteinte = (a: ActionComplexe) => cumulDeLAction(a) >= a.objectif;

export function verser(a: ActionComplexe, v: VersementALAction): ActionComplexe {
    return { ...a, versements: [...a.versements, v] };
}

/** « Kum : 4 succès + 1 déclencheur = 5 → 13 / 20 » */
export function texteDuVersement(a: ActionComplexe, v: VersementALAction): string {
    const apres = cumulDeLAction(a);
    return `${a.nom} — ${v.qui} : ${v.succes} succès${v.six ? ` + ${v.six} déclencheur${v.six > 1 ? 's' : ''}` : ''} = ${v.total} → ${apres} / ${a.objectif}`
        + (apres >= a.objectif ? ' : objectif atteint (p. 21).' : ' (p. 21).');
}
