/**
 * Session-OS Store — Root Assembler (index.ts)
 *
 * Ce fichier assemble tous les slices en un seul store unifié.
 * Il délègue la logique complexe aux services dédiés (SessionManager, SnapshotService).
 *
 * @module session/store/index
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    handleGenerateClueImage,
    handleGenerateEntityPortrait,
    handleGenerateAtlasMapImage,
    handleGeneratePlayerPortrait,
    handleAppliquerLaCampagneForgee,
    handleExportActiveCampaignToObsidian,
    type CampagneForgee,
} from '../logic/crossDomainHelpers';
import { sanitizeSessions } from '../logic/sanitization';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';

import { createCampaignSlice, type CampaignSlice } from './campaignSlice';
import { INITIAL_DATA } from '../data/sessionMocks';
import { createSessionSlice, type SessionSlice } from './sessionSlice';
import { createEntitySlice, type EntitySlice } from './entitySlice';
import { createAtlasSlice, type AtlasSlice } from './atlasSlice';
import { createChronicleSlice, type ChronicleSlice } from './chronicleSlice';
import { createTrameSlice, type TrameSlice } from './trameSlice';
import { createForgeSlice, type ForgeSlice } from './forgeSlice';
import { createUiSlice, type UiSlice } from './uiSlice';
import { createCluesSlice, type CluesSlice } from './cluesSlice';
import { createDeckSlice, type DeckSlice } from './deckSlice';
import { createLootSlice, type LootSlice } from './lootSlice';

import type { SessionModuleSnapshot } from './types';
import { resolveSheetTemplate } from '../logic/templateResolver';

import { SessionManager } from '../logic/SessionManager';
import { fusionnerDeuxScenes, scinderLaSceneAuTemps } from '../logic/curationDeLaTrame';
import { SnapshotService } from '../logic/SnapshotService';
import { PersistenceService, syncStorageAcrossWindows } from '../logic/PersistenceService';
import { lesDonneesDeLaSession, CHAMPS_DURABLES } from '../logic/donneesDeLaSession';
import { sessionBackupManager } from '../logic/SessionBackupManager';
import { useLightStore } from '../../light/useLightStore';
import { useSoundStore } from '../../sound/useSoundStore';
import { tuilesDurables, CHAMPS_DURABLES_LUMIERE } from '../../light/logic/donneesDurables';

// ─────────────────────────────────────────────
// Cross-domain actions type
// ─────────────────────────────────────────────

interface CrossDomainActions {
    lastBackupAt: string | null;
    // Actions déléguées au SessionManager ou SnapshotService
    launchSession: (sessionId: string) => void;
    /** La campagne est finie : sa trame se range avec elle, rien n'est effacé. */
    cloturerLaCampagne: (id: string) => void;
    /** Elle redevient jouable. Sa trame reste telle quelle — voir `rouvrirLaCampagne`. */
    rouvrirLaCampagne: (id: string) => void;
    saveSystemSnapshot: (sessionId: string) => void;
    applySystemSnapshot: (snapshot: SessionModuleSnapshot) => Promise<void>;
    clearDiceRolls: () => void;
    setLastBackupAt: (timestamp: string) => void;

    // Sélecteurs 
    getActiveDriver: () => import('../../../types/drivers').GameDriver | null;
    getBackupData: () => ReturnType<typeof lesDonneesDeLaSession>;

    // Navigation
    navigateToAtlasMap: (id: string | null) => void;
    /**
     * Le groupe se rend à ce lieu — un geste déclaré, jamais déduit d'un clic.
     *
     * Distinct de `navigateToAtlasMap`, qui ne fait plus qu'ouvrir la carte :
     * seul celui-ci écrit dans la chronique, et il marque le lieu visité au
     * passage.
     */
    leGroupeSyRend: (id: string) => void;

    /* ---- Curation de la trame : les deux gestes du § 4.1 ---------------- */

    /**
     * Absorbe une scène dans une autre. **La gardée est celle qu'on désigne.**
     *
     * Déplace aussi ses événements, dans tous les journaux : la trame et le
     * journal ne peuvent pas être d'accord à moitié. Rend combien d'événements
     * ont bougé, ou `null` si la fusion a été refusée.
     */
    fusionnerDeuxScenes: (gardeeId: string, absorbeeId: string) => number | null;
    /**
     * Coupe une scène en deux à partir d'un instant. Rend l'identifiant de la
     * seconde moitié, ou `null`.
     */
    scinderLaSceneAuTemps: (sceneId: string, depuis: number) => string | null;
    navigateToNpcDetail: (id: string) => void;
    navigateToPlayerDetail: (playerId: string, characterId: string) => void;

    // Overrides
    setActiveCampaign: (id: string | null) => void;
    setCurrentView: (view: UiSlice['currentView']) => void;
    setSelectedAtlasMap: (id: string | null) => void;
    autoSelectFirstMap: () => void;
    autoSelectFirstEntity: () => void;

    // AI & Chronicles
    generateEntityPortrait: (entityId: string, instructions?: string) => Promise<void>;
    generateAtlasMapImage: (mapId: string, instructions?: string) => Promise<void>;
    generatePlayerPortrait: (playerId: string, characterId: string, instructions?: string) => Promise<void>;
    /**
     * **L'image d'un indice — le quatrième chemin, 2026-09-15.**
     *
     * Un indice portait déjà un `mediaUrl`, mais il ne se remplissait qu'en
     * piochant dans la médiathèque : c'était **le seul objet illustrable sans
     * générateur**. ⚠️ Il ne demande pas la même chose que les trois autres —
     * une **pièce à conviction**, pas une illustration.
     */
    generateClueImage: (clueId: string, instructions?: string) => Promise<void>;
    /**
     * Écrit une campagne forgée depuis ses fiches.
     *
     * Le seul chemin vers une campagne depuis le 2026-08-16 : elle reçoit un
     * projet déjà résolu, dont tous les renvois pointent les uns vers les
     * autres. `addChronicle`, qui déversait un document en un seul appel et ne
     * connaissait ni actes ni scènes, a été retirée le même jour.
     */
    appliquerLaCampagneForgee: (ecriture: CampagneForgee) => void;
    exportActiveCampaignToObsidian: () => Promise<{ success: boolean; message: string }>;
    reconcileTemplates: () => void;
}

