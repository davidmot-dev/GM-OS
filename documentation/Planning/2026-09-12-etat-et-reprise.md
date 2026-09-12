# État et reprise — 2026-09-12

> **Base saine.** `tsc -b` propre, **4 192 tests verts** (351 fichiers, 1 ignoré), **17 tests E2E verts**, branche
> `feature/tablet-hub-pwa`, arbre propre. **8 commits en avance sur l'origine** — le push
> reste à faire par David, le gestionnaire d'identifiants ouvre une fenêtre que mon shell
> ne sait pas piloter.
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
| **12/09, la donnée gelée** | ⭐ **Une campagne témoin de 8 Ko** sert de décor aux tests E2E, et **le premier test de migration** la fait rencontrer du code neuf (§ 43). Les tests E2E passent de **9 à 17** |

---

## 1 · Par quoi reprendre

### ✅ La garde d'exécution sur le chemin de données — **FAITE le 2026-09-12**

`electron/gardeDuProfil.ts`, branchée en tête de `main.ts` : le profil verrouillé est **écrit au
journal à chaque démarrage**, et l'application **refuse de continuer** si ce n'est pas le vrai profil
alors qu'aucun `--user-data-dir` n'a été passé. L'arrêt n'est pas muet — journal, console **et**
boîte d'erreur.

⭐ **Et la règle s'est révélée avoir deux sens** : une isolation qui retombe sur le **vrai** profil
est refusée elle aussi. `lancerGmOs.ts` vérifiait ça depuis Playwright ; `repetition.mjs` ne le
vérifiait pas du tout. *Un contrôle placé dans l'appelant ne couvre que cet appelant.*

Le piège annoncé ci-dessous était réel et il est tenu : **les tests E2E passent**, donc la garde
laisse bien démarrer les instances isolées. Détail complet au § 42 du registre.

### ✅ 2. Des bases anciennes archivées, pour éprouver les migrations — **FAITE le 2026-09-12**

`e2e/baseAncienne.spec.ts` écrit une charge en `version: 9`, recharge la fenêtre, et vérifie que rien
n'a disparu. `migrate` est traversé pour de vrai — il le dit au journal.

⭐ **Une seule donnée gelée sert les deux besoins** : `e2e/donnees/campagne-temoin.json`. La charge
persistée s'en **dérive** au lieu de vivre dans un second fichier — `partialize` range
`lesDonneesDeLaSession`, qui est exactement ce que `modules.sessionOS` capture. *Une donnée gelée qui
vit à deux endroits en désigne une fausse.*

⭐ Et le principe qui rend ça tenable : **on ne fabrique pas une vieille base, on en gèle une jeune.**

Détail complet au § 43 du registre.

---

## 1 bis · Ce qui reste, maintenant

Les deux gestes du § 1 sont faits. **Ce qui reste ne se code pas — ça se joue** : la catégorie P6 du
registre (routage audio par son, les six widgets Ulanzi ensemble, Voice-to-Light au pont, la bascule
de combat entre deux scènes, la fusion de scènes…).

⚠️ Le socle E2E, lui, est désormais **capable** de porter des tests de geste sur un décor réaliste.
Ce qu'il couvre aujourd'hui : l'aide, le périmètre, les ports, la semence, la migration. Tout le reste
de l'application n'a encore aucun test de bout en bout — *un socle n'est pas une couverture.*

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
