import { describe, it, expect, beforeEach } from 'vitest';
import {
    PALETTES,
    composantesRVB,
    variablesDuTheme,
    appliquerLeTheme,
    completerLesDerivees,
    facteurDuHalo,
    STYLE_DU_CADRE,
    PERSONNALITES,
    accentDuTheme,
    type ThemeID,
} from './themeDeLInterface';
import { VARIABLE_DU_JETON, JETONS_LUS_A_PART } from './contratDuTheme';
// @ts-expect-error — la configuration Tailwind est du JavaScript, sans déclaration de types.
import configTailwind from '../../tailwind.config.js';

/**
 * **La réconciliation des deux tables de thèmes — étape 1 de l'axe « thème par
 * jeu », faite le 2026-08-24.**
 *
 * Les quatre thèmes étaient déclarés deux fois, par `THEME_PALETTES` et par les
 * blocs `:root[data-theme=…]` d'`index.css`, qui se contredisaient. Chacune
 * n'était lue que pour une moitié d'elle-même, donc aucune n'était jamais
 * visiblement fausse.
 */

const THEMES: ThemeID[] = ['cyberpunk', 'medieval', 'modern', 'claire'];

describe('composantesRVB', () => {
    it('décompose un hexadécimal', () => {
        expect(composantesRVB('#06b6d4')).toBe('6, 182, 212');
        expect(composantesRVB('d4af37')).toBe('212, 175, 55');
        expect(composantesRVB('  #FFFFFF ')).toBe('255, 255, 255');
    });

    /**
     * Le sélecteur de couleur des réglages peut rendre une valeur en cours de
     * saisie. Écrire `NaN, NaN, NaN` rendrait TOUTES les transparences de
     * l'interface invisibles d'un coup — la lueur, mais aussi les bordures de
     * verre qui s'en servent.
     */
    it('rend null sur ce qu’elle ne sait pas lire, plutôt qu’un NaN', () => {
        for (const entree of ['', 'rouge', '#abc', 'rgb(1,2,3)', '#12345g']) {
            expect(composantesRVB(entree), entree).toBeNull();
        }
    });
});

describe('la table unique', () => {
    it('déclare les quatre thèmes en entier', () => {
        for (const t of THEMES) {
            const p = PALETTES[t];
            for (const cle of ['accent', 'bg', 'surface', 'border', 'text', 'font-display', 'font-mono', 'glass-bg', 'glass-border']) {
                expect(p.jetons[cle], `${t}.${cle}`).toBeTruthy();
            }
            expect(p.reflet, `${t}.reflet`).toBeTruthy();
            expect(p.palettes.length, `${t}.palettes`).toBeGreaterThan(0);
        }
    });

    /**
     * **Les valeurs devaient rester CELLES QU'ON VOYAIT**, pas une moyenne des
     * deux tables. `Shell` posait ces cinq-là en inline, donc c'est la table JS
     * qui gagnait à l'écran : les reprendre telles quelles est ce qui garantit
     * que la réconciliation n'a changé aucun pixel.
     */
    it('garde les valeurs de la table qui gagnait à l’écran', () => {
        expect(PALETTES.cyberpunk.jetons.accent).toBe('#06b6d4');   // et non le #22d3ee de la CSS
        expect(PALETTES.medieval.jetons.accent).toBe('#d4af37');    // et non le #d97706 de la CSS
        expect(PALETTES.modern.jetons.bg).toBe('#0f172a');          // et non le #020617 de la CSS
        expect(PALETTES.medieval.jetons.border).toBe('#332c26');    // et non le #44403c de la CSS
    });

    it('garde les valeurs que seule la CSS déclarait', () => {
        expect(PALETTES.claire.jetons.text).toBe('#2c2420');
        expect(PALETTES.medieval.jetons['font-mono']).toContain('UnifrakturMaguntia');
        expect(PALETTES.cyberpunk.jetons['glass-bg']).toBe('rgba(2, 6, 23, 0.6)');
    });

    /**
     * Un thème de base parle la langue du contrat (P1.1, 2026-09-27). Un nom
     * mal écrit — `glass_bg`, `font-titre` — ne serait lu par personne, et
     * rien d'autre ne le dirait.
     */
    it('un thème de base ne déclare que des jetons du contrat qui atteignent l’écran', () => {
        for (const t of THEMES) {
            for (const cle of Object.keys(PALETTES[t].jetons)) {
                expect(VARIABLE_DU_JETON[cle] || JETONS_LUS_A_PART.includes(cle), `${t} : --rpg-${cle}`).toBeTruthy();
            }
        }
    });

    it('claire est le seul thème clair', () => {
        expect(PALETTES.claire.clarte).toBe('light');
        for (const t of THEMES.filter(x => x !== 'claire')) {
            expect(PALETTES[t].clarte, t).toBe('dark');
        }
    });
});

