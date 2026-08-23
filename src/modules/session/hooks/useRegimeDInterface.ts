import { useSessionOSStore } from '../useSessionOSStore';
import { momentDeJeu } from '../../ai/budgetsDeTemps';
import { regimeDInterface, type RegimeDInterface } from '../logic/regimeDInterface';

/**
 * Le régime d'interface courant — **atelier ou table**.
 *
 * **`momentDeJeu` est la seule source, et elle est globale.** Son commentaire le
 * dit : les lecteurs d'interface testaient `activeCampaign.activeSessionId`,
 * alors qu'une seule séance est ouverte à la fois dans toute l'application. En
 * lisant ici la même fonction que les budgets de temps, on garantit que
 * *l'écran et le moteur ne se disputent jamais sur ce qu'est « être en
 * partie »*.
 *
 * **Une séance en pause n'est pas une séance en cours** (axe G) — c'est
 * `momentDeJeu` qui le tranche, pas ce crochet.
 *
 * Utilisé par les cinq modules que l'axe N dédouble : combat, carte, PNJ,
 * Oracle, journal. *Pas vingt-quatre.*
 */
export function useRegimeDInterface(): RegimeDInterface {
    const moment = useSessionOSStore(s => momentDeJeu(s.sessions));
    return regimeDInterface(moment);
}
