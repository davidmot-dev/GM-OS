/** R3/R4 : aperçu immuable, contrôle de fraîcheur et reçu conservé sur la fiche.
 * Aucun effet au chargement ; la validation écrit des valeurs absolues.
 */
export type DonneesDeVoyage = Record<string, unknown>;
export interface OperationDeVoyageur {
    id: string; empreinte: string; maj: DonneesDeVoyage; motif: string; details: string[];
}
export function operationDeVoyageur(d: DonneesDeVoyage, id: string, maj: DonneesDeVoyage, motif: string, details: string[]): OperationDeVoyageur {
    if (!id || id.length > 160) throw new Error('Identifiant d’opération requis.');
    const libelles: Record<string,string> = {vie:'Vie',endurance:'Endurance',fatigue:'Fatigue',reve_pts:'Points de rêve',reve_seuil:'Seuil de rêve',stress:'Stress',moral:'Moral',points_de_chance:'Points de chance',points_de_destinee:'Destinée'};
    const ressources = Object.entries(libelles).filter(([cle])=>Object.hasOwn(maj,cle) && maj[cle] !== d[cle])
        .map(([cle,libelle])=>`${libelle} : ${String(d[cle])} → ${String(maj[cle])}.`);
    return {id, empreinte: JSON.stringify(d), maj: structuredClone(maj), motif, details:[...details,...ressources]};
}
export function appliquerOperationDeVoyageur(d: DonneesDeVoyage, p: OperationDeVoyageur): DonneesDeVoyage | null {
    const recu = d.__rddOperationsR34231 ?? [];
    if (!Array.isArray(recu) || recu.some(x => typeof x !== 'string')) throw new Error('Reçus R3/R4 invalides : conserver les données.');
    if (recu.includes(p.id)) return null;
    if (JSON.stringify(d) !== p.empreinte) throw new Error('La fiche a changé : refaire l’aperçu.');
    if (recu.length >= 10000) throw new Error('Limite de 10 000 opérations R3/R4 atteinte ; aucun reçu n’est effacé.');
    const historique = d.__rddHistoriqueR34231 ?? [];
    if (!Array.isArray(historique)) throw new Error('Historique R3/R4 invalide.');
    return {...d,...p.maj,__rddOperationsR34231:[...recu,p.id],
        __rddHistoriqueR34231:[...historique,{id:p.id,motif:p.motif,details:p.details}].slice(-60)};
}
/** Une ancienne fiche/brouillon conserve les reçus et les carnets qu'elle ne connaît pas. */
export function conserverOperationsDeVoyageur(avant: DonneesDeVoyage, apres: DonneesDeVoyage): DonneesDeVoyage {
    const resultat = {...apres};
    for (const cle of ['__rddTaches231','__rddRepos231','__rddHistoriqueR34231','__rddProgression231','__rddMoral231','__rddAction231','__rddChanceDepensee231']) {
        if (resultat[cle] === undefined && avant[cle] !== undefined) resultat[cle] = avant[cle];
    }
    const a = avant.__rddOperationsR34231 ?? [], b = apres.__rddOperationsR34231 ?? [];
    if (![a,b].every(v=>Array.isArray(v) && v.every(x=>typeof x === 'string'))) throw new Error('Reçus R3/R4 invalides.');
    const recus = [...new Set([...(a as string[]),...(b as string[])])];
    if (recus.length > 10000) throw new Error('Limite des reçus R3/R4 atteinte.');
    if (recus.length) resultat.__rddOperationsR34231 = recus;
    return resultat;
}
