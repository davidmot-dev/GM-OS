# Le penchant du cortex — un réglage mesuré, pas choisi

**Nature de ce document : un relevé.** Les chiffres sont du **2026-08-23**, sur le corpus de ce
jour-là, mesurés par `electron/sondePlafondRag.test.ts` (sous `SONDE=1`).

**L'idée est de David**, le 2026-08-23 : *« Est-ce qu'on ne pourrait pas moduler en fonction du
cortex qui est utilisé — le Sage privilégie les règles, le Scribe par exemple privilégierait la
campagne ? »*

---

## 1. Le problème qu'il résout

`RANG.fiche` vaut **100**, `RANG.campagne` vaut **60**, et le commentaire des rangs pose en principe
que *« l'écart entre deux rangs excède le bonus de pertinence maximal »* — 27 au mieux.

**Conséquence : une note de campagne ne peut jamais doubler une fiche de règles.** Jamais, quelle que
soit la question. Sur *« quelles sont les scènes prévues et les menaces ? »* en campagne Alien, à
4 000 tokens :

```
1 doc — inventaire-des-mecaniques.md [103]
```

Un index de mécaniques de 3 069 tokens rafle tout le budget d'une question de **campagne**, et les
fiches `scenes-prevues--*` de Hadley Hope, à 84, n'entrent qu'à partir de 6 000.

Le principe a raison sur les questions de règle. **Il n'avait pas prévu les questions de campagne** —
et le classement par défaut est donc déjà un penchant « règles » : il n'avait simplement pas de nom.

---

## 2. Pourquoi le cortex est le bon endroit pour trancher

Trois sorties étaient sur la table — rapprocher les rangs, traiter les gros index à part, ou ne rien
changer. La proposition de David en ouvre une quatrième, meilleure que les trois :

- **Les cortex sont déjà des rôles nommés.** Le Sage est *« expert en règles et mécaniques »*, le
  Scribe *« chroniqueur de vos aventures »*. Le penchant ne fabrique pas une distinction : il rend
  agissante celle qui existe.
- **Le meneur en choisit un, explicitement, et rien ne bascule tout seul.** C'est exactement la forme
  qu'a prise l'axe J pour le choix du moteur par Forge.
- **Un réglage global aurait eu tort la moitié du temps.** Le même corpus sert les deux sortes de
  questions ; c'est le demandeur qui les distingue, pas le corpus.

---

## 3. La mesure, et ce qu'elle a tranché

Quatorze questions réelles — dix de règle, quatre de campagne, campagnes appariées à leur jeu. Le
juge est le **premier document retenu** : c'est celui qui pèse le plus, et le seul qui tienne
toujours dans 4 000 tokens.

| nature | penchant | 1er doc = **fiche** | 1er doc = **campagne** |
| --- | --- | ---: | ---: |
| règle | *(absent)* | 10 / 10 | 0 |
| règle | `regles` | 10 / 10 | 0 |
| règle | **`campagne` (+40)** | **9 / 10** | 1 |
| règle | ~~`campagne` (+55)~~ | **5 / 10** | 5 |
| campagne | *(absent)* | 4 | **0 / 4** |
| campagne | `regles` | 4 | **0 / 4** |
| campagne | **`campagne` (+40)** | 0 | **4 / 4** |
| campagne | ~~`campagne` (+55)~~ | 0 | 4 / 4 |

### 3.1 Le déplacement vaut 40, et c'est la mesure qui l'a dit

L'écart entre les deux rangs vaut exactement 40. **Le combler met la campagne à parité**, et c'est
alors le bonus de pertinence qui tranche — comme il le fait déjà entre deux fiches.

**Un troisième palier a été écrit et essayé** : +55, qui fait passer la campagne *devant* les fiches.
Il ne gagne **rien** — les quatre questions de campagne basculent déjà à parité — et il fait tomber
**cinq questions de règle sur dix**. *Un réglage qui ne gagne rien et casse la moitié de l'autre sens
n'est pas un réglage, c'est un dégât.* Il a été retiré.

**Il n'y a donc que deux valeurs**, et `campagne` veut dire *parité*, pas *priorité*.

### 3.2 La seule question de règle qui bascule n'est pas une régression

À +40, une question de règle sur dix change de premier document :

```
« comment se déroule un interrogatoire ? »   (blade-runner / Anges de feu)
  penché règles    : systems/blade-runner/rules/jets-opposes-aide-et-cooperation.md [109]
  penché campagne  : campaigns/anges-de-feu/fiches/scenes-prevues--the-investigation.md [115]
```

