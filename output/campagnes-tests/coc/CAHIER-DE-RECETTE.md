# COC2 — cahier de recette

Tous les résultats humains commencent NON TESTÉS. Les dés explicitement préparés sont des exemples contrôlés : les lancers normaux restent aléatoires. Réinitialiser le seul laboratoire avant un cas incompatible.

## GM-01 — 01-Les-Minutes-de-Verre.gmos

Précondition : Profil jetable avec trois joueurs et anciens PJ fictifs

Action : Importer 01, 02 et 03 via Nexus

Attendu : Trois campagnes ; p-1/p-2/p-3 conservés ; 24 nouveaux PJ, anciens PJ et avatars inchangés.

Source : Types Nexus v1, NexusService, e2e/lancerGmOs.ts ; relevé autorisé cthulhu-hack-joueurs.json

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## GM-02 — 01-Les-Minutes-de-Verre.gmos

Précondition : 02 modifiée ; note de 01 conservée

Action : Réimporter seulement 02 avec Remplacer

Attendu : Les neuf PJ de 02 retrouvent leurs états ; note et PJ de 01 inchangés.

Source : Types Nexus v1, NexusService, e2e/lancerGmOs.ts ; relevé autorisé cthulhu-hack-joueurs.json

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## GM-03 — 01-Les-Minutes-de-Verre.gmos

Précondition : Pilote déjà installé

Action : Contrôler ID/version et gabarit avant import

Attendu : custom-1793122664880, version 2.0.0, tpl-1793122664880 ; garder la dépendance identique, remplacer explicitement une ancienne version.

Source : Types Nexus v1, NexusService, e2e/lancerGmOs.ts ; relevé autorisé cthulhu-hack-joueurs.json

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## GM-04 — 01-Les-Minutes-de-Verre.gmos

Précondition : 01 active ; nom et échelle d’évolution modifiés

Action : Recharger GM-OS et reconnecter le Hub

Attendu : Valeurs conservées et aucun nouveau doublon.

Source : Types Nexus v1, NexusService, e2e/lancerGmOs.ts ; relevé autorisé cthulhu-hack-joueurs.json

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## GM-05 — 01-Les-Minutes-de-Verre.gmos

Précondition : Séance active, marqueurs SECRET_MJ_COC_RECETTE fictifs

Action : Examiner les trames de trois Hub

Attendu : Aucun marqueur privé reçu ; chaque présence est un ÉCHEC, y compris gmSecrets de séance (GM-05).

Source : Types Nexus v1, NexusService, e2e/lancerGmOs.ts ; relevé autorisé cthulhu-hack-joueurs.json

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## GM-06 — 01-Les-Minutes-de-Verre.gmos

Précondition : Hub attribué à un PJ, autre PJ à un autre joueur

Action : Tenter une édition de l’autre PJ par le parcours disponible

Attendu : Refus ou absence de droit d’écriture ; aucune mutation de l’autre PJ. Distinguer lecture et écriture.

Source : Types Nexus v1, NexusService, e2e/lancerGmOs.ts ; relevé autorisé cthulhu-hack-joueurs.json

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## GM-07 — 01-Les-Minutes-de-Verre.gmos

Précondition : Hub 360/768/1180 px

Action : Ouvrir jet et Fiche du jeu puis sauvegarder

Attendu : Commandes accessibles ; pas de débordement de page ; écriture reçue par le MJ.

Source : Types Nexus v1, NexusService, e2e/lancerGmOs.ts ; relevé autorisé cthulhu-hack-joueurs.json

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## AV-01 — 01-Les-Minutes-de-Verre.gmos

Précondition : Acte 1, parvis

Action : Refuser un test et aller observer la berge

Attendu : Avis et niveau restent accessibles ; poste et café sont deux autres chemins.

Source : coc-scenario.mjs (fiction originale) ; corpus l-investigation-par-evidences-et-recherche-a-seuils-multiples.md, livre p. 67-68

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## AV-02 — 01-Les-Minutes-de-Verre.gmos

Précondition : Atelier, test d’INT échoué

Action : Demander le boîtier et lire la fiche de maintenance

Attendu : Défaut temporel compris ; échec ne bloque pas le relais ni les archives.

