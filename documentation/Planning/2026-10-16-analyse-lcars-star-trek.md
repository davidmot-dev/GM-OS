# Analyse — LCARS de Star Trek dans le Tablet Hub

**16/10/2026 — analyse initiale, premier prototype (§ 16), puis sept postes complets en test (§ 17).**

Demande de David : « on va faire le LCARS de Star Trek, ne fais que l’analyse pour l’instant ».
Le choix du module est acquis. David confirme ensuite deux orientations :

- « Une passerelle immersive : consoles, scans, communications et alertes pilotés par le MJ. »
- « Le LCARS classique de TNG / DS9 / Voyager. »

Ces deux décisions cadrent l’analyse. Le détail fonctionnel ci-dessous reste une proposition ;
« continue » prolonge d’abord l’analyse demandée. David demande ensuite un module de test ;
le premier prototype isolé est décrit au § 16, sans intégration à l’application.

## 1. Intention et recommandation

Faire de chaque tablette une console de passerelle : les personnages obtiennent des
informations différentes, proposent des interventions et coopèrent sous le contrôle du MJ.
La boucle utile est **demande d’un officier → arbitrage du MJ → résultat ciblé → réaction
de l’équipage**, avec un état commun du vaisseau.

Orientation confirmée : une passerelle immersive, à laquelle on pourra ensuite raccorder
les règles vérifiées du vaisseau. Assistance aux jets, énergie, boucliers et dégâts relèvent
d’un chantier mécanique ultérieur. L’apparence retenue est celle du LCARS classique.

## 2. Ce que le dépôt permet déjà

État observé sur la branche `feature/tablet-hub-pwa`, base commitée `dc1ead2b`.
Des corrections d’horloges Alien sont présentes dans la copie de travail et décrites dans
la note du jour ; elles appartiennent à un autre travail et ne sont pas modifiées ici.

| Élément existant | Conséquence pour LCARS |
| --- | --- |
| Catalogue explicite de modules, références dans les pilotes et résolution du corpus | Ajouter une entrée compatible avec `star-trek`, y compris pour un pilote personnalisé. |
| Hôte commun, pupitre MJ, carte dans « Modules du jeu » | Aucune nouvelle navigation propre à Star Trek dans le Hub. |
| Droits par personnage, projections privées et moteur autoritaire | Le MJ ouvre LCARS ; le moteur peut filtrer les informations par poste. |
| Sauvegarde privée par campagne, exports/imports et migrations | La préparation LCARS peut suivre la campagne. |
| Retrait immédiat, déconnexion, arrêt des effets et accès fermés à la reprise | Réutiliser ces protections pour les alertes et consoles. |
| Sélection d’un diffuseur sonore pour un moteur qui la déclare | Une alarme commune peut sortir sur un seul appareil choisi. |
| Heure serveur fournie aux vues par l’hôte | Décomptes synchronisés sans supposer des horloges de tablettes identiques ; latence réseau non mesurée. |

Le catalogue et les registres n’enregistrent actuellement que les deux modules Alien.
LCARS n’est pas encore disponible. Les droits internes de console, la file d’interventions
et l’état du vaisseau sont à concevoir dans son moteur.

Le manuel Star Trek décrit déjà les jets 2d20, la spécialisation, l’Impulsion et la Menace.
Ces réserves et jets ont leurs propres services : LCARS ne doit pas créer une seconde copie
de leurs valeurs. L’inspection des registres et des points de raccordement ne révèle pas de
moteur de vaisseau prêt à brancher ; ce constat n’est pas un audit exhaustif de Combat-OS.

## 3. Un module, plusieurs consoles

Proposition : **un module `star-trek-lcars` et une instance par campagne**, avec un vaisseau
actif dans la première version. Les consoles partagent son état mais reçoivent des projections
différentes. Créer six modules indépendants compliquerait la cohérence du vaisseau et des alertes.

