# 🎵 Music-OS

Le module **Music OS** est le coeur de l'ambiance sonore de vos sessions. Contrairement à un simple lecteur audio, il est conçu comme un véritable mixeur de DJ thématique, vous permettant de gérer des transitions fluides entre vos musiques d'ambiance.

![Aperçu du module Music OS](music_mockup.png)

## 📋 Présentation du Module

Le module s'articule autour de trois zones de contrôle :
> [!TIP]
> **Contrôle Global** : Le volume de Music OS est désormais asservi au [Master Soundscape Controller](./70-Tour-de-controle-audio.md). Utilisez le mode **Focus Chat** pour atténuer la musique instantanément pendant vos narrations.

1. **Les Platines (Decks A & B)** : Deux lecteurs audio indépendants capables de charger et de jouer des pistes simultanément.
2. **La Console de Mixage (Mixer)** : Permet d'équilibrer le volume entre les deux platines et de réaliser des transitions professionnelles.
3. **Le Gestionnaire de Playlists & Pads** : une grille de pastilles pour lancer instantanément vos musiques préférées — **autant que vous en ajoutez**.

## 🚀 Comment l'utiliser ?

### 1. Charger et jouer une piste

- Cliquez sur un **Pad** dans la playlist pour charger la musique sur la platine inactive (ou active si rien ne joue).
- La platine affiche alors la forme d'onde et la progression de la piste.

### 2. Maîtriser les Transitions (Fades)

- **Manual Fade** : Déplacez le curseur central (Crossfader) vers la gauche pour entendre uniquement le Deck A, ou vers la droite pour le Deck B.
- **Auto-Fade** : Cliquez sur **Fade to A** ou **Fade to B**. GM-OS croise les deux platines tout
  seul. La durée est **réglable au-dessus du crossfader, de 0,5 à 20 secondes — 5 secondes par
  défaut**.

> ⛔ **Correction.** Cette page annonçait une « rampe de 1.5s ». Ni la durée ni la forme n'étaient
> justes : le fondu dure **cinq secondes** sauf réglage contraire, et ce n'est **pas une rampe**
> mais une courbe **à puissance constante** — les deux platines se croisent sans le creux de volume
> qu'un fondu linéaire produit au milieu.

> 🔎 **Le crossfader dit toujours la vérité pendant un fondu.** Sa position se calcule sur l'horloge
> audio, pas sur un minuteur d'interface : interrompre un fondu en le saisissant reprend exactement
> là où le son en est.

### 3. La plage de lecture 🔁

Idéal pour les musiques d'ambiance qui ne doivent jamais s'arrêter — et pour les morceaux dont
seule une partie vous intéresse.

> ⛔ **Correction.** Cette page annonçait ces points de boucle **depuis des mois alors qu'ils
> n'existaient pas** : les deux champs dormaient dans les données, aucun écran ne permettait de les
> poser, et le moteur ne savait pas les lire. Ils fonctionnent depuis le **2026-09-16**, et ce qui
> suit décrit ce que fait vraiment l'application.

Sous la forme d'onde de chaque platine, **deux boutons et un verdict** :

- **Entrée** pose le début de la plage à la position actuelle, **Sortie** en pose la fin. Les deux
  prennent la position affichée — celle du doigt si vous glissez sur la forme d'onde, celle de la
  lecture sinon —, donc **on cale sa boucle à l'oreille, à l'arrêt comme en cours de lecture**.
- La plage apparaît en vert sur la forme d'onde, et le texte du milieu dit ce qui se passe :
  `0:12 → 1:45` quand elle est valide, **« Pose la sortie »** quand un seul point est posé,
  **« Plage invalide »** si les deux points sont à l'envers ou trop rapprochés, et
  **« Morceau entier »** quand il n'y en a pas.
- La croix retire la plage : le morceau entier se joue de nouveau.

**Le bouton 🔁 n'a pas changé de place, il a changé de portée.** Avec une plage, il ne décide plus
si *le fichier* se répète mais si *la plage* se répète :

|  | 🔁 allumé | 🔁 éteint |
| --- | --- | --- |
| **sans plage** | le morceau entier tourne | il joue une fois |
| **avec plage** | la plage tourne | la plage joue une fois, puis s'arrête |

> 🔎 **Lancer la lecture vous amène à l'entrée de la plage** si la tête est ailleurs — la plage
> définit ce qui se joue. Mais si vous vous êtes placé **dans** la plage, cette position est
> respectée : appuyer sur Lecture ne vous renvoie pas au début de votre passage.

**La plage appartient au morceau, pas à la platine.** Elle est enregistrée avec la pastille, suit
le morceau sur l'autre platine, et se retrouve à la séance suivante. Si vous remplacez le fichier
sous une pastille qui avait des points, la sortie est ramenée à la fin du nouveau morceau plutôt
que de rendre la pastille muette.

