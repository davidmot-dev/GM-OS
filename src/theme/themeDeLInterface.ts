/**
 * **L'unique table des thèmes de l'interface, et l'unique écrivain des variables.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Les quatre thèmes étaient déclarés **DEUX fois**, par deux tables qui se
 * contredisaient : `THEME_PALETTES` dans `useSessionStore.ts` et les blocs
 * `:root[data-theme=…]` d'`index.css`. Aucune n'était jamais visiblement fausse,
 * parce que **chacune n'était lue que pour une moitié d'elle-même** :
 *
 * - la table **JS** gagnait sur `accent`, `bg`, `surface`, `border` et la police
 *   de titre — `Shell` les posait en style **inline**, et un style inline bat
 *   toujours une règle `:root` ;
 * - la table **CSS** survivait là où elle était seule — `--app-text`,
 *   `--app-accent-glow`, `--app-accent-rgb`, les `--glass-*` et `--font-mono`.
 *
 * D'où le défaut que David voyait sans pouvoir le nommer : **la lueur ne suivait
 * pas l'accent.** En cyberpunk l'accent affiché valait `#06b6d4` (table JS) et
 * la lueur `rgba(34,211,238,.45)`, soit `#22d3ee` (table CSS) — deux couleurs
 * pour la même chose. Les tables se contredisaient jusque dans leur propre
 * incohérence : la lueur de `medieval` correspondait à l'accent **JS**, pas à
 * l'accent CSS de son propre bloc.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A ÉTÉ CONSERVÉ, ET POURQUOI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Les valeurs ci-dessous sont celles qu'on voyait à l'écran**, pas une
 * moyenne des deux tables : la réconciliation ne devait changer aucun pixel,
 * sinon elle aurait corrigé un défaut invisible en en créant un visible. On a
 * donc pris la table JS là où elle gagnait, la table CSS là où elle était seule.
 *
 * **Un seul changement d'apparence en découle, et c'est le correctif** : la
 * lueur et le `--app-accent-rgb` ne sont plus écrits à la main, ils sont
 * **dérivés de l'accent effectif**. Une valeur recopiée dans une table que
 * personne ne relit quand l'accent bouge finit toujours par mentir.
 *
 * Les `--glass-*` restent littéraux : ils sont teintés d'accent dans deux
 * thèmes et neutres dans les deux autres, donc c'est un choix de thème et non
 * une dérivée. *On ne généralise pas une règle sur la moitié des cas.*
 */

import { tailleDeRacine, echelleDeTexte } from './editionDuTheme';
import { VARIABLE_DU_JETON } from './contratDuTheme';
import { accentsDeModule, ACCENTS_D_AUJOURD_HUI } from './accentsDeModule';
import { ORNEMENTS_DES_THEMES_DE_BASE, type Ornements, type Emplacement } from './ornements';
import { variablesDeLIcone, type IconesDuJeu } from './icones';
import { EMPLACEMENTS_D_ORNEMENT, NOMS_D_ICONES } from './contratDuTheme';

export type ThemeID = 'cyberpunk' | 'medieval' | 'modern' | 'claire';

/**
 * Ce qu'un thème de jeu apporte à l'arbitre, une fois lu et traduit.
 *
 * `variables` est le résultat du pont (`--app-*`), `jetons` le relevé brut du
 * SDK (`accent`, `bg`…) — on garde les deux parce que l'arbitrage de l'accent
 * a besoin du jeton, pas de la variable.
 */
export interface ThemeDuJeuApplique {
    variables: Record<string, string>;
    jetons: Record<string, string>;
    clarte?: 'dark' | 'light';
    /** Les ornements du jeu (§ 8), incorporés — sous l'interrupteur des personnalités. */
    ornements?: Ornements;
    /** Les icônes du jeu (§ 9, phase 6), incorporées — sous l'interrupteur des personnalités. */
    icones?: IconesDuJeu;
}

/**
 * **Un thème de base est un paquet de jetons du contrat** — décision D3 de la
 * refonte, posée le 2026-09-27 (phase 1, P1.1).
 *
 * *Un thème de base est le paquet par défaut ; un thème de jeu le surcharge —
 * un seul mécanisme.* Les jetons portent donc **les noms du cahier des
 * charges** (`bg`, `font-display`, `glass-bg`…) et passent par la même table
 * que ceux d'un jeu (`VARIABLE_DU_JETON`, dérivée du contrat). Avant, la
 * palette avait son propre vocabulaire (`policeTitre`, `verre.fond`) : chaque
 * échelle nouvelle se serait écrite deux fois.
 *
 * Les valeurs sont **celles d'aujourd'hui**, au caractère près — la garde
 * `apparenceDAujourdhui.test.ts` le vérifie.
 */
export interface ThemeDeBase {
    /**
     * Les jetons du contrat, sans le préfixe `--rpg-`. `accent` est l'accent
     * par défaut ; la main peut le surcharger — voir `appliquerLeTheme`.
     */
    jetons: Record<string, string>;
    /**
     * Ce que le thème demande aux contrôles natifs.
     *
     * Sans ça, les `<select>` d'un thème clair s'affichent en sombre : le
     * moteur ne devine pas la polarité d'une page, il faut la lui dire.
     */
    clarte: 'dark' | 'light';
    /** Le reflet du verre, `--glass-highlight` : il n'a pas de jeton dans le contrat. */
    reflet: string;
    /**
     * Le texte le plus estompé, `--app-text-subtle` (le `slate-500` d'aujourd'hui).
     *
     * Le contrat n'en a pas : un thème de jeu déclare `muted`, et le subtil s'en
     * **dérive** (`completerLesDerivees`). Un thème de base le pose en clair,
     * parce qu'il doit reproduire l'écran d'aujourd'hui au pixel près.
     */
    subtil: string;
    /**
     * **Comment la matière de fond se pose** (`texture-bg`) — ce que le contrat
     * ne dit pas : la taille du motif, sa position, son mode de fusion. Un
     * thème de jeu n'en a pas besoin (une tuile `url('matieres/…')` se répète à
     * sa taille), mais la grille du cyberpunk et le grain du médiéval d'hier, si.
     */
    matiere: { taille: string; position: string; fusion: string };
    /** Les pastilles proposées dans les réglages, pour surcharger l'accent à la main. */
    palettes: string[];
}

