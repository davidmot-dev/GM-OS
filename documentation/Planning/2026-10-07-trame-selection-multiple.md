# Trame — sélectionner et déplacer plusieurs cartes, 07/10/2026

David demande **« Maintenant je voudrais savoir si je pouvais sélectionner
plusieurs éléments en même temps pour les déplacer en 1 seul mouvement ? »**,
puis accepte la proposition par **« ok »**. Il confirme **« GM-OS est fermé »**
avant les modifications.

- **Ctrl + clic** ajoute ou retire une carte ; **Maj + glisser depuis le vide**
  sélectionne par rectangle. Les différents types de cartes peuvent se mélanger.
- En **Libre**, glisser une carte sélectionnée ou le cadre déplace le groupe
  en conservant les écarts. Les flèches sur une carte focalisée déplacent aussi
  la sélection. **Échap** ou le clic dans le vide la libère.
- Un bandeau indique le nombre de cartes choisies. L'inspecteur individuel revient
  lorsqu'une seule carte reste sélectionnée. La sélection ne s'enregistre pas.
- Toutes les positions du groupe s'épinglent **en une écriture au lâcher**,
  par campagne. Aucun rattachement à un acte ni réordonnancement d'une scène
  n'est déclenché par ce déplacement. Les liens suivent les cartes ; les trajets
  ELK périmés sont écartés selon la règle existante.
- **Figé** bloque les mouvements, **Relier** vide la sélection et l'aperçu d'une
  organisation suspend ces gestes. Les cartes masquées par un filtre ou retirées
  de la campagne sortent de la sélection.

Ancres : `GrapheDeLaTrame.tsx`, `ToileDeLaTrame.tsx`, `adapterLeGrapheDeTrame.ts`,
`grapheDeTrame.css`, `campaignSlice.ts` (`epinglerPlusieursDansLaTrame`),
`selectionMultipleDeTrame.test.ts` et `e2e/selectionMultipleDeTrame.spec.ts`.

La construction et le typage passent ; les **721 tests dans 59 fichiers** de
logique/store Session et de garde d'apparence passent. Le banc Electron isolé
vérifie les gestes réels, les écarts, l'écriture unique, Figé, les filtres et le
retour des positions dans un nouveau processus. **45 scénarios Electron distincts**
passent : les trois nouveaux essais et 42 régressions des cartes, liens, jonctions
et de l'organisation ELK. Les deux nouvelles captures et douze planches de
régression sont relues ; lint ciblé propre. Les contrôles finaux vivent dans
[le manifeste](graphe-trame/selection-multiple/controles-integration.json) et
[la galerie](graphe-trame/selection-multiple/index.html). Les manifestes des lots
précédents conservent leurs valeurs historiques.

Ne pas repayer : React Flow appelle aussi `onNodeDragStop` pour un déplacement
par le cadre. Ajouter une deuxième sauvegarde dans `onSelectionDragStop` ferait
écrire deux fois. La sélection native est synchronisée avec celle du panneau,
sans réinitialiser les coordonnées pendant le glissement.

Essai de David attendu pour ce lot. Aucun commit/push demandé.
