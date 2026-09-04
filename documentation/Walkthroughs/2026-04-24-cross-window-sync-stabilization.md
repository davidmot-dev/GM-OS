# 🚀 Stabilisation de la Synchronisation Temps Réel (Cross-Window)

**Date :** 24 Avril 2026
**Version :** GM-OS v5.5 (Stabilisation)
**Auteur :** Antigravity AI

## 📋 Résumé des Corrections
Cette intervention a résolu trois problèmes critiques de synchronisation entre la fenêtre MJ et les fenêtres de projection (Player Hub / Moniteurs) :
1. **L'écran noir sur Ping** : Un esclave pouvait écraser l'état global du Master.
2. **Le "Snapback" des Tokens** : Les pions revenaient en arrière lors d'un déplacement depuis un esclave.
3. **Le Blackout au Boot** : Les fenêtres de projection s'ouvraient sur un fond noir au lieu de charger la carte actuelle.

## 🛠️ Modifications Techniques

### 1. Renforcement du Service de Synchronisation (`CrossWindowEventService.ts`)
- **Authoritative Relay Only** : Le Master ne relaie plus les messages bruts des esclaves. Il met à jour son propre store, puis diffuse un état complet et cohérent (`broadcastFullState`).
- **Debounce de Diffusion** : Ajout d'un `relayTimer` de 50ms pour grouper les mises à jour rapides (drag de token) et éviter de saturer le canal BroadcastChannel.
- **Handshake d'Initialisation** : Ajout d'un écouteur `hub:ready`. Dès qu'un esclave est chargé, il demande l'état complet au Master, garantissant un affichage immédiat de la carte et du climat.

### 2. Correction de la Garde de Synchronisation (`useMapStore.ts`)
- **Bug Détecté** : La protection `syncToPlayers` vérifiait uniquement `?mode=hub`, mais les fenêtres "Moniteur" utilisent `?window=projector`. L'esclave Moniteur tentait donc de synchroniser son état local (vide) vers le Master, causant des écrans noirs.
- **Solution** : Normalisation de la détection `isSlaveWindow` pour inclure tous les paramètres URL possibles (`window` et `mode`).

### 3. Enrichissement du Payload de Base
- Ajout systématique des données environnementales (`projectedWeatherType`, `projectedTimeOfDay`, `projectedMagicEffects`) dans le broadcast initial pour garantir l'immersion dès l'ouverture du Hub.

## 🧪 Résultats des Tests
- [x] **Handshake** : L'ouverture d'un Moniteur affiche instantanément la carte du MJ sans action manuelle.
- [x] **Ping Slave** : Un clic sur le Moniteur crée un ping visible par tous sans couper l'image de la carte.
- [x] **Drag Token** : Les pions déplacés depuis le Player Hub suivent le curseur de manière fluide sans effet de "retour en arrière".
- [x] **Parité Environnement** : Le climat (pluie, neige) est synchronisé immédiatement à l'ouverture des fenêtres.

---
*Ce correctif marque la fin de la phase de stabilisation de la migration vers BroadcastChannel pour les fenêtres multiples.*
