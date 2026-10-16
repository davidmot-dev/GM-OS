# Intégrer LCARS dans GM-OS

**Plan du 16/10/2026 — L1 à L7 logiciel réalisées, version 0.5.0.** Demande de David :
« fais moi le plan pour inclure le module Star Trek dans GM-OS ».

Base : atelier LCARS **0.3.0**, données **v2**, contrat des modules **v1**, livré et poussé
dans **`bfde55f1`**. État du dépôt relu après **`cd2e826a`**. Le prototype et ses sept
instruments restent le point de départ ; on les raccorde à l’hôte commun existant.

## Résultat attendu à la table

1. Dans l’éditeur du pilote Star Trek, le MJ sélectionne **LCARS — Passerelle**.
2. Dans **Cockpit → Modules du jeu → LCARS**, il prépare le vaisseau, les éléments et
   les rapports, puis attribue une ou plusieurs consoles aux personnages de la campagne.
3. Il démarre la séance et ouvre LCARS aux personnages choisis. Chaque joueur trouve la
   carte LCARS dans **Tablet Hub → Modules du jeu**, avec uniquement ses postes.
4. Les interventions arrivent au pupitre MJ. Les réponses, ordres, accusés et états sont
   transmis aux bons destinataires. Le MJ garde la décision sur les conséquences.
5. Le MJ désigne un appareil de diffusion ; son utilisateur active le son localement.
   Les autres appareils conservent l’affichage visuel et les vidéos muettes.
6. La préparation est conservée par campagne et incluse dans les sauvegardes/exportations.
   Au redémarrage, les effets sont arrêtés et les accès attendent une réouverture du MJ.

Le périmètre reste une **passerelle immersive**, classique TNG / DS9 / Voyager. Les jets,
réserves, dégâts, boucliers et soins de Star Trek Adventures ne deviennent pas automatiques.
Un raccord mécanique ultérieur aura son propre périmètre et ses essais.

## Ce qui existe et ce qu’il faut adapter

| Élément vérifié dans le code | Conséquence pour le plan |
| --- | --- |
| Catalogue, éditeur de références et hôtes MJ/joueur déjà génériques | Enregistrer LCARS, sans créer un onglet Star Trek spécifique dans la navigation du Hub. |
| Registres natif et React encore limités aux deux modules Alien | Ajouter explicitement moteur, manifeste, vues et CSS LCARS. Aucun script chargé depuis un pilote. |
| `ServiceDesModules` connaît la campagne, la séance et ses vrais personnages | Utiliser ce contexte pour l’équipage ; ne jamais demander de recopier les identifiants à la main. |
| `preparerLecteur` n’est appelé aujourd’hui que lors de l’autorisation des joueurs | Prévoir aussi la préparation de l’équipage avant ouverture ; un simple ajout de manifeste ne suffit pas. |
| Stockage privé, exports/imports, projections ciblées et horloge serveur déjà présents | Les réutiliser et les éprouver avec les données LCARS ; ne pas ajouter un magasin navigateur de campagne. |
| Atelier à rôles fictifs, création manuelle d’officiers et sauvegarde locale | Conserver ces fonctions pour les essais ; les retirer du parcours de production. |
| Médias en base64 dans les rapports ; sauvegarde LCARS ≤ 16 Mo, hôte ≤ 32 Mo au total | Prévoir un traitement spécifique des médias et du volume cumulé, avant livraison complète. |
| Commandes joueur bornées à 64 000 caractères dans `SyncServer` | Garder de petites commandes ; les médias du MJ passent aujourd’hui par IPC, pas par cette limite joueur. |

Références : [contrat](../Architecture/Contrat-des-modules-du-jeu.md),
[analyse et prototype](2026-10-16-analyse-lcars-star-trek.md),
[guide LCARS](../../outils/star-trek/lcars/README.md).

## Les sept tranches

L1 à L7 logiciel sont réalisées ; la grille matérielle reste à renseigner sur les appareils.
Chaque tranche se termine par un résultat
essayable et des critères vérifiés ; on ne présente pas l’ensemble comme intégré dès L1.

### L1 — Enregistrer LCARS dans l’hôte commun

