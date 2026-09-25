import { normaliser } from '../rules/canevas';

/**
 * **Un titre de livre tel qu'un meneur le lirait.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE DÉFAUT — « Anges de Feu », trouvé par David le 2026-09-25
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le PDF de *Fiery Angels* compose ses titres en capitales **espacées**, et son
 * texte extrait rend une espace entre chaque lettre — deux entre les mots :
 * `S TA R T I N G  S C E N E`, `### T H E  I N V E S T I G A T I O N`. Le
 * carnet a recopié ces titres « tels que le livre les écrit », comme on le lui
 * demande, et la trame a hérité d'actes illisibles, dièses Markdown compris.
 *
 * ⚠️ **La double espace est la seule trace des mots, et elle se perd vite.**
 * `cellule()` réduit toute suite d'espaces à une seule : après elle,
 * `S TA R T I N G S C E N E` ne se découpe plus. C'est pourquoi le nettoyage se
 * fait sur la cellule **brute** — et pourquoi, pour un titre déjà réduit, on ne
 * peut plus que recoller en un seul mot.
 *
 * Un titre ordinaire n'est pas touché : il faut au moins trois jetons, dont une
 * majorité d'une seule lettre, pour qu'un mot passe pour espacé. « A la claire
 * fontaine » n'en a qu'un sur quatre.
 */

const DIESES = /^\s*#+\s*/;

/** Un mot est-il composé de lettres espacées ? `E M PAT H Y` l'est — 4 sur 5. */
function estEspace(mot: string): boolean {
    const jetons = mot.split(' ').filter(Boolean);
    if (jetons.length < 3) return false;
    const seules = jetons.filter(j => [...j].length === 1).length;
    return seules / jetons.length >= 0.6;
}

/** `THE INVESTIGATION` → `The Investigation`. */
function casseDeTitre(texte: string): string {
    return texte.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_, avant: string, lettre: string) =>
        avant + lettre.toUpperCase());
}

export function titreLisible(brut: string): string {
    const sansDieses = brut.replace(DIESES, '').trim();
    const mots = sansDieses.split(/\s{2,}/);

    if (!mots.some(estEspace)) return sansDieses.replace(/\s+/g, ' ');

    const recolle = mots.map(m => (estEspace(m) ? m.split(' ').join('') : m.trim())).join(' ');

    /* Des capitales qui n'étaient que typographiques : le livre criait pour
       mettre en page, pas pour dire quelque chose. */
    return recolle === recolle.toUpperCase() && /\p{L}/u.test(recolle)
        ? casseDeTitre(recolle)
        : recolle;
}

/**
 * **Deux titres sont-ils le même, espaces mis à part ?**
 *
 * `S TA R T I N G S C E N E` — tel qu'il est en base, réduit par `cellule()` —
 * et `Starting Scene` désignent le même acte. Sans cette comparaison, reforger
 * la campagne créerait un second acte à côté du premier.
 */
export function memeTitreSansEspaces(a: string, b: string): boolean {
    const compact = (t: string) => normaliser(t.replace(DIESES, '')).replace(/ /g, '');
    const ca = compact(a);
    return !!ca && ca === compact(b);
}
