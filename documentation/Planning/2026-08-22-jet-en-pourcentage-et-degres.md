# Le jet en pourcentage et les six degrés de réussite

**Nature de ce document : référence vivante.** La procédure du chantier, à tenir à jour jusqu'à ce qu'il
soit clos, puis à reclasser en récit clos.

**Date :** 2026-08-22
**Branche :** `feature/tablet-hub-pwa`
**Origine :** David soupçonnait que la mécanique de Rêves de Dragons *« n'était pas exprimable »* par le
descripteur de jet. L'investigation lui a donné raison, et a trouvé un dégât plus immédiat : **le pilote
RdD lance des jets faux d'un facteur cinq.**
**Documents liés :** `2026-08-22-etat-et-reprise.md`, § 3.1 (le rang du chantier) ·
`2026-08-19-reconciliation-plans-aout.md`, § 5, P1 bis (le reste consolidé).

---

## 1. Le dégât, et pourquoi personne ne le verra

**Le pilote compose `seuil = caractéristiques + compétences`.** Or chez RdD la compétence n'est pas dans
l'ordonnée, elle est dans **l'abscisse** : elle ne s'ajoute pas au pourcentage, elle déplace la colonne,
donc elle **multiplie**.

| | Agilité 12, compétence +3, difficulté moyenne |
| --- | --- |
| Ce que fait le pilote | 12 + 3 = **15 %** |
| Ce que dit le livre | 12 × 6,5 = **78 %** |

Facteur cinq, dans le sens qui fait échouer les personnages compétents. *Les joueurs concluront que leurs
personnages sont mauvais, jamais que l'outil se trompe* — c'est le motif du pupitre de dés, troisième
occurrence : **le chemin s'arrête avant le moteur.**

---

## 2. Ce qui est vrai dans le code, vérifié le 2026-08-22

| Constat | Où | Conséquence |
| --- | --- | --- |
| **Le seuil ne sait qu'ADDITIONNER** | `DescripteurDeJet.ts:367` (`additionner`), appliqué ligne 422 | Rien n'exprime un produit, encore moins un produit par courbe. La même fonction sert au seuil **et** à la réserve |
| **`difficulte` veut dire autre chose** | descripteur | C'est `reussitesRequises`, un nombre de succès à atteindre, hérité de Dune. Chez RdD la difficulté déplace la colonne. **Même mot, mécanique sans rapport** |
| **Le résultat d'un jet est un BOOLÉEN** | `DiceEngine.ts:19` — `tagSuccess?: boolean` | Même si la cible était juste, il n'y a **nulle part où poser « réussite particulière »** |
| Le moteur, lui, n'a besoin de rien | `d100-low`, `rollThreshold(…, 'under')` | Il lance déjà un d100 et compare en `<=`, ce qui est exactement la règle. **Tout le manque est en amont** |

**Les six lecteurs du booléen, et leurs trois vocabulaires :** `DiceBoard.tsx:708` et `:767` (via i18n) ·
`HubDiceDisplay.tsx:58` (i18n) · `TabletHub.tsx:597` (« Réussite » en dur) ·
`RemoteDiceResultOverlay.tsx:91` (« Succès » en dur) · `PanneauDeJet.tsx:237`, qui le rechiffre en
`successes: 1|0` — conversion avec perte.

> **Ils ne divergent pas encore uniquement parce qu'un booléen n'a que deux valeurs.** Ajoutes-en six et
> ils divergeront le jour même : la tablette des joueurs dira « Succès » quand l'écran du meneur dira
> « Réussite significative ». **La forme du chantier est donc une échelle ordonnée et UN SEUL endroit qui
> la nomme** — c'est le motif du journal de séance.

---

## 3. La donnée, transcrite du livre — *et surtout pas dérivée*

**Source :** *Livre du Voyageur* 2.3.1, section « Résultats spéciaux », **pages 33-34** (l'index du livre
la donne aussi en 209). Transcrite depuis la page photographiée par David le 2026-08-22.

