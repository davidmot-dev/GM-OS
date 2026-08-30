import { gmToast } from '../../../stores/useToastStore';
import type { SessionOSStore } from '../store/index';
import type {
    Campaign, Entity, AtlasMap, WikiEntry, EntityRelation, Acte, Scene, Clue,
} from '../store/types';

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

/**
 * **Le verdict de l'export remonte, désormais.**
 *
 * `exportCampaign` rend `{ success, message }` depuis toujours, et ce chemin le
 * jetait : un coffre introuvable, une passerelle absente, une erreur d'écriture
 * — le bouton se comportait à l'identique dans les quatre cas. *Le même motif
 * que la sélection RAG : une donnée calculée puis jetée au dernier étage coûte
 * deux fois.*
 *
 * Le chemin du coffre n'est plus passé d'ici : le service le résout lui-même,
 * pour que l'atelier des règles en bénéficie sans qu'on ait à y penser.
 */
export const handleExportActiveCampaignToObsidian = async (
    get: () => SessionOSStore
): Promise<{ success: boolean; message: string }> => {
    const { obsidianExportService } = await import('../ObsidianExportService');
    const state = get();
    const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
    if (!campaign) return { success: false, message: 'Aucune campagne active.' };
    return obsidianExportService.exportCampaign(campaign, state.entities, state.atlasMaps, state.wikiEntries);
};
