import { test, expect } from '@playwright/test';
import {
    lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance,
} from './lancerGmOs';

/**
 * **Le Master Storyboard s'ouvre pendant une séance — la séance perdue du 2026-09-12.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER AURAIT ATTRAPÉ, ET POURQUOI RIEN D'AUTRE NE POUVAIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * David, en pleine partie : *« le bouton Master Storyboard s'allume quand je
 * vais dessus, mais ne lance pas le storyboard »*. La vue passait bien à
 * `storyboard` ; `useLayoutManager` la ramenait au cockpit **au rendu suivant**,
 * parce que `affiniteDesVues` classait cet écran en « préparation ».
 *
 * ⛔ **Aucune erreur, aucune ligne de journal, aucun plantage.** Le mécanisme
 * faisait exactement ce qu'on lui avait dit. Un test unitaire sur la table
 * d'affinités ne l'aurait pas vu non plus : *la table était cohérente, c'est sa
 * valeur qui était fausse.* Il fallait **ouvrir une séance et cliquer.**
 *
 * ⚠️ Et le défaut se cachait derrière sa propre conséquence : une séquence qui
 * rate en séance est précisément le moment où l'on veut ouvrir le storyboard.
 * *Le défaut et l'impossibilité de le diagnostiquer étaient le même.*
 */

let gmos: GmOsLance;

/** Le titre de la vue — un `h2`, à ne pas confondre avec le bouton du même nom. */
const laVue = () => gmos.fenetre.getByRole('heading', { name: 'Master Storyboard' });
const leBouton = () => gmos.fenetre.getByRole('button', { name: 'Master Storyboard' });

/**
 * Ouvre une séance, comme le fait le bouton de séance du cockpit.
 *
 * ⚠️ On écrit dans le magasin plutôt que de cliquer : ouvrir une vraie séance
 * demande une campagne, un acte et une scène, et **ce n'est pas ce qu'on teste
 * ici**. Ce qui compte est `momentDeJeu(sessions) === 'partie'`, et c'est
 * `status: 'active'` qui le décide — voir `budgetsDeTemps.ts`.
 */
async function ouvrirUneSeance() {
    await gmos.fenetre.evaluate(() => {
        const magasin = (window as never as {
            useSessionOSStore: {
                getState: () => { sessions: { id: string; status?: string }[] };
                setState: (p: object) => void;
            };
        }).useSessionOSStore;

        const sessions = magasin.getState().sessions.map(s => ({ ...s, status: 'active' }));
        magasin.setState({ sessions });
    });
}

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Tableau de Bord');
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('hors séance — le témoin de contrôle', () => {
    /*
      ⭐ **Il vaut autant que le test suivant.** Sans lui, un storyboard cassé
      pour une tout autre raison ferait rougir le test de séance, et l'on
      conclurait au classement. *Une mesure sans contrôle accuse toujours ce
      qu'on soupçonnait.*
    */
    test('le storyboard s’ouvre en préparation', async () => {
        await leBouton().click();

        await expect(laVue(), 'le storyboard ne s’ouvre même pas hors séance').toBeVisible();
    });
});

test.describe('⛔ pendant une séance', () => {
    test('le storyboard s’ouvre aussi — et c’est là qu’il sert', async () => {
        /* On repart du cockpit : c'est de là que part le geste du meneur. */
        await gmos.fenetre.evaluate(() => {
            (window as never as {
                useSessionOSStore: { getState: () => { setCurrentView: (v: string) => void } };
            }).useSessionOSStore.getState().setCurrentView('cockpit');
        });
        await expect(leBouton()).toBeVisible();

        await ouvrirUneSeance();

        await leBouton().click();

        /*
          ⛔ **L'assertion qui tient toute la correction.** Avant le 12/09, la
          vue s'ouvrait puis se refermait dans le rendu suivant : une assertion
          immédiate aurait pu passer. `toBeVisible` attend — et c'est le retour
          au cockpit qu'on refuse.
        */
        await expect(
            laVue(),
            'le storyboard s’est refermé tout seul — le classement l’écarte de la table',
        ).toBeVisible({ timeout: 10_000 });

        /* Et il tient : on lui laisse le temps de se faire chasser. */
        await gmos.fenetre.waitForTimeout(1_000);
        await expect(laVue(), 'la vue a été reprise après coup').toBeVisible();
    });

    /*
      ⭐ La preuve par le décor : en vue storyboard, la colonne du cockpit
      s'efface (`isFullLayout`). Si elle est encore là, c'est qu'on n'y est pas —
      et c'est exactement ce que David voyait.
    */
    test('et la colonne du cockpit s’efface, preuve qu’on y est vraiment', async () => {
        await expect(leBouton()).toBeHidden();
    });
});