La scène **The Investigation** de la campagne contre la fiche générique des jets opposés. Sur une
question posée au Scribe, c'est la bonne réponse. Sur la même question posée au Sage, on obtient
l'autre. **C'est le mécanisme qui fonctionne, pas un dégât** — et c'est précisément ce que David
demandait.

### 3.3 Le cas qui a motivé le chantier

```
alien — « quelles sont les scènes prévues et les menaces ? »   (4 000 tokens)

  (absent)   : inventaire-des-mecaniques.md [103]
  regles     : inventaire-des-mecaniques.md [103]
  campagne   : scenes-prevues--demarrer-l-action.md [124], scenes-prevues--epilogue.md [124],
               scenes-prevues--evenements.md [124], scenes-prevues--la-fuite.md [124],
               scenes-prevues--la-situation.md [124]
```

Un document contre cinq, et les cinq répondent à la question.

---

## 4. Le découpage livré — décision de David

| Cortex | Penchant | Pourquoi |
| --- | --- | --- |
| Le Sage | `regles` | *« Expert en règles et mécaniques de jeu »* — sa définition même |
| Le Stratège | `regles` | Tactique et combat : des règles, et des règles exactes |
| **L'Alchimiste** | `regles` | **Choix de David, et c'est le cas limite** — voir ci-dessous |
| Le Scribe | `campagne` | Chroniqueur : ce qu'il raconte vit dans les notes |
| L'Oracle | `campagne` | Narration et improvisation |
| Le Barde | `campagne` | Le lore est du contenu, pas une règle |
| L'Acteur | `campagne` | Incarner un PNJ demande de savoir qui il est |
| Le Cartographe | `campagne` | Les lieux de la campagne |

**L'Alchimiste tire des deux côtés** : butin et potions sortent de tables de règles, les PNJ vivent
dans la campagne. Il est posé sur `regles` parce que David l'a dit. *S'il rend des PNJ plats, c'est
le premier à basculer* — et `campagne` signifiant parité, la bascule ne lui coûterait rien sur le
butin : la question déciderait.

**Un cortex écrit par le meneur n'hérite d'aucun penchant.** Absent vaut le classement d'avant : *on
ne prête pas une intention à qui n'en a pas déclaré.*

---

## 5. Ce qu'il a fallu poser pour que ça vive

- **Un écran**, dans les réglages du cortex. Le découpage livré est un point de départ, pas un
  verdict — *une chose qui existe, fonctionne et n'a pas d'écran n'existe pas pour qui s'en sert.*
- **Un rattrapage à la synchronisation**, qui **remplit** le penchant absent et ne **remplace jamais**
  celui que le meneur a choisi. Sans lui, le réglage n'aurait rien fait tant que les huit cortex
  n'auraient pas été repris un par un ; avec un rattrapage qui écrase, le choix du meneur lui aurait
  été repris au démarrage suivant, sans un mot. *C'est la règle d'`enrichirLePilote`.*
- **Une étiquette dans le panneau**, à chaque réponse, qui dit de quel côté on a penché. **Sans elle,
  la même question donnerait deux réponses selon le cortex, sans cause visible**, et le meneur
  conclurait que son corpus a changé. C'est la classe de défaut que cette semaine a payée cinq fois.
- Elle se lit sur **`ragService.dernierPenchant`**, pas sur `gem.penchant` : le premier dit ce qui a
  servi, le second ce qu'on a demandé — et les deux diffèrent en mode allégé, où la recherche n'a pas
  lieu. *Afficher l'intention à la place de l'effet est ce qui a innocenté à tort la ligne du corpus
  le 22/08.*

---

## 6. Vérifié par dégradation, à l'identique

*Un correctif qu'aucun test ne tient n'est pas un correctif.*

| Dégradation | Tests qui tombent |
| --- | ---: |
| le penchant n'est plus appliqué | 1 |
| le penchant déplace **tous** les rangs, pas seulement la campagne | 2 |
| `campagne` passe devant au lieu d'égaliser (+55) | 1 |
| le rattrapage **écrase** le choix du meneur | 1 |
| le cortex ne penche plus la recherche | 2 |
| un cortex sans penchant en reçoit un quand même | 1 |

**Le cinquième ne tenait à rien au premier passage** : `AIService` est le seul maillon qui fasse se
rencontrer le sélecteur et le magasin, et le retirer laissait la suite entièrement verte pendant que
la fonctionnalité était morte. *C'est exactement le genre de silence que la dégradation existe pour
trouver.*
