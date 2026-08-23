# Le plafond du RAG — la mesure, enfin

**Nature de ce document : un relevé.** Il ne propose rien qu'il n'ait mesuré, et il dit sa méthode
pour qu'on puisse le contredire. Les chiffres sont du **2026-08-23**, sur le corpus et la machine de
ce jour-là.

**Ce qui attendait.** `MAX_CONTEXT_TOKENS = 4000` est posé dans `electron/ragSelection.ts` depuis le
10/08. Le plan disait *« à réévaluer une fois l'iGPU en place »* ; l'iGPU tourne depuis le 12/08, le
combat a eu lieu le 21, et l'axe C a changé le prix d'un plafond plus haut. La condition était donc
remplie deux fois. **Mais ça se mesure, ça ne s'intuite pas** — c'est ce que le reste disait, et
c'est ce qui est fait ici.

---

## 1. La méthode, en deux sondes

La question se coupe en deux, et les deux moitiés se mesurent séparément.

| Sonde | Ce qu'elle mesure | Où |
| --- | --- | --- |
| `electron/sondePlafondRag.test.ts` | ce qu'un palier **achète** | hors modèle, exact |
| `documentation/Planning/sondes/sonde_cout_du_plafond.py` | ce qu'un palier **coûte** | sur le vrai modèle |

**La première ne demande rien à Ollama, et c'est ce qui la rend exacte.** `selectContext` est pure :
ce qui entre dans le prompt se calcule, il n'y a pas à le deviner ni à l'observer. Elle rejoue des
**questions réelles** — les quatre du protocole de reprise et celles qui ont servi à déboguer la
soirée du 22 — sur cinq systèmes, contre l'index réel : **273 documents, dont 235 fiches**.

> **Elle en porte quatorze depuis le § 6**, dix de règle et quatre de campagne, et ses campagnes sont
> désormais **appariées à leur jeu**. Les tableaux du § 2 et du § 5, eux, sont ceux de la première
> passe — dix questions, appariement approximatif — et **on ne les réécrit pas** : ce sont eux qui ont
> produit le verdict du § 4, et un relevé qu'on retouche après coup ne prouve plus rien. Le § 6.2
> refait l'avant/après proprement, sur les mêmes quatorze.

Elle est **sous interrupteur** (`SONDE=1`) : une sonde n'affirme rien, elle imprime. La laisser
courir avec la suite ajouterait trois lignes vertes qui ne gardent rien, et *un contrôle qui ne
contrôle rien est pire qu'un contrôle absent, parce qu'il se compte.*

```
SONDE=1 npx vitest run --project electron electron/sondePlafondRag.test.ts --reporter=verbose
python documentation/Planning/sondes/sonde_cout_du_plafond.py
```

---

## 2. Ce qu'un palier achète

Le score dit la pertinence : `100` tout rond, c'est le rang de base d'une fiche du système actif —
**pas un seul mot de la question dans son sujet, son titre ni son corps**. Au-dessus de 100, un mot
au moins a été trouvé.

Cumul sur les dix questions de la première passe :

| budget | fiches **pertinentes** | fiches muettes | hors-fiches | sauts de file | éjections |
| ---: | ---: | ---: | ---: | ---: | ---: |
| **4 000** | 18 | 2 | 11 | 13 | 0 |
| 6 000 | 28 | 4 | 11 | 12 | 2 |
| **8 000** | 37 | 8 | 9 | 10 | 3 |
| 10 000 | 43 | 14 | 10 | 10 | 4 |
| 12 000 | 50 | 20 | 9 | 10 | 4 |

**Le genou est à 8 000, et il est net.** De 4 000 à 8 000, la pertinence double — 18 fiches à 37 —
pendant que le bruit passe de 2 à 8. Après 8 000, chaque fiche pertinente gagnée coûte une fiche
muette : +6 contre +6 au palier suivant, +7 contre +6 au dernier. *Le plafond cesse d'acheter de la
règle et se met à acheter du remplissage.*

### La taille des fiches explique le palier

| Système | fiches | médiane | max | tiennent à 4 000 / 8 000 |
| --- | ---: | ---: | ---: | :---: |
| 2d20 | 19 | 1 418 | 3 390 | 3 / 5 |
| alien | 24 | 1 450 | 3 052 | 3 / 5 |
| blade-runner | 23 | 1 456 | 3 273 | 3 / 5 |
| cthulhu hack | 18 | 1 459 | 2 610 | 2 / 5 |
| dune | 20 | 1 456 | 2 739 | 2 / 5 |
| noc | 18 | 1 446 | 3 636 | 2 / 5 |
| rêves de dragons | 22 | 1 434 | 3 598 | 2 / 5 |
| srd-yze | 17 | 1 448 | 4 106 | 2 / 5 |
| star-trek | 19 | 1 441 | 2 852 | 2 / 5 |

