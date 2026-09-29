# Refonte de l'interface — le plan de la phase 3

**Pour** : David, qui le relit avant qu'on code, et Claude Code, qui l'exécute. **Le 2026-09-30.**

Détaille le § 6 du [plan de la refonte](./2026-09-17-refonte-interface.md) (« Les primitives »), à
la lumière de ce qui est acquis depuis : les **personnalités adoptées** (T2.5), le **contrat v1.4**
et ses jetons « LU ⚙ », la **grammaire d'écran** retenue avec Stitch
([`stitch/grammaire/DESIGN.md`](./stitch/grammaire/DESIGN.md)), et le premier thème de jeu qui
livre des **ornements** (Cthulhu Hack).

## 0 · En une phrase

À la fin de la phase 3, GM-OS a **un socle** — six composants et un gabarit d'écran — qui sont
**les seuls à connaître la forme, le relief, la matière et les ornements**, et qui les lisent dans
le thème. **Aucun module ne les emploie encore** : la migration est la phase 4, et son premier lot
(Combat, Dés, Image) éprouvera le socle.

## 1 · Où on part — vérifié le 2026-09-30

- `src/components/common/` ne compte que trois fichiers (`ErrorBoundary`, `LoadingOverlay`,
  `Select`) : **aucune primitive n'existe**.
- Les jetons que le socle doit lire **existent déjà en variables**, posées par la phase 1 :
  `--rayon-*`, `--elev-*` (via `rounded-*` et `shadow-*`), `--bordure-largeur/style`,
  `--titre-espacement`, `--surtitre-espacement`, `--titre-casse`, `--texture-panneau`,
  `--app-surface-2`, `--app-accent-contrast`, `--app-border-soft`, `--etat-*`. Plusieurs sont
  encore **V2** parce que rien ne les lisait : le socle sera leur premier lecteur.
- **Les ornements** (§ 8 du cahier) : quatre emplacements, `entete`, `coin`, `separateur`, `fond`,
  en SVG `currentColor`. **Rien ne les charge ni ne les affiche.** Cthulhu Hack en livre quatre.

## 2 · Les trois principes

1. **Le socle lit des jetons, jamais des valeurs.** Toute forme passe par un jeton, avec un repli
   quand le thème ne dit rien — *la plupart des jeux n'auront jamais de thème, c'est le cas
   normal.* Décidé après, il faudrait rouvrir les six composants.
2. **Rien ne change à l'écran pendant la phase 3.** Le socle est neuf et personne ne l'emploie :
   les 40 captures de référence ne bougent pas. On le voit dans **une vitrine** (P3.8).
3. **La grammaire, pas le style.** Le gabarit porte la *disposition* commune (en-tête, outils,
   travail, réglages à droite) ; l'*allure* vient du thème. Les arêtes à zéro et les halos cyan de
   Stitch sont la personnalité Cyberpunk, pas la grammaire.

## 3 · Les étapes

Chaque étape est un commit, avec son essai unitaire. Avant chaque séance : *« GM-OS tourne-t-il ? »*.

