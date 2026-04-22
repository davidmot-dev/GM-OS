# 🔧 Documentation Technique : Social Nexus (Social Graph)

Le **Social Nexus** est le module de visualisation et de gestion des relations sociales de GM-OS v5. Il utilise un graphe de force interactif pour représenter les liens entre les PNJ et les PJ d'une campagne active.

## 🏗️ Architecture

Le module est construit sur une séparation stricte entre la couche de rendu (UI) et la préparation des données (Logic).

1.  **Moteur de Rendu** : `react-force-graph-2d` (Canvas API).
    - Choix technologique : Le Canvas offre des performances supérieures au SVG pour les graphes denses et permet des animations fluides à 60fps même avec des centaines de nœuds.
2.  **Gestion de l'État** : `useSessionOSStore` (Zustand).
    - Les relations sont stockées de manière persistante dans la structure `socialRelations` du store de session.
3.  **Préparation des Données** : `socialNexusUtils.ts`.
    - Les données brutes des entités sont transformées en nœuds (`nodes`) et liens (`links`) compatibles avec le simulateur physique de d3-force.

## 🎨 Fonctionnalités & Implémentation

### Rendu des Portraits (Canvas Media)
Le rendu des avatars dans le canvas utilise un cache d'images dynamique.
- **Résolution** : Les identifiants `m-xxxx` (Media Hub) et les chemins locaux sont résolus via `useMediaStore` pour obtenir des ObjectURLs (`blob:`).
- **Optimization** : Les images sont pré-chargées et stockées dans un objet de cache pour éviter les clignotements lors des re-renders.

### Relations Directionnelles (Asymétrie)
Le module supporte le concept de relations non-réciproques.
- **Visualisation** : Utilisation de `linkDirectionalArrowLength` et `linkCurvature` pour représenter les sentiments croisés entre deux nœuds sans chevauchement.
- **Codage sémantique** : Les couleurs et la direction sont calculées dynamiquement selon les métadonnées de la relation (`source_perception`, `target_perception`).

### Factions & Filtrage
Le filtrage par faction s'appuie sur le moteur de recherche global de la session.
- **Logic** : `prepareSocialGraphData` filtre récursivement les nœuds orphelins si leur faction ne correspond pas au filtre actif, garantissant un graphe lisible et contextuel.

### Navigation Deep-Link
Le passage du graphe à la fiche détaillée (`NpcDetail`) court-circuite le reset automatique du store.
- **State Management** : L'ID de l'entité est injecté dans `selectedEntityId` juste après le changement de vue (`setCurrentView`), forçant le mode "Détail" au montage du composant `NpcGallery`.

## 📂 Fichiers Clés
- `src/modules/session/components/SocialGraph.tsx` : Interface et rendu Canvas.
- `src/modules/session/logic/socialNexusUtils.ts` : Moteur de préparation et filtrage.
- `src/modules/session/useSessionOSStore.ts` : Persistance et états de navigation.
- `src/modules/session/logic/socialNexusUtils.test.ts` : Tests unitaires de la structure du graphe.
