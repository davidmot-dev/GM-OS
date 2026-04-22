# Architecture Technique : Master Storyboard

Le Master Storyboard agit comme un **Orchestrateur de Haut Niveau** au sein de GM-OS v5. Il ne contient pas de logique métier propre aux médias (audio, lumière), mais pilote les autres stores via des appels croisés.

## 🏗️ Structure des Données

Un "Moment" du storyboard est défini par l'interface `StoryboardMoment` :

```typescript
interface StoryboardMoment {
    id: string;
    name: string;
    musicPadId?: string;      // ID d'un pad dans useMusicStore
    lightSceneId?: string;    // ID d'une scène dans useLightStore
    mapUrl?: string;          // URL d'une carte dans useMapStore
    imageMediaId?: string;    // ID d'une image dans useImageStore
    soundPadId?: string;      // ID d'un pad d'ambiance dans useSoundStore
    ambientSceneId?: string;  // ID d'une scène complète dans useAmbientStore
    campaignId: string;
}
```

## ⚡ Mécanisme de Déclenchement

Lorsqu'un moment est activé via `triggerMoment(momentId)`, le système exécute une séquence de commandes synchrones sur les stores globaux :

1.  **Audio** : `useMusicStore.getState().playPad(musicPadId)`
2.  **Lumières** : `useLightStore.getState().activateScene(lightSceneId)`
3.  **Cartographie** : `useMapStore.getState().setCurrentMapUrl(mapUrl)`
4.  **Visualisation** : `useImageStore.getState().setActiveMedia(imageMediaId)`
5.  **Ambiance** : `useAmbientStore.getState().loadScene(ambientSceneId)`

## 📸 Fonction "Capture Active"

La fonctionnalité de capture permet de peupler l'interface de création en interrogeant l'état actuel (`getState()`) de chaque module OS. Cela permet une création de contenu "au vol" sans avoir à naviguer manuellement dans les IDs de chaque module.

### Implémentation :
Le `StoryboardDashboard` utilise des helpers pour extraire les labels lisibles à partir des IDs stockés, garantissant une UI propre malgré une base de données orientée IDs techniques.

## 🛠️ Optimisations & Robutesse

- **Z-Index Multi-couches** : Correction des superpositions entre les boutons de contrôle (Play/Edit) et les cartes de moment.
- **Réactivité Zustand** : Utilisation de hooks directs (`useAmbientStore`) pour les données dynamiques, assurant que les nouvelles scènes d'ambiance apparaissent instantanément dans les sélecteurs.
- **Fail-safe** : Tous les appels aux stores esclaves sont protégés par des vérifications d'existence (optional chaining) pour éviter les crashs si un module n'est pas encore initialisé.
