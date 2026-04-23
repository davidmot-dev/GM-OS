# 📔 GM-OS v5 : Carnet d'Architecture & Méthodes

Ce document sert de référence technique pour les solutions implémentées dans les différents modules de GM-OS v5. Il doit être mis à jour après chaque innovation structurelle majeure.

## 1. Synchronisation Temps Réel (Cross-Window)

### Problème

Comment synchroniser plusieurs fenêtres (GM, Player Hub, Moniteurs) sans serveur de websocket complexe ?

### Solution : Le pattern "Storage Rehydration"

1. **Zustand + Persist** : On utilise le middleware `persist` pour sauver l'état dans le `localStorage`.
2. **Signal de Rehydratation** : Toute mutation critique dans le store (mouvement de pion, dessin) déclenche une écriture automatique dans le stockage.
3. **Listener Global** : Dans chaque vue "Joueur", on écoute l'événement `'storage'`.
4. **Action** : Dès qu'une clé spécifique change, on appelle `useStore.persist.rehydrate()`.

---

## 2. Système de Projection Universel

### Problème

Avoir une logique cohérente pour projeter n'importe quel contenu sur n'importe quel écran.

### Solutions & Règles

- **Exclusivité** : Une seule projection tactique active à la fois (Hub OU Moniteur). Quand une nouvelle est lancée, l'ancienne est nettoyée (`clearProjectedState`).
- **Mode Spécial IPC** : Utiliser des constantes comme `__tactical_map__` ou `__whiteboard__` envoyées via `image:launchDisplay` pour changer le mode de rendu du `ProjectorView`.
- **Fermeture Matérielle** : Pour les moniteurs physiques, l'arrêt de la projection appelle `window.appBridge.image.closeAllDisplays()` pour détruire la fenêtre Electron, évitant ainsi les fenêtres résiduelles vides.

---

## 3. Système de Modalités Extensibles

### Problème

Ajouter de nouveaux formulaires ou sélecteurs sans recréer de fenêtres à chaque fois.

### Solution : ModalProvider Dynamique

1. **useModalStore** : Ajouter le nom du nouveau composant dans `CustomModalVariant`.
2. **ModalProvider** : Créer un `case` dans le `switch` pour mapper la variante au composant React correspondant.
3. **Appel** : Utiliser `gmCustom('identifiant-de-ma-modal')`.

---

## 4. Architecture "Bridge" (Anti-Régression)

### Méthode

- **Découplage** : Ne jamais importer de modules Node/Electron dans le dossier `renderer`.
- **Standardisation** : Utiliser exclusivement `window.appBridge` pour les actions natives (système de fichiers, gestion d'écrans).
- **Hooks logic** : Séparer la logique métier pure dans des fichiers `.ts` (ou des hooks Zustand) pour pouvoir les tester sans React.

---

## 5. Pattern Singleton pour les Moteurs (Engines)

### Problème

Les écouteurs d'événements (MIDI, Clavier) ou les instances matérielles (AudioContext) se dupliquent lors des re-renders React ou du mode Strict, créant des comportements erratiques ("rebond", quadruplement des logs).

### Solution

Utiliser une classe **Singleton** pour centraliser l'accès à la ressource.

1. **Static Instance** : Une propriété privée `static instance` et une méthode `getInstance()`.
2. **Initialisation Unique** : Un flag `initialized` empêche d'attacher plusieurs fois les `addEventListener`.
3. **Fichiers** : `MidiEngine.ts`, `KeyboardEngine.ts`, `SoundEngine.ts`.

---

## 6. Contrôleur de Coordination (SoundController)

### Problème

Le déclenchement d'un son doit impacter plusieurs stores (Sound, Light, UI) de manière atomique. Disperser cette logique dans les composants crée des désynchronisations.

### Solution

Un **SoundController** (Singleton) qui encapsule l'orchestration :

- **Atomicité** : `togglePad()` s'occupe de jouer le son, mettre à jour le store Sound, et déclencher l'effet Light-OS.
- **Réversion Intelligente** : Gère la pile de lumières (LIFO) pour ne restaurer la scène manuelle que si aucun autre son prioritaire n'est actif.

---

## 7. Verrou d'Initialisation (Promise Lock)

### Problème

L'appel asynchrone à des APIs natives (ex: `navigator.requestMIDIAccess`) peut être lancé plusieurs fois avant que la première promesse ne soit résolue.

### Solution

Stocker la promesse d'initialisation dans l'Engine :

```typescript
private initializationPromise: Promise<void> | null = null;

async initialize() {
    if (this.initializationPromise) return this.initializationPromise;
    this.initializationPromise = (async () => { 
        // Logique d'initialisation réelle 
    })();
    return this.initializationPromise;
}
```

---

## 8. Gestion des Problèmes Récurrents

| Type de problème | Cause fréquente | Solution |
| :--- | :--- | :--- |
| Fenêtre vide (Modal) | Oubli du `case` dans `ModalProvider` | Vérifier que le `customVariant` envoyé par le store correspond au switch dans le fournisseur. |
| Sync non fonctionnelle | Oubli de la rehydratation | Vérifier que le listener `'storage'` est en place dans le useEffect du composant récepteur. |
| Lint error `get` inutilisé | Persist middleware | Supprimer le paramètre `get` de `(set, get) => ...` s'il n'est pas utilisé dans les actions. |
| Double trigger MIDI/Key | Multiples instances d'Engine | Passer par le Singleton de l'Engine et vérifier le flag `initialized`. |
| Lumière ne revient pas | Arrêt manuel sans Controller | Toujours utiliser `soundController.stopAll()` ou `togglePad()` pour assurer la gestion de réversion. |
| Logs illisibles | Pas de préfixe module | Utiliser le format `[MODULE] Mon message` pour que Debug-OS puisse poser un badge. |
