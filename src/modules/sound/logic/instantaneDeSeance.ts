import { padPorteUnSon, type AtmosphereLisible } from './padPorteUnSon';
import { fusionnerUnInstantane } from '../../../logic/fusionDInstantane';

/** Une atmosphère, vue par la fusion : un identifiant et des pads. */
export type AtmosphereFusionnable = AtmosphereLisible & { id: string };

/**
 * **Les atmosphères après qu'on a restauré l'ambiance d'une séance.**
 *
 * ⛔ Le jumeau du défaut de Light-OS : `set({ atmospheres: instantané })`
 * remplaçait la liste entière, et une atmosphère rangée **après** la prise de
 * l'instantané n'y figure pas — elle disparaissait donc avec ses seize pads,
 * leurs fichiers, leurs notes MIDI et leurs touches.
 *
 * La règle commune vit dans `src/logic/fusionDInstantane.ts`. Ce qui est propre
 * à Sound-OS tient en une phrase : **une atmosphère porte du travail quand un
 * pad tient un fichier.** Il n'y a pas de propriétaire ici — les atmosphères ne
 * sont pas encore rattachées à une campagne.
 */
export function atmospheresApresInstantane<T extends AtmosphereFusionnable>(
    actuelles: readonly T[],
    venues: readonly T[] | undefined | null,
): T[] {
    return fusionnerUnInstantane(actuelles, venues, {
        cle: a => a.id,
        porteDuTravail: a => Object.values(a?.pads ?? {}).some(padPorteUnSon),
    });
}
