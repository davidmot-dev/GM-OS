/**
 * L'étape locale : `## Métadonnées` → frontmatter YAML.
 *
 * **Pourquoi elle ne peut pas se faire dans le carnet.** On lui a demandé du
 * frontmatter : il a pris les `---` pour un séparateur et aplati le bloc en
 * titre. La ligne de partage est acquise — *on demande au carnet ce qu'il sait
 * produire, on fabrique localement ce qui doit être exact* — et c'est ici que
 * tombe le « localement ».
 *
 * Trois choses s'y jouent, et aucune n'est cosmétique :
 *
 * 1. **Le frontmatter**, sans quoi le RAG ne reconnaît pas la fiche : sans
 *    `sujet:`, une fiche soignée pèse autant qu'une décharge au classement
 *    (`electron/ragSelection.ts`).
 * 2. **La clé canonique**, sans quoi deux jeux ne se comparent plus. Le carnet
 *    nomme librement ; {@link clefCanonique} rabat sur le canevas.
 * 3. **Le slug de fichier**, pour que la même règle atterrisse au même endroit
 *    d'un système à l'autre.
 *
 * La conversion ne *corrige* rien du contenu : elle range, elle signale, et elle
 * laisse la relecture humaine trancher (`relu: false`).
 */

import { clefCanonique, slugFiche } from './canevas';

export interface FicheConvertie {
  /** Clé canonique si le sujet entre dans le canevas, libellé du carnet sinon. */
  sujet: string;
  /** Vrai quand le sujet n'a pas pu être rabattu sur le canevas. */
  horsCanevas: boolean;
  /** `complète`, `partielle` ou `absente`. */
  couverture: string;
  /** Titres de section cités, tels que le carnet les a rendus. */
  sections: string[];
  /** Nom de fichier sans extension. */
  slug: string;
  /** Le fichier complet : frontmatter, titre, corps. */
  markdown: string;
  /** Ce que la conversion n'a pas su faire, ou ce qui mérite une relecture. */
  avertissements: string[];
}

export interface OptionsConversion {
  systeme: string;
  /** Sujet demandé au carnet. Sert de repli si la fiche n'en déclare pas. */
  sujetDemande?: string;
}

const COUVERTURES = ['complète', 'partielle', 'absente'] as const;

/** Sans accents ni casse — pour reconnaître un intitulé, pas pour l'afficher. */
function sansAccent(valeur: string): string {
  return valeur.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().trim();
}

/**
 * Défait ce que le carnet ajoute malgré la consigne.
 *
 * Le bloc de code entourant la réponse et la ponctuation échappée (`1\.`, `\+`)
 * sont deux travers connus : le gabarit les interdit, le carnet les produit
 * quand même de temps en temps. Les `---` de tête sont le troisième — quand il
 * tente le frontmatter qu'on ne lui demande plus.
 */
