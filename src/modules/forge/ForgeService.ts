import { AIService } from '../ai/AIService';
import { useAIStore } from '../../stores/useAIStore';
import type { GameDriver } from '../../types/drivers';
import type { SheetTemplate } from '../../data/defaultSheetTemplates';
import type { BrainstormCandidate, BrainstormCard } from './rules/types';
import { gabaritInventaire, gabaritFicheRegle, gabaritFichePratique, promptVoix, promptPersonas } from './rules/gabarits';
import { lireInventaire } from './rules/inventaire';
import { convertirFiche } from './rules/conversion';
import {
  GROUPES,
  promptDuGroupe,
  fusionnerFragments,
  vocabulaireAcquis,
  type FicheDuCorpus,
  type FragmentDePilote,
  type GroupeDeChamps,
} from './rules/GroupesDeChamps';
import { sourceDuGroupe } from './rules/familleDuCorpus';
import { slugFiche } from './rules/canevas';
import { extrairePersonas, controlerPersonas, type Personas } from './rules/personas';

/**
 * Motifs d'un échec d'authentification réel.
 *
 * **Jamais `auth` nu.** La version précédente cherchait cette sous-chaîne dans
 * le résultat, y compris quand l'appel avait réussi. Or « Feyd-R**auth**a » la
 * contient, comme « **auth**entique » et « **aut**eur » — quatorze occurrences
 * dans une seule source Dune. Chaque lecture de source déclenchait donc une
 * reconnexion inutile, puis un rejeu, puis `MCP_AUTH_EXPIRED` sur un appel qui
 * avait parfaitement fonctionné.
 *
 * Toutes les frontières `\b` sont là pour ça : elles refusent une sous-chaîne
 * prise au milieu d'un mot.
 */
const MOTIFS_AUTH: readonly RegExp[] = [
  /\bunauthoriz/i,
  // « UNAUTHENTICATED » — le refus réel de Google, relevé le 2026-08-10 avec son
  // code d'erreur 16. La frontière de mot échoue sur UN·AUTHENTICATED, donc
  // `\bauthenticat` ne le voit pas : seul le mot « login » de sa phrase de
  // conseil le rattrapait, et une reformulation aurait cassé la reconnexion sans
  // que rien ne le signale.
  /\bunauthenticated\b/i,
  /\bnon autoris/i,
  /\bauthenticat/i,      // authentication, authenticate
  /\bauthentificat/i,    // authentification (français)
  /\bre-?auth/i,
  /\bcredentials?\b/i,
  /\blogin\b/i,
  /\b(session|token|jeton|cookie)s?\b[^.]{0,40}\bexpir/i,
  /\bexpir[a-zé]*\b[^.]{0,40}\b(session|token|jeton|identifiants?)\b/i,
  /\b401\b/,
  /\b403\b/,
  /veuillez vous reconnecter/i,
];

function texteEvoqueAuth(texte: string): boolean {
  return MOTIFS_AUTH.some(motif => motif.test(texte));
}

/**
 * Cet appel a-t-il échoué faute d'authentification ?
 *
 * **Un succès n'est jamais une erreur d'authentification, quoi qu'il contienne.**
 * C'est la correction structurelle : on n'inspecte le texte que d'une chose déjà
 * en échec — une exception, ou un résultat MCP portant `isError: true`. Sans ce
 * garde-fou, `\b401\b` suffirait à faire passer une citation de la page 401 pour
 * une session expirée.
 */
export function estErreurAuth(candidat: unknown): boolean {
  if (!candidat) return false;
  if (candidat instanceof Error) return texteEvoqueAuth(candidat.message);
  if (typeof candidat === 'string') return texteEvoqueAuth(candidat);
  if (typeof candidat !== 'object') return false;

  // Le contrat MCP : un outil en échec rend `isError: true`.
  if ((candidat as { isError?: unknown }).isError !== true) return false;
  return texteEvoqueAuth(JSON.stringify(candidat));
}

export interface OptionsForgeFiche {
  /**
   * Première moitié déjà obtenue, tirée d'un brouillon partiel.
   *
   * Elle évite de repayer une requête aboutie : c'est tout l'intérêt d'écrire le
   * brouillon avant la seconde demande.
   */
  moitieDeja?: string;
  /** Appelé dès que la première moitié est là, avant la seconde requête. */
  surMoitie?: (regle: string) => void;
}

export interface InventaireForge {
  candidats: BrainstormCandidate[];
  /** Le markdown rendu par le carnet — la synthèse du système. */
  inventaire: string;
}

