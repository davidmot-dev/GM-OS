# 🎲 Guide Utilisateur : Dice OS

**Dice OS** est le moteur de probabilités central de GM-OS v5. Plus qu'un simple lanceur de dés, c'est un outil universel capable de gérer les mécaniques de centaines de jeux de rôle, tout en restant connecté à l'action tactique sur votre carte.

![Aperçu du module Dice OS](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/doc./user-guides/dice_mockup.png)

## 📋 Présentation du Module

Dice OS se divise en trois zones principales :
1. **Le Configurateur (Haut)** : Choisissez votre mode de jeu et vos paramètres.
2. **Le Plateau de Lancement (Centre)** : Lancez vos dés d'un clic ou via des raccourcis.
3. **Le Pont Tactique & Résultats (Droite)** : Consultez vos succès et calculez vos modificateurs de portée.

## ⚙️ Modes de Lancement Supportés

Dice OS supporte nativement une immense variété de systèmes :

| Mode | Description | Exemple |
| :--- | :--- | :--- |
| **Standard** | Somme simple de dés + modificateur. | d20 + 5 |
| **Explosif** | Si le max est atteint, on relance et on ajoute au total. | 2d6 (6 relancé) |
| **Pool (Succès)** | Compte le nombre de dés dépassant un seuil (Target). | 8d10 vs 8 |
| **Pool Explosif** | Identique au Pool, mais les dés max en génèrent de nouveaux. | Vampire, Shadowrun |
| **Seuil (Threshold)** | Un test de réussite/échec simple (Réussite si ≥ ou ≤ X). | Appel de Cthulhu |
| **Avantage / Désav.** | Lance 2 dés et garde le meilleur ou le pire. | D&D 5e |
| **Year Zero (YZE)** | Gère deux pools séparés (Base et Équipement) avec "Fléaux". | Mutant, Alien |
| **Year Zero échelonné** | Deux dés de **tailles différentes** (attribut + compétence), la lettre décidant du dé. | Blade Runner |
| **FATE / Fudge** | Utilise des dés +, -, O pour un résultat narratif. | Fate |
| **Rolemaster** | Dés 100 "ouverts" avec relances sur les hauts et bas scores. | Rolemaster |
| **Formule Libre** | Saisie manuelle de formules complexes. | `2d6 + 1d4 - 2` |

## 🎚️ Les Dés Échelonnés (Blade Runner)

Certains jeux ne lancent pas des dés tous identiques : la **lettre** inscrite sur la fiche décide de la taille du dé.

- **L'échelle** : `A` → D12, `B` → D10, `C` → D8, `D` → D6.
- **Deux dés de base** : un pour l'**attribut**, un pour la **compétence**. Vous les choisissez par leur lettre, pas par leur nombre de faces.
- **L'équipement** est facultatif, et échelonné lui aussi — le lui donner ajoute un troisième dé.
- **Lecture** : **6 ou plus** sur un dé vaut une réussite ; **10 ou plus** en vaut **deux** — ce qui n'est possible que sur un D10 ou un D12. La taille du dé décide donc de ce qu'il peut rapporter.
- **Avantage / Désavantage** : l'avantage ajoute un dé identique au plus petit, le désavantage retire le plus petit. Jamais les deux à la fois.

> [!TIP]
> **Votre choix l'emporte sur celui du pilote.** Si vous basculez le pupitre à la main en mode échelonné, le système de jeu actif ne le recouvre plus (corrigé le 03/09/2026 : deux D12 demandés lançaient des d6).

> [!NOTE]
> L'échelle des lettres est transcrite dans GM-OS, **pas dans le pilote de jeu** : une table recopiée par la Forge est une table qui peut être recopiée de travers sans que rien ne le dise.

---

## 🛰️ Le Pont Tactique (Tactical Bridge)

C'est la fonctionnalité signature de Dice OS. Elle permet de lier la position des jetons sur la carte à vos jets de dés :

1. **Sélectionnez un Attaquant** et une **Cible** dans le panneau de droite.
2. **Calcul de Portée** : Le moteur calcule instantanément la distance en cases et identifie la catégorie de portée (ex: *Portée Moyenne*).
3. **Application du Modificateur** : Cliquez sur le bouton de modificateur suggéré (ex: `-2`) pour l'appliquer automatiquement à votre prochain jet.

## ⭐ Quick Rolls (Favoris)

Ne perdez plus de temps à configurer vos sorts ou attaques récurrentes :
- **Ajout** : Cliquez sur le bouton "Ajouter", donnez un nom (ex: *Boule de Feu*) et saisissez la formule (ex: *8d6*).
- **Lancement** : Un clic sur le favori déclenche le jet instantanément.
- **Organisation** : Supprimez les favoris inutiles via la croix rouge.

## 📜 Historique et Analyse

Chaque jet est archivé dans l'historique :
- **Détail des Dés** : Visualisez chaque dé individuel pour vérifier les critiques.
- **Codes Couleur** : Vert pour les critiques max, rouge pour les échecs critiques, violet pour les dés explosés.
- **Répétitions (Batch)** : Vous pouvez configurer Dice OS pour lancer 10 fois le même jet d'un coup (pratique pour les groupes d'archers !).

---

## 💡 Astuces pour l'Expertise

> [!TIP]
> **Le Mode Système** : Si un "Game Driver" est actif dans votre session, Dice OS se configure automatiquement sur le bon mode (ex: il passera seul en mode YZE si vous jouez à Alien).

> [!IMPORTANT]
> **Dés Spéciaux (D66, D888)** : Saisir `1d66` dans la formule libre lancera deux d6 pour simuler un jet de dizaines et d'unités, avec un rendu visuel distinct par chiffre.

---

## ⚙️ Détails Techniques

- **Rendu 3D** : Bien que l'interface soit en 2D pour la rapidité, Dice OS envoie les commandes au **Player Hub** pour afficher de véritables lancers de dés 3D physiques aux joueurs.
- **Persistance** : Vos favoris (Quick Rolls) sont sauvegardés par campagne.
