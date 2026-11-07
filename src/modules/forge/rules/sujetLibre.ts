import { slugFiche } from './canevas';
import type { BrainstormCandidate } from './types';

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

/**
 * La liste sans le sujet libre : le candidat ajouté pour lui retiré, la marque « retrouvé » effacée.
 * C'est la liste qu'on enregistre — le sujet libre ne vit que le temps de le forger (décision de
 * David du 07/11/2026, pour les suppléments comme pour le livre de base).
 */
export function sansLeSujetLibre(candidats: readonly BrainstormCandidate[]): BrainstormCandidate[] {
  return candidats
    .filter(c => !c.tags.includes(MARQUE_SUJET_LIBRE))
    .map(c => (c.tags.includes(MARQUE_SUJET_LIBRE_RETROUVE)
      ? { ...c, tags: c.tags.filter(t => t !== MARQUE_SUJET_LIBRE_RETROUVE) }
      : c));
}

/**
 * La liste avec le sujet libre en tête : retrouvé (marqué, déplacé) s'il y est déjà, ajouté sinon
 * par `nouveau`. Repart toujours de la liste sans l'ancien sujet libre : changer la saisie ne laisse
 * pas de trace.
 */
export function avecLeSujetLibre(
  candidats: readonly BrainstormCandidate[],
  libre: string,
  nouveau: (titre: string, id: string) => BrainstormCandidate,
): BrainstormCandidate[] {
  const base = sansLeSujetLibre(candidats);
  const titre = libre.trim();
  if (!titre) return base;
  const id = slugFiche(titre);
  const retrouve = base.find(c => c.id === id);
  return retrouve
    ? [{ ...retrouve, tags: [...retrouve.tags, MARQUE_SUJET_LIBRE_RETROUVE] }, ...base.filter(c => c !== retrouve)]
    : [nouveau(titre, id), ...base];
}
