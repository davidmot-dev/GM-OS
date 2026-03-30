# 📅 Guide Utilisateur : Session OS (Master Cockpit)

**Session OS** est le cœur décisionnel de GM-OS v5. C'est ici que vous gérez vos campagnes, suivez la progression de vos joueurs, préparez vos scénarios et archivez les chroniques de vos aventures. C'est l'interface qui lie tous les autres modules entre eux.

````carousel
![Master Cockpit](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/session_cockpit.png)
<!-- slide -->
![World Atlas](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/session_atlas.png)
<!-- slide -->
![Session Prep](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/session_prep.png)
<!-- slide -->
![Obsidian Bridge](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/session_obsidian.png)
````

---

## 📚 Campaign Library (Bibliothèque de Campagnes)

La **Campaign Library** est votre point d'entrée. Elle permet de segmenter vos différentes aventures.

### Créer une Aventure

Lors de la création d'une campagne, vous devez configurer plusieurs éléments clés :

- **Nom & Synopsis** : Le titre et l'intrigue principale. Le synopsis aide l'IA à comprendre l'enjeu global.
- **Système de Jeu (Rule Engine)** : **Crucial.** Vous choisissez ici le moteur qui gérera les dés, les fiches et l'intelligence de combat (ex: Alien RPG, D&D 5e).
- **Wallpaper** : Une image d'ambiance qui définit le fond visuel de tout votre OS pendant cette campagne.
- **Chemins RAG (Cerveau AI)** : Indiquez des dossiers locaux (dans `/docs`) contenant votre lore. L'IA Oracle indexera ces dossiers pour répondre à vos questions sur le monde.

### 🗑️ Suppression et Nettoyage de Campagne

La suppression d'une campagne est une action **permanente** qui déclenche un nettoyage en cascade pour garder votre OS performant et organisé.

> [!CAUTION]
> **Ce qui est supprimé définitivement :**
> - Tous les **PNJ et Monstres** créés pour cette campagne.
> - Toutes les **Sessions et Notes de préparation** associées.
> - Toutes les **Cartes de l'Atlas** et leurs configurations (Battlemaps, Brouillard).
> - Toutes les **entrées Wiki, Timeline et Indices** liés.
>
> **Ce qui est conservé :**
> - **Personnages Joueurs (PJ)** : Ils sont détachés de la campagne mais restent dans votre Roster global.
> - **Fichiers médias** : Les images et sons restent dans le **Media Hub**, mais les étiquettes (tags) de la campagne supprimée sont retirées automatiquement.

---

## 🧠 Le Système de Règles (Drivers)

Chaque campagne est pilotée par un **Driver**. Ce "pilote" définit :

1.  **La Logique des Dés** : Succès, seuils, dés explosifs.
2.  **L'Intelligence Tactique** : Les portées (Contact, Courte, Longue) utilisées par **Map OS**.
3.  **L'Initiative** : La formule de calcul pour **Combat OS**.
4.  **Le Modèle de Fiche** : L'interface visuelle de la fiche de personnage.

---

## 🎭 Personas & IA Oracle

L'IA Oracle ne se contente pas de citer des règles. Selon le système choisi, elle peut changer de **Persona**.

### Auto-Génération Smart

Inutile de rédiger manuellement les instructions de vos assistants. Un bouton **"Générer avec l'IA"** est disponible :

- **Dans les Campagnes** : Pour adapter les 7 personas (GEMS) au ton et au synopsis de votre aventure.
- **Dans le Rule Engine (Drivers)** : Pour définir les comportements par défaut de tout un système de jeu.

**Précision** : Le système utilise une génération séquentielle optimisée pour **Ollama**, garantissant des instructions riches et sans coupures.

---

## 👥 Joueurs & Fiches de Jeu

Gérez votre table physiquement et numériquement dans l'onglet **Roster**.

### Fiches de Personnage Dynamiques

Les fiches sont entièrement adaptables :

- **Statistiques & Jauges** : Santé, Énergie, Santé Mentale. Les jauges visuelles permettent un suivi rapide du MJ.
- **Identité Visuelle** :
    - **Portrait** : L'image haute définition pour l'immersion (projetable).
    - **Token** : L'icône de jeton utilisée sur les cartes (**Map OS**) et dans la gestion de combat (**Combat OS**).
- **Notes du MJ (Privé)** : Une zone de saisie réservée au MJ.
- **Liaison Automatique (Smart Link)** : Tout asset créé pendant que la session est active est désormais **automatiquement lié** à la campagne en cours.
- **HP Dynamiques (NPC Gallery)** : Les PV/HP max des PNJ sont désormais éditables directement dans la galerie pour un suivi tactique sans ouvrir Combat-OS.

---

## 🕹️ Le Cockpit : Votre Tour de Contrôle

Le **Cockpit** est l'écran par défaut une fois une campagne lancée. Il affiche en temps réel :

- **Les Personnages Actifs** : Portraits et barres de vie mis à jour instantanément.
- **Le Workspace** : Une zone d'édition rapide pour vos notes de session.
- **Les Snapshots** : Voir section ci-dessous.

---

## 📸 Snapshots : Voyage dans le Temps

Un Snapshot capture l'intégralité de l'état de l'application à un instant T :

- La playlist exacte dans **Music OS**.
- L'ambiance sonore dans **Sound OS**.
- Les lumières Philips Hue dans **Light OS**.
- Les positions et PV dans **Combat OS**.

**Usage** : Sauvegardez un Snapshot à la fin d'une partie. Au début de la prochaine, chargez-le pour retrouver instantanément votre scène là où vous l'aviez laissée.

---

## 📐 Layout Manager - Votre Plan de Travail

