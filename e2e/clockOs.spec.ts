import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Clock-OS — les jauges de tension et le minuteur.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI SE JOUE ICI, ET POURQUOI C'EST SENSIBLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une jauge de tension est **faite pour être vue des joueurs** — c'est ce qui la
 * rend angoissante. Mais toutes ne le sont pas : certaines comptent un secret du
 * meneur. Jusqu'au correctif **C1**, elles étaient publiques **tout ou rien** —
 * `isClockProjected` valait `true` au démarrage et **trois écrans** le lisaient,
 * si bien que cacher une seule jauge obligeait à cacher l'horloge entière.
 *
 * ⭐ **La décision qui en est sortie : un drapeau par jauge, et une jauge neuve
 * naît SECRÈTE.** C'est le défaut par défaut le plus prudent — *une jauge qu'on
 * croyait privée et que la table voyait ne se rattrape pas.* Ce fichier la fige.
 */

interface Jauge {
    id: string;
    name: string;
    totalSegments: number;
    filledSegments: number;
    vueParLesJoueurs: boolean;
}

async function horloge(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const c = (window as never as {
            useClockStore: { getState: () => Record<string, unknown> };
        }).useClockStore.getState();
        return {
            jauges: c.tensions as Jauge[],
            mode: c.mode as string,
            minuteur: {
                duree: c.timerDuration as number,
                reste: c.timerRemaining as number,
                marche: c.timerIsRunning as boolean,
            },
        };
    });
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Horloge & Temps');
    await gmos.fenetre.getByPlaceholder('Nom de la jauge...').waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('les jauges de tension', () => {
    test('se créent nommées, au nombre de segments choisi', async () => {
        await gmos.fenetre.getByPlaceholder('Nom de la jauge...').fill('Alerte de la station');
        await gmos.fenetre.getByRole('button', { name: /^\+6$/ }).first().click();

        await expect.poll(async () => (await horloge(gmos)).jauges.length, { timeout: 10_000 }).toBe(1);

        const [jauge] = (await horloge(gmos)).jauges;
        expect(jauge.name).toBe('Alerte de la station');
        expect(jauge.totalSegments, 'le nombre de segments demandé').toBe(6);
        expect(jauge.filledSegments, 'une jauge neuve part à zéro').toBe(0);

        /* Et elle est à l'écran, sous son nom : c'est ainsi qu'on la reconnaît. */
        await expect(gmos.fenetre.locator('main').last()).toContainText('Alerte de la station');
    });

    /*
      ⛔ **LA DÉCISION C1, FIGÉE ICI.** Une jauge neuve naît secrète. Si ce test
      rougit un jour, ce n'est pas lui qu'il faut corriger : c'est qu'une jauge
      vient de devenir publique par défaut, et qu'un secret du meneur s'affichera
      sur la tablette des joueurs sans que personne ne l'ait demandé.
    */
    test('⭐ naissent SECRÈTES, et le bouton propose de les montrer', async () => {
        const [jauge] = (await horloge(gmos)).jauges;
        expect(jauge.vueParLesJoueurs, 'une jauge neuve ne doit PAS être publique').toBe(false);

        await expect(
            gmos.fenetre.getByTitle('Montrer cette jauge aux joueurs, sur tous leurs écrans').first(),
        ).toBeVisible();
    });

    test('se montrent aux joueurs sur demande', async () => {
        await gmos.fenetre.getByTitle('Montrer cette jauge aux joueurs, sur tous leurs écrans').first().click();

        await expect.poll(
            async () => (await horloge(gmos)).jauges[0].vueParLesJoueurs,
            { timeout: 10_000 },
        ).toBe(true);
    });

    test('se remplissent', async () => {
        const avant = (await horloge(gmos)).jauges[0].filledSegments;

        await gmos.fenetre.getByTitle(/^Remplir la jauge/).first().click();

        await expect.poll(
            async () => (await horloge(gmos)).jauges[0].filledSegments,
            { timeout: 10_000, message: 'la jauge n’a pas bougé' },
        ).toBeGreaterThan(avant);
    });
});

test.describe('le minuteur', () => {
    /*
      ⚠️ Les raccourcis sont en minutes, le magasin en secondes. C'est le genre
      d'unité qui se perd en chemin sans que personne ne le voie — jusqu'à ce
      qu'un minuteur de cinq minutes sonne au bout de cinq secondes.
    */
    test('un raccourci de 5 minutes pose 300 secondes', async () => {
        await gmos.fenetre.getByRole('button', { name: /^5m$/ }).first().click();

        await expect.poll(async () => (await horloge(gmos)).minuteur.duree, { timeout: 10_000 })
            .toBe(300);
    });

    test('« Départ » le met en marche', async () => {
        await gmos.fenetre.getByRole('button', { name: /^Départ$/ }).first().click();

        await expect.poll(async () => (await horloge(gmos)).minuteur.marche, { timeout: 10_000 })
            .toBe(true);
    });
});

test.describe('les modes de temps', () => {
    test('se choisissent, et le magasin suit', async () => {
        await gmos.fenetre.getByRole('button', { name: /^Statique$/ }).first().click();
        await expect.poll(async () => (await horloge(gmos)).mode, { timeout: 10_000 }).not.toBe('realtime');

        await gmos.fenetre.getByRole('button', { name: /^Temps Réel$/ }).first().click();
        await expect.poll(async () => (await horloge(gmos)).mode, { timeout: 10_000 }).toBe('realtime');
    });
});
