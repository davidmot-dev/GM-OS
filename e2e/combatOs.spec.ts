import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Combat-OS — l'initiative, le tour, et le combat qui revient de sa scène.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER ÉPROUVE POUR LA PREMIÈRE FOIS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⭐ **La bascule de combat entre deux scènes est dans la catégorie P6 du
 * registre depuis le 2026-08-20** — *« livrée, jamais employée sur une vraie
 * soirée »*. Ce que le registre demande d'y regarder : *« ouvrir un combat dans
 * une scène, changer de scène, revenir. Combattants, round et compteurs doivent
 * tous revenir — ils voyagent dans `combatsGares`. Un combat garé qui ne revient
 * pas est un affrontement perdu en pleine séance. »*
 *
 * C'est exactement ce que le dernier bloc fait, et il n'avait jamais été fait.
 *
 * ⚠️ **Le groupe séparé est un cas légitime**, pas un montage artificiel : le
 * modèle sait depuis le 2026-08-17 que deux scènes ouvertes en même temps, c'est
 * un groupe qui s'est scindé. C'est la situation où l'on bascule d'un combat à
 * l'autre — donc celle qu'il faut éprouver.
 */

/**
 * ⚠️ Le champ s'appelle **`init`**, et non `initiative`.
 *
 * `Entity` porte bien `initiative`, mais un combattant n'est pas une entité :
 * c'est un objet à lui — `{ name, init, hp, hpMax, healthSystem, faction, … }`.
 * Ma première version lisait `initiative`, obtenait `undefined`, et concluait
 * que l'initiative automatique ne servait personne. *Un champ absent se lit
 * comme une valeur fausse, et accuse le code au lieu du test.*
 */
interface Combattant { id: string; name: string; init: number; }

async function etatDuCombat(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const c = (window as never as {
            useCombatStore: { getState: () => Record<string, unknown> };
        }).useCombatStore.getState();
        return {
            combattants: (c.combatants as Combattant[]).map(x => ({
                nom: x.name, init: x.init,
            })),
            tour: c.currentTurnIdx as number,
            round: c.round as number,
            scene: c.sceneId as string | null,
            gares: Object.keys((c.combatsGares as Record<string, unknown>) ?? {}),
        };
    });
}

