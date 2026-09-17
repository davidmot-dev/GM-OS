# État et reprise — nuit du 2026-09-17 au 18

> **Base saine.** `tsc -b` propre, **5 329 tests verts** (418 fichiers, 1 ignoré), `vite build` propre,
> branche `feature/tablet-hub-pwa`.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md), et elle y vit seule.
> Ce document-ci ne dit que **par quoi reprendre** et **ce qu'il ne faut pas repayer**.
>
> Il prend la suite de [`2026-09-15-etat-et-reprise.md`](./2026-09-15-etat-et-reprise.md).
>
> ✅ **Quatre chantiers éprouvés à l'écran par David** — *« ca fonctionne »*, *« ok c'est mieux »*,
> *« c'est bien »*, *« ok c'est bon »*.
> ⚠️ **Le style « Verre » des dés n'a pas été jugé séparément** : c'est le plus risqué des trois, parce
> que le fond du rendu doit rester transparent pour se superposer au Hub.

---

## L'arbre est propre, tout est poussé

`feature/tablet-hub-pwa` est **à jour avec `origin`** — `6f2e9f31..9e1dbeb8`, pré-push local passé.
**Rien n'attend dans l'arbre de travail.**

| Commit | Ce qu'il porte |
| --- | --- |
| `a63b2292` | `docs(refonte)` — l'architecture et le plan de la refonte d'interface (§ 76) |
| `859e2b1f` | `perf(whiteboard,map)` — un magasin persisté écrit à **chaque** `set()` (§ 78) |
| `0a026737` | `feat(light)` — l'audit du catalogue, la fusillade, les solistes, dix effets (§ 77) |
| `aa716f18` | `feat(hub)` — les dés en 3D lisibles, et le décor de campagne (§ 79 et § 80) |
| `9e1dbeb8` | `docs` — le registre 76 à 80, et ce document |

⚠️ **Les dés et le décor sont dans un seul commit** : ils partagent `useHubSync` et les traductions.
Les découper aurait produit un commit qui ne compile pas — *un historique lisible ne vaut pas un commit
cassé.*

---

## Ce que la nuit a produit

| Quoi | Ce qui est entré |
| --- | --- |
| **La refonte de l'interface** | ⭐ Un chantier **documenté et tranché, rien de commencé** : architecture en 5 couches, 7 invariants, plan en 7 phases (§ 76) |
| **Light-OS — le catalogue** | ⭐ Audit **mesuré** des 46 effets, la **fusillade**, la catégorie **coup unique**, les **solistes** qui tiennent le budget du pont, et **dix effets réécrits** (§ 77) |
| **La saccade du tableau blanc** | ⛔ Un magasin persisté écrit à **chaque** `set()` — 1,75 ms et 285 Ko **par point de trait**. Écriture différée, diffusion limitée (§ 78) |
| **Les dés en 3D** | ⭐ Chiffres, atterrissage **sur la valeur du jet**, environnement, ombre, collisions, **trois matières au choix** (§ 79) |
| **Le décor du Player Hub** | ⛔ Il **existait de bout en bout** : quatre chemins écrivaient « éteins » au lieu de « rien à montrer » (§ 80) |

⭐ **Le motif de la nuit : quatre demandes sur cinq ont révélé un défaut antérieur que la demande ne
nommait pas.** Le pire est le dernier — *la fonctionnalité demandée était déjà construite*, et il a
suffi de suivre sa chaîne avant d'écrire une ligne pour trouver ce qui l'empêchait de se voir.

---

## 1 · Par quoi reprendre

### ⚠️ EN TÊTE : rien de tout cela n'a été joué en séance

Les cinq chantiers sont vérifiés **à l'écran**, un par un, sur demande. Aucun n'a traversé une vraie
partie. *Un effet de lumière, un dé qui roule et un décor qui revient sont trois choses qui ne
ressemblent pas à elles-mêmes quand la table parle en même temps.*

### ⚠️ Six campagnes sur sept n'ont aucune image de fond

Vérifié dans la sauvegarde automatique du 17 à 21 h 29 : seule « Anges de Feu » porte un
`wallpaperUrl`. Le décor ne reviendra que sur celles qui en ont une — ça se règle dans le formulaire de
campagne, onglet **Ambiance Visuelle**.

### ⚠️ Le style « Verre » des dés attend son jugement

La transmission a maintenant un environnement à réfracter, mais **le fond du rendu reste transparent
par nécessité** : il se superpose au Hub. C'est le seul des trois styles dont je ne peux pas prédire le
résultat.

### ⭐ La refonte de l'interface est prête à commencer, et par un geste précis

Les cinq questions sont tranchées. **T0.1** — les captures Playwright de référence — ne change aucun
pixel et ne coûte qu'une soirée. *Rien d'autre ne doit commencer avant elle.*

---

## 2 · Ce qu'il ne faut pas repayer

### ⛔ `partialize` ne décide pas SI l'on écrit, seulement CE QU'ON écrit

Zustand appelle `setItem()` à **chaque** `set()`, sans condition — vérifié dans la source installée.
**Deux modules avaient écrit la croyance inverse** dans un commentaire, et retiré des champs de
`partialize` en croyant supprimer l'écriture.

