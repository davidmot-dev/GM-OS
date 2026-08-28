# Sauvegarde automatique — le plan

**Écrit le 2026-08-27, validé par David. Étapes 0 à 5 construites le 2026-08-28.**

> ## État au 2026-08-28
>
> | Étape | | Où |
> | --- | --- | --- |
> | 0 · Mesurer | ✅ **et la mesure a changé la réponse** — voir § 7 | — |
> | 1 · Le canal sans dialogue | ✅ | `electron/sauvegardeAutomatique.ts` |
> | 2 · Les garde-fous | ✅ **45 tests** | `sauvegardeAutomatique.test.ts`, `SessionBackupManager.test.ts` |
> | 3 · La rotation | ✅ 12 récentes + une par jour sur 7 | `faireLaRotation()` |
> | 4 · Les déclencheurs | ✅ repos, fermeture, suppression de campagne | `SessionBackupManager`, `main.ts` |
> | 5 · L'indicateur | ✅ il dit l'heure vraie, clic droit ouvre le dossier | `Shell.tsx` |
> | 6 · Le ménage | ✅ `appBridge.git` et `useBackupSync` supprimés | — |
>
> ### ✅ Éprouvé en conditions réelles le 2026-08-28
>
> Trois sauvegardes écrites par l'application elle-même dans
> `%APPDATA%\gm-os-v5\backups\`, **1,5 Mo chacune** :
> **7 campagnes réelles** (Anges de Feu, Agents de Dune, À la claire fontaine,
> Le Secret de Milo…), 125 PNJ, 7 joueurs, 102 scènes, 12 pilotes — et
> **zéro mock**. Le garde-fou du § 3 a donc fait exactement son travail.
>
> Dimensionnement confirmé : 12 récentes + 7 quotidiennes ≈ **28 Mo** au total.
>
> **Ce qui reste : la seule décision du § 7**, sur les images.
> `tsc -b` propre, **2 503 tests au vert**.
>
> #### Deux défauts trouvés à l'essai, corrigés le même jour
>
> - **Le bouton « Quitter GM-OS » n'avait aucun destinataire.** `preload.ts`
>   envoyait `app:quit` et **aucun `ipcMain.on` n'écoutait** — vérifié dans
>   `HEAD` : le gestionnaire n'a jamais existé. Le bouton demandait
>   confirmation puis ne faisait rien. Posé.
> - **⚠️ La croix de la fenêtre ne passe pas par `before-quit`.** Elle déclenche
>   `close` → `window-all-closed` → `app.quit()` **alors que la fenêtre est déjà
>   détruite** : plus personne pour construire la charge. La garde sortait
>   proprement — en n'écrivant rien. *Elle n'aurait jamais planté, elle se
>   serait tue*, et c'est le pire mode d'échec pour un filet. Les **deux**
>   portes sont maintenant gardées par la même fonction et le même drapeau.

C'est le dernier reste du filet : les campagnes ont été perdues deux fois, et il
n'existe aucune sauvegarde applicative. Mais **une première tentative a déjà eu
lieu, et elle a vidé l'application** — donc ce plan commence par établir ce qui
s'est réellement passé, parce que les garde-fous ne valent que s'ils visent la
vraie cause.

---

## 1 · Ce que l'ancienne sauvegarde faisait — retrouvé dans l'histoire git

Le fichier a été supprimé par `c6306c9` (*« cleanup backup system »*). Il est
lisible dans `git show c6306c9^:electron/GitBackupService.ts`.

Il était construit ainsi :

```ts
// main.ts, aujourd'hui commenté
const gitBackupService = new GitBackupService(process.env.APP_ROOT);
```

`APP_ROOT`, c'est **le dépôt de GM-OS lui-même**. Et `syncData()` y exécutait,
toutes les N minutes :

| Étape | Commande | Ce qu'elle fait vraiment |
| --- | --- | --- |
| 1 | `git stash` | **emporte le travail non commité** hors de l'arbre |
| 2 | `git checkout data-sync` | **remplace l'arbre de travail** par celui d'une branche orpheline |
| 3 | `git rm -r --cached .` | vide l'index |
| 4 | `git add` · `git commit` · **`git push origin data-sync`** | publie |

**L'étape 2 est celle qui vide l'application.** `data-sync` est une branche
*orpheline* : elle ne contient que le dossier de sauvegardes. En basculant
dessus depuis `main`, git **supprime du disque tous les fichiers suivis qui n'y
existent pas** — c'est-à-dire tout GM-OS. C'est le comportement normal de git,
pas un bug : le service demandait littéralement l'effacement.

Et l'étape 1 faisait disparaître silencieusement le travail en cours.

### Le correctif de l'époque a traité le symptôme, pas la cause

`documentation/walkthroughs/v5_recovery_and_clues_integration.md` raconte
l'incident et la parade : remplacer `git rm -rf .` par `git rm -r --cached .`,
*« les fichiers physiques sont intouchables »*, plus un bloc `finally` pour
revenir sur la branche d'origine.

**C'était insuffisant, et c'est le point qui compte pour ce plan.** Le `git rm`
n'était qu'une des trois commandes destructrices. Le `checkout` de l'étape 2
restait, le `stash` de l'étape 1 restait, le `push` restait. Le `finally`
lui-même finissait par `git checkout -f` — *forcer* un changement de branche,
c'est-à-dire écraser sans demander. La sauvegarde a donc continué de pouvoir
vider le projet après avoir été « sécurisée ».

C'est pour ça que le plan ci-dessous ne cherche pas à écrire des commandes git
plus prudentes. **Il supprime la catégorie entière.**

### Ce qui reste de tout ça dans le dépôt aujourd'hui

- `electron/main.ts` — deux lignes commentées, et les trois `ipcMain.handle`
  `git:*` commentés en bloc.
- **`electron/preload.ts:244` expose encore `appBridge.git.{getStatus,
  setupBranch, sync}`** — le levier est toujours sur le tableau de bord, il ne
  commande plus rien. Déclaré aussi dans `src/types/window.d.ts:108`.
- `src/hooks/useBackupSync.ts` — une coquille vide qui journalise
  *« Automated backup is DISABLED »*.
- `SessionBackupManager` — intact et **désactivé par un drapeau en dur**
  (`IS_AUTO_BACKUP_ENABLED = false`).

---

## 2 · Les trois règles, non négociables

Elles ne sont pas des précautions, ce sont des **propriétés de construction** :
si le code les respecte, l'incident de mars ne peut pas se reproduire, quelle
que soit la suite des événements.

### R1 · La sauvegarde n'exécute aucune commande de gestion de version

Pas de `git`, pas de `hg`, pas de `svn`, jamais, sous aucun drapeau. Une
sauvegarde **écrit un fichier**. C'est tout ce qu'elle sait faire.

*Corollaire :* on **supprime** `appBridge.git` du préchargement, ses types, et
le squelette `useBackupSync`. Un levier débranché qui s'appelle `git.sync` est
une invitation à le rebrancher.

### R2 · La sauvegarde n'écrit jamais dans le dépôt, ni dans le dossier de l'application

Destination unique : `app.getPath('userData')/backups/`. Jamais `APP_ROOT`,
jamais `SESSIONS_DIR` — qui vit sous `APP_ROOT` et qu'une mise à jour emporte.
Le précédent est déjà posé par `PairingManager` et `SecurityManager`, qui
rangent leurs données au même endroit.

*Contrôle exécutable :* le chemin de destination est calculé par une fonction
unique, et un test vérifie qu'il ne peut pas tomber sous `APP_ROOT` — y compris
si on lui passe `..` ou un chemin absolu.

### R3 · La sauvegarde ne supprime et n'écrase que des fichiers qu'elle a écrits

La rotation ne supprime qu'un fichier dont le nom correspond à son propre motif
(`gmos-auto-<horodatage>.json`) **et** qui se trouve dans son propre dossier.
Tout le reste est invisible pour elle. Elle n'a pas de `rm -r`, pas de glob
large, pas de « nettoyer le dossier ».

---

## 3 · Le garde-fou de l'autre côté : ne pas sauvegarder le vide

Les trois règles ci-dessus protègent **l'application**. Celui-ci protège **les
données**, et il vient de la leçon de ce matin : *une sauvegarde automatique qui
tourne pendant que le store porte les mocks écrase vingt bonnes sauvegardes par
vingt copies de « The Eternal Quest » en cinq heures.* Le filet devient alors le
second mécanisme de perte.

Donc, avant d'écrire, on refuse dans quatre cas :

1. **L'écriture n'est pas ouverte** — `lEcritureEstOuverte()` est faux, la base
   n'a pas été relue (garde posée le 2026-08-27). L'état en mémoire n'est pas
   digne de confiance.
2. **L'état ressemble aux données de démonstration** — les identifiants `c-1` /
   `c-2` de `INITIAL_DATA`, ou zéro campagne.
3. **La sauvegarde serait beaucoup plus petite que la précédente** sans qu'une
   suppression l'explique. On garde alors l'ancienne et on avertit. *Une perte se
   voit à ce moment-là, ou elle ne se voit jamais.*
4. **La fenêtre n'est pas celle du MJ** — même raison que partout ailleurs.

---

## 4 · Le déroulé du travail

Chaque étape est utile seule et vérifiable seule.

### Étape 0 · Mesurer, avant de choisir la rétention

Ce n'est pas une formalité : **les chiffres du disque ne s'accordent pas**, et
la rétention en dépend d'un facteur soixante.

| Source | Poids |
| --- | --- |
| L'état vivant, blobs IndexedDB | **263 Mo** |
| `sessions/gmos-session.json` (17 avril) | **33,8 Mo** |
| `sessions/gmos-session-07082026.json` (7 août) | **507 Ko** |
| `sessions/BladeRunner.json` | 274 Ko |

Une sauvegarde d'août pèse soixante-six fois moins qu'une sauvegarde d'avril.
Il faut savoir **pourquoi** avant de dimensionner : très probablement les images
qui étaient embarquées en base64 et qui vivent maintenant dans `temp-media`. Si
c'est le cas, la sauvegarde JSON est légère **mais ne contient plus les images**,
et « restaurer » ne rendrait pas les cartes. *C'est la question ouverte du § 6.*

**Geste :** produire une sauvegarde réelle depuis l'état actuel et la peser,
avant d'écrire la rotation.

### Étape 1 · Le canal d'écriture, sans dialogue

Un `ipcMain.handle('backup:auto-write')` neuf dans `main.ts`, qui :

- calcule la destination par la fonction unique de R2 ;
- écrit dans un fichier temporaire `.part`, puis **`rename`** — un `rename` est
  atomique, donc une coupure de courant ne laisse jamais une sauvegarde
  tronquée qu'on croirait valide ;
- **relit le fichier écrit** et vérifie qu'il se parse et que le compte de
  campagnes est celui attendu. Le motif existe déjà dans
  `idbStorage.migrateFromLocalStorage` — on ne l'invente pas ;
- rend `{ chemin, octets, campagnes }`, jamais un simple booléen : l'appelant
  doit pouvoir constater, pas croire.

Le bouton « Sauvegarder » manuel **garde son dialogue** et son canal
`save-session`. Ce sont deux gestes différents, ils ne partagent que les données.

### Étape 2 · Les garde-fous du § 3, avec leurs tests

Écrits **avant** de rallumer quoi que ce soit. Chacun a son test de régression,
dont celui qui compte le plus : *l'état porte les mocks → aucune écriture, et la
sauvegarde précédente est intacte.*

### Étape 3 · La rotation, prudente

`gmos-auto-<ISO>.json`, les N dernières + une par jour sur sept jours. `N` est
tranché par l'étape 0. Suppression conforme à R3 : motif de nom, dossier propre,
un fichier à la fois.

### Étape 4 · Les déclencheurs, et la fin du silence trompeur

- **à la fermeture** (`before-quit`) — le moment où tout se perd ;
- **à la clôture d'une séance** ;
- **deux minutes après le dernier changement** de `lesDonneesDeLaSession` — la
  liste existe déjà et fait autorité.

Et on corrige au passage ce qui rendait l'ancien système invivable :
`saveFullSession(silent)` ne tait aujourd'hui que le toast — **ni le
`dialog.showSaveDialog`, ni le voile `setLoading('Sauvegarde en cours…')`**. Le
chemin automatique n'aura ni l'un ni l'autre.

### Étape 5 · Rendre l'indicateur honnête, et la restauration accessible

`Shell.tsx:182` affiche l'heure de la dernière sauvegarde. Comme
`setLastBackupAt` n'est appelé que par le gestionnaire éteint, **il affiche
`--:--` depuis toujours**. Il dira l'heure réelle, et ouvrira le dossier des
sauvegardes d'un clic.

*Une sauvegarde qu'on ne sait pas relire n'est pas une sauvegarde :* on vérifie
qu'un fichier automatique se recharge par le chemin `load-session` existant.

### Étape 6 · Le ménage

Supprimer `appBridge.git`, ses types, les handlers commentés et
`useBackupSync.ts`. Et remplacer le drapeau `IS_AUTO_BACKUP_ENABLED` par un
vrai réglage, dont la valeur par défaut sera décidée après le premier essai en
conditions.

---

## 5 · Ce que ce plan ne fera pas

- **Aucune synchronisation distante.** Pas de push, pas de dépôt, pas de nuage.
  Si tu veux un jour une copie hors machine, ce sera un geste séparé et
  explicite, jamais une conséquence d'un minuteur.
- **Aucune restauration automatique.** Restaurer reste un acte du MJ, qui choisit
  son fichier. Une restauration automatique est un effacement qui s'ignore.
- **Aucune écriture hors de `userData/backups/`.**

---

## 6 · La seule question ouverte, et elle est pour David

**Que doit contenir une sauvegarde : les données seules, ou les données et les
images ?**

- **Données seules** (~500 Ko) — rapide, on peut en garder cinquante. Mais si
  `temp-media` est perdu, les cartes et les portraits ne reviennent pas.
- **Données et images** (~34 Mo, peut-être plus vu les 263 Mo de blobs vivants) —
  une vraie restauration, mais quelques copies suffisent à occuper un gigaoctet.

**Ma recommandation : les deux, séparément.** Une sauvegarde de données à chaque
déclencheur, fréquente et légère ; et un instantané complet, images comprises,
**une fois par jour et à la clôture d'une campagne**. Les images changent
beaucoup moins souvent que le texte, et c'est ce qui rend la séparation
efficace plutôt qu'artificielle.

L'étape 0 confirmera les chiffres avant qu'on s'engage.

---

## 7 · Ce que l'étape 0 a mesuré — la réponse n'était aucune des deux

La question du § 6 était : *données seules (~500 Ko) ou données et images (~34 Mo) ?*
**La mesure dit que ce n'est ni l'un ni l'autre.** Le chemin de sauvegarde
actuel ne contient **aucune image, et aucune n'en a jamais été retirée** — il
n'a jamais su les prendre.

| Fichier | Poids | `data:image` embarquées | Références média |
| --- | --- | --- | --- |
| `gmos-session.json` (17 avril) | 33,8 Mo | **21** | 1 |
| `gmos-session-07082026.json` (7 août) | 498 Ko | **0** | **29** |
| `BladeRunner.json` | 271 Ko | 1 | 23 |

L'écart de soixante-six entre avril et août n'est pas une optimisation : c'est un
**changement de modèle**. Une carte de l'atlas porte aujourd'hui
`"fileUrl": "m-79ff0205-40f6-4efd-9c14-1a2aa9f33ac2"` — **un identifiant**, dont
les octets vivent dans une **autre base de données**.

Il y en a trois, et une seule est sauvegardée :

| Base | Contenu | Sauvegardée ? |
| --- | --- | --- |
| `gmos-state-db` | l'état de session | ✅ par ce chantier |
| **`gmos-media-db`** | **les images** (`useMediaStore`) | ❌ **par personne** |
| `gmos-fog-data` | le brouillard de guerre | ❌ |

Les 263 Mo de blobs IndexedDB du profil sont pour l'essentiel `gmos-media-db`.

> **Conséquence à ne pas perdre de vue : la sauvegarde livrée aujourd'hui est une
> sauvegarde de pointeurs.** Elle protège les campagnes, les PNJ, la trame, les
> pilotes et les fiches — tout ce qui a été perdu les deux fois. Mais restaurer
> sur un profil neuf rendrait 29 images mortes.
>
> Ce n'est pas une régression : rien ne les sauvegardait avant non plus. C'est
> une **seconde question**, désormais chiffrée.

### La décision qui reste

Sauvegarder `gmos-media-db` est un chantier distinct — 263 Mo, une autre base,
une autre cadence. Ma recommandation inchangée dans sa forme : **un instantané
des médias, séparé, rare** (une fois par jour, et à la clôture d'une campagne),
avec déduplication par identifiant puisque les images changent rarement. À
trancher quand tu voudras ; la sauvegarde des données, elle, tourne.

---

## 8 · Trois choses trouvées en construisant

**1. Le voile de chargement restait collé.** `saveFullSession` posait
`setLoading(true)` sans condition et ne le retirait que `if (!silent)` — donc
**toute sauvegarde silencieuse laissait l'écran voilé pour toujours**. C'est une
deuxième raison, indépendante du dialogue, pour laquelle l'ancien système ne
pouvait pas tourner en fond. Corrigé.

**2. Le garde-fou du rétrécissement se serait retourné contre nous.** Après une
suppression de campagne légitime, toutes les sauvegardes suivantes sont plus
petites — et auraient donc été refusées, **en silence et pour toujours**. Une
suppression voulue est le seul moment où l'application sait que la baisse est
normale : `deleteCampaign` réétalonne donc aussitôt après, avec `baisseAttendue`.
*Un garde-fou qui ne sait pas se rouvrir est une panne à retardement.*

**3. La charge n'était construite qu'à un endroit, et c'était le bon.**
`construireLaSauvegarde()` est extrait de `saveFullSession` et sert aux deux
chemins. Deux constructions auraient donné deux idées de ce qu'est une session —
l'erreur que `donneesDeLaSession.ts` a déjà coûté une fois.
