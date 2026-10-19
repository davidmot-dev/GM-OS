import { operationDeVoyageur, type DonneesDeVoyage } from './operationsDeVoyageur';

/** Livre 2.3.1, p. 158–161. Les deux compteurs s'annulent, pas le retour du moral à zéro. */
export interface MoralVoyageur { moral: number; exaltation: number; dissolution: number; }
export type SituationDeMoral = 'heureuse'|'neutre'|'malheureuse';
export function entierVoyageur(v: unknown, min = 0, max = 1000000): number {
    if (v === '' || v === null || typeof v === 'boolean' || !['number','string'].includes(typeof v)
        || !Number.isSafeInteger(Number(v)) || Number(v) < min || Number(v) > max) throw new Error(`Nombre entier attendu entre ${min} et ${max}.`);
    return Number(v);
}
export function lireMoral(d: DonneesDeVoyage): MoralVoyageur {
    const m = d.__rddMoral231 as {version?:number;exaltation?:unknown;dissolution?:unknown}|undefined;
    if (m !== undefined && (!m || m.version !== 1)) throw new Error('Compteurs de moral invalides.');
    const r = {moral:entierVoyageur(d.moral ?? 0,-3,3),exaltation:entierVoyageur(m?.exaltation ?? 0),dissolution:entierVoyageur(m?.dissolution ?? 0)};
    if (r.exaltation && r.dissolution) throw new Error('Exaltation et dissolution doivent s’annuler mutuellement.');
    return r;
}
export function majMoral(m: MoralVoyageur): DonneesDeVoyage {
    return {moral:m.moral,__rddMoral231:{version:1,exaltation:m.exaltation,dissolution:m.dissolution}};
}
export function varierMoral(m: MoralVoyageur, delta: -1|0|1): MoralVoyageur {
    const r = {...m};
    if (delta === 1 && r.moral === 3) {if (r.dissolution) r.dissolution--;else r.exaltation++;}
    else if (delta === -1 && r.moral === -3) {if (r.exaltation) r.exaltation--;else r.dissolution++;}
    else r.moral += delta;
    return r;
}
export function resultatMoral(m: MoralVoyageur, situation: SituationDeMoral, de: number): MoralVoyageur {
    entierVoyageur(de,1,20);
    if (!['heureuse','neutre','malheureuse'].includes(situation)) throw new Error('Situation de moral inconnue.');
    const reussi = de <= 10+m.moral;
    const delta = situation === 'heureuse' ? reussi ? 1 : 0 : situation === 'malheureuse' ? reussi ? 0 : -1
        : m.moral > 0 ? reussi ? 0 : -1 : reussi ? 1 : 0;
    return varierMoral(m,delta);
}
export function proposerMoral(d: DonneesDeVoyage, situation: SituationDeMoral, de: number, motif: string, id: string) {
    if (!motif.trim()) throw new Error('Indiquer la situation qui affecte le moral.');
    const avant = lireMoral(d), apres = resultatMoral(avant,situation,de);
    return operationDeVoyageur(d,id,majMoral(apres),'Jet de moral',
        [`${motif.slice(0,160)} — ${situation}, d20 ${de} / ${10+avant.moral}. Moral ${avant.moral} → ${apres.moral}, exaltation ${apres.exaltation}, dissolution ${apres.dissolution}.`]);
}
