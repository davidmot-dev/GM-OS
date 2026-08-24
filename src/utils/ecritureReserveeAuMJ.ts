import { createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { isMainWindow } from './windowRole';

/**
 * **Lecture pour toutes les fenêtres, écriture pour la seule fenêtre MJ.**
 *
 * Le Player Hub (`?window=hub`) et le projecteur (`?window=projector`) sont des
 * fenêtres Electron ouvertes sur la **même origine** que la fenêtre MJ — voir
 * `electron/main.ts`, qui ne change que la chaîne de requête. Une même origine,
 * c'est un même `localStorage` : deux fenêtres qui persistent sous la même clé
 * ne se partagent pas un magasin, elles se le disputent.
 *
 * `PersistenceService` pose déjà exactement cette garde sur le store de session,
 * depuis la **perte des campagnes du 2026-08-07**. Ce module est la même règle,
 * extraite pour les stores persistés dans `localStorage` — *une préoccupation
 * partagée qu'on ne corrige que dans un seul de ses exemplaires est le bug de la
 * migration Gemini*, § 8 du plan du 07/08.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI L'INTERDICTION EST POSÉE À L'ÉCRITURE, ET PAS DANS `partialize`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une charge réduite reste une charge. C'est la charge elle-même qui détruit :
 * une fenêtre secondaire ne reçoit qu'une **partie** des champs par
 * synchronisation, et persiste pourtant **tout** ce que `partialize` déclare —
 * donc le reste tel qu'elle l'avait à son propre démarrage. *Ce qu'elle n'a
 * jamais reçu, elle l'écrase avec ce qu'elle a deviné.*
 *
 * `getItem` reste donc ouvert : les fenêtres secondaires continuent de lire
 * cette base, de s'hydrater et de recevoir la synchronisation. Seuls `setItem`
 * et `removeItem` deviennent muets hors de la fenêtre MJ.
 */
export function ecritureReserveeAuMJ(source: Storage): StateStorage {
    return {
        getItem: (name) => source.getItem(name),

        setItem: (name, value) => {
            if (!isMainWindow()) return;
            source.setItem(name, value);
        },

        removeItem: (name) => {
            if (!isMainWindow()) return;
            source.removeItem(name);
        },
    };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OÙ CETTE GARDE EST POSÉE, ET OÙ ELLE NE DOIT PAS L'ÊTRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Les sept stores persistés qu'une fenêtre secondaire écrit** — parce que
 * `useHubSync` et `CrossWindowEventService` appliquent la synchronisation par
 * `setState`, et qu'un `setState` sur un store persisté écrit :
 *
 * | Store | Clé | Gardé |
 * | --- | --- | --- |
 * | `useSessionOSStore` | `gmos-v5-session-os-storage` | ✅ 07/08 (`PersistenceService`, sur IndexedDB) |
 * | `useCombatStore` | `gmos-combat-storage` | ✅ 24/08 |
 * | `useMapStore` | `gmos-map-storage` | ✅ 24/08 |
 * | `useClockStore` | `gm-os-clock-storage` | ✅ 24/08 |
 * | `useWhiteboardStore` | `gm-os-whiteboard-storage-v1` | ✅ 24/08 |
 * | `useDiceStore` | `gmos-dice-storage` | ✅ 24/08 |
 * | `useFavoriteStore` | `gm-os-favorites-storage` | ✅ 24/08 |
 *
 * **⚠️ `useRessourcesDeTableStore` (`gmos-ressources-de-table`) est le huitième,
 * et il ne doit PAS recevoir cette garde telle quelle.** `useHubSync` l'écrit
 * comme les autres, mais **la tablette est censée le persister** : son propre
 * commentaire dit qu'écraser sa carte de réserves *« effacerait ce qu'une
 * tablette sait d'une partie en sommeil »*. Or `isMainWindow()` refuse aussi
 * `tablet` et `remote`.
 *
 * *Et pour ces deux-là, refuser ne protège rien* : la tablette et la
 * télécommande sont servies depuis `http://<ip>:3001/`, donc sur une **autre
 * origine** — leur `localStorage` est physiquement distinct de celui du MJ et ne
 * peut pas l'atteindre. Seuls `hub` et `projector` partagent son magasin. La
 * garde qu'il faudrait là est donc plus fine : bloquer les fenêtres de **même
 * origine**, pas toutes les fenêtres secondaires. Pour les sept ci-dessus, la
 * distinction ne change rien — aucune ne sert à la tablette — et on garde la
 * forme du précédent du 07/08 plutôt que d'en inventer une seconde.
 *
 * Prêt à poser dans les options de `persist` : `storage: stockageLocalDuMJ()`.
 *
 * La sérialisation est celle de Zustand par défaut (`createJSONStorage` sur
 * `localStorage`), donc **les bases déjà écrites se relisent à l'identique** :
 * cette garde ne change rien à la forme de ce qui est stocké, seulement à
 * l'identité de qui a le droit de l'écrire.
 */
export const stockageLocalDuMJ = () =>
    createJSONStorage(() => ecritureReserveeAuMJ(localStorage));
