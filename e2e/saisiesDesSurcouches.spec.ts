import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

type FenetreDesSaisies = {
    useDiceStore: typeof import('../src/stores/useDiceStore').useDiceStore;
    useCombatStore: typeof import('../src/modules/combat/useCombatStore').useCombatStore;
};

let gmos: GmOsLance;
test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await gmos.application.evaluate(({ BrowserWindow }) => {
        for (const fenetre of BrowserWindow.getAllWindows()) fenetre.webContents.setAudioMuted(true);
    });
});
test.afterAll(async () => { await gmos?.fermer(); });

test('un prompt abandonné ne réapparaît pas au prochain ajout de combattant', async () => {
    const page = gmos.fenetre;
    await ouvrirLeModule(gmos, 'Combat-OS');
    const ajouter = page.getByRole('button', { name: /Ajouter un Combattant/ }).first();
    await ajouter.click();
    await page.getByRole('dialog').getByRole('textbox').fill('Brouillon abandonné');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await ajouter.click();
    const champ = page.getByRole('dialog').getByRole('textbox');
    await expect(champ).toHaveValue('');
    await champ.fill('Sentinelle des saisies');
    await champ.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('main').last()).toContainText('Sentinelle des saisies');
});

test('la recherche revient au premier résultat puis repart vide après fermeture', async () => {
    const page = gmos.fenetre;
    await page.mouse.move(0, 0);
    await page.keyboard.press('Control+k');
    // La palette est seule à porter ces rangs ; son champ se trouve dans son cadre.
    const cadre = page.locator('[data-cadre-de-surcouche]').filter({ has: page.locator('[data-rang="0"]') });
    const recherche = cadre.getByRole('textbox');
    await expect(recherche).toBeVisible();
    await recherche.press('ArrowDown');
    await expect(cadre.locator('[data-rang="1"]')).toHaveClass(/border-accent/);
    await recherche.fill('combat');
    await expect(cadre.locator('[data-rang="0"]')).toHaveClass(/border-accent/);
    await recherche.press('Enter');
    await expect(recherche).toHaveCount(0);
    await page.keyboard.press('Control+k');
    await expect(recherche).toHaveValue('');
    await expect(cadre.locator('[data-rang="0"]')).toHaveClass(/border-accent/);
    await recherche.press('Escape');
    await expect(recherche).toHaveCount(0);
});

test('le calculateur reprend les jets puis applique le montant saisi à la cible', async () => {
    const page = gmos.fenetre;
    await ouvrirLeModule(gmos, 'Combat-OS');
    await page.evaluate(() => {
        const fenetre = window as unknown as FenetreDesSaisies;
        fenetre.useCombatStore.setState({ combatants: [{
            id: 'cible-saisie', name: 'Cible des saisies', init: 1,
            hp: 20, hpMax: 20, isPlayer: false, faction: 'enemy', statuses: [],
        }] });
        fenetre.useDiceStore.setState({ lastRoll: {
            id: 'jet-a', total: 17, rolls: [], modifier: 0, totalDisplay: '17',
            title: 'Dégâts', timestamp: new Date(),
        } });
    });
    await page.getByRole('button', { name: /Calculateur de dégâts/i }).first().click();
    const boite = page.getByRole('dialog');
    const montant = boite.getByRole('spinbutton');
    await expect(montant).toHaveValue('17');
    await montant.fill('6');
    await page.evaluate(() => {
        const magasin = (window as unknown as FenetreDesSaisies).useDiceStore;
        const precedent = magasin.getState().lastRoll!;
        magasin.setState({ lastRoll: { ...precedent, id: 'jet-b' } });
    });
    await expect(montant).toHaveValue('17');
    await montant.fill('6');
    await boite.getByText('Cible des saisies', { exact: true }).click();
    await boite.getByRole('button', { name: /DÉCLENCHER DÉGÂTS/i }).last().click();
    await expect(boite).toHaveCount(0);
    await expect.poll(() => page.evaluate(() =>
        (window as unknown as FenetreDesSaisies).useCombatStore.getState().combatants[0].hp,
    )).toBe(14);
});
