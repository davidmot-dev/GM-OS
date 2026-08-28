import {
    versGmOs, type CorrespondanceDeFiche, type CotesGmOs,
} from './correspondanceDeFiche';
import type { InventoryItem } from '../../types/player.types';

/**
 * **Rapprocher la fiche et GM-OS — et dire ce qu'on écrase.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE, TRANCHÉE PAR DAVID LE 2026-08-28
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **La fiche fait foi. GM-OS s'aligne.** Mot pour mot : *« c'est la tablette qui
 * gagne »* — l'écran où le joueur remplit sa fiche l'emporte sur ce que le meneur
 * en a fait. C'est la même règle que la table de correspondance applique déjà aux
 * armes, et elle tient en une phrase : *une règle d'arbitrage qu'on ne peut pas
 * dire à voix haute finit appliquée à moitié.*
 *
 * **Mais elle ne se pose pas silencieusement** — *« il faut garder un log si
 * possible »*. Un champ écrasé par une resynchro se découvre autrement en séance,
 * et on ne peut alors plus dire ce qu'il contenait. Ce module ne journalise pas
 * lui-même (c'est `journalDesDivergences.ts`, qui touche `window`) : il **relève**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX PIÈGES QUI RENDRAIENT LE JOURNAL INUTILISABLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. **Les types ne coïncident pas d'un côté à l'autre.** Un champ `number` de la
 *    fiche rend `16`, et `sheetData` porte souvent `"16"` — saisi dans un
 *    formulaire. Comparer strictement signalerait une divergence sur *chaque*
 *    champ numérique, à *chaque* ouverture. **Un journal qui crie sur le cas
 *    normal apprend à ignorer les journaux** — la leçon du `GridEngine`, puis
 *    celle du contrôle des polices.
 * 2. **Remplir n'est pas écraser.** Écrire par-dessus un champ vide de GM-OS est
 *    le fonctionnement attendu, pas une perte. Seule une valeur **présente et
 *    différente** est une divergence.
 */

/** Une valeur de GM-OS remplacée par celle de la fiche. */
export interface Divergence {
    /** L'identifiant côté GM-OS — ou `inventoryItems` pour un objet retiré. */
    cle: string;
    /** Ce que GM-OS portait, et qui disparaît. */
    ancienne: unknown;
    /** Ce que la fiche impose. */
    nouvelle: unknown;
}

/** Ce que le rapprochement demande d'écrire, et ce qu'il a coûté. */
export interface Rapprochement {
    /** Les seules clés qui changent — écrire les autres ferait tourner le store pour rien. */
    aEcrire: Record<string, unknown>;
    /** L'inventaire tel qu'il doit devenir. Absent si la table ne parle pas d'objets. */
    inventoryItems?: InventoryItem[];
    /** Les valeurs écrasées. Vide est le cas normal. */
    divergences: Divergence[];
}

/**
 * Vide au sens de « rien saisi » — et `false` en fait partie.
 *
 * Une case jamais cochée et une case décochée sont indiscernables dans
 * `sheetData` : les traiter autrement ferait signaler une divergence à chaque
 * ouverture d'une fiche qui porte une seule case.
 */
export function estVide(valeur: unknown): boolean {
    return valeur === undefined || valeur === null || valeur === '' || valeur === false;
}

/**
 * L'égalité qui a du sens entre les deux côtés : **tolérante au type, stricte
 * sur le contenu**. `16` et `"16"` sont la même valeur ; `16` et `17` ne le sont
 * pas.
 */
export function memeValeur(a: unknown, b: unknown): boolean {
    if (estVide(a) && estVide(b)) return true;
    return String(a) === String(b);
}

/**
 * Rapproche les données de la fiche et celles de GM-OS.
 *
 * `donneesDeLaFiche` est ce que la couture rend (`getData().data`) — les clés de
 * la fiche, pas celles de GM-OS. La conversion passe par la table.
 */
export function rapprocher(
    donneesDeLaFiche: Record<string, unknown>,
    personnage: CotesGmOs,
    table: CorrespondanceDeFiche,
): Rapprochement {
    const impose = versGmOs(donneesDeLaFiche, table, personnage.inventoryItems ?? []);

    const aEcrire: Record<string, unknown> = {};
    const divergences: Divergence[] = [];

    for (const [cle, nouvelle] of Object.entries(impose.sheetData)) {
        const ancienne = personnage.sheetData?.[cle];
        if (memeValeur(ancienne, nouvelle)) continue;

        aEcrire[cle] = nouvelle;
        // Remplir un champ vide n'est pas écraser : ce n'est pas une divergence.
        if (!estVide(ancienne)) divergences.push({ cle, ancienne, nouvelle });
    }

    if (!impose.inventoryItems) return { aEcrire, divergences };

    /*
      Les objets disparus se disent aussi, et un par un. La fiche n'imprime que
      trois lignes d'armes : vider la deuxième dans la fiche **supprime** l'objet
      côté GM-OS, ce qui est la règle voulue — mais c'est exactement le genre de
      perte qu'on ne peut pas reconstituer le lendemain sans trace.
    */
    const restants = new Set(impose.inventoryItems.map(o => o.id));
    for (const parti of personnage.inventoryItems ?? []) {
        if (!restants.has(parti.id)) {
            divergences.push({ cle: 'inventoryItems', ancienne: parti.name, nouvelle: '' });
        }
    }

    return { aEcrire, inventoryItems: impose.inventoryItems, divergences };
}
