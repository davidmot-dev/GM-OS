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

/**
 * Découpe une liste de titres de section.
 *
 * **Les accents graves comptent.** Le carnet Dune a rendu ses sections en
 * `` `Tests de compétence`, `Procédure des tests` `` : sans les prendre en
 * charge, la liste entière restait un seul titre, accents graves compris, et le
 * résolveur n'avait rien à rapprocher de l'index.
 */
function decouperSections(valeur: string): string[] {
  if (!valeur || /^(—|-|n\/a|aucune?)$/i.test(valeur.trim())) return [];
  return valeur
    .split(/\s*[;·]\s*|\s*,\s*(?=[`«"']|[A-ZÀ-Ý])/)
    .map(s => s.replace(/^[`«"'*\s]+|[`»"'*\s.]+$/g, '').trim())
    .filter(Boolean);
}

/**
 * Les cellules d'une ligne de tableau markdown, barres extérieures ôtées.
 *
 * **Les barres extérieures sont facultatives, et le carnet s'en sert.** On
 * exigeait que la ligne commence par `|` ; NotebookLM a rendu les inventaires
 * d'Alien et de Blade Runner sans elles —
 * `**1. Résolution des jets** | **oui** | …` — pendant qu'il rendait celui de
 * Dune en liste numérotée. Les treize sujets du canevas étaient donc ignorés,
 * et l'atelier affichait « le carnet n'a rien rendu sur ce sujet » pour des
 * lignes qui portaient un paragraphe de mécanique et un « oui » franc.
 *
 * Encore le même défaut de fond : *le carnet rend la même demande sous des
 * formes différentes, et le parseur n'en connaissait qu'une.* Déjà vu sur les
 * hors catégories en liste numérotée (`489b4d1`) et sur les titres de section
 * entre accents graves.
 *
 * Sans barres extérieures, on exige **trois cellules** : une phrase de prose
 * contenant une seule barre ne doit pas devenir une ligne de tableau.
 */
function cellulesDeLigne(ligne: string): string[] | null {
  const nu = ligne.trim();
  if (!nu.includes('|')) return null;
  if (/^\|?[\s|:-]+\|?$/.test(nu)) return null; // ligne de séparation, bordée ou non

  const bordee = nu.startsWith('|');
  const cellules = nu.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cellule);
  if (!bordee && cellules.length < 3) return null;
  return cellules;
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

    // Puces ET listes numérotées : le carnet a rendu les hors catégories de Dune
    // sous la forme « 1. **L'Équation Statistique Duale** : … », et les quatre
    // mécaniques centrales du jeu tombaient dans le vide faute d'accepter `1.`.
    const puce = /^\s*(?:[-*•]|\d+[.)])\s*(?:\*\*)?\s*([^:*]{2,80}?)\s*(?:\*\*)?\s*[:—-]\s*(.+)$/.exec(ligne);
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

/**
 * L'inventaire converti en fiche du corpus.
 *
 * **Pourquoi il s'enregistre.** La procédure le prescrit depuis l'origine —
 * « Enregistré en `docs/systems/<id>/rules/` avec `sujet: Inventaire des
 * mécaniques` » — et le corpus produit à la main le contient déjà :
 * `systeme-2d20-dune-synthese.md` chez Dune, le guide de synthèse chez Alien.
 * La Forge, elle, s'en servait pour en extraire la liste des sujets et jetait le
 * reste. Dix mille caractères de synthèse à la poubelle à chaque passage.
 *
 * **Sa valeur est différente de celle des treize autres.** Chaque fiche répond
 * sur un sujet ; celle-ci donne la vue d'ensemble, et c'est elle qui permet de
 * répondre « ce jeu ne gère pas les poursuites » au lieu de ne rien trouver.
 *
 * **Réserve, à surveiller.** C'est un digest qui couvre tous les sujets à la
 * fois : au classement du RAG il concourt avec les fiches et peut avaler le
 * budget à lui seul. Le guide d'Alien est pour cette raison privé de `sujet:` et
 * exempté par `ragSelection.test.ts`. On lui laisse ici son sujet, comme le fait
 * Dune — mais son effet sur la sélection est à mesurer.
 */
export function ficheInventaire(brut: string, systeme: string): string {
  const entrees = lireInventaire(brut);
  const { traites, total } = couverture(entrees);
  const hors = entrees.filter(e => e.horsCanevas).length;

  const corps = brut.replace(/\r\n/g, '\n').trim();
  const entete = [
    'sujet: Inventaire des mécaniques',
    `systeme: ${systeme}`,
    `couverture: ${traites === total ? 'complète' : traites === 0 ? 'absente' : 'partielle'}`,
    'hors_canevas: false',
    `sujets_traites: ${traites} sur ${total}`,
    `hors_categories: ${hors}`,
    'genere_par: notebooklm',
    'gabarit: v3',
    'relu: false',
  ];

  const aUnTitre = /^\s*#\s+\S/.test(corps.split('\n')[0] ?? '');
  const titre = aUnTitre ? '' : '# Inventaire des mécaniques\n\n';
  return `---\n${entete.join('\n')}\n---\n\n${titre}${corps}\n`;
}
