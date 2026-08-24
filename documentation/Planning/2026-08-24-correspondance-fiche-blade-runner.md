# Correspondance fiche ↔ gabarit — Blade Runner

**Brouillon à vérifier par David.** Produit le 2026-08-24 pour répondre à une
question d'architecture : *faut-il une couche d'abstraction pour faciliter le
mappage ?* La table est écrite à la main sur un cas réel, puis comptée — c'est
la mesure qui doit trancher, pas l'intuition.

**Ce n'est pas encore branché.** Aucun code ne lit ce fichier.

---

## Ce que la mesure dit

| | |
| --- | --- |
| Champs du gabarit GM-OS **effectivement utilisés** | **33** |
| Clés distinctes de la fiche | **74** |
| Champs GM-OS **sans correspondance** | **0** — la fiche est un sur-ensemble strict |
| Renommages simples | **16 sur 33 — 48 %** |
| Compositions `level` + `base_die` | **17 sur 33 — 52 %** |
| Champs de la fiche sans équivalent GM-OS | 24 (dont **18 pour les armes**) |

**Il n'y a pas trois natures de correspondance, il y en a deux** — et la seconde
est **un seul motif répété dix-sept fois**. C'est le résultat qui compte : la
complexité n'est pas dispersée, elle est concentrée en un endroit.

### Ce que le `hotspot` a déjà supprimé

La nature que je redoutais — *« une série de booléens contre un nombre »* —
**n'existe plus**. `health.current`, `cool.current`, `points.promotion` et
`points.chinyen` sont dix ou vingt hotspots portant chacun sa valeur, donc **des
scalaires côté données**. Ils se mappent par simple renommage.

Chez NOC, où 113 champs sur 128 sont des `checkbox` indépendantes, cette nature
existerait encore. *C'est l'argument le plus concret pour converger sur le
`hotspot`.*

---

## 1 · Renommages simples — 16

| Gabarit GM-OS | Fiche | Note |
| --- | --- | --- |
| `nom` | `identity.name` | |
| `archetype` | `identity.archetype` | |
| `anneesService` | `identity.years_service` | |
| `domicile` | `identity.home` | `text` ↔ `textarea` |
| `souvenirCle` | `identity.key_memory` | |
| `relationCle` | `identity.key_relationship` | |
| `objetFetiche` | `profile.signature_item` | |
| `listeSpecialites` | `profile.specialties` | |
| `inventaire` | `profile.equipment` | ⚠ voir « armes » |
| `santeMax` | `health.maximum` | |
| `sangFroidMax` | `cool.maximum` | |
| `sante` | `health.current` | 10 hotspots → scalaire |
| `sangFroid` | `cool.current` | 10 hotspots → scalaire |
| `pointsPromotion` | `points.promotion` | 20 hotspots → scalaire |
| `pointsChinyen` | `points.chinyen` | 20 hotspots → scalaire |
| `nature` | `identity.type` | **+ traduction de valeur** ↓ |

**Le seul cas particulier de cette section :**

```
identity.type = "human"      →  nature = "Humain"
identity.type = "replicant"  →  nature = "Réplicant"
```

Le gabarit GM-OS déclare `select` avec les options *Humain / Réplicant* en
français ; la fiche pose `human` / `replicant`. Une correspondance de valeurs,
pas seulement de noms.

---

## 2 · Composition `level` + `base_die` — 17

**C'est le seul vrai motif à traiter**, et il vaut pour les 4 attributs et les
13 compétences.

GM-OS stocke **une chaîne** : `"C (D8)"`.
La fiche stocke **deux champs** : `level` (nombre) et `base_die` (texte).

| Gabarit GM-OS | Fiche |
| --- | --- |
| `vigueur` | `attributes.vigor.level` + `attributes.vigor.base_die` |
| `agilite` | `attributes.agility.level` + `.base_die` |
| `intelligence` | `attributes.intelligence.level` + `.base_die` |
| `empathie` | `attributes.empathy.level` + `.base_die` |
| `corpsACorps` | `skills.melee.level` + `.base_die` |
| `endurance` | `skills.endurance.level` + `.base_die` |
| `force` | `skills.strength.level` + `.base_die` |
| `armesAFeu` | `skills.firearms.level` + `.base_die` |
| `discretion` | `skills.stealth.level` + `.base_die` |
| `mobilite` | `skills.mobility.level` + `.base_die` |
| `assistanceMedicale` | `skills.medical_assistance.level` + `.base_die` |
| `observation` | `skills.observation.level` + `.base_die` |
| `technologie` | `skills.technology.level` + `.base_die` |
| `contacts` | `skills.contacts.level` + `.base_die` |
| `manipulation` | `skills.manipulation.level` + `.base_die` |
| `psychologie` | `skills.psychology.level` + `.base_die` |
| `conduite` | `skills.driving.level` + `.base_die` |

### ⚠ La seule chose que je n'ai pas pu vérifier

**Que contient `level` ?** Le gestionnaire ne porte aucun personnage rempli,
donc aucune valeur à observer. Deux lectures possibles :