export interface ForgePersonasResult {
  /** La fiche de voix (prompt A), archivée dans `personas/` pour la relecture. */
  voix: string;
  /** Les huit gemmes (prompt B), destinées à `systems/<id>/gems.json`. */
  personas: Personas;
  avertissements: string[];
}

export interface ForgeContextItem {
  id?: string;
  name: string;
  type: 'text' | 'pdf' | 'image';
  content: string; // text or base64
  mimeType?: string;
  timestamp?: number;
}

export interface ForgeSystemResult {
  driver: Partial<GameDriver>;
  template: Partial<SheetTemplate>;
}

export class ForgeService {
  private static instance: ForgeService;

  public static getInstance(): ForgeService {
    if (!ForgeService.instance) {
      ForgeService.instance = new ForgeService();
    }
    return ForgeService.instance;
  }

  /**
   * Generates a complete, cohesive system (Driver + Template) from multiple sources.
   */
  public async forgeSystem(items: ForgeContextItem[], userInstructions?: string, targetName?: string): Promise<ForgeSystemResult> {
    const prompt = this.getSystemForgePrompt(userInstructions, targetName);
    const aiService = AIService.getInstance();
    const { activeProvider } = useAIStore.getState();

    // 1. PRÉPARATION DU CONTENU (Capé pour éviter les surcharges)
    let consolidatedText = "";
    const attachments: { data: string, mimeType: string }[] = [];
    const MAX_TEXT_CHARS = 100000;
    const MAX_ATTACHMENTS = 5;

    items.forEach(item => {
      if (item.type === 'text') {
        if (consolidatedText.length < MAX_TEXT_CHARS) {
          consolidatedText += `\n\nCONTENU DU DOCUMENT [${item.name}] :\n\n${item.content}`;
        }
      } else if (attachments.length < MAX_ATTACHMENTS) {
        attachments.push({
          data: item.content,
          mimeType: item.mimeType || 'application/pdf'
        });
      }
    });

    if (consolidatedText.length >= MAX_TEXT_CHARS) {
      console.warn("[ForgeService] Context text truncated to 100k chars.");
      consolidatedText = consolidatedText.substring(0, MAX_TEXT_CHARS) + "\n\n[TEXTE TRONQUÉ POUR SURCHARGE]";
    }

    // 2. VÉRIFICATION DE CAPACITÉ VISUELLE
    if (attachments.length > 0 && activeProvider !== 'gemini') {
      throw new Error("Gemma 4 ne supporte pas l'analyse visuelle de multiples fichiers. Veuillez utiliser NotebookLM pour extraire le texte au préalable.");
    }

    const fullPrompt = `${consolidatedText}\n\nINSTRUCTIONS FINALES : ${prompt}`;
    const systemPrompt = `Tu es l'ingénieur en chef de la Forge GM-OS, agissant en mode **🧠 SYSTEM ENGINEER**. 
    Tu dois générer EXCLUSIVEMENT un objet JSON valide suivant le schéma fourni. 
    Pas de texte avant, pas d'explications après. Si tu ne peux pas générer le système, renvoie un objet vide {}.`;

    console.error(`[ForgeService] Sending request to ${activeProvider} (LITE MODE: ON)...`);
    const result = await aiService.generateJSON<ForgeSystemResult>(fullPrompt, systemPrompt, attachments, { lite: true, sansPersona: true });
    console.error(`[ForgeService] ${activeProvider} responded!`);
    return result;
  }

