/**
 * Lecture de l'inventaire rendu par le gabarit 1.
 *
 * **Ce que l'inventaire sert vraiment.** Il borne le travail, il rend la
 * couverture mesurable, et il engendre la liste des requêtes de l'étape
 * suivante. Sur Dune, il a révélé que *Poursuites* n'est pas couvert par le
 * livre de base — information qu'aucune fiche prise seule n'aurait donnée.
 *
 * **La complétion est le point dur.** Le carnet omet des lignes ; s'il en omet
 * une, le sujet disparaît de la boucle et son absence devient invisible. Or une
 * absence invisible vaut une absence fausse. {@link lireInventaire} rend donc
 * toujours les treize sujets du canevas, dans l'ordre du canevas, qu'ils
 * figurent ou non dans le tableau — les manquants portent `lu: false`.
 */

import { CANEVAS, clefCanonique } from './canevas';

export type Traitement = 'oui' | 'partiellement' | 'non';

export interface EntreeInventaire {
  /** Clé canonique si le sujet entre dans le canevas, libellé du carnet sinon. */
  sujet: string;
  horsCanevas: boolean;
  traite: Traitement;
  /** Résumé de la mécanique, tel que le carnet l'a rendu. */
  mecanique: string;
  /** Titres de section, pour amorcer la résolution des pages. */
  sections: string[];
  /** Faux quand le carnet n'a pas rendu de ligne pour ce sujet du canevas. */
  lu: boolean;
}

function sansAccent(valeur: string): string {
  return valeur.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().trim();
}

/** Nettoie une cellule : gras, guillemets et espaces parasites. */
function cellule(valeur: string): string {
  return valeur.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

/** `oui` / `partiellement` / `non`, quelle que soit la formulation employée. */
function lireTraitement(valeur: string): Traitement {
  const nu = sansAccent(valeur);
  if (/^non|pas couvert|aucun/.test(nu)) return 'non';
  if (/partiel/.test(nu)) return 'partiellement';
  if (/^oui|^trait|^couvert/.test(nu)) return 'oui';
  // Une cellule illisible ne vaut pas une couverture : dans le doute, on
  // interroge quand même le carnet plutôt que d'annoncer un traitement.
  return 'partiellement';
}

function decouperSections(valeur: string): string[] {
  if (!valeur || /^(—|-|n\/a|aucune?)$/i.test(valeur.trim())) return [];
  return valeur
    .split(/\s*[;·]\s*|\s*,\s(?=[A-ZÀ-Ý«])/)
    .map(s => s.replace(/^[«"'*\s]+|[»"'*\s.]+$/g, '').trim())
    .filter(Boolean);
}

/** Les cellules d'une ligne de tableau markdown, barres extérieures ôtées. */
function cellulesDeLigne(ligne: string): string[] | null {
  const nu = ligne.trim();
  if (!nu.startsWith('|')) return null;
  if (/^\|[\s|:-]+\|?$/.test(nu)) return null; // ligne de séparation
  return nu.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cellule);
}

function estEnteteTableau(cellules: string[]): boolean {
  return sansAccent(cellules[0] ?? '') === 'sujet';
}

function estTitreHorsCategories(ligne: string): boolean {
  return /hors\s*cat[ée]gorie/i.test(ligne) && /^\s*(#{1,6}\s|\*\*)/.test(ligne.trim());
}

/**
 * Lit les treize sujets du canevas, puis les mécaniques hors catégories.
 *
 * Les entrées hors catégories sont acceptées sous les deux formes que le carnet
 * emploie : un second tableau, ou une liste à puces `- **Nom** : mécanique`.
 */
export function lireInventaire(markdown: string): EntreeInventaire[] {
  const lignes = markdown.replace(/\r\n/g, '\n').split('\n');
  const lues = new Map<string, EntreeInventaire>();
  const horsCanevas: EntreeInventaire[] = [];

  let apresHorsCategories = false;

  for (const ligne of lignes) {
    if (estTitreHorsCategories(ligne)) {
      apresHorsCategories = true;
      continue;
    }

    const cellules = cellulesDeLigne(ligne);
    if (cellules && cellules.length >= 2) {
      if (estEnteteTableau(cellules)) continue;

      const libelle = cellules[0];
      if (!libelle) continue;

      const entree: EntreeInventaire = {
        sujet: libelle.replace(/^\d+[.)]\s*/, ''),
        horsCanevas: true,
        traite: lireTraitement(cellules[1] ?? ''),
        mecanique: cellules[2] ?? '',
        sections: decouperSections(cellules[3] ?? ''),
        lu: true,
      };

      const canonique = clefCanonique(entree.sujet);
      if (canonique && !apresHorsCategories) {
        lues.set(canonique, { ...entree, sujet: canonique, horsCanevas: false });
      } else {
        horsCanevas.push(entree);
      }
      continue;
    }

    if (!apresHorsCategories) continue;

    const puce = /^\s*[-*•]\s*(?:\*\*)?\s*([^:*]{2,80}?)\s*(?:\*\*)?\s*[:—-]\s*(.+)$/.exec(ligne);
    if (puce) {
      horsCanevas.push({
        sujet: cellule(puce[1]),
        horsCanevas: true,
        traite: 'oui',
        mecanique: cellule(puce[2]),
        sections: [],
        lu: true,
      });
    }
  }

  const canevas = CANEVAS.map(
    sujet =>
      lues.get(sujet.clef) ?? {
        sujet: sujet.clef,
        horsCanevas: false,
        // Non lu n'est pas non traité : le carnet n'a rien dit, pas dit non.
        traite: 'partiellement' as Traitement,
        mecanique: '',
        sections: [],
        lu: false,
      },
  );

  return [...canevas, ...horsCanevas];
}

/** Nombre de sujets du canevas que le livre traite, au moins partiellement. */
export function couverture(entrees: readonly EntreeInventaire[]): { traites: number; total: number } {
  const canevas = entrees.filter(e => !e.horsCanevas);
  return {
    traites: canevas.filter(e => e.lu && e.traite !== 'non').length,
    total: CANEVAS.length,
  };
}
