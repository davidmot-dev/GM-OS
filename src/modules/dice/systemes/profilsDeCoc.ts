/** COC-A3 — livre p. 71-72, 92, 108-111, relu le 04/11/2026. */
export const CLE_PROFIL_COC = '__cocProfil';
export type RoleCoc = 'figurant' | 'second' | 'premier';
export const ROLES_COC = {
    figurant: { nom: 'Figurant', caracteristiques: 1, defense: 10, points: 1, pulp: 4 },
    second: { nom: 'Second rôle', caracteristiques: 3, defense: 12, points: 3, pulp: 12 },
    premier: { nom: 'Premier rôle', caracteristiques: 5, defense: 15, points: 5, pulp: 24 },
} as const;
export const CARACTERISTIQUES_COC = ['agilite', 'constitution', 'force', 'perception', 'charisme', 'intelligence', 'volonte'] as const;
export interface ProfilPnjCoc {
    role: RoleCoc; pulp: boolean; caracteristiques: string[];
    capacites: { nom: string; niveau: 'pro' | 'expert'; detail: string }[];
    /** Une bande compte ses membres touchés, jamais des DM cumulés. */
    bande?: number;
}
export function lireProfilCoc(fiche: Record<string, unknown>): ProfilPnjCoc | undefined {
    const p = fiche[CLE_PROFIL_COC] as ProfilPnjCoc | undefined;
    return p && Object.hasOwn(ROLES_COC, p.role) && Array.isArray(p.caracteristiques) && Array.isArray(p.capacites) ? p : undefined;
}
export function refusProfilCoc(p: ProfilPnjCoc): string | undefined {
    const r = ROLES_COC[p.role];
    if (!r) return 'Rôle inconnu.';
    if (p.caracteristiques.length !== r.caracteristiques || p.caracteristiques.some(c => !CARACTERISTIQUES_COC.includes(c as typeof CARACTERISTIQUES_COC[number]))) return `Choisir ${r.caracteristiques} caractéristiques à +2.`;
    if (p.caracteristiques.some(c => p.caracteristiques.filter(x => x === c).length > (p.role === 'premier' ? 2 : 1))) return 'Seul un premier rôle peut choisir une caractéristique deux fois (+4).';
    if (p.capacites.some(c => !c.nom.trim() || !['pro', 'expert'].includes(c.niveau))) return 'Nom et niveau de capacité requis.';
    if (p.capacites.reduce((s, c) => s + (c.niveau === 'expert' ? 2 : 1), 0) > r.points) return 'Budget de capacités dépassé.';
    if (p.bande !== undefined && (!Number.isInteger(p.bande) || p.bande < 1 || p.bande > 100)) return 'Effectif de bande : de 1 à 100.';
}
export function tailleSanteCoc(p?: ProfilPnjCoc): number { return p?.bande ?? (p?.pulp ? ROLES_COC[p.role].pulp : 20); }
export const ETATS_DE_SANTE_COC = [
    { echelon: 5, label: 'Contusionné', malus: 1, guerison: 0 },
    { echelon: 10, label: 'Affaibli', malus: 3, guerison: 10 },
    { echelon: 15, label: 'Blessé', malus: 5, guerison: 15 },
    { echelon: 20, label: 'Mourant', malus: 10, guerison: 20 },
] as const;
/** Petites échelles : les états déjà noircis à la création ne s’appliquent pas (p. 72). */
export function etatsDuProfilCoc(p?: ProfilPnjCoc) {
    if (p?.bande) return [];
    const n = tailleSanteCoc(p);
    return ETATS_DE_SANTE_COC.map(e => ({ ...e, echelon: n === 24 ? e.echelon * 6 / 5 : e.echelon - (20 - n) })).filter(e => e.echelon > 0);
}
export function etatDuProfilCoc(echelons: number, p?: ProfilPnjCoc) { return etatsDuProfilCoc(p).filter(e => echelons >= e.echelon).pop(); }
export function membresRestantsCoc(p: ProfilPnjCoc, touches: number): number { return Math.max(0, (p.bande ?? 0) - Math.max(0, Math.trunc(touches))); }
export function bonusBandeCoc(membres: number): number { return membres >= 4 ? 10 : membres === 3 ? 5 : membres === 2 ? 2 : 0; }
export function ficheDuProfilCoc(p: ProfilPnjCoc, defense: string, initiative: string): Record<string, unknown> {
    return { [CLE_PROFIL_COC]: p, ...Object.fromEntries(CARACTERISTIQUES_COC.map(c => [c, p.caracteristiques.filter(x => x === c).length * 2])),
        [defense]: ROLES_COC[p.role].defense, [initiative]: ROLES_COC[p.role].defense };
}
