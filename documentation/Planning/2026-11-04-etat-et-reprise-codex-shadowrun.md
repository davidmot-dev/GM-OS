# Reprise Codex — Shadowrun SR-A1/A2/A3 — 04/11/2026

David : « on va commencer SR-A1, SR-A2 et SR-A3 ». GM-OS confirmé fermé ; mise à jour du
registre et essais/services locaux en profils jetables autorisés. **Livré et validé par David le 04/11/2026.**

Validation de David le 04/11/2026 : « ok c'est bon, c'est testé ». Elle porte sur SR-A1, SR-A2 et SR-A3 du pilote 2.1.0 ; les limites documentées et SR-A4/A5/A6 restent séparés.

## Produit

Pilote **2.1.0**, identifiants et anciennes clés conservés, 139 champs :
`Export Dirvers/corriges/Shadowrun-Anarchy-2.1.0.gmos-driver`.
David précise le 04/11 que les pilotes à réimporter doivent être livrés dans ce dossier ;
copie vérifiée par empreinte SHA-256, liens et consigne `AGENTS.md` actualisés.
Générateur `outils/shadowrun-anarchy/ameliorer_shadowrun.mjs`, sans modifier l’export de David.

- SR-A1 : origine et tentatives par case, drain proposé et confirmé une fois, aggravation
  gardant son origine, soins interdits refusés à la porte commune, repos et fin de narration.
- SR-A2 : attribut lié explicite, dérivés proposés avec dérogation, indices de protection
  déclarés, Anarchy sans plafond, choix social et mort par Essence confirmée.
- SR-A3 : Matrice préparée, accès par cible, Firewall/backdoor, minimum de risque imposé,
  surveillance persistante, convergence et choc d’éjection, redémarrage +1 h hors ligne.

Ancres : `suiviDeShadowrun.ts`, `matriceDeShadowrun.ts`, `CartesShadowrun.tsx`,
`moniteurDeShadowrun.ts`, `DescripteurDeJet.ts`, `PanneauDeJet.tsx`, protections des anciennes
fiches dans `entitySlice.ts`. Manuel 53/54, huit captures intégrées, synthèse et registre § 211
actualisés. [Suivi et essai de David](2026-11-04-shadowrun-sr-a1-a3.md).

**Vérifié :** suite complète exécutée, **9 803 tests passent**, 4 ignorés / 825 fichiers passent,
un ignoré. Après derniers ajustements du test générateur : **73 tests ciblés / sept fichiers**.
Types propres, lint global **0 erreur / un avertissement préexistant**, construction réussie.
**Deux parcours Electron passent** sur la construction finale (47,4 s), dix captures relues.
Zéro constat du contrôleur de pilote sur le résultat du générateur. Journaux et preuve JSON :
`output/shadowrun-sr-a1-a3/`.

## Reprendre

SR-A1/A2/A3 sont validés ; aucun essai de David ne reste attendu pour ce lot.
Pour reproduire, réimporter le pilote 2.1.0 avec **Remplacer** et reprendre les gestes du suivi détaillé.
Les anciennes cases demandent leur origine avant un soin ; les protections restent vides
tant qu’elles ne sont pas chiffrées explicitement. Les clés de la fiche HTML restent intactes.
Faire l’éventuelle relance avant de confirmer les conséquences.

SR-A4/A5/A6 restent à choisir séparément ; rigging après arbitrage de résistance. Variante
de risque alternatif + minimum de DIEU : cas bloqué en attente d’arbitrage, aucune conversion
de règle inventée. Consommation d’action RV, protection active, verrouillage, limite d’un
changement de mode par narration et conséquences narratives restent à la table.

## Pièges et coexistence

- PowerShell : utiliser `npx.cmd` / `npm.cmd`, les `.ps1` étant bloqués. Pour les redirections
  de journaux de commandes natives, `cmd.exe` évite un faux échec dû au traitement de stderr.
- Le test du générateur reste dans le projet Vitest **Electron/Node**, sans import typé de
  `NexusDriverState` (qui entraîne les magasins du renderer), ni import statique du contrôleur.
  Le contrôleur est chargé dynamiquement pour essayer sa vraie fonction ; les types du code
  métier restent contrôlés par le projet renderer. Cela évite les erreurs `Window.appBridge`
  et les fichiers TSX dans un projet sans JSX, sans changer les tsconfig.
- Lire le PDF du NAS en lecture seule a demandé la sortie du bac à sable. Les profils
  jetables Electron ont aussi demandé cette relance à cause d’un nettoyage `EPERM`.
- Les captures ont été redirigées vers `output/` puis relues et copiées. Aucune installation,
  aucun accès aux données personnelles, aucune commande Git d’écriture.
- Les changements préexistants du registre (bestiaire § 210), des guides 10/12 et des exports
  sont conservés. Les tableaux du suivi ont été vérifiés après correction de l’encodage UTF-8
  d’une commande PowerShell. **Après validation, David demande « commit » le 04/11 ; aucun push demandé.**
