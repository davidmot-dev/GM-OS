# Les rencontres préparées — plan du 12/10/2026

**Né du débriefing de la première séance jouée** (11/10). Combat-OS n'a pas servi, et David l'a dit
le lendemain : *« je n'ai pas utilisé Combat-OS parce que la mise en place est trop longue »*. Sa
demande : **prévoir les rencontres à l'avance, les lier à une scène, et n'ajouter les PJ qu'au
moment où le combat démarre.** Ligne « trop lourd à ouvrir » du § 1 bis du
[registre](2026-08-23-chantiers-gares.md).

**Aucune ligne de code modifiée à ce jour.**

## Ce qui existe déjà — et ce qui manque

| Déjà là | Où |
| --- | --- |
| Un plateau **par scène**, garé et rendu à la bascule (combattants, tour, round, jetons de la carte) | `useCombatStore` : `combatsGares`, `basculerVersLaScene` |
| Les PJ que la scène déclare présents **entrent seuls** sur le plateau | `faireEntrerLesPJDeLaScene` (`useCombatStore.ts`) |
| Fabriquer N adversaires d'un **gabarit du bestiaire** ou d'un archétype × rang | `AtelierDesAdversaires.tsx` (`envoyerAuCombat`), `logic/fabriqueDAdversaire.ts` |
| Envoyer un **PNJ de la campagne** au combat | `NpcDetail`, `NpcGallery`, `NPCCard` (`sourceEntityId`) |

| Manque | Pourquoi ça coûte en séance |
| --- | --- |
| Rien ne se **prépare** : Combat-OS ne connaît que les scènes **en cours** (`BandeauDeLaScene`, `scenesDansLEtat(…, 'en-cours')`) | Tout se compose au moment où les figurines arrivent sur la table |
| Aucun geste ne **pose une rencontre d'un coup** | Un passage dans la Fabrique par type d'adversaire, puis les PNJ un par un |

## Les décisions de David (12/10)

| Question | Décision |
| --- | --- |
| Combien de rencontres par scène | **Plusieurs** (« la patrouille », « les renforts au round 3 ») |
| L'initiative à l'invocation | **Ne se tire pas toute seule** : le meneur la tire, ou les joueurs lancent |
| Où l'on compose | **Dans la Trame (la scène)** et **directement dans Combat-OS** — les deux |
| Où l'on invoque | **Dans Combat-OS — obligatoirement.** (Le bouton de l'écran « Scène en cours » vient en plus, jamais à la place) |

## Le modèle — sur la scène, des identifiants, facultatif

Sur `Scene` (`src/types/trame.types.ts`), un champ **facultatif**, lu avec `?? []` comme
`enchainements` — et pour la même raison qu'eux, il **vit sur la scène plutôt que dans une
collection à part** : *une collection séparée aurait demandé d'apprendre à la sauvegarde, à la purge
et aux gestes de curation qu'elle existe.*

```ts
rencontres?: RencontrePreparee[];

interface RencontrePreparee {
    id: string;
    nom: string;                 // « La patrouille »
    notes?: string;              // tactique, déclencheur, terrain
    lignes: LigneDeRencontre[];
}

type LigneDeRencontre =
    | { genre: 'gabarit';   gabaritId: string; nombre: number; faction?: Faction;
        /* repli si le gabarit n'existe pas sur cette machine : */ nom: string; archetypeId: string; rangId: string }
    | { genre: 'archetype'; archetypeId: string; rangId: string; nombre: number; nom?: string; faction?: Faction }
    | { genre: 'entite';    entiteId: string; faction?: Faction };   // un PNJ de la campagne
```

- **Des renvois, pas des fiches.** Le gabarit est lu **au moment de l'invocation** : un gabarit
  retouché la veille donne des adversaires retouchés. Les exemplaires sont fabriqués **à neuf à
  chaque invocation** — une rencontre est un **modèle**, elle ne se consomme pas (fuite, retour,
  scène rejouée).
- ⚠️ **Le repli du gabarit.** Le bestiaire appartient **au jeu**, pas à la campagne : une campagne
  emportée par Nexus-OS sur une autre machine arrive avec des `gabaritId` inconnus. La ligne garde
  donc `nom`, `archetypeId` et `rangId` — sans le gabarit, elle fabrique encore, à partir de
  l'archétype.
- `faction` : `enemy` par défaut ; un PNJ allié se déclare `ally`.

**Les gestes qui recopient une scène, à vérifier un par un** (*un champ qu'un clone oublie est une
donnée perdue au premier clic*) : `clonerLaScene` (`logic/trame.ts`) recopie par décomposition —
⚠️ il faut **renouveler les `id`** des rencontres du clone ; la **fusion** doit **réunir** les deux
listes ; la **scission** doit dire où elles vont ; l'export Nexus-OS, la sauvegarde et la purge
emportent le champ avec la scène.

## L'invocation — dans Combat-OS

Un panneau **« Rencontres »** dans Combat-OS :

1. En tête, les rencontres de la **scène rattachée** au combat ; puis celles des **scènes en
   cours** ; puis, repliées, celles des autres scènes de la campagne.
2. **Invoquer** : rattache le combat à la scène (`rattacherLeCombat` ou `basculerVersLaScene`), fabrique
   les exemplaires, ajoute les PNJ, **fait entrer les PJ de la scène** — et **ne tire pas
   l'initiative**.
3. Invoquer une seconde rencontre (les renforts) **ajoute** au plateau, ne le remplace pas.

⛔ **La fabrication ne doit exister qu'une fois.** `envoyerAuCombat` vit aujourd'hui dans le
composant `AtelierDesAdversaires` ; l'invocation en a besoin. La sortir dans `logic/` avant de
l'appeler une seconde fois — *ce qu'on recopie finit par diverger.*

## Composer

- **Dans la Trame** : une section « Rencontres » dans l'inspecteur de la scène. Ajouter une ligne
  depuis le bestiaire du jeu, un archétype × rang, ou un PNJ de la campagne (en tête : les PNJ de la
  scène, `entiteIds`).
- **Dans Combat-OS** : le geste le plus court réutilise ce qui existe. On compose le plateau **comme
  aujourd'hui** (Fabrique, PNJ), puis **« Garder comme rencontre… »** demande la scène — y compris
  une scène **prévue** — et un nom. Les PJ ne sont pas gardés : ils entreront à l'invocation.
  *Un second compositeur dans Combat-OS serait un second écran à apprendre pour le même geste.*

## L'ordre

| Étape | Contenu | Dépend de |
| --- | --- | --- |
| **R1** | Le modèle, la fabrication sortie dans `logic/`, l'invocation dans Combat-OS | — |
| **R2** | « Garder comme rencontre… » dans Combat-OS | R1 |
| **R3** | La section « Rencontres » de la scène dans la Trame | R1 |
| **R4** | Le bouton « Invoquer » sur l'écran « Scène en cours » | R1 et l'[écran Scène en cours](2026-10-11-ecran-scene-en-cours.md) |

## Restent sans réponse

- **Une rencontre sans scène** (la patrouille aléatoire, réutilisable partout) : faut-il la
  permettre ? Le plan suppose que **toute rencontre appartient à une scène** ; une rencontre
  « volante » demanderait un rangement à part.
- **Les jetons de la carte** : faut-il poser les pions sur la carte à l'invocation, ou seulement
  dans l'ordre du tour comme la Fabrique aujourd'hui ?
