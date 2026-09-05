# 📅 Session-OS — le cockpit

**Session OS** est le cœur décisionnel de GM-OS. C'est ici que vous gérez vos campagnes, suivez la
progression de vos joueurs, préparez vos scénarios et archivez les chroniques de vos aventures.
C'est l'interface qui lie tous les autres modules entre eux.

> 📖 **Trois de ses parties ont leur propre guide**, parce qu'elles sont devenues des modules à part
> entière : la [trame narrative](./11-Trame-actes-et-scenes.md) (actes et scènes), le
> [journal de séance](./14-Journal-de-seance.md), et la
> [sauvegarde automatique](./91-Sauvegarde-automatique.md).

````carousel
*(Capture « Master Cockpit » — perdue lors du déplacement du projet.)*
<!-- slide -->
*(Capture « World Atlas » — perdue lors du déplacement du projet.)*
<!-- slide -->
*(Capture « Session Prep » — perdue lors du déplacement du projet.)*
<!-- slide -->
*(Capture « Obsidian Bridge » — perdue lors du déplacement du projet.)*
````

---

## 📚 Campaign Library (Bibliothèque de Campagnes)

La **Campaign Library** est votre point d'entrée. Elle permet de segmenter vos différentes aventures.

### Créer une Aventure

Lors de la création d'une campagne, vous devez configurer plusieurs éléments clés :

- **Nom & Synopsis** : Le titre et l'intrigue principale. Le synopsis aide l'IA à comprendre l'enjeu global.
- **Système de Jeu (Rule Engine)** : **Crucial.** Vous choisissez ici le moteur qui gérera les dés, les fiches et l'intelligence de combat (ex: Alien RPG, D&D 5e).
- **Wallpaper** : Une image d'ambiance qui définit le fond visuel de tout votre OS pendant cette campagne.
- **Le corpus de la campagne** : les dossiers que l'Oracle indexera pour répondre à vos questions
  sur le monde. Une campagne peut désigner **plusieurs racines** — celle du jeu, la sienne, et un
  coffre Obsidian.

> ⚠️ **Les racines s'ajoutent, elles ne se remplacent pas.** Jusqu'au 2026-08-22, désigner un coffre
> Obsidian **écrasait** la racine documentaire : l'Oracle cessait de voir les règles du jeu sans le
> dire. Le coffre est aujourd'hui une racine **supplémentaire**, éteinte par défaut, et un coffre
> illisible n'enlève jamais rien au reste.

- **La langue de la Forge** : on peut forger depuis un livre anglais et vouloir un résultat en
  français. Réglage **par campagne** ; sans lui, la langue de l'interface sert de repli.

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

- **Dans les Campagnes** : pour adapter les **huit** personas (GEMS) au ton et au synopsis de votre
  aventure — le Sage, l'Oracle, l'Acteur, l'Alchimiste, le Barde, le Cartographe, le Scribe et le
  Stratège.
- **Dans le Rule Engine (Drivers)** : Pour définir les comportements par défaut de tout un système de jeu.

**Précision** : Le système utilise une génération séquentielle optimisée pour **Ollama**, garantissant des instructions riches et sans coupures.

### AI NPC Dialogue Prep (Nouveauté v6.1.2)

L'Oracle est désormais synchronisé avec vos PNJs actifs. Si vous avez épinglé un PNJ dans votre galerie, vous pouvez utiliser le Persona **"L'Acteur"** pour générer des répliques personnalisées à la volée. L'IA injecte automatiquement les motivations et le background du PNJ dans sa "conscience live" pour garantir une interprétation fidèle.

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

- **Le Header Global (v5.3)** : Situé tout en haut, il contient désormais le **Bouton Panique (Stop All)** pour tout éteindre en urgence, le curseur de volume master, et le bouton **Focus Chat** pour tamiser l'ambiance sonore.
- **Les Personnages Actifs** : Portraits et barres de vie mis à jour instantanément.
- **Le Workspace & Session Notes** : Zone d'édition rapide et multilingue pour vos notes de session. Supporte désormais l'auto-sauvegarde atomique et la synchronisation avec le Cerveau IA.
- **Les Snapshots** : voir section ci-dessous.
- **Deck-OS** : la bibliothèque de paquets, ou le lecteur si un paquet est lié à la campagne.
- **Loot-OS** : le butin de séance — génération, pool, distribution, historique.

