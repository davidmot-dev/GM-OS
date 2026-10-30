import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CoupsLocalisesDuCombattant from './CoupsLocalisesDuCombattant';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useCombatStore } from '../useCombatStore';
import type { GameDriver } from '../../../types/drivers';
import type { Combatant } from '../types';

/** Le panneau des coups localisés, sur la carte d'un adversaire de RuneQuest (2026-10-30). */

const RUNEQUEST = {
    id: 'runequest', name: 'RuneQuest', templateId: 'tpl',
    combat: {
        defaultHealthType: 'hp', initiativeFormula: 'ra_dex + ra_tai',
        statsToTrack: [{ fieldId: 'points_de_vie', label: 'Points de vie', isMainHP: true, isResource: true, max: 'pv_max' }],
        coupsLocalises: { mecanique: 'runequest', zones: {
            'jambe-droite': { pv: 'pv_jambe_droite', armure: 'pa_jambe_droite', degats: 'degats_jambe_droite' },
            tete: { pv: 'pv_tete', armure: 'pa_tete', degats: 'degats_tete' },
        } },
    },
} as unknown as GameDriver;
const FICHE = { pv_max: 12, points_de_vie: 12, pv_jambe_droite: 4, pa_jambe_droite: 2, degats_jambe_droite: 0, pv_tete: 4, pa_tete: 1, degats_tete: 0 };

describe('les coups localisés sur la carte', () => {
    const session = useSessionOSStore.getState();
    const combat = useCombatStore.getState();
    const broo = { id: 'b', name: 'Broo', isPlayer: false, hp: 12, hpMax: 12, statuses: [], sheetData: { ...FICHE } } as unknown as Combatant;

    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        useSessionOSStore.setState({
            activeCampaignId: 'c', customGameDrivers: [RUNEQUEST],
            campaigns: [{ id: 'c', name: 'Pavis', system: 'runequest', activeLocationIds: [] }],
        } as never);
        useCombatStore.setState({ combatants: [broo] });
    });
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        useSessionOSStore.setState(session, true);
        useCombatStore.setState(combat, true);
    });

    it('montre les zones avec leurs PV restants et leur armure', () => {
        render(<CoupsLocalisesDuCombattant combatant={broo} valeurs={FICHE} />);
        expect(screen.getByText('Jambe droite 4/4 · PA 2')).toBeTruthy();
        expect(screen.getByText('Tête 4/4 · PA 1')).toBeTruthy();
    });

    it('encaisse un coup sur la zone cliquée : 6 sur la jambe, 2 d’armure — 4 à la zone et au total', () => {
        render(<CoupsLocalisesDuCombattant combatant={broo} valeurs={FICHE} />);
        fireEvent.click(screen.getByText('Jambe droite 4/4 · PA 2'));
        fireEvent.change(screen.getByLabelText('Dégâts du coup'), { target: { value: '6' } });
        fireEvent.click(screen.getByText('Encaisser'));
        const apres = useCombatStore.getState().combatants[0];
        expect(apres.hp).toBe(8);
        expect(apres.sheetData).toMatchObject({ degats_jambe_droite: 4 });
    });

    it('ne paraît pas sans règle de coups localisés', () => {
        useSessionOSStore.setState({ customGameDrivers: [{ ...RUNEQUEST, combat: { ...RUNEQUEST.combat, coupsLocalises: undefined } }] } as never);
        const { container } = render(<CoupsLocalisesDuCombattant combatant={broo} valeurs={FICHE} />);
        expect(container.querySelector('[data-coups-localises]')).toBeNull();
    });
});
