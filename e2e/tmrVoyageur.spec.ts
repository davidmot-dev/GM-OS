import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { lancerGmOs, attendreLHydratation } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { VueTMRMJ } from '../outils/reve-de-dragon/tmr/moteur.mjs';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pilote = path.join(racine, 'Export Dirvers/corriges/RDD_driver_gmos_r0-consolide.gmos-driver');
const sortie = path.join(racine, 'scratch/reve-de-dragon-r8/captures');
test.skip(!fs.existsSync(pilote), 'Export R0 requis, aucune lecture du profil personnel.');
test.use({ channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block' });
test('TMR : MJ, deux joueurs privés, trajet arbitré, reconnexion et révocation', async ({ browser }) => {
    test.setTimeout(130_000);
    const exporte = JSON.parse(new AdmZip(pilote).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync(path.join(racine, 'e2e/donnees/campagne-de-demo.json'), 'utf8'));
    const s = semence.modules.sessionOS;
    s.customGameDrivers = [{ ...exporte.gameDriver, modulesDuJeu: [{ id: 'rdd-tmr' }] }]; s.customSheetTemplates = [exporte.sheetTemplate];
    s.campaigns = [{ id: 'r8', name: 'Demi-rêves fictifs', system: exporte.gameDriver.id, systemPath: 'systems/reves de dragons', description: '', activeLocationIds: [] }]; s.activeCampaignId = 'r8';
    s.sessions = [{ ...s.sessions[0], id: 's8', campaignId: 'r8', status: 'active', sessionEntityIds: ['p0', 'p1'] }]; s.currentView = 'cockpit';
    s.players = ['Aline', 'Boran'].map((nom, i) => ({ id: 'j' + i, realName: nom, avatarUrl: '', isOnline: false, characters: [{
        id: 'p' + i, name: nom, portraitUrl: '', templateId: exporte.sheetTemplate.id, systemId: exporte.gameDriver.id, campaignId: 'r8', hp: 12, maxHp: 12,
        sheetData: { taille: 12, constitution: 12, volonte: 12, reve: 14, reve_pts: 12, fatigue: 0, endurance: 24, endurance_max: 24, vie: 12, vie_max: 12, __rddReprise231: 1, __rddFatigue231: 1 },
    }] }));
    const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-r8-semence-')); const fichier = path.join(dossier, 'semence.json');
    fs.writeFileSync(fichier, JSON.stringify(semence)); fs.mkdirSync(sortie, { recursive: true });
    const app = await lancerGmOs({ semence: fichier }); const contextes = [];
    try {
        await attendreLHydratation(app); const f = app.fenetre;
        const cadre = await app.application.browserWindow(f); await cadre.evaluate(w => { w.unmaximize(); w.setContentSize(1460, 1100); });
        await f.evaluate(() => (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore.getState().setCurrentView('cockpit'));
        await f.getByRole('button', { name: 'Modules du jeu', exact: true }).click();
        await f.getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
        const module = f.getByRole('region', { name: 'Terres Médianes du Rêve', exact: true });
        await expect(module).toBeVisible();
        const carte = module.getByRole('img', { name: 'Carte officielle en couleur des Terres Médianes du Rêve' });
        await expect.poll(() => carte.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 900 && image.naturalHeight === 1000)).toBe(true);
        // Les repères du livre, p. 180, vérifient aussi l'alignement des zones tactiles :
        // origine (49, 50), cases de 60 px, colonnes impaires décalées de 30 px.
        for (const [nom, id, x, y] of [
            ["J4 · Collines d'ENCRE", 'J4', 619, 290],
            ['D13 · Cité SORDIDE', 'D13', 259, 830],
            ['G4 · Sanctuaire BLANC', 'G4', 439, 260],
        ] as const) {
            const terre = module.getByRole('button', { name: nom, exact: true });
            await terre.scrollIntoViewIfNeeded();
            const image = (await carte.boundingBox())!, zone = (await terre.boundingBox())!;
            expect(zone.x + zone.width / 2 - image.x).toBeCloseTo(x, 0);
            expect(zone.y + zone.height / 2 - image.y).toBeCloseTo(y, 0);
            await terre.click();
            await expect(module.getByLabel('Case sélectionnée', { exact: true })).toHaveValue(id);
        }
        await module.getByRole('button', { name: 'Placer le demi-rêve', exact: true }).click();
        await module.getByText('Rencontre et préparation privée', { exact: true }).click();
        await module.getByLabel('Préparation secrète du MJ', { exact: true }).fill('SECRET Aline — dragon préparé');
        await module.getByRole('button', { name: 'Garder la préparation privée', exact: true }).click();
        await module.getByText('Inscrire un sort, une queue ou un souffle', { exact: true }).click();
        await module.getByLabel('Nom', { exact: true }).fill('Réserve privée Aline'); await module.getByRole('button', { name: 'Inscrire pour ce joueur', exact: true }).click();
        const acces = f.getByRole('group', { name: 'Accès des personnages', exact: true });
        await acces.getByRole('checkbox', { name: 'Aline', exact: true }).click(); await expect(acces.getByRole('checkbox', { name: 'Aline', exact: true })).toBeChecked();
        await expect(acces.getByRole('checkbox', { name: 'Boran', exact: true })).toBeEnabled();
        await acces.getByRole('checkbox', { name: 'Boran', exact: true }).click(); await expect(acces.getByRole('checkbox', { name: 'Boran', exact: true })).toBeChecked();
        async function rejoindre(nom: string, largeur: number) {
            const ctx = await browser.newContext({ viewport: { width: largeur, height: 1100 }, hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block' }); contextes.push(ctx);
            await ctx.route('**/*', r => { const u = new URL(r.request().url()); return u.hostname === '127.0.0.1' || ['data:', 'blob:'].includes(u.protocol) ? r.continue() : r.abort(); });
            await ctx.addInitScript(n => {
                localStorage.setItem('gmos-tablet-uuid', 'r8-' + n);
                const w = window as unknown as { paquetsTMR: unknown[] }; w.paquetsTMR = []; const WS = window.WebSocket;
                window.WebSocket = class extends WS { constructor(url: string | URL, protocoles?: string | string[]) { super(url, protocoles); this.addEventListener('message', e => { try { w.paquetsTMR.push(JSON.parse(e.data)); } catch { /* autre message */ } }); } };
            }, nom);
            const p = await ctx.newPage(); await p.goto(`http://127.0.0.1:${app.ports.sync}/?window=tablet&sync=${app.ports.sync}`);
            await p.getByRole('button', { name: new RegExp(nom) }).click({ timeout: 20_000 }); await expect(p.getByText('Connecté', { exact: true })).toBeVisible(); return p;
        }
        async function ouvrir(p: Page) {
            await p.getByRole('navigation', { name: 'Navigation Hub' }).getByRole('button', { name: 'Modules du jeu', exact: true }).click();
            await p.getByRole('button', { name: 'Ouvrir Terres Médianes du Rêve', exact: true }).click(); return p.getByRole('region', { name: 'Terres Médianes du Rêve', exact: true });
        }
        const aline = await rejoindre('Aline', 820), boran = await rejoindre('Boran', 1180); const a = await ouvrir(aline); await ouvrir(boran);
        await expect(a.getByText('Sort en réserve · Réserve privée Aline', { exact: true })).toBeVisible();
        await a.getByRole('button', { name: 'Demander la montée', exact: true }).click();
        const arbitrage = module.getByRole('region', { name: 'Arbitrage du trajet' }); await expect(arbitrage).toContainText('1 point(s) de rêve, 1 point(s) de fatigue');
        await expect(arbitrage.getByRole('button', { name: 'Valider le trajet', exact: true })).toBeDisabled();
        await arbitrage.getByLabel('Coûts, jets et conséquences résolus sur la fiche', { exact: true }).check(); await arbitrage.getByRole('button', { name: 'Valider le trajet', exact: true }).click();
        await expect(a.getByText('En voyage · normal', { exact: true })).toBeVisible();
        await a.getByRole('button', { name: /^H4 ·/ }).click(); await a.getByRole('button', { name: 'Demander le déplacement', exact: true }).click();
        await arbitrage.getByLabel('Coûts, jets et conséquences résolus sur la fiche', { exact: true }).check();
        await arbitrage.getByLabel('Compte rendu visible du joueur', { exact: true }).fill('Pas de rencontre pour Aline');
        await arbitrage.getByRole('button', { name: 'Valider le trajet', exact: true }).click();
        await expect(a.locator('.tmr-position')).toContainText('H4');
        await module.getByLabel('Rencontre à révéler à ce joueur', { exact: true }).fill('Passeur privé Aline, force 5');
        await module.getByRole('button', { name: 'Révéler la rencontre', exact: true }).click();
        await expect(a.getByRole('region', { name: 'Rencontre révélée' })).toContainText('Passeur privé Aline');
        await expect(a.getByRole('button', { name: 'Demander le déplacement', exact: true })).toBeDisabled();
        // L'hôte possède sa propre zone défilante : une capture d'élément plus haut que cette
        // zone donne une grande image rognée. Capturer le vrai écran après retour à l'en-tête.
        await aline.setViewportSize({ width: 820, height: 1800 });
        await a.locator('header').evaluate(e => e.scrollIntoView({ block: 'start' }));
        await aline.screenshot({ path: path.join(sortie, 'jeu-reves-de-dragons-tmr-joueur.jpg'), type: 'jpeg', quality: 85 });
        await cadre.evaluate(w => w.setContentSize(1460, 1600));
        await module.locator('header').evaluate(e => e.scrollIntoView({ block: 'start' }));
        await f.screenshot({ path: path.join(sortie, 'jeu-reves-de-dragons-tmr-mj.jpg'), type: 'jpeg', quality: 85 });
        const paquets = (p: Page) => p.evaluate(() => JSON.stringify((window as unknown as { paquetsTMR: unknown[] }).paquetsTMR));
        expect(await paquets(aline)).not.toContain('SECRET Aline'); const recusBoran = await paquets(boran);
        for (const secret of ['SECRET Aline', 'Réserve privée Aline', 'Passeur privé Aline', 'Pas de rencontre pour Aline']) expect(recusBoran).not.toContain(secret);
        const lire = () => f.evaluate(async () => (await window.appBridge!.modulesDuJeu!.lire()).modules[0].vue as VueTMRMJ);
        expect((await lire()).voyageurs.find(p => p.id === 'p0')!.journal).toHaveLength(2);
        await aline.reload(); await expect(aline.getByText('Connecté', { exact: true })).toBeVisible(); const ar = await ouvrir(aline);
        await expect(ar.locator('.tmr-position')).toContainText('H4'); expect((await lire()).voyageurs.find(p => p.id === 'p0')!.journal).toHaveLength(2);
        await aline.setViewportSize({ width: 360, height: 900 }); expect(await aline.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await aline.screenshot({ path: path.join(sortie, 'telephone-360.png'), fullPage: true });
        const ressources = await f.evaluate(() => (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore.getState().players[0].characters[0].sheetData);
        expect(ressources).toMatchObject({ reve_pts: 12, fatigue: 0 });
        await acces.getByRole('checkbox', { name: 'Aline', exact: true }).click(); await expect(acces.getByRole('checkbox', { name: 'Aline', exact: true })).not.toBeChecked(); await expect(ar).toHaveCount(0);
        await expect(boran.getByRole('region', { name: 'Terres Médianes du Rêve', exact: true })).toBeVisible();
    } finally { for (const c of contextes) await c.close(); await app.fermer(); fs.rmSync(dossier, { recursive: true, force: true }); }
});
