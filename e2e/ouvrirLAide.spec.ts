import { test, expect } from '@playwright/test';
import path from 'node:path';
import { lancerGmOs, type GmOsLance } from './lancerGmOs';

/**
 * **Le premier test de geste : `Ctrl+H` ouvre l'aide, et la referme.**
 *
 * Choisi comme terrain d'essai parce qu'il ne risque rien — le module d'aide est
 * en **lecture seule**, il ne vit que dans la fenêtre du meneur, et il n'écrit
 * dans aucun magasin persisté. *On n'apprend pas à piloter une application en
 * commençant par l'écran qui peut détruire du travail.*
 *
 * Ce qu'il garde et qu'aucun test de Vitest ne peut garder : que la touche
 * atteigne vraiment l'application, que le module se monte, que le manuel arrive
 * du disque, et que la recherche réponde. Quatre maillons qui se testent chacun
 * en isolation aujourd'hui — *et dont rien ne vérifie qu'ils sont attachés.*
 */

let gmos: GmOsLance;

test.beforeAll(async () => { gmos = await lancerGmOs(); });
test.afterAll(async () => { await gmos?.fermer(); });

test.describe('le profil est jetable', () => {
    /*
      ⛔ Le test le plus important du dossier, et le seul qui doive rougir fort.
      Il redit à l'assertion ce que `lancerGmOs` a déjà refusé — parce qu'une
      garde qui vit uniquement dans le code du lanceur peut être contournée par
      un test qui lance l'application autrement.
    */
    test('l’application n’écrit pas dans les données réelles', async () => {
        const retenu = await gmos.application.evaluate(({ app }) => app.getPath('userData'));

        expect(path.resolve(retenu).toLowerCase())
            .toContain(path.resolve(gmos.profil).toLowerCase());
        expect(retenu.toLowerCase(), 'jamais le profil réel')
            .not.toContain('appdata\\roaming\\gm-os');
    });
});

test.describe('le périmètre', () => {
    /*
      ⛔ Ces assertions interrogent le processus principal sur ce qu'il croit
      avoir le droit de toucher. *Poser une variable et ne pas vérifier qu'elle
      est prise, c'est croire l'avoir posée* — le défaut exact que j'ai commis ce
      matin avec un contrôle dont le motif ne correspondait jamais.
    */
    test('le corpus et le coffre sont dans le profil jetable', async () => {
        const vus = await gmos.application.evaluate(() => ({
            corpus: process.env.GMOS_RACINE_DOCS ?? '(non posée)',
            coffre: process.env.GMOS_COFFRE_OBSIDIAN ?? '(non posée)',
        }));

        expect(vus.corpus.toLowerCase(), 'le corpus viserait le dépôt')
            .toContain(gmos.profil.toLowerCase());
        expect(vus.coffre.toLowerCase(), 'le coffre viserait celui du meneur')
            .toContain(gmos.profil.toLowerCase());
    });

    /*
      ⛔ **LA VARIABLE POSÉE N'ÉTAIT PAS LA VARIABLE SUIVIE.**

      Le test au-dessus vérifie que `GMOS_COFFRE_OBSIDIAN` est **posée**. Il
      passait — et le coffre fuyait quand même : chaque geste du pont Obsidian
      accepte un chemin **envoyé par l'écran**, et l'écran en envoie toujours un
      (`useObsidianStore` porte celui du meneur en dur). Toutes les exécutions
      E2E ont donc listé le vrai coffre de David, découvert le 2026-09-12.

      ⭐ Celui-ci interroge le pont **comme le ferait un écran fautif** : il lui
      demande explicitement le vrai coffre. La réponse doit être vide, parce que
      la variable l'emporte désormais. *Une isolation qui dépend de la bonne foi
      de l'appelant n'est pas une isolation.*

      ⚠️ Aucune note n'est nommée ici, et rien n'est écrit : on compte, c'est
      tout.
    */
    test('le coffre RÉELLEMENT lu est celui du profil, même si l’écran en demande un autre', async () => {
        const notes = await gmos.fenetre.evaluate(async (coffreDuMeneur: string) => {
            const pont = (window as never as {
                appBridge?: { obsidian?: { listNotes: (v?: string) => Promise<unknown[]> } };
            }).appBridge?.obsidian;
            if (!pont) return { erreur: 'pont absent' };
            return { compte: ((await pont.listNotes(coffreDuMeneur)) ?? []).length };
        }, 'C:\\Users\\david\\OneDrive\\Obsidian Vault');

        expect(notes, 'le pont Obsidian n’est pas exposé').not.toHaveProperty('erreur');
        expect(
            (notes as { compte: number }).compte,
            'le vrai coffre du meneur a été lu depuis une instance d’essai',
        ).toBe(0);
    });

    /* Aucune lampe, aucun afficheur : les seuls effets qu'on ne peut pas annuler. */
    test('les appareils sont muets', async () => {
        const muets = await gmos.application.evaluate(() => process.env.GMOS_SANS_APPAREILS);
        expect(muets).toBe('1');
    });
});

