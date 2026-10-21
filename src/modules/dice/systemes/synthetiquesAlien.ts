import type { CombatAlien } from './combatAlien';
import type { TableEntry } from '../../tables/types';
import type { HealthSystem } from '../../../types/entity.types';
import { estUnAndroide } from './paniqueAlien';

/** Livre français p. 111, relu le 21/10/2026 pour A4 : aucune règle Evolved. */
export interface SynthetiqueAlien {
    avaries: { id: string; code: number; titre: string; effet: string; actionPerdue?: boolean }[];
    dernierCritique?: number;
    arret: boolean;
    reactive: boolean;
    traumatismes: string[];
    intervention?: { id: string; mode: 'reparer' | 'reactiver'; echeance: number; energie: boolean };
    interventionsTraitees: string[];
}
export const synthetiqueVierge = (): SynthetiqueAlien => ({ avaries: [], arret: false, reactive: false, traumatismes: [], interventionsTraitees: [] });
export const lireLeSynthetique = (s: CombatAlien): SynthetiqueAlien => s.synthetique ?? synthetiqueVierge();
export const systemeArrete = (s: CombatAlien): boolean => lireLeSynthetique(s).arret;
/** Le modèle commun doit aussi garder le synthétique en lice à zéro Santé. */
export function projeterLaSanteSynthetique(regle: { androide?: string } | undefined, fiche: Record<string, unknown>, s: CombatAlien, sante: HealthSystem | undefined): HealthSystem | undefined {
    if (!sante || !regle || !estUnAndroide(regle, fiche)) {
        if (!sante?.data.alienSynthetique) return sante;
        const data = { ...sante.data }; delete data.alienSynthetique;
        return { ...sante, data };
    }
    const arret = systemeArrete(s);
    return { ...sante, state: arret ? 'critical' : sante.state === 'dead' ? 'wounded' : sante.state,
        data: { ...sante.data, alienSynthetique: { arret } } };
}
export function codeDuCritiqueSynthetique(s: CombatAlien, de: number): number {
    if (!Number.isInteger(de) || de < 1 || de > 6) throw new Error('Le critique synthétique exige un D6.');
    return Math.min(6, de === lireLeSynthetique(s).dernierCritique ? de + 1 : de);
}
export function ajouterUneAvarie(s: CombatAlien, id: string, de: number, entrees: TableEntry[]): CombatAlien {
    // Respecter l'ordre des coups : seule la blessure immédiatement précédente aggrave le résultat.
    if (s.critiques[0] !== id || s.blessureTraitee.includes(id)) return s;
    const code = codeDuCritiqueSynthetique(s, de), entree = entrees.find(e => e.min <= code && e.max >= code);
    if (!entree) return s;
    const a = lireLeSynthetique(s);
    return { ...s, critiques: s.critiques.slice(1), blessureTraitee: [...s.blessureTraitee, id],
        synthetique: { ...a, dernierCritique: code, arret: a.arret || code === 6, reactive: code === 6 ? false : a.reactive,
            avaries: [...a.avaries, { id, code, titre: entree.title, effet: entree.effect ?? '', ...(code === 1 ? { actionPerdue: false } : {}) }] } };
}
export function commencerUneIntervention(s: CombatAlien, id: string, mode: 'reparer' | 'reactiver', energie: boolean): CombatAlien {
    const a = lireLeSynthetique(s);
    if (a.intervention || a.interventionsTraitees.includes(id) || s.critiques.length) return s;
    if (mode === 'reactiver' ? !a.arret || a.reactive || !energie : a.arret && !a.reactive) return s;
    return { ...s, synthetique: { ...a, intervention: { id, mode, energie, echeance: s.temps[mode === 'reparer' ? 'quart' : 'tour'] + 1 } } };
}
export function interventionPrete(s: CombatAlien): boolean {
    const i = lireLeSynthetique(s).intervention;
    return !!i && s.temps[i.mode === 'reparer' ? 'quart' : 'tour'] >= i.echeance;
}
/** Le résultat Comtech vient d'un test réellement joué ; le reçu interdit de le payer deux fois. */
export function terminerUneIntervention(s: CombatAlien, id: string, reussites: number, trauma?: string): CombatAlien {
    const a = lireLeSynthetique(s), i = a.intervention;
    if (!i || i.id !== id || a.interventionsTraitees.includes(id) || !interventionPrete(s) || s.critiques.length) return s;
    if (i.mode === 'reparer' && a.arret && !a.reactive) return s;
    if (i.mode === 'reactiver' && reussites > 0 && (!i.energie || !trauma?.trim())) return s;
    const fin = { ...a, intervention: undefined, interventionsTraitees: [...a.interventionsTraitees, id] };
    if (reussites <= 0) return { ...s, synthetique: fin };
    if (i.mode === 'reactiver') return { ...s, synthetique: { ...fin, reactive: true, traumatismes: [...a.traumatismes, trauma!.trim()] } };
    return { ...s, synthetique: { ...fin, arret: false, reactive: false, avaries: [], dernierCritique: undefined } };
}
export function consommerLActionPerdue(s: CombatAlien, id: string): CombatAlien {
    const a = lireLeSynthetique(s);
    return { ...s, synthetique: { ...a, avaries: a.avaries.map(v => v.id === id && v.code === 1 ? { ...v, actionPerdue: true } : v) } };
}
export function abandonnerUneIntervention(s: CombatAlien): CombatAlien {
    const a = lireLeSynthetique(s), i = a.intervention;
    return !i ? s : { ...s, synthetique: { ...a, intervention: undefined, interventionsTraitees: [...a.interventionsTraitees, i.id] } };
}
export function immuniteSynthetique(origine: string): boolean {
    return ['vide', 'froid', 'maladie', 'vacuum', 'cold', 'disease'].includes(origine);
}
