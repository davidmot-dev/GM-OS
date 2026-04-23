# 🚶 Walkthrough : Tablet Hub Trombinoscope & NPC UI Refactor

Ce document détaille les améliorations apportées au **Tablet Hub** et à l'interface de gestion des **PNJ** le 29 Mars 2026.

## 🌟 Nouvelles Fonctionnalités

### 1. Trombinoscope (Tablet Hub)
Les joueurs disposent désormais d'un onglet **Trombinoscope** sur leur tablette. Cet onglet affiche dynamiquement tous les personnages (PNJ, Monstres, Alliés) que le MJ a rendus publics.

- **Filtrage Intelligent** : Pour garantir l'immersion et la performance, les tablettes ne reçoivent que les entités liées à la **campagne active** et marquées comme **visibles pour les joueurs**.
- **Interaction** : Un clic sur un portrait ouvre une vue détaillée en plein écran.

### 2. Refonte de la Fiche PNJ (Master Cockpit)
L'interface de détail des PNJ a été rééquilibrée pour une meilleure lisibilité en session intense.

- **Grille 5-Colonnes** : Passage d'un layout à 4 colonnes à un système de 5 colonnes permettant une meilleure répartition des statistiques.
- **Focus Vitalité** : La section PV occupe désormais **40% de la largeur** (`col-span-2`), avec des champs de saisie élargis (`w-20`) pour les gros chiffres.
- **Harmonie Visuelle** : Toutes les caractéristiques (Vitalité, Armure, Vitesse, Initiative) partagent désormais la même structure verticale : **Icône -> Champ de saisie -> Label**.

## 🛠️ Détails Techniques

### Synchronisation WebSocket (Deep Sync)
Le serveur MJ (`App.tsx`) a été optimisé pour inclure un segment `entities` dans le payload de synchronisation. Ce segment est filtré avant l'émission :
```typescript
const entities = sessionStore.entities
    .filter(e => String(e.campaignId) === String(activeCampaignId) && e.isVisibleByPlayers)
```
Cette approche évite le "Data Leakage" entre différentes campagnes.

### Structure UI (Tailwind CSS)
L'alignement horizontal parfait des champs de saisie est garanti par l'utilisation de conteneurs flex identiques :
- `flex flex-col items-center justify-center gap-1`
- `h-7` pour les boîtes de saisie PV afin de s'aligner sur les inputs simples des autres caractéristiques.

## ✅ Validation

- `[x]` Synchronisation en temps réel lors du basculement de la visibilité MJ.
- `[x]` Isolation correcte des PNJ selon la campagne active.
- `[x]` Alignement visuel des champs dans la fiche détaillée.
- `[x]` Navigation fluide entre les onglets de la tablette.

---
*Date : 29 Mars 2026*
*Statut : Déployé & Documenté*
