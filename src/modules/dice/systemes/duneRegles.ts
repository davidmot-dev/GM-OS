/** Dune, livre français p. 139–170, errata 1.1. Reprise demandée par David le 25/10/2026.
 * Les règles du personnage restent pures ; le panneau applique les écritures et paiements.
 */
import type { RollResult } from '../DiceEngine';
import { degreDepuisLeBooleen } from '../degresDeReussite';
import type { HealthSystem } from '../../../types/entity.types';

export const CLE_DUNE = '_gmos_dune';
export type ValeursDune = Record<string, unknown>;
export interface RegleDeDune {
    competences: string[];
    principes: string[];
    determination: string;
    progression: string;
    specialisations: string;
    talents: string;
    traits: string;
    atouts: string;
}
export interface AtoutDune {
    id: string; nom: string; qualite: number; tangible: boolean; permanent: boolean;
    usage: 'offensif' | 'defensif' | 'autre'; zone: string; neutralise: boolean;
}
export interface SuiviDune {
    version: 1; aventure: string; scene: string;
    maximes: Record<string, string>; bafoues: string[]; recuperes: string[];
    determinationDansLaScene: boolean;
    atouts: AtoutDune[];
    progression: { aventure: string; genre: string; objet: string; cout: number }[];
    competencesAugmentees: string[];
    evenements: string[];
    defaite?: { genre?: 'mineur' | 'notable' | 'militaire'; vaincu: boolean; progression: number; conditions: number; qualite: number; durable: string; recuperation: number; survieScene?: string };
}
export const entierDune = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const x = Number(v); return Math.min(max, Math.max(min, Number.isFinite(x) ? Math.trunc(x) : min));
};
export const lignesDune = (v: unknown) => String(v ?? '').split(/[\n;]+/).map(x => x.trim()).filter(Boolean);
export function lireDune(v: ValeursDune): SuiviDune {
    const s = v[CLE_DUNE] as SuiviDune | undefined;
    return s?.version === 1 && Array.isArray(s.atouts) && Array.isArray(s.progression) && s.maximes
        ? s : { version: 1, aventure: '', scene: '', maximes: {}, bafoues: [], recuperes: [], determinationDansLaScene: false,
            atouts: [], progression: [], competencesAugmentees: [], evenements: [] };
}
export function noterDune(s: SuiviDune, texte: string): SuiviDune {
    return { ...s, evenements: [...s.evenements, texte].slice(-200) };
}
export function recupererPrincipe(s: SuiviDune, v: ValeursDune, principe: string, maxime: string, voisin?: string, entreAventures = false) {
    if (!s.bafoues.includes(principe)) throw new Error('Ce principe n’est pas bafoué.');
    if (!entreAventures && s.determinationDansLaScene) throw new Error('Cette scène a gagné ou dépensé de la Détermination.');
    const maj: ValeursDune = {};
    const maximes = { ...s.maximes };
    if (voisin) {
        const haut = entierDune(v[principe], 4, 8), bas = entierDune(v[voisin], 4, 8);
        if (bas !== haut - 1 || haut <= 4) throw new Error('Choisissez le principe immédiatement inférieur.');
        maj[principe] = haut - 1; maj[voisin] = bas + 1;
        if (haut - 1 < 6) maximes[principe] = '';
        if (bas + 1 === 6) {
            if (!maxime.trim()) throw new Error('Le principe qui atteint 6 doit recevoir une maxime.');
            maximes[voisin] = maxime.trim();
        }
    } else {
        if (!maxime.trim()) throw new Error('Écrivez la nouvelle maxime.');
        maximes[principe] = maxime.trim();
    }
    return { ...maj, [CLE_DUNE]: noterDune({ ...s, maximes, bafoues: s.bafoues.filter(p => p !== principe),
        recuperes: [...new Set([...s.recuperes, principe])] }, `Principe récupéré : ${principe}`) };
}

