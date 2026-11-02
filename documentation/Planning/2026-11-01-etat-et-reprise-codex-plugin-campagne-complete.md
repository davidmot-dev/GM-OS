# Reprise Codex — plugin, campagne complète unique — 01/11/2026

David, après la proposition d'une campagne complète de 10 à 15 séances :
**« oui je voudrais que tu fasses cela pour toutes les campagnes d'essais futur, adapte
le plugin en fonction de cela »**, puis **« continue »**.

## Produit et publication

[GM-OS Campagnes de test](https://chatgpt.com/plugins/plugins_6ae484c30bd4819186676a390b1b74bf)
**0.2.0 publié**, même plugin personnel privé, même audience et identité.
ID conservé `plugins_6ae484c30bd4819186676a390b1b74bf` ; nouvelle release
`pluginrel_6ae784876888819193041fb11ecaaf72`, précédente
`pluginrel_6ae484c57abc8191a14e8ba38a59a34a`. Mise à jour gardée par l'ID de release attendu,
pas de second plugin créé ni de changement de partage.

- Par défaut, **une campagne complète dans un seul .gmos**, généralement **10 à 15 séances
  jouables**, intrigue suivie, arcs, factions/PNJ, lieux, pistes, rencontres, conséquences,
  bifurcations et fins alternatives. Ni simples titres de séances ni courte aventure étirée.
- Ateliers intégrés à un acte **« ATELIERS DE RECETTE — hors fiction »** de la même Trame,
  accessibles sans résoudre l'intrigue ; même ID de campagne. PJ principaux et éventuels
  personnages `[RECETTE]` identifiés, ces derniers affectés aux scènes d'essai concernées.
- Matrice/cahier vers l'unique fichier avec repères ; **ETATS-DE-REFERENCE.md** pour rétablir
  les seuls champs d'essai, manuellement si aucun geste natif local n'est vérifié. Aucune
  commande de reset ou d'import d'états inventée : **Nexus Remplacer réimporte toute la campagne**.
- Import : pilote séparé si nécessaire, un seul .gmos, tables facultatives ; un .gmos-driver
  ne crée pas de campagne. CSV humains vierges, preuves structurées et SHA toujours requis.
- Les anciens prompts de lancement sont **conservés exactement** ; leurs termes « lot » ou
  « aventure et deux laboratoires » suivent ce nouveau défaut. Plusieurs campagnes seulement
  sur demande explicite. **Aucun ancien lot fusionné ou régénéré.**

## Sources et vérifications

Sources sous [outils/gmos-campagnes-tests](../../outils/gmos-campagnes-tests/README.md) :
skill et références, nouvelle `references/campagne-complete.md`, manifestes portable et
compatibilité synchronisés, README et prompt propre au skill. Procédure locale
[campagne-de-recette](../../.claude/skills/campagne-de-recette/SKILL.md) alignée pour les
prochaines créations ; les exemples de générateurs existants restent historiques.

- **12 tests Python passent**, uniquement données fictives temporaires et hors ligne.
  Nouveau cas : une seule archive comportant douze séances et ateliers dans la même campagne.
  L'utilitaire n'est pas un juge de qualité narrative ; son code et l'icône restent inchangés.
- Build du paquet : JSON/YAML, manifestes concordants, références Markdown, composants,
  absence d'exports/serveur, ZIP rouvert et comparé fichier par fichier ; **13 fichiers, un skill**.
- Paquet `outils/gmos-campagnes-tests/dist/gmos-campagnes-tests-0.2.0.zip`, **27 266 octets**,
  SHA-256 `a83a1bffe0fda57288fca7df5767fc5c5fb8b5dfe334e878523c4806d8c1371e`.
- Identité, public privé personnel, trois prompts de lancement, capacités et assets conservés.
  Après publication : inventaire complet puis **13 fichiers distants relus et comparés** aux
  sources locales ; JSON comparés structurellement, autres fichiers comparés exactement.
- Lint du constructeur sans erreur, diff sans espaces fautifs. Compte/release et rapport
  durable dans [plugin-compte.json](../../outils/gmos-campagnes-tests/plugin-compte.json) et
  [verification-version-0.2.0.json](../../outils/gmos-campagnes-tests/verification-version-0.2.0.json).
- Synthèse des pilotes actualisée : nouvelle règle commune pour les futures campagnes,
  sans modifier les indicateurs des pilotes existants ni leurs preuves de recette.

La publication d'instructions et la relecture distante sont vérifiées. **Aucune nouvelle
campagne jouable n'a été générée ni importée pour cette mise à jour**, aucun essai Electron,
service, paquet installé ou lecture de données personnelles. La qualité d'une future
histoire et la restauration locale seront vérifiées sur sa propre livraison.

## Premier geste à la prochaine création

Utiliser le même plugin, version **0.2.0**, avec le jeu/pilote/règles et joueurs autorisés.
La nouvelle référence décrit la continuité narrative, la Trame des ateliers et les limites
du reset. Ne pas relancer un ancien générateur à trois archives sans l'adapter au nouveau
contrat ; conserver les lots déjà validés. Relever la version du pilote installé : Nexus
peut conserver une dépendance du même ID.

## Coexistence et fragment de registre

Le registre et la note générale du jour étaient déjà modifiés par l'autre chantier de Forge
à la reprise ; ils **n'ont pas été édités**. [AGENTS.md](../../AGENTS.md) : **« Un seul écrivain
par fichier »**, **« Si git status montre des changements que tu n'as pas faits, ils ne sont
pas à toi : n'y touche pas. »** Fragment à reporter par son écrivain, avec numéros recalculés :

> **Plugin — campagnes complètes dans un seul .gmos — 01/11/2026.** David : « pour toutes les
> campagnes d'essais futur, adapte le plugin ». GM-OS Campagnes de test 0.2.0 publié et 13
> fichiers relus : intrigue suivie, 10–15 séances indicatives, ateliers dans la même Trame,
> états de référence et restauration locale ; aucun remplacement global annoncé comme reset
> partiel. 12 tests structurels, paquet et lint passent, identité/public/prompts conservés.
> Sources et procédure locale actualisées ; anciens lots inchangés. Premier geste : prochaine
> création selon ce contrat. Aucun essai de nouvelle campagne réalisé. Reprise : cette note.

**Modifications locales non commitées**, aucun Git d'écriture demandé pour ce nouveau chantier.
Préserver tous les changements Forge/src/electron, corpus, guides et registres de l'autre
agent. Le cache installé sous le profil utilisateur n'est pas modifié directement : c'est
la release du plugin existant qui a été mise à jour.

## Incident de reprise

La première écriture a été arrêtée par l'échec de revue automatique lié au quota de l'outil,
avant modification du plugin. Après « continue », la même écriture contrôlée a réussi.
La revue n'a pas été contournée ; édition, tests, publication et relecture ont ensuite abouti.
