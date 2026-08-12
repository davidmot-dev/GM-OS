# La Forge Système, dérivée du corpus — plan du 2026-08-11

Écrit pour être lu à froid. Fait suite à `2026-08-10-soiree-premiere-forge.md`, dont le § 1 quater
ouvrait le chantier des quatre murs. **Les quatre murs sont abattus** ; ce document traite de ce
qu'ils rendent possible, et de ce qu'ils rendent nécessaire.

Branche `feature/tablet-hub-pwa`. **962 tests verts**, `tsc -b` propre, build vérifié
(état au 2026-08-12, écran de dérivation branché).

---

## PAR QUOI REPRENDRE

> **La chaîne tourne de bout en bout, et son résultat attend son jugement.** L'écran lit les
> fiches, dérive le pilote groupe par groupe, montre ce qu'il a produit *identifiants compris* et
> nomme ce qui ne se raccorde à rien. Ce qui manque n'est plus du code : c'est **la confrontation
> du pilote dérivé de Dune à sa référence vérifiée à la main**.
>
> **Première dérivation réussie, le 2026-08-12 au soir — et ce qu'elle a coûté avant d'aboutir.**
>
> La première tentative a échoué sur les huit groupes, quarante-six minutes durant, sur
> « Impossible de parser la réponse en JSON ». **La réponse n'était pas mal formée, elle était
> vide** : `gemma4:12b` raisonne avant de répondre, Ollama range cette réflexion dans
> `message.thinking` — un champ que le type ne déclarait même pas — et le plafond
> `num_predict: 2048` tombait *pendant* le raisonnement. Mesuré sur un groupe réel : 349 s et
> 2 048 tokens pour zéro caractère de réponse, contre 64 s et 116 tokens avec `think: false`.
> Corrigé en `9296349`, avec `format: 'json'` par-dessus — une consigne s'ignore, une grammaire non.
>
> La seconde dérivation a rendu **huit groupes remplis, zéro lacune, en six minutes** : nom et
> moteur de dés exacts, vingt fiches lues, 19 600 tokens d'entrée pour ~1 000 de sortie.
>
> **Deux constats de qualité, à trancher.** (1) `statsToTrack` a gagné « Points de progression »,
> que la référence n'a pas — or les points de progression appartiennent à une *tâche étendue*, pas
> à la fiche d'un personnage. (2) Sur la sonde d'un groupe, `sectionId` valait « Les compétences »,
> **le titre de la section du livre**, là où le pilote attend l'identifiant d'une section de la
> fiche. Les deux relèvent de la même cause structurelle, ci-dessous.

**Le geste suivant, et pourquoi celui-là.**

1. ~~Forger la fiche du quatorzième sujet.~~ **Fait par David le 2026-08-12 au soir, pendant la
   séance** : les trois corpus ont leur « Composition de la fiche de personnage », plus un
   « Poursuites » pour Dune (`couverture: absente` — le livre de base ne les traite pas, et c'est
   une réponse, pas un échec). **Les huit groupes sont donc nourris sur les trois corpus.**
2. **Dériver Dune, et ne pas l'enregistrer.** Dune est le seul corpus qui ait un pilote de
   référence *vérifié à la main* : c'est donc le seul dont la dérivation puisse être **comparée**
   au lieu d'être crue. L'enregistrement crée un pilote neuf (`custom-<horodatage>`), il n'écrase
   rien — mais l'intérêt est à l'écran, avant.
3. **Alien ensuite**, quand la comparaison sur Dune aura dit ce que la chaîne vaut.

### La question ouverte : les groupes ne se parlent pas

**Un groupe ne peut pas viser un identifiant qu'un autre n'a pas encore inventé.** `jet.seuil[].sectionId`,
`combat.tacheDeDefaite.sectionDuSeuil`, `statsToTrack[].fieldId` et `ui_config.gauges[].fieldId`
désignent tous des sections ou des champs que **seul le groupe `fiche` produit** — et les huit
groupes sont forgés indépendamment, chacun ignorant ce que les autres ont rendu.

