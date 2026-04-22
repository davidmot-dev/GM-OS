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

### 3. Intégration Forge & Explorer
- **Analyse Multimodale** : Support des PDF, Images, **Markdown (.md)**, **Text (.txt)**, **JSON** et **JSONL**.
- **Explorateur Local** : Scan automatique du dossier `docs/systems` pour importer vos documents PDF, MD, TXT, JSON et JSONL personnels.
- **Temps de Réflexion** : Augmentation du timeout IA à 120s pour l'analyse de livres de règles massifs.

---

## Démonstration Visuelle

````carousel
![Tableau de Bord de la Forge (Stitch Edition)](C:/Users/david/.gemini/antigravity/brain/cb9d3783-0a27-40e7-abae-77dac71e6b8a/media_templates_dashboard_1773352309972.png)
<!-- slide -->
![Nouvel Éditeur du Moteur de Règles (Logique & IA)](C:/Users/david/.gemini/antigravity/brain/cb9d3783-0a27-40e7-abae-77dac71e6b8a/rule_engine_editor_1773396789927.png)
<!-- slide -->
![Configuration de la Résonance IA sur fiche native](C:/Users/david/.gemini/antigravity/brain/cb9d3783-0a27-40e7-abae-77dac71e6b8a/template_resonance_editor_1773396749471.png)
<!-- slide -->
![Vidéo de vérification du workflow complet](C:/Users/david/.gemini/antigravity/brain/cb9d3783-0a27-40e7-abae-77dac71e6b8a/verify_rule_engine_editor_1773396579672.webp)
````

---

## Comment l'utiliser ?

1.  **Pour Enrichir un Système Existant** : 
    *   Allez dans la Bibliothèque, onglet **RÈGLES (DRIVERS)**.
    *   Cliquez sur **« ÉDITER LE MOTEUR »** pour configurer les dés ou le prompt global.
2.  **Pour Personnaliser l'IA d'une Fiche** : 
    *   Dans l'onglet **FICHES (UI)**, cliquez sur **« RÉSONANCE & CUSTOM »**.
    *   Modifiez les instructions des Personas (Oracle, Sage, etc.).
3.  **Pour Forger un Nouveau Système** : 
    *   Utilisez le **System Forge** avec vos PDF ou Markdown. Les résultats viendront nourrir directement votre bibliothèque de moteurs de règles.

## Guide de Migration Visuelle (Avant/Après)
- **Avant** : Les réglages IA étaient enfouis et bloqués pour les systèmes officiels.
- **Après** : Interface premium dédiée, édition libre via surcharges automatiques, et support NotebookLM par système.
