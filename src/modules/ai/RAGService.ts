/** RAG Service — Document Management */
import { useSessionOSStore } from '../session/useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';
import { resoudreCorpus } from '../../../electron/corpusSysteme';

export type DocEntry = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: DocEntry[];
};

export class RAGService {
  private static instance: RAGService;
  private cache: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Scans the docs directory and returns relevant content based on active session.
   * Leverages the dynamic backend RAG Engine.
   *
   * `query` est la question posée. Sans elle, le moteur ne peut trier que par
   * système, et le choix des fiches à l'intérieur d'un corpus reste arbitraire.
   */
  /**
   * Les fiches retenues au dernier appel, et leur état de relecture.
   *
   * **Pourquoi un état plutôt qu'un retour.** `getRelevantContext` rend une
   * chaîne, et deux appelants la consomment comme telle depuis des mois ; en
   * faire un objet obligerait à les toucher pour un besoin qui n'est pas le
   * leur. Le meneur, lui, veut savoir d'où vient LA réponse qu'il lit — donc
   * celles du dernier appel, relevées juste après.
   *
   * *À ne pas lire ailleurs qu'immédiatement après un appel* : deux questions
   * concurrentes se marcheraient dessus, et c'est pourquoi seul le chemin qui
   * les a demandées s'en sert.
   */
  /**
   * Le **corpus retenu** au dernier appel — `reves de dragons`, et non
   * `custom-1777730495114`.
   *
   * *Cinquième champ qui devait passer par `resoudreCorpus` et n'y passait pas.*
   * L'écran donnait l'identifiant du pilote à la recherche dans le livre, qui
   * cherchait donc `docs/systems/custom-1777730495114/index` : **« Le livre en
   * parle » n'a jamais rien affiché pour une campagne forgée**, sans un mot.
   *
   * Résolu ici, une seule fois, et relu par qui en a besoin — plutôt que
   * re-déduit ailleurs, ce qui est la façon dont les quatre premiers se sont
   * trompés.
   */
  public dernierCorpus: string | undefined = undefined;

  public dernieresSources: { path: string; relu?: boolean; aRegenerer?: boolean; provenance: string; sujet?: string }[] | undefined = [];

  public async getRelevantContext(options: { systemOnly?: boolean; systemName?: string; limit?: number; query?: string } = {}): Promise<string> {
    const osStore = useSessionOSStore.getState();

    /*
      **La racine du corpus ne se negocie pas — et elle se negociait a chaque
      question.**

      Ces quatre lignes appelaient `reindex(vaultPath)` avant toute recherche, et
      `ai:reindex` appelle `setDocsPath` : le coffre Obsidian REMPLACAIT la
      racine documentaire du moteur. Tout `docs/` sortait de l'index — le corpus,
      les campagnes, `.ragignore` — et il n'en restait rien a retenir.

      Le coffre etait renseigne par defaut, en dur, dans `useObsidianStore` :
      personne n'avait a le demander pour que ca arrive.

      **Deux arbres, une seule variable de racine, le dernier ecrivain gagne** —
      le meme motif que partout ailleurs. Et il etait indetectable : l'Oracle
      repondait de sa propre memoire, avec aplomb.

      Le coffre reste lisible : `obsidian.listNotes` et `obsidian.readNote`
      recoivent leur chemin en argument et n'ont jamais eu besoin de la racine du
      moteur. Le bouton de reindexation, lui, appelle `reindex()` SANS argument
      — il reindexe la racine, il ne la deplace pas.
    */

    if (options.systemOnly && options.systemName) {
      return this.getContextForSpecificSystem(options.systemName, options.limit);
    }

    const activeCampaign = osStore.campaigns.find(c => c.id === osStore.activeCampaignId);

    // L'identifiant nomme le dossier (`docs/systems/alien`), le nom affiché non.
    // On envoie les deux : le moteur essaie l'identifiant d'abord.
    const systemId = activeCampaign?.system || 'unknown';
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...osStore.customSheetTemplates];

