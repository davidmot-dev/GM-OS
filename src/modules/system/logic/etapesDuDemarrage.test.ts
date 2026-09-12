import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    menerUneEtape, menerLeDemarrage, alerteDuDemarrage,
    type EtapeDeDemarrage, type ResultatDEtape,
} from './etapesDuDemarrage';

/**
 * **La garde de l'écran bloqué — § 1 bis, ligne fermée le 2026-09-12.**
 *
 * ⛔ Ces tests ne vérifient pas que le démarrage marche : ils vérifient qu'il
 * **finit**. C'est une propriété différente, et c'est la seule que le défaut
 * d'origine violait — chacune des trois attentes de `bootstrap()` aboutissait
 * parfaitement les autres jours.
 *
 * ⚠️ **Minuteurs simulés partout.** Un test qui attendrait vraiment huit
 * secondes ne serait pas joué : on le raccourcirait, et le délai testé ne serait
 * plus celui du code.
 */

/** Une étape qui ne répond jamais — le cœur du défaut. */
const quiNeRepondJamais = (nom: string, delaiMs = 8_000): EtapeDeDemarrage => ({
    nom, delaiMs, faire: () => new Promise<void>(() => { /* jamais */ }),
});

const quiAboutit = (nom: string, delaiMs = 8_000): EtapeDeDemarrage => ({
    nom, delaiMs, faire: async () => { /* tout de suite */ },
});

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('une étape, menée', () => {
    it('aboutie, elle est « faite » et sans motif', async () => {
        const resultat = await menerUneEtape(quiAboutit('Médiathèque'));

        expect(resultat).toEqual<ResultatDEtape>({ nom: 'Médiathèque', etat: 'faite' });
    });

    it('rejetée, elle est « echouee » et garde le message', async () => {
        const promesse = menerUneEtape({
            nom: 'Trousseau', delaiMs: 8_000,
            faire: async () => { throw new Error('coffre verrouillé'); },
        });

        await expect(promesse).resolves.toEqual({
            nom: 'Trousseau', etat: 'echouee', motif: 'coffre verrouillé',
        });
    });

    /*
      ⚠️ Une fonction qui lève AVANT son premier `await` lève de façon
      synchrone. Sans l'enveloppe `Promise.resolve().then(...)`, l'exception
      sortirait de `menerUneEtape` elle-même et remonterait dans le démarrage —
      reconstituant exactement le blocage qu'on referme.
    */
    it('levée avant tout `await`, elle est rattrapée quand même', async () => {
        const promesse = menerUneEtape({
            nom: 'Services de fond', delaiMs: 8_000,
            faire: () => { throw new Error('rien à démarrer'); },
        });

        await expect(promesse).resolves.toMatchObject({ etat: 'echouee', motif: 'rien à démarrer' });
    });

    it('sans message, elle en porte quand même un', async () => {
        const promesse = menerUneEtape({
            nom: 'Trousseau', delaiMs: 8_000,
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            faire: async () => { throw { code: 42 }; },
        });

        await expect(promesse).resolves.toMatchObject({ motif: 'erreur sans message' });
    });

    /*
      ⛔ **LE TEST QUI TIENT TOUT LE MODULE.** `openDB` ne résout jamais quand
      une autre fenêtre tient la base — c'est ce cas-là, exactement, qui laissait
      l'interface sur `GM-OS BOOTING...` pour toujours.
    */
    it('sans réponse, elle EXPIRE au lieu d’attendre pour toujours', async () => {
        const promesse = menerUneEtape(quiNeRepondJamais('Médiathèque', 8_000));

        await vi.advanceTimersByTimeAsync(8_000);

        await expect(promesse).resolves.toEqual({
            nom: 'Médiathèque', etat: 'expiree', motif: 'aucune réponse après 8 s',
        });
    });

    it('et pas une seconde avant son délai', async () => {
        let rendue = false;
        void menerUneEtape(quiNeRepondJamais('Médiathèque', 8_000)).then(() => { rendue = true; });

        await vi.advanceTimersByTimeAsync(7_999);
        expect(rendue, 'elle a renoncé trop tôt').toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        expect(rendue).toBe(true);
    });

    /*
      Le minuteur d'expiration doit mourir avec l'étape. Un minuteur laissé
      pendant tiendrait la boucle d'événements d'Electron éveillée, et surtout
      il rendrait cette suite de tests dépendante de son ordre d'exécution.
    */
    it('aboutie, elle ne laisse aucun minuteur derrière elle', async () => {
        await menerUneEtape(quiAboutit('Médiathèque'));

        expect(vi.getTimerCount(), 'un minuteur est resté armé').toBe(0);
    });
});

