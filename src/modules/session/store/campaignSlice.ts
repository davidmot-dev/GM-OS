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

    updateCampaign: (id, updates) =>
        set((state) => ({
            campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

    deleteCampaign: (id) => {
        const campaign = get().campaigns.find((c) => c.id === id);
        set((state) => ({
            campaigns: state.campaigns.filter((c) => c.id !== id),
            activeCampaignId: state.activeCampaignId === id ? null : state.activeCampaignId,
        }));
        if (campaign) gmToast(`Campagne "${campaign.name}" supprimée.`, 'info');
    },

    updateCampaignLayout: (campaignId, layout) =>
        set((state) => ({
            campaigns: state.campaigns.map((c) =>
                c.id === campaignId
                    ? { ...c, layoutConfig: { ...(c.layoutConfig ?? {}), ...layout } as LayoutConfig }
                    : c
            ),
        })),

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
});