- [x] Ajouter le manifeste au catalogue et le moteur au registre natif, avec validation
  des états entrants et déclarations TypeScript des données, commandes et vues.
- [x] Enregistrer `VueJoueur` et `PupitreMJ` dans le registre React ; charger les styles
  isolés de LCARS et transmettre `horloge` comme aux instruments Alien.
- [x] Utiliser un état initial de production neutre : vaisseau à configurer, sans officiers
  fictifs, cibles de démonstration ou effet actif. `fiction.mjs` reste réservé aux essais.
- [x] Proposer LCARS au pilote dont le corpus résolu est `star-trek`, y compris un pilote
  personnalisé. Conserver une référence explicite `modulesDuJeu: [{ id: 'star-trek-lcars' }]`.
  Un ancien pilote n’est pas modifié automatiquement ; une liste vide reste un refus explicite.
- [x] Conserver ces références à l’export/import du pilote et fournir le parcours d’activation
  du pilote existant, sans modifier les exports personnels de David.

**Fichiers principaux :** `catalogue.ts`, `electron/modulesDuJeu/registre.ts`,
`vuesDuRegistre.tsx`, sources et déclarations de `outils/star-trek/lcars/`.

**Sortie :** LCARS est sélectionnable et son pupitre de préparation s’ouvre dans GM-OS.
Les tests du catalogue couvrent compatibilité, pilote personnalisé, référence absente et
liste vide. MU/TH/UR et le détecteur restent fonctionnels. Pas encore de recette multijoueur.

### L2 — Relier l’équipage aux personnages et aux accès MJ

- [x] Présenter au pupitre les personnages de la campagne à partir du contexte de l’hôte.
  Remplacer « Identifiant du nouvel officier » par une sélection de personnage.
- [x] Permettre la préparation des affectations avant la séance, sans ouvrir d’accès joueur.
  Étendre au besoin l’interface interne de l’adaptateur pour le contexte de campagne ;
  le serveur doit contrôler l’appartenance du personnage, pas seulement le formulaire.
- [x] Créer/synchroniser les officiers sans leur donner de poste par défaut. Préserver les
  affectations et historiques lors d’un renommage ou d’une nouvelle ouverture.
- [x] Distinguer les deux décisions : **accès à LCARS** dans l’hôte et **postes attribués**
  dans le module. Un accès seul ne donne pas les sept consoles. Sans poste, les rapports
  communs restent accessibles, conformément au moteur actuel.
- [x] Conserver les anciens auteurs pour leurs historiques si un personnage quitte la
  campagne, tout en interdisant ses actions et nouvelles affectations. Aucune suppression
  de rapport ou réattribution implicite à un autre personnage.
- [x] Rendre explicite la borne actuelle de 16 officiers préparés : pas de troncature
  silencieuse si la liste de campagne dépasse cette capacité.

**Sortie :** le MJ prépare deux personnages, leur attribue des postes différents et ouvre
LCARS en séance. Chacun voit les bons instruments ; aucun identifiant fictif ou saisi
manuellement n’intervient dans ce parcours. Réouvrir ne remet pas les affectations à zéro.

### L3 — Éprouver le vrai transport et la confidentialité

- [x] Remplacer la simulation de rôle par les identités réellement appairées, les générations
  d’accès et les commandes IPC/WebSocket de l’hôte. Les 19 actions gardent leur arbitrage MJ.
- [x] Vérifier les demandes simultanées, la qualification, la réponse privée, le partage
  autorisé, les ordres ciblés et les accusés de réception sur deux sessions joueur distinctes.
- [x] Vérifier les secrets dans les paquets réellement reçus : aucun rapport préparé,
  contact masqué, dossier médical ou demande d’un autre officier transmis par erreur.
- [x] Retirer un poste sans retirer les autres, puis retirer entièrement LCARS à un PJ :
  ancienne affectation/génération refusée, vue démontée, effets locaux arrêtés ; l’autre
  destinataire conserve son accès et ses effets.
- [x] Tester déconnexion, reconnexion, changement de personnage/campagne, fin de séance
  et « Tout couper ». Ne pas rejouer automatiquement une commande restée sans réponse.