/*
  **Les couleurs de P1.2 — posées le 2026-09-29, à pixel constant.**

  Chaque valeur est celle que l'écran montre AUJOURD'HUI, pour que rien ne
  bouge tant qu'un composant n'emploie pas l'alias :
  - `muted` et `subtil`, les textes en `slate` 400 et 500 d'aujourd'hui ;
  - ⛔ **les valeurs de Tailwind 4, pas celles de Tailwind 3** : sa palette est
    écrite en `oklch` (`slate-400` = `oklch(70.4% .04 256.788)`, soit
    `#90a1b9`), et le `#94a3b8` qu'on connaît par cœur est celui de la v3. Le
    recopier aurait changé tout le texte secondaire en P1.3 ;
  - `accent-contrast`, le `text-app-bg` posé sur l'accent (86 emplois, contre
    62 textes en blanc) — donc le fond du thème ;
  - les états, les emerald, red, amber et sky 500 écrits en dur ;
  - `surface-2` n'a pas d'emploi : la surface éclaircie de 5 % vers le texte,
    **provisoire**, à juger avec les personnalités (P1.7).

  **Les matières de P1.5 (2026-09-29)** sont les règles `[data-theme=…]
  .bg-texture-overlay` d'`index.css`, déménagées ici. ⚠️ Leur opacité (1 pour la
  grille et la toile) dépasse le plafond que le contrat impose à un jeu (0,35) :
  ce plafond protège la lisibilité d'une matière **inconnue** ; celles-ci sont
  l'écran d'aujourd'hui, et leur couleur porte déjà sa transparence.
*/
export const PALETTES: Record<ThemeID, ThemeDeBase> = {
    cyberpunk: {
        jetons: {
            accent: '#06b6d4',
            bg: '#020617',
            surface: '#0f172a',
            border: '#1e293b',
            text: '#f8fafc',
            'font-display': '"Orbitron", "JetBrains Mono", sans-serif',
            'font-mono': "'JetBrains Mono', monospace",
            'glass-bg': 'rgba(2, 6, 23, 0.6)',
            'glass-border': 'rgba(34, 211, 238, 0.15)',
            muted: '#90a1b9',
            'surface-2': '#1b2235',
            'accent-contrast': '#020617',
            // § 4.2 · Les états — ceux que l'interface écrit en dur aujourd'hui (emerald, red, amber, sky 500).
            success: '#00bc7d',
            danger: '#fb2c36',
            warning: '#fe9a00',
            info: '#00a6f4',
            // § 7 · La grille d'hier (`index.css`, jusqu'au 2026-09-29), au caractère près.
            'texture-bg': 'linear-gradient(rgba(34, 211, 238, 0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(34, 211, 238, 0.2) 2px, transparent 2px)',
            'texture-opacity': '1',
        },
        clarte: 'dark',
        reflet: 'rgba(34, 211, 238, 0.25)',
        matiere: { taille: '80px 80px', position: 'center', fusion: 'normal' },
        subtil: '#62748e',
        palettes: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'],
    },

    medieval: {
        jetons: {
            accent: '#d4af37',
            bg: '#181411',
            surface: '#24201c',
            border: '#332c26',
            text: '#e7e5e4',
            'font-display': '"Cinzel", "MedievalSharp", serif',
            'font-mono': "'UnifrakturMaguntia', cursive",
            'glass-bg': 'rgba(28, 25, 23, 0.65)',
            'glass-border': 'rgba(217, 119, 6, 0.12)',
            muted: '#90a1b9',
            'surface-2': '#2e2a26',
            'accent-contrast': '#181411',
            // § 4.2 · Les états — ceux que l'interface écrit en dur aujourd'hui (emerald, red, amber, sky 500).
            success: '#00bc7d',
            danger: '#fb2c36',
            warning: '#fe9a00',
            info: '#00a6f4',
            // § 7 · Le grain de pierre d'hier, un bruit fractal en SVG.
            'texture-bg': `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            'texture-opacity': '0.12',
        },
        clarte: 'dark',
        reflet: 'rgba(217, 119, 6, 0.2)',
        matiere: { taille: '250px 250px', position: '0% 0%', fusion: 'soft-light' },
        subtil: '#62748e',
        palettes: ['#d4af37', '#b91c1c', '#7c2d12', '#4c1d95', '#1e40af'],
    },

    modern: {
        jetons: {
            accent: '#3b82f6',
            bg: '#0f172a',
            surface: '#1e293b',
            border: '#334155',
            text: '#f8fafc',
            'font-display': '"Outfit", "Inter", sans-serif',
            'font-mono': "'JetBrains Mono', monospace",
            'glass-bg': 'rgba(15, 23, 42, 0.5)',
            'glass-border': 'rgba(255, 255, 255, 0.1)',
            muted: '#90a1b9',
            'surface-2': '#293345',
            'accent-contrast': '#0f172a',
            // § 4.2 · Les états — ceux que l'interface écrit en dur aujourd'hui (emerald, red, amber, sky 500).
            success: '#00bc7d',
            danger: '#fb2c36',
            warning: '#fe9a00',
            info: '#00a6f4',
        },
        clarte: 'dark',
        reflet: 'rgba(255, 255, 255, 0.2)',
        // Pas de matière : le moderne n'en avait pas.
        matiere: { taille: 'auto', position: '0% 0%', fusion: 'normal' },
        subtil: '#62748e',
        palettes: ['#3b82f6', '#6366f1', '#14b8a6', '#f43f5e', '#64748b'],
    },

    claire: {
        jetons: {
            accent: '#c2410c',
            bg: '#fbfbf9',
            surface: '#ffffff',
            border: '#e7e5e4',
            text: '#2c2420',
            'font-display': '"Inter", sans-serif',
            // Son bloc CSS n'en déclarait pas : il héritait du `:root` de base.
            'font-mono': "'JetBrains Mono', monospace",
            'glass-bg': 'rgba(255, 255, 255, 0.6)',
            'glass-border': 'rgba(0, 0, 0, 0.08)',
            // Le thème clair ne montre pas de slate-400 : `index.css` le repeint en `--app-text`.
            muted: '#2c2420',
            'surface-2': '#f4f4f4',
            'accent-contrast': '#fbfbf9',
            // § 4.2 · Les états — ceux que l'interface écrit en dur aujourd'hui (emerald, red, amber, sky 500).
            success: '#00bc7d',
            danger: '#fb2c36',
            warning: '#fe9a00',
            info: '#00a6f4',
            // § 7 · La toile croisée d'hier.
            'texture-bg': 'repeating-linear-gradient(45deg, rgba(162, 120, 92, 0.15) 0px, rgba(162, 120, 92, 0.15) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(162, 120, 92, 0.15) 0px, rgba(162, 120, 92, 0.15) 1px, transparent 1px, transparent 10px)',
            'texture-opacity': '1',
        },
        clarte: 'light',
        reflet: 'rgba(255, 255, 255, 0.5)',
        // Comme `muted` : les règles `claire` d'`index.css` peignent slate-400 ET slate-500 en `--app-text`.
        subtil: '#2c2420',
        matiere: { taille: 'auto', position: '0% 0%', fusion: 'normal' },
        palettes: ['#c2410c', '#0f766e', '#7c3aed', '#b91c1c', '#1e40af'],
    },
};

/**
 * **Les personnalités — le deuxième jeu de paquets** (refonte, P1.7,
 * 2026-09-29).
 *
 * Les valeurs de Stitch, traduites en jetons du contrat à l'étape T2.3
 * (`documentation/Planning/stitch/personnalites/*.theme.css`) et recopiées
 * ici **au caractère près** — `electron/personnalites.test.ts` le vérifie.
 * Elles ne s'appliquent que si le meneur allume le réglage des Paramètres
 * (`personnalites`, décision de David du 2026-09-27) : un seul interrupteur
 * compare l'interface d'aujourd'hui et la nouvelle.
 *
 * ⚠️ **Le Médiéval et le Moderne deviennent des thèmes CLAIRS** (parchemin,
 * cartes blanches) dans un cadre sombre. Le reste de l'interface écrit encore
 * ses couleurs en dur pour un fond sombre : ils héritent donc, sous
 * l'interrupteur, des règles de rattrapage du thème clair (`index.css`).
 *
 * Ce qui n'est pas dans le contrat : `subtil` suit la règle des jeux (le
 * `muted` fondu à 70 % dans le fond), le reflet du verre suit le thème, et
 * **les pastilles d'accent sont revues pour le nouveau fond** — le Médiéval
 * d'aujourd'hui en avait quatre illisibles (T0.3).
 */
export const PERSONNALITES: Record<ThemeID, ThemeDeBase> = {
    cyberpunk: {
        jetons: {
            bg: '#020617',
            surface: '#060c1a',
            'surface-2': '#0d162d',
            text: '#e2e8f0',
            muted: '#94a3b8',
            accent: '#00f0ff',
            'accent-contrast': '#020617',
            border: 'rgba(0, 240, 255, 0.22)',
            'border-soft': 'rgba(255, 255, 255, 0.08)',
            success: '#10b981',
            danger: '#ff007f',
            warning: '#facc15',
            info: '#3b82f6',
            'font-display': '"Orbitron", "Inter", sans-serif',
            'font-body': '"Inter", sans-serif',
            'font-mono': '"JetBrains Mono", monospace',
            'title-tracking': '0.08em',
            'kicker-tracking': '0.14em',
            'title-transform': 'uppercase',
            'radius-sm': '0px',
            'radius-md': '0px',
            'radius-lg': '0px',
            'border-width': '1px',
            'border-style': 'solid',
            'elevation-1': 'none',
            'elevation-2': '0 4px 20px rgba(0, 0, 0, 0.6)',
            'elevation-3': '0 0 0 1px #020617, 0 8px 32px rgba(0, 0, 0, 0.85)',
            glow: 'rgba(0, 240, 255, 0.35)',
            'glow-strength': '0.8',
            'glass-bg': 'rgba(8, 15, 30, 0.72)',
            'glass-border': 'rgba(0, 240, 255, 0.22)',
            'glass-blur': '16px',
            'texture-bg': 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.35) 0px, rgba(0, 0, 0, 0.35) 2px, transparent 2px, transparent 4px)',
            'texture-panel': 'radial-gradient(rgba(0, 240, 255, 0.15) 1px, transparent 1px)',
            'texture-opacity': '0.3',
        },
        clarte: 'dark',
        reflet: 'rgba(0, 240, 255, 0.25)',
        subtil: 'color-mix(in srgb, #94a3b8 70%, #020617)',
        matiere: { taille: 'auto', position: '0% 0%', fusion: 'normal' },
        palettes: ['#00f0ff', '#a78bfa', '#f472b6', '#34d399', '#fb923c'],
    },
    medieval: {
        jetons: {
            bg: '#dfcfb2',
            surface: '#f7f2e7',
            'surface-2': '#ebe0ca',
            text: '#1b1108',
            muted: '#5c4a38',
            accent: '#7a5c20',
            'accent-contrast': '#f7f2e7',
            border: '#7c5c3b',
            'border-soft': 'rgba(122, 92, 32, 0.25)',
            success: '#1b6342',
            danger: '#8f1d1d',
            warning: '#b04f00',
            info: '#3d3a82',
            'font-display': '"Cinzel", "EB Garamond", serif',
            'font-body': '"EB Garamond", "Georgia", serif',
            'font-mono': '"Cinzel", "EB Garamond", serif',
            'title-tracking': '0.06em',
            'kicker-tracking': '0.12em',
            'title-transform': 'uppercase',
            'radius-sm': '2px',
            'radius-md': '2px',
            'radius-lg': '2px',
            'border-width': '1px',
            'border-style': 'solid',
            'elevation-1': 'inset 0 0 0 1px #d6c4a5, 0 3px 10px rgba(28, 17, 8, 0.18)',
            'elevation-2': '0 10px 24px rgba(28, 17, 8, 0.28)',
            'elevation-3': '0 25px 50px -12px rgba(28, 17, 8, 0.45)',
            glow: 'none',
            'glow-strength': '0',
            'glass-bg': 'rgba(247, 242, 231, 0.94)',
            'glass-border': 'rgba(124, 92, 59, 0.45)',
            'glass-blur': '0px',
            'frame-bg': '#160e07',
            'frame-text': '#e5d5b8',
            'frame-accent': '#d4af37',
            'texture-bg': 'radial-gradient(circle at 50% 30%, rgba(255, 250, 240, 0.45) 0%, transparent 70%), radial-gradient(circle at 15% 85%, rgba(180, 150, 100, 0.25) 0%, transparent 60%), repeating-linear-gradient(0deg, rgba(60, 42, 26, 0.03) 0px, rgba(60, 42, 26, 0.03) 1px, transparent 1px, transparent 4px)',
            'texture-panel': 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.6) 0%, rgba(235, 222, 198, 0.5) 100%)',
            'texture-opacity': '0.35',
        },
        clarte: 'light',
        reflet: 'rgba(255, 250, 240, 0.5)',
        subtil: 'color-mix(in srgb, #5c4a38 70%, #dfcfb2)',
        matiere: { taille: 'auto', position: '0% 0%', fusion: 'normal' },
        palettes: ['#7a5c20', '#7f1d1d', '#1e3a8a', '#4c1d95', '#14532d'],
    },
    modern: {
        jetons: {
            bg: '#e9eef5',
            surface: '#ffffff',
            'surface-2': '#f8fafc',
            text: '#0f172a',
            muted: '#475569',
            accent: '#1d4ed8',
            'accent-contrast': '#ffffff',
            border: '#e2e8f0',
            'border-soft': 'rgba(15, 23, 42, 0.08)',
            success: '#047857',
            danger: '#b91c1c',
            warning: '#a16207',
            info: '#6d28d9',
            'font-display': '"Plus Jakarta Sans", sans-serif',
            'font-body': '"Plus Jakarta Sans", sans-serif',
            'font-mono': '"JetBrains Mono", monospace',
            'title-tracking': '0em',
            'kicker-tracking': '0.06em',
            'title-transform': 'none',
            'radius-sm': '6px',
            'radius-md': '12px',
            'radius-lg': '14px',
            'border-width': '1px',
            'border-style': 'solid',
            'elevation-1': '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
            'elevation-2': '0 10px 30px -6px rgba(15, 23, 42, 0.16)',
            'elevation-3': '0 24px 48px -12px rgba(15, 23, 42, 0.28)',
            glow: 'rgba(37, 99, 235, 0.25)',
            'glow-strength': '0.3',
            'glass-bg': 'rgba(255, 255, 255, 0.85)',
            'glass-border': 'rgba(15, 23, 42, 0.08)',
            'glass-blur': '12px',
            'frame-bg': '#0b1120',
            'frame-text': '#e2e8f0',
            'frame-accent': '#60a5fa',
            'texture-bg': 'none',
            'texture-panel': 'none',
            'texture-opacity': '0',
        },
        clarte: 'light',
        reflet: 'rgba(255, 255, 255, 0.6)',
        subtil: 'color-mix(in srgb, #475569 70%, #e9eef5)',
        matiere: { taille: 'auto', position: '0% 0%', fusion: 'normal' },
        palettes: ['#1d4ed8', '#4338ca', '#0f766e', '#be123c', '#475569'],
    },
    claire: {
        jetons: {
            bg: '#f8fafc',
            surface: '#ffffff',
            'surface-2': '#f1f5f9',
            text: '#0f172a',
            muted: '#475569',
            accent: '#1d4ed8',
            'accent-contrast': '#ffffff',
            border: '#e2e8f0',
            'border-soft': 'rgba(15, 23, 42, 0.08)',
            success: '#047857',
            danger: '#b91c1c',
            warning: '#a16207',
            info: '#0369a1',
            'font-display': '"Inter", sans-serif',
            'font-body': '"Inter", sans-serif',
            'font-mono': '"JetBrains Mono", monospace',
            'title-tracking': '0em',
            'kicker-tracking': '0.08em',
            'title-transform': 'none',
            'radius-sm': '6px',
            'radius-md': '8px',
            'radius-lg': '14px',
            'border-width': '1px',
            'border-style': 'solid',
            'elevation-1': '0 1px 2px rgba(15, 23, 42, 0.06)',
            'elevation-2': '0 4px 12px rgba(15, 23, 42, 0.10)',
            'elevation-3': '0 16px 40px rgba(15, 23, 42, 0.18)',
            glow: 'none',
            'glow-strength': '0',
            'glass-bg': 'rgba(255, 255, 255, 0.92)',
            'glass-border': 'rgba(15, 23, 42, 0.10)',
            'glass-blur': '8px',
            'texture-bg': 'none',
            'texture-panel': 'none',
            'texture-opacity': '0',
        },
        clarte: 'light',
        reflet: 'rgba(255, 255, 255, 0.5)',
        subtil: 'color-mix(in srgb, #475569 70%, #f8fafc)',
        matiere: { taille: 'auto', position: '0% 0%', fusion: 'normal' },
        palettes: ['#1d4ed8', '#0f766e', '#7c3aed', '#b91c1c', '#c2410c'],
    },
};

