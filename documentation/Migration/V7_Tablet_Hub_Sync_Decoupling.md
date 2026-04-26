# 🚀 V7 Migration: Tablet Hub Synchronization Decoupling

Ce document détaille la stratégie de découplage mise en place pour le module de synchronisation du Tablet Hub afin de garantir la stabilité de boot dans l'environnement Tauri (V7).

## 📌 Contexte Technique
Lors du passage à la V7, la multiplication des stores et des services a créé un graphe de dépendances circulaires complexe. Le module `useHubSync.ts`, qui sert de point central pour la synchronisation, était devenu un goulot d'étranglement provoquant des erreurs `500 Internal Server Error` lors de la transformation par Vite.

## 🛠️ Architecture "Decoupled Store Access"

Pour résoudre ce problème, nous avons adopté le pattern **Global Window Bridge**.

### 1. Enregistrement des Stores (Fournisseurs)
Chaque store (Zustand) doit s'enregistrer sur l'objet global `window` dès son chargement. Cela permet d'accéder au store depuis n'importe quel module sans import statique.

```typescript
// Dans useSessionOSStore.ts
export const useSessionOSStore = create(...)();

if (typeof window !== 'undefined') {
    (window as any).useSessionOSStore = useSessionOSStore;
}
```

### 2. Consommation Dynamique (Consommateurs)
Le hook `useHubSync` ne possède plus d'imports statiques vers les stores du projet. Il résout les stores dynamiquement.

```typescript
// Dans useHubSync.ts
const getStore = (name: string) => (typeof window !== 'undefined' ? (window as any)[name] : null);

export const useHubSync = () => {
    // Résolution au montage du hook
    const useSessionOSStore = getStore('useSessionOSStore');
    
    // Usage safe dans les sélecteurs
    const entities = useSessionOSStore ? useSessionOSStore(s => s.entities) : [];
    
    // Usage dans les callbacks
    const applySync = useCallback((data) => {
        const s = getStore('useSessionOSStore');
        if (s) s.setState(data);
    }, []);
};
```

## 📋 Checklist de Migration pour les Nouveaux Stores

Si vous créez un nouveau store qui doit être synchronisé avec le Hub :
1.  **Enregistrement** : Ajoutez le bridge `window.useNewStore = useNewStore` à la fin du fichier du store.
2.  **Découplage** : Ne l'importez PAS statiquement dans `useHubSync.ts`.
3.  **Intégration** : Ajoutez une ligne de résolution dans `useHubSync.ts` via `getStore('useNewStore')`.

## ⚠️ Points d'Attention (Tauri V7)
- **Lazy Loading** : Puisque les stores sont résolus via `window`, assurez-vous qu'ils sont bien importés au moins une fois dans l'arbre React (via `App.tsx`) pour déclencher leur enregistrement.
- **Typage** : Utilisez `any` ou des interfaces légères pour le bridge `window` afin d'éviter d'importer les types complexes qui pourraient réintroduire des dépendances circulaires.

---
*Document créé le 24 Avril 2026 - GM-OS v7 Architectural Standards.*
