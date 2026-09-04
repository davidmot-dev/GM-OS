# Spécifications Techniques : Moteur de Butin (Loot-Engine)

Le moteur de butin de GM-OS est un résolveur probabiliste récursif qui produit des objets, de
la monnaie, d'autres tables, ou le résultat d'un **oracle de Table-OS**.

> Vue d'ensemble et rôle de chaque module : [`loot-system-architecture.md`](./loot-system-architecture.md).

## 1. Architecture des Données

### LootTable

- `id` : identifiant unique.
- `name` : libellé utilisateur.
- `rolls` : nombre de tirages — un entier ou une formule (`1d4+1`). Défaut : 1.
- `rollMode` : `weighted` | `independent`. **Lire `modeDeTirage(table)`**, jamais le champ nu :
  les tables enregistrées avant ce champ portent `isWeighted` à la place.
- `entries` : liste de `LootEntry`.

### LootEntry

- `type` : `item` | `currency` | `table` | `oracle` | `other`.
- `weight` : **deux sens selon le mode** — poids relatif en `weighted`, pourcentage de chance
  en `independent`. C'est délibéré, et l'éditeur le dit maintenant en toutes lettres.
- `minAmount` / `maxAmount` : la quantité, en nombre, en plage, ou en formule de dés.
- `metadata` : `rarity`, `value`, `weight` (la **masse**, à ne pas confondre avec le poids de
  tirage), `description` ; `tableId` pour une imbrication ; `oracleUnivers` + `oracleTable`
  pour un oracle.

## 2. Processus de résolution

Pour chacun des `rolls` tirages :

**Mode `weighted`** — un seul gagnant. Somme des poids, tirage dans `[0, total[`, parcours
cumulé. Si tous les poids valent 0, une entrée au hasard (plutôt que rien).

**Mode `independent`** — chaque entrée est testée seule : elle sort si `Math.random()*100 <
weight`, et toujours si `weight >= 100`.

Puis, selon le type de l'entrée retenue :

| Type | Ce qui se passe |
| :--- | :--- |
| `item` / `currency` / `other` | Instanciation. La quantité vient de `metadata.quantityFormula`, sinon `minAmount`, sinon le legacy `quantity`. Une monnaie sans valeur déclarée vaut **1** par unité. |
| `table` | Appel récursif sur la table désignée — par identifiant, **sinon par nom** (`tableImbriqueeDe`). Introuvable ⇒ **avertissement**, jamais un silence. |
| `oracle` | Tirage avec le moteur de **Table-OS** sur la table préchargée, puis `objetsDepuisDeclaration(entree.butin)`. Aucune déclaration ⇒ avertissement. |

`resoudreUneQuantite()` (`session/logic/quantiteDeButin.ts`) est la **seule** lecture d'une
quantité, partagée par les trois appelants — les tables du pilote, le butin déclaré d'un
oracle, et le pont entre les deux. *Trois copies de la même règle auraient divergé le jour où
l'une accepte « 2d6+2 » et pas les autres.*

## 3. Sortie

```ts
{ objets: InventoryItem[], avertissements: string[] }
```

Les objets sont versés au pool par `addLootToPool`. **Jamais directement à un personnage** :
la distribution est un geste du meneur, dans Loot-OS.

Les avertissements sont affichés en toasts par l'écran appelant. Ils existent parce qu'un
tirage qui rend zéro objet, sans dire pourquoi, ne se répare jamais en séance.

## 4. Limites réelles

- **Récursivité** : `iterationLimit = 5`. Ce n'est pas une recommandation, c'est un plafond
  dans le code — au-delà, la table imbriquée ne rend rien.
- **Volume** : `totalItemsLimit = 50`. Une imbrication est ignorée dès que le résultat courant
  l'atteint.
- **Poids** : entiers. Un poids de 0 désactive l'entrée en mode `independent` ; en mode
  `weighted`, il ne la désactive que s'il en reste d'autres à poids non nul.
- **Oracles** : ils doivent être **préchargés** (`referencesDOracle` puis `chargerLesOracles`).
  Le générateur reste synchrone ; il ne va rien chercher lui-même.

---

*Dernière mise à jour : 2026-09-04 — le type `oracle`, les deux modes de tirage explicités,
les avertissements et les vraies limites.*
