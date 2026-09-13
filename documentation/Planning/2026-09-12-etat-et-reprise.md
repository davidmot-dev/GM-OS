# État et reprise — 2026-09-12

> ⛔ **PÉRIMÉ — ce document s'arrête à la mi-journée du 12.** La suite (les quatre constats,
> l'écran bloqué, les boutons de l'Ulanzi, le Master Storyboard, le matériel de table, la lumière
> du storyboard) vit dans [`2026-09-13-etat-et-reprise.md`](./2026-09-13-etat-et-reprise.md).
>
> ⚠️ Ses chiffres ont vieilli : **4 230 tests et 23 E2E** y sont annoncés, il y en a désormais
> **4 394 et 164**. *Un instantané daté ne se corrige pas, il se remplace — mais il doit dire où.*

> **Base saine.** `tsc -b` propre, **4 230 tests verts** (353 fichiers, 1 ignoré), **23 tests E2E verts**, branche
> `feature/tablet-hub-pwa`, **arbre propre, tout est poussé**.
>
> ⚠️ **Correction du 12/09** : ce document disait que le push devait revenir à David parce que
> « le gestionnaire d'identifiants ouvre une fenêtre que mon shell ne sait pas piloter ».
> **C'est faux.** Les identifiants sont en cache et le push part tout seul ; ce qu'on avait pris
> pour un blocage, c'est le **hook de pre-push** qui lance toute la validation en silence
> pendant trois minutes.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md), et elle y vit seule.
> Ce document-ci ne dit que **par quoi reprendre** et **ce qu'il ne faut pas repayer**.

---

## Ce que ces deux journées ont produit

| Journée | Ce qui est entré |
| --- | --- |
| **11/09, la revue** | Revue de code complète, **cinq lots de correction** livrés — dont le repli de la barre de vie qui ne pouvait jamais se déclencher, et `delete-doc` qui pouvait vider `docs/` |
| **11/09, le pont** | ⭐ **Le canal libre est fermé** : `on/off/send/invoke` ont quitté le TYPE du pont, et `tsc` est devenu l'inventaire exhaustif des appelants — **il en a trouvé trois que `grep` avait manqués** |
| **11/09, les clés** | Le processus principal détient les clés ; **l'écran ne porte plus que leur présence**. Chaque clé est appariée à son hôte (`verdictDeLHote`), et posée selon le fournisseur (`poserLaCle`) |
| **11/09, l'incident** | ⛔ **Le profil de données a basculé sur `gm-os-v6`** — un singleton exporté appelait `app.getPath` à l'import, 1 643 lignes avant `app.name`. David a trouvé « The Eternal Quest » à la place de ses sept campagnes. **Rien n'était perdu**, et la sauvegarde automatique a fait son **premier sauvetage réel** : « tout fonctionne » |
| **11/09, l'aide** | **Ctrl+H ouvre le manuel dans GM-OS** — 52 guides, 456 Ko, avec son propre moteur de recherche en plus de l'universel |
| **11/09, les essais** | **Socle Playwright** (`e2e/lancerGmOs.ts`) : profil jetable par worker, refus de démarrer sans isolation vérifiée · **les deux ports deviennent réglables** · **le périmètre d'une instance** (corpus, coffre Obsidian, appareils muets) |
| **12/09, la répétition** | ⭐ **`npm run repetition`** — GM-OS avec les vraies données, et rien à perdre |
| **12/09, la garde** | ⭐ **Le profil de données est vérifié à l'exécution** — nommé au journal à chaque démarrage, et l'application refuse de continuer s'il n'est pas le bon (§ 42 du registre) |
| **12/09, Light-OS** | ⛔ **La reconnexion au pont bouclait sans fin** — un effet qui avait `status` en dépendance *et* l'écrivait. Trouvé par David **en déplacement**, pont resté à la maison. Plafond, recul, **abandon annoncé** (§ 44). Éprouvé par lui : *« le correctif light-os fonctionne »* |
| **12/09, la trame au journal** | ⭐ **Ouvrir une scène ne laissait aucune trace** — donc la scène n'entrait pas dans la revue de séance, et le filet du plan du 08/08 (*scinder ce qu'on a oublié de marquer*) était absent là où il devait servir. Ouverture et fermeture consignées, avec le décor (§ 45) |
| **12/09, la doc** | ⭐ **`02-GM-OS-en-bref.md`** — le but de l'application, son vocabulaire, et chaque module en deux phrases. La liste des modules a été **déplacée** depuis `01-Prise-en-main`, pas recopiée |
| **12/09, NotebookLM** | ⭐ **Un carnet « GM-OS » porte les 53 guides**, et un hook post-commit y renvoie ceux qui changent — *une source NotebookLM est une copie figée* |
| **12/09, les hooks** | ⛔ **Le hook de pre-push vivait hors du dépôt depuis toujours.** Les deux sont versionnés dans `scripts/hooks/`, lus par `core.hooksPath` posé par `npm install` |
| **12/09, la donnée gelée** | ⭐ **Une campagne témoin de 8 Ko** sert de décor aux tests E2E, et **le premier test de migration** la fait rencontrer du code neuf (§ 43). Les tests E2E passent de **9 à 17** |