Le modèle fait alors ce qu'il peut : il recopie un titre de section du livre, ou il invente un
identifiant plausible. Les contrôles de l'axe 4 le voient, mais après coup.

**Le remède, à décider :** forger le groupe `fiche` **en premier**, puis injecter son vocabulaire —
la liste des `sectionId` et des `fieldId` réellement créés — dans l'invite des cinq groupes qui en
dépendent. `GROUPES` est déjà un tableau ordonné, et `promptDuGroupe` reçoit déjà tout ce qu'il
faut ; c'est une dépendance à déclarer, pas une architecture à refaire.

*À mesurer avant de coder : combien d'identifiants ne se raccordent pas sur une dérivation réelle.
Si la réponse est « deux sur trente », le remède coûte plus cher que le mal.*

**Avancement des axes.**

| Axe | État |
|---|---|
| 0 — mesurer | **fait** (2026-08-11) |
| 0 bis — iGPU | **fait** (2026-08-12) |
| 1 — canevas du pilote | **fait** (`1677785`) |
| 2 — dériver du corpus | **fait, service et écran** (2026-08-12) — *jamais lancé en réel* |
| 3 — NotebookLM pour les lacunes | **sans objet pour l'instant** : la dérivation Dune du 2026-08-12 a rendu *0 lacune* sur huit groupes |
| 4 — le pilote se vérifie | **fait** (2026-08-12) — contrôles + revue complète à l'écran |

### Ce que les corpus réels donnent, groupe par groupe

Mesuré le 2026-08-12 sur les fiches du dépôt, par `corpusDerivable.test.ts` :

| Groupe | Dune | Alien | Blade Runner | Invite la plus lourde |
|---|---|---|---|---|
| identite | 1 fiche | 1 | 1 | ~1 600 tokens |
| jet | 2 | 2 | 2 | ~3 450 tokens |
| initiative | 1 | 1 | 1 | ~1 750 tokens |
| defaite | 2 | 2 | 2 | **~3 900 tokens** |
| ressources | 1 | 1 | 1 | ~1 800 tokens |
| jauges | 1 | 1 | 1 | ~2 150 tokens |
| portees | 1 | 1 | 1 | ~1 650 tokens |
| fiche | 2 | 2 | 2 | **~3 950 tokens** |

*Remesuré après les fiches du soir : la ligne `fiche` valait « 0 propre » quelques heures plus tôt
et retombait sur la fiche des jauges.*

**Le pari de l'axe 2 tient sur charge réelle** : le groupe le plus lourd fait moins de la moitié du
budget de 8 000 tokens — et ce budget est lui-même la moitié du plafond réel de 16 384. Un test le
verrouille pour tous les corpus du dépôt, parce qu'une fiche reforgée plus longue ramènerait la
troncature silencieuse sans que rien ne le dise.

**Et neuf à quatorze fiches par corpus n'entrent dans aucun groupe** — celles hors canevas (les
Mentats, les Arènes de Conflit, le Test de Voight), plus « Jets opposés », « États et conditions »,
« Environnement et dangers », « Poursuites » et l'inventaire. Ce n'est pas une perte : ces
mécaniques n'ont pas de champ dans le pilote. C'est la mesure de ce que le pilote *ne dit pas* du
jeu, et l'Oracle continue de les lire par le RAG.

**Ce qui attend derrière, et qui n'est pas dans ce plan.**

- **Les trois inventaires restent périmés**, même si les fiches du sujet 14 existent maintenant :
  `inventaire-des-mecaniques.md` ne connaît toujours que treize sujets pour les trois jeux, et les
  en-têtes `sujets_traites: 0 sur 13` d'Alien et de Blade Runner sont toujours faux. Ce n'est plus
  un préalable à la dérivation — les fiches sont là — mais la liste des sujets de l'Atelier
  continuera d'afficher une couverture fausse tant qu'ils n'auront pas été relancés (72 s chacun).
- **Alien n'a toujours aucun pilote.** Corpus propre, rien à écraser. Recommandation revue : le
  forger après avoir *comparé* la dérivation de Dune à sa référence — un corpus sans étalon ne dit
  pas si la chaîne fonctionne, il dit seulement qu'elle a produit quelque chose.
