import i18next from 'i18next';
import { decrireLaSante, type PorteurDeSante } from './SanteDuCombattant';
import type { DamageImpact } from '../../../types/entity.types';

/**
 * Ce qu'un coup a fait, en une ligne lisible.
 *
 * **Ce que ça corrige, relevé par David le 2026-08-18** : « ces données sont
 * difficilement exploitables ». Le journal écrivait
 * `HP : 6 / 10 — État : scratched`, avec trois défauts cumulés.
 *
 * 1. **`scratched` est un jeton interne**, pas un mot. `SanteDuCombattant` porte
 *    la table qui le traduit (`égratigné`) depuis le 2026-08-14 ; l'écriture des
 *    impacts ne la consultait pas. *Le même module de santé qu'on avait créé
 *    pour réunir huit lecteurs avait acquis un neuvième dissident.*
 * 2. **`max` venait de la fiche quand `hp` venait du système de santé** : sur un
 *    jeu sans points de vie, la ligne disait `HP : 6 / undefined` — exactement le
 *    « undefined/undefined » que `decrireLaSante` existe pour empêcher.
 * 3. **Le coup lui-même n'était pas écrit.** On lisait l'état d'arrivée sans
 *    jamais savoir ce qui venait de se passer : ni le nombre, ni s'il s'agissait
 *    d'une blessure ou d'un soin, ni le type de dégâts, ni la localisation —
 *    alors que `DamageImpact` porte les quatre.
 *
 * Reste une **trace** et non de la chronique : ce n'est pas ce qu'on envoie au
 * modèle, c'est ce qu'on relit dans le fil pendant la partie. Mais une trace se
 * lit aussi.
 */
export function raconterLImpact(impact: DamageImpact, porteur: PorteurDeSante): string {
    /*
      L'appelant historique passe une valeur positive avec `isRecovery` ; rien
      n'empêche un autre d'envoyer un nombre négatif. Les deux disent la même
      chose, et une ligne qui annoncerait « encaisse -3 » serait fausse.
    */
    const soin = impact.isRecovery === true || impact.value < 0;
    const valeur = Math.abs(impact.value);

    // Type et localisation ne sont pas toujours renseignés — on n'écrit pas de
    // parenthèses vides pour autant.
    const precisions = [impact.type, impact.location].filter(Boolean).join(', ');
    const detail = precisions ? ` (${precisions})` : '';

    const coup = i18next.t(
        soin ? 'modules:session.events.impact_healing' : 'modules:session.events.impact_damage',
        { value: valeur, detail },
    );

    // `null` veut dire « ce jeu ne compte pas comme ça » : on se tait plutôt que
    // d'inventer une jauge.
    const sante = decrireLaSante(porteur);
    return sante ? `${coup} — ${sante}` : coup;
}
