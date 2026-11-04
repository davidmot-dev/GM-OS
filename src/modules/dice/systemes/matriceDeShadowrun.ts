import type { Complication } from './shadowrun';

/** SR-A3, 04/11/2026 — livre p. 212, 217-218. Une entrée représente une cible/PAN/serveur. */
export const CLE_MATRICE_SHADOWRUN = '__shadowrunMatrice';
export type ModeShadowrun = 'ra' | 'cold-trodes' | 'cold-ind' | 'hot-ind';
export const MODES_SHADOWRUN: Record<ModeShadowrun, string> = {
    ra: 'RA', 'cold-trodes': 'RV cold-sim / trodes', 'cold-ind': 'RV cold-sim / IND cybernétique', 'hot-ind': 'RV hot-sim / IND cybernétique',
};
export type AccesShadowrun = 0 | 1 | 2;
export const ACCES_SHADOWRUN = ['Aucun', 'Utilisateur', 'Administrateur'] as const;
export const BACKDOORS_SHADOWRUN = ['Force brute', '1 minute', '1 heure', '1 jour', '1 semaine', '1 mois'] as const;
export interface CibleShadowrun { id: string; nom: string; firewall: number; acces: AccesShadowrun }
export interface MatriceShadowrun {
    version: 1; mode: ModeShadowrun; cyberdeck: boolean; ind: boolean;
    cibles: CibleShadowrun[]; cible?: string;
    minimum: number; hausse: number; convergence: boolean; effetsAppliques: string[];
}
export interface ContexteMatriceShadowrun { cible: string; vise: AccesShadowrun; backdoor: number; cybercombat: boolean }
export interface RegleMatriceShadowrun { minimum: string; hausse: string }
const entier = (v: unknown) => Number.isFinite(Number(v)) ? Math.max(0, Math.trunc(Number(v))) : 0;
export function lireMatriceShadowrun(r: RegleMatriceShadowrun, fiche: Record<string, unknown>): MatriceShadowrun {
    const m = fiche[CLE_MATRICE_SHADOWRUN] as Partial<MatriceShadowrun> | undefined;
    return { version: 1, mode: m?.mode && m.mode in MODES_SHADOWRUN ? m.mode : 'ra',
        cyberdeck: m?.cyberdeck === true, ind: m?.ind === true,
        cibles: Array.isArray(m?.cibles) ? m.cibles : [], cible: m?.cible,
        minimum: entier(fiche[r.minimum]), hausse: entier(fiche[r.hausse]),
        convergence: m?.convergence === true, effetsAppliques: m?.effetsAppliques ?? [] };
}
export function ecrireMatriceShadowrun(r: RegleMatriceShadowrun, m: MatriceShadowrun): Record<string, unknown> {
    return { [CLE_MATRICE_SHADOWRUN]: m, [r.minimum]: m.minimum, [r.hausse]: m.hausse };
}
export function effetsModeShadowrun(mode: ModeShadowrun) {
    const cyber = mode === 'cold-ind' || mode === 'hot-ind';
    return { actionGratuite: cyber, avantage: mode === 'hot-ind',
        biofeedback: mode === 'hot-ind' ? 'mental létal — Volonté' : mode === 'cold-ind' ? 'mental étourdissant — Volonté' : 'sur l’appareil — Firewall',
        ejection: mode === 'hot-ind' ? 'grave' as const : mode === 'cold-ind' ? 'legere' as const : undefined };
}
export function preparerMatriceShadowrun(m: MatriceShadowrun, c: ContexteMatriceShadowrun) {
    const cible = m.cibles.find(x => x.id === c.cible);
    const acces = cible?.acces ?? 0;
    const elevation = Math.max(0, c.vise - acces);
    return { cible, elevation, seuil: c.cybercombat ? undefined : Math.max(0, (cible?.firewall ?? 1) + elevation - entier(c.backdoor) + m.hausse),
        minimum: c.cybercombat ? 0 : m.minimum, avantage: c.cybercombat && effetsModeShadowrun(m.mode).avantage,
        refus: m.convergence ? 'Cyberdeck brické : réparer l’appareil avant de pirater.'
            : !m.cyberdeck || !m.ind ? 'Le piratage exige un cyberdeck et une IND (p. 212).'
                : !cible ? 'Choisissez la cible du piratage.' : undefined };
}
export function consequenceMatriceShadowrun(m: MatriceShadowrun, c: ContexteMatriceShadowrun,
    complication: Complication, reussi: boolean, id: string): MatriceShadowrun {
    if (m.effetsAppliques.includes(id)) return m;
    return { ...m, effetsAppliques: [...m.effetsAppliques, id],
        // Les complications de Piratage alimentent DIEU ; ses malus ne pèsent ensuite que hors cybercombat.
        minimum: m.minimum + (complication === 'mineure' ? 2 : 0),
        hausse: m.hausse + (complication === 'critique' ? 1 : 0),
        convergence: m.convergence || complication === 'desastre',
        cibles: reussi && !c.cybercombat ? m.cibles.map(x => x.id === c.cible ? { ...x, acces: Math.max(x.acces, c.vise) as AccesShadowrun } : x) : m.cibles };
}
/** Redémarrer seul perd les accès ; les malus exigent aussi une heure hors ligne. */
export function redemarrerMatriceShadowrun(m: MatriceShadowrun, heureHorsLigne: boolean): MatriceShadowrun {
    return { ...m, cibles: m.cibles.map(c => ({ ...c, acces: 0 })),
        minimum: heureHorsLigne ? 0 : m.minimum, hausse: heureHorsLigne ? 0 : m.hausse };
}
