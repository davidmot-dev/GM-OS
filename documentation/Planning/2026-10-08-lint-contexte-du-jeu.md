# Huitième lot du lint — contexte des chargements du jeu

David demande le 08/10 **« commit, pousse et passe à l'étape suivante (GM-OS est
éteint) »**. Le septième lot est commité et poussé sous **`8f912061`** sur
`origin/feature/tablet-hub-pwa`, après les contrôles complets du hook. Ce lot
poursuit l'étape 3 avec les deux replis asynchrones de bannière/correspondance.

## Une lecture appartient à son contexte

`useBanniereDuJeu` associe l'adresse chargée aux paramètres du jeu : campagne,
système, chemin déclaré, nom/corpus/chemin RAG du pilote et fichier de bannière.
Le contexte garde son identité tant que ces paramètres restent identiques.
Le rendu ne retient une adresse que si elle appartient au contexte courant.
Sans fichier, ou en attendant une nouvelle résolution, il rend `null` directement ;
l'effet n'a plus à effacer un état. Une ancienne réponse reste ignorée par son
annulation. `jeuDeLaCampagneActive` et `adresseDeLaBanniere` gardent la résolution
partagée, l'autorité du chemin déclaré et l'encodage des noms de fichiers.

Le contexte suit aussi une modification du dossier sans changement de campagne
ni de fichier. Avant ce lot, les dépendances limitées à l'identifiant et à la
bannière ne la voyaient pas. Renommer la campagne ou modifier une description de
pilote, sans effet sur la résolution, ne relance pas le chargement.

`useCorrespondanceDuJeu` résout toujours le pilote du **personnage**, dans l'ordre
de `piloteDuPersonnage` : jeu déclaré, gabarit, puis campagne du personnage ou
campagne active en repli. Le contexte porte son identifiant/nom et les paramètres
effectifs de résolution. Changer de personnage, de jeu ou de dossier masque la
table précédente dès le rendu, avant les effets. Sans personnage, la valeur
rendue est directement `null`.

Les références de `character`, des campagnes et des pilotes ne suffisent plus
à déclencher une relecture : modifier `sheetData`, les notes, le nom d'une campagne
ou la description d'un pilote garde la table si le contexte ne change pas.
Un changement d'identifiant/nom du personnage ou des paramètres de résolution
déclenche une nouvelle lecture. Une résolution abandonnée s'arrête avant de
demander la table ; une lecture déjà partie peut finir, mais ne publie rien.
Les rejets de résolution sont traités, annoncés seulement pour le contexte encore
vivant et rendent `null`, au lieu d'un rejet de promesse non traité.

Les deux effets restent responsables de la lecture externe et de son annulation.
Les deux mises à zéro synchrones sont remplacées par une valeur de rendu dérivée.
Aucune temporisation ni règle désactivée n'est ajoutée. Aucun gain de fluidité
n'est annoncé sans mesure.

## Contrôles

Types et construction passent. **102 tests ciblés dans six fichiers**, dont
**19 nouveaux cas** dans les deux nouveaux tests de hooks, passent. Ils exercent
les premiers rendus avant les effets via une observation au commit, les réponses
dans le désordre, les replis, les pannes et la fermeture pendant la résolution.
Ils gardent le choix du jeu du personnage, les chemins déclarés, le maintien de
la table pendant l'édition et l'absence de lecture pour un contexte abandonné.
Les règles de bannière, de corpus et de conversion des correspondances restent
éprouvées par leurs tests existants.

Suite complète : **6 891 tests dans 538 fichiers**, un fichier et quatre tests
ignorés. **Trois scénarios Electron passent** : les deux nouveaux dans
`e2e/contexteDuJeu.spec.ts` et le scénario existant des icônes du jeu. Un corpus
jetable fournit les bannières et une correspondance réelle ; les véritables
écrans suivent le dossier et ne proposent la fiche HTML que pour le personnage
dont le jeu possède une table. Les profils sont jetables, les données fictives
et les appareils désactivés ; aucune capture du manuel n'est remplacée.

Le premier essai de fiche cliquait sur le nom, qui n'ouvre pas l'éditeur. Le
scénario a été corrigé vers le vrai bouton **Fiche**, puis les deux scénarios de
contexte passent. Les icônes avaient passé leur scénario dans le premier essai.
`git diff --check` passe.

Lint global : **1 546 fichiers, zéro erreur, 371 avertissements**, contre 373.
**Deux alertes `set-state-in-effect` retirées**. Restent 353 `any` (130
applicatifs, 223 dans les tests), **14 effets**, trois diagnostics de mémoïsation
et une directive inutile. Les règles et le JSON des 540 alertes initiales restent.

## Reprise

Lot réalisé et documenté, **non commité** : cinq fichiers de code/tests et cinq
documents. Le commit publié au début de ce tour concerne le septième lot.
Continuer les replis de `MediaItemThumbnail` (sans observateur), `AmbientTrack`
(visualiseur arrêté) et `AtelierDesTables` (sans univers), vérifiés dans le code.
Puis traiter le fondu et les synchronisations des 14 effets restants écran par
écran. Préserver les durées des dés, fondus, notes et projections. Les autres
domaines et les faux objets de tests suivent. Les changements antérieurs de
Claude restent hors du lot.
