# LCARS — passerelle complète en test

Atelier **0.3.0**, données **v2**, contrat de module **v1**. LCARS classique TNG / DS9 /
Voyager, avec les sept postes et leur contrôle MJ. Il s’agit d’un module immersif : les
conséquences et résultats sont décidés par le MJ, sans calcul automatique des règles de vaisseau.

## Ouvrir

```powershell
node outils/star-trek/lcars/apercu.mjs
```

Puis ouvrir [l’atelier HTML](../../../scratch/lcars-v1/apercu.html) dans un navigateur.
Le chemin de l’aperçu reste `scratch/lcars-v1/` pour conserver le même point d’entrée.
L’HTML contient ses scripts et styles ; aucun serveur ni installation n’est nécessaire.

**Vue de test** permet de choisir :

| Officier | Consoles initiales |
| --- | --- |
| T’Len | Science, Médecine |
| Mara Chen | Commandement |
| Ilya Voss | Ingénierie, Navigation |
| Rin Sol | Communications, Tactique / sécurité |
| Officier de test | Les sept postes |
| Meneur de jeu | Tous les contrôles MJ |

Commencer par **Officier de test** pour parcourir les sept onglets. Le MJ peut modifier
chaque affectation et ajouter des officiers. Retirer un poste annule ses demandes encore
actives et invalide les commandes provenant de l’ancienne affectation ; les autres postes
de l’officier restent utilisables.

## Ce que fait chaque poste

| Console | Instrument distinct | Actions de l’officier | Contrôle MJ |
| --- | --- | --- | --- |
| Commandement | Journal de mission, posture de passerelle, compte de ses demandes et suivi des derniers ordres accessibles. | Demander une synthèse, proposer une alerte ; donner des ordres ciblés ou généraux et consulter leurs accusés. | Publier la situation, appliquer l’alerte et suivre les ordres. |
| Science | Capteurs polaires, spectre illustratif et catalogue des contacts. | Scan général ou analyse ciblée d’un contact révélé. | Révéler les contacts et transmettre les découvertes. |
| Ingénierie | Vue dorsale du vaisseau, circuit mis en évidence et tableau des systèmes. | Diagnostic, réparation et reconfiguration d’un système. | Décider du résultat et choisir explicitement le nouvel état du système. |
| Communications | Baie de canaux, oscillogramme et transcription de la dernière réponse privée du canal choisi. | Ouverture de canal, décodage et transmission d’un message. | Répondre dans le journal, débloquer la liaison et joindre un média. |
| Navigation | Carte quadrillée, trajet courbe et fiches des plans de vol. | Proposition de cap, évitement ou passage en distorsion. | Valider la manœuvre et l’état de l’itinéraire. |
| Tactique / sécurité | Périmètre en secteurs, enveloppe défensive et réticule de contact. | Identification, verrouillage proposé et intervention. | Décrire la cible et décider des conséquences. |
| Médecine | Dossiers latéraux, repère anatomique et observations cliniques. | Diagnostic, analyse biologique et traitement proposé. | Envoyer le rapport privé et modifier l’état du patient ou de l’échantillon. |

Cliquer un système, canal, itinéraire, contact ou dossier sélectionne la cible du formulaire.
Changer la cible dans le formulaire sélectionne aussi sa fiche dans l’instrument. Chaque poste
possède son titre, ses repères, sa disposition et son formulaire d’intention. Sur grand écran,
instrument et formulaire sont côte à côte ; sur tablette étroite et smartphone, ils s’empilent.

Les descriptions et états sont qualitatifs, éditables par le MJ. Les dessins, positions,
circuits, spectres et signaux sont des illustrations, sans mesure ni simulation physique.
Choisir une fiche ne change pas son état et ne déclenche ni traitement médical ni verrouillage.
Les bonus, jets, dépenses, dégâts et effets médicaux de Star Trek Adventures ne sont pas automatisés.

## Interventions et rapports

1. Choisir un poste, une cible et une action, puis décrire l’intention.
2. Cliquer **Transmettre l’intervention**. Le traitement dure 2,6 secondes (balayage Science,
   impulsion sur les autres schémas, statut au Commandement), puis l’attente
   du MJ reste visible. La fin de l’animation n’annonce jamais une réussite.
