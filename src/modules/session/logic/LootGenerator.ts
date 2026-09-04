import type { LootTable, LootEntry, LootRollMode } from '../../../types/drivers';
import type { InventoryItem } from '../store/types';
import type { TableData } from '../../tables/types';
import { TableEngine } from '../../tables/TableEngine';
import { objetsDepuisDeclaration } from './butinDeclare';
import { resoudreUneQuantite } from './quantiteDeButin';

/**
 * Comment cette table tire — **une seule lecture de la règle**.
 *
 * `rollMode` est le champ actuel ; `isWeighted` est celui des tables d'avant, et
 * des tables enregistrées le portent encore. Le générateur savait replier sur
 * lui ; les écrans, non — un `table.rollMode || 'weighted'` affichait « un seul
 * parmi la liste » à une table qui teste chaque ligne. *L'éditeur mentait sur ce
 * que le tirage allait faire*, et l'ancienne case à cocher tombait juste par
 * accident.
 */
export function modeDeTirage(
    /*
      `rollMode` est **facultatif ici**, alors qu'il est obligatoire dans
      `LootTable` : c'est précisément le cas des tables enregistrées avant lui, et
      le type doit pouvoir décrire ce qu'on lit vraiment sur le disque.
    */
    table: Partial<Pick<LootTable, 'rollMode'>> & { isWeighted?: boolean },
): LootRollMode {
    if (table.rollMode) return table.rollMode;
    return table.isWeighted ? 'weighted' : 'independent';
}

/**
 * La table du pilote qu'une entrée `table` désigne — par identifiant, sinon par
 * nom.
 *
 * **Le repli sur le nom est conservé**, et il n'est pas théorique : la table
 * « TEST » de Blade Runner renvoie vers `« Table 2 »`, son nom, pas son
 * identifiant. Le retirer casserait des liens qui fonctionnent.
 *
 * *L'éditeur lit la même fonction que le générateur*, sans quoi sa liste
 * déroulante afficherait « Choisir une table... » sur un renvoi qui marche.
 */
export function tableImbriqueeDe(entry: LootEntry, tables: LootTable[]): LootTable | undefined {
    const cible = String(entry.metadata?.tableId || entry.name || '').trim();
    if (!cible) return undefined;
    return tables.find(
        t =>
            (t.id && t.id.trim() === cible) ||
            (t.name && t.name.trim() === cible) ||
            (t.name && t.name.trim().toLowerCase() === cible.toLowerCase()),
    );
}

/** Un oracle de Table-OS désigné par une entrée de type `oracle`. */
export interface ReferenceDOracle {
    univers: string;
    table: string;
}

/** La clé sous laquelle un oracle chargé est rangé — `<univers>/<table>`. */
export const cleDOracle = (ref: ReferenceDOracle) => `${ref.univers}/${ref.table}`;

export interface OptionsDeGeneration {
    /** Les oracles déjà chargés, rangés par `cleDOracle`. */
    oracles?: Map<string, TableData>;
    iterationLimit?: number;
    totalItemsLimit?: number;
}

/**
 * **Ce qu'un tirage rend : des objets, et ce qui n'a pas marché.**
 *
 * Le générateur ne rendait qu'une liste d'objets, et signalait ses échecs à la
 * console : une table imbriquée introuvable — le cas courant, puisque son
 * identifiant se recopiait à la main — produisait **zéro objet sans un mot à
 * l'écran**. Le meneur voyait « la table n'a généré aucun objet » et ne pouvait
 * pas savoir que c'était une faute de frappe. *Un défaut muet en séance ne se
 * répare jamais, parce qu'il ne se voit jamais.*
 */
export interface ResultatDeGeneration {
    objets: InventoryItem[];
    avertissements: string[];
}

/**
 * Service de génération de butin.
 * Convertit les tables de tirage définies dans le système en objets d'inventaire réels.
 */
export class LootGenerator {
    /**
     * Tous les oracles qu'une table peut atteindre, elle et ses imbrications.
     *
     * **À appeler avant `generateFromTable`** : charger une table de Table-OS
     * passe par le pont Electron, donc c'est asynchrone, alors qu'un tirage doit
     * rester synchrone — il est appelé au clic, au milieu d'une résolution. On
     * charge d'abord, on tire ensuite.
     */
    static referencesDOracle(
        table: LootTable,
        allTables: LootTable[],
        vues = new Set<string>(),
    ): ReferenceDOracle[] {
        if (vues.has(table.id)) return [];
        vues.add(table.id);

        const refs: ReferenceDOracle[] = [];
        for (const entry of table.entries || []) {
            const metadata = entry.metadata || {};
            if (entry.type === 'oracle') {
                const univers = String(metadata.oracleUnivers || '').trim();
                const nom = String(metadata.oracleTable || '').trim();
                if (univers && nom) refs.push({ univers, table: nom });
            } else if (entry.type === 'table') {
                const suivante = tableImbriqueeDe(entry, allTables);
                if (suivante) refs.push(...this.referencesDOracle(suivante, allTables, vues));
            }
        }
        return refs;
    }

