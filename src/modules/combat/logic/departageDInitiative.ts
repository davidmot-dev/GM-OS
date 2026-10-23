/**
 * **Départager l'initiative** — Symbaroum, S6 de l'audit (23/10/2026) :
 * *« Si deux personnages possèdent la même valeur dans l'Attribut Agilité,
 * comparez les valeurs de l'Attribut Vigilance, et si cette valeur là aussi est
 * identique, jetez 1D20. Le joueur avec le score le plus élevé joue d'abord »*
 * (Livre de Base, p. 161 ; Tableau 22, p. 167 : le d20 se relance jusqu'à ce
 * que l'un l'emporte).
 *
 * Les tris ne comparaient que `init` : deux Agilités égales tombaient dans
 * l'ordre de la liste. Le pilote nomme ses départages (`combat.departages`),
 * des formules comme `initiativeFormula` ; le plus haut passe d'abord.
 */

export interface AvecInitiative { init: number; departage?: number[] }

/** Compare deux combattants : l'initiative dans le sens du jeu, puis les départages, toujours le plus haut d'abord. */
export function comparerLInitiative(a: AvecInitiative, b: AvecInitiative, sens: 'asc' | 'desc' = 'desc'): number {
    if (a.init !== b.init) return sens === 'desc' ? b.init - a.init : a.init - b.init;
    const da = a.departage ?? [], db = b.departage ?? [];
    for (let i = 0; i < Math.max(da.length, db.length); i++) {
        const x = da[i] ?? 0, y = db[i] ?? 0;
        if (x !== y) return y - x;
    }
    return 0;
}

/**
 * Donne à chaque combattant ses valeurs de départage, puis **relance le d20 des
 * seuls ex aequo** jusqu'à ce qu'aucun ne le soit plus. Le d20 n'est ajouté
 * qu'à eux : un combattant sans égal n'en a pas besoin.
 */
export function departager<C extends AvecInitiative>(liste: C[], valeurs: (c: C) => number[], d20: () => number): (C & { departage: number[] })[] {
    const avec: (C & { departage: number[] })[] = liste.map(c => ({ ...c, departage: valeurs(c) }));
    const cle = (c: AvecInitiative) => [c.init, ...(c.departage ?? [])].join('|');
    for (let garde = 0; garde < 50; garde++) {
        const groupes = new Map<string, number[]>();
        avec.forEach((c, i) => groupes.set(cle(c), [...(groupes.get(cle(c)) ?? []), i]));
        const exAequo = [...groupes.values()].filter(g => g.length > 1);
        if (!exAequo.length) break;
        for (const groupe of exAequo) for (const i of groupe) avec[i] = { ...avec[i], departage: [...avec[i].departage, d20()] };
    }
    return avec;
}
