import type { DeckManifest, Campaign } from '../store/types';

/**
 * **Quels paquets appartiennent au jeu qu'on joue — et qui a le droit de les
 * voir.**
 *
 * ⛔ **Le défaut, signalé par David le 2026-09-14** : *« j'ai désactivé les
 * cartes pour Blade Runner mais elles restent visibles dans la tablette »*. Il
 * avait sorti un paquet du jeu ; la bibliothèque du meneur l'a bien retiré,
 * **la tablette a continué de l'offrir**.
 *
 * La cause tenait en une asymétrie :
 *
 * | | filtre par jeu | filtre par ouverture |
 * |---|---|---|
 * | Bibliothèque du meneur | ✅ | — |
 * | Onglet Cartes de la tablette | ⛔ **aucun** | ✅ |
 *
 * *Deux lecteurs d'une même liste, dont un seul connaît la règle.* C'est le
 * motif que Deck-OS a déjà payé le 2026-08-30, quand la liste « Donner à »
 * ignorait la campagne. La règle vit donc ici, une fois, et les deux écrans la
 * prennent au même endroit.
 *
 * ⚠️ **Ce n'est pas une sécurité, c'est un affichage.** Le magasin du meneur
 * refuse de toute façon une pioche dans un paquet fermé (`deckSlice`), et c'est
 * là que ça compte : la tablette envoie des demandes, elle n'applique rien.
 */

/** Le jeu auquel un paquet appartient quand il n'en déclare aucun. */
export const JEU_UNIVERSEL = 'generic';

/**
 * Le système de la campagne ouverte, ou `generic` s'il n'y en a pas.
 *
 * ⚠️ **Le champ s'appelle `system` sur la campagne et `systemId` sur le
 * paquet.** Deux noms pour la même chose, et c'est exactement le genre d'écart
 * qui fait écrire `deck.systemId === campaign.systemId` — une comparaison entre
 * une valeur et `undefined`, donc toujours fausse, donc une liste vide que
 * personne ne sait expliquer.
 */
export function systemeDeLaCampagne(
    campagnes: readonly Campaign[] | undefined,
    campagneActiveId: string | null | undefined,
): string {
    if (!campagneActiveId) return JEU_UNIVERSEL;
    return (campagnes ?? []).find(c => c.id === campagneActiveId)?.system || JEU_UNIVERSEL;
}

/**
 * Les paquets qui appartiennent à ce jeu.
 *
 * ⭐ **Un paquet `generic` appartient à tous les jeux** — un jeu de 54 cartes
 * sert partout, et l'exclure obligerait à le déclarer une fois par système.
 */
export function paquetsDuJeu(
    paquets: readonly DeckManifest[] | undefined,
    systeme: string,
): DeckManifest[] {
    return (paquets ?? []).filter(
        p => p.systemId === JEU_UNIVERSEL || p.systemId === systeme,
    );
}

/**
 * **Ce qu'une tablette a le droit d'offrir : de ce jeu, et ouvert.**
 *
 * L'absence d'`ouvertAuxJoueurs` vaut **fermé** — les paquets antérieurs au
 * 2026-08-30 restent au meneur sans migration. *Un défaut qui ouvre est un
 * défaut qu'on découvre en séance, quand un joueur a déjà vu l'oracle du
 * meneur.*
 */
export function paquetsOffertsAuxJoueurs(
    paquets: readonly DeckManifest[] | undefined,
    systeme: string,
): DeckManifest[] {
    return paquetsDuJeu(paquets, systeme).filter(p => p.ouvertAuxJoueurs);
}
