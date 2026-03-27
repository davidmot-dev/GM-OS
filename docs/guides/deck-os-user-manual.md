# Manuel Utilisateur : Deck-OS & Oracle

Ce manuel vous accompagne pas à pas dans l'utilisation du module **Deck-OS** de GM-OS v5 pour une gestion fluide et immersive de vos cartes de jeu.

---

## 🃏 1. Accéder au Module Deck-OS

Le module Deck-OS est accessible directement depuis le **Master Cockpit** (Tableau de bord du MJ) dans la section **Decks**. 

### Raccourcis Disponibles :
- **Pioche (Face cachée)** : Représentée par le dos de la carte.
- **Pioche (Face visible)** : Représentée par la dernière carte tirée.

---

## 🎲 2. Piocher & Tirer une Carte (Pas à Pas)

1.  **Survol du Deck** : Survolez la pile de pioche (dos de la carte) pour faire apparaître les contrôles de tirage.
2.  **Appui sur "Tirer" (Icône Plus)** : Cliquez sur le bouton central pour piocher une carte aléatoire.
3.  **Appui sur "Mélanger" (Icône Flèches croisées)** : En cas de deck vide ou si vous souhaitez réinitialiser la pioche, cet appui fusionne la défausse dans la pioche.

> [!NOTE]
> Le nombre de cartes restantes est affiché au-dessus de la pile de pioche pour un suivi en temps réel.

---

## 👁️ 3. Projeter aux Joueurs (Mode Oracle)

Le mode **Seer's Eye** (l'Œil de l'Oracle) permet de projeter la carte actuelle vers le **Player Hub** (écran géant) et le **Tablet Hub** (tablettes des joueurs).

### Comment Activer la Projection :
1.  **Localisez l'icône de l'Œil** : Dans le coin supérieur droit du module Deck.
2.  **Cliquez pour Activer** : L'icône devient **Cyan** (Active). La carte apparaît alors instantanément sur tous les écrans connectés.
3.  **Clean View (Automatique)** : Les joueurs ne voient **que l'image de la carte**. Toutes les informations techniques (nom, description, statistiques) sont masquées pour préserver l'immersion.
4.  **Désactivation** : Ré-appuyez sur l'icône pour couper la projection. Les écrans distants se videront automatiquement.

---

## 🔄 4. Retourner une Carte Projetée (Flip)

Si vous projetez déjà une carte et que vous souhaitez en tirer une nouvelle (ou retourner la même) :
- Le système détecte automatiquement le changement d'image.
- La mise à jour est **immédiate** sur les écrans des joueurs.
- Inutile de désactiver/réactiver la projection pour chaque carte.

---

## ⚙️ 5. Configuration Expert (Rule Engine)

Pour ajouter de nouveaux paquets de cartes ou modifier un deck existant :
1.  Ouvrez le **Rule Engine Editor**.
2.  Sélectionnez l'onglet **Decks**.
3.  Modifiez le chemin du dossier (ex: `assets/decks/votre-dossier`).
4.  Ajustez le format (Poker ou Tarot) selon les dimensions de vos images.

> [!TIP]
> Pour un affichage optimal, assurez-vous que vos images de cartes ont un ratio d'aspect constant (ex: 2:3 pour du format Poker).
