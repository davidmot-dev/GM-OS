import { describe, expect, it } from 'vitest';
import { ficheAlienDeLaCreature, profilXenomorphe, proposerLeRole, rolesDuPilote, ROLES_ALIEN } from './rolesDuBestiaire';
import { remplirLeBestiaire } from './depuisLeCorpus';
import { controlerLeBestiaire } from './bestiaire';
import { entreesDesLignes } from '../dice/systemes/xenomorphesAlien';
import { CLE_COMBAT_ALIEN, lireLeCombatAlien, type RegleDeCombatAlien } from '../dice/systemes/combatAlien';
import { exemplairesDeLaCreature } from '../combat/logic/invocationDeRencontre';
import type { GameDriver } from '../../types/drivers';
// `node:fs` n'existe pas dans le projet d'essais `renderer` : la fiche se lit par Vite.
import CONTENU from '../../../docs/systems/alien/supplements/colonial-marines/rules/nouvelles-variantes-de-xenomorphes-et-anathemes.md?raw';

/**
 * **Le propre d'Alien : le profil xénomorphe** — § 210, étape E (05/11/2026). Les créatures de
 * Colonial Marines (fiche relue, p. 176-181), lues avec les rôles proposés, entrent au combat
 * déclarées xénomorphes : Vitesse, santé maximale, Protection, acide, compétences, attaques.
 */
const REGLE = { actions: true, sante: 'sante', force: 'force', protection: 'protection' } as unknown as RegleDeCombatAlien;
const FICHE = { chemin: 'cm.md', contenu: CONTENU, livre: 'Colonial Marines Operations Manual' };
const { bestiaire, journal } = remplirLeBestiaire(undefined, [FICHE], ROLES_ALIEN);
const parNom = (nom: string) => bestiaire.creatures.find(c => c.nom === nom)!;

describe('les rôles des colonnes (Alien)', () => {
    it('Alien seul en propose ; ils se proposent d’après le libellé, jamais sur du texte', () => {
        expect(rolesDuPilote({ combat: { alien: REGLE } } as unknown as GameDriver)).toBe(ROLES_ALIEN);
        expect(rolesDuPilote({ combat: {} } as unknown as GameDriver)).toEqual([]);
        expect(proposerLeRole('Éclaboussure d’acide', 'nombre', ROLES_ALIEN)).toBe('acide');
        expect(proposerLeRole('Santé', 'nombre', ROLES_ALIEN)).toBe('sante');
        expect(proposerLeRole('Observation', 'nombre', ROLES_ALIEN)).toBe('competence');
        expect(proposerLeRole('Notes', 'texte', ROLES_ALIEN)).toBeUndefined();
        expect(proposerLeRole('Vitesse', 'nombre', [])).toBeUndefined();
    });

    it('le remplissage propose un rôle à chaque colonne de la fiche relue', () => {
        expect(journal.colonnesAjoutees.map(c => [c.libelle, c.role])).toEqual([
            ['Vitesse', 'vitesse'], ['Santé', 'sante'], ['Mobilité', 'competence'],
            ['Observation', 'competence'], ['Protection', 'protection'], ['Éclaboussure d\'acide', 'acide'],
        ]);
        expect(controlerLeBestiaire(bestiaire)).toEqual([]);
    });

    it('deux colonnes sur la Vitesse, ou un rôle sur du texte : le contrôle avertit', () => {
        const double = { ...bestiaire, colonnes: [...bestiaire.colonnes, { id: 'v2', libelle: 'Allure', nature: 'texte' as const, role: 'vitesse' }] };
        const r = controlerLeBestiaire(double);
        expect(r.filter(c => c.ou === `bestiaire.colonnes[${double.colonnes.length - 1}].role`).map(c => c.gravite)).toEqual(['avertissement', 'avertissement']);
    });
});

describe('le profil xénomorphe (p. 176-181)', () => {
    it('le Biodrone : Vitesse 2, santé 6, Protection 8, acide 8, XX121, Mobilité et Observation', () => {
        const relie = { ...bestiaire, creatures: bestiaire.creatures.map(c => (c.nom === 'Biodrone XX121B'
            ? { ...c, etiquettes: ['XX121'], attaques: { table: { univers: 'Alien', table: 'attaques_xenomorphe_rodeur' } } } : c)) };
        expect(profilXenomorphe(relie, relie.creatures[0])).toMatchObject({
            vitesse: 2, maximum: 6, protection: 8, acide: 8, xx121: true, etat: 'actif',
            competences: { mobilité: 8, observation: 10 }, table: 'attaques_xenomorphe_rodeur',
        });
    });

    it('le Goreburster tire ses propres attaques ; l’Anathème n’a pas d’acide et n’est pas XX121', () => {
        const g = profilXenomorphe(bestiaire, parNom('Goreburster XX121AB'))!;
        expect(g.lignes?.map(l => l.de)).toEqual(['1-2', '3', '4', '5', '6']);
        expect(entreesDesLignes(g.lignes!).map(e => [e.min, e.max, e.title])).toEqual([
            [1, 2, 'Impact'], [3, 3, 'Horrible sifflement'], [4, 4, 'Attaque à la tête'], [5, 5, 'Suffocation'], [6, 6, 'Éviscération'],
        ]);
        const a = profilXenomorphe(bestiaire, parNom('Anathème monstrueux'))!;
        expect(a).toMatchObject({ vitesse: 2, maximum: 8, protection: 3, acide: 0, xx121: false });
    });

    it('sans rôle déclaré, pas de profil : le meneur garde « Déclarer cette créature xénomorphe »', () => {
        const sansRole = { ...bestiaire, colonnes: bestiaire.colonnes.map(({ role: _r, ...c }) => c) };
        expect(profilXenomorphe(sansRole, sansRole.creatures[0])).toBeNull();
        expect(ficheAlienDeLaCreature(REGLE, sansRole, sansRole.creatures[0])).toEqual({});
    });

    it('posé au combat, le Biodrone arrive déclaré xénomorphe, santé à son maximum', () => {
        const [b] = exemplairesDeLaCreature({ bestiaire, creature: parNom('Biodrone XX121B'), nombre: 1, typeDeSante: 'hp', alien: REGLE });
        expect(b.sheetData?.sante).toBe(6);
        expect(lireLeCombatAlien(b.sheetData ?? {}).xenomorphe).toMatchObject({ vitesse: 2, maximum: 6, protection: 8, acide: 8 });
        // Sans les actions d'Alien, pas de profil : la règle du panneau le demande.
        const [sans] = exemplairesDeLaCreature({ bestiaire, creature: parNom('Biodrone XX121B'), nombre: 1, typeDeSante: 'hp', alien: { ...REGLE, actions: false } });
        expect(sans.sheetData).not.toHaveProperty(CLE_COMBAT_ALIEN);
    });
});
