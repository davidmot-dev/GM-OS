import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Deck-OS — piocher, défausser, remélanger, et ne jamais perdre une carte.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * L'INVARIANT QUI TIENT TOUT LE MODULE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⭐ **Un paquet doit toujours pouvoir dire où sont ses cartes.** C'est la
 * décision qui a fait de Deck-OS un quatrième tas plutôt qu'un objet
 * d'inventaire : *un inventaire aurait hérité du transfert entre joueurs sans
 * une ligne de code, mais le paquet aurait cessé de savoir compter* — et sans
 * ça, il ne sait plus ni ce qu'il reste, ni quoi remélanger.
 *
 * Ce fichier prend cette phrase au mot : **après chaque geste, le recensement
 * doit retomber sur le compte du paquet.** Pioche + défausse + main + carte
 * retournée = `cardCount`, toujours. Une carte qui s'évapore entre deux tas ne
 * se voit pas autrement — surtout pas en séance.
 *
 * ⚠️ Le témoin arrive déjà entamé, **exprès** : 4 en pioche, 1 défaussée, 1 en
 * main. Un paquet neuf ne ferait travailler aucun des trois tas.
 */

interface EtatDuPaquet {
    remainingIndices: number[];
    discardedIndices: number[];
    currentCardIndex: number | null;
    enMain?: { cardIndex: number; porteurId: string }[];
}

const PAQUET = 'temoin-paquet';

async function paquet(gmos: GmOsLance) {
    return gmos.fenetre.evaluate((id: string) => {
        const s = (window as never as {
            useSessionOSStore: { getState: () => Record<string, unknown> };
        }).useSessionOSStore.getState();
        const manifeste = (s.decks as { id: string; cardCount: number }[]).find(d => d.id === id)!;
        const etat = (s.deckStates as Record<string, EtatDuPaquet>)[id];
        return {
            total: manifeste.cardCount,
            pioche: etat.remainingIndices.length,
            defausse: etat.discardedIndices.length,
            main: (etat.enMain ?? []).length,
            retournee: etat.currentCardIndex === null ? 0 : 1,
            indicesEnMain: (etat.enMain ?? []).map(c => c.cardIndex),
        };
    }, PAQUET);
}

/** Le recensement : toute carte est quelque part, et nulle part deux fois. */
async function recensement(gmos: GmOsLance): Promise<number> {
    const p = await paquet(gmos);
    return p.pioche + p.defausse + p.main + p.retournee;
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await gmos.fenetre.waitForFunction(
        () => ((window as never as {
            useSessionOSStore: { getState: () => { decks?: unknown[] } };
        }).useSessionOSStore.getState().decks ?? []).length > 0,
        undefined,
        { timeout: 20_000 },
    );
    await gmos.fenetre.getByRole('button', { name: /^Deck-OS$/ }).first().click();
    await gmos.fenetre.getByRole('button', { name: /^Piocher$/ }).first().waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('le paquet du témoin arrive entier', () => {
    test('avec ses trois tas garnis', async () => {
        const p = await paquet(gmos);

        expect(p.total, 'le paquet témoin compte six cartes').toBe(6);
        expect(p.pioche).toBe(4);
        expect(p.defausse).toBe(1);
        expect(p.main, 'une carte est tenue par un PJ').toBe(1);
        expect(p.indicesEnMain).toEqual([2]);
    });

    test('et le recensement tombe juste', async () => {
        expect(await recensement(gmos)).toBe((await paquet(gmos)).total);
    });

    test('il est nommé à l’écran', async () => {
        await expect(gmos.fenetre.locator('main').last())
            .toContainText(/Cartes de complication/i);
    });
});

test.describe('les gestes du pupitre', () => {
    /*
      ⛔ **Après CHAQUE geste, le recensement.** C'est la seule assertion qui
      attrape une carte perdue entre deux tas — et une carte perdue ne se
      remarque qu'au remélange, des semaines plus tard.
    */
    test('piocher sort une carte de la pioche, sans en perdre', async () => {
        const avant = await paquet(gmos);

        await gmos.fenetre.getByRole('button', { name: /^Piocher$/ }).first().click();

        await expect.poll(async () => (await paquet(gmos)).pioche, { timeout: 10_000 })
            .toBe(avant.pioche - 1);
        expect(await recensement(gmos), 'une carte s’est évaporée en piochant')
            .toBe(avant.total);
    });

    test('défausser la range dans la défausse, sans en perdre', async () => {
        const avant = await paquet(gmos);

        await gmos.fenetre.getByRole('button', { name: /^Défausser$/ }).first().click();

        await expect.poll(async () => (await paquet(gmos)).defausse, { timeout: 10_000 })
            .toBe(avant.defausse + 1);
        expect(await recensement(gmos), 'une carte s’est évaporée en défaussant')
            .toBe(avant.total);
    });

    /*
      ⭐ **Le remélange reprend les cartes des joueurs — et il doit le dire.**

      Ma première version de ce test tenait pour acquis qu'une carte en main
      survivait au remélange. **Faux, et délibérément** : `shuffleDeck`
      reconstruit l'état de zéro, donc tout revient au paquet. Le code le dit en
      toutes lettres, et il ajoute la raison qui compte — *« un joueur qui tenait
      un atout le verrait s'évaporer sans explication, croirait à un bug, et
      compterait lui-même. Une correction muette est une règle perdue. »*

      D'où l'assertion qui suit : ce n'est pas seulement que les mains se vident,
      c'est que **le meneur en est averti**. *Le comportement seul serait un
      défaut ; c'est l'annonce qui en fait une règle.*
    */
    test('remélanger reprend TOUTES les cartes, et l’annonce', async () => {
        const avant = await paquet(gmos);
        expect(avant.main, 'le montage doit avoir une carte en main').toBeGreaterThan(0);

        await gmos.fenetre.getByRole('button', { name: /^Remélanger$/ }).first().click();

        await expect.poll(async () => (await paquet(gmos)).pioche, { timeout: 10_000 })
            .toBe(avant.total);

        const apres = await paquet(gmos);
        expect(apres.defausse, 'la défausse est reprise').toBe(0);
        expect(apres.main, 'les mains aussi — c’est la règle').toBe(0);
        expect(await recensement(gmos), 'le paquet ne sait plus compter après un remélange')
            .toBe(avant.total);

        /* ⛔ L'annonce, sans laquelle la reprise serait une disparition. */
        await expect(gmos.fenetre.getByText(/carte.? reprise.? des mains/i).first())
            .toBeVisible({ timeout: 10_000 });
    });
});
