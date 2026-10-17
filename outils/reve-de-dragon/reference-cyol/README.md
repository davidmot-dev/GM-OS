# Référence Cyol — outils RdD et TMR

Sources publiques récupérées le **18/10/2026**, à la demande de David :
« est-ce que tu peux récupérer une partie du code ? ».

**Paquet d’étude, sans raccordement à GM-OS.** Les scripts originaux et les extraits ne sont
pas importés par l’application. Aucun comportement mécanique nouveau n’est activé.

## Provenance et crédits

Les [crédits complets](CREDITS.md) accompagnent les sources. Sur demande explicite de David
le 18/10/2026, ils devront aussi être accessibles dans le futur module via « Crédits et licences ».

- Œuvre : **Les Terres Médianes du Rêve : Outils**.
- Auteur crédité : **Cyol**, corrections créditées à **Kroc**.
- Site : <https://scriptarium.org/RdD/tmr/> ; sources : <https://scriptarium.org/RdD/tmr/tmr.zip>.
- Version annoncée par la page : **21, 04/01/2017 — corrigée par Kroc**.
- Licence annoncée : [Creative Commons Attribution 3.0 France](https://creativecommons.org/licenses/by/3.0/fr/).
- Les en-têtes de licence des originaux sont conservés. Les extraits portent le titre, les
  auteurs, l’URL source, la licence et la description de notre modification : sélection de
  fonctions et ajout d’une notice, **corps des fonctions inchangés**.
- `tmrHexagon.js` cite également une adaptation de [rrreese/Hexagon.js](https://github.com/rrreese/Hexagon.js)
  et un article sur la géométrie. Conserver ces mentions et vérifier les conditions de cette
  dépendance lors d’une adaptation du rendu.
- Les illustrations et bibliothèques tierces ne sont pas copiées dans ce paquet. Les pages
  HTML conservées servent à documenter l’interface, les crédits et la licence ; elles ne
  constituent pas une application autonome locale.

## Contenu

| Fichier/dossier | Usage |
| --- | --- |
| `originaux/tmr.js` | Script principal exact : données et carte TMR, rencontres, fatigue, rêve, outils de résolution, stress et astrologie. |
| `originaux/tmrHexagon.js` | Rendu de grille et détection des cases, avec dépendances au navigateur et aux données du script principal. |
| `originaux/tmr.css` | Styles originaux, référence pour comprendre l’affichage. |
| `originaux/index-en-ligne.html` | Page HTML servie par le site le jour de la récupération. |
| `originaux/index-archive.html` | Page HTML contenue dans l’archive officielle ; elle diffère de la page servie. |
| `extraits/` | 26 fonctions sélectionnées en cinq groupes, sans réécriture de leur corps. |
| `fonctions.json` | Index des 74 fonctions de premier niveau de `tmr.js`, avec lignes de début et de fin. |
| `sources.json` | URLs, auteurs, licence annoncée, empreintes SHA-256, comparaison archive/site et origine précise des extraits. |

L’archive complète (1 008 828 octets) est conservée hors suivi Git dans
`scratch/reve-de-dragon-sources/tmr.zip`. Ses deux scripts et sa CSS sont identiques octet par
octet aux versions en ligne téléchargées ; les deux HTML sont conservés séparément.

## Extraits et dépendances

| Groupe | Fonctions et limites |
| --- | --- |
| `des.js` | `diceRoll`, `lanceD`, `dDr`. Dépend de `Math.random` ; aucun journal de tirage ni gestion d’autorité MJ. |
| `resolution.js` | Pourcentage et quatre seuils de résultat. Calculs à comparer au livre, pas un remplacement du moteur RdD existant. |
| `stress.js` | `gainXp`. Dépend de `resolution.js` et `des.js` ; peut tirer un second jet. Ne gère ni l’allocation aux compétences ni l’Archétype. |
| `astrologie.js` | Tirage astral, calcul et dessin de la roue. Dépend de jQuery, du DOM, des canvas et des images/globales du script d’origine ; pas un module autonome. |
| `geometrie.js` | Coordonnées cubiques/décalées, distances et portée. Les fonctions de coordonnées décalées utilisent aussi la globale `offsetCol`. |

Les extraits sont des déclarations classiques, sans exports ESM ni adaptateur GM-OS. Ils
permettent d’étudier et de reprendre les fonctions ; leur simple juxtaposition ne fournit pas
un module complet.

Les fonctions de voyage (`monteTMR`, `deplaceJoueur`, `arriveNouvelleCase`,
`rencontreNouvelleCase`, `actionRencontre`, `rencontreMaitrisee`, `rencontreNonMaitrisee`,
`augmentationFatigue`, `ajustementReve`, `refoulement`, `quitteTMR`, etc.) sont repérées dans
`fonctions.json` et conservées dans l’original, avec leurs données et dépendances. Elles
manipulent directement l’interface ; il faudra séparer leurs règles du DOM pour GM-OS.

La qualité et les points de tâche sont calculés dans `lanceD100`, également repérée dans
l’index. Ce calcul ponctuel ne constitue pas un suivi d’ouvrage persistant.

## Écarts et fonctions incomplètes

- `souffleDragon`, `queueDragon` et `teteDragon` sont encore des fonctions avec `TODO` dans
  cette version. Ne pas annoncer que leurs conséquences sont automatisées.
- Pour 30 % de chances à ajustement 0, `getEchecTotalSeuil` du site donne **93** ; la table
  de `src/modules/dice/systemes/revesDeDragons.ts` donne **94**. Revoir la source primaire et
  l’édition avant de choisir ; ne pas remplacer la table existante par cette approximation.
- Le site annonce les règles de la deuxième édition. La fidélité de tous ses calculs aux
  règles n’a pas été validée par cette récupération.

## Raccordement envisagé, à concevoir

Codex reste responsable du module externe TMR (lot R8). Le pilote décrit les champs ; les
règles communes de GM-OS contrôlent les conséquences ; le module affiche et transmet les
choix. La fiche doit garder une seule réserve de rêve et une seule fatigue.

Une commande de déplacement devra être vérifiée par l’autorité du MJ puis enregistrer ensemble
position et conséquences mécaniques, avec identification de commande pour éviter une double
dépense sur double appui ou reconnexion. Le contrat actuel doit être étudié pour cette opération :
aucun pont vers les fiches ni mécanisme transactionnel n’est livré ici.

Commencer par un mode assisté (proposition des conséquences, validation du MJ) est une
recommandation de conception, pas encore un choix confirmé par David. Les outils hors TMR
correspondent aux lots R3/R5/R7 et à la proposition supplémentaire de qualité des actions ;
coordonner leur moteur commun avec Claude Code.

## Vérifier et reproduire la sélection

Depuis la racine du dépôt, avec les dépendances déjà installées :

```powershell
node outils/reve-de-dragon/reference-cyol/verifier-reference.mjs
```

Le contrôle relit les empreintes, les corps extraits et la syntaxe JavaScript ; il n’exécute
pas les scripts récupérés et ne valide pas les règles du jeu.

Après récupération des mêmes fichiers dans `scratch/reve-de-dragon-sources/` (archive `tmr.zip`
et dossier `en-ligne/` contenant `index.html`, `tmr.js`, `tmrHexagon.js`, `tmr.css`), régénérer :

```powershell
node outils/reve-de-dragon/reference-cyol/preparer-reference.mjs
```

Ne pas lancer les originaux pour tester GM-OS. Leur adaptation nécessitera des essais de règles
et d’intégration distincts. Aucun paquet installé, service réseau démarré ou fichier `src/` ou
`electron/` modifié pour cette livraison.
