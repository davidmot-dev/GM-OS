# Walkthrough - Universal Search (Spotlight)

Le module **Universal Search** (Spotlight) est une fonctionnalité transverse de GM-OS v5 permettant une navigation ultra-rapide et des actions contextuelles sans quitter le module actif.

## 🚀 Concept & Raccourci

Accessible via **`CMD+K`** (Mac) ou **`CTRL+K`** (Windows/Linux), cet overlay glassmorphique permet de rechercher instantanément dans tous les stores de l'application.

## 🛠️ Architecture Technique

Le Spotlight n'est pas qu'une simple barre de recherche, c'est un **pont inter-stores** :

- **Multi-Store Scanning** : Le hook `useSpotlight` agrège en temps réel les données de :
    - `useSessionOSStore` : PNJ, Monstres, Héros, Maps, Wiki.
    - `useMusicStore` : Playlists et Pads musicaux.
    - `useAmbientStore` : Thèmes et Scènes d'ambiance.
    - `useSoundStore` : Atmosphères et FX.
- **Optimisation** : Utilisation de `useMemo` pour filtrer les résultats sans impacter le thread principal lors de la saisie.
- **Navigation Clavier** : Gestion complète des événements `KeyDown` pour une utilisation "sans souris".

## 📂 Résultats et Actions

| Type | Action Système |
| :--- | :--- |
| **Entité** | Navigation vers `npc-gallery` et focus sur l'entité. |
| **Map** | Chargement de la carte dans `world-atlas`. |
| **Audio** | Lecture immédiate (Play) du pad ou du thème. |
| **Wiki** | Ouverture de l'entrée de règle ou du lore. |
| **Action** | Saut vers les paramètres ou les drivers système. |

## 🎨 Design & UX

- **Glassmorphism** : Fond flouté (`backdrop-blur-md`) et bordures semi-transparentes pour une intégration premium.
- **Scroll Automatique** : L'élément sélectionné reste toujours visible dans la liste.
- **Responsive** : S'adapte à la largeur de l'écran avec une largeur maximale de `2xl`.

---

> [!NOTE]
> Ce module a été implémenté pour répondre au besoin de réactivité du MJ lors des sessions intenses où chaque seconde compte.