### La colonne de navigation

Elle mène aux écrans qu'on ouvre **pendant comme avant** une séance :

| | |
| :--- | :--- |
| **Storyboard** | Les moments de la campagne |
| **Galerie PNJ** | Les fiches de vos personnages non joueurs |
| **Social Nexus** | Le graphe des relations |
| **Atlas du Monde** | Les lieux et leurs cartes |
| **Chroniques & Wiki** | La chronologie et les fiches du monde |
| **Loot-OS** | Le butin |
| **La trame** | Actes et scènes |

> ⛔ **« Chroniques & Wiki » n'était pas dans cette colonne avant le 2026-09-05**, et son unique
> bouton vivait dans le **panneau de campagne**. Or ce panneau est un écran d'atelier : **dès
> qu'une séance s'ouvre, GM-OS vous ramène au cockpit** (voir « Deux dispositions » plus bas).
> La chronologie et le wiki devenaient donc **inatteignables en pleine partie** — sauf par la
> recherche universelle, que rien n'indique.
>
> *Trouvé par David en séance. Le classement interne rangeait pourtant cet écran parmi ceux « des
> deux côtés », avec ce commentaire : « on les bâtit le samedi matin et on les consulte le samedi
> soir ». **La navigation ne tenait pas ce que le classement promettait** — c'est la porte qu'on a
> ajoutée, pas le classement qu'on a changé.*

---

## 🎭 La trame : où l'on en est de l'histoire

Le cockpit affiche **l'acte en cours** et le nombre de **scènes ouvertes ou en pause**. Un clic
dessus ouvre la trame.

Les **gestes** — ouvrir une scène, la terminer — ne sont pas là : ils vivent dans le panneau de
séance. *Un second endroit pour ouvrir une scène ferait deux écrans à tenir d'accord.*

→ [Guide de la trame narrative](./11-Trame-actes-et-scenes.md)

## 📓 Le journal, et la clôture d'une séance

Pendant que vous jouez, les modules **écrivent d'eux-mêmes** au journal : combats, déplacements,
jets, dons d'objets, questions posées à l'Oracle.

À la clôture, deux étapes : une **curation** scène par scène — la vôtre, dix minutes — puis un
**compte rendu** en trois sections, dont deux se calculent sans modèle.

⚠️ **Une séance qui se termine ne termine pas ses scènes : elle les suspend.** Elles reprendront à
la séance suivante de la même campagne.

→ [Guide du journal de séance](./14-Journal-de-seance.md)

## 🛟 La sauvegarde tourne pendant ce temps

Sans que vous ayez rien à lancer : deux minutes après votre dernier changement, à la fermeture de
l'application, avant toute suppression de campagne, et à la clôture d'une séance.

→ [Guide de la sauvegarde automatique](./91-Sauvegarde-automatique.md)

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

- **Le Module Actif** : retrouvez directement le module sur lequel vous travailliez (ex : Map-OS).
- **L'État des Panneaux** : si vos assistants IA (GEMS) ou votre Cortex Tactique étaient ouverts,
  ils le resteront.
- **Thème Visuel** : chaque campagne peut avoir sa propre identité visuelle.

### ⭐ Deux dispositions, pas une : l'atelier et la table

GM-OS retient **deux** dispositions par campagne — celle d'**hors séance** (l'atelier) et celle
d'une **séance ouverte** (la table).

> *« On retrouve son atelier tel qu'on l'a laissé le samedi matin, et sa table telle qu'on l'a
> laissée le samedi soir. »*

Tant que vous n'avez rien réglé en séance, c'est la disposition de l'atelier qui sert — jamais une
disposition vide. **Un régime qui démarre nu n'est pas un second régime, c'est une perte.**

> ⚠️ **Ouvrir une séance vous ramène au cockpit** si vous étiez sur un écran d'atelier — la Forge,
> la bibliothèque, le panneau de campagne, la préparation de séance. C'est voulu : *un écran
> d'atelier n'a rien à faire devant soi quand la table attend.* Rien ne se déclenche dans l'autre
> sens : fermer une séance ne vous chasse d'aucun écran.
>
> **Conséquence à connaître** : tout ce qui n'a de porte **que** dans un écran d'atelier devient
> hors de portée pendant la partie. C'est ce qui est arrivé aux Chroniques jusqu'au 2026-09-05.

