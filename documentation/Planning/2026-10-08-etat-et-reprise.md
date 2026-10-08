# État et reprise — 2026-10-08

**Suite Trame : édition avancée des liens**, demande de David
**« met en place ces nouvelles options »**, fermeture de GM-OS confirmée.
[Périmètre, gestes et contrôles](2026-10-08-trame-edition-avancee.md) : commentaires,
trois accroches par côté, points de passage déplaçables ; aperçu puis Appliquer.
Types, construction, lint sans erreur, **6 802 tests et 18 scénarios Electron
distincts réussis** ; quatre captures relues.
Premier retour de David : **« les points de passage sont difficile à bouger,
ils ne se déplacent que vers le bas et par pas de 1 uniquement »**. Perte de
focus reproduite dans Electron : les cartes perdaient leurs mesures à chaque
aperçu et le moteur retirait temporairement les liens, interrompant aussi la
capture de souris. Mesures conservées, prise par le bord sans saut, inspecteur
stable. Le nouveau scénario vérifie quatre directions et deux zooms.
Après correction : types et construction réussis, lint global zéro erreur
(540 avertissements inchangés), **19 scénarios Electron distincts passent**.
Les 6 802 tests unitaires ci-dessus sont ceux de la validation du lot initial.
David confirme après son nouvel essai le 08/10 : **« c'est bon documente, commit
et push »**. L'édition avancée est close et sa publication est demandée ; les
modifications étrangères sont conservées hors du lot.

**Commit de réalisation : `84bc01c8`** — commentaires, accroches multiples,
trajets manuels et correction du déplacement. Documentation, guide 11 et
captures inclus ; le hook NotebookLM synchronise le guide actualisé.
Branche : `feature/tablet-hub-pwa`, destination demandée :
`origin/feature/tablet-hub-pwa`. Le push conserve le contrôle complet du hook
(types, lint global, tests avec quatre workers et construction).

Le lot précédent est clos et poussé sur `origin/feature/tablet-hub-pwa` :
`1d94f84f` (Trame), `ed29f301` (reprise), `57d0193c` (lint global), `05175124`
(clôture G7 et reprise). Les six dispositions ont été testées par David.
La note du [07/10](2026-10-07-etat-et-reprise.md) conserve l'historique des lots.
Les 540 avertissements du lint restent une dette visible, sans erreur bloquante.

Par quoi reprendre : aucune tâche de développement prévue pour ce lot Trame.
Le retour de David valide le déplacement corrigé. Ne pas rouvrir la validation
des six dispositions ni le correctif du parcours du lint.

## Audit des avertissements du lint

David demande **« peux-tu revoir les 540 avertissements et me faire un topos ? »**.
[Rapport et ordre de traitement](2026-10-08-audit-avertissements-lint.md),
[inventaire des 540 emplacements](2026-10-08-inventaire-avertissements-lint.json).
Comptage relancé : 1 527 fichiers, zéro erreur, 540 avertissements dans 132 fichiers.
497 `any` (273 hors tests, 224 dans les tests), 15 dépendances React, 20 mises
à jour d'état dans des effets, sept diagnostics de mémoïsation du compilateur,
une directive devenue inutile. Le rapport distingue les risques à vérifier,
les contrats déjà justifiés et les simples nettoyages ; aucun bug supplémentaire
n'est annoncé comme reproduit par cette seule lecture statique.

L'inventaire JSON conserve le diagnostic initial des 540 avertissements.

## Premier lot : dépendances React

David demande **« ok on commence suivant ton ordre »**, puis confirme que
**GM-OS est fermé**. Les 15 dépendances dans 12 fichiers sont corrigées ;
quatre diagnostics de mémoïsation associés disparaissent aussi.
[Modifications, essais et reprise](2026-10-08-lint-dependances-react.md).
Lint global : **1 530 fichiers, zéro erreur, 521 avertissements**. Les règles
restent inchangées ; `npm run build` (avec `tsc -b`) passe. Neuf tests de
régression sont ajoutés. Les contrôles ciblés et les six scénarios Electron
Dice-OS passent. La suite complète réussit : **6 811 tests dans 531 fichiers**,
un fichier et quatre tests ignorés. Le premier lot est validé.

