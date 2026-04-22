# 🔗 Social Nexus : Documentation Technique

Le **Social Nexus** est un moteur de visualisation de graphes relationnels utilisant D3.js pour représenter les liens entre les personnages (PJ et PNJ).

## 🏗️ Architecture

### 1. Structure de Données
Le graphe est alimenté par les données de session :
*   **Nodes** : PJ (Joueurs) et PNJ (Non-Joueurs).
*   **Links** : Relations définies dans la session (Amis, Ennemis, Famille, etc.).

### 2. Moteur de Simulation (D3.js)
La simulation utilise plusieurs forces :
*   `forceLink` : Maintient les noeuds connectés à une certaine distance.
*   `forceManyBody` : Gère la répulsion/attraction entre les noeuds (Gravité).
*   `forceCenter` : Maintient le graphe au centre du conteneur.
*   `forceCollide` : Évite que les avatars ne se chevauchent.

### 3. Réactivité des Réglages
Pour permettre une édition interactive, le composant React `SocialGraph.tsx` surveille les changements de paramètres physiques :
*   Lorsqu'un slider est manipulé, la simulation est relancée avec `alphaTarget(0.3)`.
*   Cela permet au graphe de se réorganiser en temps réel sans attendre la stabilisation naturelle de D3.

## 🖼️ Gestion des Avatars
*   **Résolution** : Le hook `useAvatarResolver` convertit les chemins locaux ou distants en URLs utilisables par le navigateur.
*   **Format** : Les portraits sont rendus dans des éléments `<pattern>` SVG pour être affichés sous forme de cercles avec bordure.
*   **Fallbacks** : Si une image est manquante, un cercle de couleur avec l'initiale du nom est affiché.

## 📡 Synchronisation Hub
L'état du graphe (position des noeuds, zoom) est synchronisé avec les Hubs (Tablette/Joueur) via le bridge P2P pour garantir que tout le monde voit la même disposition tactique des relations.
