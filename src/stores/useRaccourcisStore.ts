import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockageLocalDuMJ } from '../utils/ecritureReserveeAuMJ';
import type { ModuleID } from '../store/useSessionStore';
import { PLACES_DE_RACCOURCI, RACCOURCIS_PAR_DEFAUT } from '../data/catalogueDesModules';

/**
 * **Les neuf places de `Ctrl+1` à `Ctrl+9`.**
 *
 * Demandé par David le 2026-08-30 : *« l'application devient très complexe, je
 * voudrais des raccourcis pour ouvrir certaines fonctionnalités »*. Vingt
 * modules, neuf places : c'est **lui** qui décide lesquels, parce que les
 * modules d'une séance ne sont pas les mêmes selon le jeu qu'on mène.
 *
 * Le reste s'atteint par la palette, qui les connaît tous.
 *
 * Persisté sous le stockage réservé au MJ, comme les autres magasins d'écran :
 * le Player Hub et le projecteur partagent la même origine, et une fenêtre qui
 * n'a pas de barre latérale n'a rien à dire sur les raccourcis de celle qui en
 * a une.
 */
interface EtatDesRaccourcis {
    /** Neuf entrées, dans l'ordre des touches. `null` = place libre. */
    places: (ModuleID | null)[];
    assignerLaPlace: (rang: number, module: ModuleID | null) => void;
    /** Rend les neuf places à leur valeur d'origine. */
    reinitialiser: () => void;
}

/**
 * Ramène une liste à exactement neuf entrées.
 *
 * *Une liste relue plus courte que prévu ferait sortir `places[8]` du tableau,*
 * et le raccourci n'ouvrirait rien sans qu'on sache pourquoi — le cas se
 * produit dès qu'on ajoute une place, sur toute base écrite avant.
 */
function neufPlaces(liste: (ModuleID | null)[] | undefined): (ModuleID | null)[] {
    const base = liste ?? RACCOURCIS_PAR_DEFAUT;
    return Array.from({ length: PLACES_DE_RACCOURCI }, (_, i) => base[i] ?? null);
}

export const useRaccourcisStore = create<EtatDesRaccourcis>()(
    persist(
        (set) => ({
            places: neufPlaces(RACCOURCIS_PAR_DEFAUT),

            assignerLaPlace: (rang, module) => set((etat) => {
                if (rang < 0 || rang >= PLACES_DE_RACCOURCI) return etat;
                /*
                  **Un module ne tient qu'une place.** L'assigner ailleurs le
                  retire d'abord de la sienne : sans cela, deux touches
                  ouvriraient le même écran et David chercherait longtemps
                  laquelle il avait voulu changer.
                */
                const places = etat.places.map(p => (p === module && module !== null ? null : p));
                places[rang] = module;
                return { places };
            }),

            reinitialiser: () => set({ places: neufPlaces(RACCOURCIS_PAR_DEFAUT) }),
        }),
        {
            name: 'gmos-raccourcis-storage',
            storage: stockageLocalDuMJ(),
            // La longueur est rétablie à la relecture, jamais supposée.
            merge: (persiste, courant) => ({
                ...courant,
                ...(persiste as Partial<EtatDesRaccourcis>),
                places: neufPlaces((persiste as Partial<EtatDesRaccourcis>)?.places),
            }),
        },
    ),
);