3. Passer au **Meneur de jeu → Demandes**. Filtrer par poste et choisir la demande.
   Le MJ peut la prendre en charge ou indiquer qu’un jet doit être résolu.
4. Utiliser le rapport préparé ou écrire une réponse ; accepter/refuser, autoriser ou non
   le partage et choisir, si souhaité, l’état résultant. Une pièce jointe est facultative.
5. **Transmettre le rapport privé**, puis retrouver l’officier concerné. Lui seul le voit.
   **Partager à l’équipage** apparaît si le MJ l’a autorisé. Les autres reçoivent le rapport,
   jamais la question privée. Une demande peut être annulée par son auteur avant résolution.

Un refus contient une explication, sans appliquer d’état de réparation. Une réponse déjà
publiée ne change pas quand on modifie le modèle préparatoire. L’historique du MJ permet
d’archiver les demandes résolues après confirmation ; cela conserve les rapports déjà partagés.

En **Diffusion**, le MJ peut aussi publier directement un rapport à un ou plusieurs postes,
ou à tout l’équipage, sans demande préalable. Il peut retirer une publication ; si elle provenait
d’un partage d’officier, le partage de cette source est alors révoqué. Cela n’efface pas une
information déjà lue ou copiée.

## Ordres

Au **Commandement**, écrire l’ordre et choisir ses destinataires. L’officier destinataire
peut **Accuser réception**. L’auteur et le MJ voient qui l’a lu. L’accusé signifie seulement
« ordre lu » ; une intervention et son arbitrage déterminent son exécution.

## Préparer les situations

**Préparation** permet de créer, modifier, révéler/masquer et supprimer les éléments de
chaque poste : contacts, systèmes, canaux, routes, cibles tactiques et dossiers médicaux.
Le rapport préparé reste privé au MJ. Supprimer un élément annule ses attentes et conserve
les instantanés des réponses déjà reçues.

**Préréglages** contient trois situations fictives initiales. On peut en enregistrer de
nouvelles, les renommer/mettre à jour et les supprimer. **Appliquer ce préréglage** remplace
la situation, le niveau d’alerte et les états/visibilités mémorisés des éléments toujours
présents. Affectations, demandes et rapports restent conservés. Les effets sont arrêtés :
charger un préréglage ne lance pas une sirène automatiquement.

## Alertes, son et médias

Le MJ publie une alerte normale, jaune ou rouge, une consigne et éventuellement un décompte
de 1 à 3 600 secondes. À zéro, la sirène s’arrête ; le récit n’est pas automatiquement résolu.
**Arrêter les effets** coupe les balayages, l’alarme, les annonces et le diffuseur, et retire
le décompte actif. Le niveau d’alerte et les rapports restent conservés.

Dans la vue choisie pour le son : cliquer **Activer le son**, puis **Diffuser l’alarme ici**.
Le moteur n’autorise qu’un diffuseur à la fois. **Annonces vocales** ajoute le niveau d’alerte
et les changements de minute via une voix française du navigateur, si disponible. Aucun son
n’est activé automatiquement. Les mouvements réduits conservent une visualisation fixe.

Pièces jointes : images PNG/JPEG/WebP, audio MP3/OGG/WAV, vidéo MP4/WebM, jusqu’à **4 Mo par
fichier**. Elles sont intégrées dans le JSON de l’atelier ; pas d’URL distante ou de contenu
HTML/SVG actif. Le décodeur du navigateur doit prendre en charge le format. Une lecture
impossible est signalée et laisse le rapport textuel accessible. La lecture est volontaire,
avec son réservé au diffuseur après activation locale ; les autres vues gardent la vidéo muette.

Changer de rôle dans cette page démonte la console précédente et ferme son audio. Le
sélecteur simule des appareils ; il ne maintient pas un diffuseur distant en arrière-plan.
Le transfert sonore réel entre plusieurs appareils attend le raccordement au Hub.

## Sauvegarde et reprise

