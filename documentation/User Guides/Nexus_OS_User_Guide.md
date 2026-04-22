# Guide de l'Utilisateur — Nexus-OS : Export & Import de Campagnes

Ce guide explique comment utiliser le système **Nexus-OS** pour exporter votre campagne complète dans un fichier portable `.gmos` et la réimporter sur un autre appareil (ou après réinstallation).

---

## 🚀 Qu'est-ce que Nexus-OS ?

Nexus-OS est le système de **portabilité** de GM-OS. Il vous permet de :

- **Exporter** une campagne entière (PNJs, cartes, wiki, sons, images) dans un seul fichier `.gmos`.
- **Importer** ce fichier sur n'importe quel autre poste GM-OS.
- **Sauvegarder** vos aventures avant une migration ou réinstallation.

---

## 📤 Exporter une Campagne

### Depuis la Bibliothèque de Campagnes

1. Ouvrez la **Bibliothèque de Campagnes** (icône livre en haut).
2. Sélectionnez votre campagne (clic sur la carte).
3. Cliquez sur **"Exporter (Nexus)"** — l'icône de satellite dans les actions de la campagne.
4. Une fenêtre "Nexus HUD" s'ouvre — elle affiche la progression en temps réel.
5. Une fenêtre de dialogue vous demande **où sauvegarder** le fichier `.gmos`.
6. L'export se déroule automatiquement en plusieurs phases :

| Phase | Ce qui se passe |
| :--- | :--- |
| 🔍 Scan | Détection de toutes les images et sons liés |
| 🛰️ Remote Check | **Nouveau** : Détection et téléchargement des images provenant du web |
| 🍃 Harvest | Récupération des médias depuis le Media Hub interne |
| 📦 Packaging | Création de l'archive compressée |
| ✅ Done | Export terminé ! |

> 💡 **Conseil :** L'export peut prendre 30 secondes à 2 minutes selon le nombre d'images et sons liés à votre campagne.

---

## 📥 Importer une Campagne

### Méthode 1 : Bouton dédié dans la Bibliothèque

1. Ouvrez la **Bibliothèque de Campagnes**.
2. Cliquez sur le bouton **"Importer un bundle Nexus"** (icône en bas de la bibliothèque).
3. Sélectionnez votre fichier `.gmos` dans la fenêtre de dialogue.
4. Le Nexus HUD s'ouvre et affiche la progression.
5. Si la campagne importée a le même nom qu'une campagne existante, un **Conflict Resolver** s'affiche :
    - **Remplacer** : Écrase la version existante.
    - **Cloner** : Importe comme nouvelle campagne indépendante.
    - **Annuler** : Arrête l'import.

---

## 🏎️ Partage de Systèmes de Jeu (Drivers)

GM-OS v2 introduit la possibilité d'exporter vos **GameDrivers** (créés via le *System Forge*) indépendamment de vos campagnes. Cela permet de partager uniquement les règles et les modèles de fiches de personnages.

### Exporter un Driver

1. Rendez-vous dans la **Librairie de Modèles** (Onglet `Drivers`).
2. Sélectionnez le Driver que vous souhaitez partager.
3. Dans le panneau d'aperçu à droite, cliquez sur le bouton **"EXPORTER"**.
4. Le fichier généré aura l'extension `.gmos-driver`.

### Importer un Driver

1. Ouvrez la **Librairie de Modèles** (Onglet `Drivers`).
2. Cliquez sur le bouton global **"IMPORTER DRIVER"** en haut de la liste.
3. Sélectionnez votre fichier `.gmos-driver`.
4. Si un driver du même nom existe déjà, le système vous proposera de le **Cloner** pour éviter d'écraser votre travail actuel.

---

## 🛰️ Localisation Interactive (Nouveau v2)

Auparavant, les images provenant d'Internet (ex: une URL Pinterest ou Unsplash) n'étaient pas incluses dans l'export. **Nexus-OS v2** peut maintenant les "localiser" pour vous.

1.  Lors de l'export, si des URLs distantes sont trouvées, le HUD s'arrête et vous propose deux choix :
    -   **"Tout localiser"** : GM-OS télécharge les images, les range dans votre coffre-fort (Media Hub) et les inclut dans le fichier `.gmos`. Votre campagne devient 100% portable.
    -   **"Ignorer"** : Les liens restent tels quels.
2.  Si un téléchargement échoue (lien mort), une alerte `⚠️` s'affiche dans le journal du HUD. Le fichier reste un lien distant mais n'empêche pas l'export du reste.

---

## 📊 Indicateur "Nexus-Ready"

Dans la bibliothèque, chaque campagne affiche un badge **Nexus-Ready** :

