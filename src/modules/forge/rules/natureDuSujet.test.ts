import { describe, it, expect } from 'vitest';
import { natureDuSujet, parleDeCreatures } from './natureDuSujet';

/**
 * **Un bestiaire de supplément titré par ses espèces** — 09/11/2026, David : « lorsque j'essaie de
 * forger le bestiaire du supplément alien ». Les sujets de Building Better Worlds ne disaient pas
 * « créatures » : ils partaient en fiche de règle, sans tableau de profil lisible par le bestiaire.
 */
describe('natureDuSujet', () => {
    it.each([
        'Protomorphes *(Proto-Xenomorphs)*',
        'Abominations de la Frontière *(Abominations)*',
        'Variantes de Xénomorphes XX121 *(Xenomorphs)*',
        'Abomination variante de type E *(Abomination E Type Variant)*',
        "Espèces d'aliens du livre de base (bestiaire)",
        'Bestiaire et adversaires',
    ])('« %s » est un sujet de créatures', (titre) => {
        expect(natureDuSujet(titre)).toBe('creatures');
    });

    it.each([
        "L'asymétrie d'action et d'affrontement des Xénomorphes",
        "Les règles d'affrontement des Xénomorphes",
        'Combat spatial',
    ])('« %s » n’en est pas un : une règle qui nomme une espèce reste une règle', (titre) => {
        expect(natureDuSujet(titre)).not.toBe('creatures');
    });

    it('l’équipement reste l’équipement', () => {
        expect(natureDuSujet('Armes à feu et munitions *(Weapons & Ammunition)*')).toBe('equipement');
    });

    it('l’écran du bestiaire suit la même règle que la Forge', () => {
        expect(parleDeCreatures('rules/protomorphes.md', 'sujet: Protomorphes')).toBe(true);
        expect(parleDeCreatures('rules/regles-affrontement-xenomorphes.md', "sujet: Les règles d'affrontement des Xénomorphes")).toBe(false);
    });
});
