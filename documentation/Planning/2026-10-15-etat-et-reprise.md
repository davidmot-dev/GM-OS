# État et reprise — 15/10/2026 — Alien et Tablet Hub

## Demande

David indique que le module externe bêta Alien fonctionne bien pour une
première version et souhaite l'améliorer et étudier son intégration au
Tablet Hub, avec activation par le MJ par exemple. Il choisit explicitement :
*« Préparer le plan d’amélioration et d’intégration au Tablet Hub. »*
Il confirme que GM-OS est fermé. Aucune modification de code n'est faite.
Ce constat décrit la première phase documentaire ; des outils isolés sont
ajoutés dans la phase de standardisation ci-dessous, après son accord.

## Produit de cette session

Le [plan Alien / Tablet Hub](2026-10-15-alien-tablet-hub.md) décrit le parcours
proposé : accès indépendant à MU/TH/UR et au détecteur, ouverture par le MJ
aux personnages choisis, une entrée dans le Hub et arrêt immédiat au retrait.
Il distingue les propositions des décisions déjà prises et les répartit en
lots A0 à A4. Le README du prototype et le registre § 135 y renvoient.

**Précision ultérieure de David :** *« je voudrais avoir un placeholder
générique sur Tablet Hub ou je pourrais mettre des modules spécifiques par
jeu/drivers »*, avec MU/TH/UR et la Table des Terres Médianes pour exemples.
Le [plan commun Modules du jeu](2026-10-15-modules-du-jeu-tablet-hub.md)
remplace l'entrée réservée à Alien : déclaration facultative dans le pilote,
registre d'implémentations, hôte commun et instances par campagne. L'espace
générique est demandé ; les détails du contrat et du parcours restent proposés.

**Standardisation autorisée ensuite :** à la proposition d'un contrat commun,
d'un petit module d'exemple et d'un validateur, David répond *« ok vas-y »*.
Le [contrat v1](../Architecture/Contrat-des-modules-du-jeu.md) fixe manifeste,
références du pilote, moteur, vues, autorisations, protocole, sauvegardes et
cycle de vie. Les [outils locaux](../../outils/modules-du-jeu/README.md)
livrent un validateur statique de manifeste, une fonction de contrôle des
références, un moteur d'exemple et ses huit essais. Aucun hôte ni composant
visuel de module n'est implémenté ; le prototype Alien n'est pas converti.

**Adaptation MU/TH/UR demandée ensuite :** David : *« peux-tu adapther
MU\TH\UR à ce contrat ? »*. Le [module](../../outils/alien/modules/muthur/README.md)
livre manifeste v1, moteur pur adapté au `core.js` existant, vues React joueur/MJ,
styles isolés et types publics. L'état et les vues excluent le radar ; aucune
mutualisation avec un futur module détecteur n'est nécessaire à ce stade.
Le prototype autonome garde son manifeste et ses transports. Sa seule
correction fonctionnelle masque aussi ORDERS dans le dialogue ; la migration
du module masque les anciennes saisies en clair et arrête les effets.

Les essais spécifiques couvrent moteur, droits, filtrage, migration, composants,
nettoyage audio/minuteries et protocole autonome sans port ouvert. La démo
`scratch/muthur-v1/apercu.html` utilise les vrais composants et le moteur avec
des données fictives ; douze captures aux trois largeurs sont générées hors
ligne dans ce dossier ignoré. Vues téléphone relues. Aucun accès à `.local/`
ou aux campagnes de David ; aucune conversion réelle des identités opérateur/PJ.

**Messages type et autodestruction, suite du 15/10.** David demande des codes
pour ouvrir/fermer les portes et lancer dix minutes d'autodestruction, avec
interface transformée, sirènes et annonce vocale chaque minute. Il choisit :
*« Sur un appareil choisi pour diffuser le son, avec le décompte visuel sur
les autres. »* Version 0.2.0 du module et de l'atelier autonome livrée :
panneau Protocoles (création/édition/suppression, code exact, message, effet,
durée, activation et portée), quatre exemples sur une nouvelle table, alerte
visuelle et échéance unique non relancée par un deuxième code. Le code
d'annulation et l'arrêt MJ coupent la séquence ; zéro ne modifie aucun PJ.

