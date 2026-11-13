# Delta Green — cahier de recette

Tous les cas restent **NON TESTÉS**. Les contrôles automatiques ont leur propre rapport. Une issue aléatoire se constate au dé réel.

## JET-01 — R1 — Tests et critiques

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Recherche 50, modificateur 0.

Action : Lancer Recherche et relever le dé.

Attendu : Succès si dé ≤50 ; 01 ou double réussi critique ; double échoué ou 00 échec critique.

Source : Manuel p.44 ; src/modules/dice/systemes/deltaGreen.ts

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## JET-02 — R1 — Tests et critiques

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : FOR 11.

Action : Choisir FOR puis Préparer.

Attendu : Chances 55 avant modificateur ; pas 11.

Source : Manuel p.18

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## JET-03 — R1 — Tests et critiques

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Recherche 50.

Action : Comparer préparation −40, 0, +40 puis lancer.

Attendu : Chances 10, 50, 90 ; seul le tirage réel décide de l’issue.

Source : Manuel p.43

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## JET-04 — R1 — Tests et critiques

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Autre 1 nommé Test haut, valeur99 ; Autre 2 nommé Test bas, valeur1.

Action : Préparer +40 sur Test haut et −40 sur Test bas.

Attendu : Chances bornées à99 et1 ; message de correction visible.

Source : Manuel p.43 ; bornerLesChances

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## JET-05 — R1 — Tests et critiques

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Inconcevable 0.

Action : Sélectionner Inconcevable, même avec bonus.

Attendu : Jet de compétence à0 refusé ; aucun résultat ni dépense.

Source : Manuel p.29

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## JET-06 — R1 — Tests et critiques

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Pilotage40 et spécialité Hélicoptère ; Art0 sans spécialité.

Action : Ouvrir la liste, puis effacer temporairement la spécialité Pilotage.

Attendu : Pilotage reste proposé avec ou sans spécialité ; Art existe, son jet à0 est refusé.

Source : Pilote2.0.1 ; src/modules/session/components/fields/PanneauDeJet.tsx

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## JET-07 — R1 — Tests et critiques

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Recherche50 ; contrôle automatique distinct de l’interface.

Action : Dans le cahier comparer les sorties de dé01,11,44,50,51,55,99,00.

Attendu : Critiques réussis01/11/44 ; réussite50 ; échec51 ; critiques échoués55/99/00. Aucun dé imposable promis en interface.

Source : Manuel p.44 ; degrés réels du moteur

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## JET-08 — R1 — Tests et critiques

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Deux Agents, chances annoncées et règle ouverte.

Action : Résoudre une opposition puis une aide selon le livre.

Attendu : Noter les deux résultats et l’arbitrage ; aucune résolution spécialisée automatique annoncée. À confirmer contre le livre. 

Source : docs/systems/delta-green/rules/jets-opposes-aide-et-cooperation.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## SAN-01 — R2 — PV et combat

Personnage : [RECETTE] SANTE. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : FOR11 CON12 ; PV12.

Action : Comparer fiche HTML, fiche GM-OS et santé du combat.

Attendu : Maximum12, arrondi au supérieur de11,5 ; actuel12.

Source : Manuel p.18 ; santeDeDepart

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## SAN-02 — R2 — PV et combat

Personnage : [RECETTE] SANTE. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Restaurer PV12, maximum12.

Action : Appliquer3 dégâts ordinaires à la seule cible de recette.

Attendu : PV9 ; jauge, fiche et combat concordent ; aucune perte de SAN ou VOL inventée.

Source : Pilote combat.statsToTrack ; Manuel p.18

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## SAN-03 — R2 — PV et combat

Personnage : [RECETTE] SANTE. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : PV3, maximum12.

Action : Appliquer1 dégât puis consulter les états.

Attendu : Règle : inconscience à2 ; signal automatique encore absent selon manuel GM-OS. Consigner tout écart, ne pas cocher conforme sur la seule jauge.

Source : Manuel p.18 ; documentation/User Guides/54-Jeu-Delta-Green.md

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## SAN-04 — R2 — PV et combat

Personnage : [RECETTE] SANTE. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : PV1, maximum12 ; cible de recette seule.

Action : Appliquer1 dégât puis restaurer manuellement PV12.

Attendu : PV0 et état de mort du moteur ; restauration locale sans changer les héros.

Source : Manuel p.18 ; HealthInterpreter

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## COM-01 — R2 — PV et combat

Personnage : [RECETTE] SANTE. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Recette DEX13 ; Nora DEX13 ; Sarah DEX12.

Action : Ouvrir une rencontre et demander initiative.

Attendu : DEX détermine l’ordre décroissant ; égalité13 simultanée arbitrée à la table. Aucun d20 ajouté.

Source : Manuel p.50 ; pilote initiativeFormula

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## COM-02 — R2 — PV et combat

Personnage : [RECETTE] SANTE. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Arme choisie et portée de base lue.

