# 🏗️ Architecture Technique : Système de Loot
 
Le système de Loot est un module de **Session-OS** conçu pour gérer le cycle de vie des objets non-distribués. Il repose sur un découplage entre le pool global (`lootPool`) et les inventaires individuels.

---

## 🛠️ Structure des Données (`LootSlice`)

Le module est implémenté via `lootSlice.ts` et intégré au store global `useSessionOSStore`.

### État (`LootSliceState`)

```typescript
interface LootSliceState {
    lootPool: InventoryItem[];      // Objets en attente de distribution
    lootHistory: LootHistoryEntry[]; // Journal de bord des distributions
}
```

### Actions (`LootSliceActions`)

- `addLootToPool(items)` : Injection d'objets dans le pool. Déclenche une notification `gmToast`.
- `assignLootToCharacter(itemId, playerId, characterId)` :
    1. Recherche l'objet dans le `lootPool`.
    2. Appelle `state.addInventoryItem(...)` (fourni par `entitySlice`) pour l'attribuer.
    3. Retire l'objet du pool.
    4. Génère une entrée dans `lootHistory`.

---

## 🔄 Flux de Synchronisation

Le système de loot est conçu pour être "Master-Only" pour la gestion, mais ses effets sont diffusés via le pont de synchronisation global.

1. **MJ** : Modifie le `lootPool`.
2. **Master Store** : Met à jour son état.
3. **Bridge** : Diffuse un événement `sync` contenant la mise à jour de `entities` (inventaires personnages) vers tous les clients distants.
4. **Tablette Joueur** : Reçoit l'image de son inventaire mise à jour via le flux P2P standard.

---

## 📜 Historique & Traçabilité

L'historique (`lootHistory`) utilise des IDs générés par `hist-${crypto.randomUUID()}` pour garantir l'unicité même après plusieurs sessions d'export/import Nexus.

Informations stockées par entrée :
- Métadonnées de l'objet (nom, rareté, valeur).
- Métadonnées du destinataire (ID, nom, portrait).
- Horodatage (`timestamp`).

---

## 🛡️ Robustesse & Validation

- **Vérification d'existence** : Avant assignation, le système vérifie que l'objet est toujours présent dans le pool pour éviter les duplications en cas de clics rapides.
- **Couplage Faible** : Le `lootSlice` interagit avec `entitySlice` via l'interface du store root, permettant de modifier la logique de stockage des personnages sans impacter le moteur de loot.

---

*Dernière mise à jour : 9 Avril 2026*
