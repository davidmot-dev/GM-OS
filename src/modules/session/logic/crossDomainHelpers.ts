import { gmToast } from '../../../stores/useToastStore';
import type { SessionOSStore } from '../store/index';
import type {
    Campaign, Entity, AtlasMap, WikiEntry, EntityRelation, Acte, Scene, Clue,
} from '../store/types';

export const handleAddChronicle = (
    set: (partial: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => void,
    get: () => SessionOSStore,
    payload: {
        campaign: Omit<Campaign, 'id'> & { id?: string };
        entities: (Omit<Entity, 'id' | 'campaignId' | 'relations'> & {
            relations?: { targetName: string; type: EntityRelation['type']; description: string }[];
        })[];
        atlasMaps: Omit<AtlasMap, 'id' | 'campaignId'>[];
        wikiEntries: Omit<WikiEntry, 'id' | 'campaignId'>[];
        existingCampaignId?: string;
    }
) => {
    const { campaign, entities, atlasMaps, wikiEntries, existingCampaignId } = payload;
    const state = get();
    const existing = existingCampaignId 
        ? state.campaigns.find(c => c.id === existingCampaignId)
        : state.campaigns.find(c => c.name.toLowerCase() === campaign.name.toLowerCase());
        
    const campaignId = existing ? existing.id : `c-${Date.now()}`;

    const entityIdMap: Record<string, string> = {};
    const newEntities: Entity[] = entities.map((e) => {
        const id = `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        if (e.name) {
            entityIdMap[e.name] = id;
        }
        return { ...e, id, campaignId, relations: [] } as Entity;
    });

    newEntities.forEach((entity, idx) => {
        const rawRelations = entities[idx].relations ?? [];
        entity.relations = rawRelations.map((r) => ({
            targetId: r.targetName ? (entityIdMap[r.targetName as string] ?? '') : '',
            targetType: 'npc' as const,
            type: r.type as EntityRelation['type'],
            description: r.description,
        })).filter((r) => r.targetId);
    });

    const newAtlasMaps: AtlasMap[] = atlasMaps.map((m) => ({
        ...m,
        id: `am-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        campaignId,
        linkedEntities: [],
    } as unknown as AtlasMap));

    const newWikiEntries: WikiEntry[] = wikiEntries.map((w) => ({
        ...w,
        id: `we-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        campaignId,
    } as unknown as WikiEntry));

    /*
      **Le jeu d'une campagne existante ne se réécrit pas, relevé le 2026-08-15.**

      La ligne d'avant faisait `system: campaign.system || c.system`, et
      `campaign.system` vaut TOUJOURS le pilote choisi dans la Forge — `startForge`
      le rend obligatoire. Enrichir « Agents de Dune » avec le sélecteur resté sur
      Alien changeait donc le jeu de la campagne, donc le pilote de tous ses PNJ
      (`piloteDuPersonnage`, troisième source), leurs jets et leur modèle de santé.
      Sans un mot.

      La campagne garde le sien. On ne l'adopte que si elle n'en avait aucun — une
      campagne orpheline rattachée à un jeu est un gain, une campagne déclarée
      qu'on rebaptise est une perte. Et la divergence se dit, parce qu'elle
      signale presque toujours un sélecteur oublié.
    */
    const systemeDivergent = !!existing && !!existing.system
        && !!campaign.system && existing.system !== campaign.system;

    set((state) => {
        const updatedCampaigns = existing
            ? state.campaigns.map(c => c.id === existing.id ? { ...c, system: c.system || campaign.system } : c)
            : [...state.campaigns, { ...campaign, id: campaignId, activeLocationIds: [] } as unknown as Campaign];

        return {
            campaigns: updatedCampaigns,
            entities: [...state.entities, ...newEntities],
            atlasMaps: [...state.atlasMaps, ...newAtlasMaps],
            wikiEntries: [...state.wikiEntries, ...newWikiEntries],
            activeCampaignId: campaignId,
            currentView: 'cockpit',
        };
    });

    const msg = existing
        ? `Chronique fusionnée avec "${existing.name}". ${newEntities.length} entités ajoutées.`
        : `Chronique "${campaign.name}" importée avec ${newEntities.length} entités.`;
    gmToast(msg, 'success');

    if (systemeDivergent) {
        gmToast(
            `"${existing!.name}" reste sur son jeu (${existing!.system}) — la Forge a produit `
            + `pour ${campaign.system}. Les nouveaux PNJ suivront le jeu de la campagne.`,
            'warning',
        );
    }
};


/**
 * Ce que la Forge de campagne dépose dans le magasin.
 *
 * Volontairement **plat et déjà résolu** : tous les identifiants ont été
 * attribués par `ecrireLaCampagne`, et les renvois pointent déjà les uns vers les
 * autres. Ce gestionnaire ne décide de rien — il applique. C'est ce qui permet
 * de montrer au meneur exactement ce qui va se passer avant qu'il ne valide.
 */
export interface CampagneForgee {
    campaignId: string;
    campagne?: { creee: boolean; champs: Partial<Campaign> };
    actes: Acte[];
    scenes: Scene[];
    entities: Entity[];
    atlasMaps: AtlasMap[];
    wikiEntries: WikiEntry[];
    clues: Clue[];
    liensSurExistants: { entityId: string; relation: EntityRelation }[];
}

/**
 * Écrit une campagne forgée, **sans jamais écraser ce qui existe**.
 *
 * **La règle, et elle vaut pour tout ce gestionnaire :** on ajoute, on ne
 * remplace pas. Sur une campagne existante, seuls les champs *vides* se
 * remplissent — un synopsis que le meneur a retravaillé survit à une seconde
 * forge, et le `system` suit la règle posée le 2026-08-15 : la campagne garde le
 * sien, on ne l'adopte que si elle n'en avait aucun.
 *
 * *Si retravailler une campagne efface le travail de la semaine précédente, le
 * meneur cessera de retravailler.*
 */
export const handleAppliquerLaCampagneForgee = (
    set: (partial: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => void,
    get: () => SessionOSStore,
    ecriture: CampagneForgee,
) => {
    const { campaignId, campagne, liensSurExistants } = ecriture;
    const existante = get().campaigns.find(c => c.id === campaignId);

    set((state) => {
        const campaigns = existante
            ? state.campaigns.map(c => c.id === campaignId
                ? {
                    ...c,
                    // `||` et non `??` : une chaîne vide est un champ à remplir,
                    // pas une valeur que quelqu'un a choisie.
                    description: c.description || campagne?.champs.description || '',
                    synopsis: c.synopsis || campagne?.champs.synopsis || '',
                    system: c.system || campagne?.champs.system || '',
                }
                : c)
            : [
                ...state.campaigns,
                {
                    id: campaignId,
                    name: campagne?.champs.name ?? 'Campagne sans nom',
                    system: campagne?.champs.system ?? '',
                    description: campagne?.champs.description ?? '',
                    synopsis: campagne?.champs.synopsis ?? '',
                    activeLocationIds: [],
                } as Campaign,
            ];

        // Les liens venus de la Forge s'AJOUTENT à ceux que le meneur a posés.
        const entities = liensSurExistants.length === 0
            ? [...state.entities, ...ecriture.entities]
            : [
                ...state.entities.map(e => {
                    const ajouts = liensSurExistants.filter(l => l.entityId === e.id);
                    return ajouts.length === 0
                        ? e
                        : { ...e, relations: [...(e.relations ?? []), ...ajouts.map(l => l.relation)] };
                }),
                ...ecriture.entities,
            ];

        return {
            campaigns,
            entities,
            actes: [...state.actes, ...ecriture.actes],
            scenes: [...state.scenes, ...ecriture.scenes],
            atlasMaps: [...state.atlasMaps, ...ecriture.atlasMaps],
            wikiEntries: [...state.wikiEntries, ...ecriture.wikiEntries],
            clues: [...state.clues, ...ecriture.clues],
            activeCampaignId: campaignId,
        };
    });

    gmToast(
        `${ecriture.actes.length} actes, ${ecriture.scenes.length} scènes, `
        + `${ecriture.entities.length} personnages écrits dans la campagne.`,
        'success',
    );
};

export const handleGenerateEntityPortrait = async (
    set: (partial: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => void,
    get: () => SessionOSStore,
    entityId: string, 
    instructions?: string
) => {
    const entity = get().entities.find((e) => e.id === entityId);
    if (!entity) return;
    set({ isGeneratingAIImage: true });
    try {
        const { aiService } = await import('../../ai/AIService');
        const cleanDesc = (entity.description || '').replace(/\n/g, ' ').substring(0, 300);
        const prompt = instructions ?? `A professional fantasy RPG character portrait of ${entity.name}. ${cleanDesc}. High quality digital art, cinematic lighting, 8k.`;
        const mediaId = await aiService.generateImage(prompt);
        get().updateEntity(entityId, { avatar: mediaId });
    } catch (err) {
        console.error('AI Portrait Error:', err);
    } finally {
        set({ isGeneratingAIImage: false });
    }
};

export const handleGenerateAtlasMapImage = async (
    set: (partial: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => void,
    get: () => SessionOSStore,
    mapId: string, 
    instructions?: string
) => {
    const map = get().atlasMaps.find((m) => m.id === mapId);
    if (!map) return;
    set({ isGeneratingAIImage: true });
    try {
        const { aiService } = await import('../../ai/AIService');
        const cleanDesc = (map.narrativeDescription || '').replace(/\n/g, ' ').substring(0, 300);
        const prompt = instructions ?? `Fantasy RPG environment art: ${map.name}. ${cleanDesc}. Cinematic, epic scale, high quality.`;
        const mediaId = await aiService.generateImage(prompt);
        get().updateAtlasMap(mapId, { fileUrl: mediaId, isVideo: false });
    } catch (err) {
        console.error('AI Map Error:', err);
    } finally {
        set({ isGeneratingAIImage: false });
    }
};

export const handleGeneratePlayerPortrait = async (
    set: (partial: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => void,
    get: () => SessionOSStore,
    playerId: string, 
    characterId: string, 
    instructions?: string
) => {
    const player = get().players.find((p) => p.id === playerId);
    const char = player?.characters.find((c) => c.id === characterId);
    if (!char) return;
    set({ isGeneratingAIImage: true });
    try {
        const { aiService } = await import('../../ai/AIService');
        const prompt = `A heroic character portrait of ${char.name}. ${char.classRace}. Professional digital art, cinematic lighting, 8k. ${instructions ? `Additional: ${instructions}` : ''}`;
        const mediaId = await aiService.generateImage(prompt);
        get().updateCharacterVisuals(playerId, characterId, { portraitUrl: mediaId });
    } catch (err) {
        console.error('AI Player Portrait Error:', err);
    } finally {
        set({ isGeneratingAIImage: false });
    }
};

export const handleExportActiveCampaignToObsidian = async (
    get: () => SessionOSStore
) => {
    const { obsidianExportService } = await import('../ObsidianExportService');
    const state = get();
    const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
    if (!campaign) return;
    await obsidianExportService.exportCampaign(campaign, state.entities, state.atlasMaps, state.wikiEntries);
};
