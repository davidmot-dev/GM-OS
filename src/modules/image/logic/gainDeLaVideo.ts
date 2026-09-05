/**
 * **Le niveau d'une vidéo projetée, obtenu du même chef d'orchestre que le reste.**
 *
 * Demandé par David le 2026-09-05 : *« on construit les 2 »*, après le constat
 * que le son était le vrai sujet.
 *
 * ⛔ **Une vidéo ne peut pas entrer dans le bus audio, et il faut le dire.**
 * Music-OS et Ambient-OS branchent leurs sons sur un `AudioContext` qui vit
 * dans la fenêtre du meneur. La vidéo, elle, joue **dans la fenêtre de
 * projection** — un autre processus de rendu. *On ne branche pas un élément
 * d'une fenêtre sur le graphe audio d'une autre :* il n'y a aucun chemin, et
 * aucune bibliothèque n'en ouvrira un.
 *
 * Alors plutôt que de la faire jouer dans le bus, on lui fait **obéir au même
 * chef** : le meneur calcule ici le niveau que la vidéo devrait avoir, et le lui
 * envoie. Le résultat pour la table est le même — le volume général la baisse,
 * le mode Focus la tamise, la voix du meneur la fait plonger — mais le mécanisme
 * est un ordre transmis, pas un branchement. *Mieux vaut une imitation dont on
 * connaît les limites qu'un branchement qu'on croit avoir fait.*
 *
 * ⚠️ **Ce que cette imitation ne rend pas :** la vidéo sort par l'appareil de la
 * fenêtre de projection — l'écran HDMI, en général — et non par l'enceinte
 * choisie dans Music-OS. `setSinkId` se pose sur un contexte ; il n'y en a pas
 * ici. Sur un vidéoprojecteur relié au même ampli, cela ne se remarque pas ;
 * dans une pièce où l'écran a ses propres haut-parleurs, si.
 */

/** Ce que le meneur règle et ce que les autres modules imposent. */
export interface EtatDuSonProjete {
    /** Le volume général de la table, 0 à 1. */
    volumeGeneral: number;
    /** Le mode Focus est-il enclenché ? */
    modeFocus: boolean;
    /** Le tamisage du Focus, 0 à 1. */
    tamisageDuFocus: number;
    /** La voix du meneur parle-t-elle en ce moment ? */
    laVoixParle: boolean;
    /** Le niveau vers lequel la voix fait plonger le reste, 0 à 1. */
    plongeeDeLaVoix: number;
    /** Le curseur propre à la vidéo, dans Image-OS. */
    volumeDeLaVideo: number;
}

/** Un nombre utilisable comme gain, quoi qu'on lui passe. */
function borne(valeur: number, defaut: number): number {
    if (!Number.isFinite(valeur)) return defaut;
    return Math.min(1, Math.max(0, valeur));
}

/**
 * Le gain effectif de la vidéo projetée, entre 0 et 1.
 *
 * Les quatre facteurs se **multiplient**, comme dans `AmbientEngine` et
 * `MusicEngine` : *deux modules qui baissent le son doivent se cumuler, sinon le
 * plus récent annule le plus ancien.*
 *
 * ⚠️ Chaque facteur est borné séparément. Un réglage absent — un vieil état
 * relu, un module éteint — vaut « ne change rien », jamais « coupe tout » :
 * *un silence qu'on ne s'explique pas est pire qu'un son trop fort, parce
 * qu'on ne sait pas où chercher.*
 */
export function gainDeLaVideo(etat: Partial<EtatDuSonProjete>): number {
    const general = borne(etat.volumeGeneral ?? 1, 1);
    const focus = etat.modeFocus ? borne(etat.tamisageDuFocus ?? 0.1, 0.1) : 1;
    const voix = etat.laVoixParle ? borne(etat.plongeeDeLaVoix ?? 0.3, 0.3) : 1;
    const propre = borne(etat.volumeDeLaVideo ?? 1, 1);

    return general * focus * voix * propre;
}
