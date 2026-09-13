# 🖼️ Image-OS

Le module **Image OS** est votre régie visuelle. Il vous permet de projeter des illustrations, des portraits de PNJ, des cartes ou des ambiances visuelles sur différents écrans (Hub Joueur, Moniteurs secondaires, Vidéoprojecteurs) pour renforcer l'immersion de vos joueurs.

![Aperçu du module Image OS](image_mockup.png)

## 📋 Présentation du Module

L'interface est divisée en trois zones principales :

1. **La Bibliothèque (Explorer)** : Gérez vos images avec un système de dossiers et de favoris.
2. **Le Sélecteur de Cible (Target)** : Choisissez sur quel écran projeter votre média.
3. **Le Contrôle de Projection** : Lancez des images isolées, des séquences ou coupez tout en un clic.

## 🚀 Projection et Gestion des Écrans

### Choisir sa Cible (Target Screen)

En haut de l'interface, vous pouvez sélectionner l'écran de destination :

- **Player Hub** : Envoie l'image vers l'application "Hub" des joueurs (fenêtré).
- **Displays (1, 2, etc.)** : Envoie l'image en plein écran sur vos moniteurs physiques connectés à l'ordinateur.

### Modes de Projection

- **Transitions Fluides (v5.3)** : La projection d'une image n'est plus brutale. Le système effectue désormais un fondu au noir (Fade Out) suivi d'une apparition progressive (Fade In). Ce rendu premium garantit une immersion cinématique sans "flash" visuel.
- **Solo (Régie unifiée v6)** : Un simple clic sur une image l'envoie instantanément sur l'écran cible. La fiabilité a été portée à 100% : l'image s'affiche désormais dès la première sélection sans nécessiter de second clic, même si la fenêtre vient d'être ouverte.
- **Synchronisation Automatique** : Si vous ouvrez un écran de projection (Moniteur 1, 2) alors qu'une image est déjà active pour cette cible, l'image s'affichera automatiquement dès l'ouverture de la fenêtre.
- **Diaporama** : voir la section dédiée plus bas. Les cases à cocher « Sequence » ont disparu le
  2026-09-13 — un diaporama porte désormais un nom, un ordre et une cadence.
- **Entity (NPC/PC)** : GM-OS projette une fiche complète (nom, portrait, stats publiques) vers le Player Hub en mode "Diorama" tout en affichant l'image brute sur vos écrans secondaires.
- **Écran au repos** : sans image projetée, l'écran reste noir et prêt.

## 🎬 Les vidéos

**Ajouté le 2026-09-05, à la demande de David.** Une vidéo se pose sur le tableau
**comme une image** : le bouton d'ajout accepte désormais les `.mp4`, `.webm`, `.mov`
et compagnie, et le pad les distingue par un pictogramme de pellicule et par sa
vignette, qui montre la première image du film.

Un clic la projette. Elle **tourne en boucle**, avec le son.

> ⛔ **Ce n'était pas un manque, c'était une porte fermée.** L'écran de projection
> savait jouer une vidéo depuis longtemps — mais le sélecteur de fichiers, lui,
> n'acceptait que des images. *Une capacité qu'on ne peut pas atteindre n'existe
> pas.* Et elle jouait **en muet**, en dur, depuis toujours.

### Son des vidéos

Un curseur, en bas du panneau de gauche, apparaît **dès que votre bibliothèque
contient une vidéo**. Il règle les vidéos entre elles, comme la tranche d'un module
sur une console.

Par-dessus lui s'appliquent les trois commandes habituelles de la table :

| Ce que vous faites | Effet sur la vidéo |
| --- | --- |
| Baisser le **volume général** | Elle baisse d'autant |
| **Couper le son** | Elle se tait |
| Enclencher le **mode Focus** | Elle se tamise |
| **Parler au micro** (Voice-OS) | Elle plonge, puis remonte |

> ⚠️ **La vidéo n'est pas *dans* le mixage, elle lui obéit.** Elle joue dans la
> fenêtre de projection, un autre processus ; on ne branche pas un élément d'une
> fenêtre sur le graphe audio d'une autre. GM-OS lui **envoie** donc le niveau
> qu'elle doit tenir. Le résultat à la table est le même, à une exception près :
> **elle sort par l'appareil de l'écran de projection** — la télévision, le
> vidéoprojecteur — et non par l'enceinte choisie dans Music-OS. Sur une
> installation où tout passe par le même ampli, cela ne se remarque pas.

