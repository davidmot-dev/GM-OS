# Vingt-troisième lot du lint — interfaces et fiches

Le 08/10, David demande **« commit et passe à l'étape suivante (GM-OS est
éteint) »**, après sa demande de regrouper les corrections sans perdre en
qualité. Les lots 21 et 22 sont commités séparément : **`093c4203`** (cinq
fichiers, migrations dés/gemmes et notes associées), puis **`6d22466d`**
(21 fichiers, commandes/synchronisation et trois documents communs).
Les 26 fichiers Codex en attente ont ainsi été rangés ; aucun push demandé
ou exécuté. Les modifications étrangères restent hors de ces commits.

## Contrats repris

Le premier groupe du plan du lot 22 contient 23 avertissements applicatifs.
**22 sont retirés dans 16 fichiers**, en reprenant les contrats existants :

- Horloge du Hub : `ClockMode`, `ClockTheme`, `TensionClock` (3).
- Inventaire du Hub : `TransferRequest` et `FavoriteEntity` (2).
- Combat : dictionnaire numérique des jauges et faction du combattant (3).
- Santé : les champs `hp/maxHp` des vrais porteurs, avec les mêmes replis (2).
- PNJ : rôle déjà typé et fonction de traduction i18next (2).
- Gabarits : deux fonctions `TFunction` (2).
- Règles : deux listes de navigation littérales (2).
- Chronologie : événement de campagne ou article daté, distingués par leur
  provenance ; catégorie du formulaire issue du modèle (3).
- Éditeur de personnage : paramètre réel d'ajout d'inventaire (1).
- Pilotes : métadonnées d'inventaire, avec formule de quantité numérique ou
  textuelle ; l'éditeur de tables reprend ce contrat (1).
- Graphe social : méthodes publiques du moteur et vrais types de nœuds (1).

Le graphe perd aussi **deux `any` déjà désactivés**, hors compteur, et leurs
deux directives. Aucune règle abaissée, aucune nouvelle suppression.
Les traductions, navigation, replis de santé et métadonnées existants restent.

**Un avertissement du groupe reste dans `HubDiceDisplay.tsx`**, modifié hors
Codex avant cette session. Son diff de contenu est vide, mais AGENTS.md
impose un seul écrivain par fichier. L'autorisation de le reprendre a été
demandée ; aucune réponse reçue à la clôture, aucun changement Codex dedans.
Le contrat à reprendre est `RollRecord | null`, déjà exporté par le magasin
des dés. Ne pas inclure ce fichier dans le prochain commit sans coordination.

## Écarts fonctionnels révélés par le typage

Ils sont signalés séparément dans le registre (§ 1 bis, ancres au § 127),
pour ne pas présenter ces corrections comme un simple changement de types.

**Chronologie — décision de David :** à la question des sept boutons du
formulaire face aux cinq catégories du modèle et des filtres, David répond
le 08/10 **« Aligner le formulaire sur les cinq catégories du modèle
(recommandé) »**. Le formulaire propose désormais `session`, `combat`,
`quest`, `lore`, `major-event`. Le libellé traduit de l'événement majeur
reprend la clé `major`. Aucune réécriture des événements déjà enregistrés ;
les anciennes valeurs éventuelles ne sont pas migrées dans ce lot.

**Inventaire manuel :** les deux chemins de création, Entrée et bouton,
omettent les champs obligatoires `weight` et `properties`. Ils reçoivent les
valeurs neutres `0` et `{}`. Nom, quantité et autres champs restent ; aucune
réécriture des objets déjà enregistrés.

**Graphe social :** la version installée de `react-force-graph-2d` expose
`d3Force` et `d3ReheatSimulation`, mais aucune `d3Simulation`. L'ancien appel
échouait dans les réglages ; les gardes de libération/réinitialisation
n'accédaient jamais aux nœuds vivants. Un auxiliaire reprend les forces D3
nommées, libère `fx/fy` sur les objets du graphe en conservant `x/y`, puis
relance par l'API publique. `undefined` libère la coordonnée pour D3 et
respecte le type du SDK, qui exclut `null`. Les modifications de réglages
relancent la simulation ; pas d'appel privé à `alphaTarget`.
L'effet réagit aussi à l'apparition du canevas après son dimensionnement :
au premier rendu, la référence n'existe pas encore. Le délai historique de
150 ms pour la réinitialisation reste, avec relecture de la référence.

## Contrôles

**32 tests ciblés dans six fichiers** passent, dont **16 nouveaux cas** dans
quatre fichiers. Les vrais composants vérifient les cinq catégories à la
création, la réédition sans mutation et le filtre majeur ; l'édition conserve
l'objet complet et le clic Wiki ouvre le bon article. Le graphe est essayé
avec seulement son API publique, dès l'apparition du canevas et lors des
commandes de libération/réinitialisation. Les forces sont aussi vérifiées
avec D3 réel ; une simulation arrêtée puis avancée confirme qu'un nœud
libéré peut bouger. Positions à zéro, autres épingles, identités et nœud
inconnu sont couverts. Magasins, avatars et canevas simulés, aucun profil,
appareil ou réseau réel sollicité.

**Types (`npx tsc -b`) et construction passent.** Lint global : **1 572
fichiers, zéro erreur et 263 avertissements**, contre 285. Restent **259
`any` : 40 applicatifs et 219 dans les tests**, trois diagnostics de
mémoïsation et une directive inutile. Comptage recoupé par emplacement
dans le rapport final ; règles et inventaire JSON initial inchangés.

Suite complète : **7 124 tests dans 556 fichiers** passent, un fichier et
quatre tests ignorés. `git diff --check` passe. Aucun scénario
Electron lancé pour ce lot ; les gestes modifiés sont couverts ci-dessus,
sans déplacement de l'interface ni changement des captures du manuel.

## Reprise

Lot 23 réalisé, validé et documenté, **non commité : 28 fichiers Codex**
(23 de code/tests, cinq documents), dernier local `6d22466d`, dernier
poussé documenté `861eaca4`. Le commit demandé au début de cette reprise
concernait les lots 21–22 déjà terminés. Le prochain commit peut séparer
les correctifs fonctionnels explicités ci-dessus du reste des contrats.

Reprendre **IA et fournisseurs : 15 `any`** dans `AIService.ts` (8),
`useTacticalAIStore.ts` (3), `ForgeService.ts` (1), `HueEngine.ts` (1),
`electron/RAGEngine.ts` (2). Les autres groupes restent relais/archives (10),
calcul/recherche/audio (9), messages d'erreur (5), plus le dé du Hub (1) en
attente de coordination. Puis les tests et les diagnostics ciblés.
Préserver les changements de Claude ; ne pas toucher aux profils de David.

## Reprise suivante — commit et push réalisés

À la demande de David **« commit, pousse et passe à l'étape suivante
(GM-OS est éteint) »**, le lot 23 est commité en **`c5935958`** (sept fichiers,
correctifs fonctionnels), puis **`10cce98e`** (21 fichiers, contrats et cinq
documents). Le push réussit jusqu'à `10cce98e`, avec le hook complet : types,
lint (263 avertissements, zéro erreur), 7 124 tests, construction. Les mentions
précédentes « non commité » décrivent l'état avant cette demande.
La [reprise du 09/10](2026-10-09-etat-et-reprise.md) et le
[lot 24 IA/fournisseurs](2026-10-09-lint-ia-et-fournisseurs.md) portent l'état
suivant. Aucun changement étranger inclus ; `HubDiceDisplay.tsx` reste intact.
