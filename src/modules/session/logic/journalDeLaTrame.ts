import { passageEnCours } from './trame';
import type { Acte, Scene } from '../../../types/trame.types';

/**
 * **Ce que la trame écrit au journal — et pourquoi elle doit écrire quelque chose.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE TROU, TROUVÉ PAR DAVID LE 2026-09-12
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *« Lorsque je lance une scène, il ne doit pas y avoir une entrée dans le
 * journal ? »* — Non, il n'y en avait aucune. `ouvrirLaScene` ne touchait pas au
 * journal, et ça coûtait plus qu'une ligne manquante dans le fil :
 *
 * ⛔ **Une scène ouverte mais silencieuse n'existait pas dans la revue de
 * séance.** `preparerLaRevue` part des événements, jamais de la trame : zéro
 * événement, donc aucun bloc — donc impossible à fusionner, à scinder, à mettre
 * de côté ou à résumer.
 *
 * ⭐ Et c'est là que ça faisait mal. Le plan du 2026-08-08 (§ 3.2) accepte
 * explicitement qu'un changement de scène soit oublié — *« un marquage manqué
 * est réparable, pas perdu »* — et il nomme son filet : **« la revue de fin de
 * séance permet de scinder une scène »**. Or ce filet ne s'affichait que pour
 * les scènes qui portaient déjà des événements. *Le filet était absent
 * précisément dans le cas qu'il devait rattraper.*
 *
 * Une entrée à l'ouverture suffit à rendre la scène visible, et donc curable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES TROIS DÉCISIONS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. **`SYSTEM`, donc nature `trace`.** Ouvrir une scène est un fait mécanique,
 *    pas de la matière à chronique — même décision que l'ouverture de combat
 *    (étape 8 du plan : *« l'ouverture est de nature trace »*). La scène devient
 *    visible dans la revue **sans** entrer dans le résumé, et sans faire
 *    mentir la pastille « rien qui raconte ».
 * 2. **`sceneId` est posé ici, jamais déduit.** `laSceneCourante()` ne répond
 *    que s'il y a exactement une scène en cours — et au moment où l'on ouvre,
 *    celle qu'on ouvre ne l'est pas encore. *L'émetteur qui sait garde la main*,
 *    la règle déjà tenue par le combat.
 * 3. **Rien si la scène était déjà ouverte.** `ouvrirLaScene` ne fait rien sur
 *    un passage en cours ; le journal doit dire la même chose. *Une trace d'un
 *    geste qui n'a rien changé est un mensonge sur le parcours* — et deux clics
 *    sur « commencer » en produiraient deux.
 */

export interface EntreeDeTrame {
    type: 'SYSTEM';
    title: string;
    content: string;
    sceneId: string;
}

/** Ce qu'il faut autour de la scène pour écrire autre chose que des identifiants. */
export interface ContexteDOuverture {
    acte?: Acte;
    /** Le lieu de la scène, déjà retrouvé dans l'Atlas. */
    lieu?: { name: string };
    /** Les personnages joueurs connus — filtrés sur `personnagesIds`. */
    personnages?: readonly { id: string; name: string }[];
    /** Les entités connues — filtrées sur `entiteIds`. */
    entites?: readonly { id: string; name: string }[];
}

/** Les noms de ceux dont on a l'identifiant, dans l'ordre de la scène. */
function nommer(
    ids: readonly string[] | undefined,
    repertoire: readonly { id: string; name: string }[] | undefined,
): string[] {
    if (!ids?.length || !repertoire?.length) return [];
    /*
      ⚠️ **Un identifiant qui ne désigne plus rien est SAUTÉ, pas rendu tel
      quel.** Un PNJ supprimé après coup laisserait sinon son identifiant brut
      au milieu d'une phrase — illisible, et pire que son absence.
    */
    return ids
        .map(id => repertoire.find(x => x.id === id)?.name)
        .filter((n): n is string => !!n);
}

/** Une ligne « Étiquette : a, b » — ou rien du tout si la liste est vide. */
function ligne(etiquette: string, valeurs: readonly string[]): string | null {
    return valeurs.length > 0 ? `${etiquette} : ${valeurs.join(', ')}` : null;
}

/**
 * L'entrée à consigner quand on ouvre une scène, ou `null` s'il n'y a rien à dire.
 *
 * ⚠️ **Rouvrir n'est pas ouvrir.** `ouvrirLaScene` ranime délibérément une scène
 * terminée — un geste explicite du meneur, qu'on n'a pas voulu refuser. En
 * relisant, « rouverte » et « ouverte » ne racontent pas la même soirée : le
 * groupe est revenu sur ses pas.
 */