Une fiche v3 fait **~1 450 tokens**, remarquablement stable d'un système à l'autre — le gabarit fait
son travail. **4 000 tokens, ce sont donc deux fiches**, et le reste part en miettes. Le constat du
22/08 est confirmé au chiffre près.

Et les index font exception : `inventaire-des-mecaniques.md` pèse **3 755 tokens chez rêves de
dragons**, soit 94 % du budget à lui seul. Quand il est retenu, il ne reste de la place pour
personne.

---

## 3. Ce qu'un palier coûte

`gemma4:12b`, **100 % GPU**, `n_ctx 16384` — la configuration réelle, vérifiée à `ollama ps` pendant
la mesure. Invite salée à chaque appel.

| palier | invite traitée | prefill | débit | TOTAL | surcoût |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 55 tok | 0,8 s | — | *(chargement du modèle)* | |
| **4 000** | 3 850 tok | 35,2 s | 109 tok/s | **38,3 s** | référence |
| 6 000 | 5 608 tok | 55,3 s | 102 tok/s | 61,8 s | **+23,5 s** |
| **8 000** | 7 510 tok | 81,9 s | 92 tok/s | **89,3 s** | **+51,0 s** |
| 10 000 | 9 446 tok | 110,2 s | 86 tok/s | 124,2 s | +85,9 s |
| 12 000 | 11 411 tok | 130,1 s | 88 tok/s | 143,3 s | +105,0 s |

**Seconde passe, à froid** : 4 000 → 40,9 s ; 8 000 → 76,9 s. L'écart 4 000 → 8 000 vaut donc
**entre +36 et +51 secondes**, et le débit de prefill tient entre 106 et 115 tok/s. Les deux passes
concordent : ce n'est pas un accident de mesure.

### Le coût se paie en entier, à chaque question

**Le bloc RAG vit dans le prompt système.** `AIService.prepareSystemPrompt` rend
`persona + consignes + « CONTEXTE RÉCUPÉRÉ » + fullContext`, et `fullContext` change à chaque
question. Le cache de préfixe d'Ollama ne couvre donc que la persona et les consignes — quelques
centaines de tokens. **Tout le reste est re-préfillé, à chaque fois.**

Ce que la seconde passe a montré par accident, et qui vaut d'être noté : rejouer le **même** palier
avec le **même** sel dans la même exécution rend **722 puis 1 331 tok/s** au lieu de 110. Le cache
est bien là, il est énorme, et il ne sert à rien ici parce que rien ne se répète. *C'est le piège du
2026-08-11 à l'identique — la sonde sale désormais chaque appel, pas chaque exécution.*

---

## 4. Le verdict

> **Le plafond reste à 4 000.**

Monter à 8 000 ferait passer une question de règle de **38 à 89 secondes**. À la table, ce n'est pas
une réponse plus complète : c'est une réponse qu'on n'attend pas. *Le plafond n'est pas un réglage
de qualité, c'est un réglage de temps d'attente* — et personne ne l'avait formulé ainsi parce que
personne ne l'avait mesuré.

**Ce reste est donc clos, et il ne se rouvre qu'à une condition mesurable** : un prefill notablement
plus rapide. À 300 tok/s, 8 000 tokens coûteraient 27 s au lieu de 82, et la question se reposerait.
Tant que le débit tient autour de 110 tok/s, elle ne se repose pas.

---

## 5. Ce que la mesure a trouvé d'autre, et qui vaut plus que le plafond

Le plafond n'était pas le vrai sujet. **Trois défauts habitent les 4 000 tokens qu'on paie déjà**, et
les corriger ne coûte pas une seconde de plus au modèle — ça change *lesquels* des 4 000 tokens on
envoie, pas combien.

### 5.1 Le budget tranche sur la TAILLE, pas sur la pertinence

**13 des 31 documents retenus à 4 000 — 42 % — ont un score inférieur à celui d'un document écarté
faute de place.** La boucle est gloutonne et ordonnée par score : quand une fiche à 1 450 tokens ne
tient plus dans le reste du budget, elle est écartée, **et la boucle continue** — un petit document
moins bien classé se glisse derrière elle.

L'exemple qui le montre le mieux, question *« comment se résolvent les jets ? »* sur rêves de
dragons :

