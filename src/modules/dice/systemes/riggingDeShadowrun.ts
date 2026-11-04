import { CAPACITES_DU_MONITEUR, encaisserShadowrun, graviteDe, type Moniteur, type Gravite } from './shadowrun';

export type ModeDeControle = 'plongee' | 'capitaine' | 'manuel' | 'autonome';
export const MODES_DE_CONTROLE: Record<ModeDeControle, string> = { plongee: 'Plongée', capitaine: 'Siège du capitaine', manuel: 'Manuel', autonome: 'Autonome' };
export interface ProfilRigger { ind: boolean; ccv: boolean; ccr: boolean; capacite: number; narration: number; changement?: number }
export const PROFIL_RIGGER_VIDE: ProfilRigger = { ind: false, ccv: false, ccr: false, capacite: 3, narration: 1 };
export interface VehiculeShadowrun {
    id: string; nom: string; structure: number; blindage: number; autopilote: number; maniabilite: number; vitesse: number;
    moniteur: Moniteur; debride: boolean;
    legereRecente?: boolean;
    controle?: { mode: ModeDeControle; personnageId: string; connexion: 'cold' | 'hot' };
}
/** David, 04/11/2026 : « Tableau des blessures : 6/10/14 dans cet exemple », p. 69 retenue sur p. 230. */
export function seuilsVehiculeShadowrun(v: VehiculeShadowrun): Record<Gravite, number> {
    return { legere: v.structure + v.blindage, grave: 2 * v.structure + v.blindage, incapacitante: 3 * v.structure + v.blindage };
}
const PRIORITE: Record<ModeDeControle, number> = { plongee: 4, capitaine: 3, manuel: 2, autonome: 1 };
export function prendreControleShadowrun(v: VehiculeShadowrun, flotte: VehiculeShadowrun[], profil: ProfilRigger,
    personnageId: string, mode: ModeDeControle, connexion: 'cold' | 'hot'): { vehicule: VehiculeShadowrun; profil: ProfilRigger; refus?: string } {
    const refuse = (refus: string) => ({ vehicule: v, profil, refus });
    if ((mode === 'plongee' || mode === 'capitaine') && (!profil.ind || (mode === 'plongee' ? !profil.ccv : !profil.ccr)))
        return refuse(mode === 'plongee' ? 'Plongée : IND cybernétique et CCV requis.' : 'Siège du capitaine : IND cybernétique et CCR requises.');
    // L’autonome fait exception : le dernier ordre remplace le précédent (p. 233).
    if (v.controle && v.controle.personnageId !== personnageId && PRIORITE[v.controle.mode] >= PRIORITE[mode]
        && !(v.controle.mode === 'autonome' && mode === 'autonome'))
        return refuse('Commande refusée : priorité supérieure ou première commande de même niveau (p. 233).');
    if (mode === 'plongee' && flotte.some(x => x.id !== v.id && x.controle?.personnageId === personnageId && x.controle.mode === 'plongee'))
        return refuse('Une seule plongée à la fois : libérer le premier véhicule.');
    if (mode === 'capitaine' && flotte.filter(x => x.id !== v.id && x.controle?.personnageId === personnageId && x.controle.mode === 'capitaine').length >= profil.capacite)
        return refuse('Capacité de la CCR atteinte.');
    // Donner le même ordre à un autre drone depuis le siège du capitaine n’est pas
    // un nouveau changement de mode ; la CCR permet plusieurs appareils (p. 233).
    const memeSiege = mode === 'capitaine' && flotte.some(x => x.id !== v.id && x.controle?.personnageId === personnageId
        && x.controle.mode === 'capitaine' && x.controle.connexion === connexion);
    const change = !memeSiege && (v.controle?.personnageId !== personnageId || v.controle?.mode !== mode || v.controle?.connexion !== connexion);
    if (change && profil.changement === profil.narration) return refuse('Un seul changement de mode par narration ; terminer la narration du rigger.');
    return { vehicule: { ...v, controle: { mode, personnageId, connexion } }, profil: { ...profil, ...(change ? { changement: profil.narration } : {}) } };
}
export function impactVehiculeShadowrun(v: VehiculeShadowrun, vd: number): { vehicule: VehiculeShadowrun; cochee?: Gravite; aggravee?: boolean;
    biofeedback?: { personnageId: string; gravite: Gravite; nature: 'letal' | 'etourdissant' } } {
    const gravite = graviteDe(vd, seuilsVehiculeShadowrun(v));
    if (!gravite) return { vehicule: v };
    const e = encaisserShadowrun(gravite, v.moniteur, CAPACITES_DU_MONITEUR);
    const ajoutee = Object.keys(v.moniteur).some(k => v.moniteur[k as keyof Moniteur] !== e.moniteur[k as keyof Moniteur]);
    const blessure = ajoutee && v.controle?.mode === 'plongee'
        ? e.cochee === 'incapacitante' ? 'grave' : e.cochee === 'grave' ? 'legere' : undefined : undefined;
    return { vehicule: { ...v, moniteur: e.moniteur, legereRecente: v.legereRecente || (ajoutee && e.cochee === 'legere') }, cochee: e.cochee, aggravee: e.aggravee,
        ...(blessure ? { biofeedback: { personnageId: v.controle!.personnageId, gravite: blessure as Gravite,
            nature: v.controle!.connexion === 'hot' ? 'letal' as const : 'etourdissant' as const } } : {}) };
}
export interface ContexteRiggingShadowrun { vehicule: VehiculeShadowrun; personnageId: string; pilotage: boolean }
export function effetsRiggingShadowrun(c: ContexteRiggingShadowrun) {
    const v = c.vehicule, controle = v.controle;
    return { autonome: !controle || controle.mode === 'autonome',
        avantage: !!controle && controle.personnageId === c.personnageId && controle.mode === 'plongee' && controle.connexion === 'hot' && c.pilotage,
        graves: v.moniteur.graves, legereRecente: v.legereRecente, incapacite: v.moniteur.incapacitantes > 0,
        refus: controle && controle.mode !== 'autonome' && controle.personnageId !== c.personnageId ? 'Ce véhicule est contrôlé par un autre personnage.' : undefined };
}