/** Le thème de base qui porte ce nom ; un identifiant inconnu retombe sur cyberpunk. */
export function themeDeBase(theme: string, personnalites = false): ThemeDeBase {
    const table = personnalites ? PERSONNALITES : PALETTES;
    return table[theme as ThemeID] ?? table.cyberpunk;
}

/** L'accent par défaut d'un thème de base — ce que `setTheme` pose, et ce qu'une surcharge « héritée » vaut. */
export function accentDuTheme(theme: string): string {
    return themeDeBase(theme).jetons.accent;
}

/**
 * `#rrggbb` → `"r, g, b"`, la forme qu'attend `--app-accent-rgb`.
 *
 * Rend `null` sur ce qu'elle ne sait pas lire — une couleur nommée, un `rgb()`,
 * une saisie en cours. L'appelant garde alors la valeur précédente plutôt que
 * d'écrire `NaN, NaN, NaN`, qui casserait toutes les transparences d'un coup.
 */
export function composantesRVB(hex: string): string | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/**
 * Les variables d'un thème de base, prêtes à poser.
 *
 * Les jetons passent par **la table du contrat** (`VARIABLE_DU_JETON`) : un
 * jeton ajouté au paquet d'un thème de base, et qui a sa variable dans le
 * contrat, atteint l'écran sans une ligne de plus ici.
 */
