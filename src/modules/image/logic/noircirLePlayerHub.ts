import { envoyerLeTitre, normaliserLeTitre } from '../../storyboard/titreProjete';

/**
 * **Éteindre vraiment l'écran des joueurs.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE GESTE EXISTE À PART
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Depuis le 2026-09-17, **le Hub au repos montre le décor de la campagne** : ne
 * plus rien projeter ne l'éteint plus, ça le rend à son image de fond. C'est ce
 * que David a demandé, et c'est la doctrine du module — *l'image est le décor,
 * les fiches passent devant.*
 *
 * Mais il a aussi voulu **garder les deux gestes** : il reste des moments où
 * l'écran de la table doit être **noir**, et pas « au repos ». Ce geste-là est
 * donc explicite, et il ne peut plus arriver par accident au bout d'une chaîne
 * qui voulait seulement arrêter une projection.
 *
 * ⭐ ***Deux intentions qui produisent le même pixel ne sont pas la même
 * intention*** : les confondre, c'est ce qui donnait un écran noir chaque fois
 * qu'on refermait une image.
 *
 * ⚠️ **Ne lève jamais**, comme `effacerLePlayerHub` : un pont absent — fenêtre
 * secondaire, essai, rendu hors Electron — rend un rapport négatif. *Un geste de
 * séance qui plante coûte plus cher que ce qu'il devait faire.*
 */

export interface NoircissementDuHub {
    /** Le message d'extinction est-il parti ? */
    extinctionEnvoyee: boolean;
    /** Le titre a-t-il été retiré ? */
    titreRetire: boolean;
}

interface PontDExtinction {
    remote?: { sendSync?: (donnees: Record<string, unknown> & { type: string }, role?: string) => void };
}

export function noircirLePlayerHub(pont?: PontDExtinction): NoircissementDuHub {
    const rapport: NoircissementDuHub = { extinctionEnvoyee: false, titreRetire: false };

    const envoyer = pont?.remote?.sendSync;
    if (envoyer) {
        /*
          **Sans rôle : tout le monde reçoit.** Une tablette qui montrerait la
          même scène doit s'éteindre aussi — *le geste dit « plus de lumière »,
          pas « plus de lumière ici ».*
        */
        envoyer({ type: 'BLACKOUT' });
        rapport.extinctionEnvoyee = true;
    }

    /*
      **Le titre part par un autre canal**, et `BLACKOUT` ne le couvre pas : un
      titre permanent resterait seul, lumineux, sur un écran noir. Même défaut
      qu'`effacerLePlayerHub` avait dû corriger.
    */
    try {
        envoyerLeTitre(normaliserLeTitre({ cible: 'hub', texte: '' }));
        rapport.titreRetire = true;
    } catch (erreur) {
        console.warn('[Hub] retrait du titre impossible :', erreur);
    }

    return rapport;
}
