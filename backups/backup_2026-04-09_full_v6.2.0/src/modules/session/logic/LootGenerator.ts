import type { LootTable, LootEntry } from '../../../types/drivers';
import type { InventoryItem } from '../store/types';
import { DiceEngine } from '../../dice/DiceEngine';

/**
 * Service de génération de butin.
 * Convertit les tables de tirage définies dans le système en objets d'inventaire réels.
 */
export class LootGenerator {
    /**
     * Génère une liste d'objets à partir d'une table de butin.
     * Supporte la récursivité (tables imbriquées) et les formules de dés pour les quantités.
     */
    static generateFromTable(table: LootTable, allTables: LootTable[], iterationLimit = 5, totalItemsLimit = 50): InventoryItem[] {
        if (iterationLimit <= 0) return [];

        const results: InventoryItem[] = [];
        // Support de 'rolls' ou 'roll' (compatibilité ascendante)
        const rollsFormula = table.rolls || (table as any).roll || '1';
        const numRolls = this.resolveQuantity(rollsFormula);
        
        console.group(`🎲 Loot Table: ${table.name} (x${numRolls} tirages)`);

        for (let r = 0; r < numRolls; r++) {
            const entriesToProcess: LootEntry[] = [];
            
            // On vérifie le mode de tirage (weighted par défaut si non spécifié)
            const mode = table.rollMode || ((table as any).isWeighted ? 'weighted' : 'independent');

            if (mode === 'independent') {
                // Mode Indépendant : Teste chaque ligne individuellement comme un % de chance
                for (const entry of table.entries) {
                    const chance = Number(entry.weight) || 0;
                    if (chance >= 100 || Math.random() * 100 < chance) {
                        entriesToProcess.push(entry);
                    }
                }
            } else {
                // Mode Pondéré (Poids cumulé) : En choisit un seul parmi la liste
                const entry = this.pickWeightedEntry(table.entries);
                if (entry) entriesToProcess.push(entry);
            }

            for (const entry of entriesToProcess) {
                const metadata = entry.metadata || {};
                let quantity = 1;

                // Résolution de la quantité : priorité à quantityFormula (metadata), puis minAmount
                const qFormula = metadata.quantityFormula || entry.minAmount || (entry as any).quantity;
                if (qFormula) {
                    quantity = this.resolveQuantity(qFormula, entry.maxAmount);
                }

                if (entry.type === 'table') {
                    const tableIdFromMetadata = metadata.tableId as string;
                    const nestedTableId = (tableIdFromMetadata || entry.name || "").trim();
                    
                    console.log(`🔍 [LootGenerator] Tentative d'imbrication...`);
                    console.log(`   - Cible cherchée: "${nestedTableId}"`);
                    if (tableIdFromMetadata) console.log(`   - Trouvé via Metadata ID: "${tableIdFromMetadata}"`);
                    else console.log(`   - Fallback sur le nom de l'entrée: "${entry.name}"`);

                    const nextTable = allTables.find(t => 
                        (t.id && t.id.trim() === nestedTableId) || 
                        (t.name && t.name.trim() === nestedTableId) ||
                        (t.name && t.name.trim().toLowerCase() === nestedTableId.toLowerCase())
                    );

                    if (nextTable && results.length < totalItemsLimit) {
                        console.log(`🔗 [LootGenerator] SUCCESS: Table "${nextTable.name}" trouvée. Lancement récursif...`);
                        results.push(...this.generateFromTable(nextTable, allTables, iterationLimit - 1, totalItemsLimit));
                    } else if (!nextTable) {
                        console.warn(`🛑 [LootGenerator] ERROR: Table cible "${nestedTableId}" introuvable dans les ${allTables.length} tables disponibles.`);
                        console.log(`   - Tables dispos:`, allTables.map(t => `${t.name} (${t.id})`));
                    } else {
                        console.warn(`⚠️ [LootGenerator] LIMIT: Limite d'objets ou de récursion atteinte.`);
                    }
                } else {
                    // Traitement comme objet (ou monnaie)
                    const itemType = entry.type === 'currency' ? 'currency' : (entry.type || 'item');
                    const item: InventoryItem = {
                        id: `it-${crypto.randomUUID()}`,
                        name: entry.name,
                        type: itemType as string,
                        rarity: (metadata.rarity as string) || 'common',
                        weight: Number(metadata.weight) || 0,
                        quantity: quantity,
                        description: (metadata.description as string) || '',
                        value: Number(metadata.value) || (itemType === 'currency' ? 1 : 0),
                        properties: metadata,
                    };
                    console.log(`🎁 [LootGenerator] Objet généré : ${item.name} (x${item.quantity})`);
                    results.push(item);
                }
            }
        }

        console.groupEnd();
        return results;
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

    private static resolveQuantity(min?: number | string, max?: number | string): number {
        try {
            if (min === undefined || min === null || min === '') return 1;
            
            const minStr = String(min).trim();
            
            // Si c'est une formule de dés (ex: "2d6+2")
            if (minStr.toLowerCase().includes('d')) {
                const roll = DiceEngine.rollFormula(minStr);
                return roll.total;
            }

            // Si c'est un nombre simple ou une plage min-max
            const minVal = parseInt(minStr);
            if (isNaN(minVal)) return 1;

            if (max === undefined || max === null || max === '') return minVal;

            const maxVal = parseInt(String(max));
            if (isNaN(maxVal) || maxVal <= minVal) return minVal;

            // Tirage aléatoire entre min et max (inclusif)
            return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        } catch (e) {
            console.error("❌ [LootGenerator] Resolve Error:", e);
            return 1;
        }
    }
}
