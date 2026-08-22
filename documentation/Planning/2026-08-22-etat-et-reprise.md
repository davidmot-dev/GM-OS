# État et reprise — le plan du 08/08 est clos, et le socle d'accélération avec lui

**Nature de ce document : instantané daté.** Vrai le matin du 2026-08-22, faux le lendemain par
construction. À lire pour reprendre, **jamais pour connaître un état** — celui-ci se vérifie dans le code.

**Date :** 2026-08-22, matin
**Branche :** `feature/tablet-hub-pwa` — `09be84f`. Arbre propre.
**Contrôles, passés ce matin :** `tsc -b` **propre** (la vraie, pas `--noEmit`) · **1 952 tests au vert**
sur 161 fichiers (+151 depuis le 20/08) · ESLint **536** problèmes contre 534.
**Documents liés :** `2026-08-19-reconciliation-plans-aout.md`, § 5 (**la liste consolidée des restes, et
le seul endroit où elle vit**) · `2026-08-07-fiabilite-cortex-combat.md` (le chantier de code le plus mûr)
· `2026-08-07-acceleration-ia.md` (son socle est posé, son ordre est à relire).

**Ce document remplace `2026-08-20-etat-et-reprise.md`**, qui disait encore « à faire » ses trois listes
de restes : elles sont closes.

---

## 1. Le geste de reprise, et il n'y en a qu'un

> **Rejouer une séance, et regarder trois choses précises.** Rien d'autre, et avant tout le reste.

Le 20/08 disait déjà « jouer une séance ». **Elle a eu lieu le 21**, et elle a payé : huit des dix-neuf
commits de ces deux jours corrigent un défaut qu'elle seule pouvait montrer. Aucun n'a été trouvé à la
lecture du code. La leçon ne faiblit toujours pas.

Quatre contrôles, et chacun tient un chantier entier :

| # | Le geste | Ce qu'il vérifie |
| --- | --- | --- |
| 1 | Ouvrir une scène, poser une question à l'Oracle | Il doit **nommer la scène ou son enjeu** sans qu'on le lui ait dit — l'étape 10 |
| 2 | Séparer le groupe, ouvrir deux scènes, interroger | **Les deux** doivent apparaître, nommées |
| 3 | Lancer un jet d'équipement sous Alien | **Sept dés, pas seize** — depuis le pupitre **et** depuis la tablette |
| 4 | Clore la séance, ouvrir la revue, **fusionner** puis **scinder** | Les cinq gestes de curation, dont les deux livrés hier |

**Le premier ne se lit plus dans le code : il se lit dans le journal.** `~/ollama_debug.log` porte
désormais les **titres des sections du contexte et leur poids** — « Scènes en cours » y est ou n'y est
pas, avec le nombre de caractères qui dit si elle est pleine. C'est la question exacte que David a posée
le 22/08, et à laquelle rien ne pouvait répondre avant.

**Une réparation de données à faire à la main**, et elle ne peut pas s'automatiser : les combattants nés
du défaut `gmPrompt` — nommés **« Ajouter un Combattant »** — sont **toujours en base**. Ils se renomment
ou se retirent depuis l'écran de combat. Sinon ils reviendront dans le prochain résumé de séance, comme
dans celui du 21/08 où *« un allié, Ajouter un Combattant, est précipité hors de combat »*.

---

## 2. Ce qui a été fait depuis le 20/08 — dix-neuf commits

### 2.1 Le plan du 08/08 est clos (`516395a`)

**L'étape 10, la dernière des dix.** L'Oracle recevait la campagne, les PJ, les PNJ vivants, les indices
et dix événements bruts — **aucune scène, aucun acte, aucun enjeu**, exactement comme le § 7 du plan le
décrivait treize jours plus tôt. Il reçoit désormais les scènes en cours avec acte, enjeu, lieu, PJ
présents et PNJ en piste ; l'historique est **réduit et non jeté** — huit faits de `chronique` tirés de
`leRecitCureDuJournal`, dans l'ordre de l'histoire. Le Cortex reçoit son ancrage en mode allégé, une
ligne par scène.

Deux choix qui tiennent tout le reste : **deux scènes ouvertes est le cas normal** — les deux partent,
en choisir une aurait répondu sur la moitié de la table ; et **les champs vides ne laissent pas
d'étiquette orpheline** — « Lieu : » sans lieu coûte des jetons pour dire qu'on ne sait rien.

### 2.2 Le socle du plan d'accélération est posé (`4a17b4d`, `9069da3`, `e2d50dc`, `859fd48`)

Ouvert par David : *« les temps de réponse sont très longs »*, puis *« je n'ai pas la main sur le Cortex
quand je forge »*.

