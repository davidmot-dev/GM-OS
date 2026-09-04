# Walkthrough : Super-Stable Identity (v7.0.4)

## 🎯 Objectif
Résoudre définitivement le changement d'identifiant de la tablette lors des déconnexions ou rafraîchissements, garantissant que le MJ voit toujours le même terminal physique.

## 🛠️ Changements Apportés

### 1. Identifiant "Hardware" Persistant (`useClientStore.ts`)
- Création d'une clé `localStorage` dédiée (`gmos-tablet-uuid`) indépendante du store Zustand.
- Cette clé est vérifiée **en priorité absolue** lors de l'initialisation.
- Même si le store principal est réinitialisé ou corrompu, le `deviceId` reste identique car il est ancré dans le stockage local de bas niveau.
- La fonction `resetIdentity` (Full Reset) a été modifiée pour **conserver** cet identifiant matériel par défaut.

### 2. Visibilité Debug (`LobbyOnboarding.tsx`)
- Ajout de l'affichage du `Device ID` (tronqué) dans le footer de l'écran de sélection des personnages.
- Cela permet au joueur de vérifier visuellement que son identifiant ne change pas après un "Quitter session".

## 🧪 Vérification
1. Se connecter avec Daniel.
2. Cliquer sur "Quitter session".
3. Vérifier que le `Device ID` affiché en bas de l'écran est le même qu'avant.
4. Dans le cockpit MJ, aucun nouveau terminal ne doit apparaître ; la ligne Daniel doit simplement passer en mode "déconnecté" ou se mettre à jour si on choisit un autre personnage.

---
*Date: 27 Avril 2026*
*Version: GM-OS v7.0.4*
