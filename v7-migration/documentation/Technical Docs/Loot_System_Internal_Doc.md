# Spécifications Techniques : Moteur de Butin (Loot-Engine)

Le système de butin de GM-OS est un moteur de résolution probabiliste récursif permettant de générer des objets, de la monnaie ou d'autres tables de manière imbriquée.

## 1. Architecture des Données

### LootTable
Définit un ensemble cohérent d'objets ou de sous-tables.
- `id`: Identifier unique.
- `name`: Label utilisateur.
- `entries`: Liste de `LootEntry`.

### LootEntry
L'unité de base du tirage.
- `type`: `item` | `currency` | `table`.
- `weight`: Poids entier. La probabilité d'une entrée est `weight / somme(weights)`.
- `metadata`: Objet flexible contenant les instructions d'instanciation.

## 2. Processus de Résolution (Loot Logic)

Le mécanisme de tirage suit cet algorithme :

1.  **Calcul du poids total** : Somme des `weight` de toutes les entrées de la table active.
2.  **Tirage aléatoire** : Génération d'un nombre entre 1 et `totalWeight`.
3.  **Sélection** : Parcours des entrées jusqu'à atteindre le seuil du tirage.
4.  **Instanciation** :
    - Si `type == 'item'` : Création d'un objet avec nom et rareté.
    - Si `type == 'currency'` : Calcul de la quantité via `quantityFormula` (via `Dice-Logic`).
    - Si `type == 'table'` : Appel récursif de la fonction `rollLoot(tableId)`.

## 3. Intégration UI/UX

Les résultats sont envoyés au store `useSessionOSStore` via l'action `addLootToCharacter`. Une notification visuelle (`LootNotification.tsx`) est déclenchée pour confirmer le transfert réussi vers l'inventaire.

## 4. Performance & Limites

- **Récursivité** : Le moteur supporte jusqu'à une profondeur théorique infinie, mais il est recommandé de ne pas dépasser 5 niveaux pour la lisibilité des logs.
- **Poids** : Les poids sont des entiers. Un poids de 0 désactive l'entrée.
