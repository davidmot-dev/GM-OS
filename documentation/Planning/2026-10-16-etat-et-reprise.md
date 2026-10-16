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
