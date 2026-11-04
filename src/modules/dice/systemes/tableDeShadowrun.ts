import type { VehiculeShadowrun, ProfilRigger } from './riggingDeShadowrun';

/** SR-A4, 04/11/2026 : reçus dans la campagne, réserves natives inchangées (livre p. 78, 127). */
export interface TableShadowrun {
    version: 1; totale: boolean; recus: string[];
    vehicules: VehiculeShadowrun[]; riggers: Record<string, ProfilRigger>;
}
export const TABLE_SHADOWRUN_VIDE: TableShadowrun = { version: 1, totale: false, recus: [], vehicules: [], riggers: {} };
export interface RegleTableShadowrun { planification: string; menace: string }
export type OperationTableShadowrun = { id: string } & (
    { type: 'mode'; totale: boolean } | { type: 'preparation'; succes: number; tempsLimite: boolean }
    | { type: 'flashback'; cout: number; source: 'personnelle' | 'collective'; description: string }
    | { type: 'menace'; delta: 1 | -1 | -3 } | { type: 'utilisation' } | { type: 'desastre' }
);
const entier = (n: number) => Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
export function operationTableShadowrun(table: TableShadowrun, planification: number, menace: number, anarchy: number, op: OperationTableShadowrun) {
    let p = entier(planification), m = entier(menace), a = entier(anarchy);
    const refus = (texte: string) => ({ table, planification: p, menace: m, anarchy: a, texte, appliquee: false });
    if (!op.id || table.recus.includes(op.id)) return refus('Opération déjà traitée.');
    let totale = table.totale, texte = '';
    switch (op.type) {
        case 'mode': totale = op.totale; texte = `Narration ${totale ? 'partagée totale' : 'classique'} confirmée.`; break;
        case 'preparation': {
            const gain = Math.floor(entier(op.succes) / (op.tempsLimite ? 2 : 1)); p += gain;
            texte = `${entier(op.succes)} succès : +${gain} planification (p. 78).`; break;
        }
        case 'flashback':
            if (!Number.isInteger(op.cout) || op.cout < 1 || op.cout > 4 || !op.description.trim()) return refus('Décrire le flashback et choisir son coût entre 1 et 4.');
            if ((op.source === 'collective' ? p : a) < op.cout) return refus('Réserve insuffisante : aucun débit.');
            if (op.source === 'collective') p -= op.cout; else a -= op.cout;
            if (totale) m += 1; // Une utilisation, pas un point par point dépensé (p. 127).
            texte = `Flashback validé : ${op.description.trim()} — ${op.cout} Anarchy ${op.source}.`; break;
        case 'menace':
            if (!totale) return refus('La Menace ne sert qu’en narration partagée totale.');
            if (![1, -1, -3].includes(op.delta) || m + op.delta < 0) return refus('Menace insuffisante : aucun débit.');
            m += op.delta; texte = `Menace ${op.delta > 0 ? '+' : ''}${op.delta} (p. 127).`; break;
        case 'utilisation':
            if (totale) m += 1;
            texte = totale ? 'Utilisation d’Anarchy : +1 Menace (p. 127).' : 'Utilisation d’Anarchy, narration classique.'; break;
        case 'desastre':
            if (!totale || m <= p) return refus('Aucun dépassement de la planification.');
            m = 0; texte = 'Désastre collectif confirmé : Menace remise à zéro (p. 127).'; break;
    }
    return { table: { ...table, totale, recus: [...table.recus, op.id] }, planification: p, menace: m, anarchy: a, texte, appliquee: true };
}
