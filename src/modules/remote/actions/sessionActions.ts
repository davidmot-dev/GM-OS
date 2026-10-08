import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { ActionRegistry } from './types';
import {
    estObjet, estMiseAJourDePersonnage, estNarrationDistante, estFicheDistante,
    estObjetInventaire, estRetourDeSeance, estMessageDeSeance,
} from './contratsSessionDistante';
import i18next from 'i18next';
import { pointsDeVieApres } from '../../combat/logic/SanteDuCombattant';

/** T4/J1 : appliquer la jauge reçue, sans renvoyer l'événement vers la tablette. */
const updateCharacterVitals = (payload: unknown) => {
    if (!estObjet(payload) || typeof payload.playerId !== 'string'
        || typeof payload.characterId !== 'string' || !estObjet(payload.updates)) return;
    const { playerId, characterId, updates } = payload;
    if (typeof updates?.hp !== 'number' || !Number.isFinite(updates.hp)) return;
    const store = useSessionOSStore.getState();
    const player = store.players.find(p => p.id === playerId);
    const character = player?.characters.find(c => c.id === characterId);
    if (!player || !character) return;
    const hp = pointsDeVieApres(character, updates.hp - (character.hp ?? 0));
    if (hp === null || hp === character.hp) return;
    store.updateCharacterHP(player.id, character.id, hp);
    store.addRemoteNotification({
        type: 'vitals_update', characterId: character.id, characterName: character.name,
        playerName: player.realName,
        message: i18next.t('modules:session.toasts.remote_vitals_update', { details: `PV: ${hp}/${character.maxHp}` }),
    });
};

const updateCharacterNarrative = (payload: unknown) => {
    if (!estMiseAJourDePersonnage(payload, estNarrationDistante)) return;
    const { playerId, characterId, updates } = payload;
    // Les champs supplémentaires du réseau ne deviennent pas des champs du personnage.
    useSessionOSStore.getState().updateCharacterNarrative(playerId, characterId, {
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.gmNotes !== undefined ? { gmNotes: updates.gmNotes } : {}),
        ...(updates.playerNotes !== undefined ? { playerNotes: updates.playerNotes } : {}),
        ...(updates.inventory !== undefined ? { inventory: updates.inventory } : {}),
        ...(updates.linkedDocumentIds !== undefined ? { linkedDocumentIds: updates.linkedDocumentIds } : {}),
    });
};

/**
 * La fiche d'un joueur a imposé quelque chose : on l'applique **sans rediffuser**.
 *
 * On passe donc par `updateCharacter` et pas par `remoteUpdateCharacterSheetData`,
 * qui rediffuserait l'action à celui qui vient de l'envoyer — un aller-retour
 * sans fin entre les deux écrans.
 */
const updateCharacterSheetData = (payload: unknown) => {
    if (!estMiseAJourDePersonnage(payload, estFicheDistante)) return;
    const { playerId, characterId, updates } = payload;
    const store = useSessionOSStore.getState();
    const perso = store.players
        .find(p => p.id === playerId)?.characters
        .find(c => c.id === characterId);
    if (!perso) return;

    store.updateCharacter(playerId, characterId, {
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.playerNotes !== undefined ? { playerNotes: updates.playerNotes } : {}),
        ...(updates.inventory !== undefined ? { inventory: updates.inventory } : {}),
        ...(updates.inventoryItems ? { inventoryItems: updates.inventoryItems } : {}),
        // Fusion, jamais remplacement : la fiche ne connaît que les champs de la table.
        sheetData: { ...perso.sheetData, ...(updates.sheetData ?? {}) },
    });
};

const submitFeedback = (payload: unknown) => {
    if (!estObjet(payload) || typeof payload.sessionId !== 'string' || !estRetourDeSeance(payload.feedback)) return;
    const { sessionId, feedback } = payload;
    useSessionOSStore.getState().submitSessionFeedback(sessionId, feedback);
};

const receiveMessage = (payload: unknown) => {
    if (!estMessageDeSeance(payload)) return;
    console.log('[Actions] Receiving message action:', payload.id);
    useSessionOSStore.getState().addSessionMessage(payload);
};

