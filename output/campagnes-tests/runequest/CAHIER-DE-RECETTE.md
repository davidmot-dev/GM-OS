# RuneQuest — cahier de recette

**66 cas humains NON TESTÉS par David.** Les essais automatiques ne cochent pas ce cahier. Pour un tirage aléatoire, noter le total réellement obtenu ; les limites déterministes sont vérifiées à part sur le moteur.

## RQ-COMMUN-01

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Bibliothèque en Atelier

Geste : Importer 01 telle quelle.

Attendu : Une campagne, trois nouveaux PJ, trois joueurs réutilisés ; aucun PJ ancien déplacé.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-02

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Les trois archives importées

Geste : Comparer les trois listes de PJ.

Attendu : 3 + 9 + 9 = 21 nouveaux PJ, tous d’ID distinct, mêmes joueurs p-1/p-2/p-3.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-03

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : 02 modifié ; 01 avec une note ajoutée

Geste : Réimporter uniquement 02 avec Remplacer.

Attendu : Profils C01–C09 réinitialisés ; note et PJ de 01 conservés.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-04

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : 01 actif

Geste : Ouvrir Atlas, les huit lieux et les liens de voisinage.

Attendu : Plans locaux décodés ; liens vers les bons lieux et PNJ.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-05

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : 01 actif

Geste : Suivre S01 puis S05 et S11 dans la Trame.

Attendu : Actes, lieux, témoins, indices et embranchements disponibles ; pas de résultat préjoué.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-06

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Indice accord public, ordre caché

Geste : Révéler l’ordre puis consulter depuis un Hub.

Attendu : Seuls les indices révélés deviennent publics ; vérifier aussi après rechargement.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-07

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Un PJ relié à un témoin

Geste : Ouvrir sa relation et la fiche du témoin.

Attendu : La relation vise le bon PNJ dans la même campagne.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-08

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Moment M01 préparé

Geste : Déclencher son plan et son signal.

Attendu : Carte embarquée affichée ; signal synthétique local, pas de service audio distant.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-09

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Sound-OS et Music-OS

Geste : Écouter les trois signaux de 4 secondes et la liste locale.

Attendu : Fichiers locaux lisibles ; les sons ne sont ni enregistrements de rivière ni voix.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-10

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Light-OS

Geste : Ouvrir les trois tuiles.

Attendu : Tuiles sans lampe assignée ; aucune sortie matérielle prétendue configurée.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-11

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Lot de 101 lunars

Geste : Partager entre trois PJ puis recharger.

Attendu : 33 par PJ et reliquat 2 si la table choisit cette répartition ; pas de conversion en PM/PR.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-COMMUN-12

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Trois JSON Table-OS livrés

Geste : Importer par Table-OS → Atelier, puis Ranger tel quel.

Attendu : Trois tables originales 1d6 indépendantes ; tables de règles conservées.

Source : Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-01

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : C02, arme1 = 56

Geste : Retenir son arme et lire les plages.

Attendu : Critique 01–03, spéciale 01–11, réussite 01–56, échec critique 99–00.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-02

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : C02, aucun modificateur

Geste : Lancer plusieurs D100, noter total et niveau.

Attendu : Le total des dizaines/unités sert au niveau ; 00 vaut 100, pas zéro.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-03

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : C01, arme1 = 3

Geste : Lire les plages puis observer un résultat de 04 si obtenu.

Attendu : Réussite minimale 05 ; 04 est une réussite normale. Ne pas promettre de forcer le tirage dans l’interface.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-04

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : C03, arme1 = 120

Geste : Lire les plages et les avertissements.

Attendu : Réussite plafonnée à 95 ; critique jusqu’à 06 et spéciale jusqu’à 24.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-05

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : C03, score 120

Geste : Observer 97 puis 00 si ces résultats surviennent.

Attendu : 97 échoue, 00 est un échec critique. Contrôle déterministe séparé dans les essais du moteur.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-06

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : C02, arme1 = 56

Geste : Ajouter situation −10 et augmentation +20.

Attendu : Score modifié 66 ; affichage du détail sans modification de la fiche.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-07

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : C02, tentative précédente ratée, permission du MJ

Geste : Activer Tenter à nouveau, sans autre bonus.

