# 🗄️ Guide Utilisateur : Media Hub

Le **Media Hub** est la bibliothèque centrale de GM-OS v5. C'est ici que sont stockés, indexés et organisés tous les fichiers que vous utilisez dans vos sessions : illustrations, musiques, effets sonores, vidéos d'ambiance et documents de référence.

![Aperçu du Media Hub](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/media_hub_mockup.png)

## 📋 Présentation du Module

Le Media Hub n'est pas qu'un simple explorateur de fichiers ; c'est une base de données optimisée pour le jeu de rôle :

1. **Stockage Persistant (IndexedDB)** : Vos fichiers sont stockés localement dans le navigateur/application. Ils restent disponibles même si vous déplacez les fichiers originaux sur votre ordinateur.
2. **Multi-Formats** : Support natif des images, de l'audio (MP3, WAV), de la vidéo et des documents (PDF, MD).
3. **Système de Tags & Campagnes** : Une méthode d'organisation transversale pour retrouver vos assets par thème ou par aventure.
4. **Nettoyage Intelligent** : Les étiquettes (tags) de campagne sont automatiquement retirées si la campagne associée est supprimée, gardant votre bibliothèque propre.
5. **Recherche Instantanée** : Filtrez des centaines de fichiers par nom, type ou tag en quelques millisecondes.

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

## 🛡️ Panneau de Détails Tactique (Side Panel)

En cliquant sur un média, un panneau latéral s'ouvre pour offrir un contrôle approfondi :

- **Visualisation HD** : Aperçu rapide sans quitter le flux de travail.
- **Gestion des Campagnes** : Liez/déliez le média à vos campagnes actives via des badges interactifs.
- **Indexation Dynamique** : Modifiez les tags et le nom d'usage en temps réel.
- **Status Tactique** : Affiche si le média est actuellement utilisé dans la session en cours.

- **Isolation de Session** : Les nouveaux imports sont automatiquement taggués avec la campagne active si ce mode est activé ou si vous êtes en session.

## 🔒 Persistance des Médias (Asset Lock)

Parfois, vous importez des assets pour une utilisation future ou des éléments de lore qui ne sont pas encore liés à des PNJ ou des cartes. Pour éviter qu'ils ne soient supprimés par le système de nettoyage automatique, vous pouvez les verrouiller :

1.  **Verrouiller** : Dans le **Panneau de Détails Tactique**, cliquez sur l'icône de **Cadenas Ouvert**. Elle se transformera en **Cadenas Fermé** cyan.
2.  **Notification** : Un badge "Persistant" apparaîtra sous l'image pour confirmer la protection.
3.  **Visualisation Grille** : Dans le navigateur de médias, une petite icône de cadenas apparaît sur la vignette de l'asset.

> [!TIP]
> **Planification à l'avance** : Verrouillez vos "Boss" ou vos "Cartes Secrètes" dès l'import pour être sûr qu'ils ne disparaissent pas avant le grand jour !

---

## ⚙️ Configuration Technique

- **Stockage Local** : Le Media Hub utilise la technologie IndexedDB. La limite de stockage dépend de votre navigateur/système, mais elle permet généralement de stocker plusieurs gigaoctets de données.
- **Nettoyage Automatique** : Pour optimiser les performances, GM-OS scanne régulièrement la base de données pour supprimer les fichiers "orphelins" (ceux qui ne sont liés à aucun PNJ, aucune playlist, aucun thème d'ambiance ou aucune campagne). Les fichiers marqués comme **Persistants** sont systématiquement épargnés.
- **Déliaison de Campagne** : Lorsqu'une campagne est supprimée dans **Session-OS**, le Media Hub retire automatiquement l'ID de cette campagne de tous les médias indexés. Le fichier physique n'est pas supprimé, mais il ne sera plus "badgé" avec cette campagne.
- **Vider le Hub** : Le bouton **"Vider le Hub"** supprime TOUTES les données stockées (y compris les fichiers persistants). À utiliser avec précaution !

---

> [!TIP]
> **Le Tag "Ambiance"** : Créez un tag `Ambiance` pour vos musiques et sons de fond. Cela vous permettra de préparer vos playlists dans le Music OS beaucoup plus rapidement en filtrant par ce tag dans le Hub.

> [!IMPORTANT]
> Les fichiers importés dans le Media Hub sont **dupliqués** dans la base de données interne de l'application. Cela garantit qu'une modification ou suppression accidentelle des fichiers sur votre disque dur n'affectera pas votre session de jeu.
