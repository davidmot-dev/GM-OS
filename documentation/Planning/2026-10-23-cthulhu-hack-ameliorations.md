# Cthulhu Hack — améliorations du 23 octobre 2026

David demande les améliorations du pilote et fournit le livre français
`Z:\Jeux de Rôle\02. Contemporain\2. Ambiance\L'appel de Cthulhu\Cthulhu Hack\dmkl01bpdf_cthulhuhackreedition_v1v3.pdf`.
Il confirme GM-OS fermé avant les modifications, puis valide son essai le 23/10 et demande le commit et le push.

## Source et périmètre

Le PDF compte 177 pages ; la pagination imprimée vaut la page PDF moins un.
Relecture ciblée des Sauvegardes et des cinq restes de la synthèse commune, confrontés au
pilote exporté `CH_driver_gmos_1792659649981.gmos-driver` et aux chemins réels des fiches,
du pupitre, du combat et du Hub. Ce contrôle ne vaut pas relecture de tout le corpus RAG.
Les pages de tables 31, 32, 42 et 50 et le matériel ont aussi été relues en image.
Les trois tables existantes ont été comparées au livre : le Délire précise désormais le D20
explosif et la durée la plus longue ; le Choc Inconscience rappelle que l'aide est facultative.

| Lot | Règle primaire | Réalisation | État |
| --- | --- | --- | --- |
| CH1 | p. 50 : Détruit perd 6 points entre deux Sauvegardes distinctes ; Ravagé 4 parmi la personnalité ; Estropié 2 parmi le physique | Aperçu avant confirmation, total exact, valeurs suffisantes, application persistante unique ; nouvelle chute distincte | 🟢 Livré et essayé le 23/10 |
| CH2 | p. 34 et 52 : test de Matériel au moment prévu ; déclin d'une armure = un PA perdu | Protection déclarée par emplacement ; écriture centrale et reçu compensable par Fortune | 🟢 Livré et essayé le 23/10 |
| CH3 | p. 42 : MJ défausse 1 ou 2 jetons pour relance, innocent, secret, Choc ou Menace | Coût relu au moment de payer ; relance du seuil et des conditions mémorisés ; Choc ne réduit pas la Santé mentale ; aucun secret saisi | 🟢 Livré et essayé le 23/10 |
| CH4 | p. 31–32, 50 : Moments, minutes, heures, scène et échéances | Horloge de fiction confirmée par le MJ ; Tremblements décroissants ; D20 explosif et scène avec la durée la plus longue ; effets généraux au jet | 🟢 Livré et essayé le 23/10 |
| CH5 | p. 50 : Pulp, D10 à chaque blessure à zéro, −1 cumulatif après le premier | Activation explicite, file des coups réels, activité à zéro, Mort bloquante ; récupération unique après danger | 🟢 Livré et essayé le 23/10 |

## Choix qui doivent rester visibles

- Le mode standard attend la confirmation « danger écarté ». Pulp ne rend aucun PV pendant le combat.
- L'armure et le couvert se déduisent des dégâts avant leur saisie. Le pilote ne devine pas
  qu'un objet nommé est une armure : le MJ indique ses PA. Une baisse manuelle de son dé
  compte également comme un déclin ; une réparation se saisit explicitement.
- Le temps avance dans la fiction, jamais selon l'horloge du PC. Une fin de scène ne remplace
  pas les minutes d'un Évanouissement/Délire : retenir la durée la plus longue.
- Les Moments ont leur compteur distinct. Le livre donne environ dix secondes par round
  p. 44 et six secondes par Moment dans la suffocation p. 50 ; aucune conversion générale
  n'est inventée. Le MJ confirme les Moments vécus et le temps en minutes/heures séparément.
- Os brisés prend fin à la fin de la prochaine journée ou à la fin de séance, au premier terme.
- Hystérie et Paranoïa dépendent du sens ou de la perception : rappel détaillé, appréciation du MJ.
  Frayeur, Délire, sous-type d'Amnésie et le test de Constitution de l'Évanouissement sont rappelés ;
  le MJ joue ces suites. Le réveil anticipé du Choc Inconscience demande l'action d'un autre personnage.
- Les données de suivi sont conservées dans `_gmos_cthulhu_hack`, admis dans les sauvegardes.
  Une ancienne fiche HTML ne peut effacer ce suivi ni les nouveaux champs de protection omis.

## Pilote à importer

`Export Dirvers/corriges/CH_driver_gmos_2026-10-23.gmos-driver`, version **1.1.0**.
Même pilote `custom-1774643419710`, même gabarit `tpl-1774643419711`, mêmes anciennes clés.
Quatre champs numériques ajoutés : `materiel_1_pa` à `materiel_4_pa`. Aucun thème ni HTML remplacé.
Le suivi est optionnel, déclaré par `jet.cthulhuHack` ; les autres jeux gardent leur comportement.

Recette reproductible :

```powershell
node outils/cthulhu-hack/ameliorer-pilote-2026-10-23.mjs
npx vitest run --config outils/cthulhu-hack/vitest.config.mts --maxWorkers=4
```

L'archive originale est lue sans être modifiée. Le contrôle de Forge doit produire zéro constat.

## Vérifications

- 943 tests ciblés passent (69 fichiers) : domaine des dés, usages du pupitre, écritures de santé/usure,
  confirmations de fiche et non-régression Alien.
- Dernier complément : 18 essais du domaine et de l'interface passent, dont le compteur de Moments
  indépendant et les Sauvegardes vides sans aperçu illisible. Ces essais recouvrent la suite précédente.
- Audit de l'export : zéro constat de Forge, identifiants et unicité des champs contrôlés.
- Types et construction (`npm run build`), lint ciblé et `git diff --check` passent.
- Recette Electron et vrai Hub Edge : **1 scénario réussi en 43,2 s**, profils jetables,
  360/768/1 180 px sans débordement. Aperçu puis confirmation des pertes, rechargement sans
  seconde application, récupération, perte/restauration du PA par Fortune, défausse MJ,
  coups Pulp à zéro et Choc sans perte mentale avec Moment restant conservé au rechargement.
- Captures relues et sélectionnées pour le manuel : aperçu, pertes confirmées, durées, Pulp
  et lecture du Hub à 360 px. L'archive source et les profils personnels restent intacts.
- Essai réel de David : **validé le 23/10**, « ok c'est bon, c'est testé. Tu peux faire le commit et poussé ». Les cinq lots passent au vert.

La recette utilise exclusivement les profils jetables de `e2e/lancerGmOs.ts`, les données fictives
du manuel et une sortie de captures sous `scratch/cthulhu-hack-2026-10-23/`. Aucun profil personnel.

## Hors de cette livraison

Séquelles mentales définitives, récupération mentale à long terme, soins spéciaux
(premiers secours et capacités), création/progression et variante des cartes Contrecoups.
Ne pas interpréter la réalisation des cinq restes comme une automatisation complète du livre.
