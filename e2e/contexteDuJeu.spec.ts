import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

type FenetreDuJeu = { useSessionOSStore: typeof import('../src/modules/session/useSessionOSStore').useSessionOSStore };
let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({
        semence: CAMPAGNE_TEMOIN,
        preparerLeProfil(profil) {
            for (const [jeu, fichier] of [['alpha', 'A Band.png'], ['beta', 'B.png']]) {
                const dossier = path.join(profil, 'corpus', 'systems', jeu);
                fs.mkdirSync(dossier, { recursive: true });
                fs.copyFileSync(path.resolve('e2e/donnees/demo-relais.png'), path.join(dossier, fichier));
            }
            const fiches = path.join(profil, 'corpus', 'systems', 'alpha', 'fiche');
            fs.mkdirSync(fiches, { recursive: true });
            fs.writeFileSync(path.join(fiches, 'correspondance.json'), JSON.stringify({
                version: 1, gabaritDeLaFiche: 'fiche-temoin', champs: [],
            }));
        },
    });
    await attendreLHydratation(gmos);
    await gmos.fenetre.waitForFunction(() =>
        (window as unknown as FenetreDuJeu).useSessionOSStore.getState().activeCampaignId === 'temoin-campagne',
    );
    await gmos.application.evaluate(({ BrowserWindow }) => {
        for (const fenetre of BrowserWindow.getAllWindows()) fenetre.webContents.setAudioMuted(true);
    });
    await gmos.fenetre.evaluate(() => {
        const magasin = (window as unknown as FenetreDuJeu).useSessionOSStore;
        const etat = magasin.getState();
        const campagne = etat.campaigns.find(c => c.id === etat.activeCampaignId)!;
        const pilote = etat.getActiveDriver()!;
        const joueur = etat.players[0];
        const personnage = joueur.characters[0];
        magasin.setState({
            activeCampaignId: 'contexte-a', currentView: 'players',
            selectedPlayerId: joueur.id, selectedCharacterId: null,
            campaigns: [
                { ...campagne, id: 'contexte-a', name: 'Alpha', system: 'contexte-alpha', systemPath: 'systems/alpha', themeDuJeu: false },
                { ...campagne, id: 'contexte-b', name: 'Beta', system: 'contexte-beta', systemPath: 'systems/beta', themeDuJeu: false },
            ],
            customGameDrivers: [
                { ...pilote, id: 'contexte-alpha', name: 'Alpha', banniere: 'A Band.png' },
                { ...pilote, id: 'contexte-beta', name: 'Beta', banniere: 'B.png' },
            ],
            players: [{ ...joueur, characters: [
                { ...personnage, id: 'contexte-pj-a', name: 'Ada du test', campaignId: 'contexte-a', systemId: 'contexte-alpha' },
                { ...personnage, id: 'contexte-pj-b', name: 'Béa du test', campaignId: 'contexte-b', systemId: 'contexte-beta' },
            ] }],
        });
    });
});
test.afterAll(async () => { await gmos?.fermer(); });

test('le bandeau suit le dossier déclaré et disparaît quand le fichier est retiré', async () => {
    const page = gmos.fenetre;
    const bandeau = page.locator('[data-banniere-du-jeu]');
    await expect(bandeau).toHaveAttribute('style', /systems\/alpha\/A%20Band.png/);
    await page.evaluate(() => (window as unknown as FenetreDuJeu).useSessionOSStore.setState({ activeCampaignId: 'contexte-b' }));
    await expect(bandeau).toHaveAttribute('style', /systems\/beta\/B.png/);
    // Même campagne et même pilote : le fichier change dans le dossier déclaré.
    await page.evaluate(() => {
        const magasin = (window as unknown as FenetreDuJeu).useSessionOSStore;
        magasin.setState(s => ({
            campaigns: s.campaigns.map(c => c.id === 'contexte-b' ? { ...c, systemPath: 'systems/alpha' } : c),
            customGameDrivers: s.customGameDrivers.map(d => d.id === 'contexte-beta' ? { ...d, banniere: 'A Band.png' } : d),
        }));
    });
    await expect(bandeau).toHaveAttribute('style', /systems\/alpha\/A%20Band.png/);
    await page.evaluate(() => {
        const magasin = (window as unknown as FenetreDuJeu).useSessionOSStore;
        magasin.setState(s => ({ customGameDrivers: s.customGameDrivers.map(d => ({ ...d, banniere: undefined })) }));
    });
    await expect(bandeau).toHaveCount(0);
    // Revenir au chemin du jeu B pour le scénario de fiche sans correspondance.
    await page.evaluate(() => {
        const magasin = (window as unknown as FenetreDuJeu).useSessionOSStore;
        magasin.setState(s => ({ campaigns: s.campaigns.map(c => c.id === 'contexte-b' ? { ...c, systemPath: 'systems/beta' } : c) }));
    });
});

test('la fiche du personnage garde son jeu lorsque la campagne active est différente', async () => {
    const page = gmos.fenetre;
    await expect(page.getByRole('heading', { name: 'Ada du test', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Fiche', exact: true }).first().click();
    const bascule = page.getByTitle('Afficher la fiche du jeu', { exact: true });
    await expect(bascule).toBeVisible();
    await page.getByRole('button', { name: 'Retour', exact: true }).first().click();
    await page.getByRole('button', { name: 'Fiche', exact: true }).nth(1).click();
    await expect(page.getByText('Fiche de Béa du test', { exact: true })).toBeVisible();
    await expect(bascule).toHaveCount(0);
});
