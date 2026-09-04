# 🗄️ Guide : le Media Hub

Le Media Hub est **la** bibliothèque de fichiers de GM-OS : illustrations, musiques, bruitages,
vidéos d'ambiance, documents. Tout ce que vous importez une fois y reste, et tous les modules y
puisent.

![Aperçu du Media Hub](media_hub_mockup.png)

---

## 🚪 Une chose à comprendre avant tout le reste

**Le Media Hub n'est pas un module qu'on visite : c'est un sélecteur qu'on ouvre.** Il n'a pas
d'entrée dans la barre latérale. Il s'ouvre en plein écran quand un module a besoin d'un fichier —
et **chaque module ne lui montre que ce qui l'intéresse** :

| Vous l'ouvrez depuis… | Vous voyez… |
| :--- | :--- |
| Image-OS, une fiche de PNJ, un portrait de personnage, un indice, le fond d'une campagne | **les images seules** |
| Music-OS, Sound-OS, Ambient-OS | **l'audio seul** |
| Map-OS, l'Atlas | **images et vidéos** |
| L'éditeur de fiche, en mode document | **les documents seuls** |

> 🔎 **Conséquence pratique.** Si un fichier « a disparu », il est le plus souvent simplement d'un
> type que l'écran d'où vous regardez ne montre pas. Les onglets **TOUT / IMAGE / AUDIO / VIDEO /
> DOC** en haut ne filtrent qu'à l'intérieur de ce que le module a déjà autorisé : depuis Image-OS,
> l'onglet AUDIO reste vide.

---

## 📥 Importer

**Importer Asset Tactique**, en bas à droite, ouvre le sélecteur de fichiers de votre système.

| Famille | Reconnue par |
| :--- | :--- |
| **Audio** | le type du fichier (`audio/…`) — MP3, WAV, OGG, M4A… |
| **Vidéo** | le type du fichier (`video/…`) — MP4, WebM… |
| **Document** | PDF, DOC, DOCX, ODT, TXT, RTF, MD |
| **Image** | **tout le reste** |

> ⚠️ **« Image » est la catégorie par défaut, pas une détection.** Un fichier que GM-OS ne reconnaît
> ni comme son, ni comme vidéo, ni comme document est rangé dans les images — et n'affichera donc
> qu'une vignette cassée. Si un import atterrit au mauvais endroit, c'est ça.

<!-- -->

> ⚠️ **Aucune détection de doublon.** Importer deux fois le même fichier crée deux entrées
> indépendantes, avec deux identifiants. Rien ne vous préviendra.

Les fichiers importés sont **recopiés dans la base interne** de l'application. Déplacer, renommer ou
supprimer l'original sur votre disque n'a plus aucun effet sur votre partie.

---

## 🔎 Retrouver un fichier

Le Hub offre **six** manières de réduire la liste, qui se combinent toutes.

### La recherche

Le champ du haut cherche dans **le nom, les tags et le type** à la fois. Taper `audio` remonte tous
vos sons ; taper `elfe` remonte aussi bien `elfe_archer.png` qu'une image taguée `Elfe`.

### Les tags, et la logique OU / ET

Colonne de gauche, **Tags Tactiques**. Cliquez pour en sélectionner plusieurs, et **le bouton
`OR` / `AND` change tout** :

- **OR** (par défaut) — les fichiers qui portent **au moins un** des tags choisis.
- **AND** — seulement ceux qui les portent **tous**.

*C'est ce bouton qui transforme les tags en vrai outil : `PNJ` + `Ennemi` en mode AND vous donne
exactement les portraits d'adversaires.*

### Les dossiers de collection

Colonne de gauche, en haut. **Trois familles** :

| | |
| :--- | :--- |
| **Archive Globale** | tout, sans filtre |
| **Matrice Intelligente** | deux dossiers calculés : **Dernière Fréquence** (les imports récents) et **Contenu Non Aliasé** (tout ce qui n'a **aucun** tag — la pile à ranger) |
| **Domaines Utilisateur** | **vos** dossiers, que vous créez avec le **+** |

Un fichier peut appartenir à plusieurs dossiers, et un dossier supprimé **n'efface aucun fichier** —
il défait seulement le rangement.

### Le focus campagne

Le bouton **Focus Opérationnel / Matrice Globale** bascule entre « tout » et « seulement ce qui est
lié à la campagne active ».

### Le type, et le tri

Les onglets **TOUT / IMAGE / AUDIO / VIDEO / DOC**, et un menu de tri : **Plus récents**, **Plus
anciens**, **Taille**, **Nom (A-Z)**.

---

## 👁️ Regarder, choisir, ranger

### Sur une vignette

**Cliquez sur l'image** pour l'ouvrir en plein écran. C'est un vrai lecteur :

- une **image** s'affiche en grand ;
- un **son** et une **vidéo** démarrent tout seuls, avec les commandes de lecture ;
- **ESC** referme.

> ⚠️ **Les documents n'ont pas d'aperçu.** Ouvrir un PDF en plein écran affiche un écran vide. Le
> Hub sait les ranger, pas les lire.

Au survol de la vignette apparaissent **Supprimer Asset** et le grand bouton rond **Sélectionner
pour Transmission** — celui qui renvoie le fichier au module qui a ouvert le Hub. Un crayon permet
de **Modifier l'identifiant** (le nom d'affichage ; le fichier d'origine n'est pas touché).

### Le panneau de détails

Le bouton **ÉDITION DÉTAILLÉE** ouvre un panneau latéral qui donne, sur un seul média :

