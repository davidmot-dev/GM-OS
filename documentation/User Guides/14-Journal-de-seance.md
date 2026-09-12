# 📓 Le Journal de séance

Le **Journal** enregistre ce qui se passe pendant que vous jouez, puis vous aide à en tirer un
compte rendu. Il ne demande presque rien : les modules de GM-OS y écrivent d'eux-mêmes.

---

## 1. Ce qui s'écrit tout seul

Trente-six endroits de GM-OS consignent au journal. Chaque ligne porte **un type** — son sujet — et
**une nature** — ce qu'elle vaut.

| Type | Ce qu'il couvre |
| :--- | :--- |
| `COMBAT` | Tours, dégâts, états. |
| `NPC` | Ce qui arrive à un personnage non joueur. |
| `PJ` | Ce qui arrive à un personnage **joueur**. |
| `LOCATION` | Le groupe se rend quelque part. |
| `AUDIO` | Musique et ambiances. |
| `ORACLE` | Une question posée à l'IA, un tirage de table partagé. |
| `DICE` | Un jet de dés. |
| `NOTE` | Ce que vous écrivez vous-même. |
| `SYSTEM` | Le reste — dons d'objets, changements d'état. |

### Ouvrir et terminer une scène s'écrivent aussi

Depuis le 2026-09-12, **ouvrir une scène dépose une entrée**, et la terminer une autre. Ce sont des
`SYSTEM`, donc des **traces** : elles marquent la frontière sans entrer dans le résumé.

L'entrée d'ouverture porte le décor — l'acte, le lieu, les PJ présents, les PNJ, puis le synopsis :

```
Scène ouverte : La voix dans le relais

Acte : Ce que Hale n'a pas dit
Lieu : Station Varn
PJ présents : Nel Varga, Idris Koa
PNJ : Ancre-7

Ancre-7 prend la parole sans qu'on l'appelle.
```

Une rubrique dont vous n'avez rien renseigné **disparaît** au lieu de s'afficher vide. L'entrée de
fermeture, elle, dit la **durée jouée** — ou *« Close sans avoir été jouée »* pour une scène que
l'acte a emportée sans que le groupe y passe.

> ⭐ **Et ce n'est pas qu'un confort de relecture.** La revue de fin de séance ne liste que les
> scènes **qui portent des événements**. Avant, une scène jouée mais silencieuse n'y apparaissait
> pas du tout — donc impossible à fusionner ou à scinder, alors que c'est exactement le rattrapage
> prévu. *Le filet manquait là où il devait servir.*

> ⚠️ Rien n'est écrit si le geste ne change rien : rouvrir une scène déjà ouverte, ou terminer une
> scène déjà close, ne dépose aucune entrée. Et rien ne s'écrit **hors séance** — préparer sa trame
> un dimanche après-midi ne remplit pas un journal archivé.

> ⭐ **Pourquoi `PJ` et `DICE` existent séparément.** La mort d'un personnage joueur s'écrivait
> autrefois en `NPC` : cela fonctionnait, mais rangeait sous « personnage non joueur »
> l'événement qu'une table raconte le plus longtemps. Et les dés sont le geste **le plus fréquent**
> d'une séance — des centaines de lignes, exactement ce qu'on voudra filtrer en relisant. *Un type
> qui ment sur son sujet coûte le jour où l'on filtre.*

## 2. Deux natures : la trace et la chronique

Le journal sert **deux usages qui ne veulent pas la même granularité** :

- **Pendant** la partie, c'est un fil qu'on regarde. « Initiative tirée pour 6 combattants »
  confirme que l'action est passée : utile.
- **Après**, c'est la matière d'un récit. La même ligne devient du bruit.

D'où deux natures. Une **trace** apparaît dans le fil mais **n'entre pas dans le résumé** ; une
**chronique** compte pour le récit. *On ne supprime pas, on distingue.*

Un jet de dés est une trace **sauf aux deux extrêmes** : une réussite éclatante et un échec total
sont des faits de fiction, pas des mesures — ils passent en chronique.

