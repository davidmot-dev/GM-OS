# Lint — lot 36, captures du manuel — 09/10/2026

David demande « commit et passe à l'étape suivante (GM-OS est éteint) ».
Les sept fichiers Codex du lot 35 sont commités sous **`1413f6da`**, sans les
modifications étrangères. Dernier poussé **`d0fd965b`** ; trois commits locaux
d'avance. Ce nouveau lot reste **non commité**, sans push.

## Groupe corrigé

**Les 27 annotations `any` de `e2e/capturesDuManuel.spec.ts` sont retirées.**
La fenêtre de capture décrit les onze magasins avec leurs signatures réelles,
importées comme types. La conversion depuis `window` est une frontière explicite
via `unknown`, sans type générique qui efface les contrats des magasins. Les
éléments des listes, les combattants et les callbacks sont inférés ; les vues
utilisent `CurrentView`, les outils `WhiteboardTool`. Les imports de types ne
transmettent aucun magasin au navigateur.

Le harnais vérifie la présence de la campagne et du pont d'appairage avant de
les utiliser. Les quatre combattants de démonstration reçoivent `statuses: []`,
équivalent au repli existant du magasin. Le statut Brouillé reçoit `icon: ''`,
qui conserve son affichage vide. Noms, PV, initiatives, factions, moments,
volumes et durée du statut sont conservés. Aucun code applicatif ou règle de
lint modifié.

**13 expressions d'assertion et dix expressions d'enregistrement de tests**
sont conservées par comparaison syntaxique avec `HEAD`. Les boucles produisent
les mêmes **79 scénarios**. Aucun cas ou attente supprimé.

Le nouveau projet `tsconfig.capturesDuManuel.json`, référencé depuis
`tsconfig.json`, vérifie ce harnais avec les types applicatifs et Node. Il entre
désormais dans le contrôle habituel **`npx tsc -b`** ; il ne généralise pas le
typage à tous les autres e2e. `e2e/lancerGmOs.ts`, modifié par l'autre agent, est
lu comme dépendance mais n'est pas édité.

La variable facultative **`GMOS_SORTIE_CAPTURES_MANUEL`** permet de rediriger
les images de contrôle. Sans elle, la destination des captures du manuel reste
inchangée. Cet essai écrit dans le dossier ignoré
`e2e-resultats/lint-captures-manuel-lot36`, sans remplacer les images des guides.

## Contrôles

- Types du projet de captures puis **`npx tsc -b`** : propres.
- **`npm run build`** : passe, avant le lancement Electron.
- Lint ciblé propre ; lint global : **1 585 fichiers, zéro erreur, trois
  avertissements**, contre 30. Plus aucun diagnostic `no-explicit-any`.
- **52 tests dans deux fichiers passent**, avec `--maxWorkers=4` : périmètre
  de l'instance et sauvegarde automatique.
- **79 scénarios Playwright passent** en 6,6 minutes, avec délai de 90 secondes
  et un seul fichier lancé. **78 JPEG relus**, répartis sur neuf planches ;
  contrôles supplémentaires en pleine taille pour Combat et Storyboard.

Le premier essai dans le bac d'exécution a expiré à l'ouverture de la fenêtre,
avant tout scénario. Le contrôle automatique a d'abord refusé la relance hors
de ce bac, craignant une écriture dans les sauvegardes réelles. Après lecture
des protections et passage des 52 tests, la même relance a été autorisée :
profil temporaire neuf, sauvegardes forcées dans ce profil, contrôle des chemins
au démarrage et désactivation du matériel. Aucune donnée réelle de David lue
ou modifiée. Ne pas supprimer ces protections pour contourner un refus.

La relecture relève un **cadrage à revoir pour `dice-dernier-jet.jpg`** : un
morceau du résultat précédent apparaît au bord inférieur. Le rectangle fixe
du scénario est inchangé ; le constat est consigné au **§ 1 bis du registre**,
sans correction glissée dans ce lot. Ces captures de démonstration ne valident
pas le fonctionnement du matériel ni les parcours laissés vides.

`git diff --check` propre ; empreintes des **21 fichiers étrangers** inchangées.
Les captures et traces de contrôle restent dans `e2e-resultats/`, ignoré.
La suite Vitest complète n'est pas rejouée ; son dernier passage reste celui du
pré-push de `d0fd965b`. La construction est, elle, rejouée pour ce lot.

## Reprise

**Huit fichiers Codex non commités** : le harnais, deux configurations TypeScript
et cinq documents. Dernier local **`1413f6da`**, dernier poussé **`d0fd965b`**.

1. Les **trois diagnostics de mémoïsation** :
   `src/modules/combat/components/AtelierDesAdversaires.tsx` (1),
   `src/modules/dice/DiceBoard.tsx` (2).
2. Les **quatre annotations masquées Storyboard**, deux dans `sonsDuMoment.ts`
   et deux dans `useStoryboardStore.ts`, groupe distinct.
3. L'annotation masquée de `electron/lectureDeSource.ts` appartient à la
   migration PDF v1/v2, séparée au § 1 bis.

Comptage syntaxique des TS/TSX suivis dans `src/`, `electron/`, `e2e/` : **cinq
annotations explicites au total**, toutes applicatives et déjà masquées ;
**zéro dans les tests**, unitaires comme e2e. Préserver les modifications
étrangères des guides, du lanceur, du 07/10 et de `.claude`.
