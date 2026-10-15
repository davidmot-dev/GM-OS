/** Préparation portable de l'atelier ; ni état de séance ni stockage de campagne du Hub. */
import { creerEtat, validerEtat } from './moteur.mjs';

export const cleSauvegardeConfiguration = 'gmos:alien:muthur:configuration:v1';
const format = 'gmos-alien-muthur-configuration';
const copie = valeur => JSON.parse(JSON.stringify(valeur));

export function extraireConfiguration(etat) {
  validerEtat(etat);
  return copie({ format, version: 1, config: etat.config, documents: etat.documents, protocoles: etat.protocoles });
}

export function etatDepuisConfiguration(configuration) {
  if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)
    || Object.keys(configuration).length !== 5
    || !['format', 'version', 'config', 'documents', 'protocoles'].every(cle => Object.hasOwn(configuration, cle))
    || configuration.format !== format || configuration.version !== 1) {
    throw new Error('Format ou version de configuration MU/TH/UR non pris en charge.');
  }
  const etat = { ...creerEtat(), ...copie({ config: configuration.config, documents: configuration.documents, protocoles: configuration.protocoles }) };
  // Vérifier avant d'enregistrer : un import ne doit jamais remplacer une préparation par des données invalides.
  validerEtat(etat);
  return etat;
}

export function lireConfiguration(texte) {
  let configuration;
  try { configuration = JSON.parse(texte); }
  catch { throw new Error('Le fichier ne contient pas un JSON valide.'); }
  return extraireConfiguration(etatDepuisConfiguration(configuration));
}
