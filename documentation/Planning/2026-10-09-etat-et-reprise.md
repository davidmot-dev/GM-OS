# État et reprise — 2026-10-09

Reprise Codex à la demande de David : **« commit, pousse et passe à l'étape
suivante (GM-OS est éteint) »**, puis **« continue »**. Consignes dans
`AGENTS.md` et la [passation](2026-10-04-passation-claude-codex.md) ; état
précédent dans la [note du 08/10](2026-10-08-etat-et-reprise.md).

## Lot 23 commité et poussé

Deux sujets : **`c5935958`** (sept fichiers, correctifs chronologie/graphe/
inventaire), puis **`10cce98e`** (21 fichiers, interfaces/fiches et cinq documents).
Les 28 fichiers Codex précédemment en attente sont commités, sans modification
étrangère. Push réussi jusqu'à `10cce98e` sur `origin/feature/tablet-hub-pwa`,
avec les commits antérieurs depuis `861eaca4`. Hook complet réussi : types,
lint (1 572 fichiers, zéro erreur, 263 avertissements), **7 124 tests dans
556 fichiers**, construction. Un fichier et quatre tests ignorés.
Aucune modification dans `src/` ou `electron/` pendant le push.

## Lot 24 — IA et fournisseurs

[Contrats, contrôles et constats](2026-10-09-lint-ia-et-fournisseurs.md).
Les 15 avertissements du groupe sont repris : réponses et requêtes des
fournisseurs, options RAG, exceptions inconnues, méthode du magasin et
progression/conseils du Cortex, arguments MCP, réponses Hue et arbre documentaire.
Les modèles de conseils IA et automatiques sont distingués ; invites et
messages effectivement échangés conservés. `DocumentIA` est partagé par le
processus principal et le pont, sans import du renderer à l'exécution.

Gradio reçoit désormais `token`, l'option réellement lue par le SDK installé,
à la place de `hf_token` ignoré. Tests avec jeton artificiel ou absent. Les
erreurs atypiques sont relues sans accéder à une charge nulle ; les replis
de message restent distincts et paresseux. Ces écarts fonctionnels sont
explicités dans la note du lot, pas présentés comme de simples annotations.

**23 nouveaux cas dans quatre fichiers** passent, avec sorties simulées et
minuteurs pilotés. **Types et construction passent.** Lint global : **1 577
fichiers, zéro erreur et 248 avertissements**, contre 263, dont **244 `any`
(25 applicatifs, 219 dans les tests), trois diagnostics de mémoïsation et
une directive inutile. Règles et inventaire initial inchangés. **7 147 tests
dans 560 fichiers** passent, un fichier et quatre tests ignorés ;
`git diff --check` propre. Aucun profil réel, appareil ou réseau sollicité ; aucun scénario
Electron lancé. Aucun paquet installé ni service démarré.

Lot 24 réalisé, validé et documenté, **18 fichiers Codex non commités**
(13 de code/tests, cinq documents), dernier local et poussé **`10cce98e`**.
Reprendre **Relais et archives (10)**, puis calcul/recherche/audio (9),
messages d'erreur (5), le dé du Hub (1) après coordination, puis tests et
diagnostics ciblés. `HubDiceDisplay.tsx` reste étranger et intact ; demande
de coordination sans réponse, ne pas l'inclure dans un commit.

## Constat séparé à reprendre, § 1 bis du registre

`pdf-parse` installé (2.4.5) expose l'objet `PDFParse`, alors que les deux
chemins RAG attendent encore une fonction v1. Constat vérifié sur les exports
locaux, sans PDF réel. Les anciens replis et erreurs restent dans le lot de
typage ; les conversions locales du contrat historique ne réparent pas
l'incompatibilité. Prévoir un sujet séparé avec extraction/destruction et
essais sur PDF artificiels. Ne pas rouvrir les décisions du lot 23 ni rejouer
son push ; préserver les changements étrangers des guides et du 07/10.

## Lot 24 commité, reprise du lot 25

David demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
Les 18 fichiers Codex du lot 24 sont commités en **`2215836b`**, sans fichier
étranger. Aucun push demandé ni effectué ; dernier poussé `10cce98e`.
Les mentions « non commités » ci-dessus décrivent l'état antérieur à la demande.

Le [lot 25 relais et archives](2026-10-09-lint-relais-et-archives.md) retire
**10 `any` applicatifs** dans cinq fichiers. Le relais garde les charges brutes,
les contrôles d'appairage/propriété et les destinations P2P/MJ. App et magasins
globaux reprennent leurs vrais contrats ; l'injection Nexus est une mise à jour
partielle typée, avec les mêmes règles par campagne.