Attendu : 56 − 25 = 31 ; refus de retenter s’arbitre à la table.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-08

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : CON = 12

Geste : Retenir CON puis multiplicateur ×5.

Attendu : Test sous 60 %, jamais sous 12 %.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-09

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : CON = 12

Geste : Choisir successivement ×4, ×3, ×2, ×1 et ×0,5.

Attendu : 48, 36, 24, 12 et 6 % avant autres modificateurs.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-10

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : M04, POU = 15, passive 14

Geste : Choisir Table de résistance.

Attendu : 50 + 5 × (15 − 14) = 55 %.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-11

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : C04, arme1 = 140, adverse 80

Geste : Saisir l’aptitude adverse.

Attendu : Excédent 40 retiré aux deux : 100 et 40 ; critique/spéciale calculées sur 100.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-12

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : Opposition au même niveau de réussite

Geste : Saisir un jet adverse de niveau égal puis Trancher.

Attendu : Égalité, même si l’un a un D100 plus élevé ; errata appliqué.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-13

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : Deux résultats d’échec dans une opposition

Geste : Trancher l’opposition.

Attendu : Deux perdants, pas de vainqueur inventé.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-14

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : Jet de Déléa ou Koros

Geste : Retenir une compétence précisée, une Passion et une arme.

Attendu : Les noms saisis servent de libellés ; dégâts, RA et autres valeurs techniques ne sont pas des aptitudes.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-JETS-15

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support natif

Précondition : Test d’augmentation résolu

Geste : Augmenter le prochain jet, puis effectuer deux jets.

Attendu : Bonus/malus repris pour un seul prochain jet ; vérifier qu’il ne persiste pas indûment.

Source : Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-01

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : Trois PJ de 01 à 12 PV

Geste : Ajouter PJ et rencontre R01 au combat ; lancer l’initiative.

Attendu : Ordre ascendant RA DEX + RA TAI : Koros 3, Arven 4, Déléa 5 ; ajouter le RA d’arme à la table.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-02

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : C09, armure jambe droite 5, PV zone 2, PV totaux 8

Geste : Comparer la fiche puis décrire un coup sur cette jambe.

Attendu : Armure et PV locaux lisibles ; les localisations ne sont pas automatiquement déduites avec les PV totaux.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-03

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : Un jet réussi

Geste : Utiliser Localiser le coup, lire D20 et zone.

Attendu : 1–4 jambe D., 5–8 jambe G., 9–11 abdomen, 12 poitrine, 13–15 bras D., 16–18 bras G., 19–20 tête.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-04

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : C07, bras droit à 0

Geste : Ouvrir la fiche et arbitrer l’usage du bras.

Attendu : Bras inutilisable selon la règle ; le pilote ne bloque pas lui-même tous les gestes.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-05

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : C08, tête −4 (double des 4 PV de zone), PV totaux 4

Geste : Examiner les valeurs ; suivre le traitement à la table.

Attendu : Conséquences graves de tête à arbitrer ; aucun compte à rebours ni hémorragie automatique revendiqué.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-06

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : C05, 2 PV totaux

Geste : Ouvrir fiche et combat.

Attendu : Valeur 2/12 conservée ; inconscience du livre à appliquer manuellement, distincte du palier générique de GM-OS.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-07

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : C06, 0 PV totaux

Geste : Examiner le suivi sans supprimer le personnage.

Attendu : 0/12, personnage conservé ; étiquette générique hors combat distincte de la mort de RuneQuest en fin de round.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-08

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : Un PJ blessé, réserve de bandages

Geste : Tester Premiers soins ; appliquer l’effet d’après le résultat.

Attendu : Premier essai par blessure, durée et soins/dégâts à la table ; pas de guérison automatique par le bouton Lancer.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-09

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : Dégâts spéciaux possibles

Geste : Distinguer spéciale, critique et dégâts appliqués.

Attendu : Empalement/lacération/écrasement et armure arbitrés ; le niveau du jet n’applique pas seul ces conséquences.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-10

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : PV modifiés dans le combat

Geste : Sauvegarder, ouvrir la fiche HTML puis recharger.

Attendu : Santé principale et maximum cohérents avec points_de_vie / pv_max ; consigner tout écart réel.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-CORPS-11

