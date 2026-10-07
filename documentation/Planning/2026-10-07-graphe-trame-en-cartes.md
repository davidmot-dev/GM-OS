# Le graphe de la Trame en cartes — plan d'exécution

**Préparé le 2026-10-07**, à la demande de David : « fais moi un plan exacte ».
Chantier du registre **§ 124**, après la clôture des tablettes.
**Statut : plan préparé ; développement et installation non commencés.**

## 1 · Résultat attendu

Dans **Trame narrative → Graphe**, représenter les actes, scènes et leurs renvois
par des cartes lisibles, avec des flèches courbes et l'inspecteur du nœud à droite.
Le meneur continue d'utiliser les niveaux, filtres, constats, liaisons et actions
d'édition actuels. Les quatre thèmes du PC et leurs personnalités habillent le graphe.

La référence visuelle réellement présente et regardée est
[`screen.png`](../../stitch/trame/stitch_syst_me_design_bureau_modulaire/gm_os_trame_narrative_graphe/screen.png).
Son [HTML](../../stitch/trame/stitch_syst_me_design_bureau_modulaire/gm_os_trame_narrative_graphe/code.html)
sert de référence graphique. Le chemin abrégé `stitch/trame/trame-graphe.png`
cité historiquement au § 124 n'existe pas dans cette copie du dépôt.

