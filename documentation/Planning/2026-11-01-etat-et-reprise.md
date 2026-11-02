# État et reprise — 01/11/2026

## Ce que la session a produit

**Commit et push du travail CoC** (31/10) : `653225b8`, puis `13d008d4`, qui rétablit
`Export Dirvers/corriges/BOL_driver_gmos_2.0.0.gmos-driver` — la suppression de cet export
faisait échouer `electron/ficheDeBarbarians.test.ts` à la validation du push. Poussés sur
`origin/production`. `docs/Reference/`, `tmp/` et les traces Electron n'ont pas été versés.

**Shadowrun : Anarchy 2.0 fini** (registre § 197, synthèse des pilotes § Shadowrun Anarchy,
manuel [`54-Jeu-Shadowrun-Anarchy.md`](../User%20Guides/54-Jeu-Shadowrun-Anarchy.md)), à la demande
de David (`/finir-un-pilote`, livre de base sur le NAS). Rien n'est commité.

- **Le jet** : `src/modules/dice/systemes/shadowrun.ts` (et son essai), branché dans
  `preparerLeJet` (`DescripteurDeJet.ts`, `descripteur.shadowrun`) ; cartes `ShadowrunAuJet.tsx` dans
  `PanneauDeJet.tsx` (relance comprise) ; contrôles dans `controlesDuPilote.ts` ; essai du panneau
  `PanneauDeJet.shadowrun.test.tsx`.
- **La santé** : `src/modules/combat/logic/moniteurDeShadowrun.ts` à la porte `handleApplyImpact`
  (`entitySlice.ts`), type `combat.moniteurDEtat` (`drivers.ts`).
- **Le pilote 2.0.0** : `outils/shadowrun-anarchy/finir_shadowrun.py` →
  `Export Dirvers/corriges/SR_Anarchy_driver_gmos_finir.gmos-driver`. Zéro constat
  (`outils/shadowrun-anarchy/pilote.test.ts`, hors configuration vitest).
- **La fiche HTML** : moteur 23 (`outils/shadowrun-anarchy/integrer_au_moteur.mjs`), correspondance
  `docs/systems/shadowrun-anarchy/fiche/correspondance.json` (`relier_fiche_shadowrun.mjs`) ;
  l'attente du garde des gabarits (`electron/correspondanceDesFiches.test.ts`) est à 23.
- **Le corpus** : `docs/systems/shadowrun-anarchy/rules/`, 19/19 relues, `relu: true`, empreintes
  intactes ; seize corrigées.
- **Le manuel** : page 54, lignes au 53, six captures `jeu-shadowrun-*` (scène ajoutée dans
  `e2e/capturesDesJeux.spec.ts`).

**Forge — mode supplément, étape 1** (registre § 185, ligne 121), à la demande de David : *« on
avait mis un dév en attente pour les suppléments JdR »*, puis *« oui je veux commencer
maintenant »*, avec le *Colonial Marines Operations Manual* d'Alien. Quatre décisions de David
(sous-dossier `supplements/`, corpus d'abord, le carnet propose et David choisit, langue du jeu).
Livré : chemins (`corpusSysteme.ts`), gabarits, inventaire libre, `supplements.ts`,
`ChoixDuLivre.tsx`, atelier et liste des sujets, sommaire du supplément dans
`docs/systems/alien/supplements/colonial-marines/index/`, guide `50-Forge-des-systemes.md`
(« Documenter un supplément »). Suite complète verte. Rien n'est commité.

## Par quoi reprendre

1. **L'essai de David** : réimporter `Export Dirvers/corriges/SR_Anarchy_driver_gmos_finir.gmos-driver`
   avec **Remplacer** ; sur un personnage, un test avec des dés de risque (bouton « Risquée »), puis
   **Relancer** ; une VD dans Combat-OS (type physique) ; la **Fiche du jeu**, saisir puis Sauvegarder.
2. Juger les cases du moniteur : elles montrent la **pire** blessure (une grave allume aussi les
   deux cases légères devant elle) ; les jauges légères/graves disent le vrai compte.
3. Activer le thème `shadowrun-anarchy` et la bannière.

## Ce qu'il ne faut pas repayer

- **Le livre est sur le NAS** : `\\CLOUDDAVID\Media\Jeux de Rôle\03. Futur\3. Cyberpunk\Shadowrun\Shadowrun Anarchy JDR [FR]\sran2_01anarchyv2_web_v1.pdf`
  (117 Mo) ; PDF = imprimée + 2 ; texte propre, sans couche doublée.
- **Le biofeedback d'Anarchy est mental** (étourdissant en cold-sim, létal en hot-sim) ; la version
  « physique en hot-sim » du corpus venait d'une autre édition.
- Le livre se contredit sur la résistance des véhicules (p. 68 : Structure × 2 et × 3 ; p. 230 :
  Structure comme la Force) ; le moniteur ne l'automatise pas.
- `PanneauDeJet.tsx` n'utilise pas `useEffect` : la RR et le risque réglés sont attachés à la
  compétence (`pour`) et reviennent d'eux-mêmes quand elle change.
- ⛔ Le skill `finir-un-pilote` dit « ne jamais commiter `Export Dirvers/` », alors que le dossier
  est suivi et que des essais lisent ses `corriges/`. Question posée à David, sans réponse.
- **Colonial Marines, le livre du carnet est l'édition française** :
  `\\CLOUDDAVID\Media\Jeux de Rôle\03. Futur\1. Space Opera\Aliens\ALIEN (Arkhane Asylum)\ALN-Marines Coloniaux_FR.pdf`
  (101 Mo) ; PDF = imprimée + 3 ; texte doublé ; les tableaux de véhicules et d'événements ne sont
  lisibles qu'en image. Le tableau des explosifs y est mal titré (« BONUS » pour les dégâts).
  Les noms anglais se vérifient contre l'édition anglaise (même dossier).
