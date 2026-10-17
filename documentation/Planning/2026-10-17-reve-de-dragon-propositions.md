# Rêve de Dragon — propositions d’évolution et passation à Claude Code

Analyse et note de reprise de Codex, **17/10/2026**. Chantier : registre § 141, ligne 76.

## Demande et statut

David : « je voudrais que tu analyse le Drivers Rêve de Dragons et que tu me dises si on peut
rajouter des règles intéressantes au Driver ? », puis « je voudrais que tu consignes les
propositions pour pouvoir les partager avec Claude Code ».

**Analyse uniquement. Aucun développement engagé.** Les priorités ci-dessous sont une
recommandation de Codex, pas un ordre de réalisation approuvé par David. La demande de
consignation ne vaut pas validation des règles, des formules ou du périmètre d’un futur module.

**Répartition décidée par David le 17/10 : « le module externe sera fait par toi ».**
Le **lot R8 — module externe des Terres Médianes du Rêve — est attribué à Codex**.
Claude Code peut reprendre l’analyse des règles et du pilote R0–R7 ; leur réalisation reste
à choisir avec David. Le module TMR et son intégration seront conduits par Codex, en coordonnant
avec Claude les éventuels fichiers communs et le contrat d’échange avec les fiches.
Cette attribution ne déclenche pas le développement dans cette livraison documentaire.

## Ce qui a été vérifié

- Le code de [résolution RdD](../../src/modules/dice/systemes/revesDeDragons.ts) et ses
  [tests](../../src/modules/dice/systemes/revesDeDragons.test.ts) : calcul du pourcentage depuis
  la caractéristique et l’ajustement, degrés de résultat, ajustements extrêmes. Le module cite
  le Livre du Voyageur 2.3.1, p. 33–34, et signale des erreurs dans les résumés du corpus.
- Le [manuel du pilote](../User%20Guides/54-Jeu-Reves-de-Dragons.md), décrivant l’export du
  13/10 : compétences par famille, initiative par Agilité, santé, endurance et points de rêve.
- Les [types du pilote](../../src/types/drivers.ts), le
  [descripteur de jet](../../src/modules/dice/DescripteurDeJet.ts) et
  [l’ordre du tour](../../src/modules/combat/logic/OrdreDuTour.ts) : la cible peut composer des
  ajustements depuis la fiche ; le combat propose formule, alternance ou paquet, sans procédure
  RdD dédiée aux phases dans ce descripteur.
- Le [catalogue des modules](../../src/modules/modulesDuJeu/catalogue.ts) et leur
  [registre serveur](../../electron/modulesDuJeu/registre.ts) : MU/TH/UR, détecteur et LCARS
  sont enregistrés ; **aucun module TMR enregistré** lors de cette analyse.
- Le corpus `docs/systems/reves de dragons/rules/` et les anciennes fiches `rules-v1/`.

**Limite importante : l’export actuel du pilote RdD n’était pas présent dans `Export Dirvers/`
lors de l’analyse.** Le manuel décrit un état antérieur ; ses valeurs ne prouvent pas la
configuration installée aujourd’hui. Ne pas annoncer un défaut du pilote actuel sans le relire.
L’application et les données personnelles n’ont pas été ouvertes. Aucun test n’a été exécuté
pour cette analyse ; les tests existants ont seulement été lus.

## Propositions

