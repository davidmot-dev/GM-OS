# Passation entre Claude Code et Codex — reprendre le travail de l'autre

**Écrit le 2026-10-04 par Claude Code**, à la demande de David : *« je voudrais faire reprendre la
fin des dev par Codex, peux-tu faire un document de reprise avec les consignes pour que vous
puissiez reprendre le travail de l'un et l'autre ? »*

Ce document vaut **dans les deux sens** : Codex le lit pour reprendre après Claude, Claude le lit
pour reprendre après Codex. **Il ne contient pas la liste de ce qui reste** — elle vit dans le
registre (§ 3). Il dit **comment** travailler et se passer la main sans rien perdre.

---

## 1 · Par quoi commencer — dans cet ordre

1. **[`AGENTS.md`](../../AGENTS.md)** — les interdits et leur raison. Ils priment sur tout ce qui
   suit.
2. **Ce document.**
3. **La dernière note d'état et de reprise** : le fichier `documentation/Planning/AAAA-MM-JJ-etat-et-reprise.md`
   le plus récent (au 2026-10-04 : [`2026-10-04-etat-et-reprise.md`](./2026-10-04-etat-et-reprise.md)).
4. **Le registre des chantiers** : [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md),
   section ⭐ en tête, puis la section du chantier qu'on reprend.
5. **`git status`, `git log --oneline -15`** — et lire les commits que l'autre a faits depuis la
   dernière note.

> ⛔ **Ne jamais annoncer qu'une chose « reste à faire » sans l'avoir vérifiée dans le code.** Le
> 31/08, Claude a annoncé à David cinq chantiers déjà faits, d'après une mémoire de session
> périmée. *Une note vieillit comme un document, sans `git log` pour le dire.* Citer le fichier ou
> le commit qui prouve l'état.

---

## 2 · L'état au 2026-10-04

- **Branche** : `feature/tablet-hub-pwa` (la branche principale est `main`), **poussée jusqu'à
  `215a1738`**, puis le commit qui range ce document.
- **Base saine** : `npx tsc -b` propre, **6 755 tests au vert** (519 fichiers, 1 ignoré), la série des
  captures du manuel passe (61 sur 61).
- **Copie de travail** : propre après ce commit. ⚠️ Des guides de `documentation/User Guides/`
  apparaissent parfois « modifiés » alors que leur contenu est identique : ce ne sont que les fins de
  ligne (`core.autocrlf`). Vérifier par `git diff --ignore-cr-at-eol --stat` avant de croire à une
  modification de l'autre — **et ne jamais « nettoyer » par `git checkout`** (interdit, § 6).

---

## 3 · Ce qui reste — où le trouver

**La liste fait foi dans le registre**, pas ici. Au 2026-10-04, les entrées ouvertes sont :

| Chantier | Où | État |
| :--- | :--- | :--- |
| **Refonte des tablettes** — joueurs, puis meneur | registre **§ 123**, plan [`2026-10-04-refonte-tablettes.md`](./2026-10-04-refonte-tablettes.md) | ⏳ **rien de commencé** ; on reprend par **T0** (inventaire, captures aux trois tailles, un e2e par onglet — **ne touche pas `src/`**) |
| **Graphe de la Trame en cartes** (React Flow) | registre **§ 124** | ⏸ **garé** — attend deux décisions de David : l'accord pour installer le paquet, et la place avant ou après les tablettes |
| **Bannières de jeu** | [`2026-10-04-prompts-bannieres.md`](./2026-10-04-prompts-bannieres.md) | huit images déposées dans `docs/systems/<jeu>/` ; David les choisit dans l'éditeur de chaque pilote. **Within** attend sa description (pas de dossier `docs/systems/within/`) |
| **Ce qui se joue et ne se code pas** (P6) | registre **§ 1** | à éprouver en séance — on ne le « finit » pas dans le code |
| **Constaté, pas encore traité** | registre **§ 1 bis** | à lire avant de corriger quoi que ce soit en chemin |

---

## 4 · Le protocole de passation

### En début de session

- Lire le § 1 ci-dessus. Faire le point **depuis le code et `git log`**, puis le dire à David en
  quelques lignes avant de commencer.