Les changements sont enregistrés automatiquement dans ce navigateur, sous
`gmos:star-trek:lcars:atelier:v2`. Recharger restaure la préparation, les affectations et
les historiques, avec décompte, diffusion sonore et animations arrêtés. Le navigateur peut
refuser le stockage pour une page locale ; le bandeau l’indique. En cas de quota plein,
l’état reste en mémoire et l’export demeure disponible. Les médias peuvent remplir ce quota.

Dans la vue MJ : **Exporter l’atelier** produit un JSON privé ; **Importer un atelier**
vérifie format, version et taille, puis affiche le contenu à remplacer et attend
**Remplacer l’atelier**. Annuler ou fournir un fichier invalide conserve la session.
Une copie locale illisible est conservée et son écrasement automatique suspendu jusqu’à
un import valide confirmé ou une réinitialisation explicite. **Recommencer la fiction**
demande aussi confirmation avant de remplacer les essais sauvegardés.

Les données v1 du premier prototype peuvent être importées dans une enveloppe LCARS v1 :
Science, contacts, rapports et partages sont migrés en v2. Une version inconnue est refusée.

## Portée du banc

Cet HTML embarque la fiction complète et donne volontairement accès au rôle MJ. Le choix
de rôle n’authentifie personne : ne pas distribuer cet atelier avec des secrets réels.
Les projections et permissions du moteur sont testées ; deux onglets ou appareils ne se
synchronisent pas. L’atelier n’est pas encore enregistré dans le pilote Star Trek ni le vrai Hub.

Le moteur expose les six fonctions du contrat : `creerEtat`, `validerEtat`, `migrerEtat`,
`appliquerCommande`, `vuePour`, `arreterEffets`. Les vues React reçoivent `vue`,
`envoyerCommande` et l’`horloge` serveur facultative. Les minuteries et lecteurs utilisent
la dernière référence horaire sans supposer l’heure de l’appareil identique à celle du MJ.
La liste de commandes et de rôles est dans `manifeste.json` ; `heritage-v1.mjs` sert uniquement
à valider les anciennes données pour leur migration.

Bornes : 16 officiers, 64 éléments, 32 demandes actives et 256 demandes au total,
256 publications, 128 ordres, 24 préréglages, état JSON limité à 16 Mo. Un dépassement est
refusé sans remplacer l’état précédent. L’atelier reste distinct des sauvegardes GM-OS.

## Vérifier

```powershell
node outils/modules-du-jeu/valider.mjs outils/star-trek/lcars/manifeste.json
node --test outils/star-trek/lcars/verification.mjs
npx.cmd eslint outils/star-trek/lcars
node outils/star-trek/lcars/apercu.mjs --capturer
```

Le banc utilise un navigateur déjà installé, des profils jetables, le réseau bloqué et
des sorties audio muettes. Les médias sont des fixtures générées localement. Les voix sont
simulées pendant les tests ; leur qualité et le comportement réel iPad/Safari restent à juger
sur le matériel. Aucun paquet, serveur, campagne personnelle ou application GM-OS n’est utilisé.

La recette couvre les sept instruments, leurs sélections liées aux formulaires et les 19 actions,
l’arbitrage, les permissions et transferts,
les rapports ciblés/partagés, les ordres et accusés, le CRUD, les préréglages, les mouvements
réduits, les médias, l’audio et la sauvegarde/import. Les images restent dans `scratch/lcars-v1/`.
Le scénario d’ensemble et les limites du prototype figurent aussi dans la
[note d’analyse](../../../documentation/Planning/2026-10-16-analyse-lcars-star-trek.md).

**Validation du 16/10 :** manifeste conforme, **34 tests Node**, lint ciblé et compilation
locale propres ; recette complète du navigateur et **42 captures** à 390, 1 024 et 1 280 px,
avec contrôles supplémentaires à 360 px, sans débordement ni erreur JavaScript. Les sept
instruments tablette ont été relus, ainsi que quatre instruments smartphone et deux vues
complètes grand écran. Les animations respectent les mouvements réduits.
La vidéo de recette est encodée sur une page sans horloge simulée, car le codec travaille
en temps réel. Le son réel reste muet vers les enceintes et les voix sont simulées.
