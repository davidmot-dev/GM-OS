import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { SessionMessage } from '../../session/store/types';
import type { ActionRegistry } from './types';

const updateCharacterNarrative = (payload: any) => {
    const { playerId, characterId, updates } = payload as { playerId: string; characterId: string; updates: any };
    useSessionOSStore.getState().updateCharacterNarrative(playerId, characterId, updates);
};

/**
 * La fiche d'un joueur a imposé quelque chose : on l'applique **sans rediffuser**.
 *
 * On passe donc par `updateCharacter` et pas par `remoteUpdateCharacterSheetData`,
 * qui rediffuserait l'action à celui qui vient de l'envoyer — un aller-retour
 * sans fin entre les deux écrans.
 */
const updateCharacterSheetData = (payload: any) => {
    const { playerId, characterId, updates } = payload as {
        playerId: string; characterId: string;
        updates: { sheetData?: Record<string, unknown>; description?: string; playerNotes?: string; inventory?: string; inventoryItems?: any[] };
    };
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

const submitFeedback = (payload: any) => {
    const { sessionId, feedback } = payload as { sessionId: string; feedback: any };
    useSessionOSStore.getState().submitSessionFeedback(sessionId, feedback);
};

const receiveMessage = (payload: any) => {
    console.log('[Actions] Receiving message action:', payload?.id);
    useSessionOSStore.getState().addSessionMessage(payload as SessionMessage);
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
const messageDuMeneur = (payload: any) => {
    const { toId, toName, content } = (payload ?? {}) as { toId?: string; toName?: string; content?: string };
    if (!toId || !content?.trim()) return;

    useSessionOSStore.getState().sendDirectMessage(toId, toName || toId, content.trim());
};

const requestItemTransfer = (payload: any) => {
    const { fromCharId, toCharId, item } = payload as { fromCharId: string; toCharId: string; item: any };
    console.log(`[Actions] Receiving transfer request: ${item?.name} from ${fromCharId} to ${toCharId}`);
    useSessionOSStore.getState().requestItemTransfer(fromCharId, toCharId, item);
};

const approveItemTransfer = (payload: any) => {
    const { requestId } = payload as { requestId: string };
    useSessionOSStore.getState().approveItemTransfer(requestId);
};

const rejectItemTransfer = (payload: any) => {
    const { requestId } = payload as { requestId: string };
    useSessionOSStore.getState().rejectItemTransfer(requestId);
};

const removeInventoryItem = (payload: any) => {
    const { playerId, characterId, itemId } = payload as { playerId: string; characterId: string; itemId: string };
    useSessionOSStore.getState().removeInventoryItem(playerId, characterId, itemId);
};

export const sessionActions: ActionRegistry = {
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
