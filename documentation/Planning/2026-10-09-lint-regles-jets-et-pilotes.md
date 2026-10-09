# Lint — lot 33, règles, jets et fixtures de pilotes — 09/10/2026

David demande « commit, pousse et passe à l'étape suivante (GM-OS est éteint) ».
Les quinze fichiers Codex des lots 31–32 sont commités et poussés sous
**`d0fd965b`** sur `feature/tablet-hub-pwa`. Le hook pré-push passe : types,
lint global (61 avertissements, zéro erreur), **7 198 tests dans 566 fichiers**
(un fichier et quatre tests ignorés), construction. Les fichiers étrangers
restent hors du commit.

## Groupe corrigé

**16 annotations `any` retirées dans six tests**, aucun code applicatif modifié.

| Fichier | Retirées | Contrat repris |
| --- | ---: | --- |
| `DebugCalculation.test.ts` | 5 | Contexte de calcul, projection du personnage et des champs du gabarit |
| `schemaDuGabarit.test.ts` | 3 | Structure littérale du schéma, sans conversions |
| `ControlPanel.test.tsx` | 3 | Projection de l'état Cortex et fonction de lecture simulée typée |
| `DiceEngineAlignment.test.ts` | 2 | Paramètre réel du moteur ; alias `yze` et `year-zero` conservés |
| `ForgeService.test.ts` | 2 | Projection discriminée de l'état IA et lecture simulée typée |
| `moteursDuJet.test.ts` | 1 | Accès direct aux traductions FR/EN et dictionnaire typé |

Deux fixtures anciennes sont alignées sur leurs contrats : le statut matériel
du panneau porte `audio: 'ready'`, plutôt qu'un réglage `autoApplyDispel` ;
la Forge utilise le fournisseur `ollama` et sa configuration Gemma 4, plutôt
que le fournisseur inexistant `gemma`. La configuration est nécessaire car
le budget est lu avant le refus des pièces visuelles. L'attente de refus reste
identique ; aucun appel IA réel.

Les noms des scénarios et les **154 expressions d'assertion** des six fichiers
sont conservés, vérifiés par comparaison syntaxique avec `HEAD`. Les résultats
attendus, protections d'Échap et invariants des jets sont conservés.
Aucune nouvelle directive ni règle de lint modifiée.

## Vérification

`npx tsc -b` et lint ciblé passent. **119 tests dans neuf fichiers passent** :
les six corrigés, `CalculationEngine.test.ts`, `DiceEngine.test.ts` et
`GroupesDeChamps.test.ts`, avec `--maxWorkers=4`.

Lint global : **1 585 fichiers, zéro erreur, 45 avertissements**, contre 61 :
**41 `no-explicit-any`**, trois diagnostics de mémoïsation et une directive
inutile. Les tests contiennent **42 annotations**, dont celle déjà masquée
dans NexusService. `git diff --check` propre. La suite complète et la construction
mentionnées plus haut valident les lots 31–32 avant publication ; elles ne sont
pas rejouées après ce lot de harnais uniquement.

Le comptage syntaxique de tous les fichiers TS/TSX suivis de `src/`, `electron/`
et `e2e/` trouve **47 annotations au total**. Les cinq hors tests sont déjà
masquées : `sonsDuMoment.ts` (2), `useStoryboardStore.ts` (2),
`electron/lectureDeSource.ts` (1). Les mentions précédentes « zéro `any`
applicatif » désignaient donc **zéro avertissement applicatif**, pas zéro
annotation dans le code. Ce contrôle n'ajoute ni ne retire de directive.

## Reprise

**Onze fichiers Codex non commités**, six tests et cinq documents.
Dernier commit local et poussé : **`d0fd965b`**.

1. Archives/session : **7 avertissements, 8 annotations**, dans NexusService
   (4 signalées + 1 masquée), SessionManager (2), storageDiagnostics (1).
2. Inventaires/catalogues : **7**, inlinedMediaKeys (4), catalogueDesEffets (3).
3. Captures du manuel : **27**, lot distinct avec harnais Electron et relecture
   des images selon le protocole du dépôt.
4. Trois diagnostics de mémoïsation et directive inutile.
5. Revoir les quatre annotations masquées du Storyboard comme groupe séparé.
   L'annotation PDF reste liée à la migration v1/v2 du § 1 bis du registre.

Préserver les fichiers étrangers des guides, du 07/10, de l'e2e et de `.claude`.
Aucun profil réel, e2e, paquet installé ou service démarré pour ce lot.

## Commit et étape suivante — 09/10

À la demande de David, les onze fichiers du lot 33 sont commités sous
**`96a80f0b`**. Dernier poussé : **`d0fd965b`**. Le
[lot 34 archives/session](2026-10-09-lint-archives-et-session.md) retire ensuite
les **huit annotations** de trois tests, dont celle masquée dans NexusService,
et la directive devenue inutile. Types, lint ciblé et **145 tests dans huit
fichiers** passent sur les sources finales. Lint global : **37 avertissements,
zéro erreur**. Restent **39 annotations** : 34 dans les tests, cinq applicatives
déjà masquées. Huit fichiers du nouveau lot restent non commités ; reprendre
inventaires/catalogues (7), puis captures et diagnostics de mémoïsation.
