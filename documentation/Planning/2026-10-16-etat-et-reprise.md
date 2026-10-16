# État et reprise — 16/10/2026

Lire AGENTS.md puis la [passation](2026-10-04-passation-claude-codex.md).
Branche `feature/tablet-hub-pwa`. Chantier : registre § 135, ligne 70.

## Demande et Git

David : *« commit et pousse puis faire l’étape 5 - GM-OS est fermé »*, puis *« continue »*.
Le push a finalement réussi : `origin/feature/tablet-hub-pwa` et HEAD sont à `05ff9692`.

- `8027299e` : étapes 3/4, détecteur intégré et recette réelle Electron/Edge.
- `05ff9692` : stockage des modules initialisé au premier besoin, après verrouillage du
  profil ; garde des portes du cockpit actualisée à neuf. Les deux défauts avaient été
  trouvés par le premier pré-push, puis corrigés et testés.
- Pré-push réussi : types, lint global sans erreur, **7 815 tests verts / 4 ignorés dans
  637 fichiers**, build. La tentative précédente avait été bloquée avant exécution par
  le quota du contrôle d’approbation ; reprise autorisée le 16/10, sans contournement.
- Les guides 53/54 Alien/61 du commit `8027299e` ont été envoyés **3/3 à NotebookLM** par
  le hook, avec l’autorisation explicite persistante de David. Pas de nouveau commit après
  le push : **l’étape 5 et ses guides sont non commités**, donc pas encore resynchronisés.

Éléments non suivis antérieurs, hors chantier et intacts : `.claude/settings.local.json`,
`Export Dirvers/`, `outils/jdr-pdf-vers-md/`. Aucun paquet installé ni donnée personnelle lue.

## Étape 5 réalisée

- **Dossiers** : suppression confirmée, nettoyage des déverrouillages et boutons Monter/
  Descendre. Le moteur exige une permutation exacte ; LIST et la préparation exportée
  conservent cet ordre. Les textes déjà lus restent dans les dialogues. Les nouvelles
  commandes de l’atelier React déclenchent sa sauvegarde automatique.
- **Demandes MU/TH/UR** : questions et HACK indépendants, texte/date/statut et réponse
  conservés. Le MJ sélectionne la demande à traiter, peut répondre hors ordre ou envoyer
  un message libre sans traiter de question. Les demandes traitées restent consultables.
  CLEAR efface le journal, pas la file ; révocation annule les attentes. Traitement répété,
  mauvaise nature ou demande d’un autre PJ refusés. Limites : 32 attentes par PJ, 128 entrées
  d’historique, un HACK en attente. L’élagage ne supprime que les entrées déjà traitées.
- **Préréglages du détecteur** : jusqu’à 32 noms uniques par campagne, capture des réglages
  appliqués (contacts, proximité, intensité, volume, parasites), remplacement et suppression
  confirmée. Rappel en veille, faux écho arrêté ; aucun démarrage ou tirage implicite.
  La liste reste réservée au MJ ; les joueurs ne reçoivent que le radar courant.
- Prototype autonome HTML/serveur et modules du Hub utilisent le même cœur pour ces gestes.
  `scratch/muthur-v1/apercu.html` et `scratch/modules-du-jeu-integration/apercu.html` régénérés.

Formats : MU/TH/UR **0.4.0, données v3** (migrations v1/v2/v3), détecteur **0.2.0, données v2**
(migrations v1/v2). Contrat commun v1 inchangé. Ancienne demande unique récupérée depuis le
journal si possible ; les questions déjà écrasées par l’ancien format sont irrécupérables.
`request` reste un pointeur dérivé de compatibilité, validé contre `requests`. Préparation
portable MU/TH/UR toujours v1, sans dialogues/demandes ; pas de remplacement silencieux des codes.

Ancres : `outils/alien/core.js`, `app.js`, modules `muthur/` et `detecteur/`,
`electron/modulesDuJeu/ergonomie.test.ts`, `outils/modules-du-jeu/captures-ergonomie.mjs`.
Guides 53/54 Alien/61, README des modules, plans et registre actualisés.

