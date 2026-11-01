# Analyse des améliorations — RuneQuest, Degenesis, COC et Shadowrun Anarchy

David, le 01/11/2026 : « peux-tu faire une analyse pour identifié les améliorations des nouveaux
pilotes - Runequest - Degenesis - COC et Shadowrun. Mets à jour le fichier d'améliorations tous
les pilotes ».

## Résultat

La [synthèse des pilotes](2026-10-20-ameliorations-tous-les-pilotes.md) conserve les acquis et
ajoute **24 propositions**, six par jeu, et **trois priorités communes**. Chaque ligne porte
un identifiant stable, sa priorité, le constat courant et un résultat observable à vérifier
si le développement est demandé. Les compteurs de la vue d'ensemble incluent ces six nouvelles
lignes rouges par jeu ; aucun orange n'est transformé en vert sans essai de David.

| Pilote | Première reprise proposée | À poursuivre ensuite |
| --- | --- | --- |
| RuneQuest | **RQ-A2, P0** : afficher les PV de la cible, pas ceux du lanceur ; **RQ-A1, P1** : campagne de recette à réaligner sur 2.1.0 | Dégâts spéciaux/critique et parade, RA selon l'action, dérivés expliqués, magie/inspiration/progression |
| Degenesis | **DEG-A1, P1** : Égo de l'initiative reporté à la première action, débité une seule fois | Armure/défense/dégâts nets, maxima et branches exclusives, aide/combinaisons, contamination permanente et Brûlure, adversaires autonomes |
| Chroniques Oubliées Contemporain 2 | **COC-A1/A2/A3, P1** : chaîne de dégâts, effets de santé/DEF, rôles PNJ et Pulp | Héroïsme hors test, santé psychique/choc, capacités de Voies sélectionnées et sourcées |
| Shadowrun Anarchy 2.0 | **SR-A1/A3, P1** : drain/soins admissibles et piratage préparé | Dérivés et Anarchy, planification/menace, opposition et rôles ; rigging après arbitrage de la résistance des véhicules |

**NP-C1 (P0)** est commun : GM-05 de synchronisation. **NP-C2** propose une reprise des anciennes
fiches avec aperçu et validation ; **NP-C3** demande les essais de droits et des variantes qui
ne sont pas encore prouvés dans les parcours applicatifs. GM-06 reste un essai à effectuer,
pas un défaut démontré par cette analyse.

## Périmètre et preuves

Base de code **0a9431ef**, branche production. Lecture des générateurs de pilotes, des modules
de jets/dégâts/panneaux, des quatre manuels, des règles locales déjà relues et des rapports de
recette. Il s'agit de **COC Contemporain 2**, pas de L'Appel de Cthulhu, et de **Shadowrun
Anarchy 2.0**, pas d'une autre édition de Shadowrun.

Le livre intégral et les errata n'ont pas été relus de nouveau pendant cet audit. Les
références de règle viennent des corpus relus aux § 187, 188, 193 et 197. Les propositions
ouvertes (atouts, Voies, sorts, véhicules) gardent leur besoin de validation et leur périmètre.
Un choix laissé au MJ n'est pas automatiquement une erreur de logiciel.

### Décalage RuneQuest confirmé dans les archives

Le générateur `outils/runequest/finir_runequest.py` déclare **2.1.0**, les sept champs
de dégâts locaux et `combat.coupsLocalises`. En revanche :

- `output/campagnes-tests/runequest/inventaire.json` annonce **2.0.0** ;
- le `requiredDriverData` de `01-Les-Bornes-du-gue.gmos` est bien **2.0.0**, avec **313 champs**
  et sans `combat.coupsLocalises` ;
- le pilote séparé du lot porte le nom `RuneQuest-2.0.0.gmos-driver`.

La recette garde sa valeur pour les mécanismes de 2.0.0. Elle ne prouve pas l'import des
coups localisés de 2.1.0, même si leurs tests du code sont verts. Aucun export ou lot n'a été
régénéré pour masquer cette différence dans le cadre de l'analyse.

### Constats dans les lecteurs du code

- RuneQuest : `RuneQuestAuJet.localiser` lit les PV via les valeurs du lanceur, tandis que
  `PorterLeCoup` résout la cible à part. L'impact vise la bonne cible ; l'affichage/trace est
  trompeur si ses PV de zone diffèrent. Constat statique, sans nouvelle reproduction E2E.
- Degenesis : le Jet système appelle `reserveDeDegenesis(va, {}, traumatismes)` ; aucun choix
  d'Égo ne circule là vers la première action. L'initiative native et le débit au panneau
  restent des acquis, mais leur coordination de round reste à faire.
- COC : le critique est borné au maximum naturel dans `preparerCoc`, sans drapeau « aucun
  critique ». La règle des figurants/seconds rôles nécessite donc autre chose que changer
  la plage. Les messages de CON et les bonus de Héros ne sont pas tous des effets appliqués.
- Shadowrun : les soins du moniteur cherchent la pire blessure sans information d'origine ;
  ils ne peuvent donc distinguer le drain non soignable par magie/premiers soins. Le plafond
  99 d'Anarchy est explicitement déclaré dans le générateur malgré la règle sans plafond ;
  l'audit propose de vérifier ses lecteurs avant de conclure à un comportement à 100 points.

Les sources techniques et leurs SHA-256 sont conservés dans
[le relevé d'analyse](2026-11-01-analyse-nouveaux-pilotes.json).

## Vérifications du 01/11

**177 tests passent sur 12 fichiers** :

| Jeu | Règle du jet | Porte des dégâts | Panneau | Total |
| --- | --- | --- | --- | --- |
| RuneQuest | 59 | 14 | 9 | 82 |
| Degenesis | 17 | 7 | 5 | 29 |
| COC | 21 | 7 | 10 | 38 |
| Shadowrun | 15 | 8 | 5 | 28 |

Commande : `npx vitest run --maxWorkers=4`, en désignant les quatre fichiers de règles,
`coupsDeRuneQuest`, `pistesDeDegenesis`, `encaissementDeCoc`, `moniteurDeShadowrun` et les
quatre `PanneauDeJet.<jeu>.test.tsx`. Rapport JSON brut sous
`tmp/analyse-nouveaux-pilotes/verification-tests.json`, bilan durable dans le relevé ci-dessus.
Pas de nouveau test écrit, ni de modification applicative ; il s'agit d'une vérification du
socle existant, pas de la validation de futurs lots.

Les rapports Electron déjà livrés documentent chacun **douze chemins GM-05** : RuneQuest
(66 cas humains), Degenesis (66), COC (70), Shadowrun (64). Ils utilisent des marqueurs fictifs.
Ces assertions de confidentialité restent en échec ; les 177 tests unitaires ne les remplacent
pas. Aucun nouveau serveur ou essai Electron n'a été lancé durant cette analyse.

## Reprendre

Choisir un des lots de la synthèse, après le sujet commun de confidentialité. Avant toute
réalisation sous `src/` ou `electron/`, demander si GM-OS tourne conformément à AGENTS.md.
Pour RuneQuest, réaligner les données de recette avant d'étendre leurs preuves ; conserver
les SHA historiques. Pour les autres jeux, ajouter les cas du lot retenu aux laboratoires
existants, sans déclarer joués les cas humains encore NON TESTÉS.

Aucune donnée personnelle consultée, aucun pilote installé modifié, aucune installation,
aucune commande Git d'écriture. Cette demande autorise l'analyse et la documentation,
pas le développement des 27 sujets proposés. Fichiers non commités.
