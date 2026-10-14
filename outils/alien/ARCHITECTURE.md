# Architecture du prototype Alien — version 0.1.0

État au 13/10/2026. Cette note décrit le code livré, sans présenter les
propositions de l'étude comme des fonctions déjà disponibles.

## Deux transports, un moteur

```mermaid
flowchart LR
  F[Atelier en mode fichier] --> L[AlienCore dans le navigateur]
  L --> B[Stockage local du navigateur]
  M[Vue meneur HTTP] -->|Commandes JSON| S[Serveur Node]
  J[Vue joueur HTTP] -->|Commandes JSON| S
  S --> C[AlienCore côté serveur]
  C --> D[.local/session.json]
  S -->|Événements ciblés| M
  S -->|Événements ciblés| J
```

[core.js](core.js) publie `AlienCore.créer()` et `AlienCore.initial()`.
Le moteur créé offre `inscrire`, `snapshot`, `agir` et `sauvegarde`.
Il ne connaît pas GM-OS, Electron, Foundry ou les fiches de personnages.

En mode fichier, [app.js](app.js) appelle le moteur directement avec le rôle
meneur. L'aperçu joueur masque les contrôles mais n'est pas une frontière
d'accès : la configuration entière est dans ce navigateur d'atelier.
La clé de stockage est `alien-accessoires:atelier:v1`.

En HTTP, les actions passent au serveur et les vues reçoivent des instantanés
filtrés. Le transport est **HTTP + Server-Sent Events**, et non WebSocket.
Le serveur peut garder l'état lorsque Web-OS ferme sa vue.

## Modèle de données

| Élément | Contenu |
| --- | --- |
| `config` | Nom du vaisseau, réponse à STATUS, mot de passe administrateur, CRT et parasites |
| `documents` | Identifiant, titre, accès équipage/code/admin, code et contenu |
| `players` | Identité, accès, dossiers déverrouillés, dialogue, demande et dernière séquence |
| `tracker` | Activation, intensité, volume, contacts, proximité, parasites, destinataire et faux écho |
| `countdown` | Date de fin du compte à rebours fictif, ou absence |
| `revision` | Numéro des mutations du moteur |

Les messages sont plafonnés à 200 par opérateur. Le moteur ne contient ni
campagnes multiples, ni droits de capitaine, ni gestion des fiches GM-OS.
Le mot de passe et les codes sont des chaînes, comparées exactement après
retrait des espaces extérieurs lors de la commande. Le rôle fictif `admin`
du terminal ne devient jamais le rôle meneur du serveur.

## Protocole HTTP

| Méthode et chemin | Accès | Résultat |
| --- | --- | --- |
| `GET /` | Public | Page de connexion ou interface selon le jeton détenu |
| `POST /api/join` | Code de table | Inscrit un opérateur et rend un jeton joueur |
| `GET /api/session` | Jeton | Rôle réel et identifiant de l'opérateur |
| `GET /api/state` | Jeton | Instantané complet meneur ou instantané joueur filtré |
| `GET /api/events` | Jeton | Flux SSE d'instantanés, avec maintien de connexion |
| `GET /api/table` | Meneur | Code de table et adresses réseau proposées |
| `POST /api/action` | Jeton | Traite une action autorisée et sauvegarde l'état |

Le jeton voyage dans `Authorization: Bearer …`. Le lien initial meneur le
porte dans un fragment `#mj=…`, retiré de l'adresse par l'interface ; il est
ensuite rangé dans le stockage de session de l'onglet. Le fragment n'est pas
envoyé comme partie de la requête HTTP.

Le joueur peut seulement envoyer `command`. Le serveur prend son identité
dans le jeton, sans se fier à un `playerId` fourni dans l'action. Le meneur
peut gérer configuration, dossiers, réponses, piratage, révocation, tracker,
faux écho, compte à rebours et réinitialisation. Il peut aussi saisir une
commande pour son aperçu de l'opérateur sélectionné.

`createTable()` est importable sans écouter un port. Sa méthode `request()`
permet de vérifier le protocole directement. Seule l'exécution de
`node outils/alien/server.mjs` appelle `listen`. Le CLI écoute sur `0.0.0.0`
pour les tablettes du réseau local, port 8787 ou `ALIEN_PORT`.

## Filtrage et sauvegarde

Un instantané joueur contient son propre dialogue et ses accès, la
configuration publique, les seuls documents autorisés sans leur code et
l'état du détecteur qui lui est destiné. Pour un non-destinataire, le
détecteur est neutralisé, sans contacts ni intensité révélés.

Les actions sont sérialisées. Les deux sauvegardes sont écrites via un
fichier temporaire puis renommées, avant la diffusion de la mutation :

- `.local/session.json` : configuration et état de la table ;
- `.local/connexion.json` : jeton meneur, code de table et jetons des joueurs.

Le dossier `.local/` est ignoré par Git. Une sauvegarde illisible fait
échouer le chargement ; le serveur ne l'efface pas pour repartir à zéro.
À la reprise, radar et compte à rebours sont arrêtés et les séquences de
piratage ne sont pas rejouées. Les dialogues et accès sont conservés.

Le serveur ne sert que les fichiers publics explicitement listés. Le
dossier `.local/` n'est pas accessible par HTTP. Il ne donne aucun accès
au disque de GM-OS ni aux sauvegardes de David.

## Animation et son

Le texte progressif, les parasites et le radar utilisent un même cycle
`requestAnimationFrame`, interrompu pour les traitements lorsque la page est
cachée. Le radar utilise un canvas adapté à sa taille, avec un ratio de
pixels plafonné à 2. Le bruit du terminal est calculé sur un petit canvas.

Les effets CRT utilisent des lignes CSS, une vignette et un halo. Ils ne
simulent pas une vraie déformation géométrique de tube cathodique.
Les sons sont synthétisés par Web Audio après activation explicite sur
l'appareil. L'intensité modifie le rythme et l'agitation, le volume reste
indépendant. Il n'existe pas encore d'alarme sonore globale dédiée.

## Intégration GM-OS à construire

[manifest.json](manifest.json) est un descripteur du prototype, **pas un
contrat déjà consommé par GM-OS**. Il identifie le corpus Alien et deux
points d'entrée. Aucun champ du type `GameDriver` n'a été ajouté.

Le prochain contrat devra définir disponibilité par pilote, identité de
campagne et d'opérateur, ouverture/fermeture, sauvegarde et arrêt des effets
au changement de campagne. Les secrets resteront dans la configuration de
campagne. L'identité devra reconnaître les pilotes forgés dont l'identifiant
est horodaté, sans supposer `campaign.system === 'alien'`.

Le service actuel n'héberge qu'une table. Le choix d'un nom à la connexion
ne retrouve pas un ancien opérateur sans son jeton. Une reconnexion automatique
retrouve en revanche les données de l'onglet dont le jeton est encore valide.

## Limite des contrôles réalisés

Le protocole et les parcours de navigateur ont été vérifiés sans écouter
sur le réseau : `request()` appelée directement et routes du navigateur
interceptées. Cela ne remplace pas un essai de l'écoute HTTP et du flux SSE
continu avec des tablettes physiques. La qualité sonore, la fluidité sur
les appareils de David et la fidélité à la référence Foundry restent à juger.