---

## 📐 Workspace Sync v2 - Auto-Layout Intelligent

GM-OS intègre désormais une détection matérielle des moniteurs pour optimiser votre espace de travail.

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

### 📺 Montrer un lieu à la table

**Ajouté le 2026-09-06, à la demande de David.** Sur la fiche d'un lieu, le bouton
**Projeter** ouvre la liste de vos écrans — *Player Hub*, puis chaque moniteur
détecté — et y envoie l'image du lieu. Un second appui sur une ligne allumée la
coupe, et le bouton **affiche les écrans où le lieu est à l'antenne** : vous n'avez
pas à ouvrir la liste pour savoir si vous montrez quelque chose.

> ⚠️ **À ne pas confondre avec « Envoyer à Map-OS », juste à côté.** Les deux
> gestes se ressemblent et ne font pas la même chose :
>
> | Bouton | Ce qu'il fait |
> | --- | --- |
> | **Projeter** | **Montre** le lieu sur un écran, comme une illustration |
> | **Envoyer à Map-OS** | En fait un **plateau tactique** : pions, brouillard, mesures |
>
> *On regarde une ville, on joue sur un donjon.*

> 🔎 **Un lieu dont l'image est une vidéo se projette aussi**, et se comporte alors
> comme n'importe quelle vidéo — voir
> [Image-OS](./24-Image-OS-la-regie-visuelle.md) pour son son.

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

### 📌 Placer les personnages à la main (v6.5)

Vous pouvez composer votre propre disposition sans lutter contre la simulation :

- **Déplacez un portrait** : il **reste** là où vous le posez, verrouillé ou non. C'est une décision, GM-OS la retient et la garde pour la campagne.
- **Un compteur ambré** (icône épingle barrée) apparaît dès qu'un nœud est posé à la main, et indique combien il y en a. Cliquez dessus pour **tout rendre à la simulation**.
- **Verrouiller / déverrouiller** fige ou libère l'ensemble du graphe. Au déverrouillage, seuls vos nœuds posés à la main restent en place — les autres reprennent leur mouvement **à partir d'où ils étaient**, sans se remélanger.
- **Réinitialiser** efface tout, épingles comprises : c'est le seul geste qui rende le graphe à la simulation seule.

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

[Voir le guide complet du Spotlight](./94-Recherche-universelle.md)

---

## 📱 Tablet Hub & Synchronisation Distante

Le **Tablet Hub** est l'interface dédiée aux joueurs (sur tablette ou second écran). Depuis la v6.1.2-dev, la synchronisation a été renforcée pour une immersion totale.

### 🖼️ Affichage des Médias MJ
Vous pouvez désormais projeter en toute confiance :
- **Images IA** : Les portraits générés par l'IA Oracle s'affichent instantanément sur toutes les tablettes.
- **Chemins Locaux (Bridge)** : Même si vos images sont stockées sur votre disque dur (`C:\...`), GM-OS fait office de pont (proxy) pour les envoyer aux tablettes via votre réseau local.
- **Smart De-duplication** : Si vous focalisez un PNJ (Spotlight) alors qu'il est déjà affiché dans les Favoris Partagés, GM-OS masque automatiquement le doublon pour garder l'écran aéré.

### 🎒 Inventaire & Collaboration
- **Transferts P2P** : Les joueurs peuvent s'échanger des objets via leur onglet **Sac**. Le MJ reçoit une notification pour valider ou refuser la transaction.
- **Notes Privées (Joueur)** : Chaque joueur dispose d'une zone de texte persistante pour noter ses théories. Depuis la v6.2.1-dev, ces notes sont synchronisées en temps réel vers le serveur MJ et sauvées dans le bundle de campagne.
- **Multi-langage Intégré** : Toutes les interfaces de la tablette s'adaptent automatiquement à la langue configurée par le MJ (Session Prep, Clues, Private Notes).

> [!TIP]
> Pour une expérience optimale sur tablette, assurez-vous que tous les appareils sont sur le même réseau Wi-Fi que le PC du MJ et que le **Nexus Bridge** est actif (icône antenne verte dans le Cockpit).