- **Trois sujets d'Alien n'ont aucune fiche v3** : Stress et Panique (le cœur du jeu), Forcer le
  test, le Mode Discret. Ils vivent encore sur des fiches v1.
- **Trois fiches v1 d'Alien** subsistent dans `rules/` sans doublon exact — `combat-spatial.md`,
  `physiologie-des-synthetiques.md`, `regles-affrontement-xenomorphes.md`. Leurs cousines v3
  couvrent un angle plus étroit ; les archiver demande un jugement sur la couverture.

---

## 0. Pourquoi ce chantier existe

David, le 2026-08-11 : *« avant de forger le système Alien, est-ce qu'on ne devrait pas revoir le
mécanisme de Forge Système ? »* — et il avait raison. Vérification faite, le prompt de
`getSystemForgePrompt` réclame `dice`, `combat.statsToTrack`, `initiativeFormula`,
`defaultHealthType`, `ui_config`, `aiInstructions`.

**Aucun des quatre champs que les murs ont ajoutés** : ni `jet`, ni `ressourcesDeTable`, ni
`combat.initiative`, ni `combat.tacheDeDefaite`.

Pire que l'absence : **l'exemple de sortie est faux**. C'est le seul modèle que le modèle ait sous
les yeux, et il code en dur ceci :

```json
"statsToTrack": [ { "fieldId": "hp", "label": "PV", "isMainHP": true } ],
"initiativeFormula": "dex",
"defaultHealthType": "hp"
```

Il enseigne donc que tout jeu a des points de vie et une Dextérité. C'est le même défaut que
`DEFAULT_GAME_DRIVERS` vide — pas d'étalon correct — sauf qu'ici l'étalon est **faux plutôt
qu'absent**, ce qui est pire : le modèle le copie.

---

## 1. L'idée qui structure le plan

**La Forge Système ne devrait pas lire le livre.** L'Atelier l'a déjà lu, a vérifié ses pages, et a
produit dix-sept fiches v3. Le pilote n'est pas une extraction du livre : c'est une **projection des
fiches** dans les champs que l'application consomme.

La correspondance est complète, et ce n'est pas un hasard — le canevas avait été dérivé de ce que le
code exploite :

| Champ du pilote | Sujet du canevas qui le porte |
|---|---|
| `dice`, `jet` | Résolution des jets, Degrés de réussite |
| `combat.initiative` | Initiative et déroulement du tour |
| `combat.tacheDeDefaite` | Santé et blessures |
| `ressourcesDeTable` | Monnaie de table |
| `statsToTrack`, `ui_config.gauges` | Jauges et ressources individuelles |
| `tactical.ranges` | Distances et portées |
| `template.sections[].fields[]` | **Composition de la fiche de personnage** (sujet 14) |

Ce que cela achète : une fiche pèse ~5 Ko contre 100 000 caractères de livre ; chaque valeur du
pilote devient traçable jusqu'à une page vérifiée ; et la règle déjà posée est respectée — *dériver
du corpus, pas produire en parallèle*, parce que deux productions indépendantes des mêmes faits
divergeront et que rien ne les comparera jamais.

---

## 1 bis. Le quatorzième sujet — **fait** (`5f66c1a`)

Relevé par David : *« ce que les fiches ne vont pas refléter, c'est la composition de la fiche de
personnage ou les éléments qui gèrent les compétences »*. Vérifié, et c'est exact.

Les treize sujets sont **tous des mécaniques de résolution**. Aucun ne dit ce que porte une fiche.
Or la Forge produit `driver` **et** `template`, et le second n'avait aucune source.

**Dune s'en est tiré par accident.** Ses cinq Compétences et cinq Principes sont apparus dans
`l-equation-statistique-duale-competence-plus-principe.md`, une fiche **hors canevas** que le carnet
a proposée de lui-même. Rien ne l'avait demandée. Alien n'a pas eu cette chance : ses trois hors
catégories parlent de vélocité d'approche, de synthétiques et de xénomorphes.