- ⛔ **Avant toute modification de `src/` ou `electron/` : demander à David « GM-OS tourne-t-il ? »
  et attendre la réponse.** Le rechargement à chaud lui a fait perdre ses campagnes deux fois.
  *« Fermé » vaut jusqu'au prochain essai*, pas pour toute la session ; et ça ne couvre pas le
  démarrage suivant.

### Pendant

- **Un seul écrivain par fichier.** Si `git status` montre des changements que vous n'avez pas faits,
  ils ne sont pas à vous : ne les touchez pas, demandez à David.
- **Un chantier ouvert vit dans le registre** : une section numérotée (la prochaine est **§ 125**),
  une ligne dans « La vue d'un coup d'œil » (la prochaine est **60**), avec l'origine (la demande de
  David, citée), les décisions, les ancres (fichiers, commits) et l'état.
- **Une décision de David se consigne avec ses mots et sa date**, là où elle s'applique (registre,
  plan, commentaire du code). C'est ce qui empêche l'autre agent de la rouvrir.
- **Un défaut trouvé en chemin, hors du chantier en cours** : au **§ 1 bis** du registre, pas dans un
  correctif glissé dans un autre commit.

### En fin de session

1. **Écrire ou mettre à jour la note du jour** `documentation/Planning/AAAA-MM-JJ-etat-et-reprise.md` :
   ce que la session a produit (avec les commits), **par quoi reprendre**, et **ce qu'il ne faut pas
   repayer** (les pièges payés pendant la session).
2. **Mettre à jour le registre** (état du chantier, ancres).
3. **Commiter et pousser — seulement sur demande de David** (`AGENTS.md`). Si David ne le demande
   pas, le dire : *« X fichiers modifiés, non commités »*.
4. **Ne jamais laisser l'état dans une mémoire privée** — ni celle de Claude
   (`~/.claude/projects/…/memory/`, que Codex ne lit pas), ni une note de Codex hors du dépôt. **Le
   dépôt est le seul endroit que les deux voient.** Une leçon qui doit survivre va dans la note du
   jour ou dans ce document (§ 8).

### Les commits

- **Message en français**, sans accents dans le titre, au format `type(portée): ce qui change` —
  `feat`, `fix`, `docs`, `test`, `refactor`. Le corps dit **pourquoi**, et cite la demande de David
  quand il y en a une. Exemples : `fix(fiches): un de de ressource n'allume qu'une case`,
  `docs(registre): le graphe de la Trame en cartes, § 124 (gare)`.
