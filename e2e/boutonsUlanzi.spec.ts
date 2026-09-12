import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';

/**
 * **Les trois boutons de l'afficheur — la chaîne entière, sans Home Assistant.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER GARDE, ET QU'AUCUN TEST UNITAIRE NE PEUT GARDER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La lecture de la requête est testée (`boutonsDeLUlanzi.test.ts`), le catalogue
 * des gestes aussi (`gestesDesBoutons.test.ts`). **Rien ne vérifie qu'ils sont
 * attachés** — et c'est exactement le motif que ce dépôt a payé quatre fois :
 * *une chaîne complète sans bouton au bout.*
 *
 * Ici on frappe le vrai serveur HTTP avec le vrai secret d'appairage, après
 * avoir réglé le geste **par l'écran**. Six maillons d'un coup : la liste
 * déroulante, le magasin persisté, la route, le contrôle du jeton, l'IPC vers la
 * fenêtre du meneur, et le registre des actions.
 *
 * ⭐ **Le geste choisi est le jet préréglé, et ce n'est pas un hasard** : c'est
 * le seul qui porte un argument. Il éprouve donc aussi le chemin de la charge,
 * que les autres laisseraient dans l'ombre.
 *
 * ⚠️ **L'afficheur n'est pas sollicité.** `GMOS_SANS_APPAREILS=1` le tait, et ce
 * qu'on éprouve est le chemin d'ENTRÉE. Qu'un appui sur l'objet posé au milieu
 * de la table parvienne jusqu'à Home Assistant reste hors de portée de tout test
 * — catégorie P6, à éprouver en séance.
 */

let gmos: GmOsLance;
let secret: string;

/** L'adresse du pont, telle que Home Assistant l'appellera. */
const pont = () => `http://127.0.0.1:${gmos.ports.sync}/bouton`;

async function appuyer(bouton: string, jeton: string = secret) {
    return fetch(pont(), {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-gmos-jeton': jeton },
        body: JSON.stringify({ bouton }),
    });
}

/** Le nombre de jets au pupitre — ce qu'un bouton doit faire bouger, ou pas. */
const nombreDeJets = () => gmos.fenetre.evaluate(() =>
    (window as never as {
        useDiceStore: { getState: () => { history: unknown[] } };
    }).useDiceStore.getState().history.length);

const dernierJet = () => gmos.fenetre.evaluate(() =>
    (window as never as {
        useDiceStore: { getState: () => { lastRoll: { rolls: { sides: number }[] } | null } };
    }).useDiceStore.getState().lastRoll);

