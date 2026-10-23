// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import DossierDEnquete from './DossierDEnquete';
import { useSessionOSStore } from '../useSessionOSStore';
import { useJournalStore } from '../../journal/useJournalStore';

/**
 * **Le dossier d'enquête** — Crimes, C5 (2026-10-22) : les points que le meneur
 * distribue, l'indice qui devient accessible, révélé à un seul, puis partagé.
 */
const STYLES = [
    { id: 'limier', label: 'Limier', niveau: 'limier', points: 'compteur_limier' },
    { id: 'conde', label: 'Condé', niveau: 'conde', points: 'compteur_conde' },
];
const updateClue = vi.fn();
const updateCharacterSheetData = vi.fn();
const addEvent = vi.fn();
const initial = useSessionOSStore.getState();
const initialJournal = useJournalStore.getState();

beforeEach(() => {
    updateClue.mockClear(); updateCharacterSheetData.mockClear(); addEvent.mockClear();
    useSessionOSStore.setState({
        activeCampaignId: 'c',
        players: [{ id: 'j', characters: [
            { id: 'rachel', name: 'Rachel Attar', campaignId: 'c', sheetData: { limier: 2, compteur_limier: 2, conde: 0, compteur_conde: 0 } },
        ] }],
        clues: [
            { id: 'larve', campaignId: 'c', title: 'La larve de bombyx', content: '', isRevealed: false,
                seuilsDEnquete: [{ style: 'limier', points: 3 }], gainsDEnquete: [{ style: 'limier', points: 1 }] },
            { id: 'lettre', campaignId: 'c', title: 'La lettre', content: '', isRevealed: false, connuDe: ['rachel'],
                trouvePar: { personnageId: 'rachel', nom: 'Rachel Attar', style: 'Limier', quand: 1 } },
        ],
        updateClue, updateCharacterSheetData,
    } as never);
    useJournalStore.setState({ addEvent } as never);
});
afterEach(() => { cleanup(); useSessionOSStore.setState(initial, true); useJournalStore.setState(initialJournal, true); });

describe('le dossier d’enquête', () => {
    it('un point de Limier écrit la fiche ; le Condé, que Rachel ne possède pas, ne se gagne pas', () => {
        render(<DossierDEnquete styles={STYLES} />);
        fireEvent.click(screen.getByRole('button', { name: 'Un point de plus : Rachel Attar, Limier' }));
        expect(updateCharacterSheetData).toHaveBeenCalledWith('j', 'rachel', 'compteur_limier', 3);
        expect((screen.getByRole('button', { name: 'Un point de plus : Rachel Attar, Condé' }) as HTMLButtonElement).disabled).toBe(true);
        expect(addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'Points d\'enquête — Rachel Attar', content: 'Limier +1 → 3' }));
    });

    it('à 3 en Limier, la larve est à portée : révélée à Rachel seule, avec son gain', () => {
        useSessionOSStore.setState({ players: [{ id: 'j', characters: [
            { id: 'rachel', name: 'Rachel Attar', campaignId: 'c', sheetData: { limier: 2, compteur_limier: 3 } },
        ] }] } as never);
        render(<DossierDEnquete styles={STYLES} />);
        const portee = document.querySelector('[data-indices-a-portee]') as HTMLElement;
        expect(within(portee).getByText('Rachel Attar — Limier 3/3')).toBeTruthy();
        fireEvent.click(within(portee).getByText('Révéler à Rachel Attar'));
        expect(updateClue).toHaveBeenCalledWith('larve', expect.objectContaining({
            connuDe: ['rachel'], trouvePar: expect.objectContaining({ nom: 'Rachel Attar', style: 'Limier' }),
        }));
        expect(updateCharacterSheetData).toHaveBeenCalledWith('j', 'rachel', 'compteur_limier', 4);
    });

    it('l’indice connu d’un seul se partage à la table, son origine dite au journal', () => {
        render(<DossierDEnquete styles={STYLES} />);
        const prives = document.querySelector('[data-indices-prives]') as HTMLElement;
        expect(within(prives).getByText(/connu de Rachel Attar — trouvé par Limier/)).toBeTruthy();
        fireEvent.click(within(prives).getByText('Partager à la table'));
        expect(updateClue).toHaveBeenCalledWith('lettre', expect.objectContaining({ isRevealed: true }));
        expect(addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'Indice partagé à la table — La lettre', content: 'Trouvé par Rachel Attar (Limier).' }));
    });

    it('« Nouvelle affaire » demande une confirmation, puis ramène les points au niveau', () => {
        render(<DossierDEnquete styles={STYLES} />);
        fireEvent.click(screen.getByText('Nouvelle affaire'));
        expect(updateCharacterSheetData).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('Confirmer : points au niveau des styles'));
        expect(updateCharacterSheetData).toHaveBeenCalledWith('j', 'rachel', 'compteur_limier', 2);
        expect(updateCharacterSheetData).toHaveBeenCalledWith('j', 'rachel', 'compteur_conde', 0);
    });
});

/** **L'affaire par lieu et par témoin, et ses hypothèses** — C5, reste (2026-10-23), p. 437-440. */
describe('l’affaire et ses hypothèses', () => {
    const updateCampaign = vi.fn();
    beforeEach(() => {
        updateCampaign.mockClear();
        useSessionOSStore.setState({
            atlasMaps: [{ id: 'ruelle', name: 'La ruelle des Ursulines' }],
            entities: [{ id: 'ivrogne', name: 'L’ivrogne' }],
            campaigns: [{ id: 'c', name: 'Le Bombyx', system: 'crimes', activeLocationIds: [], hypothesesDEnquete: [] }],
            clues: [
                { id: 'arme', campaignId: 'c', title: 'L’arme dans la poubelle', content: '', isRevealed: false, locationId: 'ruelle', ownerId: 'ivrogne' },
                { id: 'larve', campaignId: 'c', title: 'La larve de bombyx', content: '', isRevealed: true },
            ],
            updateCampaign,
        } as never);
    });

    it('les indices se rangent par lieu et par témoin, avec leur état', () => {
        render(<DossierDEnquete styles={STYLES} />);
        const affaire = document.querySelector('[data-affaire-par-lieu-et-temoin]') as HTMLElement;
        expect(within(affaire).getByText('Lieu — La ruelle des Ursulines')).toBeTruthy();
        expect(within(affaire).getByText('Témoin — L’ivrogne')).toBeTruthy();
        expect(within(affaire).getAllByText('— caché')).toHaveLength(2);
    });

    it('une hypothèse se note, avec son style ; l’outil ne la valide pas, le meneur peut l’écarter', () => {
        render(<DossierDEnquete styles={STYLES} />);
        fireEvent.change(document.querySelector('[data-nouvelle-hypothese]') as HTMLElement, { target: { value: 'Le meneur de la bande a jeté son arme.' } });
        fireEvent.change(screen.getByLabelText('Style de l’hypothèse'), { target: { value: 'Limier' } });
        fireEvent.click(within(document.querySelector('[data-hypotheses]') as HTMLElement).getByText('Noter'));
        expect(updateCampaign).toHaveBeenCalledWith('c', { hypothesesDEnquete: [expect.objectContaining({ texte: 'Le meneur de la bande a jeté son arme.', style: 'Limier' })] });
        expect(addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hypothèse de l’affaire' }));
    });
});
