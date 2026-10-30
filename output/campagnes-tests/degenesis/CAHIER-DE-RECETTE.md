# Degenesis — cahier de recette

66 cas humains **NON TESTÉS**. Les contrôles automatiques sont séparés. Les dés préparés décrivent des exemples contrôlés ; les jets ordinaires restent aléatoires.

## GM-01 — 01-La-Station-des-Cendres.gmos

Précondition : Profil jetable avec trois joueurs et anciens PJ sentinelles

Action : Importer 01, puis 02 et 03 via Nexus

Attendu : Trois campagnes distinctes ; joueurs p-1/p-2/p-3 conservés ; 21 nouveaux PJ et aucun ancien PJ écrasé.

Source : Types Nexus v1, NexusService, manuel Degenesis 2.0.0 ; contrôle de confidentialité GM-05

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## GM-02 — 01-La-Station-des-Cendres.gmos

Précondition : 01 importée ; laboratoire 02 modifié

Action : Réimporter 02 et choisir Remplacer pour cette campagne seulement

Attendu : 02 retrouve ses états initiaux ; notes, ressources et PJ de 01 restent identiques.

Source : Types Nexus v1, NexusService, manuel Degenesis 2.0.0 ; contrôle de confidentialité GM-05

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## GM-03 — 01-La-Station-des-Cendres.gmos

Précondition : Pilote Degenesis déjà installé

Action : Comparer ID, version 2.0.0 et gabarit avant import

Attendu : Conserver la dépendance identique ; une ancienne version doit être remplacée explicitement par le meneur.

Source : Types Nexus v1, NexusService, manuel Degenesis 2.0.0 ; contrôle de confidentialité GM-05

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## GM-04 — 01-La-Station-des-Cendres.gmos

Précondition : 01 active ; une valeur de fiche et une note modifiées

Action : Recharger GM-OS puis le Hub

Attendu : Valeur et note conservées ; aucune duplication de PJ ou de joueur.

Source : Types Nexus v1, NexusService, manuel Degenesis 2.0.0 ; contrôle de confidentialité GM-05

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## GM-05 — 01-La-Station-des-Cendres.gmos

Précondition : Séance 01 active, marqueurs SECRET_MJ_DG_RECETTE fictifs

Action : Connecter les trois Hub et examiner leurs trames et affichages

Attendu : Aucun marqueur privé reçu : campagne, PNJ, scènes, séances et notes PJ. Tout marqueur reçu est un ÉCHEC à consigner.

Source : Types Nexus v1, NexusService, manuel Degenesis 2.0.0 ; contrôle de confidentialité GM-05

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## GM-06 — 01-La-Station-des-Cendres.gmos

Précondition : Un Hub connecté à Narek, autre PJ appartenant à un autre joueur

Action : Tenter de modifier le PJ non attribué via le parcours disponible

Attendu : Refus ou absence de droit d’édition ; fiche de l’autre PJ inchangée. Relever séparément accès lecture et écriture.

Source : Types Nexus v1, NexusService, manuel Degenesis 2.0.0 ; contrôle de confidentialité GM-05

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## GM-07 — 01-La-Station-des-Cendres.gmos

Précondition : Trois Hub à 360, 768 et 1180 px

Action : Ouvrir fiche et panneau de jet, saisir puis sauvegarder

Attendu : Contrôles atteignables, pas de débordement horizontal de la page ; écriture reçue par le MJ.

Source : Types Nexus v1, NexusService, manuel Degenesis 2.0.0 ; contrôle de confidentialité GM-05

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## AV-01 — 01-La-Station-des-Cendres.gmos

Précondition : Trois PJ de 01, acte 1

Action : Jouer accueil puis refuser le test médical

Attendu : Reçu et symptômes minimaux accessibles ; quai et archives restent des routes ouvertes.

Source : degenesis-scenario.mjs : fiction originale, sans scénario publié

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## AV-02 — 01-La-Station-des-Cendres.gmos

Précondition : Scène atelier

