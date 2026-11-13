# Delta Green — les cinq suites du pilote, 13/11/2026

> David : « tu veux bien faire les améliorations de Delta Green du fichier améliorations tous les pilotes ».
> GM-OS fermé, confirmé par David avant l’écriture de code. Accord explicite pour compléter
> la synthèse et le registre en conservant les modifications de la campagne de recette.
> Registre § 249 ; livraison 2.1.0, validée par David le 13/11.

**Validation de David — 13/11/2026 :** « ok c’est bon tout est testé, corrige la doc, commit et pousse ». Les fonctions du pilote 2.1.0, la perte directe de SAN et les quatre boutons harmonisés sont validés. La relecture du corpus reste distincte : 1 fiche sur 18 relue ; les 17 autres ne sont pas déclarées relues par cet essai.

## Périmètre réalisé

Les cinq lignes rouges de la synthèse du 12/11 sont réalisées et validées par David le 13/11 :

| Suite | Résultat | Référence imprimée |
| --- | --- | --- |
| Santé mentale | Perte réussite/échec, minimum et maximum critiques ; SR = SAN finale − POU ; rappel des folies et troubles ; accoutumance suivie avec coût permanent | p. 66–74 |
| Inconscience | 1–2 PV : inconscient ; 0 : mort. Fiche, console, synchronisation et plateau cohérents ; aucun faux décès à 2 PV | p. 18 |
| Combat | Sept armes lues sur le porteur ; létalité, somme des chiffres avec 0 = 10, critiques doublés ; protection après perforant et couvert confirmés ; complications au choix | p. 44, 52, 57–60 |
| Opposition et expérience | Comparaison des deux jets, option poursuite, égalité à arbitrer ; échec coché, D4 après la partie, plafond 99 %, décoche | p. 29, 45 |
| Vocabulaire | Libellé du jeu conservé dans résultat, transport tablette, étiquette commune, journal et jets cachés | p. 44 |

Les mécanismes de calcul sont dans `src/modules/dice/systemes/deltaGreenSuites.ts`. Les commandes
du panneau sont dans `DeltaGreenAuJet.tsx` ; celles de Combat-OS dans `DommagesDeltaGreen.tsx`.
Les champs de règle sont explicites dans `jet.deltaGreen` ; le contrôle de la Forge vérifie leur présence.

## Données et garde contre les doubles applications

- Même identifiant de pilote et de fiche, mêmes champs existants ; passage de 2.0.1 à 2.1.0.
- 47 cases d’expérience reliées aux clés HTML `experience.*` : 210 correspondances, 23 absents motivés.
- Le reçu de perte SAN et les compteurs vivent dans `sheetData.__deltaGreen`. Les commandes
  de perte et de progression ferment aussi le délai avant retour des valeurs de fiche.
- Les anciennes écritures de fiche HTML conservent reçus, compteurs et complications qu’elles ne connaissent pas.
- Les nouvelles commandes empruntent les écrivains existants du porteur (PJ, Galerie, combattant autonome),
  et la porte de synchronisation existante du plateau ; aucun magasin persistant supplémentaire.
- Le vocabulaire du résultat voyage dans `libelleDuDegre`. Le lecteur réseau n’accepte que
  les quatre libellés correspondant au degré annoncé ; les autres jeux gardent leur vocabulaire.

## Livre et corpus

Le livre complet a été lu **en place sur le NAS**, par pages ciblées, sans copier son PDF ni
persister son texte. Le fichier local homonyme n’est qu’un extrait de quatre pages.
Le registre `docs/systems/delta-green/livres.json` donne le chemin et le décalage +1.

Une fiche sur dix-huit est relue : `accoutumance-violence-et-impuissance.md`, empreinte conservée.
Corrections : réussir automatiquement ne supprime pas nécessairement toute perte ; un seul D6
réduit le CHA et toutes les Attaches du même montant. La relecture intégrale des 17 autres fiches
et le catalogue d’équipement restent des sujets à instruire.

## Vérifications

- `node outils/delta-green/finir_delta_green.mjs` : archive 2.1.0 générée, identifiants conservés,
  213 champs, 210 clés de correspondance, 23 absents.
- `node outils/delta-green/verifier_pilote.mjs "Export Dirvers/corriges/Delta-Green-2.1.0.gmos-driver"` : zéro constat.
- 301 essais ciblés / 17 fichiers réussis : mécanique DG, commandes, santé, combat, journal,
  transport, non-régression Argyropée, corpus dérivable et manuel.
- Suite générale `npx vitest run --maxWorkers=4` : **10 478 réussis, 4 ignorés**, seul échec sur les deux
  images du manuel encore absentes lors du lancement ; images générées ensuite, contrôle du manuel
  **28/28 réussi**. Aucun échec de logique dans les 895 fichiers de la suite (893 verts, un ignoré,
  le contrôle d’images repris séparément).
- Après les derniers ajustements : **25/25** dans les quatre fichiers des nouvelles suites et commandes.
- `npx tsc -b`, lint ciblé sur tous les fichiers de code du lot et `npm run build` : réussis.
  Fiche HTML : **acceptée, zéro erreur / zéro avertissement**, 210 correspondances.