/** L'opacité du halo : le jeton borné de 0 à 1, ou 0,45 s'il est absent ou illisible. */
function forceDuHalo(jeton: string | undefined): number {
    const n = jeton === undefined ? NaN : Number(jeton);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.45;
}

export function variablesDuTheme(
    theme: ThemeDeBase,
    accentEffectif: string,
): Record<string, string> {
    const rvb = composantesRVB(accentEffectif);

    const vars: Record<string, string> = {};
    for (const [jeton, valeur] of Object.entries(theme.jetons)) {
        const variable = VARIABLE_DU_JETON[jeton];
        if (variable) vars[variable] = valeur;
    }
    vars['--app-accent'] = accentEffectif;
    vars['--glass-highlight'] = theme.reflet;
    vars['--app-text-subtle'] = theme.subtil;
    vars['--texture-taille'] = theme.matiere.taille;
    vars['--texture-position'] = theme.matiere.position;
    vars['--texture-fusion'] = theme.matiere.fusion;
    /*
      **La bordure douce est la bordure à moitié** — ce que `border-app-border/50`
      rend aujourd'hui, au même `color-mix` près (celui qu'écrit Tailwind 4). Par
      la variable et non par la valeur : un jeu qui change `border` l'emmène.
    */
    if (!theme.jetons['border-soft']) {
        vars['--app-border-soft'] = 'color-mix(in oklab, var(--app-border) 50%, transparent)';
    }
    // § 4.6 : l'ancienne ombre unique sert d'élévation 2 quand celle-ci manque.
    if (theme.jetons.shadow && !theme.jetons['elevation-2']) {
        vars['--elev-2'] = theme.jetons.shadow;
    }

    /*
      **Dérivées, et seulement quand l'accent est lisible.** Une couleur qu'on
      n'a pas su décomposer laisse les deux variables intactes : mieux vaut une
      lueur d'un instant en retard qu'une lueur transparente sur toute
      l'interface.

      Le halo déclaré par le thème (`glow`) passe devant ; sinon il se dérive
      de l'accent, à la force du thème (`glow-strength`), 0,45 par défaut —
      l'écran d'aujourd'hui.
    */
    if (rvb) {
        vars['--app-accent-rgb'] = rvb;
        if (!theme.jetons.glow) {
            vars['--app-accent-glow'] = `rgba(${rvb}, ${forceDuHalo(theme.jetons['glow-strength'])})`;
        }
    }

    return vars;
}

