import { createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { isMainWindow } from './windowRole';
import { ecritureDifferee, type StockageDiffere } from './ecritureDifferee';

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
/**
 * Tous les stockages différés en service, pour pouvoir les vider ensemble.
 *
 * ⭐ **Les écouteurs sont posés une fois, pas une fois par magasin.** Huit
 * magasins passent par ici ; les brancher chacun donnerait vingt-quatre
 * écouteurs qui font tous la même chose. *Et surtout : un seul point d'entrée
 * pour forcer l'écriture est ce qui rend la chose vérifiable.*
 */
const stockagesDifferes = new Set<StockageDiffere<unknown>>();

/**
 * **Écrit sur-le-champ tout ce qui attendait.**
 *
 * Appelé par les filets de fermeture, et par les essais qui vérifient ce qui
 * arrive vraiment dans `localStorage` — *un essai qui lit le disque doit pouvoir
 * exiger que le disque soit à jour, sans connaître le délai.*
 */
export const viderLesEcrituresDifferees = (): void => {
    stockagesDifferes.forEach(differe => differe.viderMaintenant());
};

/**
 * ⚠️ **Les trois filets qui bornent la perte à un geste, pas à une séance.**
 *
 * L'écriture attend au plus 250 ms. Ces trois événements la forcent avant que la
 * fenêtre ne disparaisse :
 *
 * | Événement | Ce qu'il attrape |
 * | --- | --- |
 * | `beforeunload` | la fermeture ordinaire de la fenêtre |
 * | `pagehide` | le cas où `beforeunload` ne tire pas — il arrive |
 * | `visibilitychange` → caché | le passage en arrière-plan, **avant** que le système ne puisse suspendre la fenêtre |
 *
 * ⛔ *Ce qui n'est pas attrapé* : une coupure de courant ou un plantage du
 * processus. On y perd au pire un quart de seconde.
 *
 * ⚠️ **Cette phrase disait « jamais une campagne, qui passe par
 * `PersistenceService` et IndexedDB », et elle a cessé d'être vraie le
 * 2026-09-18** : le magasin de session est différé lui aussi depuis ce jour. Ce
 * qui la rattrape n'est plus la nature du magasin, ce sont **deux filets
 * cumulés** — ces trois événements de fermeture, et la sauvegarde automatique
 * qui part deux minutes après le dernier changement. *Un commentaire qui décrit
 * une garantie qu'on vient de retirer est pire qu'un commentaire absent.*
 */
let filetsPoses = false;
function poserLesFiletsDeFermeture(): void {
    if (filetsPoses || typeof window === 'undefined') return;
    filetsPoses = true;
    window.addEventListener('beforeunload', viderLesEcrituresDifferees);
    window.addEventListener('pagehide', viderLesEcrituresDifferees);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') viderLesEcrituresDifferees();
    });
}

/**
 * Inscrit un stockage différé au registre, et pose les filets de fermeture.
 *
 * ⛐ **C'est le seul point d'entrée, et il doit le rester.** Un stockage
 * différé qui n'est pas dans ce registre garde jusqu'à 250 ms d'écritures que
 * `beforeunload`, `pagehide` et `visibilitychange` ne viendront **pas** vider :
 * la perte serait silencieuse, et elle ne se verrait qu'au redémarrage suivant.
 *
 * Existe parce que le magasin de session ne peut pas passer par
 * `stockageLocalDuMJ` : il écrit dans **IndexedDB**, derrière sa propre garde
 * (`PersistenceService`), et pas dans `localStorage`. *Deux stockages, deux
 * gardes, un seul registre.*
 */
export const inscrireUnStockageDiffere = <S>(differe: StockageDiffere<S>): StockageDiffere<S> => {
    stockagesDifferes.add(differe as StockageDiffere<unknown>);
    poserLesFiletsDeFermeture();
    return differe;
};

export const stockageLocalDuMJ = <S = unknown>(): StockageDiffere<S> => {
    const differe = ecritureDifferee<S>(
        createJSONStorage<S>(() => ecritureReserveeAuMJ(localStorage))!,
        /*
          ⛔ **La garde est posée ICI, au-dessus du tampon, et pas seulement dans
          `ecritureReserveeAuMJ` en dessous.** Un tampon qui accepte une écriture
          interdite la sert ensuite en lecture : une fenêtre secondaire qui se
          réhydrate y relirait sa propre vue partielle. *Ce qui n'a pas le droit
          d'être écrit n'a pas le droit d'être lu comme s'il l'avait été.*

          Le refus du dessous reste, et c'est voulu : les deux étages ne se
          doublent pas, ils gardent deux chemins — le tampon et le disque.
        */
        { autorise: isMainWindow },
    );
    return inscrireUnStockageDiffere(differe);
};