/**
 * **Un message envoyé par le meneur DEPUIS SA TABLETTE.**
 *
 * Demandé par David le 2026-09-05. Le piège qu'il fallait éviter : réutiliser
 * `session:send-message` aurait paru marcher et n'aurait rien fait. Ce
 * handler-là ne fait qu'**ajouter le message à la liste du meneur** — il ne le
 * rediffuse pas. Un message parti de la tablette serait apparu dans le fil du
 * cockpit **sans jamais atteindre le joueur**, ce qui est pire que rien : on
 * croit avoir parlé.
 *
 * `sendDirectMessage` est le seul chemin qui fait les deux : il inscrit et il
 * diffuse aux hubs. C'est donc lui qu'on appelle — la tablette se contente de
 * dire à qui et quoi.
 *
 * ⚠️ **Réservé au rôle privilégié.** `electron/actionPolicy` n'autorise cette
 * action qu'à un appareil appairé : sans quoi n'importe quel joueur connecté
 * pourrait parler au nom du meneur.
 */
const messageDuMeneur = (payload: unknown) => {
    if (!estObjet(payload) || typeof payload.toId !== 'string' || typeof payload.content !== 'string'
        || (payload.toName !== undefined && typeof payload.toName !== 'string')) return;
    const { toId, toName, content } = payload;
    if (!toId || !content?.trim()) return;

    useSessionOSStore.getState().sendDirectMessage(toId, toName || toId, content.trim());
};

const requestItemTransfer = (payload: unknown) => {
    if (!estObjet(payload) || typeof payload.fromCharId !== 'string' || typeof payload.toCharId !== 'string'
        || !estObjetInventaire(payload.item)) return;
    const { fromCharId, toCharId, item } = payload;
    console.log(`[Actions] Receiving transfer request: ${item?.name} from ${fromCharId} to ${toCharId}`);
    useSessionOSStore.getState().requestItemTransfer(fromCharId, toCharId, item);
};

const approveItemTransfer = (payload: unknown) => {
    if (!estObjet(payload) || typeof payload.requestId !== 'string') return;
    const { requestId } = payload;
    useSessionOSStore.getState().approveItemTransfer(requestId);
};

const rejectItemTransfer = (payload: unknown) => {
    if (!estObjet(payload) || typeof payload.requestId !== 'string') return;
    const { requestId } = payload;
    useSessionOSStore.getState().rejectItemTransfer(requestId);
};

const removeInventoryItem = (payload: unknown) => {
    if (!estObjet(payload) || typeof payload.playerId !== 'string' || typeof payload.characterId !== 'string'
        || typeof payload.itemId !== 'string') return;
    const { playerId, characterId, itemId } = payload;
    useSessionOSStore.getState().removeInventoryItem(playerId, characterId, itemId);
};

export const sessionActions: ActionRegistry = {
    'session:update-character-vitals': updateCharacterVitals,
    'session:update-character-narrative': updateCharacterNarrative,
    'remote:session:update-character-narrative': updateCharacterNarrative,
    'session:update-character-sheet-data': updateCharacterSheetData,
    'remote:session:update-character-sheet-data': updateCharacterSheetData,
    'session:submit-feedback': submitFeedback,
    'remote:session:submit-feedback': submitFeedback,
    // Les deux sens aboutissent au même ajout dans le journal de session.
    'session:send-message': receiveMessage,
    'session:receive-message': receiveMessage,
    // Le meneur qui parle depuis sa tablette : inscrit ET diffusé.
    'remote:session:gm-message': messageDuMeneur,
    'session:request-item-transfer': requestItemTransfer,
    'remote:session:request-item-transfer': requestItemTransfer,
    'session:approve-item-transfer': approveItemTransfer,
    'remote:session:approve-item-transfer': approveItemTransfer,
    'session:reject-item-transfer': rejectItemTransfer,
    'remote:session:reject-item-transfer': rejectItemTransfer,
    'session:remove-inventory-item': removeInventoryItem,
    'remote:session:remove-inventory-item': removeInventoryItem,
};
