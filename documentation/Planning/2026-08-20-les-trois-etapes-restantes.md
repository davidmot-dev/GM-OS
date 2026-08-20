# Les étapes restantes du plan de trame — procédure d'exécution

**Nature de ce document : référence vivante.** À tenir à jour jusqu'à ce que les étapes soient closes,
puis à reclasser en récit clos.

**Date :** 2026-08-20
**Périmètre :** les étapes **4**, ~~9~~ et **10** du § 8 de `2026-08-08-trame-narrative-cycle-seance.md`.
La 9 s'est révélée **déjà faite** à la vérification ; la correction du § 0 et l'étape 4 sont posées le
même jour. **Il ne reste que l'étape 10** — et à voir l'étape 4 tourner en séance.
**Méthode :** chaque état ci-dessous a été **lu dans le code aujourd'hui**, jamais recopié d'un document.
Les fichiers et les lignes sont cités pour qu'on puisse en douter.

**À quoi sert ce document.** Le plan du 08/08 dit *quoi* et *pourquoi*. Celui-ci dit **dans quel ordre,
par quel geste, et comment savoir que c'est fait** — en séance, pas en relisant du code. C'est la seule
leçon que les trois derniers jours ont répétée sans faiblir : *un module que personne ne regarde tourner
accumule des défauts qu'aucune revue de code ne trouve.*

---

## 0. ~~Ce que la vérification a trouvé en chemin~~ ✅ corrigé le 2026-08-20 (`5a64ec2`)

**Un défaut actif, et il faussait l'Oracle à chaque séance.**

`AIService.getLiveSessionContext` composait la section « Historique Récent » avec `.slice(-10)` sur
`journal.events`. Or le journal **empile le plus récent en tête** — `events: [newEvent, ...j.events]` :
il envoyait donc **les dix plus ANCIENS**. L'Oracle recevait le début de la séance sous un intitulé qui
annonce la fin, et trois heures de jeu plus tard il répondait sur les dix premières minutes.

**Rien ne pouvait le signaler** : ni erreur, ni vide, ni incohérence visible — une réponse plausible,
simplement fondée sur ce qui ne se joue plus.

**Corrigé, et le sens de la pile n'est plus su qu'à un endroit** (`lesDerniersEvenements`). Les sept
autres `slice(-N)` du dépôt ont été vérifiés un par un : ils empilent tous à la fin, donc ils désignent
bien les derniers. Le rendu est chronologique — *une chronologie à l'envers n'est pas un détail de
présentation : un modèle à qui on la donne en tire des causes fausses.*

**Le rang A de l'ordre ci-dessous est donc franchi.** L'étape 10 peut se construire sur un contexte qui
ne ment plus.

---

## 1. L'ordre, et le motif de chaque rang

| Rang | Quoi | Pourquoi ici |
| --- | --- | --- |
| **A** | La correction du § 0 | Une ligne, un défaut actif, aucune dépendance. On ne construit pas sur un contexte faux. |
| ~~**B**~~ | ~~**Étape 9** — trancher le sort de la Forge Chronique~~ | ✅ **Sans objet** : elle était déjà faite par la Forge de campagne. Voir le § 2. |
| ~~**C**~~ | ~~**Étape 4** — la capture en un clic~~ | ✅ **faite le 2026-08-20**. Reste à la voir tourner en séance — voir le § 3. |
| **D** | **Étape 10** — la trame dans l'Oracle | Elle **consomme** ce que C produit. La faire avant, c'est injecter une trame que personne n'a marquée. |

*Le rang de C avant D est le seul qui ne se discute pas* : l'étape 10 remplace dix événements bruts par
« scène en cours : *l'embuscade de l'entrepôt* ». Si aucune scène n'est ouverte parce que le marquage
coûte trop cher, elle remplace dix lignes par rien.

---

## 2. ~~Étape 9 — la Forge Chronique~~ ✅ close le 2026-08-20 : elle était déjà faite

**Ce § 2 disait faux, et il est réécrit.** Sa version d'origine annonçait qu'il restait une décision à
prendre — *« où vont les trois idées survivantes du § 6 »*. Vérification faite dans le code : **elles y
sont déjà, toutes les quatre**, depuis le 15-16 août.

| Idée du § 6 | Où elle vit |
| --- | --- |
| 6.1 — actes et scènes générés | `ecritureDeLaCampagne.ts:291-306` et `:481` écrivent actes **et** scènes |
| 6.2 — générer en passes, résoudre sur les noms créés | l'annuaire `parNom`, avec rapprochement approximatif |
| 6.3 — ne plus jeter en silence | `nonResolus` et `approximatifs` remontent **à l'écran**, `ForgeDeLaTrame.tsx:427-461` |
| 6.4 — reforger n'écrase pas les retouches | *« REFORGER N'ÉCRASE RIEN »*, en tête du même fichier |

