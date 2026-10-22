# L'onglet « Lancer un test » — prompts Stitch, 2026-10-22

**Pour** : David et Claude Code. **Demande de David, le 22/10** : *« dans les fiches de
personnages, je voudrais déporter la section "Lancer un Test" dans un onglet séparé, car cela
prend de plus en plus de place sur la fiche. Je voudrais en profiter pour que tu réimagines le
design de cet onglet avec Stitch. Cela doit aussi se reporter sur les Tablettes Joueurs. »*

Registre : [§ 147](2026-08-23-chantiers-gares.md). Quatre propositions reçues et **retenues** le 22/10 (*« tout me convient passe au code »*) ; onglets et refonte **codés le 22/10** — le détail est au registre.

## Les quatre choix de David (22/10)

| Question | Réponse |
| --- | --- |
| Ce qui part dans l'onglet | **Tout ce qui lance** : le panneau de jet entier avec ses blocs de jeu ; sur tablette, le bloc des Sauvegardes de Cthulhu Hack. Les panneaux du voyageur de Rêve de Dragon (fatigue, santé, repos…) restent sur la fiche. |
| L'onglet ouvert par défaut | **La fiche** : le formulaire chez le meneur, la vue synthétique sur la tablette. |
| Jusqu'où va Stitch | **Le cadre et la partie commune** : choix des valeurs, réserve, bouton Lancer, résultat. Les blocs de jeu sont rangés dans la structure (cartes repliables), sans être redessinés un à un. |
| Le jeu dessiné | **Alien et un second jeu** : Nephilim, jet au d100 sous un seuil, à l'opposé de la réserve de d6. |

## Ce que le code montre aujourd'hui

- **Meneur** — `CharacterSheetEditor.tsx` : barre du haut (emoji et nom du gabarit, « Fiche de
  … », bascule **Formulaire / Fiche du jeu** si le jeu a une fiche HTML, **Sauvegarder**). Puis
  deux colonnes : à gauche portrait, jeton, nom, points de vie ; à droite le panneau de jet,
  **posé au-dessus des sections de la fiche**. Sur la fiche HTML, le jet n'est plus accessible.
- **Tablette** — `HubCharacterSheet.tsx` : en tête, les bascules **Ma fiche** et la fiche du
  groupe (Cabale de NOC) ; la **vue synthétique** porte le panneau de jet au-dessus des sections.
- **Le panneau** — `PanneauDeJet.tsx` (2 149 lignes), un seul composant pour les deux écrans
  (`pourLesJoueurs` sur la tablette). Son ordre réel :
  1. titre « Lancer un test » ;
  2. **les choix** : une liste par composante du jet (Alien : Attribut, Compétence, Stress ;
     Nephilim : Vécu ou Art occulte, Approche (Ka) ou Construct) ;
  3. **le calcul** en une ligne : « Réserve 6 = 4 + 2 (force + combat_rapproche) », « Stress 2 »,
     ou « Chances 90 % = (4 + 5) × 10 » ;
  4. **les réglages du jeu** : « Préparer le test Alien » (arme de la fiche, bonus d'outil ou de
     talent, modificateur de situation, personnes qui aident, rôle dans le test, une phrase sur
     l'aide) ; chez Nephilim, curseur **Difficulté** et « Puiser dans ses réserves » (Effet
     Mnémos, Stase, avec − / + et « sur 7 ») ;
  5. **les avertissements** : « Attribut : aucun champ retenu », « Aucun dé ne reste : ce test est
     impossible » ;
  6. **la rangée de lancer** : Dés − n +, Tirage (Normal…), bouton **Lancer** ;
  7. **après le jet** : « Forcer le jet », « Dépenser un Point de Récit (1) » ;
  8. **le résultat** : les dés (succès en vert, Stress en pointillé), **RÉUSSITE**, « 3 réussites /
     1 requise », « +2 excédent » ; chez Nephilim « 5 vs 90 — marge 0 », « sous 90 » ;
  9. **les blocs du jeu**, empilés : « Dernier test Alien » (actions d'éclat : Dégâts +1, Clouer
     sur place, Échanger les initiatives, Désarmer, Faire reculer ou tomber), Munitions, Actions
     de combat, « Cinéma et Campagne Alien » (repliable), Santé, « Stress et Panique ».