test.describe('les ports', () => {
    /*
      La preuve de bout en bout de `GMOS_PORT_SYNC` : le serveur écoute vraiment
      là où l'environnement le lui a dit. *Un réglage qu'on passe sans vérifier
      qu'il est pris est un réglage qu'on croit avoir.*
    */
    test('le SyncServer écoute sur le port attribué à ce worker', async () => {
        const reponse = await fetch(`http://127.0.0.1:${gmos.ports.sync}/`);
        expect(reponse.ok, `rien ne répond sur ${gmos.ports.sync}`).toBe(true);
    });

    /* Et surtout PAS sur le port par défaut : un GM-OS ouvert sur la machine du
       meneur ne doit pas voir les tablettes rejoindre une instance de test. */
    test('et pas sur le port par défaut', async () => {
        expect(gmos.ports.sync).not.toBe(3001);
    });
});

test.describe('les deux portes de l’aide', () => {
    /*
      Le bouton d'abord, le raccourci ensuite : ce sont deux chemins vers le même
      écran, et les tester séparément dit lequel est cassé quand l'un l'est.
    */
    test('le bouton de la barre latérale ouvre le module', async () => {
        const { fenetre } = gmos;

        await fenetre.getByRole('button', { name: /Aide/ }).click();

        await expect(fenetre.getByRole('button', { name: /Aperçu/ })).toBeVisible();
        await expect(fenetre.getByRole('button', { name: /Manuel/ })).toBeVisible();
    });

    test('Ctrl+H ouvre le module d’aide', async () => {
        const { fenetre } = gmos;

        /*
          On repart du tableau de bord pour que le raccourci ait quelque chose à
          faire — sinon il refermerait l'aide ouverte par le test précédent.

          ⚠️ **Et ce clic sert une seconde fois, découvert en écrivant ce test :**
          une frappe envoyée comme TOUTE PREMIÈRE interaction après le lancement
          n'atteint pas l'application — la page n'a pas encore le focus. Le même
          test échouait, et passe dès qu'un clic précède. *Un raccourci ne se
          teste pas sur une fenêtre que personne n'a encore touchée* — ce qui ne
          se voit jamais à l'usage, où l'on a toujours cliqué quelque part avant.
        */
        await fenetre.getByRole('button', { name: 'Tableau de Bord' }).click();

        /* La fenêtre du meneur seule écoute le clavier : les autres n'ont pas de
           barre latérale, et un raccourci n'y mènerait nulle part. */
        await fenetre.keyboard.press('Control+h');

        await expect(fenetre.getByRole('button', { name: /Aperçu/ })).toBeVisible();
    });

    /*
      La bascule, telle que David l'a voulue le 30/08 : *« la même touche qui a
      fait apparaître la page doit la faire disparaître »*. Depuis que l'aide est
      un module, « disparaître » veut dire **revenir d'où l'on vient**.
    */
    test('et Ctrl+H ramène d’où l’on vient', async () => {
        const { fenetre } = gmos;

        await fenetre.keyboard.press('Control+h');
        await expect(fenetre.getByRole('button', { name: /Aperçu/ })).toBeHidden();
    });
});

test.describe('le manuel', () => {
    test('arrive du disque et se laisse chercher', async () => {
        const { fenetre } = gmos;

        await fenetre.getByRole('button', { name: /Aide/ }).click();
        await fenetre.getByRole('button', { name: /Manuel/ }).click();

        /* Le compte est affiché à côté du titre de l'onglet : s'il est là, les
           guides ont bien traversé le pont. */
        await expect(fenetre.getByRole('button', { name: /Manuel · \d+/ })).toBeVisible();

        const recherche = fenetre.getByPlaceholder(/Chercher dans les guides/);
        await recherche.fill('pupitre');

        /* La recherche porte sur le CORPS : un guide qui ne porte pas le mot dans
           son titre doit pouvoir remonter. On vérifie qu'elle répond, et qu'elle
           ne répond pas tout — *un moteur qui rend tout ne rend rien.* */
        const resultats = fenetre.locator('aside button');
        await expect(resultats.first()).toBeVisible();
        expect(await resultats.count()).toBeLessThan(52);
    });
});