| Console proposée | Informations utiles | Interactions envisagées |
| --- | --- | --- |
| Commandement | Situation générale, objectifs et rapports partagés | Donner un ordre, demander un rapport, proposer un niveau d’alerte. |
| Science | Contacts révélés, anomalies et analyses disponibles | Demander un scan ciblé, une analyse ou un complément d’information. |
| Ingénierie | État qualitatif des systèmes et incidents connus | Demander un diagnostic, proposer une réparation ou une reconfiguration. |
| Communications | Canaux, interlocuteurs identifiés et messages autorisés | Ouvrir un canal, envoyer un message, demander un décodage. |
| Navigation | Destination, itinéraire préparé et obstacles connus | Proposer un cap, une manœuvre ou un passage en distorsion. |
| Tactique / sécurité | Contacts identifiés et état défensif publié | Demander une identification, proposer une posture ou une intervention. |

Ces interactions sont des propositions de fiction, sans application automatique d’un bonus,
d’une dépense ou d’un résultat de jet. La vue de commandement n’accorde pas les droits du MJ.
Un poste médical pourrait venir ensuite avec ses propres informations, après définition du besoin.

Le MJ attribue une ou plusieurs consoles à un personnage. Cela permet de jouer avec deux
ou trois personnes ; un poste vacant peut rester géré par le MJ. Pour la V1, éviter de rendre
les postes exclusifs : plusieurs officiers peuvent les consulter, avec identification de
l’auteur de chaque demande. Un verrou de commandement exclusif serait une option ultérieure.

Les droits appartiennent au personnage. Un même personnage sur deux appareils retrouve les
mêmes consoles ; le choix de l’appareil qui produit le son reste distinct.

## 4. Parcours de jeu proposé

1. **Avant la séance :** préparer le vaisseau, les états de systèmes, les contacts, les rapports
   et quelques réponses types ; définir les affectations de consoles.
2. **À l’ouverture :** le MJ autorise LCARS aux personnages choisis. Chaque joueur retrouve
   la situation commune et ses seules consoles autorisées.
3. **Pendant la scène :** Science demande une analyse d’une anomalie ; Ingénierie demande
   un diagnostic de propulsion. Les deux demandes arrivent dans la file du MJ.
4. **Arbitrage :** le MJ demande éventuellement un jet par les outils habituels, puis publie
   un résultat préparé ou saisi. L’animation de scan ne détermine jamais la réussite du jet.
5. **Coopération :** le résultat scientifique reste d’abord chez son destinataire ; il peut
   transmettre au commandement le rapport dont le partage est autorisé. Le diagnostic peut
   conduire le MJ à publier une panne commune et à changer le niveau d’alerte.
6. **Fin :** le retrait des accès et « Tout couper » arrêtent les sons et effets. La préparation
   et les rapports sauvegardés restent disponibles pour une prochaine ouverture volontaire.

Une animation de recherche peut être courte et se terminer par « Analyse transmise — résultat
en attente ». Elle ne doit pas tourner indéfiniment pendant que le MJ s’occupe d’un autre joueur.

## 5. Pupitre MJ et charge de préparation

Proposer quatre espaces fonctionnels : **Passerelle**, **Interventions**, **Préparation**
et **Effets**. Leurs noms et leur disposition ne sont pas encore une maquette validée.

- Passerelle : vue des postes, officiers affectés, systèmes publiés et niveau d’alerte.
- Interventions : file commune triée, destinataire et console explicites, réponse préparée
  ou libre, statuts en attente/traitée/annulée et accusés de lecture.
- Préparation : contacts, rapports, réponses types et préréglages de situation nommés.
- Effets : alerte, durée facultative, diffuseur sonore, silence et arrêt immédiat.

Le risque principal est la charge du MJ. Prévoir dès la V1 une recherche dans les réponses
types, une publication à plusieurs destinataires et des statuts clairs. Une réponse peut
être publiée directement si le MJ l’a explicitement préparée comme consultation libre.
Les découvertes importantes restent soumises à son arbitrage. Aucune réponse générée par IA
n’est nécessaire au fonctionnement de base.

Préréglages possibles : exploration normale, anomalie détectée, communication entrante,
panne locale ou alerte générale. Charger un préréglage doit montrer ce qu’il modifie ; il
ne doit pas réécrire les affectations ou effacer les demandes sans action explicite.

