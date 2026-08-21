import { useJournalStore } from '../../journal/useJournalStore';
import {
    fusionnerLesScenes, secondeMoitieDeLaScene, scenesOrdonnees, titreDisponible,
} from './trame';
import type { Scene } from '../../../types/trame.types';
import type { GameSession } from '../store/types';

/**
 * **Fusionner et scinder** — les deux derniers gestes du § 4.1 du plan du
 * 2026-08-08, et les seuls qui touchent à la fois la trame et le journal.
 *
 * *« Fusionner deux scènes qui n'en faisaient qu'une, scinder celle qui en
 * cachait deux. »* Les trois autres — nommer, compléter le résumé, jeter —
 * n'écrivent que sur la scène ; ceux-ci **déplacent des événements**, et c'est
 * toute la raison de ce module.
 *
 * **Pourquoi ici et non dans `trameSlice`.** Une fusion qui oublierait le
 * journal laisserait des événements pointer sur une scène disparue. Ils ne
 * seraient pas perdus — `preparerLaRevue` rend les orphelins plutôt que de les
 * faire disparaître — mais ils réapparaîtraient « à ranger » à la revue
 * suivante, c'est-à-dire exactement le travail qu'on venait de faire. Les deux
 * écritures doivent donc partir du même geste, et aucun appelant ne doit
 * pouvoir n'en faire qu'une.
 *
 * Le sens de l'import est le même que celui de `SessionManager` : la session lit
 * le journal, le journal ne lit la session que par le global. Rien ne boucle.
 */

/** Ce que ces opérations doivent voir du store, et rien de plus. */
type MagasinDeTrame = {
    scenes: Scene[];
    sessions?: GameSession[];
};

type Poser = (fn: (state: MagasinDeTrame) => Partial<MagasinDeTrame>) => void;

/**
 * Remplace une scène par une autre dans les prévisions des séances.
 *
 * **Remplacer, et non retirer.** `supprimerScene` oublie la scène partout —
 * c'est juste, elle n'existe plus. Ici elle existe encore, sous un autre
 * identifiant : une séance qui l'avait prévue la prévoit toujours. La retirer
 * ferait disparaître une prévision que personne n'a annulée.
 */
function reporterLesPrevisions(
    sessions: readonly GameSession[], deSceneId: string, versSceneId: string,
): GameSession[] {
    return sessions.map(s => {
        const prevues = s.scenesPrevuesIds ?? [];
        if (!prevues.includes(deSceneId)) return s;
        return {
            ...s,
            // Le `Set` évite le doublon quand la séance prévoyait déjà les deux.
            scenesPrevuesIds: [...new Set(prevues.map(id => (id === deSceneId ? versSceneId : id)))],
        };
    });
}

/** Ce qu'une fusion a réellement fait — de quoi le dire au meneur. */
export interface Fusion {
    scene: Scene;
    /** Combien d'événements ont changé de scène. */
    evenements: number;
}

/**
 * Absorbe `absorbeeId` dans `gardeeId`. Rend ce qui a été fait, ou `null`.
 *
 * **La gardée est celle qu'on a désignée**, jamais la plus ancienne ni la mieux
 * remplie : le meneur clique sur la scène qui survit, et c'est le seul moyen
 * pour lui de savoir d'avance ce qui va se passer.
 *
 * **Trois refus, et ils rendent `null` sans rien écrire :** une scène
 * introuvable, une scène avec elle-même, et deux scènes de campagnes
 * différentes. La dernière est la seule qui ne saute pas aux yeux — l'écran de
 * revue ne montre qu'une campagne à la fois, donc elle ne peut venir que d'un
 * appel fautif, et fusionner deux campagnes mélangerait deux histoires sans
 * qu'aucun écran ne le montre jamais.
 *
 * **Les rangs se resserrent derrière l'absorbée.** Sans cela, l'acte garderait
 * un trou dans sa numérotation ; il ne se verrait pas tout de suite — l'ordre
 * relatif est intact — mais `prochainOrdre` et les déplacements travaillent sur
 * ces nombres, et un trou finit par se payer.
 */
