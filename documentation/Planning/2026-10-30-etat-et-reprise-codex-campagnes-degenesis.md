# État et reprise — Codex, campagnes Degenesis — 30/10/2026

## Livré

Demande de David : campagnes de test Degenesis via **GM-OS Campagnes de test**, pilote et règles
fournis, joueurs de son export. Trois archives et ZIP dans `output/campagnes-tests/degenesis/`.
Sources sous `outils/campagnes-de-recette/degenesis*`, emballage et E2E propres à ce jeu.
[Bilan détaillé](2026-10-30-campagne-recette-degenesis.md), registre § 189, synthèse et manuel
Degenesis complétés. David a demandé « commit et pousse » le 30/10 : livraison sur
`production`, avec les contrôles de poussée du dépôt. Les modifications préexistantes
hors de ce lot restent en dehors du commit.

67 tests passent ; vérificateur portable, médias et rendus contrôlés. Imports natifs, remplacement
isolé, trois Hub et persistance aboutissent. Le test E2E **échoue sur GM-05**, douze secrets de
séance reçus. L’assertion demeure ; les 66 cas humains restent **NON TESTÉS**.

## Reprendre

Importer `01-La-Station-des-Cendres.gmos`, puis 02 et 03. Vérifier le pilote 2.0.0 et moteur de
fiches 21 ; suivre le guide et les cas GM/AV/FI puis SA/JE/IN/SP. Rejouer un laboratoire par son
seul remplacement, sans toucher 01. GM-05 est transversal et relève d’un chantier séparé,
après réponse à « GM-OS tourne-t-il ? » pour toute correction sous `src/`/`electron/`.

## Ne pas repayer

- Prendre le pilote **corrigé 2.0.0**, pas l’export forgé 1.0.0. Le générateur affirme ID,
  version et 131 champs ; 16 règles relues et correspondance HTML 129/129.
- Date propre au lot **30/10**, sans changer `DATE_RECETTE` du helper partagé (25/10).
- Chaque compétence opposée exclut sa paire. `ego_max` est choisi selon INT/Concentration
  ou INS/Pulsions. Les maxima des pistes passent par `maximumDeLaJauge`, santé par
  `santePrincipaleDeLaFiche`/`santeAlignee`. Sporulation subie, Égo restant.
- Atlas n’accepte pas interior/exterior : traduire les catégories de fiction en `dungeon`
  pour les intérieurs et `battlemap` pour les plans locaux extérieurs. Contrôle ajouté,
  archives régénérées puis import/Hub et médias revérifiés sur leurs nouvelles empreintes.
- Les clés d’objets audio et les IDs `SCENE_…` sont transformés lors du clone de laboratoire,
  les références médias sont partagées et embarquées. Aucun module Degenesis inventé.
- La fiche intégrée utilise `.active` sur ses boutons ; son runtime n’expose pas
  `aria-pressed`. Contrôler l’état réel, pas celui du runtime autonome d’atelier.
- Bac à sable : `electron-log-preload.js` refuse `lstat C:/Users/david` puis expiration.
  Relance hors bac à sable acceptée automatiquement après autorisation des essais isolés.
  Le processus expiré occupait encore 4100/4101 ; vérifier et fermer **seulement** ses processus
  identifiés par le profil temporaire exact. Ne pas déplacer Temp dans le dépôt.
- `ELECTRON_RUN_AS_NODE` absent ; `npm.cmd`/`npx.cmd`, maxWorkers=4, `tsc -b`.
  Les seuls tests Electron lancés sont ceux de ce lot via `lancerGmOs.ts`.
- GM-05 : `verification-electron.json` porte `reussi:false` et les douze chemins ; tous les
  indicateurs fonctionnels valent vrai. L’emballeur exige ces preuves et garde le défaut visible.
- Les sources et rapports sont liés aux empreintes des trois archives ; ne pas annoncer une
  recette récente sur des fichiers régénérés différents. Le CSV humain n’est jamais prévalidé.

Les changements préexistants de documentation, exports et références ne sont pas à Codex :
ne pas les nettoyer ni les inclure dans un futur commit de ce lot sans décision de David.
