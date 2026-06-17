import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionOSStore } from './index';
import type { SessionFeedback } from '../../../types/session.types';

describe('Session Feedback Store Logic', () => {
    beforeEach(() => {
        useSessionOSStore.setState({
            sessions: [
                {
                    id: 's-test-1',
                    campaignId: 'c-test',
                    number: 1,
                    date: '2026-06-17',
                    status: 'active',
                    publicSummary: 'Session Summary',
                    gmSecrets: 'GM Secrets',
                    checklist: [],
                    sessionEntityIds: [],
                    feedbacks: []
                }
            ]
        });
    });

    it('should submit feedback for an active session', () => {
        const store = useSessionOSStore.getState();
        const feedback: SessionFeedback = {
            characterId: 'char-1',
            characterName: 'Hero A',
            funRating: 5,
            storyRating: 4,
            combatRating: 3,
            notes: 'Great session!',
            timestamp: Date.now()
        };

        store.submitSessionFeedback('s-test-1', feedback);

        const updatedSession = useSessionOSStore.getState().sessions.find(s => s.id === 's-test-1');
        expect(updatedSession).toBeDefined();
        expect(updatedSession?.feedbacks).toHaveLength(1);
        expect(updatedSession?.feedbacks?.[0].notes).toBe('Great session!');
        expect(updatedSession?.feedbacks?.[0].funRating).toBe(5);
    });

    it('should overwrite feedback from the same character instead of duplicating', () => {
        const store = useSessionOSStore.getState();
        const feedback1: SessionFeedback = {
            characterId: 'char-1',
            characterName: 'Hero A',
            funRating: 5,
            storyRating: 4,
            combatRating: 3,
            notes: 'Great session!',
            timestamp: Date.now()
        };

        const feedback2: SessionFeedback = {
            characterId: 'char-1',
            characterName: 'Hero A',
            funRating: 4,
            storyRating: 3,
            combatRating: 2,
            notes: 'Actually, it was okay.',
            timestamp: Date.now() + 1000
        };

        store.submitSessionFeedback('s-test-1', feedback1);
        store.submitSessionFeedback('s-test-1', feedback2);

        const updatedSession = useSessionOSStore.getState().sessions.find(s => s.id === 's-test-1');
        expect(updatedSession).toBeDefined();
        expect(updatedSession?.feedbacks).toHaveLength(1);
        expect(updatedSession?.feedbacks?.[0].notes).toBe('Actually, it was okay.');
        expect(updatedSession?.feedbacks?.[0].funRating).toBe(4);
    });
});
