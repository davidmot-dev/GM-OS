/**
 * Lire les fiches d'un corpus, telles qu'elles sont sur le disque.
 *
 * **Le chaînon qui manquait.** `forgeSystemDepuisCorpus` sait dériver un pilote
 * d'une liste de {@link FicheDuCorpus} ; personne ne savait constituer cette
 * liste. C'est ce que fait ce module, et rien d'autre : il lit, il range, et il
 * dit ce qu'il n'a pas su lire.
 *
 * **Le frontmatter est retiré du contenu envoyé au modèle.** Il porte les
 * sources, les titres de section et l'état de relecture — utiles à qui relit la
 * fiche, inutiles à qui en tire un champ de pilote. À ~8 000 tokens de budget
 * d'invite, sept lignes par fiche sur dix-sept fiches ne sont pas une économie
 * théorique.
 *
 * **Une fiche sans `sujet:` n'est pas une fiche.** C'est par lui qu'elle se
 * rattache au canevas, donc à un groupe de champs ; sans lui elle ne nourrirait
 * aucun groupe. On ne la jette pas en silence pour autant — elle est rendue à
 * part, avec sa raison, parce qu'un corpus qu'on croit lu et qui ne l'est qu'à
 * moitié est le genre de trou qui se découvre trois écrans plus loin.
 */

import { cheminDesFiches, type Corpus } from '../../../../electron/corpusSysteme';
import type { FicheDuCorpus } from './GroupesDeChamps';

/**
 * Ce que la lecture demande au disque.
 *
 * Injectable : le pont n'existe pas sous vitest, et une lecture de corpus doit
 * pouvoir être vérifiée sans Electron.
 */
export interface AccesAuxFiches {
  listDir: (chemin: string) => Promise<string[]>;
  readDoc: (chemin: string) => Promise<string | null>;
}

/** Un fichier qui n'a pas pu devenir une fiche, et pourquoi. */
export interface FichierIgnore {
  fichier: string;
  raison: string;
}

export interface LectureDuCorpus {
  /** Le dossier lu — à afficher, parce qu'un dossier vide et un mauvais dossier se ressemblent. */
  chemin: string;
  fiches: FicheDuCorpus[];
  ignorees: FichierIgnore[];
}

/**
 * La valeur d'une clé du frontmatter, ou une chaîne vide.
 *
 * On ne lit que le bloc de tête : un `sujet:` qui apparaîtrait dans le corps
 * d'une fiche est du texte, pas une métadonnée.
 *
 * **Générique parce que les fiches de campagne portent plus que `sujet:`.**
 * Elles déclarent aussi `partie:` — l'acte qui les borne — et `jeu:`, que la
 * Forge de campagne lit pour ne pas redemander au meneur ce que l'Atelier
 * savait déjà. Trois lecteurs de frontmatter écrits séparément finiraient par
 * ne plus décoter les guillemets de la même façon.
 */
export function champDeLaFiche(contenu: string, clef: string): string {
  const entete = blocFrontmatter(contenu);
  if (!entete) return '';

  const motif = new RegExp(`^${clef}\\s*:\\s*(.*)$`);
  for (const ligne of entete.bloc.split('\n')) {
    const couple = motif.exec(ligne.trim());
    if (couple) return decoterYaml(couple[1].trim());
  }
  return '';
}

/** Le `sujet:` du frontmatter — c'est par lui qu'une fiche se rattache au canevas. */
export function sujetDeLaFiche(contenu: string): string {
  return champDeLaFiche(contenu, 'sujet');
}

/**
 * La fiche sans son frontmatter — ce qu'on envoie au modèle.
 *
 * Un fichier sans frontmatter est rendu tel quel : mieux vaut un contenu brut
 * qu'un contenu vide, et la fiche sera de toute façon écartée si elle n'a pas de
 * sujet.
 */
export function corpsDeLaFiche(contenu: string): string {
  const texte = contenu.replace(/\r\n/g, '\n');
  const entete = blocFrontmatter(texte);
  return (entete ? entete.apres : texte).trim();
}

/**
 * Le bloc `---` de tête, et ce qui le suit. `null` s'il n'y en a pas.
 *
 * Le délimiteur de fin est cherché en début de ligne : une fiche peut contenir
 * un `---` de séparation dans son corps, et le lire comme une fin de
 * frontmatter tronquerait la règle.
 */
function blocFrontmatter(contenu: string): { bloc: string; apres: string } | null {
  const texte = contenu.replace(/\r\n/g, '\n');
  if (!/^---[ \t]*\n/.test(texte)) return null;

  const debut = texte.indexOf('\n') + 1;
  const fin = /^---[ \t]*$/m.exec(texte.slice(debut));
  if (!fin || fin.index === undefined) return null;

  return {
    bloc: texte.slice(debut, debut + fin.index),
    apres: texte.slice(debut + fin.index + fin[0].length),
  };
}

/** Défait ce que `convertirFiche` a cité : guillemets encadrants et échappements. */
function decoterYaml(valeur: string): string {
  const cite = /^"([\s\S]*)"$/.exec(valeur) ?? /^'([\s\S]*)'$/.exec(valeur);
  if (!cite) return valeur;
  return cite[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

/** Le pont, quand il est là. */
function accesParDefaut(): AccesAuxFiches {
  const ai = window.appBridge?.ai;
  if (!ai?.listDir || !ai?.readDoc) {
    throw new Error(
      "Le pont de lecture des fichiers n'est pas disponible : relancez l'application.",
    );
  }
  return { listDir: ai.listDir, readDoc: ai.readDoc };
}

/**
 * Toutes les fiches d'un corpus, prêtes pour {@link forgeSystemDepuisCorpus}.
 *
 * Ne lève que si le pont manque : un dossier absent rend une lecture vide, ce
 * qui est un résultat et non une panne — c'est l'état normal d'un corpus que
 * l'Atelier n'a pas encore documenté.
 */
export async function lireFichesDuCorpus(
  corpus: Corpus,
  acces: AccesAuxFiches = accesParDefaut(),
): Promise<LectureDuCorpus> {
  const chemin = cheminDesFiches(corpus);
  const noms = (await acces.listDir(chemin).catch(() => [] as string[]))
    .filter(nom => nom.endsWith('.md'));

  const fiches: FicheDuCorpus[] = [];
  const ignorees: FichierIgnore[] = [];

  const lus = await Promise.all(
    noms.map(async nom => ({
      nom,
      contenu: await acces.readDoc(`${chemin}/${nom}`).catch(() => null),
    })),
  );

  for (const { nom, contenu } of lus) {
    if (!contenu || !contenu.trim()) {
      ignorees.push({ fichier: nom, raison: 'fichier vide ou illisible' });
      continue;
    }
    const sujet = sujetDeLaFiche(contenu);
    if (!sujet) {
      ignorees.push({ fichier: nom, raison: 'aucun « sujet: » dans le frontmatter' });
      continue;
    }
    const corps = corpsDeLaFiche(contenu);
    if (!corps) {
      ignorees.push({ fichier: nom, raison: 'frontmatter seul, aucun contenu' });
      continue;
    }
    // `couverture:` voyage avec la fiche : c'est elle qui dit si le livre traite
    // ce sujet, et une fiche « absente » ne doit nourrir aucun groupe.
    const couverture = champDeLaFiche(contenu, 'couverture');
    fiches.push({ sujet, contenu: corps, ...(couverture ? { couverture } : {}) });
  }

  return { chemin, fiches, ignorees };
}
