import type { RegleDeCoc } from './coc';
import { adapterBonusCoc } from './avantagesDeCoc';
export interface EmplacementVoieCoc { nom: string; reference: string; rangs: string[] }
export const VOIES_COC = {
    contact: { nom: 'Voie des armes de contact', capacites: [
        { id: 'amateur-contact', nom: 'Amateur — arme de contact', rang: 1, page: 29, effet: 'rang', contexte: 'ATC avec une arme de contact', champs: ['attaque_au_contact'] },
        { id: 'amateur-vol', nom: 'Amateur — violence au contact', rang: 1, page: 29, effet: 'rang', contexte: 'VOL face à la violence d’un affrontement à l’arme de contact', champs: ['volonte'] },
    ] },
    furtivite: { nom: 'Voie de la furtivité', capacites: [
        { id: 'furtif', nom: 'Furtif', rang: 1, page: 36, effet: '5', contexte: 'AGI pour déplacement silencieux ou discrétion', champs: ['agilite'] },
        { id: 'vigilant', nom: 'Vigilant', rang: 2, page: 36, effet: '5', contexte: 'PER liée aux cinq sens ; PER 15 pour éviter surprise ou piège', champs: ['perception'] },
    ] },
    investigation: { nom: 'Voie de l’investigation', capacites: [
        { id: 'fin-limier', nom: 'Fin limier', rang: 1, page: 37, effet: 'rang', contexte: 'PER pour une preuve ou INT pour un détail pendant une fouille', champs: ['perception', 'intelligence'] },
        { id: 'specialiste', nom: 'Spécialiste', rang: 2, page: 37, effet: 'de-bonus', contexte: 'INT pour la spécialité d’investigation choisie à la table', champs: ['intelligence'] },
    ] },
} as const;
export type ReferenceVoieCoc = keyof typeof VOIES_COC;
export function capacitesDisponiblesCoc(regle: RegleDeCoc, f: Record<string, unknown>, champ?: string) {
    return (regle.voies?.emplacements ?? []).flatMap((slot, i) => {
        const reference = String(f[slot.reference] ?? '');
        if (!Object.hasOwn(VOIES_COC, reference)) return [];
        if (regle.voies!.emplacements.filter(s => f[s.reference] === reference).length > 1) return [];
        const voie = VOIES_COC[reference as ReferenceVoieCoc];
        // Des rangs cochés isolément ne constituent pas un rang acquis dans cette voie.
        let rang = 0;
        for (const c of slot.rangs) { if (f[c] === true || f[c] === 1 || f[c] === 'true') rang++; else break; }
        return voie.capacites.filter(c => rang >= c.rang && (!champ || (c.champs as readonly string[]).includes(champ)
            || c.id === 'amateur-contact' && regle.dommages?.armes.some(a => a.attaque === champ && f[a.type] === 'contact'))).map(c => ({
            ...c, cle: `${i}:${c.id}`, voie: voie.nom, acquis: rang,
            bonus: c.effet === 'rang' ? regle.des === '3d6' ? Math.ceil(rang / 2) : rang : c.effet === '5' ? adapterBonusCoc(5, regle.des) : 0,
            deBonus: c.effet === 'de-bonus' ? 1 : 0,
        }));
    });
}
