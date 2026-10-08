# Quatrième lot du lint — accès aux magasins du Hub

David demande le 08/10 **« commit, pousse et passe à l'étape suivante (GM-OS est
éteint) »**. Les actions Session distantes sont commitées et poussées sous
**`63cccdda`**, après les contrôles complets du hook. Ce lot poursuit l'étape 2
de l'audit : les contrats entre magasins et messages.

## Contrat de lecture et d'exposition

`src/utils/magasinsDuHub.ts` associe les douze noms globaux employés par le Hub
aux états de leurs magasins réels. Les états dérivent de `getState` par des
imports de types seuls. Le contrat de l'adaptateur se limite à `getState`, `setState` et
`subscribe` ; il ne demande pas au Hub de charger les modules.

`magasinDuHub(nom)` rend le magasin correspondant ou `undefined` s'il n'est
pas chargé. La conversion du global est regroupée dans cet adaptateur.
`exposerMagasinDuHub(nom, magasin)` applique le même contrat aux douze points
d'exposition : images, horloge, favoris, combat, Session, identité client,
synchronisation volatile, dés, carte, interface de carte, tableau blanc et
réserves de table. `NoInfer` empêche que le magasin fourni élargisse le type du
nom pour contourner la correspondance. Les déclarations globales existantes
restent compatibles ; les écritures ne passent plus par `any` ni par un
dictionnaire sans relation avec le nom.

`useMagasin` déduit l'état du nom choisi et le résultat de son sélecteur.
Son repli ne participe pas à cette inférence. Les tableaux de repli restent
des constantes de module, désormais `never[]`, compatibles avec les tableaux
des différents domaines. L'abonnement garde la référence de Zustand et le
nombre de hooks reste fixe, magasin présent ou absent.

Les favoris, PNJ et lieux résolus reprennent leurs types de domaine. Leurs
filtres et transformations, ainsi que la recherche d'un jeton local, sont
typés par inférence. Les deux minuteurs emploient `ReturnType<typeof setTimeout>`.
Les médias, filtres de partage et cadences restent les mêmes.

## Contrôles

`tsc -b` et la construction passent. Les **242 tests ciblés dans 14 fichiers**
passent, notamment les magasins qui apparaissent/disparaissent, le repli
stable de l'horloge, le décor du Hub, le combat projeté, les dés, la
persistance partagée, les gardes entre fenêtres et les ressources de table.
Les scénarios existants couvrent ces comportements ; aucun test reproduisant
seulement le nouveau helper n'est ajouté.

Lint global : **1 534 fichiers, zéro erreur et 409 avertissements**, contre
433. Les **24 `any` retirés sont applicatifs** : 15 dans `useHubSync` et neuf
aux points d'exposition. Les trois autres points d'exposition étaient déjà
sans `any`. Restent 385 `any` (161 applicatifs, 224 dans les tests), 20 effets,
trois diagnostics de mémoïsation et une directive inutile. Les règles ne
changent pas.

La version finale passe la suite complète : **6 838 tests dans 532 fichiers**,
un fichier et quatre tests ignorés. **Six scénarios Electron/tablettes passent** :
les quatre gardes de remise à zéro du Player Hub, le don/retrait d'objet et
la fiche avec PV/réserve à 390 px. Les profils sont jetables, les ports sont
ceux des tests et les appareils sont muets. Les captures préexistantes du
manuel sont conservées à l'identique. `git diff --check` passe.

## Reprise

Ce quatrième lot est validé : quatorze fichiers de code et cinq documents.
Publication demandée par David : **« commit, pousse et passe à l'étape suivante
(GM-OS est éteint) »**. L'accès aux magasins est typé ; les **charges reçues par le Hub
restent à typer**, avant `CrossWindowEventService`. `useHubSync` conserve 17
`any` sur ces charges, leurs fusions et les projections, ainsi que son effet
de déclenchement des dés. Ne pas les retirer en affirmant que `RemoteSyncData`
est l'état complet du Hub : ce DTO ne décrit ni toutes les données Session
appliquées, ni l'horloge effectivement émise.

Vérifier ensemble le message construit par `useNexusSynchronizer`, sa
sérialisation et les types des magasins destinataires. Le synchroniseur
reconstruit notamment les combattants et les portraits : un type de magasin
complet ne doit pas être affirmé sur une charge réduite sans adapter le contrat.
Conserver les gardes sur les jetons saisis, la fusion des données de fiche,
les réserves par campagne, les manifestes/cartes et les données caviardées.
Les 20 effets et les autres domaines/tests viennent ensuite ; l'inventaire
JSON garde les 540 alertes initiales.
