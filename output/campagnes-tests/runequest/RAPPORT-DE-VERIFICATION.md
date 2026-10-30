# Vérification des campagnes RuneQuest — 30/10/2026

État : **IMPORTÉ ET ÉPROUVÉ EN INSTANCE ISOLÉE, avec anomalie GM-05**.

- 91 contrôles automatisés réussis : archives réellement livrées, validateurs Nexus/pilote, 313 champs de fiche, types, références, santé réelle, 21 nouveaux PJ et trois joueurs autorisés. Fonctions réelles RuneQuest : cinq niveaux de D100, seuils 3/56/120/140, modificateurs, caractéristique, résistance, opposition et localisations. Les coûts magiques ne sont pas automatisés par ce pilote.
- Utilitaire du plugin : trois archives valides selon son contrôle Nexus structurel partiel ; 39 médias par archive. Les SHA-256 des rapports concordent avec les fichiers livrés.
- Médias : 36 SVG et trois WAV de quatre secondes décodés hors ligne ; neuf rendus inspectés. Plans et cartouches documentaires originaux, signaux synthétiques.
- Import natif des trois archives et remplacement isolé du laboratoire 02 ; trois anciens PJ sentinelles, noms et avatars conservés. Rechargement : 24 PJ persistés dont 21 de ce lot, et notes de 01 conservées.
- Lancement Electron : échec graphique dans le bac à sable (code −1073741515). Après un premier refus de la revue automatique, David a explicitement autorisé la relance hors bac à sable. Le temporaire placé dans le dépôt a ensuite été refusé par la garde de sauvegardes ; le lanceur conserve donc son temporaire système hors installation, ses profils/corpus/sauvegardes jetables et ses contrôles d’isolation. Détails dans verification-lancement.json.
- Trois Hub simulés à 360/768/1180 px : trois jets reçus par le MJ, trois localisations avec lecture des PV, trois fiches HTML liées ; nom, FOR, nom et pourcentage de l’arme principale contrôlés. PM écrits à 8/9/10 et retrouvés après rechargement. Captures examinées.
- GM-05 : ÉCHEC conservé dans le test et le rapport. Voir ANOMALIES-CONNUES.md.
- **66 cas humains NON TESTÉS**, CSV vierge. Aucun essai matériel ni partie complète annoncé.

La compilation npm.cmd run build (dont tsc -b) a réussi le 30/10/2026. Les avertissements de taille/imports Vite ne sont pas des erreurs de compilation. Aucune modification de src/, electron/, du pilote fourni ou des données personnelles.

Sources : pilote RuneQuest 2.0.0 et gabarit 313 champs de l’export corrigé, 17 fichiers de règles relus, manuel et correspondance runequest-fr. Empreintes détaillées dans provenance.json. Date fixe de génération : 2026-10-30T12:00:00.000Z. Ce rapport distingue l’exécution automatique de la recette humaine.
