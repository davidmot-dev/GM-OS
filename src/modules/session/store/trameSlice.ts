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
import type { GameSession } from '../../../types/session.types';
import {
    actesOrdonnes, scenesOrdonnees, prochainOrdre, deplacer,
    ouvrirLaScene as ouvrir, terminerLaScene as terminer,
    suspendreLesScenes, reprendreLesScenes, clonerLaScene as cloner, titreDisponible,
} from '../logic/trame';

/**
 * Ce que ce slice doit voir chez son voisin, et rien de plus.
 *
 * Les séances désignent un acte et des scènes ; supprimer l'un sans nettoyer
 * l'autre laisserait une séance annoncer un acte qui n'existe plus. On élargit
 * le typage **localement** plutôt que d'importer `SessionSlice` — l'importer
 * fermerait un cycle entre les deux modules, et c'est le geste déjà retenu dans
 * `entitySlice`.
 */
type AvecSeances = TrameSlice & { sessions: GameSession[] };

/** Retire un acte et ses scènes des prévisions de toutes les séances. */
function oublierDansLesSeances(
    sessions: GameSession[],
    { acteId, sceneIds }: { acteId?: string; sceneIds?: Set<string> },
): GameSession[] {
    return sessions.map(s => {
        const perdSonActe = !!acteId && s.acteId === acteId;
        const prevues = s.scenesPrevuesIds ?? [];
        const restantes = sceneIds ? prevues.filter(id => !sceneIds.has(id)) : prevues;
        if (!perdSonActe && restantes.length === prevues.length) return s;
        return {
            ...s,
            ...(perdSonActe ? { acteId: undefined } : {}),
            scenesPrevuesIds: restantes,
        };
    });
}

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

    /* ---- Le parcours réel, depuis le 2026-08-17 ------------------------- */

    /** On y est. Rouvre une scène terminée si c'est elle qu'on désigne. */
    ouvrirLaScene: (id: string, seanceId?: string) => void;
    /** La scène est finie — elle se barre. */
    terminerLaScene: (id: string) => void;
    /** Une scène née en cours de partie, ouverte dans la foulée. Rend son identifiant. */
    creerSceneImprovisee: (acteId: string, titre: string, seanceId?: string) => string;
    /**
     * Une copie du contenu, état de jeu vierge, posée juste après l'originale.
     * Rend son identifiant, ou `''` si la scène source n'existe pas.
     */
    clonerLaScene: (id: string) => string;
    /** Suspend les scènes en cours d'une campagne — la séance s'arrête. */
    suspendreLesScenesDeLaCampagne: (campaignId: string) => void;
    /** Relance les scènes en pause d'une campagne — une séance s'ouvre. */
    reprendreLesScenesDeLaCampagne: (campaignId: string, seanceId: string) => void;
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

    /*
      **Achever un acte termine toutes ses scènes.** Règle de David du
      2026-08-17, et c'est une cascade au même titre que la suppression : le
      nombre s'annonce AVANT, par `scenesACloreAvecLActe`, sinon on découvre
      après coup que six scènes jamais jouées viennent d'être barrées.

      Elle ne se déclenche qu'au **passage** à `acheve` : rééditer le titre d'un
      acte déjà achevé ne doit pas re-terminer des scènes qu'on aurait rouvertes
      depuis. Et l'inverse ne se déduit pas — dé-marquer l'acte ne ressuscite
      rien, parce qu'on ne saurait pas lesquelles ressusciter.
    */
    modifierActe: (id, updates) =>
        set((state) => {
            const avant = state.actes.find((a) => a.id === id);
            const actes = state.actes.map((a) => (a.id === id ? { ...a, ...updates } : a));
            if (!avant || updates.acheve !== true || avant.acheve === true) return { actes };

            const quand = Date.now();
            return {
                actes,
                scenes: state.scenes.map((s) => (s.acteId === id ? terminer(s, quand) : s)),
            };
        }),

    /*
      **Cascade, et assumée.** Une scène dont l'acte a disparu n'apparaîtrait sur
      aucun écran tout en pesant dans la base : elle serait perdue *et*
      invisible. On la supprime avec son acte, et c'est l'écran qui annonce le
      nombre avant de demander confirmation — `scenesEmportees` est là pour ça.
    */
    supprimerActe: (id) =>
        (set as unknown as (fn: (state: AvecSeances) => Partial<AvecSeances>) => void)((state) => {
            const emportees = new Set(state.scenes.filter((s) => s.acteId === id).map((s) => s.id));
            return {
                actes: state.actes.filter((a) => a.id !== id),
                scenes: state.scenes.filter((s) => s.acteId !== id),
                // Une séance qui annoncerait un acte disparu afficherait un vide
                // sans dire pourquoi. On oublie la référence en même temps que
                // sa cible.
                sessions: oublierDansLesSeances(state.sessions ?? [], { acteId: id, sceneIds: emportees }),
            };
        }),

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
        (set as unknown as (fn: (state: AvecSeances) => Partial<AvecSeances>) => void)((state) => ({
            scenes: state.scenes.filter((s) => s.id !== id),
            sessions: oublierDansLesSeances(state.sessions ?? [], { sceneIds: new Set([id]) }),
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

    /* ─────────────────────────────────────────────
       Le parcours réel
       ───────────────────────────────────────────── */

    ouvrirLaScene: (id, seanceId) =>
        set((state) => {
            const quand = Date.now();
            return { scenes: state.scenes.map((s) => (s.id === id ? ouvrir(s, quand, seanceId) : s)) };
        }),

    terminerLaScene: (id) =>
        set((state) => {
            const quand = Date.now();
            return { scenes: state.scenes.map((s) => (s.id === id ? terminer(s, quand) : s)) };
        }),

    /*
      **Improvisée ET ouverte du même geste.** C'est tout l'intérêt : on
      l'improvise parce qu'on y est déjà. Deux actions séparées auraient laissé
      exister l'état « scène improvisée jamais ouverte », qui ne veut rien dire.

      `ajouterScene` refuse déjà un acte inexistant et rend `''` — on suit sa
      décision au lieu de la contredire.
    */
    creerSceneImprovisee: (acteId, titre, seanceId) => {
        // Un homonyme dans la même campagne casserait la résolution par nom de
        // la Forge — « Combat improvisé » deux soirs de suite est le cas le plus
        // probable, et le moins visible.
        const pris = get().scenes
            .filter((s) => s.campaignId === get().actes.find((a) => a.id === acteId)?.campaignId)
            .map((s) => s.titre);
        const id = get().ajouterScene(
            acteId,
            pris.includes(titre) ? titreDisponible(titre, pris) : titre,
            'improvisee',
        );
        if (!id) return '';
        get().ouvrirLaScene(id, seanceId);
        return id;
    },

    clonerLaScene: (id) => {
        const source = get().scenes.find((s) => s.id === id);
        if (!source) return '';

        const voisines = scenesOrdonnees(get().scenes, source.acteId);
        const nouvelId = `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const clone = cloner(
            source,
            nouvelId,
            titreDisponible(source.titre, voisines.map((s) => s.titre)),
            source.ordre + 1,
            Date.now(),
        );

        set((state) => ({
            scenes: [
                // Le clone se pose JUSTE APRÈS son original, pas à la fin : une
                // scène clonée l'est pour être rejouée là où elle est, et la
                // retrouver dix lignes plus bas serait la perdre.
                ...state.scenes.map((s) =>
                    s.acteId === source.acteId && s.ordre > source.ordre ? { ...s, ordre: s.ordre + 1 } : s),
                clone,
            ],
        }));
        return nouvelId;
    },

    suspendreLesScenesDeLaCampagne: (campaignId) =>
        set((state) => ({ scenes: suspendreLesScenes(state.scenes, campaignId, Date.now()) })),

    reprendreLesScenesDeLaCampagne: (campaignId, seanceId) =>
        set((state) => ({ scenes: reprendreLesScenes(state.scenes, campaignId, seanceId, Date.now()) })),
});
