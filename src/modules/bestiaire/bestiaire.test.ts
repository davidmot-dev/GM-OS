import { describe, expect, it } from 'vitest';
import { bestiaireVide, controlerLeBestiaire, ficheDePlateau, identifiantDeCreature, rangerParCategorie } from './bestiaire';
import { controlerLePilote } from '../forge/rules/controlesDuPilote';
import type { BestiaireDuJeu, GameDriver } from '../../types/drivers';
import type { SheetTemplate } from '../../data/defaultSheetTemplates';

/**
 * **Le bestiaire du pilote** — § 210, étape A (05/11/2026). Cas témoin du plan : le Biodrone
 * XX121B de Colonial Marines (fiche relue le 02/11) — Vitesse 2, Santé 6, Mobilité 8, Observation 10,
 * Protection 8 (4 contre le feu), acide 8 — doit se poser avec 6 de santé et une Protection de 8.
 */
const BESTIAIRE: BestiaireDuJeu = {
    colonnes: [
        { id: 'vitesse', libelle: 'Vitesse', nature: 'nombre' },
        { id: 'sante', libelle: 'Santé', nature: 'nombre', champ: 'sante' },
        { id: 'mobilite', libelle: 'Mobilité', nature: 'nombre', champ: 'mobilite' },
        { id: 'observation', libelle: 'Observation', nature: 'nombre', champ: 'observation' },
        { id: 'protection', libelle: 'Protection', nature: 'nombre', champ: 'protection' },
        { id: 'acide', libelle: 'Éclaboussure d’acide', nature: 'nombre' },
    ],
    creatures: [{
        id: 'biodrone-xx121b', nom: 'Biodrone XX121B', nomOriginal: 'Biodrone Xenomorph XX121B', categorie: 'Xénomorphes aberrants',
        etiquettes: ['XX121'], valeurs: { vitesse: 2, sante: 6, mobilite: 8, observation: 10, protection: '8', acide: 8 },
        particularites: ['Protection 4 contre le feu', 'Meurt après six jours'],
        attaques: { table: { univers: 'Alien', table: 'attaques_xenomorphe_rodeur' } },
        source: { livre: 'Colonial Marines Operations Manual', page: 178, fiche: 'systems/alien/supplements/colonial-marines/rules/nouvelles-variantes-de-xenomorphes-et-anathemes.md' },
    }],
};
const CHAMPS = new Set(['sante', 'mobilite', 'observation', 'protection']);

describe('le bestiaire du pilote (§ 210, étape A)', () => {
    it('le Biodrone XX121B se pose avec 6 de santé et une Protection de 8 ; la Vitesse reste au bestiaire', () => {
        expect(controlerLeBestiaire(BESTIAIRE, CHAMPS)).toEqual([]);
        expect(ficheDePlateau(BESTIAIRE, BESTIAIRE.creatures[0])).toEqual({ sante: 6, mobilite: 8, observation: 10, protection: 8 });
    });

    it('le contrôle dit ce qui casserait un geste, et avertit de ce qu’une mécanique ne comptera pas', () => {
        const faux: BestiaireDuJeu = {
            colonnes: [
                { id: 'sante', libelle: 'Santé', nature: 'nombre', champ: 'sante' },
                { id: 'sante', libelle: 'Doublon', nature: 'nombre' },
                { id: 'force', libelle: 'Force', nature: 'nombre', champ: 'force_absente' },
                { id: 'pv', libelle: 'PV', nature: 'nombre', champ: 'sante' },
            ],
            creatures: [
                { id: 'a', nom: 'Goreburster', valeurs: { sante: '6 (3 au feu)', inconnue: 1 }, attaques: { table: { univers: 'Alien', table: '' }, lignes: [{ de: '', nom: 'Impact', effet: '' }] }, source: { livre: 'CM', page: 0 } },
                { id: 'a', nom: '', valeurs: {} },
            ],
        };
        const r = controlerLeBestiaire(faux, CHAMPS);
        const ou = (cle: string, gravite = 'erreur') => r.some(c => c.ou === cle && c.gravite === gravite);
        expect(ou('bestiaire.colonnes[1].id')).toBe(true);
        expect(ou('bestiaire.colonnes[2].champ')).toBe(true);
        expect(ou('bestiaire.colonnes[3].champ', 'avertissement')).toBe(true);
        expect(ou('bestiaire.creatures[0].valeurs.sante', 'avertissement')).toBe(true);
        expect(ou('bestiaire.creatures[0].valeurs.inconnue')).toBe(true);
        expect(ou('bestiaire.creatures[0].attaques.table')).toBe(true);
        expect(ou('bestiaire.creatures[0].attaques.lignes[0]')).toBe(true);
        expect(ou('bestiaire.creatures[0].source.page')).toBe(true);
        expect(ou('bestiaire.creatures[1].id')).toBe(true);
        expect(ou('bestiaire.creatures[1].nom')).toBe(true);
    });

    it('la Forge le contrôle avec les champs de la fiche du pilote', () => {
        const fiche = { id: 't', sections: [{ id: 's', fields: [{ id: 'sante', type: 'number' }] }] } as unknown as SheetTemplate;
        const r = controlerLePilote({ dice: {}, combat: { statsToTrack: [] }, bestiaire: BESTIAIRE } as unknown as GameDriver, fiche);
        expect(r.some(c => c.ou === 'bestiaire.colonnes[2].champ' && c.gravite === 'erreur')).toBe(true);
        expect(r.some(c => c.ou === 'bestiaire.colonnes[1].champ')).toBe(false);
        expect(controlerLePilote({ dice: {}, combat: { statsToTrack: [] } } as unknown as GameDriver, fiche).some(c => c.ou.startsWith('bestiaire'))).toBe(false);
    });

    it('identifiants uniques, rangement par catégorie, bestiaire vide', () => {
        expect(identifiantDeCreature('Biodrone XX121B', ['biodrone-xx121b'])).toBe('biodrone-xx121b-2');
        expect(identifiantDeCreature('', [])).toBe('creature');
        const r = rangerParCategorie([
            { id: '1', nom: 'Sans', valeurs: {} },
            { id: '2', nom: 'Biodrone', categorie: 'Xénomorphes aberrants', valeurs: {} },
            { id: '3', nom: 'Anathème affecté', categorie: 'Anathèmes', valeurs: {} },
            { id: '4', nom: 'Goreburster', categorie: 'Xénomorphes aberrants', valeurs: {} },
        ]);
        expect(r.map(g => [g.categorie, g.creatures.map(c => c.id)])).toEqual([
            ['Xénomorphes aberrants', ['2', '4']], ['Anathèmes', ['3']], ['Sans catégorie', ['1']],
        ]);
        expect(controlerLeBestiaire(bestiaireVide())).toEqual([]);
    });

    it('une valeur en lettres dans une colonne de nombres passe à la fiche telle quelle', () => {
        const b: BestiaireDuJeu = { colonnes: [{ id: 'sante', libelle: 'Santé', nature: 'nombre', champ: 'sante' }, { id: 'notes', libelle: 'Notes', nature: 'texte', champ: 'notes' }], creatures: [] };
        expect(ficheDePlateau(b, { id: 'x', nom: 'X', valeurs: { sante: '1D6', notes: 12 } })).toEqual({ sante: '1D6', notes: '12' });
    });
});
