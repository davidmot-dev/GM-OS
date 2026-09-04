# 🛟 Guide Utilisateur : la Sauvegarde automatique

GM-OS sauvegarde vos campagnes **tout seul**, dans un dossier à part. Vous n'avez rien à lancer.
Ce guide dit **quand** ça se déclenche, **où** ça atterrit, et **quand ça refuse** — parce qu'un
refus est parfois la bonne réponse.

> ⚠️ **Contexte** : les campagnes ont été perdues **deux fois** (07/08 et 24/08/2026). Ce module
> existe pour ça. Il ne remplace pas une sauvegarde manuelle avant une manipulation risquée.

---

## 1. Où ça atterrit

```text
C:\Projet_David\Security_Backup_GMOS\
```

**À côté** du dossier de GM-OS, jamais dedans. Un fichier par sauvegarde, nommé
`gmos-auto-2026-08-28T14-32-05-123.json`.

Les **12 plus récentes** sont conservées ; au-delà, les plus anciennes sont effacées — et la
rotation **ne voit que les fichiers portant ce motif**. Un fichier que vous auriez déposé là n'est
jamais touché.

## 2. Quand ça se déclenche

| Moment | Ce qui se passe |
| :--- | :--- |
| **Deux minutes après votre dernier changement** | Pas *toutes* les deux minutes : deux minutes après le **dernier** changement. *Un intervalle fixe est soit trop fréquent quand rien ne bouge, soit trop tard quand tout bouge.* |
| **À la fermeture de l'application** | Immédiatement, sans attendre. GM-OS attend que ce soit écrit avant de se fermer. |
| **Avant de supprimer une campagne** | Immédiatement. C'est le geste le plus irréversible de l'application. |
| **À la clôture d'une séance** | Immédiatement. |

## 3. Quand ça refuse — et pourquoi c'est une bonne nouvelle

Une sauvegarde peut être **refusée**, et le journal de l'application le dit. Cinq raisons :

| Raison | Ce qu'elle signifie |
| :--- | :--- |
| **Fenêtre secondaire** | Seule la fenêtre du MJ sauvegarde. Le projecteur et les tablettes n'écrivent jamais. |
| **Écriture fermée** | La base n'a pas encore fini d'être relue. |
| **Données de démonstration** | ⛔ Les campagnes `c-1` / `c-2` sont visibles — donc la vraie base n'a **pas** été relue. |
| **Aucune campagne** | Rien à sauvegarder. |
| **Pont absent** | GM-OS ne tourne pas dans Electron. |

> ⛔ **La troisième est la plus importante.** Si l'application affichait ses campagnes de
> démonstration et qu'on sauvegardait quand même, **on écraserait vos douze bonnes sauvegardes par
> douze copies de « The Eternal Quest »**. Le filet deviendrait le second mécanisme de perte. Un
> refus, ici, vous protège.

## 4. Ce qui est dedans

- **Toute la session** : campagnes, séances, PNJ, joueurs, cartes, chronologie, wiki, indices,
  actes et scènes, gabarits et pilotes personnalisés, paquets de cartes, et depuis le 04/09 le
  **butin de séance**.
- **Les playlists de Music-OS.** Pas les réglages de sortie audio : *ils décrivent votre pièce, pas
  votre univers.*
- **Les liens, ambiances, horloges, tableau blanc.**
- **La bibliothèque des fiches de personnage.**

### Les images ont un **miroir**, pas des instantanés

115 images, 261 Mo (mesurés le 29/08). En faire une copie complète à chaque sauvegarde coûterait
plusieurs gigaoctets et rendrait la sauvegarde de sortie impossible — elle dispose de **quatre
secondes**.

GM-OS tient donc un **miroir incrémental** : il demande au miroir ce qu'il a déjà et **n'envoie que
la différence**. Le premier passage est long ; tous les suivants ne coûtent que les nouveautés.

Deux choses à savoir :
- **Il garde tout**, brouillard de guerre compris.
- **Une image illisible ne bloque jamais la sauvegarde** : l'incident est noté et le passage
  continue. *Un filet qui refuse de poser la moitié qu'il peut poser ne vaut pas mieux qu'un filet
  absent.*

## 5. Restaurer

**Restaurer reste votre geste.** Le module ne restaure jamais tout seul, n'ouvre aucun dialogue et
ne pose aucun voile de chargement : vous choisissez votre fichier, en connaissance de cause.

> ⭐ **À la restauration, l'identifiant d'origine des images est conservé.** Sans cela, chaque
> restauration remplirait le disque de doublons et laisserait les cartes mortes — les fiches
> pointeraient vers des images qui ne portent plus le même nom.

Un **instantané vide ne remplace jamais un instantané plein** : c'est la garde qui empêche une
restauration partielle d'effacer ce qu'elle ne contient pas.

## 6. Trois règles qui rendent l'incident impossible

Le module n'écrit pas des commandes prudentes — il **supprime la catégorie**. Ce ne sont pas des
précautions, ce sont des propriétés de construction :

| | |
| :--- | :--- |
| **R1** | **Aucune commande de gestion de version. Jamais.** Ce module écrit un fichier, c'est tout ce qu'il sait faire. |
| **R2** | **Jamais dans le dépôt ni dans le dossier de l'application.** Un seul point fabrique un chemin, et il refuse tout le reste. |
| **R3** | **Ne supprime et n'écrase que ses propres fichiers** : son motif de nom, dans son dossier, un à la fois. |

*Pourquoi c'est écrit si fort : la première tentative, en mars 2026, exécutait `git stash`,
`git checkout` et `git push` **dans le dépôt de GM-OS**. La branche visée étant orpheline, git a
supprimé tous les fichiers qui n'y existaient pas — **la sauvegarde a vidé l'application**. Ce
n'était pas un bug de git : le service lui demandait littéralement cet effacement.*

---

## 💡 Ce qu'il faut retenir

- **Ça tourne tout seul**, et le moment le plus utile est la fermeture de l'application.
- **Un refus n'est pas une panne** — souvent c'est une protection. Le journal dit laquelle.
- **Les images sont dans un miroir**, pas dans le `.json` : les deux vont ensemble.
- Pour emporter une campagne ailleurs, c'est [Nexus-OS](./Nexus_OS_User_Guide.md) qu'il faut, pas
  ce filet-ci.

---

*Guide écrit le 2026-09-04. Le module a été construit et éprouvé en réel le 2026-08-28 (3
sauvegardes, 7 vraies campagnes) ; le miroir des images le 2026-08-29, éprouvé aller **et** retour.*
