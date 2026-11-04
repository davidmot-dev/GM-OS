# Reprise Codex — Shadowrun SR-A1 à SR-A6 — 04/11/2026

## Suite — validation des six lots et clip Playwright

David : « c'est testé marque le », puis demande un clip des nouveautés inspiré de RuneQuest.
Les six lots sont validés, SR-A4/A5/A6 sont cochés et verts dans la synthèse (12/0/0),
le suivi, le manuel et le registre § 212. Le scénario `e2e/clipShadowrunAnarchy.spec.ts`
filme six chapitres sur le pilote 2.2.0 : drain, cohérence, Matrice, planification,
opposition, rigging. Profil fictif isolé, dés préparés, gestes et confirmations réels.
Le curseur et les légendes suivent le format du clip RuneQuest. Registre § 213 ;
livrable `output/clips/shadowrun-anarchy-nouveautes.mp4` (3 min 12, H.264, 1440 × 900),
tournage WebM et preuves dans le sous-dossier
`output/clips/shadowrun-anarchy/`. Aucun nouveau paquet ni modification du produit.

Piège de réalisation : ne pas effacer puis taper chiffre par chiffre dans un nombre
contrôlé qui rétablit son minimum à l’effacement ; `fill(valeur)` saisit le nombre entier.
Le texte reste tapé progressivement. Le script n’exporte le film final que si toutes
les assertions métier passent. **Vérifié** : un parcours Playwright passé, aucun saut ;
lint du scénario/exporteur propre. Sept images de scènes et huit images du MP4 relues,
début et fin compris. `outils/clips/exporter_clip.mjs` retire le chargement initial du MP4
avec le FFmpeg déjà installé ; aucune installation. Le lecteur ouvre directement le MP4,
les repères des six chapitres sont dans `output/clips/shadowrun-anarchy/README.md`.
David demande ensuite « commit et pousse » le 04/11/2026 : publication sur `production`,
avec les hooks de validation et de synchronisation des guides. Les fichiers étrangers
et le clip RuneQuest restent hors du commit Shadowrun.

## Suite — SR-A4/A5/A6, pilote 2.2.0 livré et validé par David

Validation de David le 04/11/2026 : « c'est testé marque le ». SR-A4/A5/A6 sont cochés
et verts ; aucun essai de David attendu pour SR-A1 à SR-A6. Clip Playwright des nouveautés
demandé le même jour, inspiré du clip RuneQuest.

David demande « on va commencer SR-A4, SR-A5 et SR-A6 » et confirme GM-OS fermé.
Son arbitrage du 04/11 fait foi : « Tableau des blessures : 6/10/14 dans cet exemple ».
Le véhicule utilise Structure ×1/×2/×3 + Blindage (p. 69), pas les seuils humanoïdes.

Produit : planification, flashback et menace ; opposition, égalités et rôles adverses ;
flotte, équipement, modes, dommages et biofeedback. Les reçus sont dans la campagne,
les valeurs dans les réserves natives ; les nouvelles confirmations restent au meneur.
Stitch utilisé : projet `4980125564784271447`, trois cartes adaptées au thème GM-OS.
Manuel 53/54, captures, synthèse (12 vertes, 0 orange) et registre § 212 actualisés.
Les résultats finaux et les limites sont dans le
[suivi SR-A4/A5/A6](2026-11-04-shadowrun-sr-a4-a6.md).
**Vérifié sur la construction finale : 9 827 tests passent, 4 ignorés / 827 fichiers
passent, un ignoré ; types et build passent, lint 0 erreur et un avertissement préexistant ;
trois parcours Electron passent, quatorze captures relues.**

**Reprendre par** l’import de `Export Dirvers/corriges/Shadowrun-Anarchy-2.2.0.gmos-driver`
avec **Remplacer** pour reproduire les trois gestes du suivi. Aucun champ à reprendre depuis
la 2.1.0. Les six lots sont validés. **Commit et push demandés par David le 04/11/2026.**
Le commit bestiaire `49b081f8` d’un autre chantier est conservé.

**Pièges payés** : une reconnexion brute doit présenter le `repriseModules` reçu à
l’inscription ; ne pas affaiblir le serveur pour faire passer le test. Le résumé de résultat
opposé doit afficher le seuil du lancer, même après modification des menus. L’ordre autonome
fait exception au premier ordre de même priorité ; commander plusieurs drones en mode
capitaine n’est pas changer de mode à chaque appareil. Mettre à jour à la fois la liste
des droits Electron et le contrat `remote/actions/registry.test.ts` pour un nouveau message.
Construire après les dernières modifications, puis exécuter les e2e en profil jetable.
Le parcours générique Shadowrun dépasse 30 s avec les trois cartes supplémentaires ;
son délai est porté à 120 s, sans changer les attentes de la fiche HTML.

---

## Livraison précédente — SR-A1/A2/A3, validée

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
