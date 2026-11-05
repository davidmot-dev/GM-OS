import { describe, it, expect } from 'vitest';
import {
    adversairesDeLaRencontre, exemplairesDeLaCreature, notesDeLaCreature, varianteDeLaCreature, type ContexteDInvocation,
} from './invocationDeRencontre';
import { avecLeNombre, libelleDeLaLigne, ligneDeLaCreature } from './lignesDeRencontre';
import { rencontreDuPlateau } from './rencontreDuPlateau';
import type { BestiaireDuJeu } from '../../../types/drivers';
import type { Combatant } from '../types';

/**
 * **Les créatures du livre sur le plateau** — § 210, étape D (05/11/2026). Le cas témoin du plan :
 * le Biodrone XX121B de Colonial Marines se pose avec la santé et la Mobilité du livre ; sa Vitesse,
 * qui ne remplit aucun champ, reste lisible dans ses notes.
 */
const BESTIAIRE: BestiaireDuJeu = {
    colonnes: [
        { id: 'vitesse', libelle: 'Vitesse', nature: 'nombre' },
        { id: 'sante', libelle: 'Santé', nature: 'nombre', champ: 'sante' },
        { id: 'mobilite', libelle: 'Mobilité', nature: 'nombre', champ: 'mobilite' },
    ],
    creatures: [
        { id: 'biodrone-xx121b', nom: 'Biodrone XX121B', categorie: 'Xénomorphes aberrants',
            valeurs: { vitesse: 2, sante: 6, mobilite: 8 }, particularites: ['Protection 4 contre le feu'],
            attaques: { table: { univers: 'Alien', table: 'attaques_xenomorphe_rodeur' } },
            source: { livre: 'Colonial Marines Operations Manual', page: 176 } },
        { id: 'goreburster-xx121ab', nom: 'Goreburster XX121AB', valeurs: { vitesse: 3, sante: 6, mobilite: 8 },
            attaques: { lignes: [{ de: '1-2', nom: 'Impact', effet: 'renverse sa cible' }] } },
    ],
};
const biodrone = BESTIAIRE.creatures[0];

describe('les créatures du livre (§ 210, étape D)', () => {
    it('deux Biodrones numérotés, la fiche du livre, l’origine gardée, la Vitesse dans les notes', () => {
        const [a, b] = exemplairesDeLaCreature({ bestiaire: BESTIAIRE, creature: biodrone, nombre: 2, typeDeSante: 'hp' });
        expect([a.name, b.name]).toEqual(['Biodrone XX121B 1', 'Biodrone XX121B 2']);
        expect(a.sheetData).toEqual({ sante: 6, mobilite: 8 });
        expect(a.origineDuLivre).toEqual({ creatureId: 'biodrone-xx121b' });
        expect(a.faction).toBe('enemy');
        expect(a.roleplayingNotes).toBe([
            'Vitesse 2', 'Protection 4 contre le feu', 'Attaques : table Alien / attaques_xenomorphe_rodeur',
            'Colonial Marines Operations Manual, p. 176',
        ].join('\n'));
        expect(notesDeLaCreature(BESTIAIRE, BESTIAIRE.creatures[1])).toBe('Vitesse 3\n1-2 — Impact : renverse sa cible');
    });

    it('« Décliner » copie les valeurs et garde la trace du modèle', () => {
        const v = varianteDeLaCreature('alien', BESTIAIRE, biodrone);
        expect(v).toMatchObject({ jeuId: 'alien', nom: 'Biodrone XX121B (variante)', archetypeId: 'quelconque', sheetData: { sante: 6, mobilite: 8 },
            depuis: { creatureId: 'biodrone-xx121b', nom: 'Biodrone XX121B' } });
        v.sheetData.sante = 9;
        expect(biodrone.valeurs.sante).toBe(6);
    });

    it('une rencontre lit sa ligne « créature » dans le bestiaire du pilote, et dit celle qui manque', () => {
        const ctx: ContexteDInvocation = { champs: [], typeDeSante: 'hp', gabarits: [], entites: [], bestiaire: BESTIAIRE,
            repartitionDe: () => ({ favorises: [], negliges: [] }), graine: 1 };
        const ligne = ligneDeLaCreature(biodrone, 3);
        expect(libelleDeLaLigne(ligne, () => undefined)).toBe('3 × Biodrone XX121B');
        expect(avecLeNombre(ligne, 50)).toMatchObject({ nombre: 20 });
        const { combattants, avertissements } = adversairesDeLaRencontre({ id: 'r', campaignId: 'c', nom: 'Nid', creeeLe: 1, lignes: [
            { ...ligne, faction: 'neutral' },
            { genre: 'creature', creatureId: 'disparue', nombre: 1, nom: 'Néomorphe' },
        ] }, ctx);
        expect(combattants.map(c => [c.name, c.faction])).toEqual([['Biodrone XX121B 1', 'neutral'], ['Biodrone XX121B 2', 'neutral'], ['Biodrone XX121B 3', 'neutral']]);
        expect(avertissements).toEqual(['« Néomorphe » n’est plus au bestiaire du livre de ce jeu : elle n’entre pas.']);
    });

    it('« Garder le plateau comme rencontre » regroupe les exemplaires d’une créature en une ligne', () => {
        const plateau = exemplairesDeLaCreature({ bestiaire: BESTIAIRE, creature: biodrone, nombre: 2, typeDeSante: 'hp' })
            .map((c, i) => ({ ...c, id: `c${i}` }) as Combatant);
        const { lignes } = rencontreDuPlateau(plateau, []);
        expect(lignes).toEqual([{ genre: 'creature', creatureId: 'biodrone-xx121b', nombre: 2, nom: 'Biodrone XX121B', faction: 'enemy' }]);
    });
});
