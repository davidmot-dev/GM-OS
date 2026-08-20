# État et reprise — le plan du 08/08 est clos, sauf une étape

**Nature de ce document : instantané daté.** Vrai le soir du 2026-08-20, faux le lendemain par
construction. À lire pour reprendre, **jamais pour connaître un état** — celui-ci se vérifie dans le code.

**Date :** 2026-08-20, soirée
**Branche :** `feature/tablet-hub-pwa` — **poussée**, `671d6dc`. Arbre propre.
**Contrôles :** `tsc -b` propre (la vraie, pas `--noEmit`), **1 801 tests** au vert (+103 sur les 1 698 de
ce matin), ESLint 534 contre 530.
**Documents liés :** `2026-08-20-les-trois-etapes-restantes.md` (la procédure, tenue à jour) ·
`2026-08-08-trame-narrative-cycle-seance.md` (le plan de référence) ·
`2026-08-19-reconciliation-plans-aout.md`, § 5 (la liste consolidée des restes).

---

## 1. Le geste de reprise, et il n'y en a qu'un

> **Jouer une séance.** Rien d'autre, et avant tout le reste.

Dix-huit commits aujourd'hui, dont **la moitié n'a jamais été vue tourner**. C'est la seule leçon que ces
quatre jours ont répétée sans jamais faiblir : *un module que personne ne regarde tourner accumule des
défauts qu'aucune revue de code ne trouve.* Les onze défauts trouvés depuis le 17/08 l'ont tous été en
jouant ou en relisant une partie jouée — **aucun** à la lecture du code.

Cinq gestes, dans cet ordre. Chacun vérifie une chose écrite aujourd'hui :

| # | Le geste | Ce qu'il vérifie |
| --- | --- | --- |
| 1 | Lancer un combat **sans scène ouverte** | La scène improvisée naît, et porte **le nom de la carte** — pas « Combat improvisé » |
| 2 | Cliquer « scène improvisée » dans le panneau de trame | Elle existe **avant** qu'on ait tapé quoi que ce soit |
| 3 | Ouvrir cette scène | Elle connaît déjà **le lieu, les PJ présents, les PNJ en piste** |
| 4 | Déclencher l'ambiance d'une scène **prévue** | Cette scène passe « en cours » toute seule |
| 5 | Clore la séance, ouvrir **la revue** | Les scènes marquées y sont, **avec leurs événements dedans** |

**Le cinquième vaut plus que les quatre autres réunis** : il vérifie d'un coup l'étape 4, le rattachement
automatique et la curation — trois chantiers d'aujourd'hui, sur le seul chemin où ils se rencontrent.

Trois gestes de plus, si la séance s'y prête :

- **Tuer un PJ.** Le décès doit s'écrire **à l'instant de la chute**, pas au bouton d'export, et porter le
  type `PJ`.
- **Barrer une scène jouée** depuis la trame — le bouton « terminer » existe depuis aujourd'hui pour une
  scène **en pause**, ce qui était impossible auparavant.
- **Poser une question à l'Oracle après trois heures de jeu** : la réponse doit porter sur la dernière
  heure. Ce contrôle-là ne se voit qu'après une longue séance.

*Si quelque chose cloche, on corrige avant d'avancer* — un correctif non confirmé qu'on empile est un
correctif qu'on ne saura plus isoler.

---

## 2. Ce qui reste à faire

### 2.1 L'étape 10 — la seule du plan du 08/08 encore ouverte

**La trame dans le contexte de l'Oracle et du Cortex.** Aujourd'hui `getLiveSessionContext` envoie la
campagne, les PJ, les PNJ vivants, les indices révélés et dix événements — **aucune scène, aucun acte,
aucun enjeu**. Le § 7 du plan veut *« scène en cours : l'embuscade de l'entrepôt — les PJ cherchent le
manifeste, le garde est corrompu »* : **un bien meilleur ancrage pour bien moins de jetons**, ce qui
compte double avec le plafond RAG à 4 000 (`electron/ragSelection.ts:39`).

