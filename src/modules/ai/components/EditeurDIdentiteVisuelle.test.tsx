import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Écrire l'identité visuelle, et la voir à la génération** — 2026-10-17.
 */
const analyse = vi.hoisted(() => ({ proposer: vi.fn(), accepter: vi.fn() }));
vi.mock('../analyseDeStyle', async importOriginal => {
    const vrai = await importOriginal<typeof import('../analyseDeStyle')>();
    return { ...vrai, proposerUneIdentite: analyse.proposer, accepterLaLicenceMeta: analyse.accepter };
});
vi.mock('../../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

const { default: EditeurDIdentiteVisuelle } = await import('./EditeurDIdentiteVisuelle');
const { default: AIPromptOverlay } = await import('./AIPromptOverlay');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useIdentiteSuspendue } = await import('../identiteDeLaPartie');

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({
        activeCampaignId: 'c',
        campaigns: [{ id: 'c', name: 'Anges de Feu', system: 'br' }],
        customGameDrivers: [{ id: 'br', name: 'Blade Runner', identiteVisuelle: { style: '1980s neo-noir' } }],
    } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); useIdentiteSuspendue.setState({ suspendue: false }); });

const pilote = () => useSessionOSStore.getState().customGameDrivers.find(d => d.id === 'br')!;
const campagne = () => useSessionOSStore.getState().campaigns.find(c => c.id === 'c')!;

describe('l’éditeur de l’identité visuelle', () => {
    it('sur le pilote : écrire, voir l’aperçu, enregistrer', () => {
        const fermer = vi.fn();
        render(<EditeurDIdentiteVisuelle cible={{ type: 'pilote', id: 'br' }} onClose={fermer} />);
        fireEvent.change(screen.getByPlaceholderText(/cartoon style/), { target: { value: 'daylight' } });
        expect(screen.getByText('Visual identity: 1980s neo-noir · Never include: daylight')).toBeTruthy();
        fireEvent.click(screen.getByText('Enregistrer'));
        expect(pilote().identiteVisuelle).toEqual({ style: '1980s neo-noir', aEviter: 'daylight' });
        expect(fermer).toHaveBeenCalled();
    });

    it('sur la campagne : elle complète le jeu, ou le remplace', () => {
        render(<EditeurDIdentiteVisuelle cible={{ type: 'campagne', id: 'c' }} onClose={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText(/neo-noir illustration/), { target: { value: 'Los Angeles 2019' } });
        expect(screen.getByText('Visual identity: 1980s neo-noir. Los Angeles 2019')).toBeTruthy();
        fireEvent.change(screen.getByLabelText('La campagne complète ou remplace'), { target: { value: 'remplace' } });
        expect(screen.getByText('Visual identity: Los Angeles 2019')).toBeTruthy();
        fireEvent.click(screen.getByText('Enregistrer'));
        expect(campagne().identiteVisuelle).toEqual({ style: 'Los Angeles 2019', aEviter: undefined, mode: 'remplace' });
    });

    it('le bloc STYLE / AVOID du GPT, collé dans le style, se range dans les deux champs', () => {
        render(<EditeurDIdentiteVisuelle cible={{ type: 'pilote', id: 'br' }} onClose={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText(/neo-noir illustration/), { target: { value: 'STYLE: ink and wash\nAVOID: neon' } });
        expect(screen.getByDisplayValue('ink and wash')).toBeTruthy();
        expect(screen.getByDisplayValue('neon')).toBeTruthy();
    });

    it('tout effacer retire l’identité', () => {
        render(<EditeurDIdentiteVisuelle cible={{ type: 'pilote', id: 'br' }} onClose={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText(/neo-noir illustration/), { target: { value: '' } });
        fireEvent.click(screen.getByText('Enregistrer'));
        expect(pilote().identiteVisuelle).toBeUndefined();
    });
});

describe('proposer depuis des images d’exemple', () => {
    const IMG = 'data:image/jpeg;base64,QUFB';
    beforeEach(() => {
        analyse.proposer.mockReset();
        analyse.accepter.mockReset();
        useSessionOSStore.setState({
            customGameDrivers: [{ id: 'br', name: 'Blade Runner', identiteVisuelle: { style: '', references: [IMG] } }],
        } as never);
    });

    it('la proposition remplit le style et ce qu’il faut éviter, à relire', async () => {
        analyse.proposer.mockResolvedValue({ style: 'ink wash, muted ochre', aEviter: 'neon' });
        render(<EditeurDIdentiteVisuelle cible={{ type: 'pilote', id: 'br' }} onClose={vi.fn()} />);
        expect(screen.getByAltText('Exemple 1')).toBeTruthy();
        fireEvent.click(screen.getByText('Proposer depuis ces images'));
        expect(await screen.findByDisplayValue('ink wash, muted ochre')).toBeTruthy();
        expect(screen.getByDisplayValue('neon')).toBeTruthy();
        // Rien n'est enregistré tant que le meneur ne l'a pas décidé.
        expect(pilote().identiteVisuelle?.style).toBe('');
    });

    it('la licence de Meta : l’écran la propose, le meneur l’accepte, l’analyse reprend', async () => {
        const { ErreurDeLicence } = await import('../analyseDeStyle');
        analyse.proposer.mockRejectedValueOnce(new ErreurDeLicence('submit "agree"')).mockResolvedValueOnce({ style: 'charcoal', aEviter: '' });
        render(<EditeurDIdentiteVisuelle cible={{ type: 'pilote', id: 'br' }} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Proposer depuis ces images'));
        fireEvent.click(await screen.findByText('J’accepte la licence de Meta'));
        expect(await screen.findByDisplayValue('charcoal')).toBeTruthy();
        expect(analyse.accepter).toHaveBeenCalledTimes(1);
    });

    it('retirer un exemple, puis enregistrer', () => {
        render(<EditeurDIdentiteVisuelle cible={{ type: 'pilote', id: 'br' }} onClose={vi.fn()} />);
        fireEvent.click(screen.getByLabelText('Retirer l’exemple 1'));
        fireEvent.click(screen.getByText('Enregistrer'));
        expect(pilote().identiteVisuelle).toBeUndefined();
    });
});

describe('la fenêtre d’invite d’image', () => {
    it('montre l’identité ajoutée, et la case la suspend', () => {
        render(<AIPromptOverlay isOpen onClose={vi.fn()} onGenerate={vi.fn()} />);
        expect(screen.getByText('1980s neo-noir')).toBeTruthy();
        fireEvent.click(screen.getByLabelText(/Identité visuelle ajoutée/));
        expect(useIdentiteSuspendue.getState().suspendue).toBe(true);
    });
});
