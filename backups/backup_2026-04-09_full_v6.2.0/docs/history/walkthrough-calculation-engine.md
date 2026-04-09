# 🔱 Walkthrough : Character Sheet Calculation Engine

*Date : 8 Avril 2026*
*Version : GM-OS v6.2.3-dev*

## 🎯 Objectif
Implémenter un moteur de calcul dynamique capable d'interpréter des formules complexes et des jets de dés au sein des fiches de personnages, tout en garantissant une réactivité "live" sans latence de sauvegarde.

## 🏗️ Architecture Implémentée

### 1. Moteur de Calcul (`CalculationEngine.ts`)
- Utilisation de `expr-eval` pour le parsing mathématique.
- Pré-processeur Regex pour transformer la notation `XdY` en fonction `roll(X, Y)`.
- Système de nettoyage des variables pour supporter le préfixe `@`.

### 2. Hook de Liaison (`useSheetCalculator.ts`)
- Extraction du contexte depuis `character.sheetData`.
- Support d'un `overrideData` pour injecter les modifications locales du `CharacterSheetEditor`.
- Résolution bidirectionnelle (ID technique et Label désinfecté).
- Initialisation défensive de toutes les variables du template à 0.

### 3. Intégration UI
- **CharacterSheetEditor** : Passage de `localData` pour la réactivité immédiate.
- **NpcDetail** : Passage du template pour la résolution des labels PNJ.
- **SheetTemplateEditor** : Ajout du type de champ `formula` et saisie de l'équation.

## 🧪 Résultats des Tests
- [x] Parsing `1d20 + @Variable` validé via Vitest.
- [x] Résolution des labels avec espaces et accents validée.
- [x] Réactivité live (frappe au clavier) validée manuellement.

## 📜 Évolutions Futures
- Support des dépendances circulaires (actuellement bloquées par `expr-eval` ou résultant en `0`).
- Optimisation des performances pour les fiches comportant plus de 100 calculs simultanés.

---
*Archivé dans docs/history/walkthrough-calculation-engine.md*
