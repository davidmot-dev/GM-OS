# Favorite-OS

**Favorite-OS** est le "Codex" personnel du Maître de Jeu. C'est ici que sont centralisés vos PNJ, Lieux, Objets et Éléments de Lore favoris pour un accès et une projection instantanée en cours de partie.

---

## 🖥️ Le Dashboard Favorite-OS
L'interface se divise en trois zones majeures :
1. **La Galerie (Grid View)** : Vue d'ensemble de vos favoris avec filtres par catégorie (PNJ, Lieux, etc.) et barre de recherche.
2. **Le Panneau de Détails (Sidebar)** : Apparaît lors de la sélection d'une entité pour une consultation rapide.
3. **Le Full Dossier** : Un mode immersif plein écran pour éditer chaque aspect d'une entité.

---

## 📇 Anatomie d'un Dossier Premium
Chaque favori peut être enrichi de nombreuses données :
- **Identité** : Nom, Surnom et Type (PNJ, Lieu, Objet, Lore).
- **Visuels** : 
    - **Portrait** : Image haute définition pour l'immersion.
    - **Token** : Icône circulaire utilisée sur la Map.
- **Dossier Narratif** : lore public pour les joueurs, et **notes secrètes** réservées au meneur.

> ⛔ **Ces notes ne sont pas chiffrées**, contrairement à ce qu'annonçait cette page. Elles sont
> réservées au meneur au sens où **aucun écran joueur ne les affiche** — c'est une séparation
> d'interface, pas une protection. Elles sont en clair dans le stockage local.
- **Attributs Rapides** : Listes de caractéristiques textuelles (ex: Alignement, Santé, Poids).
- **Gauges de Puissance** : Barres visuelles pour représenter des scores (ex: Menace, Rareté, Intelligence).

---

## 🚀 Intégrations Cross-Modules
Favorite-OS n'est pas qu'une base de données, c'est une plaque tournante pour GM-OS :

### 1. ⚔️ Vers Combat-OS
Pour un PNJ, cliquez sur **"COMBAT"** ou **"SEND TO COMBAT"**. 
- Le PNJ est instantanément ajouté au Combat Tracker avec son nom, son initiative aléatoire et son icône.

### 2. 🗺️ Vers Map-OS
Pour un PNJ ou un Lieu, cliquez sur **"MAP"** ou **"SEND TO MAP"**.
- Un pion (Token) est créé instantanément au centre de votre carte active, prêt à être positionné.

### 3. 📺 Vers Player Hub (Projection Unifiée)
Activez l'interrupteur **"SYCHRO"** ou cliquez sur l'icône **"PROJECTER"** sur un dossier.
- **Réception Visuelle** : L'illustration et le nom de l'entité sont projetés sur l'écran des joueurs dans une grille élégante.
- **Neural Hub Sync** : Si vous parlez avec votre micro, l'interface du Hub réagit dynamiquement pour indiquer que ce personnage est en train de s'exprimer.
- **Intelligence Anti-Doublon** : Le système gère intelligemment les projections multiples. Si vous projetez une image d'ambiance en même temps que la fiche d'un PNJ, l'interface s'organise automatiquement sans créer de redondance visuelle inutile.

---

## 🔍 Organisation & Recherche
- **Catégories** : Filtrez instantanément par type d'entité via les boutons du haut.
- **Étoiles** : marquez vos entités les plus importantes pour les retrouver en haut de liste.
- **Propriétaire** : un dossier peut appartenir à un **personnage joueur**, ce qui le rend privé à
  sa tablette. Utile pour un objet personnel, un contact, un secret de personnage.
- **Dernière Vue** : Le système suit votre historique de consultation pour vous proposer vos favoris récents.

---

## 💾 Vos favoris et la sauvegarde

> ⛔ **Deux affirmations dangereuses, retirées le 2026-09-04.** Cette page annonçait une
> « synchronisation avec votre coffre central (Vault) » et une pastille verte *« Vault Synced »*
> qui **« confirme que vos données sont en sécurité »**. **Aucun coffre, aucune pastille, aucune
> synchronisation n'existe** — le mot *Vault* n'apparaît nulle part dans le module. Elle annonçait
> aussi un **bouton Export** au format JSON : il n'existe pas non plus.

✅ **Corrigé le jour même : vos favoris sont désormais dans la sauvegarde**, automatique et
manuelle. Ils n'y étaient pas.

*C'était la même famille que Map-OS : une donnée qu'on crée sans y penser est une donnée qu'on
oublie de protéger. Les deux sont entrées ensemble.*

→ [Guide de la sauvegarde automatique](./91-Sauvegarde-automatique.md)

---

> [!TIP]
> **Le Media Hub** : Lorsque vous éditez un dossier, cliquez sur l'icône de dossier à côté des URLs d'images pour ouvrir le **Media Hub**. Vous pourrez alors sélectionner visuellement vos fichiers sans avoir à copier-coller des chemins complexes !

---

*Guide révisé le 2026-09-04, code à l'appui. **Trois affirmations fausses retirées**, dont deux de
la famille la plus coûteuse : un coffre de synchronisation qui n'existe pas et « confirmait que vos
données sont en sécurité », un bouton d'export qui n'existe pas, et des notes secrètes annoncées
comme chiffrées alors qu'elles sont en clair. Ajouté : le rattachement d'un dossier à un personnage
joueur, et le fait que le module **n'est dans aucune sauvegarde**.*