export function entreePourLOuvertureDeScene(
    scene: Scene | undefined,
    contexte: ContexteDOuverture = {},
): EntreeDeTrame | null {
    if (!scene) return null;
    if (passageEnCours(scene)) return null;

    const rouverte = !!scene.termineeLe;
    const { acte, lieu, personnages, entites } = contexte;

    /*
      **Ce qu'on relit six mois plus tard.** Demande de David le 2026-09-12 :
      *« je veux que tu notes les infos intéressantes — le synopsis de la scène,
      les joueurs présents, le lieu »*. Le journal est la seule trace qui
      survive à la soirée ; une ligne « Scène ouverte » sans son décor ne dit
      rien de ce qui commençait.

      ⚠️ **Chaque ligne disparaît si elle n'a rien à dire.** Un « Lieu : » suivi
      de rien, ou un « PJ présents : » vide, se lisent comme une information
      perdue alors qu'il n'y en avait pas. *Une rubrique vide affirme un
      manque ; une rubrique absente n'affirme rien.*

      ⭐ **Et le synopsis vient en dernier, séparé.** C'est le seul morceau de
      prose : le coller aux rubriques le noierait, et c'est lui qu'on relit.
    */
    const rubriques = [
        acte ? `Acte : ${acte.titre}` : null,
        lieu ? `Lieu : ${lieu.name}` : null,
        ligne('PJ présents', nommer(scene.personnagesIds, personnages)),
        ligne('PNJ', nommer(scene.entiteIds, entites)),
    ].filter((l): l is string => l !== null);

    const corps = [rubriques.join('\n'), scene.resume?.trim()]
        .filter((bloc): bloc is string => !!bloc)
        .join('\n\n');

    return {
        type: 'SYSTEM',
        title: `${rouverte ? 'Scène rouverte' : 'Scène ouverte'} : ${scene.titre}`,
        /* Le titre porte déjà le nom : un corps vide vaut mieux qu'un écho. */
        content: corps,
        sceneId: scene.id,
    };
}

/**
 * Une durée en clair — « 42 min », « 1 h 20 ».
 *
 * ⚠️ **Arrondie à la minute, et jamais à zéro.** Une scène de quarante secondes
 * afficherait « 0 min », ce qui se lit comme une erreur plutôt que comme une
 * scène courte. *Un chiffre faux est pire qu'un mot vague.*
 */
export function dureeLisible(ms: number): string {
    /*
      ⚠️ Le seuil se mesure sur les MILLISECONDES, pas sur l'arrondi : quarante
      secondes arrondissent à une minute, et la garde ne se déclenchait jamais.
    */
    if (ms < 60_000) return 'moins d’une minute';
    const minutes = Math.round(ms / 60_000);
    if (minutes < 60) return `${minutes} min`;
    const restantes = minutes % 60;
    return restantes === 0 ? `${minutes / 60} h` : `${Math.floor(minutes / 60)} h ${restantes}`;
}

/**
 * L'entrée à consigner quand on termine une scène, ou `null` s'il n'y a rien à dire.
 *
 * **Décision de David le 2026-09-12**, après l'entrée d'ouverture : la frontière
 * de sortie se marque aussi. Elle porte le seul fait que l'ouverture ne pouvait
 * pas connaître — **combien de temps la scène a duré**.
 *
 * ⚠️ **Rien si la scène était déjà terminée** : `terminerLaScene` ne fait rien
 * sur une scène close, et le journal doit dire la même chose. Même règle que
 * pour l'ouverture — *une trace d'un geste qui n'a rien changé est un mensonge
 * sur le parcours.*
 *
 * ⭐ **Et une scène close sans avoir été jouée le dit.** L'acte s'achève et
 * emporte ses scènes, dont celles où le groupe n'est jamais passé. Les confondre
 * avec des scènes jouées *ferait croire à une partie qui n'a pas eu lieu*, et le
 * journal les relirait comme du vécu — la distinction que `closeSansAvoirEteJouee`
 * tient déjà à l'écran.
 */
export function entreePourLaFermetureDeScene(
    scene: Scene | undefined,
    quand: number,
): EntreeDeTrame | null {
    if (!scene) return null;
    if (scene.termineeLe) return null;

    const passages = scene.passages ?? [];
    /* Le passage encore ouvert se termine maintenant : c'est ce geste-ci qui le ferme. */
    const jouee = passages.reduce((total, p) => total + Math.max(0, (p.fin ?? quand) - p.debut), 0);

    return {
        type: 'SYSTEM',
        title: `Scène terminée : ${scene.titre}`,
        content: passages.length === 0
            ? 'Close sans avoir été jouée.'
            : `Durée jouée : ${dureeLisible(jouee)}.`,
        sceneId: scene.id,
    };
}
