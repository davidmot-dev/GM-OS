# Trente et unième lot du lint — contexte Oracle

David demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
Le lot 30 purge/détenteurs est commité en **`e377d82c`**, ses six fichiers Codex
uniquement. Dernier poussé **`8e6a0939`** ; aucun push demandé. Les contrôles du
lot 30 restent ceux de sa note : types globaux, 21 tests ciblés et lint sans
erreur/110 avertissements. Ils ne sont pas rejoués pour le commit.

## Douze annotations retirées

Seul `src/modules/ai/hooks/useOracleContext.test.ts` change dans le code.
Le hook applicatif, les magasins et le lecteur de santé restent intacts.

Les quatre lectures simulées (session, combat, carte, cortex) deviennent des
fonctions `vi.fn` typées, créées dans `vi.hoisted` et exposées par des fabriques
de modules. Elles ne prétendent plus être des magasins Zustand complets.
Les types d'état proviennent de `ReturnType<typeof magasin.getState>` via des
imports de types ; les champs des fixtures sont des projections `Pick`.
Le callback du pilote actif reprend sa signature existante.

- La session décrit campagne, personnages, entités et indices avec les champs
  lus par le hook. Les formes de santé gardent leurs champs facultatifs.
- Le combat décrit santé, états et round ; initiative et index du tour restent
  facultatifs dans les simulations qui ne les fournissaient pas. Le cas Alien
  sans points de vie ni initiative n'est pas remplacé par des valeurs fictives.
- La carte distingue les champs d'environnement présents quand une carte est
  chargée, et la fixture sans carte (`mapUrl: null`). Les jetons reprennent nom
  et visibilité du modèle.
- Le cortex conserve aussi le `null` des fixtures existantes, comme simulation
  locale d'un identifiant absent. Le modèle applicatif n'est pas élargi.

Le typage révèle une **fixture ancienne hors contrat** : `role: 'Villain'`
alors que `Entity.role` admet `neutral`, `ally`, `hostile`, `boss`. Zalthoz reçoit
`hostile`, qui garde son sens d'adversaire. Seule cette valeur de fixture change ;
aucune catégorie applicative ou donnée persistée modifiée.

Les trois scénarios et leurs **13 assertions** sont conservés : agrégation de
la campagne, du PJ, du PNJ et de son secret, de la carte et de l'indice ; combat
avec santé/initiative ; combat sans santé chiffrée et sans mention `undefined`.
Comparaison des noms de scénarios et expressions d'assertion avec le commit :
identiques. Comptage TypeScript : **12 `AnyKeyword` avant, zéro après**.

## Contrôles

**43 tests passent dans trois fichiers** : contexte Oracle et les deux suites
du lecteur réel de santé. Tests et lint ciblé rejoués après correction du rôle.

```powershell
npx vitest run src/modules/ai/hooks/useOracleContext.test.ts src/modules/combat/logic/SanteDuCombattant.description.test.ts src/modules/combat/logic/SanteDuCombattant.test.ts --maxWorkers=4
```

`npx tsc -b` passe après correction de la fixture. Lint ciblé propre ; lint
global : **1 585 fichiers, zéro erreur et 98 avertissements**, contre 110.
Restent **94 `any`, tous dans les tests**, trois diagnostics de mémoïsation et
une directive inutile. Comptage recoupé par règle/fichier ; règles et inventaire
initial inchangés. `git diff --check` propre.

Ce lot ne change qu'un harnais de tests : construction et suite complète restent
les dernières validations du lot 29 (7 198 tests), sans nouveau passage annoncé.
Aucun e2e, paquet, service ou profil réel utilisé.

## Reprise

**Six fichiers Codex non commités** : un test et cinq documents. Dernier local
**`e377d82c`**, dernier poussé **`8e6a0939`**. Les fichiers étrangers des guides,
de la note du 07/10, de l'e2e et de `.claude` restent préservés.

Reprendre **l'enregistrement SyncServer (9)** dans
`electron/SyncServer.register.test.ts`, puis les autres groupes par contrat,
dont extraction JSON (8) et RAGService (7). Les captures du manuel (27) restent
distinctes ; terminer ensuite mémoïsation et directive inutile. La migration
PDF v1/v2 reste au § 1 bis. Ne pas refaire les lots de purge ou de couture,
ni fabriquer de santé/initiative pour satisfaire un type de fixture complet.

## Reprise regroupée

David demande ensuite de regrouper les corrections sans perdre en qualité.
Le lot 31 reste **non commité**. Le [lot 32 IA/RAG et messages](2026-10-09-lint-lots-ia-et-messages.md)
traite huit tests et 37 annotations supplémentaires ; les états et contrôles
courants ainsi que l'ordre des prochains groupes vivent dans cette nouvelle note.
