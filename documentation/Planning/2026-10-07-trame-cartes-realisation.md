# Trame en cartes — réalisation et reprise du 07/10/2026

**Chantier § 124.** Demande : « reprendrre le chantier “Trame” ». Codex reprend
le [plan G0–G7](2026-10-07-graphe-trame-en-cartes.md) après clôture des tablettes.
**G0–G6 achevés et contrôlés. G7 attend l'essai de David.**

David confirme **« Non, GM-OS est fermé »**, puis **« Oui, installer @xyflow/react »**.
Il autorise aussi à compléter le registre, la note de reprise du 07/10 et le guide 11
en conservant leurs modifications antérieures. Aucun commit/push demandé pour Trame.

## Ce qui est construit

- `@xyflow/react` **12.12.0**, version exacte dans `package.json` et son verrou.
  Compatible avec React 19.2 utilisé ici. Le graphe social conserve son moteur.
- Cartes des sept types, avec acte, état, rang, titre, lieu et nombres de PNJ/indices
  existants. Titre sur deux lignes, complet au survol et dans l'inspecteur.
- Courbes entre les bords : enchaînements et ordre sur les côtés, appartenance et
  renvois en haut/bas. Conditions sur les traits. Niveaux et filtres préservés.
- Inspecteur extrait, colonne de 300 px réservée ; sous la toile à 900 px, avec
  défilement propre. Renommage, rang, état, entrées/sorties, détachement, ouverture
  de fiche et suppression appellent les actions existantes.
- Rangement chaîne/étoile adapté aux rectangles et aux grappes d'annexes. Les
  dimensions sont communes au dessin et au rangement. Les annexes partagées ne
  sont posées qu'une fois. Les orphelins restent visibles.
- Épingle → instantané figé → mémoire locale de cette campagne → rangement calculé.
  Les anciennes coordonnées ne sont ni migrées ni écrasées à l'ouverture.
- Glisser et déplacement clavier enregistrés à la fin du geste. Figer bloque les
  déplacements ; Libre les autorise sans simulation. Détacher garde provisoirement
  la place affichée ; Réinitialiser efface les positions et reprend un rangement.
- Relier par les points d'accroche, refus expliqués, cycles conservés, retrait
  des liens dans ce mode seulement. Dépôts sur acte/scène avec confirmation.
- Entrée pour sélectionner ; flèches pour déplacer ; Échap via le registre des
  surcouches ; suppression native du moteur désactivée. Champs de saisie protégés.
- Jetons du socle, quatre thèmes et personnalités, réduction des animations et mode
  léger. La mémorisation de la carte ignore les coordonnées pendant le déplacement.

## Vérifications et témoins

**G0 : construction réussie, 14 scénarios historiques et 45 tests de calcul/rangement**.
[Témoin](graphe-trame/G0-reference/README.md), cinq captures et caractérisation du
défaut de restauration : instantané enregistré, position non dessinée après
réouverture dans un nouveau renderer. Ce défaut est corrigé dans le nouveau rendu.

**Code final : construction/types et lint ciblé réussis ; 712 tests dans 56 fichiers**
(logique/magasins de session et garde des palettes). **33 scénarios E2E réussis
en environ 5 min** sur la construction finale : 14 historiques adaptés, 13 nouveaux,
3 de curation et 3 étapes de captures du manuel. Le lint porte sur les neuf fichiers
TypeScript concernés et les trois bancs modifiés/ajoutés, pas sur tout le dépôt.

Les nouveaux cas couvrent notamment : fermeture et nouveau processus avec
instantané sans épingle, A → B → A, une écriture au lâcher et zéro pendant le geste,
liaison sans déplacement, cycle, clavier, suppression native neutralisée, détachement,
réinitialisation, scène supprimée, refus de liaison, titres longs, zooms différents,
quatre thèmes × deux personnalités × trois formats et une trame fictive de **137 nœuds**.

La mesure dense relève zéro écriture pendant le zoom, une au lâcher et aucune
mutation du contenu de la carte durant les mouvements. La durée mesurée inclut
l'orchestration Playwright ; ce n'est pas une mesure de fréquence d'images.

