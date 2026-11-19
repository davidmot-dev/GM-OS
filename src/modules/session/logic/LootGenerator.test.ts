import { describe, expect, it } from 'vitest';
import type { CatalogueDEquipement, LootTable } from '../../../types/drivers';
import { LootGenerator } from './LootGenerator';

/**
 * **Le générateur de butin et les lignes « Objet du catalogue »** — registre § 264, T1
 * (19/11/2026). Décision de David : « Lien vivant » — la ligne désigne l'objet, qui
 * se lit au tirage. Le générateur n'avait pas d'essai propre (seulement le pont vers
 * les oracles) : les lignes ordinaires sont vérifiées au passage.
 */
const catalogue = (degatsDuFusil: number): CatalogueDEquipement => ({
    colonnes: { arme: [{ id: 'degats', libelle: 'Dégâts', nature: 'nombre' }] },
    objets: [
        { id: 'm41a', famille: 'arme', nom: 'Fusil à impulsion M41A', valeurs: { degats: degatsDuFusil }, cout: '1 200 $', description: 'Fusil des Marines.' },
    ],
});
const table = (entries: LootTable['entries']): LootTable => ({ id: 'casier', name: "Casier d'armurerie", rollMode: 'independent', entries });
const ligneDuFusil = { name: 'Fusil à impulsion M41A', type: 'catalogue' as const, weight: 100, minAmount: '2', metadata: { catalogueId: 'm41a', rarity: 'rare' } };

describe('une ligne « Objet du catalogue »', () => {
    it('se résout au tirage : l’objet tiré est celui du catalogue, relié, avec la rareté et la quantité de la ligne', () => {
        const { objets, avertissements } = LootGenerator.generateFromTable(table([ligneDuFusil]), [], { catalogue: catalogue(3) });
        expect(avertissements).toEqual([]);
        expect(objets).toHaveLength(1);
        expect(objets[0]).toMatchObject({
            name: 'Fusil à impulsion M41A', type: 'arme', rarity: 'rare', quantity: 2, value: 1200,
            description: 'Fusil des Marines.', properties: { catalogueId: 'm41a' },
        });
    });

    it('corriger l’objet dans le catalogue change ce que la table donne, sans retoucher la table (C4)', () => {
        const casier = table([{ ...ligneDuFusil, metadata: { catalogueId: 'm41a' } }]);
        const corrige: CatalogueDEquipement = { ...catalogue(5), objets: [{ ...catalogue(5).objets[0], nom: 'M41A corrigé', description: 'Relu au livre.' }] };
        const [avant] = LootGenerator.generateFromTable(casier, [], { catalogue: catalogue(3) }).objets;
        const [apres] = LootGenerator.generateFromTable(casier, [], { catalogue: corrige }).objets;
        expect(avant.name).toBe('Fusil à impulsion M41A');
        expect(apres).toMatchObject({ name: 'M41A corrigé', description: 'Relu au livre.' });
    });

    it('un objet retiré du catalogue se dit, et ne donne jamais un objet vide (C5)', () => {
        const vide: CatalogueDEquipement = { colonnes: {}, objets: [] };
        const r = LootGenerator.generateFromTable(table([ligneDuFusil]), [], { catalogue: vide });
        expect(r.objets).toEqual([]);
        expect(r.avertissements).toEqual(["Objet du catalogue introuvable : « Fusil à impulsion M41A » (depuis « Casier d'armurerie »)."]);
    });

    it('sans catalogue du tout, même avertissement', () => {
        const r = LootGenerator.generateFromTable(table([ligneDuFusil]), []);
        expect(r.objets).toEqual([]);
        expect(r.avertissements).toHaveLength(1);
    });

    it('une table imbriquée transmet le catalogue à ses lignes', () => {
        const armes = { ...table([ligneDuFusil]), id: 'armes', name: 'Armes' };
        const coffre = table([{ name: 'Armes', type: 'table', weight: 100, metadata: { tableId: 'armes' } }]);
        const { objets } = LootGenerator.generateFromTable(coffre, [coffre, armes], { catalogue: catalogue(3) });
        expect(objets.map(o => o.properties.catalogueId)).toEqual(['m41a']);
    });
});

describe('les lignes ordinaires ne changent pas (C6)', () => {
    it('un objet tapé à la main garde ses métadonnées, sans lien au catalogue', () => {
        const { objets } = LootGenerator.generateFromTable(
            table([{ name: 'Ration', type: 'item', weight: 100, minAmount: '3', metadata: { rarity: 'common', value: 5, weight: 1, description: 'Sèche.' } }]),
            [], { catalogue: catalogue(3) },
        );
        expect(objets[0]).toMatchObject({ name: 'Ration', type: 'item', quantity: 3, value: 5, weight: 1, description: 'Sèche.' });
        expect(objets[0].properties.catalogueId).toBeUndefined();
    });
});
