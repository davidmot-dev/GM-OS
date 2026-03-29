# 📘 Blueprint : Assistant de Liaison Wiki (Wiki Bridge)

## 1. Vision & Objectifs
Ce système permet de transformer le Wiki d'une base de connaissances passive en un **générateur de campagne actif**. Il réduit la friction entre la narration (Lore) et l'exploitation technique (Modules de jeu).

- **Non-destructif** : L'utilisateur valide toujours manuellement la création finale.
- **Contextuel** : L'assistant s'adapte à la catégorie de l'article (Indice, PNJ, Lieu).
- **Tracé** : Les éléments créés gardent un lien vers leur source Wiki.

---

## 2. Architecture Technique

### A. État de Transition (Store)
Un nouvel état éphémère est ajouté au store local (`uiSlice` ou `sessionSlice`) :
```typescript
interface WikiBridgeState {
  pendingPreFill: {
    type: 'npc' | 'clue' | 'location' | 'item';
    sourceId: string; // ID de l'article Wiki d'origine
    data: {
      title: string;
      description: string;
      imageUrl?: string;
    };
  } | null;
}
```

### B. Le Déclencheur (WikiView)
Dans le composant `WikiView`, un bouton "Action Magique" apparaît selon la catégorie :
- **PNJ** : "👤 Créer PNJ"
- **Indice** : "📌 Épingler Indice"
- **Lieu** : "🗺️ Ajouter à l'Atlas"
- **Objet** : "📦 Ajouter aux Favoris"

### C. Le Récepteur (Formulaires Cibles)
Chaque formulaire (ex: `AddEntityForm`) écoute cet état au montage :
1. Si un `pendingPreFill` du bon type existe.
2. Injecte les données dans ses champs locaux.
3. Vide l'état `pendingPreFill` pour éviter les ré-injections accidentelles.

---

## 3. Détails des Flux par Module

| Source Wiki | Module Cible | Données Transférées | Action de Sortie |
| :--- | :--- | :--- | :--- |
| **Cat: NPC** | NPC Gallery | Titre -> Nom, Contenu -> Description, Image -> Avatar | Ouvre `AddEntityForm` |
| **Cat: Clue** | Clue Deck | Titre -> Titre, Contenu -> Contenu, Image -> MediaUrl | Ouvre `ClueEditor` |
| **Cat: Location** | Atlas Map | Titre -> Nom, Contenu -> Description | Ouvre `AddAtlasMapForm` |
| **Cat: Item** | Favorite-OS | Titre -> Nom, Contenu -> Description | Ouvre `AddFavoriteForm` |

---

## 4. Design & UX (Sally & Carson)
- **Icône** : Utilisation de `Sparkles` (baguette magique) pour le bouton principal.
- **Feedback** : Un effet de "Glow" (cyan) sur les champs pré-remplis pour signaler l'aide de l'assistant.
- **Transition** : Animation `fade-slice` lors du passage du Wiki vers le module cible.

---
*Date : 29 Mars 2026*
*Validation : BMAD Team (Winston, Sally, Carson)*
