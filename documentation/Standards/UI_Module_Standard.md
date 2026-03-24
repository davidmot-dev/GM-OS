# 🎨 GM-OS v5 : Standard de Design Module (Premium Sidebar)

Ce guide définit le standard visuel "Forge v5.6" pour les modules de GM-OS. L'objectif est de garantir une uniformité esthétique et ergonomique à travers toute la plateforme.

## 🏗️ Structure du Layout (Core)

Chaque module premium doit suivre cette structure à trois niveaux :

1.  **Banner Supérieure (Premium Bar)** : 
    *   Hauteur fixe (`h-20`).
    *   Bouton Retour (`ArrowLeft`) avec effet hover d'échelle.
    *   Zone d'édition du titre et de l'emoji.
    *   Bouton d'action principal (ex: "Synchroniser") avec ombre portée lumineuse (`shadow-glow`).

2.  **Sidebar de Navigation** :
    *   Largeur fixe (`w-24`).
    *   Icônes Lucide centrées dans des boutons carrés arrondis (`rounded-2xl`).
    *   Indicateur d'état actif : Bande verticale lumineuse à droite et fond coloré translucide.

3.  **Espace de Travail (Main Workspace)** :
    *   Fond sombre (`bg-[#0a0a0c]`).
    *   Dégradé radial subtil en arrière-plan (`radial-gradient`).
    *   Centrage du contenu (`max-w-5xl mx-auto`).

## 💎 Glassmorphism & Tokens CSS

Utilisez exclusivement ces utility classes Tailwind pour l'aspect premium :

- **Background Glass** : `bg-white/[0.03]` ou `bg-black/40` combiné avec `backdrop-blur-xl`.
- **Borders** : `border-white/10` (pour le neutre) ou `border-[color]-500/20` (pour l'accent).
- **Cards** : `p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem]`.
- **Inputs** : `bg-black/40 border-white/10 focus:border-[color]-500/50 shadow-inner`.

## 🌈 Palettes Thématiques Recommandées

| Module / Type | Couleur Primaire | Fond Translucide | Ombre (Glow) |
| :--- | :--- | :--- | :--- |
| **Système / Core** | `text-cyan-400` | `bg-cyan-500/10` | `shadow-cyan-500/20` |
| **Combat / Action** | `text-indigo-400` | `bg-indigo-500/10` | `shadow-indigo-500/20` |
| **Narratif / Lore** | `text-blue-400` | `bg-blue-500/10` | `shadow-blue-500/20` |
| **Tactique / Map** | `text-emerald-400` | `bg-emerald-500/10` | `shadow-emerald-500/20` |
| **IA / Cortex** | `text-violet-400` | `bg-violet-500/10` | `shadow-violet-500/20` |
| **Danger / Alert** | `text-rose-400` | `bg-rose-500/10` | `shadow-rose-500/20` |

## ✨ Micro-Animations

- **Fade In** : Appliquer `animate-fade-in` sur le conteneur principal du workspace.
- **Scale Hover** : `hover:scale-105 active:scale-95 transition-all`.
- **Icon Bounce** : `group-hover:translate-x-1` (pour les flèches) ou `scale-110` (pour les icônes).

---

> [!TIP]
> Pour un effet de profondeur maximal, utilisez des dégradés radiaux de la couleur d'accent avec une opacité très faible (`0.05`) dans les coins opposés.
