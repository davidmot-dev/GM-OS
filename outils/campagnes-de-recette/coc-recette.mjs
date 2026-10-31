import fs from 'node:fs';
import path from 'node:path';
export function ecrireRecetteCoc(sortie,{noms,date}){
 const cas=[],matrice=[];const ecrire=(n,t)=>fs.writeFileSync(path.join(sortie,n),t.trimEnd()+'\n');
 // Chaque groupe porte une source de règle ou de format réelle. Le support ne promet pas
 // l’automatisation des restrictions énumérées dans limite.
 const groupes=[
 ['GM','Import, joueurs et droits','natif',0,'Types Nexus v1, NexusService, e2e/lancerGmOs.ts ; relevé autorisé cthulhu-hack-joueurs.json','Confidentialité et droits à éprouver ; aucun secret réel dans les preuves.',[
 ['Profil jetable avec trois joueurs et anciens PJ fictifs','Importer 01, 02 et 03 via Nexus','Trois campagnes ; p-1/p-2/p-3 conservés ; 24 nouveaux PJ, anciens PJ et avatars inchangés.'],
 ['02 modifiée ; note de 01 conservée','Réimporter seulement 02 avec Remplacer','Les neuf PJ de 02 retrouvent leurs états ; note et PJ de 01 inchangés.'],
 ['Pilote déjà installé','Contrôler ID/version et gabarit avant import','custom-1793122664880, version 2.0.0, tpl-1793122664880 ; garder la dépendance identique, remplacer explicitement une ancienne version.'],
 ['01 active ; nom et échelle d’évolution modifiés','Recharger GM-OS et reconnecter le Hub','Valeurs conservées et aucun nouveau doublon.'],
 ['Séance active, marqueurs SECRET_MJ_COC_RECETTE fictifs','Examiner les trames de trois Hub','Aucun marqueur privé reçu ; chaque présence est un ÉCHEC, y compris gmSecrets de séance (GM-05).'],
 ['Hub attribué à un PJ, autre PJ à un autre joueur','Tenter une édition de l’autre PJ par le parcours disponible','Refus ou absence de droit d’écriture ; aucune mutation de l’autre PJ. Distinguer lecture et écriture.'],
 ['Hub 360/768/1180 px','Ouvrir jet et Fiche du jeu puis sauvegarder','Commandes accessibles ; pas de débordement de page ; écriture reçue par le MJ.'],
 ]],
 ['AV','Enquête, Trame et médias','natif',0,'coc-scenario.mjs (fiction originale) ; corpus l-investigation-par-evidences-et-recherche-a-seuils-multiples.md, livre p. 67-68','Évidences sans jet ; les plans sont schématiques et les portraits sont des cartouches documentaires.',[
 ['Acte 1, parvis','Refuser un test et aller observer la berge','Avis et niveau restent accessibles ; poste et café sont deux autres chemins.'],
 ['Atelier, test d’INT échoué','Demander le boîtier et lire la fiche de maintenance','Défaut temporel compris ; échec ne bloque pas le relais ni les archives.'],
 ['Atlas','Ouvrir huit lieux et suivre leurs liens PNJ/lieux','Huit cartes, douze PNJ, aucun lien mort ; aucun effet appliqué par changement de lieu.'],
 ['Indice caché','Révéler une seule copie anonymisée','Seul l’indice choisi devient public ; autres indices restent cachés.'],
 ['Acte 3','Choisir expertise, accord surveillé ou publication','Trois issues avec conséquences ; aucune n’exige de vaincre un adversaire.'],
 ['Quatre séances prévues','Activer puis conclure la première','Les scènes prévues appartiennent au bon acte ; aucune séance déjà accomplie à l’import.'],
 ['Butin : 101 euros de recette, trois PJ','Partager 33 à chacun et conserver 2','101 au total ; absence de monnaie de table ou d’avantage mécanique inventé.'],
 ['Storyboard et Sound-OS','Ouvrir un moment puis lire un signal à faible volume','Bon schéma et bon signal synthétique de 4 s ; aucune voix, lampe, MIDI ou TTS prétendument configuré.'],
 ]],
 ['JE','Tests d20, conditions et critiques','natif',2,'Livre COC2 p. 56-61, 87-88 ; rules/resolution-des-jets.md ; coc.ts','Dés préparés dans les cas chiffrés ; les lancers UI sont aléatoires. Prendre son temps et impossible restent soumis au MJ.',[
 ['H00, base AGI 2 choisie dans le panneau','Préparer difficulté 15 sans modificateur','Un d20 et bonus +2 ; aucune addition AGI+INT ni comptage de dix succès.'],
 ['Base +2, difficulté 15, dé préparé 13','Résoudre ce résultat contrôlé','Total 15 : réussite, marge 0. Avec 12 : échec, total 14.'],
 ['Base +2, difficulté 25, dé 20','Résoudre le résultat préparé','Réussite critique malgré total 22 inférieur à 25.'],
 ['Base +20 synthétique, difficulté 5, dé 1','Résoudre le résultat préparé','Échec critique malgré total 21 ; aucun bonus du héros ne supprime le 1.'],
 ['Dés préparés [4,17], dé bonus','Résoudre avec un dé bonus puis un dé malus','Naturel 17 pour bonus, 4 pour malus ; les deux ne s’additionnent pas.'],
 ['Panneau au d20','Régler bonus 1 et malus 1, puis bonus 2 et malus 0','Annulation : un d20 ; surplus bonus : seulement deux d20 et le meilleur.'],
 ['Base +2, conditions successives 1/2/3/−1/−2/−3','Comparer les préparations','Bonus total +4/+7/+12/0/−3/−8 ; trois conditions plafonnent à ±10.'],
 ['Base +2, deux alliés autorisés','Régler Aides à 2','Bonus total +6, sans test de réserve ni ressource partagée.'],
 ['Base +2 hors combat, seuil 10, temps disponible','Prendre son temps','Total 12 sans dé, aucun critique ; durée décalée. Contre 15, le MJ refuse cette option insuffisante.'],
 ['Base +5, seuil 5, mode Rapide et furieux autorisé','Activer le mode et résoudre','Réussite automatique sans critique ; si base < seuil, le moteur lance.'],
 ['Dé préparé 18 ; plage critique à 18','Résoudre contre DEF élevée','Réussite critique ; bonus critique de l’arme ajouté manuellement aux DM.'],
 ['Dé préparé 3 ; échec critique jusqu’à 3','Résoudre un événement traumatisant de rang 2','Échec critique ; choc et conséquences arbitrés, aucune séquelle automatique inventée.'],
 ]],
 ['SA','Santé, RD et seuils','natif',1,'Livre COC2 p. 71-73, 88 ; rules/sante-et-blessures.md ; encaissementDeCoc.ts ; HealthInterpreter.ts','Actions perdues, tests CON, séquelles, guérison hebdomadaire et DEF corrigée sont suivis par le MJ ; ne pas confondre cases subies et PV restants.',[
 ['S01, 0 case, RD2','Saisir 15 DM bruts de coup ou projectile dans Combat-OS','13 cases noircies ; Affaibli ; rappel CON10, pas 15 cases ni PV soustraits.'],
 ['S02, 4 cases, RD2','Appliquer 3 DM bruts','5 cases, Contusionné ; −1 aux actions physiques et à l’initiative.'],
 ['S03, 9 cases, RD2','Appliquer 3 DM bruts','10 cases, Affaibli ; −3 et rappel de CON10 pour ne pas perdre la prochaine action.'],
 ['S04, 14 cases, RD2','Appliquer 3 DM bruts','15 cases, Blessé ; −5, mouvement réduit, action perdue et CON15 annoncés.'],
 ['S05, 19 cases, RD2','Appliquer 3 DM bruts','20 cases, Mourant ; −10, inconscience et CON20 rappelés, résolution à la table.'],
 ['S06 déjà à 20, RD2','Appliquer 3 DM bruts','Échelle reste 20 ; rappel coup de grâce CON20, pas 21 cases.'],
 ['S08, CON2, RD0, intact','Comparer deux copies : coup de 22 puis coup de 23','22 atteint Mourant sans mort instantanée ; 23 dépasse 20+CON, tué sur le coup annoncé.'],
 ['S09, 3 cases, RD2','Saisir 5 DM sans protection (feu)','8 cases ; RD ignorée une seule fois. Aucun jet de feu inventé.'],
 ['S07, 10 cases','Soigner 3, puis réinitialiser et soigner 30','7 cases, puis 0 ; jamais de case négative. Tests et durée des soins restent au MJ.'],
 ['S07 à 10, AGI et INT connues','Préparer successivement AGI puis INT','AGI subit −3, INT non physique ne le subit pas ; case Action physique permet l’exception.'],
 ['S07, initiative de base 10+INT+PER','Utiliser Jet système de Combat-OS','Initiative de base −3, sans dé ; égalité PJ/PNJ rangée manuellement.'],
 ['S01 critique préparé puis dégâts atteignant 20','Consigner la séquelle et les soins de stabilisation','Séquelle seulement critique ET 20 ; saisie manuelle, pas de tirage automatique de table.'],
 ]],
 ['ET','États préjudiciables et arbitrages','manuel',1,'Livre p. 63-65, 85-86 ; rules/etats-et-conditions.md ; initiative-et-deroulement-du-tour.md','Le panneau applique l’état choisi ; restrictions d’action, Init./DEF et déplacements supplémentaires restent au MJ.',[
 ['PJ indemne, base +2','Comparer Fatigué puis Épuisé dans le panneau','Totaux 0 puis −3 ; retenir le pire état, pas −7 en additionnant les deux.'],
 ['PJ renversé, attaque base +2','Choisir Renversé puis se relever avec une action d’attaque','Attaque à −3 ; retirer l’état après l’action ; pas de retrait automatique par déplacement sur carte.'],
 ['PJ surpris, immobilisé ou inconscient','Tenter de déclarer une action interdite','Le MJ refuse ; le logiciel ne constitue pas un verrou complet des actions.'],
 ['Round de six secondes','Choisir action limitée ou mouvement+attaque ou deux mouvements','Une seule combinaison autorisée ; pas de troisième action sans capacité ou effet explicite.'],
 ]],
 ['HE','Échelle du héros','natif',2,'Livre p. 80-82 ; rules/jauges-et-ressources-individuelles.md ; bonusDuHeros/ajouterLeHeros','Au test seulement dans le panneau ; Init., DEF, DM et mouvement suivent une dépense arbitrée. Une réussite grâce au héros ne regagne pas un échelon.',[
 ['H00 échelon 0, jet terminé','Examiner les options de dépense','Aucun bonus achetable ; échelle jamais négative.'],
 ['H01 échelon 1, test manqué de 2 hors critique','Dépenser un échelon après le jet','+2 au même résultat et échelon 0 ; naturel inchangé.'],
 ['H02 échelon 2, test terminé','Dépenser deux échelons pour doubler','+4, échelon 0, dépense unique persistante.'],
 ['H09 échelon 9, test terminé','Acheter le bonus simple','+2 et échelon 8 ; le +5 n’est pas disponible avant 10.'],
 ['H10 échelon 10, test terminé','Acheter le bonus simple','+5 et échelon 9 ; reprendre un jet lit le nouveau palier.'],
 ['H20 échelon 20, test terminé','Choisir Légende','+10 et échelon 19 ; Légende ne se double pas ; autres avantages tenus par le MJ.'],
 ['H10, résultat naturel 1','Dépenser +5 après ce résultat contrôlé','Total augmenté mais toujours échec critique.'],
 ['H20 déjà au maximum, critique naturel','Utiliser le gain proposé puis tenter une seconde fois','Échelle plafonnée à 20 ; pas de gain répété pour le même jet.'],
 ]],
 ['BL','Échelle du blues','natif',2,'Livre p. 84 ; rules/jauges-et-ressources-individuelles.md ; preparerCoc','Un seul modèle d’évolution par PJ ; augmentation, régression et conséquences fictionnelles décidées à la table.',[
 ['B04, échelon4, VOL connue','Préparer VOL','Aucun bonus du blues avant 5.'],
 ['B05/B10/B15/B20','Préparer VOL puis une interaction en sens négatif','VOL +1/+3/+5/+10 ; interaction −1/−3/−5/−10. Aucun cumul des quatre paliers.'],
 ['B10, perception d’émotions','Sélectionner le sens négatif du blues','PER −3 ; la PER ordinaire n’est pas pénalisée automatiquement.'],
 ['B10, coercition CHA','Sélectionner le sens positif','CHA +3 ; Héros indisponible car modèle Blues.'],
 ['B15, jour de repos convenu','Ramener manuellement l’échelle à14 puis préparer VOL','Bonus +3 au lieu de +5 ; persiste ; aucun soin de santé physique associé.'],
 ]],
 ['MA','Enquête, opposition, social, Voies et dangers','manuel',0,'Corpus COC2 : investigation p.67-68, opposition p.59-61, social p.65-67, Voies p.28-29, poursuites p.97-107, PNJ p.108-111, dangers p.61-65','Les feuilles n’inventent pas de modules. Capacités officielles non extraites du seul corpus de synthèse ; compléter avec le livre pour une création réglementaire.',[
 ['Boîtier, évidence déjà acquise ; total préparé 16','Comparer le même résultat aux seuils 10/15/20','Deux détails secondaires révélés, le troisième caché ; évidence conservée même sous 10.'],
 ['Deux opposants, critique contre normal de total supérieur','Comparer les résultats puis deux critiques de totaux différents','Critique gagne contre normal ; entre critiques, plus haut total gagne. Comparaison finale manuelle.'],
 ['Claire positive +5, persuasion bonne +5, INT2','Saisir Autre +10 dans le test social opposé','Bonus total +12 ; accord selon résultat opposé ; aucun sentiment modifié automatiquement.'],
 ['Yann négatif −5, négociation bonne +5','Préparer l’échange puis essayer une coercition réussie','Modificateurs se compensent pour négociation ; coercition réussie dégrade le sentiment d’un cran à la table.'],
 ['Léon et PJ en course optionnelle, distance Proche','Résoudre une manœuvre normale puis une critique contrôlée','Un cran puis deux crans ; au-delà de Très éloigné, Semé ; échec ne supprime pas le rendez-vous alternatif.'],
 ['V01 en 03, capacité témoin explicitement non canonique','Saisir nom/description/acquis, puis exporter/recharger la fiche','Les trois types sont conservés ; aucun effet de règle de cette capacité fictive.'],
 ['Un personnage reçoit 1XP de séance, rang1 acquis et 2XP disponibles','Acheter manuellement le rang2 puis tenter de sauter au rang4','Coût2, XP0, rang2 acquis ; saut refusé par le MJ, pas de validateur automatique promis.'],
 ['Chute de6m, AGI10 réussi contrôlé','Réduire les trois premiers mètres puis lancer les dégâts restants','1d6 DM sans protection ; saisie du résultat brut, RD ignorée.'],
 ['Bande de trois sbires, affrontement Pulp convenu','Consigner une touche sans jet de DM puis recalculer le surnombre','Un membre retiré et bonus recalculé ; suivi manuel, pas de santé20 prétendument adaptée à la bande.'],
 ['Figurant ou second rôle standard','Comparer le 20 naturel à sa règle de rôle','Pas de réussite critique pour ces rôles ; arbitrer le résultat, car le panneau générique ne désactive pas cette plage.'],
 ]],
 ['OP','Option 3d6 séparée','à vérifier',2,'Livre p.60-61 ; pilote COC_driver_gmos_finir_3d6.gmos-driver ; coc.ts ; manuel 54-Jeu-COC.md','Même ID que le d20 : remplacement volontaire hors partie puis retour au d20. Critiques18/3 = convention GM-OS signalée, non chiffrée dans le livre.',[
 ['Copie jetable du pilote, aucune partie en cours','Remplacer par la variante 3d6, puis ouvrir un test','3d6 ; difficultés 8/11/14/17/20 ; la variante ne crée pas un second pilote indépendant.'],
 ['Variante 3d6, série préparée [1,3,4,6] avec bonus','Résoudre puis comparer le mode malus à deux d6','Trois meilleurs =13 ; malus deux d6 seulement.'],
 ['Variante 3d6, conditions2 puis santé10 puis Blues10','Comparer les modificateurs au mode d20','Conditions +3 au lieu de+5 ; santé −2 au lieu de−3 ; Blues ±2 au lieu de±3.'],
 ['Fin d’essai 3d6','Réimporter explicitement COC-2.0.0-d20.gmos-driver avec Remplacer','Retour d20 et difficultés5/10/15/20/25 ; aucune campagne réelle remplacée par le test.'],
 ]],
 ];
 for(const[prefixe,mecanique,support,a,source,limite,lignes]of groupes){const ids=[];for(const[i,[precondition,action,attendu]]of lignes.entries()){const id=`${prefixe}-${String(i+1).padStart(2,'0')}`;ids.push(id);cas.push({id,archive:noms[a],precondition,action,attendu,source,preuvePrevue:'Capture ou journal, valeurs avant/après et contrôle après rechargement ; dés contrôlés pour résultats préparés.'});}matrice.push({id:prefixe,mecanique,source,support,casIds:ids,archive:noms[a],limite});}
 ecrire('cas-de-recette.json',JSON.stringify(cas,null,2));ecrire('matrice-couverture.json',JSON.stringify(matrice,null,2));
 ecrire('MATRICE-COUVERTURE.md','# COC2 — couverture\n\n| Mécanique | Support | Archive | Cas | Limite |\n| --- | --- | --- | --- | --- |\n'+matrice.map(m=>`| ${m.mecanique} | ${m.support} | ${m.archive} | ${m.casIds.join(', ')} | ${m.limite} |`).join('\n')+'\n\nSources précises dans matrice-couverture.json. Aucune réserve de table partagée ni module COC spécifique annoncé.');
 ecrire('CAHIER-DE-RECETTE.md','# COC2 — cahier de recette\n\nTous les résultats humains commencent NON TESTÉS. Les dés explicitement préparés sont des exemples contrôlés : les lancers normaux restent aléatoires. Réinitialiser le seul laboratoire avant un cas incompatible.\n\n'+cas.map(c=>`## ${c.id} — ${c.archive}\n\nPrécondition : ${c.precondition}\n\nAction : ${c.action}\n\nAttendu : ${c.attendu}\n\nSource : ${c.source}\n\nPreuve prévue : ${c.preuvePrevue}\n\nStatut : **NON TESTÉ**\n`).join('\n'));
 const q=s=>'"'+String(s).replaceAll('"','""')+'"';ecrire('resultats.csv','id;archive;precondition;action;attendu;statut;observe;preuve\n'+cas.map(c=>[c.id,c.archive,c.precondition,c.action,c.attendu,'NON TESTÉ','',''].map(q).join(';')).join('\n'));
 ecrire('LIRE-MOI.md',`# COC2 — Les Minutes de Verre et deux laboratoires\n\nLot du ${date.slice(0,10)} pour Thomas D. (p-1), Marie C. (p-2), Lucas R. (p-3), issus du relevé minimal autorisé de l’export fourni. Aucun ancien PJ, avatar, note ou secret recopié. L’export complet historique a été retiré du dépôt ; le relevé autorisé reste disponible.\n\nImporter **01-Les-Minutes-de-Verre.gmos en premier**, via Bibliothèque → Importer un bundle Nexus → tel quel. Pilote COC2 **2.0.0**, ID custom-1793122664880, gabarit tpl-1793122664880. Dépendances embarquées : si l’ID existe déjà, vérifier la version ; une version ancienne ou la variante 3d6 demande un remplacement explicite du pilote par le meneur, pas une promesse de remplacement automatique. Le fichier COC-2.0.0-d20.gmos-driver est fourni séparément.\n\nTrois nouveaux PJ complémentaires dans 01, neuf dans 02, douze dans 03, tous d’IDs différents et rattachés aux mêmes trois joueurs : **24 nouveaux PJ**. Profils aux valeurs choisies, sans conformité à un budget novice revendiquée. Les voies officielles et capacités ne sont pas reproduites depuis le seul corpus de synthèse : les compléter avec le livre pour une partie réglementaire. V01 porte un texte technique NON CANONIQUE, sans effet de règle. Les armes et protections sont des profils synthétiques clairement nommés.\n\n01 : enquête originale de deux à quatre séances, quatre actes, seize scènes, huit lieux, douze PNJ, douze indices et trois conflits optionnels. Évidences sans jet ; trois conclusions possibles. Séances toutes prévues. Les plans sont des schémas ; les fiches image sont des cartouches, pas des portraits illustrés. Bannière et identité COC déjà créées embarquées.\n\n02 : Santé et états. 03 : Héros, Blues et tests. Réimporter **le seul .gmos du laboratoire voulu**, puis **Remplacer pour cette campagne**, pour retrouver les états de départ. Le mode Rejouer n’est pas un soin et ne garantit pas cette remise à zéro. Ne pas remplacer 01. Codes Sxx/Hxx/Bxx/V01 sur les noms des PJ. Même un labo dupliquant des décors reste un espace hors fiction.\n\nFiche du jeu : nécessite le gestionnaire HTML **moteur22 ou ultérieur**, modèle coc2-fr et correspondance coc déjà intégrée dans le dépôt. Les .gmos ne mettent pas à jour le moteur de l’application. Installer/mettre à jour GM-OS séparément si nécessaire.\n\nL’option **3d6** est fournie à part, même ID que le d20 : ne pas l’importer en même temps pour espérer deux pilotes. Faire OP-01 à OP-04 sur une instance jetable puis revenir explicitement au d20. Les critiques18/3 sont une convention du moteur, signalée dans le manuel.\n\nSuivre CAHIER-DE-RECETTE.md et noter dans resultats.csv. ${cas.length} cas humains NON TESTÉS. Les tests automatiques ne valent pas une partie de David. Consulter RAPPORT-DE-VERIFICATION.md et ANOMALIES-CONNUES.md avant tout essai réel. Aucune installation dans les données personnelles réalisée par ce lot.`);
 ecrire('MODULES-ET-LIMITES.md','# COC2 — modules et réglages\n\nAucun module spécifique COC compatible enregistré ; pas de module emprunté à un autre jeu. Les outils généraux portent cartes, scènes, indices, rencontres, butin et médias. Les effets de cartes et les éclairages ne sont pas automatiques.\n\nNatif : préparation/résolution d20 ou option3d6, conditions, aides, bonus/malus, santé physique au test, Blues choisi, bonus Héros après test, RD sur coups, cases et rappels des seuils, initiative fixe diminuée par santé, fiche HTML liée.\n\nManuel : DEF et malus de protection, interdictions et économie d’actions, égalités PJ/PNJ, séquelles, soins/guérison, choc psychique, approches/sentiments, priorités critiques en opposition, durées/recherches, poursuites, rôles et bandes, capacités officielles et XP. Pas de réserve partagée. Les paliers de santé des profils réduits ne sont pas reproduits dans ce lot standard20.\n\nPas de tables Table-OS supplémentaires : aucune table officielle remplacée. Les règles sont consultées dans le corpus existant ; il n’est pas embarqué dans les .gmos. Aucun appareil, IA, TTS ou voix enregistrée configuré.');
 ecrire('REPRODUIRE.md','# Reproduire dans le dépôt GM-OS\n\nDépendances déjà installées ; aucun paquet supplémentaire.\n\n```text\nnode outils/campagnes-de-recette/coc.mjs\nnpx vitest run --config outils/campagnes-de-recette/vitest-coc.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/coc/verification-archives.json\nnode outils/campagnes-de-recette/coc-verifier-plugin.mjs\nnode outils/campagnes-de-recette/coc-visuels.mjs\nnpm run build\nnpx playwright test e2e/campagneDeRecetteCoc.spec.ts --reporter=list\nnode outils/campagnes-de-recette/emballer-coc.mjs\n```\n\nLe build et les essais applicatifs ne se lancent qu’après autorisation locale : services, profils, corpus et sauvegardes jetables exclusivement. Lire les scripts et les SHA avant tout rejeu ; une régénération invalide les rapports. Aucun dossier personnel requis. Après les rendus, examiner les captures et consigner leurs empreintes ; ne pas précocher une revue non faite.');
 return cas;
}