⭐ *Une optimisation qui vise la charge quand le coût est la fréquence ne réduit rien ; elle rassure.*
Et elle laisse derrière elle un commentaire qui décourage de chercher au bon endroit.

### ⛔ Une garde neuve qu'on n'a pas vue rougir n'est pas encore une garde

Trois contrôles écrits cette nuit sont passés au vert **sans rien examiner** :

| Le contrôle | Pourquoi il ne voyait rien |
| --- | --- |
| l'emprunt de brillance | un `\b` écrit en **caractère retour-arrière** |
| l'annulation du maintien | un repère cherché **dans tout le fichier**, où la chaîne existe ailleurs |
| la séparation d'un amas | un comptage d'**inégalités strictes sur des flottants** |

Et une **mutation de contrôle ne s'est jamais appliquée** — elle visait un bloc écrit en `\n` dans un
fichier en **CRLF**, et `str.replace` ne dit rien quand il ne trouve rien.

⭐ ***Une mutation qui ne s'applique pas rend un essai vert, et ressemble exactement à une garde qui
marche.*** Toute dégradation volontaire doit **vérifier qu'elle a bien eu lieu** avant qu'on juge
l'essai. ⚠️ **Ce dépôt a des fins de ligne mixtes** — `PlayerHub.tsx` en CRLF, `DiceBox3D.tsx` en LF :
les détecter à chaque édition n'est pas une précaution, c'est une nécessité.

### ⛔ Un repère choisi pour sa lisibilité n'est pas un repère choisi pour son unicité

**Quatre fois en deux jours.** `// Apply global brightness` (deux fois dans le fichier), la clé `"fire"`
(quatre fois dans les traductions), `/*` comme marqueur de fin dans un dépôt entièrement commenté, et
`clearTimeout(maintienRef.current)` cherché ailleurs que dans son effet.

⭐ *Dans ce dépôt, où tout est commenté et nommé en clair, la lisibilité rend les repères **moins**
uniques, pas plus.*

### ⛔ Vérifier que ça n'existe pas avant de le construire

*« Peux-tu projeter l'image de base de la campagne ? »* — elle était déjà là : le champ, le réglage, le
transport, la réception, l'affichage. Suivre la chaîne a pris dix minutes et a trouvé le vrai défaut.
**La construire une seconde fois aurait pris une soirée et laissé le défaut en place.**

Corollaire du même soir : **un fichier « nouveau » se vérifie avant d'être écrit.** J'ai écrasé
`fondDuPlayerHub.test.ts` et ses sept essais ; récupérés par `git show HEAD:` parce qu'ils étaient
commités. *S'ils avaient porté du travail non commité, ils étaient perdus.*

### ⛔ Un libellé décrit une intention ; un geste quotidien EST une intention

J'ai rebranché les deux boutons rouges d'Image-OS sur le « vrai noir », au motif que leur infobulle
disait « Éteindre l'écran ». Ce sont ceux que David utilise pour **arrêter une projection**.

⭐ *Quand les deux se contredisent, c'est le geste qui a raison — on corrige le libellé, on ne détourne
pas le bouton.*

### ⭐ Deux bruits aléatoires autour d'une même teinte donnent le même résultat visuel

Quelles que soient leurs amplitudes. C'est ce qui rendait feu de camp et incendie indiscernables, et
c'est pourquoi la correction n'était pas un réglage : *brillance et couleur doivent descendre
**ensemble**, pilotées par une seule variable.*

Décliné le même soir sur les matières des dés : *deux matériaux qui ne diffèrent que par une décimale
de rugosité sont le même matériau.*

### ⭐ Un réglage qui ne voyage pas jusqu'à l'écran qui l'applique n'est pas un réglage

Le segment `dice` portait trois champs sur cinq — et il était écrit **deux fois**. La case « Rendu 3D »
ne faisait rien sur un Hub déjà ouvert, **depuis toujours** : le choix de matière n'a pas créé le
défaut, il l'a rendu visible.

Même famille au petit matin : **le Hub attendait ce qu'il pouvait déduire.** Il lisait le seul des deux
champs qui ne soit pas persisté, alors que de quoi le calculer était déjà sur son disque.

### ⚠️ Un signal qu'on attend doit toujours avoir une échéance

La pose des dés est un **événement**, pas une durée — mais elle a deux filets, et **les deux dégradent
vers le comportement qui existait avant.** ⭐ *Un filet qui dégrade vers l'existant ne peut pas
surprendre : au pire, on retrouve ce qu'on avait.*

---

## 3 · Le diagnostic sans rien demander

Trois fois cette nuit, la **sauvegarde automatique** a servi de source de vérité sans rien demander à
David : elle a dit que six campagnes sur sept n'avaient pas d'image de fond, que la campagne ouverte en
avait bien une, et quels champs le magasin de session persiste vraiment.

⭐ *Le filet posé contre la perte de données est aussi le meilleur outil de diagnostic du dépôt* — il
contient l'état réel, daté, et il se lit sans toucher à l'application.

Dossier : `C:\Projet_David\Security_Backup_GMOS`.
