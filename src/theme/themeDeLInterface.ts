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
  - `muted` et `subtil`, les `text-slate-400` et `text-slate-500` d'aujourd'hui ;
  - ⛔ **les valeurs de Tailwind 4, pas celles de Tailwind 3** : sa palette est
    écrite en `oklch` (`slate-400` = `oklch(70.4% .04 256.788)`, soit
    `#90a1b9`), et le `#94a3b8` qu'on connaît par cœur est celui de la v3. Le
    recopier aurait changé tout le texte secondaire en P1.3 ;
  - `accent-contrast`, le `text-app-bg` posé sur l'accent (86 emplois, contre
    62 `text-white`) — donc le fond du thème ;
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

    const vars = completerLesDerivees({
        // Le socle : la palette d'atelier, l'accent arbitré, et ses dérivées.
        ...variablesDuTheme(palette, accent),
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

    for (const [nom, valeur] of Object.entries(vars)) {
        racine.style.setProperty(nom, valeur);
    }
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
    } else {
        v['--app-frame-muted'] = v['--app-text-muted'];
        v['--app-frame-subtle'] = v['--app-text-subtle'];
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
