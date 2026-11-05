import { etatDuProfilCoc, etatsDuProfilCoc, lireProfilCoc, tailleSanteCoc } from './profilsDeCoc';
export const CLE_SUIVI_COC = '__cocSuivi';
export type GenreDemandeCoc = 'affaibli' | 'blesse' | 'mourant' | 'action-blesse' | 'action-mourant' | 'reveil' | 'coup-grace' | 'mort-directe' | 'sequelle';
export interface DemandeCoc { id: string; genre: GenreDemandeCoc; difficulte?: number; traitee?: boolean }
export interface SuiviCoc {
    version: 1; sequence: number; recus: string[]; demandes: DemandeCoc[]; actionsPerdues: number;
    physiqueAutorisee: boolean; mort: boolean; coma?: 'minutes' | 'rounds'; comaReste?: number; stabilise: boolean;
    inconscience?: { unite: 'round' | 'tour'; reste: number; reveil: boolean };
}
export const SUIVI_COC_VIDE: SuiviCoc = { version: 1, sequence: 0, recus: [], demandes: [], actionsPerdues: 0, physiqueAutorisee: false, mort: false, stabilise: false };
export function lireSuiviCoc(f: Record<string, unknown>): SuiviCoc {
    const s = f[CLE_SUIVI_COC] as SuiviCoc | undefined;
    return s?.version === 1 && Array.isArray(s.demandes) && Array.isArray(s.recus) ? s : SUIVI_COC_VIDE;
}
function demander(s: SuiviCoc, genre: GenreDemandeCoc, difficulte?: number): SuiviCoc {
    const sequence = s.sequence + 1;
    return { ...s, sequence, demandes: [...s.demandes, { id: `coc-${sequence}`, genre, difficulte }] };
}
/** Le pire état franchi suffit : les effets d’états de santé ne se cumulent pas (p. 71-72). */
export function signalerBlessureCoc(f: Record<string, unknown>, avant: number, apres: number, critique: boolean, mortDirecte: boolean): SuiviCoc {
    let s = lireSuiviCoc(f);
    const p = lireProfilCoc(f); if (p?.bande) return s;
    const franchi = etatsDuProfilCoc(p).filter(e => avant < e.echelon && apres >= e.echelon).pop();
    if (franchi) {
        s = { ...s, physiqueAutorisee: false, stabilise: false,
            demandes: s.demandes.map(d => ['affaibli', 'blesse', 'mourant'].includes(d.genre) ? { ...d, traitee: true } : d) };
        if (franchi.label === 'Affaibli') s = demander(s, 'affaibli', 10);
        if (franchi.label === 'Blessé') s = demander(s, 'blesse', 15);
        if (franchi.label === 'Mourant') s = demander(s, 'mourant');
    }
    if (mortDirecte) s = demander(s, 'mort-directe');
    else if (avant >= tailleSanteCoc(p) && apres >= avant) s = demander(s, 'coup-grace', 20);
    if (critique && apres >= tailleSanteCoc(p)) s = demander(s, 'sequelle');
    return s;
}
export type OperationSanteCoc = { id: string } & (
    { type: 'resoudre'; demande: string; reussite?: boolean; duree?: number }
    | { type: 'action-physique' } | { type: 'consommer-action-perdue' } | { type: 'consommer-autorisation' }
    | { type: 'avancer'; unite: 'round' | 'tour' | 'minute' } | { type: 'stabiliser' } | { type: 'rectifier' }
);
export function operationSanteCoc(f: Record<string, unknown>, echelons: number, con: number, op: OperationSanteCoc) {
    let s = lireSuiviCoc(f), dm = 0, texte = '';
    const refus = (texte: string) => ({ suivi: s, dm: 0, texte, appliquee: false });
    if (!op.id || s.recus.includes(op.id)) return refus('Opération déjà confirmée.');
    const profil = lireProfilCoc(f), etat = etatDuProfilCoc(echelons, profil);
    if (op.type === 'rectifier') { s = { ...SUIVI_COC_VIDE, sequence: s.sequence, recus: s.recus }; texte = 'Suivi rectifié par le meneur ; santé conservée.'; }
    else if (op.type === 'stabiliser') { s = { ...s, coma: undefined, comaReste: undefined, stabilise: true, demandes: s.demandes.map(d => ['mort-directe', 'reveil'].includes(d.genre) ? { ...d, traitee: true } : d) }; texte = 'Stabilisation après soins réussis confirmée ; blessures conservées.'; }
    else if (op.type === 'consommer-action-perdue') {
        if (s.actionsPerdues < 1) return refus('Aucune action perdue en attente.');
        s = { ...s, actionsPerdues: s.actionsPerdues - 1 }; texte = 'Prochaine action perdue consommée une seule fois.';
    } else if (op.type === 'consommer-autorisation') {
        if (!s.physiqueAutorisee) return refus('Aucune autorisation d’action physique.');
        s = { ...s, physiqueAutorisee: false }; texte = 'Autorisation de l’action physique consommée.';
    } else if (op.type === 'action-physique') {
        if (s.mort || s.inconscience || s.coma || s.actionsPerdues) return refus('Résoudre d’abord l’incapacité ou l’action perdue.');
        if (!etat || !['Blessé', 'Mourant'].includes(etat.label)) return refus('Cet état ne demande pas de test préalable à l’action physique.');
        if (s.demandes.some(d => !d.traitee && d.genre.startsWith('action-'))) return refus('Un test préalable est déjà en attente.');
        s = demander(s, etat.label === 'Blessé' ? 'action-blesse' : 'action-mourant', etat.label === 'Blessé' ? 15 : 20); texte = 'Test de CON préalable à l’action physique proposé.';
    } else if (op.type === 'avancer') {
        if (s.coma && ((s.coma === 'minutes' && op.unite === 'minute') || (s.coma === 'rounds' && op.unite === 'round')) && !s.stabilise) {
            const reste = Math.max(0, (s.comaReste ?? con) - 1);
            s = { ...s, comaReste: reste };
            if (!reste && !s.demandes.some(d => d.genre === 'mort-directe' && !d.traitee)) s = demander(s, 'mort-directe');
        }
        if (s.inconscience?.unite === op.unite) {
            const reste = s.inconscience.reste - 1;
            s = { ...s, inconscience: reste > 0 ? { ...s.inconscience, reste } : undefined };
            if (reste <= 0 && lireSuiviCoc(f).inconscience?.reveil) s = demander(s, 'reveil', 20);
        }
        texte = op.unite === 'tour' ? 'Fin de tour du personnage confirmée.' : op.unite === 'minute' ? 'Minute écoulée confirmée.' : 'Round écoulé confirmé.';
    } else if (op.type === 'resoudre') {
        const d = s.demandes.find(d => d.id === op.demande && !d.traitee);
        if (!d) return refus('Conséquence déjà résolue ou introuvable.');
        if (d.difficulte && op.reussite === undefined) return refus('Lancer ou renseigner le résultat de CON.');
        const besoinDuree = d.genre === 'mourant' || d.genre === 'blesse' && !op.reussite;
        if (besoinDuree && (!Number.isInteger(op.duree) || op.duree! < 1 || op.duree! > 6)) return refus('Durée d’inconscience : résultat de 1d6 (1–6).');
        s = { ...s, demandes: s.demandes.map(x => x.id === d.id ? { ...x, traitee: true } : x) };
        if (d.genre === 'affaibli' && !op.reussite || d.genre === 'blesse') s = { ...s, actionsPerdues: Math.max(1, s.actionsPerdues) };
        if (d.genre === 'mourant' || d.genre === 'blesse' && !op.reussite) s = { ...s, inconscience: { unite: 'round', reste: op.duree!, reveil: d.genre === 'mourant' } };
        if (d.genre === 'action-blesse') {
            if (op.reussite) s = { ...s, physiqueAutorisee: true };
            else { dm = 1; s = { ...s, inconscience: { unite: 'tour', reste: 2, reveil: false } }; }
        }
        if (d.genre === 'action-mourant') s = op.reussite ? { ...s, physiqueAutorisee: true }
            : { ...s, coma: 'rounds', comaReste: Math.max(0, con), mort: con <= 0 };
        if (d.genre === 'reveil' && !op.reussite) s = { ...s, coma: 'minutes', comaReste: Math.max(0, con), mort: con <= 0 };
        if (d.genre === 'mort-directe' || d.genre === 'coup-grace' && !op.reussite) s = { ...s, mort: true };
        texte = `${d.genre} confirmé${d.difficulte ? ` : CON ${d.difficulte}, ${op.reussite ? 'réussite' : 'échec'}` : ''}.`;
        if (s.coma) texte += ` Stabilisation urgente : mort après ${Math.max(0, con)} ${s.coma}, à confirmer par le meneur.`;
        if (d.genre === 'sequelle') texte += ' Séquelle physique à choisir avec le livre.';
    }
    return { suivi: { ...s, recus: [...s.recus, op.id] }, dm, texte, appliquee: true };
}
export function blocageSanteCoc(f: Record<string, unknown>, echelons: number, physique: boolean): string | undefined {
    const s = lireSuiviCoc(f);
    if (s.mort) return 'Mort confirmée : aucun test possible.';
    if (s.demandes.some(d => !d.traitee && d.genre !== 'sequelle')) return 'Conséquence de santé en attente de confirmation.';
    if (s.inconscience || s.coma) return 'Inconscient : résoudre les conséquences de santé.';
    if (s.actionsPerdues) return 'La prochaine action est perdue : confirmer sa consommation.';
    if (physique && ['Blessé', 'Mourant'].includes(etatDuProfilCoc(echelons, lireProfilCoc(f))?.label ?? '') && !s.physiqueAutorisee)
        return 'Test de CON préalable requis dans Santé et conséquences.';
}
