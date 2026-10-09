# Lint — lot 37, mémoïsation des pilotes — 09/10/2026

David demande « commit, pousse et passe à l'étape suivante (GM-OS est éteint) ».
Les huit fichiers Codex du lot 36 captures sont commités et poussés sous
**`916a3842`**. Les trois commits locaux précédents sont également publiés.
Les modifications étrangères restent hors du commit.

## Groupe corrigé

**Les trois derniers avertissements de lint sont retirés**, dans deux écrans :
`AtelierDesAdversaires.tsx` (1) et `DiceBoard.tsx` (2). Ils viennent de la règle
`react-hooks/preserve-manual-memoization` : les pilotes retournés par un appel
ordinaire à `getActiveDriver()` étaient considérés comme potentiellement
mutables dans les dépendances des caches.

Les deux écrans lisent désormais le pilote **dans un sélecteur du magasin
réactif**, avec la même méthode de résolution. Le sélecteur retourne le pilote
existant, sans le cloner : son identité reste stable lors d'une mise à jour sans
rapport, et change lorsqu'il est remplacé. Les caches `useMemo` des champs et
`useCallback` des jets, leurs dépendances et la synchronisation du mode sont
conservés. Aucune règle désactivée ; aucune directive ajoutée ; React Compiler
n'est pas activé par ce lot.

L'atelier garde l'ordre de choix : jeu demandé parmi tous les pilotes,
personnalisé avant référence, puis repli sur le pilote actif. Les lectures des
fiches et le calcul des jets restent aux mêmes endroits. Aucun moteur de dés,
donnée enregistrée, rendu ou style modifié.

## Contrôles

Le pré-push de **`916a3842`** passe : types, lint (trois avertissements, zéro
erreur), **7 198 tests dans 566 fichiers** (un fichier et quatre tests ignorés),
construction. `HEAD` et la référence distante suivie pointent sur ce commit.

Sur les sources finales du lot 37 :

- Lint ciblé propre sur les quatre fichiers modifiés.
- Lint global : **1 585 fichiers, zéro erreur, zéro avertissement** ; le
  chantier passe de **540 à zéro avertissement**.
- **`npm run build` passe**, avec le contrôle habituel **`tsc -b`**, y compris
  le projet de captures ajouté au lot 36.
- **96 tests dans neuf fichiers passent**, avec `--maxWorkers=4` : atelier,
  bestiaire, fabrique, nombre d'exemplaires, dés échelonnés au pupitre,
  Cthulhu Hack au pupitre, bouton de lancer, DiceEngine et alignement des jets.

**Huit cas ajoutés**, sans retirer les scénarios existants :

| Écran | Comportements vérifiés |
| --- | --- |
| Atelier (5) | Gabarit remplacé avec le même identifiant ; changement de gabarit du pilote ; jeu personnalisé demandé ; référence demandée puis retour au pilote actif ; repli quand le jeu demandé est introuvable |
| Dice-OS (3) | Pilote remplacé avec le même identifiant et nouveaux dés ; mise à jour sans rapport conservant mode et poignée ; fermeture de campagne rendant le choix des faces au meneur |

Le dernier cas conserve le nombre de dés déjà réglé : fermer la campagne
réinitialise le mode, pas la quantité. La première attente du nouveau test
supposait un dé ; elle a été corrigée pour les deux dés déjà réglés par le
pilote de démonstration. Aucun changement de comportement introduit pour
satisfaire le test. Le premier passage a rendu 95 réussites et cette attente
en échec ; le passage final rend les **96 réussites**.

Le faux magasin de l'atelier accepte désormais les sélecteurs et expose les
fixtures contrôlées ; les tests de Dice-OS emploient le vrai magasin de session.
La suite Vitest complète n'est pas rejouée après ce petit lot ; son dernier
passage est celui du pré-push ci-dessus. Aucun nouvel e2e ou lancement Electron.

`git diff --check` propre ; empreintes des **21 fichiers étrangers** inchangées.
Les anciens `any` restent comptés syntaxiquement : **cinq annotations
applicatives déjà masquées**, zéro dans les tests. Ce lot n'en ajoute aucune.

## Reprise

**Neuf fichiers Codex non commités** : deux écrans, deux tests et cinq
documents. Dernier local et poussé **`916a3842`**. Aucun commit supplémentaire
ni push du lot 37 dans cette session.

Reprendre par les **quatre annotations masquées de Storyboard**, deux dans
`src/modules/storyboard/sonsDuMoment.ts` et deux dans
`src/modules/storyboard/useStoryboardStore.ts`. L'annotation de
`electron/lectureDeSource.ts` reste dans le chantier de migration PDF v1/v2
au **§ 1 bis du registre**. Le cadrage de la capture du dernier jet y reste
également, séparé du lint.

Préserver les fichiers étrangers des guides, du lanceur e2e, du 07/10 et de
`.claude`. Les images du contrôle du lot 36 restent ignorées dans
`e2e-resultats/` ; elles ne sont pas republiées par ce lot.