| Lot proposé | Fonctionnement attendu | Intérêt en séance | Raccordement envisagé |
| --- | --- | --- | --- |
| **R0 — Vérifier les fondations** | Relire le pilote exporté, sa fiche et ses correspondances ; vérifier vie, endurance, caractéristiques dérivées, initiative, ressources et ajustements d’état. | Éviter de construire des automatismes sur des valeurs incohérentes. | Audit préalable ; corrections du pilote si confirmées, puis contrôle de la Forge. |
| **R1 — Fatigue et état général** | Piste adaptée à l’endurance du personnage ; coût des efforts et pertes d’endurance ; calcul du malus proposé au jet, détail des composantes visible. | Réduire les comptes et les pénalités oubliées pendant le voyage et la magie. | Mécanique dédiée, champs du pilote et affichage dans la fiche/les jets. |
| **R2 — Encaissement, blessures et états** | Action « Encaisser » avec dommages et protection, lecture du résultat, proposition des pertes de vie/endurance et blessures ; coups non mortels ; jet d’endurance, sonné, inconscience et suivi des soins. | Traiter un coup avec ses conséquences cohérentes et rappeler les obligations de fin de round. | Extension du moteur de combat, état persistant des blessures et écriture dans la fiche. |
| **R3 — Points de tâche** | Objectif, difficulté, périodicité, échéance éventuelle et participants ; les degrés des jets alimentent la progression et les revers ; pause et reprise d’un ouvrage. | Artisanat, recherches et travaux collectifs sans addition manuelle des résultats. | Panneau lié aux jets ; réutilisation éventuelle des horloges pour l’affichage, sans supposer qu’une horloge générique gère déjà les règles RdD. |
| **R4 — Repos et Château Dormant** | Assistant indiquant durée du repos, récupérations possibles, limites liées aux blessures et opérations nocturnes ; aperçu puis validation du MJ. | Résoudre le bilan de nuit sans oublier une jauge ni appliquer deux fois la récupération. | Service regroupant les règles de récupération ; Clock-OS fournit le temps de jeu si adapté. |
| **R5 — Stress, expérience et Archétype** | Attribution du stress, jet de conversion, résultat détaillé, réserve d’expérience et répartition ; indiquer les limites propres à l’Archétype. | Faciliter la progression et distinguer niveau actuel, expérience et potentiel de l’Archétype. | Champs et mécanique dédiés ; validation des augmentations, sans modification silencieuse des compétences. |
| **R6 — Chance, destinée et moral** | Actions depuis le résultat d’un jet : conditions, coût proposé, relance ou autre effet autorisé, conséquence et inscription au journal. | Rendre les recours visibles et éviter les oublis de dépenses. | Extension du panneau de jet et des ressources individuelles ; distinguer leurs règles respectives. |
| **R7 — Astrologie et heures draconiques** | Heure courante, signe de naissance, nombre astral réservé au MJ, informations découvertes par chaque personnage ; proposer les modificateurs pour les seuls jets concernés. | Donner une utilité pratique à l’astrologie et au calendrier. | Liaison à Clock-OS et vues filtrées ; pas de bonus global appliqué à toutes les actions. |
| **R8 — Module des Terres Médianes du Rêve** | Carte tactile, positions des demi-rêves, déplacements, rencontres, sorts en réserve, queues et souffles de Dragon ; vue d’ensemble du MJ et accès par joueur. | Apporter aux haut-rêvants un outil immersif et éviter les changements permanents de carte et de tables. | Nouveau module externe sous le contrat commun ; échange avec rêve/fatigue des fiches à concevoir explicitement. |

**Ordre recommandé :** R0, puis R1–R2, puis R3–R4. R5–R7 peuvent suivre selon les usages de David.
R8 est le chantier le plus distinctif pour les tablettes, mais mérite un périmètre et une recette
propres. Ces numéros sont des repères de discussion, pas des tranches déjà autorisées.

## Règles à établir avant automatisation

Les fiches du corpus sont des synthèses, souvent `genere_par: notebooklm` et `relu: false`.
Les anciennes fiches `rules-v1/` sont parfois marquées `a_regenerer: true`. **Ne pas transformer
leurs affirmations en constantes de code sans contrôle dans le livre de l’édition retenue.**

Deux écarts ont été repérés :

1. **Vie maximale** : le manuel du pilote indique `Taille + Constitution` ; la
   [synthèse santé](../../docs/systems/reves%20de%20dragons/rules/sante-et-blessures.md)
   parle de leur moyenne arrondie au supérieur. Le pilote installé et la règle primaire restent
   à vérifier. Ne pas confondre vie et endurance ni modifier les valeurs des personnages existants.
