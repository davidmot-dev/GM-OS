# 📜 Historique : Raffinement de la Navigation & Zoom Tactique (6 Avril 2026)

Ce document archive les travaux réalisés pour stabiliser l'expérience utilisateur du MJ dans Session-OS et Map-OS.

## 🎯 Objectifs de la Session
1. Éliminer les conditions de course (Race Conditions) lors de la navigation entre modules.
2. Fiabiliser le zoom à la molette dans le module Map-OS.
3. Harmoniser l'interface avec le standard Glassmorphism 2.0.

## 🛠️ Travaux Techniques

### 1. Stabilisation de la Navigation (Session-OS)
- **Pattern Atomique** : Introduction d'actions Zustand regroupées (`navigateToAtlasMap`, `navigateToNpcDetail`). Cela garantit que le changement de vue et la sélection de l'entité se produisent dans le même cycle de rendu React.
- **Correction UX** : Les clics sur les "Lieux Épinglés" et "PNJs Actifs" dans le Cockpit redirigent désormais correctement vers l'entité sélectionnée sans réinitialisation indésirable.

### 2. Interaction Tactique (Map-OS)
- **Native Scroll Lock** : Migration de l'événement `onWheel` vers un écouteur d'événement natif avec `{ passive: false }`. Cela permet de bloquer le défilement de la page parente (`preventDefault`) au profit du zoom de la carte.
- **Optimisation du Rendu** : Correction d'un cycle de dépendance infini dans le `useEffect` de chargement des médias. Le zoom ne "rebondit" plus pour se réinitialiser à chaque mouvement de molette.

## 📂 Documentation Mise à jour
Suite au workflow `[doc]`, les fichiers suivants ont été actualisés :
- `roadmap-v6.md` : Mise à jour du statut des phases 0 et 1.
- `docs/dev/Lessons_Learned_Archive.md` : Documentation des pièges de dépendances Zustand et des événements passifs.
- `session-os-modular-architecture.md` : Ajout des standards de navigation atomique.
- `01-Prise-en-main.md` : Mention de la fluidité accrue pour les utilisateurs.

## 📊 Conclusion
Le système est désormais prêt pour les tests de combat tactique intensifs. Les fondations de navigation cross-module sont durcies pour les futurs développements de la Phase 2.

---
*Agent : antigravity*
*Projet : GM-OS v6.1.1-dev*
