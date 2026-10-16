# Alien — améliorer les accessoires et les intégrer au Tablet Hub

**15/10/2026 — plan et suivi. Registre § 135.** La sélection dans les pilotes et
l’emplacement générique du Hub/cockpit sont codés. La deuxième tranche livre le transport
privé, les accès par PJ, les sauvegardes et MU/TH/UR dans l’hôte commun. La troisième
ajoute le détecteur et la coupure générale. L’étape 4 éprouve le vrai HTTP/WebSocket avec
Electron et deux sessions Edge isolées sur le PC. L’essai sur les appareils physiques reste à faire.

**Précision de David le même jour :** l'emplacement du Tablet Hub doit être
générique et recevoir les modules propres aux jeux/pilotes, notamment Alien
et la Table des Terres Médianes de Rêve de Dragon. Le
[plan commun Modules du jeu](2026-10-15-modules-du-jeu-tablet-hub.md) porte
ce cadre et passe avant les lots Alien pour le contrat et la navigation.
Le [contrat v1 des modules](../Architecture/Contrat-des-modules-du-jeu.md)
est maintenant formalisé, avec validateur statique et moteur d'exemple.
Le manifeste du prototype Alien reste inchangé ; le module reçoit son propre manifeste.
**Suite du 15/10 :** un [manifeste distinct et l'adaptateur MU/TH/UR v1](../../outils/alien/modules/muthur/README.md)
sont livrés avec moteur réutilisé, composants React joueur/MJ et types publics.
Le manifeste autonome reste un descripteur d'atelier ; il n'a pas à être
remplacé par celui du module. G0–G2 et MU/TH/UR dans le Hub sont livrés et testés hors ligne.

David : *« le module externe beta d'Alien fonctionne bien pour une première
version. Il faut toutefois l'amélioré et voir comment l'intégrer dans le
Tablet Hub correctement (activé par le mj par exemple). »* Il précise ensuite :
*« Préparer le plan d’amélioration et d’intégration au Tablet Hub. »*
GM-OS est fermé au moment de cette étude. Ce constat ne dispense pas de
redemander son état lors d'une future session de développement.

Les choix ci-dessous sont des **propositions à discuter**, sauf les décisions
déjà prises : accessoires propres à Alien, intensité décidée par le meneur,
aucune écriture du Stress, aucun effet automatique des comptes à rebours.

## 1 · Parcours proposé à la table

### Le meneur prépare, puis ouvre les accès

Dans le cockpit d'une campagne Alien, l'espace commun **Modules du jeu**
donne accès aux pupitres **MU/TH/UR** et **Détecteur**.
Les documents, codes et réglages se préparent avant la séance.

Chaque accessoire possède sa commande **Rendre accessible aux joueurs**,
désactivée au départ, et ses destinataires : **tout l'équipage** ou une
**sélection de personnages**. MU/TH/UR et le détecteur s'autorisent séparément.
Pour le détecteur, **autoriser l'appareil** et **démarrer le scan** sont deux
gestes distincts : le meneur peut laisser un appareil en veille à son porteur.

Le pupitre montre les destinataires et l'état effectivement diffusé. Il garde
les réponses privées, demandes de piratage, dossiers et réglages actuels.
Une commande **Tout couper** retire les accès et arrête les effets sans
effacer la préparation ni les dialogues.

### Le joueur reste dans le Tablet Hub

L'entrée commune **Modules du jeu** ouvre une page contenant les cartes
**MU/TH/UR** et/ou **Détecteur**, selon les accès accordés. Sans accès, elle
affiche l'état vide commun proposé dans le plan générique.
À l'intérieur, l'instrument peut occuper l'écran, avec retour visible au Hub.
Une pastille annonce une réponse ou une demande disponible sans imposer
un changement de page au joueur.

Le joueur garde sa connexion et son personnage du Hub : aucun second code
de table, nom d'opérateur ou lien à saisir. Les codes de scénario restent
des commandes du terminal, distinctes des droits de connexion à GM-OS.
L'accès administrateur fictif de MU/TH/UR ne donne aucun droit de meneur.

Si le MJ retire un accès pendant l'utilisation, la vue concernée se ferme,
ses sons et animations s'arrêtent et le joueur revient à une vue autorisée.
Le retrait ne peut pas effacer ce qu'un joueur a déjà lu ou mémorisé.

## 2 · Ce que le code fournit déjà

| Ancre | Constat vérifié le 15/10 |
| --- | --- |
| [`core.js`](../../outils/alien/core.js) | Moteur partagé, commandes et droits ; `snapshot('player', id)` filtre documents et radar par opérateur. Pas de droit d'ouverture séparé par accessoire. |
| [`server.mjs`](../../outils/alien/server.mjs) | Une table autonome, HTTP + SSE, jetons propres, sauvegarde `.local/`. Arrêt du radar et du compte à rebours à la reprise. |
| [`app.js`](../../outils/alien/app.js) | Interface liée au DOM et à ses transports fichier/HTTP ; son autorisé par clic sur chaque appareil. |
| [`TabletHub.tsx`](../../src/components/TabletHub.tsx) et [`useHubSync.ts`](../../src/modules/session/hooks/useHubSync.ts) | Navigation générique, identité et canal privé ; MU/TH/UR et détecteur enregistrés sans branche Alien dans le Hub. |
| [`SyncServer.ts`](../../electron/SyncServer.ts) | HTTP + WebSocket natif `ws`, appairage MJ et registre des appareils ; acheminement individuel existant pour les messages. |
| [`useNexusSynchronizer.ts`](../../src/modules/remote/hooks/useNexusSynchronizer.ts) | Diffusions communes par rôle, complètes et différentielles ; les campagnes sont incluses dans le segment session. |
| [`drivers.ts`](../../src/types/drivers.ts) et [`corpusSysteme.ts`](../../electron/corpusSysteme.ts) | `corpusId` et `resoudreCorpus` permettent de retrouver Alien avec un identifiant de pilote forgé. |

Le manifeste du prototype n'est toujours pas lu par GM-OS. L'existence d'un
lien HTTP dans Web-OS ne réalise pas cette intégration.
La vieille note `Technical Docs/tablet-hub-protocol.md` parle de Socket.io :
pour ce chantier, le code actuel ci-dessus fait foi.

## 3 · Architecture recommandée

**Réutiliser le moteur Alien et le transport du Hub.** Le serveur autonome
reste un mode d'essai ; l'usage intégré n'exige ni processus Node supplémentaire,
ni port supplémentaire, ni seconde connexion SSE sur la tablette.

1. Extraire le moteur sous une forme importable et typée, avec un adaptateur
   pour conserver le prototype autonome. Une seule implémentation des commandes
   et du filtrage ; ne pas copier `core.js` dans une seconde logique.
2. Porter l'état autoritaire dans le processus principal Electron, sous une
   identité de campagne. Fermer le pupitre ou changer d'onglet ne termine pas
   la table ; les vues ne sont pas propriétaires de l'état.
3. Envoyer les actions MJ par IPC depuis le PC, et les commandes joueur par
   le WebSocket existant. Le processus principal déduit personnage et campagne
   depuis la connexion acceptée et l'état GM-OS, puis vérifie l'accès à l'outil.
   Une charge réseau ne choisit ni le rôle, ni une autre campagne, ni un autre
   opérateur. Les actions MJ restent interdites aux rôles joueur/hub.
4. Émettre un état **par destinataire**, à partir du même filtre que le moteur.
   Réutiliser le principe du routage privé des messages, sans transformer les
   dialogues MU/TH/UR en messages ordinaires de la séance.
5. Construire les vues React du Hub et du pupitre autour de cet adaptateur.
   Réutiliser les dessins et sons via des fonctions isolées avec nettoyage
   explicite ; ne pas monter l'atelier meneur complet dans une iframe joueur.

**Point de passage obligatoire : l'identité.** Le Hub accepte actuellement un
`characterId` à l'inscription et contrôle ses collisions (`SyncServer` et
`SessionManager`). Cela n'est pas une preuve indépendante de propriété du PJ.
Avant de livrer des dialogues Alien privés, prévoir une association approuvée
par le MJ et une reprise reconnue côté serveur. Vérifier également le cas de
deux connexions déclarant le même `deviceId`, pour éviter qu'un simple identifiant
recopié ouvre le flux privé. Le détail de cette association appartient au lot A1.