- **Chaque agent signe ses propres commits.** Claude termine les siens par
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` ; Codex met **sa** ligne d'attribution,
  jamais celle de Claude — `git log` doit dire qui a fait quoi, c'est ce qui permet à l'autre de
  relire.
- **Un commit par sujet**, et un commit par écran pendant un réagencement : un écran raté se reprend
  seul.

---

## 5 · Les décisions de David à ne pas rouvrir

Les plus récentes, et celles qui pèsent sur le travail à venir. Chacune a son origine dans le
registre.

- **Tablettes** (04/10, § 123) : elles **suivent le thème du PC** ; matériel **hétéroclite** (iPad
  Air, tablettes, téléphones — de 360 à 1 180 px) ; **maquettes Stitch** ; **joueurs d'abord**,
  meneur ensuite ; habillage **à apparence constante**.
- **Fiche HTML** (03/10, option A) : **la dernière écriture gagne** entre GM-OS et la fiche.
- **Refonte du PC** (§ 76) : les quatre thèmes de base sont **indépendants** de l'habillage par le jeu ;
  les **personnalités** sont adoptées, allumées par défaut ; le réagencement suit **la grammaire
  commune** (`GabaritDeModule`), préférée à la maquette Stitch telle quelle ; la **garde des
  couleurs brutes couvre tout `src/`** (Q4 révisée le 03/10).
- **Thème d'un jeu** : on **extrait des jetons**, on **n'injecte jamais** la CSS d'un jeu ; « le jeu
  gagne, la main surcharge ». Les thèmes se fabriquent dans *RPG Theme Builder* (ChatGPT), pas ici.
- **Trame** (§ 120) : le graphe se **range** en chaîne ou en étoile selon la forme de la trame.
- **Modèles d'IA** (03/10) : un modèle pour préparer, un autre pour jouer ; la contrainte de 20 lignes
  ne vaut que pour le modèle **de séance**.

---

## 6 · Les commandes, et ce qu'elles cachent

| Quoi | Commande | Le piège |
| :--- | :--- | :--- |
| Tests | `npx vitest run --maxWorkers=4` | ⛔ sans la bride, les ~520 fichiers échouent **sans qu'un test ait tourné** |
| Types | `npx tsc -b` | ⛔ `tsc --noEmit` ne vérifie **rien** ici |
| Lint | `npm run lint` ; ciblé : `npx eslint <fichiers>` | **Réparé le 07/10** : fichiers suivis et nouveaux non ignorés de Git, sans parcourir les profils locaux. Zéro erreur ; avertissements visibles. Une erreur bloque désormais la validation. [Périmètre et contrôles](2026-10-07-lint-global.md) |
| Construire | `npm run build` | **obligatoire avant tout e2e** (Playwright lance l'application construite) |
| E2E | `npx playwright test e2e/<fichier>.spec.ts --reporter=list` | ⛔ **ne jamais lancer** `vitrine`, `vitrineDuSocle`, `campagnesEtThemes`, `profilageDesRendus` : ils lisent les sauvegardes de David |
| Captures du manuel | `npx playwright test e2e/capturesDuManuel.spec.ts` | ~2 min 30 ; campagne de démo, jamais les données de David ; **relire les images** (planche contact), pas seulement le compte |
| E2E qui capturent (tablettes, trame) et suite complète | — | ⛔ **ils réécrivent les images suivies** de `documentation/Planning/` (486 en suite complète, payé deux fois le 10/10). **Copier `documentation/` avant**, remettre ensuite ; `GMOS_SORTIE_CAPTURES_MANUEL=<dossier>` envoie les captures du manuel hors du dépôt. Registre § 133 |
| Écrans de référence | `npx playwright test e2e/ecransDeReference.spec.ts` | exigent le Zenbook en écran **principal** (200 %) : sur l'écran externe, **toutes** les captures échouent sans que rien n'ait changé |
| Lancer l'appli depuis un shell d'agent | `env -u ELECTRON_RUN_AS_NODE npm run dev` | la variable héritée empêche Electron de démarrer |
| Instance jetable | `npm run repetition` | pour essayer sans toucher aux données de David |

**Shells.** Sous Bash (Git Bash), faire `unset ELECTRON_RUN_AS_NODE` avant `npm run build` et
Playwright.

**Les deux hooks versionnés** (`scripts/hooks/`, `core.hooksPath`) :

- **`pre-push`** lance `npm run validate` : types, lint, tests, build — **quatre à cinq minutes**.
  ⛔ Le push n'est **pas** figé : le lancer en arrière-plan, **sans délai ni arrêt** (payé le
  04/10 : un `timeout` a coupé l'envoi juste après la validation réussie), et ne rien éditer dans
  `src/` pendant — la validation teste la copie de travail. ⚠️ Il **ne lance pas les e2e** : les
  relancer soi-même après un réagencement (huit e2e cassés sans le savoir, le 03/10).
- **`post-commit`** renvoie à NotebookLM (carnet « GM-OS ») **les guides modifiés** par le commit.
  Pour s'en passer : `GMOS_SANS_NOTEBOOKLM=1 git commit …` — à demander à David.

---

## 7 · Les conventions d'écriture

- **Le code est en français** : noms (`seanceOuverteDe`, `estUneFrappeDePastille`), commentaires,
  libellés. Un commentaire dit **pourquoi**, avec la date et, s'il y en a une, la demande de David
  citée — *c'est ce qui permet à l'autre agent de ne pas défaire une décision*. Imiter le style du
  fichier qu'on touche.
- **Une règle commune existe souvent déjà** : la chercher avant d'en écrire une
  (`logic/seanceOuverte.ts` pour la séance en cours, `utils/frappeDePastille.ts` pour le clavier,
  `hooks/useFermetureParEchap.ts` pour Échap, `components/socle/` pour les primitives d'écran).
- **Les guides** (`documentation/User Guides/`) : un `⛔ Correction` dit ce qui était faux, un
  `✅` ce qui est réparé, et chaque guide relu porte en pied *« Relu le AAAA-MM-JJ … »*. Les captures
  viennent de `e2e/capturesDuManuel.spec.ts` et de la campagne de démo
  (`e2e/donnees/campagne-de-demo.json`, le **JSON fait foi** — il suit les types de
  l'application).
- ⛔ **`docs/` est le corpus de l'Oracle** : un `.md` posé dans `docs/` entre dans ses réponses. Les
  plans, notes et prompts vont dans **`documentation/`**.

---

## 8 · Les pièges qui ont coûté cher — ce que la mémoire de Claude savait

Claude tient une mémoire privée que Codex ne lit pas. Voici ce qu'elle contient d'essentiel, pour
que les deux partent du même endroit.

- **Données de David.** ⛔ Ne jamais toucher `%APPDATA%\gm-os-v5\` ni
  `C:\Projet_David\Security_Backup_GMOS\`. Si une perte est suspectée : **copier avant de
  diagnostiquer**, et dire d'abord à David ce qui est sauf. La première sauvegarde automatique avait
  **vidé l'application** par `git stash` / `git checkout`.
- **Le chemin de données.** ⛔ `app.getPath('userData')` **verrouille** le chemin : jamais à
  l'évaluation d'un module importé par `electron/main.ts`.
- **Plusieurs fenêtres, un seul écrivain.** Le Player Hub et le projecteur écrasaient sept magasins
  du meneur : la garde `ecritureReserveeAuMJ` l'empêche — et `useRessourcesDeTableStore` ne doit
  **pas** la recevoir.
- **Les deux ports.** `port` = Vite en développement, `mediaPort` = le SyncServer, **toujours**. Une
  tablette qui affiche « The Eternal Quest » n'a jamais reçu l'état du meneur.
- **Les tablettes** sont des navigateurs : pas d'`appBridge`, donc rien de ce qui lit le disque. La
  télécommande exige son **jeton d'appairage** (`#token=…`), sinon elle reste en « Reconnexion ».
