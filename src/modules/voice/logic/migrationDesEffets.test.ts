import { describe, it, expect } from 'vitest';
import { debruitageMigre } from './migrationDesEffets';

describe('debruitageMigre', () => {
    it('traduit l’ancien booléen dans les deux sens', () => {
        expect(debruitageMigre({ noiseSuppression: true })).toBe('navigateur');
        expect(debruitageMigre({ noiseSuppression: false })).toBe('aucun');
    });

    it('respecte un choix déjà enregistré, sans le réécrire', () => {
        /* Le cas d'un rack relu après avoir choisi RNNoise : on n'y touche pas. */
        expect(debruitageMigre({ debruitage: 'neuronal', noiseSuppression: true })).toBe('neuronal');
        expect(debruitageMigre({ debruitage: 'aucun', noiseSuppression: true })).toBe('aucun');
    });

    it('prend le défaut quand rien n’a jamais été enregistré', () => {
        expect(debruitageMigre({})).toBe('navigateur');
        expect(debruitageMigre(null)).toBe('navigateur');
        expect(debruitageMigre(undefined)).toBe('navigateur');
    });

    it('ignore ce qui ne veut rien dire, plutôt que de le propager', () => {
        /*
          Un fichier de réglages bricolé à la main, ou une version future
          inconnue : on retombe sur le défaut au lieu d'écrire une valeur que le
          moteur ne saurait pas interpréter.
        */
        expect(debruitageMigre({ debruitage: 'rnnoise' })).toBe('navigateur');
        expect(debruitageMigre({ debruitage: 42 })).toBe('navigateur');
        expect(debruitageMigre({ noiseSuppression: 'oui' })).toBe('navigateur');
    });
});
