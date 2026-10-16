import type { EtatLcars, CommandeLcars, ContexteLcars, VueLcarsMJ, VueLcarsJoueur } from './moteur.mjs';
export interface ContexteCampagneLcars { personnages: { id: string; nom: string }[] }
export function creerEtat(): EtatLcars;
export function preparerLecteur(v: unknown, id: string, nom: string): EtatLcars;
export function preparerContexte(v: unknown, personnages: ContexteCampagneLcars['personnages']): EtatLcars;
export function migrerEtat(v: unknown, version: number): EtatLcars;
export function arreterEffets(v: EtatLcars): EtatLcars;
export function appliquerCommande(v: unknown, commande: CommandeLcars, lecteur: ContexteLcars, contexte: ContexteCampagneLcars): EtatLcars;
export function fermerAccesApresCommande(commande: CommandeLcars): boolean;
export function choisirDiffusion(v: unknown, appareilId: string): EtatLcars;
export function diffusionActuelle(v: unknown): string | null;
export function vuePour(v: unknown, lecteur: ContexteLcars, contexte: ContexteCampagneLcars): VueLcarsMJ | VueLcarsJoueur;
