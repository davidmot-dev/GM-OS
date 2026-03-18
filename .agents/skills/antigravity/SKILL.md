---
name: antigravity
description: Guide stratégique et outils d'automatisation pour la CLI Gemini. Utilise ce skill pour optimiser l'usage du terminal, formater les sorties en Markdown et automatiser les scans de dossiers pour Gemini.
---

# 🚀 Skill Antigravity : Maîtrise de la CLI Gemini

Ce skill transforme la CLI Gemini en un outil de précision pour le projet GM-OS. Il se concentre sur l'économie de contexte (tokens) et la lisibilité Markdown.

## 📡 Quand utiliser ce Skill ?
- Pour comprendre les commandes avancées de la CLI.
- Pour formater des données complexes en tableaux Markdown.
- Pour automatiser l'envoi de contextes de dossiers entiers à Gemini.

## 🛠️ Commandes Stratégiques de la CLI

### 1. Injection de Contexte `@` (Le plus efficace)
Injecte directement le contenu d'un fichier ou dossier sans passer par le presse-papier.
> `Explique ce code : @src/modules/session/SessionDashboard.tsx`

### 2. Exécution Shell `!`
Exécute des commandes sans quitter l'interface Gemini.
> `!npm run build`
> `!git status`

### 3. Gestion de Mémoire `/`
- `/memory show` : Voir ce que Gemini "sait" actuellement.
- `/init` : Recalibrer le contexte d'un projet.

## 🛸 Scripts Antigravity inclus

### 📄 Formateur Markdown (`pretty-markdown.cjs`)
Prend n'importe quelle sortie et la rend "Antigravity Ready" (Markdown pur).
**Usage :** `!ma_commande | node .agents/skills/antigravity/scripts/pretty-markdown.cjs`

### 🌌 Scanner de Dossier (`folder-scanner.cjs`)
Génère une vue hiérarchisée d'un dossier avec des instructions d'analyse pour Gemini.
**Usage :** `!node .agents/skills/antigravity/scripts/folder-scanner.cjs src/modules/session`

---
**Note :** Toujours privilégier les chemins relatifs depuis la racine du projet pour les injections de contexte.
