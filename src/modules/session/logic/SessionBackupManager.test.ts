import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * **Le juge de la sauvegarde automatique.**
 *
 * Il porte les garde-fous qui protègent les **données** — ceux qui protègent
 * l'application vivent dans `electron/sauvegardeAutomatique.test.ts`.
 *
 * Celui qui compte le plus est le troisième : *une sauvegarde qui tourne
 * pendant que le store porte les mocks archive « The Eternal Quest » par-dessus
 * les bonnes sauvegardes.* C'est la perte du 2026-08-24, retournée — le filet
 * devenu mécanisme de perte.
 */

const role = vi.hoisted(() => ({ current: 'gm' as string }));
const ecriture = vi.hoisted(() => ({ ouverte: true }));

vi.mock('../../../utils/windowRole', () => ({
    getWindowRole: () => role.current,
    isMainWindow: () => role.current === 'gm',
}));

vi.mock('./PersistenceService', () => ({
    lEcritureEstOuverte: () => ecriture.ouverte,
}));

vi.mock('../../../store/SessionService', () => ({ construireLaSauvegarde: () => ({}) }));
vi.mock('../useSessionOSStore', () => ({ useSessionOSStore: { getState: () => ({}) } }));

const { fautIlSauvegarder } = await import('./SessionBackupManager');

const VRAIES = { campaigns: [{ id: 'c-1774865486579' }] };

beforeEach(() => {
    role.current = 'gm';
    ecriture.ouverte = true;
});

describe('fautIlSauvegarder', () => {
    it('accepte un état réel dans la fenêtre MJ', () => {
        expect(fautIlSauvegarder(VRAIES)).toEqual({ ecrire: true });
    });

    it.each(['hub', 'projector', 'tablet', 'remote'])("refuse depuis la fenêtre '%s'", (secondaire) => {
        role.current = secondaire;
        const v = fautIlSauvegarder(VRAIES);
        expect(v.ecrire).toBe(false);
        if (!v.ecrire) expect(v.raison).toBe('fenetre-secondaire');
    });

    /**
     * Le lien avec la garde du 2026-08-27 : tant que la base n'a pas été relue,
     * ce que le store porte en mémoire, ce sont les données d'initialisation.
     */
    it('refuse tant que l’écriture n’est pas ouverte', () => {
        ecriture.ouverte = false;
        const v = fautIlSauvegarder(VRAIES);
        expect(v.ecrire).toBe(false);
        if (!v.ecrire) expect(v.raison).toBe('ecriture-fermee');
    });

    it('refuse les campagnes de démonstration', () => {
        const v = fautIlSauvegarder({ campaigns: [{ id: 'c-1' }, { id: 'c-2' }] });
        expect(v.ecrire).toBe(false);
        if (!v.ecrire) expect(v.raison).toBe('donnees-de-demonstration');
    });

    it('refuse un état sans campagne', () => {
        const v = fautIlSauvegarder({ campaigns: [] });
        expect(v.ecrire).toBe(false);
        if (!v.ecrire) expect(v.raison).toBe('aucune-campagne');
    });

    /**
     * Le cas qui distingue « ne sauvegarde pas les mocks » de « ne sauvegarde
     * pas quand il y a un c-1 » : un vrai jeu de données qui contiendrait une
     * campagne d'identifiant `c-1` doit passer, dès qu'une autre l'accompagne.
     */
    it('accepte dès qu’une campagne n’est pas de démonstration', () => {
        expect(fautIlSauvegarder({ campaigns: [{ id: 'c-1' }, { id: 'c-1774865486579' }] }))
            .toEqual({ ecrire: true });
    });
});
