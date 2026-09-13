export interface ImageMedia {
    id: string;
    name: string;
    path: string; // Absolute path or URL
    /**
     * ⚠️ **Retiré le 2026-09-13 — ne pas le remettre sans lire ceci.**
     *
     * Il disait *« cette image fait-elle partie de la séquence »*, une case à
     * cocher par pad et **une seule séquence globale**, sans nom, sans cadence
     * et sans fondu. Les diaporamas la remplacent entièrement, sur décision de
     * David : *deux notions d'ordre dans un même module finissent toujours par
     * diverger.*
     *
     * Les bibliothèques déjà sur le disque portent encore la clé `active` ;
     * **personne ne la lit**, et elle disparaîtra à la prochaine écriture. *Il
     * n'y a pas de migration à faire pour un champ qu'on cesse de lire* — au
     * contraire de l'ajout d'un champ obligatoire.
     */
    sizeInfo?: string; // e.g. "1920x1080 • 2.4MB"
    folderId?: string | null; // Virtual folder ID
    isFavorite?: boolean;
    /**
     * **Image ou vidéo — ajouté le 2026-09-05.**
     *
     * Le projecteur savait déjà jouer une vidéo, en reniflant le type du fichier
     * qu'il venait de charger. Mais Image-OS, lui, ne détient qu'un identifiant
     * et un nom : il n'avait **aucun moyen de savoir** ce qu'un pad contenait, et
     * dessinait donc toujours une vignette d'image — une case vide pour une
     * vidéo.
     *
     * ⚠️ **Facultatif, et il doit le rester.** Les pads posés avant cette date
     * n'ont pas ce champ ; ils se lisent par le nom du fichier, via
     * `estUneVideo()`. *Un champ ajouté qui rendrait faux tout ce qui existe
     * déjà n'est pas un ajout, c'est une migration* — et il n'y en a pas besoin
     * ici.
     */
    type?: 'image' | 'video';
}

/**
 * **Un diaporama : des images dans un ordre, et une cadence.**
 *
 * Demandé par David le 2026-09-13. À ne pas confondre avec un **dossier**, qui
 * vit juste en dessous : *un dossier range, un diaporama ordonne et cadence.*
 * Une même image peut appartenir à plusieurs diaporamas et à aucun dossier.
 *
 * ⚠️ **Il ne retient que des identifiants**, jamais des chemins : une image
 * renommée ou déplacée reste à sa place dans le diaporama. Et un identifiant
 * dont le média a disparu est **sauté** à la lecture — voir
 * [[imagesDuDiaporama]] pour la raison, qui n'est pas de la tolérance.
 */
export interface Diaporama {
    id: string;
    nom: string;
    /** L'ordre de passage. C'est cette liste qui fait foi, pas l'ordre de la bibliothèque. */
    imageIds: string[];
    /**
     * Combien de temps chaque image reste, en millisecondes.
     *
     * **Une seule durée pour tout le diaporama** — choix de David contre une
     * durée par image. Bornée à la lecture par [[cadenceDuDiaporama]].
     */
    dureeParImageMs: number;
}

/**
 * **Le diaporama qui tourne en ce moment, et où.**
 *
 * ⛔ **Il n'est pas persisté.** C'est l'état de la pièce à un instant, pas de
 * la bibliothèque : retrouver au démarrage un diaporama « en cours » dont
 * l'horloge est morte avec la fenêtre précédente donnerait un écran qui
 * prétend tourner et n'avance jamais.
 */
export interface DiaporamaEnCours {
    id: string;
    /** L'index dans les images **projetables**, pas dans `imageIds`. */
    index: number;
    /** L'écran visé. Figé au lancement : changer de cible en cours de route laisserait une image derrière. */
    cible: string;
}

export interface ImageFolder {
    id: string;
    name: string;
    parentId?: string | null; // For nested folders later
}

export type ProjectionTarget = string | 'hub';

export interface DisplayInfo {
    id: string;
    bounds: { x: number, y: number, width: number, height: number };
    label: string;
}

export interface ProjectedEntity {
    id: string;
    name: string;
    subtitle?: string;
    avatar?: string;
    imageUrl?: string;
    portraitUrl?: string;
    description?: string;
    lore?: string;
    type?: string;
    fields?: Record<string, string>;
}

export interface ImageBridge {
    getDisplays: () => Promise<DisplayInfo[]>;
    /**
     * `son-video` porte le niveau de la vidéo projetée, entre 0 et 1.
     *
     * Voir [[gainDeLaVideo]] : une vidéo joue dans la fenêtre de projection et
     * ne peut pas rejoindre le bus audio du meneur. On lui envoie donc le niveau
     * qu'elle doit tenir, plutôt que de la brancher.
     */
    syncHubData: (type: 'image' | 'video' | 'entity' | 'voice-level' | 'titre' | 'son-video', data: string) => void;
    launchDisplay: (paths: string[], target: ProjectionTarget) => void;
    /**
     * Demande au processus principal le titre affiché sur cet écran.
     *
     * Facultatif : les surfaces qui n'ont pas le pont Electron — la tablette —
     * n'ont pas de titre à réclamer, le storyboard ne les vise pas.
     */
    requestCurrentTitle?: (cible: string) => void;
    /**
     * Demande au processus principal **ce qui doit être affiché** sur cet écran.
     *
     * Facultatif comme son voisin : les surfaces sans pont Electron — la
     * tablette — n'ont personne à qui le demander. Voir le commentaire du
     * préchargement pour ce que son absence coûtait.
     */
    requestCurrentDisplay?: (cible: string) => void;
    closeAllDisplays: () => void;
    /**
     * S'abonne a ce que le processus principal ordonne d'afficher.
     *
     * **Rend la fonction de retrait**, et l'appelant doit s'en servir : c'est
     * ce que l'ancien pont generique ne permettait pas, son `off` etant inerte.
     */
    onUpdateDisplay?: (rappel: (chemins: string[]) => void) => () => void;
    /** Le pendant en lecture de `syncHubData`. Rend aussi sa fonction de retrait. */
    onSyncHubData?: (rappel: (type: string, donnee: string) => void) => () => void;
}
