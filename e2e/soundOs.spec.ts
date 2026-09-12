import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Sound-OS — seize pads, et ce qu'on peut en dire sans entendre.**
 *
 * ⚠️ **Un bruitage qui sort n'est pas testable ici** : le profil d'essai n'a
 * aucun média, et ce qui atteint vraiment les enceintes relève de la catégorie
 * P6. Ce qui se garde, c'est **le pupitre** — que les seize pads existent,
 * qu'ils annoncent leur vide, et que les commandes globales répondent.
 *
 * ⭐ *Seize pads vides qui le disent valent mieux que seize cases muettes* :
 * un pupitre sans étiquette se lit comme un pupitre cassé.
 */

async function son(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const s = (window as never as {
            useSoundStore: { getState: () => Record<string, unknown> };
        }).useSoundStore.getState();
        return {
            atmospheres: (s.atmospheres as { id: string; name: string }[]) ?? [],
            active: s.activeAtmosphereId as string | null,
            master: s.masterVolume as number,
            keyLearn: s.isKeyLearnActive as boolean,
        };
    });
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Effets Sonores');
    await gmos.fenetre.getByRole('button', { name: /^KEY LEARN$/ }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('le pupitre', () => {
    /*
      ⛔ Seize, pas quinze ni dix-sept. Le compte est une promesse du guide et
      de la disposition du clavier : un pad de moins déplace tous les
      raccourcis appris.
    */
    test('porte seize pads', async () => {
        const vides = gmos.fenetre.getByText('EMPTY PAD', { exact: false });

        expect(await vides.count(), 'le compte des pads a changé').toBe(16);
    });

    test('et une atmosphère pour les tenir', async () => {
        const etat = await son(gmos);

        expect(etat.atmospheres.length, 'aucune atmosphère').toBeGreaterThan(0);
        expect(etat.active, 'aucune atmosphère active').not.toBeNull();
    });

    test('annonce qu’aucun canal ne joue', async () => {
        await expect(gmos.fenetre.locator('body')).toContainText(/0 ACTIVE CHANNELS/i);
    });
});

test.describe('les commandes globales', () => {
    /*
      ⭐ L'apprentissage de touche est un mode : il doit s'allumer **et
      s'éteindre**. Un mode qui ne se quitte pas capture toutes les frappes
      suivantes — et en séance, c'est le clavier entier qui cesse de répondre.
    */
    test('l’apprentissage de touche s’allume et s’éteint', async () => {
        const bouton = gmos.fenetre.getByRole('button', { name: /^KEY LEARN$/ }).first();

        await bouton.click();
        await expect.poll(async () => (await son(gmos)).keyLearn, { timeout: 10_000 }).toBe(true);

        await bouton.click();
        await expect.poll(async () => (await son(gmos)).keyLearn, { timeout: 10_000 }).toBe(false);
    });

    test('le volume général est dans sa plage', async () => {
        const { master } = await son(gmos);

        expect(master).toBeGreaterThanOrEqual(0);
        expect(master).toBeLessThanOrEqual(1);
    });
});
