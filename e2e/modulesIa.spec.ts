import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Cortex, Forge, Nexus Wiki — ce qui reste vérifiable sans modèle ni corpus.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ POURQUOI CES TROIS-LÀ PARTAGENT UN SEUL FICHIER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ils ont la même limite, et elle est totale : **aucune clé d'API, aucun modèle
 * local, aucun corpus.** Rien de ce qu'ils font vraiment — répondre, dériver un
 * pilote, chercher dans des notes — ne peut être exercé ici. Leur donner trois
 * fichiers ferait croire à une couverture qui n'existe pas.
 *
 * ⭐ **Ce qui reste n'est pas rien pour autant.** Un module d'IA sans clé doit
 * **s'ouvrir, se présenter et dire ce qu'il attend** — pas rester blanc ni
 * lever. *Un écran vide devant lequel on ne sait pas quoi faire est un défaut,
 * même quand le moteur est hors de portée.* C'est la seule moitié testable, et
 * c'est celle qu'un meneur rencontre en premier.
 *
 * Le reste — la qualité des réponses, la dérivation d'un pilote, la pertinence
 * du corpus — relève de la catégorie P6 et se juge en jouant.
 */

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('le Cortex', () => {
    test.beforeAll(async () => {
        await ouvrirLeModule(gmos, 'Cortex IA');
        await gmos.fenetre.getByPlaceholder(/Demandez à/).first().waitFor({ timeout: 20_000 });
    });

    /*
      Huit personas, et leur nom est leur mode d'emploi : on choisit « Le
      Cartographe » ou « Le Stratège » sans lire de documentation.
    */
    test('offre ses huit personas', async () => {
        const zone = gmos.fenetre.locator('body');

        for (const gem of [
            'LE SAGE', 'LE SCRIBE', "L'ORACLE", 'LE BARDE',
            "L'ALCHIMISTE", "L'ACTEUR", 'LE CARTOGRAPHE', 'LE STRATÈGE',
        ]) {
            await expect(zone, `le persona « ${gem} » manque`).toContainText(gem, { ignoreCase: true });
        }
    });

    /*
      ⭐ Sans clé, le module doit quand même **inviter**. Un champ de saisie qui
      nomme son interlocuteur — « Demandez à Le Sage… » — dit à la fois qu'on
      peut écrire et à qui l'on parle.
    */
    test('invite à écrire, et nomme son interlocuteur', async () => {
        await expect(gmos.fenetre.getByPlaceholder(/Demandez à/).first()).toBeVisible();
    });

    test('et annonce les fournisseurs qu’il sait joindre', async () => {
        const zone = gmos.fenetre.locator('body');

        await expect(zone).toContainText(/GEMINI/i);
        await expect(zone).toContainText(/OPENAI/i);
        await expect(zone).toContainText(/ANTHROPIC/i);
    });
});

test.describe('la Forge', () => {
    test.beforeAll(async () => {
        await ouvrirLeModule(gmos, 'Forge');
        await gmos.fenetre.getByRole('button', { name: /Dériver le pilote/i }).first()
            .waitFor({ timeout: 20_000 });
    });

    /*
      ⚠️ Quatre ateliers distincts, et les confondre coûte cher : « Structure
      Système » décrit un JEU, « Campagne » transforme un SCÉNARIO. *Deux gestes
      qui ne se rattrapent pas l'un l'autre.*
    */
    test('sépare ses quatre ateliers', async () => {
        const zone = gmos.fenetre.locator('body');

        for (const atelier of ['Campagne', 'Trame', 'Structure Système', 'Atelier de Règles']) {
            await expect(zone, `l'atelier « ${atelier} » manque`).toContainText(atelier, { ignoreCase: true });
        }
    });

    /*
      ⭐ L'état vide le plus utile du module : il ne dit pas « rien », il dit
      **quoi faire pour qu'il se passe quelque chose**.
    */
    test('son état d’attente explique le geste manquant', async () => {
        const zone = gmos.fenetre.locator('body');

        await expect(zone).toContainText(/EN ATTENTE DE TRANSMUTATION/i);
        await expect(zone, 'l’attente doit nommer ce qui manque')
            .toContainText(/Sélectionnez vos documents de règles/i);
    });
});

test.describe('le Nexus Wiki', () => {
    test.beforeAll(async () => {
        await ouvrirLeModule(gmos, 'Nexus Wiki');
        await gmos.fenetre.getByPlaceholder('Chercher une note...').waitFor({ timeout: 20_000 });
    });

    /*
      ⚠️ **Rien n'est écrit ici, et aucune note n'est nommée dans les
      assertions.** Le module lit un coffre Obsidian dont l'isolation est
      imparfaite — voir le § 1 bis du registre : l'écran envoie son propre chemin
      au processus principal, qui lui obéit. Tant que ce n'est pas refermé, un
      test qui écrirait toucherait un vrai coffre, et un test qui citerait une
      note figerait le contenu personnel du meneur dans le dépôt.
    */
    test('offre sa recherche', async () => {
        await expect(gmos.fenetre.getByPlaceholder('Chercher une note...')).toBeVisible();
    });

    test('et invite à choisir une note', async () => {
        await expect(gmos.fenetre.locator('body'))
            .toContainText(/SELECT A NOTE TO BEGIN/i);
    });
});
