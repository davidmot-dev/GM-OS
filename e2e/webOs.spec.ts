import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Web-OS — la bibliothèque de liens d'une campagne.**
 *
 * ⚠️ **On n'ouvre aucune page.** Une instance d'essai n'a pas à charger le web :
 * ce serait lent, dépendant du réseau, et ça ne dirait rien de GM-OS. Ce qui se
 * garde ici, c'est **la bibliothèque** — qu'un lien ajouté soit retenu, nommé et
 * retrouvable. *Le navigateur est à Chromium ; la liste est à nous.*
 */

interface Lien { id: string; name: string; url: string; }

async function liens(gmos: GmOsLance): Promise<Lien[]> {
    return gmos.fenetre.evaluate(() =>
        ((window as never as {
            useWebStore: { getState: () => { links?: Lien[] } };
        }).useWebStore.getState().links ?? []) as never);
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Navigateur Web');
    await gmos.fenetre.getByRole('button', { name: /^New Link$/ }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('la bibliothèque', () => {
    test('part avec ses deux liens d’usine', async () => {
        const noms = (await liens(gmos)).map(l => l.name);

        expect(noms).toContain('SRD Rules');
        expect(noms).toContain('NPC Generator');
        await expect(gmos.fenetre.locator('main').last()).toContainText('SRD Rules');
    });
});

test.describe('ajouter un lien', () => {
    const NOM = 'Manuel de la station Varn';
    const URL = 'https://example.invalid/varn';

    /*
      ⭐ Le geste complet : ouvrir le formulaire, nommer, coller l'adresse,
      valider. Poser le lien dans le magasin sauterait le formulaire — qui est
      précisément l'endroit où un champ peut se perdre.
    */
    test('le formulaire le retient, et l’écran le montre', async () => {
        const avant = (await liens(gmos)).length;

        await gmos.fenetre.getByRole('button', { name: /^New Link$/ }).first().click();

        /*
          ⛔ **Le formulaire s'ouvre en MODAL**, par-dessus la bibliothèque. La
          tuile « Add Link » de la grille reste dans le DOM, derrière : la viser
          sans cadrer revient à cliquer un bouton que le modal intercepte, et
          l'attente expire sur un élément pourtant « visible ».
        */
        const modal = gmos.fenetre.locator('div.fixed.inset-0').last();
        await modal.getByPlaceholder('e.g. Dungeon Master Guide').fill(NOM);
        await modal.getByPlaceholder('https://...').fill(URL);
        /* ⚠️ Le bouton du modal s'appelle « Confirm » — pas « Add Link », qui
           est la tuile de la grille, derrière. */
        await modal.getByRole('button', { name: /^Confirm$/ }).click();

        await expect.poll(async () => (await liens(gmos)).length, { timeout: 10_000 })
            .toBe(avant + 1);

        const ajoute = (await liens(gmos)).find(l => l.name === NOM);
        expect(ajoute, 'le lien n’a pas été retenu sous son nom').toBeDefined();
        expect(ajoute!.url, 'l’adresse s’est perdue en chemin').toBe(URL);

        await expect(gmos.fenetre.locator('main').last()).toContainText(NOM);
    });

    /*
      ⚠️ Un lien ajouté doit survivre à un aller-retour : c'est une bibliothèque,
      pas un presse-papier. *Une liste qui s'oublie en changeant d'écran ne se
      remarque qu'au moment où l'on en a besoin.*
    */
    test('et il survit à un passage par un autre module', async () => {
        await ouvrirLeModule(gmos, 'Dice-OS');
        await gmos.fenetre.locator('button').filter({ hasText: /^d20$/ }).first()
            .waitFor({ timeout: 15_000 });

        await ouvrirLeModule(gmos, 'Navigateur Web');
        await expect(gmos.fenetre.locator('main').last())
            .toContainText(NOM, { timeout: 15_000 });
    });
});