| budget | ce qui entre |
| ---: | --- |
| 4 000 | `jets-opposes` **[112]**, `resolution-des-jets` **[112]**, *et une fiche de PNJ de scénario* **[63]** |
| 8 000 | … enfin `degres-de-reussite-et-critiques` **[103]** |

La troisième place va à un document de campagne à 63 pendant qu'une fiche de règle à 103 attend le
palier suivant. **Elle n'a pas perdu sur sa pertinence : elle a perdu sur son poids.**

### 5.2 Un tiers du budget part hors des fiches

**11 des 31 documents retenus à 4 000 ne sont pas des fiches** — notes de campagne, décharges brutes,
index de livre. Sur des questions de **règle**. Le rang les classe pourtant en dessous (60 contre
100) ; c'est le § 5.1 qui les fait passer.

### 5.3 À égalité de score, c'est le nom de fichier qui décide

Le bonus est grossier : **+12** pour un mot trouvé dans le sujet ou le titre, **+3** pour un mot
trouvé dans le corps. Passé la fiche qui porte le mot dans son titre, tout le reste s'agglutine à
**103** — un mot mentionné quelque part — et le départage se fait *à l'ordre alphabétique du chemin*.

Sur *« comment se résolvent les jets ? »*, trois fiches à 103 : `composition-de-la-fiche-de-
personnage`, `degats-et-types-de-degats`, `degres-de-reussite-et-critiques`. Elles entrent dans cet
ordre-là. Le commentaire du code affirme que *« le sujet dit de quoi le document traite, le corps dit
seulement ce qu'il mentionne »* — c'est vrai du saut 12 contre 3, et **faux dès qu'aucun titre ne
répond** : il n'y a plus alors aucune façon de distinguer la fiche qui traite du sujet de celle qui
l'effleure.

### 5.4 Et le plafond n'est pas monotone

**Monter de 4 000 à 6 000 ÉJECTE deux documents** qui étaient retenus à 4 000 ; 4 éjections au total
à 12 000. Conséquence de la boucle gloutonne : un budget plus large fait entrer une grosse fiche plus
tôt, qui décale tout ce qui suit. *Un plafond plus haut peut retirer une fiche — personne ne s'y
attend, et rien ne le dit.*

---

## 6. Ce que la correction a donné — le même jour

Les trois défauts du § 5 sont corrigés, **et la mesure en a découvert deux autres en chemin, plus
graves que ceux qu'elle cherchait.**

### 6.0 Le défaut qu'on ne cherchait pas : les accents

**Le mot cherché était déplié, le corps ne l'était pas.** `motsDeRecherche` passe la question par
`slug`, qui retire les accents — « résolvent » devient `resolvent`. Le corps, lui, n'était que passé
en minuscules, et `corps.includes('resolvent')` ne trouvait **jamais** « résolvent ».

Mesuré sur le corpus réel : `degres-de-reussite-et-critiques.md` emploie **« réussite »
vingt-trois fois**, et le moteur en voyait **zéro**. Le mot est invisible dans **treize des
vingt-et-une fiches** de Rêves de Dragons.

*Deux textes qu'on compare doivent être normalisés pareil* — c'est mot pour mot le défaut du 22/08,
*« deux champs qui désignent la même chose ne peuvent pas se normaliser différemment »*, à un autre
étage. **Et c'était la cause du § 5.3** : les corps ne correspondaient presque jamais, donc les
scores s'agglutinaient et l'ordre alphabétique tranchait.

Second défaut du même geste : **la comparaison portait sur des sous-chaînes**, donc `jets`
répondait vrai pour « objets » et « projets ». *Exactement ce que la recherche dans le livre a payé
le 22/08, où « le rêve » renvoyait vers Acrève.* Le texte se découpe désormais en mots.

### 6.1 Les cinq correctifs

| # | Ce qui change | Défaut visé |
| --- | --- | --- |
| 1 | Le corps est déplié comme l'en-tête | § 6.0 |
| 2 | Les mots se comparent **entiers**, plus en sous-chaîne | § 6.0 |
| 3 | Un document **sans un seul mot** de la question n'est plus candidat | § 5.2 |
| 4 | Un moins bon **ne double plus** un meilleur refusé faute de place | § 5.1 |
| 5 | Les **occurrences** comptent, plafonnées à trois | § 5.3 |

