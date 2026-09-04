# Walkthrough - System Forge ⚒️

Le **System Forge** est désormais un écosystème complet. Il permet non seulement d'extraire des systèmes à partir de documents, mais aussi de les enrichir avec une intelligence artificielle sur-mesure.

## Fonctionnalités Majeures de cette Phase

### 1. Extraction & Enrichissement (Rule Engine)
J'ai découplé l'intelligence du système (IA, dés, règles) du visuel (fiche). Désormais, chaque système dispose d'un véritable "cerveau" personnalisable, même s'il s'agit d'un système natif de GM-OS.

- **Éditeur de Moteur de Règles** : Une nouvelle interface plein écran pour configurer les dés, les protocoles IA et les liens NotebookLM.
- **Support NotebookLM Core** : Configuration directe de l'URL de connaissance pour chaque moteur de règles, permettant à l'IA de consulter les règles complètes en temps réel.

### 2. Résonance IA Universelle (Personas & Gems)
Les "Neural Overrides" (Personas comme l'Oracle ou le Sage) peuvent être modifiés pour n'importe quel système.
- **Surcharge des Systèmes Natifs** : Si vous modifiez un système natif (ex: Cthulhu Hack), une version "enrichie" est automatiquement créée pour votre bibliothèque, préservant l'original tout en permettant vos personnalisations.
- **Interface Dédiée** : Un éditeur de résonance accessible directement depuis la bibliothèque des fiches.

### 4. Intégration Combat OS & Dice OS
Le savoir extrait par la Forge alimente désormais directement les outils opérationnels du GM :
- **Initiative Dynamique** : Le Combat OS détecte le système actif et propose un bouton **« JET SYSTÈME »** utilisant la formule précise du jeu (ex: `1d20 + dex`).
- **Suivi Multi-Ressources** : Les cartes de combattants affichent dynamiquement des barres pour les ressources secondaires (Mana, Santé Mentale, Munitions) extraites par la Forge.
- **Indicateur de Driver** : Affichage permanent du système actif dans le panneau de contrôle du combat.
- **Badge de Synchronisation** : Un indicateur visuel (maillon) confirme en temps réel que les PV et stats sont synchronisés avec la fiche du personnage.

---

---

### 6. Système de Cohésion (Brain & Body)
Pour garantir une expérience cohérente, j'ai lié structurellement les fiches et les moteurs :
- **Liaison Bidirectionnelle** : Dans le **Moteur de Règles**, un nouveau sélecteur permet de choisir la **Fiche (Body)** associée. Sur la **Fiche**, un indicateur confirme quel moteur pilote le système.
- **Support Campagne** : Le formulaire de création de campagne affiche désormais un badge **« COHÉSION ACTIVE »** pour confirmer que l'IA utilisera les règles et la fiche synchronisées.

---

## Démonstration Visuelle

````carousel
*(Capture « Sélecteur de Fiche dans le Moteur de Règles » — perdue lors du déplacement du projet.)*
<!-- slide -->
*(Capture « Indicateur de Moteur sur la Fiche de Personnage » — perdue lors du déplacement du projet.)*
<!-- slide -->
*(Capture « Confirmation de Cohésion dans la Création de Campagne » — perdue lors du déplacement du projet.)*
<!-- slide -->
*(Capture « Tableau de Bord de la Forge (Stitch Edition) » — perdue lors du déplacement du projet.)*
<!-- slide -->
*(Capture « Nouveau Sélecteur de Cible (Brain vs Body) » — perdue lors du déplacement du projet.)*
<!-- slide -->
*(Capture « Vérification de l'intégration Combat OS (Standard Mode) » — perdue lors du déplacement du projet.)*
````

---

## Comment l'utiliser ?

1.  **Pour Enrichir un Système Existant** : 
    *   Allez dans la Bibliothèque, onglet **RÈGLES (DRIVERS)**.
    *   Cliquez sur **« ÉDITER LE MOTEUR »** pour configurer les dés ou le prompt global.
2.  **Pour Charger un Système dans le Combat** : 
    *   Le système de votre campagne active est automatiquement détecté.
    *   Dans le Combat OS, utilisez **« JET SYSTÈME »** pour automatiser l'initiative selon les règles extraites.
3.  **Pour Forger un Nouveau Système** : 
    *   Utilisez le **System Forge** avec vos PDF ou Markdown. Les résultats viendront nourrir directement votre bibliothèque de moteurs de règles.

## Guide de Migration Visuelle (Avant/Après)
- **Avant** : Combat OS et Dice OS étaient génériques et ignoraient les subtilités du système de jeu chargé.
- **Après** : Interface contextuelle qui s'adapte dynamiquement (dés, initiative, ressources) aux données extraites par la Forge.
