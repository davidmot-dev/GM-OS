# 🧠 Guide Utilisateur : AI Oracle & NotebookLM

L'**AI Oracle** est l'interface d'intelligence artificielle de GM-OS. Contrairement à une IA générique, l'Oracle est "augmenté" par vos propres données grâce à l'intégration profonde avec **NotebookLM** (via un bridge MCP).

## 🌌 Le Concept : Le Cerveau de votre Monde

L'Oracle ne se contente pas de vous aider à improviser. Il puise dans une base de connaissances structurée (votre Notebook) pour :
- Répondre avec exactitude aux questions de lore (noms de lieux, généalogies, faits historiques).
- arbitrer des points de règles complexes basés sur le Rulebook officiel indexé.
- Générer du contenu cohérent avec le style et le ton de votre campagne.

---

## 🛠️ Connexion & Bridge MCP

Pour fonctionner, l'Oracle s'appuie sur le **NotebookLM MCP Server**. 
- **Lien Neural** : Chaque campagne ou système de jeu pointe vers une URL NotebookLM spécifique.
- **Identification** : GM-OS extrait l'ID unique de votre Notebook pour établir la communication.
- **Authentification** : Si la connexion échoue, utilisez la commande `notebooklm-mcp-auth` dans votre terminal pour rafraîchir les jetons d'accès.

---

## 💎 Les Gems (Personas)

L'Oracle peut adopter 6 "Gems" (personnalités) différentes pour filtrer ses réponses.

| Gem | Persona | Spécialité |
| :--- | :--- | :--- |
| 📖 | **Le Sage** | Expert en règles, statistiques et mécaniques techniques. |
| 🖋️ | **Le Scribe** | Chroniqueur, idéal pour résumer des sessions ou organiser des notes. |
| ✨ | **L'Oracle** | Maître de la narration, de l'ambiance et des rebondissements. |
| 🎵 | **Le Barde** | Enrichit le lore avec de la poésie, des chansons et des légendes. |
| ⚗️ | **L'Alchimiste** | Créateur de butin, de potions et de fiches de PNJ sur mesure. |
| 👤 | **L'Acteur** | Aide le MJ à interpréter les dialogues et motivations des PNJ. |

> [!TIP]
> **Cohésion Rule Engine** : Si vous jouez à un système spécifique (ex: Alien, D&D), les Gems s'adaptent automatiquement ! Elminster parlera pour D&D, tandis qu'un journaliste d'Arkham répondra pour l'Appel de Cthulhu.

---

## 📂 Alimentation de l'Oracle (Feeding)

Il existe trois façons principales de donner des connaissances à votre Oracle :

### 1. Synchronisation Obsidian (Manuel)
Depuis le module **Obsidian**, sélectionnez une note et cliquez sur **"Sync to Oracle"**. La note est instantanément injectée dans la mémoire de travail de l'IA.

### 2. Chemins RAG (Semi-Automatique)
Dans les paramètres de votre campagne (**Session OS**), vous pouvez définir des répertoires "RAG".
- Placez vos PDF, fichiers texte ou Markdown dans le dossier `docs/` de GM-OS.
- L'Oracle priorisera ces documents pour ses réponses locales.

### 3. NotebookLM (Direct)
Vous pouvez ajouter des sources directement dans l'interface de NotebookLM (YouTube, documents Google Drive, sites web). GM-OS y aura accès via l'ID du notebook.

---

## 🕹️ Utilisation de l'Interface

L'**Oracle Panel** (accessible via l'icône d'étincelles dans le Cockpit) propose deux modes :

- **Mode Chat** : Dialogue direct avec le Persona actif. L'IA a accès à toutes les sources du Notebook et aux consignes du Persona.
- **Source View** : Permet de consulter les documents sources (Note: Certaines restrictions de sécurité Google peuvent nécessiter d'ouvrir la source dans une fenêtre externe).

---

## 💡 Scénarios d'Usage

- **"Je ne sais plus qui est le cousin du Duc d'Havre-Gris..."** -> Interrogez l'Oracle avec le Gem **Scribe**.
- **"Décris-moi l'odeur et l'ambiance de cette ruelle sombre sous la pluie."** -> Utilisez le Gem **Oracle**.
- **"Quelles sont les chances de survie si je saute de 10 mètres dans de la boue ?"** -> Demandez au **Sage**.
- **"Génère-moi une liste de 3 rumeurs locales sur la disparition des enfants."** -> Appelez le **Barde**.
