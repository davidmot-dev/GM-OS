import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Ambient-OS — huit boucles à superposer, et des gabarits qui ne sonnent pas.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ LA SURPRISE QU'IL FAUT FIGER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Les thèmes livrés sont des gabarits SANS SONS.** Le guide le dit, et c'est
 * la question que se pose tout meneur qui clique « Calme Plat » la première
 * fois et n'entend rien : *est-ce cassé, ou est-ce à moi de déposer les
 * fichiers ?* C'est à lui — et c'est un choix, pas un oubli : livrer des
 * paysages sonores pèserait des centaines de mégaoctets et ne conviendrait à
 * aucune table.
 *
 * Ce fichier garde les deux moitiés de ce contrat : **les huit pistes existent**
 * et **les scènes rapides sont offertes**, mais rien ne prétend qu'un son
 * sortira. *Un gabarit vide qui se présente comme tel est honnête ; un gabarit
 * vide qui se tait est un bogue apparent.*
 *
 * ⚠️ Ce qui sort vraiment des enceintes — la superposition, le fondu, le
 * routage — reste dans la catégorie P6, comme pour Music-OS et Sound-OS.
 */

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Ambiances');
    await gmos.fenetre.getByRole('button', { name: /^SILENCE$/i }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('les huit pistes', () => {
    /*
      ⛔ Huit, pas six ni douze. Le compte est une promesse du guide, et il
      dimensionne la console : une piste de moins, et une ambiance composée
      ailleurs ne se recharge plus entièrement.
    */
    test('sont toutes là, numérotées', async () => {
        const zone = gmos.fenetre.locator('body');

        /*
          ⚠️ **En minuscules dans le DOM, en majuscules à l'écran.** La casse
          vient d'un `text-transform` de la CSS : mes sondes lisaient
          `innerText` — donc le texte *rendu*, majuscules comprises — et
          l'assertion comparait au texte réel. Un motif insensible à la casse
          évite de figer une décision de feuille de style dans un test.
        */
        for (let i = 0; i < 8; i++) {
            await expect(zone, `la piste ${i} manque`)
                .toContainText(new RegExp(`\\[track-${i}\\]`, 'i'));
        }
    });

    /*
      ⭐ **L'application le dit elle-même, et c'est ce qui sauve le meneur.**
      Chaque thème livré s'annonce « gabarit, sans sons ». Sans cette mention,
      cliquer et n'entendre rien se lit comme une panne ; avec elle, c'est une
      consigne. *Le silence honnête est celui qui se présente.*
    */
    test('et les thèmes livrés s’annoncent comme des gabarits vides', async () => {
        await expect(gmos.fenetre.locator('body'))
            .toContainText(/gabarit, sans sons/i);
    });

    test('chacune offre de charger un son', async () => {
        const charger = gmos.fenetre.getByRole('button', { name: /^Charger$/i });

        expect(await charger.count(), 'une piste sans bouton de chargement est inutilisable')
            .toBeGreaterThanOrEqual(8);
    });
});

test.describe('les scènes rapides', () => {
    /*
      Trois ambiances préparées, qui sont le chemin le plus court en pleine
      partie. Leur nom compte autant que leur existence : on les déclenche sans
      lire.
    */
    test('les trois sont offertes', async () => {
        const zone = gmos.fenetre.locator('body');

        await expect(zone).toContainText(/CALME PLAT/i);
        await expect(zone).toContainText(/TENSION/i);
        await expect(zone).toContainText(/ACTION \/ DANGER/i);
    });

    /*
      ⭐ **Le contrat du gabarit vide.** Déclencher une scène livrée ne doit rien
      casser — et ne produira aucun son tant que le meneur n'a pas déposé ses
      fichiers. Le test vérifie la première moitié ; la seconde s'entend.
    */
    test('en déclencher une ne casse rien', async () => {
        const incidents: string[] = [];
        gmos.fenetre.on('pageerror', e => incidents.push(e.message));

        await gmos.fenetre.getByRole('button', { name: /CALME PLAT/i }).first().click();
        await gmos.fenetre.waitForTimeout(1500);

        expect(
            incidents.filter(m => !/ResizeObserver loop/.test(m)),
            `déclencher un gabarit vide a levé : ${incidents.join(' | ')}`,
        ).toEqual([]);
    });
});

test.describe('le moteur', () => {
    /*
      ⚠️ Un moteur audio qui ne dit pas s'il est prêt laisse le meneur sans
      diagnostic : il cliquera, n'entendra rien, et ne saura pas s'il faut
      blâmer le fichier, la sortie ou le module.
    */
    test('annonce son état et sa latence', async () => {
        const zone = gmos.fenetre.locator('body');

        await expect(zone).toContainText(/MOTEUR PRÊT/i);
        await expect(zone, 'la latence est le seul chiffre qui permet de diagnostiquer')
            .toContainText(/LATENCE/i);
    });

    test('le silence général est à portée', async () => {
        await expect(gmos.fenetre.getByRole('button', { name: /^SILENCE$/i }).first())
            .toBeVisible();
    });
});
