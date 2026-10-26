import fs from 'node:fs';
import path from 'node:path';
import {titreNephilim,herosNephilim,scenesNephilim,pnjNephilim} from './nephilim-scenario.mjs';
const lignes=[
    ['01','Vécu 4 et Ka 4','Composer le jet puis comparer avec approche vide.','80 % avec Ka, 40 % sans ; la somme des degrés est multipliée par dix.'],
    ['01','Jet au-delà de dix degrés','Ajouter une circonstance autorisée puis comparer la marge.','Chances au-delà de 100 possibles ; degrés au-delà de dix ajoutés à la marge.'],
    ['01','D100 naturel','Observer doubles réussis/ratés et 00 au cours des essais.','Double réussi critique, double raté maladresse, 00 toujours en échec ; ne pas truquer un tirage.'],
    ['01','Vécus présents et lignes vides','Ouvrir les menus puis le référentiel du Vécu passé.','Noms lisibles, liens vers les époques exactes ; ligne sans nom absente du jet.'],
    ['03','A01 Grand Secret nommé et A03 Œuvre rouge nommée','Comparer les options de troisième cercle avant/après effacement du nom sur copies.','Champ nommé proposé ; champ sans nom masqué. Aucun pouvoir officiel inventé sous ce nom de recette.'],
    ['02/03','Contextes du bandeau','Comparer Plexus Feu, Nexus et conjonction simple/grande.','Bonus et oppositions du moteur selon l’élément ; rien sans Ka au jet.'],
    ['02','S01 trois cases et Conséquence mineure','Comparer un jet physique puis non physique.','−2 au Vécu, minimum zéro, avant ajout du Ka ; pas de malus physique automatique sur toute action.'],
    ['02','S02 Conséquence magique sérieuse','Lancer un Art puis un Vécu.','−4 à l’Art ; la conséquence magique ne pénalise pas le métier du Simulacre.'],
    ['01','Santé saine','Proposer 2 degrés physiques puis choisir la case minimale suffisante.','Une case de valeur 2, pas deux cases de valeur 1 ; compte des cases mis à jour.'],
    ['02','S01','Proposer des dommages avec Conséquences et case restante.','Seulement les combinaisons suffisantes autorisées ; aucun choix appliqué à l’aperçu.'],
    ['01','Nahal Ka-Terre 6','Comparer cases physiques de bonus et piste magique.','Une case physique supplémentaire de 1 ouverte ; pas de case magique de bonus.'],
    ['02','Cases cochées et Conséquence','Confirmer cinq minutes de repos sur une piste.','Cases temporaires décochées ; Conséquence conservée.'],
    ['02','Conséquence cochée','Comparer durée physique et magique à Ka-Terre connu.','11 − Ka-Terre, unités de gravité distinctes ; pas de guérison au rechargement.'],
    ['02','S02 magique sérieuse, Stase 4','Transférer la Conséquence magique à la stase sur copie.','Coût en degrés appliqué une fois ; insuffisance signalée, pas de stase négative.'],
    ['02','Piste physique saturée sur copie','Proposer un dommage que rien n’absorbe.','Hors de combat proposé explicitement, jamais décès par simple case cochée.'],
    ['02','Piste magique saturée sur copie','Proposer un dommage que rien n’absorbe.','Degré de Chute choisi avec le MJ ; pas de dommage physique automatique.'],
    ['02','Chutes préparées','Comparer paliers 0, 1–4, 5–7, 8–9 et 10.','Effets, injouabilité temporaire puis perte définitive distincts.'],
    ['02','S03 Nanisme 5, sort degré 5','Tenter le sort au panneau.','Lancer bloqué par l’interdit du Khaïba.'],
    ['02','S04 Gigantisme 5, dominant Feu','Tenter la Magie au Ka-Feu puis une approche permise sur copie.','Interdit sur Magie du Ka dominant, pas sur tous les jets.'],
    ['02','S05 forme éthérale 5, formule Terre','Préparer Alchimie au Ka-Terre du construct.','Formule du Ka dominant interdite ; choisir la formule/approche cohérente.'],
    ['02','S06 forme élémentaire 5, invocation Eau','Préparer Hod et Ka-Eau.','Invocation du Ka dominant interdite.'],
    ['02','S07 Ombre 8','Lire l’alerte et ramener à 7 sur copie après décision du MJ.','Confié au MJ à 8 ; statut narratif explicite, pas mort physique.'],
    ['02','S08 Narcose 10','Lire le palier et conserver le personnage comme témoin de test.','Perte définitive signalée ; aucune suppression automatique du PJ.'],
    ['02','S09 Khaïba 3 déjà mise en jeu, PS de Chute 2','Tenter une seconde mise en jeu puis un Effet Mnémos.','Pas de second gain dans la séance ; PS de Chute employés avant les PS ordinaires.'],
    ['03','A03 Materiae Lune 1','Valider Début de séance, puis vérifier les trois Chutes sur S09 dans un essai séparé.','MP restaurées à leur maximum saisi ; mises en jeu et PS de Chute effacés, pas Sapience ordinaire.'],
    ['01','Ka dominant 6, Stase 4','Comparer choix dominant, degré calculé et jauge de Stase.','Plafond sur le Ka choisi, stase bornée ; une baisse de Ka signale une réserve périmée.'],
    ['01','Réserves de personnage','Puiser deux degrés de Stase puis lancer une action autorisée.','Coût au lancer une fois ; approche/métamorphe ne deviennent pas des ressources distinctes.'],
    ['01','Vécu passé','Ajouter un Effet Mnémos de bonus puis lancer.','Coût en PS annoncé ; ne pas confondre bonus et Mnémos en tant que Vécu.'],
    ['02','S09 PS de Chute','Choisir Mnémos en tant que Vécu de deux degrés.','Deux PS, plafonné par le Vécu passé ; consommation prioritaire des PS de Chute.'],
    ['01','Métamorphe degré 2','Exprimer un puis deux degrés sur le Ka dominant.','Bonus limité aux degrés non permanents ; autres approches non couvertes.'],
    ['01','Métamorphose rendue permanente sur copie','Relire le degré exprimable puis reconnecter.','Degré permanent déjà visible retiré de la réserve exprimable ; aucune seconde coche automatique.'],
    ['01','Action sociale','Choisir Impressionner puis lancer.','+2 et un jeton de Traque ; coût visible et non rejoué.'],
    ['02','RK 3, chutes au-delà de 4','Comparer le calcul de dépassement.','Approche, exprimé, visible et degrés de Chute au-delà de 4 pris en compte selon le moteur.'],
    ['01','Traque 1, Seuil RK 5','Ajouter quatre jetons explicitement au bandeau.','Au seuil, jauge vidée et Intensité +1 immédiatement : choix de David, distinct de l’aube de l’errata.'],
    ['02','Intensité de Traque 2 puis 3 sur copie','Noter avec le MJ le sacrifice/l’élément interdit.','Restrictions narrées explicitement ; ne pas attribuer au logiciel une sélection automatique de tous les interdits.'],
    ['01','Astérion, sort de recette degré 2','Choisir Basse Magie 4, Ka-Feu 6 et le sort.','80 % avant circonstances : (4 + 6 − 2) × 10 ; nom, élément et coût lisibles.'],
    ['01/03','Sapience 12 puis A01 Sapience 4','Préparer un Sacrifice avec un sort admissible puis inadmissible sur copies.','Coût 5 PS et réussite automatique si autorisé ; insuffisance et degré au-delà de l’Art refusés.'],
    ['01','Sort raté sans maladresse','Retenter avec 1 PS puis, sur autre copie, 1 Stase.','Prix payé une fois et relance immédiate ; focus/arbitrage confirmés à la table.'],
    ['01','Critique d’Art','Choisir noter 1 PS ou soigner immédiatement un degré de Chute.','Deux usages exclusifs ; pas de double récompense.'],
    ['01','Ismérie, Hod 4, Eau 6, créature 2','Réussir l’invocation puis ouvrir le pacte.','Ordonnances distinctes, deux d100 comparés par la table d’opposition ; pacte pas noué au chargement.'],
    ['03','A02 invocation 3','Résoudre un pacte perdu puis encaisser.','Dommages magiques de degré 3, aucune écriture physique inventée.'],
    ['03','Pacte sur maladresse','Lire le bannissement et sa condition de fin.','Banni du fief jusqu’à un degré de plus dans la Sephirah ; pas de pacte lié après l’échec.'],
    ['01','Nahal, Œuvre noire 4, cornue Eau 4, formule 2','Lancer la transmutation et examiner les Materiae.','60 % avant contexte ; Eau −2 sauf critique, aucune double consommation.'],
    ['03','A03 formule Lune/Lune degré 2','Lancer puis examiner les deux consommations.','Même jauge Lune payée deux fois ; insuffisance détaillée, pas de réserve négative.'],
    ['03','A03 cornue Eau 4 et Lune 3','Préparer l’Œuvre au blanc avec la formule à second élément Lune.','Moins développé des deux Ka du construct retenu.'],
    ['03','A03 assemblage blanc et Œuvre rouge nommée','Tenter la transmutation de niveau supérieur.','Lancer bloqué si l’assemblage est insuffisant.'],
    ['03','A03 Materiae insuffisantes','Examiner le reliquat dû après le lancer.','Jauge arrêtée à zéro ; complément à prendre ailleurs explicitement avec le MJ.'],
    ['01','Maladresse d’Alchimie','Appliquer +1 Khaïba puis Construct abîmé après lecture.','Forme éthérale si premier Khaïba ; Ka du construct −1 au bouton, pas formule retentée dans le scénario.'],
    ['01','Fin de séance et PS disponibles','Préparer un achat de Vécu, d’Art, de Ka et de maximum MP sur copies.','Prix du degré suivant selon le moteur ; un premier Ka nécessite Mnémos permanent.'],
    ['01','Stase entamée','Confirmer un jour en Plexus/Nexus, sortie de stase, puis test sur copies.','+1 par jour, pas par heure ; plafond respecté ; test sur Ka actuel sans modificateur.'],
    ['01','PNJ humains','Ouvrir les fiches de Maëlle et Ruben puis un Nephilim.','Métier humain et Ka-Soleil sans Arts occultes gratuits ; Menace/initiative humaine à arbitrer selon le livre.'],
    ['01','Rencontre préparée','Ajouter les Nephilim, lire Ka-Eau ×2 puis annoncer les priorités.','Initiative de base correcte ; PS, sorts préparés et tirs visés restent à déclarer explicitement.'],
    ['01','Trois rencontres évitables','Négocier, contourner puis engager une copie de rencontre.','Bons alliés/hostiles et profils de recette ; pas de combat imposé pour obtenir une preuve.'],
    ['01','Changement de lieu Atlas','Suivre CONTEXTE-DES-LIEUX.json et régler le bandeau.','Contexte proposé, jamais appliqué automatiquement par le fichier de données.'],
    ['Toutes','Joueurs existants p-1/p-2/p-3','Importer les trois archives telle quelle.','Profils, avatars et anciens PJ conservés ; quinze nouveaux personnages au total.'],
    ['01','Trois tablettes 360/768/1180','Choisir le bon PJ et lancer un Vécu avec approche.','Jet reçu par le MJ ; formules/sorts facultatifs peuvent rester vides.'],
    ['01','Fiche HTML','Ouvrir les sept pages, modifier une valeur puis sortir du champ.','Nom du Nephilim/Simulacre distincts, valeurs remontées ; copies calculées en lecture seule.'],
    ['01','Marqueur de secrets de séance','Inspecter les messages joueur.','Aucun SECRET_MJ_NEPHILIM_RECETTE attendu ; consigner GM-05 en échec s’il persiste.'],
    ['01','Atlas et indices','Ouvrir huit lieux et révéler/recacher une preuve.','Liens exacts ; I01 seul révélé au départ.'],
    ['01','Trame quatre actes','Suivre les trois issues puis l’atelier hors fiction.','Chaînes reliées, aucune preuve essentielle dépendante d’un jet unique.'],
    ['01','101 euros fictifs','Partager 33 chacun puis conserver le reliquat.','99 distribués, reste 2 ; pas de conversion des objets en Sapience ou Materiae.'],
    ['01','Wiki et Chronologie','Lire neuf pages et quatre repères.','Pentacle descriptif, dates ISO fictives ; aucun calendrier ésotérique affirmé.'],
    ['01','Sons, musique et Storyboard','Écouter trois sons et deux pistes, déclencher quatre moments puis arrêter.','Médias locaux, sons synthétiques 4 s ; rien ne démarre à l’import.'],
    ['01','Light-OS','Assigner les appareils de test aux trois tuiles.','États matériels vides à la livraison ; aucun appareil déclaré validé.'],
    ['Tables','Atelier Table-OS','Importer les trois JSON dans un univers de recette, Ranger tel quel.','Trois tables originales 1d6 ; aucune table officielle remplacée.'],
    ['02/03','Laboratoire altéré','Réimporter uniquement ce laboratoire avec Remplacer.','Fiches et réserves du laboratoire remises à zéro ; enquête 01 préservée.'],
    ['01','Après modification','Exporter puis importer avec Cloner.','Liens et personnages cohérents, original conservé.'],
    ['Toutes','Clôture et reconnexion','Recharger puis comparer les fiches et réserves.','Écritures persistées, pas de coût ni gain de séance rejoué à la connexion.'],
    ['Toutes','Catalogue des modules','Ouvrir Modules du jeu sous ce pilote.','Aucun module spécifique compatible dans cette version ; les outils transversaux et cartes natives suffisent au lot.'],
    ['Toutes','Après chaque essai','Renseigner observé, verdict et preuve dans resultats.csv.','PASSÉ, ÉCHEC, NON TESTÉ ou NON APPLICABLE ; aucun cas humain prévalidé.'],
];
export const casNephilim=lignes.map(([archive,precondition,action,attendu],i)=>({id:`NE-${String(i+1).padStart(2,'0')}`,archive,precondition,action,attendu}));
const csv=s=>'"'+String(s).replaceAll('"','""')+'"',cell=s=>String(s).replaceAll('|','\\|');
export function ecrireRecetteNephilim(sortie,{scenario,archives,rattachement}){
    const ecrire=(nom,texte)=>fs.writeFileSync(path.join(sortie,nom),texte.trimEnd()+'\n');
    ecrire('LIRE-MOI.md',`# Nephilim Légende — ${titreNephilim}

**Bibliothèque → Importer un bundle Nexus → 01-Le-Meridien-de-verre.gmos → Importer telle quelle.** Aucun rechargement nécessaire. Pilote **2.0.0** fourni : Nexus conserve un pilote existant du même identifiant, son remplacement reste explicite si nécessaire.

| Joueur existant | Nephilim | Simulacre | Science occulte |
| --- | --- | --- | --- |
${herosNephilim.map((h,i)=>`| ${h.joueur} (${rattachement.joueurs[i].id}) | ${h.nom} | ${h.simulacre} | ${h.art} |`).join('\n')}

Seuls noms/identifiants du relevé de ${rattachement.source} sont repris. Aucun personnage ou contenu de cette campagne privée recopié. Profils/anciens PJ conservés ; trois PJ principaux, neuf de Santé/Chutes et trois des Arts, **15 nouveaux personnages** au total.

## Un lot prêt à importer

Enquête originale dans **Saint-Ambre**, ville fictive : plaques déplacées, stase retrouvée et dispositif de verre détourné. **12 PNJ (4 Nephilim, 8 humains), 8 lieux, 12 indices, 16 scènes / 4 actes, 3 rencontres préparées, 4 séances, 9 pages Wiki, 8 lots de butin**. Trois issues et accès profanes aux preuves essentielles. Le Pentacle **Les Veilleurs du Méridien** vit dans les relations et Wiki, sans statistiques collectives inventées.

- **02-Sante-Chutes-et-Stase.gmos** : neuf PJ S01–S09. Conséquences physique/magique, quatre interdits du Khaïba à 5, Ombre 8, Narcose 10, Chute déjà mise en jeu et PS de Chute.
- **03-Arts-et-Ressources.gmos** : A01 Sacrifice insuffisant, Stase 1 et Grand Secret nommé ; A02 invocation degré 3 et ordonnances 2 ; A03 Œuvre au blanc, formule double Lune, Materiae Lune 1 et assemblage insuffisant pour l’Œuvre rouge.

Importer le laboratoire utile puis **Remplacer** pour le réinitialiser après un essai destructif. Les réserves et identifiants restent indépendants de l’enquête. Les paliers 8/10 sont des états de laboratoire signalés, pas des événements déjà joués.

## Modules et outils

**Aucun module spécifique Nephilim compatible dans le catalogue actuel.** Aucun module de Dune, TMR ou Alien détourné : les cartes natives Santé/Chutes/Stase/Expérience et les outils transversaux répondent au besoin de test. Combat-OS, Atlas, indices, Trame, Wiki, Storyboard, sons, musique, lumières et trois tables Table-OS sont préparés. **PARCOURS-NEPHILIM.md** guide la recette ; **CONTEXTE-DES-LIEUX.json** propose des réglages **manuels** du bandeau.

**Les trois pouvoirs portant RECETTE sont fictifs**, créés pour tester les raccords degré/élément/consommation : Trace de braise, Messager de nacre, Brume révélatrice. Ils ne sont pas des pouvoirs officiels ni un catalogue de règles ; le MJ arbitre leur effet en fiction. Profils avancés aux valeurs choisies pour test, pas une création novice par budget. Vécus passés et époques viennent du référentiel existant ; descriptions du livre non recopiées.

**${casNephilim.length} cas manuels**, tous NON TESTÉS par David. Cahier, JSON et CSV vierge. 36 SVG documentaires et trois WAV originaux synthétiques de 4 s ; pas de portraits peints ni sons commerciaux. Les trois tables 1d6 s’importent séparément dans **Table-OS → Atelier → Ranger tel quel**, univers de recette. Lampes, comptes et services externes se configurent sur le poste ; aucun appareil inventé.

Voir les rapports et **ANOMALIES-CONNUES.md** : GM-05, secrets de séance diffusés, reste à vérifier et signaler distinctement de la recette du pilote. Aucun changement du code applicatif.
`);
    const contextes=scenario.atlasMaps.map((l,i)=>({lieuId:l.id,lieu:l.name,seuilRK:[5,4,3,5,7,3,3,8][i],lieuMagique:i===4?3:i===7?6:0,conjonction:0,intensiteDeLaConjonction:1,note:'Proposition originale de recette ; régler manuellement au bandeau après décision du MJ. Aucun changement au simple déplacement dans Atlas.'}));ecrire('CONTEXTE-DES-LIEUX.json',JSON.stringify(contextes,null,2));
    ecrire('PARCOURS-NEPHILIM.md',`# Parcours guidé — Nephilim et outils GM-OS

1. Importer 01 et activer la première séance. Vérifier les trois joueurs existants et les trois fiches, identité du Nephilim distincte du Simulacre. Vécu passé 4 + Ka 4 = **80 %**. Sort/formule facultatifs restent vides pour un jet ordinaire.
2. Astérion : Basse Magie **4**, Ka-Feu **6**, sort RECETTE degré **2** = **80 %** avant circonstances. Retenter, Sacrifice et suites des critiques se testent ensuite sur copie ; l’effet narratif original ne vaut pas règle officielle.
3. Ismérie : Hod **4**, Ka-Eau **6**, invocation **2**, ordonnance **1**. Après invocation réussie, ouvrir le pacte et résoudre les deux d100. Un pacte n’est pas déjà lié à l’import. Le laboratoire A02 augmente le degré et les ordonnances pour comparer les conditions.
4. Nahal : Œuvre noire **4**, cornue Eau **4**, formule **2** = **60 %** avant contexte. Materiae Eau **8** au départ ; perte **2** sauf critique. En A03, double Lune et assemblage blanc permettent d’examiner le moins développé des deux Ka, la consommation double et l’insuffisance.
5. Au bandeau principal : RK **5**, Traque **1**, Intensité **1**, aucun lieu/conjonction. Quatre ajouts de Traque atteignent le seuil : **Traque 0, Intensité 2**, montée immédiate selon le choix de David. Ne pas ajouter automatiquement un jeton pour chaque clic ou chaque reconnexion.
6. Les contextes de lieu sont des propositions dans CONTEXTE-DES-LIEUX.json. La serre est proposée Plexus d’Eau (valeur 3), la chambre Nexus (6). Régler soi-même le bandeau. Ces nombres ne sont pas des coordonnées Atlas et ne créent pas de module.
7. Employer 02 pour Santé, quatre formes du Khaïba, paliers et transferts à la stase ; les humains ont un métier contemporain et leur Ka-Soleil, pas des Arts de Nephilim. Leur initiative/Menace et les priorités du round se décident avec le MJ. Le modèle générique de Combat-OS montre six cases physiques ; les cases de bonus et la piste magique complètes sont dans la carte Santé de la fiche.
8. Sur tablette, ouvrir les sept pages HTML ; les degrés d’Arts s’écrivent en page 2, copies de l’Arbre/Œuvres en lecture seule ailleurs. Modifier une valeur, sortir du champ et vérifier la réception par le MJ. Fermer puis rouvrir sans coût rejoué.
9. Storyboard propose quatre moments avec carte/titre/son. Table-OS importe les trois tables originales séparément. Aucun éclairage physique n’est affecté au départ. Réinitialiser seulement le laboratoire voulu avec Remplacer, puis vérifier que 01 a conservé ses changements.
`);
    ecrire('SCENARIO.md',`# ${titreNephilim}

Saint-Ambre et les personnages sont inventés. Nérac a détourné un dispositif de conservation pour retenir des images de souvenirs. Il craint une perte ancienne ; l’entendre n’oblige pas à lui donner raison. Liora cherche sa stase, Solal possède les anciens plans, les témoins humains ont des traces indépendantes.

${herosNephilim.map(h=>`## ${h.nom} / ${h.simulacre} — ${h.joueur}\n\n${h.histoire}\n\nMotivation : ${h.motivation}`).join('\n\n')}

## Pistes et repli

I01/I04 suivent les plaques ; I03/I08 expliquent l’ancien usage ; I07/I10 prouvent le raccord moderne ; I12 permet une négociation. Chaque indice essentiel a un accès physique ou humain. Après un échec, offrir la preuve contre du temps, une dette ou de la surveillance explicitement arbitrés ; ne pas rendre la réussite d’un sort obligatoire. Les trois pouvoirs RECETTE sont des supports de test, pas des extraits du livre.

${scenesNephilim.map(s=>`## ${s[2]}\n\n${s[6]}\n\n${s[4].map(x=>pnjNephilim.find(p=>p[0]===x)).map(p=>`**${p[1]}** : « ${p[5]} » Secret MJ : ${p[6]}`).join('\n\n')}\n\nSuite : ${s[7].join(', ')||'bilan et export'}.`).join('\n\n')}

## Issues

Restitution : réunir les plaques, rendre la stase à Liora et obtenir de Nérac la libération des images. Désaccord : suivre le calque de Séléné sous arbitrage, en préservant une sortie physique. Coupure : isoler le raccord moderne avec Tom et escorter les témoins, puis décider du sort du dispositif. Un affrontement avec Nérac reste évitable. Noter les choix au journal et conclure avant l’atelier hors fiction.
`);
    ecrire('CAHIER-DE-RECETTE.md',`# ${casNephilim.length} essais Nephilim — NON TESTÉS par David

Références : manuel 54-Jeu-Nephilim.md, pilote 2.0.0, moteurs nephilim/nephilimRegles et Livre 0/errata V1.3 déjà audités. Les profils de pouvoirs RECETTE ne sont pas officiels. Les états des laboratoires ne sont pas des actions déjà jouées ; repartir du laboratoire avec Remplacer entre essais indépendants.

| Cas | Archive | Précondition | Action | Attendu |
| --- | --- | --- | --- | --- |
${casNephilim.map(c=>'| '+[c.id,c.archive,c.precondition,c.action,c.attendu].map(cell).join(' | ')+' |').join('\n')}`);
    ecrire('cas-de-recette.json',JSON.stringify(casNephilim,null,2));ecrire('resultats.csv','"cas";"archive";"precondition";"action";"attendu";"statut";"observe";"preuve"\n'+casNephilim.map(c=>[c.id,c.archive,c.precondition,c.action,c.attendu,'NON TESTÉ','',''].map(csv).join(';')).join('\n'));
    fs.mkdirSync(path.join(sortie,'tables-a-importer'),{recursive:true});for(const [i,[genre,textes]]of [['rumeurs',['Les plaques ont changé de nom.','Une montre perd toujours la même minute.','L’eau a été remplacée récemment.','Le devis ne montre pas le raccord ancien.','Le collecteur tient à une lettre.','Un passage longe les conduites.']],['incidents',['Un témoin demande à rester anonyme.','Un accès est fermé pour travaux.','Une lampe révèle une seconde inscription.','Un surveillant veut vérifier les autorisations.','Un artisan réclame son outil.','Une horloge retarde dans la fiction.']],['objets',['Calque ancien','Flacon étiqueté','Euros fictifs','Plaque photographique','Clef de tiroir','Carnet de mesures']]].entries())ecrire(`tables-a-importer/${i+1}-${genre}.json`,JSON.stringify({name:`RECETTE Méridien — ${genre}`,dice:'1d6',entries:textes.map((t,n)=>({min:n+1,max:n+1,title:t,description:'Fiction originale de recette, sans gain de Sapience ou de Materiae automatique.',...(genre==='objets'?{butin:[{name:t,type:n===2?'currency':'item',quantite:n===2?7:1,rarity:'common',weight:0,value:0,description:'Objet de recette, pas une réserve occulte.'}]}:{})}))},null,2));
    ecrire('CONTENU.json',JSON.stringify({archives,joueurs:scenario.players.map(p=>({id:p.id,nom:p.realName,pj:p.characters[0].name})),modulesSpecifiques:0,casManuels:casNephilim.length},null,2));return casNephilim;
}
