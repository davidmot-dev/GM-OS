# Lint — lot 35, inventaires et catalogues — 09/10/2026

David demande « commit et passe à l'étape suivante (GM-OS est éteint) ».
Les huit fichiers Codex du lot 34 archives/session sont commités sous
**`4cbca217`**. Dernier poussé : **`d0fd965b`** ; deux commits locaux d'avance.
Les modifications étrangères restent hors du commit.

## Groupe corrigé

**Sept annotations `any` retirées dans deux tests**, sans modification du code
applicatif, des traductions ou du catalogue d'effets.

| Fichier | Retirées | Contrat repris |
| --- | ---: | --- |
| `inlinedMediaKeys.test.ts` | 4 | Table FR/EN typée, projection du bloc de reprise et dictionnaires de libellés |
| `catalogueDesEffets.test.ts` | 3 | Accès direct aux JSON FR/EN et dictionnaires de noms d'effets |

Le bloc `maintenance` reste facultatif dans la projection du test. L'absence
d'un libellé reste détectée par les mêmes attentes ; les contrôles de clés
orphelines, de parité et de marqueurs d'interpolation restent. Les alias
`lightning → storm` et `none → steady`, les gardes du moteur Hue et les noms
français recherchés en gras dans le guide sont conservés. La conversion
supplémentaire `as string` du nom d'effet est devenue inutile et retirée.

Les **16 définitions de cas et 23 expressions d'assertion** sont conservées,
vérifiées par comparaison syntaxique avec `HEAD` ; la table de langues reste
FR/EN. Aucun scénario ajouté ou supprimé, aucune règle ou directive de lint
modifiée.

## Contrôles

`npx tsc -b` et lint ciblé propres. **64 tests dans six fichiers passent**,
avec `--maxWorkers=4` : les deux corrigés, `deuxLangues.test.ts`,
`rechercheDEffet.test.ts`, `effetPropose.test.ts` et `vitesseDesEffets.test.ts`.

Lint global : **1 585 fichiers, zéro erreur, 30 avertissements**, contre 37 :
**27 `no-explicit-any`**, tous dans `e2e/capturesDuManuel.spec.ts`, et **trois
diagnostics de mémoïsation**. Le comptage syntaxique des TS/TSX suivis dans
`src/`, `electron/`, `e2e/` trouve **32 annotations au total** : 27 dans les
tests de captures, cinq applicatives déjà masquées (quatre Storyboard, une PDF).
Les tests unitaires de `src/` et `electron/` n'ont plus d'annotation explicite `any`.

`git diff --check` propre ; empreintes des **21 fichiers étrangers** inchangées.
Suite complète et construction non rejouées pour ce lot de typage des tests
uniquement ; leur dernier passage reste celui du pré-push de `d0fd965b`.
Aucun e2e, profil réel, paquet installé ou service démarré.

## Reprise

**Sept fichiers Codex non commités**, deux tests et cinq documents. Dernier
local **`4cbca217`**, dernier poussé **`d0fd965b`**.

1. Captures du manuel : **27 annotations**, lot distinct avec typage du harnais
   Electron, construction avant e2e et relecture des images selon le protocole.
   Préserver les modifications étrangères de `e2e/lancerGmOs.ts` et des guides.
2. Trois diagnostics de mémoïsation : AtelierDesAdversaires (1), DiceBoard (2).
3. Quatre annotations masquées du Storyboard (deux fichiers), groupe distinct.
   L'annotation PDF reste liée à la migration v1/v2 au § 1 bis du registre.

Préserver également les fichiers étrangers du 07/10 et de `.claude`.
