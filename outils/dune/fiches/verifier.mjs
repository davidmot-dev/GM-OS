/** QA hors ligne des deux livrables : coordonnées, saisie, JSON, stockage, armoiries, zoom et impression. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { createCanvas } from '@napi-rs/canvas';
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const dossier = path.join(racine, 'output/fiches/dune'), temporaire = path.join(racine, 'tmp/dune-fiches');
const fichiers = ['Dune_Fiche_PJ_interactive.html', 'Dune_Fiche_Maison_interactive.html'];
const exemples = {
    'identity.name': 'Irulan Vaeth', 'identity.house': 'Maison Vaeth', 'identity.role': 'Émissaire', 'identity.faction': 'Bene Gesserit',
    'identity.personality': 'Observatrice, fidèle à sa Maison, attentive aux non-dits.', 'identity.ambition': 'Assurer l’indépendance de ma Maison.',
    'drives.duty.statement': 'Je sers le bon vouloir de ma Maison.', 'drives.power.statement': 'Le pouvoir exige une volonté sans faille.',
    'drives.faith.statement': 'Ma famille me fait confiance.', 'drives.justice.statement': 'Chacun doit répondre de ses actes.', 'drives.truth.statement': 'Les secrets finissent par se dévoiler.',
    'skills.understand.focuses': 'Politique impériale\nObservation', 'skills.battle.focuses': 'Lames courtes', 'skills.discipline.focuses': 'Maîtrise de soi', 'skills.move.focuses': 'Discrétion', 'skills.communicate.focuses': 'Négociation',
    'traits.talents': 'Hyperacuité\nEntraînement prana-bindu\nLa théorie en pratique', 'assets.notes': 'Couteau dissimulé (qualité 0)\nRéseau de contacts (qualité 1)',
    'house.name': 'Maison Vaeth', 'house.homeworld': 'Caladan', 'house.type': 'Mineure', 'house.traits': 'Discrétion, loyauté et prudence',
    'house.motto': 'Toujours plus haut.', 'house.domains': 'Domaine primaire : transport et commerce d’épice.\nDomaine secondaire : botanique et médicaments.',
};
const rôles = ['Duc Armand', 'Dame Élise', 'Irulan Vaeth', 'Nadir Qassim', 'Leto Verdan', 'Duncan Korr', 'Mira Tey', 'Yara Nore', 'Savel Dorn', 'Naïm Salek', 'Gurney Voss', 'Thufir Vael', 'Dr Sofia'];
const armes = createCanvas(180, 180), ctx = armes.getContext('2d');
ctx.fillStyle = '#324d59'; ctx.fillRect(0, 0, 180, 180); ctx.strokeStyle = '#d3b980'; ctx.lineWidth = 8; ctx.strokeRect(16, 16, 148, 148); ctx.fillStyle = '#d3b980'; ctx.font = 'bold 108px Georgia'; ctx.textAlign = 'center'; ctx.fillText('V', 90, 128);
fs.mkdirSync(temporaire, { recursive: true }); fs.writeFileSync(path.join(temporaire, 'armoiries-test.png'), armes.toBuffer('image/png'));
const navigateur = await chromium.launch({ channel: 'msedge', headless: true });
const rapports = [];
try {
    const contexte = await navigateur.newContext({ viewport: { width: 1360, height: 1080 }, acceptDownloads: true });
    const appels = [], erreurs = [];
    await contexte.route('**/*', route => { const u = new URL(route.request().url()); if (['file:', 'data:', 'blob:'].includes(u.protocol)) return route.continue(); appels.push(u.href); return route.abort(); });
    await contexte.setOffline(true);
    for (const fichier of fichiers) {
        const page = await contexte.newPage(); page.on('pageerror', e => erreurs.push(e.message));
        await page.goto(pathToFileURL(path.join(dossier, fichier)).href);
        const modele = await page.locator('#character-sheet-template').evaluate(el => JSON.parse(el.textContent).template);
        const titre = modele.id === 'dune-pj-fr' ? 'pj' : 'maison';
        const ajusterZoom = async valeur => { await page.locator('#zoom').fill(String(valeur)); await page.locator('#zoom').dispatchEvent('change'); };
        await ajusterZoom(100);
        await page.locator('.background').evaluate(async im => { await im.decode(); });
        await page.locator('.sheet').screenshot({ path: path.join(dossier, `${titre}-vierge.png`) });
        await page.locator('#zones').click();
        assert.equal(await page.locator('.sheet .dune-field').first().evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
        await page.locator('.sheet').screenshot({ path: path.join(dossier, `${titre}-zones.png`) });
        await page.locator('#zones').click();
        let role = 0;
        for (const f of modele.pages[0].fields) {
            const el = page.locator(`[data-key="${f.key}"]`);
            const g = await el.boundingBox(), b = await page.locator('.sheet').boundingBox();
            assert.ok(Math.abs(g.x - b.x - f.x) < .6 && Math.abs(g.y - b.y - f.y) < .6, f.key);
            if (f.type === 'portrait') { await page.locator('[data-key="house.coat_of_arms"]').click(); await page.locator('#portrait-file').setInputFiles(path.join(temporaire, 'armoiries-test.png')); await el.locator('img').waitFor(); continue; }
            const valeur = exemples[f.key] ?? (f.type === 'number' ? f.key.includes('determination') ? '2' : f.key.includes('advancement') ? '12' : f.key.includes('hatred') ? '2' : '6'
                : f.key.includes('house.roles.') ? rôles[role++]
                : f.key.endsWith('.notes') ? 'Rivalité ancienne pour le contrôle des routes commerciales.'
                : f.key.endsWith('.reason') ? 'Commerce d’épice' : f.key.endsWith('.type') ? 'Maison mineure' : `Maison rivale ${f.key.split('.')[2]}`);
            if (f.type === 'select') await el.selectOption(valeur); else await el.fill(valeur);
        }
        await page.waitForFunction(() => document.getElementById('status').textContent.startsWith('Enregistré'));
        await page.locator('.sheet').screenshot({ path: path.join(dossier, `${titre}-remplie.png`) });
        const extraire = () => page.evaluate(() => { const id = JSON.parse(document.getElementById('character-sheet-template').textContent).template.id; return JSON.parse(localStorage.getItem(`character-sheet:${id}:v1`)).data; });
        const attendues = await extraire(); assert.equal(Object.keys(attendues).length, modele.pages[0].fields.length);
        await page.reload(); await page.waitForFunction(() => document.querySelector('.sheet input'));
        assert.deepEqual(await extraire(), attendues);
        const telechargement = page.waitForEvent('download'); await page.locator('#export').click(); const telecharge = await telechargement;
        const exporte = path.join(temporaire, `${titre}-export.json`); await telecharge.saveAs(exporte);
        const json = JSON.parse(fs.readFileSync(exporte)); assert.equal(json.sheet, modele.id); assert.deepEqual(json.data, attendues);
        page.once('dialog', d => d.dismiss()); await page.locator('#reset').click(); assert.deepEqual(await extraire(), attendues);
        page.once('dialog', d => d.accept()); await page.locator('#reset').click(); assert.deepEqual(await extraire(), {});
        await page.locator('#file').setInputFiles(exporte); await page.waitForFunction(() => document.getElementById('status').textContent.startsWith('JSON importé'));
        assert.deepEqual(await extraire(), attendues);
        const mauvaise = path.join(temporaire, `${titre}-invalide.json`), cleNumerique = modele.pages[0].fields.find(f => f.type === 'number').key;
        fs.writeFileSync(mauvaise, JSON.stringify({ ...json, data: { ...json.data, [cleNumerique]: 'pas un nombre' } }));
        await page.locator('#file').setInputFiles(mauvaise); assert.match(await page.locator('#status').textContent(), /Import refusé/); assert.deepEqual(await extraire(), attendues);
        fs.writeFileSync(mauvaise, JSON.stringify({ ...json, sheet: 'autre-modele', templateId: 'autre-modele' }));
        await page.locator('#file').setInputFiles(mauvaise); assert.match(await page.locator('#status').textContent(), /autre modèle/);
        await page.reload();
        await ajusterZoom(100); await page.keyboard.press('Control+='); assert.equal(await page.locator('#zoom').inputValue(), '110'); await page.keyboard.press('Control+-'); assert.equal(await page.locator('#zoom').inputValue(), '100');
        await ajusterZoom(5); assert.equal(await page.locator('#zoom').inputValue(), '20'); await ajusterZoom(450); assert.equal(await page.locator('#zoom').inputValue(), '400'); await page.keyboard.press('Control+0');
        await page.locator('#viewport').hover(); const avant = Number(await page.locator('#zoom').inputValue()); await page.keyboard.down('Control'); await page.mouse.wheel(0, -100); await page.keyboard.up('Control'); assert.equal(Number(await page.locator('#zoom').inputValue()), avant + 10);
        if (titre === 'maison') {
            page.once('dialog', d => d.dismiss()); await page.locator('[data-key="house.coat_of_arms"]').click({ modifiers: ['Shift'] }); assert.ok((await extraire())['house.coat_of_arms']);
            page.once('dialog', d => d.accept()); await page.locator('[data-key="house.coat_of_arms"]').click({ modifiers: ['Shift'] });
            await page.waitForFunction(() => document.getElementById('status').textContent.startsWith('Enregistré'));
            assert.equal((await extraire())['house.coat_of_arms'], '');
            page.once('dialog', d => d.accept()); await page.locator('#file').setInputFiles(exporte);
        }
        await page.emulateMedia({ media: 'print' });
        assert.equal(await page.locator('.toolbar').evaluate(el => getComputedStyle(el).display), 'none');
        const impression = await page.locator('.sheet').boundingBox(); assert.ok(Math.abs(impression.width - 816) < 1 && Math.abs(impression.height - 1056) < 1);
        await page.locator('.sheet').screenshot({ path: path.join(dossier, `${titre}-impression.png`) });
        await page.emulateMedia({ media: 'screen' }); await page.setViewportSize({ width: 390, height: 900 }); await page.locator('#fit').click();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: path.join(dossier, `${titre}-mobile-390.png`) });
        rapports.push({ fichier, templateId: modele.id, champs: modele.pages[0].fields.length, autonomie: true, geometrie: true, sauvegarde: true, importExport: true, mauvaisImportRefuse: true, zoom: true, impression: true, mobile390: true, armoiries: titre === 'maison' });
        await page.close();
    }
    // Import réel des HTML dans le moteur, en bibliothèque jetable du navigateur.
    const moteur = await contexte.newPage(); moteur.on('pageerror', e => erreurs.push(e.message));
    await moteur.goto(pathToFileURL(path.join(racine, 'docs/fiches/Character_Sheet_Manager.html')).href);
    await moteur.waitForFunction(() => !!window.RPGSheet);
    await moteur.evaluate(() => window.RPGSheet.list());
    for (const [i, fichier] of fichiers.entries()) {
        const rapport = rapports[i];
        await moteur.locator('#templateFile').setInputFiles(path.join(dossier, fichier));
        await moteur.waitForFunction(async id => (await window.RPGSheet.list()).templates.some(t => t.id === id), rapport.templateId);
        const donnees = JSON.parse(fs.readFileSync(path.join(temporaire, `${i === 0 ? 'pj' : 'maison'}-export.json`))).data;
        await moteur.evaluate(({ id, data }) => window.RPGSheet.create('Contrôle Dune', id, data), { id: rapport.templateId, data: donnees });
        assert.equal(await moteur.locator('.sheet .dune-field').count(), rapport.champs);
        assert.deepEqual(await moteur.evaluate(() => window.RPGSheet.getData().data), donnees);
        assert.equal(await moteur.locator('.sheet .dune-field').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
        assert.equal(await moteur.locator('.sheet .dune-field').first().evaluate(el => getComputedStyle(el).fontSize), '9.2px');
        if (i === 1) assert.equal(await moteur.locator('[data-key="house.coat_of_arms"] img').evaluate(el => getComputedStyle(el).objectFit), 'contain');
        await moteur.locator('.sheet').screenshot({ path: path.join(dossier, `${i === 0 ? 'pj' : 'maison'}-moteur.png`) });
        rapport.importMoteur = true;
    }
    await moteur.close();
    assert.deepEqual(appels, []); assert.deepEqual(erreurs, []);
    fs.writeFileSync(path.join(dossier, 'verification.json'), JSON.stringify({ fiches: rapports, reseau: appels, erreursJavaScript: erreurs }, null, 2));
    console.log(JSON.stringify(rapports, null, 2));
} finally { await navigateur.close(); }
