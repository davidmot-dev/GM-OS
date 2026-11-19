import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Cthulhu Hack : l'Armure d'un adversaire du livre** — registre § 263, T17 (C7, 19/11/2026).
 * « Jetez les dés de dégâts et déduisez la valeur des points d'Armure » (livre, p. 51 : la goule à
 * 1 PA perd 5 sur un 6). « Calculer » et la console de la carte appliquent la même règle.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('./../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('./../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { useCombatStore } = await import('./useCombatStore');
const { useJournalStore } = await import('../journal/useJournalStore');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { armureDeLAdversaire } = await import('./logic/attaqueDeLAdversaire');
const { default: CombatCard } = await import('./components/CombatCard');

const PILOTE = {
    id: 'ch', name: 'Cthulhu Hack', dice: { defaultDice: '1d20', logic: 'count-success', engine: 'standard' },
    combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'hp', label: 'PV', isMainHP: true }] },
    jet: { cthulhuHack: { pv: 'hp', armures: [] } },
    bestiaire: {
        colonnes: [
            { id: 'points-de-vie', libelle: 'Points de Vie', nature: 'nombre', champ: 'hp' },
            { id: 'points-d-armure', libelle: 'Points d’Armure', nature: 'nombre', role: 'protection' },
        ],
        creatures: [
            { id: 'goule', nom: 'Goule', valeurs: { 'points-de-vie': 8, 'points-d-armure': 1 } },
            { id: 'gros-bras', nom: 'Gros bras', valeurs: { 'points-de-vie': 6, 'points-d-armure': 0 } },
        ],
    },
};

beforeEach(() => {
    useCombatStore.getState().reset();
    useSessionOSStore.setState({ activeCampaignId: 'c1', campaigns: [{ id: 'c1', name: 'Essai', system: 'ch' }], customGameDrivers: [PILOTE], players: [], entities: [] } as never);
    (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = useSessionOSStore;
    useJournalStore.getState().clearJournal();
    useJournalStore.getState().addJournal('Séance de test');
    useJournalStore.setState({ isRecording: true });
});
afterEach(() => cleanup());

const poser = (nom: string, creatureId?: string) => {
    useCombatStore.getState().addCombatant({ name: nom, init: 0, isPlayer: false, faction: 'enemy', statuses: [], sheetData: { hp: 8 },
        ...(creatureId ? { origineDuLivre: { creatureId } } : {}) } as never);
    return useCombatStore.getState().combatants.find(c => c.name === nom)!;
};
const pv = (nom: string) => useCombatStore.getState().combatants.find(c => c.name === nom)!.hp;

describe('l’Armure d’un adversaire du livre (T17)', () => {
    it('se lit au bestiaire, colonne au rôle « protection »', () => {
        expect(armureDeLAdversaire(PILOTE as never, { origineDuLivre: { creatureId: 'goule' } })).toBe(1);
        expect(armureDeLAdversaire(PILOTE as never, { origineDuLivre: { creatureId: 'gros-bras' } })).toBe(0);
        expect(armureDeLAdversaire(PILOTE as never, {}), 'un adversaire fabriqué').toBe(0);
    });

    it('« Calculer » 6 sur la goule (1 PA) : elle perd 5 (p. 51), et le journal le dit', () => {
        const goule = poser('Goule 1', 'goule');
        expect(goule.hp).toBe(8);
        useCombatStore.getState().applyDamage(6, 'physique', [goule.id]);
        expect(pv('Goule 1')).toBe(3);
        const ligne = useJournalStore.getState().journals[0].events.find(e => e.title?.includes('Goule 1'));
        expect(ligne?.content).toContain('6 − Armure 1');
    });

    it('jamais sur un soin ; un coup plus faible que l’Armure ne fait rien', () => {
        const goule = poser('Goule 1', 'goule');
        useCombatStore.getState().applyDamage(1, 'physique', [goule.id]);
        expect(pv('Goule 1')).toBe(8);
        useCombatStore.getState().applyDamage(4, 'physique', [goule.id]);
        useCombatStore.getState().applyDamage(-2, 'physique', [goule.id]);
        expect(pv('Goule 1'), '8 − 3 + 2').toBe(7);
    });

    it('un adversaire fabriqué, sans Armure au bestiaire, prend le coup entier', () => {
        const homme = poser('Homme de main');
        useCombatStore.getState().applyDamage(6, 'physique', [homme.id]);
        expect(pv('Homme de main')).toBe(2);
    });

    it('la console de la carte applique la même règle : Dégâts 6 sur la goule → 3', () => {
        const goule = poser('Goule 1', 'goule');
        render(<CombatCard combatant={goule as never} isActive={false} />);
        fireEvent.change(screen.getByTitle('Intensité'), { target: { value: '6' } });
        fireEvent.click(screen.getByTitle('Infliger dégâts'));
        expect(pv('Goule 1')).toBe(3);
    });
});
