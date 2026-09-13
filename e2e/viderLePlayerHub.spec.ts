import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, type GmOsLance } from './lancerGmOs';

/**
 * **`Ctrl+0` vide l'écran des joueurs — demande de David du 2026-09-13.**
 *
 * *« Je voudrais la possibilité de fermer [la fenêtre du Player Hub] avec un
 * raccourci dédié, car en tant que MJ je ne vois pas toujours l'écran Player
 * Hub. »*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER GARDE, ET QU'AUCUN TEST UNITAIRE NE GARDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `effacerLePlayerHub.test.ts` éprouve **le geste** — ce qu'il envoie, ce qu'il
 * oublie, ce qu'il fait sans pont. Ce fichier-ci éprouve **qu'une touche
 * l'appelle**.
 *
 * ⛔ **La distinction a coûté deux défauts cette semaine** : un magasin dont
 * l'écriture et la lecture n'employaient plus la même clé, et une adresse
 * composée avec le mauvais champ. *Dans les deux cas la mécanique était juste et
 * personne ne l'appelait correctement.*
 *
 * ⚠️ **Ce qu'il ne peut pas dire** : que l'écran des joueurs se vide vraiment.
 * La fenêtre du Hub n'est pas ouverte dans une instance d'essai, et ce qui part
 * par `sendSync` ne revient pas. On vérifie **le départ**, pas l'arrivée.
 */

let gmos: GmOsLance;

/** Ce que la fenêtre du meneur croit projeter, cible par cible. */
const projections = () => gmos.fenetre.evaluate(() =>
    (window as never as {
        useImageStore: { getState: () => { projections: Record<string, string | null> } };
    }).useImageStore.getState().projections);

test.beforeAll(async () => {
    gmos = await lancerGmOs();
    await attendreLHydratation(gmos);

    /*
      ⚠️ **Un clic d'abord.** Une frappe envoyée comme toute première interaction
      n'atteint pas l'application : la page n'a pas encore le focus. Le même
      piège que `Ctrl+H`, relevé le 2026-09-12.
    */
    await ouvrirLeModule(gmos, 'Tableau de Bord');
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('⛔ Ctrl+0 vide le Player Hub', () => {
    /*
      **LE TEST DU BRANCHEMENT.** On fait croire au meneur qu'il projette, puis
      on frappe. Si le raccourci n'est pas câblé, rien ne bouge — et c'est
      exactement ce qu'un meneur ne verrait pas, puisqu'il ne regarde pas cet
      écran-là.
    */
    test('la projection du Hub est oubliée', async () => {
        await gmos.fenetre.evaluate(() => {
            (window as never as {
                useImageStore: { getState: () => { setProjection: (c: string, v: string | null) => void } };
            }).useImageStore.getState().setProjection('hub', 'm-une-image');
        });

        expect((await projections()).hub, 'la mise en scène du test a échoué').toBe('m-une-image');

        await gmos.fenetre.keyboard.press('Control+0');

        await expect.poll(async () => (await projections()).hub, {
            timeout: 5_000,
            message: 'Ctrl+0 n’a rien fait — le raccourci n’est pas branché',
        }).toBeNull();
    });

    /*
      ⭐ **Il ne touche qu'au Hub.** Un projecteur qui montre une carte n'a pas
      à s'éteindre parce qu'on range l'écran des joueurs — *le geste répond à
      « je ne vois pas le Player Hub », pas à « éteins tout ».*
    */
    test('et il ne touche pas aux autres écrans', async () => {
        await gmos.fenetre.evaluate(() => {
            const magasin = (window as never as {
                useImageStore: { getState: () => { setProjection: (c: string, v: string | null) => void } };
            }).useImageStore.getState();
            magasin.setProjection('hub', 'm-une-image');
            magasin.setProjection('ecran-2', 'm-une-carte');
        });

        await gmos.fenetre.keyboard.press('Control+0');

        await expect.poll(async () => (await projections()).hub, { timeout: 5_000 }).toBeNull();
        expect(
            (await projections())['ecran-2'],
            'le projecteur s’est éteint alors qu’on rangeait le Hub',
        ).toBe('m-une-carte');
    });

    /*
      ⚠️ **Un Hub déjà vide ne doit pas produire d'erreur.** C'est le cas le plus
      fréquent : le meneur frappe par précaution, sans savoir s'il reste quelque
      chose. *Un geste de précaution qui crie serait vite abandonné.*
    */
    test('sur un Hub déjà vide, il ne se passe rien de fâcheux', async () => {
        const incidents: string[] = [];
        gmos.fenetre.on('pageerror', e => incidents.push(e.message));

        await gmos.fenetre.keyboard.press('Control+0');
        await gmos.fenetre.waitForTimeout(300);

        expect(incidents).toEqual([]);
        expect((await projections()).hub).toBeNull();
    });
});

test.describe('la garde des raccourcis', () => {
    /*
      ⛔ **Une frappe dans un champ de saisie n'est pas un raccourci.** Taper
      « 0 » en nommant une scène ne doit pas vider l'écran des joueurs. La garde
      est partagée avec `Ctrl+1..9`, mais *une garde partagée qu'on ne vérifie
      pas sur le nouveau venu est une garde qu'on suppose.*
    */
    test('Ctrl+0 dans un champ de saisie ne vide rien', async () => {
        await gmos.fenetre.evaluate(() => {
            (window as never as {
                useImageStore: { getState: () => { setProjection: (c: string, v: string | null) => void } };
            }).useImageStore.getState().setProjection('hub', 'm-une-image');
        });

        /* On se place dans un vrai champ de l'application. */
        const champ = gmos.fenetre.locator('input[type="text"]').first();
        await champ.click();
        await champ.press('Control+0');
        await gmos.fenetre.waitForTimeout(300);

        expect(
            (await projections()).hub,
            'une frappe dans un champ a vidé l’écran des joueurs',
        ).toBe('m-une-image');
    });
});
