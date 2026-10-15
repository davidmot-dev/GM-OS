# Tablet Hub — un emplacement commun pour les modules du jeu

**15/10/2026 — orientation demandée par David ; contrat v1 formalisé,
outils locaux livrés ; intégration non codée.**

David : *« je voudrais avoir un placeholder générique sur Tablet Hub ou je
pourrais mettre des modules spécifiques par jeu/drivers par exemple MU\TH\UR
sur Alien ou la gestion de Table des Terre Médiane pour Rêve de Dragon, etc... »*

Cette précision remplace la proposition d'une entrée réservée à Alien et
d'un contrat générique reporté à plus tard dans le premier plan. L'emplacement
commun est demandé. David approuve ensuite la formalisation du standard :
*« ok vas-y »*. Le [contrat v1](../Architecture/Contrat-des-modules-du-jeu.md)
fait désormais référence pour le raccordement. Les libellés d'écran et les
lots d'intégration ci-dessous restent des propositions.

## 1 · Un emplacement stable : « Modules du jeu »

Le Tablet Hub possède une entrée **Modules du jeu**. Elle ouvre un espace
commun contenant les cartes des modules accessibles au personnage courant.
Le choix d'une carte affiche le module dans cet espace, avec un retour à la
liste et la navigation habituelle du Hub toujours accessible.

| Pilote de la campagne | Exemples de modules |
| --- | --- |
| Alien | MU/TH/UR 6000 ; détecteur de mouvement |
| Rêve de Dragon | Table des Terres Médianes, selon l'exemple de David |
| Autre jeu | Les modules déclarés par son pilote et disponibles dans GM-OS |

Ce tableau décrit des cibles : aucun de ces modules n'est actuellement branché
à cet emplacement. Le comportement de la Table des Terres Médianes reste à
définir avec David et les sources du jeu ; ce plan n'en invente pas les règles.

Proposition pour rendre le placeholder visible : l'entrée reste présente
même sans module ouvert. La page affiche alors **Aucun module ouvert par le
meneur**. Elle ne révèle ni noms ni paramètres de modules réservés au MJ.
Lorsqu'un module est ouvert, sa carte apparaît sans nouvelle connexion.
Une pastille indique les nouveautés ; l'ouverture par le MJ ne vole pas
la page que le joueur est en train de consulter.

## 2 · Le pilote propose, le MJ ouvre

Le cockpit offre le même espace **Modules du jeu**, avec la liste déclarée
par le pilote actif. Pour chaque module disponible, le MJ peut :

- préparer les paramètres propres à la campagne et ouvrir son pupitre ;
- autoriser l'accès à tous les personnages ou à une sélection ;
- retirer l'accès sans supprimer la préparation ;
- voir les destinataires actuels et arrêter les effets du module.

Les modules démarrent avec leurs accès de table fermés. Une commande commune
**Fermer tous les modules aux joueurs** retire ces accès et arrête leurs
effets. Fermer seulement le pupitre MJ conserve les modules ouverts.

Chaque module garde ses gestes spécifiques : démarrer le radar, répondre
au nom de Maman, ou manipuler une future table de jeu. Le cadre commun
gère l'accès, la navigation et le cycle de vie ; son bouton d'autorisation
ne déclenche pas à lui seul un effet ou une action de règle.

## 3 · Contrat v1 : déclaration, implémentation, instance

Le [contrat de référence](../Architecture/Contrat-des-modules-du-jeu.md)
précise les formats, fonctions du moteur, vues, autorisations, messages,
sauvegardes et critères de conformité. Les
[outils locaux](../../outils/modules-du-jeu/README.md) fournissent le contrôle
statique du manifeste et un moteur d'exemple avec huit essais au vert.
Le champ du pilote, le catalogue de métadonnées et son éditeur sont désormais intégrés.
L’hôte exécutable et le registre des moteurs/vues attendent G2.
**Suite du 15/10 :** l'[adaptateur MU/TH/UR](../../outils/alien/modules/muthur/README.md)
est désormais livré avec manifeste, moteur et vues React isolées. Les vues
de l'hôte générique et le branchement au Hub restent à construire ; les
composants du module ne rendent pas encore celui-ci disponible dans GM-OS.

### Déclaration dans le pilote

Le champ facultatif `GameDriver.modulesDuJeu` porte une liste de références
vers les modules du catalogue. Format accepté par le code :

```json
{
  "modulesDuJeu": [
    { "id": "alien-muthur", "libelle": "MU/TH/UR 6000" },
    { "id": "alien-detecteur", "libelle": "Détecteur de mouvement" }
  ]
}
```

La Forge, l'éditeur, les contrôles et l'export/import doivent conserver cette
liste. L'éditeur propose les modules du registre compatibles avec le jeu,
sans demander au MJ de taper leurs identifiants. Une référence inconnue
est signalée au MJ comme indisponible et ne crée pas une carte vide joueur.

Le pilote résolu fait foi, y compris quand son identifiant est `custom-…`.
La compatibilité utilise l'identité commune du corpus, pas le titre affiché.
Pour les pilotes Alien déjà importés, prévoir une compatibilité transitoire :
si `modulesDuJeu` est absent et le corpus résolu est Alien, proposer les deux
modules ; une liste explicitement vide signifie aucun module. Aucun accès
joueur n'est accordé par ce repli. Les autres pilotes existants restent valides.