// ─────────────────────────────────────────────
// Full Store Type
// ─────────────────────────────────────────────

export type SessionOSStore = CampaignSlice &
    SessionSlice &
    EntitySlice &
    AtlasSlice &
    ChronicleSlice &
    TrameSlice &
    ForgeSlice &
    UiSlice &
    CluesSlice &
    DeckSlice &
    LootSlice &
    CrossDomainActions;

// ─────────────────────────────────────────────
// Store Assembly
// ─────────────────────────────────────────────

export const useSessionOSStore = create<SessionOSStore>()(
    persist(
        (set, get, api) => ({
            // ── Slice Assembly ──────────────────────────
            ...createCampaignSlice(set as any, get as any, api as any),
            ...createSessionSlice(set as any, get as any, api as any),
            ...createEntitySlice(set as any, get as any, api as any),
            ...createAtlasSlice(set as any, get as any, api as any),
            ...createChronicleSlice(set as any, get as any, api as any),
            ...createTrameSlice(set as any, get as any, api as any),
            ...createForgeSlice(set as any, get as any, api as any),
            ...createUiSlice(set as any, get as any, api as any),
            ...createCluesSlice(set as any, get as any, api as any),
            ...createDeckSlice(set as any, get as any, api as any),
            ...createLootSlice(set as any, get as any, api as any),

            lastBackupAt: null as string | null,

            // ── Data Initialization ──────────────────────
            campaigns: INITIAL_DATA.campaigns,
            sessions: sanitizeSessions(INITIAL_DATA.sessions),
            entities: INITIAL_DATA.entities,
            players: INITIAL_DATA.players,
            atlasMaps: INITIAL_DATA.atlasMaps,
            timelineEvents: INITIAL_DATA.timelineEvents,
            wikiEntries: INITIAL_DATA.wikiEntries,
            clues: INITIAL_DATA.clues,
            activeCampaignId: 'c-1',
            selectedPlayerId: 'p-1',
            selectedAtlasMapId: 'am-1',
            selectedEntityId: 'e-1',

            // ── Cross-domain Overrides (via SessionManager) ──────────

            setActiveCampaign: (id) => SessionManager.setActiveCampaign(set, get, id),
            
            deleteCampaign: (id) => SessionManager.deleteCampaign(set, get, id),

            cloturerLaCampagne: (id) => SessionManager.cloturerLaCampagne(set, get, id),
            rouvrirLaCampagne: (id) => SessionManager.rouvrirLaCampagne(set, get, id),

            setCurrentView: (view) => {
                set({ currentView: view });
                if (view === 'npc-gallery') {
                    set({ isAddingEntity: false, selectedEntityId: null });
                }
            },

            setSelectedAtlasMap: (id) => SessionManager.navigateToAtlasMap(set, get, id),

            navigateToAtlasMap: (id) => SessionManager.navigateToAtlasMap(set, get, id),

            leGroupeSyRend: (id) => SessionManager.leGroupeSyRend(set, get, id),

            fusionnerDeuxScenes: (gardeeId, absorbeeId) =>
                fusionnerDeuxScenes(set, get, gardeeId, absorbeeId)?.evenements ?? null,

            scinderLaSceneAuTemps: (sceneId, depuis) =>
                scinderLaSceneAuTemps(set, get, sceneId, depuis)?.scene.id ?? null,

            navigateToNpcDetail: (id) => {
                set({ 
                    selectedEntityId: id,
                    currentView: 'npc-gallery',
                    isAddingEntity: false 
                });
            },

            navigateToPlayerDetail: (playerId, characterId) => {
                set({
                    selectedPlayerId: playerId,
                    selectedCharacterId: characterId,
                    currentView: 'players'
                });
            },

            autoSelectFirstMap: () => {
                const { atlasMaps, activeCampaignId, selectedAtlasMapId } = get();
                const campaignMaps = atlasMaps.filter((m) => m.campaignId === activeCampaignId);
                const currentMap = atlasMaps.find((m) => m.id === selectedAtlasMapId);
                if (!currentMap || currentMap.campaignId !== activeCampaignId) {
                    set({ selectedAtlasMapId: campaignMaps[0]?.id ?? null });
                }
            },

            autoSelectFirstEntity: () => {
                const { entities, activeCampaignId, selectedEntityId } = get();
                const campaignEntities = entities.filter((e) => e.campaignId === activeCampaignId);
                const currentEntity = entities.find((e) => e.id === selectedEntityId);
                if (!currentEntity || currentEntity.campaignId !== activeCampaignId) {
                    set({ selectedEntityId: campaignEntities[0]?.id ?? null });
                }
            },

            clearDiceRolls: () => set({ diceRolls: [] }),

            // ── Selectors ──────────────────────────────────

            getActiveDriver: () => {
                const { activeCampaignId, campaigns, customGameDrivers } = get();
                const campaign = campaigns.find((c) => c.id === activeCampaignId);
                if (!campaign) return null;
                return (
                    customGameDrivers.find((d) => d.id === campaign.system) ??
                    DEFAULT_GAME_DRIVERS.find((d) => d.id === campaign.system) ??
                    null
                );
            },

            // Troisième copie de la liste, il n'y a pas si longtemps : celle-ci
            // ignorait la trame et les pilotes. Elle délègue désormais comme les
            // deux autres.
            getBackupData: () => lesDonneesDeLaSession(get()),

            // ── Snapshot System (via SnapshotService) ──────

            saveSystemSnapshot: async (sessionId) => {
                const snapshot = await SnapshotService.captureSnapshot();
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId ? { ...s, moduleSnapshot: snapshot } : s
                    ),
                }));
            },

            applySystemSnapshot: async (snapshot) => SnapshotService.applySnapshot(snapshot),

            // ── AI & Chronicles ────────────────────────────

            generateEntityPortrait: async (entityId, instructions) => handleGenerateEntityPortrait(set, get, entityId, instructions),
            generateAtlasMapImage: async (mapId, instructions) => handleGenerateAtlasMapImage(set, get, mapId, instructions),
            generatePlayerPortrait: async (playerId, characterId, instructions) => handleGeneratePlayerPortrait(set, get, playerId, characterId, instructions),
            generateClueImage: async (clueId, instructions) => handleGenerateClueImage(set, get, clueId, instructions),
            appliquerLaCampagneForgee: (ecriture) => handleAppliquerLaCampagneForgee(set, get, ecriture),
            exportActiveCampaignToObsidian: () => handleExportActiveCampaignToObsidian(get),

            // ── Session Operations ─────────────────────────

            setLastBackupAt: (timestamp) => set({ lastBackupAt: timestamp }),

            launchSession: (sessionId) => SessionManager.launchSession(set, get, sessionId),

            /** 
             * Reconcile character templates based on campaign system.
             */
            reconcileTemplates: () => {
                const { players, campaigns, customSheetTemplates } = get();
                const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
                
                let hasChanges = false;
                const newCampaigns = campaigns.map(c => {
                    if (c.system && c.system !== 'generic') {
                        const existsInTemplates = allTemplates.some(t => t.id === c.system);
                        const existsInDrivers = DEFAULT_GAME_DRIVERS.some(d => d.id === c.system) || 
                                               get().customGameDrivers.some(d => d.id === c.system);
                        if (!existsInTemplates && !existsInDrivers) {
                            hasChanges = true;
                            return { ...c, system: 'generic' };
                        }
                    }
                    return c;
                });

                const newPlayers = players.map(p => ({
                    ...p,
                    characters: p.characters.map(char => {
                        if (!char.campaignId) return char;
                        const resolvedTemplate = resolveSheetTemplate(char, newCampaigns, allTemplates);
                        if (char.templateId !== resolvedTemplate.id) {
                            hasChanges = true;
                            return { ...char, templateId: resolvedTemplate.id };
                        }
                        return char;
                    })
                }));

                if (hasChanges) set({ players: newPlayers, campaigns: newCampaigns });
            },
        }),
        // Ne pas redéfinir onRehydrateStorage ici : la clé écraserait celle du
        // spread, et le nettoyage post-réhydratation de PersistenceService
        // (URLs blob périmées, reconcileTemplates) ne s'exécuterait jamais.
        PersistenceService
    )
);