> 🔎 **Pour arrêter une vidéo**, coupez l'écran (**Blackout**). Il n'y a pas de
> bouton pause : elle est un décor, comme une image.

### Sur le Player Hub et les tablettes

La vidéo s'y affiche **en plein fond**, comme une image projetée le ferait.

| Surface | Le son |
| --- | --- |
| **Player Hub** — l'écran de la table | ✅ oui, au niveau que vous dictez |
| **Tablettes des joueurs** | ❌ muet, délibérément |

> ⚠️ **Pourquoi les tablettes restent muettes.** L'écran de la table est unique ;
> les tablettes sont cinq. *Cinq appareils jouant la même bande-son avec un
> décalage de réseau ne font pas une ambiance, ils font du bruit.* Le son de la
> table appartient aux enceintes de la table.

> ⛔ **Corrigé le 2026-09-05, le jour même.** Le Hub peignait **toute** projection
> comme une image de fond — ce qui ne peut pas jouer un film. La vidéo arrivait
> bien, et l'écran restait vide. Il fallait deux choses : que le Hub sache
> *dessiner* une vidéo, et surtout **qu'on le prévienne** — il reçoit une adresse
> préparée pour lui, sans extension, où rien ne distingue un film d'une
> photographie.

## 📁 Organisation de la Bibliothèque

Pour ne pas perdre de temps à chercher une image en plein combat :

- **Dossiers** : Créez une structure claire. Les dossiers sont rechargés automatiquement d'une session à l'autre.
- **Favoris (⭐)** : Marquez vos images les plus utilisées pour un accès rapide.
- **Diaporamas** : rangez vos images en montages ordonnés. Une même image peut appartenir à
  plusieurs diaporamas et à aucun dossier — *un dossier range, un diaporama ordonne et cadence.*

## 🖼️ Les diaporamas

*Demandés par David le 2026-09-13.* Un diaporama est une **suite d'images qui défilent toutes
seules**, avec un fondu enchaîné entre chacune — et il s'appelle depuis un moment de Storyboard.

### En fabriquer un

1. Dans la colonne de gauche, cliquez **Diaporamas**.
2. Le **+** en haut de la liste en crée un : donnez-lui un nom.
3. En bas de l'écran, la **bande de la bibliothèque** : cliquez une image pour l'ajouter à la fin.
4. Les flèches ▲ ▼ de chaque ligne changent l'ordre, la corbeille retire l'image du montage
   (elle **reste** dans la bibliothèque).
5. **Chaque image** : combien de secondes elle reste à l'écran. Une seule valeur pour tout le
   diaporama.

> Une même image peut y figurer deux fois — revenir sur un plan déjà vu est un geste de montage.

### Le faire tourner

Le bouton **Lancer sur ‹écran›** l'envoie sur l'écran choisi en haut du module. Une fois lancé, les
flèches ◀ ▶ de la barre du haut le feuillettent à la main, et le bouton vert central l'arrête.

- **Il boucle** : après la dernière image il repart à la première, tant que vous ne l'arrêtez pas.
- **Arrêter n'éteint pas l'écran** : la dernière image reste. Le noir a son propre bouton.
- **Projeter une image à la main arrête le diaporama** qui occupait cet écran. *Votre dernier geste
  gagne toujours* — sans quoi l'écran changerait tout seul six secondes plus tard.
- Un diaporama sur un moniteur n'est pas dérangé par une fiche envoyée au Player Hub.

### Dans un moment de Storyboard

Le formulaire d'un moment propose une liste **Diaporama** juste sous celle des images. Le nombre
entre parenthèses est le nombre d'images.

- **Une image OU un diaporama, jamais les deux** : choisir l'un vide l'autre. Ils visent la même
  place à l'écran.
- Le sélecteur d'écran juste en dessous vaut pour les deux.
- Le moment suivant **arrête** le diaporama du précédent, comme il éteint son image — sauf s'il
  rappelle le même, auquel cas il continue sans repartir du début.

### Ce qu'il faut savoir

- ⚠️ **Pas de vidéo dans un diaporama.** Une vidéo porte sa propre durée ; la faire passer au bout
  de six secondes la couperait au milieu. Elle se projette seule.
- ⚠️ **Il faut au moins deux images** pour lancer un diaporama. Avec une seule, le bouton refuse et
  le dit : il n'y a rien à enchaîner.
- **Une image supprimée de la bibliothèque est sautée**, pas bloquante — *une séance ne doit pas
  s'arrêter sur un ménage fait la semaine d'avant*. L'écran du diaporama vous le signale en jaune.
