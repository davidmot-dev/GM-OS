import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AtelierDesAdversaires } from './AtelierDesAdversaires';
import { useBestiaireStore } from '../useBestiaireStore';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import type { GameDriver } from '../../../types/drivers';

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

const sessionSimulee: {
    pilote: typeof PILOTE;
    customGameDrivers: GameDriver[];
    customSheetTemplates: typeof GABARIT[];
} = { pilote: PILOTE, customGameDrivers: [], customSheetTemplates: [GABARIT] };

const lireSessionSimulee = () => ({
    getActiveDriver: () => sessionSimulee.pilote,
    customGameDrivers: sessionSimulee.customGameDrivers,
    customSheetTemplates: sessionSimulee.customSheetTemplates,
    addEntity: vi.fn(),
    activeCampaignId: 'c-1',
});

vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: Object.assign(
        (selecteur?: (etat: ReturnType<typeof lireSessionSimulee>) => unknown) => {
            const etat = lireSessionSimulee();
            return selecteur ? selecteur(etat) : etat;
        },
        { getState: () => lireSessionSimulee() },
    ),
}));

vi.mock('../useCombatStore', () => ({
    useCombatStore: (selecteur: (etat: unknown) => unknown) => selecteur({ addCombatant: vi.fn() }),
}));

vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));

describe('AtelierDesAdversaires', () => {
    beforeEach(() => {
        sessionSimulee.pilote = PILOTE;
        sessionSimulee.customGameDrivers = [];
        sessionSimulee.customSheetTemplates = [GABARIT];
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

    it('relit les champs quand le gabarit est remplacé avec le même identifiant', () => {
        const { rerender } = render(<AtelierDesAdversaires onClose={() => {}} />);
        sessionSimulee.customSheetTemplates = [{
            ...GABARIT,
            sections: GABARIT.sections.map(section => ({
                ...section,
                fields: section.fields.map(champ => champ.id === 'force' ? { ...champ, label: 'Vigueur' } : champ),
            })),
        }];

        rerender(<AtelierDesAdversaires onClose={() => {}} />);

        expect(screen.queryByText('Force')).toBeNull();
        expect(screen.getAllByText('Vigueur').length).toBeGreaterThan(0);
    });

    it('relit la fiche quand le pilote actif change de gabarit', () => {
        const { rerender } = render(<AtelierDesAdversaires onClose={() => {}} />);
        sessionSimulee.pilote = { ...PILOTE, templateId: 'gabarit-revise' };
        sessionSimulee.customSheetTemplates = [...sessionSimulee.customSheetTemplates, {
            ...GABARIT, id: 'gabarit-revise',
            sections: [{ ...GABARIT.sections[0], fields: [{ ...GABARIT.sections[0].fields[0], id: 'intuition', label: 'Intuition' }] }],
        }];

        rerender(<AtelierDesAdversaires onClose={() => {}} />);

        expect(screen.queryByText('Force')).toBeNull();
        expect(screen.getAllByText('Intuition').length).toBeGreaterThan(0);
    });

    it('le pilote personnalisé demandé prend le pas sur le pilote de la campagne', () => {
        sessionSimulee.customGameDrivers = [{
            ...DEFAULT_GAME_DRIVERS[0], id: 'jeu-demande', name: 'Jeu demandé', templateId: GABARIT.id,
        }];
        render(<AtelierDesAdversaires onClose={() => {}} jeuDemande="jeu-demande" />);

        expect(screen.getByText('Jeu demandé')).toBeTruthy();
        expect(screen.getAllByText('Force').length).toBeGreaterThan(0);
    });

    it('résout aussi un pilote de référence demandé, puis revient au pilote actif', () => {
        const reference = DEFAULT_GAME_DRIVERS[0];
        const { rerender } = render(<AtelierDesAdversaires onClose={() => {}} jeuDemande={reference.id} />);
        expect(screen.getByText(reference.name)).toBeTruthy();

        rerender(<AtelierDesAdversaires onClose={() => {}} />);

        expect(screen.getByText(PILOTE.name)).toBeTruthy();
        expect(screen.getAllByText('Force').length).toBeGreaterThan(0);
    });

    it('un jeu demandé introuvable garde le repli sur le pilote actif', () => {
        render(<AtelierDesAdversaires onClose={() => {}} jeuDemande="jeu-introuvable" />);

        expect(screen.getByText(PILOTE.name)).toBeTruthy();
        expect(screen.getAllByText('Force').length).toBeGreaterThan(0);
    });
});
