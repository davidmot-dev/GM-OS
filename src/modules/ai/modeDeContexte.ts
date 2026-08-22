import { useSessionOSStore } from '../session/useSessionOSStore';
import { momentDeJeu, type MomentDeJeu } from './budgetsDeTemps';

/**
 * **Le contexte qu'un générateur emporte, et qui le décide — axes F.1 et F.2.**
 *
 * *« Généraliser le motif du générateur de butin : le choix de contexte visible
 * et surchargeable, pas caché. »* `LootGeneratorPanel` était **le seul endroit
 * où le choix était conscient et offert au meneur** ; ailleurs il tombait sur un
 * réglage global que personne ne regarde.
 *
 * **Un opt-in, et pas un défaut global.** Changer le repli de
 * `prepareSystemPrompt` aurait allégé *tout* ce qui ne déclare rien — y compris
 * un futur chemin de questions qui aurait alors cherché dans un corpus vide sans
 * que personne le demande. C'est exactement le défaut qu'on a passé le 22/08 à
 * réparer. **Les générateurs demandent l'allègement ; l'Oracle et le Cortex ne
 * le demandent pas**, et leur silence ne peut donc pas leur nuire.
 *
 * **Décision de David, 2026-08-22** : le moment de jeu décide pour le butin, les
 * PNJ, la narration et la voix — *pas pour ce qui répond à une question de
 * règle.* Une réponse rapide et fausse ne vaut rien.
 */

/**
 * Faut-il alléger le contexte, faute d'un choix explicite ?
 *
 * En partie, oui : le meneur attend, ses joueurs avec lui, et un générateur de
 * butin n'a pas besoin de toute la campagne pour proposer trois objets.
 * **La pause le remet à « non »**, comme elle lève les plafonds.
 */
export function contexteAllegeParDefaut(
    sessions: readonly { status?: string; pausedAt?: number }[] | undefined,
): boolean {
    return momentDeJeu(sessions) === 'partie';
}

/**
 * Ce que l'écran dit du mode — **axe F.5.**
 *
 * *« Afficher le mode là où il agit, pas seulement dans le cockpit : si la Forge
 * se comporte différemment parce qu'une session est ouverte, c'est la Forge qui
 * doit le dire, avec le moyen de passer outre. Sinon on recrée l'action à
 * distance qu'on cherche à éviter. »*
 */
export function libelleDuMode(allege: boolean, moment: MomentDeJeu): string {
    if (allege) {
        return moment === 'partie'
            ? 'Contexte allégé — séance ouverte'
            : 'Contexte allégé';
    }
    return moment === 'partie'
        ? 'Contexte complet — malgré la séance'
        : 'Contexte complet';
}

/** Ce que le meneur voit et peut renverser. */
export interface ModeDeContexte {
    /** Le contexte part-il allégé ? */
    allege: boolean;
    /** Le moment, pour dire **pourquoi** c'est le cas. */
    moment: MomentDeJeu;
    /** Vrai quand la séance ouverte est la raison du choix courant. */
    imposeParLaSeance: boolean;
    libelle: string;
}

/**
 * L'état du mode pour un écran, **surcharge comprise**.
 *
 * `surcharge` est le choix explicite du meneur — `undefined` tant qu'il n'a rien
 * dit. *Une surcharge qui ne se distingue pas du défaut ne peut plus revenir au
 * défaut*, et le meneur perdrait le suivi automatique du moment.
 */
export function modeDeContexte(
    sessions: readonly { status?: string; pausedAt?: number }[] | undefined,
    surcharge?: boolean,
): ModeDeContexte {
    const moment = momentDeJeu(sessions);
    const defaut = contexteAllegeParDefaut(sessions);
    const allege = surcharge ?? defaut;
    return {
        allege,
        moment,
        imposeParLaSeance: surcharge === undefined && defaut,
        libelle: libelleDuMode(allege, moment),
    };
}

/** La même chose, branchée sur le magasin — pour les écrans. */
export function useModeDeContexte(surcharge?: boolean): ModeDeContexte {
    const sessions = useSessionOSStore(e => e.sessions);
    return modeDeContexte(sessions, surcharge);
}

/** Hors écran : ce que les services passent en `{ lite }`. */
export function contexteAllegeMaintenant(surcharge?: boolean): boolean {
    return modeDeContexte(useSessionOSStore.getState().sessions, surcharge).allege;
}

/**
 * Tente-t-on la **diffusion locale** pour une image — axe F.4 ?
 *
 * *« Jamais de diffusion locale en partie : cloud direct pour les images. »*
 *
 * L'axe D.2 a posé un délai d'abandon de quatre-vingt-dix secondes sur la
 * diffusion locale, et il fallait le poser. Mais en partie, ces quatre-vingt-dix
 * secondes sont **de l'attente avant même de commencer** — le repli distant
 * répond en quelques secondes — et pendant tout ce temps la diffusion occupe
 * l'unique créneau de `NUM_PARALLEL: 1`, *donc l'Oracle et le Cortex avec elle.*
 * **Un plafond empêche le blocage sans fin ; il ne rend pas l'attente
 * acceptable.**
 *
 * **Elle vit ici et non dans `AIService` parce qu'un test doit pouvoir
 * l'observer.** Écrite sur place, la condition ne se testait qu'en la
 * réimplémentant — et la vérification dans les deux sens l'a montré : remettre
 * le défaut ne faisait échouer aucun test. *Un correctif qu'aucun test ne tient
 * n'est pas un correctif.*
 */
export function tenterLaDiffusionLocale(
    sessions: readonly { status?: string; pausedAt?: number }[] | undefined,
): boolean {
    return momentDeJeu(sessions) !== 'partie';
}
