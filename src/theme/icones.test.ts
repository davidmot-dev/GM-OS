import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chargerLesIcones } from './icones';
import { appliquerLeTheme } from './themeDeLInterface';

const SVG_SUR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2h20v20z" fill="currentColor"/></svg>';

/** Un faux dossier de thème : le chemin complet → le texte. */
const lecteur = (fichiers: Record<string, string>) =>
    async (chemin: string) => fichiers[chemin] ?? null;

describe('les icônes d’un jeu (§ 9)', () => {
    it('rend {} quand le jeu n’en a pas — le cas normal', async () => {
        expect(await chargerLesIcones(lecteur({}), 'systems/alien')).toEqual({});
    });

    it('charge une icône du § 9, incorporée', async () => {
        const icones = await chargerLesIcones(lecteur({
            'systems/alien/theme/icones.json': JSON.stringify({ combat: 'icones/xeno.svg' }),
            'systems/alien/theme/icones/xeno.svg': SVG_SUR,
        }), 'systems/alien');
        expect(Object.keys(icones)).toEqual(['combat']);
        expect(icones.combat).toMatch(/^url\("data:image\/svg\+xml,/);
    });

    it('écarte un nom inconnu, un chemin qui sort, un SVG dangereux — et garde le reste', async () => {
        const avertir = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const icones = await chargerLesIcones(lecteur({
            'systems/alien/theme/icones.json': JSON.stringify({
                combat: 'icones/xeno.svg',
                vaisseau: 'icones/xeno.svg',            // pas au § 9
                sante: '../../secret.svg',              // sort du dossier
                indice: 'icones/script.svg',            // contient un script
                butin: 'icones/absente.svg',            // introuvable
            }),
            'systems/alien/theme/icones/xeno.svg': SVG_SUR,
            'systems/alien/theme/icones/script.svg': SVG_SUR.replace('</svg>', '<script>alert(1)</script></svg>'),
        }), 'systems/alien');
        expect(Object.keys(icones)).toEqual(['combat']);
        expect(avertir).toHaveBeenCalledTimes(4);
        avertir.mockRestore();
    });

    it('ne fait rien d’un fichier qui n’est pas du JSON', async () => {
        const avertir = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(await chargerLesIcones(lecteur({ 'systems/alien/theme/icones.json': '{ pas du json' }), 'systems/alien')).toEqual({});
        avertir.mockRestore();
    });
});

describe('les icônes posées sur le document', () => {
    const r = () => document.documentElement;
    beforeEach(() => r().removeAttribute('style'));
    const ADRESSE = 'url("data:image/svg+xml,x")';

    it('sous les personnalités, l’icône du jeu se pose et efface celle de GM-OS', () => {
        appliquerLeTheme('cyberpunk', undefined, { variables: {}, jetons: {}, icones: { combat: ADRESSE } }, { personnalites: true });
        expect(r().style.getPropertyValue('--icone-combat')).toBe(ADRESSE);
        expect(r().style.getPropertyValue('--icone-combat-affichage')).toBe('inline-block');
        expect(r().style.getPropertyValue('--icone-combat-repli')).toBe('none');
        // Les autres noms restent à GM-OS.
        expect(r().style.getPropertyValue('--icone-sante')).toBe('');
    });

    it('un jeu sans icônes, ou les personnalités éteintes : tout s’efface', () => {
        appliquerLeTheme('cyberpunk', undefined, { variables: {}, jetons: {}, icones: { combat: ADRESSE } }, { personnalites: true });
        appliquerLeTheme('cyberpunk', undefined, { variables: {}, jetons: {} }, { personnalites: true });
        expect(r().style.getPropertyValue('--icone-combat')).toBe('');
        expect(r().style.getPropertyValue('--icone-combat-repli')).toBe('');

        appliquerLeTheme('cyberpunk', undefined, { variables: {}, jetons: {}, icones: { combat: ADRESSE } }, { personnalites: true });
        appliquerLeTheme('cyberpunk', undefined, { variables: {}, jetons: {}, icones: { combat: ADRESSE } });
        expect(r().style.getPropertyValue('--icone-combat')).toBe('');
    });
});
