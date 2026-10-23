import type { ArmeDefinie, NomDuPoste, Portee, Competence } from './moteur.mjs';
export const PORTEES: Portee[];
export const LIBELLES_DES_PORTEES: Record<Portee, string>;
export const MODIFICATEUR_DE_PORTEE: Record<Portee, number>;
export function porteeDeLaDistance(distance: number): Portee | null;
export const ARMES: ArmeDefinie[];
export interface Modele { id: string; nom: string; signature: number; propulseurs: number; coque: number; protection: number; armes: string[]; ombilic?: boolean }
export const MODELES: Modele[];
export const POSTES: NomDuPoste[];
export const LIBELLES_DES_POSTES: Record<NomDuPoste, string>;
export const POSTE_DE_LA_PHASE: Record<1 | 2 | 3 | 4, NomDuPoste>;
export const LIBELLES_DES_PHASES: Record<1 | 2 | 3 | 4, string>;
export const TALENTS_DES_POSTES: Partial<Record<NomDuPoste, string>>;
export interface ActionDefinie { id: string; nom: string; competence: string | null; cible?: boolean; arme?: 'offensive' | 'contremesure'; avarie?: boolean }
export const ACTIONS: Record<1 | 2 | 3 | 4, ActionDefinie[]>;
export interface LigneDAvarie { de: number[]; nom: string; texte: string; reparation: Competence[]; effet?: string }
export const AVARIES_MINEURES: LigneDAvarie[];
export const AVARIES_MAJEURES: LigneDAvarie[];
export const PANIQUE_SPATIALE: { min: number; max: number; nom: string; texte: string; stress: number; perdAction?: boolean; avarieDuPoste?: boolean }[];
export const AVARIE_DU_POSTE: Partial<Record<NomDuPoste, number>>;
export function avarieDeLaTable(table: LigneDAvarie[], valeur: number): LigneDAvarie | undefined;
