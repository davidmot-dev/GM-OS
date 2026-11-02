# GM-OS Campagnes de test

Plugin privé de David, version 0.2.0. Dans ChatGPT ou Codex, invoquer le plugin avec un jeu, son pilote .gmos-driver, ses règles et le relevé autorisé des joueurs existants. Il prépare **une campagne complète dans un seul .gmos**, généralement 10 à 15 séances, avec intrigue suivie, arcs, conséquences et fins alternatives. Ses ateliers de recette sont intégrés à la même Trame, hors fiction, avec cahier et résultats humains vierges.

Exemple : « Crée une campagne complète de RuneQuest avec ce pilote et ces références, pour les joueurs de mon export fourni, avec les ateliers d'essai intégrés. » Les anciens prompts « lot de campagnes » ou « aventure et deux laboratoires » suivent aussi ce défaut ; plusieurs campagnes distinctes demandent un choix explicite. Le plugin cherche les fichiers accessibles avant d'en redemander. Sans dépôt ni fichiers sources, il demande uniquement les entrées nécessaires.

Un skill et ses références, un utilitaire Python standard pour inspecter/assembler/contrôler les archives. Pas de serveur, d'accès aux données de GM-OS ni de moteur de règles embarqué. L'utilitaire structurel ne remplace pas les essais du pilote dans l'application. Les niveaux de vérification et les limites accompagnent chaque lot.

L'installation de ce plugin n'importe aucune campagne et ne modifie aucun pilote. Pour conserver la continuité des joueurs et des règles, fournir leurs vrais identifiants et les bons fichiers à chaque jeu. Ne jamais lire le profil personnel de l'application pour contourner une entrée manquante.

Les ateliers se remettent en état localement selon ETATS-DE-REFERENCE.md, manuellement si aucun geste natif n'est vérifié. Remplacer l'archive Nexus réimporte toute la campagne : ce n'est pas une remise à zéro partielle. Les anciennes campagnes ne sont pas converties par cette mise à jour du plugin.
