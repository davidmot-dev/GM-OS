import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Fusionner et scinder une scène — le geste, pas le moteur.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le moteur est couvert depuis le 21/08 — 30 tests sur `fusionnerLesScenes` et
 * `secondeMoitieDeLaScene`. Mais la ligne est restée dans la **catégorie P6** du
 * registre pendant trois semaines : *« livrées, jamais employées sur une vraie
 * soirée »*. Et le 2026-09-12, David a essayé et n'y est pas arrivé.
 *
 * ⭐ **Ce que la reproduction a établi : le geste marche.** Ce qui manquait
 * n'était pas dans le code, c'était dans les **conditions d'apparition** — et
 * elles sont nombreuses, silencieuses, et aucune ne s'explique à l'écran.
 * Ce fichier les fige toutes, pour qu'on n'ait plus jamais à les redécouvrir.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LES QUATRE CONDITIONS, ET CE QU'ELLES ONT COÛTÉ À ÉTABLIR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. **Les événements doivent être rattachés à une scène.** `addEvent` pose
 *    `sceneId ?? laSceneCourante()`, et celle-ci ne répond que s'il y a
 *    **exactement une** scène en cours. Zéro, ou deux, et tout part sans scène.
 * 2. **La revue ne liste que les scènes qui portent des événements.**
 *    `preparerLaRevue` part des événements, pas de la trame : une scène
 *    préparée mais jamais jouée n'apparaît pas, donc ne peut pas être fusionnée.
 * 3. **« Absorber… » exige une AUTRE scène dans la revue** — donc deux scènes
 *    ayant chacune vécu.
 * 4. **Les ciseaux n'apparaissent pas sur le premier événement d'une scène**, et
 *    les événements de **trace** sont repliés derrière un bouton. Seuls `NPC`,
 *    `PJ`, `LOCATION` et `NOTE` sont du récit par défaut ; un jet de dés, un
 *    combat ou un son sont des traces. *Une séance qui n'a produit que des
 *    traces affiche « Rien qui raconte » et pas un ciseau.*
 *
 * ⚠️ La condition 4 m'a coûté deux exécutions : mes événements d'essai portaient
 * un type inventé (`NARRATIVE`), que `natureParDefaut` ne reconnaît pas — il les
 * a donc classés en trace, **sans rien dire**. C'est le défaut que le tableau
 * `TYPES_D_EVENEMENT` documente déjà, rencontré pour de vrai.
 */

/** Une séance jouée : deux scènes, des événements espacés dans le temps. */
async function poserUneSeance(gmos: GmOsLance): Promise<void> {
    await gmos.fenetre.evaluate(() => {
        const J = (window as never as {
            useJournalStore: {
                getState: () => Record<string, (...a: unknown[]) => unknown>;
                setState: (f: unknown) => void;
            };
        }).useJournalStore;

        J.getState().startJournal({ id: 'temoin-campagne', nom: 'Le Silence de Varn' }, 'Séance témoin');

        /* `NOTE` et non un type inventé : seuls quatre types sont du récit. */
        for (const [scene, titre] of [
            ['temoin-scene-1', 'Le sas s’ouvre'],
            ['temoin-scene-1', 'Le café est encore chaud'],
            ['temoin-scene-1', 'Une porte claque au fond'],
            ['temoin-scene-2', 'Hale répond trop vite'],
            ['temoin-scene-2', 'La date a été corrigée'],
        ]) {
            J.getState().addEvent({ type: 'NOTE', title: titre, content: titre, sceneId: scene });
        }

        /*
          ⛔ **Espacer les horodatages, sinon les ciseaux n'apparaissent jamais.**
          `addEvent` pose `Date.now()` lui-même : cinq appels enchaînés tombent
          dans la même milliseconde, et la règle « pas de ciseaux sur le premier
          événement » les écarte alors TOUS. Une vraie séance les espace de
          quelques secondes — le montage doit le faire aussi, sans quoi il
          mesurerait une condition que la réalité ne présente pas.
        */
        let t = Date.now() - 3_600_000;
        J.setState((s: { journals: { events: { timestamp: number }[] }[] }) => ({
            journals: s.journals.map(j => ({
                ...j,
                events: [...j.events].reverse().map(e => ({ ...e, timestamp: (t += 60_000) })).reverse(),
            })),
        }));
    });
}

/** Les scènes de la trame, telles que le magasin les détient. */
async function scenes(gmos: GmOsLance): Promise<string[]> {
    return gmos.fenetre.evaluate(() =>
        (window as never as {
            useSessionOSStore: { getState: () => { scenes: { id: string; titre: string }[] } };
        }).useSessionOSStore.getState().scenes.map(s => s.titre));
}

test.describe('la revue de séance sait fusionner et scinder', () => {
    let gmos: GmOsLance;

    test.beforeAll(async () => {
        gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await attendreLHydratation(gmos);
        await poserUneSeance(gmos);
        await gmos.fenetre.getByRole('button', { name: /Journal de Jeu/ }).click();
        /* La revue se construit à l'affichage : on attend un contrôle, pas un délai. */
        await gmos.fenetre.locator('[title^="Scinder ici"]').first().waitFor({ timeout: 20_000 });
    });

    test.afterAll(async () => { await gmos?.fermer(); });

    /*
      ⛔ L'assertion qui aurait parlé la première : les contrôles sont-ils là ?
      Un « je n'y arrive pas » commence toujours par cette question.
    */
    test('les deux contrôles sont offerts', async () => {
        await expect(gmos.fenetre.locator('select').filter({ hasText: 'Absorber' }))
            .toHaveCount(2);
        expect(await gmos.fenetre.locator('[title^="Scinder ici"]').count())
            .toBeGreaterThan(0);
    });

    /*
      ⭐ **On désigne celle qui SURVIT, on choisit celle qui disparaît** : le menu
      est posé sur la scène gardée. Le test le vérifie dans ce sens-là, sans quoi
      il figerait l'inverse de la décision d'ergonomie.
    */
    test('absorber une scène la fait disparaître de la trame', async () => {
        const avant = await scenes(gmos);
        expect(avant).toContain('Entretien avec Hale');

        const menu = gmos.fenetre.locator('select').filter({ hasText: 'Absorber' }).first();
        await menu.selectOption({ label: 'Entretien avec Hale' });
        await gmos.fenetre.getByRole('button', { name: /FUSIONNER/i }).click();

        await expect.poll(async () => await scenes(gmos))
            .not.toContain('Entretien avec Hale');
        expect(await scenes(gmos), 'la scène gardée doit rester').toContain('Amarrage');
    });

    /*
      La scission crée une seconde moitié qui porte le titre de la première,
      suffixé — elle est « à nommer », et c'est ce que le message annonce.
    */
    test('scinder crée une seconde moitié, à nommer', async () => {
        const avant = (await scenes(gmos)).length;

        await gmos.fenetre.locator('[title^="Scinder ici"]').first().click();

        await expect.poll(async () => (await scenes(gmos)).length).toBe(avant + 1);
        expect(await scenes(gmos)).toContain('Amarrage (2)');
    });
});
