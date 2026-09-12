import { useUlanziStore } from '../../ulanzi/useUlanziStore';
import type { ActionRegistry } from './types';

/**
 * **Le défilé des Quarts, pilotable autrement que depuis le cockpit.**
 *
 * Les deux gestes existaient déjà dans `useUlanziStore` — ils étaient offerts
 * par des boutons du tableau de bord, et par rien d'autre. Ce qui manquait,
 * c'est leur entrée au registre des actions : *une chaîne complète sans bouton
 * au bout*, le motif que ce dépôt a payé quatre fois.
 *
 * Ils y entrent le 2026-09-12 pour les trois boutons physiques de l'afficheur.
 * ⚠️ Mais ce n'est pas un chemin réservé à eux : toute télécommande appairée y
 * a désormais accès, et c'est voulu — *une action qui n'existe que pour un seul
 * appelant est une action qu'on redéveloppe au second.*
 */
export const ulanziActions: ActionRegistry = {
    'ulanzi:quart-suivant': () => {
        useUlanziStore.getState().quartSuivant();
    },
    'ulanzi:pause': () => {
        useUlanziStore.getState().pause();
    },
};
