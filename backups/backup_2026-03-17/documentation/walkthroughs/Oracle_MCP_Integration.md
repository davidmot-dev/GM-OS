# Walkthrough : Intégration Native NotebookLM (MCP)

L'**AI Oracle** de GM-OS v5 a été transformé d'une simple iframe (souvent bloquée) en un assistant conversationnel natif intégré.

## Nouvelles Fonctionnalités

### 1. Chat Natif "Cortex"
L'Oracle dispose maintenant d'une interface de chat moderne directement dans GM-OS.
- **Réponses Instantanées** : Les requêtes sont envoyées via MCP au serveur NotebookLM.
- **Contexte Intelligent** : L'ID du notebook est extrait automatiquement de l'URL de la campagne.
- **Historique de Session** : Les échanges sont conservés pendant l'ouverture du panneau pour référence rapide.

### 2. Vue Double (Chat / Source)
Un sélecteur permet de basculer entre :
- **Mode Chat** (Par défaut) : Pour poser des questions rapides sur les règles.
- **Mode Source** (Livre) : Pour ouvrir l'interface NotebookLM complète dans le navigateur (contournant les restrictions d'iframe Google).

### 3. Pont Electron (MCP Bridge)
- **Communication Directe** : Le système lance maintenant le serveur `notebooklm_mcp` en arrière-plan via Python.
- **Protocole JSON-RPC** : La communication entre GM-OS et l'IA est maintenant robuste et suit le standard MCP.
- **Sécurité** : Le pont est exposé via `appBridge`, respectant les normes de sécurité d'Electron.

### 4. Résilience du Protocole
L'erreur "Invalid request parameters" a été résolue via plusieurs mesures de robustesse :
- **Singleton Spawn** : Un seul processus Python est autorisé, évitant les collisions.
- **Verrouillage de Handshake** : Les requêtes attendent que la "poignée de main" MCP soit complète.
- **Délai de Stabilisation** : Un pause de 200ms est appliquée après l'initialisation pour laisser le temps au serveur d'être prêt à 100%.
- **Logs Transparents** : Suivi complet dans `C:\Users\david\mcp_bridge_debug.log`.

### 5. Localisation (Français)
- **Forceur de Langue** : Chaque requête est automatiquement accompagnée d'une instruction forcée pour répondre en français, quel que soit l'idiome des sources.

## Comment l'utiliser ?
1. Dans le **Cockpit de Session**, ouvrez l'AI Oracle (icône Sparkles).
2. Si un Notebook est lié à votre campagne, le chat sera actif.
3. Posez une question sur vos règles ou votre univers.
4. Utilisez l'icône **Poubelle** pour effacer l'historique ou le bouton **Livre** pour voir les sources complètes.

## Dépannage & Reconnexion

Si l'Oracle cesse de répondre ou si vous changez de compte Google :
1. Allez dans les **Paramètres > IA Settings**.
2. Dans la section **AI Oracle**, cliquez sur **"Reconnecter l'Oracle"**.
3. Une fenêtre de navigateur s'ouvrira pour valider votre compte.

> [!TIP]
> Vous pouvez vérifier l'état détaillé de la communication dans :
> `C:\Users\david\mcp_bridge_debug.log`