Reprendre ensuite les contrats communs de typage, d'abord les signatures
d'assemblage des slices Session, puis les échanges entre magasins, Electron
et tablettes. Les effets par écran et le typage des tests viennent après.
David demande ensuite **« commit, pousse et passe à l'étape suivante (GM-OS est
éteint) »** : premier lot commité et poussé sous **`8c0e4aa9`** sur
`origin/feature/tablet-hub-pwa`, après validation complète du hook.
Les modifications
antérieures des guides, de la note du 07/10 et des deux fichiers à fins de
ligne différentes sont conservées hors du lot.

## Deuxième lot : contrats de Session et du pont Electron

[Contrats, contrôles et suite](2026-10-08-lint-contrats-session.md) : signature de
fusion partielle commune aux onze slices, assemblage sans ses 33 `any`,
SessionManager et gestionnaires transversaux typés, butin relié explicitement
au contexte de Session. Les accès au journal reprennent le type global existant.
Les 17 `any` des déclarations du pont Electron sont également retirés : journaux,
relais HTTP, action diffusée, platines musicales et moteur de dés.

TypeScript et construction passent ; 229 tests ciblés réussissent avant
l'élargissement au pont. Le lint global compte **1 531 fichiers, zéro erreur,
448 avertissements**, soit **73 `any` applicatifs retirés**. La suite complète
du lot final passe : **6 811 tests dans 531 fichiers**, un fichier et quatre
tests ignorés ; **sept scénarios Electron** de curation de Trame et de projection
du Hub passent avec des profils jetables. Publication de ce deuxième lot demandée
par David : **« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
Deuxième lot commité et poussé sous **`55e94341`**, sur
`origin/feature/tablet-hub-pwa`, après les contrôles complets du hook.
La suite porte sur les données de synchronisation du Hub et les messages entre
fenêtres/tablettes, puis sur les effets et les faux objets de tests.

## Troisième lot : actions Session reçues des tablettes

David demande de poursuivre et confirme **« GM-OS est éteint »**.
[Contrats, essais et reprise](2026-10-08-lint-actions-session-distantes.md).
Les signatures du registre et du dispatch reçoivent un `unknown`. Les handlers
Session relisent les données avant application : fiches, narration, objets,
messages, retours de séance et commandes de transfert. Les types de fiche et
de narration dérivent de Session. Les champs supplémentaires d'une narration
ne peuvent plus écraser les autres champs du personnage. La fusion des fiches,
les effacements volontaires et les chemins sans renvoi sont éprouvés.

**15 `any` applicatifs retirés** ; lint global **1 533 fichiers, zéro erreur,
433 avertissements**. Les règles restent inchangées. TypeScript et construction
passent ; 101 tests ciblés dans 13 fichiers passent, dont les **27 nouveaux
cas**. Suite complète : **6 838 tests dans 532 fichiers**, un fichier et
quatre tests ignorés. Trois scénarios Electron/tablettes à 390 px passent :
inventaire (don et retrait), messagerie (MJ/général/privé), notes et retour de
séance. Profils jetables, ports de test, appareils muets ; captures du manuel
conservées à l'identique. `git diff --check` passe.

**Troisième lot validé : six fichiers de code/tests et cinq documents.**
Publication demandée par David : **« commit, pousse et passe à l'étape suivante
(GM-OS est éteint) »**. Les changements antérieurs de Claude restent hors de ce lot.
Publication terminée : **`63cccdda`** sur `origin/feature/tablet-hub-pwa`,
après les contrôles complets du hook de pré-push.
Reprendre `useHubSync` : accès dynamique aux magasins et charge réelle de
synchronisation ; `RemoteSyncData` ne décrit pas tout ce qu'applique le Hub.
Puis `CrossWindowEventService` : préserver l'autorité de projection du MJ et
les positions des jetons saisis. Les 20 effets et les autres domaines/tests
viennent après. L'inventaire JSON conserve les 540 alertes initiales.

