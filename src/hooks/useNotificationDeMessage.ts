import { useEffect, useState } from 'react';
import type { SessionMessage } from '../types/session.types';

interface ContexteDeNotification {
    messages: readonly SessionMessage[];
    characterId: string | null;
    lastReadMessageTime: number;
    isMessengerOpen: boolean;
    selectedRecipientId: string;
}

interface NotificationDeMessage {
    id: string;
    timestamp: number;
    fromName: string;
    channel: string;
    recipientId: string;
}

/** Le signal appartient au message reçu : les autres mises à jour ne prolongent pas ses cinq secondes. */
export function useNotificationDeMessage({ messages, characterId, lastReadMessageTime,
    isMessengerOpen, selectedRecipientId }: ContexteDeNotification) {
    const dernier = messages[messages.length - 1];
    const dernierId = dernier?.id ?? null;
    const destinataire = dernier?.toId === 'all' || !dernier?.toId ? 'all' : dernier.fromId;
    const estLaConversationOuverte = isMessengerOpen && selectedRecipientId === destinataire;
    const nouveauSignal: NotificationDeMessage | null = characterId && dernier &&
        dernier.timestamp > lastReadMessageTime && dernier.fromId !== characterId &&
        (dernier.toId === characterId || dernier.toId === 'all' || !dernier.toId) &&
        !estLaConversationOuverte
        ? { id: dernier.id, timestamp: dernier.timestamp, fromName: dernier.fromName,
            channel: destinataire === 'all' ? 'Canal Général' : dernier.fromId === 'GM' ? 'Maître du Jeu' : 'Canal Privé',
            recipientId: destinataire }
        : null;

    const [suivi, setSuivi] = useState({ characterId, dernierId, notification: nouveauSignal });
    // Reconnaître chaque message une fois empêche une recopie du magasin de
    // rallumer un signal expiré. Un message étranger garde le signal en cours.
    if (suivi.characterId !== characterId || suivi.dernierId !== dernierId) {
        setSuivi({ characterId, dernierId,
            notification: suivi.characterId !== characterId || !dernier
                ? nouveauSignal
                : nouveauSignal ?? suivi.notification });
    }

    const idDuSignal = suivi.notification?.id ?? null;
    useEffect(() => {
        if (idDuSignal === null) return;
        const rappel = setTimeout(() => {
            setSuivi(courant => courant.characterId === characterId && courant.notification?.id === idDuSignal
                ? { ...courant, notification: null }
                : courant);
        }, 5000);
        return () => clearTimeout(rappel);
    }, [idDuSignal, characterId]);

    const notification = suivi.notification;
    const activeToast = notification && notification.timestamp > lastReadMessageTime &&
        !(isMessengerOpen && selectedRecipientId === notification.recipientId)
        ? notification : null;
    const masquerNotification = () => setSuivi(courant => ({ ...courant, notification: null }));
    return { activeToast, masquerNotification };
}
