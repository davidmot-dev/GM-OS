/** Format portable privé du banc de test. Aucun accès au navigateur ici. */
import { validerEtat, migrerEtat, arreterEffets } from './moteur.mjs';
export const cleSauvegarde = 'gmos:star-trek:lcars:atelier:v2';
export function exporterConfiguration(etat) {
  validerEtat(etat);
  return { moduleId: 'star-trek-lcars', versionDonnees: 2, donnees: arreterEffets(etat) };
}
export function lireConfiguration(texte) {
  if (typeof texte !== 'string' || texte.length > 16 * 1024 * 1024) throw new Error('Configuration trop volumineuse (16 Mo maximum).');
  const v = JSON.parse(texte);
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).sort().join() !== 'donnees,moduleId,versionDonnees' || v.moduleId !== 'star-trek-lcars') throw new Error('Ce fichier ne contient pas une configuration LCARS.');
  return arreterEffets(migrerEtat(v.donnees, v.versionDonnees));
}
