import { useAIStore } from '../../stores/useAIStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useJournalStore } from '../journal/useJournalStore';
import { lesDerniersEvenements } from '../journal/derniersEvenements';
import { useMediaStore } from '../../stores/useMediaStore';
import { ragService } from './RAGService';
import { genererViaCloudflare, octetsDeLImage } from './cloudflareImage';
import type { AIResponse, AIProvider } from './types';
import type { JournalEvent } from '../journal/types';
import { contexteEstVide, type ContexteDeCampagne } from '../journal/contexteDeCampagne';
import i18n from '../../i18n';
import { resoudreCorpus, cheminDesPersonas } from '../../../electron/corpusSysteme';
import { decrireLaSante } from '../combat/logic/SanteDuCombattant';

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
        inlineData?: {
          data: string;
          mimeType: string;
        };
      }[];
    };
  }[];
}

/**
 * Service central pour les interactions avec l'IA.
 * Gère plusieurs fournisseurs (Gemini, Anthropic, Ollama) et types de contenu (Texte, Image).
 */
/**
 * L'ordre des blocs d'une invite système — **le stable d'abord, le volatil
 * ensuite.**
 *
 * **Axe C.1 du plan du 2026-08-07, fait le 2026-08-21.** L'ordre était :
 *
 * ```
 * [persona — stable] → [CONTEXTE VIVANT — change à chaque tour]
 *                    → [RAG — stable et volumineux]
 * ```
 *
 * Or un modèle ne réutilise son cache que tant que **le début** de l'invite est
 * identique. Le bloc volatil — points de vie, round, tour — précédait le bloc
 * massif et stable : **dès qu'un PJ perdait un point de vie, tout le cache du
 * RAG était invalidé**, et le prefill des règles se repayait à chaque question
 * au lieu d'une fois par séance.
 *
 * C'est la cause la plus directe des temps de réponse signalés par David le
 * 2026-08-21 — *« les temps de réponse sont très longs »*.
 *
 * **Inverser ne change rien à ce que le modèle lit** : les deux blocs sont là,
 * nommés, dans la même invite. Cela change ce qu'il peut garder d'une question
 * à l'autre.
 *
 * `customContext` reste collé au RAG parce qu'il est de la même nature : un
 * contexte fourni par l'appelant, stable pour la durée de son geste.
 *
 * **Fonction pure et exportée pour une seule raison : que la règle se teste.**
 * Une inversion est invisible à la lecture d'un résultat — l'invite est correcte
 * dans les deux sens, seule sa réutilisabilité change. Un ordre qui se remet à
 * l'envers ne se plaindrait de rien.
 */
export function assemblerLeContexte(
    ragContext: string,
    customContext: string | undefined,
    liveContext: string,
): string {
    const stable = customContext ? `${customContext}

${ragContext}` : ragContext;
    return `--- CONTEXTE RAG (RÈGLES ET LORE) ---
${stable}

--- CONTEXTE VIVANT (SESSION ACTUELLE) ---
${liveContext}`;
}

/**
 * L'identité d'une requête au modèle — un nom unique, et ce qu'elle est.
 *
 * **Le libellé est ce qui compte.** Il ne sert pas au code, qui n'a besoin que
 * de l'identifiant pour annuler : il sert au meneur, à qui le panneau de
 * l'Oracle dira « Forge en cours depuis 3 min » plutôt que « une opération est
 * en cours ». Voir `useFileDAttente`.
 */
function identifierLaRequete(libelle?: string): { id: string; libelle: string } {
    return {
        id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        // Une attente mal nommée vaut mieux qu'une attente muette.
        libelle: libelle ?? 'Requête IA',
    };
}

export class AIService {
  private static instance: AIService;

  private constructor() {}

  /**
   * Récupère l'instance unique du AIService (Singleton).
   */
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Génère une réponse textuelle en utilisant le fournisseur actif.
   * Intègre automatiquement le contexte RAG et les instructions du Persona (Gem).
   * @param prompt Question ou consigne de l'utilisateur.
   * @param customContext Contexte additionnel optionnel.
   * @param gemId Identifiant du Gem (Persona AI) à utiliser.
   * @param ragOptions Options de filtrage pour le moteur RAG.
   * @returns Objet AIResponse contenant le texte et les métadonnées de génération.
   */
  public async generateText(
    prompt: string,
    customContext?: string,
    gemId: string = 'sage',
    ragOptions: { systemOnly?: boolean; systemName?: string } = {},
    lite?: boolean,
    /**
     * Vrai quand l'appelant attend du JSON.
     *
     * **L'information existait et n'allait nulle part.** `generateJSON` ajoutait
     * une consigne au prompt et espérait ; Ollama, lui, sait *contraindre* sa
     * sortie (`format: 'json'`) — mais rien ne le lui disait. Une consigne
     * s'ignore, une grammaire non.
     */
    attendJson: boolean = false,
    /**
     * N'enrobe pas l'invite — ni persona, ni contexte de session, ni RAG.
     *
     * **Ce que cela corrige, trouvé le 2026-08-12 en lisant enfin ce qui
     * partait.** `prepareSystemPrompt` ajoute à *tout* appel les instructions
     * de la gemme Sage, résolues depuis le corpus de la **campagne active**,
     * plus les personnages et PNJ de la séance en cours. La Forge construisait
     * donc une invite de 7 500 caractères, soignée et close, qui arrivait à
     * 13 577 — et le modèle, sommé d'incarner le Sage d'une autre campagne
     * pendant qu'on lui demandait d'extraire des données, commentait son
     * travail : « 100% accurate extraction from the source: ». Sous grammaire
     * JSON, ce commentaire n'avait qu'un endroit où aller — **dans une
     * chaîne** —, d'où les guillemets échappés qu'on poursuivait depuis trois
     * correctifs.
     *
     * C'est le même défaut que le corpus hérité de la campagne, corrigé le
     * 2026-08-10 : *un contexte hérité d'ailleurs reste un choix que personne
     * n'a fait.*
     *
     * Explicite, et jamais déduit de `attendJson` : le générateur de butin
     * demande délibérément le contexte vivant.
     */
    sansPersona: boolean = false,
    /**
     * La **forme exacte** imposée au décodeur, quand on la connaît.
     *
     * `format: 'json'` ne garantit que la syntaxe, et le 2026-08-12 a montré
     * trois fois que c'est une garantie faible : `{"id\":\"agilite\"` est une
     * chaîne parfaitement légale, un commentaire logé dans une chaîne aussi.
     * Un schéma, lui, interdit la clé de trop et la prose **par construction**.
     */
    schema?: Record<string, unknown>,
    /**
     * Le plafond de génération, quand l'appelant sait qu'il demande gros.
     *
     * **Mesuré le 2026-08-17 sur la Forge de campagne.** Le défaut de 2048
     * tokens tenait pour 143 réponses sur 144 — et le groupe `lieux` a été coupé
     * à 8 091 caractères. Son commentaire d'origine visait l'autre forge : *« un
     * fragment de pilote fait quelques centaines de tokens »*. Une forge qui rend
     * des LISTES n'a pas le même appétit, et personne ne pouvait le dire :
     * la valeur n'était réglable nulle part.
     */
    plafondDeGeneration?: number,
    /**
     * Ce que le meneur reconnaîtra si cette requête occupe le modèle —
     * « Forge », « Oracle », « Cortex ». **Axe D.3 du plan du 2026-08-07.**
     *
     * Sous `OLLAMA_NUM_PARALLEL: 1`, une requête longue tient l'unique créneau
     * et toutes les autres font la queue derrière elle. Le panneau de l'Oracle
     * affiche ce libellé et propose d'abandonner : *« Forge en cours, l'Oracle
     * attendra » est actionnable ; un bouton grisé ne l'est pas.*
     *
     * Facultatif : un appel qui ne se nomme pas s'affiche quand même, sous un
     * libellé générique. Mieux vaut une attente mal nommée qu'une attente
     * muette — et **exiger le libellé de trente appelants en aurait fait
     * oublier vingt-neuf**, comme pour les émetteurs du journal.
     */
    libelle?: string,
  ): Promise<AIResponse> {
    const { activeProvider } = useAIStore.getState();
    const TIMEOUT_MS = 2700000; // 45 minutes
    const systemPrompt = sansPersona
      ? (customContext ?? '')
      : await this.prepareSystemPrompt(prompt, customContext, gemId, ragOptions, lite);

    console.groupCollapsed(`[AIService] Full Prompt Details (${prompt.length + systemPrompt.length} chars)`);
    console.log("--- SYSTEM PROMPT ---");
    console.log(systemPrompt);
    console.log("--- USER PROMPT ---");
    console.log(prompt);
    console.groupEnd();

    console.log(`[AIService] Sending ${activeProvider} request (${prompt.length + systemPrompt.length} chars)...`);

    return Promise.race([
      this.executeRequest(activeProvider, prompt, systemPrompt, gemId, ragOptions, lite, attendJson, schema, plafondDeGeneration, libelle),
      new Promise<AIResponse>((_, reject) => 
        setTimeout(() => reject(new Error(`TIMEOUT: ${activeProvider} n'a pas répondu après 45min.`)), TIMEOUT_MS)
      )
    ]);
  }

