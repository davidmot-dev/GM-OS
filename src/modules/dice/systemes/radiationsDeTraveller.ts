/**
 * **Les radiations de Traveller** — TRV-A5, 27/11/2026 (spécification
 * `2026-11-27-traveller-fiche-initiative-psi-rads.md`, C8 et C9 ; David : « Dose + geste
 * Exposition »). Table des Conséquences des radiations, livre de règles v2.2, p. 78 :
 *
 * - une **exposition** a des conséquences immédiates selon la dose reçue : rien jusqu'à 50 rads,
 *   puis 1D, 2D, 4D, 6D, 8D de dégâts, avec la nausée (−1 à tous les jets jusqu'à un traitement),
 *   la perte de cheveux, la stérilité, l'hémorragie majeure ;
 * - les rads **s'accumulent** et ne disparaissent jamais (sauf médicaments anti-rads) : au-delà de
 *   150, 300, 500 et 800 rads cumulés, le Voyageur perd 1, 2, 3, puis 4 points d'END **permanents**.
 *
 * Il n'y a pas de maximum : c'est une dose, pas une jauge.
 */

interface Palier { de: number; des: number; texte: string }

/** Conséquences immédiates d'une exposition (p. 78). */
const IMMEDIATES: readonly Palier[] = [
    { de: 801, des: 8, texte: '8D de dégâts, hémorragie majeure' },
    { de: 501, des: 6, texte: '6D de dégâts, stérilité' },
    { de: 301, des: 4, texte: '4D de dégâts, perte de cheveux' },
    { de: 151, des: 2, texte: '2D de dégâts' },
    { de: 51, des: 1, texte: '1D de dégâts, nausée (−1 à tous les jets et tests jusqu’à un traitement médical approprié)' },
];

/** Conséquences de l'exposition cumulée : l'END perdue pour toujours (p. 78). */
const CUMULEES: readonly { de: number; perte: number }[] = [
    { de: 801, perte: 4 },
    { de: 501, perte: 3 },
    { de: 301, perte: 2 },
    { de: 151, perte: 1 },
];

const entier = (n: unknown) => Math.max(0, Math.trunc(Number(n) || 0));

/** Ce qu'une dose reçue d'un coup inflige tout de suite ; `null` jusqu'à 50 rads. */
export function consequenceImmediate(dose: number): { des: number; texte: string } | null {
    const d = entier(dose);
    const p = IMMEDIATES.find(x => d >= x.de);
    return p ? { des: p.des, texte: p.texte } : null;
}

/** L'END permanente perdue pour un total cumulé (0 à 4). */
export function perteCumulee(total: number): number {
    const t = entier(total);
    return CUMULEES.find(x => t >= x.de)?.perte ?? 0;
}

/** Le prochain seuil cumulé et ce qu'il coûtera ; `null` au-delà de 800. */
export function prochainSeuil(total: number): { seuil: number; perte: number } | null {
    const t = entier(total);
    const suivant = [...CUMULEES].reverse().find(x => t < x.de);
    return suivant ? { seuil: suivant.de, perte: suivant.perte } : null;
}

/** « 95 rads — cumul : aucune conséquence ; à 151 rads, −1 END permanent ». */
export function decrireLaDose(total: number): string {
    const t = entier(total);
    const perte = perteCumulee(t);
    const suivant = prochainSeuil(t);
    return `${t} rads — cumul : ${perte ? `−${perte} END permanent` : 'aucune conséquence'}`
        + (suivant ? ` ; à ${suivant.seuil} rads, −${suivant.perte} END permanent` : '') + ' (p. 78)';
}

/** **Une exposition** : le nouveau total, les conséquences immédiates, et l'END permanente à retirer. */
export function exposer(totalAvant: number, dose: number): {
    total: number;
    immediate: { des: number; texte: string } | null;
    /** Les points d'END permanents que ce franchissement coûte (0 s'il n'y en a pas). */
    endPermanente: number;
} {
    const avant = entier(totalAvant);
    const total = avant + entier(dose);
    return { total, immediate: consequenceImmediate(dose), endPermanente: perteCumulee(total) - perteCumulee(avant) };
}