Archive : 02-Aptitudes-Combat-et-Sante.gmos · support manuel

Précondition : Déplacement en terrain ouvert

Geste : Comparer catégorie de poursuite et portée de l’arme.

Attendu : Catégories sans modificateur automatique de tir ; pénalité choisie selon les règles de l’arme.

Source : Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-01

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : M05, Air 90

Geste : Lancer l’affinité puis proposer une inspiration.

Attendu : Aptitude sous 90 ; niveau exploitable pour l’augmentation, aucune dépense de Rune automatique.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-02

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : M06, Loyauté 85

Geste : Jouer une décision contraire puis consulter le cahier.

Attendu : Test obligatoire ou réduction sous 80 à arbitrer ; le pilote n’impose pas le comportement.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-03

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : Rune ou Passion ayant échoué en inspiration

Geste : Noter la suite propre à la Rune ou à la Passion.

Attendu : Les conséquences du livre restent distinctes ; pas d’assimilation au simple −20 du jet d’augmentation commun.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-04

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : Une paire 70/30 sur la fiche

Geste : Modifier l’un des deux scores dans un essai.

Attendu : La seconde valeur ne s’ajuste pas seule : maintenir soi-même le total 100 si applicable.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-05

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : M04, POU 15

Geste : Préparer le lancement spirituel en POU ×5.

Attendu : 75 %, puis opposition POU contre POU si cible non consentante ; coût enregistré à la main.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-06

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : M01, 0 PM

Geste : Proposer un effet spirituel coûtant 1 PM.

Attendu : La table refuse faute de PM ; le panneau de test seul ne constitue pas un blocage de lancement ni une dépense.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-07

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : M02, 1 PM

Geste : Résoudre un exercice de coût 1 PM réussi, puis débiter à la main.

Attendu : 1 → 0 après comptabilité explicite ; un échec spirituel conserve les PM selon la règle.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-08

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : M03, 0 PR au culte 1, 1 PR au culte 2

Geste : Proposer le même exercice abstrait de 1 PR pour le culte 1.

Attendu : Pas de prélèvement dans le culte 2 pour couvrir le culte 1 ; refus décidé par la table.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-09

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : M08, PR 1/3 et PR culte 2 à 0/1

Geste : Modifier une réserve puis recharger.

Attendu : Réserves indépendantes et plafonds propres ; aucune permutation des valeurs.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-10

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : Exercice runique de RECETTE coût 1 PR

Geste : Comparer critique, réussite, échec et échec critique.

Attendu : Critique : 0 PR ; réussite : coût ; échec normal : 0 PR ; échec critique : coût sans effet. Comptabilité manuelle.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-11

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : Vénération, jour saint défini par la table

Geste : Payer au moins 2 PM et résoudre le rite.

Attendu : Récupération selon type de jour et statut ; aucune récupération déclenchée par le simple bouton Lancer.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-12

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : M07, compétence de sorcellerie 55 et Lecture/Écriture 65

Geste : Retenir la compétence précisée et lancer.

Attendu : Score 55 disponible ; plafond et manipulations préparés à la table.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-13

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : M09, INT libre 0, 2 PM

Geste : Proposer une intensité supplémentaire.

Attendu : La table refuse au-delà de l’INT libre ; pas de moteur de construction de sorts inventé.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-14

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : Exercice abstrait une Rune et une technique maîtrisées, base 2 PM

Geste : Comparer les issues d’un jet de sorcellerie.

Attendu : Réussite : coût choisi ; critique : 1 PM ; échec : 1 PM ; échec critique : tous les PM investis, appliqués manuellement.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-15

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : Focus absent pour magie spirituelle

Geste : Déclarer l’incantation et noter les rounds.

Attendu : Deux rounds au lieu d’un ; aucun timer ou effet de focus automatique.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-MAGIE-16

Archive : 03-Runes-Passions-et-Magie.gmos · support manuel

Précondition : Combat spirituel et POU 15 adverse 14

Geste : Résoudre compétence puis résistance dans des tests séparés.

Attendu : Compétence en %, résistance sous 55 si POU 15 actif ; dégâts spirituels à appliquer à la main.

Source : Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-FICHE-01

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : PJ de 01

