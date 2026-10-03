import { versLaFiche, type CorrespondanceDeFiche, type CotesGmOs } from './correspondanceDeFiche';
import { estVide, memeValeur, type Divergence } from './rapprochementDeLaFiche';

/**
 * **Ce que GM-OS écrit sur la fiche** — option A de David, 2026-10-03 :
 * *« la dernière écriture gagne »*.
 *
 * Jusque-là, GM-OS ne poussait vers la fiche **qu'à sa création** : la Force
 * corrigée à 14 dans le Formulaire ne partait jamais, et la fiche la remettait
 * à 13 à la réouverture. Désormais :
 *
 * - **fiche ouverte**, ce que GM-OS change part aussitôt (`precedent` connu) —
 *   et seulement ce qu'il change : une clé que GM-OS n'a pas touchée ne
 *   s'écrit pas, même si elle diffère (c'est alors la fiche qui vient de parler,
 *   et le rapprochement s'en charge) ;
 * - **à l'ouverture**, quand GM-OS a écrit après la fiche (`precedent` nul),
 *   ses valeurs **non vides** qui diffèrent. Le vide ne se pousse pas : il
 *   effacerait ce que la fiche porte et que GM-OS n'a jamais su — *remplir
 *   n'est pas écraser*, dans ce sens-ci comme dans l'autre.
 *
 * Rend aussi ce qui est écrasé sur la fiche, pour le journal.
 */
export function pousseeVersLaFiche(
    personnage: CotesGmOs,
    precedent: CotesGmOs | null,
    donneesDeLaFiche: Record<string, unknown>,
    table: CorrespondanceDeFiche,
): { lot: Record<string, unknown>; divergences: Divergence[] } {
    const cible = versLaFiche(personnage, table);
    const avant = precedent ? versLaFiche(precedent, table) : null;
    const lot: Record<string, unknown> = {};
    const divergences: Divergence[] = [];

    for (const [cle, valeur] of Object.entries(cible)) {
        const surLaFiche = donneesDeLaFiche[cle];
        if (memeValeur(valeur, surLaFiche)) continue;
        if (avant) {
            // Fiche ouverte : seulement ce que GM-OS vient de changer — effacement compris.
            if (memeValeur(valeur, avant[cle])) continue;
        } else if (estVide(valeur)) {
            continue;
        }
        lot[cle] = valeur;
        if (!estVide(surLaFiche)) divergences.push({ cle, ancienne: surLaFiche, nouvelle: valeur });
    }
    return { lot, divergences };
}

/**
 * **GM-OS a-t-il écrit après la fiche ?** Les deux dates sont celles de la même
 * machine (le moteur tourne dans une iframe de GM-OS). Sans date côté GM-OS —
 * un PJ d'avant ce réglage —, la fiche fait foi, comme avant.
 */
export function gmosEstPlusRecent(donneesModifieesLe: number | undefined, ficheModifieeLe: number | null): boolean {
    if (!donneesModifieesLe) return false;
    return donneesModifieesLe > (ficheModifieeLe ?? 0);
}
