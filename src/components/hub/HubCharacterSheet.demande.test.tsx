import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **De la bannière au jet, sur la tablette** — plan
 * `2026-11-11-jets-demandes-et-caches.md`, T8 (C2, C3, C4). Le meneur a demandé
 * « Vigilance, modificateur −2 » ; la fiche s'ouvre sur « Lancer un test » déjà
 * composé, le joueur lance, et le résultat part au meneur avec l'identifiant de
 * la demande — ce qui la clôt chez lui (T4).
 */

vi.mock('../../modules/session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../../modules/voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { default: HubCharacterSheet } = await import('./HubCharacterSheet');
const { useSessionOSStore } = await import('../../modules/session/useSessionOSStore');
const { useClientStore } = await import('../../stores/useClientStore');
const { DiceEngine } = await import('../../modules/dice/DiceEngine');
const { messageDeDemande } = await import('../../modules/dice/filDesDemandes');

const FICHE = {
    id: 'tpl-essai', name: 'Essai', emoji: '🎲',
    sections: [{ id: 'attributs', label: 'Attributs', fields: [
        { id: 'precision', label: 'Précision', type: 'number', defaultValue: 0 },
        { id: 'vigilance', label: 'Vigilance', type: 'number', defaultValue: 0 },
    ] }],
};
const PILOTE = {
    id: 'essai', name: 'Essai', templateId: 'tpl-essai',
    dice: { defaultDice: '1d100', logic: 'count-success', engine: 'standard' },
    jet: {
        sens: 'sous-ou-egal',
        seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }],
        reserve: { base: 1, max: 1, faces: 100 },
        modificateurDuSeuil: { min: -5, max: 5, defaut: 0 },
    },
};
const WILSON = {
    id: 'pj-wilson', name: 'Wilson', templateId: 'tpl-essai', systemId: 'essai',
    sheetData: { precision: 40, vigilance: 60 }, hp: 10, maxHp: 10,
};
const DEMANDE = {
    genre: 'test' as const, id: 'd-1', characterId: 'pj-wilson', emiseLe: 1, titre: 'Vigilance',
    composition: { champs: { attribut: 'vigilance' }, modificateurDuSeuil: -2 },
};

const resultats: Record<string, unknown>[] = [];
const ecouter = (e: Event) => resultats.push((e as CustomEvent).detail);
let de: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    window.addEventListener('fiche:resultat', ecouter);
    de = vi.spyOn(DiceEngine, 'roll').mockImplementation(() => 30);
    useClientStore.setState({ characterId: 'pj-wilson' } as never);
    useSessionOSStore.setState({
        players: [{ id: 'j1', name: 'David', characters: [WILSON] }],
        campaigns: [], activeCampaignId: null,
        customSheetTemplates: [FICHE], customGameDrivers: [PILOTE],
        messages: [messageDeDemande(DEMANDE, 'Wilson')],
    } as never);
});
afterEach(() => {
    cleanup();
    window.removeEventListener('fiche:resultat', ecouter);
    resultats.length = 0;
    de.mockRestore();
});

describe('la fiche de la tablette, ouverte sur une demande', () => {
    it('arrive sur « Lancer un test » composé, et le jet porte la demande', () => {
        render(<HubCharacterSheet onClose={() => {}} demandeAOuvrir="d-1" />);

        const onglet = screen.getByRole('tab', { name: /Lancer un test/ });
        expect(onglet.getAttribute('aria-selected')).toBe('true');
        const panneau = document.getElementById('fiche-joueur-test')!;
        const [attribut] = panneau.querySelectorAll('select');
        expect((attribut as HTMLSelectElement).value).toBe('vigilance');

        const lancer = Array.from(panneau.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Lancer')!;
        fireEvent.click(lancer);
        expect(resultats).toHaveLength(1);
        expect(resultats[0]).toMatchObject({ characterId: 'pj-wilson', demandeId: 'd-1' });
        // Vigilance 60, modificateur −2 : le seuil voyage avec le total.
        expect(String(resultats[0].totalDisplay)).toContain('seuil 58');
    });

    it('la bannière se montre dans la fiche, et « Lancer » y ouvre la demande', () => {
        render(<HubCharacterSheet onClose={() => {}} />);
        expect(screen.getByRole('tab', { name: /Vue synthétique/ }).getAttribute('aria-selected')).toBe('true');
        const banniere = screen.getByRole('region', { name: 'Le meneur te demande un jet' });
        fireEvent.click(banniere.querySelector('button')!);
        expect(screen.getByRole('tab', { name: /Lancer un test/ }).getAttribute('aria-selected')).toBe('true');
        const [attribut] = document.getElementById('fiche-joueur-test')!.querySelectorAll('select');
        expect((attribut as HTMLSelectElement).value).toBe('vigilance');
    });
});
