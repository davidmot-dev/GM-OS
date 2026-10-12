# L'écran « Scène en cours » — plan du 11/10/2026

**Né du débriefing de la première séance jouée** (11/10). Trois constats du § 1 bis du
[registre](2026-08-23-chantiers-gares.md) — les indices, le PNJ « vu », la scène illisible — ont
la même racine, et David l'a dite en une phrase : *« lorsque je démarre une scène, ses
informations ne sont pas facilement accessibles ; il faudrait un écran scène en cours avec les
éléments descriptifs, les secrets MJ, les indices, les PNJ, les lieux »*. Et : *« en définitive
je ne me suis pas servi de Combat-OS »* — **parce qu'il était trop lourd à ouvrir.**

**Aucune ligne de code modifiée à ce jour.**

## Le diagnostic — l'espace de séance lit la séance, pas la scène

La scène est préparée dans la Trame ; l'écran où l'on joue (`SessionWorkspace.tsx`) n'en lit
presque rien :

| Préparé dans la scène | Ce que l'espace de séance montre à la place |
| --- | --- |
| `resume` | ✅ une ligne sous le titre |
| `notesDuMeneur` | ❌ le bloc « Secrets du MJ » est `session.gmSecrets`, un bloc-notes **de la séance** |
| `entiteIds` (PNJ) | ❌ « PNJ actifs » = `session.sessionEntityIds`, ajoutés **à la main** |
| `lieuId` | ❌ « lieux épinglés » = `campaign.activeLocationIds`, ceux **de la campagne** |
| `indiceIds` | ⚠️ le bloc « Indices à révéler », **en bas**, absent si rien n'est lié ; révéler et projeter sont deux gestes |

Tout ce que la scène porte se lit en **dépliant sa ligne** dans `PanneauDeTrameEnCours`, plus bas,
en noms seuls et dans un champ de trois lignes. *Le plan existait ; on le perdait de vue au moment
de jouer* — la phrase du 17/08 qui a fait naître ce panneau, et qui reste vraie un cran plus loin.

## Les décisions de David (11/10)

| Question | Décision |
| --- | --- |
| Où vit l'écran | **Plein écran**, à part de l'espace de séance |
| Son contenu, dans l'ordre | **Description narrative, enjeux, exemples de répliques, idées musicales** ; *ensuite* indices, PNJ, lieux |
| Les secrets du MJ | Ce sont les **notes du meneur** de la scène |
| Résumé et enjeux | **Deux champs distincts** — le résumé reste, « Enjeux » s'ajoute |
| Les répliques | **Texte libre**, mis en forme |
| La musique | **Texte + bouton d'ambiance** (le moment de storyboard lié) **+ des morceaux de Music-OS liés** à la scène, jouables d'un clic |
| La note Obsidian | **Un lien de la scène vers sa note** — *« m'aiderait beaucoup »* |
| L'ouverture | **Toute seule au démarrage d'une scène** ; Échap la ferme, un bouton et un raccourci la rouvrent |

## Le modèle — des champs facultatifs, aucune migration

Sur `Scene` (`src/types/trame.types.ts`), tous **facultatifs** et lus avec un repli, comme
`personnagesIds` et `importance` : les scènes d'avant n'en portent pas, et *une migration est
l'endroit où les données de ce projet sont déjà mortes deux fois.*

| Champ | Contenu |
| --- | --- |
| `descriptionNarrative?: string` | Ce que les joueurs voient, entendent, sentent — Markdown |
| `enjeux?: string` | Ce qui doit se jouer, ce qui peut se perdre — Markdown |
| `repliques?: string` | Exemples de dialogue, texte libre — Markdown |
| `ideesMusicales?: string` | Notes d'inspiration — Markdown |
| `morceauxIds?: string[]` | Des pads de Music-OS (`MusicPad.id`) — **des identifiants, jamais des contenus**, la règle de tous les renvois de ce modèle |
| `noteObsidian?: string` | Chemin **relatif au coffre** de la note — lu par `appBridge.obsidian.readNote(chemin, coffre)` |

