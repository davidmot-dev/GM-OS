# Guide Tactique : Gestion du Système de Butin (Loot-OS)

Ce guide détaille comment alimenter et structurer les tables de butin pour vos parties sur GM-OS.

## 1. Structure d'une Table de Butin

Une table de butin est un objet JSON structuré contenant une liste d'entrées pondérées. Voici la structure de base :

```ts
{
    id: 'ma-table-unique',
    name: 'Nom de la Table',
    rolls: '1d3',            // OPTIONNEL: Nombre de sélections automatiques
    rollMode: 'independent', // OPTIONNEL: 'weighted' (défaut) ou 'independent'
    entries: [
        { 
            id: 'item-01', 
            type: 'item', 
            name: 'Nom de l\'Objet', 
            weight: 50, // Poids relatif ou probabilité (%) selon le mode
            metadata: { 
                rarity: 'Commun', 
                quantityFormula: '1d6' 
            }
        }
    ]
}
```

## 2. Types d'Entrées

Le système supporte trois types d'entrées principaux :

| Type | Description | Usage |
| :--- | :--- | :--- |
| `item` | Un objet physique simple. | Armes, consommables, gadgets. |
| `currency` | De l'argent ou des crédits. | Chinyen, Or, Dollars. |
| `table` | Une référence à une *autre* table. | **Récursivité** (ex: une table "Trésor" appelle la table "Gemmes"). |

## 3. Modes de Tirage

Le système propose deux modes fondamentaux de résolution :

### A. Mode Pondéré (Weighted) - Par Défaut
Le système effectue un **choix unique** parmi les entrées. Plus le `weight` est élevé par rapport aux autres, plus l'objet a de chances d'être séléctionné.
- **Usage** : "Une potion parmi trois", "Un trésor aléatoire".

### B. Mode Indépendant (Set Complet)
Chaque entrée est testée **individuellement**. Le `weight` représente ici une **probabilité de drop (0-100%)**.
- Si `weight = 100`, l'objet est garanti.
- Si `weight = 10`, l'objet a 10% de chance d'apparaître.
- **Usage** : "Générer tout l'équipement de départ d'un PNJ", "Set d'objets garantis".

## 4. Multi-Tirages (Rolls)

Vous pouvez configurer le nombre de fois que la table doit s'exécuter automatiquement via le champ `Tirages (Dés)` :
- Valeur fixe : `3` (tire 3 fois).
- Formule de dés : `1d4+1` (tire entre 2 et 5 fois).
- En mode **Indépendant**, le nombre de tirages démultiplie les tests de probabilité.

## 3. Paramètres Avancés (Metadata)

Les métadonnées permettent d'instancier dynamiquement les objets lors du tirage.

### Formules de Quantité
Utilisez le champ `quantityFormula` pour définir des tirages de dés :
- `1d6` : Entre 1 et 6.
- `2d10*5` : Multiples de 5 entre 10 et 100.
- `10` : Valeur fixe.

### Niveaux de Rareté
Le système de notification (`LootNotification`) adapte ses couleurs selon la rareté :
- `Commun` (Gris)
- `Insolite` (Bleu)
- `Rare` (Cyan)
- `Épique` (Violet)
- `Légendaire` (Or)

## 4. Exemple Concret : Blade Runner

Voici comment est implémentée la table "Preuves du LAPD" :

```ts
{
    id: 'br-lapd',
    name: 'Preuves & Saisies du LAPD',
    entries: [
        { id: 'l1', type: 'item', name: 'Données de surveillance', weight: 25, metadata: { rarity: 'Insolite' } },
        { id: 'l2', type: 'item', name: 'Peau synthétique', weight: 20, metadata: { rarity: 'Rare' } },
        { id: 'l3', type: 'item', name: 'Munitions .44', weight: 15, metadata: { quantityFormula: '1d6' } },
        { id: 'l5', type: 'table', name: 'Objet Confisqué', weight: 20, metadata: { tableId: 'br-gear' } } // APPEL RÉCURSIF
    ]
}
```

## 5. Comment ajouter vos tables ?

1.  Ouvrez `src/data/defaultGameDrivers.ts`.
2.  Localisez le `gameDriver` de votre système (ex: `br-v1`).
3.  Modifiez l'objet `loot.tables` en ajoutant vos nouvelles structures.
4.  Relancez l'application. Les nouvelles tables apparaîtront dans le **LootRollPanel** de vos fiches de personnages.

> [!IMPORTANT]
> Assurez-vous que les `id` sont uniques à travers l'ensemble du driver pour éviter les conflits lors de la résolution récursive.
