# État et reprise — Forge de campagne

**Date :** 2026-08-15 (soirée)
**Branche :** `feature/tablet-hub-pwa`
**Plan de référence :** `2026-08-15-forge-de-campagne-et-trame.md`
**Documents liés :** `2026-08-08-trame-narrative-cycle-seance.md` (le modèle actes/scènes) ·
`2026-08-15-gabarits-atelier-de-campagne.md` (les invites, générées par le code)

**À quoi sert ce document.** Reprendre demain sans relire treize commits. Il dit ce qui tourne, ce qui
attend, et le geste exact pour continuer.

---

## 1. Le geste pour reprendre

> ⚠️ **Redémarrer complètement l'application**, pas seulement recharger. La correction
> `nativeTheme.themeSource` vit dans le **processus principal**, que le rechargement à chaud ne touche
> pas. Sans redémarrage, les menus déroulants restent illisibles.

Depuis un shell d'agent : `env -u ELECTRON_RUN_AS_NODE npm run dev` — sinon Electron démarre déguisé en
Node et crashe sans le dire.

**Le prochain travail est l'étape 9 : la Forge de campagne.** Elle lit les fiches déjà produites et les
projette en objets de jeu. Rien d'autre n'est en attente.

---

## 2. Ce qui tourne

### 2.1 La trame narrative — le modèle existe

`src/types/trame.types.ts`, `trameSlice`, fonctions pures dans `logic/trame.ts`, écran `TrameDashboard`
(vue `'trame'`, atteinte depuis la fiche de campagne, à côté du wiki).

- **Campagne → Actes → Scènes.** Deux niveaux, pas quatre. La séance n'est **pas** le parent d'une
  scène : elle coupe la trame arbitrairement, ce sont deux axes qui se croisent.
- **Une scène préparée et une scène improvisée sont le même objet.** Ce qui les distingue est
  `remplissageDeLaScene`, **calculé et jamais stocké** — une scène improvisée puis retravaillée compte
  alors comme complète.
- **La séance annonce son acte** (`GameSession.acteId`, `scenesPrevuesIds`), édité dans l'écran de
  préparation. C'est la face *prévue* ; le parcours *réel* relève de la capture en partie et n'existe
  pas encore, **délibérément** — le poser maintenant en ferait des champs morts qui ont l'air vivants.
- Changer l'acte d'une séance n'efface rien : ce qui sort du cadre passe sous « prévues hors de cet
  acte ». *Ne pas imposer la linéarité.*

### 2.2 L'Atelier de campagne — il a produit un vrai corpus

Onglet **« Campagne »** de Forge OS. Parcours : inventaire → structure → une fiche par sujet et par acte.

**Vérifié sur charge réelle le 2026-08-15** : `docs/campaigns/le-secret-de-milo/fiches/`, **14 fiches
publiées**, trois scénarios, Cthulhu Hack. Les dix sujets ont tous été traités par le carnet.

- **Convention de corpus** : `docs/campaigns/<slug>/` avec `fiches/`, `drafts/`, `fiches-v1/`. Le
  « Chemin des Notes » déclaré reste souverain, mais une contradiction avec la convention est
  **annoncée** au lieu de se lire entre les lignes.
- **Canevas de dix sujets**, fourni jamais demandé, dérivé de ce que le code consomme. **Deux se
  demandent acte par acte** — les PNJ et les scènes. C'est le second axe de découpage que la Forge
  Système n'a jamais eu à résoudre.
- **Les fiches portent `jeu: <id>`.** Inutile à l'Atelier — les gabarits interdisent les règles — mais
  la Forge en aura besoin, et une campagne neuve n'a nulle part ailleurs où le porter.
- **L'avancement se relit sur le disque** (`reprendreLAtelier`) : brouillon écrit avant toute revue,
  publication à froid, reprise possible après fermeture.

### 2.3 La Forge de chronique — assainie, mais c'est l'ancien chemin

Les cinq défauts de la voie 1 sont corrigés (`06c6987`) : `sansPersona` + schéma, l'invite n'enseigne
plus `hp`/`ac`, l'enrichissement ne réécrit plus le jeu de la campagne, la cible se choisit, le bandeau
et le toast ne mentent plus.

> **Ne PAS l'employer pour « Le secret de Milo ».** Elle déverse des documents bruts en **un seul
> appel**, ne connaît ni actes, ni scènes, ni indices, et apparie les relations **par nom** en jetant en
> silence ce qui ne tombe pas juste. Elle jetterait la structure que les treize appels au carnet ont
> payée.

---

## 3. Ce qui attend — l'étape 9

**La Forge de campagne** : lire les fiches de `campaignPath` et les projeter, dans l'ordre des
dépendances, chaque étage ne pouvant désigner que ce que les précédents ont créé.

