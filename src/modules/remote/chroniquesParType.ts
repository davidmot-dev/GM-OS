import type { RemoteFicheDeWiki } from './segmentDeLecture';

/**
 * **Les Chroniques rangées par type.**
 *
 * Demandé par David le 2026-09-05 : *« est-ce que tu peux trier l'onglet
 * Chronique par type ? »*. La liste était plate, et la catégorie n'existait que
 * comme pastille — *une information qu'on affiche sans s'en servir pour ranger
 * fait travailler l'œil à la place du code.*
 */

/**
 * Les catégories du wiki, **dans l'ordre où on les consulte**.
 *
 * Pas alphabétique : du plus consulté en séance au moins consulté. On cherche un
 * PNJ ou un lieu dix fois par soirée, une rumeur deux fois par campagne.
 *
 * ⚠️ **Une seule table pour le libellé ET l'ordre.** Deux listes finiraient par
 * diverger, et l'écart ne se verrait pas : une catégorie oubliée d'une des deux
 * tomberait simplement à la fin, sans erreur.
 */
export const CATEGORIES: readonly (readonly [string, string])[] = [
    ['npc', 'PNJ'],
    ['location', 'Lieu'],
    ['organization', 'Organisation'],
    ['item', 'Objet'],
    ['lore', 'Savoir'],
    ['clue', 'Indice'],
    ['rumor', 'Rumeur'],
    ['other', 'Autre'],
];

export const LIBELLE_DE_CATEGORIE = Object.fromEntries(CATEGORIES) as Record<string, string>;

export interface GroupeDeChroniques {
    cle: string;
    titre: string;
    fiches: RemoteFicheDeWiki[];
}

/**
 * @param fiches Déjà filtrées par la recherche, s'il y en a une.
 *
 * Deux règles, et ce sont elles que les tests gardent :
 *
 * 1. **Une catégorie vide ne paraît pas.** Un en-tête suivi de rien apprend au
 *    regard à sauter les en-têtes.
 * 2. **Une catégorie inconnue tombe à la fin, elle ne disparaît pas.** Un wiki
 *    plus ancien que cette table, ou un type ajouté ailleurs, garderait ses
 *    fiches visibles : *une fiche qu'on n'affiche pas est une fiche qu'on croit
 *    effacée.*
 */
export function chroniquesParType(fiches: readonly RemoteFicheDeWiki[]): GroupeDeChroniques[] {
    const parTitre = (a: RemoteFicheDeWiki, b: RemoteFicheDeWiki) => a.titre.localeCompare(b.titre);
    const restantes = new Map(fiches.map(f => [f.id, f]));
    const groupes: GroupeDeChroniques[] = [];

    for (const [cle, titre] of CATEGORIES) {
        const duType = fiches.filter(f => f.categorie === cle);
        duType.forEach(f => restantes.delete(f.id));
        if (duType.length > 0) {
            groupes.push({ cle, titre, fiches: [...duType].sort(parTitre) });
        }
    }

    const inconnues = [...restantes.values()];
    if (inconnues.length > 0) {
        groupes.push({ cle: '__inconnues', titre: 'Non classées', fiches: inconnues.sort(parTitre) });
    }
    return groupes;
}