### Pilote et sauvegarde

La disponibilité se déduit du **pilote résolu de la campagne**, avec les règles
communes de résolution du corpus. Un pilote `custom-…` rattaché à `alien` doit
fonctionner. Ne pas tester seulement `campaign.system === 'alien'`, ni le nom
affiché. Un pilote non résolu n'active rien.

La précision de David du 15/10 fait passer le contrat générique en premier :
le pilote référence des modules connus dans `modulesDuJeu` (champ proposé),
un registre commun fournit leurs implémentations et le MJ autorise leur
ouverture. Voir le plan commun pour la compatibilité des pilotes existants.
Les deux outils Alien sont les premières implémentations de ce contrat.

La sauvegarde privée est **indexée par campagne** et versionnée. Elle contient
documents, secrets, accès narratifs, dialogues et réglages. Prévoir son inclusion
dans les exports/imports et sauvegardes de campagne, puis vérifier ces chemins.
Ne pas ajouter l'état privé brut à `Campaign` : les campagnes voyagent aujourd'hui
dans la synchronisation commune du Hub. Seul un résumé public explicitement
construit peut rejoindre ce flux ; l'état personnel emprunte le canal ciblé.

Les écritures sont sérialisées et atomiques. En cas d'échec de sauvegarde,
signaler l'échec sans annoncer une mutation durable ni diffuser un succès.
Un fichier illisible ne doit pas être remplacé silencieusement par des exemples.

