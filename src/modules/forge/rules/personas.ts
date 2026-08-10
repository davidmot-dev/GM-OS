/**
 * Lecture et contrôle des huit personas rendues par le prompt B.
 *
 * **Le piège du chemin.** Les personas se lisent dans
 * `docs/systems/<id>/gems.json` — littéralement ce chemin. `AIService` appelle
 * `readDoc('systems/<id>/gems.json')` ; un fichier rangé dans un sous-dossier
 * `personas/` n'est jamais lu, **sans le moindre message d'erreur**. Le piège
 * s'est produit deux fois. `electron/corpusSysteme.cheminDesPersonas` est
 * désormais le seul à calculer ce chemin — deux fonctions répondant à la même
 * question finissent par ne plus répondre pareil — et
 * `electron/systemPersonas.test.ts` en tient le contrat côté disque.
 *
 * **Le piège des clés.** `AIService` indexe par `gemId` : une clé inconnue est
 * du travail perdu, silencieusement. On rejette plutôt que d'écrire à côté.
 *
 * **Le piège du contenu.** Une persona porte une voix, jamais des règles. Le RAG
 * fournit déjà les règles ; une persona qui les affirme finira par les
 * contredire — le Stratège d'Alien v1 énonçait « la mort est toujours
 * instantanée et inéluctable », que `sante-et-blessures.md`, tirée du même
 * livre, contredit. {@link controlerPersonas} le signale sans bloquer : c'est un
 * soupçon à relire, pas un verdict.
 */

/** Les huit gemmes, définies dans `src/stores/useGemStore.ts`. */
export const CLEFS_GEMMES = [
  'sage', 'scribe', 'oracle', 'bard',
  'alchemist', 'actor', 'cartographer', 'strategist',
] as const;

export type ClefGemme = (typeof CLEFS_GEMMES)[number];

export type Personas = Record<ClefGemme, string>;


/**
 * Plafond de longueur d'une persona.
 *
 * Elle est placée en tête de **chaque** prompt système : sa longueur se paie à
 * chaque question. Le gabarit en demande 400 à 700 ; 1 200 est la limite haute
 * verrouillée par `systemPersonas.test.ts`, pas une cible.
 */
export const LONGUEUR_MAX_PERSONA = 1200;

/**
 * Extrait l'objet JSON d'une réponse de carnet.
 *
 * Le prompt interdit le bloc de code autour ; le carnet en met un de temps en
 * temps. On prend le premier objet accolé plutôt que d'échouer là-dessus.
 */
export interface PersonasExtraites {
  personas: Personas;
  /** Clés rendues par le carnet qui ne sont pas des gemmes — travail perdu. */
  ignorees: string[];
}

export function extrairePersonas(brut: string): PersonasExtraites {
  const texte = brut.replace(/\r\n/g, '\n').trim();
  const bloc = /```(?:json)?\s*\n([\s\S]*?)\n```/.exec(texte);
  const candidat = bloc ? bloc[1] : (/\{[\s\S]*\}/.exec(texte)?.[0] ?? texte);

  let parse: unknown;
  try {
    parse = JSON.parse(candidat);
  } catch {
    throw new Error(
      "La réponse du carnet n'est pas un JSON exploitable : les personas n'ont pas été écrites.",
    );
  }

  if (!parse || typeof parse !== 'object' || Array.isArray(parse)) {
    throw new Error('Les personas doivent former un objet, une clé par gemme.');
  }

  const source = parse as Record<string, unknown>;
  const personas = {} as Personas;
  const manquantes: string[] = [];

  for (const clef of CLEFS_GEMMES) {
    const valeur = source[clef];
    if (typeof valeur !== 'string' || !valeur.trim()) {
      manquantes.push(clef);
      continue;
    }
    personas[clef] = valeur.trim();
  }

  if (manquantes.length > 0) {
    throw new Error(
      `Personas manquantes ou vides : ${manquantes.join(', ')}. Une gemme sans persona retombe sur l'instruction générique.`,
    );
  }

  const connues = new Set<string>(CLEFS_GEMMES);
  return { personas, ignorees: Object.keys(source).filter(c => !connues.has(c)) };
}

/**
 * Contrôles de forme et de contenu. Ne bloque pas : rend ce qu'il faut relire.
 *
 * Le repérage des règles chiffrées est volontairement grossier — un nombre suivi
 * d'un vocabulaire de mécanique. Il rate des formulations et en signale de
 * bénignes ; c'est le bon réglage pour un signal de relecture.
 */
export function controlerPersonas(personas: Personas): string[] {
  const avertissements: string[] = [];

  for (const [clef, texte] of Object.entries(personas) as [ClefGemme, string][]) {
    if (texte.length > LONGUEUR_MAX_PERSONA) {
      avertissements.push(
        `« ${clef} » fait ${texte.length} caractères : au-delà de ${LONGUEUR_MAX_PERSONA}, elle est refusée, et elle se paie à chaque question.`,
      );
    }

    if (/\b\d+\s*(d\d+|dés?|points?|niveaux?|degrés?|%|pv|seuils?)\b/i.test(texte)) {
      avertissements.push(
        `« ${clef} » énonce une valeur chiffrée : les règles viennent du RAG, une persona qui les répète finira par les contredire.`,
      );
    }
  }

  return avertissements;
}
