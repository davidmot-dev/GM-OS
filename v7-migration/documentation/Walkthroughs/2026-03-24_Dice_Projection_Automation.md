# Walkthrough : Projection Automatique des Dés (v5.6)

Ce walkthrough documente l'implémentation du système de projection automatique des résultats de dés vers le Player Hub.

## 🎯 Objectif
Permettre au MJ de partager les résultats des dés de manière cinématique et automatique, sans intervention manuelle répétitive.

## 🛠️ Implémentation technique

### 1. Store Global & Persistance
Le `useDiceStore.ts` a été mis à jour pour inclure :
- Le middleware `persist` pour la survie aux rafraîchissements.
- La gestion du `lastRoll` comme source de vérité pour les fenêtres distantes.

### 2. Automatisation (MJ)
Dans `DiceBoard.tsx` :
- Création de `triggerProjection()` : déclenche un état de projection de 5 secondes avec auto-reset.
- Intégration dans `handleRoll()` : chaque lancer déclenche désormais la projection.

### 3. Effets Cinématiques (Player Hub)
Dans `PlayerHub.tsx` :
- Animation d'entrée : Zoom + Fondu.
- Animation de sortie : Fade-out progressif d'une seconde (`duration-1000`).
- Redimensionnement adaptatif : Support des systèmes de Pool (YZE) via `text-6xl md:text-8xl`.

## ✅ Validation
- [x] L'overlay apparaît dès le clic sur "Roll".
- [x] L'overlay disparaît seul après 5 secondes.
- [x] Les lancers successifs maintiennent l'overlay actif (reset du timer).
- [x] La sortie est fluide (pas de coupure nette).