function nettoyer(brut: string): string {
  let texte = brut.replace(/\r\n/g, '\n').trim();

  const bloc = /^```(?:markdown|md)?\n([\s\S]*?)\n```$/.exec(texte);
  if (bloc) texte = bloc[1].trim();

  while (/^---\s*$/m.test(texte.split('\n')[0] ?? '')) {
    texte = texte.split('\n').slice(1).join('\n').trim();
  }

  return texte.replace(/\\([.+*_#-])/g, '$1');
}

/** Reconnaît l'en-tête « Métadonnées », titré ou en gras. */
function estEnteteMetadonnees(ligne: string): boolean {
  const nu = sansAccent(ligne).replace(/[#*:\s]/g, '');
  return nu === 'metadonnees';
}

function estTitre(ligne: string): boolean {
  return /^\s*#{1,6}\s+\S/.test(ligne);
}

/**
 * Lit le bloc de métadonnées en couples clé → valeur.
 *
 * Les sous-puces sans `:` prolongent la valeur précédente : le carnet énumère
 * volontiers ses sections sur plusieurs lignes.
 */
function lireMetadonnees(lignes: string[]): Map<string, string> {
  const champs = new Map<string, string>();
  let derniere: string | null = null;

  for (const ligne of lignes) {
    const couple = /^\s*[-*•]?\s*(?:\*\*)?\s*([^:*]{1,40}?)\s*(?:\*\*)?\s*:\s*(.*)$/.exec(ligne);
    if (couple) {
      derniere = sansAccent(couple[1]);
      champs.set(derniere, couple[2].trim());
      continue;
    }

    const suite = /^\s*[-*•]\s*(.+)$/.exec(ligne);
    if (suite && derniere) {
      const actuelle = champs.get(derniere) ?? '';
      champs.set(derniere, actuelle ? `${actuelle} ; ${suite[1].trim()}` : suite[1].trim());
    }
  }

  return champs;
}

/**
 * Découpe une liste de titres de section.
 *
 * Le séparateur de sortie est le point-virgule, parce que c'est celui que lit
 * `electron/bookIndex.sectionsCitees`. En entrée le carnet emploie aussi la
 * virgule — mais un titre en contient parfois une, donc on ne coupe sur virgule
 * que devant une majuscule ou un guillemet ouvrant.
 */
export function decouperSections(valeur: string): string[] {
  return valeur
    .split(/\s*[;·]\s*|\s*,\s(?=[A-ZÀ-Ý«])/)
    .map(s => s.replace(/^[«"'*\s]+|[»"'*\s.]+$/g, '').trim())
    .filter(Boolean);
}

/** Une valeur YAML citée, guillemets internes échappés. */
function citer(valeur: string): string {
  return `"${valeur.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Cite seulement quand il le faut : un `: ` ou une tête de ligne ambiguë
 * casseraient un scalaire nu.
 */
function valeurYaml(valeur: string): string {
  return /:\s|^[[{#&*!|>%@`-]|^\s|\s$|["']/.test(valeur) ? citer(valeur) : valeur;
}

/**
 * Convertit une fiche rendue par le carnet en fichier de corpus.
 *
 * Ne lève jamais : une fiche mal formée produit des avertissements et un
 * fichier quand même exploitable. Perdre la réponse coûterait une requête au
 * carnet — et sur une génération complète, elles se comptent par vingtaines
 * sous un plafond de dix minutes.
 */
export function convertirFiche(brut: string, options: OptionsConversion): FicheConvertie {
  const avertissements: string[] = [];
  const texte = nettoyer(brut);
  const lignes = texte.split('\n');

  const debut = lignes.findIndex(estEnteteMetadonnees);
  let champs = new Map<string, string>();
  let corps = lignes;

  if (debut === -1) {
    avertissements.push(
      "La fiche ne comporte pas de section « Métadonnées » : sujet et couverture sont déduits de la requête.",
    );
  } else {
    let fin = debut + 1;
    while (fin < lignes.length && !estTitre(lignes[fin])) fin++;
    champs = lireMetadonnees(lignes.slice(debut + 1, fin));
    corps = [...lignes.slice(0, debut), ...lignes.slice(fin)];
  }

  // Sujet — le libellé du carnet, rabattu sur le canevas quand c'est possible.
  const libelle = champs.get('sujet') || options.sujetDemande || '';
  if (!libelle) avertissements.push("Aucun sujet : la fiche est inclassable telle quelle.");
  const canonique = libelle ? clefCanonique(libelle) : null;
  const sujet = canonique ?? libelle ?? '';
  const horsCanevas = canonique === null;
  if (horsCanevas && libelle) {
    avertissements.push(
      `« ${libelle} » n'entre dans aucun des treize sujets : la fiche est marquée hors canevas.`,
    );
  }

  // Couverture — trois valeurs, pas une de plus : c'est elle qui rend l'absence
  // visible, et une absence invisible vaut une absence fausse.
  const couvertureBrute = (champs.get('couverture') || '').replace(/[.*]/g, '').trim();
  const couvertureLue = COUVERTURES.find(c => sansAccent(c) === sansAccent(couvertureBrute));
  if (!couvertureLue) {
    avertissements.push(
      couvertureBrute
        ? `Couverture « ${couvertureBrute} » non reconnue, ramenée à « partielle ».`
        : 'Couverture absente de la fiche, ramenée à « partielle ».',
    );
  }
  const couverture = couvertureLue ?? 'partielle';

  const sources = (champs.get('sources') || '').trim();
  if (!sources) avertissements.push('La fiche ne cite aucune source.');

  const sections = decouperSections(champs.get('sections') || '');
  if (sections.length === 0) {
    avertissements.push(
      "Aucun titre de section : le résolveur titre → page n'a rien à confronter, et rien n'attrape l'invention sur cette fiche.",
    );
  }

  // Le carnet ne doit plus rendre de pages. S'il en rend, elles sont fausses.
  const pagesCitees = /\bp(?:\.|ages?)\s*\d/i.test(texte);
  if (pagesCitees) {
    avertissements.push(
      'La fiche cite des numéros de page malgré la consigne : ils ne renvoient pas au livre.',
    );
  }

  const entetes: string[] = [
    `sujet: ${valeurYaml(sujet)}`,
    `systeme: ${valeurYaml(options.systeme)}`,
    `couverture: ${couverture}`,
    `hors_canevas: ${horsCanevas}`,
    `sources: ${citer(sources)}`,
    `sections: ${citer(sections.map(s => `« ${s} »`).join(' ; '))}`,
  ];
  // Le champ n'a de sens que s'il y a des pages à qualifier. Une fiche v3 n'en
  // cite aucune : y écrire `false` laisserait croire qu'il en existe.
  if (pagesCitees) entetes.push('pages_fiables: false');
  entetes.push('genere_par: notebooklm', 'gabarit: v3', 'relu: false');

  const texteCorps = corps.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const aUnTitre = /^\s*#\s+\S/m.test(texteCorps.split('\n')[0] ?? '');
  const titre = aUnTitre ? '' : `# ${sujet || 'Fiche sans sujet'}\n\n`;

  return {
    sujet,
    horsCanevas,
    couverture,
    sections,
    slug: slugFiche(sujet),
    markdown: `---\n${entetes.join('\n')}\n---\n\n${titre}${texteCorps}\n`,
    avertissements,
  };
}
