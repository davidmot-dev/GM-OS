/** Reçus immuables, portés par la même écriture que les ressources de la fiche.
 * Ils ne sont jamais tronqués : supprimer une preuve permettrait de repayer un ancien trajet. */
export const CLE_RECUS_TMR = '__rddRecusTMR231';
export interface RecuTMR { id: string; demandeId: string; campagneId: string; personnageId: string; empreinte: string; sortieForcee: boolean; detail: string }
export function recusDesTMR(d: Record<string, unknown>): RecuTMR[] {
    const valeur = d[CLE_RECUS_TMR];
    if (valeur === undefined) return [];
    if (!Array.isArray(valeur) || valeur.length > 10000 || valeur.some(v => !v || typeof v !== 'object' || Array.isArray(v)
        || Object.keys(v).length !== 7 || !['id', 'demandeId', 'campagneId', 'personnageId'].every(k => typeof v[k] === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(v[k]))
        || typeof v.empreinte !== 'string' || !v.empreinte || v.empreinte.length > 4000 || typeof v.sortieForcee !== 'boolean' || typeof v.detail !== 'string' || v.detail.length > 300)
        || new Set(valeur.map(v => v.id)).size !== valeur.length) throw new Error('Les reçus TMR de cette fiche sont illisibles. Ils doivent être conservés pour éviter une seconde dépense.');
    return valeur;
}
/** Un ancien brouillon ou une fiche HTML n'a pas le droit d'effacer les preuves déjà reçues. */
export function conserverRecusDesTMR(avant: Record<string, unknown>, apres: Record<string, unknown>) {
    const anciens = recusDesTMR(avant);
    if (!anciens.length) { if (apres[CLE_RECUS_TMR] !== undefined) recusDesTMR(apres); return apres; }
    const recus = [...anciens];
    for (const r of recusDesTMR(apres)) {
        const connu = recus.find(a => a.id === r.id);
        if (connu && JSON.stringify(connu) !== JSON.stringify(r)) throw new Error('Un reçu TMR existant ne peut pas être remplacé.');
        if (!connu) recus.push(r);
    }
    const resultat = { ...apres, [CLE_RECUS_TMR]: recus }; recusDesTMR(resultat); return resultat;
}
