# Vingt-neuvième lot du lint — couture des fiches

David demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
Les neuf fichiers Codex du lot 28 relais/persistance sont commités en
**`853a9a28`**, sans fichier étranger. **Aucun push demandé ni effectué** ;
dernier poussé `8e6a0939`. Les contrôles du lot précédent restent ceux
consignés dans sa note : types, construction, lint zéro erreur/176
avertissements, 140 tests ciblés et 7 198 tests globaux. Les anciennes mentions
« non commités » décrivent l'état avant cette demande.

## Les 38 annotations du groupe

`electron/coutureDesFiches.test.ts` charge toujours **le vrai moteur HTML du
dépôt** dans JSDOM. Seul le gabarit de contrôle remplace les gabarits intégrés.
Le fichier HTML et les sources des constructeurs restent intacts.

- La fenêtre reprend `DOMWindow` et une surface explicite de `RPGSheet` :
  données, gabarit, bibliothèque, création/ouverture et changements issus des
  contrats existants de GM-OS. Les données libres restent inconnues.
- Le faux IndexedDB conserve seulement les opérations exercées par le moteur,
  des magasins de valeurs inconnues, des requêtes génériques et leurs callbacks.
  Sa surface partielle est installée sans conversion vers une `IDBFactory`
  prétendument complète. Microtâches et références conservées.
- Les éléments DOM requis sont recherchés avec leurs types ; une absence fait
  échouer le scénario avec son sélecteur. Les lectures de personnage/gabarit
  ouverts refusent explicitement leur absence. `getData()` reste nullable et
  son état nul avant ouverture est toujours testé.
- Les événements remontés utilisent `ChangementDeFiche`. Le harnais conserve
  l'injection de demandes inconnues, son origine `null` et son hôte partiel.
  Les messages émis distinguent réponse et diffusion ; le résultat d'une
  réponse reste `unknown`. Assertions de structure et garde de lecture de
  l'identifiant du personnage remplacent les accès non typés.
- La réponse attendue se cherche toujours par identifiant, jamais par rang.
  La recherche sans exception reste utilisée dans les attentes asynchrones ;
  la réponse obligatoire n'est lue qu'une fois reçue.
- La sauvegarde a une description locale pour les champs inspectés dans ces
  essais ; le contrat applicatif continue de transporter son contenu inconnu.
  `restore` accepte toujours les données invalides/nulles des tests de refus.

Les **neuf fonctions** publiées sont vérifiées, avec la version 2 ; le libellé
du test disait huit et est corrigé. Les assertions sur les valeurs, le dessin,
les diffusions, la persistance et la restauration sans effacement restent.
Les replis CSS existants sont conservés dans un helper local.

## Contrats partagés sans charger le renderer

Le premier contrôle TypeScript révélait deux erreurs `appBridge` : importer
les types depuis `pontDeLaFiche.ts` entraînait la vérification de son code et
de `portsDuRenderer.ts` dans le projet Electron, hors du contexte global du
renderer. Le problème vient de la frontière de cet import, pas du moteur HTML.

Les **sept interfaces** sont déplacées à l'identique dans
`src/modules/fiches/contratsDeLaFiche.ts`, qui ne porte que des types. Le pont
les réexporte sous leurs noms existants ; ses appelants ne changent pas.
Le test importe ce fichier de contrats directement, sans charger l'implémentation.
Comparaison avec le commit : déclarations déplacées identiques, reste du pont
inchangé hormis import/export de types. Aucune signature ni comportement du
pont modifié, aucune configuration TypeScript assouplie.

## Contrôles

**132 tests ciblés dans huit fichiers** passent : couture du moteur HTML,
pont côté GM-OS, poussée des données, copie de bibliothèque, hôte de fiche,
correspondance du jeu et rapprochement des données. Le passage ciblé précède
l'extraction des interfaces, sans changement du code exécuté ; les contrôles
globaux portent sur les fichiers finaux. Aucun nouveau cas nécessaire pour
ce typage ; les scénarios existants du moteur sont conservés.

Le lint ciblé des trois fichiers est propre. **Types (`npx tsc -b`) et
construction passent** après extraction. Lint global : **1 585 fichiers,
zéro erreur et 138 avertissements**, contre 176. Restent **134 `any`, tous
dans les tests**, trois diagnostics de mémoïsation et une directive inutile.
Comptage recoupé par fichier, règles et inventaire JSON initial inchangés.
Moteur lu depuis le dépôt, gabarit et stockage artificiels ; aucun profil
réel utilisé, paquet installé, service démarré ou scénario Electron lancé.

La suite complète passe : **7 198 tests dans 566 fichiers**, un fichier et
quatre tests ignorés. Types, lint, construction et suite complète contrôlent
les fichiers finaux après extraction ; `git diff --check` propre.

## Reprise

Lot 29 réalisé, validé et documenté, **huit fichiers Codex non commités** (trois de
code/tests, cinq documents). Dernier local **`853a9a28`**, dernier poussé
**`8e6a0939`**. La demande de commit portait sur le lot 28 terminé ; le nouveau
lot reste à commiter à la prochaine demande. Modifications étrangères des
guides, de la note du 07/10, de l'e2e et de `.claude` préservées.

Reprendre **purge/détenteurs (28)**, dans `src/services/purge/detenteurs.test.ts` :
typer les magasins factices et les fixtures par les contrats des détenteurs,
en conservant les gardes et les scénarios. Puis les autres groupes par contrat,
dont contexte Oracle (12) et enregistrement SyncServer (9). Les captures du
manuel (27) restent distinctes. Terminer ensuite les trois diagnostics de
mémoïsation et la directive inutile. La migration PDF v1/v2 du § 1 bis reste
un sujet séparé ; ne pas rouvrir les contrats ou changer le moteur HTML.

## Mise à jour — lot 29 commité

À la nouvelle demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**,
les huit fichiers Codex sont commités en **`c282f2f7`**, sans fichier étranger.
Aucun push demandé ; dernier poussé `8e6a0939`. Les contrôles précédents ne
sont pas rejoués pour le commit. La suite est le
[lot 30 purge/détenteurs](2026-10-09-lint-purge-detenteurs.md) ; les mentions
« non commités » ci-dessus décrivent l'état avant cette demande.
