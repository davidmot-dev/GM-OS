import type { EtatLcars } from './moteur.mjs';
export interface ConfigurationLcars { moduleId: 'star-trek-lcars'; versionDonnees: 2; donnees: EtatLcars }
export const cleSauvegarde: string;
export function exporterConfiguration(etat: EtatLcars): ConfigurationLcars;
export function lireConfiguration(texte: string): EtatLcars;
