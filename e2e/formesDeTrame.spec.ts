import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

type Temoin = Window & { useSessionOSStore: typeof useSessionOSStore; ecrituresFormes: number };
const SORTIE = path.resolve('documentation/Planning/graphe-trame/formes');
let gmos: GmOsLance;
const bouton = (nom: string) => gmos.fenetre.getByRole('button', { name: nom, exact: true });
const forme = () => gmos.fenetre.getByLabel('Disposition de la trame', { exact: true });
const espacement = () => gmos.fenetre.getByLabel('Espacement de la trame', { exact: true });
const ecritures = () => gmos.fenetre.evaluate(() => (window as Temoin).ecrituresFormes);
const etat = () => gmos.fenetre.evaluate(() => {
    const s = (window as Temoin).useSessionOSStore.getState();
    return { campagne: s.campaigns.find(c => c.id === s.activeCampaignId)!, actes: s.actes, scenes: s.scenes };
});
const positions = () => gmos.fenetre.locator('.react-flow__node').evaluateAll(elements => Object.fromEntries(elements.map(el => {
    const p = (el as HTMLElement).style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)!;
    return [el.getAttribute('data-id')!, { x: Number(p[1]), y: Number(p[2]) }];
})));
async function ouvrir() {
    await attendreLHydratation(gmos);
    await gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().setCurrentView('trame'));
    await bouton('Graphe').click(); await expect(gmos.fenetre.locator(".react-flow__node[data-id='scene:temoin-scene-3']")).toBeVisible();
}
async function apercu(choix: string, dejaOuvert = false) {
    await forme().selectOption(choix); if (!dejaOuvert) await bouton('Organiser').click();
    await expect(bouton('Appliquer la disposition')).toBeVisible({ timeout: 25_000 });
    await expect(gmos.fenetre.locator('.toile-de-trame')).toHaveAttribute('data-organisation', 'apercu');
    await expect(forme()).toBeEnabled(); await gmos.fenetre.waitForTimeout(250);
}