## 6. Première version recommandée et extensions

**V1 utile à la table :** un vaisseau ; état commun qualitatif ; affectations multiples ;
Science, Ingénierie et Communications comme premiers parcours complets ; synthèse de
commandement ; file MJ ; rapports ciblés et partagés ; réponses types ; alerte visuelle
commune et bips courts activés localement ; sauvegarde et reprise.

Navigation et Tactique peuvent être ajoutées après validation de cette boucle. Les six
consoles du tableau constituent la cible fonctionnelle proposée, pas six écrans à livrer
obligatoirement en même temps. Sur une petite table, le MJ peut aussi attribuer toutes les
consoles disponibles à deux personnages.

**Étape suivante possible :** médias de communication, plan du vaisseau, contacts spatiaux
graphiques, poste médical et scénarios d’incidents coordonnés. Ces besoins doivent se raccorder
aux documents/médias existants avec leurs droits ; le contrat JSON des modules ne fournit pas
à lui seul un service d’importation et de diffusion privée de fichiers arbitraires.

**Chantier mécanique séparé :** fiche de vaisseau, dé d’assistance, énergie, boucliers, brèches,
avantages de rôles et combat spatial. Les notes locales correspondantes portent `relu: false`
et présentent des formulations à vérifier ; elles ne suffisent pas à figer une implémentation.
Relire les règles de l’édition jouée avant de définir les automatismes et leur source de vérité.
Des jauges décoratives en pourcentage ne doivent pas être présentées comme des valeurs officielles.

## 7. Apparence, tactile et son

Le LCARS serait un habillage **interne au module**, distinct du thème global Star Trek déjà
présent dans le dépôt. Le cadre du Hub conserve son thème. Aucun nouveau thème de jeu n’est
fabriqué dans ce chantier ; si un nouveau thème est souhaité, il suit la filière du constructeur.

Direction confirmée : LCARS classique de TNG / DS9 / Voyager. Traduction graphique proposée :
courbes et bandes, palette chaude et mauve sur fond sombre, textes français lisibles et zones
d’action clairement identifiées. Les nombres
décoratifs restent secondaires ; aucun faux bouton ne doit ressembler à une commande disponible.
Le thème Star Trek actuel est orienté bleu graphite : il ne détermine pas à lui seul cette variante.

Prévoir des cibles tactiles d’au moins 44 px, un mode paysage et portrait et un repli en une
colonne sur smartphone. Une navigation latérale de passerelle devient un sélecteur de console
compact en portrait. Les informations importantes restent textuelles, même quand leur couleur change.

L’effet recherché est celui d’une interface nette, avec balayages et transitions brèves.
Les retours d’Alien invitent à vérifier tôt le contraste sur iPad, iPad Air, Samsung et smartphone.
En mouvements réduits, conserver un état visuel fixe explicite. Les animations ne déplacent pas
les commandes et ne remplacent pas les indications de liaison ou d’attente.

Réutiliser le principe déjà choisi par David pour Alien comme proposition : un appareil désigné
pour l’alarme commune, les autres en affichage visuel. Le son exige une activation locale ; les
bips de manipulation peuvent être désactivés séparément. Les annonces vocales et voix du système
restent une extension à éprouver, particulièrement sur Safari mobile. Aucun son ne doit reprendre
automatiquement après une déconnexion, un import ou une ancienne séquence déjà terminée.

## 8. Données, droits et raccordement envisagés

État privé proposé : identité du vaisseau, systèmes qualitatifs, affectations par personnage,
contacts et rapports préparés, règles de publication, demandes et historique bornés,
préréglages, alerte courante et diffuseur sonore. Séparer les textes préparés secrets des
rapports effectivement publiés. Un changement de modèle ne réécrit pas un ancien rapport déjà reçu.

Chaque commande doit être contrôlée par le moteur : rôle MJ, accès au module vérifié par l’hôte,
console affectée et droit sur la donnée visée. Cacher un onglet ne protège pas ses informations.
Le serveur ne transmet ni les contacts non révélés ni les réponses des autres postes.

