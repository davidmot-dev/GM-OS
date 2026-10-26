import fs from 'node:fs';
import path from 'node:path';
import {titreDune,herosDune,scenesDune,pnjDune} from './dune-scenario.mjs';
const lignes=[
    ['01','Trois PJ et pilote 2.0.0','Composer Compétence + Principe et difficulté 1.','Deux d20 ; somme = seuil de chaque dé, difficulté = réussites exigées.'],
    ['01','Spécialisation pertinente','Comparer un jet avec puis sans spécialisation sur copies.','Critique étendu jusqu’à la compétence ; le seuil ne change pas.'],
    ['01','Jet préparé','Acheter successivement les troisième, quatrième et cinquième dés.','Coûts 1, 2, 3 ; réserve plafonnée à cinq dés.'],
    ['01','Impulsion 2 et Menace 3','Choisir de payer un achat en Menace malgré de l’Impulsion disponible.','La part choisie monte en Menace, le reste seul débite l’Impulsion.'],
    ['01','PNJ ennemi','Cocher PNJ ennemi et acheter un dé.','Le coût débite la Menace du meneur, pas l’Impulsion des joueurs.'],
    ['01','Assistant déclaré','Ajouter un assistant avec son propre seuil et critique.','Un dé propre ; ses réussites ne comptent que si le principal réussit au moins un dé ; ses complications comptent toujours.'],
    ['01','Aide et Détermination','Relancer les dés sélectionnés du principal.','Dés d’aide conservés, même s’ils ont été cochés par erreur.'],
    ['01','Complication','Comparer marge 20 puis 16–20 sur copies.','Les complications se lisent indépendamment de la réussite.'],
    ['01','Opposition','Entrer réussites du défenseur, gêne et facteurs.','Difficulté calculée, peut dépasser 5 ; ordre des deux jets explicite.'],
    ['01','Maximes déjà inscrites','Ouvrir la fiche HTML et le carnet des principes.','Chaque maxime reste rattachée au bon principe dans _gmos_dune.maximes.'],
    ['01','Détermination 1','Confirmer une maxime alignée et choisir Un dé vaut 1 avant le jet.','Un dé remplacé, réserve non agrandie, point dépensé une fois.'],
    ['01','Jet lancé','Choisir des dés et dépenser une Détermination pour relancer.','Résultats remplacés ; pas de relance des assistants ni de dépenses déjà effectuées.'],
    ['01','Déclaration narrative','Créer/modifier un trait par Détermination après accord du MJ.','Coût et carnet conservés ; texte du trait modifié explicitement.'],
    ['02','P01 Détermination 0','Tenter une dépense puis accorder un point explicitement.','Insuffisance refusée ; une reconnexion ne rend pas de point.'],
    ['01','Contradiction offerte par le MJ','Essayer Respecter, Bafouer et refuser sur copies.','Complication ou principe indisponible à la fin du test ; choix explicite.'],
    ['02','P02 Devoir bafoué','Lancer avec Devoir puis préparer une scène d’introspection.','Principe indisponible ; récupération exige conditions et nouvelle maxime ou rééquilibrage.'],
    ['02','P03 Justice récupérée','Tenter de bafouer Justice encore dans la même aventure.','Récupération mémorisée, pas de nouvelle bafouade autorisée dans l’aventure.'],
    ['02','Introspection','Dépenser/gagner de la Détermination dans la scène puis tenter la récupération.','Récupération refusée dans cette scène ; une nouvelle scène autorisée ne remet pas toute seule les points à 1.'],
    ['01','Début d’aventure','Nommer explicitement une autre aventure et confirmer.','Détermination remise à 1 par ce geste ; pas par ouverture ou changement de scène.'],
    ['02','Impulsion commune 6','Réussir avec marge et bonus annoncé puis examiner le bilan.','Impulsion normale et bonus du test dépensables malgré réserve pleine.'],
    ['01','Test réussi','Payer information, trait puis atout temporaire sur essais séparés.','Bonus, normal, réserve consommés dans cet ordre ; effet confirmé avec le MJ.'],
    ['01','Question sans réponse possible','Rendre le point explicitement au bandeau.','Restitution visible et justifiée ; pas d’ajout silencieux automatique.'],
    ['01','Clôture du test','Terminer le test et conserver le reliquat.','Seul le reliquat normal rejoint la réserve jusqu’à 6 ; bonus perdu, pas de second versement.'],
    ['01','PNJ ennemi et marge','Clore son test.','Reliquat normal converti en Menace ; bonus non conservé.'],
    ['01','Complication','Racheter pour un PJ puis pour un ennemi sur copies.','PJ concède 2 Menace ; ennemi dépense 2 Menace.'],
    ['01','Échec autorisé mitigé','Choisir réussite mitigée et décrire la complication avec le MJ.','Test reste en échec ; pas d’Impulsion du test ni de dépense d’amélioration.'],
    ['01','Fin de scène','Valider le geste de fin de scène une fois.','Impulsion commune −1 selon le pilote ; réserves et suivi retrouvés après recharge.'],
    ['03','Rencontre de recette','Choisir le camp qui ouvre puis alterner.','Pas d’initiative individuelle au d20 ; ouverture ennemie narrative ou 2 Menace selon choix.'],
    ['03','Action réussie','Retenir le camp pour un allié puis pour le même acteur sur copies.','Coût 2 payé par le bon camp ; même acteur reçoit +1 difficulté.'],
    ['03','Attaque ou mouvement raté','Tenter une rétention.','Refus ; pas de rétention répétée avant intervention ennemie.'],
    ['03','Mouvement discret réussi','Conserver la main après le mouvement confirmé.','Rétention gratuite pour le cas prévu ; second mouvement payé séparément si nécessaire.'],
    ['03','Maxime alignée et point','Dépenser une Détermination pour l’action supplémentaire.','Action supplémentaire distincte de la rétention ordinaire, coût suivi.'],
    ['02','P07 mineur vaincu','Comparer une attaque réussie sur un mineur neuf.','Une réussite le vainc ; pas de mort ni PV inventés.'],
    ['03','Cible notable','Régler défense/qualité puis appliquer une attaque réellement réussie.','Conditions = compétence défensive + qualité ; progression 2 + qualité offensive.'],
    ['03','Amélioration offensive','Payer 2 Impulsion et appliquer l’attaque.','Qualité +1 pour cette attaque uniquement ; coût annoncé une fois.'],
    ['02','P04 vaincu, qualité 1','Survivre dans une scène nommée et choisir une complication.','Coût 2 ; survie une fois par scène, progression conservée, pas de guérison générale.'],
    ['02','P04 conséquence durable','Appliquer une aide réussie de difficulté 2.','Conséquence empêchée selon le suivi ; cible pas automatiquement remise en jeu.'],
    ['02','P07 sans conséquence durable','Préparer la tâche de récupération.','Conditions 4 + qualité de l’atout vainqueur ; aucun soin par points de vie.'],
    ['02','P05 35 points de progression','Acheter une compétence après l’aventure.','Coût affiché, max 8, une progression par aventure et restrictions gardées.'],
    ['02','P08 compétence à 6+','Acheter une spécialisation puis tenter la même aventure à nouveau.','Précondition et coût selon nombre détenu ; seconde progression refusée.'],
    ['02','P09 atout de qualité 0','Améliorer sa qualité puis essayer pérennisation sur copies.','Qualité 0→1 coûte 2 ; permanent coûte 3 selon errata ; atout et points persistés.'],
    ['02','Progression par reconversion','Choisir une capacité cédée valide.','Coût divisé par deux arrondi au supérieur, ancienne capacité retirée, compétence cédée reste à 4 minimum.'],
    ['01','Module déjà préparé','Ouvrir le pupitre et autoriser les trois PJ.','Un module existant, cinq zones et six atouts ; accès explicites, pas de commande MJ pour les joueurs.'],
    ['01','Zone Nalia et désirs cachés','Appliquer deux enquêtes réussies Analyse 6.','+4 puis +4 ; Discipline 6 atteinte au second test, désir révélé seulement alors.'],
    ['01','Secrets du plateau','Inspecter les données reçues avant révélation.','Zone cachée, atout privé et désirs non révélés absents ; journal sans charge privée.'],
    ['03','Cinq arènes','Choisir duel, escarmouche, espionnage, guerre puis intrigue sur essais distincts.','Cadre et mode changent ; zones abstraites conservées, pas de conversion métrique.'],
    ['03','Mode Architecte','Engager l’équipe militaire préparée et perdre une unité.','Atout militaire ciblé ; le commandant ne reçoit pas de blessure automatiquement.'],
    ['01','Atout sur le Parvis','Déplacer vers une voisine puis tenter une zone non adjacente.','Lien réciproque requis ; déplacement refusé s’il n’existe pas.'],
    ['03','Atouts tangibles/intangibles','Neutraliser le tangible, détruire l’intangible puis changer de scène.','Tangibles permanents réactivés, temporaires retirés, intangible détruit ne se récupère pas.'],
    ['01','Maison Vaëlan remplie','Créer/ouvrir sa fiche HTML puis changer une rubrique sur copie.','Nom/monde/type/domaines/rôles/ennemis répercutés au module ; fiche de Maison fait foi.'],
    ['01','Maison mineure et trois présents','Fixer la Menace de début de séance à 3.','Clic remplace la réserve ; ouvrir le pupitre seul ne modifie pas la Menace.'],
    ['03','Variante Grande Maison','Avec trois présents, fixer la Menace puis ajuster explicitement.','Base 9, ajustement du MJ visible ; aucune modification de l’enquête 01.'],
    ['01','Joueurs existants p-1/p-2/p-3','Importer les trois archives telle quelle.','Profils et anciens PJ conservés ; quinze nouveaux PJ de ces seules campagnes.'],
    ['01','Trois tablettes 360/768/1180','Choisir chacun son PJ, ouvrir le HTML et lancer un test.','Bonne fiche, maximes/spécialisations visibles et jets reçus au MJ.'],
    ['01','Marqueur de secrets de séance','Inspecter les messages joueur.','Aucun SECRET_MJ_DUNE_RECETTE attendu ; défaut GM-05 connu à consigner si reçu.'],
    ['01','Atlas et indices','Suivre les huit lieux, douze indices et liens de PNJ.','Révélations explicites et liens valides ; seul I01 révélé au départ.'],
    ['01','Trame','Parcourir les trois issues et quatre séances prévues.','Scènes liées, ateliers hors fiction distincts ; aucun indice essentiel sur un jet unique.'],
    ['01','Butin 101 Solari','Partager 33 par PJ et garder le reliquat.','Total 101 conservé, reste 2 ; distribuer un objet ne lui crée pas un bonus automatique.'],
    ['01','Wiki/Chronologie','Ouvrir neuf pages et quatre repères.','Liens corrects ; dates ISO fictives, pas calendrier impérial affirmé.'],
    ['01','Sound/Music/Storyboard','Écouter les trois sons, deux pistes et quatre moments puis arrêter.','Médias embarqués, aucun son commercial ou service externe requis.'],
    ['01','Light-OS','Assigner des appareils de test après lecture des trois tuiles.','Aucun appareil inventé ; états vides au départ, matériel pas déclaré testé.'],
    ['Tables','Table-OS Atelier','Importer les trois JSON dans un univers de recette et Ranger tel quel.','Trois tables 1d6 originales, bornes 1–6 ; aucun remplacement des règles de complication.'],
    ['02/03','Laboratoire altéré','Réimporter seulement le laboratoire avec Remplacer.','Réinitialisation locale ; Maison, fiches et plateau de l’enquête intacts.'],
    ['01','Après modification','Exporter puis Cloner et suivre les liens.','Références cohérentes ; original intact et profils existants conservés.'],
    ['Toutes','Clôture de séance','Couper les accès, recharger et rouvrir la campagne.','Module et fiches persistés ; droits fermés, pas de dépense rejouée.'],
    ['Toutes','Après chaque essai','Remplir resultats.csv avec observé et preuve.','PASSÉ, ÉCHEC, NON TESTÉ ou NON APPLICABLE ; aucune case prévalidée.'],
];
export const casDune=lignes.map(([archive,precondition,action,attendu],i)=>({id:`DU-${String(i+1).padStart(2,'0')}`,archive,precondition,action,attendu}));
const csv=s=>'"'+String(s).replaceAll('"','""')+'"',cell=s=>String(s).replaceAll('|','\\|');
export function ecrireRecetteDune(sortie,{scenario,archives,rattachement}){
    const ecrire=(nom,texte)=>fs.writeFileSync(path.join(sortie,nom),texte.trimEnd()+'\n');
    ecrire('LIRE-MOI.md',`# Dune — ${titreDune}

**Bibliothèque → Importer un bundle Nexus → 01-Le-Sceau-de-Nereide.gmos → Importer telle quelle.** Aucun rechargement nécessaire. Pilote **Dune 2.0.0** fourni ; Nexus conserve un pilote existant du même identifiant, son remplacement reste explicite si nécessaire.

| Joueur existant | PJ | Rôle |
| --- | --- | --- |
${herosDune.map((h,i)=>`| ${h.joueur} (${rattachement.joueurs[i].id}) | ${h.nom} | ${h.metier} |`).join('\n')}

Seuls noms/identifiants issus de \`${rattachement.source}\` sont repris. Anciens profils, avatars et PJ conservés. Trois PJ principaux et douze de laboratoire : **15 nouveaux personnages**, pas de joueurs homonymes créés.

## Maison et module déjà préparés

**Maison Vaëlan**, Maison mineure de **Néréide**, monde et famille fictifs : devise, armoiries documentaires, domaines, rôles et ennemis déjà remplis sur la fiche de Maison. Ouvrir **Cockpit → Maison** ; au premier usage, **Créer une fiche pour Maison** raccorde le modèle HTML aux données existantes. La fiche fait foi ; le module en reprend le reflet. Les armoiries sont un SVG original embarqué.

Le module existant **Dune : conflits et Maison** suffit : cinq zones, six atouts, liens réciproques, dispositions, désirs privés, une zone et un atout cachés. Séance active → Modules du jeu → Ouvrir le pupitre → autoriser les PJ voulus. Les joueurs consultent le plateau ; le MJ seul le commande. **MODULES-ET-MAISON.md** décrit le parcours d’enquête et les cinq arènes. Aucun nouveau module nécessaire.

## Fiction et laboratoires

Une fraude aux concessions place la Maison entre la pénurie et une vente forcée. **Preuves, accord avec Nalia ou remise en service** offrent trois issues. 12 PNJ, 8 lieux, 12 indices, 16 scènes / 4 actes, 3 rencontres, 4 séances, 9 pages Wiki et 8 lots de butin. Aucun indice essentiel bloqué par une seule réussite.

- **02-Principes-Defaite-et-Progression.gmos** : neuf PJ P01–P09, Détermination 0/3, principe bafoué/récupéré, cibles mineure/notable vaincues, progression disponible.
- **03-Conflits-et-Maison.gmos** : trois PJ C01–C03, plateau physique abstrait, équipe militaire, variante **Grande Maison**, Impulsion 6 et Menace 9. Changer arène/mode pour les essais. Les deux laboratoires se réinitialisent avec **Remplacer**, sans modifier l’enquête.

Valeurs choisies pour isoler les tests, sans revendiquer un budget de création novice. **Talents non préconfigurés** : aucun effet de talent supposé ; en ajouter après vérification du livre pour tester leurs exceptions. Maximes, spécialisations et atouts sont remplis. Aucune réserve de PV : défaite en tâche étendue et traits, jamais mort automatique. Atouts personnels et partagés sont des représentations distinctes ; aucun effet transféré automatiquement à la distribution d’un objet.

**${casDune.length} essais manuels**, tous NON TESTÉS par David : cahier, JSON et CSV vierge. 36 SVG documentaires et trois WAV synthétiques de 4 s ; Storyboard, sons, musique et lumières sans appareil. Trois tables 1d6 originales dans **tables-a-importer/** : import séparé **Table-OS → Atelier → Ranger tel quel**, univers de recette. Les tables globales ne voyagent pas dans Nexus. Aucun compte, lampe ou service externe inventé.

Voir rapports et ANOMALIES-CONNUES.md : **GM-05, secrets de séance diffusés**, reste un défaut transversal de l’application ; les tests doivent le conserver en échec s’il persiste.
`);
    ecrire('MODULES-ET-MAISON.md',`# Parcours du module Dune et de la Maison

1. Importer 01, vérifier Maison Vaëlan et les trois PJ. Activer une séance puis ouvrir le pupitre. La Maison est **mineure**, Menace initiale préparée **3** pour les trois joueurs et Impulsion **2** ; l’ouverture du module ne doit pas réinitialiser ces réserves. Le bouton Début de séance propose explicitement la Menace, selon le nombre réellement présent (saisir **3**, le formulaire peut ouvrir sur 4).
2. L’intrigue est en mode **Architecte**, scène S08. Zones visibles : ateliers du Parvis, Nalia, commission, réseau de Ravel. Réserve cachée et avance privée absentes des tablettes. La proximité est un lien abstrait, pas des mètres.
3. Pour découvrir le désir de **Nalia**, résoudre réellement un test d’enquête puis appliquer Analyse **6** : progression **4/6**, désir encore caché. Second succès : **8/6**, désir révélé. Pour une recette contrôlée, on peut reporter deux succès explicitement ; ne pas prétendre les avoir tirés. Le texte révélé permet de proposer une garantie de paiement aux ouvriers.
4. Déplacer **Copie du registre** du Parvis vers Nalia, puis la commission ; un saut sans lien doit être refusé. Le mouvement ne paie pas à lui seul un test, une rétention ou une dépense : résoudre ces étapes au panneau/bandeau.
5. Dans 03, le plateau a des zones physiques de recette : Quai, Passerelle, Vanne centrale, Cour et Local masqué. **Duel/Agent** : opposer deux protagonistes sur les positions retenues ; **Escarmouche/Agent** : protéger le passage ; **Espionnage/Agent** : copier le paquet au relais ; **Guerre/Architecte** : employer l’équipe militaire pour tenir le service ; **Intrigue/Architecte** : revenir plutôt à 01 pour les factions et désirs. Les cinq cadres sont ceux du même module, sans module supplémentaire.
6. Neutraliser un atout tangible permanent, détruire un intangible, changer de scène avec un nom inédit. Temporaires supprimés, tangible permanent réactivé ; intangible détruit ne se récupère pas. Réimporter 03 avec Remplacer pour recommencer.
7. Ouvrir la fiche HTML de Maison. Nom, monde, type, domaines, rôles et ennemis font foi. Modifier une rubrique sur une copie puis ouvrir le module : reflet actualisé. Alliés et atouts de Maison se renseignent au module. Dans 03, Grande Maison × 3 présents = Menace **9**, avant ajustement MJ.
8. Fermer la séance, recharger et rouvrir : accès fermés ; Maison, plateau, fiches et bilans conservés. Garder les essais destructifs dans les laboratoires.
`);
    ecrire('SCENARIO.md',`# ${titreDune}

Monde et Maisons inventés pour la recette, sans modifier la chronologie officielle de Dune. Ravel finance une dérivation et falsifie un ordre pour provoquer un défaut de livraison puis acheter la concession. Nalia veut faire payer ses ouvriers et peut le désavouer. Jarek protège le dépôt sous contrat ; il acceptera une garantie écrite. Une réparation seule sauve les habitants, une preuve seule suspend la vente, un accord peut obtenir les deux.

${herosDune.map(h=>`## ${h.nom} — ${h.joueur}\n\n${h.histoire}\n\nMotivation : ${h.motivation}`).join('\n\n')}

## Chaînes de preuves et repli

I02/I03 montrent le manque réel, I04/I08 l’antidatage, I09/I12 le financement. I05/I07 permettent de stopper le détour sans couper le service. Donner la preuve après un échec avec une conséquence explicite de temps, confiance ou surveillance ; ne pas supprimer la seule piste. Les atouts du module représentent les moyens disponibles, pas une résolution déjà jouée.

${scenesDune.map(s=>`## ${s[2]}\n\n${s[6]}\n\n${s[4].map(x=>pnjDune.find(p=>p[0]===x)).map(p=>`**${p[1]}** : « ${p[5]} » Secret MJ : ${p[6]}`).join('\n\n')}\n\nSuite : ${s[7].join(', ')||'bilan et export'}.`).join('\n\n')}

## Dénouements

Expertise contradictoire : remettre le registre, le paquet et l’avance à Hélo, qui suspend la vente. Accord : Nalia garantit le service contre une caution publique et désavoue Ravel. Réparation : isoler la vanne puis maintenir le circuit des quartiers avec Orun et la garde ; la négociation continue en position moins fragile. Aucun duel ni guerre obligatoire. Terminer l’aventure et décider de la progression, puis ouvrir l’atelier hors fiction.
`);
    ecrire('CAHIER-DE-RECETTE.md',`# ${casDune.length} essais Dune — NON TESTÉS par David

Sources : pilote 2.0.0 ; manuel 54-Jeu-Dune.md ; moteurs duneRegles/conflitsDeDune ; livre français et errata 1.1 déjà audités le 25/10. Les laboratoires sont choisis pour les états de test, pas des événements joués. Réinitialiser par Remplacer entre essais indépendants.

| Cas | Archive | Précondition | Action | Attendu |
| --- | --- | --- | --- | --- |
${casDune.map(c=>'| '+[c.id,c.archive,c.precondition,c.action,c.attendu].map(cell).join(' | ')+' |').join('\n')}`);
    ecrire('cas-de-recette.json',JSON.stringify(casDune,null,2));ecrire('resultats.csv','"cas";"archive";"precondition";"action";"attendu";"statut";"observe";"preuve"\n'+casDune.map(c=>[c.id,c.archive,c.precondition,c.action,c.attendu,'NON TESTÉ','',''].map(csv).join(';')).join('\n'));
    fs.mkdirSync(path.join(sortie,'tables-a-importer'),{recursive:true});
    for(const [i,[genre,textes]]of [['rumeurs',['Le sceau a été apposé deux fois.','Les ateliers tiennent leur propre carnet.','Un relais conserve les paquets refusés.','La rivale cherche une caution.','Les gardes suivent un contrat écrit.','L’acheteur a déjà versé une avance.']],['incidents',['Un témoin demande une garantie.','Une citerne bloque le quai.','L’audience est avancée dans la fiction.','Un message attend une authentification.','Une équipe refuse de couper le service.','Un intermédiaire propose un accord.']],['objets',['Copie de contrat','Sceau de cire','Solari fictifs','Clef de vanne','Carnet de service','Trousse de maintenance']]].entries())ecrire(`tables-a-importer/${i+1}-${genre}.json`,JSON.stringify({name:`RECETTE Néréide — ${genre}`,dice:'1d6',entries:textes.map((texte,n)=>({min:n+1,max:n+1,title:texte,description:'Fiction originale de recette, sans effet mécanique automatique.',...(genre==='objets'?{butin:[{name:texte,type:n===2?'currency':'item',quantite:n===2?7:1,rarity:'common',weight:0,value:0,description:'Aucun atout automatique à la distribution.'}]}:{})}))},null,2));
    ecrire('CONTENU.json',JSON.stringify({archives,joueurs:scenario.players.map(p=>({id:p.id,nom:p.realName,pj:p.characters[0].name})),maison:scenario.campaign.groupe.sheetData['house.name'],casManuels:casDune.length},null,2));return casDune;
}