describe('les variables posées', () => {
    /** Le défaut que David voyait sans pouvoir le nommer. */
    it('la lueur suit l’accent — c’est le correctif du 2026-08-24', () => {
        const v = variablesDuTheme(PALETTES.cyberpunk, PALETTES.cyberpunk.jetons.accent);
        expect(v['--app-accent']).toBe('#06b6d4');
        expect(v['--app-accent-rgb']).toBe('6, 182, 212');
        expect(v['--app-accent-glow']).toBe('rgba(6, 182, 212, 0.45)');
    });

    it('elle suit AUSSI l’accent choisi à la main, pas celui du thème', () => {
        const v = variablesDuTheme(PALETTES.medieval, '#ec4899');
        expect(v['--app-accent']).toBe('#ec4899');
        expect(v['--app-accent-glow']).toBe('rgba(236, 72, 153, 0.45)');
    });

    it('un accent illisible laisse la lueur intacte plutôt que de l’effacer', () => {
        const v = variablesDuTheme(PALETTES.modern, 'pas-une-couleur');
        expect(v['--app-accent']).toBe('pas-une-couleur');
        expect(v['--app-accent-rgb']).toBeUndefined();
        expect(v['--app-accent-glow']).toBeUndefined();
    });

    it('pose les dix variables que l’interface consomme', () => {
        const v = variablesDuTheme(PALETTES.claire, PALETTES.claire.jetons.accent);
        for (const nom of [
            '--app-accent', '--app-bg', '--app-surface', '--app-border', '--app-text',
            '--font-display', '--font-mono', '--glass-bg', '--glass-border', '--glass-highlight',
        ]) {
            expect(v[nom], nom).toBeTruthy();
        }
    });
});