Un changement d’affectation doit invalider les commandes en vol de l’ancien poste, même si le
module reste ouvert : prévoir une version d’affectation contrôlée par le moteur et nettoyer
les effets propres à la console quittée. L’alerte commune suit les droits restants du personnage.
Une opération déjà reçue puis réessayée après reconnexion ne doit pas créer deux interventions.

Les affectations peuvent être conservées comme préparation de campagne ; les accès restent
fermés au redémarrage/import. `arreterEffets` doit arrêter alertes, scans et diffusion sonore,
sans supprimer les rapports et incidents persistants. Les demandes non résolues doivent retrouver
un état visible, sans redémarrer une animation ou un son ancien.

Raccordement technique envisagé : manifeste, moteur pur, migrations, vues joueur/MJ et styles
isolés dans un futur dossier LCARS ; enregistrement dans le catalogue, le registre natif et
le registre des vues ; sélection explicite dans le pilote Star Trek. Aucun nouveau service
réseau ni paquet n’est justifié par la V1 proposée. La réutilisation concerne les contrats et
les services de l’hôte ; le métier de MU/TH/UR et ses protocoles Alien restent distincts.

Le contrat v1 paraît suffisant pour cette V1. C’est une conclusion d’analyse : l’intégration
devra encore le démontrer, notamment lors du transfert de console et de la révocation des droits.

## 9. Validation à prévoir lors du développement

- Moteur : commandes de postes non autorisés refusées ; projections sans secrets ; transfert
  de console ; historique borné ; migrations et coupure idempotente.
- Hôte : pilote personnalisé Star Trek, droits par PJ, campagne/export/import, sauvegarde
  défaillante et coupure sans attendre le disque.
- Hub réel : plusieurs PJ et consoles, deux demandes simultanées, changement d’affectation
  pendant une demande, déconnexion/reconnexion et aucun rejeu d’ancienne action.
- Effets : diffuseur unique, transfert du son, arrêt immédiat, horloges décalées et mouvements réduits.
- Matériel : quatre types d’appareils de David, clavier virtuel, rotation, veille et lisibilité
  du LCARS au repos et en alerte, puis manuel des jeux et captures.

Pour la passe d’analyse initiale : aucun test ni application lancé, aucun code, manifeste,
pilote ou thème ajouté. Le jalon de test ultérieur est décrit au § 16.

## 10. Décisions acquises et propositions encore ouvertes

**Acquis :** passerelle immersive contrôlée par le MJ ; esthétique LCARS classique.
L’analyse retient donc un état du vaisseau renseigné par le MJ, sans dépense automatique
de ressource ni calcul de dégâts dans cette première proposition.

**À discuter :** les consoles prioritaires selon les personnages joués, la place des images
et enregistrements dans la première livraison et les droits de partage des rapports.
Les valeurs par défaut proposées sont décrites ci-dessous pour rendre le périmètre examinable.
Elles ne constituent pas des décisions attribuées à David.

## 11. Première version : parcours fonctionnels détaillés

### Entrée et situation commune

Après ouverture par le MJ, la carte « LCARS — Passerelle » apparaît dans Modules du jeu.
Le joueur voit le nom et l’identifiant du vaisseau, la situation publiée, le niveau d’alerte,
l’état de liaison et les consoles qu’il peut utiliser. Un changement de poste ne nécessite
pas de quitter le module. Sans affectation, une vue commune indique que le MJ doit attribuer
une console ; elle ne laisse pas parcourir celles des autres personnages.

Sur tablette paysage : bandeau commun, sélecteur de console et panneau principal. Sur
smartphone : les mêmes fonctions dans une colonne, avec un sélecteur compact. Les commandes
réelles portent des verbes et un libellé complet ; les barres décoratives ne sont pas tactiles.
Le retour au Hub et l’indication de connexion restent accessibles pendant une alerte.

### Science : du contact au rapport

Le MJ prépare un contact et choisit ce qu’il révèle : par exemple « Contact 03 — nature
indéterminée ». Son identité réelle et les futures découvertes restent privés côté MJ.
L’officier sélectionne ce contact, choisit « Scan général » ou « Analyse ciblée » et peut
ajouter une question courte. Une confirmation indique précisément ce qui est envoyé.

