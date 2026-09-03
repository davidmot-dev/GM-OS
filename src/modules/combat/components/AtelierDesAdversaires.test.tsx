import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AtelierDesAdversaires } from './AtelierDesAdversaires';
import { useBestiaireStore } from '../useBestiaireStore';

/**
 * **L'atelier, monté pour de vrai.**
 *
 * *Onglet demandé par David le 2026-09-03 : « où se trouve le bestiaire ? »* —
 * il n'avait pas d'écran, seulement une rangée de puces qui **disparaissait
 * quand elle était vide**.
 *
 * Ce test ne juge pas l'esthétique : il monte le composant et vérifie qu'il
 * tient debout, que les deux onglets montrent bien deux choses différentes, et
 * que le bestiaire vide **dit ce qu'il faut faire** au lieu de se cacher. *Une
 * section masquée quand elle est vide se lit « cette fonctionnalité n'existe
 * pas ».*
 */

const PILOTE = {
    id: 'alien', name: 'Alien', templateId: 'gabarit-alien',
    combat: { defaultHealthType: 'hp', statsToTrack: [] },
};

const GABARIT = {
    id: 'gabarit-alien', name: 'Alien', emoji: '👽',
    sections: [{
        id: 'attributs', label: 'Attributs', fields: [
            { id: 'force', label: 'Force', type: 'number', defaultValue: 3, max: 5 },
            { id: 'agilite', label: 'Agilité', type: 'number', defaultValue: 3, max: 5 },
        ],
    }],
};

vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: Object.assign(
        () => ({
            getActiveDriver: () => PILOTE,
            customSheetTemplates: [GABARIT],
            addEntity: vi.fn(),
            activeCampaignId: 'c-1',
        }),
        { getState: () => ({ getActiveDriver: () => PILOTE }) },
    ),
}));

vi.mock('../useCombatStore', () => ({
    useCombatStore: (selecteur: (etat: unknown) => unknown) => selecteur({ addCombatant: vi.fn() }),
}));

vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));

describe('AtelierDesAdversaires', () => {
    beforeEach(() => {
        useBestiaireStore.setState({ gabarits: [], repartitions: {} });
    });

    it('se monte et propose les archétypes', () => {
        render(<AtelierDesAdversaires onClose={() => {}} />);
        expect(screen.getByText('Brute')).toBeTruthy();
        expect(screen.getByText('Tireur')).toBeTruthy();
    });

    it('⭐ montre les champs du jeu, et pas des champs inventés', () => {
        /* Les échelles viennent du gabarit de fiche : Force et Agilité, pas autre chose. */
        render(<AtelierDesAdversaires onClose={() => {}} />);
        expect(screen.getAllByText('Force').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Agilité').length).toBeGreaterThan(0);
    });

    it('⭐ un bestiaire vide DIT quoi faire, au lieu de se cacher', () => {
        render(<AtelierDesAdversaires onClose={() => {}} />);
        fireEvent.click(screen.getByText('Bestiaire'));
        expect(screen.getByText(/Aucun gabarit pour Alien/)).toBeTruthy();
    });

    it('liste les gabarits du jeu, avec leur archétype et leur rang', () => {
        useBestiaireStore.getState().enregistrer({
            jeuId: 'alien', nom: 'Ouvrier', archetypeId: 'brute', rangId: 'elite',
            sheetData: { force: 5 },
        });

        render(<AtelierDesAdversaires onClose={() => {}} />);
        fireEvent.click(screen.getByText('Bestiaire'));

        expect(screen.getByText('Ouvrier')).toBeTruthy();
        expect(screen.getByText(/Brute · Élite/)).toBeTruthy();
    });

    it('⚠️ n’affiche pas le bestiaire d’un autre jeu', () => {
        /* Un pillard de Blade Runner est dans une autre échelle : il serait injouable. */
        useBestiaireStore.getState().enregistrer({
            jeuId: 'blade-runner', nom: 'Pillard', archetypeId: 'brute', rangId: 'pietaille',
            sheetData: {},
        });

        render(<AtelierDesAdversaires onClose={() => {}} />);
        fireEvent.click(screen.getByText('Bestiaire'));

        expect(screen.queryByText('Pillard')).toBeNull();
        expect(screen.getByText(/Aucun gabarit pour Alien/)).toBeTruthy();
    });
});
