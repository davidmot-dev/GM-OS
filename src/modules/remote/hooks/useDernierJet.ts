import { useEffect, useState } from 'react';
import { type RollRecord } from './useRemoteSync';

/**
 * **Le dernier jet à montrer sur la tablette, et quand cesser de le montrer.**
 *
 * Écrit le 2026-09-05, à la demande de David : *« lorsque je fais un jet de dés,
 * je voudrais voir le résultat sur la tablette »*.
 *
 * L'écran de résultat existait — cent vingt-cinq lignes — et **rien ne l'avait
 * jamais déclenché** : il guettait un message `dice:result` que personne
 * n'émet. La donnée, elle, circulait déjà dans le flux de synchronisation ; il
 * suffisait de la lire.
 *
 * Deux règles, et ce sont elles qui demandent un crochet plutôt qu'une ligne :
 *
 * 1. **On montre un jet NEUF, pas le dernier jet connu.** Le flux répète le même
 *    `lastRoll` à chaque synchronisation ; s'y fier ferait resurgir un résultat
 *    écarté à la seconde suivante. C'est l'identifiant du jet qui décide.
 * 2. **Il s'efface tout seul.** Un panneau qui recouvre l'écran et qu'il faut
 *    congédier à la main devient un obstacle dès le troisième jet.
 */

/** Combien de temps un résultat reste à l'écran avant de s'effacer seul. */
export const DUREE_DU_RESULTAT_MS = 15_000;

export function useDernierJet(jetDuMeneur: RollRecord | null | undefined): {
    jet: RollRecord | null;
    ecarter: () => void;
} {
    /*
      On retient l'identifiant **écarté** plutôt que celui montré : au premier
      rendu il n'y en a aucun, et une tablette qui se connecte en cours de
      séance n'a pas à ressortir un jet vieux d'une heure — d'où l'amorçage sur
      le jet présent, quel qu'il soit.
    */
    const [ecarte, setEcarte] = useState<string | null>(() => jetDuMeneur?.id ?? null);

    useEffect(() => {
        if (!jetDuMeneur || jetDuMeneur.id === ecarte) return;

        const minuterie = setTimeout(() => setEcarte(jetDuMeneur.id), DUREE_DU_RESULTAT_MS);
        return () => clearTimeout(minuterie);
    }, [jetDuMeneur, ecarte]);

    const montre = jetDuMeneur && jetDuMeneur.id !== ecarte ? jetDuMeneur : null;

    return {
        jet: montre,
        ecarter: () => setEcarte(jetDuMeneur?.id ?? null),
    };
}
