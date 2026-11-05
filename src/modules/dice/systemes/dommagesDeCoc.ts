import { lireLesDegats, ecrireLesDegats } from './degatsDeRuneQuest';
export type TypeArmeCoc = 'contact' | 'lancer' | 'distance' | 'mains-nues' | 'explosif';
export interface ArmeDeCoc { attaque: string; nom: string; dm: string; critique: string; type: string }
export function preparerDommagesCoc(formule: string, type: TypeArmeCoc, force: number, critique: boolean, bonusCritique?: number) {
    const termes = lireLesDegats(formule);
    if (!Number.isFinite(force) || !['contact', 'lancer', 'distance', 'mains-nues', 'explosif'].includes(type) || !termes?.length || termes.some(t => !Number.isFinite(t.n) || Math.abs(t.n) > 10000 || (t.faces && (t.faces < 2 || t.faces > 100 || Math.abs(t.n) > 100)))) return { refus: 'Formule de DM invalide (dés et constantes uniquement).' } as const;
    const maximum = termes.reduce((s, t) => s + (t.faces ? t.n > 0 ? t.n * t.faces : t.n : t.n), 0);
    const forAjoutee = ['contact', 'lancer', 'mains-nues'].includes(type) ? Math.trunc(force) || 0 : 0;
    const bonus = critique && type !== 'explosif' ? bonusCritique ?? maximum : 0;
    if (!Number.isFinite(bonus) || bonus < 0) return { refus: 'Bonus critique invalide.' } as const;
    return { termes, formule: ecrireLesDegats(termes), maximum, force: forAjoutee, bonus: Math.trunc(bonus), maximise: critique && type === 'explosif' };
}
export function lancerDommagesCoc(p: ReturnType<typeof preparerDommagesCoc>, de: (faces: number) => number) {
    if ('refus' in p) return undefined;
    const jets: number[] = [];
    const arme = p.maximise ? p.maximum : p.termes.reduce((s, t) => s + (t.faces ? Math.sign(t.n) * Array.from({ length: Math.abs(t.n) }, () => { const d = de(t.faces!); jets.push(d); return d; }).reduce((a, b) => a + b, 0) : t.n), 0);
    const total = Math.max(0, arme + p.force + p.bonus);
    return { total, jets, detail: `${p.formule}${p.maximise ? ' au maximum' : ` (${jets.join(', ')})`} = ${arme}${p.force ? ` + FOR ${p.force}` : ''}${p.bonus ? ` + critique fixe ${p.bonus}` : ''} = ${total} DM` };
}