## Mode d'emploi

1. **Le projet Stitch existant** (« Système Design Bureau Modulaire ») et son
   [DESIGN.md](stitch/DESIGN.md) : thème sombre Cyberpunk de la grammaire.
2. **Une conversation neuve par écran** (leçon du prompt 13). Dans une conversation, on
   décline le **même** écran : d'abord Alien, puis Nephilim ; ou d'abord téléphone, puis iPad.
3. **Joindre** la [grammaire](stitch/grammaire/combat.png) et les captures indiquées.
4. **Décor fictif** : les personnages des captures du manuel (`e2e/capturesDesJeux.spec.ts`).
   Aucune donnée de David.
5. Claude Code **affiche lui-même chaque export HTML** et le confronte au code avant de te le
   montrer. Une commande qui paraît inventée se cherche d'abord dans le code.
6. ⛔ **Le HTML de Stitch est une référence d'agencement**, jamais du code à coller.

---

## Écran 1 · Poste du meneur — conversation neuve

**Joindre** : la grammaire, `documentation/User Guides/captures/jeu-alien-jet-lance.jpg`,
`jeu-alien-a2-preparation.jpg`, `jeu-alien-a2-tablette-360.jpg` (le bloc « Dernier test »).

### 1a · Alien, 1440 × 900

```text
Dans le projet GM-OS existant, dessine UNIQUEMENT l'onglet « Lancer un test » de la fiche de
personnage du meneur, application web de bureau 1440 × 900, thème sombre Cyberpunk du DESIGN.md,
même grammaire que l'image « grammaire ». Décor fictif.

Barre du haut de la fiche, inchangée : emoji et « ALIEN, le jeu de rôle », « Fiche de Lambert »,
et à droite le bouton plein « Sauvegarder ». Juste dessous, TROIS onglets : « Formulaire »,
« Lancer un test » (actif), « Fiche du jeu ». Dans l'onglet, un bandeau compact du personnage :
portrait carré, « Lambert », Points de vie 4 / 4. Rien d'autre de la fiche.

Le test se lit de haut en bas, en étapes visibles :
1. Composer : trois listes — Attribut « Force (4) », Compétence « Fo_Combat rapproché (2) »,
   Stress « Niveau de Stress (2) ». Sous elles, une ligne de calcul : « Réserve 6 = 4 + 2 », et
   « Stress 2 ».
2. Préparer le test Alien : Arme de la fiche (Aucune), Bonus d'outil ou de talent (0),
   Modificateur de situation (0), Personnes qui aident « 0 (+0 dé) », Rôle dans le test
   « Test simple », et la phrase « L'aide se déclare avant le lancer, avec l'accord de Maman ; au
   combat, elle coûte le même type d'action que celle aidée. »
3. Lancer : « Dés − 6 + », et le bouton principal « LANCER », le plus visible de l'écran.
4. Résultat : huit dés — 5, 3, 6, 1, 1, 6, 6 en dés de base, les 6 en vert, et un 3 en dé de
   Stress (bordure pointillée). « RÉUSSITE », « 3 réussites / 1 requise », « +2 excédent ».
   Deux boutons : « Forcer le jet », « Dépenser un Point de Récit (1) ».
5. Puis des cartes REPLIABLES, titres seuls quand elles sont fermées, une ouverte :
   « Dernier test Alien — Fo_Combat rapproché » (ouverte : « Base 6 + arme 2 + outil/talent 0 +
   situation 0 + aide 0 → 8 dés de base, 0 de Stress. », « Actions d'éclat disponibles : 2. »,
   boutons Dégâts +1, Clouer sur place, Échanger les initiatives, Désarmer, Faire reculer ou
   tomber) ; « Stress et Panique » ; « Santé » ; « Cinéma et Campagne Alien ».

Quand une valeur manque, un avertissement court apparaît sous l'étape 1 (« Attribut : aucun
champ retenu. ») ; montre-le en état secondaire, pas dans l'écran principal.
Aucun panneau de réglages à droite : l'onglet est une colonne de travail, large d'environ
960 px, centrée. C'est TOUT. N'ajoute rien : ni historique, ni statistique, ni bouton qui ne
figure pas ici. Rien sous 12 px ; texte courant contraste ≥ 4,5.
```

