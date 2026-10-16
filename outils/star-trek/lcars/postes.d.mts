import type { PosteLcars } from './moteur.mjs';
export const POSTES: Record<PosteLcars, { nom: string; code: string; description: string; actions: Record<string, string>; etats: string[] }>;
export const NIVEAUX: string[];
export const ETATS: Record<string, string>;
export const STATUTS: Record<string, string>;
export const EN_ATTENTE: string[];
