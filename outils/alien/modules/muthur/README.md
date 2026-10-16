# MU/TH/UR 6000 — adaptateur de module GM-OS v1

**16/10/2026 — version du module 0.4.0, données v3, contrat v1.**
Conforme au format du [contrat v1](../../../../documentation/Architecture/Contrat-des-modules-du-jeu.md).
Ce dossier fournit le manifeste, le moteur et les composants React joueur/MJ.
**Le registre, les autorisations de table et le branchement au Tablet Hub sont livrés
dans la deuxième tranche du 15/10.** Depuis **Cockpit › Modules du jeu**, le MJ prépare
MU/TH/UR et, pendant une séance, ouvre l’accès aux personnages choisis. Le stockage
privé natif conserve préparation et dialogues, séparément des campagnes synchronisées.
Les sauvegardes de session et exports de campagne les emportent ; leur restauration
ferme les accès et arrête les effets. Le détecteur dispose de son adaptateur séparé.
Le serveur et l'atelier autonome Alien
gardent leur fonctionnement actuel et leur manifeste propre.

## Fichiers et point d'entrée

| Fichier | Rôle |
| --- | --- |
| `manifeste.json` | Module `alien-muthur`, contrat 1, compatible avec le corpus `alien`. |
| `moteur.mjs` | Les six fonctions du moteur v1, autour du même `core.js` que le prototype. |
| `vues.mjs` | Composants React `VueJoueur` et `PupitreMJ`, sans transport intégré. |
| `style.css` | Styles limités à `.gmos-muthur`, sans import de police ou ressource externe. |
| `index.mjs` | Exporte `manifeste`, `moteur`, `VueJoueur`, `PupitreMJ`, `feuilleDeStyle`. |
| `medias.mjs` | URL statique du film, également exportée par `index.mjs` ; prise en charge par le bundler du futur hôte. |
| `*.d.mts` | Types publics pour le futur consommateur TypeScript du module. |
| `verification*.mjs` | Essais Node du moteur, du serveur autonome et des composants React. |
| `apercu.mjs` | Produit une démonstration HTML autonome et, sur option, des captures hors ligne. |

L'hôte devra enregistrer explicitement les exports d'`index.mjs`, charger la
feuille de style indiquée et fournir aux vues `vue` et `envoyerCommande`.
Cette dernière renvoie `{ ok: true }` après persistance, ou
`{ ok: false, erreur: 'Message affichable' }`. Elle transporte les commandes
via le protocole commun ; le module n'ouvre aucune connexion lui-même.

## Commandes du moteur

Toutes les charges refusent les champs inconnus. `personnageId` est une
identité GM-OS fournie par l'hôte pour les lecteurs et commandes joueur.
Le rôle fictif « administrateur » du terminal n'accorde aucun droit MJ.

