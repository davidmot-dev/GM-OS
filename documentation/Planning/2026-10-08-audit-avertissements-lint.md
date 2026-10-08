# Audit des 540 avertissements du lint — 08/10/2026

Demande de David : **« peux-tu revoir les 540 avertissements et me faire un
topos ? »**. Audit de la copie de travail au commit `b36157cf`, après clôture de
Trame. Aucun fichier applicatif modifié, aucune correction automatique, aucun
service lancé. Les modifications étrangères sont conservées. Cet audit est
une lecture statique et un inventaire ; il ne reproduit pas des bugs à l'écran.

## Résultat vérifié

Même sélection que `scripts/lint.mjs` : fichiers suivis et nouveaux non ignorés
de Git, extensions JS/TS, mêmes exclusions et même configuration ESLint. Les
scripts temporaires de cet audit sont écartés du comptage puis supprimés.

**1 527 fichiers analysés, zéro erreur, 540 avertissements dans 132 fichiers.**
L'[inventaire JSON](2026-10-08-inventaire-avertissements-lint.json) conserve les
540 emplacements, règles et messages courts, avec la référence de l'audit.

| Règle | Nombre | Fichiers concernés | Lecture et priorité |
| --- | ---: | ---: | --- |
| `@typescript-eslint/no-explicit-any` | 497 | 106 | 92 % du total : dette de typage. Traiter en premier les contrats entre modules, magasins et messages. |
| `react-hooks/exhaustive-deps` | 15 | 12 | Priorité de revue fonctionnelle : certaines valeurs lues ne figurent pas parmi les déclencheurs du hook ; une alerte vise seulement une dépendance recréée à chaque rendu. |
| `react-hooks/set-state-in-effect` | 20 | 17 | Examiner les rendus supplémentaires et les synchronisations ; une alerte ne prouve pas une boucle ou un ralentissement. |
| `react-hooks/preserve-manual-memoization` | 7 | 3 | Diagnostics du compilateur React, qui n'est pas activé dans la configuration Vite actuelle ; recoupent aussi certaines omissions de dépendances. |
| Directive ESLint devenue inutile | 1 | 1 | Nettoyage simple dans un test archivé. |

Les nombres de fichiers par règle ne s'additionnent pas : un fichier peut
recevoir plusieurs règles. Certains emplacements, notamment dans l'atelier
des adversaires, produisent plusieurs diagnostics. Ce ne sont donc pas 540
défauts indépendants. Aucun avertissement dans les fichiers de Trame trouvés
par l'inventaire ; cela n'est pas une preuve d'absence de bugs dans Trame.

## Les 497 `any`

**273 dans le code hors tests (77 fichiers), 224 dans les tests (29 fichiers).**
La séparation reconnaît les fichiers `*.test.*`, `*.spec.*` et `e2e/` ;
« hors tests » inclut les déclarations de types. L'ensemble des avertissements
se répartit donc en 315 hors tests et 225 dans les tests, directive incluse.

