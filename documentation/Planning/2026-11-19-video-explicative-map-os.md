# Map-OS — vidéo détaillée livrée le 19/11/2026

**Livré : MP4 contrôlé de 18 min 42,48 s, 46 séquences et 13 chapitres.** David invoque GM-OS Vidéos explicatives « sur le module Map-OS en détail ». Préférences conservées : textes français, sans voix, rythme plus vif de la vidéo Alien. Dossier : `output/videos-explicatives/map-os/2026-11-19-r1/`.

## Périmètre et isolation

Module natif Cartographie, contexte de recette Orphée avec Alien 1.11.0, Eli Voss et Tor Malik. Aucun cours de règles ou combat complet d'Alien : le film porte sur le plateau. Copie de la recette déjà migrée et import Nexus en mémoire vérifié ; trois voyageurs/douze PNJ, autres voyageurs conservés. Portraits/pions pédagogiques E bleu et T rouge pour les deux acteurs ciblés. Deux plans originaux 960 × 640 et une vidéo silencieuse de six secondes dans `medias/`.

Build courant de **14h39 copié dans `build-fixe/`**, pas reconstruit. `lancerGmOsFixe.ts` copie le launcher officiel en adaptant seulement la racine du dépôt et le chemin de l'entrée compilée ; ses protections AppData/sauvegardes/corpus/coffre et appareils sont conservées. Le vrai Player Hub **natif Electron** est ouvert par son bouton. Un repérage avec un navigateur sur `?window=hub` n'a pas reçu la carte : ne pas le présenter comme une projection valide. Les fenêtres natives synchronisent réellement carte, brouillard et déplacements.

L'accord local déjà donné dans cette conversation pour l'instance jetable et les ports **4100/4101** reste applicable. Réseau externe bloqué après lancement, aucune IA déclenchée, aucune sortie audio physique démontrée. Aucun changement de `src/` ou `electron/`, installation, git d'écriture, donnée personnelle ni fichier d'un autre chantier retouché.

## Livraison et vérifications

Film : [Map-OS-en-detail.mp4](../../output/videos-explicatives/map-os/2026-11-19-r1/livraison/Map-OS-en-detail.mp4). [Instructions et limites](../../output/videos-explicatives/map-os/2026-11-19-r1/livraison/LIRE-MOI.md).

MP4 H.264, 1440 × 1128, 25 images/s, 54 269 106 octets, sans piste audio ; sous-titres sélectionnables inactifs par défaut. SHA-256 : `cd29bd8103cbf6b1d2fda61a7c70ce23b423db0c1323569eaaeb037ea1074cfb`.

La livraison comprend SRT UTF-8, transcription, chapitres, plan/scénario, sources et empreintes, contrôles, campagne de recette, pilote dépendant et trois médias originaux. Les 19 empreintes du paquet sont vérifiées après copie. La campagne conserve son identifiant historique : les consignes préviennent les conflits d’import et précisent qu’elle n’est pas une sauvegarde intégrale du plateau Map-OS.

Import vérifié par le vrai Nexus puis construction d’une sauvegarde validée (Vitest, bride 4 travailleurs). Prise normale `prises-r1` : **46/46 séquences, test Playwright passé en 19,1 min**. Textes `textes-r12/lecture.json`, plan et sources figés. Profil local demandé par David : 125 mots/minute, 14 caractères/s, minimum 7 s par carte avec marges ; pauses 1/0,7/2,5 s, gestes réels. Le plugin global reste inchangé pour cette vidéo.

Deux mires indépendantes : 1480 et 6760 ms, résolution 40 ms ; revue IA des mires et début/milieu/fin des deux sources. `prises.json` consigne le calage. Montage `montage-r1`, décodage intégral réussi, empreintes build/pilote/campagne/plan/lecture/prises vérifiées. Revue IA de **92 cartes sur 16 planches et 20 vues complètes du MP4 final** ; le ping est aussi extrait pendant son apparition à 350,6615 s. Les textes restent sous l’interface. Voir `controle-final.json`, `sonde-finale.json` et les preuves dans `montage-r1/`. **Aucun visionnage humain continu ni confort de lecture humain certifié ; aucun essai attribué à David.**

## État de reprise