## Validation et limites

- **82 essais Node verts** : tous les fichiers `verification*.mjs` d’Alien, des deux
  adaptateurs et du contrat commun. Files/capacité/confidentialité, suppression, classement,
  préparation portable, migrations strictes, préréglages, effets et vidéo.
- **188 tests Vitest, 16 fichiers verts** : hôte/stockage/transport en mémoire, vues React,
  sauvegardes/Nexus, garde du profil/cockpit et manuel des jeux. Nouveau parcours natif : ancienne campagne v2/v1 → migration →
  modifications → écriture → redémarrage → export/import, droits fermés et scan arrêté.
- `npm.cmd run build` réussi, donc `npx.cmd tsc -b` propre ; lint global propre.
- **51 captures hors ligne** : 33 intégration, six radar autonome, douze ergonomie aux tailles
  360/768/1180. Revue visuelle des trois nouveaux panneaux et du détecteur au téléphone.
  Les trois nouvelles images du manuel sont `jeu-alien-{dossiers,demandes,prereglages}.jpg`.
  Le banc vérifie traitement de la seconde question, classement/suppression, rappel en veille
  et persistance locale du prototype. Aucun lancement de GM-OS ou service réseau pour cette étape.

Les six E2E réels de l’étape 4 restent la référence antérieure ; ils n’ont pas été relancés
pour cette étape. Reste **l’étape 6 matérielle** : Wi-Fi, vrais appareils, clavier tactile,
veille/déconnexions, écoute du film entier et des voix/sirènes, transfert du son. Utiliser
la [recette fictive explicite](2026-10-15-recette-modules-alien.md), jamais les sauvegardes
personnelles. La Table des Terres Médianes attend une définition séparée avec David.

Pièges : PowerShell demande `npm.cmd`/`npx.cmd` ; Python du PATH est indisponible (aucune
installation faite). Les assertions Chai n’ont pas `toBeDisabled` : lire la propriété du
bouton. Un classement doit garder le dossier sélectionné même lorsque la sélection initiale
était implicite. Les captures du pupitre doivent viser l’instrument entier et prévoir la
hauteur du conteneur défilant. Les pré-push testent la copie de travail : attendre leur fin
avant toute édition.

## Mise en version demandée ensuite

David demande *« commit et pousse, etape 6 c’est uniquement pour moi ? »*.
L’étape 5 est regroupée dans `feat(alien): classer les dossiers et gerer les demandes et prereglages`
(`git log` donne son identifiant), avec le push et les hooks de validation/NotebookLM autorisés.
Les mentions « non commité » ci-dessus décrivent l’état avant cette nouvelle demande.
L’étape 6 se partage : l’agent peut préparer la recette et automatiser les essais logiciels ;
David juge la restitution sur ses tablettes et enceintes (Wi-Fi, tactile, veille et son réel).

## Étape 6 — volet logiciel et préparation matérielle

David : *« ok commence 6 alors, GM-OS est éteint »*. Il précise le matériel :
*« Ipad, Ipad Air, Tablette Samsung et smartphone »*. Base désormais `8f4b1de6`, commit et
push réussis avec types/lint/build, **7 817 tests** et **3/3 guides NotebookLM** synchronisés.

`e2e/modulesDuJeuAlien.spec.ts` porte maintenant huit parcours. Les cinq premiers passent ;
les trois étendus sont ensuite validés après correction du banc (retour aux modules avant
de changer d’instrument, sélection des listes par leur nom accessible complet/préfixé).
Les erreurs initiales n’ont pas nécessité de correctif de GM-OS. Ne pas les diagnostiquer
comme des pertes de données ou des problèmes de droits.

- Persistance étendue sur le vrai fichier privé : dossiers classés/supprimés, demande privée
  et préréglage nommé retrouvés après redémarrage/import, avec droits fermés et scan arrêté.