### 4. Éditer une pastille

Le menu **…** d'une pastille, puis **Éditer** : le nom, la couleur et la touche sont dans la même
fenêtre.

- **Le nom** est celui qui s'affiche sur la tuile.
- **La couleur** se choisit dans une palette de huit teintes — toutes lisibles sur le fond sombre.
  Un aperçu montre le rendu pendant que vous choisissez, et **Aucune** revient au gris d'origine.
- **La touche** : cliquez sur *Assigner une touche*, puis appuyez. `Échap` annule sans rien changer.

> ⚠️ **Une touche ne commande qu'une pastille.** Si celle que vous appuyez sert déjà ailleurs,
> l'éditeur vous dit **laquelle** avant d'enregistrer, et la lui retire quand vous validez. Sans
> cette règle, l'une des deux serait muette et rien ne l'expliquerait.

> 🔎 **Les combinaisons avec `Ctrl`, `Alt` ou `Cmd` sont refusées**, et c'est volontaire : GM-OS les
> ignore en séance pour ne pas déclencher une musique quand vous copiez du texte. Les proposer ici
> serait un réglage qui ne marcherait jamais.

**La couleur ne s'affiche qu'au repos.** Une pastille qui joue garde son halo orange, le même pour
toutes : *ce qui sonne doit se repérer d'un coup d'œil, et une couleur par pastille rendrait cet
état-là illisible.*

### 5. Organiser vos Playlists

- Créez des onglets thématiques (ex: "Combat", "Exploration", "Taverne").
- Chaque onglet dispose de sa propre grille de pastilles. **Elle n'a pas de taille fixe** : la tuile
  **Ajouter**, en bout de grille, en crée une de plus ; la croix au survol d'une pastille la retire
  (avec confirmation si elle porte un morceau).
- Le nombre de colonnes suit la largeur de la fenêtre, pour que les pastilles restent grandes sans
  repousser le crossfader hors de l'écran.

> ⛔ **Correction.** Cette page annonçait « une grille de 16 pads ». C'était vrai avant la refonte
> du module, qui a ramené les playlists à **cinq** pastilles — *et a coupé l'affichage à cinq sans
> toucher aux données*. Les playlists nées avant gardaient donc leurs seize pastilles, **dont onze
> qu'aucune tuile ne montrait et qu'une touche de clavier jouait quand même**. Depuis le
> **2026-09-16**, la grille montre tout ce qu'elle contient : si vos anciennes atmosphères
> réapparaissent, elles n'avaient jamais été perdues.
- **Drag & Drop** : Réorganisez vos musiques par simple glisser-déposer sur la grille.

### 6. Se placer dans un morceau

La forme d'onde n'est pas qu'un décor : **cliquez dedans** pour sauter à cet instant. Au clavier,
les flèches déplacent la lecture de **5 secondes**, et de **1 seconde** avec `Maj` — de quoi caler
une entrée sur un temps fort sans rater la scène.

### 7. Les playlists suivent la campagne

Une playlist peut appartenir à une campagne, ou rester **commune** à toutes.

| État | Ce qui la montre |
| :--- | :--- |
| **Rattachée à la campagne ouverte** | visible, en premier |
| **Commune** (aucun rattachement) | visible, ensuite |
| **Rattachée à une campagne supprimée** | visible aussi — *une playlist orpheline ne disparaît pas avec sa campagne* |
| **Rattachée à une autre campagne** | masquée |

> 🔎 **Aucune campagne ouverte : rien n'est masqué.** Il n'existe alors aucun critère de tri, et
> cacher la bibliothèque entière derrière un écran vide serait indiscernable d'une perte de données.

Une playlist écrite avant l'arrivée de ce rattachement est **commune** : rien n'a eu à être migré.

---

## ⌨️ Raccourcis Clavier & Key Learning

Le module **Music OS** supporte l'assignation de touches clavier à n'importe quel pad de musique, vous permettant de déclencher vos ambiances sans même toucher à la souris.

### Comment mapper une touche (Key Learning)

1. Cliquez sur le bouton **Key Learn** (icône ⌨️) dans l'en-tête du module. L'interface passe en mode "Apprentissage".
2. Cliquez sur le **Pad** auquel vous souhaitez assigner un raccourci.
3. Appuyez sur la touche de votre clavier que vous souhaitez utiliser (ex: `Numpad 1`, `Espace`, `K`, etc.).
4. Le raccourci est enregistré et s'affiche sur le pad. Quittez le mode Key Learn pour tester.

> 🔎 **Deux chemins mènent au même réglage, et les deux restent valables.** Le mode Key Learn
> ci-dessus attribue **à la chaîne** : il reste ouvert le temps de plusieurs pastilles, ce qui va
> vite quand on équipe une playlist entière. L'éditeur d'une pastille (§ 4) fait la même chose
> **pour une seule**, avec le nom et la couleur sous la main — et c'est le seul des deux qui vous
> prévient quand la touche sert déjà ailleurs.

