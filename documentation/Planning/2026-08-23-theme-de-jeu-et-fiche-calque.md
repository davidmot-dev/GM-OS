# Le thème appartient au jeu, et la fiche EST la vraie

**2026-08-23 — conception. Aucune ligne de code écrite.**

> **⏸ Chantier gardé pour plus tard.** David, le 2026-08-23 : *« c'est un gros
> chantier, garde-le pour plus tard »*. Rien ne commence sans qu'il le redemande.
>
> **Le sujet 2 a été renversé le même jour, après avoir été gardé** — et le
> renversement vaut bien plus que le report. On n'importe plus la fiche dans
> GM-OS : **on affiche le HTML et on l'alimente**. Un fichier HTML par PJ. La
> partie la plus dure du plan précédent — extraire la géométrie — est **annulée**.

---

## Ce qui est tranché

Décisions de David, le 2026-08-23. Elles ne se rediscutent pas.

1. **Le thème d'un jeu est une palette libre déclarée dans son pilote** — et non
   le choix d'un des quatre thèmes existants. *Vingt jeux ne peuvent pas se
   partager quatre apparences.*
2. **Le jeu gagne, la main surcharge la séance.** Le thème du jeu s'applique à
   l'ouverture de la campagne ; un changement manuel tient jusqu'à la fermeture
   et **ne s'écrit jamais dans le pilote**.
3. **La fiche est un fichier HTML qu'on affiche et qu'on alimente**, pas un
   rendu que GM-OS reconstitue. **Un fichier HTML par personnage joueur.**
4. **La fiche s'affiche sur les deux écrans** — MJ et tablette — en bascule
   « vue fiche / vue édition », jamais en remplacement.

---

# Sujet 1 — Le thème appartient au jeu

## L'état des lieux : le chemin s'arrête avant le moteur, une cinquième fois

`GameDriver.ui_config.themeColor` existe depuis longtemps
(`src/types/drivers.ts:77`), décrit noir sur blanc comme *« Global accent for
this system »*. La Forge le produit (`ForgeService.ts:466`), `controlesDuPilote`
le valide, `enrichirLePilote` le fusionne, `RevueDuPilote` l'**affiche**.

**Personne ne l'applique.** Aucun `setProperty` ne le lit, nulle part. Le pilote
sait déjà dire de quelle couleur est son jeu depuis des semaines, et aucun écran
ne l'écoute. C'est le motif du pupitre de dés — *le chemin s'arrête avant le
moteur* — sous une forme nouvelle : ici, ce n'est même pas un calcul qui manque,
c'est le lecteur.

## Le défaut trouvé en chemin : deux tables de thèmes qui se contredisent

Il existe **deux** déclarations des quatre thèmes, et elles ne disent pas la même
chose :

| | `THEME_PALETTES` (`useSessionStore.ts:48`) | `:root[data-theme=…]` (`index.css:184-260`) |
| --- | --- | --- |
| cyberpunk · accent | `#06b6d4` | `#22d3ee` |
| medieval · accent | `#d4af37` | `#d97706` |
| medieval · fond | `#181411` | `#1c1917` |
| modern · fond | `#0f172a` | `#020617` |
| claire · accent | `#c2410c` | `#3b82f6` |

`Shell.tsx:104-117` écrit **cinq** variables en ligne sur `:root` :
`--app-accent`, `--app-bg`, `--app-surface`, `--app-border`, `--font-display`.
Elles écrasent le CSS. Les **sept autres** ne viennent que du CSS :
`--app-text`, `--app-accent-rgb`, `--app-accent-glow`, `--font-mono`,
`--glass-bg`, `--glass-border`, `--glass-highlight`.

**Conséquence visible, et c'est probablement une part de l'insatisfaction :**
choisis une couleur d'accent dans les réglages, et `--app-accent` change — mais
`--app-accent-glow` et `--app-accent-rgb` gardent la couleur du thème. Les lueurs
(`index.css:53`) et les pulsations de `LobbyOnboarding.tsx:487` restent sur
l'ancienne teinte. **L'accent et sa lueur ne sont pas de la même couleur.**

> **Leçon.** *Une donnée écrite à deux endroits ne diverge pas un jour : elle est
> déjà divergente.* Ces deux tables n'ont jamais été d'accord. Le motif est celui
> du journal de séance — plusieurs écrivains pour une même donnée — mais aggravé :
> ici **chaque table n'est lue que pour une moitié d'elle-même**, donc aucune des
> deux n'est jamais visiblement fausse.

Ce défaut se corrige **avant** d'ajouter les thèmes de jeu, pas après. Ajouter
une palette libre par-dessus deux tables contradictoires, c'est en fabriquer une
troisième.

