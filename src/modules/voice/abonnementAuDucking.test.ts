import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { brancherLeDucking, type EtatDuDuckingDeLaVoix } from './abonnementAuDucking';

/**
 * **Le ducking ne se perd plus en silence.**
 *
 * Corrigé le 2026-09-05. Les deux moteurs audio s'abonnaient à `useVoiceStore`
 * par un `import()` différé pour éviter un cycle — mais quand ce magasin était
 * lui-même le point d'entrée du graphe, ils recevaient un module **encore en
 * cours d'évaluation**. L'abonnement levait une exception dans une promesse que
 * personne n'attend, et **la musique cessait de baisser quand le meneur parle**.
 *
 * L'arête fautive a été coupée dans `useVoiceStore` — c'est le vrai correctif, et
 * `importsDuMagasinDeVoix.test.ts` la garde fermée. Ces tests-ci tiennent le
 * filet : *une cause corrigée peut revenir par un autre chemin ; une défaillance
 * qui se dit, non.*
 */

const etat = (parle: boolean): EtatDuDuckingDeLaVoix => ({
    isDucking: parle,
    currentEffects: { duckingRange: 0.3, duckingAttack: 150 },
});

/** Un magasin minimal, comme celui de la voix. */
const magasin = () => {
    const abonnes = new Set<(e: EtatDuDuckingDeLaVoix) => void>();
    let courant = etat(false);
    return {
        getState: () => courant,
        subscribe: (rappel: (e: EtatDuDuckingDeLaVoix) => void) => {
            abonnes.add(rappel);
            return () => { abonnes.delete(rappel); };
        },
        emettre: (parle: boolean) => {
            courant = etat(parle);
            abonnes.forEach((rappel) => rappel(courant));
        },
    };
};

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('brancher le ducking', () => {
    it('suit les changements de la voix', async () => {
        const voix = magasin();
        const recus: boolean[] = [];

        await brancherLeDucking('Essai', (e) => recus.push(e.isDucking), async () => ({ useVoiceStore: voix }));
        voix.emettre(true);
        voix.emettre(false);

        expect(recus).toEqual([true, false]);
    });

    it('ne rejoue pas l’état courant au branchement', async () => {
        /*
          Tentant, mais non : plusieurs écrans remplacent le magasin de la voix
          par un substitut partiel dans leurs tests, et Music-OS lit
          `currentEffects` sans garde. L'essayer a fait tomber six fichiers.
          *Un ajout qui n'était pas le correctif ne vaut pas le risque qu'il
          introduit.*
        */
        const voix = magasin();
        voix.emettre(true);
        const recus: boolean[] = [];

        await brancherLeDucking('Essai', (e) => recus.push(e.isDucking), async () => ({ useVoiceStore: voix }));

        expect(recus).toEqual([]);
    });

    it('rend de quoi se désabonner', async () => {
        const voix = magasin();
        const recus: boolean[] = [];

        const desabonner = await brancherLeDucking('Essai', (e) => recus.push(e.isDucking), async () => ({ useVoiceStore: voix }));
        desabonner!();
        voix.emettre(true);

        expect(recus).toEqual([]);
    });

    it('réessaie un tour plus tard quand le lien est encore vide', async () => {
        /*
          **Le cas du cycle d'imports, reproduit.** Le module rendu est en cours
          d'évaluation : son lien vaut `undefined`. Il se remplit dès que
          l'évaluation s'achève — un lien ESM est vivant — d'où le second essai.
        */
        const voix = magasin();
        const module: { useVoiceStore?: typeof voix } = {};
        setTimeout(() => { module.useVoiceStore = voix; }, 0);

        const desabonner = await brancherLeDucking('Essai', () => {}, async () => module);

        expect(desabonner).not.toBeNull();
        expect(console.error).not.toHaveBeenCalled();
    });

    it('lit un lien qui LÈVE au lieu de rendre undefined', async () => {
        /* Selon la transformation du module, un lien pas encore initialisé vaut
           `undefined` ou lève une `ReferenceError`. Les deux disent « pas
           encore ». */
        const voix = magasin();
        let pret = false;
        const module = {
            get useVoiceStore() {
                if (!pret) throw new ReferenceError('zone morte temporelle');
                return voix;
            },
        };
        setTimeout(() => { pret = true; }, 0);

        await expect(brancherLeDucking('Essai', () => {}, async () => module)).resolves.not.toBeNull();
    });

    it('crie quand le magasin reste introuvable, au lieu de se taire', async () => {
        /*
          **Le cœur de la correction.** Avant, cet échec était une exception dans
          une promesse que personne n'attend : rien à l'écran, rien dans la
          console de l'application. On ne le découvrait qu'en partie, quand la
          musique couvre la voix.
        */
        const desabonner = await brancherLeDucking('MoteurDEssai', () => {}, async () => ({}));

        expect(desabonner).toBeNull();
        expect(console.error).toHaveBeenCalledTimes(1);

        const message = (console.error as unknown as { mock: { calls: string[][] } }).mock.calls[0][0];
        // Le message doit nommer le moteur ET la conséquence, pas seulement l'erreur.
        expect(message).toContain('MoteurDEssai');
        expect(message).toContain('ducking');
        expect(message).toContain('meneur parle');
    });
});
