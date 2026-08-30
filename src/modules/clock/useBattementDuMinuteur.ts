import { useEffect } from 'react';
import { useClockStore } from '../../store/useClockStore';

/**
 * **Le minuteur descend, qu'on le regarde ou non.**
 *
 * *Défaut trouvé le 2026-08-30, en répondant à David qui demandait s'il pouvait
 * mettre un minuteur sur l'afficheur Ulanzi.* Le battement d'une seconde vivait
 * dans un effet de `ClockDashboard` — **le composant de l'écran**. Quitter
 * Clock-OS pour le cockpit le démontait, et le minuteur **cessait de
 * descendre**.
 *
 * Le défaut ne se voyait pas parce qu'on regarde un minuteur depuis l'écran qui
 * le porte. Mais il touchait déjà les joueurs : `timerRemaining` est diffusé aux
 * tablettes, et la valeur y gelait en même temps — *un compte à rebours figé est
 * pire qu'aucun, parce qu'il est crédible.*
 *
 * C'est exactement la leçon déjà payée sur le battement de l'Ulanzi, qui a été
 * monté dans `Shell` pour la même raison : *un émetteur attaché à une vue émet
 * ce que la vue veut bien.*
 *
 * **Monté une seule fois, dans `Shell`.** Deux montages feraient descendre le
 * minuteur deux fois plus vite.
 */
export function useBattementDuMinuteur(): void {
    const timerIsRunning = useClockStore(s => s.timerIsRunning);

    useEffect(() => {
        if (!timerIsRunning) return;

        /*
          On lit l'action au moment de battre plutôt que de la capturer : le
          magasin est persisté et réhydraté, et une référence prise au montage
          pourrait viser une version remplacée.

          `tickTimer` s'arrête tout seul à zéro et pose `timerIsRunning` à faux,
          ce qui nettoie cet intervalle — on n'a donc pas à surveiller le reste.
        */
        const minuteur = setInterval(() => useClockStore.getState().tickTimer(), 1000);
        return () => clearInterval(minuteur);
    }, [timerIsRunning]);
}