**Le garde du 4 porte sur le SCORE, pas sur le rang de provenance, et la mesure l'a tranché.** Un
premier jet comparait les rangs : sur *« quelles sont les scènes prévues et les menaces ? »*, un
index système mangeait le budget, la fiche suivante était refusée, et le rang 100 ainsi posé
**verrouillait toutes les fiches de campagne** — qui étaient pourtant la réponse. *Un document de
campagne à 84 vaut mieux qu'une fiche à 60 : c'est le score qui dit lequel répond, pas le dossier
d'où il vient.*

Conséquence assumée : **le budget peut rester partiellement inemployé.** Si le meilleur candidat
restant ne tient pas, remplir la place avec du moins bon est précisément ce qu'on cherche à
empêcher.

### 6.2 Ce que ça change, mesuré sur les mêmes quatorze questions

Dix questions de règle et quatre de campagne — *le premier jet appariait « Le secret de Milo », une
campagne Cthulhu Hack, à des questions de Rêves de Dragons ; une fixture mal appariée mesure
quelque chose, mais pas ce qu'on croit.*

| | fiches **pertinentes** | fiches muettes | hors-fiches | sauts de file |
| --- | ---: | ---: | ---: | ---: |
| **à 4 000, avant** | 23 | 4 | 16 | 18 |
| **à 4 000, après** | **25** | **0** | **2** | **0** |

**Quarante-trois documents partaient, vingt-sept partent.** Et il en part *plus* de pertinents
qu'avant : le déaccentuage en a fait apparaître deux que le moteur ne voyait pas. Le reste était du
bruit — dont dix-huit documents qui doublaient un mieux classé, et quatre fiches sans un mot commun
avec la question.

**Le coût : 8,4 ms par question contre 2,2** — le corps de chaque document est déplié à chaque
question, sur un index de 8,7 Mio. *Face à 35 000 ms de prefill, c'est deux centièmes de pour cent.*
Il n'y a pas de cache à ajouter, et en ajouter un serait une optimisation qui ne se mesure pas.

### 6.3 Vérifié par dégradation, à l'identique du code d'origine

*Un correctif qu'aucun test ne tient n'est pas un correctif.* Les cinq ont été remis dans leur état
défectueux, un par un :

| Dégradation | Tests qui tombent |
| --- | ---: |
| seuil de pertinence retiré | 2 |
| garde de score retirée | 1 |
| corps ré-accentué | 1 |
| occurrences non comptées | 1 |
| mots cherchés en sous-chaîne | 1 |

**Deux d'entre eux ne tenaient à rien au premier passage.** La fixture des occurrences nommait le
bon document `a-en-traite.md` : il gagnait déjà par l'ordre alphabétique, sans compter une seule
occurrence. *Une fixture qui donne raison au correctif pour une autre raison que le correctif ne
prouve rien.* Renommée en `z-en-traite.md`, elle tombe.

Un test existant a dû changer de fixture — *« ne laisse pas la question renverser l'écart entre
rangs »* opposait une décharge à une fiche qui ne portait **aucun** mot de la question : cette fiche
n'est plus candidate, et le test accusait un renversement de rang qui n'avait pas eu lieu.
L'invariant, lui, n'a pas bougé.

---

## 7. Ce qui attend une décision de David — une seule, et ce n'est pas le plafond

**L'écart entre les rangs est hors d'atteinte de la pertinence, et c'est écrit dans le code comme un
principe** : `RANG.fiche` vaut 100, `RANG.campagne` 60, et le commentaire dit que *« l'écart entre
deux rangs excède le bonus de pertinence maximal »* — 27 au mieux.

Conséquence, encore visible après les cinq correctifs, sur *« quelles sont les scènes prévues et
les menaces ? »* en campagne Alien :

```
4 000 : 1 doc — inventaire-des-mecaniques.md [103]
```

Un index de mécaniques de 3 069 tokens, qui mentionne un mot de la question, **rafle tout le budget
d'une question de campagne** ; les fiches `scenes-prevues--*` de Hadley Hope, à 84, n'entrent qu'à
partir de 6 000.

Le principe a été posé pour que *« une fiche du corpus passe devant une décharge brute du même
système, quelle que soit la question »* — et il a raison sur les questions de règle. Il n'avait pas
prévu les questions de campagne. **Trois sorties possibles, et c'est un choix de comportement, pas
un correctif** :

1. **Rapprocher les rangs** pour que la pertinence puisse les renverser.
2. **Traiter les gros index à part**, comme les décharges le sont déjà par `MAX_RAW_FILE_TOKENS`.
3. **Ne rien changer** et accepter que les notes de campagne passent après les règles.

*Le plafond, lui, est tranché : il reste à 4 000, et la mesure est là pour qu'on n'y revienne pas
sans chiffre.*
