import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Music-OS — les deux platines, le crossfader, et l'appartenance d'une atmosphère.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA FRONTIÈRE, POSÉE D'EMBLÉE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Aucun test ne peut dire qu'un son sort.** Une instance d'essai n'a pas de
 * média, et le routage vers une enceinte donnée (`setSinkId`) ne se vérifie
 * qu'à l'oreille — c'est écrit noir sur blanc dans la catégorie P6 du registre.
 *
 * Ce qui se garde ici est l'autre moitié, et elle n'est pas mince : **la
 * console**. Que les deux platines existent, que le crossfader atteigne le
 * moteur, que le volume général suive — et surtout **à qui appartient une
 * atmosphère**.
 *
 * ⭐ **Le rattachement à la campagne est une décision du 2026-08-30** : une
 * atmosphère porte une étiquette, et *sans étiquette, elle est commune*. Ce
 * défaut-là — commune par défaut — est ce qui a permis de livrer la
 * fonctionnalité **sans aucune migration**. Le figer évite qu'on l'inverse par
 * mégarde : *une atmosphère qui deviendrait privée par défaut ferait disparaître
 * toutes celles d'avant, sans un mot.*
 */

/**
 * ⚠️ **Le champ s'appelle `campagneId`, en français** — alors que `name`,
 * `pads` et `id` sont en anglais autour de lui. Ce dépôt mêle les deux, et
 * c'est la **troisième** fois de la journée qu'un nom de champ deviné me fait
 * accuser le code : `initiative` pour `init`, puis `campaignId` pour celui-ci.
 * *On ne devine pas un nom de champ ; on le lit.*
 */
interface Atmosphere { id: string; name: string; campagneId?: string | null; }

async function musique(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const m = (window as never as {
            useMusicStore: { getState: () => Record<string, unknown> };
        }).useMusicStore.getState();
        return {
            playlists: m.playlists as Atmosphere[],
            crossfader: m.crossfader as number,
            master: m.masterVolume as number,
            fondu: m.autoFadeDuration as number,
        };
    });
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Musique');
    await gmos.fenetre.getByRole('button', { name: /^Commune$/ }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('la console', () => {
    test('porte ses deux platines', async () => {
        const zone = gmos.fenetre.locator('body');

        await expect(zone, 'la platine A manque').toContainText(/DRK A/i);
        await expect(zone, 'la platine B manque').toContainText(/DRK B/i);
    });

    /*
      ⚠️ Le fondu est en secondes à l'écran. Une unité qui se perd en chemin ne
      se remarque qu'au moment où un crossfade de cinq secondes en dure cinq
      cents — et ce moment-là est toujours en séance.
    */
    test('annonce une durée de fondu cohérente', async () => {
        const { fondu } = await musique(gmos);

        /*
          ⚠️ **En millisecondes dans le magasin, en secondes à l'écran** — 5000
          s'affiche « 5.0 s ». J'ai d'abord assertionné des secondes et conclu à
          un fondu de cinq mille secondes. *Une unité qui change entre le
          magasin et l'écran est exactement ce qu'un test doit fixer, pas ce
          qu'il doit supposer.*
        */
        expect(fondu, 'un fondu doit durer entre 0,1 et 30 secondes')
            .toBeGreaterThanOrEqual(100);
        expect(fondu).toBeLessThanOrEqual(30_000);
    });
});

test.describe('⭐ à qui appartient une atmosphère', () => {
    /*
      ⛔ **Sans étiquette, une atmosphère est COMMUNE.** C'est le défaut qui a
      permis de livrer le rattachement sans aucune migration : toutes celles
      écrites avant restent visibles partout. L'inverser les ferait disparaître
      d'un coup, et c'est irréversible du point de vue du meneur.
    */
    test('une atmosphère sans étiquette est commune', async () => {
        const { playlists } = await musique(gmos);
        expect(playlists.length, 'le module part avec au moins une atmosphère')
            .toBeGreaterThan(0);

        const commune = playlists.find(p => !p.campagneId);
        expect(commune, 'aucune atmosphère commune — le défaut s’est inversé').toBeDefined();

        /* Et l'écran le dit, dans l'infobulle du bouton déjà actif. */
        await expect(gmos.fenetre.getByRole('button', { name: /^Commune$/ }).first())
            .toBeVisible();
    });

    test('la rattacher à la campagne lui pose son étiquette', async () => {
        const avant = (await musique(gmos)).playlists.find(p => !p.campagneId)!;

        await gmos.fenetre.getByRole('button', { name: /^Cette campagne$/ }).first().click();

        await expect.poll(
            async () => (await musique(gmos)).playlists.find(p => p.id === avant.id)?.campagneId,
            { timeout: 10_000, message: 'l’atmosphère n’a pas été rattachée' },
        ).toBe('temoin-campagne');
    });

    /* Et le geste se reprend : rattacher n'est pas un aller simple. */
    test('et la rendre commune la détache', async () => {
        const cible = (await musique(gmos)).playlists.find(p => p.campagneId)!;

        await gmos.fenetre.getByRole('button', { name: /^Commune$/ }).first().click();

        await expect.poll(
            async () => (await musique(gmos)).playlists.find(p => p.id === cible.id)?.campagneId ?? null,
            { timeout: 10_000 },
        ).toBeNull();
    });
});
