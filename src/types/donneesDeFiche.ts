import { z } from 'zod';

/** Le contrat des champs imprimés reste scalaire. Les états réservés RdD et Alien sont du JSON
 * structuré ; une sauvegarde doit pouvoir les relire sans les jeter.
 * Bornes de lecture, pas de troncature ni de nettoyage silencieux. */
function memoJSONValide(racine: unknown): boolean {
    const file: { valeur: unknown; profondeur: number }[] = [{ valeur: racine, profondeur: 0 }];
    const vus = new Set<object>(); let noeuds = 0, caracteres = 0;
    while (file.length) {
        const { valeur, profondeur } = file.pop()!;
        if (++noeuds > 200000 || profondeur > 24 || caracteres > 8 * 1024 * 1024) return false;
        if (valeur === null || typeof valeur === 'boolean' || typeof valeur === 'number' && Number.isFinite(valeur)) continue;
        if (typeof valeur === 'string') { caracteres += valeur.length; continue; }
        if (!valeur || typeof valeur !== 'object' || vus.has(valeur)) return false;
        vus.add(valeur);
        if (!Array.isArray(valeur) && ![Object.prototype, null].includes(Object.getPrototypeOf(valeur))) return false;
        for (const [cle, v] of Object.entries(valeur)) { caracteres += cle.length; file.push({ valeur: v, profondeur: profondeur + 1 }); }
    }
    return caracteres <= 8 * 1024 * 1024;
}
export const DonneesDeFicheSchema = z.record(z.string(), z.unknown()).superRefine((donnees, contexte) => {
    for (const [cle, valeur] of Object.entries(donnees)) {
        if (typeof valeur === 'string' || typeof valeur === 'boolean' || typeof valeur === 'number' && Number.isFinite(valeur)) continue;
        if ((cle.startsWith('__rdd') || ['_gmos_combat_alien','_gmos_panique_alien','_gmos_jet_alien','_gmos_survie_alien','_gmos_progression_alien'].includes(cle)) && memoJSONValide(valeur)) continue;
        contexte.addIssue({ code: 'custom', path: [cle], message: 'Valeur de champ attendue ; seules les métadonnées réservées RdD et Alien acceptent du JSON structuré borné.' });
    }
});