**269 tests ciblés dans 21 fichiers** passent, dont **18 nouveaux cas** dans
deux fichiers : transport/routage/refus/déconnexion et import des archives
anciennes, vides ou récentes. Sockets et magasins artificiels ; pas de serveur,
profil réel ou appareil utilisé par les nouveaux essais. Types et construction
passent. Lint : **1 578 fichiers, zéro erreur, 238 avertissements**, contre 248,
dont **234 `any` (15 applicatifs, 219 dans les tests)**, trois diagnostics de
mémoïsation et une directive inutile. Comptage recoupé dans le rapport final,
sans modification des règles ni de l'inventaire initial.

La suite complète passe : **7 165 tests dans 561 fichiers**, un fichier et
quatre tests ignorés. `git diff --check` propre. Lot 25 réalisé, validé et
documenté, **12 fichiers Codex non commités** (sept de code/tests, cinq documents).
Dernier local **`2215836b`**, dernier poussé **`10cce98e`**.

Prochain groupe **Calcul, recherche et audio (9)** : `useSpotlight` (3),
`useSheetCalculator` (2), `CalculationEngine` (2), `DiceUIUtils` et `ChimeEngine`
(1 chacun), puis messages d'erreur (5), dé du Hub (1) après coordination,
tests (219) et diagnostics ciblés. `HubDiceDisplay.tsx` reste étranger et intact ;
demande de coordination sans réponse. Ne pas l'indexer. Le constat PDF séparé
reste ouvert ; ne pas mélanger sa migration au retrait des prochains `any`.

## Lot 25 commité et poussé, lot 26 calcul/recherche/audio

David demande **« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
Les 12 fichiers Codex du lot 25 sont commités en **`567f94de`**. Push réussi
sur `origin/feature/tablet-hub-pwa`, de `10cce98e` jusqu'à `567f94de`, avec le
commit IA/fournisseurs `2215836b`. Hook complet réussi : types, lint zéro
erreur/238 avertissements, **7 165 tests dans 561 fichiers**, construction.
Un fichier et quatre tests ignorés ; aucun fichier étranger inclus, aucune
modification applicative pendant le push. Les mentions antérieures « non
commités » gardent l'état avant cette demande.

Le [lot 26 calcul, recherche et audio](2026-10-09-lint-calcul-recherche-et-audio.md)
retire **9 `any` applicatifs** dans cinq fichiers. La recherche reprend le
contrat documentaire partagé, la fiche ses données locales et le contexte
du calculateur, les couleurs le résultat du vrai moteur de dés et la cloche
son constructeur Web Audio avec repli local WebKit.

Les données libres de fiche restent inconnues jusqu'au parseur : ses types
excluent booléens et tableaux, mais son exécution les accepte. Conversion
limitée à l'appel du SDK, sans filtrage ni transformation ; valeurs locales,
zéros et retenue/relance des dés restent. **49 tests ciblés dans sept fichiers**
passent, dont **12 nouveaux cas** dans trois fichiers sur recherche, moteur et
vrai hook de calcul. Annotation d'une fixture corrigée ; les cinq cas du hook
repassent et son lint ciblé est propre. Types et construction passent.

Lint global : **1 579 fichiers, zéro erreur et 229 avertissements**, contre
238, dont **225 `any` (6 applicatifs, 219 dans les tests)**, trois diagnostics
de mémoïsation et une directive inutile. Comptage recoupé par fichier, règles
et inventaire initial inchangés. Aucun paquet installé ni service lancé.

La suite complète passe : **7 177 tests dans 562 fichiers**, un fichier et
quatre tests ignorés. `git diff --check` propre. Lot 26 réalisé, validé et
documenté, **13 fichiers Codex non commités** (huit de code/tests, cinq documents).
Dernier local et poussé **`567f94de`**.

Reprendre **Messages d'erreur (5)** : `ForgeDashboard`, `JournalDashboard`,
`useJournalStore`, `LootGeneratorPanel`, `useNotebookLM`. Puis le dé du Hub (1)
après coordination, tests (219) et diagnostics ciblés. `HubDiceDisplay.tsx`
reste étranger et intact, demande de coordination sans réponse ; ne pas
l'indexer. Migration PDF séparée au § 1 bis. Ne pas rejouer le push déjà réussi
ni rouvrir les règles de conversion ou de retenue des dés.