La procédure détaillée est au § 4 de `2026-08-20-les-trois-etapes-restantes.md`. Deux points à ne pas
perdre :

- **La matière existe déjà** : `leRecitCureDuJournal` rend le récit curé, dans l'ordre de l'histoire.
- **Deux scènes ouvertes est le cas normal**, pas une anomalie — les envoyer toutes les deux, nommées.
  Le groupe séparé est précisément le moment où le meneur consulte l'Oracle.

**Faire l'étape 4 tourner d'abord.** L'étape 10 consomme ce que l'étape 4 produit ; l'écrire sur une trame
que personne n'a marquée reviendrait à remplacer dix lignes par rien.

### 2.2 Les deux gestes de curation non livrés

Le § 4.1 en liste cinq ; trois sont faits — nommer, compléter le résumé, jeter. **Fusionner** deux scènes
qui n'en faisaient qu'une et **scinder** celle qui en cachait deux restent à écrire. Ce sont des
opérations sur le modèle de la trame plus que sur la revue, et `clonerLaScene` porte déjà la moitié de la
seconde.

*Le § 3.2 s'appuie sur la seconde* : « un marquage manqué est réparable » suppose qu'on puisse scinder.

### 2.3 Deux défauts adjacents, trouvés ce matin et jamais traités

**Ils vivent ici, et nulle part ailleurs.**

- **`SessionOSModuleSchema` donne `.default([])`** à `timelineEvents`, `wikiEntries` et `atlasMaps`
  (`src/types/schemas.ts`). Relire une sauvegarde qui ne les porte pas **les remplace par du vide**,
  puisque `distributeData` fait un `setState`. C'est pourquoi `sessions`, `entities` et `clues` ont été
  déclarés **sans** défaut ce matin : un champ absent laisse le store tranquille, un défaut à vide
  l'écrase.
- **`validateSession` répond `FullSessionSchema.parse({})`** sur échec (`src/types/schemas.ts:93`) : le
  chargement ne charge alors **rien**, et l'écran annonce « Session chargée et vérifiée 📂 ». *Le geste
  qui rassure n'est pas le geste qui vérifie* — troisième occurrence de la journée.

### 2.4 Trois classements d'émetteurs à trancher, et trois modules muets

Sortis de la revue des 36 émetteurs, non tranchés parce qu'ils appellent un jugement de meneur :

- **Donner un objet à un joueur** est une `trace`, alors que **révéler un indice** est de la `chronique`.
- **Projeter la fiche d'un PNJ** est de la `chronique`, alors que **projeter un média** est une `trace`.
- **« Navigation : X »** écrit *« Le groupe se déplace vers X »* sur un simple clic dans l'atlas.

Et **trois modules ne consignent rien du tout** : les dés (ils ont leur propre registre, `diceRolls`), les
ambiances, les lumières — alors que la musique, geste identique, émet en `AUDIO`.

### 2.5 Le reste, ailleurs

**La liste consolidée est au § 5 de `2026-08-19-reconciliation-plans-aout.md`**, et nulle part ailleurs :
le Cortex (P3, axes 2 à 5), le corpus (P4), le plafond RAG à mesurer une fois l'iGPU vu tourner en combat.
*Recopier un reste le fait survivre à sa correction.*

Un détail de dette : **ESLint passe de 530 à 534**, quatre `any` des deux nouvelles signatures
`(set: any, get: any)` de `SessionManager` — la convention de tout le fichier. À reprendre le jour où ce
fichier sera typé, pas avant.

---

## 3. Ce qui a été fait aujourd'hui

Dix-huit commits, `310d7a3` → `671d6dc`. **Le plan du 08/08 est clos sauf son étape 10.**