Le son est partagé via `outils/alien/alarme.js` : sirène synthétisée, annonce
du temps courant au départ et chaque minute, voix française locale seulement.
« Diffuser l'alarme ici » réserve l'appareil du contexte authentifié ; le
choix suivant retire l'autorisation à l'ancien. Le clic local Son reste
requis. Une voix manquante est signalée ; la sirène et le visuel restent actifs.
Le contrat précise désormais le champ optionnel de contexte `appareilId`.

Les données passent en v2. Migration v1 sans ajout de protocoles actifs ni
perte des données existantes ; reprise v1/v2 avec auto, diffusion et effets
arrêtés. Le serveur autonome contrôle en mémoire le choix du diffuseur et
la confidentialité des codes. Les fenêtres d'un appareil partageant un jeton
restent une même identité sonore ; n'en utiliser qu'une pour diffuser.

**Vidéo d'alerte, suite du 15/10.** David fournit le WebM du Nostromo et
demande son intégration lors de l'alerte. Il choisit *« Utiliser la bande-son
de la vidéo sur l’appareil choisi, puis reprendre la sirène et les annonces
à la fin »*, puis, après mesure de la durée, *« La vidéo entière, avec une
alerte prolongée à sa durée »*. Version 0.3.0 livrée, données toujours v2.
Le fichier est copié sans modification dans `outils/alien/medias/`, empreinte
et provenance documentées ; original de Downloads intact.

Durée réelle 775,701 s (environ 12 min 56), 640 × 360, 26 378 944 octets.
Le lecteur commun `video-alerte.js` lance le film à l'autodestruction,
rejoint le temps écoulé après reconnexion, réserve le son au diffuseur choisi
et arrête la vidéo à l'annulation. Pendant le film, sirène et voix se taisent ;
elles reprennent s'il reste du temps après le film. La durée effective est
le maximum de la durée souhaitée et du film entier, même pour le code
historique OMEGA-10. Les chiffres incrustés dans le film restent inchangés ;
le décompte du module est l'échéance de table.

Le module expose une URL d'asset statique pour son futur bundler ; le serveur
autonome sert le WebM et ses plages d'octets sans ouvrir un nouvel endpoint
arbitraire. La démo est désormais le couple HTML + WebM dans `scratch/muthur-v1`.
Les tests ajoutés couvrent vidéo, reprise, blocage d'autoplay, annulation,
priorité et transfert audio, ainsi que HEAD/206/416 en mémoire.

Constats du code : moteur Alien réutilisable ; transport autonome HTTP/SSE ;
Hub en WebSocket `ws` avec routage privé des messages ; identité du pilote
résolue via le corpus. Le moteur privé ne doit pas être ajouté brut aux
campagnes diffusées par `useNexusSynchronizer`. L'identité déclarée à
l'inscription du Hub doit être liée à une association MJ reconnue côté
serveur avant d'ouvrir les dialogues privés Alien.

**Effets CRT et parasites, suite du 15/10.** David : *« accentue les effets CRT
ET Parasite »*. Habillage renforcé dans le module et l'atelier autonome :
trame phosphore, scanlines, halo, vignette, arrondi du tube et bande de
balayage ; grain plus présent et courts décalages intermittents du texte.
Le module montre désormais les parasites hors piratage aussi. Les réglages
CRT/parasites restent indépendants, les surcouches ne capturent aucun clic,
la saisie et le film ne sont pas déformés. Mouvements réduits respectés.
L'aperçu est régénéré ; sa commande `--capturer` produit désormais 29 captures,
dont huit combinaisons CRT/parasites aux tailles 390/1 180 px, avec contrôle
des interrupteurs et de la réduction des mouvements. Captures relues aux
deux tailles ; aucun débordement ni erreur navigateur. Aucun changement
dans `src/` ou `electron/`, aucun service lancé ni paquet installé.

