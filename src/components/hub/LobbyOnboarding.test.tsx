import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import LobbyOnboarding from './LobbyOnboarding';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { useClientStore } from '../../stores/useClientStore';
import type { GameSession } from '../../types/session.types';

/*
  David, 2026-10-12 : après « Éjecter tout », ses joueurs ont tourné près de dix
  minutes sur « Saisie du signal », sur la même tablette. L'attente de 1,5 s
  avant le choix du personnage repartait de zéro à chaque copie de la séance
  active — et chaque tablette qui se reconnecte fait renvoyer l'état complet à
  toutes les autres.
*/
const initialSession = useSessionOSStore.getState();
const initialClient = useClientStore.getState();

const seance = (): GameSession => ({
    id: 'seance-1', campaignId: 'c-1', number: 1, date: '2026-10-12', status: 'active',
    publicSummary: '', gmSecrets: '', checklist: [], sessionEntityIds: [], feedbacks: [],
});

beforeEach(() => {
    vi.useFakeTimers();
    useClientStore.setState({ lastError: null, characterId: null, isOnboarded: false });
    useSessionOSStore.setState({
        activeCampaignId: 'c-1', campaigns: [], players: [], connectedCharacters: {},
        sessions: [seance()],
    });
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    useSessionOSStore.setState(initialSession, true);
    useClientStore.setState(initialClient, true);
});

describe('LobbyOnboarding — après une reconnexion', () => {
    it('passe au choix du personnage même si la séance est recopiée sans cesse', () => {
        render(<LobbyOnboarding />);
        expect(screen.getByText('Saisie du Signal...')).toBeTruthy();

        // Une copie identique de la séance toutes les 500 ms, pendant 3 s.
        for (let i = 0; i < 6; i++) {
            act(() => { vi.advanceTimersByTime(500); });
            act(() => { useSessionOSStore.setState({ sessions: [seance()] }); });
        }

        expect(screen.queryByText('Saisie du Signal...'), 'l’attente repart à zéro à chaque copie').toBeNull();
        expect(screen.getByText('Qui es-tu ?')).toBeTruthy();
    });

    it('reste sur « Saisie du signal » tant qu’aucune séance n’est active', () => {
        useSessionOSStore.setState({ sessions: [] });
        render(<LobbyOnboarding />);
        act(() => { vi.advanceTimersByTime(5000); });
        expect(screen.getByText('Saisie du Signal...')).toBeTruthy();
    });
});
