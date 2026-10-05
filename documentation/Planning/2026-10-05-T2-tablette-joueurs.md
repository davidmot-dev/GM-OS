# T2 — habillage de la tablette des joueurs, terminé

Le 05/10/2026, David a confirmé que T1 est testé et que GM-OS est fermé. T2 a commencé par
l'onglet **Cartes**, dans l'ordre fixé au § 5 du [plan](2026-10-04-refonte-tablettes.md). David a
ensuite demandé de poursuivre et confirmé que GM-OS était toujours fermé.

## Premier écran : Cartes

`src/components/hub/HubMainDeCartes.tsx` emploie maintenant `Panneau` pour les offres de cartes
et les deux zones de l'onglet, et `Bouton` pour accepter/refuser un don, piocher, agrandir et jouer
une carte. Les surcharges de classes conservent les fonds, bordures, rayons et dimensions des
cartes de T0 ; seul le minimum des commandes tactiles change. Le sélecteur de destinataire atteint
aussi 44 px.

Le socle utilisait `min-h-11`, soit environ 37 px lorsque la racine de GM-OS vaut 85 %. La nouvelle
option `cibleTactile` de `Bouton` garantit une hauteur de 44 px **réels** pour la tablette,
ou 48 px avec `aLaTable`, sans modifier les boutons existants du PC. Les boutons à seule
icône ont aussi besoin d'une largeur minimale explicite.

## Suite du lot : commandes du Hub

Les boutons natifs de `src/components/TabletHub.tsx` et `src/components/hub/` sont passés par
`Bouton` : accueil et choix du personnage, barre de navigation, catalogues Archives/PNJ/Lieux,
inventaire et don, fiche et jets, messagerie, notifications, règles et visionneuses. Le toast de
message est désormais un vrai bouton utilisable au clavier. Le mode `habillage="libre"` du socle
garde les classes visuelles des commandes illustrées ou compactes ; le socle assure le focus et la
cible tactile. Les contrôles à seule icône ont aussi une largeur minimale de 44 px. L'entrée de
message s'agrandit pour loger son bouton d'envoi à 44 px. La fiche de jets demande 48 px réels,
comme l'indiquait déjà son contrat.

Les cartes structurées de l'inventaire et le panneau des jets utilisent aussi `Panneau` avec des
surcharges conservant leur apparence actuelle. Les autres panneaux, étiquettes et en-têtes restent
à migrer ; les composants partagés avec le PC doivent être examinés séparément.

La fiche de santé (`EtatDeSante`) passe également ses commandes de PV par `Bouton`, avec des
cibles de 44 × 44 px. Dans les notes privées, l'en-tête repliable, les deux onglets et les actions
de transmission/modification du feedback utilisent le socle. **David a choisi de garder la
disposition actuelle des cinq étoiles de feedback et des commandes des réserves, et de reporter
leurs cibles de 44 × 44 px à T4.** Les étoiles, leur libellé et leurs espacements ne tiennent pas
sur une ligne de téléphone de 390 px. Les commandes des réserves dans
`PanneauDesRessources` posent la même contrainte ; ce composant sert aussi le PC.

La construction complète (`npm.cmd run build`) et `npx.cmd tsc -b` passent sur ce lot ;
quatre tests de `JetsDeLaFiche` passent aussi. Les erreurs ESLint préexistantes, confirmées sur
`HEAD`, demeurent dans `TabletHub.tsx`, `LobbyOnboarding.tsx` et `PlayerPrivateNotes.tsx` ; elles
ne portent pas sur les changements T2.
Le banc E2E T0 a été relancé hors du bac à sable Windows, avec profil Electron jetable et
captures distinctes des 54 références T0 : **39 scénarios comptés comme réussis**, dont les
échecs attendus de la remontée des PV et du bouton « Jouer » masqué à 390 px. Le bac à sable
ne laissait pas Electron ouvrir sa fenêtre ; le scénario témoin passe avec le même profil isolé
hors de ce bac. Le banc accepte maintenant `GMOS_TABLET_CAPTURES_DIR` pour ne jamais écraser
les images T0 pendant la comparaison.

Les premières captures T2 à 390 px montrent une régression de placement : la barre de navigation
déborde à droite et les actions de l'inventaire touchent la barre du bas. **David retient l'option 1
pour l'inventaire** : ses cartes et leurs actions gardent leur disposition, tandis que sa zone de
contenu réserve 88 px au-dessus de la navigation fixe sur téléphone (`TabletHub.tsx`). La
vérification des types et le test de `TabletHub` passent ; le contrôle visuel à 390 px et le geste
sur un objet en bas de liste restent à faire. Le débordement horizontal de la navigation est
distinct et encore ouvert. Les en-têtes et compteurs d'Archives, Lieux et PNJ passent déjà par
les primitives du socle, avec leurs classes historiques. Avant la correction de l'inventaire,
le banc complet avait de nouveau passé ses 39 scénarios après cette migration.
Les captures de téléphone prises avant la fin des animations d'entrée pouvaient montrer un
panneau encore transparent ; le banc attend maintenant 800 ms après le chargement des polices
avant chaque image. Le passage du format téléphone a passé ses 13 scénarios et produit les
captures stabilisées ; elles documentent le débordement de navigation et le recouvrement de
l'inventaire avant la correction de sa zone de défilement.

## Clôture du lot — 05/10

Les panneaux, étiquettes et en-têtes du Hub encore faits main passent par les primitives du socle
avec `habillage="libre"` : accueil, inventaire, fiche, notifications, messagerie, règles, visionneuses,
archives et surimpressions. Leurs classes visuelles restent celles de T0. Les étoiles de feedback
et les commandes des réserves conservent leur disposition ; David a reporté leurs cibles tactiles
à T4.

La navigation fixe occupe **une seule ligne défilante horizontalement**, avec dégradé et chevron
pour signaler les onglets hors écran. L'onglet actif est ramené dans la zone visible à chaque
sélection. À 390 px, le test fait défiler l'inventaire jusqu'à l'action « Donner » et vérifie qu'elle
reste entièrement au-dessus de la navigation. Une capture supplémentaire
`10-inventaire-actions.png` documente ce geste.

La construction et la vérification des types passent. Les **39 scénarios E2E** passent aux trois
tailles de référence, y compris les assertions de visibilité de l'onglet actif et de l'action
d'inventaire. Les 54 captures de référence ont toutes une correspondante T2 isolée dans un
dossier temporaire. Une comparaison échantillonnée des 122 paires joueurs et meneur, puis
l'inspection des plus grands écarts, n'ont montré que les cibles agrandies, la navigation choisie,
les animations prises à des instants différents et la date de l'horloge. Les défauts fonctionnels
déjà répertoriés en T0 ne sont pas corrigés dans T2.