- 🟢 **Nexus-Ready** : Tous les médias sont locaux ou dans le Media Hub → export complet garanti.
- 🟡 **Localisable** : Certains médias sont distants mais peuvent être téléchargés lors de l'export.
- 🔴 **Non portable** : Liens techniques ou protégés (ex: YouTube) qui ne peuvent pas être archivés.

---

## 🎵 Sons & Musiques Exportés

L'export Nexus inclut également :

- Les **atmosphères du Sound Board** (groupes de pads sonores) liées à la campagne.
- Les **playlists musicales** contenant des fichiers locaux.

> ⚠️ Les sons pointant vers des URLs distantes (Spotify, SoundCloud, etc.) ne sont pas inclus dans l'export.

---

## 🎲 Confort Visuel : Theater Mode

Pour les moments critiques comme les jets de dés, le Tablet Hub et le Player Hub basculent automatiquement en **Theater Mode**.

- **Immersion Maximale** : Le résultat s'affiche en plein écran avec un effet de flou cinématique sur le reste de l'interface.
- **Lisibilité Accrue** : Les scores sont affichés avec une typographie XXL et des effets de lueur (glows) adaptés à votre thème RPG.
- **Auto-nettoyage** : L'affichage disparaît après 5 secondes pour vous permettre de reprendre la narration sans intervention manuelle.

![Theater Mode Preview](file:///C:/Users/david/.gemini/antigravity/brain/46c86007-1290-455b-bed5-f0df4ff2667e/tablet_hub_dice_theater_mode_1775302636253_1775302657256.png)

---

## 💬 Messagerie Sécurisée & Confidentialité

Le système de messagerie du Hub a été renforcé pour garantir l'immersion :

- **Filtrage par Campagne** : Vous ne voyez que les personnages appartenant à la campagne active. Aucun risque de "spoiler" ou de confusion avec les PJs d'autres aventures.
- **Messages Ciblés** : Les messages privés envoyés par le MJ ne sont visibles que par le destinataire concernatif, avec une notification discrète.

---

## 💎 Design Premium : Glassmorphism 2.0 & Bento Style

Depuis la v6.1.0-dev, l'interface de **Session-OS** a été entièrement refondue pour offrir une expérience plus immersive et luxueuse.

- **Style Bento Box** : Vos cartes de campagnes et les panels du cockpit utilisent désormais une structure "Bento" avec des bordures lumineuses organiques (glows).
- **Glassmorphism Avancé** : L'utilisation de flous cinématiques (`backdrop-filter`) et de saturations enrichies permet une meilleure lisibilité quel que soit le thème (Cyberpunk, Medieval, Modern, Claire).
- **Transitions Fluides** : Toutes vos interactions sont maintenant accompagnées de micro-animations (entrées en cascade, effets de survol magnétiques).

---

## 🌅 Moment de la Journée & Ambiance Atlas (Map-OS)

Le MJ peut désormais transformer instantanément l'atmosphère d'une carte via le panneau de contrôle de l'Atlas.

### Utilisation du Sélecteur

Le panneau d'Ambiance propose 5 moments clés :

- **Aube (Dawn)** : Teinte orangée et douce, contraste réduit.
- **Jour (Day)** : Teinte naturelle, luminosité standard.
- **Grisâtre (Overcast)** : Teinte froide et désaturée. **Note** : Sélectionner ce mode augmente automatiquement l'intensité de la pluie/neige si elle est active.
- **Crépuscule (Dusk)** : Teinte pourpre et dorée, ambiance chaleureuse.
- **Nuit (Night)** : Bleu profond, luminosité réduite à 60%. Optimisé pour être jouable tout en restant immersif.

### Visibilité des Calques

Vous pouvez masquer l'effet d'ambiance à tout moment via le bouton **"Ambiance (Heure)"** dans le gestionnaire de calques, ce qui ramènera la carte à ses couleurs d'origine sans changer le réglage temporel.

---

## 🔧 Conseils & Dépannage

| Problème | Solution |
| :--- | :--- |
| L'export se termine mais le ZIP semble vide (pas d'images) | Vérifiez le badge Nexus-Ready — vos médias sont probablement des URLs distantes. Importez-les d'abord dans le Media Hub. |
| L'import échoue avec "fichier invalide" | Vérifiez que le fichier est bien un `.gmos` non corrompu. Essayez de le renommer en `.zip` pour inspecter son contenu. |
| Des PNJs apparaissent sans avatar après import | Ce PNJ avait un avatar URL distante (non portable). Réassignez-lui un avatar depuis le Media Hub. |
| L'export est très lent | Normal si votre campagne contient beaucoup d'images. 57 images ≈ 60-90 secondes selon la taille. |

---

### État du Système

Dernière mise à jour : 11 Avril 2026

Statut : Nexus-OS v2.0 — Portabilité totale, Exportation de Drivers, HUD Multilingue (I18n) et validation de sécurité du manifeste opérationnels.