- Deux PJ, tactile émulé à 390 px puis paysage 844 × 390, saisie accentuée et validation,
  seconde question traitée avant la première, HACK indépendant, réponse pendant déconnexion
  retrouvée à la reprise. Dossier déverrouillé puis supprimé inaccessible à une nouvelle lecture.
- Relais film → sirène après treize minutes simulées, deux puis une minute annoncées avec
  une voix française de test ; un seul diffuseur, transfert et annulation avec silence final.
  HTTP, décodeur et Web Audio réels ; Date avancée et synthèse vocale simulée, sorties muettes.
  Aucune écoute du film entier ni validation d’une voix système ou du clavier virtuel réel.
- Build/types et lint du scénario propres. Sept captures du vrai Hub dans
  `scratch/modules-du-jeu-e2e/`, deux nouvelles relues (tactile paysage, alarme après film).
  Logs des trois exécutions dans `scratch/etape6-e2e*.log` ; résultats/traces dans `scratch/`.
  Seuls les essais en échec ont été rejoués après correction ; les huit parcours sont validés
  sur le même build applicatif, sans changement de source applicative entre les essais.

La [fiche matérielle](2026-10-16-recette-materielle-alien.md) prépare deux paires d’appareils,
une grille non remplie et quinze gestes concrets. Navigateurs/versions et diffuseur choisi
restent à relever. La semence fictive `scratch/modules-du-jeu-recette/semence.json` est générée ;
ne jamais lancer `repetition` sans cet argument explicite, son défaut cherche une sauvegarde
personnelle. Guides 54 Alien/61, recette et registre actualisés. Pas de commit demandé pour
cette étape, ni nouvel envoi des guides à NotebookLM. Aucun paquet installé ou donnée personnelle lue.

Les instances de test sont fermées et les profils temporaires supprimés par le banc.
**Avant toute prochaine édition de `src/` ou `electron/`, redemander si GM-OS tourne** :
la confirmation donnée pour commencer cette étape ne couvre pas l’essai suivant.
Reprendre avec David sur la grille matérielle ; l’étape 6 complète attend ces résultats.
Piège Windows : les accents d’un script passé par le pipeline PowerShell à Node peuvent être
altérés ; une substitution peut ne rien remplacer. Préférer `apply_patch` et vérifier le diff.

## HACK — brouillage dès le lancement

David : *« ok ca marche bien. Je voudrais que lorsque je lance un Hack, l’écran glitch
fortement pendant 5 secondes »*, puis confirme GM-OS fermé (*« non »*). Ce retour positif
est conservé sans inventer de résultats détaillés par appareil pour la grille matérielle.

`core.js` crée un signal de cinq secondes quand une nouvelle demande HACK est enregistrée.
Même forme de `cue` et même format de sauvegarde : son id correspond à la demande HACK
en attente ; l’arbitrage conserve son signal distinct avec un nouvel id. Les vues React
et le prototype reconnaissent ce départ : neige dense, déchirures et décalages chromatiques
forts, sans faux résultat de réussite/refus. À cinq secondes, affichage normal et demande
toujours en attente. Répéter HACK n’ajoute pas de demande ni ne prolonge l’effet. Le résultat
du MJ remplace immédiatement le départ ; le refus atténué reste lisible. Réglages des effets
et mouvements réduits respectés. Reprise d’une vue rejoint le temps restant ; restauration
efface le signal comme avant. Aucun changement de droits ou de règle.

Validation : **84 essais Node**, **86 tests Vitest (13 fichiers)**, lint ciblé et build/types
verts. **15 captures ciblées hors ligne** : onze des effets de résultat existants, quatre
du départ module/prototype avec/sans mouvements réduits, délai de cinq secondes et attente
du MJ vérifiés par horloge contrôlée. Captures fortes et refus relus ; nouvelle capture du
manuel et guides actualisés. Le banc ancien du prototype doit sélectionner le HACK dans
sa file avant le bouton de refus (file livrée à l’étape 5).

