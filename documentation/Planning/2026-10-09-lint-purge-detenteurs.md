# Trentième lot du lint — tests de purge/détenteurs

David demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
Le lot 29 couture des fiches est commité en **`c282f2f7`**, uniquement ses huit
fichiers Codex. Aucun push demandé ; dernier poussé **`8e6a0939`**. Les contrôles
du lot 29 sont ceux déjà consignés : types, construction, lint zéro erreur/138
avertissements et 7 198 tests globaux. Ils ne sont pas rejoués pour ce commit.
Les anciennes mentions « non commités » décrivent l'état avant cette demande.

## Les 28 annotations retirées

Seul `src/services/purge/detenteurs.test.ts` change dans le code. Les détenteurs,
le service de purge et les magasins applicatifs gardent leur implémentation.

- Les onze magasins factices conservent leur fabrique d'état, `getState`,
  `setState`, remise à zéro et lecture. Les callbacks de suppression reprennent
  les signatures de `SessionOSState` et restent des espions sans cascade réelle.
- Les collections vides reprennent les types des magasins ou des modèles.
  Les fixtures partielles utilisent des projections `Pick` : scènes, paquets,
  pilotes, playlists, moments, gabarits et cortex. Campagnes, modèles de fiche
  et journaux rendent facultatifs uniquement les champs absents de certains
  scénarios (jeu, nom, titre). Aucun objet incomplet n'est converti vers le
  modèle complet ou vers un magasin Zustand complet.
- Les cartes dont seule la clé intéresse ces tests gardent leurs valeurs
  `unknown` : combats garés, état des paquets, répartitions et sélection Ulanzi.
  Les sentinelles des fixtures et les valeurs des réserves restent identiques.
- Le faux agrégateur des pilotes transporte la même projection que le magasin
  de session. Les imports ajoutés sont uniquement des imports de types.
- Le lecteur d'un détenteur est générique sur sa cible, selon `Detenteur<Cible>`.
  Une absence du module attendu fait échouer le test avec son nom. Les cibles
  de campagne et de pilote ne se confondent plus derrière une annotation libre.
- Le détenteur volontairement fautif est typé et continue de lever son erreur
  au recensement. Les callbacks de lecture des identifiants sont inférés.

Les assertions et données des scénarios restent : scènes figées avant purge,
combats des autres scènes épargnés, playlist détachée, journal supprimé par
identifiant et non par titre, réserves de la seule campagne, modules cochés,
modèle partagé/intégré protégé, frontière `dnd:`/`dnd-5e:`, surcharge du cortex
retirée et paquet supprimé avec son état. Les appels de suppression du modèle
et du pilote restent vérifiés. Aucun scénario n'est retiré ou remplacé.

## Contrôles

**21 tests passent dans les deux fichiers de purge**, comportement des détenteurs
et complétude du registre des magasins persistés :

```powershell
npx vitest run src/services/purge/detenteurs.test.ts src/services/purge/registreComplet.test.ts --maxWorkers=4
```

`npx tsc -b` passe et le lint ciblé est propre. Un comptage des nœuds `AnyKeyword`
TypeScript recoupe **28 avant, zéro après** dans le fichier corrigé.
Lint global : **1 585 fichiers, zéro erreur et 110 avertissements**, contre 138.
Restent **106 `any`, tous dans les tests**, trois diagnostics de mémoïsation
et une directive inutile. Comptage recoupé par fichier et règle ; règles et
inventaire initial inchangés. `git diff --check` propre.

Le contrôle est limité aux tests de purge et aux types globaux pour ce lot qui
ne modifie que leur harnais. La construction et la suite complète du lot 29
restent les dernières validations globales d'exécution ; elles ne sont pas
annoncées comme rejouées. Aucun e2e, profil réel, paquet ou service utilisé.

## Reprise

Le nouveau lot porte **six fichiers Codex non commités** : un test et cinq
documents. Dernier local **`c282f2f7`**, dernier poussé **`8e6a0939`**.
Les modifications étrangères des guides, de la note du 07/10, de l'e2e et de
`.claude` sont préservées. Le lot 30 sera commité à la prochaine demande.

Reprendre **le contexte Oracle (12)** dans `src/modules/ai/hooks/useOracleContext.test.ts`,
puis **l'enregistrement SyncServer (9)**. Vérifier leurs contrats avant de typer
les simulations. Les captures du manuel (27) restent un groupe distinct ;
terminer ensuite les trois diagnostics de mémoïsation et la directive inutile.
La migration PDF v1/v2 reste séparée au § 1 bis. Ne pas refaire la couture ni
transformer les espions de purge en vrais magasins persistants.

## Mise à jour — lot 30 commité

À la nouvelle demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**,
les six fichiers Codex sont commités en **`e377d82c`**, sans fichier étranger.
Dernier poussé `8e6a0939` ; aucun push demandé. Les contrôles ci-dessus ne sont
pas rejoués pour le commit ; les mentions « non commités » sont historiques.
La suite est le [lot 31 contexte Oracle](2026-10-09-lint-contexte-oracle.md).
