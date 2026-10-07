# Trame — documentation et enregistrement du 07/10/2026

David demande **« document, commit et push »** après la réalisation des six
dispositions. Cette demande autorise l'enregistrement et l'envoi de l'ensemble
du chantier Trame ; elle ne décrit pas un nouvel essai global G7.

**Commit de réalisation : `1d94f84f`**, `feat(trame): livrer le graphe en cartes et
ses outils d edition`, sur `feature/tablet-hub-pwa`. Le hook post-commit a
synchronisé le guide 11 vers NotebookLM (1/1). Le push est demandé vers `origin`
sur cette même branche, avec validation complète par le hook pré-push.

## Résultat livré

- Graphe en cartes React Flow et inspecteurs des éléments et des liens.
- Styles des liens : continu, tirets ou points, quatre épaisseurs, couleurs du
  thème ou personnalisées ; aperçu puis application.
- Jonctions sur les quatre côtés, cibles de clic et de glissement agrandies,
  choix au clavier et clic direct sur les points.
- Sélection multiple par Ctrl + clic ou Maj + rectangle, déplacement groupé
  conservé en une écriture ; ordre et appartenance des scènes inchangés.
- Organisation ELK et six dispositions : automatique, étoile, ligne, colonne,
  arbre et grille, avec trois espacements ; aperçu, application et retour à la
  disposition précédente, conservé après relance.
- Lecture des positions historiques, séparation des campagnes, Libre/Figé et
  cadrage tenant compte des dimensions réelles des cartes.

Les dépendances autorisées sont verrouillées : `@xyflow/react` 12.12.0 et
`elkjs` 0.12.0. Aucun autre paquet n'est ajouté pour les formes.

## Documentation et contrôles

Le [guide 11](../User%20Guides/11-Trame-actes-et-scenes.md), le registre § 124,
la note du jour et les notes de chaque lot décrivent les gestes et les pièges.
La [galerie](graphe-trame/index.html) conserve les captures et les manifestes.
Les bilans des lots précédents sont historiques : leurs comptes et empreintes
ne sont pas réécrits pour les faire correspondre à un lot ultérieur.

La construction et les types passent ; le dernier lint ciblé est sans diagnostic.
**724 tests dans 60 fichiers** et **34 scénarios Electron distincts** sont validés
sur le dernier code : trois nouveaux, 29 régressions dans le lot final et deux
régressions relancées après correction du banc de glissement, sans changement du
code applicatif. Sept captures des formes et douze planches de régression relues.
Les essais Electron utilisent uniquement des profils et campagnes fictifs isolés.

Le push conserve le hook de validation complet : types, lint, tests et construction.
Le hook post-commit conserve aussi la synchronisation des guides vers NotebookLM.
Les modifications locales étrangères à Trame restent hors de cet enregistrement.

## Reprise

**G7 effectué et consigné le 07/10** : David confirme **« j'ai testé Trame et
notamment les 6 dispositions »**, après le push de `1d94f84f` et `ed29f301`.
Voir la [note d'essai et de clôture](2026-10-07-trame-validation.md).
Les gestes détaillés de cet essai ne sont pas précisés dans sa réponse.
Commentaires dédiés sur les liens et accroches multiples restent des propositions,
pas des fonctions annoncées comme réalisées.
