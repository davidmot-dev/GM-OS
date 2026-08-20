import type { Acte, Scene } from '../../types/trame.types';
import { scenesDansLEtat } from '../session/logic/trame';

/**
 * **À quelle scène rattacher un événement que personne n'a rattaché.**
 *
 * Le § 9 du plan du 2026-08-08 l'exige : *« le rattachement doit être
 * automatique, jamais manuel — c'est ce qui rend le regroupement possible après
 * coup. »* Il ne l'était que pour le combat : **29 des 36 émetteurs ne portaient
 * aucune scène**, relevé à la revue du 2026-08-20. La curation scène par scène
 * n'aurait donc eu à ranger que du combat.
 *
 * Posé **au goulot**, dans `addEvent`, et non chez les 36 émetteurs — pour la
 * raison exacte qui y a déjà fait poser la nature : *leur demander à tous de
 * déclarer un axe de plus aurait produit trente oublis.*
 *
 * **Une seule scène ouverte, ou rien.** Quand le groupe s'est séparé, deux
 * scènes sont en cours et l'outil ne peut pas savoir laquelle a produit
 * l'événement. Il ne devine pas : c'est la règle déjà tenue par le bandeau de
 * scène du combat, *« un combat rangé dans la mauvaise scène fausserait le
 * résumé sans jamais se signaler »*. Les événements laissés sans scène ne sont
 * pas perdus — la curation les présente à part, et c'est le seul moment où le
 * meneur peut trancher sans pression de temps.
 */
export function laSceneOuLEvenementSeRange(
    scenes: readonly Scene[],
    actes: readonly Acte[],
    campaignId: string | null | undefined,
): string | undefined {
    const ouvertes = scenesDansLEtat(scenes, actes, campaignId, 'en-cours');
    return ouvertes.length === 1 ? ouvertes[0].id : undefined;
}

/** Le magasin de séance, lu par le global — un import direct fermerait un cycle. */
interface MagasinDeTrame {
    scenes?: Scene[];
    actes?: Acte[];
    activeCampaignId?: string | null;
}

/**
 * La même question, posée au monde réel.
 *
 * Isolée de la fonction pure pour que celle-ci se teste sans fenêtre, et pour
 * qu'une trame en mauvais état n'empêche jamais d'écrire au journal : *un
 * événement sans scène vaut mieux qu'un événement perdu.*
 */
export function laSceneCourante(): string | undefined {
    try {
        const magasin = (window as unknown as {
            useSessionOSStore?: { getState: () => MagasinDeTrame };
        }).useSessionOSStore?.getState();
        if (!magasin) return undefined;
        return laSceneOuLEvenementSeRange(
            magasin.scenes ?? [], magasin.actes ?? [], magasin.activeCampaignId,
        );
    } catch {
        return undefined;
    }
}
