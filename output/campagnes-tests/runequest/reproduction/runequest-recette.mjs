import fs from 'node:fs';
import path from 'node:path';
const NOMS=['01-Les-Bornes-du-gue.gmos','02-Aptitudes-Combat-et-Sante.gmos','03-Runes-Passions-et-Magie.gmos'];
const groupes=[
 ['commun','natif','Nexus, joueurs, scènes et supports',0,'Manuel GM-OS ; format Nexus v1 ; pilote RuneQuest 2.0.0',[
  ['Bibliothèque en Atelier','Importer 01 telle quelle.','Une campagne, trois nouveaux PJ, trois joueurs réutilisés ; aucun PJ ancien déplacé.'],
  ['Les trois archives importées','Comparer les trois listes de PJ.','3 + 9 + 9 = 21 nouveaux PJ, tous d’ID distinct, mêmes joueurs p-1/p-2/p-3.'],
  ['02 modifié ; 01 avec une note ajoutée','Réimporter uniquement 02 avec Remplacer.','Profils C01–C09 réinitialisés ; note et PJ de 01 conservés.'],
  ['01 actif','Ouvrir Atlas, les huit lieux et les liens de voisinage.','Plans locaux décodés ; liens vers les bons lieux et PNJ.'],
  ['01 actif','Suivre S01 puis S05 et S11 dans la Trame.','Actes, lieux, témoins, indices et embranchements disponibles ; pas de résultat préjoué.'],
  ['Indice accord public, ordre caché','Révéler l’ordre puis consulter depuis un Hub.','Seuls les indices révélés deviennent publics ; vérifier aussi après rechargement.'],
  ['Un PJ relié à un témoin','Ouvrir sa relation et la fiche du témoin.','La relation vise le bon PNJ dans la même campagne.'],
  ['Moment M01 préparé','Déclencher son plan et son signal.','Carte embarquée affichée ; signal synthétique local, pas de service audio distant.'],
  ['Sound-OS et Music-OS','Écouter les trois signaux de 4 secondes et la liste locale.','Fichiers locaux lisibles ; les sons ne sont ni enregistrements de rivière ni voix.'],
  ['Light-OS','Ouvrir les trois tuiles.','Tuiles sans lampe assignée ; aucune sortie matérielle prétendue configurée.'],
  ['Lot de 101 lunars','Partager entre trois PJ puis recharger.','33 par PJ et reliquat 2 si la table choisit cette répartition ; pas de conversion en PM/PR.'],
  ['Trois JSON Table-OS livrés','Importer par Table-OS → Atelier, puis Ranger tel quel.','Trois tables originales 1d6 indépendantes ; tables de règles conservées.']
 ]],
 ['jets','natif','D100, caractéristiques, augmentation et opposition',1,'Livre p. 141–146 et errata p. 142, 144, 147 ; runequest.ts',[
  ['C02, arme1 = 56','Retenir son arme et lire les plages.','Critique 01–03, spéciale 01–11, réussite 01–56, échec critique 99–00.'],
  ['C02, aucun modificateur','Lancer plusieurs D100, noter total et niveau.','Le total des dizaines/unités sert au niveau ; 00 vaut 100, pas zéro.'],
  ['C01, arme1 = 3','Lire les plages puis observer un résultat de 04 si obtenu.','Réussite minimale 05 ; 04 est une réussite normale. Ne pas promettre de forcer le tirage dans l’interface.'],
  ['C03, arme1 = 120','Lire les plages et les avertissements.','Réussite plafonnée à 95 ; critique jusqu’à 06 et spéciale jusqu’à 24.'],
  ['C03, score 120','Observer 97 puis 00 si ces résultats surviennent.','97 échoue, 00 est un échec critique. Contrôle déterministe séparé dans les essais du moteur.'],
  ['C02, arme1 = 56','Ajouter situation −10 et augmentation +20.','Score modifié 66 ; affichage du détail sans modification de la fiche.'],
  ['C02, tentative précédente ratée, permission du MJ','Activer Tenter à nouveau, sans autre bonus.','56 − 25 = 31 ; refus de retenter s’arbitre à la table.'],
  ['CON = 12','Retenir CON puis multiplicateur ×5.','Test sous 60 %, jamais sous 12 %.'],
  ['CON = 12','Choisir successivement ×4, ×3, ×2, ×1 et ×0,5.','48, 36, 24, 12 et 6 % avant autres modificateurs.'],
  ['M04, POU = 15, passive 14','Choisir Table de résistance.','50 + 5 × (15 − 14) = 55 %.'],
  ['C04, arme1 = 140, adverse 80','Saisir l’aptitude adverse.','Excédent 40 retiré aux deux : 100 et 40 ; critique/spéciale calculées sur 100.'],
  ['Opposition au même niveau de réussite','Saisir un jet adverse de niveau égal puis Trancher.','Égalité, même si l’un a un D100 plus élevé ; errata appliqué.'],
  ['Deux résultats d’échec dans une opposition','Trancher l’opposition.','Deux perdants, pas de vainqueur inventé.'],
  ['Jet de Déléa ou Koros','Retenir une compétence précisée, une Passion et une arme.','Les noms saisis servent de libellés ; dégâts, RA et autres valeurs techniques ne sont pas des aptitudes.'],
  ['Test d’augmentation résolu','Augmenter le prochain jet, puis effectuer deux jets.','Bonus/malus repris pour un seul prochain jet ; vérifier qu’il ne persiste pas indûment.']
 ]],
 ['corps','manuel','Combat, localisations et soins',1,'Livre p. 55–57, 146–150, 191–224 ; manuel RuneQuest — combat',[
  ['Trois PJ de 01 à 12 PV','Ajouter PJ et rencontre R01 au combat ; lancer l’initiative.','Ordre ascendant RA DEX + RA TAI : Koros 3, Arven 4, Déléa 5 ; ajouter le RA d’arme à la table.'],
  ['C09, armure jambe droite 5, PV zone 2, PV totaux 8','Comparer la fiche puis décrire un coup sur cette jambe.','Armure et PV locaux lisibles ; les localisations ne sont pas automatiquement déduites avec les PV totaux.'],
  ['Un jet réussi','Utiliser Localiser le coup, lire D20 et zone.','1–4 jambe D., 5–8 jambe G., 9–11 abdomen, 12 poitrine, 13–15 bras D., 16–18 bras G., 19–20 tête.'],
  ['C07, bras droit à 0','Ouvrir la fiche et arbitrer l’usage du bras.','Bras inutilisable selon la règle ; le pilote ne bloque pas lui-même tous les gestes.'],
  ['C08, tête −4 (double des 4 PV de zone), PV totaux 4','Examiner les valeurs ; suivre le traitement à la table.','Conséquences graves de tête à arbitrer ; aucun compte à rebours ni hémorragie automatique revendiqué.'],
  ['C05, 2 PV totaux','Ouvrir fiche et combat.','Valeur 2/12 conservée ; inconscience du livre à appliquer manuellement, distincte du palier générique de GM-OS.'],
  ['C06, 0 PV totaux','Examiner le suivi sans supprimer le personnage.','0/12, personnage conservé ; étiquette générique hors combat distincte de la mort de RuneQuest en fin de round.'],
  ['Un PJ blessé, réserve de bandages','Tester Premiers soins ; appliquer l’effet d’après le résultat.','Premier essai par blessure, durée et soins/dégâts à la table ; pas de guérison automatique par le bouton Lancer.'],
  ['Dégâts spéciaux possibles','Distinguer spéciale, critique et dégâts appliqués.','Empalement/lacération/écrasement et armure arbitrés ; le niveau du jet n’applique pas seul ces conséquences.'],
  ['PV modifiés dans le combat','Sauvegarder, ouvrir la fiche HTML puis recharger.','Santé principale et maximum cohérents avec points_de_vie / pv_max ; consigner tout écart réel.'],
  ['Déplacement en terrain ouvert','Comparer catégorie de poursuite et portée de l’arme.','Catégories sans modificateur automatique de tir ; pénalité choisie selon les règles de l’arme.']
 ]],
 ['magie','manuel','Runes, Passions, trois magies et réserves',2,'Livre p. 227–238, 244–257, 275, 313–315, 381–388 ; corpus relu',[
  ['M05, Air 90','Lancer l’affinité puis proposer une inspiration.','Aptitude sous 90 ; niveau exploitable pour l’augmentation, aucune dépense de Rune automatique.'],
  ['M06, Loyauté 85','Jouer une décision contraire puis consulter le cahier.','Test obligatoire ou réduction sous 80 à arbitrer ; le pilote n’impose pas le comportement.'],
  ['Rune ou Passion ayant échoué en inspiration','Noter la suite propre à la Rune ou à la Passion.','Les conséquences du livre restent distinctes ; pas d’assimilation au simple −20 du jet d’augmentation commun.'],
  ['Une paire 70/30 sur la fiche','Modifier l’un des deux scores dans un essai.','La seconde valeur ne s’ajuste pas seule : maintenir soi-même le total 100 si applicable.'],
  ['M04, POU 15','Préparer le lancement spirituel en POU ×5.','75 %, puis opposition POU contre POU si cible non consentante ; coût enregistré à la main.'],
  ['M01, 0 PM','Proposer un effet spirituel coûtant 1 PM.','La table refuse faute de PM ; le panneau de test seul ne constitue pas un blocage de lancement ni une dépense.'],
  ['M02, 1 PM','Résoudre un exercice de coût 1 PM réussi, puis débiter à la main.','1 → 0 après comptabilité explicite ; un échec spirituel conserve les PM selon la règle.'],
  ['M03, 0 PR au culte 1, 1 PR au culte 2','Proposer le même exercice abstrait de 1 PR pour le culte 1.','Pas de prélèvement dans le culte 2 pour couvrir le culte 1 ; refus décidé par la table.'],
  ['M08, PR 1/3 et PR culte 2 à 0/1','Modifier une réserve puis recharger.','Réserves indépendantes et plafonds propres ; aucune permutation des valeurs.'],
  ['Exercice runique de RECETTE coût 1 PR','Comparer critique, réussite, échec et échec critique.','Critique : 0 PR ; réussite : coût ; échec normal : 0 PR ; échec critique : coût sans effet. Comptabilité manuelle.'],
  ['Vénération, jour saint défini par la table','Payer au moins 2 PM et résoudre le rite.','Récupération selon type de jour et statut ; aucune récupération déclenchée par le simple bouton Lancer.'],
  ['M07, compétence de sorcellerie 55 et Lecture/Écriture 65','Retenir la compétence précisée et lancer.','Score 55 disponible ; plafond et manipulations préparés à la table.'],
  ['M09, INT libre 0, 2 PM','Proposer une intensité supplémentaire.','La table refuse au-delà de l’INT libre ; pas de moteur de construction de sorts inventé.'],
  ['Exercice abstrait une Rune et une technique maîtrisées, base 2 PM','Comparer les issues d’un jet de sorcellerie.','Réussite : coût choisi ; critique : 1 PM ; échec : 1 PM ; échec critique : tous les PM investis, appliqués manuellement.'],
  ['Focus absent pour magie spirituelle','Déclarer l’incantation et noter les rounds.','Deux rounds au lieu d’un ; aucun timer ou effet de focus automatique.'],
  ['Combat spirituel et POU 15 adverse 14','Résoudre compétence puis résistance dans des tests séparés.','Compétence en %, résistance sous 55 si POU 15 actif ; dégâts spirituels à appliquer à la main.']
 ]],
 ['fiche','natif','Fiche HTML, tablettes et persistance',0,'Manuel RuneQuest ; correspondance runequest-fr ; moteur de fiches',[
  ['PJ de 01','Ouvrir Fiche du jeu, puis ses quatre pages.','Nom, sept caractéristiques, Runes, armes et valeurs liés ; aucune recoloration du PDF par le thème.'],
  ['Fiche HTML ouverte','Changer le nom et la réserve PM ; revenir au jet.','Écriture des champs reliés reçue et utilisable ; pas seulement visible localement dans l’iframe.'],
  ['Fiche GM-OS modifiée','Sauvegarder, rouvrir la fiche HTML puis recharger.','Valeurs sauvegardées synchronisées dans le bon sens et persistées.'],
  ['Page Famille ou histoire, valeur non reliée au pilote','Modifier une entrée familiale et une coche d’expérience.','Donnée reste dans la fiche HTML ; elle ne devient pas un champ chiffré du pilote.'],
  ['Trois Hub de 360/768/1180 px','Choisir chaque PJ puis lancer son aptitude.','Trois jets reçus par le MJ, bon personnage et affichage sans débordement horizontal.'],
  ['Séance active avec marqueurs fictifs privés','Inspecter uniquement la présence des marqueurs dans les trames joueur.','Aucun marqueur privé ; si observé, ÉCHEC GM-05 conservé dans le rapport.'],
  ['Application rechargée','Vérifier campagnes, anciens joueurs/avatars et ancien PJ sentinelle.','Import et persistance ne remplacent pas les données étrangères à ce lot.'],
  ['Fermeture de séance','Fermer les accès puis reconnecter un Hub.','Aucun accès persistant indûment ; consigner le refus ou l’écart observé.']
 ]],
 ['table','manuel','Progression et décisions de la table',0,'Livre p. 137–161 et corpus relu ; limites du pilote',[
  ['Compétence utilisée avec succès','Cocher son expérience puis effectuer la progression au livre.','Coche et progression manuelles ; pas de points d’expérience ou gain automatique inventés.'],
  ['S01 ou S11','Résoudre l’intrigue par témoignage ou réparation sans magie.','Les preuves essentielles restent accessibles ; aucun sort n’est une clé obligatoire.'],
  ['Deux actions d’aide proposées','Choisir la première, puis tenter d’empiler la seconde.','La table applique les limites du livre ; l’interface ne valide pas toutes les combinaisons d’augmentations.'],
  ['Rejouer un laboratoire','Comparer Rejouer et Remplacer.','Utiliser le remplacement du seul fichier de labo pour retrouver les valeurs initiales ; préserver 01.']
 ]]
];
export const casRuneQuest=groupes.flatMap(([groupe,support,,index,source,lignes])=>lignes.map(([precondition,action,attendu],i)=>({id:`RQ-${groupe.toUpperCase()}-${String(i+1).padStart(2,'0')}`,archive:NOMS[index],precondition,action,attendu,source,preuvePrevue:'Valeur avant/après, capture si utile et contrôle après rechargement',groupe,support})));
const csv=v=>'"'+String(v).replaceAll('"','""')+'"',md=v=>String(v).replaceAll('|','\\|');
export function ecrireRecetteRuneQuest(sortie,{archives,rattachement,pilote,fiche,date}){
 const ecrire=(f,t)=>fs.writeFileSync(path.join(sortie,f),t.trimEnd()+'\n');
 ecrire('cas-de-recette.json',JSON.stringify(casRuneQuest,null,2));
 ecrire('resultats.csv',['id;archive;precondition;action;attendu;statut;observe;preuve',...casRuneQuest.map(c=>[c.id,c.archive,c.precondition,c.action,c.attendu,'NON TESTÉ','',''].map(csv).join(';'))].join('\n'));
 const matrice=groupes.map(([id,support,mecanique,index,source])=>({id,mecanique,source,support,casIds:casRuneQuest.filter(c=>c.groupe===id).map(c=>c.id),archive:NOMS[index],limite:support==='manuel'?'Le cahier distingue test natif et conséquence/règle appliquée à la table.':'Le test applicatif n’est déclaré fait que si son rapport existe et porte les mêmes SHA.'}));
 ecrire('matrice-couverture.json',JSON.stringify(matrice,null,2));
 ecrire('MATRICE-COUVERTURE.md','# Couverture RuneQuest\n\n| Groupe | Support | Cas | Archive |\n| --- | --- | --- | --- |\n'+matrice.map(m=>`| ${m.mecanique} | ${m.support} | ${m.casIds.length} | ${m.archive} |`).join('\n')+'\n\nVoir les sources et limites détaillées dans matrice-couverture.json. Aucun module spécifique compatible RuneQuest n’est inventé.');
 ecrire('CAHIER-DE-RECETTE.md',`# RuneQuest — cahier de recette\n\n**${casRuneQuest.length} cas humains NON TESTÉS par David.** Les essais automatiques ne cochent pas ce cahier. Pour un tirage aléatoire, noter le total réellement obtenu ; les limites déterministes sont vérifiées à part sur le moteur.\n\n`+casRuneQuest.map(c=>`## ${c.id}\n\nArchive : ${c.archive} · support ${c.support}\n\nPrécondition : ${c.precondition}\n\nGeste : ${c.action}\n\nAttendu : ${c.attendu}\n\nSource : ${c.source}\n\nPreuve : ${c.preuvePrevue}\n\nStatut : **NON TESTÉ**\n`).join('\n'));
 ecrire('LIRE-MOI.md',`# RuneQuest — Les Bornes du gué\n\nImporter d’abord **${NOMS[0]}**, par Bibliothèque → Importer un bundle Nexus → Importer telle quelle. Les deux autres fichiers sont des laboratoires hors fiction. Pour les remettre à zéro, réimporter uniquement le fichier voulu avec **Remplacer** ; ne pas remplacer l’aventure.\n\nPilote ${pilote.name} ${pilote.version}, ID ${pilote.id}, gabarit ${fiche.id} fournis comme dépendances ; l’import conserve un pilote déjà présent du même ID selon la version cible. Le fichier RuneQuest-2.0.0.gmos-driver permet un remplacement explicite si nécessaire.\n\n${rattachement.joueurs.map((p,i)=>`- ${p.realName} (${p.id}) : ${['Arven des Trois-Pierres','Déléa du Clos-Vert','Koros du Sceau-Fendu'][i]}.`).join('\n')}\n\n**21 nouveaux PJ : 3 dans 01, 9 dans 02 et 9 dans 03.** Joueurs réutilisés par leur ID ; anciens PJ, avatars et profils non copiés.\n\nL’aventure est originale : une communauté fictive en Sartar, 12 PNJ, 8 lieux, 12 indices, 16 scènes / 4 actes, 3 rencontres facultatives, 4 séances prévues, 9 pages Wiki, butin et réserve, 4 moments Storyboard, sons et tuiles lumineuses sans appareil. Trois issues : preuve publique, accord ou réparation commune.\n\nLes SVG sont des plans et cartouches documentaires ; les WAV de quatre secondes sont des signaux synthétiques. Aucun portrait illustré ni voix n’est prétendu livré. Les laboratoires réutilisent les supports de l’aventure comme décor de test, avec leurs propres IDs et PJ ; leurs scènes portent LAB.\n\n02 : C01 aptitude 3, C02 aptitude 56, C03 aptitude 120, C04 opposition 140, C05 PV 2, C06 PV 0, C07 bras droit 0, C08 tête −4, C09 armure de jambe 5.\n\n03 : M01 PM 0, M02 PM 1, M03 PR du culte 1 à 0, M04 POU 15, M05 Air 90, M06 Loyauté 85, M07 sorcellerie 55, M08 deux cultes aux réserves distinctes, M09 INT libre 0. Les profils sont choisis pour la recette, pas créés avec un budget novice.\n\n**Aucun module RuneQuest spécifique compatible dans le catalogue actuel.** Panneau de jet et outils transversaux utilisés. Coûts magiques, contrôle de l’INT libre, Runes opposées, progression et conséquences des blessures restent manuels. Les exercices runiques et de sorcellerie portant RECETTE sont abstraits, sans effet officiel ou sort de culte inventé.\n\nLa fiche HTML runequest-fr doit être intégrée dans le moteur de fiches cible ; le thème runequest doit être installé dans le corpus pour son habillage. Leur présence dans ce dépôt ne prouve pas celle sur une autre installation. La campagne n’embarque pas le moteur entier ni ne modifie le pilote pour imposer la bannière.\n\nSuivre CAHIER-DE-RECETTE.md et remplir resultats.csv. Les ${casRuneQuest.length} cas restent NON TESTÉS. Date fixe du lot : ${date}. Contrôles et limites dans RAPPORT-DE-VERIFICATION.md et ANOMALIES-CONNUES.md.`);
 const tables=[['rumeurs','Paroles au gué',['Une date manque au sceau','Le drain chante sous la pierre','Oren doit un salaire','Un témoin demande protection','Luma connaît un détour','La récolte ne peut attendre']],['incidents','Incidents de la traversée',['Corde détendue','Bête effrayée','Panier tombé','Arrivée d’un messager','Pieu qui cède','Dispute entre porteurs']],['objets','Trouvailles documentaires',['Morceau de cire','Ruban noué','Croquis mouillé','Poinçon émoussé','Tablette fendue','Corde neuve']]];
 fs.mkdirSync(path.join(sortie,'tables-a-importer'),{recursive:true});
 for(const[slug,name,entrees]of tables)fs.writeFileSync(path.join(sortie,'tables-a-importer',slug+'.json'),JSON.stringify({name:'RECETTE RuneQuest — '+name,dice:'1d6',entries:entrees.map((title,i)=>({min:i+1,max:i+1,title,description:'Fiction originale, aucun effet mécanique automatique.'}))},null,2)+'\n');
 ecrire('MODULES-ET-LIMITES.md','# Modules et limites\n\nAucun module de jeu spécifique RuneQuest enregistré. Pas de module d’un autre jeu emprunté. Les sept localisations se lisent au jet mais leurs dégâts/armures se gèrent sur la fiche. L’étiquette de santé générique de Combat-OS ne remplace pas les seuils de conscience ou de mort du livre. Les capacités de magie se testent puis se comptabilisent à la main. Aucune gestion automatique du Temps sacré, du calendrier gloranthien, des appareils ou des services IA/TTS.\n\nLes trois JSON Table-OS s’importent séparément. La fiche HTML comporte quatre pages : seules les clés reliées remontent au pilote ; famille, compagnon et autres clés explicitement absentes de la correspondance restent dans la fiche.');
 ecrire('REPRODUIRE.md','# Reproduire\n\nDepuis la racine du dépôt :\n\n1. node outils/campagnes-de-recette/runequest.mjs\n2. npx.cmd vitest run --config outils/campagnes-de-recette/vitest-runequest.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/runequest/verification-archives.json\n3. node outils/campagnes-de-recette/runequest-visuels.mjs ; examiner les captures.\n4. Si autorisé : npm.cmd run build, puis npx.cmd playwright test e2e/campagneDeRecetteRuneQuest.spec.ts --reporter=list (instance jetable).\n5. node outils/campagnes-de-recette/emballer-runequest.mjs\n\nUne régénération invalide les anciens rapports dépendants ; l’emballage contrôle les empreintes.');
 ecrire('empreintes-archives.json',JSON.stringify(archives,null,2));return casRuneQuest;
}
