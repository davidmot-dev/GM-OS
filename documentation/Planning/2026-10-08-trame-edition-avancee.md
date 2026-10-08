# Trame — commentaires, accroches multiples et trajets manuels

David demande **« met en place ces nouvelles options »** après la clôture de
Trame : commentaires dédiés sur les liens, plusieurs accroches sur un côté et
édition manuelle du trajet. Il confirme **« GM-OS est fermé »** avant les
modifications. Réalisation commencée le 07/10, vérifications poursuivies le 08/10.

## Comportement

- Le commentaire est une note libre de 1 000 caractères maximum, distincte de
  la condition d'un enchaînement. La toile en montre un extrait et l'inspecteur
  le texte complet ; React le rend comme texte, sans interpréter le HTML.
- Chaque côté possède trois accroches à 25, 50 et 75 % de sa longueur. Les
  identifiants centraux historiques restent les mêmes. Les menus choisissent
  le point ; « Afficher les trois points par côté » montre les cibles
  supplémentaires. Elles sont désactivées quand elles sont masquées, afin de
  conserver le geste de dépôt imprécis aux faibles zooms.
- « Ajouter un point de passage » ou un double-clic sur le lien sélectionné
  insère un détour. Glisser une poignée ou utiliser les flèches le déplace ;
  double-clic, Suppr ou Retour arrière le retire. Vingt points maximum.
- Les détours sont des segments droits en coordonnées de toile. Leurs points
  restent fixes quand les cartes changent de place ; les extrémités suivent
  leurs accroches. Ils priment sur les trajets ELK. « Revenir au trajet
  automatique » retire les détours et conserve les autres réglages.
- Commentaire, ports, trajet et apparence partagent le même aperçu : aucune
  écriture de campagne pendant la frappe ou le déplacement. « Appliquer »
  enregistre une fois ; Annuler, Échap et fermeture abandonnent l'aperçu.
  Le retour au style du thème conserve commentaire, ports et détours.

Les champs restent facultatifs dans `StyleDeLienDeTrame` ; les anciennes
campagnes gardent leur apparence et leurs quatre accroches centrales.
La normalisation écarte les coordonnées non finies, les trajets trop longs et
les points d'accroche inconnus, et copie les points pour ne pas partager le
brouillon mutable avec le magasin. ELK tient compte des ports décentrés ; un
trajet ancien n'est pas réutilisé après une modification de port.

## Contrôles et reprise

Trois défauts ont été trouvés par les gestes Electron : les poignées SVG
héritaient de la désactivation des événements du calque des liens ; les cibles
supplémentaires gênaient la prise centrale aux faibles zooms ; une zone
supplémentaire du trait pour le double-clic recouvrait les poignées d'extrémité.
Les événements des poignées sont explicites, les points supplémentaires
s'affichent volontairement, et le double-clic utilise le trait existant sans
calque supplémentaire. Le moteur pouvait encore attirer vers un port masqué
puis refuser le dépôt ; la reconnexion retrouve désormais le port visible le
plus proche sur la même carte, dans son rayon de 24 pixels à l'écran.
Les deux essais historiques des extrémités passent à deux zooms, sans écriture
de campagne pendant l'aperçu. Les autres gestes déjà livrés sont relancés.

**Contrôles réussis** : validation complète `npm.cmd run validate`, code 0,
types, lint global (1 527 fichiers, zéro erreur, 540 avertissements), **6 802
tests dans 528 fichiers** ; un fichier et quatre tests ignorés, construction.
Après les corrections des gestes, la version finale est reconstruite (types
inclus) et le lint des composants est propre. Les **18 scénarios Electron
distincts passent sur cette version** : deux de prise des extrémités, cinq
d'édition avancée, trois de sélection multiple et huit de styles. Ce sont des
campagnes témoins dans des profils jetables ; aucune donnée de David n'est lue.
Les quatre [captures de la galerie](graphe-trame/edition-avancee/index.html)
sont relues, à 1 440 × 900 et 900 × 700.
Les 29 captures régénérées par les régressions sont conservées dans
`graphe-trame/edition-avancee/regressions/` ; les images des lots historiques
retrouvent leurs octets antérieurs, sans toucher à leurs manifestes.

Les tests unitaires couvrent les imports anciens, les valeurs invalides, la
copie des points au magasin, la sérialisation et le vrai ELK aux ports décentrés.
Les gestes Electron vérifient la frappe, le clic, le glissement, le clavier,
l'annulation, l'application, le retour au thème et la restitution après relance.

Ancres : `stylesDesLiensDeTrame.ts`, `trajetsDeTrame.ts`, `adapterLeGrapheDeTrame.ts`,
`CarteDeTrame.tsx`, `LienDeTrame.tsx`, `InspecteurDeLienDeTrame.tsx`,
`e2e/editionAvanceeDesLiensDeTrame.spec.ts`. Le guide 11 est actualisé.
Premier retour de David le 08/10 : **« les points de passage sont difficile à
bouger, ils ne se déplacent que vers le bas et par pas de 1 uniquement »**.
GM-OS fermé confirmé avant le correctif. L'essai dans Electron reproduit la
perte du focus après une seule flèche : le cercle DOM est remplacé. À chaque
aperçu, la toile remplaçait ses cartes par des objets sans leurs mesures ;
React Flow effaçait alors les limites des ports et retirait temporairement les
liens pendant leur nouvelle mesure. Le point perdait aussi sa capture de souris.

La toile conserve désormais les mesures des cartes dont la taille reste la
même. Le glissement utilise le déplacement depuis la prise initiale, sans
aimantation à une grille ni saut vers le centre du curseur. L'inspecteur lit
directement le brouillon du graphe et reste monté pendant le geste, conservant
son défilement. Les autres réglages et le fonctionnement Aperçu/Appliquer restent
identiques. Le nouveau scénario Electron vérifie les quatre flèches sans
refocaliser, plusieurs pressions successives, une prise par le bord et une
trajectoire continue dans quatre directions à deux zooms, puis la sauvegarde.
Les essais précédents ne vérifiaient qu'une flèche vers le bas et que le point
avançait après un glissement : ils pouvaient passer malgré une capture interrompue.
Après correction : `npm.cmd run build` (types inclus) et lint global réussis
(1 527 fichiers, zéro erreur, 540 avertissements inchangés), **19 scénarios
Electron distincts réussis en 4,2 minutes** : six d'édition avancée, deux de
prise des jonctions, trois de sélection multiple et huit de styles. Le contrôle
unitaire complet de 6 802 tests ci-dessus précède ce correctif ; il n'est pas
annoncé comme relancé. Le nouveau scénario est relancé avec l'assertion de
défilement stable de l'inspecteur : il passe également. Les 30 captures de
régression régénérées sur cette version sont conservées dans la galerie du lot,
en préservant les images historiques.

**Essai de David validé le 08/10 après correction** : **« c'est bon documente,
commit et push »**. Le lot est clos : commentaires, accroches multiples et
trajets manuels, avec déplacement continu des points. David demande sa
documentation, son commit et son push ; les modifications étrangères restent
hors de ce lot.
