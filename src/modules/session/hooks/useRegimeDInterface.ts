import { useSessionOSStore } from '../useSessionOSStore';
import { useSessionStore } from '../../../store/useSessionStore';
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
    /*
      **Le forçage du meneur passe devant, et il ne va pas plus loin que
      l'écran — tranché par David le 2026-09-09.**

      Les budgets de temps de l'IA lisent `momentDeJeu` directement et ne voient
      donc pas cette surcharge : *replier son écran ne veut pas dire que la
      table a cessé d'attendre.* L'IA a déjà ses deux portes à elle — le bouton
      « Alléger » de l'axe F.5, et la pause de séance qui lève ses plafonds.

      C'était la seule chose qui manquait à l'axe N.3 : il déduisait son régime
      en silence, sans rien pour le voir ni pour le contredire, là où l'axe F.5
      avait donné les deux à l'IA dès août.
    */
    const surcharge = useSessionStore(s => s.surchargeDuRegime);
    return regimeDInterface(surcharge ?? moment);
}
