export interface ImageMedia {
    id: string;
    name: string;
    path: string; // Absolute path or URL
    active: boolean; // Is it part of the projection sequence?
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
    syncHubData: (type: 'image' | 'entity' | 'voice-level' | 'titre' | 'son-video', data: string) => void;
    launchDisplay: (paths: string[], target: ProjectionTarget) => void;
    /**
     * Demande au processus principal le titre affiché sur cet écran.
     *
     * Facultatif : les surfaces qui n'ont pas le pont Electron — la tablette —
     * n'ont pas de titre à réclamer, le storyboard ne les vise pas.
     */
    requestCurrentTitle?: (cible: string) => void;
    closeAllDisplays: () => void;
}
