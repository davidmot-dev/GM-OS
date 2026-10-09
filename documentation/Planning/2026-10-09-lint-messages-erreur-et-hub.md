# Vingt-septième lot du lint — messages d'erreur et dé du Hub

David demande **« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
Les 13 fichiers Codex du lot 26 calcul/recherche/audio sont commités en
**`b612123a`**, puis poussés sur `origin/feature/tablet-hub-pwa`, depuis
`567f94de`. Le hook complet passe : types, lint zéro erreur/229 avertissements,
**7 177 tests dans 562 fichiers**, construction. Un fichier et quatre tests
ignorés ; aucun fichier étranger inclus, aucune modification applicative
pendant le push.

## Les six derniers avertissements applicatifs

- `ForgeDashboard.tsx` : exception inconnue lors de l'import d'une source.
  La reconnexion reste déclenchée par le seul marqueur `MCP_AUTH_EXPIRED` ;
  pas d'élargissement aux autres erreurs d'authentification.
- `JournalDashboard.tsx` : exception inconnue et message de synchronisation,
  avec traduction de repli calculée seulement en l'absence de message.
- `useJournalStore.ts` : exception inconnue retransmise intacte. Aucun
  emballage dans une nouvelle `Error`, aucune mutation du journal en échec.
- `LootGeneratorPanel.tsx` : exception inconnue de génération IA, même
  notification traduite et même repli historique `Error`.
- `useNotebookLM.ts` : exception inconnue du carnet, même phrase
  « Rupture de liaison » et même repli `Erreur MCP`.
- `HubDiceDisplay.tsx` : `lastRoll` reprend `RollRecord | null`, le vrai contrat
  du magasin et de son appelant. La conversion redondante de `rolls` disparaît ;
  affichage, styles et garde d'absence de jet restent.

**Coordination du Hub, 09/10 :** David répond **« Oui, corriger aussi le dernier
`any` du Hub »** à la demande de reprendre ce fichier déjà modifié en conservant
ses changements. Ses fins de ligne existantes sont préservées : 71 CRLF et
quatre LF. Cette réponse remplace l'attente de coordination des notes précédentes.
Les autres modifications étrangères restent intactes.

## Lecture des exceptions et effet fonctionnel

Le petit utilitaire `messageDException` accepte une valeur inconnue : `Error`,
objet structuré ou fonction portant un message. Il reprend le choix historique
d'un message non vide, converti en texte, puis le repli propre à chaque écran.
Un texte lancé directement comme exception conserve le repli historique ;
les replis sont paresseux. Le magasin du journal n'utilise pas cet utilitaire :
il transmet l'exception sans transformation.

Le retrait des annotations révèle un défaut fonctionnel : accéder à
`null.message` provoquait une seconde exception au lieu d'afficher le diagnostic.
Un message numérique cassait également `.includes` dans la Forge. Les gardes
corrigent ces cas ; ce lot ne constitue donc pas seulement un changement de
types. Constat et correction sont consignés au § 1 bis du registre. La
classification des erreurs, les messages ordinaires et les remises à zéro
des indicateurs de chargement restent.

## Contrôles ciblés

**84 tests dans huit fichiers** passent, dont **21 nouveaux cas dans quatre
fichiers** : douze sur l'utilitaire, quatre sur le vrai hook NotebookLM,
trois sur le vrai magasin du journal et deux sur le panneau de butin.
Les cas vérifient les messages structurés, numériques et absents, le repli
paresseux, l'identité de l'exception retransmise, la conservation du journal
et de la saisie, ainsi que la reprise après échec.

Les essais existants du résumé de séance, du service de Forge, des jets de
fiche et des degrés de réussite passent également. Ils ne constituent pas
un essai de reconnexion dans l'écran de Forge ni un essai sur tablette du Hub.
La compilation contrôle son appelant réel. Pont, campagne et réponses IA
artificiels ; aucun profil réel ou service distant utilisé par les nouveaux cas.

## Contrôles globaux et reprise

**Types et construction passent.** Lint global : **1 584 fichiers, zéro erreur
et 223 avertissements**, contre 229. Restent **219 `any`, tous dans les tests**,
trois diagnostics de mémoïsation et une directive inutile. Comptage recoupé
par emplacement dans le rapport final ; aucune règle abaissée, directive
ajoutée ou modification de l'inventaire JSON initial. Aucun paquet installé
ni service démarré manuellement.

La suite complète passe : **7 198 tests dans 566 fichiers**, un fichier et
quatre tests ignorés. `git diff --check` propre. Tous les contrôles portent
sur le code et les tests finaux ; aucun scénario Electron lancé.

Lot 27 réalisé et documenté, **16 fichiers Codex non commités** (onze de
code/tests, cinq documents). Dernier commit local et poussé **`b612123a`**.
Le commit/push demandé portait sur le lot 26 déjà terminé ; ce nouveau lot
reste à commiter à la prochaine demande.

Reprendre les **simulations et fixtures de tests par contrats communs**,
puis les diagnostics de mémoïsation et la directive. Le rapport actuel compte
notamment 38 `any` dans `coutureDesFiches.test.ts`, 28 dans `detenteurs.test.ts`,
33 dans les deux tests du relais `CrossWindowEventService` et 12 dans
`persistanceDesStoresPartages.test.ts`. Le groupe relais et persistance
partagée est un prochain lot cohérent à relire, plutôt qu'une sélection
arbitraire des plus gros fichiers. Les captures du manuel (27) restent un
groupe distinct. Préserver les fichiers étrangers ; la migration PDF v1/v2
du § 1 bis reste séparée.
