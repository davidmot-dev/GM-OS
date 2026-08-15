import { AIService } from '../ai/AIService';
import { useAIStore } from '../../stores/useAIStore';
import type { Campaign, Entity, AtlasMap, WikiEntry, EntityRelation } from '../session/useSessionOSStore';
import type { GameDriver } from '../../types/drivers';
import type { ForgeContextItem } from './ForgeService';

export interface ChronicleForgeResult {
  campaign: Partial<Campaign>;
  entities: (Partial<Entity> & { relations?: { targetName: string; type: EntityRelation['type']; description: string }[] })[];
  locations: Partial<AtlasMap>[];
  lore: Partial<WikiEntry>[];
}

/** Les types de lien qu'`EntityRelation` accepte. Écrits ici pour que le décodeur les impose. */
const TYPES_DE_LIEN = ['ally', 'neutral', 'hostile', 'family', 'romantic', 'mentor', 'rival', 'other'] as const;

/**
 * Comment ce jeu met un adversaire hors de combat — et s'il faut lui demander
 * des points de vie.
 *
 * **Le défaut que cette fonction remplace, relevé le 2026-08-15.** L'invite
 * disait « Remplis "hp", "ac", "speed", "initiative" en fonction du Driver » et
 * montrait `"hp": 10, "ac": 10` — les valeurs de D&D, sur n'importe quel jeu.
 * Sur Dune, dont la défaite est une tâche étendue, le modèle n'avait aucun
 * point de vie à donner : il a répondu en prose, et
 * `hp: "Inférieure à 1 (gravement battu)"` s'est retrouvé dans un champ typé
 * `number`. *Ce n'est pas le modèle qui dérape, c'est la question qui n'a pas de
 * réponse.*
 *
 * Le pilote savait pourtant répondre — `tacheDeDefaite`, `defaultHealthType`,
 * `santeDeDepart` — et rien de tout cela ne partait. On ne demande donc plus que
 * ce que le jeu déclare compter, et `santeSelonLeJeu` construira le reste à
 * l'import, par la même règle que la création manuelle.
 */
export function santeAAnnoncer(driver: GameDriver): { demandeDesPoints: boolean; consigne: string } {
  if (driver.combat?.tacheDeDefaite) {
    return {
      demandeDesPoints: false,
      consigne:
        "SANTÉ — CE JEU N'A PAS DE POINTS DE VIE. Mettre un adversaire hors de combat y est une "
        + 'tâche étendue, dont le seuil se lit sur la fiche de la cible. N\'écris donc NI "hp" NI '
        + '"maxHp" : le meneur réglera lui-même la résistance de chaque adversaire.',
    };
  }

  const modele = driver.combat?.defaultHealthType;
  if (modele === 'hp') {
    const formule = driver.combat?.santeDeDepart;
    return {
      demandeDesPoints: true,
      consigne:
        'SANTÉ — ce jeu compte des points. Donne "hp" et "maxHp" **à l\'échelle de CE jeu**, jamais '
        + "à celle d'un autre : un adversaire ordinaire n'a pas dix points de vie parce qu'un autre "
        + 'jeu en donne dix.'
        + (formule
          ? ` Sur ce jeu, la santé de départ se calcule ainsi : « ${formule} » — les valeurs `
            + 'restent donc du même ordre que les caractéristiques de la fiche.'
          : ''),
    };
  }

  if (modele) {
    const nom: Record<string, string> = {
      clocks: 'une horloge à segments',
      anatomy: 'des zones du corps',
      wounds: 'des blessures nommées',
      boxes: 'des cases à cocher',
    };
    return {
      demandeDesPoints: false,
      consigne:
        `SANTÉ — ce jeu compte les dégâts par ${nom[modele] ?? modele}, PAS par points. `
        + 'N\'écris NI "hp" NI "maxHp".',
    };
  }

  return {
    demandeDesPoints: false,
    consigne:
      "SANTÉ — le pilote de ce jeu ne déclare aucun modèle de santé. N'écris NI \"hp\" NI \"maxHp\" : "
      + "l'absence n'est pas un zéro, et un nombre inventé se jouerait comme une mesure.",
  };
}

