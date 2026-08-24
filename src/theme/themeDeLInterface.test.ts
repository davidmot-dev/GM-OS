import { describe, it, expect, beforeEach } from 'vitest';
import {
    PALETTES,
    composantesRVB,
    variablesDuTheme,
    appliquerLeTheme,
    type ThemeID,
} from './themeDeLInterface';

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
            for (const cle of ['accent', 'bg', 'surface', 'border', 'text', 'policeTitre', 'policeMono'] as const) {
                expect(p[cle], `${t}.${cle}`).toBeTruthy();
            }
            expect(p.verre.fond, `${t}.verre`).toBeTruthy();
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
        expect(PALETTES.cyberpunk.accent).toBe('#06b6d4');   // et non le #22d3ee de la CSS
        expect(PALETTES.medieval.accent).toBe('#d4af37');    // et non le #d97706 de la CSS
        expect(PALETTES.modern.bg).toBe('#0f172a');          // et non le #020617 de la CSS
        expect(PALETTES.medieval.border).toBe('#332c26');    // et non le #44403c de la CSS
    });

    it('garde les valeurs que seule la CSS déclarait', () => {
        expect(PALETTES.claire.text).toBe('#2c2420');
        expect(PALETTES.medieval.policeMono).toContain('UnifrakturMaguntia');
        expect(PALETTES.cyberpunk.verre.fond).toBe('rgba(2, 6, 23, 0.6)');
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
        const v = variablesDuTheme(PALETTES.cyberpunk, PALETTES.cyberpunk.accent);
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
        const v = variablesDuTheme(PALETTES.claire, PALETTES.claire.accent);
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
            .toBe(PALETTES.cyberpunk.accent);
    });

    it('la surcharge de la main gagne sur l’accent du thème', () => {
        appliquerLeTheme('modern', '#14b8a6');
        expect(document.documentElement.style.getPropertyValue('--app-accent')).toBe('#14b8a6');
    });

    it('une surcharge vide laisse l’accent du thème', () => {
        appliquerLeTheme('modern', '   ');
        expect(document.documentElement.style.getPropertyValue('--app-accent'))
            .toBe(PALETTES.modern.accent);
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
        appliquerLeTheme('cyberpunk', PALETTES.cyberpunk.accent, startrek);
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
        appliquerLeTheme('cyberpunk', PALETTES.cyberpunk.accent, startrek);
        expect(document.documentElement.style.colorScheme).toBe('light');
    });

    it('la lueur suit l’accent DU JEU', () => {
        appliquerLeTheme('cyberpunk', PALETTES.cyberpunk.accent, startrek);
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
        appliquerLeTheme('cyberpunk', PALETTES.cyberpunk.accent, startrek);
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
        appliquerLeTheme('medieval', PALETTES.medieval.accent, {
            variables: { '--app-bg': '#000000' },
            jetons: {},
        });
        const r = document.documentElement;

        expect(r.style.getPropertyValue('--app-bg')).toBe('#000000');
        expect(r.style.getPropertyValue('--app-surface')).toBe(PALETTES.medieval.surface);
        expect(r.style.getPropertyValue('--font-display')).toContain('Cinzel');
    });

    it('sans thème de jeu, rien ne change par rapport à avant', () => {
        appliquerLeTheme('medieval', PALETTES.medieval.accent);
        const r = document.documentElement;

        expect(r.style.getPropertyValue('--app-bg')).toBe(PALETTES.medieval.bg);
        expect(r.style.colorScheme).toBe('dark');
    });
});
