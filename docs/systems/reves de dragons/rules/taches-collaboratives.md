---
sujet: Jets opposés, aide et coopération
systeme: reves-de-dragons
couverture: partielle
hors_canevas: false
sources: non capturées (fiche v1 — références internes NotebookLM, pages à retrouver)
genere_par: notebooklm-v1
a_regenerer: true
relu: false
---

# 🛠️ Fiche de Règle : Mutualisation des Tâches (Actions Communes)

**Catégorie :** Règle de Système (Gestion du Temps et de l'Effort)

Le système de *Rêve de Dragon* permet de résoudre facilement les travaux de groupe ou les actions communes en utilisant la mécanique des **points de tâche** [1]. Les efforts de chaque personnage sont ajoutés à un "fonds commun" jusqu'à ce que l'objectif soit atteint [1].

---

## ⚙️ Mécanique de Résolution

### 1. Paramétrage par le Gardien des Rêves (MJ)
Avant de lancer les dés, le MJ doit déterminer les paramètres de l'action commune [1] :
*   **La Compétence / Caractéristique** sollicitée.
*   **La Difficulté** globale de l'action (qui peut éventuellement varier d'un personnage à l'autre selon leur état général).
*   **La Périodicité** (le temps que représente un jet de dés : 1 round, 10 minutes, 1 heure, etc.).
*   **L'Objectif** (le nombre total de points de tâche requis pour finir le travail).

### 2. Le Jet de Dés
À la fin de chaque période définie par le MJ, **tous les participants** effectuent simultanément un jet de dés (**1d100**) sous leur Caractéristique/Compétence modifiée par la difficulté [1]. 

Chaque résultat produit un certain nombre de Points de Tâche, qui sont additionnés (ou soustraits) dans le **fonds commun** [1].

| Qualité du Résultat au d100 | Points de Tâche générés par personnage |
| :--- | :---: |
| **Réussite Particulière (Part.)** | **+3** [2] |
| **Réussite Significative (Sign.)** | **+2** [2] |
| **Réussite Normale (Norm.)** | **+1** [2] |
| **Échec Normal (Échec)** | **0** [2] |
| **Échec Particulier (Éch.P.)** | **-2** [2] |
| **Échec Total (Éch.T.)** | **-4** *(+ malus éventuels)* [2] |

*(Note : Les points négatifs ne signifient pas que le travail est "détruit", mais que l'action prendra finalement plus de temps que prévu à cause d'erreurs ou de complications [3]).*

### 3. Résolution
Le travail est considéré comme **terminé dès que le nombre de points du fonds commun atteint ou dépasse l'Objectif** [1]. Le MJ compte alors le nombre de périodes écoulées pour connaître le temps total investi.

---

## ⏱️ Variante : Tâche commune en temps limité
On peut régler de la même manière une tâche accomplie à plusieurs avec une contrainte de temps stricte [1]. 
*   Le MJ fixe un nombre de périodes maximum (le temps imparti).
*   Si le total des points de tâche requis n'est pas atteint à la fin de la dernière période, l'action commune est un échec [1, 2].

---

## 📝 Exemple Concret en Jeu

> **Situation :** Il se met à pleuvoir. Nitouche et Brucelin décident de construire un abri pour la nuit [1].
> 
> **Paramètres du MJ [1] :** 
> * Jet requis : `DEXTÉRITÉ / Survie en extérieur` à une difficulté de `0`.
> * Périodicité : `10 minutes`.
> * Objectif : `4 points de tâche`.
> 
> **Déroulement [1, 4] :**
> * **Période 1 (10 min) :** Brucelin obtient une réussite normale (*+1 point*) et Nitouche un échec (*0 point*). **Fonds commun = 1 point**.
> * **Période 2 (20 min) :** Brucelin obtient une réussite particulière (*+3 points*) et Nitouche un échec particulier (*-2 points*). Bilan de la période : +1 point. **Fonds commun = 2 points**. *(1 + 3 - 2)*
> * **Période 3 (30 min) :** Nitouche obtient un échec (*0 point*), mais Brucelin réalise une réussite significative (*+2 points*). **Fonds commun = 4 points**. *(2 + 0 + 2)*
> 
> **Conclusion :** L'objectif de 4 points est atteint. Il aura fallu 3 périodes de 10 minutes, soit **30 minutes au total** pour construire l'abri à deux [4].