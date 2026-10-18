export interface CaseTMR { id: string; col: number; ligne: number; genre: string; nom: string }
export const CASES: CaseTMR[];
export const GENRES: Record<string, string>;
export function caseDe(id: unknown): CaseTMR | undefined;
export function libelleCase(id: string | null): string;
export function distance(a: string, b: string): number;
export function voisines(id: string): string[];
export function humide(id: string): boolean;
