import { describe, it, expect } from 'vitest';
import { seanceDeReferenceDeLaTrame } from './seanceDeLaTrame';
import type { GameSession } from '../../../types/session.types';

const seance = (id: string, number: number, status: GameSession['status'], campaignId = 'c1') =>
    ({ id, number, status, campaignId, date: '', publicSummary: '', gmSecrets: '', checklist: [], sessionEntityIds: [] }) as GameSession;

describe('seanceDeReferenceDeLaTrame', () => {
    it('prend la séance en cours de la campagne', () => {
        const sessions = [seance('s1', 1, 'done'), seance('s2', 2, 'active'), seance('s3', 3, 'planned')];
        expect(seanceDeReferenceDeLaTrame(sessions, { id: 'c1', activeSessionId: 's2' })?.id).toBe('s2');
    });
    it('sans séance en cours, prend la prochaine planifiée par son numéro', () => {
        const sessions = [seance('s4', 4, 'planned'), seance('s3', 3, 'planned'), seance('s2', 2, 'done')];
        expect(seanceDeReferenceDeLaTrame(sessions, { id: 'c1', activeSessionId: 's2' })?.id).toBe('s3');
    });
    it('ignore les séances des autres campagnes et les séances closes', () => {
        const sessions = [seance('x', 1, 'active', 'c2'), seance('s1', 1, 'done')];
        expect(seanceDeReferenceDeLaTrame(sessions, { id: 'c1' })).toBeUndefined();
        expect(seanceDeReferenceDeLaTrame(sessions, undefined)).toBeUndefined();
    });
});
