# Trame — choix de la disposition automatique, 07/10/2026

David valide la sélection multiple par **« ok c'est très bien »**, puis demande
**« maintenant pour finir est-ce que je peux avoir des types de rangement
automatique, en étoile et ligne etc... ? »**.

## Ce qui est construit

Un menu **Disposition** est ajouté près de l'espacement et d'**Organiser** :

| Choix | Placement attendu |
| --- | --- |
| Automatique | Organisation ELK actuelle, regroupée par acte, orientation adaptée à la toile. |
| Étoile | Scène carrefour au centre lorsque l'acte en a une, sinon acte au centre ; autres scènes autour. |
| Ligne horizontale | Scènes de chaque acte de gauche à droite, dans leur ordre. |
| Colonne verticale | Scènes de chaque acte de haut en bas, dans leur ordre. |
| Arbre | Branches narratives disposées de haut en bas par ELK. |
| Grille | Scènes en rangées et colonnes adaptées à l'espace disponible. |

Les annexes restent proches de leur scène ; les éléments partagés ne sont jamais
dupliqués. Les blocs d'actes et les dimensions réelles des cartes sont pris en
compte pour éviter les chevauchements. Les formes imposées peuvent étendre le
graphe ; Cadrer reste disponible. Aucun arrangement ne garantit l'absence de
tout croisement entre liens. Les formes imposées utilisent des courbes avec les
côtés de jonction existants ; Automatique et Arbre conservent le routage ELK à
angles droits. La grille réserve plusieurs rangées et colonnes dès quatre scènes.
Les blocs d'actes occupent leur propre rectangle, pas celui du plus grand acte.

Conserver **Compact / Équilibré / Aéré**, la portée sur la vue visible, l'aperçu
sans écriture, Appliquer en une écriture et Disposition précédente après relance.
Conserver couleurs, épaisseurs et côtés de jonction. L'histoire, les actes et
l'ordre des scènes ne changent pas. Les anciennes organisations restent lisibles
sans champ de disposition. Ranger conserve son rôle actuel sur la Trame entière.

## État

David confirme **« GM-OS est fermé »** avant les modifications. Développement
construit et contrôles terminés ; essai de David attendu. Aucun paquet ni service supplémentaire ;
aucun commit/push demandé.

Ancres : `formesDeTrame.ts` (cellules scène/annexes, formes et placement des blocs),
`organiserLaTrame.ts` (choix ELK ou forme imposée), `campaign.types.ts` (forme
optionnelle compatible avec les anciennes dispositions), `GrapheDeLaTrame.tsx`
(menu, aperçu et restauration des choix), `grapheDeTrame.css` (commandes repliables),
`ToileDeLaTrame.tsx` (cadrage des rectangles réels après redimensionnement),
`formesDeTrame.test.ts` et `e2e/formesDeTrame.spec.ts`.

## Contrôles

- Construction et vérification TypeScript réussies (`npm.cmd run build`) ; lint
  ciblé sur huit fichiers sans diagnostic ; **724 tests dans 60 fichiers** passent
  avec `--maxWorkers=4`.
- **34 scénarios Electron distincts validés**, tous avec profils et campagnes
  fictifs isolés : trois nouveaux et 31 de régression. Le dernier lot de régression
  passe 29 scénarios ; deux échouent sur les coordonnées de glissement du banc,
  puis passent individuellement après correction du banc, sans changement du
  code applicatif. Le banc attend la caméra et choisit une carte visible.
- Vraies géométries : étoiles et lignes reconnaissables, grille multi-rangées,
  absence de chevauchement, toutes les cartes placées une seule fois, cycles et
  éléments partagés conservés.
- Electron isolé : les six choix, changer de forme en aperçu, annuler sans écrire,
  appliquer une fois, retour précédent et relance ; styles et sélection multiple
  toujours utilisables.
- Sept captures des formes et de la fenêtre étroite, ainsi que douze planches de
  régression (cartes, liens, organisation dans les quatre apparences), relues ;
  guide 11, registre et note du jour actualisés.

Pièges payés : centrer les scènes sur les rayons de l'étoile, plutôt que centrer
leurs cellules d'annexes ; ne pas réserver aux petits actes toute la largeur du
plus grand ; une grille à quatre scènes doit se distinguer d'une ligne. La forme
et l'espacement reviennent après relance ou retour à la disposition précédente.
La grille étroite révélait un débordement du cadrage natif : le cadrage est recalculé
après la fin du déplacement de vue à partir des positions centrales,
des dimensions déclarées et de la taille disponible. Le banc vérifie les quatre
bords de chaque carte après redimensionnement, pas seulement leur présence.
Les bancs de glissement attendent aussi la fin du cadrage et du zoom animés avant
de relever les coordonnées d'une prise : la sauvegarde des positions ne signifie
pas que la caméra a déjà fini son mouvement.
Dans la trame dense, une carte hors écran après zoom ne constitue pas une cible
de glissement : le banc choisit une carte dont le centre est visible et accessible.

Les preuves finales sont dans [la galerie](graphe-trame/formes/index.html) et son
manifeste. Les manifestes des lots précédents gardent leurs valeurs historiques.
