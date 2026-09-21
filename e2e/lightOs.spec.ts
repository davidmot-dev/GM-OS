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

/**
 * ⭐ **L'atelier d'effets, atteignable SANS LAMPE — la garde qui manquait.**
 *
 * ⛔ Le défaut, ouvert le 2026-09-20 et corrigé le 21 : l'écran des effets ne
 * s'ouvrait que depuis le pied de page d'une **lampe**. Sans pont branché, il
 * n'y a aucune lampe à l'écran, donc aucun bouton, donc **pas d'atelier** —
 * alors qu'il sait très bien composer un effet sans elles.
 *
 * ⭐ *Une fonctionnalité qu'on ne peut pas atteindre n'existe pas.*
 *
 * ⚠️ **Et cette suite est le bon juge**, par accident heureux : elle tourne avec
 * `GMOS_SANS_APPAREILS=1`, donc **sans aucune lampe**. C'est exactement l'état
 * dans lequel le défaut se produisait — *un test qui n'a pas les conditions du
 * défaut ne garde rien.*
 */
/**
 * ⚠️ **Chaque essai ouvre l'écran lui-même.** Le premier jet les enchaînait, et
 * ils ne passaient qu'ensemble : *un essai qui dépend de celui d'avant ne dit
 * plus lequel des deux est cassé.*
 */
async function ouvrirLAtelier() {
    /* On referme ce qu'un essai précédent aurait laissé ouvert. Échap sur un
       écran déjà fermé ne fait rien, et c'est ce qui rend le geste sûr. */
    await gmos.fenetre.keyboard.press('Escape');
    await gmos.fenetre.keyboard.press('Escape');
    await gmos.fenetre.getByRole('button', { name: /Mes effets/ }).first().click();
    await gmos.fenetre.getByRole('button', { name: /Créer un effet/ }).first()
        .waitFor({ timeout: 10_000 });
}

test.describe('⭐ l’atelier d’effets sans lampe', () => {
    test('s’ouvre depuis la barre du haut', async () => {
        await ouvrirLAtelier();

        await expect(
            gmos.fenetre.getByRole('button', { name: /Créer un effet/ }).first(),
            'l’atelier n’est pas atteignable sans lampe',
        ).toBeVisible();
    });

    test('et « Créer un effet » ouvre l’atelier, étapes comprises', async () => {
        await ouvrirLAtelier();

        /*
          ⭐ **CE QUI EST PEINT À CET ENDROIT — et c'est la garde de ce fichier.**

          Le premier jet de cet écran s'ouvrait **sans portail** depuis la barre du
          haut, dont le `<header>` porte `backdrop-blur-sm`. `backdrop-filter`
          créant un bloc conteneur pour les éléments `fixed`, l'écran se
          positionnait par rapport au **bandeau** et non à la fenêtre : décalé,
          rogné, illisible — David l'a vu avant moi, capture à l'appui.

          ⚠️ **Cet essai le disait déjà, et je l'ai expliqué au lieu de
          l'écouter** : Playwright refusait de cliquer (*« element is outside of
          the viewport »*) et `elementFromPoint` ne rendait **rien** au centre de
          la boîte mesurée. Les deux symptomes d'un élément posé dans un autre
          repère. *Un contrôle mécanique qu'on explique au lieu de l'écouter ne
          sert à rien.*

          ⭐ *La question juste n'est pas « puis-je l'atteindre ? » mais
          « qu'est-ce qui est peint à cet endroit ? »*
        */
        const bouton = gmos.fenetre.getByRole('button', { name: /Créer un effet/ }).first();
        const boite = await bouton.boundingBox();
        expect(boite, 'le bouton n’a aucune boîte').not.toBeNull();

        const peint = await gmos.fenetre.evaluate(({ x, y }) => {
            const cible = document.elementFromPoint(x, y);
            if (!cible) return 'rien — le point est hors de la vue';
            return cible.closest('button')?.textContent?.trim() ?? cible.className;
        }, { x: boite!.x + boite!.width / 2, y: boite!.y + boite!.height / 2 });

        expect(
            peint,
            'l’écran des effets n’est pas peint là où il se mesure — un ascendant le retient',
        ).toMatch(/Créer un effet/);

        await bouton.click();

        await expect(gmos.fenetre.getByPlaceholder(/Nom de l’effet/)).toBeVisible();
        await expect(
            gmos.fenetre.getByRole('button', { name: /Ajouter une étape/ }),
            'l’atelier s’ouvre sans son geste principal',
        ).toBeVisible();

        /* L'effet neuf est bien dans le magasin, avec ses deux étapes. */
        const effets = await gmos.fenetre.evaluate(() => {
            const l = (window as never as {
                useLightStore: { getState: () => { effetsDAtelier: { etapes: unknown[] }[] } };
            }).useLightStore.getState();
            return l.effetsDAtelier.map(e => e.etapes.length);
        });
        expect(effets.length).toBeGreaterThan(0);
        expect(
            effets[0], 'un effet neuf doit bouger, donc porter deux étapes',
        ).toBeGreaterThanOrEqual(2);
    });

    /**
     * ⚠️ **Poser un effet reste impossible, et l'écran le dit.** Sans lampe, il
     * n'y a personne à qui le poser : *un bouton qui n'écrit rien est pire que pas
     * de bouton*, la leçon payée la veille sur la pastille de boucle.
     */
    test('mais il ne prétend pas pouvoir poser un effet', async () => {
        await ouvrirLAtelier();

        await expect(gmos.fenetre.getByText(/gestion seule/).first()).toBeVisible();
        await expect(
            gmos.fenetre.getByRole('button', { name: /^Bougie/ }).first(),
            'l’écran laisse croire qu’on peut poser un effet',
        ).toBeDisabled();
    });
});