Une courte animation signifie que la demande part ; elle se termine par un état d’attente
stable. Le MJ peut publier un rapport préparé, répondre librement ou indiquer qu’un jet doit
être résolu par les outils habituels. Le rapport reçu reste consultable après l’animation.
Des scans identiques sur le même contact ne doivent pas multiplier les demandes pendant
qu’une réponse est déjà attendue. Une nouvelle question distincte reste possible.

### Ingénierie : de l’incident à l’intervention

Les systèmes affichent des états qualitatifs publiés par le MJ : nominal, perturbé,
hors service ou état inconnu. Un commentaire explique la panne connue sans révéler sa cause
secrète. Proposition de liste préparatoire : propulsion, alimentation, détection,
communications, défenses et support de vie ; les libellés sont éditables et ne prétendent
pas représenter les caractéristiques officielles de la fiche de vaisseau.

Le joueur sélectionne un système puis demande un diagnostic ou propose une intervention.
Le MJ publie le diagnostic et accepte ou refuse la proposition avec une conséquence expliquée.
L’acceptation seule ne remet pas implicitement tous les systèmes à neuf : le MJ choisit
explicitement l’état résultant. Les jauges énergétiques mécaniques attendent leur raccord.

### Communications : un échange suivi

Le MJ révèle un canal ou un interlocuteur. Le joueur demande l’ouverture d’une liaison ou
envoie un message. Les réponses forment un fil lié à ce canal, avec émetteur, destinataire
et statut de transmission ; une rupture décidée par le MJ est distincte d’une déconnexion
réelle du Hub. La console ne doit jamais afficher « transmission confirmée » si le serveur
n’a pas enregistré le message.

La première proposition privilégie le texte. Une image ou une vidéo dans un appel demande
en plus un raccordement aux médias protégés et aux restrictions de lecture automatique ;
son importance pourra faire évoluer le périmètre, sans la supposer livrée par le simple habillage.

### Commandement : coordonner l’équipage

Le commandement voit la synthèse publiée et les rapports partagés, puis adresse un ordre
à une console ou à tout l’équipage. Le destinataire peut en accuser réception. L’accusé
signifie « ordre lu » ; seule la résolution de l’intervention indique son exécution.
Un rapport privé d’un autre poste n’y apparaît pas automatiquement.

Pour limiter la portée de la V1, le MJ reste le seul à appliquer une alerte commune ou un
changement de système. Le commandement peut les proposer. Donner au capitaine un contrôle
direct serait une permission explicite ultérieure, pas un droit implicite lié au nom du poste.

## 12. Préparation et conduite de séance côté MJ

Le parcours de préparation proposé est : nommer le vaisseau → définir ses systèmes → préparer
contacts et rapports → affecter les consoles → ouvrir les accès pendant la séance. La
préparation peut être partielle : le MJ peut saisir un rapport ou un interlocuteur en direct.
Un scénario ne doit pas obliger à remplir toutes les consoles avant de commencer.

Chaque élément préparé distingue son **contenu secret**, sa **présentation révélée** et les
**destinataires autorisés**. Publier un rapport en conserve une copie datée : corriger ensuite
le modèle préparatoire ne réécrit pas ce que les joueurs avaient reçu.

La file MJ rassemble les interventions de tous les postes, avec filtres par console et
personnage. Une demande identifie auteur, cible, intention et heure ; elle peut être prise
en charge, résolue ou annulée. La prise en charge évite de confondre une demande oubliée
avec une action en cours. Les attentes de jet sont explicites, sans les traiter comme des refus.

Pour une réponse, le MJ choisit le contenu et ses destinataires dans le même geste. Publier
à tous exige une sélection explicite. L’auteur voit sa demande résolue ; un autre destinataire
reçoit seulement le rapport partagé, sans découvrir les questions ou notes confidentielles.

Le MJ peut autoriser certaines informations préparées en consultation immédiate, par exemple
le dossier public d’une planète. Les autres réponses passent par sa file. C’est le réglage du
contenu qui autorise cette consultation, jamais un compte à rebours de scan arrivant à zéro.

