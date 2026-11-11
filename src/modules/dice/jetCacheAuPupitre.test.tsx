import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Le jet caché au pupitre de dés** — plan `2026-11-11-jets-demandes-et-caches.md`,
 * T7 (C7, C9) ; maquette Stitch adoptée le 11/11.
 *
 * Interrupteur allumé, « Lancer » devient « Lancer en caché » : le jet va au
 * panneau « Jets cachés » et nulle part ailleurs — le dernier jet visible reste
 * affiché, l'historique et la projection n'en savent rien.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { default: DiceBoard } = await import('./DiceBoard');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { useDiceStore } = await import('../../stores/useDiceStore');
const { useJetsCachesStore } = await import('./jetsCaches');

beforeEach(() => {
    cleanup();
    useSessionOSStore.setState({ activeCampaignId: null } as never);
    useDiceStore.getState().clearHistory();
    useDiceStore.setState({ isDiceProjected: true, projectionTrigger: 0 });
    useJetsCachesStore.getState().vider();
});

const allumer = () => fireEvent.click(screen.getByRole('switch', { name: /Jet caché/ }));

describe('le jet caché au pupitre', () => {
    it('ne touche ni le dernier jet, ni l’historique, ni la projection', () => {
        render(<DiceBoard />);
        allumer();
        fireEvent.click(screen.getByRole('button', { name: 'dice.agencement.hidden_roll' }));

        const des = useDiceStore.getState();
        expect(des.lastRoll).toBeNull();
        expect(des.history).toHaveLength(0);
        expect(des.projectionTrigger, 'aucune projection déclenchée').toBe(0);
        expect(useJetsCachesStore.getState().jets).toHaveLength(1);
    });

    it('paraît dans le panneau « Jets cachés », et le dernier jet visible reste', () => {
        render(<DiceBoard />);
        fireEvent.click(screen.getByRole('button', { name: 'dice.actions.roll' }));
        const visible = useDiceStore.getState().lastRoll;
        expect(visible).not.toBeNull();

        allumer();
        fireEvent.click(screen.getByRole('button', { name: 'dice.agencement.hidden_roll' }));

        expect(useDiceStore.getState().lastRoll?.id).toBe(visible!.id);
        expect(useDiceStore.getState().history).toHaveLength(1);
        expect(screen.getByRole('region', { name: 'dice.agencement.hidden_title' })).toBeTruthy();
    });

    it('les jets rapides se lancent en caché aussi', () => {
        render(<DiceBoard />);
        allumer();
        const rapide = useDiceStore.getState().quickRolls[0];
        fireEvent.click(screen.getByText(rapide.label));
        expect(useDiceStore.getState().lastRoll).toBeNull();
        // Même titre qu'un jet rapide visible : « Formule : … ».
        expect(useJetsCachesStore.getState().jets).toHaveLength(1);
        expect(useJetsCachesStore.getState().jets[0].titre).toBe('dice.results.formula');
    });

    it('éteint, « Lancer » fait ce qu’il faisait', () => {
        render(<DiceBoard />);
        fireEvent.click(screen.getByRole('button', { name: 'dice.actions.roll' }));
        expect(useDiceStore.getState().lastRoll).not.toBeNull();
        expect(useJetsCachesStore.getState().jets).toHaveLength(0);
        expect(screen.queryByRole('region', { name: 'dice.agencement.hidden_title' })).toBeNull();
    });
});
