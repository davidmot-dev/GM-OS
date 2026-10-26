// Fiction originale : Port-Lenoir et ses habitants ne désignent aucune campagne de David.
export const investigateurs = [
    { joueur: 'Thomas D.', slug: 'thomas', nom: 'Adrien Delcourt', metier: 'Mécanicien et ancien opérateur radio',
        valeurs: [14, 12, 15, 10, 13, 9], ressources: ['d8', 'd8', 'd6', 'd6'], fortune: 0,
        histoire: 'Votre sœur Jeanne travaille au dispensaire. Elle vous a envoyé un télégramme : les voix de la station ne viennent plus des vivants.',
        description: 'Manteau de travail, carnet de fréquences, regard attentif aux machines.',
        materiel: [['Veste renforcée', 'd8', 2], ['Trousse de mécanicien', 'd8', 0], ['Lampe électrique', 'd6', 0], ['Clé anglaise', 'd8', 0]],
        notes: 'Aucune aptitude chiffrée inventée : le métier donne du contexte. Pour les essais, Fortune commence à 0.' },
    { joueur: 'Marie C.', slug: 'marie', nom: 'Claire Morel', metier: 'Médecin du dispensaire',
        valeurs: [9, 12, 11, 14, 16, 12], ressources: ['d10', 'd6', 'd8', 'd8'], fortune: 1,
        histoire: 'Trois dockers présentent les mêmes traces de sel et répètent le même appel. Votre collègue Jeanne a disparu avant de signer ses observations.',
        description: 'Sac médical, veste sombre, voix posée ; prête à écouter les témoins.',
        materiel: [['Sac médical', 'd8', 0], ['Manteau de cuir', 'd6', 1], ['Jumelles', 'd8', 0], ['Canne', 'd6', 0]],
        notes: 'Les soins spéciaux se décident avec le livre ; le sac ne crée pas de guérison automatique. Fortune commence à 1.' },
    { joueur: 'Lucas R.', slug: 'lucas', nom: 'Émile Roussel', metier: 'Reporter et photographe',
        valeurs: [10, 15, 12, 13, 12, 15], ressources: ['d6', 'd10', 'd10', 'd4'], fortune: 2,
        histoire: 'Vous enquêtez sur le dernier voyage du bateau Saint-Elme. Son manifeste mentionne une caisse que personne ne reconnaît avoir débarquée.',
        description: 'Carnet de presse, appareil à plaques et sourire facile.',
        materiel: [['Appareil photographique', 'd8', 0], ['Imperméable', 'd4', 1], ['Carnets et crayons', 'd12', 0], ['Rations', 'd6', 0]],
        notes: 'Fortune commence à 2 pour vérifier que les nouveaux placements sont bloqués avant une défausse du MJ.' },
];

