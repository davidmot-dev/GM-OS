import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { SessionMessage } from '../../session/store/types';
import type { ActionRegistry } from './types';

const updateCharacterNarrative = (payload: any) => {
    const { playerId, characterId, updates } = payload as { playerId: string; characterId: string; updates: any };
    useSessionOSStore.getState().updateCharacterNarrative(playerId, characterId, updates);
};

const submitFeedback = (payload: any) => {
    const { sessionId, feedback } = payload as { sessionId: string; feedback: any };
    useSessionOSStore.getState().submitSessionFeedback(sessionId, feedback);
};

const receiveMessage = (payload: any) => {
    console.log('[Actions] Receiving message action:', payload?.id);
    useSessionOSStore.getState().addSessionMessage(payload as SessionMessage);
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
    'session:submit-feedback': submitFeedback,
    'remote:session:submit-feedback': submitFeedback,
    // Les deux sens aboutissent au même ajout dans le journal de session.
    'session:send-message': receiveMessage,
    'session:receive-message': receiveMessage,
    'session:request-item-transfer': requestItemTransfer,
    'remote:session:request-item-transfer': requestItemTransfer,
    'session:approve-item-transfer': approveItemTransfer,
    'remote:session:approve-item-transfer': approveItemTransfer,
    'session:reject-item-transfer': rejectItemTransfer,
    'remote:session:reject-item-transfer': rejectItemTransfer,
    'session:remove-inventory-item': removeInventoryItem,
    'remote:session:remove-inventory-item': removeInventoryItem,
};