**Nouveau dossier, suite du 15/10.** David : *« tu peux mettre une entrée
nouveau dossier pour que ce soit plus clair »*. Entrée « Nouveau dossier… »
livrée dans le module et le prototype, avec création effective réservée au
MJ. Identifiant lisible pour READ, titre, contenu et protection ; code requis
pour un nouveau dossier protégé par code. Le dossier créé est sélectionné
et modifiable ; les anciens dossiers sont conservés. Pas de suppression ni
de classement dans ce lot. Données toujours v2 ; commande `creer-dossier`
déclarée et typée, traduite dans le cœur commun en `creer-document`.

Contrôles : identifiant unique même si une sauvegarde ancienne utilise une
autre casse, format/tailles, limite de 256, codes de protocole réservés,
confidentialité des contenus et déverrouillage propre à l'opérateur. Les
refus gardent le brouillon et ne mutent pas les données existantes.
Les essais navigateur créent réellement un dossier dans les deux interfaces.
Piège payé : l'attribut HTML `pattern` est interprété en mode RegExp `v` ;
le tiret doit être échappé dans une classe, ou écrit dans une alternative.
Le formulaire utilise une alternative pour fonctionner dans le navigateur.
L'aperçu React reste en mémoire seulement ; aucune persistance de campagne
ou intégration Hub n'est ajoutée ici.

**Sauvegarde de la préparation, suite du 15/10.** David : *« comment ces
configurations peuvent-être sauver pour les récupérer au redémarrage »*.
L'aperçu React sauvegarde désormais automatiquement réglages, dossiers et
protocoles après leurs commandes de modification. Clé dédiée
`gmos:alien:muthur:configuration:v1`, distincte de celle du prototype.
`atelier.mjs` devient son entrée de construction ; `configuration.mjs`
décrit et valide le format portable v1. Aucun champ de contrat ni format
d'état du module ne change ; stockage des campagnes Hub toujours à réaliser.

Au démarrage, les préparations sont restaurées et la démonstration de séance
est recréée ; dialogues, déverrouillages, opérateurs, portes, décomptes,
vidéo et diffuseur ne sont pas sauvegardés. Bandeau MJ avec état de sauvegarde,
export JSON (secrets compris) et import validé avec résumé, confirmation ou
annulation. Un import remplace la préparation et coupe les effets/brouillons
de l'ancienne vue. JSON invalide/version inconnue : rien remplacé ; copie
locale illisible : original conservé et écriture automatique suspendue.
Stockage indisponible/plein : préparation conservée en mémoire, erreur visible
et export encore possible. Une copie JSON reste nécessaire pour déplacer la
préparation ou la récupérer après effacement des données du navigateur.

Trois essais purs ajoutés (aller-retour, isolation et fichiers invalides).
`captures-sauvegarde.mjs`, appelé par `--capturer`, vérifie rechargement,
fermeture/réouverture de l'onglet, codes/dossiers conservés, arrêt des alertes,
export téléchargé, import/annulation, copie illisible préservée et quota simulé.
Tous les navigateurs sont des profils de test jetables ; aucun profil de David
n'est ouvert. L'aperçu HTML est régénéré, le WebM conservé à côté.

**Refus de HACK sans effets, suite du 15/10.** David : *« quand je refuse un
Hack, l'animation se fait sans effet (CRT ou Parasite) »*. Reproduit dans
l'aperçu : seul un libellé était animé ; pas de classe de séquence pour
renforcer le CRT/grain, surcouches défilant avec les messages et bandeau ajouté
après le défilement automatique. Dans le prototype, le panneau opaque de
piratage cachait également les couches CRT et neige.

