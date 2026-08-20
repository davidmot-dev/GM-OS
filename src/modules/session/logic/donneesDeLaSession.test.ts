import { describe, it, expect, vi } from 'vitest';
import { lesDonneesDeLaSession, CHAMPS_DURABLES } from './donneesDeLaSession';
import type { SessionOSStore } from '../store/index';

/**
 * **Ce que ces tests protègent : les PNJ et les indices sont dans la
 * sauvegarde.**
 *
 * Régression du reste signalé le 2026-08-16 et corrigé le 2026-08-20.
 * `SessionService.saveFullSession` recopiait à la main la liste de ce qu'une
 * session contient, et il y manquait `entities`, `clues` et `sessions` : la
 * persistance vivante gardait tout, donc rien ne se voyait — jusqu'au jour où
 * l'on rouvre une sauvegarde.
 *
 * Ces tests ne recopient pas la liste : **ils comparent les écrivains entre
 * eux**. Une liste recopiée dans un test ne protège que d'elle-même, et c'est
 * précisément la recopie qui a produit le défaut.
 */

vi.mock('./idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

/** Un état où chaque champ durable porte une valeur reconnaissable. */
const etatRempli = () =>
    Object.fromEntries(
        CHAMPS_DURABLES.map(champ => [champ, `valeur-de-${champ}`]),
    ) as unknown as SessionOSStore;

describe('les données durables d\'une session', () => {
    it('portent les PNJ, les indices et l\'historique des séances', () => {
        // Les trois oubliés, nommés un par un : ce sont eux le préjudice.
        const durables = lesDonneesDeLaSession(etatRempli());
        expect(durables.entities).toBe('valeur-de-entities');
        expect(durables.clues).toBe('valeur-de-clues');
        expect(durables.sessions).toBe('valeur-de-sessions');
    });

    it('ne retiennent aucun état de vue', () => {
        // Où l'on regardait n'est pas de la donnée. `partialize` en garde deux
        // pour rouvrir l'application en place ; une sauvegarde relue ailleurs
        // n'a rien à en faire.
        expect(CHAMPS_DURABLES).not.toContain('currentView');
        expect(CHAMPS_DURABLES).not.toContain('selectedDeckId');
        expect(CHAMPS_DURABLES).not.toContain('selectedEntityId');
    });

    it('ne perdent rien quand une valeur est absente du store', () => {
        // Un champ absent doit rester absent, jamais devenir un tableau vide :
        // c'est un tableau vide qui écrase, pas une clé manquante.
        const durables = lesDonneesDeLaSession({} as SessionOSStore);
        expect(durables.entities).toBeUndefined();
        expect(durables.clues).toBeUndefined();
    });
});

describe('la sauvegarde vers fichier et la persistance vivante', () => {
    it('écrivent la même liste de champs durables', async () => {
        // L'invariant qui a cédé : trois écrivains, trois listes. Si quelqu'un
        // ajoute demain un champ au store et l'oublie ici, ce test tombe.
        const { PersistenceService } = await import('./PersistenceService');
        const persiste = PersistenceService.partialize!(etatRempli());

        for (const champ of CHAMPS_DURABLES) {
            expect(persiste).toHaveProperty(champ);
        }
    });

    it('ne diffèrent que par les deux champs de vue, et délibérément', async () => {
        const { PersistenceService } = await import('./PersistenceService');
        const persiste = PersistenceService.partialize!(etatRempli());

        const enTrop = Object.keys(persiste).filter(
            k => !(CHAMPS_DURABLES as string[]).includes(k),
        );
        expect(enTrop.sort()).toEqual(['currentView', 'isProjecting']);
    });
});
