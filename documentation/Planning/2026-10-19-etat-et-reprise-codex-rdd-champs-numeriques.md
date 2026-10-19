# État et reprise — RdD, champs numériques — 19/10/2026

Lire AGENTS.md et la passation du 04/10. Chantier : registre § 141, ligne 76.
Base de cette reprise : `be0e6f46`, branche `feature/tablet-hub-pwa`.

## Demande et état retrouvé

David : « la session précédente a été coupé sans avertissement tu peux reprendre ? ».
Il confirme ensuite « Oui, reprends cette retouche » et « Non, GM-OS est fermé ».
Le HTML RdD, son générateur et trois scripts numériques étaient déjà modifiés/non suivis.
La reprise conserve ces changements, les vérifie puis intègre le gabarit au moteur.
La consigne Studio ouverte dans l'IDE conserve le diagnostic initial et pointe ici.

## Résultat

- `template.customCss` masque les deux pseudo-éléments WebKit de flèches numériques,
  conserve `appearance:textfield` et ajoute `-moz-appearance:textfield`, `padding:0`,
  `font-variant-numeric:tabular-nums lining-nums` et le centrage.
- **483 champs numériques** contrôlés. **168 élargis** : 60 page 1, 106 page 2, deux page 4.
  Deux chiffres tiennent partout ; trois pour les champs d'expérience, de ressources,
  de monnaie et d'encombrement repérés par le correcteur. Les nombres astraux gardent leur
  police de 6 px et leur largeur suffisante.
- [Liste complète : clé, page, largeur avant/après](../../outils/reve-de-dragon/fiche-voyageur/elargissements-numeriques.json).
- Les **813 clés**, types, pages, x/y/hauteurs, fonds, autres champs et `derive` sont identiques.
  Aucun chevauchement entre champs. La revue des cinq pages remplies ne montre pas de chiffre
  coupé ni de libellé imprimé recouvert par les élargissements.
- Le moteur `docs/fiches/Character_Sheet_Manager.html` porte exactement le gabarit corrigé,
  marqué `_builtin:true`, **`BUILTIN_VERSION` 11 → 12**. Les sept autres gabarits sont inchangés.
  La correspondance et le pilote restent identiques : ne pas relancer
  `relier_fiche_voyageur.py` pour cette retouche (il reconstruit le pilote, pas le moteur).
- L'aide autonome et le manuel 54 RdD décrivent saisie, ↑ / ↓ et molette avec focus.
  Le générateur applique également le correcteur pour conserver la retouche à la reconstruction.

Ancres : `outils/reve-de-dragon/fiche-voyageur/champs-numeriques.mjs`,
`retoucher-champs-numeriques.mjs`, `construire-fiche-voyageur.mjs` et
`fiche-voyageur/verifier-champs-numeriques.mjs`. La livraison est documentée dans
`outils/reve-de-dragon/fiche-voyageur/LIVRAISON.md`.

## Vérifications de la reprise

- Validateur RdD : **acceptée, zéro erreur, zéro avertissement** avant et après intégration.
- Navigateur Edge isolé, sans réseau : gabarit intégré identique à la fiche livrée ; bibliothèque
  fictive v11 avec personnage déjà rempli, rechargement en v12, personnage intégralement conservé
  (y compris extension inconnue). Aucun import de modèle pendant ce contrôle.
- Mesure des chiffres dans chacun des 483 champs, CSS du moteur seule ; saisie, flèches du clavier
  et molette vérifiées dans le moteur et la fiche autonome. Aucune erreur JavaScript ni requête HTTP.
- Correction reproductible depuis le manifeste de HEAD, seconde application sans effet.
- **81 tests verts dans quatre fichiers** : `electron/correspondanceDesFiches.test.ts`,
  `electron/fichesDuDepot.test.ts`, `electron/coutureDesFiches.test.ts`,
  `src/modules/fiches/validationDeLaFiche.test.ts`, avec `--maxWorkers=4`.
- `npx.cmd tsc -b` et lint ciblé `electron/correspondanceDesFiches.test.ts` propres.
  Le test de correspondance exige désormais que le gabarit intégré RdD soit égal au livrable,
  CSS et géométrie comprises : il attrape la divergence à l'origine du défaut.
- Cinq captures du moteur et une au survol/focus dans
  `scratch/reve-de-dragon-fiche/numeriques/`, rapport `verification-numeriques.json`.
  Elles montrent le vrai moteur ouvert seul, **pas la fenêtre complète de GM-OS**.
  Pas de build, de lancement Electron, de serveur ni d'essai matériel pendant cette reprise.

## Reprendre

David relance GM-OS et rouvre le livret du personnage existant pour juger les chiffres.
Si le livret était déjà relié, aucun nouvel import du pilote n'est nécessaire. La migration v12
est automatique ; les valeurs existantes ne changent pas. Le jugement dans la fenêtre réelle
de GM-OS et sur tablette reste à David.

Aucun commit/push demandé pour cette reprise ; les changements restent **non commités**.
Les deux guides 81/84 signalés modifiés avant la reprise et `tmp/` restent intacts, hors chantier.
Aucune donnée personnelle lue ou écrite, aucun paquet installé. Avant toute future modification
de `src/` ou `electron/`, redemander si GM-OS tourne si David l'a relancé pour son essai.