Source : coc-scenario.mjs (fiction originale) ; corpus l-investigation-par-evidences-et-recherche-a-seuils-multiples.md, livre p. 67-68

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## AV-03 — 01-Les-Minutes-de-Verre.gmos

Précondition : Atlas

Action : Ouvrir huit lieux et suivre leurs liens PNJ/lieux

Attendu : Huit cartes, douze PNJ, aucun lien mort ; aucun effet appliqué par changement de lieu.

Source : coc-scenario.mjs (fiction originale) ; corpus l-investigation-par-evidences-et-recherche-a-seuils-multiples.md, livre p. 67-68

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## AV-04 — 01-Les-Minutes-de-Verre.gmos

Précondition : Indice caché

Action : Révéler une seule copie anonymisée

Attendu : Seul l’indice choisi devient public ; autres indices restent cachés.

Source : coc-scenario.mjs (fiction originale) ; corpus l-investigation-par-evidences-et-recherche-a-seuils-multiples.md, livre p. 67-68

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## AV-05 — 01-Les-Minutes-de-Verre.gmos

Précondition : Acte 3

Action : Choisir expertise, accord surveillé ou publication

Attendu : Trois issues avec conséquences ; aucune n’exige de vaincre un adversaire.

Source : coc-scenario.mjs (fiction originale) ; corpus l-investigation-par-evidences-et-recherche-a-seuils-multiples.md, livre p. 67-68

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## AV-06 — 01-Les-Minutes-de-Verre.gmos

Précondition : Quatre séances prévues

Action : Activer puis conclure la première

Attendu : Les scènes prévues appartiennent au bon acte ; aucune séance déjà accomplie à l’import.

Source : coc-scenario.mjs (fiction originale) ; corpus l-investigation-par-evidences-et-recherche-a-seuils-multiples.md, livre p. 67-68

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## AV-07 — 01-Les-Minutes-de-Verre.gmos

Précondition : Butin : 101 euros de recette, trois PJ

Action : Partager 33 à chacun et conserver 2

Attendu : 101 au total ; absence de monnaie de table ou d’avantage mécanique inventé.

Source : coc-scenario.mjs (fiction originale) ; corpus l-investigation-par-evidences-et-recherche-a-seuils-multiples.md, livre p. 67-68

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## AV-08 — 01-Les-Minutes-de-Verre.gmos

Précondition : Storyboard et Sound-OS

Action : Ouvrir un moment puis lire un signal à faible volume

Attendu : Bon schéma et bon signal synthétique de 4 s ; aucune voix, lampe, MIDI ou TTS prétendument configuré.

Source : coc-scenario.mjs (fiction originale) ; corpus l-investigation-par-evidences-et-recherche-a-seuils-multiples.md, livre p. 67-68

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-01 — 03-Heros-Blues-et-Tests.gmos

Précondition : H00, base AGI 2 choisie dans le panneau

Action : Préparer difficulté 15 sans modificateur

Attendu : Un d20 et bonus +2 ; aucune addition AGI+INT ni comptage de dix succès.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-02 — 03-Heros-Blues-et-Tests.gmos

Précondition : Base +2, difficulté 15, dé préparé 13

Action : Résoudre ce résultat contrôlé

Attendu : Total 15 : réussite, marge 0. Avec 12 : échec, total 14.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-03 — 03-Heros-Blues-et-Tests.gmos

Précondition : Base +2, difficulté 25, dé 20

Action : Résoudre le résultat préparé

Attendu : Réussite critique malgré total 22 inférieur à 25.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-04 — 03-Heros-Blues-et-Tests.gmos

Précondition : Base +20 synthétique, difficulté 5, dé 1

Action : Résoudre le résultat préparé

Attendu : Échec critique malgré total 21 ; aucun bonus du héros ne supprime le 1.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-05 — 03-Heros-Blues-et-Tests.gmos

Précondition : Dés préparés [4,17], dé bonus

Action : Résoudre avec un dé bonus puis un dé malus

Attendu : Naturel 17 pour bonus, 4 pour malus ; les deux ne s’additionnent pas.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-06 — 03-Heros-Blues-et-Tests.gmos

Précondition : Panneau au d20

