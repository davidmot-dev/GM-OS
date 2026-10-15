/** Déclaration de disponibilité uniquement : la préparation privée appartient à la campagne. */
export interface ReferenceDeModuleDuJeu {
    id: string;
    libelle?: string;
}

export interface ModuleDuCatalogue {
    id: string;
    libelle: string;
    description: string;
    corpusCompatibles: readonly string[];
    adaptation: 'prete' | 'a-faire';
}

export interface ModuleDuPilote {
    reference: ReferenceDeModuleDuJeu;
    libelle: string;
    description: string;
    disponibilite: 'pret' | 'a-adapter' | 'inconnu' | 'incompatible';
}
