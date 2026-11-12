# 🟩 Jeu — Delta Green

> **Pilote décrit :** « Delta Green », forgé par David, exporté le 2026-11-12, version **2.0.1** du
> 2026-11-12 (`Export Dirvers/corriges/Delta-Green-2.0.1.gmos-driver`, construit par
> `outils/delta-green/finir_delta_green.mjs`). Thème `delta-green` et fiche d’Agent HTML
> `delta-green-agent-fr` préparés le même jour. Retour à
> [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Un seul geste : le **test**, un d100 sous les chances de l’Agent. Ces chances sont une compétence,
ou une caractéristique multipliée par cinq, plus le bonus ou le malus de l’Officier Traitant. Le
résultat a quatre issues : réussite critique, réussite, échec, échec critique. **Les doubles et les
« 01 » / « 00 » décident des critiques.** Les points de vie, la Volonté et la Santé Mentale sont des
jauges ; la fiche d’Agent HTML (formulaire DD 315) est reliée champ par champ.

> Règles lues dans le *Manuel de l’Agent* (édition française) le 2026-11-12 : pages imprimées 18,
> 29, 43-44, 50 et 53 (page du PDF = page imprimée + 1 ; chemin dans
> `docs/systems/delta-green/livres.json`). Les dix-huit fiches du corpus
> `docs/systems/delta-green/rules/` ne sont **pas encore relues** en entier (`relu: false`).

**Réimporter le pilote avec « Remplacer ».** Le pilote forgé portait un critique sur 1 et une
complication sur 20, des valeurs de d20 : sur le d100, **aucun double ne comptait**. Sa fiche
nommait « Compétence 1 » à « Compétence 12 ». La version 2.0 garde son identifiant, et **sa fiche
change** : un personnage créé sur l’ancienne ne retrouverait pas ses compétences (aucun n’existait
au 12/11). La 2.0.1 corrige le menu du jet : en 2.0.0, Pilotage s’y affichait sous le nom de sa
spécialité (« +5 »), et Art, Artisanat, Pilotage, Science et Sciences militaires en disparaissaient
tant qu’aucune spécialité n’était saisie.

---

## Le test

Dans l’onglet **Lancer un test** de la fiche, choisir une **compétence**, une **caractéristique**
ou la **SAN** :

- **une compétence** se teste à son pourcentage. Art, Artisanat, Pilotage, Science et Sciences
  militaires affichent leur spécialité à la suite de leur nom, « Pilotage — Hélicoptère (40) », et
  restent au menu sans elle ; les six lignes libres, les langues et autres compétences, n’y
  apparaissent qu’une fois nommées, sous leur nom : « Russe (40) » ;
- **une caractéristique** se teste à sa valeur × 5 : FOR 15 donne 75 % (p. 18). Le panneau le
  dit sous les chances ;
- **la SAN** se teste à sa valeur courante.

L’étape **Préparer** règle le **bonus ou malus** de l’Officier Traitant, de −40 à +40 %. Le livre
cite surtout ±20 %, et plus rarement ±40 % (p. 43). Les chances modifiées restent entre **1 et
99 %**, et le panneau dit quand il les a ramenées.

**Une compétence à 0 % ne se tente pas** (p. 29). Le bouton reste gris et le panneau le dit : il
reste à demander un test de caractéristique × 5.

| Le dé | Ce qu’il donne (p. 44) |
| :--- | :--- |
| **01**, ou un **double** (11, 22… 99) sous les chances | **Réussite critique** — l’effet est doublé |
| Sous les chances ou égal | **Réussite** |
| Au-dessus des chances | **Échec** |
| **00** (100), ou un **double** au-dessus des chances | **Échec critique** — des répercussions catastrophiques |

Le résultat s’écrit avec ces mots : « Réussite critique — 33 contre 50 % ».

**Exemple du livre** (p. 44) : un Agent à 50 % obtient une réussite critique sur 01, 11, 22, 33 et
44, et un échec critique sur 55, 66, 77, 88, 99 et 00.

## Le pupitre de l’Officier Traitant

Au pupitre, le jet du système se lit sur la même échelle : le seuil saisi est la chance. Le 01, les
doubles et le 00 y comptent comme sur la fiche.

## Les jauges

| Jauge | Maximum (p. 18) |
| :--- | :--- |
| **Points de vie (PV)** — la santé principale | (FOR + CON) / 2, arrondi au supérieur |
| **Volonté (VOL)** | POU |
| **Santé Mentale (SAN)** | 99 − Inconcevable ; au départ, POU × 5 |
| **Seuil de rupture (SR)** | un nombre saisi : SAN − POU au départ |

Les coups portés depuis la console de dommage ou Combat-OS s’écrivent sur les PV de la fiche. Le
livre dit : *« Une fois à 2 PV, il perd connaissance, et à 0 PV, il meurt »* (p. 18). GM-OS
déclare la mort à 0, mais il ne signale pas encore l’inconscience à 2.

Les **cinq Attaches** ont un nom, un score et la case « endommagée ». Les accoutumances à la
violence et à l’impuissance sont deux cases.

## Le combat

- **Initiative** : l’ordre de **DEX**, de la plus élevée à la plus basse ; à égalité, les actions
  sont simultanées (p. 50).
- **Portées** (p. 53) : +20 % à bout portant (3 m ou moins), −20 % de la portée de base de l’arme à
  son double, −40 % du double au quintuple, impossible au-delà. Les limites dépendent de l’arme :
  Combat-OS les nomme, l’Officier Traitant règle le malus au jet.
- **Armes** : sept lignes sur la fiche, avec compétence, portée de base, dégâts, perforant,
  létalité, rayon d’action et munitions. GM-OS les affiche, mais n’applique ni la létalité ni les
  dégâts.

## La fiche du personnage

La fiche d’Agent HTML (`docs/fiches/Delta Green/delta-green-fiche-agent-interactive.html`, deux
pages, 233 clés) est dans le moteur des fiches (version 26). 163 champs GM-OS y sont reliés
(`docs/systems/delta-green/fiche/correspondance.json`). Les **70 clés laissées à la fiche HTML**
ont chacune leur raison :
- les « × 5 », que le jet calcule lui-même ;
- les maximums, que le pilote calcule ;
- les cases d’amélioration (cochées après un échec, puis 1D4 après la partie) ;
- les formations particulières ;
- la signature.

Le **trouble psychique permanent** n’existe que dans GM-OS.

## Le thème

Le thème `delta-green` : papier de dossier, ornements, quinze icônes, et la bannière
`Delta Green Band.jpg`. Préparé par Codex le 12/11 et contrôlé : 0 erreur, 0 avertissement.

## Ce qui reste à la table

- **La perte de SAN** : le test de SAN, puis la perte (« 1/1D6 »), se lit et se retire à la main.
  Il en va de même pour le Seuil de rupture, les troubles et l’accoutumance.
- **L’inconscience à 2 PV** : à dire à la main.
- **La létalité** des armes, les **dégâts doublés** d’une réussite critique et les **effets d’un
  échec critique** (p. 44-45) : à appliquer à la main.
- **L’amélioration des compétences** après la partie : cocher la case de l’échec sur la fiche
  HTML, puis ajouter 1D4.
- **Les tests en opposition** (p. 45) : deux jets, à comparer à la main.