Action : Régler bonus 1 et malus 1, puis bonus 2 et malus 0

Attendu : Annulation : un d20 ; surplus bonus : seulement deux d20 et le meilleur.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-07 — 03-Heros-Blues-et-Tests.gmos

Précondition : Base +2, conditions successives 1/2/3/−1/−2/−3

Action : Comparer les préparations

Attendu : Bonus total +4/+7/+12/0/−3/−8 ; trois conditions plafonnent à ±10.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-08 — 03-Heros-Blues-et-Tests.gmos

Précondition : Base +2, deux alliés autorisés

Action : Régler Aides à 2

Attendu : Bonus total +6, sans test de réserve ni ressource partagée.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-09 — 03-Heros-Blues-et-Tests.gmos

Précondition : Base +2 hors combat, seuil 10, temps disponible

Action : Prendre son temps

Attendu : Total 12 sans dé, aucun critique ; durée décalée. Contre 15, le MJ refuse cette option insuffisante.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-10 — 03-Heros-Blues-et-Tests.gmos

Précondition : Base +5, seuil 5, mode Rapide et furieux autorisé

Action : Activer le mode et résoudre

Attendu : Réussite automatique sans critique ; si base < seuil, le moteur lance.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-11 — 03-Heros-Blues-et-Tests.gmos

Précondition : Dé préparé 18 ; plage critique à 18

Action : Résoudre contre DEF élevée

Attendu : Réussite critique ; bonus critique de l’arme ajouté manuellement aux DM.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## JE-12 — 03-Heros-Blues-et-Tests.gmos

Précondition : Dé préparé 3 ; échec critique jusqu’à 3

Action : Résoudre un événement traumatisant de rang 2

Attendu : Échec critique ; choc et conséquences arbitrés, aucune séquelle automatique inventée.

Source : Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-01 — 02-Sante-et-Etats.gmos

Précondition : S01, 0 case, RD2

Action : Saisir 15 DM bruts de coup ou projectile dans Combat-OS

Attendu : 13 cases noircies ; Affaibli ; rappel CON10, pas 15 cases ni PV soustraits.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-02 — 02-Sante-et-Etats.gmos

Précondition : S02, 4 cases, RD2

Action : Appliquer 3 DM bruts

Attendu : 5 cases, Contusionné ; −1 aux actions physiques et à l’initiative.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-03 — 02-Sante-et-Etats.gmos

Précondition : S03, 9 cases, RD2

Action : Appliquer 3 DM bruts

Attendu : 10 cases, Affaibli ; −3 et rappel de CON10 pour ne pas perdre la prochaine action.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-04 — 02-Sante-et-Etats.gmos

Précondition : S04, 14 cases, RD2

Action : Appliquer 3 DM bruts

Attendu : 15 cases, Blessé ; −5, mouvement réduit, action perdue et CON15 annoncés.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-05 — 02-Sante-et-Etats.gmos

Précondition : S05, 19 cases, RD2

Action : Appliquer 3 DM bruts

Attendu : 20 cases, Mourant ; −10, inconscience et CON20 rappelés, résolution à la table.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-06 — 02-Sante-et-Etats.gmos

Précondition : S06 déjà à 20, RD2

Action : Appliquer 3 DM bruts

Attendu : Échelle reste 20 ; rappel coup de grâce CON20, pas 21 cases.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-07 — 02-Sante-et-Etats.gmos

Précondition : S08, CON2, RD0, intact

Action : Comparer deux copies : coup de 22 puis coup de 23

Attendu : 22 atteint Mourant sans mort instantanée ; 23 dépasse 20+CON, tué sur le coup annoncé.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-08 — 02-Sante-et-Etats.gmos

Précondition : S09, 3 cases, RD2

Action : Saisir 5 DM sans protection (feu)

Attendu : 8 cases ; RD ignorée une seule fois. Aucun jet de feu inventé.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-09 — 02-Sante-et-Etats.gmos

Précondition : S07, 10 cases

Action : Soigner 3, puis réinitialiser et soigner 30

Attendu : 7 cases, puis 0 ; jamais de case négative. Tests et durée des soins restent au MJ.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-10 — 02-Sante-et-Etats.gmos