- **La durée du fondu est celle d'Image-OS (0,7 s)** sur un moniteur, **1,5 s sur le Player Hub**,
  commune à tous les changements d'image. Seule la durée d'affichage est propre à chaque diaporama.
- ⚠️ **Une image lourde s'affiche un instant plus tard qu'avant**, et c'est voulu : le fondu attend
  qu'elle soit **décodée** avant de commencer. Sans cette attente il s'animait sur un cadre vide, et
  on voyait *un temps mort puis un saut*. Le temps d'attente existait déjà — il était simplement
  pris sur le fondu.
- **Les trois surfaces fondent désormais** : les moniteurs en 0,7 s, le Player Hub **et les
  tablettes** en 1,5 s. Les tablettes reflètent l'écran de la table, elles en suivent donc le
  rythme. ⚠️ Une **vidéo**, elle, est remplacée d'un coup partout — deux films superposés
  joueraient leur son ensemble.
- **Une image remplit l'écran autant qu'elle peut**, en gardant ses proportions : une image qui n'a
  pas le format de l'écran garde ses bandes, remplies par un flou d'elle-même.
- Les diaporamas sont **sauvegardés** avec la bibliothèque depuis le 2026-09-13.

## ⛔ Le bouton qu'il ne faut pas confondre

En bas de la colonne de gauche, **RESTORE DEFAULT** n'est pas un bouton de remise à zéro de
l'affichage : il **efface toute votre bibliothèque d'images, tous vos dossiers et toutes vos
projections**. Une confirmation le dit, et il n'y a pas de retour en arrière.

Il est rouge, discret, et juste au-dessus des commandes de projection. *Aucun guide ne le
mentionnait.*

---

## 🛑 Contrôle de Sécurité (Blackout)

La gestion visuelle est sensible (spoilers). Image OS propose une synchronisation parfaite du blackout :

- **Target Blackout** : Éteint l'image sur l'écran cible sélectionné. Sur un **Moniteur**, la fenêtre se ferme complètement pour libérer votre bureau. Sur le **Player Hub**, l'image s'efface simplement pour rester prête à la prochaine diffusion.
- **ALL** : coupe TOUTES les projections sur TOUS les écrans et ferme les fenêtres secondaires.
  Indispensable pour masquer une carte secrète, ou finir une scène sur un noir.

> 🔎 **Le noir voulu efface aussi le décor mis de côté.** Quand une fiche de PNJ s'en va, l'image
> de scène qu'elle recouvrait revient d'elle-même — *l'image est le décor, les fiches passent
> devant*. Mais si vous avez éteint cet écran à la main, ce décor-là ne ressuscitera pas des heures
> plus tard à la fin d'une fiche : **un fantôme que personne ne rattacherait à son geste.**

⚠️ **Le Stop All de la barre du haut appelle ce même noir général**, en plus de couper le son et les
lumières. → [Tour de contrôle audio](./70-Tour-de-controle-audio.md)

---

## 💡 Astuces pour l'Immersion

> [!TIP]
> **Le Player Hub Dynamique** : Contrairement aux écrans secondaires qui n'affichent que l'image brute, le **Player Hub** peut recevoir des entités riches. Si vous projetez un PNJ via le module NPC OS, Image OS affichera non seulement son portrait mais aussi son ambiance dédiée si elle est configurée.

> [!IMPORTANT]
> **Snapshots** : L'état de vos projections (quelle image est sur quel écran) est enregistré dans votre session. Si vous fermez et rouvrez GM-OS, vos écrans se rallumeront exactement là où vous les aviez laissés.

---

## ⚙️ Configuration Technique

- **Multi-Écrans** : Le module détecte automatiquement le nombre de moniteurs branchés via le `appBridge`.
- **Formats Supportés** : PNG, JPG, WEBP, et même les GIF animés pour des ambiances vivantes.
- **Performance** : Les images sont pré-chargées pour éviter tout délai lors de la projection.

---

*Complété le 2026-09-05 : les **vidéos** entrent dans la bibliothèque, avec leur son piloté par la
table. Voir aussi [Web-OS](./28-Navigateur-integre.md) pour projeter une vidéo YouTube.*

*Guide révisé le 2026-09-04, code à l'appui. Retiré : le « mode Standby » affichant « EN ATTENTE »,
qui n'existe nulle part. Ajouté : le bouton **RESTORE DEFAULT**, qui efface toute la bibliothèque et
n'était mentionné dans aucun guide ; le fait que le noir voulu efface aussi le décor mis de côté ;
et que le **Stop All** général déclenche ce noir.*
