/** Contrats de la couture HTML, partagés sans charger le pont du renderer. */

/** Ce que le moteur rend pour un personnage ouvert. */
export interface InstantaneDeFiche {
    id: string;
    name: string;
    templateId: string;
    templateName: string;
    system: string;
    updatedAt: number | null;
    data: Record<string, unknown>;
}

/** Un champ du gabarit, tel que `template` le rend. */
export interface ChampDuGabaritDeFiche {
    key: string;
    label: string;
    type: string;
    page: number;
}

export interface GabaritDeFiche {
    id: string;
    name: string;
    system: string;
    fields: ChampDuGabaritDeFiche[];
}

/** L'aperçu d'un personnage dans la bibliothèque — sans ses données. */
export interface ApercuDeFiche {
    id: string;
    name: string;
    templateId: string;
    templateName: string;
    system: string;
    updatedAt: number | null;
}

export interface BibliothequeDeFiches {
    characters: ApercuDeFiche[];
    templates: { id: string; name: string; system: string; builtin: boolean }[];
}

/** Ce que le moteur diffuse de lui-même : une saisie, ou un changement de PJ. */
export interface ChangementDeFiche {
    origin: 'sheet' | 'host' | 'open';
    keys: string[];
    character: InstantaneDeFiche | null;
    /** Présent seulement sur une diffusion `open`. */
    template?: GabaritDeFiche | null;
}

export interface PontDeLaFiche {
    /** Le moteur est-il là, et que porte-t-il ? Le premier appel de l'hôte. */
    bonjour(): Promise<{ version: number; ready: boolean; character: InstantaneDeFiche | null; template: GabaritDeFiche | null }>;
    lire(): Promise<InstantaneDeFiche | null>;
    gabarit(): Promise<GabaritDeFiche | null>;
    ecrire(lot: Record<string, unknown>): Promise<InstantaneDeFiche | null>;
    bibliotheque(): Promise<BibliothequeDeFiches>;
    /** `openCharacter` et non `open` : côté moteur, `open` est une diffusion. */
    ouvrirPersonnage(characterId: string): Promise<InstantaneDeFiche>;
    creer(name: string, templateId: string, data?: Record<string, unknown>): Promise<InstantaneDeFiche>;
    /** Le contenu que `restore()` sait relire — la matière du chantier n° 5. */
    sauvegarde(): Promise<unknown>;
    /**
     * Reverse une sauvegarde dans la bibliothèque du moteur.
     *
     * Elle **ajoute et remplace par identifiant, elle ne vide jamais** : ce qui
     * n'est pas dans la sauvegarde reste en place. *Une restauration qui
     * effacerait d'abord ferait perdre ce qu'on a créé depuis.*
     */
    restaurer(contenu: unknown): Promise<{ templates: number; characters: number }>;
    /** S'abonner aux diffusions du moteur. Rend de quoi se désabonner. */
    surChangement(fn: (ev: ChangementDeFiche) => void): () => void;
    /** Retire l'écouteur et fait échouer ce qui attendait encore. */
    fermer(): void;
}
