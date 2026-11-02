---
name: campagne-de-recette
description: Fabriquer, vérifier et livrer une campagne complète de recette GM-OS pour un pilote — un seul .gmos, intrigue suivie, ateliers intégrés, joueurs existants, médias, modules réels et cahier de tests. À utiliser pour créer une campagne de test ou de recette, éprouver un pilote ou reprendre un lot existant.
---

# Une campagne de recette

**Décision de David du 01/11/2026 : toutes les futures campagnes d'essais sont des campagnes
complètes, généralement de 10 à 15 séances, dans un seul `.gmos`, avec ateliers intégrés.**
La méthode détaillée et le contrat courant sont dans
[`GM-OS Campagnes de test`](../../../outils/gmos-campagnes-tests/plugin/gmos-campagnes-tests/skills/campagnes-de-test/SKILL.md)
et sa référence `campagne-complete.md`. Plusieurs campagnes ne se livrent que sur demande
explicite ; les anciens prompts au pluriel ne constituent pas ce choix.

Les lots historiques de Cthulhu Hack, NOC, ALIEN, Rêve de Dragon, Dune, Nephilim (registre
§ 178 à 183), puis RuneQuest, Degenesis, COC et Shadowrun ont souvent trois archives. Ils
ne sont pas à fusionner ou régénérer sans demande. Ces lots sont l'œuvre de **Codex** : relire ses notes avant d'en toucher un, et
un seul écrivain par fichier. Le document de chaque jeu fait foi —
`documentation/Planning/2026-10-2x-campagne-recette-<jeu>.md`, section **« Reproduire »** ; le
document fondateur est `2026-10-25-campagnes-de-recette.md` (Cthulhu Hack). Le modèle le plus
complet à imiter est **Dune** (`dune*.mjs`, § 182).
Reprendre la richesse de ses préparations et ses appels métier, pas son découpage historique
en trois archives : le nouveau contrat à une campagne prime pour les prochaines créations.
Reprendre la richesse de ses préparations et ses appels métier, pas son découpage historique
en trois archives : le nouveau contrat à une campagne prime pour les prochaines créations.

## Ce qu'une recette contient

- **Une seule archive de campagne** `.gmos` : intrigue originale complète, actes et séances
  préparées, arcs liés, PNJ, lieux, pistes multiples, réactions, conséquences et fins. Une
  séance avec un titre seul ne suffit pas. Les ateliers sont des scènes dans un acte
  **« ATELIERS DE RECETTE — hors fiction »** de cette même Trame. Nouveau lot dans
  `output/campagnes-tests/<jeu>/`, avec sous-dossier de titre/révision si nécessaire pour
  conserver les livraisons existantes. Aucun scénario publié copié.
- **Les trois joueurs existants**, jamais recréés : Thomas D. `p-1`, Marie C. `p-2`, Lucas R.
  `p-3` (`outils/campagnes-de-recette/cthulhu-hack-joueurs.json`, issu de l'export que David a
  fourni). Les nouveaux PJ s'y rattachent ; les anciens sont conservés.
- **Le pilote réel** comme dépendance : le dernier de `Export Dirvers/corriges/`, dont la
  version et le gabarit sont **vérifiés par `assert`** au début du générateur. S'il manque,
  chercher une dépendance livrée autorisée ou son générateur versionné, expliquer la provenance,
  ne pas inventer le pilote ni lire les campagnes personnelles.
- **Des médias originaux** : SVG schématiques (cartes, cartouches, documents) et quelques WAV
  synthétiques (`archives-de-recette.mjs` : `lignesSVG`, `signalWav`, `atelierArchives`).
- **Les modules du jeu** préparés par leurs **vraies fonctions** (`<jeu>-modules.mjs` : par
  exemple `creerConflitDune`, `commanderConflitDune`, `validerConflitDune`) — jamais un état écrit
  à la main. Pas de module inventé pour simuler une fonction absente.
- **Un cahier de cas humains** (`<jeu>-recette.mjs` : geste, résultat attendu) et le CSV des
  résultats ; les cas restent **NON TESTÉS par David** tant qu'il ne les a pas joués.