| Commande | Rôle | Charge |
| --- | --- | --- |
| `saisir` | Joueur | `{ texte }`, 1–2 000 caractères non blancs. L'identité vient du contexte. |
| `saisir` | MJ | `{ personnageId, texte }`, pour essayer le terminal de cet opérateur. |
| `choisir-diffusion` | Joueur/MJ | `{ actif }` booléen ; réserve ou libère uniquement l'appareil du contexte fourni par l'hôte. |
| `enregistrer-protocole` | MJ | `{ protocole }` : identifiant, nom (80), code (120), message (4 000), effet, minutes (0,1–60), actif (booléen), portée (`operateur`/`equipage`). |
| `supprimer-protocole` | MJ | `{ protocoleId }`, sans arrêter une séquence déjà engagée. |
| `preparer-operateur` | MJ | `{ personnageId, nom }`, nom non blanc de 40 caractères au plus. Inscrit ou renomme sans retirer messages et accès. |
| `configurer` | MJ | Champs facultatifs : `vaisseau` (64), `statut` (2 000), `motDePasse` (120, non blanc), `crt` et `parasites` (booléens). |
| `creer-dossier` | MJ | `{ dossierId, titre, contenu, acces, code }`. Identifiant unique pour READ : 1 à 64 caractères, lettre minuscule initiale, puis lettres minuscules, chiffres ou tirets. Titre non blanc ; mêmes limites et protections que la modification. Code non blanc requis pour `acces: 'code'`. |
| `modifier-dossier` | MJ | `dossierId` requis ; `titre` (80), `contenu` (10 000), `acces` (`equipage`, `code`, `administrateur`), `code` (120) facultatifs. |
| `supprimer-dossier` | MJ | `{ dossierId }` ; retire le dossier et ses déverrouillages, conserve les textes déjà lus. Confirmation locale au pupitre. |
| `classer-dossiers` | MJ | `{ dossierIds }` ; permutation exacte des identifiants actuels, sans doublon. L’ordre de LIST suit cette liste. |
| `repondre` | MJ | `{ personnageId, texte, demandeId? }`, texte non blanc de 10 000 caractères au plus. Identifiant : question ciblée ; `null` : message libre ; absent : première question en attente, sinon message libre (compatibilité). |
| `arbitrer-piratage` | MJ | `{ personnageId, reussite, demandeId? }`, booléen ; exige le HACK ciblé en attente, ou le premier si identifiant absent. |
| `revoquer` | MJ | `{ personnageId }`, retire accès administrateur, déverrouillages et piratage en attente ; conserve le dialogue. |
| `compte-a-rebours` | MJ | `{ minutes }`, nombre de 0,1 à 60 ; `null` arrête le compte. |
| `reinitialiser` | MJ | `{}`, remet les exemples et efface dialogues/accès, en conservant les opérateurs. Confirmation locale au pupitre. |

Le premier texte d'un PJ autorisé l'inscrit automatiquement sous son identité.
Sa simple consultation produit une vue vide personnelle sans modifier l'état.
L'hôte pourra envoyer `preparer-operateur` avec le nom du personnage avant
d'ouvrir l'accès ; les vues ne demandent pas de nouvel identifiant au joueur.
L'hôte reste responsable de vérifier que ce PJ appartient à la campagne.
Le contexte peut aussi contenir `appareilId`, requis pour le choix du diffuseur.
Ce choix remplace atomiquement le précédent. La vue ciblée reçoit
`diffusionAutorisee`, jamais l'identifiant privé d'un autre appareil.

Les codes et mots de passe restent des chaînes, avec zéros initiaux. Leurs
espaces extérieurs sont retirés au réglage et à la saisie ; les espaces
intérieurs et la casse sont conservés. LOGIN, CODE et l'alias ORDERS sont
masqués dans le dialogue, y compris dans le prototype autonome.

## Données, filtrage et migration

L'état reprend `version`, `system`, `revision`, `config`, `documents`,
`players` et `countdown` du moteur existant, avec `protocoles`, `portes`,
`autodestruction` et `diffusionAlarme` depuis la v2. Chaque mutation renvoie une
copie validée, sans toucher à l'état reçu, et chaque commande avance sa révision. Les limites
sont 256 dossiers, 256 opérateurs et 200 messages par opérateur ; le moteur
vérifie aussi les clés et types imbriqués. Le stockage, les générations et
la déduplication des requêtes appartiennent au futur hôte.

`vuePour` ne transmet au joueur que sa configuration publique, son opérateur
et les dossiers auxquels il a droit, sans leurs codes. Les dossiers verrouillés
et dialogues des autres PJ sont absents. Le MJ reçoit la vue de contrôle.
Une vue est une copie et ne permet aucune mutation indirecte de l'état.

`migrerEtat(donnees, versionDonnees)` accepte les formats 1, 2 et 3, notamment un
état **fictif ou exporté volontairement** du prototype, et en extrait le terminal.
Une ancienne table v1 reçoit une liste de protocoles vide avant de passer en v3, sans
changer ses codes ou lui ajouter un déclencheur actif. Il n'accède à aucun fichier et
ne consulte jamais `.local/`. Un état invalide ou une version future est
refusé. Cette migration ne convertit pas les jetons du serveur autonome en
identités GM-OS : la reprise d'une vraie table nécessitera une correspondance
explicite entre ses opérateurs et les personnages choisis par le MJ.
Elle masque également les anciennes saisies ORDERS qui auraient été
conservées en clair dans un dialogue du prototype.

