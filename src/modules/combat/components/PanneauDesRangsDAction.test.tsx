import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

/**
 * **Les rangs d'action de RuneQuest dans Combat-OS** — RQ-A4, 03/11/2026. Le RA se lit
 * selon l'action déclarée ; « Ordonner le round » range le plateau du RA 1 au RA 12, la
 * DEX la plus haute d'abord ; au-delà de 12, le meneur reporte ou renonce.
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

const { default: PanneauDesRangsDAction } = await import('./PanneauDesRangsDAction');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useCombatStore } = await import('../useCombatStore');
const { useRangsDActionStore } = await import('../useRangsDActionStore');
const { useJournalStore } = await import('../../journal/useJournalStore');

const champ = (id: string, type = 'number') => ({ id, label: id, type, defaultValue: type === 'number' ? 0 : '' });
const FICHE = {
    id: 'tpl-rq', name: 'RuneQuest', emoji: '',
    sections: [{ id: 'combat', label: 'Combat', fields: [
        champ('dex'), champ('ra_dex'), champ('ra_tai'),
        champ('arme1'), champ('arme1_nom', 'text'), champ('arme1_ra'), champ('arme1_degats', 'text'),
        champ('tir1'), champ('tir1_nom', 'text'), champ('tir1_ra'), champ('tir1_degats', 'text'),
    ] }],
};
const RQ = {
    id: 'rq', name: 'RuneQuest', templateId: 'tpl-rq', dice: { defaultDice: '1d100', logic: 'd100-low', engine: 'standard' },
    jet: { sens: 'sous-ou-egal', seuil: [], runequest: { armes: [
        { score: 'arme1', nom: 'arme1_nom', degats: 'arme1_degats', ra: 'arme1_ra', genre: 'melee' },
        { score: 'tir1', nom: 'tir1_nom', degats: 'tir1_degats', ra: 'tir1_ra', genre: 'distance' },
    ] } },
    combat: { statsToTrack: [], initiativeFormula: 'ra_dex + ra_tai', initiative: { mode: 'rangs-d-action' },
        rangsDAction: { mecanique: 'runequest', dex: 'dex', raDex: 'ra_dex', raTai: 'ra_tai' } },
};

function table() {
    useSessionOSStore.setState({
        activeCampaignId: 'c', customGameDrivers: [RQ], customSheetTemplates: [FICHE],
        campaigns: [{ id: 'c', name: 'RQ', system: 'rq' }],
        players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: false, characters: [
            { id: 'vasana', name: 'Vasana', campaignId: 'c', templateId: 'tpl-rq',
                sheetData: { dex: 11, ra_dex: 3, ra_tai: 2, arme1_nom: 'Épée large', arme1_ra: 7, tir1_nom: 'Arc composite', tir1_ra: 3 } },
            { id: 'yanioth', name: 'Yanioth', campaignId: 'c', templateId: 'tpl-rq',
                sheetData: { dex: 13, ra_dex: 2, ra_tai: 2, arme1_nom: 'Hache de bataille', arme1_ra: 7 } },
        ] }],
        entities: [{ id: 'broo', name: 'Broo', type: 'npc', sheetData: { dex: 9, ra_dex: 3, ra_tai: 1 } }],
        isProjecting: false,
    } as never);
    useCombatStore.setState({
        round: 1,
        combatants: [
            { id: 'cb-broo', name: 'Broo', init: 0, isPlayer: false, faction: 'enemy', sourceEntityId: 'broo', statuses: [] },
            { id: 'cb-vasana', name: 'Vasana', init: 0, isPlayer: true, faction: 'player', sourcePlayerId: 'vasana', statuses: [] },
            { id: 'cb-yanioth', name: 'Yanioth', init: 0, isPlayer: true, faction: 'player', sourcePlayerId: 'yanioth', statuses: [] },
        ],
    } as never);
}

const declaration = (nom: string) => screen.getByLabelText(`Déclaration de ${nom}`);
const rang = (nom: string) => declaration(nom).querySelector('[data-rang-runequest]')!.textContent;

// Le journal enregistre seulement pendant une séance : on regarde ce qu'il reçoit.
const consigne = vi.fn();
const journal = useJournalStore.getState().addEvent;
beforeEach(() => {
    useRangsDActionStore.setState({ declarations: {}, reports: {}, renonces: {} }); table();
    consigne.mockClear(); useJournalStore.setState({ addEvent: consigne } as never);
});
afterEach(() => useJournalStore.setState({ addEvent: journal } as never));
const dernierConsigne = () => String(consigne.mock.calls.at(-1)?.[0]?.content);
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('les rangs d’action selon l’action (RQ-A4)', () => {
    it('lit le RA de l’arme sur la fiche : épée large 7, arc 3 au tir (p. 85, 194)', () => {
        render(<PanneauDesRangsDAction />);
        expect(rang('Vasana')).toBe('RA 7 = 7 arme');
        fireEvent.change(screen.getByLabelText('Action de Vasana'), { target: { value: 'distance' } });
        expect((screen.getByLabelText('Arme de Vasana') as HTMLSelectElement).value).toBe('Arc composite');
        expect(rang('Vasana')).toBe('RA 3 = 3 arme');
    });

    it('un sort de magie spirituelle : RA de DEX + PM au-delà du premier, +5 depuis une arme (p. 194)', () => {
        render(<PanneauDesRangsDAction />);
        fireEvent.change(screen.getByLabelText('Action de Yanioth'), { target: { value: 'magie-spirituelle' } });
        fireEvent.change(screen.getByLabelText('PM de Yanioth'), { target: { value: '3' } });
        fireEvent.click(within(declaration('Yanioth')).getByLabelText('Passe d’une arme au sort (+5)'));
        expect(rang('Yanioth')).toBe('RA 9 = 2 DEX + 2 PM + 5 arme → sort');
    });

    it('sans arme sur la fiche : DEX + TAI, ou le RA saisi', () => {
        render(<PanneauDesRangsDAction />);
        expect(rang('Broo')).toBe('RA 4 = 3 DEX + 1 TAI');
        fireEvent.change(screen.getByLabelText('RA de l’arme de Broo'), { target: { value: '9' } });
        expect(rang('Broo')).toBe('RA 9 = 9 arme');
    });

    it('ordonne le plateau : le RA le plus bas d’abord, la DEX la plus haute à égalité (p. 192)', () => {
        render(<PanneauDesRangsDAction />);
        fireEvent.change(screen.getByLabelText('RA de l’arme de Broo'), { target: { value: '7' } });
        fireEvent.click(screen.getByText('Ordonner le round'));
        const ordre = useCombatStore.getState().combatants.map(c => [c.name, c.init]);
        expect(ordre).toEqual([['Yanioth', 7], ['Vasana', 7], ['Broo', 7]]);
        expect(dernierConsigne()).toContain('RA 7 Yanioth — Hache de bataille');
    });

    it('à DEX égale, les actions sont simultanées', () => {
        useSessionOSStore.setState(s => ({ entities: [{ ...s.entities[0], sheetData: { dex: 11, ra_dex: 3, ra_tai: 1 } }] }) as never);
        render(<PanneauDesRangsDAction />);
        fireEvent.change(screen.getByLabelText('RA de l’arme de Broo'), { target: { value: '7' } });
        expect(within(screen.getByLabelText('Ordre du round')).getAllByText('simultané')).toHaveLength(2);
    });

    it('au-delà de 12 : rien ce round, et le report choisi par le meneur est gardé (p. 194)', () => {
        render(<PanneauDesRangsDAction />);
        fireEvent.change(screen.getByLabelText('RA de l’arme de Broo'), { target: { value: '9' } });
        fireEvent.change(screen.getByLabelText('Préparations de Broo'), { target: { value: '1' } });
        expect(rang('Broo')).toBe('RA 14 : au-delà de 12, rien ce round (p. 194)');
        fireEvent.click(screen.getByText('Ordonner le round'));
        expect(useCombatStore.getState().combatants.map(c => c.name)).toEqual(['Yanioth', 'Vasana', 'Broo']);
        expect(dernierConsigne()).toContain('Au-delà de 12, rien ce round : Broo');
        fireEvent.click(screen.getByText('Reporter (RA 2 au round 2)'));
        expect(useRangsDActionStore.getState().reports['cb-broo']).toEqual({ ra: 2, round: 2, quoi: 'Mêlée' });
        fireEvent.click(screen.getByText('Round suivant'));
        expect(useCombatStore.getState().round).toBe(2);
        expect(declaration('Broo').textContent).toContain('Reporté');
        fireEvent.click(screen.getByText('Ordonner le round'));
        expect(useCombatStore.getState().combatants[0]).toMatchObject({ name: 'Broo', init: 2 });
    });

    it('un sort de sorcellerie se poursuit d’office : Damastol au RA 5 deux rounds plus tard (p. 386)', () => {
        render(<PanneauDesRangsDAction />);
        fireEvent.change(screen.getByLabelText('Action de Vasana'), { target: { value: 'sorcellerie' } });
        fireEvent.change(screen.getByLabelText('PM de Vasana'), { target: { value: '7' } });
        expect(rang('Vasana')).toBe('RA 29 : au-delà de 12, rien ce round (p. 194) — le sort se poursuit');
        fireEvent.click(screen.getByText('Poursuivre (RA 5 au round 3)'));
        expect(declaration('Vasana').textContent).toContain('agit au RA 5 du round 3');
    });

    it('renoncer retire l’action de l’ordre du round', () => {
        render(<PanneauDesRangsDAction />);
        fireEvent.change(screen.getByLabelText('Préparations de Broo'), { target: { value: '2' } });
        fireEvent.click(screen.getByText('Renoncer'));
        expect(declaration('Broo').textContent).toContain('Renonce à son action ce round.');
        expect(within(screen.getByLabelText('Ordre du round')).getByText('Broo — renonce')).toBeTruthy();
    });
});
