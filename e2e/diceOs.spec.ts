import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Dice-OS — le pupitre rend un jet, et le jet va au journal.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE MODULE PASSE EN PREMIER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ **Un jet faux ne se voit JAMAIS en séance.** On lit un nombre, on l'annonce,
 * la table y croit — et personne ne recompte. C'est la raison pour laquelle ce
 * dépôt a payé **six fois** le même motif sur les dés : le sens du comptage
 * (16/08), les dés d'équipement d'Alien qui en lançait seize (21/08), l'avantage
 * qui aurait effacé les degrés (22/08), le pilote actif qui écrasait le mode du
 * pupitre (03/09)…
 *
 * Les tests unitaires couvrent les moteurs. **Ce fichier couvre le chemin** :
 * que le bouton atteigne le moteur, que le résultat revienne à l'écran, et
 * qu'il soit consigné. *La question qui trouve ces défauts est « qui d'autre
 * lance ce jet ? » — et un test de bout en bout est le seul à pouvoir y
 * répondre depuis le pupitre.*
 *
 * ⚠️ **Un jet est aléatoire : on n'assertionne jamais une valeur.** On vérifie
 * la **plage**, la **forme** et la **cohérence** — et on lance plusieurs fois,
 * parce qu'un seul tirage dans les clous peut être une coïncidence.
 */

/** Le bouton d'un dé : son texte est exact, son image porte le même nom. */
function de(gmos: GmOsLance, faces: number) {
    return gmos.fenetre.locator('button').filter({ hasText: new RegExp(`^d${faces}$`) }).first();
}

interface Jet {
    total: number;
    modifier: number;
    title: string;
    rolls: { val: number; sides: number }[];
}

/** Le dernier jet, tel que le magasin le détient. */
async function dernierJet(gmos: GmOsLance): Promise<Jet | null> {
    return gmos.fenetre.evaluate(() =>
        (window as never as {
            useDiceStore: { getState: () => { lastRoll: unknown } };
        }).useDiceStore.getState().lastRoll as never);
}

async function tailleDeLHistorique(gmos: GmOsLance): Promise<number> {
    return gmos.fenetre.evaluate(() =>
        (window as never as {
            useDiceStore: { getState: () => { history: unknown[] } };
        }).useDiceStore.getState().history.length);
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Dice-OS');
    await de(gmos, 20).waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('lancer un dé', () => {
    test('les sept dés sont offerts', async () => {
        for (const faces of [4, 6, 8, 10, 12, 20, 100]) {
            await expect(de(gmos, faces), `le dé à ${faces} faces manque`).toBeVisible();
        }
    });

    /*
      ⛔ **Cinq jets, pas un.** Un d20 qui rendrait toujours 7, ou qui rendrait
      un résultat de d6, passerait un tirage unique une fois sur trois. La plage
      ne se vérifie qu'en répétant.
    */
    test('un d20 rend un résultat entre 1 et 20, cinq fois de suite', async () => {
        for (let i = 0; i < 5; i++) {
            const avant = await tailleDeLHistorique(gmos);
            await de(gmos, 20).click();
            await expect.poll(() => tailleDeLHistorique(gmos), { timeout: 10_000 }).toBe(avant + 1);

            const jet = (await dernierJet(gmos))!;
            expect(jet.rolls, 'un d20 lance UN dé').toHaveLength(1);
            expect(jet.rolls[0].sides, 'et ce dé a vingt faces').toBe(20);
            expect(jet.rolls[0].val, `tirage ${i + 1} hors plage : ${jet.rolls[0].val}`)
                .toBeGreaterThanOrEqual(1);
            expect(jet.rolls[0].val).toBeLessThanOrEqual(20);
        }
    });

    /*
      ⚠️ Le total et la somme des dés doivent s'accorder. *Le sens du comptage a
      déjà été faux ici le 2026-08-16* — c'est exactement ce genre d'écart qui ne
      se voit pas à la table.
    */
    test('le total est la somme des dés et du modificateur', async () => {
        await de(gmos, 6).click();
        await expect.poll(async () => (await dernierJet(gmos))?.rolls[0].sides, { timeout: 10_000 }).toBe(6);

        const jet = (await dernierJet(gmos))!;
        const somme = jet.rolls.reduce((t, r) => t + r.val, 0) + jet.modifier;
        expect(jet.total, `${jet.rolls.map(r => r.val).join('+')} + ${jet.modifier} ≠ ${jet.total}`)
            .toBe(somme);
    });

    test('chaque dé annonce sa formule', async () => {
        for (const faces of [4, 8, 100]) {
            await de(gmos, faces).click();
            await expect.poll(async () => (await dernierJet(gmos))?.title, { timeout: 10_000 })
                .toBe(`1d${faces}`);
        }
    });

    /*
      ⭐ L'assertion qui vaut pour un humain : le nombre est **à l'écran**. Le
      magasin peut être juste et l'affichage muet — c'est la moitié de chemin
      que ce dépôt appelle « le chemin s'arrête avant le moteur », prise dans
      l'autre sens.
    */
    test('le résultat s’affiche', async () => {
        await de(gmos, 12).click();
        const jet = await expect.poll(async () => (await dernierJet(gmos))?.title, { timeout: 10_000 })
            .toBe('1d12')
            .then(async () => (await dernierJet(gmos))!);

        await expect(gmos.fenetre.locator('main').last())
            .toContainText(String(jet.total), { timeout: 10_000 });
    });
});

test.describe('l’historique', () => {
    test('garde les jets, et se vide sur demande', async () => {
        await de(gmos, 6).click();
        await expect.poll(() => tailleDeLHistorique(gmos), { timeout: 10_000 })
            .toBeGreaterThan(0);

        await gmos.fenetre.getByRole('button', { name: /^Vider$/ }).first().click();
        await expect.poll(() => tailleDeLHistorique(gmos), { timeout: 10_000 }).toBe(0);
    });
});
