import { describe, it, expect, vi, afterEach } from 'vitest';
import type { LootTable } from '../../../types/drivers';
import type { TableData } from '../../tables/types';
import { objetsDepuisDeclaration, laDeclarationEstVide } from './butinDeclare';
import { LootGenerator, cleDOracle, modeDeTirage, tableImbriqueeDe } from './LootGenerator';
import { estDeLaCampagne } from '../store/lootSlice';
import { lesDonneesDeLaSession } from './donneesDeLaSession';
import type { SessionOSStore } from '../store/index';

/**
 * **Ce que ces tests protègent : le pont entre Table-OS et Loot-OS, et le
 * silence qui le précédait.**
 *
 * Les deux modules n'ont jamais fait le même geste — l'un *consulte*, l'autre
 * *compose* —, mais rien ne les reliait : une table de fouille écrivait une ligne
 * de prose dans un champ que l'onglet Inventaire de la tablette ne regarde même
 * pas. Le point de rencontre est désormais le **pool**, jamais le personnage.
 *
 * Et le motif qui revient : *un tirage qui échoue doit le dire*. Une table
 * imbriquée introuvable — le cas courant, puisque son identifiant se recopiait à
 * la main — rendait zéro objet en ne se plaignant qu'à la console. En séance,
 * cela ne se voit jamais.
 */