La v3 ajoute `players[id].requests` : id, type, texte `content`, date `at`, statut
`pending`/`answered`/`accepted`/`refused`/`cancelled`, réponse `response`, date `resolvedAt`.
Jusqu’à 32 demandes en attente et 128 entrées par opérateur ; seules les anciennes entrées
traitées sont élaguées. Un HACK en attente par opérateur, avec plusieurs questions en parallèle.
`request` reste un pointeur de compatibilité vers le HACK ou la première question en attente,
validé contre la file. CLEAR conserve cette file ; révoquer annule les attentes et garde leur texte.
Un traitement déjà effectué ou visant la demande d’un autre PJ est refusé sans mutation.
La migration récupère la demande unique survivante des v1/v2, avec son texte depuis le journal
si disponible. Les questions déjà écrasées par l’ancien format ne peuvent pas être récupérées.
La préparation portable reste au format v1 : ordre et suppression des dossiers y sont conservés,
sans les demandes de séance. L’atelier HTML sauvegarde aussi ces deux nouvelles commandes.

**Le radar et ses préréglages sont exclus de cet état et des vues.** Le détecteur a
son propre adaptateur et son état autoritaire indépendant. Aucun jet, Stress ou champ
de fiche GM-OS n'est modifié par le terminal.

`arreterEffets` et la migration annulent l'autodestruction, la diffusion,
le compte à rebours et les séquences
de piratage en cours ; les dialogues, secrets et accès narratifs se conservent.
Les accès **de table** du Hub restent à gérer par l'hôte, séparément.

## Vues et effets

CRT renforcé : lignes de balayage, trame phosphore, halo, vignette et bords
arrondis du terminal. Les parasites ajoutent un grain animé continu, des bandes
d'interférence et de courts décalages du texte, même hors piratage.
Les deux réglages restent indépendants ; les mouvements réduits figent le
balayage et les parasites, avec un grain atténué. Les commandes et la vidéo
restent hors de ces déformations.

Vue joueur : dialogue privé, commandes rapides, saisie masquée des secrets,
CRT et bips. Pupitre MJ : opérateurs et demandes, réponse privée, arbitrage,
saisie de test, révocation, dossiers, protocoles configurables, réglages
et compte à rebours fictif.
Un refus de piratage déclenche sept secondes de contre-mesures : halo discret
sur le pourtour et balayage ralenti à 3,5 s si CRT est activé, grain léger
et très courts décalages d'un pixel si Parasites est activé. Le texte de refus
reste fixe et net ; les effets de succès conservent leur intensité.
Le bandeau de résultat reste visible en bas
du journal ; seuls ses messages défilent, les surcouches restent sur le cadre.
Un changement de vue rejoint une séquence encore active à son instant courant,
sans prolonger sa durée ; une séquence expirée ne se rejoue pas au montage.

Les effets CRT et l'animation de piratage sont isolés dans la feuille du
module ; le mouvement réduit neutralise cette animation. Le son est créé
uniquement après clic sur cet appareil et son contexte est fermé au démontage.
Les minuteries et animations sont également libérées. L'hôte devra démonter
la vue lors d'une révocation, déconnexion ou sortie du contexte autorisé.
Le changement de PJ remet la saisie et le dialogue affiché à zéro.

Le rendu React est une nouvelle présentation du même moteur : il ne reprend
pas toutes les animations de texte et de bruit du prototype. Le compte à
rebours manuel est visuel ; le protocole d'autodestruction a sa sirène et ses
annonces vocales sur le seul appareil choisi. La suppression et le classement des dossiers et
la file de plusieurs demandes restent les améliorations prévues au plan ;
le fonctionnement actuel conserve une demande en attente par opérateur.

Dans **Dossiers → Nouveau dossier…**, renseigner l'identifiant de lecture,
le titre, le contenu et la protection, puis **Créer le dossier**. Le dossier
créé est sélectionné et reste modifiable. L'identifiant est ensuite fixe ;
la commande `READ identifiant` est rappelée dans le formulaire. Les exemples
existants sont conservés. Un doublon d'identifiant (même avec une autre casse),
un code réservé à un protocole ou le dépassement de 256 dossiers est refusé.

