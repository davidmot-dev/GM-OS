# RPG Theme Builder — Méthodologie

> ⚠️ **Portée de ce document : le SDK de thèmes**, ses composants `.rpg-*` et sa page de
> démonstration. Les fiches de personnage de GM-OS sont **indépendantes des thèmes** et ne sont
> pas concernées. **Pour l'interface de GM-OS, le
> [cahier des charges](Cahier-des-charges-theme-de-jeu.md) prévaut** sur tout ce qui suit :
> emplacement et livrables (§ 10 ci-dessous), jetons supplémentaires, formats de couleur,
> contrastes mesurés **sur le fond** et pas seulement sur la page. En cas de conflit, c'est lui
> qui a raison.

## 1. Objectif

Le système de thèmes doit permettre à une même application de fiches de personnage JdR de changer instantanément d'identité visuelle sans modifier sa structure HTML ni sa logique métier.

Chaque thème est un **skin** appliqué à une API CSS commune.

Exemples de thèmes existants :

- ALIEN
- NOC
- Star Trek Adventures

L'ajout d'un nouveau jeu doit suivre exactement le même contrat.

---

## 2. Principe fondamental

Le HTML fonctionnel de l'application reste identique quel que soit le jeu.

Exemple :

```html
<section class="rpg-panel">
  <h2 class="rpg-section-title">Compétences</h2>
  <button class="rpg-button">Ajouter</button>
</section>
```

Le thème est sélectionné au niveau racine :

```html
<html data-theme="alien">
```

ou :

```html
<html data-theme="noc">
```

ou :

```html
<html data-theme="startrek">
```

Un nouveau thème doit donc être activable uniquement par une valeur supplémentaire de `data-theme`.

---

## 3. Architecture recommandée

```text
ui/
├── rpg-core.css
├── rpg-theme-switcher.js
└── themes/
    ├── alien.css
    ├── noc.css
    ├── star-trek.css
    └── nouveau-theme.css
```

### `rpg-core.css`

Contient :

- reset CSS ;
- structure générale ;
- layout ;
- composants fonctionnels ;
- variables sémantiques par défaut ;
- responsive commun.

Il ne doit contenir aucune identité visuelle propre à un jeu.

### `themes/*.css`

Chaque fichier contient uniquement :

1. les valeurs de variables du thème ;
2. les adaptations visuelles spécifiques nécessaires ;
3. aucune logique métier ;
4. aucun nouveau composant fonctionnel concurrent.

---

## 4. Contrat CSS commun

Les composants suivants doivent rester génériques :

```text
.rpg-app
.rpg-shell
.rpg-page
.rpg-header
.rpg-footer

.rpg-kicker
.rpg-title
.rpg-section-title
.rpg-subtitle
.rpg-body
.rpg-mono

.rpg-panel
.rpg-callout
.rpg-callout__cap

.rpg-button
.rpg-input
.rpg-select
.rpg-textarea

.rpg-list
.rpg-grid
.rpg-stack
.rpg-rule
.rpg-page-chip
```

Pour les fiches de personnage, le système peut ensuite être étendu avec :

```text
.rpg-character-sheet
.rpg-stat
.rpg-stat-value
.rpg-meter
.rpg-checkbox
.rpg-skill
.rpg-portrait
.rpg-inventory
.rpg-tabs
.rpg-table
.rpg-modal
.rpg-tooltip
.rpg-notes
```

Un thème ne doit pas créer des variantes comme :

```text
.alien-button
.noc-button
.startrek-button
```

Il doit utiliser :

```css
:root[data-theme="alien"] .rpg-button { ... }
```

---

## 5. Variables obligatoires

Chaque thème doit définir au minimum :

### Couleurs

```css
--rpg-bg
--rpg-surface
--rpg-surface-2
--rpg-paper
--rpg-ink
--rpg-text
--rpg-muted
--rpg-accent
--rpg-accent-2
--rpg-accent-contrast
--rpg-border
--rpg-border-soft
```

### Typographie

```css
--rpg-font-display
--rpg-font-body
--rpg-font-ui
--rpg-font-mono
```

### Formes

```css
--rpg-radius-sm
--rpg-radius-md
--rpg-radius-lg
--rpg-shadow
--rpg-title-tracking
--rpg-kicker-tracking
```

---

## 6. Analyse d'un nouveau jeu

Le GPT reçoit idéalement 3 à 10 captures représentatives.

Il analyse successivement :

### 6.1 Palette

Identifier :

- couleur de fond principale ;
- surfaces secondaires ;
- couleur du papier ;
- couleur du texte ;
- accents ;
- bordures ;
- couleurs d'état éventuelles.

Les valeurs doivent être estimées à partir des captures puis regroupées dans les variables sémantiques.

### 6.2 Typographie

Identifier séparément :

- gros titres ;
- titres secondaires ;
- corps de texte ;
- éléments techniques ;
- chiffres et labels.

Si la police exacte n'est pas identifiable, utiliser une alternative libre visuellement proche et l'indiquer clairement.

### 6.3 Formes

Analyser :

