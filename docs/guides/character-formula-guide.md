# 🧮 Guide Utilisateur : Moteur de Calcul de Fiches

Ce guide explique comment utiliser le moteur de calcul intégré pour automatiser les statistiques de vos personnages dans GM-OS.

## 🌟 Introduction

Le moteur de calcul permet de transformer n'importe quel champ de type "Nombre" en un champ dynamique. Vous pouvez définir des formules qui se recalculent automatiquement dès qu'une valeur change.

## 📝 Syntaxe de base

Pour utiliser une valeur dans une formule, utilisez le symbole `@` suivi du **nom du champ** (le label affiché).

### Exemples simples :
- `@Force + 10` : Ajoute 10 à la valeur du champ "Force".
- `@Force + @Dextérité` : Somme de deux caractéristiques.
- `@Niveau * 2` : Multiplie le niveau par 2.

## 🎲 Jets de Dés

Le moteur supporte la notation standard des dés de jeu de rôle.
- `1d20 + @Bonus` : Lance un dé 20 et ajoute le bonus.
- `@NombreDeDes d6` : Lance un nombre de dés de 6 égal à la variable transmise.
- `(2d10) * @Multiplicateur` : Calcul complexe avec parenthèses.

## ⚠️ Règles Spéciales

### 1. Espaces et Accents
Le moteur est intelligent mais les formules mathématiques n'aiment pas les espaces. 
- **Champ :** "Points de Vie"
- **Variable à utiliser :** `@PointsdeVie` (retirez simplement les espaces).
- Les accents sont supportés mais il est recommandé d'écrire `@Force` même si le champ s'appelle "Fôrcë".

### 2. Valeurs par défaut
Si un champ est vide, il est automatiquement considéré comme **0**. Vos formules ne "casseront" pas si une statistique n'est pas encore remplie.

### 3. Réactivité
Les calculs sont **instantanés**. Vous n'avez pas besoin de sauvegarder la fiche pour voir le résultat d'une formule évoluer pendant que vous tapez.

## 🛠️ Configuration (MJ uniquement)

1. Ouvrez l'**Éditeur de Templates** de fiches.
2. Ajoutez un nouveau champ.
3. Sélectionnez le type **Formule**.
4. Saisissez votre équation dans le champ "Formule".
5. Enregistrez le template.

## 💡 Astuces Avancées

Le moteur supporte également des fonctions logiques et mathématiques :
- `min(@Force, 20)` : Cap la force à 20 maximum.
- `abs(@Modificateur)` : Valeur absolue.
- `ceil(@Val / 2)` : Arrondi au supérieur.

---
*GM-OS v6 — Moteur de Calcul Dynamique*
