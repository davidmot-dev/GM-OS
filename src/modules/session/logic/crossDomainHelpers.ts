import { gmToast } from '../../../stores/useToastStore';
import { invitePourUnIndice } from './inviteDImage';
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

/**
 * **Tout ce qui demande une image passe par ici.**
 *
 * ⛔ **Les trois générateurs échouaient EN SILENCE.** Portrait de PNJ, carte
 * d'atlas, portrait de PJ : chacun portait son `try / catch / finally`, et
 * chaque `catch` faisait `console.error` **et rien d'autre** — alors que
 * `gmToast` est importé en tête de ce même fichier et sert vingt lignes plus
 * haut. Clé absente, service indisponible, image rejetée : le meneur cliquait,
 * le voile tournait, s'arrêtait, et **rien ne se passait**.
 *
 * *C'est la panne muette que ce dépôt a déjà payée sur la projection de fiche —
 * quatre mois cassée parce qu'un `catch` avalait l'exception.* Relevé le
 * 2026-09-15 en branchant le quatrième, et corrigé pour les quatre : *je ne
 * voulais pas ajouter un quatrième muet.*
 *
 * ⚠️ **Le message de l'erreur remonte tel quel**, parce qu'il dit quelque
 * chose : `generateImage` lève « Clé API Gemini manquante », « image trop
 * petite pour être vraie », « Bridge Ollama non disponible ». *Un toast
 * générique ne vaudrait guère mieux qu'un silence : il dirait qu'on a échoué
 * sans dire quoi réparer.*
 *
 * ⚠️ **Le voile se lève dans tous les cas** — ce que le `finally` garantissait
 * déjà, et qu'il garantit maintenant une seule fois pour quatre appelants au
 * lieu de quatre fois.
 */
async function demanderUneImage(
    set: (partial: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => void,
    quoi: string,
    invite: string,
    poser: (mediaId: string) => void,
): Promise<void> {
    set({ isGeneratingAIImage: true });
    try {
        const { aiService } = await import('../../ai/AIService');
        poser(await aiService.generateImage(invite));
    } catch (err) {
        const raison = err instanceof Error ? err.message : String(err);
        console.error(`[Image IA] ${quoi} :`, err);
        gmToast(`Image de ${quoi} impossible — ${raison}`, 'warning');
    } finally {
        set({ isGeneratingAIImage: false });
    }
}

export const handleGenerateEntityPortrait = async (
    set: (partial: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => void,
    get: () => SessionOSStore,
    entityId: string, 
    instructions?: string
) => {
    const entity = get().entities.find((e) => e.id === entityId);
    if (!entity) return;

    const cleanDesc = (entity.description || '').replace(/\n/g, ' ').substring(0, 300);
    const prompt = instructions ?? `A professional fantasy RPG character portrait of ${entity.name}. ${cleanDesc}. High quality digital art, cinematic lighting, 8k.`;

    await demanderUneImage(set, `portrait de ${entity.name}`, prompt,
        (mediaId) => get().updateEntity(entityId, { avatar: mediaId }));
};

export const handleGenerateAtlasMapImage = async (
    set: (partial: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => void,
    get: () => SessionOSStore,
    mapId: string, 
    instructions?: string
) => {
    const map = get().atlasMaps.find((m) => m.id === mapId);
    if (!map) return;

    const cleanDesc = (map.narrativeDescription || '').replace(/\n/g, ' ').substring(0, 300);
    const prompt = instructions ?? `Fantasy RPG environment art: ${map.name}. ${cleanDesc}. Cinematic, epic scale, high quality.`;

    await demanderUneImage(set, `carte ${map.name}`, prompt,
        (mediaId) => get().updateAtlasMap(mapId, { fileUrl: mediaId, isVideo: false }));
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

    const prompt = `A heroic character portrait of ${char.name}. ${char.classRace}. Professional digital art, cinematic lighting, 8k. ${instructions ? `Additional: ${instructions}` : ''}`;

    await demanderUneImage(set, `portrait de ${char.name}`, prompt,
        (mediaId) => get().updateCharacterVisuals(playerId, characterId, { portraitUrl: mediaId }));
};

/**
 * **L'image d'un indice — le quatrième chemin, demandé le 2026-09-15.**
 *
 * Un indice portait déjà un `mediaUrl`, mais il ne se remplissait qu'en piochant
 * dans la médiathèque : **c'était le seul objet illustrable qui n'avait pas
 * droit au générateur.**
 *
 * ⚠️ **Et il ne demande pas la même chose que les trois autres.** Eux réclament
 * une illustration ; un indice est **un objet qu'on pose devant un joueur**.
 * Le registre — la pièce à conviction — vit dans `logic/inviteDImage.ts`, pur et
 * éprouvé, *parce que c'est le choix d'auteur de ce chantier et qu'il mérite
 * d'être lisible ailleurs que noyé dans un gabarit de chaîne.*
 */
export const handleGenerateClueImage = async (
    set: (partial: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => void,
    get: () => SessionOSStore,
    clueId: string,
    instructions?: string,
) => {
    const clue = get().clues.find((c) => c.id === clueId);
    if (!clue) return;

    await demanderUneImage(
        set,
        `« ${clue.title || 'l’indice'} »`,
        invitePourUnIndice(clue, instructions),
        (mediaId) => get().updateClue(clueId, { mediaUrl: mediaId }),
    );
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
