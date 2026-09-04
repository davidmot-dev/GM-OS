# Walkthrough : Upgrade Messagerie Tablet Hub (v5.7) — 27 Avril 2026

## 🎯 Objectifs
Améliorer l'interactivité et la clarté de la messagerie sur le Tablet Hub pour les joueurs, en résolvant les problèmes de pollution visuelle (canaux mélangés) et de manque de feedback lors de la réception de messages.

## 🛠️ Changements Majeurs

### 1. Isolation des Canaux (Filtering)
Auparavant, les messages adressés à "Tous les Joueurs" apparaissaient dans tous les onglets de discussion (MJ, Joueurs spécifiques).
- **Modification** : Refonte du filtre dans `HubMessenger.tsx`.
- **Résultat** : 
    - Le **Canal Général** affiche uniquement les messages de groupe.
    - Les **Canaux Privés** affichent uniquement le dialogue direct (Moi <-> Destinataire), masquant les annonces globales du MJ.

### 2. Notifications "Toast" Intelligentes
Ajout d'un système de feedback visuel pour ne manquer aucun message.
- **Modification** : Implémentation d'un composant `MessageToast` dans `TabletHub.tsx`.
- **Fonctionnement** : 
    - Si un message arrive sur un canal que l'utilisateur n'est pas en train de consulter, une alerte apparaît en bas de l'écran.
    - L'alerte indique l'expéditeur et le canal concerné.
    - Un clic sur la notification ouvre directement la messagerie sur le bon canal.

### 3. Refonte de l'Unread Count
Le badge de notification sur l'icône "Messages" était limité aux messages du MJ.
- **Modification** : Globalisation de la logique dans `TabletHub.tsx` pour compter tous les messages entrants non lus.

## 🧪 Vérification
- [x] Un message envoyé à "Tous les joueurs" n'apparaît plus dans l'onglet privé de Willem.
- [x] Un message privé de Willem déclenche une notification si la messagerie est fermée.
- [x] Un message global du MJ déclenche une notification si on est en train de parler en privé à un autre joueur.
- [x] Cliquer sur la notification change automatiquement le destinataire sélectionné dans `HubMessenger`.

## 📂 Fichiers Modifiés
- [HubMessenger.tsx](../../src/components/hub/HubMessenger.tsx)
- [TabletHub.tsx](../../src/components/TabletHub.tsx)