export interface AssistantDune { nom: string; seuil: number; critique: number }
export interface ChoixDune {
    marge: number; maximeAlignee: boolean; unAutomatique: boolean;
    contradiction: 'aucune' | 'respecter' | 'bafouer';
    assistants: AssistantDune[];
    opposition: { reussites: number; gene: number; facteurs: number; pnj: boolean } | null;
    bonus: number; ennemi: boolean;
}
export const CHOIX_DUNE: ChoixDune = { marge: 1, maximeAlignee: false, unAutomatique: false, contradiction: 'aucune', assistants: [], opposition: null, bonus: 0, ennemi: false };
export interface DeDune { val: number; seuil: number; critique: number; aide?: string }
export const difficulteDune = (o: NonNullable<ChoixDune['opposition']>) => Math.max(0, o.reussites - o.gene + o.facteurs);
export function desDune(base: number[], seuil: number, critique: number, c: ChoixDune, de: () => number): DeDune[] {
    return [...base.map((val, i) => ({ val: i === 0 && c.unAutomatique ? 1 : val, seuil, critique })),
        ...c.assistants.map(a => ({ val: de(), seuil: a.seuil, critique: a.critique, aide: a.nom }))];
}
export function compteDune(des: DeDune[], marge: number) {
    let base = 0, aide = 0, complications = 0;
    for (const d of des) {
        const r = d.val <= d.seuil ? (d.val <= d.critique ? 2 : 1) : 0;
        if (d.aide) aide += r; else base += r;
        if (d.val >= 21 - entierDune(marge, 1, 5)) complications++;
    }
    return { reussites: base ? base + aide : 0, base, aide, complications };
}
export function resultatDune(des: DeDune[], marge: number, difficulte: number): RollResult {
    const c = compteDune(des, marge), reussi = c.reussites >= difficulte;
    return { total: c.reussites, modifier: 0, successes: c.reussites, fails: c.complications,
        tagSuccess: reussi, degre: degreDepuisLeBooleen(reussi),
        rolls: des.map(d => ({ val: d.val, sides: 20, isCritMax: d.val <= d.critique && d.val <= d.seuil, isCritMin: d.val >= 21 - marge,
            ...(d.aide ? { cssClass: 'aide-dune', displayStr: d.aide } : {}) })),
        totalDisplay: `${c.reussites} réussite${c.reussites > 1 ? 's' : ''}${c.aide && !c.base ? ' (aide perdue : aucune réussite du personnage)' : ''} · ${c.complications} complication${c.complications > 1 ? 's' : ''}` };
}
/** L'aide ne fait jamais partie des dés que la Détermination permet de relancer (p. 158). */
export function relancerDune(des: DeDune[], indices: number[], de: () => number) {
    return des.map((d, i) => !d.aide && indices.includes(i) ? { ...d, val: de() } : d);
}
export interface BilanDune { normal: number; bonus: number; depense: number; clos: boolean }
export function bilanDune(reussites: number, difficulte: number, bonus = 0): BilanDune {
    return { normal: Math.max(0, reussites - difficulte), bonus: reussites >= difficulte ? entierDune(bonus) : 0, depense: 0, clos: false };
}
/** L'Impulsion reste sur le test jusqu'au choix « Conserver » : aucune correction rétroactive de réserve. */
export function depenserDune(b: BilanDune, montant: number, reserve: number) {
    if (b.clos) throw new Error('Le bilan de ce test est fermé.');
    montant = entierDune(montant);
    const bonus = Math.min(montant, b.bonus), normal = Math.min(montant - bonus, b.normal), table = montant - bonus - normal;
    if (table > reserve) throw new Error('Impulsion insuffisante.');
    return { bilan: { ...b, bonus: b.bonus - bonus, normal: b.normal - normal, depense: b.depense + montant }, table };
}
export function conserverDune(b: BilanDune, reserve: number, ennemi = false) {
    if (b.clos) throw new Error('Le bilan de ce test est fermé.');
    const verse = ennemi ? b.normal : Math.min(b.normal, Math.max(0, 6 - reserve));
    return { verse, perdu: b.normal - verse + b.bonus, bilan: { ...b, normal: 0, bonus: 0, clos: true } };
}
export function attaqueDune(genre: 'mineur' | 'notable' | 'militaire', competence: number, defense: number, progression: number, qualite: number, reussi: boolean, ameliorer = false) {
    const conditions = entierDune(competence, 4, 8) + entierDune(defense);
    const qualiteEffective = entierDune(qualite, 0, 4) + (ameliorer ? 1 : 0);
    const avance = reussi ? 2 + qualiteEffective : 0;
    const apres = genre === 'mineur' && reussi ? conditions : Math.min(conditions, entierDune(progression) + avance);
    return { conditions, apres, avance, qualite: qualiteEffective, vaincu: reussi && (genre === 'mineur' || apres >= conditions), cout: ameliorer && reussi ? 2 : 0 };
}
export const menaceInitialeDune = (type: number, joueurs: number, ajustement = 0) => Math.max(0, entierDune(type, 0, 3) * entierDune(joueurs, 0, 100) + Math.trunc(ajustement));
export function santeDuConflitDune(d: NonNullable<SuiviDune['defaite']>): HealthSystem {
    return { type: 'clocks', data: { filled: d.progression, segments: d.conditions, dune: d }, state: d.vaincu ? 'critical' : 'healthy', badges: [] };
}

