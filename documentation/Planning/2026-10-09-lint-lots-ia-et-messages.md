# Lot 32 du lint — regrouper IA/RAG et messages

David demande **« essaie de regrouper les erreurs "any" pour accélérer un peu
les corrections sans pour autant perdre en qualité »**. Aucun commit ou push
demandé pour cette étape. Dernier local **`e377d82c`**, dernier poussé **`8e6a0939`**.
Le lot 31 contexte Oracle reste non commité et ses fichiers sont conservés.
GM-OS a été déclaré éteint avant le lot 31, sans nouvel essai annoncé depuis.

## Deux groupes, une validation finale

| Groupe | Fichier | `any` retirés |
| --- | --- | ---: |
| IA/RAG | `src/modules/ai/__tests__/JSONExtraction.test.ts` | 8 |
| IA/RAG | `src/modules/ai/__tests__/RAGService.test.ts` | 7 |
| IA/RAG | `src/modules/ai/__tests__/AIService.test.ts` | 3 |
| Messages | `electron/SyncServer.register.test.ts` | 9 |
| Messages | `src/modules/remote/hooks/useRemoteSync.test.ts` | 4 |
| Messages | `src/components/__tests__/TabletHub.test.tsx` | 3 |
| Messages | `src/modules/fiches/pontDeLaFiche.test.ts` | 2 |
| Messages | `src/modules/combat/useCombatStore.sync.test.ts` | 1 |

**37 annotations retirées dans huit tests**. Aucun code applicatif changé,
aucune règle désactivée ou configuration de lint/types assouplie.

### IA/RAG : résultats inconnus et dépendances partielles

Le parseur JSON privé est appelé via une surface locale limitée à sa signature,
avec retour `unknown`. Les objets/tableaux imbriqués sont gardés avant lecture ;
les attentes sur HP, premier tag et seconde section restent. Réponses vides,
JSON imbriqué, réparation des guillemets et absence de corruption restent testés.
Le service réel continue de parser les mêmes textes.

Les lectures de magasins RAG et IA sont des fonctions typées, avec projections
des états existants. Le proxy reprend la signature du pont ; les recherches
reprennent ses paramètres et gardent le retour historique en chaîne, que le
service accepte encore. Recherche absente et interdiction de déplacer la racine
du corpus restent éprouvées. Les espions sont inspectés directement, sans
prétendre fournir un pont complet via une conversion de type.

Les fixtures IA ne portent plus `getApiKey`, méthode ancienne absente du magasin
actuel et inutilisée par le service : seul `aUneCle` indique la présence d'une clé.
Les réponses artificielles et les assertions d'absence des en-têtes de clé restent.
Le premier contrôle de types relevait le caractère facultatif d'`appBridge`/`ai` ;
les signatures sont extraites via `NonNullable` uniquement au niveau des types.
La simulation de recherche absente utilise son objet local, sans forcer un accès
au pont global facultatif.

### Messages : simulations typées, refus conservés

L'espion d'envoi au MJ est conservé séparément de la fenêtre Electron partielle.
Les sockets enregistrent des chaînes, décodées comme valeurs inconnues ; le
lecteur de `remote:error` vérifie son code. Les points d'entrée privés continuent
de recevoir des charges inconnues : rôles non textuels, usurpation de personnage,
absence/mauvais jeton et ancien secret ne disparaissent pas des tests.

Le constructeur WebSocket factice reçoit ses constantes via `Object.assign`,
avec les mêmes valeurs et le même retour. Fusion des mises à jour et délais de
reconnexion restent vérifiés, sans ouvrir de socket réel.

La fabrique des magasins du TabletHub est générique sur l'état : lecture entière
ou résultat du sélecteur. La conversion locale ne décrit que cette double forme,
implémentée par la fonction factice ; elle ne prétend pas fournir un vrai magasin
Zustand. Les données et les espions de persistance/abonnement ne changent pas.

Le faux moteur de fiche vérifie canal/verbe/identifiant avant de retenir la demande
originale ; le contenu reste `unknown`. Réponses désordonnées, mauvais émetteur,
autre canal, délai, refus et fermeture gardent leurs assertions. Le relais global
Combat→Session reçoit une projection d'état et les signatures des actions réelles.