    /*
      **Le pilote SAIT où vit son corpus, et le moteur l'ignorait.**

      Une campagne porte `system: 'custom-1777730495114'` — la Forge nomme ses
      pilotes de l'horodatage de leur naissance. Le moteur cherchait donc un
      dossier `docs/systems/custom-1777730495114`, qui n'existe pas, et retombait
      sur le nom affiché… qu'il allait chercher dans les GABARITS DE FICHE, où un
      pilote forgé n'a rien à faire. Les deux échouaient, et **aucune fiche du
      corpus n'a jamais été retenue pour une campagne forgée.**

      Rien ne le signalait : l'Oracle répondait de sa propre mémoire, avec
      aplomb, et la réponse était souvent plausible. *Une recherche qui n'atteint
      rien produit tout de même une réponse confiante.*

      `resoudreCorpus` existe depuis le 2026-08-10 et porte l'ordre d'autorité
      complet — chemin de campagne, `corpusId` déclaré, `ragPath` hérité,
      identifiant, nom affiché. Quatrième champ déclaré qu'un moteur n'allait pas
      lire, et le plus coûteux : il coupait l'Oracle de tout le corpus.
    */
    const pilote = osStore.customGameDrivers?.find(d => d.id === systemId);
    const systemName = pilote?.name ?? allTemplates.find(t => t.id === systemId)?.name;

    /*
      **`listSystems` et non `listDir`** : le second ne rend que des FICHIERS
      (`e.isFile()`), donc il aurait rendu une liste vide et le rapprochement par
      nom affiché serait resté impossible — un correctif qui aurait eu l'air de
      marcher. Le premier existe précisément pour ça.
    */
    const dossiersSystemes = await window.appBridge?.ai?.listSystems?.()
        .catch(() => [] as string[]) ?? [];

    const corpus = resoudreCorpus({
        systemId,
        systemName,
        systemPath: activeCampaign?.systemPath,
        corpusId: pilote?.corpusId,
        ragPath: pilote?.ragPath,
        dossiersConnus: dossiersSystemes,
    });

    /*
      **Dire quel corpus on a retenu, et par quoi.** Trois essais de David sont
      passés à côté de la cause faute de pouvoir l'observer : la recherche
      échouait en silence, et l'Oracle répondait quand même. *Un fichier se relit
      après coup, par n'importe qui* — c'est la règle du journal d'Ollama, et
      elle vaut ici.
    */
    /*
      **La racine, et pas seulement le nom du corpus.** La premiere redaction de
      cette ligne n'annoncait que l'identifiant : le 2026-08-22 elle disait donc
      « reves de dragons » — la bonne reponse — alors que la racine valait
      `reves de dragons` sans `systems/` et que la recherche ne retenait rien.
      *Un journal qui n'imprime pas le champ dont depend le resultat coute un
      aller-retour de plus qu'un silence, parce qu'il innocente a tort.*
    */
    console.info(
        `[RAG Service] corpus « ${corpus.id} » → docs/${corpus.racine}`
        + ` (${corpus.raison}) pour le système ${systemId}`
        + `${systemName ? ` — « ${systemName} »` : ''}.`,
    );
    // Le dossier resolu n'existe pas parmi ceux du disque : la recherche ne
    // retiendra rien, et il vaut mieux le dire avant la reponse qu'apres.
    if (corpus.aCreer) {
        console.warn(
            `[RAG Service] le dossier docs/${corpus.racine} ne figure pas parmi les`
            + ` corpus connus — aucune fiche ne sera retenue. Vus sous la racine :`
            + ` ${dossiersSystemes.join(', ') || '(aucun dossier)'}.`,
        );
    }
    this.dernierCorpus = corpus.id;
    const campaignName = activeCampaign?.name || 'unknown';

    if (!window.appBridge?.ai?.searchContext) {
        console.error("[RAG Service] Bridge searchContext not available.");
        return "";
    }