Corrigé : journal à cadre fixe et contenu défilant, bandeau de résultat
visible en bas, classes de contre-mesures pendant le temps autoritaire de
la séquence. CRT : halo et balayage accéléré ; Parasites : grain/bandes et
déchirures du texte. Effets indépendants, sans animation si tous deux sont
désactivés ; mouvements réduits respectés. Prototype : couches replacées
au-dessus du panneau et bruit réglé pour conserver la lecture.
Passer de MJ à joueur rejoint la phase courante via un délai CSS négatif et
une minuterie sur le temps restant ; pas de nouvelle durée de sept secondes,
pas de rejeu après expiration, pas de prolongation sur un état dupliqué.

Deux essais de composants ajoutés avec horloge simulée. Onze captures
supplémentaires dans `captures-piratage.mjs` : quatre combinaisons d'effets
aux tailles 390/1 180, refus encore actif après changement de vue, bandeau
visible après défilement, mouvements réduits, succès et prototype autonome.
Moteur, données, droits, sons et persistance inchangés. Aperçu régénéré.

**Lisibilité du refus de HACK, suite du 15/10.** David : *« l'effet CRT sur le
refus de Hack est trop fort on ne sait plus lire »*. Intensité atténuée
uniquement pendant le refus, module et prototype : halo limité au pourtour,
surcouche CRT à 35 % et balayage à 3,5 s. Dans le module, grain à 10 %, très
courts décalages d'un pixel sans franges colorées ; bandeau de refus fixe.
Dans le prototype, bruit diminué et texte du panneau sans décalage/franges.
Succès et habillage normal conservés. Le générateur est relancé et les
captures du refus prises au maximum du halo pour juger la lecture.
Vérification navigateur : 48 captures, sans débordement ni erreur ; réglages
indépendants et mouvements réduits toujours contrôlés. Aucun changement de
logique, de données ou de sauvegarde. Non commité.

**Codes masqués sans lecture possible, suite du 15/10.** David : *« je ne sais
pas lire les codes »*, avec capture du panneau Protocoles du prototype.
Ajout d'un bouton Afficher/Masquer aux codes de protocole et de dossier dans
les deux interfaces MJ. État initial masqué, bascule sans soumission ni
altération de valeur, remasquage sur changement de sélection/panneau.
Pas de mémorisation de la visibilité ; commandes sensibles du joueur et
journal toujours masqués. Boutons liés aux champs pour l'accessibilité,
mise en page adaptée à la largeur du panneau et au téléphone.
Un essai de composants ajouté (bascules, zéros, aucun envoi, autres sélections,
absence côté joueur) et contrôles navigateur dans les deux interfaces,
avec six captures de codes affichés aux trois tailles. Aperçu régénéré.
Moteur, données et sauvegarde inchangés. Non commité.

**Afficher le mot de passe administrateur, suite du 15/10.** David : *« même
chose ici »*, avec capture du champ administrateur dans Accès. Bouton
Afficher/Masquer étendu à ce champ dans le prototype et dans Réglages du
module, en réutilisant le composant et le mécanisme des codes. Remasquage
au changement de panneau, au passage en aperçu joueur et à l'enregistrement.
Valeur inchangée à la bascule ; état de visibilité non sauvegardé.
Essai de composants étendu et six captures supplémentaires aux trois tailles.
Les vingt essais de composants passent ; soixante captures navigateur sans
débordement ni erreur. Aperçu régénéré, aucun changement du moteur, des données
ou de la sauvegarde. Non commité.

**Contacts aléatoires du détecteur, suite du 15/10.** David : *« quand tu
lances le détecteur, met le point ou les points au hasard dans la distance
sélectionnée »*. Motif fixe remplacé par directions/rayons pseudo-aléatoires
depuis une graine partagée, tirée dans le cœur à chaque passage arrêté → actif.
Les appareils autorisés reçoivent cette graine ; le placement de base ne
dépend pas de l'horloge locale. Rayon maximal défini par la proximité déjà
présente (valeur élevée = près du centre, pas de distance physique ajoutée).
Essais bornés pour limiter la superposition des points ; calcul en cache du
rendu. L'agitation visuelle conserve la distance de chaque point au centre.

