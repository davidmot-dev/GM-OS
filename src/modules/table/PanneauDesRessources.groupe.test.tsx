// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PanneauDesRessources from './PanneauDesRessources';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from './useRessourcesDeTableStore';
import { useModalStore } from '../../stores/useModalStore';
import type { RessourceDeTable } from './RessourcesDeTable';
import type { MouvementDeFiche } from '../../types/drivers';

/**
 * **Les pistes de la Cabale au nouveau scénario** — NOC, 2026-10-16 (carnet
 * « NOC », « Domaines et Réserves ») : l'Espoir revient au Credo, le Vécu aux
 * Légendes, la Singularité à l'Observatoire.
 */
const MENACE: RessourceDeTable = { id: 'Menace', label: 'Menace', proprietaire: 'meneur', depart: 0, min: 0, remiseAuDepartParScenario: true };
const RECHARGE: MouvementDeFiche[] = [
    { champ: 'tracks.espoir', label: 'Espoir', delta: 'plein', max: { champ: 'assets.life.creed' } },
    { champ: 'tracks.vecu', label: 'Vécu', delta: 'plein', max: { champ: 'assets.life.legends' } },
    { champ: 'tracks.singularite', label: 'Singularité', delta: 'plein', max: { champ: 'assets.technical.observatory' } },
];
const updateCampaign = vi.fn();
const initial = useSessionOSStore.getState();
beforeEach(() => {
    updateCampaign.mockReset();
    useSessionOSStore.setState({
        players: [],
        campaigns: [{ id: 'c', name: 'NOC', system: 'noc', activeLocationIds: [], groupe: { sheetData: {
            'tracks.espoir': 1, 'assets.life.creed': 3,
            'tracks.vecu': 0, 'assets.life.legends': 2,
            // Au-dessus de son Atout : on ne la ramène pas.
            'tracks.singularite': 4, 'assets.technical.observatory': 2,
        } } }],
        updateCampaign,
    } as never);
    useRessourcesDeTableStore.setState({ reserves: { c: { Menace: 3 } } });
});
afterEach(() => { cleanup(); useSessionOSStore.setState(initial, true); });

describe('« Nouveau scénario » recharge les pistes du groupe', () => {
    it('la confirmation le dit, puis Espoir et Vécu remontent à leur Atout', () => {
        render(<PanneauDesRessources campaignId="c" ressources={[MENACE]} rechargeDuGroupe={RECHARGE} />);
        fireEvent.click(screen.getByRole('button', { name: /Nouveau scénario/ }));
        expect(useModalStore.getState().message).toContain('le groupe se recharge : Espoir, Vécu, Singularité');
        useModalStore.getState().onConfirm?.();
        expect(updateCampaign).toHaveBeenCalledWith('c', { groupe: { sheetData: expect.objectContaining({
            'tracks.espoir': 3, 'tracks.vecu': 2, 'tracks.singularite': 4,
        }) } });
        expect(useRessourcesDeTableStore.getState().reserves.c.Menace).toBe(0);
    });

    it('sans recharge déclarée, la feuille du groupe ne bouge pas', () => {
        render(<PanneauDesRessources campaignId="c" ressources={[MENACE]} />);
        fireEvent.click(screen.getByRole('button', { name: /Nouveau scénario/ }));
        useModalStore.getState().onConfirm?.();
        expect(updateCampaign).not.toHaveBeenCalled();
    });
});
