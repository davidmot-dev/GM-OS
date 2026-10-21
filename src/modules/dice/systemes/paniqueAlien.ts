import type { RollResult } from '../DiceEngine';

/** Livre français, p. 103–105 ; aucune règle d'Evolved Edition. */
export interface RegleDePaniqueAlien {
    mecanique: 'alien';
    stress: string;
    agilite: string;
    empathie: string;
    talents?: string;
    androide?: string;
}

export const CLE_PANIQUE_ALIEN = '_gmos_panique_alien';
export type DureeDePanique = 'immediate' | 'round' | 'tour' | 'brise';
export interface EvenementDePanique {
    id: string;
    total: number;
    titre: string;
    duree: DureeDePanique;
    rappel: string;
    malusAgilite: number;
    contagion?: { effet: 'stress' | 'panique'; critere: string; traites: string[]; terminee?: boolean };
}
export interface SuiviDePaniqueAlien {
    version: 1;
    traites: string[];
    effet?: EvenementDePanique;
    demandes: { id: string; cause: string }[];
    historique: EvenementDePanique[];
    traumaEnAttente: boolean;
    traumatismes: string[];
    bilan?: string;
}

export function lireLaPaniqueAlien(fiche: Record<string, unknown>): SuiviDePaniqueAlien {
    const v = fiche[CLE_PANIQUE_ALIEN] as Partial<SuiviDePaniqueAlien> | undefined;
    return {
        version: 1,
        traites: Array.isArray(v?.traites) ? v.traites.filter(x => typeof x === 'string') : [],
        effet: v?.effet && typeof v.effet.id === 'string' ? v.effet : undefined,
        demandes: Array.isArray(v?.demandes) ? v.demandes.filter(d => typeof d.id === 'string' && typeof d.cause === 'string') : [],
        historique: Array.isArray(v?.historique) ? v.historique : [],
        traumaEnAttente: v?.traumaEnAttente === true,
        traumatismes: Array.isArray(v?.traumatismes) ? v.traumatismes.filter(x => typeof x === 'string') : [],
        bilan: typeof v?.bilan === 'string' ? v.bilan : undefined,
    };
}

export function estUnAndroide(regle: { androide?: string }, fiche: Record<string, unknown>): boolean {
    const v = regle.androide ? fiche[regle.androide] : undefined;
    return v === true || v === 1 || ['true', '1', 'on', 'oui'].includes(String(v).toLowerCase());
}

const EFFETS = [
    { total: 7, titre: 'Tressaillement nerveux', duree: 'immediate', rappel: 'Stress +1 ; PJ amicaux à Courte portée : Stress +1.', malusAgilite: 0, contagion: { effet: 'stress', critere: 'PJ amicaux à Courte portée' } },
    { total: 8, titre: 'Tremblement', duree: 'tour', rappel: '−2 dés aux tests utilisant Agilité tant que la panique persiste.', malusAgilite: -2 },
    { total: 9, titre: 'Objet lâché', duree: 'immediate', rappel: 'Maman choisit l’arme ou l’objet important lâché. Stress +1.', malusAgilite: 0 },
    { total: 10, titre: 'Figé', duree: 'round', rappel: 'Paralysé pendant un Round ; prochaine action lente perdue. Stress +1.', malusAgilite: 0, contagion: { effet: 'stress', critere: 'PJ amicaux à Courte portée' } },
    { total: 11, titre: 'Tous aux abris !', duree: 'round', rappel: 'Prochaine action : se mettre à l’abri. Mobilité autorisée pour la retraite au Contact. Stress −1.', malusAgilite: 0, contagion: { effet: 'stress', critere: 'PJ amicaux à Courte portée' } },
    { total: 12, titre: 'Hurlement', duree: 'round', rappel: 'Hurle pendant un Round ; prochaine action lente perdue. Stress −1.', malusAgilite: 0, contagion: { effet: 'panique', critere: 'personnages amicaux qui entendent le hurlement' } },
    { total: 13, titre: 'Fuite', duree: 'tour', rappel: 'Fuir et rester à l’abri, sans action dangereuse ni Mobilité pour la retraite. Stress −1.', malusAgilite: 0, contagion: { effet: 'panique', critere: 'personnages amicaux qui voient la fuite' } },
    { total: 14, titre: 'Psychose', duree: 'brise', rappel: 'Attaquer la personne ou créature la plus proche ; s’arrêter lorsque le personnage ou sa cible est Brisé.', malusAgilite: 0, contagion: { effet: 'panique', critere: 'personnages amicaux témoins de la crise' } },
    { total: 15, titre: 'Catatonie', duree: 'tour', rappel: 'Ne peut plus bouger, parler ou agir.', malusAgilite: 0 },
] as const;