- **Axe C.** L'ordre du prompt interdisait toute réutilisation de cache : le bloc volatil précédait le
  bloc massif, donc **un PJ perdant un point de vie repayait le prefill de tout le RAG**. Inversé, et
  l'assemblage devient une fonction pure — *une inversion est invisible à la lecture d'un résultat*. Le
  Cortex cesse de charger tout le lore de campagne pour répondre « attaquer ou se déplacer ? ».
- **Axe D.** **Aucun plafond de temps n'était réel** : les `Promise.race` rejetaient l'attente pendant
  que la génération continuait chez Ollama, sur l'unique créneau de `NUM_PARALLEL: 1`. Un registre de
  contrôleurs côté processus principal, branché sur les trois `fetch`. Puis D.4 et D.5 : **un seul
  plafond, qui consulte le moment de jeu** — trois plafonds vivaient chacun de leur côté et ne
  s'accordaient sur rien.
- **Axe E.1.** `chatStream` fabriquait son propre corps de requête et **n'avait donc reçu aucune des
  corrections de `chat` depuis deux mois — pas même `think: false`**, dont ce fichier mesure pourtant le
  prix : 349 s et un contenu vide, contre 64 s. *Et c'est ce chemin que l'Oracle emprunte.*

### 2.3 La curation est complète, et le journal ne ment plus (`82708b8`, `40f6aa9`, `655c715`)

- **Fusionner et scinder** — les deux derniers gestes du § 4.1. Ils déplacent des événements, donc trame
  **puis** journal, jamais l'inverse : dans cet ordre le pire cas laisse des orphelins, que la revue rend
  visibles. Trente tests, dont celui qui compte : **scinder puis refusionner rend le fil intact.**
- **Les trois arbitraires de l'axe trace/chronique**, tranchés par David. Le pire des trois :
  `navigateToAtlasMap` écrivait *« Le groupe se déplace vers X »* **sur un simple clic dans l'atlas** —
  consulter sa carte suffisait à faire voyager le groupe dans le résumé. *Les deux autres ajoutaient du
  bruit ; celui-ci ajoutait un fait, et un fait faux ne se plaint de rien.*
- **Les deux défauts de sauvegarde** du § 2.3 du 20/08 : le `.default([])` qui remplaçait une chronologie
  vivante par du vide au chargement, et `validateSession` qui rendait une session complète sur échec —
  d'où « Session chargée et vérifiée 📂 » sur un chargement qui n'avait rien chargé.

### 2.4 Le corpus de Rêves de Dragons, et l'index qui ne chargeait pas (`9172752`, `21d9349`, `4786921`)

**7 fiches v1 → 21 fiches v3**, les v1 archivées dans `rules-v1/` et hors de l'index par le `.ragignore`.
Un doublon vieux du 09/08 résolu au passage — deux fiches portaient le même `sujet:`, et l'Oracle
recevait les deux.

**Mais c'est l'index du livre qui change le plus.** Les deux fichiers déposés par David — index
alphabétique et sommaire — **rendaient zéro entrée** : le parseur connaissait quatre formes balisées, et
ce convertisseur écrit `Maladie 18, 25, 91 -94`, sans balisage, avec un seul espace. Deux formes de repli
ajoutées, chacune avec ses garde-fous, et **le seuil de densité monté de quarante à cent** — mesuré, pas
choisi : le livre complet d'Alien, qui vit dans `index/` sans être un index, était passé de neuf à
trente-huit entrées fausses pour un seuil qui valait quarante. **Deux unités de marge n'en sont pas.**

Rendement : Rêves de Dragons passe de 217 à **544 entrées**, ses deux fichiers chargés ; les autres
corpus inchangés. C'est ce qui rend le contrôle des citations utilisable — « La Magie du Haut » citait
quatre sections introuvables, elle en cite quatre qui se résolvent toutes.

### 2.5 La Forge, et les défauts qu'une dérivation réelle seule révèle (`8e6ae3d`, `518e916`, `3aa13a7`)

Trois reforges successives de Rêves de Dragons. Deux constats portent au-delà de ce jeu :

> **Ce qui décide du COMPTE doit s'énoncer avant ce qui décide du CONTENU.**

Le pilote est ressorti avec **« Compétence 1 » à « Compétence 12 »**, toutes additionnées — troisième
forme du défaut des six Sauvegardes de Cthulhu Hack. La consigne l'interdisait pourtant : elle arrivait
**après** la tête de cible qui annonçait « une entrée par valeur ajoutée ». Un test verrouille désormais
l'ordre autant que la règle.

Et **les titres de section étaient reformulés, pas recopiés** — « Périls Magiques » pour un chapitre qui
s'appelle « Queues, souffles et têtes de Dragon ». Le gabarit demandait « titres exacts » en une ligne,
noyée dans une liste de métadonnées. Il dit maintenant que **ces titres sont confrontés à l'index**, et
donne le repli qui ne coûte rien : *si tu ne retrouves pas le titre exact, omets-le*. Mesure : de 3/7 à
4/4.