> **RÈGLE DE CONCEPTION, ET ELLE NE SE DISCUTE PAS.** Ces nombres **ne viennent pas d'un modèle**. Ils se
> saisissent une fois, depuis le livre, et se protègent par un test. *Une Forge qui « dérive » une table
> de nombres produit des nombres plausibles et faux que personne ne verra avant six séances.*

### 3.1 Table des résultats spéciaux

Trois colonnes seulement. **`Part.` est un plafond** (le résultat lui est inférieur ou égal) ; **`Éch.P.`
et `Éch.T.` sont des planchers** (le résultat leur est supérieur ou égal).

| % de Norm. | Part. | Éch.P. | Éch.T. |
| --- | --- | --- | --- |
| 01-05 | 01 | 81 | 92 |
| 06-10 | 02 | 82 | 92 |
| 11-15 | 03 | 83 | 93 |
| 16-20 | 04 | 84 | 93 |
| 21-25 | 05 | 85 | 94 |
| 26-30 | 06 | 86 | 94 |
| 31-35 | 07 | 87 | 95 |
| 36-40 | 08 | 88 | 95 |
| 41-45 | 09 | 89 | 96 |
| 46-50 | 10 | 90 | 96 |
| 51-55 | 11 | 91 | 97 |
| 56-60 | 12 | 92 | 97 |
| 61-65 | 13 | 93 | 98 |
| 66-70 | 14 | 94 | 98 |
| 71-75 | 15 | 95 | 99 |
| 76-80 | 16 | 96 | 99 |
| 81-85 | 17 | 97 | 00 |
| 86-90 | 18 | 98 | 00 |
| 91-95 | 19 | 99 | 00 |
| 96-00 | 20 | — | 00 |
| 101-105 | 21 | — | — |
| 106-110 | 22 | — | — |

**La réussite significative n'est PAS dans la table.** Elle se calcule : *chances ÷ 2, arrondi à
l'inférieur* (section « Résultats spéciaux »). À 30 % : 15.

### 3.2 Ce que la table dit et que la règle en prose ne dit pas

**La règle énoncée — « les derniers 20 % de la marge d'échec » — ne reproduit pas la table.** À 30 % de
chances, la marge vaut 70, ses derniers 20 % font 14 points, ce qui donnerait un échec particulier à
partir de **87**. **La table imprime 86.** Vérifié colonne par colonne : `Éch.P.` vaut *80 + numéro de
palier*, ce qui est une approximation linéaire, pas la fraction annoncée.

> **La table fait foi, y compris contre la phrase qui prétend la résumer.** La prose reste utile pour
> comprendre l'intention — un échec particulier est « le dernier cinquième des ratages » — mais elle ne
> calcule rien.

**Et la régularité a une exception, ce qui est exactement pourquoi on transcrit.** `Éch.T.` monte d'un
point tous les deux paliers (92, 92, 93, 93, …) — **sauf à la ligne 91-95, où elle plafonne à 00** au lieu
du 101 que la régularité annoncerait. Un test doit surveiller la transcription **et** cette exception ;
un test qui vérifierait seulement la régularité re-dériverait la table et raterait sa dernière ligne.

**Deux cas de bord que la table tranche, et que la prose laissait ouverts :**

- **À 96-100 % de chances**, il n'y a plus d'échec particulier, mais `Éch.T.` vaut `00` : **le seul
  résultat qui échoue, 100, est un échec TOTAL.**
- **Au-delà de 100 %** (paliers 101-105 et 106-110), ni échec particulier ni échec total. La fiche
  ajoute que 00 y est toujours un **échec normal**. *Les deux ne disent pas la même chose, et la
  frontière est à 100 : à 96-100 le 00 est total, au-dessus de 100 il est normal.*

### 3.3 Seconde table — ajustement général inférieur à −10

| Ajst. général | Norm. | Éch.T. |
| --- | --- | --- |
| −11 | 01 | 90 |
| −12 | 01 | 70 |
| −13 | 01 | 50 |
| −14 | 01 | 30 |
| −15 | 01 | 10 |
| −16 | 01 | 02 |
| −17 et au-delà | — | 01 |

