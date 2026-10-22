import type { EtatMuthur, PreparationActe } from './moteur.mjs';
export interface ConfigurationMuthur {
  format:'gmos-alien-muthur-configuration'; version:1;
  config:EtatMuthur['config']; documents:EtatMuthur['documents']; protocoles:EtatMuthur['protocoles']; actes?:PreparationActe[];
}
export const cleSauvegardeConfiguration:string;
export function extraireConfiguration(etat:EtatMuthur):ConfigurationMuthur;
export function etatDepuisConfiguration(configuration:unknown):EtatMuthur;
export function lireConfiguration(texte:string):ConfigurationMuthur;