- **ETATS-DE-REFERENCE.md** : repères d'acte/scène/personnage, cibles/champs d'essai et valeurs
  initiales, restauration locale native vérifiée ou manuelle. PJ principaux et personnages
  supplémentaires `[RECETTE]` ont des rôles séparés, dans la même campagne. **Nexus Remplacer
  réimporte toute la campagne**, pas un atelier ; ne pas le proposer comme reset partiel.
- Les tables Table-OS, s'il y en a, s'importent à part, sans toucher aux tables de règles.

## La chaîne, dans l'ordre

Les fichiers d'un jeu : `<jeu>.mjs` (générateur), `<jeu>-scenario.mjs`, `<jeu>-modules.mjs`,
`<jeu>-recette.mjs`, `<jeu>.test.ts` et `vitest-<jeu>.config.mts`, `emballer-<jeu>.mjs`, et
`e2e/campagneDeRecette<Jeu>.spec.ts`.

Ces noms et les générateurs historiques sont des repères d'implémentation : pour une nouvelle
création, adapter la sortie à **un seul .gmos**, conserver les anciens lots et ne pas exécuter
un générateur à trois campagnes par habitude. Le nombre de cas et personnages découle de la
couverture, pas des anciens 3 + 9 + 9 PJ.

1. `node outils/campagnes-de-recette/<jeu>.mjs`
2. `npx vitest run --config outils/campagnes-de-recette/vitest-<jeu>.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/<jeu>/verification-archives.json`
3. Si autorisé : `npm run build` puis `npx playwright test e2e/campagneDeRecette<Jeu>.spec.ts`
   (Electron jetable : import natif ajoutant une seule campagne, anciennes campagnes/PJ conservés,
   trois Hub et jets reçus ; remise en état locale d'un essai préservant une note de fiction
   et une valeur du PJ principal après rechargement). Sinon, preuves NON EXÉCUTÉES.
4. `node outils/campagnes-de-recette/verifier-visuels.mjs <jeu>` (SVG et WAV décodés hors ligne ;
   ajouter le jeu à la liste acceptée) — puis **regarder les images**.
5. `node outils/campagnes-de-recette/emballer-<jeu>.mjs` : il **refuse** un rapport incomplet ou
   portant les empreintes SHA-256 d'une autre génération. Il écrit `RAPPORT-DE-VERIFICATION.md`,
   `ANOMALIES-CONNUES.md` et le ZIP.

## Les pièges payés

- Node 24 : importer les modules TypeScript de l'application **dynamiquement, après**
  `import './charger-typescript.mjs'` — un import statique est lié avant le hook de résolution.
- `DATE_RECETTE` est un instant fixe commun (25/10) : les manifestes restent stables d'une
  génération à l'autre.
- Hub : fermer l'overlay de fiche par `getByTitle('Fermer la fiche')` (son nom accessible est
  « Retour ») ; Bibliothèque en mode **Atelier** pour les imports ; activer la séance
  **après** l'import, sinon la navigation est renvoyée au cockpit.
- PowerShell lit l'apostrophe typographique comme un guillemet : ne pas l'insérer dans une chaîne
  simple ; écrire un script Node par here-string avec `$OutputEncoding` en UTF-8.
- **GM-05** est corrigé et validé le 01/11 (§ 200). Chaque nouvelle recette vérifie les trames
  avec un marqueur fictif ; ne supposer ni sa persistance ni une immunité future. Les anciens
  rapports en échec restent historiques. Ne pas corriger le code applicatif en passant.
- ⛔ Jamais le profil, les sauvegardes ni le corpus de David : profil, corpus, sauvegardes et ports
  **jetables**, réseau externe coupé.

## Livrer

Le document `2026-MM-JJ-campagne-recette-<jeu>.md` (Livraison et import, ateliers, modules, Vérifications,
Reproduire), un § au registre et sa ligne, la ligne du jeu dans la synthèse des pilotes — voir le
skill **`clore-la-session`**. Dire à David : pilote si nécessaire, **unique campagne .gmos**,
tables facultatives ; où ouvrir les ateliers dans sa Trame et quel cahier/état de référence suivre.