Les champs **Code du protocole**, **Code du dossier** et **Mot de passe administrateur** ont un bouton
**Afficher / Masquer** dans le poste MJ, comme dans le prototype. Afficher
le code ne soumet pas le formulaire et conserve sa casse et ses zéros.
Changer de dossier/protocole ou quitter le panneau le remasque ; ce réglage
d'affichage n'est pas sauvegardé. Les commandes sensibles du joueur restent
masquées dans la saisie et le journal.

## Protocoles et autodestruction

Le panneau **Protocoles** permet de créer, modifier, désactiver et supprimer
les codes d'action et messages type. Les effets sont fermés : message seul,
ouverture/fermeture des portes fictives, départ/annulation d'autodestruction.
Les codes ne peuvent entrer en collision avec ceux des dossiers. Les vues
joueur ne reçoivent ni la liste des protocoles ni leurs codes préparés.
Voir le [parcours d'utilisation](../../README.md) et ses quatre exemples.

L'autodestruction transforme le cadre et ajoute une alerte avec gros décompte
et lecture du [film fourni par David](../../medias/README.md).
Une date de fin commune fait autorité ; retaper le code ne reporte pas cette
date. La durée effective est le maximum de la durée préparée et des 775,701 s
du film complet, choix explicite de David. Le code d'annulation et le bouton MJ interrompent la séquence. À zéro,
la sirène s'arrête sans action sur les fiches ou personnages.

`video-alerte.js` gère la lecture commune : même instant de départ, reprise
au temps écoulé, vidéo muette hors appareil choisi, sans boucle. Sa bande-son
a la priorité sur `alarme.js` ; à la fin ou en cas d'erreur, la sirène et les
annonces reprennent si l'échéance n'est pas passée. Les contrôles de terminal
restent disponibles. Une lecture bloquée propose un bouton de reprise.
Le retrait d'accès ou la déconnexion, via le démontage de la vue par l'hôte,
arrête la lecture, coupe le son et libère la source. Aucun chemin provenant
du pilote ou d'un joueur n'est utilisé pour choisir le fichier.

`alarme.js` est partagé avec le prototype autonome. Sur l'appareil choisi,
après activation locale du son, il synthétise une sirène et annonce le temps
restant au départ et chaque minute. Les minutes manquées ne se rejouent pas.
Il sélectionne seulement une voix française `localService`, attend au besoin
`voiceschanged` et signale l'absence de voix locale. Transfert de diffusion,
annulation, démontage et arrêt local coupent les ressources et la parole.

## Essayer et vérifier sans serveur

Depuis la racine du dépôt, sans installer de paquet :

```powershell
node outils/modules-du-jeu/valider.mjs outils/alien/modules/muthur/manifeste.json
node --test outils/alien/modules/muthur/verification.mjs outils/alien/modules/muthur/verification-vues.mjs outils/alien/modules/muthur/verification-protocoles.mjs outils/alien/modules/muthur/verification-video.mjs outils/alien/modules/muthur/verification-configuration.mjs outils/alien/verification-detecteur.mjs outils/modules-du-jeu/verification.mjs
node outils/alien/modules/muthur/apercu.mjs
```

Le dernier appel produit `scratch/muthur-v1/apercu.html` et sa vidéo voisine, à ouvrir directement
dans un navigateur. Il démarre avec des données de démonstration et
fait fonctionner les deux composants avec leur vrai moteur. Il sauvegarde
la préparation du MJ dans ce navigateur, sans connecter aucun appareil. Garder
le HTML et le WebM ensemble pour déplacer cet aperçu. Les boutons Vue joueur
et Poste meneur permettent d'essayer le dialogue dans cet atelier partagé.
Ce fichier n'est pas une vue privée destinée aux joueurs d'une vraie table.

### Retrouver sa préparation à la prochaine ouverture

Dans **Poste meneur**, le bandeau **Préparation : réglages, dossiers et codes**
indique si la sauvegarde automatique a réussi. Chaque réglage, création ou
modification de dossier et enregistrement/suppression de protocole est
conservé dans `localStorage`, sous `gmos:alien:muthur:configuration:v1`.
Rouvrir le même aperçu avec le même navigateur et le même profil restaure
la préparation. Changer de navigateur, effacer ses données ou déplacer la
page peut nécessiter de réimporter une copie.

**Exporter la configuration** télécharge `muthur-configuration.json`.
Ce fichier permet de garder plusieurs préparations ou de changer de poste.
Il contient les codes, le mot de passe administrateur, les dossiers et les
messages type : c'est un fichier pour le MJ. La vidéo reste un fichier séparé.
**Importer une configuration** vérifie le JSON et sa version, montre le
vaisseau et le nombre de dossiers/protocoles, puis attend **Remplacer la
configuration**. Annuler ou choisir un fichier invalide conserve la
préparation actuelle. Un import remplace toute la préparation, sans fusion.

Les dialogues, opérateurs de séance, portes, décomptes, vidéo et choix de
diffuseur ne font pas partie de cette sauvegarde : l'atelier réinitialise sa
démonstration à l'ouverture ou à l'import. Un stockage refusé ou plein est
signalé ; l'export reste disponible. Une copie locale illisible est conservée
et sa réécriture automatique suspendue jusqu'à un import valide confirmé.

`configuration.mjs` décrit ce format portable v1 ; `atelier.mjs` possède le
stockage de l'aperçu. Les vues et le moteur du module n'accèdent pas au
navigateur : la persistance par campagne du futur hôte reste à implémenter.

Avec les navigateurs Playwright déjà présents, `apercu.mjs --capturer` produit
66 captures (joueur, quatre panneaux MJ, nouveau dossier et alertes du module
et de l'atelier autonome à 360, 390 et 1 180 px, plus huit combinaisons
CRT/parasites à 390 et 1 180 px, deux vues de sauvegarde/import et onze vues
de piratage : les quatre combinaisons d'effets aux deux tailles, mouvements
réduits, succès et prototype autonome, plus six vues de codes affichés dans
les deux interfaces aux trois tailles, six vues du mot de passe affiché et
six vues du détecteur autonome aux proximités 0/50/100 à 390/1 180 px).
Il vérifie aussi la création effective des dossiers, les interrupteurs
d'effets, les mouvements réduits, la reprise après rechargement et réouverture,
l'export/import, les échecs de stockage, les effets d'un refus réel et les
positions réellement dessinées du détecteur autonome. Il utilise
un navigateur hors ligne sans ouvrir de serveur ; les images vont dans
`scratch/`, ignoré par Git. Les essais serveur emploient seulement `request()`
avec des fichiers temporaires fictifs, sans appeler `listen`.

Les essais locaux ne valident pas l'identité du Hub, le transport ciblé,
la persistance de campagne ni les tablettes physiques : ces points attendent
l'intégration. La qualité sonore reste à juger sur le matériel de la table.

**Vérifié le 15/10 :** manifeste conforme ; 70 essais verts (20 moteur/serveur,
20 composants, 10 protocoles/alarme, 6 lecteur vidéo, 3 configuration, 3 détecteur, 8 standard) ; syntaxe Node, types publics et lint ciblé propres.
Soixante-six captures produites hors ligne, sans débordement horizontal ni erreur de
navigateur ; vues téléphone et pupitre relus visuellement.

Depuis le 16/10, HACK produit immédiatement un brouillage fort de cinq secondes,
puis attend le MJ. Le signal `cue` garde sa forme existante : pendant le départ,
son identifiant est celui de la demande HACK encore en attente ; l’arbitrage crée
un nouvel identifiant pour son résultat. Aucun changement de format de sauvegarde.
L’échéance autoritaire empêche de prolonger l’effet par une répétition de HACK ou
un changement de vue ; restauration et arrêt des effets effacent ce signal.
Les effets CRT/parasites restent indépendants et les mouvements réduits sont respectés.
