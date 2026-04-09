# 🧠 Guide Utilisateur : AI Oracle (Gems)

L'**Oracle AI** est votre co-pilote narratif et technique dans GM-OS v5. Basé sur la technologie NotebookLM, il est capable de répondre à vos questions en se basant précisément sur vos propres règles de jeu, vos scénarios et vos notes de campagne.

![Sélecteur de Persona de l'Oracle](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/oracle_mockup.png)

## 📋 Présentation du Module
L'Oracle s'affiche sous la forme d'un panneau latéral intelligent. Il propose deux modes d'interaction :
1.  **Mode Chat (Intégré)** : Une interface de discussion fluide et moderne. C'est ici que vous interagissez avec les différents "Personas" (Gems).
2.  **Mode Source (Lecture)** : Affiche le document source (NotebookLM) pour une consultation directe.

## 🚀 Fonctionnement des "Gems" (Personas)
La force de l'Oracle réside dans sa capacité à changer de personnalité selon vos besoins. Cliquez sur le bouton **SWITCH** dans l'en-tête pour choisir parmi 6 experts :

- **📜 Le Sage** : Spécialiste des règles et des calculs techniques.
- **✒️ Le Scribe** : Idéal pour résumer vos sessions et organiser vos notes.
- **✨ L'Oracle** : Votre partenaire d'improvisation et de descriptions narratives.
- **🎵 Le Barde** : Expert en lore profond, poésies et légendes.
- **🧪 L'Alchimiste** : Générateur d'objets magiques, de potions et de caractéristiques.
- **🗺️ Le Cartographe** : Expert en lieux, architecture, pièges et géographie.
- **👤 L'Acteur** : Vous aide à interpréter vos PNJ (dialogues, motivations).

### ⚡ Auto-Forge (Génération Intelligente)
Inutile de configurer manuellement chaque expert. Le bouton **"Générer avec l'IA"** (disponible dans les Campagnes et Drivers) utilise un moteur séquentiel pour paramétrer instantanément vos 7 GEMS. 
- **Isolation RAG** : Le système sait distinguer les règles du jeu (Drivers) du lore de l'aventure (Campagnes) pour une spécialisation parfaite.
- **Fiabilité Ollama** : Optimisé pour fonctionner localement sans coupures de texte.

> [!NOTE]
> **Badge SYNC** : Si vous voyez un badge "SYNC" sur un persona, cela signifie qu'il a été automatiquement configuré avec les règles spécifiques de votre système de jeu actuel (ex: *Alien RPG* ou *Appel de Cthulhu*).

## 💡 Usage au quotidien

### Poser une question contextuelle
Grâce au lien avec le module **Obsidian**, l'Oracle connaît vos notes.
1. Synchronisez une note depuis le module Obsidian.
2. Ouvrez l'Oracle et demandez : *"Fais-moi un résumé des points clés de cette note."*

### Aide à l'improvisation
Vos joueurs sortent des sentiers battus ?
1. Sélectionnez le Persona **L'Oracle**.
2. Demandez : *"Les joueurs viennent d'entrer dans une taverne mal famée. Décris-moi l'ambiance et donne-moi le nom d'un client louche."*

### Arbitrage de règles
Un doute sur une mécanique ?
1. Sélectionnez le Persona **Le Sage**.
2. Demandez : *"Comment fonctionne la règle de panique dans ce système ?"* (L'IA cherchera la réponse dans le PDF de règles lié à votre campagne).

### AI NPC Dialogue Prep (Prise de contact immédiate)
L'Oracle est "Session-Aware". Il connaît les PNJs que vous avez épinglés dans votre session via le module **NPC-OS**.
1. Sélectionnez le Persona **L'Acteur**.
2. Demandez simplement : *"Prépare-moi une réplique pour [Nom du PNJ] qui vient de se faire voler sa bourse."*
3. **Magie** : L'IA puise automatiquement dans la description et les notes d'interprétation du PNJ pour vous répondre avec le bon ton.

## ⚙️ Configuration & Connexion
L'Oracle nécessite une connexion à NotebookLM via le pont MCP.
- **Status Hub** : Vérifiez que le voyant en bas du panneau est **VERT** (Bridged).
- **Reconnect** : Si l'IA ne répond plus ou demande une authentification, utilisez le bouton de reconnexion dans les paramètres IA ou cliquez sur l'icône de rafraîchissement.

---
> [!TIP]
> Utilisez le bouton **Clear History** (poubelle) régulièrement pour garder les conversations focalisées sur le moment présent de votre partie.