| Étape du § 8 | |
| --- | --- |
| 1 · `summarizeSession` hors Gemini | ✅ 17/08 |
| 2 · Décès universel et automatique | ✅ **aujourd'hui** |
| 3 · Rattachement automatique | ✅ **aujourd'hui**, posé au goulot |
| 4 · Capture en un clic | ✅ **aujourd'hui** |
| 5 · Axe `trace` / `chronique` | ✅ 18/08 |
| 6 · Revue scène par scène | ✅ **aujourd'hui** (fusionner / scinder restent) |
| 7 · Résumé sur l'ensemble curé | ✅ **aujourd'hui** |
| 8 · Résumé enrichi + ouverture de combat | ✅ **aujourd'hui** |
| 9 · Trame générée par la Forge | ✅ **déjà faite** depuis le 15-16/08, découvert aujourd'hui |
| 10 · Trame dans l'Oracle | ❌ **la seule qui reste** |

S'y ajoutent, hors plan : le reste **P1** (les PNJ, les indices et l'historique des séances n'étaient dans
aucune sauvegarde), la **clôture de campagne** qui n'existait pas, et **onze défauts** dont cinq trouvés à
la revue des émetteurs.

---

## 4. Ce qu'on ne rouvre pas — décisions de David du 2026-08-20

- **Un type d'événement `PJ`.** La mort d'un PJ ne se range plus sous « personnage non joueur ».
- **La Galerie garde l'étiquette manuelle.** Le journal raconte la chute (zéro PV suffit) ; la Galerie
  n'inscrit `dead` que sur l'étiquette du meneur — un PNJ à zéro peut n'être qu'assommé.
- **Une scène prévue jamais jouée devient *annulée* à la clôture de la campagne**, et pas avant. La trame
  est un **plan glissant tant que la campagne vit, un registre une fois close.**
- **Une scène jouée sans avoir été terminée devient *terminée***, pas annulée.
- **La pause reste la pause** — terminer demeure une décision, et elle a désormais son bouton.
- **L'ouverture de combat est de nature `trace`**, comme l'initiative et les impacts.

Et tout ce qui a été tranché les jours précédents, au § 4 de
`2026-08-19-etat-et-reprise-quatre-defauts.md`.

---

## 5. Les deux leçons de la journée

**La première porte sur le motif.** Les quatre premiers défauts corrigés aujourd'hui sont **le même
défaut** : trois listes de ce qu'est une session, deux portes vers une scène dont une seule fait entrer
les PJ, un onzième lecteur dissident du module de santé, une garde d'idempotence qui aurait fini chez ses
appelants. À chaque fois, **plusieurs écrivains ayant chacun leur idée de la même chose** — et à chaque
fois, invisible à la lecture.

*Le remède n'est jamais d'ajouter le champ manquant aux listes fautives : c'est de n'en avoir qu'une.*

**La seconde est plus désagréable, parce qu'elle porte sur ma propre vérification.** J'ai écrit qu'il
restait une décision à prendre sur l'étape 9. Elle était faite depuis cinq jours. J'avais vérifié que la
Forge de chronique était *retirée*, et j'en ai déduit que ses idées restaient *à faire* — en lisant le
plan, pas le code. Un commentaire périmé, qui citait au présent un défaut corrigé, m'a confirmé dans
l'erreur.

> **Vérifier qu'une chose a disparu n'est pas vérifier que son travail n'a pas été fait.**

C'est la règle 3 de la réconciliation — *un statut se vérifie avant d'être écrit* — enfreinte dans un
document qui la cite en conclusion.

**Et un troisième défaut sans symptôme**, du même genre que le `tsc --noEmit` d'hier : `slice(-10)` sur un
journal qui empile en tête envoyait à l'Oracle **les dix plus anciens** événements, sous un intitulé
annonçant la fin. Ni erreur, ni vide, ni incohérence — une réponse plausible, simplement fondée sur ce qui
ne se joue plus. *Les défauts les plus longs à trouver sont ceux qui ne se plaignent de rien.*
