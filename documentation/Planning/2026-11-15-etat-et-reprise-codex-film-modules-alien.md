# Vidéo des trois modules Alien — état et reprise Codex, 15/11/2026

David : « tu me refait une vidéeo avec playwright sur l'utilisation du module externe
d'Alien ? » ; choix confirmé : « Les trois modules, focus sur le M314 ».

## Produit livré

[MP4 de 2 min 57](../../output/clips/alien-modules-m314-orientable.mp4), H.264, 1440×900,
25 images/s, légendes françaises et sept chapitres, sans son. WebM disponible à côté.
[Dossier de livraison](../../output/clips/alien-modules-2026-11-15/README.md) : captures,
chapitres, pilote copié sans modification, bruts, montage et rapports de contrôle.

`e2e/clipModulesAlien.spec.ts` montre les trois accès, l'échange privé MU/TH/UR, le M314
orientable (porteur, 90°, cap partagé, relevé payé, immobilité et nouveau Tour), l'ordre
Senseurs et sa révélation, puis l'enregistrement d'un préréglage. Pilote 1.11.0 et module
M314 0.5.0. Aucun changement applicatif. L'ancien film Alien reste disponible.

`outils/clips/monter_clip_alien.mjs` accepte maintenant un nom de sortie et un sous-dossier
optionnels, en conservant les valeurs historiques par défaut, ainsi que les chemins des
exécutables FFmpeg/FFprobe. `outils/clips/verifier_clip_modules_alien.mjs` décode les deux
formats et extrait les scènes et raccords à relire. Manuel 54, synthèse et registre § 255 liés.

## Reprise

Ouvrir le MP4 et ses chapitres. Rien à terminer pour le film ; A11/T9 sur appareil
physique et A12 restent à essayer par David, sans changement de leur statut.
Build, lint ciblé, répétition et tournage final réussis ; décodage intégral des deux
formats réussi. 31 images du film, six raccords et la dernière séquence relus.
Les 28 tests du manuel passent ; `git diff --check` est propre.
Le vrai Hub a reçu 23 événements tactiles. La vidéo ne démontre pas la résolution
complète d'un combat spatial, le rappel d'un préréglage ou une remise à zéro.

## Ne pas repayer

- Utiliser `lancerGmOs` et son isolation contrôlée ; profil, corpus, sauvegardes, joueurs
  et équipages sont jetables. Ne jamais ouvrir les données de David pour tourner.
- Réserver la place des légendes et défiler jusqu'au radar après avoir touché les
  commandes de cap : un défilement resté sur les boutons coupe le radar à l'image.
- Le cadre tablette vient de l'origine locale du Hub, avec iframe à 75 % et
  `overflow:clip`. Les touchers sont émulés ; aucun matériel physique revendiqué.
- Laisser le test natif de batterie aléatoire. Le passage au Tour suivant efface les
  mouvements ; réactiver uniquement les pions qui doivent encore bouger.
- Retirer du dernier intervalle la fermeture du navigateur Hub. Garder l'origine zéro
  de son brut : sa durée comprend une dernière image maintenue à la fermeture.
- Les temps des photos sont des horloges murales approximatives ; contrôler aussi
  les images réellement extraites du MP4, surtout le dernier chapitre.
- FFmpeg/FFprobe 9.0.2 sont déjà installés sous le paquet WinGet Gyan.FFmpeg dans
  `C:/Users/david/AppData/Local/Microsoft/WinGet/Packages/`. Définir les deux variables
  si les exécutables ne sont pas dans PATH. Aucun téléchargement nécessaire.
- Employer les commandes `.cmd` dans PowerShell. Pour le français, écrire les sources
  UTF-8 avec `apply_patch`, pas avec le pipeline PowerShell encodé par défaut en ASCII.

**Commit demandé par David le 15/11 : « ok commit » ; aucun push demandé.**
Préserver les exports Alien et Delta Green déjà présents,
ainsi que les fichiers temporaires étrangers. Les fichiers de cette livraison sont
énumérés dans `output/clips/alien-modules-2026-11-15/fichiers-de-livraison.json` :
**68 fichiers dans le commit de livraison**, dont les films, bruts et images de contrôle.