**Elle corrige la fiche.** `resolution-des-jets.md` écrit que *« l'échec total s'élève de quatre-vingt-dix
pour cent (à −11) à quatre-vingt-dix-huit pour cent (à −16) »* : elle confond le **seuil** et la
**probabilité**. Le seuil **descend** de 90 à 02 ; c'est la probabilité qui monte, de 11 % à 99 % — et non
98 %. Dans cette zone, **la réussite vaut toujours 01 sec**, il n'y a ni particulière ni significative, et
tout échec qui n'est pas total est particulier.

À −17 et au-delà : plus aucune réussite, **tout jet est un échec total**.

---

## 4. L'ordre de travail

| Rang | Quoi | Pourquoi ici |
| --- | --- | --- |
| **A** | **Le calcul de la cible** — la courbe de multiplicateurs | C'est le dégât réel, et il ne dépend d'aucune décision restante. Un jet faux se paie à chaque séance |
| **B** | **L'échelle ordonnée** à la place de `tagSuccess` | Elle doit exister **avant** qu'un lecteur ait à rendre six valeurs. Sinon les six divergent le jour même |
| **C** | **Les bandes**, depuis la table du § 3 | Consomme A (elles se lisent sur la cible) et B (elles ont besoin de l'échelle pour se poser) |
| **D** | **Les six lecteurs**, un par un | Vient en dernier, et c'est là que se joue le vocabulaire unique |

**A avant tout le reste, et B avant C.** Poser les bandes sur un booléen obligerait à les écraser pour les
ressortir ensuite — c'est la conversion avec perte de `PanneauDeJet.ts:237`, en pire.

### Où vivent les nombres

**Ni dans le pilote, ni dans le modèle.** Un module dédié, en code, avec les deux tables du § 3 saisies
une fois et testées. **Le pilote se contente de désigner la mécanique par son nom** — il dit *« ma cible
se calcule par la table de résolution de RdD »*, il ne porte aucun de ses nombres.

*C'est la même frontière que partout ailleurs : le pilote décrit le jeu, il ne réimplémente pas ses
tables.* Et c'est ce qui permet à L'Appel de Cthulhu et RuneQuest de réutiliser l'échelle sans réutiliser
les nombres de RdD.

### Ce que le chantier ne fait pas

- **Il ne corrige pas le pilote RdD existant**, qui vit dans le magasin de l'application et porte en plus
  douze composantes « Compétence 1 » à « Compétence 12 ». Il se retouche à l'atelier ou se reforge — la
  Forge, elle, ne les produira plus depuis le 2026-08-21.
- **Il ne touche pas au moteur.** `d100-low` et `rollThreshold(…, 'under')` sont déjà justes.

---

## 5. Comment savoir que c'est fait — en séance

1. **Agilité 12, compétence +3, difficulté moyenne : le panneau doit annoncer 78 %**, pas 15.
2. Un jet réussi de justesse et un jet réussi à 1 doivent se lire **différemment**, et **du même nom sur
   les trois écrans** — pupitre du meneur, tablette des joueurs, incrustation de résultat.
3. Un ajustement à −13 doit donner **01 % de chances** et un échec total à partir de 50.
4. Le journal doit porter le degré : aujourd'hui une réussite particulière et une réussite de justesse y
   laissent la même trace, **donc l'Oracle ne peut pas savoir qu'un jet a été spectaculaire.**

---

## 6. Ce qui reste à trancher

- **La fiche `degres-de-reussite-et-critiques.md` porte `relu: false`.** Son exemple à 30 % est une
  transcription **fidèle** de la table — c'est sa *règle en prose* qui ne la reproduit pas. À reprendre :
  ajouter la table, marquer la règle comme une intention et non un calcul, puis `relu: true`.
- **`resolution-des-jets.md` porte l'erreur du § 3.3** (seuil confondu avec probabilité) et la même
  approximation. À corriger dans la même passe.
