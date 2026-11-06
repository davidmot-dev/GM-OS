/**
 * Les marques du « sujet libre » dans la liste de l'atelier (06/11/2026).
 *
 * Le sujet tapé à gauche de la Forge s'ajoute à la liste ; s'il y est déjà, il passe en tête. Sans
 * marque, le doublon se fondait dans la liste sans un mot : David a tapé un sujet de COC déjà
 * inventorié et déjà publié, et « il n'y a rien qui se passe dans la forge ».
 *
 * Ce sont des étiquettes du candidat, après la première (le traitement) : elles ne changent ni
 * l'état, ni la couverture comptée.
 */
export const MARQUE_SUJET_LIBRE = 'sujet libre';
export const MARQUE_SUJET_LIBRE_RETROUVE = 'sujet libre retrouvé';

export type SujetLibre = 'ajoute' | 'retrouve' | null;

export function sujetLibre(tags: readonly string[]): SujetLibre {
  if (tags.includes(MARQUE_SUJET_LIBRE_RETROUVE)) return 'retrouve';
  if (tags.includes(MARQUE_SUJET_LIBRE)) return 'ajoute';
  return null;
}
