# Les trois étapes restantes du plan de trame — procédure d'exécution

**Nature de ce document : référence vivante.** À tenir à jour jusqu'à ce que les trois étapes soient
closes, puis à reclasser en récit clos.

**Date :** 2026-08-20
**Périmètre :** les étapes **4**, **9** et **10** du § 8 de `2026-08-08-trame-narrative-cycle-seance.md`,
seules ouvertes après la journée du 20/08.
**Méthode :** chaque état ci-dessous a été **lu dans le code aujourd'hui**, jamais recopié d'un document.
Les fichiers et les lignes sont cités pour qu'on puisse en douter.

**À quoi sert ce document.** Le plan du 08/08 dit *quoi* et *pourquoi*. Celui-ci dit **dans quel ordre,
par quel geste, et comment savoir que c'est fait** — en séance, pas en relisant du code. C'est la seule
leçon que les trois derniers jours ont répétée sans faiblir : *un module que personne ne regarde tourner
accumule des défauts qu'aucune revue de code ne trouve.*

---

## 0. Ce que la vérification a trouvé en chemin

**Un défaut actif, et il fausse l'Oracle à chaque séance.**

`AIService.getLiveSessionContext` compose la section « Historique Récent » ainsi
(`src/modules/ai/AIService.ts:1354-1356`) :

```ts
const lastEvents = (journalStore.journals.find(…)?.events || [])
  .slice(-10)
```

Or le journal **empile le plus récent en tête** — `events: [newEvent, ...j.events]`
(`src/modules/journal/useJournalStore.ts:300`). `slice(-10)` prend donc **les dix plus ANCIENS**.

**L'Oracle reçoit le début de la séance en croyant recevoir la fin.** Trois heures de jeu plus tard, il
répond sur les dix premières minutes, sous un intitulé qui affirme le contraire. C'est le même défaut de
famille que « `tsc --noEmit` sortait en 0 sans rien vérifier » : *le geste qui rassure n'est pas le geste
qui vérifie.*

Correctif : `.slice(0, 10)`, puis inverser pour rendre l'ordre chronologique au modèle. **Une ligne, et
elle ne dépend d'aucune des trois étapes** — à faire avant elles, comme les étapes 1 et 2 du plan
d'origine étaient des corrections à traiter indépendamment.

---

## 1. L'ordre, et le motif de chaque rang

| Rang | Quoi | Pourquoi ici |
| --- | --- | --- |
| **A** | La correction du § 0 | Une ligne, un défaut actif, aucune dépendance. On ne construit pas sur un contexte faux. |
| **B** | **Étape 9** — trancher le sort de la Forge Chronique | Ce n'est pas une tâche, c'est une **décision de David**. Cinq minutes, et elle retire ou requalifie un point de la liste. |
| **C** | **Étape 4** — la capture en un clic | Elle **produit la matière** dont vivent la curation (faite) et l'étape 10. Sans elle, peu de scènes sont marquées, et les deux autres travaillent sur du vide. |
| **D** | **Étape 10** — la trame dans l'Oracle | Elle **consomme** ce que C produit. La faire avant, c'est injecter une trame que personne n'a marquée. |

*Le rang de C avant D est le seul qui ne se discute pas* : l'étape 10 remplace dix événements bruts par
« scène en cours : *l'embuscade de l'entrepôt* ». Si aucune scène n'est ouverte parce que le marquage
coûte trop cher, elle remplace dix lignes par rien.

---

## 2. Étape 9 — la Forge Chronique : trancher, pas coder

### Ce qui est vrai aujourd'hui, vérifié

**La Forge de chronique a été retirée le 2026-08-17, et le retrait est complet.** Il n'en reste que des
mentions dans des commentaires — `src/modules/forge/carnetNotebookLM.ts:7` et le bandeau de
`src/types/trame.types.ts:7`. Le `chronicleSlice` qui subsiste **ne la concerne pas** : il gère le wiki et
la chronologie de campagne (`src/modules/session/store/chronicleSlice.ts:3`).

**L'étape 9 est donc sans objet en l'état.** Elle dit *« `ChronicleForgeResult` gagne des actes »* d'un
objet qui n'existe plus.

### La décision à prendre

Le § 6 du plan portait quatre idées, et **trois survivent au retrait de la Forge**. La question n'est pas
« garde-t-on l'étape 9 », c'est **où vont ses trois idées survivantes** :

| Idée du § 6 | Elle survit ? | Où elle irait |
| --- | --- | --- |
| 6.1 — la Forge génère actes et scènes | ⛔ sans objet | — |
| **6.2 — générer en passes**, en donnant au modèle la liste des noms déjà créés | ✅ | **La Forge de campagne**, qui génère déjà PNJ, lieux et indices — et qui a été éprouvée en réel le 16/08 |
| **6.3 — ne plus jeter en silence** ce qui ne se résout pas (`crossDomainHelpers.ts`, `.filter(r => r.targetId)`) | ✅ **et c'est le plus utile** | Correctif isolé, profite rétroactivement à toutes les relations déjà importées |
| **6.4 — reforger n'écrase pas les retouches** | ✅ | La Forge de campagne, mode enrichissement |

