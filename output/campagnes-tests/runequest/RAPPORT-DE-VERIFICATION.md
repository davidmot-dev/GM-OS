# Vérification des campagnes RuneQuest — RQ-A1, 01/11/2026

État : **IMPORTÉ ET ÉPROUVÉ EN INSTANCE ISOLÉE**.

- 96 contrôles automatisés réussis : archives réellement livrées, validateurs Nexus/pilote 2.1.0, 320 champs, types, références, santé réelle, 21 nouveaux PJ et trois joueurs autorisés. Fonctions réelles : cinq niveaux de D100, seuils 3/56/120/140, modificateurs, caractéristique, résistance, opposition, localisations et coups localisés (armure, plafond, soins, états préparés C07/C08). Les coûts magiques ne sont pas automatisés.
- Utilitaire du plugin : trois archives valides selon son contrôle Nexus structurel partiel ; 39 médias par archive. Les SHA-256 des rapports concordent avec les fichiers livrés.
- Médias : 36 SVG et trois WAV de quatre secondes décodés hors ligne ; neuf rendus inspectés. Plans et cartouches documentaires originaux, signaux synthétiques.
- Import natif des trois archives et remplacement isolé du laboratoire 02 ; trois anciens PJ sentinelles, noms et avatars conservés. Rechargement : 24 PJ persistés dont 21 de ce lot, et notes de 01 conservées.
- Lancement Electron dans les conditions déjà autorisées : profils, USERPROFILE, corpus, coffre, sauvegardes et ports jetables du helper, appareils désactivés et réseau externe des Hub bloqué. Aucun profil personnel lu. Les anciens diagnostics de lancement sont conservés dans historique, sans être présentés comme ceux de cette révision.
- Nexus conserve le vrai pilote historique 2.0.0 ; remplacement explicite par le 2.1.0 éprouvé dans les pilotes. Après import : coups sur PJ, PNJ lié et adversaire autonome ; armure arrêtant tout, C09 plafonné à 4, soin 99 borné à 4, soin de C07 ; Porter le coup depuis le jet vers une vraie cible de 01, lanceur inchangé. Persistance avant remplacement et compteurs initiaux retrouvés dans 02 ; note et blessure de 01 conservées.
- Trois Hub simulés à 360/768/1180 px : trois jets reçus par le MJ, trois localisations sans PV du lanceur ni détail de cible côté joueur ; trois fiches HTML liées, nom/FOR/arme contrôlés, PM écrits à 8/9/10 et persistés après rechargement. Sept captures Electron examinées.
- GM-05 : aucun marqueur reçu dans cette exécution. Voir ANOMALIES-CONNUES.md.
- **78 cas humains NON TESTÉS**, CSV vierge. Aucun essai matériel ni partie complète annoncé.

La compilation npm.cmd run build (dont tsc -b) a réussi le 01/11/2026 ; lint ciblé des sources de cette révision. Les avertissements de taille/imports Vite ne sont pas des erreurs de compilation. Aucune modification de src/, electron/ ou de données personnelles par RQ-A1.

Sources : pilote RuneQuest 2.1.0, gabarit 320 champs, 17 fichiers de règles relus, manuel et correspondance runequest-fr. Export corrigé absent : pilote reconstruit avec le générateur versionné depuis le pilote 2.0.0 historique ; aucune campagne personnelle consultée. Export source des joueurs absent : relevé minimal précédemment autorisé réutilisé sans nouvelle lecture de l’export. Empreintes dans provenance.json. Date fixe : 2026-11-01T12:00:00.000Z. La validation globale des essais précédents de David ne prévalide pas les 78 cas de cette révision.