Nuance qui rend le sujet acceptable, écrite dans l'énoncé comme dans le gabarit : **on demande ce que
porte une fiche finie, pas comment on la remplit.** L'achat de points, les archétypes et les
historiques restent exclus — ce sont les chapitres les plus volumineux des livres, et c'est pour eux
que l'exclusion existe. Un inventaire, pas une procédure.

Couverture partielle préexistante, à ne pas confondre : « Jauges et ressources INDIVIDUELLES » ramène
déjà le stress, la santé mentale, les points de magie. Ce sont **les jauges, pas la liste des
caractéristiques**.

**Conséquence : les trois inventaires existants sont périmés** et doivent être relancés (72 s
chacun). Ceux d'Alien et de Blade Runner portent de toute façon un `sujets_traites: 0 sur 13` faux,
hérité du parseur corrigé en `86a65ae`.

---

## 2. Les axes, dans l'ordre

### Axe 0 — Mesurer avant de toucher — **fait le 2026-08-11**

**Résultats, sur `gemma4:12b`, machine de David.**

| Mesure | Valeur |
|---|---|
| `num_ctx` déclaré par le Modelfile | **aucun** (seulement temperature, top_k, top_p) |
| Contexte alloué, annoncé par `/api/ps` | 16 384 |
| **Tokens réellement traités, prompt de ~55 800 tokens** | **8 195** |
| Prefill | **15,2 tok/s** (537 s pour 8 195 tokens) |
| Modèle en VRAM | **0 Go** sur 9,2 Go — iGPU inutilisé |
| Tokenisation du français | **2,92 caractères par token**, pas 4 |

**Le budget d'invite réel est donc d'environ 8 000 tokens, soit ~23 000
caractères** — la moitié de ce que `/api/ps` annonce. Contre `MAX_TEXT_CHARS =
100 000`, cela fait **77 % de l'invite jetés en silence**. Le défaut du RAG à
l'identique.

> **Correction du 2026-08-12 au soir — le mécanisme, et il change le diagnostic.**
> Les 8 195 tokens ne sont pas « la moitié du contexte utilisable » : c'est un
> **plafond fixe**, celui de la troncature de llama.cpp. Le serveur garde `n_keep`
> tokens de tête puis la dernière moitié du contexte, soit
> `4 + (16384 − 4) / 2 = 8 194` — à un token près, le BOS. Vérifié trois fois, sur
> des invites de 33 500 et 55 800 tokens : **le même 8 195 dans les deux cas**, donc
> une perte fixe et non proportionnelle.
>
> Trois conséquences, dans l'ordre d'importance.
>
> 1. **Le contexte utile est bien de 16 384 tokens tant qu'on reste dessous.** Le
>    budget n'est pas coupé en deux ; il s'effondre en deux **dès qu'on dépasse**.
>    Rien à changer à l'axe 2 — le groupe le plus lourd fait 3 900 tokens — mais la
>    marge est double de ce qu'on croyait.
> 2. **C'est la FIN de l'invite qui survit.** Sonde à deux marqueurs, un à chaque
>    bout : le modèle a nommé celui de la fin, jamais celui du début. L'ancienne
>    forge ne voyait donc pas « 23 % du livre » au hasard — elle voyait **les
>    8 000 derniers tokens**, et rien d'autre.
> 3. **`forgeSystem` ne devait ses instructions qu'à l'ordre de son gabarit.** Il
>    écrit `${texte}\n\nINSTRUCTIONS FINALES : ${prompt}` : les consignes sont en
>    queue, donc elles ont survécu. Placées en tête — ce que fait la moitié des
>    gabarits — elles auraient été **intégralement jetées, sans un mot**, et la
>    forge aurait tourné sans consigne pendant des mois.
>
> `OLLAMA_CONTEXT_LENGTH:16384`, `OLLAMA_NUM_PARALLEL:1`, `n_ctx_slot = 16384`
> relevés dans `%LOCALAPPDATA%\Ollama\server.log`, qui porte aussi un champ
> `truncated = N` par requête — **la source à consulter en premier** la prochaine
> fois qu'une invite semble ignorée.

