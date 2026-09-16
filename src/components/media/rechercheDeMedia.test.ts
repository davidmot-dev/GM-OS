import { describe, it, expect } from 'vitest';
import {
    correspondALaRecherche,
    motsDeLaRecherche,
    normaliserPourLaRecherche,
} from './rechercheDeMedia';

/**
 * **Les deux cas qui faisaient dire à David qu'il « avait du mal à trouver ».**
 *
 * L'ancienne recherche n'était pas absente : elle était littérale. Un accent
 * ou un mot dans le désordre, et la médiathèque répondait « rien » — *ce qui ne
 * se lit pas comme une recherche stricte, mais comme un fichier perdu.*
 */

const media = (name: string, tags: string[] = [], type = 'audio') => ({ name, tags, type });

describe('normaliserPourLaRecherche', () => {
    it('retire les accents et la casse', () => {
        expect(normaliserPourLaRecherche('Sirène')).toBe('sirene');
        expect(normaliserPourLaRecherche('ÉPÉE')).toBe('epee');
        expect(normaliserPourLaRecherche('  Forêt  ')).toBe('foret');
    });

    it('laisse intact ce qui n\'a pas d\'accent', () => {
        expect(normaliserPourLaRecherche('combat')).toBe('combat');
    });
});

describe('motsDeLaRecherche', () => {
    it('découpe sur les espaces', () => {
        expect(motsDeLaRecherche('taverne combat')).toEqual(['taverne', 'combat']);
    });

    /** *Un champ vide n'est pas un filtre qui ne trouve rien, c'est l'absence de filtre.* */
    it('ne rend aucun mot pour une recherche vide ou blanche', () => {
        expect(motsDeLaRecherche('')).toEqual([]);
        expect(motsDeLaRecherche('    ')).toEqual([]);
    });

    it('absorbe les espaces multiples', () => {
        expect(motsDeLaRecherche('taverne   combat ')).toEqual(['taverne', 'combat']);
    });
});

describe('correspondALaRecherche', () => {
    it('montre tout quand la recherche est vide', () => {
        expect(correspondALaRecherche(media('quoi que ce soit'), '')).toBe(true);
    });

    /** ⛔ Le premier cas de David : l'accent. */
    it('trouve « sirène » en tapant « sirene »', () => {
        expect(correspondALaRecherche(media('Sirènes lointaines.mp3'), 'sirene')).toBe(true);
    });

    it('trouve aussi dans l\'autre sens — accent tapé, fichier sans accent', () => {
        expect(correspondALaRecherche(media('sirenes.mp3'), 'sirènes')).toBe(true);
    });

    /** ⛔ Le second cas : l'ordre des mots. */
    it('trouve « combat à la taverne » en tapant « taverne combat »', () => {
        expect(correspondALaRecherche(media('Combat à la taverne.mp3'), 'taverne combat')).toBe(true);
    });

    it('exige TOUS les mots — sinon la recherche s\'élargit au lieu de réduire', () => {
        expect(correspondALaRecherche(media('Combat à la taverne.mp3'), 'taverne donjon')).toBe(false);
    });

    it('cherche aussi dans les étiquettes et dans le type', () => {
        expect(correspondALaRecherche(media('piste-07.mp3', ['ambiance', 'pluie']), 'pluie')).toBe(true);
        expect(correspondALaRecherche(media('piste-07.mp3', [], 'audio'), 'audio')).toBe(true);
    });

    /** Un mot peut venir du nom et l'autre d'une étiquette : on cherche le média, pas un champ. */
    it('accepte des mots venus de champs différents', () => {
        expect(correspondALaRecherche(media('Taverne.mp3', ['combat']), 'taverne combat')).toBe(true);
    });

    it('ignore la casse de part et d\'autre', () => {
        expect(correspondALaRecherche(media('TAVERNE.MP3'), 'taverne')).toBe(true);
    });

    it('refuse ce qui ne correspond nulle part', () => {
        expect(correspondALaRecherche(media('Taverne.mp3', ['ambiance']), 'dragon')).toBe(false);
    });
});
