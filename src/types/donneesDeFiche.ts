import { z } from 'zod';

/** Le contrat des champs imprimés reste scalaire. Les états réservés RdD, Alien et Cthulhu Hack sont du JSON
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
/**
 * **Les états réservés qu'un pilote range dans la fiche** — les seules clés qui acceptent du JSON
 * structuré (borné par `memoJSONValide`). Une clé inconnue reste refusée : le contrat des champs
 * imprimés est scalaire.
 *
 * ⛔ **15/11/2026 : la liste ne comptait que Rêve de Dragon, Alien et Cthulhu Hack.** Dune, RuneQuest,
 * Delta Green, Shadowrun, COC, Symbaroum, Star Trek, Degenesis et Blade Runner écrivaient les leurs ;
 * une seule de ces clés faisait refuser **toute** la sauvegarde — la restauration et la semence de
 * la répétition échouaient (registre, § 1 bis du 15/11). `clesReserveesDeLaFiche.test.ts` relit
 * désormais chaque `CLE_…` réservée déclarée dans `src/` : une clé neuve absente d'ici fait échouer
 * les essais au lieu des sauvegardes.
 */
export const CLES_RESERVEES_DE_LA_FICHE: ReadonlySet<string> = new Set([
    // Alien
    '_gmos_combat_alien', '_gmos_panique_alien', '_gmos_jet_alien', '_gmos_survie_alien', '_gmos_progression_alien',
    // Autres pilotes
    '_gmos_cthulhu_hack', '_gmos_dune', '_gmos_runequest', '_gmos_symbaroum', '_gmos_star_trek', '_gmos_degenesis', '_gmos_blade_runner',
    '__deltaGreen', '__shadowrun', '__shadowrunMatrice', '__shadowrunDerogations',
    '__cocSuivi', '__cocProfil', '__cocAvantages', '__cocPsychisme',
    '__franchissements',
    // Pénombre (§ 267, T17, 22/11/2026) : la dissonance et l'opéra d'un adversaire en affrontement.
    '_gmos_affrontement_penombre',
]);

/** Une clé réservée : celles de la liste, et toute la famille `__rdd…` de Rêve de Dragon. */
export const estCleReserveeDeLaFiche = (cle: string): boolean => cle.startsWith('__rdd') || CLES_RESERVEES_DE_LA_FICHE.has(cle);

export const DonneesDeFicheSchema = z.record(z.string(), z.unknown()).superRefine((donnees, contexte) => {
    for (const [cle, valeur] of Object.entries(donnees)) {
        if (typeof valeur === 'string' || typeof valeur === 'boolean' || typeof valeur === 'number' && Number.isFinite(valeur)) continue;
        if (estCleReserveeDeLaFiche(cle) && memoJSONValide(valeur)) continue;
        contexte.addIssue({ code: 'custom', path: [cle], message: 'Valeur de champ attendue ; seules les métadonnées réservées des pilotes (CLES_RESERVEES_DE_LA_FICHE) acceptent du JSON structuré borné.' });
    }
});