Action : Échouer au diagnostic technique puis lire le billet et écouter Ves

Attendu : Panne et sens du clapet compris ; réparation reste possible après nouvelle préparation.

Source : degenesis-scenario.mjs : fiction originale, sans scénario publié

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## AV-03 — 01-La-Station-des-Cendres.gmos

Précondition : Atlas, lieu parvis

Action : Suivre les liens vers quai, atelier et filtres ; ouvrir les PNJ

Attendu : Huit lieux, douze PNJ et liens valides ; aucun danger appliqué par simple changement de carte.

Source : degenesis-scenario.mjs : fiction originale, sans scénario publié

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## AV-04 — 01-La-Station-des-Cendres.gmos

Précondition : Indice diagnostic caché

Action : Révéler seulement le document anonymisé

Attendu : Document choisi visible ; autres indices privés inchangés ; identité médicale non ajoutée par l’outil.

Source : degenesis-scenario.mjs : fiction originale, sans scénario publié

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## AV-05 — 01-La-Station-des-Cendres.gmos

Précondition : Trame acte 3

Action : Choisir un accord, la publication anonymisée ou l’évacuation

Attendu : Chaque fin résout la crise avec conséquences distinctes ; aucun combat obligatoire.

Source : degenesis-scenario.mjs : fiction originale, sans scénario publié

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## AV-06 — 01-La-Station-des-Cendres.gmos

Précondition : Quatre séances prévues

Action : Activer la première, conclure puis passer à la suivante

Attendu : Ordre et scènes prévues cohérents ; aucune séance marquée accomplie à l’import.

Source : degenesis-scenario.mjs : fiction originale, sans scénario publié

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## AV-07 — 01-La-Station-des-Cendres.gmos

Précondition : Butin 101 dinars et trois PJ

Action : Effectuer un partage contrôlé puis noter 33 chacun et 2 en réserve

Attendu : Quantités conservées ; pas de conversion automatique dinars/LC ni modification magique des Historiques.

Source : degenesis-scenario.mjs : fiction originale, sans scénario publié

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## AV-08 — 01-La-Station-des-Cendres.gmos

Précondition : Rencontre préparée au quai

Action : Ouvrir la rencontre sans engager les hostilités

Attendu : PNJ et factions attendus ; négociation toujours possible.

Source : degenesis-scenario.mjs : fiction originale, sans scénario publié

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-01 — 02-Sante-et-Limites.gmos

Précondition : S01 intact ; relever ses plafonds réels

Action : Saisir 5 dégâts physiques après armure

Attendu : Blessures +5, Traumatismes inchangés ; santé restante diminue de 5.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-02 — 02-Sante-et-Limites.gmos

Précondition : S02 : PHY3 PSY 3 Résistance2, B9/T0, santé7/16

Action : Saisir 3 dégâts physiques

Attendu : B10/T2 ; santé4/16 ; les deux Traumatismes retirent 2D aux tests.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-03 — 02-Sante-et-Limites.gmos

Précondition : S03 : B10/T2, santé4/16

Action : Soigner 3 points

Attendu : B7/T2 ; santé7/16 ; aucun Traumatisme soigné.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-04 — 02-Sante-et-Limites.gmos

Précondition : S04 : B10/T5, santé1/16

Action : Saisir 1 dégât physique

Attendu : B10/T6 ; santé0/16 ; maximum de Traumatismes atteint, personnage perdu selon p.107.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-05 — 02-Sante-et-Limites.gmos

Précondition : S05 : B10/T6, santé0/16

Action : Saisir encore 8 dégâts physiques

Attendu : Pistes ne dépassent pas les maxima ; santé reste 0.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-06 — 02-Sante-et-Limites.gmos

Précondition : S06 : Égo1 ; chair intacte

Action : Saisir 1 dégât mental

Attendu : Égo0 ; chair et santé physique inchangées ; effondrement rappelé.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-07 — 02-Sante-et-Limites.gmos

Précondition : S07 : Égo0

