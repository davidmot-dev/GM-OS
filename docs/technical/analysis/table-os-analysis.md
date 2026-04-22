# Analyse : Table OS

Ce document recense exhaustivement les fonctionnalités natives du module **Table OS** de GM-OS v3, en vue de leur refonte dans l'architecture v5.

## 1. Description Générale

Table OS est un gestionnaire et lanceur automatisé de tables aléatoires. Il permet au Maître du Jeu d'extraire des résultats narratifs et mécaniques d'une base de données JSON classée par Univers/Jeu, avec un tirage de dés automatisé (prenant en compte les modificateurs) ou manuel.

## 2. Interface Utilisateur (UI)

* **Barre Latérale (Aside - Contrôles) :**
  * Sélecteur "JEU / UNIVERS" (Liste des dossiers détectés).
  * Sélecteur "TABLE ALÉATOIRE" (Liste des fichiers JSON dans l'univers sélectionné).
  * Zone d'information (`table-info-display`) : Affiche le dé requis pour la table (ex: "Dé requis : 1d100").
  * Input "Modificateur de Jet" : Valeur numérique à ajouter/soustraire au jet.
  * Bouton "🎲 LANCER" : Actionne le tirage aléatoire complet.
  * Input "Jet manuel" & Bouton "Afficher" : Permet au MJ de forcer un résultat de dés (ex: saisir 15 et cliquer sur Afficher) évitant l'aléatoire.
* **Affichage Principal (Main - Résultats) :**
  * Affiche initialement un texte vide ("Sélectionnez une table...").
  * Lors d'un résultat, s'affiche sous forme de carte (`npc-card-display`) contenant :
    * L'en-tête (Bleu) : Valeur de dé finale (avec détail base + modificateur) et le Titre du résultat tiré.
    * Description narrative (Texte normal).
    * Effet Mécanique (Optionnel, affiché dans un bloc rouge/sombre agressif s'il existe).
    * Bouton final : "📝 Envoyer au Log Session".

## 3. Logique Métier & Comportements

* **Format de la base de données :**
  * Lecture arborescente depuis `Save/databases/tables/` ou de façon locale (ici on va devoir l'adapter de Node.js `fs` à Tauri/Electron IPC ou un fetch web).
  * La hiérarchie V3 attendue : `dossierUnivers / NomDeLaTable.json`
  * Format JSON d'une table :
    * `name` : Nom lisible de la table
    * `dice` : Formule du dé (ex: "1d20", "2d6", "1d66")
    * `entries` : Tableau d'objets, chaque objet ayant :
      * `min` : Seuil minimal pour le déclenchement
      * `max` : Seuil maximal pour le déclenchement
      * `title` : Titre du résultat (ex: "Bourse pleine")
      * `description` : Détail (ex: "Vous trouvez 15 pièces d'or")
      * `effect` : (Optionnel) Ajout de règles (ex: "Avantage au prochain jet")
* **Lancer de Dés & Résolution :**
  * Identifie la formule `dice` (ex: "1d20").
  * Partage la **même logique spécifique** que le _Dice OS_ pour les dés "Digits" (d44, d66, d88, d444, d666, d888) qui concatènent les tirages au lieu d'en faire la somme (ex: un lancer de 3 et 6 sur un d66 donne un Résultat de 36, non 9).
  * Somme classique pour le reste (ex: 2d6).
  * Ajoute le `modificateur` à la somme.
* **Traitement de dépassement (Out of bounds) :**
  * Si le score final est supérieur au `max` de la dernière entrée, la table retourne l'entrée la plus haute. Idem pour le plus bas.
* **Connectivité avec les autres modules :**
  * Le bouton "📝 Envoyer au Log Session" concatène le résultat du tirage automatiquement dans les notes du MJ de **Session OS** (`sessionApp.getCurrentSession().gmNotes`), puis rafraîchit l'interface de Session OS pour montrer la mise à jour en temps réel.
  * Génère un Log textuel (Log OS) à chaque tirage (ex: `Table [Trésors] : 14 -> Potion de soin`).

## 4. Persistance (Gestion d'État)

* **Pas de fichier d'état local :** Le module ne sauvegarde pas l'historique de ses lancers.
* Lit son environnement à chaud (fichiers JSON).
* Sa seule persistance est la transmission de son résultat au _Session OS_.
