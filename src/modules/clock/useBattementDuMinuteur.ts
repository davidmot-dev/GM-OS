import { useEffect } from 'react';
import { useClockStore } from '../../store/useClockStore';
import { chimeEngine } from './services/ChimeEngine';
import { useAudioMasterStore } from '../../stores/useAudioMasterStore';

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
/**
 * **Sonner, ou se taire pour une des deux bonnes raisons.**
 *
 * La cloche se branche sur `destination` directement, sans passer par le
 * volume général : *une alarme qui obéit au mixage n'est plus une alarme*, et
 * elle dure quatre secondes. Mais deux refus s'imposent quand même —
 * l'interrupteur du meneur, et **le son coupé** : si la table est au silence,
 * une cloche est exactement ce qu'on ne veut pas.
 */
function sonnerLaFin(): void {
    if (!useClockStore.getState().sonnerieDuMinuteur) return;
    if (useAudioMasterStore.getState().masterVolume === 0) return;

    try {
        chimeEngine.playChime();
    } catch (erreur) {
        /* Un contexte audio refusé ne doit pas casser le battement du minuteur. */
        console.warn('[Minuteur] La cloche n\u2019a pas pu sonner', erreur);
    }
}

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
        const minuteur = setInterval(() => {
            /*
              **La cloche sonne ici, et nulle part ailleurs** (point C3,
              2026-09-05). Pas dans `tickTimer` : un `set` de Zustand est un
              calcul d'état, et y glisser un son en ferait un effet de bord que
              chaque test déclencherait.

              On compare **avant et après** plutôt que de tester `=== 0` : la
              transition ne se produit qu'une fois. Deux battements montés par
              erreur — le piège de `StrictMode` déjà payé sur l'Ulanzi — ne
              feraient donc pas sonner deux fois, puisque le second verrait
              déjà zéro.
            */
            const avant = useClockStore.getState().timerRemaining;
            useClockStore.getState().tickTimer();
            const apres = useClockStore.getState().timerRemaining;

            if (avant > 0 && apres === 0) sonnerLaFin();
        }, 1000);
        return () => clearInterval(minuteur);
    }, [timerIsRunning]);
}
