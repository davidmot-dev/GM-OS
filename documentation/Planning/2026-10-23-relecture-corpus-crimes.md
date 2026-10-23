# Relecture du corpus de Crimes (C0) — 23 octobre 2026

**Demande de David, le 23/10/2026** : *« on va commencer par C0 »*. Lot C0 du
[registre de Crimes](2026-10-19-registre-ameliorations-crimes.md) : relire les 19 fiches de
`docs/systems/crime/rules/` contre le livre, corriger, distinguer règle, option et arbitrage du
meneur, ne pas transformer les « peut » en obligations (audit :
[C0](2026-10-19-crimes-propositions.md#c0---relire-le-corpus-avant-de-régénérer-le-pilote-priorité-0)).

**Source** : *Crimes 2 — Manuel de l'Enquêteur*, texte extrait du PDF de David
(`scratch/crime-audit/livre.txt`, hors dépôt). Les pages citées sont les **pages imprimées** (page
du PDF moins 2), recalculées pour chaque citation. Les déchéances elles-mêmes sont dans un autre
livre, le *Manuel du Criminel* (p. 220), non consulté.

**Relecteur** : Claude Code, fiche par fiche, chaque affirmation confrontée au passage du livre.
Les 19 fiches portent désormais `relu: true` (l'Oracle les affiche « relues »). Corriger le corps
d'une fiche change son empreinte : elles sont protégées d'une nouvelle génération par la Forge.

## Ce que la relecture a changé, en bref

- **Une correction de ma correction du 22/10** : la mort n'est pas automatique, mais le livre fixe
  bien **−2** comme consigne au meneur — « implacable » pour une conduite idiote ou suicidaire,
  « logique » pour une blessure trop lourde, « évitée » après une action audacieuse et calculée
  (« De la mortalité des combats », p. 393). Les fiches disaient « aucun seuil de mort chiffré »
  (santé) ou « le décès intervient seulement à −2 » (états) : les deux sont repris.
- **Le seuil n'est pas fixe** : au tir, la distance, la mobilité et la taille de la cible le
  déplacent de −1 à +1, l'angoisse au-dessus de 3 de −1 à −2 ; exemple « seuil de 8 +1 −1 = 8 »
  (p. 389-390). Un angoissé (3 et plus) peut se voir imposer un seuil de 9 non modifiable pour
  viser (p. 412).
- **Les options rendues aux options** : en opposition, ajouter les 1 de l'un aux succès de l'autre
  et neutraliser un double échec critique sont des **possibilités** (« on peut », « le meneur peut »,
  p. 385) ; les fiches en faisaient des règles.
- **Erreurs franches corrigées** : la Psychose vient d'un **échec critique** sur un jet de passion,
  pas d'un échec (p. 410) ; le seuil de névrose ne vaut pas « 9 moins la psychose » mais dépend du
  tempérament (p. 334) ; le test d'affliction prend la virulence pour **seuil** de chaque dé, il
  ne demande pas « autant de réussites que la virulence » (p. 397) ; l'incapacité ne vaut que pour
  le **Physique** à 0 (p. 395) ; assommer change les blessures en **fatigue** (p. 392) ; le type
  d'atteinte (épuisement ou blessure) est donné **arme par arme** (p. 344).
- **Inventions retirées** : l'échelle de résultats des poursuites (le livre n'en donne pas,
  p. 443) ; « styles d'enquête secondaires par points de développement » ; « réserve générale de
  l'affaire » ; « incapacité à 0 dans n'importe quel Potentiel » après un dépassement ; « actes
  d'expiation » contre la psychose ; « tir à travers un couvert qui réduit la marge » ; « arme longue
  en mêlée » ; « perte définitive d'un point de base » aux substances ; la jauge de résistance à la
  déchéance présentée comme règle générale (c'est l'équipe d'exemple des Anges de la nuit, p. 366).
- **Délais de guérison** : une heure, un jour, une semaine, un mois sont un **exemple** laissé au
  meneur (p. 396), plus des valeurs.

## Contradictions et choix laissés au meneur

| Sujet | Ce que dit le livre | Dans les fiches | Pour GM-OS |
| --- | --- | --- | --- |
| Névrose après le seuil | « ramené à la moitié (arrondi à l'inférieur) » (p. 409, exemple de Rachel p. 411 : 7 → 3) ; « retour de la névrose à 0 » (p. 418) | Les deux, avec les pages ; l'exemple suit la moitié | C4 devra choisir (proposition : la moitié, comme l'exemple) |
| Abasourdi | Échec automatique en opposition (p. 386) ; un tireur engagé par surprise ne garde qu'un dé (p. 390) | Les deux, chacun dans son cas | Aucun automatisme aujourd'hui |
| Annonce du dépassement | Avant le jet (p. 385) ; l'exemple de l'orateur la montre après avoir vu les dés (p. 407) | Les deux ; GM-OS demande l'annonce avant | Choix déjà fait en C3 |
| Mort à −2 | Consigne au meneur selon la conduite (p. 393), jamais automatique | Repris partout | La carte des atteintes pourrait la rappeler (voir plus bas) |

## Fiche par fiche

| Fiche | Pages vérifiées | Corrections |
| --- | --- | --- |
| Résolution des jets | 323-325, 384-390, 412 | Résultat automatique (le meneur décide, sinon échec assuré) ; options de l'opposition ; exceptions de l'aide ; compétences hermétiques (sans elles, pas de jet) ; spécialisation réservée aux maîtres ; abasourdi ; seuil modifiable (« Non couvert » était faux) ; doublons des bilans réduits (budget de la Forge) |
| Degrés de réussite et critiques | 385-390, 409-410 | Psychose : échec critique sur passion ou dans l'histoire ; options de l'opposition ; titres de section ; doublons réduits |
| Santé et blessures | 323, 393, 395-396, 415 | Potentiels-jauges et marques par Potentiel ; épuisement qui remplace la fatigue ; mort à −2 (consigne) ; délais de guérison « à titre d'exemple » ; soins (compétence et matériel) ; blessure grave exacte (−1 au départ jusqu'à chirurgie, Névrose = points subis, test à un dé) |
| Jauges et ressources individuelles | 324, 334, 383, 409-418, 431 | Angoisse (histoire, 1 point, ≥ 3 et ≥ 4) ; Névrose (liste exacte) ; Psychose (variations, intermittente à 6) ; seuil de névrose par tempérament ; Fortune à deux valeurs (niveau et jauge, dépasser ses limites) ; Innocence (seuil, score, trois dépenses) |
| La décompensation névrotique | 334, 409-412, 418 | Contradiction moitié/zéro exposée ; « permanente » retiré ; intermittence à 6 ; moment de l'interprétation ; soupapes (une fois par séance, deux impossibles) ; personnage choqué |
| La mécanique des passions et du dépassement | 329-330, 385, 389-397, 407-414 | Psychose sur échec critique ; incapacité limitée au Physique ; principe de contradiction ; interdits (test psychotique, poison mortel) ; combat et convictions ; annonce |
| Points d'enquête et styles | 352, 436-440 | Règle optionnelle ; un style, changeable ; jets jamais nécessaires ; point seulement si l'enquête avance ; débat (gain « à envisager ») ; pas de réserve commune ; rivalités, contacts, autopsie, indices à seuils |
| Composition de la fiche | 296, 323-325, 349-352, 355-371 | Spécialisation et hermétiques ; contacts (coûts exacts) ; styles optionnels ; enfants ; jauges d'équipe = exemples |
| Dégâts et types de dégâts | 344, 389-396 | Type par arme ; table exacte des armes blanches ; assommer → fatigue ; « en dessous de −1 » ; tir multiple ; chevauchement |
| Distances et portées | 345-346, 386-390 | Modificateurs du seuil ; Chattuck ; trois cas limites inventés remplacés par le livre (engager un tireur, tir impossible ou immanquable, couvert) |
| Initiative et déroulement du tour | 388-393 | Engager un tireur (un dé gardé, pas « ne peut pas tirer ») ; combat entre groupes ; recharger ; combattant expérimenté |
| Jets opposés, aide et coopération | 385-386, 390-391 | Options ; condition d'aide limitée aux actions qui l'exigent ; abasourdi en mêlée ; groupes ; coquille |
| États et conditions | 386, 393, 395, 397, 418-421 | Incapacité au Physique ; mort (consigne) ; durée de l'abasourdi ; doses et exposition prolongée ; folies complétées (aphasie, colère, confusion) ; substances |
| Environnement et dangers | 389, 397-405 | Test d'affliction exact (virulence = seuil) ; poisons mortels ; exposition prolongée ; échecs critiques par substance ; chutes ; diagnostic secret |
| Poursuites | 385, 389, 442-443 | Échelle de résultats inventée retirée ; filature |
| La déchéance | 306, 338, 366, 382, 410 | À 10, « doit subir une déchéance » ; Manuel du Criminel ; création (concepts, enfants) ; atavisme exact ; jauge d'équipe d'exemple ; affirmations non sourcées retirées |
| Monnaie de table | 296, 355-371 | Jauges d'équipe rendues à leurs équipes d'exemple ; réputation ; conséquences inventées retirées |
| Inventaire des mécaniques | toutes les précédentes | Aligné sur les corrections (bilans, mort, dégâts, portées 10-400 m, poursuites « partiellement », potentiels, Fortune, styles optionnels, décompensation) |
| Ton, registre et ambiance | 380-382 | Niveaux du système modulable exacts ; « pas d'enjeu, pas de jet » ; une transition de registres non sourcée retirée |

## Ce que la relecture propose pour le code (non fait, à décider)

Le code n'a pas été touché pendant C0. Quatre suites possibles, toutes dans `src/` :

1. **Un modificateur de seuil pour le jet gardé** (p. 389-390, 412) : distance, mobilité, taille,
   angoisse du tireur, comme le modificateur de Symbaroum ; et, à 3 d'angoisse et plus, le seuil de
   9 rendu non modifiable pour viser. Aujourd'hui le seuil ne bouge qu'avec la compétence et la
   spécialisation.
2. **La consigne de mort à −2** (p. 393) dite par la carte des atteintes, sans rien écrire.
3. **Les compétences hermétiques** : refuser le jet « sans compétence » sur une spécialisation
   hermétique (p. 323-325) — il faut d'abord les déclarer dans le pilote.
4. **Trois commentaires** de `armesDeCrimes.ts`, de son essai et d'`AttaqueDeCrimes.tsx` citent la
   formule des dégâts en p. 395 : elle est en **p. 393**.

## Vérifications

- Les 19 fiches relues ; 19 en `relu: true`.
- Budget d'invite de la Forge : le groupe « Dés et composition du jet » de Crimes tient (les
  bilans répétés trois fois ont été réduits) ; essais de la Forge et d'Electron verts.
- Suite complète : voir le registre général, § 160.
