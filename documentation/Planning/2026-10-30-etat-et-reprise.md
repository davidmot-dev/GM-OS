# État et reprise — 30/10/2026

## Ce que la session a produit

**RuneQuest fini** (registre § 187, synthèse des pilotes § RuneQuest, manuel
[`54-Jeu-RuneQuest.md`](../User%20Guides/54-Jeu-RuneQuest.md)), à la demande de David
(`/finir-un-pilote`, livre de base et errata Deadcrows), « tout, dans l'ordre A-B-C-D ». Rien
n'est commité.

- **Le jet** : `src/modules/dice/systemes/runequest.ts` (logique pure et son essai, dont la table
  p. 143 ligne à ligne), branché dans `preparerLeJet` (`DescripteurDeJet.ts`, bloc
  `descripteur.runequest`) ; cartes `RuneQuestAuJet.tsx` dans `PanneauDeJet.tsx` ; contrôle dans
  `controlesDuPilote.ts` ; essai du panneau `PanneauDeJet.runequest.test.tsx`.
- **Le pilote 2.0.0** : `outils/runequest/finir_runequest.py` →
  `Export Dirvers/corriges/RQ_driver_gmos_finir.gmos-driver` (zéro constat,
  `outils/runequest/pilote.test.ts`).
- **Le corpus** : `docs/systems/runequest/rules/`, 17/17 relues, `relu: true`, empreintes intactes.
- **Le manuel** : page 54, lignes au 53, cinq captures `jeu-runequest-*` (scène ajoutée dans
  `e2e/capturesDesJeux.spec.ts`).

## Par quoi reprendre

1. **L'essai de David** : réimporter `Export Dirvers/corriges/RQ_driver_gmos_finir.gmos-driver`
   avec **Remplacer** ; recréer un personnage (la fiche a changé) ; lancer une épée avec une
   situation et une augmentation, une table de résistance POU contre POU, une localisation.
2. Dans le même essai : ouvrir la **Fiche du jeu** (créée et remplie depuis GM-OS), y saisir une
   valeur, Sauvegarder, la voir revenir au Formulaire ; activer le thème `runequest`.

## Ce qu'il ne faut pas repayer

- **Le d100 du moteur se lance en deux d10** (dizaines puis unités) : le résultat est `total`,
  jamais le premier dé — `nommerLeJetDeRuneQuest` lisait 90 pour un 94. Dans un essai de
  composant, fixer `Math.random`, pas `DiceEngine.roll`.
- **`outils/*/pilote.test.ts` n'est pas dans la configuration de vitest** : le lancer avec une
  configuration à part (`{ root: <dépôt>, test: { include: ['outils/runequest/**/*.test.ts'],
  environment: 'node' } }`, hors du dépôt).
- **Le livre perd des colonnes à l'extraction** (pypdf) : sorts de Confusion, récupération des
  points de Rune, résultats de l'inspiration, chances de la sorcellerie — rendre la page en image
  (pdfjs + canvas) avant de conclure qu'une règle manque. PDF = imprimée + 1.
- **La règle des 80 % (« Tests obligatoires », p. 237) existe** : un `grep "80 %"` la manquait,
  la phrase étant coupée en fin de ligne. Chercher avec plusieurs formulations avant de retirer.
- L'e2e de captures a trouvé ce que les essais ne voyaient pas (le nom d'une arme saisi sur la
  fiche, `libelleSur`) : le lancer avant de livrer.

## Suite du 30/10 — thème et fiche de David

David : « la fiche et le thème ont été créé » (atelier GM-OS Studio ; livraison de la fiche dans
[`2026-10-30-fiche-runequest-studio.md`](2026-10-30-fiche-runequest-studio.md)). Thème accepté 0/0 ;
fiche `runequest-fr` intégrée au moteur (version **20**, `outils/runequest/integrer_au_moteur.mjs`) ;
fiche GM-OS du pilote étendue à 313 champs pour suivre la feuille ;
`outils/runequest/relier_fiche_runequest.py` écrit la correspondance (327 clés reliées, 408 absentes
motivées) et refuse une clé sans décision. Registre § 187 complété.

