import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider, AIModelConfig } from '../modules/ai/types';

/** L'entrée du trousseau où vit le jeton de génération d'image. */
const CLE_DU_JETON_IMAGE = 'ai-key-image';

/**
 * La réhydratation par-dessus l'état en mémoire — **sans effacer les clés**.
 *
 * **Le défaut que David vivait tous les jours** (« mon trousseau perd tout le
 * temps les clés, je dois constamment les remettre ») : la fusion remplaçait
 * chaque fournisseur **en bloc** par sa version enregistrée — et cette
 * version-là n'a jamais de `apiKey`, puisque `partialize` la retire à dessein.
 *
 * Or le démarrage charge les clés depuis le coffre **avant** que la
 * réhydratation n'arrive : le stockage est IndexedDB, donc asynchrone. La
 * réhydratation atterrissait ensuite sur des clés déjà en mémoire et les
 * écrasait par du vide. Le coffre n'avait rien perdu — il était relu, puis
 * recouvert. *Une clé qui disparaît sans erreur ressemble à un coffre qui
 * oublie ; c'était une fusion qui écrase.*
 *
 * C'est le même mécanisme que la perte de campagnes du 2026-08-07, cité dans
 * `PersistenceService` : **une fusion superficielle qui remplace des objets
 * entiers**. Ici on fusionne champ par champ — l'état enregistré ne portant pas
 * de `apiKey`, il ne peut plus en supprimer une.
 *
 * Le correctif rend surtout **l'ordre indifférent** : que le coffre soit relu
 * avant ou après la réhydratation, la clé survit. Une correction qui se
 * contenterait de retarder l'un des deux marcherait jusqu'au jour où la machine
 * est lente.
 */
export function fusionnerEtatIA(persistedState: unknown, currentState: AIState): AIState {
    const enregistre = (persistedState ?? {}) as Partial<AIState>;

    const configs = Object.fromEntries(
        Object.entries(currentState.configs).map(([nom, config]) => [
            nom,
            // Champ par champ : `modelId` et `endpoint` viennent de l'état
            // enregistré, `apiKey` reste celui qu'on a en mémoire.
            { ...config, ...(enregistre.configs?.[nom as AIProvider] ?? {}) },
        ]),
    ) as Record<AIProvider, AIModelConfig>;

    return {
        ...currentState,
        ...enregistre,
        configs,
        image: { ...currentState.image, ...(enregistre.image ?? {}) },
    };
}

/**
 * De quoi appeler un service de génération d'image.
 *
 * **Séparé du fournisseur de texte, et c'est délibéré.** `AIProvider` désigne
 * qui répond aux questions ; `activeProvider` le sélectionne. Générer une image
 * est un autre métier : Cloudflare Workers AI ne sait pas tenir une
 * conversation, et l'inscrire dans la même liste l'aurait proposé là où il ne
 * peut rien répondre.
 *
 * C'est d'ailleurs déjà la réalité du code : sur les trois recours de
 * `generateImage`, deux ignorent complètement `activeProvider`.
 */
export interface ConfigDImage {
  /** Identifiant de compte Cloudflare — visible sur le tableau de bord Workers AI. */
  accountId?: string;
  /**
   * Jeton d'API.
   *
   * **Jamais persisté en clair** : il suit le même chemin que les clés de
   * conversation — trousseau natif à l'écriture, `partialize` qui le retire de
   * l'état enregistré.
   */
  apiKey?: string;
  /** Modèle appelé. `flux-1-schnell` par défaut : quatre pas suffisent. */
  modelId: string;
}

interface AIState {
  activeProvider: AIProvider;
  configs: Record<AIProvider, AIModelConfig>;
  image: ConfigDImage;
  streamEnabled: boolean;
  liteContext: boolean;
  
  // Actions
  setProvider: (provider: AIProvider) => void;
  updateConfig: (provider: AIProvider, config: Partial<AIModelConfig>) => void;
  updateImageConfig: (config: Partial<ConfigDImage>) => Promise<void>;
  getApiKey: (provider: AIProvider) => string | undefined;
  setStreamEnabled: (enabled: boolean) => void;
  setLiteContext: (enabled: boolean) => void;
  syncWithKeychain: () => Promise<void>;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      activeProvider: 'gemini',
      configs: {
        gemini: { provider: 'gemini', modelId: 'gemini-1.5-flash' },
        openai: { provider: 'openai', modelId: 'gpt-4o' },
        anthropic: { provider: 'anthropic', modelId: 'claude-3-5-sonnet-latest' },
        ollama: { 
          provider: 'ollama', 
          modelId: 'phi3',
          endpoint: 'http://127.0.0.1:11434'
        },
        ollama_cloud: {
          provider: 'ollama_cloud',
          modelId: 'llama3',
          endpoint: 'https://votre-ollama-cloud.com'
        },
        custom: {
          provider: 'custom',
          modelId: 'custom-model',
          endpoint: 'https://api.custom.com/v1'
        }
      },
      image: { modelId: '@cf/black-forest-labs/flux-1-schnell' },
      streamEnabled: true,
      liteContext: false,

      setProvider: (provider) => set({ activeProvider: provider }),

