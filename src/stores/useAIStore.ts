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
            // enregistré, le reste de la mémoire.
            { ...config, ...(enregistre.configs?.[nom as AIProvider] ?? {}) },
        ]),
    ) as Record<AIProvider, AIModelConfig>;

    return {
        ...currentState,
        ...enregistre,
        configs,
        image: { ...currentState.image, ...(enregistre.image ?? {}) },
        /*
          ⛔ **La même course, sur ce qui a remplacé les clés.**

          Les clés ne vivent plus en mémoire — c'est `clesPresentes` qui dit
          lesquelles existent, et il est rempli depuis le coffre au démarrage,
          donc de façon asynchrone comme avant. `...enregistre` le remettrait à
          ce que l'état persisté contient, c'est-à-dire rien : les cases se
          videraient toutes seules quelques instants après l'ouverture.

          *C'est mot pour mot le défaut de 2026-08 — « mon trousseau perd tout
          le temps les clés » — déplacé d'un cran.* On garde donc la mémoire, et
          l'ordre redevient indifférent.
        */
        clesPresentes: currentState.clesPresentes,
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
  /** Modèle appelé. `flux-1-schnell` par défaut : quatre pas suffisent. */
  modelId: string;
}

/** Ce qui peut porter une cle : les fournisseurs, plus le jeton d'image. */
export type PorteurDeCle = AIProvider | 'image';

/**
 * Les porteurs que le demarrage interroge.
 *
 * ⚠️ `ollama_cloud` y figure : une instance distante protegee par une cle la
 * perdait a chaque demarrage faute d'etre dans cette liste, sans que rien ne le
 * dise. `ollama` n'y est pas — reseau local, aucune cle.
 */
export const PORTEURS: PorteurDeCle[] =
  ['gemini', 'openai', 'anthropic', 'custom', 'ollama_cloud', 'image'];

/** L'entree du coffre qui porte la cle d'un porteur. */
export const entreeDuCoffre = (porteur: PorteurDeCle): string =>
  porteur === 'image' ? CLE_DU_JETON_IMAGE : `ai-key-${porteur}`;

interface AIState {
  activeProvider: AIProvider;
  configs: Record<AIProvider, AIModelConfig>;
  image: ConfigDImage;
  streamEnabled: boolean;
  liteContext: boolean;
  /**
   * **Qui a une cle, et rien de plus.**
   *
   * Le magasin ne detient aucune valeur : le coffre du processus principal les
   * garde et les pose lui-meme sur les requetes sortantes. Ce qui reste ici est
   * ce dont les ecrans ont besoin — savoir si le champ est rempli, pour dire
   * « configuree » plutot que d'afficher un secret.
   */
  clesPresentes: Partial<Record<PorteurDeCle, boolean>>;
  
  // Actions
  setProvider: (provider: AIProvider) => void;
  updateConfig: (provider: AIProvider, config: Partial<AIModelConfig>) => void;
  updateImageConfig: (config: Partial<ConfigDImage>) => Promise<void>;
  /** Ecrit une cle dans le coffre. Rend `false` si l'ecriture a echoue. */
  enregistrerLaCle: (porteur: PorteurDeCle, valeur: string) => Promise<boolean>;
  /** Efface une cle du coffre — un geste explicite, jamais un effet de bord. */
  oublierLaCle: (porteur: PorteurDeCle) => Promise<void>;
  aUneCle: (porteur: PorteurDeCle) => boolean;
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
      /* Rempli par `syncWithKeychain` au demarrage, depuis le coffre. */
      clesPresentes: {},
      streamEnabled: true,
      liteContext: false,

      setProvider: (provider) => set({ activeProvider: provider }),

