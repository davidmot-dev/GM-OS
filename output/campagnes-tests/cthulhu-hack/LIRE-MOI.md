# Campagnes de recette — Cthulhu Hack

Fiction originale : **La dernière émission de Port-Lenoir**, ville côtière imaginaire, 1926. Généré depuis le pilote **1.1.0** livré le 23/10/2026. Ces campagnes contiennent des données fictives destinées aux essais de David.

## Démarrer

1. Bibliothèque des campagnes → **Importer un bundle Nexus** → **01-Port-Lenoir.gmos** → **Importer telle quelle**. Le pilote et le gabarit manquants sont ajoutés par l’archive. Si un pilote du même identifiant existe déjà, l’import de campagne le conserve : vérifier qu’il s’agit de Cthulhu Hack **1.1.0**. Au besoin, le pilote corrigé est fourni séparément ; le remplacer est un choix explicite dans son import.
2. Ouvrir la campagne **RECETTE CH — La dernière émission de Port-Lenoir**, puis une séance prévue pour connecter les joueurs. Les PJ se rattachent aux **trois joueurs existants** : Thomas D. (`p-1`), Marie C. (`p-2`) et Lucas R. (`p-3`). Ces identifiants ont été relevés dans l’export RDD fourni par David ; Nexus conserve leurs profils et leurs anciens PJ. Aucun nouveau joueur homonyme n’est créé.
3. Jouer les actes I à III, ou commencer directement par l’acte IV, atelier hors fiction. Le cahier fournit préconditions, gestes et résultats attendus.
4. Importer **02-Hors-Jeu-et-limites.gmos** pour les cas de santé, puis **03-Chocs-et-Folies.gmos** pour les effets mentaux. Ces archives utilisent d’autres campagnes et PJ, mais les **mêmes trois identifiants de joueurs existants** : leurs personnages se rangent sous Thomas, Marie et Lucas sans fabriquer neuf joueurs.
5. Pour retrouver l’état de livraison, réimporter le fichier de la campagne de recette concernée avec **Remplacer**. **Cloner** permet de garder un essai. **Rejouer** efface le parcours et les séances mais conserve les personnages tels qu’ils sont dans l’archive ; ce n’est pas une guérison générale.

## Joueurs et PJ de l’enquête

| Joueur | PJ | Métier narratif | Fortune initiale |
| --- | --- | --- | --- |
| Thomas D. | Adrien Delcourt | Mécanicien et ancien opérateur radio | 0/2 |
| Marie C. | Claire Morel | Médecin du dispensaire | 1/2 |
| Lucas R. | Émile Roussel | Reporter et photographe | 2/2 |

PV initiaux : 12/12 pour les trois PJ. Ces valeurs et les états des laboratoires sont **choisis pour la recette**, sans prétendre constituer une procédure de création complète par le livre. Aucune capacité spéciale ni règle d’investigation étrangère au pilote n’est ajoutée. Le butin ne remplit pas tout seul un emplacement de Matériel ; son équipement et ses dés se règlent explicitement.

## Ce qui est fourni

- Enquête : 12 PNJ/adversaires, 8 lieux schématiques, 12 indices avec documents, 4 actes, 18 scènes dont 6 de recette, 3 rencontres préparées, 4 séances prévues, 8 entrées de wiki, 4 événements de chronologie.
- Inventaires des trois PJ, 8 lots de butin dont 101 unités de monnaie pour le partage 33/33/33 + 2, un objet en réserve, relations sociales et secrets MJ. Seul le télégramme est révélé au départ.
- 4 moments de Storyboard, 3 WAV originaux de recette, 2 pads Music-OS, 3 pads Sound-OS et 3 tuiles Light-OS **sans lampe assignée**. Les cartouches de personnages et cartes sont des SVG schématiques de test, pas des portraits illustrés.
- Laboratoire 02 : 15 PJ. Dix résultats du D10 déjà tirés, Standard/Pulp en attente, d4 et armure, d20, Fortune 2. Laboratoire 03 : 12 PJ, un par résultat de Choc/Folie ; les dés de durée valent 2. Hurlement est instantané et peut déjà être inactif à l’ouverture.
- **59 cas de recette**, un CSV à remplir et les JSON lisibles des trois archives. Les médias se trouvent dans chaque archive : aucun fichier à placer manuellement dans le profil.

