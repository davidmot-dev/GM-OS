import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

type Temoin = Window & { useSessionOSStore: typeof useSessionOSStore; ecrituresJonctions: number };
const ID = JSON.stringify(['enchainement', 'scene:temoin-scene-2', 'scene:temoin-scene-3']);
const SORTIE = path.resolve('documentation/Planning/graphe-trame/prise-jonctions');
const ACCROCHES = { haut: 'haut', bas: 'bas', gauche: 'entree', droite: 'sortie' };
type Cote = keyof typeof ACCROCHES;
let gmos: GmOsLance;
const bouton = (nom: string) => gmos.fenetre.getByRole('button', { name: nom, exact: true });
const lien = () => gmos.fenetre.locator(`.react-flow__edge[data-id='${ID}']`);
const accroche = (extremite: 'source' | 'target', cote: Cote) => gmos.fenetre.locator(
    `.react-flow__node[data-id='scene:temoin-scene-${extremite === 'source' ? 2 : 3}'] [data-handleid='${ACCROCHES[cote]}']`);
const positions = () => gmos.fenetre.locator('.react-flow__node').evaluateAll(elements => elements.map(el => ({ id: el.getAttribute('data-id'), transform: (el as HTMLElement).style.transform })));
const etat = () => gmos.fenetre.evaluate(() => {
    const s = (window as Temoin).useSessionOSStore.getState();
    return { campagne: s.campaigns.find(c => c.id === s.activeCampaignId), scenes: s.scenes };
});
const ecritures = () => gmos.fenetre.evaluate(() => (window as Temoin).ecrituresJonctions);
async function zoom(agrandi: boolean) {
    await bouton('Cadrer la trame').click(); await gmos.fenetre.waitForTimeout(250);
    // Le zoom rapproché reste cadré : agrandir davantage placerait une cible
    // derrière l'inspecteur, ce qui n'est pas un échec de sa zone de saisie.
    for (let i = 0; i < (agrandi ? 0 : 2); i++) await bouton('Réduire').click();
    await gmos.fenetre.waitForTimeout(250);
}
async function verifier(depart: Cote, arrivee: Cote) {
    await expect(gmos.fenetre.getByLabel('Côté de départ', { exact: true })).toHaveValue(depart);
    await expect(gmos.fenetre.getByLabel('Côté d’arrivée', { exact: true })).toHaveValue(arrivee);
    for (const [extremite, cote] of [['source', depart], ['target', arrivee]] as const) {
        await expect.poll(async () => {
            const b = (await accroche(extremite, cote).boundingBox())!;
            const p = await lien().locator('.react-flow__edge-path').evaluate((el: SVGPathElement, debut) => {
                const point = el.getPointAtLength(debut ? 0 : el.getTotalLength()), m = el.getScreenCTM()!;
                return { x: point.x * m.a + point.y * m.c + m.e, y: point.x * m.b + point.y * m.d + m.f };
            }, extremite === 'source');
            return Math.hypot(p.x - (b.x + (cote === 'gauche' ? 0 : cote === 'droite' ? b.width : b.width / 2)),
                p.y - (b.y + (cote === 'haut' ? 0 : cote === 'bas' ? b.height : b.height / 2)));
        }).toBeLessThan(1);
    }
}
async function glisser(extremite: 'source' | 'target', cote: Cote) {
    const cercle = (await lien().locator(`.react-flow__edgeupdater-${extremite}`).boundingBox())!;
    // La cible de saisie doit rester confortable à l'écran, y compris dézoomée.
    expect(cercle.width).toBeGreaterThanOrEqual(27); expect(cercle.height).toBeGreaterThanOrEqual(27);
    const b = (await accroche(extremite, cote).boundingBox())!;
    await gmos.fenetre.mouse.move(cercle.x + cercle.width / 2 + 10, cercle.y + cercle.height / 2);
    await gmos.fenetre.mouse.down();
    // Relâcher près du point, sans viser son centre au pixel : attraction de 24 px.
    await gmos.fenetre.mouse.move(b.x + b.width / 2 + (cote === 'haut' || cote === 'bas' ? 18 : 0),
        b.y + b.height / 2 + (cote === 'gauche' || cote === 'droite' ? 18 : 0), { steps: 18 });
    await gmos.fenetre.mouse.up();
}

