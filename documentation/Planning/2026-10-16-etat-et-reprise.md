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
