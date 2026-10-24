# Blade Runner — finir le pilote contre le livre de base

Claude Code, **24 octobre 2026**, à la demande de David : « on va finir Blade Runner le livre de règle
est ici "C:\Users\david\OneDrive\Jeux de Rôles\03. Futur\3. Cyberpunk\Blade Runner\BRN-01_LivreDeRegles.pdf" ».

« Finir », c'est ce que la [synthèse des pilotes](2026-10-20-ameliorations-tous-les-pilotes.md#blade-runner)
laissait ouvert : P0 l'audit de l'export et du livre ; P1 le forçage complet au pupitre ; P1 les
sauvegardes contre la mort et la stabilisation ; P2 les durées de guérison. David a retenu, en plus,
les premiers secours, les critiques aggravés, le soutien et les trois D12, le souvenir clé et l'objet
fétiche, l'échange d'initiative, et le retrait des tables de butin d'essai (questions du 24/10).

## Sources et preuves

- **Livre** : `BRN-01_LivreDeRegles.pdf` (Arkhane Asylum, 2024). Copie et texte extrait dans
  `scratch/blade-runner-audit/` (non suivi par git) : `livre2.txt` retire les fragments doublés
  (le PDF porte deux couches de texte). Pages citées : pages **imprimées** ; PDF = imprimée + 4.
  Lus : p. 23, 27–37, 54–88, 162–166, 176–177, 186, 192–193, 212–221.
- **Tables** : les quatre tables de Table-OS (blessures Percutant et Perforant, effets de stress humain
  et réplicant) confrontées à la p. 73 et aux p. 75–76, entrée par entrée : **conformes**.
- **Export examiné** : `Export Dirvers/BladeRunner_driver_gmos_1792659662916.gmos-driver` du 22/10 —
  identifiant `custom-1774725549525`, gabarit `tpl-1774725549529`, 38 champs.

## Constats

| Sujet | Avant | Le livre |
| --- | --- | --- |
| Plafond des D12 | Au plus deux D12 (SRD Year Zero) : un A/A avec avantage perdait son troisième D12 | Aucun plafond (p. 54–57) |
| Soutien | Absent | Un dé de base du niveau de compétence de l'aidant, à la place de la copie du plus faible ; c'est un avantage (p. 57, 56) |
| Pupitre | Forçage sans relance d'une réussite | Un D10 ou un D12 à une seule réussite peut se relancer (p. 55) |
| Mort | « À la main » | Sauvegarde d'Endurance à la fin de chaque limite (Round, Quart) ; Brisé, sans forcer ; morts instantanées (p. 72–73) |
| Stabilisation | « À la main » | Assistance médicale : Round → Quart → hors de danger ; avantage hôpital/trousse, désavantage soi-même ; Brisé : deux jets séparés (p. 72) |
| Guérison | « À la main » | Un Quart de soins + Assistance médicale : l'effet cesse à la fin de la durée, ou la blessure devient permanente ; implant (p. 72, 193) |
| Premiers secours | Seule la pause | Sur un Brisé : autant de Santé que de réussites ; main secourable : autant de Sang-froid (p. 71, 76) |
| Critiques aggravés | Un dé | Un dé de critique de plus par réussite au-delà de la touche critique, on garde celui qu'on veut (p. 71) |
| Souvenir clé, objet fétiche | Champs de fiche seulement | Une fois par séance : avantage, ou un dé de plus au forçage ; raté malgré lui et un forçage : 1 stress. Objet fétiche : +1 Sang-froid, pas Brisé (p. 56, 76) |
| Initiative | Cartes 1–10 | Surprise et embuscade : carte 1 ; échange de cartes avec un combattant qui n'a pas joué (p. 65, 67) |
| Butin | Deux tables « TEST » et « Table 2 » (Pistolet, Trésor, Yuen) | Sans rapport avec le livre |

## Livré

| Lot | Ce qui change | Fichiers |
| --- | --- | --- |
| **B1** Pupitre | « Relancer aussi » au pupitre pour un D10/D12 à une réussite | `forcerAuPupitre.ts`, `DiceBoard.tsx` |
| **B2** Soutien, trois D12 | `composerLaPoignee(…, { soutien, plafondDesD12 })` ; menu **Soutien** au panneau (alliés du groupe ou PNJ A–D) et lettre au pupitre ; `desEchelonnes.plafondDesD12: 0` levé jusqu'à la télécommande | `desEchelonnes.ts`, `DescripteurDeJet.ts`, `PanneauDeJet.tsx`, `DiceBoard.tsx`, télécommande |
| **B3–B6** Blessures critiques | `systemes/bladeRunner.ts` (lecture des tables, sauvegarde, stabilisation, soins, échéance Clock-OS, secours, jets échelonnés) ; `SuiviBladeRunner.tsx` sur la carte de combat (avant zéro aussi), la fiche du meneur et la tablette (lecture) ; critiques aggravés au tirage | `bladeRunner.ts`, `SuiviBladeRunner.tsx`, `HorsJeuDuCombattant.tsx`, `CharacterSheetEditor.tsx`, `HubCharacterSheet.tsx` |
| **B7** Souvenir clé, objet fétiche | Case « Souvenir clé » avant le lancer, bouton « un dé de plus au forçage » après, « −1 Sang-froid » si raté malgré lui ; objet fétiche dans le suivi. Une fois par séance (séance ouverte, à défaut la journée) | `PanneauDeJet.tsx`, `SuiviBladeRunner.tsx` |
| **B8** Initiative | `rollAutoInitiative({ carteUn })`, `echangerLInitiative` (journal, refus motivés) ; menus Surprise et Échanger dans Combat-OS (hors Alien) | `useCombatStore.ts`, `CombatControls.tsx`, `types.ts` |
| **B9** Pilote 2.0.0 | `outils/blade-runner/finir_blade_runner.py` : `jet.bladeRunner`, `plafondDesD12: 0`, tables d'essai retirées ; contrôle de la Forge | `Export Dirvers/corriges/BladeRunner_driver_gmos_finir.gmos-driver`, `controlesDuPilote.ts` |
| **B0** Corpus | 22 fiches sur 22 relues (registre § 174) | `docs/systems/blade-runner/rules/` |

Le suivi écrit sous `_gmos_blade_runner` (comme Cthulhu Hack) et **réécrit le champ « Blessures
critiques »** d'après lui, **sans effacer les lignes tapées à la main**.

## Vérifications

- Essais : `bladeRunner.test.ts` (13), `SuiviBladeRunner.test.tsx` (7), `cartesDInitiativeBladeRunner.test.ts` (4),
  `poigneeAuPupitre.test.ts` (+3), `forcerAuPupitre.test.ts` (+1), `outils/blade-runner/pilote.test.ts`
  (la Forge ne trouve rien, identifiants inchangés) ; `npx tsc -b`.
- `e2e/capturesDesJeux.spec.ts` rejoué sur le pilote fini (`GMOS_PILOTES_DES_JEUX=scratch/recette-br`) :
  neuf captures, dont quatre nouvelles (soutien, blessures, pupitre, échange).

## Reste

- ~~L'essai de David~~ : **fait et validé le 25/10** (« c'est bon »).
- À la main, par choix : le moment des sauvegardes et des Quarts, les touches critiques elles-mêmes,
  Promotion, chinyen et Humanité de fin de session, les manœuvres de poursuite.
- La télécommande force sans relance d'une réussite (elle ne voit pas les dés).
