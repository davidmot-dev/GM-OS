# 🗄️ Guide Utilisateur : Media Hub

Le **Media Hub** est la bibliothèque centrale de GM-OS v5. C'est ici que sont stockés, indexés et organisés tous les fichiers que vous utilisez dans vos sessions : illustrations, musiques, effets sonores, vidéos d'ambiance et documents de référence.

![Aperçu du Media Hub](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/media_hub_mockup.png)

## 📋 Présentation du Module

Le Media Hub n'est pas qu'un simple explorateur de fichiers ; c'est une base de données optimisée pour le jeu de rôle :

1. **Stockage Persistant (IndexedDB)** : Vos fichiers sont stockés localement dans le navigateur/application. Ils restent disponibles même si vous déplacez les fichiers originaux sur votre ordinateur.
2. **Multi-Formats** : Support natif des images, de l'audio, de la vidéo et des documents (PDF, texte, markdown).
3. **Système de Tags** : Une méthode d'organisation transversale pour retrouver vos assets par thème plutôt que par dossier.
4. **Recherche Instantanée** : Filtrez des centaines de fichiers en quelques millisecondes.

## 🚀 Importer et Gérer vos Médias

### Ajout de Fichiers
- Cliquez sur **"Importer des fichiers"** pour ouvrir le sélecteur de votre système.
- GM-OS trie automatiquement les fichiers par type :
    - **Images** : JPG, PNG, WEBP, GIF.
    - **Audio** : MP3, WAV, OGG, M4A.
    - **Vidéo** : MP4, WebM.
    - **Documents** : PDF, TXT, DOCX, MD, RTF.

### Actions sur les Fichiers
En survolant un média, plusieurs icônes apparaissent :
- **Aperçu (🔍/▶️)** : Affiche l'image en grand, lance la lecture audio avec contrôles, ou ouvre la vidéo.
- **Sélectionner (✔️)** : Utilise ce média dans le module qui a ouvert le Hub (ex: choisir une image pour Image OS).
- **Renommer (✏️)** : Modifie le nom d'affichage sans toucher au fichier source.
- **Supprimer (🗑️)** : Retire définitivement le fichier du Media Hub.

## 🏷️ Organisation par Tags et Filtres

### Utilisation des Tags
Les tags sont le cœur de l'organisation du Media Hub. Un même fichier peut avoir plusieurs tags (ex: une image peut être taguée `PNJ`, `Elfe` et `Important`).
- **Ajouter un Tag** : Cliquez sur l'icône **+** sous le nom du fichier et tapez votre mot-clé.
- **Filtrer par Tag** : Utilisez la barre latérale droite pour sélectionner un tag. Seuls les fichiers correspondants s'afficheront.

### Filtrage par Type
Dans la barre d'outils supérieure, vous pouvez isoler un type de média spécifique :
- **Tous** : Affiche l'intégralité de votre bibliothèque.
- **Images** : Uniquement les visuels.
- **Audio** : Uniquement les sons/musiques.
- **Vidéo** : Uniquement les clips animés.
- **Doc** : Vos documents de règles et notes.

## 🎞️ Aperçu Plein Écran

Pour une meilleure visibilité, le Media Hub propose un mode "Focus" :
- **Images** : Zoom haute définition.
- **Audio** : Lecteur dédié avec barre de progression et réglage de volume, idéal pour tester un son avant de le diffuser.
- **Vidéo** : Lecture plein écran intégrée.
*Appuyez sur **ESC** pour quitter l'aperçu.*

---

## ⚙️ Configuration Technique

- **Stockage Local** : Le Media Hub utilise la technologie IndexedDB. La limite de stockage dépend de votre navigateur/système, mais elle permet généralement de stocker plusieurs gigaoctets de données.
- **Vider le Hub** : Le bouton **"Vider le Hub"** supprime TOUTES les données stockées. À utiliser avec précaution !

---

> [!TIP]
> **Le Tag "Ambiance"** : Créez un tag `Ambiance` pour vos musiques et sons de fond. Cela vous permettra de préparer vos playlists dans le Music OS beaucoup plus rapidement en filtrant par ce tag dans le Hub.

> [!IMPORTANT]
> Les fichiers importés dans le Media Hub sont **dupliqués** dans la base de données interne de l'application. Cela garantit qu'une modification ou suppression accidentelle des fichiers sur votre disque dur n'affectera pas votre session de jeu.
