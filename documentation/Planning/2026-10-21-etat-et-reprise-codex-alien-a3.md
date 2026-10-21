# État et reprise — Alien A3

**21/10/2026, Codex.** Suite de la demande « ok A2 est testé c'est bien, on fait A3 ».
David a confirmé GM-OS fermé avant les modifications ; A2 est essayé et validé.
David valide ensuite A3 (« ok c'est bon pour A3, commit et pousse ») et autorise le
commit/push des lots Alien A0–A3 et de leur suivi. La copie de travail contient aussi les
changements antérieurs d'autres chantiers : ne pas les nettoyer.

## Livrable et état

Le [bilan A3](2026-10-21-alien-a3.md) décrit les règles, sources, limites et vérifications.
Corrigé `Export Dirvers/corriges/Alien_driver_gmos_a3.gmos-driver`, version 1.3.0,
44 champs et 42 liens ; les archives A0/A1 et A2 restent intactes.
Script : `outils/alien/ameliorer-pilote-a3.mjs`. Le manuel 53/54 et les deux registres
de pilotes sont à jour : **A3 livré, contrôlé, essayé et validé par David le 21/10.**

## Ancres du code

- `src/modules/dice/systemes/combatAlien.ts` : règles et état persistant A3.
- `jetsAlien.ts`, `JetsAlien.tsx` : tir et éclats par cible.
- `MunitionsAlien.tsx` : état initial, réserves et rechargement.
- `SanteAlien.tsx` : protection, dégâts, critiques, échéances, Trépas et soins.
- `PanneauDeJet.tsx` : Stress avant rafale, munitions après Panique et blocage Brisé.
- `entitySlice.ts` : Santé canonique, nouvelle blessure à zéro, PNJ humain explicitement
  déclaré, métadonnées conservées quand l'ancienne fiche HTML les omet.
- `CombatCard.tsx` : même procédure sur les cartes, aucune seconde Santé.
- `HorsJeuDuCombattant.tsx` : D66 générique réellement composé de deux d6 ordonnés.
- `controlesDuPilote.ts`, `types/drivers.ts` : configuration explicite et validation.
- `e2e/capturesDesJeux.spec.ts` : parcours A0–A3 et vrai Hub à trois largeurs.

## Contrôles et commandes

1 330 tests dans 91 fichiers réussis ; types, construction et lint ciblé réussis
et recette finale Electron/combat/Hub réussie (1 parcours, environ 1 min 12 s).
Sept captures A3 relues et copiées au manuel ; ses 56 tests de contrat sont revérifiés.
L'archive est rouverte, la correspondance et l'aller-retour
des armes contrôlés : `scratch/alien-a3/controle.json`.

```powershell
npx.cmd tsc -b
npx.cmd vitest run --maxWorkers=4 src/modules/dice src/modules/session/components/fields src/modules/session/store/entitySlice.alien.test.ts src/modules/session/store/entitySlice.voyageur.test.ts src/modules/combat/components src/modules/combat/logic src/modules/fiches src/modules/forge/rules/controlesDuPilote.test.ts src/modules/forge/rules/corpusDerivable.test.ts src/modules/remote/actions/ficheActions.test.ts electron/manuelDesJeux.test.ts electron/correspondanceDesFiches.test.ts
npm.cmd run build
$env:GMOS_PILOTES_DES_JEUX='C:\Projet_David\GM-OS-v5\scratch\alien-a3\pilotes'
$env:GMOS_SORTIE_CAPTURES_JEUX='C:\Projet_David\GM-OS-v5\scratch\alien-a3\captures'
npx.cmd playwright test e2e/capturesDesJeux.spec.ts -g 'ALIEN' --workers=1
```

La construction doit précéder la recette Electron. Les profils sont isolés par
`e2e/lancerGmOs.ts`, y compris USERPROFILE/APPDATA/LOCALAPPDATA. Ne pas lancer les
vitrines qui utilisent les données de David. Aucune édition de `src/` pendant la recette.

## Pièges rencontrés

- La scène tablette A3 doit reprendre **tout le stockage local** du navigateur A1,
  pas seulement son identifiant fictif `alien-a1-tablette` : son secret de reprise
  est nécessaire. Une nouvelle identité cache le personnage réservé ; le même
  identifiant sans son secret déclenche `reprise_refusee`. Les deux premiers essais
  passent le poste MJ puis s'arrêtent à cette transition. Le scénario conserve
  désormais `storageState()` en mémoire et le recharge dans le nouveau navigateur,
  sans modifier ni contourner l'appairage réel de l'application.
- Le D66 passe par `rollStandard(66, 1)` ; `DiceEngine.roll(66)` serait un mauvais tirage.
- Une écriture après `handleApplyImpact` doit relire la fiche : le coup peut avoir ajouté
  du Stress et une demande de critique. Réécrire l'ancien état les perdrait.
- Un humain PNJ à zéro est Brisé, pas automatiquement mort ; il ne reçoit pas le Stress
  d'un PJ. Les monstres restent exclus tant que Maman ne les déclare pas humains.
- Ne pas faire guérir automatiquement une blessure fatale non stabilisée parce que
  son compteur de convalescence atteint zéro : son échéance de Trépas reste active.
- Les captures A3 doivent viser les sections coup/blessure, pas le grand panneau entier
  susceptible d'être coupé par son conteneur défilant. Relire les images avant copie.
- Écrire le français avec `apply_patch` ; des littéraux Unicode passés par une
  here-string PowerShell vers Node peuvent être transformés en points d'interrogation.

## Suite

La recette finale et l'essai A3 de David sont terminés et validés.
A4–A8 restent non engagés ; attendre le choix de David.
Avant une prochaine édition de `src/` ou `electron/` après essai de David, demander
à nouveau si GM-OS tourne, selon AGENTS.md.

Le registre général `2026-08-23-chantiers-gares.md` est modifié par un autre travail
et reste intact ici. Les références d'avancement sont le
[registre Alien](2026-10-19-registre-ameliorations-alien.md) et la
[synthèse de tous les pilotes](2026-10-20-ameliorations-tous-les-pilotes.md).