`any` supprime une partie des vérifications TypeScript : le lint signale un
contrat trop permissif, pas un échec observé. Un `any` dans un faux objet de
test n'a pas la même priorité qu'un `any` dans un message reçu ou dans une
mutation de campagne. Remplacer automatiquement tous les `any` par `unknown`
déplacerait le travail vers les conversions sans définir les contrats.
Voir la [documentation typescript-eslint](https://typescript-eslint.io/rules/no-explicit-any/).

| Fichier hors tests | `any` | Observation |
| --- | ---: | --- |
| `src/modules/session/store/index.ts` | 33 | Onze assemblages de slices, chacun avec trois conversions `set/get/api as any` : un même problème de signature se répète. |
| `src/modules/session/hooks/useHubSync.ts` | 32 | Accès aux magasins par `window`, charges de synchronisation et états partiels ; préserver l'accès dynamique et les abonnements stables. |
| `src/types/window.d.ts` | 17 | Ponts entre renderer et Electron, réponses HTTP, journalisation et dés ; distinguer les charges métier des arguments de journal. |
| `src/modules/session/logic/SessionManager.ts` | 14 | Transitions de session et magasins : contrats à affiner avec les types déjà présents. |
| `src/modules/remote/actions/sessionActions.ts` | 13 | Actions distantes ; intérêt d'un typage partagé des messages et d'une validation à l'entrée. |
| `src/modules/storyboard/StoryboardDashboard.tsx` | 12 | Typage du tableau de bord à reprendre quand le contrat des magasins est clair. |
| `src/services/CrossWindowEventService.ts` | 11 | Charges d'événements entre fenêtres ; typage discriminé des événements préférable à des conversions dispersées. |

Ces sept fichiers totalisent **132 des 273 `any` hors tests**. Dans les tests,
les plus gros volumes sont `electron/coutureDesFiches.test.ts` (38),
`src/services/purge/detenteurs.test.ts` (28) et
`e2e/capturesDuManuel.spec.ts` (27). Leur nettoyage vient après les contrats
exécutés ; conserver les faux objets volontairement incomplets lorsqu'ils
testent précisément le comportement face à des entrées invalides.

## Les 15 avertissements de dépendances

La règle vise notamment les fermetures qui gardent des valeurs anciennes.
[Explication officielle React](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps).
Les risques ci-dessous sont des hypothèses de revue, pas des régressions
reproduites. Ajouter toutes les dépendances aveuglément peut relancer un
chargement, un abonnement ou une animation à chaque rendu.

| Emplacement | Lecture du contexte et geste à vérifier |
| --- | --- |
| `useMediaUrl.ts:188` | `getMediaBlob` est volontairement exclu pour éviter des résolutions répétées ; `resolvedUrl` intervient aussi dans une optimisation. Préserver la restauration des médias, le changement de source et la libération des URL. |
| `AISettings.tsx:143` | Le chargement des modèles dépend déjà du fournisseur, de la présence de clé Gemini et des deux endpoints Ollama. Clarifier ces dépendances précises plutôt que brancher tout `configs`. |
| `AtelierDesAdversaires.tsx:195` | L'aperçu appelle `fabriquerUn` sans le déclarer comme dépendance ; les données principales sont déjà listées. Vérifier changement d'archétype, de gabarit et de jeu avant de stabiliser la fabrique. |
| `DiceBoard.tsx:458` et `:499` | Deux rappels omettent `t` : vérifier les titres de résultats après changement de langue. Ne pas modifier les règles du lancer pour ce nettoyage. |
| `DiceBox3D.tsx:547` | L'effet lit `lastRoll`, mais se déclenche sur son identifiant : cela évite de rejouer un jet identique. Préserver cette intention et tester nouveau jet, arrêt et changement de style. |
| `FicheHote.tsx:263` et `:284` | `accueillirEtCopier` manque explicitement ; son changement est en partie couvert indirectement par `liaison` et `brancher`. Vérifier ouverture, changement de PJ et copie de bibliothèque avant toute correction. |
| `BrainstormOverlay.tsx:232` et `:272` | Les champs du magasin sont listés séparément ; `handleDiscover` omet aussi `construireCandidats`. L'effet suivant reconstruit déjà les candidats lorsque le sujet libre change. Vérifier le sujet modifié pendant une découverte et la reprise d'un inventaire sans nouvelle requête. |
| `AddEntityForm.tsx:91` | `t` manque lors du message de réception du Wiki : vérifier la langue de la notification et l'absence de préremplissage répété. |
| `TemplateDashboard.tsx:176` | `campaigns` et `customSheetTemplates` sont lus sans déclencheur correspondant : vérifier auto-sélection après arrivée d'un pilote ou d'une fiche. |
| `PanneauDeJet.tsx:94` | L'objet `monnaie` est recréé à chaque rendu, rendant une mémoïsation peu utile. C'est surtout un sujet de coût de rendu ; garder la ventilation de la dépense identique. |
| `useDeckPlayer.ts:102` | `t` manque au rappel de retournement : vérifier les intitulés projetés après changement de langue. |
| `useHubSync.ts:441` | La connexion lit `port`, mais ne dépend que de `host` et du rappel d'application. Le port vient de l'adresse de la page et reste normalement constant ; expliciter ce contrat, sans annoncer une panne de reconnexion non reproduite. |

Les quatre omissions de `t` ont un impact attendu sur les textes, pas sur le
calcul des dés. L'alerte de `monnaie` vise une référence instable plutôt qu'une
valeur manquante. Le premier travail est donc de trier ces 15 alertes dans leurs
12 fichiers, avec de petits essais des gestes concernés.

## Les 20 mises à jour d'état dans des effets

La règle vise les rendus supplémentaires produits par des mises à jour
synchrones dans un effet ;
[documentation React](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect).
La lecture montre plusieurs familles différentes :

- Initialisation ou réinitialisation d'un champ : `ModalProvider`,
  `AIPromptOverlay`, `DamageCalculator`, `useSpotlight`.
- Synchronisation avec un événement ou une source externe : `PlayerHub`,
  `TabletHub`, `PlayerPrivateNotes`, `ProjectorView`, `useHubSync`.
- Repli ou extinction : `MediaItemThumbnail` sans `IntersectionObserver`,
  `useCorrespondanceDuJeu` sans personnage, `useBanniereDuJeu` sans bannière,
  `AmbientTrack` arrêté, `useFonduCroise` sans image, `AtelierDesTables` sans univers.
- `VerrouDeLaSouris:53` est un cas à nuancer : le rappel déclaré `async` ne
  met à jour l'état qu'après `await pont.inventaire()`. Le diagnostic à l'appel
  ne suffit pas à conclure à une mise à jour synchrone ; l'autre alerte à la
  ligne 60 vise bien une remise à zéro directe.

Proposition : éliminer les états réellement dérivables, puis contrôler les
effets de synchronisation par écran. Ne pas remplacer ces synchronisations
par des temporisations destinées seulement à faire taire le lint. Les fondus,
les minuteurs de dés et la réception de notes ont des contrats de comportement
déjà éprouvés ; conserver leurs gestes et leurs durées.

## Les sept diagnostics de mémoïsation et le nettoyage simple

Les diagnostics de mémoïsation concernent `AtelierDesAdversaires` (3),
`DiceBoard` (3) et `useDeckPlayer` (1). Deux recoupent explicitement l'omission
de `t` ; trois se méfient de dépendances que le compilateur estime mutables,
deux ne préservent pas un résultat mémoïsé. Ce n'est pas sept bugs distincts.
La [règle React](https://react.dev/reference/eslint-plugin-react-hooks/lints/preserve-manual-memoization)
parle des optimisations du compilateur. `vite.config.ts` utilise `react()`
sans ce compilateur et `package.json` ne déclare pas son plugin : la priorité
immédiate porte sur les dépendances fonctionnelles, pas sur l'activation du
compilateur pour faire disparaître un message.

Une seule alerte possède un correctif automatique ESLint : suppression d'une
directive `eslint-disable` devenue inutile à
`src/modules/system/archive/NexusService.test.ts:423`. Les 511 alertes avec
des **suggestions** ne sont pas 511 corrections automatiques sûres : elles
incluent notamment les alternatives au `any` et des changements de dépendances.

## Ordre de traitement proposé

1. Revoir les 15 dépendances, en commençant par les chargements, l'auto-sélection
   et les rappels d'actions ; traiter les quatre traductions et le nettoyage
   de la directive dans des lots ciblés.
2. Typer les contrats des données exécutées : signatures des slices Session,
   accès aux magasins, pont Electron et messages entre fenêtres/tablettes.
   Les 33 alertes identiques de l'assemblage se traitent par une signature
   commune, plutôt que par onze corrections indépendantes.
3. Revoir les 20 effets écran par écran, conserver les synchronisations
   nécessaires et mesurer avant d'affirmer un gain de fluidité.
4. Terminer le typage des autres modules puis des faux objets de tests.
   Réévaluer les diagnostics du compilateur après les corrections de dépendances.

`eslint.config.js` conserve déjà volontairement `any` et les deux règles de
performance au niveau avertissement ; le contrôle des hooks et les erreurs
restent bloquants. Ne pas abaisser davantage les règles pour obtenir un compteur
vert. Le contrôle global réparé au commit `57d0193c` est terminé et ne doit pas
être rouvert comme s'il s'agissait de ces corrections.

**État au diagnostic : audit terminé, sans correction applicative.** L'inventaire
JSON conserve les 540 alertes de cette photographie initiale, ancrée à `b36157cf`.
Les 6 802 tests du push précédent concernent cette publication de Trame.

**Suite demandée le 08/10 : « ok on commence suivant ton ordre ».**
Le [premier lot](2026-10-08-lint-dependances-react.md) corrige les 15 dépendances
React ; quatre diagnostics de mémoïsation associés disparaissent également.
Le lint global compte maintenant **1 530 fichiers, zéro erreur, 521 avertissements** :
497 `any`, 20 effets, trois diagnostics de mémoïsation et une directive inutile.
Les contrôles d'exécution propres à ce lot sont décrits dans sa note.
Publication ensuite demandée : premier lot poussé sous **`8c0e4aa9`**.

Le [deuxième lot](2026-10-08-lint-contrats-session.md) reprend les contrats de
Session et du pont Electron. **73 `any` applicatifs retirés**, sans changement
des règles : **1 531 fichiers, zéro erreur et 448 avertissements**. Restent
424 `any` (200 applicatifs, 224 dans les tests), 20 effets, trois diagnostics
de mémoïsation et une directive inutile. Les contrats des données de
synchronisation du Hub et des messages entre fenêtres/tablettes sont la suite
de cette étape. Deuxième lot commité et poussé sous **`55e94341`**.

Le [troisième lot](2026-10-08-lint-actions-session-distantes.md) traite les
actions Session reçues des tablettes et les signatures du registre/dispatch :
**15 `any` applicatifs retirés**, contrôles des données reçues, fusion des
fiches et chemins sans renvoi conservés. **1 533 fichiers, zéro erreur et
433 avertissements** : 409 `any` (185 applicatifs, 224 dans les tests), 20
effets, trois diagnostics de mémoïsation et une directive inutile.
Les 27 nouveaux cas de test, la suite complète (**6 838 tests**) et trois
scénarios Electron/tablettes passent. Troisième lot commité et poussé : **`63cccdda`**.
Les contrats du Hub puis des messages entre fenêtres restent la suite de
l'étape 2 ; les effets et les autres domaines/tests viennent après.

Le [quatrième lot](2026-10-08-lint-magasins-hub.md) type les accès aux douze
magasins du Hub et leurs douze points d'exposition sous un contrat commun :
**24 `any` applicatifs retirés**. Lint global : **1 534 fichiers, zéro erreur
et 409 avertissements** — 385 `any` (161 applicatifs, 224 dans les tests),
20 effets, trois diagnostics de mémoïsation et une directive inutile.
Types, construction, 242 tests ciblés, **6 838 tests de la suite complète**
et six scénarios Electron/tablettes passent. Quatrième lot commité et poussé
sous **`777adc68`**, après les contrôles complets du hook.

Le [cinquième lot](2026-10-08-lint-messages-hub.md) type les données réellement
émises et appliquées par le Hub, y compris les diffusions partielles et les
projections. **20 `any` applicatifs retirés** : 17 dans le Hub, trois dans le
caviardage du synchroniseur. Lint global : **1 537 fichiers, zéro erreur et
389 avertissements** — 365 `any` (141 applicatifs, 224 dans les tests), 20 effets,
trois diagnostics de mémoïsation et une directive inutile. Les règles et
l'inventaire JSON des 540 alertes initiales restent inchangés.
Types, construction, **128 tests ciblés** dans 14 fichiers, **6 846 tests de
la suite complète** et cinq scénarios Electron/tablettes passent. Les messages
entre fenêtres sont la suite de l'étape 2, avant les effets et les autres domaines/tests.
Cinquième lot commité et poussé sous **`43854adb`**, après les contrôles complets du hook.

Le [sixième lot](2026-10-08-lint-echanges-fenetres.md) type les sept messages locaux
et leur application par `CrossWindowEventService`. La réception relit les enveloppes
et les champs de données ; la fusion des jetons ne modifie plus la charge reçue.
**12 `any` retirés : 11 applicatifs et un dans les tests.** Lint global :
**1 539 fichiers, zéro erreur, 377 avertissements**, dont 353 `any` (130 applicatifs,
223 dans les tests), 20 effets, trois diagnostics de mémoïsation et une directive
inutile. Types, construction, **120 tests ciblés dans huit fichiers**, **6 858 tests
unitaires** et **13 scénarios Electron** passent, dont un véritable aller-retour
MJ/Hub par le relais. La suite passe aux 20 effets, écran par écran, avant le
typage des autres domaines/tests. L'inventaire JSON des 540 alertes initiales reste inchangé.
Sixième lot commité et poussé sous **`513e4d94`**, après les contrôles complets du hook.

Le [septième lot](2026-10-08-lint-saisies-react.md) commence l'étape 3 : les
initialisations/réinitialisations des prompts, de l'invite IA, du calculateur
de dégâts et de la sélection de recherche. Les brouillons vivent pendant
l'ouverture ; recherche et sélection changent dans un seul geste ; les nouveaux
jets/propositions ajustent localement l'état sous une garde explicite.
**Quatre alertes d'effets retirées**, sans changement des règles : **1 543 fichiers,
zéro erreur et 373 avertissements**. Restent 353 `any` (130 applicatifs, 223
dans les tests), **16 effets**, trois diagnostics de mémoïsation et une directive
inutile. Types, construction, **18 tests ciblés** (14 nouveaux cas), **6 872 tests
de la suite complète** dans 536 fichiers et **huit scénarios Electron** passent.
Septième lot commité et poussé sous **`8f912061`**, après les contrôles complets du hook.
Continuer les replis asynchrones puis les autres synchronisations écran par écran.
Les fondus, minuteurs, notes et projections gardent leurs contrats ; aucun gain
de fluidité n'est annoncé sans mesure. Le JSON garde les 540 alertes initiales.

Le [huitième lot](2026-10-08-lint-contexte-du-jeu.md) traite les replis de bannière
et de correspondance de fiche. Les lectures portent leur contexte de résolution ;
le rendu masque une lecture d'un autre contexte avant les effets, et les réponses
anciennes sont ignorées. Le pilote du personnage et les chemins déclarés gardent
leur autorité ; éditer `sheetData` ne relance pas la lecture de sa correspondance.
**Deux alertes d'effets retirées**, sans changement des règles : **1 546 fichiers,
zéro erreur et 371 avertissements**. Restent 353 `any` (130 applicatifs, 223 dans
les tests), **14 effets**, trois diagnostics de mémoïsation et une directive inutile.
Types, construction, **102 tests ciblés** (19 nouveaux cas), **6 891 tests** dans
538 fichiers et **trois scénarios Electron** passent. Huitième lot commité et
poussé sous **`a749007e`**, après les contrôles complets du hook.
L'inventaire JSON des 540 alertes initiales reste inchangé.

Le [neuvième lot](2026-10-08-lint-replis-react.md) traite les replis des vignettes
sans observateur, du visualiseur d'ambiance arrêté et de la liste de tables sans
univers. Le rendu fournit le repli ; les effets gardent l'observation, les mesures
et les lectures externes. Le visualiseur annule la frame zéro et ignore les rappels
tardifs. Les listes de tables sont liées à leur contexte ; une ancienne réponse
ne remplace plus celle du nouvel univers, et une réouverture relit la liste.
**Trois alertes d'effets retirées**, sans changement des règles : **1 549 fichiers,
zéro erreur et 368 avertissements**. Restent 353 `any` (130 applicatifs, 223 dans
les tests), **11 effets**, trois diagnostics de mémoïsation et une directive inutile.
Types, construction, **18 nouveaux tests**, **6 909 tests dans 541 fichiers** et
**16 scénarios Electron** passent. Ce neuvième lot reste **non commité**, distinct
du huitième lot publié. Le fondu croisé est repris dans le dixième lot ci-dessous.
Puis les dix autres synchronisations écran par écran. Les durées restent, et le JSON conserve
les 540 alertes initiales.

Le [dixième lot](2026-10-08-lint-fondu-croise.md) traite l'extinction du fondu
croisé. Le changement de cible ajuste localement les couches au rendu ; les
effets gardent le décodage et le minuteur de la transition. Les lectures
abandonnées sont ignorées, la durée est capturée au départ et le nettoyage
annule les anciennes échéances. Les consommateurs et leurs durées restent.
**Une alerte d'effet retirée**, sans changement des règles : **1 550 fichiers,
zéro erreur et 367 avertissements**. Restent 353 `any` (130 applicatifs, 223 dans
les tests), **10 effets**, trois diagnostics de mémoïsation et une directive inutile.
Types, construction, **57 tests ciblés** (13 nouveaux cas), **6 922 tests dans
541 fichiers** et **huit scénarios Electron** passent, dont deux nouveaux dans
une vraie fenêtre Player Hub. Neuvième et dixième lots restent **non commités**.
Le QR et le verrou de souris sont repris dans le onzième lot ci-dessous.
Puis notes, notifications, dés et projection, écran par écran.
Le JSON garde les 540 alertes initiales.

Le [onzième lot](2026-10-08-lint-reseau-et-souris.md) traite le QR réseau et le
verrou de souris. Le repli web vient du rendu ; une lecture du pont appartient
à son ouverture. Les inventaires dépassés sont ignorés et une actualisation
garde la liste connue pendant la lecture ; une panne est traitée et permet
un réessai. Le rappel du décompte termine le sursis et relit l'inventaire.
Le retour matériel reste dans le processus principal, sans modification des handlers.
**Trois alertes d'effets retirées**, sans changement des règles : **1 553 fichiers,
zéro erreur et 364 avertissements**. Restent 353 `any` (130 applicatifs, 223 dans
les tests), **sept effets**, trois diagnostics de mémoïsation et une directive inutile.
Types, construction, **55 tests ciblés** (18 nouveaux cas), **6 940 tests dans
543 fichiers** et **trois scénarios Electron** passent. Les souris des essais
sont des doubles, y compris leur inventaire ; aucune coupure réelle.
Neuvième, dixième et onzième lots restent **non commités**. Reprendre les notes
privées et le retour de séance dans le douzième lot ci-dessous, puis
notifications, dés et projection, écran par écran. Le JSON garde les 540 alertes initiales.

Le [douzième lot](2026-10-08-lint-notes-privees.md) traite les notes privées et
le retour de séance. La saisie et ses rappels appartiennent au personnage ;
la fermeture sauvegarde son dernier texte pour la bonne identité. Un écho
n'efface pas la nouvelle saisie et un rappel ne renvoie pas une version
dépassée par le magasin. Le retour est initialisé puis ajusté selon la clé de
la séance, avec vérification des valeurs lues ; onglets et repli gardent le
brouillon. Les délais et la forme des envois restent.
**Deux alertes d'effets retirées**, sans changement des règles : **1 554 fichiers,
zéro erreur et 362 avertissements**. Restent 353 `any` (130 applicatifs, 223 dans
les tests), **cinq effets**, trois diagnostics de mémoïsation et une directive inutile.
Types, construction, **23 tests ciblés** (21 nouveaux cas), **6 961 tests dans
544 fichiers** et **quatre scénarios Electron/tablette** passent aux largeurs
360, 390, 820 et 1 180 px. Captures dans un dossier temporaire séparé du manuel.
Lots 9 à 12 **non commités**. La notification est reprise dans le treizième lot
ci-dessous, avant les dés et la projection. Le JSON garde les 540 alertes initiales.

Le [treizième lot](2026-10-08-lint-notifications-tablette.md) traite le signal
de message de `TabletHub`. Le suivi reconnaît le nouveau message avant le
commit ; l'effet garde son échéance de cinq secondes. Un message étranger
n'annule plus cette échéance, une recopie du magasin ne la prolonge pas et
ne rejoue pas un signal expiré. Le contexte du personnage et les gardes des
rappels empêchent un ancien signal ou rappel de remplacer le courant.
Destinations, libellés, clic vers la bonne conversation et présentation restent.
**Une alerte d'effet retirée**, sans changement des règles : **1 556 fichiers,
zéro erreur et 361 avertissements**. Restent 353 `any` (130 applicatifs, 223 dans
les tests), **quatre effets**, trois diagnostics de mémoïsation et une directive inutile.
Types, construction, **21 tests ciblés** (20 nouveaux cas), **6 981 tests dans
545 fichiers** et **quatre scénarios Electron/tablette** passent aux largeurs
360, 390, 820 et 1 180 px. Les scénarios vérifient désormais aussi la réception
d'un message étranger pendant l'affichage et l'expiration du signal courant.
Captures temporaires séparées de celles du manuel. Lots 9 à 13 **non commités**.
Reprendre dés et projection, quatre effets dans trois fichiers, puis les autres
domaines/tests. Le JSON garde les 540 alertes initiales.

Publication demandée le 08/10 : **« commit, pousse et passe à l'étape suivante
(GM-OS est éteint) »**. Les lots 9 à 13 sont maintenant commités sous `38bd33c6`,
`020bae8e`, `b5a110e0`, `db052c6f` et `af2d6b2c` ; leurs mentions antérieures
« non commités » décrivent l'état avant cette demande. La
[note du jour](2026-10-08-etat-et-reprise.md) suit l'envoi avec le hook complet
et la reprise des dés. L'inventaire JSON initial reste inchangé.

Le push réussit jusqu'à **`861eaca4`**, après types, lint à 361 avertissements,
6 981 tests et construction dans le hook. Aucun changement de Claude inclus.

Le [quatorzième lot](2026-10-08-lint-deroule-des-des.md) traite l'affichage du
résultat et le maintien des dés. Le nouveau signal et l'identifiant du jet
ajustent l'état avant le commit ; les effets gardent les échéances, avec
nettoyage et gardes contre les anciens callbacks. Les durées restent : deux
secondes de maintien et cinq de lecture. La pose réarme aussi immédiatement
le filet : au plafond de quatre secondes, celui-ci ne ferme plus le résultat
avant la fin du maintien à six secondes. L'effacement réarme ensuite les cinq
secondes de lecture ; sans pose, le filet initial reste cinq secondes.
**Deux alertes d'effets retirées**, sans changement des règles : **1 559 fichiers,
zéro erreur et 359 avertissements**. Restent 353 `any` (130 applicatifs, 223 dans
les tests), **deux effets**, trois diagnostics de mémoïsation et une directive inutile.
Types, construction, **40 tests ciblés**, **6 999 tests dans 546 fichiers** et
**trois scénarios Electron** passent. 22 nouveaux cas de comportement remplacent
notamment quatre recherches dans le texte des effets, soit un gain net de 18 tests.
Vrai pont vers Player Hub, résultat 2D, jets successifs et vraie scène 3D ;
profils jetables, aucune capture documentaire remplacée. Ce lot est **non commité**.
Reprendre les deux effets de `ProjectorView`, puis les autres domaines/tests.
Le JSON garde les 540 alertes initiales.

Le [quinzième lot](2026-10-08-lint-projecteur.md) reprend le projecteur.
Sa source suit le magasin au rendu jusqu'au premier IPC d'image ; les
marqueurs se reconnaissent au rendu, et la détection asynchrone du blob
ignore les anciennes sources. L'adresse résolue porte son identité : une
vidéo attend son propre fichier. L'extinction conserve le fondu image de
700 ms et retire immédiatement les vidéos, y compris si leur type arrive
après l'ordre d'extinction. Abonnements et délais sont nettoyés ; une nouvelle
cible reprend un cycle indépendant. Volume et boucle suivent le bon média.
**Deux alertes d'effets retirées**, sans changement des règles : **1 562 fichiers,
zéro erreur et 357 avertissements**. **Aucune alerte `set-state-in-effect`
restante** ; restent 353 `any` (130 applicatifs, 223 dans les tests), trois
diagnostics de mémoïsation et une directive inutile. Types, construction,
**90 tests ciblés**, **7 025 tests dans 547 fichiers** et **six scénarios Electron**
passent. 26 nouveaux cas, profils jetables et cadre YouTube intercepté sans
accès au réseau ; aucune capture documentaire remplacée. Lots 14 et 15
**non commités**, dernier publié `861eaca4`.
Reprendre le typage des autres modules selon l'audit : projection
(`ImageService`, six `any`, `useImageStore`, cinq), puis Storyboard (douze dans
`StoryboardDashboard`) et les tests. Mémoïsation et directive gardent leurs
lots ciblés. Le JSON garde les 540 alertes initiales.

Le [seizième lot](2026-10-08-lint-projection-medias.md) type la projection.
`ImageService` lit le magasin par le registre déjà typé, sans import direct
qui refermerait un cycle. Les cibles du magasin restent des chaînes, sans
conversion `any`. Chemin envoyé et identité de la fiche restent distincts,
ainsi que projection locale et Hub, marqueurs et adresses, boucle avant
vidéo et extinction ciblée. **Onze `any` applicatifs retirés** : **1 563 fichiers,
zéro erreur et 346 avertissements**. Restent 342 `any` (119 applicatifs,
223 dans les tests), trois diagnostics de mémoïsation et une directive
inutile ; aucune alerte `set-state-in-effect`. Types, construction,
**179 tests ciblés** (17 nouveaux cas) et **7 042 tests dans 548 fichiers** passent.
**Sept scénarios Electron sont validés** : deux fondus Player Hub et cinq
projecteur, désormais via le vrai magasin et le service, avec volume du
magasin et un nouveau contrôle de fermeture/occupation après le noir.
Profils jetables, cadre YouTube intercepté, aucune capture documentaire
remplacée. Lots 14 à 16 **non commités**, dernier publié `861eaca4`.
Reprendre les douze `any` de `StoryboardDashboard.tsx`, puis les autres
modules/tests ; mémoïsation et directive gardent leurs lots ciblés.
Règles et JSON des 540 alertes initiales inchangés.

Sur la demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**,
les lots 14 à 16 sont maintenant commités localement : `f72243d0`,
`b08b836d`, `089ed4fe`, puis les quatre documents communs. Les mentions
précédentes « non commités » sont historiques. Les 23 fichiers Codex sont
sélectionnés explicitement, aucun changement de Claude inclus. Aucun push
demandé ni exécuté ; dernier poussé `861eaca4`. Reprendre Storyboard depuis
les **346 avertissements** et les **7 042 tests** validés du lot 16.
