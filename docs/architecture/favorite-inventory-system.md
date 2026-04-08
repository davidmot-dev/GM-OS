# 🏗️ Architecture : Système d'Inventaire Privé (Favorite-OS & Hub)

Ce document détaille l'implémentation technique permettant au MJ de gérer des objets et de les assigner de manière sécurisée à des joueurs spécifiques via le Tablet Hub.

## 1. Modèle de Données (Store)

Le store `useFavoriteStore` a été étendu pour inclure des métadonnées de contexte :

```typescript
interface FavoriteEntity {
  id: string;
  type: 'npc' | 'location' | 'item' | 'lore';
  name: string;
  campaignId?: string; // Liaison à une campagne Session-OS
  ownerId?: string;    // characterId du PJ propriétaire
  isSyncedToPlayerHub: boolean; // Flag d'activation de la synchronisation
  // ... autres champs
}
```

## 2. Flux de Distribution des Objets

1. **Création** : L'objet est créé manuellement dans Favorite-OS ou via le **Pont Magique** du Wiki (qui injecte automatiquement le `campaignId` actif).
2. **Assignation** : Le MJ sélectionne la campagne, puis le Personnage Joueur (PJ) destinataire dans le panneau de détails.
3. **Activation** : Le MJ active le toggle "Synchroniser avec le Hub".

## 3. Synchronisation Sélective & Sécurisée (Secure Sync)

Pour éviter les fuites de données (data leakage) entre joueurs, le filtrage est effectué **à la source** dans le composant racine `App.tsx` avant la diffusion réseau :

### Logique de Filtrage (GM Side)
```typescript
const syncFavorites = allFavorites.filter(fav => {
  // 1. Toujours envoyer les favoris marqués comme publics/globaux
  if (fav.isSyncedToPlayerHub && !fav.ownerId) return true;
  
  // 2. Envoyer les favoris privés UNIQUEMENT s'ils correspondent à la campagne active
  // ET au personnage spécifique connecté sur le Hub (vérifié par characterId)
  if (fav.campaignId === activeCampaignId && fav.ownerId === targetCharacterId) return true;
  
  return false;
});
```

### Diffusion Instantanée (Zero Latency)
Depuis la v5.15, `App.tsx` s'abonne aux changements du `useFavoriteStore`. Toute modification (ajout d'un objet, changement de propriétaire) déclenche un broadcast immédiat vers les tablettes connectées.

## 4. Rendu côté Joueur (Tablet Hub)

Le Tablet Hub écoute le flux de synchronisation et met à jour son store local `useFavoriteStore`.
L'interface utilisateur (`TabletHub.tsx`) segmente l'affichage pour plus de clarté :

- **Flux "Direct" (Live)** : Affiche uniquement les favoris de type `npc`, `location` ou `lore`. Cela permet de se concentrer sur l'ambiance narrative sans encombrer l'écran avec les objets de l'inventaire.
- **Onglet "Sac" (Inventory)** : Affiche exclusivement les favoris de type `item`. C'est l'espace personnel du joueur pour consulter ses possessions.
- **Isolation** : Un joueur A ne peut jamais voir dans son code ou son état les objets assignés au joueur B.
- **Visualisation** : Le composant `HubItemViewer` assure une vue immersive de l'objet, masquant les notes techniques ou secrètes du MJ pour ne montrer que le "Lore" et l'image.

## 5. Système d'Échange P2P (Peer-to-Peer)

Depuis la v6.0, les joueurs peuvent s'échanger directement des objets via le Nexus Bridge, sous réserve de validation par le MJ.

### Structure d'une Requête de Transfert
Les demandes sont stockées dans le store global `transferRequests` de Session-OS :
```typescript
interface TransferRequest {
  id: string;             // UUID unique
  fromCharacterId: string;
  toCharacterId: string;
  item: InventoryItem;    // Copie de l'objet (Structured Item)
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}
```

### Mécanisme "Validation MJ" (Gatekeeper)
1. **Initiation** : Le joueur A clique sur "Donner" dans le Hub. L'objet est marqué `pending` localement.
2. **Notification** : Une requête est émise via WebSocket. Le MJ reçoit un indicateur visuel dans le `TradeRequestPanel`.
3. **Approbation** :
   - Le MJ approuve : l'objet est transféré atomiquement de l'inventaire du joueur A à celui du joueur B.
   - Le statut `pending` est supprimé chez les deux joueurs.
   - Une notification "Objet Reçu" est déclenchée sur le Hub du destinataire.
4. **Refus** : L'objet revient en état normal chez le donneur, et une notification de refus est envoyée.

### Sécurité & Atomicité
Les transferts utilisent `crypto.randomUUID()` pour garantir l'unicité des IDs d'objets après transfert, évitant ainsi les collisions lors de synchronisations multiples.

---
*Dernière mise à jour : 8 Avril 2026*
*Statut : Système d'échange P2P stable avec validation MJ intégrée.*

---
*Auteur : Antigravity (Advanced Agentic Coding)*