> **6.3 mérite d'être sorti du lot.** Ce n'est pas une fonctionnalité, c'est une **perte de données
> silencieuse** de la même famille que le reste P1 du 16/08 : ce qui ne se résout pas est écarté sans un
> mot. La Forge de campagne du 16/08 a signalé six renvois sur ~150 — mais elle les a *signalés* ; ici on
> parle du chemin qui ne signale rien.

### Le geste

1. **David tranche** : l'étape 9 est *abandonnée en tant que telle*, et ses trois idées survivantes
   deviennent des points de la Forge de campagne. Ou bien elle est réécrite. **Il n'y a pas de troisième
   possibilité : la laisser en l'état est ce qu'on a déjà fait pendant trois jours.**
2. Quel que soit le choix, **le § 6 du plan du 08/08 reçoit un bandeau** disant lequel — *un plan qui dit
   faux coûte plus qu'un plan absent*, et c'est exactement le reproche déjà fait à `roadmap-v6.md`.

### Comment savoir que c'est fait

Rien à vérifier en séance : c'est de la documentation. Le contrôle est qu'**aucun document ne dise plus
qu'une Forge de chronique va générer la trame**.

---

## 3. Étape 4 — la capture en un clic

### Ce qui est vrai aujourd'hui, vérifié

Le § 3.1 demande **deux marquages gratuits** et le § 3 demande **un clic sans frappe**. Voici l'état des
trois promesses, une par une.

| Promesse | État | Vérifié où |
| --- | --- | --- |
| Démarrer un combat sans scène active **crée une scène improvisée** | ✅ **fait** | `useCombatStore.ts:92` (`rattacherLeCombatQuiDemarre`) → `creerSceneImprovisee` |
| Déclencher un moment de storyboard lié à une scène **marque la scène** | ❌ **pas fait** | `momentDeStoryboardId` n'est jamais qu'**lu** : `PanneauDeTrameEnCours.tsx:180` l'affiche, `TrameDashboard.tsx:417` l'édite. Rien n'ouvre la scène quand le moment part |
| Une scène improvisée se crée **en un clic, sans rien taper**, et **capture l'état** | ❌ **pas fait, deux fois** | `PanneauDeTrameEnCours.tsx:135-138` exige un **titre saisi** (`titreImprovise`) ; et `trameSlice.ts:261` ne capture **rien** — ni lieu, ni PNJ, ni PJ, ni ambiance |

**Le deuxième point est le plus coûteux, et le plan le disait d'avance** : *« tout ce qui demande de la
frappe pendant que les joueurs attendent ne sera pas fait »*. Le bouton existe, il demande de taper, donc
il ne sera pas utilisé — et la trame ne se remplira pas.

### Le geste, dans cet ordre

1. **Rendre le clic muet.** Le bouton crée la scène immédiatement, avec un titre par défaut daté ou tiré
   du lieu actif. Le champ de saisie reste, mais **après** : on nomme une scène qui existe déjà, ou on la
   nomme à la revue de fin de séance — laquelle sait maintenant éditer le titre sur place.
2. **Capturer l'état à la création.** `creerSceneImprovisee` relève, **par référence et jamais par
   contenu** (§ 3, « le précédent et le piège ») : `lieuId` depuis la carte active, `entiteIds` depuis les
   PNJ en piste, `personnagesIds` depuis les PJ présents, `momentDeStoryboardId` depuis le moment en
   cours.
3. **Brancher le second marquage.** Déclencher un moment de storyboard ouvre la scène qui le déclare —
   `activeMomentId` est déjà là, dans le même panneau (`PanneauDeTrameEnCours.tsx:40`). Deux gardes : ne
   rien faire si la scène est déjà ouverte, et **ne pas fermer** celle qui l'est — le groupe séparé reste
   le cas normal.

> **Le risque est connu et accepté** (§ 3.2) : un changement de scène sera oublié. Les deux amortisseurs
> existent désormais tous les deux — le marquage gratuit, et **la revue de fin de séance**, qui est faite
> depuis aujourd'hui.

### Comment savoir que c'est fait — en séance

1. Lancer un combat sans scène ouverte : une scène improvisée doit naître **et porter le nom de la carte
   ou du lieu**, pas « Combat improvisé ».
2. Cliquer « scène improvisée » dans le panneau de trame : elle doit exister **avant** qu'on ait tapé
   quoi que ce soit.
3. Ouvrir la scène ainsi créée : elle doit déjà connaître **le lieu, les PJ présents et les PNJ en
   piste**.
