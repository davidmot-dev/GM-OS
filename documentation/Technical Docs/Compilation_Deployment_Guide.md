# 🛠️ Guide de Compilation et d'Installation : GM-OS v5

Ce guide détaille les étapes pour compiler l'application à partir du code source et l'installer sur une nouvelle machine, que ce soit pour le développement ou pour une utilisation finale.

---

## 1. Pré-requis Système
Avant toute chose, assurez-vous que la machine cible possède les outils suivants :
- **Node.js** (Version 18.0.0 ou supérieure recommandée) : [Télécharger ici](https://nodejs.org/)
- **Git** : Pour récupérer le code source (si vous ne passez pas par un transfert manuel de fichiers).

---

## 2. Préparation du Code Source

### Option A : Via Git (Recommandé)
Sur la nouvelle machine, ouvrez un terminal et exécutez :
```bash
git clone https://github.com/davidmot-dev/GM-OS.git
cd GM-OS-v5
```

### Option B : Transfert Manuel
Copiez l'intégralité du dossier `GM-OS-v5` sur la nouvelle machine, à l'exception du dossier `node_modules` (qui doit être régénéré).

---

## 3. Installation des Dépendances
Une fois dans le dossier du projet :
```bash
npm install
```
Cette étape télécharge toutes les bibliothèques nécessaires (React, Electron, Vite, etc.).

---

## 4. Compilation (Build)
Pour transformer le code source en fichiers optimisés pour l'exécution :
```bash
npm run build
```
Cela générera deux dossiers :
- `dist/` : Contient l'interface React compilée.
- `dist-electron/` : Contient le code du moteur Electron (Main & Preload).

---

## 5. Création d'un Exécutable Standalone (.exe)
Actuellement, votre projet est configuré pour le développement. Pour créer un fichier `.exe` que vous pouvez copier sur n'importe quel PC Windows sans installer Node.js, vous devez ajouter un outil de packaging.

### Étape 5.1 : Installer electron-builder
Exécutez cette commande dans votre projet :
```bash
npm install --save-dev electron-builder
```

### Étape 5.2 : Configurer le packaging
Ajoutez ces lignes à la fin de votre fichier `package.json` (juste avant la dernière accolade) :

```json
  "build": {
    "appId": "com.gmos.app",
    "productName": "GM-OS",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "dist-electron/**/*"
    ],
    "win": {
      "target": "portable"
    }
  }
```

### Étape 5.3 : Lancer la création de l'exécutable
Ajoutez un script dans la section `"scripts"` de votre `package.json` :
`"package": "npm run build && electron-builder"`

Puis lancez :
```bash
npm run package
```
L'exécutable portable sera généré dans le dossier `release/`.

---

## 6. Déploiement "Ailleurs"

### Méthode "Exécutable Portable" (Idéal)
1. Prenez le fichier `GM-OS.exe` généré dans le dossier `release/`.
2. Copiez-le sur une clé USB ou envoyez-le par transfert de fichiers.
3. Sur la nouvelle machine : double-cliquez sur le fichier. L'application se lance immédiatement.

### Méthode "Source" (Pour développeur)
1. Répétez les étapes 1 à 3 sur la nouvelle machine.
2. Lancez l'application en mode développement avec :
   ```bash
   npm run dev
   ```

---

## ⚙️ Points de Vigilance
- **Données Utilisateur** : GM-OS stocke les campagnes et sessions localement (souvent dans `%AppData%/gm-os-v6`). Si vous voulez transférer vos données, pensez à copier ce dossier ou à utiliser la fonction d'export/import si elle est implémentée.
- **Variables d'Environnement** : Si vous utilisez des clés API (Gemini, etc.), elles devront être reconfigurées sur la nouvelle machine via l'interface de l'application.
