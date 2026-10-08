# Vingt-deuxième lot du lint — corrections regroupées par contrat

David demande le 08/10 **« essaie de regrouper les erreurs "any" pour accélérer
un peu les corrections sans pour autant perdre en qualité »**, puis confirme
que GM-OS est fermé. Les `any` concernés sont des avertissements ; le lint
de départ confirme **1 565 fichiers, zéro erreur et 306 avertissements** :
80 `any` applicatifs, 222 dans les tests, trois diagnostics de mémoïsation
et une directive inutile.

Le lot 21 dés/gemmes reste validé et non commité. Dernier commit local :
**`fd585aaf`**, dernier poussé documenté : `861eaca4`. Aucun commit ni push
demandé pour cette reprise. Les modifications de Claude sont conservées.

## Méthode retenue

Un lot regroupe les fichiers qui partagent des contrats et des gestes à
vérifier. Les types réels sont repris aux frontières, les entrées reçues
restent `unknown` et les faux objets invalides restent testables. Chaque groupe
passe ses essais ciblés ; types, lint, construction et suite complète sont
exécutés une fois pour le lot livré. Rejouer un contrôle seulement après une
modification qui le concerne ou un échec. La mémoïsation et la directive
gardent leurs lots ciblés. Aucune baisse de règle ou nouvelle suppression.

## Lot réalisé : commandes et synchronisation

**18 `any` applicatifs et trois dans les tests retirés**, dans un même lot :

- Les six domaines d'actions distantes reprennent la signature `unknown`
  du registre commun : audio (2), scènes (3), combat, dés, tables et tableau
  blanc (1 chacun). Les contrats métier déjà présents restent ; aucune
  validation d'exécution, formule ou règle d'autorisation n'est ajoutée.
- Six accès/expositions globaux reprennent directement les déclarations
  existantes de `window.d.ts` : pont combat, moteur Music, magasin Journal,
  magasin Session dans Persistence et deux accès Hue dans SpatialTrigger.
  Les gardes et accès dynamiques restent, sans import de moteur supplémentaire.
- Les deux lectures de la comparaison récursive deviennent des valeurs
  `unknown` d'un objet déjà relu. Ordre des clés, tableaux et dates restent.
- Le choix d'écran du pad web transmet directement sa chaîne : le vrai
  contrat `ProjectionTarget` l'accepte déjà.
- Les trois entrées invalides du test de routage passent par une seule
  conversion depuis `unknown` vers le paramètre réel du répartiteur.
  Champs absents, valeur nulle et type numérique restent effectivement essayés.

Ces changements de types ne modifient ni les commandes reçues, ni les
charges diffusées, ni la persistance ou l'ordre des recherches. Ils ne
durcissent pas la validation historique des actions. Aucun son, lampe,
serveur ou profil réel sollicité.

## Contrôles

**765 tests ciblés dans 80 fichiers** passent, couvrant les actions distantes,
la comparaison différentielle, Persistence, Music, Combat, Journal, Map et Web.
Deux fichiers ajoutent **22 cas** : 19 sur les vraies commandes audio/scènes/
tableau blanc avec sorties simulées, trois sur la vraie garde de relecture
entre fenêtres avec magasin global simulé. Les cas protègent les alias,
l'ancien identifiant de bruitage, les volumes, les coordonnées à zéro du ping,
l'index du moment limité à la campagne, la priorité musique/son/image/ambiance,
l'identité du tracé et l'absence de relecture pendant une synchronisation atomique.

Types et construction passent. Lint global : **1 567 fichiers, zéro erreur
et 285 avertissements**, contre 306. Restent **281 `any`** : **62 applicatifs
et 219 dans les tests**, trois diagnostics de mémoïsation et une directive
inutile. Règles et inventaire JSON initial inchangés. Aucun scénario Electron
nécessaire pour ces changements de types ; les sorties des nouveaux essais
sont simulées et aucun fichier réel n'est lu ou écrit.
Suite complète : **7 108 tests dans 552 fichiers** passent, un fichier et
quatre tests ignorés. `git diff --check` passe.

