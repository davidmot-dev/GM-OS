# Walkthrough : Rule Engine & Forge Integration

Cette mise à jour introduit une automatisation majeure dans GM-OS v5 grâce à la Forge et à la refonte du moteur de règles.

## 🛠️ The Forge : Extraction IA Multimodale
La Forge permet désormais de générer des systèmes de jeu complets à partir de documents bruts.

- **Dual Extraction Processor** : Distinction entre le **BRAIN** (Logique de règles) et le **BODY** (Structure de fiche).
- **Format Intelligence** : Support natif des PDF, images de fiches, et fichiers Markdown/JSON.
- **Aetheric Guidance** : Zone d'instructions permettant de guider l'IA sur des mécaniques spécifiques (ex: "Favorise les jets sous carac").
- **Neural Mapping Hub** : Prévisualisation interactive du JSON généré avant l'injection définitive dans la bibliothèque.

## 🧠 Rule Engine Evolution
L'éditeur de système a été enrichi pour supporter la complexité croissante des JDR modernes.

- **Expanded Dice Engine** : Intégration de 12 modes de dés (YZE, d100, FATE, Pool, etc.) directement sélectionnables.
- **Cortex Tactique Bridge** : Configuration des échelles de distance (Contact -> Extrême) pour l'analyse automatisée des cartes.
## ✨ AI Oracle : Personnalités Dynamiques

L'Oracle est maintenant plus intuitif et puissant grâce à une refonte complète de la gestion des Personas.
- **Persistence & Sync** : Liaison automatique avec les modèles de fiches et les Notebooks de connaissances.

## ✅ Vérification
- **Forge IA** : Testé avec des PDFs de règles et des images de fiches (Cthulhu, Alien).
- **Moteur de dés** : Validation de la logique YZE et Somme.
- **Synchronisation** : Confirmation de l'injection des données dans `useSessionOSStore`.
