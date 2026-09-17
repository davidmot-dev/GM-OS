import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * **Un magasin persisté n'écrit pas quand on le croit : il écrit à CHAQUE `set()`.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE DÉFAUT QUI A MENÉ ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ Le 2026-09-17, David : *« whiteboard os saccade un peu »*. Chaque point d'un
 * trait appelait `setActivePath`, donc un `set()`, donc — vérifié dans la source
 * installée de Zustand 5.0.12 — un `setItem()` complet :
 *
 * ```js
 * const setItem = () => {
 *     const state = options.partialize({ ...get() });
 *     return storage.setItem(options.name, { state, version });
 * };
 * api.setState = (state, replace) => { savedSetState(state, replace); return setItem(); };
 * ```
 *
 * **Il n'y a aucune condition.** Un `set()` qui ne touche qu'un champ volatile
 * sérialise quand même tout le magasin et l'écrit sur le disque.
 *
 * ⭐ **DEUX MODULES ONT ÉCRIT LA CROYANCE INVERSE, NOIR SUR BLANC.**
 *
 * | Fichier | Ce qu'il affirme |
 * | --- | --- |
 * | `useWhiteboardStore` | *« Les persister causerait des écritures localStorage haute fréquence »* |
 * | `useMapStore` | *« Projections are NOT persisted to avoid massive performance drops during real-time movement »* |
 *
 * Les deux ont retiré des champs de `partialize` en croyant supprimer l'écriture.
 * ⭐ ***`partialize` ne décide pas SI l'on écrit, seulement CE QU'ON écrit.***
 * L'écriture haute fréquence a eu lieu quand même — elle emportait simplement
 * les tracés et les pions à la place. *Une optimisation qui vise la charge quand
 * le coût est la fréquence ne réduit rien ; elle rassure.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE ÇA COÛTAIT, MESURÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Coût du seul `JSON.stringify`, par mouvement de souris, sur un tableau blanc :
 *
 * | Tracés | Points | Par écriture | Charge |
 * | --- | --- | --- | --- |
 * | 10 | 600 | 0,08 ms | 15 Ko |
 * | 40 | 3 200 | 0,38 ms | 77 Ko |
 * | 100 | 12 000 | **1,75 ms** | 285 Ko |
 * | 200 | 30 000 | **4,18 ms** | 710 Ko |
 *
 * Le `localStorage.setItem`, **synchrone et bloquant**, s'ajoute par-dessus. Et
 * le coût croît avec ce qui est déjà dessiné : *d'où « saccade un peu », qui
 * empire à mesure que le tableau se remplit et repart à neuf quand on l'efface.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ POURQUOI UNE FENÊTRE FIXE, ET SURTOUT PAS UN « DEBOUNCE »
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le réflexe serait de repousser l'écriture à chaque nouvelle modification. ⛔
 * **Ce serait un piège** : pendant un glissement de pion de dix secondes, les
 * modifications ne s'arrêtent jamais, donc l'écriture **n'aurait jamais lieu**.
 * Un plantage en cours de geste perdrait tout le geste.
 *
 * Ici la première modification **arme** la fenêtre et les suivantes s'y
 * agglutinent : on écrit donc au plus tard `delaiMs` après le premier changement,
 * quoi qu'il arrive ensuite. *Le pire cas est borné, et c'est ce qu'on veut d'un
 * dépôt qui a déjà perdu ses campagnes deux fois.*
 *
 * ⚠️ **Les campagnes ne passent pas par ici** : `useSessionOSStore` est persisté
 * par `PersistenceService` sur IndexedDB. Ce chemin-ci porte le combat, la carte,
 * l'horloge, le tableau blanc, les dés, les favoris, les fiches et les
 * raccourcis. *Y perdre 250 ms, c'est perdre un quart de seconde de déplacement
 * de pion.*
 */

/** Le retard maximal entre une modification et son arrivée sur le disque. */
export const DELAI_D_ECRITURE_MS = 250;

/** Le minuteur, injectable pour que les essais n'attendent pas vraiment. */
export interface Minuteur {
    differer: (fn: () => void, ms: number) => unknown;
    annuler: (jeton: unknown) => void;
}