  private async executeRequest(
    activeProvider: AIProvider,
    prompt: string,
    systemPrompt: string,
    _gemId: string,
    _ragOptions: any,
    _lite?: boolean,
    attendJson: boolean = false,
    schema?: Record<string, unknown>,
    plafondDeGeneration?: number,
    libelle?: string,
  ): Promise<AIResponse> {
    const { configs } = useAIStore.getState();
    const config = configs[activeProvider];

    if (activeProvider !== 'ollama' && !config.apiKey && activeProvider !== 'custom') {
      throw new Error(`API Key manquante pour le fournisseur ${activeProvider}`);
    }

    let retries = 0;
    const MAX_RETRIES = 2;

    while (retries <= MAX_RETRIES) {
      try {
        if (activeProvider === 'ollama' || activeProvider === 'ollama_cloud') {
          const model = config.modelId || 'phi3';
          const endpoint = config.endpoint;
          if (!window.appBridge?.ai?.ollamaChat) throw new Error("Bridge Ollama non disponible.");

          /*
            **Où se perd la contrainte JSON — vu depuis le seul endroit qu'on
            sache lire.**

            Le 2026-08-12, une réponse contenait du texte APRÈS son JSON, ce qui
            prouve que `format: 'json'` n'avait pas été appliqué. Trois processus
            relaient l'option, et le journal du processus principal n'arrive pas
            jusqu'aux DevTools : la question restait sans réponse.

            Deux renseignements dans une ligne, tous deux lisibles ici :
            ce que le renderer DEMANDE, et le nombre de paramètres que le pont
            accepte. Un pont resté à trois paramètres est un préchargement
            périmé — et il jetterait l'option sans un mot.
          */
          console.log(
            `[AIService] ollamaChat json=${attendJson} — le pont accepte ` +
            `${window.appBridge.ai.ollamaChat.length} paramètres (4 attendus).`,
          );
          
          // Note: The current ollamaChat bridge might not support API Keys yet.
          // If needed, we'll have to upgrade the bridge or use proxyRequest for OpenAI-compatible Ollama Cloud providers.
          const text = await window.appBridge.ai.ollamaChat(model, [
            { role: 'user', content: `${systemPrompt}\n\n--- TA MISSION ---\n${prompt}` }
          ], endpoint, attendJson || plafondDeGeneration
            ? {
                ...(attendJson ? { json: true } : {}),
                ...(schema ? { schema } : {}),
                // Absent, le service garde son défaut : on ne fait pas payer
                // une nouveauté aux appelants qui n'ont rien demandé.
                ...(plafondDeGeneration ? { num_predict: plafondDeGeneration } : {}),
              }
            : undefined,
            // Toute requête s'inscrit au registre, nommée : c'est ce qui permet
            // au panneau de dire ce qui occupe le modèle, et de l'abandonner.
            identifierLaRequete(libelle));

          return { text, metadata: { provider: activeProvider, model, endpoint } };
        }

        if (activeProvider === 'custom') {
          const apiKey = config.apiKey?.trim();
          const model = config.modelId;
          const endpoint = config.endpoint; // ex: https://api.together.xyz/v1/chat/completions
          
          if (!endpoint) throw new Error("Endpoint manquant pour le fournisseur Custom.");
          if (!window.appBridge?.ai?.proxyRequest) throw new Error("Bridge AI non disponible.");

          const bridgeResponse = await window.appBridge.ai.proxyRequest(endpoint, 'POST', {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
          }, {
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ]
          });

          if (!bridgeResponse.ok) {
            throw new Error(`Erreur API Custom (${bridgeResponse.status}): ${bridgeResponse.statusText}`);
          }

          const data = bridgeResponse.data as any;
          const text = data.choices?.[0]?.message?.content || data.text || JSON.stringify(data);
          return { text, metadata: { provider: 'custom', model } };
        }

        if (activeProvider === 'gemini') {
          const apiKey = config.apiKey?.trim().replace(/[\r\n]/g, '');
          const model = config.modelId || 'gemini-1.5-flash';
          
          const tryVersion = async (version: string) => {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
            if (!window.appBridge?.ai?.proxyRequest) throw new Error("Bridge AI non disponible.");

            return window.appBridge.ai.proxyRequest(url, 'POST', { 'Content-Type': 'application/json' }, {
              contents: [{ parts: [{ text: `${systemPrompt}\n\nUtilisateur: ${prompt}` }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
            });
          };

          const initialVersion = model.startsWith('gemini-2') ? 'v1beta' : 'v1';
          let bridgeResponse = await tryVersion(initialVersion);
          
          if (bridgeResponse.status === 404 && initialVersion === 'v1') {
            bridgeResponse = await tryVersion('v1beta');
          }

          if (!bridgeResponse.ok) {
            const errorData = (bridgeResponse.data as { error?: { message?: string } }) || {};
            if (bridgeResponse.status === 429) {
              if (model !== 'gemini-2.0-flash-lite') {
                 const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
                 const fallbackRes = await window.appBridge?.ai?.proxyRequest?.(fallbackUrl, 'POST', { 'Content-Type': 'application/json' }, {
                   contents: [{ parts: [{ text: `${systemPrompt}\n\nUtilisateur: ${prompt}` }] }],
                   generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
                 });
                 if (fallbackRes?.ok) {
                   const data = fallbackRes.data as GeminiResponse;
                   return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || "Réponse fallback.", metadata: { provider: 'gemini', model: 'gemini-2.0-flash-lite' } };
                 }
              }
              throw new Error("Quota insuffisant chez Google.");
            }
            throw new Error(`Erreur API Gemini (${bridgeResponse.status}): ${errorData.error?.message || bridgeResponse.statusText}`);
          }

          const data = bridgeResponse.data as GeminiResponse;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Pas de réponse.";
          return { text, metadata: { provider: 'gemini', model } };
        }

        if (activeProvider === 'anthropic') {
          const apiKey = config.apiKey?.trim();
          if (!apiKey) throw new Error("Clé API Anthropic non configurée.");
          const model = config.modelId || 'claude-3-5-sonnet-latest';
          const url = `https://api.anthropic.com/v1/messages`;
          
          if (!window.appBridge?.ai?.proxyRequest) throw new Error("Bridge AI non disponible.");

          const bridgeResponse = await window.appBridge.ai.proxyRequest(url, 'POST', {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }, {
            model,
            max_tokens: 4096,
            messages: [
              { role: 'user', content: `${systemPrompt}\n\nUtilisateur: ${prompt}` }
            ]
          });

          if (!bridgeResponse.ok) {
            const errorData = (bridgeResponse.data as { error?: { message?: string } }) || {};
            throw new Error(`Erreur API Anthropic (${bridgeResponse.status}): ${errorData.error?.message || bridgeResponse.statusText}`);
          }

          const data = bridgeResponse.data as { content: { type: string; text: string }[] };
          const textElement = data.content?.find(c => c.type === 'text');
          const text = textElement?.text || "Pas de réponse.";
          return { text, metadata: { provider: 'anthropic', model } };
        }

        return {
          text: `[Simulation ${activeProvider}] Réponse simulée.`,
          metadata: { provider: activeProvider, model: config.modelId }
        };

      } catch (error: any) {
        const message = error?.message || String(error);
        if (message.includes('ERR_NETWORK_CHANGED') && retries < MAX_RETRIES) {
          retries++;
          console.warn(`[AIService] ERR_NETWORK_CHANGED détecté. Tentative ${retries}/${MAX_RETRIES}...`);
          await new Promise(r => setTimeout(r, 1000)); // Petit délai
          continue;
        }
        throw error;
      }
    }
    throw new Error("Échec de la requête AI après plusieurs tentatives.");
  }

  /**
   * Génère un résumé narratif d'une session à partir des événements du journal.
   *
   * **Ce résumé n'a jamais fonctionné hors Gemini, et il ne le disait pas.**
   * Signalé le 2026-08-08 (§ 1.2 du plan de trame narrative), corrigé le
   * 2026-08-17. Cette méthode réimplémentait son propre appel réseau, ne
   * traitait que Gemini, et terminait par
   * `return "Résumé non disponible pour ce fournisseur d'IA."` — **rendu comme
   * un succès**. `generateAISummary` l'enregistrait donc comme résumé, et
   * `syncToNotebook` l'aurait poussé dans le carnet comme source. David est sur
   * Ollama : il n'a jamais obtenu autre chose que cette phrase.
   *
   * `generateText`, trente lignes plus haut dans ce même fichier, parle à cinq
   * fournisseurs — ollama, ollama_cloud, custom, gemini, anthropic — avec
   * réessais et repli. *La capacité existait ; elle n'était pas branchée ici.*
   *
   * **`sansPersona`** : l'invite est close et se suffit. Sans lui,
   * `prepareSystemPrompt` y ajouterait les instructions du Sage de la campagne
   * active, ses personnages et son RAG — de quoi noyer un compte rendu déjà
   * long, et faire commenter au modèle un travail qu'on ne lui demandait pas.
   *
   * @param events Liste des événements chronologiques de la session.
   * @returns Le résumé narratif généré (Markdown).
   * @throws si le fournisseur n'est pas configuré ou si la génération échoue —
   *         *une panne doit ressembler à une panne.*
   */
  /**
   * @param noteFinale La note de conclusion du meneur, **passée par l'appelant**.
   *
   * Elle était lue ici sur `journals.find(j => j.id === activeJournalId)` —
   * c'est-à-dire sur le journal SÉLECTIONNÉ, quand les événements reçus en
   * paramètre viennent d'un journal désigné par son identifiant. Deux sources
   * pour un même compte rendu, qui ne coïncident que tant que l'écran les tient
   * alignées : résumer un journal autrement que par un clic dans la liste y
   * collait la note d'un autre. *Le service d'IA ne voit que du texte ; c'est au
   * journal de dire de quel journal il parle.*
   */
  /**
   * Le compte rendu narratif d'une séance.
   *
   * **`contexte` n'est pas décoratif.** Sans lui, l'invite ne disait ni le jeu,
   * ni la campagne, ni qui étaient les personnages : le modèle a intitulé une
   * séance d'Alien « Chroniques des Terres Oubliées » et l'a écrite en
   * heroic-fantasy. *Un modèle à qui l'on ne donne pas le cadre n'en fait pas
   * l'économie : il en invente un.*
   */
  public async summarizeSession(
    events: JournalEvent[],
    noteFinale?: string,
    contexte?: ContexteDeCampagne,
  ): Promise<string> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    if (!config.apiKey && activeProvider !== 'ollama') {
      throw new Error(`API Key manquante pour le fournisseur ${activeProvider}`);
    }

    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

    // Filter and format events for the prompt
    const eventLog = sortedEvents
      .map(e => {
        const time = new Date(e.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return `[${time}] ${e.title}: ${e.content}`;
      })
      .join('\n');

    const note = noteFinale?.trim();

    /*
      **Le cadre passe avant le fil, et c'est délibéré.** Le modèle décide du ton
      et du titre dès ses premières lignes ; lui donner le jeu après les
      événements reviendrait à le corriger une fois qu'il a choisi. La consigne
      de ne rien inventer est explicite : sans elle, un modèle comble.
    */
    const cadre = contexte && !contexteEstVide(contexte)
      ? (i18n.language === 'fr'
        ? `CADRE DE LA PARTIE — respecte-le, n'invente ni univers ni ton :
${contexte.systeme ? `- Jeu : ${contexte.systeme}` : ''}
${contexte.campagne ? `- Campagne : ${contexte.campagne}` : ''}
${contexte.synopsis ? `- Pitch : ${contexte.synopsis}` : ''}
${contexte.personnages?.length ? `- Personnages joueurs : ${contexte.personnages.join(', ')}` : ''}
Emploie les noms ci-dessus tels quels. N'invente aucun titre d'univers.
`
        : `GAME SETTING — respect it, do not invent a universe or a tone:
${contexte.systeme ? `- Game: ${contexte.systeme}` : ''}
${contexte.campagne ? `- Campaign: ${contexte.campagne}` : ''}
${contexte.synopsis ? `- Pitch: ${contexte.synopsis}` : ''}
${contexte.personnages?.length ? `- Player characters: ${contexte.personnages.join(', ')}` : ''}
Use the names above verbatim. Do not invent a setting title.
`)
      : '';

    const summaryPrompt = i18n.language === 'fr'
      ? `En tant que Chroniqueur Expert, transforme ces logs de session de jeu de rôle en un résumé narratif captivant.
    Les événements sont chronologiques. Crée un récit fluide, avec des titres de sections, des moments forts et des développements d'intrigue.

    ${cadre}
    ${note ? `IMPORTANT - NOTE FINALE DU MJ :\n"${note}"\nPrends bien en compte ces notes pour conclure le résumé.` : ''}


    LOGS DE LA SESSION :
    ${eventLog}

    RÉSUMÉ FINAL :`
      : `As an Expert Chronicler, transform these role-playing session logs into a compelling narrative summary.
    Events are chronological. Create a fluid narrative with section titles, highlights, and plot developments.

    ${cadre}
    ${note ? `IMPORTANT - GM FINAL NOTE:\n"${note}"\nTake these notes into account to conclude the summary.` : ''}


    SESSION LOGS:
    ${eventLog}

    FINAL SUMMARY:`;

    try {
      const { text } = await this.generateText(
        summaryPrompt,
        undefined,
        'sage',
        {},
        false,
        false,
        /* sansPersona */ true,
      );

      /*
        Un modèle qui ne rend rien est une panne, pas un résumé vide. La rendre
        silencieusement écrirait une page blanche dans le journal sous le titre
        « Résumé IA » — exactement le mode de défaillance qu'on vient de retirer.
      */
      const resume = text?.trim();
      if (!resume) throw new Error("Le modèle n'a rien rendu pour le résumé de séance.");
      return resume;
    } catch (err) {
      console.error("[AIService] Summarization error:", err);
      throw err;
    }
  }

  /**
   * Génère une image à partir d'un prompt textuel.
   * Tente d'abord Ollama Local (Flux), puis Z-Image (HuggingFace), et enfin Gemini en fallback.
   * @param prompt Description visuelle détaillée.
   * @param aspectRatio Ratio d'aspect (ex: "1:1", "16:9"). Supporté par Z-Image.
   * @returns URL de l'image (Locale via bridge, Data URI ou Placeholder Dicebear).
   */
  public async generateImage(prompt: string, aspectRatio?: string): Promise<string> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    try {
      // 0. TENTATIVE OLLAMA LOCAL FLUX (Si actif)
      if (activeProvider === 'ollama') {
        try {
          /*
            **UN DÉLAI D'ABANDON, ET IL ARRÊTE VRAIMENT — axe D.2 du plan du
            2026-08-07, que celui-ci demande de traiter en premier.**

            Il n'existait AUCUN délai ici : ni dans `AIService.generateImage`,
            ni dans `OllamaService.generateImage`. Le plafond de 45 minutes ne
            couvre que `generateText`. Or si le fournisseur actif est Ollama,
            cette branche tente **d'abord une diffusion locale** — sur une
            machine mesurée à `size_vram: 0`, c'est-à-dire sur processeur.

            Un portrait demandé à table pouvait donc bloquer **indéfiniment,
            avant même d'atteindre les replis cloud qui répondraient en quelques
            secondes** — et il occupait l'unique créneau de `NUM_PARALLEL: 1`,
            donc l'Oracle et le Cortex avec lui.

            **Quatre-vingt-dix secondes.** Assez pour un iGPU qui a de la
            chance, trop peu pour une nuit de diffusion sur CPU. Et surtout : à
            l'échéance on ABANDONNE POUR DE BON — `ollamaAbort` coupe le `fetch`
            côté processus principal — puis **on tombe sur le cloud** au lieu
            d'échouer. *Dégrader plutôt qu'échouer*, comme le demande l'axe D.4.
          */
          const DELAI_IMAGE_LOCALE_MS = 90_000;
          const requete = {
            id: `image-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            libelle: "Génération d'image",
          };
          let model = config.modelId || 'flux';
          const endpoint = config.endpoint;
          // Force flux if a text model is used for image generation
          const isTextModel = model.includes('phi') || model.includes('gemma') || model.includes('mistral') || model.includes('llama');
          if (isTextModel) {
             console.log(`[AI Service] Modèle texte détecté (${model}), redirection vers Flux pour l'image...`);
             model = 'x/flux2-klein:latest'; 
          }

          console.log(`[AI Service] Envoi de la requête Ollama Image (Modèle: ${model}, Endpoint: ${endpoint})...`);
          if (!window.appBridge?.ai?.ollamaGenerateImage) throw new Error("Bridge Ollama Generate Image non disponible.");
          
          const base64Response = await Promise.race([
            window.appBridge.ai.ollamaGenerateImage(model, prompt, endpoint, requete),
            new Promise<never>((_, rejeter) => setTimeout(() => {
              // On coupe la requête AVANT de rejeter : sans cela la diffusion
              // continuerait sur le créneau unique, et le repli cloud
              // attendrait derrière elle.
              void window.appBridge?.ai?.ollamaAbort?.(requete.id);
              rejeter(new Error(
                `La génération locale a dépassé ${DELAI_IMAGE_LOCALE_MS / 1000} s et a été abandonnée. `
                + 'Bascule sur le service distant.',
              ));
            }, DELAI_IMAGE_LOCALE_MS)),
          ]);
          
          if (base64Response) {
             let base64Data = base64Response;
             // Si Ollama encapsule le base64 dans du markdown (ex: ![image](data:image/png;base64,iVBOR...))
             const markdownMatch = base64Response.match(/data:image\/[^;]+;base64,([a-zA-Z0-9+/=]+)/);
             if (markdownMatch) {
                 base64Data = markdownMatch[1];
             }
             
             // Decodage base64 robuste
             const binaryString = atob(base64Data);
             const uint8Array = new Uint8Array(binaryString.length);
             for (let i = 0; i < binaryString.length; i++) {
                 uint8Array[i] = binaryString.charCodeAt(i);
             }

             if (uint8Array.byteLength > 1000) {
                 const fileName = `ollama_flux_${Date.now()}.png`;
                 if (window.appBridge?.npc?.saveAvatar) {
                     const bufferCopy = (uint8Array.buffer as ArrayBuffer).slice(0);
                     const localUrl = await window.appBridge.npc.saveAvatar(bufferCopy, fileName);
                     
                     try {
                         const { useMediaStore } = await import('../../stores/useMediaStore');
                         const addMedia = useMediaStore.getState().addMedia;
                         const blob = new Blob([uint8Array], { type: 'image/png' });
                         const file = new File([blob], fileName, { type: 'image/png' });
                         await addMedia(file, ['AI Generated', 'Local Flux']);
                     } catch (err) {
                         console.warn("[AI Service] Media hub registration failed for Ollama:", err);
                     }
                     if (localUrl) return localUrl;
                 }
                 return `data:image/png;base64,${base64Data}`;
             }
          }
        } catch (ollamaErr) {
             console.error("[AI Service] Ollama image generation failed, checking fallbacks...", ollamaErr);
        }
      }

      /*
        1. CLOUDFLARE WORKERS AI

        **Pourquoi il passe avant le Space HuggingFace.** Le recours « gratuit »
        d'avant était `mrfakename-z-image-turbo.hf.space` — le Space **public
        d'un tiers**, appelé en anonyme depuis le renderer. File d'attente, mise
        en veille, renommage, suppression : rien n'était sous notre contrôle, et
        c'est exactement pourquoi la génération d'image ne marchait plus.
        *Un service qu'on a contractualisé passe avant un service qu'on
        emprunte.*

        Workers AI offre 10 000 Neurons par jour, remis à zéro à 00:00 UTC —
        de l'ordre de deux mille images en 512×512 avec FLUX.1 schnell.

        **L'appel passe par le proxy du process principal**, comme celui de
        Gemini : le jeton ne traverse jamais le renderer, et il n'y a pas de
        question de CORS. C'était l'autre défaut du chemin HuggingFace, seul
        appel réseau à partir directement de la fenêtre.

        La réponse est du JSON portant l'image en base64 — la même forme que
        Gemini rend, donc la même écriture en aval.
      */
      const image = useAIStore.getState().image;
      if (image.accountId && image.apiKey) {
        try {
          // L'appel vit dans `cloudflareImage.ts`, partagé avec le bouton
          // « Tester » des réglages : un test qui emprunterait un autre chemin
          // ne testerait pas ce qui tourne en séance.
          const base64 = await genererViaCloudflare(prompt, image);
          const octets = octetsDeLImage(base64);

          if (octets.byteLength > 1000) {
            const fileName = `cloudflare_${Date.now()}.jpg`;
            if (window.appBridge?.npc?.saveAvatar) {
              const copie = (octets.buffer as ArrayBuffer).slice(0);
              const localUrl = await window.appBridge.npc.saveAvatar(copie, fileName);
              try {
                const activeCampaignId = useSessionOSStore.getState().activeCampaignId;
                const fichier = new File([new Blob([octets], { type: 'image/jpeg' })], fileName, { type: 'image/jpeg' });
                await useMediaStore.getState().addMedia(fichier, ['AI Generated', 'Cloudflare'], activeCampaignId ? [activeCampaignId] : []);
              } catch (hubErr) {
                console.warn('[AI Service] Enregistrement au Media Hub échoué (Cloudflare) :', hubErr);
              }
              if (localUrl) return localUrl;
            }
            return `data:image/jpeg;base64,${base64}`;
          }
          throw new Error('image trop petite pour être vraie');
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`[AI Service] Cloudflare Workers AI en échec (${message}). Passage au recours suivant...`);
        }
      }

      // 2. TENTATIVE Z-IMAGE (HuggingFace Space via Gradio)
      try {
        console.log(`[AI Service] Tentative de génération via Z-Image (HuggingFace Space)...`);
        const { Client } = await import('@gradio/client');
        
        // Utilisation du token fourni par l'environnement
        const env = (import.meta as unknown as { env: Record<string, string> }).env;
        const hfToken = env?.VITE_HF_TOKEN || ''; 
        
        const client = await Client.connect('https://mrfakename-z-image-turbo.hf.space', { hf_token: hfToken } as any);
        
        // Paramètres Z-Image : prompt, height, width, num_inference_steps, seed, randomize_seed
        const isLandscape = aspectRatio === '16:9';
        const result = await client.predict('/generate_image', { 
            prompt: prompt,
            height: isLandscape ? 768 : 1024,
            width: isLandscape ? 1344 : 1024,
            num_inference_steps: 4, // Rapide
            seed: 42,
            randomize_seed: true
        });

        const resultData = result.data as { url: string }[];
        const imageUrl = resultData[0]?.url;

        if (imageUrl) {
          console.log(`[AI Service] Z-Image générée : ${imageUrl}. Téléchargement...`);
          const imgResponse = await fetch(imageUrl);
          if (imgResponse.ok) {
            const arrayBuffer = await imgResponse.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            if (uint8Array.byteLength > 1000) {
              const mimeType = imgResponse.headers.get('content-type') || 'image/png';
              const extension = mimeType.split('/')[1] || 'png';
              const fileName = `zimage_gen_${Date.now()}.${extension}`;
              
            if (window.appBridge?.npc?.saveAvatar) {
              const bufferCopy = (uint8Array.buffer as ArrayBuffer).slice(0);
              const localUrl = await window.appBridge.npc.saveAvatar(bufferCopy, fileName);
              
              // Register in Media Hub as well
              try {
                const { addMedia } = useMediaStore.getState();
                const activeCampaignId = useSessionOSStore.getState().activeCampaignId;
                const blob = new Blob([uint8Array], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });
                await addMedia(file, ['AI Generated', 'NPC Portrait'], activeCampaignId ? [activeCampaignId] : []);
                console.log(`[AI Service] Z-Image registered in Media Hub.`);
              } catch (hubErr) {
                console.warn(`[AI Service] Base64 for Media Hub failed (Z-Image):`, hubErr);
              }

              if (localUrl) return localUrl;
            }
              // Fallback Data URI si saveAvatar échoue
              const base64 = btoa(String.fromCharCode(...uint8Array));
              return `data:${mimeType};base64,${base64}`;
            }
          }
        }
        console.log(`[AI Service] Z-Image n'a pas retourné d'URL fluide. Passage à Gemini...`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[AI Service] Z-Image (HF Space) indisponible ou en échec (${message}). Passage à Gemini...`);
      }

      // 2. FALLBACK GEMINI 2.5 FLASH IMAGE
      const geminiConfig = configs['gemini'] as { apiKey?: string };
      const apiKey = geminiConfig?.apiKey;
      
      if (!apiKey) {
        throw new Error("Clé API Gemini manquante pour fallback.");
      }

      console.log(`[AI Service] Generating image with Gemini 2.5 Flash...`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_modalities: ["IMAGE"] }
      };


      console.log(`[AI Service] Proxying Gemini Image request...`);
      const bridgeResponse = await window.appBridge?.ai?.proxyRequest?.(url, 'POST', { 'Content-Type': 'application/json' }, payload);

      if (!bridgeResponse?.ok) {
        const errorMsg = (bridgeResponse?.data as { error?: { message?: string } })?.error?.message || bridgeResponse?.statusText || 'Inconnue';
        throw new Error(`Erreur Proxy Gemini Image: ${errorMsg}`);
      }

      const data = bridgeResponse.data as GeminiResponse;
      const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      
      if (!imagePart || !imagePart.inlineData?.data) {
        throw new Error("Aucune image générée dans la réponse Gemini.");
      }

      const { data: base64Data, mimeType } = imagePart.inlineData;
      console.log(`[AI Service] Image received via proxy: ${mimeType}, size: ${base64Data.length} chars`);

      // Decodage base64 robuste
      const binaryString = atob(base64Data);
      const uint8Array = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
      
      console.log(`[AI Service] Decoded buffer size: ${uint8Array.byteLength} bytes`);

      const extension = mimeType?.split('/')[1] || 'png';
      const fileName = `ai_gen_${Date.now()}.${extension}`;
      
      if (window.appBridge?.npc?.saveAvatar && uint8Array.byteLength > 1000) {
        console.log(`[AI Service] Saving image locally via bridge (${uint8Array.byteLength} bytes)...`);
        // On s'assure de passer une COPIE du buffer pour éviter tout problème de détachement
        const bufferCopy = (uint8Array.buffer as ArrayBuffer).slice(0);
        const localUrl = await window.appBridge.npc.saveAvatar(bufferCopy, fileName);

        // Register in Media Hub as well
        try {
          const { addMedia } = useMediaStore.getState();
          const activeCampaignId = useSessionOSStore.getState().activeCampaignId;
          const blob = new Blob([uint8Array], { type: mimeType || 'image/png' });
          const file = new File([blob], fileName, { type: mimeType || 'image/png' });
          await addMedia(file, ['AI Generated', 'NPC Portrait'], activeCampaignId ? [activeCampaignId] : []);
          console.log(`[AI Service] Gemini Image registered in Media Hub.`);
        } catch (hubErr) {
          console.warn(`[AI Service] Base64 for Media Hub failed (Gemini):`, hubErr);
        }

        if (localUrl) {
          console.log(`[AI Service] Image saved at: ${localUrl}`);
          return localUrl;
        }
      }
      
      console.warn("[AI Service] Local save failed or bridge unavailable, using Data URI fallback.");
      return `data:${mimeType};base64,${base64Data}`;
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[AI Service] Gemini Image Proxy Error:", message);
      return `https://api.dicebear.com/9.x/bottts/svg?seed=${Date.now()}`;
    }
  }

