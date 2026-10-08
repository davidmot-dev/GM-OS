import { test, expect, type Page } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import type { useDiceStore } from '../src/stores/useDiceStore';

let gmos: GmOsLance;
let hub: Page;
type Magasins = { useDiceStore: typeof useDiceStore };
const panneau = (titre: string) => hub.locator('div.fixed.inset-0').filter({
    has: hub.getByRole('heading', { name: titre, exact: true }),
});
const des = () => hub.locator('div.fixed.inset-0.z-\\[80\\]');
async function projeter(titre: string, en3D: boolean) {
    await gmos.fenetre.evaluate(({ titre, en3D }) => {
        const magasin = (window as unknown as Magasins).useDiceStore.getState();
        magasin.setEnable3D(en3D);
        magasin.setLastRoll({ id: `jet-${titre}`, timestamp: new Date(), title: titre,
            total: 6, totalDisplay: '6', modifier: 0, rolls: [{ val: 6, sides: 6 }] });
        magasin.setIsDiceProjected(true);
        magasin.triggerDiceProjection();
    }, { titre, en3D });
    await expect(panneau(titre)).toHaveCount(1);
    await expect(panneau(titre)).toHaveClass(/opacity-100/);
}

test.beforeAll(async () => {
    gmos = await lancerGmOs();
    await attendreLHydratation(gmos);
    const ouverture = gmos.application.waitForEvent('window');
    await gmos.fenetre.evaluate(() => {
        if (!window.appBridge?.session) throw new Error('Pont de session absent');
        window.appBridge.session.launchHubWindow();
    });
    hub = await ouverture;
    await hub.locator('.font-cinematic.cursor-default').waitFor({ timeout: 20000 });
});
test.afterAll(async () => { await gmos?.fermer(); });

test('le vrai pont projette un résultat 2D puis son filet le ferme', async () => {
    await projeter('Lecture 2D', false);
    await expect(des()).toHaveClass(/opacity-0/);
    await expect(panneau('Lecture 2D')).toHaveClass(/opacity-0/, { timeout: 7000 });
});

test('un second jet projeté pendant le premier reçoit sa fenêtre de lecture', async () => {
    await projeter('Premier jet', false);
    await hub.waitForTimeout(2000);
    await projeter('Second jet', false);
    await hub.waitForTimeout(3300);
    await expect(panneau('Second jet')).toHaveClass(/opacity-100/);
    await expect(panneau('Second jet')).toHaveClass(/opacity-0/, { timeout: 4000 });
});

test('la vraie scène 3D s’efface puis le résultat reste pour la lecture', async () => {
    await projeter('Lecture après pose', true);
    await expect(des()).toHaveClass(/opacity-100/);
    await expect(des().locator('canvas')).toHaveCount(1);
    await expect(des()).toHaveClass(/opacity-0/, { timeout: 9000 });
    await expect(panneau('Lecture après pose')).toHaveClass(/opacity-100/);
    await hub.waitForTimeout(3000);
    await expect(panneau('Lecture après pose')).toHaveClass(/opacity-100/);
    await expect(panneau('Lecture après pose')).toHaveClass(/opacity-0/, { timeout: 4000 });
});
