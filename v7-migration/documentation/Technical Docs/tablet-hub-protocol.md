# Protocole de Synchronisation Tablet Hub (GM-OS v5)

## Vue d'Ensemble

Le Tablet Hub et le Player Hub communiquent avec l'application principale (GM-App) via un serveur WebSocket intégré. Pour garantir une fluidité maximale sur des terminaux mobiles parfois limités, GM-OS v5 utilise un protocole de synchronisation différentielle.

## Architecture Réseau

1. **Host (Electron)** : Lance un serveur WebSocket (Socket.io) sur le port `3001`.
2. **Clients (Web)** : Se connectent via l'URL générée par le QR Code (ex: `http://192.168.1.10:5173/tablet-hub?host=...`).
3. **Identification** : Chaque appareil est identifié par un `deviceId` unique persistant dans le localStorage du client.

## Flux de Données "Différentiel"

Pour réduire la charge réseau, l'application n'envoie pas l'état complet à chaque changement :

- **Initialisation** : Le client reçoit l'état complet (`FULL_SYNC`) à la connexion.
- **Mises à jour** : Seuls les deltas (`PARTIAL_UPDATE`) sont envoyés.
    - Exemple : `{ type: 'CLOCK_UPDATE', data: { time: '21:04' } }`.
- **Media Proxy** : Les images ne sont jamais envoyées en Base64. Le client reçoit une URL pointant vers le serveur d'assets local de l'hôte (`http://host:3002/media/...`).

## Services Dédiés

- **`SocketService.ts`** : Gère la connexion, les retries et le heartbeat.
- **`SyncCoordinator.ts`** : Orchestre la diffusion des changements d'état Zustand vers les clients connectés.

---

*Dernière mise à jour : Mars 2026*
