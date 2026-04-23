/**
 * Représente un marque-page web enregistré dans le système.
 */
export interface WebLink {
    id: string;
    /** Nom d'affichage du lien */
    name: string;
    /** URL complète (incluant https://) */
    url: string;
    /** Couleur du badge ou de la bordure (Tailwind ou Hex) */
    color: string; 
}

/**
 * Interface du Bridge pour les opérations Web spécifiques à Electron/Tauri.
 */
export interface WebBridge {
    /** Ouvre l'URL dans le navigateur externe par défaut par mesure de sécurité */
    openExternal: (url: string) => void;
    /** Sauvegarde la liste des liens en tant que fichier JSON */
    saveList: (data: WebLink[]) => Promise<boolean>;
    /** Charge une liste de liens depuis un fichier JSON */
    loadList: () => Promise<WebLink[] | null>;
}
