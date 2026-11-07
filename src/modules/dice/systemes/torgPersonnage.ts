import type { ConfigurationTorg } from '../../../types/drivers';

export interface SuiteDeCoupTorg {
    id: string;
    blessures: number;
    ko: boolean;
    tenaciteTraitee?: boolean;
    souffranceTraitee?: boolean;
    dernierTour?: boolean;
}

/** Cases explicites : un texte libre ou un statut d'adversaire n'accorde jamais un Atout. */
export function caseDeTorg(valeurs: Record<string, unknown>, champ: string | undefined): boolean {
    if (!champ) return false;
    const valeur = valeurs[champ];
    return valeur === true || valeur === 1 || valeur === 'true' || valeur === '1';
}

export type AtoutDeTorg = keyof NonNullable<ConfigurationTorg['atouts']>;
export const NOMS_DES_ATOUTS_TORG: Record<AtoutDeTorg, string> = {
    aspectEffrayant: 'Aspect effrayant', occultiste: 'Occultiste', ingenieux: 'Ingénieux',
    populaire: 'Populaire', chefNaturel: 'Chef naturel', conscienceEnvironnementale: 'Conscience environnementale',
};

export function possedeAtoutTorg(regle: ConfigurationTorg | undefined, valeurs: Record<string, unknown>, atout: AtoutDeTorg): boolean {
    return caseDeTorg(valeurs, regle?.atouts?.[atout]);
}

export function refusEtatTorg(regle: ConfigurationTorg | undefined, valeurs: Record<string, unknown>, depensePossibilite = false): string | undefined {
    if (caseDeTorg(valeurs, regle?.etats?.ko)) return 'Personnage KO : aucune action, dépense de Possibilité ni échange ou jeu de Carte du Destin (p. 117).';
    if (depensePossibilite && caseDeTorg(valeurs, regle?.etats?.deconnecte)) return 'Personnage déconnecté : aucune dépense de Possibilité, y compris les cartes Drame ou Héros (p. 179).';
    return undefined;
}

/** Un succès simple / supérieur / spectaculaire autorise respectivement 1 / 2 / 3 cartes. */
export function nombreDeCartesTorg(marge: number, echecCritique = false): number {
    return echecCritique || marge < 0 ? 0 : marge >= 10 ? 3 : marge >= 5 ? 2 : 1;
}
