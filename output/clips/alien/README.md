# Clip Alien, trois modules et joueur tactile — 3 min 08

[MP4](../alien-mecanismes-modules-et-tablette.mp4) · [WebM monté](../alien-mecanismes-modules-et-tablette.webm) · [Neuf chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440×900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Nel Varga, son équipage et
la scène du Montero sont fictifs, dans un profil jetable avec des dés du panneau préparés.

réserve de base et Stress, forçage et Point de Récit en mode Cinéma ; Panique provisoire puis Figé10 annulant l’action ; Air8 testé à six dés et ramené à6 ; Conestoga du catalogue, poste Senseurs et ordres secrets ; M314 raccordé au plan privé et batterie ; vrai Hub tactile, test et question /M ; réponse privée du MJ ; lecture des échos et ordre spatial du joueur ; révélation et historique MJ.

Vrai Hub HTTP/WebSocket dans Edge jetable, contexte mobile/tactile 768×1024 sans appBridge ; 15 événements touchstart reçus. Test reçu au MJ, question /M reçue, réponse du meneur lue, écho sans noms privés et ordre de verrouillage reçu côté MJ. Touchers par tap(), saisies et choix par contrôles HTML ; pas de clavier tactile natif filmé. Deux séquences tactiles alternent avec le pupitre MJ ; quatre raccords contrôlés.

Les trois modules du pilote sont réellement raccordés au Hub. Le plan et ses pions,
le Montero et son poste sont préparés avant le générique ; les Marines, le combat et
l’ordre adverse sont mis en place via commandes natives hors gestes commentés.
Le Conestoga, les accès, le scan, les tests, la question/réponse, l’ordre du joueur
et la révélation passent par leurs écrans réels. Le M314 conserve son hasard natif.

Démonstration ciblée : pas de recette exhaustive du pilote, ni combat spatial complet (arrêt après révélation), ni blessures/soins, xénomorphes, équipement/catalogue, fin d’acte ou progression complète. Personnages et dés du panneau préparés ; test de batterie M314 aléatoire. Aucun appareil physique utilisé.

Pilote1.9.0 copié à l’identique dans pilote/ depuis l’export Alien fourni par David.
Aucun réimport nécessaire pour ce film. Build, lint, répétition et tournage normal réussis ;
assertions sur les fiches et les échanges ; dix-huit scènes et vingt-huit images du MP4
relues, raccords compris. Rapports : verification.json et controle-video.json.
Les deux tournages bruts et montage.json sont conservés ici.
Aucun profil personnel, paquet installé ou code applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipAlien.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
Pour remonter : node outils/clips/monter_clip_alien.mjs output/clips/alien/tournage-mj.webm output/clips/alien/tournage-tablette.webm output/clips output/clips/alien/montage.json.