export function effetDePanique(id: string, total: number, meurtriere = false): EvenementDePanique | undefined {
    if (total < 7) return undefined;
    if (meurtriere && total >= 11) return {
        id, total, titre: 'Folie meurtrière', duree: 'brise', malusAgilite: 0,
        rappel: 'Ennemis en vue : les attaquer jusqu’à être Brisé ou jusqu’à ce qu’ils soient tous Brisés.',
        contagion: { effet: 'panique', critere: 'autres PJ à Courte portée', traites: [] },
    };
    const e = EFFETS[Math.min(15, Math.floor(total)) - 7];
    return { ...e, id, total, contagion: 'contagion' in e ? { ...e.contagion, traites: [] } : undefined };
}

/** Un événement est appliqué une seule fois, même si la fiche est rechargée. */
export function appliquerLaPaniqueAlien(
    regle: RegleDePaniqueAlien, champPanique: string | undefined, fiche: Record<string, unknown>,
    id: string, total: number, meurtriere = false,
): Record<string, unknown> {
    const suivi = lireLaPaniqueAlien(fiche);
    if (estUnAndroide(regle, fiche) || suivi.traites.includes(id)) return {};
    const effet = effetDePanique(id, total, meurtriere);
    const delta = [7, 9, 10].includes(total) ? 1 : [11, 12, 13].includes(total) && !meurtriere ? -1 : 0;
    return {
        ...(delta ? { [regle.stress]: Math.max(0, (Number(fiche[regle.stress]) || 0) + delta) } : {}),
        ...(champPanique ? { [champPanique]: total >= 7 ? total : 0 } : {}),
        [CLE_PANIQUE_ALIEN]: {
            ...suivi, effet, traites: [...suivi.traites, id],
            demandes: suivi.demandes.filter(d => d.id !== id),
            historique: effet ? [...suivi.historique, effet] : suivi.historique,
            traumaEnAttente: suivi.traumaEnAttente || total >= 13,
        } satisfies SuiviDePaniqueAlien,
    };
}

export function changerLeStressAlien(regle: RegleDePaniqueAlien, fiche: Record<string, unknown>, id: string, delta: number): Record<string, unknown> {
    const suivi = lireLaPaniqueAlien(fiche);
    if (estUnAndroide(regle, fiche) || suivi.traites.includes(id)) return {};
    return {
        [regle.stress]: Math.max(0, (Number(fiche[regle.stress]) || 0) + delta),
        [CLE_PANIQUE_ALIEN]: { ...suivi, traites: [...suivi.traites, id] } satisfies SuiviDePaniqueAlien,
    };
}

export function demanderUnePaniqueAlien(fiche: Record<string, unknown>, id: string, cause: string): Record<string, unknown> {
    const suivi = lireLaPaniqueAlien(fiche);
    if (suivi.traites.includes(id) || suivi.demandes.some(d => d.id === id)) return {};
    return { [CLE_PANIQUE_ALIEN]: { ...suivi, demandes: [...suivi.demandes, { id, cause }] } satisfies SuiviDePaniqueAlien };
}

export function arreterLaPaniqueAlien(fiche: Record<string, unknown>, champ: string | undefined): Record<string, unknown> {
    const suivi = lireLaPaniqueAlien(fiche);
    return { ...(champ ? { [champ]: 0 } : {}), [CLE_PANIQUE_ALIEN]: { ...suivi, effet: undefined } satisfies SuiviDePaniqueAlien };
}

/** Le livre français p. 104 dit « inférieur », pas « inférieur ou égal ». */
export function cumulAlien(total: number, precedent: number) {
    const cumule = precedent >= 7 && total < precedent;
    return { effectif: cumule ? precedent + 1 : total, cumule };
}

export function modifierDePanique(regle: RegleDePaniqueAlien, fiche: Record<string, unknown>): number {
    const texte = String(regle.talents ? fiche[regle.talents] ?? '' : '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return /nerfs\s+d['’ ]?acier/.test(texte) ? -2 : 0;
}

/** Le 1 de Stress rend le verdict provisoire ; les dés restent visibles. */
export function resultatAvecPanique(resultat: RollResult, effectif?: number): RollResult {
    if (effectif === undefined) return { ...resultat, tagSuccess: undefined, degre: undefined,
        totalDisplay: `${resultat.totalDisplay} — Panique à résoudre` };
    if (effectif < 10) return resultat;
    return { ...resultat, total: 0, successes: 0, tagSuccess: false, degre: 'echec-normal',
        totalDisplay: `${resultat.totalDisplay} — action annulée par la Panique (${effectif})` };
}

/** −2 de Tremblement : retirer d'abord les dés de base, puis le Stress (p. 62). */
export function desApresTremblement(base: number, stress: number, malus: number) {
    const aRetirer = Math.max(0, -malus);
    return { base: Math.max(0, base - aRetirer), stress: Math.max(0, stress - Math.max(0, aRetirer - base)) };
}
