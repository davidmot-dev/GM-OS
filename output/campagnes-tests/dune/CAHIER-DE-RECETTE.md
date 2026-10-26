# 66 essais Dune — NON TESTÉS par David

Sources : pilote 2.0.0 ; manuel 54-Jeu-Dune.md ; moteurs duneRegles/conflitsDeDune ; livre français et errata 1.1 déjà audités le 25/10. Les laboratoires sont choisis pour les états de test, pas des événements joués. Réinitialiser par Remplacer entre essais indépendants.

| Cas | Archive | Précondition | Action | Attendu |
| --- | --- | --- | --- | --- |
| DU-01 | 01 | Trois PJ et pilote 2.0.0 | Composer Compétence + Principe et difficulté 1. | Deux d20 ; somme = seuil de chaque dé, difficulté = réussites exigées. |
| DU-02 | 01 | Spécialisation pertinente | Comparer un jet avec puis sans spécialisation sur copies. | Critique étendu jusqu’à la compétence ; le seuil ne change pas. |
| DU-03 | 01 | Jet préparé | Acheter successivement les troisième, quatrième et cinquième dés. | Coûts 1, 2, 3 ; réserve plafonnée à cinq dés. |
| DU-04 | 01 | Impulsion 2 et Menace 3 | Choisir de payer un achat en Menace malgré de l’Impulsion disponible. | La part choisie monte en Menace, le reste seul débite l’Impulsion. |
| DU-05 | 01 | PNJ ennemi | Cocher PNJ ennemi et acheter un dé. | Le coût débite la Menace du meneur, pas l’Impulsion des joueurs. |
| DU-06 | 01 | Assistant déclaré | Ajouter un assistant avec son propre seuil et critique. | Un dé propre ; ses réussites ne comptent que si le principal réussit au moins un dé ; ses complications comptent toujours. |
| DU-07 | 01 | Aide et Détermination | Relancer les dés sélectionnés du principal. | Dés d’aide conservés, même s’ils ont été cochés par erreur. |
| DU-08 | 01 | Complication | Comparer marge 20 puis 16–20 sur copies. | Les complications se lisent indépendamment de la réussite. |
| DU-09 | 01 | Opposition | Entrer réussites du défenseur, gêne et facteurs. | Difficulté calculée, peut dépasser 5 ; ordre des deux jets explicite. |
| DU-10 | 01 | Maximes déjà inscrites | Ouvrir la fiche HTML et le carnet des principes. | Chaque maxime reste rattachée au bon principe dans _gmos_dune.maximes. |
| DU-11 | 01 | Détermination 1 | Confirmer une maxime alignée et choisir Un dé vaut 1 avant le jet. | Un dé remplacé, réserve non agrandie, point dépensé une fois. |
| DU-12 | 01 | Jet lancé | Choisir des dés et dépenser une Détermination pour relancer. | Résultats remplacés ; pas de relance des assistants ni de dépenses déjà effectuées. |
| DU-13 | 01 | Déclaration narrative | Créer/modifier un trait par Détermination après accord du MJ. | Coût et carnet conservés ; texte du trait modifié explicitement. |
| DU-14 | 02 | P01 Détermination 0 | Tenter une dépense puis accorder un point explicitement. | Insuffisance refusée ; une reconnexion ne rend pas de point. |
| DU-15 | 01 | Contradiction offerte par le MJ | Essayer Respecter, Bafouer et refuser sur copies. | Complication ou principe indisponible à la fin du test ; choix explicite. |
| DU-16 | 02 | P02 Devoir bafoué | Lancer avec Devoir puis préparer une scène d’introspection. | Principe indisponible ; récupération exige conditions et nouvelle maxime ou rééquilibrage. |
| DU-17 | 02 | P03 Justice récupérée | Tenter de bafouer Justice encore dans la même aventure. | Récupération mémorisée, pas de nouvelle bafouade autorisée dans l’aventure. |
| DU-18 | 02 | Introspection | Dépenser/gagner de la Détermination dans la scène puis tenter la récupération. | Récupération refusée dans cette scène ; une nouvelle scène autorisée ne remet pas toute seule les points à 1. |
| DU-19 | 01 | Début d’aventure | Nommer explicitement une autre aventure et confirmer. | Détermination remise à 1 par ce geste ; pas par ouverture ou changement de scène. |
| DU-20 | 02 | Impulsion commune 6 | Réussir avec marge et bonus annoncé puis examiner le bilan. | Impulsion normale et bonus du test dépensables malgré réserve pleine. |
| DU-21 | 01 | Test réussi | Payer information, trait puis atout temporaire sur essais séparés. | Bonus, normal, réserve consommés dans cet ordre ; effet confirmé avec le MJ. |
| DU-22 | 01 | Question sans réponse possible | Rendre le point explicitement au bandeau. | Restitution visible et justifiée ; pas d’ajout silencieux automatique. |
| DU-23 | 01 | Clôture du test | Terminer le test et conserver le reliquat. | Seul le reliquat normal rejoint la réserve jusqu’à 6 ; bonus perdu, pas de second versement. |
| DU-24 | 01 | PNJ ennemi et marge | Clore son test. | Reliquat normal converti en Menace ; bonus non conservé. |
| DU-25 | 01 | Complication | Racheter pour un PJ puis pour un ennemi sur copies. | PJ concède 2 Menace ; ennemi dépense 2 Menace. |
| DU-26 | 01 | Échec autorisé mitigé | Choisir réussite mitigée et décrire la complication avec le MJ. | Test reste en échec ; pas d’Impulsion du test ni de dépense d’amélioration. |
| DU-27 | 01 | Fin de scène | Valider le geste de fin de scène une fois. | Impulsion commune −1 selon le pilote ; réserves et suivi retrouvés après recharge. |
| DU-28 | 03 | Rencontre de recette | Choisir le camp qui ouvre puis alterner. | Pas d’initiative individuelle au d20 ; ouverture ennemie narrative ou 2 Menace selon choix. |
| DU-29 | 03 | Action réussie | Retenir le camp pour un allié puis pour le même acteur sur copies. | Coût 2 payé par le bon camp ; même acteur reçoit +1 difficulté. |
| DU-30 | 03 | Attaque ou mouvement raté | Tenter une rétention. | Refus ; pas de rétention répétée avant intervention ennemie. |
| DU-31 | 03 | Mouvement discret réussi | Conserver la main après le mouvement confirmé. | Rétention gratuite pour le cas prévu ; second mouvement payé séparément si nécessaire. |
| DU-32 | 03 | Maxime alignée et point | Dépenser une Détermination pour l’action supplémentaire. | Action supplémentaire distincte de la rétention ordinaire, coût suivi. |
| DU-33 | 02 | P07 mineur vaincu | Comparer une attaque réussie sur un mineur neuf. | Une réussite le vainc ; pas de mort ni PV inventés. |
| DU-34 | 03 | Cible notable | Régler défense/qualité puis appliquer une attaque réellement réussie. | Conditions = compétence défensive + qualité ; progression 2 + qualité offensive. |
| DU-35 | 03 | Amélioration offensive | Payer 2 Impulsion et appliquer l’attaque. | Qualité +1 pour cette attaque uniquement ; coût annoncé une fois. |
| DU-36 | 02 | P04 vaincu, qualité 1 | Survivre dans une scène nommée et choisir une complication. | Coût 2 ; survie une fois par scène, progression conservée, pas de guérison générale. |
| DU-37 | 02 | P04 conséquence durable | Appliquer une aide réussie de difficulté 2. | Conséquence empêchée selon le suivi ; cible pas automatiquement remise en jeu. |
| DU-38 | 02 | P07 sans conséquence durable | Préparer la tâche de récupération. | Conditions 4 + qualité de l’atout vainqueur ; aucun soin par points de vie. |
| DU-39 | 02 | P05 35 points de progression | Acheter une compétence après l’aventure. | Coût affiché, max 8, une progression par aventure et restrictions gardées. |
| DU-40 | 02 | P08 compétence à 6+ | Acheter une spécialisation puis tenter la même aventure à nouveau. | Précondition et coût selon nombre détenu ; seconde progression refusée. |
| DU-41 | 02 | P09 atout de qualité 0 | Améliorer sa qualité puis essayer pérennisation sur copies. | Qualité 0→1 coûte 2 ; permanent coûte 3 selon errata ; atout et points persistés. |
| DU-42 | 02 | Progression par reconversion | Choisir une capacité cédée valide. | Coût divisé par deux arrondi au supérieur, ancienne capacité retirée, compétence cédée reste à 4 minimum. |
| DU-43 | 01 | Module déjà préparé | Ouvrir le pupitre et autoriser les trois PJ. | Un module existant, cinq zones et six atouts ; accès explicites, pas de commande MJ pour les joueurs. |
| DU-44 | 01 | Zone Nalia et désirs cachés | Appliquer deux enquêtes réussies Analyse 6. | +4 puis +4 ; Discipline 6 atteinte au second test, désir révélé seulement alors. |
| DU-45 | 01 | Secrets du plateau | Inspecter les données reçues avant révélation. | Zone cachée, atout privé et désirs non révélés absents ; journal sans charge privée. |
| DU-46 | 03 | Cinq arènes | Choisir duel, escarmouche, espionnage, guerre puis intrigue sur essais distincts. | Cadre et mode changent ; zones abstraites conservées, pas de conversion métrique. |
| DU-47 | 03 | Mode Architecte | Engager l’équipe militaire préparée et perdre une unité. | Atout militaire ciblé ; le commandant ne reçoit pas de blessure automatiquement. |
| DU-48 | 01 | Atout sur le Parvis | Déplacer vers une voisine puis tenter une zone non adjacente. | Lien réciproque requis ; déplacement refusé s’il n’existe pas. |
| DU-49 | 03 | Atouts tangibles/intangibles | Neutraliser le tangible, détruire l’intangible puis changer de scène. | Tangibles permanents réactivés, temporaires retirés, intangible détruit ne se récupère pas. |
| DU-50 | 01 | Maison Vaëlan remplie | Créer/ouvrir sa fiche HTML puis changer une rubrique sur copie. | Nom/monde/type/domaines/rôles/ennemis répercutés au module ; fiche de Maison fait foi. |
| DU-51 | 01 | Maison mineure et trois présents | Fixer la Menace de début de séance à 3. | Clic remplace la réserve ; ouvrir le pupitre seul ne modifie pas la Menace. |
| DU-52 | 03 | Variante Grande Maison | Avec trois présents, fixer la Menace puis ajuster explicitement. | Base 9, ajustement du MJ visible ; aucune modification de l’enquête 01. |
| DU-53 | 01 | Joueurs existants p-1/p-2/p-3 | Importer les trois archives telle quelle. | Profils et anciens PJ conservés ; quinze nouveaux PJ de ces seules campagnes. |
| DU-54 | 01 | Trois tablettes 360/768/1180 | Choisir chacun son PJ, ouvrir le HTML et lancer un test. | Bonne fiche, maximes/spécialisations visibles et jets reçus au MJ. |
| DU-55 | 01 | Marqueur de secrets de séance | Inspecter les messages joueur. | Aucun SECRET_MJ_DUNE_RECETTE attendu ; défaut GM-05 connu à consigner si reçu. |
| DU-56 | 01 | Atlas et indices | Suivre les huit lieux, douze indices et liens de PNJ. | Révélations explicites et liens valides ; seul I01 révélé au départ. |
| DU-57 | 01 | Trame | Parcourir les trois issues et quatre séances prévues. | Scènes liées, ateliers hors fiction distincts ; aucun indice essentiel sur un jet unique. |
| DU-58 | 01 | Butin 101 Solari | Partager 33 par PJ et garder le reliquat. | Total 101 conservé, reste 2 ; distribuer un objet ne lui crée pas un bonus automatique. |
| DU-59 | 01 | Wiki/Chronologie | Ouvrir neuf pages et quatre repères. | Liens corrects ; dates ISO fictives, pas calendrier impérial affirmé. |
| DU-60 | 01 | Sound/Music/Storyboard | Écouter les trois sons, deux pistes et quatre moments puis arrêter. | Médias embarqués, aucun son commercial ou service externe requis. |
| DU-61 | 01 | Light-OS | Assigner des appareils de test après lecture des trois tuiles. | Aucun appareil inventé ; états vides au départ, matériel pas déclaré testé. |
| DU-62 | Tables | Table-OS Atelier | Importer les trois JSON dans un univers de recette et Ranger tel quel. | Trois tables 1d6 originales, bornes 1–6 ; aucun remplacement des règles de complication. |
| DU-63 | 02/03 | Laboratoire altéré | Réimporter seulement le laboratoire avec Remplacer. | Réinitialisation locale ; Maison, fiches et plateau de l’enquête intacts. |
| DU-64 | 01 | Après modification | Exporter puis Cloner et suivre les liens. | Références cohérentes ; original intact et profils existants conservés. |
| DU-65 | Toutes | Clôture de séance | Couper les accès, recharger et rouvrir la campagne. | Module et fiches persistés ; droits fermés, pas de dépense rejouée. |
| DU-66 | Toutes | Après chaque essai | Remplir resultats.csv avec observé et preuve. | PASSÉ, ÉCHEC, NON TESTÉ ou NON APPLICABLE ; aucune case prévalidée. |
