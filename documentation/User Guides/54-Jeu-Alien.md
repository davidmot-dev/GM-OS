# 👽 Jeu — Alien

> **Pilote décrit :** « ALIEN, le jeu de rôle », exporté le 2026-10-20, corrigé A3 le 2026-10-21 (version 1.3.0, conserve A0–A2). Retour à [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Le moteur Year Zero : une réserve de d6, et des **dés de Stress** qui font monter la peur.

**Ajout du 15/10/2026 — préparation des modules :** dans l’éditeur du pilote, **Modules du jeu**
permet de conserver ou retirer **MU/TH/UR 6000** et le **Détecteur de mouvement**. Un ancien pilote
Alien les propose par défaut, même avec un identifiant personnalisé. Le choix est sauvegardé et
exportable. Le cockpit possède aussi l’entrée **Modules du jeu** pour préparer et ouvrir ces outils.

![Sélection des modules du pilote Alien, composants réels dans un banc isolé avec données fictives](captures/jeu-alien-modules.jpg)

Les captures de cette section montrent les composants et le moteur réels dans un banc hors ligne,
avec données fictives. MU/TH/UR et le détecteur sont raccordés au Hub, avec des accès indépendants.

### Préparer et ouvrir MU/TH/UR

1. Ouvre **Cockpit › Modules du jeu › Ouvrir le pupitre**.
2. Prépare les **Dossiers**, **Protocoles** et **Réglages**. Les modifications sont enregistrées
   automatiquement ; une erreur d’écriture est signalée et garde les données précédentes.
3. Démarre une séance et coche les PJ dans **Accès des personnages**. Chaque joueur ouvre
   **Tablet Hub › Modules du jeu › Ouvrir MU/TH/UR 6000**, avec son personnage habituel.
4. Choisis un opérateur dans le pupitre pour répondre à ses questions ou arbitrer ses piratages.
   Ses réponses et ses dossiers déverrouillés restent privés.

![Le pupitre MU/TH/UR dans le cadre commun des modules](captures/jeu-alien-pupitre-module.jpg)

![Le terminal du vrai Tablet Hub à 1 024 px, avec trame CRT et parasites renforcés](captures/jeu-alien-module-joueur.jpg)

### Ranger les dossiers et traiter plusieurs demandes

Dans **Dossiers**, sélectionne un dossier puis **Monter le dossier** ou **Descendre le dossier**.
Cet ordre devient celui de la commande **LIST**. Pour supprimer, coche **Confirmer la suppression
du dossier**, puis **Supprimer le dossier**. Ses déverrouillages sont retirés ; les textes déjà
lus restent dans les dialogues. **Nouveau dossier…** permet d’en créer un autre.

![Classement et suppression d’un dossier](captures/jeu-alien-dossiers.jpg)

Dans **Terminal**, choisis l’opérateur puis la **Demande à traiter**. Chaque `/M question`
rejoint sa file privée ; plusieurs questions et un piratage peuvent attendre ensemble. Sélectionne
une question pour lui répondre ou le piratage pour l’autoriser/le repousser. **Message libre à cet
opérateur** transmet un message sans traiter de question. **Demandes traitées** garde le texte,
la réponse et le résultat. La révocation annule les demandes encore en attente.

La file accepte 32 demandes en attente par personnage et garde jusqu’à 128 demandes avec leur
historique. **CLEAR** nettoie le journal du joueur sans effacer les demandes. Les demandes sont
conservées à la reprise d’une campagne ; les autres personnages ne les reçoivent pas.

**HACK** brouille fortement le terminal pendant **cinq secondes dès son lancement**, puis
revient à l’affichage habituel en attendant le MJ. Une répétition pendant l’attente ne
prolonge pas le brouillage. Ce départ ne donne aucun privilège ; seul l’arbitrage du MJ
accorde ou refuse l’intrusion. Les réglages CRT/parasites et mouvements réduits s’appliquent.
Avec les mouvements réduits, le départ reste visible sous forme de parasites fixes
et de couleurs décalées, sans animation ni clignotement. Pour le brouillage animé,
activer **Parasites visuels** dans les réglages de MU/TH/UR et autoriser les animations
sur l’appareil. Le Hub calcule la durée depuis l’heure du PC MJ, même si la tablette
affiche une autre heure ; rouvrir le module ne relance pas un signal expiré.
Sur tablette et écran tactile, la trame CRT est plus large et le grain des parasites
plus contrasté, y compris en mouvements réduits où il reste fixe. Le refus de HACK
conserve son effet atténué pour laisser lire la réponse.

![Départ du piratage : brouillage fort de cinq secondes dans l’atelier du module](captures/jeu-alien-hack-depart.png)

![Plusieurs demandes dans la file privée de l’opérateur](captures/jeu-alien-demandes.jpg)

### Alerte et diffusion sonore

Les protocoles associent des codes exacts à un message et, éventuellement, à l’ouverture/fermeture
des portes fictives ou à l’autodestruction. Le code d’exemple **OMEGA-10** déclenche le film entier
du Nostromo : le compte à rebours dure au moins **12 min 56 s**. **OMEGA-STOP** annule la séquence.
Les codes se modifient dans **Protocoles**.

Dans la carte du module, **Son : nom de l’appareil** réserve la diffusion à une seule tablette
connectée et autorisée, ou à **Ce poste MJ**. Sur cet appareil, touche aussi **Activer le son**.
Les autres écrans restent muets. La bande-son du film a priorité ; si l’alerte continue ensuite,
la sirène et les annonces reprennent. La lecture automatique bloquée propose **Reprendre la vidéo**.

### Préparer et ouvrir le détecteur

1. Dans **Cockpit › Modules du jeu**, ouvre le pupitre de **Détecteur de mouvement**.
2. Prépare **Contacts** (0–9), **Proximité** (0 loin, 100 près), **Intensité**, **Volume des bips**
   et **Parasites**, puis **Enregistrer les réglages**. CRT et parasites se désactivent séparément.
3. Pendant une séance, coche ses destinataires, indépendamment des accès à MU/TH/UR.
   Autoriser l’instrument le laisse en veille ; **Démarrer le scan** le met en activité.
4. Chaque activation tire les positions au hasard dans la proximité choisie, identiques sur
   les appareils autorisés. **Faux écho · 9 s** ajoute un contact temporaire sans déplacer les autres.
5. Le joueur ouvre sa carte dans le Hub et touche **Activer les bips ici** s’il souhaite les entendre.
   Les bips sont locaux ; ils ne suivent pas le choix du diffuseur d’alarme MU/TH/UR.

![Le pupitre du détecteur, réglages et scan dans le banc isolé](captures/jeu-alien-detecteur-mj.jpg)

![Le détecteur reçu par un personnage autorisé](captures/jeu-alien-detecteur-joueur.jpg)

Pour préparer plusieurs ambiances, applique d’abord les réglages avec **Enregistrer les réglages**.
Dans **Préréglages nommés**, choisis **Nouveau préréglage…**, donne un nom puis **Enregistrer les
réglages actuels**. Ils mémorisent contacts, proximité, intensité, volume et parasites du radar.
Sélectionne ensuite un nom et **Charger et arrêter le scan** : le détecteur revient en veille,
sans faux écho. Lance le scan au moment voulu. Tu peux remplacer le préréglage choisi par les
réglages actuels, le renommer ou le supprimer après confirmation. Jusqu’à 32 noms sont conservés
par campagne, dans les sauvegardes et exports ; ils restent réservés au MJ.

![Préréglage rappelé avec le scan arrêté](captures/jeu-alien-prereglages.jpg)

**Arrêter le scan** garde les accès et les réglages. Retirer un PJ ferme uniquement son instrument,
sans interrompre celui des autres ; le dernier retrait arrête le scan. Le détecteur est un
accessoire de mise en scène : aucune distance réelle mesurée, aucun jet ou Stress automatique.
Les mouvements réduits gardent le radar fixe. Un onglet masqué coupe ses bips.

### Fermer et reprendre

Décocher un PJ ferme son module et ses effets locaux. **Fermer tous les accès et couper les effets**
arrête aussi les effets de cet instrument. **Tout couper**, en haut de la page, ferme les deux
modules et arrête radar, faux écho et compte à rebours. La fin de séance, un changement de campagne et le redémarrage
ferment les accès et arrêtent les effets ; la préparation et les dialogues sont conservés.
Une reconnexion pendant la même séance retrouve les droits toujours ouverts, après vérification
de l’identité de l’appareil. Les commandes interrompues ne sont jamais rejouées automatiquement.
Après retour dans le détecteur, les bips nécessitent un nouveau clic local. Une coupure reste
effective en mémoire si le disque échoue ; l’erreur est signalée au MJ.

Les données privées sont stockées à part des campagnes diffusées aux tablettes. Les sauvegardes
complètes et exports de campagne incluent les dossiers, codes et dialogues ; un export de pilote
contient seulement les références aux modules. Les réglages du détecteur sont aussi conservés,
mais la reprise et l’import laissent le scan arrêté et ses accès fermés.
Le vrai transport HTTP/WebSocket est aussi éprouvé entre une instance Electron jetable
et deux sessions Edge isolées sur le même PC : huit parcours couvrent confidentialité,
droits, scan, déconnexion/reprise, vidéo et redémarrage/import, avec les dossiers, la file
de demandes et les préréglages. Le relais sonore après le film est aussi éprouvé avec une
horloge avancée et une voix simulée. Le décodage et le graphe
audio sont réels, avec sortie muette vers les enceintes. L’essai sur les tablettes,
leur Wi-Fi, le clavier virtuel et les haut-parleurs physiques reste à faire.

Pour cette dernière vérification, la [fiche de recette sur les appareils de David](../Planning/2026-10-16-recette-materielle-alien.md)
prévoit deux tours : iPad avec tablette Samsung, puis iPad Air avec smartphone. Elle détaille
le clavier virtuel, la rotation, les coupures Wi-Fi, la veille et le transfert du son. L’alerte
de quinze minutes permet d’écouter le film entier puis la sirène et les annonces restantes.
Les résultats se relèvent par appareil et navigateur ; la disponibilité d’une voix française
locale se vérifie sur chaque appareil choisi pour la diffusion.

---

## Le jet — la réserve et le Stress

![Le panneau de jet d'Alien : Force (4) + Combat rapproché (2) = six dés, plus deux dés de Stress](captures/jeu-alien-jet.jpg)

- On retient un **Attribut** et une **Compétence** : leur somme donne les dés. Le profil A2
  conserve les bonus d'arme, d'outil, d'aide et de situation au-delà de dix dés.
- On retient aussi le **Niveau de Stress** : autant de **dés de Stress** se lancent avec les autres,
  **comptés à part**.
- Chaque **6** est une réussite.
- **Un 1 sur un dé de Stress déclenche la Panique.** Le panneau l'**annonce**, désigne le dé, et
  propose **« Test de Panique »** : 1D6 + Niveau de Stress. Sur le poste du meneur, la ligne de la
  table `Alien/test_de_panique` s'affiche sous le résultat (au-delà de 15, c'est la Catatonie) ;
  sur la tablette, le total remonte au meneur, qui lit la ligne.
- **Déjà en panique ?** Le total de la panique en cours se garde sur la fiche (« Panique en cours »).
  Le profil français A1 suit la p. 104 : un nouveau résultat **inférieur** donne la ligne juste
  au-dessus de l'ancienne ; une égalité garde l'effet égal. Les anciens profils sans les suites
  A1 conservent leur ancien cumul. Quand l'effet cesse, les gestes du panneau remettent la
  panique à zéro ; « Calmé » sur la carte reste disponible.
- **« Dépenser un Point de Récit »**, après le lancer : un **6** s'ajoute au jet (cerclé de vert) et
  la fiche perd un point. Il reste sur la table si l'on force ensuite.
- **A1 :** avec un 1 de Stress, le résultat est **provisoire** jusqu'au test de Panique.
  À **10+**, l'action initiale est annulée, même avec des six ; le Point de Récit reste bloqué.
  Sous 10, le verdict du test reprend ses droits après application de l'effet.

![Après le lancer : les dés de base et de Stress sont comptés séparément](captures/jeu-alien-jet-lance.jpg)

![Un 1 de Stress empêche de forcer ; le test de Panique affiche ensuite sa ligne dans la table](captures/jeu-alien-panique.jpg)

---

## Forcer le jet

Après le lancer, **« Forcer le jet »** :

- le **Niveau de Stress monte d'un point** sur la fiche, avant la relance, et le **nouveau dé de
  Stress** part avec elle ;
- les **6 restent** sur la table ; tout le reste se relance — les dés relancés sont **cerclés** ;
- **une fois par test**, ou **deux** avec le talent qui couvre l'attribut du jet (champ « Talent ») :
  Dépassement de soi et Cran (Force), Vif et Téméraire (Agilité), Ruse et Curiosité (Esprit),
  Compassion et Influence (Empathie). Le bouton se grise ensuite, et dit pourquoi.

![Un jet forcé : les six sont gardés, les dés relancés sont cerclés ; le Stress monte de 2 à 3](captures/jeu-alien-force.jpg)

**Au pupitre** (et depuis la télécommande), « Forcer le jet » relance le dernier jet, ajoute le dé de
Stress et **annonce** « Stress +1 à reporter sur la fiche ».

**On ne force pas** après une Panique au premier lancer (le bouton le dit), ni avec un **androïde**
(case « Androïde » cochée sur la fiche). Une Panique sur la relance
se joue de même, avec le Stress déjà monté.

---

## Combat et santé

- **Initiative :** des **cartes numérotées de 1 à 10**, une par combattant, dans l'ordre croissant.
- **Santé :** points de vie, dont le **maximum se lit sur la Force**.
- L'export A0/A1 désigne explicitement **Santé** comme jauge principale : le combat suit la
  valeur courante de la fiche. Un coup qui fait effectivement perdre de la Santé ajoute
  **un** point de Stress, quel que soit le nombre de points perdus. Soins et dégâts nuls
  n'en ajoutent pas ; un androïde n'en reçoit pas. À zéro Santé, l'effet de Panique cesse.
- **Ressources suivies :** Niveau de Stress, Points de Récit, Air, Eau, Nourriture, Énergie.
- **Le Stress hors du jet**, sur la carte du combattant : − et +, puis **« Repos −1 »** (un Tour en
  lieu sûr) et **« Objet fétiche −1 »** (une fois par acte ou par séance).

---

## Stress et Panique — suivi A1

Dans le formulaire de personnage, sous **Lancer un test**, le panneau **Stress et Panique**
conserve l'effet et son rappel. Les variations personnelles de Stress des résultats 7, 9–13
s'appliquent une seule fois. Tremblement retire deux dés aux tests d'Agilité, d'abord sur
la base puis sur le Stress. Nerfs d'acier réduit le test de Panique de deux. Avec Folie
meurtrière, la case **Ennemis en vue** permet de remplacer un résultat 11+.

Au poste MJ :

1. **Rafale : Stress +1** et **Événement : Stress +1** couvrent les situations résolues à la
   table. Avec A3, le mode automatique du panneau de tir ajoute déjà ce Stress : ne pas
   utiliser aussi le bouton de rafale. Ne pas ajouter un second Stress pour les dégâts
   déjà traités par le suivi de santé.
2. Choisir la cause puis **Demander un test de Panique** déclenche la procédure hors jet de
   compétence : blessure critique, tir qui cloue, créature inconnue, témoin ou horreur.
   La demande reste sur la fiche jusqu'à sa résolution, y compris sur tablette.
3. Pour une contagion, sélectionner les seuls PJ concernés selon le critère affiché
   (Courte portée, audition ou visibilité), puis **Appliquer la contagion**. Le geste clôt
   cette sélection ; **Aucun autre personnage concerné** permet de l'écarter. Les autres
   campagnes et les androïdes ne sont pas proposés. Chaque cible reçoit Stress +1 ou une
   demande de Panique, selon l'effet ; une reprise ne le lui inflige pas une seconde fois.
4. Résoudre à la table la perte d'action, l'objet lâché, la fuite ou le choix de cible.
   **Effet immédiat résolu**, **Round et action résolus**, **Commandement réussi**,
   **Tour écoulé** ou **Brisé** terminent l'effet selon sa durée. Cela ne récupère pas
   automatiquement du Stress. Les budgets d'actions ne sont pas décomptés par ce panneau.
5. Après 13+, le rappel de **fin de séance** persiste même une fois calmé. **Bilan de séance :
   tester l'Empathie** lance l'attribut seul, sans Stress ni compétence. Une réussite donne
   un traumatisme dans la table existante ; le bilan et le traumatisme sont conservés.
   À la clôture de la séance, une notification rappelle les personnages dont le bilan reste
   à résoudre, même si le journal n'enregistrait pas.

![Des six restent provisoires tant que la Panique n'est pas résolue](captures/jeu-alien-provisoire.jpg)

![Panique 10 : action annulée, Stress augmenté et contagion appliquée à l'alliée choisie](captures/jeu-alien-action-annulee.jpg)

![Le même résultat dans le vrai Hub à 360 px ; les arbitrages de Maman restent au poste MJ](captures/jeu-alien-panique-tablette-360.jpg)

La tablette affiche l'effet, les demandes et les traumatismes de son personnage. Maman
conserve le choix des cibles de contagion, des fins d'effets et du moment du bilan de séance.
Les durées sont validées par ces gestes, pas par un minuteur caché. Le combat spatial garde
sa table distincte ; le profil A1 livré ici concerne la table du livre de base p. 105.

Importer **`Export Dirvers/corriges/Alien_driver_gmos_a0_a1.gmos-driver`** pour activer ce
suivi sur le pilote de David. Ses identifiants et les quarante clés GM-OS sont conservés ;
la fiche HTML reste inchangée. La saisie numérique de Stress n'est plus plafonnée à dix,
même si la piste imprimée de la fiche ne comporte que dix cases.

---

## Jets, équipement et actions d'éclat — A2

Dans la fiche, les **noms**, **bonus**, **dégâts** et **portées** des armes sont quatre
colonnes : une ligne par arme, dans le même ordre. Ces valeurs circulent aussi vers et
depuis la fiche HTML. L'ancien texte d'armes est conservé : répartir ses valeurs dans
les colonnes, sans perdre les notes existantes. Un bonus non numérique est signalé.

Avant de lancer, **Préparer le test Alien** permet de choisir l'arme puis de saisir le
bonus d'outil/talent, le modificateur de situation (positif ou négatif) et l'aide.
Maman valide leur pertinence. Chaque personne qui aide apporte +1, au plus trois,
déclarés avant le test ; au combat elle dépense le même type d'action que celle aidée.
Le détail du calcul est affiché. Un malus retire d'abord les dés de base puis, s'il
les dépasse, les dés de Stress : base 2, Stress 3 et malus −4 donnent zéro base et
un Stress. Sans aucun dé, le lancer se désactive et demande de changer de stratégie.

Pour un test opposé, choisir **Attaquant en opposition** ou **Défenseur en opposition**.
Le défenseur transmet les réussites de son propre lancer ; il ne peut pas forcer.
L'attaquant saisit ce nombre et touche **Résoudre l'opposition**. Les réussites de
défense annulent les siennes ; l'égalité est un échec pour l'attaquant. Une Panique
reste à résoudre avant cette procédure et une Panique 10+ annule toujours l'action.

Le **Dernier test Alien** propose les actions d'éclat de la compétence effectivement
lancée. Chaque choix dépense une réussite excédentaire ; **Dégâts +1** peut se répéter.
Le budget et les choix restent sur la fiche après reconnexion. Choisir un éclat clôt
le forçage et les Points de Récit de ce test. Maman choisit les cibles et applique les
suites (désarmement, déplacement, information, Panique d'une cible clouée…). Le panneau
prépare le total des dégâts avant protection ; leur application reste un geste séparé.
Commandement et Soins médicaux rappellent leurs usages propres de chaque réussite.

![Préparation : arme à +2 et trois aides avant un test opposé](captures/jeu-alien-a2-preparation.jpg)

![Opposition et première dépense : un éclat reste, les dégâts préparés passent de deux à trois](captures/jeu-alien-a2-opposition.jpg)

![Après reprise et désarmement : le budget est épuisé sans rejouer la dépense précédente](captures/jeu-alien-a2-reprise.jpg)

![Budget retrouvé dans le vrai Hub à 360 px](captures/jeu-alien-a2-tablette-360.jpg)

Importer **`Export Dirvers/corriges/Alien_driver_gmos_a2.gmos-driver`** pour activer A2.
Il conserve les identifiants et les quarante champs précédents et ajoute les trois
colonnes d'armes. A0/A1 restent inclus ; les profils précédents gardent leur comportement.

## Tir, protection, blessures et soins — A3

Importer **`Export Dirvers/corriges/Alien_driver_gmos_a3.gmos-driver`** pour activer A3 et
conserver A0–A2. Les identifiants et les 43 champs précédents restent identiques ; le nouveau
champ **Propriétés des armes** porte le total à 44. Il se renseigne dans GM-OS, une ligne
par arme dans le même ordre que les quatre colonnes existantes. Il n'ajoute pas une colonne
à la fiche HTML. Exemples de propriétés : **Munitions, mode auto, perce-armure** ;
**Tir unique** ; **Protection doublée**. Une arme sans la mention automatique ne permet
pas de sélectionner ce mode.

### Préparer le tir et les chargeurs

Dans **Préparer le test Alien**, choisir l'arme, la portée de la cible, sa taille et la
luminosité. Le calcul affiche les bonus et malus : viser +2, mode automatique +2,
Contact −3 (+3 si sans défense), Moyenne −1, Longue −2, Extrême −3 ; grande cible +2,
petite −2 ; pénombre −1, obscurité −2. Une portée supérieure à celle de l'arme bloque le tir.
Maman valide les circonstances et la dépense d'action ; A3 ne décompte pas le budget du round.

Pour une arme à munitions, confirmer d'abord son état chargé/vide et les **chargeurs pleins
de réserve**. Un 1 de Stress vide le chargeur **après la résolution du tir et de sa Panique**.
Le mode automatique ajoute un point de Stress avant de lancer ; les synthétiques n'en
reçoivent pas. Une arme à tir unique se vide après son utilisation. Il n'y a pas de décompte
balle par balle. **Recharger** consomme un chargeur plein : action lente, ou rapide avec
**Rechargement rapide**. Sans réserve ou avec une arme déjà chargée, le bouton reste bloqué.
La visée est retirée après le tir et doit être déclarée à nouveau pour le suivant.

Avec un tir automatique réussi, chaque réussite excédentaire peut acheter une cible
secondaire, à Courte portée de la première selon l'arbitrage de Maman. Choisir ensuite
la cible à laquelle attribuer les autres éclats. Le panneau affiche séparément leurs
dégâts préparés. Maman ouvre le suivi de santé de chaque victime pour appliquer ces dégâts.

![Tir automatique : cible secondaire et dégâts attribués](captures/jeu-alien-a3-rafale.jpg)

![Chargeur vidé après résolution, puis rechargé avec une réserve consommée](captures/jeu-alien-a3-chargeurs.jpg)

### Résoudre la protection et les dégâts

Au poste MJ, **Blessures et soins Alien** est disponible sur la fiche et sur la carte de
combat. Pour un PNJ, confirmer explicitement qu'il est humain pour activer ce suivi ;
les monstres ne deviennent pas humains par défaut. Les critiques humains sont écartés
pour les synthétiques, dont les avaries et réparations complètes relèvent d'A4.

Saisir les **Dégâts entrants**, l'éventuel abri déjà occupé et la propriété de l'attaque,
puis **Préparer ce coup**. L'abri s'ajoute seulement à distance. Décocher **Dégâts d'une
attaque** pour un effet interne sans protection. **Lancer la Protection** jette les d6 :
chaque 6 absorbe un dégât ; perce-armure divise les dés par deux, arrondi supérieur ;
Protection doublée les double. Ce jet n'utilise ni Stress ni forçage.

**Appliquer les dégâts restants** retire une seule fois le résultat net de la Santé.
Un coup et son jet de protection restent conservés après reprise. Un coup préparé peut
être abandonné explicitement avant application. Les PJ humains gagnent un Stress par
coup dommageable ; les PNJ n'en gagnent pas. À zéro Santé, l'humain est **Brisé** et ne
peut plus lancer ses tests ordinaires : il n'est pas déclaré mort automatiquement.
Chaque nouveau coup dommageable reçu à zéro demande un nouveau critique.

![Protection 4D6, un dégât absorbé et quatre appliqués une seule fois](captures/jeu-alien-a3-protection.jpg)

### Critiques, Trépas et soins

**Tirer ce critique humain (D66)** tire deux d6 ordonnés et lit la table des blessures.
Le critique, son effet, sa durée de guérison et son échéance fatale restent sur la fiche,
même après récupération de Santé. Un critique déjà tiré ne se retire pas une seconde fois.
Les résultats 63–66 entraînent la mort immédiate. Les malus numériques de compétences
sont repris dans la préparation des tests. Les restrictions narratives et dégâts liés
à certains tests (notamment 32 et 45) sont affichés et restent à appliquer par Maman.

Les boutons **Valider un round/tour/quart/jour** avancent des compteurs indépendants de
temps de jeu. Valider seulement les unités pertinentes pour les blessures suivies :
ce ne sont ni une conversion automatique entre unités ni une liaison à Clock-OS.
Une échéance fatale atteinte propose le **Trépas**, sur Force + Endurance avec les malus
de blessure, sans Stress ni forçage. Un succès accorde le prochain sursis ; un échec tue.

Les soins partent d'un véritable test de **Soins médicaux** résolu à la table : reporter
ses réussites confirmées, le nom du soignant et la qualité de son matériel. Pour stabiliser,
appliquer au test le malus affiché et −2 en cas d'auto-soins après s'être relevé.

- **Relever par premiers soins** rend autant de Santé que de réussites. Cela ne stabilise
  pas la blessure fatale : les deux tests sont séparés et peuvent se faire dans les deux ordres.
- **Stabiliser** conserve la tentative de ce soignant, même ratée. Une nouvelle tentative
  du même soignant exige du meilleur matériel ; une réussite supprime les tests de Trépas.
- **Soins quotidiens réussis** divisent par deux la durée restante, une fois par jour de jeu.
  Le talent **Guérison rapide** divise déjà par deux la durée initialement tirée.
- **Soins de l'effet réussis** traite les cas particuliers 14, 15 et 56. Le résultat 56
  non traité devient permanent à la fin de sa durée.
- **Un Tour de repos écoulé : Santé +1** confirme un Tour réellement écoulé et rend un point,
  y compris pour se relever seul. Le même Tour ne peut pas être réutilisé. Les critiques restent.

![Blessure fatale stabilisée et durée de guérison suivie après les soins](captures/jeu-alien-a3-soins.jpg)

Sur tablette, le joueur retrouve son état et ses blessures. Les commandes de protection,
dégâts, temps et soins restent au poste MJ ; les résultats médicaux et circonstances
ne sont pas déduits automatiquement. Les armes, chargeurs et le dernier tir restent
conservés ; ne pas réordonner leurs lignes sans revérifier l'état des chargeurs associés.

![Blessure reçue dans le vrai Hub à 360 px, sans commandes de santé réservées à Maman](captures/jeu-alien-a3-tablette-360.jpg)

## La fiche HTML

La fiche d'Alien se relie à son personnage GM-OS (« Fiche du jeu »). Les pistes en cases (Stress,
Santé, Radiation, Expérience, Points de Récit) se comptent, et les dix lignes d'équipement forment
l'inventaire. Voir [Fiche de personnage HTML](./63-Fiche-de-personnage-HTML.md).

*Relu le 2026-10-21 pour A3 : recette Electron, carte de combat et vrai Hub Edge à 360,
768 et 1 180 px réussie ; sept nouvelles captures vérifiées.
David a validé son essai A0/A1 le 20/10, A2 et A3 le 21/10.
Les huit parcours des accessoires du 16/10 ne sont pas rejoués par cette recette mécanique.*