test.describe('prise des jonctions de Trame', () => {
    test.setTimeout(120_000);
    test.beforeEach(async () => {
        fs.mkdirSync(SORTIE, { recursive: true }); gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 }); await attendreLHydratation(gmos);
        await gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().setCurrentView('trame'));
        await bouton('Graphe').click(); await expect(gmos.fenetre.locator(".react-flow__node[data-id='scene:temoin-scene-3']")).toBeVisible();
        await gmos.fenetre.evaluate(id => {
            const s = (window as Temoin).useSessionOSStore.getState();
            s.ajouterUnEnchainement('temoin-scene-2', 'temoin-scene-3', 'si Hale se tait');
            s.stylerLeLienDeTrame(s.activeCampaignId!, id, { trace: 'points', epaisseur: 'gras', couleur: '#8b5cf6' });
        }, ID);
        await lien().focus(); await gmos.fenetre.keyboard.press('Enter');
        await expect(gmos.fenetre.getByLabel('Inspecteur de lien')).toBeVisible();
        await gmos.fenetre.evaluate(() => {
            const w = window as Temoin; w.ecrituresJonctions = 0;
            w.useSessionOSStore.subscribe((s, avant) => { if (s.campaigns !== avant.campaigns) w.ecrituresJonctions++; });
        });
    });
    test.afterEach(async () => {
        await gmos.application.close(); fs.rmSync(gmos.profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    });

    test('cliquer près des quatre points ou utiliser le clavier déplace les côtés sans saisir une extrémité', async () => {
        const avant = await etat(), places = await positions();
        for (const agrandi of [false, true]) {
            await zoom(agrandi);
            for (const cote of ['haut', 'bas', 'gauche', 'droite'] as const) {
                for (const extremite of ['source', 'target'] as const) {
                    const b = (await accroche(extremite, cote).boundingBox())!;
                    // 10 px du centre : hors du point visible, mais dans sa zone de clic.
                    await gmos.fenetre.mouse.click(b.x + b.width / 2 + (cote === 'haut' || cote === 'bas' ? 10 : 0),
                        b.y + b.height / 2 + (cote === 'gauche' || cote === 'droite' ? 10 : 0));
                    await expect(gmos.fenetre.getByLabel(extremite === 'source' ? 'Côté de départ' : 'Côté d’arrivée', { exact: true })).toHaveValue(cote);
                }
                await verifier(cote, cote);
            }
        }
        await accroche('source', 'bas').focus(); await gmos.fenetre.keyboard.press('Enter');
        await accroche('target', 'haut').focus(); await gmos.fenetre.keyboard.press('Space'); await verifier('bas', 'haut');
        await gmos.fenetre.keyboard.press('ArrowDown'); expect(await positions()).toEqual(places);
        expect(await etat()).toEqual(avant); expect(await ecritures()).toBe(0);
        await zoom(false); await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'points-cliquables-1440.png') });
        await bouton('Appliquer').click(); expect(await ecritures()).toBe(1);
        expect((await etat()).campagne?.stylesDesLiensDeTrame?.[ID]).toMatchObject({ depart: 'bas', arrivee: 'haut', couleur: '#8b5cf6', trace: 'points', epaisseur: 'gras' });
    });

    test('les cercles gardent leur taille et acceptent un dépôt imprécis à deux zooms, sans déplacer les cartes', async () => {
        const avant = await etat(), places = await positions();
        for (const agrandi of [false, true]) {
            await zoom(agrandi); await glisser('source', 'bas'); await glisser('target', 'haut'); await verifier('bas', 'haut');
            expect(await positions()).toEqual(places); expect(await etat()).toEqual(avant); expect(await ecritures()).toBe(0);
            await bouton('Annuler les réglages').click();
        }
        await gmos.fenetre.setViewportSize({ width: 900, height: 700 }); await zoom(false);
        await gmos.fenetre.getByLabel('Inspecteur de lien').evaluate(el => { el.scrollTop = 0; });
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'points-cliquables-900.png') });
        await gmos.fenetre.keyboard.press('Escape'); expect(await etat()).toEqual(avant); expect(await ecritures()).toBe(0);
    });
});
