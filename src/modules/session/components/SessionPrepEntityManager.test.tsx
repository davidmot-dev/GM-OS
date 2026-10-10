import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import SessionPrepEntityManager from './SessionPrepEntityManager';
import { useSessionOSStore } from '../useSessionOSStore';
import type { Entity } from '../../../types/entity.types';
import type { GameSession } from '../../../types/session.types';

const initial = useSessionOSStore.getState();
const DESCRIPTION = 'Réplicant bootleg, copie du légendaire Blade Runner Ray McCoy, habilement conçu pour imiter non seulement son apparence mais aussi sa voix.';

const pnj = { id: 'ezechiel', name: 'Ézéchiel', type: 'npc', role: 'hostile', status: 'alive', avatar: '',
    hp: 10, maxHp: 10, ac: 0, speed: 0, initiative: 0, description: DESCRIPTION, roleplayingNotes: '',
    gmSecretInfo: '', linkedMapIds: [], campaignId: 'campagne' } satisfies Entity;
const seance: GameSession = { id: 'seance', campaignId: 'campagne', number: 1, date: '2026-08-28',
    status: 'planned', publicSummary: '', gmSecrets: '', checklist: [], sessionEntityIds: ['ezechiel'], feedbacks: [] };

beforeEach(() => {
    useSessionOSStore.setState({ activeCampaignId: 'campagne', entities: [pnj], sessions: [seance] });
});
afterEach(() => { cleanup(); useSessionOSStore.setState(initial, true); });

/*
  David, le 2026-10-10 : *« pourquoi la description des PNJ est en majuscule ? »*.
  Le style d'une étiquette courte recevait le paragraphe entier.
*/
describe('la description d’un PNJ de la séance', () => {
    it('se lit en casse normale, sur deux lignes, et entière au survol', () => {
        render(<SessionPrepEntityManager sessionId="seance" />);
        const description = screen.getByText(DESCRIPTION);

        expect(description.className).not.toContain('uppercase');
        expect(description.className).not.toContain('font-mono');
        expect(description.className).toContain('line-clamp-2');
        expect(description.getAttribute('title')).toBe(DESCRIPTION);
    });
});