```text
campagne → actes → lieux → factions → PNJ (par acte) → relations → indices → scènes
```

C'est `blocDuVocabulaire` appliqué à la narration. Sur le corpus de Milo, cela doit donner trois `Acte`
(Manigances d'Arlequin, Mystères en Italie, Voyage en Mésopotamie), les lieux de l'Hôtel Artemide à la
Porte d'Ishtar, Milo Torricelli et Furlan/Mark'duk en `Entity`, et la chouette de la Villa d'Este en
`Clue` avec son lieu.

**Les briques prêtes à l'emploi :**

| Brique | Où |
| --- | --- |
| Lire les fiches d'un corpus | `lireFichesDuCorpus` (règles) — à décliner pour `fiches/` |
| Grouper, ordonner, injecter le vocabulaire | `GroupesDeChamps.ts` — le patron à transposer |
| Imposer la forme au décodeur | `generateJSON(..., { sansPersona: true, schema })` |
| Écrire les objets | `handleAddChronicle`, `trameSlice` |

**Trois points à ne pas manquer.**

1. **Ne plus jeter en silence.** `crossDomainHelpers.ts:42` fait `.filter(r => r.targetId)` : ce qui ne
   se résout pas disparaît sans un mot. Pour une relation c'est discret ; pour une scène qui perdrait
   ses PNJ et ses indices, ce serait grave.
2. **Survie des retouches en reforge.** Si retravailler une séance efface le travail de la semaine
   précédente, le meneur cessera de retravailler.
3. **Le `jeu:` des fiches donne le pilote** — donc `santeSelonLeJeu` pour les PNJ et le `templateId`.
   Ne pas le redemander.

---

## 4. Décisions prises, à ne pas rouvrir

- **On n'extrait PAS les règles d'une campagne.** Le pilote appartient au **jeu** : une règle propre à
  un module glissée dans le `GameDriver` contaminerait toutes les autres campagnes du même jeu. Le sujet
  « Règles propres à cette campagne » existe, mais sa fiche ne nourrit **aucun champ de pilote**.
- **Les actes sont le second axe de découpage.** Un appel par sujet suffit à des règles bornées ;
  « énumère les quarante PNJ du module » ne rentre dans aucune réponse.
- **Le canevas est fourni, jamais demandé.** Sinon chaque livre invente sa taxonomie et deux campagnes
  cessent d'être comparables.
- **La campagne se choisit dans l'Atelier**, pas héritée du cockpit.
- **L'Atelier ne crée pas de campagne** : il écrit des fiches. La campagne naît de la Forge.

---

## 5. Deux pièges découverts sur la charge réelle

**Les renvois internes du carnet.** Il truffe ses réponses de `[1-4]`, `[3, 5, 6]` — ses numéros de
source *dans la conversation en cours*, qui ne désignent plus rien ensuite. Corrigé **deux fois** : la
consigne manquait dans le gabarit d'inventaire, **et** un retrait local — ces renvois sont posés par le
système de citation du carnet, pas écrits par le modèle. *On ne désarme pas avec une consigne ce que le
modèle n'écrit pas lui-même.*

**Les menus natifs illisibles.** Il fallait **les deux** : `color-scheme` (ce que la **page** dessine)
et `nativeTheme.themeSource` (ce que le **système** dessine pour elle — sous Windows, Chromium fait du
menu d'un `<select>` une fenêtre native). J'ai affirmé la première comme suffisante sans la vérifier
jusqu'au bout.

---

## 6. Restes connus, non traités

- **`AIService.ts:371`** rend `"Résumé non disponible pour ce fournisseur d'IA."` au lieu de lever.
  David est sur Ollama : **ses résumés de séance n'ont jamais fonctionné**, et `syncToNotebook`
  pousserait cette phrase dans le carnet comme source. Signalé le 2026-08-08, toujours là. *À vérifier
  sur les données enregistrées.* Relève de l'après-partie, une autre temporalité.
- **L'événement de décès** n'est émis que si le meneur exporte le rapport de combat, et **jamais pour un
  PJ**.
- **`SessionService.saveFullSession` omet `entities` et `clues`** : les PNJ et les indices ne sont pas
  dans les sauvegardes. Antérieur, non corrigé — arbitrage de David.
- **`docs/campaigns/dune/Agents_of_Dune.md`** existe hors convention. Forger Agents de Dune viserait
  `campaigns/agents-de-dune/`, un autre dossier.
- **`§ 1.3` du plan** : en mode enrichissement, seul le *nom* de la campagne part au modèle, jamais son
  contenu. Reporté en voie 2 avec la survie des retouches.
