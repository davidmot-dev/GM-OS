# Fiabilité du Cortex Tactique et de ses entrées de combat

**Date :** 2026-08-07
**Branche :** `feature/tablet-hub-pwa`
**Statut :** ~~constats vérifiés dans le code~~ · **LES CINQ AXES SONT FAITS le 2026-08-22** —
`89e77c0` (axe 5), `6a441f5` (axe 2), `4a57cde` (axes 3 et 4) ; l'axe 1 l'était depuis le 07/08.
Le document passe en **récit clos**, sauf ses trois questions du § 5, dont une est tranchée.

> **Son garde-fou est levé.** Ce document interdisait de le traiter avant les axes A à C du plan jumeau :
> **les trois sont faits** (A le 12/08, B le 09/08, C le 21/08). Rien ne le retient plus.
>
> **Et sa troisième question a gagné une mesure.** *« Fusionner les deux appels du Cortex en un seul »*
> reposait sur une intuition ; le 21/08 a établi que **sous `NUM_PARALLEL=1`, qui est le défaut d'Ollama,
> les deux appels font la queue** — on attend la somme, pas le plus long. Le commentaire qui promettait
> une « exécution parallèle » est parti.
>
> ~~**Rappel de l'axe 5**~~ — corrigé le 22/08 : le pilote déclare son unité, et le rapport l'emploie.
**Origine :** extrait de la séance de conception sur l'accélération IA, à la demande de David, qui a
signalé que le Cortex *« repose sur des mécanismes qui ne sont pas toujours bien gérés au niveau du
module de combat »*. Le constat lui donne raison.

**Document jumeau :** `documentation/Planning/2026-08-07-acceleration-ia.md`, qui traite les défauts de
**performance** du Cortex (contexte RAG envoyé en double, préfixe non réutilisable, contexte trop
large). **Les deux se lisent ensemble** — accélérer un module dont les entrées sont fausses ne ferait
que produire des conseils faux plus vite.

---

## 1. Le problème n'est pas la vitesse

Le Cortex a le budget de temps le plus serré des trois usages IA (30 à 60 s), parce qu'il est le seul
dont **le conseil se périme** : un avis tactique qui arrive après que le joueur a agi ne vaut rien,
alors qu'une réponse de règle reste valable.

Mais son vrai défaut est ailleurs. **Plusieurs de ses entrées sont approximatives ou dérivées par
défaut, et le module raisonne dessus sans distinguer une donnée fiable d'une donnée devinée.**

Un point de vocabulaire qui structure tout ce document : le Cortex **signale** souvent l'absence d'une
donnée (§ 2.6), mais il ne **hiérarchise** jamais la confiance. « Faction : enemy » s'écrit de la même
façon qu'elle ait été saisie par le MJ ou devinée par un `||` de repli.

---

## 2. Constats

### 2.1 La configuration tactique du système est ignorée — *sévère*

`GameDriver.tactical.ranges` (`src/types/drivers.ts:38,81`) porte les portées propres à chaque système.
Deux appelants le transmettent correctement :

- `src/modules/dice/DiceBoard.tsx:609` — `tacticalService.getRangeInfo(tA, tB, gridSize, activeDriver?.tactical)`
- `src/modules/tactical-ai/hooks/useTacticalOrchestrator.ts:245` — `GridEngine.getRangeInfo(units, tacticalConfig)`

**Mais pas le rapport de situation du Cortex :**

```ts
// src/modules/tactical-ai/logic/TacticalNarrativeService.ts:74
const rangeInfo = GridEngine.getRangeInfo(distanceUnits);   // aucune config
```

`GridEngine.getRangeInfo` retombe alors sur ses défauts codés en dur, **explicitement commentés
« Default fallback (Alien-like) »** (`GridEngine.ts:38-45`) : Contact ≤ 1,5 ; Courte ≤ 3,5 ;
Moyenne ≤ 12,5 ; Longue ≤ 50.

**Conséquence : quel que soit le système joué, le Cortex classe les distances avec les portées d'Alien.**
Pour les deux mêmes jetons, la table de dés et le Cortex peuvent annoncer deux catégories de portée
différentes. C'est une incohérence interne à l'application, pas une simple imprécision.

### 2.2 L'unité de distance est codée en dur — *modéré*

`TacticalNarrativeService.ts:165` écrit `${e.distance} cases`. Le mot « cases » est imposé, alors que
les systèmes comptent en zones (Alien), en mètres, en pieds ou en cases selon les cas. Même famille de
défaut que 2.1 : une convention d'un système appliquée à tous.

### 2.3 La faction est devinée, et deux notions homonymes coexistent — *sévère*

```ts
// src/modules/combat/useCombatStore.ts:153
faction: combatant.faction || (combatant.isPlayer ? 'player' : 'enemy')
```

**Tout combattant non-joueur devient `enemy` par défaut.** Or le Cortex sépare alliés et cibles sur
`c.faction === actor.faction` (`TacticalNarrativeService.ts:76`). Un PNJ allié, une créature neutre ou
un PJ charmé sont donc désignés comme cibles tant que personne ne corrige à la main.