- rayons de bordure ;
- angles coupés ;
- cadres ;
- épaisseur des traits ;
- cartouches ;
- séparateurs ;
- géométrie dominante.

### 6.4 Texture et ambiance

Identifier :

- papier ;
- grain ;
- scanlines ;
- bruit ;
- métal ;
- parchemin ;
- interface technique ;
- motifs géométriques ;
- transparence ;
- ombres.

Privilégier CSS pur. Utiliser des assets externes uniquement lorsqu'ils sont réellement nécessaires.

### 6.5 Composants

Mapper les éléments observés vers les composants génériques existants.

Exemple :

```text
encadré de règle -> .rpg-callout
cartouche de chapitre -> .rpg-kicker
cadre principal -> .rpg-panel
bouton de l'application -> .rpg-button
```

---

## 7. Règle d'intégration

Un nouveau thème doit fonctionner sur le HTML de démonstration de référence **sans aucune modification du DOM**.

Le changement doit être obtenu uniquement par :

```js
document.documentElement.dataset.theme = "nouveau-theme";
```

Cette règle est le test de compatibilité principal.

---

## 8. Format d'un thème

Exemple minimal :

```css
:root[data-theme="blade-runner"] {
  --rpg-bg: #080a0a;
  --rpg-surface: #171918;
  --rpg-paper: #d8d2c5;

  --rpg-ink: #181817;
  --rpg-text: #ece8dd;
  --rpg-muted: #8d8a82;

  --rpg-accent: #d56c39;
  --rpg-accent-2: #617c78;

  --rpg-font-display: "Nom Police", sans-serif;
  --rpg-font-body: "Nom Police", serif;
}
```

Puis uniquement les adaptations nécessaires :

```css
:root[data-theme="blade-runner"] .rpg-panel {
  /* apparence spécifique */
}

:root[data-theme="blade-runner"] .rpg-callout {
  /* apparence spécifique */
}
```

---

## 9. Manifest optionnel

Chaque thème peut disposer d'un fichier `theme.json` :

```json
{
  "id": "blade-runner",
  "name": "Blade Runner RPG",
  "version": "1.0.0",
  "css": "themes/blade-runner.css"
}
```

L'application peut utiliser ces fichiers pour générer automatiquement le sélecteur.

---

## 10. Livrables attendus du GPT

Pour chaque nouveau thème, produire :

```text
nom-du-theme.css
theme.json
preview.html
```

### CSS

Le vrai thème destiné à l'application.

### JSON

Métadonnées nécessaires au registre.

### Preview

Page de démonstration utilisant uniquement les composants `rpg-*`.

La preview ne doit pas introduire de structure spéciale indispensable au thème.

---

## 11. Contrôle qualité

Avant livraison, vérifier :

- aucun sélecteur spécifique remplaçant les classes `rpg-*` ;
- aucun changement de structure HTML obligatoire ;
- toutes les variables essentielles sont définies ;
- texte lisible ;
- contraste suffisant ;
- composants utilisables en desktop ;
- comportement acceptable en mobile ;
- hover/focus visibles ;
- champs de formulaire lisibles ;
- aucune dépendance à une image absente ;
- changement de thème sans rechargement ;
- changement de thème sans déplacement majeur du layout.

---

## 12. Test de non-régression

Tester successivement le même HTML avec :

```js
RPGTheme.set("alien");
RPGTheme.set("noc");
RPGTheme.set("startrek");
RPGTheme.set("nouveau-theme");
```

La structure, les valeurs des champs et les fonctionnalités doivent rester intactes.

Seul le rendu visuel doit changer.

---

## 13. Workflow recommandé avec le GPT spécialisé

### Entrée utilisateur

L'utilisateur fournit :

- nom du jeu ;
- captures ou pages de référence ;
- éventuellement le PDF du livre ;
- éventuellement des préférences particulières.

### Étape 1 — Analyse

Le GPT décrit brièvement :

- palette ;
- typographie ;
- formes ;
- textures ;
- composants distinctifs.

### Étape 2 — Mapping

Le GPT associe ces caractéristiques au contrat `rpg-*`.

### Étape 3 — Génération

Le GPT produit le CSS, le manifest et la preview.

### Étape 4 — Validation

Le GPT vérifie la compatibilité avec `rpg-core.css`.

### Étape 5 — Livraison

Il remet les fichiers prêts à copier dans le dossier `themes/`.

---

## 14. Principe de maintenance

Le **core** évolue lentement.

Les **thèmes** évoluent indépendamment.

Si un nouveau composant fonctionnel est nécessaire, par exemple `.rpg-meter`, il doit d'abord être ajouté au contrat commun. Ensuite chaque thème peut le styliser.

Un thème ne doit jamais résoudre un problème fonctionnel en inventant sa propre structure.

---

## 15. Résultat recherché

À terme, l'application doit pouvoir proposer :

```text
Apparence
[ ALIEN ▼ ]

ALIEN
NOC
Star Trek Adventures
Blade Runner
L'Appel de Cthulhu
RuneQuest
...
```

Le changement doit être quasi immédiat, sans rechargement de la fiche et sans modifier les données de personnage.
