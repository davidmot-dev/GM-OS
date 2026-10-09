# Vingt-sixième lot du lint — calcul, recherche et audio

David demande **« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
Le lot 25 relais/archives est commité en **`567f94de`** (12 fichiers Codex).
Push réussi sur `origin/feature/tablet-hub-pwa`, de `10cce98e` jusqu'à `567f94de`,
avec le commit IA/fournisseurs `2215836b`. Le hook complet passe : types,
lint zéro erreur/238 avertissements, **7 165 tests dans 561 fichiers** et
construction. Un fichier et quatre tests ignorés. Aucun fichier étranger inclus,
aucune modification applicative pendant le push.

## Les neuf avertissements du groupe

- `useSpotlight.ts` (3) : état et parcours récursif issus de `DocumentIA`, le
  contrat partagé du pont IA. L'accumulateur conserve l'ordre de l'arbre et
  tous les fichiers ; aucun filtre d'extension ajouté.
- `useSheetCalculator.ts` (2) : données locales issues de `PlayerCharacter.sheetData`
  et contexte du calculateur. Priorités local/enregistré/défaut, conversion
  numérique des champs déclarés et normalisation des libellés inchangées.
- `CalculationEngine.ts` (2) : `ContexteDeCalcul` décrit les données libres
  par `Record<string, unknown>`, repris par le hook. Les valeurs sont copiées
  avec nettoyage des clés `@`, puis transmises telles quelles au parseur.
- `DiceUIUtils.ts` (1) : résultat `DieResult` du vrai moteur, sans modification
  des classes CSS ni des priorités explosion/critique/source du dé.
- `ChimeEngine.ts` (1) : constructeur Web Audio standard et repli WebKit
  décrits localement. Priorité, création paresseuse et réutilisation du contexte
  restent, comme les cinq fréquences et la décroissance de quatre secondes.

Les déclarations installées d'`expr-eval` excluent les booléens et tableaux
pourtant acceptés à l'exécution. Une vérification locale avec valeurs artificielles
confirme condition booléenne, longueur de tableau, propriété d'objet et fonction
personnalisée. La conversion vers `Values` est donc limitée à l'appel du SDK ;
elle **ne valide pas** les données de fiche. Filtrer ou transformer ces valeurs
ferait régresser des formules existantes. Le repli à zéro des erreurs et la
mémoire des dés par champ restent. Aucun paquet installé, règle abaissée ou
nouvelle directive de lint ajoutée ; aucun fichier de fiche réécrit.

## Contrôles ciblés

**49 tests dans sept fichiers** passent : recherche rapide, vrai hook de calcul,
moteur de formules, ancien test de calcul, dés retenus, moteur de dés et sonnerie
de fin de minuteur. **12 nouveaux cas dans trois fichiers** : deux sur la
recherche, cinq sur le moteur et cinq sur le hook, sans recopier sa logique.

Les nouveaux essais vérifient l'ordre des documents imbriqués, dossier sans
enfants, fichier hors Markdown et navigation vers l'atelier ; une erreur du pont
laisse les destinations utilisables. Côté calcul : nettoyage des clés sans
mutation du contexte, valeurs booléennes/tableaux/objets/fonctions, priorités
local/enregistré/défaut avec zéro local et valeur locale indéfinie, libellés
accentués, données libres sans gabarit, absence de personnage sans tirage,
retenue et relance des dés avec isolation entre deux personnages.

Un type de fixture trop étroit a été corrigé après le premier contrôle : les
props du test déclarent les vraies données de fiche, dont une valeur peut être
indéfinie. Les cinq cas du hook repassent, son lint ciblé est propre et le contrôle
TypeScript passe. Documents et personnages artificiels, pont simulé et
hasard piloté ; aucun profil réel, son joué ou service réseau sollicité par les
nouveaux essais. La sonnerie existante teste le minuteur avec moteur simulé ;
elle ne constitue pas un essai sur navigateur WebKit ni sur appareil audio.

## Contrôles globaux et reprise

**Types (`npx tsc -b`) et construction passent.** Lint global : **1 579
fichiers, zéro erreur et 229 avertissements**, contre 238. Restent **225
`any` : 6 applicatifs et 219 dans les tests**, trois diagnostics de mémoïsation
et une directive inutile. Comptage recoupé par emplacement dans le rapport
final ; règles et inventaire JSON initial inchangés. **7 177 tests dans 562
fichiers** passent, un fichier et quatre tests ignorés. L'annotation de fixture
corrigée n'affecte pas l'exécution ; le hook a été rejoué après correction et
la construction contrôle tous les types finaux. `git diff --check` propre.
Aucun scénario Electron nécessaire pour ces contrats, aucun paquet installé
ni service lancé manuellement.

Lot 26 réalisé, validé et documenté, **13 fichiers Codex non commités**
(huit de code/tests, cinq documents). Dernier commit local et poussé **`567f94de`**.
La demande de commit/push portait sur le lot 25 précédemment terminé ; les
changements du nouveau lot restent à commiter lors de la prochaine demande.

Reprendre **Messages d'erreur (5)** : `ForgeDashboard.tsx`, `JournalDashboard.tsx`,
`useJournalStore.ts`, `LootGeneratorPanel.tsx` et `useNotebookLM.ts` (1 chacun).
Puis le dé du Hub (1) après coordination, les tests (219) et les diagnostics
mémoïsation/directive. `HubDiceDisplay.tsx` était modifié hors Codex et reste
intact ; la demande de reprise de ce fichier est toujours sans réponse.
Préserver les autres modifications étrangères. La migration PDF v1/v2 du
§ 1 bis reste un sujet séparé.
