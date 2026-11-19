# Map-OS en détail — vidéo GM-OS

[Voir le film](Map-OS-en-detail.mp4) — 18 min 42 s.

Textes français incrustés, sans voix ni piste audio. Le rythme plus vif demandé par David est conservé : phrases courtes, cartes d'au moins sept secondes avec marges, 125 mots/minute et 14 caractères/seconde au maximum, gestes à vitesse réelle. Les chapitres du MP4 permettent de retrouver chaque bloc ; le SRT séparé et la transcription servent à la consultation.

Map-OS est le module natif nommé **Cartographie** dans la barre latérale. Ce film porte sur le plateau ; le pilote Alien 1.11.0 fournit seulement le contexte de recette et les acteurs Eli Voss et Tor Malik. Il ne prétend pas expliquer les règles de combat d'Alien.

## Refaire le parcours

Importer la campagne de recette jointe de préférence dans un profil de test. Elle conserve l'identifiant historique d'Orphée : traiter tout conflit d'import avant de remplacer une campagne. La dépendance est le pilote existant `Export Dirvers/corriges/Alien-1.11.0.gmos-driver`, également joint ; suivre les consignes de [AGENTS.md](../../../../../AGENTS.md).

Les deux plans PNG et la vidéo de recette sont des schémas originaux joints dans `medias/`. Importer les fichiers dans la bibliothèque, les choisir avec **Utiliser**, puis fermer la bibliothèque par **Échap**. La grille se règle en pixels de l'image ; le parcours retient 40 px et 40 % d'opacité. Invoquer la rencontre « MAP-OS — acteurs du plateau » avec Eli en plus de Tor, puis les ajouter avec **+** dans Cartographie.

Ouvrir le **Player Hub** natif et choisir **Projeter la Carte → Synchroniser Player Hub**. Le film emploie deux fenêtres réelles de la même instance jetable. Il ne démontre ni moniteur externe, ni tablette physique, ni accès distant. Le noir du brouillard est opaque côté joueurs ; éteindre le seul calque du meneur ne révèle pas la carte au Hub.

Les pions et leurs positions ne sont pas des mesures de déplacement automatiques. Les annotations magiques et zones ne débitent aucun dégât de règles. Le clic droit sur un pion le retire directement du plateau ; le combattant reste dans Combat-OS. Vérifier la vue des joueurs avant de compter sur un réglage de confidentialité.

Dans le parcours filmé, les commandes de l'œil sont activées par **Espace**, puis la projection est arrêtée et relancée pour contrôler la visibilité du pion. Les calques météo/heure du meneur ne sont pas transmis au Hub natif pendant cet essai : choisir **Aucun** et **Jour** modifie réellement l'ambiance projetée. Avec Alien, **Précédent** renvoie au choix d'une carte d'initiative au lieu de décrémenter le tour.

Les configurations de carte sont globales à l'installation. Le preset conserve notamment brouillard et magie ; les effets magiques courants ne sont pas persistés au rechargement. Dans cet essai, la projection s’arrête et le brouillard redevient noir après recharge ; recharger le preset restitue magie et brouillard sauvés. La sauvegarde générale contient les configurations et les modèles de zones ; la campagne `.gmos` jointe sert au contexte de recette et ne constitue pas une sauvegarde complète du plateau natif. Pour reconstruire celui-ci, suivre la transcription et importer les médias joints. `etat-final.json` est une preuve de contrôle, pas un nouvel importeur de carte.

## Limites réelles

La suppression de la sphère est vérifiée côté meneur (séquence 27). La vue native du Hub en séquence 29 affiche encore la sphère orange : la disparition immédiate côté joueurs n’est donc pas démontrée. Contrôler le Hub et, si nécessaire, relancer sa projection avant de considérer un effet retiré de la table.

La forme rectangulaire choisie pour Danger produit un cercle dans la version filmée. Les zones de danger peuvent rester visibles au-dessus du brouillard noir : elles ne doivent pas servir à cacher des pièges secrets. L'attribution d'une aura à un porteur n'est pas démontrée. Les commandes physiques Hue/audio et les générations Vision de l'Oracle/Cortex sont repérées ou décrites sans être exécutées. La vidéo source d'exemple et le film livré sont silencieux ; les commandes de volume et de coupure sont contrôlées dans l'interface.

Les guides du dépôt ont été recoupés avec le code et les essais, car certaines descriptions anciennes divergent de l'interface actuelle. Les contrôles exacts, observations et autres limites figurent dans `verification-pedagogique.md` et `controle-final.json`.

Les empreintes, cartes, pauses, mires, chapitres et absence d'audio ont été contrôlés, ainsi que le décodage intégral du MP4. La revue d'images ne vaut pas visionnage humain continu et ne certifie pas le confort humain de lecture.

Les scripts, répétitions, prises et preuves restent dans le dossier parent. Le build existant a été copié pour stabiliser le tournage ; aucune construction ni modification du produit n'a été nécessaire. Profil et données de test isolés, réseau externe bloqué durant les prises, aucun git d'écriture, aucune installation et aucune publication externe.
