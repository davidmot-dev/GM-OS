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

**Fiabilité & Précision** : Le système utilise une génération séquentielle optimisée pour **Ollama**, garantissant des instructions riches et sans coupures. De plus, l'IA sépare intelligemment le contexte du système et celui de la campagne (Isolation RAG) pour plus de clarté.

---

## 👥 Joueurs & Fiches de Jeu

Gérez votre table physiquement et numériquement dans l'onglet **Roster**.

### Fiches de Personnage Dynamiques
Les fiches sont entièrement adaptables :
- **Statistiques & Jauges** : Santé, Énergie, Santé Mentale. Les jauges visuelles permettent un suivi rapide du MJ.
- **Identité Visuelle** :
    - **Portrait** : L'image haute définition pour l'immersion (projetable).
    - **Token** : L'icône de jeton utilisée sur les cartes (**Map OS**) et dans la gestion de combat (**Combat OS**).
- **Notes du MJ (Privé)** : Une zone de saisie réservée au MJ pour noter les secrets d'un personnage (trahisons, objectifs cachés).
- **Documents Liés** : Liez des fichiers PDF ou images (depuis le Media Hub) directement à un personnage (ex: sa backstory, un artefact possédé).

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

## 🗺️ World Atlas (Atlas Mondial)

L'Atlas gère la géographie et les lieux d'intérêt :
- **Cartes Multiniveaux** : Du monde entier au simple donjon.
- **Entités Liées** : Épinglez des PNJ ou des objets directement sur vos cartes.
- **Lieux Actifs** : Épinglez vos lieux favoris pour qu'ils apparaissent dans le Cockpit de session pour un accès immédiat.

---

## 🔌 Obsidian Bridge : Alimentation Data

C'est l'outil ultime pour nourrir votre OS :
1.  **Lien direct** : Connectez Session OS à votre coffre **Obsidian**.
2.  **Injection IA** : Le bouton **"Sync to Oracle"** envoie le contenu de votre note Obsidian (lore, scénario) directement à l'Oracle pour qu'il le prenne en compte dans ses réponses.