Le champ sert aussi au calcul de moral : `checkFactionRout` (lignes 118-122) répartit les combattants par
faction pour produire la « Morphologie du Combat : Alliés X % vs Ennemis Y % » (ligne 183). **Une faction
mal fixée fausse donc aussi l'estimation de déroute**, qui est l'un des rares éléments stratégiques du
rapport.

**Collision de vocabulaire, à trancher :**

| Type | Nature | Exemple | Producteur |
|---|---|---|---|
| `Entity.faction` (`entity.types.ts:73`) | texte libre, narratif | « Garde Royale » | Forge Chronique |
| `Combatant.faction` (`combat/types.ts:31`) | énuméré tactique à 4 valeurs | `player \| enemy \| neutral \| ally` | combat |

La Forge Chronique génère le premier (son prompt demande explicitement `"faction": "Garde Royale | Clan
du Loup"`), le Cortex lit le second. **Les deux ne communiquent pas**, et portent le même nom.

### 2.4 Le lien jeton ↔ combattant est fragile — *modéré*

`linkedCombatantId` n'est posé que par le bouton de `src/modules/map/components/MapControls.tsx:1018`.
Pour tout jeton créé autrement, la résolution retombe sur une égalité de noms :

```ts
// TacticalNarrativeService.ts:53-54 et 67-68
t.linkedCombatantId === actor.id ||
t.name.toLowerCase().trim() === actor.name.toLowerCase().trim()
```

Casse et espaces de bord sont normalisés, rien de plus. « Garde 1 » et « Garde #1 » ne se lient pas, et
le combattant disparaît alors de l'analyse sans qu'aucun message ne le signale — contrairement au cas de
l'acteur principal, qui est signalé (§ 2.6).

### 2.5 `gridSize` vaut 50 px par défaut — *modéré*

`GridEngine.pxToUnits(px, gridSize = 50)`. Sur une carte dont la grille n'a pas été calibrée, l'unité est
arbitraire : toutes les distances, donc toutes les catégories de portée, deviennent fausses. Le rapport
n'indique jamais si la calibration a eu lieu.

### 2.6 Ce qui fonctionne, et qu'il ne faut pas casser

Le module signale plusieurs absences, et c'est à porter à son crédit :

- `TacticalNarrativeService.ts:153-154` — « Note : Absent de la carte Atlas » quand l'acteur n'a pas de
  jeton lié.
- Ligne 168 — « Aucun ennemi sur carte ».
- Ligne 156 — « Position : Valide (Atlas) » dans le cas nominal.

> **Correction d'un constat erroné.** Une première analyse avait conclu à un « effondrement silencieux »
> quand l'acteur n'a pas de jeton. **C'est faux** : l'absence est bien écrite dans le prompt. Le défaut
> réel est plus faible et d'une autre nature — l'information est transmise comme une ligne discrète
> parmi d'autres, **et aucune consigne n'interdit au modèle de produire malgré tout un conseil de
> placement**. Le problème est l'absence d'instruction, pas l'absence d'information.

### 2.7 La détection de zone de danger est approximative — *mineur*

```ts
// TacticalNarrativeService.ts:113-114
// Zones typically have a radius or size. We check if actor is within 2 units of the zone edge (simplified)
return distUnits <= (dz.radius || 2) + 1;
```

Distance de centre à centre comparée à un rayon, plus une marge d'une unité, avec un rayon de repli
arbitraire. Le commentaire assume la simplification — c'est honnête, mais la marge et le repli ne sont
liés à aucune règle de système.

---

## 3. Ce que ça produit à table

| Symptôme observable | Cause |
|---|---|
| Le Cortex conseille de tirer « à portée Moyenne » sur une cible que la table de dés classe autrement | 2.1 |
| Un PNJ allié est proposé comme cible | 2.3 |
| Le pourcentage de déroute paraît incohérent avec la situation | 2.3 |
| Un combattant présent sur la carte est ignoré par l'analyse | 2.4 |
| Les distances semblent absurdes sur une carte donnée | 2.5 |
| Un conseil de placement est produit alors que l'acteur n'est pas sur la carte | 2.6 |

Aucun de ces symptômes ne se présente comme une erreur : **le conseil sort toujours avec le même
aplomb.** C'est le point central de ce document.

---

## 4. Axes de correction