    /**
     * Génère une liste d'objets à partir d'une table de butin.
     * Supporte la récursivité (tables imbriquées), les oracles de Table-OS et les
     * formules de dés pour les quantités.
     */
    static generateFromTable(
        table: LootTable,
        allTables: LootTable[],
        options: OptionsDeGeneration = {},
    ): ResultatDeGeneration {
        const { oracles, iterationLimit = 5, totalItemsLimit = 50 } = options;
        if (iterationLimit <= 0) return { objets: [], avertissements: [] };

        const objets: InventoryItem[] = [];
        const avertissements: string[] = [];

        // Support de 'rolls' ou 'roll' (compatibilité ascendante)
        const rollsFormula = table.rolls || (table as { roll?: string | number }).roll || '1';
        const numRolls = resoudreUneQuantite(rollsFormula);

        for (let r = 0; r < numRolls; r++) {
            const entriesToProcess: LootEntry[] = [];

            if (modeDeTirage(table) === 'independent') {
                // Mode Indépendant : chaque ligne est testée comme un % de chance
                for (const entry of table.entries) {
                    const chance = Number(entry.weight) || 0;
                    if (chance >= 100 || Math.random() * 100 < chance) {
                        entriesToProcess.push(entry);
                    }
                }
            } else {
                // Mode Pondéré (poids cumulé) : un seul gagnant parmi la liste
                const entry = this.pickWeightedEntry(table.entries);
                if (entry) entriesToProcess.push(entry);
            }

            for (const entry of entriesToProcess) {
                const metadata = entry.metadata || {};

                if (entry.type === 'table') {
                    if (objets.length >= totalItemsLimit) continue;
                    const nextTable = tableImbriqueeDe(entry, allTables);

                    if (!nextTable) {
                        const cible = (metadata.tableId as string) || entry.name || '';
                        avertissements.push(
                            `Table imbriquée introuvable : « ${cible} » (depuis « ${table.name} »).`,
                        );
                        continue;
                    }

                    const imbrique = this.generateFromTable(nextTable, allTables, {
                        ...options,
                        iterationLimit: iterationLimit - 1,
                        totalItemsLimit,
                    });
                    objets.push(...imbrique.objets);
                    avertissements.push(...imbrique.avertissements);
                    continue;
                }

                if (entry.type === 'oracle') {
                    objets.push(
                        ...this.tirerSurUnOracle(entry, table.name, oracles, avertissements),
                    );
                    continue;
                }

                // Traitement comme objet (ou monnaie)
                const qFormula =
                    metadata.quantityFormula ||
                    entry.minAmount ||
                    (entry as { quantity?: number | string }).quantity;
                const quantity = qFormula ? resoudreUneQuantite(qFormula, entry.maxAmount) : 1;

                const itemType = entry.type === 'currency' ? 'currency' : entry.type || 'item';
                objets.push({
                    id: `it-${crypto.randomUUID()}`,
                    name: entry.name,
                    type: itemType as string,
                    rarity: (metadata.rarity as string) || 'common',
                    weight: Number(metadata.weight) || 0,
                    quantity,
                    description: (metadata.description as string) || '',
                    value: Number(metadata.value) || (itemType === 'currency' ? 1 : 0),
                    properties: metadata,
                });
            }
        }

        return { objets, avertissements };
    }

    /**
     * Le pont vers Table-OS : on tire sur l'oracle avec **son** moteur — plages,
     * dés concaténés, `d66` —, et seul ce que l'entrée tirée **déclare** entre au
     * butin. Un oracle qui ne déclare rien se lit ; il ne verse pas.
     */
    private static tirerSurUnOracle(
        entry: LootEntry,
        nomDeLaTable: string,
        oracles: Map<string, TableData> | undefined,
        avertissements: string[],
    ): InventoryItem[] {
        const metadata = entry.metadata || {};
        const ref: ReferenceDOracle = {
            univers: String(metadata.oracleUnivers || '').trim(),
            table: String(metadata.oracleTable || '').trim(),
        };

        if (!ref.univers || !ref.table) {
            avertissements.push(
                `Entrée « ${entry.name} » de « ${nomDeLaTable} » : aucun oracle désigné.`,
            );
            return [];
        }

        const oracle = oracles?.get(cleDOracle(ref));
        if (!oracle) {
            avertissements.push(`Oracle introuvable : « ${cleDOracle(ref)} ».`);
            return [];
        }

        const tire = TableEngine.rollDice(oracle.dice);
        const resultat = TableEngine.resolveEntry(oracle, tire);
        const objets = objetsDepuisDeclaration(resultat.butin, {
            table: oracle.name || ref.table,
            entree: resultat.title,
        });

        if (objets.length === 0) {
            avertissements.push(
                `« ${resultat.title} » (${oracle.name || ref.table}) ne déclare aucun butin.`,
            );
        }
        return objets;
    }

    private static pickWeightedEntry(entries: LootEntry[]): LootEntry | null {
        if (!entries || entries.length === 0) return null;

        const totalWeight = entries.reduce((sum, e) => sum + (Number(e.weight) || 0), 0);
        if (totalWeight <= 0) {
            // Si tous les poids sont à 0, on en prend un au hasard
            return entries[Math.floor(Math.random() * entries.length)];
        }

        let random = Math.random() * totalWeight;
        for (const entry of entries) {
            const weight = Number(entry.weight) || 0;
            if (random < weight) return entry;
            random -= weight;
        }
        return entries[entries.length - 1];
    }
}
