import { useStoryboardStore, type StoryboardMoment } from '../../storyboard/useStoryboardStore';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useFavoriteStore, type FavoriteEntity } from '../../favorite/useFavoriteStore';
import { useLightStore } from '../../light/useLightStore';

/**
 * **Ce qui appartient à une campagne hors du magasin de session** — lot E2 du
 * chantier des archives (2026-10-19).
 *
 * L'archive `.gmos` emportait la campagne, la trame, les PNJ… et laissait sur la
 * machine d'origine tout ce qui vit dans un autre magasin : les moments de
 * storyboard (qu'une scène désigne), les réserves de table, les combats préparés
 * sur ses scènes, les favoris, les tuiles de Light-OS. Les mêmes que le registre
 * de purge (`services/purge/detenteursDeLaCampagne.ts`) : *une seule idée de ce
 * qui appartient à une campagne*.
 *
 * Chaque satellite **extrait** ce qui porte la campagne, et le **réinjecte** en
 * ne remplaçant que ce qui portait cette campagne : les autres ne bougent pas.
 * Absent d'une archive (une archive d'avant ce jour), il ne touche à rien —
 * `undefined` veut dire « l'archive n'en parle pas », pas « il n'y en a aucun ».
 */

type TuileDeLumiere = ReturnType<typeof useLightStore.getState>['scenes'][string];
type CombatGare = ReturnType<typeof useCombatStore.getState>['combatsGares'][string];
type EtatDesReserves = ReturnType<typeof useRessourcesDeTableStore.getState>['reserves'][string];

export interface SatellitesDeLaCampagne {
    moments?: StoryboardMoment[];
    reservesDeTable?: EtatDesReserves;
    /** Rangés par identifiant de scène, comme dans Combat-OS. */
    combatsGares?: Record<string, CombatGare>;
    favoris?: FavoriteEntity[];
    /** Le râtelier de la campagne (`SCENE_<campagne>_NN`). */
    tuilesDeLumiere?: TuileDeLumiere[];
}

/** Ce qui appartient à la campagne, dans chaque magasin satellite. */
export function extraireLesSatellites(campaignId: string, sceneIds: readonly string[]): SatellitesDeLaCampagne {
    const scenes = new Set(sceneIds);
    const gares = useCombatStore.getState().combatsGares ?? {};
    return {
        moments: useStoryboardStore.getState().moments.filter(m => m.campaignId === campaignId),
        reservesDeTable: useRessourcesDeTableStore.getState().reserves[campaignId],
        combatsGares: Object.fromEntries(Object.entries(gares).filter(([sceneId]) => scenes.has(sceneId))),
        favoris: useFavoriteStore.getState().favorites.filter(f => f.campaignId === campaignId),
        tuilesDeLumiere: Object.values(useLightStore.getState().scenes).filter(t => t.campagneId === campaignId),
    };
}

/**
 * Repose les satellites d'une campagne. Seul ce qui portait CETTE campagne est
 * remplacé ; un satellite absent de l'archive n'est pas touché.
 */
export function injecterLesSatellites(campaignId: string, sceneIds: readonly string[], s: SatellitesDeLaCampagne): void {
    if (s.moments !== undefined) {
        useStoryboardStore.setState(etat => ({
            moments: [...etat.moments.filter(m => m.campaignId !== campaignId), ...s.moments!],
        }));
    }
    if (s.reservesDeTable !== undefined) {
        useRessourcesDeTableStore.setState(etat => ({ reserves: { ...etat.reserves, [campaignId]: s.reservesDeTable! } }));
    }
    if (s.combatsGares !== undefined) {
        const siennes = new Set(sceneIds);
        useCombatStore.setState(etat => {
            const gares = Object.fromEntries(Object.entries(etat.combatsGares ?? {}).filter(([sceneId]) => !siennes.has(sceneId)));
            return { combatsGares: { ...gares, ...s.combatsGares! } };
        });
    }
    if (s.favoris !== undefined) {
        useFavoriteStore.setState(etat => ({
            favorites: [...etat.favorites.filter(f => f.campaignId !== campaignId), ...s.favoris!],
        }));
    }
    if (s.tuilesDeLumiere !== undefined) {
        useLightStore.setState(etat => {
            const scenes = Object.fromEntries(Object.entries(etat.scenes).filter(([, t]) => t.campagneId !== campaignId));
            for (const tuile of s.tuilesDeLumiere!) scenes[tuile.id] = tuile;
            return { scenes };
        });
    }
}
