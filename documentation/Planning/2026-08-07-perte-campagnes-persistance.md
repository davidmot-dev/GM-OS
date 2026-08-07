# Perte des campagnes du 2026-08-07 — cause, correctif, récupération

> Branche `feature/tablet-hub-pwa`. Incident constaté le 2026-08-07 au matin, après le
> test en réel du flux `combat` (point 2 de `2026-08-07-restes-unification-transport.md`).
> Écrit pour être repris à froid.

## Le symptôme

Au démarrage, l'application n'affiche plus que les campagnes de démonstration
(`c-1` « The Eternal Quest », `c-2` « Les Ombres d'Eldoria »), celles de
`src/modules/session/data/sessionMocks.ts`. La campagne réelle « Anges de Feu »
(`c-1774865486579`) a disparu.

## La cause

`PersistenceService.partialize` renvoyait, pour les fenêtres **non-MJ**, une charge réduite à
six champs de sélection — **sans `campaigns`**. Cette charge partait sous la **même clé
IndexedDB** que l'état complet du MJ, `gmos-v5-session-os-storage`, dans la **même origine**
(`http://localhost:5173`) : le Player Hub et le projecteur sont des fenêtres Electron de cette
origine.

La charge exacte, retrouvée dans le journal leveldb :

```json
{"state":{"activeCampaignId":"c-1774865486579","currentView":"world-atlas",
"selectedPlayerId":"p-1","selectedAtlasMapId":"am-1","selectedEntityId":"e-1",
"isProjecting":false},"version":10}
```

Le dégât ne se voit pas au moment où il se produit : la fenêtre MJ garde ses données en
mémoire. Il se matérialise au **démarrage à froid suivant** :

1. Le store s'initialise sur les mocks — `store/index.ts`, `campaigns: INITIAL_DATA.campaigns`.
2. Il lit la charge persistée, qui n'a pas de clé `campaigns`.
3. La fusion superficielle de Zustand laisse donc les mocks en place.
4. La fenêtre MJ, seule propriétaire, persiste alors les mocks **par-dessus** les vraies données.

Le commentaire au-dessus de `partialize` affirmait que ces fenêtres « cessent seulement d'y
réécrire ». C'était l'intention ; elle n'était appliquée nulle part. Le docstring de
`src/utils/windowRole.ts` énonçait la même règle, sans plus l'appliquer à l'écriture.

## Le correctif

L'interdiction est posée **au seul point qui écrit**, `gmOnlyStateStorage` dans
`PersistenceService.ts` : `getItem` reste ouvert à toutes les fenêtres, `setItem` et
`removeItem` ne font rien hors fenêtre MJ.

La branche réduite de `partialize` est **supprimée**. La garder comme filet de sécurité
reviendrait à conserver l'arme : c'est la charge sans `campaigns` qui détruisait les données,
pas son acheminement.

Arbitrage écarté : une clé distincte par rôle. Le Hub garderait la mémoire de sa vue entre deux
ouvertures, mais il faudrait lire deux clés au démarrage et tester un chemin de fusion
supplémentaire, pour un bénéfice cosmétique. La perte assumée : le Hub ne mémorise plus sa vue.

Tests : `PersistenceService.test.ts`. Vérifié qu'ils **échouent** sans le correctif — le test
« l'état du MJ survit à l'ouverture d'une fenêtre secondaire » reproduit la perte à l'identique.

## Ce qui a été récupéré, ce qui ne l'a pas été

**Non récupérable localement.** Chrome externalise les valeurs IndexedDB volumineuses dans des
fichiers blob séparés (marqueur `application/vnd.blink-idb-value-wrapper` présent dans le
journal). L'état réel (≈305 Ko) était donc **hors journal**, remplacé par les mocks écrits en
ligne (≈6 Ko), et son fichier externe supprimé — le répertoire blob de la base 3 est vide. Le
nom « Anges de Feu » n'apparaît nulle part dans IndexedDB.

**Intact :** la médiathèque — 260 Mo de blobs, tous les médias toujours étiquetés
`campaignIds: ["c-1774865486579"]`.

**Source de restauration :** `Téléchargements/campagne_gmos_1775504594227.gmos`, export Nexus
complet de « Anges de Feu » du **2026-04-06 19:43** — `state.json` (124 Ko) et 61 fichiers
d'assets. C'est le plus récent export existant ; aucun postérieur sur le disque.

**Sauvegarde de l'état sinistré** avant toute manipulation :
`%USERPROFILE%\Desktop\gm-os-v5-backup-20260807` (seul `DIPS`, base interne de Chromium, n'a pas
été copié).

**Piste non épuisée, à tenter en priorité :** les clichés instantanés de Windows, seuls à même
de restituer les quatre derniers mois. Depuis une invite **administrateur** :
`vssadmin list shadows`, puis clic droit sur `%APPDATA%\gm-os-v5\IndexedDB` →
*Versions précédentes*. À faire avant d'écrire davantage sur le disque.

## Méthode d'enquête, à ne pas redécouvrir

- Les fichiers `.ldb` de leveldb sont **compressés en snappy** : l'absence de résultat au `grep`
  n'y prouve rien. Seul le `.log`, non compressé, est lisible en octets bruts. Un parcours du
  footer puis des blocs, décompressés à `snappyjs`, donne le contenu réel.
- Le journal leveldb est **append-only** : l'ordre des offsets est l'ordre du temps. C'est ce
  qui a permis de dater la bascule des vraies données vers les mocks.
- Chrome stocke les valeurs de `localStorage` en **UTF-16** dès qu'elles contiennent un accent.
  Une recherche en octets bruts passe à côté des données en français.
- Les valeurs IndexedDB volumineuses sont **externalisées** en fichiers blob. Ne pas conclure à
  l'absence d'une donnée sur la seule lecture du journal.
