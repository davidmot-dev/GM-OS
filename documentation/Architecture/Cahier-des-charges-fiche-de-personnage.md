# Cahier des charges — fiche de personnage pour GM-OS

**Version 1.0 — 2026-10-13.** Pour *Character Sheet HTML Studio*, le constructeur de fiches dans
ChatGPT, et pour Claude Code qui dépose, valide et branche les fiches. La boucle de travail est
commune aux deux constructeurs : [`Flux-des-constructeurs.md`](./Flux-des-constructeurs.md) ; les
spécificités du chantier : [`Pipeline-des-fiches.md`](./Pipeline-des-fiches.md).

**Ce cahier est la source de vérité.** Il l'emporte sur les instructions du constructeur, sur ses
fichiers de connaissance et sur toute habitude. Le validateur le fait respecter :

```text
npm run fiche:valider -- <Jeu>      le rapport, prêt à coller dans ChatGPT
npm run fiche:valider -- --tous     le verdict de chaque fiche du dépôt
```

Chaque règle du rapport cite son paragraphe : `[§ 6]` renvoie au § 6 ci-dessous. Une **erreur**
refuse la fiche ; un **avertissement** la laisse passer et dit ce qui serait mieux.

---

## § 1 · Ce que GM-OS fait d'une fiche

La fiche HTML est **un outil d'immersion des joueurs** : ils la remplissent sur leur tablette, le
meneur la voit dans son cockpit. GM-OS ne lit pas le HTML lui-même :

1. le **moteur de fiches** (`docs/fiches/Character_Sheet_Manager.html`) importe le **manifeste**
   de la fiche (§ 2) — ses pages et ses champs — et dessine la fiche à partir de lui ;
2. GM-OS parle au moteur et lit les **clés de données** des champs (`identity.name`,
   `skills.0.level`…) ;
3. une **table de correspondance** (`docs/systems/<jeu>/fiche/correspondance.json`, § 7) traduit
   ces clés vers les champs de la fiche du jeu dans GM-OS — c'est ainsi que ce qu'un joueur
   saisit arrive dans le jet de dés, la santé, le combat.

Conséquence : **ce qui compte pour GM-OS, c'est le manifeste et ses clés.** Le reste du HTML (sa
mise en page, son zoom, son export) sert la fiche quand on l'ouvre seule dans un navigateur.

## § 2 · Le manifeste — obligatoire

Toute fiche porte un bloc JSON invisible, dans `<head>` ou `<body>` :

```html
<script type="application/json" id="character-sheet-template">
{
  "format": "character-sheet-studio-html",
  "formatVersion": 1,
  "template": {
    "id": "blade-runner-fr",
    "name": "Blade Runner — fiche de personnage",
    "system": "Blade Runner",
    "accent": "#2f9f92",
    "schemaVersion": 2,
    "customCss": "",
    "pages": []
  }
}
</script>
```

| Champ | Règle |
| --- | --- |
| `format` | **Exactement** `"character-sheet-studio-html"` |
| `formatVersion` | **Exactement** `1` |
| `template.id` | Minuscules, chiffres et tirets (`blade-runner-fr`). **Il ne change JAMAIS** d'une version à l'autre de la même fiche (§ 6) |
| `template.name` | Le nom que le meneur voit dans la liste des modèles |
| `template.system` | Le nom du jeu — recommandé |
| `template.customCss` | Les styles qui gardent le rendu fin après import ; sélecteurs préfixés par `.sheet[data-template="<id>"]`, jamais `body`, `html` ni `@import` |

