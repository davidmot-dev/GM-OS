import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
const jeu = process.argv[2] ?? 'cthulhu-hack';
assert.ok(['cthulhu-hack', 'noc', 'alien', 'reve-de-dragon', 'dune', 'nephilim'].includes(jeu));
const dossier = path.resolve('output/campagnes-tests', jeu);
fs.mkdirSync(path.join(dossier, 'captures'), { recursive: true });
const navigateur = await chromium.launch({ channel: 'msedge', headless: true });
try {
    const contexte = await navigateur.newContext({ viewport: { width: 1200, height: 800 } });
    await contexte.setOffline(true);
    const page = await contexte.newPage();
    const fichiers = fs.readdirSync(path.join(dossier, 'assets/images'));
    for (const nom of fichiers) {
        const donnees = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(dossier, 'assets/images', nom)).toString('base64');
        const rendu = await page.evaluate(src => new Promise(resoudre => { const img = new Image(); img.onload = () => resoudre(img.naturalWidth > 0 && img.naturalHeight > 0); img.onerror = () => resoudre(false); img.src = src; }), donnees);
        assert.equal(rendu, true, nom);
    }
    const audios = fs.readdirSync(path.join(dossier, 'assets/audio'));
    for (const nom of audios) {
        const octets = [...fs.readFileSync(path.join(dossier, 'assets/audio', nom))];
        const duree = await page.evaluate(async data => { const audio = new AudioContext(); try { return (await audio.decodeAudioData(new Uint8Array(data).buffer)).duration; } finally { await audio.close(); } }, octets);
        assert.equal(duree, 4, nom);
    }
    for (const slug of jeu === 'noc' ? ['carte-refuge', 'cabale', 'indice-convocation'] : jeu === 'alien' ? ['carte-sas', 'iskra', 'indice-appel'] : jeu === 'reve-de-dragon' ? ['carte-auberge', 'compagnie', 'indice-lettre'] : jeu === 'nephilim' ? ['carte-atelier', 'pentacle', 'indice-releve'] : jeu === 'dune' ? ['carte-residence', 'maison', 'indice-ordre'] : ['carte-port', 'pj-thomas', 'indice-telegramme']) {
        await page.goto(pathToFileURL(path.join(dossier, 'assets/images', slug + '.svg')).href);
        await page.locator('svg').screenshot({ path: path.join(dossier, 'captures', `rendu-${slug}.jpg`), type: 'jpeg', quality: 85 });
    }
    fs.writeFileSync(path.join(dossier, 'verification-medias.json'), JSON.stringify({ reussi: true, navigateur: 'Edge Chromium', horsLigne: true, imagesDecodees: fichiers.length, wavDecodes: audios.length, dureeWavSecondes: 4 }, null, 2));
} finally { await navigateur.close(); }
