import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

type Temoin = Window & { useSessionOSStore: typeof useSessionOSStore; ecrituresSelection: number };
const SORTIE = path.resolve('documentation/Planning/graphe-trame/selection-multiple');
let gmos: GmOsLance;
const bouton = (nom: string) => gmos.fenetre.getByRole('button', { name: nom, exact: true });
const carte = (id: string) => gmos.fenetre.locator(`.react-flow__node[data-id='${id}']`);
const selection = () => gmos.fenetre.locator('.react-flow__node.selected');
const ecritures = () => gmos.fenetre.evaluate(() => (window as Temoin).ecrituresSelection);
const etat = () => gmos.fenetre.evaluate(() => {
    const s = (window as Temoin).useSessionOSStore.getState();
    return { campaigns: s.campaigns, scenes: s.scenes, actes: s.actes };
});
const places = () => gmos.fenetre.locator('.react-flow__node').evaluateAll(elements => Object.fromEntries(elements.map(el => {
    const valeurs = (el as HTMLElement).style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)!;
    return [el.getAttribute('data-id')!, { x: Number(valeurs[1]), y: Number(valeurs[2]) }];
})));
async function choisirDeux() {
    await carte('scene:temoin-scene-2').click();
    await carte('scene:temoin-scene-3').click({ modifiers: ['Control'] });
    await expect(selection()).toHaveCount(2); await expect(gmos.fenetre.locator('.selection-multiple-trame')).toContainText('2 cartes');
    await bouton('Cadrer la trame').click(); await gmos.fenetre.waitForTimeout(250);
}
async function tirer(id: string, dx: number, dy: number) {
    const b = (await carte(id).boundingBox())!;
    await gmos.fenetre.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await gmos.fenetre.mouse.down();
    await gmos.fenetre.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2 + dy, { steps: 16 });
}