---

## 1 · Par quoi reprendre

### ⭐ Le journal de séance n'est dans aucune sauvegarde

**C'est le geste que je recommande en premier**, et il n'était pas connu ce matin.

Le détail — ce qu'on a vu, comment le revoir, et la décision à prendre avant d'écrire — vit au
**§ 1 bis du registre**, [« Constaté, pas encore traité »](./2026-08-23-chantiers-gares.md).
*Il n'est pas recopié ici : ce document-ci est un instantané daté, il vieillira ; le registre, lui,
est vivant.*

### 2. Ce qui reste ne se code pas — la catégorie P6

Les deux gestes du § 1 d'hier sont clos (§§ 42 et 43 du registre). Ce qui reste **se joue** : le
routage audio par son, les six widgets Ulanzi ensemble, Voice-to-Light au pont, la bascule de combat
entre deux scènes.

⚠️ **Et la fusion de scènes est passée de « jamais essayée » à « essayée, et elle a coûté ».** Le
geste marchait ; ce qui manquait, c'est qu'une scène ouverte ne laissait **aucune trace au journal**,
donc n'entrait pas dans la revue. Corrigé (§ 45), et **à éprouver en vraie soirée** : que la revue
montre les scènes traversées, et que fusionner emmène bien leurs événements.

### 3. Un point resté sans explication

L'écran bloqué au démarrage du 12/09 n'a jamais été élucidé — la boucle Light-OS était réelle et est
corrigée, mais le lien n'est pas établi. Les deux questions qui trancheraient si ça revient sont au
**§ 1 bis du registre**, avec le reste.

---

## 2 · `npm run repetition` — comment s'en servir

```
npm run build && npm run repetition
```

Ouvre GM-OS sur un profil **jetable**, semé depuis la dernière sauvegarde automatique :
profil neuf, **tes vraies campagnes**, appareils muets, ports 4200/4201, profil **supprimé à
la fermeture**. On peut ouvrir une campagne, cliquer partout, casser ce qu'on veut.

Un fichier de sauvegarde précis se passe en argument : `npm run repetition -- <chemin.json>`.

**Isolé** : la base, le stockage local, le coffre des clés, les médias, les sauvegardes, le
corpus de règles, le coffre Obsidian, les lampes, l'afficheur, les deux ports.

⚠️ **Pas isolé, et il faut le savoir** : une tablette déjà appairée pourrait joindre cette
instance si elle cherche son port. *L'inventaire vaut pour ce qui a été cherché.*

⚠️ **Ce que la répétition ne couvre pas** — les deux trous sont réels :

1. **Ce qu'un changement fait au VRAI profil au démarrage suivant.** `--user-data-dir` impose
   le chemin de données : la répétition **court-circuite exactement le mécanisme qui a cassé
   le 11/09**. Elle aurait été verte pendant que le profil basculait sur `gm-os-v6`.
   ✅ *Ce trou-là est désormais surveillé par la garde du § 1 — elle regarde le résultat, pas
   l’environnement.* Ce qui reste dehors, ce sont les autres effets d’un changement au démarrage.
2. **Les migrations** — ✅ couvertes depuis le 12/09, voir § 1.2.

---

## 3 · La question du staging — tranchée

> *« Est-ce qu'il serait intéressant de travailler sur un environnement de staging ? »*

**Non, pas de copie permanente de Staging / UAT.**

