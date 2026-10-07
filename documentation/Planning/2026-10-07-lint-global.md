# Lint global — remise en service du 07/10/2026

David demande **« corrige le lint global »**, puis confirme **« GM-OS est fermé »**
avant les corrections dans `src/` et `electron/`.

## Le défaut et le parcours réparé

`eslint .` visitait les données locales et les profils de navigateur : le premier
essai s'arrête avec `EPERM` dans `scratch/chrome_profile_notebooklm`. Le pré-push
rencontrait aussi `ENOENT` sur un nom de dossier invalide à la racine.

`npm run lint` appelle maintenant `scripts/lint.mjs`. La liste NUL de
`git ls-files --cached --others --exclude-standard` couvre les fichiers suivis et
les nouveaux fichiers non ignorés, y compris les noms contenant des espaces.
Le script contrôle leur contenu actuel avec ESLint, sans parcourir les profils,
sorties de construction, sauvegardes ou données locales ignorées. Les fichiers
suivis supprimés sont écartés ; les erreurs d'analyse ou de lancement font échouer
la commande. `npm run lint -- --fix` conserve la correction automatique explicite.
Les dossiers inconnus n'ont été ni supprimés ni renommés. Git peut encore signaler
leur présence sur stderr ; cela ne fait plus interrompre le parcours d'ESLint.

Les sources archivées sous `documentation/**/candidats/**` sont des témoins de
conception, pas les composants exécutés ; elles sont explicitement exclues du lint.

## Ce que le lint a révélé

Le premier parcours complet rend **95 erreurs et 513 avertissements**. Corrections :
imports et captures inutiles retirés, variables de `switch` dans leur bloc,
tabulations du motif Ollama rendues explicites, suppressions TypeScript obsolètes
retirées, fixtures de tests typées, fonctions partagées sorties des composants
pour Fast Refresh. Les callbacks en référence sont actualisés après le rendu,
dans `useLayoutEffect`, en gardant leurs abonnements stables. La sourdine initiale
des lecteurs reste fixée au montage, dans un état initialisé paresseusement.

Les libellés relatifs du lobby et du butin lisent une horloge d'état plutôt que
`Date.now()` pendant le rendu ; sa minuterie est libérée au démontage.

Deux diagnostics de performance, `set-state-in-effect` et
`preserve-manual-memoization`, deviennent des **avertissements visibles** :
React Compiler n'est pas activé dans Vite. Cette migration reste progressive,
comme l'explique la [documentation React](https://react.dev/reference/eslint-plugin-react-hooks).
Les règles sur l'ordre des hooks, les références et la pureté restent bloquantes.
Les paramètres préfixés par `_` et les champs volontairement retirés d'un objet
ne sont plus signalés comme des oublis ; les autres variables inutilisées restent
des erreurs. `no-explicit-any` garde son niveau d'avertissement antérieur.

`scripts/validate.ps1` bloque maintenant sur un lint en échec. Le hook pré-push
qui l'appelle ne peut plus annoncer une validation réussie après cette erreur.

## Contrôles et reprise

Premier passage corrigé : **1 526 fichiers, zéro erreur et 540 avertissements**,
code de sortie zéro ; `npx tsc -b` passe. Le témoin temporaire non suivi
`verification-lint-global-20261007.ts` porte une variable inutilisée : le lint le
détecte, contrôle 1 527 fichiers et rend le code 1 avec exactement une erreur.
Le témoin est retiré avant la validation complète.
La passation est actualisée : les anciennes erreurs tolérées de synchronisation
ne doivent plus être annoncées comme des exceptions persistantes.

**Validation finale `npm.cmd run validate` : code 0.** Types et lint global passent
(1 526 fichiers, zéro erreur, 540 avertissements) ; **6 797 tests dans 528 fichiers
passent**, un fichier et quatre tests sont ignorés ; la construction de production
réussit. Le nouveau test d'horloge vérifie la stabilité entre deux battements,
l'actualisation et la libération de la minuterie au démontage.
Les vérifications ne lancent pas GM-OS avec les données de David.

David demande ensuite **« commit et push »** le 07/10 : enregistrement du
correctif et de sa documentation, avec le hook pré-push complet. Les changements
antérieurs des autres chantiers et les données de David sont conservés. Les
avertissements restent une dette visible à traiter lorsqu'un écran ou un module
est repris.