## 13. Alertes et effets : proposition bornée

Trois niveaux proposés : normal, alerte jaune et alerte rouge. Le libellé, le texte de
situation et l’éventuelle échéance sont visibles en clair. La couleur accentue l’état mais
ne suffit jamais à l’identifier. Le MJ peut lancer, remplacer ou terminer une alerte.
Un préréglage peut réunir texte, états de systèmes et niveau d’alerte dans une publication
cohérente ; son résumé doit permettre au MJ de vérifier les changements avant envoi.

L’alerte est commune aux personnages autorisés ; les détails d’un incident peuvent rester
ciblés. Une seule alerte principale active suffit à la V1 ; les incidents simultanés restent
des entrées distinctes de la liste des systèmes ou des rapports.

Les balayages de scan et transitions sont brefs. L’alarme sonore commune, si activée,
utilise le diffuseur choisi. Les autres consoles affichent le même état visuel sans rejouer
l’alarme sur chaque tablette. « Arrêter les effets » conserve la situation publiée tout en
coupant les sons et animations ; « Tout couper » retire aussi les accès selon le contrat commun.
Une pause des effets ne doit pas être présentée comme la résolution d’une panne.

Une reconnexion reçoit l’état courant et un historique borné. Elle ne rejoue pas les anciens
bips d’arrivée, messages ou scans. L’activation locale du son est à renouveler après une
coupure de connexion. Une alerte terminée pendant l’absence reste terminée au retour.

## 14. Scénario de référence pour la future validation

Trois officiers approchent une station silencieuse. Science reçoit un contact inconnu ;
Ingénierie voit les communications perturbées ; Communications reçoit un fragment de message.
Les trois peuvent agir simultanément, chacun depuis sa console.

Le MJ répond au diagnostic avant le scan, publie ensuite le scan uniquement à Science,
puis partage le rapport au commandement à la demande autorisée du joueur. Il passe en
alerte jaune, réaffecte la console d’Ingénierie et termine l’alerte pendant qu’une tablette
est déconnectée. Au retour, celle-ci retrouve les rapports permis et la situation normale.

Cette scène doit permettre de vérifier :

| Critère | Résultat attendu |
| --- | --- |
| Trois demandes simultanées | Aucune perte ni confusion de réponses ; ordre de résolution libre pour le MJ. |
| Console sans autorisation | Ni contenu secret ni commande utilisable, même par envoi direct au serveur. |
| Rapport ciblé puis partagé | Seuls les destinataires choisis reçoivent chaque publication. |
| Transfert de console | L’ancien titulaire perd ses droits ; sa commande en vol ne reste pas valable. |
| Scan sans réponse immédiate | Animation terminée, attente lisible ; aucun succès inventé. |
| Alerte sur plusieurs appareils | État commun, un seul diffuseur sonore, silence immédiat à la coupure. |
| Déconnexion puis retour | Situation à jour, aucune ancienne action renvoyée ou animation rejouée. |
| Redémarrage ou import | Préparation et rapports conservés, accès fermés, effets arrêtés. |
| Mode mouvements réduits | Même information avec un rendu fixe et lisible. |

## 15. Découpage proposé après validation de l’analyse

1. **Cadrage visuel :** maquettes joueur et MJ, avec une scène commune aux quatre espaces,
   formats 390 et 1 024 px et état d’alerte ; pas de moteur de règles de vaisseau.
2. **Boucle jouable :** Science, un contact, une demande et un rapport ciblé, dans un banc
   fictif. Éprouver le geste MJ avant d’étendre les consoles.
3. **Passerelle commune :** Ingénierie, Communications, synthèse de commandement,
   affectations et réponses préparées.
4. **Intégration et effets :** catalogue/pilote, autorisations, sauvegarde, alertes et
   diffuseur sonore, puis scénario de référence du vrai Hub.
5. **Recette matérielle et manuel :** appareils de David, lisibilité et gestes tactiles,
   veille, reconnexion, son et captures du guide Star Trek.

