# Walkthrough : Auto-Génération des Personas IA

Cette mise à jour introduit une fonctionnalité de pointe permettant de configurer instantanément vos 7 assistants IA (GEMS) en fonction du jeu ou de la campagne en cours.

## 🚀 Nouvelles Fonctionnalités

### 1. Génération Contextuelle (Service AI)
Un nouveau service `PersonaGeneratorService` a été implémenté. Il utilise l'IA pour transformer les informations de base (Nom, Univers, Style) en 7 prompts systèmes hautement spécialisés suivant une structure stricte :
- **Sage** (Règles)
- **Scribe** (Mémoire)
- **Oracle** (Narration)
- **Barde** (Lore & Musique)
- **Alchimiste** (Loot & PNJ)
- **Cartographe** (Lieux & Architecture)
- **Acteur** (Incarnation)

### 2. Optimisation pour Ollama (Séquentiel)
Pour garantir une fiabilité maximale, surtout avec des modèles locaux via **Ollama**, le service effectue désormais **7 appels IA distincts** (un par persona) :
- **Qualité accrue** : Chaque persona reçoit un prompt dédié et peut générer une réponse longue sans être coupé par la fenêtre de contexte.
- **Robustesse** : Suppression du parsing JSON global au profit d'un retour en texte brut, éliminant les erreurs de syntaxe.
- **Suivi en temps réel** : La progression est affichée dans la console de debug de GM-OS.

### 3. Isolation du Contexte RAG
Le système de recherche documentaire (RAG) est désormais contextuel :
- **Mode Système** : Lorsqu'on génère depuis l'éditeur de Driver, l'IA ne lit que les fichiers du moteur de jeu (règles, etc.), ignorant la campagne active pour éviter la confusion.
- **Mode Campagne** : Lorsqu'on génère depuis une aventure, l'IA combine les règles du système ET le lore de la campagne pour des oracles parfaitement adaptés.

### 4. Intégration dans les Campagnes
Dans le formulaire de création/édition de campagne, un bouton **"Générer avec l'IA"** est désormais disponible dans la section **Résonances Éthériques**.
- Il utilise le nom de votre campagne et son synopsis pour créer des surcharges d'instructions uniques.
- Idéal pour donner une "couleur" spécifique à vos assistants pour une aventure précise (ex: ambiance horreur Alien pour une campagne spatiale).

### 5. Intégration dans les Drivers (Moteur de Règles)
Dans l'éditeur de moteur de règles (`RuleEngineEditor`), vous pouvez désormais générer les personas par défaut pour tout un système de jeu.
- Les instructions produites sont enregistrées directement dans le Driver, facilitant le partage de systèmes complets et intelligents.

## 🛠️ Modifications Techniques (Résumé)

- **[NEW] [PersonaGeneratorService.ts](../../src/modules/ai/PersonaGeneratorService.ts)** : Logique de prompting structuré.
- **[MODIFY] [CampaignForm.tsx](../../src/modules/session/components/CampaignForm.tsx)** : Ajout de l'interface de génération.
- **[MODIFY] [RuleEngineEditor.tsx](../../src/modules/session/components/RuleEngineEditor.tsx)** : Ajout de l'interface de génération.
- **[MODIFY] [RAGService.ts](../../src/modules/ai/RAGService.ts)** : Support de l'isolation contextuelle.

## ✅ Test de Validation

1. Créez une nouvelle campagne nommée **"Alien: Isolation"**.
2. Indiquez **"Horreur Sci-Fi, survie dans une station spatiale abandonnée"** en description.
3. Cliquez sur **"Générer avec l'IA"**.
4. Observez vos 7 personas se remplir avec des instructions thématiques !

## 🔍 Dépannage (Troubleshooting)

### Erreur "400 Bad Request" sur l'Oracle
Si NotebookLM renvoie une erreur 400 lors d'une question, cela peut être dû à :
1. **Token Expiré** : Les cookies de session ont expiré. Exécutez `notebooklm-mcp-auth` dans votre terminal et **redémarrez complètement GM-OS**.
2. **Saturation du Prompt** : Les instructions générées par l'IA sont trop longues. GM-OS utilise désormais `chat_configure` pour alléger les messages, mais assurez-vous de ne pas avoir de textes massifs collés manuellement dans les surcharges.

### "Bridge MCP non disponible"
- Vérifiez que vous lancez l'application via le script `npm run dev` (ou équivalent) qui initialise correctement le pont IPC entre les processus.

## 💡 Conseils de Maître du Jeu
- **Personnalisation fine** : N'hésitez pas à éditer manuellement le prompt d'un persona après sa génération si vous voulez qu'il insiste sur un point de règle précis.
- **Isolation RAG** : Si un PNJ généré semble connaître des secrets qu'il ne devrait pas, vérifiez si vous avez généré depuis un Driver (System Only) ou depuis le formulaire de Campagne (Mixte).
