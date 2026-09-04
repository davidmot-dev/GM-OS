import type { TableBridge, TableData } from './types';
import type { ReferenceDOracle } from '../session/logic/LootGenerator';
import { cleDOracle } from '../session/logic/LootGenerator';

/**
 * Le pont Electron vers `databases/tables/` — le seul chemin vers les oracles.
 *
 * Absent hors d'Electron (tests, navigateur) : les appelants doivent le supporter
 * plutôt que de le supposer.
 */
export const pontDesTables = (): TableBridge | undefined =>
    (window as Window & typeof globalThis & { appBridge?: { tables: TableBridge } }).appBridge?.tables;

/**
 * Charge les oracles qu'un tirage de butin va traverser.
 *
 * **Pourquoi c'est un préalable et non un détail du générateur** : lire une table
 * de Table-OS passe par le pont, donc c'est asynchrone, alors qu'un tirage est
 * appelé au clic, au milieu d'une résolution, et doit rester synchrone. On charge
 * d'abord, on tire ensuite — et un oracle qui n'a pas pu être lu devient un
 * avertissement à l'écran, pas un silence.
 */
export async function chargerLesOracles(refs: ReferenceDOracle[]): Promise<Map<string, TableData>> {
    const charges = new Map<string, TableData>();
    const bridge = pontDesTables();
    if (!bridge || refs.length === 0) return charges;

    // Dédoublonnées : la même table peut être désignée par plusieurs entrées.
    const uniques = new Map(refs.map(r => [cleDOracle(r), r]));

    await Promise.all(
        [...uniques].map(async ([cle, ref]) => {
            try {
                const data = await bridge.loadTable(ref.univers, ref.table);
                if (data) charges.set(cle, data);
            } catch (err) {
                console.error(`[pontDesTables] oracle illisible : ${cle}`, err);
            }
        }),
    );

    return charges;
}
