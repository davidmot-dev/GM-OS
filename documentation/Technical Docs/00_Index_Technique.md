# 🛠️ Index technique

**Les 31 documents techniques du dossier**, rangés par sujet. Ils décrivent *comment c'est fait* ;
pour *comment on s'en sert*, voir [les guides utilisateur](../User%20Guides/00-Index-des-guides.md).

> ⚠️ **Un document technique vieillit sans prévenir.** Ceux qui portent une date de mise à jour
> disent de quand ils parlent ; les autres décrivent l'état du jour où ils ont été écrits. En cas
> de doute, **le code fait foi** — et un document qui décrit une fonction inexistante est un piège,
> pas une lacune : signalez-le.

---

## 🏛️ Socle et conventions

| Document | Ce qu'il couvre |
| :--- | :--- |
| [Architecture modulaire de Session-OS](./session-os-modular-architecture.md) | **Le modèle de référence** : comment un module se découpe en *slices*, services et écrans. 292 lignes, le plus structurant du dossier. |
| [Protocole anti-régression](./anti_regression_protocol.md) | Ce que `npm run validate` vérifie, et pourquoi le hook `pre-push` refuse un envoi. |
| [Architecture IA hybride](./hybrid-ai-architecture.md) | Comment GM-OS bascule entre un modèle local (Ollama) et un service distant. |
| [Système de personas IA](./AI_Persona_System_Technical_Doc.md) | D'où viennent les voix de l'Oracle, et comment elles sont dérivées. |
| [Archive BMAD](./bmad_expert_collaboration_archive.md) | Les décisions de design et standards hérités de la période BMAD. Historique. |

## 🎮 Le jeu

| Document | Ce qu'il couvre |
| :--- | :--- |
| [Moteur de règles & partage](./Rule_Engine_Technical_Doc.md) | Le `GameDriver`, et la diffusion d'un document de règle aux joueurs. |
| [Fiches de personnage](./Character_Sheet_Technical_Doc.md) | Gabarits, champs typés, persistance. |
| [Projection du combat](./Combat_Projection_Technical_Doc.md) | Qui voit quoi de l'écran de combat, et comment on le décide. |
| [Projection des dés](./Dice_Projection_Technical_Doc.md) | Le chemin d'un jet du pupitre du meneur jusqu'à l'écran des joueurs. |
| [Deck-OS](./Deck-OS_Technical_Doc.md) · [détails d'API](./deck-os-technical.md) | Les paquets, les tas, et la carte tenue en main. *Deux documents, le second plus détaillé.* |

## 💰 Butin et tables

| Document | Ce qu'il couvre |
| :--- | :--- |
| [Architecture du butin](./loot-system-architecture.md) | **Commencez ici** : les deux modules (Table-OS, Loot-OS), le pont entre eux, la persistance du pool. |
| [Moteur de butin](./Loot_System_Internal_Doc.md) | Le détail de la résolution : modes de tirage, imbrication, oracles, limites réelles. |
| [Analyse d'origine (2026-03)](./analysis/Encounter_Loot_Generator_Analysis.md) | ⛔ **Vision jamais construite.** Conservée pour ce qu'elle garde de juste ; elle porte son avertissement. |

## 🗺️ Le monde

| Document | Ce qu'il couvre |
| :--- | :--- |
| [Map-OS — calques & brouillard](./Map_OS_Technical_Doc.md) | Le masquage physique et la logique de révélation. |
| [Map-OS — architecture de rendu](./map-os-architecture.md) | Le rendu multi-calques, le zoom et le panoramique. |
| [Vision de l'Oracle (Map)](./Map_Oracle_Narrative_Technical_Doc.md) | La narration engendrée depuis l'état visible d'une carte. |
| [Social Nexus](./Social_Nexus_Technical_Doc.md) | Le graphe relationnel D3.js, ses forces et ses épingles. |
| [Indices — Clues-OS](./Clues-OS_Technical_Doc.md) · [système transverse](./Clues_System_Technical_Doc.md) | La gestion des secrets. *Deux documents : le premier décrit le module, le second ses liens avec le reste.* |
| [NPC Live Generator](./NPC_Live_Generator_Technical_Doc.md) | La génération d'images pour les entités. |
| [Image-OS](./Image_OS_Technical_Doc.md) | La projection visuelle sur plusieurs écrans. |

## 🔊 Son et lumière

| Document | Ce qu'il couvre |
| :--- | :--- |
| [Master Soundscape Controller](./Audio_Master_Controller_Technical_Doc.md) | Le volume global et l'atténuation automatique. |
| [Light-OS](./Light-OS_Technical_Doc.md) | Le pont Philips Hue, scènes natives et effets logiciels. |
| [Étiquetage pour le Cortex](./tactical-ai-tagging.md) | Les mots-clés qui permettent à l'IA de choisir une ambiance. |

## 📡 Transport et second écran

| Document | Ce qu'il couvre |
| :--- | :--- |
| [Tablet Hub — architecture](./Tablet_Hub_Technical_Doc.md) | L'instance web légère, et sa synchronisation. |
| [Protocole de synchronisation](./tablet-hub-protocol.md) | Le canal WebSocket et la forme des messages. |
| [Télécommande du MJ](./Remote_Control_Technical_Doc.md) | Le contrôle déporté depuis un mobile. |

## 🧹 Données et cycle de vie

| Document | Ce qu'il couvre |
| :--- | :--- |
| [Cascade de suppression d'une campagne](./campaign-deletion-cascade.md) | Ce qui part avec une campagne effacée — et ce qui reste. |
| [Nettoyage des médias](./media-cleanup.md) | Comment les fichiers orphelins sont repérés, et ce qui les protège. |

## 📦 Fabriquer et installer

| Document | Ce qu'il couvre |
| :--- | :--- |
| [Compilation & déploiement (Windows)](./Compilation_Deployment_Guide.md) | Du code source à l'exécutable. |
| [Installation Linux](./Linux_Installation_Guide.md) | AppImage, CORS, particularités. |

## 🔬 Analyses et études

Le sous-dossier [`analysis/`](./analysis/) rassemble 23 études — explorations, comparatifs,
propositions. **Ce sont des documents de réflexion, pas des descriptions du produit** : plusieurs
proposent des architectures qui n'ont jamais été construites. Les lire comme telles.

---

*Index créé le 2026-09-04 : aucun des 31 documents techniques n'était référencé depuis un index.*
