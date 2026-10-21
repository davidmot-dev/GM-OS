# État et reprise — Alien A5

**21/10/2026, Codex.** David demande « on va continuer avec A5 », puis confirme
« Non, GM-OS est fermé. ». La livraison A4 précédente reste dans la copie de travail ;
ses fichiers sont les nôtres et peuvent être prolongés. Les autres chantiers restent intacts.

## Livraison et suite

[Bilan A5](2026-10-21-alien-a5.md), [registre Alien](2026-10-19-registre-ameliorations-alien.md)
et [synthèse des pilotes](2026-10-20-ameliorations-tous-les-pilotes.md).
Export `Export Dirvers/corriges/Alien_driver_gmos_a5.gmos-driver`, **1.5.0**,
**49 champs, 46 liens HTML**, identifiants et archive source A4 conservés.
Script : `outils/alien/ameliorer-pilote-a5.mjs`.

**A5 livré et contrôlé**, recette finale Electron/combat/Hub réussie.
**Essais A4 et A5 validés par David le 21/10** : « ok A4 et A5 tester c'est bon ».
A6/A7 livrés et contrôlés le 22/10 ; voir la [reprise A6/A7](2026-10-22-etat-et-reprise-codex-alien-a6-a7.md).
A8 non engagé. Aucun commit/push demandé pour A5.

## Ancres

- `src/modules/dice/systemes/survieAlien.ts` : règle configurée, échéances et reçus,
  restrictions de récupération, quantités, radiations et surplus des dix cases, poids.
- `src/modules/session/components/fields/SurvieAlien.tsx` : procédures réservées au MJ,
  visibilité dans le Hub, stocks collectifs, confirmation de résultats d'Endurance,
  Trépas, récupération, charge et demandes persistantes.
- `SanteAlien.tsx` : une horloge pour blessures et survie ; soins/repos refusés selon
  les privations ou la zone, inclusion du panneau sans alourdir les vues A0–A4.
- `entitySlice.ts`, `types/entity.types.ts` : marque de procédure de survie/suffocation
  pour éviter les critiques humains et le double Stress ; métadonnées conservées quand
  la fiche HTML les ignore ; refus de récupération au raccord réel de Santé.
- `CombatCard.tsx`, `useCombatStore.ts` : mêmes restrictions de récupération au pupitre
  et aux gestes de jauge, mêmes procédures sur la carte.
- `controlesDuPilote.ts` : champs de la configuration de survie et stocks collectifs
  contrôlés ; configuration de combat identique sur les deux portes.
- `docs/systems/alien/fiche/correspondance.json` : quatre états raccordés à l'HTML,
  avec `siPresent` pour ne pas écraser les cases d'une ancienne fiche à la première poussée.
- `e2e/capturesDesJeux.spec.ts` : A0–A4 conservés, puis A5 ; stocks individuel/collectif,
  privation/Quart, Rads, charge, reprise après rechargement et vrai Hub à trois tailles.

## Contrôles

**1 460 tests dans 107 fichiers**, contrat du manuel compris ; types, construction et
lint ciblé sans erreur.
Le contrôle élargi conserve l'avertissement de mémoïsation React Compiler dans
`PanneauDeJet.tsx`, déjà constaté en A4, sans erreur ni blocage de construction.
Contrôle réel de l'archive : aucun diagnostic, 49 champs et 46 liens, aucun lien manquant,
aller-retour des armes réussi. Rapports : `scratch/alien-a5/controle.json`, `export.json`,
`build.log`, `recette.log`. Huit captures A5 relues et copiées au manuel ; contrat du
manuel réussi après la copie. **Dernier parcours A0–A5 réussi**, après le garde-fou
réparation/zone irradiée, en environ **2 min 06** : Electron, carte de combat et vrai Hub
Edge à **360/768/1 180 px**. Les huit captures sont relues et ajoutées au manuel.
Les 16 combinaisons d'états sont vérifiées dans les deux sens ; les champs absents
d'une ancienne fiche GM-OS ne poussent pas de cases fausses vers l'HTML.
Contrôle reproductible : `node --experimental-strip-types scratch/alien-a5/verifier-etats.mjs`.