Ce découpage sert à estimer et examiner le projet. Le jalon Science est ensuite abordé
par un prototype isolé (§ 16) ; les autres phases et le raccordement restent à réaliser.

## 16. Premier module de test — suite du 16/10

David : « est-ce que tu sais faire le développement d’un module de test ? ».
La demande est traitée comme un premier jalon de développement, isolé de GM-OS.
Sources dans [outils/star-trek/lcars](../../outils/star-trek/lcars/README.md) et aperçu généré
dans `scratch/lcars-v1/apercu.html` : console Science, deux officiers fictifs, contact visible
et contact caché, scans, arbitrage MJ, rapport privé et partage explicitement autorisé.
Pupitre : affectations, file, préparation des contacts, situation et alertes visuelles.

Le manifeste v1 est conforme ; le moteur contrôle les rôles et affectations et filtre ses
projections. Le banc local permet volontairement de changer de rôle et embarque ses secrets
fictifs : ce n’est ni une authentification ni une preuve de transport privé entre appareils.
État uniquement en mémoire, sans sauvegarde de campagne, son ou vidéo pour ce jalon.

Validation : **12 tests Node**, lint ciblé et compilation de l’atelier propres ; parcours
d’interface hors ligne avec **dix captures de 360 à 1 024 px**, sans débordement ni erreur
JavaScript. Scan animé et mouvements réduits, attente après 2,6 s, réponse privée, partage,
alerte et arrêt vérifiés. Vues Science/MJ/alerte relues. Les premiers essais ont révélé des
libellés de sélecteurs ambigus et un en-tête trop étroit sur smartphone, corrigés avant validation.

Aucun fichier `src/` ou `electron/`, pilote, thème global ou catalogue de GM-OS modifié pour
ce prototype ; aucune application ou service réseau lancé. Pas de commit demandé.
Reprendre par un essai visuel du HTML avec David, puis cadrer le prochain jalon ou le raccord
au vrai Hub. Avant tout futur changement dans `src/` ou `electron/`, vérifier la fermeture
de GM-OS selon `AGENTS.md`.

## 17. Passerelle complète en test — suite du 16/10

David : « ok fait le module en entier avec toute les options en test ».
Le prototype autonome passe en **0.2.0, données v2, contrat v1**. Le périmètre reste la
passerelle immersive arbitrée par le MJ, sans règles automatiques de vaisseau et sans
raccordement au vrai Hub. Tous les postes proposés sont maintenant disponibles :
Commandement, Science, Ingénierie, Communications, Navigation, Tactique et Médecine.

Les **19 actions** propres aux postes alimentent la file MJ ; celui-ci prend en charge,
demande un jet, accepte ou refuse, transmet un rapport et peut appliquer l’état résultant.
Ordres ciblés et accusés de lecture ; rapports privés, partage autorisé, publications MJ
par postes ; création/édition/masquage/suppression des éléments et attribution des consoles.
Les préréglages nommés conservent la situation et les états sans écraser l’équipage ou les
rapports. Les sons, annonces vocales, alertes et décomptes se coupent sur commande.

Images/audio/vidéos joints aux rapports, intégrés au JSON de l’atelier (4 Mo/fichier,
état ≤ 16 Mo), sans URL distante. Sélection d’un diffuseur et activation audio locale.
Les voix dépendent du navigateur. Dans cette page, changer de rôle démonte l’ancienne vue :
elle ne simule pas un haut-parleur distant qui continuerait à jouer en arrière-plan.

L’atelier sauvegarde maintenant automatiquement sa préparation et ses historiques dans
sa propre clé locale. Export privé, import validé puis confirmé, migration des données v1,
erreurs de quota et copies illisibles gérées sans écrasement silencieux. Les effets sont
arrêtés à la reprise/import. Le fichier HTML conserve son chemin `scratch/lcars-v1/apercu.html`.

Validation finale : **34 essais Node**, manifeste conforme, lint et compilation locale
propres ; parcours des sept consoles et des options, **21 captures hors ligne** sans
débordement ou erreur JavaScript. Décodage réel PNG/WAV/WebM ; Web Audio réel mais sortie
muette ; voix simulées. Journal `scratch/lcars-complet-final.log`. Vues Ingénierie/tablette,
Médecine/smartphone et ordre du commandement relues. La première vidéo synthétique ne
contenait pas d’image, car l’horloge simulée arrêtait l’encodage avant le travail du codec :
le banc produit désormais son clip sur une page sans horloge simulée.

