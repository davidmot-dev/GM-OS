# 🎬 Storyboard

Le module **Master Storyboard** est le chef d'orchestre de votre partie. Il vous permet de synchroniser instantanément l'ambiance sonore, l'éclairage et les visuels pour créer des moments cinématographiques inoubliables via une interface de montage intuitive.

![Aperçu du Master Storyboard](storyboard_mockup.png)

## 📋 Présentation du Module

Le Storyboard utilise une **Table de Montage Horizontale** (façon pellicule de film) pour organiser vos "Moments". Un moment est une configuration prédéfinie qui impacte plusieurs modules simultanément :

1. **Musique** : Lance une piste spécifique de vos playlists.
2. **Ambiance (Ambient-OS)** : Charge un **thème** — les huit sons de fond — et, si vous le voulez, la **scène** qui les dose (Calme, Tension, Action).
3. **Effets Sonores (Sound-OS)** : Déclenche un pad SFX précis.
4. **Lumières** : Applique une scène Hue (ex: Alerte Rouge, Nuit Calme).
5. **Cartes (Atlas)** : Charge une carte spécifique pour les joueurs.
6. **Images** : Affiche une illustration ou un portrait de PNJ sur le Hub.

## 🚀 Comment l'utiliser ?

### 1. Accéder au module
Cliquez sur l'icône 🎬 (**Storyboard**) dans la section **Modules** de la barre latérale du **Session-OS**.

### 2. Créer une séquence

