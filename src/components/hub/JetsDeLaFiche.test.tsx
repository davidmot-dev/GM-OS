import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { JetsDeLaFiche } from './JetsDeLaFiche';
import type { GameDriver } from '../../types/drivers';

/**
 * **La tablette demande, le meneur lance** — Cthulhu Hack, 2026-09-30. Le
 * panneau ne lance rien : il émet `fiche:jet`, que `useHubSync` achemine.
 */
const PILOTE = {
    dice: { defaultDice: '1d20', logic: 'count-success', engine: 'standard' },
    jet: { sens: 'sous-ou-egal', reserve: { base: 1, max: 1, faces: 20 }, seuil: [{ id: 's', label: 'Sauvegarde', sectionId: 'sauvegardes' }] },
    combat: { statsToTrack: [
        { fieldId: 'torche', label: 'Torche', isMainHP: false, isResource: true },
        { fieldId: 'mentalHealth', label: 'Santé Mentale', isMainHP: false, isResource: true },
    ] },
} as unknown as GameDriver;
const GABARIT = { sections: [
    { id: 'sauvegardes', fields: [{ id: 'force', label: 'Force' }, { id: 'sagesse', label: 'Sagesse' }] },
] };

const demandes: unknown[] = [];
const ecouter = (e: Event) => demandes.push((e as CustomEvent).detail);
window.addEventListener('fiche:jet', ecouter);

const afficher = (fiche: Record<string, unknown>) => render(
    <JetsDeLaFiche playerId="j1" characterId="p1" sheetData={fiche} pilote={PILOTE} gabarit={GABARIT} />,
);

afterEach(() => { cleanup(); demandes.length = 0; });

describe('lancer depuis sa fiche, sur sa tablette', () => {
    it('demande la Sauvegarde touchée, avec l’avantage choisi', () => {
        afficher({ force: 11, sagesse: 13, torche: 'D8' });
        fireEvent.click(screen.getByText('Avantage'));
        fireEvent.click(screen.getByText('Force'));
        expect(demandes).toEqual([{ playerId: 'j1', characterId: 'p1', genre: 'sauvegarde', champ: 'force', modificateur: 'avantage' }]);
    });

    it('demande la ressource touchée, sans rien lancer lui-même', () => {
        afficher({ force: 11, torche: 'D8', mentalHealth: 'd6' });
        fireEvent.click(screen.getByText('Torche'));
        expect(demandes).toEqual([{ playerId: 'j1', characterId: 'p1', genre: 'ressource', champ: 'torche' }]);
        expect(screen.getByRole('status').textContent).toContain('lancé par le meneur');
    });

    it('ne laisse pas toucher une ressource épuisée', () => {
        afficher({ force: 11, torche: 'Épuisée' });
        const bouton = screen.getByText('Torche').closest('button')!;
        expect(bouton.hasAttribute('disabled')).toBe(true);
        fireEvent.click(bouton);
        expect(demandes).toEqual([]);
    });

    it('ne s’affiche pas pour un jeu sans Sauvegarde ni ressource', () => {
        const { container } = render(
            <JetsDeLaFiche playerId="j1" characterId="p1" sheetData={{ force: 11 }} pilote={{ dice: { defaultDice: '2d20', engine: '2d20' } } as unknown as GameDriver} gabarit={GABARIT} />,
        );
        expect(container.innerHTML).toBe('');
    });
});

describe('la Sauvegarde que le meneur a demandée (T8, 11/11)', () => {
    const DEMANDE = { genre: 'sauvegarde' as const, id: 'd-1', characterId: 'p1', emiseLe: 1, titre: 'Sauvegarde de Sagesse · avantage', champ: 'sagesse', modificateur: 'avantage' as const };

    it('se signale, part de l’avantage demandé, et porte la demande avec le jet', () => {
        render(<JetsDeLaFiche playerId="j1" characterId="p1" sheetData={{ force: 11, sagesse: 13 }} pilote={PILOTE} gabarit={GABARIT} demande={DEMANDE} />);
        expect(screen.getByText('Sagesse').closest('button')!.hasAttribute('data-demandee')).toBe(true);
        expect(screen.getByText('Avantage').closest('button')!.getAttribute('aria-pressed')).toBe('true');
        fireEvent.click(screen.getByText('Sagesse'));
        expect(demandes).toEqual([{ playerId: 'j1', characterId: 'p1', genre: 'sauvegarde', champ: 'sagesse', modificateur: 'avantage', demandeId: 'd-1' }]);
    });

    it('une autre Sauvegarde que celle demandée part sans la demande', () => {
        render(<JetsDeLaFiche playerId="j1" characterId="p1" sheetData={{ force: 11, sagesse: 13 }} pilote={PILOTE} gabarit={GABARIT} demande={DEMANDE} />);
        fireEvent.click(screen.getByText('Force'));
        expect(demandes).toEqual([{ playerId: 'j1', characterId: 'p1', genre: 'sauvegarde', champ: 'force', modificateur: 'avantage' }]);
    });
});
