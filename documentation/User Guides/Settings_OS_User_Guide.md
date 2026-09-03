# ⚙️ Guide Utilisateur : Paramètres de l'OS

Le module **Paramètres de l'OS** est le centre de contrôle global de GM-OS v5. C'est ici que vous configurez l'esthétique de votre interface, votre matériel physique, vos services d'IA et votre **télécommande déportée**.

---

## 🎨 Personnalisation (Look & Feel)
GM-OS s'adapte à l'ambiance de votre table :
- **Choix du Thème** : 
    - **Cyberpunk** : Interface sombre, néons et contrastes élevés.
    - **Médiéval** : Textures organiques, parchemin et tons ambrés.
    - **Moderne** : Design épuré, translucide et professionnel.
- **Palette d'Accentuation** : Changez instantanément la couleur des boutons et des lueurs de l'OS.

---

## 🖌️ L'Atelier de Thème (onglet **Thème du jeu**)

Chaque jeu peut habiller GM-OS à ses couleurs — et depuis la v6.5, **cela se règle dans l'application** : plus besoin d'éditer un fichier CSS à la main.

L'atelier travaille sur le thème du **jeu de la campagne ouverte**, et propose ses réglages en quatre groupes :

| Groupe | Ce que vous y réglez |
| :--- | :--- |
| **Couleurs** | Fond, surfaces, papier, encre, texte, accents, bordures |
| **Polices** | Titres, corps, interface des fiches, chiffres |
| **Tailles** | Échelle du texte, interlettrage des titres et des surtitres |
| **Formes** | Rayons des angles, ombre portée |

**Comment ça marche :**

1. Ouvrez les **Paramètres → Thème du jeu**. Si le jeu n'a pas encore de thème, un bouton **Créer un thème** en pose un vierge.
2. Réglez ce que vous voulez : **les changements s'appliquent tout de suite à l'écran**, mais rien n'est écrit tant que vous n'avez pas cliqué sur **Enregistrer**. **Annuler** revient à l'état enregistré.
3. Un **contrôle de contraste** signale les paires texte / fond devenues illisibles.
4. Une **flèche de retour** remet le thème tel qu'il était **avant vos retouches** : la première sauvegarde met le fichier d'origine de côté.

> [!IMPORTANT]
> L'atelier **réécrit les valeurs, jamais le fichier**. Un `theme.css` de jeu contient aussi des centaines de lignes de règles `.rpg-*` qui habillent les **fiches de personnage** : elles sont préservées telles quelles, commentaires compris.

> [!TIP]
> Déposer `docs/systems/<jeu>/theme/theme.css` à la main fonctionne toujours — l'atelier n'a pas remplacé cette porte, il en a ouvert une seconde. Une police Google demandée dans l'atelier est déclarée **et** téléchargée automatiquement.

---

## 📱 GM Remote Control (Télécommande)
Pilotez votre session sans quitter vos joueurs des yeux :
- **Activation** : Allez dans l'onglet **Télécommande**.
- **Connexion QR Code** : Scannez le QR Code affiché avec votre smartphone ou tablette.
- **Fonctions mobiles** :
    - **Dés** : Lancez des dés en temps réel.
    - **Sons** : Déclenchez vos pads Sound-OS.
    - **Scènes** : Activez vos séquences Master Storyboard.
    - **Combat** : Suivez l'initiative et gérez les PV des monstres.
    - **Notes** : Lisez vos secrets MJ et le synopsis de session.
- **Diagnostic** : Vérifiez l'état du serveur (Port 3001) et votre adresse IP locale.

---

## 🔊 Hardware & Routing (Audio)
Gérez vos sorties audio physiques :
- **Système d'Alias** : Assignez un nom convivial (ex: "Table Joueurs") à chaque sortie.
- **Actualisation** : Détectez les nouveaux périphériques branchés.

---

## 🖥️ Moniteurs & Projection (Display)
Gérez vos écrans secondaires pour l'immersion :
- **Alias d'Écran** : Nommez vos écrans (ex: "TV Murale") pour savoir où vous projetez vos médias.

---

## 🤖 Intelligence Artificielle (Cloud & Tactical)
Configurez le "cerveau" de votre OS :
- **AI Oracle** : Gérez vos clés API (Gemini, Nano Banana).
- **Cortex Tactique** : Activez l'assistance au combat et gérez votre taxonomie de règles.

---

## 💾 Sauvegarde & Synchronisation (Git Cloud)
GM-OS v5 assure la sécurité de vos données de campagne sans action manuelle :
- **Sauvegarde Automatique** : À chaque modification majeure (création de PNJ, fin de session), l'OS synchronise vos données sur votre branche GitHub privée `data-sync`.
- **Isolation Totale** : Vos données sont stockées séparément du code source pour une clarté maximale.
- **Restauration** : En cas de changement de machine, l'OS récupère automatiquement votre dernier état synchronisé.
- **Indicateur de Statut** : Surveillez l'icône de Cloud dans la barre de titre pour vérifier l'état de la synchronisation.

---

> [!IMPORTANT]
> **Sécurité Réseau** : Pour que la télécommande fonctionne, votre tablette et votre PC doivent être connectés au **même réseau WiFi**.
