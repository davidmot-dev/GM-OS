# Campagnes de recette ALIEN — La dernière relève d’Orphée

## Importer

**Bibliothèque des campagnes → Importer un bundle Nexus → 01-La-derniere-releve.gmos → Importer telle quelle**. Pas besoin de recharger GM-OS. Dépendances manquantes ajoutées ; un pilote existant du même identifiant est conservé. Vérifier ALIEN **1.9.0** ; le pilote fourni permet un remplacement explicite si nécessaire.

Les PJ sont rattachés aux joueurs existants **Thomas D. p-1**, **Marie C. p-2**, **Lucas R. p-3**, identifiants de `Export Dirvers/RDD_campagne_gmos_1792944586235.gmos`. Aucun ancien PJ recopié. Les profils et les personnages des autres campagnes sont conservés.

| Joueur | PJ | Poste principal |
| --- | --- | --- |
| Thomas D. | Eli Voss | Machines, senseurs et ingénieur |
| Marie C. | Mara Chen | Capitaine et médecin |
| Lucas R. | Samir Hale | Pilote |

## Modules déjà préparés

Les **trois modules existants** sont activés dans le pilote et leurs données sont embarquées :

- **MU/TH/UR 6000** : mission, dossier à code CARGO-17, dossier administrateur, quatre protocoles, trois actes, neuf objectifs privés non remis et un préréglage.
- **Détecteur** : huit zones en mètres, sept pions dont les trois PJ, porteur Eli, batterie 5, modes discret/mise en scène sous préréglages. Plan, noms et positions des pions restent au MJ.
- **Combat spatial** : Iskra et Vautour, deux modèles du catalogue du livre, cinq postes par vaisseau, équipage PJ/PNJ et un préréglage. Aucun combat lancé dans l’enquête principale.

Après import : **Cockpit → Modules du jeu**. Ouvrir une séance, puis **cocher les PJ dans les accès de chaque module**. Les accès sont indépendants et restent fermés à l’import ; aucun scan, alarme, compte à rebours ou son n’est démarré. Côté joueur : **Hub → Modules du jeu**. Lire **MODULES-MAMAN.md** avant les essais. Aucune création ni installation d’un nouveau module nécessaire.

## Contenu et variantes

Enquête originale au relais Orphée, noms et lieux inventés : trois actes Cinéma plus un atelier hors fiction, **3 PJ, 12 PNJ, 8 lieux, 12 indices documentés, 16 scènes, 3 rencontres, 4 séances prévues, 9 Wiki**, inventaires, huit lots de butin et une réserve. Lire **SCENARIO.md** pour les vérités, les accès de rechange et les dénouements.

**02-Corps-Panique-et-Survie.gmos** : neuf PJ de laboratoire, Paniques 7/10/13, synthétique brisé, humain brisé, réserves à 1, Stress 11, privations/radiations et 15 PX de Campagne. **03-M314-Terminal-et-Vaisseaux.gmos** : trois PJ, M314 Énergie 1 et combat spatial prêt au Tour 1 / phase senseurs. Chaque archive possède ses modules indépendants ; les mêmes trois joueurs reçoivent **15 nouveaux PJ au total**.

Réimporter seulement le laboratoire concerné avec **Remplacer** pour recommencer. Cloner garde l’ancien essai. Rejouer conserve les PJ, ce n’est pas une guérison générale. Les valeurs sont choisies pour tester, pas une création de personnages ni un bestiaire officiel validés. Confirmer le profil et les attaques de la créature avant un vrai combat d’espèce.

## Outils et vérifications

**39 médias originaux** par archive : 36 documents/cartes SVG et trois WAV synthétiques de quatre secondes. Quatre Storyboards, trois pads Sound-OS, deux Music-OS, trois tuiles Light-OS sans lampe assignée. Les bips du M314 sont produits par son module, distincts des WAV de Sound-OS. Les vidéos/sons internes MU/TH/UR restent ceux de l’application ; aucun film copié dans le lot.

Trois tables séparées : **Table-OS → Atelier → Ranger tel quel**, dans un univers de recette. Elles ne remplacent aucune table de règles ALIEN. IA/TTS, lampes, projecteurs, brouillard des cartes, calendriers et bibliothèques globales restent à configurer sur le poste.

**74 cas manuels encore NON TESTÉS par David**, avec préconditions, attendus et CSV vierge. Les tirages en séance restent aléatoires ; les états initiaux sont reproductibles. Lire RAPPORT-DE-VERIFICATION.md et ANOMALIES-CONNUES.md. Le défaut transversal connu **GM-05 : gmSecrets transmis aux tablettes** reste distinct de la confidentialité des modules privés et ne doit pas être déclaré corrigé.

## Archives

- **01-La-derniere-releve.gmos** : 3 PJ ; SHA-256 35369bdac93385f2de12921de95c1bc5ab90ef9d8d0a1bc03372640e59cb4bcf
- **02-Corps-Panique-et-Survie.gmos** : 9 PJ ; SHA-256 c3d1196d5217ca6c7df14aee9db2f562cdf472bc5f5e1ca7fe311c9b0dcecc0e
- **03-M314-Terminal-et-Vaisseaux.gmos** : 3 PJ ; SHA-256 1f91a3ea4234b25a6944221c798f7564b427a6156a7cdc51269d1e46fa3371f6

Reproduire : `node outils/campagnes-de-recette/alien.mjs`. Aucun accès au profil personnel ni import automatique dans l’application de David.
