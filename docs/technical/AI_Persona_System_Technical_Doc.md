# 🧠 Documentation Technique : Système de Personas IA (GEMS)

Ce document détaille l'architecture et le fonctionnement du système de génération automatique de personas IA dans GM-OS v5.

## 🏗️ Architecture du Service

Le cœur de la fonctionnalité repose sur le `PersonaGeneratorService`. Contrairement aux versions précédentes qui tentaient de générer tous les personas en un seul appel (souvent tronqué ou mal formé), la v5 utilise un **moteur de génération séquentielle**.

### 1. Flux de Génération Séquentielle
Pour chaque demande de génération, le service parcourt les 7 personas définis (Sage, Scribe, Oracle, Barde, Alchimiste, Cartographe, Acteur) et effectue un appel API distinct pour chacun.

**Avantages :**
- **Robustesse Ollama** : Les modèles locaux ont souvent une fenêtre de réponse limitée. En demandant un persona à la fois, on évite les coupures au milieu du texte.
- **Précision du Prompt** : Chaque persona dispose d'un prompt système dédié garantissant une spécialisation maximale.
- **Sortie Texte Brut** : Les personas sont générés en texte brut (Markdown), éliminant les erreurs de parsing JSON complexes.

### 2. Isolation du Contexte RAG
Le `RAGService` a été amélioré pour supporter l'isolation du contexte via un flag `systemOnly`.

| Mode | Source du Contexte | Utilisation Typique |
| :--- | :--- | :--- |
| **Système Uniquement** | Dossiers `/systems/[ID]/Documents` | Éditeur de Driver (Paramétrage global du jeu) |
| **Mixte (Défaut)** | Système + Dossiers de Campagne | Formulaire de Campagne (Surcharge thématique) |

Cette isolation évite que les notes d'une campagne active (ex: "Secret d'Ys") ne viennent polluer les instructions de base d'un système de jeu (ex: "Alien RPG") lors de sa configuration initiale.

## 🛠️ Intégration Technique

### Méthodes Clés
- `personaGeneratorService.generateAllPersonas(context, systemOnly)` : Point d'entrée principal.
- `aiService.generateText(prompt, ..., ragOptions)` : Supporte désormais le filtrage du contexte.

### Stockage
Les personas ne sont pas stockés dans l'état global éphémère mais sont injectés directement dans :
- Le `GameDriver` (pour les personas par défaut du système).
- La `Campaign` (pour les surcharges spécifiques à une aventure).

## 🧩 Optimisation NotebookLM (Smart Prompting)

Pour éviter l'erreur **400 Bad Request** liée à la taille excessive des prompts (payload), GM-OS utilise désormais le protocole de configuration de session du serveur MCP :

1. **Configuration Globale** : Le hook `useNotebookLM` appelle `chat_configure` pour définir les instructions du persona au niveau du notebook avant toute question.
2. **Requêtes Légères** : Les messages envoyés via `notebook_query` ne contiennent que la question de l'utilisateur, réduisant drastiquement le risque de dépassement de limite TLS/HTTP de l'API Google.
3. **Cycle de Vie MCP** : Un handler `mcp:restart` a été ajouté pour permettre de purger les instances serveurs dont les tokens d'authentification (XSFR) sont expirés.

## 🚀 Optimisations Futures
- **Parallel Batching** : Pour les modèles distants (Gemini/GPT-4), les appels pourraient être parallélisés pour gagner du temps.
- **Récupération Automatique** : Système de retry intelligent en cas de réponse vide ou mal formatée par l'IA.
