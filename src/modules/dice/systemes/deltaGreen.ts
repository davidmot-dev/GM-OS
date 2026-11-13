import type { RollResult } from '../DiceEngine';
import { degreDuDe, estUneReussite, type DegreDeReussite, type EchelleDuJet } from '../degresDeReussite';

/**
 * **Le jet de Delta Green** — 12/11/2026, à la demande de David (« Corrige le jet sur les
 * critiques »), d'après le *Manuel de l'Agent* (`docs/systems/delta-green/livres.json`).
 *
 * Un d100 sous les chances (p. 44) : la compétence, ou la caractéristique × 5 (p. 18) ;
 * bonus et malus de ±20 %, rarement ±40 %, chances bornées de 1 à 99 % (p. 43). Quatre
 * résultats seulement :
 * - **réussite critique** : 01, ou une réussite sur un double (11, 22… 99) ;
 * - **réussite** : sous ou égal aux chances ;
 * - **échec** : au-dessus ;
 * - **échec critique** : 00 (100), ou un échec sur un double.
 *
 * Le pilote forgé déclarait `critique: 1` et `complication: 20`, des nombres de d20 : sur
 * un d100, le moteur ne voyait aucun double, et le 01 seul aurait compté. *Le jet passait
 * le contrôle de la Forge et se trompait en silence.*
 *
 * Une compétence à 0 % ne se tente jamais (p. 29) : le jet le dit et ne part pas.
 */
export interface RegleDeDeltaGreen {
    /** Les caractéristiques de la fiche (FOR, CON…) : un test se fait à la valeur × 5 (p. 18). */
    caracteristiques?: string[];
    sante?: string;
    san?: string;
    pouvoir?: string;
    charisme?: string;
    seuilRupture?: string;
    inconcevable?: string;
    /** Compétence → case d’amélioration de la fiche (p. 29), hors Inconcevable. */
    experience?: Record<string, string>;
}

/** Les bornes des chances modifiées (p. 43). */
export const CHANCES_MINIMALES = 1;
export const CHANCES_MAXIMALES = 99;
/** Le multiplicateur d'un test de caractéristique (p. 18). */
export const MULTIPLICATEUR_DE_CARACTERISTIQUE = 5;

/** Les chances ramenées entre 1 et 99 %, et ce qui a été ramené. */
export function bornerLesChances(chances: number): { chances: number; ramenees: boolean } {
    const bornees = Math.min(CHANCES_MAXIMALES, Math.max(CHANCES_MINIMALES, Math.round(chances)));
    return { chances: bornees, ramenees: bornees !== Math.round(chances) };
}

/**
 * L'échelle du jet : les doubles décident (comme chez Nephilim), et le 01 est toujours une
 * réussite critique. Les bandes de RuneQuest ou de Rêve de Dragon n'existent pas ici.
 */
export function echelleDeDeltaGreen(chances: number): EchelleDuJet {
    return {
        chances,
        particuliere: null,
        significative: null,
        echecParticulier: null,
        echecTotal: null,
        doubles: true,
        critiqueSur01: true,
    };
}

/** Les mots du livre (p. 44), pour les quatre degrés que le jeu connaît. */
export const LIBELLES_DE_DELTA_GREEN: Partial<Record<DegreDeReussite, string>> = {
    'reussite-particuliere': 'Réussite critique',
    'reussite-normale': 'Réussite',
    'echec-normal': 'Échec',
    'echec-total': 'Échec critique',
};

const deuxChiffres = (de: number) => (de >= 100 ? '00' : String(de).padStart(2, '0'));

/** Le résultat du moteur, dit avec les mots du livre : « Réussite critique — 33 contre 50 % ». */
export function nommerLeJetDeDeltaGreen(brut: RollResult, echelle: EchelleDuJet): RollResult {
    const de = brut.total;
    const degre = brut.degre ?? degreDuDe(de, echelle);
    const libelle = LIBELLES_DE_DELTA_GREEN[degre] ?? '';
    return {
        ...brut,
        degre,
        tagSuccess: estUneReussite(degre),
        libelleDuDegre: libelle,
        totalDisplay: `${libelle} — ${deuxChiffres(de)} contre ${echelle.chances} %`,
    };
}
