import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';

// Vrai magasin de projection, vrai service et IPC ; fichiers/base jetables.
// Le cadre YouTube est servi localement par Playwright, sans accès à YouTube.
let gmos: GmOsLance;
let projecteur: Page;
let cible: string;
let imageA: string;
let imageB: string;
const premierPlan = () => projecteur.getByAltText('GM-OS Projector');
const imageAffichee = (adresse: string) => projecteur.locator(`img[alt="GM-OS Projector"][src="${adresse}"]`);
const couche = () => premierPlan().locator('xpath=../..');
type FenetreDeTest = Window & { verificationDeLExtinction?: Promise<boolean> };
async function projeter(source: string) {
    await gmos.fenetre.evaluate(({ source, cible }) => {
        const images = window.useImageStore.getState();
        images.setProjectionTarget(cible);
        return images.projectUrl(source);
    }, { source, cible });
}

async function verifierLeRetraitImmediat(selecteur: string) {
    await projecteur.evaluate(selecteur => {
        (window as FenetreDeTest).verificationDeLExtinction = new Promise<boolean>(resolve => {
            const retirer = window.appBridge!.image.onUpdateDisplay(sources => {
                if (sources[0] !== 'EMPTY') return;
                retirer(); requestAnimationFrame(() => resolve(document.querySelector(selecteur) === null));
            });
        });
    }, selecteur);
    await projeter('EMPTY');
    expect(await projecteur.evaluate(() => (window as FenetreDeTest).verificationDeLExtinction)).toBe(true);
}

test.beforeAll(async () => {
    gmos = await lancerGmOs({ preparerLeProfil: profil => {
        const corpus = path.join(profil, 'corpus'); fs.mkdirSync(corpus, { recursive: true });
        const a = path.join(corpus, 'projecteur-a.png'); const b = path.join(corpus, 'projecteur-b.png');
        fs.copyFileSync(new URL('./donnees/demo-relais.png', import.meta.url), a);
        fs.copyFileSync(new URL('./donnees/demo-alerte.png', import.meta.url), b);
        imageA = 'gmos://media/' + a.replace(/\\/g, '/'); imageB = 'gmos://media/' + b.replace(/\\/g, '/');
    } });
    await attendreLHydratation(gmos);
    cible = await gmos.fenetre.evaluate(async () => {
        const affichages = await window.appBridge!.image.getDisplays();
        if (!affichages.length) throw new Error('Aucun affichage pour le projecteur');
        return String(affichages[0].id);
    });
    const ouverture = gmos.application.waitForEvent('window'); await projeter(imageA); projecteur = await ouverture;
    await premierPlan().waitFor({ timeout: 20_000 });
});
test.afterAll(async () => { await gmos?.fermer(); });

test('le projecteur redemande l’image au chargement, croise deux images et s’éteint en 700 ms', async () => {
    await projecteur.reload(); await expect(imageAffichee(imageA)).toHaveCount(1);
    await projeter(imageB); await expect(imageAffichee(imageB)).toHaveCount(1);
    await expect(projecteur.locator(`img[src="${imageA}"]`)).toHaveCount(2);
    await expect(premierPlan().locator('xpath=..')).toHaveCSS('animation-duration', '0.7s');
    await expect(projecteur.locator(`img[src="${imageA}"]`)).toHaveCount(0);
    await projeter('EMPTY'); await expect(couche()).toHaveCSS('transition-duration', '0.7s');
    await expect(couche()).toHaveAttribute('style', /opacity: 0/); await expect(premierPlan()).toHaveCount(0);
});

test('une nouvelle image pendant la sortie reste affichée après l’ancienne échéance', async () => {
    await projeter(imageA); await expect(imageAffichee(imageA)).toHaveCount(1);
    await projeter('EMPTY'); await expect(couche()).toHaveAttribute('style', /opacity: 0/);
    await projeter(imageB); await expect(imageAffichee(imageB)).toHaveCount(1);
    await expect(couche()).toHaveAttribute('style', /opacity: 1/);
    // Vérifie au-delà du délai annulé, sans imposer le temps de décodage.
    await projecteur.waitForTimeout(800); await expect(imageAffichee(imageB)).toHaveCount(1);
});

test('une vidéo de la base respecte le son et la boucle, puis disparaît immédiatement', async () => {
    await projecteur.evaluate(async () => {
        const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
        const contexte = canvas.getContext('2d')!;
        const flux = canvas.captureStream(30); const morceaux: Blob[] = [];
        const enregistreur = new MediaRecorder(flux, { mimeType: 'video/webm' });
        const fini = new Promise<void>(resolve => { enregistreur.onstop = () => resolve(); });
        enregistreur.ondataavailable = e => { if (e.data.size) morceaux.push(e.data); }; enregistreur.start();
        for (let i = 0; i < 18; i++) {
            contexte.fillStyle = i % 2 ? '#16a34a' : '#2563eb'; contexte.fillRect(0, 0, 64, 64);
            await new Promise<void>(resolve => setTimeout(resolve, 35));
        }
        enregistreur.stop(); await fini; flux.getTracks().forEach(piste => piste.stop());
        const blob = new Blob(morceaux, { type: 'video/webm' });
        if (!blob.size) throw new Error('La vidéo d’essai est vide');
        const base = await new Promise<IDBDatabase>((resolve, reject) => {
            const demande = indexedDB.open('gmos-media-db', 5);
            demande.onsuccess = () => resolve(demande.result); demande.onerror = () => reject(demande.error);
        });
        const transaction = base.transaction('media', 'readwrite');
        transaction.objectStore('media').put({ id: 'm-video-projecteur', name: 'Essai.webm', type: 'video',
            blob, size: blob.size, createdAt: 0, tags: [], campaignIds: [], boucler: false });
        await new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
        }); base.close();
    });
    // Le nouveau démarrage charge les métadonnées de cette seule base jetable.
    await projecteur.reload(); await expect(imageAffichee(imageB)).toHaveCount(1);
    await gmos.fenetre.evaluate(() => window.useImageStore.getState().setVolumeVideo(0.25));
    await projeter('m-video-projecteur'); const film = projecteur.locator('video');
    await expect(film).toHaveCount(1); await expect(film).toHaveJSProperty('volume', 0.25);
    await expect(film).toHaveJSProperty('loop', false); await expect(film).toHaveAttribute('src', /^data:video\/webm;base64,/);
    await expect.poll(() => film.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
    // Observe le retrait à la prochaine frame qui suit la commande reçue.
    await verifierLeRetraitImmediat('video'); await expect(film).toHaveCount(0);
});

test('le cadre YouTube apparaît au marqueur et se retire sans délai ni accès au réseau', async () => {
    await projecteur.route('https://www.youtube-nocookie.com/**', route => route.fulfill({
        contentType: 'text/html', body: '<!doctype html><title>Lecteur isolé</title>',
    }));
    await projeter('__youtube__dQw4w9WgXcQ');
    const cadre = projecteur.getByTitle('Vidéo YouTube projetée');
    await expect(cadre).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    await verifierLeRetraitImmediat('iframe'); await expect(cadre).toHaveCount(0);
});

test('le noir demandé au magasin ferme le projecteur et oublie son occupation', async () => {
    await projeter(imageA); await expect(imageAffichee(imageA)).toHaveCount(1);
    const fermeture = projecteur.waitForEvent('close');
    await gmos.fenetre.evaluate(() => window.useImageStore.getState().blackout()); await fermeture;
    const occupation = await gmos.fenetre.evaluate(cible => window.useImageStore.getState().projections[cible], cible);
    expect(occupation).toBeNull();
});