`scratch/muthur-v1/apercu.html` est régénéré. La première capture complète s’était arrêtée
sur ce sélecteur ancien ; après correction, seuls les parcours de piratage concernés ont été
rejoués avec succès (`scratch/hack-depart-visuel.log`). Aucun E2E Electron ou service réseau
lancé pour ce changement. Aucun fichier `src/`/`electron/` modifié. Les changements non
commités de l’étape 6 sont conservés ; cette amélioration est aussi **non commitée**.

## Mise en version de la recette et du départ HACK

David demande ensuite *« ok commit et pousse, tu as mis à jour la documentation ? »*.
La recette étendue et la fiche des quatre appareils sont regroupées dans
`test(alien): etendre la recette et preparer les appareils de table`, puis le départ HACK
et sa documentation dans `feat(alien): brouiller le terminal cinq secondes au lancement du hack`.
`git log` fournit leurs identifiants. Les mentions « non commité » précédentes décrivent
l’état avant cette demande. Les hooks de validation et de synchronisation NotebookLM sont
conservés, avec l’autorisation explicite persistante pour l’envoi des guides modifiés.

## HACK absent du Tablet Hub — diagnostic du 16/10

David signale : *« le glitch de hack n’apparaît pas sur la tablet hub »*.
Base poussée : `a23e6989` (départ HACK), après `460544af` (recette).
La première passe se limite au diagnostic, en attendant la confirmation de fermeture.
David répond ensuite *« il est fermé »* et précise : *« Le bandeau “INTRUSION EN COURS”
apparaît, mais sans glitch. »* Le décalage d’horloge reproduit reste donc un défaut
distinct, pas une cause affirmée pour son appareil.

Deux tests ajoutés à `e2e/modulesDuJeuAlien.spec.ts`, sur le build actuel et une campagne
fictive isolée, sans données personnelles :

- Vrai Hub tactile 390 px, mouvements actifs : demande HACK, classe de départ et animation
  CSS `muthur-intrusion` effectives, neige visible, disparition après cinq secondes et
  demande conservée pour le MJ. **Passe** (`scratch/hack-hub-regression.log`).
- Même parcours avec horloge tablette en avance de 60 secondes : demande reçue, mais
  aucun effet de départ. **Défaut reproduit** (`scratch/hack-hub-horloge.log`). Ce test
  portait temporairement `test.fail` avec la raison explicite ; annotation retirée
  lors du correctif ci-dessous.

Cause vérifiée : `Journal` dans `outils/alien/modules/muthur/vues.mjs` calcule la durée
restante en comparant `cue.at` du serveur à `Date.now()` du client. Une tablette en avance
saute l’effet ; une tablette en retard peut le prolonger. Cela ne prouve pas encore que
l’appareil de David ait ce décalage. Autres cas à distinguer : HACK déjà en attente
(pas de nouveau signal volontairement), effets désactivés ou mouvements réduits.

Après confirmation, le service ajoute `instantServeur` à chaque projection joueur.
Le canal crée une `horloge()` locale ancrée à la réception avec `performance.now()`,
transmise par l’hôte au journal MU/TH/UR. Cette fonction n’est ni persistée ni envoyée
sur le réseau. Une vue en cache continue à vieillir ; aucun nouveau format de données.
Sans référence serveur, l’atelier conserve `Date.now()`. Le raccord ne concerne ici
que les signaux de piratage : les autres séquences vidéo/son/décompte restent inchangées.
La latence réseau n’est pas mesurée par cette référence.

Le mode mouvements réduits coupait toutes les animations et ramenait les parasites
à une opacité très faible : cas compatible avec le bandeau seul signalé par David,
sans prétendre avoir inspecté les réglages de son appareil. Le départ HACK y montre
désormais des parasites fixes et une séparation chromatique pendant les cinq secondes,
sans animation ni clignotement. Les interrupteurs CRT/parasites restent respectés.
Contrat, guide Alien, README du module et aperçu local actualisés.

