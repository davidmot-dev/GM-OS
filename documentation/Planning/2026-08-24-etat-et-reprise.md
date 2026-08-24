# État et reprise — 2026-08-24

**Instantané daté.** Ce qui a été fait, ce qui reste, et par quoi reprendre.
Quatorze commits. `tsc -b` propre, **2 425 tests au vert**.

> Le registre **vivant** des chantiers garés est ailleurs :
> `2026-08-23-chantiers-gares.md`. Celui-ci ne se met pas à jour.

---

## Le motif de la journée — cinq fois la même chose

**Deux déclarations d'une même vérité, dont une seule était lue.** À chaque fois,
rien n'était visiblement faux : c'est ce qui les rend si chères.

| | |
| --- | --- |
| Les **deux tables de thèmes** | `THEME_PALETTES` et `:root[data-theme]`, contradictoires — chacune lue pour une moitié d'elle-même |
| Les **deux moitiés du gabarit** Blade Runner | 7 sections vivantes, 4 mortes, se disputant les mêmes clés plates |
| Les **deux gabarits NOC** | l'un était en fait celui de Star Trek, mal nommé par la Forge |
| La **liste des thèmes du SDK** | déclarée à **quatre** endroits ; en oublier un échouait en silence |
| Le **gabarit de la fiche** BR | embarqué deux fois dans le même fichier, doublant son poids |

*Et le sixième, trouvé le matin :* sept stores persistés que les fenêtres
secondaires écrasaient — deux écrivains pour un même magasin.

---

## 1 · L'incident, et ce qu'il laisse ouvert

**Les campagnes ont été perdues, pour la deuxième fois en dix-sept jours**, et
cette fois mes éditions l'ont déclenchée : six modules de store persistés édités
pendant que l'application tournait. Récupérées par l'historique de fichiers de
Windows — le seul filet, les deux fois.

⛔ **Ce qui reste ouvert, et qui n'est pas traité :**

- **La course mocks / réhydratation de la fenêtre MJ.** Le correctif du 07/08 ne
  bloque que les fenêtres *secondaires*. Rien n'empêche la fenêtre MJ d'écrire
  avant la fin de sa réhydratation. **Tant que ce trou existe, n'importe quel
  rechargement reste une perte possible.**
- **Aucune sauvegarde automatique.** Les seuls exports du disque dataient
  d'avril. *Le gestionnaire de fiches de David a un `backup`/`restore` ; GM-OS
  n'en a aucun.*

📄 Mémoire : `gm-os-perte-de-donnees-et-filet` — porte la procédure de
récupération pas à pas.

---

## 2 · Ce qui est livré

### La persistance multi-fenêtres — 7 stores gardés

Le hub et le projecteur partagent le `localStorage` du MJ et **l'écrasaient** :
la synchronisation applique par `setState`, et un `setState` sur un store
persisté écrit. Garde `ecritureReserveeAuMJ` posée sur combat, carte, horloge,
tableau blanc, dés et favoris — le store de session l'avait depuis le 07/08.

**Ce qui rendait la garde sûre** et qu'il fallait établir avant : la
synchronisation est **bidirectionnelle**, donc ce que le hub change part au MJ,
qui l'applique et rediffuse. L'écriture du hub n'était qu'un doublon partiel.

⚠️ **`useRessourcesDeTableStore` est volontairement exclu** — la tablette est
censée le persister, et elle est sur une **autre origine**, donc y refuser
l'écriture ne protégerait rien. Il lui faudrait une garde qui distingue la même
origine, pas toute fenêtre secondaire.

### Le thème par jeu — déposer un fichier suffit

`docs/systems/<jeu>/theme/theme.css` et l'interface suit : couleurs, polices,
polarité. **Aucun registre, aucun code, aucune recompilation.** Quatre thèmes en
place, vérifiés en réel sur Hadley Hope et sur une campagne sans thème.

Trois pièges payés : les deux tables réconciliées en une seule (`themeDeLInterface.ts`)
avec un seul écrivain ; « le jeu gagne, la main surcharge » qui s'inversait en
silence parce qu'une surcharge est *toujours* présente ; et une police déclarée
mais **jamais téléchargée** — l'`@import` du thème n'était pas exécuté.

### Le Cortex — les portées partielles

Un pilote qui déclarait quatre bandes sur cinq faisait **planter** le rapport à
chaque passe. `config?.ranges || defaults` ne se déclenchait que si le bloc
manquait *en entier*. Fusion bande par bande, et la suppléance **se dit**.

### Le ménage

`coc7` et `dnd-5e` supprimés — sans dossier `rules/`, donc invisibles de
l'Oracle, et déclarés par personne. Les listes de systèmes remises au réel.

---

## 3 · Les fiches — étude faite, rien de codé

Le plan 3b d'origine est **périmé** : David a construit un **moteur** unique
(`docs/fiches/Character_Sheet_Manager.html`) qui rend quatre gabarits déclarés en
JSON, avec géométrie, champs typés et bibliothèque IndexedDB.

**La question de la couche d'abstraction est tranchée : non.** Mesure faite à la
main sur les 33 champs de Blade Runner — **48 % de renommages, 52 % d'un seul
motif répété, zéro champ orphelin**. Il manque trois capacités à une table
plate, pas un vocabulaire pivot.

⛔ **Le seul vrai blocage : aucune fiche n'expose de couture.** Ni `window.*`, ni
`postMessage`, sur les cinq fichiers. GM-OS ne peut ni lire ni écrire, quel que
soit le nommage. Le moteur a pourtant `getByPath`, `setByPath` et
`saveCharacter` en interne — il ne manque que trois lignes, **une seule fois**.

📄 Fait foi : `2026-08-24-correspondance-fiche-blade-runner.md` — la table
complète et les six étapes restantes, dans leur ordre de dépendance.

---

## 4 · Par quoi reprendre

**1. La couture des fiches.** Trois lignes dans le moteur, et tout le chantier 3b
se débloque. C'est le meilleur rapport entre l'effort et ce que ça ouvre.

**2. La course de réhydratation.** C'est le seul reste qui peut encore coûter des
données. Rien ne presse tant que personne n'édite un store en cours de session —
mais c'est précisément une condition qu'on ne contrôle pas.

**3. Une sauvegarde automatique.** Deux pertes, zéro filet applicatif. Le
gestionnaire de fiches montre que ça tient en peu de code.

**4. Les quatre autres modules de l'axe N.3** — leur densité ne se juge qu'en
jouant, et la prochaine séance est du **Blade Runner**. L'afficheur Ulanzi
attend la même séance pour son premier essai en conditions.

---

## 5 · Non suivi par git, à trancher

- **`Temp_Fiche/`** — copies des quatre fiches. Trois sont identiques à
  `docs/fiches/` ; **celle de Blade Runner est la version d'AVANT correction**.
  À supprimer pour ne pas l'ouvrir par erreur.
- **`docs/systems/torg/`** — corpus en cours d'écriture par David.

## 6 · Deux petites choses en attente

- **Le § 6 de la méthodologie de thèmes** — la procédure d'analyse d'un jeu
  depuis ses captures, perdue avec le fichier supprimé. Reconstituable dans le
  README versionné.
- **`points.humanity`** manque au gabarit Blade Runner. Il ne peut pas être
  ajouté à la main — l'éditeur fabrique les identifiants — il reviendra par la
  Forge.