describe('appliquerLeTheme', () => {
    beforeEach(() => {
        const r = document.documentElement;
        r.removeAttribute('style');
        r.removeAttribute('data-theme');
    });

    it('écrit l’attribut, la clarté et les variables', () => {
        appliquerLeTheme('medieval');
        const r = document.documentElement;

        expect(r.getAttribute('data-theme')).toBe('medieval');
        expect(r.style.colorScheme).toBe('dark');
        expect(r.style.getPropertyValue('--app-accent')).toBe('#d4af37');
        expect(r.style.getPropertyValue('--font-display')).toContain('Cinzel');
    });

    /**
     * `color-scheme` n'est pas un détail : sans lui les `<select>` natifs d'un
     * thème clair s'affichent en sombre. Le défaut a déjà été payé une fois.
     */
    it('bascule color-scheme sur le thème clair', () => {
        appliquerLeTheme('claire');
        expect(document.documentElement.style.colorScheme).toBe('light');

        appliquerLeTheme('cyberpunk');
        expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('un thème inconnu retombe sur cyberpunk sans lever', () => {
        expect(() => appliquerLeTheme('n-importe-quoi')).not.toThrow();
        expect(document.documentElement.style.getPropertyValue('--app-accent'))
            .toBe(PALETTES.cyberpunk.jetons.accent);
    });

    it('la surcharge de la main gagne sur l’accent du thème', () => {
        appliquerLeTheme('modern', '#14b8a6');
        expect(document.documentElement.style.getPropertyValue('--app-accent')).toBe('#14b8a6');
    });

    it('une surcharge vide laisse l’accent du thème', () => {
        appliquerLeTheme('modern', '   ');
        expect(document.documentElement.style.getPropertyValue('--app-accent'))
            .toBe(PALETTES.modern.jetons.accent);
    });
});

describe('le thème du jeu par-dessus le thème d’atelier', () => {
    beforeEach(() => {
        const r = document.documentElement;
        r.removeAttribute('style');
        r.removeAttribute('data-theme');
    });

    /** Ce que le pont produit pour Star Trek, en réduit. */
    const startrek = {
        variables: {
            '--app-bg': '#343434',
            '--app-surface': '#ffffff',
            '--app-text': '#17191a',
            '--app-accent': '#5f93b5',
        },
        jetons: { accent: '#5f93b5' },
        clarte: 'light' as const,
    };

    it('recouvre les couleurs de l’atelier', () => {
        appliquerLeTheme('cyberpunk', PALETTES.cyberpunk.jetons.accent, startrek);
        const r = document.documentElement;

        expect(r.style.getPropertyValue('--app-bg')).toBe('#343434');
        expect(r.style.getPropertyValue('--app-surface')).toBe('#ffffff');
        expect(r.style.getPropertyValue('--app-accent')).toBe('#5f93b5');
    });

    /**
     * Star Trek est un thème clair. Servi sous le `color-scheme: dark` de
     * cyberpunk, ses `<select>` natifs s'afficheraient en sombre sur du papier
     * blanc — le défaut déjà payé une fois.
     */
    it('impose sa polarité, même sous un thème d’atelier sombre', () => {
        appliquerLeTheme('cyberpunk', PALETTES.cyberpunk.jetons.accent, startrek);
        expect(document.documentElement.style.colorScheme).toBe('light');
    });

    it('la lueur suit l’accent DU JEU', () => {
        appliquerLeTheme('cyberpunk', PALETTES.cyberpunk.jetons.accent, startrek);
        expect(document.documentElement.style.getPropertyValue('--app-accent-glow'))
            .toBe('rgba(95, 147, 181, 0.45)');
    });

    /**
     * **« Le jeu gagne, la main surcharge » — le piège du 2026-08-23.**
     *
     * `setTheme` réinitialise `themeColor` sur l'accent du thème : une
     * surcharge est donc TOUJOURS présente. La prendre au mot ferait perdre au
     * jeu son accent à tous les coups.
     */
    it('un accent HÉRITÉ laisse gagner le jeu', () => {
        appliquerLeTheme('cyberpunk', PALETTES.cyberpunk.jetons.accent, startrek);
        expect(document.documentElement.style.getPropertyValue('--app-accent')).toBe('#5f93b5');
    });

    it('un accent CHOISI à la main gagne sur le jeu', () => {
        appliquerLeTheme('cyberpunk', '#ec4899', startrek);
        const r = document.documentElement;

        expect(r.style.getPropertyValue('--app-accent')).toBe('#ec4899');
        expect(r.style.getPropertyValue('--app-accent-glow')).toBe('rgba(236, 72, 153, 0.45)');
        // …sans que le reste du jeu soit perdu pour autant.
        expect(r.style.getPropertyValue('--app-bg')).toBe('#343434');
    });

    /**
     * Un thème partiel ne doit pas effacer ce qui marchait : ce qu'il ne
     * déclare pas reste au thème d'atelier.
     */
    it('un thème partiel laisse l’atelier combler le reste', () => {
        appliquerLeTheme('medieval', PALETTES.medieval.jetons.accent, {
            variables: { '--app-bg': '#000000' },
            jetons: {},
        });
        const r = document.documentElement;

        expect(r.style.getPropertyValue('--app-bg')).toBe('#000000');
        expect(r.style.getPropertyValue('--app-surface')).toBe(PALETTES.medieval.jetons.surface);
        expect(r.style.getPropertyValue('--font-display')).toContain('Cinzel');
    });

    it('sans thème de jeu, rien ne change par rapport à avant', () => {
        appliquerLeTheme('medieval', PALETTES.medieval.jetons.accent);
        const r = document.documentElement;

        expect(r.style.getPropertyValue('--app-bg')).toBe(PALETTES.medieval.jetons.bg);
        expect(r.style.colorScheme).toBe('dark');
    });
});

/**
 * **P1.2 · Les couleurs qui manquent** — refonte, phase 1, 2026-09-29.
 *
 * Texte estompé et subtil, deuxième surface, texte sur l'accent, bordure
 * douce, états et cadre : chaque thème de base les écrit, **aux valeurs que
 * l'écran montre aujourd'hui**. Aucun composant ne les emploie encore, sauf le
 * cadre, dont les valeurs par défaut sont celles d'aujourd'hui.
 */
describe('P1.2 · les couleurs qui manquent', () => {
    const NOUVELLES = [
        '--app-text-muted', '--app-text-subtle', '--app-surface-2', '--app-accent-contrast',
        '--app-border-soft', '--etat-succes', '--etat-danger', '--etat-alerte', '--etat-info',
    ];

    it.each(THEMES)('%s écrit chacune des nouvelles variables', (t) => {
        const v = variablesDuTheme(PALETTES[t], PALETTES[t].jetons.accent);
        for (const nom of NOUVELLES) expect(v[nom], `${t} ${nom}`).toBeTruthy();
    });

    it('le texte estompé et le subtil sont les slate-400 et slate-500 d’aujourd’hui', () => {
        for (const t of THEMES.filter(x => x !== 'claire')) {
            const v = variablesDuTheme(PALETTES[t], PALETTES[t].jetons.accent);
            expect(v['--app-text-muted'], t).toBe('#90a1b9');
            expect(v['--app-text-subtle'], t).toBe('#62748e');
        }
    });

    /** Les règles `claire` d'`index.css` repeignent slate-400 et slate-500 en `--app-text`. */
    it('dans le thème clair, ils valent le texte — ce que montrent ses règles de rattrapage', () => {
        const v = variablesDuTheme(PALETTES.claire, PALETTES.claire.jetons.accent);
        expect(v['--app-text-muted']).toBe(PALETTES.claire.jetons.text);
        expect(v['--app-text-subtle']).toBe(PALETTES.claire.jetons.text);
    });

    it('le texte sur l’accent est le fond du thème — le `text-app-bg` d’aujourd’hui', () => {
        for (const t of THEMES) {
            expect(PALETTES[t].jetons['accent-contrast'], t).toBe(PALETTES[t].jetons.bg);
        }
    });

    it('la bordure douce suit la bordure, par la variable', () => {
        const v = variablesDuTheme(PALETTES.modern, PALETTES.modern.jetons.accent);
        expect(v['--app-border-soft']).toBe('color-mix(in oklab, var(--app-border) 50%, transparent)');
    });
});

describe('P1.2 · les dérivées, une fois le jeu posé', () => {
    const base = () => variablesDuTheme(PALETTES.cyberpunk, PALETTES.cyberpunk.jetons.accent);

    it('sans cadre déclaré, le cadre est l’écran d’aujourd’hui', () => {
        const v = completerLesDerivees(base());
        expect(v['--app-frame-bg']).toBe(v['--app-bg']);
        expect(v['--app-frame-text']).toBe(v['--app-text']);
        expect(v['--app-frame-accent']).toBe(v['--app-accent']);
        expect(v['--app-frame-muted']).toBe(v['--app-text-muted']);
        expect(v['--app-frame-subtle']).toBe(v['--app-text-subtle']);
        expect(v['--app-frame-surface']).toBe(v['--app-surface']);
        expect(v['--app-frame-border']).toBe(v['--app-border']);
    });

    it('un cadre déclaré dérive son texte estompé de son texte et de son fond', () => {
        const v = completerLesDerivees({ ...base(), '--app-frame-bg': '#101010', '--app-frame-text': '#eeeeee' });
        expect(v['--app-frame-muted']).toBe('color-mix(in srgb, #eeeeee 65%, #101010)');
        expect(v['--app-frame-subtle']).toContain('#101010');
        expect(v['--app-frame-accent']).toBe(v['--app-accent']);
    });

    it('le subtil suit le `muted` du jeu, fondu dans le fond qui s’affiche', () => {
        const v = completerLesDerivees({ ...base(), '--app-bg': '#343434' }, '#aabbcc');
        expect(v['--app-text-subtle']).toBe('color-mix(in srgb, #aabbcc 70%, #343434)');
        expect(v['--app-frame-subtle']).toBe(v['--app-text-subtle']);
    });

    it('sans `muted` du jeu, le subtil du thème de base reste', () => {
        expect(completerLesDerivees(base())['--app-text-subtle']).toBe('#62748e');
    });

    /**
     * ⛔ Une variable qui se cite elle-même est un cycle : le moteur l'invalide,
     * et le cadre entier perdrait ses couleurs.
     */
    it('le style du cadre renvoie aux variables du cadre, jamais à lui-même', () => {
        for (const [nom, valeur] of Object.entries(STYLE_DU_CADRE)) {
            expect(valeur).toMatch(/^var\(--app-frame-[a-z]+\)$/);
            expect(valeur).not.toContain(`(${nom})`);
        }
    });

    it('appliquerLeTheme écrit le cadre, et il suit le fond du jeu', () => {
        const r = document.documentElement;
        r.removeAttribute('style');
        appliquerLeTheme('cyberpunk', undefined, {
            variables: { '--app-bg': '#343434' },
            jetons: {},
        });
        expect(r.style.getPropertyValue('--app-frame-bg')).toBe('#343434');
        expect(r.style.getPropertyValue('--app-frame-text')).toBe(PALETTES.cyberpunk.jetons.text);
        expect(r.style.getPropertyValue('--app-frame-accent')).toBe(PALETTES.cyberpunk.jetons.accent);
    });
});

/**
 * **P1.4 · La forme et le relief** — refonte, phase 1, 2026-09-29.
 *
 * Les arrondis, les ombres et la police du corps de Tailwind lisent désormais
 * des variables du thème (`--rayon-*`, `--elev-*`, `--font-body`), avec **la
 * valeur de Tailwind 4 en repli**. Aucun thème de base n'en déclare : l'écran
 * ne change pas.
 */
describe('P1.4 · la forme et le relief', () => {
    const extension = (configTailwind as { theme: { extend: Record<string, Record<string, string | string[]>> } }).theme.extend;

    it('aucun thème de base ne déclare de rayon ni d’élévation — le repli de Tailwind reste', () => {
        for (const t of THEMES) {
            const v = variablesDuTheme(PALETTES[t], PALETTES[t].jetons.accent);
            for (const nom of Object.keys(v)) expect(nom, t).not.toMatch(/^--(rayon|elev)-|^--font-body$/);
        }
    });

    /** Un jeton écrit d'un côté et lu de l'autre : l'asymétrie que ce dépôt a payée trois fois. */
    it('chaque variable lue par Tailwind est écrite par le contrat', () => {
        const ecrites = new Set(Object.values(VARIABLE_DU_JETON));
        const lues = [
            ...Object.values(extension.borderRadius),
            ...Object.values(extension.boxShadow),
            ...extension.fontFamily.sans,
        ].flatMap(v => [...String(v).matchAll(/var\((--(?:rayon|elev|font-body)[\w-]*)/g)].map(m => m[1]));
        expect(lues.length).toBeGreaterThan(10);
        for (const l of lues) expect(ecrites.has(l), l).toBe(true);
    });

    it('les sept crans d’arrondi se rangent en trois familles, repli de Tailwind 4', () => {
        expect(extension.borderRadius).toMatchObject({
            sm: 'var(--rayon-sm, 0.25rem)', DEFAULT: 'var(--rayon-sm, 0.25rem)', md: 'var(--rayon-sm, 0.375rem)',
            lg: 'var(--rayon-md, 0.5rem)', xl: 'var(--rayon-md, 0.75rem)',
            '2xl': 'var(--rayon-lg, 1rem)', '3xl': 'var(--rayon-lg, 1.5rem)',
        });
        expect(extension.borderRadius.full).toBeUndefined();
    });

    it('les ombres gardent la couleur d’ombre en repli — `shadow-lg shadow-accent/20` marche', () => {
        for (const [cran, valeur] of Object.entries(extension.boxShadow)) {
            if (cran.startsWith('glow')) continue;
            expect(valeur, cran).toMatch(/^var\(--elev-[123], /);
            expect(valeur, cran).toContain('var(--tw-shadow-color, #');
        }
    });

    it('l’ancienne ombre unique sert d’élévation 2 quand celle-ci manque', () => {
        const avec = { ...PALETTES.modern, jetons: { ...PALETTES.modern.jetons, shadow: '0 2px 4px #000' } };
        expect(variablesDuTheme(avec, '#3b82f6')['--elev-2']).toBe('0 2px 4px #000');
        const deux = { ...avec, jetons: { ...avec.jetons, 'elevation-2': '0 9px 9px #111' } };
        expect(variablesDuTheme(deux, '#3b82f6')['--elev-2']).toBe('0 9px 9px #111');
    });

    it('le halo suit sa force déclarée, et `glow: none` l’éteint', () => {
        const force = { ...PALETTES.modern, jetons: { ...PALETTES.modern.jetons, 'glow-strength': '0.2' } };
        expect(variablesDuTheme(force, '#3b82f6')['--app-accent-glow']).toBe('rgba(59, 130, 246, 0.2)');
        const eteint = { ...PALETTES.modern, jetons: { ...PALETTES.modern.jetons, glow: 'none' } };
        expect(completerLesDerivees(variablesDuTheme(eteint, '#3b82f6'))['--app-accent-glow']).toBe('transparent');
    });

    it('un thème qui ne déclare plus un rayon l’efface du document', () => {
        const r = document.documentElement;
        r.removeAttribute('style');
        r.style.setProperty('--rayon-md', '12px');
        r.style.setProperty('--font-body', '"Garamond", serif');
        appliquerLeTheme('cyberpunk');
        expect(r.style.getPropertyValue('--rayon-md')).toBe('');
        expect(r.style.getPropertyValue('--font-body')).toBe('');
        expect(r.style.getPropertyValue('--app-accent')).toBe(PALETTES.cyberpunk.jetons.accent);
    });
});

/**
 * **P1.5 · Le verre et les matières** — refonte, phase 1, 2026-09-29.
 *
 * Les textures de fond étaient trois règles `[data-theme=…]
 * .bg-texture-overlay::before` d'`index.css`. Elles passent par les paquets,
 * **au caractère près** : ces chaînes sont celles d'`index.css` au commit
 * `b3cab546`, recopiées avant la modification.
 */
describe('P1.5 · le verre et les matières', () => {
    const HIER = {
        cyberpunk: {
            '--texture-fond': 'linear-gradient(rgba(34, 211, 238, 0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(34, 211, 238, 0.2) 2px, transparent 2px)',
            '--texture-opacite': '1', '--texture-taille': '80px 80px', '--texture-position': 'center', '--texture-fusion': 'normal',
        },
        medieval: {
            '--texture-opacite': '0.12', '--texture-taille': '250px 250px', '--texture-position': '0% 0%', '--texture-fusion': 'soft-light',
        },
        claire: {
            '--texture-fond': 'repeating-linear-gradient(45deg, rgba(162, 120, 92, 0.15) 0px, rgba(162, 120, 92, 0.15) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(162, 120, 92, 0.15) 0px, rgba(162, 120, 92, 0.15) 1px, transparent 1px, transparent 10px)',
            '--texture-opacite': '1', '--texture-taille': 'auto', '--texture-position': '0% 0%', '--texture-fusion': 'normal',
        },
    } as const;

    it.each(Object.keys(HIER) as (keyof typeof HIER)[])('%s pose la matière d’hier', (t) => {
        const v = variablesDuTheme(PALETTES[t], PALETTES[t].jetons.accent);
        for (const [nom, valeur] of Object.entries(HIER[t])) expect(v[nom], `${t} ${nom}`).toBe(valeur);
    });

    it('le grain du médiéval est le bruit fractal en SVG d’hier', () => {
        const v = variablesDuTheme(PALETTES.medieval, PALETTES.medieval.jetons.accent);
        expect(v['--texture-fond']).toMatch(/^url\("data:image\/svg\+xml,.*feTurbulence type='fractalNoise' baseFrequency='0\.6' numOctaves='3'.*"\)$/);
    });

    it('le moderne n’a pas de matière', () => {
        const v = variablesDuTheme(PALETTES.modern, PALETTES.modern.jetons.accent);
        expect(v['--texture-fond']).toBeUndefined();
        expect(v['--texture-opacite']).toBeUndefined();
    });

    it('aucun thème de base ne déclare de flou de verre — les 20 px d’hier restent', () => {
        for (const t of THEMES) expect(variablesDuTheme(PALETTES[t], PALETTES[t].jetons.accent)['--glass-blur'], t).toBeUndefined();
    });
});

/**
 * **P1.6 · L'interrupteur des personnalités** — contrat v1.4, 2026-09-29.
 *
 * Décision de David : ce que la v1.4 ouvre au jeu, et la dérivation des
 * accents de module, ne se voient qu'avec les personnalités allumées. Le
 * réglage arrive avec P1.7 ; en attendant, l'option reste éteinte partout.
 */
describe('P1.6 · sous l’interrupteur des personnalités', () => {
    const r = () => document.documentElement;
    beforeEach(() => r().removeAttribute('style'));

    it('éteint, aucun accent de module ne s’écrit : les `gm-*` gardent leur repli', () => {
        appliquerLeTheme('cyberpunk');
        expect(r().style.getPropertyValue('--gm-crimson')).toBe('');
    });

    it('allumé, les cinq accents dérivent de l’accent — puis s’effacent quand on l’éteint', () => {
        appliquerLeTheme('cyberpunk', undefined, undefined, { personnalites: true });
        for (const m of ['gold', 'violet', 'crimson', 'cyan', 'emerald']) {
            expect(r().style.getPropertyValue(`--gm-${m}`), m).toMatch(/^#[0-9a-f]{6}$/);
        }
        appliquerLeTheme('cyberpunk');
        expect(r().style.getPropertyValue('--gm-gold')).toBe('');
    });

    it('un halo fixe du jeu cède à l’accent choisi à la main', () => {
        const jeu = { variables: { '--app-accent-glow': 'rgba(255, 95, 86, 0.28)' }, jetons: { glow: 'rgba(255, 95, 86, 0.28)', 'glow-strength': '0.4' } };
        appliquerLeTheme('modern', '#14b8a6', jeu, { personnalites: true });
        expect(r().style.getPropertyValue('--app-accent-glow')).toBe('rgba(20, 184, 166, 0.4)');
        appliquerLeTheme('modern', undefined, jeu, { personnalites: true });
        expect(r().style.getPropertyValue('--app-accent-glow')).toBe('rgba(255, 95, 86, 0.28)');
    });

    it('une matière du jeu se pose à sa taille, pas à celle de la grille du cyberpunk', () => {
        const jeu = { variables: { '--texture-fond': 'linear-gradient(#000, #fff)' }, jetons: {} };
        appliquerLeTheme('cyberpunk', undefined, jeu, { personnalites: true });
        expect(r().style.getPropertyValue('--texture-taille')).toBe('auto');
    });
});

/**
 * **P1.7 · Les personnalités, sous l'interrupteur** — refonte, 2026-09-29.
 */
describe('P1.7 · appliquerLeTheme avec les personnalités', () => {
    const r = () => document.documentElement;
    beforeEach(() => { r().removeAttribute('style'); r().removeAttribute('data-personnalites'); r().removeAttribute('data-cadre'); });

    it('allumées, le thème prend les valeurs de sa personnalité', () => {
        appliquerLeTheme('medieval', accentDuTheme('medieval'), undefined, { personnalites: true });
        expect(r().style.getPropertyValue('--app-bg')).toBe(PERSONNALITES.medieval.jetons.bg);
        expect(r().style.getPropertyValue('--rayon-md')).toBe('2px');
        expect(r().getAttribute('data-clarte')).toBe('light');
        expect(r().hasAttribute('data-personnalites')).toBe(true);
    });

    /** `setTheme` pose l'accent d'aujourd'hui : il ne doit pas passer pour un choix de la main. */
    it('l’accent d’aujourd’hui, hérité, cède à celui de la personnalité', () => {
        appliquerLeTheme('medieval', accentDuTheme('medieval'), undefined, { personnalites: true });
        expect(r().style.getPropertyValue('--app-accent')).toBe('#7a5c20');
    });

    it('un accent vraiment choisi à la main reste', () => {
        appliquerLeTheme('medieval', '#1e3a8a', undefined, { personnalites: true });
        expect(r().style.getPropertyValue('--app-accent')).toBe('#1e3a8a');
    });

    it('le cadre du Médiéval est déclaré, celui du Cyberpunk non', () => {
        appliquerLeTheme('medieval', undefined, undefined, { personnalites: true });
        expect(r().hasAttribute('data-cadre')).toBe(true);
        expect(r().style.getPropertyValue('--app-frame-bg')).toBe('#160e07');
        appliquerLeTheme('cyberpunk', undefined, undefined, { personnalites: true });
        expect(r().hasAttribute('data-cadre')).toBe(false);
    });

    it('éteintes, tout revient : valeurs d’aujourd’hui, rayons effacés, marques retirées', () => {
        appliquerLeTheme('medieval', accentDuTheme('medieval'), undefined, { personnalites: true });
        appliquerLeTheme('medieval', accentDuTheme('medieval'));
        expect(r().style.getPropertyValue('--app-bg')).toBe(PALETTES.medieval.jetons.bg);
        expect(r().style.getPropertyValue('--app-accent')).toBe('#d4af37');
        expect(r().style.getPropertyValue('--rayon-md')).toBe('');
        expect(r().style.getPropertyValue('--font-body')).toBe('');
        expect(r().hasAttribute('data-personnalites')).toBe(false);
        expect(r().hasAttribute('data-cadre')).toBe(false);
    });
});

/**
 * **Un jeu sans cadre ne garde pas celui du thème de base** — trouvé le
 * 2026-09-29 en capturant chaque campagne sous chaque thème : Alien s'affichait
 * dans le cadre de bois de la personnalité médiévale.
 */
describe('le cadre sous un thème de jeu', () => {
    const r = () => document.documentElement;
    const alien = { variables: { '--app-bg': '#060909', '--app-text': '#d8e2de', '--app-accent': '#8fb7b1' }, jetons: { accent: '#8fb7b1' }, clarte: 'dark' as const };
    beforeEach(() => { r().removeAttribute('style'); r().removeAttribute('data-cadre'); });

    it('le cadre suit les couleurs du jeu, pas le bois du Médiéval', () => {
        appliquerLeTheme('medieval', undefined, alien, { personnalites: true });
        expect(r().style.getPropertyValue('--app-frame-bg')).toBe('#060909');
        expect(r().hasAttribute('data-cadre')).toBe(false);
    });

    it('un jeu qui déclare son cadre le garde', () => {
        const avecCadre = { ...alien, variables: { ...alien.variables, '--app-frame-bg': '#101818', '--app-frame-text': '#e0e8e4' } };
        appliquerLeTheme('medieval', undefined, avecCadre, { personnalites: true });
        expect(r().style.getPropertyValue('--app-frame-bg')).toBe('#101818');
        expect(r().hasAttribute('data-cadre')).toBe(true);
    });

    it('un jeu sombre sous le thème clair n’hérite ni de son verre blanc ni de sa toile', () => {
        appliquerLeTheme('claire', undefined, alien);
        expect(r().style.getPropertyValue('--glass-bg')).toBe('color-mix(in srgb, #060909 60%, transparent)');
        expect(r().style.getPropertyValue('--texture-fond')).toBe('');
    });

    it('le verre des colonnes prend la surface du jeu, et la rend en quittant la campagne', () => {
        const dune = { variables: { '--app-bg': '#302d29', '--app-surface': '#241d1b' }, jetons: {}, clarte: 'dark' as const };
        appliquerLeTheme('cyberpunk', undefined, dune);
        expect(r().style.getPropertyValue('--verre-premium')).toBe('color-mix(in srgb, #241d1b 45%, transparent)');
        appliquerLeTheme('cyberpunk');
        expect(r().style.getPropertyValue('--verre-premium')).toBe('');
    });

    it('un jeu de même polarité garde le verre et la matière du thème de base', () => {
        appliquerLeTheme('cyberpunk', undefined, alien);
        expect(r().style.getPropertyValue('--glass-bg')).toBe(PALETTES.cyberpunk.jetons['glass-bg']);
        expect(r().style.getPropertyValue('--texture-fond')).toBe(PALETTES.cyberpunk.jetons['texture-bg']);
    });

    it('la polarité affichée est celle du jeu : les règles du thème clair ne visent qu’un écran clair', () => {
        appliquerLeTheme('claire', undefined, alien);
        expect(r().getAttribute('data-clarte')).toBe('dark');
        appliquerLeTheme('claire');
        expect(r().getAttribute('data-clarte')).toBe('light');
    });
});

describe('le facteur des halos (phase 5)', () => {
    it('0 sans halo, la force du thème rapportée à 0,45 sinon', () => {
        expect(facteurDuHalo('transparent')).toBe('0');
        expect(facteurDuHalo('rgba(6, 182, 212, 0.45)')).toBe('1');
        expect(facteurDuHalo('rgba(0, 240, 255, 0.8)')).toBe('1.778');
        expect(facteurDuHalo('rgba(37, 99, 235, 0.3)')).toBe('0.667');
    });

    it('un halo opaque vaut une opacité de 1 ; ce qu’on ne lit pas compte pour 1', () => {
        expect(facteurDuHalo('#ff0000')).toBe('2.222');
        expect(facteurDuHalo('var(--x)')).toBe('1');
        expect(facteurDuHalo(undefined)).toBe('1');
    });

    it('les dérivées l’écrivent toujours, et `glow: none` l’éteint', () => {
        expect(completerLesDerivees({ '--app-accent-glow': 'none' })['--halo-facteur']).toBe('0');
        expect(completerLesDerivees({})['--halo-facteur']).toBe('1');
    });
});
