/**
 * Le canevas des treize sujets, et la clé canonique.
 *
 * **Pourquoi la liste est ici et pas dans le carnet.** Demander à NotebookLM
 * quels sujets traiter fait dériver la taxonomie d'un jeu à l'autre : chaque
 * carnet invente la sienne, et la comparaison entre systèmes devient
 * impossible. La liste est donc *fournie*, jamais demandée.
 *
 * **Pourquoi une clé distincte de l'énoncé.** L'énoncé porte les précisions qui
 * évitent le contresens — « ressource PARTAGÉE par toute la table » face à
 * « jauges INDIVIDUELLES ». Le carnet répond en reprenant ces précisions :
 * Dune a rendu « Monnaie de table ou ressource partagée » et « Ton, registre et
 * ambiance recherchés ». La clé de comparaison doit être identique au caractère
 * près d'un système à l'autre, sinon on ne peut plus confronter deux jeux — d'où
 * le rabattage de {@link clefCanonique}.
 */

import { deplierLigatures } from '../../../../electron/corpusSysteme';

export interface SujetCanevas {
  /** Clé de comparaison entre systèmes. Identique au caractère près. */
  clef: string;
  /** Énoncé fourni au carnet, précisions comprises. */
  enonce: string;
}

/** Les treize sujets, dans l'ordre du gabarit d'inventaire. */
export const CANEVAS: readonly SujetCanevas[] = [
  {
    clef: 'Résolution des jets',
    enonce: 'Résolution des jets (dés utilisés, lecture du résultat, réussite/échec)',
  },
  {
    clef: 'Degrés de réussite et critiques',
    enonce: 'Degrés de réussite et critiques',
  },
  {
    clef: 'Jets opposés, aide et coopération',
    enonce: 'Jets opposés, aide et coopération',
  },
  {
    clef: 'Initiative et déroulement du tour',
    enonce: 'Initiative et déroulement du tour',
  },
  {
    clef: 'Santé et blessures',
    enonce: 'Santé et blessures (échelle utilisée, incapacité, mort)',
  },
  {
    clef: 'Dégâts et types de dégâts',
    enonce: 'Dégâts et types de dégâts',
  },
  {
    clef: 'États et conditions',
    enonce: 'États et conditions (comment on les subit, comment on en sort)',
  },
  {
    clef: 'Monnaie de table',
    enonce: 'Monnaie de table ou ressource PARTAGÉE par toute la table (élan, menace, jetons…)',
  },
  {
    clef: 'Jauges et ressources individuelles',
    enonce:
      "Jauges et ressources INDIVIDUELLES, tenues sur la fiche d'un personnage\n   (stress, santé mentale, points de magie, fatigue, monnaie, réputation…)",
  },
  {
    clef: 'Distances et portées',
    enonce: 'Distances et portées en combat',
  },
  {
    clef: 'Poursuites',
    enonce: 'Poursuites',
  },
  {
    clef: 'Environnement et dangers',
    enonce: 'Environnement et dangers (froid, vide, chute, feu, privation…)',
  },
  {
    clef: 'Ton, registre et ambiance',
    enonce: 'Ton, registre et ambiance recherchés',
  },
] as const;

/** Les treize clés seules, pour piloter la boucle de génération. */
export const CLEFS_CANEVAS: readonly string[] = CANEVAS.map(s => s.clef);

/**
 * Sans accents, sans casse, sans ponctuation, espaces réduits à un seul.
 *
 * On garde les espaces, contrairement à `bookIndex.clef` : ici on compare des
 * suites de mots et le découpage en mots porte le rapprochement.
 */
export function normaliser(valeur: string): string {
  return deplierLigatures(valeur)
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Mots vides du français : ils ne discriminent rien et gonflent artificiellement
 * le recouvrement de deux libellés sans rapport.
 */
const MOTS_VIDES = new Set([
  'a', 'au', 'aux', 'de', 'des', 'du', 'en', 'et', 'la', 'le', 'les',
  'ou', 'par', 'pour', 'sur', 'un', 'une', 'd', 'l',
]);

function motsSignifiants(valeur: string): string[] {
  return normaliser(valeur)
    .split(' ')
    .filter(m => m.length > 0 && !MOTS_VIDES.has(m));
}

/** Recouvrement du sujet du canevas par le libellé, entre 0 et 1. */
function recouvrement(clef: string, libelle: string): number {
  const attendus = motsSignifiants(clef);
  if (attendus.length === 0) return 0;
  const proposes = new Set(motsSignifiants(libelle));
  return attendus.filter(m => proposes.has(m)).length / attendus.length;
}

/**
 * Deux tiers des mots signifiants. En dessous, le rapprochement est un hasard :
 * « Santé mentale » partage un mot sur deux avec « Santé et blessures » et n'a
 * rien à voir avec lui.
 */
const SEUIL_RECOUVREMENT = 2 / 3;

/**
 * Ramène le libellé rendu par le carnet à la clé canonique du canevas.
 *
 * Rend `null` quand aucun sujet ne correspond — c'est le cas des mécaniques
 * « hors catégories », qui gardent alors le libellé du carnet et portent
 * `hors_canevas: true`. **Ne jamais forcer un rattachement** : une fiche rangée
 * sous un mauvais sujet est pire qu'une fiche hors canevas, puisqu'elle fausse
 * la comparaison entre jeux au lieu de simplement s'en abstenir.
 */
export function clefCanonique(libelle: string): string | null {
  const cible = normaliser(libelle);
  if (!cible) return null;

  // 1. Égalité — le cas normal quand le carnet a repris la clé telle quelle.
  for (const sujet of CANEVAS) {
    if (normaliser(sujet.clef) === cible) return sujet.clef;
  }

  // 2. Préfixe — « Monnaie de table ou ressource partagée » reste la monnaie de
  //    table. On retient le préfixe le plus long : il est le plus spécifique.
  let meilleurPrefixe: string | null = null;
  let longueurPrefixe = 0;
  for (const sujet of CANEVAS) {
    const clefNormalisee = normaliser(sujet.clef);
    const prefixe =
      cible.startsWith(clefNormalisee + ' ') || clefNormalisee.startsWith(cible + ' ');
    if (prefixe && clefNormalisee.length > longueurPrefixe) {
      meilleurPrefixe = sujet.clef;
      longueurPrefixe = clefNormalisee.length;
    }
  }
  if (meilleurPrefixe) return meilleurPrefixe;

  // 3. Recouvrement — rattrape les reformulations (« Ambiance et ton visés »).
  //    Un ex æquo est une ambiguïté : on préfère le hors-canevas au mauvais rang.
  let meilleur: string | null = null;
  let meilleurScore = 0;
  let exAequo = false;
  for (const sujet of CANEVAS) {
    const score = recouvrement(sujet.clef, libelle);
    if (score > meilleurScore) {
      meilleurScore = score;
      meilleur = sujet.clef;
      exAequo = false;
    } else if (score === meilleurScore && score > 0) {
      exAequo = true;
    }
  }

  if (meilleurScore >= SEUIL_RECOUVREMENT && !exAequo) return meilleur;
  return null;
}

/**
 * Slug de nom de fichier, tiré du sujet.
 *
 * Le corpus antérieur mélange deux conventions (`fiche-poursuites.md` chez Dune,
 * `poursuites.md` chez Alien). On retient la seconde, la plus récente : le
 * dossier s'appelle déjà `rules/`, préfixer chaque fichier par `fiche-` ne dit
 * rien de plus.
 */
export function slugFiche(sujet: string): string {
  const slug = normaliser(sujet).replace(/ /g, '-');
  return slug || 'fiche-sans-sujet';
}
