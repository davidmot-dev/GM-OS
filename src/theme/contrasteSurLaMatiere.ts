import { contraste } from './editionDuTheme';

/**
 * **T6.3 · Le texte reste lisible sur la matière** — phase 6 de la refonte,
 * 2026-10-03 (`documentation/Planning/2026-09-17-refonte-interface.md`, § 9).
 *
 * Le § 6 mesure le texte sur la **couleur** du fond. Mais une matière (§ 7) se
 * pose par-dessus, à `texture-opacity` : un trait clair sur un fond clair
 * rapproche le fond du texte sombre, et l'écart mesuré n'est plus celui que
 * l'œil voit.
 *
 * On ne rend pas la matière : on en relève **les encres** — les couleurs
 * qu'elle peut poser — et on mesure le texte sur le fond **au pire point**,
 * celui où l'encre la plus gênante est posée à pleine force. C'est une borne,
 * pas une moyenne : un trait d'un pixel sur quatre compte comme un aplat.
 *
 * *Un contrôle qui se trompe est pire qu'absent* : ce qu'on ne sait pas lire
 * (un bruit qui invente ses couleurs, une couleur nommée inconnue) est dit
 * **non mesurable**, jamais compté comme bon ni comme mauvais.
 */

/** Une couleur que la matière peut poser, et sa force propre (0 à 1). */
export interface Encre {
    couleur: string;
    alpha: number;
}

export interface EncresDeLaMatiere {
    encres: Encre[];
    /** Vrai quand une part de la matière échappe au relevé : le résultat ne couvre pas tout. */
    incomplet: boolean;
}

const deux = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
const hex = (r: number, v: number, b: number) => `#${deux(r)}${deux(v)}${deux(b)}`;

const NOMMEES: Record<string, string> = { white: '#ffffff', black: '#000000' };

/**
 * Une couleur CSS en `#rrggbb` et son alpha — `#rgb`, `#rrggbb`, `#rrggbbaa`,
 * `rgb()`, `rgba()`, `white`, `black`. `transparent` rend `null` (rien n'est
 * posé) ; le reste, `undefined` (inconnu).
 */
export function lireUneCouleur(valeur: string): Encre | null | undefined {
    const v = valeur.trim().toLowerCase();
    if (v === 'transparent' || v === 'none') return null;
    if (NOMMEES[v]) return { couleur: NOMMEES[v], alpha: 1 };
    const h = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v);
    if (h) {
        const brut = h[1].length === 3 ? h[1].split('').map(c => c + c).join('') : h[1];
        const alpha = brut.length === 8 ? parseInt(brut.slice(6), 16) / 255 : 1;
        return { couleur: `#${brut.slice(0, 6)}`, alpha };
    }
    const f = /^rgba?\(([^)]*)\)$/.exec(v);
    if (f) {
        const parts = f[1].split(/[\s,/]+/).filter(Boolean);
        if (parts.length < 3) return undefined;
        const [r, g, b] = parts.slice(0, 3).map(Number);
        if ([r, g, b].some(c => !Number.isFinite(c))) return undefined;
        const a = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? Number(parts[3].slice(0, -1)) / 100 : Number(parts[3]);
        return Number.isFinite(a) ? { couleur: hex(r, g, b), alpha: Math.min(1, Math.max(0, a)) } : undefined;
    }
    return undefined;
}

/** Les couleurs d'un texte CSS : `#…`, `rgb(…)`, `rgba(…)`, et les deux noms qu'on sait lire. */
const COULEUR_DANS_LE_TEXTE = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black|transparent)\b/gi;

/**
 * Les encres d'un dégradé CSS. Chaque couleur garde son alpha : un
 * `rgba(255, 255, 255, 0.08)` pose 8 % de blanc, pas du blanc.
 */