  /**
   * Forge un pilote **depuis les fiches du corpus**, un groupe de champs à la fois.
   *
   * **Ce que cela remplace.** `forgeSystem` consolide jusqu'à 100 000 caractères
   * de livre et les envoie en un seul appel. Mesuré le 2026-08-12 : le budget
   * d'invite réel est d'environ 8 000 tokens, soit ~23 000 caractères — **77 %
   * étaient jetés en silence**, exactement comme le RAG avant sa réparation.
   *
   * Ici chaque groupe reçoit les deux ou trois fiches qui le concernent, soit
   * ~3 800 tokens : la moitié du budget. Et comme le décodage tourne à
   * 7,7 tok/s, six petites réponses coûtent moins qu'une grosse.
   *
   * **Un groupe qui échoue n'emporte pas les autres.** Une forge dure des
   * minutes ; perdre six groupes parce que le septième a rendu un JSON bancal
   * serait le pire des comportements. Les échecs sont collectés et rendus avec
   * le résultat partiel.
   *
   * **L'abandon est réel, et il se prend entre deux groupes.** Un bouton qui
   * cesserait d'afficher sans rien arrêter mentirait sur un quart d'heure
   * d'attente ; il n'y a en revanche aucun moyen d'interrompre une génération
   * déjà partie, donc la coupure attend la fin du groupe en cours — deux
   * minutes trente au pire — et ce qui est acquis est rendu.
   */
  public async forgeSystemDepuisCorpus(
    fiches: FicheDuCorpus[],
    options: {
      groupes?: readonly GroupeDeChamps[];
      onProgres?: (groupe: GroupeDeChamps, rang: number, total: number) => void;
      /** Consulté avant chaque groupe. Vrai : on s'arrête et on rend l'acquis. */
      abandonne?: () => boolean;
      /** Dossier de corpus visé — la seule source du nom du jeu. */
      corpus?: string;
      /**
       * Les fiches du **socle commun** — le SRD de la famille, s'il y en a un.
       *
       * Elles ne servent qu'aux groupes dont le corpus du jeu ne dit **rien**.
       * Le jeu l'emporte toujours : Alien modifie YZE, et une famille qui
       * prendrait le dessus rendrait un pilote générique et faux — pire qu'un
       * pilote incomplet, puisqu'un manque se voit à la revue et qu'une valeur
       * plausible se joue en séance.
       */
      fichesDeLaFamille?: FicheDuCorpus[];
    } = {},
  ): Promise<{
    resultat: FragmentDePilote;
    echecs: { groupe: string; raison: string }[];
    /** Les groupes que le corpus du jeu ne couvrait pas et que la famille a nourris. */
    comblements: { groupe: string }[];
    interrompue: boolean;
  }> {
    const groupes = options.groupes ?? GROUPES;
    const aiService = AIService.getInstance();
    const fragments: FragmentDePilote[] = [];
    const echecs: { groupe: string; raison: string }[] = [];
    const comblements: { groupe: string }[] = [];
    let interrompue = false;

    const systemPrompt =
      "Tu es l'ingénieur en chef de la Forge GM-OS. Tu rends EXCLUSIVEMENT un objet " +
      'JSON compact et valide, sans texte avant ni après. Si les fiches ne permettent ' +
      'pas de répondre, rends un objet vide {}.';

    for (const [rang, groupe] of groupes.entries()) {
      if (options.abandonne?.()) {
        interrompue = true;
        // Les groupes non traités sont des lacunes comme les autres : le
        // journal doit dire qu'ils manquent, pas laisser croire qu'ils sont
        // couverts.
        for (const restant of groupes.slice(rang)) {
          echecs.push({ groupe: restant.id, raison: 'dérivation interrompue avant ce groupe' });
        }
        break;
      }

      options.onProgres?.(groupe, rang + 1, groupes.length);

      /*
        **Le jeu d'abord, la famille seulement s'il ne dit rien.**

        Un groupe sans aucune fiche ne part pas : l'appel coûterait des minutes
        pour que le modèle comble un vide, ce qui est précisément l'inverse du
        but. Mais le corpus du jeu n'est pas la seule source depuis qu'un socle
        commun peut être désigné — le SRD Year Zero Engine porte la mécanique de
        poussée, que le corpus d'Alien n'a qu'en v1 hors canevas.

        `sourceDuGroupe` ne mélange jamais les deux : additionner les fiches
        ferait cohabiter la description générique et celle du jeu dans une même
        invite, et le modèle trancherait au hasard.
      */
      const source = sourceDuGroupe(groupe, fiches, options.fichesDeLaFamille ?? []);
      if (source.fiches.length === 0) {
        echecs.push({ groupe: groupe.id, raison: 'aucune fiche du corpus ne couvre ce sujet' });
        continue;
      }
      // Un comblement n'est pas un échec, mais il n'est pas non plus un succès
      // ordinaire : il se dit, pour qu'un humain juge si le socle vaut ici.
      if (source.venuDeLaFamille) comblements.push({ groupe: groupe.id });

      try {
        /*
          **Le vocabulaire acquis voyage avec l'invite.** Cinq groupes désignent
          des sections, des champs ou des réserves que seuls `fiche` et
          `ressources` inventent ; forgés dans l'ignorance les uns des autres,
          ils ne pouvaient que fabriquer un identifiant plausible. Sur la
          première dérivation de Dune, *aucune* référence croisée n'a abouti.

          On le recalcule à chaque tour plutôt qu'une fois : un groupe peut
          échouer, et le vocabulaire doit refléter ce qui existe vraiment.
        */
        const fragment = await aiService.generateJSON<FragmentDePilote>(
          // On passe les fiches que `sourceDuGroupe` a retenues, jamais le
          // corpus entier : c'est ce choix-là qui garantit qu'on n'envoie pas
          // le socle et le jeu dans la même invite.
          promptDuGroupe(groupe, source.fiches, {
            vocabulaire: vocabulaireAcquis(fusionnerFragments(fragments)),
            corpus: options.corpus,
            venuDeLaFamille: source.venuDeLaFamille,
          }),
          systemPrompt,
          [],
          { lite: true, sansPersona: true },
        );
        if (fragment && Object.keys(fragment).length > 0) fragments.push(fragment);
        else echecs.push({ groupe: groupe.id, raison: 'le modèle a rendu un objet vide' });
      } catch (erreur) {
        echecs.push({ groupe: groupe.id, raison: erreur instanceof Error ? erreur.message : String(erreur) });
      }
    }

    return { resultat: fusionnerFragments(fragments), echecs, comblements, interrompue };
  }

