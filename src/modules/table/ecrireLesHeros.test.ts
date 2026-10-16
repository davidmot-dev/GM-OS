import { describe, it, expect, vi } from 'vitest';
import { ecrireLesHeros } from './ecrireLesHeros';
import type { HealthSystem } from '../../types/entity.types';

/**
 * **Les Blessures passent par les cases** — NOC, 2026-10-16. Le champ de la
 * fiche n'est qu'un reflet des dix cases : un moment de calme qui le baisse
 * doit décocher une case, sinon le coup suivant le remonte.
 */
const cases = (cochees: number): HealthSystem => ({
    type: 'boxes', state: 'wounded', badges: [],
    data: { champ: 'blessures', boxes: Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}`, filled: i < cochees })), seuils: [{ aPartirDe: 5, label: 'Choqué', etat: 'wounded' }] },
});

describe('écrire un geste sur les fiches', () => {
    it('un champ porté par les cases de santé les fait bouger d’autant', () => {
        const updateCharacter = vi.fn(), updateCharacterHealth = vi.fn();
        const n = ecrireLesHeros(
            [{ joueurId: 'j', herosId: 'h', nom: 'Ilse', maj: { blessures: 5, espoir: 3 }, lignes: [] }],
            { players: [{ id: 'j', characters: [{ id: 'h', sheetData: { blessures: 6, espoir: 1 }, healthSystem: cases(6) }] }], updateCharacter, updateCharacterHealth },
        );
        expect(n).toBe(1);
        expect(updateCharacter).toHaveBeenCalledWith('j', 'h', { sheetData: { blessures: 5, espoir: 3 } });
        const sante = updateCharacterHealth.mock.calls[0][2] as HealthSystem;
        expect((sante.data.boxes as { filled: boolean }[]).filter(b => b.filled)).toHaveLength(5);
        expect(sante.state).toBe('wounded');
    });

    it('les autres champs ne touchent pas à la santé, et une fiche introuvable est passée', () => {
        const updateCharacter = vi.fn(), updateCharacterHealth = vi.fn();
        const n = ecrireLesHeros(
            [
                { joueurId: 'j', herosId: 'h', nom: 'Ilse', maj: { trauma: 2 }, lignes: [] },
                { joueurId: 'j', herosId: 'absent', nom: 'X', maj: { trauma: 1 }, lignes: [] },
                { joueurId: 'j', herosId: 'h', nom: 'Ilse', maj: {}, lignes: [] },
            ],
            { players: [{ id: 'j', characters: [{ id: 'h', sheetData: { trauma: 3 }, healthSystem: cases(2) }] }], updateCharacter, updateCharacterHealth },
        );
        expect(n).toBe(1);
        expect(updateCharacterHealth).not.toHaveBeenCalled();
    });
});