/** Le geste réel : bouton, champ, Valider. */
async function ajouterUnCombattant(gmos: GmOsLance, nom: string): Promise<void> {
    await gmos.fenetre.getByRole('button', { name: /Ajouter un Combattant/ }).first().click();
    await gmos.fenetre.getByPlaceholder('Saisissez ici...').fill(nom);
    await gmos.fenetre.getByRole('button', { name: /^Valider$/ }).first().click();
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);

    /*
      Deux scènes ouvertes : le groupe s'est séparé. C'est la condition du
      dernier bloc, et elle doit être posée avant que Combat-OS ne s'affiche —
      la bande des scènes se construit à l'ouverture du module.
    */
    await gmos.fenetre.waitForFunction(
        () => ((window as never as {
            useSessionOSStore: { getState: () => { scenes?: { id: string }[] } };
        }).useSessionOSStore.getState().scenes ?? []).some(s => s.id === 'temoin-scene-3'),
        undefined,
        { timeout: 20_000 },
    );
    await gmos.fenetre.evaluate(() => {
        (window as never as {
            useSessionOSStore: { getState: () => Record<string, (...a: unknown[]) => unknown> };
        }).useSessionOSStore.getState().ouvrirLaScene('temoin-scene-3', 'temoin-seance-1');
    });

    await ouvrirLeModule(gmos, 'Combat-OS');
    await gmos.fenetre.getByRole('button', { name: /Ajouter un Combattant/ }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('monter une rencontre', () => {
    test('la liste part vide, et le dit', async () => {
        expect((await etatDuCombat(gmos)).combattants).toEqual([]);
        await expect(gmos.fenetre.locator('main').last()).toContainText(/LISTE D'INITIATIVE EST VIDE/i);
    });

    test('ajouter un combattant le fait entrer dans l’initiative', async () => {
        await ajouterUnCombattant(gmos, 'Sentinelle');

        await expect.poll(async () => (await etatDuCombat(gmos)).combattants.map(c => c.nom), { timeout: 10_000 })
            .toContain('Sentinelle');
        /* Et il est à l'écran : le magasin peut être juste et l'affichage muet. */
        await expect(gmos.fenetre.locator('main').last()).toContainText('Sentinelle');
    });

    /*
      ⚠️ L'initiative automatique ne sert QUE ceux qui sont à zéro — c'est ce que
      dit son infobulle. Un test qui la relancerait sur une liste déjà servie ne
      mesurerait rien.
    */
    test('l’initiative automatique sert ceux qui sont à zéro', async () => {
        await ajouterUnCombattant(gmos, 'Ancre-7');
        await expect.poll(async () => (await etatDuCombat(gmos)).combattants.length, { timeout: 10_000 })
            .toBe(2);

        await gmos.fenetre.getByRole('button', { name: /^Standard$/ }).first().click();

        await expect.poll(
            async () => (await etatDuCombat(gmos)).combattants.every(c => c.init > 0),
            { timeout: 10_000, message: 'un combattant est resté à zéro' },
        ).toBe(true);
    });

    /*
      ⛔ Le compteur de round est ce qu'on annonce à la table. Faux, il ne se
      voit jamais — comme un jet faux.
    */
    test('le tour avance, et le round bascule après le dernier', async () => {
        const avant = await etatDuCombat(gmos);
        expect(avant.round, 'la rencontre commence au round 1').toBe(1);

        /* Autant de tours que de combattants : on doit retomber au round 2. */
        for (let i = 0; i < avant.combattants.length; i++) {
            await gmos.fenetre.getByRole('button', { name: /TOUR SUIVANT/i }).first().click();
        }

        await expect.poll(async () => (await etatDuCombat(gmos)).round, { timeout: 10_000 }).toBe(2);
    });
});

test.describe('⭐ la bascule de combat entre deux scènes', () => {
    /*
      ⛔ **L'item P6 du 2026-08-20, éprouvé pour la première fois.** Un combat
      garé qui ne revient pas est un affrontement perdu en pleine séance : les
      combattants, le round et les compteurs voyagent dans `combatsGares`, et
      rien n'avait jamais vérifié qu'ils font le trajet.
    */
    test('changer de scène gare le combat, y revenir le rend', async () => {
        /* On rattache la rencontre en cours à la première scène. */
        await gmos.fenetre.getByRole('button', { name: /Entretien avec Hale/ }).first().click();
        await expect.poll(async () => (await etatDuCombat(gmos)).scene, { timeout: 10_000 })
            .toBe('temoin-scene-2');

        const initial = await etatDuCombat(gmos);
        expect(initial.combattants.length, 'la rencontre doit avoir des combattants').toBeGreaterThan(0);

        /* On part sur l'autre scène ouverte : le combat d'ici doit se garer. */
        await gmos.fenetre.getByRole('button', { name: /La voix dans le relais/ }).first().click();

        await expect.poll(async () => (await etatDuCombat(gmos)).scene, { timeout: 10_000 })
            .toBe('temoin-scene-3');
        const ailleurs = await etatDuCombat(gmos);
        expect(ailleurs.combattants, 'la nouvelle scène part sur une rencontre vierge').toEqual([]);
        expect(ailleurs.gares, 'le combat précédent doit être garé').toContain('temoin-scene-2');

        /* Et le retour — c'est là que tout se joue. */
        await gmos.fenetre.getByRole('button', { name: /Entretien avec Hale/ }).first().click();

        await expect.poll(async () => (await etatDuCombat(gmos)).combattants.map(c => c.nom), { timeout: 10_000 })
            .toEqual(initial.combattants.map(c => c.nom));

        const retour = await etatDuCombat(gmos);
        expect(retour.round, 'le round est revenu faux').toBe(initial.round);
        expect(retour.combattants.map(c => c.init), 'les initiatives ont changé au retour')
            .toEqual(initial.combattants.map(c => c.init));
    });
});
