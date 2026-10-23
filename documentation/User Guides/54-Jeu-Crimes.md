# 🕯️ Jeu — Crimes

> **Pilote décrit :** « Crimes », exporté le 2026-10-21, corrigé le 2026-10-22 pour le jet
> **Potentiel GARDE Compétence** (`outils/crime/corriger_le_jet_garde.py`), puis pour les
> **atteintes** et le **dépassement** (`outils/crime/ajouter_les_atteintes.py`), puis pour le
> **dossier d'enquête** et les **armes** (`outils/crime/ajouter_enquete_et_armes.py` →
> `Export Dirvers/corriges/Crime_driver_gmos_c5-c6.gmos-driver`). Retour à
> [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Le **test**, où l'on lance des d10 et où l'on en **garde** une partie ; les **atteintes** qui
font baisser les Potentiels ; le **dépassement** ; le **dossier d'enquête** et ses points ;
l'**attaque**, avec les armes du livre. La fiche de personnage HTML et ses
spécialisations les nourrissent.

> Règles relues contre le livre *Crimes 2 — Manuel de l'Enquêteur* et le corpus
> `docs/systems/crime/`, dont les **19 fiches ont été relues une à une le 2026-10-23** (C0) :
> quatre bilans et non cinq, le jet sans compétence, la santé sans mort automatique (mais une
> consigne au meneur à −2, p. 393), les points d'enquête qui se cumulent sans se dépenser.

---

## Le test : Potentiel GARDE Compétence

![Le panneau de jet de Crimes : Physique 5, Sport 2 — cinq dés, deux gardés, seuil 8](captures/jeu-crimes-jet.jpg)

- À l'étape **Composer**, on retient un **Potentiel** (Physique, Mental, Social) et une
  **Compétence**. Le Potentiel donne le nombre de **d10** lancés, la Compétence le nombre de dés
  **gardés**. Sans la compétence (valeur 0), on n'en garde **qu'un**.
- Sous les menus, le panneau dit d'où sortent les nombres : **Réserve** (le Potentiel),
  **Gardés** (la Compétence) et **Seuil par dé** — **9** de base, **8** si le personnage a la
  compétence, **7** avec une spécialisation appropriée.
- Il n'y a **ni difficulté à régler, ni dés à acheter** : ce jeu ne compte pas des réussites
  contre un nombre.

### La spécialisation

À l'étape **Préparer**, le menu **Spécialisation** propose seulement les spécialisations que la
fiche **coche** pour la compétence retenue — Escalade et Équitation pour Sport, par exemple. Elle
baisse le seuil de chaque dé à 7. Au meneur de juger si elle s'applique à l'action ; « — aucune — »
la retire. Sans spécialisation cochée, le menu reste grisé.

### Le résultat : les dés gardés, et l'un des quatre bilans

![Après le lancer : deux dés gardés, trois écartés, et le bilan](captures/jeu-crimes-jet-lance.jpg)

- Le panneau garde d'abord **tous les 1** — ils sont imposés et marqués **Un** —, puis les
  meilleurs dés. Les autres sont **Écartés**.
- Le bilan s'affiche en haut à droite, avec le nom du livre :
  - **Échec critique** : plus de 1 que de réussites parmi les dés gardés ;
  - **Échec** : aucune réussite gardée ;
  - **Réussite mitigée** : autant de 1 que de réussites ;
  - **Réussite** : plus de réussites que de 1 — et **succès important** à trois réussites gardées.
- Sous les dés, le panneau dit ce que le jet fait à la **Névrose** (p. 409) : +1 sur un échec, +1
  si des réussites n'ont pas pu être gardées, −1 sur un succès important. **Il ne l'écrit pas sur la
  fiche** : c'est au meneur de l'appliquer (le suivi de la psychologie est un chantier à venir).

### Changer sa garde

![Un dé écarté pris dans la garde : la réussite devient un échec, à consigner](captures/jeu-crimes-garde-choisie.jpg)

Le livre permet de garder de mauvais dés pour **échouer volontairement**. Cliquez un dé
**écarté** : il entre dans la garde à la place du meilleur dé gardé. Cliquez un dé **gardé** : il
sort, au profit du meilleur dé écarté. Les **1** ne s'échangent pas. Le bilan et la Névrose se
recalculent aussitôt.

Le journal a déjà reçu le jet tel qu'il est tombé. Pour y inscrire la garde choisie, cliquez
**Consigner cette garde** : le journal ajoute une ligne « … · garde choisie ». Sur la tablette,
le jet et la garde choisie remontent au meneur de la même façon.

---

## Les atteintes : fatigue, épuisement, blessures

![La carte « Potentiels et atteintes » : Physique 5, une blessure et une fatigue, actuel 3](captures/jeu-crimes-atteintes.jpg)

Les Potentiels sont des jauges (livre p. 395) : leur valeur de départ ne bouge pas, et l'on
teste avec la valeur **actuelle**. Trois marques la font baisser :

| Marque | Sur la fiche | S'efface |
| --- | --- | --- |
| **Fatigue** ／ | une action intense, un dépassement | à la **fin de la scène** |
| **Épuisement** ✕ | un effort durable, une nuit blanche | une croix par **bonne nuit** |
| **Blessure** ★ | un coup, une chute, un poison | par les **soins**, au jugement du meneur |

- Sous le panneau de jet, la carte **« Potentiels et atteintes »** montre, pour chaque Potentiel,
  sa valeur de départ, ses marques et sa valeur **actuelle**. Les boutons **+ Fatigue**,
  **+ Épuisement** et **+ Blessure** posent une marque ; **Soigner** retire un point de blessure.
  Chaque geste s'inscrit au journal.
- Une marque plus grave **prend la place** d'une marque moindre déjà notée, comme dans l'exemple du
  livre : deux fatigues puis un épuisement font une fatigue et un épuisement, pas trois marques.
  Une blessure remplace d'abord un épuisement, sinon une fatigue.
- Le jet lance le Potentiel actuel : sous « Composer », la réserve dit `= 5 − 2 (atteintes)`. À 0,
  il n'y a plus de dé à lancer.
- **Physique à 0** : la carte dit « Hors de combat ». **En dessous de −1** : « Blessure grave »,
  avec ce que le livre en dit (Physique de départ −1 jusqu'à une chirurgie, Psychose, Névrose, test
  psychotique). La mort n'est **jamais automatique** : à −2, le livre en fait une consigne au meneur —
  « implacable » pour une conduite idiote ou suicidaire, « logique » pour une blessure trop lourde,
  « évitée » après une action audacieuse et calculée (p. 393). L'outil ne tue personne.
- Sur la **fiche du jeu** (HTML), trois petits compteurs — Fatigue, Épuisement, Blessures — sont
  ajoutés sous chaque rangée de Potentiel, et reliés aux mêmes champs.

### Fin de scène et bonne nuit

![« Bonne nuit » : l'aperçu, fiche par fiche, avant d'écrire](captures/jeu-crimes-bonne-nuit.jpg)

Dans le bandeau du meneur, **Fin de scène** efface toutes les fatigues et rend le dépassement de
la scène. **Bonne nuit** retire en plus une croix d'épuisement à chaque Potentiel qui en porte.
Les deux montrent d'abord, personnage par personnage, ce qui va changer ; **Appliquer** écrit.
Les blessures ne bougent jamais seules.

## Se dépasser

![Un dépassement : une réussite gardée en plus compense le 1, une fatigue sur le Physique](captures/jeu-crimes-depassement.jpg)

Quand une **passion** ou une **conviction** est engagée dans le test (ou une fois par combat,
quelles que soient les passions, p. 389), le personnage peut se dépasser : garder des réussites
qu'il ne pouvait pas garder, pour grandir son succès ou compenser un 1 (p. 385).

1. Le livre veut l'annonce **avant** de jeter les dés : cochez **« Se dépasser »** à l'étape
   Préparer. Le meneur juge si la passion ou la conviction invoquée vaut.
2. Après le lancer, si des réussites sont restées hors de la garde, le panneau propose
   **« Se dépasser : +1 réussite (1 fatigue) »**, « +2 réussites (2 fatigue) »… Le joueur choisit
   combien il en garde.
3. Chaque réussite gardée en plus pose **une fatigue** sur le Potentiel utilisé, jusqu'à la fin de
   la scène (p. 407). Le bilan et la Névrose se recalculent, le journal note « · dépassement ».
4. **Un seul dépassement par scène** : la case se grise (« déjà fait dans cette scène ») jusqu'à
   « Fin de scène » ou « Bonne nuit ». Si le meneur en accorde un autre, il remet à 0 le champ
   « Dépassement de la scène » du formulaire.

Après un dépassement, la garde ne se change plus d'un clic.

---

## Le dossier d'enquête

![Le dossier d'enquête : Léonce a 3 points de Limier, la larve de bombyx est à sa portée](captures/jeu-crimes-dossier-d-enquete.jpg)

Les points d'enquête (livre p. 436–440) mesurent ce qu'un enquêteur a compris de l'affaire, dans
chacun de ses cinq styles : **Condé, Limier, Illuminé, Mentaliste, Fouineur**. Ils s'accumulent
et ouvrent des indices ; ils ne se dépensent pas.

- **Où** : dans l'éditeur de la campagne, section **Indices**. Le **dossier d'enquête** est en tête,
  au meneur seul.
- **Les points** : un tableau, un enquêteur par ligne, un style par colonne, avec **−** et **+**.
  Le chiffre est le compteur de la fiche (« Limier — compteur ») ; on ne gagne de points que dans
  un style que l'on **possède** (ses ronds sur la fiche, p. 437) : le **+** des autres est grisé.
  Chaque geste s'inscrit au journal.
- **Après un jet**, sur la fiche du meneur, le panneau propose les points du jet dans les styles
  de l'enquêteur : **+1** pour un succès, **+2** à deux réussites, **−1** sur un échec critique
  (p. 436). Un clic, si la routine a vraiment fait avancer l'enquête — c'est vous qui en jugez.
- **« Nouvelle affaire »** (avec confirmation) ramène les points de chacun au niveau de ses styles.

### Les indices et leurs seuils

Dans l'éditeur d'un indice, deux listes s'ajoutent :

- **Pour le découvrir** : les seuils — « Limier 3 », « Fouineur 4 » ; **un seul suffit**.
- **Ce qu'il rapporte** : les points qu'il donne à qui l'obtient (« Limier +1 »).

Un indice sans seuil est **évident** : il se révèle comme avant, à toute la table.

![Révélé à Léonce seul : connu d'un seul, avec son origine, prêt à être partagé](captures/jeu-crimes-indice-revele.jpg)

Dès qu'un enquêteur atteint un seuil, l'outil le dit (une notification, et la liste **Indices à
portée**) ; il ne révèle rien seul.

1. **« Révéler à Léonce Varin »** : l'indice part sur **sa seule tablette** (Archives, « Connu de
   vous seul — trouvé en Limier ») ; les autres tablettes et l'écran de table ne le reçoivent pas.
   Ses gains vont à Léonce, dans les styles qu'il possède.
2. **« Partager à la table »**, quand il en parle : l'indice devient public, et le journal garde
   **qui l'a trouvé**.

## Le combat : l'arme, la portée, les dégâts

![Une attaque à la canne-épée : touché, 2 blessures, et « Infliger » au surineur](captures/jeu-crimes-attaque.jpg)

À l'étape Préparer, le panneau propose l'**attaque** (livre p. 344–395) :

- **Arme** : les armes blanches et les armes à feu des tableaux du livre, avec leurs dégâts. Une
  arme blanche frappe du **Physique de l'attaquant** plus son bonus ; une arme à feu a des dégâts
  fixes. On y lit aussi ses coups par assaut, ses munitions et son rechargement.
- **Distance** (arme à feu) : au-delà de la **portée utile**, une réussite de moins ; au-delà du
  **double**, « tir impossible » s'affiche (p. 389).
- **Réussites adverses** : le jet de l'adversaire en **opposition** (mêlée). 0 pour un tir sur une
  cible qui ne riposte pas.
- **Cible** : un combattant du plateau de Combat-OS. Son **Physique actuel** se lit sur sa fiche,
  marques comprises ; sans fiche, on le saisit.
- **Protection** : celle de la cible, **couvert compris** (de 1, petit obstacle, à 3, derrière un
  mur).

Après le lancer, le résultat dit **« Touché : 2 blessures »** et le calcul du livre — succès
excédentaires + arme − Physique de la cible − protection, **au moins 1** (p. 393). À égalité,
« pas de blessure ». **« Infliger à … »** écrit les marques sur la fiche de la cible avec la règle
des atteintes (une blessure prend la place d'une marque moindre), et le journal le note. Une
matraque ou un bâton infligent de l'**épuisement**.

Sur un **échec critique** avec une arme à feu, le panneau rappelle ses incidents — **E** enrayée,
**T** elle tombe, **C** une victime collatérale — et, à partir de deux 1 gardés, le risque
d'explosion. Le meneur choisit.

Les tranches de distance du plateau tactique suivent l'échelle des portées du livre (au contact,
10, 20, 50 et 400 m), sans modificateur : la pénalité dépend de l'arme.

## Ce qui n'est pas encore là

- La **carte de combat** de Combat-OS garde ses propres points de vie : elle n'est pas encore
  alignée sur le Physique actuel. Les blessures infligées vont sur la fiche.
- Les **localisations**, « assommer », « immobiliser », « intimider », le **tir multiple** et le
  **décompte des munitions** : au meneur.
- La **Névrose** écrite sur la fiche, et les tests psychotiques (où l'on ne peut pas se dépasser) :
  chantier C4. Les variations de Névrose des rivalités entre styles (p. 437) aussi.

Voir le registre `documentation/Planning/2026-10-19-registre-ameliorations-crimes.md`.
