import { fusionnerUnInstantane } from '../../../logic/fusionDInstantane';

/** Une piste d'ambiance, vue par la fusion. */
export interface PisteFusionnable {
    id: string;
    url?: string | null;
}

/**
 * **Les huit pistes après qu'on a restauré l'ambiance d'une séance.**
 *
 * ⛔ Quatrième exemplaire du même défaut : `set({ tracks: instantané })`
 * remplaçait les huit pistes en bloc. Une piste rangée après la prise de
 * l'instantané se faisait donc écraser par une piste vide — *et une piste vide
 * ne dit pas qu'elle a remplacé quelque chose.*
 *
 * La règle commune vit dans `src/logic/fusionDInstantane.ts`. Ce qui est propre
 * à Ambient-OS tient en un champ : une piste porte du travail quand elle a une
 * **URL**. Pas de propriétaire — les pistes ne sont pas rattachées à une
 * campagne.
 */
export function pistesApresInstantane<T extends PisteFusionnable>(
    actuelles: readonly T[],
    venues: readonly T[] | undefined | null,
): T[] {
    return fusionnerUnInstantane(actuelles, venues, {
        cle: p => p.id,
        porteDuTravail: p => !!p.url,
    });
}
