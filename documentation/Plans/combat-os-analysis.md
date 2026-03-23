# Analyse : Combat OS (Tracker d'Initiative)

Ce document détaille les fonctionnalités du module **Combat OS** de GM-OS v3. Il s'agit d'un gestionnaire d'affrontement (Tracker de Combat) interconnecté avec plusieurs autres modules pour fluidifier la partie.

## 1. Description Générale

Combat OS est un outil de suivi d'initiative, de points de vie et d'altérations d'état. Il permet au MJ de gérer facilement l'ordre de passage d'un grand nombre de PNJ et de Joueurs, tout en diffusant cet ordre en temps réel sur l'écran partagé des joueurs (Player Hub) et en synchronisant la "caméra" du Map OS.

## 2. Interface Utilisateur (UI)

* **Barre Latérale (Aside - Contrôles) :**
  * **Bouton "+ Ajouter Combattant" :** Création manuelle d'une entité.
  * **Bouton "🔄 Sync PV vers Session" :** (Vert) Pousse les PV des joueurs vers le Session OS.
  * **Bloc "Auto Initiative (PNJ)" :** Un menu déroulant pour choisir le dé (d4 à d100) et un bouton "🎲 ROULER" pour attribuer une initiative aléatoire unique à tous ceux qui sont à `0`.
  * **Bloc "Sauvegarde / Chargement" :** Exporter et importer un combat entier (`.json`).
  * **Bouton "⚠️ Reset Combat" :** Permet de vider la liste.
  * **Bloc "Compteur de Tours" :** Affiche le numéro du Round ("01", "02"...).
  * **Gros Bouton "TOUR SUIVANT ▶" :** Fait passer l'initiative au combattant suivant.
* **Affichage Principal (Main - La Liste) :**
  * Bouton "Trier Initiative" : Pour forcer le tri (Croissant ou Décroissant).
  * **Liste des cartes (`combat-card`) :** Chaque combattant possède :
    * Un input d'initiative modifiable.
    * Un avatar cliquable (image ou lettre).
    * Un nom.
    * Une zone d'icônes affichant ses altérations d'état actives.
    * Un module PV contenant un input (PV Actuels) et du texte (PV Max), colorisé automatiquement ($>50$: Vert, $\le50$: Jaune, $\le25$: Rouge, $\le0$: Gris).
    * Un bouton de suppression rapide ("✖").
  * **Carte "Active" :** Le combattant dont c'est le tour a sa carte surlignée via la classe `.active` et est dé-grisée.

## 3. Logique Métier & Comportements

* **Structure d'un Combattant :**
  * `id`: `Date.now().toString(36)...` (Identifiant unique généré).
  * `name`: Nom d'affichage.
  * `init`: Score d'initiative (Numérique).
  * `hp` / `hpMax`: Points de Vie.
  * `statuses`: Array d'objets du type `{ name: "Empoisonné", duration: 2 }`.
  * `avatar`: Chemin local d'une image (optionnel).
  * `sourcePlayerId`: (Uniquement si ajouté depuis Session OS) L'ID du joueur pour la synchronisation.
* **Logique de l'Auto-Initiative :**
  * Si le MJ clique sur "🎲 ROULER", le module regarde **uniquement les combattants ayant 0 en Initiative**.
  * Il jette le dé sélectionné (ex: un d20) pour chacun.
  * *Astuce originale :* Il force l'unicité (pas d'égalité). S'il obtient un score déjà attribué, il relance le dé jusqu'à trouver un score libre (max 50 essais).
* **Altérations d'État (Statuses) :**
  * Une liste codée en dur de 10 états avec icônes (Empoisonné 🤢, Étourdi 😵, Paralysé 🔒, Brûlant 🔥, Invisible 👻, Aveuglé 🙈, À terre 🛌, Concentration 🧠, Soigné 💚, Hors combat 🏳️).
  * Lors de l'application, une durée (en Tours) est demandée au MJ via prompt (`0` = Infini).
* **Gestion du Temps ("TOUR SUIVANT") :**
  * Décale l'index `currentTurnIdx`. Si on arrive à la fin de la liste, on incrémente le `roundCount` et on revient à l'index 0.
  * **Décrémentation des États :** Lorsque le tour d'un participant commence (l'index s'arrête sur lui), *tous ses états temporaires (`duration > 0`) perdent 1 tour.* S'ils atteignent 0, l'état est supprimé (et le Log affiche qu'il se dissipe).

## 4. Écosystème & Interconnectivité (CRUCIAL)

Combat OS est au centre de l'application et "parle" à de nombreux autres modules :

1. **Avec Session OS :**
    * Session OS peut injecter directement les "PJ" (Joueurs) dans Combat OS.
    * Si un PNJ est généré via **NPC OS**, il peut être injecté dans le combat en un clic.
    * Le bouton "Sync PV" permet, lorsqu'un joueur prend des dégâts dans Combat OS, de modifier sa fiche dans Session OS. (*NOUVEAUté identifiée dans le code v3 : ça déclenche carrément un custom event global `player-hp-changed`*).
2. **Avec Map OS :**
    * À chaque changement de tour, Combat OS cherche si un "Token" (Mappemonde) porte le même nom que le combattant actif.
    * Si oui, **il centre automatiquement la caméra de la Map sur ce Token** (fonction `window.mapApp.highlightCombatTurn(p.name)`).
3. **Avec le Player Hub :**
    * À chaque mise à jour (Render), Combat OS envoie aux joueurs WebSockets (`ipcRenderer.send('sync-hub-data', 'combat'...)`) l'intégralité de sa liste pour affichage sur tablettes/téléphones de l'initiative sans divulguer les "PV exacts".
4. **Avec Log OS :**
    * Énormément de logs générés (Nouveau combattant, Début de Round X, Tour de Y, dissipation de buff).
