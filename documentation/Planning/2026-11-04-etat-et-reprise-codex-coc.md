# Reprise Codex — COC-A1/A2/A3 — 04/11/2026

**État actuel — 05/11 :** David confirme le 05/11/2026 : « c'est bon c'est testé, tu peux commit et pousse ». COC-A1 à COC-A6 sont validés ; commit et push autorisés sur production.
[Reprise actuelle](2026-11-05-etat-et-reprise-codex-coc.md). Les attentes et états Git ci-dessous sont ceux de la livraison initiale.

Demande de David : commencer COC-A1/A2/A3 ; confirmation « GM-OS est fermé », puis
« continue ». **Pas de demande de commit/push pour COC**. Branche `production` ; base
Shadowrun déjà poussée `e0a4422c`. Ne pas confondre l’autorisation du push Shadowrun avec COC.

## État

Pilote **2.1.0** réalisé : dommages d’arme et transfert/RD, santé persistante avec
confirmations, rôles PNJ/Pulp explicite et bandes. Lire [le suivi détaillé](2026-11-04-coc-a1-a3.md),
le [manuel](../User%20Guides/54-Jeu-COC.md), la synthèse et le registre **§ 214 / ligne 150**.
COC-A1/A2/A3 orange, à essayer par David ; A4/A5/A6 rouges, hors de ce lot.

Archives à réimporter dans `Export Dirvers/corriges/coc/COC-2.1.0-{d20,option-3d6}.gmos-driver`,
copies suivies `output/coc-a1-a3/pilote/`. Identifiants et anciennes clés préservés.
Génération : `node outils/coc/ameliorer_coc.mjs <export-2.0> <sortie-2.1>`.

## Ne pas repayer

- Le livre complet est sur le NAS : `\\CLOUDDAVID\Media\Jeux de Rôle\06. Chroniques Oubliées\Chroniques Oubliées Contemporain\COC2\COC2_01_Livre_de_Regles_web_v0.pdf`.
  **Celui de `docs/Reference/COC` n’a que trois pages graphiques.** PDF = imprimée +3.
  Texte de travail et rendus de tables dans `tmp/coc-*`. Aucun document du NAS modifié.
- Capacités PNJ : Pro/Expert et budget, effet contextuel renseigné ; ATC/ATD ne cumulent
  pas capacité et caractéristique. A6 n’est pas réalisé par une liste de noms.
- Bandes : une condition favorable par membre supplémentaire, compensée avec les
  défavorables du jet ; une touche retire un membre sans DM/RD. Le compteur de fiche
  des PNJ de Galerie doit suivre leurs cases, sinon la projection annule la touche.
- `__cocSuivi` et `__cocProfil` survivent à une ancienne fiche HTML qui les ignore.
  Reçus persistants, jamais d’effet de santé au montage React ou au rechargement.
- Stitch utilisé : projet `14188215644082639742`, écran `27f63dfbeec9457bb938e3090f58bcff`.
  Ses PV descendants ont été corrigés dans l’intégration ; composants et couleurs GM-OS.
- Capture de profil : fermer le détail du test avant de photographier. Le panneau a été
  déplacé au centre du combat après relecture des premières captures trop étroites.

## Vérifications

**9 847 tests réussis, 4 ignorés ; 830 fichiers réussis, 1 ignoré.** Vingt nouveaux tests COC.
Types et construction finale passent, panneau central vérifié dans le bundle ; lint global
zéro erreur, un avertissement préexistant `useSaisieDifferee.ts`, lint ciblé final propre.
`e2e/cocAvance.spec.ts` passe (26,6 s) : vrais import/remplacement d20/3d6/retour, dégâts,
CON, rôles, bande et persistance. `e2e/capturesDesJeux.spec.ts`, filtré sur le pilote COC
2.1 d20, passe aussi (29,6 s). Dix captures relues et copiées au manuel, dont les quatre
nouvelles et le 3d6 2.1. Le contrôle final du manuel passe ses 26 tests.
Rapports durables : `output/coc-a1-a3/verification-{technique,electron}.json`.
Ne pas annoncer la validation de David : **reprendre par le réimport avec Remplacer et
la recette humaine décrite dans le suivi**, puis seulement cocher les trois lots.

## Changements étrangers conservés

**62 fichiers de livraison modifiés ou nouveaux, non commités**, énumérés dans
[l’inventaire](../../output/coc-a1-a3/fichiers-de-livraison.json), hors traces et travail
temporaire. Les deux archives remises dans `Export Dirvers/` ne sont pas destinées au
commit ; utiliser les copies suivies de `output/coc-a1-a3/pilote/` pour la reproductibilité.

Ne pas commiter au titre de COC : export RuneQuest déjà modifié, guides 10/12 (fins de ligne),
anciens exports Alien/Degenesis/Shadowrun, `docs/Reference/`, vieux clips RuneQuest,
images de contrôle du clip Shadowrun et traces de recettes existantes. `tmp/` est du travail
local. Aucun accès aux données personnelles de David, aucune installation de paquet.