/**
 * **L'unique endroit qui écrit le thème sur le document.**
 *
 * Avant, ils étaient deux : `main.tsx` posait `data-theme` au démarrage, et
 * l'effet de `Shell` reposait l'attribut **plus** cinq variables en inline. Deux
 * écrivains pour une même vérité, c'est le motif que ce projet paie tous les
 * jours — et ici il avait un coût précis : le style inline de `Shell` battait
 * toute règle de feuille, donc **aucune CSS de thème ne pouvait plus rien dire**
 * sur la police ni sur les couleurs.
 *
 * C'est la condition du chargement des thèmes par jeu (`systems/<jeu>/theme/`) :
 * une CSS injectée n'a d'effet que si personne ne la court-circuite en inline.
 *
 * @param theme  le thème choisi ; un identifiant inconnu retombe sur cyberpunk
 * @param accentSurcharge  l'accent choisi à la main, s'il y en a un
 */
/*
  L'échelle de texte est lue par `editionDuTheme`, qui la borne et la traduit en
  pourcentage. Import de type-valeur, sans cycle : ce module-là ne connaît
  personne.
*/
export function appliquerLeTheme(
    theme: string,
    accentSurcharge?: string,
    jeu?: ThemeDuJeuApplique,
    { personnalites = false }: { personnalites?: boolean } = {},
): void {
    if (typeof document === 'undefined') return;

    const palette = themeDeBase(theme, personnalites);
    const racine = document.documentElement;

    /*
      **« Le jeu gagne, la main surcharge » — décision du plan du 2026-08-23.**

      Le piège : `setTheme` réinitialise `themeColor` sur l'accent du thème, si
      bien qu'une surcharge est TOUJOURS présente. La prendre au mot ferait
      perdre au jeu son accent à tous les coups, et la décision « le jeu gagne »
      s'inverserait en silence — exactement ce que le plan redoutait pour
      `LayoutConfig`.

      On distingue donc **choisi** et **hérité** sans rien stocker de plus : une
      surcharge égale à l'accent du thème est héritée, le jeu passe devant ; une
      surcharge différente a été posée à la main, elle passe devant le jeu.
    */
    // `|| undefined` et non `?.trim()` seul : `??` ne traverse pas la chaîne
    // vide, et une surcharge blanche donnerait alors un accent vide.
    const surcharge = accentSurcharge?.trim() || undefined;
    /*
      **Deux accents hérités sous les personnalités** (P1.7) : `setTheme` pose
      toujours celui d'aujourd'hui dans `themeColor`. Le prendre pour un choix
      de la main ferait garder l'or du Médiéval d'aujourd'hui sur le parchemin de
      sa personnalité — 1,9 de contraste.
    */
    const choisieALaMain = !!surcharge
        && surcharge !== palette.jetons.accent
        && surcharge !== accentDuTheme(theme);
    const accent = choisieALaMain
        ? surcharge
        : jeu?.jetons.accent ?? palette.jetons.accent;

    racine.setAttribute('data-theme', theme);
    /*
      **Les marques de la racine, pour les feuilles de style** (P1.7) :
      `data-personnalites` quand l'interrupteur est allumé, `data-clarte` pour
      la polarité affichée, `data-cadre` quand le cadre a sa propre couleur. Les
      règles de rattrapage des thèmes clairs et le cadre plein s'y accrochent.
    */
    racine.toggleAttribute('data-personnalites', personnalites);
    racine.setAttribute('data-clarte', jeu?.clarte ?? palette.clarte);
    /*
      **La polarité du jeu l'emporte, et il faut qu'elle l'emporte.** Star Trek
      est un thème clair : servi sous un `color-scheme: dark`, ses `<select>`
      natifs et ses champs s'afficheraient en sombre sur son papier blanc.
    */
    racine.style.colorScheme = jeu?.clarte ?? palette.clarte;

    /*
      **Un jeu sans cadre ne garde pas celui du thème de base** — 2026-09-29,
      trouvé en capturant chaque campagne sous chaque thème : Alien, sous la
      personnalité médiévale, s'affichait dans un cadre de bois. Le jeu impose
      ses couleurs ; le cadre suit alors les siennes (§ 4.8 : absent, il vaut
      `bg`, `text` et `accent` — ceux du jeu).
    */
    const socle = variablesDuTheme(palette, accent);
    const cadreDuJeu = !!jeu?.variables['--app-frame-bg'];
    if (jeu && !cadreDuJeu) {
        delete socle['--app-frame-bg'];
        delete socle['--app-frame-text'];
        delete socle['--app-frame-accent'];
    }
    /*
      **Un jeu d'une autre polarité n'hérite ni du verre ni de la matière du
      thème de base** — 2026-09-29, même capture : sous Clair, Alien posait ses
      cartes sur le verre blanc à 60 % du thème clair, et sa toile brune sur un
      fond noir. Ce que la base a choisi pour SON fond ne vaut pas pour l'autre
      polarité. Le verre se dérive alors des couleurs du jeu ; la matière
      disparaît (celle du jeu, s'il en a une, arrive par le pont sous les
      personnalités).
    */
    if (jeu?.clarte && jeu.clarte !== palette.clarte) {
        const fondDuJeu = jeu.variables['--app-bg'] ?? socle['--app-bg'];
        const texteDuJeu = jeu.variables['--app-text'] ?? socle['--app-text'];
        socle['--glass-bg'] = `color-mix(in srgb, ${fondDuJeu} 60%, transparent)`;
        socle['--glass-border'] = `color-mix(in srgb, ${texteDuJeu} 10%, transparent)`;
        socle['--glass-highlight'] = `color-mix(in srgb, ${texteDuJeu} 18%, transparent)`;
        delete socle['--texture-fond'];
        delete socle['--texture-opacite'];
        /*
          **La deuxième surface et le texte sur l'accent suivent le jeu** (P3.9,
          2026-09-30) : la vitrine du socle montrait des tuiles bleu nuit sur le
          papier ivoire de Cthulhu Hack — la `surface-2` du Cyberpunk. Un jeu
          qui les déclare passe devant (le pont) ; sinon, sa surface et son fond.
        */
        socle['--app-surface-2'] = jeu.variables['--app-surface'] ?? socle['--app-surface'];
        socle['--app-accent-contrast'] = fondDuJeu;
        delete socle['--texture-panneau'];
    }

    const vars = completerLesDerivees({
        // Le socle : la palette d'atelier, l'accent arbitré, et ses dérivées.
        ...socle,
        /*
          Le jeu recouvre — mais **seulement ce qu'il déclare** : un thème
          partiel laisse le thème d'atelier combler le reste, au lieu d'effacer
          ce qui marchait. Et jamais l'accent, qui vient d'être arbitré.
        */
        ...retirerLAccent(jeu?.variables),
    }, jeu?.variables['--app-text-muted']);

    /*
      **Sous l'interrupteur des personnalités** (contrat v1.4, P1.6 — éteint
      jusqu'à P1.7, décision de David du 2026-09-29). Éteint, rien de ceci ne
      s'écrit, et la boucle d'effacement plus bas retire ce qu'un passage
      allumé aurait laissé.
    */
    if (personnalites) {
        /*
          **Les ornements** (§ 8, P3.1) : ceux du jeu s'il y en a un, sinon ceux
          de la personnalité. Jamais un mélange : les coins en laiton du Médiéval
          autour d'Alien seraient le défaut du cadre de bois, rejoué.
        */
        const ornements: Ornements = jeu ? (jeu.ornements ?? {}) : (ORNEMENTS_DES_THEMES_DE_BASE[theme] ?? {});
        for (const [emplacement, adresse] of Object.entries(ornements)) {
            vars[`--orne-${emplacement}`] = adresse;
            vars[`--orne-${emplacement}-affichage`] = 'block';
        }
        /*
          **Les icônes du jeu** (§ 9, phase 6) : chacune pose son dessin, s'affiche,
          et efface l'icône de GM-OS — `<Icone>` lit ces trois variables. Les
          thèmes de base n'en ont pas : leurs icônes sont celles de GM-OS.
        */
        for (const [nom, adresse] of Object.entries(jeu?.icones ?? {})) {
            if (!adresse) continue;
            const [dessin, affichage, repli] = variablesDeLIcone(nom);
            vars[dessin] = adresse;
            vars[affichage] = 'inline-block';
            vars[repli] = 'none';
        }
        // R7 : les accents de module suivent l'accent effectif et le fond affiché.
        const modules = accentsDeModule(accent, vars['--app-bg']);
        if (modules) {
            for (const [module, couleur] of Object.entries(modules)) vars[`--gm-${module}`] = couleur;
        }
        if (jeu) {
            /*
              « La main surcharge » vaut pour le halo, qui est l'ombre de
              l'accent : un halo fixe du jeu à côté d'un accent choisi à la main
              serait deux couleurs pour une même chose — le défaut du 2026-08-24.
            */
            const rvb = composantesRVB(accent);
            const haloDuJeu = !!jeu.jetons.glow && !choisieALaMain;
            if (rvb && !haloDuJeu && (choisieALaMain || jeu.jetons['glow-strength'] !== undefined)) {
                vars['--app-accent-glow'] = `rgba(${rvb}, ${forceDuHalo(jeu.jetons['glow-strength'])})`;
            }
            // Une matière de jeu se pose à sa taille : la pose du thème de base ne la concerne pas.
            if (jeu.variables['--texture-fond']) {
                vars['--texture-taille'] = 'auto';
                vars['--texture-position'] = '0% 0%';
                vars['--texture-fusion'] = 'normal';
            }
        }
    }

    /*
      **Le verre des colonnes suit la surface du jeu** — trouvé par David le
      2026-09-29 : *« pour Dune, la colonne sombre ne va pas avec le reste »*.
      `.premium-glass` (la colonne de la campagne, treize emplois) posait une
      ardoise à 45 % écrite en dur : invisible sur le noir de Blade Runner et
      d'Alien, bleue sur le brun de Dune. Sans jeu, l'ardoise d'aujourd'hui
      reste, en repli dans `index.css`.
    */
    if (jeu?.variables['--app-surface']) {
        vars['--verre-premium'] = `color-mix(in srgb, ${jeu.variables['--app-surface']} 45%, transparent)`;
    }

    for (const [nom, valeur] of Object.entries(vars)) {
        racine.style.setProperty(nom, valeur);
    }
    // § 4.8 : un cadre déclaré est opaque — `index.css` le peint plein (`.cadre-gmos`).
    racine.toggleAttribute('data-cadre', jeu ? cadreDuJeu : !!palette.jetons['frame-bg']);
    /*
      **Ce que le thème ne déclare plus s'efface** — P1.4, 2026-09-29.

      Les rayons, les élévations, la police du corps n'ont de valeur que si un
      thème en déclare : absents, la feuille retombe sur Tailwind. Mais un
      style posé reste posé — quitter un thème qui avait des rayons les
      laisserait à l'écran. *Ne rien dire doit laisser la même page que
      n'avoir jamais rien dit* : la règle des bandes de taille, plus bas.
    */
    for (const variable of VARIABLES_EFFACABLES) {
        if (!(variable in vars)) racine.style.removeProperty(variable);
    }

    /*
      **L'échelle de texte du jeu — extension GM-OS, posée le 2026-09-03.**

      *Demandée par David avec l'atelier de thème :* le SDK ne porte aucune
      taille, et un jeu doit pouvoir grossir son texte.

      Elle ne passe pas par une variable : c'est `font-size` sur la racine qui
      décide de ce que vaut un `rem`, et tout GM-OS est écrit en `rem`. ⚠️ Elle
      **multiplie** la base de 85 % d'`index.css` — la remplacer par « 100 % »
      grossirait toute l'interface de 18 % sans que personne ne l'ait demandé.

      Un thème qui n'en déclare pas vide le style au lieu d'écrire une valeur :
      *ne rien dire et dire « échelle 1 » doivent laisser la même page.*
    */
    racine.style.fontSize = tailleDeRacine(jeu?.jetons['font-scale']) ?? '';

    /*
      **Les quatre bandes de taille** — posées le 2026-09-05.

      Elles ne touchent pas à la racine : chaque palier de l'échelle les
      multiplie lui-même (voir le bloc en tête d'`index.css`). On écrit donc un
      **nombre**, pas une taille.

      *Effacer plutôt qu'écrire « 1 »* : une variable absente retombe sur le
      défaut déclaré dans `index.css`, et **ne rien dire doit laisser la même
      page que dire « échelle 1 »**. C'est la règle que suit déjà la ligne
      au-dessus.
    */
    for (const [jeton, variable] of BANDES_DE_TAILLE) {
        const facteur = echelleDeTexte(jeu?.jetons[jeton]);
        if (facteur === null) racine.style.removeProperty(variable);
        else racine.style.setProperty(variable, String(facteur));
    }
}