Action : Comparer3m, portée de base, double, quintuple et au-delà.

Attendu : +20 à3m ou moins ;0 jusqu’à la base ;−20 jusqu’au double ;−40 jusqu’au quintuple ; au-delà impossible. Saisir les modificateurs.

Source : Manuel p.53

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## COM-03 — R2 — PV et combat

Personnage : [RECETTE] SANTE. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Une ligne arme renseignée ; munitions notées.

Action : Résoudre un tir puis décrémenter les munitions ; comparer dégâts, protection et létalité au livre.

Attendu : Champs conservés ; aucune consommation, absorption ou létalité automatique revendiquée. Vérifier la règle exacte avant résolution. 

Source : docs/systems/delta-green/rules/degats-et-types-de-degats.md ; equipement-et-materiel.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## COM-04 — R2 — PV et combat

Personnage : [RECETTE] SANTE. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : PV9, premiers_secours_recus false.

Action : Lire le livre puis résoudre un soin, noter son résultat et sa disponibilité.

Attendu : Une modification locale explicite des PV et du suivi ; pas de guérison automatique par repos ou changement de scène. Règle de soin à vérifier. 

Source : docs/systems/delta-green/rules/sante-et-blessures.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## MEN-01 — R3 — Volonté, SAN et Attaches

Personnage : [RECETTE] MENTAL. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : POU12 ; VOL12 ; SAN60 ; SR48 ; Inconcevable0.

Action : Lire les jauges et préparer un test de SAN.

Attendu : VOL maximum12 ; SAN maximum99 ; test à60 ; SR48 champ distinct.

Source : Manuel p.18 ; pilote statsToTrack

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## MEN-02 — R3 — Volonté, SAN et Attaches

Personnage : [RECETTE] MENTAL. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Restaurer VOL12, SAN60, SR48.

Action : Simuler une perte décidée de3 SAN, sans dé de règle imposé.

Attendu : SAN57 ; VOL12 et SR48 inchangés tant qu’aucune autre décision ; pas de trouble automatique promis.

Source : docs/systems/delta-green/rules/jauges-et-ressources-individuelles.md — relu:false ; test de saisie

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## MEN-03 — R3 — Volonté, SAN et Attaches

Personnage : [RECETTE] MENTAL. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : SAN49 SR48 ; valeurs artificielles.

Action : Consulter la règle puis simuler une perte jusqu’au seuil.

Attendu : SAN48 ; arbitrer trouble et nouveau seuil selon le livre. Pas d’automate de rupture annoncé.

Source : docs/systems/delta-green/rules/jauges-et-ressources-individuelles.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## MEN-04 — R3 — Volonté, SAN et Attaches

Personnage : [RECETTE] MENTAL. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Attache1 Ruth de recette, score12, endommagée false ; VOL12.

Action : Lire la projection dans le livre ; noter dé, coût, perte et Attache après arbitrage.

Attendu : Les champs choisis seuls changent ; aucune projection automatique. Vérifier conditions et montants avant la recette de règle.

Source : docs/systems/delta-green/rules/projection-du-traumatisme-sur-les-attaches-erosion-des-relations.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## MEN-05 — R3 — Volonté, SAN et Attaches

Personnage : [RECETTE] MENTAL. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Deux cases accoutumance false.

Action : Tenir les événements dans notes puis cocher seulement la case décidée avec le livre.

Attendu : Deux cases indépendantes ; pas de compteur des trois événements ni accoutumance automatique.

Source : docs/systems/delta-green/rules/accoutumance-violence-et-impuissance.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## MEN-06 — R3 — Volonté, SAN et Attaches

Personnage : [RECETTE] MENTAL. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : VOL2 puis0, restaurer entre les essais.

Action : Comparer préparation d’un test avec la règle ouverte.

Attendu : Repérer si le malus ou refus attendu est appliqué ; ne pas présumer une automatisation du jet liée à VOL. Règle à confirmer.

Source : docs/systems/delta-green/rules/jauges-et-ressources-individuelles.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## MEN-07 — R3 — Volonté, SAN et Attaches

Personnage : [RECETTE] MENTAL. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Séance7 prévue ; aucune activité passée.

Action : Jouer une vignette puis appliquer seulement les changements arbitrés.

Attendu : Promesses et Attaches documentées ; aucun gain automatique de SAN, VOL ou compétence.

Source : docs/systems/delta-green/rules/scenes-de-vie-quotidienne-vignettes-d-intermede.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## FIC-01 — R4 — Fiche et remise en état

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Fiche du jeu du personnage de recette.

Action : Modifier Nom, Recherche et Attache1 puis rouvrir.

Attendu : Correspondance dans les deux sens et persistance à constater ; ne modifier aucun héros.

Source : docs/systems/delta-green/fiche/correspondance.json

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## FIC-02 — R4 — Fiche et remise en état

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : FOR11 CON12 ; noter jauges avant modification.

Action : Passer CON13 puis revenir12.