Action : Lancer PSY+Foi/Volonté difficulté2 ; si réussite saisir Égo1

Attendu : Le réveil ne rend qu’un point et ne s’applique qu’une fois ; restriction arbitrée par le MJ.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-08 — 02-Sante-et-Limites.gmos

Précondition : S08 : B3/T2

Action : Soigner 9 points

Attendu : B0/T2 ; seuls 3 points rendus ; Traumatismes conservés.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-09 — 02-Sante-et-Limites.gmos

Précondition : S02 réinitialisé

Action : Modifier manuellement B9 vers B8 puis saisir 1 dégât

Attendu : La santé principale rejoint les pistes ; B9/T0, santé7/16.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-10 — 02-Sante-et-Limites.gmos

Précondition : S03 réinitialisé ; fiche HTML ouverte

Action : Modifier la piste de Traumatisme à 1 puis effectuer un test

Attendu : La réserve retire 1D ; changement conservé après sauvegarde/rechargement.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-11 — 02-Sante-et-Limites.gmos

Précondition : S01 intact, armure d’exercice2, dégâts bruts7

Action : Retirer manuellement l’armure puis saisir 5

Attendu : 5 Blessures, jamais 7 ni une double soustraction automatique.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SA-12 — 02-Sante-et-Limites.gmos

Précondition : S01 légèrement blessé

Action : Appliquer un soin mental à Égo proche du maximum

Attendu : Égo plafonné à ego_max ; aucune Blessure effacée par un soin mental.

Source : KatharSys p. 94, 105, 107, 112-113 ; rules/sante-et-blessures.md ; pistesDeDegenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-01 — 03-Reserves-et-Declencheurs.gmos

Précondition : D02 : PHY3 + Corps à corps3

Action : Choisir ces deux composantes, difficulté2

Attendu : VA6, six d6, succès sur4/5/6, difficulté2.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-02 — 03-Reserves-et-Declencheurs.gmos

Précondition : D03 : PHY6 + Corps à corps6, sans malus

Action : Ajouter +3D via modificateur

Attendu : Douze dés et trois succès d’office ; pas quinze dés lancés.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-03 — 03-Reserves-et-Declencheurs.gmos

Précondition : D04 : PHY5 + Corps à corps6

Action : Ajouter +2D

Attendu : VA13, douze dés et un succès d’office.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-04 — 03-Reserves-et-Declencheurs.gmos

Précondition : D01 : PHY1 + Corps à corps0

Action : Ajouter −8D, Égo0

Attendu : Aucun dé lancé ; pas de réserve négative ; ne pas inventer un succès.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-05 — 03-Reserves-et-Declencheurs.gmos

Précondition : D05 : PHY3 + Corps à corps3, T2

Action : Préparer le jet sans autre modificateur

Attendu : VA4 ; deux dés retirés par les Traumatismes.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-06 — 03-Reserves-et-Declencheurs.gmos

Précondition : D02, Égo disponible

Action : Choisir 3 points d’Égo et lancer une première action

Attendu : +3D ; Égo diminué exactement de3 ; coût conservé après rechargement.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-07 — 03-Reserves-et-Declencheurs.gmos

Précondition : D06 : Égo0

Action : Examiner le sélecteur d’Égo

Attendu : Aucune dépense positive proposée ; pas d’Égo négatif.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-08 — 03-Reserves-et-Declencheurs.gmos

Précondition : D07 : Égo1

Action : Dépenser le seul point, lancer puis rouvrir le panneau

Attendu : +1D puis Égo0 ; impossible d’en dépenser de nouveau sans récupération.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-09 — 03-Reserves-et-Declencheurs.gmos

Précondition : D02 sans autre réglage

Action : Cumuler déplacement−2D puis longue portée−4D

Attendu : VA0 ; malus cumulatifs en dés ; remise à zéro du total restaure VA6.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-10 — 03-Reserves-et-Declencheurs.gmos

Précondition : D02 ; dés préparés [2,4,6], difficulté2

Action : Résoudre cette série hors fiction

