import type { DieResult, RollResult } from './DiceEngine';
import { DEGRES_DE_REUSSITE, type DegreDeReussite } from './degresDeReussite';

/**
 * **Un résultat de jet lancé sur la tablette d'un joueur, relu chez le meneur**
 * — demandé par David le 2026-09-30 : *« je voudrais que les jets de dés des
 * tablettes remontent vers GM-OS pour que je les voie et pour qu'ils soient
 * pris en compte dans le journal »*.
 *
 * Le panneau de jet de la fiche garde sa mécanique sur la tablette — les
 * composantes, les dés achetés, la réserve commune — et **envoie ce qu'il a
 * obtenu**. Le meneur le croit, comme on croit un joueur qui lance à la table ;
 * mais il ne croit que la FORME qu'il attend : ce qui vient du réseau se relit
 * champ par champ, et tout le reste est jeté.
 *
 * Rend `null` quand il n'y a rien d'utilisable à inscrire.
 */
export interface ResultatVenuDeLaTablette {
    characterId: string;
    /** Ce qui a été lancé — « Combat + Devoir », « 2d20 »… sans le nom du personnage. */
    titre: string;
    resultat: RollResult;
}

const texte = (v: unknown, max: number): string | null =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
const nombre = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;
const booleen = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);

/** Un dé, réduit à ce que l'écran sait afficher. */
function lireUnDe(v: unknown): DieResult | null {
    if (!v || typeof v !== 'object') return null;
    const d = v as Record<string, unknown>;
    const val = typeof d.val === 'number' && Number.isFinite(d.val) ? d.val : texte(d.val, 12);
    if (val === null) return null;
    const de: DieResult = { val };
    const sides = nombre(d.sides);
    if (sides !== undefined) de.sides = sides;
    for (const cle of ['isCritMax', 'isCritMin', 'isExploded', 'isDropped'] as const) {
        const b = booleen(d[cle]);
        if (b !== undefined) de[cle] = b;
    }
    const affiche = texte(d.displayStr, 12);
    if (affiche) de.displayStr = affiche;
    if (d.source === 'base' || d.source === 'gear' || d.source === 'digit') de.source = d.source;
    return de;
}

export function lireLeResultatDeLaTablette(payload: unknown): ResultatVenuDeLaTablette | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    const characterId = texte(p.characterId, 200);
    const titre = texte(p.titre, 120);
    const totalDisplay = texte(p.totalDisplay, 120);
    if (!characterId || !titre || !totalDisplay) return null;

    const rolls = Array.isArray(p.rolls)
        ? p.rolls.slice(0, 60).map(lireUnDe).filter((d): d is DieResult => d !== null)
        : [];
    const degre = DEGRES_DE_REUSSITE.includes(p.degre as DegreDeReussite) ? p.degre as DegreDeReussite : undefined;

    return {
        characterId,
        titre,
        resultat: {
            total: nombre(p.total) ?? 0,
            rolls,
            modifier: nombre(p.modifier) ?? 0,
            totalDisplay,
            ...(nombre(p.successes) !== undefined ? { successes: nombre(p.successes) } : {}),
            ...(booleen(p.tagSuccess) !== undefined ? { tagSuccess: booleen(p.tagSuccess) } : {}),
            ...(degre ? { degre } : {}),
        },
    };
}
