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
    /** Les pastilles proposées dans les réglages, pour surcharger l'accent à la main. */
    palettes: string[];
}

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
        },
        clarte: 'dark',
        reflet: 'rgba(34, 211, 238, 0.25)',
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
        },
        clarte: 'dark',
        reflet: 'rgba(217, 119, 6, 0.2)',
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
        },
        clarte: 'dark',
        reflet: 'rgba(255, 255, 255, 0.2)',
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
        },
        clarte: 'light',
        reflet: 'rgba(255, 255, 255, 0.5)',
        palettes: ['#c2410c', '#0f766e', '#7c3aed', '#b91c1c', '#1e40af'],
    },
};

/** Le thème de base qui porte ce nom ; un identifiant inconnu retombe sur cyberpunk. */
export function themeDeBase(theme: string): ThemeDeBase {
    return PALETTES[theme as ThemeID] ?? PALETTES.cyberpunk;
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

    /*
      **Dérivées, et seulement quand l'accent est lisible.** Une couleur qu'on
      n'a pas su décomposer laisse les deux variables intactes : mieux vaut une
      lueur d'un instant en retard qu'une lueur transparente sur toute
      l'interface.
    */
    if (rvb) {
        vars['--app-accent-rgb'] = rvb;
        vars['--app-accent-glow'] = `rgba(${rvb}, 0.45)`;
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
): void {
    if (typeof document === 'undefined') return;

    const palette = themeDeBase(theme);
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
    const choisieALaMain = !!surcharge && surcharge !== palette.jetons.accent;
    const accent = choisieALaMain
        ? surcharge
        : jeu?.jetons.accent ?? surcharge ?? palette.jetons.accent;

    racine.setAttribute('data-theme', theme);
    /*
      **La polarité du jeu l'emporte, et il faut qu'elle l'emporte.** Star Trek
      est un thème clair : servi sous un `color-scheme: dark`, ses `<select>`
      natifs et ses champs s'afficheraient en sombre sur son papier blanc.
    */
    racine.style.colorScheme = jeu?.clarte ?? palette.clarte;

    const vars = {
        // Le socle : la palette d'atelier, l'accent arbitré, et ses dérivées.
        ...variablesDuTheme(palette, accent),
        /*
          Le jeu recouvre — mais **seulement ce qu'il déclare** : un thème
          partiel laisse le thème d'atelier combler le reste, au lieu d'effacer
          ce qui marchait. Et jamais l'accent, qui vient d'être arbitré.
        */
        ...retirerLAccent(jeu?.variables),
    };

    for (const [nom, valeur] of Object.entries(vars)) {
        racine.style.setProperty(nom, valeur);
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
