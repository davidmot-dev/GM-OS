# Vingtième lot du lint — migration persistante de Music-OS

David demande le 08/10 **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
La restauration de session est d'abord commitée sous **`b908bc92`** : sept
fichiers Codex sélectionnés explicitement, aucun changement de Claude inclus.
Aucun push demandé ni exécuté ; dernier poussé documenté : `861eaca4`.
Le présent lot reprend ensuite les quatre `any` de `useMusicStore.ts`.

## Un contrat pour l'état persistant et son ancien lien lumineux

La sélection persistée est extraite dans `donneesPersistantesDeLaMusique`.
Elle contient exactement les mêmes données ; son type fournit le contrat
de la migration, sans recopier la liste. Les types de playlist et de pad
viennent des types réels, avec le seul champ historique `lightLinkId`
ajouté au pad. Le paramètre d'entrée du middleware est `unknown`, et une
conversion vers cet ancien contrat remplace les lectures en `any`.
**Quatre `any` applicatifs retirés**, aucun ajout dans les tests.

Cette conversion ne valide ni ne filtre les données : les archives
partielles et leurs champs supplémentaires gardent leur comportement.
La version reste 1. Seules les versions 0, `null` ou `undefined` reprennent
`lightLinkId` lorsque `linkedLightSceneId` est absent. Un nouveau champ
déjà défini, même vide ou nul, gagne comme auparavant. L'ancien champ
vide ou nul devient un lien absent. Les autres champs du pad, sa plage,
le rattachement de la playlist, les réglages et les métadonnées restent.
Les versions plus récentes et états absents restent inchangés.

La migration garde l'identité de l'état fourni ; elle remplace les listes
et les seuls pads convertis, comme auparavant. Les platines, actions et
autres données de séance restent exclues de la sélection persistante.
Aucun changement de lecture audio, de sortie, de format de sauvegarde,
d'interface ou de règles ESLint ; aucune migration exécutée sur le profil de David.

## Contrôles

**147 tests ciblés dans douze fichiers** de Music-OS passent, dont
**17 nouveaux cas** dans `migrationPersistante.test.ts` : trois anciennes
versions, priorité au champ actuel, liens vides, pad sans ancien lien,
versions récentes, états absents/listes vides, exclusion des platines/actions
de la persistance et absence de chargement/lecture sur les deux platines.
Les champs annexes, l'identité de l'état et l'ancien pad sont vérifiés.
Le test de sélection est resserré sur la conservation des données et
l'exclusion des données de séance ; les 17 cas sont rejoués au vert.

Les essais appellent la vraie fonction enregistrée dans les options du
middleware avec des données artificielles. Le cycle de ducking et le stockage
de session sont simulés comme dans les tests des plages ; aucun fichier réel,
réseau ou appareil sollicité. Aucun scénario Electron lancé pour ce lot de types.

Types et construction passent. Lint global : **1 564 fichiers, zéro erreur
et 309 avertissements**, contre 313. Restent **305 `any`** (83 applicatifs,
222 dans les tests), trois diagnostics de mémoïsation et une directive
inutile. Lint ciblé final propre, règles et inventaire JSON initial inchangés.
Suite complète : **7 065 tests dans 549 fichiers** passent, un fichier
et quatre tests ignorés. `git diff --check` passe.

## Reprise

Lot 20 réalisé, validé et documenté, **non commité : sept fichiers Codex**,
deux de code/tests et cinq documents. Dernier commit local **`b908bc92`**,
dernier poussé `861eaca4`.
La prochaine étape porte sur les migrations persistantes des dés et des
gemmes : deux `any` dans `src/stores/useDiceStore.ts`, un dans
`src/stores/useGemStore.ts`, vérifiés dans le code. Puis les autres contrats
applicatifs et les faux objets des tests ; mémoïsation et directive inutile
gardent leurs lots ciblés. Préserver les changements de Claude.
