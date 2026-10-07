# Trame — déplacer les connexions sur les quatre côtés

**07/10/2026, suite du chantier § 124.** David signale : « je n'arrive pas à déplacer
une connexion sur le dessus ou le dessous d'une case », avec une capture montrant
plusieurs flèches superposées à gauche d'une scène. Il confirme **« GM-OS est fermé »**.

Les côtés étaient imposés par le graphe. Le nouveau réglage choisit indépendamment
le départ et l'arrivée parmi **Haut, Bas, Gauche, Droite**. Hors Relier, cliquer le
trait ouvre ces deux choix dans l'inspecteur. Sélectionner le lien montre aussi ses
deux extrémités déplaçables et les accroches de ses cartes : on peut glisser une
extrémité vers un autre côté de **la même carte**.

Les deux gestes donnent un aperçu local. **Appliquer** conserve les côtés avec les
autres réglages, en une écriture par lien et par campagne. Annuler, fermer ou Échap
retrouve le choix enregistré. Glisser après un aperçu de couleur conserve aussi
ce brouillon. Le dépôt ailleurs laisse le lien en place ; la reconnexion sur une
autre carte est refusée. Ce geste ne change ni l'appartenance, ni l'ordre des scènes,
ni la condition, ni les renvois du scénario.

**Revenir au style du thème** garde les jonctions enregistrées en retirant seulement
le tracé, l'épaisseur et la couleur personnels. **Revenir aux jonctions par défaut**
prévisualise les côtés d'origine, puis Appliquer les conserve. Ranger et réinitialiser
les positions gardent les jonctions. Une campagne ancienne conserve ses côtés d'origine.

Les champs optionnels `depart` et `arrivee` complètent `StyleDeLienDeTrame`, dans la
carte des réglages `Campaign.stylesDesLiensDeTrame`. Le normaliseur écarte les côtés
inconnus. Un réglage de jonction seul conserve l'opacité, le tracé et l'épaisseur par
défaut : déplacer un trait structurel ne le rend pas plus voyant.

Ancres : `stylesDesLiensDeTrame.ts`, `adapterLeGrapheDeTrame.ts`, `CarteDeTrame.tsx`,
`ToileDeLaTrame.tsx`, `InspecteurDeLienDeTrame.tsx`, `GrapheDeLaTrame.tsx`,
`grapheDeTrame.css`, `campaign.types.ts` et `e2e/stylesDesLiensDeTrame.spec.ts`.

Les quatre accroches sont des sources en mode React Flow Loose : une accroche peut
servir de départ ou d'arrivée, et le calcul du départ trouve toujours le bon côté.
Les identifiants historiques `sortie`, `entree`, `haut` et `bas` sont conservés.
Le mode Relier conserve ses gestes ; le déplacement des extrémités est disponible
uniquement hors Relier, sur le lien sélectionné.

## Contrôles

Construction/types et lint des neuf fichiers réussis. **716 tests ciblés dans
57 fichiers passent**. **33 scénarios E2E distincts passent** : le dernier lot de
31 scénarios en 5,5 minutes, plus les contrôles ciblés de relance/A → B → A et de
glissement des deux extrémités. Ils vérifient les seize couples de côtés, le retour
au thème sans perdre les jonctions, l'annulation, la conservation de l'aperçu de
couleur, les écritures, les cartes reliées et les anciens gestes Relier.

Les deux captures des jonctions (1440 et 900 pixels) sont relues, ainsi que les
24 captures de cartes régénérées, sur quatre planches. Voir la
[galerie](graphe-trame/edition-liens/index.html#jonctions) et le
[manifeste des jonctions](graphe-trame/edition-liens/jonctions-controles.json).
Tous ces essais utilisent des profils isolés et des données fictives.

Deux pièges du banc sont corrigés : le moteur termine le trait au bord extérieur
de l'accroche, pas au centre du petit cercle ; et ouvrir l'inspecteur réduit la
toile sans changer le cadrage. Le banc cadre les cartes avant le geste, pour ne pas
viser le panneau qui recouvre alors une carte hors toile. La tolérance de contrôle
des extrémités reste inférieure à un pixel.

L'essai de David reste attendu. Les commentaires, trajets manuels et accroches
multiples sur un même côté restent des propositions ; aucun commit/push demandé.
