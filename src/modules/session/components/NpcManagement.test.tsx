import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NpcManagement from './NpcManagement';
import { useSessionOSStore } from '../useSessionOSStore';

/**
 * Ce que ces tests protègent : **un identifiant qui ne résout rien n'est pas une
 * sélection**.
 *
 * Relevé par David le 2026-08-17 : la section « Acteurs & Figurants » de
 * l'éditeur de campagne restait vide, avec pour seul contenu le message que
 * `NpcDetail` affiche quand il ne TROUVE PAS l'entité demandée. L'état initial
 * du store porte `selectedEntityId: 'e-1'`, le PNJ de démonstration ; sur une
 * campagne réelle il n'existe pas, mais l'identifiant n'était pas nul — on
 * rendait donc le détail, et la galerie devenait inatteignable.
 *
 * Ça ne se voyait pas depuis le Cockpit, dont la navigation efface la sélection
 * au passage. *Une réparation posée sur un seul chemin ne protège que ce chemin.*
 */
vi.mock('./NpcGallery', () => ({ default: () => <div>GALERIE</div> }));
vi.mock('./NpcDetail', () => ({ default: () => <div>DÉTAIL</div> }));
vi.mock('./AddEntityForm', () => ({ default: () => <div>AJOUT</div> }));
vi.mock('../useSessionOSStore', () => ({ useSessionOSStore: vi.fn() }));

const etat = (partiel: Record<string, unknown>) =>
    (useSessionOSStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        selectedEntityId: null, isAddingEntity: false, entities: [], activeCampaignId: 'c1',
        ...partiel,
    });

const varick = { id: 'e-1', name: 'Baron Varick', campaignId: 'c1' };

describe('la galerie reste atteignable', () => {
    beforeEach(() => vi.clearAllMocks());

    it('un identifiant fantôme rend la GALERIE, pas un détail vide', () => {
        // Le défaut exact : « e-1 » sélectionné, aucune entité de ce nom.
        etat({ selectedEntityId: 'e-1', entities: [] });
        render(<NpcManagement />);
        expect(screen.getByText('GALERIE')).toBeTruthy();
    });

    it('un PNJ d\'une AUTRE campagne ne s\'affiche pas ici', () => {
        // Faux sans être vide : l'écran promet la campagne active.
        etat({ selectedEntityId: 'e-1', entities: [{ ...varick, campaignId: 'c2' }] });
        render(<NpcManagement />);
        expect(screen.getByText('GALERIE')).toBeTruthy();
    });

    it('une sélection qui résout vraiment rend le détail', () => {
        etat({ selectedEntityId: 'e-1', entities: [varick] });
        render(<NpcManagement />);
        expect(screen.getByText('DÉTAIL')).toBeTruthy();
    });

    it('sans sélection, la galerie', () => {
        etat({ entities: [varick] });
        render(<NpcManagement />);
        expect(screen.getByText('GALERIE')).toBeTruthy();
    });

    it('l\'ajout l\'emporte sur tout le reste', () => {
        etat({ isAddingEntity: true, selectedEntityId: 'e-1', entities: [varick] });
        render(<NpcManagement />);
        expect(screen.getByText('AJOUT')).toBeTruthy();
    });
});
