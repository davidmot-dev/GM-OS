# Contrat de livraison d'un lot

```text
<jeu>-campagnes-de-test.zip
  01-<titre>-campagne-complete.gmos   seule archive de campagne
  <jeu>-<version>.gmos-driver        si nécessaire, ne crée pas de campagne
  LIRE-MOI.md
  MATRICE-COUVERTURE.md
  matrice-couverture.json
  CAHIER-DE-RECETTE.md
  cas-de-recette.json
  resultats.csv
  ETATS-DE-REFERENCE.md
  RAPPORT-DE-VERIFICATION.md
  ANOMALIES-CONNUES.md
  provenance.json
  tables-a-importer/       seulement si utiles et au vrai format Table-OS
  reproduction/           sources du générateur ou instructions et états nécessaires
```

Défaut : **une seule campagne complète**, histoire suivie et ateliers intégrés dans la même Trame. Les 10 à 15 séances indicatives doivent être préparées et jouables selon le [contrat de campagne complète](campagne-complete.md), pas seulement nommées. Un découpage en plusieurs campagnes exige une demande explicite ; les anciens lots ne sont pas à convertir automatiquement. Ces noms sont des livrables, pas de nouvelles clés internes. Un ZIP **PRÉPARÉ** reste utile quand seuls les contrôles structurels ont été exécutés ; ne pas le qualifier de validé en application.

`provenance.json` précise version du générateur, date fixe, empreintes des sources autorisées, pilote ID/version, gabarit ID, empreintes de chaque `.gmos`, versions des outils et contrôles réellement exécutés. Aucune clé API ni donnée privée inutile dans le ZIP.

`cas-de-recette.json` est une liste de cas :

```json
[{"id":"JET-01","archive":"01-titre-campagne-complete.gmos","repere":{"acteId":"acte-recette","sceneId":"atelier-jets","personnageId":"pj-recette"},"precondition":"Dans Atelier jets, PJ de recette et ressource à 3","action":"Effectuer l'action décrite dans le pilote","attendu":"Résultat observable selon la règle citée","source":"Règle et page à renseigner","preuvePrevue":"Capture et valeur après rechargement"}]
```

Le modèle ci-dessus est un canevas à compléter, jamais un cas prêt à jouer. Les repères sont des métadonnées du cahier, pas des champs natifs inventés pour GM-OS. Tous les cas visent l'unique archive par défaut. Le CSV garde `id;archive;precondition;action;attendu;statut;observe;preuve` ; ses préconditions nomment aussi la scène et le personnage pour rester utilisables sans colonnes supplémentaires. État initial **NON TESTÉ**, autres états humains **PASSÉ**, **ÉCHEC**, **NON APPLICABLE** avec justification. Les contrôles automatiques ont leurs propres rapports.

`ETATS-DE-REFERENCE.md` décrit les cibles/champs d'essai, leurs valeurs initiales et la restauration locale réellement disponible, ou sa procédure manuelle. C'est une annexe à lire, pas un import natif. Ne pas livrer un JSON en prétendant qu'il réinitialise un atelier dans GM-OS.

`ANOMALIES-CONNUES.md` donne les constats réels, leur portée et la méthode pour les reproduire ; s'il n'y en a pas, indiquer les vérifications réalisées plutôt que « aucun bug ». Un constat historique n'est ni une panne actuelle prouvée ni une dispense de contrôle.

Le guide explique : pilote à vérifier/remplacer explicitement si nécessaire, **un seul .gmos à importer**, tables facultatives, accès aux ateliers dans la Trame, joueurs réutilisés et nouveaux PJ, états de référence, réglages manuels et limites. Remplacer le .gmos réimporte toute la campagne : ne jamais le recommander comme reset local d'un atelier. Le guide ne demande aucune suppression de données personnelles.
