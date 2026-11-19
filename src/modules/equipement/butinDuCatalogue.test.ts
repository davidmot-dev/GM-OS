import { describe, expect, it } from 'vitest';
import type { CatalogueDEquipement } from '../../types/drivers';
import { objetsDuButin, valeurDuCout } from './butinDuCatalogue';
import { objetsPortes, champsDEquipement } from './equiperLaFiche';

/**
 * **Un objet du catalogue qui entre au butin** — registre § 264, T1 (19/11/2026).
 * Coûts relevés dans les catalogues exportés : Alien « 1 200 $ », Blade Runner « 2 »,
 * Delta Green « Courant » (une catégorie de prix, pas un nombre).
 */
const CATALOGUE: CatalogueDEquipement = {
    colonnes: {},
    objets: [
        { id: 'm4a3', famille: 'arme', nom: 'Pistolet M4A3', valeurs: {}, poids: '½', cout: '200 $', description: 'Arme de poing.' },
        { id: 'ccc5', famille: 'vehicule', nom: 'CCC5', valeurs: {}, cout: '1 200 $', contient: ['ak104s'] },
        { id: 'ak104s', famille: 'arme', nom: 'AK-104S', valeurs: {}, contient: ['ccc5'] },
        { id: 'trousse', famille: 'materiel', nom: 'Trousse', valeurs: {}, cout: 'Courant' },
    ],
};
const objet = (id: string) => CATALOGUE.objets.find(o => o.id === id)!;

describe('la valeur lue dans le coût (Q5)', () => {
    it('un coût qui commence par un nombre donne sa valeur, espaces de milliers compris', () => {
        expect(valeurDuCout('200 $')).toBe(200);
        expect(valeurDuCout('1 200 $')).toBe(1200);
        expect(valeurDuCout('1 200 $')).toBe(1200);
        expect(valeurDuCout('2')).toBe(2);
        expect(valeurDuCout('1,5')).toBe(1.5);
    });

    it('un coût qui n’est pas un nombre vaut 0 : on ne devine pas un prix', () => {
        expect(valeurDuCout('Courant')).toBe(0);
        expect(valeurDuCout('Spécial')).toBe(0);
        expect(valeurDuCout(undefined)).toBe(0);
    });
});

describe('objetsDuButin', () => {
    it('l’objet arrive relié au catalogue, avec son nom, sa description, son poids, sa valeur, la rareté et la quantité de la ligne', () => {
        const [pistolet] = objetsDuButin(CATALOGUE, objet('m4a3'), { rarete: 'rare', quantite: 2 });
        expect(pistolet).toMatchObject({
            name: 'Pistolet M4A3', type: 'arme', description: 'Arme de poing.', weight: 0.5,
            value: 200, rarity: 'rare', quantity: 2, properties: { catalogueId: 'm4a3' },
        });
        expect(pistolet.id).toMatch(/^it-/);
    });

    it('sans réglage : rareté « common », quantité 1', () => {
        expect(objetsDuButin(CATALOGUE, objet('trousse'))[0]).toMatchObject({ rarity: 'common', quantity: 1, value: 0, type: 'matériel' });
    });

    it('un véhicule arrive avec les objets qu’il contient, chacun relié, sans boucler sur un cercle', () => {
        const verses = objetsDuButin(CATALOGUE, objet('ccc5'));
        expect(verses.map(v => v.properties.catalogueId)).toEqual(['ccc5', 'ak104s']);
        expect(verses[0].value).toBe(1200);
    });

    it('l’objet reçu par le butin compte comme porté : ses effets seront rappelés au jet (C3)', () => {
        const sac = objetsDuButin(CATALOGUE, objet('m4a3'));
        expect(objetsPortes(CATALOGUE, sac, champsDEquipement(undefined), {}).map(o => o.id)).toEqual(['m4a3']);
    });
});
