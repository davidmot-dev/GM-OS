# Vingt-huitième lot du lint — tests du relais et de la persistance

David demande **« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
Les 16 fichiers Codex du lot 27 messages d'erreur/Hub sont commités en
**`8e6a0939`**, puis poussés sur `origin/feature/tablet-hub-pwa`, depuis
`b612123a`. Le hook complet passe : types, lint zéro erreur/223 avertissements,
**7 198 tests dans 566 fichiers**, construction. Un fichier et quatre tests
ignorés ; aucun fichier étranger inclus, aucune modification dans `src/`
ou `electron/` pendant le push.

## Un groupe de 47 avertissements

Le groupe prévu relais/persistance (45) inclut aussi les deux annotations du
pont dans le test du transport, qui exerce le même contrat. **Quatre fichiers
de tests**, aucun fichier applicatif modifié :

| Fichier | `any` retirés | Contrat repris |
| --- | ---: | --- |
| `CrossWindowEventService.test.ts` | 16 | Magasins partiels issus de leurs vrais états, abonnement typé et messages émis discriminés |
| `CrossWindowEventService.relay.test.ts` | 17 | Service et magasin issus du vrai chargement de chaque fenêtre ; callbacks et tracés inférés |
| `windowTransport.test.ts` | 2 | Installation du pont factice par Vitest, lecture du pont déclarée et restauration de sa valeur initiale |
| `persistanceDesStoresPartages.test.ts` | 12 | Cas génériques liant chaque magasin à ses mises à jour et à son témoin |

Le canal factice reçoit toujours des données inconnues : les messages mal
formés restent injectables pour éprouver les gardes. Ses sorties décrivent
les sept messages du service. Les faux magasins commencent toujours vides,
ne portent que les champs posés par les scénarios et conservent leur fusion
historique ; les états partiels ne sont pas présentés comme des magasins
complets. L'abonné réel du service est récupéré depuis un mock typé.

Les tests du volume des tracés chargent désormais une instance neuve pour
chaque scénario, au lieu de forcer `hasReceivedSharedState` et
`lastBroadcastPaths` à travers un `any`. Les gardes et le cache sont donc
exercés depuis leur vrai état de démarrage. Le setter de combat substitué
pour observer la garde anti-boucle est restauré après le scénario.

Le harnais à deux fenêtres garde deux graphes de modules et deux magasins
indépendants. Il utilise toujours le vrai relais et sa politique de rôle,
avec livraison asynchrone et neutralisation des anciens ponts par génération.
Le pont partiel ne simule que le relais, puis retrouve sa valeur initiale.
Dans le test du transport, les rôles absents ou invalides restent volontairement
injectables pour éprouver la frontière, même hors du contrat du preload.

## Persistance : conserver le lien entre magasin et données

Une petite fabrique locale ferme chaque cas sur son vrai magasin, ses mises
à jour et son témoin, avant de réunir les cinq cas dans un tableau. Le type
est déduit du magasin, pas élargi par la fixture ; le tableau hétérogène
n'exige plus de conversion des appels `setState`, `getState` ou `rehydrate`.

Les données artificielles suivent les vrais modèles : jet rapide avec
identifiant/formule, calendrier avec mois et unités, favori avec catégorie,
préréglage de carte avec champs neutres et tracés complets. Ces compléments
concernent uniquement les fixtures ; aucun modèle ni stockage applicatif
n'est modifié. Le JSON relu est celui que Zustand vient d'écrire dans le
`localStorage` artificiel du test. Son annotation locale décrit une enveloppe
d'état partiel, **pas un validateur d'import de données extérieures**.

## Contrôles

**140 tests ciblés dans neuf fichiers** passent : les quatre fichiers modifiés,
les abonnements aux verrous, le stockage réservé au MJ, le relais du processus
principal, sa politique de rôle et la persistance du combat entre fenêtres.
Les assertions existantes sont conservées ; aucun nouveau cas n'est nécessaire
pour ce typage de tests. Elles contrôlent le refus des charges mal formées,
les verrouillages/expirations, les références et l'omission des tracés inchangés,
la reprise après synchronisation, la stabilité des échanges et la protection
des écritures du MJ face au Hub/projecteur, tout en gardant leur réhydratation.

Le lint ciblé des quatre fichiers est propre. **Types (`npx tsc -b`) et
construction passent.** Lint global : **1 584 fichiers, zéro erreur et
176 avertissements**, contre 223. Restent **172 `any`, tous dans les tests**,
trois diagnostics de mémoïsation et une directive inutile. Comptage recoupé
dans le rapport final, règles et inventaire JSON initial inchangés.
Aucun paquet installé, service démarré manuellement ni scénario Electron lancé.

La suite complète passe : **7 198 tests dans 566 fichiers**, un fichier et
quatre tests ignorés. Types, lint, construction et suite complète portent
sur les quatre fichiers de tests finaux ; `git diff --check` propre.

## Reprise

Lot 28 réalisé, validé et documenté, **neuf fichiers Codex non commités** (quatre tests,
cinq documents). Dernier commit local et poussé **`8e6a0939`**. Le commit/push
demandé portait sur le lot 27 terminé ; le nouveau lot reste à commiter à la
prochaine demande. Les modifications étrangères des guides, de la note du
07/10, de l'e2e et de `.claude/settings.local.json` sont préservées.

Reprendre **la couture des fiches (38)** : `electron/coutureDesFiches.test.ts`
charge le vrai moteur HTML dans JSDOM et simule IndexedDB en mémoire ; typer
la surface utilisée et les contrats de lecture/écriture, en conservant les
scénarios. Puis les détenteurs de données de la purge (28) et les autres
groupes de tests par contrat. Les captures du manuel (27) restent distinctes.
Terminer ensuite les trois diagnostics de mémoïsation et la directive inutile.
La migration PDF v1/v2 du § 1 bis du registre reste séparée.

## Mise à jour du 09/10 — lot 28 commité

À la demande suivante de David, les neuf fichiers Codex de ce lot sont commités
en **`853a9a28`**, sans fichier étranger. Aucun push demandé ni effectué ;
dernier poussé **`8e6a0939`**. Les mentions antérieures « non commités » gardent
l'état historique. Les contrôles validés de ce lot ne sont pas rejoués au commit.
La reprise est dans le [lot 29 couture des fiches](2026-10-09-lint-couture-des-fiches.md).
