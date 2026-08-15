/**
 * Session-OS Store — Trame Slice
 *
 * Les actes et les scènes d'une campagne. Voir `src/types/trame.types.ts` pour
 * le modèle et ce qu'il ne contient délibérément pas.
 *
 * @module session/store/trameSlice
 */

import type { StateCreator } from 'zustand';
import type { Acte, Scene, OrigineDeScene } from '../../../types/trame.types';
import { actesOrdonnes, scenesOrdonnees, prochainOrdre, deplacer } from '../logic/trame';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface TrameSliceState {
    actes: Acte[];
    scenes: Scene[];
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface TrameSliceActions {
    /** Rend l'identifiant attribué : l'écran a besoin d'ouvrir ce qu'il vient de créer. */
    ajouterActe: (campaignId: string, titre: string) => string;
    modifierActe: (id: string, updates: Partial<Omit<Acte, 'id' | 'campaignId'>>) => void;
    /** Supprime l'acte **et ses scènes** — voir `scenesEmportees` pour l'annoncer avant. */
    supprimerActe: (id: string) => void;
    deplacerActe: (id: string, sens: 'haut' | 'bas') => void;

    ajouterScene: (acteId: string, titre: string, origine?: OrigineDeScene) => string;
    modifierScene: (id: string, updates: Partial<Omit<Scene, 'id' | 'campaignId' | 'creeeLe'>>) => void;
    supprimerScene: (id: string) => void;
    deplacerScene: (id: string, sens: 'haut' | 'bas') => void;
    /** Déplace une scène vers un autre acte, à la fin. */
    rattacherSceneAUnActe: (id: string, acteId: string) => void;
}

export type TrameSlice = TrameSliceState & TrameSliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

export const createTrameSlice: StateCreator<TrameSlice, [], [], TrameSlice> = (set, get) => ({
    actes: [],
    scenes: [],

    ajouterActe: (campaignId, titre) => {
        const id = `acte-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const acte: Acte = {
            id,
            campaignId,
            ordre: prochainOrdre(actesOrdonnes(get().actes, campaignId)),
            titre,
            resume: '',
        };
        set((state) => ({ actes: [...state.actes, acte] }));
        return id;
    },

    modifierActe: (id, updates) =>
        set((state) => ({
            actes: state.actes.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),

    /*
      **Cascade, et assumée.** Une scène dont l'acte a disparu n'apparaîtrait sur
      aucun écran tout en pesant dans la base : elle serait perdue *et*
      invisible. On la supprime avec son acte, et c'est l'écran qui annonce le
      nombre avant de demander confirmation — `scenesEmportees` est là pour ça.
    */
    supprimerActe: (id) =>
        set((state) => ({
            actes: state.actes.filter((a) => a.id !== id),
            scenes: state.scenes.filter((s) => s.acteId !== id),
        })),

    deplacerActe: (id, sens) => {
        const acte = get().actes.find((a) => a.id === id);
        if (!acte) return;
        const echange = deplacer(actesOrdonnes(get().actes, acte.campaignId), id, sens);
        if (echange.length === 0) return;
        set((state) => ({
            actes: state.actes.map((a) => {
                const nouveau = echange.find((e) => e.id === a.id);
                return nouveau ? { ...a, ordre: nouveau.ordre } : a;
            }),
        }));
    },

    ajouterScene: (acteId, titre, origine = 'preparee') => {
        const acte = get().actes.find((a) => a.id === acteId);
        // Sans acte, la scène serait orpheline dès sa naissance. On ne crée rien
        // plutôt que de fabriquer un rattachement à un acte inventé.
        if (!acte) return '';

        const id = `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const scene: Scene = {
            id,
            // `campaignId` est repris de l'acte, jamais reçu en paramètre : c'est
            // la seule façon que les deux liens ne se contredisent pas.
            campaignId: acte.campaignId,
            acteId,
            ordre: prochainOrdre(scenesOrdonnees(get().scenes, acteId)),
            titre,
            resume: '',
            origine,
            entiteIds: [],
            indiceIds: [],
            creeeLe: Date.now(),
        };
        set((state) => ({ scenes: [...state.scenes, scene] }));
        return id;
    },

    modifierScene: (id, updates) =>
        set((state) => ({
            scenes: state.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

    supprimerScene: (id) =>
        set((state) => ({
            scenes: state.scenes.filter((s) => s.id !== id),
        })),

    deplacerScene: (id, sens) => {
        const scene = get().scenes.find((s) => s.id === id);
        if (!scene) return;
        const echange = deplacer(scenesOrdonnees(get().scenes, scene.acteId), id, sens);
        if (echange.length === 0) return;
        set((state) => ({
            scenes: state.scenes.map((s) => {
                const nouveau = echange.find((e) => e.id === s.id);
                return nouveau ? { ...s, ordre: nouveau.ordre } : s;
            }),
        }));
    },

    rattacherSceneAUnActe: (id, acteId) => {
        const acte = get().actes.find((a) => a.id === acteId);
        if (!acte) return;
        const ordre = prochainOrdre(scenesOrdonnees(get().scenes, acteId));
        set((state) => ({
            scenes: state.scenes.map((s) =>
                // Les deux liens bougent ensemble : une scène rattachée à l'acte
                // d'une autre campagne sans que `campaignId` suive disparaîtrait
                // de tous les écrans qui filtrent par campagne.
                s.id === id ? { ...s, acteId, campaignId: acte.campaignId, ordre } : s,
            ),
        }));
    },
});
