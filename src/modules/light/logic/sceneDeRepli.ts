import type { LightScene } from '../useLightStore';

/**
 * **Vers quoi la lumière retombe quand quelque chose rend la main.**
 *
 * Trois gestes ramènent la pièce à son état de repos, et ils ne visent pas la
 * même chose :
 *
 * - un **retour automatique** (fin d'un son, d'une piste d'ambiance, d'un
 *   flash) vise la dernière scène que le meneur a choisie, et l'**éclairage
 *   normal** seulement s'il n'y en a pas ;
 * - le **Stop All** vise l'éclairage normal directement — *on coupe tout, on ne
 *   revient pas à la scène d'alerte qui jouait il y a trois secondes* ;
 * - l'**extinction d'urgence** ne vise rien : elle éteint.
 *
 * D'où cette fonction, qui ne connaît que la règle commune aux deux premiers :
 * **prendre le premier candidat qui éclaire vraiment quelque chose.**
 *
 * @param scenes Le catalogue des scènes.
 * @param candidats Les scènes visées, de la plus prioritaire à la moins.
 * @returns L'identifiant retenu, ou `null` s'il faut éteindre.
 */
export const sceneDeRepli = (
    scenes: Record<string, LightScene>,
    candidats: Array<string | null | undefined>,
): string | null => {
    for (const id of candidats) {
        if (!id) continue;
        const scene = scenes[id];
        /*
          **Une scène vide n'est pas un repli.** Elle existe — les dix-huit
          existent toujours — mais elle ne porte l'état d'aucune lampe :
          l'appliquer ne changerait rien, et la lumière resterait sur ce que le
          son venait d'installer. *Un repli qui ne fait rien est pire que pas de
          repli : il consomme le tour de celui qui aurait marché.*

          C'est le cas d'une tuile effacée après avoir été désignée par défaut,
          et celui d'un défaut hérité d'une sauvegarde d'une autre table.
        */
        if (!scene || Object.keys(scene.lightStates).length === 0) continue;
        return id;
    }
    return null;
};
