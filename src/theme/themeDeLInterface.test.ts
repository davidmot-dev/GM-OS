import { describe, it, expect, beforeEach } from 'vitest';
import {
    PALETTES,
    composantesRVB,
    variablesDuTheme,
    appliquerLeTheme,
    completerLesDerivees,
    STYLE_DU_CADRE,
    type ThemeID,
} from './themeDeLInterface';
import { VARIABLE_DU_JETON } from './contratDuTheme';

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
                expect(VARIABLE_DU_JETON[cle], `${t} : --rpg-${cle}`).toBeTruthy();
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
