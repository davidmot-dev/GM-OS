/** Hôte G2 et composants en fichier local ; aucun lancement de GM-OS ou serveur. */
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { verifierDetecteur } from '../alien/captures-detecteur.mjs';
import { verifierErgonomie } from './captures-ergonomie.mjs';

const racine = fileURLToPath(new URL('../../', import.meta.url));
const sortie = path.join(racine, 'scratch/modules-du-jeu-integration');
await mkdir(sortie, { recursive: true });
const code = await build({ entryPoints: [fileURLToPath(new URL('./apercu-integration.tsx', import.meta.url))],
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{ name: 'store-fictif', setup(b) {
        b.onResolve({ filter: /useSessionOSStore$/ }, () => ({ path: 'store-fictif', namespace: 'demo' }));
        b.onResolve({ filter: /useClientStore$/ }, () => ({ path: 'client-fictif', namespace: 'demo' }));
        b.onLoad({ filter: /.*/, namespace: 'demo' }, args => ({ contents: args.path === 'client-fictif'
            ? 'export const useClientStore = (select) => select(globalThis.identiteDeDemo);'
            : 'export const useSessionOSStore = (select) => select ? select(globalThis.etatDeDemonstration) : globalThis.etatDeDemonstration;', loader: 'js' }));
        b.onLoad({ filter: /[\\/]medias\.mjs$/ }, () => ({ contents: 'export const videoAlerteUrl = "./nostromo-autodestruction.webm";', loader: 'js' }));
    } }],
    loader: { '.css': 'text' },
});
const sourceCss = path.join(racine, 'src/index.css');
const css = await postcss([tailwind()]).process((await readFile(sourceCss, 'utf8')).replaceAll(/^@import url\([^\n]+\);\r?\n/gm, ''), { from: sourceCss });
const fichier = path.join(sortie, 'apercu.html');
const cssModule = await readFile(path.join(racine, 'outils/alien/modules/muthur/style.css'), 'utf8');
const cssDetecteur = await readFile(path.join(racine, 'outils/alien/modules/detecteur/style.css'), 'utf8');
await writeFile(fichier, `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Modules du jeu — banc isolé</title><style>${css.css}\n${cssModule}\n${cssDetecteur}</style><div id="root"></div><script>${code.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></html>`);
await copyFile(path.join(racine, 'outils/alien/medias/nostromo-autodestruction.webm'), path.join(sortie, 'nostromo-autodestruction.webm'));
console.log(`Banc isolé : ${fichier}`);
if (process.argv.includes('--capturer')) {
    let navigateur;
    try { navigateur = await chromium.launch({ headless: true }); }
    catch { navigateur = await chromium.launch({ channel: 'msedge', headless: true }); }
    try {
        const contexte = await navigateur.newContext({ offline: true, reducedMotion: 'reduce' });
        await contexte.route(/^https?:/, route => route.abort());
        await contexte.addInitScript(() => {
            const arc = CanvasRenderingContext2D.prototype.arc, effacer = CanvasRenderingContext2D.prototype.clearRect;
            window.pointsDuModuleDetecteur = [];
            CanvasRenderingContext2D.prototype.clearRect = function (...args) {
                if (this.canvas.classList.contains('detecteur-canvas')) window.pointsDuModuleDetecteur = [];
                return effacer.apply(this, args);
            };
            CanvasRenderingContext2D.prototype.arc = function (...args) {
                if (this.canvas.classList.contains('detecteur-canvas') && args[2] === 3) window.pointsDuModuleDetecteur.push({ x: args[0], y: args[1] });
                return arc.apply(this, args);
            };
        });
        const page = await contexte.newPage(), erreurs = [];
        page.on('pageerror', e => erreurs.push(e.message));
        const photographierModule = async (nom, selecteur = '.gmos-muthur') => {
            const taille = page.viewportSize();
            const module = page.locator(selecteur);
            await page.setViewportSize({ width: taille.width, height: 2600 });
            await module.screenshot({ path: path.join(sortie, nom), quality: 90 });
            await page.setViewportSize(taille);
        };
        for (const largeur of [360, 768, 1180]) {
            await page.setViewportSize({ width: largeur, height: 900 });
            await page.goto(pathToFileURL(fichier).href);
            for (const [vue, bouton] of [['pilote', 'Pilote'], ['mj', 'Cockpit MJ'], ['hub', 'Tablet Hub']]) {
                await page.getByRole('button', { name: bouton, exact: true }).click();
                await page.getByRole('heading', { name: 'Modules du jeu', exact: true }).waitFor();
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${vue} déborde à ${largeur}px`);
                if (vue === 'hub') {
                    assert.equal(await page.locator('[data-hub-tab]').count(), 7);
                    const cibles = await page.locator('[data-hub-tab]').evaluateAll(elements => elements.map(e => { const r = e.getBoundingClientRect(); return { h: r.height, w: r.width, x: r.x, fin: r.right, bas: r.bottom }; }));
                    assert.ok(cibles.every(r => r.h >= 44 && r.w >= 44 && r.x >= 0 && r.fin <= largeur && r.bas <= 900));
                    await page.getByRole('button', { name: 'Direct', exact: true }).click();
                    assert.equal(await page.getByText('Aucun module ouvert par le meneur.').count(), 0);
                    await page.getByRole('button', { name: 'Modules du jeu', exact: true }).click();
                    await page.getByText('Aucun module ouvert par le meneur.').waitFor();
                }
                const image = path.join(sortie, `${vue}-${largeur}.jpg`);
                await page.screenshot({ path: image, fullPage: true, quality: 90 });
                if (process.argv.includes('--manuel') && largeur === 1180 && vue === 'pilote') await copyFile(image, path.join(racine, 'documentation/User Guides/captures/jeu-alien-modules.jpg'));
            }
            await page.getByRole('button', { name: 'Cockpit MJ', exact: true }).click();
            const carteMuthur = page.locator('article').filter({ has: page.getByRole('heading', { name: 'MU/TH/UR 6000', exact: true }) });
            const carteDetecteur = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Détecteur de mouvement', exact: true }) });
            await carteMuthur.getByRole('checkbox', { name: 'Dana Okoro', exact: true }).check();
            await page.waitForFunction(() => document.querySelector('fieldset input')?.checked === true);
            await carteMuthur.getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
            await page.getByRole('heading', { name: 'MU/TH/UR · Poste meneur', exact: true }).waitFor();
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await photographierModule(`pupitre-${largeur}.jpg`);
            if (process.argv.includes('--manuel') && largeur === 1180) await copyFile(path.join(sortie, `pupitre-${largeur}.jpg`), path.join(racine, 'documentation/User Guides/captures/jeu-alien-pupitre-module.jpg'));
            await page.getByRole('button', { name: 'Tablet Hub', exact: true }).click();
            await page.getByRole('button', { name: 'Ouvrir MU/TH/UR 6000', exact: true }).click();
            await page.getByRole('heading', { name: 'MU/TH/UR 6000', exact: true }).waitFor();
            const avant = await page.locator('.muthur-message').count();
            await page.getByRole('button', { name: 'HELP', exact: true }).click();
            await page.waitForFunction(nombre => document.querySelectorAll('.muthur-message').length > nombre, avant);
            await photographierModule(`joueur-${largeur}.jpg`);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            if (process.argv.includes('--manuel') && largeur === 1180) await copyFile(path.join(sortie, `joueur-${largeur}.jpg`), path.join(racine, 'documentation/User Guides/captures/jeu-alien-module-joueur.jpg'));
            await page.getByLabel('Commande ou /M votre question', { exact: true }).fill('CODE OMEGA-10');
            await page.getByRole('button', { name: 'Transmettre', exact: true }).click();
            await page.getByRole('timer', { name: 'Compte à rebours fictif' }).waitFor();
            const film = page.getByLabel('Séquence d’alerte du Nostromo', { exact: true });
            await film.waitFor();
            await page.waitForFunction(() => { const film = document.querySelector('video'); return film && film.readyState >= 2 && film.videoWidth === 640; });
            assert.equal(await film.evaluate(element => element.muted), true);
            await photographierModule(`alerte-${largeur}.jpg`);
            await page.getByRole('button', { name: 'Vue Parker', exact: true }).click();
            await page.getByText('Aucun module ouvert par le meneur.').waitFor();
            assert.equal(await page.locator('.gmos-muthur').count(), 0);
            await page.getByRole('button', { name: 'Cockpit MJ', exact: true }).click();
            await carteMuthur.getByRole('checkbox', { name: 'Dana Okoro', exact: true }).uncheck();
            await page.waitForFunction(() => document.querySelector('fieldset input')?.checked === false);
            await page.getByRole('button', { name: 'Vue Dana Okoro', exact: true }).click();
            await page.getByText('Aucun module ouvert par le meneur.').waitFor();
            await page.screenshot({ path: path.join(sortie, `retrait-${largeur}.jpg`), quality: 90 });

            await page.getByRole('button', { name: 'Cockpit MJ', exact: true }).click();
            await carteMuthur.getByRole('checkbox', { name: 'Dana Okoro', exact: true }).check();
            await carteDetecteur.getByRole('checkbox', { name: 'Parker', exact: true }).check();
            await carteDetecteur.getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
            await page.getByRole('heading', { name: 'Poste meneur', exact: true }).waitFor();
            await page.getByLabel('Contacts', { exact: true }).fill('5');
            await page.getByLabel('Proximité (0 loin · 100 près)', { exact: true }).fill('75');
            await page.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
            await page.getByRole('button', { name: 'Démarrer le scan', exact: true }).click();
            await page.getByRole('img', { name: 'Radar : 5 échos', exact: true }).waitFor();
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await photographierModule(`detecteur-mj-${largeur}.jpg`, '.gmos-detecteur');
            if (process.argv.includes('--manuel') && largeur === 1180) await copyFile(path.join(sortie, `detecteur-mj-${largeur}.jpg`), path.join(racine, 'documentation/User Guides/captures/jeu-alien-detecteur-mj.jpg'));
            await page.getByRole('button', { name: 'Vue Dana Okoro', exact: true }).click();
            await page.getByRole('button', { name: 'Ouvrir MU/TH/UR 6000', exact: true }).waitFor();
            assert.equal(await page.getByRole('button', { name: 'Ouvrir Détecteur de mouvement', exact: true }).count(), 0);
            await page.getByRole('button', { name: 'Vue Parker', exact: true }).click();
            await page.getByRole('button', { name: 'Ouvrir Détecteur de mouvement', exact: true }).click();
            await page.getByRole('img', { name: 'Radar : 5 échos', exact: true }).waitFor();
            assert.equal(await page.locator('.gmos-muthur').count(), 0);
            const points = () => page.locator('.detecteur-canvas').evaluate(canvas => {
                const r = canvas.getBoundingClientRect(), rayon = Math.min(r.width, r.height) * .38;
                return window.pointsDuModuleDetecteur.map(p => ({ x: (p.x - r.width / 2) / rayon, y: (p.y - r.height / 2) / rayon }));
            });
            const parker = await points();
            assert.equal(parker.length, 5);
            for (const p of parker) assert.ok(Math.hypot(p.x, p.y) <= .2 + .25 * .57 + 1e-6);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await photographierModule(`detecteur-joueur-${largeur}.jpg`, '.gmos-detecteur');
            if (process.argv.includes('--manuel') && largeur === 1180) await copyFile(path.join(sortie, `detecteur-joueur-${largeur}.jpg`), path.join(racine, 'documentation/User Guides/captures/jeu-alien-detecteur-joueur.jpg'));
            await page.getByRole('button', { name: 'Cockpit MJ', exact: true }).click();
            await carteDetecteur.getByRole('checkbox', { name: 'Dana Okoro', exact: true }).check();
            await page.getByRole('button', { name: 'Vue Dana Okoro', exact: true }).click();
            await page.getByRole('button', { name: 'Ouvrir Détecteur de mouvement', exact: true }).click();
            await page.getByRole('img', { name: 'Radar : 5 échos', exact: true }).waitFor();
            const dana = await points();
            dana.forEach((p, i) => { assert.ok(Math.abs(p.x - parker[i].x) < 1e-6); assert.ok(Math.abs(p.y - parker[i].y) < 1e-6); });
            await page.getByRole('button', { name: 'Cockpit MJ', exact: true }).click();
            await carteDetecteur.getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
            await page.getByRole('button', { name: 'Faux écho · 9 s', exact: true }).click();
            await page.getByRole('img', { name: 'Radar : 6 échos', exact: true }).waitFor();
            await photographierModule(`detecteur-faux-echo-${largeur}.jpg`, '.gmos-detecteur');
            await carteDetecteur.getByRole('checkbox', { name: 'Dana Okoro', exact: true }).uncheck();
            await page.getByRole('button', { name: 'Vue Dana Okoro', exact: true }).click();
            assert.equal(await page.locator('.gmos-detecteur').count(), 0);
            await page.getByRole('button', { name: 'Vue Parker', exact: true }).click();
            await page.getByRole('button', { name: 'Ouvrir Détecteur de mouvement', exact: true }).click();
            await page.getByRole('img', { name: 'Radar : 6 échos', exact: true }).waitFor();
            await page.getByRole('button', { name: 'Cockpit MJ', exact: true }).click();
            await carteDetecteur.getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
            await page.getByRole('button', { name: 'Tout couper', exact: true }).click();
            await page.getByRole('button', { name: 'Démarrer le scan', exact: true }).waitFor();
            await page.getByRole('button', { name: 'Vue Parker', exact: true }).click();
            await page.getByText('Aucun module ouvert par le meneur.').waitFor();
            await page.screenshot({ path: path.join(sortie, `tout-coupe-${largeur}.jpg`), quality: 90 });
        }
        assert.deepEqual(erreurs, []);
        console.log('33 captures : MU/TH/UR et détecteur, 360/768/1180 px. Accès indépendants, scan partagé, positions bornées, faux écho, retrait partiel et Tout couper vérifiés avec le vrai hôte en mémoire.');
        await contexte.close();
        await verifierDetecteur({ navigateur, url: pathToFileURL(path.join(racine, 'outils/alien/index.html')).href, sortie });
        await verifierErgonomie({ navigateur, url: pathToFileURL(fichier).href,
            autonomeUrl: pathToFileURL(path.join(racine, 'outils/alien/index.html')).href, sortie,
            manuel: process.argv.includes('--manuel') ? path.join(racine, 'documentation/User Guides/captures') : undefined });
    } finally { await navigateur.close(); }
}