### Utilisation globale

Une fois mappés, vos raccourcis clavier fonctionnent **partout dans GM-OS**, tant qu'aucun champ de texte n'est actif. Cela vous permet de changer d'ambiance tout en étant sur la carte ou dans le combat tracker.

---

## 💡 Ambiance Lumineuse liée (Philips Hue)

Le module Music OS est capable de piloter vos lumières Philips Hue en synchronisation avec votre musique.

Chaque **Pad** peut être lié à une scène lumineuse spécifique. Ainsi, lorsque vous cliquez sur un pad pour lancer une musique, l'OS envoie simultanément une commande à vos lampes pour changer l'ambiance visuelle du salon.

### Comment lier une scène ?

1. Faites un **clic droit** sur un Pad.
2. Dans le menu de configuration, sélectionnez la scène lumineuse correspondante dans la liste (si vous avez configuré le module Light OS).
3. Cliquez sur "Save". Désormais, dès que ce pad est joué, la lumière suivra automatiquement.

---

## 💡 Exemples d'usage

### Scénario A : Transition Narrative

Les joueurs quittent la sécurité de la taverne pour entrer dans une ruelle sombre.

1. La musique de taverne joue sur le **Deck A**.
2. Cliquez sur le pad "Ruelle Siniestre". Il se charge sur le **Deck B**.
3. Cliquez sur **Fade to B**. La taverne s'efface doucement au profit de l'ambiance mystérieuse.

### Scénario B : Intensification du Combat

Le combat s'accélère !

1. Vous avez une musique de combat "Rythmique" sur le **Deck A**.
2. Chargez une piste avec des "Cuivres Héroïques" sur le **Deck B**.
3. Mixez progressivement les deux en déplaçant le crossfader au centre pour un son massif et épique.

---

## ⚙️ Configuration Technique

- **Multi-Sorties (Sink)** : Vous pouvez configurer Music OS pour envoyer le son sur une carte son spécifique (ex: sortie audio "Table virtuelle" ou "Casque").
- **Types de fichiers** : Supporte les formats `.mp3`, `.wav`, `.ogg` et `.m4a`.

---

> [!TIP]
> Vous pouvez lier une musique à une ambiance lumineuse. Par exemple, lancer le pad « Incendie »
> peut automatiquement passer vos lampes Philips Hue en rouge clignotant !

---

## 📏 Aligner les niveaux (Niveaux alignés, v6.5)

Deux morceaux d'une même playlist ne sortent presque jamais au même volume, et on court au crossfader entre deux scènes. Le bouton **Niveaux alignés**, en haut à droite du mixer, corrige cela tout seul.

**Comment ça marche :**

1. Pendant que vous écoutez une piste, GM-OS **mesure sa sonie** — pas son volume brut, mais ce que l'oreille en perçoit, au sens de la norme de diffusion **EBU R 128 / ITU-R BS.1770**.
2. La mesure est retenue pour cette piste. **Dès la fois suivante, elle est calée** sur les autres.
3. Le compteur à côté du bouton dit combien de pistes sont déjà mesurées.

> [!NOTE]
> **La première écoute d'une piste n'est pas encore alignée** — on ne peut pas mesurer un morceau avant de l'avoir entendu. Passez une playlist neuve une fois, et la séance suivante sera d'aplomb.

> [!IMPORTANT]
> **Le gain est posé au chargement de la piste, jamais pendant qu'elle joue.** La mesure s'affine seconde après seconde ; la suivre ferait bouger le volume sous vos doigts. *Un correctif qui remue pendant qu'on écoute est pire que le défaut.*

**Deux choses que la mesure sait faire, et qu'un simple volume moyen ne saurait pas :**

- Elle **pondère comme l'oreille** : un morceau de basses profondes et un morceau de cordes aiguës peuvent avoir la même puissance et sembler séparés de 6 dB.
- Elle **ignore les silences et les intros murmurées** : sans cela, un morceau qui commence par vingt secondes de calme serait poussé de 10 dB, et le refrain arracherait la table.

La correction est **bornée à ±12 dB** : une prise d'ambiance très douce ne sera pas remontée jusqu'à en réveiller son propre souffle. La cible est **−18 LUFS**.

---

*Guide révisé le 2026-09-04, code à l'appui. Corrigé : le fondu automatique dure **5 secondes** et
non 1,5, il est **réglable**, et sa courbe est à puissance constante. Réparé aussi : un fragment de
phrase recopié au milieu de la page. Ajouté : le **pointage dans le morceau** (clic sur la forme
d'onde, flèches au clavier) et le **rattachement des playlists à une campagne**.*
