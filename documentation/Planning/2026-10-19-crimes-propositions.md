# Crimes - améliorations proposées après lecture du manuel et de NotebookLM

Analyse de Codex, **19/10/2026**, sur la demande de David d'examiner le pilote Crimes,
le *Manuel de l'Enquêteur* et NotebookLM. **Propositions uniquement : aucun développement
lancé, aucune modification du pilote, du corpus ou de la fiche.** Les priorités ci-dessous
sont proposées, pas des décisions de planification de David.

À la demande suivante de David, un [registre des améliorations de Crimes](2026-10-19-registre-ameliorations-crimes.md)
a été créé le 19/10/2026. Il porte désormais les états, décisions et dépendances des lots C0-C8 ;
le présent audit conserve les constats et références. Tous les lots sont à planifier.

## Périmètre et preuves

- Base du dépôt : `b2437ed8`, intégration Crimes par Claude Code, postérieure à la création
  de la fiche HTML. La fiche et son raccord ne sont donc plus des travaux à faire.
- Pilote examiné : `Export Dirvers/corriges/Crime_driver_gmos_relie.gmos-driver`, dont
  `state.json` est identique à `Export Dirvers/corriges/crime_state.json`. C'est l'export
  corrigé associé au raccord validé par David. Les données applicatives personnelles n'ont
  pas été consultées : l'audit ne prétend pas lire l'état d'une campagne en cours.
- Livre fourni : `\\CLOUDDAVID\Media\Jeux de Rôle\02. Contemporain\2. Ambiance\Crimes\Crimes 2 - Manuel de l'Enquèteur.pdf`.
  Copie de lecture : `scratch/crime-audit/manuel-enqueteur.pdf`, 498 pages PDF.
  Les références ci-dessous sont les **pages imprimées** ; dans cette partie du livre,
  ajouter **2** pour retrouver la page PDF. Les pages 385, 395, 396 et 437 ont aussi été
  rendues et vérifiées visuellement.