La maquette guide la composition, avec trois corrections obligatoires : titre
lisible sur les cartes, inspecteur dans une colonne qui réserve sa place, contenu
issu des véritables données. Les mentions inventées de Stitch (« ID : SCN-0314 »,
« Verrouillage édition », « Session live #42 », « + Ajouter une sortie ») ne sont
pas des fonctionnalités à implémenter. La sortie se crée par le mode **Relier**.

## 2 · Point de départ vérifié

| Élément | État réel et conséquence |
| --- | --- |
| Dessin actuel | `src/modules/session/components/trame/GrapheDeLaTrame.tsx`, 1 082 lignes : `ForceGraph2D`, dessin des nœuds sur canevas, détection des cibles par rayon. Le moteur de dessin est à remplacer. |
| Données du graphe | `logic/grapheDeLaTrame.ts` fournit sept types de nœuds et les liens d'appartenance, d'ordre, d'enchaînement et de renvoi. Ce calcul reste la source de vérité. |
| Niveaux | Six crans cumulatifs : Trame, Lieux, PNJ, Indices, Personnages, Ambiances. Niveau 2 par défaut. |
| Filtres | Toute la trame / sans optionnelles / intrigue principale, et masquage des scènes closes. Les constats se calculent sur la trame entière. |
| Rangement | `logic/rangementDeLaTrame.ts` : chaîne ou étoile, page ajustée aux proportions de la toile. Les pas de 190 × 84 et l'espacement des annexes sont adaptés aux points et titres actuels ; ils doivent intégrer les dimensions des cartes. |
| Positions | `Campaign.positionsDeLaTrame`, `noeudsEpinglesDeLaTrame`, `trameFigee` ; actions existantes dans `store/campaignSlice.ts`. Garder ces champs et leurs identifiants. |
| Restauration à caractériser | Le rendu actuel consulte un cache global `POSITIONS_VIVANTES` et les épingles ; il ne lit pas explicitement `positionsDeLaTrame`. Tester une réouverture dans un nouveau processus et un changement de campagne en G0, puis garantir cette restauration en G3. |
| Édition | Renommer, classer, commencer/rouvrir, terminer, changer d'acte/ordre, ajouter/retirer/nommer les enchaînements et supprimer avec confirmation passent déjà par les actions du magasin. |
| Filet existant | `e2e/grapheDeLaTrame.spec.ts` contient 14 tests, dont des gestes réels ; plusieurs ciblent le canevas et calibrent son zoom. Adapter les cibles sans retirer leurs assertions métier. |
| Dépendance envisagée | `@xyflow/react` absent de `package.json`. `react-force-graph-2d` reste nécessaire au graphe social des PNJ. |

## 3 · Conditions de démarrage

Le plan propose **React Flow (`@xyflow/react`) pour la Trame**. L'installation
attend l'accord explicite de David, exigé par `AGENTS.md`. Au démarrage, vérifier
les dépendances React, figer la version retenue et enregistrer `package.json`
avec son fichier de verrouillage. Aucune deuxième bibliothèque de rangement
n'est prévue : adapter le rangement GM-OS existant.

Avant de modifier `src/` ou `electron/`, demander **« GM-OS tourne-t-il ? »** et
attendre sa réponse. La fermeture de la session T5 ne couvre pas les essais T6
qui ont suivi. La préparation de ce plan ne modifie pas ces répertoires.

Les bancs emploient des profils jetables et une campagne fictive. Aucun accès aux
données de David ni lancement des bancs interdits (`vitrine`, `vitrineDuSocle`,
`campagnesEtThemes`, `profilageDesRendus`). Commit et push sur demande explicite.

## 4 · Architecture retenue pour le plan

Le magasin GM-OS détient les actes, scènes, renvois et positions enregistrées.
`grapheDeLaTrame` calcule la vue ; un adaptateur produit les nœuds et liens de
React Flow. Le moteur conserve uniquement son état d'affichage et les positions
pendant le geste. Les écritures repassent par les actions GM-OS existantes.

Fichiers prévus, relatifs à `src/modules/session/`, avec noms pouvant être ajustés
aux conventions lors du développement :

| Fichier | Responsabilité |
| --- | --- |
| `components/trame/GrapheDeLaTrame.tsx` | Orchestration, filtres, constats et appels aux actions. |
| `components/trame/ToileDeLaTrame.tsx` | Intégration React Flow, cadrage, zoom, sélection et événements. |
| `components/trame/CarteDeTrame.tsx` | Carte d'acte/scène et carte compacte des cinq types annexes. |
| `components/trame/LienDeTrame.tsx` | Courbe, flèche, condition et zone de clic du lien. |
| `components/trame/InspecteurDeTrame.tsx` | Panneau extrait de l'existant, avec les mêmes actions. |
| `components/trame/grapheDeTrame.css` | Règles locales utilisant les jetons du socle ; styles React Flow bornés à cette surface. |
| `logic/adapterLeGrapheDeTrame.ts` | Adaptation pure des objets GM-OS ; identifiants et coordonnées stables. |
| `logic/rangementDeLaTrame.ts` | Rangement existant adapté à des rectangles mesurables. |

Le remplacement reste dans l'onglet Graphe. Les fiches de l'arbre, la Forge,
le graphe social et les formats de sauvegarde restent les points d'appui existants.

## 5 · Lots dans l'ordre exact

| Lot | Travail | Sortie obligatoire |
| --- | --- | --- |
| **G0 · État témoin** | Capturer l'existant, vérifier les 14 scénarios et caractériser positions, campagne et gestes. | État de référence, défauts initiaux et captures consignés. |
| **G1 · Moteur et adaptation** | Installer le paquet autorisé ; brancher une vue contrôlée et l'adaptateur. | Les mêmes nœuds et liens apparaissent, sans écriture à l'ouverture. |
| **G2 · Cartes et flèches** | Construire les cartes, courbes, libellés, sélection et légende. | Composition conforme à la référence corrigée et lisible. |
| **G3 · Rangement et positions** | Adapter la géométrie, le cadrage et la conservation des positions. | Chaînes/étoiles sans chevauchement après Ranger ; positions conservées à la réouverture. |
| **G4 · Gestes et édition** | Rebrancher Relier, délier, glisser, rattacher, classer et actions de scène. | Les assertions métier historiques passent avec des gestes sur les cartes. |
| **G5 · Inspecteur et fini** | Stabiliser le panneau, les quatre thèmes, le clavier et les performances. | Aucun contrôle recouvert ; comportement vérifié avec une trame dense. |
| **G6 · Validation et documentation** | Rejouer la suite adaptée, compléter les scénarios, relire les captures et le guide 11. | Construction/types, tests et revue des captures consignés. |
| **G7 · Essai de David** | Éprouver le rangement et l'édition sur son poste avec ses usages. | David valide ; clôture du registre, commit/push s'il les demande. |

### G0 · État témoin

1. Construire la version courante, puis jouer `e2e/grapheDeLaTrame.spec.ts`.
2. Capturer une chaîne, une étoile, une sélection, une condition de liaison,
   un constat isolé et une vue filtrée vide ; base de démonstration seulement.
3. Ajouter aux fixtures une scène à titre long, un cycle d'enchaînements, deux
   campagnes et une trame dense d'environ 100 nœuds. Aucune extraction de campagne réelle.
4. Caractériser Figer → fermer l'instance → relancer sur le même profil fictif,
   les épingles après rechargement et le passage campagne A → B → A.
5. Archiver dans `documentation/Planning/graphe-trame/G0-reference/` les captures
   et résultats, avec les défauts initiaux explicitement distingués des régressions.

### G1 · Moteur et adaptation

1. Après accord, installer `@xyflow/react` ; charger sa feuille de style et
   borner la personnalisation au graphe de la Trame.
2. Produire un nœud par identifiant GM-OS et un lien par couple/nature. Les
   identifiants de lien ne dépendent ni du texte de condition ni de l'ordre du tableau.
3. Utiliser des positions **au centre des cartes**, avec `nodeOrigin=[0.5,0.5]`,
   pour garder le sens des coordonnées GM-OS enregistrées.
4. Séparer les objets du moteur des objets métier ; aucune mutation du graphe
   source et aucune sauvegarde du JSON interne de React Flow dans une campagne.
5. Vérifier campagne vide, scènes non classées, cibles absentes, changement de
   niveau et disparition d'un nœud choisi. Aucun nœud ou lien métier ne naît à l'ouverture.

### G2 · Cartes et flèches

1. Une scène affiche acte, état, rang dans l'intrigue, titre, lieu et nombres de
   PNJ/indices existants. Le panneau fournit le détail. Un champ absent reste absent.
2. Dimensions de départ : scène **260 × 144**, acte **260 × 80**, annexe **200 × 88**
   unités du graphe. Titres sur deux lignes, titre complet disponible au survol
   et dans l'inspecteur ; ces dimensions sont vérifiées avant de fixer la géométrie G3.
3. Afficher les états réels : à jouer, en cours, en pause, terminée ; une
   importance absente garde sa distinction, sans classement implicite.
4. L'enchaînement déclaré a une flèche et sa condition ; l'ordre reste discret
   et disparaît là où une sortie est déclarée, conformément à `ordreEstDessine`.
5. Les renvois portent le type concerné. L'appartenance reste discrète et peut
   être remplacée visuellement par le cadre d'acte rangé. Conserver les annexes
   partagées en un seul nœud et les orphelins visibles au niveau correspondant.
6. Choisir une carte met à jour l'inspecteur et son contour. Le panneau réserve
   sa largeur dans le flux ; il ne recouvre ni les cartes ni les flèches.

### G3 · Rangement et positions

1. Paramétrer les dimensions des cartes et les marges dans le rangement existant.
   Recalculer pas de chaîne, rayon d'étoile, annexes, orphelins et bornes de bloc
   à partir des rectangles ; vérifier les collisions, pas seulement les centres.
2. Calculer Ranger sur la **trame entière**, au niveau maximal et sans filtre.
   Respecter la règle chaîne/étoile et les proportions de la toile restante
   après réservation de l'inspecteur. Garder une écriture groupée des épingles.
3. Priorité de placement : épingle enregistrée ; position figée enregistrée
   quand le graphe est figé ; position locale de la campagne ; rangement calculé
   pour les nœuds encore sans position. Les positions de deux campagnes ne se mélangent pas.
4. Lire les anciennes coordonnées sans les déplacer ni les convertir sur disque.
   Une ancienne disposition serrée peut demander un nouveau Ranger : celui-ci
   reste explicite et confirme le remplacement des positions retenues.
5. Les déplacements gardent un état local pendant le geste. Enregistrer à la
   fin du glisser ; le déplacement clavier se valide à la fin de la séquence.
   Éviter les écritures persistées à chaque mouvement de pointeur.
6. Figer conserve un instantané ; Libre autorise le déplacement sans physique
   automatique ; Détacher retire l'épingle en gardant provisoirement la place
   affichée ; Réinitialiser efface les positions via l'action existante et repart
   d'un rangement déterministe. Ce dernier changement de comportement est à montrer à David.
7. Cadrer à l'entrée et après Ranger/Réinitialiser, une fois les cartes mesurées.
   Un clic de sélection, un changement de titre ou une frappe de condition ne
   doit pas recadrer la toile ni déclencher un rangement.

### G4 · Gestes et édition

| Geste | Comportement à conserver |
| --- | --- |
| Mode normal : clic sur carte | Sélection et inspecteur ; ouvrir la fiche demeure une action explicite. |
| Mode normal : glisser | Déplacement et épingle. Figer interdit le déplacement, tout en laissant zoom et lecture disponibles. |
| Déposer le centre d'une scène sur un acte | Confirmation, puis `rattacherSceneAUnActe` ; Annuler garde l'acte d'origine. |
| Déposer le centre d'une scène sur une autre | Confirmation, puis `placerLaSceneApres` ; décision fondée sur les coordonnées de la carte, quel que soit le zoom. |
| Mode Relier | Points d'accroche visibles ; déplacement des cartes et panoramique coupés pendant la liaison. La création n'altère aucune position. |
| Scène → scène | `ajouterUnEnchainement`, direction du geste conservée ; conditions éditables dans le panneau. |
| Scène ↔ annexe | `coupleDeRenvoi` puis `renvoiEcrit` et `modifierScene`, dans les deux sens ; lieu/ambiance unique remplacé avec le retour existant. |
| Acte ou couple incompatible | Refus expliqué, sans écriture. Un cycle de scènes n'est pas interdit d'autorité : conserver la règle métier actuelle. |
| Clic sur lien en Relier | Retrait du renvoi/enchaînement via les actions existantes. Les liens d'ordre/appartenance ne deviennent pas éditables. |
| Renommer, classer, commencer/rouvrir, terminer | Mêmes actions et mêmes conditions que les fiches ; journal et séance active conservés. |
| Supprimer | Confirmation GM-OS ; acte et scènes emportées selon les règles existantes. Désactiver la suppression automatique du moteur par Suppr/Retour arrière. |

Les champs, boutons et sorties d'une carte/panneau ne doivent déclencher ni
glisser ni panoramique (`nodrag`, `nopan`, `nowheel` selon l'élément). Une liaison
annulée ou un relâchement sur le vide termine proprement le geste.

### G5 · Inspecteur et fini

1. Extraire l'inspecteur en conservant titre, rang, actions, sorties et entrées,
   conditions, voisins, détachement et ouverture de fiche. Ne pas recréer les actions métier.
2. À 1 440 × 900 et 1 180 × 820 : panneau à droite, défilement propre et commandes
   visibles. À 900 × 700 : adapter le panneau pour garder une toile exploitable,
   sans débordement ni superposition ; la forme étroite se décide sur la capture.
3. Vérifier cyberpunk, médiéval, moderne et clair, chacun avec et sans personnalité.
   Utiliser les jetons/états du socle pour bordures, titres, sélection et halos.
4. Cartes nommées et sélectionnables au clavier, focus visible, instructions en
   français, saisies stables, Échap pour annuler Relier et fermer la sélection
   selon le registre des surcouches. Les champs conservent leurs touches d'édition.
5. Respecter réduction des animations et graphismes légers pour cadrage et relief.
6. Mesurer sur la fixture dense : aucune écriture de campagne lors du zoom,
   du panoramique ou d'une sélection ; une seule validation de position en fin
   de glisser ; absence de reconstruction des cartes à chaque pixel.

### G6 · Validation et documentation

**Le filet historique reste entier.** Adapter les 14 scénarios à des nœuds DOM
nommés et points d'accroche ; remplacer la calibration du canevas par les positions
des cartes et le zoom du moteur. Les actions se font par clic/glisser/clavier ;
les assertions lisent les changements dans le magasin GM-OS.

Ajouter au minimum les cas : position restaurée après relance, campagne A/B/A,
Ranger sans chevauchement chaîne/étoile/annexes, liaison sans déplacement, dépôt
confirmé et annulé au zoom différent, cycle, titre long, filtre sans mutation,
sélection supprimée, réinitialisation, clavier et suppression native neutralisée.
Tester les calculs purs d'adaptation, de positions et de géométrie ; conserver
les essais existants des renvois, enchaînements, curation et actions de campagne.

Captures finales : quatre thèmes × deux personnalités × trois formats, puis
cas dense, constellation, liens conditionnels et filtre vide. Relire chaque
planche ; ne pas assimiler le nombre de captures à une revue visuelle.

Commandes prévues, sur les paquets déjà installés au moment du développement :

```powershell
npx.cmd tsc -b
npx.cmd vitest run src/modules/session/logic src/modules/session/store --maxWorkers=4
npm.cmd run build
npx.cmd playwright test e2e/grapheDeLaTrame.spec.ts --reporter=list
npx.cmd playwright test e2e/curerLaTrame.spec.ts --reporter=list
npx.cmd playwright test e2e/capturesDuManuel.spec.ts --grep 'session-trame' --reporter=list
```

Ajouter les fichiers de tests du nouveau rendu à ces contrôles. Comparer le lint
ciblé à la base ; le lint global a un défaut préexistant de parcours, consigné au
§ 1 bis, et ne permet pas actuellement de conclure que tout le dépôt est linté.

Archiver les captures et résultats dans `documentation/Planning/graphe-trame/`,
actualiser le **guide 11**, son image du graphe, le registre et la note du jour.
Le hook NotebookLM synchronise le guide lors d'un commit autorisé. Avant un push
autorisé, laisser le hook complet vérifier types/tests/construction.

### G7 · Essai de David et clôture

David ouvre une trame, la range, suit un embranchement, édite une condition,
déplace une carte, rouvre l'écran et vérifie qu'il retrouve ses positions.
Il vérifie aussi lecture du titre, sélection, panneau et retour à la fiche.
Sa validation clôt le chantier ; son autorisation couvre les commits et le push.

## 6 · Critères de fin

- Les sept types de nœuds, six niveaux et filtres conservent leur sens.
- Les constats ne disparaissent pas à cause d'un filtre.
- Les cartes et liens se lisent sans chevauchement après Ranger ; l'inspecteur
  réserve sa place et les titres complets sont consultables.
- Les positions existantes restent lisibles ; les positions enregistrées
  reviennent après relance et ne passent pas d'une campagne à l'autre.
- Les actions modifient les mêmes champs que les fiches, avec confirmations conservées.
- Une liaison, un filtre, un zoom ou une sélection ne déplace pas la trame enregistrée.
- Les quatre thèmes, personnalités, clavier et préférences d'animation sont vérifiés.
- Tests, captures regardées, guide et registre actualisés ; essai de David validé.

## 7 · Références techniques vérifiées le 07/10

Les cartes React et leurs points d'accroche sont documentés dans
[Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes) et
[Handles](https://reactflow.dev/learn/customization/handles).
Les événements, l'origine des positions, le déplacement, le zoom et les touches
de suppression sont décrits dans la
[référence du composant ReactFlow](https://reactflow.dev/api-reference/react-flow).
La validation des liaisons est décrite dans
[Validation](https://reactflow.dev/examples/interaction/validation), et les zones
qui ne doivent pas déplacer la carte dans
[Utility Classes](https://reactflow.dev/learn/customization/utility-classes).
Ces capacités soutiennent la piste technique ; elles ne remplacent pas la
validation des règles GM-OS ni l'accord requis pour installer le paquet.