Enfin, **l'Atelier de Règles sait ouvrir le corpus d'un jeu neuf** : la création était enfermée derrière
la porte qu'elle devait ouvrir.

### 2.6 Six défauts de séance

`a9350b0` **Alien lançait seize dés** quoi qu'on saisisse — le seuil pris pour une réserve, un `??` entre
un seuil et un nombre de dés ; corrigé dans le moteur, donc **pour la tablette aussi : les joueurs
jetaient faux et personne ne l'avait vu**. `1ed7254` trois onglets du Grimoire sur quatre **ne pouvaient
rien afficher** — ils filtraient sur le nom de fichier ; la barre entière part, la distinction n'existait
pas. `a69c52d` la carte PNJ **rognait ses propres boutons** (trois hauteurs pour une seule vérité) et le
type ne se corrigeait jamais. `09be84f` le champ « ajouter un combattant » **partait avec le nom du
bouton**.

---

## 3. Ce qui reste, par préjudice réel

**La liste consolidée est au § 5 de `2026-08-19-reconciliation-plans-aout.md`, et nulle part ailleurs.**
Ce qui suit dit seulement **ce qui a changé de rang** — *recopier un reste le fait survivre à sa
correction.*

### 3.1 Le seul reste qui fausse une partie en cours

**Le pilote de Rêves de Dragons lance des jets faux d'un facteur cinq.** Il compose
`seuil = caractéristiques + compétences`, or chez RdD la compétence **déplace la colonne, donc elle
multiplie** : Agilité 12 avec +3 vaut 78 %, le pilote annonce 15 %. *Les joueurs concluront que leurs
personnages sont mauvais, jamais que l'outil se trompe.*

Le chantier est **défini et non commencé** — il vit dans la mémoire du projet, pas ici. Deux jours
estimés, et il est **bloqué sur une question de livre** (§ 4). Sa vraie forme n'est pas le calcul mais
l'échelle : `tagSuccess` est un **booléen** que six écrans rendent en trois vocabulaires, et ils ne
divergent aujourd'hui que parce qu'un booléen n'a que deux valeurs.

### 3.2 Le Cortex tactique — son garde-fou est levé

Axes 2 à 5 de `2026-08-07-fiabilite-cortex-combat.md`, plus ses trois questions non tranchées. Vérifié ce
matin : l'unité de distance est **toujours « cases » en dur**, `TacticalNarrativeService.ts:191`, alors
que le pilote la porte.

**Son propre document interdisait de le traiter avant les axes A à C du plan jumeau. Les trois sont faits
depuis hier.** C'est donc le chantier de code le plus mûr du dépôt — et sa question *« fusionner les deux
appels du Cortex en un seul »* prend du poids maintenant que `4a17b4d` a démontré que, sous
`NUM_PARALLEL: 1`, **les deux appels font la queue** : on attend la somme, pas le plus long.

### 3.3 Le plafond RAG — il se mesure maintenant

`MAX_CONTEXT_TOKENS = 4000` (`electron/ragSelection.ts:39`), soit **deux fiches entières**. Le report
tenait à une condition : *« à réévaluer une fois l'iGPU vu tourner en conditions réelles »*. L'iGPU tourne
depuis le 12/08, **le combat a eu lieu le 21**, l'axe C a supprimé le repaiement du prefill et le banc de
mesure existe au § 2 du plan d'accélération. La condition est remplie. **Ça se mesure, ça ne s'intuite
pas.**

### 3.4 Le corpus, compté sur le disque ce matin

| Système | Fiches | |
| --- | --- | --- |
| alien | 40 | |
| blade-runner | 26 | |
| dune · rêves de dragons | 24 | RdD reforgé le 21/08 |
| cthulhu hack | 20 | |
| srd-yze | 18 | |
| noc | 4 | très en dessous |
| coc7 | 2 | **aucune fiche v3**, pas de `rules/` |
| dnd-5e | 1 | idem |
| star-trek | **0** | dossier vide |

**16 fiches `a_regenerer`** · **28 citant des pages non fiables** · **4 doublons** · **`docs/commun/`
toujours reconnu par le moteur et absent du disque**. Cinq campagnes, inchangées.

### 3.5 Deux dettes assumées, signalées le jour où elles ont été créées

- **`lesDerniersEvenements` n'a plus d'appelant** — non supprimé : il porte, avec ses tests,
  l'avertissement sur le sens de la pile qui a coûté le défaut du 20/08. Mais c'est désormais un module
  que personne n'appelle.
- **`useOracleContext`, le second chemin de contexte, ne connaît pas la trame** — et ce n'est pas un
  oubli : le Cortex reçoit son ancrage par l'autre voie, et **ajouter un second producteur de la même
  vérité est exactement ce que cette semaine a défait**.

