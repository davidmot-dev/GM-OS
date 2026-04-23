# Walkthrough Technique : Composants UI Dynamiques

Cette refonte permet un découplage total entre la logique métier du combat et sa présentation visuelle, pilotée par les méta-données des `GameDrivers`.

## 🏗️ Architecture du Système

Le flux de données suit maintenant ce schéma :

1. **Forge IA / Driver** : Définit `ui_config` (styles, couleurs, layout).
2. **Combat Store** : Maintient l'état des ressources (HP, Stress, etc.).
3. **CombatCard** : Consomme le Driver actif pour choisir le moteur de rendu approprié.

## 💉 Modifications des Types (`src/types/drivers.ts`)

Ajout d'une interface extensible pour la configuration UI :
```typescript
export interface GaugeConfig {
    fieldId: string;
    label: string;
    color: string; // Classes Tailwind ou Hex
    style: 'bar' | 'segmented' | 'neon';
}

export interface UIConfig {
    gauges: GaugeConfig[];
    initiativeStyle?: 'list' | 'grid';
}
```

## 🧠 Intelligence Artificielle (`ForgeService.ts`)

Les prompts Gemini ont été mis à jour pour inclure des directives de design heuristiques :

- **Medieval Fantasy** -> Style `bar`, couleurs Terre/Or/Vert.
- **Sci-Fi / Cyberpunk** -> Style `neon`, couleurs Cyan/Magenta/Lime.
- **Gritty / Survival** -> Style `segmented`, couleurs Rouille/Gris/Rouge.

## 🎨 Logique de Rendu (`CombatCard.tsx`)

Le composant utilise des structures conditionnelles pour appliquer des styles Tailwind complexes :

- **Segmented** : Génère dynamiquement une suite de `<div>` basée sur la valeur `max` de la ressource.
- **Neon** : Applique des `box-shadow` et des opacités variables pour l'effet de luminescence.

## 📏 Layout d'Initiative (`InitiativeList.tsx`)

Intégration de `@dnd-kit/sortable` avec `rectSortingStrategy` pour supporter le tri fluide dans une grille CSS multi-colonnes (`grid-cols-1 xl:grid-cols-2`). 

---

**Validation** :

- [x] Types TypeScript validés sans `any`.
- [x] Rendu dynamique testé avec les styles pré-définis.
- [x] Rétrocompatibilité assurée pour les drivers ne possédant pas encore de `ui_config`.
