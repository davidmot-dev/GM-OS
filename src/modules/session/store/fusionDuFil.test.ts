import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionOSStore } from '../useSessionOSStore';
import type { SessionMessage } from '../../../types/session.types';

/*
  M3 (2026-10-12) : le fil que le meneur rend à une tablette rechargée arrive
  APRÈS les messages reçus depuis la reconnexion. Il doit se fondre dedans sans
  doublon, et dans l'ordre où les choses ont été dites.
*/
const msg = (id: string, timestamp: number): SessionMessage => ({
    id, fromId: 'GM', fromName: 'MJ', toId: 'all', toName: 'Tous',
    content: id, timestamp, isRead: false, campaignId: 'c-1',
});

describe('fusionnerLeFil — le fil rendu à la reconnexion', () => {
    beforeEach(() => {
        useSessionOSStore.setState({ messages: [msg('recent', 30)], activeCampaignId: 'c-1' });
    });

    it('fond le fil rendu dans l’ordre, sans doublon', () => {
        useSessionOSStore.getState().fusionnerLeFil([msg('ancien', 10), msg('milieu', 20), msg('recent', 30)]);
        expect(useSessionOSStore.getState().messages.map(m => m.id)).toEqual(['ancien', 'milieu', 'recent']);
    });

    it('un fil déjà connu ne change rien', () => {
        const avant = useSessionOSStore.getState().messages;
        useSessionOSStore.getState().fusionnerLeFil([msg('recent', 30)]);
        expect(useSessionOSStore.getState().messages).toBe(avant);
    });
});
