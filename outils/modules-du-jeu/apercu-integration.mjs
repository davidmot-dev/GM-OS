/** Composants de G0/G1 en fichier local ; aucun lancement de GM-OS ou serveur. */
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const racine = fileURLToPath(new URL('../../', import.meta.url));
const sortie = path.join(racine, 'scratch/modules-du-jeu-integration');
await mkdir(sortie, { recursive: true });
const code = await build({ entryPoints: [fileURLToPath(new URL('./apercu-integration.tsx', import.meta.url))],
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{ name: 'store-fictif', setup(b) {
        b.onResolve({ filter: /useSessionOSStore$/ }, () => ({ path: 'store-fictif', namespace: 'demo' }));
        b.onLoad({ filter: /.*/, namespace: 'demo' }, () => ({ contents: 'export const useSessionOSStore = () => globalThis.etatDeDemonstration;', loader: 'js' }));
    } }],
});
const sourceCss = path.join(racine, 'src/index.css');
const css = await postcss([tailwind()]).process((await readFile(sourceCss, 'utf8')).replaceAll(/^@import url\([^\n]+\);\r?\n/gm, ''), { from: sourceCss });
const fichier = path.join(sortie, 'apercu.html');
await writeFile(fichier, `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Modules du jeu — banc isolé</title><style>${css.css}</style><div id="root"></div><script>${code.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></html>`);
console.log(`Banc isolé : ${fichier}`);
if (process.argv.includes('--capturer')) {
    let navigateur;
    try { navigateur = await chromium.launch({ headless: true }); }
    catch { navigateur = await chromium.launch({ channel: 'msedge', headless: true }); }
    try {
        const contexte = await navigateur.newContext({ offline: true, reducedMotion: 'reduce' });
        await contexte.route(/^https?:/, route => route.abort());
        const page = await contexte.newPage(), erreurs = [];
        page.on('pageerror', e => erreurs.push(e.message));
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
        }
        assert.deepEqual(erreurs, []);
        console.log('9 captures : pilote, cockpit et fragment Hub, 360/768/1180 px ; navigation, cibles tactiles et absence de débordement vérifiées.');
        await contexte.close();
    } finally { await navigateur.close(); }
}
