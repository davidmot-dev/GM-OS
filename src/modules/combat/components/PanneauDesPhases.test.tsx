import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Le round de Rêve de Dragon dans Combat-OS** — 24/10/2026. Le facteur d'un
 * Voyageur se lit sur sa fiche, celui d'un adversaire se saisit ; le tirage
 * range le plateau dans l'ordre des phases.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('../../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { default: PanneauDesPhases } = await import('./PanneauDesPhases');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useCombatStore } = await import('../useCombatStore');
const { useRoundDuVoyageurStore } = await import('../useRoundDuVoyageurStore');
const { DiceEngine } = await import('../../dice/DiceEngine');

const champ = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 0 });
const LIVRET = {
    id: 'tpl-rdd', name: 'Voyageur', emoji: '', reglesDeFiche: 'rdd-231',
    sections: [{ id: 'combat', label: 'Combat', fields: [
        champ('corps_a_corps', 'Corps à corps'), champ('dague_melee', 'Dague de mêlée'), champ('esquive', 'Esquive'),
        champ('dague_jet', 'Dague de jet'), champ('bouclier', 'Bouclier'), champ('epee_1m', 'Épée à une main'), champ('arc', 'Arc'),
    ] }],
};
const RDD = { id: 'rdd', name: 'Rêve de Dragon', templateId: 'tpl-rdd', dice: { defaultDice: '1d100', logic: 'sum', engine: 'standard' },
    combat: { statsToTrack: [], initiativeFormula: '', initiative: { mode: 'phases' } } };

function table() {
    useSessionOSStore.setState({
        activeCampaignId: 'c', customGameDrivers: [RDD], customSheetTemplates: [LIVRET],
        campaigns: [{ id: 'c', name: 'RdD', system: 'rdd' }],
        players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: false, characters: [
            { id: 'brucelin', name: 'Brucelin', campaignId: 'c', templateId: 'tpl-rdd',
                sheetData: { melee: 14, tir: 12, lancer: 13, corps_a_corps: 0, dague_melee: 1, epee_1m: 3, dague_jet: 0, arc: 1,
                    combat_3_name: 'Dague de jet', combat_5_name: 'Épée à une main', combat_6_name: 'Arc' } },
        ] }],
        entities: [{ id: 'groin', name: 'Groin', type: 'npc', sheetData: {} }],
        isProjecting: false,
    } as never);
    useCombatStore.setState({
        round: 1,
        combatants: [
            { id: 'cb-groin', name: 'Groin', init: 0, isPlayer: false, faction: 'enemy', sourceEntityId: 'groin', statuses: [] },
            { id: 'cb-brucelin', name: 'Brucelin', init: 0, isPlayer: true, faction: 'player', sourcePlayerId: 'brucelin', statuses: [] },
        ],
    } as never);
}

beforeEach(() => useRoundDuVoyageurStore.setState({ phase: 1, engagement: true, declarations: {} }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('le round en sept phases', () => {
    it('lit les armes du Voyageur avec leur facteur : demi-caractéristique + niveau', () => {
        table();
        render(<PanneauDesPhases />);
        const arme = screen.getByLabelText('Arme de la fiche de Brucelin') as HTMLSelectElement;
        expect(Array.from(arme.options).map(o => o.textContent)).toEqual(['Corps à corps (7)', 'Dague de mêlée (8)', 'Dague de jet (6)', 'Épée à une main (10)', 'Arc (7)', 'Autre arme…']);
        fireEvent.change(arme, { target: { value: 'Arc' } });
        expect((screen.getByLabelText('Action de Brucelin') as HTMLSelectElement).value).toBe('tir');
    });

    it('le tir passe avant la mêlée, et le plateau prend l’ordre des phases', () => {
        table();
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(4);
        render(<PanneauDesPhases />);
        fireEvent.change(screen.getByLabelText('Arme de la fiche de Brucelin'), { target: { value: 'Arc' } });
        // Le Groin n'a pas de fiche : le gabarit du pilote lui prête ses lignes, on choisit « Autre arme… ».
        fireEvent.change(screen.getByLabelText('Arme de la fiche de Groin'), { target: { value: '__autre' } });
        fireEvent.change(screen.getByLabelText('Arme de Groin'), { target: { value: 'Masse' } });
        fireEvent.change(screen.getByLabelText('Facteur de Groin'), { target: { value: '12' } });
        fireEvent.click(screen.getByRole('button', { name: /Tirer l’initiative/ }));
        const plateau = useCombatStore.getState().combatants;
        expect(plateau.map(c => c.name)).toEqual(['Brucelin', 'Groin']);
        expect(plateau.map(c => c.init)).toEqual([11, 16]);
        expect(useRoundDuVoyageurStore.getState().phase).toBe(2);
    });

    it('au round d’engagement, la longueur d’arme décide en mêlée et l’inconnue est signalée', () => {
        table();
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(4);
        render(<PanneauDesPhases />);
        fireEvent.change(screen.getByLabelText('Arme de la fiche de Brucelin'), { target: { value: 'Épée à une main' } });
        fireEvent.change(screen.getByLabelText('Arme de la fiche de Groin'), { target: { value: '__autre' } });
        fireEvent.change(screen.getByLabelText('Arme de Groin'), { target: { value: 'Lance' } });
        fireEvent.click(screen.getByRole('button', { name: /Tirer l’initiative/ }));
        expect(useCombatStore.getState().combatants.map(c => c.name)).toEqual(['Groin', 'Brucelin']);
        expect(screen.getByText(/Longueur inconnue \(Brucelin\)/)).toBeTruthy();
    });

    it('le round suivant efface les d6 et l’engagement, et avance le compteur', () => {
        table();
        render(<PanneauDesPhases />);
        fireEvent.click(screen.getByRole('button', { name: /Tirer l’initiative/ }));
        fireEvent.click(screen.getByRole('button', { name: /Round suivant/ }));
        const s = useRoundDuVoyageurStore.getState();
        expect(s.engagement).toBe(false);
        expect(Object.values(s.declarations).every(d => d.d6 === undefined)).toBe(true);
        expect(useCombatStore.getState().round).toBe(2);
    });

    it('tire une maladresse sur la table du livre', () => {
        table();
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(1);
        render(<PanneauDesPhases />);
        fireEvent.click(screen.getByRole('button', { name: 'Maladresse armée (2d10)' }));
        expect(screen.getByRole('status').textContent).toMatch(/2d10 = 2 : Assommé net/);
    });
});