- [x] Si deux appareils utilisent le même personnage, ils partagent ses droits et son
  historique ; la distinction entre appareils reste nécessaire au diffuseur sonore.

**Sortie :** un MJ et deux clients réels, hors du sélecteur de l’atelier, accomplissent
le parcours complet avec projections privées et révocations. Les essais existants d’Alien
servent de référence et de contrôle de non-régression.

### L4 — Sauvegarder par campagne et reprendre la préparation de l’atelier

- [x] Confirmer la présence de LCARS dans le stockage privé et les sauvegardes/exportations
  GM-OS existantes, sans l’ajouter aux campagnes diffusées publiquement aux joueurs.
- [x] Tester deux campagnes indépendantes, redémarrage, restauration, version inconnue,
  copie illisible et échec d’écriture. Conserver la version précédente si l’import échoue.
- [x] Arrêter les effets à la restauration, renouveler les générations et garder les accès
  fermés. Préparation et historique doivent survivre à la fermeture d’un pupitre.
- [x] Proposer au MJ un **import de préparation LCARS** depuis l’atelier : valider d’abord,
  montrer un aperçu, puis demander confirmation du remplacement de l’instance courante.
- [x] Importer par défaut vaisseau, éléments et préréglages ; ne pas intégrer les historiques,
  ordres, partages ou identités fictives de l’atelier aux personnages de campagne.
  Les affectations se refont sur les vrais personnages. Le fichier d’origine reste intact.
- [x] Conserver l’import complet d’une sauvegarde GM-OS comme chemin de restauration des
  véritables historiques, distinct de cet import de préparation.

**Sortie :** fermer et rouvrir GM-OS retrouve la préparation ; exporter/restaurer une
campagne conserve les vrais rapports ; importer l’atelier n’invente pas de personnages.

### L5 — Intégrer les médias privés sans grossir les projections

**Choix réalisé :** fichiers dérivés détenus par l’hôte et références de médias dans les
projections d’affichage. Le base64 **v2** reste la source portable dans le stockage privé,
les exports et le miroir de sauvegarde du MJ ; il n’est plus envoyé dans les vues joueur.
Cela conserve les sauvegardes existantes et évite une migration de schéma inutile. Le cache
est reconstruit à partir des octets validés s’il manque ou est corrompu. Le moteur reste pur.

- [x] Examiner la réutilisation du stockage et de la diffusion média existants. La route
  générique `/media/` et le lecteur vidéo Alien ne prouvent pas à eux seuls une autorisation
  par personnage/rapport ; ajouter le contrôle ciblé nécessaire aux pièces privées LCARS.
- [x] Vérifier l’accès au fichier au moment de sa lecture, selon la campagne, l’appareil,
  l’accès au module et les destinataires du rapport. Pas d’URL privée ouverte à toute la table
  ou conservée en cache public/service worker après révocation.
- [x] Conserver validation des formats et bornes, gérer lecture partielle/seek pour la vidéo,
  fichier absent, format non décodable et appareil hors ligne. Le rapport texte reste lisible.
- [x] Inclure les fichiers dans la sauvegarde/exportation et leur restauration. Un export
  JSON contenant seulement des références vers des fichiers locaux ne suffit pas.
- [x] Si le schéma des médias change, augmenter `versionDonnees` et migrer sur une copie.
  L’extraction des fichiers appartient à l’hôte ; le moteur reste sans accès disque/réseau.
  Ne pas remplacer la préparation tant que fichiers et état ne sont pas tous validés.
- [x] Mesurer le coût d’un rapport partagé avec image/son/vidéo, sans augmenter globalement
  les limites réseau pour contourner le problème.

**Sortie :** média privé lisible uniquement par le bon destinataire, partage/retrait
contrôlés et export/restauration réellement portable. Le texte peut être essayé avant L5,
mais les médias ne sont annoncés comme intégrés qu’une fois cette tranche validée.

