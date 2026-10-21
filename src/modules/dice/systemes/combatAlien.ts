import type { CompetenceAlien, EquipementAlien, ReglagesDuJetAlien } from './jetsAlien';
import type { TableEntry } from '../../tables/types';
import type { SynthetiqueAlien } from './synthetiquesAlien';
import type { RegleDeSurvieAlien } from './survieAlien';

export interface RegleDeCombatAlien {
    actions?: boolean;
    progression?: import('./progressionAlien').RegleDeProgressionAlien;
    survie?: RegleDeSurvieAlien;
    sante: string; force: string; endurance: string; protection: string; talents: string;
    proprietesArmes: string; stress: string; androide: string;
}
export const CLE_COMBAT_ALIEN = '_gmos_combat_alien';
export type UniteAlien = 'round' | 'tour' | 'quart' | 'jour';
export type ArmureAlien = 'normale' | 'perce-armure' | 'doublee';
export interface BlessureAlien {
    id: string; code: number; titre: string; effet: string; fatale: boolean; stabilisee: boolean;
    unite?: UniteAlien; echeance?: number; malusSoins: number; jours?: number; permanente: boolean;
    guerie: boolean; soigne56?: boolean; reductionLe?: number; tentatives: Record<string, number>;
}
export interface CoupAlien { id: string; degats: number; protection: number; type: ArmureAlien; origine?: string; annules?: number; des?: number[]; applique?: boolean }
export interface CombatAlien {
    xenomorphe?: import('./xenomorphesAlien').XenomorpheAlien;
    acide?: import('./xenomorphesAlien').AcideAlien;
    synthetique?: SynthetiqueAlien;
    humain?: boolean;
    version: 1; temps: Record<UniteAlien, number>; critiques: string[]; blessureTraitee: string[];
    blessures: BlessureAlien[]; mort: boolean; armes: Record<string, { vide: boolean; chargeurs: number }>;
    coup?: CoupAlien; reposLe?: number;
}
export const combatAlienVierge = (): CombatAlien => ({ version: 1, temps: { round: 0, tour: 0, quart: 0, jour: 0 }, critiques: [], blessureTraitee: [], blessures: [], mort: false, armes: {} });
export function lireLeCombatAlien(fiche: Record<string, unknown>): CombatAlien {
    const v = fiche[CLE_COMBAT_ALIEN] as CombatAlien | undefined;
    return v?.version === 1 && Array.isArray(v.blessures) ? v : combatAlienVierge();
}
export function demanderUnCritique(suivi: CombatAlien, id: string): CombatAlien {
    if (suivi.mort || suivi.critiques.includes(id) || suivi.blessureTraitee.includes(id)) return suivi;
    return { ...suivi, critiques: [...suivi.critiques, id] };
}
export function desDeProtection(protection: number, type: ArmureAlien): number {
    const n = Math.max(0, Math.trunc(protection));
    return type === 'perce-armure' ? Math.ceil(n / 2) : type === 'doublee' ? n * 2 : n;
}
const JOURS: Record<number, number> = { 16:1,21:1,22:1,23:1,24:1,25:2,26:1,31:1,32:1,33:2,34:2,35:2,36:2,41:2,42:3,43:3,44:1,45:1,46:2,51:2,52:1,53:1,56:3,61:2,62:3 };
export function ajouterUneBlessure(s: CombatAlien, id: string, code: number, entree: TableEntry, de: () => number, guerisonRapide = false): CombatAlien {
    if (!s.critiques.includes(id) || s.blessureTraitee.includes(id)) return s;
    const fatale = (code >= 44 && code <= 55) || code >= 61;
    const unite: UniteAlien | undefined = code >= 61 && code <= 62 ? 'round' : [52,53].includes(code) ? 'tour' : [45,46,54,55].includes(code) ? 'quart' : [44,51].includes(code) ? 'jour' : undefined;
    const jours = JOURS[code] ? Array.from({ length: JOURS[code] }, de).reduce((a,b) => a+b, 0) / (guerisonRapide ? 2 : 1) : undefined;
    const b: BlessureAlien = { id, code, titre: entree.title, effet: entree.effect ?? '', fatale, stabilisee: false,
        unite, echeance: unite ? s.temps[unite] + 1 : undefined, malusSoins: code === 62 ? -2 : [52,53,54,55,61].includes(code) ? -1 : 0,
        jours, permanente: [54,55].includes(code), guerie: false, tentatives: {} };
    return { ...s, mort: s.mort || code >= 63, critiques: s.critiques.filter(x => x !== id),
        blessureTraitee: [...s.blessureTraitee, id], blessures: [...s.blessures, b] };
}
export function avancerLeTempsAlien(s: CombatAlien, unite: UniteAlien): CombatAlien {
    return { ...s, temps: { ...s.temps, [unite]: s.temps[unite] + 1 }, blessures: s.blessures.map(b => {
        if (unite !== 'jour' || b.guerie || b.permanente || b.jours === undefined) return b;
        const jours = Math.max(0, b.jours - 1);
        const permanente = b.code === 56 && jours === 0 && !b.soigne56;
        // Un délai fatal non stabilisé subsiste même si la convalescence s'achève.
        return { ...b, jours, permanente, guerie: jours === 0 && !permanente && (!b.fatale || b.stabilisee) };
    }) };
}
export function trepasDu(s: CombatAlien, b: BlessureAlien): boolean {
    return !s.mort && b.fatale && !b.stabilisee && !!b.unite && b.echeance !== undefined && s.temps[b.unite] >= b.echeance;
}
export function resoudreLeTrepas(s: CombatAlien, id: string, reussites: number): CombatAlien {
    const b = s.blessures.find(b => b.id === id);
    if (!b || !trepasDu(s, b)) return s;
    return { ...s, mort: reussites <= 0, blessures: s.blessures.map(b => b.id === id ? { ...b, echeance: (b.echeance ?? 0) + 1 } : b) };
}
export function soignerUneBlessure(s: CombatAlien, id: string, mode: 'stabiliser' | 'guerison' | 'effet', reussites: number, soignant: string, materiel: number): CombatAlien {
    const b = s.blessures.find(b => b.id === id);
    if (!b || s.mort || !soignant.trim()) return s;
    if (mode === 'stabiliser' && (!b.fatale || b.stabilisee || (b.tentatives[soignant] ?? -1) >= materiel)) return s;
    if (mode === 'guerison' && (reussites <= 0 || b.jours === undefined || b.reductionLe === s.temps.jour)) return s;
    const nouveau = mode === 'stabiliser' ? { ...b, stabilisee: reussites > 0, tentatives: { ...b.tentatives, [soignant]: materiel } }
        : mode === 'guerison' ? { ...b, jours: b.jours! / 2, reductionLe: s.temps.jour }
        : reussites > 0 && [14,15].includes(b.code) ? { ...b, guerie: true }
        : reussites > 0 && b.code === 56 ? { ...b, soigne56: true } : b;
    return { ...s, blessures: s.blessures.map(x => x.id === id ? nouveau : x) };
}
/** Malus explicites de la table p. 100 ; les restrictions d'actions restent affichées. */
export function malusDesBlessures(s: CombatAlien, competence: CompetenceAlien | undefined): number {
    return s.blessures.filter(b => !b.guerie).reduce((n,b) => {
        const codes: Partial<Record<CompetenceAlien, number[]>> = { mobilite: [14,16,33,44,51], observation: [15,21,34], distance: [15,34], manipulation: [24], rapproche: [33], endurance: [44,62] };
        if (codes[competence!]?.includes(b.code)) return n - 2;
        if ((b.code === 31 && ['manipulation','observation'].includes(competence ?? '')) || (b.code === 61 && competence === 'endurance')) return n - 1;
        return n;
    }, 0);
}
export function armeAvecProprietes(texte: string) {
    const t = texte.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    return { automatique: /auto/.test(t), munitions: /munitions|chargeur|unique/.test(t), unique: /unique/.test(t),
        armure: /perce-armure/.test(t) ? 'perce-armure' as const : /double/.test(t) ? 'doublee' as const : 'normale' as const };
}
export function preparerLeTir(r: ReglagesDuJetAlien, arme: EquipementAlien | undefined) {
    const rang = r.portee ?? 1;
    const nom = arme?.portee.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    const max = nom === 'contact' ? 0 : /^court/.test(nom ?? '') ? 1 : /^moyen/.test(nom ?? '') ? 2 : /^long/.test(nom ?? '') ? 3 : nom === 'extreme' ? 4 : undefined;
    const auto = r.automatique && arme?.proprietes?.automatique;
    return { bonus: (r.viser ? 2 : 0) + (auto ? 2 : 0) + (rang === 0 ? r.sansDefense ? 3 : -3 : rang === 2 ? -1 : rang === 3 ? -2 : rang === 4 ? -3 : 0) + (r.taille ?? 0) + (r.lumiere ?? 0),
        stress: auto ? 1 : 0, erreur: !arme ? 'Choisir une arme pour tirer.' : max === undefined ? 'Renseigner une portée maximale connue pour cette arme.' : rang > max ? 'Cible au-delà de la portée maximale de l’arme.' : r.automatique && !auto ? 'Cette arme ne déclare pas de mode automatique.' : undefined };
}
export function rechargerUneArme(s: CombatAlien, id: string): CombatAlien {
    const a = s.armes[id];
    return !a?.vide || a.chargeurs <= 0 ? s : { ...s, armes: { ...s.armes, [id]: { vide: false, chargeurs: a.chargeurs - 1 } } };
}
