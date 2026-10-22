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

/*
  2026-10-22 : une tablette refusée (`reprise_refusee` — identifiant connu revenu
  sans son jeton) restait sur « Aucun PJ détecté » : `logout()` effaçait le
  refus juste après qu'il avait été posé, et rien ne permettait de changer
  d'appareil comme le message le conseillait.
*/
describe('LobbyOnboarding — un appareil refusé', () => {
    it('le refus reste affiché, et la tablette peut se présenter comme une nouvelle', () => {
        const avant = useClientStore.getState().deviceId;
        useClientStore.getState().logout();
        useClientStore.getState().setLastError('Cet appareil est déjà enregistré.', 'reprise_refusee');
        render(<LobbyOnboarding />);
        expect(screen.getByText('Cet appareil est déjà enregistré.')).toBeTruthy();
        act(() => { screen.getByText('Se présenter comme une nouvelle tablette').click(); });
        const apres = useClientStore.getState();
        expect(apres.deviceId).not.toBe(avant);
        expect(apres.lastError).toBeNull();
        expect(apres.lastErrorCode).toBeNull();
        expect(localStorage.getItem('gmos-tablet-uuid')).toBe(apres.deviceId);
    });

    it('un autre refus garde son geste habituel', () => {
        useClientStore.getState().setLastError('Ce personnage est déjà réservé.', 'character_taken');
        render(<LobbyOnboarding />);
        expect(screen.getByText('Choisir un autre signal')).toBeTruthy();
    });
});