- un **grand aperçu**, son type et son poids ;
- le **cadenas de persistance** (voir plus bas) ;
- **Classification Dossier** — cocher les dossiers auxquels il appartient ;
- **Matrice de Tags** — en ajouter, en retirer ;
- son **identifiant** et sa **date d'import** ;
- **Attribution Opérationnelle** — lier ou délier le média à chacune de vos campagnes.

> ⛔ **Correction.** Ce guide annonçait un « Status Tactique » disant si le média est utilisé dans
> la session en cours. **Il n'existe pas** : rien dans le panneau ne dit qui se sert d'un fichier.

---

## 🔒 Le cadenas, et le nettoyage

### Ce que fait vraiment le nettoyage

Un bouton dans les **Paramètres généraux** lance une passe : GM-OS parcourt vos modules, note tous
les médias **référencés quelque part**, et **supprime les autres**. Les fichiers marqués
**Persistant** sont épargnés.

> ⛔ **Correction, et elle change la façon de s'en servir.** Ce guide affirmait que GM-OS
> « scanne **régulièrement** la base pour supprimer les orphelins ». **Rien ne tourne
> automatiquement.** Le nettoyage n'existe que sous la forme de ce bouton, et tant que vous ne le
> pressez pas, aucun fichier n'est jamais supprimé tout seul.

### Ce que le nettoyage regarde — et ce qu'il ne regarde pas

Il vérifie huit endroits : NPC-OS, Image-OS, la campagne (fond d'écran, PNJ, portraits et jetons des
personnages, cartes de l'Atlas, wiki), Combat-OS, Sound-OS, Music-OS, Ambient-OS.

> ⛔ **Trois sources de médias lui échappent, et un fichier qui n'existe que là sera vu comme
> orphelin :**
>
> | Ce qui n'est pas vu | Le fichier en danger |
> | :--- | :--- |
> | **Map-OS** | la carte chargée sur le plateau tactique, et **l'image de chaque configuration sauvée** |
> | **Les indices** | l'image attachée à un indice |
> | **Le storyboard** | l'image d'un moment |
>
> **Avant de lancer le nettoyage, verrouillez ces fichiers-là** — ou ne le lancez pas. Signalé le
> 2026-09-04.

### Verrouiller

Dans le panneau de détails, le **cadenas** en haut à droite de l'aperçu. Fermé, il devient coloré,
un badge **Persistant** apparaît, et une petite icône de cadenas s'affiche sur la vignette dans la
grille.

> [!TIP]
> **Verrouillez ce qui n'a pas encore servi.** Le boss de l'acte III, la carte secrète, l'image du
> retournement final : tant qu'ils ne sont attachés à rien, ils sont exactement ce que le nettoyage
> appelle un orphelin.

Un import n'est **jamais** persistant : c'est toujours un second geste.

---

## ☢️ Purger le Hub Global

Le bouton rouge en bas de la colonne de gauche. Il **efface tout** — tous les fichiers et tous les
dossiers, **y compris les fichiers verrouillés**. Une confirmation le dit, et il n'y a pas de retour
en arrière depuis l'application.

---

## 💾 Où vivent vos fichiers, et sont-ils protégés ?

Les médias sont dans une base locale de l'application (IndexedDB), séparée de la base des
campagnes. La place disponible dépend de votre machine ; plusieurs gigaoctets sont la norme.

**Oui, ils sont sauvegardés** — par le **miroir des médias**, qui les recopie à côté de la
sauvegarde automatique. Il fonctionne **par différence** : le premier passage est long (115 images,
261 Mo mesurés le 29/08), les suivants ne coûtent que les nouveautés. Une image illisible se
journalise et n'interrompt jamais la sauvegarde.

> 🔎 **À la restauration, chaque image revient sous son identifiant d'origine** — sans quoi vos
> cartes et vos portraits pointeraient dans le vide alors même que les fichiers seraient revenus.

→ [Guide de la sauvegarde automatique](./Sauvegarde_Automatique_User_Guide.md)

Une **campagne supprimée** ne supprime aucun fichier : GM-OS retire seulement l'étiquette de cette
campagne sur les médias concernés.

---

## 🔧 Dépannage

| Problème | Ce qu'il faut regarder |
| :--- | :--- |
| **Un fichier n'apparaît pas** | Vous avez ouvert le Hub depuis un module qui ne montre pas ce type. Ouvrez-le depuis le bon module. |
| **Une vignette est cassée** | Le fichier a été rangé dans les images par défaut, faute d'être reconnu. |
| **Un PDF ne s'ouvre pas en aperçu** | Normal : le Hub ne lit pas les documents. |
| **Le même fichier apparaît deux fois** | Il a été importé deux fois. Il n'y a pas de détection de doublon ; supprimez-en un. |
| **Des images ont disparu après un nettoyage** | Elles n'étaient référencées **que** par Map-OS, un indice ou le storyboard — les trois angles morts du nettoyage. Restaurez depuis la sauvegarde, puis verrouillez-les. |
| **Le filtre par tags ne rend presque rien** | Le bouton est sur **AND** : il exige *tous* les tags. Repassez-le sur **OR**. |
| **La liste est vide et je n'ai rien filtré** | Vérifiez le **Focus Opérationnel** : il ne montre que les médias liés à la campagne active. |

---

*Guide refait le 2026-09-04, code à l'appui. Deux affirmations fausses retirées — le nettoyage
« régulier » (il est manuel, et son bouton vit dans les Paramètres) et le « Status Tactique » qui
n'existe pas. Trois fonctions ajoutées : les **dossiers de collection**, la **logique OU / ET** des
tags, et le **tri**. Et les trois angles morts du nettoyage écrits noir sur blanc.*
