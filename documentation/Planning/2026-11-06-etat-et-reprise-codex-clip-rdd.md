# Clip Rêve de Dragon et TMR — reprise Codex — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Rêves de Dragon en intégrant également les modules du jeu », puis « continue ».

## Produit livré

[MP4 livré de 4 min 28](../../output/clips/reve-de-dragon-mecanismes-et-tmr.mp4), H.264, 1440 × 900. Scénario e2e/clipReveDeDragon.spec.ts, pilote2.0.0 existant dans
output/campagnes-tests/reve-de-dragon/. Nitouche fictive et un Groin de démonstration,
profil jetable et dés préparés, légendes françaises sans voix. Ce lot ne modifie ni src/ ni electron/.

Huit chapitres : table de résolution ; fatigue/entraînement ; sept phases dans Combat-OS ;
Château Dormant/potion/famine ; module TMR et accès ; montée/déplacement et débit réel ;
rencontre privée puis maîtrise sur la fiche ; sort en réserve, note de carte et sortie.
Trajet G4–H4–I4–J4 ; le carnet et les réserves réelles du Voyageur restent distingués.

## Reprendre

Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; treize scènes et dix-huit
images du MP4 relues. Format, provenance et repères dans output/clips/rdd/ ; manuel et
synthèse liés, registre §221. Pour refaire : npm run build puis
npx playwright test e2e/clipReveDeDragon.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions ; GMOS_SORTIE_CLIP et GMOS_PILOTE_RDD changent
sortie et archive. Services locaux jetables déjà autorisés ; aucun commit/push demandé.

## Ne pas repayer

- Rêve de Dragon utilise PanneauJetVoyageur : difficulté par curseur, résultat sous
  « Dernier jet du Voyageur », et non la région générique « Résultat » des autres jeux.
- Le moteur de ce d100 tire séparément dizaines et unités : préparer deux valeurs de hasard.
- Données initiales et initialiserSanteVoyageur sur le modèle de finirReveDeDragon.spec.ts.
  __rddReprise231 et __rddFatigue231 ouvrent les suivis sans reprise d’un personnage réel.
- Le module rdd-tmr est déclaré dans le pilote. Lire son état natif et les fiches après
  chaque coût ; ne pas se contenter du texte affiché. La montée normale coûte un rêve,
  chaque trajet hors sortie une fatigue ; les jets de rencontre se traitent à part.
- H4 et I4 sont des plaines, J4 les Collines d’Encre. Aller jusqu’à J4 avant le sort
  Tympan d’Hypnos pour employer son bonus de case. G4 est le Sanctuaire Blanc.
- Au retour dans le module, la sélection de carte revient à G4, même si le demi-rêve est
  ailleurs : sélectionner J4 avant de noter le sort, qui se rattache à la case sélectionnée.
- La première prise normale a changé de dimensions après son titre, avec une bande grise
  dans le MP4. Fixer aussi le viewport Playwright à 1440×900, empêcher maximisation/resize
  de la fenêtre jetable et capturer les preuves à l’échelle CSS ; refaire la prise.
- Le figurant de Combat-OS doit recevoir ses vraies valeurs de démonstration et un suivi
  de santé initialisé, pour éviter des jauges vides dans une scène consacrée aux phases.
- Ne pas relancer tmp/creer-clip-rdd.mjs après les ajustements : il écraserait le scénario.
- Conserver les films Nephilim/Crimes/Dune/NOC et les changements étrangers en cours :
  bestiaire, chemins des livres, exports, autres guides, .codex/, corpus et traces.

**45 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/rdd/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.

Le registre et la synthèse contiennent aussi les films précédents et des modifications
d’autres chantiers. Pour un futur commit ciblé, sélectionner les ajouts du clip ; le manifeste
énumère les chemins de livraison, sans attribuer tous leurs changements à ce lot.
