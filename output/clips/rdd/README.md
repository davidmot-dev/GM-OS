# Clip Rêve de Dragon et TMR — 4 min 28

[Ouvrir le MP4](../reve-de-dragon-mecanismes-et-tmr.mp4) · [Tournage WebM](../reve-de-dragon-mecanismes-et-tmr.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900, curseur et
légendes françaises, sans voix ni musique. Nitouche et son adversaire sont fictifs ;
dés préparés et résultats de dés de table saisis pour rendre les exemples reproductibles.

Table de résolution et degrés du d100 ; fatigue et entraînement ; sept phases de Combat-OS ;
Château Dormant, potion et famine. Le module Terres Médianes du Rêve montre accès, carte,
montée et trajet G4–H4–I4–J4. Le raccord inscrit rêve/fatigue sur la vraie fiche après aperçu.
Une rencontre publiée bloque le déplacement, puis se résout sur la fiche Haut-Rêve.
Tympan d’Hypnos est payé et placé en réserve dans le livret avant d’être noté sur la carte.
Le carnet n’a pas de réserve parallèle ; la sortie conserve le demi-rêve et son journal.

Sélection de mécanismes : la santé complète, les recours, l’astrologie et le calendrier
ne font pas partie de ce parcours. Transport Hub, rechargement et matériel physique
ne sont pas rejoués. Les arbitrages narratifs restent au gardien.

Scénario : e2e/clipReveDeDragon.spec.ts ; pilote2.0.0 existant dans output/campagnes-tests/reve-de-dragon/,
inchangé. Build, lint, répétition et tournage normal réussis ; assertions sur effets réels,
treize scènes et dix-huit images du film relues. Rapports : verification.json, controle-video.json.
Aucun profil personnel utilisé, paquet installé ou code applicatif modifié.

Pour refaire : npm run build puis npx playwright test e2e/clipReveDeDragon.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final. Aucun commit/push demandé ;
films Nephilim, Crimes, Dune et NOC conservés.
