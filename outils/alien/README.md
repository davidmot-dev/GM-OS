# Alien — Accessoires de table

Première application séparée demandée par David le 13/10/2026. Deux outils :
**MU/TH/UR 6000** et un **détecteur de tension** dont le meneur règle l'intensité.
Aucune installation de paquet nécessaire. Les visuels et sons sont originaux,
produits par CSS, canvas et Web Audio ; aucune ressource réseau externe.

**Version 0.1.0 — prototype.** Retour de David, le 13/10/2026 :
*« c'est un bon début documente »*. Ce retour valide la direction de la
première version ; les essais sur les tablettes physiques et l'intégration
au pilote Alien restent à faire.

## Essayer sans serveur

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
Les dossiers sont actuellement les trois exemples éditables ; l'ajout et la
suppression de dossiers restent des évolutions possibles.

### Piloter le détecteur

| Réglage | Effet |
| --- | --- |
| Activation | Démarre ou arrête le radar et ses bips |
| Intensité, de 0 à 100 | Cadence des bips, vitesse du balayage et agitation des échos |
| Contacts, de 0 à 9 | Nombre de points scénarisés |
| Proximité | Rapproche ou éloigne les points du centre, sans mesure physique |
| Parasites du radar | Intensité de la bande parasite, si les parasites sont autorisés |
| Volume des bips | Niveau sonore indépendant de l'intensité dramatique |
| Faux écho | Ajoute un contact pendant neuf secondes et redistribue les échos |
| Destinataires | Tout l'équipage ou un seul opérateur |

Les préréglages **Calme / Inquiétant / Menaçant / Critique** posent
respectivement l'intensité à 10 / 45 / 75 / 95. Le curseur permet un réglage
plus fin. À zéro, le radar peut rester allumé mais ne produit pas de bips.
À zéro contact, il ne produit pas de bips non plus, sauf pendant un faux écho.
Le réglage ne lance aucun jet et ne modifie aucune fiche de personnage.

Le son s'active sur chaque appareil par un clic. Les effets de mouvement
réduits demandés par le navigateur diminuent l'animation du texte et les
parasites ; le radar reste animé. Les comptes à rebours sont visuels dans
cette version : il n'y a pas encore d'alarme sonore globale dédiée.

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

| Fichier | Responsabilité |
| --- | --- |
| [index.html](index.html) | Écrans et contrôles meneur/joueur |
| [style.css](style.css) | Habillage Alien, CRT et adaptation aux petits écrans |
| [app.js](app.js) | Interactions, aperçu local, animations, radar et synthèse sonore |
| [core.js](core.js) | Commandes, droits fictifs, dossiers et état partagé |
| [server.mjs](server.mjs) | HTTP, authentification, sauvegarde et diffusion ciblée |
| [manifest.json](manifest.json) | Identité Alien et points d'entrée des deux accessoires |

La note technique décrit les endpoints et la séparation des données :
[ARCHITECTURE.md](ARCHITECTURE.md).

Ordre de reprise proposé : essai réel du serveur avec deux appareils, retours
sur les effets et les sons, puis branchement au pilote Alien et à la campagne.
Ce branchement doit utiliser l'identité du jeu, y compris pour un pilote forgé,
et conserver les codes de scénario dans la campagne, pas dans le corpus partagé.

Étude : [`2026-10-13-integration-foundry-vtt.md`](../../documentation/Planning/2026-10-13-integration-foundry-vtt.md).
