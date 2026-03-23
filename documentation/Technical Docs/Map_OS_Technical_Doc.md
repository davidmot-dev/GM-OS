# 🗺️ Map-OS : Architecture des Calques & Brouillard de Guerre

Cette documentation détaille la structure technique de l'affichage cartographique et la logique de masquage physique par le brouillard de guerre.

## 🏗️ Architecture "Bridge" et Rendu

Map-OS suit le standard GM-OS v5 en séparant strictement la logique métier (TypeScript) du rendu (React). L'interface est conçue pour être performante et "pixel-perfect" sur les écrans de projection (Player Hub et Moniteurs).

## 📐 Hiérarchie des Couches (Z-Layering)

Le rendu est organisé par un empilement de calques utilisant les Z-index CSS. Cet ordre est crucial pour permettre au brouillard de guerre d'occulter les éléments de jeu de manière physique.

| Calque | Z-Index | Composant / Élément | Description |
| :--- | :--- | :--- | :--- |
| **Fond** | `10` | `img` / `video` | Carte de base chargée par le MJ. |
| **Grille** | `15` | `canvas` | Grille tactique superposée. |
| **Pions (Tokens)** | `16` | `MapTokenNode` | PNJ et PJ. Placés sous le brouillard. |
| **Magie** | `17` | `MagicLayer` | Effets de sorts et auras. Placés sous le brouillard. |
| **Zones de Danger** | `18` | `DangerZoneLayer` | Zones d'alerte. |
| **Brouillard** | `20` | `canvas` | **Masque Principal**. Recouvre tout ce qui précède. |
| **Interface / Pings** | `30+` | `MapPingLayer` | Notifications et pings (doivent rester visibles). |

## 🌫️ Brouillard de Guerre : Logique de Masquage

Le brouillard de guerre n'est plus géré par un filtrage conditionnel des données (ex: cacher le PNJ s'il est dans le brouillard), mais par un **masquage physique**.

### 1. Masquage Joueur (Player Hub)
Sur les écrans joueurs, le calque de brouillard est opaque (`opacity-100`). Puisque les pions (`z-16`) et la magie (`z-17`) sont situés sous ce calque (`z-20`), ils deviennent naturellement invisibles dès qu'ils pénètrent dans une zone non révélée du canvas.

### 2. Masquage MJ (GM View)
Sur l'interface MJ, le même calque est rendu avec une opacité réduite (`opacity-80`). Cela permet au MJ de garder une vue d'ensemble sur les pions tout en voyant distinctement les zones masquées pour ses joueurs.

## 🔄 Synchronisation et Projection

Les données de map sont synchronisées via `useMapStore.ts`. Le "Projection Engine" projette :
- L'URL de la carte et son type (Vidéo/Image).
- L'URL Data du brouillard (image PNG encodée en base64 générée par le `FogEngine`).
- La liste des pions et des effets actifs.

L'actualisation du brouillard est déclenchée par les outils de dessin du MJ (`MapControls.tsx`) qui modifient le canvas de travail, lequel est ensuite sérialisé et diffusé à toutes les instances de jeu.

## 📦 Composants Clés
- **`PlayerMapCanvas.tsx`** : Coordonne l'empilement correct pour le hub joueur.
- **`MapCanvas.tsx`** : Interface de contrôle et de rendu pour le MJ.
- **`FogEngine.ts`** : Logique bas-niveau de manipulation du canvas de brouillard.