## Lot 26 commité et poussé, lot 27 messages d'erreur et Hub

David demande **« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
Les 13 fichiers Codex du lot 26 sont commités en **`b612123a`**, puis poussés
sur `origin/feature/tablet-hub-pwa`, depuis `567f94de`. Hook complet réussi :
types, lint zéro erreur/229 avertissements, **7 177 tests dans 562 fichiers**,
construction ; un fichier et quatre tests ignorés. Aucun fichier étranger
inclus, aucune modification applicative pendant le push. Les mentions
antérieures « non commités » gardent l'état avant cette demande.

Le [lot 27 messages d'erreur et Hub](2026-10-09-lint-messages-erreur-et-hub.md)
retire **les six derniers `any` applicatifs** : cinq exceptions deviennent
inconnues, et le Hub reprend le vrai `RollRecord | null` du magasin.
**David autorise le 09/10 : « Oui, corriger aussi le dernier `any` du Hub ».**
Ses fins de ligne existantes sont conservées ; les autres fichiers étrangers
restent intacts. L'attente de coordination mentionnée plus haut est levée.

Le lecteur de message commun garde les objets structurés et les replis
paresseux propres à chaque écran ; le magasin du journal retransmet l'exception
intacte. L'accès à `null.message` et les messages non textuels pouvaient
provoquer une seconde exception : gardes corrigées et effet fonctionnel
consigné au § 1 bis. La détection de `MCP_AUTH_EXPIRED` reste inchangée.

**84 tests ciblés dans huit fichiers** passent, dont **21 nouveaux cas dans
quatre fichiers**. Ils contrôlent messages/replis, identité de l'exception,
conservation du journal et de la saisie, et reprise après échec de NotebookLM
ou du butin. Pont et campagnes artificiels ; pas de service distant ou de
profil réel utilisés par les nouveaux essais. Pas d'essai Electron nécessaire
pour ces contrats. Types et construction passent. Lint : **1 584 fichiers,
zéro erreur et 223 avertissements**, dont **219 `any`, tous dans les tests**,
trois diagnostics de mémoïsation et une directive inutile. Règles et inventaire
initial inchangés ; aucun paquet installé ni service démarré manuellement.

La suite complète passe : **7 198 tests dans 566 fichiers**, un fichier et
quatre tests ignorés ; `git diff --check` propre. Contrôles sur les types,
le code et les tests finaux, sans rejouer de scénario Electron.

Lot 27 réalisé et documenté, **16 fichiers Codex non commités** (onze de
code/tests, cinq documents). Dernier local et poussé **`b612123a`**.
Reprendre les **simulations et fixtures des tests par contrats communs**,
en relisant le groupe relais/persistance partagée : les deux tests
`CrossWindowEventService` comptent 33 `any`, `persistanceDesStoresPartages`
en compte 12. Les 38 de `coutureDesFiches`, les 28 de `detenteurs` et les 27
des captures du manuel forment d'autres groupes à traiter séparément.
Puis les trois diagnostics de mémoïsation et la directive inutile.
Préserver les modifications étrangères des guides, du 07/10 et de l'e2e ;
ne pas rejouer le push réussi ni réorganiser les types d'erreur déjà validés.
La migration PDF v1/v2 du § 1 bis reste un sujet séparé.

## Lot 27 commité et poussé, lot 28 tests du relais et de la persistance

David demande **« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
Les 16 fichiers Codex du lot 27 sont commités en **`8e6a0939`**, puis poussés
sur `origin/feature/tablet-hub-pwa`, depuis `b612123a`. Hook complet réussi :
types, lint zéro erreur/223 avertissements, **7 198 tests dans 566 fichiers**,
construction ; un fichier et quatre tests ignorés. Aucun fichier étranger
inclus ni modification dans `src/` ou `electron/` pendant le push. Les mentions
antérieures « non commités » gardent l'état avant cette demande.

Le [lot 28 tests du relais et de la persistance](2026-10-09-lint-tests-relais-et-persistance.md)
retire **47 `any` de tests**, dans quatre fichiers : protocole du service (16),
harnais à deux fenêtres (17), transport (2) et persistance partagée (12).
États/callbacks issus des vrais magasins, messages émis discriminés, ponts
factices installés par Vitest et restaurés, fixtures complétées selon les
modèles réels. Les données mal formées et les rôles absents/inconnus restent
injectables pour tester les gardes. Aucun fichier applicatif modifié.

Une instance neuve dans les essais du volume des tracés remplace les deux
accès aux champs privés du service. La fabrique des cas de persistance garde
le lien entre chaque magasin, sa mise à jour et son témoin avant le tableau
hétérogène. Le JSON relu vient du stockage artificiel que le vrai magasin
vient d'écrire ; l'annotation d'enveloppe n'est pas un validateur d'import.

**140 tests ciblés dans neuf fichiers** passent, avec les assertions existantes
sur verrous, échanges, gardes, tracés et refus des écritures du Hub/projecteur.
Lint ciblé propre ; types et construction passent. Lint global : **1 584
fichiers, zéro erreur et 176 avertissements**, dont **172 `any`, tous dans
les tests**, trois diagnostics de mémoïsation et une directive inutile.
Comptage recoupé dans le rapport final ; règles et inventaire initial inchangés.
Aucun paquet installé ni service démarré manuellement.

La suite complète passe : **7 198 tests dans 566 fichiers**, un fichier et
quatre tests ignorés ; `git diff --check` propre. Contrôles sur les tests finaux,
sans essai Electron ni donnée réelle utilisée dans les tests modifiés.

Lot 28 réalisé, validé et documenté, **neuf fichiers Codex non commités** (quatre tests,
cinq documents). Dernier local et poussé **`8e6a0939`**.
Reprendre **la couture des fiches (38)**, dans `electron/coutureDesFiches.test.ts` :
vrai moteur HTML chargé en JSDOM, faux IndexedDB et surface de lecture/écriture
à typer sans remplacer le moteur testé. Puis purge/détenteurs (28) et autres
groupes de tests ; captures du manuel (27) distinctes. Terminer ensuite les
trois diagnostics de mémoïsation et la directive inutile.
Préserver les fichiers étrangers des guides, du 07/10, de l'e2e et de `.claude`.
Ne pas rejouer le push réussi ni retirer les essais de messages hors contrat.
La migration PDF v1/v2 reste séparée au § 1 bis.

## Lot 28 commité, lot 29 couture des fiches

David demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
Les neuf fichiers Codex du lot 28 sont commités en **`853a9a28`**, sans fichier
étranger. **Aucun push demandé ni effectué** ; dernier poussé **`8e6a0939`**.
Les mentions antérieures « non commités » gardent l'état avant cette demande.

Le [lot 29 couture des fiches](2026-10-09-lint-couture-des-fiches.md) retire
**38 `any`** dans `electron/coutureDesFiches.test.ts`. Le vrai moteur HTML
reste chargé, avec gabarit et IndexedDB artificiels. Fenêtre et DOM typés,
requêtes génériques, événements issus du contrat existant et messages de
réponse dont le résultat reste inconnu. Lectures gardées et corrélation par
identifiant ; les attentes asynchrones restent distinctes des réponses requises.
Les assertions existantes sont conservées, dont restauration sans effacement,
redessin, désabonnement, copie des données et refus des demandes invalides.

L'import initial des types depuis le pont entraînait son code renderer dans
le projet Electron et deux erreurs `appBridge`. Les **sept interfaces** sont
déplacées à l'identique dans `contratsDeLaFiche.ts`, fichier de types sans
dépendance d'exécution ; le pont réexporte les mêmes noms. Reste de son
implémentation vérifié inchangé, sans assouplir TypeScript ni modifier le
moteur HTML ou les constructeurs. Le test vérifie bien neuf fonctions, pas
huit comme son ancien libellé le disait.

**132 tests ciblés dans huit fichiers** passent. Lint ciblé propre ; types
et construction passent après extraction des interfaces. Lint global :
**1 585 fichiers, zéro erreur et 138 avertissements**, dont **134 `any`, tous
dans les tests**, trois diagnostics de mémoïsation et une directive inutile.
Comptage recoupé par fichier, règles et inventaire initial inchangés. Aucun
profil réel, paquet installé, service lancé ou scénario Electron utilisé.

La suite complète passe : **7 198 tests dans 566 fichiers**, un fichier et
quatre tests ignorés ; `git diff --check` propre. Tous les contrôles globaux
portent sur les fichiers finaux après extraction des interfaces.

Lot 29 réalisé, validé et documenté, **huit fichiers Codex non commités** (trois de
code/tests, cinq documents). Dernier local **`853a9a28`**, dernier poussé
**`8e6a0939`**. Reprendre **purge/détenteurs (28)** dans
`src/services/purge/detenteurs.test.ts`, puis les autres groupes de tests par
contrat. Contexte Oracle (12), enregistrement SyncServer (9), captures du
manuel (27) distinctes ; ensuite mémoïsation et directive.
Préserver les fichiers étrangers ; ne pas changer le moteur HTML ni rouvrir
les interfaces partagées. La migration PDF v1/v2 reste séparée au § 1 bis.

## Lot 29 commité, lot 30 purge/détenteurs

David demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
Le lot 29 est commité en **`c282f2f7`**, ses huit fichiers Codex uniquement ;
dernier poussé `8e6a0939`. Les anciennes mentions « non commités » sont historiques.

Le [lot 30](2026-10-09-lint-purge-detenteurs.md) retire les **28 `any`** du seul
test des détenteurs. Les magasins factices reprennent les types des modèles et
des projections des champs exercés ; les callbacks de suppression sont typés,
les cartes à contenu opaque restent inconnues. Le lecteur de détenteur conserve
la cible générique et refuse explicitement un module absent. Fixtures, assertions,
recensement fautif et espions sans cascade réelle restent en place. Aucun code
applicatif ni donnée réelle modifié.

**21 tests de purge/complétude passent**, types globaux et lint ciblé propres.
La construction et les 7 198 tests globaux restent les contrôles du lot 29 ;
le lot 30 ne modifie qu'un harnais de tests et ne les rejoue pas.
Lint global : **1 585 fichiers, zéro erreur et 110 avertissements**, dont
**106 `any`, tous dans les tests**, trois diagnostics de mémoïsation et une
directive inutile. Comptage recoupé par fichier/règle ; `git diff --check` propre.

**Six fichiers Codex non commités**, un test et cinq documents. Reprendre
**contexte Oracle (12)**, puis enregistrement SyncServer (9), autres tests et
diagnostics ciblés. Captures du manuel distinctes, migration PDF au § 1 bis.
Préserver les fichiers étrangers ; ne pas transformer les espions en vraies
purges ni refaire les contrats de la couture des fiches.

## Lot 30 commité, lot 31 contexte Oracle

David demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
Les six fichiers du lot 30 sont commités en **`e377d82c`**, sans fichier étranger.
Dernier poussé `8e6a0939` ; les mentions « non commités » précédentes sont historiques.

Le [lot 31](2026-10-09-lint-contexte-oracle.md) retire les **12 `any`** du test
du contexte Oracle. Quatre fonctions de lecture typées et des projections des
états réels remplacent les conversions des magasins incomplets. Santé/initiative
absentes et carte non chargée restent des cas explicites ; le `null` du cortex
reste local aux simulations. Le typage révèle le rôle de fixture `Villain`, hors
contrat ; il devient `hostile`, sans changer le modèle applicatif. Les trois
scénarios et leurs 13 assertions sont conservés, code du hook inchangé.

**43 tests ciblés dans trois fichiers passent** après correction, types globaux
et lint ciblé propres. Lint global : **1 585 fichiers, zéro erreur et 98
avertissements**, dont **94 `any`, tous dans les tests**, trois diagnostics de
mémoïsation et une directive inutile. Comptage recoupé ; `git diff --check` propre.
Construction et suite complète restent les contrôles du lot 29, sans les rejouer
pour ce harnais uniquement.

**Six fichiers Codex non commités**, un test et cinq documents. Reprendre
**enregistrement SyncServer (9)**, puis autres tests par contrat (extraction JSON
8, RAGService 7) ; captures du manuel distinctes. Préserver les fichiers étrangers,
garder la migration PDF au § 1 bis et ne pas inventer de santé pour typer un test.

## Lot 32 regroupé — IA/RAG et messages

David demande **« essaie de regrouper les erreurs "any" pour accélérer un peu
les corrections sans pour autant perdre en qualité »**. Aucun commit demandé ;
le lot 31 reste en attente, dernier local `e377d82c`, dernier poussé `8e6a0939`.

Le [lot 32](2026-10-09-lint-lots-ia-et-messages.md) retire **37 annotations dans
huit tests** : IA/RAG (18) et messages serveur/tablettes/fiches (19). Lectures et
espions reprennent les signatures existantes, résultats JSON gardés comme inconnus,
messages inspectés avant lecture. Cas invalides d'autorisation et santé absente
conservés. Aucun code applicatif changé ni règle désactivée. 53 noms de cas et
76 expressions d'assertion conservés ; mêmes attentes après relecture.

**75 tests ciblés dans onze fichiers passent**, types globaux et lint ciblé propres.
Lint global : **1 585 fichiers, zéro erreur et 61 avertissements**, dont **57 liés
aux `any`**. Comptage brut : **58 annotations dans les tests**, dont une déjà masquée
par directive dans NexusService ; elle reste à traiter dans le groupe archives.
Trois diagnostics de mémoïsation et une directive inutile. La suite complète passe :
**7 198 tests dans 566 fichiers**, un fichier et quatre tests ignorés.
`git diff --check` propre ; construction non rejouée pour ces harnais uniquement.

**Quinze fichiers Codex non commités au total**, neuf tests et six documents.
Reprendre par groupes : règles/jets/fixtures (16), archives/session (7 avertissements
et 8 annotations), inventaires/catalogues (7), captures du manuel (27), puis
diagnostics ciblés. Préserver les fichiers étrangers ; migration PDF au § 1 bis.

## Publication des lots 31–32 et lot 33 — règles/jets/fixtures

David demande « commit, pousse et passe à l'étape suivante (GM-OS est éteint) ».
Les quinze fichiers Codex des lots 31–32 sont commités et poussés sous
**`d0fd965b`**. Le hook passe : types, lint (61 avertissements, zéro erreur),
**7 198 tests dans 566 fichiers** (un fichier et quatre tests ignorés),
construction. Les fichiers étrangers restent hors du commit.

Le [lot 33](2026-10-09-lint-regles-jets-et-pilotes.md) retire **16 `any` dans
six tests** de règles, jets et pilotes. Projections des contrats existants et
espions typés ; fixtures Cortex et fournisseur Ollama corrigées, attentes
conservées. Noms des scénarios et 154 expressions d'assertion inchangés.
Aucun code applicatif ni règle de lint modifié.

Types, lint ciblé et **119 tests dans neuf fichiers** passent. Lint global :
**1 585 fichiers, zéro erreur, 45 avertissements** (41 `any`, trois diagnostics
de mémoïsation, une directive inutile). **42 annotations dans les tests**,
dont une déjà masquée. Le comptage syntaxique complet trouve également **cinq
annotations applicatives déjà masquées** : quatre Storyboard, une PDF. Les
mentions antérieures « zéro `any` applicatif » concernaient les avertissements.
`git diff --check` propre ; pas de nouvelle suite complète ou construction
après ce lot de harnais.

**Onze fichiers Codex non commités**, six tests et cinq documents. Dernier
local et poussé : **`d0fd965b`**. Reprendre archives/session (7 avertissements,
8 annotations), inventaires/catalogues (7), captures (27), puis mémoïsation
et directive. Revoir les quatre annotations masquées du Storyboard séparément ;
PDF v1/v2 reste au § 1 bis. Préserver les fichiers étrangers.

## Commit du lot 33 et lot 34 — archives/session

David demande « commit et passe à l'étape suivante (GM-OS est éteint) », puis
« continue ». Les onze fichiers Codex du lot 33 sont commités sous
**`96a80f0b`**. Dernier poussé **`d0fd965b`**, un commit local d'avance.
Les modifications étrangères restent hors du commit.

Le [lot 34](2026-10-09-lint-archives-et-session.md) retire **huit annotations
dans trois tests**, dont une déjà masquée dans NexusService. Espions Session
avec signatures réelles, projections des fixtures partielles, discrimination
objet/fonction des écritures Nexus et Session ; indexeur inutile de FakeStorage
retiré. Les données absentes restent absentes. La directive `no-explicit-any`
correspondante et la directive `no-unused-vars` inutile de Nexus sont retirées.
Aucun code applicatif ni règle de lint modifié. Les **78 scénarios et 143
expressions d'assertion** sont conservés.

Types et lint ciblé propres ; **145 tests dans huit fichiers passent** sur les
sources finales. Lint global : **1 585 fichiers, zéro erreur, 37 avertissements**
(34 `any`, trois diagnostics de mémoïsation). Comptage brut : **39 annotations**,
34 dans les tests, cinq applicatives déjà masquées. `git diff --check` propre,
21 fichiers étrangers inchangés par empreinte. Suite complète et construction
non rejouées pour ce harnais uniquement.

**Huit fichiers Codex non commités**, trois tests et cinq documents. Dernier
local **`96a80f0b`**, dernier poussé **`d0fd965b`**. Reprendre inventaires/
catalogues (7), captures (27), mémoïsation (3), puis annotations masquées du
Storyboard (4). PDF v1/v2 reste au § 1 bis ; préserver les fichiers étrangers.