| Événement | Comportement proposé |
| --- | --- |
| Changer d'onglet / fermer le pupitre MJ | Conserver la table ; nettoyer les effets de la vue fermée. |
| Retirer un destinataire | Arrêter son outil et vider son état d'affichage. |
| Perdre la connexion | Afficher « Liaison perdue », arrêter les bips et refuser les commandes ; aucun rejeu automatique de saisies après reconnexion. |
| Reconnecter la tablette | Revalider l'identité et rendre son seul état courant, sans rejouer les anciennes séquences. |
| Changer de personnage | Retirer l'ancien état privé avant de charger celui du nouveau PJ autorisé. |
| Changer de campagne / terminer la séance | Fermer les accès de table et arrêter radar, faux échos et compte à rebours ; garder la préparation et l'historique. |
| Redémarrer GM-OS / importer une campagne | Restaurer la préparation, avec accès de table fermés et effets arrêtés ; réouverture volontaire par le MJ. |

Chaque état/action porte le contexte de campagne et une révision ; un état
retardé d'une ancienne campagne ne doit pas repeupler la vue courante.

## 4 · Améliorations du prototype, par priorité

| Priorité | Amélioration | Critère concret |
| --- | --- | --- |
| Livré le 16/10, étape 5 | Créer, supprimer et classer les dossiers | Nouveau dossier, Monter/Descendre et suppression confirmée ; déverrouillages nettoyés, ordre conservé dans la préparation portable et la campagne. |
| Livré le 16/10, étape 5 | File des demandes MU/TH/UR | Texte et statut conservés, traitement ciblé, 32 attentes et 128 entrées par opérateur ; questions et HACK indépendants, migration des anciennes demandes. |
| Livré en troisième tranche, matériel à essayer | Accès indépendants et arrêt immédiat | MU/TH/UR et détecteur ont leurs destinataires ; retrait partiel préserve les autres vues, dernier retrait arrête le scan. Tout couper ferme tous les outils et leurs effets même si le disque échoue. |
| Première | Reconnexion et ergonomie tactile | Reprise du même opérateur ; terminal utilisable avec le clavier virtuel ; commandes lisibles à 360–390 px et sur iPad. |
| Livré le 16/10, étape 5 | Préréglages de mise en scène nommés | 32 noms par campagne, contacts/proximité/intensité/volume/parasites ; rappel en veille, faux écho arrêté, aucun démarrage implicite. |
| Ensuite | Réglage des effets et du son | Choix CRT/parasites, mouvement réduit et performances ; volume local et autorisation audio par appareil. Arrêt muet sans dépendre de l'animation. |
| Livré en 0.3, matériel à essayer | Protocoles, messages type, film complet d'autodestruction, sirène et voix de secours | Un seul appareil sonore ; durée au moins 12 min 56 selon le choix du film entier ; choix/transfert et séquence testés hors ligne. |

