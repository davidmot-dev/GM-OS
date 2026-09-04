# Walkthrough : Session Resumption & IP Fallback (v7.0.3)

## 🎯 Objectif
Garantir la reprise de session même si l'identifiant unique de la tablette (`deviceId`) est perdu ou réinitialisé lors d'un rafraîchissement, en utilisant l'adresse IP comme identifiant de secours pour les sessions "fantômes".

## 🛠️ Changements Apportés

### 1. Stabilisation du `deviceId` (`useClientStore.ts`)
- Initialisation immédiate du `deviceId` en lisant directement le `localStorage` avant même l'hydratation de Zustand.
- Cela évite l'envoi d'un ID temporaire aléatoire au serveur lors du premier rendu après un refresh.

### 2. Transmission de l'IP (`SyncServer.ts`)
- Capture de l'adresse IP (`remoteAddress`) du socket WebSocket lors de l'enregistrement.
- Transmission de cette IP au `SessionManager`.

### 3. Récupération par IP (`SessionManager.ts`)
- Ajout d'une logique de **Takeover par IP** : Si un personnage est déjà verrouillé par une session en mode "ghost" (récemment déconnectée), et qu'une nouvelle connexion arrive avec le **même IP** et le **même characterId**, le serveur autorise la reprise du verrou, même si le `deviceId` est différent.
- Ce mécanisme sert de filet de sécurité robuste si le stockage local du navigateur est capricieux.

## 🧪 Vérification
1. Connecter un personnage sur le Hub.
2. Rafraîchir la page vigoureusement.
3. Le Hub doit conserver le même `deviceId` grâce au fix d'initialisation.
4. (Test Limite) : Si on vide manuellement le cache/localStorage et qu'on rafraîchit, le serveur doit quand même nous autoriser à reprendre notre personnage car notre IP n'a pas changé et la session précédente est encore en "ghost" (pendant 2 min).

---
*Date: 27 Avril 2026*
*Version: GM-OS v7.0.3*