vi.mock('./idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

afterEach(() => vi.restoreAllMocks());

const oracleDeFouille: TableData = {
    name: 'Fouille',
    dice: '1d20',
    entries: [
        { min: 1, max: 10, title: 'Poches vides', description: 'Rien.' },
        {
            min: 11,
            max: 20,
            title: 'Quelques Eddies',
            description: 'Une puce de crédit.',
            butin: [
                { name: 'Eurodollars', type: 'currency', quantite: 7 },
                { name: 'Munitions', quantite: 3, value: 2 },
            ],
        },
    ],
};

/** Force le dé de l'oracle sur son entrée haute, puis basse. */
const forcerLeDe = (valeur: number) =>
    vi.spyOn(Math, 'random').mockReturnValue((valeur - 1) / 20 + 0.001);

const tableAvecOracle: LootTable = {
    id: 'butin-du-ganger',
    name: 'Butin du ganger',
    rollMode: 'independent',
    rolls: '1',
    entries: [
        {
            name: 'Fouille du corps',
            type: 'oracle',
            weight: 100,
            metadata: { oracleUnivers: 'cyberpunk', oracleTable: 'fouille_ganger' },
        },
    ],
};

const oracles = new Map([
    [cleDOracle({ univers: 'cyberpunk', table: 'fouille_ganger' }), oracleDeFouille],
]);

describe('ce qu\'une entrée d\'oracle déclare', () => {
    it('devient des objets, quantités résolues et origine inscrite', () => {
        const objets = objetsDepuisDeclaration(oracleDeFouille.entries[1].butin, {
            table: 'Fouille',
            entree: 'Quelques Eddies',
        });

        expect(objets).toHaveLength(2);
        expect(objets[0]).toMatchObject({ name: 'Eurodollars', type: 'currency', quantity: 7 });
        // La monnaie vaut un par unité sans déclaration : une somme de pièces à
        // zéro ne se compte pas.
        expect(objets[0].value).toBe(1);
        expect(objets[1]).toMatchObject({ name: 'Munitions', quantity: 3, value: 2 });
        // D'où ça sort, écrit sur l'objet : dans le pool, tout se mélange.
        expect(objets[1].properties).toMatchObject({ oracleTable: 'Fouille', oracleEntree: 'Quelques Eddies' });
    });

    it('ne verse rien quand l\'entrée ne déclare rien', () => {
        expect(laDeclarationEstVide(oracleDeFouille.entries[0])).toBe(true);
        expect(laDeclarationEstVide(oracleDeFouille.entries[1])).toBe(false);
        expect(objetsDepuisDeclaration(undefined, { table: 'Fouille', entree: 'Poches vides' })).toEqual([]);
    });
});

describe('une table de butin qui appelle un oracle', () => {
    it('verse ce que l\'entrée tirée déclare', () => {
        forcerLeDe(15);
        const { objets, avertissements } = LootGenerator.generateFromTable(
            tableAvecOracle, [tableAvecOracle], { oracles },
        );

        expect(objets.map(o => o.name)).toEqual(['Eurodollars', 'Munitions']);
        expect(avertissements).toEqual([]);
    });

    it('le dit quand l\'entrée tirée ne déclare aucun butin', () => {
        forcerLeDe(3);
        const { objets, avertissements } = LootGenerator.generateFromTable(
            tableAvecOracle, [tableAvecOracle], { oracles },
        );

        expect(objets).toEqual([]);
        expect(avertissements.join(' ')).toContain('Poches vides');
    });

    it('le dit quand l\'oracle n\'a pas pu être chargé', () => {
        const { objets, avertissements } = LootGenerator.generateFromTable(
            tableAvecOracle, [tableAvecOracle], { oracles: new Map() },
        );

        expect(objets).toEqual([]);
        expect(avertissements.join(' ')).toContain('cyberpunk/fouille_ganger');
    });

    it('annonce ses oracles avant le tirage, pour qu\'on puisse les charger', () => {
        expect(LootGenerator.referencesDOracle(tableAvecOracle, [tableAvecOracle]))
            .toEqual([{ univers: 'cyberpunk', table: 'fouille_ganger' }]);
    });
});

describe('une table imbriquée introuvable', () => {
    it('ne disparaît plus en silence', () => {
        const table: LootTable = {
            id: 'coffre',
            name: 'Coffre',
            rollMode: 'independent',
            rolls: '1',
            entries: [
                { name: 'Bijoux', type: 'table', weight: 100, metadata: { tableId: 'table-qui-nexiste-pas' } },
            ],
        };

        const { objets, avertissements } = LootGenerator.generateFromTable(table, [table]);

        expect(objets).toEqual([]);
        // C'est le nom de la cible manquante qui manquait au meneur, pas un
        // « aucun objet » de plus.
        expect(avertissements.join(' ')).toContain('table-qui-nexiste-pas');
    });
});

describe('le butin appartient à une campagne', () => {
    it('sans marque, il appartient à celle qu\'on regarde', () => {
        // Le butin d'avant le 2026-09-04 n'en porte aucune : le faire disparaître
        // aurait été une perte silencieuse de plus.
        expect(estDeLaCampagne(undefined, 'c-1')).toBe(true);
        expect(estDeLaCampagne('c-1', 'c-1')).toBe(true);
        expect(estDeLaCampagne('c-2', 'c-1')).toBe(false);
    });
});

describe('le butin de séance survit à la fermeture', () => {
    it('entre dans la liste unique des données durables', () => {
        // `lootPool` et `lootHistory` n'étaient dans aucune des deux listes : ni
        // persistance vivante, ni sauvegarde fichier.
        const durables = lesDonneesDeLaSession({
            lootPool: ['un-objet'],
            lootHistory: ['un-don'],
        } as unknown as SessionOSStore);

        expect(durables.lootPool).toEqual(['un-objet']);
        expect(durables.lootHistory).toEqual(['un-don']);
    });
});

describe('les tables enregistrées avant le champ `rollMode`', () => {
    /*
      Relevées telles quelles dans la sauvegarde du 2026-08-30 : la table « TEST »
      de Blade Runner porte `isWeighted: false` et **pas** de `rollMode`, et son
      renvoi vise « Table 2 » — un NOM, pas un identifiant.
    */
    const heritee = {
        id: 'table-1775755055363',
        name: 'TEST',
        isWeighted: false,
        rolls: '1d6',
        entries: [
            { name: 'Trésor', weight: 60, type: 'table' as const, metadata: { tableId: 'Table 2' } },
        ],
    } as unknown as LootTable;

    const table2: LootTable = {
        id: 'table-1775756043807',
        name: 'Table 2',
        rollMode: 'weighted',
        rolls: '1',
        entries: [{ name: 'Carte', weight: 50, type: 'item' }],
    };

    it("tirent bien chaque ligne, et l'écran doit le dire", () => {
        // L'ancienne case à cocher tombait juste par accident ; deux boutons
        // nommés lisant `rollMode || weighted` auraient menti.
        expect(modeDeTirage(heritee)).toBe('independent');
        expect(modeDeTirage(table2)).toBe('weighted');
        expect(modeDeTirage({ rollMode: undefined })).toBe('independent');
    });

    it('gardent un renvoi fait par nom, que la liste doit montrer choisi', () => {
        const cible = tableImbriqueeDe(heritee.entries[0], [heritee, table2]);
        expect(cible?.id).toBe('table-1775756043807');
    });
});
