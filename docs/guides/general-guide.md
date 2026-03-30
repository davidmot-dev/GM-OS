# Guide de l'Utilisateur GM-OS v5

### 🎮 Expérience Joueur : Tablet Hub & Inventaire

Les joueurs disposent désormais d'un **Tablet Hub** réactif qui est leur interface principale durant la session.
- **Inventaire (Sac)** : Les objets que vous assignez aux joueurs dans **Favorite-OS** apparaissent instantanément dans leur onglet "Sac". Ils peuvent cliquer sur un objet pour en voir l'image et la description narrative en plein écran.
- **Trombinoscope** : Une galerie des PNJ rencontrés (si marqués comme visibles par vous).
- **Lancers de Dés** : Les joueurs peuvent lancer des dés depuis leur fiche de personnage, avec résultats synchronisés sur le Cockpit du MJ.

### 🛡️ Gestion de Session : Lobby & Cohérence

Le Lobby a été amélioré pour une meilleure visibilité :
- **Liste des Joueurs** : Défilement automatique pour voir tous les joueurs connectés, même en grand nombre.
- **Identification** : Le lobby affiche clairement le **Nom de la Session** active pour éviter toute confusion lors de la connexion.
- **Sécurité** : Les personnages ne sont visibles dans le lobby qu'une fois la session officiellement démarrée.

## 🎛️ Session-OS : Le Cockpit du MJ

Le Cockpit est le centre névralgique de votre partie. Il regroupe les outils de narration et de suivi en temps réel.

### Gestion des Indices (Session Clue Deck)
Dès qu'un indice est marqué comme **Révélé** dans votre gestionnaire de campagne, il apparaît automatiquement dans le **Deck de Session** (en bas de votre écran).
- **Her méticité** : Le système filtre intelligemment les indices pour n'afficher que ceux appartenant à la **campagne active**. Vous ne risquez plus de voir des indices d'une autre aventure par erreur.
- **Projection Hub** : D'un simple clic sur l'icône de partage, l'indice (image et texte) est envoyé instantanément sur les tablettes des joueurs connectés au **Tablet Hub**.

### Oracle AI (Liaison Neurale)
L'Oracle AI n'est pas qu'un simple chatbot ; il a accès au contexte "vivant" de votre session.
- **Auto-Contexte** : Lorsque vous posez une question, l'Oracle consulte automatiquement la liste des indices que vous avez déjà révélés pour vous aider à rester cohérent dans vos improvisations.
- **IA Localisée** : Le contexte est strictement limité à la campagne en cours.

## 🛠️ Maintenance du Système

### Nettoyage des Médias (Media Cleanup)
GM-OS stocke les images et sons localement dans une base de données interne (IndexedDB). Pour éviter d'encombrer votre disque avec des fichiers inutiles (par exemple, des avatars de PNJ que vous avez supprimés), un service de nettoyage automatique est intégré.

#### Fonctionnement Automatique
Le système effectue un cycle de nettoyage **5 secondes après chaque démarrage** de l'application. Vous n'avez aucune action à faire pour maintenir votre bibliothèque propre.

#### Nettoyage Manuel
Si vous venez d'effectuer un grand ménage dans vos PNJ ou campagnes et souhaitez libérer de l'espace immédiatement :
1. Ouvrez les **Paramètres Globaux** (icône engrenage).
2. Allez dans l'onglet **Système**.
3. Cliquez sur le bouton **"Nettoyer"**.
4. Le système vous informera du nombre de fichiers supprimés et du gain d'espace.

---
*Dernière mise à jour : 30 Mars 2026*
*Statut : Document à jour pour le Stability Patch V5*