### 1b · Nephilim, même conversation

```text
Décline UNIQUEMENT ce même onglet pour un autre jeu, Nephilim Légende, avec la même structure
et les mêmes onglets. Fiche de Claire Moreau. Les étapes deviennent :
1. Composer : « Vécu ou Art occulte » = « Templier (4) », « Approche (Ka) ou Construct » =
   « Ka-Feu (5) ». Ligne de calcul : « Chances 90 % = (4 + 5) × 10 ».
2. Préparer : un curseur « Difficulté » de −10 à +7 réglé sur 0, et « Puiser dans ses
   réserves » : « Effet Mnémos (1 PS : +2 degrés) − 0 + sur 7 (1 par jet) ».
3. Lancer : « Dés − 1 + », « Tirage : Normal », bouton « LANCER ».
4. Résultat : deux dés de dix, 0 et 5. « RÉUSSITE », « 5 vs 90 — marge 0 », « sous 90 ».
5. Aucune carte de jeu : ce jeu n'en a pas ici, l'écran s'arrête au résultat.
Pas de dés colorés de Stress, pas de Point de Récit : ils n'existent pas dans ce jeu.
C'est TOUT. N'ajoute rien.
```

---

## Écran 2 · Tablette du joueur — conversation neuve

**Joindre** : la grammaire, `jeu-alien-a2-tablette-360.jpg`, `jeu-alien-a2-tablette-1180.jpg`,
et la tablette retenue [`stitch/tablettes-joueurs/direct/telephone-390.png`](stitch/tablettes-joueurs/direct/telephone-390.png)
(la navigation fixe).

### 2a · Alien, téléphone 390 × 844

```text
Dans le projet GM-OS existant, dessine UNIQUEMENT l'onglet « Lancer un test » de la fiche du
personnage sur la tablette du joueur, téléphone 390 × 844, utilisable dès 360 px. Même DESIGN.md,
même langage que la tablette « Direct » jointe, sans barre latérale ni bandeau de bureau.
Décor fictif. Cibles tactiles ≥ 44 × 44 px, corps ≥ 14 px.

En tête de la fiche : « Lambert », Points de vie 4 / 4, et trois onglets : « Vue synthétique »,
« Lancer un test » (actif), « Ma fiche ». La navigation fixe de la tablette reste en pied, onglet
« Fiche » actif : Direct, Archives, PNJ, Lieux, Inventaire, Cartes ; Fiche, Notes, Messages,
Quitter. Le contenu défile au-dessus, rien n'est caché derrière.

Les mêmes étapes que sur le poste du meneur, en une colonne :
1. Composer : Attribut « Force (4) », Compétence « Fo_Combat rapproché (2) », Stress « Niveau de
   Stress (2) » ; « Réserve 6 = 4 + 2 », « Stress 2 ».
2. Préparer le test Alien, REPLIÉ par défaut, avec en résumé « Aucune arme · aide 0 · test
   simple » ; ouvert : Arme de la fiche, Bonus d'outil ou de talent, Modificateur de situation,
   Personnes qui aident, Rôle dans le test.
3. Le bouton « LANCER » pleine largeur, avec « Dés − 6 + » juste au-dessus.
4. Résultat : les huit dés sur deux rangées (5, 3, 6, 1, 1, 6, 6 et le dé de Stress 3 en
   pointillé), « RÉUSSITE », « 3 réussites / 1 requise », « +2 excédent » ; « Forcer le jet »,
   « Dépenser un Point de Récit (1) ».
5. Cartes repliables : « Dernier test Alien », « Stress et Panique », « Santé ».
C'est TOUT. N'ajoute rien : ni historique, ni statistique, ni fonction absente d'ici.
```