// slug, nom, type, résumé public, secret MJ, lieux voisins.
export const lieux = [
    ['port', 'Port-Lenoir — plan du bourg', 'city', 'Une ville côtière fictive, automne 1926. Le phare éteint domine les quais et la station radio.', 'Le signal relie le phare à une chambre sous la station. Les trois itinéraires mènent au même mystère.', ['quai', 'cafe', 'archives', 'dispensaire', 'station', 'phare']],
    ['quai', 'Les quais du Saint-Elme', 'battlemap', 'Grue, caisses de sel, hangar et embarcadère. La marée découvre un escalier de service.', 'Une caisse porte le numéro 17. Un contremaître efface les heures de déchargement.', ['cafe', 'station']],
    ['cafe', 'Le café des Veilleurs', 'dungeon', 'Une salle chaude, une arrière-salle réservée aux marins et un téléphone public.', 'La patronne cache Jeanne dans sa réserve, avant son transfert au dispensaire.', ['quai', 'archives']],
    ['archives', 'Les archives municipales', 'dungeon', 'Salle de lecture, registre du port et sous-sol fermé pour humidité.', 'Le plan de 1891 mentionne le tunnel que le plan récent a supprimé.', ['dispensaire', 'station']],
    ['dispensaire', 'Le dispensaire de la jetée', 'dungeon', 'Deux chambres, un cabinet et une réserve. Des patients murmurent pendant leur sommeil.', 'Jeanne a consigné la séquence de trois fréquences qui peut rompre le signal.', ['phare', 'station']],
    ['phare', 'Le phare des Trois Veilles', 'battlemap', 'Cour, logement du gardien, escalier en spirale et lanterne.', 'La lentille est retournée. Son orientation inverse désigne la chambre de résonance.', ['tunnel']],
    ['station', 'La station radio Saint-Elme', 'battlemap', 'Salle des machines, atelier, cabine radio et galerie de service.', 'L’ingénieur transmet un appel incomplet pour retenir ce qui remonte. Couper brutalement le courant libère la créature.', ['tunnel', 'quai']],
    ['tunnel', 'Tunnel et chambre de résonance', 'battlemap', 'Galerie inondée, vannes, passerelle, trois résonateurs et sortie vers la mer.', 'Fermer les trois vannes, dans l’ordre 17–4–9, interrompt le contact ; négociation et fuite restent possibles.', []],
];

// slug, nom, rôle, lieu, description, ce qu’il peut dire, secret, PV.
export const personnages = [
    ['jeanne', 'Jeanne Delcourt', 'ally', 'dispensaire', 'Infirmière épuisée, toujours attentive à ses patients.', 'Les patients répètent 17, 4 et 9 ; j’ai entendu mon propre nom dans la radio débranchée.', 'Elle a dérobé la clef de maintenance pour protéger le gardien.', 8],
    ['alice', 'Alice Kermeur', 'ally', 'cafe', 'Patronne du café, mémoire du quartier.', 'Les dockers ont transporté une caisse sans cachet de douane.', 'Elle a caché Jeanne et possède un accès discret aux quais.', 10],
    ['legoff', 'Inspecteur Le Goff', 'neutral', 'quai', 'Policier soucieux d’éviter une panique dans le port.', 'Un mandat exige des preuves. Présentez le registre falsifié et je vous ouvrirai le hangar.', 'Il sait que son adjoint reçoit de l’argent du contremaître.', 12],
    ['salome', 'Salomé Vidal', 'neutral', 'archives', 'Archiviste précise, inquiète pour les documents mouillés.', 'Deux plans du même bâtiment ne portent pas les mêmes galeries.', 'Elle a conservé le calque original malgré l’ordre de destruction.', 8],
    ['briec', 'Briec Le Guen', 'neutral', 'phare', 'Gardien âgé, une main toujours sur sa montre.', 'Le signal ne doit jamais s’arrêter avant la fermeture des vannes.', 'Il a inversé la lentille pour prévenir les bateaux sans affoler le port.', 9],
    ['malo', 'Malo, jeune mousse', 'ally', 'quai', 'Adolescent caché derrière les filets, témoin d’un débarquement.', 'Ils sont descendus dans le tunnel avec un coffre et trois lampes.', 'Il reconnaît la voix de son père disparu dans les émissions.', 6],
    ['irene', 'Irène Valois', 'neutral', 'station', 'Ingénieure radio ; mélange lucidité et privation de sommeil.', 'On peut fermer le circuit depuis la chambre. Ne coupez pas le générateur avant.', 'Elle retarde le rituel en transmettant un faux rythme.', 10],
    ['kerdreuc', 'Armand Kerdreuc', 'boss', 'station', 'Armateur élégant, persuadé de négocier avec une intelligence supérieure.', 'Je peux vous payer pour abandonner cette histoire.', 'Il a organisé le transport du résonateur et sacrifiera ses complices.', 16],
    ['contremaitre', 'Gaspard Le Bihan', 'hostile', 'quai', 'Contremaître brutal, bottes couvertes de sel.', 'Le hangar est fermé ; circulez.', 'Il porte le reçu de livraison et l’accès de la galerie de service.', 10],
    ['veilleur', 'Veilleur du sel', 'hostile', 'phare', 'Marin au regard absent, chargé de garder les accès.', 'Le maître vous attend sous les machines.', 'Il est encore humain et peut être ramené à la raison par une preuve du mensonge.', 8],
    ['porteur', 'Porteur de la chambre', 'hostile', 'tunnel', 'Silhouette qui reproduit les derniers mots de ses victimes.', 'Il appelle les investigateurs par leurs prénoms.', 'Le son n’est qu’un leurre. Il ne traverse pas une vanne complètement fermée.', 12],
    ['echo', 'L’Écho sous la mer', 'boss', 'tunnel', 'Une présence composite dont les contours ne tiennent pas en place.', 'Elle propose de rendre une voix disparue contre l’ouverture d’une vanne.', 'Sa présence dépend des trois résonateurs. Le combat est évitable ; fermer le circuit reste l’objectif.', 24],
];

