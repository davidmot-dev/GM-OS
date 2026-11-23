import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '../../../i18n';

/**
 * § 268, T8 (21/11/2026) — le bouton de type de la fiche PNJ ne propose plus
 * « Joueur » : il ne changeait qu'une étiquette, sans faire du PNJ un vrai
 * personnage joueur. Le vrai geste, « Faire un personnage joueur… », est dans
 * la rangée des actions.
 */

vi.mock('../logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../../voice/useVoiceStore', () => ({ useVoiceStore: Object.assign(() => ({}), { subscribe: () => () => {}, getState: () => ({}) }) }));
vi.mock('../../voice/hooks/useVoiceAutomation', () => ({ useVoiceAutomation: () => ({}) }));

const { default: NpcDetail } = await import('./NpcDetail');
const { useSessionOSStore } = await import('../useSessionOSStore');

const pnj = (type: string) => ({
    id: 'e-marta', name: 'Marta', type, role: 'ally', status: 'alive', avatar: '', hp: 7, maxHp: 10,
    ac: 0, speed: 0, initiative: 0, description: '', roleplayingNotes: '', gmSecretInfo: '', linkedMapIds: [],
    campaignId: 'c1', templateId: 'generic', sheetData: {},
});
const typeDeMarta = () => useSessionOSStore.getState().entities[0].type;
const leBoutonDeType = () => screen.getByTitle('Changer le type : PNJ ou Monstre');

beforeEach(() => {
    useSessionOSStore.setState({
        activeCampaignId: 'c1', campaigns: [{ id: 'c1', name: 'Les pluies', system: 'generic', activeLocationIds: [] }],
        players: [], scenes: [], rencontres: [], selectedEntityId: 'e-marta',
    } as never);
});
afterEach(cleanup);

describe('le type d’un PNJ', () => {
    it('le cycle passe de PNJ à Monstre et revient, sans « Joueur »', () => {
        useSessionOSStore.setState({ entities: [pnj('npc')] } as never);
        render(<NpcDetail />);
        fireEvent.click(leBoutonDeType());
        expect(typeDeMarta()).toBe('monster');
        fireEvent.click(leBoutonDeType());
        expect(typeDeMarta()).toBe('npc');
    });

    it('un PNJ déjà marqué « Joueur » revient sur « PNJ » au prochain clic', () => {
        useSessionOSStore.setState({ entities: [pnj('pc')] } as never);
        render(<NpcDetail />);
        fireEvent.click(leBoutonDeType());
        expect(typeDeMarta()).toBe('npc');
    });

    it('23/11 : une entité au rôle et au type hors du modèle (une ville écrite en PNJ) s’ouvre, lue « neutre » et « PNJ »', () => {
        // « À la claire fontaine » : « Narsis », type `location`, rôle `city` — sa fiche faisait tomber le tableau de bord.
        useSessionOSStore.setState({ entities: [{ ...pnj('location'), role: 'city' }] } as never);
        render(<NpcDetail />);
        expect(leBoutonDeType().textContent).toMatch(/PNJ/i);
        expect(screen.getByText(/Neutre/i)).toBeTruthy();
    });

    it('la fiche porte le vrai geste, « Faire un personnage joueur… »', () => {
        useSessionOSStore.setState({ entities: [pnj('npc')] } as never);
        render(<NpcDetail />);
        expect(screen.getByRole('button', { name: /Faire un personnage joueur/ })).toBeTruthy();
    });
});
