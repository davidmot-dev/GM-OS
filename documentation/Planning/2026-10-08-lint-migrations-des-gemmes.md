# Vingt-et-unième lot du lint — migrations persistantes des dés et gemmes

David demande le 08/10 **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
Le lot Music-OS est d'abord commité sous **`fd585aaf`** : sept fichiers Codex
sélectionnés explicitement, aucun changement de Claude inclus. Aucun push
demandé ni exécuté ; dernier poussé documenté : `861eaca4`.
Le présent lot reprend les deux `any` de `useDiceStore.ts` et celui de
`useGemStore.ts`.

## Contrats de migration

Les entrées du middleware deviennent `unknown`. Leurs lectures reprennent
les contrats réels des magasins sous forme partielle (`Partial<DiceState>`
et `Partial<GemState>`), sans recopier les propriétés ou fabriquer des valeurs
par défaut. **Trois `any` applicatifs retirés**, aucun ajouté aux tests.
La conversion de type ne valide ni ne filtre les données sauvegardées.

Pour les dés, seule la version strictement égale à zéro traduit les trois
anciens libellés français. Les formules, identifiants, raccourcis personnalisés,
réglages et champs supplémentaires restent. Un champ absent n'est pas créé ;
une liste vide reste vide. Les versions différentes de zéro, dont `null` et
`undefined` fournies artificiellement, gardent l'identité de l'état. Un état
absent en version zéro garde l'erreur historique, sans nouvelle garde.

Pour les gemmes, la version zéro remplace toujours toute la collection par
les huit modèles fournis, même lorsqu'une collection personnalisée existait.
L'identifiant actif et les champs annexes restent. Les autres versions gardent
la collection et l'identité de l'état. Un état absent en version zéro reçoit
les modèles ; pour les autres versions, il reste absent. Ces règles sont celles
du code précédent, pas une nouvelle politique de migration.

Les deux versions de stockage restent à 1. Stockage des dés réservé au MJ,
synchronisation des gemmes et penchants, sauvegarde, interface et règles
ESLint restent inchangés. Aucune migration exécutée sur le profil de David.

## Contrôles

**368 tests ciblés dans 23 fichiers** passent, dont **21 nouveaux cas**.
Ils appellent les vraies fonctions des options du middleware sur des états
artificiels et vérifient les transformations, la conservation des autres
champs, les identités et l'absence de mutation des originaux. Le stockage de
session est simulé en mémoire ; aucun fichier réel, réseau ou appareil sollicité.
Le contrat du résultat des dés dans le test reprend le type réel du magasin ;
les 21 cas sont rejoués au vert après cet ajustement. Aucun scénario Electron
lancé pour ce lot de types.

Types et construction passent. Lint global : **1 565 fichiers, zéro erreur
et 306 avertissements**, contre 309. Restent **302 `any`** (80 applicatifs,
222 dans les tests), trois diagnostics de mémoïsation et une directive inutile.
Lint ciblé final propre ; règles et inventaire JSON initial inchangés.
Suite complète : **7 086 tests dans 550 fichiers** passent, un fichier
et quatre tests ignorés. `git diff --check` passe.

## Reprise

Lot 21 réalisé, validé et documenté, **non commité : huit fichiers Codex**, trois de
code/tests et cinq documents. Dernier commit local **`fd585aaf`**, dernier
poussé `861eaca4`.
Reprendre les neuf `any` applicatifs vérifiés dans les autres actions distantes :
audio (2), scènes (3), combat, dés, tables et tableau blanc (1 chacun).
Puis les autres contrats applicatifs et faux objets des tests ; mémoïsation
et directive inutile gardent leurs lots ciblés. Préserver les changements de Claude.
