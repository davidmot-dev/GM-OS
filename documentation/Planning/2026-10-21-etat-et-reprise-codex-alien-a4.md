# État et reprise — Alien A4

**21/10/2026, Codex.** David demande « reprend le travail, on va reprendre avec A4 »
et confirme « Non, GM-OS est fermé. ». Lecture de la passation, du registre, des bilans
A0–A3, du code et de `git log` : A0–A3 livrés dans `1e79cb85`, essayés et validés.

## Livraison et reprise

[Bilan A4](2026-10-21-alien-a4.md), [registre Alien](2026-10-19-registre-ameliorations-alien.md)
et [synthèse des pilotes](2026-10-20-ameliorations-tous-les-pilotes.md).
Export `Export Dirvers/corriges/Alien_driver_gmos_a4.gmos-driver` **1.4.0** : mêmes
identifiants, 44 champs et 42 correspondances ; archive A3 conservée.
Script reproductible : `outils/alien/ameliorer-pilote-a4.mjs`.

**A4 livré, contrôlé et validé par David le 21/10** : « ok A4 et A5 tester c'est bon ».
A5 est également livré et validé ; voir la [reprise A5](2026-10-21-etat-et-reprise-codex-alien-a5.md).
A6/A7 livrés et contrôlés le 22/10 ; voir la [reprise A6/A7](2026-10-22-etat-et-reprise-codex-alien-a6-a7.md).
A8 non engagé. Aucun commit/push demandé pour A4.

## Ancres

- `src/modules/dice/systemes/synthetiquesAlien.ts` : avaries, D6 aggravés, état d'Arrêt,
  interventions et reçus, projection sur la santé commune, immunités.
- `paniqueAlien.ts`, `DescripteurDeJet.ts`, `PanneauDeJet.tsx` : même nature ; Stress
  ancien ignoré sans effacement ; ancien Tremblement et malus humains écartés ;
  rafale sans Stress synthétique, forçage interdit et tests bloqués après Arrêt.
- `SanteAlien.tsx`, `SynthetiquesAlien.tsx` : protection commune, origine du péril,
  critiques et interventions synthétiques, PNJ explicitement déclaré.
- `entitySlice.ts`, `useCombatStore.ts`, `SanteDuCombattant.ts` : Santé canonique,
  coups du pupitre raccordés, maintien en lice à zéro et vrai Arrêt hors combat.
- `e2e/capturesDesJeux.spec.ts` : A0–A3 conservés puis parcours A4, reprise après
  fermeture, vrai Hub Edge et trois largeurs.

## Contrôles

**1 439 tests dans 105 fichiers réussis** après réalisation finale, contrat du manuel
compris (20 tests). Construction réussie ;
lint ciblé sans erreur (un avertissement React Compiler sur la mémoïsation de
`PanneauDeJet.tsx`). Le contrôle de l'archive ne donne aucun diagnostic et aucun
lien manquant ; les quatre colonnes d'armes font leur aller-retour HTML.
Rapports dans `scratch/alien-a4/` : `build.log`, `controle.json`, `export.json`, `recette.log`.
Recette finale A0–A4 réussie : un parcours en environ une minute trente ; Electron,
carte de combat et vrai Hub Edge à 360/768/1 180 px. Les cinq captures A4 sont relues
et copiées au manuel ; contrat du manuel revérifié avec succès après la copie.

```powershell
npx.cmd tsc -b
npx.cmd vitest run --maxWorkers=4 src/modules/dice src/modules/session/components/fields src/modules/session/store/entitySlice.alien.test.ts src/modules/session/store/entitySlice.voyageur.test.ts src/modules/combat src/modules/fiches src/modules/forge/rules/controlesDuPilote.test.ts src/modules/forge/rules/corpusDerivable.test.ts src/modules/remote/actions/ficheActions.test.ts electron/correspondanceDesFiches.test.ts
npm.cmd run build
$env:GMOS_PILOTES_DES_JEUX='C:\Projet_David\GM-OS-v5\scratch\alien-a4\pilotes'
$env:GMOS_SORTIE_CAPTURES_JEUX='C:\Projet_David\GM-OS-v5\scratch\alien-a4\captures'
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npx.cmd playwright test e2e/capturesDesJeux.spec.ts -g 'ALIEN' --workers=1 --reporter=list
npx.cmd vitest run --maxWorkers=4 electron/manuelDesJeux.test.ts
```

La recette Electron/Edge utilise les profils jetables d'`e2e/lancerGmOs.ts`, jamais
le profil de David. Un premier lancement dans le bac à sable échoue avant toute
fenêtre (EPERM sur le répertoire utilisateur et processus GPU inutilisable) ; relance
avec les permissions nécessaires sur les mêmes profils isolés. Ne pas modifier le
code pendant la recette. Aucun paquet installé ni service manuel ajouté.

## Points à conserver

- Réactivation pour communiquer et réparation complète sont deux étapes et deux jets
  Comtech. L'Arrêt bloque encore les tests ordinaires entre les deux.
- La répétition compare le résultat au **dernier critique effectivement appliqué**,
  pas à toutes les avaries ni au dernier dé brut : 4,4,4 donne 4,5,4.
- Trauma choisi avec Maman, conservé à la réparation ; aucune Panique/Stress humain
  déduit de ses effets. L'activité liée aux membres et aux actions reste arbitrée.
- Les types de dégâts communs sont des jetons anglais (`cold`) ; les immunités
  acceptent aussi les noms explicites français de ce suivi.
- Le Hub reprend l'identité **et son secret** du navigateur A1 comme en A3.
- Après rechargement, les choix du prochain jet (Attribut/Compétence) se refont ;
  l'état de santé et les interventions sont, eux, persistants. Une première recette
  atteint la réparation réussie et les trois Hub, puis sa dernière assertion oublie
  de refaire ces choix : scénario corrigé, sans modification du code applicatif.

## Copie de travail

Le registre général `2026-08-23-chantiers-gares.md`, le guide 62, plusieurs exports et
dossiers du corpus étaient déjà modifiés ou non suivis à l'arrivée ; ils restent
intacts. Ne pas les inclure automatiquement dans une livraison Alien.
David ayant effectué son essai, demander à nouveau si GM-OS tourne avant toute édition de
`src/` ou `electron/`, selon AGENTS.md.