export type AchatDune = { genre: 'competence' | 'specialisation' | 'talent' | 'permanent' | 'qualite'; objet: string; reconversion?: string };
export function acheterProgressionDune(r: RegleDeDune, v: ValeursDune, a: AchatDune) {
    const s = lireDune(v), maj: ValeursDune = {}, objet = a.objet.trim();
    if (!s.aventure) throw new Error('Nommez l’aventure achevée.');
    if (s.progression.some(p => p.aventure === s.aventure)) throw new Error('Une progression a déjà été acquise après cette aventure.');
    if (!objet) throw new Error('Choisissez la progression.');
    let cout = 0, suite = s;
    if (a.genre === 'competence') {
        if (!r.competences.includes(objet) || entierDune(v[objet]) >= 8 || s.competencesAugmentees.includes(objet)) throw new Error('Cette compétence ne peut plus augmenter.');
        cout = 10 + s.progression.filter(p => p.genre === 'competence' && !p.objet.includes('←')).length;
        maj[objet] = entierDune(v[objet], 4, 8) + 1;
        if (a.reconversion) {
            if (!r.competences.includes(a.reconversion) || a.reconversion === objet || entierDune(v[a.reconversion]) <= 4) throw new Error('La compétence cédée doit dépasser 4.');
            maj[a.reconversion] = entierDune(v[a.reconversion]) - 1;
        } else suite = { ...suite, competencesAugmentees: [...s.competencesAugmentees, objet] };
    } else if (a.genre === 'specialisation' || a.genre === 'talent') {
        const champ = a.genre === 'talent' ? r.talents : r.specialisations, liste = lignesDune(v[champ]);
        if (liste.includes(objet)) throw new Error('Cette capacité figure déjà sur la fiche.');
        if (a.genre === 'specialisation') {
            const competence = objet.split(':')[0].trim();
            if (!r.competences.includes(competence) || entierDune(v[competence]) < 6 || !objet.includes(':')) throw new Error('En progression : compétence à 6 minimum, puis « compétence : spécialisation ».');
        }
        cout = liste.length * (a.genre === 'talent' ? 3 : 1);
        if (a.reconversion && !liste.includes(a.reconversion)) throw new Error('Capacité à abandonner introuvable.');
        maj[champ] = [...liste.filter(x => x !== a.reconversion), objet].join('\n');
    } else {
        if (a.reconversion) throw new Error('La reconversion concerne compétences, spécialisations et talents.');
        const atout = s.atouts.find(x => x.id === objet);
        if (!atout) throw new Error('Atout introuvable.');
        if (a.genre === 'permanent' && atout.permanent) throw new Error('Cet atout est déjà permanent.');
        if (a.genre === 'qualite' && atout.qualite >= 4) throw new Error('La qualité atteint déjà 4.');
        cout = a.genre === 'permanent' ? 3 : 2 * (atout.qualite + 1); // Errata 1.1, p. 139.
        suite = { ...suite, atouts: s.atouts.map(x => x.id === objet ? { ...x, permanent: true, qualite: x.qualite + (a.genre === 'qualite' ? 1 : 0) } : x) };
    }
    if (a.reconversion) cout = Math.ceil(cout / 2);
    const points = entierDune(v[r.progression]);
    if (points < cout) throw new Error(`${cout} points nécessaires, ${points} disponibles.`);
    return { ...maj, [r.progression]: points - cout, [CLE_DUNE]: noterDune({ ...suite, progression: [...suite.progression,
        { aventure: s.aventure, genre: a.genre, objet: objet + (a.reconversion ? ` ← ${a.reconversion}` : ''), cout }] }, `Progression : ${objet}, ${cout} points`) };
}