## Outils autour du pilote et limites

David précise que « modules externes » désigne ici **les outils GM-OS autour du pilote**. Le catalogue ne contient aucun module de jeu externe spécifique et compatible Cthulhu Hack : aucun état fictif de module n’a été ajouté. Atlas, Combat, Storyboard, sons, éclairages, indices, butin, Wiki, chronologie, trame et Hub ont leurs données de recette.

Les tables intégrées Folies/Chocs/Hors Jeu sont utilisées par le pilote. Les tables aléatoires personnalisées, calendriers, réglages/brouillard des cartes, périphériques, services IA, TTS, comptes externes et bibliothèque globale Image-OS ne voyagent pas tous dans une campagne Nexus. Aucun réglage de lampe, clef API ou chemin personnel n’est inventé. La projection des moments utilise une carte embarquée, sans dépendre d’une bibliothèque Image-OS préexistante. Les médias existent aussi dans le Media Hub après import ; une importation manuelle dans une bibliothèque globale reste un geste du poste.

Cette recette couvre les fonctions identifiées du pilote et les parcours transversaux documentés. Elle ne prouve pas une exhaustivité de toutes les combinaisons ni le fonctionnement de votre matériel physique. Les jets de la campagne principale restent aléatoires. Les laboratoires permettent d’essayer des **conséquences déjà tirées** de façon reproductible ; pour tester les tirages eux-mêmes, relever leur résultat naturel dans le cahier.

## Archives

- **01-Port-Lenoir.gmos** — 3 PJ, 38 médias embarqués ; SHA-256 : e3ccf7e281804eaf0a79e72bc81b5113fd57f98848cd35561c27a63780748cc4
- **02-Hors-Jeu-et-limites.gmos** — 15 PJ, 38 médias embarqués ; SHA-256 : d52ede95bf8f801dbdd8f55170c441655c4bbaf77dad04086618ae4acd1bcb0a
- **03-Chocs-et-Folies.gmos** — 12 PJ, 38 médias embarqués ; SHA-256 : 606295a23255111de08053710c573f16ab29dc7925f6b77c5edf81cb6ed31c02

## Reproduire

Depuis la racine du dépôt : `node outils/campagnes-de-recette/cthulhu-hack.mjs`. Les sources sont dans `outils/campagnes-de-recette/`. Seuls les noms et identifiants des joueurs proviennent de l’export fourni par David. Aucun accès à son profil personnel, aucun import automatique dans son application.

## Rattachement aux joueurs existants

Source : `Export Dirvers/RDD_campagne_gmos_1792944586235.gmos`. Seuls les noms et identifiants ont été repris. Les trois campagnes utilisent les mêmes joueurs, avec leurs propres PJ de recette. Aucun ancien PJ de la campagne RDD ne figure dans ce lot.

- **Thomas D.** : `p-1`.
- **Marie C.** : `p-2`.
- **Lucas R.** : `p-3`.

Si une ancienne version de ce lot a déjà été importée avec des joueurs `recette-ch-joueur-…`, cette nouvelle version ne supprime pas ces anciennes entrées. Utiliser la nouvelle archive pour les prochains essais ; ne supprimer une ancienne entrée qu’après vérification de ses PJ.

## Table-OS et bilan automatique

Les trois tables JSON originales de `tables-a-importer/` s’importent séparément dans **Table-OS → Atelier**, dans un univers de recette. Choisir **Ranger tel quel**, vérifier l’aperçu puis appliquer. Elles ne voyagent pas dans la campagne Nexus et ne remplacent pas les tables Folies/Chocs/Hors Jeu. Le cas GM-17 décrit le contrôle de couverture et l’envoi de butin.

Lire **RAPPORT-DE-VERIFICATION.md** et **ANOMALIES-CONNUES.md** pour les contrôles effectués et les défauts constatés de l’application. Le lien NotebookLM hérité du pilote est documentaire ; aucun média n’en dépend. Si un réexport le détecte comme lien distant, choisir Ignorer pour ce lien.