    try {
        const context = await window.appBridge.ai.searchContext(systemId, campaignName, {
            query: options.query,
            systemName,
            // « Chemin des Règles » et « Chemin des Notes » de la fiche de campagne.
            // Ils étaient saisissables et enregistrés depuis toujours, mais leur
            // unique lecteur était resté en commentaire : rien ne les lisait.
            /*
              **Le chemin déclaré reste souverain ; sinon, celui qu'on a résolu.**
              `resoudreCorpus` le met déjà en tête de son ordre d'autorité, donc
              lui repasser sa propre réponse ne peut pas contredire le meneur.
            */
            systemPath: corpus.racine,
            campaignPath: activeCampaign?.campaignPath,
        });

        /*
          **Les fiches qui ont répondu sont retenues ici**, pour que l'écran
          puisse les nommer — et dire lesquelles n'ont jamais été relues. Elles
          voyagent à part du texte parce qu'elles ne s'adressent pas au même
          lecteur : le texte va au modèle, la liste va au meneur.
        */
        /*
          **Le pont peut rendre l'ANCIENNE forme, et il faut le survivre.**

          `electron/` ne se recharge pas avec Ctrl+R : après une modification du
          processus principal, l'application tourne avec le nouveau renderer et
          l'ancien moteur, qui rend une CHAÎNE au lieu d'un objet. Lire
          `context.context` sur une chaîne donne `undefined` — donc **aucun
          contexte du tout**, et l'Oracle répondait sans son corpus pendant que
          l'écran annonçait « jugement de table » sur chaque question.

          *Une incompatibilité de version qui se traduit par un silence est le
          pire des deux mondes* : rien ne casse, tout se dégrade. On accepte donc
          les deux formes, et on dit ce qui manque.
        */
        if (typeof context === 'string') {
            console.warn(
                '[RAG Service] Le pont a rendu l’ancienne forme (une chaîne) : '
                + 'le processus principal n’a pas été redémarré. Le contexte est '
                + 'utilisé, mais les sources restent inconnues.',
            );
            // **Inconnues, et non vides.** Une liste absente n'est pas une liste
            // vide : la dire vide ferait annoncer « aucune source » à des
            // réponses parfaitement sourcées.
            this.dernieresSources = undefined;
            return context || "";
        }

        this.dernieresSources = context?.sources ?? [];
        return context?.context || "";
    } catch (error) {
        console.error("[RAG Service] Search error:", error);
        return "";
    }
  }

  // `getContextFromExplicitPaths` vivait ici, en commentaire : c'était l'unique
  // lecteur de `campaign.systemPath` / `campaign.campaignPath`. Les deux champs
  // sont saisissables dans la fiche de campagne (« Chemin des Règles », « Chemin
  // des Notes ») et enregistrés, mais désactivés côté lecture — un cas de plus
  // du cadre qui déclare et du moteur qui ignore. Ils sont désormais transmis
  // au moteur par `getRelevantContext`, qui les traite comme périmètre prioritaire.

  private async readFolderRecursive(entry: DocEntry): Promise<string> {
    let content = '';
    const MAX_DOC_SIZE = 8000; // Limit context per file to avoid 429
    
    if (entry.type === 'file') {
      const ext = entry.extension?.toLowerCase();
      
      if (ext === '.md' || ext === '.txt') {
        const text = await window.appBridge?.ai?.readDoc?.(entry.path);
        if (text) {
          const truncated = text.length > MAX_DOC_SIZE ? text.substring(0, MAX_DOC_SIZE) + "..." : text;
          return `[Fichier Markdown: ${entry.name}]\n${truncated}\n`;
        }
      } 
      else if (ext === '.pdf') {
        // Use the new extract-pdf bridge
        const text = await window.appBridge?.ai?.extractPdf?.(entry.path);
        if (text) {
          const truncated = text.length > MAX_DOC_SIZE ? text.substring(0, MAX_DOC_SIZE) + "..." : text;
          return `[Fichier PDF: ${entry.name}]\n${truncated}\n`;
        }
      }
    }

    if (entry.children) {
      for (const child of entry.children) {
        content += await this.readFolderRecursive(child);
      }
    }

    return content;
  }

  /**
   * Used specifically for the AI Generator to fetch a system's rules
   */
  public async getContextForSpecificSystem(systemName: string, limit?: number): Promise<string> {
    console.log(`[RAG Service] Fetching raw context for system generation: ${systemName} (limit: ${limit || 'none'})`);
    if (!window.appBridge?.ai?.listDocs) return "";
    const docs = await window.appBridge.ai.listDocs() as DocEntry[];
    const contents: string[] = [];
    const target = systemName.toLowerCase();

    const searchRecursive = async (items: DocEntry[], isInsideTargetRoot = false) => {
      for (const item of items) {
        if (limit && contents.length >= limit) break; // Respect the limit
        
        const itemName = item.name.toLowerCase();
        // Match if directory name contains target or target contains directory name (e.g. "D&D" vs "dnd-5e" might be tricky, but "cyberpunk" vs "cyberpunk-red" works)
        const matchesName = itemName.includes(target) || target.includes(itemName);
        
        if (item.type === 'directory') {
           if (itemName === 'systems' || matchesName || isInsideTargetRoot) {
              await searchRecursive(item.children || [], matchesName || isInsideTargetRoot);
           }
        } else {
           const ext = item.extension?.toLowerCase();
           if ((ext === '.md' || ext === '.txt' || ext === '.pdf') && isInsideTargetRoot) {
              const text = await this.readFolderRecursive(item);
              if (text) contents.push(text);
           }
        }
      }
    };
    
    await searchRecursive(docs, false);
    return contents.join('\n\n');
  }

  public clearCache() {
    this.cache.clear();
  }
}

export const ragService = RAGService.getInstance();
