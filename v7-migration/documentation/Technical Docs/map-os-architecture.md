# 🗺️ Architecture Technique : Map-OS (Atlas)

## 1. Vue d'ensemble

Map-OS utilise un système de rendu multi-calques basé sur des composants React positionnés de manière absolue dans un conteneur transformé (zoom/pan). Cette architecture permet une séparation nette entre le fond de carte, les éléments de jeu (fiches, zones) et les effets atmosphériques.

## 2. Pile de Calques (Stacking Context)

L'ordre d'empilement est crucial pour garantir que le brouillard de guerre masque les éléments appropriés tout en laissant les pings et l'ambiance visibles.

| Couche | Z-Index | Description |
|---|---|---|
| **Base Layer** | `z-10` | Image ou Vidéo de fond de carte. |
| **Grid Layer** | `z-15` | Grille de combat (Canvas). |
| **Tokens Layer** | `z-16` | Pions des personnages et PNJ. |
| **Magic/Danger** | `z-18` | Effets de sorts et zones de danger. |
| **Fog Layer** | `z-20` | Brouillard de guerre (Canvas principal). |
| **Ambiance** | `z-25` | **[NOUVEAU]** Filtres de moment de la journée. |
| **Weather** | `z-25` | Particules météo (Pluie, Neige). |
| **Ping Layer** | `z-30` | Pings d'interaction (toujours au-dessus). |
| **UI/Controls** | `z-40+` | Curseurs de dessin et menus contextuels. |

## 3. Système d'Ambiance (`AmbianceLayer`)

Le système d'ambiance applique des transformations visuelles globales à la carte sans modifier les assets originaux.

### Fonctionnement technique :
- **Composant** : `AmbianceLayer.tsx`
- **Moteur** : `framer-motion` pour des transitions fluides (2s) entre les états.
- **Filtres** : Utilisation de `backdrop-filter` (luminosité, contraste, saturation) et `mix-blend-mode: multiply` pour le tinting coloré.
- **Réactivité** : Branché sur `timeOfDay` du `MapStore`.

### États supportés :
- `dawn` : Teinte orangée, contraste doux.
- `day` : Teinte neutre, pleine luminosité.
- `overcast` : Désaturation, luminosité réduite (couplé auto avec météo).
- `dusk` : Teinte pourpre/dorée.
- `night` : Bleu profond (`#0a0b2e`), luminosité 60%.

## 4. Synchronisation & Projection

Le `useMapStore` gère deux états miroirs : l'état **Master** et l'état **Projecté**.
Lorsqu'un calque comme `AmbianceLayer` est rendu dans le `PlayerMapCanvas`, il reçoit la prop `isProjectedView={true}`, ce qui lui impose d'écouter `projectedTimeOfDay` au lieu de l'état local du MJ. Cela garantit une synchronisation parfaite entre l'écran du MJ et les Hubs/Moniteurs des joueurs.

---

## 5. Persistent Fog v2 (Performance & Persistence)

La v6.3.0 introduit une refonte du moteur de brouillard pour supporter les cartes haute résolution (4K+) sans dégradation du framerate.

- **Fog Registry Optimization** : Le stockage du brouillard est passé d'une matrice dense à un système de **Chunks compressés**. Seules les zones modifiées par le MJ sont sérialisées et transmises.
- **RLE Compression (Run-Length Encoding)** : Les données de masque sont compressées avant synchronisation, réduisant la charge utile WebSockets de ~80% sur les grandes cartes.
- **Persistance Nexus** : Le registre de brouillard est désormais inclus dans le manifeste `.gmos`, permettant de restaurer l'état exact de l'exploration lors de la réimportation d'une campagne.

---
*Dernière mise à jour : 17 Avril 2026 - GM-OS v6.3.2 : Persistent Fog v2.*
