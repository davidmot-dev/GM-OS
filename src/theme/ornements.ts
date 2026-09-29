/**
 * **Les ornements** — refonte, phase 3, P3.1, 2026-09-30.
 *
 * Le § 8 du cahier des charges définit quatre emplacements — `entete`, `coin`,
 * `separateur`, `fond` — que le jeu remplit de SVG dessinés en
 * `currentColor`. Rien ne les lisait : Cthulhu Hack est le premier thème à en
 * livrer. Ce module les charge, les vérifie et les rend **incorporés**
 * (`data:`), comme les matières (P1.6) : un chemin relatif au dossier du thème,
 * posé sur le document, ne trouverait rien.
 *
 * GM-OS les pose en **masque** (`mask-image`) sur une couleur d'accent : c'est
 * ce qui accorde l'ornement au thème et au mode clair, comme le cahier le
 * promet. Le dessin donne la forme, jamais la couleur.
 */

import { EMPLACEMENTS_D_ORNEMENT, TAILLES_MAXIMALES } from './contratDuTheme';

export type Emplacement = 'entete' | 'coin' | 'separateur' | 'fond';
/** Chaque emplacement rempli, en adresse `data:` prête à poser. */
export type Ornements = Partial<Record<Emplacement, string>>;

/**
 * **Ce qui ne va pas dans un SVG**, selon le § 8 — liste vide s'il est sûr.
 *
 * Une seule vérification pour le validateur (qui refuse le thème) et pour le
 * chargeur (qui écarte l'ornement) : un fichier retouché après validation ne
 * passe pas pour autant.
 */
export function problemesDuSvg(svg: string): string[] {
    const problemes: string[] = [];
    if (!/<svg[^>]*\sviewBox\s*=/i.test(svg)) problemes.push('n\'a pas de `viewBox`.');
    if (!/currentColor/i.test(svg)) problemes.push('ne dessine pas en `currentColor` : GM-OS ne pourra pas l\'accorder à l\'accent.');
    if (/<script/i.test(svg)) problemes.push('contient un `<script>`.');
    if (/\son[a-z]+\s*=/i.test(svg)) problemes.push('contient un attribut `on…`.');
    if (/<foreignObject/i.test(svg)) problemes.push('contient un `<foreignObject>`.');
    for (const m of svg.matchAll(/\s(?:xlink:)?href\s*=\s*["']([^"']*)["']/gi)) {
        const cible = m[1].trim();
        if (!cible.startsWith('#') && !cible.startsWith('data:')) {
            problemes.push(`renvoie vers « ${cible} » : un SVG ne charge aucun autre fichier.`);
        }
    }
    return problemes;
}

/** Un SVG en adresse `data:`, prêt à poser en `mask-image`. */
export const enAdresse = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Un ornement du dossier `theme/` : `ornements/<nom>.svg`, sans sortir du dossier. */
const CHEMIN_D_ORNEMENT = /^ornements\/[\w.-]+\.svg$/;

/**
 * **Les ornements d'un thème de jeu**, lus et incorporés.
 *
 * Rend `{}` quand le jeu n'en a pas — le cas normal. Un ornement douteux
 * (chemin qui sort du dossier, SVG qui échoue au § 8, plus de 50 Ko) est
 * **écarté et dit**, jamais posé : *un absent silencieux, un incident bruyant.*
 */
export async function chargerLesOrnements(
    lire: (chemin: string) => Promise<string | null | undefined>,
    racine: string,
): Promise<Ornements> {
    const brut = await lire(`${racine}/theme/ornements.json`).catch(() => null);
    if (!brut) return {};

    let table: Record<string, unknown>;
    try {
        table = JSON.parse(brut);
    } catch {
        console.warn(`[Ornements] ${racine}/theme/ornements.json n'est pas du JSON valide : aucun ornement.`);
        return {};
    }

    const ornements: Ornements = {};
    for (const emplacement of EMPLACEMENTS_D_ORNEMENT as readonly Emplacement[]) {
        const chemin = table[emplacement];
        if (typeof chemin !== 'string') continue;
        if (!CHEMIN_D_ORNEMENT.test(chemin)) {
            console.warn(`[Ornements] ${emplacement} écarté : « ${chemin} » doit être ornements/<nom>.svg.`);
            continue;
        }
        const svg = await lire(`${racine}/theme/${chemin}`).catch(() => null);
        const problemes = svg ? problemesDuSvg(svg) : ['est introuvable.'];
        if (svg && svg.length > TAILLES_MAXIMALES.ornement) problemes.push(`pèse plus de ${TAILLES_MAXIMALES.ornement / 1024} Ko.`);
        if (problemes.length > 0) {
            console.warn(`[Ornements] ${emplacement} écarté : « ${chemin} » ${problemes.join(' ')}`);
            continue;
        }
        ornements[emplacement] = enAdresse(svg!);
    }
    return ornements;
}

/*
  **Les ornements des thèmes de base** — les personnalités de T2.3 : *« coins
  en laiton »* pour le Médiéval, *« coins coupés »* pour le Cyberpunk. Décision
  de David, 2026-09-30 : dessinés dès P3.1, pour éprouver le socle sur des
  ornements réels. Le Moderne et le Clair n'en ont pas : ils n'en demandaient
  pas.
*/
const COIN_EN_LAITON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-linecap="square"><path d="M2 26V2h24" stroke-width="2"/><path d="M7 21V7h14" stroke-width="1"/><circle cx="7" cy="7" r="2.2" fill="currentColor" stroke="none"/></g></svg>`;

const COIN_COUPE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-linecap="square"><path d="M1 14L14 1h17" stroke-width="2"/><path d="M1 14v17" stroke-width="2"/><path d="M5 18l4-4" stroke-width="1"/></g></svg>`;

export const ORNEMENTS_DES_THEMES_DE_BASE: Partial<Record<string, Ornements>> = {
    medieval: { coin: enAdresse(COIN_EN_LAITON) },
    cyberpunk: { coin: enAdresse(COIN_COUPE) },
};

/** Les sources des ornements de base, pour que les essais les passent au § 8 comme ceux d'un jeu. */
export const SVG_DES_THEMES_DE_BASE = { medieval: COIN_EN_LAITON, cyberpunk: COIN_COUPE } as const;