/**
 * La **forme exacte** imposée au décodeur.
 *
 * Une consigne se contourne, un schéma non : Ollama le transmet à llama.cpp, qui
 * en dérive une grammaire. Le modèle ne peut alors produire ni clé de trop, ni
 * valeur d'un autre type, ni prose logée dans une chaîne.
 *
 * **`additionalProperties: false` fait ici le gros du travail** : c'est lui qui
 * interdit `ac`, `speed` et `initiative`. Aucun pilote ne déclare de classe
 * d'armure, et « trente pieds par round » est du vocabulaire de D&D — les trois
 * champs partaient pourtant dans l'exemple, et revenaient remplis.
 *
 * `required` reste minimal, à dessein : on exige un nom, jamais un contenu. Un
 * champ absent se corrige ; un champ que la grammaire force à exister se
 * remplit par du bruit.
 */
export function schemaDeLaChronique(demandeDesPoints: boolean): Record<string, unknown> {
  const entite = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      type: { type: 'string', enum: ['npc', 'monster'] },
      role: { type: 'string', enum: ['ally', 'neutral', 'hostile', 'boss'] },
      description: { type: 'string' },
      faction: { type: 'string' },
      roleplayingNotes: { type: 'string' },
      gmSecretInfo: { type: 'string' },
      relations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            targetName: { type: 'string' },
            type: { type: 'string', enum: [...TYPES_DE_LIEN] },
            description: { type: 'string' },
          },
          required: ['targetName', 'type'],
          additionalProperties: false,
        },
      },
      // Les points de vie n'entrent dans la grammaire que si le jeu en compte.
      ...(demandeDesPoints ? { hp: { type: 'number' }, maxHp: { type: 'number' } } : {}),
    },
    required: ['name'],
    additionalProperties: false,
  };

  return {
    type: 'object',
    properties: {
      campaign: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          synopsis: { type: 'string' },
        },
        required: ['name'],
        additionalProperties: false,
      },
      entities: { type: 'array', items: entite },
      locations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['battlemap', 'world-map', 'region', 'city', 'dungeon'] },
            narrativeDescription: { type: 'string' },
            gmNotes: { type: 'string' },
          },
          required: ['name'],
          additionalProperties: false,
        },
      },
      lore: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            category: {
              type: 'string',
              enum: ['npc', 'location', 'organization', 'lore', 'item', 'clue', 'rumor', 'other'],
            },
            tags: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'content'],
          additionalProperties: false,
        },
      },
    },
    required: ['campaign'],
    additionalProperties: false,
  };
}

export class ChronicleForgeService {
  private static instance: ChronicleForgeService;

  public static getInstance(): ChronicleForgeService {
    if (!ChronicleForgeService.instance) {
      ChronicleForgeService.instance = new ChronicleForgeService();
    }
    return ChronicleForgeService.instance;
  }