Le détecteur reste scénarisé : ni télémètre physique, ni jet automatique, ni
lien entre intensité et Stress. Pas de nouveaux effets de règle dans ce lot.

## 5 · Lots de réalisation et validation

| Lot | Contenu | Validation avant de passer au suivant |
| --- | --- | --- |
| A0 — moteur | Adaptateurs MU/TH/UR et détecteur, types publics, validation, dossiers et file de demandes livrés ; complétés le 16/10 par l’étape 5 | Essais locaux de codes, secrets, droits, migration et compatibilité autonome verts. |
| A1 — hôte et identité | État privé par campagne, persistance, association MJ/appareil/PJ et transport ciblé | Sans port ouvert : vrais gestionnaires appelés en mémoire ; deux PJ, identité falsifiée, double `deviceId`, autre campagne, écriture échouée, reconnexion. |
| A2 — première tranche jouable | MU/TH/UR livré dans le véritable hôte depuis G2 : pupitre, cartes et droits par PJ | Parcours éprouvé avec hôte réel, puis HTTP/WebSocket réels entre Electron et Edge sur le même PC ; matériel à vérifier. |
| A3 — détecteur et cycle de vie | Livré en troisième tranche : adaptateur v1, rendu partagé avec le prototype, accès indépendants, scan partagé, bips locaux, Tout couper et clé d’ouverture par PJ/module | Radar seulement chez les destinataires ; coupure immédiate, silence et nettoyage testés ; arrêt à la reprise/import, réglages conservés. 33 captures Hub + 6 du prototype. |
| A4 — livraison | Volet logiciel validé : six parcours E2E sur instance jetable, vrais HTTP/WebSocket et fichier privé, deux PJ, déconnexion/reprise, vidéo, son ciblé et redémarrage/import ; recette reproductible fournie | Build avant E2E, lint, captures du vrai Hub relues. Audio réel observé mais sortie muette. Restent Wi-Fi, clavier virtuel, veille, écoute du film entier et sirène/voix sur deux appareils physiques. |

David demande le 15/10 *« on fait le step 4 »* ; ce lot inclut les essais réseau
de la [recette dédiée](2026-10-15-recette-modules-alien.md), sur instance jetable.
Les e2e utilisent une campagne jetable et une sortie de captures dédiée,
sans toucher aux données personnelles ni réécrire les captures existantes.
Les pages 53/54 Alien/61 sont actualisées. La recette matérielle utilise une semence
fictive explicite, sans lecture des sauvegardes personnelles par le lanceur de répétition.

**Ordre révisé après la précision de David : G0 → G1 → G2** du plan commun,
puis A0/A2 et A3/A4. G2 reprend la partie commune d'A1. Première démonstration
utile : MU/TH/UR privé ouvert et fermé par le MJ pour un seul PJ dans
l'emplacement générique, réutilisable pour le prochain jeu.
