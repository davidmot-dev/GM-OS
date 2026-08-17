# État et reprise — la Forge de campagne éprouvée, et douze défauts trouvés à la charge

**Date :** 2026-08-16, jusque tard dans la nuit
**Branche :** `feature/tablet-hub-pwa` — 15 commits, 93 fichiers, +7 770 / −1 679
**Documents liés :** `2026-08-15-etat-et-reprise-forge-de-campagne.md` (l'état de la veille) ·
`2026-08-15-forge-de-campagne-et-trame.md` (le plan de référence, étapes 9 à 11)

**À quoi sert ce document.** Reprendre demain sans relire quinze commits. Il dit ce qui tourne, ce qui
attend, ce qu'on ne rouvre pas, et le geste exact pour continuer.

---

## 1. Le geste pour reprendre

**Vérifier le pilote Cthulhu Hack, puis lancer un dé.** Trois choses à contrôler dans
**Règles → Core** et **Règles → Combat** :

| Où | Ce qu'il faut | Pourquoi |
| --- | --- | --- |
| `dice.logic` | **Compter les réussites** | `sum` ne résout pas une Sauvegarde. Le sélecteur n'existait pas avant ce soir |
| `combat.santeDeDepart` | ~~vide~~ → **`points_de_vie`**, le champ des Ressources | La formule visait le « dé de vie », un `d6` et non un nombre : elle ne s'évaluait jamais. Vide, la fiche et le bloc de gauche portaient **deux nombres différents** pour une seule chose |
| `jet.seuil` | **une seule** entrée, sur la section des six Sauvegardes | ~~Une seule entrée signifierait qu'on ne peut jeter que celle-là~~ — **faux, corrigé le 2026-08-17** : les composantes s'ADDITIONNENT, et le choix se joue dans `sectionId` |

> **Défaut n° 13, trouvé en tentant ce contrôle.** Les six Sauvegardes avaient bien été inscrites — et le
> panneau de jet a réclamé les six menus avant de lancer, pour les additionner : un seuil de 60 sur un
> d20. La consigne qui l'a commandé est celle qu'on avait remontée en tête la veille pour qu'elle ne se
> noie pas. *Une consigne remontée en tête est lue ; encore faut-il qu'elle dise vrai.* L'invite est
> corrigée, et un contrôle avertit désormais quand plusieurs composantes lisent la même section.

Puis **un jet d'essai au pupitre**, seuil bas : les réussites doivent tomber **sous** le seuil. C'est le
seul contrôle qui compte, parce qu'un jet résolu à l'envers ne se voit jamais en séance.

---

## 2. Ce qui tourne, et qui a servi pour de vrai

### 2.1 La Forge de campagne — étapes 9, 10 et 11

Onglet **« Trame »** de Forge OS, à côté de « Campagne » : les deux étages du même chantier. Elle lit les
fiches publiées et les projette en objets, dans l'ordre des dépendances.

**Éprouvée sur « Le secret de Milo »** : 3 actes avec leurs enjeux, 29 scènes rattachées à leurs lieux,
43 personnages, 18 liens, 15 indices, 8 lieux, 14 factions. **Six renvois sur environ cent cinquante**
sont tombés à côté — et tous les six ont été **nommés**, avec l'objet qui les portait et le nom écrit.

- **Les actes ne se demandent pas à un modèle** : `etablirLesActes` lit la fiche de structure avec
  `lireLaStructure`, la fonction qui a produit les `partie:` au moment de l'atelier. Les titres sont donc
  identiques au caractère près, par construction.
- **Huit groupes servis à un modèle**, plus `savoir` que le plan du 15 avait oublié — sans lui, « Amorces »
  et « Menaces » ne se projetaient nulle part.
- **Les renvois se font par NOM**, résolus localement en trois degrés : égalité, préfixe de mot entier,
  troncature à 0,85. Les deux derniers rattachent **et** se signalent. Un ex æquo ne résout rien.
- **Reforger n'écrase rien** : un objet portant déjà ce nom est conservé, et les nouveaux renvois pointent
  vers lui.

### 2.2 Le trousseau — élucidé, corrigé, **confirmé**

Les quatre clés sont revenues seules au redémarrage. Le coffre n'avait jamais rien perdu :
`registerSecurityHandlers()` tourne à `main.ts:88`, `app.whenReady()` à la ligne 765, et la lecture
échouait donc avant que le chiffrement ne soit disponible. Le geste naturel — retaper une clé —
réécrivait alors la carte mémoire vide et emportait les autres.

Chargement paresseux, deux formats tentés, état explicite (`vide` ≠ `illisible`), coffre illisible mis de
côté avant toute écriture, valeur vide refusée, et un bandeau qui dit **« ne retape rien »**.

### 2.3 Le pupitre de dés

**Le sens du comptage n'arrivait pas jusqu'au moteur**, sur deux chemins. Le sélecteur `≥ / ≤` était
affiché et ignoré par les deux modes de réserve ; et `jet.sens` vit à côté du bloc `dice` que
`rollFromConfig` reçoit, donc il n'y entrait jamais. Corrigé aux trois appelants — pupitre, tablette,
panneau de jet.

### 2.4 La Forge Système

- **Elle enrichit au lieu de doubler.** La destination met à jour le pilote visé. On remplit ce qui est
  vide, jamais ce qui est pourvu ; le gabarit se complète **par ajout seul** ; `id` et `templateId` sont
  intouchables. Case **« Ne pas toucher à la fiche de personnage »**, cochée par défaut.
- **`groupe.schema` n'arrivait jamais au décodeur** — déclaré depuis le 12 août, lu par personne.
- **Les renvois du carnet** (`[34, 35]`) sont retirés côté règles aussi, sur les quatre appels de prose.
- **Une lacune est une réponse** : une fiche `couverture: absente` ne nourrit aucun groupe et **ne se
  comble pas depuis la famille**.
- **`dice.logic` est enfin éditable** (Règles → Core).

### 2.5 La Forge de chronique est retirée

Elle déversait un document en un seul appel — au-delà des ~8 000 tokens mesurés, tout se perdait sans un
mot — et ne connaissait ni actes, ni scènes, ni indices. Avec elle disparaît
`crossDomainHelpers.ts:42`, le `.filter(r => r.targetId)` par lequel tout ce chantier a commencé.

---

## 3. Ce qui attend

**Trois ménages, aucun urgent.**

1. **Deux campagnes « secret de Milo »** dans les sept. La minuscule est la neuve et la complète ;
   l'ancienne garde les PNJ, lieux et indices de la première forge, orphelins depuis la suppression de ses
   actes. Le piège qui l'a créée est fermé — un homonyme est désormais annoncé — mais le doublon reste.
2. **Le corpus de Cthulhu Hack** porte un doublon exact (`mécanique de déclin des ressources`, deux
   fichiers au contenu identique, seul l'article diffère) et **trois fiches gardent leurs renvois du
   carnet** — inventaire (41), dégâts (34), portées (10). Le retrait agit à la forge, pas
   rétroactivement ; ça se nettoie localement en une commande.
3. **Les 14 factions de Milo** à juger : le chiffre est haut pour trois scénarios, et le groupe a
   peut-être pris des lieux ou des groupes de circonstance pour des organisations.

**Et une question ouverte** : les noms d'objets proches — « Le Sea-You » contre « À bord du Sea-You » —
ne sont pas rapprochés à l'écriture, par choix. Une fusion silencieuse supprimerait une scène distincte
avec ses PNJ et ses indices. Le signalement des « voisins » reste à poser si une reforge future en
produit.

---

## 4. Décisions prises, à ne pas rouvrir

- **Les actes se lisent, ils ne se demandent pas.** *On demande au carnet ce qu'il sait produire, on
  fabrique localement ce qui doit être exact.*
- **La conservation est stricte, la résolution des renvois est graduée.** L'une décide de créer un objet —
  une erreur y fait disparaître une scène ; l'autre pose un lien — une erreur s'y voit et se corrige d'un
  clic. On ne tolère que là où l'erreur est réparable.
- **Un ex æquo ne résout rien.** Une cible plausible et fausse est pire qu'une cible absente, puisqu'elle
  ne se signale pas.
- **On remplit ce qui est vide, on ne remplace jamais ce qui est pourvu** — campagnes et pilotes. « Vide »
  exclut `0` et `false` : ce sont des décisions, pas des trous.
- **Le gabarit se complète par ajout seul.** `sheetData` est indexé par `field.id` ; renommer un champ
  vide la case correspondante sur toutes les fiches déjà remplies.
- **Une lacune est une réponse**, et elle ne se comble pas depuis la famille.
- **La Forge de chronique ne revient pas.** Sa seule capacité propre — avaler un PDF sans corpus — se
  remplace en ajoutant le PDF à un carnet.

---

## 5. La leçon de la journée

**Douze défauts trouvés, aucun par les 1 484 tests.** Ils protégeaient la mécanique ; c'est le corpus réel
qui a montré les questions qu'on n'avait pas posées. Et **neuf des douze ne plantaient pas** — ils
produisaient du faux d'aspect normal :

- une fiche d'acte ignorée en silence, parce qu'un titre avait gagné une parenthèse ;
- trente actes fantômes tirés de la colonne « Sections » d'un tableau ;
- un renvoi perdu pour une lettre manquante ;
- une seconde campagne créée parce qu'un nom différait par sa casse ;
- des clés d'API détruites par le geste qui devait les restaurer ;
- un sélecteur de dés affiché et ignoré ;
- une monnaie de table inventée sur une fiche qui disait qu'il n'y en avait pas ;
- une Sauvegarde qui aurait lancé deux d20 ou un d100 ;
- une santé de départ qui ne s'appliquait jamais.

**Deux fois, c'est un correctif qui a créé le défaut suivant.** Une consigne insérée au milieu d'une cible
en a noyé une autre — `jet.seuil` est ressorti vide le lendemain de sa correction. Et un contrôle écrit
pour rassurer coupait les identifiants sur leur accent, affichant deux erreurs là où il n'y en avait
aucune. *Un contrôle qui se trompe est pire qu'un contrôle absent : il envoie corriger ce qui n'a rien, et
il apprend à ne plus être lu.*

D'où deux réflexes désormais outillés : les tests verrouillent **l'ordre** des invites et non seulement
leur contenu, et un analyseur de formule — celui qui joue en séance — fait foi pour le contrôle.

---

## 6. Restes connus, non traités

- **`AIService.ts:371`** rend `"Résumé non disponible pour ce fournisseur d'IA."` au lieu de lever. David
  est sur Ollama : **ses résumés de séance n'ont jamais fonctionné**, et `syncToNotebook` pousserait cette
  phrase dans le carnet comme source. Signalé le 2026-08-08.
- **L'événement de décès** n'est émis que si le meneur exporte le rapport de combat, et **jamais pour un
  PJ**.
- **`SessionService.saveFullSession` omet `entities` et `clues`** : les PNJ et les indices ne sont pas dans
  les sauvegardes.
- **`docs/campaigns/dune/Agents_of_Dune.md`** est un résumé écrit à la main, hors convention. Forger
  « Agents de Dune » viserait `campaigns/agents-de-dune/`, un autre dossier. Renommer risquerait de casser
  un « Chemin des Notes » déclaré, qui est souverain.
