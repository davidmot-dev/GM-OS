import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Une base ancienne rencontre du code neuf.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE TROU QUE CE FICHIER FERME
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `PersistenceService` est en `version: 10` et porte un `migrate`. **Rien ne
 * l'exerçait.** La semence entre par `distributeData` — le chemin « charger une
 * session » — et ne traverse jamais la réhydratation ; `npm run repetition`
 * part d'une base neuve. Une base écrite par une version d'hier n'était donc
 * jouée nulle part.
 *
 * ⭐ **Et on ne fabrique pas une vieille base : on en gèle une jeune.** Le témoin
 * est figé aujourd'hui ; c'est le code de demain qui le rendra ancien, sans que
 * personne n'y touche.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA CHARGE SE DÉRIVE DU TÉMOIN, ET NON D'UN SECOND FICHIER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une sauvegarde et une charge persistée n'ont pas la même enveloppe —
 * `{ version, timestamp, global, modules }` contre `{ state, version }` — mais
 * **le même contenu à l'intérieur** : `partialize` range `lesDonneesDeLaSession`,
 * et c'est exactement ce que `modules.sessionOS` capture. Le commentaire de
 * `partialize` le dit : *« une seule liste de ce qu'une session contient,
 * partagée avec la sauvegarde vers fichier »*.
 *
 * Deux fichiers gelés auraient donc dit la même chose deux fois, et auraient
 * fini par diverger. *Une donnée gelée qui vit à deux endroits en désigne une
 * fausse* — la règle que ce dépôt applique déjà à ses listes de restes.
 *
 * ⚠️ **Ce test énonce un contrat, pas le code d'aujourd'hui.** `migrate` est
 * actuellement un passe-plat ; l'assertion n'est pas « il ne fait rien », c'est
 * **« une base ancienne ne perd rien »**. Le jour où une vraie migration sera
 * écrite, ce test devra continuer à passer — sinon c'est la migration qui
 * détruit, pas le test qui vieillit.
 */

/** La charge persistée que le témoin aurait produite sous une version d'hier. */
function chargeAncienne(version: number) {
    const temoin = JSON.parse(fs.readFileSync(CAMPAGNE_TEMOIN, 'utf-8'));
    return {
        state: {
            ...temoin.modules.sessionOS,
            /* Les deux champs de vue que `partialize` garde en plus. */
            isProjecting: false,
            currentView: 'dashboard',
        },
        version,
    };
}

test.describe('une base en version 9 rencontre le code en version 10', () => {
    let gmos: GmOsLance;
    const journal: string[] = [];

    test.beforeAll(async () => {
        gmos = await lancerGmOs();
        /* Posé avant toute chose : c'est la seule trace que `migrate` laisse. */
        gmos.fenetre.on('console', m => journal.push(m.text()));
        await attendreLHydratation(gmos);

        /*
          On écrit par la porte de l'application elle-même — `persist.getOptions()`
          rend le nom ET l'adaptateur de stockage réels. Écrire dans IndexedDB à
          la main supposerait connaître le nom de la base, la version du schéma
          et la sérialisation : *trois choses qu'on recopierait, donc trois
          choses qui vieilliraient sans prévenir.*
        */
        await gmos.fenetre.evaluate(async (charge) => {
            const magasin = (window as never as {
                useSessionOSStore: {
                    persist: {
                        getOptions: () => {
                            name: string;
                            storage: { setItem: (n: string, v: unknown) => Promise<void> | void };
                        };
                    };
                };
            }).useSessionOSStore;

            const o = magasin.persist.getOptions();
            await o.storage.setItem(o.name, charge);
        }, chargeAncienne(9));

        /* Le vrai chemin : un démarrage, pas un appel à `rehydrate()`. */
        await gmos.fenetre.reload();
        await attendreLHydratation(gmos);
    });

    test.afterAll(async () => { await gmos?.fermer(); });

    test('la migration a bien eu lieu — et elle le dit', () => {
        expect(
            journal.some(l => /Migrating from version 9 to 10/.test(l)),
            'aucune trace de migration : la base a-t-elle vraiment été relue ?',
        ).toBe(true);
    });

    /*
      ⛔ LE CONTRAT. Une base ancienne ne perd rien — ni les campagnes, ni ce que
      le schéma ne nomme pas.
    */
    test('la campagne survit à la migration', async () => {
        const campagnes = await gmos.fenetre.evaluate(() => {
            const m = (window as never as {
                useSessionOSStore: { getState: () => { campaigns: { id: string }[] } };
            }).useSessionOSStore;
            return m.getState().campaigns.map(c => c.id);
        });

        expect(campagnes).toEqual(['temoin-campagne']);
    });

    test('la trame et les cartes survivent aussi', async () => {
        const etat = await gmos.fenetre.evaluate(() => {
            const m = (window as never as {
                useSessionOSStore: { getState: () => Record<string, unknown> };
            }).useSessionOSStore.getState();
            return {
                actes: ((m.actes as unknown[]) ?? []).length,
                scenes: ((m.scenes as unknown[]) ?? []).length,
                enMain: Object.values(
                    (m.deckStates as Record<string, { enMain?: unknown[] }>) ?? {},
                ).flatMap(e => e.enMain ?? []).length,
            };
        });

        expect(etat.actes, 'les actes ont disparu à la migration').toBe(2);
        expect(etat.scenes, 'les scènes ont disparu à la migration').toBe(3);
        expect(etat.enMain, 'la carte tenue en main a disparu').toBe(1);
    });
});
