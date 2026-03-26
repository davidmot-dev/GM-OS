# Blueprint : Système d'Indices Interconnecté (Clues/Indices)

Ce document archive la spécification complète et le plan d'implémentation pour la fonctionnalité "Indices" de GM-OS v5, telle que définie lors de la session de brainstorming du 26 mars 2026.

## 📋 Résumé du Concept
Un système permettant au MJ de préparer des éléments d'intrigue secrets (preuves, rumeurs, objets), de les lier à l'univers existant (PNJ, Lieux, Événements) et de les révéler dynamiquement aux joueurs.

---

## 🏗️ Architecture Technique

### 1. Modèle de Données (Store `useSessionOSStore.ts`)
```typescript
interface Clue {
    id: string;
    title: string;           // "Le médaillon de la crypte"
    content: string;         // "Un bijou en argent avec une gravure..."
    mediaUrl?: string;       // Image ou illustration
    
    // Triple-Liaison (FK)
    locationId?: string;     // Lien vers AtlasMap (World Atlas)
    ownerId?: string;        // Lien vers Entity (NPC Gallery)
    eventId?: string;        // Lien vers TimelineEvent (Journal/Histoire)
    
    // Traçabilité
    isRevealed: boolean;     // État de visibilité joueurs
    revealedAt?: number;     // Timestamp UNIX de la révélation
    campaignMoment?: string; // Phase de la campagne (ex: "Acte I")
}

// Intégration dans Campaign
interface Campaign {
    // ...
    clues: Clue[];           // Liste des indices préparés
}
```

### 2. Flux de Travail (Workflows)

#### A. Préparation (MJ)
- Création dans une nouvelle section "Indices" de l'**Éditeur de Campagne**.
- Sélecteurs liés pour associer l'indice à un lieu, un PNJ et/ou un événement existant.

#### B. Consultation MJ (Visibilité Croisée)
- **Fiche PNJ** : Affichage des indices possédés par le personnage.
- **Fiche Lieu** : Affichage des indices cachés sur le lieu.
- **Timeline** : Affichage des indices liés à l'événement.

#### C. Révélation (Cockpit)
- Action manuelle du MJ via un bouton "Révéler".
- **Effets secondaires immédiats** :
    1. Mise à jour de `isRevealed` et `revealedAt`.
    2. **Projection Automatique** : Affichage plein écran sur le **Player Hub** via `ImageOS`.
    3. **Journalisation** : Création automatique d'une entrée dans le **Journal-OS** (type `ORACLE`).

#### D. Consultation Joueur (Web)
- Archivage permanent dans l'onglet "Indices" des tablettes joueurs.
- Tri chronologique par `revealedAt`.

---

## 📂 Emplacements des fichiers de référence
- **Spécification locale** : `c:\Projet_David\GM-OS-v5\docs\blueprints\clues_feature_specification.md`
- **Plan d'implémentation** : [clues_blueprint.md](file:///C:/Users/david/.gemini/antigravity/brain/8d040931-77d8-4d94-b446-53f3b6430e9c/clues_blueprint.md)

---
*Date de sauvegarde : 26 Mars 2026*
*Statut : Approuvé, Prêt pour développement*
