import { niveauDuGroupe } from './reservesDuGroupe';
export const cleDuContact = (i: number, champ: 'name' | 'favours') => `network.contacts.${i}.${champ}`;
/** Diffractions obsidionales p. 134 : Réseau donne un Contact par niveau, deux Faveurs chacun. */
export function contactsDeCabale(fiche: Record<string, unknown>) {
    const n = Math.max(0, Math.min(100, niveauDuGroupe(fiche, 'assets.status.network')));
    return Array.from({ length: n }, (_, i) => ({ i,
        nom: String(fiche[cleDuContact(i, 'name')] ?? `Contact ${i + 1}`),
        points: fiche[cleDuContact(i, 'favours')] === undefined ? 2 : Math.max(0, Math.min(2, niveauDuGroupe(fiche, cleDuContact(i, 'favours')))),
    }));
}
export function rechargerLesFaveurs(fiche: Record<string, unknown>): Record<string, number> {
    return Object.fromEntries(contactsDeCabale(fiche).filter(c => fiche[cleDuContact(c.i, 'favours')] !== 2).map(c => [cleDuContact(c.i, 'favours'), 2]));
}
export function depenserLesFaveurs(fiche: Record<string, unknown>, retenus: number[], cout: number): Record<string, number> | null {
    if (![1, 3, 5].includes(cout)) return null;
    const contacts = contactsDeCabale(fiche).filter(c => retenus.includes(c.i));
    if (contacts.reduce((s, c) => s + c.points, 0) < cout) return null;
    const maj: Record<string, number> = {};
    let reste = cout;
    for (const c of contacts) { const pris = Math.min(c.points, reste); if (pris) maj[cleDuContact(c.i, 'favours')] = c.points - pris; reste -= pris; }
    return maj;
}
