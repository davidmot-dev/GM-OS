# 🧭 Guide : Configuration IA Locale (Ollama & Gemma 4)

Ce guide vous accompagne dans la mise en place du moteur d'IA local de GM-OS v6. L'utilisation d'une IA locale garantit la **confidentialité totale** de vos données de campagne et une réactivité maximale sans dépendance au Cloud.

## 🚀 Étape 1 : Installation d'Ollama

GM-OS utilise **Ollama** comme pont de communication pour les modèles locaux.

1.  Téléchargez Ollama sur [ollama.com](https://ollama.com).
2.  Installez et lancez l'application.
3.  Vérifiez qu'Ollama est actif dans votre barre de tâches.

### 🌐 Configuration Spécifique Windows (Obligatoire)
Pour permettre à Electron de communiquer avec le serveur Ollama local, vous devez autoriser les requêtes transverses (CORS).

1.  Ouvrez un terminal **PowerShell** (en Administrateur).
2.  Exécutez la commande suivante :
    ```powershell
    [System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'User')
    ```
3.  **Quittez totalement Ollama** (clic droit sur l'icône dans la barre des tâches -> Quit).
4.  Relancez Ollama.

## 🛠️ Étape 2 : Configuration dans GM-OS

Une fois Ollama installé, ouvrez GM-OS :

1.  Allez dans **AI Settings** (icône engrenage dans le panneau IA).
2.  Dans la section **Ollama Configuration**, vérifiez que le statut est `Connected`.
3.  Cliquez sur le bouton **"PULL GEMMA 4 (26B)"**. 
    - *Note : Le téléchargement fait environ 16 Go. Assurez-vous d'avoir suffisamment d'espace disque.*
4.  Une fois le téléchargement terminé, sélectionnez `gemma4:26b` dans la liste des modèles.

## 🔱 Utilisation de Gemma 4

Une fois configuré, Gemma 4 devient votre moteur narratif principal.

### Indicateurs Visuels
Dans la **System Forge** ou la **Chronicle Forge**, un badge apparaît dans le header :
- 🟢 **Moteur : Gemma 4** : Vous travaillez en local.
- 🔵 **Moteur : Gemini 1.5** : Vous travaillez via le Cloud.

### Avantages de Gemma 4 26B MoE
- **Architecture MoE** : Utilise seulement une fraction des paramètres à chaque requête, offrant une vitesse de réponse exceptionnelle.
- **Confidentialité** : Aucun texte de vos chroniques ne quitte votre ordinateur.
- **Zéro Coût** : Pas besoin de clé API ou de quota de jetons (Tokens).

## ⚠️ Limitations & Fallback

- **Multimodalité** : Gemma 4 est un modèle purement textuel. Si vous déposez un PDF ou une image dans la Forge, GM-OS utilisera automatiquement **Gemini** ou **NotebookLM** pour l'extraction initiale avant de confier la structuration narrative à Gemma 4.
- **Hardware Recommandé** : 
    - **Minimum** : GPU avec 8 Go de VRAM.
    - **Recommandé** : GPU avec 12-16 Go de VRAM pour une fluidité optimale.

## 🩺 Dépannage (Troubleshooting)

### Erreur `net::ERR_CONNECTION_REFUSED`
Si GM-OS affiche une erreur de connexion alors qu'Ollama semble lancé :
1.  **Serveur Fantôme** : Il arrive qu'Ollama "gèle" sur Windows. Tuez tous les processus `ollama.exe` dans le Gestionnaire des tâches et relancez-le.
2.  **Test de santé** : Ouvrez PowerPoint ou un terminal et tapez :
    `Invoke-RestMethod -Uri "http://127.0.0.1:11434"`
    Si vous ne recevez pas "Ollama is running", le serveur est bloqué.

---

*Besoin d'aide ? Consultez le [Migration Guide](file:///c:/Projet_David/GM-OS-v5/docs/user-guides/migration-guide.md) pour passer de la v5 à la v6.*
