# Les quatre personnalités en valeurs — étape T2.3

**Pour** : David et Claude Code, avant la phase 1 de la refonte
([plan](../../2026-09-17-refonte-interface.md), § 4 et § 5). **Le 2026-09-27.**

T2.3 traduit chaque direction de Stitch en **valeurs C0 seulement** : aucune structure, aucun
composant repris. Les valeurs sont écrites **dans le vocabulaire du contrat des thèmes de jeu**
(`--rpg-*`, [cahier v1.3](../../../Architecture/Cahier-des-charges-theme-de-jeu.md)). La
décision D3 le veut ainsi : *un thème de base est le paquet par défaut, un thème de jeu le
surcharge — un seul mécanisme*.

| Fichier | Verdict du validateur |
| --- | --- |
| [`moderne.theme.css`](./moderne.theme.css) | ✅ accepté |
| [`cyberpunk.theme.css`](./cyberpunk.theme.css) | ✅ accepté, sans avertissement |
| [`medieval.theme.css`](./medieval.theme.css) | ✅ accepté, sans avertissement |
| [`clair.theme.css`](./clair.theme.css) | ✅ accepté |

⚠️ **Rien ici n'est lu par GM-OS.** Ces fichiers sont une fiche de valeurs. Les faire entrer dans
`themeDeLInterface.ts` est la phase 1 (T1.5), qui touche `src/`.

## Comment les valeurs ont été relevées

- **Dans le navigateur, pas dans la configuration Tailwind.** Les exports Moderne et Clair portent
  la configuration du projet Stitch (le Cyberpunk du `DESIGN.md` importé) : leurs vraies couleurs
  sont dans des classes écrites en dur. Claude Code a donc affiché chaque HTML à 1440 px et mesuré
  les styles calculés, pondérés par la surface (fonds, bordures) ou par le nombre de caractères
  (texte, polices).
- **Puis vérifiées par le validateur des thèmes de jeu** (`src/theme/validationDuTheme.ts`) :
  contrastes, formats, bornes, distance entre les couleurs d'état.

**Ce que Claude Code a changé par rapport au relevé brut**

| Thème | Changement | Pourquoi |
| --- | --- | --- |
| Cyberpunk | `surface` #060c1a, `surface-2` #0d162d, opaques | Stitch les pose en `rgba` (0.82, 0.8) ; le contrat interdit la transparence sur ces jetons |
| Clair | Polices en **Inter** | Demandé à Stitch, qui a gardé Plus Jakarta Sans — et Moderne l'emploie déjà |
| Clair, Moderne | `warning` #a16207, `info` distinct de l'accent | Le validateur jugeait danger et alerte, ou succès et info, trop proches |
| Médiéval | `accent` **#7a5c20** (laiton foncé) au lieu de l'or #c59b27 | L'or de Stitch fait 1,9 de contraste sur le parchemin ; le minimum est 3 |
| Médiéval | `warning` #b04f00, `info` #3d3a82 (encre indigo) | Distincts de l'accent, du danger et du succès |

## Ce que le contrat ne savait pas dire — trois limites

### 1 · Le cadre — deux polarités sur un même écran ✅ tranché le 2026-09-27

**Médiéval** pose un **cadre de bois sombre** (barre latérale, bandeau) autour d'un **contenu en
parchemin clair**. **Moderne** pose des **cartes blanches** sur un fond et un cadre **ardoise**.

Le contrat n'a **qu'une couleur de texte**, lisible sur `bg` et sur `surface` (§ 4.1, le piège de la
page de livre). Un texte clair pour le bois est illisible sur le parchemin, et l'inverse.

**Ce que ça coûte de l'ignorer** : sans cadre, **Moderne et Clair deviennent presque le même
thème** — même blanc, même texte, même accent bleu. Seuls les arrondis et la police les
distinguent, et la garde de distinction de la phase 1 le refuserait. Et le Médiéval perd son bois.

✅ **David a retenu le cadre** : trois jetons de plus, **V2**, § 4.8 du **contrat v1.3**. Médiéval
et Moderne les déclarent ; Cyberpunk et Clair n'en ont pas besoin — leur cadre suit le contenu.

| Jeton | Rôle | Médiéval | Moderne | Cyberpunk | Clair |
| --- | --- | --- | --- | --- | --- |
| `--rpg-frame-bg` | Fond de la barre latérale et du bandeau du haut | #160e07 | #0b1120 | = `bg` | = `bg` |
| `--rpg-frame-text` | Texte du cadre | #e5d5b8 | #e2e8f0 | = `text` | = `text` |
| `--rpg-frame-accent` | Élément actif du cadre | #d4af37 | #60a5fa | = `accent` | = `accent` |

Absents, ils valent `bg`, `text` et `accent` : **aucun thème de jeu existant ne change** (les six
passent toujours le validateur). Le validateur mesure `frame-text` sur `frame-bg` (4.5 au moins)
et `frame-accent` sur `frame-bg` (3) ; ⛔ **sans `frame-text`, il mesure `text` sur le cadre** —
ce que l'écran montrera, pas ce que le thème a déclaré.

⚠️ **David doit mettre à jour le cahier dans RPG Theme Builder** (ChatGPT) : la copie du dépôt,
`outils/rpg-theme-builder/skills/instructions/references/`, est déjà en v1.3.

### 2 · Les coins coupés du Cyberpunk

Stitch découpe les coins à 45° (`clip-path`). Le contrat connaît l'arrondi, pas la découpe.
**Deux voies** : l'ornement `coin` (un SVG, § 8 — déjà prévu, rien à ajouter au contrat), ou un
jeton de forme `--rpg-corner: round | cut`. L'ornement suffit pour une première version.

### 3 · La taille des motifs

La grille de points du Cyberpunk a besoin d'une taille de répétition (24 px) : un dégradé CSS
seul remplit tout le panneau. **Pas de jeton à ajouter** : le contrat recommande déjà un SVG
répétable (§ 7). À dessiner à l'intégration, comme le grain du parchemin.

**Les coins en laiton du Médiéval** entrent, eux, dans l'ornement `coin` existant.

## Ce qui reste

1. **Phase 1** : les échelles (T1.1 à T1.7), puis ces valeurs dans `themeDeLInterface.ts` (T1.5),
   avec la garde de distinction.
2. **Les SVG** : grille du Cyberpunk, grain du parchemin, coins en laiton, coins coupés.
3. **T2.4** : juger dans l'application réelle, avec les sept campagnes.