Aucun GM-OS, service réseau, paquet ou donnée personnelle utilisé. Le banc conserve tous
ses secrets fictifs et son changement de rôle n’authentifie personne. L’essai sur vrais
appareils et le transport multi-appareils attendent une phase ultérieure. Les sources et
le [guide complet](../../outils/star-trek/lcars/README.md) restent non commités.

## 18. Instruments distincts par poste — suite du 16/10

David constate « c'est toujours le même écran, on ne voit pas la différence » et autorise
la différenciation des consoles, avec Stitch si nécessaire. L’atelier passe en **0.3.0** ;
format de données v2 conservé. Réalisation directe en React/CSS/SVG dans le module isolé,
sans service externe ni changement de thème global.

`consoles.mjs` remplace le panneau commun par sept instruments : table de commandement
avec objectifs et suivi des ordres ; laboratoire Science avec capteurs et spectre ; coque
et circuits en Ingénierie ; canaux/récepteur/transcription en Communications ; carte et
itinéraires en Navigation ; secteurs et réticule en Tactique ; dossiers et repère anatomique
en Médecine. La sélection d’une fiche et celle du formulaire restent synchronisées.
Les formulaires portent des titres et invitations propres à chaque poste. Les figures
restent symboliques ; les états viennent de la projection du MJ. Aucune mesure inventée,
aucun changement du moteur, des permissions ou du format de sauvegarde.

Validation : manifeste conforme, **34 tests Node**, lint propre ; recette complète et
**42 captures** à 390/1 024/1 280 px, contrôles de débordement à 360 px pour les sept postes.
Sélections bidirectionnelles et mouvements réduits vérifiés. Les sept instruments tablette,
quatre instruments smartphone et deux vues grand écran ont été relus. Rapport privé,
partage, ordres, médias/audio et reprise/import restent validés. Aucune erreur JavaScript.
Les appareils physiques restent à essayer. Recharger `scratch/lcars-v1/apercu.html`, choisir
**Officier de test** et comparer les sept postes. David demande ensuite « commit tes changements » :
sources et documentation LCARS regroupées dans le commit `feat(lcars)` du 16/10,
sans les travaux des autres chantiers. Aucun push demandé.

## Sources du dépôt inspectées

- [Manuel Star Trek](../User%20Guides/54-Jeu-Star-Trek.md) et [mécaniques communes](../User%20Guides/53-Les-jeux-et-leurs-mecaniques.md).
- [Contrat des modules](../Architecture/Contrat-des-modules-du-jeu.md), notamment vues, permissions et cycle de vie.
- [Catalogue](../../src/modules/modulesDuJeu/catalogue.ts), [registres des vues](../../src/modules/modulesDuJeu/vuesDuRegistre.tsx), [moteurs](../../electron/modulesDuJeu/registre.ts) et [service natif](../../electron/modulesDuJeu/service.ts).
- [Pupitre commun](../../src/modules/modulesDuJeu/ModulesDuJeuMJ.tsx), [protocole](../../src/modules/modulesDuJeu/protocole.ts), sauvegardes et transport des modules.
- [Rôles de passerelle](../../docs/systems/star-trek/rules/les-roles-de-passerelle-et-roles-militaires.md), [assistance du vaisseau](../../docs/systems/star-trek/rules/l-assistance-du-vaisseau-spatial.md) et inventaire local : notes générées non relues, pistes pour une vérification ultérieure.
- [Intention du thème Star Trek](../../docs/systems/star-trek/theme/intention.md) et [reprise du jour](2026-10-16-etat-et-reprise.md).

Le registre et la reprise du jour sont déjà modifiés par un autre travail à l’ouverture
de cette analyse. Cette note autonome évite d’écrire dans ses fichiers ; leur raccordement
au registre pourra se faire après coordination entre écrivains.
