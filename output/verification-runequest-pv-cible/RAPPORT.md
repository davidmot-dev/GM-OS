# RuneQuest — PV de la cible, 01/11/2026

RQ-A2 livré, nouvel essai de David attendu. La ligne de cible montre ses PV maximum de zone et se met à jour au changement de cible ; valeurs manquantes inconnues, zéro conservé. Localisation et journal sans PV du lanceur.

Régression avant correction : 7 tests verts, 9 rouges. Après : 89 tests passent sur trois fichiers ; 42 tests panneau/manuel passent (dont 16 déjà comptés). Lint ciblé et compilation/types réussis. Un essai Electron isolé RuneQuest passe en 27,4 s : deux cibles 7/3 PV, changement sans nouveau D20, sélection vide explicite ; fiche HTML et coups localisés joués aussi.

Capture examinée : [suites du jet](captures/jeu-runequest-suites.jpg), copiée dans le manuel. Les autres images accompagnent le parcours sans remplacer les captures existantes. Empreintes dans [verification.json](verification.json).

Le pilote 2.1.0 de 320 champs a été reconstruit uniquement sous tmp avec le générateur existant depuis le pilote 2.0.0 du lot de recette. Les trois archives restent en 2.0.0 ; leur alignement est RQ-A1. Aucun profil ou fichier personnel consulté ; isolement via lancerGmOs, aucun paquet ni Git d’écriture.