## Cinq groupes pour les 62 `any` applicatifs restants

Comptage vérifié par fichier dans le lint final et recoupé avec le code.
Chaque emplacement apparaît dans un seul groupe : le `catch` de Journal,
encore présent, relève des messages d'erreur ; son exposition globale est
déjà traitée ci-dessus. Les `any` désactivés par des directives existantes
ne sont pas inclus dans ce compteur d'avertissements.

| Ordre | Groupe | `any` | Fichiers et contrôles communs |
| --- | --- | ---: | --- |
| 1 | Interfaces et fiches | 23 | 17 fichiers : widgets horloge (3), dés (1), inventaire (2), cartes/contrôles combat (3), santé (2), détail/galerie NPC (2), lecteurs de règles (2), éditeurs de gabarit (2), graphe social (1), formulaire/vue de chronologie (3), éditeur de personnage (1), types de pilote (1). Reprendre les traductions, unions de navigation, événements, champs de fiche et types du graphe. |
| 2 | IA et fournisseurs | 15 | `AIService.ts` (8), `useTacticalAIStore.ts` (3), `ForgeService.ts` (1), `HueEngine.ts` (1), `electron/RAGEngine.ts` (2). Contrats des réponses et appels, états du moteur tactique, fichiers du corpus ; clients/réseau simulés. |
| 3 | Relais et archives | 10 | `electron/SyncServer.ts` (6), `App.tsx`, `LobbyMonitor.tsx`, `useFavoriteStore.ts`, `archive/NexusService.ts` (1 chacun). Messages et clients, autorisations, identités et charges de projection/restauration ; profils artificiels. |
| 4 | Calcul, recherche et audio | 9 | `useSpotlight.ts` (3), `useSheetCalculator.ts` (2), `CalculationEngine.ts` (2), `DiceUIUtils.ts`, `ChimeEngine.ts` (1 chacun). Arbres documentaires, contexte de formule, résultat de dé et constructeur audio historique ; replis conservés. |
| 5 | Messages d'erreur | 5 | Un `catch` dans `ForgeDashboard.tsx`, `JournalDashboard.tsx`, `useJournalStore.ts`, `LootGeneratorPanel.tsx`, `useNotebookLM.ts`. Entrées `unknown`, extraction des messages selon les contrats réels et conservation des diagnostics/replis. |

Le groupe Interfaces inclut `HubDiceDisplay.tsx`, déjà modifié hors Codex :
**ne pas y écrire avant coordination**, conformément à AGENTS.md. Ce fichier
est conservé intact dans le lot présent ; les autres fichiers du groupe peuvent
être traités sans attendre son écriture. Les groupes sont des sujets de revue,
pas une obligation de transformer en une fois tout un moteur complexe.

## Reprise

Lot 22 réalisé, validé et documenté, **non commité : 21 fichiers Codex**, 17 de
code/tests et quatre documents. Avec les huit fichiers du lot 21 et les trois
documents communs, **26 fichiers Codex restent non commités**.
Reprendre le groupe Interfaces et fiches, puis les quatre autres groupes ;
les 219 `any` des tests viennent après les contrats applicatifs. Vérifier les
compteurs au lint à chaque lot, préserver les changements de Claude.

## Reprise suivante — commits et groupe interfaces/fiches

Le 08/10, David demande **« commit et passe à l'étape suivante (GM-OS est
éteint) »** : les lots 21–22 sont commités séparément, **`093c4203`** (cinq
fichiers) et **`6d22466d`** (21 fichiers, dont trois documents communs), sans
push ni modification étrangère incluse. Les mentions « non commité »
ci-dessus décrivent l'état avant cette demande.

Le [lot 23 interfaces et fiches](2026-10-08-lint-interfaces-et-fiches.md)
retire 22 des 23 avertissements du premier groupe ; `HubDiceDisplay.tsx`
reste en attente de coordination. Lint : **263 avertissements, zéro erreur**,
dont **40 `any` applicatifs et 219 dans les tests**. Types et construction
passent ; contrôles et état de clôture dans la note du lot 23.
La prochaine étape est le groupe **IA et fournisseurs (15)**.
