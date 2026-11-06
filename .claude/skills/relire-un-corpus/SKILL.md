---
name: relire-un-corpus
description: Relire les fiches de règles d'un jeu (docs/systems/<jeu>/rules/*.md, « relu: false ») contre le livre PDF et son errata, et lire un livre de jeu de rôle sans se tromper — extraction du texte, couches doublées, décalage des pages, tables lues en image. À utiliser dès qu'il faut relire ou corriger un corpus, vérifier une règle ou une page dans un livre de David, citer une table, ou quand un pilote se fonde sur une règle douteuse ; aussi quand le carnet NotebookLM et le livre semblent se contredire.
---

# Relire un corpus contre le livre

Le corpus d'un jeu (`docs/systems/<jeu>/rules/*.md`) est généré par NotebookLM, puis relu. Il
nourrit **l'Oracle** (tout `.md` de `docs/` entre dans ses réponses) et **la Forge** (qui en
dérive les pilotes) : une règle fausse ici devient un jet faux à la table.

⭐ **Le livre et son errata font foi, jamais le carnet.** Le carnet a déjà inventé quatre époques
de Nephilim et « un à trois degrés » de Khaïba, et s'est trompé sur la douleur de Symbaroum.
Avant de croire une liste du carnet, la compter contre la source.

## 1 · Trouver et lire le livre

- ⭐ **Le registre des livres d'abord : `docs/systems/<jeu>/livres.json`** (depuis le 06/11/2026,
  [plan](../../../documentation/Planning/2026-11-06-chemins-des-livres.md)). Chaque entrée donne le
  `chemin` du PDF (le NAS `\\CLOUDDAVID\Media\Jeux de Rôle\…`), son `decalage` (page PDF = page
  imprimée + décalage), l'`errata` et des `notes` (texte doublé, tables à lire en image). La clé
  `jeu` est le livre de base, sinon le slug du supplément. **Le registre fait foi** : ne demander
  à David que si le jeu n'a pas de registre, ou si le fichier ne répond pas — puis l'y ajouter
  (Forge › Atelier de règles › PDF du livre, ou le `.json` à la main). Un dossier de JPG n'est pas
  le livre.
- **Lire un livre du NAS** : en tirer une copie de travail **temporaire** dans le scratchpad, par
  PowerShell (`Copy-Item -LiteralPath`, Python lit mal un chemin réseau accentué), lancer Python en
  `-I`, puis **effacer la copie**. ⛔ Jamais de PDF dans `docs/` (l'Oracle indexe les `.pdf`), ni
  dans le dépôt.
- Extraire le texte dans un dossier de travail (`scratch/<jeu>-audit/livre.txt`), avec un marqueur
  par page (`--- PAGE PDF n ---`). Outils présents : `pypdf`, `pdftotext`, `pdfjs-dist` et
  `@napi-rs/canvas` (rendu en image) ; pas `pdftoppm`.
- **Vérifier d'abord que le texte ne double pas** : certains PDF ont deux couches (Blade Runner),
  et pdfjs rend chaque fragment deux fois. Garder la première occurrence par position arrondie.
- **Le décalage des pages** se mesure, il ne se devine pas : il est dans le registre (Alien + 3,
  Barbarians + 2, Blade Runner + 4, Rêve de Dragon 2.3.1 + 1, Dune + 7). Pour un livre neuf,
  `mesurerLeDecalage` (`src/modules/forge/rules/livres.ts`, le « Proposer depuis le livre » de la
  Forge) le retrouve sur les dix-huit livres relevés. Calculer chaque page citée depuis le marqueur
  qui précède la ligne ; une fois, six pages citées étaient fausses. Les fiches citent la page
  **imprimée**.
- ⛔ **Une table se lit en image** : `pdftotext -layout` mélange les colonnes (la table des
  rencontres de Rêve de Dragon rangeait les plaines avec les cités). Rendre la page (pdfjs +
  canvas) et la regarder, ou lire les mots à leur position (`pypdf`, `visitor_text`).

## 2 · Relire une fiche

Pour chaque affirmation de la fiche : la trouver dans le livre, avec sa page imprimée.

- **Chercher dans le livre ENTIER avant de retirer une affirmation « introuvable ».** Les règles
  sont éparpillées : résumé en tête de chapitre, encadrés, chapitre du meneur, talents. Sur Dune,
  deux règles vraies ont failli être retirées ; elles étaient p. 105, 142, 147 et 226. Chercher
  avec plusieurs formulations.
- **Ce qu'un scénario fixe n'est pas une règle générale** (« le ver arrive après trois rounds »
  venait de l'aventure d'introduction). **Un talent n'est pas une règle commune. Le roman n'est
  pas le livre.**
- **Lire la source que cite la fiche** (`sources:` dans l'en-tête) : c'est l'édition que voit le
  carnet. Colonial Marines (02/11) citait l'édition française quand on relisait l'anglaise.
- **Les noms d'origine entre parenthèses** (« Fusilier (Rifleman) ») sont traduits à rebours par
  le carnet, qui ne voit qu'une édition : les vérifier contre l'autre. Sur Colonial Marines, une
  soixantaine étaient faux, dont deux talents intervertis.
- **Un en-tête de tableau peut mentir** : le tableau français des explosifs titrait « BONUS » sa
  colonne de dégâts, et la fiche avait suivi. Confronter les valeurs à leur sens, ou à l'autre
  édition ; un texte doublé (« 11 200 $200 $ ») se lit « 1 | 200 $ », pas « 1 200 $ ».
- Réparer les bégaiements de génération (« de de de deux », « à de cinq ») en une passe Python
  (`re`), pas en `perl` sans `use utf8` (les accents du motif ne correspondent plus).

**Marquer la fiche relue :**

- Dans l'en-tête, `relu: false` → `relu: true`.
- ⛔ **Ne pas toucher `empreinte`.** Elle couvre le corps tel que généré : si le corps change,
  l'écart marque la fiche **« corrigée »** (`empreinteDeLaFiche.ts`), ce qui la protège d'une
  reforge qui l'écraserait en place. Recalculer l'empreinte effacerait cette protection.
- En pied, une note **brève**, datée et paginée, sur le modèle :
  `*Relu le AAAA-MM-JJ contre le livre (PDF = imprimée + 2) ; corrigé : …, retiré : …, ajouté : … (p. 148-154).*`
  ou `… ; conforme (p. 49-53).`

## 3 · Après la relecture

- ⚠️ **Les notes de relecture pèsent sur l'invite de la Forge** :
  `npx vitest run src/modules/forge/rules/corpusDerivable.test.ts --maxWorkers=4`. Chaque groupe de
  fiches est borné (~21 000 caractères) ; Dune l'a dépassé de 99 le 24/10. Raccourcir les notes
  plutôt que de relever la borne.
- Compter et consigner : « relu 16/16, onze fiches corrigées », dans le § du registre et dans la
  ligne « Corpus et contrôles de la Forge » de
  `documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md`, qui tient le compte des
  fiches encore `relu: false` par jeu.
- Une règle trouvée qui contredit le pilote est un défaut du pilote : la porter au skill
  **`finir-un-pilote`**, pas la corriger en passant.