describe('le démarrage, mené en entier', () => {
    it('rend chaque étape, dans l’ordre déclaré', async () => {
        const rapport = await menerLeDemarrage([
            quiAboutit('Médiathèque'), quiAboutit('Trousseau'), quiAboutit('Services de fond'),
        ]);

        expect(rapport.etapes.map(e => e.nom)).toEqual(['Médiathèque', 'Trousseau', 'Services de fond']);
        expect(rapport.degrade).toBe(false);
    });

    /*
      ⭐ **Le comportement qui referme le défaut.** Avant, une étape muette
      emportait toutes les suivantes — `Promise.all` ne rendait rien, et
      `setSystemReady(true)` n'était jamais atteint. Ici, la suite passe.
    */
    it('une étape muette n’emporte plus les suivantes', async () => {
        const promesse = menerLeDemarrage([
            quiNeRepondJamais('Médiathèque', 8_000),
            quiAboutit('Trousseau'),
            quiAboutit('Services de fond'),
        ]);

        await vi.advanceTimersByTimeAsync(8_000);
        const rapport = await promesse;

        expect(rapport.etapes.map(e => e.etat)).toEqual(['expiree', 'faite', 'faite']);
        expect(rapport.degrade, 'le rapport doit avouer l’amputation').toBe(true);
    });

    /* Et une étape qui échoue non plus — l'ancien `Promise.all` s'y arrêtait. */
    it('une étape en échec n’emporte plus les suivantes', async () => {
        const rapport = await menerLeDemarrage([
            { nom: 'Trousseau', delaiMs: 8_000, faire: async () => { throw new Error('refus'); } },
            quiAboutit('Services de fond'),
        ]);

        expect(rapport.etapes.map(e => e.etat)).toEqual(['echouee', 'faite']);
    });

    /*
      ⛔ La propriété centrale, redite sans détour : **le démarrage n'a pas de
      chemin qui ne finit pas**. Trois étapes muettes, et il rend quand même.
    */
    it('ne peut pas ne pas finir', async () => {
        const promesse = menerLeDemarrage([
            quiNeRepondJamais('Médiathèque', 8_000),
            quiNeRepondJamais('Trousseau', 8_000),
            quiNeRepondJamais('Services de fond', 8_000),
        ]);

        await vi.advanceTimersByTimeAsync(24_000);

        await expect(promesse).resolves.toMatchObject({ degrade: true });
    });

    /*
      ⚠️ *Expirer n'est pas annuler.* L'étape continue sa vie ; son résultat
      tardif ne doit rien changer au verdict déjà rendu.
    */
    it('une étape qui aboutit APRÈS son délai ne réécrit pas le verdict', async () => {
        const promesse = menerLeDemarrage([{
            nom: 'Médiathèque', delaiMs: 8_000,
            faire: () => new Promise<void>(resoudre => setTimeout(resoudre, 30_000)),
        }]);

        await vi.advanceTimersByTimeAsync(40_000);

        expect((await promesse).etapes[0].etat).toBe('expiree');
    });

    /*
      L'écran d'attente vit de ce rappel : sans lui, il dirait « BOOTING » sans
      dire de quoi — le défaut d'origine, à l'identique.
    */
    it('annonce l’étape en cours, puis `null` à la fin', async () => {
        const vus: (string | null)[] = [];

        await menerLeDemarrage([quiAboutit('Médiathèque'), quiAboutit('Trousseau')], nom => vus.push(nom));

        expect(vus).toEqual(['Médiathèque', 'Trousseau', null]);
    });

    it('et transmet ce qui est déjà rendu', async () => {
        const comptes: number[] = [];

        await menerLeDemarrage(
            [quiAboutit('Médiathèque'), quiAboutit('Trousseau')],
            (_, rendus) => comptes.push(rendus.length),
        );

        expect(comptes).toEqual([0, 1, 2]);
    });

    it('sans étape, il rend un rapport vide et non dégradé', async () => {
        await expect(menerLeDemarrage([])).resolves.toEqual({ etapes: [], degrade: false });
    });
});

describe('ce qu’on dit au meneur', () => {
    it('rien, quand tout a abouti', () => {
        expect(alerteDuDemarrage({ etapes: [{ nom: 'Médiathèque', etat: 'faite' }], degrade: false }))
            .toBeNull();
    });

    /*
      ⛔ **Les NOMS, jamais un compte.** « 2 étapes ont échoué » n'aide personne ;
      « Médiathèque » dit où regarder.
    */
    it('les noms des étapes manquées, et leur motif', () => {
        const alerte = alerteDuDemarrage({
            degrade: true,
            etapes: [
                { nom: 'Médiathèque', etat: 'expiree', motif: 'aucune réponse après 8 s' },
                { nom: 'Trousseau', etat: 'echouee', motif: 'coffre verrouillé' },
                { nom: 'Services de fond', etat: 'faite' },
            ],
        });

        expect(alerte).toContain('Médiathèque');
        expect(alerte).toContain('aucune réponse après 8 s');
        expect(alerte).toContain('Trousseau');
        expect(alerte, 'une étape réussie n’a rien à faire dans une alerte')
            .not.toContain('Services de fond');
    });
});
