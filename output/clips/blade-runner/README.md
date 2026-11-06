# Clip Blade Runner et joueur tactile — 3 min 17

[MP4](../blade-runner-mecanismes-et-tablette.mp4) · [WebM monté](../blade-runner-mecanismes-et-tablette.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 07/11/2026. H.264, 1440×900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Agent Kessler et son
aventure sont fictifs, dans un profil jetable avec des dés d’exercice préparés.

D10/D8, seuils de six et dix, soutien apportant son dé ; forçage humain avec relance volontaire d’une réussite, deux forçages du réplicant et crâne payé une seule fois ; souvenir clé consommé pour la séance ; stress subi puis objet fétiche ; blessure mortelle préparée, sauvegarde, stabilisations Round→Quart→hors de danger, soins et guérison en cours ; échange des cartes3/7 et protection2D8 ; test et forçage mental depuis le vrai Hub tactile ; Humanité HTML et réception MJ.

Vrai Hub HTTP/WebSocket dans Edge jetable, contexte mobile/tactile 768×1024 sans appBridge ; 6 touchstart relevés dans le client principal. Le test mental et son forçage sont reçus chez le MJ ; Sang-froid5→4, Santé7 conservée ; Humanité4 saisie dans la fiche HTML et reçue côté MJ. Touchers par tap(), sélections HTML ; aucun clavier tactile natif filmé. Deux raccords MJ/tablette contrôlés.

Aucun module indépendant dédié à Blade Runner dans le catalogue actuel : panneau du jeu, fiche
HTML et Dice-OS sont filmés. Pilote 2.0.0 copié à l’identique dans pilote/ depuis
scratch/recette-br/. Aucun réimport nécessaire pour ce film.

Exercices ciblés, sans combat complet ni recette exhaustive : les effets critiques de stress/Brisé, mort, premiers secours, main secourable, récupération, poursuites, fin de guérison et progression ne sont pas rejoués. Plaie mortelle et cartes3/7 préparées avant le générique ; dés d’exercice choisis. Humanité à4 saisie manuellement, sans bilan de fin de session. Le compteur de PV générique reste à8 malgré la Santé à7 : constat de raccord séparé. Aucun appareil physique utilisé. Le rechargement/import du suivi de blessure n’est pas testé : la semence refuse ce JSON structuré, posé après chargement pour le tournage (constat hors périmètre consigné au registre).

Build, lint, répétition et tournage normal réussis ; assertions sur les fiches et
les échanges ; dix-huit scènes et vingt-deux images du MP4 relues, raccords compris.
Rapports : verification.json et controle-video.json. Les deux tournages bruts et
montage.json sont conservés ici. Aucun profil personnel, paquet installé ou code
applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipBladeRunner.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
Pour remonter : node outils/clips/monter_clip_blade_runner.mjs output/clips/blade-runner/tournage-mj.webm output/clips/blade-runner/tournage-tablette.webm output/clips output/clips/blade-runner/montage.json.
