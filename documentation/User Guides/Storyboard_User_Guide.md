# 🎬 Guide Utilisateur : Master Storyboard

Le module **Master Storyboard** est le chef d'orchestre de votre partie. Il vous permet de synchroniser instantanément l'ambiance sonore, l'éclairage et les visuels pour créer des moments cinématographiques inoubliables via une interface de montage intuitive.

![Aperçu du Master Storyboard](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/doc./user-guides/storyboard_mockup.png)

## 📋 Présentation du Module

Le Storyboard utilise une **Table de Montage Horizontale** (façon pellicule de film) pour organiser vos "Moments". Un moment est une configuration prédéfinie qui impacte plusieurs modules simultanément :

1. **Musique** : Lance une piste spécifique de vos playlists.
2. **Ambiance (Ambient-OS)** : Rappelle un mixage complet de 8 pistes de fond.
3. **Effets Sonores (Sound-OS)** : Déclenche un pad SFX précis.
4. **Lumières** : Applique une scène Hue (ex: Alerte Rouge, Nuit Calme).
5. **Cartes (Atlas)** : Charge une carte spécifique pour les joueurs.
6. **Images** : Affiche une illustration ou un portrait de PNJ sur le Hub.

## 🚀 Comment l'utiliser ?

### 1. Accéder au module
Cliquez sur l'icône 🎬 (**Storyboard**) dans la section **Modules** de la barre latérale du **Session-OS**.

### 2. Créer une Séquence
- Cliquez sur le bouton doré **+ AJOUTER UNE SÉQUENCE** en haut à droite.
- Donnez un nom à votre séquence (ex: *"Rencontre avec l'Inquisiteur"*).
- Utilisez le panneau latéral droit pour choisir les éléments à déclencher.
- **Astuce :** Le bouton **[Capturer Active]** permet de copier instantanément ce qui est actuellement actif sur votre PC.

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

## 🅰️ Le Titre à l'écran

Chaque moment peut afficher un **titre** par-dessus l'image projetée, dans la police du thème du jeu :

- **Titre affiché sur l'écran** : le texte, facultatif.
- **Fondu (s)** : la durée du fondu, à l'entrée comme à la sortie.
- **Durée (s)** : combien de temps il reste. **Laissez vide pour un titre permanent** — il s'en ira alors avec son moment.

> [!TIP]
> Un écran allumé au milieu d'une séquence **rattrape** le titre en cours : vous n'avez pas à relancer le moment.

## 🎭 Une séquence est une parenthèse

Lancer une séquence **referme la précédente** :

- Son **image** s'éteint en fondu si la nouvelle n'en projette pas d'autre.
- Ses **sons** s'arrêtent — l'ambiance qu'elle avait posée et ses bruitages —, sauf si la nouvelle séquence les reprend.
- La **musique** fait exception : elle continue, et c'est vous qui décidez de l'arrêter. Il en va de même pour les lumières.

> [!IMPORTANT]
> Le Storyboard ne vise **pas** les tablettes des joueurs : il pilote vos écrans de projection et vos enceintes, pas le Player Hub tenu en main.

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
