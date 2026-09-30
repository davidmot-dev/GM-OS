import { ECHELLE_D_USURE } from './desDUsure';

/**
 * **Les ressources à dé d'usure d'un personnage** — Cthulhu Hack, étape 4,
 * 2026-09-30.
 *
 * Le dé courant de chaque ressource vit **sur la fiche**, dans un champ texte
 * (« d8 »). Le pupitre le lit, le lance, et y réécrit le dé qu'il devient :
 * *un seul endroit tient la vérité, la fiche.*
 *
 * **Deux façons de savoir quelles ressources s'usent** (décision de 2026-09-30,
 * sans rien demander de plus au meneur) :
 * 1. le pilote les déclare (`desDUsure`) — elles font foi ;
 * 2. sinon, les ressources que le pilote suit en combat (`statsToTrack`,
 *    `isResource`) **dont le champ contient un dé**. C'est le cas du pilote de
 *    Cthulhu Hack de David, forgé avant que `desDUsure` existe.
 */

/** Le mot écrit sur la fiche quand la ressource est épuisée. */
export const EPUISEE = 'Épuisée';

/**
 * Le dé courant lu dans un champ : ses faces, `null` si la ressource est
 * épuisée, `undefined` si le champ ne dit rien de lisible — **jamais un dé
 * inventé** : un champ vide n'est ni un d4 ni une ressource épuisée.
 */
export function deCourant(valeur: unknown): number | null | undefined {
    if (typeof valeur !== 'string') return undefined;
    const texte = valeur.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!texte) return undefined;
    if (/^epuise/.test(texte)) return null;
    const m = texte.match(/^1?d(\d+)$/);
    if (!m) return undefined;
    const faces = Number(m[1]);
    return (ECHELLE_D_USURE as readonly number[]).includes(faces) ? faces : undefined;
}

/** Ce qu'on écrit sur la fiche après un jet. */
export function ecrireLeDe(faces: number | null): string {
    return faces === null ? EPUISEE : `d${faces}`;
}

export interface RessourceDUsure {
    fieldId: string;
    label: string;
    /** Le plus gros dé qu'elle peut atteindre. */
    plafond: number;
}

interface PiloteLu {
    desDUsure?: { fieldId: string; label: string; plafond?: number }[];
    combat?: { statsToTrack?: { fieldId: string; label: string; isMainHP?: boolean; isResource?: boolean }[] };
}

/** Les ressources à dé d'usure de ce pilote, lues sur cette fiche. */
export function ressourcesDUsure(pilote: PiloteLu | null | undefined, fiche: Record<string, unknown> = {}): RessourceDUsure[] {
    if (!pilote) return [];
    if (pilote.desDUsure?.length) {
        return pilote.desDUsure.map(r => ({ fieldId: r.fieldId, label: r.label, plafond: r.plafond ?? 12 }));
    }
    return (pilote.combat?.statsToTrack ?? [])
        .filter(s => s.isResource && !s.isMainHP)
        .filter(s => deCourant(fiche[s.fieldId]) !== undefined)
        .map(s => {
            const courant = deCourant(fiche[s.fieldId]);
            return { fieldId: s.fieldId, label: s.label, plafond: courant === 20 ? 20 : 12 };
        });
}
