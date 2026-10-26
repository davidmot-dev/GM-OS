export const titreRdd = 'Le Moulin des heures oubliées';
export const herosRdd = [
    { slug: 'liseron', nom: 'Liseron des Gués', joueur: 'Thomas D.', metier: 'Voyageur, cartographe et haut-rêvant', attributs: [10,12,10,13,12,13,11,10,12,12,13,10,14,11], competences: { cartographie: 3, survie: 2, vigilance: 2, dague_melee: 1, hypnos: 3, onrios: 1, narcos: 0, thanatos: -11 }, caseTMR: 'G4', description: 'Manteau vert, carnet de routes et doigts tachés d’encre.', histoire: 'Une route tracée hier disparaît de son carnet chaque matin. Il cherche la borne qui lui rendra son chemin.', motivation: 'Retrouver la route sans effacer les souvenirs de ceux qui vivent ici.', materiel: ['Carnet de cartes', 'Dague', 'Corde', 'Rations de voyage', 'Gourde'] },
    { slug: 'ambre', nom: 'Ambre des Saules', joueur: 'Marie C.', metier: 'Voyageuse, soigneuse et haut-rêvante', attributs: [9,13,9,12,13,12,13,12,13,12,14,12,15,12], competences: { chirurgie: 3, botanique: 3, medecine: 2, vigilance: 1, dague_melee: 0, hypnos: 4, onrios: 0, narcos: 1, thanatos: -11 }, caseTMR: 'J4', description: 'Besace de linges propres, rubans jaunes et regard attentif.', histoire: 'Elle apporte une lettre à une meunière qui ne reconnaît plus son propre nom. Son écriture figure pourtant dans un ancien registre.', motivation: 'Ramener les disparus et préserver leur droit de choisir leur retour.', materiel: ['Trousse de soins', 'Linges propres', 'Dague', 'Rations de voyage', 'Gourde'] },
    { slug: 'oriel', nom: 'Oriel Trois-Ponts', joueur: 'Lucas R.', metier: 'Voyageur, artisan et haut-rêvant', attributs: [12,12,13,12,12,11,12,10,11,13,11,11,13,10], competences: { charpenterie: 3, bricolage: 3, escalade: 2, vigilance: 1, epee_1m: 2, hypnos: 2, onrios: 1, narcos: 3, thanatos: -11 }, caseTMR: 'D13', description: 'Veste rapiécée, niveau à fil et outils enveloppés de laine.', histoire: 'Un pont qu’il a réparé sonne comme une cloche. Le moulin en amont tourne sans eau depuis le départ de son maître.', motivation: 'Réparer le mécanisme en laissant une voie de retour aux voyageurs.', materiel: ['Outils de bois', 'Épée à une main', 'Corde', 'Rations de voyage', 'Gourde'] },
];
export const lieuxRdd = [
    ['auberge', 'L’Auberge des Trois Matins', 'building', 'Trois cadrans donnent trois heures différentes. Une table reste dressée pour des voyageurs absents.', 'Le quatrième couvert porte les initiales de Céleste.', ['place','rive']],
    ['place', 'La Place aux douze cadrans', 'city', 'Le marché ouvre lorsque sonne une cloche que personne ne voit. On échange des souvenirs contre des objets ordinaires.', 'Les douze marques indiquent un ordre de lecture, pas une solution de règle astrologique.', ['auberge','archives','pont']],
    ['archives', 'Les Archives de la pluie', 'building', 'Des registres sèchent sous des gouttières peintes. Certaines pages restent blanches jusqu’à ce qu’on les mouille.', 'Le registre relie les passages des disparus au moulin.', ['place','verger']],
    ['pont', 'Le Pont qui résonne', 'dungeon', 'Une planche neuve vibre avant chaque silence du moulin. Un passage sous la culée permet d’éviter les gardes.', 'L’arrimage du contrepoids est accessible depuis la culée.', ['place','rive','moulin']],
    ['rive', 'La Rive des lanternes', 'wilderness', 'Des lanternes sans flamme jalonnent une eau immobile. Une barque transporte des paniers vides vers l’amont.', 'Basile connaît le passage du bief. La traversée physique n’est pas un déplacement en TMR.', ['auberge','pont','verger']],
    ['verger', 'Le Verger des noms perdus', 'wilderness', 'Chaque arbre porte une étiquette sans nom. Des voyageurs endormis murmurent la même phrase.', 'Les dormeurs sont vivants. La berceuse et le registre permettent de leur parler.', ['rive','archives','moulin']],
    ['moulin', 'Le Moulin sans rivière', 'building', 'La roue tourne dans un lit de poussière. Trois leviers correspondent au frein, au contrepoids et au rappel.', 'Délier le rappel avant de freiner enferme les dormeurs ; prévenir ce risque par plusieurs indices.', ['pont','verger','chambre']],
    ['chambre', 'La Chambre du dernier matin', 'dungeon', 'Une fenêtre ouvre sur le même matin. Une petite cloche attend un nom qui lui manque.', 'Céleste a maintenu le rappel pour sauver ses voisins. Accord, réparation ou détour du bief permettent une issue.', ['moulin']],
];
// slug, nom, rôle, lieu, description, réplique, secret ; profils chiffrés de recette.
export const pnjRdd = [
    ['celeste','Céleste Verrière','ally','chambre','Meunière aux manches couvertes de farine grise.','Laissez-leur une route, même s’ils ne reviennent pas.','Elle maintient le rappel et accepte de le relâcher si une autre route est ouverte.'],
    ['maude','Maude Treize-Tasses','ally','auberge','Aubergiste qui compte toujours un couvert de trop.','La chaise vide a payé sa chambre.','Elle conserve la première lettre de Céleste.'],
    ['basile','Basile Lanterne','ally','rive','Passeur qui noue sa corde avec une seule main.','L’eau se souvient du chemin.','Le bief permet d’atteindre le moulin sans passer le pont.'],
    ['neree','Nérée des Pluies','ally','archives','Archiviste qui porte ses clefs dans une éponge.','Une page sèche ne dit pas tout.','Mouiller le registre révèle les heures des disparitions.'],
    ['irene','Irène des Pommes','neutral','verger','Jardinière qui attache des rubans aux arbres.','Je n’ai pas oublié leurs visages.','Sa berceuse rejoint le chant des dormeurs.'],
    ['colin','Colin Marteau','ally','pont','Charpentier blessé à la main, encore valide.','Cette cheville est neuve. Ce bois ne l’est pas.','Il a vu déplacer le contrepoids et peut expliquer le frein.'],
    ['soline','Soline aux Cadrans','neutral','place','Marchande de pendules immobiles.','Je vends le temps qu’on prend.','Son cadran dessine les repères d’une carte, sans effet magique chiffré.'],
    ['arden','Arden le Veilleur','hostile','pont','Garde inquiet, persuadé de protéger les dormeurs.','La dernière personne passée n’est pas revenue.','Une lettre signée ou un accord avec Céleste suffit à lui faire ouvrir.'],
    ['vianne','Vianne des Échos','neutral','moulin','Apprentie cachée dans la soupente.','Je peux tenir la corde si vous tenez la porte.','Elle a une copie du plan des leviers.'],
    ['loup','Le Loup de papier','hostile','verger','Silhouette de feuilles poussée par un courant de rêve.','Les feuilles bruissent comme des noms prononcés.','Obstacle de fiction ; profil de test ordinaire, sans prétention de bestiaire officiel.'],
    ['simon','Simon le Dormeur','neutral','verger','Voyageur endormi qui serre une clef en bois.','Ne sonnez pas avant le retour.','La clef ouvre le passage de service, pas les portes des TMR.'],
    ['aude','Aude de la Cloche','ally','chambre','Voyageuse qui a suivi la même route un rêve plus tôt.','Un nom est une invitation, pas une chaîne.','Elle connaît une sortie à pied ; tout le monde n’a pas besoin du haut-rêve.'],
];
export const indicesRdd = [
    ['lettre','I01 — La lettre au quatrième couvert','Céleste demande de conserver une route de retour avant d’arrêter la roue.','auberge','maude',true],
    ['ticket','I02 — Le reçu sans date','Trois repas ont été servis chaque matin au même couvert. Le nom est effacé, pas la quantité.','auberge','maude',false],
    ['cadran','I03 — Le cadran à douze marques','Les marques donnent un ordre de lecture au registre. Aucun jet d’astrologie n’est imposé pour lire cet indice.','place','soline',false],
    ['registre','I04 — Le registre humide','Les entrées révélées par l’eau montrent douze voyageurs entrés au moulin et aucun départ.','archives','neree',false],
    ['plan','I05 — Le plan du contrepoids','Le rappel maintient la route. Ouvrir une autre issue, fixer le contrepoids, puis freiner la roue.','pont','colin',false],
    ['corde','I06 — La corde du passeur','Trois nœuds repèrent le bief et la fenêtre de service. Une route physique contourne le pont.','rive','basile',false],
    ['chant','I07 — La berceuse inachevée','Le dernier vers appelle les voyageurs par le nom qu’ils choisissent de donner.','verger','irene',false],
    ['cle','I08 — La clef de Simon','Une clef de bois à trois dents correspond au passage de service du moulin.','verger','simon',false],
    ['copie','I09 — La copie de Vianne','Le dessin confirme que couper le rappel en premier ferme la fenêtre du dernier matin.','moulin','vianne',false],
    ['carnet','I10 — Le carnet des terres','G4 Sanctuaire Blanc, J4 Collines d’Encre et D13 Cité Sordide : repères de TMR ; les lieux du village sont une autre carte.','archives','neree',false],
    ['accord','I11 — L’accord de Céleste','La meunière accepte un retour libre, sans contraindre les dormeurs à rester au village.','chambre','celeste',false],
    ['sortie','I12 — Le chemin d’Aude','Un sentier derrière la chambre rejoint la rive après un détour. Il laisse une solution sans magie.','chambre','aude',false],
];
// slug, acte, titre, lieu, PNJ, indices, enjeu et replis, scènes suivantes.
export const scenesRdd = [
    ['arrivee',1,'S01 — Le quatrième couvert','auberge',['maude'],['lettre','ticket'],'Accueillir les PJ, remettre la lettre sans jet et choisir la première piste.',['marche','registre']],
    ['marche',1,'S02 — Le marché immobile','place',['soline'],['cadran'],'Obtenir le cadran par échange, conversation ou simple copie.',['registre','pont']],
    ['registre',1,'S03 — Une page sous la pluie','archives',['neree'],['registre','carnet'],'Relier les disparus au moulin ; Nérée montre la page si le jet de recherche échoue.',['pont','barque']],
    ['pont',1,'S04 — Le garde et le bois neuf','pont',['arden','colin'],['plan'],'Parler, présenter la lettre ou contourner par la rive ; combat facultatif.',['barque','verger']],
    ['barque',2,'S05 — Les trois nœuds','rive',['basile'],['corde'],'Préparer une traversée ou suivre le bief à pied.',['verger','atelier']],
    ['verger',2,'S06 — Les noms endormis','verger',['irene','simon'],['chant','cle'],'Écouter les dormeurs ; la berceuse et la clef sont deux pistes indépendantes.',['feuilles','tmr']],
    ['feuilles',2,'S07 — Le vent de papier','verger',['loup','irene'],['chant'],'Écarter le loup, se protéger ou attendre la fin du vent ; test de combat en option.',['atelier','tmr']],
    ['tmr',2,'S08 — Trois demi-rêves','archives',['neree'],['carnet'],'Ouvrir le module TMR ; montée, voisinage, rencontre et retour. La piste physique reste ouverte.',['atelier']],
    ['atelier',3,'S09 — La soupente de Vianne','moulin',['vianne'],['copie'],'Comparer deux plans et préparer une tâche de réparation progressive.',['rappel','chambre']],
    ['rappel',3,'S10 — Tenir le contrepoids','moulin',['vianne','colin'],['plan','copie'],'Ouvrir une issue puis tenir le frein ; chaque échec consomme du temps et permet une autre approche.',['chambre']],
    ['chambre',3,'S11 — Le choix de Céleste','chambre',['celeste','aude'],['accord','sortie'],'Négocier le retour, réparer la roue ou escorter les voyageurs à pied. Aucun combat final obligatoire.',['retour']],
    ['retour',3,'S12 — Un matin différent','auberge',['maude','simon'],['lettre'],'Choisir les souvenirs conservés, distribuer le butin et clore la séance avant les laboratoires.',['sante']],
    ['sante',4,'AT01 — Corps et fatigue','auberge',['colin'],[],'Utiliser le laboratoire 02 pour soins, encaissement, coma et récupération.',['taches']],
    ['taches',4,'AT02 — Tâches et expérience','moulin',['vianne'],[],'Tester temps, repos, tâches, chances et expérience ; noter le résultat sans cocher à l’avance.',['hautr']],
    ['hautr',4,'AT03 — TMR et Table-OS','archives',['neree'],['carnet'],'Utiliser le laboratoire 03 ; tirage Table-OS selon le terrain, maîtrise puis publication au seul voyageur.',['bilan']],
    ['bilan',4,'AT04 — Export et reprise','auberge',['maude'],[],'Fermer les accès ; exporter, recharger, remplacer un laboratoire et vérifier l’enquête préservée.',[]],
];
