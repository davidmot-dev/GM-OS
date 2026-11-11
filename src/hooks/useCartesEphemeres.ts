import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * **Des cartes qui s'effacent seules** — la minuterie des cartes volantes du
 * meneur (`CarteVolante`), commune au résultat d'un jet demandé et au rappel
 * d'une jauge (11/11/2026). `ajouter` pose des cartes et arme leur minuterie ;
 * `retirer` en ôte une plus tôt ; les minuteries se rendent au démontage.
 */
export function useCartesEphemeres<T extends { id: string }>(dureeMs: number) {
    const [cartes, setCartes] = useState<T[]>([]);
    const minuteurs = useRef(new Map<string, ReturnType<typeof setTimeout>>());

    const retirer = useCallback((id: string) => {
        const m = minuteurs.current.get(id);
        if (m) clearTimeout(m);
        minuteurs.current.delete(id);
        setCartes(c => c.filter(x => x.id !== id));
    }, []);

    const ajouter = useCallback((nouvelles: T[]) => {
        if (nouvelles.length === 0) return;
        for (const carte of nouvelles) {
            minuteurs.current.set(carte.id, setTimeout(() => {
                minuteurs.current.delete(carte.id);
                setCartes(c => c.filter(x => x.id !== carte.id));
            }, dureeMs));
        }
        setCartes(c => [...c, ...nouvelles]);
    }, [dureeMs]);

    useEffect(() => {
        const enCours = minuteurs.current;
        return () => {
            for (const m of enCours.values()) clearTimeout(m);
            enCours.clear();
        };
    }, []);

    return { cartes, ajouter, retirer };
}