- `GMOS_PILOTES_DES_JEUX=tmp/delta-green-ameliorations/pilotes npx playwright test e2e/capturesDesJeux.spec.ts --grep "Delta Green" --reporter=list` :
  **1/1 réussi**, profil jetable isolé, six captures relues. Le parcours exerce l’échec et la coche,
  le D4 unique après la partie, la SAN et le SR, l’opposition, 80 au test de létalité avec protection,
  l’inconscience à 2 PV, le décès à 0 malgré l’armure et la conservation après rechargement.
  Les contrôles de couvert, dégâts doublés et complications sont couverts par les tests de composant.
- Le premier lancement Electron confiné ne créait pas de fenêtre : relancé hors confinement avec
  les mêmes gardes de profil. Le scénario fixe les dés sans fixer l’aléatoire lors de la création des
  identifiants de combattants ; sinon il fabrique deux cartes du même identifiant. Aucun correctif
  applicatif ajouté pour ce défaut du scénario d’essai.
- `git diff --check` : propre ; aucun fichier de campagne préexistant modifié.

## Captures complétées (13/11, Claude Code)

Cinq prises ajoutées à la scène : menu « Pilotage — Hélicoptère (40) », FOR × 5 avec malus de 20,
réussite critique à 33, pupitre en échec critique à 55, fiche d’Agent HTML. Les onze images sont
relues et placées dans leur section de la page 54 ; parcours `capturesDesJeux` 1/1 après
`npm run build`.

## Livraison et gestes validés

[Delta-Green-2.1.0.gmos-driver](../../Export%20Dirvers/corriges/Delta-Green-2.1.0.gmos-driver)
réimporté avec **Remplacer**, puis fonctions validées par David le 13/11. Aucun profil privé ni campagne de David modifié par les essais automatiques ; commit et push demandés le 13/11.

1. Sur une fiche : test de SAN, perte `0/1D10`, vérifier SAN et nouveau SR ; refaire un clic ne retire rien.
2. Dans Combat-OS : ouvrir « Delta Green : arme, dégâts et complications », choisir arme/cible,
   confirmer attaque et cible humaine, régler protection/couvert ; vérifier les PV et l’inconscience à 2.
3. Rater une compétence, constater sa case d’expérience, appliquer le D4 après la partie et vérifier la fiche HTML.

Restent à la table : choisir les troubles et leurs déclencheurs, projeter une perte sur une Attache,
réprimer une crise, arbitrer protections massives/transcendantes, tir accidentel, chute et soins.
Ces fonctions ne sont pas déclarées automatisées par cette livraison.

La campagne « Les dossiers de la pluie » et son cahier restent les livrables historiques du § 248,
créés pour la 2.0.1. Ils ne sont pas régénérés silencieusement.

## Correction après l’essai de David — perte directe de SAN

David : « la perte de SAN ne fonctionne pas », puis « SAN 60 SR 48 POU 12 Perte -5 ».
GM-OS fermé confirmé avant correction. Le bouton gardait « Appliquer la perte de SAN ».

**Cause reproduite :** `calculerPerteSAN` ne reconnaissait que deux branches séparées par `/`.
La saisie `-5` était refusée ; le message d’erreur était envoyé en bas de la carte, sous les blocs
d’opposition et d’amélioration. Les essais précédents ne saisissaient que des barèmes.

**Correction :** une perte directe est désormais acceptée (`5`, `-5` ou `−5`, et un dé seul comme
`1D6`) ; le montant représente toujours une perte, jamais un soin. Les barèmes `0/1D6` restent
acceptés. Les refus de saisie ou de fiche incomplète sont expliqués dans une alerte au-dessus du
bouton. Aucun reçu n’est consommé en cas de refus : on peut corriger sans relancer le test.

**Cas de David :** SAN 60 → 55, SR 48 ; une perte de 5 rappelle la folie temporaire, sans nouveau
trouble de rupture. Deux clics n’appliquent pas deux pertes. Correctif du moteur, pilote 2.1.0 conservé.

**Vérifications :** 25 essais ciblés réussis (calcul, composant, combat), lint, types et construction
réussis. Parcours isolé `e2e/perteSanDeltaGreen.spec.ts` **1/1 réussi** : saisie exacte `-5`, lecture
du magasin à SAN 55 / SR 48, application unique et conservation après rechargement.
Capture : `output/verification-delta-green-san-directe/san-60-moins-5.png`.

## Harmonisation des quatre boutons — 13/11/2026

David demande d’aligner « Appliquer la perte de SAN », « Lancer le dé adverse »,
« Consigner l’opposition » et « Améliorer les compétences » sur « Lancer » / « Demander à ».
GM-OS fermé confirmé avant modification.

Les deux actions qui écrivent les ressources (perte de SAN et amélioration) reprennent le fond
accent et le texte contrasté de « Lancer ». Les deux actions d’opposition reprennent la bordure
et le texte accent de « Demander à ». Même typographie, capitales espacées, marges et cible
tactile de 44 px ; focus visible fourni par `Bouton` du socle, largeur adaptée à l’espace et
états désactivés distincts. Les champs et les règles de calcul sont conservés.

Sept essais de commande et lint ciblé réussis ; types et construction réussis. Les deux parcours
Playwright (`capturesDesJeux`, Delta Green seul, et `perteSanDeltaGreen`) passent **2/2** sur profils
jetables. Les images du manuel sont actualisées et le rendu actif/désactivé a été relu.
Capture des quatre boutons actifs :
`output/verification-delta-green-san-directe/boutons-avant-application.png`.
