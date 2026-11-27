import { describe, it, expect } from 'vitest';
import { animalDeTraveller, armesDeTraveller, attaqueDeTraveller, attaquesDUnAnimal, mdDeForceDe, protectionDeTraveller } from './attaqueDeTraveller';
import type { CatalogueDEquipement } from '../../../types/drivers';

/** TRV-A2, T4 (27/11/2026) — critères C8 et C10 de `2026-11-27-traveller-jets-demandes-et-degats.md`. */
const CATALOGUE = {
    colonnes: {},
    objets: [
        { id: 'baton-incapacitant', famille: 'arme', nom: 'Bâton incapacitant', valeurs: { portee: 'Mêlée', degats: '2D', traits: 'Incapacitante' } },
        { id: 'fusil-gauss', famille: 'arme', nom: 'Fusil Gauss', valeurs: { portee: '600', degats: '4D', traits: 'AP 5, Auto 3, Viseur' } },
    ],
} as unknown as CatalogueDEquipement;

describe('armesDeTraveller — les lignes de la fiche', () => {
    it('lit les dégâts écrits, la mêlée par la portée, et les traits au catalogue par le nom', () => {
        const armes = armesDeTraveller({
            arme_1: 'Dague', arme_1_degats: '1D+2', arme_1_portee: 'Mêlée',
            arme_2: 'fusil gauss', arme_2_degats: '', arme_2_portee: '',
            arme_3: 'Baton incapacitant', arme_3_degats: '2D',
            arme_4: 'Grenade', arme_4_degats: 'Spécial',
        }, CATALOGUE);
        expect(armes.map(a => [a.index, a.libelle, a.texteDesDegats, a.melee])).toEqual([
            [1, 'Dague', '1D+2', true],
            [2, 'fusil gauss', '4D', false],
            [3, 'Baton incapacitant', '2D', true],
        ]);
        expect(armes[1].traits).toMatchObject({ ap: 5, auto: 3, autres: ['Viseur'] });
        expect(armes[2].traits.incapacitante).toBe(true);
    });

    it('sans catalogue, une arme sans dégâts écrits ne se propose pas', () => {
        expect(armesDeTraveller({ arme_1: 'Fusil Gauss' })).toEqual([]);
    });
});

describe('protectionDeTraveller — la meilleure, modifiable (décision du 27/11)', () => {
    it('prend la plus haute des armures de la fiche', () => {
        expect(protectionDeTraveller({ armure_1: 'Tissu', armure_1_protection: '+5', armure_2: 'Gilet pare-balles', armure_2_protection: '+3' }))
            .toEqual({ protection: 5, source: 'Tissu' });
    });

    it('à défaut, le trait Armure d’un animal ; sinon rien', () => {
        expect(protectionDeTraveller({}, 'Attaques: Charge (5D) ; Traits: Armure (+12), Grand (+4)')).toEqual({ protection: 12, source: 'Armure (+12)' });
        expect(protectionDeTraveller({})).toEqual({ protection: 0, source: 'aucune armure' });
    });
});

describe('attaquesDUnAnimal — « Attaques : Cornes (2D), Piétinement (3D) » (p. 81)', () => {
    it('lit chaque attaque et ses dés', () => {
        const attaques = attaquesDUnAnimal('Herbivore\nAttaques: Cornes (2D), Piétinement (3D) ; Traits: Armure (+2)');
        expect(attaques.map(a => [a.libelle, a.texteDesDegats])).toEqual([['Cornes', '2D'], ['Piétinement', '3D']]);
    });

    it('rien sans ligne d’attaques', () => {
        expect(attaquesDUnAnimal('Comportement: Brouteur')).toEqual([]);
    });
});

describe('attaqueDeTraveller — le test proposé', () => {
    it('mêlée : FOR et la première ligne de Mêlée remplie ; à distance : DEX et Combat Arme', () => {
        const [dague, fusil] = armesDeTraveller({ arme_1: 'Dague', arme_1_degats: '1D+2', arme_1_portee: 'Mêlée', arme_2: 'Fusil', arme_2_degats: '3D' });
        expect(attaqueDeTraveller({ melee_2: '1' }, dague)).toEqual({ caracteristique: 'force', competence: 'melee_2' });
        expect(attaqueDeTraveller({ combat_arme_1: '0' }, fusil)).toEqual({ caracteristique: 'dexterite', competence: 'combat_arme_1' });
        expect(attaqueDeTraveller({}, fusil)).toEqual({ caracteristique: 'dexterite' });
    });
});

describe('animalDeTraveller — un animal du bestiaire au combat (T8, C10)', () => {
    const BESTIAIRE = { colonnes: [], creatures: [
        { id: 'carthus', nom: 'Carthus', valeurs: { pdv: 28, 'melee-naturelles': 3 }, particularites: ['Attaques: Morsure (4D)', 'Traits: Amphibie, Grand (+1)'] },
        { id: 'larker', nom: 'Larker', valeurs: { pdv: 100 }, particularites: ['Attaques: Charge (5D)', 'Traits: Armure (+12), Grand (+4)'] },
    ] } as never;

    it('lit l’attaque et la Mêlée (naturelles) au bestiaire, par l’origine du combattant', () => {
        const carthus = animalDeTraveller({ isPlayer: false, origineDuLivre: { creatureId: 'carthus' } }, BESTIAIRE);
        expect(carthus?.mdDeMelee).toBe(3);
        expect(carthus?.attaques.map(a => [a.libelle, a.texteDesDegats])).toEqual([['Morsure', '4D']]);
        // Le Larker n'a pas de Mêlée (naturelles) au livre : 0.
        expect(animalDeTraveller({ isPlayer: false, origineDuLivre: { creatureId: 'larker' } }, BESTIAIRE)?.mdDeMelee).toBe(0);
    });

    it('sans origine, dans ses notes ; un PNJ ou un joueur n’est pas un animal', () => {
        expect(animalDeTraveller({ isPlayer: false, roleplayingNotes: 'Mêlée (naturelles) 2\nAttaques: Griffes (2D)' }, undefined)?.mdDeMelee).toBe(2);
        expect(animalDeTraveller({ isPlayer: false, roleplayingNotes: 'Contrebandier' }, BESTIAIRE)).toBeNull();
        expect(animalDeTraveller({ isPlayer: true, origineDuLivre: { creatureId: 'carthus' } }, BESTIAIRE)).toBeNull();
    });
});

describe('mdDeForceDe', () => {
    it('celui de la fiche, sinon lu sur la FOR (p. 9), sinon 0', () => {
        expect(mdDeForceDe({ force_md: '-1', force: 12 })).toBe(-1);
        expect(mdDeForceDe({ force: 12 })).toBe(2);
        expect(mdDeForceDe({})).toBe(0);
    });
});