⚠️ **Les deux fiches de référence du constructeur (Alien, L'Appel de Cthulhu 7) n'ont pas de
manifeste** : elles montrent le niveau de fidélité attendu, **pas** la forme de la livraison. Le
format complet du manifeste est dans `HTML_MANIFEST_SPEC.md` ; ce cahier dit ce qui y est exigé.

## § 3 · Les pages

Chaque page déclare ses **dimensions natives** (`width`, `height`, des nombres positifs — celles du
PDF) et **intègre son image de fond** :

```json
{ "id": "page-1", "label": "Page 1", "width": 612, "height": 792,
  "backgroundData": "data:image/png;base64,…", "fields": [] }
```

`backgroundData` est **obligatoire** et commence par `data:image/png`, `data:image/jpeg` ou
`data:image/webp`. Une image référencée par un chemin (`page-1.png`) ne voyage pas avec la fiche.

## § 4 · Les champs

Chaque champ a une `key`, un `type` et sa géométrie `x`, `y`, `w`, `h` **en coordonnées natives de
la page**, à l'intérieur de celle-ci.

| Type | Usage |
| --- | --- |
| `text`, `textarea`, `number` | Saisie libre |
| `checkbox` | Une case **indépendante** (« blessé », « équipé ») |
| `select` | Un choix dans une liste — déclare ses `options` |
| `hotspot` | Une case ou un nombre **imprimé** qu'on clique — porte la `value` qu'il pose |
| `tracker` | Une rangée régulière générée (`min`, `max`) |
| `portrait` | L'image du personnage |

Les alias `image`, `tracker-cell`, `trackerCell`, `hotspot-cell` et `clickzone` sont acceptés : le
moteur les ramène à `portrait` ou `hotspot`.

**Une clé, un champ** — sauf les **hotspots d'une même piste**, qui partagent leur clé avec des
`value` toutes différentes. La nature de la `value` décide du comportement, et **une piste est l'un
ou l'autre, jamais les deux** :

- un **nombre** fait une **jauge** : cliquer 6 allume toutes les cases jusqu'à 6 (stress, santé) ;
- un **texte** fait un **choix** : seule la case égale s'allume (un dé de ressource `"d8"`).

⭐ **Une piste imprimée se fait en hotspots, pas en cases à cocher numérotées.** `stress.1` …
`stress.10` en `checkbox` donnent dix valeurs que GM-OS doit recompter ; dix hotspots de valeur 1
à 10 sous la clé `stress` donnent **un nombre**. Le validateur le signale par un avertissement.

**Une valeur calculée** déclare `derive` : `source` (la clé d'un autre champ) et `operation`
(`floor-divide`, `round-divide` ou `copy`). N'invente aucune règle : un calcul n'existe que s'il est
imprimé sur la fiche ou fourni.

**Les clés se nomment** en minuscules, par groupe, avec des points : `identity.name`,
`attributes.strength`, `skills.0.level`, `weapons.1.damage`, `tracks.stress`. Les noms restent
ceux de la fiche, traduits en anglais court et stable.

## § 5 · L'autonomie

**Migration d'anciennes cases (NOC, 25/10/2026).** Pour convertir une série de cases en piste
numérique sans retirer de clés (§ 6), le modèle peut déclarer `legacySeries` :
`{"tracks.vecu":["tracks.vecu.1","tracks.vecu.2"]}`. Les anciennes cases restent des champs
`checkbox`, avec `legacy: true`, masquées par le style propre au modèle. Les hotspots visibles
partagent la nouvelle clé numérique. Si celle-ci manque, le moteur compte les anciennes cases
cochées ; ensuite le nombre fait foi et les anciennes clés sont synchronisées. Le HTML autonome
doit appliquer la même migration aux sauvegardes et imports. Le validateur vérifie les deux côtés
de cette déclaration ; une case simplement marquée `legacy` n'échappe pas aux contrôles.

La fiche fonctionne **hors ligne**, sur une tablette sans Internet : **aucune** ressource chargée
depuis le réseau — ni script, ni feuille de style, ni police, ni image (`http://`, `https://`,
`//…`, `@import url(…)`). Tout est intégré dans le HTML.

La fiche **reste utilisable seule** dans un navigateur (décision de David, 2026-10-13) : zoom,
navigation entre pages, mode « Zones », sauvegarde locale, export et import JSON, réinitialisation,
impression — comme le décrivent les instructions du constructeur. Ces fonctions ne sont **pas**
contrôlées par le validateur : GM-OS ne les utilise pas, il passe par le moteur.

## § 6 · Les clés sont un contrat

⛔ **Une clé ne se renomme jamais.** Les personnages déjà remplis rangent leurs valeurs sous ces
clés, et la correspondance avec GM-OS les cite : une clé renommée, c'est une valeur perdue et un
champ qui ne remonte plus — **en silence**. C'est arrivé le 2026-08-24 avec les niveaux de
Blade Runner.

Quand une fiche est **régénérée** (corrigée, recalée, enrichie) :

1. elle **reprend son `template.id`** ;
2. elle **reprend chaque clé** de la version précédente, à l'identique ;
3. elle peut **ajouter** des clés — elles devront entrer dans la correspondance (§ 7) ;
4. elle ne **retire** une clé que si le meneur le demande ;
5. elle évite de **changer le type** d'une clé : une valeur saisie en `number` peut ne plus
   s'afficher en `text`, et inversement.

Pour cela, donne au constructeur **la fiche précédente** (ou au moins la liste de ses clés) avec le
PDF. Le validateur compare la fiche livrée au gabarit déjà intégré au moteur sous le même
identifiant : une clé disparue est une **erreur**, une clé nouvelle ou un type changé, un
avertissement.

## § 7 · La correspondance avec GM-OS

La table `docs/systems/<jeu>/fiche/correspondance.json` relie chaque clé de la fiche à un champ de
la fiche du jeu dans GM-OS — renommages, compositions (`"C (D8)"` ↔ niveau et dé), lignes d'armes
vers l'inventaire, et **absents motivés**.

**Claude Code l'écrit**, après la livraison, à partir de la fiche du jeu dans GM-OS (décision de
David, 2026-10-13) : le constructeur ne connaît pas les champs de GM-OS et **ne la produit pas**.

Le validateur la vérifie **dans les deux sens** : aucune clé citée qui n'existe pas dans la fiche,
et **aucune clé de la fiche qui ne soit citée** — c'est ce sens qui attrape une clé ajoutée par une
régénération. Une fiche sans correspondance s'affiche, mais rien de ce qu'on y saisit ne remonte
dans GM-OS : avertissement.

## § 8 · La livraison

**Le constructeur livre** un seul fichier `.html`, autonome, portant son manifeste, et termine par
le résumé que demandent ses instructions (pages, zones, fonctions, ambiguïtés) **plus la liste des
clés ajoutées ou retirées** par rapport à la version précédente, s'il y en a une.

**Claude Code**, ensuite :

1. dépose la fiche **telle quelle** dans `docs/fiches/<Jeu>/` ;
2. lance `npm run fiche:valider -- <Jeu>` — refusée, le rapport repart vers le constructeur ;
3. intègre le gabarit au moteur (`builtinTemplates` de `Character_Sheet_Manager.html`, avec
   `_builtin: true`) **et monte `BUILTIN_VERSION`** — sans quoi la bibliothèque d'un meneur déjà
   garnie ne la reçoit jamais (« Modèle inconnu », 2026-10-02) ;
4. écrit ou complète la correspondance (§ 7) ;
5. relance le validateur, puis les essais, avant tout envoi.

## § 9 · Ce que le validateur ne voit pas

Il lit des données, pas une image. **Que chaque champ tombe sur sa case imprimée** se juge à
l'écran : la fiche ouverte, mode « Zones » allumé, à côté du PDF. C'est le jugement de David, à
l'étape ⑤ de la boucle.