## Ce qu'on ajoute

```ts
export interface ThemeDeJeu {
    /** Sombre ou clair. Décide `color-scheme`, donc les menus natifs. */
    clarte: 'sombre' | 'claire';
    accent: string;
    bg: string;
    surface: string;
    border: string;
    text: string;
    /** Police d'affichage. Voir « le piège des polices ». */
    police?: string;
    policeMono?: string;
    texture?: 'aucune' | 'scanlines' | 'grain' | 'parchemin';
}
```

et un champ facultatif : `ui_config.theme?: ThemeDeJeu`.

`ui_config.themeColor` **reste vivant** : des pilotes enregistrés le portent, et
il sert d'accent quand `theme` est absent. On ne fait pas payer une nouveauté à
l'existant — c'est déjà la règle écrite dans `combat.santeDeDepart`.

## Un seul arbitre

Aujourd'hui ils sont **deux** à écrire le thème dans le DOM : `main.tsx:13-15` et
`Shell.tsx:104-117`. Le premier ne pose que `data-theme`, le second pose tout.
Ils ne se contredisent pas encore — ils le feront le jour où le thème vient
d'ailleurs que du store.

**Une seule fonction applique un thème, et personne d'autre ne touche à `:root`.**
Elle écrit **les douze variables**, `color-scheme` compris, en dérivant
`--app-accent-rgb` et `--app-accent-glow` de l'accent au lieu de les laisser au
CSS. Le CSS ne garde que les valeurs de repli du `:root` nu.

## La préséance

Le thème effectif est **dérivé**, jamais stocké deux fois :

```text
surcharge manuelle de la séance   (volatile, effacée au changement de campagne)
  ▸ sinon  thème du pilote du jeu de la campagne active
      ▸ sinon  thème de la campagne (LayoutConfig, l'existant)
          ▸ sinon  thème global du store
```

- **La surcharge manuelle ne s'écrit pas dans `LayoutConfig`.** Sinon
  `useLayoutManager.ts:112-150` la sauvegarde dans la campagne, et à la
  réouverture le thème du jeu ne reprend jamais la main : la décision n° 2 serait
  silencieusement inversée. La sauvegarde de layout doit **distinguer** un thème
  choisi d'un thème hérité — c'est le point le plus délicat du sujet 1.
- **Le pilote appartient au jeu, jamais à la campagne.** Régler l'apparence
  depuis un écran de campagne ne doit pas écrire dans le pilote.

## Trois pièges d'environnement

- **`color-scheme`.** `claire` est le seul thème clair et il le déclare
  (`index.css:249`) — sans lui, les `<select>` natifs restent sombres. Une palette
  libre **doit** dire sa clarté, sinon le défaut déjà corrigé une fois revient.
- **Les polices.** Tout vient de Google Fonts, liste **fixe** (`index.css:2`,
  `index.html`). Un pilote qui déclare `police: 'Eurostile'` obtiendra la police
  de repli **sans que rien ne le signale**. → liste close d'abord ; *un champ
  libre qui échoue en silence est pire qu'un menu à cinq entrées.*
- **La tablette.** PWA hors Electron : le thème doit passer par la
  synchronisation (`useNexusSynchronizer.ts:71` transporte déjà `theme`).

## Les étapes

1. **Réconcilier les deux tables** — une seule source pour les douze variables,
   `--app-accent-rgb` et `--app-accent-glow` dérivés de l'accent. *Ce pas seul
   corrige la lueur qui ne suit pas l'accent.*
2. **Un seul arbitre** — une fonction, un appel ; `main.tsx` cesse d'écrire.
3. **`ThemeDeJeu` dans le pilote**, avec `themeColor` en repli.
4. **La chaîne de préséance**, avec la distinction choisi / hérité.
5. **La Forge produit une palette entière** et `controlesDuPilote` la vérifie —
   au minimum : contraste texte/fond, `clarte` cohérente avec le fond.
6. **Un écran** pour régler la palette d'un jeu à la main.

---

# Sujet 2 — La fiche EST le fichier HTML

## Le renversement, et pourquoi il gagne

Le plan du matin voulait **importer** la fiche : extraire la géométrie du HTML,
la stocker dans le gabarit, et redessiner la fiche en React. David, le soir :
*« est-ce qu'on ne peut pas partir dans l'autre sens, on alimente la fiche HTML
avec les valeurs de GM-OS et on affiche simplement l'HTML ? »*

Oui. Et c'est meilleur sur **cinq** points vérifiables, pas sur une impression :

