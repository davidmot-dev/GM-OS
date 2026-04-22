# 🐧 Guide d'Installation Linux : GM-OS v5

Ce guide détaille les étapes pour installer et faire fonctionner GM-OS v6 sur un environnement Linux (Ubuntu, Debian, Fedora, etc.).

---

## 1. Pré-requis Système

Installez les outils de base via votre gestionnaire de paquets (exemple pour Ubuntu/Debian) :
```bash
sudo apt update
sudo apt install git python3 python3-pip curl
```

### 📦 Node.js (via NVM recommandé)
Il est fortement conseillé d'utiliser **nvm** pour gérer Node.js :
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

### 🧠 Ollama (IA Locale)
Installez Ollama via le script officiel :
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

## 2. Préparation du Code et Dépendances

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/davidmot-dev/GM-OS.git
   cd GM-OS-v5
   ```

2. **Installer les dépendances JS** :
   ```bash
   npm install
   ```

---

## 3. Configuration des Moteurs IA (Spécifique Linux)

### 3.1 Ollama & CORS
Sur Linux, Ollama tourne souvent en tant que service `systemd`. Pour autoriser Electron à communiquer avec lui :

1. Modifiez la configuration du service :
   ```bash
   sudo systemctl edit ollama.service
   ```
2. Ajoutez ces lignes dans le fichier qui s'ouvre (sous la section `[Service]`) :
   ```ini
   [Service]
   Environment="OLLAMA_ORIGINS=*"
   ```
3. Sauvegardez et redémarrez le service :
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart ollama
   ```

### 3.2 Pont MCP NotebookLM
Le pont nécessite Python et quelques bibliothèques système pour l'automatisation du navigateur.

1. **Dépendances Python** :
   ```bash
   pip3 install fastmcp selenium playwright
   playwright install chromium
   ```
2. **Dossier de configuration** :
   ```bash
   mkdir -p ~/.antigravity/notebooklm-mcp/
   cp scripts/mcp/* ~/.antigravity/notebooklm-mcp/
   ```

---

## 4. Exécution et Compilation

### Lancement en mode développement
```bash
npm run dev
```

### Création d'un package Linux (AppImage / deb)
Pour créer un exécutable Linux :
1. Installez `electron-builder` : `npm install --save-dev electron-builder`
2. Ajoutez la configuration Linux dans `package.json` :
   ```json
   "linux": {
     "target": ["AppImage", "deb"],
     "category": "Game"
   }
   ```
3. Lancez le build :
   ```bash
   npm run build
   ```

---

## ⚙️ Points de Vigilance Linux
- **Droits d'accès** : Assurez-vous que l'utilisateur a les droits d'écriture dans `~/.antigravity`.
- **Accélération GPU** : Pour Ollama, assurez-vous que vos pilotes NVIDIA/AMD sont correctement installés pour bénéficier de Gemma 4 avec fluidité.
- **Chemins** : Le code utilise désormais `process.env.HOME` pour localiser la configuration sur Linux, garantissant la portabilité.

---
*Dernière mise à jour : 22 Avril 2026*