## Quatrième lot : magasins du Hub

[Contrat, essais et suite](2026-10-08-lint-magasins-hub.md). Un adaptateur
commun associe les douze noms de magasins à leurs états réels, par des imports
de types seuls. Les sélecteurs du Hub, les favoris/PNJ/lieux résolus et les
minuteurs sont typés. Les douze points d'exposition des magasins reprennent ce
contrat. Les abonnements gardent leur référence et les hooks leur nombre
fixe, y compris si un magasin apparaît tardivement.

**24 `any` applicatifs retirés** ; lint global **1 534 fichiers, zéro erreur,
409 avertissements**, sans abaisser les règles. TypeScript, construction et
**242 tests ciblés dans 14 fichiers** passent. **Six scénarios Electron/tablettes**
passent : les quatre gardes de remise à zéro du Player Hub, l'inventaire avec
don/retrait et la fiche avec PV/réserve à 390 px. Profils jetables, ports de
test, appareils muets ; captures préexistantes du manuel conservées à l'identique.
La suite complète de la version finale passe : **6 838 tests dans 532 fichiers**,
un fichier et quatre tests ignorés. `git diff --check` passe.

**Quatrième lot validé : quatorze fichiers de code et cinq documents.**
Publication demandée par David : **« commit, pousse et passe à l'étape suivante
(GM-OS est éteint) »**.
La reprise reste dans l'étape 2 de l'audit : typer les charges reçues par le
Hub en vérifiant ensemble le message construit par `useNexusSynchronizer`,
sa sérialisation et les magasins destinataires. Le DTO `RemoteSyncData` ne
décrit pas toutes les données reçues. Le crochet garde 17 `any` liés aux
charges et projections, ainsi que l'effet des dés ; ne pas affirmer un état
complet de magasin sur un message reconstruit et réduit. Puis reprendre
`CrossWindowEventService`, en conservant l'autorité du MJ et les jetons saisis.
Les effets et les autres domaines/tests viennent après. Les changements
antérieurs de Claude sont conservés hors de ce lot.

Publication terminée : **`777adc68`** sur `origin/feature/tablet-hub-pwa`, après
les contrôles complets du hook de pré-push.

## Cinquième lot : messages et projections du Hub

David confirme **« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
[Contrat, essais et reprise](2026-10-08-lint-messages-hub.md). Le message réellement
émis et les champs appliqués par le Hub partagent désormais un contrat de données,
sans méthodes de magasins. Les diffusions partielles conservent leurs absences ;
les projections d'entité/règle sont relues et les dates des jets restaurées.
L'émetteur transmet les factions et conserve une chaîne pour les portraits vides.

**20 `any` applicatifs retirés** : 17 du Hub, trois du caviardage à l'émission.
Lint global : **1 537 fichiers, zéro erreur, 389 avertissements**, règles inchangées.
Types, construction, **128 tests ciblés dans 14 fichiers**, **6 846 tests dans 533
fichiers** (un fichier et quatre tests ignorés) et **cinq scénarios Electron/tablettes**
passent. Huit nouveaux cas couvrent les diffs, réserves par campagne, jetons saisis,
dates, projections, charges mal formées et données envoyées sans secrets.
Les profils sont jetables, les appareils muets ; les captures de cette validation
vivent dans un dossier temporaire et ne remplacent aucune capture du manuel.

**Cinquième lot réalisé et documenté : sept fichiers de code/tests et cinq documents.**
Publication demandée par David : **« commit, pousse et passe à l'étape suivante
(GM-OS est éteint) »**. Reprendre `CrossWindowEventService` : contrats des messages,
autorité de projection du MJ, absence de renvoi et maintien des jetons saisis.
Les 20 effets et les autres domaines/tests viennent ensuite. L'inventaire JSON
conserve les 540 alertes initiales ; les modifications antérieures de Claude
restent hors du lot.

