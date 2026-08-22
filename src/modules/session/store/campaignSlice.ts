/**
 * Session-OS Store — Campaign Slice
 *
 * Gère les données de campagne :
 * - Liste des campagnes (CRUD)
 * - Campagne active
 * - Configuration de layout associée
 *
 * @module session/store/campaignSlice
 */

import type { StateCreator } from 'zustand';
import { gmToast } from '../../../stores/useToastStore';
import type { Campaign, LayoutConfig } from './types';
import { momentDeJeu } from '../../ai/budgetsDeTemps';
import { sessionBackupManager } from '../logic/SessionBackupManager';
import { useObsidianStore } from '../useObsidianStore';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface CampaignSliceState {
    campaigns: Campaign[];
    activeCampaignId: string | null;
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface CampaignSliceActions {
    setActiveCampaign: (id: string | null) => void;
    addCampaign: (campaign: Omit<Campaign, 'id'>) => void;
    updateCampaign: (id: string, updates: Partial<Campaign>) => void;
    deleteCampaign: (id: string) => void;
    updateCampaignLayout: (campaignId: string, layout: Partial<LayoutConfig>) => void;
    toggleActiveLocation: (mapId: string) => void;
    freezeGraphLayout: (campaignId: string, positions: Record<string, { x: number; y: number }>) => void;
    unfreezeGraphLayout: (campaignId: string) => void;
    resetGraphLayout: (campaignId: string) => void;
}

export type CampaignSlice = CampaignSliceState & CampaignSliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

export const createCampaignSlice: StateCreator<CampaignSlice, [], [], CampaignSlice> = (set, get) => ({
    // Initial State
    campaigns: [],
    activeCampaignId: null,

    // Actions
    setActiveCampaign: (id) => set({ activeCampaignId: id }),

    addCampaign: (campaign) => {
        const newCampaign: Campaign = {
            ...campaign,
            id: `c-${Date.now()}`,
            activeLocationIds: campaign.activeLocationIds ?? [],
        };
        set((state) => ({ campaigns: [...state.campaigns, newCampaign] }));
        gmToast(`Campagne "${newCampaign.name}" créée.`, 'success');
    },

    updateCampaign: (id, updates) => {
        console.log(`[CampaignSlice] Updating campaign ${id}:`, updates);
        
        // Sync Obsidian Vault if this is the active campaign and obsidianPath is being updated
        if (id === get().activeCampaignId && updates.obsidianPath) {
            useObsidianStore.getState().setVaultPath(updates.obsidianPath);
        }

        set((state) => ({
            campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
    },

    deleteCampaign: async (id) => {
        const campaign = get().campaigns.find((c) => c.id === id);
        
        // Safety Backup before deletion
        await sessionBackupManager.triggerImmediateBackup();

        set((state) => ({
            campaigns: state.campaigns.filter((c) => c.id !== id),
            activeCampaignId: state.activeCampaignId === id ? null : state.activeCampaignId,
        }));
        if (campaign) gmToast(`Campagne "${campaign.name}" supprimée.`, 'info');
    },

    /*
      **Deux dispositions, une par moment de jeu — axe N.**

      *« On retrouve son atelier tel qu'on l'a laissé le samedi matin, et sa
      table telle qu'on l'a laissée le samedi soir. »* Le champ existait déjà et
      était persisté par campagne : le dédoubler livre l'essentiel du bénéfice
      pour très peu de code, ce que le plan relevait.

      **Le moment se lit ici, à l'écriture, et non chez l'appelant.** Le passer
      en argument aurait fait autant d'endroits à tenir d'accord que d'appelants
      — et il n'en faut qu'un qui l'oublie pour écrire la disposition de table
      par-dessus celle de l'atelier.
    */
    updateCampaignLayout: (campaignId, layout) =>
        set((state) => {
            /*
              **Le magasin est composé : `state` porte les séances à
              l'exécution, mais ce découpage ne les déclare pas.** Importer le
              magasin complet ici ferait un cycle — c'est pourquoi les autres
              tranches lisent de la même façon. Le repli sur une liste vide rend
              « préparation », donc l'ancien comportement.
            */
            const seances = (state as unknown as { sessions?: { status?: string; pausedAt?: number }[] }).sessions;
            const enPartie = momentDeJeu(seances) === 'partie';
            return {
                campaigns: state.campaigns.map((c) => {
                    if (c.id !== campaignId) return c;
                    // Faute de disposition de table, on part de celle de
                    // l'atelier : un régime qui démarre nu est une perte.
                    const base = enPartie ? (c.layoutConfigPartie ?? c.layoutConfig) : c.layoutConfig;
                    const fusion = { ...(base ?? {}), ...layout } as LayoutConfig;
                    return enPartie
                        ? { ...c, layoutConfigPartie: fusion }
                        : { ...c, layoutConfig: fusion };
                }),
            };
        }),

    toggleActiveLocation: (mapId) => {
        const { activeCampaignId, campaigns } = get();
        if (!activeCampaignId) return;

        const campaign = campaigns.find((c) => c.id === activeCampaignId);
        if (!campaign) return;

        const activeLocationIds = campaign.activeLocationIds || [];
        const isPinned = activeLocationIds.includes(mapId);

        const newIds = isPinned
            ? activeLocationIds.filter((id) => id !== mapId)
            : [...activeLocationIds, mapId];

        set((state) => ({
            campaigns: state.campaigns.map((c) =>
                c.id === activeCampaignId ? { ...c, activeLocationIds: newIds } : c
            ),
        }));

        gmToast(
            isPinned ? 'Lieu retiré des favoris.' : 'Lieu épinglé au cockpit.',
            isPinned ? 'info' : 'success'
        );
    },

    freezeGraphLayout: (campaignId, positions) =>
        set((state) => ({
            campaigns: state.campaigns.map((c) =>
                c.id === campaignId ? { ...c, nodePositions: positions, isGraphLocked: true } : c
            ),
        })),

    unfreezeGraphLayout: (campaignId) =>
        set((state) => ({
            campaigns: state.campaigns.map((c) =>
                c.id === campaignId ? { ...c, isGraphLocked: false } : c
            ),
        })),

    resetGraphLayout: (campaignId) =>
        set((state) => ({
            campaigns: state.campaigns.map((c) =>
                c.id === campaignId ? { ...c, nodePositions: undefined, isGraphLocked: false } : c
            ),
        })),
});
