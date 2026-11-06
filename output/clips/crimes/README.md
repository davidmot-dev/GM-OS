# Clip Crimes — 3 min 54

[Ouvrir le MP4](../crimes-mecanismes.mp4) · [Tournage WebM](../crimes-mecanismes.webm) · [Repères des huit chapitres](chapitres.md)

Demandé par David le06/11/2026, filmé avec Playwright dans GM-OS. H.264, 1440 × 900,
curseur et légendes françaises, sans voix ni musique. Affaire et personnages fictifs,
dés préparés pour des exemples reproductibles. Aucun profil personnel utilisé.

Jet Potentiel GARDE Compétence et spécialisation ; garde choisie ; dépassement ;
atteintes/repos ; psychologie ; dossier d’enquête et indices privés puis partagés ;
combat/munitions ; contacts/fortune ; tempérament et développement.

Scénario : e2e/clipCrimes.spec.ts ; pilote complet conservé dans pilote/ (étiquette historique1.0.0),
identique à l’archive de recette. Aucun pilote ni code applicatif modifié.
Construction et lint réussis, répétition et tournage normal réussis ; dix-sept assertions
sur les changements réels, quinze scènes et dix-huit images du MP4 relues.
Rapports : verification.json (parcours/repères), controle-video.json (format/provenance/relecture).

Un défaut d’aperçu est consigné au registre §1bis : après deux blessures appliquées,
l’aperçu recalcule4 sur le Physique diminué, alors que le reçu et les marques restent2.
Le film montre le calcul avant le coup puis le plateau avec Physique3 confirmé.
Pas de correctif source dans cette livraison vidéo. Les transports Hub ne sont pas rejoués.
Le seuil de fortune10 est présenté comme le choix de David.

Pour refaire : npm run build, puis npx playwright test e2e/clipCrimes.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final. Aucun paquet installé,
aucun commit/push demandé pour cette livraison. Les sorties Nephilim sont conservées.