**Et la conclusion qui va plus loin que prévu :** envoyer tout le corpus ne
marche pas mieux que d'envoyer le livre (Dune : 100 837 caractères, 77 % jetés).
Seul le découpage par groupe de champs tient — deux fiches ≈ 11 000 caractères
≈ 3 800 tokens, soit la moitié du budget. **L'axe 2 n'est donc pas seulement
plus juste, il est la seule façon de tenir dans le contexte.**

Mais 3 800 tokens à 15,2 tok/s font **quatre minutes de prefill par groupe**, et
six groupes font vingt-cinq minutes. **L'iGPU cesse d'être un confort** : le plan
IA du 2026-08-07 mesurait × 4,7 sur le prefill, ce qui ramènerait un groupe à
cinquante secondes. C'est lui qui décide si la Forge dérivée est utilisable.

**Deux pièges de mesure rencontrés, à ne pas refaire.**

1. La première sonde a rendu **7 722 tok/s de prefill** — impossible. Une
   tentative précédente avait envoyé le *même* prompt : Ollama a répondu depuis
   son cache de préfixe. **Saler le prompt à chaque exécution**, sinon on mesure
   le cache.
2. `fetch` est inutilisable : undici coupe les en-têtes à cinq minutes, et un
   prefill de 8 195 tokens en prend neuf. Passer par `http` brut avec
   `setTimeout(0)`.

### Axe 0 bis — l'iGPU activé — **fait le 2026-08-12**

`OLLAMA_IGPU_ENABLE=1` posé en variable d'environnement utilisateur, Ollama
redémarré. Le journal passe de `dropping integrated GPU` à
`inference compute … type=iGPU total="17.9 GiB"`, puis
**`offloaded 49/49 layers to GPU`** — le modèle entier, 7 Go de tampon Vulkan.

Mesure **à charge identique** (même sonde salée, 2 000 marqueurs, 8 195 tokens
traités dans les deux cas) :

| | CPU | iGPU | gain |
|---|---|---|---|
| Prefill | 15,2 tok/s | **84,8 tok/s** | **× 5,6** |
| Décodage | 5,5 tok/s * | **7,7 tok/s** | × 1,4 |
| Durée totale de la sonde | 550,7 s | **131,5 s** | × 4,2 |

\* baseline CPU du 2026-08-07, non remesurée ce soir.

Le gain de prefill dépasse le × 4,7 que le plan IA prévoyait. **Mais le décodage
devient le facteur dominant** : à 7,7 tok/s, chaque centaine de tokens de JSON
coûte treize secondes.

**Ce que coûte désormais un appel par groupe de champs** — ~3 800 tokens d'entrée,
~800 tokens de JSON en sortie :

- prefill 45 s + décodage 104 s ≈ **2 min 30 par groupe**, soit ~15 minutes pour six ;
- contre ~6 min 30 par groupe sur CPU, soit ~40 minutes.

Trois conséquences pour l'axe 2, qui n'étaient pas visibles avant la mesure :

1. **Demander un JSON compact**, sans prose ni indentation : chaque token de
   sortie se paie treize centièmes de seconde.
2. **Le découpage par groupe vaut pour la sortie autant que pour l'entrée** — six
   petites réponses coûtent moins qu'une grosse, à contenu égal, parce qu'aucune
   ne dérape.
3. **`OllamaService` doit envoyer `num_ctx` explicitement.** Le budget dépend
   aujourd'hui d'un réglage de l'application Ollama (`OLLAMA_CONTEXT_LENGTH`),
   invisible depuis le dépôt et différent sur une autre machine.

*Non mesuré, et qui compte encore :* l'application n'envoie **pas de
`num_predict`** — la génération est non bornée, et à 7,7 tok/s un emballement se
paie cher. Réserve du plan IA à vérifier en séance : l'Arc pilote aussi
l'affichage, donc l'offload échange de la contention CPU contre de la contention
de composition.

#### Le raisonnement d'origine

`electron/OllamaService.ts` n'envoie **aucun bloc `options`** dans sa requête : ni `num_ctx`, ni
`num_predict`, ni `temperature`. Le contexte effectif est donc celui du Modelfile, ou le défaut
d'Ollama. **Ce n'est pas une affirmation, c'est la première chose à mesurer** — elle décide de tout
le reste.

