# Contrat des modules du jeu — Tablet Hub

**Version 1 — 15/10/2026.** Standard de raccordement des modules dans GM-OS.
David demande un emplacement générique par jeu/pilote, puis approuve la
formalisation du standard : *« ok vas-y »*, le 15/10.

Les mots **DOIT**, **NE DOIT PAS** et **PEUT** indiquent les obligations du
contrat. Le [validateur statique et le moteur d'exemple](../../outils/modules-du-jeu/README.md)
sont exécutables. **Au 15/10, le champ du pilote, son éditeur, le catalogue de métadonnées,
la validation et la conservation à l’export/import sont implémentés. Le cockpit et le Hub
possèdent un hôte générique. La deuxième tranche raccorde MU/TH/UR au processus principal,
avec droits par personnage, transport ciblé, reprise d’appareil et stockage privé des instances.
La troisième ajoute le détecteur Alien et la coupure générale des modules. Les droits d’un
PJ/module possèdent une clé d’ouverture : retirer un autre destinataire ne démonte pas sa vue.
L’étape 4 éprouve le vrai HTTP/WebSocket entre Electron et deux sessions Edge isolées sur
le PC ; réseau sans fil et matériel physique restent à essayer.** Ce document fixe leur cible commune.

## 1 · Trois éléments, trois responsabilités

| Élément | Responsabilité |
| --- | --- |
| Module | Manifeste, moteur, vue joueur et pupitre MJ ; règles propres à l'outil. |
| Pilote | Liste des modules disponibles pour son jeu. |
| Instance de campagne | Données, préparation et accès accordés par le MJ. |

Le Hub DOIT héberger les modules via un registre commun. L'ajout d'un module
NE DOIT PAS imposer une branche propre au jeu dans sa navigation. La première
version référence des implémentations livrées avec GM-OS. Le registre associe
explicitement leurs manifestes à leur code ; la déclaration d'un pilote
ne déclenche aucun chargement de script, chemin ou URL.

MU/TH/UR et le détecteur Alien sont les premiers modules réels. La Table
des Terres Médianes de Rêve de Dragon est une deuxième cible à spécifier.
Ce contrat n'en définit aucune règle de jeu.

## 2 · Manifeste v1

Un manifeste est du JSON. Les champs inconnus sont refusés pour éviter de
promettre des options que l'hôte ne sait pas traiter.

| Champ | Obligation et format |
| --- | --- |
| `versionContrat` | Obligatoire, entier `1`. Une autre version est refusée. |
| `id` | Obligatoire, stable et unique au catalogue, 1–80 caractères. |
| `libelle` | Obligatoire, texte non vide, 80 caractères au plus. |
| `description` | Facultatif, texte non vide, 600 caractères au plus. |
| `version` | Obligatoire, trois entiers `X.Y.Z`, sans zéro initial superflu ni suffixe. Version de l'implémentation. |
| `versionDonnees` | Obligatoire, entier sûr positif. Version du format de sauvegarde, indépendante de `version`. |
| `corpusCompatibles` | Obligatoire, 1–32 identifiants distincts de corpus. Aucun joker. |
| `commandes` | Obligatoire, 0–64 déclarations de commande. Une liste vide permet un module de consultation. |

Les identifiants de module, de corpus et de commande suivent
`^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`, avec 80 caractères au plus.
Chaque commande contient exactement `id` et `roles`. Son identifiant est
unique dans le module. `roles` contient `mj`, `joueur`, ou les deux, sans
doublon. Les formes et limites de sa charge relèvent du moteur du module.

```json
{
  "versionContrat": 1,
  "id": "alien-muthur",
  "libelle": "MU/TH/UR 6000",
  "version": "0.1.0",
  "versionDonnees": 1,
  "corpusCompatibles": ["alien"],
  "commandes": [
    { "id": "saisir", "roles": ["joueur", "mj"] },
    { "id": "repondre", "roles": ["mj"] }
  ]
}
```

Cet exemple fixe la forme ; l'[adaptateur MU/TH/UR](../../outils/alien/modules/muthur/README.md)
fournit sa liste complète de commandes dans son manifeste distinct.
Le manifeste actuel `outils/alien/manifest.json`, descripteur
du prototype autonome, n'est pas un manifeste v1 et reste inchangé.

## 3 · Références du pilote

Le champ facultatif `GameDriver.modulesDuJeu` suit cette forme :

```json
{
  "modulesDuJeu": [
    { "id": "alien-muthur" },
    { "id": "alien-detecteur", "libelle": "Détecteur de mouvement" }
  ]
}
```

La liste contient au plus 32 références distinctes. Chaque référence contient
un `id` valide et, facultativement, un `libelle` de 1–80 caractères non blancs.
Elle NE DOIT PAS porter de secrets, paramètres de campagne, URL ou code.
La surcharge du libellé ne change ni l'identité ni les droits du module.

L'hôte DOIT résoudre le pilote actif selon les règles communes du dépôt,
puis son corpus avec `resoudreCorpus`. Un identifiant `custom-…` est accepté.
Il DOIT vérifier la présence du module au registre et sa compatibilité avec
ce corpus. Une référence inconnue ou incompatible est signalée au MJ et
reste indisponible au joueur.

Un champ absent préserve les anciens pilotes. Le repli transitoire Alien
peut proposer les deux outils du registre lorsque le corpus résolu est
Alien ; `[]` signifie explicitement aucun module et interdit ce repli.
Dans tous les cas, les accès de table sont fermés au départ. La Forge,
l'éditeur et l'export/import devront conserver et contrôler ces références.

## 4 · Interface du moteur

Le moteur autoritaire s'exécute dans le processus principal. Son adaptateur
DOIT fournir les fonctions suivantes ; les données échangées sont du JSON
sans fonction, référence cyclique, `Date`, `Map` ou valeur non finie.

| Fonction | Contrat |
| --- | --- |
| `creerEtat()` | Renvoie un nouvel état initial, sans effet lancé. |
| `validerEtat(etat)` | Retourne normalement si l'état est valide ; lève une erreur sinon. |
| `migrerEtat(donnees, versionDonnees)` | Renvoie une copie validée au format courant ; refuse une version non prise en charge. L'identité du module est vérifiée par l'hôte avant cet appel. |
| `appliquerCommande(etat, commande, contexte)` | Valide rôle, commande et charge ; renvoie un nouvel état valide ou lève une erreur. Ne modifie pas l'état reçu. |
| `vuePour(etat, lecteur)` | Renvoie une copie contenant seulement les données autorisées à ce lecteur. |
| `arreterEffets(etat)` | Renvoie un état où les effets actifs sont arrêtés, sans effacer la préparation. Appel idempotent. |

`commande` contient exactement `{ id, charge }`. `contexte` et `lecteur`
sont construits par l'hôte : `{ role: 'mj' | 'joueur', personnageId?, appareilId? }`.
Le personnage est obligatoire pour un lecteur ou un acteur joueur.
L'identifiant d'appareil est facultatif pour les modules ordinaires, mais
obligatoire pour choisir un appareil de diffusion sonore. Il est établi par
l'hôte et ne provient jamais de la charge d'une commande joueur. Un module
peut rendre un booléen d'autorisation sonore ciblé sans exposer cet identifiant.
La campagne et le module sont sélectionnés par l'hôte avant l'appel ;
une charge joueur NE DOIT PAS pouvoir leur substituer d'autres identités.

Ces fonctions sont synchrones et sans accès direct au disque, réseau, audio
ou magasins GM-OS. L'hôte porte la persistance et le transport ; les vues
portent les sons et animations. Une action mécanique sur une fiche ou un jet
exige un raccordement explicite au domaine GM-OS concerné, décrit et validé
pour le module. Ce contrat n'accorde aucune écriture générique sur les fiches.

Deux modules liés PEUVENT utiliser un service de campagne partagé déclaré
dans le registre de code. Ce service conserve un seul état et une seule file
de mutations ; leurs vues et autorisations restent séparées. L'adaptateur
Alien devra préciser ce raccordement avant son intégration.

## 5 · Vues dans le Hub et au pupitre

Le registre fournit les composants React `VueJoueur` et `PupitreMJ`, alimentés
par une propriété `vue` et une fonction `envoyerCommande({ id, charge })`.
La fonction renvoie une promesse de résultat : `{ ok: true }` en cas de succès,
ou `{ ok: false, erreur: string }` en cas d'échec affichable. Une exception
de transport produit un message générique dans la vue, sans ses détails.
Les composants NE DOIVENT PAS recevoir l'état privé brut ou un pont Electron
généraliste. Le pupitre reçoit seulement la vue construite pour le rôle MJ.
Les commandes communes d'autorisation appartiennent à l'hôte.

Pour les séquences à échéance serveur, l'hôte peut fournir une fonction locale
facultative `horloge()` donnant l'heure du poste MJ en millisecondes. Elle est
ancrée à la réception de `instantServeur` dans l'enveloppe joueur et avance avec
l'horloge monotone du navigateur, même si la vue est fermée puis rouverte.
Cette fonction ne fait partie ni du JSON réseau ni de la sauvegarde ; sans elle,
une vue autonome utilise son heure locale. MU/TH/UR l'utilise pour ses signaux
de piratage. Cette référence corrige l'écart des horloges des appareils ; elle
ne mesure pas la latence du réseau.

Les vues DOIVENT fonctionner de 360 à 1 180 px, avec commandes tactiles,
libellés accessibles et saisie compatible avec le clavier virtuel. Le cadre
suit le thème du Hub. Un instrument PEUT avoir son propre habillage dans
sa zone, avec styles isolés pour ne pas modifier le reste de la tablette.

Tout son exige une activation locale par l'utilisateur. Chaque vue DOIT
nettoyer ses écouteurs, minuteries, animations et ressources audio au démontage.
Le mode de mouvement réduit et les performances de l'appareil doivent être
pris en compte. Une erreur d'un module est confinée à sa vue et laisse le
retour au Hub disponible.

## 6 · Autorisation et protocole

L'hôte DOIT vérifier l'association acceptée entre appareil et personnage,
la campagne active, la référence du pilote, la compatibilité, l'autorisation
MJ et le rôle permis pour la commande. Le moteur vérifie ensuite sa charge
et les règles propres au module. Le contexte est établi côté serveur ; une
identité, un rôle ou un droit reçu dans la charge ne fait pas autorité.

La couche de transport réutilise IPC et WebSocket GM-OS. Pour une commande,
l'enveloppe commune DOIT porter `versionContrat`, `campagneId`, `moduleId`,
`generation`, `requeteId` et `commande`. Les identités sont comparées au
contexte serveur. `generation` est un identifiant opaque renouvelé lors d'une
réouverture ou d'un changement de contexte ; il invalide les anciennes commandes.
Cette génération est propre au destinataire et à son accès : retirer un PJ
ne perturbe pas les autres. L'hôte borne les chaînes d'enveloppe et la taille
des charges avant traitement ; chaque module borne aussi ses propres champs.

Un état ciblé contient les mêmes identités de contexte et génération, une
`revision` monotone, puis `vue`. Un résultat porte `requeteId` et un statut
de succès/échec, sans détail privé d'un autre lecteur. L'hôte déduplique les
requêtes d'une même génération avant toute mutation. La vue ignore les
révisions anciennes ; la liste des accès autorisés contrôle l'ouverture.
Un ancien instantané NE DOIT PAS rouvrir un module révoqué.

Seuls les destinataires autorisés reçoivent leur vue et leurs cartes. Le
filtre s'applique avant l'envoi, pour l'état complet, les mises à jour et la
reconnexion. Les secrets NE DOIVENT PAS entrer dans le flux commun des
campagnes, les journaux techniques ou les messages d'erreur publics.

## 7 · Sauvegarde et cycle de vie

Une sauvegarde contient `moduleId`, `versionDonnees` et `donnees`, indexés
par campagne. L'hôte conserve aussi la révision et la préparation des accès ;
la génération de table est renouvelée à la reprise. Les migrations sont
effectuées sur une copie et la sauvegarde antérieure reste disponible en
cas de refus. Un module absent ou une version future sont conservés à
l'import, signalés au MJ et laissés indisponibles.

La mutation s'effectue sur un état candidat validé. L'hôte sérialise les
écritures par instance et persiste atomiquement **avant** le succès et la
diffusion. En cas d'échec, il conserve la préparation précédente. Le retrait des droits et
la coupure des effets restent immédiats en mémoire même si leur écriture échoue ; le MJ voit
cet échec. Export/import et
sauvegarde de campagne DOIVENT inclure ces données privées ; elles ne sont
pas ajoutées aux objets `Campaign` diffusés au Hub.

| Événement | Obligation |
| --- | --- |
| Fermer un pupitre / changer d'onglet | Conserver l'instance, nettoyer la vue quittée. |
| Retirer un accès à un PJ | Invalider ses commandes, retirer sa carte et sa vue, arrêter ses effets locaux ; préserver les autres destinataires. |
| Déconnexion | Arrêter les effets locaux, afficher l'état de liaison, refuser les commandes ; aucun rejeu automatique. |
| Reconnexion | Revalider accès et contexte, recevoir un état ciblé courant ; ne pas rejouer les séquences anciennes. |
| Changer de PJ | Effacer l'ancien état d'affichage avant de recevoir le nouveau. |
| Fermer le module pour tous / changer de campagne / terminer la séance | Invalider les générations concernées, retirer les accès et appeler `arreterEffets`. |
| Redémarrage / import | Migrer et valider, arrêter les effets, garder les accès de table fermés jusqu'à ouverture par le MJ. |

Révoquer un accès conserve l'historique côté hôte. Cela ne peut effacer une
information déjà lue. La destruction des données nécessite une action MJ
distincte du retrait d'accès.

## 8 · Conformité et livraison

| Niveau | Ce qui doit être démontré |
| --- | --- |
| **Manifeste conforme** | Format v1, références de pilote valides et identifiants sans doublon. Le validateur local contrôle le manifeste ; sa fonction exportée contrôle la forme des références. |
| **Moteur conforme** | Charges et rôles refusés correctement, filtrage par lecteur, état non muté sur erreur, sérialisation/restauration et arrêt idempotent. Essais propres au module. |
| **Intégration conforme** | Registre et compatibilité, identité et accès MJ, deux PJ isolés, état complet/reconnexion, génération révoquée et déduplication, écriture échouée, export/import. |
| **Interface vérifiée** | Navigation, retrait immédiat, son et nettoyage, clavier virtuel, revue aux formats téléphone/tablette, puis essai matériel. |

Le [moteur d'exemple](../../outils/modules-du-jeu/exemple/moteur.mjs) montre
un texte publié par le MJ et des accusés de lecture privés par PJ. Il ne
fournit pas encore de composants visuels ou d'hôte. Ses essais ne remplacent
pas ceux d'un module réel ni ceux du transport. Le validateur statique
n'exécute aucun code du manifeste et ne certifie pas le moteur ou l'interface.

Contrôles réalisés le 15/10 : manifeste de référence accepté, syntaxe Node
propre et huit essais locaux au vert (format, droits, filtrage, restauration
et CLI). Aucun essai d'interface, de transport ou d'appareil à ce stade.

Le premier adaptateur réel, [MU/TH/UR](../../outils/alien/modules/muthur/README.md),
est livré avec moteur, manifeste et composants React, enregistré dans l’hôte et le transport privé
de GM-OS. Le [détecteur Alien](../../outils/alien/modules/detecteur/README.md) est aussi enregistré,
avec droits indépendants, scan partagé et bips locaux. Les essais d’interface et de transport
hors ligne ne remplacent pas l’essai sur réseau et tablettes physiques.

Un module livré DOIT documenter ses commandes, ses données, ses migrations,
ses effets, ses limites et ses essais. Sa page de jeu et le guide des
tablettes sont actualisés lorsque l'intégration devient disponible.
