# 🎲 Dice Projection & Automation : Documentation Technique

## Vue d'Ensemble

Le système de projection des dés permet la diffusion instantanée et cinématique des résultats de jets de dés depuis l'interface MJ (**Dice-OS**) vers l'interface Joueurs (**Player Hub**).

L'objectif est de renforcer l'immersion tout en automatisant la gestion temporelle pour ne pas encombrer l'écran des joueurs.

## Architecture de Données

### 1. `useDiceStore` (Zustand)

Le store centralise l'état de projection et le dernier résultat.

- `isDiceProjected`: Interrupteur Maître (Master Toggle). S'il est à `false`, aucune projection automatique ne se produit.
- `projectionTrigger`: Timestamp mis à jour à chaque nouveau lancer (ou clic manuel sur "Cast"). Il déclenche l'affichage temporaire sur le Player Hub.
- `lastRoll`: Objet `RollRecord` contenant les données du jet (total, détails des dés, succès/échecs).
- **Persistance** : Le store utilise le middleware `persist` (via `localStorage`) pour synchroniser l'état entre la fenêtre MJ et les fenêtres Joueurs.

### 2. Synchronisation Cross-Window

Puisque le Player Hub tourne souvent dans une fenêtre Electron séparée, la synchronisation se fait via :

- **Événements `storage`** : Le Player Hub écoute les changements sur `gmos-dice-storage` et force une réhydratation immédiate via `useDiceStore.persist.rehydrate()`.

Logique située dans `DiceBoard.tsx` et `PlayerHub.tsx` :

### Découplage de la Projection
Contrairement aux versions précédentes, la durée d'affichage n'est plus contrôlée par le bouton MJ, mais par le composant Hub lui-même (via `projectionTrigger`).

1. **Activation MJ** : Le MJ active le mode "Cast" (Projeter). Ce bouton reste **ON** de manière persistante.
2. **Déclenchement** : À chaque jet, si le mode est **ON**, `triggerDiceProjection()` met à jour le timestamp de déclenchement.
3. **Visibilité Hub** (Timer 5s) : Le Player Hub détecte le nouveau trigger, affiche l'overlay pendant 5 secondes, puis l'estompe.
4. **Master Toggle** : Si le MJ éteint manuellement la projection, l'overlay disparaît instantanément et aucun lancer automatique ne sera diffusé par la suite.

- Définit `isDiceProjected` à `true`.
- Démarre un `setTimeout` de 5000ms.
- **Auto-Reset** : Si un nouveau jet survient (`triggerProjection` rappelé), le timer précédent est annulé via `clearTimeout` et relancé pour 5 secondes complètes.

### `handleRoll()`

Appelle `triggerProjection()` systématiquement après la mise à jour du `lastRoll`, automatisant ainsi la diffusion.

## Rendu Visuel (Player Hub)

L'overlay est situé dans `PlayerHub.tsx` (Z-Index 70).

### Transition Progressive (Fade-Out)

Contrairement aux autres composants qui se démontent immédiatement, l'overlay des dés reste dans le DOM :

- **Entrée** : `animate-in zoom-in` (Tailwind).
- **Sortie** : `transition-all duration-1000 opacity-0 scale-95`.
- Ce délai d'une seconde permet une disparition fluide ("progressive") demandée par l'utilisateur.

### Redimensionnement & Lisibilité

- Taille de police adaptative : `text-6xl` à `text-8xl`.
- Gestion des débordements : `break-words` et `leading-tight` pour supporter les chaînes de caractères longues (ex: systèmes de pools de dés).