Précondition : S07 à 10, AGI et INT connues

Action : Préparer successivement AGI puis INT

Attendu : AGI subit −3, INT non physique ne le subit pas ; case Action physique permet l’exception.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-11 — 02-Sante-et-Etats.gmos

Précondition : S07, initiative de base 10+INT+PER

Action : Utiliser Jet système de Combat-OS

Attendu : Initiative de base −3, sans dé ; égalité PJ/PNJ rangée manuellement.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## SA-12 — 02-Sante-et-Etats.gmos

Précondition : S01 critique préparé puis dégâts atteignant 20

Action : Consigner la séquelle et les soins de stabilisation

Attendu : Séquelle seulement critique ET 20 ; saisie manuelle, pas de tirage automatique de table.

Source : Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## ET-01 — 02-Sante-et-Etats.gmos

Précondition : PJ indemne, base +2

Action : Comparer Fatigué puis Épuisé dans le panneau

Attendu : Totaux 0 puis −3 ; retenir le pire état, pas −7 en additionnant les deux.

Source : Livre p. 63-65, 85-86 ; rules/etats-et-conditions.md ; initiative-et-deroulement-du-tour.md

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## ET-02 — 02-Sante-et-Etats.gmos

Précondition : PJ renversé, attaque base +2

Action : Choisir Renversé puis se relever avec une action d’attaque

Attendu : Attaque à −3 ; retirer l’état après l’action ; pas de retrait automatique par déplacement sur carte.

Source : Livre p. 63-65, 85-86 ; rules/etats-et-conditions.md ; initiative-et-deroulement-du-tour.md

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## ET-03 — 02-Sante-et-Etats.gmos

Précondition : PJ surpris, immobilisé ou inconscient

Action : Tenter de déclarer une action interdite

Attendu : Le MJ refuse ; le logiciel ne constitue pas un verrou complet des actions.

Source : Livre p. 63-65, 85-86 ; rules/etats-et-conditions.md ; initiative-et-deroulement-du-tour.md

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## ET-04 — 02-Sante-et-Etats.gmos

Précondition : Round de six secondes

Action : Choisir action limitée ou mouvement+attaque ou deux mouvements

Attendu : Une seule combinaison autorisée ; pas de troisième action sans capacité ou effet explicite.

Source : Livre p. 63-65, 85-86 ; rules/etats-et-conditions.md ; initiative-et-deroulement-du-tour.md

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## HE-01 — 03-Heros-Blues-et-Tests.gmos

Précondition : H00 échelon 0, jet terminé

Action : Examiner les options de dépense

Attendu : Aucun bonus achetable ; échelle jamais négative.

Source : Livre p. 80-82 ; rules/jauges-et-ressources-individuelles.md ; bonusDuHeros/ajouterLeHeros

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## HE-02 — 03-Heros-Blues-et-Tests.gmos

Précondition : H01 échelon 1, test manqué de 2 hors critique

Action : Dépenser un échelon après le jet

Attendu : +2 au même résultat et échelon 0 ; naturel inchangé.

Source : Livre p. 80-82 ; rules/jauges-et-ressources-individuelles.md ; bonusDuHeros/ajouterLeHeros

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## HE-03 — 03-Heros-Blues-et-Tests.gmos

Précondition : H02 échelon 2, test terminé

Action : Dépenser deux échelons pour doubler

Attendu : +4, échelon 0, dépense unique persistante.

Source : Livre p. 80-82 ; rules/jauges-et-ressources-individuelles.md ; bonusDuHeros/ajouterLeHeros

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## HE-04 — 03-Heros-Blues-et-Tests.gmos

Précondition : H09 échelon 9, test terminé

Action : Acheter le bonus simple

Attendu : +2 et échelon 8 ; le +5 n’est pas disponible avant 10.

Source : Livre p. 80-82 ; rules/jauges-et-ressources-individuelles.md ; bonusDuHeros/ajouterLeHeros

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## HE-05 — 03-Heros-Blues-et-Tests.gmos

Précondition : H10 échelon 10, test terminé

Action : Acheter le bonus simple

Attendu : +5 et échelon 9 ; reprendre un jet lit le nouveau palier.

