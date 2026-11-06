# Clip Barbarians of Lemuria et joueur tactile — état et reprise Codex, 06/11/2026

David demande un clip Playwright des mécanismes particuliers de Barbarians of Lemuria,
avec ses éventuels modules et les gestes d’un joueur sur tablette.

## Produit livré

[MP4 livré de 2 min 43](../../output/clips/barbarians-of-lemuria-mecanismes-et-tablette.mp4), H.264, 1440×900. Scénario `e2e/clipBol.spec.ts`, montage `outils/clips/monter_clip_bol.mjs`, pilote 2.0.0
copié sans modification depuis `Export Dirvers/corriges/BOL_driver_gmos_2.0.0.gmos-driver`
vers `output/clips/bol/pilote/BOL-2.0.0.gmos-driver`. Aucun réimport requis pour le clip.

Sept chapitres : carrière/difficulté et dés bonus/malus, héroïsme et double six, Faveur
divine et échec critique, double six seul capable de réussir, réaction, joueur tactile
et fiche HTML, réception MJ. Seize scènes filmées. Aucun module indépendant dédié au
catalogue : outils du panneau, de la fiche et de Dice-OS.

## Reprise

Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; seize scènes et vingt
images relues, titres et deux raccords compris. 6 touchstart relevés ; attaque,
héroïsme et saisie de Vitalité HTML reçus côté MJ. Manuel, synthèse et registre § 229 liés.
Pour refaire : npm run build puis npx playwright test e2e/clipBol.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_BOL changent sortie/archive.

## Ne pas repayer

- Aucun fichier applicatif modifié. Profil, sauvegardes et personnage jetables ; services
  locaux déjà autorisés par David. Aucun paquet installé, commit ou push demandé.
- Krongar est un personnage d’exercice : Vigueur3, Barbare2, Agilité1, Esprit1, Initiative1,
  Mêlée2, Vitalité13, Héroïsme5. Le récit ne revendique pas une création réglementaire.
- Les dés du panneau sont préparés dans leur véritable moteur ; seuls les appels à
  `.roll()` consomment la file. Le hasard du test joueur est posé dans l’iframe Hub.
- Créer la fiche HTML avant le générique, puis revenir à Lancer un test. Copier le thème,
  la correspondance de fiche et le moteur Character_Sheet_Manager dans le corpus jetable.
- Vrai Hub HTTP/WebSocket sans appBridge, contexte mobile/tactile 768×1024 dans Edge.
  Touchers par tap(), saisies/sélections HTML ; pas de clavier tactile natif ni appareil
  physique revendiqué. La Vitalité à11 est une saisie manuelle, sans calcul de dégâts.
- Le cadre de présentation est servi par l’origine locale du Hub ; iframe à75%,
  overflow:clip. about:blank donnait un écran noir et overflow:hidden décalait le cadre.
- Conserver l’origine zéro du WebM tablette : sa durée totale inclut une dernière image
  maintenue pendant la fermeture. Couper aussi l’attente de fermeture avant le retour MJ.
- Le clip ne démontre pas un combat complet. Magie, foi, alchimie, dégâts/armure, usages
  narratifs de l’héroïsme, récupération et progression restent hors du parcours.
- Préserver les clips précédents et tous les changements étrangers : Forge, équipement,
  bestiaire, lecture des livres, corpus COC, bannières et pilote RuneQuest.

**57 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/bol/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.
