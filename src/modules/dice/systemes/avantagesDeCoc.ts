/** COC-A4 — David, 04/11/2026. Livre p. 60, 81–82 : une seule échelle d’évolution. */
export const CLE_AVANTAGES_COC = '__cocAvantages';
export type DestinationCoc = 'initiative' | 'defense' | 'dm-infliges' | 'dm-subis' | 'mouvement' | 'legende';
export interface AvantageCoc {
    id: string; destination: DestinationCoc; bonus: number; expiration: 'utilisation' | 'initiative' | 'round' | 'debut-tour';
    mouvement: number; attaque: number; protectionUtilisee?: boolean;
}
export interface AvantagesCoc { version: 1; recus: string[]; actifs: AvantageCoc[] }
export const AVANTAGES_COC_VIDES: AvantagesCoc = { version: 1, recus: [], actifs: [] };
export function lireAvantagesCoc(f: Record<string, unknown>): AvantagesCoc {
    const a = f[CLE_AVANTAGES_COC] as AvantagesCoc | undefined;
    return a?.version === 1 && Array.isArray(a.actifs) && Array.isArray(a.recus) ? a : AVANTAGES_COC_VIDES;
}
export const adapterBonusCoc = (v: number, des?: string) => des === '3d6' ? (({ 2: 1, 5: 3, 10: 5 } as Record<number, number>)[v] ?? v) : v;
export function preparerAvantageCoc(modele: unknown, echelons: number, destination: DestinationCoc, cout: number, des?: string): { refus: string } | { bonus: number; cout: number; apres: number; expiration: AvantageCoc['expiration'] } {
    if (!/h[ée]ros/i.test(String(modele))) return { refus: 'L’échelle active doit être celle du Héros.' } as const;
    if (!Number.isInteger(echelons) || echelons < cout || ![1, 2].includes(cout)) return { refus: 'Échelons insuffisants ou coût invalide.' } as const;
    if (destination === 'legende' && (echelons !== 20 || cout !== 1)) return { refus: 'Légende exige le 20e échelon, dépensé une seule fois.' } as const;
    if (destination === 'mouvement' && (echelons < 10 || cout !== 1)) return { refus: 'Le mouvement exige le palier Héros ; il ne se double pas.' } as const;
    const bonus = destination === 'mouvement' ? 0 : destination === 'legende' ? adapterBonusCoc(10, des) : adapterBonusCoc(echelons >= 10 ? 5 : 2, des) * cout;
    const expiration = destination === 'legende' ? 'debut-tour' : destination === 'initiative' ? 'initiative' : destination === 'mouvement' ? 'round' : 'utilisation';
    return { bonus, cout, apres: echelons - cout, expiration } as const;
}
export function acheterAvantageCoc(f: Record<string, unknown>, champ: string, modele: string | undefined, destination: DestinationCoc, cout: number, id: string, des?: string): { refus: string } | { maj: Record<string, unknown>; effet: AvantageCoc; texte: string } {
    const a = lireAvantagesCoc(f), prep = preparerAvantageCoc(f[modele ?? ''], Number(f[champ]) || 0, destination, cout, des);
    if (!id || a.recus.includes(id)) return { refus: 'Avantage déjà confirmé.' } as const;
    if ('refus' in prep) return prep;
    if (a.actifs.some(e => e.destination === destination)) return { refus: 'Un avantage de cette destination attend déjà son utilisation ou son expiration.' } as const;
    const effet: AvantageCoc = { id, destination, bonus: prep.bonus, expiration: prep.expiration,
        mouvement: ['mouvement', 'legende'].includes(destination) ? 1 : 0, attaque: destination === 'legende' ? 1 : 0 };
    return { maj: { [champ]: prep.apres, [CLE_AVANTAGES_COC]: { ...a, recus: [...a.recus, id], actifs: [...a.actifs, effet] } }, effet,
        texte: `${destination} : ${prep.bonus ? `bonus ${prep.bonus}, ` : ''}${cout} échelon(s) dépensé(s), ${prep.apres} restant(s). Expiration : ${prep.expiration}. Test déjà lancé inchangé (p. 81–82).` };
}
export function bonusAvantageCoc(f: Record<string, unknown>, destination: DestinationCoc | 'test'): number {
    return lireAvantagesCoc(f).actifs.reduce((s, e) => s + (e.destination === destination || e.destination === 'legende' && !['mouvement', 'legende'].includes(destination) && !(destination === 'dm-subis' && e.protectionUtilisee) ? e.bonus : 0), 0);
}
/** Le reçu nomme l’événement réel : un montage React ne consomme et n’expire rien. */
export function avancerAvantagesCoc(f: Record<string, unknown>, evenement: 'debut-tour' | 'initiative' | 'round' | 'defense' | 'dm-infliges' | 'dm-subis' | 'mouvement' | 'attaque', id: string) {
    const a = lireAvantagesCoc(f);
    if (!id || a.recus.includes(id)) return a;
    const actifs = a.actifs.flatMap(e => {
        if (e.expiration === evenement) return [];
        if (e.destination === 'legende') {
            if (evenement === 'dm-subis') return [{ ...e, protectionUtilisee: true }];
            if (evenement === 'mouvement') return [{ ...e, mouvement: Math.max(0, e.mouvement - 1) }];
            if (evenement === 'attaque') return [{ ...e, attaque: Math.max(0, e.attaque - 1) }];
        }
        return e.destination === evenement ? [] : [e];
    });
    return { ...a, recus: [...a.recus, id], actifs };
}
