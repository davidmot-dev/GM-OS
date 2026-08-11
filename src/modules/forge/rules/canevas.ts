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
  {
    /**
     * **Le quatorzième sujet, ajouté le 2026-08-11.**
     *
     * Les treize premiers sont des mécaniques de résolution ; aucun ne dit ce
     * que porte une fiche. Or la Forge Système produit `driver` **et**
     * `template`, et le second n'avait aucune source dans le corpus.
     *
     * Dune s'en est tiré par accident : ses cinq Compétences et cinq Principes
     * sont apparus dans une fiche *hors canevas* que le carnet a proposée de
     * lui-même. Alien n'a pas eu cette chance — ses trois hors catégories
     * parlent de vaisseaux, de synthétiques et de xénomorphes. Dériver son
     * pilote du corpus aurait donné une fiche vide, ou pire, inventée.
     *
     * **La distinction qui rend ce sujet acceptable** : on demande ce que porte
     * une fiche *finie*, pas comment on la remplit. L'achat de points, les
     * archétypes et les historiques restent exclus — ce sont les chapitres les
     * plus volumineux des livres, et c'est pour eux que l'exclusion existe.
     * Un inventaire, pas une procédure.
     */
    clef: 'Composition de la fiche de personnage',
    enonce:
      'Composition de la FICHE DE PERSONNAGE : liste des caractéristiques,\n' +
      '   compétences et attributs CHIFFRÉS qu\'elle porte, leurs noms exacts et\n' +
      '   leurs bornes (valeur de départ, minimum, maximum).\n' +
      '   PAS la procédure de création, PAS la progression, PAS l\'équipement.',
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

/**
 * Recouvrement du sujet du canevas par le libellé, entre 0 et 1.
 *
 * **Les mots de la clé sont dédoublonnés, et ce n'est pas un détail.** « Dégâts
 * et types de dégâts » porte deux fois le mot « dégâts » : sans dédoublonnage,
 * ce mot **votait deux fois**, et n'importe quel libellé le contenant atteignait
 * mécaniquement les deux tiers exigés.
 *
 * Constaté en réel le 2026-08-10 sur Blade Runner : « Différence mécanique
 * Humains vs Réplicants (Jets forcés & Dégâts/Stress) » était rabattu sur
 * « Dégâts et types de dégâts » — un seul mot commun sur neuf. La fiche
 * changeait de sujet, de slug, et **écrasait la vraie fiche Dégâts**. David l'a
 * reforgée sept fois sans jamais la voir aboutir.
 */
function recouvrement(clef: string, libelle: string): number {
  const attendus = [...new Set(motsSignifiants(clef))];
  if (attendus.length === 0) return 0;
  const proposes = new Set(motsSignifiants(libelle));
  return attendus.filter(m => proposes.has(m)).length / attendus.length;
}

/**
 * Part du libellé que la clé explique, entre 0 et 1.
 *
 * **Le second garde-fou, et le plus général.** Le recouvrement ne regarde que
 * dans un sens : il demande si la clé se retrouve dans le libellé, jamais si le
 * libellé ressemble à la clé. Un titre long qui contient par hasard les mots
 * d'une clé courte passait donc entièrement dans cette clé — un sujet de neuf
 * mots absorbé par un sujet de deux.
 *
 * Le seuil est volontairement bas : « Monnaie de table ou ressource partagée »
 * n'est expliqué qu'à moitié par « Monnaie de table », et c'est pourtant bien le
 * même sujet. On écarte ce qui ne se recoupe qu'accessoirement, pas ce qui est
 * simplement plus précis.
 */
function reciprocite(clef: string, libelle: string): number {
  const proposes = [...new Set(motsSignifiants(libelle))];
  if (proposes.length === 0) return 0;
  const attendus = new Set(motsSignifiants(clef));
  return proposes.filter(m => attendus.has(m)).length / proposes.length;
}

/**
 * Deux tiers des mots signifiants. En dessous, le rapprochement est un hasard :
 * « Santé mentale » partage un mot sur deux avec « Santé et blessures » et n'a
 * rien à voir avec lui.
 */
const SEUIL_RECOUVREMENT = 2 / 3;

/**
 * Un tiers du libellé, au minimum, doit relever de la clé.
 *
 * Bas à dessein : un libellé plus précis que la clé reste le même sujet. Il ne
 * sert qu'à écarter l'absorption d'un titre long par une clé courte — un mot
 * commun sur neuf n'est pas un rapprochement, c'est une coïncidence.
 */
const SEUIL_RECIPROCITE = 1 / 3;

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
  //
  //    Le rapprochement se juge **dans les deux sens**. La clé doit se retrouver
  //    dans le libellé, et le libellé doit relever de la clé : un titre de neuf
  //    mots qui n'en partage qu'un avec une clé de deux n'est pas ce sujet-là,
  //    quelle que soit la part de la clé qu'il couvre.
  let meilleur: string | null = null;
  let meilleurScore = 0;
  let exAequo = false;
  for (const sujet of CANEVAS) {
    if (reciprocite(sujet.clef, libelle) < SEUIL_RECIPROCITE) continue;
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
