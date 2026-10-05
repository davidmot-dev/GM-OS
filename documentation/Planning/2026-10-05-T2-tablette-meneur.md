# T2 — habillage de la tablette du meneur, terminé

David a confirmé le 05/10/2026 que GM-OS est éteint. Le lot meneur suit le lot joueurs du
[plan de refonte](2026-10-04-refonte-tablettes.md), à apparence constante sauf agrandissement
des cibles tactiles.

Les 54 boutons natifs de `src/modules/remote/` passent par `Bouton` avec leur habillage
existant. Les commandes conservent leur geste, leur libellé et leurs couleurs ; elles gagnent
le focus clavier du socle et une hauteur tactile de 44 px réels. Les deux commandes de PV du
combat et les outils du tableau ont aussi une largeur minimale de 44 px. Les couleurs du
tableau deviennent des cercles de 44 × 44 px ; leur bande défile horizontalement sur téléphone.

Les commandes à seule icône des dés, recherches et du coffre ont aussi une largeur de 44 px ;
les champs de recherche et de message s'agrandissent pour les accueillir sans masquer leur texte.
Les cadres principaux de Messages, Notes, Coffre Obsidian et Combat passent par `Panneau` ;
les états de scène et de santé passent par `Etiquette`. Le mode `habillage="libre"` de ces
primitives conserve les classes historiques pour ne pas modifier ces écrans avant T4.

Le banc de référence meneur a passé ses **44 scénarios** avant migration, après remplacement
des boutons, puis après les cadres, les étiquettes et l'ajustement du tableau. Les quatre
échecs attendus concernent toujours le libellé « Cliquer pour fermer » du résultat de dé.
La construction complète, `npx tsc -b`, ESLint des fichiers meneur modifiés et les 33 tests
du socle passent. Les captures T2 sont isolées des 68 références T0 par
`GMOS_TABLET_CAPTURES_DIR`.

La comparaison visuelle sur téléphone montre un déplacement vertical dû aux cibles de 44 px.
Sur le tableau, la barre d'outils et les couleurs demandent désormais un défilement horizontal
pour atteindre toutes les commandes ; vérifier ce geste sur les vrais appareils reste nécessaire.
Les onze scénarios du format téléphone repassent après l'agrandissement des commandes des dés,
recherches et messages. Les autres cadres et étiquettes faits main, ainsi que les cibles des
barres compactes, restent à inventorier avant la sortie stricte de T2.

## Clôture du lot — 05/10

Les cadres encore faits main des Pads, Dés, Sons, Scénario, Tableau et Notes passent par
`Panneau`, et les pastilles de statut par `Etiquette`, avec `habillage="libre"` pour garder
l'apparence de T0. Les cartes d'acte, de scène, de chronique et d'indice dans Notes suivent le
même chemin. Les **44 scénarios E2E** passent aux quatre tailles, dont le pupitre ; les quatre
échecs attendus de T0 restent les mêmes. Les 68 captures T0 ont chacune leur correspondante T2,
rangée hors du dépôt de référence. La comparaison visuelle des écarts les plus marqués montre
l'augmentation de hauteur des cibles tactiles sans commande masquée.

La construction, les types et les 35 tests ciblés du Hub et du socle passent. ESLint ne relève
aucune erreur nouvelle dans les fichiers T2 ; deux erreurs déjà présentes dans `HEAD` concernent
`TabletHub.tsx` et `LobbyOnboarding.tsx`.
