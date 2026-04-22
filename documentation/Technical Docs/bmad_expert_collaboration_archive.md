# 🏛️ Archive : Collaboration de l'Équipe d'Experts BMAD

Ce document archive les philosophies de design, les décisions architecturales et les standards de qualité établis par l'équipe d'experts BMAD (Winston, Sally, Carson) lors de la refonte de GM-OS v5. 

> [!IMPORTANT]
> **Raison d'être** : Ce document sert de "Mémoire Permanente" pour les futures sessions de développement, garantissant que les principes de rigueur et d'esthétique sont maintenus même après une réinitialisation de contexte.

---

## 🏗️ Winston (Architecte - Store & Logique)
*Focus : Robustesse, Évolutivité, Typage*

### 1. Slicing Pattern (Zustand)
- **Règle** : Ne jamais laisser un store dépasser 500 lignes.
- **Méthode** : Découpage en "Slices" thématiques (`src/modules/session/store/xxSlice.ts`) assemblés dans un `index.ts` racine.
- **Typage** : Centralisation de tous les schémas dans `store/types.ts` pour éviter les dépendances circulaires.

### 2. Sélecteurs Atomiques
- **Règle** : Les composants ne doivent s'abonner qu'aux données strictes dont ils ont besoin.
- **Méthode** : Utilisation systématique de `shallow` pour les sélecteurs retournant plusieurs champs.

---

## 🎨 Sally (UX & Structure UI)
*Focus : Clarté, Navigation, Organisation*

### 1. Registry Pattern (Interface)
- **Règle** : Supprimer les ternaires de rendu conditionnel dans les orchestrateurs (Dashboards).
- **Méthode** : Création d'un `ViewRegistry` qui mappe les IDs de vue à des composants et des layouts. L'ajout d'une fonctionnalité se fait par configuration, pas par modification du flux de rendu.

### 2. HUD Fixe & Cockpit Persistant
- **Règle** : L'utilisateur ne doit jamais perdre ses repères vitaux (Dés, Header, Oracle).
- **Méthode** : Seul le "Cœur" (Center View) est dynamique. Le Header et le Cockpit latéral sont ancrés et persistants.

---

## ⚡ Carson (Performance & Polissage)
*Focus : Fluidité, Esthétique Premium, Optimisation*

### 1. Standard "Premium Glass"
- **Règle** : L'interface doit évoquer une technologie de pointe ("In-World UI").
- **Méthode** : Usage généralisé du `backdrop-blur-xl`, des bordures irisées (`border-cyan-500/20`) et de textures de bruit subtiles.

### 2. Micro-Animations & Glow
- **Effet Signature** : Le **Cyan Glow** (`#06b6d4`) est réservé aux interactions liées à l'IA (Oracle).
- **Fluidité** : Utilisation de transitions CSS pures (`view-transition-fade-up`) plutôt que des bibliothèques lourdes pour minimiser le "jank" et le poids du bundle.

---

## 🛡️ Le Protocole "Chirurgical" (Standard Opérationnel)

Chaque intervention sur GM-OS v5 doit suivre ce cycle :
1.  **Analyse V3** : Lire l'ancienne logique pour ne rien perdre.
2.  **Extraction Incrémentale** : Une "tranche" à la fois. Zéro effet "Big Bang".
3.  **Point de Restauration** : Commit Git avant et après chaque phase majeure.
4.  **Audit de Continuité** : Vérification du build et des fonctionnalités existantes après chaque modification.

---
*Dernière mise à jour : 27 Mars 2026*
*Équipe : Winston (Arch), Sally (UX), Carson (Perf)*
