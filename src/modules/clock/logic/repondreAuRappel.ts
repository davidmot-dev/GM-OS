import { useClockStore } from '../../../store/useClockStore';
import { useJournalStore } from '../../journal/useJournalStore';
import type { RappelEnAttente } from './rappelDeLaJauge';

/**
 * **Répondre au rappel d'une jauge** — « Fait » ou « Écarter » — en un seul
 * geste, quel que soit l'endroit où on le donne : la ligne du cockpit, la carte
 * de la jauge dans Clock-OS, la carte volante (11/11/2026).
 *
 * *David, à l'essai : « je ne vois pas de Fait pour cliquer »* — il avait vidé
 * la jauge dans Clock-OS, et le seul bouton vivait au Tableau de bord, un autre
 * module. Trois endroits, donc, mais **une seule écriture** : répondre à l'un
 * éteint les deux autres.
 */
export function repondreAuRappel(rappel: Pick<RappelEnAttente, 'jaugeId' | 'nom' | 'texte'>, fait: boolean): void {
    useClockStore.getState().traiterLeRappel(rappel.jaugeId);
    if (fait) {
        useJournalStore.getState().addEvent({ type: 'SYSTEM', title: `Rappel — ${rappel.nom}`, content: rappel.texte });
    }
}