## Contrôles

Comparaison TypeScript avec les sources initiales : **37 `AnyKeyword` avant,
zéro après**, noms des **53 cas** conservés, **76 expressions d'assertion** avant
et après. Relecture des attentes : mêmes valeurs et mêmes refus ; seuls leurs
accès passent par gardes ou références d'espions typées.

**75 tests ciblés dans onze fichiers passent** : les huit corrigés, le contexte
Oracle, les contrats des fournisseurs et la racine du corpus. Le passage final
suit la correction des références de types au pont facultatif.
`npx tsc -b` passe ; lint ciblé propre.

Lint global : **1 585 fichiers, zéro erreur et 61 avertissements**, contre 98.
Ce sont **57 avertissements `any`**, trois diagnostics de mémoïsation et une
directive inutile. **Le code contient 58 annotations `any` dans les tests** :
une annotation supplémentaire est déjà masquée dans `NexusService.test.ts` par
une directive `no-explicit-any` sur le callback de `setStateSpy.mock.calls.find`.
Elle est comptée à la reprise ; aucune nouvelle directive ajoutée. Zéro `any`
applicatif. Les anciens comptes de 94/106 désignaient les annotations signalées
par le lint, sans cette exception existante.

La suite complète passe : **7 198 tests dans 566 fichiers**, un fichier et quatre
tests ignorés. Un seul passage global pour ce lot plus large, sur les sources
finales après contrôle ciblé. `git diff --check` propre.
Construction non rejouée pour des harnais uniquement.
Aucun e2e, profil réel, paquet installé ou service démarré.

## Reprise par groupes

1. **Règles, jets et fixtures de pilotes — 16 avertissements, six fichiers** :
   DebugCalculation (5), schemaDuGabarit (3), ControlPanel (3),
   DiceEngineAlignment (2), ForgeService (2), moteursDuJet (1).
2. **Archives/session — 7 avertissements, huit annotations, trois fichiers** :
   NexusService (4 signalées + 1 masquée), SessionManager (2), storageDiagnostics (1).
3. **Inventaires/catalogues — 7 avertissements, deux fichiers** :
   inlinedMediaKeys (4), catalogueDesEffets (3).
4. **Captures du manuel — 27 avertissements**, lot distinct : typage du harnais
   Electron, puis captures et relecture des images selon le protocole du dépôt.
5. Trois diagnostics de mémoïsation et directive inutile, après les groupes typés.

Ces groupes sont des périmètres à relire avant correction, pas une invitation
à partager des types artificiels entre domaines. Une fixture partielle garde
sa surface explicite ; un résultat inconnu se garde à la lecture.

**Quinze fichiers Codex non commités au total** : les six du lot 31, huit tests
du lot 32 et cette note (les trois documents d'état communs sont mis à jour).
Dernier local `e377d82c`, dernier poussé `8e6a0939`. Préserver les fichiers étrangers
des guides, du 07/10, de l'e2e et de `.claude`. Migration PDF v1/v2 séparée au § 1 bis.

## Publication et suite — 09/10

À la demande de David, les quinze fichiers Codex des lots 31–32 sont commités
et poussés sous **`d0fd965b`**. Le hook pré-push passe : types, lint global
(61 avertissements, zéro erreur), **7 198 tests dans 566 fichiers** (un fichier
et quatre tests ignorés), construction. Les modifications étrangères restent
hors du commit.

Le [lot 33 règles/jets/fixtures](2026-10-09-lint-regles-jets-et-pilotes.md) retire
ensuite **16 `any` dans six tests**, sans changement applicatif. Types, lint
ciblé et **119 tests dans neuf fichiers** passent ; lint global : **45
avertissements, zéro erreur**. Il reste 42 annotations dans les tests (41
signalées, une masquée). Le comptage direct trouve aussi cinq annotations
applicatives déjà masquées : quatre Storyboard et une PDF. « Zéro applicatif »
dans l'état précédent désignait les avertissements. Onze fichiers Codex du
nouveau lot restent non commités ; reprendre archives/session (8 annotations).
