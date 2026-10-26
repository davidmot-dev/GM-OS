export const titreNephilim='Le Méridien de verre';
export const herosNephilim=[
    {slug:'asterion',nom:'Astérion',joueur:'Thomas D.',simulacre:'Adrien Veyre',metier:'Conservateur de collections',art:'Magie',dominant:'Feu',ka:[6,3,4,3,2],passe:'Scribe',passe2:'Mage bactrien',metamorphe:'Veines de braise',description:'Un conservateur discret dont les doigts paraissent tièdes même dans les réserves froides.',histoire:'Une plaque de verre porte une écriture qu’il se souvient avoir tracée dans une autre incarnation.',motivation:'Retrouver l’auteur du relevé avant que la plaque ne soit effacée.',materiel:['Carnet de relevés','Lampe de poche','Boîte de conservation']},
    {slug:'ismerie',nom:'Ismérie',joueur:'Marie C.',simulacre:'Mélanie Sorrel',metier:'Restauratrice de vitraux',art:'Kabbale',dominant:'Eau',ka:[2,3,6,4,3],passe:'Astrologue mage',passe2:'Astrologue',metamorphe:'Reflets de nacre',description:'Une restauratrice qui écoute les vibrations du verre avant de toucher une pièce.',histoire:'Une voix lui demande de réparer un nom manquant dans l’inventaire d’un ancien atelier.',motivation:'Distinguer la demande d’un témoin de l’ordre d’un geôlier.',materiel:['Outils de vitrailliste','Calques numérotés','Loupe de restauration']},
    {slug:'nahal',nom:'Nahal',joueur:'Lucas R.',simulacre:'Julien Roussel',metier:'Technicien de maintenance',art:'Alchimie',dominant:'Terre',ka:[3,2,4,6,3],passe:'Médecin urgentiste',passe2:'Scribe',metamorphe:'Peau de quartz',description:'Un technicien couvert de poussière minérale qui sait où passent les conduites de l’atelier.',histoire:'Il retrouve dans un plan moderne les proportions d’un construct perdu.',motivation:'Désactiver l’appareil sans disperser les souvenirs qu’il retient.',materiel:['Trousse de maintenance','Cornue de recette','Flacons étiquetés']},
];
export const lieuxNephilim=[
    ['atelier','L’Atelier des reflets','building','Une ancienne verrerie accueille un inventaire avant travaux. Les plaques photographiques montrent un cadran absent du bâtiment.','Le premier relevé relie trois emplacements ; le coffret peut être ouvert sans magie.',['archives','cour']],
    ['archives','Les Archives du canal','building','Des registres d’artisans côtoient les plans des conduites. Une cote récente remplace un nom ancien.','Le registre original désigne un dispositif de conservation, pas une arme.',['atelier','cabinet','passage']],
    ['cour','La Cour des verriers','city','Des échafaudages relient les façades. Un four désaffecté porte une marque sous la suie.','La marque indique l’emplacement d’une seconde plaque, accessible par l’entretien.',['atelier','serre','passage']],
    ['cabinet','Le Cabinet des heures','building','Un horloger conserve des pièces réformées. Les montres s’arrêtent lorsqu’on approche le même tiroir.','Le tiroir contient une stase que Liora cherche à récupérer.',['archives','serre']],
    ['serre','La Serre des cinq eaux','wilderness','Cinq bassins alimentent une installation de verre gravé. Les étiquettes décrivent des prélèvements faits à des jours différents.','Le lieu est proposé comme Plexus d’Eau pour la recette ; le MJ choisit le réglage du bandeau.',['cour','cabinet','station']],
    ['passage','Le Passage des ouvriers','dungeon','Un couloir technique longe les conduites du canal. On y circule à pied en évitant les alarmes de chantier.','Une liaison physique contourne le poste de surveillance.',['archives','cour','station']],
    ['station','La Station de mesure','building','Des fils modernes sont raccordés à un cadran plus ancien. Le surveillant croit garder du matériel de chantier.','Nérac a détourné le dispositif pour fixer une image de souvenirs ; le circuit peut être isolé.',['serre','passage','chambre']],
    ['chambre','La Chambre du méridien','dungeon','Une lentille rassemble les reflets vers une plaque gravée. Un portrait change selon la lumière, sans révéler son nom.','Restituer les plaques, désaccorder le circuit ou négocier la libération permet trois issues.',['station']],
];
// slug, nom, rôle, lieu, description, réplique, secret, nature.
export const pnjNephilim=[
    ['liora','Liora','ally','cabinet','Nephilim dissimulée sous une antiquaire patiente.','Une prison peut porter le nom de mémoire.','Sa stase est dans le tiroir ; elle accepte de guider le groupe si on la lui rend.','nephilim'],
    ['solal','Solal','ally','archives','Nephilim qui conserve des copies de plans disparus.','Je reconnais les traits, pas la main qui les a copiés.','Il a compris la fonction du méridien mais ignore son raccord moderne.','nephilim'],
    ['nerac','Baptiste Nérac','boss','chambre','Nephilim incarné dans un collectionneur obsédé par la conservation.','Je ne détruis rien. Je retiens ce qui allait disparaître.','Il immobilise les souvenirs pour éviter une perte ancienne ; une restitution négociée reste possible.','nephilim'],
    ['maelle','Maëlle Bréant','ally','atelier','Responsable humaine de l’inventaire, soigneuse dans ses méthodes.','Quelqu’un a repris les numéros après ma visite.','Elle possède les photographies datées du premier inventaire.','humain'],
    ['ruben','Ruben Chassel','neutral','station','Surveillant de chantier humain, inquiet des accès nocturnes.','Je garde une porte, pas un laboratoire secret.','Un ordre de maintenance signé ou le passage technique permet d’éviter l’affrontement.','humain'],
    ['elsa','Elsa Dorne','ally','serre','Botaniste humaine qui consigne chaque prélèvement.','L’eau vient bien d’ici, les dates sont fausses.','Ses prélèvements prouvent la modification récente du circuit.','humain'],
    ['ilyes','Ilyès Perrot','neutral','cour','Artisan humain qui a déplacé un panneau de verre.','Je l’ai posé sur des cales, je n’ai rien effacé.','La deuxième plaque est dans sa caisse d’outils.','humain'],
    ['noe','Noé Ravel','neutral','cabinet','Horloger humain qui ne veut plus ouvrir le tiroir.','Toutes mes montres y perdent la même minute.','Il remet le tiroir si on garantit la sécurité de sa boutique.','humain'],
    ['selene','Séléné','neutral','serre','Nephilim méfiante qui observe la circulation des reflets.','Tout ce qui répond ne souhaite pas être entendu.','Elle connaît une manière de désaccorder la lentille, sous arbitrage du MJ.','nephilim'],
    ['milo','Milo Ferret','hostile','passage','Intermédiaire humain payé pour récupérer les plans.','Je dois rapporter les papiers, pas les gens.','Il se retire si la transaction est exposée ou si sa cible disparaît de son contrat.','humain'],
    ['ada','Ada Sorel','ally','archives','Archiviste humaine qui se méfie des demandes urgentes.','Les corrections ont une date, même quand elles n’ont pas de signature.','Elle conserve le bordereau de déplacement des plaques.','humain'],
    ['tom','Tom Varenne','neutral','station','Électricien humain qui reconnaît son propre câblage.','Le raccord ancien ne figurait pas sur mon devis.','Il peut isoler le circuit tout en gardant l’éclairage de sécurité.','humain'],
];
export const indicesNephilim=[
    ['releve','I01 — Le relevé au cadran absent','Trois repères figurent sur la photographie d’inventaire. Ils correspondent à l’atelier, au cabinet et à la station.','atelier','maelle',true],
    ['cote','I02 — La cote réécrite','Le numéro d’une plaque a été conservé tandis que son intitulé changeait.','atelier','maelle',false],
    ['registre','I03 — Le registre des verriers','Le dispositif était décrit comme un moyen de conserver une image, jamais de retenir un voyageur.','archives','solal',false],
    ['bordereau','I04 — Le bordereau d’Ada','Les plaques ont été déplacées après le premier inventaire, sur une demande du cabinet Nérac.','archives','ada',false],
    ['marque','I05 — La marque sous la suie','Une seconde plaque attend dans la caisse du vitrier. Aucun sort n’est requis pour la lire à contre-jour.','cour','ilyes',false],
    ['tiroir','I06 — Le tiroir arrêté','La stase de Liora est enfermée avec le plan du cadran. Le tiroir peut être ouvert par accord avec Noé.','cabinet','noe',false],
    ['prelevements','I07 — Les prélèvements datés','L’eau du circuit a été remplacée récemment ; le carnet d’Elsa prouve quand.','serre','elsa',false],
    ['calque','I08 — Le calque de Séléné','Les tracés suggèrent trois points à désaccorder ; leur effet occulte doit être décidé à la table.','serre','selene',false],
    ['contrat','I09 — L’ordre de récupération','Milo est payé pour reprendre les plans, pas pour détruire les plaques.','passage','milo',false],
    ['circuit','I10 — Le devis électrique','Le raccord moderne peut être isolé en préservant l’éclairage et une sortie à pied.','station','tom',false],
    ['journal','I11 — Le journal de surveillance','Les accès nocturnes relient le collecteur aux déplacements du matériel.','station','ruben',false],
    ['lettre','I12 — La lettre sans destinataire','Nérac veut retenir une perte ancienne. Liora reconnaît ce qu’il n’a pas su abandonner.','chambre','nerac',false],
];
export const scenesNephilim=[
    ['inventaire',1,'S01 — L’inventaire ne concorde plus','atelier',['maelle'],['releve','cote'],'Recevoir I01 sans jet, reconnaître les repères et choisir une première piste.',['registre','cour']],
    ['registre',1,'S02 — Un ancien usage','archives',['solal','ada'],['registre','bordereau'],'Comparer copies et dates ; les documents restent accessibles après un échec avec une conséquence de temps.',['cour','cabinet']],
    ['cour',1,'S03 — Sous la suie','cour',['ilyes'],['marque'],'Retrouver la plaque par observation, métier contemporain ou souvenir passé ; une seule bonne approche suffit.',['cabinet','serre']],
    ['cabinet',1,'S04 — La minute perdue','cabinet',['liora','noe'],['tiroir'],'Négocier l’ouverture, retrouver la stase et obtenir un plan lisible sans contrainte magique.',['serre','passage']],
    ['serre',2,'S05 — Le prélèvement récent','serre',['elsa'],['prelevements'],'Comparer les échantillons ; proposer Plexus et conjonction comme contexte de test explicite.',['calque','passage']],
    ['calque',2,'S06 — Ce qui répond dans le verre','serre',['selene'],['calque'],'Tester un Art choisi, ou se fier aux plans ; les profils de pouvoirs de recette ne sont pas des sorts officiels.',['passage','station']],
    ['passage',2,'S07 — Le contrat de Milo','passage',['milo'],['contrat'],'Détour, discussion ou confrontation évitable ; la Traque doit être réglée explicitement selon la scène.',['station']],
    ['station',2,'S08 — Le raccord ajouté','station',['ruben','tom'],['circuit','journal'],'Entrer par autorisation ou entretien ; conserver deux voies d’accès à la chambre.',['comparer','lentille']],
    ['comparer',3,'S09 — Deux plans du même lieu','archives',['solal','ada'],['registre','circuit'],'Assembler les preuves et décider entre restitution, désaccord et coupure du circuit.',['lentille']],
    ['lentille',3,'S10 — Le nom derrière l’image','chambre',['nerac','liora'],['lettre'],'Entendre Nérac ; un souvenir passé ou le témoignage de Liora offre une prise sans combat.',['isoler','restitution']],
    ['isoler',3,'S11 — Garder une sortie','station',['tom','ruben'],['circuit'],'Isoler le raccord, éviter la panne générale et accompagner les témoins.',['restitution']],
    ['restitution',3,'S12 — Rendre les reflets','atelier',['liora','maelle'],['releve','lettre'],'Décider du sort des plaques, répartir le butin, noter les conséquences puis conclure la séance.',['sante']],
    ['sante',4,'AT01 — Santé et Chutes','atelier',['solal'],[],'Laboratoire 02 : encaissement, repos, paliers, interdits et stase ; hors fiction.',['arts']],
    ['arts',4,'AT02 — Les trois Sciences occultes','serre',['selene'],[],'Laboratoire 03 : sorts, pacte, transmutation et début de séance ; pas de pouvoir actif au chargement.',['outils']],
    ['outils',4,'AT03 — Les outils du meneur','station',['tom'],[],'Atlas, Storyboard, tables, sons, lumières non affectées et réinitialisation isolée.',['bilan']],
    ['bilan',4,'AT04 — Export et reprise','atelier',['maelle'],[],'Fermer la séance, exporter, Cloner et recharger ; comparer les fiches et les réserves.',[]],
];
