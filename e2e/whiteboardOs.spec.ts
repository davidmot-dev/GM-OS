import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Le Tableau Blanc — un trait tracé reste tracé.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE MODULE MÉRITE UN TEST DE BOUT EN BOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ **Ce module a déjà perdu des traits.** Le 2026-06-17, un correctif nommé
 * *« resolve stroke disappearance »* remplaçait un effet de redimensionnement
 * destructeur par un `ResizeObserver` au montage, rendait `finishDrawing`
 * atomique, et sortait les champs volatils de la persistance. *Un trait qui
 * disparaît est le genre de défaut qu'on croit avoir mal dessiné.*
 *
 * Un test de canevas ne peut pas juger du dessin. **Il peut juger qu'il existe,
 * qu'il survit, et qu'il s'annule** — et c'est exactement ce qui avait cassé.
 *
 * ⚠️ Le trait se trace à la souris sur le `<canvas>`, pas en appelant le
 * magasin : *poser un chemin dans l'état sauterait toute la chaîne d'événements
 * qui est précisément ce qui s'était rompu.*
 */

async function traits(gmos: GmOsLance): Promise<number> {
    return gmos.fenetre.evaluate(() =>
        ((window as never as {
            useWhiteboardStore: { getState: () => { paths?: unknown[] } };
        }).useWhiteboardStore.getState().paths ?? []).length);
}

/** Un trait réel : on appuie, on déplace, on relâche. */
async function tracerUnTrait(gmos: GmOsLance, depart: { x: number; y: number }): Promise<void> {
    const canevas = gmos.fenetre.locator('canvas').first();
    const boite = (await canevas.boundingBox())!;

    await gmos.fenetre.mouse.move(boite.x + depart.x, boite.y + depart.y);
    await gmos.fenetre.mouse.down();
    for (let i = 1; i <= 6; i++) {
        await gmos.fenetre.mouse.move(boite.x + depart.x + i * 12, boite.y + depart.y + i * 8);
    }
    await gmos.fenetre.mouse.up();
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Tableau Blanc');
    await gmos.fenetre.locator('canvas').first().waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('les outils', () => {
    test('les cinq sont offerts', async () => {
        for (const outil of ['Crayon', 'Gomme', 'Laser', 'Rectangle', 'Cercle']) {
            await expect(
                gmos.fenetre.getByTitle(outil).first(),
                `l'outil « ${outil} » manque`,
            ).toBeVisible();
        }
    });
});

test.describe('tracer', () => {
    test('un trait au crayon entre dans le tableau', async () => {
        await gmos.fenetre.getByTitle('Crayon').first().click();
        const avant = await traits(gmos);

        await tracerUnTrait(gmos, { x: 120, y: 120 });

        await expect.poll(() => traits(gmos), { timeout: 10_000, message: 'aucun trait enregistré' })
            .toBe(avant + 1);
    });

    /*
      ⛔ **Le laser montre, puis s'efface — et c'est sa disparition qu'il faut
      garder.**

      Ma première version affirmait qu'il ne déposait rien. Faux : il dépose un
      chemin **marqué temporaire**, et `addPath` programme sa suppression à deux
      secondes. Je n'attendais qu'une seconde et j'en concluais un défaut.

      ⭐ Le vrai risque est l'inverse de ce que je testais : *un laser qui
      oublierait de s'effacer salirait le tableau de traces qu'on ne pense pas à
      retirer* — et ça ne se voit qu'après coup, quand le dessin est devenu
      illisible. C'est donc le nettoyage qu'on vérifie.
    */
    test('le laser s’efface tout seul', async () => {
        await gmos.fenetre.getByTitle('Laser').first().click();
        const avant = await traits(gmos);

        await tracerUnTrait(gmos, { x: 200, y: 160 });

        /* Il passe — sinon il n'y aurait rien à montrer à la table. */
        await expect.poll(() => traits(gmos), { timeout: 5_000, message: 'le laser n’a rien montré' })
            .toBeGreaterThan(avant);

        /* Puis il s'en va, sans qu'on ait rien à faire. */
        await expect.poll(() => traits(gmos), { timeout: 10_000, message: 'le laser a laissé sa trace' })
            .toBe(avant);
    });

});

test.describe('revenir en arrière', () => {
    test('annuler retire le dernier trait, rétablir le remet', async () => {
        await gmos.fenetre.getByTitle('Crayon').first().click();
        await tracerUnTrait(gmos, { x: 300, y: 120 });
        await expect.poll(() => traits(gmos), { timeout: 10_000 }).toBeGreaterThan(0);

        const avant = await traits(gmos);

        await gmos.fenetre.getByTitle('Annuler').first().click();
        await expect.poll(() => traits(gmos), { timeout: 10_000 }).toBe(avant - 1);

        await gmos.fenetre.getByTitle('Rétablir').first().click();
        await expect.poll(() => traits(gmos), { timeout: 10_000 }).toBe(avant);
    });

    test('effacer tout vide le tableau', async () => {
        await gmos.fenetre.getByTitle('Effacer tout').first().click();

        await expect.poll(() => traits(gmos), { timeout: 10_000 }).toBe(0);
    });
});

test.describe('la survie d’un trait', () => {
    /*
      ⭐ **Le test qui vise le défaut de juin.** Un trait disparaissait au
      redimensionnement du canevas. Changer de module et revenir démonte puis
      remonte le composant — donc redimensionne — et c'est le moment où le
      dessin se perdait.
    */
    test('un trait survit à un aller-retour dans un autre module', async () => {
        await gmos.fenetre.getByTitle('Crayon').first().click();
        await tracerUnTrait(gmos, { x: 150, y: 200 });
        await expect.poll(() => traits(gmos), { timeout: 10_000 }).toBe(1);

        await ouvrirLeModule(gmos, 'Dice-OS');
        await gmos.fenetre.locator('button').filter({ hasText: /^d20$/ }).first()
            .waitFor({ timeout: 15_000 });

        await ouvrirLeModule(gmos, 'Tableau Blanc');
        await gmos.fenetre.locator('canvas').first().waitFor({ timeout: 15_000 });

        expect(await traits(gmos), 'le trait a disparu en revenant').toBe(1);
    });
});
