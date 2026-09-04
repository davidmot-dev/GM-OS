# Walkthrough : Session Resumption & Multi-Socket Stability (v7.0.2)

## 🎯 Objectif
Permettre à un joueur de se reconnecter à son personnage s'il utilise le même appareil, même si la session précédente est encore en mode "ghost" (ex: après un rafraîchissement de page ou une fermeture accidentelle du navigateur).

## 🛠️ Changements Apportés

### 1. Multi-Socket Tracking (`SyncServer.ts`)
- Implémentation d'une `deviceSocketMap` qui compte le nombre de WebSockets ouverts par `deviceId`.
- Le mode **Ghost** n'est activé que lorsque la **dernière** connexion d'un appareil est coupée. Cela évite les déconnexions intempestives si le joueur ouvre plusieurs onglets.

### 2. Préservation de l'Identité (`useClientStore.ts` & `LobbyOnboarding.tsx`)
- Ajout d'une action `logout` qui réinitialise le personnage et le pseudo mais **garde le `deviceId`**.
- Le bouton "Quitter la session" utilise désormais `logout` au lieu de `resetIdentity`.
- Cela permet au joueur de changer de personnage sans être considéré comme un "nouvel appareil" par le serveur, ce qui facilite la reprise de session.

### 3. Logique de Reprise (`SessionManager.ts`)
- Le serveur autorise désormais explicitement la reprise d'un verrou si le `deviceId` correspond au propriétaire actuel (même si le statut est `active` ou `ghost`).

## 🧪 Vérification
1. Connecter un personnage sur le Hub.
2. Rafraîchir la page (ou fermer/rouvrir l'onglet).
3. Le personnage doit être immédiatement disponible à la sélection car le `deviceId` est reconnu.
4. Si on essaie de se connecter sur un AUTRE appareil (autre navigateur ou navigation privée), l'accès reste refusé.

---
*Date: 26 Avril 2026*
*Version: GM-OS v7.0.2*