Le **Layout Manager** sauvegarde l'état de votre *interface* (en plus de la fiction).

### Ce qui est mémorisé par campagne

- **Le Module Actif** : Retrouvez directement le module sur lequel vous travailliez (ex: Map OS).
- **L'État des Panneaux** : Si vos assistants IA (GEMS) ou votre Cortex Tactique étaient ouverts, ils le resteront.
- **Thème Visuel** : Chaque campagne peut avoir sa propre identité visuelle.

---

## 📐 Workspace Sync v2 - Auto-Layout Intelligent

GM-OS v5 intègre désormais une détection matérielle des moniteurs pour optimiser votre espace de travail.

### Détection d'Écrans

L'application détecte automatiquement quand vous branchez ou débranchez un écran :

- **Notification Instantanée** : Un message vous informe de l'état de votre setup.
- **Ouverture Assistée** : Si un second écran est détecté, GM-OS peut vous proposer d'ouvrir automatiquement le **Player Hub**.

### Adaptation Dynamique (Single Screen)

Si vous n'utilisez qu'un seul écran, GM-OS devient plus "compact" :

- **Gestion de Conflit** : L'ouverture du panneau **Tactical AI** fermera automatiquement le **Panneau IA** s'il était ouvert.
- **Priorité Tactique** : Le système privilégie toujours les outils nécessaires au jeu immédiat.

---

## 🗺️ World Atlas & Map Presets

L'Atlas gère la géographie et les lieux d'intérêt :

- **Cartes Multiniveaux** : Du monde entier au simple donjon.
- **Entités Liées** : Épinglez des PNJ ou des objets directement sur vos cartes.
- **Lieux Actifs** : Épinglez vos lieux favoris pour un accès immédiat.

---

### Presets de Cartes (Configuration de Scène)

Vous pouvez désormais sauvegarder l'état complet d'une carte dans **Map OS** (Zones de danger, position des unités, brouillard) :

- **Préparation à l'Avance** : Préparez vos embuscades ou vos pièges avant la session.
- **Rappel Instantané** : Rappelez la configuration sauvegardée en un clic pendant la partie.

---

## 🔌 Obsidian Bridge : Alimentation Data

Connectez Session OS à votre coffre **Obsidian** pour une injection directe du lore dans l'IA Oracle via le bouton **"Sync to Oracle"**.

---

## 🕸️ Social Nexus (Graphe Social)

Le **Social Nexus** est un outil de visualisation dynamique des relations (PJ/PNJ).

### Fonctionnalités Clés

- **Visualisation Interactive** : Graphe de force avec portraits.
- **Cartographie des Relations** : Flèches directionnelles et codes couleurs (Allié/Ennemi).
- **Accès Rapide (Deep Link)** : Navigation directe vers les fiches via l'icône **ExternalLink**.

### ⚛️ Physique du Nexus (Réglages Avancés)

Le Social Nexus est piloté par un moteur physique (D3-Force) que vous pouvez configurer via l'icône **Sliders** (Réglages) :

1.  **Atmosphère (Charge)** : Contrôle la force de répulsion globale. Plus la valeur est négative (ex: `-500`), plus les personnages s'écartent les uns des autres (idéal pour les réseaux denses).
2.  **Distance des Liens** : Définit la longueur des traits reliant les personnages. Utile pour aérer le centre du graphe si trop d'alliés sont proches.
3.  **Volume de Bulle (Collision)** : Crée une zone de protection autour de chaque portrait. Cela empêche les bulles de se chevaucher visuellement, même en cas de forte attraction.

> [!TIP]
> Si le graphe devient confus, utilisez le bouton **Réinitialiser** (icône Refresh) pour nettoyer le layout, ou cliquez sur **"Paramètres par défaut"** dans le panneau Sliders pour restaurer la configuration standard v5.

---

## 🕵️ Clues-OS (Gestion des Indices)

**Clues-OS** est le module dédié à la gestion des preuves, des rumeurs et des objets narratifs de votre campagne.

### 🔍 Pourquoi utiliser les indices ?

- **Traçabilité** : Ne perdez plus le fil de ce que vos joueurs savent vraiment.
- **Automatisation** : La révélation d'un indice génère automatiquement une note dans le **Journal-OS**.
- **Immersion** : Projetez visuellement l'indice sur le **Player Hub** au moment de sa découverte.

### 🎭 Fonctionnement du Cockpit (Clue Deck)

Dans le Master Cockpit, le widget **Clue Deck** vous permet :
- **Visualisation Filtrée** : Affiche en priorité les indices liés au lieu actuel (Atlas-OS).
- **Révélation Express** : Un bouton "Œil" pour passer l'indice en mode "Révélé".
- **Projection** : Un bouton dédié pour envoyer l'illustration et le texte de l'indice aux joueurs.

### 📝 Le Clues Manager

Accessible depuis le menu latéral, cet éditeur complet permet de :
- Rédiger le titre et le contenu (lore) de l'indice.
- Lier l'indice à une **Localisation** (Atlas) ou un **PNJ** (Propriétaire).
- Définir un **Moment de Campagne** (ex: "Automne 1492") pour la chronologie narrative.

---

## 🔍 Spotlight (Universal Search) - Navigation Express

Utilisez `CMD+K` (ou `CTRL+K`) pour ouvrir la barre de recherche globale. 

Session OS s'y intègre nativement :
- Trouvez instantanément n'importe quel **PNJ** ou **Héros**.
- Sautez vers une **Battlemap** ou un **Lieu** de l'Atlas.
- Consultez une règle du **Wiki** sans perdre votre contexte de jeu.

[Voir le guide complet du Spotlight](./Universal_Search_User_Guide.md)
