import { test, expect, type Page } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';
import type { MagasinDuHub } from '../src/utils/magasinsDuHub';

type Magasins = {
    useMapStore: MagasinDuHub<'useMapStore'>;
    useWhiteboardStore: MagasinDuHub<'useWhiteboardStore'>;
};
let gmos: GmOsLance;
let hub: Page;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Tableau Blanc');
    const cadre = await gmos.application.browserWindow(gmos.fenetre);
    await cadre.evaluate(w => w.webContents.setAudioMuted(true));
    [hub] = await Promise.all([
        gmos.application.waitForEvent('window', { timeout: 15_000 }),
        gmos.fenetre.getByTitle(/Lancer le Player Hub/).first().click(),
    ]);
    await hub.waitForLoadState('domcontentloaded');
    const cadreDuHub = await gmos.application.browserWindow(hub);
    await cadreDuHub.evaluate(w => w.webContents.setAudioMuted(true));
    await expect.poll(() => hub.evaluate(() => {
        const w = window as unknown as Partial<Magasins>;
        return !!w.useMapStore && !!w.useWhiteboardStore;
    })).toBe(true);
});
test.afterAll(async () => { await gmos?.fermer(); });

/** Vrai IPC entre deux renderers : aucun relais remplacé, aucune donnée personnelle. */
test('le Hub déplace et dessine sans reprendre les cibles du MJ', async () => {
    await gmos.fenetre.evaluate(() => {
        const w = window as unknown as Magasins;
        const token = { id: 'relais-pj', name: 'PJ témoin', avatar: '', x: 10, y: 20, size: 1 };
        w.useMapStore.setState({ tokens: [token], projectedTokens: [token], projectionTarget: 'hub', ecranDeLaCarte: 'moniteur-temoin' });
        w.useWhiteboardStore.setState({ paths: [], activePath: null, projectionTarget: 'hub' });
    });
    await expect.poll(() => hub.evaluate(() => {
        const w = window as unknown as Magasins;
        return [w.useMapStore.getState().projectedTokens[0]?.x, w.useWhiteboardStore.getState().projectionTarget];
    })).toEqual([10, 'hub']);

    // Le Hub n'est pas l'autorité de projection. Sa copie peut être en retard.
    await hub.evaluate(() => {
        const w = window as unknown as Magasins;
        const map = w.useMapStore.getState();
        w.useMapStore.setState({ projectionTarget: null, ecranDeLaCarte: null,
            projectedTokens: map.projectedTokens.map(t => ({ ...t, x: 70, y: 80 })) });
        w.useWhiteboardStore.setState({ projectionTarget: null });
        w.useWhiteboardStore.getState().finishDrawing({ id: 'trait-du-hub',
            points: [{ x: 0.2, y: 0.3 }, { x: 0.4, y: 0.5 }], color: '#fff', width: 3, tool: 'brush' });
    });
    await expect.poll(() => gmos.fenetre.evaluate(() => {
        const w = window as unknown as Magasins;
        const map = w.useMapStore.getState();
        const wb = w.useWhiteboardStore.getState();
        return { position: [map.tokens[0]?.x, map.tokens[0]?.y], cibleCarte: map.projectionTarget,
            moniteur: map.ecranDeLaCarte, cibleTableau: wb.projectionTarget,
            trait: wb.paths.some(p => p.id === 'trait-du-hub') };
    })).toEqual({ position: [70, 80], cibleCarte: 'hub', moniteur: 'moniteur-temoin', cibleTableau: 'hub', trait: true });
    await expect.poll(() => hub.evaluate(() => {
        const w = window as unknown as Magasins;
        return [w.useMapStore.getState().projectionTarget, w.useWhiteboardStore.getState().projectionTarget];
    })).toEqual(['hub', 'hub']);
});