Attendu : Deux succès, un déclencheur : réussite bien.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-11 — 03-Reserves-et-Declencheurs.gmos

Précondition : D02 ; dés préparés [6,2,3], difficulté4

Action : Résoudre cette série hors fiction

Attendu : Échec, un six conservé pour confrontation, zéro déclencheur actif.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-12 — 03-Reserves-et-Declencheurs.gmos

Précondition : D02 ; dés préparés [1,1,3], difficulté2

Action : Résoudre cette série hors fiction

Attendu : Échec critique : deux1 pour zéro succès.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-13 — 03-Reserves-et-Declencheurs.gmos

Précondition : D02 ; dés préparés [1,4,2], difficulté2

Action : Résoudre cette série hors fiction

Attendu : Échec simple : un1 égale un succès, ne le dépasse pas.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-14 — 03-Reserves-et-Declencheurs.gmos

Précondition : D02 ; dés préparés [1,1,1,4], difficulté1

Action : Résoudre cette série hors fiction

Attendu : Réussite malgré trois1 ; aucun échec critique sur une réussite.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-15 — 03-Reserves-et-Declencheurs.gmos

Précondition : D02, sans consommation

Action : Sélectionner successivement les six difficultés du livre

Attendu : 1,2,4,6,8,10 succès requis ; changer la difficulté ne change ni VA ni fiche.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## JE-16 — 03-Reserves-et-Declencheurs.gmos

Précondition : D02, INT et compétence d’un autre attribut

Action : Choisir INT+Perception puis CHA+Médecine

Attendu : Combinaisons libres accessibles, pas de blocage par colonne de la fiche.

Source : KatharSys p.18-20, 100,105-106 ; rules/resolution-des-jets.md ; degenesis.ts

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## IN-01 — 03-Reserves-et-Declencheurs.gmos

Précondition : D08, deux résultats préparés : 3succès/1six et 3succès/0six

Action : Comparer une confrontation

Attendu : Le premier gagne ; égalité stricte arbitrée selon situation, initiateur perd si un vainqueur nécessaire.

Source : KatharSys p.19-21,100-102 ; rules/jets-opposes-aide-et-cooperation.md ; Combat-OS Jet système

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## IN-02 — 03-Reserves-et-Declencheurs.gmos

Précondition : D08 : PSY4 + Réactivité4

Action : Lancer Jet système dans Combat-OS

Attendu : Score en succès, ordre décroissant ; jamais somme des faces ou simple total8.

Source : KatharSys p.19-21,100-102 ; rules/jets-opposes-aide-et-cooperation.md ; Combat-OS Jet système

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## IN-03 — 03-Reserves-et-Declencheurs.gmos

Précondition : D08 : résultat d’initiative préparé 5succès et2déclencheurs

Action : Décompter les actions du round

Attendu : Deux actions ; le journal rappelle l’action supplémentaire ; le MJ suit leur dépense.

Source : KatharSys p.19-21,100-102 ; rules/jets-opposes-aide-et-cooperation.md ; Combat-OS Jet système

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## IN-04 — 03-Reserves-et-Declencheurs.gmos

Précondition : D08 ; première action du round avec Égo dépensé à l’initiative

Action : Reporter le bonus sans payer une deuxième fois

Attendu : Même bonus sur première action seulement ; pas de double débit. Le Jet système ne gère pas cette dépense.

Source : KatharSys p.19-21,100-102 ; rules/jets-opposes-aide-et-cooperation.md ; Combat-OS Jet système

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## IN-05 — 03-Reserves-et-Declencheurs.gmos

Précondition : Deux PJ pouvant coopérer, tâche2

Action : Lancer l’aide à difficulté3, puis convertir ses déclencheurs

Attendu : Déclencheurs de l’aide ajoutés en dés au principal ; comptabilité manuelle explicite.

Source : KatharSys p.19-21,100-102 ; rules/jets-opposes-aide-et-cooperation.md ; Combat-OS Jet système

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## IN-06 — 03-Reserves-et-Declencheurs.gmos