  /**
   * Génère un template structuré de fiche de personnage (JSON) à partir d'un système.
   * @param systemQuery Nom ou description du système de jeu.
   * @returns Le template de fiche partiel.
   */
  public async generateStructuredTemplate(systemQuery: string): Promise<Partial<import('../../data/defaultSheetTemplates').SheetTemplate>> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    const systemPrompt = `Tu es un expert en JdR. Crée un template JSON pour le système : ${systemQuery}`;
    
    if (activeProvider === 'gemini') {
      const apiKey = config.apiKey?.trim();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const bridgeResponse = await window.appBridge?.ai?.proxyRequest?.(url, 'POST', { 'Content-Type': 'application/json' }, {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      });

      if (bridgeResponse?.ok) {
        const data = bridgeResponse.data as GeminiResponse;
        return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
      }
    }
    return {};
  }

  /**
   * Liste les modèles disponibles pour une clé API Gemini.
   * @param apiKey Clé API Google Gemini.
   * @returns Liste des IDs de modèles.
   */
  public async listModels(apiKey?: string): Promise<string[]> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    if (activeProvider === 'ollama') {
      if (window.appBridge?.ai?.ollamaListModels) {
        return await window.appBridge.ai.ollamaListModels(config.endpoint);
      }
      return [];
    }

    if (activeProvider === 'gemini' && apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const response = await window.appBridge?.ai?.proxyRequest?.(url, 'GET', {}, {}) as { ok: boolean; data: { models?: { name: string }[] } };
      if (response?.ok) {
        const data = response.data;
        return (data.models || []).map((m) => m.name.replace('models/', ''));
      }
    }
    return [];
  }

  /**
   * Enrichit les attributs d'un PNJ ou lieu de manière narrative.
   * @param fields Champs originaux (clé: valeur).
   * @param category Catégorie (Personnage, Lieu, etc.).
   * @param universe Univers ou Lore parent.
   * @returns Champs enrichis narratifs.
   */
  public async enrichNPCEntity(fields: Record<string, string>, category: string, universe: string): Promise<Record<string, string>> {
     const fieldsPrompt = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
     const prompt = i18n.language === 'fr'
       ? `Voici les attributs d'un(e) [${category}] dans l'univers [${universe}]. 
     TACHE : Améliore ces descriptions pour les rendre immersives, narratives et riches en détails.
     RÈGLES :
     1. Garde EXACTEMENT les mêmes noms de clés (labels).
     2. Réponds UNIQUEMENT avec un objet JSON valide contenant les clés originales et les nouvelles valeurs enrichies en français.
     3. Ne déforme pas l'essence de l'attribut original mais rend-le "vivant".
     
     ATTRIBUTS BRUTS :
     ${fieldsPrompt}`
       : `Here are the attributes of a [${category}] in the [${universe}] universe.
     TASK: Improve these descriptions to make them immersive, narrative, and rich in detail.
     RULES:
     1. Keep EXACTLY the same key names (labels).
     2. Answer ONLY with a valid JSON object containing the original keys and the new enriched values in English.
     3. Do not distort the essence of the original attribute but make it "alive".
     
     RAW ATTRIBUTES:
     ${fieldsPrompt}`;

     try {
       const response = await this.generateText(prompt, "Tu es un assistant de création narrative expert. Réponds exclusivement en JSON pur.");
       // Extraction du JSON au cas où l'IA ajoute du texte avant/après
       const jsonMatch = response.text.match(/\{[\s\S]*\}/);
       if (jsonMatch) {
         return JSON.parse(jsonMatch[0]);
       }
       return fields;
     } catch (err) {
       console.error("[AIService] Enrichment failed:", err);
       return fields;
     }
  }

  /**
   * Suggère un prompt visuel détaillé destiné aux générateurs d'images.
   * @param name Nom de l'entité.
   * @param fields Attributs descriptifs.
   * @param category Catégorie (Personnage, Lieu).
   * @param universe Univers de référence.
   * @returns Prompt en anglais pour IA génératrice d'image.
   */
  public async suggestNPCImagePrompt(name: string, fields: Record<string, string>, category: string, universe: string): Promise<string> {
    const fieldsText = Object.values(fields).join(', ');
    const prompt = `Basé sur ce personnage/lieu nommé "${name}" (${category}) dans l'univers "${universe}" :
    Description : ${fieldsText}
    
    TACHE : Génère un prompt visuel détaillé en ANGLAIS pour un moteur de génération d'images IA (type Flux/Stable Diffusion).
    RÈGLES :
    1. Sois très précis sur le style (digital art, cinematic lighting, etc.).
    2. Décris l'apparence, les vêtements, l'ambiance et l'arrière-plan.
    3. Réponds UNIQUEMENT avec le prompt final en anglais.
    
    PROMPT VISUEL :`;

    try {
      const response = await this.generateText(prompt, "Tu es un expert en prompting d'images pour IA. Réponds uniquement avec le prompt en anglais.");
      return response.text.trim();
    } catch (err) {
      console.error("[AIService] Prompt suggestion failed:", err);
      return "";
    }
  }

  /**
   * Génère une réponse textuelle en streaming (Ollama focus).
   */
  public async generateTextStream(
    prompt: string,
    onToken: (token: string) => void,
    onStatusUpdate?: (status: string) => void,
    gemId: string = 'sage',
    ragOptions: { systemOnly?: boolean; systemName?: string } = {}
  ): Promise<void> {
    const { activeProvider, configs, streamEnabled } = useAIStore.getState();
    const config = configs[activeProvider];

    if (!streamEnabled || activeProvider !== 'ollama') {
       onStatusUpdate?.("Mode bloquant actif...");
       const resp = await this.generateText(prompt, undefined, gemId, ragOptions);
       onToken(resp.text);
       return;
    }

    onStatusUpdate?.("Analyses tactiques & grimoires...");
    const systemPrompt = await this.prepareSystemPrompt(prompt, undefined, gemId, ragOptions);

    onStatusUpdate?.("Réception de la vision...");
    
    if (activeProvider === 'ollama') {
      const model = config.modelId || 'phi3';
      const endpoint = config.endpoint;
      if (!window.appBridge?.ai?.ollamaChatStream) throw new Error("Bridge Ollama Stream non disponible.");
      
      const unsubscribe = window.appBridge.ai.onStreamToken((token) => {
        onToken(token);
      });

      try {
        /*
          **Une borne de génération, enfin.** Ce chemin partait sans aucune
          option : ni fenêtre de contexte, ni plafond de sortie. Le commentaire
          d'`OllamaService` chiffre ce que ça coûte — *« à 7,7 tok/s de
          décodage, un emballement se paie en dizaines de minutes »*.

          1 024 plutôt que les 2 048 du défaut : une réponse d'Oracle est une
          réponse de table, deux à trois paragraphes. Le plan le dit — *« le
          prévisible vaut mieux que le rapide »* — et une borne basse rend
          l'attente bornée, ce qu'aucune animation ne fait.
        */
        await window.appBridge.ai.ollamaChatStream(model, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ], endpoint, { num_predict: 1024 }, identifierLaRequete("Oracle"));
      } finally {
        unsubscribe();
      }
    }
  }

  /**
   * Prépare le prompt système complet en fonction du contexte.
   */
  public async prepareSystemPrompt(
    prompt: string,
    customContext?: string,
    gemId: string = 'sage',
    ragOptions: { systemOnly?: boolean; systemName?: string; limit?: number } = {},
    lite?: boolean
  ): Promise<string> {
    const aiStore = useAIStore.getState();
    const isLite = lite !== undefined ? lite : aiStore.liteContext;

    // La question sert à trier le corpus par sujet. Elle arrivait déjà jusqu'ici
    // sous le nom `_prompt` et n'allait pas plus loin : le moteur ne pouvait
    // sélectionner que par système, jamais par ce qui était demandé.
    const ragContext = isLite
      ? (ragOptions.systemOnly ? await ragService.getRelevantContext({ ...ragOptions, limit: 1 }) : "")
      : await ragService.getRelevantContext({ ...ragOptions, query: prompt });

    const liveContext = this.getLiveSessionContext(isLite);

    const fullContext = assemblerLeContexte(ragContext, customContext, liveContext);

    const gemStore = (await import('../../stores/useGemStore')).useGemStore.getState();
    const gem = gemStore.gems.find(g => g.id === gemId) || gemStore.gems[0];
    
    const activeCampaign = useSessionOSStore.getState().campaigns.find(c => c.id === useSessionOSStore.getState().activeCampaignId);
    const systemId = activeCampaign?.system?.toLowerCase() || 'generic';
    // Accès défensif : la persona est un enrichissement du prompt, jamais une
    // condition de la génération. Un store incomplet ne doit pas faire échouer
    // une requête au modèle.
    const driver = useSessionOSStore.getState().customGameDrivers?.find(d => d.id === activeCampaign?.system);

    const translateOrDefault = (key: string, def: string) => {
      const t = i18n.t(key);
      return (t === key || !t) ? def : t;
    };

    let personaInstructions = translateOrDefault(gem.systemOverrides?.[systemId] || gem.baseInstructions, "Tu es un assistant IA expert.");

    /**
     * Les personas par système, résolues **comme la Forge les écrit**.
     *
     * Auparavant ce bloc lisait `systems/${systemId}/gems.json` en dur. Or la
     * Forge fabrique les identifiants de pilote avec `custom-${Date.now()}` :
     * pour une campagne Dune, il demandait `systems/custom-1754…/gems.json`, qui
     * n'existe pas, pendant que `docs/systems/dune/gems.json` attendait. Le
     * `catch` avalait le vide et l'Oracle retombait sur la persona générique —
     * les personas de Dune n'ont jamais servi, et rien ne l'a jamais dit.
     */
    try {
      const dossiersConnus = (await window.appBridge?.ai?.listSystems?.()) ?? [];
      const corpus = resoudreCorpus({
        systemId,
        systemName: driver?.name,
        systemPath: activeCampaign?.systemPath,
        corpusId: driver?.corpusId,
        ragPath: driver?.ragPath,
        dossiersConnus,
      });
      const systemGemsRaw = await window.appBridge?.ai?.readDoc?.(cheminDesPersonas(corpus));
      if (systemGemsRaw) {
        const systemGems = JSON.parse(systemGemsRaw);
        if (systemGems[gemId]) personaInstructions = systemGems[gemId];
      }
    } catch { /* ignore */ }

    const { DEFAULT_SHEET_TEMPLATES } = await import('../../data/defaultSheetTemplates');
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...useSessionOSStore.getState().customSheetTemplates];
    const sheetTemplate = allTemplates.find(t => t.id === systemId);
    if (sheetTemplate?.aiPersonas?.[gemId]) {
       const templateInstr = translateOrDefault(sheetTemplate.aiPersonas[gemId], "");
       if (templateInstr) personaInstructions = templateInstr;
    }

    const alias = translateOrDefault(gem.name, "Assistant");

    return `${personaInstructions}

Tu es un assistant de Maître de Jeu expert pour GM-OS. Ton alias actuel est "${alias}".
${i18n.language === 'fr' 
      ? 'Réponds impérativement en français, de manière concise et immersive.' 
      : 'You must answer in English, in a concise and immersive way.'}
${i18n.language === 'fr'
      // La pagination du corpus vient de NotebookLM et ne renvoie pas au livre :
      // neuf fiches Dune citaient des pages au-delà de la dernière page de
      // l'ouvrage. Une citation fausse coûte plus qu'une citation absente — le MJ
      // ouvre le livre en pleine partie et ne trouve rien. On cite donc la fiche.
      ? 'Cite la fiche source (son chemin) pour les points de règle. N\'invente jamais de numéro de page et ne recopie pas ceux des fiches : leur pagination n\'est pas fiable.'
      : 'Cite the source document (its path) for rule points. Never invent page numbers, and do not repeat those found in the documents: their pagination is unreliable.'}

CONTEXTE RÉCUPÉRÉ (RAG + SESSION) :
${fullContext}`;
  }

  /**
   * Génère une réponse structurée (JSON) de manière agnostique.
   * Supporte Gemini (mode JSON natif + Multimodal) et Ollama (via extraction Regex).
   */
  public async generateJSON<T>(
    prompt: string, 
    systemPrompt: string, 
    attachments?: { data: string, mimeType: string }[],
    /**
     * `sansPersona` : l'invite part telle qu'elle a été écrite, sans persona,
     * sans contexte de séance et sans RAG. À demander pour toute **extraction**
     * — une tâche structurée n'a que faire d'une voix de meneur, et celle de la
     * campagne active n'a rien à faire dans la dérivation d'un autre jeu.
     */
    options: {
      lite?: boolean;
      sansPersona?: boolean;
      schema?: Record<string, unknown>;
      /**
       * Le plafond de génération, pour les appelants qui rendent des LISTES.
       *
       * La Forge de campagne en est une : mesuré le 2026-08-17, son groupe
       * `lieux` a été coupé à 8 091 caractères par le défaut de 2048 tokens,
       * quand 143 autres réponses tenaient dedans.
       */
      plafondDeGeneration?: number;
      /** Ce qui s'affichera si cette requête occupe le modèle — voir `generateText`. */
      libelle?: string;
    } = {}
  ): Promise<T> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    console.log(`[AIService] generateJSON call (${activeProvider}) ${attachments?.length ? `with ${attachments.length} attachments` : ''}`);

    // 1. CAS GEMINI (NATIF + VISUEL)
    if (activeProvider === 'gemini') {
      const apiKey = config.apiKey?.trim().replace(/[\r\n]/g, '');
      const model = config.modelId || 'gemini-1.5-flash';
      let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      if (!apiKey) {
        console.error("[AIService] ❌ Erreur : Clé API Gemini absente !");
      } else {
        let finalKey = apiKey;
        // Détection de clé doublée (bug potentiel de synchronisation)
        if (apiKey.length > 20 && apiKey.length % 2 === 0) {
          const half = apiKey.length / 2;
          if (apiKey.substring(0, half) === apiKey.substring(half)) {
            console.warn("[AIService] ⚠️ Détection d'une clé doublée ! Correction automatique...");
            finalKey = apiKey.substring(0, half);
          }
        }
        
        const masked = `${finalKey.substring(0, 5)}...${finalKey.substring(finalKey.length - 5)}`;
        console.log(`[AIService] 🔑 Utilisation de la clé Gemini: ${masked} (${finalKey.length} chars)`);
        
        // On met à jour l'URL avec la clé potentiellement corrigée
        if (finalKey !== apiKey) {
          const model = config.modelId || 'gemini-1.5-flash';
          const newUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${finalKey}`;
          // On continue avec la clé corrigée
          url = newUrl;
        }
      }
      
      if (!window.appBridge?.ai?.proxyRequest) throw new Error("Bridge AI non disponible.");

      const TIMEOUT_MS = 2700000; // 45 minutes
      
      const payload: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          response_mime_type: "application/json",
          temperature: 0.2
        }
      };

      if (systemPrompt) {
        payload.system_instruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      if (attachments && attachments.length > 0) {
        attachments.forEach(attachment => {
          const base64Data = attachment.data.includes('base64,') 
            ? attachment.data.split('base64,')[1] 
            : attachment.data;
            
          payload.contents[0].parts.push({
            inline_data: {
              mime_type: attachment.mimeType,
              data: base64Data
            }
          });
        });
      }

      let response: any;
      let retries = 0;
      const MAX_RETRIES = 2;

      while (retries <= MAX_RETRIES) {
        try {
          response = await Promise.race([
            window.appBridge.ai.proxyRequest(url, 'POST', { 'Content-Type': 'application/json' }, payload),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("TIMEOUT: Gemini n'a pas répondu après 45min.")), TIMEOUT_MS)
            )
          ]) as any;

          if (response.ok) break;

          // Si pas OK, on regarde si c'est une erreur retryable (503, 429)
          const isRetryable = response.status === 503 || response.status === 429;
          if (isRetryable && retries < MAX_RETRIES) {
            throw new Error(`Status ${response.status}`);
          }
          break; // Pas retryable ou max atteint
        } catch (error: any) {
          const errorMsg = error.message || '';
          const isRetryableError = errorMsg.includes('503') || errorMsg.includes('429') || errorMsg.includes('Service Unavailable');
          
          if (isRetryableError && retries < MAX_RETRIES) {
            retries++;
            const delay = retries * 2000;
            console.warn(`[AIService] ⏳ Erreur temporaire Gemini (${errorMsg}). Tentative ${retries}/${MAX_RETRIES} dans ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }

      if (!response.ok) {
        const errorData = response.data;
        console.error("[AIService] Gemini API Error Details:", typeof errorData === 'object' ? JSON.stringify(errorData) : errorData);
        throw new Error(`Erreur API Gemini JSON: ${response.statusText || response.status}. ${typeof errorData === 'object' ? (errorData.error?.message || '') : ''}`);
      }

      const data = response.data as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log(`[AIService] Raw JSON response from Gemini (first 200 chars):`, text?.substring(0, 200));
      if (!text) throw new Error("Réponse JSON vide de Gemini.");
      
      return JSON.parse(text) as T;
    }

    // 2. CAS OLLAMA / ANTHROPIC / AUTRES (EXTRACTION)
    const enhancedSystemPrompt = `${systemPrompt}
    
    IMPORTANT : Tu dois répondre UNIQUEMENT avec un bloc JSON valide. 
    Ne fournis aucune explication, aucun commentaire ni aucun bloc de code Markdown autour du JSON.
    Ta réponse doit commencer par { ou [ et se terminer par } ou ].`;

    const response = await this.generateText(
      prompt, enhancedSystemPrompt, 'sage', {}, options.lite, true, options.sansPersona, options.schema,
      options.plafondDeGeneration, options.libelle,
    );
    console.log(`[AIService] Raw JSON response from ${activeProvider} (first 200 chars):`, response.text.substring(0, 200));
    
    try {
      return this.extractStructuredJSON<T>(response.text);
    } catch (err) {
      console.error("[AIService] Extraction JSON échouée. Tentative de parsing brut...", err);
      try {
        return JSON.parse(response.text) as T;
      } catch {
        /*
          **La cause remonte, elle n'est plus remplacée.** Ce catch rendait
          « Impossible de parser la réponse en JSON » quoi qu'il arrive — y
          compris quand le modèle n'avait **rien** renvoyé. La Forge dérivée a
          affiché ce message huit fois de suite le 2026-08-12 en accusant le
          parsing, alors que la réponse était vide : le diagnostic était à
          l'écran, et il désignait le mauvais coupable.
        */
        throw err instanceof Error ? err : new Error("Impossible de parser la réponse en JSON.");
      }
    }
  }

  /**
   * Extrait un bloc JSON d'une chaîne de texte potentiellement polluée.
   */
  private extractStructuredJSON<T>(input: string): T {
    /*
      Une réponse vide n'est pas un problème d'extraction, et le dire comme tel
      envoie chercher au mauvais endroit.

      Cas réel du 2026-08-12 : `gemma4:12b` raisonne avant de répondre. Ollama
      range cette réflexion dans `message.thinking` et laisse `message.content`
      vide tant qu'elle dure ; le plafond `num_predict` tombe pendant le
      raisonnement, et l'application reçoit une chaîne vide. Elle annonçait
      alors « le modèle a peut-être renvoyé du texte conversationnel » — il n'y
      avait aucun texte.
    */
    if (!input || !input.trim()) {
      throw new Error(
        "Le modèle n'a renvoyé aucun texte. S'il raisonne avant de répondre, sa réflexion " +
        "a pu consommer tout le budget de génération (`num_predict`) : demander `think: false`, " +
        "ou relever le plafond.",
      );
    }

    // Nettoyage des balises markdown si présentes
    const cleaned = input.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Recherche de la structure JSON la plus large possible
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    
    if (!jsonMatch) {
      console.error("[AIService] Échec d'extraction JSON. Réponse brute (début):", input.substring(0, 300));
      throw new Error("Aucun bloc JSON détecté dans la chaîne. Le modèle a peut-être renvoyé du texte conversationnel au lieu de données structurées.");
    }
    
    const jsonStr = jsonMatch[0];

    /*
      **Du texte après le JSON est un diagnostic, pas un détail.**

      La grammaire de `format: 'json'` arrête la génération à l'accolade
      fermante : il ne PEUT rien y avoir après. Une réponse qui se poursuit
      prouve donc que la contrainte n'a pas été appliquée — et comme le
      décodage glouton voyage dans le même bloc d'options, il ne l'a pas été
      non plus. Relevé le 2026-08-12 : « …}]}}_Note: The prompt instructions
      were to… », et un JSON aux guillemets échappés juste avant.

      On le dit ici, au moment où l'on tient la preuve, plutôt que de laisser
      chercher trois processus plus loin.
    */
    const apres = cleaned.slice(cleaned.indexOf(jsonStr) + jsonStr.length).trim();
    if (apres) {
      console.warn(
        '[AIService] La réponse continue APRÈS le JSON, et le modèle a donc voulu commenter son ' +
        `travail. Suite ignorée : « ${apres.slice(0, 120)} »`,
      );
    }

    try {
      // First attempt: direct parse
      return JSON.parse(jsonStr) as T;
    } catch (parseError) {
      console.warn("[AIService] Initial JSON parse failed, attempting sanitization...");
      try {
        // Second attempt: sanitize common AI mistakes
        const sanitized = this.sanitizeJSON(jsonStr);
        return JSON.parse(sanitized) as T;
      } catch (secondError) {
        /*
          **Troisième tentative : les guillemets échappés qui font structure.**

          Relevé le 2026-08-12 sur la fiche de personnage d'Alien. Le modèle
          part bien, puis bascule en cours de route :

              {"id":"stress","label":"Niveau de Stress"},{"id\":\"recit\",...

          Et c'est le piège : `"id\":\"recit\"` est du JSON **grammaticalement
          valide** — une seule chaîne au contenu bizarre. La grammaire de
          `format: 'json'` ne peut donc pas l'arrêter, et le modèle a rempli
          2 048 tokens d'une chaîne unique avant d'être coupé.

          La réparation est une **hypothèse validée par le parseur** : on
          dé-échappe, et on ne retient le résultat que s'il se parse. Si non,
          l'erreur d'origine repart intacte. Une réparation qui ne peut pas se
          tromper vaut mieux qu'un groupe perdu au bout de deux minutes.
        */
        try {
          const desechappe = this.sanitizeJSON(jsonStr.replace(/\\"/g, '"'));
          const repare = JSON.parse(desechappe) as T;
          console.warn(
            "[AIService] JSON réparé : le modèle échappait ses guillemets en pleine structure.",
          );
          return repare;
        } catch {
          console.error("[AIService] Erreur de parsing du JSON extrait:", jsonStr.substring(0, 500));
          throw parseError; // Throw the original error for better context
        }
      }
    }
  }

  /**
   * Tries to repair common JSON malformations from AI models.
   */
  private sanitizeJSON(json: string): string {
    let s = json.trim();
    
    // 1. Remove trailing commas before closing braces/brackets
    s = s.replace(/,\s*([\}\]])/g, '$1');
    
    // 2. Fix unquoted keys or keys with single quotes
    // Matches keys that are either unquoted (alphanumeric/underscore) or single-quoted
    s = s.replace(/([{,]\s*)(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, (_match, prefix, _q1, key, _q2) => {
      return `${prefix}"${key}":`;
    });

    // 3. Convert single quotes to double quotes for string values (heuristic)
    // Be careful not to break apostrophes inside words. 
    // This is a simplified version targeting 'value' pattern.
    s = s.replace(/:\s*'([^']*)'/g, ': "$1"');

    return s;
  }

  /**
   * Extrait les données dynamiques des stores pour fournir un contexte "Vivant" à l'IA.
   */
  private getLiveSessionContext(lite: boolean = false): string {
    try {
      const osStore = useSessionOSStore.getState();
      const journalStore = useJournalStore.getState();
      const activeCampaignId = osStore.activeCampaignId;

      if (!activeCampaignId) return "Aucune campagne active.";

      const campaign = osStore.campaigns.find(c => c.id === activeCampaignId);
      
      // 1. Personnages Joueurs (Vitals & Info)
      const party = osStore.players.flatMap(p => p.characters)
        .filter(c => c.campaignId === activeCampaignId)
        // Le second chemin de contexte, avec le même défaut que
        // `useOracleContext` : il annonçait des points de vie à un jeu qui n'en
        // a pas. `decrireLaSante` se tait quand il n'y a rien à dire.
        .map(c => {
          const sante = decrireLaSante(c);
          return `- ${c.name} (${c.classRace})${sante ? `: ${sante}` : ''}`
            + (c.description && !lite ? ` - ${c.description}` : '');
        });

      // 2. PNJs / Entités actives (Limit in lite mode)
      let entitiesBase = osStore.entities.filter(e => e.campaignId === activeCampaignId && e.status === 'alive');
      if (lite) entitiesBase = entitiesBase.slice(0, 5);

      const npcs = entitiesBase.map(e => `- ${e.name} (${e.role})${!lite ? `: ${e.description}` : ''}`);

      // 3. Indices (uniquement révélés) - Skip in lite mode unless explicit
      const clues = lite ? [] : (osStore.clues || [])
        .filter(c => c.campaignId === activeCampaignId && c.isRevealed)
        .map(c => `- ${c.title}: ${c.content}`);

      /*
        4. Événements récents (Journal/Chronique)

        **`slice(-10)` prenait les dix plus ANCIENS**, le journal empilant le
        plus récent en tête. L'Oracle recevait donc le début de la séance sous un
        intitulé qui annonce la fin, et rien ne le signalait : ni erreur, ni
        vide — une réponse plausible, simplement fondée sur ce qui ne se joue
        plus. Trouvé le 2026-08-20 en vérifiant l'étape 10 avant de l'écrire.

        Le sens de la pile est su **à un seul endroit** désormais, dans
        `lesDerniersEvenements` : c'est le même remède que pour les trois listes
        de session et les onze lecteurs du module de santé.
      */
      const lastEvents = lite ? [] : lesDerniersEvenements(
        journalStore.journals.find(j => j.id === journalStore.activeJournalId)?.events, 10,
      ).map(e => `[${new Date(e.timestamp).toLocaleTimeString('fr-FR')}] ${e.title}: ${e.content}`);

      if (lite) {
        return `## Campagne: ${campaign?.name || "Inconnue"}
### Groupe (PJ)
${party.length > 0 ? party.join('\n') : "N/A"}
### PNJs & Alliés
${npcs.length > 0 ? npcs.join('\n') : "N/A"}`;
      }

      return `## Campagne: ${campaign?.name || "Inconnue"}
${campaign?.synopsis ? `Synopsis: ${campaign.synopsis}\n` : ''}

### Groupe (PJ)
${party.length > 0 ? party.join('\n') : "Aucun personnage joueur actif."}

### PNJs & Alliés
${npcs.length > 0 ? npcs.join('\n') : "Aucun PNJ notable recensé."}

### Indices Révélés
${clues.length > 0 ? clues.join('\n') : "Aucun indice découvert pour le moment."}

### Historique Récent (Chronologie)
${lastEvents.length > 0 ? lastEvents.join('\n') : "Aucun événement récent dans la chronique."}
`;
    } catch (err) {
      console.error("[AIService] Failed to gather live context:", err);
      return "Erreur lors de la récupération du contexte session.";
    }
  }
}

export const aiService = AIService.getInstance();
