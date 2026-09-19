import type { LightScene } from '../useLightStore';
import type { VarianteDEffet } from './varianteDEffet';

/** La part de Light-OS qui entre dans une sauvegarde. */
export interface TuilesDurables {
    scenes: Record<string, LightScene>;
    variantes: VarianteDEffet[];
    defaultSceneId: string | null;
}

/**
 * **Ce que Light-OS met dans une sauvegarde — et rien d'autre.**
 *
 * ⛔ **Cette fonction existe pour qu'il n'y ait pas deux listes.** Il en faut
 * une pour *construire* la charge utile et une pour savoir *quand* armer la
 * sauvegarde ; recopiées à la main, elles divergent — et l'écart serait muet
 * dans les deux sens : un champ sauvegardé que rien n'arme ne part jamais, un
 * champ armé que rien ne sauvegarde arme pour rien.
 *
 * *`SessionService` porte déjà la cicatrice de ce motif, six fois.*
 *
 * ⚠️ **Elle rend les références telles quelles**, sans copie : c'est ce qui
 * permet à l'abonnement de comparer par identité. Zustand ne fabrique un nouvel
 * objet `scenes` que lorsqu'une tuile change vraiment.
 *
 * **Ce qui n'y est pas est délibéré** : le curseur global, le temps de
 * transition, la synchro des modules et l'état du pont décrivent *la pièce où
 * l'on joue*, pas l'univers. Et `lights` est ce que le pont rapporte — ça
 * change dix fois par seconde sous un effet.
 */
export const tuilesDurables = (etat: TuilesDurables): TuilesDurables => ({
    scenes: etat.scenes,
    variantes: etat.variantes,
    defaultSceneId: etat.defaultSceneId,
});

/** Les champs surveillés, déduits de la fonction ci-dessus. */
export const CHAMPS_DURABLES_LUMIERE = Object.keys(
    tuilesDurables({ scenes: {}, variantes: [], defaultSceneId: null }),
) as (keyof TuilesDurables)[];