Publication terminée : **`43854adb`** sur `origin/feature/tablet-hub-pwa`, après
les contrôles complets du hook de pré-push.

## Sixième lot : échanges entre fenêtres

David confirme **« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
[Contrats, essais et reprise](2026-10-08-lint-echanges-fenetres.md). Les sept messages
locaux partagent un contrat avec leurs producteurs. Les enveloppes des deux voies
de transport sont relues ; le rôle reste établi par le relais. La garde de démarrage,
l'autorité du MJ, les verrous et l'absence de renvoi sont conservés. Les fusions
de carte s'appliquent sur une copie de la charge reçue.

**12 `any` retirés : 11 applicatifs et un dans les tests.** Lint global :
**1 539 fichiers, zéro erreur, 377 avertissements**, règles inchangées.
Types, construction, **120 tests ciblés dans huit fichiers** et **6 858 tests
dans 533 fichiers** (un fichier et quatre tests ignorés) passent. **Douze nouveaux
cas unitaires** et **un nouveau scénario Electron** couvrent les messages invalides,
la garde de démarrage, l'identité/rôle, les méthodes, les charges gelées et les
fusions. Les **13 scénarios Electron** passent : Map-OS, tableau blanc et véritable
relais MJ/Hub. Profils jetables, données fictives, appareils muets ; aucun artefact
du manuel régénéré. `git diff --check` passe.

**Sixième lot commité et poussé sous `513e4d94`**, sur `origin/feature/tablet-hub-pwa`,
après les contrôles complets du hook. David redemande **« commit, pousse et passe
à l'étape suivante (GM-OS est éteint) »**. Reprendre les **20 effets**, suivant l'étape 3 de l'audit : commencer
par les états dérivables et les initialisations, puis traiter les synchronisations
par écran. Conserver les durées des dés, les fondus, les notes et les projections ;
ne pas remplacer les effets par des temporisations pour faire taire le lint.
Les autres domaines et faux objets de tests suivent. L'inventaire JSON conserve
les 540 alertes initiales et les changements antérieurs de Claude restent hors du lot.

## Septième lot : saisies React

[Détail et reprise](2026-10-08-lint-saisies-react.md). Le sixième lot est publié
sous **`513e4d94`** ; la nouvelle demande de David porte aussi sur l'étape suivante.
Les quatre initialisations de saisie de l'audit sont traitées : prompt, invite IA,
montant des dégâts et sélection de recherche. Les brouillons vivent pendant
l'ouverture, les réinitialisations suivent le geste, et les changements de jet
ou de proposition ajustent l'état local sous une garde explicite. `SpotlightSearch`
ne réinitialise plus depuis son effet de fermeture.

Lint global : **1 543 fichiers, zéro erreur, 373 avertissements**, contre 377.
Quatre alertes d'effets retirées ; restent 353 `any`, **16 effets**, trois
diagnostics de mémoïsation et une directive inutile. Règles et inventaire JSON
initial inchangés. Types, construction, **18 tests ciblés dans quatre fichiers**
(**14 nouveaux cas**) et **6 872 tests dans 536 fichiers** passent ; un fichier et
quatre tests ignorés. **Huit scénarios Electron passent**, dont trois nouveaux
sur les vrais gestes de saisie/recherche et l'application du montant de dégâts.
Profils jetables, campagne fictive, appareils désactivés ; aucune génération IA
réelle ni capture du manuel remplacée. `git diff --check` passe.

**Septième lot réalisé et documenté, non commité : dix fichiers de code/tests
et cinq documents.** Reprendre les **16 effets restants**, d'abord les replis
asynchrones de bannière/correspondance et leur contexte, puis les autres replis
et synchronisations par écran. Conserver durées des dés, fondus, notes et
projections ; ne pas ajouter de minuteurs pour masquer les alertes. Le typage
des autres domaines et des faux objets de tests vient ensuite. Aucun gain de
fluidité n'est annoncé sans mesure. Les modifications antérieures de Claude
restent hors du lot.
