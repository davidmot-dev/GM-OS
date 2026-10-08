# Cinquième lot du lint — messages et projections du Hub

David demande le 08/10 **« commit, pousse et passe à l'étape suivante (GM-OS est
éteint) »**. Le quatrième lot, magasins du Hub, est commité et poussé sous
**`777adc68`** sur `origin/feature/tablet-hub-pwa`, après les contrôles complets du
hook. Ce lot poursuit l'étape 2 de l'audit : les contrats des données exécutées.

## Contrat partagé avec l'émetteur

`src/modules/remote/types/donneesDuHub.ts` décrit les données réellement appliquées
par le Hub. Les segments dérivent des champs des magasins par des imports de
types seuls : Session, combat, horloges, dés, carte et tableau blanc. Ils ne
portent aucune méthode et restent partiels pour les diffusions différentielles.
Les verrous, favoris, réserves par campagne, configuration des dés et données
de cartes sont déclarés avec leurs modèles réels. Le DTO de la télécommande
`RemoteSyncData` reste une vue plus réduite ; il n'est pas affirmé comme un état
complet de Session ou de l'horloge.

`useNexusSynchronizer` contrôle ses diffusions rapides et complètes sous ce
contrat. Deux écarts ressortent : les combattants reconstruits omettaient la
faction, désormais transmise ; les avatars/portraits vides devenaient `undefined`,
désormais conservés comme chaînes vides conformément au modèle des joueurs.
Le caviardage reprend les types des tableaux réels. Les PNJ cachés restent
écartés, les retours de séance retirés et les notes secrètes masquées. Les cartes
cachées restent expurgées à la source par `mainsPourLaTable`.

Les deux conversions locales de l'émetteur concernent sa propre charge déjà
contrôlée : le résultat du comparateur différentiel, qui conserve ses valeurs,
et la copie JSON pour le caviardage. Le type du jet admet une Date par IPC ou sa
chaîne par JSON ; il ne prétend pas que JSON préserve une Date.

## Réception et fusion

`src/modules/remote/lectureDuHub.ts` reçoit des `unknown`, relit les conteneurs,
scalaires et champs nécessaires aux consommateurs du Hub, puis ne retient que
les champs de données déclarés. La conversion de ces données est regroupée à
cette frontière. **Cette lecture n'est pas une validation exhaustive de tous
les modèles métier imbriqués** : ceux-ci restent construits sous le contrat
typé de l'émetteur. Elle ne constitue pas un nouvel import de campagne.

Une charge dont un champ connu est mal formé est ignorée avant toute application.
Les champs supplémentaires ne peuvent pas remplacer les méthodes d'un magasin.
Aucun défaut n'est injecté dans un diff : tableaux vides, zéro, `false` et `null`
restent des valeurs explicites ; les champs absents restent absents. Une date de
jet valide est restaurée avant insertion dans le magasin des dés.

`useHubSync` applique les segments par fusion Zustand et type les mises à jour
de Session. Les campagnes, gabarits, cartes et autres champs absents d'un diff
restent en place ; les réserves ne réécrivent que la campagne diffusée. Le jeton
en cours de saisie conserve ses coordonnées locales, tout en recevant les autres
champs ; la charge reçue n'est pas mutée. L'alias `characterLocks` et les verrous
`connectedCharacters` gardent leur ordre de priorité. La règle existante qui
conserve l'identifiant de campagne lors d'un `null` reçu reste en place. Le nom
de campagne garde son précédent repli s'il ne peut pas être déduit, plutôt que
de poser `undefined` dans un champ déclaré `string | null`.

Les projections d'entité reprennent `ProjectedEntity` ; les règles reprennent
la forme du lecteur. Les deux voies IPC/WebSocket relisent ces projections, les
messages de séance et les scalaires de son/latence. Une projection invalide ne
remplace pas la précédente. `BLACKOUT` pose toujours `null` et `FULL_RESET`
toujours `undefined`, pour distinguer écran noir et retour au décor.

## Contrôles

**Huit nouveaux cas** : sept exercent le véritable hook par IPC/WebSocket et
ses magasins, un exerce l'émetteur avec faction, portraits vides et caviardage.
Les deux anciennes gardes de source du décor sont adaptées à la nouvelle
relecture de l'enveloppe, et le comportement est aussi éprouvé au runtime.

`tsc -b`, construction et lint global passent. **1 537 fichiers, zéro erreur,
389 avertissements**, contre 409. Les **20 `any` retirés sont applicatifs** :
17 dans le Hub et trois dans le synchroniseur. Restent 365 `any` (141 applicatifs,
224 dans les tests), 20 effets, trois diagnostics de mémoïsation et une directive
inutile. Les règles ne changent pas, l'inventaire JSON garde les 540 alertes initiales.

**128 tests ciblés dans 14 fichiers**, puis **6 846 tests dans 533 fichiers**
passent ; un fichier et quatre tests sont ignorés. Les cinq scénarios Electron
passent : Direct/projections à 390 px et les quatre gardes de remise à zéro du
Player Hub. Les profils sont jetables, les ports ceux des tests et les appareils
muets. Les captures vont dans un dossier temporaire, sans modifier le manuel.
`git diff --check` passe.

## Reprise

Lot réalisé et documenté : sept fichiers de code/tests et cinq documents.
Publication demandée par David : **« commit, pousse et passe à l'étape suivante
(GM-OS est éteint) »**. Le commit publié au début du tour précédent concerne le quatrième lot.
Reprendre `CrossWindowEventService` : contrat des messages entre fenêtres,
autorité de projection du MJ, positions des jetons saisis et absence de renvoi.
Les 20 effets, le typage des autres domaines et les faux objets de tests suivent.
Les changements antérieurs de Claude sont conservés hors du lot.