Précondition : Deux tests combinés distincts

Action : Réussir le premier puis ajouter ses déclencheurs à ceux du second

Attendu : Aucun transfert de succès à la place des déclencheurs ; addition manuelle, pas de module inventé.

Source : KatharSys p.19-21,100-102 ; rules/jets-opposes-aide-et-cooperation.md ; Combat-OS Jet système

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## IN-07 — 03-Reserves-et-Declencheurs.gmos

Précondition : Défenseur ayant épuisé ses actions

Action : Déclarer une nouvelle défense active

Attendu : Refus à la table ; seule défense passive disponible ; logiciel ne garantit pas le décompte.

Source : KatharSys p.19-21,100-102 ; rules/jets-opposes-aide-et-cooperation.md ; Combat-OS Jet système

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SP-01 — 02-Sante-et-Limites.gmos

Précondition : S09 de 02 : PSY 3 Volonté 2, Sporulation 10, maximum 10

Action : Simuler un point de Sporulation au-delà du maximum

Attendu : Test PSY+Volonté difficulté1 par point excédentaire ; noter séparément tout permanent, aucun traitement automatique.

Source : KatharSys p.94,155-160,186-190 ; rules/les-potentiels.md ; rules/la-brulure-et-la-stimulation-des-chakras.md

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SP-02 — 03-Reserves-et-Declencheurs.gmos

Précondition : D09 : Égo 2, Sporulation 2, Brûlure légère de puissance 1 simulée

Action : Saisir Égo 3 et Sporulation 3 ; inscrire une durée 1 h à la main

Attendu : Deux jauges mises à jour ; effet et fin de stimulation suivis manuellement. Aucune dose nécessaire au scénario.

Source : KatharSys p.94,155-160,186-190 ; rules/les-potentiels.md ; rules/la-brulure-et-la-stimulation-des-chakras.md

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SP-03 — 03-Reserves-et-Declencheurs.gmos

Précondition : D09, deux stimulations successives fictives

Action : Consigner la seconde et retirer le bonus de la première

Attendu : Seule dernière stimulation active ; les gains d’Égo de chaque dose restent comptabilisés selon limites.

Source : KatharSys p.94,155-160,186-190 ; rules/les-potentiels.md ; rules/la-brulure-et-la-stimulation-des-chakras.md

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SP-04 — 03-Reserves-et-Declencheurs.gmos

Précondition : D09, emplacement de Potentiel vide

Action : Saisir un nom de Potentiel du livre choisi par le MJ et son niveau

Attendu : Nom/niveau0…3 persistés ; coût, prérequis et effet lus dans le livre, sans activation automatique inventée.

Source : KatharSys p.94,155-160,186-190 ; rules/les-potentiels.md ; rules/la-brulure-et-la-stimulation-des-chakras.md

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SP-05 — 03-Reserves-et-Declencheurs.gmos

Précondition : PJ avec Concentration, Pulsions0 et Foi0/Volonté positive

Action : Vérifier les compétences opposées puis leurs plafonds

Attendu : (INT+Concentration)×2 pour Égo ; (PSY+Volonté)×2 pour Sporulation. Le contrôle de création reste manuel.

Source : KatharSys p.94,155-160,186-190 ; rules/les-potentiels.md ; rules/la-brulure-et-la-stimulation-des-chakras.md

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SP-06 — 03-Reserves-et-Declencheurs.gmos

Précondition : Fin de l’aventure et expérience existante

Action : Attribuer une récompense décidée et noter un achat de progression

Attendu : Expérience modifiée explicitement ; coût de progression vérifié au livre, aucun budget novice revendiqué.

Source : KatharSys p.94,155-160,186-190 ; rules/les-potentiels.md ; rules/la-brulure-et-la-stimulation-des-chakras.md

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## SP-07 — 03-Reserves-et-Declencheurs.gmos

Précondition : Atelier hors fiction véhicule et danger

Action : Lire poursuites/environnement, préparer un jet sans module dédié

