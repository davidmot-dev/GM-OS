/**
 * **À qui un joueur peut proposer une carte, depuis sa tablette.**
 *
 * *Signalé par David le 2026-08-30 :* la liste « Donner à » devait montrer les
 * personnages **de la campagne en cours** et **actifs**. Elle montrait tout le
 * monde — tous les personnages de tous les joueurs, toutes chroniques
 * confondues, connectés ou non.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE N'EST PAS QU'UNE QUESTION DE PROPRETÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Une carte proposée perd ses gestes tant que la demande est en attente** —
 * elle ne peut être ni jouée ni reproposée, sans quoi il existerait deux vérités
 * sur une même carte. La proposer à un personnage que personne ne tient la
 * **gèle** : aucun destinataire ne répondra, et il faudra que le meneur tranche
 * depuis son écran pour la débloquer. *Offrir à quelqu'un qui n'est pas là n'est
 * pas un geste sans effet, c'est un geste qui immobilise.*
 *
 * ⚠ **La liste du meneur suit une autre règle, et c'est voulu.**
 * `useDeckPlayer.porteursPossibles` filtre par campagne mais **pas** par
 * connexion : le meneur doit pouvoir confier une carte au personnage d'un joueur
 * absent, puisque c'est lui qui arbitre. Les deux listes ne disent pas la même
 * chose parce qu'elles ne répondent pas à la même question.
 */

/** Un destinataire possible, tel que l'affiche la tablette. */
export interface VoisinDeCartes {
    id: string;
    nom: string;
}

/*
  Les formes minimales dont cette règle a besoin, plutôt que les types complets
  de la session : elle n'a que faire des portraits, des points de vie ou des
  inventaires, et les emprunter la rendrait solidaire de leurs remaniements.
*/
interface PersonnageMinimal {
    id: string;
    name: string;
    campaignId?: string | null;
}

interface JoueurMinimal {
    characters?: PersonnageMinimal[] | null;
}

/**
 * @param joueurs         Les joueurs tels que la tablette les a reçus.
 * @param moi             Le personnage de cette tablette — on ne se propose rien.
 * @param campagneOuverte La campagne en cours.
 * @param connectes       `characterId → deviceId` : qui tient réellement un appareil.
 */
export function voisinsAQuiDonner(
    joueurs: JoueurMinimal[] | null | undefined,
    moi: string | null,
    campagneOuverte: string | null | undefined,
    connectes: Record<string, string> | null | undefined,
): VoisinDeCartes[] {
    return (joueurs ?? [])
        .flatMap(j => j.characters ?? [])
        .filter(c => c.id !== moi)
        /*
          **La même règle de campagne que l'écran du meneur**, `??` compris : un
          personnage sans campagne compte comme appartenant à celle qui est
          ouverte. On pourrait la vouloir plus stricte ici — mais deux listes qui
          se contredisent seraient pires qu'une liste large, et c'est le meneur
          qui verrait la contradiction, en séance, sans pouvoir la trancher.
        */
        .filter(c => String(c.campaignId ?? campagneOuverte) === String(campagneOuverte))
        /*
          **Actif veut dire : quelqu'un tient cet appareil.** `connectedCharacters`
          associe un personnage à l'appareil qui l'a pris ; c'est le même registre
          qui empêche deux tablettes de choisir le même PJ.
        */
        .filter(c => !!connectes?.[String(c.id)])
        .map(c => ({ id: c.id, nom: c.name }));
}