  private getSystemForgePrompt(userInstructions?: string, targetName?: string): string {
    return `
      Tu es l'ingénieur en chef de la Forge GM-OS, agissant en mode **🧠 SYSTEM ENGINEER (End-to-End Generation)**.
      Ton objectif est de créer un système de jeu complet et cohérent (Driver + Fiche) à partir des documents fournis.

      ${targetName ? `MODE ENRICHISSEMENT : L'utilisateur souhaite améliorer le système existant nommé "${targetName}". Appuie-toi sur les bases de ce système pour l'étendre ou l'affiner. Ne réinvente rien qui soit déjà défini, enrichis-le.` : 'MODE CRÉATION : Génère un nouveau système complet.'}

      ${userInstructions ? `CONSIGNES UTILISATEUR PRIORITAIRES : "${userInstructions}"` : ''}

      Tu dois produire un JSON unique contenant deux objets : "driver" et "template".

      RÈGLE PREMIÈRE, AVANT TOUTES LES AUTRES :
      N'INVENTE RIEN. Si les documents ne disent pas comment fonctionne une
      mécanique, OMETS le champ correspondant. Un champ absent se corrige ; un
      champ inventé s'applique en séance sans que personne ne l'ait choisi, et
      rien ne le signale. Ne comble jamais par analogie avec un autre jeu.

      CE QUE TOUS LES JEUX N'ONT PAS :
      - Beaucoup de jeux n'ont AUCUNE jauge de points de vie. Dans ce cas,
        n'invente pas de champ "hp", ne marque aucune stat "isMainHP", et
        décris la manière dont le jeu résout la mise hors de combat.
      - Beaucoup de jeux n'ordonnent PAS leurs combattants. Si l'initiative
        alterne entre camps ou se tire par cartes, ne fabrique pas de formule.
      - Certains jeux ont des réserves partagées par toute la table (élan,
        menace, jetons). Elles ne sont PAS des champs de fiche.

      RÈGLES DE COHÉRENCE CRITIQUES :
      1. Les IDs des stats dans "driver.combat.statsToTrack" DOIVENT correspondre exactement aux IDs des champs dans "template.sections[].fields[]".
      2. Idem pour "ui_config.gauges[].fieldId", pour "jet.seuil[].sectionId" (qui vise une SECTION du template) et pour "combat.tacheDeDefaite.sectionDuSeuil".
      3. Une formule d'initiative, si tu en produis une, ne doit utiliser que des IDs de champs définis dans le template.
      4. Le "dice.logic" doit être choisi parmi : 'sum', 'highest', 'lowest', 'count-success', 'd100-low', 'd100-high'.
      5. Si "jet.reserve.ressource" est renseigné, la réserve nommée DOIT exister dans "driver.ressourcesDeTable".
      6. Génère un "ui_config" cohérent avec l'ambiance :
         - Style 'bar' pour du médieval-fantastique classique.
         - Style 'neon' pour du Cyberpunk / SF.
         - Style 'segmented' pour du rétro, horreur ou systèmes à "boxes".
         - Choisis des couleurs (hex ou classes Tailwind "bg-...") adaptées (ex: vert néon pour Cyberpunk, or pour Fantasy, rouge sang pour Horreur).

      EXEMPLE DE SORTIE — c'est un système RÉEL, sans aucun point de vie.
      Il montre la FORME attendue, pas les valeurs à recopier : ton système aura
      d'autres champs, d'autres réserves, et peut-être bien des points de vie.
      {
        "driver": {
          "name": "Dune : Aventures dans l'Imperium",
          "description": "Système 2d20. Le seuil d'un test est la somme d'une compétence et d'un principe ; chaque dé sous ce seuil est une réussite.",
          "emoji": "🏜️",
          "dice": { "defaultDice": "2d20", "logic": "count-success", "engine": "2d20" },
          "jet": {
            "seuil": [
              { "id": "competence", "label": "Compétence", "sectionId": "competences" },
              { "id": "principe", "label": "Principe", "sectionId": "principes" }
            ],
            "reserve": { "base": 2, "max": 5, "faces": 20, "cout": [1, 2, 3], "ressource": "impulsion" },
            "sens": "sous-ou-egal",
            "critique": 1,
            "complication": 20,
            "difficulte": { "min": 0, "max": 5, "defaut": 1 }
          },
          "ressourcesDeTable": [
            { "id": "impulsion", "label": "Impulsion", "proprietaire": "joueurs", "depart": 0, "min": 0, "max": 6, "erosionFinDeScene": 1, "reportSurEpuisement": "menace" },
            { "id": "menace", "label": "Menace", "proprietaire": "meneur", "depart": 0, "min": 0 }
          ],
          "combat": {
            "statsToTrack": [ { "fieldId": "determination", "label": "Détermination", "isMainHP": false, "isResource": true } ],
            "initiativeFormula": "",
            "initiative": {
              "mode": "alternance",
              "coutDeRetention": { "montant": 2, "ressource": "impulsion" },
              "coutDOuverture": { "montant": 2, "ressource": "impulsion" },
              "activationsConsecutivesMax": 2
            },
            "defaultHealthType": "clocks",
            "tacheDeDefaite": {
              "sectionDuSeuil": "competences",
              "champParDefaut": "combat",
              "seuil": { "min": 4, "max": 8 },
              "progressionDeBase": 2,
              "qualiteMax": 4,
              "label": "Défaite"
            }
          },
          "ui_config": {
            "gauges": [ { "fieldId": "determination", "label": "Détermination", "color": "#d97706", "style": "segmented" } ],
            "initiativeStyle": "list",
            "themeColor": "#d97706"
          }
        },
        "template": {
          "name": "Fiche de Personnage",
          "emoji": "📜",
          "sections": [
            {
              "id": "competences",
              "label": "Compétences",
              "fields": [
                { "id": "combat", "label": "Combat", "type": "number", "defaultValue": 4, "max": 8 },
                { "id": "mobilite", "label": "Mobilité", "type": "number", "defaultValue": 4, "max": 8 }
              ]
            },
            {
              "id": "principes",
              "label": "Principes",
              "fields": [
                { "id": "devoir", "label": "Devoir", "type": "number", "defaultValue": 4, "max": 8 },
                { "id": "justice", "label": "Justice", "type": "number", "defaultValue": 4, "max": 8 }
              ]
            }
          ]
        }
      }
    `;
  }

  /**
   * Generates a GameDriver from a rulebook Text using Gemini 1.5 Pro.
   */
  public async analyzeRulebookText(text: string, userInstructions?: string): Promise<Partial<GameDriver>> {
    const prompt = this.getRulebookPrompt(userInstructions);
    return (await this.callForgeAI(prompt, undefined, undefined, text)) as Partial<GameDriver>;
  }

  private getRulebookPrompt(userInstructions?: string): string {
    return `
      Tu es l'ingénieur en chef de la Forge GM-OS, agissant en mode **🧠 CERVEAU (Logic & Rules)**.
      Ton seul objectif est d'analyser ce document de règles de jeu de rôle pour en extraire la logique système pure.
      Ignore la mise en page visuelle et concentre-toi sur les mécaniques, les dés et les statistiques de combat.
      Le document peut être du texte brut, du Markdown, ou du JSON/JSONL contenant des données de règles.

      ${userInstructions ? `INSTRUCTIONS SPÉCIFIQUES DE L'UTILISATEUR (À RESPECTER EN PRIORITÉ) :
      "${userInstructions}"
      ` : ''}

      Instructions critiques :
      1. Identifie le nom du système, l'auteur et l'ambiance.
      2. Analyse les mécaniques de dés (ex: 1d20 + bonus vs DC, ou d100 sous compétence).
      3. Détermine quels champs de fiche de personnage sont essentiels pour le combat (HP, MP, Initiative).
      4. Rédige des "aiInstructions" courtes mais précises pour qu'un autre assistant puisse simuler ce MJ.
      5. Ajoute un "ui_config" esthétique :
         - 'neon' (Cyberpunk/SF), 'bar' (Fantasy), 'segmented' (Retro/Grips).
         - Couleurs vibrantes adaptées à l'ambiance.

      Format de sortie JSON obligatoire :
      {
        "name": "Nom du Système",
        "description": "Courte description",
        "emoji": "🎲",
        "dice": {
          "defaultDice": "1d20",
          "logic": "sum | highest | d100-low",
          "critRange": 20
        },
          "combat": {
            "statsToTrack": [
              { "fieldId": "hp", "label": "Points de Vie", "isMainHP": true, "isResource": false }
            ],
            "initiativeFormula": "dex",
            "defaultHealthType": "hp | clocks | anatomy"
          },
        "ui_config": {
          "gauges": [
            { "fieldId": "hp", "label": "PV", "color": "bg-red-500", "style": "bar" }
          ],
          "initiativeStyle": "list"
        },
        "aiInstructions": "Tu es un MJ expert de [Système]..."
      }
    `;
  }

  /**
   * Generates a GameDriver from a rulebook PDF/Text using Gemini 1.5 Pro.
   */
  public async analyzeRulebook(fileBase64: string, mimeType: string, userInstructions?: string): Promise<Partial<GameDriver>> {
    const prompt = this.getRulebookPrompt(userInstructions);
    return (await this.callForgeAI(prompt, fileBase64, mimeType)) as Partial<GameDriver>;
  }

  private getSheetPrompt(userInstructions?: string): string {
    return `
      Tu es l'ingénieur en chef de la Forge GM-OS, agissant en mode **👕 CORPS (Layout & Fields)**.
      Ton rôle est d'analyser ce document pour générer une structure de template de fiche (UI) GM-OS v5.
      Ignore les règles complexes de calcul de dés et concentre-toi sur l'extraction tous les champs (nom, caractéristiques, compétences, inventaire) à regrouper par sections logiques.
      Si le document est en JSON/JSONL, sers-toi de la structure existante pour nommer précisément les champs.

      ${userInstructions ? `INSTRUCTIONS SPÉCIFIQUES DE L'UTILISATEUR (À RESPECTER EN PRIORITÉ) :
      "${userInstructions}"
      ` : ''}

      Format de sortie JSON obligatoire :
      {
        "name": "Nom du Template",
        "emoji": "📜",
        "sections": [
          {
            "id": "identite",
            "label": "Identité",
            "fields": [
              { "id": "nom", "label": "Nom", "type": "text", "defaultValue": "" },
              { "id": "force", "label": "Force", "type": "number", "defaultValue": 10 }
            ]
          }
        ]
      }
    `;
  }

  /**
   * Generates a Character Sheet Template from an image/PDF.
   */
  public async analyzeCharacterSheet(fileBase64: string, mimeType: string, userInstructions?: string): Promise<Partial<SheetTemplate>> {
    const prompt = this.getSheetPrompt(userInstructions);
    return (await this.callForgeAI(prompt, fileBase64, mimeType)) as Partial<SheetTemplate>;
  }

  public async analyzeCharacterSheetText(text: string, userInstructions?: string): Promise<Partial<SheetTemplate>> {
    const prompt = this.getSheetPrompt(userInstructions);
    return (await this.callForgeAI(prompt, undefined, undefined, text)) as Partial<SheetTemplate>;
  }

  private async callForgeAI(prompt: string, fileBase64?: string, mimeType?: string, rawText?: string): Promise<unknown> {
    const aiService = AIService.getInstance();
    const { activeProvider } = useAIStore.getState();

    // 1. CAS TEXTE PUR (OU TEXTE EXTRAIT PAR NOTEBOOKLM)
    if (rawText) {
      const fullPrompt = `CONTENU DU DOCUMENT À ANALYSER :\n\n${rawText}\n\nREQUÊTE : ${prompt}`;
      console.error(`[ForgeService] Analyzing text with ${activeProvider} (LITE MODE)...`);
      return aiService.generateJSON(fullPrompt, "Tu es un expert en ingénierie de données JdR pour GM-OS. Réponds UNIQUEMENT en JSON pur.", [], { lite: true, sansPersona: true });
    }

    // 2. CAS DOCUMENT DIRECT (PDF/IMAGE)
    if (fileBase64 && mimeType) {
      // Si on n'est pas sur Gemini, la vision directe n'est pas supportée
      if (activeProvider !== 'gemini') {
        throw new Error("L'analyse visuelle directe n'est supportée que par Gemini. Veuillez utiliser NotebookLM pour extraire le texte.");
      }

      console.error(`[ForgeService] Analyzing visual document with Gemini (LITE MODE)...`);
      return aiService.generateJSON(prompt, "Tu es un expert en analyse de documents JdR. Extrais les données structurées UNIQUEMENT en JSON.", [{
        data: fileBase64,
        mimeType: mimeType
      }], { lite: true, sansPersona: true });
    }

    throw new Error("Aucun contenu fourni pour l'analyse.");
  }

  /** Une requête au carnet, filtrée sur les sources retenues. */
  private async interrogerCarnet(notebookId: string, query: string, sourceIds?: string[]): Promise<string> {
    const result = await this.callMcpTool<{ content: string }>('notebooklm-mcp-server', 'notebook_query', {
      notebook_id: notebookId,
      query,
      // Une liste vide n'est pas « pas de filtre » : selon le serveur, elle peut
      // se lire « ne retiens aucune source ». On omet la clé plutôt que de
      // laisser l'ambiguïté décider — c'est le carnet entier qui est visé quand
      // l'utilisateur n'a rien coché.
      ...(sourceIds && sourceIds.length > 0 ? { source_ids: sourceIds } : {})
    });

    if (!result?.content) throw new Error("Réponse vide de NotebookLM");
    return result.content;
  }

  /**
   * Étape 1 — l'inventaire des treize sujets du canevas (gabarit 1).
   *
   * **La liste des sujets est fournie, jamais demandée.** La v0 demandait
   * « 5 à 8 éléments intéressants à formaliser » : c'est exactement le « et
   * autres » qui fait dériver la taxonomie d'un jeu à l'autre, et sans taxonomie
   * commune deux systèmes ne se comparent plus.
   *
   * Rend toujours les treize sujets, plus les mécaniques hors catégories que le
   * carnet signale. Un sujet que le carnet a omis reste dans la liste : c'est
   * son absence qu'il faut voir.
   */
  public async discoverCandidates(notebookId: string, sourceIds?: string[]): Promise<InventaireForge> {
    const contenu = await this.interrogerCarnet(notebookId, gabaritInventaire(), sourceIds);
    const candidats = lireInventaire(contenu).map(entree => ({
      id: slugFiche(entree.sujet),
      title: entree.sujet,
      category: 'rule' as const,
      summary: entree.lu
        ? entree.mecanique || 'Le carnet n\'a pas résumé la mécanique.'
        : "Le carnet n'a rien rendu sur ce sujet — à interroger pour lever le doute.",
      tags: [
        // Un sujet dont le carnet n'a rien dit n'est pas « partiellement
        // traité » : c'est une absence de réponse, et elle doit se voir. Sans
        // cette distinction, l'inventaire annoncait « 13 sujets sur 13 traites »
        // sur une reponse qui n'en couvrait aucun.
        entree.lu ? entree.traite : 'sans reponse',
        ...(entree.horsCanevas ? ['hors canevas'] : []),
        ...entree.sections.slice(0, 3),
      ],
    }));

    // Le markdown brut repart avec la liste : c'est la synthèse du système, un
    // livrable a part entiere que la procedure prescrit d'enregistrer. On le
    // jetait jusqu'ici pour n'en garder que les titres de sujets.
    return { candidats, inventaire: contenu };
  }

  /**
   * Étape 2 — une fiche par sujet (gabarit 2), convertie localement.
   *
   * La v0 demandait « du Markdown riche, structuré » : ni les six sections, ni
   * l'interdiction d'inventer, ni les valeurs en clair. Sans l'interdiction, un
   * sujet non couvert produit du générique plausible — c'est la ligne la plus
   * rentable du gabarit.
   *
   * La conversion en frontmatter se fait **ici et pas dans le carnet** : on lui
   * a demandé du YAML, il a pris les `---` pour un séparateur.
   */
  public async forgeCard(
    notebookId: string,
    candidate: BrainstormCandidate,
    systemId: string,
    sourceIds?: string[],
    options?: OptionsForgeFiche,
  ): Promise<BrainstormCard> {
    // Première moitié : la règle et ses valeurs. Elle porte les métadonnées, donc
    // elle suffit à classer la fiche même si la seconde échoue.
    const regle = options?.moitieDeja
      ?? await this.interrogerCarnet(notebookId, gabaritFicheRegle(candidate.title), sourceIds);

    // On la remet à l'appelant AVANT la seconde requête : une moitié acquise ne
    // doit pas dépendre du sort de l'autre. Le gabarit entier dépassait le délai
    // du serveur à 356 secondes — c'est précisément ce qu'on évite en scindant.
    options?.surMoitie?.(regle);

    const pratique = await this.interrogerCarnet(notebookId, gabaritFichePratique(candidate.title), sourceIds);

    const contenu = `${regle.trim()}

${pratique.trim()}`;
    const fiche = convertirFiche(contenu, { systeme: systemId, sujetDemande: candidate.title });

    return {
      ...candidate,
      id: fiche.slug,
      title: fiche.sujet || candidate.title,
      content: fiche.markdown,
      systemId,
      forgedAt: Date.now(),
      slug: fiche.slug,
      sections: fiche.sections,
      avertissements: fiche.avertissements
    };
  }

  /**
   * Étape 5 — la fiche de voix puis les huit personas (prompts A et B).
   *
   * **Les deux requêtes s'enchaînent dans la même conversation** : B s'appuie
   * sur la fiche de voix que A vient de produire. Le carnet ne garde pas les
   * conversations, donc rien ne rattrape un enchaînement rompu — d'où le
   * séquencement strict, sans parallélisation.
   *
   * N'écrit rien : le chemin d'écriture (`corpusSysteme.cheminDesPersonas`) appartient à
   * l'appelant, qui montre d'abord et enregistre ensuite.
   */
  public async forgePersonas(notebookId: string, sourceIds?: string[]): Promise<ForgePersonasResult> {
    const voix = await this.interrogerCarnet(notebookId, promptVoix(), sourceIds);
    const brut = await this.interrogerCarnet(notebookId, promptPersonas(), sourceIds);
    const { personas, ignorees } = extrairePersonas(brut);

    const avertissements = controlerPersonas(personas);
    if (ignorees.length > 0) {
      avertissements.push(`Clés rendues en trop, qu'AIService n'ira jamais lire : ${ignorees.join(', ')}.`);
    }

    return { voix: voix.trim(), personas, avertissements };
  }

  /**
   * Encapsulates MCP tool calls with retry logic for authentication.
   * Centralizes Bridge usage for the Forge module.
   */
  public async callMcpTool<T = unknown>(serverName: string, toolName: string, args: Record<string, unknown>): Promise<T> {
    const bridge = window.appBridge;
    if (!bridge?.mcp?.callTool) {
      throw new Error("Bridge MCP not available");
    }
    
    const mcpBridge = bridge.mcp;

    const isAuthError = estErreurAuth;

    const TIMEOUT_MS = 600000; // 10 minutes

    const callWithTimeout = async (name: string, tool: string, a: any) => {
      return Promise.race([
        mcpBridge.callTool(name, tool, a),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`MCP_TIMEOUT: ${name}.${tool} non répondu après 10min.`)), TIMEOUT_MS)
        )
      ]);
    };

    try {
      console.log(`[ForgeService] Calling MCP Tool: ${serverName}.${toolName}`, args);
      const result = await callWithTimeout(serverName, toolName, args);
      
      if (isAuthError(result)) {
        console.warn(`[ForgeService] Auth error detected in result, attempting refresh...`);
        try {
          await callWithTimeout('notebooklm-mcp-server', 'refresh_auth', {});
          await new Promise(resolve => setTimeout(resolve, 2500));
          await callWithTimeout('notebooklm-mcp-server', 'healthcheck', {}).catch(() => {});
        } catch (e) {
          console.warn("[ForgeService] Silent refresh failed", e);
        }
        
        const retryResult = await callWithTimeout(serverName, toolName, args);
        if (isAuthError(retryResult)) {
          throw new Error("MCP_AUTH_EXPIRED: Still expired after refresh.");
        }
        return retryResult as unknown as T;
      }
      
      return result as unknown as T;
    } catch (err: unknown) {
      if (isAuthError(err)) {
        console.warn(`[ForgeService] Auth error detected in catch, attempting refresh...`);
        try {
          await callWithTimeout('notebooklm-mcp-server', 'refresh_auth', {});
          await new Promise(resolve => setTimeout(resolve, 2500));
          await callWithTimeout('notebooklm-mcp-server', 'healthcheck', {}).catch(() => {});
          return await callWithTimeout(serverName, toolName, args) as unknown as T;
        } catch (retryErr) {
          throw new Error("MCP_AUTH_EXPIRED: Recovery failed.");
        }
      }
      throw err;
    }
  }
}

export const forgeService = ForgeService.getInstance();
