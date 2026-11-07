import fs from 'node:fs';
import assert from 'node:assert/strict';
const fichier='outils/campagnes-de-recette/runequest-recette.mjs';
let t=fs.readFileSync(fichier,'utf8').replaceAll('\r\n','\n');
const remplacer=(a,b)=>{assert(t.includes(a),a);t=t.replaceAll(a,b);};
remplacer('pilote RuneQuest 2.0.0','pilote RuneQuest 2.1.0');
remplacer('RuneQuest-2.0.0.gmos-driver','RuneQuest-2.1.0.gmos-driver');
remplacer('Armure et PV locaux lisibles ; les localisations ne sont pas automatiquement déduites avec les PV totaux.', 'Armure 5, maximum local 2 et total 8 distincts. Utiliser le panneau Coups localisés pour appliquer la zone et le total ; suivre les cas LOCAL.');
remplacer('C07, bras droit à 0', 'C07, bras droit 0/3 : maximum 3 et dégâts reçus 3');
remplacer('C08, tête −4 (double des 4 PV de zone), PV totaux 4', 'C08, tête −4/4 : maximum 4, dégâts reçus 8, PV totaux 4');
const nouveaux=` ['local','natif','Coups localisés 2.1.0, cible, armure et soins',1,'Livre p. 146–148 ; combat.coupsLocalises ; coupsDeRuneQuest.ts ; guide RuneQuest, correction RQ-A2',[
  ['Pilote 2.0.0 déjà installé sous le même ID','Importer explicitement RuneQuest-2.1.0.gmos-driver avec Remplacer avant les campagnes.','Version 2.1.0, 320 champs, sept compteurs degats_<zone> et combat.coupsLocalises ; Nexus seul ne garantit pas ce remplacement.'],
  ['C07 ajouté à Combat-OS','Lire la carte du bras droit.','Bras droit 0/3 ; maximum 3 inchangé, dégâts reçus 3, total 9/12.'],
  ['C08 ajouté à Combat-OS','Lire la carte de tête.','Tête −4/4 ; maximum 4 et dégâts reçus 8 séparés ; effet au double annoncé, hémorragie à suivre à la table.'],
  ['C09 initial : total 8, jambe droite 2/2, PA 5','Sélectionner la jambe droite, saisir 5 puis Encaisser.','Armure arrête tout : dégâts locaux 0 et total 8 inchangés ; pas de double retrait de PA.'],
  ['C09 initial : total 8, jambe droite 2/2, PA 5','Sélectionner la jambe droite, saisir 10 puis Encaisser.','10 − 5 = 5 nets, plafonnés à 4 ; dégâts locaux 4, zone −2/2, total 4 ; maximum 2 conservé.'],
  ['C09 après le cas précédent','Saisir 99 puis Soigner sur la même zone.','Seuls 4 points rendus : dégâts locaux 0, jambe 2/2, total 8 ; les autres blessures ne sont pas effacées.'],
  ['C07 avec 3 dégâts au bras droit, total 9','Soigner 2 puis recharger.','Dégâts locaux 1, bras 2/3, total 11 ; valeurs persistées dans la fiche et Combat-OS.'],
  ['PNJ lié : total 12, bras droit maximum 3, PA 2, dégâts 0','Sur sa carte, Encaisser 8 au bras droit.','6 dégâts retenus sur le bras et le total : zone −3/3, total 6 ; fiche du PNJ et journal actualisés.'],
  ['Adversaire autonome préparé avec les mêmes valeurs','Encaisser le même coup via sa carte.','Même zone −3/3 et total 6 sur le plateau ; aucun faux personnage de campagne créé.'],
  ['PJ et PNJ dans Combat-OS ; panneau de jet du PJ','Lancer puis Localiser le coup, choisir le PNJ et Porter le coup avec 2 dégâts.','PV maximum de la cible explicitement nommés ; armure de la zone retirée une fois, seule la cible reçoit le net ; lanceur inchangé.'],
  ['Deux cibles aux maxima de zone différents','Changer la cible après le D20 puis sélectionner une cible sans valeur.','PV affichés changent sans nouveau D20 ; valeur manquante inconnue, aucun repli sur le lanceur. La tablette garde la localisation seule.'],
  ['01 avec une note et un coup déjà porté, 02 blessé pendant les essais','Recharger puis réimporter uniquement 02 avec Remplacer.','Zone et total persistent avant remplacement ; 02 revient aux dégâts préparés C07=3/C08=8/C09=0 ; note et blessure de 01 conservées.']
 ]],
`;
remplacer(" ['magie','manuel'",nouveaux+" ['magie','manuel'");
remplacer('Le fichier RuneQuest-2.1.0.gmos-driver permet un remplacement explicite si nécessaire.', 'Si une version 2.0.0 est déjà installée, importer **d’abord RuneQuest-2.1.0.gmos-driver avec Remplacer dans les pilotes** ; vérifier 2.1.0 et les coups localisés avant les campagnes. Une dépendance Nexus du même ID peut être conservée. Si 01 est déjà joué, préserver son export et importer seulement les laboratoires souhaités ; ne pas remplacer une aventure jouée pour mettre à jour le pilote.');
remplacer('C07 bras droit 0, C08 tête −4', 'C07 bras droit 0/3 (3 dégâts), C08 tête −4/4 (8 dégâts)');
remplacer('Coûts magiques, contrôle de l’INT libre, Runes opposées, progression et conséquences des blessures restent manuels.', 'Les coups localisés sont natifs dans Combat-OS : armure, dégâts de zone et total, plafond du membre et soins. Les maxima restent séparés des dégâts reçus. Coûts magiques, contrôle de l’INT libre, Runes opposées, progression et effets temporisés des blessures restent manuels.');
remplacer('Les sept localisations se lisent au jet mais leurs dégâts/armures se gèrent sur la fiche.', 'Les sept localisations se tirent au jet ; au meneur, les PV maximum affichés suivent la cible. Sur la carte Coups localisés ou par Porter le coup : armure, zone et total, plafond du membre et soin utilisent le moteur natif. Les sept maxima pv_<zone> et compteurs degats_<zone> sont distincts.');
remplacer('Une régénération invalide les anciens rapports dépendants ; l’emballage contrôle les empreintes.', 'Le générateur exige un pilote 2.1.0 de 320 champs : export corrigé s’il existe, sinon RuneQuest-2.1.0.gmos-driver livré, ou chemin GMOS_PILOTE_RUNEQUEST. L’export source des joueurs n’est plus présent : le relevé minimal autorisé est réutilisé sans relire de campagnes. L’ancien lot 2.0.0 et son CSV restent dans historique/2026-10-30-2.0.0, hors du ZIP courant. Une régénération invalide les anciens rapports dépendants ; l’emballage contrôle les empreintes.');
fs.writeFileSync(fichier,t);
console.log('Cahier adapté : douze cas LOCAL ajoutés.');
