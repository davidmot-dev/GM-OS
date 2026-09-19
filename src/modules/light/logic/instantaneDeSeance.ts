import type { LightScene } from '../useLightStore';
import { tuilePorteUnEtat } from './tuilePorteUnEtat';
import { fusionnerUnInstantaneIndexe } from '../../../logic/fusionDInstantane';

/**
 * **Le râtelier après qu'on a restauré l'atmosphère d'une séance.**
 *
 * `applySnapshot` faisait `set({ scenes: instantané.scenes })` — les dix-huit
 * cases, remplacées en bloc. Six mois plus tard, cela effaçait tout ce qui
 * avait été capturé depuis, et depuis le 2026-09-19 le travail des **autres
 * campagnes** avec.
 *
 * La règle — *un instantané ne fait jamais disparaître un travail qui n'est pas
 * le sien* — vit dans `src/logic/fusionDInstantane.ts`, où elle sert aux
 * **quatre** modules d'ambiance qui avaient tous le même trou. Ici on ne dit
 * que ce qui est propre aux tuiles : **porter l'état d'une lampe**, et le
 * rattachement à une campagne.
 */
export function tuilesApresInstantane(
    actuelles: Record<string, LightScene>,
    venues: Record<string, LightScene> | undefined | null,
): Record<string, LightScene> {
    return fusionnerUnInstantaneIndexe(actuelles, venues, {
        porteDuTravail: tuilePorteUnEtat,
        /* `null` et `undefined` disent la même chose — *commune* — et deux
           communes sont bien le même propriétaire. */
        memeProprietaire: (a, v) => (a.campagneId ?? null) === (v.campagneId ?? null),
    });
}
