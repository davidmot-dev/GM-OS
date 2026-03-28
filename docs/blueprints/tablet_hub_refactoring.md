# Blueprint : Tablet HUB Refactoring

## 1. Vision & Objectifs

- **Cible** : Joueurs uniquement.
- **Utilité** : Compagnon de jeu interactif en temps réel durant les sessions.
- **Accessibilité** : Tablette ou Mobile.

## 2. Onboarding Dynamique

Expérience interactive, immersive et exclusivement centrée sur les joueurs.

## 🌟 Vision "HUB Réactif"

Le Tablet HUB n'est plus un simple visualiseur passif, mais un prolongement numérique du personnage dans l'univers de jeu.

### 1. Architecture Logicielle (Winston)

- **Session Guard** : Le HUB est un module "éphémère". Il n'affiche son contenu que si une session est `active` dans le store global. Si le MJ ferme la session, le HUB verrouille l'UI.
- **Identity Token** : L'identité du joueur ne repose plus sur un simple pseudo, mais sur un `characterId` lié à une entité `PlayerCharacter` du store Session-OS.
- **WebSocket Bridge** : Les messages sortants du HUB (lancers de dés, notes) incluent systématiquement le `characterId`.

### 2. Standard Visuel & UX (Sally)

### Écran Initial : Radar Sonar

- **État "Hors Session"** : Radar à l'arrêt, message "En attente d'une session active...".
- **État "Session Détectée"** : Scan radar circulaire vert (2s), passage automatique à la sélection.

### Écran de Sélection : Biométrie PJ

Balayage laser Cyan traverse le portrait pour simuler une authentification sécurisée.

- **Status Glow** : L'état de santé et les conditions critiques sont signalés par des lueurs colorées sur les bords de la tablette.
- **Active Pouch** : Une barre d'action rapide (Inventaire/Sorts/Notes) toujours accessible sans quitter la vue principale.

### 3. Performance & Optimisation (Carson)

- **Resource Pre-loading** : Dès que l'onboarding commence, les portraits des PJ présents sont chargés en cache locale `DataURL`.
- **Selective Sync** : The HUB ne s'abonne qu'aux updates concernant son propre `characterId` et les événements mondiaux (Journal), réduisant la charge CPU.

---

## 🛠️ Phases d'Implémentation

### Phase 1 : Onboarding & Session Guard [TERMINÉ]

- **Portrait PJ** : Large, immersif, en background ou carte.
- **Stats Vitales** : PV/PM/PA en barres horizontales (affichage seul).
- **Journal Public** : Affichage du résumé public de la session en cours.

### Phase 2 : Identité & Interaction Bi-directionnelle [TERMINÉ]

- **Liaison d'Identité** : Le HUB se lie à un `characterId` spécifique.
- **Hub Character Sheet** : Nouvelle vue interactive pour le joueur ("Moi").
- **Remote Vitals Update** : Le joueur peut modifier ses propres HP/MP/AP depuis la tablette.
- **Supervision MJ** : Notification automatique sur l'écran du MJ pour chaque modification distante (prévention d'erreurs/triche).
- **HUB Configuration** : Checkbox dans l'éditeur de personnage pour définir quelles ressources afficher sur le HUB.

## 4. Architecture Technique (Nexus Bridge)

- **Store** : `useClientStore` (local) + `useSessionOSStore` (sync).
- **Protocole** : Diffusion sélective du MJ vers la tablette.

## 5. Roadmap

- `[x]` Onboarding v1 (Radar + Grille).
- `[x]` Phase 2 : Synchronisation bi-directionnelle & Notifications MJ (Terminé).
- `[/]` Phase 3 : Interaction directe (Inventaire ok, Dés à venir).

### Phase 3 : L'Expérience "Action" [EN COURS]

- Intégration des lancers de dés contextuels (clic sur une carac).
- Gestion de l'inventaire en temps réel [TERMINÉ]
