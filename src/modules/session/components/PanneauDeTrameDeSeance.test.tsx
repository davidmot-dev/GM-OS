import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import PanneauDeTrameDeSeance from './PanneauDeTrameDeSeance';
import { useSessionOSStore } from '../useSessionOSStore';
import type { GameSession } from '../../../types/session.types';
import type { Acte, Scene } from '../../../types/trame.types';

/*
  **Prévoir des scènes de plusieurs actes** — David, le 2026-10-10 : *« je ne
  vois pas comment rajouter un acte ou une scène à ma préparation de séance »*,
  puis *« je veux afficher toutes les scènes »*. Le panneau ne montrait que les
  scènes de l'acte annoncé, et rien ne disait qu'une ligne se cochait.
*/

const initial = useSessionOSStore.getState();
const acte = (id: string, ordre: number, titre: string): Acte => ({
    id, campaignId: 'campagne', ordre, titre, resume: '',
});
const scene = (id: string, acteId: string, titre: string, ordre = 0): Scene => ({
    id, campaignId: 'campagne', acteId, ordre, titre, resume: '', origine: 'preparee',
    entiteIds: [], indiceIds: [], creeeLe: 1,
});
const seance = (patch: Partial<GameSession> = {}): GameSession => ({
    id: 'seance', campaignId: 'campagne', number: 1, date: '2026-08-28', status: 'planned',
    publicSummary: '', gmSecrets: '', checklist: [], sessionEntityIds: [], feedbacks: [], ...patch,
});

const SCENES = [
    scene('interrogatoire', 'starting', 'L’interrogatoire préliminaire'),
    scene('revelation', 'briefing', 'La révélation sur les bootlegs'),
    scene('filature', 'enquete', 'La filature'),
];

function monter(patch: Partial<GameSession> = {}) {
    useSessionOSStore.setState({
        activeCampaignId: 'campagne',
        actes: [acte('starting', 0, 'Starting Scene'), acte('briefing', 1, 'Briefing'), acte('enquete', 2, 'The Investigation')],
        scenes: SCENES,
        sessions: [seance(patch)],
        updateSession: (id, maj) => useSessionOSStore.setState(s => ({
            sessions: s.sessions.map(x => x.id === id ? { ...x, ...maj } : x),
        })),
    });
    const Rendu = () => <PanneauDeTrameDeSeance session={useSessionOSStore(s => s.sessions[0])} />;
    return render(<Rendu />);
}
const prevues = () => useSessionOSStore.getState().sessions[0].scenesPrevuesIds ?? [];
const caseDe = (titre: string) => screen.getByRole('checkbox', { name: new RegExp(titre) });

beforeEach(() => { useSessionOSStore.setState(initial, true); });
afterEach(() => { cleanup(); useSessionOSStore.setState(initial, true); });

describe('la trame prévue d’une séance', () => {
    it('montre les scènes de tous les actes quand rien n’est encore prévu', () => {
        monter();
        expect(caseDe('L’interrogatoire')).toBeTruthy();
        expect(caseDe('La révélation')).toBeTruthy();
        expect(caseDe('La filature')).toBeTruthy();
    });

    it('coche des scènes de deux actes sans changer l’acte principal', () => {
        monter({ acteId: 'starting' });
        // L'acte principal et ceux qui ont une scène prévue sont ouverts ; les autres se déplient.
        fireEvent.click(screen.getByRole('button', { name: /Briefing/ }));
        fireEvent.click(caseDe('L’interrogatoire'));
        fireEvent.click(caseDe('La révélation'));

        expect(prevues()).toEqual(['interrogatoire', 'revelation']);
        expect(useSessionOSStore.getState().sessions[0].acteId).toBe('starting');
        expect(caseDe('L’interrogatoire').getAttribute('aria-checked')).toBe('true');
        expect(caseDe('La révélation').getAttribute('aria-checked')).toBe('true');
        expect(screen.getByText('2 prévues')).toBeTruthy();
    });

    it('décoche une scène prévue', () => {
        monter({ acteId: 'starting', scenesPrevuesIds: ['interrogatoire'] });
        fireEvent.click(caseDe('L’interrogatoire'));
        expect(prevues()).toEqual([]);
    });

    it('ouvre d’emblée l’acte principal et ceux qui portent une scène prévue', () => {
        monter({ acteId: 'starting', scenesPrevuesIds: ['filature'] });
        expect(caseDe('L’interrogatoire')).toBeTruthy();
        expect(caseDe('La filature')).toBeTruthy();
        expect(screen.queryByRole('checkbox', { name: /La révélation/ }), 'Briefing reste replié').toBeNull();
    });

    it('garde visible une scène prévue dont l’acte a quitté la campagne', () => {
        monter({ scenesPrevuesIds: ['orpheline'] });
        act(() => useSessionOSStore.setState(s => ({ scenes: [...s.scenes, scene('orpheline', 'acte-supprime', 'La scène orpheline')] })));
        expect(screen.getByText(/sans acte dans cette campagne/)).toBeTruthy();
        expect(caseDe('La scène orpheline').getAttribute('aria-checked')).toBe('true');
    });
});
