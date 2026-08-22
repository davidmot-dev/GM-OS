# État et reprise — la journée où l'Oracle a cessé de répondre de mémoire

**Nature de ce document : instantané daté.** Vrai le soir du 2026-08-22, faux le lendemain par
construction. À lire pour reprendre, **jamais pour connaître un état** — celui-ci se vérifie dans le code.

**Date :** 2026-08-22, fin de journée
**Branche :** `feature/tablet-hub-pwa` — `30edbbd`, poussée.
**Contrôles, passés ce soir :** `tsc -b` **propre** (la vraie, pas `--noEmit`) · **2 169 tests au vert**
sur 174 fichiers (+217 depuis ce matin) · ESLint **535** contre 536 ce matin.
**Arbre :** pas tout à fait propre — voir § 3.5.
**Documents liés :** `2026-08-19-reconciliation-plans-aout.md`, § 5 (**la liste consolidée des restes, et
le seul endroit où elle vit**) · `2026-08-22-acceleration-ce-qui-reste.md` (**le seul endroit où vit
l'état des axes**) · `2026-08-22-jet-en-pourcentage-et-degres.md`.

**Ce document remplace sa propre version du matin**, qui annonçait un Oracle en état de marche. Il ne
l'était pas, et il ne l'avait jamais été pour une campagne forgée.

---

## 1. Le geste de reprise, et il n'y en a qu'un

> **Rejouer une séance.** Rien d'autre, et avant tout le reste.

La leçon ne faiblit pas : la séance du 21 a payé huit des dix-neuf commits de ces deux jours, et **aucun
des trente-huit d'aujourd'hui n'a été trouvé à la lecture du code**. Les six derniers viennent tous d'une
phrase de David — *« ça ne marche pas »*, puis *« je ne vois rien »*.

Quatre contrôles, et chacun tient un chantier entier :

| # | Le geste | Ce qu'il vérifie |
| --- | --- | --- |
| 1 | Poser à l'Oracle « quelles sont les règles de l'éthylisme ? » | Bandeau vert **« tiré de la fiche »**, réponse instantanée |
| 2 | Poser « peut-on parer avec sa monture ? » | **« Le livre en parle — Monture p.23 »** |
| 3 | Poser « comment gérer la noyade ? » | **« Jugement de table »**, et deux lignes, pas plus |
| 4 | Clore la séance, ouvrir la revue, **fusionner** puis **scinder** | Les cinq gestes de curation |

**Aucun des trois premiers ne se lisait dans le code, et les trois se lisent maintenant dans la console.**
Une ligne `[RAG Service]` nomme le corpus retenu **et sa racine** ; une ligne `[Oracle]` dit combien de
fiches ont répondu et **pourquoi l'étage 1 n'a pas joué**. C'est ce qui manquait toute la journée : la
recherche échouait en silence et l'Oracle répondait quand même, avec aplomb.

**Une réparation de données à faire à la main**, toujours en attente : les combattants nés du défaut
`gmPrompt` — nommés **« Ajouter un Combattant »** — sont encore en base. Ils se renomment ou se retirent
depuis l'écran de combat.

---

## 2. Ce qui a été fait aujourd'hui — trente-huit commits

### 2.1 Le jet en pourcentage et les six degrés (`e8edd30` → `5f5ac10`, `da94e78`)

Les quatre rangs du chantier sont faits. **La cible multiplie** au lieu d'additionner — le pilote
annonçait 15 % là où le livre donne 78. Les deux tables de Rêves de Dragons sont transcrites avec leur
exception, la Forge sait produire une cible, et les six degrés arrivent aux écrans en disant **tous le
même mot** : ils étaient **sept** lecteurs à le rendre, pas six.

*Quatrième fois que le même motif se produit sur le pupitre : le chemin s'arrête avant le moteur.*

### 2.2 Le Cortex tactique est clos (`89e77c0`, `6a441f5`, `4a57cde`, `f6dd855`)

Les cinq axes de `2026-08-07-fiabilite-cortex-combat.md`. Un allié déclaré cessait d'être un allié ; le
rapport avoue désormais ce qu'il ignore (« aucune position connue ») et parle **la langue du jeu**, plus
celle d'un seul.

### 2.3 Les trois modules muets parlent (`0895d64`)

Dés, ambiances, lumières émettent au journal. Et le journal des jets distingue la **trace** de la
**chronique** : seuls les deux extrêmes méritent le récit.

### 2.4 Un corpus se déclare depuis l'écran (`4fd00bd`, `bc8f52f`, `643462c`)

Le SRD 2d20 devient un **socle commun** et Star Trek 2e naît — sans passer par un éditeur de texte.
Dix-neuf fiches, les quatorze sujets couverts.

### 2.5 L'axe O et l'axe E.4 (`3e15844`, `dd8535d`, `141ff11`, `a40f984`)

L'Oracle dit d'où vient sa réponse **et si quelqu'un l'a relue**. Une reforge n'écrase plus une
correction : l'empreinte porte sur le corps seul. Et la Forge **avoue ce qu'elle n'a pas lu**.

### 2.6 L'axe M, ses quatre étages (`c47e69d`, `0325373`, `c1dc888`, `0fb6932`)

Le journal des lacunes, le renvoi au livre, le jugement de table, et la fiche qui répond seule.

### 2.7 Puis la journée a basculé — l'Oracle ne trouvait rien (`1c6e0a1` → `454155d`)

**Trois défauts empilés**, et corriger le premier ne changeait rien de visible. C'est pour ça qu'il a
fallu quatre allers-retours.

1. **Le pilote forgé ne trouvait pas son corpus.** Une campagne forgée porte
   `system: 'custom-<horodatage>'`, et le nom affiché était cherché **dans les gabarits de fiche**.
   `resoudreCorpus` existait depuis le 10/08 et n'était pas appelé.
2. **Un « Chemin des Règles » saisi à la main visait à côté.** La règle 1 prenait le chemin tel quel :
   `reves de dragons` donnait une racine sans `systems/`, et le périmètre se calcule **par préfixe**. La
   règle 2 dépliait déjà `corpusId` de cette façon — *deux champs qui désignent la même chose ne peuvent
   pas se normaliser différemment.*
3. **Le coffre Obsidian remplaçait la racine documentaire à chaque question.** `RAGService` appelait
   `reindex(vaultPath)` avant toute recherche, et `ai:reindex` appelait `setDocsPath`. Tout `docs/`
   sortait de l'index. Le coffre était renseigné **en dur par défaut**, et **un test affirmait ce
   comportement** — *« should trigger reindex with vault path »*, et il passait.

`setDocsPath` a été **supprimé**, le handler n'accepte plus de chemin, le pont non plus.
`electron/racineDuCorpus.test.ts` monte la garde.

### 2.8 Une fiche voisine n'est pas une fiche qui répond (`fa823a1`)

« Comment se calculent les dégâts de chute ? » retenait deux fiches dont aucune ne parle de la chute. Le
meneur repartait sans règle, sans renvoi au livre, **et sans que la Forge apprenne le manque**. Deux
verdicts portaient sur la même chose et se contredisaient : l'étage 1 disait *« aucune fiche ne
couvre »*, l'étage 4 disait *« une fiche a répondu »*.

`ATTEINTES` vaut désormais `fiche | fiche-hors-sujet | document | rien`, **décision de David** : un état
distinct plutôt qu'un repli, parce que « rien du tout » et « des fiches voisines » sont deux manques de
nature différente — et que le second **nomme les fiches à étendre**.

### 2.9 Le verbe au pluriel faisait taire quatre fiches (`a0af76c`)

La liste des mots sans portée connaissait `fonctionne` et pas `fonctionnent`. Le rapprochement étant un
recouvrement **strict**, ce seul mot parasite suffisait.

**Un seul verbe y est entré, et c'est la mesure qui l'a décidé.** Le premier jet ajoutait `résoudre`,
`calculer`, `gérer`, `dérouler` — et « comment se résolvent les jets ? » s'est mise à répondre *Jets
opposés* au lieu de *Résolution des jets*. Ces verbes-là **nomment un sujet** dans un corpus de règles.

### 2.10 Le jugement de table, avec ses deux conditions (`30edbbd`)

Le plan disait *« à défaut d'une fiche **et à défaut du livre** »*. Le code ne tenait aucune des deux : il
tenait un substitut — « aucune source retenue » — **devenu inatteignable dès que le corpus s'est
résolu**, `selectContext` n'ayant aucun seuil de pertinence. *L'étiquette qui « marchait » ne marchait que
parce que le corpus était cassé.*

Trois défauts bloquaient la vraie règle :

- **Quatre dictionnaires de mots vides**, tous différents, tous censés répondre à *« quels mots de cette
  phrase désignent un sujet ? »*. Un seul désormais, `electron/motsDeLaQuestion.ts` — celui de
  `ragSelection` reste à part, il classe des documents au lieu de comprendre une question.
- **La recherche dans le livre comparait des sous-chaînes.** Sur un jeu qui s'appelle *Rêves de Dragons*,
  « le rêve » renvoyait vers **Acrève** et **Blurêve**.
- **« Le livre en parle » n'a jamais rien affiché pour une campagne forgée** : l'écran passait
  `campaign.system`. Cinquième champ qui devait passer par `resoudreCorpus`.

Et **le chemin de streaming oubliait le verdict** — `onSources?.(sources)` tout court, sur le point
d'émission le plus emprunté : ni sources, ni étiquette, ni renvoi ne s'affichaient. Le paramètre est
devenu obligatoire.

### 2.11 Le journal de l'Oracle (`1855d18`, `e00108c`)

Une ligne par question, qui dit ce qui a été retenu et **pourquoi l'étage 1 n'a pas joué**. Elle existe
parce que **cinq causes distinctes produisent le même écran vide**, et qu'il fallait un aller-retour par
question pour les distinguer.

---

## 3. Ce qui reste, par préjudice réel

**La liste consolidée est au § 5 de `2026-08-19-reconciliation-plans-aout.md`, et nulle part ailleurs.**
Ce qui suit dit seulement **ce qui a changé de rang** — *recopier un reste le fait survivre à sa
correction.*

### 3.1 Le seul reste qui fausse une partie en cours

**Le pilote de Rêves de Dragons n'est pas reforgé.** Le code sait multiplier depuis ce matin, les six
degrés arrivent aux écrans — **mais le pilote enregistré porte encore l'ancienne composition**, et il
porte toujours ses **douze composantes numérotées**. Tant qu'il n'est pas repassé à l'atelier ou reforgé,
*rien de tout ça ne se voit à la table.*

C'est un geste d'atelier, pas un chantier de code.

### 3.2 Les axes d'accélération — quatre restent

**Leur état vit dans `2026-08-22-acceleration-ce-qui-reste.md`, et là seulement.** Au soir : E.4 et M sont
faits, restent **G** (pause de séance), **J** (sélecteur de moteur), **F** (brancher le mode), **N** (deux
régimes d'interface). Environ quinze heures.

### 3.3 Le plafond RAG — il se mesure toujours

`MAX_CONTEXT_TOKENS = 4000` (`electron/ragSelection.ts`), soit **deux fiches entières**. La condition du
report est remplie depuis le 21/08 et l'est doublement ce soir : on sait maintenant **ce qui entre
réellement** dans le contexte. *Ça se mesure, ça ne s'intuite pas.*

Et une observation de ce soir à verser au dossier : **la sélection n'a aucun seuil de pertinence.** Tout
fichier du périmètre devient candidat, le budget seul tranche — un index de livre sans rapport avec la
question passe donc avant une fiche, s'il trie mieux. C'est ce qui a rendu `rien` inatteignable.

### 3.4 Le corpus, compté ce soir

**Méthode : fichiers `.md` dans `rules/`, archives `rules-v1/` exclues.** Le compte du matin ne se
reproduit pas avec cette méthode — il comptait autre chose, et il ne disait pas quoi.

| Système | Fiches | |
| --- | --- | --- |
| alien | 25 | |
| blade-runner | 23 | |
| rêves de dragons | 21 | reforgé le 21/08 |
| dune | 20 | 18 archivées |
| 2d20 · star-trek | 19 | **socle commun** · né aujourd'hui |
| cthulhu hack | 18 | |
| srd-yze | 17 | |
| noc | 14 | **aucune n'est commitée** — voir § 3.5 |
| coc7 · dnd-5e | **0** | aucune fiche |

**4 fiches `a_regenerer`** (16 ce matin) · **174 portant `relu: false`** · **`docs/commun/` toujours
reconnu par le moteur et absent du disque**.

### 3.5 L'arbre n'est pas propre

**La reforge de NOC est sur le disque et n'est pas commitée** : **quatorze fiches neuves**, quatre
anciennes supprimées, et un `rules-v1/` non suivi qui porte les quatre archives. Le dossier `rules/` a été
entièrement remplacé, et **git n'en connaît rien**. Elle a été faite pendant la journée et jamais versée. *Un travail sur le disque que
git ignore est un travail qui disparaîtra au prochain nettoyage.*

### 3.6 Deux dettes assumées

- **`lesDerniersEvenements` n'a plus d'appelant** — gardé pour l'avertissement qu'il porte sur le sens de
  la pile.
- **`useOracleContext` ne connaît pas la trame**, et ce n'est pas un oubli : *ajouter un second
  producteur de la même vérité est exactement ce que cette semaine a défait.*

### 3.7 Ce qui n'a toujours jamais été vu tourner

L'aller-retour d'image d'une ambiance · la consigne de langue · la bascule de combat entre deux scènes et
le retour des tokens · la fusion et la scission en conditions de revue réelle.

---

## 4. Ce qui attend une décision de David — aucune n'est du code

1. **L'afficheur Ulanzi : le compte à rebours seul, à la prochaine séance d'Alien ?** Conception rendue,
   rien de code. Une soirée au lieu d'une semaine.
2. **coc7 et dnd-5e** n'ont aucune fiche. C'est du contenu : le carnet, la Forge et ton jugement.
3. **Les 174 fiches `relu: false`.** Elles sont citées à la table exactement comme les fiches relues —
   c'est ce que l'axe O a rendu visible, pas ce qu'il a corrigé.

*L'échec particulier à 86 ou 87 est tranché : **le livre imprime 86**, et les deux tables sont
transcrites telles quelles.*

---

## 5. Ce qu'on ne rouvre pas — décisions des 21 et 22/08

- **La racine documentaire est `APP_ROOT/docs`, et rien ne la déplace.** Le coffre Obsidian reste lisible
  par son propre pont, qui reçoit son chemin en argument.
- **Le jugement de table exige les deux conditions du plan** : aucune fiche ne répond **et** le livre est
  muet. Le livre est ce qui rend la règle sûre — sans lui on apposerait « pas la règle officielle » sur
  une réponse qu'une fiche voisine couvrait peut-être.
- **`fiche-hors-sujet` est un état distinct**, pas un repli sur `document`.
- **Seul `fonctionner` entre dans les mots sans portée**, à ses trois formes. *Retirer un mot qui pouvait
  être le sujet coûte une règle exacte et hors sujet, ce qui est pire que la question sans réponse.*
- **Le don d'objet reste une `trace`** ; **la fiche de PNJ projetée reste de la `chronique`**.
- **Ouvrir une carte ne déplace plus le groupe.**
- **Absorber une scène en cours rouvre la scène fusionnée.**
- **Scinder se décide sur un instant, pas sur une liste d'événements.**
- **Le seuil de densité d'un index vaut cent**, mesuré et non choisi.
- Et tout ce qui a été tranché les jours précédents, au § 4 de `2026-08-20-etat-et-reprise.md`.

---

## 6. Les leçons de la journée

**Un journal qui n'imprime pas le champ dont dépend le résultat innocente à tort.** La ligne
`[RAG Service]` annonçait le bon corpus — *« reves de dragons »* — pendant que la racine était fausse.
Elle a coûté un aller-retour de plus qu'un silence n'en aurait coûté.

**Dégrader à l'identique du code d'origine, sinon la dégradation ne prouve rien.** Le passage aux mots
entiers, dans la recherche du livre : remis en sous-chaîne **à l'identique**, les douze tests passaient
tous — le dictionnaire commun suffisait à les protéger. *Un correctif qu'aucun test ne tient n'est pas un
correctif.* Il a fallu chercher le cas qui discrimine, et c'est *Acrève*.

**Un test peut affirmer le défaut.** *« should trigger reindex with vault path if available »* décrivait
exactement le comportement qui coupait l'Oracle de tout son corpus, et il était vert. Il a changé de sens
plutôt que de disparaître.

**Un paramètre facultatif qu'on doit passer partout est un paramètre qu'on oubliera quelque part.**
Trois points d'émission, deux le passaient. Rendu obligatoire, le compilateur monte la garde.

**Se méfier des fixtures écrites à la main : elles disent ce qu'on a prévu, jamais ce que le corpus
contient.** Les tests décisifs de la journée lisent les 21 fiches réelles. L'une des fixtures témoignait
d'une fiche **sans `sujet:`**, que le moteur ne classe jamais comme une fiche — elle décrivait quelque
chose qui n'existe pas.

**Et le motif de la semaine ne faiblit pas.** Quatre dictionnaires de mots vides, deux verdicts sur la
même question, trois émetteurs dont un amnésique, cinq champs qui devaient passer par `resoudreCorpus` et
n'y passaient pas. *Plusieurs écrivains pour une même vérité* — et à chaque fois, ce n'est pas l'erreur
qui coûte, c'est le silence qui l'accompagne.
