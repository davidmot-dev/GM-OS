---
sujet: Les points de tâche (actions dans la durée)
systeme: reves-de-dragons
couverture: complète
hors_canevas: true
sources: non capturées (fiche v1 — références internes NotebookLM, pages à retrouver)
genere_par: notebooklm-v1
a_regenerer: true
relu: false
---

# Fiche de Règle : Les Points de Tâche
*Catégorie : Règle*

## 1. Concept Général
Le système des points de tâche est utilisé lorsqu'une action s'inscrit dans la durée et qu'il est nécessaire de savoir combien de temps un personnage met pour en venir à bout (ex: construire un abri, crocheter une serrure complexe, soigner une blessure grave) [1]. 

Au lieu de se résoudre par un jet unique, l'action nécessite l'accumulation d'un certain nombre de **Points de Tâche** à travers plusieurs jets de dés réguliers [1].

---

## 2. La Procédure
Avant de commencer, le Gardien des Rêves (MJ) doit définir trois paramètres [1] :
1. **La Difficulté** de l'action (ex: 0, -2, -4, etc.).
2. **La Périodicité**, c'est-à-dire l'intervalle de temps entre chaque jet de dés (1 round, 1 minute, 1 heure, etc.).
3. **Le Nombre de Points de Tâche** requis pour que l'action soit considérée comme achevée.

**Résolution :** À la fin de chaque période définie, le joueur effectue un **jet de pourcentage (1d100)** sur l'association *Caractéristique / Compétence* concernée, en appliquant la difficulté fixée. Selon la qualité du résultat (du type de réussite ou d'échec), le personnage gagne ou perd des points de tâche [1, 2]. L'action est accomplie dès que le total des points exigés est atteint ou dépassé [1]. Le temps total écoulé se calcule en multipliant le nombre de périodes jouées par la durée de la périodicité [1].

---

## 3. Le Barème des Points
Chaque jet de dés à la fin d'une période rapporte ou fait perdre des points selon le tableau suivant [2] :

| Qualité du Résultat au jet (1d100) | Points de Tâche obtenus | Conséquence spéciale |
| :--- | :---: | :--- |
| **Réussite Particulière** (Part.) | **+3** | - |
| **Réussite Significative** (Sign.) | **+2** | - |
| **Réussite Normale** (Norm.) | **+1** | - |
| **Échec Normal** (Échec) | **0** | L'action stagne. |
| **Échec Particulier** (Éch.P.) | **-2** | L'action prend plus de temps que prévu. |
| **Échec Total** (Éch.T.) | **-4** | **Malus définitif de -1** à la difficulté des jets suivants pour cette tâche [1]. |

*Note du MJ : Les points négatifs ne signifient pas forcément que le travail est "défait", mais qu'il réclame finalement plus d'efforts et de temps que prévu [1]. Le MJ peut également décider qu'une maladresse (Échec Total) ruine définitivement le travail ou fixer un seuil de points négatifs éliminatoire [1, 3].*

---

## 4. Guide pour le MJ : Comment choisir les paramètres ?
Si les règles ne précisent pas les paramètres pour une situation donnée, le MJ peut s'appuyer sur la règle empirique suivante [4] :
* **Points de Tâche de base :** Une action moyenne demande **4 points de tâche**.
* **Périodicité de base :** Estimez le temps total que devrait prendre l'action, puis **divisez ce temps par 4**. 
* **Ajustement :** Modifiez ces bases selon la complexité. Une action *laborieuse* (difficulté -4) justifie souvent d'augmenter le nombre de points requis (ex: 5 points au lieu de 4) [5].

---

## 5. Règles Complémentaires

### Tâche en un temps donné
Si l'action doit être réalisée dans l'urgence, le MJ fixe un temps limite maximum [2]. Le joueur effectue ses jets à chaque période. Si le temps imparti est écoulé avant que les points ne soient atteints, l'action a échoué [2].

### Tâche accomplie à plusieurs (Coopération)
Plusieurs personnages peuvent participer à une même tâche. À la fin de chaque période, **tous** les participants font leur jet de compétence [6]. Les points gagnés et perdus par chaque personnage s'additionnent dans un "fonds commun" [6]. Le travail s'achève dès que le total du groupe atteint le seuil exigé [6].

---

## 6. Exemples Concrets d'Application

### Exemple 1 : Bricolage et Survie (Construction d'une passerelle)
Les personnages veulent construire un pont de fortune avec des sapins. 
* **Paramètres du MJ :** L'outil n'est pas adapté (épée au lieu d'une hache). Le MJ fixe la difficulté à **-3**, la cible à **6 points de tâche**, et la périodicité à **20 minutes** [3].
* **Déroulement (Jet de *DEXTÉRITÉ / Charpenterie* à -3) :**
  * Période 1 : Réussite normale = **+1 point**. (Total : 1)
  * Période 2 : Échec normal = **0 point**. (Total : 1)
  * Période 3 : Réussite particulière = **+3 points**. (Total : 4)
  * Période 4 : Réussite significative = **+2 points**. (Total : 6) -> *Succès !*
* **Bilan :** L'action a nécessité 4 périodes de 20 minutes, le pont est donc achevé en 80 minutes [2].

### Exemple 2 : Règle Fixe (Les Premiers Soins d'une Blessure)
La chirurgie d'urgence en combat est une règle utilisant des paramètres fixes de points de tâche [7] :
* **Périodicité :** 1 round [7].
* **Difficulté et Points de tâche requis :** Selon la gravité de la blessure [7].
  * *Blessure Légère :* Difficulté -2 / 2 Points de tâche requis.
  * *Blessure Grave :* Difficulté -4 / 4 Points de tâche requis.
  * *Blessure Critique :* Difficulté -6 / 6 Points de tâche requis.
* **Jet :** *DEXTÉRITÉ / Chirurgie*. Dès que les points sont accumulés, l'hémorragie s'arrête immédiatement et les pertes d'endurance ou de vie par round cessent [8].