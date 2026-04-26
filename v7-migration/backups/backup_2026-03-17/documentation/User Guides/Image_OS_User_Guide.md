# 🖼️ Guide Utilisateur : Image OS

Le module **Image OS** est votre régie visuelle. Il vous permet de projeter des illustrations, des portraits de PNJ, des cartes ou des ambiances visuelles sur différents écrans (Hub Joueur, Moniteurs secondaires, Vidéoprojecteurs) pour renforcer l'immersion de vos joueurs.

![Aperçu du module Image OS](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/image_mockup.png)

## 📋 Présentation du Module

L'interface est divisée en trois zones principales :

1. **La Bibliothèque (Explorer)** : Gérez vos images avec un système de dossiers et de favoris.
2. **Le Sélecteur de Cible (Target)** : Choisissez sur quel écran projeter votre média.
3. **Le Contrôle de Projection** : Lancez des images isolées, des séquences ou coupez tout en un clic.

## 🚀 Projection et Gestion des Écrans

### Choisir sa Cible (Target Screen)
En haut de l'interface, vous pouvez sélectionner l'écran de destination :
- **Player Hub** : Envoie l'image vers l'application "Hub" des joueurs (fenêtré).
- **Displays (1, 2, etc.)** : Envoie l'image en plein écran sur vos moniteurs physiques connectés à l'ordinateur.

### Modes de Projection
- **Solo** : Un simple clic sur une image l'envoie instantanément sur l'écran cible.
- **Sequence** : Le bouton "Project Sequence" fait défiler automatiquement les images marquées comme "actives" dans votre bibliothèque.
- **Entity (NPC/PC)** : GM-OS peut projeter une fiche complète de personnage (nom, portrait, statistiques publiques) vers le Player Hub pour que les joueurs visualisent immédiatement leur interlocuteur.

## 📁 Organisation de la Bibliothèque

Pour ne pas perdre de temps à chercher une image en plein combat :

- **Dossiers** : Créez une structure claire (ex: *Lieux*, *PNJ*, *Cartes*, *Objets*).
- **Favoris (⭐)** : Marquez vos images les plus utilisées pour un accès rapide.
- **Filtres** : Utilisez la barre de recherche pour retrouver un asset par son nom de fichier.

## 🛑 Contrôle de Sécurité (Blackout)

La gestion visuelle peut être sensible (spoilers). Image OS propose deux niveaux de sécurité :

- **Target Blackout** : Éteint uniquement l'image sur l'écran cible actuellement sélectionné.
- **Global Blackout (🔴 ALL)** : Coupe instantanément la projection sur TOUS les écrans connectés. Indispensable pour masquer une carte secrète ou finir une scène sur un écran noir dramatique.

---

## 💡 Astuces pour l'Immersion

> [!TIP]
> **Le Player Hub Dynamique** : Contrairement aux écrans secondaires qui n'affichent que l'image brute, le **Player Hub** peut recevoir des entités riches. Si vous projetez un PNJ via le module NPC OS, Image OS affichera non seulement son portrait mais aussi son ambiance dédiée si elle est configurée.

> [!IMPORTANT]
> **Snapshots** : L'état de vos projections (quelle image est sur quel écran) est enregistré dans votre session. Si vous fermez et rouvrez GM-OS, vos écrans se rallumeront exactement là où vous les aviez laissés.

---

## ⚙️ Configuration Technique

- **Multi-Écrans** : Le module détecte automatiquement le nombre de moniteurs branchés via le `appBridge`.
- **Formats Supportés** : PNG, JPG, WEBP, et même les GIF animés pour des ambiances vivantes.
- **Performance** : Les images sont pré-chargées pour éviter tout délai lors de la projection.
