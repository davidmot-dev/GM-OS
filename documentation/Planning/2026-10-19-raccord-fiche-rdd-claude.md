# RdD — la fiche HTML du Livret du voyageur raccordée à GM-OS, 19/10/2026

Claude Code, à la demande de David : *« la fiche html de reve de dragon est là, il faut la connecter à
la fiche GM-OS »* — la reprise que la [note de Codex](2026-10-19-etat-et-reprise-codex-rdd-fiche-html.md)
laissait à Claude (§ 7 du cahier des charges des fiches). Choix de David : **« Tout, comme
Nephilim »** — chaque clé de la fiche HTML remonte dans GM-OS.

## Ce qui est fait

- **Correspondance** `docs/systems/reves de dragons/fiche/correspondance.json` : les **813** clés
  citées — **84** reliées aux champs historiques de la fiche GM-OS (identifiants inchangés : le jet
  les lit), **714** à des champs nouveaux (identifiant = la clé, points → « _ »), **15** absentes
  motivées (les dix valeurs que GM-OS calcule par formule — mêlée, tir, lancer, dérobée, vie et
  endurance de départ, SUST, SC, ENC, bonus aux dommages —, et les cinq copies `derive` de la fiche).
- **Pilote** (dans les données de David, jamais dans le dépôt) : fiche GM-OS de 99 à 813 champs,
  36 sections. Les champs nouveaux sont dans des **sections nouvelles**, hors du menu du jet, sauf
  les cinq survies manquantes (rangées dans les compétences particulières) et les « autres
  compétences » (nom + niveau, `libelleSur`), ajoutées aux sections du jet. Les noms des armes 4 à 7
  sont écrits d'avance (« Dague de jet », « Bouclier », « Épée à une main », « Arc »).
  Forge : **zéro constat**. Généré par `outils/reve-de-dragon/relier_fiche_voyageur.py` (pilote et
  correspondance d'un même passage : ils ne peuvent pas diverger).
- **Moteur** : gabarit `reve-de-dragon-voyageur-fr` ajouté à `Character_Sheet_Manager.html`,
  `BUILTIN_VERSION` 11, garde `electron/correspondanceDesFiches.test.ts` à jour.
- Validateur : **ACCEPTÉE, 0 erreur, 0 avertissement**. Suite complète verte (8 323), `tsc -b` propre.

## Reste

- **David** : réimporter `Export Dirvers/corriges/RDD_driver_gmos_relie.gmos-driver` avec
  « Remplacer », relancer GM-OS (le moteur recopie ses gabarits), éprouver dans les deux sens.
- **Codex** (son domaine) : la page `54-Jeu-Reves-de-Dragons.md` et le registre (§ 141, ligne 76).
  Points à y dire : les valeurs calculées par GM-OS ne remontent pas de la fiche HTML ; les quatre
  armes historiques occupent les lignes 4 à 7 ; les autres compétences entrent au jet sous leur nom.