[Galerie](graphe-trame/index.html) : **29 PNG finaux relus**, dont les 24 combinaisons
sur quatre planches, puis cycle, densité/constellation, mode léger, filtre vide et
condition. Guide 11 mis à jour ; ses trois vues Trame sont régénérées à partir de la
campagne de démonstration et relues. Les cinq témoins G0 ont aussi été regardés.
[Résultats et empreintes](graphe-trame/controles-integration.json). Aucun accès aux
données de David.

## Ancres

`src/modules/session/components/trame/` : `GrapheDeLaTrame.tsx`, `ToileDeLaTrame.tsx`,
`CarteDeTrame.tsx`, `LienDeTrame.tsx`, `InspecteurDeTrame.tsx`, `grapheDeTrame.css`.

`src/modules/session/logic/` : `adapterLeGrapheDeTrame.ts`,
`geometrieDesCartesDeTrame.ts`, `rangementDeLaTrame.ts`, `cartesDeTrame.test.ts`.

`e2e/grapheDeLaTrame.spec.ts`, `e2e/cartesDeTrame.spec.ts`,
`e2e/referenceTrameG0.spec.ts` (archive, exécution explicite seulement).

Références techniques : [ReactFlow](https://reactflow.dev/api-reference/react-flow),
[cartes personnalisées](https://reactflow.dev/learn/customization/custom-nodes),
[origine des positions](https://reactflow.dev/api-reference/types/node).
Les API utilisées sont vérifiées dans la version installée.

## Ne pas repayer

- Le sandbox Windows peut empêcher Electron d'ouvrir sa fenêtre : les passages
  réussis utilisent l'exécution autorisée hors sandbox, toujours sur profils fictifs.
  Les nouveaux bancs tolèrent les verrous Windows au nettoyage. Le lanceur partagé,
  déjà modifié avant la session, reste à son propriétaire.
- Le moteur démarre le glisser après un seuil : un premier mouvement de centaines
  de pixels décale le geste artificiel. Dépasser le seuil par un petit mouvement,
  puis aller à la cible en plusieurs pas. Viser les centres DOM au zoom courant.
- Les coordonnées prévues pour des points peuvent faire se recouvrir les cartes.
  Isoler les cibles du banc et supprimer les anciennes remises en place de calibrage.
- Entrée dans React Flow ne raccorde pas spontanément l'inspecteur GM-OS : le
  gestionnaire explicite relie la sélection au panneau.
- `SessionManager.setActiveCampaign` ramène volontairement au cockpit. Rouvrir
  Trame → Graphe avant de comparer les positions après un changement de campagne.
- Attendre le ResizeObserver après changement de format, avant Cadrer et capturer.
- Les liens latéraux vers une annexe sous la scène font un détour ; employer les
  accroches haut/bas pour les renvois et l'appartenance.
- `BaseEdge` attend aussi les coordonnées du libellé : transmettre celles de
  `getBezierPath`. La condition était enregistrée mais invisible avant cette
  correction, désormais vérifiée sur le trait et capturée.
- Centrer les cibles du banc entre les autres cartes : près du bord, le panoramique
  automatique change le dépôt artificiel. Attendre aussi le redimensionnement
  provoqué par le bandeau Relier. Deux erreurs de nettoyage du banc (attendre la
  carte depuis l'Arbre et supprimer une aide encore appelée) ont été corrigées ;
  le passage final complet est vert.

## Reprendre par G7

**Suite demandée le 07/10 :** David répond « c'est bien », demande des options
d'édition des liens, puis des pointillés, du gras et la couleur. Il confirme
**« GM-OS est éteint »**. Voir les [options consignées](2026-10-07-trame-edition-des-liens.md).
David demande ensuite « implémente » : l'inspecteur de lien et les styles sont
construits, avec leurs contrôles dans cette note complémentaire. Le bilan des
contrôles ci-dessus concerne le premier lot de rendu en cartes.

David ouvre **Trame narrative → Graphe**, range une trame, suit un embranchement,
édite une condition, déplace une carte, ferme et retrouve les positions. Vérifier
aussi la lecture des titres, le panneau, les renvois et le retour à la fiche.
**Réinitialiser** a désormais le sens documenté de rangement calculé ; le montrer.
La validation de David clôt le chantier. Commit et push sur demande explicite.

La copie de travail reste non commitée. Les modifications antérieures dans
`HubDiceDisplay.tsx`, `e2e/lancerGmOs.ts`, `.claude/settings.local.json` et les autres
guides n'ont pas été modifiées par cette reprise.