## 3. La curation : scène par scène, pas ligne par ligne

À la fin d'une séance, vous ne relisez pas deux cents événements. Vous relisez **une dizaine de
scènes**, chacune avec ce qui s'y est passé — le rattachement est déjà fait quand vous arrivez.

> *« Une dizaine de scènes se revoit en quelques minutes là où deux cents événements ne se revoient
> jamais. »*

C'est **votre** étape, et elle mérite votre attention. Le résumé qui suit, lui, est automatisé —
parce que les deux n'ont pas le même mode de défaillance : **un résumé raté se relance, c'est bon
marché ; une curation ratée fausse tout ce qui en découle.**

### Où se trouvent « Absorber… » et les ciseaux

Les deux gestes vivent **dans le module Journal de Jeu**, section **« Revue de la séance »**, sous
le compte rendu — et nulle part ailleurs : les écrans de trame ne les proposent pas.

Ils n'apparaissent que lorsque la revue a de quoi les appliquer. **Quatre conditions**, et aucune
ne s'annonce à l'écran :

| Ce que vous cherchez | Ce qu'il faut |
| :--- | :--- |
| Voir une scène dans la revue | qu'elle porte **au moins un événement**. Depuis le 12/09, l'ouverture en dépose un — donc toute scène ouverte y est. |
| Le menu **« Absorber… »** | **au moins deux scènes** dans la revue, et la scène gardée ne doit pas être mise de côté. |
| Les **ciseaux** (scinder) | un événement qui **n'est pas le premier** de sa scène. Couper sur le premier donnerait tout à la seconde moitié. |
| Des ciseaux visibles sans déplier | un événement de **récit**. Les traces — dés, combat, son, ouverture de scène — sont repliées derrière leur bouton. |

> ⚠️ **Une séance surtout faite de jets et de combats affiche « Rien qui raconte »** sous ses
> scènes, et ses ciseaux sont dans le repli des traces. Ce n'est pas une panne : seuls `NPC`, `PJ`,
> `LOCATION` et `NOTE` sont de la chronique par défaut.

La curation écrit dans la trame et dans les événements — des objets déjà enregistrés — et non dans
un brouillon jetable. Sa sortie vaut donc par elle-même : c'est la matière de la chronique, du wiki
et du carnet.

## 4. Le compte rendu, en trois sections

À la clôture d'une séance :

1. **Le récit** — ce qui s'est passé. **Seule section qui passe par un modèle.**
2. **L'état des lieux** — où en sont les choses au moment où l'on s'arrête.
3. **Pour la suite** — ce qui reste devant, relevé sur la trame.

Les deux dernières se **calculent**. *Une chaîne construite est instantanée, gratuite,
déterministe et fonctionne hors ligne* — et elle allège d'autant ce qu'on envoie au modèle, qui se
faisait tronquer.

> ⭐ **Tout se relève à la clôture, jamais à la lecture.** Un compte rendu est une **photographie** :
> relire une séance de mars doit montrer où vous en étiez en mars, pas où vous en êtes aujourd'hui.

## 5. Le journal connaît sa campagne

Un journal retient **la campagne** à laquelle il appartient, et pas seulement son nom dans son
titre. Renommer une campagne ne détache donc plus ses journaux.

---

## 💡 Ce qu'il faut retenir

- **Vous n'avez rien à faire pendant la partie** : les modules écrivent. Vos `NOTE` s'ajoutent
  quand vous le voulez.
- **La curation est le seul moment qui demande votre attention** — dix minutes, scène par scène.
- Le compte rendu est une photo de la soirée, pas une vue actualisée.
- Le journal se lit avec la [trame](./11-Trame-actes-et-scenes.md) : c'est elle qui donne aux
  événements leurs scènes.

---

*Guide écrit le 2026-09-04. Le plan du module date du 2026-08-08 ; ses dix étapes sont closes
depuis le 2026-08-21.*
