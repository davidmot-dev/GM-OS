# Méthode de campagne de recette

## Entrées et modes

Deux modes : **dans le dépôt**, utiliser les sources actuelles, le dernier pilote pertinent et les fonctions métier ; **avec fichiers joints**, demander pilote, règles, joueurs et, si nécessaire, export de référence. Ne traite pas l'accès au disque du meneur comme acquis dans ChatGPT. Aucun secret, fichier de joueurs ni campagne privée n'est fourni avec ce plugin.

1. Relever jeu/édition, version GM-OS, fichier du pilote et SHA-256, ID/version du pilote, ID et champs du gabarit, références de règles et leurs pages. Noter tout désaccord.
2. Inventorier jets, choix avant/après jet, consommations, santé/états, initiative/combat, progression, mécanique propre au jeu, réserves de table/groupe, modules, droits et fiche HTML. Décrire explicitement ce qui est absent du pilote.
3. Lier chaque point de la matrice à un cas et une archive ; grouper les cas qui partagent une préparation. Prévoir une action et un résultat assez précis pour constater un écart : valeurs avant/après, écran, droits, persistance. Éviter « vérifier que cela fonctionne ».
4. Écrire une aventure qui offre naturellement ces actions sans les rendre obligatoires pour résoudre l'intrigue. Les laboratoires assurent les cas artificiels : ressource insuffisante, personnage blessé, seuil franchi, critique, refus, action déjà dépensée. Pour un tirage aléatoire, distinguer résultat préparé et tirage à constater ; ne promettre une issue exacte que si l'essai contrôle réellement l'aléatoire.
5. Préparer données, médias et dépendances. Utiliser les constructeurs métier pour les états internes. Prévoir les réglages manuels, par exemple contexte, rang, difficulté, conjonction, publication d'un module. Ne pas les attribuer magiquement au déplacement sur une carte.
6. Générer ; vérifier ; examiner les rendus ; emballer avec le rapport sur les mêmes empreintes. Conserver la recette reproductible. Aucune case de recette humaine prévalidée.

## Taille indicative, pas quota

Une enquête de référence peut comporter trois PJ, huit lieux, une douzaine de PNJ et d'indices, quatre actes, douze à dix-huit scènes, trois rencontres et quatre séances. Réduire ou étendre selon la demande et le jeu ; ne pas remplir un quota avec des doublons. Les laboratoires ont un PJ par cas limite incompatible avec les autres, répartis entre les joueurs existants, sans toucher les PJ de l'enquête.

## Identifiants et import

Un préfixe de lot stable, par exemple `recette-<jeu>-<lot>`, évite les collisions accidentelles. IDs de campagne distincts pour 01/02/03 ; aucun ID de PJ partagé entre ces campagnes. Les vrais IDs de joueurs sont conservés ; les avatars et anciens PJ ne sont pas copiés. Le test d'import doit montrer que les profils préexistants restent conservés. Ne réécris pas leur magasin sur disque.

Indiquer les stratégies de Nexus depuis la version cible : nouvel import de l'aventure, remplacement explicite du seul laboratoire à rejouer, pilote conservé si déjà présent du même ID selon la version cible. Ne pas promettre qu'une dépendance embarquée remplace automatiquement une version existante. « Rejouer » n'est pas nécessairement une remise à zéro des ressources.
