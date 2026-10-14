import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HealthManager } from './HealthManager';
import { HealthInterpreter } from '../../logic/HealthInterpreter';
import { useSessionOSStore } from '../../useSessionOSStore';
import type { CasesDeSante } from '../../../../types/drivers';

/**
 * **Le type d'adversaire** — Torg, 2026-10-14 (livre p. 263) : un sbire tombe à
 * la première Blessure, un aguerri à la deuxième, un adversaire chargé en
 * possibilités comme un héros. Le choix recoupe les cases du jeu.
 */
const CASES: CasesDeSante = {
    libelle: 'Blessures', nombre: 4,
    seuils: [{ aPartirDe: 1, label: 'Blessé', etat: 'wounded' }, { aPartirDe: 4, label: 'Vaincu', etat: 'dead' }],
};
const initial = useSessionOSStore.getState();

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({
        activeCampaignId: 'c', entities: [],
        campaigns: [{ id: 'c', name: 'Torg', system: 'torg', activeLocationIds: [] }],
        customGameDrivers: [{ id: 'torg', name: 'Torg', templateId: 't', combat: {
            statsToTrack: [], initiativeFormula: '', defaultHealthType: 'boxes', casesDeSante: CASES,
            limitesDeBlessures: [{ libelle: 'Sbire (—)', blessures: 0 }, { libelle: 'Aguerri (1)', blessures: 1 }, { libelle: 'Chargé en possibilités (3)', blessures: 3 }],
        } }],
    } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); useSessionOSStore.setState(initial, true); });

describe('le type d’adversaire', () => {
    it('sur un adversaire : sbire, une seule case, et c’est la défaite', () => {
        const onHealthChange = vi.fn();
        render(<HealthManager id="x" type="npc" initialHealthSystem={HealthInterpreter.createDefault('boxes', { cases: CASES })} onHealthChange={onHealthChange} />);
        const choix = screen.getByLabelText("Type d'adversaire") as HTMLSelectElement;
        expect(choix.value).toBe('3');
        fireEvent.change(choix, { target: { value: '0' } });
        const sante = onHealthChange.mock.calls[0][0];
        expect(sante.data.boxes).toHaveLength(1);
    });

    it('jamais sur un personnage joueur', () => {
        render(<HealthManager id="x" type="pc" initialHealthSystem={HealthInterpreter.createDefault('boxes', { cases: CASES })} />);
        expect(screen.queryByLabelText("Type d'adversaire")).toBeNull();
    });
});