### Implémentation dans un registre commun

Chaque module enregistré fournit : identité, jeux compatibles, vue joueur,
pupitre MJ, validation des paramètres et commandes, filtre de l'état selon
le lecteur, version de sauvegarde, migrations et arrêt de ses effets.

Le Hub ne contient qu'un hôte générique : il lit les cartes et monte la vue
du module sélectionné depuis ce registre. Ajouter un module implique son
implémentation et son enregistrement, puis sa déclaration dans un pilote ;
cela ne demande pas de nouvelle branche Alien ou Rêve de Dragon dans
`TabletHub.tsx`. Un même module peut être référencé par plusieurs pilotes
compatibles. Les manifestes définitifs des adaptateurs figeront leurs identifiants.

Le premier contrat référence des modules livrés avec GM-OS. Déposer une page
HTML ou une URL ne suffit donc pas à créer un module : il faut l'adapter au
contrat pour l'identité, les commandes, les vues et la sauvegarde. Le prototype
Alien est le premier candidat à cet adaptateur. L'import de modules externes
empaquetés constitue un besoin distinct à définir si David le souhaite.

### Instance privée par campagne

Le pilote déclare la disponibilité ; l'instance de campagne conserve la
préparation, les autorisations et l'état courant. Modifier un pilote ou
fermer un accès ne supprime pas les données de son instance. La suppression
définitive des données est un geste séparé et explicite du MJ.

Le stockage est indexé par campagne et module. Un module peut y avoir des
données communes, des données MJ et des données par personnage. Le filtre
du module construit la vue autorisée de chaque destinataire. Pour Alien,
les deux outils peuvent partager un moteur de campagne, tout en ayant des
accès et des vues distincts ; aucune duplication de l'état du radar.

## 4 · Transport et cycle de vie communs

Réutiliser le WebSocket du Hub et l'IPC MJ. Une commande indique le module
visé et sa charge validée ; le serveur vérifie la connexion, la campagne,
le pilote, les droits et l'action permise. Le simple droit d'ouvrir un
module ne donne pas le droit d'envoyer ses commandes de meneur.

Seul un résumé explicitement public peut voyager dans la synchronisation commune.
Les cartes autorisées et les vues privées sont acheminées par destinataire.
Ne pas ajouter les secrets au champ `Campaign`, actuellement diffusé par
`useNexusSynchronizer`. L'association appareil/personnage et sa reprise
côté serveur doivent être établies avant les premiers dialogues privés.

Chaque enveloppe porte campagne, module et révision. Une réponse arrivée
après fermeture ou changement de contexte ne rouvre pas le module. Changer
de PJ vide l'ancienne vue. Retrait d'accès, déconnexion et démontage arrêtent
sons et animations locaux ; la déconnexion interdit les nouvelles commandes
et ne les met pas en attente pour un rejeu ultérieur.

Changement de campagne, fin de séance et redémarrage ferment les accès de
table et arrêtent les effets. La préparation se conserve. Les sauvegardes
et exports/imports incluent les données versionnées des modules ; un module
absent à l'import laisse ses données conservées et indisponibles au joueur.
Le traitement d'une sauvegarde illisible ou d'une écriture échouée doit
préserver les données antérieures et signaler l'échec au MJ.

## 5 · Ordre de réalisation révisé

| Lot | Résultat | Vérification principale |
| --- | --- | --- |
| G0 — contrat | Livré : standard, validation partagée, champ du pilote, catalogue de métadonnées, édition, contrôles Forge/restauration et conservation export/import | Pilote Alien forgé, absent/vide, inconnu/incompatible, données privées refusées et aller-retour Nexus testés. Registre exécutable lié à G2. |
| G1 — emplacement | Livré : entrée au cockpit, page MJ de disponibilité et onglet générique vide dans le Hub. Cartes autorisées et hôte exécutable attendent G2 | Navigation testée ; neuf captures isolées à 360/768/1180 px, cibles ≥ 44 px, aucun débordement. Parcours module factice et retrait d’accès à faire avec G2. |
| G2 — socle de table | Identité, droits, commandes ciblées, état privé par campagne/module et sauvegarde | Deux PJ, accès MJ refusé au joueur, autre campagne, reconnexion et écritures échouées. |
| A0/A2 — premier module | Adaptateur MU/TH/UR et composants React isolés livrés ; reste leur enregistrement et leur branchement dans le cadre commun | Essais isolés du moteur et des vues verts ; reste le parcours réel d'ouverture/retrait MJ dans le Hub. |
| A3/A4 — suite Alien | Détecteur, améliorations, cycle de vie, manuel et essais | Coupure et silence, sauvegarde/export/import, capture et essai matériel. |
| R0 — deuxième jeu | Définir le périmètre de la Table des Terres Médianes avec David | Puis livrer un module via le même contrat, sans modification spécifique de la navigation du Hub. |

G1 est une étape d'interface : sa livraison aux joueurs attend G2 et un vrai
module. Le module factice appartient uniquement aux essais. Le plan Alien
[détaille ses améliorations](2026-10-15-alien-tablet-hub.md) ; son ancien A1
est désormais couvert par G2 pour la partie commune. Les validations de code,
captures et essais réseau suivront les consignes du dépôt au développement.
