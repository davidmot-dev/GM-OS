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

### 4. Positions : trois notions à ne pas confondre (03/09/2026)

Le graphe manipule **trois** choses différentes, et les avoir confondues faisait qu'un déverrouillage remélangeait tout :

| Notion | Ce que c'est | Où ça vit |
| :--- | :--- | :--- |
| `x / y` | Un **point de départ** rendu à la simulation | Calculé à chaque rendu |
| `fx / fy` | Une **contrainte** : le nœud ne bouge plus | Posé par le verrou ou par une épingle |
| `noeudsEpingles` | Les nœuds que le MJ a **posés à la main** | Persisté dans la campagne |

Deux règles en découlent :

*   **Un nœud rendu à D3 sans coordonnées est reposé sur une spirale.** Ce n'était donc pas la simulation qui remélangeait au déverrouillage : on lui rendait des inconnus. `placerLeNoeud` fournit toujours un point de départ.
*   **Une épingle est une décision, `nodePositions` une capture.** L'instantané est pris en bloc au verrouillage ; l'épingle est un geste isolé. L'épingle passe donc **devant**, verrouillé ou non — sinon déverrouiller épinglerait le graphe entier, c'est-à-dire remettrait le verrou qu'on vient de lever.

`detacherLesNoeuds(campaignId, noeudId?)` rend un nœud — ou tous — à la simulation. **Réinitialiser efface tout, épingles comprises** : un « reset » qui garde des contraintes laisse le MJ chercher longtemps pourquoi trois nœuds refusent de bouger.

## 🖼️ Gestion des Avatars
*   **Résolution** : Le hook `useAvatarResolver` convertit les chemins locaux ou distants en URLs utilisables par le navigateur.
*   **Format** : Les portraits sont rendus dans des éléments `<pattern>` SVG pour être affichés sous forme de cercles avec bordure.
*   **Fallbacks** : Si une image est manquante, un cercle de couleur avec l'initiale du nom est affiché.

## 📡 Synchronisation Hub
L'état du graphe (position des noeuds, zoom) est synchronisé avec les Hubs (Tablette/Joueur) via le bridge P2P pour garantir que tout le monde voit la même disposition tactique des relations.
