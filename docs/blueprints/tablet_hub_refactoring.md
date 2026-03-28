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

### Phase 1 : Onboarding & Session Guard [EN COURS]

- **Portrait PJ** : Large, immersif, en background ou carte.
- **Stats Vitales** : PV/PM/PA en barres horizontales premium.
- **Journal Public** : Affichage du résumé public de la session en cours.

## 4. Architecture Technique (Nexus Bridge)

- **Store** : `useClientStore` (local) + `useSessionOSStore` (sync).
- **Protocole** : Diffusion sélective du MJ vers la tablette.

## 5. Roadmap

- `[x]` Onboarding v1 (Radar + Grille).
- `[/]` Synchronisation bi-directionnelle (Prochaine étape).

### Phase 3 : L'Expérience "Action"

- Intégration des lancers de dés contextuels (clic sur une carac).
- Gestion de l'inventaire en temps réel.
