import fs from 'node:fs';
import path from 'node:path';
import { titreRdd, herosRdd, scenesRdd, pnjRdd } from './rdd-scenario.mjs';
import './charger-typescript.mjs';
const { NOM_DES_TERRES, rencontreDuD100 } = await import('../../src/modules/dice/systemes/hautReve.ts');
const lignes = [
    ['01','Trois fiches neuves','Comparer les caractéristiques et valeurs dérivées à la lecture R0.','Mêlée, Tir, Lancer, Dérobée, Vie, Endurance, SC, SUST, ENC et dommages cohérents.'],
    ['01','Rêve et seuil indépendants','Modifier le seuil sur une copie puis recalculer.','La caractéristique RÊVE et le rêve courant ne sont pas écrasés par le seuil.'],
    ['01','Jet caractéristique + compétence','Composer Vue/Vigilance à ajustement 0 puis négatif.','Probabilité et cinq degrés lisibles ; jet reçu au poste MJ.'],
    ['01','Jet du pilote','Comparer réussite normale, significative, particulière et échecs avec les bornes affichées.','Le degré suit le d100 et le moteur RdD, sans double coût.'],
    ['02','B01 fatigue 20','Lire l’état général puis lancer une action concernée.','Malus issus du segment de fatigue, pas une pénalité inventée.'],
    ['02','B02 Endurance 0','Ouvrir le suivi de santé puis récupération.','Inconscient, pas mort ; Vie et Endurance distinctes.'],
    ['02','B03 une blessure légère','Appliquer premiers soins puis soins complets.','Points de soins, malus, durée et opérant conservés ; pas de guérison instantanée.'],
    ['02','B04 une blessure grave','Comparer les soins et le passage du temps.','Échéances explicites et bonus de guérison selon le moteur.'],
    ['02','B05 Vie 0 et critique','Inspecter l’état puis tester le jet de Vie sur une copie.','Coma, pas décès automatique ; SC et échéances visibles.'],
    ['02','Copie saine','Appliquer un encaissement, une protection puis un coup non mortel sur copies.','Blessure, Vie, Endurance et fatigue reflètent le barème affiché.'],
    ['02','Perte d’Endurance en round','Appliquer deux pertes puis résoudre le jet requis.','Le cumul du round est traité une fois ; ouvrir le panneau ne relance pas.'],
    ['02','Sonné','Avancer un round confirmé.','Durée suivie par rounds décidés, sans horloge réelle.'],
    ['02','B09 récupération','Prévisualiser puis valider une récupération d’Endurance.','La récupération ne supprime pas les blessures ni tous les points de fatigue.'],
    ['02','B08 réserves à 1','Valider nourriture, eau et temps de voyage.','Consommation explicite, ressources persistées ; aucun débit au chargement.'],
    ['01','Scène S09','Créer une tâche de charpenterie, prévisualiser et appliquer deux étapes.','Seuil, progression, temps et circonstances conservés.'],
    ['01','Aperçu de tâche','Modifier la fiche entre aperçu et validation.','Aperçu périmé refusé ; un même reçu ne s’applique pas deux fois.'],
    ['02','B09 fatigue 4','Préparer repos puis sommeil selon les conditions réellement choisies.','Temps explicite ; récupération, rêve et suivi de journée distincts.'],
    ['02','B03 blessure soignée','Avancer une journée de guérison.','Jet de guérison lié à la blessure et échéance, sans doublon de journée.'],
    ['02','B07 moral −3','Ouvrir le Moral, résoudre un événement puis une modification.','Le moral reste séparé de la fatigue et du stress ; reçu unique.'],
    ['01','Expérience disponible après essai','Noter une particulière à ajustement négatif puis distribuer les points.','Séparer caractéristique, compétence, voie et sort ; pas de récompense au simple chargement.'],
    ['01','Apprentissage','Créer un exercice ou une leçon et examiner les conditions.','Seuil, coût, temps et niveau vérifiés avant validation.'],
    ['02','B06 chance 1','Employer la Chance sur une action autorisée puis réessayer la même opération.','Un débit, un reçu ; interdictions propres à l’action respectées.'],
    ['02','B06 destinée 1','Employer la Destinée dans le cas autorisé sur copie.','Chance et Destinée distinctes ; usage non répété par réouverture.'],
    ['01','Heures de naissance renseignées','Préparer un jour astrologique, nombre et heure.','Douze heures, lecture des circonstances ; pas d’assimilation des dates ISO au calendrier du jeu.'],
    ['01','Rencontre R01','Ajouter les PJ puis tester initiative, attaque, défense et protection.','Combat optionnel ; Vie et Endurance restent raccordées aux fiches.'],
    ['01','Arme sans profil validé','Vérifier les valeurs avant le jet.','Aucun dégât d’arme déduit du seul nom d’inventaire.'],
    ['03','T01 rêve 1','Prévisualiser une montée normale puis accélérée sur copies.','Prix 1/2 rêve et 1 fatigue, insuffisance refusée ; rien débité à l’aperçu.'],
    ['03','T02 refoulement 2','Refouler une rencontre imposée avec un d20 connu.','Coût de la rencontre ajouté avant le test ; souffle si d20 inférieur ou égal.'],
    ['03','T03 rêve 20','Maîtriser une Fleur puis un Rêve de Dragon sur copies.','Gains selon la force ; triple du seuil, éclatement et effets suivent le moteur.'],
    ['01','Sort Tympan d’Hypnos renseigné','Ouvrir le haut-rêve depuis la fiche, préparer le jet sur J4.','Voie Hypnos, difficulté −5, coût 2, bonus de case distinct ; cibles arbitrées par le gardien.'],
    ['03','Sort de laboratoire','Comparer coût d’un succès, particulière, échec et échec total.','Coût 2 / 1 / 0 / 3 pour le sort de coût 2, avant autres circonstances.'],
    ['03','Réserve de sort','Mettre un sort en réserve avec sa case puis le déclencher.','Limite, coût et case conservés ; une note de module seule ne débite pas un sort.'],
    ['03','Case humide','Préparer une maîtrise de force 7 sur terrain humide.','Maîtrise de case distincte du jet de rencontre.'],
    ['03','Reflet ou Tourbillon','Échouer une maîtrise puis poursuivre la lutte.','Coût par round, dérive et sortie selon la rencontre ; pas de dérobade après emprisonnement.'],
    ['03','Effet en attente','Tirer une Queue, un Souffle puis une Tête sur copies.','Table, source, refoulabilité et précision gardées ; aucun effet actif inventé au départ.'],
    ['03','Résistance et magie','Préparer un sort nécessitant une résistance puis arbitrer.','Jet et conséquence séparés ; pas de réussite imposée par le module cartographique.'],
    ['01','Module fermé aux joueurs','Activer la séance, ouvrir le pupitre TMR, autoriser Liseron seulement.','Un accès explicite par personnage ; les deux autres restent fermés.'],
    ['01','Carte TMR','Ouvrir l’image officielle depuis le module et examiner G4/J4/D13.','Image couleur 900 × 1000 ; 189 cases ; pas le plan du village.'],
    ['01','Trois joueurs connectés','Ouvrir les TMR pour chacun puis inspecter les messages reçus.','Un seul demi-rêve par lecteur ; aucune préparation MJ ni données des autres voyageurs.'],
    ['01','Liseron G4, rêve 12, fatigue 0','Demander la montée ; prévisualiser puis débiter depuis le pupitre.','Rêve 11, fatigue 1 ; reçu durable unique et demi-rêve présent.'],
    ['01','Liseron présent sur G4','Choisir H4, demander le déplacement et valider le raccord.','H4, rêve 11, fatigue 2 ; seules les cases voisines acceptées.'],
    ['01','Demande en attente','Envoyer la même intention ou ouvrir le pupitre deux fois.','Pas de double débit ni de double progression.'],
    ['01','Aperçu du raccord','Modifier la fatigue avant la validation.','Fiche changée détectée ; refaire l’aperçu ; aucun débit sur données périmées.'],
    ['01','Voyageur en TMR','Rester un round puis descendre.','Séjour : 1 fatigue ; descente : 0 rêve et 0 fatigue.'],
    ['01','Rencontre de Table-OS','Tirer selon le genre de la case puis publier le texte au bon PJ.','Résultat remis au seul voyageur ; préparer n’est pas publier.'],
    ['01','Rencontre publiée','Tenter de déplacer avant résolution ; terminer la rencontre puis reprendre.','Déplacement bloqué pendant la rencontre, ouvert après résolution explicite.'],
    ['03','Module TMR et fiche','Comparer coût du raccord et panneau de haut-rêve.','Ne pas payer deux fois un même trajet ; le module ne résout pas automatiquement la maîtrise.'],
    ['01','Contexte fermé','Clore la séance ou couper tous les accès.','Accès révoqués, voyage interrompu, position conservée.'],
    ['01','Après trajet payé','Recharger le profil de recette puis rouvrir le module.','Coûts et reçus persistés, pas de second débit ; position conservée.'],
    ['03','Laboratoire TMR','Exporter puis réimporter ce laboratoire avec Remplacer.','Demandes et effets de voyage arrêtés ; cartes et préparations conservées.'],
    ['Table-OS','Univers de recette vierge','Importer les 14 JSON dans Atelier → Ranger tel quel.','14 terrains, chaque table couvre 1–100 sans trou ni chevauchement.'],
    ['Table-OS','Cité ou sanctuaire','Comparer d100 25/26, 50/51, 97/98.','Bornes du moteur : Messager/Passeur, Passeur/Fleur, Tourbillon noir/Rêve de Dragon.'],
    ['Table-OS','Autres terrains','Comparer chaque borne et son voisin avec le panneau du haut-rêve.','Les sept colonnes du livre sont conservées, aucun tirage de rencontre si le d7 ne la demande pas.'],
    ['Table-OS','Résultat de rencontre','Consulter force et maîtrise puis jeter la force séparément.','La table d100 ne lance pas la force et n’écrit aucun effet sur la fiche.'],
    ['01','Import Nexus','Importer telle quelle avec p-1/p-2/p-3 déjà existants.','Profils, avatars et anciens PJ conservés ; trois nouveaux PJ de cette enquête.'],
    ['02','Fiche modifiée en 01','Réimporter 02 avec Remplacer.','Laboratoire remis à zéro ; enquête et autres campagnes préservées.'],
    ['01','Cloner l’archive','Importer avec Cloner puis ouvrir les TMR.','Identifiants des voyageurs remappés vers les PJ clonés.'],
    ['01','Trois tablettes 360/768/1180 px','Choisir chacun son PJ, lancer un jet et ouvrir les cinq pages HTML.','Bon joueur, valeurs raccordées, caractères accentués lisibles ; aucun partage de PJ.'],
    ['01','Atlas','Ouvrir huit lieux et suivre liens vers PNJ et voisins.','Liens résolus ; statut visité et visibilité indépendants.'],
    ['01','Indices','Révéler I04 au groupe puis retirer la révélation.','Contenu public synchronisé au bon moment, propriétaire et lieu conservés.'],
    ['01','Secrets de séance fictifs','Inspecter les messages reçus par un joueur.','Aucun SECRET_MJ_RDD_RECETTE ; GM-05 est un défaut connu à retester, pas un succès présumé.'],
    ['01','Storyboard','Projeter les quatre moments, changer de carte puis arrêter.','Bon plan et titre ; aucune piste audio lancée à l’import.'],
    ['01','Sons et musique','Écouter les trois sons et deux pistes locales, régler puis arrêter.','Fichiers embarqués ; sons synthétiques de 4 s, sans accès distant.'],
    ['01','Trois scènes lumineuses','Choisir des lampes de test et préparer une scène manuellement.','États matériels vides au départ ; aucun identifiant de lampe inventé.'],
    ['01','Butin 101 deniers','Distribuer 33 à chaque PJ et garder le reliquat.','99 distribués, 2 restants ; historique et inventaire cohérents.'],
    ['01','Objets et réserve','Transférer un objet, refuser un autre puis réexporter.','Quantité conservée ; pas d’effet magique attribué au seul nom.'],
    ['01','Trame et séances','Parcourir les branches, déplacer une scène puis préparer la séance suivante.','Liens conservés ; états achevés et scènes prévues indépendants.'],
    ['01','Nexus Wiki et Chronologie','Ouvrir neuf pages et quatre repères.','Dates de tri clairement fictives ; liens vers les bons PNJ.'],
    ['01','Bilan','Exporter la campagne modifiée, rouvrir dans un profil de recette.','Médias, fiches, états TMR et autres campagnes conservés ; remplir resultats.csv.'],
];
export const casRdd=lignes.map(([archive,precondition,action,attendu],i)=>({id:`RDD-${String(i+1).padStart(2,'0')}`,archive,precondition,action,attendu}));
export function tablesTmr(){return Object.entries(NOM_DES_TERRES).map(([genre,nom])=>{const entries=[];for(let n=1;n<=100;n++){const r=rencontreDuD100(genre,n),dernier=entries.at(-1);if(dernier?.rencontreId===r.id)dernier.max=n;else entries.push({min:n,max:n,title:r.nom,description:`Force ${r.force}. Maîtrisée : ${r.maitrisee} Non maîtrisée : ${r.nonMaitrisee} Refoulement : ${r.refoulement}.`,rencontreId:r.id});}return {genre,name:`TMR — ${nom}`,dice:'1d100',source:'Livre du Haut-Rêve 2.3.1 p. 183 ; moteur GM-OS hautReve.ts relu le 24/10/2026',entries};});}
const csv=s=>'"'+String(s).replaceAll('"','""')+'"',cell=s=>String(s).replaceAll('|','\\|');
export function ecrireRecetteRdd(sortie,{scenario,archives,rattachement}){
    const ecrire=(nom,texte)=>fs.writeFileSync(path.join(sortie,nom),texte.trimEnd()+'\n');
    fs.mkdirSync(path.join(sortie,'tables-a-importer'),{recursive:true});
    for(const t of tablesTmr())ecrire(`tables-a-importer/TMR-${t.genre}.json`,JSON.stringify(t,null,2));
    ecrire('LIRE-MOI.md',`# Rêve de Dragon — ${titreRdd}

**Bibliothèque des campagnes → Importer un bundle Nexus → 01-Le-Moulin-des-heures-oubliees.gmos → Importer telle quelle.** Aucun rechargement de l’application nécessaire. Vérifier le pilote **2.0.0**, fourni à côté des archives ; un pilote existant de même ID est conservé par Nexus, son remplacement reste explicite.

Thomas D. **p-1** reçoit **Liseron des Gués** ; Marie C. **p-2**, **Ambre des Saules** ; Lucas R. **p-3**, **Oriel Trois-Ponts**. Identifiants repris de \`${rattachement.source}\` ; aucun ancien personnage ni contenu de campagne recopié. Les profils et anciens PJ restent conservés.

Les trois sont des haut-rêvants avancés aux valeurs choisies pour la recette, avec Vie/Endurance saines, rêve courant **12**, fatigue **0**, seuil indépendant et Tympan d’Hypnos renseigné (Hypnos, J4, −5, coût 2). Les valeurs ne prétendent pas respecter un budget de création novice. Les PNJ ont des profils d’essai, sans reproduction d’un bestiaire officiel.

## Deux usages des TMR, comme demandé

1. **Module Terres Médianes du Rêve** déjà existant, déclaré par le pilote et embarqué dans les trois archives. Sa **carte officielle couleur** est fournie par GM-OS. Demi-rêves préparés : Liseron **G4**, Ambre **J4**, Oriel **D13**. Aucun voyage engagé, demande en attente, sort réservé ou effet de Dragon actif au chargement. Ouvrir une séance, **Modules du jeu → Ouvrir le pupitre**, puis autoriser les personnages. La préparation MJ reste privée ; chaque joueur voit son seul demi-rêve.
2. **Table-OS : 14 JSON** dans **tables-a-importer/**, un par genre de terrain. Dans un **univers de recette** : **Table-OS → Atelier → Ranger tel quel**, importer/coller chaque JSON. Ces tables globales ne sont pas importées par Nexus. Elles reprennent les bornes d100, noms, forces et indications du moteur RdD (livre 2.3.1, p. 183), sans inventer une table de rencontres. Le d7 décide d’abord si une rencontre a lieu ; le d100 ne tire pas la force.

Le parcours prêt à suivre est dans **PARCOURS-TMR.md**. La carte Atlas du village et les TMR sont deux espaces distincts. Il n’est pas nécessaire de créer un module supplémentaire.

## Contenu et réinitialisation

Enquête : **3 PJ, 12 PNJ, 8 lieux, 12 indices, 16 scènes / 4 actes, 3 rencontres préparées, 4 séances, 9 pages Wiki, 8 lots de butin**. Trois voies de résolution : accord, réparation, retour à pied. Aucun indice essentiel bloqué derrière un jet.

- **02-Corps-Repos-et-Progression.gmos** : neuf PJ B01–B09, fatigue, inconscience, trois gravités de blessure, coma, chance, moral et réserves basses.
- **03-Haut-Reve-et-TMR.gmos** : trois PJ T01 rêve 1, T02 refoulement 2, T03 rêve 20 ; trois demi-rêves indépendants. Aucun effet dangereux lancé automatiquement.

Importer seulement le laboratoire utile et choisir **Remplacer** pour le remettre à zéro après un essai ; l’enquête reste distincte. Les trois archives ajoutent **15 nouveaux PJ** au total aux trois mêmes joueurs.

**${casRdd.length} cas manuels** dans CAHIER-DE-RECETTE.md / cas-de-recette.json / resultats.csv, tous NON TESTÉS pour David. Storyboard, Atlas, indices, sons, musique, lumières et butin sont préparés. **36 SVG documentaires et trois WAV synthétiques**, pas des portraits photoréalistes. Les lampes, comptes, IA/TTS et périphériques physiques se configurent sur le poste ; aucun appareil inventé. Aucun code applicatif modifié.

Les rapports de vérification et anomalies connues distinguent contrôles automatisés et essais manuels ; GM-05, défaut transversal des secrets de séance, reste à corriger dans l’application.
`);
    ecrire('PARCOURS-TMR.md',`# Parcours guidé — carte officielle et Table-OS

1. Importer 01 et activer la première séance. MJ : Modules du jeu, ouvrir le pupitre TMR, autoriser Liseron/Thomas. Joueur : Hub → Modules du jeu → Ouvrir Terres Médianes du Rêve. Vérifier la carte couleur, G4 et l’absence des deux autres demi-rêves.
2. Liseron demande la montée normale. MJ : Prévisualiser le coût sur la fiche, contrôler concentration/round/barème puis Débiter la fiche et valider le trajet. **Rêve 12 → 11 ; fatigue 0 → 1.** Un aperçu ne paie rien.
3. Résoudre le d7 de rencontre. Pour un essai contrôlé, choisir 7 puis d100 **25** au sanctuaire : **Messager des rêves, force 2d4** ; 26 donne Passeur. Tirer la force séparément. Dans la fiche, panneau de Haut-Rêve : résoudre la rencontre ; dans le module, publier seulement le texte voulu à Liseron. Un résultat Table-OS n’écrit pas seul les conséquences.
4. Terminer explicitement la rencontre. Choisir **H4**, demander le déplacement, prévisualiser et valider : **rêve 11 ; fatigue 2**. Vérifier que H4 est voisine de G4 et qu’un saut plus loin est refusé. Déterminer le terrain réel de H4 et employer la table correspondante.
5. Rester un round coûte 1 fatigue ; descendre ne coûte ni rêve ni fatigue. Ne pas ajouter une seconde fois le prix d’un trajet déjà payé par le raccord. Les maîtrises, sorts et effets du haut-rêve sont des opérations distinctes dans la fiche.
6. Autoriser Ambre sur **J4 (collines)** puis Oriel sur **D13 (cité)**. Chaque joueur conserve position, rencontre et journal propres. Les préparations SECRET_MODULE_RDD ne doivent jamais arriver aux tablettes. Vérifier trois formats 360/768/1180 px.
7. Un terrain humide (fleuve/lac/marais) exige sa maîtrise de force 7 en plus des rencontres ; l’aperçu du raccord le rappelle. Employer 03 pour les essais de rêve insuffisant, refoulement et effets de Dragon.
8. Fermer les accès et recharger le profil de recette : position et reçus persistés, aucun double débit. Réimporter **03 avec Remplacer** pour recommencer, puis vérifier que 01 n’a pas changé.

La carte officielle reste celle du module GM-OS : outils/reve-de-dragon/tmr/images/carte-officielle.jpg (900 × 1000 ; crédits dans outils/reve-de-dragon/tmr/CREDITS.md). Elle n’est pas redessinée ni recopiée dans ce lot. Les 14 tables se régénèrent directement depuis hautReve.ts ; les sept colonnes partagées couvrent les quatorze terrains.
`);
    ecrire('SCENARIO.md',`# ${titreRdd}

## Pour le gardien

Céleste a fixé un rappel pour sauver douze voyageurs. La roue sans eau maintient leur route mais retient le même matin. Elle veut une sortie libre avant de relâcher le mécanisme. Aucun méchant obligatoire : Arden croit protéger, Vianne veut réparer, Aude connaît un chemin à pied.

Les preuves redondantes sont la lettre I01, les plans I05/I09 et l’accord I11. I04 retrouve les disparus ; I07 les rejoint ; I12 offre un repli physique. Révéler une preuve après un échec avec une conséquence de temps, de confiance ou de fatigue explicitement arbitrée. L’acte IV est un atelier de tests hors fiction.

## Voyageurs

${herosRdd.map(h=>`- **${h.nom} / ${h.joueur}** : ${h.histoire} Motivation : ${h.motivation}`).join('\n')}

## Scènes et issues

${scenesRdd.map(s=>`### ${s[2]}\n\n${s[6]}\n\nRépliques : ${s[4].map(id=>pnjRdd.find(p=>p[0]===id)).map(p=>`${p[1]} : « ${p[5]} »`).join(' ')}\n\nSuite : ${s[7].join(', ')||'bilan'}.`).join('\n\n')}

## Fin de campagne

Accord : choisir qui revient et rouvrir le rappel après leur passage. Réparation : préparer une tâche de charpenterie, contrepoids puis frein, avec Vianne en aide. Détour : escorter par le sentier d’Aude et le bief. Aucun jet unique ni réussite magique obligatoire. Distribuer les biens ordinaires, consigner les choix au journal, puis passer aux laboratoires pour les essais destructifs.
`);
    ecrire('CAHIER-DE-RECETTE.md',`# ${casRdd.length} essais RdD — NON TESTÉS par David

Archives 01/02/03 indépendantes. Lire les préconditions avant chaque essai et réinitialiser le laboratoire par Remplacer. Les résultats aléatoires s’observent ; les cas imposés se saisissent uniquement dans les panneaux qui le permettent.

| Cas | Archive | Précondition | Action | Attendu |
| --- | --- | --- | --- | --- |
${casRdd.map(c=>[c.id,c.archive,c.precondition,c.action,c.attendu].map(cell).join(' | ')).map(s=>'| '+s+' |').join('\n')}`);
    ecrire('cas-de-recette.json',JSON.stringify(casRdd,null,2));
    ecrire('resultats.csv','"cas";"archive";"precondition";"action";"attendu";"statut";"observe";"preuve"\n'+casRdd.map(c=>[c.id,c.archive,c.precondition,c.action,c.attendu,'NON TESTÉ','',''].map(csv).join(';')).join('\n'));
    ecrire('CONTENU.json',JSON.stringify({archives,joueurs:scenario.players.map(p=>({id:p.id,nom:p.realName,pj:p.characters[0].name})),tables:tablesTmr().map(t=>({terrain:t.genre,nom:t.name,entrees:t.entries.length}))},null,2));
    return casRdd;
}
