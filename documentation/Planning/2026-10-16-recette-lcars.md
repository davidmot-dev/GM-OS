# Recette LCARS native — L7

David demande « fait L7 en automatique et ensuite commit et pousse (GM-OS est éteint) ».
Version du module : **0.5.0**, données v2, contrat v1. Le banc utilise des profils jetables,
une campagne fictive et deux clients Edge, sans pilote exporté ni campagne personnelle.
Le résultat logiciel et l’essai matériel sont consignés séparément.

## Rejouer automatiquement

```powershell
npm.cmd run build
$env:ELECTRON_RUN_AS_NODE = $null
npx.cmd playwright test e2e/modulesDuJeuStarTrek.spec.ts --reporter=list
```

Les serveurs Electron et les clients passent par les vrais HTTP/WebSocket, uniquement
sur les ports locaux de test 4100/4101. Les requêtes extérieures sont bloquées. Les sorties
audio sont muettes ; Web Audio et les décodeurs image/audio/vidéo restent réels, les voix
sont simulées. Aucun serveur personnel n’est démarré ni aucune dépendance installée.

| Parcours | Contrôle automatique |
| --- | --- |
| Préparation et accès | Import invalide/annulé/confirmé, équipage réel, postes distincts, accès séparés des affectations. |
| Échanges privés | Intervention, arbitrage, rapport privé, partage autorisé, ordre et accusé ; secrets absents des paquets de l’autre PJ. |
| Reprise et persistance | Doublon refusé, rôle MJ injecté refusé, reconnexion et restauration sur profil neuf ; effets et accès arrêtés. |
| Médias | PNG/WAV/WebM décodés, lecture MJ/PJ authentifiée, autre destinataire refusé, URL sans jeton, plages HTTP, retrait et export portable. Média indécodable signalé, texte conservé. |
| Son | Diffuseur MJ unique, activation locale, heure tablette +4 h, annonces selon l’heure serveur, transfert, vidéo muette ailleurs, suspension réelle et déconnexion sans rejeu. |
| Sept consoles / 19 actions | Chaque action proposée par le joueur puis qualifiée « Jet demandé » et arbitrée au vrai pupitre MJ. Un refus de réparation conserve l’état ; aucun résultat mécanique automatique. |
| Six formats | 360×800, 390×844, 768×1024, 1024×768, 1180×820, 1440×1000 ; absence de débordement horizontal, sélection liée au formulaire, commandes tactiles de 44 px. |
| Panne de vue | Projection invalide injectée localement au navigateur de test ; garde React visible, retour à la liste et réouverture après nouvel état. L’autre client reste utilisable. |

Les **42 captures de formats natifs**, les sept instruments et `bilan-l7.json` sortent dans
`scratch/lcars-natif/`. Ce JSON n’est écrit qu’après réussite du parcours des 19 actions.
Une capture d’instrument peut être rognée par le défilement du Hub sur téléphone : relire
les images avant publication au manuel. Les 42 captures de l’atelier sont un banc distinct.

Défauts corrigés grâce à cette recette : les écritures concurrentes du même cache média
échouaient parfois sous Windows ; une écriture est maintenant partagée entre lecteurs.
Une sortie de campagne pouvait aussi laisser l’ancienne vue à l’écran : le canal accepte
la fermeture vide du nouveau contexte avant la mise à jour publique, en conservant les
protections contre les anciennes révisions et les vues privées d’une autre campagne.
Ces deux cas ont d’abord été reproduits par des tests en échec, puis corrigés.

## Essai matériel sur une fiction jetable

Ces commandes préparent un essai volontaire ; l’automatisation ne lance pas cette répétition.

```powershell
node outils/modules-du-jeu/recette-lcars.mjs
npm.cmd run repetition -- scratch/lcars-recette/semence.json
```

Toujours passer **cet argument de semence** : sans argument, le script de répétition recherche
la dernière sauvegarde personnelle. La fiction préparée contient un pilote Star Trek de test,
Nel Varga et Idris Koa. Dans le pupitre LCARS, **Importer une préparation** puis choisir
`scratch/lcars-recette/preparation-lcars.json` et confirmer. Préparer les deux vrais personnages,
leur attribuer des postes et ouvrir leurs accès. Le profil et ses modifications sont supprimés
à la fermeture de la répétition ; les campagnes habituelles restent hors de cet essai.

Sur chaque appareil du même Wi-Fi : ouvrir
`http://ADRESSE-IP-DU-PC:4200/?window=tablet&sync=4200`, choisir un personnage puis
**Modules du jeu → LCARS — Passerelle**. Relever modèle, version du système et navigateur.
Choisir explicitement le diffuseur dans **Son : [appareil]**, puis activer le son sur celui-ci.

| Matériel | Système / version | Navigateur / version | Personnage / postes | Son choisi | Résultat réel |
| --- | --- | --- | --- | --- | --- |
| iPad | À relever | Safari, à relever | À choisir | À choisir | **Non testé** |
| iPad Air | À relever | Safari, à relever | À choisir | À choisir | **Non testé** |
| Tablette Samsung | À relever | Chrome ou Samsung Internet, à relever | À choisir | À choisir | **Non testé** |
| Smartphone | Modèle et système à relever | À relever | À choisir | À choisir | **Non testé** |

| Manipulation réelle | Résultat attendu | Relevé |
| --- | --- | --- |
| Portrait puis paysage, sept consoles | Instruments distincts, textes lisibles, retour Hub et boutons accessibles. | À faire |
| Clavier tactile ouvert | Saisir accents, apostrophes et une question longue ; formulaire et validation accessibles, sans doublon. | À faire |
| Rapport médical privé et média | Seul le destinataire le reçoit ; partage seulement après autorisation et geste volontaire. | À faire |
| Alerte sur deux appareils | Même décompte ; un seul son après activation locale ; voix française locale ou message d’indisponibilité. | À faire |
| Lecture MP4/WebM/MP3 sur chaque navigateur | Décodage réel ; vidéo muette ailleurs ; format incompatible signalé sans perdre le texte. | À faire |
| Transfert du diffuseur pendant lecture | Ancien son arrêté immédiatement ; nouveau média lancé volontairement. | À faire |
| Verrouillage / veille / changement d’application | Son coupé ou suspendu, activation locale demandée au retour ; pas de rattrapage des anciennes annonces. | À faire |
| Wi-Fi coupé puis rétabli | Vue fermée et sons arrêtés, reconnexion sans renvoyer la demande ; historique retrouvé. | À faire |
| Retrait d’un poste, d’un accès puis Tout couper | Droits retirés et médias arrêtés, autre personnage préservé lors du retrait partiel. | À faire |

Pour chaque défaut : appareil/version, poste, étapes précises, résultat attendu/obtenu,
capture et présence éventuelle du son. Le banc PC ne certifie ni le clavier système,
ni la veille Safari/Android, ni la qualité d’une voix ou du haut-parleur physique.