test.describe('formes de rangement de Trame', () => {
    test.setTimeout(120_000);
    test.beforeEach(async () => {
        fs.mkdirSync(SORTIE, { recursive: true }); gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 }); await ouvrir();
        await gmos.fenetre.evaluate(() => {
            const s = (window as Temoin).useSessionOSStore.getState();
            const acte = s.scenes.find(n => n.id === 'temoin-scene-2')!.acteId;
            for (const nom of ['Les archives du relais', 'La piste du contremaître']) {
                const id = s.ajouterScene(acte, nom); s.ajouterUnEnchainement('temoin-scene-2', id);
            }
            s.ajouterUnEnchainement('temoin-scene-2', 'temoin-scene-3', 'si Hale se tait');
            s.stylerLeLienDeTrame(s.activeCampaignId!, JSON.stringify(['enchainement', 'scene:temoin-scene-2', 'scene:temoin-scene-3']),
                { depart: 'bas', arrivee: 'haut', couleur: '#8b5cf6', trace: 'points', epaisseur: 'gras' });
            const w = window as Temoin; w.ecrituresFormes = 0;
            w.useSessionOSStore.subscribe((s, avant) => { if (s.campaigns !== avant.campaigns) w.ecrituresFormes++; });
        });
        await expect(gmos.fenetre.locator('.react-flow__node')).toHaveCount(10);
    });
    test.afterEach(async () => {
        await gmos.application.close(); fs.rmSync(gmos.profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    });

    test('les six choix se comparent en aperçu sans écriture ; les cartes gardent leur place dans l’histoire', async () => {
        const avant = await positions(), initial = await etat();
        for (const [i, choix] of ['automatique', 'etoile', 'ligne', 'colonne', 'arbre', 'grille'].entries()) {
            await apercu(choix, i > 0); expect(await ecritures()).toBe(0); expect(await etat()).toEqual(initial);
            const rectangles = await gmos.fenetre.locator('.react-flow__node').evaluateAll(elements => elements.map(el => {
                const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height };
            }));
            for (let a = 0; a < rectangles.length; a++) for (let b = a + 1; b < rectangles.length; b++) {
                const p = rectangles[a], q = rectangles[b];
                expect(p.x + p.w <= q.x + 1 || q.x + q.w <= p.x + 1 || p.y + p.h <= q.y + 1 || q.y + q.h <= p.y + 1).toBe(true);
            }
            await gmos.fenetre.screenshot({ path: path.join(SORTIE, `${choix}-1440.png`) });
        }
        await gmos.fenetre.setViewportSize({ width: 900, height: 700 }); await gmos.fenetre.waitForTimeout(250);
        await bouton('Cadrer la trame').click(); await gmos.fenetre.waitForTimeout(250);
        const horsCadre = await gmos.fenetre.locator('.toile-de-trame').evaluate(el => {
            const t = el.getBoundingClientRect();
            return [...el.querySelectorAll('.react-flow__node')].filter(n => {
                const r = n.getBoundingClientRect(); return r.left < t.left - 1 || r.right > t.right + 1 || r.top < t.top - 1 || r.bottom > t.bottom + 1;
            }).map(n => n.getAttribute('data-id'));
        });
        expect(horsCadre).toEqual([]);
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'grille-900.png') });
        await bouton('Annuler l’aperçu').click(); expect(await positions()).toEqual(avant); expect(await ecritures()).toBe(0);
    });

    test('Appliquer conserve la forme et les styles en une écriture ; le retour restaure la forme précédente et Figé', async () => {
        const histoire = await etat();
        await apercu('etoile'); await bouton('Appliquer la disposition').click(); await expect.poll(ecritures).toBe(1);
        const etoile = await positions(); expect((await etat()).campagne.organisationDeLaTrame?.forme).toBe('etoile');
        await apercu('grille'); await espacement().selectOption('compact'); await expect(bouton('Appliquer la disposition')).toBeVisible();
        await bouton('Appliquer la disposition').click(); await expect.poll(ecritures).toBe(2);
        expect((await etat()).campagne.organisationDeLaTrame).toMatchObject({ forme: 'grille', espacement: 'compact' });
        await bouton('Disposition précédente').click(); await expect.poll(ecritures).toBe(3);
        expect(await positions()).toEqual(etoile); await expect(forme()).toHaveValue('etoile'); await expect(espacement()).toHaveValue('equilibre');
        await bouton('Libre').click(); const fige = await etat();
        await apercu('arbre'); await gmos.fenetre.keyboard.press('Escape'); expect(await etat()).toEqual(fige);
        const actuel = await etat(); expect(actuel.scenes).toEqual(histoire.scenes); expect(actuel.actes).toEqual(histoire.actes);
        expect(actuel.campagne.stylesDesLiensDeTrame).toEqual(histoire.campagne.stylesDesLiensDeTrame);
        expect(actuel.campagne.trameFigee).toBe(true);
    });

    test('forme, espacement, positions et retour précédent reviennent dans un nouveau processus', async () => {
        await apercu('colonne'); await bouton('Appliquer la disposition').click();
        await apercu('grille'); await espacement().selectOption('aere'); await expect(bouton('Appliquer la disposition')).toBeVisible();
        await bouton('Appliquer la disposition').click(); const avant = await positions(), conserve = await etat();
        const ancien = gmos.profil; await gmos.fenetre.waitForTimeout(1000); await gmos.application.close();
        gmos = await lancerGmOs({ preparerLeProfil: profil => fs.cpSync(ancien, profil, { recursive: true }) });
        fs.rmSync(ancien, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 }); await ouvrir();
        expect(await positions()).toEqual(avant); expect(await etat()).toEqual(conserve);
        await expect(forme()).toHaveValue('grille'); await expect(espacement()).toHaveValue('aere');
        await bouton('Disposition précédente').click(); await expect(forme()).toHaveValue('colonne');
    });
});
