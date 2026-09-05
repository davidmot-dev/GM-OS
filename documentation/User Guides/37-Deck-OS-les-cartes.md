# Deck-OS

Bienvenue dans le guide complet de **Deck-OS**, votre moteur de cartes interactif pour GM-OS. Ce manuel vous guide pas à pas pour une maîtrise totale de vos paquets de cartes.

---

## 🎲 1. Accéder au Deck-OS

Le module Deck-OS se trouve dans le **Master Cockpit** (Tableau de bord du MJ), sous l'onglet **Decks**. 

### Éléments Visuels :
- **Pile de Pioche** : Représentée par le dos de vos cartes (`back.png`).
- **Carte Courante** : Affiche la dernière carte piochée, face visible.
- **Compteur** : Affiche le nombre de cartes restantes dans le deck.

---

## 🃏 2. Piocher & Tirer une Carte (Pas à Pas)

1.  **Survol du Deck** : Passez votre souris sur le dos de la carte (pile de gauche).
2.  **Cliquer sur "+" (Tirer)** : Cliquez sur le bouton central pour piocher une nouvelle carte.
3.  **Animation** : La nouvelle carte remplace la précédente avec une animation fluide.
4.  **Action de Tirage** : Chaque tirage est enregistré automatiquement dans votre journal de session.

---

## 👁️ 3. Projeter aux Joueurs (Le Seer's Eye)

Le mode **Seer's Eye** (icône de l'œil) est votre outil de projection vers le **Player Hub** et le **Tablet Hub**.

### Étapes de Projection :
1.  **Activation** : Cliquez sur l'icône de l'œil (coin supérieur droit du deck). L'icône devient **Cyan**, indiquant que la projection est active.
2.  **Affichage Joueur** : La carte actuelle apparaît instantanément sur tous les écrans connectés.
3.  **Mode Oracle (Immersif)** : Les joueurs ne voient **que l'image**. Le nom, la description et les statistiques techniques sont masqués pour garder le mystère.
4.  **Changement de Carte** : Tirez une nouvelle carte pendant que l'œil est actif ; elle se mettra à jour automatiquement chez les joueurs.

---

## 🃏 Les cartes qu'un joueur garde en main

> ⭐ **Livré et éprouvé en partie réelle le 2026-08-30.**

Une carte tirée peut **quitter le paquet** pour rejoindre la main d'un joueur. Elle apparaît alors
dans l'onglet **Cartes** de sa tablette, et elle y reste — d'une séance à l'autre.

### Ce qu'il faut comprendre

- **Une carte gardée est un quatrième tas.** Pas un objet d'inventaire : le **paquet** détient la
  vérité. *Un inventaire aurait dû croire l'expéditeur sur parole.*
- **Elle sort des trois autres tas.** Un même index ne peut pas être à la fois dans la défausse et
  dans la main de quelqu'un — sinon deux endroits diraient la vérité sur la même carte.
- **Les paquets sont fermés par défaut.** Un joueur ne pioche que si vous l'ouvrez.
- **Un don se demande.** Donner une carte à un autre joueur envoie une **demande** ; le destinataire
  accepte ou refuse. Personne d'autre que lui ne peut accepter à sa place.

### Si un geste est refusé

Trois couches d'autorisation se prononcent, et elles ne disent pas la même chose :

1. **Qui vous êtes** — meneur ou joueur.
2. **Tenez-vous vraiment cette carte ?**
3. **Ce type de carte existe-t-il ?**

Un refus est presque toujours l'une des trois qui fait son travail.

> ⚠️ **La liste « Donner à » du meneur ne filtre pas par connexion, celle des joueurs si.** C'est
> délibéré : le meneur doit pouvoir attribuer une carte à un joueur absent ce soir-là. **Ne pas les
> aligner.**

---

## 🔄 4. Mélanger & Réinitialiser

Si vous atteignez la fin du deck ou si vous jouez avec un système de défausse :
- Cliquez sur l'icône de **Mélange** (flèches croisées) lors du survol de la pioche.
- Toutes les cartes de la défausse sont immédiatement remises dans la pioche.
- Le compteur de cartes se réinitialise instantanément.

---

## ⚙️ 5. Configuration (Rule Engine)

Pour ajouter vos propres decks ou modifier les chemins d'accès :
1.  Ouvrez le **Rule Engine Editor**.
2.  Allez dans l'onglet **Decks**.
3.  Modifiez le chemin du dossier (ex: `assets/decks/votre-nom-de-deck`).
4.  Ajustez le format (**Poker** ou **Tarot**) pour une dimension d'affichage optimale.

---

## 💡 Conseils & Astuces

- **Vision Dynamique** : Si vous utilisez la voix, la carte projetée sur les Hubs "respire" au rythme de votre parole pour un effet mystique saisissant.
- **Clean View** : N'hésitez pas à projeter vos plus belles illustrations ; le système s'occupe de supprimer tout le superflu textuel !