### 3.6 Ce qui n'a toujours jamais été vu tourner

L'aller-retour d'image d'une ambiance · la consigne de langue (on sait qu'elle part, pas que le modèle
l'applique) · la bascule de combat entre deux scènes **et le retour des tokens** · et, nouveau depuis
hier, **la fusion et la scission en conditions de revue réelle**.

---

## 4. Ce qui attend une décision de David — aucune n'est du code

1. **L'échec particulier commence-t-il à 86 ou à 87 ?** La fiche `degres-de-reussite-et-critiques.md`
   donne l'exemple travaillé à 30 % avec « Éch.P. 86-93 », mais sa propre règle — les derniers 20 % de la
   marge — donne 87. Un point d'écart **sur la bande qui déclenche les désastres**, et la fiche porte
   `relu: false`. **À trancher sur le livre**, et ça bloque le chantier du § 3.1.
2. **L'afficheur Ulanzi : le compte à rebours seul, à la prochaine séance d'Alien ?** Conception rendue,
   rien de code. Une soirée au lieu d'une semaine, et une réponse que la lecture du code ne donne pas.
3. **Le pilote de Rêves de Dragons porte douze composantes numérotées** là où il en faut une, et la fiche
   de personnage semble porter douze champs plutôt que des compétences nommées. La Forge ne le refera
   plus (`518e916`), **mais le pilote existant n'est pas corrigé pour autant** : il se retouche à
   l'atelier ou se reforge.
4. **coc7, dnd-5e et star-trek** n'ont aucune fiche v3. C'est du contenu : le carnet, la Forge et ton
   jugement.

---

## 5. Ce qu'on ne rouvre pas — décisions des 21 et 22/08

- **Le don d'objet reste une `trace`** : « on peut les écrire au journal, mais ils ne doivent pas entrer
  dans le résumé ». L'asymétrie avec l'indice révélé est voulue, et consignée sur place.
- **La fiche de PNJ projetée reste de la `chronique`** — la projeter est l'instant où il entre en scène.
  C'est son **contenu** qui a changé : le modèle n'apprend plus qu'il existe un Player Hub.
- **Ouvrir une carte ne déplace plus le groupe.** Le déplacement a son propre bouton, « le groupe s'y
  rend ».
- **Absorber une scène en cours rouvre la scène fusionnée** — sinon la fusion fermerait un passage que
  personne n'a fermé, en pleine séance.
- **Scinder se décide sur un instant, pas sur une liste d'événements** : l'ouverture d'un combat et son
  initiative partent dans la même milliseconde, elles sont le même moment et ne se séparent pas.
- **Les deux scènes ouvertes partent toutes les deux à l'Oracle**, nommées.
- **Le seuil de densité d'un index vaut cent**, et le chiffre est mesuré, pas choisi.
- Et tout ce qui a été tranché les jours précédents, au § 4 de `2026-08-20-etat-et-reprise.md`.

---

## 6. Les leçons de ces deux jours

**Deux chemins vers le même service, dont un seul était entretenu.** `chatStream` recopiait la forme de
`chat` au lieu de l'appeler, et a donc raté deux mois de corrections — dont celle dont le fichier mesure
le prix trois lignes plus haut. *C'est le motif de la semaine — plusieurs écrivains pour une même
vérité — appliqué cette fois à un appel réseau.* Il n'y a plus qu'un corps de requête, et un test vérifie
que les deux chemins le partagent.

**Un journal qui dit ce qui part.** Lire le code prouve qu'une section **existe** ; il ne prouve pas
qu'elle **porte quelque chose** ce soir-là, sur cette campagne. C'est la même impasse que le 12/08 pour la
contrainte JSON, et le même remède : un fichier se relit après coup, par n'importe qui. Les titres **et**
leur poids — une section vide et une section pleine portent le même titre.

**Ce qui décide du compte doit s'énoncer avant ce qui décide du contenu.** Une consigne juste, placée
après celle qu'elle corrige, ne mord pas. Deuxième variante de « une consigne noyée est une consigne
perdue », et elle a coûté douze composantes de jet.

**Un contrôle qui répète vingt fois la même chose ne se lit pas mieux qu'un contrôle absent** — et son
reproche par mot envoyait chercher un champ nommé « une ».

**Et le défaut le plus cher de ces deux jours n'a coûté qu'une ligne** : le second argument de `gmPrompt`
est une valeur par défaut, pas un intitulé. Un combattant nommé « Ajouter un Combattant » a traversé le
journal, la chronique et le modèle, **et ressort dans le récit que le meneur relira dans six mois**. Il
n'est resté visible nulle part à l'écran ; il a été trouvé dans `ollama_debug.log`, en cherchant tout
autre chose.
