# Clip Barbarians of Lemuria et joueur tactile — 2 min 43

[MP4](../barbarians-of-lemuria-mecanismes-et-tablette.mp4) · [WebM monté](../barbarians-of-lemuria-mecanismes-et-tablette.webm) · [Sept chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440×900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Krongar de Valgard et son
aventure sont fictifs, dans un profil jetable avec des dés d’exercice préparés.

carrière et difficulté, annulation des bonus/malus et choix des deux meilleurs ou pires dés ; succès héroïque acheté sans promotion au légendaire ; double six héroïque puis légendaire ; Faveur divine gardant le second jet même moins bon, échec critique choisi et point accordé une fois ; réussite simple quand seul un double six pouvait réussir ; ordre de réaction ; attaque et héroïsme depuis le vrai Hub tactile ; fiche HTML et réception MJ.

Vrai Hub HTTP/WebSocket dans Edge jetable, contexte mobile/tactile 768×1024 sans appBridge ; 6 touchstart relevés dans le client principal. Attaque Agilité1 + Mêlée2 − Défense1 : dés5+4, total11 reçu chez le MJ ; héroïsme3→2 ; fiche HTML Barbare/héroïsme2 et Vitalité11 reçue côté MJ. Touchers par tap(), saisies et sélections par contrôles HTML ; aucun clavier tactile natif filmé. Deux raccords MJ/tablette contrôlés.

Aucun module indépendant dédié à BoL dans le catalogue actuel : panneau du jeu, fiche
HTML et Dice-OS sont filmés. Pilote 2.0.0 copié à l’identique dans pilote/ depuis
Export Dirvers/corriges/. Aucun réimport nécessaire pour ce film.

Démonstration ciblée, sans combat complet ni recette exhaustive : magie, foi, alchimie, dégâts/armure, usages narratifs de l’héroïsme, récupération et progression ne sont pas rejoués. Personnage et dés d’exercice préparés. La Vitalité à 11 est saisie manuellement ; aucun calcul de dégâts revendiqué. Aucun appareil physique utilisé.

Build, lint, répétition et tournage normal réussis ; assertions sur les fiches et
les échanges ; seize scènes et vingt images du MP4 relues, raccords compris.
Rapports : verification.json et controle-video.json. Les deux tournages bruts et
montage.json sont conservés ici. Aucun profil personnel, paquet installé ou code
applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipBol.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
Pour remonter : node outils/clips/monter_clip_bol.mjs output/clips/bol/tournage-mj.webm output/clips/bol/tournage-tablette.webm output/clips output/clips/bol/montage.json.
