# Les chemins des livres — plan du 06/11/2026

**Demande de David, le 06/11/2026**, après la transcription du bestiaire du livre de base d'Alien :
*« est-ce qu'il ne serait pas utile de pouvoir garder le chemin vers les PDF des livres de bases et
des suppléments dans GM-OS ? »*, puis *« je n'ai pas envie de recopier mes livres un peu partout,
donc un chemin pour moi est une bonne idée »*. Il a demandé le plan complet avant de commencer.

**Statut** : plan validé le 06/11/2026. David a tranché les quatre choix (§ « Décisions de David »).
**Étapes 0, A et B livrées le 06/11** (registre § 220) : seize jeux recensés, dix-huit livres ; le
registre lu par GM-OS ; la carte « PDF du livre » de la Forge. Essai de David attendu ; ensuite C, D, E.

## Le principe : un chemin, jamais une copie

- GM-OS garde **où est** le livre, pas le livre. Les PDF restent là où David les range (le NAS
  `\\CLOUDDAVID\Media\Jeux de Rôle\…`, OneDrive, un disque), et un seul endroit dit où.
- ⛔ **Jamais de PDF dans `docs/`** : l'Oracle indexe les `.pdf` de ce dossier
  (`EXTENSIONS_INDEXEES` d'`electron/RAGEngine.ts`). Le livre entrerait dans ses réponses.
- ⛔ Ni dans `Export Dirvers/`, ni dans un pilote, ni dans une campagne : les deux voyagent.
- Les agents (Claude Code, Codex) qui doivent lire un livre en tirent une copie de travail
  **temporaire**, dans leur scratchpad. Elle sert pour une session et n'entre jamais dans le dépôt.
  Ils la font par PowerShell, `Copy-Item -LiteralPath`, parce que Python lit mal un chemin réseau
  accentué.

## Ce que ça apporte

1. **À la table** : les créatures du bestiaire, les objets du catalogue et les fiches de règles
   portent déjà leur page imprimée (`source.page`, les pages résolues par l'index du livre). Avec
   le chemin, un bouton **« Livre, p. 309 »** ouvre le PDF à la bonne page.
2. **Pour les agents** : le chemin et le **décalage** entre page PDF et page imprimée, au même
   endroit, pour chaque livre. Le décalage change d'un livre à l'autre (Alien : PDF = imprimée + 3 ;
   Barbarians : + 2 ; Blade Runner : − 4). C'est l'erreur la plus fréquente quand on cite une page.
3. **Pour la Forge** : relire ou transcrire un livre part du bon fichier, sans le chercher.

## Le modèle

Un registre par jeu, **`docs/systems/<jeu>/livres.json`**, à côté de `supplements/supplements.json`.
Le `.json` n'est pas indexé par l'Oracle (seuls `.md`, `.txt`, `.pdf` et `.jsonl` le sont).

```json
[
  {
    "cle": "jeu",
    "titre": "ALIEN, le jeu de rôle",
    "chemin": "\\\\CLOUDDAVID\\Media\\Jeux de Rôle\\03. Futur\\1. Space Opera\\Aliens\\ALIEN (Arkhane Asylum)\\ALIEN_le_jeu_de_rôle.pdf",
    "decalage": 3,
    "edition": "française (Arkhane Asylum)",
    "notes": "Texte doublé par endroits (deux couches) ; tableaux à relever par position."
  },
  { "cle": "colonial-marines", "titre": "Colonial Marines Operations Manual", "chemin": "…", "decalage": 3 }
]
```

- **`cle`** : `jeu` pour le livre de base, sinon le slug du supplément (`supplements.json`). C'est
  la clé qu'utilisent déjà le catalogue et le bestiaire (`LivreACataloguer.cle`).
- **`decalage`** : page PDF = page imprimée + `decalage`. Un nombre, peut être négatif.
- **`errata`** (facultatif) : le chemin de l'errata, quand il est à part (Nephilim, Alien 2021).
- **Plusieurs livres pour une même clé** : Rêve de Dragon a deux volumes de base (Voyageurs,
  Haut-Rêve). On choisit alors l'entrée dont le nom de fichier est celui que cite l'en-tête
  `sources:` de la fiche ; à défaut, la première entrée.
- **Retrouver le livre d'une source** : par la fiche (`source.fiche`), et non par le titre.
  `docs/systems/<jeu>/rules/…` mène au livre de base, `…/supplements/<slug>/rules/…` au supplément.
  Le titre (`source.livre`) n'est qu'un libellé, il peut varier.

Module pur `src/modules/forge/rules/livres.ts` : `lireLesLivres(brut)` (validation, champs
inconnus ignorés), `livreDeLaFiche(cheminDeFiche, livres)`, `pageDuPdf(livre, pageImprimee)`.

## Les étapes

### Étape 0 — le recensement (sans code)

- Le registre de chaque jeu rempli avec David : il donne le chemin, je mesure le décalage dans le
  PDF (la page dont le pied imprime « 291 », Alien : PDF 294).
- **Alien, fait le 06/11** : `docs/systems/alien/livres.json`, avec le livre de base (décalage + 3,
  mesuré ; errata du 04/11/2021) et *Colonial Marines* (`ALN-Marines Coloniaux_FR.pdf`, + 3).
- **Fait le 06/11 (GM-OS fermé, sans code)** : `docs/systems/<jeu>/livres.json` pour seize jeux,
  dix-huit livres et trois errata, tous vérifiés sur le NAS. Chaque décalage a été **mesuré** sur
  les numéros imprimés en pied de page, page par page ; la mesure retrouve le + 3 d'Alien. Les
  copies de travail des livres ont été effacées après la mesure.

  | Jeu (dossier) | Livre | Décalage |
  | --- | --- | ---: |
  | `alien` | ALIEN, le jeu de rôle (+ errata 2021) ; Colonial Marines | + 3 ; + 3 |
  | `barbarian` | Barbarian of Lemuria-vf | + 2 |
  | `blade-runner` | BRN-01_LivreDeRegles (texte doublé) | + 4 |
  | `coc` | COC2_01_Livre_de_Regles_web_v0 | + 3 |
  | `crime` | Crimes 2 - Manuel de l'Enquèteur | + 2 |
  | `cthulhu hack` | Cthulhu Hack, réédition | + 1 |
  | `degenesis` | Degenesis - KATHARSYS_OCR (seule version avec du texte) | + 1 |
  | `dune` | Dune_Aventures_dans_l'Imperium_BQ | + 7 |
  | `nephilim` | Livre 0 - Quintessence (+ errata V1.3) | + 1 |
  | `noc` | 3938_noc01_ldb_light | + 2 |
  | `reves de dragons` | Livre des Voyageurs 2.3 ; Livre du Haut-Rêve 2.3 | + 1 ; − 166 |
  | `runequest` | DCRQK02 - Livre de Base (+ errata) | + 1 |
  | `shadowrun-anarchy` | anarchy_v2_vf_web_v0 | + 2 |
  | `star-trek` | Star Trek Adventures, 2e édition | + 4 |
  | `symbaroum` | Symbaroum - Livre de Base | + 2 |
  | `torg` | Torg Eternity - Livre de regles | + 2 |

- **Racine retenue : le NAS** (`\\CLOUDDAVID\Media\Jeux de Rôle\`). Le lecteur `Z:` dépend
  de la machine. Les copies OneDrive (Barbarians, Blade Runner, NOC, Dune) sont des doublons.
- **À confirmer par David** :
  - **Rêve de Dragon** : le corpus cite la **2.2**, et le NAS n'a que la **2.3**. Les pages citées
    peuvent ne plus correspondre.
  - **NOC** : le corpus cite « NOC Livre de Base.pdf », introuvable sous ce nom. Retenu :
    `3938_noc01_ldb_light-ylomzz.pdf` (« ldb » = livre de base).
  - **Nephilim** : « Nephilim Légende - Système de règles », cité par le corpus, est introuvable.
  - **Shadowrun Anarchy** : la v0, celle du corpus, est retenue. La v1 a servi aux travaux SR-A1
    à A3 ; les deux ont le même décalage.
  - **Les suppléments** : seul *Colonial Marines* est déclaré dans GM-OS. Sur le NAS, d'autres
    livres sont des candidats : le Bestiaire de Glorantha (RuneQuest), les Codex de Nephilim.
- **Pas de registre** pour `2d20` et `srd-yze` : ce sont des SRD, absents du NAS sous leur nom.

### Étape A — le registre lu par GM-OS

- `livres.ts` et ses essais.
- Lecture par le corpus existant (le même chemin que `supplements.json`). Écriture par un IPC
  dédié, qui n'écrit que `docs/systems/<jeu>/livres.json` (nom de jeu validé, comme `cheminDesTables`).
- Contrôle : une `cle` inconnue (pas de supplément de ce nom), un chemin qui n'est pas un `.pdf`,
  un décalage qui n'est pas un entier → avertissements.

### Étape A — livrée le 06/11

`src/modules/forge/rules/livres.ts` (pur, partagé avec le processus principal) et
`cheminDesLivres` dans `electron/corpusSysteme.ts`. Le registre se lit et s'écrit par `readDoc` /
`writeDoc`, comme `supplements.json` : pas de canal dédié à l'écriture. Essais : `livres.test.ts`.

### Étape B — livrée le 06/11

Maquette validée par David (*« je valide »*, `stitch/livres/pdf-du-livre.png`).

- `PdfDuLivre.tsx` sous `ChoixDuLivre` (Forge, Atelier de règles) ; `useLivresDuJeu.ts`.
- `electron/cheminsDesLivres.ts` : `livres:choisir`, `livres:verifier`, `livres:proposer-decalage`,
  en lecture seule et seulement sur un `.pdf`. `lirePagesPdf` est dans `extractionPdf.ts`. La
  mesure lit 60 pages réparties dans le livre et prend 1 à 3 s ; elle retrouve le décalage des
  dix-huit livres du registre.
- Deux écarts à la maquette, imposés par le panneau réel (≈ 250 px) : le nom du fichier sous le
  champ, et deux champs étiquetés au lieu de la phrase. Capture : `captures/forge-pdf-du-livre.jpg`.

### Étape B — le dessin prévu

Dans la **Forge**, panneau de gauche, là où David choisit déjà le livre (base ou supplément) :

- un champ **« PDF du livre »**, rempli par **« Choisir… »** (`dialog.showOpenDialog`, filtre `.pdf`)
  ou collé à la main ;
- **« Vérifier »** : le fichier répond, il se lit, et on affiche son nombre de pages. Sinon un
  message dit pourquoi (« livre injoignable : le NAS ne répond pas ») ;
- **le décalage**, avec une aide : *« La page imprimée ___ est la page ___ du PDF »*. GM-OS fait la
  soustraction. Il peut aussi proposer le décalage en cherchant un numéro de page imprimé dans le
  pied des pages (`extraireTextePdf`, déjà dans `electron/extractionPdf.ts`) : une proposition, que
  David confirme, jamais une écriture silencieuse.

### Étape C — ouvrir le livre à la page

- IPC **`livres:ouvrir {jeu, cle, page}`**. Le processus principal lit lui-même le chemin dans le
  registre : **aucun chemin ne vient de l'interface**. Il n'accepte que `.pdf`, vérifie que le
  fichier répond, et calcule la page PDF (`page + decalage`).
- Une **fenêtre de lecture** Electron (lecteur PDF de Chromium, `#page=N`), sans accès à Node.
  L'ouverture par le système (`shell.openPath`) ne sait pas viser une page : elle reste le repli,
  et l'écran dit alors « ouvert à la première page ».
- Livre absent ou injoignable : un message, jamais un échec muet.

### Étape D — les boutons « Livre, p. N »

- **Bestiaire** : l'éditeur du pilote (une ligne par créature) et l'onglet *Livre* de l'atelier
  des adversaires (`CreaturesDuLivre.tsx`).
- **Catalogue d'équipement** : la ligne de l'objet, et la fiche Alien quand on prend un objet.
- **Fiches de règles** : l'atelier de règles de la Forge, à côté des pages qu'une fiche cite.
- Le bouton n'apparaît que si le livre a un chemin. Sinon : « Ajouter le PDF de ce livre ».
- Plus tard, à la demande : les citations de l'Oracle.

### Étape E — les agents

- Les skills `relire-un-corpus` et `finir-un-pilote` disent de lire `docs/systems/<jeu>/livres.json`
  avant de demander où est le livre, et d'en prendre le décalage.
- La passation Claude ↔ Codex (`2026-10-04-passation-claude-codex.md`) le mentionne.
- Les mémoires qui notent un emplacement de livre renvoient au registre, qui fait foi.

## Ce qui ne change pas

- Les **fiches relues font foi** pour GM-OS. Le PDF sert à vérifier et à lire, pas de source au jeu.
- Aucun livre n'est lu ni indexé en tâche de fond : GM-OS l'ouvre quand on le lui demande.
- Le carnet NotebookLM garde son rôle (Forge, Oracle).

## Vérifications prévues

- Essais purs (`livres.ts`) : lecture, livre d'une fiche, page PDF, contrôles.
- Essais de l'écran (champ, vérification, aide au décalage) et du bouton (présent ou non).
- IPC : chemin refusé s'il ne vient pas du registre, extension refusée, livre injoignable.
- `npx tsc -b`, eslint, `npx vitest run --maxWorkers=4` sur les fichiers touchés ; e2e d'Alien.
- Essai de David : enregistrer le PDF d'Alien, cliquer « Livre, p. 309 » sur le Drone.

## Risques

- **Le NAS éteint** : tout doit marcher sans lui, le bouton dit seulement que le livre ne répond pas.
- **Un décalage qui change dans un livre** (encarts, pages non numérotées) : un seul décalage par
  livre d'abord. Des exceptions par plage de pages seulement si un livre le demande.
- **Le chemin dans le dépôt** : `livres.json` est versionné et poussé, avec le nom du NAS et la
  structure des dossiers de David. C'est le choix 1 ci-dessous.

## Décisions de David — 06/11/2026

*« 1. un fichier dans le dépôt, 2. dans la Forge, 3. dans la fenêtre intégrée, 4. Ok avec l'ordre »*.
Les quatre recommandations sont retenues :

1. le registre est **`docs/systems/<jeu>/livres.json`**, dans le dépôt ;
2. on l'enregistre **dans la Forge**, panneau des livres ;
3. on l'ouvre **dans la fenêtre de lecture intégrée**, à la page ;
4. l'ordre est **0, puis A + B, C + D, E**.

Les options proposées, pour mémoire :

1. **Où vit le registre.** *Recommandé* : `docs/systems/<jeu>/livres.json`, dans le dépôt. Les
   agents le lisent, git le sauvegarde, il suit les suppléments. *Autre voie* : un fichier local de
   GM-OS (`%APPDATA%\gm-os-v5\`). Le chemin ne quitte pas la machine, mais les agents ne le lisent
   pas, puisqu'ils ne touchent pas aux données de David.
2. **Où on l'enregistre.** *Recommandé* : la Forge, panneau des livres. *Autre* : les Paramètres.
3. **Comment on l'ouvre.** *Recommandé* : la fenêtre de lecture intégrée, à la page. *Autre* :
   l'application PDF de Windows, sans viser la page.
4. **L'ordre.** *Recommandé* : 0, puis A + B, C + D, E. L'étape 0 sert tout de suite aux agents.
