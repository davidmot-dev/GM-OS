# Correctif Bug Synchronisation NPC Hub

## Analyse du problème
L'utilisateur a signalé que l'animation ne fonctionnait pas sur le Player Hub.
L'analyse a révélé les points suivants :
1.  **Conflit CSS** : Une transition de `700ms` sur la `scale` écrasait les mises à jour rapides (60fps) envoyées par le module Voice.
2.  **Redondance d'état** : Le check `isSyncNPC` dans le Hub dépendait de la synchronisation du storage, qui peut être plus lente que l'IPC.
3.  **Signal d'arrêt manquant** : Lorsque le MJ coupait la sync, l'avatar restait parfois figé dans son dernier état car aucun niveau "0" n'était envoyé.

## Changements apportés
- **Transition éclaire** : Passage de `700ms` à `75ms` pour l'animation de scale, permettant une réactivité instantanée.
- **IPC Direct** : Suppression du check `isSyncNPC` côté client Hub/Projecteur. Si un niveau audio est reçu via IPC, le Hub l'applique directement (la logique de filtrage est centralisée dans la `VoiceEngine` du MJ).
- **Intensité accrue** : Augmentation du multiplicateur de scale à `0.15` pour une visibilité accrue.
- **Nettoyage Automatique** : Envoi forcé d'un niveau `0` dès que la sync ou le micro est coupé.
- **Support des Favoris** : L'animation s'applique désormais aussi aux Favoris projetés, pas seulement aux PNJ temporaires.
