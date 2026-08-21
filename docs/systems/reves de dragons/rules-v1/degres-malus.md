---
sujet: Éthylisme (jet, degrés et malus)
systeme: reves-de-dragons
couverture: complète
hors_canevas: true
sources: non capturées (fiche v1 — références internes NotebookLM, pages à retrouver)
genere_par: notebooklm-v1
a_regenerer: true
relu: false
doublon_de: jet-ethylisme.md
---

# 📜 Fiche de Règle : Degrés d'Éthylisme et Malus

Cette fiche résume la gestion de la consommation d'alcool, ses effets sur le personnage (malus, fatigue, perte d'endurance), ainsi que les mécaniques de récupération. 

---

## 🎲 Mécanique de Base : Le Jet d'Éthylisme

Chaque fois qu'un personnage absorbe une dose d'alcool (ex: 20 cl de vin ou bière, 10 cl de brandevin), il doit effectuer un **Jet d'éthylisme** sur la Table de Résolution [1].

*   **Caractéristique utilisée :** **VIE** (Moyenne de TAILLE + CONSTITUTION) [1].
*   **Ajustement de difficulté :** Force du breuvage + Nombre de doses "sans effet" cumulées [1]. 
    *   *(Exemples de Force : Bière douce 0, Bière forte -1, Vin moyen -2, Hydromel -4, Brandevin -5)* [2].
*   **Malus global :** L'ajustement du jet tient compte de l'état général du personnage (fatigue et points de vie manquants), **mais pas** des malus d'éthylisme déjà acquis [3].

### Conséquences du Jet
*   ✅ **Toute Réussite :** Le personnage encaisse bien. Ses *Doses sans effet* augmentent de **+1** [1].
*   ❌ **Tout Échec :** L'alcool fait effet. Le personnage gagne **+1 Degré d'Éthylisme**, et son compteur de *Doses sans effet* retombe à **0** [1].

---

## 📊 Table des Degrés d'Éthylisme

