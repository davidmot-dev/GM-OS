# État et reprise — la journée du 2026-09-20, **les deux restes de Light-OS**

> **Base saine.** `tsc -b` propre, **5 626 essais Vitest** (441 fichiers, 1 ignoré), E2E de
> Light-OS et la traversée des modules au vert, branche `feature/tablet-hub-pwa`.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md), et elle y vit seule.
>
> Il prend la suite de [`2026-09-19-etat-et-reprise.md`](./2026-09-19-etat-et-reprise.md).

---

## Ce que la journée a produit

| § | Chantier | Éprouvé ? |
| --- | --- | --- |
| **92** | « Essayer sur les lampes » — le dernier reste de l'IA qui compose | ⚠️ non |
| **93** | L'atelier d'effets — créer un effet de zéro, **et l'IA qui écrit la suite** | ✅ **oui** (*« ça marche très bien »*) |

Les deux sont partis d'une même question de David — *« on avait laissé quelque chose en suspens au
niveau de Light-OS ? »* — posée au registre et non à ma mémoire, ce qui est exactement la
procédure : **quatre restes rendus, vérifiés dans le code avant d'être annoncés.**

⭐ **Et le second est né d'une mémoire exacte.** *« Il me semble qu'on avait parlé d'un module de
création d'ambiance ? »* — le magasin porte sa phrase du 2026-09-18 en commentaire. La réponse
d'alors avait été **les variantes** ; il en réclamait la moitié qui manquait.

---

## Par quoi reprendre

**Éprouver à l'écran.** ✅ L'atelier l'est depuis le 20/09 ; l'essai d'une ambiance ne l'est pas.

1. **L'essai d'une ambiance** (§ 92) — une scène de la trame → *Proposer une ambiance* →
   **Essayer**, puis **Revenir**. Ce qui compte : la pièce retrouve **exactement** ce qu'elle
   montrait.
2. ~~**L'atelier** (§ 93)~~ — ✅ **fait le 20/09**, l'IA comprise : *« ça marche très bien »*.
3. **La restauration** (§ 87, hérité du 19/09) — dans `npm run repetition`, jamais sur le vrai
   profil. Toujours le seul point non barré de la veille.

---

## Ce qu'il ne faut pas repayer

### ⛔ Les trois portes du retour visent toutes une SCÈNE

Et elles tombent sur `extinguishAll` quand aucune n'a été jouée. Or on essaie une ambiance en
**préparant** une séance, pièce allumée. La quatrième visée — *ce que la pièce montrait juste
avant* — existe pour ça, dans `light/logic/retourDEssai.ts`. ⚠️ Ne pas les aligner.

### ⛔ Une photographie qui change avec son sujet n'est pas une photographie

L'essai écrit dans le miroir à chaque lampe qu'il pose. Une capture par référence aurait rendu, au
retour, **l'ambiance dont on voulait sortir**.

### ⛔ Une validation ne borne pas toujours : parfois elle JETTE

`etapeBornee` repeint en blanc une couleur illisible — bon pour une saisie humaine, que le meneur
voit et corrige. Pour une sortie de modèle, non : *une étape manquante se voit ; une étape fausse
se croit.* Un blanc glissé au milieu d'un orage passerait pour une intention.

⚠️ Et **le défaut d'un champ oublié doit être celui qui donne le meilleur résultat**, pas celui
qui se calcule le plus vite : un `alea` absent vaut **25**, parce que zéro rendrait une machine.

### ⭐ Un effet peut être de la DONNÉE

Une lampe Hue ne sait qu'obéir à *va à cette couleur et à cette brillance, en tant de temps*. Les
quarante-huit `case` ne sont que des façons d'enchaîner cet ordre-là — donc quatre nombres par
étape suffisent. ⭐ **Et le désordre n'est pas un ornement** : c'est lui qui sépare une suite d'un
geste. *Une bougie sans lui est un métronome.*

### ⭐ Se jouer AVANT le `switch` pour le traverser quand même

L'identifiant `atelier:…` ne correspond à aucun `case` : le `switch` le laisse passer, et tout ce
qui vient après — brillance globale, intensité de tuile, rabotage du fondu — s'applique sans une
ligne de plus. *C'est ce qui fait qu'un effet neuf obéit aux mêmes curseurs que les anciens.*

### ⛔ Ralentir se voit ; une lampe qui ne joue pas ne s'explique pas

Le rationnement **soliste** éteint des lampes pour tenir le budget du pont. Appliqué à un effet
que le meneur vient d'écrire, il l'aurait laissé chercher longtemps. Les effets d'atelier sont
**adaptatifs**.

### ⚠️ Un `reset` qui laisse du travail derrière lui

`useLightStore.reset()` ne vidait pas `variantes`. Il n'est appelé que par les essais — mais deux
fichiers d'essais partagent le même magasin dans un worker, et le second héritait du premier.

---

## Ce que la journée a trouvé sans le chercher

| Trouvaille | Où |
| --- | --- |
| Le recensement de `rendreLEtat` a **refusé** un quatrième ayant droit non décrit — exactement ce que son commentaire annonçait | § 93 |
| `reset()` laissait `variantes` derrière lui | § 93 |
| Une règle du composant (*« rien n'est appliqué au pont »*) lue vite interdisait le bouton qu'on venait demander — elle visait *« rien ne s'allume tout seul »* | § 92 |

---

## ⚠️ Ce qui reste ouvert

- **L'atelier n'est atteignable que par une lampe.** Son unique porte est le bouton d'effet d'une
  lampe, dans le bandeau du bas : sans pont branché ni mode simulé, il n'y a aucune lampe, donc
  aucune porte — alors que l'atelier sait travailler sans lampes. Signalé à David le 20/09, une
  dizaine de lignes pour une entrée depuis la barre du haut.
- **Les specs E2E des gestes des deux jours.** Aucune n'exerce l'essai ni l'atelier. ⚠️ Le chemin
  du pont ne sera jamais couvert — `GMOS_SANS_APPAREILS` débranche le réseau exprès.
- **⏸ Les lampes qui suivent la voix** (§ 3 bis, ligne h) — construit le 31/08, jamais essayé au
  pont. Il attend un micro et une vraie séance.

---

*Écrit le 2026-09-20. Guides mis à jour : **11** (l'essai d'une ambiance), **75** (l'atelier,
l'IA qui écrit la suite, et la quatrième porte du retour). Doc technique Light-OS : § 2 ter
(quatre portes) et § 2 ter bis (l'atelier).*
