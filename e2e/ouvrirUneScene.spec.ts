import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Ouvrir une scène écrit au journal — et la scène entre dans la revue.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER GARDE, ET POURQUOI IL FAUT LA VRAIE APPLICATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La décision — quoi écrire, et quand ne rien écrire — est couverte par
 * `journalDeLaTrame.test.ts`, sans fenêtre. **Ce qui ne peut se vérifier qu'ici,
 * c'est la chaîne** : que le magasin de trame atteigne le magasin de journal,
 * qu'il résolve les identifiants en noms depuis l'état réel, et que la scène
 * apparaisse ensuite dans la revue de séance.
 *
 * ⭐ **C'est le motif que ce dépôt a payé six fois** — *le chemin s'arrête avant
 * le moteur*. Les deux bouts étaient bons le 2026-09-12 : le moteur de fusion
 * marchait, la revue savait l'afficher — et rien ne faisait entrer une scène
 * jouée dans cette revue.
 */

/** Le magasin de session, vu depuis la fenêtre du meneur. */
async function trame(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const s = (window as never as {
            useSessionOSStore: { getState: () => Record<string, unknown> };
        }).useSessionOSStore.getState();
        const j = (window as never as {
            useJournalStore: { getState: () => { journals: { events: { title: string; content: string; sceneId?: string }[] }[] } };
        }).useJournalStore.getState();

        return {
            scenes: (s.scenes as { id: string; titre: string }[]).map(x => x.id),
            evenements: (j.journals[0]?.events ?? []).map(e => ({
                titre: e.title, contenu: e.content, scene: e.sceneId ?? null,
            })),
        };
    });
}

test.describe('ouvrir une scène pendant une séance', () => {
    let gmos: GmOsLance;

    test.beforeAll(async () => {
        gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await attendreLHydratation(gmos);

        /*
          ⛔ **La semence entre APRES l'hydratation**, pas avec elle. Ouvrir la
          scène sans attendre, c'est l'ouvrir avant qu'elle existe : la trame
          est encore celle du décor d'usine, `entreePourLOuvertureDeScene` rend
          `null`, et rien ne s'écrit. Le test échouait alors en accusant le
          correctif — *une course rend un verdict, jamais le bon.*
        */
        await gmos.fenetre.waitForFunction(
            () => ((window as never as {
                useSessionOSStore: { getState: () => { scenes?: { id: string }[] } };
            }).useSessionOSStore.getState().scenes ?? []).some(s => s.id === 'temoin-scene-3'),
            undefined,
            { timeout: 20_000 },
        );

        await gmos.fenetre.evaluate(() => {
            const J = (window as never as {
                useJournalStore: { getState: () => Record<string, (...a: unknown[]) => unknown> };
            }).useJournalStore;
            J.getState().startJournal({ id: 'temoin-campagne', nom: 'Le Silence de Varn' }, 'Séance témoin');

            /* « La voix dans le relais » : la scène « prévue » du témoin, celle
               qui n'a encore ni passage ni événement. */
            const S = (window as never as {
                useSessionOSStore: { getState: () => Record<string, (...a: unknown[]) => unknown> };
            }).useSessionOSStore;
            S.getState().ouvrirLaScene('temoin-scene-3', 'temoin-seance-1');
        });
    });

    test.afterAll(async () => { await gmos?.fermer(); });

    test('l’ouverture laisse une entrée, rattachée à la scène', async () => {
        const { evenements } = await trame(gmos);
        const ouverture = evenements.find(e => e.titre.includes('La voix dans le relais'));

        expect(ouverture, 'aucune entrée pour l’ouverture de la scène').toBeDefined();
        expect(ouverture!.titre).toContain('Scène ouverte');
        expect(ouverture!.scene).toBe('temoin-scene-3');
    });

    /*
      ⛔ L'assertion qui vaut la demande de David : *« je veux que tu notes les
      infos intéressantes »*. Les identifiants sont résolus en noms par le
      magasin — un test unitaire ne peut pas le prouver, il n'a pas l'état réel.
    */
    test('elle porte le décor, en clair', async () => {
        const { evenements } = await trame(gmos);
        const c = evenements.find(e => e.titre.includes('La voix dans le relais'))!.contenu;

        /* Le témoin est écrit en apostrophes droites, exprès : un jeu d'essai ne doit
           pas dépendre de la saisie typographique de qui l'a écrit. */
        expect(c, 'l’acte').toContain("Ce que Hale n'a pas dit");
        expect(c, 'le PNJ présent, par son nom').toContain('Ancre-7');
        expect(c, 'le synopsis').toContain('Ancre-7 prend la parole');
        expect(c, 'aucun identifiant brut').not.toContain('temoin-pnj-2');
    });

    /*
      ⭐ Le vrai bénéfice, et la raison d'être du correctif : `preparerLaRevue`
      part des ÉVÉNEMENTS. Sans entrée d'ouverture, une scène jouée mais
      silencieuse n'apparaissait pas — donc ni fusionnable, ni scindable. Le
      filet prévu par le plan du 08/08 était absent là où il devait servir.
    */
    test('et la scène entre dans la revue de séance', async () => {
        await gmos.fenetre.getByRole('button', { name: /Journal de Jeu/ }).click();

        /* Le titre de la scène s'édite dans un `input` : c'est sa VALEUR qu'on
           cherche, pas du texte. */
        await expect.poll(
            () => gmos.fenetre.locator('input').evaluateAll(
                (els) => els.some((e) => (e as HTMLInputElement).value === 'La voix dans le relais'),
            ),
            { timeout: 20_000 },
        ).toBe(true);
    });
});