  /**
   * Extrait une campagne des documents fournis : synopsis, PNJ, lieux, savoir.
   */
  public async forgeChronicle(items: ForgeContextItem[], systemDriver: GameDriver, userInstructions?: string, targetName?: string): Promise<ChronicleForgeResult> {
    const sante = santeAAnnoncer(systemDriver);
    const prompt = this.getChroniclePrompt(systemDriver, sante.consigne, userInstructions, targetName);
    const aiService = AIService.getInstance();
    const { activeProvider, configs } = useAIStore.getState();

    // 1. PRÉPARATION DU CONTENU
    let consolidatedText = "";
    const attachments: { data: string, mimeType: string }[] = [];

    items.forEach(item => {
      if (item.type === 'text') {
        consolidatedText += `\n\nDOCUMENT NARRATIF [${item.name}] :\n\n${item.content}`;
      } else {
        attachments.push({
          data: item.content,
          mimeType: item.mimeType || 'application/pdf'
        });
      }
    });

    // 2. VÉRIFICATION DE CAPACITÉ VISUELLE
    //
    // Le message nomme le modèle RÉELLEMENT chargé. Il annonçait « Gemma 4 »
    // quoi qu'il arrive — le même défaut que le bandeau du profil vocal, et il
    // envoie chercher au mauvais endroit quand c'est un autre modèle qui tourne.
    if (attachments.length > 0 && activeProvider !== 'gemini') {
      const modele = configs[activeProvider]?.modelId || activeProvider;
      throw new Error(
        `Les pièces jointes ne partent qu'avec Gemini ; le moteur actif est ${modele}. `
        + 'Extrais le texte au préalable (NotebookLM), ou bascule sur Gemini.',
      );
    }

    const fullPrompt = `${consolidatedText}\n\nINSTRUCTIONS FINALES : ${prompt}`;
    /*
      **`sansPersona`, et il manquait ici seul.** Sans lui, `prepareSystemPrompt`
      ajoute à cet appel les instructions de la gemme Sage — résolues depuis le
      corpus de LA CAMPAGNE ACTIVE — plus les personnages et les PNJ de la séance
      en cours. À une forge dont le métier est d'en créer une AUTRE.

      C'est le défaut du 2026-08-12, corrigé dans la Forge Système et dans le
      Cortex, jamais ici : *un contexte hérité d'ailleurs reste un choix que
      personne n'a fait.*

      Le schéma, lui, ne mord aujourd'hui que sur Ollama — la branche Gemini de
      `generateJSON` ne pose pas encore `response_schema`. Le dire vaut mieux que
      de le croire acquis des deux côtés.
    */
    return aiService.generateJSON<ChronicleForgeResult>(
      fullPrompt,
      "Tu extrais une campagne de jeu de rôle depuis des documents. Tu réponds en JSON, sans commentaire.",
      attachments,
      { sansPersona: true, schema: schemaDeLaChronique(sante.demandeDesPoints) },
    );
  }

  private getChroniclePrompt(driver: GameDriver, consigneDeSante: string, userInstructions?: string, targetName?: string): string {
    const stats = (driver.combat?.statsToTrack ?? []).map(s => s.label).filter(Boolean);

    return `
      Tu extrais une campagne de jeu de rôle des documents ci-dessus, et tu la rends en JSON.

      ${targetName
        ? `MODE ENRICHISSEMENT : la campagne « ${targetName} » existe déjà. Ajoute des intrigues, des PNJ et des lieux qui s'y intègrent.`
        : 'MODE CRÉATION : produis une campagne complète.'}

      LE JEU : ${driver.name}${driver.description ? ` — ${driver.description}` : ''}
      ${stats.length > 0 ? `Ce que ce jeu suit en combat : ${stats.join(', ')}.` : ''}

      ${consigneDeSante}

      Ce jeu n'a NI classe d'armure, NI vitesse de déplacement, NI score d'initiative
      à donner par adversaire : ces champs n'existent pas dans la réponse attendue.
      Ce qui distingue un adversaire d'un autre se dit dans "description",
      "roleplayingNotes" et "gmSecretInfo" — en mots, pas en statistiques inventées.

      ${userInstructions ? `CONSIGNES NARRATIVES PRIORITAIRES : "${userInstructions}"` : ''}

      CE QUE TU RENDS :
      1. "campaign" : name, description (pitch court), synopsis (l'intrigue).
      2. "entities" : les PNJ et créatures qui comptent.
         - "faction" si le personnage appartient à une organisation.
         - "relations" : les liens entre personnages, par leur nom.
           **"targetName" doit être le nom EXACT d'un autre personnage de cette
           même réponse.** Un nom qui ne correspond à personne fait perdre le lien.
      3. "locations" : les lieux majeurs — "narrativeDescription" pour les joueurs,
         "gmNotes" pour ce que seul le meneur sait.
      4. "lore" : les entrées d'encyclopédie. Les indices ("clue") et les rumeurs
         ("rumor") méritent le plus de détail : ce sont eux qui se jouent.

      N'INVENTE RIEN QUE LES DOCUMENTS NE DISENT PAS. Un champ absent se corrige ;
      un champ inventé s'applique en séance sans que personne ne l'ait choisi.
      N'écris jamais une phrase dans un champ qui attend un nombre : omets-le.

      Réponds par le JSON seul, sans commentaire ni texte autour.
    `;
  }

}

export const chronicleForgeService = ChronicleForgeService.getInstance();
