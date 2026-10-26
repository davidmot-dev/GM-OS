import fs from 'node:fs';
import path from 'node:path';
import { titreAlien, scenesAlien, pnjAlien } from './alien-scenario.mjs';
const lignes = [
    ['AL-01','01','Eli, Stress 0','Lancer Attribut + Compétence puis noter les six.','Base et Stress séparés ; une réussite par 6.'],
    ['AL-02','01','Bonus d’aide/outil/situation','Composer une réserve supérieure à dix dés.','Bonus conservés et origines lisibles ; pas de plafond artificiel à dix.'],
    ['AL-03','01','Jet sans 1 de Stress','Forcer puis tenter un second forçage sans talent adapté.','Stress +1 et nouveau dé ; les six restent ; un forçage normal au plus.'],
    ['AL-04','01','Talent Vif de Samir','Forcer deux fois un jet d’Agilité sans Panique, puis un jet d’un autre Attribut.','Deux forçages seulement pour l’attribut couvert, jamais après Panique.'],
    ['AL-05','01','Jet contenant un 1 de Stress','Résoudre le test de Panique avant d’arrêter le verdict.','Résultat provisoire ; à 10+ l’action est annulée, même avec des six.'],
    ['AL-06','02','B01 Panique 7','Ouvrir le suivi, lancer Agilité puis comparer un autre Attribut.','Tremblement retire deux dés à l’Agilité ; autres jets inchangés.'],
    ['AL-07','02','B02 Panique 10','Résoudre l’effet et la contagion sur une sélection de Héros.','Cibles explicites, aucune double application en rouvrant le panneau.'],
    ['AL-08','02','B03 Panique 13','Terminer l’effet puis effectuer le bilan de séance.','Rappel du bilan conservé ; test Empathie sans Stress ni compétence.'],
    ['AL-09','02','Panique déjà en cours','Obtenir une nouvelle Panique inférieure puis égale sur copies indépendantes.','Profil français : inférieur donne l’effet suivant l’ancien ; égal conserve l’effet égal.'],
    ['AL-10','01','Mara, Nerfs d’acier','Comparer le modificateur du test de Panique.','−2 au test ; pas de suppression automatique de tout effet.'],
    ['AL-11','01','Point de Récit 1','Dépenser après un jet autorisé, puis forcer si permis.','Un 6 ajouté, point déduit une fois et conservé au forçage ; bloqué si Panique annule l’action.'],
    ['AL-12','02','B04 Synthétique brisé','Ouvrir soins/forçage/Stress et le traitement synthétique.','Pas de Stress, Panique ou forçage humain ; dommage critique synthétique distinct.'],
    ['AL-13','02','B06 humain Santé 0','Ouvrir critique, trépas et soins sur une copie.','Brisé n’est pas mort par défaut ; critique réel, durées et soins explicites.'],
    ['AL-14','01','Combat de recette','Infliger un coup réel, des dégâts nuls puis soigner.','Santé alignée à la fiche ; Stress +1 pour une perte réelle, pas par point ni pour le soin.'],
    ['AL-15','01','Arme de recette sans bonus','Préparer tir, rafale, visée et protection sur copies.','Bonus/dégâts/portée séparés, rafale n’ajoute pas deux fois le Stress.'],
    ['AL-16','01','Action d’éclat après succès','Dépenser un succès supplémentaire autorisé.','Choix et coût consignés ; pas de réutilisation du même succès.'],
    ['AL-17','01','Initiative de rencontre','Distribuer les cartes puis ajouter une créature à Vitesse confirmée.','Cartes 1–10, ordre croissant, une par Vitesse confirmée ; aucun profil d’espèce inventé.'],
    ['AL-18','02','B05 réserves à 1','Tester Air puis Énergie sur essais indépendants.','Réserve de six dés au maximum ; chaque 1 retire un point, sans Stress ni Panique.'],
    ['AL-19','02','B08 privations','Valider Tour/Quart/Jour dans Survie Alien.','Temps explicite, effets des privations et radiations distincts ; aucun minuteur réel caché.'],
    ['AL-20','02','B08 radiations 4 dont permanents 2','Tester traitement/temps des radiations.','La part permanente ne disparaît pas avec une simple modification de la part courante.'],
    ['AL-21','01','Objet Fétiche renseigné','Employer le fétiche puis recommencer dans le même acte.','Usage suivi, pas de récupération illimitée ; mode Cinéma et mode Campagne distincts.'],
    ['AL-22','01','Acte Cinéma 1','Conclure l’acte avec puis sans mérite sur copies ; revenir au même acte.','Point de Récit conditionnel, aucune seconde récompense du même acte.'],
    ['AL-23','02','B09 15 PX au total','Effectuer bilan de séance puis achats entre séances.','Dix cases imprimées plus cinq PX supplémentaires conservés ; achats débités une fois.'],
    ['AL-24','02','B09 mode Campagne','Essayer achat de compétence, prérequis et entraînement d’un Talent.','Coût et conditions vérifiés, pas d’achat répété avec le même identifiant.'],
    ['AL-25','01','Objectifs remis par MU/TH/UR','Changer d’acte dans le suivi puis remettre le nouvel objectif une fois.','Choisir un seul canal de remise ; ne pas doubler par messagerie A7 et MU/TH/UR.'],
    ['AL-26','02','B07 Stress 11','Ouvrir fiche HTML, sauvegarder et recharger.','La valeur supérieure aux dix cases imprimées reste conservée.'],
    ['AL-27','01','Camarade et Rival renseignés','Ouvrir relations et bilan d’expérience.','Noms et relations cohérents ; les choix de rôle ne se résolvent pas automatiquement.'],
    ['AL-28','01','Mouvement discret et combat','Passer exploration → rencontre puis revenir.','Un écho ne donne pas de ligne de vue ; Maman décide embuscade, Observation et passage au combat.'],
    ['AL-29','01','Créature profil de recette','Choisir espèce, Vitesse, Santé et attaque de signature confirmées avant essai réel.','Aucune attaque officielle attribuée par supposition au Spécimen d’Orphée.'],
    ['AL-30','01','Retour en lieu sûr','Valider un Tour de repos et la fin d’un effet de Panique.','Repos −1 Stress distinct de la simple fin de Panique ; ni soin général ni retour automatique à zéro.'],
    ['MOD-01','01','Modules importés','Ouvrir les trois pupitres avant une séance.','Données déjà remplies, accès joueurs fermés et effets arrêtés.'],
    ['MOD-02','01','Trois PJ en séance','Autoriser les personnages indépendamment pour terminal, détecteur et spatial.','Chaque instrument suit ses propres droits ; retirer un droit ne donne ni ne retire les deux autres.'],
    ['MOD-03','01','MU/TH/UR mission et cargo','LIST puis READ mission ; READ cargo avant/après CODE CARGO-17.','Mission public aux opérateurs ; cargo protégé avant son code ; code non diffusé comme donnée MJ.'],
    ['MOD-04','01','Dossier ordre-prive et acte 2','Lire depuis un opérateur équipage puis administrateur de recette.','Dossier admin invisible à l’équipage ; brouillons d’actes invisibles même à un admin avant publication.'],
    ['MOD-05','01','Trois actes préparés','Publier un dossier puis remettre l’objectif d’Eli au bon acte.','Publication explicite ; objectif privé à Eli seulement, remise unique persistante.'],
    ['MOD-06','01','Deux opérateurs','Envoyer deux /M et un HACK, puis arbitrer les demandes.','Files et réponses privées ; HACK n’accorde pas de privilège avant décision de Maman.'],
    ['MOD-07','01','Protocoles Orphée','Essayer ORPHEE-LOCK puis ORPHEE-OPEN ; autodestruction seulement pour essai volontaire, puis ORPHEE-STOP.','Portes fictives et annulation fonctionnent ; aucun effet actif dans l’archive livrée.'],
    ['MOD-08','01','Préréglage terminal','Modifier, rappeler après confirmation, puis réinitialiser sur une copie.','Préréglage conservé ; préparation remplacée conformément au module, accès et effets coupés.'],
    ['MOD-09','01','Plan privé M314, porteur Eli au sas','Vérifier huit zones, sept pions et Énergie 5.','Plan préparé ; aucun nom de pion caché dans les données joueurs.'],
    ['MOD-10','01','Tour 1, créature au laboratoire','Déplacer le spécimen Laboratoire → Gaine puis Scanner ce Tour.','Un écho Gaine ; Boréal immobile absent, petits débris non détectables, chariot hors portée depuis le sas.'],
    ['MOD-11','01','Scan déjà fait au Tour 1','Scanner encore ; fermer/rouvrir ; reconnecter le même appareil.','Pas de second scan ni second débit au même Tour.'],
    ['MOD-12','01','Tour 2','Valider le Tour suivant, déplacer Samir Sas → Coursive A, laisser la créature immobile, scanner.','Un écho Coursive A sans nom ni espèce ; aucune apparition de la créature immobile.'],
    ['MOD-13','01','Tour 3','Valider le Tour, déplacer la créature Gaine → Laboratoire → Mess, puis scanner.','Écho Mess, trajet de deux zones autorisé ; budget de chaque pion respecté.'],
    ['MOD-14','03','Batterie M314 à 1','Scanner après un mouvement, relever les dés, puis essayer à Énergie 0 sur copie.','Dernier scan consultable s’il vide la batterie ; suivant interdit à zéro, sans Stress/Panique.'],
    ['MOD-15','01','Deux préréglages Orphée plus exemple du module','Rappeler plan puis mise en scène, démarrer/arrêter le scan et le faux écho.','Rappel en veille ; plan conservé dans son préréglage ; faux écho temporaire sans déplacer les contacts existants.'],
    ['MOD-16','01','Détecteur sur trois appareils','Comparer zones/échos et tester le choix local des bips.','Mêmes échos autorisés ; bips nécessitent un geste local ; onglet caché et révocation coupent les bips.'],
    ['MOD-17','01/03','Iskra et Vautour préparés','Vérifier les cinq postes et démarrer depuis 01 ou reprendre le combat de 03.','Eli : senseurs/ingénieur ; Mara : capitaine ; Samir : pilote ; artilleur PNJ. 03 démarre au Tour 1, phase senseurs.'],
    ['MOD-18','03','Vautour sans transpondeur','Choisir un ordre senseurs depuis le PJ autorisé puis comparer les écrans avant révélation.','Ordre adverse et vrai nom non identifiés restent privés ; seuls les postes autorisés donnent l’ordre.'],
    ['MOD-19','03','Phase senseurs puis pilote','Révéler, résoudre, valider/forcer le jet autorisé puis avancer.','Initiative, Panique spatiale et Stress correctement traités ; déplacement après phase pilote seulement.'],
    ['MOD-20','03','Phase artilleur','Verrouiller puis tirer ; essayer portée, protection, munitions et contre-mesures.','Dégâts, protection et munitions du modèle du livre ; pas de tir sans cible autorisée.'],
    ['MOD-21','03','Ingénieur et avarie réelle','Essayer réparation temporaire, fin de combat et réparation durable.','Réparation temporaire redevient avarie ; durable exige conditions/pièce ; surcharge n’est jamais lancée au chargement.'],
    ['MOD-22','01/03','Fin de séance ou changement de campagne','Fermer la séance, changer puis revenir ; rappeler les préréglages.','Accès et effets interrompus ; préparation, dialogues et états persistants conformes au module.'],
    ['GM-01','01/02/03','Joueurs p-1/p-2/p-3 existants','Importer les trois archives telle quelle.','Trois joueurs conservés ; 15 nouveaux PJ, 36 PNJ, 24 lieux, trois jeux de modules indépendants.'],
    ['GM-02','01','Séance prévue et trois tablettes','Choisir Eli, Mara et Samir, ouvrir leurs fiches.','Le bon PJ pour chacun, pas de débordement aux trois tailles.'],
    ['GM-03','01','Une fiche de jeu ouverte','Modifier Santé/une note puis lancer un jet depuis la tablette.','Écritures et jet reçus par Maman sans double application.'],
    ['GM-04','01','Indices au départ','Révéler un document puis le recacher.','Seul l’appel est révélé initialement ; le reste attend la décision de Maman.'],
    ['GM-05','01','Marqueur SECRET_MJ_ALIEN_RECETTE','Examiner écrans et données reçues des joueurs.','Aucun secret transmis attendu ; défaut transversal gmSecrets à consigner en ÉCHEC tant qu’il subsiste.'],
    ['GM-06','01','Atlas','Ouvrir plans, liens de lieux et PNJ ; projeter une carte.','Images embarquées et liens exacts ; Atlas distinct du plan métrique du M314.'],
    ['GM-07','01','Trame quatre actes','Suivre témoins, terminal ou réparation vers le dénouement.','Branches liées, ateliers hors fiction identifiés, pas d’indice essentiel bloqué par un jet unique.'],
    ['GM-08','01','Trois rencontres préparées','Lancer puis réutiliser une rencontre.','Alliés et hostiles corrects ; Santé/Stress alignés aux fiches.'],
    ['GM-09','01','Relations équipage','Ouvrir les trois relations principales puis leurs cibles.','Camarades et rivalité vers les bons personnages, sans renvoi à une autre campagne.'],
    ['GM-10','01','Butin','Distribuer, transférer, refuser puis accepter un objet.','Quantités correctes ; une cartouche distribuée ne recharge pas tout équipement automatiquement.'],
    ['GM-11','01','101 crédits','Partager aux trois PJ, archiver puis reprendre le reliquat.','33 chacun et reste 2 ; total conservé.'],
    ['GM-12','01','Wiki et chronologie','Lire neuf entrées et quatre repères de recette.','Documents cohérents ; dates explicitement fictives, aucune séance déjà jouée.'],
    ['GM-13','01','Sound-OS','Lancer/arrêter les trois signaux locaux à volume modéré.','Trois WAV embarqués, pas de téléchargement nécessaire.'],
    ['GM-14','01','Music-OS','Essayer boucles A/B et fondu.','Deux pads synthétiques disponibles ; pas d’authentification externe.'],
    ['GM-15','01','Storyboard','Déclencher les quatre moments puis revenir à leur scène.','Cartes, titres et signaux corrects.'],
    ['GM-16','01','Light-OS','Vérifier trois tuiles, assigner des appareils seulement pour l’essai physique.','lightStates vides à la livraison ; matériel non déclaré testé.'],
    ['GM-17','Tables','Table-OS → Atelier, univers de recette','Importer les trois JSON et Ranger tel quel ; tirer un objet vers le butin.','Trois tables couvrant 1–6, aucune table de Panique/critique officielle remplacée.'],
    ['FIN-01','Toutes','Après modifications','Fermer et rouvrir puis comparer les campagnes.','Fiches, module privé, progression et médias persistants ; accès fermés au redémarrage.'],
    ['FIN-02','03','Laboratoire altéré','Réimporter seulement 03 avec Remplacer.','Réinitialisation de 03 uniquement, y compris ses modules ; anciens PJ et enquête intacts.'],
    ['FIN-03','01','Après jeu','Exporter puis importer en Cloner.','Campagne et modules copiés avec références remappées ; original intact.'],
    ['FIN-04','01','Rejouer','Comparer la reprise à l’archive.','Parcours/séances réinitialisés ; les PJ sont conservés, sans guérison générale. Vérifier les préparations privées.'],
    ['FIN-05','Toutes','Après chaque essai','Remplir observé, verdict et reproduction dans le CSV.','Distinguer PASSÉ, ÉCHEC, NON TESTÉ et NON APPLICABLE ; les contrôles du lot ne valident pas toute la recette humaine.'],
];
export const casAlien = lignes.map(([id, archive, precondition, action, attendu]) => ({ id, archive, precondition, action, attendu }));
const cellule = s => String(s).replaceAll('|', '\\|').replaceAll('\n', ' '), csv = s => '"' + String(s).replaceAll('"','""') + '"';
export function ecrireRecetteAlien(sortie, { scenario, corps, instruments, archives, rattachement }) {
    const ecrire = (nom, texte) => fs.writeFileSync(path.join(sortie, nom), texte.trimEnd() + '\n');
    ecrire('LIRE-MOI.md', `# Campagnes de recette ALIEN — ${titreAlien}

## Importer

**Bibliothèque des campagnes → Importer un bundle Nexus → 01-La-derniere-releve.gmos → Importer telle quelle**. Pas besoin de recharger GM-OS. Dépendances manquantes ajoutées ; un pilote existant du même identifiant est conservé. Vérifier ALIEN **1.9.0** ; le pilote fourni permet un remplacement explicite si nécessaire.

Les PJ sont rattachés aux joueurs existants **Thomas D. p-1**, **Marie C. p-2**, **Lucas R. p-3**, identifiants de \`${rattachement.source}\`. Aucun ancien PJ recopié. Les profils et les personnages des autres campagnes sont conservés.

| Joueur | PJ | Poste principal |
| --- | --- | --- |
| Thomas D. | Eli Voss | Machines, senseurs et ingénieur |
| Marie C. | Mara Chen | Capitaine et médecin |
| Lucas R. | Samir Hale | Pilote |

## Modules déjà préparés

Les **trois modules existants** sont activés dans le pilote et leurs données sont embarquées :

- **MU/TH/UR 6000** : mission, dossier à code CARGO-17, dossier administrateur, quatre protocoles, trois actes, neuf objectifs privés non remis et un préréglage.
- **Détecteur** : huit zones en mètres, sept pions dont les trois PJ, porteur Eli, batterie 5, modes discret/mise en scène sous préréglages. Plan, noms et positions des pions restent au MJ.
- **Combat spatial** : Iskra et Vautour, deux modèles du catalogue du livre, cinq postes par vaisseau, équipage PJ/PNJ et un préréglage. Aucun combat lancé dans l’enquête principale.

Après import : **Cockpit → Modules du jeu**. Ouvrir une séance, puis **cocher les PJ dans les accès de chaque module**. Les accès sont indépendants et restent fermés à l’import ; aucun scan, alarme, compte à rebours ou son n’est démarré. Côté joueur : **Hub → Modules du jeu**. Lire **MODULES-MAMAN.md** avant les essais. Aucune création ni installation d’un nouveau module nécessaire.

## Contenu et variantes

Enquête originale au relais Orphée, noms et lieux inventés : trois actes Cinéma plus un atelier hors fiction, **3 PJ, 12 PNJ, 8 lieux, 12 indices documentés, 16 scènes, 3 rencontres, 4 séances prévues, 9 Wiki**, inventaires, huit lots de butin et une réserve. Lire **SCENARIO.md** pour les vérités, les accès de rechange et les dénouements.

**02-Corps-Panique-et-Survie.gmos** : neuf PJ de laboratoire, Paniques 7/10/13, synthétique brisé, humain brisé, réserves à 1, Stress 11, privations/radiations et 15 PX de Campagne. **03-M314-Terminal-et-Vaisseaux.gmos** : trois PJ, M314 Énergie 1 et combat spatial prêt au Tour 1 / phase senseurs. Chaque archive possède ses modules indépendants ; les mêmes trois joueurs reçoivent **15 nouveaux PJ au total**.

Réimporter seulement le laboratoire concerné avec **Remplacer** pour recommencer. Cloner garde l’ancien essai. Rejouer conserve les PJ, ce n’est pas une guérison générale. Les valeurs sont choisies pour tester, pas une création de personnages ni un bestiaire officiel validés. Confirmer le profil et les attaques de la créature avant un vrai combat d’espèce.

## Outils et vérifications

**39 médias originaux** par archive : 36 documents/cartes SVG et trois WAV synthétiques de quatre secondes. Quatre Storyboards, trois pads Sound-OS, deux Music-OS, trois tuiles Light-OS sans lampe assignée. Les bips du M314 sont produits par son module, distincts des WAV de Sound-OS. Les vidéos/sons internes MU/TH/UR restent ceux de l’application ; aucun film copié dans le lot.

Trois tables séparées : **Table-OS → Atelier → Ranger tel quel**, dans un univers de recette. Elles ne remplacent aucune table de règles ALIEN. IA/TTS, lampes, projecteurs, brouillard des cartes, calendriers et bibliothèques globales restent à configurer sur le poste.

**${casAlien.length} cas manuels encore NON TESTÉS par David**, avec préconditions, attendus et CSV vierge. Les tirages en séance restent aléatoires ; les états initiaux sont reproductibles. Lire RAPPORT-DE-VERIFICATION.md et ANOMALIES-CONNUES.md. Le défaut transversal connu **GM-05 : gmSecrets transmis aux tablettes** reste distinct de la confidentialité des modules privés et ne doit pas être déclaré corrigé.

## Archives

${archives.map(a => `- **${a.fichier}** : ${a.personnages} PJ ; SHA-256 ${a.sha256}`).join('\n')}

Reproduire : \`node outils/campagnes-de-recette/alien.mjs\`. Aucun accès au profil personnel ni import automatique dans l’application de David.
`);
    ecrire('MODULES-MAMAN.md', `# Préparation et recette des modules — Orphée

## MU/TH/UR

Opérateurs préparés : les trois PJ de cette archive. Accès à ouvrir dans les cartes de modules pendant une séance. Commandes de lecture : **LIST**, **READ mission**, **CODE CARGO-17**, **READ cargo**. Le mot de passe administrateur fictif est **ORPHEE-ADMIN-TEST**, à utiliser uniquement pour la recette d’élévation de privilège ; il ne doit pas être distribué à tout l’équipage.

Les actes 1–3 contiennent chacun un dossier non publié et les objectifs des trois PJ non remis. Dans le pupitre **Actes**, choisir **${titreAlien}**, l’acte, le destinataire puis **Remettre dans le terminal privé**. Publier les dossiers au moment choisi. Les objectifs ne sont pas préremis dans les notes visibles des PJ ; ne pas les envoyer une seconde fois par le canal A7. LIST ne montre que les dossiers publiés et autorisés. Le dossier **ordre-prive** reste administrateur.

Codes de protocole : **ORPHEE-LOCK** (portes fictives fermées), **ORPHEE-OPEN**, **ORPHEE-OMEGA** (autodestruction de recette, 13 minutes), **ORPHEE-STOP**. Ne lancer OMEGA que pour ce test volontaire. Choix du diffuseur et activation locale du son restent manuels. Aucune alarme à l’import. Les préréglages se rappellent après confirmation.

## M314 — plan et parcours vérifiable

Le module contient un **plan métrique privé**, distinct des dessins de l’Atlas : Sas (0,0) → Coursive (25,0) → Mess (50,0) → Laboratoire (75,0) → Gaine (100,0) → Hangar (125,0) ; Infirmerie (50,25) reliée au Mess ; Échangeurs (75,25) au Laboratoire. Tous les passages sont réciproques.

Eli porte le M314, les trois PJ commencent immobiles au Sas. Boréal immobile à l’infirmerie ; petits débris mobiles mais non détectables à la Gaine ; chariot mobile au Hangar, hors de portée depuis le Sas. Le spécimen est immobile au Laboratoire, limite choisie de trois zones par Tour pour la recette, à confirmer pour une espèce officielle.

1. **Tour 1** : déplacer le spécimen Laboratoire → Gaine puis scanner : **Gaine, 1 écho**. Batterie testée une fois, second scan du Tour interdit. Ne pas déplacer Eli.
2. **Tour 2** : valider le Tour suivant, déplacer Samir Sas → Coursive, ne pas déplacer le spécimen : **Coursive A, 1 écho**. La créature immobile n’apparaît pas.
3. **Tour 3** : valider le Tour, déplacer le spécimen Gaine → Laboratoire → Mess, scanner : **Mess, 1 écho**. L’ancien mouvement de Samir est effacé au changement de Tour.

L’écho n’identifie ni le nom ni l’espèce et ne donne pas de ligne de vue. Un scan qui vide la batterie reste lisible ; aucun nouveau scan à zéro. Les Tours du M314 n’avancent pas automatiquement ceux de Survie Alien. Préréglages Orphée : plan discret et mise en scène à deux contacts. Le préréglage d’exemple natif reste aussi présent.

## Spatial

**Iskra** : modèle Corvus du catalogue. Mara capitaine ; Eli senseurs et ingénieur ; Samir pilote ; Célian PNJ artilleur. Les postes se testent phase par phase, pas simultanément. Les dés sont des valeurs de recette cohérentes avec leurs fonctions, modifiables avant l’engagement.

**Vautour** : modèle remorqueur du catalogue, adversaire sans transpondeur, équipage PNJ. Le vrai nom et l’équipage restent cachés tant que non identifiés. Sur 01, engager les deux vaisseaux au moment choisi ; 03 contient déjà le combat Tour 1, senseurs, huit zones de distance. Pour tester les tirs et les munitions, les deux vaisseaux de 03 reçoivent un canon électrique léger, des ASAT courts et des leurres radar : cet armement de laboratoire est ajouté aux coques civiles, sans prétendre être leur configuration officielle. Ordres → révélation → résolution → choix de forçage/validation → phase suivante. Terminer le combat avant de rappeler le préréglage. Aucune surcharge ni ordre offensif engagé dans la livraison.
`);
    ecrire('SCENARIO.md', `# ${titreAlien} — dossier de Maman

Scénario original de recette, pas une aventure officielle. Le relais Orphée, Iskra, Vautour et leurs équipages sont inventés. Trois actes Cinéma, prolongeables en Campagne après le sauvetage.

## Vérité et accroches

Iskra devait simplement prendre une relève et une caisse de transit. L’appel signale une panne thermique ; le contrat compte quatre personnes, les témoins six. Un conteneur a été ouvert avant le premier appel. Nils a laissé passer un ordre de purge. Tor garde encore une cargaison dont il ne maîtrise pas le contenu. Iona, blessée, conserve un témoignage ; Boréal possède les horaires et veut garder les survivants en vie. Le Vautour approche pour un contrat concurrent, pas pour un combat obligatoire.

Eli veut ramener Iona et sauver les preuves techniques. Mara doit décider d’une quarantaine praticable. Samir protège le retour et doit choisir entre sa prime et les survivants. Les objectifs par acte restent privés dans MU/TH/UR jusqu’à leur remise.

## Mener et relier les indices

Trois voies établissent la vérité : **terminal** (mission, cargo, horaires), **témoins** (Vesna, Milo, Iona), **réparation** (Leena, calque, pièce du hangar). Un échec n’efface jamais la seule preuve : il peut coûter une réserve, déplacer un témoin, retarder une manœuvre ou attirer l’attention. Annoncer l’enjeu avant le jet. Une coupure totale n’est jamais le seul moyen d’atteindre la fin.

La pression narrative évolue avec les décisions : la chaleur gagne, le Vautour demande une réponse, le spécimen change de zone. Le M314 a ses Tours explicites ; ni le temps réel ni la narration n’augmentent automatiquement Stress, réserve ou nombre de Tours. Maman confirme l’espèce et son profil avant d’utiliser ses attaques de signature.

## Scènes et personnages

${scenesAlien.filter(s => s[1] < 4).map(s => `### ${s[2]}\n\n${s[6]}\n\nÀ jouer : ${s[4].map(x => pnjAlien.find(p => p[0] === x)).map(p => `${p[1]} : « ${p[5]} »`).join(' ')}\n\nVérité de Maman : ${s[4].map(x => pnjAlien.find(p => p[0] === x)[6]).join(' ')}\n\n${s[7].length ? 'Suites : ' + s[7].map(x => scenesAlien.find(sc => sc[0] === x)[2]).join(' / ') : 'Consigner la résolution et les objectifs accomplis.'}`).join('\n\n')}

## Dénouements possibles

- **Sauvetage et isolement** : les survivants quittent le relais, le laboratoire reste coupé. Iskra emporte les copies sans le conteneur ; la provenance de l’ordre de purge reste à établir.
- **Accord avec le Vautour** : partage des tâches, évacuation commune, boîte noire dupliquée. Chaque capitaine doit accepter ce qui reste sous quarantaine.
- **Récupération risquée** : la caisse est embarquée après une décision explicite. Préparer une suite à bord, sans déclencher une contamination par un jet caché arbitraire.
- **Retrait** : l’équipage garde ce qu’il a sauvé et sait qui manque encore. Le rapport peut ouvrir une seconde mission, sans annuler les choix de la table.

Après l’acte III, faire le bilan des personnes, du matériel, des données et des objectifs ; employer l’acte IV et les deux laboratoires pour les tests destructifs hors fiction.
`);
    const labs = [corps, instruments].map(s => `## ${s.campaign.name}\n\n` + s.players.map(p => `### ${p.realName}\n\n` + p.characters.map(c => `- **${c.name}** — Santé ${c.hp}/${c.maxHp}, Stress ${c.sheetData.niveau_de_stress}, Panique ${c.sheetData.panique_en_cours}, synthétique ${c.sheetData.androide ? 'oui' : 'non'}.`).join('\n')).join('\n\n')).join('\n\n');
    ecrire('CAHIER-DE-RECETTE.md', `# Recette ALIEN

Préconditions, gestes et attendus ; consigner l’observé. Les résultats manuels restent vierges. Référence : manuel 54-Jeu-Alien.md, pilote 1.9.0 et moteurs réels A0–A10 du dépôt. Les tables de règles de Panique/critiques restent celles installées avec le jeu, distinctes des tables originales du lot.

| Cas | Archive | Précondition | Action | Attendu |
| --- | --- | --- | --- | --- |
${casAlien.map(c => `| ${[c.id,c.archive,c.precondition,c.action,c.attendu].map(cellule).join(' | ')} |`).join('\n')}

${labs}
`);
    ecrire('cas-de-recette.json', JSON.stringify(casAlien,null,2));
    ecrire('resultats.csv','\uFEFF' + ['id','archive','precondition','action','attendu','observe','verdict','anomalie','reproduction'].map(csv).join(';') + '\r\n' + casAlien.map(c => [c.id,c.archive,c.precondition,c.action,c.attendu,'','NON TESTÉ','',''].map(csv).join(';')).join('\r\n'));
    fs.mkdirSync(path.join(sortie,'tables-a-importer'),{recursive:true});
    [['signaux',['Relève incomplète','Porte coincée','Écho mobile sans identité','Contrat contradictoire','Demande du Vautour','Horaires de Boréal']],['incidents',['La lampe clignote','Un bac bloque la coursive','Un témoin demande à boire','Une radio sature','Le chariot change de quai','Un document tombe du classeur']],['objets',['Ruban d’isolation','Batterie scellée','Crédits de transit','Pansements','Balise de retour','Connecteur thermique']]].forEach(([genre, textes],n) => ecrire(`tables-a-importer/${n + 1}-${genre}.json`,JSON.stringify({name:`RECETTE Orphée — ${genre}`,dice:'1d6',entries:textes.map((texte,i)=>({min:i+1,max:i+1,title:texte,description:'Fiction originale ; aucun effet mécanique automatique.',...(genre==='objets'?{butin:[{name:texte,type:i===2?'currency':'item',quantite:i===2?7:1,rarity:'common',weight:0,value:0,description:'Objet de recette, sans recharge automatique.'}]}:{})}))},null,2)));
}
