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
