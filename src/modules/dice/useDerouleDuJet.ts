import { useCallback, useEffect, useRef, useState } from 'react';
import { DUREE_DE_MAINTIEN_MS, DUREE_DU_RESULTAT_MS } from './logic/choregraphieDuJet';

/** Le résultat apparaît au nouveau signal de projection ; les effets gardent seulement ses échéances. */
export function useAffichageDuJet(isDiceProjected: boolean, projectionTrigger: number) {
    const [affichage, setAffichage] = useState({ dernierSignal: 0, visible: false, revision: 0 });
    if (isDiceProjected && projectionTrigger !== affichage.dernierSignal) {
        setAffichage({ dernierSignal: projectionTrigger, visible: true, revision: affichage.revision + 1 });
    }
    const { dernierSignal, visible, revision } = affichage;
    useEffect(() => {
        if (!visible) return;
        const rappel = setTimeout(() => {
            setAffichage(courant => courant.dernierSignal === dernierSignal && courant.revision === revision
                ? { ...courant, visible: false } : courant);
        }, DUREE_DU_RESULTAT_MS);
        return () => clearTimeout(rappel);
    }, [dernierSignal, visible, revision]);

    const signalerLesDesPoses = useCallback(() => {
        // Un signal de l'ancienne scène ne doit ni prolonger le nouveau jet ni
        // rouvrir un résultat que le filet a déjà fermé.
        setAffichage(courant => courant.visible && courant.dernierSignal === dernierSignal
            ? { ...courant, revision: courant.revision + 1 } : courant);
    }, [dernierSignal]);
    return { showDice: visible, signalerLesDesPoses };
}

interface CycleDePose {
    jetId: string | undefined;
    vivant: boolean;
    rappel: ReturnType<typeof setTimeout> | null;
}

/** Deux secondes de maintien propres à ce jet, puis cinq secondes pour lire son résultat. */
export function usePoseDesDes(jetId: string | undefined, signalerLesDesPoses: () => void) {
    const [pose, setPose] = useState({ jetId, desPoses: false });
    if (pose.jetId !== jetId) setPose({ jetId, desPoses: false });
    const cycleRef = useRef<CycleDePose | null>(null);
    useEffect(() => {
        const cycle: CycleDePose = { jetId, vivant: true, rappel: null };
        cycleRef.current = cycle;
        return () => {
            cycle.vivant = false;
            if (cycle.rappel !== null) clearTimeout(cycle.rappel);
        };
    }, [jetId]);

    const auReposDesDes = useCallback(() => {
        const cycle = cycleRef.current;
        if (!cycle?.vivant || cycle.jetId !== jetId || jetId === undefined) return;
        if (cycle.rappel !== null) clearTimeout(cycle.rappel);
        // Au plafond de chute (4 s), le maintien finit à 6 s : réarmer dès la
        // pose évite que le filet initial de 5 s ferme le résultat entre-temps.
        signalerLesDesPoses();
        cycle.rappel = setTimeout(() => {
            if (!cycle.vivant) return;
            cycle.rappel = null;
            setPose({ jetId, desPoses: true });
            signalerLesDesPoses();
        }, DUREE_DE_MAINTIEN_MS);
    }, [jetId, signalerLesDesPoses]);
    return { desPoses: pose.desPoses, auReposDesDes };
}