Geste : Ouvrir Fiche du jeu, puis ses quatre pages.

Attendu : Nom, sept caractéristiques, Runes, armes et valeurs liés ; aucune recoloration du PDF par le thème.

Source : Manuel RuneQuest ; correspondance runequest-fr ; moteur de fiches

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-FICHE-02

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Fiche HTML ouverte

Geste : Changer le nom et la réserve PM ; revenir au jet.

Attendu : Écriture des champs reliés reçue et utilisable ; pas seulement visible localement dans l’iframe.

Source : Manuel RuneQuest ; correspondance runequest-fr ; moteur de fiches

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-FICHE-03

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Fiche GM-OS modifiée

Geste : Sauvegarder, rouvrir la fiche HTML puis recharger.

Attendu : Valeurs sauvegardées synchronisées dans le bon sens et persistées.

Source : Manuel RuneQuest ; correspondance runequest-fr ; moteur de fiches

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-FICHE-04

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Page Famille ou histoire, valeur non reliée au pilote

Geste : Modifier une entrée familiale et une coche d’expérience.

Attendu : Donnée reste dans la fiche HTML ; elle ne devient pas un champ chiffré du pilote.

Source : Manuel RuneQuest ; correspondance runequest-fr ; moteur de fiches

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-FICHE-05

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Trois Hub de 360/768/1180 px

Geste : Choisir chaque PJ puis lancer son aptitude.

Attendu : Trois jets reçus par le MJ, bon personnage et affichage sans débordement horizontal.

Source : Manuel RuneQuest ; correspondance runequest-fr ; moteur de fiches

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-FICHE-06

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Séance active avec marqueurs fictifs privés

Geste : Inspecter uniquement la présence des marqueurs dans les trames joueur.

Attendu : Aucun marqueur privé ; si observé, ÉCHEC GM-05 conservé dans le rapport.

Source : Manuel RuneQuest ; correspondance runequest-fr ; moteur de fiches

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-FICHE-07

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Application rechargée

Geste : Vérifier campagnes, anciens joueurs/avatars et ancien PJ sentinelle.

Attendu : Import et persistance ne remplacent pas les données étrangères à ce lot.

Source : Manuel RuneQuest ; correspondance runequest-fr ; moteur de fiches

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-FICHE-08

Archive : 01-Les-Bornes-du-gue.gmos · support natif

Précondition : Fermeture de séance

Geste : Fermer les accès puis reconnecter un Hub.

Attendu : Aucun accès persistant indûment ; consigner le refus ou l’écart observé.

Source : Manuel RuneQuest ; correspondance runequest-fr ; moteur de fiches

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-TABLE-01

Archive : 01-Les-Bornes-du-gue.gmos · support manuel

Précondition : Compétence utilisée avec succès

Geste : Cocher son expérience puis effectuer la progression au livre.

Attendu : Coche et progression manuelles ; pas de points d’expérience ou gain automatique inventés.

Source : Livre p. 137–161 et corpus relu ; limites du pilote

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-TABLE-02

Archive : 01-Les-Bornes-du-gue.gmos · support manuel

Précondition : S01 ou S11

Geste : Résoudre l’intrigue par témoignage ou réparation sans magie.

Attendu : Les preuves essentielles restent accessibles ; aucun sort n’est une clé obligatoire.

Source : Livre p. 137–161 et corpus relu ; limites du pilote

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-TABLE-03

Archive : 01-Les-Bornes-du-gue.gmos · support manuel

Précondition : Deux actions d’aide proposées

Geste : Choisir la première, puis tenter d’empiler la seconde.

Attendu : La table applique les limites du livre ; l’interface ne valide pas toutes les combinaisons d’augmentations.

Source : Livre p. 137–161 et corpus relu ; limites du pilote

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**

## RQ-TABLE-04

Archive : 01-Les-Bornes-du-gue.gmos · support manuel

Précondition : Rejouer un laboratoire

Geste : Comparer Rejouer et Remplacer.

Attendu : Utiliser le remplacement du seul fichier de labo pour retrouver les valeurs initiales ; préserver 01.

Source : Livre p. 137–161 et corpus relu ; limites du pilote

Preuve : Valeur avant/après, capture si utile et contrôle après rechargement

Statut : **NON TESTÉ**
