import { useEffect, useState } from 'react';

/**
 * **Ce qui occupe Ollama, pour que l'attente cesse d'être muette — axe D.3.**
 *
 * David, le 2026-08-21 : *« je n'ai pas la main sur le Cortex quand je forge »*.
 * Il peut pourtant envoyer sa question — le `loading` du panneau lui est
 * propre. Elle part, et **fait la queue** : `OLLAMA_NUM_PARALLEL` vaut 1, donc
 * une Forge en cours tient l'unique créneau pour toute sa durée. L'écran affiche
 * « réception de la vision… » indéfiniment, sans rien expliquer.
 *
 * Le plan tranche la façon d'y répondre, et contre l'évidence :
 *
 * > *Savoir qu'une opération tourne vaut mieux que l'empêcher — « Forge en
 * > cours, l'Oracle attendra ~12 min » est actionnable ; un bouton grisé ne
 * > l'est pas.*
 *
 * **On ne grise donc rien.** Le meneur garde le droit d'envoyer sa question et
 * d'attendre ; on lui dit seulement ce qu'il attend, depuis combien de temps, et
 * on lui laisse la possibilité de trancher.
 *
 * **Interrogation périodique plutôt qu'événement poussé, et c'est délibéré.**
 * Un événement supposerait que chaque émetteur pense à le publier — c'est
 * exactement ce qui a produit trente oublis sur les émetteurs du journal.
 * Le registre du processus principal, lui, sait déjà tout : on lui demande.
 * Deux secondes suffisent pour une opération qui dure des minutes.
 */

export interface RequeteEnAttente {
    id: string;
    /** Ce que le meneur reconnaîtra : « Forge », « Génération d'image ». */
    libelle: string;
    /** Millisecondes écoulées depuis le départ. */
    depuis: number;
}

/** Cadence d'interrogation. Voir le commentaire ci-dessus. */
const PERIODE_MS = 2000;

export function useFileDAttente(actif = true): {
    requetes: RequeteEnAttente[];
    abandonner: (id: string) => Promise<void>;
} {
    const [requetes, setRequetes] = useState<RequeteEnAttente[]>([]);

    useEffect(() => {
        /*
          On ne vide pas ici : appeler `setState` dans le corps d'un effet
          déclenche un rendu en cascade, et l'état initial est déjà vide. Le
          nettoyage se fait au démontage, en dessous.
        */
        if (!actif || !window.appBridge?.ai?.ollamaEnVol) return;
        let vivant = true;

        const relever = async () => {
            /*
              Le pont peut être absent — navigateur, test, fenêtre secondaire.
              On rend une file vide plutôt que de laisser remonter : ne pas
              SAVOIR ce qui tourne n'est pas une panne, c'est l'état d'avant.
            */
            const vus = await window.appBridge?.ai?.ollamaEnVol?.().catch(() => []) ?? [];
            if (vivant) setRequetes(vus);
        };

        void relever();
        const minuteur = setInterval(() => { void relever(); }, PERIODE_MS);
        return () => { vivant = false; clearInterval(minuteur); setRequetes([]); };
    }, [actif]);

    const abandonner = async (id: string) => {
        await window.appBridge?.ai?.ollamaAbort?.(id).catch(() => false);
        // On retire tout de suite plutôt que d'attendre le prochain relevé :
        // deux secondes de bandeau après un clic se lisent comme un clic
        // ignoré.
        setRequetes(actuelles => actuelles.filter(r => r.id !== id));
    };

    return { requetes, abandonner };
}

/** « 3 min », « 45 s » — une durée qui se lit d'un coup d'œil. */
export function depuisQuand(ms: number): string {
    const secondes = Math.floor(ms / 1000);
    if (secondes < 90) return `${secondes} s`;
    return `${Math.floor(secondes / 60)} min`;
}
