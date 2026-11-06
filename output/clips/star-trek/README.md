# Clip Star Trek — 3 min 51

[Ouvrir le MP4](../star-trek-mecanismes-et-modules.mp4) · [WebM](../star-trek-mecanismes-et-modules.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900, curseur,
surlignages et légendes françaises, sans voix ni musique. T’Vael, Rin Sol, mission et
vaisseaux sont fictifs ; dés préparés pour rendre les exemples reproductibles.

2d20, spécialisation, Impulsion et paiement choisi en Menace ; complication repoussée ;
assistant, aide du vaisseau et Occasion parfaite ; Stress, Protection, blessure et soin
confirmé ; Réputation et Gloire. Le module LCARS montre affectations et accès distincts,
intervention scientifique, réponse privée reçue et alerte rouge. C’est le vrai Hub HTTP/WebSocket,
sans appBridge, dans une iframe du cadre de tournage. La préparation de fiction et les
vaisseaux ont été installés par les commandes natives avant le titre.

Le module Opérations applique les dégâts après une réussite supposée résolue à la table :
16 − Résistance4, Boucliers15 → 3, secousse et brèche. La tâche étendue coche Fonction4
moins obstacle1 ; le défi passe de six à quatre intervalles après une tâche.

Sélection de mécanismes : toutes les consoles LCARS, l’alternance des camps, le son,
les médias privés, l’import/rechargement et les appareils physiques ne sont pas rejoués.
Les jets médical et d’attaque spatiale sont supposés résolus à la table avant confirmation.
LCARS ne calcule ni jet, dégât ni soin. Les essais matériels restent distincts.

Scénario : e2e/clipStarTrek.spec.ts ; pilote 2.0.0 existant copié à l’identique dans pilote/.
Build, lint, répétition et tournage normal réussis ; assertions sur les fiches, réserves,
états natifs des modules et réception Hub. Quinze scènes et dix-huit images du MP4 relues.
Rapports : verification.json et controle-video.json. Aucun profil personnel utilisé,
paquet installé ou code applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipStarTrek.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