Source : Livre p. 80-82 ; rules/jauges-et-ressources-individuelles.md ; bonusDuHeros/ajouterLeHeros

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## HE-06 — 03-Heros-Blues-et-Tests.gmos

Précondition : H20 échelon 20, test terminé

Action : Choisir Légende

Attendu : +10 et échelon 19 ; Légende ne se double pas ; autres avantages tenus par le MJ.

Source : Livre p. 80-82 ; rules/jauges-et-ressources-individuelles.md ; bonusDuHeros/ajouterLeHeros

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## HE-07 — 03-Heros-Blues-et-Tests.gmos

Précondition : H10, résultat naturel 1

Action : Dépenser +5 après ce résultat contrôlé

Attendu : Total augmenté mais toujours échec critique.

Source : Livre p. 80-82 ; rules/jauges-et-ressources-individuelles.md ; bonusDuHeros/ajouterLeHeros

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## HE-08 — 03-Heros-Blues-et-Tests.gmos

Précondition : H20 déjà au maximum, critique naturel

Action : Utiliser le gain proposé puis tenter une seconde fois

Attendu : Échelle plafonnée à 20 ; pas de gain répété pour le même jet.

Source : Livre p. 80-82 ; rules/jauges-et-ressources-individuelles.md ; bonusDuHeros/ajouterLeHeros

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## BL-01 — 03-Heros-Blues-et-Tests.gmos

Précondition : B04, échelon4, VOL connue

Action : Préparer VOL

Attendu : Aucun bonus du blues avant 5.

Source : Livre p. 84 ; rules/jauges-et-ressources-individuelles.md ; preparerCoc

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## BL-02 — 03-Heros-Blues-et-Tests.gmos

Précondition : B05/B10/B15/B20

Action : Préparer VOL puis une interaction en sens négatif

Attendu : VOL +1/+3/+5/+10 ; interaction −1/−3/−5/−10. Aucun cumul des quatre paliers.

Source : Livre p. 84 ; rules/jauges-et-ressources-individuelles.md ; preparerCoc

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## BL-03 — 03-Heros-Blues-et-Tests.gmos

Précondition : B10, perception d’émotions

Action : Sélectionner le sens négatif du blues

Attendu : PER −3 ; la PER ordinaire n’est pas pénalisée automatiquement.

Source : Livre p. 84 ; rules/jauges-et-ressources-individuelles.md ; preparerCoc

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## BL-04 — 03-Heros-Blues-et-Tests.gmos

Précondition : B10, coercition CHA

Action : Sélectionner le sens positif

Attendu : CHA +3 ; Héros indisponible car modèle Blues.

Source : Livre p. 84 ; rules/jauges-et-ressources-individuelles.md ; preparerCoc

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## BL-05 — 03-Heros-Blues-et-Tests.gmos

Précondition : B15, jour de repos convenu

Action : Ramener manuellement l’échelle à14 puis préparer VOL

Attendu : Bonus +3 au lieu de +5 ; persiste ; aucun soin de santé physique associé.

Source : Livre p. 84 ; rules/jauges-et-ressources-individuelles.md ; preparerCoc

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## MA-01 — 01-Les-Minutes-de-Verre.gmos

Précondition : Boîtier, évidence déjà acquise ; total préparé 16

Action : Comparer le même résultat aux seuils 10/15/20

Attendu : Deux détails secondaires révélés, le troisième caché ; évidence conservée même sous 10.

Source : Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## MA-02 — 01-Les-Minutes-de-Verre.gmos

Précondition : Deux opposants, critique contre normal de total supérieur

Action : Comparer les résultats puis deux critiques de totaux différents

Attendu : Critique gagne contre normal ; entre critiques, plus haut total gagne. Comparaison finale manuelle.

Source : Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## MA-03 — 01-Les-Minutes-de-Verre.gmos

Précondition : Claire positive +5, persuasion bonne +5, INT2

Action : Saisir Autre +10 dans le test social opposé

Attendu : Bonus total +12 ; accord selon résultat opposé ; aucun sentiment modifié automatiquement.

Source : Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## MA-04 — 01-Les-Minutes-de-Verre.gmos

Précondition : Yann négatif −5, négociation bonne +5