> **✅ LES CINQ SONT FAITS le 2026-08-22.** Ce que chacun a réellement trouvé — et qui dépassait souvent
> le constat — est consigné dans son commit. Trois choses méritent d'être remontées ici, parce qu'elles
> corrigent le plan lui-même :
>
> - **L'axe 2 était pire que décrit.** Le plan visait la valeur par défaut (`enemy`) ; le vrai défaut
>   était **le tri lui-même**, `c.faction === actor.faction`. Un PNJ *explicitement marqué allié* n'est
>   pas `player` : il tombait du côté des cibles. Corriger la valeur par défaut n'y aurait rien changé.
>   Et la bonne notion existait déjà à dix lignes de là — `campDe`, dans `OrdreDuTour`, que l'écran
>   d'alternance utilise. **Deux écritures de « qui est de mon côté », et elles se contredisaient.**
> - **L'axe 5 en cachait un second.** Le pilote ne déclarait pas son unité de distance — mais il
>   déclarait déjà **le nom de ses portées**, et personne ne le lisait : `getRangeInfo` rendait la clé
>   canonique, donc trois écrans affichaient « Contact » sur un jeu qui dit « au toucher ».
> - **L'axe 3 se corrige au goulot, pas chez les appelants.** Poser `linkedCombatantId` dans les quatre
>   chemins manquants aurait tenu jusqu'au cinquième. `addToken` le pose désormais lui-même, à partir du
>   `sourceEntityId` que ces chemins connaissent — *un identifiant, et non un mot.*
>
> **Et le test que l'axe 1 réclamait depuis le 07/08 est écrit** : les appelants s'accordent sur la même
> distance, vérifié sur sept valeurs.

**Axe 1 — Transmettre la configuration tactique.** Passer `activeDriver?.tactical` à
`GridEngine.getRangeInfo` dans `TacticalNarrativeService`, comme le font déjà `DiceBoard` et
`useTacticalOrchestrator`. Correction d'une ligne. **Ajouter un test qui vérifie que les trois appelants
produisent la même catégorie pour la même distance** — c'est la cohérence entre modules qui a manqué,
pas le calcul lui-même.

**Axe 2 — Rendre la faction explicite.** Cesser de dériver `enemy` par défaut : soit un choix demandé à
l'ajout d'un combattant, soit une valeur `unknown` que le Cortex traite comme telle plutôt que comme une
hostilité. **Et trancher la collision `Entity.faction` / `Combatant.faction`** — renommer l'une des deux,
ou établir une correspondance explicite entre la faction narrative et le camp tactique.

**Axe 3 — Fiabiliser le lien jeton ↔ combattant.** Poser `linkedCombatantId` sur tous les chemins de
création de jeton, et **signaler dans le rapport les combattants non résolus** plutôt que de les omettre.

**Axe 4 — Qualifier les entrées plutôt que de les uniformiser.** Le rapport devrait distinguer ce qui est
mesuré de ce qui est supposé : grille calibrée ou non, faction saisie ou déduite, jeton lié ou apparié
par nom. **Et instruire explicitement le modèle** de ne pas produire de conseil de placement quand la
position n'est pas fiable — ce qui manque aujourd'hui (§ 2.6).

**Axe 5 — L'unité de distance.** La tirer du driver plutôt que d'écrire « cases » en dur.

---

## 5. Reste à décider

- **Fusionner les deux appels du Cortex en un seul ?** Non évalué. Le module lance une narration en
  streaming et une génération de conseils en JSON (`useTacticalAIStore.ts:89-114`), séquentialisées de
  fait par `OLLAMA_NUM_PARALLEL=1`. Une passe unique rendant les deux à la fois diviserait le temps par
  deux, au prix de la disparition du retour progressif. **C'est peut-être le vrai levier de performance
  du Cortex**, plus que les réglages traités dans le plan jumeau.
- ✅ **Quel comportement quand les entrées ne sont pas fiables ?** **Tranchée le 2026-08-22 : conseiller
  en restreignant le propos.** Sans position connue, le rapport écrit désormais *« AUCUNE POSITION
  CONNUE : ne conseille aucun déplacement ni aucune portée. Tiens-toi à ce qui ne dépend pas du terrain —
  santé, états, moral. »* Il n'a pas fallu segmenter le prompt : une consigne à l'endroit où l'absence
  est déjà annoncée a suffi. *Le défaut n'était pas l'absence d'information, c'était l'absence
  d'instruction* — le § 2.6 le disait, et c'était la bonne lecture.
- **Faut-il un mode « hors carte » assumé ?** Beaucoup de combats se jouent sans carte. Le Cortex y est
  aujourd'hui dégradé par accident plutôt que conçu pour, alors que conseiller sur la seule base des PV,
  des états et du moral reste parfaitement possible.

---

## 6. Points de vigilance

- **Ne pas traiter ce plan avant les axes A à C du plan jumeau.** Le Cortex y gagne d'abord un temps de
  réponse acceptable ; le rendre juste avant de le rendre utilisable inverserait l'ordre utile.
- Les constats ci-dessus sont **lus dans le code, non observés en séance**. Une partie réelle avec un
  système autre qu'Alien confirmerait 2.1 et 2.3 en quelques minutes — c'est la vérification la moins
  coûteuse et la plus concluante.
- `useCombatStore` est persisté sous `gmos-combat-storage` et écrit par toutes les fenêtres — même
  configuration que le bug de persistance corrigé le 2026-08-07 sur un autre store. **Sans rapport avec
  le Cortex, mais dans le même module**, et toujours non traité.