`schemas.ts` ne valide pas les scènes de la Trame (ses `scenes` sont les tuiles de Light-OS) :
rien à y déclarer. À vérifier avant d'écrire : **tous les gestes qui recopient une scène** (clone, fusion, scission, export Nexus-OS, purge) les
emportent — *un champ qu'un clone oublie est une donnée perdue au premier clic.*

## Les lots

### L1 · Le modèle et l'éditeur de la Trame

Les six champs, et leur saisie dans l'éditeur de scène (`TrameDashboard.tsx`, à côté du résumé et
des notes). Un **choix de note** dans le coffre (l'arbre `listNotes` existe déjà) et un **choix de
pads** dans les playlists visibles de la campagne.

### L2 · L'écran plein

Un composant à part, monté en surcouche plein écran : `CadreDeSurcouche` dessine la boîte,
`useFermetureParEchap` l'inscrit **au registre des surcouches** pour qu'Échap la ferme comme les
autres, et dans le bon ordre. De haut en bas :

1. **En-tête** : acte, titre, « Changer de scène », fermer.
2. **Description narrative**, **enjeux**, **répliques** — rendus en Markdown (`react-markdown` +
   `remark-gfm`, déjà dans le projet, comme `ObsidianPanel`).
3. **🔒 Notes du meneur** — éditables, **le même champ** que la Trame et le panneau (*deux zones de
   notes pour une scène finiraient par se contredire*).
4. **Musique** : les idées, le bouton « Lancer » du moment de storyboard lié, les morceaux liés
   (`playPad`), chacun allumé s'il joue.
5. **Indices de la scène** : non découverts avec **« Révéler »** et **« Révéler et projeter »** ;
   découverts, **ils restent dans la scène**, marqués avec leur date, et gardent **« Projeter »**.
6. **PNJ de la scène** (`entiteIds`, pas la séance) : portrait, camp, **« Montré aux joueurs »**
   (le geste `isVisibleByPlayers`, renommé), lien vers la fiche.
7. **Lieu de la scène** (`lieuId`) : vignette, « Ouvrir la carte », « Projeter ».
8. **La note Obsidian**, rendue, repliable, avec « Ouvrir dans Obsidian ».

**L'ouverture automatique** se lit sur l'état, pas sur les boutons : une scène qui **entre** dans
l'état « en cours » ouvre l'écran. `ouvrirLaScene` a trois appelants (`PanneauDeTrameEnCours`,
`InspecteurDeTrame`, `TrameDashboard`) — *une règle posée chez les appelants en oublierait un.*
Deux scènes ouvertes en même temps (groupe séparé) : un onglet par scène.

### L3 · Le libellé du PNJ, partout

« En ligne / Hors ligne » devient « Montré aux joueurs / Caché », avec un œil, aussi dans
`NpcDetail.tsx`. Petit, et utile même sans L2.

### L4 · La Forge apprend les nouveaux champs — plus tard

`ecritureDeLaCampagne.ts` remplit déjà résumé, notes, lieu, PNJ, indices. Lui apprendre
description, enjeux, répliques et idées musicales est un lot à part, **après** que l'écran a été
joué : *on ne fait pas remplir à une machine des cases dont on n'a pas encore vu l'usage.*

## Ce qui reste ouvert

- **Le PNJ « vu »** : montrer aux tablettes seulement, ou aussi garder la trace de qui a été
  rencontré ? (question posée le 11/10, sans réponse)
- **La description narrative se projette-t-elle** au Player Hub, comme un indice ?
- **Le raccourci** qui rouvre l'écran : à choisir parmi les libres.
- **Combat-OS « trop lourd à ouvrir »** : ce qui pèse n'est pas encore dit (le nombre d'écrans ?
  la saisie des combattants ?). Ligne à part au § 1 bis, hors de ce plan.

⛔ **Avant toute édition de `src/` : demander à David « GM-OS tourne-t-il ? »** et attendre.
