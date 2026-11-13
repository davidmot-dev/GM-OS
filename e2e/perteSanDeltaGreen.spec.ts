import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import { ficheNeuve } from '../src/modules/session/logic/ficheNeuve';

type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore };
const archive = path.resolve('Export Dirvers/corriges/Delta-Green-2.1.0.gmos-driver');
test.skip(!fs.existsSync(archive), 'Le pilote Delta Green 2.1.0 est nécessaire à cette régression.');

test('SAN 60, SR 48, POU 12 : saisir -5 retire cinq SAN, une seule fois, puis persiste', async () => {
    test.setTimeout(90_000);
    const { gameDriver, sheetTemplate } = JSON.parse(new AdmZip(archive).readAsText('state.json'));
    const valeurs = { ...ficheNeuve(sheetTemplate), FOR: 12, CON: 12, PV: 12, SAN: 60, SR: 48, POU: 12, inconcevable: 0,
        athletisme: 30, experience_athletisme: true };
    const g = await lancerGmOs({ preparerLeProfil: profil => {
        for (const dossier of ['theme', 'fiche']) fs.cpSync(path.resolve('docs/systems/delta-green', dossier),
            path.join(profil, 'corpus', 'systems', 'delta-green', dossier), { recursive: true });
    } });
    try {
        await attendreLHydratation(g);
        await ouvrirLeModule(g, 'Tableau de Bord');
        const f = g.fenetre;
        const fenetre = await g.application.browserWindow(f);
        await fenetre.evaluate(w => { w.unmaximize(); w.setContentSize(1440, 1800); });
        await f.evaluate(({ gameDriver, sheetTemplate, valeurs }) => {
            const magasin = (window as Fenetre).useSessionOSStore;
            magasin.setState({
                campaigns: [{ id: 'dg-san-directe', name: 'Perte SAN — profil jetable', system: gameDriver.id, activeLocationIds: [] }],
                customGameDrivers: [gameDriver], customSheetTemplates: [sheetTemplate],
                players: [{ id: 'dg-joueur', realName: 'Joueur de test', avatarUrl: '', isOnline: false,
                    characters: [{ id: 'dg-agent', name: 'Agent de test', campaignId: 'dg-san-directe', systemId: gameDriver.id, templateId: sheetTemplate.id, sheetData: valeurs, hp: 12, maxHp: 12 }] }],
            });
            const s = magasin.getState();
            s.setActiveCampaign('dg-san-directe'); s.setSelectedPlayer('dg-joueur'); s.setSelectedCharacter('dg-agent'); s.setCurrentView('players');
        }, { gameDriver, sheetTemplate, valeurs });
        await ongletDeLaFiche(f, 'Lancer un test');
        const p = f.locator('[data-panneau-de-jet]');
        await p.locator('select').first().selectOption('SAN');
        await p.getByRole('button', { name: 'Lancer', exact: true }).click();
        const suites = p.locator('[data-delta-green]');
        await suites.getByLabel('Perte de SAN').fill('-5');
        const sortie = path.resolve('output/verification-delta-green-san-directe');
        fs.mkdirSync(sortie, { recursive: true });
        await p.locator('[data-carte-du-jeu="delta-green"]').screenshot({ path: path.join(sortie, 'boutons-avant-application.png'), scale: 'css', animations: 'disabled' });
        await suites.getByRole('button', { name: 'Appliquer la perte de SAN' }).click();
        const lire = () => f.evaluate(() => (window as Fenetre).useSessionOSStore.getState().players[0].characters[0].sheetData!);
        await expect.poll(async () => (await lire()).SAN).toBe(55);
        await expect.poll(async () => (await lire()).SR).toBe(48);
        await expect(suites.getByRole('button', { name: 'Perte déjà appliquée' })).toBeDisabled();
        await expect(suites).toContainText('Folie temporaire');
        await suites.screenshot({ path: path.join(sortie, 'san-60-moins-5.png'), animations: 'disabled' });
        await f.waitForTimeout(500);
        await f.reload(); await attendreLHydratation(g);
        await expect.poll(async () => (await lire()).SAN).toBe(55);
        await expect.poll(async () => (await lire()).SR).toBe(48);
    } finally { await g.fermer(); }
});
