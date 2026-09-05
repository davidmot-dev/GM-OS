# 🏗️ La Forge de campagne

La **Forge de campagne** transforme un scénario écrit — un livre, un PDF, vos notes — en objets de
jeu dans GM-OS : des actes, des scènes, des lieux dans l'Atlas, des PNJ, des factions, des indices,
des entrées de savoir. Elle vit dans **Forge-OS**, à côté de la Forge Système.

> **Ne pas confondre les deux Forges.** La *Forge Système* décrit **comment un jeu fonctionne** —
> dés, combat, fiches — et produit un **pilote**. La *Forge de campagne* décrit **ce qui se passe
> dans une histoire** et produit une **campagne**. Elles ne se mélangent jamais : *le pilote
> appartient au jeu, jamais à la campagne.*

---

## 1. Elle ne lit pas le livre — elle lit vos fiches

C'est le point qui surprend le plus, et c'est délibéré. La Forge ne digère pas un PDF de 200 pages
d'un coup. Vous passez d'abord par **l'Atelier de campagne**, qui vous fait remplir des **fiches**,
une par sujet. La Forge lit ensuite ces fiches.

Les sujets du canevas :

| Sujet | Ce qu'on y écrit |
| :--- | :--- |
| **Pitch de la campagne** | De quoi elle parle, ce que les personnages y font. |
| **Factions** | Maisons, organisations, groupes en présence. |
| **Lieux majeurs** | Où la campagne se déroule. |
| **Personnages non joueurs** | Qui compte, ce qu'ils veulent. |
| **Secrets et indices** | Ce qui est caché, qui le sait, où ça peut se révéler. |
| **Amorces** | Comment les PJ entrent dans l'histoire. |
| **Scènes prévues** | Titre, ce qui s'y joue, le lieu, les personnages. |
| **Règles propres à cette campagne** | ⚠️ Voir plus bas — cette fiche est **mise à part**. |

Deux de ces sujets — les PNJ et les scènes — se découpent **par acte**. Une fiche porte donc son
sujet *et* sa partie : sans ce second axe, les PNJ des trois actes se mélangeraient dans une seule
demande au modèle.

> ⭐ **La fiche « Règles propres à cette campagne » est lue, puis écartée.** Son contenu ne nourrit
> aucun objet de jeu — le pilote appartient au jeu. Elle n'est pas jetée pour autant : l'écran dit
> qu'elle existe et qu'elle n'a nourri personne, *sinon son absence se lirait comme un oubli.*

## 2. Huit étages, dans l'ordre des dépendances

La Forge ne fait pas un seul appel. Elle procède **par groupes**, et chacun ne peut désigner que ce
que les précédents ont créé :

```text
campagne → lieux → factions → PNJ → relations → indices → scènes → savoir
```

Une scène peut donc nommer un lieu et un PNJ, parce qu'ils existent déjà quand on l'écrit. C'est le
même mécanisme que la Forge Système — *il n'y en a pas deux, parce que deux boucles concurrentes
finiraient par ne plus traiter les échecs de la même façon.*

## 3. Rien n'est écrit tant que vous n'avez pas relu

La Forge produit un **projet**, pas une campagne. Dans ce projet, les renvois sont des **noms**, pas
des identifiants : « la scène du marché se passe à *Hadley Hope* et met en jeu *Milo* ».

Deux étapes séparées suivent :

1. **La résolution** — les noms deviennent des identifiants.
2. **L'écriture** — les objets entrent dans votre campagne.

Ce découpage existe pour une raison précise : **vous voyez ce qui va se passer avant que votre
campagne ne bouge.**

## 4. Ce qui ne se résout pas vous est dit

> ⛔ **On ne jette plus rien en silence.** L'ancien import faisait disparaître une relation dont le
> nom ne tombait pas juste, sans un mot. Sur une relation, la perte est discrète ; **sur une scène,
> elle serait invisible et grave** — une scène amputée de ses PNJ et de ses indices a l'aspect exact
> d'une scène qui n'en avait pas, et l'écran annoncerait un succès.

Chaque renvoi qui ne trouve pas sa cible est **rendu** avec l'objet qui le portait, le champ visé et
le nom écrit. Le renvoi est abandonné — on ne fabrique pas de cible — mais il est **dit**.

*Ordre de grandeur, mesuré en réel le 2026-08-16 sur « Le secret de Milo » : 3 actes, 29 scènes,
43 PNJ, et **6 renvois non résolus sur environ 150 signalés**.*

## 5. Reforger n'écrase rien

Un objet dont le nom existe déjà **n'est ni recréé ni réécrit**. La Forge adopte l'identifiant
existant pour ses renvois, et signale qu'elle l'a conservé.

Sans cela, une seconde forge doublerait tous vos PNJ — et vos corrections de la semaine passée
cohabiteraient avec une copie neuve qui les ignore. *Si retravailler une séance efface le travail
de la semaine précédente, le meneur cesse de retravailler.*

Vous pouvez donc **reforger un acte** après avoir enrichi ses fiches, sans rien perdre.

## 6. Les brouillons

Une fiche revenue du carnet est écrite **immédiatement** comme brouillon, avant relecture. Une fiche
coûte une à deux minutes de carnet et serait perdue si l'atelier se fermait pendant la revue — *un
brouillon n'engage rien.* La relecture devient alors une **publication**, à froid, plus tard.

⚠️ Les brouillons sont **exclus de l'index de l'Oracle** : une fiche non relue ne doit pas être
citée comme une source.

---

## 💡 Ce qu'il faut retenir

- **Fiches d'abord, forge ensuite.** L'Atelier n'est pas une formalité : c'est là que le travail se
  fait, et la qualité des fiches décide de tout le reste.
- **Rien ne bouge sans votre relecture**, et ce qui n'a pas pu être relié vous est nommé.
- **Reforger est sûr** — c'est même la façon prévue d'enrichir une campagne acte par acte.
- Ce qu'elle produit rejoint la [trame narrative](./11-Trame-actes-et-scenes.md) : actes et
  scènes, prêts à jouer.

---

*Guide écrit le 2026-09-04. La Forge de campagne a été éprouvée en partie réelle le 2026-08-16.*
