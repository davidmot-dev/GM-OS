# 🏗️ Architecture Technique : Système de Butin

Le butin de GM-OS repose sur **deux modules qui ne font pas le même geste**, et sur un seul
point de rencontre entre eux.

| | **Table-OS** (`src/modules/tables/`) | **Loot-OS** (`src/modules/session/`) |
| :--- | :--- | :--- |
| Question posée | « qu'est-ce qu'il y a ? » | « qu'est-ce qu'ils emportent ? » |
| Où vivent les tables | fichiers JSON, `databases/tables/<univers>/` | dans le pilote, `driver.lootTables` |
| Où on les édite | à la main (le pont Electron est en **lecture seule**) | dans la Forge, section *Butin* |
| Tirage | un dé, des plages `min`/`max` | poids relatifs ou % de chance, imbrications |
| Produit | **du texte** qu'on lit à voix haute | des **objets structurés** |

> ⛔ **Le point de rencontre est le pool, jamais le personnage.** Jusqu'au 2026-09-04,
> Table-OS court-circuitait Loot-OS et écrivait une ligne de prose dans `character.inventory`
> — un champ que l'onglet Inventaire de la tablette ne regarde même pas, puisqu'il affiche
> `inventoryItems`. *L'objet donné n'apparaissait nulle part où le joueur cherche ses affaires.*

---

## 🌉 Le pont, dans les deux sens

### Table-OS → pool : le champ `butin`

Une entrée d'oracle peut **déclarer** ce qu'elle donne (`DeclarationDeButin`, dans
`src/modules/tables/types.ts`). Facultatif : les univers existants ne déclarent rien et
fonctionnent mot pour mot.

```json
{
  "min": 6, "max": 12,
  "title": "Quelques Eddies",
  "effect": "Gagnez +1d100 Eurodollars et 1d4 munitions pour pistolet.",
  "butin": [
    { "name": "Eurodollars", "type": "currency", "quantite": "1d100" },
    { "name": "Munitions de pistolet", "type": "item", "quantite": "1d4" }
  ]
}
```

`objetsDepuisDeclaration()` (`session/logic/butinDeclare.ts`) résout les formules et inscrit
l'origine (`properties.oracleTable`, `properties.oracleEntree`) sur chaque objet — dans le
pool, tout se mélange.

**On ne lit jamais `effect` à la regex.** Une regex sur de la prose se trompe, et *un contrôle
qui se trompe est pire qu'un contrôle absent*. Une entrée sans déclaration propose à la place
une conversion par l'IA (`session/logic/propositionDeButinIA.ts`), que le meneur relit dans le
pool avant qu'elle ne compte.

### Loot-OS → Table-OS : l'entrée de type `oracle`

Une `LootEntry` de type `oracle` désigne `metadata.oracleUnivers` / `metadata.oracleTable`. Le
tirage passe par le moteur de Table-OS — plages, dés concaténés `d66` — et seul ce que
l'entrée tirée déclare entre au butin.

⚠️ **Les oracles se chargent AVANT le tirage.** Lire une table passe par le pont Electron,
donc c'est asynchrone, alors qu'un tirage est appelé au clic et doit rendre son résultat d'un
bloc. D'où les deux temps :

```ts
const oracles = await chargerLesOracles(LootGenerator.referencesDOracle(table, lootTables));
const { objets, avertissements } = LootGenerator.generateFromTable(table, lootTables, { oracles });
```

---

## 🛠️ Structure des Données (`LootSlice`)

```typescript
/** Un objet DANS LE POOL, donc rattaché à la campagne où il a été trouvé. */
type ObjetDuButin = InventoryItem & { campaignId?: string };

interface LootSliceState {
    lootPool: ObjetDuButin[];        // Objets en attente de distribution
    lootHistory: LootHistoryEntry[]; // Journal de bord des distributions
}
```

- `addLootToPool(items)` : marque les objets de la campagne ouverte et les injecte.
- `assignLootToCharacter(itemId, playerId, characterId)` : appelle `addInventoryItem`
  (`entitySlice`), retire du pool, écrit dans `lootHistory`, **consigne au journal**
  (`SYSTEM`, donc tracé mais hors résumé), et **annonce l'objet sur les tablettes** via
  `addHubNotification`. La marque de campagne est retirée au passage : dans un inventaire,
  c'est le personnage qui dit de quelle campagne il est.
- `estDeLaCampagne(marque, campagne)` : **une seule écriture de la règle**, lue par les deux
  écrans et par les deux boutons « Tout vider ». Un objet **sans marque appartient à celle
  qu'on regarde** — le butin d'avant le 2026-09-04 n'en porte aucune.

### Persistance

`lootPool` et `lootHistory` sont dans **`lesDonneesDeLaSession()`**, la liste unique partagée
par la persistance vivante (IndexedDB) et la sauvegarde vers fichier.

> ⛔ Avant le 2026-09-04 ils n'étaient dans **aucune des deux**. On fermait l'application, le
> butin non distribué et l'historique avaient disparu — sans un message, puisque rien n'avait
> échoué.

---

## 🎲 Ce que le générateur rend

```ts
interface ResultatDeGeneration {
    objets: InventoryItem[];
    avertissements: string[];
}
```

Les avertissements sont **le point important**. Une table imbriquée introuvable — le cas
courant tant que son identifiant se recopiait à la main — produisait zéro objet et ne se
plaignait qu'à la console : le meneur lisait « aucun objet » sans pouvoir savoir que c'était
une faute de frappe. *Un défaut muet en séance ne se répare jamais, parce qu'il ne se voit
jamais.*

Trois cas produisent un avertissement à l'écran : table imbriquée introuvable, oracle
illisible, entrée d'oracle qui ne déclare aucun butin.

### Deux lectures partagées, exportées par `LootGenerator`

| Fonction | Pourquoi elle est publique |
| :--- | :--- |
| `modeDeTirage(table)` | `rollMode` est le champ actuel, `isWeighted` celui d'avant. Un écran qui lit `rollMode ?? 'weighted'` affiche « un seul parmi la liste » à une table qui teste chaque ligne. |
| `tableImbriqueeDe(entry, tables)` | Un renvoi peut viser un **identifiant ou un nom**. La liste déroulante de la Forge doit résoudre comme le générateur, sinon elle affiche « Choisir… » sur un lien qui marche. |

---

## 🗣️ Le vocabulaire vient du pilote

`GameDriver.vocabulaireDuButin` déclare le nom de la monnaie et les paliers de rareté
(`session/logic/vocabulaireDuButin.ts`). Sans déclaration, GM-OS reste **neutre** — « valeur »,
« objets remarquables » — et les pilotes antérieurs ne changent pas de comportement.

> L'échelle commune→légendaire et les « pièces d'or » étaient codées en dur, dans le panneau
> comme dans l'invite de l'IA, à Blade Runner comme à Alien. *Une valeur qui dépend du jeu ne
> peut pas vivre en dur dans un écran* — même faute que les points de vie à `10`.

Le premier palier déclaré est celui qui **ne compte pas** comme remarquable, et la couleur d'un
badge suit la **place** du palier dans l'échelle, jamais son nom.

---

## 🔄 Flux de synchronisation

Le butin est « Master-Only » pour la gestion ; ses effets voyagent par le pont de
synchronisation global : le MJ modifie le pool → le store maître se met à jour → le pont
diffuse `entities` (donc les inventaires) → la tablette reçoit son inventaire à jour, et la
notification qui l'annonce.

---

*Dernière mise à jour : 2026-09-04 — le pont Table-OS ↔ Loot-OS, la persistance du pool et le
vocabulaire du pilote.*
