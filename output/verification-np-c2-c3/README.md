# NP-C2 / NP-C3 — preuves du 03/11/2026

Six parcours Electron passent : quatre jeux sur les droits et la reprise des PJ,
puis COC 3d6 et Shadowrun alternatif avec retour au standard. Les huit captures ont été relues.
David valide globalement : « ok tout est testé, commit et pousse ».

Chaque jeu possède un rapport droits et un rapport reprise. L'édition d'autrui
(données, narratif, PV et alias) est refusée ; une propre édition passe et les notes
MJ restent protégées. Après rechargement, les valeurs interdites restent absentes.
Le diagnostic reprend une ancienne valeur fictive par liaison explicite, télécharge
un JSON dans le profil temporaire et restaure depuis ce fichier ; notes, inventaire
et santé sont conservés, y compris après rechargement.

Les deux rapports de variantes attestent l'import/remplacement, deux lancers réels,
le retour au pilote standard et sa persistance. Shadowrun utilise une fixture créée
dans le profil jetable, sans modifier les pilotes officiels du dépôt.

Les jets du panneau du meneur sont vérifiés sur leur résultat visible : ce panneau
écrit au journal, pas dans l'historique useDiceStore réservé ici aux jets distants.
Une compétence fictive nommée est nécessaire au sélecteur Shadowrun. Le bilan Nexus
peut déjà être fermé par la navigation lors de l'activation d'une campagne : sa
fermeture explicite reste conditionnelle dans le test.

Ces trois corrections portent sur le scénario de test ; aucun défaut GM-06 trouvé.
Les premiers échecs de scénario ne sont pas comptés comme des réussites applicatives.
Les traces et journaux bruts restent sous tmp/np-c2-c3-e2e-* ; les preuves durables,
comptes et SHA-256 sont dans verification.json.

252 tests ciblés sur 22 fichiers, types, lint et construction passent. Aucun accès
aux données personnelles, installation, génération par IA ou appareil réel utilisé.
La validation humaine est celle de David ; aucune nouvelle preuve instrumentée sur
une tablette physique n'est revendiquée. Les rapports historiques restent inchangés.
