import type { TypeDeNoeud } from './grapheDeLaTrame';

/** Coordonnées au centre : compatibles avec les anciennes positions GM-OS. */
export const DIMENSIONS_DES_CARTES: Record<TypeDeNoeud, { largeur: number; hauteur: number }> = {
    scene: { largeur: 260, hauteur: 144 }, acte: { largeur: 260, hauteur: 80 },
    lieu: { largeur: 200, hauteur: 88 }, pnj: { largeur: 200, hauteur: 88 },
    indice: { largeur: 200, hauteur: 88 }, pj: { largeur: 200, hauteur: 88 },
    ambiance: { largeur: 200, hauteur: 88 },
};

export function contientLeCentre(
    centre: { x: number; y: number }, cible: { x: number; y: number }, type: TypeDeNoeud,
): boolean {
    const taille = DIMENSIONS_DES_CARTES[type];
    return Math.abs(centre.x - cible.x) <= taille.largeur / 2
        && Math.abs(centre.y - cible.y) <= taille.hauteur / 2;
}