1. **Le fichier est déjà une interface.** `apply(d)` (ligne 77) prend un objet
   plat `clé → valeur` et remplit les 94 zones ; `collect()` (ligne 76) rend le
   même objet. Or `sheetData` est *exactement* `Record<string, string | number |
   boolean>` (`player.types.ts:108`). **La forme est déjà la bonne, des deux
   côtés.**
2. **La géométrie disparaît entièrement.** Plus de `GeometrieDeFiche`, plus de
   fenêtre cachée, plus de `--scale` à neutraliser. Et surtout, plus de piège des
   **78 zones sur 94 qui n'existent pas dans le balisage** (elles sont fabriquées
   à l'exécution par les boucles des lignes 59-75). Le fichier s'exécute
   lui-même : le problème n'a plus lieu d'être posé.
3. **Le scan de 1,6 Mo ne sort jamais du fichier.** Rien à extraire, rien à
   ranger dans `public/assets`, rien à faire transiter.
4. **La mise à l'échelle est offerte.** `scale()` (ligne 85) mesure `innerWidth`
   et `innerHeight` — **dans une iframe, ce sont les dimensions de l'iframe**. La
   fiche s'ajuste toute seule, sur les deux écrans. Le `ResizeObserver` prévu au
   plan précédent n'a plus lieu d'être.
5. **La fidélité est totale et gratuite.** C'est le vrai fichier, pas une
   reconstitution qui dériverait de lui.

> **Leçon.** *Quand un document sait déjà se remplir, l'importer c'est le
> réécrire.* Le plan du matin allait reconstruire en React ce que 85 lignes de
> HTML faisaient déjà — et hériter, au passage, de tous les écarts entre l'original
> et la copie.

## Un fichier HTML par PJ — décidé par David

Chaque personnage joueur a **son** fichier. Ce que ça donne : une fiche
**autonome**, ouvrable hors GM-OS, imprimable, transmissible au joueur. Le
fichier est un attribut du personnage ; GM-OS ne se soucie pas de savoir si David
l'a fait à la main ou l'a produit depuis une fiche vierge du jeu.

**Ce que ça force à trancher : qui détient la vérité.** Le fichier sait se
sauvegarder seul (`localStorage`, ligne 78), s'exporter et se réimporter en JSON
(lignes 81-82). Livré tel quel dans GM-OS, un personnage aurait **deux états**, et
c'est le défaut que ce dépôt documente presque chaque jour.

**La règle : `sheetData` détient la vérité, le fichier est alimenté.** Le HTML est
une vue qui reçoit et qui renvoie — jamais une source qu'on relit.

## L'adaptateur : trois neutralisations, quelques lignes

On injecte un petit script dans le fichier (avant `</body>`), et il suffit de
trois gestes.

**1. Détourner `save()`.** Le fichier n'a **qu'un seul** écouteur, global :
`document.addEventListener('input',save)` et `change` (ligne 79). Remplacer le
corps de `save` par un `parent.postMessage(collect())` capture donc **toute** la
saisie, des 21 octogones aux 47 cases, sans toucher à une seule zone. Dans
l'autre sens, un `message` reçu appelle `apply(d)`. **C'est tout le pont.**

**2. Masquer la barre d'outils.** *Exporter JSON*, *Importer JSON* et
*Réinitialiser* sont trois portes vers une deuxième vérité. Elles n'ont rien à
faire dans GM-OS. *(Elles restent utiles quand le joueur ouvre son fichier tout
seul — d'où : masquées dans l'iframe, pas supprimées du fichier.)*

**3. Neutraliser `localStorage` — et c'est un piège concret.** Dans une iframe
`sandbox="allow-scripts"` sans `allow-same-origin`, l'origine est opaque et
**`localStorage.setItem` lève une exception**. Or :

- la **lecture** est protégée par un `try/catch` (ligne 80) — elle passerait ;
- l'**écriture** ne l'est **pas** (ligne 78) — elle casserait.

Autrement dit **la fiche s'ouvrirait parfaitement et mourrait à la première
frappe**. C'est exactement le genre de défaut qui ne se voit pas à la
démonstration et se voit en séance.

Le geste 1 supprime ce risque par construction, puisqu'il remplace `save`. Mais
**seulement s'il est fait d'abord** : un adaptateur qui ajouterait le pont sans
retirer l'écriture locale laisserait la bombe armée.

## Ce qui reste vraiment à faire

L'appairage ne disparaît pas — il rétrécit. Il n'y a plus de rectangles, juste
des noms.

- **Appairer les clés.** `data-key="carriere"` ↔ `SheetField.id`. Normalisation
  **des deux côtés** : c'est le défaut du RAG du 2026-08-23 — *le mot cherché
  était déaccentué et pas le corps* — et il se rejouerait à l'identique, `carriere`
  ne trouvant jamais `Carrière`.
