import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Le round de Degenesis dans Combat-OS** — DEG-A1, 03/11/2026. L'Égo se déclare avant
 * l'initiative, se paie une fois sur la fiche, ajoute ses dés au jet ; surpris, rien ; le
 * plateau se range par succès, les joueurs d'abord à égalité (p. 100-101).
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

const { default: PanneauDuRoundDeDegenesis } = await import('./PanneauDuRoundDeDegenesis');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useCombatStore } = await import('../useCombatStore');
const { useRoundDeDegenesisStore } = await import('../useRoundDeDegenesisStore');
const { useJournalStore } = await import('../../journal/useJournalStore');
const { DiceEngine } = await import('../../dice/DiceEngine');

const champ = (id: string) => ({ id, label: id, type: 'number', defaultValue: 0 });
const FICHE = { id: 'tpl-deg', name: 'Degenesis', emoji: '', sections: [{ id: 'f', label: 'F', fields: ['psyche', 'reactivite', 'ego_jauge', 'traumatismes'].map(champ) }] };
const DEG = {
    id: 'deg', name: 'Degenesis', templateId: 'tpl-deg', dice: { defaultDice: '6d6', logic: 'count-success', engine: 'pool', successThreshold: 4 },
    jet: { sens: 'superieur-ou-egal', degenesis: { traumatismes: 'traumatismes', ego: 'ego_jauge' } },
    combat: { statsToTrack: [], initiativeFormula: 'psyche + reactivite', initiativeEnReserve: { mecanique: 'degenesis' } },
};

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 1);
// Le journal enregistre seulement pendant une séance : on regarde ce qu'il reçoit.
const consigne = vi.fn();
const journal = useJournalStore.getState().addEvent;
const sessionAvant = useSessionOSStore.getState();
const combatAvant = useCombatStore.getState();

beforeEach(() => {
    de = vi.spyOn(DiceEngine, 'roll');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({
        activeCampaignId: 'c', customGameDrivers: [DEG], customSheetTemplates: [FICHE],
        campaigns: [{ id: 'c', name: 'Borca', system: 'deg' }],
        players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: false, characters: [
            { id: 'vedran', name: 'Vedran', campaignId: 'c', templateId: 'tpl-deg', sheetData: { psyche: 2, reactivite: 2, ego_jauge: 8, traumatismes: 0 } },
            { id: 'kum', name: 'Kum', campaignId: 'c', templateId: 'tpl-deg', sheetData: { psyche: 2, reactivite: 2, ego_jauge: 4, traumatismes: 1 } },
        ] }],
        entities: [],
        isProjecting: false,
    } as never);
    useCombatStore.setState({
        round: 1, consignerLOuvertureDuCombat: () => {}, broadcastSync: () => {},
        combatants: [
            { id: 'cb-usudis', name: "Meute d'Usudis", init: 0, isPlayer: false, faction: 'enemy', statuses: [] },
            { id: 'cb-kum', name: 'Kum', init: 0, isPlayer: true, faction: 'player', sourcePlayerId: 'kum', statuses: [] },
            { id: 'cb-vedran', name: 'Vedran', init: 0, isPlayer: true, faction: 'player', sourcePlayerId: 'vedran', statuses: [] },
        ],
    } as never);
    useRoundDeDegenesisStore.setState({ round: null, etats: {}, declarations: {} });
    consigne.mockClear(); useJournalStore.setState({ addEvent: consigne } as never);
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useSessionOSStore.setState(sessionAvant, true);
    useCombatStore.setState(combatAvant, true);
    useJournalStore.setState({ addEvent: journal } as never);
});

describe('le round de Degenesis', () => {
    it("Vedran dépense 2 Égo : six dés, l'Égo payé une fois ; Kum : trois dés (un Traumatisme) ; la meute, surprise, rien", () => {
        render(<PanneauDuRoundDeDegenesis />);
        fireEvent.change(screen.getByLabelText('Égo de Vedran'), { target: { value: '2' } });
        fireEvent.click(screen.getAllByText('Pris par surprise')[0]);
        expect(screen.queryByLabelText("Égo de Meute d'Usudis")).toBeNull();
        fireEvent.change(screen.getByLabelText("PSY + Réactivité de Meute d'Usudis"), { target: { value: '5' } });
        // Ordre du plateau : la meute (5 dés), Kum (3), Vedran (6).
        faces(4, 4, 4, 2, 2, /* Kum */ 5, 5, 5, /* Vedran */ 6, 6, 6, 6, 5, 2);
        fireEvent.click(screen.getByText('Lancer l’initiative'));
        expect(de).toHaveBeenCalledTimes(14);
        const vedran = useSessionOSStore.getState().players[0].characters.find(c => c.id === 'vedran')!;
        expect(vedran.sheetData.ego_jauge).toBe(6);
        const etats = useRoundDeDegenesisStore.getState().etats;
        expect(etats['cb-vedran']).toMatchObject({ score: 5, actions: 3, bonusEgo: 2, bonusUtilise: false });
        expect(etats['cb-kum']).toMatchObject({ score: 3, actions: 1 });
        // À égalité, Kum (joueur) avant la meute (PNJ) ; Vedran en tête.
        expect(useCombatStore.getState().combatants.map(c => c.id)).toEqual(['cb-vedran', 'cb-kum', 'cb-usudis']);
        expect(screen.getByText('+2D d’Égo — première action')).toBeTruthy();
        expect(String(consigne.mock.calls.at(-1)?.[0]?.content)).toContain("Vedran 5 (3 actions), +2D d'Égo (Égo 8 → 6)");
    });

    it('« Défense active » dépense une action ; plus d’action : la passive seule ; le bonus ne revient pas', () => {
        render(<PanneauDuRoundDeDegenesis />);
        fireEvent.change(screen.getByLabelText('Égo de Kum'), { target: { value: '1' } });
        faces(1);
        fireEvent.click(screen.getByText('Lancer l’initiative'));
        const kum = screen.getByText('Kum', { selector: 'span' }).closest('[data-round-degenesis]') as HTMLElement;
        fireEvent.click(kum.querySelector('button[title^="Il se défend"]')!);
        expect(useRoundDeDegenesisStore.getState().etats['cb-kum']).toMatchObject({ utilisees: 1, bonusUtilise: true });
        expect(kum.textContent).toContain('Défense passive seulement');
        expect(kum.textContent).toContain('Égo épuisé');
        fireEvent.click(screen.getAllByText('Rendre une action')[0]);
        expect(useRoundDeDegenesisStore.getState().etats['cb-kum'].utilisees).toBe(0);
        expect(kum.textContent).not.toContain('+1D d’Égo');
    });
});

