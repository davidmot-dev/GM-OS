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
