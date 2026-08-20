import type { Acte, Scene } from '../../types/trame.types';
import { preparerLaRevue, leRecitAResumer, type EvenementCure } from './curation';
import type { Journal } from './types';

/**
 * L'ensemble curé d'un journal, relevé au moment de résumer.
 *
 * **Séparé de `curation.ts` pour la même raison que `laSceneCourante` l'est de
 * `laSceneOuLEvenementSeRange`** : la logique de curation se teste sans fenêtre,
 * et c'est ici seulement qu'on va chercher la trame dans le monde réel.
 *
 * **Il n'y a pas de repli, et c'est délibéré.** Sans trame — campagne sans
 * actes, lecture du global qui échoue — `preparerLaRevue` range tout en
 * orphelins, et `leRecitAResumer` rend alors *exactement* le tri par nature
 * d'avant. Le cas dégradé est déjà le bon comportement, donc écrire un repli
 * n'ajouterait rien qu'un chemin de plus à se tromper.
 *
 * *Et un repli aurait été pire que rien ici* : le seul qu'on puisse imaginer —
 * « si l'ensemble curé est vide, renvoyer tout ce qui raconte » — réinjecterait
 * une scène que le meneur vient de mettre de côté, dès lors qu'elle était la
 * seule à raconter quelque chose. Il annulerait la décision qu'on lui a demandé
 * de prendre.
 */

interface MagasinDeTrame {
    scenes?: Scene[];
    actes?: Acte[];
    activeCampaignId?: string | null;
}

/** Le magasin de séance, lu par le global — un import direct fermerait un cycle. */
function trame(): MagasinDeTrame | undefined {
    try {
        return (window as unknown as {
            useSessionOSStore?: { getState: () => MagasinDeTrame };
        }).useSessionOSStore?.getState();
    } catch {
        return undefined;
    }
}

export function leRecitCureDuJournal(journal: Journal): EvenementCure[] {
    const magasin = trame();

    /*
      **La campagne du journal d'abord.** Un journal relu des semaines plus tard
      ne doit pas se faire ranger dans la trame de la campagne ouverte
      entre-temps : ses scènes n'y sont pas, tout deviendrait orphelin, et le
      résumé perdrait sa structure sans rien signaler. Même fragilité que celle
      déjà corrigée sur le résumé cherché par son titre traduit.
    */
    const campagne = journal.campaignId ?? magasin?.activeCampaignId;

    return leRecitAResumer(preparerLaRevue(
        journal.events, magasin?.scenes ?? [], magasin?.actes ?? [], campagne,
    ));
}
