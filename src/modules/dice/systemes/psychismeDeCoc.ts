import { CHOIX_DE_COC, lancerCoc, preparerCoc, type BilanDeCoc, type RegleDeCoc } from './coc';
import { adapterBonusCoc } from './avantagesDeCoc';
export const CLE_PSYCHISME_COC = '__cocPsychisme';
export const CHOCS_COC = ['Brisé', 'Enragé', 'Paniqué', 'Tétanisé'] as const;
export const SEQUELLES_COC = ['Amnésie', 'Déni', 'Fascination', 'Réminiscence'] as const;
export type ChocCoc = typeof CHOCS_COC[number] | 'Ralenti';
export interface PsychismeCoc {
    version: 1; recus: string[]; bonusProchaineVol: number;
    choc?: { nature: ChocCoc; reste: number; rang: number; evenement: string; fuiteImpossible: boolean; bonusPhysique: number };
    sequelles: { id: string; nature: string; evenement: string; rang: number; latente: boolean; resolue?: boolean }[];
    demandes: { id: string; evenement: string; rang: number }[];
}
export const PSYCHISME_COC_VIDE: PsychismeCoc = { version: 1, recus: [], bonusProchaineVol: 0, sequelles: [], demandes: [] };
export function lirePsychismeCoc(f: Record<string, unknown>): PsychismeCoc {
    const p = f[CLE_PSYCHISME_COC] as PsychismeCoc | undefined;
    return p?.version === 1 && Array.isArray(p.recus) && Array.isArray(p.sequelles) && Array.isArray(p.demandes) ? p : PSYCHISME_COC_VIDE;
}
export function parametresChocCoc(rang: number, des?: string) {
    const r = [1, 2, 3].includes(rang) ? rang : 1;
    return { difficulte: des === '3d6' ? [11, 14, 17][r - 1] : [10, 15, 20][r - 1],
        echecJusqua: des === '3d6' ? [3, 4, 6][r - 1] : [1, 3, 6][r - 1], nombreD6: r };
}
export function lancerChocCoc(regle: RegleDeCoc, f: Record<string, unknown>, rang: number, autre: number, capacites: string[], de: (faces: number) => number) {
    const p = parametresChocCoc(rang, regle.des), bonus = lirePsychismeCoc(f).bonusProchaineVol;
    const prep = preparerCoc({ ...regle, psychisme: false, suivi: undefined }, { ...CHOIX_DE_COC, ...p, physique: false, autre: autre + bonus, capacites },
        { champ: regle.volonte, valeur: Number(f[regle.volonte!]) || 0 }, f);
    return { jet: lancerCoc(prep, de), prep, bonusConsomme: bonus };
}
export function confirmerChocCoc(f: Record<string, unknown>, evenement: string, rang: number, bilan: BilanDeCoc, nature: ChocCoc, dureeFinale: number, id: string, bonusConsomme: number, des?: string, fuiteImpossible = false, bonusPhysique = 3): { refus: string } | { apres: PsychismeCoc; texte: string } {
    const p = lirePsychismeCoc(f);
    if (!id || p.recus.includes(id)) return { refus: 'Événement déjà confirmé.' } as const;
    if (!evenement.trim() || ![1, 2, 3].includes(rang)) return { refus: 'Événement et rang 1 à 3 requis.' } as const;
    if (p.bonusProchaineVol !== bonusConsomme) return { refus: 'Le bonus de VOL a changé : préparer de nouveau cet événement.' } as const;
    const echec = bilan === 'echec' || bilan === 'echec-critique';
    if (echec && (!(CHOCS_COC as readonly string[]).includes(nature) || !Number.isInteger(dureeFinale) || dureeFinale < 1 || dureeFinale > 1000 || !Number.isFinite(bonusPhysique))) return { refus: 'Nature et durée finale du choc invalides.' } as const;
    const apres: PsychismeCoc = { ...p, recus: [...p.recus, id], bonusProchaineVol: bilan === 'reussite-critique' ? adapterBonusCoc(5, des) : 0,
        ...(echec ? { choc: { nature, reste: dureeFinale, rang, evenement, fuiteImpossible, bonusPhysique } } : {}),
        demandes: bilan === 'echec-critique' ? [...p.demandes, { id, rang, evenement }] : p.demandes };
    return { apres, texte: `${evenement} — rang ${rang}, ${bilan}${echec ? ` ; ${nature}, ${dureeFinale} rounds` : ''}. ${bilan === 'echec-critique' ? 'Séquelle psychique à choisir explicitement (p. 79–80).' : ''} Échelle d’évolution conservée.` };
}
export function avancerPsychismeCoc(f: Record<string, unknown>, id: string) {
    const p = lirePsychismeCoc(f);
    if (!id || p.recus.includes(id) || !p.choc) return p;
    return { ...p, recus: [...p.recus, id], choc: p.choc.reste > 1 ? { ...p.choc, reste: p.choc.reste - 1 } : undefined };
}
export function blocagePsychismeCoc(f: Record<string, unknown>, physique: boolean) {
    const c = lirePsychismeCoc(f).choc;
    if (c?.nature === 'Paniqué' && c.fuiteImpossible) return 'Paniqué sans fuite possible : inconscient pendant le choc.';
    if (c?.nature === 'Tétanisé' && physique) return 'Tétanisé : état Immobilisé, aucune action physique (p. 79).';
}
export function malusDefensePsychismeCoc(f: Record<string, unknown>, des?: string) {
    const c = lirePsychismeCoc(f).choc;
    return c && (['Enragé', 'Ralenti', 'Tétanisé'].includes(c.nature) || c.nature === 'Paniqué' && c.fuiteImpossible) ? adapterBonusCoc(5, des) : 0;
}
