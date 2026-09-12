import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **La campagne témoin arrive-t-elle vraiment à l'écran ?**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER GARDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La semence traverse quatre maillons avant d'être visible : le processus
 * principal lit le fichier, le pont le passe à l'écran, `useSemence` décide de
 * l'appliquer, `distributeData` le range dans les magasins. **Chacun est testé
 * en isolation ; rien ne vérifiait qu'ils sont attachés.** C'est le motif que ce
 * dépôt a payé six fois — *le chemin s'arrête avant le moteur.*
 *
 * ⭐ **Et le test de contrôle compte autant que l'autre.** Sans lui, « la
 * campagne est à l'écran » pourrait être vrai pour une raison qui n'a rien à
 * voir avec la semence. On lance donc une seconde instance **sans** semence, et
 * on vérifie qu'elle porte le décor d'usine. *Une assertion qui ne peut pas
 * échouer ne mesure rien.*
 */

/** Ce que le magasin de session détient, vu depuis la fenêtre du meneur. */
async function etatDeSession(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const magasin = (window as never as {
            useSessionOSStore: { getState: () => Record<string, unknown> };
        }).useSessionOSStore.getState();

        return {
            campagnes: (magasin.campaigns as { id: string }[]).map(c => c.id),
            actif: magasin.activeCampaignId as string | null,
            actes: ((magasin.actes as unknown[]) ?? []).length,
            scenes: ((magasin.scenes as unknown[]) ?? []).length,
            enMain: Object.values(
                (magasin.deckStates as Record<string, { enMain?: unknown[] }>) ?? {},
            ).flatMap(e => e.enMain ?? []).length,
        };
    });
}

test.describe('semée avec le témoin gelé', () => {
    let gmos: GmOsLance;

    test.beforeAll(async () => {
        gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await attendreLHydratation(gmos);
    });
    test.afterAll(async () => { await gmos?.fermer(); });

    /*
      L'assertion qui vaut pour un humain : le nom est sur l'écran. Les
      suivantes disent ce qui est arrivé derrière.
    */
    test('la campagne du témoin est à l’écran', async () => {
        await expect(gmos.fenetre.getByText('Le Silence de Varn').first())
            .toBeVisible({ timeout: 15_000 });
    });

    /*
      ⚠️ Un sondage et non une lecture unique : la semence n'entre qu'APRÈS
      l'hydratation, donc après ce que `attendreLHydratation` sait attendre. Lire
      une seule fois rendrait le test dépendant de l'ordre de ses voisins —
      le défaut qu'on vient de corriger un cran plus haut.
    */
    test('elle a pris la place du décor d’usine', async () => {
        await expect.poll(async () => (await etatDeSession(gmos)).campagnes)
            .toEqual(['temoin-campagne']);
        expect((await etatDeSession(gmos)).actif).toBe('temoin-campagne');
    });

    /*
      ⛔ La trame est le premier contenu que ce dépôt ait vu disparaître en
      silence — une campagne exportée arrivait sans ses actes ni ses scènes, et
      rien ne le disait. Elle entre ici par `.passthrough()`, donc par un chemin
      que personne ne déclare : c'est exactement le genre de chose qui se perd
      sans message.
    */
    test('la trame arrive entière — 2 actes, 3 scènes', async () => {
        await expect.poll(async () => (await etatDeSession(gmos)).actes).toBe(2);
        expect((await etatDeSession(gmos)).scenes).toBe(3);
    });

    /* Même raison : une carte tenue en main est un état que le paquet détient. */
    test('la carte tenue en main survit au trajet', async () => {
        await expect.poll(async () => (await etatDeSession(gmos)).enMain).toBe(1);
    });
});

test.describe('sans semence — le contrôle', () => {
    let gmos: GmOsLance;

    test.beforeAll(async () => {
        gmos = await lancerGmOs();
        await attendreLHydratation(gmos);
    });
    test.afterAll(async () => { await gmos?.fermer(); });

    test('l’instance démarre sur le décor d’usine, pas sur le témoin', async () => {
        const etat = await etatDeSession(gmos);

        expect(etat.campagnes, 'le témoin serait entré sans qu’on le demande')
            .not.toContain('temoin-campagne');
        expect(etat.campagnes.length, 'une base neuve n’est pas vide, elle porte INITIAL_DATA')
            .toBeGreaterThan(0);
    });
});