      updateConfig: async (provider, config) => {
        /*
          **Une clé va au trousseau, jamais au magasin persisté** — `partialize`
          la retire de l'état enregistré, c'est voulu.

          **Le champ vide ne part PAS au coffre.** Ce champ de saisie appelle à
          chaque frappe : vider la case déclenchait donc une écriture de chaîne
          vide, et `getSecret` rendant `null` sur une chaîne vide, l'entrée était
          supprimée sans un mot. Le coffre refuse désormais aussi de son côté —
          les deux, parce qu'une garde côté rendu évite l'aller-retour et qu'une
          garde côté coffre protège les autres appelants.

          Effacer une clé reste possible : c'est `deleteSecret`, un geste qu'on
          demande explicitement.
        */
        if (config.apiKey !== undefined && config.apiKey.trim() !== '') {
          if (!window.appBridge?.security) {
            // Ne plus échouer sans un mot : sans pont, la clé ne vivra que le
            // temps de la session et disparaîtra au redémarrage. C'est
            // exactement ce que l'utilisateur croyait être « un coffre qui perd ».
            console.error(
              `[AI Store] ⚠️ Pont de sécurité absent : la clé "${provider}" reste en mémoire `
              + 'et sera perdue au prochain démarrage.',
            );
          } else {
            try {
              const resultat = await window.appBridge.security.saveSecret(`ai-key-${provider}`, config.apiKey);
              if (!resultat?.ecrit) {
                console.error(`[AI Store] ❌ Clé "${provider}" non enregistrée : ${resultat?.raison ?? 'raison inconnue'}`);
              }
            } catch (err) {
              console.error(`[AI Store] ❌ Échec de la sauvegarde dans le trousseau pour "${provider}":`, err);
            }
          }
        }

        set((state) => ({
          configs: {
            ...state.configs,
            [provider]: { 
              ...state.configs[provider], 
              ...config
            }
          }
        }));
      },

      /** Même traitement que les clés de conversation, y compris le refus du vide. */
      updateImageConfig: async (config) => {
        if (config.apiKey !== undefined && config.apiKey.trim() !== '' && window.appBridge?.security) {
          try {
            const resultat = await window.appBridge.security.saveSecret(CLE_DU_JETON_IMAGE, config.apiKey);
            if (!resultat?.ecrit) {
              console.error(`[AI Store] Jeton d'image non enregistré : ${resultat?.raison ?? 'raison inconnue'}`);
            }
          } catch (err) {
            console.error("[AI Store] Echec de la sauvegarde du jeton d'image :", err);
          }
        }
        set((state) => ({ image: { ...state.image, ...config } }));
      },

      getApiKey: (provider) => get().configs[provider].apiKey,
      
      setStreamEnabled: (streamEnabled) => set({ streamEnabled }),
      setLiteContext: (liteContext) => set({ liteContext }),

      syncWithKeychain: async () => {
        const security = window.appBridge?.security;
        if (!security) return;

        console.log('[AI Store] 🔐 Début de synchronisation avec le trousseau...');
        let hasChanges = false;
        
        /*
          `ollama_cloud` manquait à cette liste : une instance distante protégée
          par une clé la perdait à chaque démarrage, sans que rien ne le dise.
        */
        for (const provider of ['gemini', 'openai', 'anthropic', 'custom', 'ollama_cloud'] as AIProvider[]) {
          const secretId = `ai-key-${provider}`;
          try {
            // 1. Récupération : On charge la clé depuis le trousseau natif
            const securedKey = await security.getSecret(secretId);
            
            if (securedKey && typeof securedKey === 'string' && securedKey.length > 5) {
              console.log(`[AI Store] ✅ Clé récupérée avec succès pour "${provider}" (${securedKey.length} chars)`);
              set((state) => ({
                configs: {
                  ...state.configs,
                  [provider]: {
                    ...state.configs[provider],
                    apiKey: securedKey
                  }
                }
              }));
              hasChanges = true;
            } else {
              // 2. Migration : Si on a une clé en mémoire mais pas dans le trousseau, on la sauvegarde
              const state = get();
              const existingKey = state.configs[provider]?.apiKey;
              if (existingKey && existingKey.length > 5) {
                console.log(`[AI Store] 💾 Migration : Sauvegarde de la clé "${provider}" vers le trousseau...`);
                await security.saveSecret(secretId, existingKey);
              }
            }
          } catch (err) {
            console.error(`[AI Store] ❌ Erreur critique Keychain pour "${provider}":`, err);
          }
        }

        /*
          Le jeton d'image suit le même chemin que les autres, et pour la même
          raison : `partialize` le retire de l'état enregistré, donc sans cette
          relecture il serait perdu à chaque redémarrage.
        */
        try {
          const jeton = await security.getSecret(CLE_DU_JETON_IMAGE);
          if (jeton && typeof jeton === 'string' && jeton.length > 5) {
            set((state) => ({ image: { ...state.image, apiKey: jeton } }));
            hasChanges = true;
          } else {
            const existant = get().image.apiKey;
            if (existant && existant.length > 5) await security.saveSecret(CLE_DU_JETON_IMAGE, existant);
          }
        } catch (err) {
          console.error("[AI Store] Erreur Keychain pour le jeton d'image :", err);
        }

        if (hasChanges) {
          console.log('[AI Store] 🔐 Synchronisation terminée. État mis à jour.');
        }
      }
    }),
    {
      name: 'gm-os-ai-settings',
      // On exclut totalement les clés API de la persistance brute pour la sécurité
      partialize: (state) => {
        const cleanConfigs = Object.fromEntries(
          Object.entries(state.configs).map(([k, v]) => {
            const { apiKey, ...rest } = v;
            return [k, rest];
          })
        );
        // Le jeton d'image est retiré comme les clés de conversation : il vit
        // dans le trousseau, et nulle part ailleurs.
        const { apiKey: _jeton, ...imageSansJeton } = state.image;
        return {
          activeProvider: state.activeProvider,
          streamEnabled: state.streamEnabled,
          liteContext: state.liteContext,
          configs: cleanConfigs,
          image: imageSansJeton
        };
      },
      merge: (persistedState, currentState) => fusionnerEtatIA(persistedState, currentState),
    }
  )
);
