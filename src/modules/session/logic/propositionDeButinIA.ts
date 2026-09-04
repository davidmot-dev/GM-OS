import i18next from 'i18next';
import type { GameDriver } from '../../../types/drivers';
import type { InventoryItem } from '../store/types';
import { aiService } from '../../ai/AIService';
import { raretesDuJeu, nomDeLaMonnaie } from './vocabulaireDuButin';

/**
 * **Une description en français, des objets structurés.**
 *
 * Deux écrans en ont besoin : le générateur de Loot-OS, où le meneur décrit
 * lui-même un contenu (« un coffre de pirate maudit »), et le résultat d'un
 * oracle de Table-OS qui **ne déclare pas** son butin — là, le texte est déjà
 * écrit, il ne reste qu'à le convertir.
 *
 * *Une seule écriture de l'invite*, parce que deux copies auraient divergé le
 * jour où l'une apprend le vocabulaire du jeu et pas l'autre — ce qui vient
 * précisément d'arriver.
 *
 * **On ne lit jamais `effect` tout seul.** La conversion se propose, elle ne
 * s'applique pas : c'est le meneur qui verse au butin après avoir lu. *Un
 * contrôle qui se trompe est pire qu'un contrôle absent* — et une regex sur de
 * la prose se trompe.
 */
export async function proposerDesObjets(
    description: string,
    driver: GameDriver | null | undefined,
    options: { lite?: boolean } = {},
): Promise<InventoryItem[]> {
    const systemPrompt = i18next.t('modules:loot.generator.ai_prompts.system', {
        systemName: driver?.name || i18next.t('modules:loot.generator.generic_system'),
        contextInstructions: options.lite
            ? i18next.t('modules:loot.generator.ai_prompts.lite_instruction')
            : i18next.t('modules:loot.generator.ai_prompts.full_instruction'),
        raretes: raretesDuJeu(driver).map(p => p.id).join(' | '),
        monnaie:
            nomDeLaMonnaie(driver) || i18next.t('modules:loot.generator.ai_prompts.monnaie_neutre'),
    });

    const bruts = await aiService.generateJSON<Array<Record<string, unknown>>>(
        description,
        systemPrompt,
        undefined,
        { lite: !!options.lite },
    );

    if (!Array.isArray(bruts)) return [];

    return bruts.map(it => ({
        id: `ai-${crypto.randomUUID()}`,
        name: String(it.name || i18next.t('modules:loot.notifications.placeholder_name')),
        quantity: Number(it.quantity) || 1,
        type: String(it.type || 'item'),
        rarity: String(it.rarity || raretesDuJeu(driver)[0]?.id || 'common'),
        description: String(it.description || ''),
        weight: Number(it.weight) || 0,
        value: Number(it.value) || 0,
        properties: (it.properties as InventoryItem['properties']) || {},
    }));
}