À l'exception du stade "Éméché", chaque nouveau degré franchi inflige immédiatement la perte de **1d6 points d'Endurance** et un **malus cumulatif de -1** à toutes les actions (hors jets d'éthylisme ultérieurs) [1, 3].

| Degré | État | Malus aux actions | Perte d'Endurance |
| :---: | :--- | :---: | :--- |
| **0** | **Éméché** | 0 | Aucune |
| **1** | **Gris** | -1 | - 1d6 End |
| **2** | **Pinté** | -2 | - 1d6 End |
| **3** | **Pas frais** | -3 | - 1d6 End |
| **4** | **Ivre** | -4 | - 1d6 End *(+ Fatigue immédiate)* |
| **5** | **Bu** | -5 | - 1d6 End *(+ Fatigue immédiate)* |
| **6** | **Complètement fait** | -6 | - 1d6 End *(+ Fatigue immédiate)* |
| **7** | **Ivre mort** | -7 | - 1d6 End *(+ Fatigue immédiate)* |

*Note : Si un personnage "Ivre mort" continue de boire et rate un nouveau jet, il ne descend pas plus bas dans les malus, mais perd à nouveau 1d6 points d'Endurance* [4].

---

## ⚠️ Règles Spécifiques & Effets Secondaires

### 1. La Fatigue (Le "Coup de fouet" puis le contrecoup)
*   **Degrés 1 à 3 :** Ne déduisez que les points d'Endurance perdus, **sans cocher les cases de fatigue correspondantes** afin de simuler l'effet stimulant de l'alcool [3].
*   **Degré 4 (Ivre) et plus :** Le contrecoup arrive. Le joueur doit immédiatement **cocher toute la fatigue** correspondant à l'Endurance perdue précédemment. Désormais, toute nouvelle perte d'Endurance due à l'alcool se traduit immédiatement en fatigue [3].
*   *Arrêt prématuré :* Si le personnage s'arrête de boire avant le degré 4, il coche sa fatigue **30 minutes** après l'absorption de la dernière dose [3].

### 2. Le Sommeil Éthylique
Si la perte d'Endurance liée à l'alcool fait tomber le compteur d'Endurance du personnage à **0**, il sombre dans un coma éthylique [4].
*   Il perd automatiquement **1 Point de Vie (PV)** [4].
*   Il est impossible de le réveiller avant qu'il n'ait dormi au moins **1 heure complète** [4].

### 3. Le Moral : Vin Gai ou Vin Triste ?
*   **Au degré 0 (Éméché) :** Le personnage joue un Jet de Moral éthylique (1d20 ≤ 10 + Moral actuel). S'il réussit, son moral augmente de **+1** et l'alcool n'influencera plus son moral de la journée [2].
*   **Au degré 1 (Gris) :** S'il n'a pas gagné de moral au stade précédent, il rejoue un Jet de Moral. S'il réussit, **+1 Moral**. S'il échoue, il a le vin triste et perd **-1 Moral** (bloqué pour la journée) [5].

### 4. Qui a bu boira (L'addiction)
À partir du stade **Gris (Degré 1)**, chaque fois que le degré d'éthylisme augmente, le personnage doit réussir un jet de **VOLONTÉ/moral ajusté par l'inverse de son degré d'éthylisme actuel** (ex: malus -2 au degré Pinté) [6].
*   *Réussite :* Le personnage peut décider de s'arrêter [6].
*   *Échec :* Le personnage est incapable de s'arrêter et continue de boire [6].

---

## 🛏️ Récupération et Dessoûlement

*   **Baisse des degrés :** Le personnage élimine **1 degré d'éthylisme par heure**, la récupération commençant une heure après la dernière dose absorbée. Ceci est automatique (sans jet de dés) et ne nécessite pas de dormir [7].
*   **Endurance et Fatigue :** Ne se récupèrent **qu'en dormant**, selon les règles normales [7]. 
*   **Séquelles :** Chaque degré d'éthylisme encore actif dans le sang du personnage l'empêche de récupérer 2 points d'Endurance et d'effacer 2 cases de fatigue [7].

---

## 📖 Exemple de Cas Concret (Pour le MJ)

> **Mise en situation :** Brucelin a 14 en Vie. Il est à la taverne et commande un pot de Vin moyen (Force -2). Il est en pleine forme (aucun malus global).
> 
> **Verre 1 :** Il boit sa première dose. Son jet de Vie (14) est ajusté à **-2** (Force du vin -2 + 0 dose sans effet). Il réussit son jet de dés ! Il reste sobre, et son compteur de *Doses sans effet* passe à 1 [8].
> 
> **Verre 2 :** Il boit un second pot. Son jet de Vie est maintenant ajusté à **-3** (Force du vin -2 + 1 dose sans effet). Cette fois, il rate son jet ! [8]
> **Conséquences :** 
> * Il prend le Degré 0 (**Éméché**). Son compteur de *Doses sans effet* retombe à 0 [8].
> * Il tente un jet de Moral éthylique pour voir s'il a le vin gai, mais échoue [5].
> 
> **Verre 3 :** Agaçé, il reprend du vin. Jet de Vie à **-2** (Force -2 + 0 dose sans effet). Il rate encore ! [5]
> **Conséquences :**
> * Il passe au Degré 1 (**Gris**) [5]. 
> * Il prend **-1 de malus** sur toutes ses prochaines actions (sauf pour boire) et perd **1d6 points d'Endurance** (sans cocher la fatigue pour l'instant) [1, 3, 5]. 
> * Second jet de moral : échoué. Il a le "vin triste" et perd **-1 point de Moral** [5].
> * *Règle "Qui a bu boira" :* Il doit jeter sa VOLONTÉ/Moral avec un malus de -1 (son degré d'éthylisme) pour s'arrêter. Il échoue, et commande un 4ème verre... [6]