Volume/intensité et commande déjà active ne relancent pas le tirage ;
changer le nombre conserve les premiers contacts. Le faux écho de neuf
secondes ajoute un point sans changer la graine ni redistribuer les autres.
Destinataire vérifié avant mutation, donc un démarrage refusé ne change pas
le tirage. Aucun champ de données nouveau ; détecteur toujours autonome,
adaptateur/autorisation Tablet Hub toujours à réaliser.
Trois essais dans `outils/alien/verification-detecteur.mjs` : distribution,
bornes, déterminisme, nombre/faux écho, nouveau tirage et droits.
`captures-detecteur.mjs` relève les points réellement dessinés dans un
navigateur jetable : 1/3/9 contacts aux proximités 0/50/100, redémarrage et
faux écho ; six captures à 390/1 180 px. Aucun serveur ni profil personnel.
Aperçu régénéré ; modifications non commitées.

## Première tranche intégrée — sélection et emplacement

Après *« que reste-t’il à faire ? »*, David répond *« ok commence »*, puis confirme
de nouveau que GM-OS est fermé avant les modifications dans `src/`.

- `GameDriver.modulesDuJeu` et `src/modules/modulesDuJeu/` : catalogue de métadonnées
  explicite, résolution commune du corpus (dont pilotes `custom-…`), repli des anciens
  pilotes Alien, liste vide respectée et modules inconnus/incompatibles conservés et signalés.
- L’éditeur du pilote propose les cases MU/TH/UR et détecteur. Sauvegarde habituelle du
  pilote ; contrôles Forge et restauration, validation du store et des imports Nexus avant
  mutation, export/import sans perte de référence. La Forge ne remplit plus un choix vide.
- Cockpit : entrée **Modules du jeu**, liste de disponibilité et raccourci vers le pilote.
  Tablet Hub : septième onglet, état vide générique. Aucun moteur/vues d’Alien ni état privé
  chargé dans cet onglet. Aucun accès joueur accordé par la sélection du pilote.
- `contrat.mjs` est le validateur pur partagé par le CLI et GM-OS. Le catalogue importe
  seulement le manifeste MU/TH/UR ; l’adaptateur détecteur et le registre exécutable restent à faire.
- Manuel 53/54 Alien/61 actualisé. `apercu-integration.mjs --capturer --manuel` construit
  les composants réels avec stores fictifs, hors ligne, sans application ni serveur : neuf
  captures à 360/768/1180 px ; navigation, cibles tactiles ≥ 44 px et débordement contrôlés.
  Image du pilote dans le manuel. `e2e/capturesDesJeux.spec.ts` étendu pour la même section
  et la page MJ dans l’application ; suite Electron non lancée dans cette tranche.

Validation de cette tranche : 248 tests ciblés (11 fichiers) et 70 essais Node verts ;
types `npx.cmd tsc -b`, lint ciblé et construction `npm.cmd run build` propres.
La construction conserve ses avertissements de taille de chunks/imports mixtes et Browserslist.
Modifications non commitées. Aucun service réseau, paquet ou profil personnel.

## Deuxième tranche intégrée — hôte privé et MU/TH/UR

David demande *« fais la 2ième tranche »*, puis confirme de nouveau *« Non, il est fermé. »*
avant les modifications dans `src/` et `electron/`. Base : commit **67900d3c**.

- `electron/modulesDuJeu/service.ts` : autorité native, file de mutations, droits par
  campagne/module/PJ, manifeste des commandes et filtre `vuePour`. IPC réservé au `webContents`
  du MJ ; projections séparées pour les sockets des joueurs. Aucune donnée privée dans Campaign.
- `SyncServer.ts` : canal `modules:*`, identité liée à la socket après inscription réussie,
  secret de reprise aléatoire, refus d’un appareil deviné, des collisions et de la récupération
  par simple IP partagée. Sans PJ déclaré, aucune identité privée héritée. Réponses ciblées,
  anti-rejeu borné, limite de commandes et seconde vérification de connexion dans la file.
