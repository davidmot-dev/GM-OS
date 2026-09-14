import type { Player } from '../store/types';

/**
 * **Faire passer un personnage d'un joueur à un autre.**
 *
 * Demandé par David le 2026-09-14 : *« je voudrais pouvoir échanger un PJ d'un
 * joueur vers un autre joueur »*. Un transfert simple, tranché avec lui : le
 * premier joueur ne reçoit rien en retour.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ POURQUOI IL N'Y A PRESQUE RIEN À FAIRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Un `PlayerCharacter` ne porte aucun `playerId`** : il appartient à celui
 * dans la liste de qui il se trouve, et à personne d'autre. Déplacer l'entrée
 * suffit donc, *et l'identifiant du personnage ne bouge pas* — c'est lui que
 * tout le reste vise :
 *
 * - la **fiche**, les notes privées, l'inventaire, la santé vivent **sur** le
 *   personnage et le suivent sans qu'on y touche ;
 * - `sessionEntityIds` contient des identifiants de **personnages**, donc sa
 *   place dans la séance du soir est conservée ;
 * - les **cartes tenues** visent `porteur === character.id` (`deckSlice`) : la
 *   main passe avec le personnage ;
 * - les combattants issus d'un PJ portent `sourcePlayerId: character.id` — le
 *   nom ment, la valeur est bien celle du personnage.
 *
 * *Un transfert qui change l'identifiant aurait dû réécrire tout cela ; un
 * transfert qui le garde n'a rien à réécrire.* C'est la raison pour laquelle
 * cette fonction est si courte, et il faut que ce soit écrit quelque part :
 * sinon quelqu'un « complétera » un jour ce qui n'a rien d'incomplet.
 *
 * ⚠️ **Ce qui ne suit PAS, et qu'aucune écriture ne peut régler ici** : le
 * verrou d'appareil. `connectedCharacters` est **recalculé depuis la liste des
 * clients connectés** (`App.tsx`, `remote:sync-clients`) — ce n'est pas un champ
 * qu'on pose, c'est un reflet. Si la tablette de l'ancien joueur tient encore ce
 * personnage, elle continue de le tenir après le transfert, et le nouveau joueur
 * ne peut pas le prendre tant qu'elle n'a pas quitté. `leVerrouDeLAncienJoueur`
 * existe pour que l'écran le **dise**, faute de pouvoir le défaire.
 */

/** Pourquoi un transfert n'a pas eu lieu. `null` : il a eu lieu. */
export type RefusDeTransfert =
    /** Le joueur de départ n'existe pas, ou ne porte pas ce personnage. */
    | 'personnage-introuvable'
    /** Le joueur d'arrivée n'existe pas. */
    | 'joueur-introuvable'
    /** Départ et arrivée sont le même joueur : il n'y a rien à faire. */
    | 'meme-joueur'
    /** Le joueur d'arrivée porte déjà un personnage de cet identifiant. */
    | 'deja-present';

export interface ResultatDuTransfert {
    /** La nouvelle liste des joueurs. **Inchangée** — la même référence — en cas de refus. */
    joueurs: Player[];
    /** `null` si le transfert a eu lieu. */
    refus: RefusDeTransfert | null;
}

/**
 * Déplace un personnage de la liste d'un joueur vers celle d'un autre.
 *
 * ⛔ **En cas de refus, elle rend la liste d'origine, par référence.** Un
 * refus qui rendrait une copie ferait croire à un changement à tout ce qui
 * compare par identité — la synchronisation vers les tablettes en premier, qui
 * rediffuserait alors la liste entière des joueurs pour rien.
 */
export function transfererLePersonnage(
    joueurs: readonly Player[] | undefined,
    deJoueurId: string,
    versJoueurId: string,
    personnageId: string,
): ResultatDuTransfert {
    const liste = (joueurs ?? []) as Player[];

    if (deJoueurId === versJoueurId) return { joueurs: liste, refus: 'meme-joueur' };

    const source = liste.find(j => j.id === deJoueurId);
    const personnage = source?.characters?.find(p => p.id === personnageId);
    if (!personnage) return { joueurs: liste, refus: 'personnage-introuvable' };

    const cible = liste.find(j => j.id === versJoueurId);
    if (!cible) return { joueurs: liste, refus: 'joueur-introuvable' };

    /* Deux personnages du même identifiant chez le même joueur rendraient toute
       écriture ambiguë : `updateCharacter` frappe le premier trouvé. On refuse
       plutôt que de fabriquer cet état. */
    if ((cible.characters ?? []).some(p => p.id === personnageId)) {
        return { joueurs: liste, refus: 'deja-present' };
    }

    return {
        joueurs: liste.map(joueur => {
            if (joueur.id === deJoueurId) {
                return { ...joueur, characters: joueur.characters.filter(p => p.id !== personnageId) };
            }
            if (joueur.id === versJoueurId) {
                /* En fin de liste : l'ordre des personnages d'un joueur est celui
                   dans lequel il les a créés, et un arrivant est le dernier venu. */
                return { ...joueur, characters: [...(joueur.characters ?? []), personnage] };
            }
            return joueur;
        }),
        refus: null,
    };
}

/**
 * **L'appareil qui tient encore ce personnage, ou `null`.**
 *
 * À demander *avant* le transfert, pour prévenir le meneur : le verrou n'est pas
 * un champ qu'on écrit, c'est le reflet des clients connectés. Le dire est tout
 * ce qu'on peut faire — et c'est déjà mieux qu'un nouveau joueur qui se heurte à
 * « ce personnage est déjà connecté » sans comprendre pourquoi.
 */
export function leVerrouDeLAncienJoueur(
    verrous: Record<string, string> | undefined,
    personnageId: string,
): string | null {
    return verrous?.[personnageId] ?? null;
}