### 2b · Alien, iPad Air paysage 1180 × 820, même conversation

```text
Décline UNIQUEMENT ce même onglet en iPad Air paysage 1180 × 820, mêmes contenus et gestes.
Deux colonnes : à gauche Composer et Préparer (ouvert), à droite Lancer, le Résultat et les
cartes repliables. La navigation fixe reste en pied, sur une rangée de six puis une de quatre.
C'est TOUT. N'ajoute rien.
```

---

## Ce qui viendra après les maquettes

1. **Le déplacement en onglet**, sans changer le panneau : `CharacterSheetEditor.tsx` (onglets
   Formulaire / Lancer un test / Fiche du jeu) et `HubCharacterSheet.tsx` (Vue synthétique /
   Lancer un test / Ma fiche / groupe). Le panneau de jet reste monté et masqué, comme la fiche HTML
   aujourd'hui, pour ne pas perdre un réglage en changeant d'onglet.
2. **La refonte retenue**, appliquée à la partie commune de `PanneauDeJet.tsx`, les blocs de jeu
   rangés en cartes repliables. ⛔ **Un seul écrivain par fichier** : Codex travaille les blocs
   Alien de ce composant (lots A0 à A8) ; on s'entend avant d'y toucher.
3. Les captures du manuel des jeux (`e2e/capturesDesJeux.spec.ts`) montrent le panneau : elles
   seront refaites, et les pages `54-Jeu-…` relues.
4. ⛔ Avant de modifier `src/` : demander à David « GM-OS tourne-t-il ? ».

---

## Le passage du 22/10 — par l'API de Stitch

David, le 22/10 : *« 2 tu as mon accord »* — Claude Code appelle Stitch directement
(`https://stitch.googleapis.com/mcp`, clé `STITCH_API_KEY` de la machine, jamais écrite).
L'API ne prend pas d'image : les prompts envoyés décrivent la grammaire et les jetons au lieu de
les joindre ; ils sont conservés avec les réponses dans le dossier de travail de la session.
Système de design `assets/f715d3f70c644671a1bdf4670b677326` (celui des tablettes retenues).
Exports et rendus : `Stitch/onglet-test/` (ignoré par git), galerie `Stitch/onglet-test/index.html`.

| Écran | Identifiant Stitch | Corrections |
| --- | --- | --- |
| 1a · Alien, meneur | `1572f0cd1ab74dbd926b7ddc0990db2e` | Correctif demandé à Stitch, annoncé appliqué, **HTML inchangé** : « Calcul de base : » et « Détails & actions supplémentaires » retirés à la main |
| 1b · Nephilim, meneur | `7f5597559b284b1b9272ff13348ed099` | « 0 degré » ramené à « 0 » à la main. ⚠️ Stitch a mis les onglets dans la barre du haut (1a : sous la barre) — à trancher |
| 2a · Alien, téléphone | `e5618c416cbc4970966df266ba733ec1` → corrigé `8825eeb8f7234b8a9cc57aa7d9fd9405` | Par Stitch : « Étape 1/4 » retiré, étape 3 « Lancer », marge sous le contenu. Gardé : « Succès » / « Stress » sous les dés. Aucun débord à 360 px |
| 2b · Alien, iPad paysage | `07abb31091bc42e995a6cfff28922c15` | « Étape 1/4 » (revenu) et « Ouvert » retirés à la main |

**Leçons** : `edit_screens` peut annoncer une correction sans rien changer — comparer le nom du
fichier HTML avant et après (`get_screen`). Le rendu pleine page dessine la navigation fixe au
milieu : juger le téléphone à la taille de l'écran, haut et bas du défilement. Le Chromium que
Playwright réclame n'est pas installé : rendre avec `chromium-1217` (`executablePath`).