- **Échap et le clavier.** Un registre unique des surcouches (`useFermetureParEchap`) : une surcouche
  ouverte **prend la main sur le clavier** (les pastilles de Sound-OS, Music-OS et Light-OS se
  taisent). Ne pas y inscrire un panneau permanent ; ne pas rétablir la « règle des deux frappes ».
- **Le trousseau des clés d'IA** est lu avant `ready` ; une ancienne version détruisait les autres
  clés quand on en retapait une. Le relire avant de toucher une clé.
- **Ollama** : `think: false` et un schéma imposé ; `keep_alive` au premier niveau de la requête ;
  `~/ollama_debug.log` tranche.
- **NotebookLM** : « INVALID_ARGUMENT / account-level » veut dire **question trop longue**
  (~3 600 caractères), pas un problème de compte.
- **Tailwind 4**, pas 3 : la palette est en `oklch` ; une valeur « d'aujourd'hui » se relève dans la
  CSS construite, jamais de mémoire.
- **Les e2e d'interface** : régler explicitement l'interrupteur des **personnalités** ; une séance
  `active` dans n'importe quelle campagne renvoie toute vue de préparation au cockpit.
- **Une garde qui refuse tout ressemble à une garde qui marche.** Un essai qui fabrique son propre
  `keydown` ne dit rien de ce que Windows laisse passer (`Ctrl+Maj+0` n'atteignait aucune fenêtre).
- **Le matériel réel de David** (Zenbook Duo, deux écrans 1440 × 900, deux écrans de table, des
  enceintes en Bluetooth et en filaire) explique des symptômes que le code n'explique pas : **pour
  un saccadé continu, demander l'installation avant de lire le graphe audio**.

---

## 9 · Ce que ce document ne remplace pas

- Les **interdits** d'[`AGENTS.md`](../../AGENTS.md).
- Le **registre** et ses sections : l'état, les décisions et les ancres de chaque chantier.
- La **note du jour** : ce qu'une session a produit.

*Le tenir à jour quand une règle de passation change — et dire dans la note du jour qu'on l'a
changé.*
