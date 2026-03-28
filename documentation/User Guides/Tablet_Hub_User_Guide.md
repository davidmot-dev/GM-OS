# 📱 Tablet Hub : Guide de l'Utilisateur

Le **Tablet Hub** est une extension de GM-OS conçue pour transformer n'importe quelle tablette ou smartphone en un tableau de bord dynamique et tactile. Il permet de déporter l'affichage des statistiques de combat, de l'horloge et des jauges de tension, libérant ainsi l'écran principal pour la narration.

## 🚀 Connexion Rapide

Il existe deux façons de connecter une tablette au GM-OS :

1.  **QR-Code (Recommandé)** :
    - Ouvrez les **Paramètres OS** sur votre instance principale.
    - Allez dans l'onglet **Télécommande**.
    - Scannez le QR-Code de la section **Tablet Hub** avec votre tablette.
2.  **URL Manuelle** :
    - Sur votre tablette, ouvrez un navigateur et saisissez l'adresse affichée dans les paramètres (ex: `http://192.168.1.15:5173/?window=tablet`).

## 🛠️ Fonctionnalités du Hub

Le Tablet Hub affiche les éléments clés de votre session en temps réel :

### 1. Horloge OS (Clock-OS)
- **Synchronisation Totale** : L'horloge affiche l'heure exacte (réelle ou fantastique) configurée sur le poste du MJ.
- **Affichage Intelligent** : L'horloge n'apparaît sur le Hub que si le MJ a activé la "Projection" dans le module Clock-OS.
- **Support des Thèmes** : Le Hub adopte automatiquement le thème (Cyberpunk, Old-Style, Modern) choisi par le MJ.

### 2. Chronomètres & Timers
- Affiche les compte à rebours actifs pour mettre la pression sur les joueurs.
- Synchronisation à la seconde près avec l'interface MJ.

### 3. Jauges de Tension (Narrative Clocks)
- Affiche les horloges de tension (ex: "Alerte Gardes", "Rituel") sous l'horloge principale.
- Les jauges se remplissent et changent de couleur en temps réel selon les actions du MJ.

### 4. Indicateur de Voix (Voice Visualizer)
- Le contour du Hub réagit dynamiquement au niveau sonore du MJ, créant une ambiance immersive "vivante" sur la table de jeu.

### 5. État de la Connexion
- Un indicateur (Wifi/WifiOff) en haut à droite vous informe si la tablette est bien synchronisée via le serveur WebSocket.

### 6. Fiche de Personnage Interactive
- **Affichage Fidèle** : Le Hub utilise désormais le système de templates de GM-OS. Votre fiche s'affiche avec le design spécifique à votre jeu (ex: Cthulhu Hack, Cyberpunk, etc.).
- **Édition de l'Inventaire** : Vous pouvez modifier votre inventaire en temps réel. Cliquez dans la zone "Inventaire", modifiez vos objets, et le changement est automatiquement transmis au MJ dès que vous quittez le champ.
- **Notes & Description** : Modifiez votre description publique ou vos notes personnelles directement depuis la tablette pour une immersion totale.

## 💡 Conseils d'Utilisation

- **Positionnement** : Placez la tablette au centre de la table pour que tous les joueurs voient l'horloge et les tensions, ou gardez-la près de vous comme extension tactile.
- **Batterie** : Pour les sessions longues, nous recommandons de laisser la tablette branchée, car l'écran reste actif pour garantir la réactivité visuelle.
- **Plein Écran** : Sur la plupart des navigateurs mobiles, vous pouvez "Ajouter à l'écran d'accueil" pour lancer le Hub en mode application plein écran sans barre d'adresse.