**Ne pas repayer :** `construire-fiche.mjs`, `verifier-fiche.mjs` et `outils/runequest/fiche/` sont à
l'atelier fiche, pas à Claude Code — un seul écrivain par fichier. Une fiche régénérée qui ajoute
une clé fait échouer `relier_fiche_runequest.py` : décider la clé (champ ou absent), relancer, puis
`npx vitest run electron/correspondanceDesFiches.test.ts --maxWorkers=4`.

## Suite du 30/10 — coups localisés dans Combat-OS

David : « tu ne joues pas la localisation des dégâts dans Combat-OS pour Runequest ? » — non, le
D20 n'allait qu'au journal. Livré (registre § 187, suite) : `combat.coupsLocalises`, règle pure
`src/modules/combat/logic/coupsDeRuneQuest.ts` (p. 146-148), appliquée par `handleApplyImpact`
quand un impact nomme sa zone et, pour l'adversaire autonome, par `src/modules/combat/coupsLocalises.ts` ;
panneau `CoupsLocalisesDuCombattant.tsx` sur la carte ; « Porter le coup » dans les suites du jet ;
pilote **2.1.0** (sept champs `degats_<zone>`).

**Par quoi reprendre :** l'essai de David — réimporter le 2.1.0 avec Remplacer ; sur la carte de
Combat-OS, D20 puis 8 de dégâts, Encaisser ; depuis le panneau de jet, « Localiser » puis « Porter
le coup » à la cible ; un Soigner sur la zone.

**Ne pas repayer :**
- **Un membre plafonne au double sur UN coup ; la tête, la poitrine et l'abdomen comptent leur double
  sur les coups cumulés** ; le triple se lit sur un coup, avant le plafond (le bras de 2 PV touché
  pour 8 est tranché mais n'en perd que 4). Le paragraphe du double se perd à l'extraction pypdf :
  lu en image, p. 148 (PDF 149).
- Les boutons Dégâts / Soins du panneau de santé ne localisent pas, exprès : poison, chute,
  hémorragie frappent le total seul.
- `e2e/campagneDeRecetteRuneQuest.spec.ts` (autre agent) attend « PV sur la fiche » dans la ligne
  « Localiser le coup » : cette ligne lit encore les PV de zone du **lanceur** ; la corriger demande
  d'accorder les deux fichiers.

## Suite du 30/10 — Degenesis fini

David : « Degenesis le livre de base est ici […] KATHARSYS_OCR.pdf » (`/finir-un-pilote`), puis
« Tout, dans l'ordre ». Livré (registre § 188) : `jet.degenesis` (`dice/systemes/degenesis.ts`,
`DegenesisAuJet.tsx`), `combat.pistesDeSante` (`combat/logic/pistesDeDegenesis.ts`),
`combat.initiativeEnReserve` (`rollAutoInitiative`) ; pilote **2.0.0**
(`outils/degenesis/finir_degenesis.py` → `Export Dirvers/corriges/Degenesis_driver_gmos_finir`),
fiche HTML au moteur **21** et correspondance 129/129 ; corpus relu 16/16 ; page
[54-Jeu-Degenesis](../User%20Guides/54-Jeu-Degenesis.md).

**Par quoi reprendre :** l'essai de David — réimporter le 2.0.0 avec Remplacer ; un jet PHY+Corps
à corps avec Égo et « Déplacement −2D » ; dans Combat-OS, un coup qui dépasse les Blessures
superficielles ; le Jet système d'initiative ; la Fiche du jeu, saisir puis Sauvegarder.

**Ne pas repayer :**
- Le livre est sur `\CLOUDDAVID\Media\Jeux de Rôle\…` : Python ne lit pas ce chemin accentué ; le
  copier d'abord dans le dossier de travail par PowerShell (`Copy-Item -LiteralPath`). Il est
  océrisé, sans couche doublée ; PDF = imprimée + 1.
- La santé principale `sante` n'est pas sur la fiche HTML : `pistesDeDegenesis.ts` la recalcule sur
  les deux pistes à chaque coup et ne l'écrit pas lui-même — la porte applique l'impact à la santé
  lue sur la fiche **après** le correctif ; l'écrire aussi la comptait deux fois.
- Les fichiers du corpus Degenesis sont en LF : une note de relecture en CRLF y mêle les fins de
  ligne.
