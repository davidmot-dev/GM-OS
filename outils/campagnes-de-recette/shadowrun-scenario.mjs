// Mission originale, 01/11/2026 : aucun scénario publié repris.
export const titre='La Dernière Couleur';
export const heros=[
 {slug:'vif',nom:'Vif',metier:'Decker et négociateur humain',metatype:'Humain',description:'Manteau indigo, doigts tachés de peinture conductrice, humour sec.',histoire:'Vif entretenait les enseignes du quartier avant de découvrir leurs contrats de surveillance.',motivation:'Effacer les traces de ses voisins sans effacer les preuves.',materiel:['Cyberdeck de recette','Liaison filaire','Pistolet de recette VD 4 étourdissant'],caracs:{force:3,agilite:4,volonte:3,logique:5,charisme:4},competences:[['Piratage','logique',5],['Électronique','logique',4],['Influence','charisme',4],['Armes à distance','agilite',3]]},
 {slug:'prisme',nom:'Prisme',metier:'Éveillée elfe et secouriste',metatype:'Elfe',description:'Reflets ultraviolets dans les cheveux, manteau couvert de reprises, regard calme.',histoire:'Prisme tient une permanence de soins dans un ancien atelier lumineux.',motivation:'Protéger les personnes dont les données médicales servent de caution.',materiel:['Kit de premiers soins','Focaliseur de recette','Protection souple de recette'],caracs:{force:3,agilite:3,volonte:5,logique:4,charisme:4},competences:[['Sorcellerie','volonte',5],['Survie','logique',4],['Influence','charisme',3],['Perception','logique',4]]},
 {slug:'sillage',nom:'Sillage',metier:'Rigger ork et pilote',metatype:'Ork',description:'Combinaison anthracite, bandes magenta, lunettes rayées.',histoire:'Sillage livre des accumulateurs avec une moto et un drone de maintenance.',motivation:'Ramener la coursière vivante et rendre le réseau aux habitants.',materiel:['Moto de recette','Drone de maintenance de recette','CCR, CCV et IND de recette'],caracs:{force:5,agilite:5,volonte:3,logique:3,charisme:2},competences:[['Pilotage','agilite',5],['Armes à distance','agilite',4],['Athlétisme','force',3],['Électronique','logique',3]]},
];
export const lieux=[
 ['marche','Marché des Couleurs','city','Au pied des tours, cyan et magenta ruissellent sur les bâches. Une coursière manque au rendez-vous.','Les habitants financent une sortie sans effusion de sang.',['clinique','passerelle','studio']],
 ['clinique','Clinique des Reflets','interior','Une salle de soins et un comptoir isolé du réseau public.','Une copie consentie des contrats prouve le chantage.',['marche','relais']],
 ['passerelle','Passerelle Chromatique','battlemap','Voie surélevée, rail de maintenance et rampe latérale sous la pluie.','La coursière est cachée sous la rampe, pas dans le véhicule leurre.',['marche','depot']],
 ['studio','Studio Hors Champ','interior','Écrans débranchés, table lumineuse et enregistreur autonome.','La commande de collecte porte une signature vérifiable.',['marche','relais']],
 ['depot','Dépôt du Dernier Tram','battlemap','Deux voies, un abri blindé et une sortie piétonne.','Les gardes protègent un contrat, ils ne veulent pas tuer.',['passerelle','relais']],
 ['relais','Relais de l’Aube','interior','Une antenne, un serveur local et un disjoncteur manuel séparé des services vitaux.','Le flux peut être détourné sans couper les soins.',['studio','clinique','depot']],
];
export const pnj=[
 ['mira','Mira Flux','Commanditaire','marche','Peintre d’enseignes, mains cyan.','Je paie une sortie, pas une vengeance.','Elle veut récupérer les données avec le consentement des personnes.'],
 ['azur','Azur','Coursière','passerelle','Visière fêlée, boîtier scellé.','Le leurre roule sans moi.','Elle a laissé un itinéraire papier à la clinique.'],
 ['nacre','Nacre','Médecin','clinique','Trousse de soins, voix douce.','Demandez aux patients avant de copier.','Elle dispose d’une copie témoin anonymisée.'],
 ['pixel','Pixel','Monteur de preuves','studio','Travaille sur des appareils hors réseau.','Une signature se compare, elle ne se croit pas.','Il a deux enregistrements indépendants.'],
 ['brume','Brume','Cheffe de sécurité','depot','Armure terne, gestes économes.','Montrez-moi une issue qui ne coûte pas mes gens.','Un accord écrit lui permet de laisser passer le tram.'],
 ['chrome','Chrome','Intermédiaire','relais','Costume sec sous un parapluie lumineux.','Les données ont déjà un acheteur.','Il peut acheter du temps, pas annuler les copies hors ligne.'],
 ['echo','Écho','Technicienne','relais','Plan des circuits cousu dans la manche.','Le relais et la clinique ont deux alimentations.','Elle peut détourner manuellement la liaison.'],
 ['ambre','Ambre','Déléguée des habitants','marche','Tient les consentements sur papier.','La preuve restera, les noms partiront.','Elle refuse une publication des identités médicales.'],
 ['fer','Fer','Drone de garde','depot','Châssis de maintenance armé pour la recette.','Zone de livraison fermée.','Son contrôle autonome cède à une commande prioritaire autorisée.'],
];
export const indices=[
 ['contrat','Mandat des habitants','Récupérer Azur, prouver le chantage et empêcher la vente des identités. Paiement fictif : 3000 nuyens. Aucun budget de création officiel.','marche','mira',true],
 ['trajet','Itinéraire papier','La rampe de maintenance rejoint la clinique. Le papier, les témoins et les caméras hors ligne donnent trois accès à Azur.','clinique','nacre',false],
 ['signature','Signature de collecte','Le contrat signé par Chrome vise les identités médicales ; une copie autonome et le témoignage de Pixel concordent.','studio','pixel',false],
 ['leurre','Journal du véhicule leurre','La moto autonome est partie sans sa conductrice. Une trace visible sous la rampe permet de retrouver Azur même après une poursuite ratée.','passerelle','azur',false],
 ['consentement','Consentements anonymisés','Les personnes acceptent la preuve du chantage, pas la diffusion de leur dossier. Copie donnée sans jet si on explique le mandat.','clinique','nacre',false],
 ['ordre','Contrat des gardes','Brume doit bloquer le boîtier, pas les personnes ; négociation, sortie piétonne ou attente du tram sont trois solutions.','depot','brume',false],
 ['circuit','Plan du relais','Écho distingue la liaison de vente et les services vitaux. Copie de secours au studio ; sabotage aveugle inutile.','relais','echo',false],
 ['vente','Offre de rachat','Chrome achète le silence. Le refus ne ferme aucune piste : copies, témoins et accès manuel restent disponibles.','relais','chrome',false],
 ['preuve','Dossier final anonymisé','Signature, consentements et copie hors ligne établissent le chantage. Restituer, publier sans identités ou négocier un contrôle public.','marche','ambre',false],
];
export const scenes=[
 ['contrat',1,'Le contrat sous les néons','marche',['mira','ambre'],['contrat'],'Accord sur les limites et les personnes à protéger ; aucun jet pour recevoir le mandat.',['preparer','studio']],
 ['preparer',1,'Trois chemins de préparation','clinique',['nacre'],['trajet','consentement'],'Tests de préparation annoncés ; reporter les succès dans la réserve collective à la main. Évidence de trajet accessible sans jet.',['studio','rampe']],
 ['studio',1,'Une signature hors ligne','studio',['pixel'],['signature'],'Copie donnée après observation active ; Électronique + Logique seuil 3 ajoute un détail. Un échec coûte du temps, pas la preuve.',['rampe','approche']],
 ['rampe',2,'La course et le leurre','passerelle',['azur'],['leurre'],'Course optionnelle en Pilotage + Agilité ; perdre mène aux traces et au témoin de la clinique. Priorité : extraire Azur.',['abri','approche']],
 ['abri',2,'Le choix d’Azur','clinique',['azur','nacre'],['consentement'],'Soins si nécessaires et consentement ; magie facultative, drain arbitré et suivi explicitement.',['approche','negocier']],
 ['approche',2,'La porte du dernier tram','depot',['brume','fer'],['ordre'],'Dialogue, Matrice, drone ou rampe piétonne ; affrontement optionnel, VD finale et type annoncés.',['negocier','relais']],
 ['negocier',3,'Le prix du silence','relais',['chrome','brume'],['vente'],'Négociation opposée à arbitrer : égalité non départagée ; copie hors ligne protège de la destruction de preuve.',['relais','copie']],
 ['relais',3,'Le relais séparé','relais',['echo'],['circuit'],'Piratage selon mode choisi ou intervention manuelle avec Écho ; les soins ne sont jamais coupés par défaut.',['copie','sortie']],
 ['copie',3,'Ce qui doit rester','studio',['pixel','ambre'],['signature','preuve'],'Comparer et anonymiser sans jet indispensable ; flashback 1 à 4 Anarchy selon portée et accord de table.',['sortie']],
 ['sortie',4,'La dernière couleur','passerelle',['azur','brume'],['ordre'],'Sortie par tram négocié, convoi discret ou course optionnelle ; choisir les risques et annoncer les conséquences.',['decision']],
 ['decision',4,'Publier ou restituer','marche',['mira','ambre'],['preuve'],'Trois issues : restitution consentie, publication anonymisée, accord contrôlé et copies sous séquestre. Les identités restent protégées.',['debrief']],
 ['debrief',4,'Après la pluie','clinique',['nacre','azur'],['consentement'],'Noter conséquences, Anarchy de fin de scénario et progression manuelle. Jouer 02/03 séparément.',['debrief']],
];