4. Déclencher l'ambiance d'une scène prévue : cette scène doit passer « en cours » toute seule.
5. Terminer la séance et ouvrir la revue : les scènes marquées doivent y être, **avec leurs événements
   dedans** — c'est le rattachement automatique posé ce matin qui s'en charge.

---

## 4. Étape 10 — la trame dans le contexte de l'Oracle

### Ce qui est vrai aujourd'hui, vérifié

`getLiveSessionContext` (`AIService.ts:1320-1385`) envoie quatre sections : la campagne et son synopsis,
les PJ, les PNJ vivants, les indices révélés, et **« Historique Récent » — dix événements bruts, titre et
contenu, horodatés à la seconde**.

**Aucune scène. Aucun acte. Aucun enjeu.** Le § 7 le disait déjà le 08/08, et c'est toujours vrai mot pour
mot. S'y ajoute le défaut du § 0 : ces dix événements sont les dix plus anciens.

Le second chemin de contexte, `useOracleContext.ts`, ne connaît pas davantage la trame.

### Le geste

1. **Faire la correction du § 0 d'abord.** Envoyer la trame *et* garder un historique à l'envers ne
   ferait que déplacer le mensonge.
2. **Remplacer les dix événements par la scène en cours** : son titre, son résumé, l'acte dont elle
   relève, les PJ qu'elle déclare présents. Le § 7 chiffre le bénéfice — *« un bien meilleur ancrage pour
   bien moins de tokens »* —, et il compte double : le plafond RAG est à 4 000 jetons
   (`electron/ragSelection.ts:39`).
3. **Ne pas jeter l'historique, le réduire.** Une poignée d'événements **de nature `chronique`**, pas dix
   bruts. La matière existe : c'est exactement ce que la curation sait déjà distinguer, et
   `leRecitCureDuJournal` sait déjà la produire dans l'ordre de l'histoire.
4. **Deux scènes ouvertes est le cas normal**, pas une anomalie : les envoyer toutes les deux, nommées.
   Le groupe séparé est précisément le moment où le meneur consulte l'Oracle.
5. **Le Cortex tactique en profite pour quelques dizaines de jetons** (§ 7) — c'était sa pièce manquante,
   là où le corpus de règles était à la fois trop gros et hors sujet. À faire dans la foulée, sans rouvrir
   le plan du Cortex, dont le propre document interdit de le traiter avant les axes B et C du plan
   d'accélération.

### Comment savoir que c'est fait — en séance

1. Ouvrir une scène, poser une question à l'Oracle : **il doit nommer la scène** ou son enjeu sans qu'on
   le lui ait dit.
2. Jouer trois heures, puis demander « où en est-on ? » : la réponse doit porter sur **la dernière
   heure**, pas la première. *C'est le contrôle du défaut du § 0, et il ne se voit qu'après une longue
   séance.*
3. Séparer le groupe, ouvrir deux scènes, interroger l'Oracle : **les deux** doivent apparaître.
4. Mesurer la taille de l'invite avant et après. Le § 7 promet un gain ; **ça se mesure, ça ne s'intuite
   pas** — c'est la règle déjà posée pour le plafond RAG le 19/08.

---

## 5. Ce que ce document ne porte pas

**Les restes hors de ces trois étapes vivent ailleurs, et n'y sont pas recopiés** — c'est la règle 2 du
§ 7 de `2026-08-19-reconciliation-plans-aout.md` : *recopier un reste le fait survivre à sa correction.*

- La liste consolidée : `2026-08-19-reconciliation-plans-aout.md`, § 5.
- Les deux trouvailles adjacentes du 20/08 — le `.default([])` du schéma de session qui vide au
  chargement, et `validateSession` qui ne charge rien en annonçant « Session chargée et vérifiée » — sont
  consignées dans la mémoire du module Journal.
- Les deux gestes de curation non livrés — **fusionner** deux scènes, **scinder** celle qui en cachait
  deux — appartiennent au modèle de la trame plus qu'à la revue. `clonerLaScene` porte déjà la moitié de
  la seconde.

---

## 6. Trois questions du § 10 du plan d'origine

Deux sont tranchées, une reste.

- ✅ **Le décès d'un PJ mérite-t-il un type distinct ?** Oui — type `PJ`, décision de David du 2026-08-20.
- 🟠 **L'émission sémantique s'étend-elle tout de suite aux autres modules ?** Répondue de fait par la
  revue des 36 émetteurs : elle s'étend **au fil de l'eau**, et la revue a dit où. Trois modules ne
  consignent toujours rien — les dés (qui ont leur propre registre), les ambiances et les lumières.
- ❌ **Que devient une scène prévue jamais jouée ?** *Toujours ouverte, et l'étape 4 la rend urgente* :
  plus on marque de scènes improvisées, plus il y aura de scènes prévues jamais jouées à trier. **La
  réponse détermine si la trame est un plan glissant ou un registre.**