/** Tout ce qu'un thème peut cesser de déclarer : les variables du contrat, et les accents de module. */
const VARIABLES_EFFACABLES = new Set([
    ...Object.values(VARIABLE_DU_JETON),
    ...(EMPLACEMENTS_D_ORNEMENT as readonly Emplacement[]).flatMap(e => [`--orne-${e}`, `--orne-${e}-affichage`]),
    ...NOMS_D_ICONES.flatMap(i => variablesDeLIcone(i.nom)),
    '--verre-premium',
    ...Object.keys(ACCENTS_D_AUJOURD_HUI).map(m => `--gm-${m}`),
]);

/**
 * Les quatre bandes réglables, et la variable CSS que chacune pilote.
 *
 * **Une seule table**, parce qu'un jeton écrit d'un côté et lu de l'autre est
 * exactement l'asymétrie que ce dépôt a payée trois fois cette semaine.
 */
const BANDES_DE_TAILLE: readonly (readonly [string, string])[] = [
    ['scale-interface', '--echelle-interface'],
    ['scale-corps', '--echelle-corps'],
    ['scale-titres', '--echelle-titres'],
    ['scale-mono', '--echelle-mono'],
];

/**
 * **Ce qui se dérive une fois le jeu posé sur le thème de base** — P1.2, 2026-09-29.
 *
 * Après la fusion, et pas avant : le fond qu'on mélange est celui qui
 * s'affiche, celui du jeu s'il en déclare un.
 *
 * - **Le texte subtil** : un jeu déclare `muted`, pas de subtil. Il le suit
 *   alors, fondu à 70 % dans le fond — la proportion qui mène du slate-400 au
 *   slate-500 sur le fond de cyberpunk. Sans `muted` du jeu, celui du thème de
 *   base reste.
 * - **Le cadre** (§ 4.8), la barre latérale et le bandeau : absent, il vaut
 *   `bg`, `text` et l'accent arbitré — l'écran d'aujourd'hui. Son texte estompé
 *   se dérive **seulement s'il est déclaré** : sinon c'est celui du reste de
 *   l'interface, et la barre latérale ne changera pas le jour où ses
 *   `text-slate-400` deviendront `text-app-muted` (P1.3).
 *
 * `Shell.tsx` lit les `--app-frame-*` : ils sont donc **toujours** écrits.
 */
