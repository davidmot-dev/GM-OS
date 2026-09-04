# Walkthrough - Eject All Feature & Reset Global

Cette mise à jour ajoute une fonction critique de maintenance pour le lobby des terminaux : le bouton **Éjecter Tout**. Il permet au MJ de réinitialiser instantanément toutes les connexions distantes et de libérer les verrous de personnages en cas de problème technique ou de changement de joueurs.

## 🚀 Fonctionnalités implémentées

### 1. Panneau Télécommande (GM)
- Ajout d'un bouton **"Éjecter Tout"** dans `Paramètres OS > Télécommande`.
- Le bouton déclenche un signal IPC `remote:eject-all`.
- Il réinitialise également les verrous de personnages dans le store local du MJ pour une réactivité immédiate.

### 2. Serveur WebSocket (`SyncServer.ts` & `SessionManager.ts`)
- Nouveau handler `remote:eject-all`.
- Envoie un message `remote:ejected` à chaque client connecté avant de fermer sa socket.
- Appel à `sessionManager.clearAll()` qui vide toutes les sessions actives et annule les timers de déconnexion ("ghosts").

### 3. Tablet Hub (`useHubSync.ts`)
- Écoute du message `remote:ejected`.
- Déclenche un `resetIdentity()` complet (efface `characterId`, `isOnboarded`, `pseudo`).
- Affiche une erreur explicite : *"Connexion réinitialisée par le MJ"*, redirigeant le joueur vers l'écran de sélection de personnage.

## 🛠️ Détails Techniques

### Mismatch de Clés corrigé
J'en ai profité pour fixer un bug de synchronisation où le MJ envoyait les verrous sous `characterLocks` mais la tablette attendait `connectedCharacters`. Le store accepte désormais les deux clés.

### Sécurité & État
L'éjection est "propre" : elle ne se contente pas de couper la connexion, elle ordonne aux clients de s'auto-nettoyer pour éviter qu'ils ne tentent de se reconnecter immédiatement avec la même identité erronée.

## 📝 Documentation
- Mise à jour de `documentation/Lessons_Learned.md` (Leçon 19).
- Mise à jour des fichiers de traduction `fr/settings.json` et `en/settings.json`.

---
*GM-OS v6.2.0 - System Forge Edition*