test.beforeAll(async () => {
    gmos = await lancerGmOs();
    await attendreLHydratation(gmos);

    /* Le secret du poste MJ — celui que portent les tablettes, et que portera HA. */
    secret = await gmos.fenetre.evaluate(
        () => (window as never as {
            appBridge?: { pairing?: { getSecret: () => Promise<string> } };
        }).appBridge!.pairing!.getSecret(),
    );

    /*
      Le panneau des boutons vit dans les **Paramètres**, onglet Système, aux
      côtés des raccourcis clavier et du verrou de la souris.

      ⚠️ *Il était d'abord dans le tableau de bord de l'afficheur* — et ce test
      l'a fait rougir : ce tableau vit dans le cockpit, donc **on n'y arrive
      qu'une séance ouverte**. Régler ce que font des boutons est un geste de
      préparation, pas un geste de séance.
    */
    await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('⛔ la porte, avant tout le reste', () => {
    /*
      Le serveur écoute sur `0.0.0.0` : ces refus sont ce qui sépare un pont
      d'une prise de contrôle depuis le réseau d'un hôtel. *Le meneur en
      déplacement, c'est déjà arrivé ce mois-ci.*
    */
    test('sans jeton, la porte est fermée', async () => {
        const reponse = await fetch(pont(), {
            method: 'POST', body: JSON.stringify({ bouton: 'gauche' }),
        });

        expect(reponse.status).toBe(401);
    });

    test('avec un mauvais jeton, aussi', async () => {
        expect((await appuyer('gauche', 'a-peu-pres-le-bon')).status).toBe(401);
    });

    test('et un GET ne passe pas non plus', async () => {
        expect((await fetch(pont())).status).toBe(405);
    });

    /*
      ⛔ **Le refus ne doit rien apprendre.** Un inconnu qui tâtonne ne doit pas
      découvrir, requête après requête, quels noms de boutons existent.
    */
    test('le refus ne nomme aucun bouton', async () => {
        const corps = await (await appuyer('gauche', 'faux')).text();

        for (const nom of ['gauche', 'milieu', 'droite']) {
            expect(corps, `le refus a nommé « ${nom} »`).not.toContain(nom);
        }
    });

    test('un bouton inconnu est refusé, même avec le bon jeton', async () => {
        expect((await appuyer('haut')).status).toBe(400);
    });
});

test.describe('un appui réglé', () => {
    /*
      ⭐ **LE TEST DE LA CHAÎNE.** Le geste est posé par la liste déroulante, la
      formule tapée dans son champ, et l'appui arrive par le réseau. Si l'un des
      six maillons manque, ce test rougit — et lui seul.
    */
    test('fait ce que le meneur y a posé', async () => {
        await gmos.fenetre.getByLabel('Bouton droit', { exact: true }).selectOption('jet-preregle');
        await gmos.fenetre.getByLabel(/Formule du bouton droit/i).fill('1d20');

        const avant = await nombreDeJets();

        expect((await appuyer('droite')).status).toBe(200);

        await expect.poll(nombreDeJets, {
            timeout: 10_000,
            message: 'aucun jet n’est parti — la chaîne est coupée quelque part',
        }).toBe(avant + 1);

        /* Et c'est bien LE jet réglé : la charge a traversé, pas seulement l'appui. */
        const jet = await dernierJet();
        expect(jet!.rolls, 'un d20 lance UN dé').toHaveLength(1);
        expect(jet!.rolls[0].sides, 'la formule du réglage n’a pas suivi').toBe(20);
    });

    /*
      ⚠️ Et « Rien » doit vraiment ne rien faire : c'est le réglage par défaut
      des trois boutons, donc le cas le plus fréquent de tous.
    */
    test('réglé sur « Rien », ne fait rien', async () => {
        await gmos.fenetre.getByLabel('Bouton gauche', { exact: true }).selectOption('rien');

        const avant = await nombreDeJets();
        expect((await appuyer('gauche')).status).toBe(200);

        /* L'appui est reçu : on laisse passer l'aller-retour avant de conclure. */
        await gmos.fenetre.waitForTimeout(400);
        expect(await nombreDeJets()).toBe(avant);
    });

    /*
      ⛔ **Un jet sans formule ne lance RIEN.** L'état est atteignable — on
      choisit le geste avant de taper la formule — et un jet creux au milieu
      d'une scène enverrait le meneur chercher d'où il vient.
    */
    test('un jet préréglé sans formule ne lance rien, et l’écran le dit', async () => {
        await gmos.fenetre.getByLabel('Bouton du milieu', { exact: true }).selectOption('jet-preregle');

        await expect(
            gmos.fenetre.getByText(/ne lancera rien/i),
            'le trou se creuse sans que rien ne le signale',
        ).toBeVisible();

        const avant = await nombreDeJets();
        expect((await appuyer('milieu')).status).toBe(200);

        await gmos.fenetre.waitForTimeout(400);
        expect(await nombreDeJets(), 'un jet creux est parti').toBe(avant);
    });
});

test.describe('les réglages à l’écran', () => {
    /*
      ⚠️ **`exact: true` partout, et ce n'est pas de la coquetterie.**
      `getByLabel` cherche une **sous-chaîne** : « Bouton droit » désigne aussi
      « Formule du bouton droit » dès que ce champ existe. Les tests passaient
      tant qu'aucun jet n'était réglé, et rougissaient ensuite — *un sélecteur
      qui devient ambigu selon l'état de l'écran est un test qui dépend de son
      rang d'exécution.*
    */
    test('les trois boutons ont leur liste déroulante', async () => {
        for (const nom of ['Bouton gauche', 'Bouton du milieu', 'Bouton droit']) {
            await expect(gmos.fenetre.getByLabel(nom, { exact: true })).toBeVisible();
        }
    });

    /* Un champ offert et sans effet fait douter du geste entier ; un champ absent
       quand il faut rend le geste impossible. Les deux sens comptent. */
    test('le champ de formule suit le geste, dans les deux sens', async () => {
        const liste = gmos.fenetre.getByLabel('Bouton gauche', { exact: true });

        await liste.selectOption('jet-preregle');
        await expect(gmos.fenetre.getByLabel(/Formule du bouton gauche/i)).toBeVisible();

        await liste.selectOption('tour-suivant');
        await expect(gmos.fenetre.getByLabel(/Formule du bouton gauche/i)).toBeHidden();
    });

    /*
      ⚠️ La formule survit au changement de geste : *revenir au jet préréglé ne
      doit pas faire retaper ce qu'on avait déjà écrit.*
    */
    test('la formule survit à un aller-retour par un autre geste', async () => {
        const liste = gmos.fenetre.getByLabel('Bouton du milieu', { exact: true });
        const formule = () => gmos.fenetre.getByLabel(/Formule du bouton du milieu/i);

        await liste.selectOption('jet-preregle');
        await formule().fill('2d6+3');

        await liste.selectOption('rien');
        await liste.selectOption('jet-preregle');

        await expect(formule()).toHaveValue('2d6+3');
    });
});
