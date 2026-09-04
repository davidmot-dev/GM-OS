# Walkthrough v5.3 : Bouton Panique & Optimisation de Projection

## 📝 Résumé de la Session
Cette mise à jour apporte une fonctionnalité critique de sécurité ("Panic Button") et résout des problèmes de fluidité et de fiabilité dans les modules audio et image.

## 🚀 Nouvelles Fonctionnalités

### 1. Bouton Panique (Stop All)
Un nouveau bouton **Stop All** a été ajouté au contrôleur audio principal (Header).
- **Usage** : Un seul clic coupe tout simultanément.
- **Actions** :
  - Arrêt des Decks Music.
  - Arrêt des SFX.
  - Fade-out (1s) de l'ambiance.
  - Blackout des images.
  - Extinction des Philips Hue.

### 2. Transitions d'Images Fluides
Les projections d'images utilisent désormais un système de **Fade Out / Fade In**.
- Fini les coupures sèches entre deux illustrations.
- Transition douce de 300ms.

### 3. Fiabilité du Single-Click
Correction du bug "Double-Clic" : les images se projettent désormais instantanément dès la première sélection, sans besoin de cliquer deux fois.

## 🛠️ Coulisses Techniques

### Résolution des Dépendances Circulaires
L'intégration du Panic Button dans le Shell avait initialement bloqué la lecture de la musique à cause d'une boucle d'importation entre `Shell -> MasterAudioController -> Engines -> Stores -> Shell`.
- **Solution** : Utilisation d'un accès dynamique via l'objet `window` au moment du clic, découplant totalement l'UI du chargement initial des moteurs.

### Typage Strict
Mise en place d'une interface locale `GMWindow` pour sécuriser l'accès aux moteurs globaux tout en conservant la flexibilité du bridge.

## ✅ Tests de Validation
- [x] Vérification du Stop All : Musique, Ambiance, Image et Lumière s'arrêtent bien en synchro.
- [x] Test de transition : Les images s'enchaînent avec un fondu propre.
- [x] Test de régression : La musique fonctionne toujours après un rechargement complet de l'application (fix DP circulaire).
- [x] Test de sélection : Une image projetée le reste même après changement de module.

---
> [!IMPORTANT]
> **Performance** : L'accès dynamique aux moteurs via `window` est désormais le standard pour les composants UI globaux situés dans le `Shell`.
