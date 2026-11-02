# Méthode de campagne de recette

## Entrées et modes

Deux modes : **dans le dépôt**, utiliser les sources actuelles, le dernier pilote pertinent et les fonctions métier ; **avec fichiers joints**, demander pilote, règles, joueurs et, si nécessaire, export de référence. Ne traite pas l'accès au disque du meneur comme acquis dans ChatGPT. Aucun secret, fichier de joueurs ni campagne privée n'est fourni avec ce plugin.

1. Relever jeu/édition, version GM-OS, fichier du pilote et SHA-256, ID/version du pilote, ID et champs du gabarit, références de règles et leurs pages. Noter tout désaccord.
2. Inventorier jets, choix avant/après jet, consommations, santé/états, initiative/combat, progression, mécanique propre au jeu, réserves de table/groupe, modules, droits et fiche HTML. Décrire explicitement ce qui est absent du pilote.
3. Lier chaque point de la matrice à un cas dans l'unique archive de campagne, avec repère d'acte/scène/personnage ; grouper les cas qui partagent une préparation. Prévoir une action et un résultat assez précis pour constater un écart : valeurs avant/après, écran, droits, persistance. Éviter « vérifier que cela fonctionne ».
4. Écrire une campagne complète qui offre naturellement ces actions sans les rendre obligatoires pour résoudre l'intrigue : généralement 10 à 15 séances préparées, arcs liés, conséquences, bifurcations et fins alternatives. Lire [le contrat narratif et les ateliers intégrés](campagne-complete.md). Les ateliers hors fiction, dans un acte distinct de la même Trame, assurent les cas artificiels : ressource insuffisante, personnage blessé, seuil franchi, critique, refus, action déjà dépensée. Pour un tirage aléatoire, distinguer résultat préparé et tirage à constater ; ne promettre une issue exacte que si l'essai contrôle réellement l'aléatoire.
5. Préparer données, médias et dépendances. Utiliser les constructeurs métier pour les états internes. Prévoir les réglages manuels, par exemple contexte, rang, difficulté, conjonction, publication d'un module. Ne pas les attribuer magiquement au déplacement sur une carte.
6. Écrire ETATS-DE-REFERENCE.md et vérifier la remise en état locale des seuls champs d'essai, avec des témoins de fiction conservés ; générer l'unique .gmos, vérifier, relire histoire et rendus, emballer sur les mêmes empreintes. Conserver la recette reproductible. Aucune case de recette humaine prévalidée.

## Taille indicative, pas quota

Une campagne complète comporte habituellement 10 à 15 séances préparées, trois à cinq actes narratifs et un acte hors fiction pour la recette. Le nombre de lieux, scènes, PNJ, indices et rencontres découle de l'histoire ; ne pas remplir un quota avec des doublons. Un PJ principal par joueur autorisé, puis seulement les personnages supplémentaires nécessaires aux états incompatibles, nommés [RECETTE] et rattachés à la même campagne. Une séance avec un seul titre ne constitue pas une séance préparée.

## Identifiants et import

Un préfixe de lot stable, par exemple `recette-<jeu>-<lot>`, évite les collisions accidentelles. Un seul ID de campagne pour histoire et ateliers ; IDs propres aux nouveaux PJ et contenus. Les vrais IDs de joueurs sont conservés ; les avatars et anciens PJ ne sont pas copiés. Le test d'import doit montrer qu'une seule campagne est ajoutée et que les profils/campagnes préexistants restent conservés. Ne réécris pas leur magasin sur disque.

Indiquer les stratégies de Nexus depuis la version cible : vérifier le pilote puis importer l'unique campagne. Un pilote du même ID peut être conservé ; ne pas promettre son remplacement automatique. Nexus Remplacer concerne la campagne entière, jamais seulement un atelier. Documenter la restauration manuelle des seuls champs d'essai quand aucun geste natif local n'est vérifié. « Rejouer » n'est pas nécessairement une remise à zéro des ressources. Ne pas cloner par défaut : cela créerait une autre campagne.

Les lots historiques à plusieurs archives restent inchangés. N'utiliser ce découpage pour une nouvelle livraison que sur demande explicite de plusieurs campagnes distinctes.