**Ancres :** `electron/modulesDuJeu/medias.ts`, `ServiceDesModules.mediaPour`, route privée
de `SyncServer`, exclusion du dossier privé dans `MediaAccess`, lecteur authentifié dans
`commun.mjs`. Jetons éphémères dans les en-têtes, jamais dans les adresses ni les sauvegardes.
Contrôles après E/S et à chaque lecture ; `no-store`, route PWA `NetworkOnly`, URL blob révoquée
au démontage. Plages HTTP et seek vidéo disponibles. Un rapport test avec vidéo de **1 Mio**
passe de plus de **1,39 million de caractères** à **moins de 600** dans sa projection minimale.
Bornes inchangées : fichier 4 Mo, JSON LCARS 16 Mo, ensemble des instances 32 Mo.
Le miroir privé de sauvegarde MJ conserve son volume complet ; il ne passe pas sur le flux joueur.

### L6 — Raccorder alertes, audio et horloge sur plusieurs appareils

- [x] Fournir `choisirDiffusion` et `diffusionActuelle` dans l’adaptateur pour utiliser le
  choix d’appareil déjà présent au pupitre commun. Remplacer les noms « vue de test » et
  l’auto-désignation libre du prototype par ce parcours MJ ; garder l’activation locale du son.
- [x] Transmettre l’horloge du serveur aux scans, impulsions, décomptes et annonces.
  Tester une horloge de tablette volontairement décalée, la mise en veille et la reconnexion.
- [x] Couper immédiatement sirène, voix et médias lors du changement de diffuseur, de la
  révocation, de la déconnexion et de « Tout couper ». Le démontage d’une vue ferme son audio.
- [x] Éviter que les annonces LCARS annulent une synthèse vocale d’un autre outil GM-OS :
  l’appel global `speechSynthesis.cancel()` de l’atelier doit être coordonné avant intégration.
- [x] Ne pas promettre un haut-parleur actif en arrière-plan : dans le premier raccord,
  l’instrument du diffuseur doit rester ouvert. Le signaler et prévoir un état « son à activer »
  lorsque le navigateur suspend l’audio. Un lecteur permanent serait un chantier distinct.
- [x] Vérifier vidéos muettes chez les autres, mouvements réduits et absence de répétition
  des anciennes annonces au retour en ligne. Les lectures vidéo de rapport restent volontaires ;
  une lecture synchronisée sur tous les écrans n’est pas incluse implicitement.

**Sortie :** une alerte apparaît sur tous les écrans concernés, un seul appareil choisi sonne,
son transfert coupe l’ancien, et une tablette revenue après déconnexion ne rejoue pas la séquence.

**Ancres :** adaptateur `natif.mjs`, registre commun et `commun.mjs` ; `voix.mjs` coordonne
la synthèse avec les autres outils. Une voix française locale est nécessaire ; une voix
occupée reste prioritaire. Les annonces sont abandonnées si elles ne peuvent jouer au moment
prévu. Le banc décale l’heure de la tablette de quatre heures et avance l’heure serveur pour
éprouver les annonces ; il suspend réellement Web Audio. La veille matérielle reste en L7.

### L7 — Recette native, appareils et manuel

- [x] Créer une fiction de campagne dédiée aux tests et une recette
  `e2e/modulesDuJeuStarTrek.spec.ts` : vrai Electron et deux navigateurs appairés, profils
  jetables, sans données personnelles ni pilote exporté de David.
- [x] Couvrir les sept consoles et 19 actions, l’équipage, les secrets, le retrait d’accès,
  les commandes périmées, la reprise, les médias et le transfert sonore. Vérifier aussi
  qu’une panne d’un module laisse le retour au Hub disponible.
- [x] Exécuter les tests ciblés du moteur, du service, de la sauvegarde et des vues, puis
  la validation habituelle : types, lint, tests avec quatre workers, build avant les e2e.
  Ne pas lancer les suites qui lisent les campagnes personnelles.
- [x] Contrôler visuellement 360/390 px, portrait/paysage tablette et grand écran. Refaire
  les captures des sept instruments dans le vrai cadre Hub, au-delà des 42 captures de l’atelier.