export function encresDuDegrade(valeur: string): EncresDeLaMatiere {
    const encres: Encre[] = [];
    let incomplet = false;
    for (const m of valeur.match(COULEUR_DANS_LE_TEXTE) ?? []) {
        const e = lireUneCouleur(m);
        if (e === undefined) incomplet = true;
        else if (e) encres.push(e);
    }
    return { encres, incomplet: incomplet || encres.length === 0 && !/transparent/i.test(valeur) };
}

/**
 * Les encres d'un SVG de matière.
 *
 * - `currentColor` vaut **noir** : un SVG posé en image de fond n'hérite pas
 *   de la couleur du texte de la page — c'est le noir initial qui s'applique.
 * - Chaque encre compte à **pleine force** : les `opacity` des éléments et les
 *   masques de bruit ne font que l'atténuer, et la borne doit tenir partout.
 * - Un bruit (`feTurbulence`) qui n'est pas ramené à une couleur du dessin
 *   (`SourceGraphic`) invente ses propres couleurs : non mesurable.
 */
export function encresDuSvg(svg: string): EncresDeLaMatiere {
    const encres: Encre[] = [];
    let incomplet = false;
    const valeurs = [
        ...[...svg.matchAll(/\b(?:fill|stroke|stop-color|flood-color)\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]),
        ...[...svg.matchAll(/\b(?:fill|stroke|stop-color|flood-color)\s*:\s*([^;"'}]+)/gi)].map(m => m[1]),
    ];
    for (const brute of valeurs) {
        const v = brute.trim();
        if (/^url\(/i.test(v)) continue;
        if (/^currentcolor$/i.test(v)) { encres.push({ couleur: '#000000', alpha: 1 }); continue; }
        const e = lireUneCouleur(v);
        if (e === undefined) incomplet = true;
        else if (e) encres.push({ couleur: e.couleur, alpha: 1 });
    }
    // Sans `fill`, une forme se peint en noir.
    if (/<(?:rect|path|circle|ellipse|polygon|polyline|text)\b/i.test(svg) && !/\bfill\s*[=:]/i.test(svg)) {
        encres.push({ couleur: '#000000', alpha: 1 });
    }
    if (/<feTurbulence\b/i.test(svg) && !/SourceGraphic/.test(svg)) incomplet = true;
    if (/<feImage\b/i.test(svg)) incomplet = true;
    return { encres, incomplet: incomplet || encres.length === 0 };
}

/** Le fond tel que l'œil le voit là où l'encre est posée, à l'opacité de la matière. */
export function fondSousLEncre(fond: string, encre: Encre, opacite: number): string | null {
    const f = lireUneCouleur(fond);
    if (!f) return null;
    const a = Math.min(1, Math.max(0, encre.alpha * opacite));
    const canal = (i: number) => {
        const x = parseInt(f.couleur.slice(1 + i * 2, 3 + i * 2), 16);
        const y = parseInt(encre.couleur.slice(1 + i * 2, 3 + i * 2), 16);
        return x * (1 - a) + y * a;
    };
    return hex(canal(0), canal(1), canal(2));
}

export interface PireContraste {
    ratio: number;
    /** Le fond au pire point, pour le dire dans le rapport. */
    fond: string;
}

/**
 * **Le contraste du texte au pire point de la matière** — le plus bas, sur le
 * fond nu et sous chaque encre. `null` si l'une des couleurs ne se lit pas.
 */
export function pireContraste(avant: string, fond: string, encres: Encre[], opacite: number): PireContraste | null {
    const nu = contraste(avant, fond);
    if (nu === null) return null;
    let pire: PireContraste = { ratio: nu, fond };
    for (const encre of encres) {
        const sous = fondSousLEncre(fond, encre, opacite);
        const ratio = sous ? contraste(avant, sous) : null;
        if (ratio !== null && ratio < pire.ratio) pire = { ratio, fond: sous! };
    }
    return pire;
}

/** L'opacité des matières (§ 7) : déclarée, sinon le plafond du contrat — la pire que le jeu puisse recevoir. */
export const OPACITE_MAXIMALE_DE_LA_MATIERE = 0.35;
