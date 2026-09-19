import { fusionnerUnInstantane } from '../../../logic/fusionDInstantane';

/** Une playlist, vue par la fusion. */
export interface PlaylistFusionnable {
    id: string;
    campagneId?: string | null;
    pads?: readonly { url?: string }[] | null;
}

/**
 * **Les atmosphères musicales après qu'on a restauré l'ambiance d'une séance.**
 *
 * ⛔ Troisième exemplaire du même défaut : `set({ playlists: instantané })`
 * remplaçait la bibliothèque entière. **Et c'est ici qu'il coûtait le plus
 * cher** — les playlists sont rattachées à une campagne depuis le 2026-08-30,
 * donc restaurer une séance d'une campagne pouvait effacer les atmosphères
 * d'une autre, écrites depuis.
 *
 * La règle commune vit dans `src/logic/fusionDInstantane.ts`. Ce qui est propre
 * à Music-OS : une playlist porte du travail quand une de ses pastilles tient
 * une **URL**, et son propriétaire est sa campagne.
 */
export function playlistsApresInstantane<T extends PlaylistFusionnable>(
    actuelles: readonly T[],
    venues: readonly T[] | undefined | null,
): T[] {
    return fusionnerUnInstantane(actuelles, venues, {
        cle: p => p.id,
        porteDuTravail: p => (p.pads ?? []).some(pad => !!pad?.url),
        memeProprietaire: (a, v) => (a.campagneId ?? null) === (v.campagneId ?? null),
    });
}