      /*
        **`updateConfig` ne touche plus aux cles.** Elle ne porte que ce qui est
        affichable — modele, endpoint. Une cle passe par `enregistrerLaCle`, qui
        l'ecrit au coffre et n'en garde que la presence : le type
        `AIModelConfig` n'a plus de champ pour la retenir.
      */
      updateConfig: (provider, config) => {
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

      /** L'identifiant de compte et le modele. Le jeton passe par `enregistrerLaCle`. */
      updateImageConfig: async (config) => {
        set((state) => ({ image: { ...state.image, ...config } }));
      },

      /**
       * **Le seul chemin par lequel une cle entre.**
       *
       * Elle va au coffre et n'en ressort jamais : ce qui reste ici est un
       * booleen. L'ecran affiche « configuree », il ne relit pas.
       *
       * ⚠️ **Le champ vide ne part PAS au coffre.** La saisie appelait a chaque
       * frappe : vider la case declenchait une ecriture de chaine vide, et
       * `getSecret` rendant `null` sur une chaine vide, l'entree disparaissait
       * sans un mot. Effacer une cle est un geste explicite — `oublierLaCle`.
       */
      enregistrerLaCle: async (porteur, valeur) => {
        const propre = valeur.trim();
        if (propre === '') return false;

        const security = window.appBridge?.security;
        if (!security) {
          /* Sans pont, la cle n'irait nulle part. Le dire vaut mieux que de
             laisser croire a un coffre qui oublie — c'est exactement ce que
             David a vecu en aout. */
          console.error(
            `[AI Store] ⚠️ Pont de sécurité absent : la clé « ${porteur} » n'a pas été enregistrée.`,
          );
          return false;
        }

        try {
          const resultat = await security.saveSecret(entreeDuCoffre(porteur), propre);
          if (!resultat?.ecrit) {
            console.error(`[AI Store] ❌ Clé « ${porteur} » non enregistrée : ${resultat?.raison ?? 'raison inconnue'}`);
            return false;
          }
        } catch (err) {
          console.error(`[AI Store] ❌ Échec de l'écriture au trousseau pour « ${porteur} » :`, err);
          return false;
        }

        set((state) => ({ clesPresentes: { ...state.clesPresentes, [porteur]: true } }));
        return true;
      },

      oublierLaCle: async (porteur) => {
        try {
          await window.appBridge?.security?.deleteSecret?.(entreeDuCoffre(porteur));
        } catch (err) {
          console.error(`[AI Store] Échec de l'effacement de la clé « ${porteur} » :`, err);
          return;
        }
        set((state) => ({ clesPresentes: { ...state.clesPresentes, [porteur]: false } }));
      },

      aUneCle: (porteur) => get().clesPresentes[porteur] === true,
      
      setStreamEnabled: (streamEnabled) => set({ streamEnabled }),
      setLiteContext: (liteContext) => set({ liteContext }),

      /**
       * **Relit le coffre — pour savoir QUI a une clé, jamais laquelle.**
       *
       * ⭐ Une seule question au processus principal (`etatDuCoffre`), qui rend
       * les **noms** des entrées et pas leurs valeurs. La version d'avant
       * appelait `getSecret` six fois et ramenait six secrets dans la mémoire du
       * rendu, pour n'en faire que des booléens à l'écran.
       *
       * *Le commentaire d'`etatDuCoffre` disait déjà à quoi il servait : « un
       * panneau de réglages qui affiche des champs vides ne peut pas distinguer
       * "tu n'as jamais saisi de clé" de "le coffre n'a pas pu être lu". » Il
       * attendait cet appelant.*
       *
       * ⚠️ Un coffre **illisible** n'est pas un coffre vide. On laisse alors
       * `clesPresentes` tel quel plutôt que de tout marquer absent : afficher
       * « aucune clé » inviterait à toutes les retaper, ce qui est précisément
       * le geste qui a failli les perdre.
       */
      syncWithKeychain: async () => {
        const security = window.appBridge?.security;
        if (!security?.etatDuCoffre) return;

        try {
          const { etat, entrees } = await security.etatDuCoffre();

          if (etat === 'illisible') {
            console.error('[AI Store] ⚠️ Coffre illisible : ne retapez aucune clé, elles y sont toujours.');
            return;
          }

          const presentes: Partial<Record<PorteurDeCle, boolean>> = {};
          for (const porteur of PORTEURS) {
            presentes[porteur] = entrees.includes(entreeDuCoffre(porteur));
          }

          set({ clesPresentes: presentes });
          const compte = Object.values(presentes).filter(Boolean).length;
          console.log(`[AI Store] 🔐 Coffre lu : ${compte} clé(s) enregistrée(s).`);
        } catch (err) {
          console.error('[AI Store] ❌ Lecture du coffre impossible :', err);
        }
      }
    }),
    {
      name: 'gm-os-ai-settings',
      // On exclut totalement les clés API de la persistance brute pour la sécurité
      /*
        **Il n'y a plus de cle a retirer ici** : le type `AIModelConfig` n'en
        porte pas, et `ConfigDImage` non plus. Ce qui se persiste est ce que le
        meneur a choisi ; ce qui vient du coffre n'est pas de l'etat a garder.

        `clesPresentes` est donc absent a dessein : il se relit au demarrage.
        Le persister le figerait a ce qu'il etait, et une cle effacee hors de
        l'application continuerait d'etre annoncee comme presente.
      */
      partialize: (state) => ({
        activeProvider: state.activeProvider,
        streamEnabled: state.streamEnabled,
        liteContext: state.liteContext,
        configs: state.configs,
        image: state.image,
      }),
      merge: (persistedState, currentState) => fusionnerEtatIA(persistedState, currentState),
    }
  )
);
