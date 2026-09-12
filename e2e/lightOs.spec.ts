import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Light-OS — les scènes, et le bouton qui les arrête.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QU'AUCUN TEST NE FERA ICI, ET C'EST UNE PROTECTION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `GMOS_SANS_APPAREILS=1` **tait le pont Hue** pour toute la suite E2E. Ce n'est
 * pas une limite subie, c'est une garde : *un test qui allume les lampes du
 * salon produit un effet qu'aucune assertion ne peut annuler.* Aucun de ces
 * tests ne touchera donc une vraie lampe.
 *
 * ⚠️ **Et on ne clique ici ni « Mode simulé » ni « Blackout d'Urgence ».** Le
 * premier *débranche le pont* — le guide signale qu'un meneur suivant une
 * ancienne version coupait son pont en croyant activer la synchro. Les
 * éprouver demanderait de reproduire exactement ce qu'on veut éviter.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ CE QUE CE FICHIER GARDE VRAIMENT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **L'existence du bouton « Arrêter la scène ».** Il a été ajouté le
 * 2026-09-09, et sa découverte est instructive : le moteur savait arrêter une
 * scène depuis le 07/09, mais **aucun bouton ne l'appelait** — la quatrième
 * « chaîne complète sans bouton au bout » de ce dépôt. Figer sa présence est
 * exactement le genre de garde qui manquait.
 */

async function lumiere(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const l = (window as never as {
            useLightStore: { getState: () => Record<string, unknown> };
        }).useLightStore.getState();
        return {
            statut: l.status as string,
            /* ⚠️ `scenes` est un OBJET indexé par identifiant, pas un tableau :
               `.length` y rend `undefined`, ce qui se lit comme « zéro scène ». */
            scenes: Object.keys((l.scenes as Record<string, unknown>) ?? {}).length,
            transition: l.transitionTimeMs as number,
            scenesActives: l.lastManualSceneId as string | null,
        };
    });
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Light-OS');
    await gmos.fenetre.getByRole('button', { name: /Arrêter la scène/ }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('sans pont', () => {
    /*
      ⭐ Un module qui ne trouve aucune lampe doit **le dire**. Sans ce message,
      un meneur dont le pont est éteint voit un écran vide et conclut que
      Light-OS est cassé — exactement ce qui s'est passé le 12/09 dans l'autre
      sens, quand la reconnexion bouclait en silence.
    */
    test('l’absence de lampe est annoncée', async () => {
        await expect(gmos.fenetre.locator('body'))
            .toContainText(/Aucune lampe détectée/i);
    });

    test('le module reste utilisable malgré tout', async () => {
        const etat = await lumiere(gmos);

        expect(etat.scenes, 'les scènes sont locales, elles ne dépendent pas du pont')
            .toBeGreaterThan(0);
    });
});

test.describe('⭐ le bouton qui manquait', () => {
    /*
      ⛔ **Le moteur savait arrêter une scène depuis le 2026-09-07 ; le bouton
      n'est arrivé que le 09.** Deux jours pendant lesquels la fonction existait
      et restait inatteignable. C'est le motif que ce dépôt a payé quatre fois —
      *la chaîne complète, sans bouton au bout.*
    */
    test('« Arrêter la scène » existe, et dit quand il n’a rien à faire', async () => {
        const bouton = gmos.fenetre.getByRole('button', { name: /Arrêter la scène/ }).first();

        await expect(bouton).toBeVisible();
        await expect(bouton, 'le bouton doit expliquer son inaction')
            .toHaveAttribute('title', /Aucune scène ne joue/i);
    });

    test('et Échap est annoncé comme son raccourci', async () => {
        await expect(gmos.fenetre.locator('body')).toContainText(/Échap/i);
    });
});

test.describe('le temps de transition', () => {
    /*
      ⚠️ La transition est en millisecondes dans le magasin, en secondes à
      l'écran. La même confusion qu'avec le fondu de Music-OS — et ici elle
      décide de la vitesse à laquelle une pièce change d'ambiance.
    */
    test('se choisit, et le magasin suit en millisecondes', async () => {
        await gmos.fenetre.getByRole('button', { name: /^5s$/ }).first().click();

        await expect.poll(async () => (await lumiere(gmos)).transition, { timeout: 10_000 })
            .toBe(5000);

        await gmos.fenetre.getByRole('button', { name: /^Inst\.$/ }).first().click();
        await expect.poll(async () => (await lumiere(gmos)).transition, { timeout: 10_000 })
            .toBeLessThan(1000);
    });
});
