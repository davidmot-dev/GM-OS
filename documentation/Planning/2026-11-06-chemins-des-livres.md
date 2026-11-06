# Les chemins des livres — plan du 06/11/2026

**Demande de David, le 06/11/2026**, après la transcription du bestiaire du livre de base d'Alien :
*« est-ce qu'il ne serait pas utile de pouvoir garder le chemin vers les PDF des livres de bases et
des suppléments dans GM-OS ? »*, puis *« je n'ai pas envie de recopier mes livres un peu partout,
donc un chemin pour moi est une bonne idée »*. Il a demandé le plan complet avant de commencer.

**Statut** : plan validé le 06/11/2026. David a tranché les quatre choix (§ « Décisions de David »).
**Étapes 0, A et B livrées le 06/11** (registre § 220) : seize jeux recensés (dix-sept livres
depuis le livre complet de Rêve de Dragon, le 06/11) ; le registre lu par GM-OS ; la carte « PDF
du livre » de la Forge. Les quatre points à confirmer sont réglés avec David.
**Étapes C et D livrées le 06/11** : la fenêtre de lecture à la page et les boutons « Livre, p. N ».
**Étape E livrée le 06/11** : skills, passation, mémoires. **Tout le plan est livré, essayé et validé
par David le 06/11** (*« ok j'ai essayé, c'est bon »*).

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
  | `reves de dragons` | Reve_de_Dragon_2.3.1, livre complet (avant le 06/11 : Voyageurs 2.3, + 1 ; Haut-Rêve 2.3, − 166) | + 1 |
  | `runequest` | DCRQK02 - Livre de Base (+ errata) | + 1 |
  | `shadowrun-anarchy` | sran2_01anarchyv2_web_v1 | + 2 |
  | `star-trek` | Star Trek Adventures, 2e édition | + 4 |
  | `symbaroum` | Symbaroum - Livre de Base | + 2 |
  | `torg` | Torg Eternity - Livre de regles | + 2 |

