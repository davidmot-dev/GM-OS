# 📦 Guide : Nexus-OS — emporter une campagne

Nexus-OS empaquette une campagne, ou un système de jeu, dans **un seul fichier** que vous pouvez
copier sur une clé, envoyer à quelqu'un, ou rouvrir après une réinstallation.

C'est de la **portabilité**, pas de la sauvegarde. Pour protéger vos données au quotidien, c'est la
[sauvegarde automatique](./Sauvegarde_Automatique_User_Guide.md) qui travaille, toute seule, sans que
vous ayez à y penser.

> ⚠️ **Nexus-OS ne fonctionne que dans l'application de bureau.** Ouvert dans un navigateur, les
> boutons sont grisés et un badge le dit — l'empaquetage a besoin d'écrire des fichiers.

---

## 📤 Exporter une campagne

**Cockpit → la campagne → panneau « Portabilité & Archivage de Campagne » → Exporter (.gmos)**

Une fenêtre plein écran, le **Nexus HUD**, suit le travail. Il traverse ces étapes :

| Étape | Ce qui se passe |
| :--- | :--- |
| **Extraction des données** | Tout ce qui appartient à la campagne est rassemblé |
| **Vérification des liens distants** | Les images qui vivent sur le web sont repérées — **le HUD s'arrête ici s'il en trouve** |
| **Moissonnage des médias** | Les fichiers sont récupérés depuis le Media Hub |
| **Compression du bundle** | L'archive `.gmos` est écrite |
| **Opération terminée** | Le HUD se referme au bout de trois secondes |

Un sélecteur vous demande où poser le fichier.

### L'arrêt sur les liens distants

Si des images pointent vers Internet (une URL Pinterest, Unsplash…), le HUD s'interrompt et propose :

- **Tout localiser** — GM-OS télécharge ces images, les range dans votre Media Hub et les met dans
  l'archive. La campagne devient utilisable **hors ligne**, chez vous comme chez le destinataire.
- **Ignorer** — les liens restent des liens. L'archive est plus légère, mais elle dépend du web.

Un téléchargement qui échoue (lien mort) est signalé dans le journal du HUD et **n'interrompt pas
l'export**.

---

## 📥 Importer

Trois boutons ouvrent **le même sélecteur**, qui accepte aussi bien un `.gmos` qu'un
`.gmos-driver` :

| Où | Bouton |
| :--- | :--- |
| Bibliothèque de campagnes | **IMPORTER UN BUNDLE NEXUS** |
| Panneau d'une campagne | **Importer (.gmos)** |
| Librairie de Modèles, onglet Drivers | **Importer un driver** |

> 🔎 **C'est l'archive qui décide de sa destination, pas l'écran d'où vous partez.** Le fichier porte
> le nom de sa campagne : l'importer depuis le panneau d'une *autre* campagne ne l'y verse pas, il
> restaure la campagne du fichier. Il n'y a donc aucun risque à se tromper de bouton.

### Si une campagne du même nom existe déjà

Le **résolveur de conflits** s'affiche et vous laisse trois issues :

| Choix | Effet |
| :--- | :--- |
| **Remplacer** | Les données de la campagne existante sont écrasées par celles de l'archive |
| **Cloner** | L'archive entre comme une **nouvelle campagne indépendante**, avec de nouveaux identifiants |
| **Annuler** | Rien n'est touché |

À la fin, GM-OS **bascule sur la campagne importée** et vous dépose dans le cockpit.

---

## 🎲 Partager un système de jeu

Un `.gmos-driver` contient un **système**, sans aucune campagne : les règles, le moteur de dés, les
consignes d'IA, le gabarit de fiche associé, et — depuis le 2026-09-03 — **le bestiaire du jeu**,
c'est-à-dire les gabarits d'adversaires que vous avez rangés. *Partager un jeu sans ses adversaires
reviendrait à partager un livre de règles sans son bestiaire.*

**Exporter** : Librairie de Modèles → onglet **Drivers** → sélectionnez-en un → **Exporter** dans le
panneau d'aperçu.

**Importer** : le bouton **Importer un driver** en haut de la même page. Un driver du même nom
déclenche le même résolveur de conflits, avec l'option **Cloner** pour ne pas écraser votre travail.

> Un `.gmos-driver` fabriqué avant le 03/09 ne contient pas de bestiaire. Il s'importe sans rien
> perdre : le champ est facultatif.

---

## 📊 Le badge Nexus dans la bibliothèque

Chaque campagne porte l'un de **deux** badges :

| Badge | Ce qu'il dit |
| :--- | :--- |
| **« *n* médias »** (bleu) | La campagne référence *n* fichiers médias locaux → l'export emportera de vrais fichiers |
| **Nexus** (gris) | Aucun fichier média local → l'export sera **léger, JSON seulement** |

> ⛔ **Correction.** Ce guide décrivait jusqu'au 2026-09-04 un feu tricolore — 🟢 Nexus-Ready,
> 🟡 Localisable, 🔴 Non portable (YouTube) — qui **n'a jamais existé**. Il n'y a que deux états, et
> le badge compte des médias : **il ne dit pas si vos images sont portables.** Une campagne dont
> toutes les illustrations sont des URL web affichera le badge gris, et c'est bien à l'arrêt sur les
> liens distants, pendant l'export, que la question se règle.
>
> ✅ **Le badge a été renommé le soir même.** Il s'appelait « Nexus-Ready », ce qui promettait la
> portabilité alors qu'il ne compte que des fichiers. Il annonce désormais « *n* médias », et son
> infobulle dit ce qui est compté.

---

## 📋 Ce que l'archive contient — et ce qu'elle laisse