const minuteurParDefaut: Minuteur = {
    differer: (fn, ms) => setTimeout(fn, ms),
    annuler: (jeton) => clearTimeout(jeton as ReturnType<typeof setTimeout>),
};

export interface StockageDiffere<S> extends PersistStorage<S> {
    /** Écrit tout de suite ce qui attend. À brancher sur la fermeture. */
    viderMaintenant: () => void;
    /** Combien de clés attendent leur écriture. Pour les essais et le diagnostic. */
    enAttente: () => number;
}

/**
 * Enveloppe un stockage de persistance pour n'écrire qu'une fois par fenêtre.
 *
 * ⚠️ Elle s'enroule **autour** du stockage JSON, pas dedans : c'est ce qui permet
 * d'économiser le `JSON.stringify` lui-même, qui est le vrai coût. Une enveloppe
 * posée en dessous recevrait une chaîne déjà sérialisée — *elle éviterait
 * l'écriture disque et paierait quand même la sérialisation.*
 */
export function ecritureDifferee<S>(
    sousJacent: PersistStorage<S>,
    options: { delaiMs?: number; minuteur?: Minuteur; autorise?: () => boolean } = {},
): StockageDiffere<S> {
    const delaiMs = options.delaiMs ?? DELAI_D_ECRITURE_MS;
    const minuteur = options.minuteur ?? minuteurParDefaut;
    const autorise = options.autorise ?? (() => true);

    /** La dernière valeur connue de chaque clé, pas encore écrite. */
    const attente = new Map<string, StorageValue<S>>();
    let jeton: unknown = null;

    const vider = () => {
        if (jeton !== null) {
            minuteur.annuler(jeton);
            jeton = null;
        }
        if (attente.size === 0) return;
        const aEcrire = [...attente.entries()];
        attente.clear();
        aEcrire.forEach(([nom, valeur]) => { void sousJacent.setItem(nom, valeur); });
    };

    const armer = () => {
        /* ⭐ On n'arme qu'une fois : c'est ce qui fait une fenêtre fixe et non
           un report perpétuel. Voir l'en-tête du fichier. */
        if (jeton !== null) return;
        jeton = minuteur.differer(() => { jeton = null; vider(); }, delaiMs);
    };

    return {
        /**
         * ⚠️ **Ce qui attend fait autorité sur ce qui est écrit.** Sans cette
         * ligne, relire une clé pendant la fenêtre rendrait la version
         * *précédente* — et une réhydratation tombant là ressusciterait un état
         * périmé. *Un tampon qu'on n'interroge pas est un mensonge de 250 ms.*
         */
        getItem: (nom) => (attente.has(nom) ? attente.get(nom)! : sousJacent.getItem(nom)),

        /**
         * ⛔ **Un refus doit porter AVANT le tampon, jamais après.**
         *
         * Le stockage enveloppé refuse déjà les écritures des fenêtres
         * secondaires (`ecritureReserveeAuMJ`). Mais un tampon posé **au-dessus**
         * de ce refus accepterait la valeur, la garderait, et la servirait en
         * lecture pendant 250 ms : une fenêtre secondaire qui se réhydrate y
         * relirait **sa propre vue partielle** au lieu de celle du MJ.
         *
         * ⭐ ***Ce qui n'a pas le droit d'être écrit n'a pas le droit d'être lu
         * comme s'il l'avait été.*** Le défaut a été trouvé par
         * `persistanceEntreFenetres.test.ts`, qui gardait déjà exactement ce
         * chemin — *une garde de l'an dernier a arrêté un défaut d'aujourd'hui,
         * dans un mécanisme qui n'existait pas quand elle a été écrite.*
         */
        setItem: (nom, valeur) => {
            if (!autorise()) return;
            attente.set(nom, valeur);
            armer();
        },

        /**
         * ⛔ **L'effacement annule ce qui attend.** Sans ça, une écriture encore
         * en vol **ressusciterait** ce qu'on vient d'effacer, 250 ms plus tard et
         * sans que rien ne le dise.
         */
        removeItem: (nom) => {
            attente.delete(nom);
            return sousJacent.removeItem(nom);
        },

        viderMaintenant: vider,
        enAttente: () => attente.size,
    };
}
