# 🎲 Analyse Exhaustive de Dice-OS (v3 → v5)

Ce document détaille toutes les fonctionnalités, options et logiques métier extraites du module Dice-OS v3.

## 1. Moteurs de Calcul (Modes)

| Mode | Description | Paramètres spécifiques | Logic métier |
| :--- | :--- | :--- | :--- |
| **Somme (std)** | Somme classique avec modificateur. | Count, Mod | `Σ(dés) + mod` |
| **Seuil (threshold)** | Test de réussite contre une difficulté (DC). | Threshold, Rule (Over/Under) | `Σ(dés) + mod >= Seuil` ou `<= Seuil` |
| **Pool (pool)** | Compte de succès individuels. | Target (Success at), Mod | `Succès = Count(d >= Target) + Mod - Count(d == 1)` |
| **Pool Explosif** | Identique au Pool, mais les max relancents. | Target, Mod | Relance infinie si `d == max`. |
| **Explosif (exploding)** | Somme où les max explosent. | Count, Mod | `Σ(dés) + relances_max + mod` |
| **Avantage / Désavantage** | Lance 2 dés, garde le meilleur/pire. | Threshold, Rule | Compatible avec le système de Seuil. |
| **Rolemaster** | Jet de d100 ouvert (Open-ended). | Mod | 96+ relance et ajoute, 01-05 relance et soustrait. |
| **Year Zero (yze)** | Système pour Mutant Year Zero / Alien JdR. | Pool 1 (Base), Pool 2 (Gear) | Succès sur 6. Banes (Échecs critiques) sur 1 (Gear uniquement). |
| **Fate / Fudge** | Dés +, -, vide. | Count (default 4), Mod | Somme des symboles (-1, 0, +1). Adjectif qualitatif auto (Légendaire, etc.). |
| **Formule Libre** | Saisie textuelle libre. | Formula | Parseur gérant `1d20+2d6+mod`. |

## 2. Types de Dés Supportés

- **Dés Standards** : d4, d6, d8, d10, d12, d20, d100.
- **Dés Multi-Digit** :
  - **D44, D66, D88** : Lance 2 dés de même face, le premier est la dizaine, le second l'unité (ex: d66 → 11 à 66).
  - **D444, D666, D888** : Idem avec 3 dés (centaine, dizaine, unité).
- **Fate Dice** : Symboles `[-]`, `[ ]`, `[+]`.
- **Dés Personnalisés** : Capacité à lancer un dX quelconque via un prompt.

## 3. Options Globales

- **Modificateur (Mod)** : Valeur fixe ajoutée ou soustraite au résultat final.
- **Répétition (Repeat)** : Permet de lancer X fois la même série de dés dans un "Batch" (Série).
- **Règle de TEST (Rule)** : Switch entre "Supérieur ou égal" (Over) et "Inférieur ou égal" (Under).

## 4. Fonctionnalités de Confort (UX)

- **Quick Rolls (Favoris)** :
  - Enregistrement de formules nommées (ex: "Attaque Épée : 1d20+5").
  - Interface de gestion (ajout/suppression).
- **Historique** :
  - Affichage sous forme de cartes (Cards) détaillées.
  - Heure du jet, détail de chaque dé, modificateur, total et label de réussite.
  - Capacité de 50 entrées en mémoire.
  - Bouton "Effacer l'historique".
- **Batching** : Regroupement visuel des jets répétés dans un conteneur dédié.
- **Logs Système** : Envoi automatique des résultats dans le log global `log-os`.

## 5. Logique Visuelle (UI)

- **Codes Couleur** :
  - **Vert/Gras** (die-crit-max) : Valeur maximale sur le dé.
  - **Rouge/Gras** (die-crit-min/fail) : Valeur minimale (1).
  - **Barré** (die-discarded) : Dés ignorés (avantage/désavantage).
  - **Digit-Colors** : Couleurs distinctes pour les dizaines/unités des d66/d44 (Rouge, Bleu, Vert).
- **Adaptabilité** : Le panneau de configuration change dynamiquement selon le mode sélectionné (masque les champs inutiles).

## 6. Propositions pour v5 (Améliorations)

- **Typage Strict** : Remplacer les objets anonymes par des interfaces `RollResult`, `QuickRoll`, etc.
- **Zustand** : Déplacer l'état (History, QuickRolls) dans un store global synchronisé avec le `appBridge`.
- **Tailwind CSS** : Refonte visuelle utilisant le standard `Tailwind` de GM-OS v5.
- **Animation** : Intégrer des micro-animations lors de l'apparition des cartes de résultat.
- **Accessibilité** : Meilleure gestion des raccourcis clavier pour les jets rapides.
- **Extensibilité** : Permettre d'ajouter de nouveaux modes de calcul via un système de plugins plus propre.
