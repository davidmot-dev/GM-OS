import { describe, expect, it } from 'vitest';
import { ALIAS_DU_VOYAGEUR, CLE_ORIGINAUX,
    lireFicheDeVoyageur, reprendreFicheDeVoyageur } from './ficheDeVoyageur';

import { fiche } from './ficheDeVoyageur.fixtures';

describe('la consolidation du Voyageur 2.3.1', () => {
    it('recalcule au bon arrondi, conserve les ressources actuelles et sépare les deux Chances', () => {
        const r = reprendreFicheDeVoyageur(fiche, {points_de_chance: 3});
        expect(r).toMatchObject({melee: 12, tir: 12, lancer: 11, derobee: 12,
            vie_max: 12, endurance_max: 24, enc: 10.5, sc: 4, sust: 3, plus_dom: 0,
            vie: 7, endurance: 12, reve_pts: 17, reve_seuil: 14, reve_eclatement: 42,
            chance: 10, points_de_chance: 3});
    });

    it('reprend une valeur portée uniquement par un ancien alias, y compris zéro', () => {
        const r = reprendreFicheDeVoyageur(fiche, {points_de_vie: 0, points_de_reve: 19, reve_pts_max: 11,
            heure_de_naissance: 12, poids: 70});
        expect(r).toMatchObject({vie: 0, reve_pts: 19, reve_seuil: 11, reve_eclatement: 33,
            heure_naissance: 'Le Château Dormant', poids_kg: '70'});
    });

    it('refuse de trancher deux valeurs différentes, avec un choix explicite qui préserve la source entière', () => {
        const ancien = {vie: 0, points_de_vie: 8, reve_pts: 9, points_de_reve: 12, nom: 'Ancien', libre: {notes: ['à conserver']}};
        const photo = structuredClone(ancien);
        expect(lireFicheDeVoyageur(fiche, ancien).conflits.map(c => c.champ)).toEqual(['vie', 'reve_pts']);
        expect(() => reprendreFicheDeVoyageur(fiche, ancien)).toThrow(/Choisir/);
        const r = reprendreFicheDeVoyageur(fiche, ancien, {vie: 0, reve_pts: 12});
        expect(r).toMatchObject({vie: 0, reve_pts: 12, points_de_vie: 8, points_de_reve: 12});
        expect(r[CLE_ORIGINAUX]).toEqual(photo);
        expect(ancien).toEqual(photo);
        expect(reprendreFicheDeVoyageur(fiche, r)).toEqual(r);
    });

    it('après reprise, une ancienne copie ne reprend pas autorité lors des changements d’attributs', () => {
        const r = reprendreFicheDeVoyageur(fiche, {vie: 7, points_de_vie: 7, melee: 4, tir_comp: 9});
        const apres = lireFicheDeVoyageur(fiche, {...r, force: 15, vie: 6});
        expect(apres.conflits).toEqual([]);
        expect(apres.valeurs).toMatchObject({melee: 14, lancer: 13, vie: 6, points_de_vie: 7});
        expect(apres.valeurs[CLE_ORIGINAUX]).toEqual({vie: 7, points_de_vie: 7, melee: 4, tir_comp: 9});
    });

    it('un seuil absent est proposé depuis RÊVE ; un seuil distinct est conservé sans plafonner les points', () => {
        expect(lireFicheDeVoyageur(fiche, {reve: 10}).valeurs.reve_seuil).toBe(10);
        const r = reprendreFicheDeVoyageur(fiche, {reve: 18, reve_pts_max: 12, reve_pts: 25});
        expect(lireFicheDeVoyageur(fiche, {...r, reve: 19}).valeurs).toMatchObject({reve_seuil: 12, reve_pts: 25, reve_eclatement: 36});
        expect(reprendreFicheDeVoyageur(fiche, {chance: 12}).points_de_chance).toBe(12);
    });

    it('n’extrapole pas les tables au-delà de leur domaine et ne change pas les autres jeux', () => {
        const r = lireFicheDeVoyageur(fiche, {constitution: 18, taille: 18, force: 18, sc: 6, sust: 5, plus_dom: 4});
        expect(r.valeurs).toMatchObject({sc: 6, sust: 5, plus_dom: 4});
        expect(r.avertissements).toHaveLength(3);
        expect(lireFicheDeVoyageur(fiche, {constitution: 18, sc: 'à vérifier'}).valeurs.sc).toBe('à vérifier');
        const ordinaire = {...fiche, reglesDeFiche: undefined};
        const donnees = {vie: 6};
        expect(reprendreFicheDeVoyageur(ordinaire, donnees)).toBe(donnees);
    });

    it('rejette une caractéristique illisible, sans transformer le personnage en une fiche à zéro', () => {
        const donnees = {taille: 'inconnue', melee: 9};
        expect(lireFicheDeVoyageur(fiche, donnees).valeurs.melee).toBe(9);
        expect(() => reprendreFicheDeVoyageur(fiche, donnees)).toThrow(/nombre/);
        expect(donnees).toEqual({taille: 'inconnue', melee: 9});
    });

    it('un nom d’heure inconnu reste à arbitrer, les deux représentations d’une heure connue concordent', () => {
        expect(lireFicheDeVoyageur(fiche, {heure_naissance: 'mystère'}).conflits).toHaveLength(1);
        expect(lireFicheDeVoyageur(fiche, {heure_naissance: 'Le Dragon', heure_de_naissance: 5}).conflits).toEqual([]);
        expect(reprendreFicheDeVoyageur(fiche, {heure_naissance: 'mystère'}, {heure_naissance: 'Le Serpent'}).heure_naissance).toBe('Le Serpent');
    });

    it('tous les alias sont distincts des cibles et n’incluent ni la caractéristique Chance ni RÊVE', () => {
        const anciens = Object.values(ALIAS_DU_VOYAGEUR).flat();
        expect(anciens).not.toContain('reve');expect(anciens).not.toContain('points_de_chance');
    });
});
