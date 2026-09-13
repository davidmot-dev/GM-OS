import { envoyerLeTitre, normaliserLeTitre } from '../../storyboard/titreProjete';

/**
 * **Tout retirer de l'écran des joueurs, d'un geste.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE GESTE EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *Demandé par David le 2026-09-13 : « je voudrais la possibilité de fermer
 * [la fenêtre du Player Hub] avec un raccourci dédié, car en tant que MJ je ne
 * vois pas toujours l'écran Player Hub ».*
 *
 * ⭐ **Sa raison décide de la conception.** Le meneur ne regarde pas cet
 * écran-là : le geste doit donc partir de **sa** fenêtre, et il doit effacer
 * **sans qu'on ait à savoir ce qui était affiché**. *Un bouton sur le Player Hub
 * n'aurait servi qu'aux joueurs.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LA RÉCEPTION EXISTAIT DÉJÀ, ET ATTENDAIT DEPUIS TOUJOURS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `useHubSync` traite un message `FULL_RESET` qui vide l'image, la fiche et la
 * vidéo en cours. **Personne ne l'émettait** — aucune occurrence dans tout le
 * dépôt. *Sixième « chaîne complète sans bouton au bout » de ce projet*, et
 * celle-ci a échappé à la garde des noms parce qu'elle vit dans une chaîne de
 * caractères, pas dans un magasin.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUE CE GESTE NE TOUCHE PAS, ET POURQUOI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Les favoris épinglés restent.** Ils ne sont pas une projection : leur
 * présence sur le Hub est un drapeau **persisté** sur la fiche elle-même
 * (`isSyncedToPlayerHub`), posé exprès, un par un. Les effacer ne les cacherait
 * pas — ça les **dépinglerait**, et il faudrait tout re-cocher.
 *
 * *Ce geste sert à rattraper ce qu'on a laissé traîner sans le voir ; un favori
 * épinglé n'a pas été laissé, il a été choisi.*
 *
 * **Le fond de l'écran reste** aussi : il décrit le lieu, il n'est pas ce qu'on
 * projette par-dessus. C'est la règle de `imageAvantLeMoment` — *l'image est le
 * décor, les fiches passent devant.*
 */

/** Ce que l'effacement a réellement pu faire — pour le dire, et pour le tester. */
export interface EffacementDuHub {
    /** Le message de remise à zéro est parti vers le Hub. */
    reinitialisationEnvoyee: boolean;
    /** Le titre projeté a été retiré. */
    titreRetire: boolean;
    /** L'écran du meneur ne croit plus projeter sur le Hub. */
    projectionOubliee: boolean;
}

interface PontDEffacement {
    remote?: { sendSync?: (donnees: Record<string, unknown> & { type: string }, role?: string) => void };
}

/**
 * Vide le Player Hub : image, fiche projetée, vidéo et titre.
 *
 * ⚠️ **Ne lève jamais.** Un pont absent — fenêtre secondaire, test, rendu hors
 * Electron — rend simplement un rapport négatif : *ce qui accompagne ne doit
 * jamais faire tomber ce qui est demandé*, et un raccourci qui plante en séance
 * serait pire que l'image qu'il devait retirer.
 */
export function effacerLePlayerHub(pont?: PontDEffacement): EffacementDuHub {
    const rapport: EffacementDuHub = {
        reinitialisationEnvoyee: false, titreRetire: false, projectionOubliee: false,
    };

    const envoyer = pont?.remote?.sendSync;
    if (envoyer) {
        /*
          **Sans rôle : tout le monde reçoit.** Le Hub est la cible, mais une
          tablette qui afficherait la même fiche doit se vider aussi — *le geste
          dit « on ne montre plus rien », pas « on ne montre plus rien ici ».*
        */
        envoyer({ type: 'FULL_RESET' });
        rapport.reinitialisationEnvoyee = true;
    }

    /*
      **Le titre part par un autre canal**, et `FULL_RESET` ne le couvre pas :
      un titre permanent survivrait à l'effacement et resterait seul sur un
      écran vide. C'est le défaut qu'`arreterLeMoment` a déjà dû corriger pour
      les moments de storyboard.
    */
    try {
        envoyerLeTitre(normaliserLeTitre({ cible: 'hub', texte: '' }));
        rapport.titreRetire = true;
    } catch (erreur) {
        console.warn('[Hub] retrait du titre impossible :', erreur);
    }

    /*
      ⛔ **Et l'écran du meneur doit l'apprendre aussi.** Sans cette ligne, le
      Hub se vide et Image-OS continue d'annoncer une projection en cours : le
      meneur croirait montrer une image que personne ne voit. *Un écran qui ment
      sur ce que la table voit est le mode d'échec que ce module paie le plus
      souvent.*
    */
    try {
        const magasin = (window as unknown as {
            useImageStore?: { getState: () => { setProjection: (cible: string, valeur: null) => void } };
        }).useImageStore;

        if (magasin) {
            magasin.getState().setProjection('hub', null);
            rapport.projectionOubliee = true;
        }
    } catch (erreur) {
        console.warn('[Hub] mise à jour de la projection impossible :', erreur);
    }

    return rapport;
}
