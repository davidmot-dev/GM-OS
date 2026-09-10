# Architecture IA Hybride (GM-OS v5)

## Vue d'Ensemble

GM-OS v5 utilise une architecture hybride permettant de basculer dynamiquement entre une IA locale (**Ollama**) et des services Cloud (**Gemini**, **Anthropic**, **OpenAI**). Cette approche garantit la confidentialité des données et permet un fonctionnement offline tout en conservant la puissance des modèles massifs pour les tâches complexes.

## Composants Clés

### 1. `OllamaService` (Main Process)
Gère la communication directe avec le serveur local Ollama (généralement sur `http://localhost:11434`).
- **Parsing Robuste** : Nettoyage des sorties Markdown/JSON et gestion des erreurs de flux.
- **Support Base64** : Capacité à traiter des images pour les modèles multimodaux locaux.

### 2. `AIService` (Renderer Process)
Interface unifiée pour le reste de l'application.
- **Routage Dynamique** : Selon les réglages utilisateur, les requêtes sont envoyées soit vers le bridge Ollama, soit vers les APIs Cloud.
- ⚠️ **Il ne porte AUCUNE clé** (depuis le 2026-09-10). Il déclare pour quel fournisseur il parle, et le processus principal pose la clé lui-même. Voir « Sécurité » plus bas.
- **Gestionnaire de Modèles** : Filtre les modèles disponibles selon le fournisseur choisi.

## Flux de Données : Voice Profiling

1. `useVoiceStore` demande un profil (ex: "Orc Barman").
2. `AIService` envoie le prompt enrichi.
3. Si **Ollama** est actif :
    - Le prompt est traité localement (ex: par `phi3`).
    - Le JSON retourné est parsé et validé par le service.
4. Les paramètres (Pitch, Reverb, etc.) sont appliqués à `VoiceEngine`.

## Sécurité & Performance

### 🔑 La garde des clés (2026-09-10/11)

**Une clé d'API ne traverse jamais le pont.** L'appel du renderer part sans
identifiant ; `ai:proxy-request` reçoit un **fournisseur déclaré**, et le
processus principal fait deux choses avant qu'un octet ne parte :

1. **`verdictDeLHote(fournisseur, url)`** — l'hôte visé est-il ouvert à ce
   fournisseur ? Un fournisseur dont l'hôte est connu ne peut joindre que
   celui-là ; `custom` et `ollama` sont déclarés **libres**, parce que c'est le
   meneur qui nomme leur endpoint. Un fournisseur **absent de la table** est
   refusé — de sorte qu'un chemin réseau ajouté sans y passer échoue au
   développement, jamais en séance.
2. **`poserLaCle(...)`** — la clé est lue dans le coffre et attachée là où l'API
   l'attend.

⚠️ **Elles ne se posent pas toutes au même endroit.** Anthropic lit un en-tête
`x-api-key`, Custom et Cloudflare un `Authorization: Bearer`, et **Gemini attend
la sienne dans l'URL** (`?key=…`). C'est la plus exposée des trois — une URL
voyage dans les journaux du serveur d'en face — et c'est celle qui a le plus
d'appels. Le message d'erreur de `main.ts` ne journalise donc plus que l'hôte et
le chemin.

⚠️ **Le `custom` sans clé reste admis** : un serveur d'inférence maison n'en
demande pas, et refuser l'appel casserait un usage réel. Anthropic et Gemini, eux,
sont refusés avec le nom de l'entrée manquante — mieux qu'un 401 illisible trois
écrans plus loin.

**Côté magasin**, `useAIStore` ne détient que `clesPresentes` — *qui* a une clé,
jamais laquelle — obtenu par `etatDuCoffre()`, qui rend les **noms** des entrées.
Le type `AIModelConfig` n'a plus de champ `apiKey`. Pour le meneur, le geste
change : **on ne relit plus une clé, on la remplace.**

| Où | Quoi |
| --- | --- |
| `electron/hotesDesFournisseurs.ts` | La table fournisseur → hôte admis |
| `electron/clesDesFournisseurs.ts` | Où la clé s'attache, et quelle entrée du coffre la porte |
| `src/modules/ai/lesClesNeVoyagentPas.test.ts` | Le contrôle : aucune clé assemblée à l'écran, aucun `getSecret` dans le magasin |

⚠️ **L'entrée du jeton d'image est `ai-key-image`**, pas `ai-key-image-cloudflare` :
la renommer viderait le coffre des meneurs qui l'ont déjà saisi.

- **Protocole gmos://** : Toutes les ressources générées par l'IA (avatars) sont servies via un protocole personnalisé pour éviter les restrictions de sécurité locales de Chromium.
- **Timeout Management** : Les appels Ollama disposent de timeouts spécifiques pour éviter de bloquer l'UI en cas de surcharge du GPU local.

---

*Dernière mise à jour : Mars 2026*