test.describe('sélection multiple de Trame', () => {
    test.setTimeout(120_000);
    test.beforeEach(async () => {
        fs.mkdirSync(SORTIE, { recursive: true }); gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 }); await attendreLHydratation(gmos);
        await gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().setCurrentView('trame'));
        await bouton('Graphe').click(); await expect(carte('scene:temoin-scene-3')).toBeVisible();
        await gmos.fenetre.evaluate(() => {
            const w = window as Temoin; w.ecrituresSelection = 0;
            w.useSessionOSStore.subscribe((s, avant) => { if (s.campaigns !== avant.campaigns) w.ecrituresSelection++; });
        });
    });
    test.afterEach(async () => {
        await gmos.application.close(); fs.rmSync(gmos.profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    });

    test('Ctrl ajuste le groupe ; le glisser garde les écarts et écrit une fois au lâcher, sans changer les scènes', async () => {
        await choisirDeux(); const avant = await places(), histoire = await etat();
        await carte('scene:temoin-scene-2').click({ modifiers: ['Control'] }); await expect(selection()).toHaveCount(1);
        await carte('scene:temoin-scene-2').click({ modifiers: ['Control'] }); await expect(selection()).toHaveCount(2);
        expect(await ecritures()).toBe(0);
        await tirer('scene:temoin-scene-2', 45, 65); expect(await ecritures()).toBe(0); await gmos.fenetre.mouse.up();
        await expect.poll(ecritures).toBe(1);
        const apres = await places(), deplace = await etat(), a = 'scene:temoin-scene-2', b = 'scene:temoin-scene-3';
        expect(apres[a]).not.toEqual(avant[a]);
        expect(apres[a].x - avant[a].x).toBeCloseTo(apres[b].x - avant[b].x, 2);
        expect(apres[a].y - avant[a].y).toBeCloseTo(apres[b].y - avant[b].y, 2);
        for (const id of Object.keys(avant)) if (![a, b].includes(id)) expect(apres[id]).toEqual(avant[id]);
        expect(deplace.scenes).toEqual(histoire.scenes); expect(deplace.actes).toEqual(histoire.actes);
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'groupe-1440.png') });
        await gmos.fenetre.keyboard.press('Escape'); await expect(selection()).toHaveCount(0); expect(await ecritures()).toBe(1);
    });

    test('Maj dessine un rectangle ; le clavier déplace le groupe et Figé bloque le mouvement', async () => {
        const a = (await carte('scene:temoin-scene-2').boundingBox())!, b = (await carte('scene:temoin-scene-3').boundingBox())!;
        await gmos.fenetre.keyboard.down('Shift');
        await gmos.fenetre.mouse.move(Math.min(a.x, b.x) - 8, Math.min(a.y, b.y) - 8); await gmos.fenetre.mouse.down();
        await gmos.fenetre.mouse.move(Math.max(a.x + a.width, b.x + b.width) + 8, Math.max(a.y + a.height, b.y + b.height) + 8, { steps: 15 });
        await gmos.fenetre.mouse.up(); await gmos.fenetre.keyboard.up('Shift'); await expect(selection()).toHaveCount(2);
        const rectangle = gmos.fenetre.locator('.react-flow__nodesselection-rect');
        await expect(rectangle).toBeVisible(); const cadre = (await rectangle.boundingBox())!;
        const avantCadre = await places();
        await gmos.fenetre.mouse.move(cadre.x + cadre.width / 2, cadre.y + cadre.height / 2); await gmos.fenetre.mouse.down();
        await gmos.fenetre.mouse.move(cadre.x + cadre.width / 2 + 25, cadre.y + cadre.height / 2 - 20, { steps: 15 });
        expect(await ecritures()).toBe(0); await gmos.fenetre.mouse.up(); await expect.poll(ecritures).toBe(1);
        const apresCadre = await places();
        expect(apresCadre['scene:temoin-scene-2']).not.toEqual(avantCadre['scene:temoin-scene-2']);
        expect(apresCadre['scene:temoin-scene-2'].x - avantCadre['scene:temoin-scene-2'].x)
            .toBeCloseTo(apresCadre['scene:temoin-scene-3'].x - avantCadre['scene:temoin-scene-3'].x, 2);
        expect(apresCadre['scene:temoin-scene-2'].y - avantCadre['scene:temoin-scene-2'].y)
            .toBeCloseTo(apresCadre['scene:temoin-scene-3'].y - avantCadre['scene:temoin-scene-3'].y, 2);
        const avant = await places(); await carte('scene:temoin-scene-2').focus(); await gmos.fenetre.keyboard.press('ArrowDown');
        await expect.poll(ecritures).toBe(2); const apres = await places();
        expect(apres['scene:temoin-scene-2'].y - avant['scene:temoin-scene-2'].y).toBe(apres['scene:temoin-scene-3'].y - avant['scene:temoin-scene-3'].y);
        await bouton('Libre').click(); const fige = await places(), n = await ecritures();
        await tirer('scene:temoin-scene-2', 40, 50); await gmos.fenetre.mouse.up(); expect(await places()).toEqual(fige); expect(await ecritures()).toBe(n);
        await gmos.fenetre.setViewportSize({ width: 900, height: 700 }); await bouton('Cadrer la trame').click(); await gmos.fenetre.waitForTimeout(250);
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'groupe-900.png') });
        await bouton('Relier').click(); await expect(selection()).toHaveCount(0);
    });

    test('un filtre retire les cartes masquées de la sélection et les positions reviennent après relance', async () => {
        await choisirDeux(); await tirer('scene:temoin-scene-2', 35, 55); await gmos.fenetre.mouse.up(); await expect.poll(ecritures).toBe(1);
        const avant = await places();
        await gmos.fenetre.getByRole('combobox').first().selectOption('principale'); await expect(selection()).toHaveCount(0);
        await gmos.fenetre.getByRole('combobox').first().selectOption('tout'); expect(await places()).toEqual(avant);
        const ancien = gmos.profil; await gmos.fenetre.waitForTimeout(1000); await gmos.application.close();
        gmos = await lancerGmOs({ preparerLeProfil: profil => fs.cpSync(ancien, profil, { recursive: true }) });
        fs.rmSync(ancien, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 }); await attendreLHydratation(gmos);
        await gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().setCurrentView('trame'));
        await bouton('Graphe').click(); await expect(carte('scene:temoin-scene-3')).toBeVisible();
        expect(await places()).toEqual(avant); await expect(selection()).toHaveCount(0);
    });
});
