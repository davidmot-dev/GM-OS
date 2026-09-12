import type { ConnectionStatus } from '../useLightStore';

/**
 * **Faut-il retenter de joindre le pont Hue, et jusqu'à quand ?**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUE CETTE POLITIQUE REMPLACE, ET CE QUE ÇA A COÛTÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `useHueAutoConnect` avait `status` dans ses dépendances **et écrivait
 * `status`**. L'effet se rappelait donc lui-même :
 *
 * ```
 * disconnected → setConnection('discovering')   ← l'effet se rejoue
 *              → fetchLights() … expire à 5 s
 *              → setConnection('disconnected')  ← l'effet se rejoue
 *              → et ainsi de suite, sans fin
 * ```
 *
 * Tant que le pont répondait, le cycle s'arrêtait au premier succès et personne
 * ne voyait rien. **Le 2026-09-12, David était en déplacement** : le pont, resté
 * à la maison, ne répondait plus — et GM-OS l'a appelé indéfiniment, une
 * tentative toutes les cinq secondes et demie. *Un défaut qui ne se déclenche
 * qu'ailleurs ne se voit jamais au bureau.*
 *
 * ⭐ **Un effet ne doit pas se rejouer sur ce qu'il écrit.** C'est la règle, et
 * le correctif la tient par les dépendances. Mais elle ne suffisait pas : sans
 * plafond, une seule chaîne de rappels aurait produit la même boucle.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI RENONCER, ET POURQUOI LE DIRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un pont absent ne revient pas de lui-même dans la minute : il est éteint, ou
 * le meneur n'est pas sur le même réseau. Réessayer sans fin ne le fait pas
 * revenir — ça consomme l'application. **On s'arrête, et on l'annonce**, parce
 * que le meneur doit pouvoir distinguer « je n'ai pas encore essayé » de « j'ai
 * essayé et le pont ne répond pas ». *Un abandon silencieux se lit comme une
 * panne de GM-OS ; un abandon annoncé se lit comme une panne du pont.*
 *
 * La reprise reste possible à tout moment : le bouton de connexion de Light-OS
 * n'est pas concerné par ce plafond, et poser une nouvelle adresse relance le
 * cycle depuis zéro.
 */

/** Au-delà, on cesse d'appeler un pont qui ne répond pas. */
export const TENTATIVES_MAX = 4;

/**
 * Le délai avant la tentative n° `numero` (la première porte le n° 1).
 *
 * **Un recul, et pas une cadence fixe.** Les deux premières tentatives sont
 * rapides — un pont qui redémarre ou un Wi-Fi qui se rattrape revient en
 * quelques secondes. Les suivantes s'espacent : au-delà, l'hypothèse « il va
 * revenir tout de suite » est fausse, et insister ne fait qu'ajouter du bruit.
 *
 * ⚠️ Le premier délai reste court (500 ms) : il ne sert pas à attendre le pont
 * mais à **laisser l'état Zustand se propager** après le bootstrap — c'est la
 * raison d'origine, et elle tient toujours.
 */
export function delaiAvantLaTentative(numero: number): number {
    const echelle = [500, 3_000, 15_000, 60_000];
    return echelle[Math.min(Math.max(numero, 1), echelle.length) - 1];
}

export type DecisionDeReconnexion =
    /** Le pont est joignable en principe, et il reste des tentatives. */
    | 'essayer'
    /** On a essayé assez souvent : on s'arrête et on le dit. */
    | 'renoncer'
    /** Il n'y a rien à reconnecter, ou c'est déjà fait. */
    | 'rien-a-faire';

export function decisionDeReconnexion(etat: {
    statut: ConnectionStatus;
    ip: string | null;
    jeton: string | null;
    tentativesFaites: number;
}): DecisionDeReconnexion {
    const { statut, ip, jeton, tentativesFaites } = etat;

    /*
      Sans adresse ou sans jeton, il n'y a pas de pont appairé : ce n'est pas un
      échec, c'est une absence. Le meneur qui n'a jamais branché de lampes ne
      doit voir passer ni tentative, ni message.
    */
    if (!ip || !jeton) return 'rien-a-faire';

    /*
      ⛔ **La garde qui brise la boucle.** `discovering` est l'état que la
      tentative pose elle-même ; le reprendre pour un appel à l'aide était
      exactement le rappel qui se mordait la queue. Et `connected`, `pairing` ou
      `mock` n'ont rien à reconnecter.
    */
    if (statut !== 'disconnected') return 'rien-a-faire';

    return tentativesFaites >= TENTATIVES_MAX ? 'renoncer' : 'essayer';
}
