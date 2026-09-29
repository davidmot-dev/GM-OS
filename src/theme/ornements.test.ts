import { describe, it, expect, beforeEach, vi } from 'vitest';
import { problemesDuSvg, chargerLesOrnements, enAdresse, SVG_DES_THEMES_DE_BASE } from './ornements';
import { appliquerLeTheme } from './themeDeLInterface';

/**
 * **P3.1 · Les ornements** — refonte, phase 3, 2026-09-30.
 */
const SUR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><path d="M0 0h8" stroke="currentColor"/></svg>';

describe('problemesDuSvg — le § 8', () => {
    it('un SVG conforme n’a aucun problème', () => {
        expect(problemesDuSvg(SUR)).toEqual([]);
    });

    it.each([
        ['sans viewBox', SUR.replace(' viewBox="0 0 8 8"', ''), 'viewBox'],
        ['sans currentColor', SUR.replace('currentColor', '#000'), 'currentColor'],
        ['un script', SUR.replace('</svg>', '<script>alert(1)</script></svg>'), 'script'],
        ['un attribut on…', SUR.replace('<path', '<path onclick="x()"'), 'on…'],
        ['un lien externe', SUR.replace('<path', '<use href="https://exemple.org/a.svg#b"/><path'), 'renvoie'],
    ])('%s est refusé', (_nom, svg, motif) => {
        expect(problemesDuSvg(svg).join(' ')).toContain(motif);
    });

    it('les ornements des thèmes de base passent le § 8, comme ceux d’un jeu', () => {
        for (const [theme, svg] of Object.entries(SVG_DES_THEMES_DE_BASE)) expect(problemesDuSvg(svg), theme).toEqual([]);
    });
});

describe('chargerLesOrnements', () => {
    const disque = (fichiers: Record<string, string>) => async (chemin: string) => fichiers[chemin] ?? null;
    beforeEach(() => { vi.spyOn(console, 'warn').mockImplementation(() => {}); });

    it('incorpore chaque ornement conforme', async () => {
        const o = await chargerLesOrnements(disque({
            'systems/cthulhu hack/theme/ornements.json': JSON.stringify({ coin: 'ornements/coin.svg', entete: 'ornements/entete.svg' }),
            'systems/cthulhu hack/theme/ornements/coin.svg': SUR,
            'systems/cthulhu hack/theme/ornements/entete.svg': SUR,
        }), 'systems/cthulhu hack');
        expect(o).toEqual({ coin: enAdresse(SUR), entete: enAdresse(SUR) });
    });

    it('un jeu sans ornements.json n’en a pas — le cas normal', async () => {
        expect(await chargerLesOrnements(disque({}), 'systems/alien')).toEqual({});
    });

    it('écarte ce qui sort du dossier, ce qui est dangereux, ce qui manque', async () => {
        const o = await chargerLesOrnements(disque({
            'systems/x/theme/ornements.json': JSON.stringify({
                coin: '../../autre/coin.svg', entete: 'ornements/entete.svg', fond: 'ornements/absent.svg',
                separateur: 'ornements/separateur.svg',
            }),
            'systems/x/theme/ornements/entete.svg': SUR.replace('</svg>', '<script/></svg>'),
            'systems/x/theme/ornements/separateur.svg': SUR,
        }), 'systems/x');
        expect(o).toEqual({ separateur: enAdresse(SUR) });
    });

    it('un ornements.json illisible ne donne rien, sans lever', async () => {
        expect(await chargerLesOrnements(disque({ 'systems/x/theme/ornements.json': '{ pas du json' }), 'systems/x')).toEqual({});
    });
});

describe('les ornements posés sur le document', () => {
    const r = () => document.documentElement;
    beforeEach(() => r().removeAttribute('style'));

    it('sous les personnalités, le Médiéval pose ses coins en laiton', () => {
        appliquerLeTheme('medieval', undefined, undefined, { personnalites: true });
        expect(r().style.getPropertyValue('--orne-coin')).toBe(enAdresse(SVG_DES_THEMES_DE_BASE.medieval));
        expect(r().style.getPropertyValue('--orne-coin-affichage')).toBe('block');
    });

    it('éteintes, aucun ornement — et ceux d’avant s’effacent', () => {
        appliquerLeTheme('medieval', undefined, undefined, { personnalites: true });
        appliquerLeTheme('medieval');
        expect(r().style.getPropertyValue('--orne-coin')).toBe('');
        expect(r().style.getPropertyValue('--orne-coin-affichage')).toBe('');
    });

    it('sous un jeu, seuls ses ornements comptent — jamais le laiton du Médiéval autour d’un autre univers', () => {
        const avec = { variables: { '--app-bg': '#e2e0d7' }, jetons: {}, ornements: { entete: enAdresse(SUR) } };
        appliquerLeTheme('medieval', undefined, avec, { personnalites: true });
        expect(r().style.getPropertyValue('--orne-entete')).toBe(enAdresse(SUR));
        expect(r().style.getPropertyValue('--orne-coin')).toBe('');

        const sans = { variables: { '--app-bg': '#060909' }, jetons: {} };
        appliquerLeTheme('medieval', undefined, sans, { personnalites: true });
        expect(r().style.getPropertyValue('--orne-entete')).toBe('');
        expect(r().style.getPropertyValue('--orne-coin')).toBe('');
    });
});
