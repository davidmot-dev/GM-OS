# Contrat de livraison d'un lot

```text
<jeu>-campagnes-de-test.zip
  01-<aventure-originale>.gmos
  02-<laboratoire-etats>.gmos
  03-<laboratoire-mecanique>.gmos
  LIRE-MOI.md
  MATRICE-COUVERTURE.md
  matrice-couverture.json
  CAHIER-DE-RECETTE.md
  cas-de-recette.json
  resultats.csv
  RAPPORT-DE-VERIFICATION.md
  ANOMALIES-CONNUES.md
  provenance.json
  tables-a-importer/       seulement si utiles et au vrai format Table-OS
  reproduction/           sources du générateur ou instructions et états nécessaires
```

Adapter le découpage à la demande ; ces noms décrivent des livrables, pas des clés de l'application. Un ZIP documenté **PRÉPARÉ** reste utile quand seuls des contrôles structurels ont été exécutés. Ne pas le qualifier de validé en application.

`provenance.json` précise version du générateur, date fixe, empreintes des sources autorisées, pilote ID/version, gabarit ID, empreintes de chaque `.gmos`, versions des outils et contrôles réellement exécutés. Aucune clé API ni donnée privée inutile dans le ZIP.

`cas-de-recette.json` est une liste de cas :

```json
[{"id":"JET-01","archive":"01-aventure.gmos","precondition":"PJ préparé et ressource à 3","action":"Effectuer l'action décrite dans le pilote","attendu":"Résultat observable selon la règle citée","source":"Règle et page à renseigner","preuvePrevue":"Capture et valeur après rechargement"}]
```

Le modèle ci-dessus est un canevas à compléter, jamais un cas prêt à jouer. Le CSV a les colonnes `id;archive;precondition;action;attendu;statut;observe;preuve`. État initial **NON TESTÉ**, autres états humains **PASSÉ**, **ÉCHEC**, **NON APPLICABLE** avec justification. Les contrôles automatiques ont leurs propres rapports.

`ANOMALIES-CONNUES.md` donne les constats réels, leur portée et la méthode pour les reproduire ; s'il n'y en a pas, indiquer les vérifications réalisées plutôt que « aucun bug ». Un constat historique n'est ni une panne actuelle prouvée ni une dispense de contrôle.

Le guide indique premier fichier à importer, pilote nécessaire, joueurs réutilisés, nombre de nouveaux PJ, remise à zéro des seuls laboratoires, réglages manuels, emplacement des outils et limites. Il ne donne aucune instruction de suppression des données personnelles.