export function completerLesDerivees(
    vars: Record<string, string>,
    mutedDuJeu?: string,
): Record<string, string> {
    const v = { ...vars };
    if (mutedDuJeu) v['--app-text-subtle'] = `color-mix(in srgb, ${mutedDuJeu} 70%, ${v['--app-bg']})`;
    /*
      **`glow: none` éteint le halo** (§ 4.6). `none` n'est pas une couleur :
      posé tel quel, il invaliderait chaque `box-shadow` qui le lit. Traduit ici,
      après la fusion, pour le thème de base comme pour le jeu.
    */
    if (v['--app-accent-glow']?.trim() === 'none') v['--app-accent-glow'] = 'transparent';

    const cadreDeclare = v['--app-frame-bg'] !== undefined || v['--app-frame-text'] !== undefined;
    const fond = v['--app-frame-bg'] ??= v['--app-bg'];
    const texte = v['--app-frame-text'] ??= v['--app-text'];
    v['--app-frame-accent'] ??= v['--app-accent'];
    if (cadreDeclare) {
        v['--app-frame-muted'] = `color-mix(in srgb, ${texte} 65%, ${fond})`;
        v['--app-frame-subtle'] = `color-mix(in srgb, ${v['--app-frame-muted']} 70%, ${fond})`;
        /*
          **Et sa surface, et sa bordure** (P1.7) : ce qui est posé DANS le cadre
          — le contrôle du son du bandeau, les boutons d'outils de la barre —
          prenait la surface du contenu, des pavés de parchemin dans le bois.
          Le texte du cadre, fondu dans son fond.
        */
        v['--app-frame-surface'] = `color-mix(in srgb, ${texte} 8%, ${fond})`;
        v['--app-frame-border'] = `color-mix(in srgb, ${texte} 18%, ${fond})`;
    } else {
        v['--app-frame-muted'] = v['--app-text-muted'];
        v['--app-frame-subtle'] = v['--app-text-subtle'];
        v['--app-frame-surface'] = v['--app-surface'];
        v['--app-frame-border'] = v['--app-border'];
    }
    return v;
}