Aucun rendu ni processus de tournage ne reste à attendre. Ne pas régénérer ou écraser `prises-r1`, `textes-r12`, `montage-r1` ou `livraison` ; partir d’une nouvelle révision pour toute modification. Les répétitions R1–R12 ne sont pas livrables. R12 avait validé 44 séquences avant une ambiguïté de bouton Cortex, corrigée par le repérage du bouton de l’en-tête ; la prise normale a ensuite passé les 46.

Scripts : `preparer-campagne.mjs`, `verifier-preparation.test.ts`, `preparer-plan.mjs`, `tourner.spec.ts`, `caler.py`, `planches-finales.py`, `preuves-finales.py`, `ping-final.py`, `livrer.py`. La génération de campagne/plan refuse une prise normale déjà présente. FFmpeg/FFprobe et Python existants, aucune installation. Le lanceur garde les protections officielles et le build copié.

Registre des chantiers et synthèse des pilotes sont modifiés par d’autres travaux (statut git relu en fin de livraison) : **non retouchés**. Cette note autonome contient la livraison et l’état de reprise. Aucun code du produit, pilote, manuel partagé ou thème n’est modifié pour réaliser le film.

## Pièges payés et limites à montrer

- Le Media Hub reste ouvert après **Utiliser** : le fermer par **Échap**. Les sélecteurs lisent les noms réels, pas leur transformation CSS en majuscules. Attention aux apostrophes ASCII de `Sauver l'état` et `Vision de l'Oracle`.
- Écrire les scripts français en UTF-8. Les here-strings PowerShell envoyées à Node nécessitent `$OutputEncoding = [Text.UTF8Encoding]::new($false)` ; une première copie avait transformé les tirets du nom de rencontre en `?`, corrigés avant toute prise normale.
- Un pion absorbe le début d'un tracé : ne pas démarrer une zone de danger au centre d'Eli. Le tracé courant part de (500,330), puis Eli est déplacé vers (510,340).
- Pour les glissements, un événement de souris par point et une attente de 55 ms permettent au rendu de suivre. Multiplier les sous-événements sans laisser React se mettre à jour fait perdre les déplacements.
- L'œil au survol du pion peut absorber le clic via la capture du pointeur. Activation réelle par **Espace**, puis **relance explicite de la projection** et vérification du Hub. Sans relance, `tokens.isVisible` pouvait différer de `projectedTokens.isVisible`. Cacher, montrer puis déplacer depuis le Hub sont passés après cette adaptation.
- Avec le pilote Alien, **Précédent** ne décrémente pas le tour : il affiche « Alien : revenir par la carte souhaitée ; les actions déjà payées sont conservées. » Le film l'explique ; ne pas remplacer ce constat par un faux retour réussi.
- Les bascules de calques météo/heure du MJ **ne sont pas transmises au Hub natif** dans ce parcours, contrairement au guide. Les valeurs **Aucun** et **Jour** sont réellement reçues et coupent l'ambiance. Les calques sont rétablis localement ensuite ; le preset conserve désormais une ambiance de jour sans pluie.
- Les choix de forme Danger vont dans `useMapUIStore`, tandis que le tracé lit `useMapStore.dangerShape` : **rectangulaire reste circulaire**. Le film le constate sans corriger le produit.
- `DangerZoneLayer` (`z-25`) reste **visible sur le brouillard noir** (`z-20`) du Hub. Ne pas annoncer de pièges secrets protégés par ce brouillard. Les effets magiques ont leur propre calque inférieur.
- La création du modèle Gravats (nom, couleur, terrain difficile et coût ×2) a passé le repérage ; présence dans la zone, presets, recharge et audio vidéo vérifiés dans la prise normale complète. Aura, matériel, tablette physique et IA ne sont pas certifiés.

Registre, synthèse des pilotes et état général déjà modifiés par d'autres travaux : ne pas les reprendre pour ranger cette vidéo. Les contrôles finaux doivent distinguer revue IA d'images et visionnage humain continu non exécuté.

La revue du MP4 final a aussi constaté que la sphère retirée côté MJ en séquence 27 reste affichée côté Hub en séquence 29. La suppression immédiate sur le Hub n’est pas certifiée ; contrôler cette vue et relancer si nécessaire. Observation ajoutée aux instructions et au contrôle final, sans masquer les images réelles.