- `stockage.ts` : fichier privé `userData/modules-du-jeu/instances.json`, écriture temporaire
  avec flush puis renommage ; publication après succès. Échec signalé jusqu’à une écriture
  réussie, préparation précédente conservée. Un retrait coupe les droits même si le disque
  échoue. Fichier illisible conservé sans écriture ni réinitialisation implicite.
- `magasins.ts`, `useHoteDesModules.ts`, `protocole.ts` : miroir MJ en mémoire pour sauvegardes
  manuelles/automatiques. Restauration par IPC avant les autres mutations de session, section
  facultative sans défaut. Nexus exporte seulement les instances de la campagne ; import et
  clone les rangent sous l’identifiant de destination. Codes/textes exclus du remappage média.
  Modules inconnus conservés sans exécution.
- `canalJoueur.ts` et `useHubSync.ts` : vues non persistées, contexte/révision/PJ vérifiés,
  attentes annulées à la fermeture et aucun rejeu après délai/déconnexion. La reconnexion
  redemande sa vue ; l’identité de la charge n’est jamais utilisée pour choisir son lecteur.
- `registre.ts` et `vuesDuRegistre.tsx` réutilisent MU/TH/UR, ses styles isolés et ses vues
  chargées à la demande. Cockpit : pupitre, accès par PJ pendant une séance, fermeture des
  accès/effets et choix de l’appareil sonore connecté/autorisé. Hub : carte, terminal et retour.
  Déconnexion/retrait/changement de PJ démontent la vue. Fin de séance, changement de campagne,
  restauration et redémarrage ferment les accès et arrêtent les effets ; préparation conservée.
- `video.ts` : média livré par Vite, GET/HEAD et Range 206/416 depuis dist/. Un seul appareil
  diffuse, après clic local d’activation sonore. Vidéo entière et relais sirène/voix réutilisés.

Validation : **392 tests ciblés (28 fichiers)**, **70 essais Node**, types, lint ciblé et
construction de production. Service, routage réel avec sockets/IPC simulés, deux PJ,
refus MJ/usurpations, stockage et sauvegardes éprouvés. Le banc `apercu-integration.mjs`
utilise le vrai hôte/moteur avec stockage/transport en mémoire : **21 captures** à
360/768/1180 px, ouverture MJ → commande PJ → vidéo muette décodée → retrait et refus du
second PJ. Captures relues ; trois images dans le manuel. Captures Electron étendues,
non lancées. Aucun port, application, installation ou profil personnel utilisé.

Piège : la première construction redirigée par PowerShell a signalé un faux échec sur
stderr (Browserslist), malgré la réussite Vite/Electron/PWA. Construction directe réussie
ensuite ; utiliser `npm.cmd run build` sans redirection PowerShell. Avertissements habituels
de taille de chunks/imports mixtes. Deuxième tranche **non commitée**.

## Troisième tranche intégrée — détecteur et coupure générale

David demande *« on fait l’étape 3 »* et confirme *« Non, il est fermé. »* avant
les modifications de `src/` et `electron/`. Base : **a128c7af**, dont les trois guides
ont été envoyés à NotebookLM après autorisation explicite. Aucun lancement d’application
depuis cette confirmation ; essais hors ligne et construction seulement.

- `outils/alien/modules/detecteur/` : manifeste, moteur pur v1, déclarations, vues React,
  styles isolés, documentation et tests. Seuls radar et réglages sont conservés ; aucun
  dialogue/code MU/TH/UR. Les commandes réutilisent `core.js`, le dessin est extrait dans
  `outils/alien/detecteur.js`, partagé avec l’atelier dont l’asset HTTP est déclaré.
- Registres natif et React/catalogue : détecteur disponible sans condition Alien dans
  le Hub. Destinataires indépendants de MU/TH/UR, plusieurs PJ reçoivent le même scan.
  Autoriser laisse en veille ; démarrer renouvelle les positions dans la proximité.
  Réglages enregistrés, faux écho de neuf secondes, aucun Stress écrit.
