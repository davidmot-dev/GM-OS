# 📔 Guide Utilisateur : Module Obsidian

Le module **Obsidian Bridge** permet d'intégrer vos notes personnelles de préparation directement dans l'interface de GM-OS v5. Il crée un pont intelligent entre votre savoir accumulé dans Obsidian et l'intelligence artificielle de l'Oracle.

![Aperçu du module Obsidian](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/doc./user-guides/obsidian_mockup.png)

## 📋 Présentation du Module
Le module se divise en deux zones principales :
1.  **Explorateur (Gauche)** : Affiche l'arborescence de votre "Vault" Obsidian. Seuls les fichiers Markdown (`.md`) sont visibles.
2.  **Lecteur (Centre)** : Affiche le contenu de la note sélectionnée dans un format clair et lisible.

## 🚀 Comment l'utiliser ?

### 1. Accéder au module
Cliquez sur l'icône ✨ (**Sparkles**) dans la section **Global** de la barre latérale gauche (juste au-dessus de *AI GEMS*).

### 2. Parcourir et Rechercher
- Utilisez la barre de recherche en haut à gauche pour filtrer vos notes par nom.
- Cliquez sur les dossiers pour les déplier/replier.
- Cliquez sur une note pour l'afficher instantanément dans le lecteur central.

### 3. Synchroniser avec l'Oracle 🧠
C'est la fonctionnalité la plus puissante du module.
- Une fois une note affichée, cliquez sur le bouton **Sync Oracle** en haut à droite.
- Le contenu de votre note est alors injecté dans l'intelligence de l'Oracle.
- Vous pouvez ensuite poser des questions à l'Oracle (via AI GEMS) sur le contenu de cette note (ex: *"Qui est le PNJ mentionné dans cette note ?"* ou *"Quelles sont les défenses de ce donjon ?"*).

### 4. Éditeur & Liens
Le lecteur de GM-OS est principalement conçu pour la consultation.
- Pour modifier une note, cliquez sur l'icône **Lien Externe** (en haut à droite du lecteur) pour l'ouvrir dans Obsidian.

### 5. Exporter vers Obsidian 📤
Vous pouvez désormais exporter vos données GM-OS vers Obsidian pour archive ou préparation approfondie.
1. Allez dans les **Détails de la Campagne** (cliquez sur le titre de la campagne dans le Cockpit).
2. Cliquez sur le bouton violet **Exporter vers Obsidian**.
3. GM-OS créera automatiquement une structure de dossiers dans votre Vault :
   - `/Ma Campagne/Scenario.md`
   - `/Ma Campagne/PNJs/` (Fiches de personnages non-joueurs)
   - `/Ma Campagne/Bestiaire/` (Fiches de monstres)
   - `/Ma Campagne/Lieux/` (Descriptions géographiques)
   - `/Ma Campagne/Lore/` (Entrées wiki classées)

---

## 💡 Exemples d'utilisation

### Scénario A : Consultation de Scénario
Pendant une partie, vous avez besoin de relire rapidement la description d'une salle de donjon. 
- Sélectionnez votre note `Donjon_Noir.md`.
- Lisez la description sans changer d'application.
- Si les joueurs posent une question complexe, faites un **Sync Oracle** pour que l'IA vous aide à improviser selon vos propres notes.

### Scénario B : Fiche PNJ Complexifiée
Vous avez une fiche de PNJ très détaillée dans Obsidian.
- Affichez la note du PNJ.
- Synchronisez-la avec l'Oracle.
- Demandez à l'Oracle d'interpréter le PNJ : *"En te basant sur cette note, comment ce PNJ réagirait-il si les joueurs le menacent ?"*.

---

- **Emplacement du Vault** : Par défaut, GM-OS cherche votre Vault dans `OneDrive/Obsidian Vault`. Ce chemin est modifiable dans les réglages.
- **Sécurité et Écritures** : GM-OS ne modifie jamais vos notes existantes. En revanche, il a l'autorisation de **créer de nouveaux dossiers et fichiers** dans le cadre de la fonction "Exporter vers Obsidian".

---
> [!TIP]
> Si vous venez d'ajouter une note dans Obsidian et qu'elle n'apparaît pas encore, cliquez sur le bouton de rafraîchissement 🔄 en haut de l'explorateur.