C'est la partie qu'il faut lire avant d'envoyer un fichier à quelqu'un, ou avant de compter dessus
pour une migration.

### ✅ Ce qui part

La campagne · ses **PNJ** · ses **joueurs et leurs personnages** · l'historique des **séances** ·
les **cartes de l'Atlas** · le **wiki** · la **chronologie** · les **indices** · **la trame**, actes
et scènes · les **paquets de cartes** · le **système de jeu forgé** et son gabarit de fiche · et,
côté médias, toutes les images moissonnées avec leur empreinte de contrôle.

Deux inclusions qui surprennent :

> ⚠️ **L'archive emporte des PNJ d'autres campagnes.** Si un de vos PNJ a une **relation sociale**
> vers un personnage d'une autre campagne, ce personnage est inclus pour que le réseau reste
> cohérent. C'est voulu.
>
> ✅ **Mais depuis le 2026-09-04, ces fiches-là partent caviardées** : le nom, le portrait, le rôle
> et les relations voyagent — c'est ce qui fait le réseau —, tandis que les **Notes de MJ** et les
> **Informations secrètes** sont vidées. *Les secrets d'une campagne que vous n'avez jamais eu
> l'intention de partager n'ont pas à voyager dans l'archive d'une autre.*
>
> **Les PNJ de la campagne exportée, eux, partent complets.** C'est la campagne qu'on emporte : se
> caviarder soi-même n'aurait aucun sens.

<!-- -->

> ⚠️ **L'archive emporte TOUTES vos ambiances sonores et TOUTES vos playlists**, pas seulement
> celles de la campagne. Le code le dit explicitement : elles sont considérées comme
> l'environnement de jeu du meneur.

### ⛔ Ce qui ne part pas, ou ne revient pas

| Ce qui manque | Conséquence concrète |
| :--- | :--- |
| **Le plateau tactique (Map-OS)** | Brouillard et pions ne voyagent pas. Voir le [guide de Map-OS](./Map_OS_User_Guide.md). |
| **Les sons distants** | Un pad ou une piste qui pointe vers Spotify, SoundCloud ou une URL quelconque reste un lien. |

> ✅ **Quatre manques comblés le 2026-09-04.** Jusqu'à cette date, l'archive **laissait la trame**
> — actes et scènes — sur la machine d'origine, et **mettait dedans sans jamais reposer** les
> paquets de cartes et le système de jeu forgé. Les quatre voyagent désormais.
>
> Deux précautions accompagnent le retour : **le pilote s'ajoute, il ne remplace jamais** un
> système du même identifiant déjà présent — l'import d'une campagne n'a pas à détruire votre
> travail de Forge —, et **une archive d'avant cette date ne perd rien** : sans trame dedans, la
> trame d'ici n'est pas touchée.

<!-- -->

> ✅ **Et le défaut le plus coûteux est corrigé.** Importer une campagne **remplaçait
> l'intégralité de votre bibliothèque d'ambiances de Sound-OS** par celle de l'archive : des heures
> de pads rangés effacées sans un mot. *Le bon code était déjà là, deux lignes plus bas — les
> playlists fusionnaient proprement depuis le début.* Les deux suivent maintenant la même règle :
> **ce qui porte le même identifiant est remplacé, ce qui est nouveau s'ajoute, ce qui n'est pas
> dans l'archive reste.**

---

## 🔒 Ce que GM-OS refuse d'ouvrir

Une archive n'est pas un fichier de confiance : elle vient d'ailleurs. Avant toute écriture,
GM-OS vérifie que le manifeste porte bien sa version de schéma et les champs obligatoires, et
**rejette tout chemin de fichier qui tente de sortir du dossier d'extraction** (les fameux `../`).
Un fichier dont le manifeste ne passe pas est refusé **avant** que quoi que ce soit ne soit injecté.

Chaque média est accompagné de son empreinte **SHA-256** et de sa taille, ce qui permet de détecter
une archive abîmée.

---

## 🔧 Dépannage

| Problème | Ce qu'il faut regarder |
| :--- | :--- |
| **L'archive semble vide de toute image** | La campagne portait le badge gris **Nexus** : ses illustrations sont des liens web. Relancez l'export et choisissez **Tout localiser**. |
| **« Archive invalide » à l'import** | Le manifeste ne passe pas la vérification. Un `.gmos` est un **fichier ZIP** : renommez-en une copie en `.zip` pour regarder dedans — vous devez y trouver `manifest.json` et `state.json`. |
| **Des PNJ sans portrait après l'import** | Leur avatar était une URL distante non localisée. Reposez une image depuis le Media Hub. |
| **Une campagne d'avant le 04/09 arrive sans sa trame** | Normal : les archives antérieures n'en contiennent pas. Réexportez-la depuis la machine d'origine. |
| **Les boutons Nexus sont grisés** | Vous êtes dans un navigateur, pas dans l'application de bureau. |
| **L'export est long** | Normal : chaque image est copiée et empreintée. Comptez une à deux minutes pour une campagne bien illustrée. |

---

*Guide refait le 2026-09-04, code à l'appui, **et complété le soir même** quand les quatre
manques qu'il décrivait ont été comblés. Quatre sections qui n'avaient rien à faire ici ont été
retirées — le « Theater Mode » (un nom qui n'apparaît nulle part dans le code), le style
« Glassmorphism / Bento », la messagerie du Hub, et le moment de la journée de Map-OS, qui a
[son guide](./Map_OS_User_Guide.md). Le feu tricolore Nexus-Ready a été corrigé en deux états, les
étapes de l'export rétablies, et la liste de ce que l'archive **ne** contient **pas** ajoutée —
c'est elle qu'il fallait écrire.*
