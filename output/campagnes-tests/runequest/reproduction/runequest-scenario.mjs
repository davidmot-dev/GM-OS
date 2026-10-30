// Fiction originale de recette, 30/10/2026 : aucun scénario publié repris.
export const titreRuneQuest='Les Bornes du gué';
export const herosRuneQuest=[
 {slug:'arven',nom:'Arven des Trois-Pierres',metier:'Gardien du gué',culte:'Orlanth',description:'Voyageur au manteau rapiécé, patient tant que les serments sont tenus.',histoire:'Mandaté par trois familles pour garder le passage ouvert sans provoquer une vendetta.',motivation:'Il a promis à Sera de ne tirer son épée que pour protéger un témoin.',competences:{epee_large:65,bouclier_moyen:60,bataille:45,observation:55,esquive:50,arme1:65,dex:14,ra_dex:2,rune_air:80,rune_terre:20},materiel:['Épée large','Bouclier moyen','Corde','Manteau','Trois rations']},
 {slug:'delea',nom:'Déléa du Clos-Vert',metier:'Éleveuse et soigneuse',culte:'Ernalda',description:'Mains tachées de plantes, mémoire précise des dettes et des bêtes perdues.',histoire:'Elle cherche sa sœur de lait, partie réparer une borne et revenue sans son sac.',motivation:'Elle sait que sa famille a déplacé jadis un repère ; elle refuse une vengeance collective.',competences:{premiers_soins:70,agriculture:60,elevage:65,empathie:60,eloquence:55,connaissance_plantes:60,lance_1m:45,arme1:45,rune_terre:80,rune_air:20},materiel:['Lance','Bandages','Sac de plantes','Gourde','Trois rations']},
 {slug:'koros',nom:'Koros du Sceau-Fendu',metier:'Scribe itinérant',culte:'Lhankor Mhy',description:'Tablettes enveloppées de laine, curieux des mots que les puissants omettent.',histoire:'Envoyé copier un accord de pâture ; il découvre que trois versions portent le même sceau.',motivation:'Son maître attend une version propre ; il préfère une vérité embarrassante.',competences:{int:16,dex:16,ra_dex:1,lecture_ecriture:65,recherche_bibliotheque:60,recherche:65,intrigue:50,connaissance_culte:60,autre_competence_1:55,rune_air:40,rune_terre:60},materiel:['Dague','Tablettes vierges','Stylet','Cire','Trois rations']}
];
// slug, nom, type Atlas, description publique, note MJ, voisins.
export const lieuxRuneQuest=[
 ['halle','La halle des trois familles','building','Un toit bas abrite des paniers de semences et trois bancs disposés autour d’une auge sèche.','SECRET_MJ_RQ_RECETTE : Sera veut un accord avant la prochaine crue.',['gue','clos','atelier']],
 ['gue','Le gué des roseaux','wilderness','Des pierres plates traversent une rivière basse. Une corde rompue pend entre deux pieux.','SECRET_MJ_RQ_RECETTE : la corde a été coupée pour retenir une caravane, pas pour tuer.',['halle','bornes','berge']],
 ['clos','Le clos partagé','wilderness','De jeunes bêtes paissent entre des talus de terre ocre et un vieux figuier.','SECRET_MJ_RQ_RECETTE : une fuite d’eau, non un vol de semences, menace la récolte.',['halle','source']],
 ['atelier','L’atelier du bronze','building','Un foyer refroidi et des outils rangés servent autant aux réparations qu’aux discussions.','SECRET_MJ_RQ_RECETTE : le même poinçon a marqué trois copies ; une seule porte une date complète.',['halle','sanctuaire']],
 ['bornes','Les bornes déplacées','wilderness','Trois blocs sombres émergent de la terre remuée. Les faces cachées portent des marques d’eau.','SECRET_MJ_RQ_RECETTE : les blocs ont été tournés ; leur soubassement suffit à reconstituer l’alignement.',['gue','sanctuaire']],
 ['source','La source aux rubans','wilderness','Des rubans de laine accompagnent une source dont l’eau se perd dans une fissure récente.','SECRET_MJ_RQ_RECETTE : une dérivation accidentelle explique la sécheresse du clos ; on peut la réparer.',['clos','berge']],
 ['berge','Le camp de la berge','wilderness','Une caravane immobilisée conserve ses bêtes près d’un embarcadère de fortune.','SECRET_MJ_RQ_RECETTE : un contremaître a payé pour retarder le départ, puis perdu le contrôle des hommes.',['gue','source','sanctuaire']],
 ['sanctuaire','Le sanctuaire du serment','building','Un petit autel de pierre domine le passage. Il suffit de trois témoins pour y ouvrir une assemblée.','SECRET_MJ_RQ_RECETTE : accord négocié, preuve publique ou réparation commune offrent trois issues.',['atelier','bornes','berge']]
];
// slug, nom, rôle, lieu, description, réplique, secret ; profils humains choisis pour recette.
export const pnjRuneQuest=[
 ['sera','Sera Main-Lente','chef de famille','halle','Elle compte les sacs et laisse chacun finir sa phrase.','La rivière passera encore quand nos colères auront séché.','Elle a conservé une copie de l’ancien accord.'],
 ['venna','Venna des Clos','témoin','clos','Une cheville bandée, une connaissance exacte de chaque tranchée.','J’ai suivi l’eau, pas les traces d’un voleur.','Elle a vu la dérivation et peut guider sans jet.'],
 ['daran','Daran au Poinçon','artisan','atelier','Un bronzier dont le tablier conserve la poussière des bornes.','Un sceau prouve une main, jamais toute une histoire.','Il a recopié le texte à la demande du contremaître.'],
 ['telka','Telka des Rubans','officiante','source','Elle noue des rubans sans interrompre les visiteurs.','Un rite ne répare pas une canalisation négligée.','Elle accepte de présider une réparation commune.'],
 ['merek','Merek du Passage','contremaître','berge','Sourire rapide, comptes exacts, hommes mal payés.','Je voulais un jour de retard, pas une saison de guerre.','Il a payé Oren pour couper la corde afin de renégocier un péage.'],
 ['oren','Oren Corde-Courte','opposant','gue','Un garde épuisé qui garde la main sur sa lance.','Personne ne traverse avant d’avoir parlé au contremaître.','Il peut rendre la lame et témoigner contre une protection.'],
 ['luma','Luma des Rives','passeuse','gue','Elle connaît les passages et les heures où la berge cède.','Il existe toujours une autre rive.','Elle offre un détour sûr si le gué reste bloqué.'],
 ['hesra','Hesra aux Deux-Noms','messagère','halle','Elle décrit ses voyages par les personnes rencontrées.','Trois familles, trois copies : demandez qui les a lues.','Elle a porté les trois versions mais ignorait leur différence.'],
 ['tovan','Tovan du Talus','éleveur','clos','Il protège les bêtes avant les clôtures.','Si le clos meurt, vos preuves ne se mangeront pas.','Il a déplacé une borne pour ouvrir un drain et l’admettra.'],
 ['nelis','Nélis de la Craie','apprenti scribe','atelier','Il dessine les marques qu’il ne sait pas encore lire.','J’ai dessiné le dessous, puisque le dessus était effacé.','Son croquis restitue les marques cachées.'],
 ['branna','Branna du Serment','arbitre','sanctuaire','Elle demande des actes, puis des promesses.','Qui accepte de réparer avant d’accuser ?','Elle protège les témoins si une issue sans vaincu est proposée.'],
 ['keld','Keld des Vases','garde','berge','Soldat de passage, il croit protéger des biens saisis légalement.','Montrez-moi l’ordre avant de me demander de déposer l’arme.','Il cesse de soutenir Merek dès que la différence des copies est démontrée.']
];
// slug, titre, contenu, lieu, propriétaire, déjà public.
export const indicesRuneQuest=[
 ['accord','La copie de Sera','Trois familles entretiennent le passage ; le péage sert seulement aux réparations communes. Aucun droit de saisie des récoltes.','halle','sera',true],
 ['corde','La corde coupée','Une coupe franche s’arrête contre une marque de bronze ; l’entaille reste accessible à qui regarde le pieu.','gue','luma',false],
 ['eau','Le tracé de l’eau','La source atteint le clos par une rigole fissurée. Venna explique le trajet sans exiger de réussite.','clos','venna',false],
 ['poincon','Le poinçon de Daran','Les trois copies ont été scellées le même jour ; leur date n’est pourtant pas la même. Daran reconnaît son travail.','atelier','daran',false],
 ['croquis','Le dessous des bornes','Le dessin de Nélis place les trois marques d’eau en ligne droite, vers la source.','atelier','nelis',false],
 ['soubassement','Les anciens soubassements','Les empreintes dans la terre montrent que deux pierres ont tourné ; aucune frontière nouvelle n’a été construite.','bornes','tovan',false],
 ['ruban','Le ruban du drain','Le même fil apparaît à la source et sur le sac de Tovan : il a marqué une fuite pour demander de l’aide.','source','telka',false],
 ['compte','Le compte du contremaître','Une ligne de paiement nomme une journée de retard au passage ; elle ne mentionne aucune attaque.','berge','merek',false],
 ['ordre','L’ordre incomplet','La version remise à Keld ajoute une saisie des récoltes. La date et les témoins y manquent.','berge','keld',false],
 ['aveu','La parole d’Oren','Oren a coupé la corde contre salaire et accepte de le dire si la table le protège d’une vendetta.','gue','oren',false],
 ['rite','Le rite des trois témoins','L’assemblée peut recevoir des preuves matérielles, des aveux ou l’engagement de réparer ensemble : la magie n’est pas requise.','sanctuaire','branna',false],
 ['detour','La traversée de Luma','Un détour permet de faire passer les semences même si les négociations échouent. Une corde neuve aide ; personne n’a besoin de gagner un duel.','gue','luma',false]
];
// slug, acte, titre, lieu, PNJ, indices, enjeux et issues, scènes suivantes.
export const scenesRuneQuest=[
 ['accueil',1,'S01 — Les trois bancs','halle',['sera','hesra'],['accord'],'Écouter les mandats, partager les rôles ; accepter de garder le passage ouvert.',['passage','clos']],
 ['passage',1,'S02 — Une corde et une lance','gue',['oren','luma'],['corde','detour'],'Négocier, observer ou emprunter le détour ; combat optionnel seulement.',['clos','bronze','bornes']],
 ['clos',1,'S03 — La récolte promise','clos',['venna','tovan'],['eau'],'Obtenir le trajet de l’eau en aidant les éleveurs ; soins ou aide concrète, jamais jet bloquant.',['source','bronze']],
 ['premier-serment',1,'S04 — Ce que chacun protège','halle',['sera','hesra'],['accord'],'Mettre en jeu une Passion comme proposition ; refuser l’inspiration n’empêche pas la suite.',['bronze','bornes']],
 ['bronze',2,'S05 — Trois sceaux pour une date','atelier',['daran','nelis'],['poincon','croquis'],'Comparer les copies par lecture, entretien ou dessin ; trois accès indépendants.',['bornes','camp']],
 ['bornes',2,'S06 — Retourner la pierre','bornes',['tovan'],['soubassement'],'Examiner l’alignement ; test de FOR, coopération ou levier, sans faire dépendre l’indice d’un seul jet.',['source','camp']],
 ['source',2,'S07 — L’eau sous la laine','source',['telka','venna'],['ruban','eau'],'Réparer le drain par travail collectif, artisanat ou magie facultative.',['camp','assemblee']],
 ['camp',2,'S08 — Un salaire pour attendre','berge',['merek','keld'],['compte','ordre'],'Déceler le motif financier ; aucune lecture mentale obligatoire.',['protection','assemblee']],
 ['protection',3,'S09 — La parole protégée','gue',['oren','luma'],['aveu'],'Garantir la sécurité du témoin, comparer une opposition sociale, garder une issue non violente.',['assemblee','urgence']],
 ['urgence',3,'S10 — Le talus cède','source',['venna','telka'],['ruban'],'Secourir une bête et réparer ; localisations et Premiers soins si la table choisit le danger.',['assemblee']],
 ['assemblee',3,'S11 — Les trois témoins','sanctuaire',['branna','sera','merek'],['rite','accord','ordre'],'Présenter preuve, aveu ou engagement ; décider d’une restitution plutôt que d’une vengeance.',['reparer','depart']],
 ['reparer',3,'S12 — Une borne, trois mains','bornes',['tovan','daran','keld'],['soubassement'],'Remettre le passage en état ; convocation d’un rite facultatif sans modifier automatiquement les réserves.',['depart']],
 ['depart',4,'S13 — L’eau et les comptes','halle',['sera','branna'],['detour'],'Clore la fiction : passage rendu, péage réécrit ou détour durable. Noter ce qui a changé.',['corps','runes']],
 ['corps',4,'S14 — Atelier des aptitudes et du corps','halle',['telka'],[],'Hors fiction : importer 02 pour les profils C01–C09 et vérifier les gestes du cahier.',['runes']],
 ['runes',4,'S15 — Atelier des Runes et des magies','sanctuaire',['branna'],[],'Hors fiction : importer 03 pour M01–M09 ; coûts et suites de l’inspiration restent manuels.',['bilan']],
 ['bilan',4,'S16 — Le cahier de la table','halle',['hesra'],[],'Consigner observé et preuve, exporter le résultat sans déclarer les cas humains déjà joués.',[]]
];