- [Carnet NotebookLM Crimes](https://notebooklm.google.com/notebook/d0f433f5-7b16-46c3-acf4-4c88c5b5ac2c).
  Deux consultations limitées à la source du Manuel de l'Enquêteur
  `cfb994d9-4bc8-467c-8d7f-bbdbd2ba0a73`, sans mélanger le Manuel du Criminel et une synthèse
  du système. Réponses avec citations : `scratch/crime-audit/notebook-jets.json` et
  `notebook-mecaniques.json`. Les renvois et généralisations ont été contrôlés dans le PDF ;
  les suggestions de NotebookLM ne font pas autorité sur le livre.
- Preuves exécutables en lecture seule : `scratch/crime-audit/constats.mjs` et
  `constats.json`. Elles interrogent le préparateur de jet et le moteur actuels, sans lancer
  l'application ni modifier les sources. Elles ne constituent pas un essai d'interface.

## Acquis à conserver

La fiche `crimes-fr` comporte deux pages, 335 zones et 197 clés stables. Sa correspondance
couvre 196 clés ; le portrait est explicitement exclu. Le gestionnaire embarqué v13 inclut
la fiche. `npm.cmd run fiche:valider -- Crimes` passe avec **0 erreur et 0 avertissement**.

Le pilote corrigé comporte **12 sections et 203 champs**, dont les 12 compétences,
55 spécialisations, les cinq styles d'enquête, les indices, les contacts et les jauges
psychologiques. Le thème, la bannière et l'identité d'images existent déjà. Leur présence
ne signifie cependant pas que leurs règles sont automatisées : plusieurs champs servent
aujourd'hui essentiellement à noter des valeurs.

## C0 - Relire le corpus avant de régénérer le pilote (priorité 0)

Les **19 fiches de règles** de `docs/systems/crime/rules/` sont marquées `relu: false`.
Trois écarts vérifiables peuvent produire de mauvais automatismes :

| Sujet | Corpus actuel | Manuel et correction à préparer |
| --- | --- | --- |
| Points d'enquête | Réserve consommable permettant notamment de faire valider une hypothèse | Cumul et accès à des indices/preuves, p. 436-438 ; ne pas inventer une dépense générale ni faire décider les déductions par l'outil |
| Santé | Mort à -2 et blessure grave dès -1 | Incapacité à 0, p. 395 ; blessure grave **en dessous de -1**, p. 396, avec conséquences physiques et psychologiques. Ce passage n'établit pas une mort automatique à -2 |
| Résolution | Cinq degrés ordonnés, dont une réussite importante prioritaire | Quatre bilans du jet p. 385 ; l'importance d'une réussite sert notamment à une conséquence sur la Névrose p. 409, sans supprimer la comparaison avec les 1 |

La fiche sur les points d'enquête contient aussi des **traces de réponses d'outils et de
commandes**. Ce sont des parasites du corpus, pas des instructions à exécuter.

Prévoir une relecture des 19 fiches avec pages imprimées, exemples et distinction entre règle
mécanique, option et décision narrative du MJ. Ne pas transformer les « peut » en obligations.
**Acceptation :** les trois contradictions ci-dessus et les traces parasites ont disparu ;
les décisions de limites et de seuils ont une source ou sont explicitement laissées au MJ.

## C1 - Implémenter réellement « Potentiel GARDE Compétence » (priorité 0)

Le pilote déclare encore `engine: pool`, une réserve de **0 dé**, la compétence comme seuil
et une difficulté fixe de 9. La préparation d'un jet Physique 5 / Combat 2 produit ainsi
`nombreDeDes: 0`, `seuil: 2`, `reussitesRequises: 9`, sans avertissement.

Le livre p. 385 demande de lancer autant de d10 que le **potentiel actuel**, puis de garder
le nombre de dés autorisé par la compétence. Le seuil par dé est 9 sans compétence,
8 avec compétence et 7 avec la spécialisation appropriée. Tous les 1 sont obligatoires ;
le joueur peut aussi choisir de garder de mauvais résultats.

**Contre-exemple reproduit :** Physique 5, Traque 2, seuil 8, dés `[1, 3, 4, 6, 8]`.
Le livre garde `[1, 8]` et conclut à une **réussite mitigée**. Même en lui fournissant déjà
le bon nombre de dés et le bon seuil, `DiceEngine.rollPool` actuel donne « 1 Brut / 0 Net »,
`tagSuccess: false`, `degre: echec-normal`. Corriger le seul JSON ne suffit donc pas.

Il faut un mode de conservation des dés, une sélection explicite des spécialités pertinentes,
les 1 obligatoires, les quatre bilans, et une présentation des dés lancés/gardés/écartés.
Conserver la même résolution dans les vues MJ, joueur, tablette et journal. Prévoir les
jets psychotiques et les jets sans compétence dans les cas particuliers.

**Acceptation :** l'exemple p. 385 produit le bon bilan ; zéro réussite reste un échec ;
les 1, le choix volontaire de mauvais dés et les spécialisations fonctionnent. Clarifier
avant codage le cas des 1 plus nombreux que le quota et les jets sans compétence, sans
déduire toute leur procédure d'un seul exemple du livre.

## C2 - Distinguer potentiel de base, potentiel actuel et atteintes (priorité 1)

Le pilote stocke les trois potentiels comme nombres simples et sa santé de combat comme
des PV fondés sur Physique. Or le livre p. 395-396 distingue fatigue, épuisement et blessures,
dont la récupération et la gravité diffèrent. Les atteintes peuvent aussi toucher d'autres
potentiels ; le jet doit utiliser la valeur actuelle, sans effacer la valeur de base.

Prévoir des marques typées par potentiel, un calcul de valeur actuelle et des actions de fin
de scène/repos/soin. La fin de scène enlève la fatigue ; une bonne nuit enlève une marque
d'épuisement dans chacun des potentiels concernés. Les blessures et traumatismes restent
soumis aux règles de soin et aux décisions du MJ. Ne pas imposer un délai de guérison unique
à partir des exemples indicatifs du livre.

**Acceptation :** une fatigue réduit le prochain jet sans changer la base, la fin de scène
la retire sans retirer une blessure, et une blessure grave ne déclenche pas une mort inventée.
Préserver les valeurs existantes lors de toute évolution du format de fiche.

## C3 - Faire du dépassement un geste de jeu suivi (priorité 1, dépend de C1-C2)

Le dépassement conserve des réussites supplémentaires déjà obtenues et coûte **un point de
fatigue dans le potentiel utilisé par réussite supplémentaire**. Ce n'est ni une relance,
ni un achat avec de l'Angoisse. L'usage normal est limité à une fois par scène, justifié par
passion ou conviction et arbitré par le MJ (p. 385, 406-407). Le combat prévoit une exception
d'accès, même sans passion engagée (p. 389).

Afficher les réussites supplémentaires disponibles, le coût et le bilan obtenu avant
validation ; noter l'usage et le remettre à disposition au changement de scène. Prévoir
les contradictions de principes qui empêchent le dépassement (p. 414).

**À résoudre avec une règle explicite :** p. 385 impose l'annonce avant le jet, tandis que
des exemples p. 407 envisagent une décision après lecture des dés. Conserver une validation
MJ et documenter le choix de procédure au lieu d'en faire une certitude silencieuse.

## C4 - Relier les jauges psychologiques à leurs seuils (priorité 1)

Les champs Angoisse/Névrose/Psychose/Innocence sont présents, mais leurs événements et leurs
seuils demandent une assistance. En particulier, les seuils individuels de Névrose et
d'Innocence ne doivent pas rester à leur valeur générique 0 lors d'une nouvelle création.

Prévoir, avec proposition de conséquence et validation du MJ :

- Névrose atteignant ou dépassant son seuil : division par deux arrondie à l'inférieur,
  +1 Psychose et épisode déterminé par le MJ (p. 409).
- Test psychotique : Mental GARDE un nombre de dés lié à l'intensité, seuil Psychose +
  Angoisse, sans dépassement ; gestion de la Déchéance à Psychose 10 (p. 410).
- Angoisse élevée : rappeler les possibilités de contrainte et de difficulté laissées au MJ,
  sans imposer partout un test ou un seuil 9 (p. 411-412).
- Innocence : distinguer valeur, seuil et effets selon l'âge (p. 415-416).

**Acceptation :** modifier une jauge montre les conséquences pertinentes, leur origine et
permet de les confirmer sans doublon. Les symptômes et réactions restent joués, pas tirés
arbitrairement à chaque variation.

## C5 - Créer un véritable dossier d'enquête par affaire (priorité 1)

C'est l'amélioration la plus caractéristique de Crimes : relier les cinq styles à une
affaire, ses scènes, ses témoins, ses pièces et ses preuves. La fiche dispose déjà de
compteurs de styles et de lignes d'indices ; elle ne remplace pas ce suivi partagé.

Proposer des gains/pertes de points lorsque les actions font réellement avancer l'enquête,
des seuils par style définis par le MJ, et des indices avec états caché/découvert/partagé.
Les points s'accumulent pour ouvrir des possibilités (p. 436-438) : ne pas les transformer
en monnaie générique, ni imposer un jet pour un indice évident. Relier les pièces aux lieux,
PNJ et hypothèses ; laisser les joueurs formuler et discuter leurs conclusions.

**Acceptation :** une action utile crédite le bon style ; un seuil atteint signale au MJ
l'indice disponible sans le révéler au mauvais public ; partager un indice conserve son
origine. Une divergence de méthode peut être arbitrée et notée sans gain automatique de
Psychose lors d'une simple discussion.

## C6 - Adapter le combat et les armes (priorité 2)

L'initiative `physique + combat - angoisse` existe déjà : ce n'est pas une fonction absente.
La compléter pour respecter les cas narratifs, les égalités et la compétence/potentiel
effectivement utilisés (p. 388), plutôt que généraliser cette formule à toute situation.

Relier les armes à leur portée utile/maximale, aux modificateurs de réussite, aux protections,
aux munitions et aux incidents ; gérer les oppositions et les blessures sur les mêmes
potentiels que C2 (p. 388-396). Les tranches tactiques actuelles sont génériques et incohérentes
avec leurs étiquettes : « contact » va jusqu'à 10 unités, « 10 mètres » jusqu'à 20, etc.,
toutes à modificateur nul. Elles ne modélisent pas les portées propres aux armes du livre.

**Acceptation :** l'arme choisie détermine sa portée et ses conséquences ; les oppositions
et arbitrages ne deviennent pas de simples pertes de PV génériques.

## C7 - Donner une vie aux contacts et à la fortune (priorité 2)

Les contacts actuels ont un nom et une seule note. Le manuel distingue influence, domaines
d'aide, loyauté et évolution de la relation (p. 425-430). Prévoir un lien vers le PNJ ou la
faction, loyauté de base/actuelle, services, intrigues, amis/ennemis et informations MJ.
Une sollicitation diminue la loyauté actuelle, restaurée en fin de scénario ; le recours
aux amis d'un contact reste ponctuel et n'ajoute pas automatiquement un contact permanent.
La disparition d'un contact très proche peut avoir une conséquence psychologique (p. 430).

La fortune a déjà deux champs distincts, niveau et piste. Les relier aux variations et au
passage de niveau, sans présenter le niveau de fortune comme une réserve dépensable de
combat (p. 430-431). Vérifier la définition du seuil avant d'automatiser un passage à 10.
Relier aussi les données d'équipe existantes au suivi de l'affaire sans inventer des règles
pour tous leurs compteurs.

## C8 - Aider la création et la progression, puis documenter (priorité 2)

Ajouter un assistant facultatif : âge/adulte/enfant, budgets, rangs de compétences,
spécialisations autorisées, tempérament, seuils et points de développement (p. 323-324,
404-405). Proposer une dépense expliquée et validée par le MJ, avec historique, au lieu
de simplement augmenter les chiffres. Les 17 compteurs de compétences/styles ne sont pas
à interpréter comme des dépenses automatiques sans avoir vérifié leur signification.

**Limites à vérifier :** la fiche imprimée offre dix positions pour les potentiels tandis
que le pilote les borne à 5. Le livre prévoit des valeurs humaines exceptionnelles au-delà
de 5 (p. 323) et borne explicitement à 5 la croissance par Innocence (p. 416). Ce dernier
passage ne justifie donc pas, à lui seul, un plafond universel. Conserver la présentation
validée et distinguer les contextes de création/progression avant de modifier ses bornes.

À chaque lot réalisé : mettre à jour le manuel des jeux et créer la page `54-Jeu-Crimes`,
avec captures selon `e2e/capturesDesJeux.spec.ts`. Décrire ce qui fonctionne réellement.
Les exemples de résolution C1 et les transitions de jauges C2-C4 doivent servir à des tests
de règles, complétés par la vérification des écrans concernés.

## Ordre recommandé et périmètre technique

**C0 → C1 → C2/C3 → C4 → C5**, puis C6-C8. Le dossier d'enquête peut être conçu en parallèle
des règles, mais ses automatismes doivent reposer sur des règles relues. C5 offre le gain
le plus spécifique au jeu ; C1 rend d'abord ses jets utilisables correctement.

Le corpus et certains raccords de champs relèvent des données. Le mode GARDE, le résultat
mitigé et la gestion cohérente des états demandent du code partagé : notamment
`src/types/drivers.ts`, `src/modules/dice/DescripteurDeJet.ts`, `DiceEngine.ts` et les lecteurs
de résultats. Ce ne sont pas des capacités obtenues en changeant uniquement un export JSON.

Aucun code applicatif ni document de règles modifié par cet audit. Le registre général,
déjà modifié par un autre travail, est laissé intact pour respecter l'écrivain unique.
Avant un éventuel développement dans `src/` ou `electron/`, respecter la question préalable
sur l'exécution de GM-OS imposée par AGENTS.md.