Et le `.filter(r => r.targetId)` que j'annonçais comme une perte de données vivante **n'existe plus** :
`crossDomainHelpers.ts` fait 178 lignes et ne le porte pas. C'est un **commentaire périmé** de
`ecritureDeLaCampagne.ts`, qui le citait encore par son ancien numéro de ligne, qui me l'a fait croire
vivant. Le commentaire est corrigé.

La preuve était par ailleurs dans les données : la Forge de campagne du 16/08 a signalé **6 renvois sur
~150** sur « Le secret de Milo ». C'est le § 6.3 en train de fonctionner.

> **La leçon, et elle est désagréable parce qu'elle porte sur ce document même.** J'avais vérifié que la
> Forge de chronique était retirée. Je n'ai **pas** vérifié si ses idées avaient été reprises ailleurs :
> je les ai déclarées « survivantes » en lisant le plan, pas le code. C'est exactement la règle 3 de la
> réconciliation — *un statut se vérifie avant d'être écrit* — enfreinte dans un document qui la cite.
>
> *Vérifier qu'une chose a disparu n'est pas vérifier que son travail n'a pas été fait.*

**Ce qui restait n'était donc pas une décision mais un bandeau**, posé le même jour sur le § 6 et sur la
ligne 9 du § 8 du plan du 2026-08-08. Les sections y sont conservées telles quelles : elles restent le
récit de ce qui a été trouvé, et c'est leur valeur — elles ne disent simplement plus ce qu'il reste à
faire.

**Il ne reste donc que deux étapes ouvertes : la 4 et la 10.**

---

## 3. ~~Étape 4 — la capture en un clic~~ ✅ faite le 2026-08-20 (`78c60f2`)

Une promesse sur trois était tenue. Les trois le sont.

| Promesse (§ 3 et § 3.1) | Avant | Maintenant |
| --- | --- | --- |
| Un combat sans scène active crée une scène improvisée | ✅ | ✅ et elle capture aussi |
| **Un clic, sans rien taper** | ❌ le bouton ouvrait un champ de titre | ✅ la scène naît sous le nom du lieu ; on la nomme à la revue |
| **Elle capture l'état** | ❌ `creerSceneImprovisee` ne relevait rien | ✅ lieu, PNJ en piste, PJ présents, ambiance — **quatre identifiants, jamais de contenus** |
| **L'ambiance marque la scène** | ❌ `momentDeStoryboardId` n'était que lu | ✅ une seule candidate ou rien, jamais une scène close |

**La carte projetée l'emporte sur la carte sélectionnée** — c'est *« la carte active »* du § 3 : ce que
les joueurs ont sous les yeux, pas ce que le meneur a ouvert dans son atlas.

**Rien ne peut échouer** : magasin absent, piste vide, trame en mauvais état — la capture rend moins de
choses et le clic marche quand même. *Une capture partielle vaut infiniment mieux qu'un clic qui ne fait
rien.*

### Ce qu'il reste à voir tourner — en séance

C'est le seul contrôle qui vaille, et il n'a pas encore été fait :

1. Lancer un combat sans scène ouverte : la scène improvisée doit porter **le nom de la carte**.
2. Cliquer « scène improvisée » : elle doit exister **avant** d'avoir tapé quoi que ce soit.
3. L'ouvrir : elle doit déjà connaître **le lieu, les PJ présents et les PNJ en piste**.
4. Déclencher l'ambiance d'une scène prévue : cette scène doit passer « en cours » toute seule.
5. Clore la séance, ouvrir la revue : les scènes marquées doivent y être, **avec leurs événements
   dedans**.

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
- ✅ **Que devient une scène prévue jamais jouée ?** **Tranchée par David le 2026-08-20 : elle devient
  *annulée* quand la campagne se termine, et pas avant.** La trame est donc un **plan glissant tant que la
  campagne vit, et un registre une fois qu'elle est close**. Une scène jouée sans avoir été terminée
  devient *terminée*, pas annulée — la distinction survit à l'archivage, portée par le nombre de passages
  et par aucun second champ. Livré le même jour (`6709876`), avec le statut de campagne qui manquait
  (`Campaign.clotureeLe`) et deux défauts d'affichage qui l'accompagnaient : on ne pouvait pas terminer
  une scène **en pause** depuis la trame — le bouton la rouvrait —, et l'écran de préparation de séance
  n'affichait **aucun** état de jeu, si bien qu'on pouvait préparer une séance autour d'une scène déjà
  finie.

**Les trois questions du § 10 sont donc closes.**