// ── Cross-Window Sync ───────────────────────────
syncStorageAcrossWindows(async () => {
    await useSessionOSStore.persist.rehydrate();
});

// ── Sauvegarde automatique ──────────────────────
/*
  Un changement des données durables **arme** la sauvegarde ; ce sont deux
  minutes sans nouveau changement qui la déclenchent. Un intervalle fixe serait
  soit trop fréquent quand rien ne bouge, soit trop tard quand tout bouge.

  La liste des champs surveillés n'est pas recopiée ici : c'est `CHAMPS_DURABLES`,
  déduite de `lesDonneesDeLaSession`. Ajouter un champ au store le met donc sous
  surveillance sans qu'on ait à y penser — *une liste recopiée ne protège que
  d'elle-même.*
*/
useSessionOSStore.subscribe((etat, precedent) => {
    const apres = lesDonneesDeLaSession(etat);
    const avant = lesDonneesDeLaSession(precedent);
    if (CHAMPS_DURABLES.some(champ => apres[champ] !== avant[champ])) {
        sessionBackupManager.signalerUnChangement();
    }
});

/*
  ⛔ **LES MODULES D'AMBIANCE ARMENT AUSSI, DEPUIS LE 2026-09-19.**

  Light-OS et Sound-OS sont entrés dans la charge utile ce jour-là — ils n'étaient
  dans **aucune** sauvegarde. Mais les y mettre ne suffisait pas : *la donnée
  entrait dans la sauvegarde, et personne ne tirait.* Seul ce magasin-ci armait,
  donc capturer une tuile ou ranger seize pads n'écrivait rien — il fallait
  toucher par ailleurs à sa campagne, ou fermer l'application.

  C'est **le même piège que `databases/` le 15/09** : on vérifie ce qui entre
  dans le fichier, on oublie de vérifier **qui appuie sur le bouton**.

  ⚠️ **ON NE S'ABONNE PAS AUX MAGASINS ENTIERS, ET C'EST TOUT LE SUJET.**
  `useLightStore` change à chaque battement d'effet (`lights` suit le pont) et
  à chaque clic de scène ; `useSoundStore` change à chaque pad qui démarre. Or
  ce qui arme ici **relâche deux minutes de repos avant d'écrire** : un
  abonnement large remettrait le compteur à zéro en permanence, et la
  sauvegarde automatique **ne partirait plus jamais pendant une séance**. *Un
  déclencheur trop sensible ne déclenche rien.*

  On ne surveille donc que ce qui entre vraiment dans le fichier — et la liste
  n'est pas recopiée : elle vient de `tuilesDurables`, celle-là même que
  `construireLaSauvegarde` emploie pour bâtir la charge.
*/
useLightStore.subscribe((etat, precedent) => {
    const apres = tuilesDurables(etat);
    const avant = tuilesDurables(precedent);
    if (CHAMPS_DURABLES_LUMIERE.some(champ => apres[champ] !== avant[champ])) {
        sessionBackupManager.signalerUnChangement();
    }
});

/*
  Sound-OS n'a qu'un champ durable — `atmospheres`, celui que
  `construireLaSauvegarde` emporte. Le volume général et la sortie audio
  décrivent la pièce et ne sont pas sauvegardés : les surveiller armerait pour
  rien.

  ⚠️ `atmospheres` porte aussi `isActive`, qui change à chaque pad déclenché.
  C'est accepté : ça arme un peu large, *et armer large est le bon côté de
  l'erreur* — au pire on écrit une sauvegarde de plus.
*/
useSoundStore.subscribe((etat, precedent) => {
    if (etat.atmospheres !== precedent.atmospheres) {
        sessionBackupManager.signalerUnChangement();
    }
});
