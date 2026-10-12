import type { AtlasMap } from '../../../types/chronicle.types';
import type { Scene } from '../../../types/trame.types';

/**
 * **Le lieu et ses battlemaps** (2026-10-12, L5).
 *
 * *David, devant l'écran de la scène : « il y a plusieurs choses dans les
 * lieux : le lieu même, généralement une image, et des battlemaps qui doivent
 * être chargées dans Map-OS ».* Un lieu-image se **projette** (écran par défaut
 * d'Image-OS) ; une battlemap se **charge** dans Map-OS.
 *
 * Décision du même jour : **les deux** — le lieu propose ses battlemaps (ses
 * liens « lieu » de l'Atlas vers des cartes de type `battlemap`), et la scène
 * peut en **ajouter** (`battlemapIds`) ou en **écarter** (`battlemapsRetirees`).
 */

export const estUneBattlemap = (carte: Pick<AtlasMap, 'type'>): boolean => carte.type === 'battlemap';

/** Les battlemaps que le lieu propose : ses liens vers des cartes de type battlemap. */
export function battlemapsDuLieu(lieu: AtlasMap | undefined, atlas: readonly AtlasMap[]): AtlasMap[] {
    if (!lieu) return [];
    const ids = new Set((lieu.linkedEntities ?? []).map(l => l.mapId).filter((id): id is string => !!id));
    return atlas.filter(m => ids.has(m.id) && m.id !== lieu.id && estUneBattlemap(m));
}

/**
 * **Les battlemaps de la scène** : celles du lieu, moins les écartées, plus les
 * ajoutées — dans cet ordre, sans doublon. Le lieu lui-même n'y figure pas :
 * s'il est une battlemap, l'écran lui donne son propre bouton.
 */
export function battlemapsDeLaScene(
    scene: Pick<Scene, 'lieuId' | 'battlemapIds' | 'battlemapsRetirees'>,
    atlas: readonly AtlasMap[],
): AtlasMap[] {
    const lieu = atlas.find(m => m.id === scene.lieuId);
    const retirees = new Set(scene.battlemapsRetirees ?? []);
    const resultat = battlemapsDuLieu(lieu, atlas).filter(m => !retirees.has(m.id));
    for (const id of scene.battlemapIds ?? []) {
        const carte = atlas.find(m => m.id === id);
        if (carte && carte.id !== lieu?.id && !resultat.some(m => m.id === id)) resultat.push(carte);
    }
    return resultat;
}

const sansVide = (liste: string[]): string[] | undefined => (liste.length > 0 ? liste : undefined);

/** Ajouter une battlemap à la scène : une écartée revient, une autre s'ajoute. */
export function ajouterLaBattlemap(
    scene: Pick<Scene, 'battlemapIds' | 'battlemapsRetirees'>,
    id: string,
): Pick<Scene, 'battlemapIds' | 'battlemapsRetirees'> {
    const retirees = scene.battlemapsRetirees ?? [];
    if (retirees.includes(id)) {
        return { battlemapIds: scene.battlemapIds, battlemapsRetirees: sansVide(retirees.filter(x => x !== id)) };
    }
    const ajoutees = scene.battlemapIds ?? [];
    return {
        battlemapIds: ajoutees.includes(id) ? ajoutees : [...ajoutees, id],
        battlemapsRetirees: scene.battlemapsRetirees,
    };
}

/** Retirer une battlemap de la scène : une ajoutée s'en va, une du lieu est écartée. */
export function retirerLaBattlemap(
    scene: Pick<Scene, 'lieuId' | 'battlemapIds' | 'battlemapsRetirees'>,
    id: string,
    atlas: readonly AtlasMap[],
): Pick<Scene, 'battlemapIds' | 'battlemapsRetirees'> {
    const ajoutees = scene.battlemapIds ?? [];
    const duLieu = battlemapsDuLieu(atlas.find(m => m.id === scene.lieuId), atlas).some(m => m.id === id);
    const retirees = scene.battlemapsRetirees ?? [];
    return {
        battlemapIds: sansVide(ajoutees.filter(x => x !== id)),
        battlemapsRetirees: duLieu && !retirees.includes(id) ? [...retirees, id] : scene.battlemapsRetirees,
    };
}
