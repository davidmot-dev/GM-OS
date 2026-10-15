# Alien — Accessoires de table

Première application séparée demandée par David le 13/10/2026. Deux outils :
**MU/TH/UR 6000** et un **détecteur de tension** dont le meneur règle l'intensité.
Aucune installation de paquet nécessaire. Les effets sont produits par CSS,
canvas et Web Audio ; la vidéo du Nostromo est le fichier fourni par David,
conservé localement. Aucune ressource réseau externe n'est nécessaire.

**Version 0.3.0 — 15/10/2026.** Protocoles à codes, messages type, alarme
d'autodestruction et vidéo du Nostromo. Retour de David sur la version 0.1 du 13/10/2026 :
*« c'est un bon début documente »*. Ce retour valide la direction de la
première version ; les essais sur les tablettes physiques restent à faire.
L’intégration au pilote Alien et au Tablet Hub est désormais livrée pour les deux outils.

## Essayer sans serveur

Pour l'aperçu React `scratch/muthur-v1/apercu.html`, la préparation est désormais
sauvegardée automatiquement dans le navigateur : réglages, dossiers et
protocoles. Le bandeau du **Poste meneur** propose **Exporter la configuration**
et **Importer une configuration**, pour garder un JSON ou changer de poste.
Voir le [parcours de sauvegarde](modules/muthur/README.md#retrouver-sa-préparation-à-la-prochaine-ouverture).
L'export contient les secrets du MJ ; les dialogues et alertes en cours ne
sont pas enregistrés. Cette sauvegarde de préparation est distincte du mode
fichier du prototype ci-dessous et de la persistance privée du Tablet Hub.

Ouvrir [index.html](index.html) dans Chrome ou Edge. Le mode fichier est un **atelier local** :
poste meneur, aperçu joueur et deux opérateurs fictifs, REYES et SATO. Il garde
ses données dans le stockage de ce navigateur. Il ne synchronise pas des tablettes.

- Onglet **Terminal** : dialogue avec l'opérateur choisi, réponse au nom de
  Maman, statut du vaisseau, effets CRT et parasites, compte à rebours fictif.
- Onglet **Accès** : mot de passe, codes et dossiers éditables, révocation des accès.
- Onglet **Détecteur** : activation, intensité, contacts, proximité, parasites,
  volume indépendant et faux écho. Le bouton **Vue joueur** masque les contrôles.
- Cliquer **Son désactivé** pour autoriser le son sur cet appareil.

Exemples de départ : mot de passe `PROMETHEUS`, code de dossier `0042`.
Saisir `CODE 0042`, puis `READ ordre`. `CODE 42` est refusé.
`HACK` crée une demande : le meneur autorise ou repousse l'intrusion, avec une
séquence animée. HELP, STATUS, LIST, READ, LOGIN, CODE, /M et CLEAR sont disponibles.
Les mots de passe saisis ne restent pas visibles dans le dialogue.

Au refus d'un HACK, les contre-mesures renforcent les effets activés :
balayage/halo pour CRT, grain et perturbations du texte pour Parasites.
Le refus utilise un halo discret, un balayage plus lent et un bruit atténué
pour préserver la lecture ; son bandeau de résultat reste fixe.
Les effets passent au-dessus du panneau de piratage du prototype ; dans
le module, le cadre du journal reste fixe pendant le défilement des messages.
Le résultat reste lisible et les mouvements réduits arrêtent ces animations.

### Petit parcours de découverte

1. Activer le son avec le bouton de l'en-tête, puis saisir `STATUS`.
2. Saisir `READ ordre` : le dossier est inaccessible.
3. Saisir `CODE 0042`, puis `READ ordre` : la directive devient consultable.
4. Dans **Accès**, modifier le code du dossier et son contenu, puis enregistrer.
   Changer le code retire les déverrouillages précédents de ce dossier.
5. Cliquer **HACK**. Dans **Terminal**, autoriser ou repousser l'intrusion :
   la séquence de piratage se déroule, avec le résultat choisi.
6. Dans **Détecteur**, activer le scan et essayer les quatre préréglages
   d'intensité, puis le curseur. Ajuster le volume séparément.
7. Cliquer **Vue joueur** pour essayer l'écran sans commandes du meneur,
   puis revenir au poste meneur. En mode fichier, cet aperçu est une simulation.

### Commandes du terminal

| Commande | Résultat |
| --- | --- |
| `HELP` | Liste les commandes disponibles |
| `STATUS` | Affiche le statut préparé par le meneur |
| `LIST` | Liste les identifiants de dossiers ; les titres protégés restent masqués |
| `READ navigation` | Consulte un dossier autorisé, par son identifiant |
| `CODE 0042` | Déverrouille le ou les dossiers protégés par ce code exact |
| `LOGIN PROMETHEUS` | Accorde l'accès administrateur si le mot de passe est correct |
| `/M Votre question` | Transmet une question au meneur, qui répond au nom de Maman |
| `HACK` | Demande au meneur de décider de la réussite ou de l'échec de l'intrusion |
| `CLEAR` | Efface le dialogue de cet opérateur |

Les noms de commandes ne dépendent pas de la casse. Les mots de passe et les
codes sont comparés exactement, après retrait des espaces au début et à la fin.
Les zéros initiaux sont conservés. `ORDERS code` est aussi reconnu comme
alias de `CODE code`. Le bouton **S'identifier** propose une saisie masquée.

### Accès et identité de l'opérateur

Trois protections de dossier sont disponibles : **Équipage**, **Code requis**
et **Administrateur**. Un accès administrateur donne accès à tous les dossiers.
Le bouton de révocation remet l'opérateur sélectionné au niveau équipage,
retire ses déverrouillages et annule sa demande de piratage. Les textes déjà
lus restent dans son dialogue jusqu'à `CLEAR` ; une révocation ne peut pas
effacer ce que le joueur a déjà vu.

Le changement de code retire les accès obtenus par ce code. Changer le mot
de passe administrateur ne retire pas à lui seul les accès déjà accordés :
utiliser la révocation lorsque cela fait partie du scénario.

Le meneur peut saisir des commandes dans l'aperçu de l'opérateur sélectionné.
Cette possibilité sert à essayer le terminal et à préparer la mise en scène.
Pour ajouter un dossier, choisir **Nouveau dossier…** dans la liste des
dossiers (onglet **Accès** du prototype, ou **Dossiers** du module), renseigner
son identifiant, son titre, son contenu et sa protection, puis **Créer le
dossier**. Par exemple, l'identifiant `rapport-medical` se lit avec
`READ rapport-medical`. Utiliser une lettre minuscule initiale, puis des
lettres minuscules sans accent, chiffres ou tirets, sur 64 caractères au plus.
L'identifiant reste fixe après création ; le titre et le contenu restent
modifiables. Le code est obligatoire pour un nouveau dossier à code.
Les dossiers existants sont conservés ; les identifiants en double et les
codes réservés aux protocoles sont refusés. La suppression et le classement
des dossiers restent à ajouter.

### Piloter le détecteur

| Réglage | Effet |
| --- | --- |
| Activation | Démarre ou arrête le radar et ses bips ; nouveau placement aléatoire à chaque démarrage |
| Intensité, de 0 à 100 | Cadence des bips, vitesse du balayage et agitation des échos |
| Contacts, de 0 à 9 | Nombre de points scénarisés |
| Proximité | Définit la zone de placement : valeur élevée = contacts proches du centre, sans mesure physique |
| Parasites du radar | Intensité de la bande parasite, si les parasites sont autorisés |
| Volume des bips | Niveau sonore indépendant de l'intensité dramatique |
| Faux écho | Ajoute un contact pendant neuf secondes sans redistribuer les autres échos |
| Destinataires | Tout l'équipage ou un seul opérateur |

Les préréglages **Calme / Inquiétant / Menaçant / Critique** posent
respectivement l'intensité à 10 / 45 / 75 / 95. Le curseur permet un réglage
plus fin. À zéro, le radar peut rester allumé mais ne produit pas de bips.
À zéro contact, il ne produit pas de bips non plus, sauf pendant un faux écho.
Le réglage ne lance aucun jet et ne modifie aucune fiche de personnage.

Les contacts sont tirés au hasard dans la zone définie par la proximité,
avec des directions et des distances variées. Leur répartition est commune
aux appareils autorisés et reste stable jusqu'à une nouvelle activation
(l'agitation visuelle suit toujours l'intensité). Changer le nombre de
contacts conserve les premiers ; le faux écho s'ajoute sans déplacer les autres.
Le volume et l'intensité ne provoquent pas de nouveau tirage.

Essais du placement : `node --test outils/alien/verification-detecteur.mjs`.

Les réglages **Écran CRT** et **Parasites** sont indépendants. Le CRT renforce
les lignes de balayage, la trame phosphore, le halo et l'assombrissement des
bords ; les parasites rendent le grain continu et les brèves perturbations du
texte plus visibles, particulièrement pendant le piratage.

Le son s'active sur chaque appareil par un clic. Les effets de mouvement
réduits demandés par le navigateur diminuent l'animation du texte et les
parasites ; le radar reste animé. Le compte à rebours manuel reste visuel.
Le protocole d'autodestruction possède une sirène et des annonces vocales
sur le seul appareil choisi, comme décrit ci-dessous.

## Préparer des messages type et des codes d'action

Dans **Protocoles**, choisir un protocole ou **Nouveau protocole…**, puis
renseigner son nom, son code exact, le message type, l'effet et ses
destinataires. Cocher **Code actif** et enregistrer. Le joueur saisit
`CODE votre_code`. La casse et les zéros initiaux sont conservés.

| Exemple fourni dans une nouvelle table | Effet |
| --- | --- |
| `CODE PORTES-OUVRIR` | Message d'ouverture et état fictif « Portes ouvertes ». |
| `CODE PORTES-FERMER` | Message de fermeture et état fictif « Portes fermées ». |
| `CODE OMEGA-10` | Message d'évacuation, interface d'urgence, film entier et compte à rebours d'au moins 12 min 56 s. |
| `CODE OMEGA-STOP` | Annulation de l'autodestruction et retour à l'interface normale. |

Un effet **Message seulement** permet n'importe quelle réponse préparée.
Le message peut être privé à l'opérateur ou envoyé à tout l'équipage connecté.
L'alerte d'autodestruction et l'état des portes sont communs aux utilisateurs
autorisés du terminal. Les protocoles, leurs codes et les messages non encore
déclenchés ne sont pas envoyés aux joueurs.

Les codes sont modifiables. Un code de protocole ne peut pas être celui
d'un autre protocole ou d'un dossier protégé. Les exemples ci-dessus sont
connus : les personnaliser avant de jouer. Une ancienne table v1 garde ses
données et commence avec une liste de protocoles vide ; aucun nouveau code
actif n'y est ajouté automatiquement.

À côté de **Code du protocole**, **Code du dossier** et **Mot de passe
administrateur**, le bouton **Afficher** permet au MJ de lire la valeur ;
**Masquer** rétablit les points. Cela ne valide pas le formulaire et ne
modifie pas la valeur. Un changement de sélection ou de panneau la remasque.
La saisie sensible du joueur reste masquée.

### Autodestruction : sirène et annonces chaque minute

Sur **l'unique appareil choisi pour le son**, cliquer **Diffuser l’alarme ici**,
puis activer le son. Choisir un autre appareil transfère la diffusion et
arrête la sirène et la voix sur le précédent. Les autres gardent le décompte
visuel. Ce choix peut se faire sur le poste du MJ ou une tablette autorisée.

Le code lance le film fourni par David. Sa durée mesurée est **12 min 56 s** :
à sa demande, l'alerte est prolongée à cette durée si le protocole prévoit
moins. Une durée supérieure reste respectée. Le nom historique `OMEGA-10`
est un code modifiable et ne fixe pas la durée effective.

La bande-son du film est réservée à l'appareil choisi, après activation
locale du son. Les autres appareils montrent la vidéo muette. La sirène
et la voix de MU/TH/UR se taisent pendant la lecture ; elles reprennent à
la fin si du temps reste dans l'alerte. Retaper le code ne relance ni le
film ni la durée. L'annulation ferme la vidéo et coupe son son.

Le fichier est copié sans modification dans `medias/`, avec sa
[provenance et sa durée](medias/README.md). Il n'est pas téléchargé depuis
un site pendant la séance. Si le navigateur refuse la lecture automatique,
le bouton **Reprendre la vidéo** permet de la lancer. Un fichier indisponible
laisse le décompte et l'alarme de secours fonctionner. Après reconnexion, la
vidéo rejoint le temps écoulé, au lieu de repartir du début.

Les annonces de secours suivent le temps restant, à la minute.
Après une suspension, seule la minute courante est annoncée ; les minutes
manquées ne se rejouent pas. Le code d'annulation et l'arrêt MJ coupent
la séquence. À zéro, la sirène s'arrête ; aucun personnage n'est tué et
aucune action GM-OS n'est déclenchée.

La voix utilise uniquement une voix française locale proposée par le
navigateur ([distinction local/distant](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)).
Si elle manque, un message le signale ; la sirène et le visuel fonctionnent.
La qualité sonore et les voix réellement présentes restent à éprouver sur
les appareils de la table. Aucun fichier audio externe n'est téléchargé.

## Utiliser comme page web avec les tablettes

Depuis la racine de GM-OS, avec Node.js 18 ou ultérieur :

```powershell
node outils/alien/server.mjs
```

Le terminal affiche **le lien meneur privé**, le **code de table** et les
adresses joueurs sur le réseau local. Ouvrir le lien meneur dans Web-OS ou
dans un navigateur. Les joueurs ouvrent l'adresse réseau du PC et entrent
leur nom et le code de table. Le mot de passe de scénario ne remplace pas
ce code de connexion. Conserver le lien meneur pour le meneur.

Le navigateur intégré de GM-OS accepte HTTP, mais pas `file:` : utiliser le
serveur pour y ouvrir l'application. Sur une tablette, `localhost` désignerait
la tablette ; utiliser l'adresse du PC affichée par le serveur. Si Windows le
demande, autoriser l'accès uniquement sur le réseau privé de la table.
Le service est destiné au réseau local, sans exposition sur Internet.

Les vues se synchronisent par un flux d'événements serveur et des commandes
JSON. Les mots de passe et contenus verrouillés sont validés côté serveur ;
la vue joueur ne reçoit que son état autorisé. Le meneur peut choisir un
destinataire pour le radar. Arrêter avec **Ctrl+C**.

Le port par défaut est `8787`. Pour en choisir un autre :

```powershell
$env:ALIEN_PORT = '8788'
node outils/alien/server.mjs
```

Les données restent dans `outils/alien/.local/`, ignoré par Git. Aucun accès
aux données GM-OS. Les dialogues et la configuration se conservent ; au
redémarrage, le détecteur et les comptes à rebours sont arrêtés. Les codes
d'exemple sont connus : les modifier pour les secrets d'un scénario.

### Retrouver une session

Un rechargement de page conserve la connexion de l'onglet lorsque son stockage
de session est disponible. Le flux se reconnecte automatiquement en cas de
coupure. Le lien meneur et le code de table sont conservés par le serveur.
Sans le jeton de son ancien onglet, un joueur qui entre à nouveau le code
de table crée un nouvel opérateur : la reprise par nom n'est pas implémentée.

La **réinitialisation de la table** remet les codes d'exemple, les documents,
les accès, les dialogues et les effets à leur état de départ. Elle conserve
les opérateurs inscrits ainsi que les identifiants de connexion du serveur.

Les modes fichier et serveur ont des sauvegardes distinctes. Un réglage fait
dans l'atelier local n'est pas automatiquement transféré au serveur.

## Ce qui est livré et ce qui reste

- Terminal et tracker fonctionnels, effets visuels et sons, saisie de codes,
  arbitrage du piratage, dialogues privés et contrôle d'intensité.
- Un réglage d'intensité **ne modifie aucun Stress de PJ**. Les positions et
  contacts du radar sont scénarisés, sans distance physique ni calcul de panique.
- Les comptes à rebours n'entraînent aucun décès ni action dans GM-OS.
- Le manifeste identifie exclusivement le jeu `alien` et les deux points
  d'entrée. **Le branchement au pilote et à la campagne GM-OS reste à développer** :
  le serveur porte actuellement une seule table autonome.
- L'atelier local partage ses données avec l'aperçu : c'est une maquette pour
  le meneur. Pour les vrais joueurs et des secrets, utiliser le mode serveur.
- Aucune fonction Foundry n'est exécutée. Les effets sont une première
  interprétation à comparer visuellement et à l'écoute avec la référence.

## Vérifications réalisées

Syntaxe Node et ESLint : propres. Parcours navigateur : terminal hors ligne,
codes exacts dont les zéros initiaux, mots de passe édités, dossiers édités,
sauvegarde après rechargement, réponses meneur/joueur, piratage, révocation,
tracker synchronisé, faux écho, arrêt et reconnexion. Rendu relu sur ordinateur
et à 390 px, sans débordement horizontal ni erreur JavaScript relevée.

Les droits et le filtrage ont été vérifiés avec le vrai moteur et le protocole :
un joueur ne peut pas régler le tracker ; les codes et documents verrouillés
ne sont pas envoyés ; un non-destinataire ne reçoit pas les données du scan.

**Limite de cette validation :** les requêtes HTTP du navigateur ont été
interceptées et traitées en mémoire, sans démarrer de service réseau. L'écoute
réelle du port, les tablettes physiques, le pare-feu et le son en séance
restent à essayer. Les captures et données d'essai temporaires ont été supprimées.

## Reprendre le développement

**Suite étudiée le 15/10/2026 :** David confirme que cette première version
fonctionne bien et demande un plan d'amélioration et d'intégration au Tablet
Hub. Le [plan dédié](../../documentation/Planning/2026-10-15-alien-tablet-hub.md)
propose une activation séparée des deux outils par le MJ, des destinataires
par personnage, la connexion existante du Hub et une sauvegarde privée par
campagne. Elles sont maintenant livrées dans les tranches d’intégration décrites ci-dessous.

David précise ensuite qu'il souhaite un **emplacement générique par jeu/pilote**.
Le [plan Modules du jeu](../../documentation/Planning/2026-10-15-modules-du-jeu-tablet-hub.md)
décrit ce cadre commun : MU/TH/UR et le détecteur en seront les premiers
modules, avant d'autres outils comme la Table des Terres Médianes pour
Rêve de Dragon. L'intégration Alien suit désormais ce cadre.

Le [contrat v1 des modules](../../documentation/Architecture/Contrat-des-modules-du-jeu.md)
définit désormais le raccordement attendu. Un
[validateur et moteur d'exemple](../modules-du-jeu/README.md) sont disponibles.
Le manifeste actuel d'Alien décrit toujours le prototype autonome ; sa
conversion globale n'est pas nécessaire pour cet atelier.

**Adaptation MU/TH/UR livrée le 15/10 :** le
[module v1](modules/muthur/README.md) possède son propre manifeste
`alien-muthur`, un adaptateur du moteur existant, des vues React joueur/MJ,
des types publics et des essais. La reprise des données v1 du prototype est
prévue par une fonction pure, sans lecture des sauvegardes réelles. Le
détecteur a depuis son [adaptateur distinct](modules/detecteur/README.md). La sélection des modules dans le pilote, le catalogue
de métadonnées et leur conservation à l’export/import sont intégrés. La deuxième
tranche raccorde MU/TH/UR au registre exécutable, au transport privé, au stockage et
aux accès par personnage du Hub. Ouvrir **Cockpit › Modules du jeu**, préparer le
pupitre puis cocher les PJ pendant une séance. La troisième tranche raccorde aussi le détecteur :
accès indépendants, réglages enregistrés, scan partagé, faux écho et bips locaux.
**Tout couper** ferme les deux instruments et arrête leurs effets, même si le disque échoue.
Les deux usages continuent à réutiliser
la même logique de terminal.

**Étape 4 :** six parcours de bout en bout éprouvent maintenant le vrai HTTP/WebSocket
entre Electron et deux sessions Edge isolées sur le PC : confidentialité, droits,
scan/reconnexion aux trois tailles, film/Range, transfert sonore et reprise/import.
Une [recette avec semence fictive](../../documentation/Planning/2026-10-15-recette-modules-alien.md)
permet de poursuivre sur deux appareils physiques sans campagnes personnelles.
Le son des essais automatiques est muet vers les enceintes ; Wi-Fi, veille, clavier
virtuel et restitution audio sur les tablettes restent à éprouver.

| Fichier | Responsabilité |
| --- | --- |
| [index.html](index.html) | Écrans et contrôles meneur/joueur |
| [style.css](style.css) | Habillage Alien, CRT et adaptation aux petits écrans |
| [app.js](app.js) | Interactions, aperçu local, animations, radar et synthèse sonore |
| [core.js](core.js) | Commandes, droits fictifs, dossiers et état partagé |
| [detecteur.js](detecteur.js) | Dessin du radar partagé par le prototype et le module Hub |
| [alarme.js](alarme.js) | Sirène et annonces vocales, partagées avec le module React |
| [video-alerte.js](video-alerte.js) | Lecture du film, synchronisation et priorité audio |
| [server.mjs](server.mjs) | HTTP, authentification, sauvegarde et diffusion ciblée |
| [manifest.json](manifest.json) | Identité Alien et points d'entrée des deux accessoires |

La note technique décrit les endpoints et la séparation des données :
[ARCHITECTURE.md](ARCHITECTURE.md).

Ordre de reprise proposé : essai réel du serveur avec deux appareils, retours
sur les effets et les sons, puis branchement au pilote Alien et à la campagne.
Ce branchement doit utiliser l'identité du jeu, y compris pour un pilote forgé,
et conserver les codes de scénario dans la campagne, pas dans le corpus partagé.

Étude : [`2026-10-13-integration-foundry-vtt.md`](../../documentation/Planning/2026-10-13-integration-foundry-vtt.md).
