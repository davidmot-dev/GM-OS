# 🗺️ GM-OS v5 - Jalon : Stabilisation UI & Cycle de Vie (2026-04-22)

Ce document récapitule les avancées sur la robustesse de l'interface et la gestion des campagnes.

> ### 🗃️ Vérifié dans le code le 2026-08-31
>
> Ce document est un **jalon daté d'avril 2026**, pas une liste vivante. Ses cases restées vides ont
> été rouvertes une à une : ce qui était fait est coché avec son ancre, ce qui reste a rejoint la
> **section ⭐** de `2026-08-23-chantiers-gares.md`, seule liste qui fasse foi.


## ✅ Jalons Atteints

### 🛡️ Stabilisation de l'Interface
- **Remplacement des Select Natifs** : Migration du formulaire de campagne vers le composant `Select` personnalisé.
- **Correction du Bug de Fenêtre Externe** : Élimination des ouvertures de listes déroulantes hors du container Electron.
- **Nettoyage du Cockpit** : Suppression des raccourcis redondants (Grimoire) pour libérer de l'espace visuel.
- **Navigation Forge -> Grimoire** : Ajout d'un bouton de redirection directe après la cristallisation d'une règle.
- **Aesthetic Premium** : Alignement des composants de sélection sur le design système "Glassmorphism" de GM-OS.

### ⚙️ Gestion du Cycle de Vie des Campagnes
- **Désactivation de Campagne** : Implémentation d'un bouton de déconnexion sécurisée dans la bibliothèque.
- **Synchronisation Obsidian** : Liaison automatique du coffre (vault) Obsidian à la campagne active.
- **Persistence des Chemins** : Mise à jour en temps réel des chemins système lors des changements de session.

## 🛠️ Travaux en Cours (Backlog)
- [ ] Généraliser l'usage du composant `Select`. → **section ⭐**, et **compté le 31/08 : 37 fichiers
      emploient encore `<select>` natif contre 5 qui utilisent le composant.** ⚠️ *À mesurer avant de
      traiter* : le motif d'avril était un **bug** — des listes s'ouvrant hors du container Electron —
      et non l'esthétique. S'il a disparu avec une version de Chromium, le chantier se ferme
      gratuitement.
- [x] Sélecteur de fichiers/répertoires natif pour le dossier Obsidian. ✅ **Fait** —
      `electron/obsidian_bridge.ts:157` (`dialog.showOpenDialog`).
- [x] Confirmation visuelle de synchronisation. ✅ **Fait** — `gmToast(result.message, 'success')` dans
      `RuleWorkshopViewer.tsx:290`.

## 📈 Impact Utilisateur
L'utilisateur bénéficie d'une interface plus stable, sans "saut" de fenêtre inattendu, et d'une gestion transparente de ses notes externes via Obsidian.
