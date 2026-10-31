# État et reprise — 31/10/2026

## Ce que la session a produit

**Chroniques Oubliées Contemporain fini** (registre § 193, synthèse des pilotes § Chroniques
Oubliées Contemporain, manuel [`54-Jeu-COC.md`](../User%20Guides/54-Jeu-COC.md)), à la demande de
David (`/finir-un-pilote`, livre de règles de la 2e édition sur le NAS), « tout, dans l'ordre » ;
une seule échelle d'évolution dont le modèle se choisit ; l'option du 3d6 réglable dans le pilote.
Rien n'est commité.

- **Le jet** : `src/modules/dice/systemes/coc.ts` (logique pure et son essai), branché dans
  `preparerLeJet` (`DescripteurDeJet.ts`, `descripteur.coc`) ; cartes `CocAuJet.tsx` dans
  `PanneauDeJet.tsx` ; contrôle dans `controlesDuPilote.ts` ; essai du panneau
  `PanneauDeJet.coc.test.tsx`.
- **La santé** : `src/modules/combat/logic/encaissementDeCoc.ts` à la porte `handleApplyImpact`
  (`entitySlice.ts`), le malus d'état à l'initiative (`useCombatStore.ts`). **Commun à tous les
  jeux en cases** : `casesAligneesSurLaFiche` (`HealthInterpreter.ts`) et le badge de
  `HealthManager.tsx`, qui dit désormais le seuil du jeu (« Choqué » chez NOC aussi).
- **Le pilote 2.0.0** : `outils/coc/finir_coc.py` →
  `Export Dirvers/corriges/coc/COC_driver_gmos_finir.gmos-driver` ; la variante au 3d6 :
  `COC_driver_gmos_finir_3d6.gmos-driver`, même identifiant. Zéro constat.
- **La fiche HTML** : moteur 22 (`outils/coc/integrer_au_moteur.mjs`), correspondance
  `docs/systems/coc/fiche/correspondance.json` (`outils/coc/relier_fiche_coc.mjs`).
- **Le corpus** : `docs/systems/coc/rules/`, 18/18 relues, `relu: true`, empreintes intactes.
- **Le manuel** : page 54, lignes au 53, cinq captures `jeu-coc-*` (scène ajoutée dans
  `e2e/capturesDesJeux.spec.ts`).

## Par quoi reprendre

1. **L'essai de David** : réimporter `Export Dirvers/corriges/coc/COC_driver_gmos_finir.gmos-driver`
   avec **Remplacer** ; sur un personnage, un test d'AGI contre Moyenne 15, puis une attaque au
   couteau contre une DEF avec un dé bonus, et l'échelle du héros après le jet.
2. Dans le même essai : 15 DM sur un PJ protégé (RD 2) dans Combat-OS — 13 cases, « Affaibli » ;
   la **Fiche du jeu**, saisir puis Sauvegarder ; activer le thème `coc` et la bannière.

## Ce qu'il ne faut pas repayer

- **Le livre complet est sur le NAS**, `\\CLOUDDAVID\Media\Jeux de Rôle\06. Chroniques
  Oubliées\…\COC2_01_Livre_de_Regles_web_v0.pdf` (13 Mo) ; celui de `docs/Reference/COC/` est un
  extrait de trois pages. PDF = imprimée + 3 ; pas de couche doublée.
- **`libelleSur` doit viser un champ de la même section** : sinon la Forge refuse, et le menu du
  jet ne proposerait jamais l'arme. L'arme et son bonus vivent donc dans une section « Armes », et
  le `motif` de la composante écarte les DM et le bonus critique.
- **Un personnage né sous une autre santé** (le pilote forgé comptait des PV) n'avait pas de
  cases : la porte des dégâts lui appliquait des PV. `casesAligneesSurLaFiche` règle ce cas pour
  tous les jeux en cases — à garder en tête si un essai NOC change de comportement.
- **Des fichiers de `src/` sont en CRLF dans la copie de travail** (`useCombatStore.ts`,
  `PanneauDeJet.tsx`, `drivers.ts`), d'autres en LF : `grep -c $'\r'` sous Git Bash dit zéro à
  tort. Lire en octets avant de remplacer un bloc multiligne.
- **L'e2e enchaîne les scènes** : la scène commune de santé blesse le personnage avant les scènes
  propres au jeu ; une attente écrite sans ce coup échoue (−3, « Affaibli »).