Ce qui rend la mesure urgente : `forgeSystem` consolide **jusqu'à 100 000 caractères** et les envoie
en **un seul prompt**. Si le contexte effectif est bas, l'essentiel du livre est jeté en silence
avant que le modèle ne commence. Ce serait le défaut du RAG à l'identique — ~93 000 tokens envoyés
pour un `num_ctx` de 16 384, *un problème de qualité déguisé en problème de vitesse*.

À relever, sur une forge réelle : le contexte annoncé par Ollama, les tokens réellement reçus, la
durée de prefill et de décodage. Le journal du pont (`~/mcp_bridge_debug.log`) est la meilleure
source — **ne jamais le lire en entier**, toujours extraire.

*Dix des douze défauts du 2026-08-10 ont été trouvés en regardant tourner, pas en lisant le code.*

### Axe 1 — Le canevas du pilote

Fermé, ne contenant **que ce que l'application consomme**.

- Retirer `aiInstructions` : vérifié le 2026-08-10, il n'atteint aucun modèle. `AIService` construit
  son invite depuis les instructions de la gemme, le `gems.json` du corpus et les `aiPersonas` du
  gabarit.
- Retirer `critRange` : aucun lecteur.
- Ajouter les quatre champs des murs.
- **Remplacer l'exemple de sortie par le pilote Dune de référence**, qui n'a pas de points de vie.
  Un exemple juste plutôt qu'un exemple de D&D.

*Une forge qui remplit des champs morts est invérifiable.*

### Axe 2 — Dériver du corpus — **fait le 2026-08-12**

La Forge Système lit les fiches v3 du corpus désigné, pas le livre. **Un appel par groupe de champs**
plutôt qu'un appel géant : c'est la scission qui a fait passer les fiches de l'échec à 60 secondes
par moitié, et il n'y a aucune raison que la leçon ne vaille pas ici.

Le `template` sort du sujet 14 ; le `driver` sort des six autres correspondances du tableau du § 1.

**Ce que l'écran fait maintenant.** Un corpus se désigne dans l'onglet Structure, au-dessus du bac à
contexte — la dérivation est devenue la voie normale, déposer un livre reste possible en dessous.
`lireFichesDuCorpus` lit `rules/`, rend les fiches et **nomme ce qu'elle a écarté** ; la dérivation
affiche le groupe en cours sur huit ; le journal des lacunes s'affiche avec le résultat et
**survit à l'enregistrement**, puisque c'est après coup qu'il sert.

**Trois défauts trouvés en branchant, qui n'étaient pas au plan.**

1. **Le journal de la Forge n'était affiché nulle part.** `addLog` écrivait depuis toujours dans un
   état que rien ne rendait : la création d'un corpus, son échec faute de pont, les erreurs de forge
   — tout partait dans le vide. *Un message qu'on n'affiche pas est un message qu'on n'a pas écrit.*
2. **Le bouton d'enregistrement refusait en silence** quand le pilote n'avait pas de nom. Or un
   pilote dérivé perd son nom dès que le groupe « Identité » ne rend rien : le cas est courant, pas
   exceptionnel. La destination saisie à gauche en tient désormais lieu, et à défaut le refus
   s'explique.
3. **Le corpus d'enregistrement était re-déduit du nom du pilote.** Une dérivation de
   `systems/alien` nommée « Alien : le Jeu de Rôle » se serait vu créer un `systems/alien-le-jeu-de-role`
   voisin et vide, pendant que ses fiches seraient restées dans le premier. Un pilote dérivé d'un
   corpus désigné reste attaché à celui-là.

**L'abandon arrête vraiment la boucle**, entre deux groupes — deux minutes trente d'attente au pire,
et l'acquis est rendu. L'ancien bouton « arrêter la forge », qui rendait la main sans rien arrêter,
est masqué pendant une dérivation : sur un quart d'heure, il aurait laissé l'écran redevenir inerte
pendant que huit groupes continuaient de tourner.

### Axe 3 — NotebookLM pour ce qui manque seulement

