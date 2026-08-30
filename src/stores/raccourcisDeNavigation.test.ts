import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PLACES_DE_RACCOURCI, RACCOURCIS_PAR_DEFAUT, CATALOGUE_DES_MODULES, MODULES_ATTEIGNABLES } from '../data/catalogueDesModules';

/**
 * **Ctrl+1 à Ctrl+9 — demandé par David le 2026-08-30 :** *« l'application
 * devient très complexe, je voudrais des raccourcis pour ouvrir certaines
 * fonctionnalités ».*
 *
 * Ce qui est gardé ici n'est pas le geste — il se voit — mais les trois façons
 * dont ce réglage se dégrade sans rien dire : une place hors du tableau, un
 * module assis sur deux touches, et un catalogue qui prend du retard sur la
 * liste des modules.
 */

vi.mock('../modules/session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

const { useRaccourcisStore } = await import('./useRaccourcisStore');

beforeEach(() => {
    useRaccourcisStore.getState().reinitialiser();
});

describe('le catalogue, source unique de la page d’aide', () => {
    /**
     * L'écran du meneur se **dérive** du catalogue au lieu de recopier les
     * modules. Un module rangé dans une famille que la page n'affiche pas
     * disparaîtrait de l'aide sans que rien ne le dise — *une page d'aide
     * recopiée à la main est une page d'aide qui ment au bout de trois mois.*
     */
    it('range chaque module dans une famille affichée', async () => {
        const { FAMILLES, modulesDeLaFamille } = await import('../data/catalogueDesModules');
        const familles = Object.keys(FAMILLES) as (keyof typeof FAMILLES)[];

        const ranges = familles.flatMap(f => modulesDeLaFamille(f));
        expect(ranges.sort()).toEqual(Object.keys(CATALOGUE_DES_MODULES).sort());
    });

    it('donne à chaque module une ligne de description', () => {
        for (const [id, entree] of Object.entries(CATALOGUE_DES_MODULES)) {
            expect(entree.resume.trim().length, id).toBeGreaterThan(10);
        }
    });
});

describe('le catalogue des modules', () => {
    /**
     * Le type est un `Record<ModuleID, …>` : ce test ne vérifie donc pas
     * l'exhaustivité — **le compilateur s'en charge**, et refuse de construire
     * si un module manque. Il vérifie que la liste utilisable n'est pas vide et
     * qu'elle écarte bien ce qui n'a rien à faire sous une touche.
     */
    it('propose les modules atteignables et écarte le débogage', () => {
        expect(MODULES_ATTEIGNABLES.length).toBeGreaterThan(10);
        expect(MODULES_ATTEIGNABLES).not.toContain('debug');
        expect(CATALOGUE_DES_MODULES.debug.atteignable).toBe(false);
    });

    it('ne propose par défaut que des modules atteignables', () => {
        for (const module of RACCOURCIS_PAR_DEFAUT) {
            if (module) expect(MODULES_ATTEIGNABLES, module).toContain(module);
        }
    });
});

describe('les neuf places', () => {
    it('en tient exactement neuf', () => {
        expect(useRaccourcisStore.getState().places).toHaveLength(PLACES_DE_RACCOURCI);
    });

    it('assigne un module à une place', () => {
        useRaccourcisStore.getState().assignerLaPlace(4, 'voice');
        expect(useRaccourcisStore.getState().places[4]).toBe('voice');
    });

    it('libère une place', () => {
        useRaccourcisStore.getState().assignerLaPlace(0, null);
        expect(useRaccourcisStore.getState().places[0]).toBe(null);
    });

    /**
     * **Un module ne tient qu'une place.** Sans cela, deux touches ouvriraient
     * le même écran et David chercherait longtemps laquelle il avait voulu
     * changer.
     */
    it('retire un module de son ancienne place quand on le déplace', () => {
        useRaccourcisStore.getState().assignerLaPlace(0, 'combat');
        useRaccourcisStore.getState().assignerLaPlace(6, 'combat');

        const places = useRaccourcisStore.getState().places;
        expect(places[6]).toBe('combat');
        expect(places[0]).toBe(null);
        expect(places.filter(p => p === 'combat')).toHaveLength(1);
    });

    /** Plusieurs places libres ne se marchent pas dessus, elles. */
    it('laisse coexister plusieurs places libres', () => {
        useRaccourcisStore.getState().assignerLaPlace(1, null);
        useRaccourcisStore.getState().assignerLaPlace(2, null);

        const places = useRaccourcisStore.getState().places;
        expect(places.filter(p => p === null)).toHaveLength(2);
    });

    /**
     * *Une place hors du tableau ne lèverait rien* : elle allongerait le
     * tableau en silence, et la touche correspondante n'ouvrirait jamais rien.
     */
    it('ignore un rang hors des neuf places', () => {
        useRaccourcisStore.getState().assignerLaPlace(PLACES_DE_RACCOURCI, 'voice');
        useRaccourcisStore.getState().assignerLaPlace(-1, 'voice');

        expect(useRaccourcisStore.getState().places).toHaveLength(PLACES_DE_RACCOURCI);
        expect(useRaccourcisStore.getState().places).not.toContain('voice');
    });
});