Attendu : Vitesse, manœuvres, feu, chute et exposition arbitrés ; aucune entrée Atlas ne déclenche dégâts ni mouvement.

Source : KatharSys p.94,155-160,186-190 ; rules/les-potentiels.md ; rules/la-brulure-et-la-stimulation-des-chakras.md

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## FI-01 — 01-La-Station-des-Cendres.gmos

Précondition : PJ de 01 sélectionné

Action : Ouvrir Fiche du jeu et comparer nom, six attributs et36 compétences

Attendu : 129 clés reliées ; valeurs cohérentes avec la fiche GM-OS ; aucune donnée d’ancien PJ.

Source : Fiche PDF fournie, correspondance degenesis-fr 129 clés, gabarit tpl-1793142284072

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## FI-02 — 01-La-Station-des-Cendres.gmos

Précondition : Fiche HTML Narek

Action : Modifier Égo à8 et sauvegarder

Attendu : ego_jauge8 chez le MJ et après rechargement ; B/T inchangés.

Source : Fiche PDF fournie, correspondance degenesis-fr 129 clés, gabarit tpl-1793142284072

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## FI-03 — 01-La-Station-des-Cendres.gmos

Précondition : Fiche HTML Sova

Action : Modifier une arme, une armure et une ligne du bazar

Attendu : Textes et valeurs reviennent sur les champs correspondants ; aucun poids automatiquement recalculé revendiqué.

Source : Fiche PDF fournie, correspondance degenesis-fr 129 clés, gabarit tpl-1793142284072

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## FI-04 — 01-La-Station-des-Cendres.gmos

Précondition : Fiche HTML Mira

Action : Modifier un Historique et le total expérience

Attendu : Valeurs persistées ; ne pas supposer validation des prérequis de Culte.

Source : Fiche PDF fournie, correspondance degenesis-fr 129 clés, gabarit tpl-1793142284072

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## ME-01 — 01-La-Station-des-Cendres.gmos

Précondition : Archive importée hors corpus de travail

Action : Ouvrir cartes, indices, cartouches et bannière

Attendu : 36SVG et1JPEG embarqués ; aucune URL distante ni chemin personnel nécessaire.

Source : Nexus assetMap ; Storyboard/Sound-OS/Music-OS/Light-OS ; médias originaux du générateur

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## ME-02 — 01-La-Station-des-Cendres.gmos

Précondition : Sound-OS de la campagne

Action : Décoder puis écouter à volume choisi les trois signaux

Attendu : Trois WAV de 4 s ; aucune voix enregistrée ; écoute humaine à consigner séparément du décodage.

Source : Nexus assetMap ; Storyboard/Sound-OS/Music-OS/Light-OS ; médias originaux du générateur

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## ME-03 — 01-La-Station-des-Cendres.gmos

Précondition : Storyboard avec quatre moments

Action : Ouvrir un moment puis changer de campagne

Attendu : Image et références audio valides ; les ambiances restent rattachées à leur campagne.

Source : Nexus assetMap ; Storyboard/Sound-OS/Music-OS/Light-OS ; médias originaux du générateur

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## ME-04 — 01-La-Station-des-Cendres.gmos

Précondition : Light-OS sans appareil dans le profil jetable

Action : Ouvrir les trois tuiles de lumière

Attendu : Tuiles présentes et aucun appareil réel ciblé ; essai physique NON EXÉCUTÉ.

Source : Nexus assetMap ; Storyboard/Sound-OS/Music-OS/Light-OS ; médias originaux du générateur

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.

## ME-05 — 01-La-Station-des-Cendres.gmos

Précondition : Trois tables originales livrées à part

Action : Importer une table en préservant les tables existantes

Attendu : Format Table-OS accepté ; aucune table officielle remplacée ; import global reste une action du meneur.

Source : Nexus assetMap ; Storyboard/Sound-OS/Music-OS/Light-OS ; médias originaux du générateur

Preuve : Capture du geste, valeurs avant/après et après rechargement ; trame synthétique pour droits.
