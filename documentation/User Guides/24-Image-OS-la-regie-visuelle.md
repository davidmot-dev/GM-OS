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
- **Diaporama (Sequence)** : Cochez les cases "Sequence" sur vos images, puis lancez le diaporama via le bouton **DIAPORAMA** en haut à droite.
  - **Navigation** : Utilisez les flèches **Précédent** et **Suivant** à côté du bouton pour faire défiler manuellement votre séquence.
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

## 📁 Organisation de la Bibliothèque

Pour ne pas perdre de temps à chercher une image en plein combat :

- **Dossiers** : Créez une structure claire. Les dossiers sont rechargés automatiquement d'une session à l'autre.
- **Favoris (⭐)** : Marquez vos images les plus utilisées pour un accès rapide.
- **Séquence** : Marquez les images pour votre scène actuelle afin de les projeter en un clic via le diaporama.

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
