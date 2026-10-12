# Les rencontres préparées — plan du 12/10/2026

**Né du débriefing de la première séance jouée** (11/10). Combat-OS n'a pas servi, et David l'a dit
le lendemain : *« je n'ai pas utilisé Combat-OS parce que la mise en place est trop longue »*. Sa
demande : **prévoir les rencontres à l'avance, les lier à une scène, et n'ajouter les PJ qu'au
moment où le combat démarre.** Ligne « trop lourd à ouvrir » du § 1 bis du
[registre](2026-08-23-chantiers-gares.md).

**État au 12/10 : R1 (`e6826f28`) et R2 faits, à éprouver à l'écran ; restent R3 (la Trame) et R4.**
R2 : dans le panneau « Rencontres préparées », **« Garder le plateau comme rencontre… »** — nom, scène
(prévue, en cours, ou aucune), notes, et « vider le plateau ensuite » coché d'avance quand le combat n'a
pas de scène (préparation). Le plateau devient un modèle (`combat/logic/rencontreDuPlateau.ts`) : PJ
écartés, exemplaires numérotés regroupés (« 3 × Goule »), gabarit du bestiaire désigné quand le nom et
l'archétype concordent, PNJ en renvoi. ⚠️ Les adversaires fabriqués sont **refabriqués** à l'invocation :
leurs valeurs exactes ne sont pas gardées (le formulaire le dit, et renvoie au bestiaire).
Fichiers : modèle `src/types/rencontres.types.ts`, tranche
`session/store/rencontresSlice.ts`, gestes de la trame `session/logic/rencontresDeLaTrame.ts`,
fabrication et invocation `combat/logic/invocationDeRencontre.ts` (l'Atelier et la galerie des PNJ
l'appellent désormais), action `invoquerLaRencontre` de `useCombatStore`, panneau
`combat/components/PanneauDesRencontres.tsx`.

⚠️ **Le piège payé à l'écriture** : `addCombatant` rattache seul un plateau vide à la scène en cours
**et y fait entrer tous ses PJ**. L'invocation rattache donc la scène elle-même, *sans* ses PJ
(`rattacherLeCombat`/`basculerVersLaScene` prennent `{ sansLesPJ }`), avant le premier combattant. Les
essais échouent bien quand on retire l'option (vérifié). ⚠️ **Défaut voisin, non corrigé** :
`NpcDetail` envoie un PNJ au combat toujours en `enemy`, la galerie selon son rôle — deux portes, deux
camps.

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
| Une rencontre **sans scène** (la patrouille aléatoire) | **Oui** |
| Des pions sur la carte à l'invocation | **Non** : l'ordre du tour seulement, comme la Fabrique aujourd'hui |
| Les PJ | **Le meneur les choisit au moment de commencer le combat** : *« je veux pouvoir mettre les PJ au moment de commencer le combat »* |

## Le modèle — une collection de la campagne, la scène en renvoi facultatif

⚠️ **La rencontre sans scène a changé le rangement.** La première version de ce plan la mettait
**sur la scène** (`Scene.rencontres`), comme `enchainements`. Une rencontre qui peut n'appartenir à
aucune scène n'a plus sa place là : elle aurait demandé **deux rangements** — sur la scène, et à
part pour les « volantes » — et rattacher une patrouille à une scène serait devenu un déménagement
d'un conteneur à l'autre. **Une seule collection, la scène en renvoi** :

```ts
// Session-OS, nouvelle tranche `rencontresSlice` — comme `clues`
rencontres: RencontrePreparee[];

interface RencontrePreparee {
    id: string;
    campaignId: string;
    /** Absent : une rencontre libre, invocable dans n'importe quelle scène. */
    sceneId?: string;
    nom: string;                 // « La patrouille »
    notes?: string;              // tactique, déclencheur, terrain
    lignes: LigneDeRencontre[];
    creeeLe: number;
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

**Ce que la collection séparée coûte, et qu'il faut payer en entier** — *une collection séparée doit
apprendre à la sauvegarde, à la purge et aux gestes de curation qu'elle existe* (l'argument du
commentaire d'`enchainements`, qui reste vrai) :

| Lecteur | Ce qu'il doit apprendre |
| --- | --- |
| Persistance du magasin de séance | la tranche, son état initial, sa `partialize` |
| Sauvegarde automatique (`SessionService`) | la collection, et un essai qui le prouve |
| Purge d'une campagne (`services/purge/detenteursDeLaCampagne.ts`) | un détenteur de plus, compté |
| Export / import Nexus-OS | la collection, avec ses `sceneId` renumérotés si l'import les renumérote |
| **Supprimer une scène** | ⛔ ses rencontres **deviennent libres** (`sceneId` retiré) — jamais effacées : *une rencontre préparée est du travail du meneur* |
| **Cloner une scène** | ses rencontres sont **recopiées avec de nouveaux `id`**, rattachées au clone |
| **Fusionner deux scènes** | les rencontres des deux passent à la scène qui reste |
| **Scinder une scène** | les rencontres restent à la scène d'origine |

## L'invocation — dans Combat-OS

Un panneau **« Rencontres »** dans Combat-OS :

1. En tête, les rencontres de la **scène rattachée** au combat ; puis celles des **scènes en
   cours** ; puis les **rencontres libres** ; puis, repliées, celles des autres scènes de la
   campagne.
2. **Invoquer** ouvre un court choix **« Qui entre ? »** : les PJ de la campagne, à cocher.
   - **Cochés d'avance** : les PJ que la scène déclare présents (`personnagesIds`) ; une rencontre
     libre sans scène n'en coche **aucun** — rien ne dit qui est là.
   - **Déjà sur le plateau** (des renforts) : grisés, ils gardent leurs points de vie et leur
     initiative.
   - **Entrée valide** : quand la scène a bien déclaré ses PJ, l'invocation reste un geste.
3. **Valider** : rattache le combat à la scène (`rattacherLeCombat` ou `basculerVersLaScene`),
   fabrique les exemplaires, ajoute les PNJ et **les PJ cochés** — et **ne tire pas l'initiative**.
   ⚠️ La bascule fait aujourd'hui entrer les PJ de la scène d'elle-même
   (`faireEntrerLesPJDeLaScene`) : l'invocation doit passer **sa** liste, sans quoi un PJ décoché
   entrerait quand même.
4. Une rencontre **libre** rejoint le combat **là où il est** — la scène rattachée, ou la seule
   scène en cours (la règle de `rattacherLeCombatQuiDemarre`, déjà en place). Plusieurs scènes en
   cours et aucune rattachée : le bandeau de la scène pose déjà la question, on ne la pose pas une
   seconde fois.
5. Invoquer une seconde rencontre (les renforts) **ajoute** au plateau, ne le remplace pas.
6. **Aucun pion sur la carte** (décision du 12/10) : l'invocation remplit l'ordre du tour, comme la
   Fabrique.

⛔ **La fabrication ne doit exister qu'une fois.** `envoyerAuCombat` vit aujourd'hui dans le
composant `AtelierDesAdversaires` ; l'invocation en a besoin. La sortir dans `logic/` avant de
l'appeler une seconde fois — *ce qu'on recopie finit par diverger.*

## Composer

- **Dans la Trame** : une section « Rencontres » dans l'inspecteur de la scène. Ajouter une ligne
  depuis le bestiaire du jeu, un archétype × rang, ou un PNJ de la campagne (en tête : les PNJ de la
  scène, `entiteIds`).
- **Dans Combat-OS** : le geste le plus court réutilise ce qui existe. On compose le plateau **comme
  aujourd'hui** (Fabrique, PNJ), puis **« Garder comme rencontre… »** demande un nom et une scène —
  y compris une scène **prévue**, ou **aucune** pour une rencontre libre. Les PJ ne sont pas gardés : ils entreront à l'invocation.
  *Un second compositeur dans Combat-OS serait un second écran à apprendre pour le même geste.*
- **Rattacher, détacher** : depuis le panneau « Rencontres », une rencontre libre se rattache à une
  scène, et l'inverse — c'est un champ, pas un déménagement.

## L'ordre

| Étape | Contenu | Dépend de |
| --- | --- | --- |
| **R1** | La collection et ses lecteurs (tableau ci-dessus), la fabrication sortie dans `logic/`, l'invocation dans Combat-OS | — |
| **R2** | « Garder comme rencontre… » dans Combat-OS | R1 |
| **R3** | La section « Rencontres » de la scène dans la Trame | R1 |
| **R4** | Le bouton « Invoquer » sur l'écran « Scène en cours » | R1 et l'[écran Scène en cours](2026-10-11-ecran-scene-en-cours.md) |

## Restent sans réponse

Aucune au 12/10. *(La rencontre libre invoquée sans scène est tranchée par le choix « Qui
entre ? » : le meneur coche.)*