Le corpus ne couvre pas tout. Quand un champ n'a pas de source, interroger le carnet par
`notebook_query` — la chaîne qui **marche** — au lieu de rapatrier du texte brut par
`source_get_content` pour le faire lire à Ollama.

C'est l'inversion déjà inscrite au plan IA du 2026-08-07 : *les deux chaînes NotebookLM font
l'inverse l'une de l'autre*. Elle vaut ici plus qu'ailleurs, puisqu'une réponse de
`source_get_content` fait 2,7 Mo sur une seule ligne.

**Cet axe ne se justifie qu'une fois qu'on sait ce que le corpus ne couvre pas** — donc après
l'axe 2, jamais avant.

### Axe 4 — Le pilote se vérifie — **fait le 2026-08-12**

`src/modules/forge/rules/controlesDuPilote.ts`, montré par `RevueDuPilote.tsx` au moment de la
revue. **Le test qui les calibre : le pilote Dune de référence ne produit aucun constat.** S'il en
produisait, ce seraient les contrôles qu'il faudrait corriger — c'est l'étalon, pas le suspect.

Déclenché par ce qu'on a vu sur la première dérivation réussie : **l'écran de revue montrait quatre
valeurs** — un nom, un moteur de dés, deux libellés — pour un pilote qui en compte une quarantaine,
avec un bouton ENREGISTRER juste en dessous. Les identifiants qui cassent en silence n'y figuraient
pas. *La fiche se montre avant d'être écrite* vaut ici comme à l'Atelier.

Les contrôles **ne refusent rien** : un identifiant introuvable peut venir d'une fiche incomplète
autant que d'une invention du modèle. Ils nomment, un humain tranche.

Les tests des quatre murs existent déjà, mais seulement pour Dune (`src/data/duneReference.test.ts`).
Les généraliser en contrôles applicables à **tout pilote forgé** :

- chaque `fieldId` de `statsToTrack` et des jauges pointe un champ réel de la fiche ;
- chaque `sectionId` du descripteur de jet et de la tâche de défaite existe ;
- la réserve qui paie les dés supplémentaires est déclarée dans `ressourcesDeTable` ;
- la formule d'initiative n'invoque que des champs réels.

Le défaut que cela attrape est toujours le même : `CombatCard` va chercher une valeur **par son
identifiant** en pleine séance ; un `fieldId` qui ne correspond à rien affiche une jauge à zéro. Pas
d'erreur, pas de champ en rouge — une jauge à zéro, *qui ressemble à un personnage en pleine forme*.

---

## 3. Ce qui reste à trancher

**Le sort de `analyzeRulebookText`.** Une seconde chaîne, plus ancienne, lit un texte de règles brut.
Si la Forge dérive du corpus, elle fait doublon — mais elle sert peut-être un cas non repéré. Ne pas
la supprimer sans avoir cherché son appelant.

**Le moment du pilote d'Alien.** On peut le forger dès l'axe 2 fini, ou attendre l'axe 4 pour qu'il
naisse vérifié. **Recommandation : attendre.** Alien a un corpus propre et aucun pilote — c'est le
cas d'essai idéal, et le forger avant les contrôles reviendrait à ne pas savoir si le résultat est
bon.

---

## 4. Les règles à ne pas défaire

- **L'outil suit l'état, il n'arbitre pas.** Encoder les règles de chaque jeu est le piège où meurent
  les projets de ce genre.
- **Ne rien refuser sans motif écrit.** Une réserve trop basse avertit, une rétention interdite
  affiche sa raison. Un bouton grisé sans explication est une énigme.
- **Vérifier sur la charge réelle, jamais sur un exemple qu'on a écrit soi-même.** Le test de la
  tablette fabriquait une forme que l'application ne produit nulle part ; il passait au vert pendant
  que l'écran restait muet.
- **Ne pas tenir un corpus vivant par un nombre gelé.** Un test qui échoue *parce qu'on avance* finit
  par être recalé sans être lu.
- **`tsc --noEmit -p tsconfig.json` ne vérifie rien** — la racine a `"files": []`. Le vrai contrôle
  est `tsc -b`, et c'est ce que `npm run build` exécute.
