# Walkthrough : Notes Privées PJ & Synchronisation Nexus

**Date :** 7 Avril 2026
**Version :** GM-OS v6.2.1-dev
**Sujet :** Implémentation d'une zone de notes persistante sur le Hub Joueur avec auto-sauvegarde MJ.

---

## 🎯 Objectifs
1.  Permettre aux joueurs de prendre des notes privées sur leur tablette.
2.  Garantir la persistance de ces notes côté MJ (dans le fichier de campagne).
3.  Assurer une synchronisation fluide sans écrasement de saisie.

---

## 🛠️ Implémentation Technique

### 1. Protocole Distant (`RemoteActionType`)
Ajout de `session:update-character-narrative` pour transporter les mises à jour textuelles via WebSockets.

### 2. Store & Actions (`entitySlice.ts`)
- Mise à jour de `remoteUpdateCharacterNarrative` pour router les changements.
- Intégration dans le store MJ pour une sauvegarde dans `playerNotes`.

### 3. Composant UI (`PlayerPrivateNotes.tsx`)
- **Debounce** : Délai de 1.5s avant l'envoi pour économiser la bande passante.
- **Réactivité** : Animation de feedback "Nuage de sync" lors de la sauvegarde.
- **Stabilisation** : Utilisation de `lastSyncRef` et d'une `ref` pour `localNotes` pour briser la boucle de rendu infinie lors de la frappe.

---

## 🐞 Correction de Bug : Le Flicker de Sync
Lors des premiers tests, le composant "clignotait" et réinitialisait le curseur à chaque lettre.

- **Cause** : Un `useEffect` de nettoyage (cleanup) qui déclenchait une sauvegarde réseau sur chaque changement d'état.
- **Solution** : Découplage de l'effet de nettoyage de la dépendance `localNotes`. Utilisation d'une référence stable pour la dernière valeur connue.

---

## ✅ Résultat Final
L'interface est fluide, premium (Glassmorphism), et permet une prise de notes ininterrompue tout en garantissant que le MJ dispose toujours de la dernière version des réflexions du joueur.