- [x] Préparer une grille pour iPad, iPad Air, tablette Samsung et smartphone : Safari/Chrome,
  clavier tactile, Wi-Fi, veille, reconnexion, vidéo et son réellement entendu. Relever les
  versions des appareils/navigateurs ; David réalise la partie matérielle inaccessible au banc.
- [x] Actualiser la page Star Trek, le manuel des mécaniques, le guide du Tablet Hub et les
  captures des jeux. Expliquer l’activation du pilote et les deux niveaux d’accès/affectation.
  La synchronisation NotebookLM des guides suit le hook déjà autorisé lors de leur commit.

**Sortie :** recette logicielle verte et manuel fidèle à la version livrée ; tableau matériel
séparé avec résultats réels, sans déclarer une validation iPad à partir d’un test Edge sur PC.

La [recette L7 et sa grille matérielle](2026-10-16-recette-lcars.md) détaille les gestes,
les limites et la répétition sur fiction jetable. Tous les résultats matériels sont **non testés**.
Le parcours des sept consoles produit **42 captures du vrai Hub**, aux tailles 360×800,
390×844, 768×1024, 1024×768, 1180×820 et 1440×1000, ainsi que les sept instruments du manuel.
Les 19 actions sont proposées par le joueur puis qualifiées et arbitrées au vrai pupitre MJ.
Anciennes affectations/générations refusées, sortie de campagne/fin de séance et retour au Hub
après panne d’affichage sont également couverts. `bilan-l7.json` consigne le parcours réussi.

Deux défauts découverts pendant L7 sont corrigés et gardés par des tests : création concurrente
du même cache média sous Windows (une seule écriture partagée entre lecteurs), et ancienne
vue conservée après sortie de campagne (projection vide acceptée avant la mise à jour du flux
public, sans accepter une vue privée d’une autre campagne ni perdre la barrière de révision).

## Ordre de travail et point de départ

**L1 → L2 → L3 → L4 → L5 → L6 → L7.** Les essais ciblés accompagnent chaque tranche.
Les contrôles de cycle de vie et de sauvegarde ne sont pas repoussés à la recette finale.
L1–L4 donnent un premier parcours natif textuel ; L5–L6 complètent les médias et l’immersion.

Le prochain geste est **la recette matérielle**, à partir de la grille L7. Avant toute
modification de `src/` ou `electron/`, demander à David si GM-OS tourne et attendre sa réponse,
conformément à `AGENTS.md`. Ce plan n’autorise pas à lancer l’application personnelle ni un service.
Les éventuels essais natifs utilisent une instance jetable dans le cadre de la tranche demandée.

Le plan ne nécessite aucun paquet supplémentaire. Les changements d’hôte restent petits,
optionnels pour les modules existants et couverts par les essais Alien. Pas de refonte du Hub,
de thème global, de chargeur de plugins arbitraires ou d’automatisation des règles dans ce jalon.

**Validation L1–L4 :** types/build et lint ciblé propres, 127 tests Vitest ciblés et 34 tests
Node du moteur au vert ; quatre parcours E2E natifs réussis, dont deux LCARS et deux de
non-régression Alien. Reconnexion, redémarrage et import testés sur profils jetables.
Les 42 captures de l’atelier restent validées. Cette validation initiale précède L5/L6 ;
aucun résultat matériel n’est déduit des tests Edge sur PC.

**Validation L5/L6 :** types/build et lint ciblé propres, **186 tests Vitest**, **38 tests
Node** (34 moteur + 4 voix). **Quatre parcours E2E natifs LCARS** et **trois régressions Alien**
réussis : droits, film HTTP et passage du film à la sirène/voix. PNG, WAV et WebM décodés,
lecture privée refusée à l’autre PJ, retrait, export portable et restauration sans cache,
horloge tablette décalée, transfert et suspension audio, déconnexion sans rejeu. Atelier complet
et **42 captures** au vert. Les voix sont simulées et les sorties muettes pendant ces essais.
Le test Alien de fin de film avance désormais l’heure serveur plutôt que seulement Date.now
local ; aucun changement de logique Alien. Cette validation précède le complément L7 ci-dessus.
David demande ensuite le commit et le push groupés de **L5–L7 logiciel** ; les appareils réels
restent hors de cette validation automatique.
