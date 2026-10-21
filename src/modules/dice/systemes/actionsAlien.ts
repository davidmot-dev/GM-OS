import type { Combatant } from '../../combat/types';

/** Livre français p. 87–92, 97, 112. Une carte est un créneau, jamais une seconde créature. */
export interface BudgetAlien { lentes: number; rapides: number; surveillance?: string; recus: string[]; herite?: boolean }
export interface ActionsDuCombattantAlien { cartes: number[]; carteActive?: number; budgets: Record<string, BudgetAlien> }
export type ActionAlien = 'lente' | 'rapide' | 'blocage' | 'surveillance' | 'tir-surveillance';
export const budgetViergeAlien = (): BudgetAlien => ({ lentes: 0, rapides: 0, recus: [] });
export function payerActionAlien(b: BudgetAlien, action: ActionAlien, id: string, direction = ''): BudgetAlien {
    if (b.recus.includes(id)) return b;
    const lente = action === 'lente' || action === 'tir-surveillance';
    if (lente ? b.lentes > 0 || b.rapides > 1 : b.rapides >= (b.lentes ? 1 : 2)) return b;
    if (action === 'surveillance' && (!direction.trim() || b.lentes || b.rapides)) return b;
    if (action === 'tir-surveillance' && !b.surveillance) return b;
    return { ...b, lentes: b.lentes + (lente ? 1 : 0), rapides: b.rapides + (lente ? 0 : 1),
        surveillance: action === 'surveillance' ? direction.trim() : action === 'tir-surveillance' ? b.surveillance : undefined,
        recus: [...b.recus, id] };
}
export function cartesDuCombattantAlien(c: Combatant): number[] {
    return c.alien?.cartes.length ? c.alien.cartes : [c.init];
}
export function fileDesInitiativesAlien(combattants: Combatant[]) {
    return combattants.flatMap(c => cartesDuCombattantAlien(c).map(carte => ({ id: c.id, carte })))
        .sort((a,b) => a.carte - b.carte);
}
export function budgetDuCombattantAlien(c: Combatant, round: number, carte: number): BudgetAlien {
    const courant=c.alien?.budgets[`${round}:${carte}`],ancien=c.alien?.budgets[`${round-1}:${carte}`];
    return courant??(ancien?.surveillance?{...ancien,herite:true}:budgetViergeAlien());
}
/** Dix cartes sans remise. Au-delà, Maman doit d'abord grouper les PNJ (p. 87). */
export function distribuerCartesAlien(combattants: Combatant[], vitesse: (c: Combatant) => number, hasard = Math.random): Combatant[] | undefined {
    const nombres = combattants.map(c => Math.max(1, Math.trunc(vitesse(c))));
    if (nombres.reduce((a,b) => a+b,0) > 10) return undefined;
    const paquet = Array.from({length:10},(_,i)=>i+1);
    for(let i=9;i>0;i--){const j=Math.floor(hasard()*(i+1));[paquet[i],paquet[j]]=[paquet[j],paquet[i]];}
    return combattants.map((c,i) => {
        const cartes = paquet.splice(0,nombres[i]).sort((a,b)=>a-b);
        return {...c,init:cartes[0],alien:{cartes,carteActive:cartes[0],budgets:{}}};
    }).sort((a,b)=>a.init-b.init);
}
