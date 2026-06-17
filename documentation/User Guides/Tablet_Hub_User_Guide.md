# 📱 Tablet Hub : Guide de l'Utilisateur

Le **Tablet Hub** est une extension de GM-OS conçue pour transformer n'importe quelle tablette ou smartphone en un tableau de bord dynamique et tactile. Il permet de déporter l'affichage des statistiques de combat, de l'horloge et des jauges de tension, libérant ainsi l'écran principal pour la narration.

## 🚀 Connexion Rapide (Nexus Sync v6)

Il existe deux façons de connecter une tablette au GM-OS via le protocole **Nexus** :

1.  **QR-Code (Recommandé)** :
    - Ouvrez les **Paramètres OS** sur votre instance principale.
    - Allez dans l'onglet **Télécommande**.
    - Scannez le QR-Code de la section **Nexus Link** avec votre tablette.
2. **Signature Biométrique** :
    - Lors de la première connexion, vous devrez choisir votre personnage.
    - **Sécurité (Locking)** : Si un autre joueur utilise déjà cette fiche, le Hub bloquera la connexion ("Accès Refusé : personnage déjà connecté") pour éviter les conflits d'édition.
    - **Réinitialisation** : Si vous êtes bloqué par erreur, demandez au MJ de "Réinitialiser les connexions" depuis ses paramètres.

### ⚡ Performance & Fluidité (v7.0 Tauri v2)
Le Hub a été optimisé pour garantir une expérience à **60 FPS**, même sur du matériel ancien :
- **Optimisation GPU** : Les effets visuels lourds (flou, lueurs) sont désormais gérés par le processeur graphique.
- **Micro-Sync (IPC/Tauri)** : Sous Tauri v2, la synchronisation avec le poste MJ utilise un canal haute vitesse (IPC avec argument spreading) garantissant une réactivité instantanée pour les projections d'images et de personnages.
- **Multi-Usage** : Le Hub peut être utilisé soit à distance (via WiFi/Navigateur), soit comme une fenêtre Windows native sur votre second moniteur (Player Hub).


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

### 4. Réception Visuelle (Spotlight & Sync)
- **Projection Automatique** : Le Hub affiche désormais une grille élégante ("Réception Visuelle") dès que le MJ projette un PNJ, un lieu ou une image de scène. Plus besoin d'action côté joueur.
- **Grille Intelligente** : Si plusieurs éléments sont projetés, ils s'organisent automatiquement en grille (jusqu'à 3 colonnes).
- **Zéro Doublon** : Le système est assez intelligent pour ne pas afficher deux fois le même personnage si le MJ le projette par plusieurs moyens différents.

### 5. Indicateur Vocal Discret (Neural Signal)
- Une barre lumineuse subtile au bas de l'écran réagit dynamiquement à la voix du MJ. Ce signal "vivant" permet de savoir instantanément qui parle, même dans le noir ou pendant une phase narrative intense.

### 6. État de la Connexion
- Un indicateur (Wifi/WifiOff) en haut à droite vous informe si la tablette est bien synchronisée via le serveur WebSocket.

### 7. Fiche de Personnage Interactive
- **Affichage Fidèle** : Le Hub utilise désormais le système de templates de GM-OS. Votre fiche s'affiche avec le design spécifique à votre jeu (ex: Cthulhu Hack, Cyberpunk, etc.).
- **Édition de l'Inventaire** : Vous pouvez modifier votre inventaire en temps réel. Cliquez dans la zone "Inventaire", modifiez vos objets, et le changement est automatiquement transmis au MJ dès que vous quittez le champ.
- **Notes & Description** : Modifiez votre description publique ou vos notes personnelles directement depuis la tablette pour une immersion totale.

### 8. Trombinoscope (Galerie de PNJs)
- **Reconnaissance Visuelle** : Accédez à l'onglet **Trombinoscope** pour voir tous les personnages (PNJs, Alliés, Monstres) que le MJ a marqué comme "Visibles pour les joueurs".
- **Fiche Détail** : Cliquez sur un portrait pour l'afficher en grand. C'est l'outil idéal pour se souvenir d'un visage ou consulter les informations publiques d'un interlocuteur important.
- **Mise à jour en direct** : Dès que le MJ coche la case "Public" sur un PNJ, celui-ci apparaît instantanément sur toutes les tablettes connectées.
+
+### 10. Messagerie & Notifications Intelligentes (v5.7)
+- **Canaux de Discussion** : La messagerie est divisée en trois zones pour plus de clarté :
+    - **Canal Général** : Pour parler à tout le groupe ou recevoir les annonces du MJ.
+    - **Maître du Jeu** : Pour vos échanges privés avec le MJ.
+    - **Canaux Privés** : Pour discuter discrètement avec un autre joueur.
+- **Isolation Totale** : Fini les messages mélangés ! Les annonces globales du MJ ne polluent plus vos conversations privées.
+- **Alertes Toasts** : Si un message arrive alors que vous consultez un autre canal (ou que la messagerie est fermée), une petite notification discrète apparaît en bas de l'écran. 
+- **Navigation Rapide** : Cliquez sur une notification pour sauter directement dans la bonne conversation.
+
### 9. Administration des Terminaux (Pour le MJ)
- **Lobby des Terminaux** : Visualisez en temps réel qui est connecté, avec quel personnage, et la qualité de leur signal.
- **Gestion des Déconnexions** : Supprimez les anciens terminaux ("Vider les déconnectés") pour garder une liste propre.
- **Éjecter Tout** : En cas de bug de synchronisation ou de changement de session, utilisez ce bouton pour déconnecter tout le monde et libérer tous les personnages.
- **Diagnostic** : Vérifiez l'état du serveur (Port 3001) et votre adresse IP locale.

## 💡 Conseils d'Utilisation

- **Positionnement** : Placez la tablette au centre de la table pour que tous les joueurs voient l'horloge et les tensions, ou gardez-la près de vous comme extension tactile.
- **Batterie** : Pour les sessions longues, nous recommandons de laisser la tablette branchée, car l'écran reste actif pour garantir la réactivité visuelle.
- **Plein Écran** : Sur la plupart des navigateurs mobiles, vous pouvez "Ajouter à l'écran d'accueil" pour lancer le Hub en mode application plein écran sans barre d'adresse.
