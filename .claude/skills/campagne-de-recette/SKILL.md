---
name: campagne-de-recette
description: Fabriquer, vérifier et livrer une campagne de recette GM-OS pour un pilote de jeu — enquête originale et laboratoires en archives .gmos, rattachés aux trois joueurs existants, avec médias, modules du jeu, tables, cahier de cas et emballage contrôlé (outils/campagnes-de-recette/). À utiliser quand David demande une « campagne de test » ou « de recette » pour un jeu, des PJ et PNJ pour essayer un pilote, de « créer des modules si nécessaire » pour une campagne d'essai, ou de reprendre ou rejouer un lot de recette existant.
---

# Une campagne de recette

Six jeux en ont une : Cthulhu Hack, NOC, ALIEN, Rêve de Dragon, Dune, Nephilim (registre
§ 178 à 183). Ces lots sont l'œuvre de **Codex** : relire ses notes avant d'en toucher un, et
un seul écrivain par fichier. Le document de chaque jeu fait foi —
`documentation/Planning/2026-10-2x-campagne-recette-<jeu>.md`, section **« Reproduire »** ; le
document fondateur est `2026-10-25-campagnes-de-recette.md` (Cthulhu Hack). Le modèle le plus
complet à imiter est **Dune** (`dune*.mjs`, § 182).

## Ce qu'une recette contient

- **Trois archives** `.gmos` dans `output/campagnes-tests/<jeu>/` : `01-…` une **enquête
  originale** (fiction inventée, jamais tirée d'un scénario publié), `02-…` et `03-…` des
  **laboratoires** hors fiction, un PJ par cas limite à éprouver (résultats de tables déjà tirés,
  seuils, défaites…).
- **Les trois joueurs existants**, jamais recréés : Thomas D. `p-1`, Marie C. `p-2`, Lucas R.
  `p-3` (`outils/campagnes-de-recette/cthulhu-hack-joueurs.json`, issu de l'export que David a
  fourni). Les nouveaux PJ s'y rattachent ; les anciens sont conservés.
- **Le pilote réel** comme dépendance : le dernier de `Export Dirvers/corriges/`, dont la
  version et le gabarit de fiche sont **vérifiés par `assert`** au début du générateur.
- **Des médias originaux** : SVG schématiques (cartes, cartouches, documents) et quelques WAV
  synthétiques (`archives-de-recette.mjs` : `lignesSVG`, `signalWav`, `atelierArchives`).
- **Les modules du jeu** préparés par leurs **vraies fonctions** (`<jeu>-modules.mjs` : par
  exemple `creerConflitDune`, `commanderConflitDune`, `validerConflitDune`) — jamais un état écrit
  à la main. Pas de module inventé pour simuler une fonction absente.
- **Un cahier de cas humains** (`<jeu>-recette.mjs` : geste, résultat attendu) et le CSV des
  résultats ; les cas restent **NON TESTÉS par David** tant qu'il ne les a pas joués.
- Les tables Table-OS, s'il y en a, s'importent à part, sans toucher aux tables de règles.

## La chaîne, dans l'ordre

Les fichiers d'un jeu : `<jeu>.mjs` (générateur), `<jeu>-scenario.mjs`, `<jeu>-modules.mjs`,
`<jeu>-recette.mjs`, `<jeu>.test.ts` et `vitest-<jeu>.config.mts`, `emballer-<jeu>.mjs`, et
`e2e/campagneDeRecette<Jeu>.spec.ts`.

1. `node outils/campagnes-de-recette/<jeu>.mjs`
2. `npx vitest run --config outils/campagnes-de-recette/vitest-<jeu>.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/<jeu>/verification-archives.json`
3. `npm run build` puis `npx playwright test e2e/campagneDeRecette<Jeu>.spec.ts` (Electron jetable :
   imports natifs, remplacement des laboratoires, trois Hub, jets reçus par le meneur)
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
  « Retour ») ; Bibliothèque en mode **Atelier** pour les remplacements ; activer la séance
  **après** les imports, sinon la navigation est renvoyée au cockpit.
- PowerShell lit l'apostrophe typographique comme un guillemet : ne pas l'insérer dans une chaîne
  simple ; écrire un script Node par here-string avec `$OutputEncoding` en UTF-8.
- **GM-05** (secrets de séance `gmSecrets` transmis aux tablettes, § 1 bis) est un défaut
  transversal connu : chaque recette le pose en marqueur fictif (`SECRET_MJ_<JEU>_RECETTE`) et le
  garde dans ses anomalies. Ne pas le corriger en passant ; c'est un chantier à part, GM-OS fermé.
- ⛔ Jamais le profil, les sauvegardes ni le corpus de David : profil, corpus, sauvegardes et ports
  **jetables**, réseau externe coupé.

## Livrer

Le document `2026-MM-JJ-campagne-recette-<jeu>.md` (Livraison et import, modules, Vérifications,
Reproduire), un § au registre et sa ligne, la ligne du jeu dans la synthèse des pilotes — voir le
skill **`clore-la-session`**. Dire à David quel fichier importer en premier et quel cahier suivre.