export function fusionnerDeuxScenes(
    set: Poser, get: () => MagasinDeTrame, gardeeId: string, absorbeeId: string,
): Fusion | null {
    if (gardeeId === absorbeeId) return null;

    const etat = get();
    const gardee = etat.scenes.find(s => s.id === gardeeId);
    const absorbee = etat.scenes.find(s => s.id === absorbeeId);
    if (!gardee || !absorbee) return null;
    if (gardee.campaignId !== absorbee.campaignId) return null;

    const fusionnee = fusionnerLesScenes(gardee, absorbee);

    set((state) => ({
        scenes: state.scenes
            .filter(s => s.id !== absorbeeId)
            .map(s => {
                if (s.id === gardeeId) return fusionnee;
                if (s.acteId === absorbee.acteId && s.ordre > absorbee.ordre) {
                    return { ...s, ordre: s.ordre - 1 };
                }
                return s;
            }),
        sessions: reporterLesPrevisions(state.sessions ?? [], absorbeeId, gardeeId),
    }));

    /*
      Le journal APRÈS la trame, et jamais l'inverse. Si l'écriture de la trame
      échouait, des événements auraient déjà changé de scène pour rejoindre une
      fusion qui n'a pas eu lieu — un dégât qu'aucun écran ne montre. Dans cet
      ordre, le pire cas laisse des orphelins, que la revue rend visibles.
    */
    const evenements = useJournalStore.getState()
        .deplacerLesEvenements(gardeeId, e => e.sceneId === absorbeeId);

    return { scene: fusionnee, evenements };
}

/** Ce qu'une scission a produit. */
export interface Scission {
    scene: Scene;
    /** Combien d'événements sont passés dans la seconde moitié. */
    evenements: number;
}

/**
 * Coupe une scène en deux **au temps d'un événement donné**. Rend la seconde
 * moitié, ou `null`.
 *
 * **La coupure se désigne sur le fil, pas dans un formulaire.** Le meneur relit
 * les événements d'une scène et pointe celui qui commence la seconde : tout ce
 * qui vient à partir de cet instant part avec lui. C'est le seul geste qui
 * demande une seule décision — un découpage par sélection multiple en
 * demanderait autant qu'il y a d'événements, et *une dizaine de scènes se revoit
 * en quelques minutes* précisément parce qu'on ne descend pas là.
 *
 * **Le seuil est un instant, pas une liste d'identifiants.** Deux événements
 * peuvent porter le même horodatage — l'ouverture d'un combat et son initiative
 * partent dans la même milliseconde — et ils appartiennent alors au même côté de
 * la coupure, ce qui est juste : ils sont le même moment.
 *
 * **Rien n'est refusé quand la coupure ne déplace rien.** Couper sur le premier
 * événement vide la première moitié et donne tout à la seconde ; c'est un geste
 * sans intérêt mais pas une erreur, et le meneur peut refusionner. *Un outil qui
 * refuse un geste inoffensif oblige à deviner sa règle.*
 */
export function scinderLaSceneAuTemps(
    set: Poser, get: () => MagasinDeTrame, sceneId: string, depuis: number,
): Scission | null {
    const source = get().scenes.find(s => s.id === sceneId);
    if (!source) return null;

    const voisines = scenesOrdonnees(get().scenes, source.acteId);
    const nouvelId = `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const moitie = secondeMoitieDeLaScene(
        source,
        nouvelId,
        titreDisponible(source.titre, voisines.map(s => s.titre)),
        source.ordre + 1,
        Date.now(),
    );

    set((state) => ({
        scenes: [
            // Juste après son originale : les deux moitiés d'un même moment se
            // lisent l'une sous l'autre, sinon la seconde se cherche.
            ...state.scenes.map(s =>
                (s.acteId === source.acteId && s.ordre > source.ordre ? { ...s, ordre: s.ordre + 1 } : s)),
            moitie,
        ],
    }));

    const evenements = useJournalStore.getState()
        .deplacerLesEvenements(nouvelId, e => e.sceneId === sceneId && e.timestamp >= depuis);

    return { scene: moitie, evenements };
}
