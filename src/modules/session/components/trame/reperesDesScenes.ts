import { Star, Diamond, Circle, CircleDashed, type LucideIcon } from 'lucide-react';
import type { EtatDeScene } from '../../logic/trame';
import type { ImportanceDeScene } from '../../../../types/trame.types';

/**
 * Les repères d'une scène sur le graphe : une seule table, lue par la carte ET
 * par la légende. *Deux listes du même code finissent par ne plus dire la même
 * chose* — la légende mentirait sans que rien ne casse.
 *
 * **Deux canaux qui ne se recouvrent pas.** L'état passe par le CONTOUR de la
 * carte (halo, pointillé, grisé) ; le rang par sa BORDURE GAUCHE et une marque.
 * Une scène principale en cours doit se lire comme les deux à la fois.
 */
export const LIBELLE_DE_L_ETAT: Record<EtatDeScene, string> = {
    'en-cours': 'En cours', 'en-pause': 'En pause', prevue: 'À jouer', terminee: 'Terminée',
};

export const AIDE_DE_L_ETAT: Record<EtatDeScene | 'annulee', string> = {
    'en-cours': 'Contour vert lumineux',
    'en-pause': 'Contour orange en pointillé : commencée, à reprendre',
    prevue: 'Carte pleine, pas encore commencée',
    terminee: 'Carte grisée, coche',
    annulee: 'Close sans avoir été jouée : titre barré',
};

export const ORDRE_DES_ETATS: readonly EtatDeScene[] = ['en-cours', 'en-pause', 'prevue', 'terminee'];

export const MARQUE_DU_RANG: Record<ImportanceDeScene | 'non-classee', LucideIcon> = {
    principale: Star, secondaire: Diamond, optionnelle: Circle, 'non-classee': CircleDashed,
};

export const AIDE_DU_RANG: Record<ImportanceDeScene | 'non-classee', string> = {
    principale: 'Bordure gauche épaisse, titre en gras',
    secondaire: 'Bordure gauche moyenne',
    optionnelle: 'Bordure en pointillé, titre en italique',
    'non-classee': 'Bordure gauche fine',
};
