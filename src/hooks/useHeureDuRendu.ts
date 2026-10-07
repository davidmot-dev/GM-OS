import { useEffect, useState } from 'react';

/** Lire l'heure hors du rendu, et actualiser les libellés sans rendu impur. */
export function useHeureDuRendu(intervalleMs = 60_000): number {
    const [heure, setHeure] = useState(Date.now);
    useEffect(() => {
        const minuterie = setInterval(() => setHeure(Date.now()), intervalleMs);
        return () => clearInterval(minuterie);
    }, [intervalleMs]);
    return heure;
}
