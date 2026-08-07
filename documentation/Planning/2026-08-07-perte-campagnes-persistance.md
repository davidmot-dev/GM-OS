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

## La récupération — intégrale, par les clichés instantanés

**Restaurée le 2026-08-07.** Un cliché instantané de Windows du **2026-08-06 19:11** contenait
l'état intact. Les trois campagnes sont revenues :

| Campagne | Identifiant |
| --- | --- |
| Anges de Feu | `c-1774865486579` |
| Agents de Dune | `c-1777811222934` |
| A la claire fontaine | `c-1777814571323` |

Avec 245 entrées de wiki, 50 entités, 47 cartes d'atlas, 8 sessions, 7 joueurs, 3 decks,
8 modèles de fiche et 8 pilotes de jeu — bien au-delà de l'export Nexus du 6 avril, qui ne
contenait que « Anges de Feu ».

**Seul écart :** ce qui a changé entre le 2026-08-06 19:11 et la restauration est perdu. Cette
plage ne couvre que les essais de transport, pas du travail de campagne.

Chemin suivi, à reproduire tel quel en cas de récidive :

1. **Copier, ne pas restaurer.** Dans *Versions précédentes* : `Ouvrir`, puis copie du dossier
   vers un emplacement neuf. Le bouton `Restaurer` écrit en place et détruit le point de
   comparaison.
2. **Vérifier avant de basculer.** L'état vit dans un fichier blob externalisé — ici
   `IndexedDB\http_localhost_5173.indexeddb.blob\3\00\90`, 13,9 Mo : en-tête de sérialisation
   Blink, puis du JSON **en UTF-16**. Le répertoire de la base 3 était *vide* dans l'état
   sinistré ; c'est le signe le plus net de la perte.
3. **Application fermée**, renommer l'`IndexedDB` en place plutôt que le supprimer, puis copier.

**Conservé :**

- `%USERPROFILE%\Desktop\gm-os-v5-backup-20260807` — l'état sinistré complet (seul `DIPS`, base
  interne de Chromium, n'a pas pu être copié).
- `…\gm-os-v5-backup-20260807\etat-session-recupere-20260806-1644.json` — l'état récupéré en
  JSON lisible (7 Mo), indépendant de tout format IndexedDB.
- `%APPDATA%\gm-os-v5\IndexedDB.avant-restauration-20260807` — le dossier écarté.
- `Téléchargements/campagne_gmos_1775504594227.gmos` — export Nexus du 2026-04-06, dernier
  recours.

**La médiathèque n'avait pas été touchée** : les 260 Mo de blobs et leurs métadonnées étaient
intacts tout du long.

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
