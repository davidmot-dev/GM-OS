# Crimes 2 dans GM-OS

[Voir le film](Crimes-2-GM-OS-1.0.0.mp4) — 16 min 47 s, neuf chapitres, 38 séquences.

Textes français incrustés, sans voix ni piste audio. Rythme plus vif demandé par David : au plus 125 mots/minute et 14 caractères/seconde, cartes d’au moins sept secondes avec marges et pauses supplémentaires pour les calculs. Aucun geste accéléré. SRT UTF-8, transcription, chapitres et piste sélectionnable inactive par défaut joints.

## Ce que le film montre

La vraie fiche HTML de Gabriel, puis le profil RECETTE JET : Physique GARDE Sport, les 1 imposés, la garde choisie et confirmée, les suites de Névrose confirmées (0→1→3→4), le dépassement annoncé et sa fatigue. Atteintes de gravité différente, récupération Bonne nuit et soin accordé, Angoisse/Névrose et test psychotique avec suite confirmée.

Le dossier d’enquête natif : points cumulés, seuil, révélation au seul profil JET vue du meneur, partage public et hypothèse. Combat-OS : rencontre invoquée avec CORPS et Opposant, cibles, initiative 6/5, tir au Deprez et réponse au Galand à dix mètres, dégâts fixes, deux blessures chacun, une munition retirée à chacun, suite et clôture. Enfin appel de contact, fortune, développement et rechargement réel de fenêtre.

Les héros de l’affaire restent hors des essais. Les dés préparés sont annoncés, calculés par le moteur et le hasard est restauré après chaque exemple. Ils ne démontrent pas la distribution aléatoire. Les profils et valeurs adaptés sont consignés dans verification-import.json.

## Refaire les gestes

1. Utiliser une instance de recette et le pilote Crimes 1.0.0 compatible avec le moteur du 23/11/2026. La copie du pilote est inchangée ; la campagne n’installe pas le code applicatif.
2. Importer une seule fois Crimes-Heures-Rayees-TOURNAGE.gmos en Tel quel. Elle conserve les identifiants du lot Les Heures rayées : ne pas l’importer à côté de l’original dans une partie active sans décider de ces collisions.
3. Ouvrir la campagne TOURNAGE CRIMES, puis les profils RECETTE. Les chapitres, scenario.md et transcription.md donnent les valeurs, les gestes et les états attendus. En jeu normal, laisser les dés réels décider du résultat.
4. Pour répéter, utiliser une nouvelle instance jetable ou restaurer seulement les champs d’essai. Fin de scène et Bonne nuit concernent le groupe ; Nexus Remplacer concerne toute la campagne. Reset Combat vide le plateau, pas les blessures.

## Limites observées

- Contacts : le filtre courant conserve encore les champs de loyauté et d’appels dans les données joueur, constat historique CRI-A01 retrouvé par le contrôle pur. Le film le dit. La confidentialité n’est pas validée, et aucun transport Hub ou appareil physique n’a été testé.
- Combat-OS conserve une barre générique « PV 5/5 » sur les cartes. Elle ne suit pas les blessures de Crimes : lire le badge « Physique actuel 3 » et les deux marques de blessure sur la fiche. Cette barre n’est pas une ressource supplémentaire du jeu.
- La fiche HTML est montrée en vue d’ensemble ; ses petits libellés demandent le plein écran. Zoom de fenêtre 120 % dans le seul profil filmé ; interfaces réelles, aucune reconstruction de l’application.
- Deux tirs sont montrés, sans jet d’esquive opposé. La mêlée simultanée, les autres manœuvres, les variantes du seuil névrotique, les rivalités de styles et la fortune commune ne font pas partie de cet échange. L’initiative narrative reste au meneur.
- Le rechargement d’arme coûte deux assauts et reste à jouer ; seul le retrait d’une munition après chaque tir est filmé. Pas de rechargement gratuit pendant l’échange.
- Le dossier d’enquête et les munitions sont des règles optionnelles du livre. Le seuil 10 de Fortune est un choix du pilote. Aucun module Crimes indépendant au catalogue.
- Revue IA des images du film final, de toutes les cartes et des résultats. Aucun visionnage humain continu ni confort humain certifié ; aucune recette attribuée à David. Le rapport distingue les contrôles exécutés de ceux qui restent à faire.

## Preuves et isolation

Build du 23/11 réussi ; 34 tests ciblés réussis. Répétition puis prise normale complète, calage sur mire et contrôle début/milieu/fin, décodage intégral, absence d’audio, titres et bornes des neuf chapitres, empreintes des sources et livrables contrôlés.

Lanceur officiel repris avec ses protections, build fixé, profil/AppData/sauvegardes/corpus/coffre jetables, appareils désactivés et HTTP externe bloqué. Ports locaux 4100/4101 déjà autorisés. Aucun fichier applicatif, donnée personnelle, paquet ou pilote modifié. Les PDF complets ne sont pas joints.

Sources, scripts, répétitions et bruts restent dans le dossier parent. Ce film ne marque pas le pilote testé par David. Aucun commit ni push automatique.
