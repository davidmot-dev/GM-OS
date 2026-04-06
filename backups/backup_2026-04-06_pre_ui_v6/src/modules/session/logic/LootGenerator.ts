import type { LootTable, LootEntry } from '../../../types/drivers';
import type { InventoryItem } from '../useSessionOSStore';
import { DiceEngine } from '../../dice/DiceEngine';

export class LootGenerator {
    /**
     * Génère une liste d'objets à partir d'une table de butin.
     * Supporte la récursivité (tables imbriquées) et les formules de dés pour les quantités.
     */
    static generateFromTable(table: LootTable, allTables: LootTable[], iterationLimit = 5, totalItemsLimit = 50): InventoryItem[] {
        if (iterationLimit <= 0) return [];

        const results: InventoryItem[] = [];
        const numRolls = table.rolls ? this.resolveQuantity(table.rolls) : 1;
        
        if (numRolls > 1) {
            console.group(`🎲 Tirage multiple sur table: ${table.name} (x${numRolls})`);
        } else {
            console.group(`🎲 Tirage sur table: ${table.name}`);
        }

        for (let r = 0; r < numRolls; r++) {
            const entriesToProcess: LootEntry[] = [];
            
            if (table.rollMode === 'independent') {
                // Mode Indépendant : On teste chaque ligne individuellement
                for (const entry of table.entries) {
                    const chance = Number(entry.weight) || 0;
                    if (chance >= 100 || Math.random() * 100 < chance) {
                        entriesToProcess.push(entry);
                    }
                }
            } else {
                // Mode Pondéré (Défaut) : On en choisit un seul
                const entry = this.pickWeightedEntry(table.entries);
                if (entry) entriesToProcess.push(entry);
            }

            if (entriesToProcess.length === 0) {
                console.warn(`⚠️ Aucun élément généré au tirage ${r + 1}/${numRolls} sur ${table.name}.`);
                continue;
            }

            for (const entry of entriesToProcess) {
                console.log(`✅ Sélection [${r + 1}/${numRolls}]: ${entry.name} (${entry.type})`);

                const metadata = entry.metadata || {};
                let quantity = 1;

                if (metadata.quantityFormula) {
                    try {
                        quantity = DiceEngine.rollFormula(String(metadata.quantityFormula)).total;
                    } catch {
                        quantity = 1;
                    }
                } else if (entry.minAmount) {
                    quantity = this.resolveQuantity(entry.minAmount, entry.maxAmount);
                }

                if (entry.type === 'table') {
                    const nestedTableId = (metadata.tableId as string || entry.name || "").trim();
                    const nextTable = allTables.find(t => 
                        (t.id && t.id.trim() === nestedTableId) || 
                        (t.name && t.name.trim().toLowerCase() === nestedTableId.toLowerCase())
                    );

                    if (nextTable && results.length < totalItemsLimit) {
                        console.log(`📂 Traversée: ${nextTable.name} (x${quantity})`);
                        for (let i = 0; i < quantity; i++) {
                            if (results.length >= totalItemsLimit) {
                                console.warn("🛑 Limite de sécurité de génération atteinte (50+ items). Arrêt de l'expansion.");
                                break;
                            }
                            results.push(...this.generateFromTable(nextTable, allTables, iterationLimit - 1, totalItemsLimit));
                        }
                    } else if (!nextTable) {
                        console.warn(`❌ Sous-table non trouvée: "${nestedTableId}"`);
                    }
                } else {
                    const item: InventoryItem = {
                        id: crypto.randomUUID(),
                        name: entry.name,
                        type: entry.type === 'currency' ? 'currency' : (entry.type as InventoryItem['type'] || 'other'),
                        rarity: (metadata.rarity as InventoryItem['rarity']) || 'common',
                        weight: Number(metadata.weight) || 0,
                        quantity: quantity,
                        description: (metadata.description as string) || '',
                        properties: metadata,
                    };
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
        if (totalWeight <= 0) return entries[0];

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
            if (!min) return 1;
            
            // Si c'est une formule (contient 'd' ou 'D')
            const minStr = String(min);
            if (minStr.toLowerCase().includes('d')) {
                return DiceEngine.rollFormula(minStr).total;
            }

            const minVal = parseInt(String(min));
            if (isNaN(minVal)) return 1;
            if (max === undefined || max === null) return minVal;

            const maxVal = parseInt(String(max));
            if (isNaN(maxVal) || maxVal <= minVal) return minVal;

            return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        } catch (e) {
            console.error("❌ Erreur resolveQuantity:", e);
            return 1;
        }
    }
}
