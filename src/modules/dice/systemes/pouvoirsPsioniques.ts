/**
 * **Les pouvoirs psioniques de Traveller** — TRV-A6, 27/11/2026 (spécification
 * `2026-11-27-traveller-depenses-et-durees.md`, C3 ; David : « Les cinq »). Livre de règles v2.2,
 * p. 224-229 (page du PDF = imprimée + 1), relu bloc par bloc : chaque pouvoir dit son test, sa
 * portée et son coût en PSI.
 *
 * - Le test : la compétence du talent + le MD de PSI, à la difficulté du pouvoir (p. 225).
 * - Le coût se dépense **en cas de réussite** ; un échec coûte un point (p. 225).
 * - La portée s'allonge d'une Zone pour un coût doublé, de deux pour un coût quadruplé (p. 225).
 * - Les pouvoirs de Conscience n'ont jamais de portée : ils ne visent que le Voyageur (p. 228).
 *
 * `cout: null` : un coût que le Voyageur choisit (Télékinésie, « 1 par 10 kg » ; Force et
 * Endurance augmentées ; Robustesse ; Régénération) — le meneur le saisit.
 */

export const TALENTS_PSIONIQUES = ['Télépathie', 'Clairvoyance', 'Télékinésie', 'Conscience', 'Téléportation'] as const;
export type TalentPsionique = typeof TALENTS_PSIONIQUES[number];

export interface PouvoirPsionique {
    talent: TalentPsionique;
    nom: string;
    /** La cible du test : Facile 4+, Routine 6+, Moyenne 8+, Difficile 10+, Très Difficile 12+, Extraordinaire 14+. */
    difficulte: number;
    /** La Zone de Portée du livre ; `null` : sans portée (Conscience, Vol). */
    portee: string | null;
    /** Le coût en PSI ; `null` : au choix du Voyageur, à saisir. */
    cout: number | null;
    /** Le coût tel que le livre l'écrit. */
    coutDuLivre: string;
    /** La page imprimée. */
    page: number;
}

const p = (talent: TalentPsionique, nom: string, difficulte: number, portee: string | null, cout: number | null, page: number, coutDuLivre = String(cout)): PouvoirPsionique =>
    ({ talent, nom, difficulte, portee, cout, coutDuLivre, page });

/** **La table des pouvoirs** (p. 225-229). Le Bouclier, permanent et gratuit, ne se lance pas. */
export const POUVOIRS_PSIONIQUES: readonly PouvoirPsionique[] = [
    p('Télépathie', 'Détection de vie', 4, 'Lointaine', 1, 225),
    p('Télépathie', 'Lien mental', 4, 'Lointaine', 1, 226),
    p('Télépathie', 'Télempathie', 6, 'Longue', 1, 226),
    p('Télépathie', 'Lecture des pensées superficielles', 8, 'Longue', 2, 226),
    p('Télépathie', 'Envoi de pensées', 10, 'Lointaine', 2, 226),
    p('Télépathie', 'Suggestion', 12, 'Courte', 3, 226),
    p('Télépathie', 'Sonde mentale', 12, 'Proche', 4, 226),
    p('Télépathie', 'Assaut', 14, 'Courte', 8, 226),
    p('Clairvoyance', 'Perception', 6, 'Très lointaine', 1, 227),
    p('Clairvoyance', 'Conscience tactique', 8, 'Longue', 2, 227),
    p('Clairvoyance', 'Clairvoyance', 8, 'Très lointaine', 1, 227),
    p('Clairvoyance', 'Clairaudience', 8, 'Très lointaine', 1, 227),
    p('Clairvoyance', 'Clairsentience', 10, 'Très lointaine', 1, 227),
    p('Télékinésie', 'Télékinésie', 8, 'Courte', null, 227, '1 par 10 kg'),
    p('Télékinésie', 'Vol', 10, null, 5, 228),
    p('Télékinésie', 'Coup télékinétique', 8, 'Courte', 1, 228),
    p('Télékinésie', 'Microkinésie', 10, 'Proche', 3, 228),
    p('Télékinésie', 'Pyrokinésie', 6, 'Courte', 3, 228),
    p('Conscience', 'Animation suspendue', 8, null, 3, 228),
    p('Conscience', 'Force augmentée', 8, null, null, 228, 'l’augmentation de FOR'),
    p('Conscience', 'Endurance augmentée', 8, null, null, 228, 'l’augmentation d’END'),
    p('Conscience', 'Robustesse', 10, null, null, 228, 'la Protection voulue'),
    p('Conscience', 'Inspiration', 8, null, 1, 229),
    p('Conscience', 'Régénération', 10, null, null, 229, 'les points soignés'),
    p('Téléportation', 'Téléportation', 8, 'Lointaine', 2, 229),
    // « Avec des vêtements et jusqu'à 10 kg : Difficile (10+), 2 PSI de plus ; 500 kg : Très Difficile (12+), 4 de plus. »
    p('Téléportation', 'Téléportation avec 10 kg d’équipement', 10, 'Lointaine', 4, 229),
    p('Téléportation', 'Téléportation avec 500 kg d’équipement', 12, 'Lointaine', 6, 229),
];

/** **La table de Portée psionique** (p. 226), dans l'ordre : allonger, c'est passer à la suivante. */
export const ZONES_DE_PORTEE_PSIONIQUE = [
    'Personnel', 'Proche', 'Courte', 'Moyenne', 'Longue', 'Très longue', 'Lointaine', 'Très lointaine', 'Continentale', 'Planétaire',
] as const;

const normaliser = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/** Le talent qu'une ligne de compétence nomme (« Télépathie », « telepathie 1 ») ; sinon `null`. */
export function talentDeLaCompetence(nom: unknown): TalentPsionique | null {
    const n = normaliser(String(nom ?? ''));
    return TALENTS_PSIONIQUES.find(t => n.startsWith(normaliser(t))) ?? null;
}

export const pouvoirsDuTalent = (talent: TalentPsionique) => POUVOIRS_PSIONIQUES.filter(x => x.talent === talent);

/** La portée allongée de `zones` crans (0 à 2), et ce qu'elle multiplie : ×1, ×2, ×4 (p. 225). */
export function porteeAllongee(portee: string | null, zones: number): { portee: string | null; facteur: number } {
    const z = Math.max(0, Math.min(2, Math.trunc(zones) || 0));
    if (!portee) return { portee: null, facteur: 1 };
    const i = ZONES_DE_PORTEE_PSIONIQUE.findIndex(x => normaliser(x) === normaliser(portee));
    const j = i < 0 ? -1 : Math.min(ZONES_DE_PORTEE_PSIONIQUE.length - 1, i + z);
    return { portee: j < 0 ? portee : ZONES_DE_PORTEE_PSIONIQUE[j]!, facteur: [1, 2, 4][z]! };
}