Types/build, lint ciblé et **88 tests Vitest dans 12 fichiers** passent. **Quatre parcours
HACK du vrai Hub passent (1 min 25 s)** : animation active, avance/retard de 60 s avec
expiration et réouverture, brouillage fixe avec mouvements réduits puis retour normal.
Deux captures du vrai Hub relues ; bandeau lisible et commandes accessibles dans les
deux modes. Log `scratch/hack-hub-correctif-e2e.log`, sorties `scratch/hack-hub-correctif/`.
Profils fictifs et instances de test fermés par le banc ; aucun essai sur tablette physique.
**17 fichiers modifiés, non commités**, aucun commit demandé ici. Avant une nouvelle
édition de `src/`/`electron/`, redemander la fermeture : les essais viennent de lancer GM-OS.

## CRT et parasites trop discrets sur tablette — suite du 16/10

David : *« l’effet CRT / Parasite n’est pas très visible sur la tablette »*.
Changement limité à `outils/alien/modules/muthur/style.css`, au banc E2E et aux guides ;
aucun nouvel accès à `src/` ou `electron/`. La copie conserve les correctifs précédents
non commités. Aux largeurs ≤ 1 180 px ou pointeur tactile : lignes CRT de six pixels,
fond phosphore/halo plus contrastés, grain normal à 24 % au lieu de 14 %, pointes à 38 %.
En mouvements réduits, grain fixe à 20 % au lieu de 7 %, départ HACK fixe à 36 %.
Refus conservé à 10 % et trame atténuée ; pas de flou ni de nouveau mouvement sur les
commandes ou le film. Les interrupteurs restent indépendants. Le parcours animé existant
est étendu à 390 et 1 024 px, avec captures du journal au repos et pendant HACK.
Build/types et lint du scénario propres. **Trois parcours du vrai Hub passent** :
390 px, 1 024 px, mouvements réduits (logs `scratch/crt-tablette-e2e.log`).
**Onze captures de piratage hors ligne** vérifient les combinaisons indépendantes,
le refus après changement de vue, le succès et les mouvements réduits ; deux refus
relus, texte et bandeau lisibles (`scratch/crt-tablette-refus.log`). Les captures au repos
avaient d’abord saisi le chargement différé du module : le banc attend désormais son
journal, puis les deux formats sont rejoués avec succès pour produire les bonnes images
(`scratch/crt-tablette-captures.log`). Vues au repos relues ; la capture 1 024 px du vrai
Hub remplace celle du terminal joueur dans le manuel.
L’aperçu HTML est régénéré. Aucun commit/push demandé ; reprendre sur les tablettes
physiques après recharge du Hub, le contraste de leur écran reste à juger par David.

## Mise en version des correctifs du Hub

David demande ensuite *« commit et pousse »*. Les deux retours sur l’affichage tablette
(durée HACK indépendante de l’horloge et rendu CRT/parasites plus présent) sont regroupés
avec les essais, le contrat, le manuel et sa capture dans un commit dédié ; son identifiant
se lit dans `git log`. Les mentions « non commité » précédentes décrivent l’état avant
cette demande. Le push conserve les hooks types/lint/tests/build et la synchronisation
NotebookLM du guide Alien, autorisée explicitement plus tôt par David. Les trois chemins
non suivis déjà présents ne font pas partie de ce commit.

## Horloges du décompte, du film, de l’alarme et du faux écho — Claude Code, 16/10

David : *« corrige les trois horloges »*, puis *« gm-os est éteint »*. Le raccord du HACK
(`instantServeur` → `horloge()`) est étendu aux autres lecteurs d’échéance serveur :
`CompteARebours`, `VideoAlerte` et l’alarme de `outils/alien/modules/muthur/vues.mjs`, et le
faux écho du détecteur (`modules/detecteur/vues.mjs`, option `instant` de `detecteur.js`,
`vuesDuRegistre.tsx` qui transmet désormais l’horloge au détecteur). Film, alarme et boucle
de dessin lisent la dernière horloge par `useHeureStable` (référence) : les recréer à chaque
projection relancerait le film. Aucun format de données, aucun champ réseau nouveau.