/**
 * **Le cadre, posé sur la barre latérale et le bandeau** (`Shell.tsx`).
 *
 * Ces deux éléments redéfinissent les variables de l'interface à partir de
 * celles du cadre : tout ce qu'ils contiennent suit, sans toucher un composant
 * de plus. Ce sont des **renvois** (`var(--app-frame-bg)`), jamais
 * `var(--app-bg)` sur `--app-bg` : une variable qui se cite elle-même est un
 * cycle, et le moteur l'invalide — tout le cadre perdrait ses couleurs.
 *
 * `--app-accent-rgb` et la lueur ne suivent pas : un cadre qui change d'accent
 * est l'affaire des personnalités (P1.7).
 */
export const STYLE_DU_CADRE = {
    '--app-bg': 'var(--app-frame-bg)',
    '--app-text': 'var(--app-frame-text)',
    '--app-accent': 'var(--app-frame-accent)',
    '--app-text-muted': 'var(--app-frame-muted)',
    '--app-text-subtle': 'var(--app-frame-subtle)',
    '--app-surface': 'var(--app-frame-surface)',
    '--app-border': 'var(--app-frame-border)',
} as const;

/**
 * Les variables d'un thème de jeu **sauf** l'accent, arbitré à part.
 *
 * Sans ce retrait, le pont réécrirait `--app-accent` après l'arbitrage et une
 * couleur choisie à la main serait perdue — alors même que le code juste
 * au-dessus vient de décider qu'elle devait gagner.
 */
function retirerLAccent(vars?: Record<string, string>): Record<string, string> {
    if (!vars) return {};
    const copie = { ...vars };
    delete copie['--app-accent'];
    return copie;
}