- **Racine retenue : le NAS** (`\\CLOUDDAVID\Media\Jeux de Rôle\`). Le lecteur `Z:` dépend
  de la machine. Les copies OneDrive (Barbarians, Blade Runner, NOC, Dune) sont des doublons.
- **Réglés avec David le 06/11** (les quatre points qui restaient à confirmer) :
  - **Rêve de Dragon** : le corpus citait la 2.2, absente du NAS. David donne le **livre complet
    2.3.1** (`Reve_de_Dragon_2.3.1.pdf`, 510 pages), qui remplace les deux volumes 2.3. Sa
    numérotation est continue : un seul décalage, **+ 1** (58 pages concordantes sur 60). Le
    corpus avait été relu le 24/10 contre la 2.3.1 et cite ces pages-là (Haut-Rêve p. 181-193) ;
    seules ses lignes `sources:` nomment encore la 2.2. Le choix d'un volume par les `sources:`
    reste dans `livres.ts` pour un autre jeu, son essai garde l'ancien registre en exemple.
  - **NOC** : `3938_noc01_ldb_light-ylomzz.pdf` est bien le livre de base, confirmé par David.
  - **Nephilim** : David retient *Quintessence* et son errata V1.3 comme livre du jeu ; « Nephilim
    Légende - Système de règles », cité par le corpus, n'est pas un autre PDF à enregistrer.
  - **Shadowrun Anarchy** : la **v1** (`sran2_01anarchyv2_web_v1.pdf`), choix de David, celle des
    travaux SR-A1 à A3 ; décalage **+ 2** remesuré (41 pages sur 60), le même que la v0 du corpus.
  - Le registre compte désormais **dix-sept livres** pour seize jeux.
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

### Étapes C et D — livrées le 06/11

David : *« commit fait C & D »* ; GM-OS fermé ; **sans maquette Stitch**, sur sa décision (pas
d'écran neuf : la fenêtre est la visionneuse PDF de Chromium, le bouton prend la place du « p. N »).

- **Deux essais jetables avant le code**, avec le livre d'Alien sur le NAS :
  - la visionneuse d'Electron 34 ouvre un PDF réseau (`file://clouddavid/…`) à `#page=312` ;
  - ⚠️ changer seulement `#page=` d'une fenêtre déjà ouverte **ne déplace pas** la visionneuse.
    Chaque ouverture porte donc une adresse distincte (`?ouverture=N`) : le livre se recharge et la
    page est prise.
- **Étape C** — `livres:ouvrir {racine, cle, rang?, page?}` (`electron/cheminsDesLivres.ts`) :
  - la demande est contrôlée (`demandeDOuvertureValide` : `systems/<jeu>`, une clé, une page
    entière) ; le chemin est **relu dans le registre**, jamais reçu de l'écran ; seul un `.pdf`
    existant s'ouvre ;
  - une seule fenêtre de lecture (sans préchargement, sandbox, nouvelles fenêtres refusées),
    fermée avec celle du meneur pour ne pas retenir GM-OS ;
  - repli : `shell.openPath`, à la première page, et l'écran dit quelle page du PDF chercher.
- **Défaut trouvé à l'e2e, corrigé** : dans une partition **en mémoire** (`livres`), la
  visionneuse se charge mais ne peint rien (fenêtre blanche). Bissection par essais jetables : la
  partition seule en est la cause ; **`persist:livres`** peint la page.
- **Étape D** — `LivreALaPage.tsx`, un bouton « Livre, p. N » ; `livreDeLaSource` trouve le livre par
  la clé, la fiche relue (`source.fiche`), le titre, ou le livre de base seul — sinon pas de bouton,
  plutôt que d'ouvrir le mauvais livre. Branché dans :
  - l'atelier de règles de la Forge (sections citées résolues par l'index) ;
  - l'éditeur du pilote, Bestiaire et Équipement (fiche dépliée : la ligne est déjà un bouton) ;
  - l'onglet *Livre* de l'atelier des adversaires ;
  - « Prendre dans le catalogue » (ligne de l'objet).
  - Sans PDF : la page reste du texte, avec une infobulle qui dit où l'ajouter.
- **Vérifié** : `livres.test.ts` (15), `LivreALaPage.test.tsx` (4), `cheminsDesLivres.test.ts` (7) ;
  3 509 essais (Forge, combat, bestiaire, équipement, écrans de session, processus principal) ;
  `tsc -b`, eslint, construction ; e2e `livresDuJeu` (2) : dans la vraie application, la p. 309
  ouvre la fenêtre à la page 312, capturée depuis le processus principal (Playwright rend blanche
  la visionneuse, qui tourne à part) : `captures/livre-a-la-page.jpg`.
- **Reste** : l'essai de David ; un e2e qui clique le bouton dans un écran (il faudrait un pilote
  d'Alien dans le profil jetable) ; l'étape E.

### Étape E — les agents

- Les skills `relire-un-corpus` et `finir-un-pilote` disent de lire `docs/systems/<jeu>/livres.json`
  avant de demander où est le livre, et d'en prendre le décalage.
- La passation Claude ↔ Codex (`2026-10-04-passation-claude-codex.md`) le mentionne.
- Les mémoires qui notent un emplacement de livre renvoient au registre, qui fait foi.

**Livrée le 06/11** (David : *« fini l'étape E »*) :

- `relire-un-corpus` : le registre d'abord (« ne demander à David que si le jeu n'a pas de registre
  ou si le fichier ne répond pas, puis l'y ajouter ») ; la copie de travail temporaire remplace
  l'ancien « lire en place » ; les décalages renvoient au registre et à `mesurerLeDecalage`.
- `finir-un-pilote`, § 2 : où est le livre, et l'entrée d'un nouveau jeu ou supplément dans
  `livres.json`, qui allume les boutons « Livre, p. N ».
- Passation, § 5 « Les décisions de David » : un chemin, jamais une copie ; le registre ; la
  lecture par copie temporaire ; Rêve de Dragon 2.3.1 et Shadowrun v1.
- Mémoires de Claude Code : une mémoire « les chemins des livres » (registre, lecture, pièges de la
  fenêtre de lecture) ; les neuf mémoires qui notaient un emplacement de livre y renvoient.
  Les fichiers de Codex (`.codex/`) ne sont pas touchés : il lit les skills et la passation.

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
