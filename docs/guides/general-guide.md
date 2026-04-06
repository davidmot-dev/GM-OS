# Guide de l'Utilisateur GM-OS v5

## 🎮 Expérience Joueur : Tablet Hub & Inventaire

Les joueurs disposent désormais d'un **Tablet Hub** réactif qui est leur interface principale durant la session.

- **Inventaire (Sac)** : Les objets que vous assignez aux joueurs dans **Favorite-OS** apparaissent instantanément dans leur onglet "Sac". Ils peuvent cliquer sur un objet pour en voir l'image et la description narrative en plein écran.
- **Trombinoscope** : Une galerie des PNJ rencontrés (si marqués comme visibles par vous).
- **Lancers de Dés** : Les joueurs peuvent lancer des dés depuis leur fiche de personnage, avec résultats synchronisés sur le Cockpit du MJ.

## 🛡️ Gestion de Session : Lobby & Cohérence

Le Lobby a été amélioré pour une meilleure visibilité :

- **Liste des Joueurs** : Défilement automatique pour voir tous les joueurs connectés, même en grand nombre.
- **Identification** : Le lobby affiche clairement le **Nom de la Session** active pour éviter toute confusion lors de la connexion.
- **Sécurité** : Les personnages ne sont visibles dans le lobby qu'une fois la session officiellement démarrée.

## 🎛️ Session-OS : Le Cockpit du MJ

Le Cockpit est le centre névralgique de votre partie. Il regroupe les outils de narration et de suivi en temps réel.

### Gestion des Indices (Session Clue Deck)

Dès qu'un indice est marqué comme **Révélé** dans votre gestionnaire de campagne, il apparaît automatiquement dans le **Deck de Session** (en bas de votre écran).

- **Herméticité** : Le système filtre intelligemment les indices pour n'afficher que ceux appartenant à la **campagne active**.
- **Projection Hub** : D'un simple clic sur l'icône de partage, l'indice (image et texte) est envoyé instantanément sur les tablettes des joueurs connectés au **Tablet Hub**.

### Navigation & Projection de l'Atlas

Le module Map-OS permet désormais une projection fluide et synchronisée :

- **Navigation Tactique** : La navigation vers vos cartes de l'Atlas est instantanée. Le zoom à la molette a été optimisé pour une précision maximale.
- **Projection de l'Atlas** : Vous pouvez projeter la carte tactique entière sur le **Player Hub** ou sur des **Moniteurs Externes** (respect du ratio *object-contain*).

### Oracle IA Contextuel (Liaison Neurale)

L'Oracle IA n'est pas qu'un simple chatbot ; il a accès au contexte "vivant" de votre session.

- **Conscience de Session** : Lorsque vous posez une question, l'Oracle consulte automatiquement :
    - La liste des **indices révélés**.
    - L'état de santé et la classe de vos **Joueurs (PJ)**.
    - Les **PNJs** actuellement en vie dans la campagne.
    - Les **derniers événements** de votre chronique.
- **Interactions Immersives** : Vous pouvez lui demander des conseils basés sur les personnages présents (ex: *"Suggère une interaction entre le Scribe et le Guerrier suite à leur dernière trouvaille"*).
- **IA Localisée** : Le contexte est strictement limité à la campagne en cours pour éviter toute confusion.

## 🛠️ Maintenance du Système

### Nettoyage des Médias (Media Cleanup)

GM-OS stocke les images et sons localement dans une base de données interne (IndexedDB). Pour éviter d'encombrer votre disque avec des fichiers inutiles, un service de nettoyage automatique est intégré.

#### Fonctionnement Automatique

Le système effectue un cycle de nettoyage **5 secondes après chaque démarrage** de l'application. Vous n'avez aucune action à faire pour maintenir votre bibliothèque propre.

#### Nettoyage Manuel

Si vous venez d'effectuer un grand ménage dans vos PNJ ou campagnes :

1. Ouvrez les **Paramètres Globaux** (icône engrenage).
2. Allez dans l'onglet **Système**.
3. Cliquez sur le bouton **"Nettoyer"**.

## 🛰️ Portabilité des Campagnes (Nexus-OS)

GM-OS intègre un système complet de portabilité appelé **Nexus-OS**. Il permet d'exporter une campagne entière (PNJs, cartes, images, sons) dans un fichier `.gmos`.

Pour le guide complet, consultez : `docs/guides/nexus-os-user-guide.md`

---
*Dernière mise à jour : 6 Avril 2026*
*Statut : Document à jour — Oracle IA Contextuel intégré.*
