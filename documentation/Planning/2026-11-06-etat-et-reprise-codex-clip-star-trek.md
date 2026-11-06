# Clip Star Trek — reprise Codex — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Star Trek en intégrant également les modules du jeu si nécessaire ».

## Produit livré

[MP4 livré de 3 min 51](../../output/clips/star-trek-mecanismes-et-modules.mp4), H.264, 1440 × 900. Scénario e2e/clipStarTrek.spec.ts, T’Vael et Rin Sol fictifs, profil jetable et dés préparés.
Pilote 2.0.0 existant copié sans modification depuis scratch/recette-pilotes/ST_driver_gmos_finir.gmos-driver
dans output/clips/star-trek/pilote/. Le pilote déclare LCARS et Opérations ; aucun réimport requis pour le film.
Vaisseaux et préparation LCARS fictifs installés avant le titre par les commandes natives.

Huit chapitres : 2d20/Spécialisation et paiement en Menace ; assistance/aide du vaisseau/Détermination ;
Stress/blessures ; Réputation ; LCARS avec affectations et intervention/réponse privée ; bataille spatiale ;
tâche étendue et défi chronométré ; alerte reçue dans le Hub. Quinze scènes filmées.
Le client Hub est le vrai frontend HTTP/WebSocket, montré dans une iframe de tournage sans appBridge.
Pas d’appareil physique ni de son activé ; les légendes et le curseur restent dans le cadre parent.

## Reprendre

Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; quinze scènes et dix-huit
images du film relues. Rapports, provenance et repères dans output/clips/star-trek/ ; manuel,
synthèse et registre §223 mis à jour. Pour refaire : npm run build puis
npx playwright test e2e/clipStarTrek.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions ; GMOS_SORTIE_CLIP et GMOS_PILOTE_STAR_TREK changent
sortie et archive. Services locaux déjà autorisés ; aucun commit/push demandé.

## Ne pas repayer

- La case du pilote se nomme « Spécialisation », avec le seuil critique ajouté à son libellé quand cochée :
  employer une expression régulière, pas le libellé de Dune « Spécialisation pertinente ».
- Les deux modules ont chacun « Accès des personnages » : borner la case à l’article LCARS ou Opérations.
- Structure 9 donne un bonus de Résistance de 2, ajouté à la moitié de l’Envergure4 : Résistance4.
  Avec Boucliers15, un coup de16 les fait passer à3 et franchit moitié/quart.
- Fonction4 et obstacle1 donnent trois coches ; ne pas confondre le niveau du personnage et le défaut3 du formulaire.
- Les sélecteurs d’attaque ont leur label autour des options : choisir par préfixe plutôt que par égalité stricte.
  Les formulaires de tâche/défi se repèrent par hasText, sans réintroduire le parent dans le filtre relatif.
- Le formulaire d’alerte LCARS est dans Passerelle, pas dans un onglet « Alertes » séparé.
- Fixer fenêtre et viewport à 1440×900, bloquer resize/maximisation et garder les preuves à l’échelle CSS.
- Ne pas relancer tmp/creer-clip-star-trek.mjs : il écraserait les ajustements du scénario.
- Préserver les films précédents et les changements étrangers. Registre et synthèse sont partagés :
  un futur commit de ce lot doit sélectionner ses ajouts, pas tous les changements des fichiers.

**48 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/star-trek/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.