```powershell
npx.cmd tsc -b
npx.cmd vitest run --maxWorkers=4 src/modules/dice src/modules/session/components/fields src/modules/session/store/entitySlice.alien.test.ts src/modules/session/store/entitySlice.voyageur.test.ts src/modules/combat src/modules/fiches src/modules/forge/rules/controlesDuPilote.test.ts src/modules/forge/rules/corpusDerivable.test.ts src/modules/remote/actions/ficheActions.test.ts electron/correspondanceDesFiches.test.ts
npm.cmd run build
$env:GMOS_PILOTES_DES_JEUX='C:\Projet_David\GM-OS-v5\scratch\alien-a5\pilotes'
$env:GMOS_SORTIE_CAPTURES_JEUX='C:\Projet_David\GM-OS-v5\scratch\alien-a5\captures'
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npx.cmd playwright test e2e/capturesDesJeux.spec.ts -g 'ALIEN' --workers=1 --reporter=list
npx.cmd vitest run --maxWorkers=4 electron/manuelDesJeux.test.ts
```

Les profils Electron/Edge sont jetables et leurs chemins vérifiés par `lancerGmOs`.
Le lancement passe hors bac à sable avec les permissions nécessaires, comme pour A4.
Ne pas modifier le code applicatif pendant la recette ; les captures vont dans scratch.

## Pièges et décisions techniques

- Aucun décompte réel en arrière-plan : le temps du récit est confirmé par Maman,
  et les quatre unités restent indépendantes comme en A3.
- Un test de Réserve lance au plus six dés ; un test de radiation utilise tout le total.
  Le **1** est bien la face pertinente dans les deux procédures, sans Panique.
- Le total des Rads comprend les permanents. Les dix cases HTML ne peuvent montrer
  que dix points ; le surplus est gardé dans la métadonnée, pas effacé au retour HTML.
- Les quatre états sont des champs explicites. La faim, la soif et le froid interdisent
  Santé et soulagement du Stress ; l'épuisement n'interdit pas la Santé.
- Les stocks collectifs sont quatre vraies réserves partagées. Une seule fiche les
  programme ; les autres les consultent avec le suivi de pénurie inactif. L'encombrement
  utilise les quantités personnellement portées, pas tout le stock commun.
- Le scénario de captures supposait qu'une réserve déclarée dessinait un bandeau.
  A5 a des réserves `horsDuBandeau` : première recette arrêtée sur une capture absente,
  hypothèse du scénario corrigée en ne capturant que les ressources visibles.
- Un second passage atteint les réserves, la privation, la charge et les radiations,
  puis s'arrête sur le sélecteur trop strict `getByLabel('Zone irradiée', { exact:true })` :
  le texte du label inclut les options. Sélecteur assoupli, sans changement de règle.
  L'espacement des libellés et le cadrage des captures sont améliorés après relecture.
- Garde croisée A4/A5 : une réparation synthétique en zone irradiée ne peut retirer les
  avaries alors que le raccord Santé refuse la récupération. Résultat bloqué sans
  consommer l'intervention ; elle peut finir normalement après la sortie. Essai dédié.
- La règle du poids ne se déduit pas d'un nom : toutes les masses doivent être confirmées,
  y compris un zéro explicite pour les autres charges ; changement de ligne/nom à revérifier.

## Copie de travail

Le registre général partagé, le guide 62, les exports et dossiers de corpus d'autres
chantiers déjà modifiés au début de la reprise A4 restent intacts. La livraison A4 est
encore non commitée et fait partie de la base A5 ; ne pas la confondre avec les travaux
des autres. David ayant effectué son essai, demander à nouveau si GM-OS tourne avant de modifier
`src/` ou `electron/`.
