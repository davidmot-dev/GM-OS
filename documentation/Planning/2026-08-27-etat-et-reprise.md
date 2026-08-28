# État et reprise — 2026-08-27

**Instantané daté.** Deux chantiers repris, tous les deux fermés.
`tsc -b` propre, **2 469 tests au vert** (198 fichiers, 1 ignoré).

> Le registre **vivant** des chantiers garés est ailleurs :
> `2026-08-23-chantiers-gares.md`. Celui-ci ne se met pas à jour.

---

## Ce qui a été fait

| | |
| --- | --- |
| **1 · La couture des fiches** | ✅ publiée et éprouvée — le seul blocage du chantier 3b est levé |
| **2 · La course de réhydratation** | ✅ fermée — c'était le dernier chemin qui pouvait encore coûter des données |

---

## 1 · La couture des fiches

`docs/fiches/Character_Sheet_Manager.html` est un IIFE : il avait `getByPath`,
`setByPath`, `saveCharacter` et `scheduleSave` en interne et **n'exposait rien**.
Il expose maintenant, **une fois pour les quatre gabarits** :

```js
window.RPGSheet = { version, getData, setData, getTemplate, onChange };
```

…et le même contrat par `postMessage` — canal `rpg-sheet`, verbes `hello`,
`get`, `set`, `template`, diffusions `change` et `open`. Les deux chemins,
parce que l'hôte sera une iframe et que `window.*` ne traverse pas une origine.

### Ce que « trois lignes » cachait

Le plan disait *trois lignes*. Le contrat en demande trois de plus, et aucune ne
se devine à la lecture du bloc publié :

- **`setByPath` signale la clé écrite.** C'est le seul point par lequel passent
  *tous* les chemins d'édition — champ, case, `select`, hotspot, piste, portrait,
  et l'écriture de l'hôte. Sans lui il aurait fallu accrocher cinq endroits.
- **`openCharacter` annonce l'ouverture.** Sinon l'hôte ne sait jamais qu'on a
  changé de PJ.
- **`setData` redessine.** Écrire la donnée sans rafraîchir les champs, les
  hotspots et les dérivés, c'est le défaut le plus cher de ce projet : *la donnée
  est juste et l'écran ment.*

### Deux décisions prises en écrivant

- **Un lot ne porte qu'une origine** (`sheet` / `host` / `open`). Les changements
  sont groupés sur 60 ms ; avant d'appliquer une écriture de l'hôte, on **vide**
  ce qui restait de la saisie locale. Sans ça l'hôte se voit renvoyer sa propre
  écriture mêlée à celle du joueur — et la réapplique.
- **`getData` rend une copie**, pour que l'hôte ne puisse pas modifier la fiche
  par accident.

`getTemplate()` a été ajouté en route : il rend `{ key, label, type, page }` pour
chaque champ. **C'est l'étape 4 qui en profitera** — le contrôle qui garde la
table de correspondance vraie n'aura rien à ré-analyser du HTML, il demandera à
la fiche.

### Éprouvé, pas seulement relu

`electron/coutureDesFiches.test.ts` — **9 tests**. Il charge **le vrai moteur du
disque** dans un DOM ; seuls les gabarits intégrés sont remplacés par un gabarit
de contrôle, les vrais pesant sept mégaoctets de fonds de page. Il crée un
personnage par le chemin normal de l'application, puis fait l'aller-retour
complet : écriture de l'hôte → écran redessiné → saisie du joueur → remontée →
persistance vérifiée en rouvrant le personnage.

Son premier test garde les trois points de couture **présents dans le fichier** :
le générateur de David fait évoluer le format, et *le jour où il régénère la
fiche et emporte la couture, c'est ce test qui le dit.*

---

## 2 · La course de réhydratation — la seconde moitié du correctif du 07/08

