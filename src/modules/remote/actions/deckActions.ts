import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { ActionRegistry } from './types';

/**
 * **Ce qu'un joueur fait de ses cartes, depuis sa tablette.**
 *
 * Demandé par David le 2026-08-30 : *« comment un joueur joue une carte, et
 * comment il en donne une à un autre ? »* Il ne le pouvait pas — tout passait
 * par le meneur.
 *
 * **Chaque action vérifie que le demandeur tient bien la carte.** Le
 * `characterId` d'un message vient du client : sans ce contrôle, un message
 * fabriqué jouerait la carte du voisin ou la lui prendrait. La vérification
 * vit dans le magasin, qui interroge l'état du paquet — le seul à connaître la
 * vérité. *C'est exactement pourquoi la carte n'est pas devenue un objet
 * d'inventaire : un inventaire aurait dû croire l'expéditeur sur parole.*
 *
 * Un refus est **silencieux**. Répondre « cette carte n'est pas à vous »
 * apprendrait à qui tâtonne ce qui existe, et le cas légitime — une carte jouée
 * entre-temps — ne mérite pas une alarme.
 */

const jouerSaCarte = (payload: unknown) => {
    const { deckId, index, characterId } = (payload ?? {}) as
        { deckId?: string; index?: number; characterId?: string | null };
    if (!deckId || typeof index !== 'number') return;

    useSessionOSStore.getState().jouerSaCarte(deckId, index, characterId ?? null);
};

const demanderLeDon = (payload: unknown) => {
    const { deckId, index, deQui, versQui } = (payload ?? {}) as
        { deckId?: string; index?: number; deQui?: string | null; versQui?: string | null };
    if (!deckId || typeof index !== 'number') return;

    useSessionOSStore.getState().demanderLeDonDeCarte(deckId, index, deQui ?? null, versQui ?? null);
};

const accepterLeDon = (payload: unknown) => {
    const { demandeId } = (payload ?? {}) as { demandeId?: string };
    if (demandeId) useSessionOSStore.getState().accepterLeDonDeCarte(demandeId);
};

const refuserLeDon = (payload: unknown) => {
    const { demandeId } = (payload ?? {}) as { demandeId?: string };
    if (demandeId) useSessionOSStore.getState().refuserLeDonDeCarte(demandeId);
};

/*
  Les deux préfixes mènent au même endroit, comme pour les objets : un message
  arrivé par la télécommande porte `remote:`, un message arrivé par une tablette
  ne le porte pas. Oublier l'un des deux fait marcher la tablette et pas la
  télécommande, sans que rien ne le dise.
*/
export const deckActions: ActionRegistry = {
    'deck:jouer-carte': jouerSaCarte,
    'remote:deck:jouer-carte': jouerSaCarte,
    'deck:demander-don': demanderLeDon,
    'remote:deck:demander-don': demanderLeDon,
    'deck:accepter-don': accepterLeDon,
    'remote:deck:accepter-don': accepterLeDon,
    'deck:refuser-don': refuserLeDon,
    'remote:deck:refuser-don': refuserLeDon,
};
