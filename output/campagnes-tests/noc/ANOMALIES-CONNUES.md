# Anomalies connues — NOC, 25/10/2026

**GM-05 : ÉCHEC, secrets de séance transmis aux tablettes.** 12 chemins observés avec le marqueur fictif SECRET_MJ_NOC_RECETTE. Le filtre de l’application ne retire pas GameSession.gmSecrets des données envoyées aux joueurs. Ce défaut déjà découvert lors de la recette Cthulhu Hack est transversal ; aucun correctif applicatif n’est inclus dans les données NOC.

Le rapport verification-electron.json ne conserve que les chemins des champs concernés, pas les trames. Les autres contrôles d’import, joueurs, Cabale, recharge, Faveurs, fiches, jets et persistance ont abouti. Le scénario E2E reste volontairement en échec tant que GM-05 subsiste. Les 62 essais manuels restent à effectuer par David. Aucune donnée de ce lot ne provient d’une vraie séance.