- Sons locaux sur clic, arrêt immédiat des oscillateurs et délais au retrait/démontage,
  nettoyage de la boucle de dessin ; page masquée muette, mouvements réduits fixes.
  Retour/reconnexion exigent une nouvelle activation sonore. Aucun haut-parleur réel testé.
- `ServiceDesModules.toutCouper`, IPC protégé et bouton commun : fermeture de tous les droits
  et effets. Même sur échec disque, la coupure en mémoire demeure et l’erreur reste visible.
  Le dernier retrait d’un module bénéficie aussi de cette coupure immédiate. Clé d’ouverture
  par PJ/module : un changement des droits d’un autre ne démonte plus son instrument ; une
  nouvelle ouverture après retrait exige un clic, même si React regroupe les mises à jour.
- Stockage/sauvegardes/export/import réutilisés ; restauration conserve les réglages mais
  coupe scan/faux écho et ferme les accès. Manuel 53/54 Alien/61 et captures actualisés.
  Banc : 33 captures de l’intégration + six de non-régression du détecteur autonome.

Validation : **411 tests ciblés (31 fichiers)** et **74 essais Node**, types,
lint ciblé et construction de production. **39 captures hors ligne** : 33 de
l’intégration aux trois tailles, puis six du radar autonome ; vues du détecteur
relues au téléphone, à 768 px et sur grand écran. Réseau/IPC testés en mémoire,
sons et horloges simulés ; aucun essai matériel ou service réseau. La capture
Electron est étendue, mais n’a pas été lancée. Troisième tranche non commitée.
Aucun paquet ou profil personnel utilisé.

## Quatrième étape — recette de bout en bout

David demande *« on fait le step 4 »*, puis confirme *« Non, il est fermé. »*.
Le lot A4 inclut les essais sur instance jetable : le vrai Electron, HTTP/WebSocket
et deux sessions Edge isolées sont maintenant éprouvés sur le PC, sans lire les profils,
sauvegardes ou pilotes exportés de David. Les modifications de la troisième tranche
étaient présentes et sont conservées ; aucun correctif du code applicatif ajouté en A4.

- `e2e/modulesDuJeuAlien.spec.ts` : six parcours réels, sans `appBridge` sur les clients.
  Droits séparés, réponse privée absente chez l’autre PJ et de la synchronisation commune,
  commande MJ falsifiée refusée ; scan partagé aux tailles 360/768/1180, retrait partiel,
  Web Audio local sur clic, coupure de connexion et reprise reconnue/muette, Tout couper.
- Film servi et décodé via HTTP ; plage 206 de 1 024 octets vérifiée, durée d’alerte
  ≥ 775,701 s, transfert du seul lecteur non muet sans modifier l’échéance, annulation.
  Fichier privé réellement écrit sous le profil jetable ; redémarrage et import par IPC
  conservent les contacts, avec effets arrêtés et droits fermés. Sortie audio de test muette.
- `outils/modules-du-jeu/recette-alien.mjs` et le pilote fictif
  `e2e/donnees/pilote-alien-accessoires.json` fournissent la même semence à l’E2E et à
  une répétition manuelle. Le script génère seulement un JSON dans `scratch/`. Toujours
  passer cette semence explicitement à `repetition` : son défaut cherche une sauvegarde
  personnelle, chemin interdit à l’agent. Pas de nouvelle mécanique de règles dans le pilote.
- [Recette et limites matérielles](2026-10-15-recette-modules-alien.md) : commandes et
  tableau des gestes sur Wi-Fi/tablettes/haut-parleurs. Aucun résultat physique prétendu.
  Plans, contrat et guides actualisés ; captures E2E et traces restent dans `scratch/`.

Pièges du banc : une case contrôlée par l’ACK natif se clique une fois puis s’attend par
`toBeChecked`, sans attendre une mutation optimiste avec `setChecked`. La fermeture réelle
d’un AudioContext coupe le graphe sans nécessairement émettre `ended` sur ses oscillateurs :
la sonde observe aussi la résolution de `close()`, au lieu d’annoncer un son fantôme.