2. **Initiative** : le manuel décrit un tri par Agilité ; la
   [synthèse du combat](../../docs/systems/reves%20de%20dragons/rules/initiative-et-deroulement-du-tour.md)
   décrit phases, facteur par arme et priorité d’engagement. La synthèse se contredit elle-même
   sur certaines égalités : la procédure exacte doit venir du livre.

Les sources locales citent notamment des livres 2.2, tandis que le calcul existant cite 2.3.1.
Identifier l’édition réellement utilisée avant de figer tables, arrondis, durées et cas limites.
Pour chaque règle automatisée, conserver la référence et un exemple vérifié ; transcrire les
tables nécessaires au lieu de les extrapoler.

Autres points à contrôler dans les sources : construction des segments de fatigue, articulation
fatigue/endurance/vie, limites de récupération, durée de l’état sonné, lecture de l’encaissement,
conversion du stress, conditions des recours à la chance/destinée/moral, coût des opérations TMR,
dé draconic et effets des heures. Aucun barème numérique n’est validé par cette proposition.

La [présentation de Scriptarium](https://scriptarium.org/potinier/rdd/reve-de-dragon) confirme
l’existence des aides de jeu (carte des TMR, horaires draconiques, rappels de règles) et des
révisions entre éditions ; elle ne remplace pas une source détaillée de calcul.

## Intégration et points de vigilance

- **La fiche porte les valeurs du personnage.** Définir la source de chaque donnée et les
  correspondances ; ne pas recréer dans le module une seconde réserve de rêve ou de fatigue
  indépendante. Les positions, rencontres et réserves de sorts demandent un état propre.
- **Le pilote sélectionne et configure les capacités.** Certaines propositions nécessitent
  du code GM-OS : ajouter des champs au pilote ne suffit pas à créer leur comportement.
- **Le MJ garde la décision.** Pour les opérations composées (coup, repos, progression),
  présenter ce qui va changer, puis appliquer une seule fois avec une trace dans le journal.
- **TMR : réutiliser l’hôte commun**, ses droits, le filtrage des vues, les sauvegardes et la
  reconnexion. Une référence `modulesDuJeu` seule ne suffit pas : manifeste, moteur, vues et
  enregistrements sont nécessaires. Le contrat actuel ne doit pas être supposé écrire déjà dans
  les fiches ; le pont vers les ressources et ses droits restent à définir.
- Garder les secrets du MJ hors des vues joueurs (nombre astral non découvert, rencontres
  préparées, autres informations non partagées). Définir la visibilité des positions TMR.
- Conserver les clés et les personnages existants ; prévoir des migrations et une initialisation
  explicites. Recharger ou reconnecter une tablette ne doit pas répéter une dépense ou un repos.

## Par quoi Claude Code peut reprendre

1. Relire `AGENTS.md`, la passation et le registre § 141 ; refaire `git status` et lire les
   derniers commits. Le dépôt est partagé et comportait d’autres modifications hors chantier.
2. Rechercher un nouvel export RdD dans `Export Dirvers/`. S’il est toujours absent, obtenir
   l’export sans lire les magasins personnels de David.
3. Confirmer l’édition, puis établir R0 : configuration observée, règle sourcée, écart confirmé,
   correction envisagée. Distinguer correction du pilote et nouvelle mécanique.
4. Faire choisir/valider le premier lot R0–R7 ; **R8 est réservé à Codex sur décision de David**.
   Aucun développement n’est engagé par cette note ; coordonner le raccordement de R8 avec Codex.
   Avant toute modification de `src/` ou `electron/`, demander si GM-OS tourne et attendre la
   réponse conformément à `AGENTS.md`.
5. Pour un lot réalisé : tests pertinents sur les tables et transitions, contrôle de la Forge,
   parcours fiche/combat/tablette, sauvegarde et reconnexion ; manuel 53, page 54 RdD et captures
   à actualiser. Utiliser des personnages fictifs dans une instance jetable.

Commandes du dépôt : `npx tsc -b`, `npx vitest run --maxWorkers=4`, `npm run lint`.
Construire avant les E2E ; suivre les précautions de captures de la passation. Aucun commit,
push, paquet installé ni service réseau n’est autorisé par la seule demande de consignation.

**État de cette livraison :** propositions et reprise documentées ; aucun code applicatif,
pilote, fiche, corpus de règles ou donnée de campagne modifié. Voir le registre pour le suivi
ultérieur ; ce document conserve l’analyse du 17/10.

---

# Nephilim Légende — propositions d’évolution (Claude Code)

Ajouté par Claude Code le **18/10/2026**, à la demande de David : « rajoute dedans tes propositions
pour Nephilim ». Chantier : [2026-10-17-chantier-nephilim.md](2026-10-17-chantier-nephilim.md),
dont le § 8 tient la même liste à jour.

## Statut

**Propositions uniquement.** Les numéros N1 à N9 sont des repères de discussion, pas des lots
autorisés : David choisit l’ordre et le périmètre. Avant toute modification de `src/` ou `electron/`,
demander si GM-OS tourne (`AGENTS.md`).

## Ce qui existe déjà (17/10)

- **Le jet** : (Vécu + Ka d’approche ± circonstances) × 10 sur un d100, réussite critique sur un
  double réussi, maladresse sur un double raté ou 00, marge sur les dizaines
  ([`systemes/nephilim.ts`](../../src/modules/dice/systemes/nephilim.ts)). Les échecs critiques
  sont **annoncés**, pas suivis d’effets.
- **La fiche** à 7 pages (Magie, Kabbale, Alchimie), sa correspondance (966 liens) et la fiche
  GM-OS du pilote ; les **Vécus** (80, sur 16 des 20 époques) et les **époques d’incarnation**
  reliés aux champs de la fiche, les Vécus proposés selon les incarnations.
- **La Traque** au **Seuil RK** du lieu (`maxSur`), l’Intensité qui monte au débordement.
- Le manuel : [54-Jeu-Nephilim](../User%20Guides/54-Jeu-Nephilim.md).

## Propositions

| Lot proposé | Fonctionnement attendu | Intérêt en séance | Raccordement envisagé |
| --- | --- | --- | --- |
| **N1 — Arts occultes au jet** | Le menu du jet propose aussi les cercles de Magie, les Sephiroth et les Œuvres ; le Ka de l’élément du sort est l’approche ; le degré du sort se retire au curseur. Même cible × 10 que le Vécu. | Lancer sorts et invocations sans calcul de tête. | **Sans code** : section supplémentaire de la composante du jet, dans le pilote ; ranger à part les champs texte des sciences. |
| **N2 — Lancer un sort de la fiche** | Choisir une ligne de sort, d’invocation ou de formule des pages 3, 5 et 7 : son cercle (ou sa Sephirah, son Œuvre), son élément et son degré composent la cible. | Le sort écrit sur la fiche devient un bouton. | Code : composante « ligne de la fiche » ; lit `magic.spells.N.*`, `kabbalah.invocations.N.*`, `alchemy.formulas.N.*`. |
| **N3 — Suites des échecs critiques** | Maladresse : +1 Khaïba (Magie, pacte de Kabbale), +1 Ombre (Vécu contemporain), −1 au Ka du construct (Alchimie) ; réussite critique magique : proposer de baisser une Chute contre de la Sapience. Aperçu, puis validation du MJ. | Ne plus oublier les Chutes, qui font le cœur tragique du jeu. | Code : suites rangées selon la **section** du champ retenu (modèle proche de `EtatBrise.noterDans`). |
| **N4 — Stase et Sapience au jet** | Avant le dé : dépenser de la Stase (+1 degré de Ka par point) ou de la Sapience (Effet Mnémos : +2 degrés pour 1 PS, ou Vécu temporaire) ; décompte sur la fiche. | Les ressources se dépensent là où elles servent. | Code : un effet « degrés » pour les réserves du personnage (`reservesDuPersonnage` n’ajoute aujourd’hui que des dés ou un bonus au résultat). |
| **N5 — Le Ka dominant** | Un champ « Ka dominant » ; il plafonne la Stase. | Une Stase juste, sans contrôle de tête. | Ajout aux deux fiches (Character Sheet HTML Studio, sans retirer de clé), puis plafond lu sur la fiche. |
| **N6 — L’Alchimie au jet** | La formule débite la Materiae Primae de son élément (deux pour l’Œuvre au blanc) ; « Début de séance » recharge les jauges à leur plafond. | Le laboratoire tenu par l’outil. | Code ; les champs existent depuis la fiche à 7 pages (`alchemy.constructs.*`, `alchemy.materia.*`). |
| **N7 — Conséquences et Chutes** | Les malus des Conséquences (−2, −4, −6) proposés au jet ; les seuils des Chutes (5–7, 8–9, 10) annoncés sur la carte. | Les blessures et la dérive pèsent sans qu’on y pense. | Code léger : malus d’état au jet ; seuils de jauge. |
| **N8 — La Traque des Sciences occultes** | Un geste « Scène de Science occulte » : +1 jeton de Traque ; un rappel de l’Intensité en cours (ce qu’elle interdit). | La menace des Arcanes Mineurs reste présente. | Geste du bandeau des réserves, comme les gestes de NOC. |
| **N9 — Les Vécus, suite** | Les 4 époques manquantes (pages 77, 79, 89, 91 à fournir) ; la fiche GM-OS **sur tablette** avec les mêmes suggestions ; une **note Obsidian** par personnage pour l’histoire de ses Vécus. | Une liste complète, partout. | Données (pages du livre) ; tablette (`HubCharacterSheet`) ; lien de note sur le personnage, comme `Scene.noteObsidian`. |

**Ordre recommandé** : N1 (sans code), puis N3 et N2, puis N4–N5 ; N6 quand un joueur pratique
l’Alchimie ; N7–N9 selon l’usage. Le **pacte de Kabbale** (une opposition de marges) reste à la
main au début.

## Règles à vérifier avant automatisation

Les règles viennent du carnet NotebookLM « Nephilim » (Livre 0 *Quintessence*, p. 113–220 ;
*Grimoire du 3ᵉ cercle*) et du corpus `docs/systems/nephilim/rules/`, **non relus contre le
livre**. Avant de figer un nombre :

- la cible d’un sort : (Art + Ka − degré) × 10 — à confirmer page 184, ainsi que la limite des
  bonus de Stase ;
- l’effet exact d’une **réussite critique magique** sur les Chutes et son coût en Sapience ;
- les malus des Conséquences : s’appliquent-ils à **tous** les jets, ou aux seuls jets physiques
  et magiques ?
- l’Œuvre au rouge et le Grand Secret (3ᵉ cercle) : leurs maladresses aggravées.

## Points de vigilance

- **La fiche fait foi.** Une suite écrit sur la fiche GM-OS, qui part vers la fiche HTML **après
  « Sauvegarder »** ; ne jamais créer une seconde réserve de Stase, de Sapience ou de Materiae
  Primae.
- **Le MJ décide** : aperçu, puis une seule application, tracée au journal.
- Les champs `kabbalah.sephiroth.*`, `kabbalah.world`, `alchemy.path` et `alchemy.works.*` sont des
  **copies en lecture seule** de la page 2 (choix de David du 17/10) : écrire dans `occult.*`.
- Une correction du pilote passe par export, script, contrôle de la Forge, réimport par David.

## Par quoi reprendre

1. Lire le § 8 du [chantier Nephilim](2026-10-17-chantier-nephilim.md) et cette section.
2. Faire choisir le premier lot à David ; N1 ne demande qu’un export du pilote.
3. Pour chaque lot : relire la règle dans le carnet, tests, contrôle de la Forge, manuel 54-Nephilim
   et 53, captures (`e2e/capturesDesJeux.spec.ts`, mise en scène `nephilim`).
