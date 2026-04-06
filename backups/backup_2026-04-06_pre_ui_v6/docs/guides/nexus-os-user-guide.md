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

## 📊 Indicateur "Nexus-Ready"

Dans la bibliothèque, chaque campagne affiche un badge **Nexus-Ready** :
- 🟢 **Nexus-Ready** : Tous les médias sont locaux ou dans le Media Hub → export complet garanti.
- 🟡 **Partiel** : Certains médias sont des URLs distantes (ex: images depuis Internet) → non inclus dans l'export.
- 🔴 **Non portable** : Majorité des médias sont externes.

> ℹ️ **Pourquoi certains médias sont exclus ?** Les URLs d'images provenant d'Internet (ex: `https://unsplash.com/...`) ne peuvent pas être incluses dans l'archive — elles pourraient disparaître. Seuls les fichiers physiques et les médias stockés dans le **Media Hub** interne de GM-OS sont garantis portables.

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

## 🔧 Conseils & Dépannage

| Problème | Solution |
| :--- | :--- |
| L'export se termine mais le ZIP semble vide (pas d'images) | Vérifiez le badge Nexus-Ready — vos médias sont probablement des URLs distantes. Importez-les d'abord dans le Media Hub. |
| L'import échoue avec "fichier invalide" | Vérifiez que le fichier est bien un `.gmos` non corrompu. Essayez de le renommer en `.zip` pour inspecter son contenu. |
| Des PNJs apparaissent sans avatar après import | Ce PNJ avait un avatar URL distante (non portable). Réassignez-lui un avatar depuis le Media Hub. |
| L'export est très lent | Normal si votre campagne contient beaucoup d'images. 57 images ≈ 60-90 secondes selon la taille. |

---

*Dernière mise à jour : 4 Avril 2026*
*Statut : Nexus-OS v1.1 — Portabilité médias et Synchronisation temps réel (Dés) opérationnelles.*
