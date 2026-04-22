# Blueprint : Système d'Indices Interconnecté (Clues/Indices)

Ce document archive la spécification complète et l'implémentation finale pour la fonctionnalité "Indices" de GM-OS v5, livrée le 27 mars 2026.

## 📋 Résumé du Concept
Un système transverse permettant au MJ de préparer des éléments d'intrigue secrets (preuves, rumeurs, objets), de les lier à l'univers existant (PNJ, Lieux, Événements) et de naviguer fluidement entre ces entités.

---

## 🏗️ Architecture Technique (Implémentation Finale)

### 1. Modèle de Données (Store `chronicleSlice.ts`)
Le modèle suit la structure définie initialement, avec une intégration dans le store Zustand modulaire.
- **Localisation** : `src/modules/session/store/chronicleSlice.ts`
- **Champs de base** : `id`, `title`, `content`, `mediaUrl`, `locationId`, `ownerId`.
- **Traçabilité v5.2** : 
    - `isRevealed` (boolean) : État de visibilité.
    - `revealedAt` (number/timestamp) : Date de première révélation.
    - `campaignMoment` (string) : Contexte narratif (ex: "Session 2, Acte I").

### 2. Composants UI
| Composant | Rôle |
| :--- | :--- |
| `CluesManager.tsx` | Gestionnaire centralisé (CRUD) avec support des images (ResolvedAsset) et suivi narratif. |
| `NpcDetail.tsx` | Affiche les indices liés au PNJ via `ownerId`. |
| `AtlasMapDetail.tsx` | Affiche les indices liés au lieu via `locationId`. |
| `SessionClueDeck.tsx` | Widget Cockpit spécialisé pour la projection rapide et le défilement des indices. |
| `TabletHub.tsx` | Archive sécurisée pour les joueurs (ne montre que les indices révélés). |

### 3. Intégrations Narratives
- **Navigation Inter-Modules** : Liens directs depuis Atlas et NPC Gallery vers l'éditeur d'indices.
- **Journal-OS Sync** : Toute révélation d'un indice génère automatiquement un événement `NOTE` (`🔎 Indice Révélé`) dans le journal de session actif, incluant le `campaignMoment` et la description.

---

## 📂 Fichiers de Référence
- **Logique Store** : [chronicleSlice.ts](file:///c:/Projet_David/GM-OS-v5/src/modules/session/store/chronicleSlice.ts)
- **Gestionnaire** : [CluesManager.tsx](file:///c:/Projet_David/GM-OS-v5/src/modules/session/components/CluesManager.tsx)
- **Widget Deck** : [SessionClueDeck.tsx](file:///c:/Projet_David/GM-OS-v5/src/modules/session/components/SessionClueDeck.tsx)

---
*Dernière mise à jour : 27 Mars 2026*
*Statut : ✅ TERMINÉ / IMPLÉMENTÉ*
