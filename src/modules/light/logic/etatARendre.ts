import type { HueLightState } from '../useLightStore';

/**
 * **Ce qu'une lampe doit retrouver quand son effet s'arrête.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CETTE FONCTION EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une boucle d'effet écrit `bri`, `xy` et `on` **directement sur le pont**, en
 * contournant `setLightState` pour ne pas faire rendre React dix fois par
 * seconde. Deux conséquences, et la seconde était un défaut :
 *
 * 1. ✅ Le magasin garde l'état **d'avant l'effet** — c'est ce qui rend la
 *    restauration possible : il suffit de le renvoyer au pont.
 * 2. ⛔ Arrêter l'effet ne faisait que couper la boucle. **La lampe restait à
 *    la valeur où le dernier battement l'avait laissée** — choisir « Fixe » sur
 *    un fantôme pouvait rendre une lampe presque éteinte, et sur un
 *    stroboscope une lampe au minimum, sans que rien ne le dise.
 *
 * *Un état qu'on n'écrit nulle part n'est pas un état qu'on peut rendre — sauf
 * si quelqu'un d'autre l'a gardé. Ici c'est le magasin, et par chance c'est
 * exactement pour la raison inverse qu'il l'a gardé.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA RÈGLE DE L'AMPOULE ÉTEINTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **On n'envoie ni couleur ni brillance à une lampe qu'on éteint** : le pont
 * renvoie une erreur si on modifie une ampoule éteinte. C'est la même règle que
 * `setLightState` applique déjà — *elle est écrite deux fois parce qu'elle est
 * physique, pas parce qu'on l'a oubliée.*
 *
 * @param etat l'état gardé par le magasin, ou `undefined` si la lampe est inconnue
 * @param brillance la fonction qui applique le curseur global
 */
export const etatARendre = (
    etat: HueLightState | undefined,
    brillance: (bri: number) => number,
): Record<string, unknown> => {
    /* *Une restauration qui ne sait pas quoi rendre ne doit rien inventer.* */
    if (!etat) return {};

    const allumee = etat.on !== false;

    /* Un fondu court : on revient d'un effet, pas d'une ambiance. Instantané
       claquerait, cinq secondes feraient traîner la pièce derrière la main. */
    const charge: Record<string, unknown> = { on: allumee, transitiontime: 2 };

    if (allumee) {
        if (typeof etat.bri === 'number') charge.bri = brillance(etat.bri);
        if (etat.xy) charge.xy = etat.xy;
    }

    return charge;
};