- `level` vaut **1 à 4** et `base_die` vaut `"D12"…"D6"` — alors la composition
  est mécanique : `A (D12)` ↔ `level 1` + `D12` ;
- ou `level` compte des points et `base_die` en dérive.

**C'est toi qui peux trancher en ouvrant une fiche.** Si c'est la première
lecture, la table est déterministe dans les deux sens :

```
A ↔ D12    B ↔ D10    C ↔ D8    D ↔ D6
```

Et alors **une seule fonction de composition suffit pour les 17**.

---

## 3 · Ce que la fiche porte et que GM-OS ignore — 24

| Fiche | Pourquoi c'est absent de GM-OS |
| --- | --- |
| `weapons.0..2` × 6 champs = **18** | GM-OS tient les armes dans `inventory`, hors `sheetData` |
| `protection.name`, `protection.level` | idem |
| `health.critical_injuries` | pas de champ de blessure grave |
| `cool.critical_stress` | idem |
| `identity.appearance` | existe dans la moitié morte du gabarit (`apparence`) |
| **`points.humanity`** | ⚠ **le gabarit a promotion et chinyen, pas humanité** |

Les armes ne sont pas un oubli mais **un choix de modèle** : elles vivent dans
`inventory`. La table doit donc pouvoir viser autre chose que `sheetData` —
sinon 18 champs sur 24 restent inatteignables.

`points.humanity` en revanche ressemble à un vrai manque du gabarit : c'est une
jauge de Blade Runner au même titre que la promotion.

---

## Conclusion — pas de couche d'abstraction

**48 % de renommages, 52 % d'un seul motif répété, zéro champ orphelin côté
GM-OS.** Une table plate suffirait presque ; il lui manque exactement **trois
capacités**, et aucune ne justifie un vocabulaire pivot :

1. **Composer / décomposer** — `"C (D8)"` ↔ `level` + `base_die`. Une fonction,
   utilisée dix-sept fois.
2. **Traduire une valeur** — `human` ↔ `Humain`. Un cas, extensible.
3. **Viser une autre destination que `sheetData`** — `inventory` pour les armes.

Un pivot ferait passer de N tables à 2N pour deux consommateurs. Il ne se
justifierait qu'à partir d'un troisième.

> **Et si `level` s'avère mécanique, la question change de nature.** La fiche
> porte `key`, `label`, `type` — exactement ce qu'un gabarit GM-OS demande. La
> Forge pourrait **dériver** le gabarit de la fiche, et la table disparaîtrait
> au lieu d'être maintenue. Le coût n'est pas technique, il est de gouvernance :
> *qui détient la vérité ?*

---

## Le gabarit a été assaini le 2026-08-24 — plus rien à corriger

**C'était le prérequis, et il est levé.** Le gabarit décrivait le personnage
**deux fois** : sept sections en `camelCase` (celles que les quatre PJ
remplissent) et quatre en `snake_case` qui ne portaient rien. Comme `sheetData`
est **plat** — les clés sont `nom`, pas `identification.nom` — les doublons ne
se contentaient pas d'être morts, ils **se disputaient les mêmes clés** :

| Clé | Moitié vivante | Moitié morte |
| --- | --- | --- |
| `vigueur`, `intelligence`, `empathie` | `select` `A (D12)` | `number` |
| `sante` | `number` | **`gauge`** |
| `nom`, `archetype`, `nature`, `domicile` | `text` / `select` | idem |

Deux types pour une même clé : l'écran qui rendait le champ décidait, et il
décidait selon l'ordre des sections. *Le motif des deux tables de thèmes, dans
un gabarit.*

**David a supprimé les quatre sections mortes.** Résultat vérifié : **7 sections,
33 champs, zéro collision**, et **aucune donnée orpheline** chez les quatre PJ —
leurs 30 à 31 valeurs correspondent toutes à un champ qui existe.

### Trois champs sont partis avec, et c'est assumé

`apparence`, `dotation_reglementaire` et `humanite` n'existaient que dans la
moitié morte, et **aucun personnage n'en portait la moindre valeur**.

Ils ne peuvent pas être recréés à la main : l'éditeur de gabarit sait ajouter un
champ, mais **il fabrique son identifiant** (`field-<horodatage>`) et ne laisse
modifier que le libellé. Or `sheetData` est indexé par l'identifiant. Les
identifiants lisibles — `nom`, `vigueur`, `corpsACorps` — viennent tous de la
Forge, qui les écrit depuis les règles.

**`humanite` reviendra donc par la Forge**, en enrichissant le pilote Blade
Runner. C'est une jauge du jeu au même titre que la promotion et le chinyen, et
la fiche la porte déjà (`points.humanity`, 20 hotspots).

> **Une conséquence pour la suite :** la table de correspondance vise des
> identifiants, et les identifiants ne sont pas autorables. Un futur éditeur
> d'identifiants devrait **migrer les données en même temps** — renommer
> `vigueur` sans toucher aux quatre PJ les rendrait orphelins. C'est
> probablement pourquoi la capacité n'existe pas.
