import fs from 'node:fs';
import path from 'node:path';
export function ecrireRecetteShadowrun(dir,{noms,date}){
 const cas=[],matrice=[];
 function groupe(id,mecanique,fichier,support,archive,limite,lignes){
  const source=fichier.startsWith('src/')||fichier.startsWith('documentation/')?fichier:'docs/systems/shadowrun-anarchy/rules/'+fichier+'.md';
  if(!fs.existsSync(source))throw Error('Source introuvable : '+source);
  const cs=lignes.map(([precondition,action,attendu],i)=>({id:`${id}-${String(i+1).padStart(2,'0')}`,archive:noms[archive],precondition,action,attendu,source,preuvePrevue:'Capture, valeurs avant/après et contrôle après rechargement.'}));cas.push(...cs);matrice.push({id,mecanique,source,support,casIds:cs.map(c=>c.id),archive:noms[archive],limite});
 }
 groupe('JET','Réserve, seuils, spécialisation','resolution-des-jets','natif',2,'Opposition et répétition arbitrées.',[
 ['R00, compétence 1 à 5 et attribut Logique 5','Composer compétence 1 + Logique, seuil 3, risque 0','10 d6 ; 5/6 succès ; aucun 1 normal ne provoque de complication.'],
 ['R00, même réserve','Cocher spécialisation puis lancer','12 d6 ; aucun autre modificateur ne change la réserve.'],
 ['R00, réserve 10','Essayer seuils 2, 3, 4, 6 et 8','Le panneau reprend le seuil choisi ; réussite si succès au moins égaux au seuil.'],
 ['R00, succès contrôlés dans test automatisé','Résoudre 7 succès au seuil 3','Réussite exceptionnelle à 4 succès nets ; 6 succès restent une réussite ordinaire.'],
 ['R00, compétence absente','Composer seulement Logique','5 dés ; absence de compétence vaut zéro, pas refus.'],
 ]);
 groupe('RIS','Dés de risque et RR','la-prise-de-risque-des-de-risque-et-reduction-du-risque','natif',2,'Complications narratives et échec forcé critique au MJ.',[
 ['R00, RR 0','Choisir normale puis risquée','Repères 2 puis 4 dés de risque, bornés à la réserve ; les succès de risque valent double.'],
 ['R01, RR 1','Choisir normale','5 dés de risque ; le premier 1 de risque est ignoré.'],
 ['R02, RR 2','Choisir normale','8 dés de risque ; deux 1 ignorés.'],
 ['R03, RR 3','Choisir suicidaire','Repère borné à la réserve ; RR ne dépasse jamais 3.'],
 ['R00, résultats contrôlés : 1/2/3 uns de risque','Résoudre chaque jet avec RR 0','Mineure/critique/désastre ; gains Anarchy 0/+1/+2 ; désastre fait échouer.'],
 ['R00','Saisir moins de zéro puis plus que la réserve de risque','Valeurs bornées entre zéro et la réserve ; aucun dé supplémentaire ajouté.'],
 ]);
 groupe('AVA','Avantage et opposition','jets-opposes-aide-et-cooperation','natif',2,'Opposition à égalité et aide qualifiée arbitrées.',[
 ['R00','Activer avantage de situation','4+ réussit, réserve inchangée.'],['R00','Activer désavantage','6 seul réussit.'],['R04, grave 1','Choisir avantage de situation','Avantage et blessure grave s’annulent : 5+.'],['Deux PJ, tests opposés avec 4 succès chacun','Comparer les deux jets','Égalité non départagée ; si un vainqueur est indispensable, arbitrer l’initiateur selon le corpus. Pas de succès net inventé.'],['PJ aidant qualifié','Déclarer son aide avant le test','Avantage justifié ; aucune addition libre de dés.'],
 ]);
 groupe('ANA','Anarchy et Essence','jauges-et-ressources-individuelles','natif',2,'Gains narratifs et changement de scénario manuels ; maximum 99 du champ ne constitue pas une règle de jeu.',[
 ['R05, Anarchy 0','Essayer avantage payant puis relance','Dépense impossible ; aucun compteur négatif.'],['R00, Anarchy 4 et risque 0','Acheter avantage puis lancer','Anarchy 3 ; succès 4+ ; mouvement consigné.'],['R00, Anarchy disponible, complication initiale critique','Relancer tous les dés pour 1 Anarchy','Même nombre de dés ; critique conservée, aucun deuxième gain de complication.'],['R00, jet initial sans complication','Relancer avec des 1 de risque','Aucune nouvelle complication ; Anarchy diminuée de 1.'],['R06 Essence 5, R07 Essence 3','Cocher magie sur un jet','Respectivement 1 et 2 succès annulés ; réserve inchangée.'],['R08 Essence 1','Jouer une interaction sociale','Désavantage social arbitré manuellement ; le panneau ne le déduit pas automatiquement.'],['R09 Essence 0','Consulter la fiche sans tenter une action de fiction','Mort selon la règle ; le champ seul ne bloque pas automatiquement toutes les actions : limite à relever.'],
 ]);
 groupe('SAN','Seuils et aggravation','sante-et-blessures','natif',1,'Compteurs font foi ; position graphique indique la pire blessure.',[
 ['S00, seuils physiques 6/9/12, sain','Appliquer VD 6 physique','Aucune blessure.'],['S00 sain','Appliquer VD 7 physique','Une légère, position 1.'],['S00 sain','Appliquer VD 9 puis rejouer avec VD 10','9 : légère ; 10 : grave, position 3.'],['S00 sain','Appliquer VD 12 puis rejouer avec VD 13','12 : grave ; 13 : incapacitante, position 4.'],['S02, deux légères','Appliquer VD 7','La nouvelle légère devient grave ; deux légères conservées.'],['S03, deux légères et une grave','Appliquer VD 7','Incapacitante ; aucun compteur au-delà de sa capacité.'],['S05, capacité légère 3 et grave 2, légères 2','Appliquer deux fois VD 7','Troisième légère puis première grave ; positions 3 puis 4.'],['S06, légère 1, grave 1, incapacitante 1','Soigner une blessure puis recharger','Incapacitante effacée en premier ; légère et grave conservées.'],
 ]);
 groupe('DEG','Familles de dégâts et VD finale','degats-et-types-de-degats','natif',1,'Le MJ ajoute les succès nets à la VD avant saisie.',[
 ['S00 sain, principale 6, secondaire 4, sans armure 3, mental 5','Rejouer VD 6 dans chacune des quatre familles','Principale : zéro ; secondaire/sans armure/mental : une légère.'],['S07, seuils tous à zéro, Force 3 Volonté 4','Appliquer VD 4 physique puis mental en réinitialisant','Physique : légère ; mental : aucune blessure.'],['S00, dégâts létaux ou étourdissants','Infliger une incapacitante et annoncer le type','Compteur incapacitante natif ; état mourant décidé par MJ si létal.'],
 ]);
 groupe('ETA','Effets et soins','etats-et-conditions','natif',1,'Durée des légères, stabilisation et éligibilité des soins au MJ.',[
 ['S01, légère 1','Cocher légère récente au jet puis terminer la prochaine narration','6 seul réussit quand coché ; retirer manuellement le marqueur au bon terme.'],['S04, incapacitante 1','Ouvrir le panneau de test','Test annoncé impossible ; ne pas résoudre une action du personnage.'],['S08, Essence 2','Préparer soin d’une blessure grave','Seuil 5+2=7 ; une seule tentative de premiers soins et un sort par case, à noter manuellement.'],
 ]);
 groupe('TOUR','Narrations et combat','initiative-et-deroulement-du-tour','manuel',0,'Aucun jet d’initiative ni coût d’action automatique.',[
 ['Rencontre du dépôt préparée','Importer la rencontre et ordonner les narrations à la table','Participants corrects ; ordre décidé sans jet d’initiative inventé.'],['PJ avec 1 Anarchy','Dépenser pour une action supplémentaire','Retirer 1 sur la jauge et jouer l’action ; pas de gain d’action automatique annoncé.'],
 ]);
 groupe('POR','Distances','distances-et-portees','manuel',0,'Plans sans échelle et portée à annoncer.',[
 ['Passerelle, carte schématique','Annoncer une distance puis un déplacement','Le MJ fixe portée et accès ; aucun bonus automatique au déplacement de pion.'],
 ]);
 groupe('POU','Poursuite','poursuites','manuel',0,'Écart et conséquences suivis dans les notes.',[
 ['Scène de la rampe','Choisir course ou traces du leurre','Pilotage + Agilité et risque annoncés ; perdre laisse deux voies vers Azur.'],
 ]);
 groupe('DRA','Drain','le-drain-magique','manuel',2,'Le logiciel ne mémorise pas l’origine drain et ne refuse pas ses soins.',[
 ['R06, magie et complication mineure','Noter le drain puis narration suivante','Désavantage magique temporaire saisi à la main.'],['R06, complication critique puis désastre en essais distincts','Appliquer les conséquences du drain','Une légère puis une incapacitante ; ne pas transformer ces conséquences en VD de seuil.'],['Blessure explicitement étiquetée drain dans les notes','Proposer premiers soins et magie','Refus par le MJ ; repos naturel seulement. Ne pas annoncer un refus automatique de GM-OS.'],
 ]);
 groupe('MAT','Matrice et connexion','le-piratage-et-les-modes-de-connexion-a-la-matrice','manuel',2,'Mode, risque minimum, seuil et surveillance de DIEU non automatisés.',[
 ['Vif, champs piratage renseignés, corpus ouvert','Déclarer RA, cold-sim puis hot-sim','Reporter les modificateurs et risques du corpus avant chaque jet ; le déplacement de carte ne les règle pas.'],['Mode cold-sim ou hot-sim déclaré','Subir un biofeedback','Mental étourdissant ou mental létal ; pas de dégât physique automatique en hot-sim.'],
 ]);
 groupe('RIG','Rigging','le-rigging-et-la-plongee-dans-les-vehicules','manuel',0,'Aucun simulateur de flotte ; résistance véhicule contradictoire dans le livre, arbitrage explicite.',[
 ['Sillage et drone de maintenance','Comparer plongée, siège, manuel, autonome','Priorité plongée > siège > manuel > autonome ; première commande de même niveau prévaut.'],['Rigger en plongée, case grave du véhicule cochée','Appliquer le biofeedback','Une légère au rigger ; mental étourdissant cold-sim, létal hot-sim ; gravité véhicule arbitrée.'],
 ]);
 groupe('FLA','Flashback et préparation','le-flashback-et-la-planification-en-deux-etapes','manuel',0,'Réserves disponibles, transfert de succès et paiement justifié à la table.',[
 ['Scène préparer, réserve à zéro','Réussir 3 succès en planification','Ajouter manuellement 3 points, ou 1 si temps limité (2 succès par point).'],['Réserve 4, flashback de coût 2 justifié par le plan','Payer le flashback','Réserve 2 ; aucun achat de dés supplémentaires.'],
 ]);
 groupe('TAB','Réserves collectives','monnaie-de-table','natif',2,'Menace seulement en narration partagée totale ; alimentation et désastre manuels.',[
 ['Réserve de planification, trois Hub','Augmenter puis dépenser 1','Réserve commune synchronisée, minimum zéro ; joueurs autorisés.'],['Réserve de menace, Hub joueur','Essayer de modifier la menace','Réserve visible, modification réservée au MJ.'],['Mode narration totale, menace 5 planification 4','Arbitrer le dépassement','Désastre collectif et menace remise à zéro par le MJ.'],
 ]);
 groupe('FIC','Fiche et progression','composition-de-la-fiche-de-personnage','natif',0,'Profils aux valeurs choisies ; aucun budget novice ni catalogue officiel d’atouts revendiqué.',[
 ['Vif, fiche HTML intégrée moteur 23','Ouvrir, changer pseudo et compétence, sauvegarder puis recharger','Valeurs GM-OS et fiche HTML cohérentes via les 120 clés reliées.'],['Sillage, capacité du moniteur ajustée','Ouvrir la fiche HTML','Capacité GM-OS conservée ; cinq champs GM-OS sans équivalent HTML restent documentés.'],['Fin de mission','Attribuer progression avec le livre','Décision et saisie manuelles ; aucun gain automatique inventé.'],
 ]);
 groupe('TON','Mission originale et limites','ton-registre-et-ambiance','manuel',0,'Médias schématiques ; pas de portrait illustré.',[
 ['Les quatre actes de 01','Résoudre sans violence ni intrusion Matrice','Copies, témoins et intervention manuelle permettent une issue complète.'],
 ]);
 groupe('INV','Inventaire des mécaniques','inventaire-des-mecaniques','à vérifier',2,'Matrice de synthèse, pas toutes les combinaisons ni tous les atouts.',[
 ['Pilote et corpus du lot','Comparer les mécaniques ci-dessus à la fiche','Aucune mécanique COC/RuneQuest/Degenesis transplantée ; règles manuelles identifiées.'],
 ]);
 groupe('CRIT','Réussite exceptionnelle et complications','degres-de-reussite-et-critiques','natif',2,'Échec forcé sur critique au MJ.',[
 ['R00, succès élevés et 3 uns non réduits','Résoudre au seuil 3','Désastre : échec malgré les succès ; +2 Anarchy.'],
 ]);
 groupe('GM','Import, droits et secrets','src/modules/system/archive/NexusService.ts','à vérifier',0,'Essais applicatifs à autoriser ; GM-05 historique à revérifier.',[
 ['Trois joueurs existants et PJ sentinelles fictifs','Importer 01, 02 puis 03','Trois identités conservées avec leurs avatars et anciens PJ ; nouveaux PJ ajoutés, pas de doublon.'],['Note ajoutée à 01 et labo 02 modifié','Réimporter seulement 02 avec Remplacer','02 réinitialisé ; note et PJ de 01 conservés.'],['Trois Hub 360/768/1180','Lancer chacun un test et sauvegarder une fiche','Trois jets reçus par le MJ et valeurs conservées après rechargement.'],['SECRET_MJ_SHADOWRUN_RECETTE dans les champs privés fictifs','Inspecter les trames de chaque Hub','Zéro marqueur privé transmis ; toute fuite est un ÉCHEC GM-05.'],['Hub d’un joueur','Tenter édition du PJ d’un autre joueur','Accès refusé ; relever toute modification acceptée.'],
 ]);
 fs.writeFileSync(path.join(dir,'cas-de-recette.json'),JSON.stringify(cas,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'matrice-couverture.json'),JSON.stringify(matrice,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'MATRICE-COUVERTURE.md'),'# Couverture Shadowrun Anarchy\n\n'+matrice.map(m=>`- **${m.id} — ${m.mecanique}** : ${m.support} ; ${m.archive} ; ${m.casIds.join(', ')}. Source : ${m.source}. Limite : ${m.limite}`).join('\n')+'\n');
 fs.writeFileSync(path.join(dir,'CAHIER-DE-RECETTE.md'),`# Shadowrun Anarchy — cahier du ${date.slice(0,10)}\n\nTous les ${cas.length} cas restent **NON TESTÉS par David**. Les résultats automatiques sont séparés. Pour les jets aléatoires, constater les dés réellement tirés ; les résultats imposés ne sont garantis que dans les tests automatisés.\n\n`+cas.map(c=>`## ${c.id} — ${c.archive}\n\nPrécondition : ${c.precondition}\n\nAction : ${c.action}\n\nAttendu : ${c.attendu}\n\nSource : ${c.source}\n\nPreuve : ${c.preuvePrevue}\n`).join('\n'));
 const csv=v=>'"'+String(v).replaceAll('"','""')+'"';
 fs.writeFileSync(path.join(dir,'resultats.csv'),'id;archive;precondition;action;attendu;statut;observe;preuve\n'+cas.map(c=>[c.id,c.archive,c.precondition,c.action,c.attendu,'NON TESTÉ','',''].map(csv).join(';')).join('\n')+'\n');return cas;
}