Un staging permanent **dérive** : six semaines plus tard il a d'autres réglages, d'autres clés,
d'autres campagnes, un autre corpus — et il donne une confiance qu'il ne mérite pas. Un staging
classique existe parce que la production est *partagée et irréversible* ; ici la production est
un profil sur une machine, et le filet est la sauvegarde automatique, éprouvée le 11/09.

Ce qui fait le travail d'un UAT, c'est `npm run repetition` : il repart de la sauvegarde du
jour, donc **il ne peut pas dériver** — il n'existe que le temps de la répétition.

⭐ **La distinction qui tranche : ce qui vaut d'être gardé n'est pas un environnement, c'est de
la donnée gelée.** Un environnement vieillit ; une base figée, non.

Les deux trous nommés au § 2 ne sont **pas** bouchés par un staging permanent non plus — il
serait à jour, comme la production. Ils se bouchent par les deux gestes du § 1.

---

## 4 · Ce qu'il ne faut pas repayer

⛔ **Un effet ne se rejoue pas sur ce qu'il écrit.** `useHueAutoConnect` avait `status` en dépendance
*et* l'écrivait : boucle infinie dès que le pont ne répondait plus. Et **retirer la dépendance ne
suffisait pas** — une seule chaîne de rappels l'aurait reconstituée. La terminaison vit maintenant
dans une politique séparée et testée.

⛔ **Un défaut qui ne se déclenche qu'ailleurs ne se voit jamais au bureau.** Celui-là a demandé un
déplacement, pont resté à la maison.

⛔ **Compter des longueurs n'est pas vérifier une forme.** Le témoin gelé a porté trois champs
inventés (`closeLe` au lieu de `termineeLe`, un `passages` de fantaisie, `creeeLe` absent) sous
douze tests verts — parce que les assertions disaient « il y a trois scènes », jamais « ce sont des
scènes ». Le remède : une **affectation typée sans `as`**, et l'état jugé par la fonction que
l'application emploie.

⛔ **Une sonde qui ne charge pas la page rend un verdict quand même.** Mes reproductions du mode dev
visaient `localhost:5173` et tombaient sur `chrome-error://chromewebdata` — le piège IPv6 que
`main.ts` contourne pour lui-même. J'en ai tiré « le mode dev est cassé », qui était faux.

⛔ **Un contrôle invisible est un contrôle qu'on croit avoir.** Le hook de pre-push vivait hors du
dépôt depuis toujours. Les hooks sont désormais versionnés dans `scripts/hooks/`, lus par
`core.hooksPath` — **pas copiés** : deux copies finissent par diverger, et on ne sait plus laquelle
s'exécute.

⚠️ **Une liste qui vit à deux endroits en désigne une fausse** — appliqué deux fois aujourd'hui :
la liste des modules a été *déplacée* de `01-Prise-en-main` vers `02-GM-OS-en-bref`, et les quatre
conditions de la fusion ne sont écrites que dans le guide du journal.

⛔ **Une garde qui refuse tout ressemble beaucoup à une garde qui marche.** La semence exigeait
une base *vide* ; une base neuve ne l'est jamais, elle porte `INITIAL_DATA`. La garde refusait
donc **toujours**, et rien ne l'en distinguait — jusqu'à ce qu'un test lui présente le cas
qu'elle doit **laisser passer**.

⛔ **Un échec muet coûte plus que le défaut lui-même.** Le journal de la première répétition ne
portait que la lecture de la semence, pas un mot de l'écran. Trois hypothèses fausses avant de
simplement **rendre la console visible** (`ELECTRON_ENABLE_LOGGING=1`).

⛔ **`node:fs` n'existe pas dans le projet de tests `renderer`.** Un test qui lit des sources y
passe par `import.meta.glob` avec la requête `?raw` — voir `clesEmployees.test.ts`.

⛔ **Une liste recopiée ne vieillit pas avec sa source.** Le `Set` des campagnes de démonstration
vivait en dur dans `SessionBackupManager` ; le critère est maintenant **dérivé de
`INITIAL_DATA`**, dans `sessionMocks.ts`, et partagé par la sauvegarde automatique et la semence.

⚠️ **« GM-OS tourne-t-il ? » ne couvre pas le démarrage suivant.** Le 11/09 la question avait
été posée, la réponse était « non », et les campagnes ont quand même disparu de l'écran.