| Étape | Contenu |
| --- | --- |
| **P3.1 · Les ornements** | Le **chargeur** : `ornements.json` du jeu lu par `readDoc`, chaque SVG incorporé en `data:` (comme les matières), confiné au dossier `theme/`, **les règles SVG du cahier revérifiées** (`viewBox`, pas de script ni d'`on…`, 50 Ko). Les ornements **des thèmes de base** : le laiton du Médiéval, la coupe à 45° du Cyberpunk (valeurs de T2.3), dessinés en SVG. Tout sous l'**interrupteur des personnalités** |
| **P3.2 · `<Panneau>`** | Trois niveaux (posé, flottant, dialogue → `shadow-*`, donc `--elev-*`), l'arrondi de sa famille, l'épaisseur et le style de bordure, la **matière de panneau** (`--texture-panneau`), l'ornement **`coin`** (retourné aux quatre angles) et **`fond`** en filigrane quand il est vide. Un panneau n'est orné **que si on le lui demande** (`orne`) : un écran qui orne tout n'orne rien |
| **P3.3 · `<Bouton>`** | Neutre, accent, succès, danger ; repos, survol, actif, désactivé ; **anneau de focus visible** ; le texte sur l'accent lit `--app-accent-contrast`. Cible de 44 px, 48 px en régime Table |
| **P3.4 · `<Tuile>`** | La carte cliquable, **à taille fixe** — ce qu'on y ajoute pousse ce qui y était ; l'état actif en bordure pleine et halo |
| **P3.5 · `<Jauge>`** | **Purement visuelle** : une fraction et un ton, rail de 8 px, vert → ambre → rouge sous 25 % par défaut. ⚠️ Une jauge a cinq lecteurs dans ce dépôt, dont l'Ulanzi : **la primitive n'en touche aucun**, ni les quatre drapeaux, ni le code couleur en fractions de course |
| **P3.6 · `<Etiquette>`, `<EnTeteDeModule>`** | La pastille d'état (les quatre `--etat-*`, jamais sous 11 px) ; le titre de module (police des titres, `--titre-espacement`, `--titre-casse`), son surtitre (`--surtitre-espacement`), sa ligne d'état, et l'ornement **`entete`** dessous |
| **P3.7 · `<GabaritDeModule>`** | La grammaire d'écran : **en-tête**, **barre d'outils** (action principale en bouton plein), **zone de travail**, **panneau de réglages à droite** (~300 px), et le **séparateur** orné entre sections. En régime Table : espacements élargis, réglages repliables |
| **P3.8 · La vitrine du socle** | Un écran qui montre chaque composant dans toutes ses variantes, **sous le thème et le jeu actifs** — et ses captures, pour les quatre thèmes de base et un jeu à ornements |
| **P3.9 · Le contrat v1.5** | Les jetons que le socle lit désormais passent de V2 à **LU ⚙**, et **les ornements aussi** : cahier, contrat en données, essais, copie de RPG Theme Builder (**à recharger dans ChatGPT**) |

## 3 bis · ✅ Fait le 2026-09-30 — P3.1 à P3.9

- **P3.1** `src/theme/ornements.ts` : le chargeur (`ornements.json` → SVG vérifiés → `data:`), la
  vérification du § 8 **partagée avec le validateur** (`problemesDuSvg`), les coins des thèmes de
  base (laiton, coupe à 45°). Posés en variables `--orne-*` par `appliquerLeTheme`, **sous
  l'interrupteur** ; sous un jeu, **seuls ses ornements** (jamais le laiton autour d'un autre univers).
- **P3.2–P3.7** `src/components/socle/` : `Ornement` (un masque sur l'accent, caché sans ornement),
  `Panneau`, `Bouton`, `Tuile`, `Jauge`, `Etiquette`, `EnTeteDeModule`, `GabaritDeModule` et
  `Separateur`. 33 essais ; **garde « zéro couleur brute »** sur le socle (`couleursBrutes.test.ts`).
- **P3.8** la vitrine : `Ctrl+K` → « vitrine » ; captures `e2e/vitrineDuSocle.spec.ts` →
  `e2e-resultats/socle/` (quatre thèmes, et chaque jeu à ornements).
- **P3.9** **contrat v1.5 : plus aucun jeton V2** — les treize derniers passent à LU ⚙, les
  ornements aussi. Cahier et copie de RPG Theme Builder à jour — **à recharger dans ChatGPT**.
- ⭐ **Ce que la vitrine a trouvé** : sous Cthulhu Hack (clair) et une personnalité sombre, la
  `surface-2`, le texte sur l'accent et les états venaient de la base — tuiles bleu nuit sur de
  l'ivoire. Réglé deux fois : le jeu les pilote désormais (v1.5), et un jeu d'une autre clarté qui
  ne les déclare pas les tire de ses propres couleurs.
- ⚠️ **Piège des essais** : changer de campagne **rétablit le thème retenu pour elle** — régler le
  thème APRÈS l'avoir activée.
- **Les 40 références n'ont pas bougé** : aucun module n'emploie encore le socle.

## 4 · Ce que la phase 3 ne fait PAS

- **Elle ne migre aucun module** : c'est la phase 4, lot L1 d'abord (Combat, Dés, Image), puis on
  rejoue une séance avant de continuer.
- **Elle ne touche pas aux 51 branches `theme === 'medieval'`** ni aux couleurs en dur des
  modules : elles tombent module par module, en phase 4.
- **Pas d'icônes de jeu** (V4) : phase 6.

## 5 · Les décisions de David — ✅ tranchées le 2026-09-30

1. ✅ **Un écran dans GM-OS**, ouvert depuis la palette, plus des captures.
2. ✅ **Avec parcimonie**, comme proposé ci-dessous.
3. ✅ **Dès P3.1.**

*Ce qui était proposé :*

1. **La vitrine du socle** : un écran de GM-OS (ouvert depuis la palette, `Ctrl+K`) pour la voir
   sous n'importe quel thème et n'importe quel jeu — ou seulement des captures ?
2. **Où poser les ornements** : proposé ici — le `coin` sur les panneaux marqués `orne` (un ou
   deux par écran), l'`entete` sous chaque titre de module, le `separateur` entre les sections du
   panneau de réglages, le `fond` dans un panneau vide.
3. **Les ornements des thèmes de base** : le laiton du Médiéval et la coupe du Cyberpunk, dessinés
   dès P3.1 — ou plus tard ?