// slug, titre, document / contenu partageable, lieu, détenteur, révélé.
export const indices = [
    ['telegramme', 'Télégramme de Jeanne', 'VENEZ À PORT-LENOIR. LA STATION PARLE MÊME SANS COURANT. NE FAITES CONFIANCE QU’AUX VOIX EN FACE DE VOUS. JEANNE.', 'port', 'jeanne', true],
    ['recu', 'Reçu de la caisse 17', 'Caisse 17. Masse : 84 kg. Destination : station Saint-Elme. Signature : A. Kerdreuc. Livraison avant minuit.', 'quai', 'contremaitre', false],
    ['registre', 'Registre des horaires retouché', 'L’encre de l’heure 04:09 recouvre une première inscription : 17:49. Le numéro du lot reste 17.', 'quai', 'legoff', false],
    ['serviette', 'Rendez-vous au dos d’une serviette', 'Après le troisième coup de cloche, demander Alice. Apporter le reçu, pas la caisse.', 'cafe', 'alice', false],
    ['plan', 'Le calque des galeries de 1891', 'Sous la station, une conduite rejoint le phare. Trois vannes sont numérotées 17, 4 et 9.', 'archives', 'salome', false],
    ['medecin', 'Observations médicales de Jeanne', 'Les patients cessent de murmurer lorsque les trois notes sont jouées en ordre décroissant. Aucun médicament commun ne reproduit cet effet.', 'dispensaire', 'jeanne', false],
    ['lentille', 'Carnet du gardien', 'Lentille retournée : regarder la marque gravée à la base du pied. Elle pointe vers l’accès de maintenance.', 'phare', 'briec', false],
    ['voix', 'Transcription d’un appel impossible', 'Ici Saint-Elme. Nous étions douze au départ. Nous sommes treize à répondre. N’ouvrez pas la quatrième porte.', 'station', 'irene', false],
    ['sequence', 'Procédure de fermeture', 'Réduire la puissance. Fermer 17, puis 4, puis 9. Isoler la masse. Ne couper le générateur qu’après extinction des trois témoins.', 'station', 'irene', false],
    ['mensonge', 'Contrat de Kerdreuc', 'Le signataire s’engage à restituer des voix. Aucun engagement ne concerne les personnes auxquelles elles appartenaient.', 'station', 'kerdreuc', false],
    ['vanne', 'Message gravé sur la vanne', 'QUAND LA VOIX PREND TON NOM, RÉPONDS PAR CELUI D’UN VIVANT QUI TE CONNAÎT.', 'tunnel', 'porteur', false],
    ['retour', 'Dernière transmission', 'Le bruit tombe. Trois voix humaines se reconnaissent. Le dernier mot du journal de bord reste illisible.', 'tunnel', 'echo', false],
];

