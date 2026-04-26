# Walkthrough - Workspace Sync v2 (Display Detection)

L'implémentation de **Workspace Sync v2** permet à GM-OS de détecter dynamiquement le nombre de moniteurs connectés et d'adapter son interface en conséquence pour maximiser l'espace de travail du MJ.

## 🚀 Fonctionnalités implémentées

### 1. Détection Matérielle en Temps Réel
- **Electron Main Process :** Ajout d'écouteurs sur les événements `display-added` et `display-removed`.
- **IPC Toast :** Des notifications s'affichent instantanément dans GM-OS lorsqu'un écran est branché ou débranché.

### 2. Store Session Synchronisé
- Ajout de `displayCount` dans le store global. Toutes les fenêtres (Main, Hub, etc.) ont maintenant conscience de l'environnement matériel.

### 3. Layout Adaptatif (Intelligence GM)
- **Gestion du Conflit sur Écran Unique :** Si vous n'avez qu'un seul écran, GM-OS empêche désormais l'ouverture simultanée du **Panneau IA** et du **Panneau Tactique**. 
- **Priorité au Jeu :** Le panneau Tactical AI est prioritaire. Si vous ouvrez le Tactical AI alors que l'IA est ouverte sur un moniteur unique, le panneau IA se ferme automatiquement pour laisser place au cockpit.
- **Libération sur Multi-écrans :** Cette restriction saute automatiquement dès qu'un second écran est détecté, permettant un usage plus "large" de l'interface.

## 🛠️ Modifications techniques

- **[main.ts](file:///c:/Projet_David/GM-OS-v5/electron/main.ts)** : Ajout des écouteurs `screen.on`.
- **[preload.ts](file:///c:/Projet_David/GM-OS-v5/electron/preload.ts)** : Exposition de `onDisplayChanged`.
- **[useSessionStore.ts](file:///c:/Projet_David/GM-OS-v5/src/store/useSessionStore.ts)** : Nouvel état `displayCount`.
- **[useDisplayDetection.ts](file:///c:/Projet_David/GM-OS-v5/src/hooks/useDisplayDetection.ts)** : Hook de gestion des événements et toasts.
- **[useLayoutManager.ts](file:///c:/Projet_David/GM-OS-v5/src/modules/session/hooks/useLayoutManager.ts)** : Logique de résolution de conflits de layout.

## ✅ Test de validation

1. **Branchement d'écran :** Une notification "Nouveau moniteur détecté" apparaît.
2. **Débranchement :** Une notification "Moniteur déconnecté" apparaît.
3. **Occupation de l'espace (1 écran) :** Ouvrez le panneau IA, puis le panneau Tactique. Le panneau IA doit se fermer avec un toast explicatif.
4. **Occupation de l'espace (2 écrans) :** Les deux panneaux peuvent rester ouverts (si simulé ou testé avec matériel).
