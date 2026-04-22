import type { Campaign, Entity, AtlasMap, WikiEntry } from './useSessionOSStore';

export class ObsidianExportService {
    private static instance: ObsidianExportService;

    public static getInstance(): ObsidianExportService {
        if (!ObsidianExportService.instance) {
            ObsidianExportService.instance = new ObsidianExportService();
        }
        return ObsidianExportService.instance;
    }

    /**
     * Exports a campaign and its associated data to Obsidian.
     */
    public async exportCampaign(
        campaign: Campaign,
        entities: Entity[],
        locations: AtlasMap[],
        lore: WikiEntry[],
        vaultPath?: string
    ): Promise<{ success: boolean; message: string }> {
        if (!window.appBridge?.obsidian?.writeNote) {
            return { success: false, message: "Obsidian Bridge non disponible." };
        }

        const rootDir = campaign.name.replace(/[<>:"/\\|?*]/g, ''); // Basic sanitization

        try {
            // 1. Export Global Scenario / Campaign Note
            const campaignContent = this.formatCampaignNote(campaign);
            await window.appBridge.obsidian.writeNote(`${rootDir}/Scenario.md`, campaignContent, vaultPath);

            // 2. Export NPCs / Monsters
            for (const entity of entities) {
                const entityContent = this.formatEntityNote(entity);
                const subDir = entity.type === 'monster' ? 'Bestiaire' : 'PNJs';
                await window.appBridge.obsidian.writeNote(
                    `${rootDir}/${subDir}/${entity.name.replace(/[<>:"/\\|?*]/g, '')}.md`,
                    entityContent,
                    vaultPath
                );
            }

            // 3. Export Locations
            for (const loc of locations) {
                const locContent = this.formatLocationNote(loc);
                await window.appBridge.obsidian.writeNote(
                    `${rootDir}/Lieux/${loc.name.replace(/[<>:"/\\|?*]/g, '')}.md`,
                    locContent,
                    vaultPath
                );
            }

            // 4. Export Lore / Wiki
            for (const entry of lore) {
                const entryContent = this.formatLoreNote(entry);
                const category = entry.category || 'Général';
                await window.appBridge.obsidian.writeNote(
                    `${rootDir}/Lore/${category}/${entry.title.replace(/[<>:"/\\|?*]/g, '')}.md`,
                    entryContent,
                    vaultPath
                );
            }

            return { success: true, message: `Campagne "${campaign.name}" exportée avec succès !` };
        } catch (error) {
            console.error("[Obsidian Export] Error during export:", error);
            return { success: false, message: `Erreur lors de l'exportation : ${(error as Error).message}` };
        }
    }

    public async exportRule(
        title: string,
        content: string,
        category: string = 'Règle',
        tags: string[] = [],
        vaultPath?: string
    ): Promise<{ success: boolean; message: string }> {
        if (!window.appBridge?.obsidian?.writeNote) {
            return { success: false, message: "Obsidian Bridge non disponible." };
        }

        const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '');
        const path = `Règles/${sanitizedTitle}.md`;

        const ruleContent = `---
tags: [règle, ${category}, ${tags.join(', ')}]
category: ${category}
date: ${new Date().toLocaleDateString()}
---
# ${title}

${content}

---
*Généré par GM-OS v5 — Forge des Règles*
`;

        try {
            await window.appBridge.obsidian.writeNote(path, ruleContent, vaultPath);
            return { success: true, message: `Règle "${title}" exportée vers Obsidian !` };
        } catch (error) {
            console.error("[Obsidian Export] Error exporting rule:", error);
            return { success: false, message: `Erreur d'exportation : ${(error as Error).message}` };
        }
    }

    private formatCampaignNote(campaign: Campaign): string {
        return `---
tags: [campaign, scenario]
status: active
---
# ${campaign.name}

## Synopsis
${campaign.synopsis || campaign.description}

## Notes de Session
${campaign.notes || "Aucune note de session pour le moment."}

---
*Généré par GM-OS v5 - ${new Date().toLocaleDateString()}*
`;
    }

    private formatEntityNote(entity: Entity): string {
        return `---
tags: [npc, ${entity.type}, ${entity.role}]
role: ${entity.role}
type: ${entity.type}
hp: ${entity.hp}
ac: ${entity.ac}
---
# ${entity.name}

> ${entity.description || "Pas de description."}

## Notes de Roleplay
${entity.roleplayingNotes || "Aucune note."}

## Informations Secrètes (MJ)
${entity.gmSecretInfo || "Aucun secret."}

## Statistiques
- **PV :** ${entity.hp}
- **CA :** ${entity.ac}
- **Vitesse :** ${entity.speed || "Non définie"}
- **Initiative :** ${entity.initiative || "0"}

---
*Généré par GM-OS v5*
`;
    }

    private formatLocationNote(location: AtlasMap): string {
        return `---
tags: [location, ${location.type}]
type: ${location.type}
---
# ${location.name}

## Description Narrative
${location.narrativeDescription || "Pas de description narrative."}

## Notes du MJ
${location.gmNotes || "Aucune note particulière."}

---
*Généré par GM-OS v5*
`;
    }

    private formatLoreNote(entry: WikiEntry): string {
        return `---
tags: [lore, ${entry.category}, ${entry.tags?.join(', ') || ''}]
category: ${entry.category}
---
# ${entry.title}

${entry.content}

---
*Généré par GM-OS v5*
`;
    }
}

export const obsidianExportService = ObsidianExportService.getInstance();
