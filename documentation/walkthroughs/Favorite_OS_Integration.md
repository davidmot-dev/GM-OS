# Walkthrough : Favorite-OS & Hub d'Entités

Favorite-OS fait office de système de management de contenu (CMS) interne pour GM-OS v5, liant la préparation statique à l'action dynamique.

## ⚙️ Architecture & Persistance
Favorite-OS repose sur une structure de données hautement persistée :
- **Zustand & LocalStorage** : Chaque entité est stockée localement (Zustand `persist`). Les données ne sont jamais perdues, même après fermeture de l'OS.
- **Dual View Pattern** : 
    - `FavoriteGrid` : Optimisé pour la performance avec rendu "lazy" des images.
    - `FavoriteFullDossier` : Interface riche utilisant des composants complexes (MediaBrowser integration).

## 🔗 Orchestration Inter-Modules (The Bridge)
Ce module est l'un des plus intégrés car il pilote plusieurs stores :
- **Combat Integration** : Appelle directement `useCombatStore.addCombatant`.
- **Map Integration** : Appelle `useMapStore.addToken` en injectant l'avatar défini dans le dossier.
- **Player Hub Bridge** : Utilise le bridge IPC pour synchroniser l'état `isSyncedToPlayerHub`. Si `Voice-OS` est actif, le niveau d'entrée audio est mixé avec les métadonnées du favori pour piloter les animations du Hub.

## 📊 Modèle de Données `FavoriteEntity`
La structure est extensible :
- **Attributes** : Utilise un `Record<string, string>` pour une flexibilité totale selon les systèmes.
- **Stats** : Utilise un `Record<string, number>` (0-100) pour alimenter les composants de gauges visuelles.
- **Media Mapping** : Gère les IDs du Media Hub pour une résolution de ressources robuste.

## ✅ Vérification
- Validation de l'envoi vers `CombatTracker`.
- Test de la création de tokens sur `Map-OS`.
- Vérification de la persistance après un rechargement (F5).
- Test du MediaBrowser pour la sélection d'images.
