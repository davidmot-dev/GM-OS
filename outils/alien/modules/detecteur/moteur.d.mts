export interface EtatDetecteur {
  version: 1; system: 'alien'; revision: number;
  config: { crt: boolean; glitches: boolean };
  tracker: { power: boolean; intensity: number; volume: number; contacts: number; proximity: number; noise: number; target: 'all'; seed: number; anomalyUntil: number };
}
export type ContexteDetecteur = { role: 'mj' | 'joueur'; personnageId?: string; appareilId?: string };
export type CommandeDetecteur =
  | { id: 'configurer'; charge: { intensite?: number; volume?: number; contacts?: number; proximite?: number; parasites?: number; crt?: boolean; effetsParasites?: boolean } }
  | { id: 'scanner'; charge: { actif: boolean } }
  | { id: 'faux-echo'; charge: Record<string, never> };
export function creerEtat(): EtatDetecteur;
export function validerEtat(etat: unknown): asserts etat is EtatDetecteur;
export function migrerEtat(donnees: unknown, versionDonnees: number): EtatDetecteur;
export function arreterEffets(etat: EtatDetecteur): EtatDetecteur;
export function vuePour(etat: EtatDetecteur, lecteur: ContexteDetecteur): EtatDetecteur;
export function appliquerCommande(etat: EtatDetecteur, commande: CommandeDetecteur, contexte: ContexteDetecteur): EtatDetecteur;
