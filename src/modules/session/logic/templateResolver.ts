import type { PlayerCharacter, Campaign, SheetTemplate } from '../store/types';

/**
 * Résout le template de fiche à utiliser pour un personnage donné.
 * Priorité :
 * 1. Template spécifiquement assigné au personnage (si différent de 'generic')
 * 2. Système (template) défini pour la campagne à laquelle appartient le personnage
 * 3. Fallback sur le template 'generic' par défaut
 */
export function resolveSheetTemplate(
    character: PlayerCharacter | undefined,
    campaigns: Campaign[],
    allTemplates: SheetTemplate[]
): SheetTemplate {
    const genericTemplate = allTemplates.find(t => t.id === 'generic')!;
    
    if (!character) return genericTemplate;

    // 1. Check character specific template (if NOT generic)
    if (character.templateId && character.templateId !== 'generic') {
        const charTemplate = allTemplates.find(t => t.id === character.templateId);
        if (charTemplate) return charTemplate;
        console.warn(`[TemplateResolver] Template ${character.templateId} non trouvé pour ${character.name}`);
    }

    // 2. Check campaign system
    if (character.campaignId) {
        const campaign = campaigns.find(c => c.id === character.campaignId);
        if (campaign && campaign.system) {
            const systemTemplate = allTemplates.find(t => t.id === campaign.system);
            if (systemTemplate) {
                return systemTemplate;
            }
            console.warn(`[TemplateResolver] Système ${campaign.system} de la campagne ${campaign.name} non trouvé dans les templates`);
        } else if (campaign) {
            console.warn(`[TemplateResolver] La campagne ${campaign.name} n'a pas de système défini`);
        }
    }

    // 3. Final fallback
    return genericTemplate;
}
