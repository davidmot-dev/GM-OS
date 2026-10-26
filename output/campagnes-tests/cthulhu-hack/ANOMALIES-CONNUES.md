# Anomalie constatée — GM-05

**Secrets de séance diffusés aux tablettes, constat du 25/10/2026.** L’import et les jets fonctionnent, mais le champ `payload.session.sessions[*].gmSecrets` reste présent dans les trames WebSocket reçues. Le marqueur fictif `SECRET_MJ_CH_RECETTE` a été observé sur les trois formats de tablette. Ce défaut appartient à l’application, pas au format de la campagne.

Le filtre `src/modules/remote/logic/caviardageDesJoueurs.ts` traite `gmNotes`, `notesDuMeneur` et `gmSecretInfo`, sans retirer `gmSecrets`. Le test e2e finit donc volontairement en échec sur GM-05 ; son rapport ne doit pas être présenté comme entièrement vert. Aucun correctif de l’application n’est inclus dans cette livraison de données. Le constat figure au registre des chantiers, § 1 bis et § 178.

Reproduction : importer les trois archives, ouvrir une séance de l’enquête et connecter un joueur de recette. Le rapport `verification-electron.json` fournit les chemins observés sans recopier les trames. Toutes les données de ce pack sont fictives.
