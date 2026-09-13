import type { StoryboardMoment } from './useStoryboardStore';

/**
 * **Ce qu'un moment pose à l'écran : une image, un diaporama, ou rien.**
 *
 * Les deux champs visent **la même place** — l'écran de `imageTarget`. Un moment
 * qui porterait les deux les enverrait l'un après l'autre, et le second
 * effacerait le premier une demi-seconde après l'avoir posé : *à la table, ça ne
 * ressemble pas à une erreur de saisie, ça ressemble à une panne.*
 *
 * L'écran d'édition n'en laisse choisir qu'un. Mais un moment peut arriver
 * autrement — un import Nexus, une sauvegarde ancienne, un fichier modifié à la
 * main — et *un écran qui interdit quelque chose ne l'empêche que chez lui.*
 *
 * ⚠️ **Le diaporama l'emporte, et ce n'est pas un tirage au sort.**
 * `imageMediaId` existe depuis toujours, `diaporamaId` depuis le 2026-09-13 :
 * un moment qui porte les deux est presque toujours un moment d'image auquel on
 * a **ajouté** un diaporama. *On garde l'intention la plus récente.*
 */
export type PoseDuMoment =
    | { quoi: 'rien' }
    | { quoi: 'image'; mediaId: string }
    | { quoi: 'diaporama'; diaporamaId: string };

export function imageOuDiaporama(
    moment: Pick<StoryboardMoment, 'imageMediaId' | 'diaporamaId'>,
): PoseDuMoment {
    if (moment.diaporamaId) return { quoi: 'diaporama', diaporamaId: moment.diaporamaId };
    if (moment.imageMediaId) return { quoi: 'image', mediaId: moment.imageMediaId };
    return { quoi: 'rien' };
}

/**
 * **Ce moment occupe-t-il un écran ?**
 *
 * C'est la question que pose l'extinction du moment précédent : *il faut
 * éteindre ce qu'on ne reprend pas.* Elle valait `!!moment.imageMediaId` tant
 * qu'une image était la seule chose qu'un moment pouvait poser.
 */
export function occupeUnEcran(
    moment: Pick<StoryboardMoment, 'imageMediaId' | 'diaporamaId'>,
): boolean {
    return imageOuDiaporama(moment).quoi !== 'rien';
}
