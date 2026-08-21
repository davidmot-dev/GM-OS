---
sujet: Jauges et ressources individuelles
systeme: reves-de-dragons
couverture: partielle
hors_canevas: false
sources: non capturées (fiche v1 — références internes NotebookLM, pages à retrouver)
genere_par: notebooklm-v1
a_regenerer: true
relu: false
---

# Fiche Règle : Gestion de la Fatigue et de l'Endurance

Dans *Rêve de Dragon*, l'Endurance et la Fatigue sont deux jauges intimement liées qui traduisent l'état physique, la résistance et l'épuisement d'un Voyageur. 

---

## 1. L'Endurance (Le potentiel vital à court terme)

L'Endurance représente les ressources physiques immédiates du personnage. 
* **Calcul :** Le score maximum d'Endurance correspond à la meilleure des deux sommes : `TAILLE + CONSTITUTION` ou `Points de Vie + VOLONTÉ` [1].

### A. Perte d'Endurance
L'Endurance baisse suite à un effort violent (course, nage), à l'asphyxie, à la famine, aux maladies, ou lors de chocs et blessures en combat [2]. **Toute perte d'Endurance entraîne une augmentation équivalente de la Fatigue** [3].

### B. Le Jet d'Endurance (Chocs traumatiques)
Lorsqu'un personnage perd **2 points d'Endurance ou plus en un seul round**, il doit immédiatement tester sa résistance [4].
* **Le Jet :** Lancer **1d20**. Le résultat doit être inférieur ou égal à l'Endurance *actuelle* [4].
* **Réussite :** Rien de spécial ne se produit [5].
* **Échec (ou 20 naturel) :** Le personnage est **Sonné** pour le reste du round en cours et tout le round suivant [4]. Toutes ses actions nécessitent alors une réussite *Significative* (les réussites normales deviennent des échecs, et les *Particulières* ne s'appliquent pas) [4, 6].
* **Réussite critique (01) :** Le jet est réussi et le personnage gagne immédiatement 1 point d'expérience en CONSTITUTION [4].

### C. Tomber à Zéro d'Endurance
Lorsqu'un personnage perd tous ses points d'Endurance, il tombe évanoui (inconscient) et **perd automatiquement 1 Point de Vie (PV)** [5].
* **Jet d'Héroïsme :** Si la perte d'Endurance amène le personnage *tout juste* à zéro et que cette perte ne dépasse pas son Seuil de Constitution (SC), il peut tenter un jet de **VOLONTÉ**. En cas de réussite, il reste conscient en conservant 1 point d'Endurance (mais subit tout de même le point de Fatigue) [7].

### D. Récupération de l'Endurance
* **Sans dormir :** Le personnage récupère 1 point toutes les 5 minutes, jusqu'à un maximum de la **moitié de son Endurance** (arrondie à l'inférieur) [5].
* **En dormant :** 1 heure de sommeil complète permet de récupérer toute son Endurance [5].
* **Limites :** 
  * Chaque Point de Vie manquant empêche la récupération de 2 points d'Endurance [8].
  * Une blessure Grave bloque l'Endurance maximale à la moitié (en dormant) ou au quart (sans dormir) [8].
  * Une blessure Critique limite l'Endurance maximale à 1 seul point [8].

---

## 2. La Fatigue (L'épuisement à long terme)

La Fatigue se coche sur un tableau dédié (la Piste de Fatigue), divisé en **8 lignes** numérotées de 0 à -7 [9, 10]. Chaque ligne contient un certain nombre de "cases" regroupées en "segments" en fonction de l'Endurance totale du personnage [9].

### A. Acquisition et Malus
* **Gains :** On acquiert de la Fatigue en perdant de l'Endurance (1 pour 1), mais aussi lors d'efforts prolongés sans perte d'Endurance (ex: 1 point pour 1h de veille ou de travail intellectuel, 2 points pour 1h d'effort physique moyen, ou via la marche) [3, 11].
* **Les Malus :** Tant que la Fatigue remplit la **ligne 0**, le personnage ne subit aucune pénalité [10]. Dès qu'il coche une case sur une ligne négative, **le numéro de la ligne devient un malus global** (-1 à -7) s'appliquant à l'ajustement final de *toutes* ses actions physiques, mentales et magiques [10].
* **Épuisement total :** Si toutes les cases du tableau de Fatigue sont cochées, le personnage tombe assommé de fatigue et s'endort immédiatement [10].

### B. Récupération de la Fatigue
La Fatigue se récupère exclusivement en dormant. On efface les cases en commençant par la dernière cochée (en bas à droite du tableau) [12].
* **Règle de base :** 1 heure de sommeil (120 minutes) permet d'effacer **1 segment complet** de Fatigue [12].
* **Segment entamé :** Si le dernier segment est entamé de *moins de la moitié*, 1 heure de sommeil permet d'effacer ce petit bout PLUS le segment complet précédent. S'il est entamé de la moitié ou plus, il compte comme un segment plein pour cette heure de sommeil [11, 12].
* **Limite liée à l'Endurance :** On ne peut jamais effacer une case de Fatigue si le point d'Endurance correspondant n'a pas été récupéré. Chaque point d'Endurance manquant "verrouille" 1 case de Fatigue [13].

---

## 3. Exemples Concrets d'Application

> **Exemple 1 : Choc et Jet d'Endurance**
> Lors d'un éboulement, Nitouche (Endurance maximale 23) reçoit des pierres et perd 16 points d'Endurance d'un coup [14]. Son Endurance tombe à 7 (23 - 16 = 7). Puisqu'elle a perdu plus de 2 points en un round, elle doit faire un Jet d'Endurance. Elle lance 1d20 et fait 13. C'est supérieur à son Endurance actuelle (7) : elle échoue et se retrouve **Sonnée** [14]. Elle devra faire des réussites Significatives pour ses prochaines actions d'esquive [14].

> **Exemple 2 : Gestion de la Fatigue et du Sommeil**
> Brucelin possède un tableau de fatigue dont les segments font 4 cases. Au cours de la journée, il a accumulé des points de Fatigue remplissant sa ligne 0, et entamant sa ligne -1 de 2 cases [13]. Il a donc un malus général de -1 [10]. Il décide de dormir :
> * Son dernier segment de 4 cases n'est entamé que de 2 cases (exactement la moitié) : cela compte donc pour un segment plein lors de la récupération [13]. 
> * Au bout d'une heure draconique (120 min) de sommeil, il efface ces 2 cases et repasse en ligne 0, perdant son malus [13].
> * S'il dort une heure de plus, il effacera le segment complet précédent (4 cases) [13].

> **Exemple 3 : Limites de récupération**
> Brucelin encaisse un terrible coup et souffre d'une perte de 4 Points de Vie [15]. La règle indique que chaque PV manquant bloque 2 points d'Endurance [8]. Brucelin a donc 8 points d'Endurance (4 x 2) totalement verrouillés et irrécupérables tant qu'il n'aura pas soigné ses blessures et récupéré ses PV. Par conséquent, les 8 premières cases de sa Piste de Fatigue sont également verrouillées et ne pourront pas être effacées, même s'il dort plusieurs jours [15].