Attendu : Contrôler maxima calculés et actuels conservés ; relever tout arrondi incohérent. Ne pas promettre recalcul automatique du SR.

Source : Manuel p.18 ; fiche HTML

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## FIC-03 — R4 — Fiche et remise en état

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Ajouter une note témoin de fiction ; noter SAN de Nora.

Action : Changer seulement Recherche du PJ recette, restaurer50, recharger GM-OS.

Attendu : Recherche50 ; note et SAN de Nora inchangées. Restauration manuelle locale ; aucun Nexus Remplacer.

Source : src/types/trame.types.ts ; ETATS-DE-REFERENCE.md

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## IMP-01 — R5 — Import, médias et liaison

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Pilote2.0.1 installé ; anciens PJ conservés comme témoins.

Action : Importer une fois le .gmos en Tel quel.

Attendu : Une seule campagne ; nouveaux PJ sous p-1/p-2/p-3 ; anciens PJ et avatars conservés.

Source : NexusService ; nexus.types.ts

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## IMP-02 — R5 — Import, médias et liaison

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Campagne importée une fois.

Action : Fermer puis rouvrir GM-OS et consulter Trame, Atlas, séances.

Attendu : 12 séances prévues,4 actes narratifs et5 ateliers ; aucun réimport nécessaire.

Source : src/types/trame.types.ts ; nexus.types.ts

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## MED-01 — R5 — Import, médias et liaison

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Connexion externe coupée.

Action : Ouvrir les plans et pièces, puis lire le signal synthétique.

Attendu : Images embarquées et WAV lisibles ; aucune voix enregistrée ni matériel configuré.

Source : manifest.json assetMap

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## HUB-01 — R5 — Import, médias et liaison

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Instance jetable autorisée ; Hub p-1/p-2/p-3 en360/768/1180px.

Action : Inspecter charges complètes et partielles, rechercher SECRET_MJ_DG_PLUIE.

Attendu : Marqueur absent des charges joueurs ; GM-05 testé sur réseau, distinct du caviardage pur.

Source : src/modules/remote/logic/caviardageDesJoueurs.ts

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## HUB-02 — R5 — Import, médias et liaison

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Chaque Hub connecté à son joueur ; personnage actif de cette partie.

Action : Modifier sa compétence, demander un jet, tenter accès au personnage d’autrui.

Attendu : Écriture et jet autorisés reçus par MJ ; écriture sur autrui refusée ; personnages actifs seuls listés.

Source : Parcours Hub et centre de liaison de GM-OS

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## HUB-03 — R5 — Import, médias et liaison

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Messagerie ouverte sur poste de recette.

Action : Demander un jet public puis un jet caché et attendre plus de5secondes.

Attendu : Résultat public visible en messagerie et fenêtre volante5s ; vérifier les destinataires du caché sans annoncer sa valeur aux autres.

Source : Demande de David ; parcours de jets distants

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## MOD-01 — R5 — Import, médias et liaison

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Pilote2.0.1 et catalogue courant.

Action : Consulter les modules disponibles du jeu.

Attendu : Aucun module spécialisé Delta Green déclaré ; outils génériques seuls, aucun module inventé.

Source : src/modules/modulesDuJeu/catalogue.ts ; pilote2.0.1

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## ENV-01 — R2 — PV et combat

Personnage : [RECETTE] SANTE. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Atelier seul ; PV12 ; scène de galerie sèche préparée.

Action : Lire la règle de noyade, fatigue et danger choisie ; annoncer sorties et risque avant un test synthétique.

Attendu : Appliquer seulement les effets arbitrés et les noter dans blessures ; aucun dégât automatique associé au changement de carte.

Source : docs/systems/delta-green/rules/environnement-et-dangers.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## POU-01 — R1 — Tests et critiques

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Deux profils synthétiques ; itinéraire avec deux sorties.

Action : Préparer une poursuite livre ouvert et consigner distances, tests et conséquences.

Attendu : Suivi manuel ; ne pas assimiler une poursuite à un module d’opposition ni inventer un compteur natif.

Source : docs/systems/delta-green/rules/poursuites.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.

## PRO-01 — R4 — Fiche et remise en état

Personnage : [RECETTE] JET. Archive : 01-Delta-Green-Les-dossiers-de-la-pluie.gmos.

Préparation : Recherche50 ; notes vides ; aucun échec d’histoire simulé.

Action : Consigner un échec de recette puis vérifier dans le livre quand une amélioration devient disponible.

Attendu : Suivi et progression arbitrés ; pas de gain automatique ou de case de progression persistante inventée dans le gabarit. Restaurer Recherche50 et les notes.

Source : docs/systems/delta-green/rules/composition-de-la-fiche-de-personnage.md ; scenes-de-vie-quotidienne-vignettes-d-intermede.md — relu:false

Preuve : Capture avant/après, dé réellement tiré, valeurs après rechargement ; noter les écarts et les limites.