Validation : six E2E au vert, build/types propres, lint du scénario et du générateur propre,
semence fictive générée. Cinq captures du vrai Hub, dont les trois tailles de radar, terminal
et film ; revue visuelle. Le film entier n’a pas joué treize minutes et aucune voix réelle
n’a été écoutée. Profils jetables fermés et supprimés par le banc ; aucun service laissé ouvert.
Étapes 3 et 4 non commitées. Aucun paquet installé.

## Reprendre

Lire le contrat v1, le plan commun, puis le plan Alien. Le standard est
formalisé ; G0–G2, MU/TH/UR et détecteur dans le Hub sont codés, testés hors ligne et
éprouvés par six E2E sur le vrai transport entre Electron et Edge sur le PC.
Reprendre par la recette sur deux appareils physiques, puis
les améliorations de dossiers/file de demandes et le périmètre de la
Table des Terres Médianes. Ne pas réécrire le moteur MU/TH/UR.
Le Wi-Fi, le clavier virtuel, la veille, la bande-son entière et les voix/sirènes réelles
restent à éprouver, distinctement du retour positif initial sur la bêta.

Redemander « GM-OS tourne-t-il ? » avant une future modification de `src/`
ou `electron/` : les E2E de cette étape ont lancé puis fermé l’application jetable.
Aucun paquet installé, aucune donnée personnelle consultée. Le seul média externe
est celui fourni par David. Validation de référence : 411 tests ciblés et 74 essais Node
de la troisième tranche, build/types/lint, 39 captures hors ligne ; puis six E2E A4 et
cinq captures du vrai Hub. Les annonces restent éprouvées par horloge/voix simulées ;
leur restitution et celle des sirènes restent à juger sur le matériel.

## Git et passation

Base de cette session : `d234a199` (pilote Alien réimporté), après le prototype
`98ed80a6` et les améliorations de règles Alien `b94a1c55`.
David demande ensuite explicitement *« commit »*. Documents, outils de référence,
adaptateur MU/TH/UR et première tranche intégrée sont regroupés dans le commit
`feat(modules): standardiser Alien et preparer son integration au Hub` ;
`git log` fournit son identifiant. Aucun push demandé ou effectué.
Les mentions « non commité » plus haut décrivent les étapes avant cette demande.
Éléments non suivis présents avant la session et conservés hors du commit :
`.claude/settings.local.json`, `Export Dirvers/`, `outils/jdr-pdf-vers-md/`.

David demande ensuite un second *« commit »* pour la tranche G2. Elle est regroupée
dans `feat(modules): raccorder MU-TH-UR au transport prive du Hub` ; `git log`
fournit son identifiant. La mention « deuxième tranche non commitée » décrit
l’état avant cette demande. Aucun push demandé ou effectué. Les trois éléments
hors chantier ci-dessus restent exclus.

David demande ensuite *« commit et pousse puis faire l’étape 5 - GM-OS est fermé »*.
Les étapes 3 et 4 sont regroupées dans
`feat(modules): integrer le detecteur Alien et valider le vrai Hub` ; `git log`
fournit l’identifiant. Le push est autorisé avec les hooks de validation et de
synchronisation NotebookLM. Les mentions « non commitées » ci-dessus sont historiques.
L’étape 5 commence après cet envoi : dossiers, file des demandes et préréglages nommés.

Le premier pré-push a trouvé deux écarts (7 812 tests verts, deux échecs) : résolution
de `userData` dans le constructeur de SyncServer et garde du nombre de portes du cockpit
restée à huit depuis l’ajout de Modules du jeu. Correctif isolé : hôte privé initialisé
par accesseur au premier besoin, test comportemental sans fichier/port ; garde portée à
neuf sans retirer son contrôle d’existence. Aucun essai de GM-OS lancé depuis la dernière
confirmation de fermeture. La validation complète est relancée avant le push.