- **Replier les clés numérotées, dans les deux sens.** `stress_0..9` est **dix
  booléens** côté HTML et **un** champ côté GM-OS ; `equip_1..10` est
  l'`inventory`. La traduction vit dans l'adaptateur, aller **et** retour.
  *Une piste de dix cases est UN champ, pas dix.*
- **Ce qui ne s'appaire pas est signalé, jamais inventé.** Une zone orpheline qui
  écrirait sous sa propre clé recréerait la deuxième vérité.

## Le blocage qui demeure : la tablette ne sait pas écrire une fiche

Il est indépendant du rendu, donc le renversement ne l'efface pas.

Sur la tablette, les champs sont rendus en **`<span>`**
(`HubCharacterSheet.tsx:238-258`) : **lecture seule par construction**. Le joueur
ne modifie que ses PV, sa description, ses notes et son inventaire.

`updateCharacterSheetData` (`entitySlice.ts:438`) écrit bien un champ à la fois —
la forme exacte dont l'adaptateur a besoin — mais **il n'a pas de jumeau
distant**, alors que chaque action de tablette en a un (`entitySlice.ts:482-501`,
registre `sessionActions.ts:42`). Un `postMessage` reçu de l'iframe sur la
tablette écrirait dans le store local du joueur et **le MJ ne verrait jamais
rien** — le pire cas pour Alien, où le stress est ce que le joueur coche sans
arrêt.

> **Leçon.** *Un champ qu'on ne pouvait que lire ne dit pas s'il sait s'écrire.*
> La fiche de la tablette a l'air complète — elle affiche les 94 valeurs. Rien ne
> signale que le chemin du retour n'existe pas, parce que rien n'a jamais essayé
> de le prendre.

Il faut donc **`remoteUpdateCharacterSheetData`**, son nom dans
`remote.types.ts:111`, son entrée dans `sessionActions.ts` — où `registry.test.ts`
vérifie déjà que tout nom déclaré a bien la sienne. Et il doit suivre
`remoteUpdateCharacterNarrative`, **pas** `remoteUpdateCharacterVitals` : ce
dernier ne diffuse rien du tout, il se contente de poser une notification.

## Le repli : les jeux sans fichier HTML

Tous les jeux n'auront pas leur fiche. Pour ceux-là, la fiche actuelle reste,
habillée du thème du jeu — papier, encre, typographie. C'est un **repli**, plus
une moitié du sujet.

Les trois briques prévues au plan du matin (octogone, piste de cases, champ
réglé) **ne servent plus au calque** : le HTML les dessine lui-même. Elles ne
servent qu'à ce repli, et sont donc **rétrogradées en fin de liste**.

## Les étapes

1. **L'hôte** — une iframe qui affiche le fichier d'un personnage, côté MJ, en
   bascule « vue fiche / vue édition ».
2. **L'adaptateur** — injection, `save` détourné, barre masquée, `postMessage`
   dans les deux sens. *Le détournement avant tout le reste.*
3. **L'appairage** — table de correspondance normalisée des deux côtés, et repli
   des clés numérotées aller-retour.
4. **L'épreuve** — ouvrir un PJ, modifier une valeur dans GM-OS, la voir dans la
   fiche ; cocher une case dans la fiche, la voir dans `sheetData`. *Les deux
   sens, ou rien.*
5. **Le chemin d'écriture de la tablette** — `remoteUpdateCharacterSheetData`.
   **Bloquant** pour l'édition côté joueur.
6. **L'iframe côté tablette**, une fois le retour possible.
7. **L'impression** — offerte, le fichier a déjà son `@media print` paysage.
8. **Le repli** — la peau générée et ses trois briques, pour les jeux sans
   fichier HTML.

---

## Ce qu'on ne fait pas

**Annulé par le renversement** — tout ceci figurait au plan du matin et n'a plus
lieu d'être :

- `GeometrieDeFiche` et l'import de géométrie ;
- la fenêtre Electron cachée et le relevé des rectangles ;
- l'extraction du scan vers `public/assets/fiches/` ;
- l'éditeur de calque, et sa retouche à la souris ;
- le `ResizeObserver` sur le conteneur.

**Et par ailleurs :**

- **On ne relit jamais le fichier d'un PJ comme source.** Ni son `localStorage`,
  ni son export JSON. Il reçoit, il renvoie, il ne fait pas autorité.
- **Pas de police libre dans le pilote** au premier tour. Liste close.
- **Les fichiers HTML des PJ sont des sources à conserver**, hors du code, dans
  un dossier à part.
