export interface OppositionShadowrun {
    epreuve: 'oppose' | 'tir' | 'melee'; role: 'premier' | 'second' | 'volee';
    succes: number; reserve: number; rr: number; situation: number;
    vainqueurNecessaire: boolean; initiateur: 'personnage' | 'adversaire'; defenseSeule: boolean;
}
export const OPPOSITION_SHADOWRUN: OppositionShadowrun = { epreuve: 'oppose', role: 'premier', succes: 3,
    reserve: 9, rr: 0, situation: 0, vainqueurNecessaire: false, initiateur: 'personnage', defenseSeule: false };
export const PROFILS_A_LA_VOLEE = [
    { nom: 'Mauvais', succes: 2, reserve: 3, rr: 0 }, { nom: 'Entraînement de base', succes: 3, reserve: 6, rr: 0 },
    { nom: 'Expérimenté', succes: 4, reserve: 6, rr: 1 }, { nom: 'Professionnel', succes: 5, reserve: 9, rr: 1 },
    { nom: 'Élite', succes: 7, reserve: 12, rr: 2 },
] as const;
/** La table p. 81 arrondit RDD/3 au plus proche, puis ajoute RR +1. */
export function moyenneSecondRole(reserve: number, rr: number): number {
    return Math.round(Math.max(0, reserve) / 3) + Math.max(0, Math.min(3, Math.trunc(rr))) + 1;
}
export const succesAdversesShadowrun = (o: OppositionShadowrun) => o.role === 'second' ? moyenneSecondRole(o.reserve, o.rr) : Math.max(0, Math.trunc(o.succes));
export function comparerShadowrun(succes: number, o: OppositionShadowrun) {
    const adverses = succesAdversesShadowrun(o), ecart = succes - adverses;
    const departage = o.epreuve === 'tir' || (o.epreuve === 'melee' && o.defenseSeule) || o.vainqueurNecessaire;
    const egalite = ecart === 0 && !departage;
    const reussi = ecart > 0 || (ecart === 0 && departage && o.initiateur === 'personnage');
    return { adverses, egalite, reussi, nets: Math.max(0, ecart), libelle: egalite ? 'Égalité — aucun vainqueur' : reussi ? 'Réussite en opposition' : 'Échec en opposition' };
}