// slug, acte, titre, lieu, PNJ, indices, enjeu, lecture, procédure, sorties.
export const scenes = [
    ['arrivee', 1, 'S01 — Le télégramme et la marée', 'port', ['malo'], ['telegramme'], 'Réunir les investigateurs et choisir un premier itinéraire.', 'La locomotive s’éloigne. Sur la jetée, un poste de radio fermé murmure votre nom.', 'Ouvrir la séance ; connecter les trois joueurs ; lire leurs ressources et partager le télégramme.', ['quais', 'cafe']],
    ['quais', 1, 'S02 — Une caisse sans douane', 'quai', ['legoff', 'contremaitre', 'malo'], ['recu', 'registre'], 'Obtenir les papiers sans obliger un combat.', 'L’huile de la grue forme un cercle trop régulier entre les caisses.', 'Bagou pour contourner le silence du contremaître ; Force pour retenir la charge si elle tombe. Décrire le danger avant une Sauvegarde.', ['cafe', 'archives']],
    ['cafe', 1, 'S03 — Ceux qui veillent', 'cafe', ['alice', 'jeanne'], ['serviette'], 'Identifier les trois pistes qui mènent à la station.', 'Alice ferme les volets avant de poser la tasse. Dans l’arrière-salle, une chaise est encore chaude.', 'Jouer une relation alliée, une neutre et la remise d’un objet. Ne pas transformer Bagou en points d’enquête.', ['archives', 'dispensaire', 'phare']],
    ['archives', 1, 'S04 — Le plan effacé', 'archives', ['salome'], ['plan'], 'Découvrir un accès de repli vers les souterrains.', 'Sur le plan récent, une galerie a été grattée. Le papier ancien, lui, se souvient.', 'Torche pour l’investigation ; Intelligence si un danger précis rend le déchiffrement incertain. Révéler le calque et sa carte.', ['dispensaire', 'station']],
    ['dispensaire', 2, 'S05 — Les dormeurs parlent', 'dispensaire', ['jeanne'], ['medecin'], 'Protéger les patients et comprendre le rythme des notes.', 'Trois dormeurs respirent à contretemps. Leurs voix ne sortent pas des mêmes bouches.', 'Santé mentale ; sur déclin, choisir une seule suite Folie/Choc. Vérifier la lecture du suivi sur tablette.', ['phare', 'station']],
    ['phare', 2, 'S06 — La lentille inversée', 'phare', ['briec', 'veilleur'], ['lentille'], 'Gagner la confiance du gardien ou le contourner.', 'La mer reste noire au-dessous de la lanterne tournée vers la terre.', 'Dextérité pour la passerelle ; Sagesse pour résister à l’appel ; discuter une situation d’Avantage/Désavantage.', ['station', 'tunnel']],
    ['station', 2, 'S07 — La voix de trop', 'station', ['irene', 'kerdreuc'], ['voix', 'sequence', 'mensonge'], 'Obtenir la procédure avant que Kerdreuc déclenche le rituel.', 'Le cadran oscille sans aiguille. Dans le casque, une personne qui vous connaît demande de patienter.', 'Bagou, richesse et équipement nommé ; vérifier les boutons du matériel et les limites de Fortune 0/1/2.', ['atelier', 'tunnel']],
    ['atelier', 2, 'S08 — Du métal, du feu et du sel', 'station', ['contremaitre', 'irene'], ['sequence'], 'Préparer le combat ou rendre les armes inutiles.', 'Les courroies patinent. Une étincelle tombe sur un chiffon gras.', 'Rencontre R01 : inclure les trois PJ au déclenchement. Sauvegardes physiques, PA déclarés et usure après usage. La déduction d’armure reste arbitrée par le MJ.', ['tunnel']],
    ['tunnel', 3, 'S09 — Le quatrième pas', 'tunnel', ['porteur', 'malo'], ['vanne'], 'Amener Malo derrière une vanne avant que le Porteur arrive.', 'Quatre pas résonnent alors que vous n’êtes que trois à avancer.', 'Rencontre R02 ; déplacement, cible alliée/neutre, perte de PV et séparation visible des camps. Une issue sans combat reste possible.', ['rituel', 'fuite']],
    ['rituel', 3, 'S10 — Trois vannes avant le silence', 'tunnel', ['echo', 'kerdreuc', 'irene'], ['retour'], 'Fermer le circuit, négocier ou sacrifier la station pour fuir.', 'À chaque nom prononcé, une vanne s’ouvre un peu. Les trois témoins ne s’éteignent jamais ensemble.', 'Rencontre R03 ; Constitution contre l’eau glacée, Charisme pour retenir un allié, test mental. Prévoir la chute à zéro sans forcer la mort des PJ de l’enquête.', ['epilogue', 'fuite']],
    ['fuite', 3, 'S11 — La marée choisit sa porte', 'quai', ['legoff', 'alice'], [], 'Accepter une victoire partielle et revenir avec les preuves.', 'Les amarres sont raides comme des cordes d’instrument. Au large, une lampe s’éteint.', 'Sauvegarde sous pression, équipement qui s’épuise ; poursuivre le jeu même si l’indice facultatif reste caché.', ['epilogue']],
    ['epilogue', 3, 'S12 — Les noms des vivants', 'cafe', ['alice', 'jeanne', 'briec'], ['retour'], 'Clore la séance et garder les conséquences.', 'Le café rouvre sur une rue silencieuse. Cette fois, chacun reconnaît sa propre voix.', 'Distribuer le butin, donner un objet entre joueurs, noter la chronique, recueillir les retours. Les ressources ne se rechargent pas arbitrairement.', []],
    ['laboratoire', 4, 'T01 — Inventaire et connexions', 'port', [], [], 'Contrôler les données avant toute destruction.', 'Scène hors fiction : utiliser le cahier de recette fourni.', 'Vérifier les décomptes, les trois joueurs et leurs fiches, les images et les liens. Aucun réseau externe requis.', ['jets']],
    ['jets', 4, 'T02 — Sauvegardes, Fortune et usure', 'archives', [], [], 'Exercer les jets depuis la fiche, le combat et les tablettes.', 'Banc de recette : noter le résultat réellement tiré, puis le changement attendu.', 'Parcours CH-01 à CH-12 du cahier. Les tirages restent aléatoires ; utiliser les campagnes de laboratoire pour les conséquences déjà tirées.', ['hors-jeu']],
    ['hors-jeu', 4, 'T03 — Hors Jeu et variante Pulp', 'dispensaire', [], [], 'Vérifier les conséquences sans abîmer les PJ principaux.', 'Importer le laboratoire 02 dans une campagne distincte.', 'Dix conséquences déjà tirées, plus chutes en attente Standard/Pulp. Vérifier pertes permanentes, récupération unique et persistance.', ['effets']],
    ['effets', 4, 'T04 — Chocs, Folies et durées', 'dispensaire', [], [], 'Examiner chaque résultat de table et son expiration.', 'Importer le laboratoire 03 ; les douze fiches portent chacune un effet identifiable.', 'Moments, minutes, heures, scène, journée et séance se confirment séparément. Évanouissement/Délire attendent la plus longue durée.', ['outils']],
    ['outils', 4, 'T05 — Les outils autour du pilote', 'station', [], [], 'Exercer Atlas, trame, indices, butin, sons, Storyboard et éclairages.', 'Outils transversaux : aucun module externe spécifique à Cthulhu Hack dans ce catalogue.', 'Parcours GM-01 à GM-16. Les tuiles de lumière n’ont aucune lampe assignée ; mapper le matériel seulement pour une recette physique.', ['persistence']],
    ['persistence', 4, 'T06 — Reprendre, cloner, recommencer', 'cafe', [], [], 'Retrouver une base connue et contrôler les données sauvegardées.', 'Fermer puis rouvrir la copie de recette ; comparer au relevé.', 'Parcours FIN-01 à FIN-05. Remplacer remet une campagne de recette à son état livré ; Rejouer conserve les personnages tels quels.', []],
];
