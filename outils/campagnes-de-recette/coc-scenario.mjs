// Fiction originale de recette, 31/10/2026. Aucun scénario publié repris.
export const titre='Les Minutes de Verre';
export const heros=[
 {slug:'sami',nom:'Sami Delcourt',metier:'Technicien des réseaux',description:'Veste imperméable, carnet quadrillé, regard attentif aux installations.',histoire:'Sami entretient les capteurs du canal de Belle-Rive. Une alerte impossible porte sa signature numérique.',motivation:'Rétablir les faits sans laisser son apprentie servir de coupable.',materiel:['Multimètre','Lampe frontale','Carnet de maintenance'],caracs:{agilite:2,constitution:2,force:1,perception:2,charisme:0,intelligence:3,volonte:1}},
 {slug:'ines',nom:'Inès Perrin',metier:'Secouriste et médiatrice',description:'Sac de secours, voix posée, bottes de terrain.',histoire:'Inès a mis à l’abri les habitants lors de la première fausse crue. Elle veut éviter une nouvelle panique.',motivation:'Faire passer les personnes avant les responsabilités administratives.',materiel:['Trousse de soins','Couverture','Radio portative'],caracs:{agilite:1,constitution:3,force:2,perception:1,charisme:2,intelligence:1,volonte:2}},
 {slug:'mael',nom:'Maël Varenne',metier:'Journaliste local',description:'Appareil photo usé, carnet daté, questions courtes.',histoire:'Maël conserve une photographie du canal prise à une heure qui ne figure plus dans les archives publiques.',motivation:'Publier des preuves vérifiables sans exposer les témoins.',materiel:['Appareil photo','Enregistreur','Plan du quartier'],caracs:{agilite:1,constitution:1,force:0,perception:3,charisme:2,intelligence:2,volonte:2}},
];
// slug, nom, type, description, note privée, voisins ; cartes schématiques sans échelle.
export const lieux=[
 ['parvis','Parvis du canal','city','Riverains et véhicules de secours occupent un parvis sec. Une sirène annonce pourtant une montée des eaux.','Le repère de crue est resté sec.',['quai','poste','cafe']],
 ['quai','Quai des Verriers','battlemap','Un pont métallique, un escalier glissant et une règle de niveau visible depuis la berge.','La règle et les photos contredisent le flux numérique.',['parvis','atelier','passerelle']],
 ['poste','Poste de régulation','interior','Deux écrans de contrôle, une horloge autonome et un registre papier.','Le flux public a neuf minutes d’avance.',['parvis','archives','station']],
 ['cafe','Café des Deux Heures','interior','Le café accueille les habitants évacués. Un ticket horodaté dort sous une soucoupe.','Le témoin a prêté son badge, pas saboté le canal.',['parvis','archives']],
 ['atelier','Atelier des capteurs','interior','Établi, boîtier témoin et carnet de tests. Une étiquette porte deux numéros différents.','Le dernier réglage a changé l’horloge, non le niveau mesuré.',['quai','station']],
 ['archives','Archives municipales','interior','Dossiers de marchés, sauvegarde papier et journal des accès.','Un transfert de marché dépend de la réputation du réseau.',['poste','cafe']],
 ['passerelle','Passerelle basse','battlemap','Une travée humide, une sortie haute et un chemin longeant les péniches.','Le coursier veut mettre sa famille à l’abri, il peut s’arrêter si on le rassure.',['quai','station']],
 ['station','Station de pompage','interior','Vanne manuelle, armoire de relais et téléphone de service. Le canal fonctionne normalement.','La seconde alerte peut être coupée sans arrêter les pompes.',['atelier','poste','passerelle']],
];
// slug, nom, rôle, lieu, description, réplique, secret fictif.
export const pnj=[
 ['lise','Lise Morel','Coordinatrice des secours','parvis','Gilet fluorescent, tableau des personnes mises à l’abri.','Donnez-moi un niveau mesuré et je retire le cordon.','Elle a maintenu l’évacuation par prudence, pas sur ordre politique.'],
 ['nora','Nora Belin','Apprentie technicienne','atelier','Gants trop grands et photographies de chaque intervention.','J’ai gardé l’ancien boîtier.','Elle a suivi une procédure ambiguë envoyée par son chef.'],
 ['yann','Yann Sorel','Responsable du réseau','poste','Chemise froissée, téléphone qui sonne sans cesse.','Nous avons besoin d’un fait, pas d’un coupable.','Il a caché le défaut d’horloge pour éviter une sanction.'],
 ['adele','Adèle Roussel','Archiviste','archives','Classe les copies par date physique plutôt que par nom.','Le papier ne se synchronise pas tout seul.','Elle possède une copie du premier ordre de modification.'],
 ['baptiste','Baptiste Neri','Patron du café','cafe','Accueille les habitants et note les consommations offertes.','Mon horloge est en retard, mes tickets non.','Il a prêté un badge à un coursier en croyant rendre service.'],
 ['elise','Élise Caron','Riveraine','quai','Photographie la même règle de niveau chaque soir.','Regardez la trace sèche.','Elle refuse que son adresse soit publiée.'],
 ['roux','Émile Roux','Acheteur municipal','archives','Dossiers impeccables et remarques sur les délais.','Une panne ne fait pas un complot.','Il a demandé de prolonger l’alarme pour accélérer un marché de remplacement.'],
 ['leon','Léon Vidal','Coursier','passerelle','Vélo cargo et enveloppe de bordereaux.','Je ne porte pas ce que vous croyez.','L’enveloppe contient le double des horaires, pas un dispositif dangereux.'],
 ['salma','Salma Duret','Électricienne de garde','station','Garde les mains loin des parties sous tension.','Le relais de sirène et les pompes sont séparés.','Elle peut isoler le relais avec un témoin et une procédure sûre.'],
 ['hugo','Hugo Tellier','Agent de sécurité','station','Bloque la porte mais écoute les secours.','Un ordre signé et je vous laisse passer.','Son ordre expire à vingt-deux heures.'],
 ['claire','Claire Montel','Élue de permanence','poste','Attend une synthèse contradictoire avant toute annonce.','Qui peut vérifier cela sans vous croire sur parole ?','Elle acceptera une expertise publique si les pompes continuent.'],
 ['paul','Paul Ardent','Délégué des riverains','parvis','Liste des voisins, refuse les rumeurs.','La prochaine sirène, plus personne ne la croira.','Il peut organiser un contrôle collectif de la règle.'],
];
// slug, titre, contenu, lieu, propriétaire, révélé au départ.
export const indices=[
 ['alerte','Avis d’évacuation','Le bulletin indique une crue à 21 h 18 ; une photographie indépendante montre la règle sèche à cette heure. Évidence : la mesure doit être vérifiée.','parvis','lise',true],
 ['niveau','Règle de niveau','La trace sèche, la photographie d’Élise et la lecture directe concordent : pas de crue. Évidence accessible en observant activement la berge.','quai','elise',false],
 ['ticket','Ticket du café','Un achat à 21 h 09 correspond au passage du coursier déclaré à 21 h 18 sur le système public. Évidence temporelle.','cafe','baptiste',false],
 ['journal','Journal papier du poste','Le registre autonome et l’écran divergent de neuf minutes. Évidence : le boîtier et le flux ne parlent pas de la même heure.','poste','yann',false],
 ['boitier','Fiche du boîtier témoin','La mesure brute reste stable ; le paramètre d’heure a changé. Seuils secondaires INT 10 : version ; 15 : neuf minutes ; 20 : compte utilisé.','atelier','nora',false],
 ['ordre','Ordre de modification','Un courriel imprimé demande une resynchronisation sans préciser la zone horaire ; sa copie papier est disponible auprès d’Adèle.','archives','adele',false],
 ['marche','Note d’achat anticipé','La prolongation d’alarme déclenche une réunion d’urgence pour le marché. Ce mobile politique est distinct du défaut initial.','archives','roux',false],
 ['badge','Bordereau du badge','Le badge a été prêté pour porter une enveloppe. Le témoin et la feuille de prêt confirment cette piste sans exiger une course poursuite.','cafe','baptiste',false],
 ['double','Double des horaires','L’enveloppe de Léon conserve les horaires de relais. On peut l’obtenir par dialogue, rendez-vous à la station ou course optionnelle.','passerelle','leon',false],
 ['relais','Plan du relais de sirène','Le relais d’alarme se sépare des pompes ; une procédure sûre permet d’isoler la fausse alerte sans ouvrir l’armoire sous tension.','station','salma',false],
 ['mandat','Mandat de garde','Le mandat porte une fin de validité. Présenter l’accord des secours ou attendre la relève donne accès à la station.','station','hugo',false],
 ['synthese','Synthèse contradictoire','Trois faits : défaut d’horloge accidentel, dissimulation de Yann, prolongation intéressée de Roux. Publier les pièces vérifiables et masquer les coordonnées des riverains.','poste','claire',false],
];
// slug, acte, titre, lieu, PNJ, indices, enjeu et solutions, sorties.
export const scenes=[
 ['accueil',1,'La sirène sans crue','parvis',['lise','paul'],['alerte'],'Recueillir le mandat. Une simple observation mène au quai ; les secours ouvrent aussi le poste. Aucun jet pour obtenir ces accès.',['berge','cafe','poste']],
 ['berge',1,'Le trait resté sec','quai',['elise'],['niveau'],'Évidence par observation active. PER donne des détails utiles ; un refus de photographie laisse la lecture directe et le témoignage.',['atelier','cafe']],
 ['cafe',1,'Deux horloges','cafe',['baptiste'],['ticket','badge'],'Comparer ticket et bulletin ; INT 10/15/20 précise les heures, la provenance et le prêt. Le ticket est donné même après un échec.',['poste','enveloppe']],
 ['poste',1,'Neuf minutes de trop','poste',['yann','claire'],['journal'],'Comparer le registre et le flux. Yann négocie, mais le registre et le boîtier restent accessibles par d’autres témoins.',['atelier','papier']],
 ['atelier',2,'Le boîtier témoin','atelier',['nora'],['boitier'],'Tester au banc, jamais sur une installation en charge. Aide de deux camarades possible ; un échec coûte du temps et laisse la fiche explicative.',['papier','station']],
 ['papier',2,'La copie qui reste','archives',['adele','roux'],['ordre','marche'],'Rechercher activement fournit l’ordre. PER/INT aux seuils 10/15/20 apporte des indices secondaires ; entretien social possible.',['enveloppe','negocier']],
 ['enveloppe',2,'Le coursier inquiet','passerelle',['leon'],['double'],'Dialogue sans jet si l’on explique le mandat, rendez-vous à la station ou poursuite optionnelle. Perdre la course ne détruit pas le double.',['station','negocier']],
 ['station',2,'La porte et la relève','station',['hugo','salma'],['mandat','relais'],'Mandat des secours, attente de relève ou négociation ; aucun combat obligatoire. Garde synthétique de recette si conflit choisi.',['isoler','negocier']],
 ['negocier',3,'Qui a décidé ?','poste',['yann','claire','roux'],['journal','marche'],'Approches et sentiments déclarés avant le test : Claire positive (+5), persuasion bonne (+5) ; Yann négatif (−5), négociation bonne (+5). Un refus mène à une expertise indépendante.',['isoler','public']],
 ['isoler',3,'Séparer la sirène des pompes','station',['salma','lise'],['relais'],'Procédure sécurisée avec Salma ; test de coopération pour gagner du temps. En cas d’échec elle poursuit manuellement, les pompes restent actives.',['preuve','public']],
 ['preuve',3,'Vérifier avec les habitants','quai',['elise','paul'],['niveau','synthese'],'Vérification collective du niveau, horloge indépendante et copies anonymisées : trois voies de preuve, aucun jet indispensable.',['public']],
 ['public',3,'Trois responsabilités','poste',['claire','yann','roux'],['synthese'],'Choisir expertise publique, accord surveillé avec publication différée, ou diffusion immédiate de pièces vérifiées. Éviter la publication des adresses.',['suite','accord','publication']],
 ['suite',4,'L’expertise publique','archives',['adele','claire'],['synthese'],'Commission indépendante : lenteur et responsabilité assumée. Les témoins restent protégés ; noter ce que chacun reconnaît.',['debrief']],
 ['accord',4,'L’accord sous contrôle','station',['salma','yann'],['relais'],'Service maintenu, audit daté et contrôle des riverains. Le risque est l’oubli politique ; fixer un rendez-vous public.',['debrief']],
 ['publication',4,'Les pièces au grand jour','parvis',['paul','lise'],['synthese'],'Publication contradictoire anonymisée : confiance à reconstruire, confrontation administrative possible. Aucune condamnation automatique.',['debrief']],
 ['debrief',4,'Après les sirènes','cafe',['baptiste','nora'],['ticket'],'Noter choix, conséquences, gain d’XP manuel et évolution ; débrief puis laboratoires indépendants 02 et 03. Pas de double échelle Héros/Blues sur un même PJ.',['debrief']],
];
