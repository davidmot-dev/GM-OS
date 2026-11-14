# Détecteur Alien : immobilité et orientation — spécification, 14/11/2026

> Demande de David (14/11) : « ok on va commencer », après la présentation des deux
> premières pistes du second examen de GM Codex : cibles immobiles et cône orientable.
> État : livré, à essayer par David — registre § 250. Module 0.5.0 / données v5,
> maquettes corrigées approuvées, T1–T8 vérifiées ; T9 reste l'essai physique.
> Origine : [Second examen du 11/11](2026-11-11-jets-demandes-et-caches.md#second-examen-1111--le-détecteur-de-mouvement-et-les-autres-outils-️-mis-de-côté).

## Le quoi

### Parcours proposés

1. Pendant l'exploration, Maman ouvre le plan privé du détecteur. Chaque pion montre son
   état de mouvement ; une commande directe permet de le rendre immobile ou de signaler
   qu'il bouge, sans rouvrir toute sa préparation. Un déplacement le remet en mouvement.
   Un pion immobile ne produit pas d'écho lors du prochain scan.
2. Maman active une détection directionnelle et choisit l'ouverture du cône. Le porteur
   du M314 se trouve toujours sur le plan privé ; ses coordonnées servent d'origine.
   L'orientation est manuelle, rapportée aux directions du plan, sans capteur du téléphone.
   Maman désigne explicitement le personnage de tablette qui peut orienter le M314 ; elle
   conserve toujours la main. Les autres destinataires voient le même instrument sans
   commande d'orientation.
3. Au scan du Tour, les mouvements à portée sont relevés et la batterie est testée une seule
   fois. Tourner ensuite le détecteur explore ce même relevé : aucun nouveau déplacement
   ennemi n'est révélé et aucun second paiement n'est demandé. Le joueur reçoit uniquement
   les échos dans le champ courant ; il ne reçoit pas le relevé complet pour le filtrer lui-même.
4. Maman peut garder une détection dans toutes les directions. La préparation actuelle,
   les préréglages et les anciennes campagnes restent utilisables après mise à jour.

### Critères d'acceptation proposés

- **C1** · Un pion peut être rendu immobile/en mouvement depuis sa ligne de jeu, sans changer
  sa zone ni ses pas dépensés. Son état est visible pour Maman — essai de moteur et d'écran.
- **C2** · Le prochain scan ignore les pions immobiles, trop petits ou hors de portée ; un
  déplacement remet le pion en mouvement. Le passage au Tour suivant garde sa règle actuelle
  de remise à zéro des mouvements — essais de moteur et régression A8.
- **C3** · Le cône se règle à la main, son cap et son ouverture sont lisibles ; le dessin du
  radar correspond à ce champ — essais géométriques et d'écran ; à essayer par David.
- **C4** · Seuls les mouvements dans le champ sont remis au joueur, y compris aux limites du
  cône, au passage du nord et pour une cible dans la zone du porteur. Ni plan, ni identité,
  ni position d'une cible hors champ ne fuit dans la projection — essais du moteur natif.
- **C5** · Tourner après un scan réutilise le relevé de ce scan ; un déplacement ou changement
  d'état ultérieur attend le prochain scan. Une rotation ne teste ni ne consomme la batterie
  et ne permet pas un second scan dans le même Tour — essais du moteur.
- **C6** · Seuls Maman et le personnage explicitement désigné peuvent orienter le détecteur.
  Les droits sont contrôlés chez le meneur ; les commandes invalides, les clients sans
  accès, un ancien porteur et les contextes périmés sont refusés — essais d'autorité et
  parcours réel entre meneur et Hub.
- **C7** · Anciennes sauvegardes et anciens préréglages gardent leurs zones, pions, batterie et
  réglages ; la migration conserve le dernier scan payé et ne crée pas de nouvel accès joueur
  — essais de migration/export/import.
- **C8** · Redémarrage et export/import conservent la préparation et l'état de séance ; le
  rappel d'un préréglage repart au Tour 1 selon le fonctionnement actuel — essais de sauvegarde.
- **C9** · Manuel Alien, captures, synthèse et registres distinguent les fonctions réalisées
  de l'essai physique restant à faire — vérification des liens et des captures.

### Hors champ proposé

- Gyroscope et HTTPS ; autres modèles d'appareils, brouillage, bricolage, anneau périphérique,
  nouveaux sons et dérive des échos.
- Ouverture automatique des modules par l'équipement (ancien lot 3).
- Modification des règles de portée et de batterie ; déplacement automatique des ennemis ;
  raccord aux états de santé du combat.
- Le cône est un réglage de mise en scène à faire approuver, aucune valeur d'angle n'est
  présentée comme une règle du livre sans vérification de sa source.

### Ce que David garde

Le plan, les pions et leurs états, le porteur, la batterie, le Tour courant, le dernier
scan payé, les préréglages et les nouveaux réglages d'orientation rejoignent la sauvegarde
privée du module et l'export de campagne. Les accès restent fermés au redémarrage/import,
comme aujourd'hui. Aucun fichier du profil de David ne sert aux essais.

## Décisions

- 14/11 — David : « ok on va commencer » → reprise des deux premières pistes du détecteur.
- 14/11 — David : « Le porteur et le meneur » → orientation manuelle partagée, sans gyroscope.
- 14/11 — David : « Oui, une commande rapide par pion » → une seule propriété `mobile`, sans
  nouvelle liste d'états mort/endormi/inconscient.
- 14/11 — David : « Non, GM-OS est fermé » → condition préalable aux modifications applicatives
  satisfaite, valable jusqu'au prochain essai.
- 14/11 — David : « Oui, tu peux les compléter » → compléments autorisés dans le registre
  général, le registre Alien, la synthèse et le document du 11/11 ; préserver leurs changements.
- Choix de réalisation proposés : nord en haut du plan, cap horaire de 0 à 359° ; ouverture
  45/90/180/360°, migration à 360° pour conserver les scans existants. Les rotations réutilisent
  les échos privés du scan, pas les positions actuelles des pions. Les cibles confondues avec
  l'origine restent visibles quelle que soit la direction.
- Une première génération Stitch a été refusée par la revue automatique : destination Google
  non explicitement autorisée pour les détails d'interface. Les deux
  [prompts complets](2026-11-14-alien-detecteur-prompts-stitch.md) sont prêts ; aucune nouvelle
  tentative avant réponse de David. **Accord reçu le 14/11 : « Oui, envoie ces prompts à Stitch ».**
- 14/11 — David : « Oui, intègre cette disposition corrigée » → les
  [deux maquettes](visuels/alien-detecteur-2026-11-14/README.md) sont adoptées avec les corrections
  consignées : habillage actuel, radar circulaire, aucun menu ajouté ni graduation inventée,
  aucune limite de batterie à 4/4. Autorisation de réalisation reçue.

## Constats vérifiés dans le dépôt

- `outils/alien/modules/detecteur/discret.mjs` possède déjà `mobile` et `detectable` sur
  chaque pion. Le scan exige les deux ; `deplacer-discret` rend mobile, `tour-discret`
  remet les mouvements à faux. Il s'agit de rendre ce geste accessible, pas de créer
  une seconde propriété d'immobilité contradictoire.
- `discret-vues.mjs` permet actuellement de changer « En mouvement actuellement » dans
  le formulaire « Préparer les pions cachés », mais la liste des déplacements n'a pas
  de commande rapide. Elle conserve les pas dépensés lors de la préparation.
- Le dernier scan contient ses échos et le reçu de batterie. `lectureDiscrete` donne
  seulement le scan du Tour courant ; les données privées restent retirées par `vuePour`.
- `moteur.mjs` et `manifeste.json` réservent toutes les commandes actuelles du détecteur
  au meneur. `porteurId` désigne un pion du plan, sans lien avec un personnage de tablette.
  Un droit donné au joueur devra donc avoir une attribution explicite par Maman.
- `electron/modulesDuJeu/service.ts` vérifie déjà rôle, accès, personnage, campagne et
  contexte avant mutation ; le moteur reçoit aussi la liste des personnages dans son
  contexte de table. Le Hub possède déjà un canal de commande : pas de transport à créer.
- `outils/alien/detecteur.js` dessine le même radar pour le module et le prototype autonome.
  Sa modification devra conserver l'usage sans orientation du prototype.
- Le module est actuellement en version **0.4.0**, données **v4**. Les formes sont validées
  strictement ; les nouveaux champs demanderont une migration, y compris des préréglages.
- Régressions utiles : `electron/modulesDuJeu/alienA8.test.ts`, `detecteur.test.ts`,
  `alienPrereglages.test.ts`, `src/modules/modulesDuJeu/detecteur.vues.test.tsx`,
  `outils/alien/modules/detecteur/verification.mjs` et parcours Electron Alien.

## Le comment

### Fichiers et réutilisation

- `outils/alien/modules/detecteur/discret.mjs` : commande rapide `mouvement-discret`
  avec pion, état et Tour ; ajout des réglages de champ et attribution du joueur porteur.
  Conserver `dernierScan.echos` comme relevé privé complet ; filtrer uniquement à la projection.
- `outils/alien/modules/detecteur/orientation.mjs` (neuf) : géométrie pure du champ, limites
  incluses, directions du plan, cible à l'origine, cercle complet. Réutilisée par la projection
  et le dessin pour éviter deux conventions d'angle.
- `moteur.mjs` : migration **v1–v4 vers v5**, validation des anciens schémas avant enrichissement,
  y compris les préréglages ; `vuePour` ne transmet que les échos visibles et un droit calculé
  d'orientation. Commande joueur limitée au cap ; champ, attribution et pions restent au MJ.
  Recevoir le contexte de personnages déjà fourni par le service pour valider l'attribution.
- `manifeste.json`, `moteur.d.mts`, `index.d.mts`, `exemple.mjs` : module **0.5.0**, données
  **v5**, commande d'orientation autorisée aux rôles MJ/joueur puis filtrée par le moteur.
  Corriger la déclaration historique de version du manifeste dans `index.d.mts` en même temps.
- `discret-vues.mjs` : bouton rapide par pion, état courant visible, attribution de la tablette
  au porteur dans les réglages privés ; conserver le formulaire complet de préparation.
- `vues.mjs`, `style.css`, `vues.d.mts` : contrôles de cap communs au porteur et au meneur,
  ouverture réservée au meneur ; erreurs de commande visibles et garde contre doubles envois.
  Réutiliser `envoyerCommande` et le canal du Hub existants, sans modifier leur transport.
- `outils/alien/detecteur.js` : dessiner le secteur, les repères et les seuls contacts transmis.
  Si aucun champ n'est fourni, garder le rendu du prototype autonome. Pas de nouveau thème.
- `README.md`, manuel `54-Jeu-Alien.md`, ligne pertinente du `53-Les-jeux-et-leurs-mecaniques.md`,
  registres et synthèse : gestes, migration, périmètre et captures réelles après livraison.

### Données : qui lit, qui écrit

| Donnée | Écrivain | Lecteurs et garde |
| --- | --- | --- |
| Plan, mouvements, porteur et attribution | Maman, via le moteur natif | Maman seule ; absents de la projection joueur |
| Cap partagé | Maman ou personnage explicitement désigné | Maman et destinataires autorisés ; moteur valide identité et commande |
| Ouverture du champ | Maman seule | Instrument ; aucune modification joueur |
| Relevé complet et reçu du scan | Moteur, au scan du Tour | Privés ; seule la projection filtrée est transmise |
| Sauvegarde de campagne | `ServiceDesModules`, écrit avant publication | Stockage privé et export/import existants ; aucun écrivain côté Hub |
| État d'envoi des contrôles | Composant monté | Éphémère ; ACK/erreur natifs, arrêt au démontage ; jamais une vérité persistée |

### Risques GM-OS (cochés)

- [x] Fenêtres multiples : le Hub commande le service natif ; il n'écrit pas les données de
  préparation et ne reçoit pas le relevé privé. Le stockage des modules a déjà un seul écrivain.
- [x] Chemin de données : aucun nouveau chemin et aucun `app.getPath('userData')`.
- [x] Tablette rechargée : le cap vient de la projection du service, pas d'un état local faisant foi.
- [x] Deux ports : réutiliser le canal des modules via SyncServer ; aucun service à créer.
- [x] Textes : le module externe possède ses libellés français comme ses autres contrôles ;
  tailles 360/768/1180 px, clavier, cible tactile et mouvement réduit à vérifier.
- [x] Échap/surcouches : contrôles permanents intégrés au panneau ; aucune nouvelle modale.
- [x] Sauvegardes anciennes : fixtures v1–v4 réelles, nouveaux réglages par défaut, scan payé
  conservé ; ancien préréglage sans plan toujours accepté.
- [x] Confidentialité : aucune cible hors champ ne traverse le réseau, y compris dans
  `tracker.positions`, les compteurs ou une copie du relevé complet.
- [x] Essais : uniquement profils jetables ; sauvegarder les captures suivies avant les e2e.

### Écran : prompts et références

[Prompts envoyés avec l'accord de David](2026-11-14-alien-detecteur-prompts-stitch.md), projet
Stitch privé `10111230835253923961`. Deux écrans générés et
[relus avec les corrections adoptées](visuels/alien-detecteur-2026-11-14/README.md).
David choisit ce dessin avant réalisation : « Oui, intègre cette disposition corrigée ».

Références existantes relues :
[plan du meneur](../User%20Guides/captures/jeu-alien-a8-plan-mj.jpg) et
[détecteur joueur 360 px](../User%20Guides/captures/jeu-alien-a8-detecteur-360.jpg).
Ce sont des captures de référence, pas des preuves des nouvelles fonctions.
Les captures de départ Playwright sont conservées dans `visuels/alien-detecteur-2026-11-14/avant/`.
Les six captures finales de l'application sont au [manuel Alien](../User%20Guides/54-Jeu-Alien.md),
distinctes des maquettes.

### Essais prévus

- Géométrie et moteur : `node --test outils/alien/modules/detecteur/verification.mjs
  outils/alien/verification-detecteur.mjs` ; ajouter des cas ciblés pour champ et migration.
- Autorité, sauvegarde et écrans : `npx.cmd vitest run --maxWorkers=4
  electron/modulesDuJeu src/modules/modulesDuJeu src/components/hub/HubModulesDuJeu.test.tsx`.
- Validation du contrat par `outils/modules-du-jeu/valider.mjs`, lint ciblé et
  `npx.cmd tsc -b` ; `npm.cmd run build` avant Playwright.
- Nouveau parcours **A11 dans `e2e/modulesDuJeuAlien.spec.ts`**, qui réutilise ses vrais
  Electron/HTTP/WebSocket et ses profils jetables : porteur, autre destinataire,
  rotation, changement de porteur, refus des anciens droits, reconnexion, dernier scan
  conservé et captures aux trois tailles. Aucun profil de David.
- Contrôle du manuel `electron/manuelDesJeux.test.ts` et liens des documents modifiés.

## Tâches

- [x] **T1** · Obtenir le dessin approuvé et prendre les captures de départ en profil jetable —
  couvre C3 ; contrôle : maquettes et captures relues, choix de David consigné. Aucun `src/`
  ni `electron/` modifié à cette étape. **Fait le 14/11 :** deux écrans approuvés ; build puis
  Playwright A8 **1/1**, captures dans `visuels/alien-detecteur-2026-11-14/avant/`.
- [x] **T2** · Ajouter schéma v5 et migration des états/préréglages v1–v4, déclaration et exemple —
  couvre C7/C8 ; essai : fixtures historiques, scan payé, rappel/remise à zéro et données invalides.
- [x] **T3** · Ajouter la commande rapide de mouvement en réutilisant `mobile` — couvre C1/C2 ;
  essai : budget inchangé, prochain scan, déplacement et Tour suivant. Moteur externe uniquement.
- [x] **T4** · Filtrer le champ à la projection du relevé figé — couvre C3/C4/C5 ; essai : tous
  azimuts, limites, nord, origine, cibles privées absentes des positions et compteurs ; aucun
  deuxième scan ni paiement après rotation. Moteur externe et rendu partagé.
- [x] **T5** · Autoriser seulement le porteur désigné à tourner, garder les autres commandes MJ —
  couvre C6 ; essai : charge usurpée, ancien porteur, accès retiré, contexte périmé et disque en
  erreur. `electron/` ⛔ : raccord dans `registre.ts` pour transmettre le contexte des personnages ;
  le service et le transport existants sont réutilisés.
- [x] **T6** · Intégrer les contrôles approuvés, l'état de mouvement et le secteur dessiné —
  couvre C1/C3/C6 ; essai de formulaires, erreurs, clavier, 360/768/1180 px et mouvement réduit.
  Essais `src/` ⛔ ; interfaces externes dans `outils/`.
- [x] **T7** · Vérifier le parcours réel et la conservation du relevé au rechargement — couvre
  C4/C5/C6/C7/C8 ; Playwright dédié et régressions des modules, après types/lint/build.
  Scénario ajouté au fichier e2e existant ; captures relues ; profils jetables seulement.
- [x] **T8** · Reporter la livraison et ses preuves au manuel, registres et synthèse — couvre C9 ;
  essai du manuel et liens, captures réelles distinctes des maquettes. Commit demandé ensuite le 14/11.
- [ ] **T9** · Essai par David : manipulation tactile du cap, échos dans le champ, commande rapide
  d'immobilité puis scan suivant — couvre C1/C3/C6/C9 ; **à essayer par David** après livraison.

## Analyse

- 14/11 — **9 critères, 9 tâches** ; C1→T3/T6/T9, C2→T3, C3→T1/T4/T6/T9,
  C4→T4/T7, C5→T4/T7, C6→T5/T6/T7/T9, C7→T2/T7, C8→T2/T7, C9→T8/T9.
- Écarts repérés et traités dans le plan : l'immobilité existe déjà ; le porteur du plan n'est
  pas un personnage de tablette ; le radar dessiné est partagé avec le prototype ; le scan
  est un relevé par Tour, il ne faut pas le recalculer à partir des pions lors d'une rotation.
- Aucune question de périmètre ouverte après les quatre réponses de David. Les réglages
  détaillés sont exposés dans les prompts, soumis au choix du dessin.
- Aucun fichier applicatif du plan n'est modifié par un autre écrivain au `git status` du 14/11.
  Les quatre documents partagés le sont ; David autorise de les compléter sans écraser leur état.
- **T2–T6 vérifiées le 14/11 :** 23 nouveaux essais natifs (géométrie, migration, autorité,
  sauvegarde), deux nouveaux essais de contrôle dans les 12 essais de vue. Commande de
  régression des modules ci-dessus : **242 essais / 29 fichiers**, sans échec. Vérifications
  autonomes **7/7**, manifeste conforme, types et lint ciblé réussis.
- **Premier A11 réel : 1/1** (39 s), deux Hub, captures 360/768/1180 px, porteur changé,
  commande de l'ancien porteur refusée par WebSocket, rotation au clavier, reconnexion puis
  redémarrage Electron avec sauvegarde du scan payé. Un libellé accessible du sélecteur a été
  précisé après le premier passage ; les 12 essais d'écran ont été repris et passent.
- **T7 vérifiée :** A11 final et préréglages des trois modules **2/2** (58 s), A8 et
  scan partagé/reprise/import **5/5** (2 min 10), soit **7 parcours distincts**. A11 vérifie
  l'absence de débordement à 360/768/1180 px et la cible des boutons ; capture finale après
  espacement des états des pions. Profils jetables uniquement.
- **T8 vérifiée :** six captures finales relues et référencées au manuel 54, mécanique au 53,
  synthèse **11 verts / 1 orange / 0 rouge**, registres et reprise actualisés. Contrôle du
  manuel **28/28**. Le corpus modifié par l'autre travail reste intact.
- **Reste :** T9, essai physique de David. La suite générale des autres domaines n'est pas
  relancée pour ce lot ; périmètre des essais indiqué ci-dessus. Commit demandé le 14/11
  (« commit »), sans push ; aucun essai physique supplémentaire déclaré par cette demande.