Action : Préparer l’échange puis essayer une coercition réussie

Attendu : Modificateurs se compensent pour négociation ; coercition réussie dégrade le sentiment d’un cran à la table.

Source : Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## MA-05 — 01-Les-Minutes-de-Verre.gmos

Précondition : Léon et PJ en course optionnelle, distance Proche

Action : Résoudre une manœuvre normale puis une critique contrôlée

Attendu : Un cran puis deux crans ; au-delà de Très éloigné, Semé ; échec ne supprime pas le rendez-vous alternatif.

Source : Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## MA-06 — 01-Les-Minutes-de-Verre.gmos

Précondition : V01 en 03, capacité témoin explicitement non canonique

Action : Saisir nom/description/acquis, puis exporter/recharger la fiche

Attendu : Les trois types sont conservés ; aucun effet de règle de cette capacité fictive.

Source : Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## MA-07 — 01-Les-Minutes-de-Verre.gmos

Précondition : Un personnage reçoit 1XP de séance, rang1 acquis et 2XP disponibles

Action : Acheter manuellement le rang2 puis tenter de sauter au rang4

Attendu : Coût2, XP0, rang2 acquis ; saut refusé par le MJ, pas de validateur automatique promis.

Source : Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## MA-08 — 01-Les-Minutes-de-Verre.gmos

Précondition : Chute de6m, AGI10 réussi contrôlé

Action : Réduire les trois premiers mètres puis lancer les dégâts restants

Attendu : 1d6 DM sans protection ; saisie du résultat brut, RD ignorée.

Source : Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## MA-09 — 01-Les-Minutes-de-Verre.gmos

Précondition : Bande de trois sbires, affrontement Pulp convenu

Action : Consigner une touche sans jet de DM puis recalculer le surnombre

Attendu : Un membre retiré et bonus recalculé ; suivi manuel, pas de santé20 prétendument adaptée à la bande.

Source : Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## MA-10 — 01-Les-Minutes-de-Verre.gmos

Précondition : Figurant ou second rôle standard

Action : Comparer le 20 naturel à sa règle de rôle

Attendu : Pas de réussite critique pour ces rôles ; arbitrer le résultat, car le panneau générique ne désactive pas cette plage.

Source : Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## OP-01 — 03-Heros-Blues-et-Tests.gmos

Précondition : Copie jetable du pilote, aucune partie en cours

Action : Remplacer par la variante 3d6, puis ouvrir un test

Attendu : 3d6 ; difficultés 8/11/14/17/20 ; la variante ne crée pas un second pilote indépendant.

Source : Livre p.60-61 ; pilote COC_driver_gmos_finir_3d6.gmos-driver ; coc.ts ; manuel 54-Jeu-COC.md

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## OP-02 — 03-Heros-Blues-et-Tests.gmos

Précondition : Variante 3d6, série préparée [1,3,4,6] avec bonus

Action : Résoudre puis comparer le mode malus à deux d6

Attendu : Trois meilleurs =13 ; malus deux d6 seulement.

Source : Livre p.60-61 ; pilote COC_driver_gmos_finir_3d6.gmos-driver ; coc.ts ; manuel 54-Jeu-COC.md

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## OP-03 — 03-Heros-Blues-et-Tests.gmos

Précondition : Variante 3d6, conditions2 puis santé10 puis Blues10

Action : Comparer les modificateurs au mode d20

Attendu : Conditions +3 au lieu de+5 ; santé −2 au lieu de−3 ; Blues ±2 au lieu de±3.

Source : Livre p.60-61 ; pilote COC_driver_gmos_finir_3d6.gmos-driver ; coc.ts ; manuel 54-Jeu-COC.md

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**

## OP-04 — 03-Heros-Blues-et-Tests.gmos

Précondition : Fin d’essai 3d6

Action : Réimporter explicitement COC-2.0.0-d20.gmos-driver avec Remplacer

Attendu : Retour d20 et difficultés5/10/15/20/25 ; aucune campagne réelle remplacée par le test.

Source : Livre p.60-61 ; pilote COC_driver_gmos_finir_3d6.gmos-driver ; coc.ts ; manuel 54-Jeu-COC.md

Preuve prévue : Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.

Statut : **NON TESTÉ**
