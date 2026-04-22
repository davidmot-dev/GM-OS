# 🛠️ Guide de Compilation et d'Installation : GM-OS v5

Ce guide détaille les étapes pour compiler l'application à partir du code source et l'installer sur une nouvelle machine, incluant la configuration des services d'IA locaux (Ollama) et du pont MCP (NotebookLM).

---

## 1. Pré-requis Système
Avant toute chose, assurez-vous que la machine cible possède les outils suivants :
- **Node.js** (Version 18.0.0+) : [Télécharger](https://nodejs.org/)
- **Git** : Pour récupérer le code source.
- **Python 3.10+** : Nécessaire pour le pont NotebookLM.
- **Ollama** : Pour l'IA locale (Oracle/Gemma). [Télécharger](https://ollama.com/)

---

## 2. Préparation du Code Source

### Option A : Via Git (Recommandé)
```bash
git clone https://github.com/davidmot-dev/GM-OS.git
cd GM-OS-v5
```

---

## 3. Installation des Dépendances
```bash
npm install
```

---

## 4. Compilation & Packaging

### Étape 4.1 : Créer l'exécutable portable
Pour générer un fichier `.exe` autonome :
1. Installez le packager : `npm install --save-dev electron-builder`
2. Ajoutez le script dans `package.json` : `"package": "npm run build && electron-builder"`
3. Lancez la création :
   ```bash
   npm run package
   ```
L'exécutable sera dans le dossier `release/`.

---

## 5. Configuration des Moteurs IA (CRITIQUE)

### 5.1 Ollama (IA Locale Oracle)
Pour que GM-OS puisse communiquer avec Ollama, vous devez activer les requêtes CORS sur Windows :
1. Ouvrez **PowerShell** (Administrateur).
2. Exécutez : `[System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'User')`
3. Redémarrez Ollama complètement.
4. Dans GM-OS (AI Settings), cliquez sur **"PULL GEMMA 4"** pour télécharger le modèle narratif.

### 5.2 Pont MCP NotebookLM (Forge de Règles)
Le pont permet d'extraire des règles depuis NotebookLM via un navigateur automatisé.
1. Créez le dossier de configuration : `%USERPROFILE%\.antigravity\notebooklm-mcp\`
2. Installez les dépendances Python nécessaires :
   ```bash
   pip install fastmcp selenium playwright
   playwright install chrome
   ```
3. Copiez le script `run_mcp.py` et le fichier `notebooklm-config.json` dans ce dossier.
   *(Note : Ces fichiers sont fournis dans le répertoire `scripts/mcp/` du dépôt source).*

---

## 6. Déploiement "Ailleurs"

### Méthode "Portable"
1. Copiez le fichier `GM-OS.exe` (généré à l'étape 4) sur la nouvelle machine.
2. Assurez-vous qu'**Ollama** est installé et configuré (CORS).
3. Assurez-vous que **Python** est dans le PATH de la machine cible.
4. Lancez `GM-OS.exe`.

---

## ⚙️ Points de Vigilance
- **Données Utilisateur** : Les campagnes sont stockées dans `%AppData%/gm-os-v6`. Copiez ce dossier pour conserver vos sessions.
- **Clés API** : Les clés Gemini/Anthropic doivent être re-saisies dans les réglages de l'application sur le nouveau poste.
- **Portabilité des Chemins** : Le bridge MCP a été mis à jour pour utiliser des chemins relatifs au profil utilisateur (`%USERPROFILE%`). Ne modifiez pas la structure du dossier `.antigravity` manuellement.

---
*Dernière mise à jour : 22 Avril 2026*
