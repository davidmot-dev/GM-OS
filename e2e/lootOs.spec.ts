import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Loot-OS — les trois temps du butin, et des vides qui disent pourquoi.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE MODULE EST LE MOINS TESTABLE DE TOUS, ET IL FAUT LE DIRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deux de ses trois sources de butin sont **hors de portée** d'une instance
 * d'essai : le **générateur rapide** appelle un modèle (aucune clé d'API), et
 * les **tables de système** viennent du corpus (vide, exprès — voir
 * `GMOS_RACINE_DOCS`). Écrire des tests qui prétendraient les couvrir donnerait
 * une couverture décorative.
 *
 * ⭐ **Ce qui reste vaut pourtant d'être gardé : les états vides.** Un module
 * qui n'a rien à montrer doit dire **pourquoi**, pas rester blanc. *Un vide
 * muet se lit comme une panne* — et c'est exactement ce qu'un meneur conclura,
 * en séance, s'il ouvre le butin et ne voit rien.
 *
 * Le reste — distribuer, donner à un joueur, l'historique — se joue et relève
 * de la catégorie P6.
 */

async function butin(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const s = (window as never as {
            useSessionOSStore: { getState: () => Record<string, unknown> };
        }).useSessionOSStore.getState();
        return {
            pool: (s.lootPool as unknown[] ?? []).length,
            historique: (s.lootHistory as unknown[] ?? []).length,
        };
    });
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Tableau de Bord');
    await gmos.fenetre.getByRole('button', { name: /^Loot-OS$/ }).first().click();
    await gmos.fenetre.getByRole('button', { name: /^Génération$/ }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('les trois temps', () => {
    /*
      ⭐ Trois onglets, trois gestes distincts : composer, distribuer, relire.
      Les confondre est le risque que le guide signale déjà pour Table-OS et
      Loot-OS — *trois pages, trois gestes différents, ne pas les confondre.*
    */
    test('sont tous offerts', async () => {
        for (const onglet of ['Génération', 'Pool Actif', 'Historique']) {
            await expect(
                gmos.fenetre.getByRole('button', { name: new RegExp(`^${onglet}$`) }).first(),
                `l'onglet « ${onglet} » manque`,
            ).toBeVisible();
        }
    });

    test('s’ouvrent sans rien casser', async () => {
        for (const onglet of ['Pool Actif', 'Historique', 'Génération']) {
            await gmos.fenetre.getByRole('button', { name: new RegExp(`^${onglet}$`) }).first().click();
            await expect
                .poll(async () => (await gmos.fenetre.locator('body').innerText()).length, { timeout: 10_000 })
                .toBeGreaterThan(0);
        }
    });
});

test.describe('les états vides', () => {
    test('le butin d’une campagne neuve est vide des deux côtés', async () => {
        const b = await butin(gmos);

        expect(b.pool, 'le pool part vide').toBe(0);
        expect(b.historique, 'l’historique aussi').toBe(0);
    });

    /*
      ⛔ **L'assertion qui compte vraiment.** Sans corpus, il n'y a aucune table
      de butin — et le module doit **le dire**. Un écran blanc à cet endroit se
      lit comme un module cassé, et c'est en séance qu'on le découvrirait.
    */
    test('l’absence de table est ANNONCÉE, pas laissée en blanc', async () => {
        await gmos.fenetre.getByRole('button', { name: /^Génération$/ }).first().click();

        await expect(gmos.fenetre.locator('body'))
            .toContainText(/Aucune table de butin trouvée/i, { timeout: 15_000 });
    });

    /*
      ⚠️ Le générateur rapide est une IA : sans clé, il ne produira rien. Ce
      qu'on exige ici n'est pas qu'il marche — c'est qu'il **annonce ce qu'il
      fait** avant qu'on lui confie une description.
    */
    test('le générateur dit ce qu’il fera', async () => {
        await expect(gmos.fenetre.locator('body'))
            .toContainText(/L'IA créera des objets structurés/i);
    });
});
