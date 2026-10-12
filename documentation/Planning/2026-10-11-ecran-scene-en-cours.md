# L'écran « Scène en cours » — plan du 11/10/2026

**Né du débriefing de la première séance jouée** (11/10). Trois constats du § 1 bis du
[registre](2026-08-23-chantiers-gares.md) — les indices, le PNJ « vu », la scène illisible — ont
la même racine, et David l'a dite en une phrase : *« lorsque je démarre une scène, ses
informations ne sont pas facilement accessibles ; il faudrait un écran scène en cours avec les
éléments descriptifs, les secrets MJ, les indices, les PNJ, les lieux »*. Et : *« en définitive
je ne me suis pas servi de Combat-OS »* — **parce qu'il était trop lourd à ouvrir.**

**État au 12/10 : L1 et L3 (`b16b19a5`) et L2 faits, à éprouver à l'écran ; reste L4 (la Forge, plus tard).** L2 : `components/EcranDeLaSceneEnCours.tsx`, monté dans la fenêtre du meneur (`App.tsx`), état dans `useEcranDeSceneStore` ; s'ouvre quand une scène **entre** en cours (`logic/ecranDeScene.ts`, `scenesEntreesEnCours` — jamais pendant la relecture de la base ni un import), Échap le ferme, Ctrl+E le rouvre. Onglet par scène en cours, « Changer de scène ». Textes en Markdown ; notes du meneur éditables (le champ de la scène) ; musique (idées, ambiance liée, morceaux allumés s'ils jouent) ; indices (Révéler, Révéler et projeter, Projeter ; découverts, ils restent avec leur date) ; PNJ (Montré/Caché, **trace de la première rencontre** `vuParLesJoueurs`, fiche) ; lieu (« Mettre sur la table ») ; **rencontres (R4 : « Invoquer » ouvre Combat-OS sur « Qui entre ? »)** ; note Obsidian repliée. ⚠️ Deux projections d'indice coexistaient (`avatar` d'un côté, `imageUrl` de l'autre) : `indiceProjete` porte les deux. L1 : les six champs sur `Scene`, leur saisie dans la fiche de la Trame (`TexteDeScene`, `trame/LiensDeLaScene.tsx` pour les morceaux et la note) ; la fusion accole les textes et réunit les morceaux, la scission laisse les textes à la première moitié. Le taux de préparation n'en tient pas compte — même règle que le rang et les PJ présents. L3 : « Montré aux joueurs / Caché aux joueurs », avec un œil, dans `NpcDetail` — le seul écran qui porte ce geste.

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

## Les décisions de David (12/10)

| Question | Décision |
| --- | --- |
| Le raccourci qui rouvre l'écran | **Ctrl+E** |
| La description narrative se projette-t-elle | **Non** : elle reste au meneur, qui la lit |
| Le PNJ « montré aux joueurs » garde-t-il une trace | **Oui** : un PNJ montré une fois reste « rencontré », avec la scène et la date |

## L5 · Le lieu et ses battlemaps — décidé et fait le 12/10, à éprouver

*Constat de David, devant l'écran, le 12/10 : « il y a plusieurs choses dans les lieux : le lieu même,
généralement une image, et des battlemaps qui doivent être chargées dans Map-OS ».* Le bouton « Mettre
sur la table » chargeait l'**image** du lieu dans Map-OS, comme une battlemap — et ouvrir une scène depuis
le panneau de séance faisait déjà de même (`PanneauDeTrameEnCours.ouvrirEtProjeter`) : l'illustration du
Palais de Justice devenait le plateau.

| Question | Décision |
| --- | --- |
| Où ranger les battlemaps | **Les deux** : le lieu de l'Atlas propose les siennes (ses liens « lieu » vers des cartes de type `battlemap`, et lui-même s'il en est une) ; la scène peut en **ajouter** ou en **retirer** |
| Au début d'une scène | **Rien** : ni projection ni chargement automatique ; le chargement de `ouvrirEtProjeter` est retiré |

À l'écran : le bloc **Lieu** distingue **Projeter l'image** (sur un écran de la table, comme « Projeter »
dans l'Atlas) et, pour chaque battlemap, **Charger dans Map-OS**. Sur `Scene` : `battlemapIds?` (ajoutées)
et `battlemapsRetirees?` (celles du lieu qu'on écarte) — facultatifs ; la fusion les réunit, la scission
et le clone les recopient (décor).

**Fait le 12/10** : `logic/battlemapsDeLaScene.ts`, `ChoixDesBattlemaps` dans la fiche de la Trame, le bloc
Lieu de l'écran (« Projeter l'image » sur `projectionTarget` d'Image-OS, `BoutonProjeterLeLieu.tsx` ;
« Charger dans Map-OS » allumé si c'est la carte du plateau), et `ouvrirEtProjeter` devenu `ouvrir`. ⛔
**L'Atlas n'est pas touché** (David, 12/10) : une extraction de son bouton « Projeter » en composant
partagé a été écrite puis retirée — sa fiche est identique au commit précédent.

## Ce qui reste ouvert

- **Le PNJ « vu »** : montrer aux tablettes seulement, ou aussi garder la trace de qui a été
  rencontré ? (question posée le 11/10, sans réponse)
- **La description narrative se projette-t-elle** au Player Hub, comme un indice ?
- **Le raccourci** qui rouvre l'écran : à choisir parmi les libres.
- ~~**Combat-OS « trop lourd à ouvrir »**~~ — dit le 12/10 : *la mise en place*. Réponse : les
  [rencontres préparées](2026-10-12-rencontres-preparees.md) ; leur bouton « Invoquer » entre dans L2 (R4).

⛔ **Avant toute édition de `src/` : demander à David « GM-OS tourne-t-il ? »** et attendre.
