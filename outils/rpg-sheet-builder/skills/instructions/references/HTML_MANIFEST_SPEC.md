# Character Sheet Studio — HTML Manifest v1

Un fichier HTML peut être importé comme modèle éditable dans Character Sheet Studio V1.1 s’il contient un bloc JSON invisible avec l’identifiant `character-sheet-template`.

## Bloc obligatoire

```html
<script type="application/json" id="character-sheet-template">
{
  "format": "character-sheet-studio-html",
  "formatVersion": 1,
  "template": {
    "id": "mon-modele",
    "name": "Nom du modèle",
    "system": "Nom du jeu",
    "accent": "#2f9f92",
    "schemaVersion": 2,
    "customCss": "",
    "pages": []
  }
}
</script>
```

Le bloc peut se trouver dans `<head>` ou `<body>`. Character Sheet Studio lit uniquement le JSON ; il n’exécute pas le JavaScript de l’HTML lors de l’import.

## Pages

Chaque page doit contenir :

```json
{
  "id": "page-1",
  "label": "Page 1",
  "width": 595.276,
  "height": 841.89,
  "orientation": "portrait",
  "background": "page-1.png",
  "backgroundData": "data:image/png;base64,...",
  "fields": []
}
```

`backgroundData` est obligatoire pour un HTML portable. Les formats PNG, JPEG et WebP sont acceptés.

## Zone standard

```json
{
  "key": "identity.name",
  "label": "Nom",
  "type": "text",
  "x": 63,
  "y": 51.5,
  "w": 154,
  "h": 13,
  "className": "name-field"
}
```

Types supportés :

- `text`
- `textarea`
- `number`
- `checkbox`
- `select`
- `tracker`
- `portrait`
- `hotspot`

Les alias `image`, `tracker-cell`, `trackerCell`, `hotspot-cell` et `clickzone` sont normalisés à l’import.

## Valeur calculée

```json
{
  "key": "attributes.strength.half",
  "type": "number",
  "x": 100,
  "y": 100,
  "w": 20,
  "h": 10,
  "readonly": true,
  "derive": {
    "source": "attributes.strength",
    "operation": "floor-divide",
    "divisor": 2
  }
}
```

Opérations supportées :

- `floor-divide`
- `round-divide`
- `copy`

## Zone cliquable / piste

`hotspot` sert quand les nombres ou cases sont déjà imprimés sur le fond et doivent être cliquables individuellement.

```json
{
  "key": "trackers.sanity",
  "label": "Santé mentale 42",
  "type": "hotspot",
  "value": 42,
  "x": 312,
  "y": 188,
  "w": 11,
  "h": 12,
  "className": "san-cell"
}
```

Plusieurs hotspots peuvent partager la même `key` avec des `value` différentes. Un seul est actif à la fois.

## Compteur régulier

Pour une rangée régulière qui peut être générée automatiquement :

```json
{
  "key": "stress",
  "type": "tracker",
  "x": 100,
  "y": 200,
  "w": 180,
  "h": 20,
  "min": 0,
  "max": 10,
  "trackerStyle": "boxes"
}
```

Pour une piste irrégulière ou multi-lignes, utiliser plusieurs `hotspot`.

## Portrait

```json
{
  "key": "portrait",
  "type": "portrait",
  "x": 400,
  "y": 50,
  "w": 80,
  "h": 100,
  "fit": "cover"
}
```

## Liste déroulante

```json
{
  "key": "identity.gender",
  "type": "select",
  "x": 100,
  "y": 100,
  "w": 90,
  "h": 20,
  "options": ["F", "M", "Autre"]
}
```

## CSS spécifique au modèle

`template.customCss` permet de conserver le rendu fin du modèle GPT après import dans Character Sheet Studio.

Il est recommandé de préfixer les sélecteurs :

```css
.sheet[data-template="mon-modele"] .name-field {
  font: 8px Georgia, serif;
  color: #111;
}
```

Éviter les sélecteurs globaux `body`, `html`, `.topbar`, `.sidebar`, etc. et les `@import`.

## Compatibilité simplifiée

L’importeur accepte aussi certains noms utilisés naturellement par des générateurs :

- `id` au lieu de `key` ;
- `left/top/width/height` au lieu de `x/y/w/h` ;
- `cls` au lieu de `className` ;
- `readOnly` au lieu de `readonly` ;
- `derived_from` au lieu de `derive.source` ;
- une liste globale `template.fields` avec une propriété `page`.

Pour obtenir le meilleur résultat, utiliser toutefois le format canonique ci-dessus.

## Règle pour le GPT

Tout HTML destiné à Character Sheet Studio doit :

1. rester autonome et utilisable directement dans un navigateur ;
2. contenir le manifeste `character-sheet-template` ;
3. inclure tous les fonds de page dans `backgroundData` ;
4. décrire toutes les zones avec leurs coordonnées natives exactes ;
5. inclure les calculs dans `derive` ;
6. utiliser `hotspot` pour les pistes imprimées irrégulières ;
7. inclure dans `customCss` les styles nécessaires pour conserver le rendu après import.
