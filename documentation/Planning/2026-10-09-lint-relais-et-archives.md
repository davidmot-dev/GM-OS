# Vingt-cinquième lot du lint — relais et archives

David demande **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
Les 18 fichiers du lot 24 IA/fournisseurs sont commités en **`2215836b`**.
Pas de push demandé ni effectué ; dernier poussé **`10cce98e`** sur
`origin/feature/tablet-hub-pwa`. Aucun fichier étranger inclus.

## Contrats repris dans le groupe de dix avertissements

- `electron/SyncServer.ts` (6) : adresse du transport `ws` décrite par la
  propriété `remoteAddress` de `Socket`, enveloppe des messages avec charge
  `unknown` et champs supplémentaires, inscription issue des arguments du
  vrai registre de session, exception inconnue et diffusion opaque.
- `src/App.tsx` (1) : contrat repris directement de `dispatchRemoteAction`.
- `LobbyMonitor.tsx` (1) : magasin global de session déjà déclaré dans `Window`.
  L'éjection, le retour visuel immédiat et la remise à zéro des verrous restent.
- `useFavoriteStore.ts` (1) : vrai magasin global d'image, y compris l'option
  de projection forcée et l'extinction par `null`. Pas d'import supplémentaire
  du moteur d'image ni de modification de la synchronisation des favoris.
- `NexusService.ts` (1) : mise à jour partielle du vrai magasin de session.
  Les remplacements par campagne et les fusions de decks/pilotes restent.

Les contrats attendus des JSON et de l'inscription sont des conversions
locales à la frontière du relais, **pas une validation des messages reçus**.
Le rôle et le jeton restent inconnus jusqu'aux contrôles existants. La lecture
de `_socket` garde le champ interne utilisé jusque-là, absent des types publics
de `ws` ; aucune nouvelle ouverture réseau ni modification du transport.
Les charges primitives, nulles ou structurées et les champs supplémentaires
sont transmis tels quels. Le contrôle de propriété précède toujours le relais
P2P ; les destinations personnage, `all` et `GM` restent distinctes.

La relecture de l'exception d'inscription garde `character_taken` pour les
objets structurés comme pour `Error`. Une exception nulle n'entraîne plus
d'accès à `err.message` : elle suit le silence historique des autres exceptions
du registre. Aucun nouveau filtre, règle abaissée ou directive de lint ajoutée.

## Contrôles ciblés

**269 tests dans 21 fichiers** passent : inscription/appairage, politique
d'autorisation, handlers distants, projection d'entité et archives. **18 nouveaux
cas** : 15 dans `SyncServer.relais.test.ts`, trois dans `completudeDuBundle.test.ts`.

Le relais est exercé par ses écouteurs de messages avec le vrai registre de
session et la vraie politique d'autorisation : adresse transport, charges
opaques, destinations P2P/MJ, refus de privilège et d'usurpation, ping,
JSON invalide suivi d'un message valide, dernier socket avant mode fantôme,
collision structurée et diffusion filtrée par rôle/socket ouvert. Sockets,
fenêtre, secret et journal de sécurité simulés ; aucun serveur démarré.

Les essais d'injection distinguent archive ancienne sans trame/journaux,
tableaux explicitement vides et remplacement avec nouveaux éléments.
Ils vérifient la conservation des autres campagnes et une seule écriture
du magasin principal ; l'écriture des journaux reste dans son magasin séparé.
Magasins et archives artificiels, aucun profil ou fichier réel de David lu.

## Contrôles globaux et reprise

**Types (`npx tsc -b`) et construction passent.** Lint global : **1 578
fichiers, zéro erreur et 238 avertissements**, contre 248. Restent **234
`any` : 15 applicatifs et 219 dans les tests**, trois diagnostics de
mémoïsation et une directive inutile. Comptage recoupé par emplacement dans
le rapport final ; aucun changement des règles ni de l'inventaire JSON initial.
**7 165 tests dans 561 fichiers** passent, un fichier et quatre tests ignorés.
`git diff --check` propre. Aucun scénario Electron nécessaire pour ce lot de
contrats ; les chemins de relais et d'injection sont exercés avec sorties simulées.
Aucun paquet installé ni service lancé manuellement.

Lot 25 réalisé, validé et documenté, **12 fichiers Codex non commités**
(sept de code/tests, cinq documents). Dernier commit local **`2215836b`**,
dernier poussé **`10cce98e`** ; pas de push lors de cette reprise.

Reprendre **Calcul, recherche et audio (9)** : `useSpotlight.ts` (3),
`useSheetCalculator.ts` (2), `CalculationEngine.ts` (2), `DiceUIUtils.ts` et
`ChimeEngine.ts` (1 chacun). Puis messages d'erreur (5), dé du Hub (1) après
coordination, tests (219) et diagnostics mémoïsation/directive. Le dé du Hub
était modifié hors Codex et reste intact ; la demande de reprise de ce fichier
n'a toujours pas reçu de réponse. Préserver les autres changements étrangers.
La migration PDF v1/v2 du § 1 bis reste un sujet séparé.
