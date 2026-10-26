# Campagnes de recette NOC — Le neuvième timbre

## Importer

Dans **Bibliothèque des campagnes → Importer un bundle Nexus**, choisir **01-Le-neuvieme-timbre.gmos → Importer telle quelle**. Pas besoin de recharger l’application. Le pilote NOC et sa fiche sont ajoutés s’ils manquent ; si le même pilote existe, vérifier qu’il est en **2.0.0**. L’archive de pilote fournie permet son remplacement explicite au besoin.

Les PJ se rattachent aux joueurs existants **Thomas D. (p-1), Marie C. (p-2), Lucas R. (p-3)**. Identifiants relevés dans l’export fourni par David : `Export Dirvers/RDD_campagne_gmos_1792944586235.gmos`. Aucun ancien PJ de cet export n’est recopié. Leurs profils et leurs PJ des autres campagnes sont conservés par Nexus.

La **Cabale Les Veilleurs du Palier est déjà créée** sur la campagne : ouvrir **Cabale — Fiche du groupe** pour sa feuille. Si le bouton **Créer une fiche pour Cabale** apparaît à la première ouverture, le choisir : il lie la feuille HTML et reprend les valeurs déjà remplies. Sur tablette, choisir son Héros, puis l’onglet Cabale. Elle n’est pas un PJ supplémentaire rattaché à un joueur.

| Joueur | Héros | Fonction |
| --- | --- | --- |
| Thomas D. | Soren Vale | Technicien des conduites |
| Marie C. | Daria Orlov | Archiviste dissidente |
| Lucas R. | Naël Senn | Convoyeur des passerelles |

## Contenu

Enquête originale dans le **Bloc Vesper**, inventé pour les essais : trois Héros, une Cabale, trois Contacts de Réseau (Nora, Vassil, Mina), 12 PNJ/Rouages, huit lieux avec plans, 12 indices documentés, quatre actes et 16 scènes dont quatre ateliers hors fiction, trois rencontres, quatre séances prévues, neuf entrées de Wiki, quatre repères chronologiques, inventaires et butin. Lire **SCENARIO.md** pour mener l’enquête.

**02-Seuils-et-Sequelles.gmos** : 12 Héros préparés à 4/7/9 dans chaque jauge, pour franchir 5/8/10. **03-Repos-Auras-et-Cabale.gmos** : trois Héros préparés avec Soupçon 5/8/10, Extase/Lumière différentes, Ferveur 4 et réserves de Cabale épuisées. Chaque laboratoire possède sa propre Cabale, ses propres campagnes/PJ/renvois, mais les mêmes trois joueurs. Au total : **18 nouveaux PJ** sous trois joueurs existants.

Pour recommencer un essai destructif : réimporter **le fichier de ce laboratoire avec Remplacer**. Les autres campagnes restent intactes. Cloner garde l’essai précédent. Rejouer efface le parcours et les séances mais conserve les PJ : ce n’est pas une guérison générale.

## Cabale prête pour la recette

Sept Domaines, 28 Atouts renseignés dont une Faille à −1 (Salle blanche), sept pistes. Espoir/Vécu/Singularité à 1 au départ ; Credo 3, Légendes 2, Observatoire 2. Réseau 3 et Faveurs 2/1/2. Capital 3 permet l’essai de Fortune. Fiel 4 et Menace 1 permettent un débordement rapide. Ce sont des valeurs de recette, pas une création complète et validée par les livres. Les Contacts du Réseau et leurs deux Faveurs suivent **Diffractions obsidionales p. 134**, distinct du livre de base.

## Outils GM-OS

39 médias embarqués par archive : 36 SVG schématiques et trois WAV synthétiques originaux de quatre secondes. Quatre moments Storyboard, trois pads Sound-OS, deux pads Music-OS, trois tuiles Light-OS **sans lampe assignée**. Les cartouches sont des documents de test, pas des portraits illustrés. Les Auras sont appréciées par la Loi, jamais calculées sur ces plans sans échelle.

Trois tables 1d6 dans **tables-a-importer/** : **Table-OS → Atelier → Ranger tel quel**, dans un univers de recette. Elles ne voyagent pas dans les archives Nexus. Bibliothèque globale Image-OS, brouillard des cartes, calendriers, lampes, projecteurs, IA/TTS et services externes se configurent sur le poste. Aucun compte, clé ou appareil n’est inventé. Aucun nouveau module de jeu n’est créé.

## Tests et limites

**62 cas manuels** avec préconditions et attendus, dans CAHIER-DE-RECETTE.md et resultats.csv, encore NON TESTÉS par David. Les jets ordinaires restent aléatoires ; noter les faces observées. Les états de laboratoire sont reproductibles, pas leurs futurs tirages.

**Défaut connu GM-05** : l’application transmet actuellement les secrets de séance gmSecrets aux tablettes. Les notes de ce lot portent un marqueur fictif pour le vérifier. Lire ANOMALIES-CONNUES.md et RAPPORT-DE-VERIFICATION.md ; ne pas annoncer tous les cas réussis. Les conséquences narratives, les Auras, les Séquelles et les soins lourds restent à la Loi.

## Archives et reproduction

- **01-Le-neuvieme-timbre.gmos** : 3 PJ ; SHA-256 02dd311df3c72dea5202e79f6ad4ef90619842bf018163bdbf42d205482044f5
- **02-Seuils-et-Sequelles.gmos** : 12 PJ ; SHA-256 58a4ee62ae4051e3404d8c9be69569776526ef265fa402e276c3fe283f3e626a
- **03-Repos-Auras-et-Cabale.gmos** : 3 PJ ; SHA-256 b9fdf0984ef05ff0c6b8cba6e614e82c4b1f14d946b869d0e9b1dbe47cf28c1a

Générateur : `node outils/campagnes-de-recette/noc.mjs`. Sources : `outils/campagnes-de-recette/noc*.mjs`. Aucun import automatique dans l’application de David ni accès à son profil personnel.