**Le trou vient de la nature du magasin.** `localStorage` se lit de façon
synchrone : entre la création d'un store et son hydratation, il n'y a aucun
instant. Le store de session, lui, est passé à **IndexedDB**, qui se lit de façon
**asynchrone** — donc il existe une fenêtre réelle, de quelques dizaines de
millisecondes au démarrage, et à nouveau **à chaque rechargement à chaud du
module** pendant le développement.

Pendant cette fenêtre, la fenêtre MJ a `INITIAL_DATA` en mémoire — les mocks.
N'importe quel `set()` les persistait par-dessus la base. **C'est le mécanisme de
la perte du 2026-08-24**, celle que mes propres éditions ont déclenchée.

Le correctif du 07/08 ne fermait que les fenêtres *secondaires* : il posait la
bonne garde au bon endroit, mais sur la mauvaise moitié de la question. *Qui a le
droit d'écrire* était traité ; *quand* ne l'était pas.

### Ce qui est posé

**`PersistenceService` n'ouvre l'écriture qu'une fois la base relue** — et
« relue » veut dire *lue sans erreur*, base vide comprise : une base vide se lit
très bien, c'est un premier démarrage. L'ouverture se fait dans
`onRehydrateStorage`, **avant** les reprises, parce que la dernière d'entre
elles (`reconcileTemplates`) appelle `set()` et que son travail doit être
persisté.

### Et la moitié silencieuse : une lecture ratée se faisait passer pour une base vide

`idbStateStorage.getItem` **avalait** l'erreur et rendait `null` — exactement ce
que répond un premier démarrage. L'appelant ne pouvait donc pas distinguer *une
base vide* d'*une base illisible* ; dans le second cas il repartait sur les mocks
et les persistait ensuite par-dessus la vraie base.

**Une lecture ratée qui se fait passer pour une base vide est un effacement à
retardement.** `getItem` remonte désormais l'erreur ; la clé absente, elle,
continue de rendre `null`, parce que c'est un fait et pas une erreur. Qui décide
quoi faire de l'échec, c'est `PersistenceService` : il **referme l'écriture**,
journalise, et GM-OS tourne **en mémoire seule**.

> *Perdre le travail d'une séance est réparable ; écraser la base ne l'est pas.*
> L'application démarre quand même — l'hydratation Zustand réussit, seul le droit
> d'écrire est refusé — donc pas d'écran de chargement bloqué.

### Ce qui rend la garde suffisante, et qu'il ne faut pas re-déduire

**Le store de session est le seul store persisté de façon asynchrone.** Les sept
autres passent par `stockageLocalDuMJ()`, donc par `localStorage`, donc par une
lecture synchrone : chez eux la fenêtre de course n'existe pas. Vérifié fichier
par fichier — `useCombatStore`, `useMapStore`, `useClockStore`,
`useWhiteboardStore`, `useDiceStore`, `useFavoriteStore`, et le store de session
lui-même.

**Régression :** `PersistenceService.test.ts` gagne six tests, dont celui qui
distingue cette garde d'un simple drapeau d'hydratation — *la relecture s'est
terminée mais elle a échoué, et Zustand annonce quand même la fin*.
`idbStorage.test.ts` en gagne deux.

---

## 3 · Par quoi reprendre

**1. Une sauvegarde automatique.** C'est maintenant **le seul reste du filet**.
Deux pertes, zéro sauvegarde applicative ; les seuls exports du disque dataient
d'avril. Le gestionnaire de fiches de David a un `backup`/`restore` et montre que
ça tient en peu de code.

**2. L'hôte des fiches côté GM-OS** — l'iframe, la bascule sur les deux écrans,
puis la table de correspondance (étapes 3 à 6 du document de correspondance). La
couture ne demande plus rien à personne.

**3. L'essai de l'afficheur Ulanzi en conditions**, et les quatre autres modules
de l'axe N.3 — ils attendent la même séance de Blade Runner.

---

## 4 · Une dépendance ajoutée

`@types/jsdom` en `devDependency` : `electron/coutureDesFiches.test.ts` charge le
moteur des fiches dans un DOM, et `jsdom` (déjà présent, c'est l'environnement de
test du renderer) n'embarque pas ses types.
