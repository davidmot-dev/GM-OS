# 🔱 Blueprint : Character Sheet Calculation Engine

Ce document définit l'architecture du moteur de calcul dynamique pour les fiches de personnages de GM-OS, permettant d'automatiser les scores et les jets de dés via des formules complexes.

---

## 🎯 Objectifs

1.  **Automatisation** : Permettre aux MJ de définir des champs dont la valeur est calculée automatiquement (ex: `PV = @Con + 10`).
2.  **Support des Dés** : Interpréter la notation standard des dés (ex: `1d20 + @StrMod`).
3.  **Réactivité** : Mettre à jour les calculs instantanément quand une statistique source est modifiée.
4.  **Extensibilité** : Supporter des fonctions logiques (MIN, MAX, IF).

---

## 🏗️ Architecture Technique

### 1. Couche d'Interprétation (The Parser)
Utilisation de **mathjs** ou **expr-eval** comme moteur de base pour la sécurité et la performance.
- **Dice Wrapper** : Pré-processeur pour transformer `XdY` en une fonction interne `roll(X, Y)`.
- **Variable Prefix** : Utilisation du préfixe `@` pour identifier les variables liées aux données de la fiche.

### 2. Résolveur de Contexte (Variable Resolver)
Le moteur doit injecter un objet de contexte à chaque évaluation :
```typescript
const context = {
  ...character.sheetData,
  Level: character.level,
  StrMod: Math.floor((character.sheetData.Str - 10) / 2)
};
```

### 3. Graphe de Dépendances (Reactive Graph)
Pour éviter les boucles infinies et optimiser les calculs :
- **Tri Topologique** : Déterminer l'ordre de calcul si A dépend de B.
- **Cache** : Ne recalculer que si une dépendance a changé.

---

## 🛠️ Spécifications d'implémentation

### Structure d'un champ Formule
Dans le template de la fiche :
```json
{
  "id": "atk_bonus",
  "type": "formula",
  "label": "Bonus d'Attaque",
  "formula": "1d20 + @StrMod + @Proficiency"
}
```

### Pipeline d'évaluation
1.  **Trigger** : Modification d'une valeur dans `sheetStore`.
2.  **Scan** : Identifier les champs de type `formula`.
3.  **Parse** : Extraire les variables `@Var`.
4.  **Resolve** : Récupérer les valeurs actuelles pour chaque variable.
5.  **Compute** : Exécuter l'évaluation mathématique.
6.  **Store** : Sauvegarder le résultat dans un état dérivé ou directement dans `sheetData`.

---

## ⚠️ Analyse des Risques

| Risque | Description | Mitigation |
| :--- | :--- | :--- |
| **Dépendance Circulaire** | `@A = @B + 1` et `@B = @A + 1`. | Détection de cycle lors du parsing de la formule. |
| **Performance** | Ralentissement sur les fiches avec 50+ calculs. | Évaluation paresseuse (lazy) ou via Web Worker. |
| **Erreur de Syntaxe** | Formule mal tapée par l'utilisateur. | Validation en temps réel avec message d'erreur explicite. |

---

## 📋 Prochaines Étapes

- [x] Sélection de la bibliothèque de parsing mathématique (`expr-eval`).
- [x] Création du service `CalculationEngine.ts`.
- [x] Ajout du type `formula` dans `SheetField`.
- [x] Implémentation du hook `useSheetCalculator` (support de la réactivité live).
- [x] Support des Labels (Variables nommées ex: `@Force`).
