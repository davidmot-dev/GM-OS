# État et reprise - audit Crimes - 19/10/2026

Lire AGENTS.md, la passation et le registre avant toute reprise. Base examinée : `b2437ed8`.
David demande les améliorations du pilote Crimes, avec le Manuel de l'Enquêteur sur
CLOUDDAVID et NotebookLM. **Analyse uniquement ; aucun lot choisi ou développement lancé.**

Le [rapport complet](2026-10-19-crimes-propositions.md) décrit les sources, acquis,
écarts et propositions C0-C8, avec critères d'acceptation pour les principaux lots.

**Demande suivante de David, le 19/10 : « consigne cela dans un registre d'amélioration de
Crime ».** Le [registre dédié](2026-10-19-registre-ameliorations-crimes.md) est créé : lots
C0-C8, priorités proposées, dépendances, cas d'acceptation et historique. Tous sont à
planifier ; aucun développement choisi ou lancé. Les états se mettent désormais à jour
dans ce registre, qui renvoie à l'audit pour les preuves.

La fiche HTML a déjà été intégrée par Claude Code : template `crimes-fr`, gestionnaire
embarqué v13, correspondance de 196 clés et pilote corrigé de 203 champs. David a validé
son fonctionnement. Ne pas proposer de refaire ce raccord. Validation de la fiche passée
durant l'audit : **0 erreur, 0 avertissement**.

Référence du pilote : `Export Dirvers/corriges/Crime_driver_gmos_relie.gmos-driver`, état
identique au JSON voisin. Aucune lecture des données personnelles de GM-OS. Livre de 498
pages PDF copié pour lecture dans `scratch/crime-audit/manuel-enqueteur.pdf` ; pages de
règles imprimées = pages PDF moins 2. Quatre pages critiques relues à l'image. Deux requêtes
NotebookLM limitées au seul Manuel de l'Enquêteur, réponses et citations dans ce dossier.

Priorité proposée : C0 relecture des 19 fiches `relu:false`, puis C1 vrai moteur GARDE,
C2 potentiels actuels et atteintes, C3 dépassement, C4 psychologie, C5 dossier d'enquête.
Ensuite combat, contacts/fortune, création/progression et manuel du jeu.

Preuve centrale dans `scratch/crime-audit/constats.mjs` et `constats.json` : préparation
Physique 5 / Combat 2 donnant zéro dé, seuil 2 et neuf réussites requises ; même après
correction du nombre de dés et du seuil, l'exemple du livre `[1,3,4,6,8]` gardant `[1,8]`
donne un échec avec le moteur pool actuel au lieu d'une réussite mitigée. Vérification de
fonctions en lecture seule, **pas** un test de l'interface ouverte.

Le corpus contient des erreurs fortes : points d'enquête consommables, mort automatique
à -2, degré « réussite importante » mal articulé avec les 1, et traces d'outils dans la fiche
d'enquête. Ne pas réexécuter ces traces, ni régénérer le pilote sans relecture. Les réponses
NotebookLM ne remplacent pas le PDF : pages et extrapolations ont été confrontées au livre.
Rester explicite sur les ambiguïtés de procédure et les arbitrages du MJ.

Tous les changements applicatifs restent à décider. Le registre général était déjà modifié
et reste intact. Les exports, documents Dune/Alien, références Crime, `output/` et `tmp/`
étaient présents avant cet audit et ne sont pas à réécrire. Les deux nouveaux documents
d'audit et le nouveau registre dédié sont non commités. Aucun git en écriture, paquet installé, service lancé, code
applicatif ou donnée de campagne modifié.

Pour reprendre un développement : demander d'abord si GM-OS tourne avant d'éditer `src/`
ou `electron/`, relire l'export actuel et coordonner l'écrivain du registre. Le futur manuel
`54-Jeu-Crimes` devra documenter seulement les mécanismes réellement livrés et leurs captures.