- Cliquez sur **+ Ajouter une séquence**, en haut à droite.
- Nommez-la (*« Rencontre avec l'Inquisiteur »*).
- Choisissez ses éléments dans le panneau de droite.

#### « Capturer active » — six boutons, quatre qui répondent

Chaque élément a **son propre** petit bouton *Capturer active*, qui recopie ce qui tourne en ce
moment sur votre poste. Il n'y a pas de bouton global.

| Élément | Ce que la capture prend |
| :--- | :--- |
| **Musique** | Le morceau de la platine qui joue |
| **Lumière** | La scène Hue active |
| **Carte** | La carte chargée sur le plateau tactique |
| **Image** | L'image projetée sur l'écran courant d'Image-OS |
| **Bruitage** | ⛔ rien — Sound-OS **empile** ses sons, il n'y a pas de pad « actif » unique |
| **Ambiance** | ✅ **le thème chargé** — depuis le 20/09. La *scène*, elle, reste impossible : Ambient-OS ne retient pas laquelle est appliquée |

> ⛔ **Deux de ces boutons ne marchaient pas, et ne le disaient pas.** *Carte* et *Image*
> interrogeaient des champs qui n'existent pas (`currentMapUrl`, `activeMediaId`) : le clic ne
> posait rien et n'affichait aucun message. **Corrigé le 2026-09-04** — et quand il n'y a
> effectivement rien à prendre, le bouton le dit désormais.

<!-- -->

> 🔎 **Le bruitage, lui, reste impossible.** Sound-OS empile ses sons : il n'existe aucun
> « état courant » à recopier. Le message qui s'affichait à sa place était bâti sur les mauvaises
> clés de traduction — on lisait *« Sound-OS : ex: Combat Final »*.
>
> ⭐ **L'ambiance a changé de camp le 2026-09-20.** Elle figurait ici comme impossible, et c'était
> vrai d'une *scène* — mais Ambient-OS retient le **thème chargé**, et personne ne le lisait.
> *Une capacité déclarée que personne ne lit n'est pas une capacité.*

### 3. Organiser votre Scénario (Drag & Drop)
Le Storyboard fonctionne comme un logiciel de montage :
- **Réorganiser** : Maintenez le clic sur l'icône **Grip** (les 6 points à gauche du numéro) pour déplacer une séquence sur la pellicule.
- **Dupliquer** : Cliquez sur l'icône **Copier** (double page) pour créer une variante d'une séquence existante.
- **Supprimer** : Utilisez l'icône **Poubelle** pour retirer une scène de votre montage.

### 4. Déclencher en Direct
Cliquez simplement sur le gros bouton **PLAY** au centre d'une carte.
- Tous les modules liés s'ajusteront instantanément.
- Une lueur pulsée entoure la séquence active pour vous aider à vous repérer.

---

## 🔊 Choisir **où ça sort** (v6.5)

Un moment ne dit plus seulement *quoi* déclencher, mais *où* :

- **Sortie audio** : chaque son d'un moment peut viser une enceinte précise (un pad Sound-OS sur les enceintes du fond pendant que la musique reste devant). Laissez **Sortie du module** pour garder le comportement habituel.
- **Écran de projection** : chaque image peut viser un écran nommé, l'**Écran courant d'Image-OS** ou le **Player Hub**.

> [!NOTE]
> Le volume général et le ducking de la voix s'appliquent **aussi** aux sons détournés vers une autre enceinte.

## 💡 La lumière du moment gagne

Un moment déclare une scène lumineuse. Mais les sons qu'il lance peuvent en porter une
eux aussi — un pad de bruitage, un morceau, une piste d'ambiance ont chacun leur
« scène liée ». Depuis le 2026-09-22, la règle est tranchée :

> ⭐ **Ce que vous avez déclaré dans le moment gagne sur ce qu'un enchaînement propose.**

Pendant qu'un moment se déclenche, il **tient les lampes** : les scènes liées à ses sons
s'abstiennent au lieu d'écraser la vôtre. Elles fonctionnent normalement le reste du
temps — lancez un bruitage à la main, sa lumière suit comme avant.

> ⛔ **Avant, elles gagnaient — en silence.** David, le 22/09 : *« quand je joue la
> lumière Intro de Light-OS et dans une séquence de storyboard, l'effet n'est pas le
> même »*. Sa scène était bien posée, puis **cinq chemins** pouvaient appliquer la leur
> par-dessus. Rejouer la tuile depuis Light-OS réparait — ce qui rendait le défaut
> d'autant plus déroutant.

> 💡 **Et le journal le dit.** Quand une scène liée s'est abstenue, la ligne du moment
> porte *« Lumières = liee-ecartee »* avec la scène concernée. Pas d'alerte à l'écran :
> ce n'est pas une panne. Mais vous ne chercherez jamais pourquoi le lien lumineux de
> votre bruitage « ne marche plus ».

## 🌊 L'ambiance : le **thème** et la **scène**

Ambient-OS porte deux notions, et un moment peut dire les deux :

| | Ce que c'est | Dans le moment |
| :--- | :--- | :--- |
| **Le thème** | *quels sons* remplissent les huit pistes — Forêt, Taverne, Vaisseau | la première liste |
| **La scène** | *à quel volume* ces huit pistes jouent — Calme, Tension, Action | la seconde |

**Les quatre combinaisons, et ce qu'elles font :**

| Thème | Scène | Ce qui se passe |
| :--- | :--- | :--- |
| — | — | rien : le moment ne touche pas à l'ambiance |
| ✓ | — | le thème se charge **et démarre** |
| — | ✓ | la scène dose **ce qui est déjà chargé** — utile pour faire monter la tension sans changer de décor |
| ✓ | ✓ | le thème se charge **à l'arrêt**, puis la scène décide quelles pistes sonnent |

> ⛔ **Le défaut que cela répare, et il était muet.** Avant le 2026-09-20, un moment ne pouvait
> choisir que la **scène**. Or une scène ne charge aucun son : elle pose des volumes sur les huit
> pistes en place — celles du moment précédent, **ou huit emplacements vides**. Dans ce dernier
> cas, elle réussissait parfaitement et ne produisait **aucun son**, sans le moindre message.
> *Une ambiance qui ne sort pas ressemble à une ambiance discrète.*

> [!TIP]
> **Posez un thème sur le premier moment d'une séquence**, et laissez les suivants ne porter que
> leur scène : le décor sonore s'installe une fois, puis il monte et il descend.

> [!NOTE]
> **Un thème qui suit une scène ne démarre pas tout seul**, et c'est voulu : les huit pistes
> sonneraient une seconde avant que la scène n'éteigne celles qu'elle ne veut pas. *Un coup de
> tonnerre au mauvais moment est pire qu'un silence.*

> [!WARNING]
> **Si rien n'est chargé, le journal le dit maintenant** : *« Ambiance : aucun son chargé »*. Ce
> n'est ni un thème introuvable ni un module absent — c'est qu'il vous manque un thème avant
> votre scène.

## 🎚️ Le dosage des trois sources

Un moment sait désormais **à quel volume** chaque source sonne. C'est ce qui fait la différence
entre une révélation chuchotée et une charge de cavalerie — *elles emploient les mêmes trois
modules ; ce qui les sépare est le dosage.*

Trois lignes, une par source : **Musique**, **Ambiance**, **Bruitages**. Chacune s'active
séparément.

| État de la ligne | Ce que le moment fait |
| :--- | :--- |
| **éteinte** | il **ne touche pas** à cette source — elle reste où vous l'aviez laissée |
| **allumée, curseur à 40 %** | il pose cette source à 40 % |
| **allumée, curseur à 0 %** | il **coupe** cette source |

> ⛔ **Ne rien dire et couper sont deux intentions différentes**, et l'écran vous fait choisir.
> C'est aussi pour cela que l'activation est un bouton et non un curseur à zéro : *un curseur seul
> ne saurait pas porter les deux.*

### Le fondu, par source

À côté de chaque curseur, un temps en millisecondes — **1 500 par défaut**. C'est le temps que met
la source à atteindre son niveau.

> [!TIP]
> **Zéro coupe net**, ce qui est le geste d'un silence brutal. Au-delà, ça glisse : *un saut de
> niveau en pleine scène s'entend comme une fausse manoeuvre, un fondu s'entend comme une
> intention.* Et chaque source a le sien — couper net un bruitage pendant que la musique descend
> lentement est un geste parfaitement légitime.

> [!NOTE]
> **Le niveau reste après le moment.** Un moment pose un volume, il ne l'emprunte pas : après une
> scène chuchotée, la musique reste basse jusqu'à ce qu'un autre moment la remonte, ou que vous
> touchiez le curseur du module. *C'est un réglage, pas une parenthèse.*

> ⛔ **Ce que cela a réparé en chemin.** Sur les trois volumes, **un seul fonctionnait** avant le
> 2026-09-20. Celui de Sound-OS était écrit dans le magasin et **porté au son par personne** — le
> curseur du soundboard de votre tablette ne faisait donc rien du tout. Celui d'Ambient-OS n'avait
> même pas de nœud dans le graphe audio : il était sauvegardé, restauré, et inerte. Les deux sont
> branchés.

## 🅰️ Le Titre à l'écran

Chaque moment peut afficher un **titre** par-dessus l'image projetée, dans la police du thème du jeu :

- **Titre affiché sur l'écran** : le texte, facultatif.
- **Fondu (s)** : la durée du fondu, à l'entrée comme à la sortie.
- **Durée (s)** : combien de temps il reste. **Laissez vide pour un titre permanent** — il s'en ira alors avec son moment.

> [!TIP]
> Un écran allumé au milieu d'une séquence **rattrape** le titre en cours : vous n'avez pas à relancer le moment.

### 🎨 Où, dans quelle police, de quelle couleur

Sous le texte, quatre réglages apparaissent dès qu'il y a un titre.

| Réglage | Ce qu'il offre |
| :--- | :--- |
| **Position** | **En haut** (le défaut), **au milieu**, **en bas** |
| **Police** | *Celle du jeu* par défaut, ou l'une de celles des **réglages** — la même liste que l'atelier de thème |
| **Couleur** | un sélecteur, blanc par défaut |
| **Ombre** | **Forte** (le défaut), légère, aucune |

> ⛔ **L'ombre n'est pas décorative.** C'est elle qui rend le texte lisible sur une image claire
> comme sur une sombre. *Un titre illisible sur une image trop claire ressemble à un titre qui ne
> s'est pas affiché* — d'où « aucune » offert, mais jamais par défaut.

> [!TIP]
> **Trois hauteurs, et pas un curseur.** *Un titre au tiers supérieur gauche n'est pas un réglage
> qu'on refait deux fois pareil* — trois positions se retrouvent d'un moment à l'autre.

> [!NOTE]
> **Vos titres existants ne bougent pas d'un pixel.** Un moment écrit avant ce réglage n'a aucun de
> ces quatre champs, et chaque absence vaut le comportement d'avant : en haut, police du jeu, blanc,
> ombre forte.

> [!WARNING]
> **La police choisie est chargée par l'écran qui affiche le titre**, au moment où il arrive. Le
> projecteur et l'écran de la table sont deux fenêtres distinctes : chacune la demande pour elle.


## 🖼️ Appeler un diaporama

*Demandé par David le 2026-09-13.* Sous la liste **Image** du formulaire, une liste **Diaporama**
propose les montages préparés dans Image-OS — le nombre entre parenthèses est celui de leurs images.

- **Une image OU un diaporama, jamais les deux** : choisir l'un vide l'autre. *Ils visent la même
  place à l'écran, et le second effacerait le premier une demi-seconde après l'avoir posé.*
- Le sélecteur d'**écran** juste en dessous vaut pour les deux.
- Le diaporama **boucle** tant que le moment dure, avec un fondu enchaîné entre chaque image.
- Sa **cadence** appartient au diaporama, pas au moment : elle se règle dans Image-OS, et tous les
  moments qui l'appellent la partagent.

> Fabriquer le diaporama lui-même se fait dans **Image-OS › Diaporamas** — voir son guide.

---

## 🎭 Une séquence est une parenthèse

Lancer une séquence **referme la précédente**, mais chaque moteur a sa règle — et elles ne sont pas
arbitraires : elles suivent la façon dont chaque module se comporte quand un autre son arrive.

| Ce que la précédente avait posé | En **changeant** de séquence | En **arrêtant** le moment |
| :--- | :--- | :--- |
| **Image** | s'éteint en fondu, sauf si la nouvelle en projette une | s'éteint |
| **Diaporama** | ⭐ **il s'arrête**, sauf si la nouvelle rappelle **le même** — il continue alors sans repartir du début | il s'arrête, et l'écran s'éteint |
| **Bruitage** | s'arrête **toujours** — Sound-OS empile, il ne remplace pas | s'arrête |
| **Ambiance** | s'arrête, **sauf si la nouvelle apporte sa propre scène** | s'arrête |
| **Musique** | s'arrête, **sauf si la nouvelle apporte sa musique** — les platines s'enchaînent alors en fondu croisé | ⭐ **elle reste** |
| **Lumières** | ⭐ **retour à l'éclairage normal**, sauf si la nouvelle déclare sa scène | ⭐ **retour à l'éclairage normal** |

> ⭐ **Nouveau le 2026-09-13 — la lumière suit enfin la règle des autres.**
>
> Une séquence décrit **l'état complet de la table, pas ce qui change**. Un moment qui ne parle pas
> de lumière ne laisse donc plus la scène du précédent sur la pièce : **elle revient à votre
> éclairage normal** — celui que vous avez désigné dans Light-OS, et non la dernière scène jouée.
>
> ⚠️ **Mais seulement si la séquence avait elle-même allumé quelque chose.** Si vous aviez choisi
> votre éclairage à la main, un moment muet sur la lumière n'y touche pas : *une séquence qui ne dit
> rien d'un sujet n'a rien à y décider.*
>
> C'est aussi la seule chose qu'un **arrêt** ne coupe pas mais **ramène** : la pièce ne reste ni dans
> le noir, ni dans le rouge de la scène qu'on vient de fermer.

<!-- -->

> ⛔ **Correction.** Cette page annonçait que « la musique fait exception : elle continue ». C'est
> vrai quand vous **arrêtez** un moment — arrêter une parenthèse ne doit pas faire tomber le silence
> sur la table —, et faux quand vous **passez à la séquence suivante** : là, elle s'arrête si la
> nouvelle n'en apporte pas. Les deux gestes n'ont pas la même règle.

<!-- -->

> 🔎 **Deux précautions que vous ne verrez jamais, et qui vous évitent des accidents.**
> La platine ne s'arrête **que si elle joue encore ce morceau-là** : si vous avez changé de piste à
> la main entre-temps, la séquence n'y touche pas. Et l'ambiance s'éteint **piste par piste**, en
> ne coupant que celles que sa propre scène avait allumées — la pluie que vous aviez lancée avant
> la séquence continue de tomber.

> [!IMPORTANT]
> **Le Storyboard ne va pas jusqu'aux tablettes des joueurs.** Il pilote vos enceintes, vos écrans
> de projection **et le Player Hub** — l'écran partagé —, mais rien de ce qu'il déclenche
> n'apparaît sur le Tablet Hub que chacun tient en main. Cette page disait le contraire du Player
> Hub, qui est bien une destination.

*Corrigé le 2026-09-04.*

---

## 💡 Exemples d'utilisation

### Scénario A : L'Embuscade
Préparez une séquence nommée "Embuscade" qui :
- Lance une musique de combat tendue.
- Passe les lumières en orange pulsé.
- Affiche la carte du sentier forestier.
- Joue un cri de guerre via le Sound-OS.

### Scénario B : La Révélation
Préparez un moment nommé "Secret Révélé" qui :
- Coupe la musique de fond.
- Affiche l'illustration d'une ancienne relique.
- Passe les lumières au blanc froid intense.
- Lance une ambiance sonore "Vibrations Mystiques".

---

> [!TIP]
> Vous pouvez également déclencher ces séquences à distance depuis votre smartphone via le **GM Remote Control** !

---

*Guide révisé le 2026-09-04, code à l'appui. Deux affirmations corrigées : la musique ne survit pas
à un changement de séquence, seulement à l'arrêt d'un moment ; et le Storyboard atteint bien le
Player Hub, pas les tablettes. Deux boutons **Capturer active** réparés dans la foulée — ils
visaient des champs qui n'existent pas et échouaient sans un mot.*