Validation : 85 vérifications Node d’Alien et du contrat, 138 tests Vitest (18 fichiers :
modules, hôte, Hub), `npx tsc -b` et lint ciblé propres. Deux essais ajoutés : OMEGA-10 sur
une tablette en avance d’une minute affiche 12:56 (11:56 avant), film et alarme reçoivent
l’heure serveur puis suivent une nouvelle projection ; faux écho visible à +60 s (3 échos
sans horloge, 4 avec). **Pas d’E2E Electron relancé** ni de construction de production.
L’atelier autonome garde l’heure locale. Contrat, README des deux modules et registre
actualisés. Non commité.

## NOC — moment de calme, effets du Fiel, Fatigué, Capital, Vécu et Rouages — Claude Code, 16/10

David : *« on va faire NOC »* ; les quatre lots retenus (moment de calme + Fatigué, effets du
Fiel, Atout Capital, Vécu et Rouages) ; Cthulhu Hack et Blade Runner **après**. GM-OS confirmé
éteint plus tôt (*« gm-os est éteint »*), rien lancé depuis. Règles : carnet NotebookLM « NOC »
interrogé deux fois (lecture seule). Détail, règles et restes : registre § ⭐, entrée du 16/10.

Fichiers : `src/types/drivers.ts` (`GestesDesHeros`, `MouvementDeFiche`, `EffetDeDebordement`,
`stocks[].horsPlafondSi`), `src/modules/table/gestesDesHeros.ts` + `FenetreDesGestesDesHeros.tsx`
(variante `gestes-des-heros` du `ModalProvider`), `PanneauDesRessources.tsx` (prop `gestes`,
passée par `SessionDashboard`), `reservesDuGroupe.ts`, `dice/systemes/nocturne.ts`
(`valeurDeJauge`, `seulementSi`), `dice/fielAuPupitre.ts` + `DiceBoard.tsx`, `useDiceStore`
(`fielAttribue`, `annoterLeJet`), Forge (`controlesDuPilote.ts`, `RevueDuPilote.tsx`), manuel 53
et 54 NOC.

Validation : `npx tsc -b` propre ; **1 716 tests Vitest dans 118 fichiers** (table, dés, Forge,
panneau de jet, composants dont la garde Échap, magasins, garde du manuel) ; lint des fichiers
touchés propre. Essais nouveaux : `gestesDesHeros.test.ts` (15), `FenetreDesGestesDesHeros.test.tsx`
(3), `fielAuPupitre.test.ts` (5), Capital, Fatigué/Bouleversement et contrôles de la Forge.
**Rien vu à l'écran**, pas d'E2E. **Le pilote NOC de David n'est pas encore corrigé** : sans
`gestesDesHeros` déclaré, le bandeau ne montre rien de neuf. Non commité.

**Suite — pilote NOC corrigé.** David exporte le pilote (*« j'ai fait l'export (on fini NOC puis
on commite et pousse) »*). Corrigé dans `Export Dirvers/corriges/` : sections États et Séquelles,
deux jauges de malus, Capital libéré, `gestesDesHeros` ; zéro constat de la Forge. Trouvé en
lisant la fiche : les Blessures sont portées par les cases de santé — `table/ecrireLesHeros.ts`
passe par `updateCharacterHealth` pour ce champ (essai `ecrireLesHeros.test.ts`). Un Héros déjà
Fatigué n'est plus annoncé « coché ». **David réimporte le pilote corrigé** (« Remplacer »).

**Mise en version.** David demande *« on fini NOC puis on commite et pousse »*. Deux commits :
`fix(alien): …` (horloges, avec le contrat et les README des modules) puis `feat(noc): …` (code,
Forge, manuel, registre et cet état) ; `git log` donne leurs identifiants. Les mentions « non
commité » ci-dessus décrivent l'état avant cette demande. Non suivis et hors commit :
`Export Dirvers/`, `outils/jdr-pdf-vers-md/`, et `2026-10-16-analyse-lcars-star-trek.md`
(pas écrit par Claude Code — laissé à son auteur).
