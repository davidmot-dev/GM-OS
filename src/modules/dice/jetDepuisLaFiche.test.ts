import { describe, it, expect, vi, afterEach } from 'vitest';
import { DiceEngine } from './DiceEngine';
import { resoudreLeJetDeFiche, caracteristiquesDeSauvegarde, type DemandeDeJetDeFiche } from './jetDepuisLaFiche';

/**
 * **Un jet demandé depuis la tablette, résolu chez le meneur.** Le pilote et
 * la fiche sont ceux de Cthulhu Hack de David, relevés dans sa sauvegarde du
 * 2026-09-30 (Dan : Torche D8…).
 */
const PILOTE = {
    dice: { defaultDice: '1d20', engine: 'standard' },
    jet: { sens: 'sous-ou-egal', reserve: { max: 1, faces: 20 }, seuil: [{ sectionId: 'sauvegardes' }] },
    combat: { statsToTrack: [
        { fieldId: 'hp', label: 'PV', isMainHP: true, isResource: false },
        { fieldId: 'torche', label: 'Torche', isMainHP: false, isResource: true },
        { fieldId: 'mentalHealth', label: 'Santé Mentale', isMainHP: false, isResource: true },
    ] },
};
const GABARIT = { sections: [
    { id: 'sauvegardes', fields: [{ id: 'force', label: 'Force' }, { id: 'dexterite', label: 'Dextérité' }] },
    { id: 'ressources', fields: [{ id: 'hp', label: 'PV' }, { id: 'torche', label: 'Torche' }, { id: 'mentalHealth', label: 'Santé Mentale' }] },
] };
const DAN = { name: 'Dan', sheetData: { force: 11, dexterite: 14, hp: 12, torche: 'D8', mentalHealth: 'Épuisée' } };
const demande = (d: Partial<DemandeDeJetDeFiche>): DemandeDeJetDeFiche =>
    ({ playerId: 'j1', characterId: 'p1', genre: 'sauvegarde', champ: 'force', ...d });

const tirer = (...faces: number[]) => {
    const suite = [...faces];
    vi.spyOn(DiceEngine, 'roll').mockImplementation(() => suite.shift()!);
};
afterEach(() => vi.restoreAllMocks());

describe('les caractéristiques de Sauvegarde', () => {
    it('sont les champs des sections du seuil', () => {
        expect(caracteristiquesDeSauvegarde(PILOTE, GABARIT).map(c => c.fieldId)).toEqual(['force', 'dexterite']);
    });

    it('n’existent pas pour un jeu qui ne sauvegarde pas', () => {
        expect(caracteristiquesDeSauvegarde({ dice: { defaultDice: '2d20', engine: '2d20' } }, GABARIT)).toEqual([]);
    });
});

describe('la Sauvegarde demandée par un joueur', () => {
    it('se lance sur la valeur que la fiche du meneur porte', () => {
        tirer(9);
        const jet = resoudreLeJetDeFiche(demande({ champ: 'force' }), DAN, PILOTE, GABARIT)!;
        expect(jet.resultat.totalDisplay).toBe('9 / 11');
        expect(jet.titre).toBe('Dan — Sauvegarde de Force');
    });

    it('à l’avantage, garde le plus bas', () => {
        tirer(16, 3);
        const jet = resoudreLeJetDeFiche(demande({ champ: 'dexterite', modificateur: 'avantage' }), DAN, PILOTE, GABARIT)!;
        expect(jet.resultat.total).toBe(3);
        expect(jet.titre).toBe('Dan — Sauvegarde de Dextérité · avantage');
    });

    it('refuse un champ qui n’est pas une Sauvegarde du jeu', () => {
        expect(resoudreLeJetDeFiche(demande({ champ: 'hp' }), DAN, PILOTE, GABARIT)).toBe(null);
    });
});

describe('la ressource demandée par un joueur', () => {
    it('se lance au dé de la fiche, et dit ce qu’elle devient', () => {
        tirer(2);
        const jet = resoudreLeJetDeFiche(demande({ genre: 'ressource', champ: 'torche' }), DAN, PILOTE, GABARIT)!;
        expect(jet.resultat.usure).toEqual({ avant: 8, apres: 6 });
        expect(jet.ecrire).toEqual({ champ: 'torche', valeur: 'd6' });
        expect(jet.titre).toBe('Dan — Torche d8');
    });

    it('n’écrit rien quand elle tient', () => {
        tirer(5);
        expect(resoudreLeJetDeFiche(demande({ genre: 'ressource', champ: 'torche' }), DAN, PILOTE, GABARIT)!.ecrire).toBeUndefined();
    });

    it('ne se relance pas épuisée', () => {
        expect(resoudreLeJetDeFiche(demande({ genre: 'ressource', champ: 'mentalHealth' }), DAN, PILOTE, GABARIT)).toBe(null);
    });

    it('refuse un champ qui n’est pas une ressource', () => {
        expect(resoudreLeJetDeFiche(demande({ genre: 'ressource', champ: 'force' }), DAN, PILOTE, GABARIT)).toBe(null);
    });
});
