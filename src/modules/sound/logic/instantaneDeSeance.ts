import { padPorteUnSon, type AtmosphereLisible } from './padPorteUnSon';
import { fusionnerUnInstantane } from '../../../logic/fusionDInstantane';

/** Une atmosphère, vue par la fusion : un identifiant, des pads, un propriétaire. */
export type AtmosphereFusionnable = AtmosphereLisible & {
    id: string;
    campagneId?: string | null;
};

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
 * pad tient un fichier.**
 *
 * ⭐ **Le propriétaire compte ici depuis le soir du 2026-09-19**, quand les
 * atmosphères ont reçu leur `campagneId`. Sans lui, restaurer un instantané
 * d'une campagne pouvait écraser le rangement d'une autre — le défaut que
 * Music-OS portait déjà, et qu'on aurait recréé en ajoutant le rattachement
 * sans y revenir. *Un champ neuf change la réponse de fonctions écrites avant
 * lui.*
 */
export function atmospheresApresInstantane<T extends AtmosphereFusionnable>(
    actuelles: readonly T[],
    venues: readonly T[] | undefined | null,
): T[] {
    return fusionnerUnInstantane(actuelles, venues, {
        cle: a => a.id,
        porteDuTravail: a => Object.values(a?.pads ?? {}).some(padPorteUnSon),
        /* `null` et `undefined` disent la même chose — *commune*. */
        memeProprietaire: (a, v) => (a.campagneId ?? null) === (v.campagneId ?? null),
    });
}