describe('DEG-A5 et DEG-A6 au round (04/11)', () => {
    const PILOTE = {
        ...DEG,
        jet: { ...DEG.jet, degenesis: { ...DEG.jet.degenesis, maxima: {
            ego: { champ: 'ego_max', jauge: 'ego_jauge', branches: [] },
            blessures: { jauge: 'blessures_superficielles', champs: ['physique', 'resistance'] },
            traumatismes: { jauge: 'traumatismes', champs: ['physique', 'psyche'] },
            abreviations: { physique: 'PHY', resistance: 'Résistance', psyche: 'PSY' },
        } } },
        combat: { ...DEG.combat,
            statsToTrack: [
                { fieldId: 'blessures_superficielles', max: '(physique + resistance) * 2' },
                { fieldId: 'traumatismes', max: 'physique + psyche' },
                { fieldId: 'ego_jauge', max: 'ego_max' },
            ],
            pistesDeSante: { mecanique: 'degenesis', blessures: 'blessures_superficielles', traumatismes: 'traumatismes', ego: 'ego_jauge' } },
    };

    it('la meute sans fiche se prépare : PHY 3, Résistance 2, PSY 2, Égo 4 → Blessures 0/10, Traumatismes 0/5', () => {
        useSessionOSStore.setState({ customGameDrivers: [PILOTE] } as never);
        render(<PanneauDuRoundDeDegenesis />);
        const bloc = document.querySelector('[data-adversaire-degenesis="cb-usudis"]') as HTMLElement;
        expect(bloc.textContent).toContain('à préparer');
        expect(document.querySelector('[data-adversaire-degenesis="cb-kum"]')).toBeNull();
        fireEvent.change(screen.getByLabelText("PHY de Meute d'Usudis"), { target: { value: '3' } });
        fireEvent.change(screen.getByLabelText("Résistance de Meute d'Usudis"), { target: { value: '2' } });
        fireEvent.change(screen.getByLabelText("PSY de Meute d'Usudis"), { target: { value: '2' } });
        fireEvent.change(screen.getByLabelText("Égo de Meute d'Usudis"), { target: { value: '4' } });
        fireEvent.click(screen.getByText('Préparer'));
        const meute = useCombatStore.getState().combatants.find(c => c.id === 'cb-usudis')!;
        expect(meute).toMatchObject({ hp: 15, hpMax: 15 });
        expect(meute.sheetData).toMatchObject({ physique: 3, resistance: 2, psyche: 2, ego_max: 4, ego_jauge: 4, blessures_superficielles: 0, traumatismes: 0 });
        expect(bloc.querySelector('[data-pistes-adversaire]')!.textContent).toContain('Blessures 0 / 10 · Traumatismes 0 / 5 · Égo 4 / 4');
        // Préparée, elle garde sa réserve dite à la main : la formule demande aussi la Réactivité.
        expect(screen.getByLabelText("PSY + Réactivité de Meute d'Usudis")).toBeTruthy();
    });

    it('l’Argus de Vedran, Puissance 2 : deux dés de plus à l’initiative, la surprise impossible', () => {
        const s = useSessionOSStore.getState();
        const [vedran, kum] = s.players[0].characters;
        useSessionOSStore.setState({ players: [{ ...s.players[0], characters: [
            { ...vedran, sheetData: { ...vedran.sheetData, _gmos_degenesis: { version: 1, stimulation: { chakra: 'argus', puissance: 2 } } } }, kum,
        ] }] } as never);
        render(<PanneauDuRoundDeDegenesis />);
        const vedranAvant = screen.getByLabelText('Initiative de Vedran');
        expect(vedranAvant.textContent).toContain('Argus : +2D à l’initiative, ne peut être pris par surprise');
        expect(vedranAvant.textContent).not.toContain('Pris par surprise');
        // La meute 0 dé (rien de déclaré), Kum 3, Vedran 4 + 2.
        faces(5, 5, 5, /* Vedran */ 6, 6, 6, 6, 6, 6);
        fireEvent.click(screen.getByText('Lancer l’initiative'));
        expect(de).toHaveBeenCalledTimes(9);
        expect(useRoundDeDegenesisStore.getState().etats['cb-vedran']).toMatchObject({ score: 6 });
        expect(String(consigne.mock.calls.at(-1)?.[0]?.content)).toContain("+2D d'Argus");
    });
});
