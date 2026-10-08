import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import { FONDU_COTE_JOUEURS_MS } from '../src/modules/image/useFonduCroise';

// Les deux images du dépôt voyagent par le vrai pont IPC vers une fenêtre Hub.
// Aucun profil réel ni capture du manuel ; le décodage lent est piloté dans le test.
let imageA: string;
let imageB: string;
let gmos: GmOsLance;
let hub: Page;
type DecodagePilote = Window & {
    libererLeDecodage?: () => void;
    retablirLeDecodage?: () => void;
};

const couche = (image: string) => hub.locator(`div[style*="background-image"][style*="${image}"]`);
async function projeter(image: string) {
    await gmos.fenetre.evaluate(image => {
        if (!window.appBridge?.image) throw new Error('Pont des images absent');
        window.appBridge.image.syncHubData('image', image);
    }, image);
}

test.beforeAll(async () => {
    gmos = await lancerGmOs({ preparerLeProfil: profil => {
        const corpus = path.join(profil, 'corpus');
        fs.mkdirSync(corpus, { recursive: true });
        const cheminA = path.join(corpus, 'image-a.png');
        const cheminB = path.join(corpus, 'image-b.png');
        fs.copyFileSync(new URL('./donnees/demo-relais.png', import.meta.url), cheminA);
        fs.copyFileSync(new URL('./donnees/demo-alerte.png', import.meta.url), cheminB);
        imageA = 'gmos://media/' + cheminA.replace(/\\/g, '/');
        imageB = 'gmos://media/' + cheminB.replace(/\\/g, '/');
    } });
    await attendreLHydratation(gmos);
    const ouverture = gmos.application.waitForEvent('window');
    await gmos.fenetre.evaluate(() => {
        if (!window.appBridge?.session) throw new Error('Pont de la session absent');
        window.appBridge.session.launchHubWindow();
    });
    hub = await ouverture;
    await hub.locator('.font-cinematic.cursor-default').waitFor({ timeout: 20_000 });
});
test.afterEach(async () => {
    await hub?.evaluate(() => (window as DecodagePilote).retablirLeDecodage?.());
});
test.afterAll(async () => { await gmos?.fermer(); });

test('le Hub croise deux images puis éteint la dernière en une seconde et demie', async () => {
    await projeter(imageA);
    await expect(couche(imageA)).toHaveCount(1);
    await projeter(imageB);
    await expect(couche(imageB)).toHaveCount(1);
    await expect(couche(imageA)).toHaveCount(1);
    await expect(couche(imageB)).toHaveCSS('animation-name', 'gmos-fondu-entrant');
    await expect(couche(imageB)).toHaveCSS('animation-duration', `${FONDU_COTE_JOUEURS_MS / 1000}s`);
    await expect(couche(imageA)).toHaveCount(0);

    await projeter('');
    await expect(couche(imageB)).toHaveCSS('animation-name', 'gmos-fondu-sortant');
    await expect(couche(imageB)).toHaveCSS('animation-duration', `${FONDU_COTE_JOUEURS_MS / 1000}s`);
    await expect(couche(imageB)).toHaveCount(0);
});

test('un décodage retardé garde l’ancienne image et ne rallume pas le Hub après extinction', async () => {
    await projeter(imageA);
    await expect(couche(imageA)).toHaveCount(1);
    await hub.evaluate(image => {
        const decode = HTMLImageElement.prototype.decode;
        const pilote = window as DecodagePilote;
        pilote.retablirLeDecodage = () => { HTMLImageElement.prototype.decode = decode; };
        HTMLImageElement.prototype.decode = function () {
            const pret = decode.call(this);
            return this.src === image
                ? pret.then(() => new Promise<void>(resolve => { pilote.libererLeDecodage = resolve; }))
                : pret;
        };
    }, imageB);
    await projeter(imageB);
    await expect.poll(() => hub.evaluate(() => typeof (window as DecodagePilote).libererLeDecodage)).toBe('function');
    await expect(couche(imageA)).toHaveCount(1);
    await expect(couche(imageB)).toHaveCount(0);

    await projeter('');
    await expect(couche(imageA)).toHaveCSS('animation-name', 'gmos-fondu-sortant');
    await expect(couche(imageA)).toHaveCount(0);
    await hub.evaluate(async () => {
        (window as DecodagePilote).libererLeDecodage?.();
        // Laisse la promesse se résoudre et React traiter les éventuels rendus.
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    await expect(couche(imageA)).toHaveCount(0);
    await expect(couche(imageB)).toHaveCount(0);
});
