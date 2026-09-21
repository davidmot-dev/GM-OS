# Chantiers garés — le registre qui se rappelle d'un coup

**Nature de ce document : registre vivant, pas instantané daté.** Contrairement
aux `etat-et-reprise`, celui-ci **se met à jour** — on y coche, on y ajoute, on
en retire ce qui est fait. C'est le seul endroit où vit la liste des idées garées.

**Ouvert le 2026-08-23** avec trois chantiers. **Au 2026-08-29 ils sont cinq, et
quatre sont clos** — thème, fiche HTML, sauvegarde des images, sauvegarde des
fiches, les trois derniers **éprouvés en réel, aller et retour**.

**Au 2026-08-30, Deck-OS tombe à son tour — construit ET éprouvé en réel le jour
même, David : *« tout fonctionne bien »*. Les cinq chantiers sont clos.**

**Au 2026-08-31, ce registre absorbe les autres listes** — plan IA, plan du
Cortex, réconciliation d'août, feuille de route Ulanzi. Tout ce qui reste, tout
plan confondu, tient dans la section ⭐ ci-dessous. **Commencer par elle.**

> **Revérifié dans le code le 2026-08-24**, chantier par chantier, sans rien recopier d'un document.
> Base saine : `tsc -b` propre, **2 321 tests au vert** (190 fichiers, 1 ignoré). Les trois états
> ci-dessous sont confirmés. **Quatre documents disaient faux et ont été corrigés le même jour** — le
> doublon des Quarts (supprimé), les confirmations de suppression (posées), le mode hors carte du Cortex
> (construit), et les chiffres du corpus. *Une liste de restes qui vit à deux endroits en désigne un
> faux* — c'est la troisième fois que ce document paie cette règle.

---

## ⭐ Le registre consolidé — 2026-08-31, **tenu à jour le 2026-09-11**

**Pourquoi cette section existe.** Le 31/08, j'ai annoncé à David quatre défauts du Cortex et l'axe O
comme « à faire » — **ils étaient tous corrigés depuis les 22-24/08.** L'erreur ne venait d'aucun
document du dépôt : elle venait d'une mémoire de session restée au 21/08. *Une mémoire vieillit comme un
document, et elle n'a pas de `git log` pour le dire.* D'où cette section : **une seule liste, vérifiée
dans le code, qui absorbe toutes les autres.**

> Vérifié le 2026-08-31 : `tsc -b` propre, **3 158 tests au vert**, arbre propre et poussé.
>
> Revérifié le 2026-09-03 : `tsc -b` propre, **3 336 tests au vert** (262 fichiers, 1 ignoré), arbre
> propre. ⛔ **`npx vitest run` sans bride rend les 263 fichiers en échec** — `Vitest failed to find the
> current suite`, `tests 0ms`, *aucune assertion n'a tourné* : ce sont les workers qui tombent sous la
> charge. Rejouer avec **`--maxWorkers=4`**. ✅ **Corrigé dans `scripts/validate.ps1` le 2026-09-04** —
> l'étape 3 appelait la commande sans bride ; *un harnais qui s'effondre accuse le code qu'il n'a pas
> exécuté.*
>
> Revérifié le 2026-09-05 en fin de soirée, après les **sept** chantiers du jour : `tsc -b`
> propre, **3 806 tests au vert** (319 fichiers, 1 ignoré), `npm run validate` vert, **zéro rejet
> non géré** — voir §§ 20 à 23, dont le § 22 qui a grossi trois fois dans la soirée.
>
> Revérifié le **2026-09-06** après les §§ 24 et 25 : **3 816 tests au vert** (321 fichiers, 1 ignoré).
>
> Revérifié le **2026-09-07** après les §§ 29 à 35 : `tsc -b` propre, **3 931 tests au vert**
> (329 fichiers, 1 ignoré, 4 tests ignorés).
>
> Revérifié le **2026-09-09** après le § 36 : `tsc -b` propre, **3 940 tests au vert**
> (330 fichiers, 1 ignoré, 4 tests ignorés).

> ⭐ **LA REVUE DES GUIDES EST TERMINÉE — voies A et B (2026-09-04/05).** Trente-huit guides relus
> écran par écran, **cent deux défauts trouvés**, tous traités : réparés, tranchés par David, ou
> documentés avec leur raison. Le détail vit au § 12 (les trouvailles, par module) et aux §§ 13 à 17
> (les réparations, par rang de risque). Le plan suivi est
> `documentation/Planning/2026-09-04-revue-des-guides.md`.
>
> *Ce qu'il faut en retenir pour la suite : **écrire ce qu'un module fait est le meilleur détecteur
> de défaut employé sur ce dépôt.** Les trois quarts des trouvailles étaient dans le code, pas dans
> la documentation.*

> **Trois cases, et une seule liste.** Le § 1 dit ce qui **se joue** et ne se code pas ; le
> **§ 1 bis** ce qu'on a **constaté sans le traiter** ; le § 4 ce qui est **garé par décision**.
> Une ligne circule entre elles, elle ne se recopie jamais ailleurs.

### 1 · Ce qui se joue et ne se code pas — la catégorie P6

**C'est elle qui a produit tous les défauts des 18-19/08 et les huit de la séance du 21/08**, dont un jet
à seize dés. Aucun n'est sorti d'une relecture de code.

**Chaque ligne porte ce qu'il faut REGARDER**, et pas seulement son nom : *« à éprouver » n'est pas une
consigne, c'est un vœu.* Une séance ne dira quelque chose que si l'on sait d'avance ce qui doit s'y voir.

| Jamais vu tourner | Depuis | Ce qui se voit, ou pas |
| --- | --- | --- |
| ✅ Les **« quelques petits bugs » du storyboard** | 31/08 → **clos le 03/09** | **Trois ont été nommés et corrigés** les 02 et 03/09 — voir § 6. David, le 03/09 : *« pour l'instant je n'ai plus de bug dans le storyboard »*. ⚠️ *La ligne reste ici, barrée, parce qu'elle a servi* : le registre ne savait pas quoi chercher, il savait seulement **à qui demander** — et c'est ce qui a produit les trois. |
| Le **routage audio par son** | 31/08 | Ce qu'aucun essai ne dira : que le son sorte **vraiment** de la bonne enceinte — `setSinkId` n'existe pas sous jsdom. À écouter : une ambiance de moment sur les enceintes du fond pendant que la musique reste devant ; le volume général et le ducking de la voix doivent valoir **aussi** pour la voie détournée. |
| Le **titre projeté** | 31/08 | La police du thème du jeu s'applique-t-elle vraiment (`--font-display`), et le fondu se lit-il à la table. Un titre permanent doit s'en aller avec son moment, et pas avant. |
| La **bascule de combat entre deux scènes** | 20/08 | Ouvrir un combat dans une scène, changer de scène, revenir. Combattants, round, compteurs **et jetons de la carte** doivent tous revenir — ils voyagent dans `combatsGares`. *Un combat garé qui ne revient pas est un affrontement perdu en pleine séance.* |
| Les **six widgets Ulanzi ensemble** | 30-31/08 | Un seul a été éprouvé. Le plancher de ~250 ms tient-il à six ; la **restitution** rend-elle les six en quittant (délai dur de 4 s, partagé avec la sauvegarde) ; et un miroir ment-il — supprimer une horloge de tension doit retirer son widget. |
| **Voice-to-Light** | 31/08 | Le pont Hue tient-il huit commandes par seconde une soirée durant. Et l'aplatissement du contraste de brillance est-il acceptable, ou abîme-t-il les scènes. L'arrêt doit rendre la scène telle qu'elle était. |
| Le **préchauffage du modèle** | 31/08 | La première question doit coûter ~50 s au lieu de ~62. Et voir si les 8,4 Gio tenus toute la soirée gênent la **génération d'image locale**, qui charge son modèle sur la même mémoire partagée. |
| La **physique du graphe social** | 31/08 | Familles et alliances se regroupent-elles visiblement, rivalités s'écartent-elles — ou n'est-ce que du bruit ? *Les valeurs d'affinité sont une estimation, pas une mesure.* |
| ⚠️ La **fusion et la scission de scènes** | 21/08 → **essayée le 12/09** | **David a essayé et n'y est pas arrivé.** La reproduction Playwright a établi que **le geste marche** : ce qui manquait était les *conditions d'apparition* — et surtout qu'une scène ouverte ne laissait **aucune trace au journal**, donc n'entrait pas dans la revue. Corrigé au § 45, 3 tests E2E. **Reste à éprouver en vraie soirée** : que la revue montre bien les scènes traversées, et que fusionner deux scènes emmène leurs événements. |
| L'**aller-retour d'image** d'une ambiance | — | Déclencher un moment de storyboard qui porte une image, la voir partir au projecteur **et revenir**. |
| La **consigne de langue** | — | On sait qu'elle **part** dans l'invite ; pas que le modèle l'**applique**. *Aucun test ne peut attraper cet écart-là.* |
| Le **dépôt des icônes par GM-OS** | 31/08 | ⛔ **La réponse est venue le soir même : non.** `/list?dir=/ICONS` rendait `[]` alors que `gmos_vk` était poussé — cadre noir. Deux causes : le flash s'efface, et **la prise de main peut rater** (un appareil qui démarre refuse les écritures quelques minutes). Le dépôt est devenu une **veille** — voir `2026-08-23-afficheur-ulanzi.md` § 17. Reste à voir en séance : qu'elle répare toute seule un appareil vidé, sans qu'on redémarre GM-OS. |
| Le **démarrage amputé** | 12/09 | Écrit le jour où l'écran bloqué a été refermé (§ 48), et **jamais vu se produire** : il faut qu'une étape expire ou échoue pour la première fois. À regarder si ça arrive — l'écran d'attente nomme-t-il bien l'étape, la notification survit-elle au premier rendu, et **l'application est-elle vraiment utilisable** amputée de cette étape ? *C'est le pari du correctif : un démarrage dégradé vaut mieux qu'une absence de démarrage — et il n'a pas encore été vérifié en vrai.* |
| ✅ Les **boutons de l'Ulanzi** | 12/09 → ✅ **ÉPROUVÉS EN RÉEL le 13/09** | David : *« tout fonctionne »*. La chaîne entière tient — appui, MQTT, Home Assistant, GM-OS. Les trois boutons publient (`buttonLeft`, `buttonSelect`, `buttonRight`) et **gardent leur défilé natif** : rien n'est confisqué à l'appareil. ⚠️ *La ligne reste ici, close, parce qu'elle a servi* : elle portait les deux craintes qui ont guidé la mesure, et les deux étaient infondées |
| Le **matériel débranché puis rebranché** | 12/09 | Écrit le jour même (§ 51) et **jamais éprouvé sur du vrai matériel**. Trois choses à regarder : le nom donné à l'enceinte tient-il après un cycle de débranchement ; une ambiance visée dessus la **retrouve**-t-elle ; et l'alerte d'absence n'apparaît-elle **qu'une fois**. *La signature repose sur l'hypothèse que Windows rend le même libellé au rebranchement — mesurée sur la documentation, pas sur ta machine.* |
| Le **retour au Home entre deux moments** | 13/09 | Écrit le jour même (§ 52), **jamais vu sur une vraie lampe**. À juger en séance : le passage d'un moment éclairé à un moment sans lumière **fait-il clignoter la pièce** (Home puis scène suivante), et l'éclairage normal désigné est-il celui qu'on veut retrouver en sortant d'une scène tendue ? *Un fondu qui se voit à l'œil ne se mesure pas dans un test.* |
| ✅ Un **diaporama** pendant une vraie soirée | 13/09 → ✅ **ÉPROUVÉ EN RÉEL le 2026-09-14** | David : *« diaporama est bon »*, après les trois correctifs du § 56. **La chaîne entière tient** — montage, cadence, fondu enchaîné, appel depuis un moment. ⭐ *La ligne reste ici, close, parce qu'elle a servi* : elle portait les trois questions qui ne se mesurent pas dans un test (le fondu passe-t-il pour un fondu, six secondes est-ce la bonne durée, tient-il une soirée), et **les deux premières ont trouvé trois défauts que quatre mille tests n'avaient pas vus**. ⚠️ Ce qu'elle n'a toujours pas dit : la tenue sur **une soirée entière** — chaque tour résout le média et repasse par le pont. |
| `Ctrl+0` sur un **vrai Player Hub** | 13/09 | Écrit le jour même (§ 53). Les tests éprouvent le **départ** du message, jamais son arrivée — aucune fenêtre de Hub n'est ouverte dans une instance d'essai. À regarder : l'image **et** la fiche **et** le titre disparaissent-ils ensemble, le fond reste-t-il, et les favoris épinglés survivent-ils ? *Un message qu'on envoie n'est pas un écran qui se vide.* |
| Le **journal de contexte d'Ollama** | 22/08 | `~/ollama_debug.log` dit les titres du contexte **et leur poids** depuis le 22/08. À ouvrir après une question : une section vide et une section pleine portaient le même titre, c'est ce qu'il devait corriger. |

### 1 bis · ⚠️ Constaté, pas encore traité

**Ouverte le 2026-09-12, à la demande de David** : *« lors de tes tests E2E, où consignes-tu les
différents bugs que tu aurais découverts ? »* — la réponse honnête était **nulle part de
systématique**. Un défaut corrigé obtient sa section numérotée ; un défaut *constaté et différé*
finissait dans l'`etat-et-reprise` du jour, qui est un **instantané daté** : il vieillit, et personne
ne le relit.

**Ce n'est pas un registre de bogues de plus.** *Une liste de restes qui vit à deux endroits en
désigne une fausse* — ce document a déjà payé cette règle trois fois. C'est la même liste unique,
avec une case de plus pour ce qu'on a vu sans le traiter.

> **La discipline, en une phrase.** Une ligne ne sort d'ici que par le haut — corrigée, elle devient
> une section numérotée avec ses ancres ; garée exprès, elle descend au § 4. *Elle ne s'efface
> jamais parce qu'on a cessé d'y penser.*
>
> ⭐ **Et elle a fonctionné du premier coup — les CINQ lignes sont sorties le jour même.** Ouverte
> le 2026-09-12 au matin, elle a rendu quatre le soir (§ 47 : le coffre Obsidian, le journal hors
> sauvegarde, les deux libellés trompeurs) puis **l'écran bloqué** (§ 48). *Une case qui se vide est
> une case qui sert ; une case qui grossit est une liste de regrets.*
>
> ⭐⭐ **Et la cinquième a appris quelque chose que les quatre autres ne disaient pas.** Elle a
> attendu une reproduction qui n'est jamais venue, alors qu'elle était **lisible dans le code du
> premier jour**. Ce qui manquait n'était pas la scène : c'était la bonne question. *Devant un
> symptôme sans reproduction, on ne demande pas « qu'est-ce qui a causé ça ? » — on demande
> **« quels chemins de ce code peuvent ne jamais finir ? »**, et ceux-là se comptent.*

⭐ **Et la ligne d'Échap est sortie par le haut le 13/09** — voir le § 54. Son motif de renvoi
était *« on n'a pas compté combien d'écrans sont dans ce cas »* : le comptage a rendu **une
trentaine**, et un second défaut que personne ne cherchait. *Un motif de renvoi qui dit ce qui
manque est un motif qui se lève ; « plus tard » ne se lève jamais.*

⚠️ **Vidée le 12/09 au soir, rouverte le soir même.** Les cinq lignes du matin sont sorties par le
haut (§ 47 et § 48), et elle a resservi le jour même — ce qui est exactement ce qu'on lui demande.

⭐ Elle portait cette phrase depuis le matin : *« une case qu'on supprime quand elle se vide ne se
rouvre jamais quand il le faudrait »*. **Il l'a fallu huit heures plus tard.**

| Ce qu'on a vu | Comment le revoir | Pourquoi c'est différé |
| --- | --- | --- |
| ⚠️ **Une exécution E2E complète perd parfois un fichier**, sur un **plantage du rendu** (`Target crashed`) et non sur une assertion — la victime n'est **jamais la même**, et tous passent isolément | Relancer `npx playwright test` en entier. Cinq exécutions sur six l'ont montré le 13/09 au soir, la sixième a rendu **171 verts** | **Le mesuré ne s'explique pas encore.** La base de la veille passe 168 verts **deux fois sur deux** ; le même arbre avec trois tests de moins aussi ; avec eux, ça plante — mais **deux fois la victime tournait AVANT eux dans l'ordre des fichiers**, ce qu'aucune causalité n'explique. *Un résultat qu'on n'explique pas se rejoue avant de se raconter* : rejoué six fois, il n'est toujours pas expliqué |
| ⚠️ **La séquence de storyboard s'est mal exécutée en séance** : pas d'image projetée, lumières éteintes, ambiance interrompue. Le § 50 explique l'écran devenu inaccessible — **il n'explique pas ça** | Rejouer la séquence. Le journal porte désormais une ligne par moment : `[Storyboard] Moment « … » : Musique=joue Image=introuvable Lumières=module-absent`. **« introuvable »** désigne une donnée disparue, **« module-absent »** un magasin jamais chargé — deux réparations opposées | L'incident n'a laissé **aucune trace** : ni `error`, ni `warn`. *Sans instrumentation, chercher aurait été deviner* — elle est posée, il faut maintenant que le défaut se reproduise |

### 2 · Ce qui se décide à la table — axe N.3

Les **tailles** sont validées par David le 24/08 et vivent dans une seule table. Ce qui manque pour
**carte, PNJ, Oracle et journal**, ce n'est pas la taille : c'est **quels éléments grossissent**.
*Une densité se juge en jouant, pas en regardant* — choisir maintenant serait deviner quatre fois pour
économiser une séance.

### 3 · Ce qui se code, et c'est court — ✅ **les quatre points sont traités le 2026-08-31**

> **Trois des quatre n'ont pas demandé le code qu'on croyait.** 3a était un vrai défaut ; 3b était un
> bandeau qui pointait au mauvais endroit ; 3c était **déjà fait** et je l'avais recopié sans vérifier ;
> 3d était une mesure — qui a surtout corrigé **la mienne**. *Vérifier un reste coûte moins cher que le
> traiter, et parfois il n'y a rien à traiter.*

| | Quoi | Où |
| --- | --- | --- |
| a | ✅ **FAIT le 31/08.** La ligne du soutien direct disait « cases » et son seuil `<= 2` comptait en unités de grille. Elle lit maintenant la **bande déclarée par le pilote** (`Contact` ou `Courte`) et annonce l'allié comme les cibles : `Kaï à 1 zones [Portée au toucher]`. **La bande était déjà calculée pour les alliés, puis jetée.** Deux tests interdisaient le mot « cases » depuis le 22/08 — ils passaient parce qu'ils **ne mettaient aucun allié en scène** ; *un test qui interdit un mot ne vaut que sur les lignes qu'il fait écrire* | `TacticalNarrativeService.ts:448` |
| b | ✅ **FAIT le 31/08.** `roadmap-v6.md` portait déjà un bandeau « périmé » — le défaut était qu'**il renvoyait vers une liste de restes qui n'était plus la bonne**, et vers un `etat-et-reprise` nommé par sa date. Elle renvoie maintenant ici, l'index utilisateur ne l'annonce plus comme « Source de Vérité » (son lien était cassé), et `amélioration.md` non plus. *Un avertissement qui oriente vers un document périmé déplace le problème au lieu de le régler* | `documentation/Architecture/` |
| c | ✅ **RIEN À FAIRE, vérifié le 31/08 — et c'est moi qui avais recopié un reste mort.** L'étape 9 n'a pas été abandonnée : **son travail était déjà fait par la Forge de campagne** (15-16/08). Le plan de trame le dit depuis le 20/08, § 6 et § 8. J'avais copié la ligne du § 6 de la réconciliation sans l'ouvrir — *un reste recopié survit à sa correction*, la règle que ce même document énonce | `2026-08-08-trame-narrative-cycle-seance.md` |
| d | ✅ **MESURÉ le 31/08, la décision ET son motif tiennent.** Avec du sel en tête d'invite : **88-96 tok/s** à 4 000 tokens, **82** à 8 000 — soit **+56 s** pour doubler, contre les +51 s du 23/08. *Le prefill l'explique en entier ; il n'y a jamais eu de secondes manquantes.* ⛔ C'est mon banc du matin qui était faux : invite répétée, donc **cache de préfixe**. La condition de réouverture posée le 23/08 (300 tok/s) n'est pas remplie | § 13 de `2026-08-07-acceleration-ia.md` |

### 3 bis · La dette d'avril, **soldée** le 2026-08-31 — sauf un point qui attend ton œil

> **Onze cases : cinq étaient déjà faites, une était un piège, trois sont faites ce jour-là, une
> attend trente secondes de vérification à l'écran.** Et les deux qui ont demandé du vrai code en
> cachaient de plus gros défauts que ce qu'elles annonçaient — *ouvrir une vieille ligne coûte moins
> cher que la croire.*

**Trois documents d'avril n'avaient jamais été réconciliés** — celle du 19/08 ne cataloguait que les
documents d'août. Onze cases vides ; **cinq étaient déjà faites, une était devenue un piège.**

| | Reste, mesuré | Où |
| --- | --- | --- |
| **e** | ✅ **FAIT le 31/08.** Écart ramené à **zéro**, et un test le tient dans les deux sens (`src/locales/deuxLangues.test.ts`). ⚠️ *Le défaut le plus visible était dans le sens qu'on ne regardait pas* : **3 clés manquaient au FRANÇAIS**, employées à cinq endroits par `NexusService` — un export Nexus affichait donc la clé brute dans la langue par défaut | `src/locales/` |
| **f** | ✅ **CLOS le 31/08 SANS UNE LIGNE DE CODE — vérifié à l'écran par David.** Les listes déroulantes natives s'ouvrent bien **dans** la fenêtre : le bug d'avril 2026 a disparu avec les versions d'Electron (34 aujourd'hui, et la fenêtre MJ n'est pas *frameless*). Le motif du chantier était **ce bug**, pas l'esthétique — donc les **37 fichiers en `<select>` natif restent tels quels**. *Reprendre trente-sept fichiers pour l'apparence, c'est du risque de régression payé comptant contre un bénéfice que personne n'a demandé.* Le composant `Select` garde sa place pour les écrans neufs et pour les listes qui ont besoin d'icônes ou d'en-têtes | — |
| **g** | ✅ **FAIT le 31/08** (`d666f69`) — et deux défauts plus graves attendaient dessous : le formulaire **enregistrait autre chose qu'il n'affichait** (« Ami » posait `romantic`, « Neutre » deux fois, `other` inchoisissable), et la physique du graphe **n'existait pas** (même distance pour tous les liens). Une seule écriture là où il y en avait quatre, exhaustive par le typage | `session/logic/relationsSociales.ts` |
| **h** | ✅ **CONSTRUIT le 31/08** (`2b9a195`), ⏸ **à éprouver au pont Hue**. Cadence 120 ms et **commande de groupe** — une par lampe aurait fait 48 requêtes/s sur un pont qui en tient 10. La règle est testée sans micro ni pont ; le matériel attend la séance | `light/logic/suivreLaVoix.ts` |

**Fermées le 31/08, cases jamais cochées :** les chaînes de `useRuleEngine.ts` (zéro chaîne en dur), le
mismatch `ai_placeholder` (cohérent dans les deux langues), le sélecteur de dossier natif Obsidian
(`obsidian_bridge.ts:157`), la confirmation de synchro (`gmToast`), Light-OS dans l'orchestrateur
(`useStoryboardStore.ts:182`).

⛔ **Retirée : « migration finale de `/docs` vers `/documentation` ».** En avril c'était du ménage ;
`docs/` est depuis **la racine du corpus** que l'Oracle indexe. *L'exécuter casserait le RAG* — la ligne
est barrée et non supprimée, parce que quelqu'un la reproposerait.

### 3 ter · La couverture des règles — une carte, pas un arriéré

`2026-08-08-corpus-de-regles.md` liste les domaines que GM-OS ne modélise pas : oppositions et
coopération, états codés en dur, poursuites, environnement et dangers, jauges individuelles sans bornes,
`2d20` non implémenté. **David a tranché le 31/08 : on rafraîchit la table, on ne la vide pas.** Deux de
ses lignes avaient d'ailleurs vieilli — les portées atteignent le Cortex depuis le 22/08, et la monnaie
de table existe depuis le 15/08.

> ## ⭐ Au 2026-08-31 au soir, **plus rien de ce registre ne se code.**
>
> ⚠️ **Et pourtant sept chantiers sont sortis les 02 et 03/09** — voir § 6. Aucun ne vient de ce registre :
> **tous les sept viennent de David, à l'écran.** *Ce n'est pas une contradiction, c'est la démonstration
> du § 1* — ce qui restait ne se lisait pas, ça se jouait.
>
> Les sections 3 et 3 bis sont closes en entier. Ce qui subsiste tient en trois lignes : **la catégorie
> P6** (§ 1), qui se joue ; **l'axe N.3** (§ 2), qui se décide à la table ; et **Ulanzi D** (§ 4), garé
> par décision.
>
> *Sur les quinze points ouverts ce matin, six n'ont demandé aucun code* — cinq étaient faits sans que la
> case soit cochée, un était devenu un piège, un s'est fermé en trente secondes de vérification à
> l'écran. **Vérifier un reste coûte moins cher que le traiter, et souvent il n'y a rien à traiter.**

### 7 · Voice-OS, révisé et refait le 2026-09-03

*Parti d'une question sur le choix d'un micro, fini en révision du module. David :
« je ne suis pas toujours content du résultat, le son se coupe ou sature trop facilement (peut-être que
la librairie choisie n'est pas la meilleure) ». **Il n'y a aucune librairie** — Web Audio et un worklet
écrit à la main —, et les causes étaient six, toutes muettes.*

| Quoi | Ce qu'il y avait dessous | Où |
| --- | --- | --- |
| **Le sélecteur de micro** | `getUserMedia` était appelé **sans `deviceId`** : le module prenait le périphérique par défaut de Windows, et le tableau de bord ne réglait que la SORTIE. *Windows tranche au branchement d'une webcam, pas au moment de jouer* | `voice/VoiceDashboard.tsx` |
| **La porte coupait des mots** | Ni hystérésis ni maintien (un seul seuil, franchi des dizaines de fois par phrase) · mesurée **après** le compresseur et le gain de sortie — *baisser le volume fermait la porte* · sur **huit bits**, où tout ce qui est sous −42 dB tient dans un pas · et pilotée par un `requestAnimationFrame` que Chromium ralentit dès que la fenêtre passe derrière une projection | `voice/logic/porteDeLaVoix.ts` |
| **Quatre sources de saturation** | Deux voies de sortie à 1,0 sur le même nœud (**+6 dB** dès qu'on cumulait retour casque et diffusion) · un `Math.abs()` sur le gain du formant (**+16 dB à 100 Hz** sur les presets graves) · une réverbération qui sommait 1,5 × · un écrêtage **dur** | `voice/VoiceEngine.ts` |
| ⭐ **La transposition, refaite en WSOLA** | L'ancienne faisait **onduler le niveau de 39 à 57 %** sur une voix et perdait 1,7 dB. La nouvelle aligne le point de recollage sur la forme d'onde : **1,5 à 25 %**, niveau rendu à l'identique, latence de 85 → 43 ms (et **zéro** à l'unisson, où elle ajoutait 85 ms *pour rien*) | `public/audio/transposition.js` |
| **La compression devient un curseur** | Elle était figée à 8:1 — un limiteur, pas un compresseur. **100 % reproduit le réglage d'avant**, défaut à 40 % | `voice/logic/compression.ts` |

⛔ **La leçon de la journée n'est pas dans l'audio, elle est dans la sonde.** Mon premier jeu de tests
employait une **sinusoïde** : l'ancien algorithme les passait tous (3 % d'ondulation). Une sinusoïde
retardée reste la même sinusoïde. *Une sonde qui ne réveille pas le défaut ne prouve rien — et un test
tout vert peut n'être qu'une sonde mal choisie.*

**Ce qui entre en P6 — livré, jamais entendu :**

- **Le sélecteur de micro**, avec son vrai matériel. Et le repli quand l'appareil choisi est débranché.
- ⚠️ **Deux calibrations ont changé de sens** : le seuil de ducking (−40 dB) et celui de la porte
  portaient sur le signal **compressé**, ils portent maintenant sur la voix brute. *Un même nombre n'y
  veut plus dire la même chose.*
- **Le curseur de compression** : 40 % est un point de départ, pas une réponse. Il se trouve à l'oreille.
- **La transposition** entre −8 et +7 demi-tons, et surtout aux extrêmes (±12), où un recollage peut
  escamoter une consonne.
- ⚠️ **Le worklet importe désormais un second fichier.** Si le témoin « Worklet » du tableau de bord
  passe au rouge, c'est là qu'il faut regarder : le son continue, mais sans transposition.

### 8 · Les deux chantiers du soir, 2026-09-03 — débruitage et niveaux

*Choisis par David après la question « ne faudrait-il pas un paquet NPM dédié ? ». La réponse tenue :
**garder Web Audio comme socle, ajouter du WASM là où l'API ne sait RIEN faire.** Ces deux-là sont
exactement ces trous.*

| Quoi | Ce que ça apporte, mesuré | Où |
| --- | --- | --- |
| ⭐ **Débruitage neuronal (RNNoise)** | **−62 dB sur du bruit stationnaire**, et une **probabilité de voix** par trame de 10 ms. Cette probabilité tient la porte ouverte sur les fins de phrase — *elle répond au « le son se coupe » par un autre chemin que l'hystérésis*. Un seul réglage à trois positions (aucun / navigateur / neuronal), parce que **deux débruiteurs qui se suivent, c'est pire qu'un** | `public/audio/debruitage.js` |
| ⭐ **Alignement des niveaux (EBU R 128)** | La sonie de chaque piste se mesure **pendant l'écoute**, sans rien décoder ni charger en mémoire, et cale la piste dès la fois suivante. Pondération K vérifiée **à 9·10⁻¹⁶ de la table de la norme** ; portes de la norme comprises, donc une intro murmurée ne fait plus pousser tout le morceau | `public/audio/sonie.js` |

**Ce que ces deux chantiers ont appris, et qui vaut au-delà d'eux :**

- ⛔ **Un module WebAssembly n'est pas prêt parce qu'il est instancié.** `rnnoise_create` partait dans
  `__assert_fail` : il manquait `emscripten_stack_init` et surtout `__wasm_call_ctors`, **qui remplit les
  tables du modèle**. Sans lui le réseau existe et ses poids valent zéro — et rien ne le dit.
- ⛔ **Une norme se recopie, elle ne se réinvente pas.** Les coefficients recalculés « à la manière
  habituelle » donnaient 1,5293 au lieu de 1,5351 : 0,03 dB, inaudible, mais la mesure n'aurait plus été
  comparable à celle d'aucun autre outil.
- **Le paquet npm sert de provenance, pas de code.** `@shiguredo/rnnoise-wasm` livre son wasm inliné dans
  4,8 Mo de JavaScript dont la glu réclame `TextDecoder` et `window` — donc inutilisable dans un worklet.
  Le binaire est extrait par `scripts/extraire-rnnoise.mjs`, et les **trois imports** du wasm suffisent à
  le piloter. *C'est aussi ce qui permet de le mesurer sous Node.*

**Ce qui entre en P6 — livré, jamais entendu :**

- **Le débruitage neuronal sur la voix de David**, avec son micro et sa pièce. ⚠️ RNNoise est entraîné
  sur de la parole : le banc montre qu'il **efface** un signal synthétique très régulier. Sur une vraie
  voix, c'est l'inverse — mais c'est à l'oreille de le confirmer.
- **Sa charge** : le modèle tourne sur le fil audio, cent trames par seconde, toute une soirée.
- **L'alignement des niveaux sur ses vraies playlists** : la première écoute d'une piste n'est pas encore
  calée, et le compteur du mixer doit monter au fil de la soirée.
- ⚠️ **Le contexte de Voice-OS est désormais forcé à 48 kHz** (RNNoise l'exige). Si une carte son le
  refuse, le débruitage neuronal se désactive **en le disant** — mais c'est un changement de fond sur le
  moteur, à surveiller au premier lancement.

### 9 · L'atelier des adversaires, 2026-09-03

*« Il me manque un module pour créer des adversaires de combat aléatoire. » Deux
questions posées, deux réponses de David : les chiffres viennent **du pilote ET
d'un bestiaire qu'il remplit**, et la destination se choisit **au moment de
générer**.*

| Ce qui existait | Ce qui manquait |
| --- | --- |
| `EncounterGenerator` **assemble** une rencontre en clonant des prototypes déjà saisis, avec un compte en dés et un gonflage élite/boss | Il ne **crée** rien : sans bestiaire patiemment rempli, il ne produit rien. Et l'ajout manuel de Combat-OS donnait une coquille — un nom, **dix points de vie en dur**, une fiche de zéros |

**Ce qui est livré**, dans `combat/logic/fabriqueDAdversaire.ts` et `combat/components/AtelierDesAdversaires.tsx` :

- **Les chiffres viennent du gabarit de fiche du jeu** — `defaultValue` donne l'ordinaire, `max` le plafond, `options` les échelons quand le jeu compte en lettres. L'adversaire est donc **jouable par construction**, et sa santé se calcule ensuite toute seule par la formule du pilote (`addCombatant` le fait déjà — *ne pas devenir le huitième lecteur d'une même vérité*).
- **Six archétypes et quatre rangs.** ⚠️ Le problème qui n'est pas évident : *GM-OS ne sait pas lequel des champs d'un jeu veut dire « fort »*. Trois issues, une seule tient — deviner en silence fabrique des erreurs invisibles, demander au pilote rendrait les dix pilotes existants muets ; on **propose par mots-clés, on montre, et on retient la correction** du meneur par jeu et par archétype.
- **Le bestiaire appartient au JEU, pas à la campagne.** Un même nom remplace au lieu d'empiler, et ce que le meneur y a saisi **passe par-dessus le tirage** — une décision passe devant un remplissage.
- **Trois sorties** : au combat, dans la campagne, ou au bestiaire.
- Le bestiaire entre dans la **sauvegarde** (clé déclarée dans `schemas.ts` — sans quoi elle serait écrite puis jetée, la leçon de Music-OS).

⛔ **Trouvé en chemin, puis RETIRÉ le 2026-09-04 sur décision de David** — après lecture du code, comme il l'avait demandé.

`EncounterRollPanel` n'était monté nulle part. Mais le vrai motif du retrait est ailleurs, et il n'apparaissait qu'en cherchant qui remplit `encounterTemplates` : **personne**. Aucun pilote de référence n'en déclarait, la Forge n'en produisait pas, l'éditeur de pilote n'offrait aucun écran pour en créer. *Ce n'était donc pas du code injoignable : c'était du code qui, même joignable, n'aurait affiché que son état vide* — lequel renvoyait vers un « Rule Engine » dépourvu de la fonction. Il manquait la pièce qui produit la donnée, et elle n'a jamais été écrite.

Quatre pièces parties ensemble, un seul lecteur chacune : le panneau, `EncounterGenerator.ts` (et son `// @ts-nocheck`), l'action `generateEncounter` du store, les types `EncounterTemplate`/`EncounterEntity` et le drapeau `isEncounterInstance`. **Zéro test n'a bougé** — ce qui confirme après coup que rien n'en dépendait.

Le besoin est couvert par l'atelier, qui **crée** au lieu de cloner. Si la composition d'escouade revient, elle se fera côté bestiaire : *un seul endroit où l'on fabrique des adversaires, plutôt que deux qui s'ignorent.* Le motif du retrait est consigné dans `types/drivers.ts`, là où le champ vivait.

**Deux retours de David le soir même, et un seul était un défaut :**

| Ce qu'il a vu | Ce que c'était |
| --- | --- |
| *« quand je crée 1 combattant, il m'en envoie 2 »* | ⛔ **C'ÉTAIT un doublon, et j'avais conclu le contraire.** Ma première réponse — « c'est un PJ de la scène » — décrivait un mécanisme réel (il existe depuis le 20/08, et cinq tests le documentent maintenant) **mais pas ce que David voyait** : sa capture montrait « Tireur 1 » et « Tireur 2 ». La vraie cause : le sélecteur de rang **réécrivait le nombre saisi** (« Aguerri » ⇒ 2), donc *un défaut qui dépend de l'ordre des gestes* — rang puis nombre marchait, nombre puis rang non. ⚠️ Et mes tests ne pouvaient pas le voir : ils visaient le **magasin**, qui faisait son travail, alors que le défaut vivait dans l'**état de l'écran**. *Un test qui vise la mauvaise couche est vert pour de bonnes raisons* |
| *« comment revoir la fiche de ces nouveaux combattants ? »* | ⛔ **On ne pouvait pas.** Et la question a mis au jour un vrai défaut : `CombatCard` lisait la fiche **à deux endroits**, et un seul avait le repli vers `combatant.sheetData`. Sur un jeu sans `ui_config`, la voie historique affichait donc des **zéros** pour un adversaire parfaitement rempli. Une seule porte désormais (`logic/ficheDuCombattant.ts`), et un panneau **Fiche** sur chaque carte |

**Les trois suites du même soir**, toutes nées de ses questions :

| Question de David | Ce qui a été fait |
| --- | --- |
| *« comment revoir la fiche de ces nouveaux combattants ? »* | Un panneau **Fiche** sur chaque carte, en lecture. ⛔ Et la question a révélé que `CombatCard` lisait la fiche **à deux endroits**, un seul avec le repli vers `combatant.sheetData` : les adversaires fabriqués y affichaient des **zéros** sur les jeux sans `ui_config`. Une seule porte désormais — `logic/ficheDuCombattant.ts` |
| *« rajoute un bouton pour l'envoyer au Bestiaire ou à la campagne »* | Deux boutons en pied de fiche. Le bestiaire range un **modèle** (le numéro d'exemplaire tombe), la campagne accueille un **individu** (nom complet gardé) — et le combattant est **rattaché** à la fiche créée. ⛔ Piège évité : `addEntity` **ignore l'identifiant qu'on lui passe** et pose le sien, donc le rattachement se relit au lieu de se deviner |
| *« où se trouve le bestiaire ? »* | Nulle part : une rangée de puces **masquée quand elle est vide**. Il a maintenant son **onglet** dans l'atelier — relire, renommer, oublier, fabriquer depuis. *Une section qui se cache faute de contenu se lit « cette fonctionnalité n'existe pas ».* |

**Et la séparation par jeu, vérifiée à la demande** : liste, remplacement sur le même nom, refus de renommage, répartitions ▲▼ — tout est clé sur `driver.id`, et trois tests le tiennent dont un qui monte l'écran. ✅ L'identifiant survit à une reforge depuis le correctif du 16/08 (`enrichirLePilote`), donc le bestiaire ne s'orpheline pas. ⚠️ Deux campagnes du même jeu le partagent, par construction.

**Et une quatrième suite, le lendemain matin : « je ne trouve pas l'atelier et le bestiaire ».**

⛔ **Le stockage n'était pas le problème — la porte l'était.** Le bestiaire était indexé par
`driver.id` depuis le début, mais il ne s'ouvrait que depuis Combat-OS : *on pense à ses adversaires en
regardant son JEU, pas en ouvrant un combat.* David proposait de le lier aux pilotes ; la bonne réponse
était **deux portes, pas un déménagement**.

| Ce qui a été ajouté | Ce qu'il fallait éviter |
| --- | --- |
| **Librairie de Modèles → Drivers → bouton BESTIAIRE** | Il ouvre le bestiaire du **pilote sélectionné**, et non de la campagne ouverte — *une discordance qu'on ne remarquerait qu'après avoir fabriqué trois adversaires injouables.* Le pilote se résout dans la liste complète : la Forge en montre dix, et seuls les forgés vivent dans `customGameDrivers` |
| **Le bestiaire voyage dans le `.gmos-driver`** | Les gabarits sont **re-clés** sur le pilote importé : un bundle bricolé ou un pilote renommé avant l'export les rendrait *invisibles* — importés puis introuvables, pire que pas importés. Réimporter deux fois ne duplique pas, un bundle antérieur au 03/09 s'importe sans rien effacer, et le bestiaire entre dans le **rollback** de l'injection |

**Ce qui entre en P6 :**

- **Les deux portes et l'export**, avec un vrai pilote et un vrai bestiaire — jamais fait tourner.
- **Les archétypes sur les vrais jeux de David.** La proposition par mots-clés est le point faible assumé : elle a été éprouvée sur les cinq attributs de Dune et sur une échelle en lettres, pas sur ses dix pilotes.
- **La convention des échelles en lettres** : l'atelier suppose les options rangées *de la meilleure à la pire* (A, B, C, D). Vrai pour Blade Runner ; à vérifier ailleurs — le premier adversaire le dira du premier coup d'œil.
- **Le geste complet en séance** : fabriquer trois piétailles pendant que les joueurs discutent, sans que ça casse le rythme.

### 10 · Loot-OS revu, 2026-09-04

*« Je ne suis pas satisfait du fonctionnement que je trouve confus. » La confusion était
écrite : **DEUX systèmes de tables sans aucun lien**, et le mot « table » des deux côtés.*

**La lecture de David a décidé du plan** : les deux modules n'ont pas la même fonction —
Table-OS *consulte* (un dé, une plage, un résultat qu'on lit), Loot-OS *compose* (plusieurs
tirages, imbrications, quantités, puis distribution). On ne fusionne donc pas, on **branche**.
Et le point de rencontre est le **pool**, jamais le personnage.

| Quoi | Ce qu'il y avait dessous | Où |
| --- | --- | --- |
| ⭐ **Le pont, dans les deux sens** | Une entrée d'oracle **déclare** son butin (champ `butin`, facultatif) ; « Verser au butin » l'envoie au pool ; une table du pilote peut appeler un oracle via le type d'entrée `oracle`. ⛔ **On ne lit pas `effect` à la regex** — *un contrôle qui se trompe est pire qu'un contrôle absent* ; l'IA propose, le meneur relit dans le pool | `session/logic/butinDeclare.ts` |
| ⛔ **Table-OS écrivait chez le joueur, en PROSE** | `addLootToCharacter` remplissait `character.inventory`, **une zone de texte que l'onglet Inventaire de la tablette ne regarde même pas** (il affiche `inventoryItems`). *L'objet donné n'apparaissait nulle part où le joueur cherche ses affaires* | `tables/TableDashboard.tsx` |
| ⛔ **Le butin de séance n'était sauvegardé NULLE PART** | `lootPool` et `lootHistory` n'étaient dans aucune des deux listes durables. On fermait l'application, le butin non distribué et l'historique avaient disparu — **sans un message, puisque rien n'avait échoué**. Et le pool était **commun à toutes les campagnes** | `session/logic/donneesDeLaSession.ts` |
| **Une table imbriquée introuvable était MUETTE** | Elle rendait zéro objet et ne se plaignait qu'à la console : le meneur lisait « aucun objet » sans pouvoir savoir que c'était une faute de frappe. `generateFromTable` rend maintenant ses avertissements, et la cible se choisit dans une liste | `session/logic/LootGenerator.ts` |
| **Ni rareté, ni valeur, ni description n'avaient de champ** | Le générateur les lit depuis toujours dans `metadata` — la Forge ne les exposait pas. Les deux compteurs du panneau valaient donc **zéro** pour tout ce qui venait d'une table | `session/components/rules/EditeurDesTablesDeButin.tsx` |
| **Le vocabulaire de D&D imposé à tous les jeux** | Échelle commune→légendaire et « pièces d'or » **en dur**, dans le panneau comme dans l'invite de l'IA, à Blade Runner comme à Alien. *Même faute que les points de vie à `10`* | `session/logic/vocabulaireDuButin.ts` |
| **Quatre fichiers morts sur dix** | Les deux `LootNotification`, `LootRollPanel`, et `useLootStore` — une projection du butin vers le Player Hub **qui n'a jamais eu le moindre lecteur, écran compris** | supprimés |

**⛔ Le défaut que la question de David a révélé, et qui vaut au-delà.** À « est-ce que je dois
reforger ? », la vérification a montré que **la Forge n'a jamais produit une seule table de
butin** (aucune dans les pilotes par défaut, aucune mention dans son code) — et, dans la même
lecture, que la table `TEST` de Blade Runner est au format d'avant : `isWeighted: false`, pas
de `rollMode`. Mes deux boutons nommés lisaient `rollMode || 'weighted'` et l'affichaient
**« un seul parmi la liste »** alors qu'elle teste chaque ligne. *En nommant le mode, j'avais
rendu visible un mensonge qui ne l'était pas* — l'ancienne case à cocher tombait juste par
accident. `modeDeTirage()` et `tableImbriqueeDe()` sortent donc du générateur, exportées : **un
écran qui réimplémente la lecture d'un moteur finit toujours par en diverger.**

### 11 · La voix des PNJ, 2026-09-04

*« L'application permet de générer des profils vocaux via IA, où cela est-il stocké et est-ce
que je peux en faire pour la galerie de PNJ ? » La réponse était **non**, et un chiffre disait
pourquoi.*

Dans la sauvegarde du 30/08 : **NPC-OS porte UN PNJ, la galerie de campagne en porte 123.** Le
bouton de profilage ne vivait que dans `NPCCard`, sur le type `NPCEntity`. Les 123 PNJ que
David joue vraiment sont des `Entity` de `useSessionOSStore` — **et ce type n'avait aucun champ
pour ranger un profil.** Ce qu'ils avaient à la place : la case « Sync PNJ », qui cherche des
mots-clés et applique un preset à chaque changement de sélection **et** à chaque tour de
combat, sans jamais rien enregistrer. *Une voix qu'on doit refabriquer à chaque bascule n'est
pas un profil, c'est un réglage.*

| Quoi | Ce qu'il y avait dessous | Où |
| --- | --- | --- |
| ⭐ **La priorité, qui est le cœur du changement** | `syncWithNpc` repose le **profil enregistré** s'il existe, et ne retombe sur les mots-clés que sinon. Sans elle, le pas en avant devenait un pas en arrière : l'automatisme aurait effacé la voix qu'on venait de régler, dès le prochain clic. *Le défaut aurait été pire qu'avant, puisqu'il y aurait désormais quelque chose à perdre* | `voice/useVoiceStore.ts` |
| **Trois chemins qui ne parlaient pas la même langue** | Le profilage IA prenait `{name, gmNotes, fields}`, l'automatisme `{name, description, roleplayingNotes, id}`, la galerie ne passait rien faute de bouton. `PersonnageAVoix` est la seule forme, avec un adaptateur par magasin | `voice/logic/personnageAVoix.ts` |
| **`gmSecretInfo` ne part pas au modèle** | Ce qui part au modèle part chez le fournisseur actif, qui peut être distant. Les notes de roleplay disent comment un personnage parle — c'est la question posée ; ses secrets ne servent pas à régler une hauteur de voix. **Testé** | `voice/logic/personnageAVoix.test.ts` |
| ⛔ **Un cycle de types a fait disparaître `Window`** | Donner un `voiceProfile` à `Entity` a fait importer `useVoiceStore` par `entity.types.ts` — or `window.d.ts` importe `VoiceState`, donc le magasin. Le cycle a tué l'augmentation globale : **une centaine d'erreurs « `appBridge` n'existe pas sur `Window` »**, pour un champ facultatif. *Un type partagé ne doit pas habiter chez celui qui s'en sert le plus* | `voice/types.ts` |

**Ce qui entre en catégorie P6 par ces deux sections** — livré, jamais vu tourner en séance :

- **Le pont Table-OS → butin.** Une seule table le déclare (`fouille_ganger`) ; le geste complet
  — tirer, verser, distribuer, voir l'objet arriver sur la tablette — n'a jamais été joué.
- **L'entrée de type `oracle`.** Aucune table de pilote n'en contient : le chemin
  Loot-OS → Table-OS n'a jamais été emprunté hors des tests.
- **⚠️ L'annonce du butin part vers TOUTES les tablettes.** `HubNotification` ne vise pas un
  personnage. À valider en séance, ou à restreindre.
- **La voix d'un PNJ de campagne.** Un profil généré, retouché, rappelé trois séances plus
  tard : rien de tout cela n'a encore été fait sur un vrai PNJ.
- **Le vocabulaire du butin.** Aucun pilote n'en déclare — tout est donc neutre aujourd'hui,
  et personne n'a vu « Eddies » s'afficher.

### 12 · La revue des guides, écran par écran — ouverte le 2026-09-04

*La documentation a été réparée le 04/09 (180 liens, 53 orphelins, 6 guides neufs), mais la
**vérité de fond** d'un guide ne se lit pas dans les liens : elle se lit dans le code, et pour
ce qui reste, à l'écran. La revue se fait donc module par module, à la demande de David. Chaque
passage produit deux choses : les corrections du guide (faites tout de suite) et **les défauts
de code qu'il a fallu trouver pour les écrire** — c'est cette seconde liste qui vit ici.*

**Modules passés** : Map-OS, Nexus-OS, Media Hub, Clock-OS, les quatre modules audio, **le lot 1 — Tablet Hub et projection des dés** (04/09). ✅ **VOIE A TERMINÉE** (38 guides), **P1 et P2 de la voie B réparés**, le 04/09. **Suivant** : les rangs P3 et P4, §§ 13-14 et plan.

#### 12a · Map-OS — ce que la revue a trouvé dans le code

*Le guide est corrigé et poussé (`b0d2a91`). Ce tableau ne liste que ce qui reste à décider ou
à coder.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⚠️ **M1** | **Map-OS n'est dans AUCUNE sauvegarde.** Ni `construireLaSauvegarde`, ni la sauvegarde automatique. Sont donc hors filet : les configurations de carte, les modèles de zones de danger, les pions posés, les réglages de grille et de calques, et **tout le brouillard** (IndexedDB `fogDB`). *Exactement la famille de Music-OS et du bestiaire, rattrapés le 30/08 : une donnée qu'on crée sans y penser est une donnée qu'on oublie de protéger.* | **À trancher, puis coder.** Le brouillard est volumineux (une image par carte) — il relève probablement du **miroir des médias** et non de l'instantané JSON. Les presets et les modèles de zones, eux, sont du texte : ils entrent dans `construireLaSauvegarde`. | `store/SessionService.ts`, `map/useMapStore.ts` |
| **M2** | **Le pied du panneau des calques ment** : « Les réglages sont sauvegardés par carte ». `layerVisibility` est un objet **unique et global** dans `partialize` ; `setMap` n'y touche pas. | **Deux issues.** Corriger la phrase (une clé i18n, cinq minutes), *ou* rendre le fait vrai en rangeant `layerVisibility` par `mapUrl` comme le brouillard. La seconde est ce que la phrase promettait. | `map.sidebar.layers.footer`, `map/useMapStore.ts` |
| **M3** | **Soupçon non falsifié : changer de carte en cours de projection.** `syncToPlayers` ne pousse `projectedFogDataUrl` que **si `fogDataUrl` est non nul**. Or `setMap` sur une carte encore vierge le met à `null`, et `MapCanvas` peint le noir **sans l'enregistrer**. L'écran des joueurs garderait donc le brouillard de la carte précédente — des trous au mauvais endroit. | ⛔ **À vérifier à l'écran en premier** : projeter, charger une carte jamais explorée, regarder la tablette. Si c'est confirmé : pousser explicitement `projectedFogDataUrl: null` (le repli des deux toiles est déjà le noir). La parade actuelle est un coup de pinceau. | `map/useMapStore.ts` (`syncToPlayers`), `map/components/MapCanvas.tsx` |
| **M4** | **N'importe quel joueur déplace n'importe quel pion.** `isInteractable = (isProjectedView \|\| currentTool === 'move_token')` : sur l'écran projeté, **tout** pion visible est saisissable, y compris les adversaires du meneur. Un verrou de cinq secondes empêche seulement deux personnes de tirer le même. | **Décision de table, pas défaut.** Si David veut le restreindre : `linkedSessionPlayerId` existe déjà sur `MapToken` et suffirait à ne rendre saisissable que son propre pion. Documenté en attendant. | `map/components/MapTokenNode.tsx` |
| **M5** | **`setGridColor` est du code mort.** Il existe dans le magasin, voyage dans les presets et dans la projection, et **aucun écran ne l'appelle**. La grille est blanche pour tout le monde. | **Deux issues** : retirer l'action, *ou* poser le sélecteur de couleur que le guide promettait (le reste de la chaîne est déjà là — c'est un `<input type="color">`). | `map/useMapStore.ts:420` |
| **M6** | **Les effets magiques ne sont pas persistés** (absents de `partialize`, présents dans les presets). C'est probablement voulu — ne pas rouvrir une partie sous une boule de feu de la semaine dernière — mais rien ne le dit dans le code. | **Écrire l'intention** en commentaire, ou la corriger. Rien à faire d'urgent. | `map/useMapStore.ts` (`partialize`) |

#### 12b · Nexus-OS — ce que la revue a trouvé dans le code

*Le guide est corrigé et poussé. Nexus-OS **empaquette plus qu'il ne réinstalle** : le motif de
ce module, c'est une donnée mise dans l'archive et jamais ressortie à l'autre bout. Trois des
cinq trouvailles sont de cette famille, et personne ne peut s'en apercevoir sans faire l'aller
**et** le retour.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⛔ **N1** | **Importer une campagne ÉCRASE toute la bibliothèque d'ambiances de Sound-OS.** `useSoundStore.setState({ atmospheres: finalState.atmospheres })` — un remplacement pur. Les **playlists**, deux lignes plus bas, fusionnent proprement (fusion par identifiant, ajout des nouvelles). *Le bon code est déjà là, à côté du mauvais.* | **À corriger, priorité haute** : appliquer aux atmosphères la fusion déjà écrite pour les playlists. C'est de la perte de données silencieuse, et le seul geste qui la déclenche est celui qu'on fait en recevant le fichier d'un ami. | `NexusService.ts` (`importBundle`, phase 7) |
| ⛔ **N2** | **La trame n'est pas exportée.** `NexusCampaignState` n'a ni `actes` ni `scenes`, et `scrapeCampaignData` ne les lit pas. Une campagne emportée ailleurs arrive **sans son plan narratif** — tout ce que la Forge de campagne a écrit reste sur la machine d'origine. | **À ajouter.** Filtrer par `campaignId` comme les autres niveaux 1. *Même famille que Music-OS et le bestiaire (30/08) : la trame a été ajoutée à `donneesDeLaSession` et oubliée ici.* | `nexus.types.ts`, `NexusService.ts` |
| ⛔ **N3** | **Les paquets de cartes sont exportés et jamais réinjectés.** `deckManifests` et `deckSessionStates` sont dans le bundle ; `injectState` ne les repose pas. Deck-OS repart vide à l'arrivée. | **À corriger** — ou à retirer de l'export si ce n'est pas voulu. En l'état on paie le poids sans le bénéfice. Note : à l'export les paquets sont filtrés par `systemId`, et les `deckStates` ne sont **pas filtrés du tout** (`Object.values`). | `NexusService.ts` (`injectState`) |
| ⛔ **N4** | **Le pilote personnalisé est exporté et jamais réinjecté.** Idem pour `requiredTemplateData`. Une campagne bâtie sur un jeu forgé arrive en désignant un `system` absent de la machine. La parade actuelle — documentée — est d'exporter le `.gmos-driver` à côté et de l'importer **en premier**. | **À trancher** : réinjecter (avec le résolveur de conflits, puisque le driver a déjà le sien), ou **avertir à l'import** que le système manque. La seconde est peu coûteuse et supprime le symptôme muet. | `NexusService.ts` (`injectState`) |
| ⚠️ **N5** | **L'archive emporte des PNJ d'autres campagnes.** Niveau 3, délibéré : les entités liées par une **relation sociale** sont incluses pour garder le réseau cohérent. Mais partager un bundle partage donc ces fiches-là, **notes de MJ comprises**. | **Documenté, décision de David.** Si c'est gênant : caviarder à la source (comme `gmSecretInfo` pour la voix), ou n'inclure qu'un squelette nom + identifiant. | `NexusService.ts:186-198` |
| **N6** | **Deux options d'export déclarées, jamais offertes.** `includeAssets` est lu mais aucun écran ne le passe ; **`includeSounds` n'est lu nulle part** — il est documenté dans les types et mort dans le code. | **Deux issues** : les exposer dans le HUD (une case « sans les sons » a du sens pour un envoi par mail), ou retirer `includeSounds`. | `nexus.types.ts`, `NexusService.ts:691` |
| **N7** | **Le badge « Nexus-Ready » mesure autre chose que son nom.** Il compte les références média **non-`http`** : il dit *« cette campagne a des fichiers »*, pas *« cette campagne est portable »*. Une campagne 100 % illustrée par des URL web affiche le badge gris « export léger ». | **Renommer** (« *n* médias » / « JSON seul »), ou compter vraiment ce qui est localisable. Le guide dit désormais ce que le badge fait. | `CampaignLibrary.tsx:32` |
| **N8** | **Toutes les ambiances et toutes les playlists partent**, campagne ou pas — le commentaire l'assume (« environnement de jeu du meneur »). Depuis le 29-30/08 les atmosphères portent pourtant une **étiquette de campagne**. | **À revoir en même temps que N1** : si l'import fusionne, l'export peut rester large sans danger. Sinon, filtrer. | `NexusService.ts:225-231` |

#### 12c · Media Hub — ce que la revue a trouvé dans le code

*Le guide est corrigé et poussé. Le module a une bonne tête et un mauvais angle mort : **le
nettoyage des orphelins ne connaît pas tous les propriétaires de médias**. Chaque module ajouté
depuis a dû s'y déclarer, et trois ne l'ont pas fait.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ✅ **H1** | **Le nettoyage a trois angles morts.** `performCleanup` recense huit magasins ; il **ne regarde ni Map-OS** (`mapUrl`, et le `mapUrl` de **chaque preset**), **ni les indices** (`clue.mediaUrl`), **ni le storyboard** (`moment.imageMediaId`). Un fichier qui n'existe que là est compté comme orphelin et **supprimé**. | **À corriger.** Trois blocs `collectId` de plus. *Et le vrai remède est structurel : la liste des propriétaires est recopiée à la main dans un service que personne ne pense à ouvrir quand il ajoute un module — même famille que `donneesDeLaSession`, qui a résolu ce motif en n'ayant qu'une liste.* | `services/MediaCleanupService.ts` |
| ✅ **H2** | **Le nettoyage n'est pas automatique**, contrairement à ce qu'annonçait le guide : un seul appelant, un bouton des Paramètres. Ce n'est pas un défaut — mais ça change la gravité de H1 (rien ne part tout seul) **et** l'usage du cadenas. | **Rien à coder.** Documenté ; à garder en tête si l'idée d'un nettoyage périodique revient : elle serait dangereuse tant que H1 tient. | `GlobalSettingsModal.tsx:508` |
| ✅ **H3** | **Le panneau de détails n'a pas de « Status Tactique ».** Le guide promettait un indicateur disant si le média est utilisé dans la session en cours. Rien de tel n'existe. | **Bonne idée à construire, en fait** : les informations sont déjà réunies par `performCleanup` (l'ensemble des identifiants référencés). Un « utilisé par : 3 endroits / aucun » dans le panneau rendrait H1 visible à l'œil. | `TacticalDetailPanel.tsx` |
| ✅ **H4** | **Aucune détection de doublon à l'import.** Deux imports du même fichier = deux entrées, deux identifiants, deux fois la place. | **À trancher.** Une empreinte à l'import (le format `.gmos` en calcule déjà une, SHA-256) permettrait d'avertir. Coût faible, gain de place réel sur une bibliothèque de 261 Mo. | `useMediaStore.ts` (`addMedia`) |
| ✅ **H5** | **« Image » est la catégorie par défaut**, pas une détection : tout ce qui n'est ni `audio/`, ni `video/`, ni un document connu devient une image — vignette cassée à la clé. | **Petit correctif** : un type `other`, ou un refus explicite. Sans urgence. | `useMediaStore.ts:161-173` |
| ✅ **H6** | **Soupçon non falsifié : importer un document depuis l'éditeur de fiche.** L'attribut `accept` est construit par `allowedTypes.map(t => t + '/*')` — ce qui donne `document/*`, **qui n'est pas un type MIME**. Le sélecteur de fichiers pourrait n'afficher aucun fichier. | ⛔ **À vérifier à l'écran** : éditeur de fiche → joindre un document → importer. Si c'est confirmé, mapper `document` vers une vraie liste d'extensions. | `MediaBrowser.tsx:550` |
| ✅ **H7** | **Les documents n'ont pas d'aperçu** : `FullScreenPreview` traite image, audio et vidéo, et ne rend rien pour un document — écran vide. | **Documenté.** Un `<iframe>` suffirait pour un PDF, si le besoin se présente. | `FullScreenPreview.tsx` |

#### 12c bis · ✅ Le recensement des médias — construit le 2026-09-04

*H1, H2 et H3 sont clos, et le chantier a trouvé plus grand que ce qu'il venait réparer.*

**Ce qui a été construit** — `src/services/proprietairesDesMedias.ts` : **une** liste des
propriétaires de médias, lue par les deux qui en ont besoin. Le nettoyage y demande *« qui
retient encore ce fichier ? »*, les écrans y demandent *« qui se sert de celui-ci ? »*. C'est la
même connaissance, dans les deux sens — et elle n'était calculée que dans un sens, puis jetée.

| Ce qui change | Où |
| --- | --- |
| ⛔ **Six angles morts, et non trois.** La revue en annonçait trois ; en écrivant la liste j'ai trouvé les **documents liés à une fiche**, **l'avatar d'un joueur** (distinct de celui de son personnage) et **les favoris**. Douze propriétaires au total | `proprietairesDesMedias.ts` |
| ⭐ **Le nettoyage annonce avant d'agir.** Il n'y avait **aucune confirmation** : un clic, la suppression partait, le compte s'affichait après. Deux temps désormais — *Analyser*, qui nomme les fichiers et leur poids, puis *Supprimer ces N fichiers*, qui exécute **le plan affiché** et non un plan recalculé | `settings/NettoyageDesMedias.tsx` |
| ⭐ **Un recensement incomplet ne supprime RIEN.** Si un magasin échoue, tout ce qu'il détenait paraît orphelin — c'est exactement ce qu'on effacerait. `complet: false` bloque le nettoyage et l'écran nomme le module muet. *Épargner trop est acceptable ; effacer trop ne l'est jamais* | `MediaCleanupService.ts` |
| **Le « Status Tactique » manquant est devenu la section « Utilisé par ».** Elle nomme chaque usage — *« Map-OS — Configuration « Embuscade de nuit » »* — au lieu d'un compte | `TacticalDetailPanel.tsx` |
| **Badge « Aucun usage » et dossier calculé « Orphelins ».** **Neutre**, tranché avec David : sur une bibliothèque où la réserve est légitimement inutilisée, un rouge sur la moitié des vignettes ne voudrait plus rien dire. Le dossier montre aussi les orphelins **verrouillés** — c'est une revue, pas une prédiction | `MediaBrowser.tsx` |
| ⛔ **Trouvé en route : le Media Hub était monté DEUX fois.** `App.tsx` **et** `ModalProvider.tsx` le rendaient sur le même `isMediaHubOpen` — deux navigateurs plein écran superposés au pixel près, chacun avec son abonnement et son champ d'import. Invisible, puisque fermer l'un baisse le drapeau des deux. Celui du `ModalProvider` est retiré | `ModalProvider.tsx` |

**Et une correction de ma propre revue** : le guide affirmait que le Hub n'a pas d'entrée dans la
barre latérale. **Il en a une**, section *Outils*, et c'est la **seule** façon de le voir sans
filtre de type — donc la seule où les documents apparaissent.

**Vérifié** : `tsc -b` propre, 22 tests neufs (`proprietairesDesMedias.test.ts`,
`MediaCleanupService.test.ts`), `npm run validate` vert.

**Ce qui reste de la § 12c** : H4 (doublons à l'import), H5 (« image » par défaut), H6 (le
soupçon `accept="document/*"`, à vérifier à l'écran), H7 (pas d'aperçu de document).


**✅ Les quatre restants sont faits le 2026-09-04**, dans la foulée du recensement :

- **H6 était bien un défaut, et il n'a pas fallu d'écran pour le prouver.** `document/*` n'est pas
  un type MIME ; le filtre du sélecteur ne désignait donc rien quand on demandait un document.
  Corrigé en désignant les extensions.
- **H4** : un fichier de même **nom et même taille** demande confirmation. Le contrôle porte sur le
  nom et la taille, pas sur une empreinte — relire toute la base à chaque import coûterait plus que
  le doublon qu'on évite. Et il **avertit sans interdire** : une variante retouchée sous le même nom
  est un cas légitime.
- **H5** : le repli de classement passe de `image` à `document` — une carte neutre avec l'extension
  plutôt qu'une vignette cassée. Les images dont Windows ne donne pas le type (`.jfif`, `.avif`)
  sont reconnues à leur extension, pour qu'aucune ne tombe dans le repli.
- **H7** : PDF et texte brut s'affichent ; les formats bureautiques disent pourquoi ils ne
  s'affichent pas, au lieu d'un cadre blanc.

⭐ **Le vrai gain est structurel** : `stores/typesDeMedia.ts` tient **une** table, lue par le
classement *et* par le filtre du sélecteur. Ils se contredisaient — l'un rangeait par extension,
l'autre demandait un type qui n'existe pas — et c'est exactement le motif que ce dépôt paie depuis
des mois. 11 tests.

**H8, relevé au passage et non traité** : le sélecteur ne prend **qu'un fichier à la fois**
(`files?.[0]`, pas d'attribut `multiple`). Documenté ; à ouvrir si David importe souvent par lots —
c'est aussi là que la détection de doublon rendrait le plus.

#### 12d · Clock-OS — ce que la revue a trouvé dans le code

*Le guide est corrigé et poussé. Le module est sain — c'est le premier des quatre dont le code ne
cache aucune perte de données. Mais son réglage central en dit moins qu'il ne fait.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⭐ **C1** | **Les jauges de tension sont publiques, toutes ou aucune, et par défaut.** `isClockProjected` vaut `true` au démarrage, et **trois** écrans le lisent : le Player Hub, **les tablettes** et **l'afficheur Ulanzi**. Il n'existe aucun réglage de visibilité *par jauge pour les joueurs* — `surLAfficheur` ne parle qu'à l'Ulanzi. Une jauge secrète est donc impossible sans masquer l'horloge entière. | **Décision de table, pas défaut** — dans *Blades in the Dark* les horloges sont publiques, et c'est ce qui les rend angoissantes. Documenté. Si David veut une jauge privée : `surLAfficheur` montre que le motif « un drapeau par jauge » marche déjà, il suffirait d'un second champ. | `useClockStore.ts`, `TabletHub.tsx:275-283`, `HubClockWidgets.tsx` |
| ✅ **C2** | **L'infobulle du bouton de projection ne nommait qu'une de ses trois destinations** (« Affiché sur le Player Hub »). Le meneur qui éteint l'horloge pour se concentrer éteint aussi **l'instrument posé au milieu de la table**, sans que rien le lui dise. | **Corrigé le 04/09** : les deux libellés nomment les trois destinations, en français et en anglais. | `clock.projection.show/hide` |
| **C3** | **`ChimeEngine` est du code mort.** Une cloche de cinq harmoniques, quatre secondes de décroissance, entièrement écrite — et `playChime` n'a **aucun appelant**. Aucune sonnerie n'existe donc à la fin d'un minuteur, ni au changement d'heure. | **Bonne matière à finir, pas à jeter.** La fin d'un minuteur est le moment de l'application qui mérite le plus un son, et le moteur est déjà là. À trancher avec David : sonnerie à zéro, oui ou non. | `clock/services/ChimeEngine.ts` |
| **C4** | **`timeMultiplier` n'a pas d'écran.** Le champ, son action `setTimeMultiplier` et son commentaire (« accélération du temps fantastique ») existent ; **aucun composant ne l'appelle**, et il vaut donc toujours 1. Même famille que `setGridColor` de Map-OS (§ 12a, M5). | **Deux issues** : le retirer, ou lui donner son curseur en mode fantastique — une nuit qui passe pendant que le groupe campe. | `useClockStore.ts` |
| **C5** | **Un seul calendrier est livré** (`databases/calendars/harptos.json`), là où le guide laissait entendre une bibliothèque. Le format, lui, est riche : mois de longueurs différentes, jours intercalaires, mois de bissextile, heures par jour libres. | **Rien à coder.** Le guide dit désormais qu'il y en a un, et comment en fabriquer un autre (copier le fichier). | `databases/calendars/` |

#### 12e · Les modules audio — ce que la revue a trouvé dans le code

*Quatre guides d'un coup — la tour de contrôle, Ambient-OS, Sound-OS, Music-OS. **Huit
affirmations fausses**, dont deux qui se contredisaient entre deux pages : la durée du fondu des
ambiances au Stop All était donnée à 1 s ici et 2 s là, et le code dit 1 s.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⛔ **A1** | **Il n'y a pas de pad d'ambiance sur la télécommande.** *Corrigé le 04/09 en passant le lot 9 : ma première rédaction disait « le pad charge le silence » — le constat était juste, le geste ne l'est pas.* `triggerUniversalPad` a bien une branche qui appelle `loadTheme` (laquelle pose `isPlaying: false`), **mais rien ne peut l'atteindre** : `universalPads` ne contient que **cinq morceaux de musique et douze images favorites**, jamais d'ambiance. La branche est du **code inatteignable**, et le guide promettait un « Toggle Intelligent » et un « Auto-Play » qui n'ont jamais existé. | **À trancher.** Soit on envoie les thèmes d'ambiance dans `universalPads` **et** on les fait jouer (~15 lignes, deux fichiers), soit on retire la branche morte de `sceneActions`. En attendant, le chemin réel pour une ambiance à distance est l'onglet **Scénario**. | `useNexusSynchronizer.ts:223-233`, `remote/actions/sceneActions.ts:61-66` |
| ⛔ **A2** | **Les trois thèmes d'ambiance livrés n'ont aucun fichier son** (`url: ''`). « Forêt Enchantée » charge trois pistes nommées *Oiseaux*, *Ruisseau*, *Feuillage* — et vides. Le guide laissait croire qu'elles apportaient leurs sons. | **Documenté** — ce sont des gabarits, et c'est défendable. Mais rien à l'écran ne le dit : une pastille « gabarit » sur ces trois-là éviterait la déception du premier clic. | `useAmbientStore.ts` (`DEFAULT_PRESETS`) |
| **A3** | **Le volume général ne monte pas à 150 %.** Le curseur est borné à 1. Le guide promettait un *boost* ; les 150 % existent, mais sur le **volume d'un pad** de Sound-OS. | **Rien à coder** — sauf si David veut vraiment le boost. Corrigé dans le guide. | `MasterAudioController.tsx` |
| **A4** | **La coupure rapide remonte à 100 %, pas au niveau d'avant.** `setMasterVolume(masterVolume === 0 ? 1 : 0)` : un aller-retour sur une table réglée à 40 % la met à fond. | **Petit correctif utile** : retenir le niveau d'avant la coupure. Trois lignes dans le magasin. | `MasterAudioController.tsx` |
| **A5** | **Le Stop All ne coupe pas les bruitages : il les fond sur 3 secondes** (`SoundEngine.stopAll` fait une rampe de 3 s). Le guide de la tour de contrôle annonçait une « coupure instantanée ». Et il omettait que le Stop All **retire aussi les fiches et favoris projetés** du Hub. | **Rien à coder** ; les deux sont dans le guide. *À savoir en séance : le bouton panique met trois secondes à faire silence.* | `SoundEngine.ts:249` |
| **A6** | **Le Focus Chat tamise les bruitages à 50 %**, pas à 10 % comme la musique et les ambiances — `Math.max(0.5, focusDuckingRatio * 5)`. Volontaire et bien pensé (un coup d'épée doit garder son impact), mais écrit nulle part. | **Documenté.** | `SoundEngine.ts:60` |
| **A7** | **La reprise lumineuse d'Ambient-OS suit le NUMÉRO de piste**, pas l'ordre d'allumage : `otherActiveWithLights[length - 1]` prend le dernier de la liste, qui est ordonnée par index. Le guide annonçait « la dernière piste activée ». | **À trancher** : corriger le code (retenir un ordre d'allumage) ou la phrase. Le guide dit désormais la vérité. | `useAmbientStore.ts` (`handleLightReversion`) |
| **A8** | **Le fondu automatique de Music-OS dure 5 secondes et se règle** (0,5 à 20 s), et sa courbe est **à puissance constante**. Le guide annonçait « une rampe de 1.5s » — faux sur les trois points. | **Rien à coder.** Le curseur existe, au-dessus du crossfader. | `useMusicStore.ts:205`, `logic/fonduCroise.ts` |
| ✅ **A9** | **Un fragment de phrase recopié** au milieu du guide de Music-OS, reste d'un copier-coller. | ✅ **Réparé.** | — |
| **A10** | **`setFocusDuckingRatio` n'a pas d'écran** : le rapport de tamisage est déclaré réglable et vaut toujours 0,1. Et `useAudioMasterStore.getBackupData()` **n'a aucun appelant** — le volume général et le Focus ne sont dans aucune sauvegarde. Même famille que `setGridColor` (§ 12a) et `timeMultiplier` (§ 12d) : **trois réglages déclarés, jamais offerts**. | **À trancher en une fois**, pour les trois modules. Un « atelier des réglages morts » : soit on les expose, soit on les retire. | `useAudioMasterStore.ts` |

**Trois choses saines, vérifiées** : la sommation mono d'Ambient-OS et son compresseur existent
bien ; les seize pads, le fondu de 3 s et le volume à 150 % de Sound-OS sont exacts ; le
rattachement des playlists à une campagne se comporte comme annoncé, **playlists orphelines
comprises** — une campagne supprimée ne fait pas disparaître ses musiques.

#### 12f · Lot 1 — ce que les joueurs ont sous les yeux (2026-09-04)

*Tablet Hub, guide détaillé, projection des dés. **Le lot était placé en tête parce que chaque
module passé avait livré la même sorte de trouvaille — ce qui part chez les joueurs n'est pas ce
que le guide annonce. Ici, c'est le chemin pour arriver jusqu'à eux qui était faux.***

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⛔ **T1** | **Les deux chemins de connexion donnés aux joueurs étaient faux.** Le guide principal envoyait dans « Paramètres → Télécommande → Nexus Link », qui n'existe pas ; le guide détaillé donnait `http://[IP]:3000/hub`, faux **sur le port et sur le chemin**. Le vrai : un bouton **Connecter Joueurs** dans la barre du haut, et `http://<ip>:3001/?window=tablet`. | ✅ **Corrigé dans les deux guides.** *Rien à coder — mais c'est le défaut de documentation le plus coûteux trouvé jusqu'ici : il empêche purement et simplement d'entrer.* | `Shell.tsx:541`, `NetworkQRCodeModal.tsx:23` |
| ⛔ **T2** | **Une section entière du guide était du texte de fusion non résolu** : sept lignes commençant par `+`, insérées entre les sections 8 et 9, et numérotées « 10 » avant le « 9 ». | ✅ **Réécrit.** | — |
| ⛔ **T3** | **« 60 FPS garantis sous Tauri v2 ».** GM-OS ne tourne pas sous Tauri mais sous **Electron** ; aucune de ces images par seconde n'a jamais été mesurée. Le seul reste de Tauri dans le dépôt est un contournement commenté dans `MusicEngine` et deux libellés d'i18n. | ✅ **Retiré.** | — |
| ⛔ **T4** | **Aucun des six onglets du Hub n'était décrit** — ni les indices (Archives), ni l'Atlas (Lieux), ni les cartes en main, ni l'inventaire. Le guide parlait d'horloge et de jauges, c'est-à-dire de ce que le Hub affiche **tout seul**, jamais de ce qu'un joueur **touche**. | ✅ **Les six onglets et les quatre panneaux sont écrits**, côté meneur et côté joueur. | `TabletHub.tsx:388-455` |
| ⚠ **T5** | **Le bouton de projection des dés est introuvable.** Il vit en `opacity-0 group-hover/result:opacity-100`, en surimpression du panneau de résultat, et **n'existe que si l'historique n'est pas vide**. Le guide le plaçait « dans le bandeau Dice-OS ». *Même famille que le repli du 23/08, qui rendait des boutons introuvables — le motif revient.* | **À trancher** : le rendre permanent (il est déjà discret), ou laisser et documenter. Documenté en attendant. | `DiceBoard.tsx:899-912` |
| **T6** | **Les dés 3D n'étaient documentés nulle part**, alors que c'est l'effet le plus spectaculaire : le Player Hub lance de vrais dés, et le panneau de résultat n'arrive qu'après **1,5 s**, en retrait. ⚠️ **Réservé au Player Hub** — les tablettes n'ont que le panneau. | **Documenté.** | `HubDiceDisplay.tsx:25`, `PlayerHub.tsx:196` |
| **T7** | **La projection des dés atteint aussi les tablettes**, ce que le guide ne disait pas — il parlait du seul Player Hub. | **Documenté.** | `TabletHub.tsx:555` |
| **T8** | **La « taille de police réduite de 15 % pour le confort tablette » n'est pas un réglage de tablette** : c'est `:root { font-size: 85% }`, la base de **toute** l'application, meneur compris. | **Documenté.** *À garder en tête : un `rem` vaut 13,6 px dans ce projet.* | `index.css:200` |

**Vérifié et exact** : le verrouillage d'un personnage par appareil, l'enregistrement des notes
privées à 1,5 s, le don d'objet qui passe par une validation, les cinq secondes de projection et
la seconde de fondu, le port 3001 du diagnostic.

#### 12g · Lot 2 — le code le plus récent (2026-09-04)

*Storyboard et Voice-OS. Les deux avaient été retravaillés entre le 31/08 et le 03/09, et leurs
guides écrits dans la foulée : **ce sont les plus justes rencontrés jusqu'ici**. Les trouvailles
sont donc plus fines — mais l'une d'elles rendait deux boutons muets depuis toujours.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⛔ **S1** | **Deux boutons « Capturer active » visaient des champs qui n'existent pas.** `mapStore.currentMapUrl` (le champ s'appelle `mapUrl`) et `imageStore.activeMediaId` (Image-OS retient `projections` par écran, et des **chemins** là où le moment attend un **identifiant**). Dans les deux cas la garde `if` avalait l'échec : **le clic ne posait rien et ne disait rien**. | ✅ **Corrigé le 04/09.** Et quand il n'y a réellement rien à prendre, le bouton le dit maintenant. *Une capture muette est indiscernable d'une capture qui n'a rien trouvé.* | `StoryboardDashboard.tsx` (`handleCapture`) |
| ⛔ **S2** | **Les messages de « Capturer active » pour le son et l'ambiance étaient bâtis sur les mauvaises clés** : on lisait *« Sound-OS : ex: Combat Final »* et *« Ambient-OS : Aucun(e) »*. | ✅ **Corrigé**, avec un message qui dit *pourquoi* : Sound-OS empile ses bruitages, Ambient-OS ne retient pas la scène appliquée — il n'existe aucun état courant à recopier. | `storyboard.editor.capture_unavailable` |
| ⛔ **S3** | **Le guide disait que la musique survit toujours à un changement de séquence.** Faux : `cequUnePriseDeMainEteint` la coupe **si la nouvelle séquence n'apporte pas la sienne**. C'est à l'**arrêt** d'un moment qu'elle reste (`cequUnArretEteint`). *Deux gestes, deux règles* — et le guide n'en donnait qu'une. | ✅ **Le guide porte le tableau des cinq moteurs**, changement et arrêt séparés. | `sonsDuMoment.ts` |
| ⛔ **S4** | **« Le Storyboard ne vise pas le Player Hub »** — faux : `imageTarget` et la cible du titre acceptent `hub`, et `<TitreProjete cible="hub" />` est monté dans `PlayerHub`. Ce qu'il n'atteint pas, ce sont les **tablettes**. | ✅ **Corrigé.** | `PlayerHub.tsx:115` |
| ⛔ **V1** | **Aucun bouton « Générer Profil IA » n'existe dans Voice-OS**, contrairement à ce qu'annonçait son guide — et la section qui le décrivait **répétait en la contredisant** celle sur les voix de PNJ, écrite le 04/09. | ✅ **Section retirée**, la génération se fait depuis la fiche du PNJ. | `VoiceDashboard.tsx` |
| ⚠ **V2** | **La liste « Voix des PNJ » de Voice-OS ignore la galerie de campagne.** Elle lit `useNPCStore.savedEntities` — c'est-à-dire le module qui portait **un** PNJ, quand la galerie en porte cent vingt-trois, et que ce sont eux qui peuvent désormais avoir un profil. | **À trancher.** Y ajouter les entités de campagne porteuses d'un `voiceProfile` est une ligne de plus dans le filtre ; la question est de savoir si cette liste doit grossir de cent entrées, ou rester le mémo de NPC-OS. | `VoiceDashboard.tsx:87` |
| **V3** | **Le débruitage par défaut est `navigateur`** — c'est-à-dire, d'après le guide lui-même, « le premier suspect » des fins de phrase coupées. Un meneur qui n'a rien réglé a donc le réglage que le dépannage accuse. | **À trancher** : passer le défaut à *Neuronal* maintenant que RNNoise existe, ou laisser et documenter. Documenté. | `useVoiceStore.ts:111` |

**Vérifié et exact** : la voix n'est **jamais** touchée par le Focus Chat (`VoiceEngine` ne lit que
`masterVolume`, pas `isFocusMode`) ; les cinq presets ; les trois positions du débruitage ; le
titre permanent quand la durée est vide ; les six éléments d'un moment.

#### 12h · Lot 3 — l'Oracle et le corpus (2026-09-04)

*Quatre guides pour une seule chaîne. Le lot avait été groupé parce que « séparés, ils se
contrediront » — c'est pire que ça : **ils se contredisaient déjà, et tous les quatre décrivaient
le mauvais moteur.***

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⛔ **O1** | **Les quatre guides affirmaient que l'Oracle repose sur NotebookLM.** Faux : la conversation passe par `AIService`, avec l'un des **six** fournisseurs (`gemini`, `openai`, `anthropic`, `ollama`, `ollama_cloud`, `custom`). NotebookLM sert à **la Forge de campagne**, pour distiller un scénario. Un meneur dont l'Oracle ne répondait plus était donc envoyé réparer un pont sans rapport — et invité à surveiller un « voyant vert Bridged » qui ne dit rien de sa capacité à répondre. | ✅ **Corrigé dans les quatre.** La page NotebookLM change de sujet : elle décrit l'outil pour ce qu'il est. | `ai/types.ts:1`, `AIService.ts:271` |
| ⛔ **O2** | **Le compte des personas était faux trois fois sur une seule page** : « 6 experts », une liste de sept, puis « vos 7 GEMS ». Ils sont **huit** — **Le Stratège** manquait partout. | ✅ **Corrigé.** Le tableau des six que portait la page NotebookLM est supprimé plutôt que réparé : deux guides qui listent la même chose divergeront de nouveau. | `PersonaGeneratorService.ts:18-27` |
| ⛔ **O3** | **« Sync Oracle » ne fait pas ce que son nom promet.** Le bouton pousse la note dans un **carnet NotebookLM** ; elle n'entre pas dans ce que l'Oracle lit en conversation. Les trois guides en tiraient la conclusion inverse — « l'IA répond en tenant compte de VOTRE monde ». Ce qui donne les notes à l'Oracle est **l'interrupteur du coffre**, et **aucun des quatre guides ne le mentionnait**. | ✅ **Les deux mécanismes sont distingués**, avec un tableau « lequel des trois, pour quoi ». ⚠️ **Le nom du bouton reste trompeur** : à renommer (« Envoyer au carnet ») si David le souhaite. | `ObsidianPanel.tsx:52-67` |
| ⚠ **O4** | **La ligne « Oracle » du diagnostic IA teste le pont NotebookLM**, pas la conversation. Une croix rouge sur cette ligne ne dit rien de l'Oracle. *Un contrôle mal nommé est pire qu'un contrôle absent* — la leçon de la dérivation de Cthulhu Hack, reprise ici. | **À renommer** : « Pont NotebookLM (Forge) ». Une clé d'i18n. | `AISettings.tsx:201-215` |
| ⛔ **O5** | **Un chemin de coffre écrit en dur, nom d'utilisateur compris** (`C:\Users\david\OneDrive\Obsidian Vault`), donné comme l'emplacement par défaut. | ✅ **Retiré.** | — |
| ⛔ **O6** | **Une consigne de dépannage sans objet** : « assurez-vous que la `notebook_query` est active » et « utilisez le bouton RECONNECT du panneau Oracle ». Ce bouton n'existe pas dans le panneau Oracle ; la reconnexion vit dans l'atelier de campagne. | ✅ **Retiré.** | — |
| **O7** | **Les sources citées n'étaient documentées nulle part** — et c'est la fonction la plus utile du panneau. Sous chaque réponse : le nom de chaque fiche consultée, son état (**non relue** / **relue**), un **⚑** pour la signaler comme suspecte et la mettre en file de reforge, et un badge de **penchant** (règles / campagne) toujours affiché. | ✅ **Écrit.** *C'est la boucle qui rend un corpus fiable : l'Oracle répond mal → on voit quelle fiche l'a mal renseigné → on la signale.* | `AIChatPanel.tsx:410-478` |

**Vérifié et exact** : le plafond de contexte à **4 000 jetons** (`electron/ragSelection.ts:39`) ;
le coffre comme racine **additive et éteinte par défaut** ; le badge **SYNC** sur un persona
configuré pour le système ; la génération séquentielle des personas ; l'export vers Obsidian qui
crée sans jamais modifier.

#### 12i · Lot 4 — le Cortex (2026-09-04)

*Deux guides pour un seul module. Le pari du lot — « c'est la configuration qui produit des
contradictions » — s'est vérifié sur **le premier bouton du panneau**, décrit par les deux pages, et
**aucune des deux n'avait raison**.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⛔ **K1** | **Le bouton « Sensors » ne fait ce qu'aucun des deux guides annonçait.** Le guide Cortex : « en mode Muted, l'IA ne fera aucune suggestion » — faux, l'analyse continue. Le manuel : « coupe le retour audio » — incomplet. `isMuted` garde exactement deux choses : `useAudioTactical` (les sons) et `useHardwareBridge` (les lampes Hue). **C'est un interrupteur de matériel, pas d'intelligence.** | ✅ **Corrigé.** ⚠️ Le libellé lui-même invite à l'erreur : « Sensors » (capteurs) suggère la perception, alors qu'il commande les **effecteurs**. *À renommer si David le souhaite* — « Effets » ou « Matériel ». | `useTacticalAIStore`, `hooks/useAudioTactical.ts:23`, `hooks/useHardwareBridge.ts:43` |
| ⛔ **K2** | **Les trois seuils de priorité étaient faux.** Le manuel donnait « Urgence 3-5 / Opportunité 2 / Conseil 1 ». Le code range à **≥ 4**, **= 3**, et **le reste**. Un conseil de priorité 3 était donc annoncé rouge et s'affiche jaune. | ✅ **Corrigé.** | `TacticalAdvicePanel.tsx:116-135` |
| ⛔ **K3** | **« Ouvrez Map-OS, cliquez sur l'icône Brain de la barre d'outils ».** Il n'y a pas d'icône Brain dans Map-OS, et le Cortex n'y est pas : c'est un bandeau monté dans `Shell`, présent partout, dont l'interrupteur vit dans les Paramètres généraux. | ✅ **Corrigé.** | `Shell.tsx:570`, `GlobalSettingsModal.tsx:589` |
| ⛔ **K4** | **« Vos banques de sons tactiques doivent être présentes dans `assets/sounds/tactical` ».** Elles **sont livrées** : neuf fichiers dans `public/assets/sounds/tactical`. Le guide envoyait chercher ce qui était déjà là — et le chemin donné n'existe pas à la racine. | ✅ **Corrigé.** | `public/assets/sounds/tactical/` |
| ⛔ **K5** | **« Moteurs supportés : OpenAI (GPT-4) et Google Gemini … (optionnel) ».** Le Cortex passe par `aiService`, donc **les six fournisseurs** comme l'Oracle — et le modèle **n'est pas optionnel** : sans lui, aucun conseil. | ✅ **Corrigé.** | `useTacticalAIStore.ts:62-178` |
| ⛔ **K6** | **« Le Player Hub est informé » des catégories de portée.** Aucune trace du Cortex dans `PlayerHub` ni `TabletHub`. Rien ne part chez les joueurs. | ✅ **Corrigé.** | — |
| **K7** | **La duplication elle-même était le défaut.** Deux pages décrivaient les mêmes boutons ; c'est ainsi qu'elles ont divergé. Le manuel **cesse de décrire** et renvoie au guide pour tout ce qui est commun. | ✅ **Fait.** *Même remède que pour le tableau des personas du lot 3.* | — |

**Vérifié et exact** : les cinq catégories de portée (**Contact**, Courte, Moyenne, Longue,
Extrême) ; le déclenchement à chaque changement de tour et à la dépose d'un pion ; l'auto-dissipation
des statuts incompatibles ; le caviardage de l'adresse et du jeton du pont Hue avant tout envoi au
modèle ; la narration et les conseils demandés **en parallèle**.

**Deux qualités du code que les guides taisaient**, et qui méritent d'être lues : le rapport
**distingue ce qu'il sait de ce qu'il suppose** (une distance mesurée sur une grille non calibrée
est signalée comme telle), et il **nomme les neutres** au lieu de les compter parmi les ennemis —
ce qui l'empêche de proposer d'attaquer le tavernier.

#### 12j · Lot 5 — les règles et la Forge (2026-09-04)

*Trois guides. Les deux premiers décrivaient un état de l'application antérieur au 2026-08-16 ; le
troisième donnait **deux exemples de formules qui ne fonctionnent pas**.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⛔ **F1** | **Deux exemples de formule faux dans le guide des fiches.** `@Dextérité` : le lecteur ne reconnaît que `[a-zA-Z0-9_]`, il s'arrête à `@Dext` et **la formule entière tombe** — le guide affirmait pourtant que « les accents sont supportés ». Et `@NombreDeDes d6` : le motif des dés exige des **chiffres des deux côtés** du `d`. | ✅ **Corrigé**, avec la règle exacte de transformation d'un nom de champ (accents retirés, non-alphanumériques supprimés). | `CalculationEngine.ts:39-47`, `useSheetCalculator.ts:44-46` |
| ⛔ **F2** | **Un nom inconnu ne vaut pas 0 : il fait tomber toute la formule à 0.** `expr-eval` lève, le `catch` rend `0`. `@Force + 10` mal orthographié rend **0**, pas 10. Le guide promettait que « vos formules ne casseront pas ». | ✅ **Écrit** — *c'est le diagnostic le plus utile de la page : une formule obstinément à 0 est presque toujours un nom mal écrit.* | `CalculationEngine.ts:60-70` |
| ⚠ **F3** | **Un dé dans une formule de fiche est relancé à chaque recalcul** (`Math.random()` à chaque évaluation). Le guide vantait la réactivité — « voir le résultat évoluer pendant que vous tapez » — sans dire que le dé change aussi. | **Documenté.** À trancher si ça gêne : mémoriser le tirage par champ, ou refuser les dés dans un champ calculé. | `CalculationEngine.ts:19-28` |
| ⛔ **F4** | **Les modes « BRAIN » et « BODY » de la Forge n'existent plus.** Le guide demandait de choisir entre extraire la logique ou la structure visuelle. La Forge produit les deux ensemble depuis le 2026-08-16, et **enrichit** un système existant au lieu d'en créer un second — avec une case « Ne pas toucher à la fiche de personnage », cochée par défaut. | ✅ **Réécrit**, y compris l'avertissement de la case décochée : *si la dérivation nomme `points_de_vie` ce que la fiche appelle `hp`, on obtient les deux.* | `ForgeDashboard.tsx:1005-1023, 875-886` |
| ⛔ **F5** | **« L'IA (Gemini 1.5 Pro) »** — aucun modèle n'est imposé. Le moteur se **choisit à chaque forge** parmi les six, mémorisé par atelier et **toujours affiché**. *Mémoriser sans montrer redonnerait un réglage qu'on a oublié d'avoir posé* — la leçon du coffre Obsidian, reprise dans le code. | ✅ **Corrigé**, avec les durées mesurées (9-15 min en local, 2-5 min après distillation, ~30 s sur Gemini Flash). | `ai/moteurParForge.ts` |
| ⛔ **F6** | **Forge-OS a trois ateliers** — Forge, Campagne, Trame — et le guide n'en connaissait qu'un. | ✅ **Ajouté**, avec renvoi aux deux guides dédiés. | `ForgeOS.tsx:40-95` |
| ⛔ **F7** | **L'éditeur de règles a sept sections**, le guide en décrivait trois. Manquaient l'**Atelier** (les fiches partageables), l'**Intelligence** (les personas), les **Trésors** (tables de butin **et vocabulaire du jeu** — monnaie, raretés) et la **Connaissance** (le carnet NotebookLM). | ✅ **Ajouté.** La section Trésors est celle du 04/09 : sans elle, Loot-OS reste neutre et dit « pièces » là où le jeu dit « eddies ». | `RulebookViewer.tsx:50-56` |
| **F8** | **Le partage d'une règle envoie DEUX choses** : la fenêtre plein écran, **et** un message dans le canal général qui reste dans l'historique. Le guide n'en mentionnait qu'une — or c'est le second qui sert le lendemain. Et le chemin d'accès était faux (« onglet Règles & Forge du Dashboard MJ »). | ✅ **Corrigé.** | `RuleWorkshopViewer.tsx:240-275` |

**Vérifié et exact** : les fonctions `min`, `max`, `floor`, `ceil`, `abs` ; un champ **déclaré mais
vide** vaut bien 0 ; l'export d'une règle vers Obsidian ; l'éditeur Markdown avec rendu en direct ;
l'enregistrement des fiches dans le dossier du système ; le lien NotebookLM par système.

#### 12k · Lot 6 — le combat (2026-09-04)

*Quatre satellites de Combat-OS. Le motif du lot : **des tableaux inventés** — des correspondances
listées dans les guides que le code ne contient nulle part.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⛔ **D1** | **Deux statuts automatiques inventés.** Le guide du calculateur annonçait neuf correspondances type → statut ; le code en a **six** plus le soin. « Nécrotique → Affaibli » et « Radiant → Ébloui » n'existent pas — les deux **types** existent bien, mais ne posent rien. Et **Empoisonné dure 5 tours**, pas 3. | ✅ **Corrigé.** À trancher si David veut vraiment ces deux statuts : c'est deux lignes dans `COMBAT_AUTO_STATUS_RULES`. | `combat/logic/CombatRules.ts:31-38` |
| ⛔ **D2** | **La correspondance se fait par mot contenu.** Le guide donnait « Froid / **Glace** » et « **Éclair** / Foudre » : seuls `froid` et `foudre` déclenchent quelque chose. Un pilote qui nommerait son type « Glace » ne poserait aucun statut, **sans que rien le signale**. | ✅ **Documenté.** *Le nom du type est devenu une clé de correspondance sans que personne l'ait décidé* — à surveiller si un pilote forgé nomme ses types autrement. | idem, `includes(key)` |
| ⛔ **D3** | **La coloration automatique des ressources par nom n'existe pas.** Le guide de cohésion donnait une table — *Sanity* violet, *Mana* bleu, *XP* ambre, le reste indigo. Aucune trace dans le code : la couleur vient du pilote, ou du repli à une seule couleur. | ✅ **Corrigé.** | `CombatCard.tsx:450-600` |
| ⛔ **D4** | **La couleur déclarée d'une jauge n'est presque jamais appliquée.** Seul le style `bar` la lit, et **seulement si elle est écrite en classe Tailwind** (`bg-red-500`). Les styles `segmented` et `neon` emploient `bg-primary` quoi qu'il arrive. **Or l'exemple que la Forge produit elle-même** combine `"style":"segmented"` et `"color":"#d97706"` — les deux conditions qui garantissent que la couleur sera ignorée. | **À corriger** : lire `gaugeConfig.color` dans les trois styles, et accepter l'hexadécimal (un `style={{ background }}` plutôt qu'une classe). *Sinon corriger l'exemple de la Forge, qui enseigne le contraire.* | `CombatCard.tsx:471-545`, `GroupesDeChamps.ts:571` |
| ⛔ **D5** | **Le rapport de fin de combat va au journal de séance, pas à la chronologie.** Le guide annonçait « un événement de type `combat` ajouté à la **Timeline** » ; c'est `useJournalStore.addEvent({ type: 'COMBAT' })`. La conséquence compte : il rejoint le **compte rendu de fin de séance**, et non l'histoire longue de la campagne. | ✅ **Corrigé.** | `useCombatStore.ts:842` |
| ⛔ **D6** | **Une variable d'initiative introuvable vaut `0`**, elle ne déclenche pas le repli annoncé sur `1d20`. `1d20 + [dex]` sans `dex` rend un `1d20` sec : le résultat ressemble à ce que le guide promettait, **mais rien ne signale que la caractéristique manquait**. Le repli sur un dé au hasard n'existe que si la formule est illisible. | ✅ **Documenté.** *Un modificateur silencieusement absent est plus difficile à voir qu'une erreur.* | `CombatRules.ts:108-150` |
| ⛔ **N1b** | **Le générateur d'images n'est pas Gemini/Imagen-3.** Le guide en faisait son moteur et demandait une **clé API Gemini** : **Gemini ne génère aucune image dans GM-OS**. Trois chemins : FLUX local (hors séance), **Cloudflare Workers AI**, puis Z-Image. La clé à configurer est un **compte Cloudflare + jeton `Workers AI — Edit`**. | ✅ **Corrigé**, avec la raison du court-circuit en séance : le local occupe l'unique créneau de calcul, donc l'Oracle et le Cortex avec lui. | `AIService.ts:664-860`, `ai/cloudflareImage.ts` |
| **D7** | **Le bouton « DERNIER JET »** du calculateur reprend le total du dernier lancer de dés. Le geste qui fait gagner le plus de temps, absent de tous les guides. | ✅ **Écrit.** | `DamageCalculator.tsx:99-105` |

**Vérifié et exact** : résistance ÷2, vulnérabilité ×2, immunité 0 ; le plafonnement des soins ; la
résolution des conflits de statuts (le feu retire le mouillé) ; les trois styles de jauge et les
deux dispositions d'initiative ; le bouton **Sync PV vers Session** ; les types de dégâts
personnalisables par le pilote.

**Un geste que personne n'avait écrit** : sur une jauge de ressource, **clic gauche −1, clic droit
+1**.

#### 12l · Lot 7 — les tables et le butin, et l'archivage du lot 10 (2026-09-04)

*Le lot le plus court en trouvailles, et pour une bonne raison : **la moitié de ces pages a été
écrite le matin même**, avec le pont Table-OS → butin. Ce qui restait à vérifier, c'est le vieux
fond de Table-OS.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| **T1** | **Le « jet manuel » n'était documenté nulle part.** Un champ et un bouton *Afficher* permettent d'entrer le chiffre d'un **vrai dé** et d'obtenir l'entrée correspondante, sans que GM-OS tire quoi que ce soit. *C'est le geste des meneurs qui tiennent à lancer leurs propres dés* — et il était invisible. | ✅ **Écrit.** | `TableDashboard.tsx:207-225` |
| ⛔ **T2** | **La règle des dés juxtaposés était donnée par l'exemple, jamais par la règle.** Le motif est `/^d([468])\1+$/` : **un seul chiffre, répété, et seulement 4, 6 ou 8**. `d1010` ou `d36` ne fonctionnent pas — ils seront lus comme des dés ordinaires, ou pas du tout. Les exemples du guide étaient tous valides ; la limite ne l'était pas. | ✅ **Écrit.** | `TableEngine.ts:13` |
| **T3** | **L'historique montre dix tirages, il en garde cinquante.** Le guide annonçait cinquante, ce qui est vrai en mémoire et faux à l'écran. | ✅ **Précisé.** | `useTableStore.ts:102`, `TableDashboard.tsx:245` |
| ✅ **T4** | **Trois clés d'i18n mortes** — `give_button`, `give_tooltip`, `recipient_fallback` : les libellés du bouton « Donner à un PJ » retiré de Table-OS le matin même. | ✅ **Retirées**, en français et en anglais. | `random_tables.main.*` |
| ✅ **T5** | **Le guide d'écriture des tables numérotait deux fois « 3 » et deux fois « 4 ».** | ✅ **Renumérotée**, 1 à 7. | `42-Butin-ecrire-les-tables.md` |

**Vérifié et exact** : les six univers livrés ; le modificateur appliqué au **résultat brut** et non
au dé ; le fichier de gabarit `databases/modele_table.json` ; le prompt d'aide à la création
(`databases/tables/MedFan/`) ; les quatre portes d'entrée du butin ; l'annonce du don qui part vers
**toutes** les tablettes ; le pool rattaché à une campagne et persisté.

**Deux guides de butin, et c'est voulu** : l'un *compose* (écrire ses tables), l'autre *distribue*
(le pool, les dons, l'historique). Ils ne se recouvrent pas — contrairement au Cortex du § 12i, il
n'y avait rien à dédoublonner.

#### 12m · Lot 10 — archivé plutôt que révisé (2026-09-04)

`migration-guide` n'était **pas un guide utilisateur** : une note d'architecture datée du
2026-03-10, écrite pour qui touche au code — règles `appBridge`, TypeScript strict, Vitest,
génération des composants par Stitch. Aucun de ses paragraphes ne décrit un geste de table.

**Déplacé** vers `Planning/Archive/2026-03-10-refonte-v5-architecture.md`, avec un en-tête qui dit
ce qui a vieilli dedans :

- la **portabilité Electron / Tauri** posée en principe fondateur — Tauri n'a jamais dépassé deux
  libellés et un contournement commenté *(le même fantôme que les « 60 FPS sous Tauri v2 » du
  § 12f)* ;
- le **« aucun type `any` »** — il en reste des centaines, que le linteur signale sans bloquer ;
- **Stitch / Figma** comme source des composants React.

Ses trois liens entrants sont repointés vers `V6_Code_Standards` et `AppBridge_Architecture_Standard`,
qui font autorité.

#### 12n · Lot 8 — l'image et la lumière (2026-09-04)

*Trois guides qui se croisent dans la projection. Le lot a rendu **la trouvaille la plus grave de
toute la revue** : une page qui affirmait à David que ses données étaient en sécurité.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⛔⛔ **G1** | **Favorite-OS annonçait un coffre de synchronisation qui n'existe pas.** *« Le module indique en temps réel l'état de synchronisation avec votre coffre central (Vault). Une pastille verte "Vault Synced" **confirme que vos données sont en sécurité**. »* Le mot *Vault* n'apparaît **nulle part** dans le module. **Et Favorite-OS n'est dans aucune sauvegarde** — ni automatique, ni export manuel. *C'est la troisième fois que cette famille d'affirmation est trouvée : le faux backup GitHub du guide général, puis Map-OS, maintenant celle-ci. Sur un dépôt qui a perdu ses campagnes deux fois, c'est la ligne qu'il faut chercher en premier.* | ✅ **Retirée**, remplacée par l'avertissement inverse. ⚠️ **Reste à décider** : mettre Favorite-OS dans `construireLaSauvegarde`. Ses dossiers sont du travail de préparation, comme les presets de Map-OS. | `useFavoriteStore.ts`, `store/SessionService.ts` |
| ⛔ **G2** | **Un bouton « Export » JSON annoncé, qui n'existe pas** dans Favorite-OS. | ✅ **Retiré.** | — |
| ⛔ **G3** | **Les « GM Secrets » ne sont pas chiffrés.** Le guide disait « notes chiffrées réservées au MJ » ; `secretNotes` est une chaîne en clair. La réserve est une **séparation d'interface** — aucun écran joueur ne les affiche —, pas une protection. | ✅ **Corrigé.** *Annoncer un chiffrement qui n'existe pas est pire que ne rien annoncer : ça décide de ce qu'on ose y écrire.* | `useFavoriteStore.ts:32` |
| ⛔ **G4** | **Le bouton « RESTORE DEFAULT » d'Image-OS n'était mentionné dans aucun guide.** Il **efface toute la bibliothèque d'images, tous les dossiers et toutes les projections**. Rouge, discret, juste au-dessus des commandes de projection. Même famille que le bouton de réinitialisation de Sound-OS (§ 12e). | ✅ **Écrit**, dans une section à lui. | `ImageDashboard.tsx:143`, `useImageStore.ts:497` |
| ⛔ **G5** | **Le « mode Standby » affichant « EN ATTENTE » n'existe pas.** Aucune trace de ce texte. | ✅ **Retiré.** | — |
| ⛔ **G6** | **Trente-neuf effets lumineux**, là où le guide en citait quatre avant un « etc. » — et *Grisaille*, l'un des quatre, n'existe pas. | ✅ **Corrigé**, avec une douzaine de noms réels. | `HueEngine.ts:408-640` |
| **G7** | **Cinq modules commandent les lampes** sans passer par Light-OS : Sound-OS, Music-OS, Ambient-OS, les zones de danger de Map-OS, et le Storyboard. Aucun guide ne le disait, alors que c'est la réponse à « pourquoi la lumière a changé toute seule ». Et **le Stop All éteint tout**. | ✅ **Écrit** dans Light-OS. | — |
| **G8** | **`clearAll` d'Image-OS est du code mort**, et sa confirmation ment : elle annonce que « les dossiers et projections seront perdus » alors qu'elle ne vide que `mediaList`. Aucun appelant. | **À retirer.** Sans risque : personne ne l'appelle. | `useImageStore.ts:475` |

**Vérifié et exact** : les 18 emplacements de scène de Light-OS ; l'appairage par le bouton
physique du pont ; la transition de **5 secondes par défaut**, réglable ; le retour à l'ambiance
manuelle quand un effet s'arrête ; le noir par cible qui ferme la fenêtre d'un moniteur mais laisse
le Hub prêt ; le rattachement d'un favori à un **personnage joueur**, qui le rend privé à sa
tablette.

**Une qualité du code que les guides taisaient** : le noir demandé à la main **efface aussi le
décor mis de côté** — sans quoi une image éteinte ressusciterait à la fin de la prochaine fiche,
des heures plus tard, *un fantôme que personne ne rattacherait à son geste.*

#### 12o · Lot 9 — les petits outils, et la fin de la voie A (2026-09-04)

*Cinq guides, et le dernier lot. Quatre d'entre eux se sont révélés exacts — les seuls de toute la
revue à passer sans correction de fond. Tout était dans la télécommande, **qui a aussi corrigé une
trouvaille que j'avais mal formulée**.*

| # | Trouvaille | Ce qu'on en fait | Où |
| --- | --- | --- | --- |
| ⛔ **R1** | **La télécommande a sept panneaux, le guide en décrivait cinq** — et il manquait **celui qui s'ouvre en premier**. Absents : **Pads** (l'onglet par défaut) et **Tableau** (dessiner depuis le téléphone, relayé vers Whiteboard-OS). | ✅ **Écrits.** | `RemoteControl.tsx:27-37` |
| ⛔ **R2** | ⭐ **Correction d'une trouvaille de ce même jour (A1).** J'avais écrit « le pad d'ambiance de la télécommande charge le silence » : le constat était juste — `loadTheme` ne joue rien — mais **le geste décrit n'existe pas**. `universalPads` ne contient que **cinq morceaux de musique** et **douze images favorites** ; aucune ambiance n'y est envoyée, et `RemoteControl` est le **seul** émetteur de `remote:pad:trigger`. La branche ambiance de `sceneActions` est donc **inatteignable**. | **À trancher** : envoyer les thèmes dans `universalPads` **et** les faire jouer (~15 lignes, deux fichiers), ou retirer la branche morte. *Le chemin réel pour une ambiance à distance est l'onglet **Scénario**.* Le guide d'Ambient-OS et le § 12e sont corrigés. | `useNexusSynchronizer.ts:223-233` |
| **R3** | **Le QR code de la télécommande porte un jeton d'appairage** (`#token=…`). Recopier l'adresse sans ce fragment ne suffit pas — et le guide ne le disait pas. | ✅ **Écrit.** | `GlobalSettingsModal.tsx:91` |
| **R4** | **Ce que la grille de pads contient réellement** : cinq morceaux au plus, douze images favorites au plus, et rien d'autre. Ni bruitages, ni cartes, ni ambiances. | ✅ **Écrit.** | idem |
| **C1b** | **Le deck d'indices vit dans le panneau de séance**, pas dans le cockpit comme l'annonçait le guide. | ✅ **Corrigé.** | `SessionWorkspace.tsx:187` |
| **S1** | **La recherche rapide s'ouvre déjà pleine** : sans rien taper, elle liste **les destinations** — tous les modules. C'est son usage le plus fréquent, et il n'était pas écrit. | ✅ **Écrit.** | `useSpotlight.ts:96-124` |
| **W1** | **« Clear » et « Réinitialiser » de Web-OS ne font pas la même chose** — l'un vide, l'autre restaure les liens d'origine —, et aucun des deux ne se défait. | ✅ **Précisé.** | `useWebStore.ts:89, 120` |

**Vérifié et exact, sans une correction** : `Clues`, `Whiteboard-OS`, `Web-OS` et
`Universal_Search` — les cinq outils du tableau, l'export vers Media Hub + wiki + journal, le
`CTRL/CMD + K`, l'export et l'import JSON des liens, l'ouverture des liens dans le navigateur par
défaut, la double temporalité des indices, la traçabilité au journal à la révélation.

**Un lien tissé au passage** : le tableau se dessine aussi **depuis la télécommande**, ce
qu'aucun des deux guides ne disait.

---

### ⭐ La voie A est terminée

**38 guides passés en une journée**, du § 12a au § 12o. Un archivé. **Cent deux trouvailles**, dont
**soixante-trois réparées**.

*Ce que la revue aura appris, en une phrase : **écrire ce qu'un module fait vraiment est le
meilleur détecteur de défauts employé sur ce dépôt** — et le seul qui trouve ceux qu'aucune
relecture de code ne voit, parce qu'ils ne se manifestent qu'en confrontant une promesse à son
implémentation.*

**Les trois familles qui reviennent :**

1. **Ce qui part chez les joueurs n'est pas ce que le guide annonce** — jauges publiques, pions
   déplaçables, projection des dés sur les tablettes.
2. **Des tableaux de correspondances purement inventés** — statuts de dégâts, couleurs de jauges,
   moteurs d'IA, feux tricolores de portabilité.
3. ⛔ **Des affirmations de sécurité sans objet** — trois fois : le backup GitHub du guide général,
   Map-OS hors sauvegarde, et la pastille « Vault Synced » de Favorite-OS. *Sur un dépôt qui a
   perdu ses campagnes deux fois, c'est la famille à chercher en premier.*

**Reste la voie B** : les défauts trouvés et non réparés, au § 12 et dans le plan.

### 13 · ✅ Les six P1 de la revue, réparés (2026-09-04)

*Le rang P1 de la voie B : ce qui peut détruire ou laisser perdre du travail. Les six sont faits le
soir même de la revue.*

| # | Ce qui était | Ce qui est | Où |
| --- | --- | --- | --- |
| ⛔ **N1** | Importer une campagne **remplaçait toute la bibliothèque d'ambiances de Sound-OS**. Des heures de pads effacées sans un mot, par le geste qu'on fait en recevant le fichier d'un ami. | **`fusionnerParIdentifiant`**, appliquée aux ambiances **et** aux playlists. *Le bon code était déjà là deux lignes plus bas ; il n'y avait qu'à le partager.* Règle : ce qui porte le même identifiant est remplacé, ce qui est nouveau s'ajoute, **ce qui n'est pas dans l'archive reste**. Une archive vide n'écrase rien. | `NexusService.ts` |
| ⛔ **N2** | **La trame n'était pas exportée.** Une campagne emportée ailleurs arrivait sans son plan narratif — tout le travail de la Forge de campagne restait sur la machine d'origine. | `actes` et `scenes` dans le type, la récolte et l'injection. ⚠️ **Facultatifs** : une archive d'avant aujourd'hui n'a pas de trame, et `undefined` ne doit pas effacer celle de la campagne cible. ⭐ **Le clonage refait les liens** — les scènes de la copie pointent les actes de la copie, sinon deux campagnes se partageraient une trame. | `nexus.types.ts`, `NexusService.ts` |
| ⛔ **N3** | **Les paquets de cartes étaient mis dans l'archive et jamais reposés.** Deck-OS repartait vide, et on payait le poids sans le bénéfice. | Manifestes remplacés par identifiant ; états de session **fusionnés** — ils couvrent toutes les campagnes, et écraser le dictionnaire perdrait ceux des autres. | `NexusService.ts` (`injectState`) |
| ⛔ **N4** | **Le pilote personnalisé aussi**, et son gabarit. Une campagne bâtie sur un jeu forgé arrivait en désignant un `system` absent, sans un mot. | ⚠️ **On AJOUTE, on ne remplace jamais** : un pilote du même identifiant est le travail du meneur d'ici. *L'import d'une campagne n'a pas à devenir un outil de destruction de système* — le résolveur de conflits existe, et il ne vaut que pour les bundles de pilote. | idem |
| ⛔ **M1** | **Map-OS n'était dans aucune sauvegarde.** | Les **configurations de carte** et les **modèles de zones de danger** y entrent : c'est le travail de préparation, celui qui ne se refait pas. **Pas** l'état courant du plateau — pions posés, calques, cadrage : *ils décrivent une séance, pas un univers*, et ce qui mérite de durer se range en configuration. **Confirmé par David le 2026-09-05.** | `SessionService.ts`, `schemas.ts` |

⛔ **Correction du 2026-09-05 : j'ai écrit ici que « le brouillard reste ouvert ». C'est faux.** Le
brouillard de guerre est **miroité depuis le 2026-08-29, aller et retour** — `refletterLeBrouillard`
et `restaurerLeBrouillard` dans `MiroirDesMedias.ts`, appelés par `SessionBackupManager`. Je l'ai
annoncé comme un reste en réparant M1, **sans vérifier ce que le miroir couvrait déjà** : exactement
ce que la règle en tête de ce registre interdit, dans le document qui la porte.

**Ce qui est donc réellement sauvegardé d'une carte**, vérifié dans le code le 2026-09-05 :

| Quoi | Par quel chemin |
| --- | --- |
| Les cartes de l'**Atlas** | `lesDonneesDeLaSession` |
| Les **images** | miroir des médias (29/08) |
| Le **brouillard** | miroir des médias (29/08) |
| **Configurations de carte** et modèles de zones | `construireLaSauvegarde` (04/09) |

⭐ **Et une configuration contient le plateau entier** — pions, zones, effets magiques, météo,
grille et sa couleur, brouillard, zoom, heure du jour. *Une carte rangée en configuration est donc
sauvegardée complètement ; seul le plateau qu'on est en train de monter reste dehors.*
| ⛔ **G1** | **Favorite-OS non plus** — et son guide affirmait qu'une pastille verte « confirme que vos données sont en sécurité ». | Les dossiers de favoris entrent dans la sauvegarde, aller et retour. | idem |

**Le piège évité, et il était écrit dans le code** : `modules` de `schemas.ts` n'est **pas**
`.passthrough()`. Sans déclarer `map` et `favorite` dans le schéma Zod, les clés auraient été
**écrites puis jetées à la relecture** — la sauvegarde aurait paru complète et se serait révélée
amputée le jour où l'on en a besoin. C'est le défaut exact que Music-OS a payé le 2026-08-30, et le
commentaire laissé ce jour-là l'a évité aujourd'hui.

**La prudence commune aux six** : *une liste vide ne remplace jamais une liste pleine.* Une
sauvegarde antérieure à aujourd'hui n'a aucune de ces clés, et le `?.length` l'écarte.

**Vérifié** : `tsc -b` propre, **8 tests neufs** (`completudeDuBundle.test.ts`,
`fusionParIdentifiant.test.ts`), `npm run validate` vert — 3 515 tests.

**Ce qui reste de la voie B** : les rangs P2 à P4, dont ⛔ **M3**, le seul qui demande l'écran de
David — *projeter, charger une carte jamais explorée, regarder la tablette.*

### 14 · ✅ Les deux P2, réparés (2026-09-04)

| # | Ce qui était | Ce qui est | Où |
| --- | --- | --- | --- |
| ⛔ **M3** | **Changer de carte en cours de projection laissait aux joueurs le brouillard de la précédente.** `syncToPlayers` ne poussait `projectedFogDataUrl` **que s'il y en avait un** — donc au chargement d'un plan jamais exploré, la valeur d'avant restait : des trous révélés au mauvais endroit, sur une carte qu'ils n'ont pas encore vue. | La garde tombe : le brouillard part **toujours**, `null` compris. *La garde protégeait la mauvaise chose* — elle évitait d'écrire `null`, alors que `null` est précisément ce qu'il faut dire. **Le repli des deux toiles était déjà le noir complet ; c'est le chemin qui n'y menait pas.** 3 tests. | `useMapStore.ts` (`syncToPlayers`) |
| ⛔ **A1** | **Aucun thème d'ambiance n'arrivait sur la télécommande**, et le code qui savait en lancer un était donc **inatteignable**. Le guide promettait depuis des mois un geste qui n'existait pas. | **Les deux moitiés construites**, sur décision de David : jusqu'à huit thèmes dans la grille de pads (univers en sous-titre — deux jeux peuvent avoir leur « Taverne »), et `lancerLeTheme` qui **charge puis démarre**. ⚠️ Ne démarre que les pistes qui ont **un fichier et un volume** : une piste à zéro fait partie du thème sans faire partie du moment. 5 tests. | `useNexusSynchronizer.ts`, `useAmbientStore.ts`, `sceneActions.ts` |

**Ce que A1 laisse en place, et c'est voulu** : `loadTheme` continue de charger **sans jouer**.
C'est le geste juste à l'écran — on charge, on règle, on démarre — et c'est un pad de télécommande
qui n'a pas de second geste. Les deux coexistent désormais au lieu que l'un serve pour les deux.

**Vérifié** : `tsc -b` propre, 8 tests neufs, `npm run validate` vert — 3 523 tests.

**Ce qui reste de la voie B** : les rangs P3 (l'écran dit autre chose que ce qu'il fait, et les
trois décisions de table) et P4 (le ménage).

### 15 · ✅ Les quatorze P3, réparés (2026-09-04)

Le rang P3 était *« l'écran dit autre chose que ce qu'il fait »*. Dix points étaient clairs ;
quatre demandaient un arbitrage, **et David a tranché les quatre le même soir**.

#### Ce qui ne demandait qu'un mot juste

| # | Ce qui était | Ce qui est |
| --- | --- | --- |
| **M2** | Le pied du panneau des calques annonçait « réglages sauvegardés **par carte** » ; `layerVisibility` est un objet unique et global. | « Ces réglages valent pour toutes les cartes ». *On corrige la phrase, pas le fait : ranger les calques par carte aurait été un autre chantier, et rien ne dit qu'on le veut.* |
| **N7** | Le badge « Nexus-Ready » compte des références non-`http` : il dit *« cette campagne a des fichiers »*, pas *« elle est portable »*. | « *n* médias », avec l'infobulle qui dit ce qui est compté. |
| **O3** | « Sync Oracle » pousse la note dans un **carnet NotebookLM** ; elle n'entre pas dans ce que l'Oracle lit. | « Envoyer au carnet » / « Envoyée », et le paragraphe réécrit. |
| **O4** | La ligne « Oracle » du diagnostic IA teste le pont NotebookLM. *Un contrôle mal nommé est pire qu'un contrôle absent.* | « Pont NotebookLM (Forge de campagne) ». |
| **K1** | Le bouton « Sensors » / « Muted » du Cortex laissait croire qu'il coupait l'analyse. | « Sons & Lum. » / « Muet », et l'infobulle dit que **l'analyse et les conseils continuent**. |
| **A2** | Les trois thèmes d'ambiance livrés portent huit pistes nommées et **aucun fichier son**. | Le libellé dit « — gabarit, sans sons ». Une `<option>` native n'accepte pas de pastille : le mot vient dans le nom. Le calcul vaut aussi pour les thèmes du meneur. |

#### Ce qui était un vrai défaut de comportement

| # | Ce qui était | Ce qui est | Où |
| --- | --- | --- | --- |
| ⛔ **A4** | **Couper le son repartait à 100 %.** Le bouton basculait entre 0 et **1** : une table réglée à 40 % prenait un mur de son au retour d'un aparté — exactement le moment où l'on venait de demander le silence. | Le niveau d'avant est retenu et rendu. *Une coupure qui ne se défait pas à l'identique n'est pas une coupure, c'est un réglage.* ⚠️ Un curseur déjà à zéro au moment du clic remonte à plein, sans quoi la coupure serait irréversible. 4 tests. | `useAudioMasterStore.ts`, `MasterAudioController.tsx` |
| ⛔ **A7** | **La reprise lumineuse suivait le numéro de piste.** Le code prenait le dernier élément d'un tableau ordonné par index : arrêter une piste rendait la lumière de celle **au numéro le plus élevé**, pas de celle qu'on venait d'allumer. En séance, la salle repassait à une ambiance quittée dix minutes plus tôt. | `allumeeLe` porte l'instant et décide. Une piste allumée avant ce champ n'en a pas : elle passe derrière, ce qui est le bon ordre — elle est forcément plus ancienne. 4 tests. | `useAmbientStore.ts` (`handleLightReversion`) |
| ⛔ **D4** | **La couleur d'une jauge n'était presque jamais appliquée.** Seul le style `bar` la lisait ; `segmented` et `neon` peignaient `bg-primary` quoi qu'il arrive. **Et l'exemple que la Forge produit elle-même** combine `segmented` et un héxadécimal — les deux conditions du cas ignoré. | Les trois styles lisent `color`, en classe Tailwind comme en héxadécimal, et le chiffre suit. *Une couleur qu'on choisit sans qu'elle s'applique est pire qu'une couleur qu'on ne peut pas choisir.* | `CombatCard.tsx` |
| **G8** | `clearAll` d'Image-OS était du code mort dont la confirmation mentait : elle annonçait la perte des dossiers et des projections alors qu'elle ne vidait que `mediaList`. | Retiré. Le chemin survivant est `reset`, qui fait bien ce que la confirmation annonce — elle était juste branchée sur la mauvaise action. | `useImageStore.ts` |

#### Les quatre arbitrages, tranchés par David

| # | Ce que David a choisi | Ce qui est fait |
| --- | --- | --- |
| **V3** | **Neuronal par défaut, et le dire à l'écran.** | Le défaut était `navigateur` — c'est-à-dire, d'après notre propre page de dépannage, *le premier suspect* des fins de phrase coupées. Un meneur qui n'avait rien touché avait le réglage que le dépannage accuse. ⚠️ RNNoise coûte 10 ms et **force le contexte à 48 kHz**. Et l'explication des trois modes, qui vivait en infobulle, s'écrit désormais sous le sélecteur : *une infobulle ne se lit que par quelqu'un qui soupçonne déjà*. |
| **T5** | **Le bouton de projection des dés devient permanent.** | Il vivait en `opacity-0 group-hover/result:opacity-100` : il fallait savoir qu'il existait pour aller le survoler. *Même famille que le repli du 23/08.* La condition sur l'historique reste — sans jet, il n'y a rien à projeter. |
| **V2** | **Ajouter à la liste des voix ceux qui ONT déjà un profil.** | On ne lisait que le mémo de NPC-OS — le module qui porte *un* PNJ — quand la galerie en porte plus de cent, et que ce sont eux qui peuvent avoir un profil. La liste ne grossit que du travail déjà fait, **et la campagne active fait le tri**. |
| **F3** | **Mémoriser le tirage par champ.** | `roll()` appelait `Math.random()` à chaque évaluation : taper dans un champ relançait les dés de tous les autres. *Un total qui bouge tout seul n'est pas un calcul, c'est un bruit.* La clé est `<fiche>:<champ>|<formule>` — changer la formule invalide le tirage, ce qui est juste. Un appel **sans nom de champ lance vraiment** : le comportement d'origine est intact pour tout le reste du code. 9 tests. |

**Ce que ce rang a coûté en leçons.** Trois défauts sur quatorze étaient *un chemin qui s'arrête
avant le moteur* — D4 (le style ignore la couleur), A7 (le bon tableau, mal trié), A4 (la bonne
bascule, la mauvaise valeur). C'est le motif que le pupitre de dés a déjà payé six fois. **Et six
autres n'étaient qu'un mot** : un bouton, un badge, une ligne de diagnostic, un libellé qui
nommaient autre chose que ce qu'ils font. *Écrire ce qu'un module fait reste le meilleur détecteur
de défaut employé sur ce dépôt.*

**Vérifié** : `tsc -b` propre, 17 tests neufs, **3 540 tests au vert**.

**Ce qui reste de la voie B** : les **trois décisions de table** (P3 bis) et le **ménage** (P4).

### 16 · ✅ P3 bis — les trois décisions de table, tranchées (2026-09-04)

Ce n'étaient pas des défauts : le code faisait ce pour quoi il avait été écrit. Ce sont des choix de
maîtrise, et ils appartenaient à David. **Deux ont donné du code, un s'est clos par un refus.**

| # | La question | La décision | Ce qui est fait |
| --- | --- | --- | --- |
| ⭐ **C1** | Les jauges de tension étaient **publiques, tout ou rien** : `isClockProjected` valait `true` au démarrage et **trois** écrans le lisaient. Cacher une seule jauge obligeait à cacher l'horloge entière. | **Un drapeau par jauge, et une jauge neuve naît secrète.** | `vueParLesJoueurs`, un œil dans le tableau de bord, et **LE filtre `jaugesVuesParLesJoueurs`** branché sur les **quatre** chemins vers un écran de joueur. 8 tests. |
| ⚠️ **N5** | L'archive emportait les **PNJ d'autres campagnes** liés par une relation sociale — voulu, pour que le réseau reste lisible — mais **entiers**, `gmSecretInfo` compris. | **Caviarder les notes de MJ.** | Le nom, le portrait, le rôle et les relations partent ; les deux champs de texte libre du meneur sont vidés. **Uniquement les pièces rapportées** — les PNJ de la campagne exportée partent complets. 3 tests. |
| **M4** | **N'importe quel joueur déplace n'importe quel pion** sur l'écran projeté, y compris les adversaires du meneur. | **Laisser ouvert.** | Rien à coder. La confiance de table fait le travail, et déplacer le pion d'un absent dépanne plus souvent qu'il ne gêne. **Le guide le dit désormais comme un choix, pas comme un oubli.** |

**Ce que C1 a demandé, et qui ne se devinait pas.** Il y a **quatre** chemins vers un écran de
joueur — le Player Hub, les tablettes, le segment `clock` de la télécommande, et l'afficheur de
table. *Un caviardage qui vit dans trois copies est un caviardage qui sera oublié dans la
quatrième* : d'où une seule fonction exportée, et le filtre posé **à la source, avant l'émission**.
Une jauge secrète ne quitte pas la machine du meneur — ce qui n'est pas parti ne peut pas être lu.
C'est la règle que l'Ulanzi avait déjà payée le 30/08.

**Et une décision de compatibilité, dans les deux chantiers.** `vueParLesJoueurs` **absent** veut
dire « vue », comme avant ce champ : les jauges d'hier n'ont pas bougé d'un pixel sur les écrans des
joueurs. C'est la création qui écrit `false`. *Le même motif que `surLAfficheur` le 31/08 — l'anneau
absent, la migration évitée.*

**Vérifié** : `tsc -b` propre, 11 tests neufs, `npm run validate` vert.

**Ce qui reste de la voie B** : **P4**, le ménage.


### 17 · ✅ P4, le ménage — la voie B est close (2026-09-05)

Le dernier rang. *Et la vérification a trouvé deux points **pires** que ce que le § 12 en disait* —
c'est la troisième fois que réécrire un constat en révèle un plus grand.

| # | Ce qui était | Ce qui est |
| --- | --- | --- |
| ⭐ **M5** | **La couleur de grille n'existait dans aucun écran** ; la grille était blanche pour tout le monde. Or `gridColor` était lu par les deux toiles, voyageait dans les presets et jusqu'à l'écran des joueurs. | **Un sélecteur, et un lien pour revenir au blanc.** *Toute la chaîne était là sauf le bouton au bout.* Le blanc reste le défaut : rien ne change sur les cartes d'aujourd'hui. |
| ⭐ **A10** | **Le rapport de tamisage valait toujours 0,1** et rien ne permettait d'y toucher — très bas pour un aparté, beaucoup trop haut pour une révélation. Les trois moteurs lisaient pourtant la valeur. | **Un curseur, 5 % à 60 %, qui n'apparaît que quand le Focus est allumé** : c'est le seul moment où il veut dire quelque chose. Même diagnostic que M5, à un module près. |
| ⛔ **C4** | **`timeMultiplier` n'était lu par PERSONNE.** Le § 12d disait « il vaut donc toujours 1 », ce qui laissait croire que la chaîne existait. Elle n'existe pas : aucune boucle ne fait avancer l'horloge fantastique. | **Retiré.** *L'exposer aurait demandé d'écrire l'accélération du temps — une fonction, pas du ménage.* La distinction avec M5 et A10 n'apparaît qu'en ouvrant le code. |
| ⭐ **C3** | **`ChimeEngine` — cinq harmoniques, quatre secondes — était écrit en entier et n'avait aucun appelant.** Aucune sonnerie n'existait nulle part dans GM-OS. | **Branchée à zéro, avec son interrupteur** (choix de David). Elle sonne depuis `useBattementDuMinuteur` et **jamais depuis `tickTimer`** : *un `set` de Zustand est un calcul d'état, y glisser un son en ferait un effet de bord que chaque test déclencherait.* 7 tests. |
| **A10 bis** | **`useAudioMasterStore.getBackupData()` n'avait aucun appelant** : le bandeau audio n'était dans aucune sauvegarde. | **Retiré, et non branché.** *Le volume général, le Focus et le tamisage décrivent une pièce, pas un univers* — exactement la raison pour laquelle Music-OS ne sauvegarde que ses playlists, tranchée le 30/08. Ils restent persistés localement, ce qui est le bon niveau. |
| **N6** | `includeAssets` était lu mais **aucun écran ne le passait** ; `includeSounds` était déclaré, documenté, et **lu nulle part**. | **Une case « archive légère »** dans le panneau de campagne, et `includeSounds` retiré. *Une option qui n'a jamais rien commandé est pire qu'une option absente : elle promet un réglage.* Le choix ne se retient pas d'une fois sur l'autre — une case restée cochée produirait un jour une archive vide qu'on croit complète. |
| **N8** | **Toutes les ambiances et playlists partent**, campagne ou pas. | **Laissé large, et la raison écrite.** Elle n'existait pas quand ce code a été rédigé : depuis le 04/09, **l'import fusionne au lieu de remplacer**. Une bibliothèque large ne détruit plus celle du destinataire. *Le danger est fermé ; reste de l'encombrement, ce qui n'est pas la même chose.* |
| **M6** | Les effets magiques ne sont pas persistés — probablement voulu, mais rien ne le disait. | **L'intention écrite dans `partialize`.** Rouvrir une partie sous la boule de feu de la semaine dernière n'aurait aucun sens, et un effet permanent se range dans un preset de carte. *Une omission qui a l'air d'un oubli finit par être « corrigée » par quelqu'un.* |
| ⭐ **H8** | **Le Media Hub ne prenait qu'un fichier** — `files?.[0]` — alors que le sélecteur en aurait accepté autant qu'on veut. | **`multiple`, et la boucle extraite dans `importerPlusieursMedias`** : *une logique cachée dans un composant n'est couverte par rien*, la leçon de `horlogesPourLaTable`. Deux règles épinglées — la question du doublon se pose **par fichier**, et **un échec n'arrête pas les suivants**. En série et non en parallèle : trente écritures IndexedDB lancées ensemble sont la course déjà payée ici. 8 tests. |
| **A3 · A5 · A6 · A8** | Documentés dans les guides. | **Rien à coder** — confirmé. |

**Ce que ce rang a appris, et qui vaut au-delà.** *« Réglage déclaré, jamais offert » n'est pas un
diagnostic* — c'en est trois. M5 et A10 avaient toute leur chaîne et il manquait un bouton ; C4
n'avait **que** son nom. Les ranger ensemble au § 12 était juste comme relevé et faux comme plan :
deux se livrent en un après-midi, le troisième était un chantier déguisé. **On ne le voit qu'en
ouvrant le code, jamais en relisant la liste.**

Et une leçon de plus sur les effets de bord : la cloche **ne sonne pas dans le réducteur**. Le
réflexe était d'appeler `playChime()` dans `tickTimer`, là où le zéro se produit. *Un `set` de
Zustand est un calcul d'état* — chaque test du minuteur aurait fait sonner une cloche.

**Vérifié** : `tsc -b` propre, 15 tests neufs, `npm run validate` vert, **3 566 tests**.

⭐ **La voie B est close.** Les cent deux trouvailles de la revue sont traitées : réparées, tranchées,
ou documentées avec leur raison.

### 18 · ⭐ La télécommande, refaite et réparée (2026-09-05)

Demande de David, une fois la revue close : *optimiser la tablette GM Control Remote, en forme et
en contenu, et l'espace qu'elle occupe.* La refonte a produit une amélioration mesurable — et,
comme d'habitude, **c'est en écrivant ce qu'elle fait qu'on a trouvé ce qui ne marchait pas.**

#### Le châssis — 35 % de la hauteur rendus au contenu

| | Avant | Après |
| --- | --- | --- |
| En-tête | **104 px** pour un titre qu'on connaît et un point de connexion | supprimé, remplacé par une ligne d'état de 48 px |
| Bas de page | **128 px** réservés à une barre flottante | 0 — la navigation est passée à gauche |
| Marges | `md:p-10`, soit 80 px en largeur | `p-3` |
| **Total du châssis** | **272 px sur 768** | **~60 px** |

**Pourquoi la colonne à gauche.** David tient la tablette **en paysage** : une colonne ne coûte
alors *aucun* pixel vertical, et la largeur qu'elle prend était de toute façon perdue par la barre
flottante — qui occupait 976 px pour 336 px de boutons, **les deux tiers en vide**.

⭐ **Et c'est elle qui a permis d'écrire les libellés.** Les sept onglets étaient des icônes nues
dont les noms vivaient dans `title` — *c'est-à-dire nulle part sur un écran tactile, où l'on ne
survole rien.* **C'est le défaut du 23/08 — « trois points ne disent rien de ce qu'ils cachent » —
appliqué aux sept portes de l'application.**

Sous 900 px la colonne redevient une barre en bas. *Ce n'est pas une seconde conception : c'est le
filet qui évite qu'améliorer le paysage casse le téléphone qui marchait.*

#### Quatre défauts muets, tous en amont de l'écran

| # | Ce qui était | Ce qui est |
| --- | --- | --- |
| ⛔ **Le tableau blanc** | **Le meneur envoyait QUATRE des sept champs déclarés.** `currentTool`, `currentColor` et `currentWidth` n'arrivaient jamais et restaient à leur valeur de départ — et le canevas les recopie dans **chaque tracé qu'il émet**. *Tout ce qui était dessiné depuis une tablette partait en crayon blanc d'épaisseur 3, et **la gomme dessinait au lieu d'effacer**.* Rien ne le signalait : sur fond sombre, un trait blanc ressemble à un trait voulu. | **`segmentDuTableau`, typé.** Voir ci-dessous — c'est la leçon du jour. |
| ⛔ **`pad.isActive`** | Déclaré dans le type, dessiné par la tablette, et **jamais posé par personne** : l'anneau d'activité n'a pu s'allumer sur aucun pad depuis qu'il est écrit. | Les deux platines de Music-OS, le thème chargé d'Ambient-OS et les projections d'Image-OS détiennent la réponse. Au passage **Ambient-OS ne retenait pas quel thème il avait chargé** — il versait les pistes et oubliait d'où elles venaient (`themeChargeId`). |
| ⛔ **Ce qui joue** | Le flux portait ce qu'on peut **déclencher** et jamais ce qui est **en cours**. Il fallait changer d'onglet — ou regarder l'écran du PC, c'est-à-dire cesser de se servir de la télécommande. | Une **ligne d'état permanente** : morceau, ambiance, round, minuteur. *Ce qui n'a rien à dire disparaît au lieu d'afficher un tiret — un bandeau plein de tirets apprend au regard à ne plus s'y arrêter.* |
| ⛔ **Les plafonds** | 5 morceaux, 8 ambiances, 12 images — et la grille tronquait **en silence**. Trente favoris en donnaient douze sans un mot. | Elle écrit « 12 sur 30 ». *Une liste tronquée sans le dire se lit comme une liste complète, et on cherche longtemps ce qui n'y est pas.* |

#### ⭐ La leçon : le remède était un type, pas un test

Le segment du tableau vivait dans un **littéral anonyme** au milieu d'un crochet de 550 lignes, et
*un littéral anonyme n'oblige à rien.* La réparation n'est donc pas d'ajouter les trois champs — ça,
c'est le symptôme — mais d'extraire `segmentDuTableau`, qui **promet `RemoteSyncData['whiteboard']`
en type de retour** : retirer un champ ne compile plus. **Vérifié en dégradant le code — `TS2741`.**

C'est mot pour mot l'asymétrie que l'en-tête de `remote.types.ts` décrit déjà pour
`RemoteCombatant`, **trois champs plus haut dans le même fichier** : *une divergence entre celui qui
écrit et celui qui lit est indétectable par construction tant qu'ils ne partagent pas le type.* La
règle était écrite, au bon endroit, et le défaut vivait juste en dessous.

#### Deux actions déclarées que personne n'offrait, et une classe qui n'existe pas

- **`whiteboard:set-width`** avait son handler et son contrôle dans `registry.test.ts` — et **aucun
  émetteur**. La tablette dessinait à l'épaisseur que le meneur avait laissée.
- **`whiteboard:set-background`** n'avait **ni émetteur ni destinataire** : morte de bout en bout.
- ⛔ **`scrollbar-hide`, écrite cinq fois, ne produisait aucune règle** — le greffon n'est pas
  installé. **Même famille que les 125 `animate-in` du 03/09** : *une classe qui n'existe pas ne
  prévient pas.* Remplacée par `no-scrollbar`, définie dans `index.css`.

#### Et la même rustine, posée des deux côtés

`RemoteDrawingCanvas` est **une copie de `whiteboard/components/DrawingCanvas.tsx` qui n'avait jamais
reçu le correctif de l'original** : `window.resize` au lieu d'un `ResizeObserver`, un effet dont la
dépendance était `redraw` — donc remonté **à chaque mouvement du doigt** —, et `canvas.width`
réassigné sans condition, ce qui **vide le canevas et réinitialise le contexte 2D**. Tout le tableau
était repeint une vingtaine de fois par seconde pendant un trait.

*« Qui d'autre a la même rustine à poser ? »* — la question du 2026-09-03, restée sans réponse ici
pendant deux jours. Elle a resservi une seconde fois dans la même séance : le défaut de lint
`redrawRef.current` écrit en phase de rendu existait **aussi** dans la copie du meneur, et les deux
ont été corrigés ensemble.

**Vérifié** : `tsc -b` propre, lint sans régression, **40 tests neufs**, `npm run validate` vert —
**3 606 tests**.

**Ce qui reste à voir à l'écran**, et que rien ici ne peut trancher : que la gomme efface bien depuis
la tablette, la largeur de la colonne (`w-32`, calée sur « Scénario »), la densité des vignettes à un
mètre, et le seuil de 900 px sur la vraie tablette.

### 19 · ⭐ La soirée de la tablette — quatre retours de séance (2026-09-05)

David a joué avec la télécommande refaite le matin même. Quatre retours, et **trois d'entre eux ont
révélé un destinataire sans expéditeur, ou l'inverse.**

| # | Le retour de David | Ce qu'il y avait derrière |
| --- | --- | --- |
| ⛔ **Couper le son** | *« le bouton tout couper ne coupe pas la musique et ambiant »* | Le handler n'appelait que `stopAllPads()` : **Sound-OS et rien d'autre**. Le bouton s'appelait « STOP ALL SOUNDS » et **je l'avais renommé « Tout couper » la veille sans vérifier ce qu'il coupait** — *un nom plus large que le geste est une promesse qu'on tient seulement par hasard.* Il coupe les trois sources, et s'appelle « Couper le son ». Images et lumières restent, tranché par David. |
| ⛔ **Le résultat des dés** | *« je voudrais voir le résultat sur la tablette »* | L'écran de résultat existait — **cent vingt-cinq lignes** — et n'avait jamais pu s'afficher : il guettait un `dice:result` que **personne n'émet**. Le dernier jet circulait pourtant dans le segment `dice` depuis toujours, non déclaré. *Un destinataire sans expéditeur ne lève aucune erreur : il attend.* |
| ⭐ **Les notes** | *« la trame, les scènes prévues, l'accès au wiki »* | Rien de tout cela n'arrivait à la tablette. Cinq vues au lieu de deux champs de texte, puis six avec le coffre. `segmentDeLecture`, **typée en retour**. |
| ⛔ **Les Chroniques** | *« je n'ai plus, quand une session est en cours, l'accès à la chronologie et au wiki »* | Voir le § 18 bis ci-dessous — le plus instructif des quatre. |

#### La messagerie et le coffre — et deux trous de sécurité trouvés en chemin

| # | Ce qui était | Ce qui est |
| --- | --- | --- |
| **Messagerie** | Le mécanisme existait **entièrement** côté meneur ; le fil n'était pas dans le flux et aucune action n'en émettait. | Un huitième onglet, et **le compte des non-lus dans la ligne d'état** — *une messagerie qu'il faut penser à aller voir n'est pas une messagerie, c'est une boîte aux lettres.* ⚠️ **Le piège évité** : `session:send-message` existe et n'aurait rien fait de bon — son handler **inscrit sans rediffuser**. Un message parti de la tablette serait apparu dans le fil du cockpit **sans jamais atteindre le joueur**. |
| **Coffre Obsidian** | Lisible par Electron **sur le PC** ; la tablette n'y avait aucun accès. Plus de deux mille notes, et la diffusion part deux fois par seconde. | **Question/réponse hors du flux** : l'arborescence à l'ouverture, le contenu à l'ouverture d'une note. |
| 🔒 **Le pont avalait le rôle** | `SyncServer.broadcastAction` accepte un **rôle destinataire** depuis toujours — et `broadcastUIAction` ne le transmettait pas. **Tout partait à tout le monde.** | Corrigé. Sans cela, le carnet privé du meneur se serait déposé sur l'appareil de chaque joueur. *C'est la règle de `mainsPourLaTable` : un secret caviardé à l'affichage a déjà voyagé.* |
| 🔒 **Le chemin du coffre** | `startsWith(rootPath)` acceptait un **dossier voisin** — `C:\Coffre-prive` quand le coffre est `C:\Coffre`. | `path.resolve` et le séparateur. *Sans portée tant que le chemin venait de l'écran du meneur ; j'ouvrais ce chemin au réseau.* |

⭐ **La leçon de la soirée, et elle est nette.** Sur quatre retours, **trois étaient un chaînon
manquant entre deux moitiés qui existaient déjà** : l'écran de résultat sans émetteur, la messagerie
sans transport, le classement de vue sans porte. *Rien de tout cela ne lève d'erreur — un
destinataire sans expéditeur attend, et un expéditeur sans destinataire parle dans le vide.* Aucun
type, aucun test unitaire ne les voit ; **c'est en jouant qu'on les trouve.**

**Vérifié** : `tsc -b` propre, lint sans régression, **37 tests neufs**, `npm run validate` vert —
**3 652 tests**.

### 18 bis · ⛔ Une vue autorisée et inatteignable (2026-09-05)

*Séparé du reste parce que le mécanisme se reproduira ailleurs.*

`timeline-wiki` — la chronologie et le wiki — n'avait **qu'une seule porte** : le bouton
« Chroniques » du panneau de campagne. Ce panneau est classé `'preparation'`, et `useLayoutManager`
renvoie au cockpit **toute vue d'atelier dès qu'une séance s'ouvre**. La porte devenait donc
inatteignable en pleine partie, et la colonne du cockpit n'en offrait aucune autre.

**Le classement disait pourtant `'les-deux'`**, avec ce commentaire écrit le 23/08 : *« on les bâtit
le samedi matin et on les consulte le samedi soir »*. **La navigation ne tenait pas ce que le
classement promettait** — on a donc ajouté la porte, pas reclassé la vue.

*Qui d'autre a la même rustine à poser :* les six vues classées des deux côtés ont été vérifiées une
à une. Les cinq autres avaient déjà leur porte.

⭐ **Et une garde, parce qu'aucun type ne peut exprimer cet invariant.**
`portesDuCockpit.test.ts` lit le source du cockpit et exige que chaque vue `'les-deux'` y soit
atteignable. Dégradé pour vérifier : retirer le bouton fait échouer le cas. Il garde **l'existence**
d'une porte, pas qu'elle s'ouvre — un repli ou une condition lui échapperaient, et il le dit.

**La règle générale, à retenir** : *tout ce qui n'a de porte que dans un écran d'atelier devient
hors de portée pendant la partie.*

### 20 · ⛔ Le châssis se démontait au premier chargement de chaque module (2026-09-05)

Trouvé par David : *« quand je vais dans un autre module, l'Ulanzi se reset »*.

Les modules sont chargés en `lazy`. À la **première** ouverture de chacun, le chargement du morceau
suspend le rendu — et le seul `Suspense` au-dessus enveloppait **`Shell` lui-même**. React masquait
donc tout le châssis, ce qui **nettoie les effets** de ses crochets.

| Crochet | Ce que son nettoyage déclenchait |
| --- | --- |
| `useBattementUlanzi` | **rend la main à l'afficheur** — le « reset » signalé |
| `useBattementDuMinuteur` | le compte à rebours cesse de descendre |
| `usePrechauffageDuModele` | le modèle se décharge |
| `useLumiereQuiSuitLaVoix` | la lumière cesse de suivre |

*Un émetteur attaché à une vue émet ce que la vue veut bien* — la leçon du 30/08 avait fait monter
ces crochets dans `Shell`, et une frontière absente les redescendait au rang de la vue sans que rien
ne le dise. **Le défaut ne se produisait qu'au premier passage dans chaque module** : une fois le
morceau en cache, plus rien. De quoi chercher longtemps.

La frontière descend autour du seul module. `frontiereDuChassis.test.ts` lit le source et exige
qu'elle entoure les enfants, et que les crochets permanents soient montés là — il en garde **cinq**
depuis le § 22. ⚠️ Il ne prouve pas qu'ils survivent à l'exécution : monter `Shell` en entier
demanderait de simuler une douzaine de magasins. *Le test le dit en tête plutôt que de laisser
croire à une garde qui n'existe pas.*

**Ancres** : `components/Shell.tsx`, `components/frontiereDuChassis.test.ts`.

### 21 · ⛔ Le Markdown n'interprétait les tableaux nulle part (2026-09-05)

Trouvé par David en lisant le Nexus Wiki : *« il n'interprète pas les tables correctement »*.

`react-markdown` ne connaît que le **CommonMark**, où **les tableaux n'existent pas** — ils viennent
de l'extension GitHub, portée par `remark-gfm`, qui n'était pas installé. `| Nom | Effet |` n'était
donc pas un tableau mais un paragraphe. Muets pour la même raison : le texte barré, les cases à
cocher, les liens sans crochets.

⚠️ **Le défaut était à six endroits** — panneau Obsidian, vue Wiki, livre de règles, atelier de
règles, deux écrans du Hub. *Un réglage qui doit être le même partout et que chaque appelant repose
est un réglage qu'un appelant finira par oublier.* Un composant unique le porte, et une garde
**balaie tout `src/`** pour refuser un septième appel direct : *une garde qui énumère ce qu'elle
surveille ne surveille pas ce qui arrive après elle.*

La tablette, elle, n'interprétait **rien** : coffre et Chroniques en texte brut. *Montrer la source
d'un document au lieu du document est une panne discrète — rien ne manque, tout est illisible.*

**Ancres** : `components/TexteMarkdown.tsx`, `components/markdownEnUnSeulEndroit.test.ts`.

### 22 · ⭐ La vidéo entre dans Image-OS, et YouTube dans Web-OS (2026-09-05)

Demandé par David : *« est-ce qu'on pourrait imaginer lancer une vidéo ? ou une vidéo YouTube ? »*,
puis *« on construit les 2 »*.

**Le projecteur savait déjà jouer une vidéo** — il reniflait le type du fichier chargé. Quatre
verrous l'entouraient : le sélecteur n'acceptait que des images, `ImageMedia` ne disait pas ce qu'il
était, le pad dessinait sa vignette en `background-image` (donc une case vide), et l'élément était
`muted` en dur. *Une capacité qu'on ne peut pas atteindre n'existe pas.*

⛔ **Le son est le vrai sujet, et il ne se branche pas.** La vidéo joue dans la **fenêtre de
projection** ; le bus audio vit dans celle du meneur. On ne branche pas un élément d'une fenêtre sur
le graphe audio d'une autre — il n'y a aucun chemin. Le meneur **calcule** donc le niveau
(`volume général × Focus × ducking × curseur propre`) et le lui **envoie** sur le canal qui porte
déjà les projections. ⚠️ Ce que l'imitation ne rend pas : la vidéo sort par l'appareil de l'écran de
projection, pas par l'enceinte de Music-OS — `setSinkId` se pose sur un contexte, et il n'y en a pas.

⭐ **L'émetteur réémet à chaque changement de projection**, pas seulement quand le niveau change :
une fenêtre qui vient de naître n'a rien reçu et resterait à plein volume pour toujours. *Un
récepteur qui n'a jamais rien reçu ne se distingue pas d'un récepteur en panne.*

**YouTube reste un marque-page** — rien à sauvegarder, rien à emporter dans Nexus, donc pas d'entrée
dans la bibliothèque d'Image-OS. Il voyage vers le projecteur comme `__youtube__<id>`, en suivant la
convention de la carte et du tableau blanc plutôt qu'en ouvrant un second canal. Ses trois limites —
Internet, hors sauvegarde, son hors mixage — étaient dites au clic et dans le guide.

⭐ **Et l'une des trois était fausse, corrigée le soir même.** J'avais annoncé à David que le son
d'un cadre distant était hors d'atteinte. *C'était confondre l'enceinte et le niveau* : la première
reste hors de portée — `setSinkId` n'a aucune prise sur un cadre — mais le second se commande par
`postMessage`, avec `enablejsapi=1`. Le volume d'une vidéo YouTube suit donc la table comme le reste.
⚠️ **Envoi sans accusé de réception** : le lecteur ignore ce qui lui arrive avant d'être prêt, et
rien ne dit quand il l'est sans monter tout l'appareillage d'événements de YouTube — l'ordre est
répété sur deux secondes et demie. *Un ordre répété quatre fois coûte moins qu'une poignée de main
qu'il faut maintenir.* Le cadre naît `mute=1` quand la table est déjà coupée, sans quoi il ferait
entrer un éclat de son qu'on éteindrait une seconde trop tard. Ancre :
`web/pilotageDuLecteurYouTube.ts`.

⛔ **La leçon de méthode.** Huit textes — code, guides, doc technique, registre — affirmaient que ce
son échappait au mixage, et les corriger a demandé un balayage. *Un avertissement qui a cessé d'être
vrai est pire qu'aucun : il apprend à ne pas lire les suivants.*

⛔ **Le Hub, lui, n'affichait rien — trouvé par David le soir même.** Il peignait **toute**
projection en `background-image`, ce qui ne peut pas jouer un film. Et il ne pouvait pas s'en rendre
compte : *les écrans de projection reçoivent un identifiant et vont chercher le fichier — ils ont le
type MIME ; le Hub reçoit une adresse **déjà résolue**, sans extension*, parce qu'une tablette ne
peut pas lire la base du meneur. **Un destinataire qui ne peut pas déduire doit être informé** : le
meneur annonce la nature (`natureDuMedia`), et un fond partagé par les deux hubs choisit l'élément à
dessiner. Le repli est *image* : une image affichée à tort montre une trame figée, une vidéo
affichée à tort ne montre rien.

⭐ **Décision : le son sur le Player Hub, jamais sur les tablettes.** L'écran de la table est unique,
les tablettes sont cinq — *cinq bandes-son décalées par le réseau ne font pas une ambiance.* Et la
carte de projection est supprimée pour une vidéo : le fond la joue déjà en plein écran, une carte
décoderait le même film une seconde fois sur sa propre horloge.

⚠️ **Resté tel quel, et c'est un choix à confirmer** : une vidéo **boucle**, comportement d'origine.
Bon pour une ambiance, discutable pour un plan de film. Un interrupteur par pad serait peu de chose.

✅ **ÉPROUVÉ À L'ÉCRAN le 2026-09-21** — David, après avoir demandé comment projeter de petites
vidéos : *« j'ai testé Image-OS c'est bon »*. ⚠️ **La boucle reste le choix à confirmer** : elle
n'a pas été tranchée, elle a seulement été vécue une fois. *Un essai réussi ne répond pas à une
question qu'on ne lui a pas posée.*

⭐ **Et la sortie se choisit depuis Web-OS**, demandé dans la foulée. Le bouton nommait la cible
réglée **dans Image-OS** sans laisser en changer : *un réglage qui vit dans un module et décide dans
un autre est une action à distance.* Le choix se fait là où le geste se fait — et **il ne déplace pas
la cible d'Image-OS**, sans quoi une vidéo envoyée sur le moniteur 2 y enverrait la prochaine image
du meneur à son insu. Web-OS demande lui-même la liste des écrans : *un module qui affiche une liste
ne compte pas sur la visite d'un autre pour la remplir.*

**Ancres** : `image/logic/gainDeLaVideo.ts`, `image/useSonDeLaVideoProjetee.ts`, `web/youtube.ts`,
`web/ecransDeProjection.ts`,
`web/components/WebLinkPad.tsx`, `image/logic/natureDuMedia.ts`,
`components/hub/FondProjete.tsx`.

### 23 · ⛔ Le ducking pouvait ne jamais se brancher, et se taisait (2026-09-05)

Trouvé en construisant le § 22, corrigé sur demande de David.

`useVoiceStore` importait `ai/modeDeContexte`, qui tire `useSessionOSStore`, d'où l'on atteint les
moteurs de Music-OS et d'Ambient-OS. Or **ces moteurs se construisent au chargement de leur module**
et s'abonnent aussitôt à `useVoiceStore`, par un `import()` différé censé éviter le cycle. Quand la
voix ouvrait le graphe, ils recevaient un module **encore en cours d'évaluation** : le lien était
vide, l'abonnement mourait dans une promesse que personne n'attend.

⭐ **La leçon, qui vaut au-delà de ce cas** : *un cycle d'imports ne casse rien tant que personne
n'entre par le mauvais bout.* Quatre sondes d'une ligne — la séance, `modeDeContexte`, le moteur —
sont **toutes propres** ; seule celle qui entre par la voix échoue. C'est ce qui le rend invisible,
et si facile à rouvrir.

Deux correctifs, et il fallait les deux : **l'arête est coupée** (import différé dans l'action, qui
était déjà asynchrone) et **l'échec ne peut plus être muet** (`abonnementAuDucking` garde l'espace de
noms — un lien ESM est vivant —, relit un tour plus tard, puis crie en nommant le moteur *et* la
conséquence). *Une cause corrigée revient par un autre chemin ; une défaillance qui se dit, non.*

⚠️ **Portée exacte, à ne pas surestimer** : l'échec n'a été **observé qu'en test**. Une note de
mémoire affirmait depuis le 30/08 que *« l'application n'y tombe jamais, son entrée est
`main.tsx` »* — ni prouvé ni infirmé. *Une panne muette ne se prouve pas absente ;* c'est la raison
d'être du second correctif.

⚠️ **Un ajout retiré en route** : appliquer l'état courant au branchement a fait tomber six fichiers
de tests — plusieurs remplacent le magasin de la voix par un substitut partiel, et Music-OS lit
`currentEffects` sans garde. *Un ajout qui n'était pas le correctif ne vaut pas le risque qu'il
introduit.*

**Ancres** : `voice/abonnementAuDucking.ts`, `voice/importsDuMagasinDeVoix.test.ts`,
`voice/useVoiceStore.ts`.

### 24 · ⭐ Projeter un lieu sur un écran (2026-09-06)

Demandé par David : *« je voudrais que tu rajoutes un bouton qui permet de projeter un lieu sur un
écran »*.

L'Atlas savait **envoyer un lieu à Map-OS** — mais c'est autre chose : cela en fait un **plateau
tactique**, avec ses pions, son brouillard et ses mesures. Rien ne permettait simplement de **montrer**
le lieu, comme on montre une illustration depuis Image-OS. *On regarde une ville, on joue sur un
donjon* — deux gestes voisins, deux intentions distinctes, et ils restent donc deux boutons.

⭐ **Le lieu occupe l'écran sous SON identifiant**, jamais sous l'adresse de son image : c'est ce que
lisent les écrans pour savoir ce qui est à l'antenne, et les confondre ferait perdre le lien avec la
fiche — le défaut payé le 31/08 sur les portraits de PNJ. Un test le garde, et il tombe quand on
passe l'image à la place.

Le menu des écrans est **le même qu'à Web-OS**, extrait au moment où un deuxième appelant est apparu
(`MenuDesEcrans`). ⚠️ **Seules les lignes sont partagées, pas leur cadre** : Web-OS les pose sur le
pad — une liste flottante dans une grille de vignettes se fait recouvrir par la suivante — quand
l'Atlas les déroule sous son bouton. *Ce qui diffère est la place, pas le contenu.*

Et l'Atlas **demande lui-même la liste des écrans**, troisième module à en avoir besoin : *un module
qui affiche une liste ne compte pas sur la visite d'un autre pour la remplir.*

**Ancres** : `session/components/AtlasMapDetail.tsx`, `components/MenuDesEcrans.tsx`,
`web/ecransDeProjection.ts`.

### 25 · ⛔ Une fenêtre de projection ne demandait jamais ce qu'elle devait afficher (2026-09-06)

Trouvé par David en essayant le § 24 : *« quand je projette, l'image ne se charge pas »*.

**Le mécanisme, en deux temps.** Une fenêtre de projection qui vient de naître reçoit son image sur
`did-finish-load`, c'est-à-dire **avant que React n'ait attaché son écouteur** : *un message émis
avant que la fenêtre ne sache écouter est perdu, pas en retard.* C'est mot pour mot la leçon du
02/09 sur le titre projeté — qui porte son remède, `requestCurrentTitle`, depuis ce jour-là.

**L'image avait le même trou.** Et le processus principal **répondait déjà** à
`image:request-current-display` : la réponse était écrite, personne ne posait la question. *Un
récepteur sans émetteur ne lève aucune erreur* — troisième fois ce mois-ci.

⚠️ **Ce qui l'a caché des mois durant, et c'est le plus instructif.** Le projecteur retombait sur le
magasin, dont `projections` porte la **marque** — *ce qui occupe l'écran*, pas *où le trouver*. Les
deux **coïncident** pour une image d'Image-OS, dont la marque est son propre chemin. Elles divergent
pour un lieu ou un portrait de PNJ, dont la marque est l'identifiant de la fiche. Le défaut dormait
donc derrière une coïncidence, et **le premier appelant qui ne la respectait pas l'a réveillé** — le
bouton du § 24, écrit le matin même.

*Corollaire : un correctif qui rétablit la coïncidence aurait marché et n'aurait rien réparé.*

**Ancres** : `electron/preload.ts` (`requestCurrentDisplay`), `image/components/ProjectorView.tsx`,
`image/components/demandeDeLEtatCourant.test.ts` — qui garde les **trois maillons** : la réponse, le
pont, et l'appel.

### 26 · ⛔ Les documents Markdown n'obéissaient à aucune bande de taille (2026-09-06)

Trouvé par David, capture à l'appui : *« peux-tu me dire comment augmenter la taille de ce texte
encadré en rouge ? les différents slicers ne semblent pas agrandir cela »* — un tableau d'article du
wiki, à **11,9 px**.

**`.prose` ne connaît aucun de nos paliers.** Le greffon typographique écrit ses tailles en dur :
`1rem` sur le bloc, puis tout l'intérieur en `em` — un tableau valant `0.875em`. Les quatre bandes,
elles, ne redéfinissent que les jetons `--text-*` de Tailwind. *Un greffon qui n'emploie pas ces
classes leur est invisible.*

⚠️ **D'où le symptôme trompeur** : dans le wiki, les paragraphes grossissaient — le conteneur porte
`prose-p:text-lg`, une vraie classe — et le tableau d'à côté ne bougeait pas. *Un réglage qui agit
sur la moitié d'un même bloc se lit comme un réglage en panne.*

Le bloc est rattaché à `--echelle-corps` ; tout l'intérieur étant en `em`, titres, listes **et**
tableaux suivent d'eux-mêmes. Et un tableau se lit désormais **à la taille du texte qui l'entoure** :
le greffon le rétrécit de 12,5 %, convention d'article de blog où la table est une annexe — ici
c'est l'inverse, une table de dégâts est *ce qu'on vient lire*, et on la lit en séance, de loin.

⚠️ **`prose-sm` n'est visé que s'il accompagne `prose`.** Le centre de notifications du Hub porte
`prose-sm` **seul**, sous un `text-xs` qui gagne parce que les utilitaires passent devant les
composants : une règle hors couche sur `prose-sm` nu lui aurait volé sa taille.

⛔ **Aucune garde possible** : `index.css` est illisible depuis Vitest — ni `?raw`, ni `node:fs`, ni
`import.meta.glob`, les trois sont déjà essayés et `bandesDeTaille.test.ts` le dit. Vérifié dans la
**CSS construite** (nos règles à profondeur 0, celles du greffon dans `@layer components`) et à
l'écran par David.

**Ancres** : `src/index.css` (bloc « Les documents Markdown suivent la bande »), `components/TexteMarkdown.tsx`.

### 27 · ⭐ Une loupe de lecture pour les documents (2026-09-06)

Demandée par David : *« est-ce qu'on pourrait faire un mécanisme de loupe pour me faciliter la
lecture ? »*

**Ctrl + molette** sur un document, ou deux boutons à côté ; le pourcentage se clique pour revenir à
100 %. De **70 à 300 %**, retenu **par appareil**. Posée sur les quatre lecteurs : l'article du Nexus
Wiki, le lecteur plein écran d'une règle, l'aperçu de l'atelier, la note du panneau Obsidian.

**Un hublot qui suit la souris a été écarté** : il montre trois mots à la fois et occupe une main,
quand ce qu'on lit est une fiche technique à trois colonnes, en pleine partie. *On ne lit pas un
tableau par un trou de serrure.* Le zoom du document, lui, laisse la mise en page se rerégler.

**Ce n'est pas un réglage de thème.** L'atelier décide de ce que le jeu *est*, et cela part sur le
disque dans un `theme.css` que les joueurs lisent aussi ; la loupe décide de ce que **cet écran-ci**
montre à cet instant. *Un confort de lecture n'est pas une décision d'univers.*

⭐ **La première version a vécu une heure**, et c'est le point qui compte. Elle posait `--loupe` sur
le bloc et laissait les `em` en hériter. David, capture à 230 % : *« le texte ne grossis pas »* —
titres énormes, paragraphes intacts. **Le même motif que le § 26** : `prose-p:text-lg` pose une
taille en `rem`, et *un `rem` se calcule sur la racine du document, jamais sur le bloc qui le
contient*. Tout élément portant une classe `text-*` coupe la chaîne d'héritage, et ils sont légion.
`zoom` ne demande rien à la cascade — et la mise en page **se recasse** dans la même colonne, là où
`transform: scale` déborderait. ⚠️ La commande reste **hors** du zoom : à 230 %, une barre de boutons
zoomée devient un bandeau.

⚠️ **`onWheel` de React est passif** : `preventDefault` y est sans effet, et Electron aurait zoomé
toute la fenêtre **par-dessus**. L'écouteur est posé à la main en `{ passive: false }` — le piège que
`MapCanvas` signale depuis longtemps.

**Ancres** : `components/LoupeDeLecture.tsx`, `components/reglageDeLoupe.ts`,
`components/LoupeDeLecture.test.tsx` — qui garde le **geste** : Ctrl + molette grossit, **la molette
nue ne fait rien** (sinon le document sauterait de taille à chaque défilement).

### 28 · ⭐ Des tailles nommées, jusqu'à 200 % (2026-09-06)

Deux demandes de David le même jour : *« ne serait-ce pas plus simple d'avoir une liste avec les
différentes tailles pour chaque police ? »*, puis, après avoir lu des étiquettes de 8 px sur la fiche
d'un lieu, *« je veux que tu puisses monter jusqu'à 200 % »*.

**Une liste par police reste refusée**, pour la raison déjà écrite au 05/09 : les quatre polices d'un
thème choisissent des **familles**, pas des tailles, et deux d'entre elles ne servent qu'aux fiches.
Ce qui change n'est donc pas *ce qu'on règle* — ce sont toujours les cinq échelles — mais **comment
on le désigne**. *Un curseur affichant « 107 % » ne dit rien de ce qu'on obtiendra et ne se repose
jamais deux fois au même endroit ; un palier nommé se retrouve et se dit à voix haute.*

Neuf paliers, de **Très petit (80 %)** à **Maximal (200 %)**. Les écarts s'élargissent en haut —
130, 150, 175, 200 : *dix pour cent de plus sur 190 ne se voit pas, là où dix pour cent sur 90 se
voit tout de suite.* C'est le rapport qui compte, pas la différence.

**« Non réglé » remplace le bouton *Défaut*** : il **efface** le jeton au lieu d'écrire « 100 % » —
*ne rien dire et dire « échelle 1 » doivent laisser la même page*. Et une valeur héritée d'un ancien
curseur reste offerte comme « Personnalisé » plutôt que d'être remplacée en silence à la première
ouverture de l'atelier.

⚠️ **200 % est un vrai doublement** : sur « Tout le texte », la racine passe de 85 à 170 % et un
`rem` de 13,6 à **27,2 px**. Des panneaux dimensionnés à l'œil déborderont — c'est le retour toujours
possible qui rend ce plafond acceptable. *Conseil de séance : monter la seule bande qui gêne, pas
l'ensemble.*

⛔ **Le test de bornage nommait « 1.3 » en dur** : il aurait échoué ce jour-là **sans que rien ne
soit cassé**. Il lit maintenant `ECHELLE_MAX`, et une garde de plus vérifie que le dernier palier
**est** le plafond — *un plafond que l'interface ne sait pas offrir n'existe que dans le code.*

**Ancres** : `theme/editionDuTheme.ts` (`PALIERS_DE_TAILLE`, `ECHELLE_MAX`), `theme/AtelierDuTheme.tsx`
(`ChampDEchelle`), `theme/bandesDeTaille.test.ts`.

### 29 · ⭐ Un curseur de vitesse sur chaque tuile de Light-OS (2026-09-07)

Demandé par David : *« est-ce que tu peux mettre un slider dans chaque tuile pour contrôler la
vitesse de l'effet ? »*

✅ **ÉPROUVÉ EN RÉEL le 2026-09-07**, sur les lampes de la table — David : *« ok ça marche et les
sliders dans les tuiles aussi »*.

Un facteur **de ×0,25 à ×3, par quarts**, porté par la scène (`effectSpeed`) et qui **divise la
cadence** de tous ses effets : la bougie battait toutes les 250 ms, elle bat à 125 ms en ×2 ; le
crépuscule passe de 10 s à 40 s en ×0,25. Le chiffre affiché est un bouton — un clic remet ×1.

**Le curseur ne paraît que sur les tuiles qui ont un effet**, au même critère que l'étoile ✨ déjà
affichée. *Une scène sans effet n'a rien à accélérer, et un curseur inerte ferait douter des autres.*

⛔ **`setInterval` fige sa période au moment où on le pose.** Trente-neuf effets s'y appuyaient : le
curseur aurait été **sans aucun effet sur ce qui tourne déjà**, c'est-à-dire dans le seul cas où on
s'en sert. Les deux familles d'effets — cadence fixe, et cadence recalculée à chaque tour (glitch,
néon, orage…) — passent désormais par **une seule porte de planification**, qui relit la vitesse à
chaque battement et ne repose le minuteur que si l'attente voulue a changé.

⚠️ **Un plancher à 100 ms**, la valeur que le code s'autorisait déjà (stroboscope, hyperspace).
Chaque lampe en effet a **sa propre boucle**, et le pont Hue tient de l'ordre de dix commandes par
seconde : à quatre lampes, le budget est déjà pris. *Le seul réglage qu'on offre au meneur ne doit
pas pouvoir noyer l'appareil* — et une vitesse nulle, absente ou abîmée retombe sur la cadence
d'origine plutôt que d'arrêter l'effet en silence.

⭐ **Le curseur agit tout de suite sur la pièce**, et pas au battement suivant. Écrire dans le magasin
suffisait pour la prochaine fois ; le crépuscule, lui, n'aurait appris sa nouvelle vitesse que
**dix secondes** après le geste. *Un réglage qui met dix secondes à répondre se lit comme un réglage
cassé.*

⛔ **Un défaut voisin, refermé au passage : deux boucles pouvaient se chevaucher.** Une boucle d'effet
attend la réponse du pont avant de se replanifier. Si la scène change pendant cette attente, la
boucle qui reprend appartient à **l'effet d'avant** et réinstalle son minuteur par-dessus le nouveau
— la lampe reste sur la scène précédente, sans que rien ne le dise. Un **numéro de génération** par
lampe périme la boucle dépassée. *Il était là avant ce chantier ; il ne se voyait pas parce qu'il
demande un pont lent et un changement de scène pressé — soit exactement une soirée de jeu.*

**Portée.** Un effet choisi à la main dans le pied de page n'appartient à aucune tuile : il garde sa
cadence d'origine. Les scènes enregistrées avant ce jour n'ont **pas** de vitesse — elles valent ×1,
rien à migrer — et le réglage suit la sauvegarde automatique, puisqu'il vit dans `scenes`.

**Ancres** : `light/useLightStore.ts` (`effectSpeed`, `setSceneEffectSpeed`, `bornerVitesse`),
`light/HueEngine.ts` (`cadenceEffective`, `CADENCE_PLANCHER_MS`, `appliquerVitesseDeScene`,
`generationEffet`), `light/components/SceneGrid.tsx`, `light/vitesseDesEffets.test.ts`.

### 30 · ⭐ L'éclairage normal de la pièce — et le noir qui tombait tout seul (2026-09-07)

Demandé par David dans la foulée du § 29 : *« comme ma lumière est aussi l'éclairage normal, je
voudrais pouvoir définir un défaut vers lequel on revient systématiquement, même quand je coupe tout.
Si j'ai pas défini de défaut, alors je peux mettre à noir. »*

✅ **ÉPROUVÉ EN RÉEL le 2026-09-07** — David : *« ok ça marche »*. Les deux chantiers du jour sont
donc clos et vérifiés sur le matériel, pas seulement au banc.

⛔ **La demande a mis au jour un défaut qui était déjà là.** Les retours automatiques (fin d'un son,
d'une piste d'ambiance, d'une musique, d'un flash) visaient `lastManualSceneId`. **Si le meneur
n'avait cliqué aucune scène depuis le lancement**, ce champ est vide, `applyScene(null)` éteint — et
la pièce tombait dans le noir **à la fin du premier pad sonore de la soirée**, sans que personne ne
l'ait demandé. *La demande de David n'était pas un confort : c'était le rapport de bogue.*

**TROIS PORTES, et elles ne visaient pas la même chose.** Le point le plus important de ce chantier
est de les avoir séparées au lieu de les aligner :

| Geste | Vise |
| :--- | :--- |
| Retour automatique d'un module | la dernière scène choisie, **puis** l'éclairage normal, puis l'extinction |
| **Stop All** de la barre du haut | l'éclairage normal **directement**, puis l'extinction |
| **Extinction d'urgence** (bouton rouge de Light-OS) | rien : elle éteint |

⚠️ **Le Stop All ne repasse pas par la dernière scène choisie**, et c'est délibéré : *on ne veut pas
retomber sur la scène d'alerte qui jouait il y a trois secondes.* ⚠️ **Le bouton rouge reste une
vraie extinction** — tranché par David : *un bouton nommé « extinction » doit éteindre*, sinon il ne
resterait aucune porte vers le noir tant qu'un défaut est désigné.

**La règle commune est isolée** dans `sceneDeRepli` : *prendre le premier candidat qui porte
réellement l'état d'une lampe.* Une scène absente ou vide est sautée — **une tuile vide n'est pas un
repli**, l'appliquer ne changerait rien et la lumière resterait sur ce que le son venait
d'installer. *Un repli qui ne fait rien est pire qu'un repli absent : il consomme le tour de celui
qui aurait marché.* Corollaire posé dans le magasin : **effacer la tuile désignée retire la
désignation**.

⛔ **`applyScene` n'arrête que les effets des lampes qu'elle mentionne.** Le Stop All devait donc
faire taire **toutes** les lampes connues avant d'installer la scène normale — sans quoi une lampe
absente de cette scène aurait gardé son orage, et le geste aurait laissé la pièce clignoter. *Un
geste qui s'appelle « tout arrêter » ne peut pas n'arrêter que ce que sa cible mentionne.*

**Deux portes pour désigner**, demandées ensemble : l'icône 🏠 sur la tuile (visible en permanence sur
la désignée, au survol sur les autres, second clic pour libérer) et un bloc dans la barre latérale,
posé **juste au-dessus de l'extinction** — *les deux répondent à la même question, « que devient la
lumière quand on arrête tout ? », et ils y répondent différemment.*

**Rien n'est imposé à qui ne s'en sert pas** : `defaultSceneId` à `null` laisse les trois portes se
comporter exactement comme avant.

⭐ **La dégradation a été jouée** : le repli ramené à `[lastManualSceneId]` seul fait tomber le test
du cas de David, et lui seul. *Une garde qu'on n'a pas vue échouer ne garde rien.*

**Ancres** : `light/logic/sceneDeRepli.ts` (+ son test), `light/logic/troisPortesDuRetour.test.ts`
(les trois gestes tenus chacun à sa place, en statut `mock`), `light/HueEngine.ts`
(`revertToManualScene`, `revenirALEclairageNormal`, `extinguishAll`), `light/useLightStore.ts`
(`defaultSceneId`, `setDefaultScene`), `light/components/Sidebar.tsx`,
`light/components/SceneGrid.tsx`, `components/audio/MasterAudioController.tsx`.

### 31 · ✅ Trois promesses de Light-OS que rien ne tenait — **tenues le 2026-09-07**

*Trouvées en relisant le module pour les §§ 29 et 30, vérifiées dans le code, et **traitées les
trois** le soir même sur décision de David : « on va faire L1, L2, L3 ».*

| # | La promesse | Ce que dit le code |
| --- | --- | --- |
| ⛔ **L1** | Le guide 75 : *« désactivez le bouton **Sync** dans les options de Light OS »* pour garder le contrôle manuel. | **`setSyncEnabled` n'est appelé par aucun écran.** `isSyncEnabled` est lu **dix fois**, dans trois modules (Ambient-OS, Music-OS, Sound-OS), il est persisté — et il vaut `true` pour toujours. ⚠️ **Pire qu'absent** : le seul interrupteur voisin s'appelle « **Synchro Simulée** » et bascule le pont en **mode simulé**. Un meneur qui suit le guide débranche son pont au lieu de couper la synchro. |
| ⛔ **L2** | Le guide 75 : *« **Key Learn** : mappez vos scènes préférées sur les touches de votre clavier »*. | **`keyCode` n'a ni lecteur ni écrivain.** Une ligne de type dans `LightScene`, et rien d'autre dans tout le dépôt. Même famille que `timeMultiplier` (§ 17, C4) et `includeSounds` (§ 17, N6). |
| ⚠️ **L3** | Le guide 75 : *« clic droit sur une scène pour changer son nom, son **icône** et la **couleur** de son halo »*. | `updateSceneMetadata` **existe et sait le faire**, mais son unique appelant lui repasse `scene.icon` et `scene.color` inchangés. **Les dix-huit tuiles sont donc grises et portent la même ampoule à jamais** — alors que la couleur pilote la bordure active, le halo et l'étoile ✨. *La chaîne entière est là, il manque le bouton au bout* — le motif M5/A10 du § 17, à un module près. (Et ce n'est pas un clic droit, c'est le crayon ; l'icône de capture n'est pas une disquette mais un appareil photo.) |

⚠️ **Elles ont survécu à la revue des guides** (§§ 12-17), qui a bien relu le guide 75 — mais sur sa
**liste d'effets**, où elle a trouvé les trente-neuf. *Un guide relu n'est pas un guide vérifié ligne
à ligne : une relecture trouve ce qu'elle est venue chercher.*

#### ✅ Ce qui a été livré

| # | Livré | Ce qui ne se devinait pas |
| --- | --- | --- |
| **L1** | Un vrai interrupteur **« Synchro des modules »** dans la barre du haut, **posé avant** le mode simulé. | ⛔ **Le voisin a été renommé, et c'est la moitié du correctif.** « Synchro Simulée » → **« Mode simulé »**, en ambre et non en accent, avec une bulle qui dit qu'il *débranche le pont*. *Deux réglages dont l'un porte le nom de l'autre, c'est un piège et non une étiquette maladroite* — la clé `mock_sync` a été supprimée pour qu'elle ne revienne pas. |
| **L2** | Le **Key Learn** : un ⌨ sur la tuile, la frappe suivante s'inscrit, et la touche vaut **depuis n'importe quel écran**. | Monté dans `GlobalKeybinds`, avec la garde partagée `estUneFrappeDePastille` — *une scène qu'il faudrait ouvrir Light-OS pour lancer n'aurait aucun intérêt*. **Une touche ne commande qu'une scène** : l'attribuer à une seconde la retire à la première, sinon la gagnante serait celle que l'ordre de parcours désigne. ⚠️ **Mais c'est le TROISIÈME écouteur du clavier sur `window`** (Sound-OS, Music-OS, Light-OS) : ils sont indépendants, donc une même touche peut lancer un son **et** sa lumière. Cumul voulu, écrit dans le guide. **Échap** annule l'attente — sans cette porte, y entrer par erreur obligerait à sacrifier une touche pour en sortir. |
| **L3** | Un **éditeur de tuile** — nom, **icône** (24 proposées + champ libre), **couleur** (16 pastilles + sélecteur). | Il remplace un `gmPrompt`, qui ne sait porter qu'une ligne. ⚠️ **La grille d'icônes est fermée par choix** : les noms de Material Symbols ne se devinent pas, et *une icône mal orthographiée ne s'affiche pas — une tuile vide ne dirait pas pourquoi*. La couleur ne commande **aucune lampe**, et le guide le dit maintenant : c'est le repère de la tuile à l'écran. |

⚠️ **Le Key Learn ne pouvait pas vivre dans l'éditeur.** La garde partagée rend le clavier à toute
boîte portant `role="dialog"` — sinon taper « Taverne » dans le champ du nom lancerait les pastilles
liées à T, A, V, E, R, N et E. Le ⌨ est donc resté **sur la tuile**. *Une garde qui protège un module
contraint la place des boutons d'un autre : ça ne se voit qu'en essayant.*

**Trois corrections de plus dans le guide 75**, trouvées en le rendant vrai : la capture se fait par
un **appareil photo** et non une disquette, l'éditeur s'ouvre au **crayon** et non au clic droit, et
l'effacement retire aussi la touche et la désignation d'éclairage normal.

**Ancres** : `light/components/TopControls.tsx` (L1), `light/useLightKeyboardControls.ts` +
`components/GlobalKeybinds.tsx` + `light/logic/raccourcisDeScene.test.ts` (L2),
`light/components/EditeurDeScene.tsx` (L3), `light/useLightStore.ts`
(`sceneEnApprentissage`, `setSceneKeyCode`).

### 32 · ⛔ La couleur d'une tuile ne se voyait nulle part — et les icônes se sont télescopées (2026-09-07)

*Deux retours de David dans l'heure qui a suivi le § 31, tous deux à l'écran. **Le premier montre que
livrer un réglage ne suffit pas ; le second, que ce qu'on ajoute pousse ce qui était là.***

✅ **CORRIGÉ ET VÉRIFIÉ À L'ÉCRAN le 2026-09-07** — David : *« ok c'est bon »*. Les deux défauts sont
nés le jour même, du § 29 et du § 31 : **une soirée de livraisons se relit toujours à l'écran, et
c'est là que la moitié de ses défauts se voit.***

#### ⛔ 32a — « je ne sais pas donner de couleur à mes tuiles »

L'éditeur de tuile fonctionnait. **C'est la tuile qui ne montrait rien.** `scene.color` était lu à
**cinq endroits**, et la couleur que portent les dix-huit scènes depuis leur création — `#334155` —
sur un fond `--app-surface` à `#0f172a` donne un **rapport de contraste d'environ 1,6**, sous le
seuil où l'œil distingue une forme.

| Repère | Ce qu'il donnait |
| --- | --- |
| Icône de la tuile | grise : la couleur n'était lue **que si la scène jouait** |
| Bordure de la scène active | **écrasait la classe `border-accent`** par un gris sombre — *activer une tuile la rendait moins visible* |
| Halo, dégradé de la scène active | invisibles |
| Étoile ✨ « cette scène porte un effet » | ⛔ **invisible pour tout le monde, depuis toujours** — et c'était le seul repère permanent du lot |

⭐ **La cause tient en une phrase : `#334155` n'a jamais voulu dire « peins-moi en gris ardoise », il
voulait dire « personne n'a choisi ».** Tant que rien ne permettait d'en changer, la distinction
n'existait pas ; **l'éditeur du § 31 l'a rendue nécessaire, et je ne l'avais pas faite.** *Un défaut
qui signifie « rien n'est choisi » ne doit jamais traverser la même porte qu'une valeur choisie.*

`couleurDeLaTuile` rend `null` dans ce cas, et les cinq usages passent par elle : les classes CSS
jouent alors seules, donc **l'apparence d'avant est conservée à l'identique** pour qui n'a rien
choisi. Une couleur choisie, elle, marque la tuile **au repos** — icône teintée, bordure à `80`
d'alpha (pleine à l'activation : *dix-huit bordures saturées se disputeraient l'œil*), halo, étoile.
Dans l'éditeur, la première pastille s'appelle **« Aucune couleur »** au lieu de se faire passer pour
un gris. ⚠️ Une teinte *voisine* du défaut (`#334156`) reste un choix : **on lit l'intention à
l'égalité, pas à la ressemblance** — un test le tient.

#### ⛔ 32b — « les icônes se mélangent »

Capture à l'appui : l'étoile ✨ du coin haut-droit et l'icône de la scène, **côte à côte, lues comme
un seul glyphe**. La cause n'est pas l'étoile : la colonne centrée de la tuile a grossi le jour même
d'une **ligne de vitesse et d'un curseur** (§ 29), le carré n'a pas grandi, et le contenu est remonté
dans la bande où les badges de coin sont posés à `top-2`.

**L'étoile est descendue dans la ligne de vitesse**, à la place d'un glyphe `speed` qui ne disait
rien que le « ×2 » ne disait déjà — *et elle y est mieux : cette ligne n'existe QUE sur les scènes à
effet, donc elle ne peut pas mentir.* La colonne est resserrée (icône `text-3xl`, gouttières `gap-2`)
et `py-7` l'empêche désormais d'entrer dans les bandes de coin.

⚠️ *Un carré de taille fixe se remplit ; ce qu'on y ajoute pousse ce qui y était.* Trois ajouts en
deux jours — curseur de vitesse, maison, badge de touche — et **aucun n'a été pensé contre les
autres**. La collision n'était visible sur aucun d'eux pris seul.

**Ancres** : `light/logic/couleurDeLaTuile.ts` (+ son test), `light/components/SceneGrid.tsx`,
`light/components/EditeurDeScene.tsx`.

### 33 · ⭐ Le contrôle qui attrape « déclaré, branché à rien » (2026-09-07)

*Proposé après le § 31, sur une mesure et non sur une intuition : j'ai passé les magasins au peigne
avant de proposer l'outil, pour vérifier qu'il attraperait quelque chose. **Il attrape dix-neuf
noms.***

#### Pourquoi il existe

Trois fois en un mois, un réglage a été **déclaré, implémenté, parfois documenté dans un guide — et
branché à rien** : `timeMultiplier` et `includeSounds` (§ 17), `isSyncEnabled` et `keyCode` (§ 31),
`isMapVideo` (ci-dessous). **Aucun outil ne les voyait** : TypeScript est content, le nom existe et
son type est juste ; les tests sont verts, ils exercent ce qui est branché ; et une relecture de
guide ne les voit pas non plus — *elle trouve ce qu'elle est venue chercher*.

`src/stores/nomsSansEcrivainNiLecteur.test.ts` compare des **noms**, pas des références. Il ne prouve
donc pas qu'un nom est mort : il dit qu'il **n'apparaît nulle part ailleurs que dans son magasin**.
D'où sa forme — **une liste d'exceptions qui ne doit pas grandir**, chacune portant sa raison. Un nom
neuf qui y tombe fait échouer le test avec la question à poser : *qui est censé l'écrire, qui est
censé le lire ?*

#### ⛔ Ce que le contrôle a appris sur lui-même

Il a fallu le dégrader **deux fois** pour qu'il soit vrai, et les deux défauts étaient du type qu'il
traque :

| Défaut du contrôle | Conséquence |
| --- | --- |
| Il **se lisait lui-même** — les noms tolérés y sont écrits en toutes lettres | chaque tolérance se déclarait « employée ailleurs ». *Un contrôle qui s'inclut dans ce qu'il mesure mesure sa propre existence.* Les fichiers de test sont désormais hors corpus, ce qui le rend **plus sévère** : un nom cité seulement par sa propre sonde n'est pas branché |
| Son filtre de chemins ne reconnaissait **aucun** des quinze magasins de `src/stores/` (ils arrivent en `./x.ts`, pas `../stores/x.ts`) | quinze magasins hors examen. **C'est la garde du compte qui l'a dit** — *un contrôle qui n'examine rien passe au vert* |
| ⛔ Il ne lisait que la **première** `interface` de chaque fichier | dans `useLightStore.ts`, `HueLightState` — et **jamais `LightState`**. Trouvé en ajoutant un champ fantôme qui **n'a rien déclenché** : *une sonde qui ne réveille pas le défaut ne prouve rien*, et c'est la seule façon de s'en apercevoir. Corrigé, la récolte est passée de 9 à 19 noms |

#### ⚠️ Ce qu'il a trouvé, et qui attend une décision

Dix noms sont **déclarés, souvent implémentés, et appelés par personne** — mesuré, pas supposé :

| Où | Quoi |
| --- | --- |
| `useSoundStore` | ✅ **`setPadColor` — TRAITÉ, voir § 35.** Et c'était pire que « la couleur ne peut pas être changée » |
| `useClockStore` | ⛔ **J'ai exagéré la première rédaction de cette ligne, corrigée le 07/09 au soir.** `setActiveCalendar` est un **doublon** : `selectCalendar` pose `activeCalendarId` (ligne 467) et l'écran a bien sa liste déroulante. `addTime` en est un autre : le tableau de bord avance le temps par `setTimestamp`. `resetTensionClock` ferait gagner six clics — `updateTensionSegments` vide déjà une jauge segment par segment. **Seul `daysPerWeek` est une vraie anomalie** : une occurrence dans tout le dépôt, jamais lue. *Un nom sans appelant n'est pas une fonctionnalité manquante — il faut regarder si un voisin fait déjà le travail.* |
| `useSessionStore` | ✅ **`isSessionMode` / `toggleSessionMode` — TRAITÉS, voir § 36.** Supprimés : le mode existait déjà ailleurs, sous un autre nom |
| `useMapUIStore` | `setBrushSize` — `brushSize` est figé à **50**, lu par `FogEngine` et persisté : on peint un couloir et une plaine au même pinceau |
| `usePerformanceStore` | `setAutoPerformance` — le mode force les graphismes bas et **rien ne permet de le contredire** |
| `useUlanziStore` | `setSeuil` — `seuilSansPause` est borné 1-6, donc prévu réglable, et aucun écran ne le règle |
| `useMapStore` | `attachZoneToToken` — aucun écran ne sait attacher une zone de danger à un pion |
| `useCombatStore`, `useForgeStore`, `useMusicStore`, `useAIStore`, `useGemStore`, `useImageStore`, `useWebStore` | `isRemoteSyncing` (déclaré, **même pas implémenté**), `resetCombat`, `setAnalysisResult`, `clearPlaylistPads`, `getApiKey`, `setGems`, `projectUrl`, `setLinks` |

*Aucun n'a été touché : ce sont des décisions, pas des défauts évidents.* Douze autres noms sont
employés à l'intérieur de leur propre magasin — légitimes, et inscrits comme tels.

**Ancre** : `src/stores/nomsSansEcrivainNiLecteur.test.ts` (43 magasins examinés).

### 34 · ⛔ Un moment de storyboard ne pouvait pas porter une carte vidéo (2026-09-07)

Trouvé par le peigne du § 33. `isMapVideo` est **lu** — `useStoryboardStore` le passe à `setMap` — et
**écrit par personne** : le bouton de capture copiait `mapStore.mapUrl` et oubliait `mapStore.isVideo`,
qui se trouve **juste à côté**. La vidéo est entrée dans le projet le 05/09 (§ 22) ; le storyboard ne
l'a pas suivie. *Un champ lu que rien n'écrit ne lève aucune erreur : il rend la valeur par défaut, et
le défaut ressemble à un choix.*

**Trois sources, une règle par source :** la capture depuis Map-OS prend le verdict du **magasin**
(une carte peut venir d'une adresse sans extension) ; un choix dans la liste de l'Atlas se décide sur
l'**extension**, par `estUneVideo` — *la même fonction que le Media Hub, on recopie son verdict au
lieu d'en rendre un second* ; et un moment enregistré **avant** ce correctif retombe sur son adresse
(`??` et non `||`, pour qu'un `false` explicite reste un choix respecté).

**Ancres** : `storyboard/StoryboardDashboard.tsx`, `stores/typesDeMedia.ts` (`estUneVideo`).

### 35 · ⛔ La couleur d'une pastille de son n'a jamais rien coloré (2026-09-07)

*Premier des dix noms du § 33 à être traité, sur décision de David. **Et il s'est révélé plus grave
que ce que le contrôle annonçait** : le contrôle disait « personne n'appelle `setPadColor` » ; en
ouvrant, la valeur qu'il aurait fallu remplacer n'existait pas non plus.*

⛔ **`var(--electric-violet)` n'est définie NULLE PART dans le dépôt.** Une seule occurrence dans tout
le projet — celle qui l'emploie, comme valeur de naissance de chaque pastille. Les **cinq** endroits
qui peignent une pastille pointaient donc vers rien :

| Où | Ce que ça donnait |
| --- | --- |
| Bordure de la pastille active | valeur invalide, la classe reprenait la main |
| Fond teinté | `` `${color}15` `` → `var(--electric-violet)15`, **du CSS qui n'existe dans aucune grammaire** |
| Barre de progression, son halo, le dégradé du bas | sans couleur |

⚠️ **Et `var(--gm-violet)`, trois lignes plus bas, n'existe pas davantage** — `gm.violet` est une
couleur *Tailwind*, pas une variable CSS. *Deux variables mortes à trois lignes d'écart : elles se
recopient plus vite qu'on ne les vérifie.*

**Pourquoi ça a tenu si longtemps.** *Une couleur qui ne s'applique pas ne rend aucune erreur :
l'élément garde simplement ce qu'il avait.* Et le seul moyen de remplacer la valeur morte —
`setPadColor` — n'était appelé par personne. **Les deux défauts se protégeaient l'un l'autre** : sans
bouton, la valeur ne changeait jamais ; sans valeur valide, un bouton n'aurait rien montré.

**Livré** : une rangée de huit pastilles de couleur dans le menu d'un pad, et `couleurDuPad` par où
passent les cinq usages — tout ce qui n'est pas une hexadécimale à six chiffres retombe sur le violet
de l'application (`gm.violet`, `#8b5cf6`, dont le commentaire de la configuration dit « Music/Sound/
Voice OS »). **Aucune migration** : les pastilles existantes gardent leur champ et s'affichent enfin.

⚠️ La leçon technique : *une concaténation suppose une forme, et rien ne l'impose.* Coller `15` au
bout d'une valeur CSS ne marche que sur une hexadécimale à six chiffres — un test le tient maintenant
dans les deux sens.

⭐ **La seconde garde du contrôle du § 33 a servi le jour même.** `setPadColor` étant désormais
employé, sa tolérance est devenue périmée et le test a échoué en demandant qu'on retire sa ligne.
*Une tolérance qui survit à sa cause devient un mensonge* — le mécanisme prévu pour ça a fonctionné à
sa première occasion.

**Ancres** : `sound/logic/couleurDuPad.ts` (+ son test), `sound/components/SoundPad.tsx`.

### 36 · ⭐ Le MJ Focus existait déjà — il lui manquait sa porte de sortie (2026-09-09)

Demandé par David après le § 33 : *« je voulais le MJ Focus, mais je veux aussi une possibilité d'en
sortir au besoin, comment faire ? »*

⭐ **La bonne réponse était de ne pas le construire.** Le mode existe depuis l'axe N.3
(2026-08-23/24) : `aLaTable` densifie cinq modules — combat, carte, PNJ, Oracle, journal —, pré-choisit
ce qui peut l'être et **éloigne les actions destructives de ce qu'on touche dix fois par tour**. Il se
déduit de `momentDeJeu` : une séance ouverte et non en pause. *Brancher `isSessionMode` aurait créé un
**second écrivain pour le même fait** — le motif que ce dépôt paie plus souvent qu'aucun autre.* Les
deux noms morts sont supprimés.

**Et la sortie existait aussi, sans que rien ne le dise** : mettre la séance **en pause** fait
repasser `momentDeJeu` en préparation — c'est déjà écrit dans son code, au titre de l'axe G. Personne
ne pouvait le deviner.

#### Ce qui manquait vraiment

⛔ **Le régime se déduisait en silence : rien pour le voir, rien pour le contredire.** L'axe F.5 avait
pourtant donné les deux à l'IA dès août, et son `IndicateurDeMode` porte la règle mot pour mot —
*« c'est la Forge qui doit le dire, avec le moyen de passer outre »*. **L'axe N.3 ne l'a jamais fait
pour l'écran.** *Deux axes voisins, une même règle, appliquée d'un seul côté.*

`IndicateurDeRegime` reprend ce patron : il affiche **Table** ou **Atelier**, **sa raison** — séance
ouverte / hors séance / **forcé** —, et offre de basculer. Trois raisons et non deux : *« Table parce
qu'une séance est ouverte » n'est pas « Table parce que je l'ai demandé »*, et le meneur doit
reconnaître son propre geste, sinon il cherchera la séance qui n'existe pas. Quand un forçage est
actif, un second bouton **Auto** rend la main à la séance — *rendre la main et forcer l'autre régime
sont deux intentions, une bascule unique obligerait à passer par l'une pour atteindre l'autre.*

⛔ **Il vit dans la barre du haut, et c'est une cicatrice, pas une préférence.** Le 2026-08-23, le mode
compact avait rendu **trois boutons introuvables**. *Une porte de sortie qui disparaît avec le mode
qu'elle doit quitter n'est pas une porte* — l'interrupteur ne fait donc jamais partie de ce que le
régime replie, et la barre du haut est le seul endroit visible depuis tous les modules.

#### Deux décisions de David

- ⚠️ **Le forçage ne va pas plus loin que l'écran.** Les budgets de temps de l'IA lisent `momentDeJeu`
  directement et ignorent la surcharge : *replier son écran ne veut pas dire que la table a cessé
  d'attendre.* L'IA garde ses deux portes à elle — le bouton « Alléger » de l'axe F.5, et la pause.
- **Non persisté** : *un forçage est un geste « pour maintenant »*. Le restaurer au lancement mettrait
  l'écran dans un régime que personne n'a demandé ce jour-là, sans rien pour l'expliquer — la règle de
  `suivreLaVoix`. ⚠️ Le `partialize` de ce magasin persiste **tout sauf** ce qu'on lui retire : il a
  fallu l'y ajouter explicitement, sans quoi le commentaire aurait menti.

*Au passage, une erreur `eslint` antérieure est réparée dans ce `partialize` — l'omission par
déstructuration y laissait deux variables inemployées.*

**Ancres** : `session/components/IndicateurDeRegime.tsx`, `session/hooks/useRegimeDInterface.ts`,
`store/useSessionStore.ts` (`surchargeDuRegime`, `forcerLeRegime`),
`session/logic/surchargeDuRegime.test.ts`, `components/Shell.tsx`.

### 37 · ⭐ L'intensité par tuile et par lampe — et le bouton d'arrêt qui n'existait pas (2026-09-09)

Question de David : *« j'aurais voulu savoir s'il était possible dans Light-OS de régler l'intensité
des lumières par tuile ? »* Non — et la mesure de ce qui existait valait mieux que la réponse.

⛔ **Un seul curseur d'intensité dans tout le module, et il était global.** La brillance d'une scène
était celle **figée à la capture** ; le pied de page savait régler la couleur et l'effet d'une lampe,
mais **pas sa brillance** — elle venait de l'application Hue et d'elle seule. *La valeur qu'une tuile
enregistre était la seule que l'application ne permettait pas de choisir.* Les deux voies ont donc été
proposées, et David les a prises toutes les deux : **« je veux les deux »**.

Verdict à l'écran le jour même : **« tout fonctionne bien »**.

#### 37a · Le curseur de la tuile — il multiplie, il ne réécrit pas

`sceneBrightness`, de 10 à 150 %, **multiplie ce qui a été capturé**. On baisse une ambiance pour la
soirée, et revenir à 100 % rend la scène d'origine **sans recapture** — un test le tient. Il se
**compose** avec le curseur global : le global dit *« toute la pièce ce soir »*, la tuile dit *« cette
ambiance-là est basse »*.

⚠️ **Deux facteurs sur la même valeur, c'est deux façons de sortir des clous.** La brillance envoyée
est bornée à 254 : sans ça, une tuile à 150 % sur une lampe déjà pleine ferait **refuser la commande
entière** par le pont, en emmenant les autres lampes avec elle. Et une valeur illisible — scène d'avant
le réglage, sauvegarde abîmée — vaut 100 % : *on joue la scène telle qu'elle a été capturée, on ne
l'éteint pas.*

Il agit tout de suite, par **deux chemins qui ne se ressemblent pas** : les lampes **sous effet**
relisent l'intensité à chaque battement ; les lampes **posées** ne rebattent jamais, et c'est le moteur
qui les renvoie — un quart de seconde après que le curseur s'arrête, et avec une transition de 200 ms
et non les 5 s de `transitionTimeMs`, *qui feraient répondre la pièce cinq secondes après la main.*

⚠️ **L'intensité ne touche que le message envoyé au pont** : l'état gardé en mémoire reste la
brillance nominale. Sinon deux allers-retours entre une tuile à 50 % et une capture éteindraient la
scène par étapes.

⛔ **Une seule ligne sur la tuile** — icône, curseur, pourcentage — là où la vitesse s'offre un titre
au-dessus de son curseur. La vitesse ne s'affiche que sur les scènes à effet ; l'intensité est sur les
dix-huit. *Le § 32 a déjà été payé sur ce carré : ce qu'on y ajoute pousse ce qui y était.*

#### 37b · Le curseur de la lampe — la valeur que la capture enregistrera

Dans le pied de page, chaque lampe a sa brillance. C'est la valeur **nominale** : ce qu'on voit dans la
pièce est elle passée par le curseur global, exactement comme une scène.

⛔ **Un curseur traîné émet une valeur par pixel, et le pont en accepte une dizaine par seconde**,
effets compris. `creerLimiteur` laisse passer le premier geste — sinon le curseur donnerait
l'impression de coller — puis n'en garde plus qu'un par intervalle : **la dernière valeur demandée**,
jamais une du milieu. *Ce qui compte pour un curseur, c'est où la main s'arrête, pas par où elle est
passée.* La clé sépare les lampes : deux réglées coup sur coup ne se volent pas leur tour.

#### 37c · ⛔ Le geste existait dans le moteur, sans personne pour l'appeler

Retour de David dans la foulée : *« il me semble qu'il n'y a pas de bouton pour arrêter la scène en
cours à part le blackout d'urgence »*. C'est exact, et c'était plus qu'un bouton manquant.

`revenirALEclairageNormal` est écrit **depuis le 07/09** (§ 30) : il coupe tous les effets logiciels —
y compris ceux des lampes que la scène de repli ne mentionne pas — puis ramène l'éclairage normal, ou
éteint s'il n'y en a pas. **Le seul appel de toute l'application venait du Stop All de la barre
audio.** Dans Light-OS lui-même : rien. Le seul geste d'arrêt du module était l'extinction d'urgence —
*c'est-à-dire éteindre la pièce pour arrêter une ambiance.*

⚠️ **C'est la quatrième fois en trois jours que le motif du § 31 se paie** : la chaîne entière est là,
il manque le bouton au bout. Le § 31 en avait trouvé trois d'un coup, le § 36 un autre le matin même.
*Aucun outil ne les voit* — le nom est branché, le typage est content, et les tests exercent ce qui est
branché.

Le bouton est posé dans la barre latérale, au-dessus de l'extinction, là où vit déjà le sélecteur
d'éclairage normal : les trois répondent à la même question. Les deux se lisent maintenant l'un contre
l'autre — **Arrêter la scène** coupe les effets et ramène l'éclairage normal, sobre et non rouge ;
**Blackout d'Urgence** éteint, toujours.

- ⚠️ Il vise l'éclairage normal et **jamais la dernière scène choisie** : c'est la deuxième des trois
  portes du retour, et les aligner ferait retomber sur la scène d'alerte qui jouait il y a trois
  secondes.
- ⚠️ **Éteint quand aucune scène ne joue**, et le titre dit pourquoi : *un bouton nommé « arrêter »
  allumerait la pièce si rien ne jouait.* Sans éclairage normal désigné il éteint — son infobulle
  l'annonce avant le clic.

**Ancres** : `light/useLightStore.ts` (`sceneBrightness`, `bornerIntensite`, `setSceneBrightness`),
`light/HueEngine.ts` (`brillanceEffective`, `appliquerIntensiteDeScene`, `intensiteDeLEffet`,
`revenirALEclairageNormal`), `light/components/SceneGrid.tsx`, `light/components/BulbFooter.tsx`,
`light/components/Sidebar.tsx`, `light/logic/limiterLaCadence.ts`,
`light/intensiteDesScenes.test.ts`.

### 38 · ⭐ Trois suggestions prises au mot : le flash, le journal, et Échap (2026-09-09)

*« Est-ce que tu as encore des suggestions ? »* — puis, les trois posées : **« ok fait les 3 »**. Elles
sortaient toutes de la lecture du § 37, et aucune n'était une idée : chacune était une chose que le
code disait déjà.

#### 38a · ⛔ Les flashs ignoraient le curseur global — et ils étaient DEUX

`triggerFlash` parle au pont **directement**, et c'est voulu — il ne doit toucher ni l'état gardé en
mémoire ni la scène active. Mais il court-circuitait du même coup la seule multiplication que **toutes**
les autres lampes subissent : à 20 % d'intensité globale, *« Rouge Critique » partait quand même à
pleine puissance*.

⚠️ **`applyTacticalState` porte les mêmes quatre lignes recopiées, et le même défaut.** L'état tactique
persistant du module de combat. *Je ne l'ai vu qu'en réparant* — la ligne à corriger existait à
l'identique deux fois dans le fichier, et le premier correctif avait visé la bonne des deux par chance.
**La question qui trouve ces défauts est toujours la même : « qui d'autre a la même rustine à poser ? »**
Elle a déjà servi trois fois au pupitre de dés.

⚠️ **Troisième et quatrième chemins en deux jours qui s'arrêtent avant le moteur** — après le § 37c, et
le motif des jets de dés qu'on connaît par cœur. *Un curseur qui dit « toute la pièce » et qu'un chemin
ignore n'est pas un curseur, c'est une approximation.*

L'intensité d'une **tuile**, elle, ne s'y applique pas : un flash n'appartient à aucune scène. Et le
plancher à 1 reste, parce que la commande dit `on: true` — *envoyer « allume-toi à zéro » n'a pas de
sens ; qui veut le noir a le bouton rouge.*

#### 38b · ⛔ Le journal disait quand une ambiance commençait, jamais quand elle s'arrêtait

`applyScene` consigne le geste du meneur depuis la revue des 36 émetteurs (2026-08-20). Les **deux
arrêts** — `revenirALEclairageNormal` et `extinguishAll` — n'écrivaient rien, le Stop All de la barre
audio pas davantage. *À la relecture d'après-séance, toutes les lumières de la soirée avaient l'air
d'être restées allumées.*

La règle appliquée est celle d'`applyScene`, et elle vaut plus que la ligne qu'elle produit : **on
consigne ce que le meneur a voulu, pas ce que l'application a enchaîné.** `isAutomatic` voyage donc
avec le geste jusque dans `extinguishAll`, et une seule ligne est écrite quelle que soit la fin de
l'arrêt — *un journal qui double ses lignes se relit comme un journal qui ment sur le nombre de
gestes.*

⚠️ Comme les lignes de scène, elles ne s'écrivent **que si une séance est ouverte** : `addEvent` se
tait sans journal actif. Les tests remplacent donc l'écriture par un espion — *ce qu'on éprouve est la
décision d'écrire, pas la présence d'un journal.*

#### 38c · Échap arrête la scène — le raccourci choisi par David

Les dix-huit tuiles pouvaient avoir leur touche depuis le 07/09 ; l'arrêt obligeait à revenir sur
l'écran Light-OS. Trois candidats ont été proposés, David a pris **Échap** : la touche universelle du
« sortir », et la seule qu'on puisse réserver sans rien retirer au meneur — *l'apprentissage l'utilise
déjà pour s'annuler, elle ne peut donc pas être attribuée à une tuile par l'écran.*

- ⚠️ Elle est lue **avant** la recherche par touche : une sauvegarde ancienne qui porterait `Escape`
  sur une tuile ne la lancerait pas. *Une touche réservée qui ne l'est qu'à l'écriture ne l'est pas.*
- ⛔ Elle **ne fait rien quand aucune scène ne joue**, même règle que le bouton : le retour vise
  l'éclairage normal, donc un « arrêter » sur une pièce au repos l'**allumerait**. *Le geste d'arrêt ne
  doit jamais être un geste d'allumage.*
- La garde partagée écarte déjà les champs de saisie et les boîtes ouvertes : Échap y garde son rôle
  de fermeture. Et le raccourci **se lit sur le bouton** — *un raccourci qu'il faut chercher dans un
  guide n'en est pas un.*

**Ancres** : `light/HueEngine.ts` (`triggerFlash`, `applyTacticalState`, `consignerAuJournal`, `extinguishAll(isAutomatic)`),
`light/useLightKeyboardControls.ts`, `light/components/Sidebar.tsx`,
`light/logic/troisPortesDuRetour.test.ts`.

### 39 · ⭐ L'audit du 2026-09-09 — quatre trous, le premier traité

*« Peux-tu revoir l'application dans son ensemble et me trouver les trous ? »* — quatre peignes passés
sur 978 fichiers, chaque candidat vérifié dans le code avant d'être annoncé. **Le peigne compte des
noms, pas des références** : même parti pris que le contrôle des magasins, et mêmes limites.

⚠️ **Ce que l'audit dit de bon, et qu'il faut lire aussi** : les 34 moteurs et services n'ont **aucune
capacité orpheline réelle** — tout ce que le peigne a signalé était appelé par IPC, par une variable
intermédiaire ou par un bootstrap. Et il n'y a **qu'un seul `catch` muet** dans tout le dépôt
(`useClientStore`, migration d'identifiant qui retombe proprement sur un nouvel UUID). *Le motif qui a
coûté quatre mois de panne de projection est éteint.*

#### 39a · ✅ TRAITÉ — Aucun PDF du corpus n'a jamais nourri la Forge

`RAGService` appelait `extractPdf`, le préload n'exposait que `extractPDF`, et **le contrat déclarait
les deux**. L'appel optionnel valait `undefined`, le `if (text)` était faux : la fonction concluait
*« ce PDF est vide »* — pour tous les PDF, depuis toujours.

⚠️ **La conséquence n'est pas théorique** : `getContextForSpecificSystem` **admet explicitement** le
`.pdf` pour la génération d'un système, puis en jette le contenu. Un livre de règles en PDF déposé dans
`docs/systems/<jeu>/` ne nourrit pas la Forge — pendant que l'index de l'Oracle, lui, lit bien les PDF
par son propre chemin (`RAGEngine`, `pdf-parse`). *Deux chemins pour la même matière, un qui marche, un
qui se tait.*

⛔ **Ce qui l'a rendu invisible : le fichier de types lui-même.** *Un contrat qui déclare les deux
orthographes ne peut plus arbitrer entre elles*, et le typage n'avait donc rien à dire. C'est le motif
des deux `as any` de la projection des fiches, transposé au contrat du pont.

Le nom retenu est `extractPdf`, celui de ses voisins `readDoc` et `writeDoc` — *« PDF » en capitales
invitait la faute à se reproduire.* Et un PDF qui ne rend rien se dit désormais dans la console : *une
extraction qui échoue et une extraction vide se ressemblent trop pour partager le même silence.*

#### 39b · ✅ TRAITÉ — Le contrôle qui manquait, et ses trois premières prises

Le contrôle des magasins (§ 33) **ne regarde que les magasins**. Les deux défauts du jour vivaient
ailleurs : le geste d'arrêt sans bouton dans un **moteur** (§ 37c), le PDF dans le **contrat du pont**.
`pontDeclareEtExpose` tient désormais le second front — *tout ce que le contrat déclare, le préload
l'expose.*

⚠️ **Il a mordu tout de suite : trois noms déclarés, APPELÉS, et absents du préload.** ✅ **Les trois
sont tranchés le jour même**, et la liste d'exceptions du contrôle est **vide** :

| Nom | Ce qui n'allait pas | Verdict |
| :--- | :--- | :--- |
| `openFile` | Le bouton du cockpit de campagne affichait une alerte avec le chemin — *il ne mentait pas, mais il n'ouvrait rien* | ✅ **Exposé**, avec une garde : `shell.openPath` **confie** le fichier au système, et *une campagne s'importe* |
| `broadcastToTablets` | Appelé **quatre fois**, jamais pris : tout passe par le `CustomEvent` que `useHubSync` réachemine. Le commentaire *« le Player Hub s'en tire par le pont Electron »* décrivait un chemin mort — ⚠️ qui avait **déjà divergé** (le `motif` des ressources de table y disparaissait) | ✅ **Supprimé** : construire le canal aurait bâti un second transport pour ce qu'un seul fait déjà |
| `highlightMapToken` | Appelé **trois fois** par `useCombatStore` pour souligner le pion du combattant actif | ✅ **Supprimé — et voir ci-dessous : la fonctionnalité existait déjà** |

⛔ **Mon audit s'est trompé sur celui-là, et l'erreur mérite d'être écrite.** J'avais conclu *« la
fonctionnalité n'a jamais marché »* ; David a répondu qu'il la voulait ; en allant la construire, je
l'ai **trouvée déjà là**. `MapTokenNode` lit le magasin de combat lui-même et pose
`ring-accent shadow-glow-accent animate-pulse` sur le jeton dont le `linkedCombatantId` est celui du
tour — **sur les trois écrans**, meneur, calque et joueurs, puisque les trois rendent le même
composant.

Ce qui était mort n'était donc pas la fonctionnalité mais **une seconde façon impérative de la
demander** : par *nom*, là où la vraie se fait par *identifiant*. ⭐ *Un peigne qui compte les noms dit
« ce nom ne mène nulle part » ; il ne dit pas « cette fonctionnalité n'existe pas ».* J'ai conclu la
seconde phrase à partir de la première — c'est le § 36 à la lettre, **la bonne réponse était de ne pas
le construire**.

⚠️ La limite réelle, elle, vaut d'être connue : l'anneau ne s'allume que sur un jeton **lié** à un
combattant (`linkedCombatantId`, posé par le bouton « ajouter à la carte »). Un pion déposé à la main
sans ce lien ne s'allumera pas.

⚠️ **Et le contrôle a montré sa limite le même jour** : il compare des **noms**, pas des **chemins**.
`openExternal` était déclaré **à la racine** du contrat et exposé **sous `web`** — le nom existait
quelque part, donc le contrôle se taisait, et le panneau de l'Oracle appelait le vide. *La parade n'est
pas dans le contrôle : c'est que le contrat déclare chaque nom là où il est réellement exposé, et le
typage attrape alors l'appelant tout seul.* C'est ce qui s'est passé.

#### 39c · ✅ TRAITÉ — Neuf clés s'affichaient en clair, et le contrôle ne pouvait pas les voir

⛔ **L'angle mort d'abord** : `clesEmployees` ne vérifiait que les clés à namespace explicite
(`modules:x.y`). **Elles sont une minorité** — 890 appels écrivent leur clé sans préfixe et la tiennent
de leur composant (`useTranslation('modules')` puis `t('x.y')`). *Un contrôle qui ne couvre qu'une
minorité de son sujet rassure plus qu'il ne protège.*

**Quatre clés s'affichaient en toutes lettres à l'écran** : `image.pad.stop` sur la pastille dès qu'une
image est projetée (sa voisine `solo` existe, elle non), les deux infobulles du bouton « ajouter le
combattant à la carte », et l'horodatage du lobby des tablettes.

⚠️ **Les cinq autres n'étaient pas le même défaut** — les réglages IA portaient un **repli positionnel
écrit en français** : `t('ai.providers.custom_desc', 'API compatible OpenAI/Custom')`. Personne ne
voyait de clé brute, mais *l'anglais voyait le français de l'auteur*. Les traduire était juste ; les
compter comme des clés manquantes aurait rendu le contrôle bavard. Il les laisse donc passer, et les
replis restent en place.

**Le contrôle lit désormais les clés sans préfixe**, en résolvant le namespace sur le `useTranslation`
du fichier. ⚠️ Un **tableau vaut « l'un des deux »** : i18next parcourt les namespaces dans l'ordre et
rend le premier qui répond — *exiger le premier ferait échouer le test sur du code qui marche*. Sa
portée passe de ~500 appels à plus de 1 200, et son seuil de garde monte avec elle.

⚠️ Piège gardé pour la suite : **les pluriels**. `itemsCount` n'existe que sous `itemsCount_one` /
`_other`, et un contrôle naïf le déclarerait manquant — `sait()` essaie les six suffixes d'i18next.

✅ **Éprouvé à l'envers** : en retirant `image.pad.stop` du français, le test nomme la clé et échoue.
*Un contrôle vert qui n'attrape rien ne vaut rien.*

#### 39d · ✅ TRAITÉ — Le storyboard était le seul enchaînement qui signait du nom du meneur

`useStoryboardStore` appelait `applyScene(moment.lightSceneId)` **sans `isAutomatic`**, seul des six :
les zones de la carte, Sound-OS deux fois, Music-OS et la restauration d'instantané le passent tous.
**Et la documentation d'`applyScene` cite nommément « un moment de storyboard » parmi les
enchaînements** — *le code contredisait son propre commentaire, et rien ne pouvait le dire.*

⚠️ **Le vrai défaut n'était pas le journal.** `lastManualSceneId` était écrasé : à la fin du son
suivant, le retour automatique ramenait la scène du storyboard **comme si le meneur l'avait choisie à
la main**. *Ça ne se voit pas en jouant le moment ; ça se voit trois minutes plus tard, sur une pièce
qui revient au mauvais endroit.*

Le `setActiveScene` qui suivait est **retiré, pas corrigé** : `applyScene` le fait déjà, avec le même
drapeau. *Deux écrivains pour une même donnée est le motif que ce dépôt paie le plus souvent* — et
celui-ci écrivait l'inverse de l'autre.

**Le contrôle qui tient la règle** : *hors de Light-OS, personne ne clique.* Un appel venu d'un autre
module n'a pas de doigt derrière lui — la frontière est nette, donc la règle n'a pas besoin
d'exceptions. ⚠️ Le Spotlight fait exception à l'œil mais pas à la règle : son `applyScene` est celui
du magasin d'**ambiance**.

✅ **Éprouvé à l'envers** : en retirant le drapeau, le contrôle nomme le fichier et échoue. ⚠️ Et il
s'est trompé une première fois — *la glob rend des chemins relatifs au test*, donc les sources de
Light-OS commencent par `./` et non par `/light/` : il accusait la tuile qu'on clique. *Un contrôle qui
se trompe est pire qu'un contrôle absent.*

#### 39e · ✅ TRAITÉ — Un moment de storyboard a sa ligne, et ses effets se taisent

Trouvé en fermant le § 39d : un seul moment produisait *« Musique : X »*, *« Ambiance : X »* et
*« Lumières : X »* — **et pas une ligne ne disait quel moment avait été joué.** Le § 39d n'avait traité
que la troisième, parce qu'`applyScene` avait déjà son drapeau ; les deux autres journalisaient **sans
condition**.

David a tranché : **une seule ligne, celle du moment.** Music-OS et Ambient-OS reçoivent donc le même
drapeau, avec le même sens qu'ailleurs — *il dit d'où vient le geste et ne décide que du journal* — et
le storyboard parle à leur place, **avant** d'orchestrer, comme `applyScene` : *ce qu'on note est
l'intention du meneur, et elle ne devient pas fausse si une piste manque à l'appel.*

⚠️ **La question qui a trouvé les deux autres** est celle qui a déjà payé trois fois ce mois-ci :
*qui d'autre a la même rustine à poser ?* Corriger les lumières seules aurait laissé le journal à deux
lignes muettes sur leur cause — le même défaut, en plus discret.

Le contrôle des gestes tient désormais le trio ensemble : **les trois appels du storyboard doivent
finir par `true`**. Éprouvé à l'envers sur celui de la musique. Deux tests existants épinglaient les
arguments exacts de `playPad` et `applyScene` : ils sont mis à jour, et *ce sont eux qui documentent
maintenant qu'un moment est un enchaînement.*

*Code mort relevé au passage, sans conséquence :* `FogEngine.isPointRevealed` et
`CrossWindowEventService.getLocksVersion` n'ont aucun appelant — le second a pourtant un test, qui
éprouve donc du code que rien n'utilise.

**Ce que l'audit n'a pas balayé**, pour que le silence ait un sens : rien sur l'ergonomie, sur les
guides face au code, sur les performances ni sur la sécurité. **Uniquement les chaînes cassées et les
noms sans emploi.**

**Ancres** : `electron/preload.ts`, `src/types/window.d.ts`, `src/modules/ai/RAGService.ts`,
`electron/pontDeclareEtExpose.test.ts`.

### 40 · ✅ Changer l'image d'un joueur — le geste existait, l'endroit non (2026-09-09)

*« Juste un détail, je voudrais être capable de changer l'image d'un joueur »*, capture à l'appui du
panneau de droite du Roster. ✅ **Vérifié à l'écran le soir même** : *« si j'ai vu et c'est correct »*.

⭐ **Le geste existait déjà**, sur la vignette de 40 px de la liste de gauche : survol, appareil photo,
médiathèque, `updatePlayer`. La chaîne entière était bonne — j'ai vérifié avant de répondre, échaudé
par le § 39b où j'avais annoncé morte une fonctionnalité vivante.

**Ce qui manquait, c'est l'endroit où l'on clique.** Le seul portrait visible de cet écran — le grand,
à côté du nom et du compte de personnages — était une simple image, sans réaction ni indice. *David a
demandé la fonctionnalité en regardant précisément celui-là.* ⚠️ Une capacité qui n'existe que sur la
plus petite de ses deux représentations, derrière un survol, n'existe pas pour qui la cherche.

Les deux portraits ouvrent désormais la même médiathèque. ⚠️ Deux portes, un seul écrivain : le magasin
(`updatePlayer`) ; les écrans ne font que demander.

*Au passage, le guide du cockpit décrivait les fiches de personnage et **rien sur la fiche du joueur
lui-même** — ni l'ajout, ni le portrait, ni la pastille en ligne. La section manquante est écrite.*

**Ancres** : `session/components/CharacterGrid.tsx`, `session/components/PlayerRoster.tsx`,
`documentation/User Guides/10-Session-OS-le-cockpit.md`.

### 41 · ⭐ La revue de code du 2026-09-10, et ce qu'elle a ouvert (2026-09-10/11)

*Demandée par David : « fais un code review de l'application ». Cinq lots de correction en sont
sortis, puis un chantier de sécurité que la revue n'avait pas vu venir.*

**Le relevé de départ** : `tsc -b` propre, **3 978 tests au vert**, et `npm run lint` **rouge à 585
erreurs** — donc plus jamais lancé. *C'est pourtant lui qui a trouvé les deux vrais bugs de la revue.*

| Lot | Ce qui était | Ce qui est |
| --- | --- | --- |
| **1** | ⛔ `current={Number(x) ?? repli}` — `Number()` rend `NaN`, jamais `null` : **le repli était du code mort** et la barre de vie affichait `NaN`. **Trois des cinq branches levaient** une `TypeError` sur un `data` incomplet. | Trois lecteurs dans `HealthInterpreter`, employés par les cinq branches **et** par les dix lectures internes de l'interprète. |
| **2** | Quatre implémentations de « ce chemin est-il sous cette racine ? », dont deux fausses (`startsWith` accepte le dossier **voisin**). | `electron/sousChemin.ts`, onze appelants. `strictementSous` / `sousOuEgal` — *l'arbitrage se fait au nom appelé*. |
| **3** | 27 crochets React **conditionnels** dans `useHubSync`. Ils ne tenaient que parce que le graphe d'imports d'`App.tsx` charge les huit magasins avant le premier rendu. | `useMagasin` appelle `useSyncExternalStore` **toujours** : le compte devient invariant par construction. |
| **4** | 585 erreurs de lint, dont 468 pour `no-explicit-any`. | `warn` pour celle-là, `require` toléré dans les tests. **585 → 69**, presque toutes réelles. |
| **5** | Trois marges de « défense en profondeur ». | `nosniff` posé ; les deux autres se sont révélées être des chantiers — voir plus bas. |

**Trois défauts trouvés en corrigeant, et non à la revue :**

- ⛔ **`ai:delete-doc` avec un chemin VIDE supprimait tout le corpus.** `path.join(root, '')` rend
  `root`, que `startsWith(root)` acceptait, et `fs.remove` faisait le reste. *Seule la question « la
  racine est-elle dedans ? » l'a fait apparaître.*
- ⚠️ **`anatomy` crashait aussi** — le plan le laissait « à vérifier ». C'est la dégradation qui a
  tranché, pas la lecture.
- ⚠️ **`Number(null)` vaut 0**, et `Number('')` aussi : un lecteur bâti sur `Number.isFinite` seul
  aurait rendu 0 — division par zéro pour `max`, personnage annoncé mort pour `current`.

#### 41a · ⛔ Le pont générique, et la fuite qu'il cachait

Le préload exposait `on` / `off` / `send` / `invoke` sur **n'importe quel canal**. Six canaux y
transitaient sans figurer dans aucun contrat, dont `remote:eject-all`. Mais le vrai motif était
ailleurs :

> **`off` ne retirait JAMAIS rien.** `on` enregistrait une enveloppe anonyme et `off` demandait le
> retrait de la fonction d'origine. Electron compare par référence. **Tout abonnement passé par ce
> pont était définitif.**

Trois fuites que ce silence cachait : `fetchDisplays` posait un écouteur **à chaque appel**, les deux
écouteurs d'`App.tsx` n'étaient pas dans le nettoyage de leur effet, et **`map:ping` écoutait un canal
qu'aucun émetteur n'alimente** — son `off` visant en prime une autre fonction que son `on`.

Deux autres, du même geste :

- ⛔ **`sendSync` avalait le rôle** — le défaut corrigé pour `broadcastUIAction` **une ligne plus
  bas**, jamais reporté. C'est pour ça que le synchroniseur passait par le générique : il envoie la
  charge complète aux rôles `gm`/`remote` et une charge **caviardée** aux `player`/`hub`. *« Nettoyer »
  en passant à `sendSync` aurait envoyé la version non caviardée sur toutes les tablettes.*
- ⛔ **`backup:before-quit` pouvait avoir DEUX abonnés.** `StrictMode` monte chaque effet deux fois et
  le principal attend avec `ipcMain.once` : la première réponse libère la fermeture, et la plus rapide
  est celle qui n'a rien écrit. C'est le défaut Ulanzi du 30/08, jamais reporté sur le jumeau — **celui
  qui porte la sauvegarde automatique**.

⭐ **La leçon de méthode** : *retirer le générique du **type** plutôt que le filtrer.* `tsc` devient
alors l'inventaire — il a trouvé **trois appelants que `grep` avait ratés** et un canal absent de mon
relevé. Une liste blanche écrite à la main les aurait tous manqués, et le mode d'échec aurait été le
silence.

#### 41b · 🔑 La garde des clés d'API

La liste blanche d'hôtes ne tenait pas : le fournisseur **Custom** existe pour joindre l'endpoint que
le meneur nomme. Le contrôle porte donc sur **quelle clé a le droit de partir vers quel hôte** — et le
relevé des appels a déplacé le risque là où je ne l'attendais pas : **Gemini met sa clé dans l'URL**
(`?key=`, six endroits), là où Anthropic la met en en-tête. *Une clé dans une URL atterrit dans les
journaux du serveur d'en face.*

Deux paliers :

1. **Le processus principal pose la clé** (`clesDesFournisseurs.ts`), depuis le coffre, au vu du
   fournisseur déclaré. ⛔ **Le journal recrachait ce qu'on venait de protéger** : `main.ts` écrivait
   l'URL entière dans son message d'erreur — donc la clé de Gemini dans `main.log`.
2. **L'écran ne détient plus rien** : `useAIStore` ne connaît que `clesPresentes`, obtenu par
   `etatDuCoffre()` qui rend les **noms** des entrées. Le type `AIModelConfig` n'a plus de champ
   `apiKey`.

⛔ **Le champ de saisie écrivait au coffre À CHAQUE FRAPPE.** Taper une clé de quarante caractères y
déposait quarante versions tronquées, dont trente-neuf fausses. L'écriture est maintenant un **geste**.

⚠️ **La course de la réhydratation n'a pas disparu, elle a changé d'objet.** `clesPresentes` se remplit
depuis le coffre au démarrage, donc de façon asynchrone — exactement comme les clés avant lui.
`fusionnerEtatIA` le préserve donc de la même manière, sans quoi toutes les mentions « configurée » se
videraient après l'ouverture et inviteraient à retaper des clés déjà présentes. *C'est le geste qui a
failli les perdre en août.*

**Pour le meneur, le geste change : on ne relit plus une clé, on la remplace.**

#### 41c · Ce qui reste

- ⚠️ **Aucune de ces corrections n'a été éprouvée à l'écran.** Les tests couvrent la logique, pas le
  geste — et c'est là que David trouve les défauts depuis des semaines. **Saisir une clé pour de vrai**
  est la seule vérification qui manque.
- Les **69 erreurs de lint** restantes, dont 13 `set-state-in-effect` et 7 `react-hooks/refs` : le tas
  suivant à trier.
- Les **448 `any`** : concentrés dans les chemins de synchronisation, où le typage réel demanderait de
  décrire les charges utiles échangées entre fenêtres. *Un chantier, pas une correction.*

**Relevé de sortie** : `tsc -b` propre, **4 047 tests** (+69), lint **69 erreurs** (−516).
Six commits, de `df836c65` à `f1b0f9a9`.

**Ancres** : `session/logic/HealthInterpreter.ts`, `electron/sousChemin.ts`,
`session/hooks/useHubSync.ts`, `electron/preload.ts`, `electron/hotesDesFournisseurs.ts`,
`electron/clesDesFournisseurs.ts`, `src/stores/useAIStore.ts`.

**Les quatre contrôles posés**, tous vérifiés par dégradation — *un test qui reste vert sur le bug
qu'il prétend garder ne garde rien* : `donneesIncompletes.test.tsx`, `sousChemin.test.ts`,
`magasinsQuiApparaissent.test.tsx`, `pontSansCanalLibre.test.ts`, `lesClesNeVoyagentPas.test.ts`.

#### 41d · ⛔ Le profil des données a basculé — et ce que ça a appris (2026-09-11)

*Au réveil, David relance GM-OS et trouve **« The Eternal Quest » à la place de ses sept campagnes**.
Son message : « tu as perdu les campagnes ».*

**C'était moi.** En sortant `securityManager` de `registerSecurityHandlers` au § 41b — pour que le
proxy IA lise le même coffre — j'en ai fait une **instance de niveau module**. Son constructeur
appelait `app.getPath('userData')`.

> `app.getPath('userData')` ne lit pas un chemin : il le **VERROUILLE** pour toute la vie du
> processus, d'après le nom de l'application **au moment de l'appel**.

`main.ts` pose `app.name = 'gm-os-v5'` en ligne 22 — `package.json` s'appelant `gm-os-v6` — avec
précisément ce commentaire : *« lock the storage path before any getPath calls »*. Les imports
s'évaluant avant le corps du module, mon appel tombait **1 643 lignes avant** ce verrou dans le
paquet construit : `new SecurityManager()` en 51140, `app.name` en 52783.

Toutes les données ont donc basculé sur le profil **`gm-os-v6`**, vide. Un magasin neuf se remplit de
ses données de démonstration. *Rien n'était perdu — tout était ailleurs, et rien ne le disait.*

**⭐ Le filet a tenu, et c'était sa première mise à l'épreuve réelle.** Les sept campagnes étaient
dans les **17 sauvegardes automatiques** de `Security_Backup_GMOS`, la plus récente du 9 septembre à
22:56:38 ; les clés d'API dans `gm-os-v5/vault/secrets.enc`, intactes. David a relancé, restauré, et
confirmé : *« tout fonctionne »*.

**Ce que le diagnostic a demandé, dans l'ordre** — et c'est la partie réutilisable :

| Question | Réponse, et ce qu'elle a écarté |
| --- | --- |
| Les sauvegardes ont-elles les campagnes ? | 7, dans les 4 plus récentes. *La panique tombe ici.* |
| Le magasin vivant contient quoi ? | `c-1` « The Eternal Quest » — la signature des mocks |
| Quand a-t-il été écrit ? | **9 sept. 22:56:04**, deux jours avant mon travail |
| L'application a-t-elle tourné depuis ? | `main.log` s'arrête au 9 sept. — **non** |
| Alors où a tourné celle de ce matin ? | ⭐ `gm-os-v6/logs/main.log`, **11 sept. 07:59** |

*La quatrième réponse semblait m'innocenter. C'est la cinquième qui a trouvé le défaut — et elle n'a
été posée que parce que la quatrième contredisait ce que David décrivait.* **Une contradiction entre
les traces et le témoignage est un indice, pas une erreur du témoin.**

⚠️ **Deux causes, le même écran.** Le magasin `gm-os-v5` portait *déjà* les mocks depuis le 9
septembre au soir, indépendamment de mon défaut. Sans lui, David aurait vu le même écran. Les deux
demandaient la même restauration.

⚠️ **La question « GM-OS tourne-t-il ? » ne protège PAS de cette famille.** Je l'ai posée en ouverture
de session et David avait répondu non. Elle couvre l'écriture concurrente pendant le rechargement à
chaud — **pas ce qu'un changement fait au démarrage suivant**.

⚠️ **Et le commentaire qui énonçait la règle vivait dans `main.ts`**, alors que mon changement était
dans `SecurityManager.ts`. *Une règle écrite là où on la lit ne couvre pas là où on l'enfreint.* D'où
le contrôle plutôt qu'un commentaire de plus : `electron/verrouDuCheminDeDonnees.test.ts` interdit
`app.getPath` dans un constructeur **et** au niveau module, pour les 24 modules importés par
`main.ts`. 50 tests ; remis le défaut, deux rougissent.

**Le correctif** : le chemin du coffre se résout au **premier besoin**, par un accesseur paresseux.
Les sept autres `getPath('userData')` du processus principal sont audités — tous déjà paresseux, sauf
celui de `main.ts`, qui vient après le verrou.

**Ancre** : `electron/SecurityManager.ts`, commit `0d87cc8e`.

### 42 · ⭐ La garde d'exécution sur le chemin de données (2026-09-12)

*Le geste recommandé la veille au § 1 de l'état du 12/09. Il vise précisément le défaut du 11/09 —
et il ferme le seul trou que `npm run repetition` ne peut pas boucher, puisqu'elle passe
`--user-data-dir` et court-circuite exactement le mécanisme qui a cassé.*

**Ce qui manquait.** Le test de source `verrouDuCheminDeDonnees.test.ts` interdit les deux formes
connues du défaut — `app.getPath` au niveau module, et dans un constructeur. Il ne peut pas interdire
les autres : *un module peut toujours résoudre le chemin depuis une fonction appelée au niveau
module.* Et surtout, rien ne regardait le **résultat**. Le 11/09, GM-OS a verrouillé `gm-os-v6` et
**a démarré quand même**, sans un mot.

**La règle, et pourquoi elle a deux sens.** La répétition et les tests de bout en bout passent
`--user-data-dir` : leur profil n'est **légitimement pas** celui du meneur. Une garde qui exigerait
`gm-os-v5` sans distinguer les empêcherait tous de démarrer. D'où une seule comparaison, lue dans les
deux sens :

> **Le verrou doit porter sur le vrai profil exactement quand aucune isolation n'a été demandée.**

| `--user-data-dir` | Profil verrouillé | Verdict |
| --- | --- | --- |
| absent | le vrai | ✅ démarrage ordinaire — **le profil est nommé au journal** |
| absent | un autre | ⛔ le défaut du 11/09 : arrêt avant d'écrire |
| présent | un autre | ✅ répétition ou test, bien isolé |
| présent | **le vrai** | ⛔ isolation ratée — *un essai s'apprête à écrire dans les vraies données* |

⭐ **La quatrième ligne n'est pas une symétrie gratuite.** `e2e/lancerGmOs.ts` vérifiait l'isolation
depuis Playwright ; `scripts/repetition.mjs` ne la vérifiait **pas du tout**. Posée dans le processus
principal, la vérification vaut pour tout ce qui démarre GM-OS, présent et à venir — *un contrôle
placé dans l'appelant ne couvre que cet appelant.*

**L'arrêt n'est pas muet** : `main.log`, la console, **et** `dialog.showErrorBox` (permis avant
`whenReady`, et il le faut). *Un arrêt silencieux serait un second échec muet là où on vient d'en
payer un.*

**Et le journal parle même quand tout va bien.** Le profil verrouillé est écrit à **chaque**
démarrage, accepté ou non. C'est ce qui manquait le 11/09 pour trancher en trente secondes au lieu de
cinq questions de diagnostic.

⚠️ **L'appel de la garde est le premier `app.getPath` de `main.ts`** — celui que le test de source
surveille. Le verrou se pose donc à un endroit qu'on peut montrer du doigt, après `app.name`.

**Vérifié en vrai, et pas seulement en test** : une instance lancée avec `--user-data-dir` sur un
profil jetable démarre et écrit `[Profil] Profil isolé verrouillé : « … » (--user-data-dir)` dans son
`main.log`. ⛔ **La branche du refus n'a PAS été rejouée sur le vrai profil** — c'est justement celle
qu'il ne faut pas répéter sur les données de David ; elle est tenue par deux tests unitaires.

**Ancres** : `electron/gardeDuProfil.ts`, son branchement en tête de `electron/main.ts`,
`electron/gardeDuProfil.test.ts` (8 tests). `tsc -b` propre, **4 180 tests au vert** (350 fichiers,
1 ignoré), **les 9 tests E2E au vert** — c'est eux qui prouvent que la garde laisse passer ce qu'elle
doit laisser passer.

### 43 · ⭐ La donnée gelée — un témoin pour les tests, et le premier test de migration (2026-09-12)

*Le second geste du § 1 de l'état du 12/09. Il ferme le dernier trou nommé : `PersistenceService` était
en `version: 10` avec un `migrate` que **rien n'exerçait**.*

#### Le pivot : ce sont deux besoins, une seule donnée gelée

Ils portent le même nom et n'ont ni le même format ni le même chemin d'entrée :

| | La campagne témoin | La base ancienne |
| --- | --- | --- |
| **Sert à** | le décor des tests E2E | éprouver `migrate` |
| **Enveloppe** | `{ version, timestamp, global, modules }` | `{ state, version }` |
| **Entre par** | `GMOS_SEMENCE` → `validateSession` → `distributeData` | **la réhydratation** |

⭐ **Mais le contenu est le même**, et ce n'est pas une coïncidence : `partialize` range
`lesDonneesDeLaSession(state)`, qui est exactement ce que `modules.sessionOS` capture — le commentaire
de `partialize` le dit déjà. La base ancienne se **dérive** donc du témoin dans le test, au lieu de
vivre dans un second fichier. *Une donnée gelée qui vit à deux endroits en désigne une fausse* — la
règle que ce document applique à ses listes de restes.

⭐ **Et on ne fabrique pas une vieille base : on en gèle une jeune.** Le témoin est figé aujourd'hui ;
c'est le code de demain qui le rendra ancien, sans que personne n'y touche.

#### Ce qui est entré

| | Quoi | Où |
| --- | --- | --- |
| **Le témoin** | 8 Ko, fabriqué et non copié — *une vraie sauvegarde fait 1,4 Mo et porte les sept campagnes de David : ni le poids ni le contenu n'entrent dans un dépôt*. Une campagne, 2 joueurs, 2 PNJ, 2 actes, 3 scènes, un paquet avec une carte en main | `e2e/donnees/campagne-temoin.json` |
| **Son gardien** | 12 tests : il passe `validateSession`, il ne perd ni `actes` ni `scenes` ni `decks` (les champs que seul `.passthrough()` fait traverser), ses identifiants sont préfixés, son horodatage est fixe, et sa cohérence interne tient | `campagneTemoinGelee.test.ts` |
| **La semence en E2E** | `lancerGmOs({ semence: CAMPAGNE_TEMOIN })`, facultative. Sans elle, le décor d'usine — qui suffit et ne coûte rien | `e2e/lancerGmOs.ts` |
| **Le test de migration** | Écrit une charge en `version: 9` par la porte de l'application elle-même, **recharge la fenêtre**, et vérifie que rien n'a disparu | `e2e/baseAncienne.spec.ts` |

**Mesuré** : `[Store Migration] Migrating from version 9 to 10` apparaît au journal, et la campagne, les
2 actes, les 3 scènes et la carte en main sont tous là après le rechargement.

#### Ce qui a été appris, et qui coûtera cher à quelqu'un d'autre

⛔ **`campaigns.length > 0` n'est PAS un signal d'hydratation.** Le magasin naît avec `INITIAL_DATA` :
la condition est vraie **avant** la moindre lecture d'IndexedDB. C'est la méprise de la garde de la
semence en août, à l'identique — *une base neuve n'est jamais vide.*

⛔ **Et la conséquence était muette.** `gmOnlyStateStorage.setItem` refuse d'écrire tant que la base
n'a pas été relue, **et retourne sans rien dire**. L'écriture du test disparaissait sans erreur, puis
l'application persistait son propre état par-dessus. Trois hypothèses fausses avant de simplement
demander à Zustand ce qu'il savait déjà : `persist.hasHydrated()`. *Les deux — le verrou d'écriture et
ce drapeau — sont posés par le même `onRehydrateStorage`.*

⭐ **Le test de contrôle compte autant que l'autre.** Une seconde instance démarre **sans** semence et
vérifie qu'elle porte le décor d'usine. Sans lui, « la campagne du témoin est à l'écran » pourrait être
vrai pour une raison étrangère à la semence. *Une assertion qui ne peut pas échouer ne mesure rien.*

⛔ **Un jeu d'essai qui se dégrade laisse les tests VERTS.** Si le témoin cesse un jour de passer la
validation, la semence est refusée — et le test E2E continue de tourner, sur la campagne de
démonstration, avec un décor qui n'est pas celui qu'il croit. D'où un gardien qui, lui, rougit.

⛔ **Le lanceur E2E efface désormais toutes les `GMOS_*` héritées du terminal.** Une `GMOS_SEMENCE`
posée à la main pour une répétition serait entrée dans les tests. Elle n'aurait rien détruit — la
semence lit un fichier — mais *un test vert ou rouge selon le shell ne prouve plus rien.*

⚠️ **Le témoin est rattaché au système `generic`, et c'est voulu.** L'écran affiche un avertissement
(« gabarit de fiche et non un jeu ») qu'on pourrait prendre pour un oubli. Une instance de test vise un
corpus **vide** : aucun pilote de jeu n'y existe. *Un témoin qui déclarerait un jeu absent serait moins
honnête que celui qui n'en déclare aucun.*

⚠️ **Ce que le format de sauvegarde ne porte pas, et qu'on ne peut donc pas geler ainsi** : les combats
garés. Ils vivent dans `useCombatStore`, qui n'entre dans aucune sauvegarde. Mon plan du jour annonçait
« un combat garé dans le témoin » — il n'était pas réalisable, et le dire vaut mieux que de simuler un
champ qui n'existe pas.

⚠️ **Le contrat que `baseAncienne.spec.ts` énonce n'est pas le code d'aujourd'hui.** `migrate` est un
passe-plat ; l'assertion est **« une base ancienne ne perd rien »**. Le jour où une vraie migration
sera écrite, ce test devra continuer à passer — sinon c'est la migration qui détruit, pas le test qui
vieillit.

**Ancres** : `e2e/donnees/campagne-temoin.json`, `e2e/semerUneCampagne.spec.ts`,
`e2e/baseAncienne.spec.ts`, `src/modules/session/data/campagneTemoinGelee.test.ts`. `tsc -b` propre,
**4 192 tests au vert** (351 fichiers, 1 ignoré), **17 tests E2E au vert** (contre 9 la veille).

### 44 · ⛔ La boucle de Light-OS — GM-OS inutilisable hors de chez soi (2026-09-12)

*Trouvée par David, **en déplacement**, l'écran bloqué et la console qui défilait : « il y a une
boucle sur light-os ».*

`useHueAutoConnect` avait `status` dans ses dépendances **et écrivait `status`** :

```
disconnected → setConnection('discovering')   ← l'effet se rejoue
             → fetchLights() … expire à 5 s
             → setConnection('disconnected')  ← l'effet se rejoue
```

⛔ **Tant que le pont répond, le cycle s'arrête au premier succès et rien ne se voit.** Il a fallu
un pont resté à la maison pour le révéler. *Un défaut qui ne se déclenche qu'ailleurs ne se voit
jamais au bureau* — et celui-là avait vécu des mois.

**Le correctif tient en deux pièces, et la première ne suffisait pas.**

| | Quoi | Pourquoi |
| --- | --- | --- |
| 1 | `status` quitte les dépendances | ⭐ **Un effet ne se rejoue pas sur ce qu'il écrit.** L'état frais se lit toujours par `getState()` |
| 2 | Une politique séparée et testée — plafond 4, recul 0,5 / 3 / 15 / 60 s, **abandon annoncé** | Sans plafond, **une seule chaîne de rappels** aurait reconstitué la boucle. La terminaison ne doit pas dépendre d'un tableau de dépendances |

⭐ **On s'arrête, et on le dit.** Le meneur doit distinguer « je n'ai pas essayé » de « le pont ne
répond pas » : *un abandon silencieux se lit comme une panne de GM-OS ; un abandon annoncé se lit
comme une panne du pont.*

**Mesuré en conditions réelles** (pont injoignable, jeton en coffre, paquet construit) : tentatives
à 0,8 / 8,8 / 28,8 / 93,8 s, abandon à 98,9 s, puis **silence**. ✅ **Éprouvé par David le jour
même** : *« le correctif light-os fonctionne »*.

⚠️ **Ce que je n'ai PAS prouvé, et il faut le dire** : que cette boucle causait l'écran bloqué. Dans
la reproduction, l'écran restait **cliquable** pendant toute la boucle. Trois hypothèses fausses
avant d'arriver là — un minuteur de splash remis à zéro à chaque rendu (démenti : personne n'écrivait
pendant 20 s), puis « le mode dev est cassé » (démenti : mes sondes visaient `localhost:5173` et
n'ont jamais chargé la page, le piège IPv6 que `main.ts` contourne pour lui-même). *Une sonde qui ne
charge pas la page rend un verdict quand même.*

**Ancres** : `light/logic/reconnexionAuPont.ts` (12 tests), `light/hooks/useHueAutoConnect.ts`,
commit `c973421f`.

### 45 · ⭐ La trame écrit au journal, et le filet retrouve sa prise (2026-09-12)

*Question de David : « lorsque je lance une scène, il ne doit pas y avoir une entrée dans le
journal ? ». **Non, il n'y en avait aucune.***

`ouvrirLaScene` et `terminerLaScene` ne touchaient pas au journal. Et ça coûtait bien plus qu'une
ligne manquante dans le fil :

⛔ **Une scène ouverte mais silencieuse n'existait pas dans la revue de séance.**
`preparerLaRevue` part des **événements**, jamais de la trame — zéro événement, aucun bloc, donc ni
fusionnable, ni scindable, ni résumable.

⭐ **Et c'est là que ça faisait mal.** Le plan du 08/08 (§ 3.2) accepte explicitement qu'un
changement de scène soit oublié — *« un marquage manqué est réparable, pas perdu »* — et nomme son
filet : **« la revue de fin de séance permet de scinder une scène »**. Or ce filet ne s'affichait que
pour les scènes portant déjà des événements. **Le filet était absent précisément dans le cas qu'il
devait rattraper.** C'est exactement ce que David a rencontré en essayant la fusion.

#### Ce que l'entrée contient — demande de David dans la foulée

> *« je veux que tu notes les infos intéressantes (si le journal en a besoin — le synopsis de la
> scène), les joueurs présents, le lieu, etc. »*

```
Scène ouverte : La voix dans le relais

Acte : Ce que Hale n'a pas dit
Lieu : Station Varn
PJ présents : Nel Varga, Idris Koa
PNJ : Ancre-7

Ancre-7 prend la parole sans qu'on l'appelle.
```

| Décision | Pourquoi |
| --- | --- |
| **Les noms, jamais les identifiants** | « PJ présents : pj-1 » ne se relit pas six mois plus tard. La résolution se fait dans le magasin — seul à connaître l'état ; la fonction reste pure et testable. Un identifiant qui ne désigne plus personne est **sauté** |
| **Une rubrique vide disparaît** | *Une rubrique vide affirme un manque ; une rubrique absente n'affirme rien* |
| **`SYSTEM`, donc `trace`** | La scène devient visible dans la revue **sans** entrer dans le résumé — qui reçoit déjà sa structure par `leRecitCureDuJournal`. Même décision que l'ouverture de combat |
| **`sceneId` posé explicitement** | `laSceneCourante()` ne répondrait pas : la scène qu'on ouvre n'est pas encore en cours. *L'émetteur qui sait garde la main* |
| **Rien si le geste ne change rien** | Scène déjà ouverte, déjà terminée : *une trace d'un geste sans effet est un mensonge sur le parcours* |
| **« Scène rouverte »** | Ranimer une scène terminée, c'est revenir sur ses pas — et ça se relit |
| **La fermeture dit la durée jouée** | Somme des passages, celui encore ouvert arrêté à l'instant du geste (**un seul `Date.now()`, partagé**). Ou « Close sans avoir été jouée » — *les confondre ferait croire à une partie qui n'a pas eu lieu* |

⛔ **L'écriture se fait HORS du `set` de Zustand.** Un `set` est un calcul d'état ; y glisser une
écriture au journal en ferait un effet de bord que chaque test déclencherait — la leçon déjà payée
par la sonnerie du minuteur (§ C3). Et **sous garde `isRecording`**, sans quoi préparer sa trame un
dimanche remplirait un journal archivé.

#### Ce que la reproduction Playwright a établi sur la fusion

⭐ **Le geste marchait.** Moteur (30 tests depuis le 21/08), magasin, écran : tout était en place.
Ce qui manquait était **les conditions d'apparition** — quatre, silencieuses, dont aucune ne
s'explique à l'écran. Elles sont maintenant figées par 3 tests E2E et écrites **une seule fois**,
dans le guide du journal.

⛔ **Et le témoin gelé de la veille portait trois défauts nés le matin même** : `closeLe` (chaîne
ISO) là où le moteur lit `termineeLe` (un nombre), un `passages` inventé, et `creeeLe` absent alors
qu'il est obligatoire. Rien ne l'avait signalé — *les assertions comptaient des **longueurs***.
« `scenes` n'est pas vide » était vrai d'un tableau de scènes inutilisables.

⭐ **Le remède n'est pas de redécrire la forme dans le test** — ce serait la recopier, donc la
laisser vieillir. Deux gardes : une **affectation typée sans `as`** (c'est `tsc` qui refuse un champ
manquant ou mal typé), et l'état des scènes **jugé par `etatDeLaScene`**, la fonction que
l'application emploie.

**Ancres** : `session/logic/journalDeLaTrame.ts` (21 tests), `session/store/trameSlice.ts`,
`e2e/ouvrirUneScene.spec.ts`, `e2e/curerLaTrame.spec.ts`, commits `4db1e241` et `c50d5c20`.

### 46 · ⭐ Les tests E2E par module — et ce que le premier filet a trouvé (2026-09-12)

*Demande de David : « peux-tu faire des modules de test E2E pour chaque module de GM-OS ». Premier
lot : le filet large, puis Dice-OS, Combat-OS, Clock-OS, Deck-OS — les quatre où un défaut ne se voit
jamais en séance et coûte cher.*

**De 9 tests E2E à 70.**

| Fichier | Ce qu'il garde |
| --- | --- |
| `tousLesModules.spec.ts` | Les 21 modules ont leur bouton, s'ouvrent, affichent quelque chose — **et la traversée ne produit aucune exception** |
| `diceOs.spec.ts` | Les sept dés, la plage d'un d20 **sur cinq tirages**, l'accord entre total et somme, la formule annoncée, l'historique |
| `combatOs.spec.ts` | Ajouter un combattant, l'initiative auto, le round qui bascule — et ⭐ **la bascule de combat entre deux scènes** |
| `clockOs.spec.ts` | Les jauges (création, remplissage), ⭐ **une jauge neuve naît SECRÈTE**, le minuteur en secondes, les modes |
| `deckOs.spec.ts` | ⭐ **Le recensement après chaque geste** — pioche + défausse + main + carte retournée = le compte du paquet |

**Deuxième et troisième lots (le même jour) — la famille « geste complet testable » est close :**

| Fichier | Ce qu'il garde |
| --- | --- |
| `whiteboardOs` | Les cinq outils, un trait au crayon, ⭐ **le laser qui s'efface seul**, annuler/rétablir — et ⭐ **un trait qui survit à un aller-retour**, le défaut exact corrigé le 2026-06-17 |
| `npcOs` | Le générateur, ses listes, ⭐ **un tirage sans aucune clé d'API** (l'IA n'est qu'un enrichissement) |
| `webOs` | Les liens d'usine, le formulaire **en modal**, et un lien qui survit à un changement de module |
| `tableOs` | ⭐ **La chaîne des trois maillons** : l'univers peuple les tables, la table peuple le tirage, le tirage rend une ligne |
| `lootOs` | Les trois temps, et ⭐ **les états vides qui disent POURQUOI** — deux de ses trois sources sont hors de portée (IA, corpus) |
| `favorisOs` | Les filtres, et ⭐ **la recherche dans les deux sens** — ce qui reste *et* ce qui doit disparaître |

⚠️ **Loot-OS est le moins testable de tous, et le fichier le dit en tête.** Son générateur appelle un modèle, ses tables viennent du corpus : une instance d'essai n'a ni l'un ni l'autre. *Écrire des tests qui prétendraient les couvrir donnerait une couverture décorative.* Ce qui reste — les états vides — vaut pourtant : **un vide muet se lit comme une panne**.

**Quatrième lot — la famille « le geste oui, l'effet non » (7 fichiers, 133 tests au total) :**

| Fichier | Ce qu'il garde | Ce qu'il ne peut pas dire |
| --- | --- | --- |
| `musicOs` | Les deux platines, et ⭐ **à qui appartient une atmosphère** — sans étiquette, elle est **commune** (décision du 30/08, celle qui a évité toute migration) | Qu'un son sorte, et de quelle enceinte |
| `soundOs` | Les **seize** pads, l'atmosphère active, l'apprentissage de touche qui **s'éteint** | Qu'un bruitage se déclenche |
| `ambientOs` | Les huit pistes, et ⭐ **les thèmes livrés qui s'annoncent « gabarit, sans sons »** | La superposition, le fondu |
| `imageOs` | L'état vide, et ⭐ **le choix de l'écran cible** — *une projection mal dirigée ne se rattrape pas* | Qu'une image s'affiche |
| `lightOs` | L'absence de lampe **annoncée**, et ⭐ **l'existence du bouton « Arrêter la scène »** — celui qui manquait du 07 au 09/09 | Qu'une lampe change ; on ne clique ni « Mode simulé » ni « Blackout » |
| `voiceOs` | Les cinq voix, ⭐ **le débruitage à trois positions** et son coût annoncé, les quatre réglages de ducking | Toute la chaîne audio : pas de micro. ⚠️ **`useVoiceStore` n'est pas exposé sur `window`** — seul des dix-huit |
| `mapOs` | La météo, le moment, et ⭐ **que le reflet des joueurs ne suive PAS de lui-même** tant qu'on n'a pas projeté | Qu'une carte s'affiche |

**Cinquième lot — le Storyboard, et les modules d'IA (144 tests au total, 25 fichiers, TOUS les modules couverts) :**

| Fichier | Ce qu'il garde |
| --- | --- |
| `storyboardOs` | La pellicule vide **qui dit quoi faire**, l'éditeur, l'enregistrement, et la survie à un aller-retour |
| `modulesIa` | Cortex, Forge et Nexus Wiki **dans un seul fichier** — ils partagent la même limite totale (ni clé, ni modèle, ni corpus), et trois fichiers feraient croire à une couverture qui n'existe pas. Ce qui reste : qu'ils **s'ouvrent, se présentent et disent ce qu'ils attendent** |

⭐ **Cinq surprises de forme dans ce seul lot, et toutes m'ont fait accuser le code avant le test.** `campagneId` en français au milieu de champs anglais · `autoFadeDuration` en **millisecondes** là où l'écran dit « 5.0 s » · `scenes` de Light-OS est un **objet indexé**, pas un tableau · `[track-0]` est en **minuscules** dans le DOM et en majuscules à l'écran (c'est la CSS) · et `gmPrompt` ouvre un **modal interne**, pas une invite du navigateur. *On ne devine ni un nom de champ, ni une unité, ni une forme : on les lit.*

⭐ **L'item P6 de la bascule de combat est éprouvé**, trois semaines après avoir été garé. Le registre
demandait : *« ouvrir un combat dans une scène, changer de scène, revenir — combattants, round et
compteurs doivent tous revenir »*. Ils reviennent.

#### ⛔ Ce que le filet a trouvé dès le premier passage

| | Quoi |
| --- | --- |
| ⛔ **Les sept icônes de dés ne s'affichaient pas dans le paquet construit** | `DiceBoard.tsx` écrivait `/icons/D20b.png`, **absolu depuis la racine**. En dev, Vite le sert et tout va bien ; dans le paquet, la page est chargée par `loadFile`, donc en `file://`, et le chemin vise **la racine du disque C:**. ⭐ *Le défaut n'existait QUE dans ce qui serait livré — et David développe en dev.* Cas isolé, vérifié : une seule occurrence dans tout `src/`. Corrigé en relatif |
| ⚠️ **La Médiathèque n'est pas un panneau, c'est une surcouche modale** | Elle couvre la barre latérale ; tant qu'elle est ouverte, plus aucun module n'est cliquable. Le test la traversait comme les autres et bloquait sur le suivant |

#### ⭐ Et ce que ça corrige de ce que j'avais affirmé

Le matin même, je répondais à David que *« mes tests E2E n'ont découvert aucun bogue produit »*, et
j'en tirais que *« un test E2E ne découvre pas, il empêche de revenir en arrière »*. **La deuxième
moitié était fausse.** Un filet assez large découvre — encore faut-il qu'il soit large : les 4 230
tests unitaires ne montent aucun module dans la vraie application, et aucun ne tourne sur le paquet
construit.

#### Les leçons de méthode, pour le prochain lot

⛔ **Sonder avant d'écrire.** Chaque module a demandé une sonde jetable — libellés de boutons, forme
du magasin — avant la moindre assertion. Deux échecs sur trois de mes premières versions venaient
d'un **nom de champ inventé** : `initiative` au lieu de `init`, et j'en concluais que l'initiative
automatique ne servait personne. *Un champ absent se lit comme une valeur fausse, et accuse le code
au lieu du test.*

⛔ **Un test qui contredit le code n'a pas forcément raison.** J'ai écrit que remélanger devait
préserver les cartes en main. C'est l'inverse, **et c'est documenté dans `shuffleDeck`** — tout
revient au paquet, et une annonce le dit. Le test a été réécrit pour figer la règle **et son
annonce** : *le comportement seul serait un défaut ; c'est l'annonce qui en fait une règle.*

⚠️ **Le bruit s'autorise nommément.** `ResizeObserver loop completed` est un avertissement de
Chromium, pas une exception de l'application. Il figure dans une liste `BRUIT_CONNU` **avec sa
raison écrite** — *sans raison, une ligne n'a pas sa place, et le test doit rougir.*

⚠️ **Ce qu'aucun de ces tests ne dira** : une instance d'essai n'a ni média, ni clé d'API, ni corpus,
et ses appareils sont muets. Music-OS s'ouvre sur une bibliothèque vide, l'Oracle sans modèle,
Light-OS sans pont. *Qu'un module s'ouvre ne dit rien de ce qu'il fait quand il a de quoi travailler.*

**Ancres** : `e2e/tousLesModules.spec.ts`, `e2e/diceOs.spec.ts`, `e2e/combatOs.spec.ts`,
`e2e/clockOs.spec.ts`, `e2e/deckOs.spec.ts`, `src/modules/dice/DiceBoard.tsx`. **70 tests E2E verts.**

### 47 · ⭐ Les quatre constats du § 1 bis, traités (2026-09-12)

*Trois semaines de « constaté, pas encore traité » auraient suffi à les oublier. La case avait été
ouverte le matin même ; elle s'est vidée le soir.*

#### ⛔ 1. L'isolation du coffre Obsidian — le plus sérieux des quatre

`GMOS_COFFRE_OBSIDIAN` déplaçait bien le coffre, mais **chaque geste du pont acceptait un chemin
envoyé par l'écran**, et ne retombait sur la variable que si l'écran n'envoyait rien. Or l'écran en
envoie toujours un : `useObsidianStore` porte celui du meneur **en dur**. Toutes les exécutions E2E
lisaient donc le vrai coffre de David.

⭐ **Le remède n'est pas d'ignorer le paramètre**, qui est légitime — les réglages du meneur et
l'export vers Obsidian s'en servent. C'est de le **subordonner** : `coffreImpose(env)` rend le coffre
quand la variable est posée, et **rien** sinon. Hors instance isolée, rien ne change pour personne.

⭐⭐ **Et c'est la dégradation qui a sauvé le test.** Mon assertion de bout en bout passait *avec le
défaut remis* — parce que le heredoc du shell avait mangé les antislashs du chemin, et qu'elle
interrogeait donc une adresse invalide. **Un test vert qui ne peut pas rougir ne prouve rien**, et
seule la remise du défaut l'a montré. *Dégrader à l'identique, sinon la dégradation ne prouve rien* —
la règle du 2026-08-22, repayée.

**Ancres** : `perimetreDeLInstance.ts` (`coffreImpose`, 4 tests), `obsidian_bridge.ts`
(`racineDuCoffre`, 5 gestes), `e2e/ouvrirLAide.spec.ts` — l'assertion interroge le pont **comme le
ferait un écran fautif**, et compte sans nommer aucune note.

#### ⛔ 2. Le journal de séance n'était dans aucune sauvegarde

Onze magasins étaient collectés ; `useJournalStore` n'en faisait pas partie, et l'export Nexus ne le
portait pas non plus. **Le fil des séances, les scènes traversées et les comptes rendus n'étaient
protégés par rien.**

⭐ **Le code portait déjà la cicatrice précédente**, en commentaire dans `SessionService` : *« il y
manquait `entities`, `clues` et `sessions` »*. Même famille, même cause — *une liste de ce qu'on
sauvegarde, recopiée à la main, oublie toujours quelque chose.*

| Où | Ce qui a été fait |
| --- | --- |
| La sauvegarde | `journal` récolté et restauré — **on ajoute et on remplace par identifiant, on ne vide jamais** |
| Le schéma | `journal` déclaré : sans ça il serait écrit puis **jeté à la relecture**, `modules` n'étant pas `.passthrough()` |
| L'export Nexus | **Décision de David** : le journal voyage avec la campagne. ⚠️ Seuls ceux qui **connaissent** leur campagne partent — `campaignId` est facultatif, et *un journal rattaché à tort serait pire qu'un journal absent* |

**Ancres** : `SessionService.ts`, `schemas.ts`, `NexusService.ts`, `nexus.types.ts`,
`leJournalEstSauvegarde.test.ts` (4 tests).

#### ⚠️ 3. La Médiathèque — deux défauts pour un seul écran

Elle est une **surcouche plein écran** qui couvre la barre latérale, elle ne se fermait **qu'au
bouton**, et ce bouton s'intitulait **« Désactiver l'Interface »**. *Une surcouche dont on ne sait pas
sortir est un piège, pas une fenêtre.*

- **Échap la ferme**, comme les cinq autres surcouches de GM-OS — elle était l'exception, et une
  exception qu'aucune décision n'explique est un oubli.
- ⚠️ **Les modaux imbriqués passent d'abord** : sans cette garde, une seule frappe fermerait l'aperçu
  **et** la médiathèque derrière lui.
- Le bouton s'appelle **« Fermer la médiathèque »**.

#### ⚠️ 4. « Galerie PNJ » — et l'homonymie était pire que le mensonge

Le bouton de la barre latérale ouvre un **générateur**. Il s'appelle désormais **« Générateur PNJ »**.

⛔ **Mais le vrai défaut n'était pas le libellé : DEUX écrans portaient ce nom.** Celui-là, et la
**vraie galerie du cockpit**, qui liste bien les PNJ de la campagne. J'avais conclu qu'aucun écran ne
les listait — parce que cliquer « Galerie PNJ » tombait toujours sur le générateur. *Deux écrans de
même nom ne trompent pas que les tests.*

Troisième cas du motif après « Sync Oracle » et « Désactiver l'Interface ».

#### ⭐ Et un cinquième défaut, tombé de la vérification

En ouvrant la vraie galerie, l'écran affichait **`SESSION.NPC_GALLERY.ROLES.UNDEFINED`** — une clé de
traduction brute. La cause était **mon témoin** : ses PNJ n'avaient ni `role`, ni `status`, ni `ac`,
des champs **obligatoires** d'`Entity` que le schéma laisse passer en `z.any()`.

⚠️ *Une donnée d'essai incomplète ne produit pas un test plus tolérant : elle produit un écran faux
qu'on prend pour un défaut du code.* La garde de typage du témoin — posée le matin pour les scènes —
couvre désormais les entités, et l'exécution vérifie les valeurs des trois unions.

**Ce qui restait au § 1 bis** — l'écran bloqué au démarrage — est sorti dans la foulée : voir le § 48.

**Vérifié** : `tsc -b` propre, **4 239 tests** (355 fichiers), **145 tests E2E**.

### 48 · ⭐ L'écran bloqué au démarrage — la dernière ligne du § 1 bis (2026-09-12)

*Elle attendait une reproduction. Elle était lisible dans le code depuis le premier jour.*

#### ⛔ Ce n'était ni le splash ni `LoadingOverlay` — c'était le troisième écran

Le § 1 bis portait **deux questions pour trancher entre deux composants**. Les deux étaient les
mauvais. Le voile qui pouvait rester à l'écran pour toujours est celui d'`App.tsx`, affiché tant que
`isSystemReady` est faux, et il ne disait **que trois mots** :

```
GM-OS BOOTING...
```

⭐ **Personne ne l'avait nommé, et c'est exactement pourquoi il n'a pas été diagnostiqué.** Un écran
qui ne dit ni ce qu'il attend ni pourquoi il a renoncé ne se reconstitue pas le lendemain — *le
symptôme a disparu parce que la cause était transitoire, pas parce qu'elle était réparée.*

#### ⛔ Trois chemins qui ne finissent jamais, et chacun suffisait

| Attendu par `bootstrap()` | Comment ça bloque |
| --- | --- |
| `initDB()` | `openDB` **ne résout jamais** quand une autre fenêtre tient la base media à une version antérieure : le rappel `blocked` se contente d'un avertissement. **Projecteur, Player Hub et tablette partagent l'origine du meneur** — il suffit qu'une reste ouverte |
| les deux `syncWithKeychain()` | un `Promise.all` : **un seul rejet** et les étapes suivantes ne partent pas, `setSystemReady(true)` compris |
| le `catch` final | il laissait `isSystemReady` à `false` **exprès** — commentaire d'époque : *« on laisse isSystemReady à false pour bloquer l'interface si critique »*. Sans message, sans reprise, sans bouton |

⚠️ Et aucune de ces trois étapes ne porte les campagnes : elles arrivent par la réhydratation du
magasin persisté, qui ne passe pas par là. **Rien de ce que fait le démarrage ne justifiait de garder
le meneur dehors.**

#### ⭐ Le remède : ne pas chercher lequel des trois a bloqué

Sans reproduction, désigner un coupable aurait été deviner — j'avais déjà produit trois hypothèses
fausses ce jour-là. On retire **la possibilité** de bloquer :

1. chaque étape est **nommée** et **bornée** (15 s) — celle qui dépasse ne retient plus personne, elle
   se déclare ;
2. le démarrage **aboutit toujours** : `isSystemReady` est posé dans tous les cas ;
3. l'écran d'attente **dit l'étape en cours**, et nomme celles qui ont manqué.

⛔ **Le contrepoids, sans lequel le correctif serait pire que le défaut.** On a échangé un blocage
visible contre un démarrage amputé : une étape manquée doit donc **se voir** — à l'écran d'attente,
dans la console, et par une notification qui **nomme l'étape** (« 2 étapes ont échoué » n'aide
personne). *Une panne muette se découvre en séance.*

⚠️ **Expirer n'est pas annuler.** Une promesse ne s'interrompt pas : on cesse de l'attendre. Son
résultat tardif est ignoré, et la médiathèque se recharge à la première ouverture — ses lecteurs
testent `isInitialized` avant de s'en servir.

#### ⭐ Un défaut de plus, tombé en chemin

`initDB()` **avale sa propre exception**, pose `isInitialized: true` et laisse la liste vide : *une
lecture ratée se présente comme une médiathèque vide*. C'est le motif qui a coûté les campagnes le
27/08, et son champ `error` **n'était lu par personne**. L'étape le relit et refuse la fausse
réussite.

⚠️ **Et on ne le corrige pas en remettant `isInitialized` à `false`** : `MediaBrowser` rappelle
`initDB` dès qu'il le voit faux, et une base en panne deviendrait **la boucle de Light-OS, à
l'identique**. Le drapeau dit « tentée » ; c'est le démarrage qui dit « manquée ».

#### La leçon, et elle vaut au-delà de ce défaut

⭐⭐ **Devant un symptôme sans reproduction, la question n'est pas « qu'est-ce qui a causé ça ? » —
c'est « quels chemins de ce code peuvent ne jamais finir ? ».** La première demande une scène qu'on
n'a pas ; la seconde se répond en lisant, et elle **se compte**. Ici elle en a rendu trois, en vingt
minutes, sur une ligne qui avait attendu une journée.

**Ancres** : `system/logic/etapesDuDemarrage.ts` (+ 17 tests), `system/logic/BootstrapService.ts`
(+ 10 tests), `system/useDemarrageStore.ts`, `App.tsx` — la garde `!isAppReady`.

**Éprouvé par dégradation, des deux côtés** : sans la course d'expiration, **5 tests rougissent** et
la suite met 16 s au lieu de 0,8 s — le blocage se mesure ; avec l'ancien `if (!rapport.degrade)`
devant `setSystemReady`, **2 tests rougissent**.

### 50 · ⛔ Le Master Storyboard inatteignable en séance — et le silence autour (2026-09-12)

*Une séquence ratée en pleine partie, et l'écran qui l'aurait expliquée était justement celui qu'on
ne pouvait plus ouvrir.*

#### Le symptôme, et ce qu'il n'était pas

David : *« j'ai lancé une scène qui avait une séquence de Storyboard liée, elle ne s'est pas bien
exécutée (pas d'image projetée, les lumières ne se sont pas allumées, l'ambiance s'arrête), et après
je ne peux pas revenir dans le master storyboard »*.

⭐ **Le journal de l'application a tranché avant toute hypothèse** : aucun `error`, aucun `warn`
depuis le **5 septembre**. Donc **pas de plantage** — l'`ErrorBoundary` aurait écrit
`CRITICAL_MODULE_FAILURE` et remplacé tout le cockpit. *Trois hypothèses ont été écartées par une
lecture de `main.log`, avant d'avoir coûté une ligne de code.*

#### ⛔ La cause : un classement, pas un mécanisme

`affiniteDesVues.ts` portait `storyboard: 'preparation'`. Pendant une séance, `useLayoutManager`
ramène au cockpit toute vue qui ne convient pas au moment. **Le clic passait, la vue changeait, et le
rendu suivant la ramenait.** Le bouton s'allumait le temps d'une image.

⭐ **Le storyboard est le seul écran de préparation dont le contenu sert PENDANT qu'on joue** — ses
moments se déclenchent depuis le panneau de trame. Et contrairement à Deck-OS, il n'a pas de jumeau
de partie (`deck-library` / `deck-player`) : le classer « préparation » ne le rangeait pas, il le
**faisait disparaître au moment où il sert**. David : *« c'est une erreur, le storyboard doit pouvoir
être lancé en partie »*.

#### ⛔⛔ TROISIÈME FOIS pour ce même mécanisme

| Quand | Quelle vue | Trouvé par |
| --- | --- | --- |
| 2026-09-05 | `timeline-wiki` — *« je n'ai plus accès à la chronologie et au wiki »* | David, en séance |
| 2026-09-12 | `storyboard` | David, en séance |

⭐⭐ **Et la garde écrite le 05/09 ne pouvait pas l'attraper.** `portesDuCockpit.test.ts` vérifie que
toute vue classée `'les-deux'` a une porte dans le cockpit — il **part du classement**. Or c'est le
classement qui était faux. *Une garde qui part d'une table ne peut pas attraper une erreur DE cette
table.*

Le complément est donc d'une autre nature : une **liste gelée** de ce qui disparaît en séance
(`affiniteDesVues.test.ts`), sur le modèle du registre des actions distantes. Elle n'empêche pas un
mauvais choix : elle empêche un choix **silencieux**.

#### ⚠️ Et le silence qui entourait tout ça

Deux causes cumulées, trouvées en cherchant la première :

1. **`window.useToastStore` n'est assigné nulle part.** Sept appels le lisaient — les trois moteurs
   audio, le storyboard, son tableau de bord — tous derrière un `if (gmToast)` **jamais franchi**.
   *« Fichier d'ambiance introuvable dans la base de données »* était prêt depuis toujours.
   ⭐ Et le typage l'a prouvé à la seconde où l'import est devenu statique : **cinq `TS2345`**, les
   arguments étaient inversés. *Le `any` de `window` cachait une erreur de type.*
2. **Chaque effet d'un moment est un `if` muet** : magasin absent de `window`, effet sauté sans un
   mot. *Un `&&` qui protège est un `&&` qui cache.*

Un moment rend désormais des comptes, moteur par moteur, et **distingue « introuvable » (la donnée du
meneur a bougé) de « module non chargé » (le code n'était pas là)** — même silence à la table,
réparations opposées.

#### ⭐ Éprouvé par dégradation, et la dégradation a reproduit l'écran

En remplaçant `'les-deux'` par `'preparation'` : le témoin hors séance **passe**, les deux tests de
séance **rougissent**, et le message d'échec montre *« locator resolved to `<button>` »* — **le bouton
du cockpit toujours présent**, c'est-à-dire exactement ce que David avait sous les yeux.

**Ancres** : `affiniteDesVues.ts` (`storyboard: 'les-deux'`), `affiniteDesVues.test.ts` (liste gelée),
`portesDuCockpit.test.ts` (7 vues), `storyboard/logic/rapportDuMoment.ts` (+ 13 tests),
`e2e/storyboardEnSeance.spec.ts`.

**Vérifié** : `tsc -b` propre, **4 323 tests** (359 fichiers), **159 tests E2E**.

⚠️ **Ce qui reste ouvert** — voir § 1 bis : pourquoi la séquence elle-même s'est mal exécutée. Le
classement explique l'écran inaccessible, **pas** l'image absente ni les lumières éteintes.

### 51 · ⭐ Les noms du matériel, et la sortie qu'on ne retrouvait plus (2026-09-12)

*« Est-il possible de garder les noms que j'attribue aux sorties audio, aux écrans ou autre quand je
rallume GM-OS » — et la réponse était : ils n'ont jamais été perdus.*

#### ⛔ Ce n'était pas la sauvegarde, c'était la clé

`useHardwareStore` persiste ses deux carnets d'alias **depuis toujours**. Ce qui bougeait, c'est
l'étiquette sous laquelle ils sont rangés :

| Carnet | Rangé par | Pourquoi ça bouge |
| --- | --- | --- |
| sorties audio | `deviceId` | une empreinte du périphérique : **rebrancher une enceinte en change l'identifiant** |
| écrans | `display.id` | attribué par le système, **réattribué** au redémarrage ou au changement de câble |

*Le nom était toujours là, rangé sous l'ancienne clé ; GM-OS cherchait la nouvelle.*

⭐ **Et le même soir, le même identifiant instable expliquait autre chose** : le
`Device 22ad7d4a… not found, falling back to default` d'Ambient-OS. Une ambiance visée sur les
enceintes du fond sortait **devant**, en silence. **Un seul défaut, deux symptômes.**

#### La signature, et ce qu'elle coûte

⚠️ **On n'échange pas un identifiant faux contre un identifiant vrai.** On échange un identifiant
qui change à **chaque rebranchement** contre un autre qui ne change que si l'on remanie son
installation. *C'est un gain de fiabilité, pas une garantie*, et les deux limites sont écrites dans
le module.

- **Sortie audio** : le libellé Windows, nettoyé de sa numérotation. ⛔ **Windows renomme au
  rebranchement** — `Realtek` devient `2- Realtek`, puis `3-`. *Sans ce nettoyage, la signature
  aurait été aussi instable que ce qu'elle remplace, et le correctif n'aurait rien corrigé.*
- **Écran** : sa géométrie, faute de mieux — le processus principal ne transmet aucun nom système,
  il fabrique `Moniteur 1`, `Moniteur 2`… **d'après le rang dans la liste**, qui change aussi.

#### ⭐ Le carnet des signatures connues — ce qui rend le routage réparable

Un moment de storyboard mémorise `ambientOutputId: '22ad7d4a…'` **et rien d'autre**. Le jour où cet
identifiant change, plus rien ne relie le choix du meneur à une enceinte réelle.

D'où `signaturesConnues` : `deviceId` → la signature qu'il portait **la dernière fois qu'on l'a vu**,
relevée à chaque recensement. *C'est la seule occasion de la lire — quand l'appareil sera débranché,
il n'y aura plus rien.* Cela évite de changer le format des six magasins qui enregistrent une sortie.

⚠️ **Et ça ne rattrape pas le passé** : un choix fait avant ce carnet, sur une enceinte jamais
rebranchée depuis, reste irrécupérable. *Un filet posé aujourd'hui ne rattrape pas ce qui est tombé
hier.*

#### ⛔ Deux défauts trouvés en chemin

1. **Le repli ne jouait nulle part.** `audioDevices` et `displays` n'étaient remplies que **par
   l'écran des Réglages** : partout ailleurs, une sortie sans alias s'affichait « Périphérique
   Inconnu » et un écran « Écran 2528732444 » — *alors que le nom système était à portée d'un
   appel.* Le recensement est devenu une étape du démarrage.
2. **Le repli audio était muet et recopié.** Ambient-OS et Sound-OS portaient le **même bloc**,
   `catch (NotFoundError)` puis `console.warn`. Un point de passage unique les remplace : il retrouve
   par signature avant tout repli, et **prévient le meneur** quand la sortie a vraiment disparu —
   *en la nommant comme lui la nomme.*

⚠️ Une seule alerte par appareil, remise à zéro au `devicechange` : *un avertissement qui crie tout
le temps ne se lit plus.*

#### ⭐ Deux gardes du dépôt ont mordu pendant le chantier

| Garde | Ce qu'elle a trouvé |
| --- | --- |
| `nomsSansEcrivainNiLecteur.test.ts` | `signatureDeLaSortieChoisie`, **déclaré et appelé par personne** — j'avais ajouté un sélecteur « au cas où ». Le test offre deux réponses honnêtes, le brancher ou le supprimer : **supprimé** |
| `e2e/imageOs.spec.ts` | le libellé d'un écran est passé de `Écran 2528732444` à `Moniteur 2`. *Un test qui rougit sur une amélioration reste un test qui fait son travail* — il gardait le vocabulaire, il garde désormais le geste |

#### ⛔ Et j'ai cassé la saisie dans l'heure qui a suivi

David : *« je n'arrive pas à donner un nom au moniteur »*.

Les champs des Réglages lisaient `displayAliases[display.id]` **en direct**, pendant que
`setDisplayAlias` écrivait désormais sous la signature. On tapait, c'était enregistré, le champ
relisait l'ancienne clé et n'y trouvait rien : **un champ contrôlé dont la valeur ne change jamais
refuse la frappe.** Les deux champs étaient touchés, audio et écran.

⭐⭐ **Et les trente-six tests écrits une heure plus tôt ne pouvaient pas le voir.** Ils éprouvaient
la signature, la migration, la résolution — *la mécanique interne*. Pas une fois **le geste** :
taper un nom, le relire. C'est désormais le premier test du magasin, et la dégradation le confirme
(5 rouges, dont « garde le nom qu'on vient de lui donner »).

*Un lecteur et un écrivain qui n'emploient pas la même clé sont pires que deux écrivains : personne
ne voit rien, et rien ne plante.* Les carnets ne se lisent plus que par leurs sélecteurs — et
`nomsSansEcrivainNiLecteur` l'a remarqué tout seul en constatant qu'ils n'étaient plus cités
ailleurs.

**Ancres** : `utils/signatureDuMateriel.ts` (+ 27 tests), `utils/poserLaSortie.ts` (+ 9 tests),
`stores/useHardwareStore.ts` (+ 11 tests d'aller-retour), `hooks/useMaterielDeTable.ts`,
étape « Matériel de table » du `BootstrapService`, `e2e/nommerLeMateriel.spec.ts`.

**Vérifié** : `tsc -b` propre, **4 370 tests** (362 fichiers), **163 tests E2E**.

⚠️ **À éprouver en réel** — voir § 1 : débrancher une enceinte en pleine séance et la rebrancher.
Le nom doit tenir, la sortie doit se retrouver, et l'alerte ne doit apparaître qu'une fois.

### 52 · ⭐ La lumière entre deux séquences — la dernière à ne pas suivre la règle (2026-09-13)

*David : « quand je passe d'une séquence à l'autre, il faut respecter les paramètres de la scène
suivante — s'il n'y a pas de configuration pour la lumière, il faut retourner vers le "Home" de
Light-OS. Et quand j'arrête une séquence, il faut tout arrêter, sauf Light-OS qui va vers son
"Home". »*

#### ⭐ La règle, qui existait déjà pour tout le reste

**Un moment décrit l'état complet de la table, pas ce qui change.** Ce qu'il ne déclare pas revient
à son repos, au lieu de survivre du moment précédent.

| Quoi | Depuis |
| --- | --- |
| l'image | 2026-08-31 (`cibleDeLImageDuMoment`) |
| le son — ambiance, bruitage | 2026-09-02 (`sonsDuMoment`) |
| **la lumière** | **2026-09-13** |

`if (moment.lightSceneId)` appliquait une scène ; **son absence ne faisait rien du tout**, et la
scène du moment précédent restait sur la pièce toute la séquence suivante. *Trois modules suivaient
la règle, un ne la suivait pas — et c'est celui qu'on voit le plus, puisqu'il éclaire la table.*

#### Deux décisions posées à David plutôt que tranchées seul

Sa consigne touchait deux choix qu'il avait faits auparavant. *Renverser une décision écrite sans la
nommer, c'est la perdre deux fois.*

| Question | Sa réponse |
| --- | --- |
| « Tout arrêter » inclut-il **la musique** ? `cequUnArretEteint` l'épargne exprès depuis le 17/08 | **Non** — une nappe traverse plusieurs scènes, et un silence brutal s'entend. Il maintient sa décision |
| Un moment sans lumière : **Home toujours**, ou seulement si la séquence avait posé une scène ? | **Seulement si la séquence avait posé** — même doctrine que le son : *on ne ramène que ce que la séquence a posé*, et le réglage manuel du meneur ne s'écrase pas |

⚠️ **Le « Home » n'est pas la dernière scène choisie.** C'est `revenirALEclairageNormal`, qui vise
l'éclairage désigné de la pièce — `revertToManualScene` ramènerait *« la scène d'alerte qui jouait
il y a trois secondes »*, ce que son propre commentaire prévient depuis le 07/09.

#### ⭐⭐ Deux fichiers de tests, et la distinction vaut d'être dite

`lumiereDuMoment.test.ts` garde **la décision** — quand rentrer au Home.
`lumiereEntreDeuxMoments.test.ts` garde **le branchement** — qu'elle soit appelée, et que le magasin
retienne ce que le moment a posé.

⛔ **La distinction a coûté deux défauts la veille** : un magasin dont l'écriture et la lecture
n'employaient plus la même clé (§ 51), et une adresse composée avec le mauvais champ (§ 49). *Dans
les deux cas la mécanique était juste et personne ne l'appelait correctement.* La dégradation fait
rougir **5 tests sur les 16**, des deux côtés.

#### ⚠️ Et la garde des noms a montré sa limite

`nomsSansEcrivainNiLecteur` a réclamé le retrait de la tolérance de `sonsDuMoment`, au motif qu'il
est désormais « cité ailleurs ». La seule citation est **un commentaire de documentation** écrit le
jour même dans le module frère. *Une garde qui lit des noms ne peut pas lire des intentions* — c'est
écrit dans son propre en-tête, et c'en est un cas. On l'a suivie, en consignant pourquoi.

**Ancres** : `storyboard/lumiereDuMoment.ts` (+ 8 tests), `lumiereEntreDeuxMoments.test.ts`
(+ 8 tests), `useStoryboardStore.ts` (`lumiereDuMoment`, prise de main et arrêt).

**Vérifié** : `tsc -b` propre, **4 394 tests** (365 fichiers), **164 tests E2E**.

⚠️ **À éprouver à la table** — voir § 1 : aucun de ces tests ne voit une vraie lampe. Ce qui se
juge en séance : que le retour au Home ne fasse pas clignoter la pièce entre deux moments, et que
l'éclairage normal soit bien celui qu'on veut retrouver en sortant d'une scène tendue.

### 53 · ⭐ `Ctrl+0` vide l'écran des joueurs — et la réception attendait depuis toujours (2026-09-13)

*David : « je voudrais la possibilité de fermer [la fenêtre du Player Hub] avec un raccourci dédié,
car en tant que MJ je ne vois pas toujours l'écran Player Hub ».*

#### ⭐ Sa raison décide de la conception

Le meneur **ne regarde pas cet écran**. Le geste doit donc partir de **sa** fenêtre, et effacer sans
qu'on ait à savoir ce qui était affiché. *Un bouton sur le Player Hub n'aurait servi qu'aux
joueurs* — c'est la phrase de sa demande, pas la fonctionnalité, qui a tranché.

#### ⛔ SIXIÈME « chaîne complète sans bouton au bout »

`useHubSync` traite un message **`FULL_RESET`** qui vide l'image, la fiche et la vidéo.
**Aucune occurrence ailleurs dans le dépôt : personne ne l'émettait.** La réception était construite
et attendait.

⚠️ Et elle a échappé à `nomsSansEcrivainNiLecteur` **parce qu'elle vit dans une chaîne de
caractères**, pas dans un magasin. *Une garde qui inventorie des noms déclarés ne voit pas les
protocoles.*

#### Deux décisions, et une que j'ai prise contre l'option choisie

David avait retenu « tout ce que le Player Hub affiche », **favoris épinglés compris**. En cherchant
le canal, j'ai trouvé que leur présence n'est pas une projection : c'est un drapeau **persisté** sur
la fiche (`isSyncedToPlayerHub`), posé un par un. Les effacer ne les cacherait pas, ça les
**dépinglerait**.

⭐ Ils sont donc épargnés, et c'est dit : *ce geste rattrape ce qu'on a laissé traîner sans le voir ;
un favori épinglé n'a pas été laissé, il a été choisi.* Le fond de l'écran reste aussi — *l'image
est le décor, les fiches passent devant.*

#### ⛔ Une exception assumée à la règle des raccourcis

`useRaccourcisDeNavigation` porte en tête : *« ils ne font qu'ouvrir un écran : rien ne se
déclenche, rien ne se projette »*, parce qu'*une image projetée devant les joueurs ne se rattrape
pas*.

`Ctrl+0` enfreint cette règle — **et l'asymétrie est ce qui l'autorise** : il ne peut que
**retirer**, jamais montrer. Une frappe malheureuse coûte une projection à refaire, pas un secret
éventé. *Écrit à côté de la règle plutôt que glissé sans le dire.*

#### ⛔⛔ Et une dégradation qui ne prouvait rien

Première tentative de dégradation : les quatre tests E2E sont restés **verts**. Non parce que le
code tenait, mais parce que la dégradation **ne compilait pas** — `npm run build` est
`tsc -b && vite build`, `tsc` a échoué, `vite` n'a jamais tourné, et Playwright a mesuré **l'ancien
`dist`**.

⭐ *C'est le piège du § 47 retourné contre moi* : là-bas un test vert ne pouvait pas rougir à cause
d'un chemin mangé par le shell ; ici à cause d'un artefact périmé. **Une dégradation doit compiler,
sinon elle ne dégrade rien.** Refaite proprement, elle fait rougir **3 des 4**.

#### ⛔ Et il noircissait tout l'écran — corrigé le lendemain matin

David, capture à l'appui : *« je voulais que la fenêtre encadrée en rouge se ferme, pas le
background derrière cette fenêtre »*.

Le fond du Player Hub tenait dans **un ternaire d'une ligne, sans un mot d'explication** :

```ts
const backgroundPath = liveImagePath !== undefined ? liveImagePath : (activeHubId || wallpaper);
```

Il porte **trois** états : `undefined` = rien n'est projeté, le décor reprend la main ; `null` = la
projection est éteinte, écran noir ; une adresse = cette image. **`FULL_RESET` posait `null`.**

⚠️ **Et j'avais affirmé la veille que « le fond reste »** — en le déduisant d'une règle voisine
(`imageAvantLeMoment`, *l'image est le décor, les fiches passent devant*) **au lieu de lire cette
ligne**. *Une doctrine juste appliquée au mauvais endroit reste une erreur*, et elle avait l'air
d'autant plus solide qu'elle citait le dépôt.

⭐ Le ternaire est devenu `fondDuPlayerHub`, documenté et éprouvé (7 tests). Sa dégradation —
remplacer `!== undefined` par `!= null`, la substitution exacte qui a noirci l'écran — en fait
rougir **2**.

**Ancres** : `image/logic/effacerLePlayerHub.ts` (+ 8 tests), `hub/fondDuPlayerHub.ts` (+ 7 tests),
`useRaccourcisDeNavigation.ts`
(`Digit0`), `e2e/viderLePlayerHub.spec.ts` (4 tests, dont la garde des champs de saisie).

**Vérifié** : `tsc -b` propre, **4 409 tests** (368 fichiers), **168 tests E2E**.

⚠️ **Ce qu'aucun test ne dit** — voir § 1 : que l'écran des joueurs se vide **vraiment**. La fenêtre
du Hub n'est pas ouverte dans une instance d'essai, et ce qui part par `sendSync` ne revient pas. On
éprouve le départ, pas l'arrivée.

### 54 · ⭐ Échap ferme les surcouches — la famille entière, pas l'écran signalé (2026-09-13)

*David, le 12/09 : « Échap ne ferme pas les Paramètres, et le modal avale alors tous les clics ».
La ligne a été différée au § 1 bis avec son motif : **le nombre de surcouches dans ce cas n'avait
pas été compté**. Comptées le 13/09, elles étaient une trentaine — et le comptage a trouvé un
second défaut que personne ne cherchait.*

#### Ce que le comptage a rendu

| Mesuré | Valeur |
| --- | --- |
| Fichiers portant un `fixed inset-0` | **40** |
| Fichiers parlant d'`Escape` | **12** — et la moitié l'écoutaient sur un **champ de saisie**, pas sur la surcouche |
| Boîtes servies par `ModalProvider` | `alert`, `confirm`, `prompt` et **29 variantes `custom`**, dont les Paramètres — **aucune n'écoutait** |

⛔ **Les Paramètres n'étaient pas un écran, c'était une trentaine.** Un seul correctif, posé sur le
`ModalProvider`, les couvre toutes. *Un défaut signalé sur un écran en cachait une trentaine.*

#### ⛔ Et la seconde face, que le comptage a sortie toute seule

`estUneFrappeDePastille` écarte les « boîtes ouvertes » en cherchant `[role="dialog"]` dans le DOM.
**Cet attribut n'existait que dans deux fichiers côté meneur** (`ModalProvider`, `EditeurDeScene`).

Médiathèque, Forge, aperçu plein écran, Oracle, visionneur de règles, QR réseau : **toutes ouvertes,
toutes muettes pour cette garde**. Une lettre frappée hors d'un champ y lançait la pastille de
Sound-OS **et** la scène de Light-OS, en pleine séance — exactement le mode d'échec pour lequel la
garde avait été écrite le 30/08.

*Une garde qui dépend d'un attribut qu'il faut penser à poser ne protège que les écrans dont
l'auteur connaissait la garde.*

#### La pièce unique : un registre des surcouches ouvertes

Les deux faces se referment avec la même chose — **savoir ce qui est ouvert, et dans quel ordre**.

- `surcouchesOuvertes.ts` — une pile, un **écouteur unique** posé à la première surcouche et retiré
  à la dernière ; **seule celle du dessus** répond à Échap.
- `useFermetureParEchap(actif, onFermer, nom)` — ce que les écrans emploient.
- `estUneFrappeDePastille` **interroge le registre** au lieu de fouiller le DOM (les deux lectures
  sont gardées : une boîte qui porterait l'attribut sans passer par le crochet reste couverte).

⭐ **La garde énumérée disparaît.** La médiathèque nommait ses deux enfants pour se taire quand ils
étaient ouverts (`if (previewItem || editingMediaId) return`) — et **ni l'un ni l'autre n'écoutait**
de son côté : personne ne fermait rien. La pile n'a rien à connaître de ce qu'elle porte.

#### La règle qui décide qui prend le crochet

⛔ **Échap fait ce que fait le bouton de fermeture de l'écran — jamais plus.**

- Sur un `confirm`, c'est **la voie d'annulation**, jamais la confirmation.
- Sur le résolveur de conflit Nexus, c'est `cancel` — `replace` écrase une campagne et se dit
  *irréversible*.
- ⛔ **L'atelier de brainstorm en est exclu, et c'est une décision** : sa croix **réinitialise** la
  série — 72 s d'inventaire et une demi-heure de fiches en revue, sans confirmation. *Ici le bouton
  de fermeture fait plus que fermer, donc Échap ne le prend pas.*

#### ⚠️ La règle des deux frappes, écrite puis retirée avant d'être livrée

L'idée était qu'Échap dans un champ rende d'abord la main au champ, pour qu'une frappe distraite ne
coûte pas une fiche à moitié tapée. **Le dépôt avait déjà tranché l'inverse** : `SpotlightSearch`
ferme depuis son champ focalisé depuis toujours, et l'éditeur de scène de Light-OS **sélectionne**
son champ à l'ouverture — la première frappe y aurait été muette. *Deux frappes pour sortir, c'est
exactement ce que David a signalé comme « Échap ne ferme pas ».*

La charge passe donc aux **éditions en ligne** : les trois du dépôt arrêtent désormais la
propagation, sans quoi une frappe annulerait la saisie **et** refermerait l'écran derrière.

#### Ce qui a pris le crochet

`ModalProvider` (4 types), `NetworkQRCodeModal`, `MediaBrowser`, `TacticalDetailPanel`,
`FullScreenPreview`, `SpotlightSearch`, `OraclePanel`, `EditeurDeScene`, `AIPromptOverlay`,
`SessionSnapshotModal`, `AddEditWebLinkModal`, `AtlasMapDetail`, `RuleWorkshopViewer` (2 niveaux),
`ForgeDashboard`, `AtelierDeCampagne`, `NexusConflictResolver`.

⭐ **Trois écrans écoutaient déjà et ont perdu leur écouteur à eux** — `SpotlightSearch` en avait
même **deux**, et comme elle s'ouvre par-dessus tout (z-9999), une frappe la fermait **avec** la
boîte qu'elle recouvrait.

#### Ce qui garde la famille refermée

`echapFermeLesSurcouches.test.ts` balaie **tout `src/`** : toute surcouche doit prendre le crochet
ou figurer dans `DISPENSEES` **avec son motif**. Trois gardes de plus sur la liste elle-même — un
chemin disparu, un écran déjà réparé, un motif trop court. ⭐ *Elle a attrapé mes propres quatre
motifs bâclés à la première exécution.*

⚠️ **Elle lit des noms, pas des intentions** — un fichier qui importerait le crochet sans l'appeler
lui échapperait. Ce qu'elle attrape est l'oubli, qui est le cas réel : les quarante l'étaient.

#### ⛔ Le piège du § 3 s'est reproduit pendant la vérification

La dégradation retirait l'appel et laissait l'import : **`tsc` a échoué, `vite build` n'a jamais
tourné, et Playwright a mesuré l'ancien `dist`** — trois tests verts sur un correctif jamais
construit. Refaite d'une façon qui compile (`actif: false`), elle rougit : deux tests sur trois.
*Une dégradation doit compiler, sinon elle ne dégrade rien* — la règle du 13/09 au matin, repayée
le soir même.

#### ⭐ Le constat dormait dans un test, en commentaire

`nommerLeMateriel.spec.ts` fermait les Paramètres au bouton en expliquant, en toutes lettres,
qu'Échap ne marchait pas. Il n'en a pas moins passé. *Un test qui contourne un défaut le documente
sans jamais le signaler.*

C'est là que les trois tests du geste vivent désormais — et ils y sont **meilleurs** qu'isolés : la
frappe part d'un **champ de saisie** (les tests du dessus viennent d'y taper), et le clic sur la
barre latérale prouve ce que `toBeEnabled` ne prouve pas. Playwright dit d'ailleurs la phrase de
David en langage d'outil : *`intercepts pointer events`*.

**Ancres** : `surcouchesOuvertes.ts` (+ 13 tests), `useFermetureParEchap.ts`, `frappeDePastille.ts`
(+ 1 test), `echapFermeLesSurcouches.test.ts` (4 gardes), `e2e/nommerLeMateriel.spec.ts` (3 tests
du geste), et les seize écrans ci-dessus.

**Vérifié** : `tsc -b` propre, **4 425 tests** (369 fichiers, 1 ignoré), **171 tests E2E**.

### 55 · ⭐ Les diaporamas d'Image-OS, appelables depuis un moment (2026-09-13)

*Demande de David : « je voudrais pouvoir créer des diaporamas avec plusieurs images et un fondu
entre chacune d'entre elles, ensuite je veux pouvoir appeler ce diaporama dans un Storyboard ».*

#### La décision qui a tout tenu : **l'horloge vit chez le meneur**

Un diaporama est une liste ordonnée + une cadence, et **son minuteur tourne dans la fenêtre du
meneur**. Il n'envoie aux écrans que des projections d'image ordinaires — *comme si le meneur les
enchaînait à la main.*

⭐ **Conséquence : le projecteur, le Player Hub, les tablettes, le pont IPC et la sauvegarde n'ont
rien eu à apprendre.** Aucun canal de transport nouveau, aucun message à perdre au démarrage d'une
fenêtre. *Le contraire — envoyer le montage à l'écran pour qu'il le déroule — aurait demandé de
résoudre vingt images en base64 avant la première.*

⚠️ **Ce que cette décision coûte, et c'est assumé** : la **durée du fondu** reste celle d'Image-OS
(700 ms, commune à tous les changements d'image), parce qu'elle vit dans les écrans et qu'eux ne
savent pas quel diaporama tourne. Seule la **durée d'affichage** est propre à chaque diaporama.

#### ⛔ Le fondu n'existait qu'à moitié — et personne ne pouvait le savoir

| Où | Ce qui se passait vraiment |
| --- | --- |
| **Le projecteur** | La sortante était **démontée à l'instant** où l'entrante arrivait : la nouvelle montait depuis le fond de l'écran. *Un passage par le noir, pas un fondu croisé.* |
| **Le Player Hub** | `AnimatePresence mode="wait"` — l'entrante **attend que la sortante ait fini**. À 1,5 s chacune : **trois secondes d'écran noir** entre deux images. |

⭐ **Ça n'avait jamais sauté aux yeux parce que rien n'enchaînait deux images tout seul.** Un meneur
qui clique une image toutes les deux minutes ne voit pas la différence. Un diaporama la montre
quatre-vingt fois par heure. *Une fonctionnalité nouvelle est un banc d'essai pour l'ancienne.*

Le minutage est partagé (`useFonduCroise`), **le balisage non** : le projecteur pose l'image sur un
flou d'elle-même, le Hub la couvre en fond. *C'est le comportement qui se partage, pas le
balisage* — la leçon inverse a coûté la vidéo du Player Hub le 2026-09-05.

#### Les règles qui protègent la table

| Règle | Ce qu'elle évite |
| --- | --- |
| **Une image projetée à la main arrête le diaporama de cet écran** | Le meneur projette une image, et **six secondes plus tard elle est remplacée**. *Rien ne relierait le symptôme au diaporama lancé dix minutes plus tôt.* Le dernier geste du meneur gagne |
| **Mais seulement sur le même écran** | Un diaporama sur le moniteur du fond n'a pas à s'arrêter parce qu'une fiche part au Hub |
| **Un moment suivant l'ARRÊTE, il ne l'éteint pas** | Éteindre ne touche pas à l'horloge : elle **rallumerait** l'écran par-dessus le moment suivant |
| **Sauf s'il rappelle le même** | Le relancer le ramènerait à sa première image alors que le meneur enchaîne deux moments sur la même ambiance |
| **Une seule image ne tourne pas** | La reprojeter en boucle rejouerait son fondu d'entrée : *un décor fixe qui clignote* |
| **Cadence bornée à 1,7 s** | Plus court que le fondu, l'image repartirait **avant d'être entrée** : un battement trouble |
| **Une image supprimée est sautée** | *Une séance ne doit pas s'arrêter sur un ménage fait la semaine d'avant.* Le trou se dit dans l'écran du diaporama, jamais à la table |
| **Arrêter n'éteint pas l'écran** | Arrêter le défilement et faire le noir sont deux gestes |

#### ⛔ Le défaut trouvé **en écrivant le guide**, pas en relisant le code

`projectSolo` écrit une ligne au **journal de séance** à chaque projection réussie. À six secondes
par image, un diaporama y aurait déversé **dix lignes par minute** : au bout d'une heure, le fil de
la soirée n'aurait plus contenu que ça. *Un journal qu'on ne peut plus lire ne vaut pas mieux qu'un
journal absent.*

⚠️ La marque qui distingue les deux cas **devait être lue avant le premier `await`** — elle est
remise à faux avant que l'écriture n'ait lieu. Les deux directions sont éprouvées par dégradation.

⭐ *Écrire ce qu'un module fait reste le meilleur détecteur de défaut employé sur ce dépôt* — la
conclusion de la revue des guides des 04-05/09, vérifiée une fois de plus.

#### ⛔ Et Image-OS n'était dans AUCUNE sauvegarde — **quatrième fois**

Douze magasins sont collectés dans `SessionService` ; le sien n'en faisait pas partie. Ni les pads,
ni les dossiers. Les diaporamas s'y seraient ajoutés au même néant — et les restaurer sans leurs
pads n'aurait rendu que des listes vides, ce qui rendait la fonctionnalité **non fiable**.

Après `entities`/`clues`/`sessions` (07/08), Music-OS (30/08) et Map-OS (04/09) : *une liste de ce
qu'on sauvegarde, recopiée à la main, oublie toujours quelque chose.* **Quatre fois, le même
mécanisme, et le code porte déjà deux commentaires qui le disent.**

#### L'ancienne « séquence », absorbée — décision de David

Une case à cocher par image, **une seule liste globale**, sans nom, sans cadence et sans fondu. Les
flèches ◀ ▶ feuillettent désormais le diaporama en cours, et ne s'affichent que quand il y en a un.
*Deux notions d'ordre dans un même module finissent toujours par diverger.*

⚠️ Aucune migration : `active` reste dans les bibliothèques déjà sur le disque, **personne ne le
lit**, et il disparaîtra à la prochaine écriture. *Il n'y a pas de migration à faire pour un champ
qu'on cesse de lire* — au contraire de l'ajout d'un champ obligatoire.

#### Ce qui reste hors de portée des essais

⚠️ **Aucun test ne dit qu'un diaporama défile vraiment à la table.** Le profil E2E n'a aucun média,
donc l'E2E garde le **geste** (créer, voir, se faire refuser un lancement à une image) et les tests
unitaires gardent **l'horloge** avec des minuteurs feints. Ce qui reste à éprouver en séance est au
§ 1 : le rendu du fondu croisé à l'œil, et la tenue d'une soirée entière.

**Ancres** : `logic/deroulementDuDiaporama.ts` (+16 tests), `useImageStore.ts`
(`diaporamaQuiTourne.test.ts`, 20 tests), `useFonduCroise.ts` (+5 tests),
`components/PanneauDesDiaporamas.tsx`, `ProjectorView.tsx`, `PlayerHub.tsx`,
`storyboard/imageOuDiaporama.ts` (+`diaporamaDuMoment.test.ts`, 12 tests),
`store/SessionService.ts`, `types/schemas.ts`, `e2e/imageOs.spec.ts` (2 tests du geste),
guides 24 et 13.

**Vérifié** : `tsc -b` propre, **4 476 tests** (373 fichiers, 1 ignoré), **173 tests E2E**.

### 56 · ⛔ Le fondu s'animait sur du vide, et les images gardaient leur taille (2026-09-13, au soir)

*Premier essai des diaporamas par David : « **cela marche**, à part le mécanisme de fondu qui ne
fonctionne pas bien, et le redimensionnement des images qui parfois ne prennent pas tout
l'écran ».* Deux défauts, **tous deux antérieurs aux diaporamas**, et tous deux rendus visibles
par eux.

#### ⛔ 1. Le fondu partait avant l'image

Le symptôme, donné par David : **un temps mort, puis un saut** — et *sur les deux écrans*.

La cause : **l'adresse d'une image arrive avant l'image.** `useMediaUrl` rend un `data:` base64
sorti d'IndexedDB, et le navigateur doit encore le **décoder** — de quelques dizaines à quelques
centaines de millisecondes pour une grande image. L'animation d'opacité démarrait à la seconde où
l'adresse arrivait, donc **sur un cadre vide** : on voyait l'ancienne image immobile, puis la
nouvelle apparaître d'un coup à mi-fondu.

⭐ **Le remède est de retarder le fondu, pas de l'allonger.** On décode d'abord ; le fondu ne
commence que quand il a quelque chose à faire apparaître. *Une transition qui démarre avant son
sujet n'est pas une transition trop courte, c'est une transition qui joue à vide.*

⚠️ **`onload` ne suffit pas** : il dit que les octets sont là, pas qu'il y a des pixels. C'est
`decode()` qui attend la seconde étape, et c'est elle qui coûte.

⚠️ **Une image illisible résout quand même** : un fichier corrompu ne doit pas figer l'écran sur
l'image d'avant pour toujours. *Mieux vaut un cadre vide qu'un écran qui n'obéit plus.*

⚠️ **Ce que ça coûte, et c'est assumé** : une image lourde s'affiche un instant plus tard
qu'avant — mais **en fondu**. *Le temps mort existait déjà ; il était pris sur le fondu au lieu
d'être pris avant lui.*

#### ⛔ 2. Une `<img>` sans dimension garde sa taille naturelle

```
class="relative z-10 max-w-[95%] max-h-[95%] object-contain"   ← avant
```

`object-contain` ne décide **rien** sur une boîte dont la taille n'est pas donnée, et `max-w`/`max-h`
ne font que *plafonner*. Une image de 4 000 px était ramenée à l'écran ; **une image de 1 200 px
restait à 1 200 px**, perdue au milieu de son propre flou.

⭐ *Le « parfois » de David était la définition du fichier.* **Un défaut qui dépend de la donnée
passe pour une lubie de l'écran** — c'est ce qui le rend si difficile à signaler, et ce qui lui a
permis de vivre depuis toujours.

⚠️ Et il **guettait le fondu** : si une couche avait gardé le plafond et l'autre non, l'image
aurait **sauté de taille au milieu du fondu croisé** — un défaut qu'on aurait attribué au fondu.

#### ⛔ 3. Et le correctif du fondu en cachait un troisième — **celui-là était de moi**

*Second essai de David, le même soir : « le fondu de la première image fonctionne, mais après je
n'ai pas de fondu entre les images suivantes ».*

⭐ **Le « après » désignait la cause.** La seule différence entre la première image et les
suivantes est la présence de la **couche sortante** — celle que j'avais ajoutée le matin même au
§ 55. *Un symptôme qui distingue le premier cas de tous les autres nomme la chose qui n'existe pas
au premier tour.*

Les deux couches portaient la même `relative z-10` sur leur image nette, copiée de l'existant. Mais :

| Couche | Contexte d'empilement ? | Conséquence |
| --- | --- | --- |
| **Entrante** | **oui** — elle anime son opacité | son `z-10` reste enfermé dedans ; elle-même ne vaut que `z-auto` |
| **Sortante** | **non** — elle n'anime rien | son `z-10` **s'échappe** et écrase le `0` de sa sœur |

**L'ancienne image passait donc par-dessus la nouvelle pendant tout le fondu.** Le fondu jouait en
entier, **caché**, puis la couche du dessus disparaîssait d'un coup au bout des 700 ms. *Un fondu
qui joue entièrement caché se voit comme une coupe franche.*

⭐ **Mesuré, et non déduit.** `elementFromPoint` au centre du cadre, en plein fondu, dans le moteur
de rendu d'Electron : `ancienne` sans les `z-index` explicites, `nouvelle` avec. *Un défaut
d'empilement ne se raisonne pas — j'avais quatre hypothèses, la mesure en a gardé une.*

⚠️ **La leçon qui vaut au-delà de ce fichier** : *l'ordre de deux couches superposées se dit, il
ne se devine pas.* Un `z-index` implicite dépend de qui crée un contexte d'empilement — donc d'une
animation, d'une opacité, d'un filtre : **des propriétés qu'on change pour des raisons visuelles,
sans penser à l'ordre.** Les deux écrans portent désormais `z-0` / `z-10` en toutes lettres, le
Player Hub compris — où le défaut n'existait pas encore.

⚠️ **Et celui-ci était à moi.** Les deux autres du § 56 étaient antérieurs aux diaporamas ;
celui-là est né de mon propre correctif du matin, et c'est **David qui l'a trouvé à l'écran**. Le
motif du mois : *tous les défauts d'affichage de ce dépôt ont été trouvés à l'écran, aucun par
relecture.*

#### Un seul mécanisme pour les deux écrans

Le Player Hub passait par `AnimatePresence`, qui lui a coûté **deux** défauts en un jour :
`mode="wait"` (trois secondes de noir), puis le démarrage avant décodage. Il partage désormais
`useFonduCroise` avec le projecteur — **le minutage, pas le balisage** : le projecteur pose l'image
sur un flou d'elle-même, le Hub la couvre en fond.

⚠️ **Le Hud garde sa seconde et demie** contre 700 ms au projecteur : c'est son langage depuis
toujours. *L'écran de la table est un décor, pas un instrument.*

⚠️ **Un film ne se croise pas** : deux vidéos superposées jouent leur son ensemble. Elles gardent
la voie directe, sans fondu — même règle que le projecteur depuis le 31/08.

⚠️ **Les tablettes gardent la coupe franche** : elles n'ont jamais eu de fondu, et David ne les a
pas signalées. Ligne non ouverte, mentionnée pour qu'elle ne se découvre pas par surprise.

#### La leçon

⭐ **Une fonctionnalité nouvelle est un banc d'essai pour l'ancienne — deuxième fois le même
jour.** Le matin, les diaporamas ont montré que le fondu passait par le noir. Le soir, ils ont
montré qu'il jouait à vide et que les images gardaient leur taille. *Un meneur qui projette une
image toutes les deux minutes ne peut voir aucun des trois ; un diaporama les montre quatre-vingt
fois par heure.*

**Ancres** : `useFonduCroise.ts` (décodage avant fondu, couture `charger` pour les essais, 8 tests),
`ProjectorView.tsx` (rend `entrante` et non `resolvedUrl` ; `w-full h-full` ; `z-0`/`z-10`),
`PlayerHub.tsx` (`AnimatePresence` retiré ; `z-0`/`z-10`), `index.css` (`gmos-fondu-sortant`),
`tailleDeLImageProjetee.test.ts` (5 gardes). Dégradation éprouvée : **7 tests sur 8** rougissent
quand on annonce l'image avant de la décoder ; l'empilement, lui, est **mesuré dans le moteur**.

**Vérifié** : `tsc -b` propre, **4 486 tests** (374 fichiers, 1 ignoré), **173 tests E2E**.

✅ **ÉPROUVÉ EN RÉEL le 2026-09-14** — David : *« diaporama est bon »*. Les trois correctifs de
cette section tiennent à la table.

⭐ **Ce que la journée enseigne sur le prix d'un essai.** Le diaporama a demandé **trois
allers-retours** après sa livraison, et chacun a rendu un défaut d'affichage qu'aucun des quatre
mille tests ne pouvait voir : *« cela marche, à part le fondu »*, puis *« un temps mort puis un
saut »*, puis *« la première image fond, les suivantes non »*. **Chaque formulation désignait sa
cause** — la dernière nommait même la couche qui n'existe pas au premier tour. *Un meneur qui décrit
ce qu'il voit en dit plus qu'une pile d'appels.*

### 57 · ⛔ Les moniteurs portaient leur nom système dans le storyboard (2026-09-13)

*David : « les noms des moniteurs ne sont pas corrects dans le storyboard ».*

L'éditeur d'un moment listait `ecran.label` — **l'étiquette du système**, quand ce n'est pas
l'identifiant brut. Les noms donnés par le meneur vivent dans `useHardwareStore`, rangés **par
signature** pour survivre au rebranchement (§ 51), et rendus par `getDisplayLabel`.

⚠️ **Ce qui rend l'oubli si facile à commettre** : le même composant nommait déjà correctement
les **sorties audio**, trois listes plus haut, avec `getAudioLabel` — et il tenait déjà le magasin
qui porte les deux. *Deux moitiés d'un même réglage, écrites au même endroit, et une seule fait le
détour par le nom du meneur.*

⭐ **Et ce n'était pas une famille — vérifié avant de le dire.** Les deux autres écrans qui
proposent un moniteur (l'atlas, les liens web) passent par `ecransDeProjection`, qui prend
`getDisplayLabel` en paramètre. L'écran des Réglages montre le libellé système **exprès** : c'est
là qu'on nomme les moniteurs, il faut savoir lequel on nomme. *Compter avant de généraliser vaut
aussi quand le compte rend « un ».*

#### ⛔ Et la garde écrite pour l'empêcher de revenir s'est validée sur sa propre documentation

La première version cherchait `getDisplayLabel` dans la source du fichier. Avec le défaut **remis**,
elle passait toujours au vert : le commentaire qui explique le défaut **cite `getDisplayLabel`**.
*Un appel et une citation ne se distinguent que si l'on retire les commentaires.*

Troisième occurrence du motif après `nomsSansEcrivainNiLecteur`, qui avait réclamé le retrait d'une
tolérance pour un nom cité dans un commentaire. **Une garde qui lit des noms ne peut pas lire des
intentions — mais elle peut au moins ne lire que du code.**

⭐ Et une seconde fois dans le même fichier : la garde cherchait d'abord le **sélecteur Zustand**
(`.displays)`), ce qui ne voyait pas l'écran des Réglages, qui déstructure le magasin. *Sa propre
liste de dispenses l'a dénoncée : elle dispensait un fichier qu'elle ne trouvait même pas.* Elle
cherche désormais **le geste** — parcourir la liste — et non la façon de l'obtenir.

**Ancres** : `StoryboardDashboard.tsx` (`getDisplayLabel(ecran.id)`),
`nomDesEcransALEcran.test.ts` (3 gardes, dispense motivée pour les Réglages, lecture sans
commentaires). Dégradation éprouvée : la garde nomme le fichier fautif.

**Vérifié** : `tsc -b` propre, **4 489 tests** (375 fichiers, 1 ignoré), **173 tests E2E**.

### 58 · ✅ La tablette fond comme les autres — la troisième surface (2026-09-14)

*Demande de David, après que je l'ai signalée comme différence non traitée : « règle la question
de la coupe franche sur tablettes ».*

Elle était la **dernière des trois surfaces sans fondu** : le projecteur et le Player Hub en avaient
un depuis la veille, la tablette remplaçait l'image d'un coup. Ça ne se voyait pas tant qu'une image
partait toutes les deux minutes ; un diaporama le montre quatre-vingt fois par heure.

Même mécanique, **même durée que le Hub** (1,5 s, tranché par David) : *les tablettes reflètent
l'écran de la table, elles en suivent le rythme.*

⭐ **La durée a changé de maison.** Elle vivait dans `PlayerHub.tsx` ; deux écrans qui la
recopieraient finiraient par diverger le jour où l'un des deux se règle. Elle est désormais
`FONDU_COTE_JOUEURS_MS`, exposée par le crochet du fondu — *une durée partagée appartient au
mécanisme, pas à l'un de ses appelants.*

⚠️ **L'opacité du cadre a dû partir.** La tablette pilotait son fond par une opacité sur le cadre
(`opacity: resolvedBackground ? 1 : 0`, transition d'une seconde). La garder aurait fait **fondre
deux fois la même image, à deux rythmes**. Ce sont les couches qui portent le fondu maintenant.

⚠️ **Une vidéo garde la voie directe**, ici comme ailleurs : deux films superposés joueraient leur
son ensemble. *Une image muette peut s'attarder, pas un film.*

⭐ **Et la garde d'empilement couvrait deux écrans sur trois.** La tablette y entre — elle était
la dernière surface où la question de l'ordre des couches ne se posait pas, donc la seule où le
défaut du § 56 pouvait renaître sans que rien ne le dise.

⛔ **Et j'avais écrit dans le guide, la veille, que les tablettes n'ont pas de fondu.** La phrase
est devenue fausse avec ce chantier, et corrigée dans le même geste. *Une documentation qui décrit
un manque devient un mensonge le jour où l'on comble le manque* — c'est le prix d'écrire ce qu'on
ne fait pas, et il vaut quand même d'être payé.

**Ancres** : `useFonduCroise.ts` (`FONDU_COTE_JOUEURS_MS`), `TabletHub.tsx`, `PlayerHub.tsx`,
`tailleDeLImageProjetee.test.ts` (la garde d'empilement passe à trois écrans),
guide 24 § « Les diaporamas ».

**Vérifié** : `tsc -b` propre, **4 490 tests** (375 fichiers, 1 ignoré), **173 tests E2E**.

### 59 · ⛔ Le QR-code envoyait la tablette parler à Vite (2026-09-14)

*Signalé par David : « la tablette joueur pointe vers Eternal Quest et pas vers la campagne en
cours », puis, à la question de la voie d'entrée : « je suis passé par le QR-code ».*

#### Ce que le symptôme désignait, et ce qu'il désignait vraiment

« The Eternal Quest » n'est pas une campagne de David : c'est `INITIAL_DATA`, la campagne de
démonstration que porte tout magasin `useSessionOSStore` **neuf**, avec son `activeCampaignId:
'c-1'`. La voir, c'est voir un écran **qui n'a jamais reçu l'état du meneur**.

Le pont répond **deux ports** à la question « où est l'application ? » :

```js
port:      devPort ? 5173 : 3001   // Vite en développement, le SyncServer en production
mediaPort: 3001                    // le SyncServer, TOUJOURS
```

Le QR-code n'écrivait que `port`. En développement — le régime où David travaille — il envoyait donc
la tablette sur **Vite**. Elle y charge l'application sans difficulté ; puis
`portDeSynchronisation()` déduit le port de synchronisation de `window.location.port`, parce qu'elle
affirmait ceci :

> *« Elle charge l'application depuis le SyncServer lui-même : son `window.location.port` EST le
> port de synchronisation. »*

**L'affirmation est vraie en production et fausse dès que Vite sert la page.** La tablette ouvrait
sa WebSocket sur le serveur de rechargement à chaud.

#### ⭐ Mesuré avant d'être annoncé

Une WebSocket ouverte sur chacun des deux ports, comme le ferait une tablette :

```
ws://…:3001  -> OUVERT, reponse immediate : remote:registered
ws://…:5173  -> OUVERT, et AUCUN message en 4 s
```

**Vite accepte la connexion et ne dit jamais rien.** C'est tout le défaut : la tablette passait en
`status: 'connected'`, affichait son icône de réseau, et n'a jamais reçu une seule campagne.

> ⛔ *Un refus se voit ; un silence poli ne se voit pas.* Une connexion refusée aurait mis la
> tablette en reconnexion toutes les cinq secondes, avec l'icône barrée — David aurait su quoi
> signaler. Accueillie et ignorée, elle n'avait rien à dire, et le symptôme est ressorti à l'autre
> bout de l'application : **dans le nom d'une campagne**.

⚠️ **Et les images suivaient le même chemin.** `useMediaUrl` compose `/media/` et `/temp/` sur ce
même port : la tablette les demandait à Vite, qui répond son `index.html`. *Une image qui arrive en
`text/html` ne s'affiche pas* — le commentaire de `remote:get-connection-info` décrivait déjà ce
mode d'échec, mot pour mot.

#### ⛔ Troisième fois que ces deux champs sont confondus

1. Le **proxy des médias** — la raison pour laquelle `mediaPort` existe ;
2. Le **pont des boutons de l'afficheur**, le 2026-09-12, trouvé par David le lendemain : le panneau
   affichait `http://…:5173/bouton`, Home Assistant y postait, et Vite répondait son `index.html` ;
3. Le **QR-code**, ici — et il l'écrivait **depuis toujours**.

⭐ **Le correctif du 13/09 avait laissé la phrase juste au mauvais endroit.** `adresseDuPontDesBoutons`
porte depuis ce jour-là : *« la seule défense est de ne composer cette adresse qu'ici »*. Elle était
vraie, et elle ne protégeait **que son propre fichier** — deux autres écrans composaient la leur à la
main, deux dossiers plus loin. *Une règle énoncée dans un commentaire ne protège que le fichier qui
la porte ; il faut une garde pour qu'elle porte plus loin.*

#### Ce qui a été fait

⭐ **On le lui dit, au lieu de le lui faire deviner.** L'adresse porte désormais les **deux** ports :

```
http://192.168.1.20:5173/?window=tablet&sync=3001
                    └ où charger l'application    └ où est le SyncServer
```

`portDeSynchronisation()` lit trois sources dans cet ordre : **ce que l'adresse annonce**, puis d'où
la page vient, puis le défaut. Les cinq lecteurs du port — les deux WebSockets et les trois
compositions d'URL de média — passent tous par elle, donc **la synchronisation et les images se
réparent du même geste**.

⚠️ **Le rechargement à chaud est préservé** — décision de David entre les deux voies possibles.
L'autre était de faire pointer le QR-code sur le `SyncServer`, qui sert `dist/` : une ligne, mais la
tablette n'aurait plus montré que le dernier `npm run build`.

⚠️ **En production les deux ports sont le même nombre.** Le paramètre y est redondant, et il est
écrit quand même : *le rendre conditionnel n'aurait fait qu'ajouter un cas où il peut manquer.*

⚠️ **La télécommande avait exactement le même défaut**, et personne ne l'avait signalée — elle est un
client du navigateur, elle rejoint le `SyncServer` par le même chemin, et l'écran des Réglages lui
composait la même adresse fautive. *Le second exemplaire d'un défaut ne se trouve qu'en cherchant qui
d'autre fait le même geste.*

#### Les gardes

- **`portsDuRenderer.test.ts`** — 17 essais : l'annonce l'emporte sur la déduction, un port illisible
  ne vaut pas moins qu'un port absent, les deux régimes, et **l'adresse porte les deux ports quand
  ils diffèrent**. Dégradation faite : la déduction seule rend `5173 au lieu de 3001`, qui est le
  défaut de David, mot pour mot.
- **Une garde de dépôt** : plus personne ne compose `?window=tablet` ni `?window=remote` en toutes
  lettres. ⛔ *Elle a mordu à la première exécution* — sur `Shell.tsx`, que je venais de corriger à
  moitié en y laissant l'ancienne adresse comme repli.
- ⚠️ **Elle lit le code sans les commentaires** : ceux que ce correctif a écrits citent l'ancienne
  adresse pour l'expliquer. *Quatrième fois que cette précaution est nécessaire dans ce dépôt* —
  après `nomsSansEcrivainNiLecteur` et `nomDesEcransALEcran`.
- **`boutonsUlanzi.spec.ts`** — un essai de bout en bout de plus : l'adresse affichée annonce le port
  de **cette instance**. ⚠️ Il ne verrait pas la confusion elle-même : en production, les deux ports
  sont le même nombre. *Un test de bout en bout ne voit que ce que son environnement distingue* — il
  garde le paramètre, pas la distinction.

**Ancres** : `portsDuRenderer.ts` (`PARAMETRE_PORT_SYNC`, `adresseDeLaTablette`,
`adresseDeLaTelecommande`, `portDeSynchronisation`), `NetworkQRCodeModal.tsx`,
`GlobalSettingsModal.tsx`, `Shell.tsx`, `portsDuRenderer.test.ts`, `boutonsUlanzi.spec.ts`.

**Vérifié** : `tsc -b` propre, **4 507 tests** (376 fichiers, 1 ignoré), **174 tests E2E**.
✅ **ÉPROUVÉ EN RÉEL le 2026-09-14** : David a rescanné, la tablette reçoit sa campagne. *C'est ce
chantier qui débloquait les deux suivants* — tant qu'elle parlait à Vite, aucun des deux n'était
observable.

### 60 · ⛔ La tablette offrait les paquets d'un autre jeu (2026-09-14)

*Signalé par David : « j'ai désactivé les cartes pour Blade Runner mais elles restent visibles dans
la tablette ». Le geste, précisé : il avait **sorti le paquet de Blade Runner** — changé son
système.*

#### Une asymétrie entre deux lecteurs de la même liste

| | filtre par **jeu** | filtre par **ouverture** |
|---|---|---|
| Bibliothèque du meneur (`useDeckLibrary`) | ✅ | — |
| Onglet Cartes de la tablette (`HubMainDeCartes`) | ⛔ **aucun** | ✅ |

La tablette ne regardait que `ouvertAuxJoueurs`. Un paquet rendu à un autre jeu quittait donc
l'écran du meneur **et restait offert aux joueurs** — la seule liste où personne ne pouvait le voir
disparaître, puisque le meneur, lui, ne l'affichait plus.

⭐ **Le défaut n'était pas une règle fausse : c'était une règle que le second lecteur ne connaissait
pas.** C'est le motif que Deck-OS avait déjà payé le 2026-08-30, quand la liste « Donner à »
ignorait la campagne **et** la connexion. *Une règle qui vit dans un écran ne protège que cet
écran.*

#### Ce qui a été fait

La règle vit maintenant dans `logic/paquetsDuJeu.ts` — pure, testée, et **prise au même endroit par
les deux écrans** :

- `systemeDeLaCampagne(campagnes, id)` → le jeu de la campagne ouverte, `generic` sinon ;
- `paquetsDuJeu(paquets, jeu)` → ceux du jeu, **plus les universels** ;
- `paquetsOffertsAuxJoueurs(paquets, jeu)` → les deux moitiés, pour la tablette.

⚠️ **Le meneur garde son interrupteur** (`showAllDecks`, vrai par défaut) : il **range** ses paquets,
donc il lui faut pouvoir les voir tous. La tablette n'en a pas — *un joueur ne range rien.*

⚠️ **Un piège de nommage qui vaut d'être écrit** : le champ s'appelle **`system` sur la campagne** et
**`systemId` sur le paquet**. Deux noms pour la même chose, et c'est exactement ce qui fait écrire
`deck.systemId === campaign.systemId` — une comparaison avec `undefined`, toujours fausse, donc une
liste vide que personne ne sait expliquer. La fonction est là aussi pour ça.

⚠️ **Une carte déjà tenue en main n'est PAS filtrée**, exprès. *On ne retire pas de la main ce qu'on
se contente de ne plus proposer* : la cacher parce que son paquet a changé de jeu la rendrait
injouable et irrécupérable, sans que personne sache où elle est passée.

⚠️ **Le meneur continue de diffuser tous les paquets.** Filtrer à la source casserait l'affichage
d'une carte tenue dont le paquet appartient à un autre jeu. *On filtre ce qu'on propose, pas ce
qu'on transporte.*

#### La garde

⛔ **Vérifier que la fonction est juste n'aurait rien protégé.** Ce qu'il faut interdire, c'est le
**second filtrage écrit à la main** — c'était ça, le défaut. `paquetsDuJeu.test.ts` refuse donc tout
`.filter(… ouvertAuxJoueurs …)` ailleurs que dans `paquetsDuJeu.ts`. Dégradation faite : l'ancien
filtre remis, la garde nomme `HubMainDeCartes.tsx`.

⚠️ **Ce qu'aucun test ne couvre** : personne ne rend l'onglet Cartes de la tablette. Les quatorze
essais portent sur la règle, la garde porte sur son unicité — *l'écran lui-même n'est vu que par
David.*

#### ⭐ Ce que la donnée a dit avant le code

La sauvegarde de 19 h 53 portait trois paquets, dont **« Torg Action » déclaré sous
`custom-1774725549525`** — l'identifiant du pilote **Blade Runner**. C'est ce qui a permis de
comprendre la plainte avant de toucher au code : un paquet nommé pour un jeu et rangé sous un autre,
seul paquet ouvert aux joueurs, dans la seule campagne ouverte. *Lire les données du meneur coûte
deux minutes et remplace trois hypothèses.*

**Ancres** : `logic/paquetsDuJeu.ts`, `logic/paquetsDuJeu.test.ts`, `HubMainDeCartes.tsx`,
`hooks/useDeckLibrary.ts`.

**Vérifié** : `tsc -b` propre, **4 521 tests** (377 fichiers, 1 ignoré), **174 tests E2E**.
✅ **ÉPROUVÉ EN RÉEL le 2026-09-14** : le paquet rendu à Torg a quitté l'onglet Cartes de la
tablette.

### 61 · ✅ Un PJ passe d'un joueur à un autre (2026-09-14)

*Demande de David : « je voudrais pouvoir échanger un PJ d'un joueur vers un autre joueur ».*
Tranché avec lui : **transfert simple** (A → B), et **on prévient** quand l'ancienne tablette tient
encore le personnage, sans rien lui arracher.

#### ⭐ Pourquoi il n'y avait presque rien à faire — et pourquoi il fallait l'écrire

**Un `PlayerCharacter` ne porte aucun `playerId`.** Il appartient à celui dans la liste de qui il se
trouve, et à personne d'autre. Déplacer l'entrée suffit donc, *et l'identifiant du personnage ne
bouge pas* — or c'est lui que tout le reste vise :

| Ce qui aurait pu être à réécrire | Ce qui le vise réellement |
|---|---|
| La fiche, les notes privées, l'inventaire, la santé | vivent **sur** le personnage |
| Sa place dans la séance du soir | `sessionEntityIds` contient des ids de **personnages** |
| Les cartes tenues en main | `porteur === character.id` |
| Le combattant issu d'un PJ | `sourcePlayerId: character.id` — *le nom ment, la valeur est juste* |

⭐ **La conception qui tient, c'est de ne pas renuméroter.** *Un transfert qui changerait
l'identifiant aurait à réécrire tout ce tableau ; celui qui le garde n'a rien à réécrire.* C'est
écrit en tête de `transfertDePersonnage.ts` — sans quoi quelqu'un « complétera » un jour ce qui n'a
rien d'incomplet, et c'est ce jour-là que les cartes d'un joueur disparaîtront.

#### ⚠️ Le seul fil qui ne suit pas : le verrou d'appareil

`connectedCharacters` **n'est pas un champ qu'on écrit** : c'est le reflet des clients connectés,
recalculé à chaque `remote:sync-clients`. Le transfert ne peut donc pas le défaire.

Trois voies étaient possibles ; David a tranché pour la première :

1. ✅ **Prévenir** — le transfert a lieu, et l'écran dit que la tablette de l'ancien joueur tient
   encore ce PJ, qui doit appuyer sur « Quitter ». *Aucun IPC nouveau, rien d'irréversible.*
2. Libérer d'office — il n'existe qu'un **« Éjecter TOUT le monde »** (`remote:eject-all`) ; il aurait
   fallu ajouter une éjection ciblée, du pont jusqu'à la tablette.
3. Refuser le transfert tant qu'un appareil tient le PJ — *le plus sûr, et le plus fermant : on ne
   répare plus une erreur en pleine partie.*

`leVerrouDeLAncienJoueur` existe pour que l'écran puisse le **dire**, faute de pouvoir le défaire.

#### Deux détails qui ne se voient qu'à l'usage

⛔ **Un refus rend la liste par RÉFÉRENCE**, pas une copie. Une copie ferait croire à un changement à
tout ce qui compare par identité — la diffusion vers les tablettes en premier, qui rediffuserait la
liste entière des joueurs pour un geste qui n'a pas eu lieu.

⚠️ **La sélection se relâche avec le personnage.** Elle vise un PJ *chez le joueur ouvert* : le
personnage parti, le panneau de droite ne trouvait plus rien et affichait son invite — un écran vide
sans qu'on ait rien fermé.

⭐ **La liste « Transférer vers… » est un geste, pas un état** : elle revient sur son intitulé après
chaque usage. *Une liste qui garderait le nom choisi se lirait comme « ce personnage appartient
à… »*, alors que le porteur, c'est la colonne de gauche qui le dit.

#### Ce qui est éprouvé, et ce qui ne l'est pas

Quinze essais sur la règle, dont le seul qui compte vraiment : **le personnage arrive identique**,
identifiant, fiche, notes, inventaire et campagne compris. Dégradation faite — on renumérote à
l'arrivée, deux essais rougissent.

⚠️ **Aucun test ne pilote l'écran.** Personne ne conduit la grille des personnages de bout en bout,
et l'écran des joueurs n'a pas de test E2E du tout. *La règle est gardée, le geste ne l'est pas.*

**Ancres** : `logic/transfertDePersonnage.ts`, `logic/transfertDePersonnage.test.ts`,
`store/entitySlice.ts` (`transfererLePersonnage`), `components/CharacterGrid.tsx`,
`locales/{fr,en}/modules.json`, guide 10 § « Donner un personnage à un autre joueur ».

**Vérifié** : `tsc -b` propre, **4 536 tests** (378 fichiers, 1 ignoré), **174 tests E2E**.
✅ **ÉPROUVÉ EN RÉEL le 2026-09-14** : un PJ transféré, arrivé entier chez son nouveau joueur.
⚠️ **Sauf un cas, qui ne se rencontre qu'en séance** : transférer pendant que l'ancien joueur est
connecté dessus. GM-OS prévient sans éjecter, et personne n'a encore vu si l'avertissement suffit.

### 62 · ⭐ L'Atelier des tables — et les deux oracles qui mentaient depuis toujours (2026-09-15)

*Demande de David : « est-ce qu'on pourrait faire un module dans Table-OS qui aide à la création des
fichiers JSON ? Propose-moi quelque chose ».*

#### ⛔ Ce que le comptage a trouvé avant qu'une ligne soit écrite

Les 46 tables livrées, passées au crible **avant** de proposer quoi que ce soit. Deux étaient
cassées :

| Table | Dé déclaré | Jets qui ne tombent sur aucune entrée |
| --- | --- | --- |
| `Alien/blessures_critiques.json` | `1d66` | **45 %** |
| `Alien/avaries_mineures_vaisseaux.json` | `1d66` | **33 %** |

La forme juxtaposée s'écrit `d66` — *un seul chiffre, répété, et **rien devant***. `1d66` est une
formule parfaitement valide, et c'est tout le piège : le moteur y lit un dé **uniforme à 66 faces**,
quand les entrées vont de 11 à 66 par paires de d6.

⛔ **Et `resolveEntry` ne dit jamais qu'il n'a rien trouvé** : il rend l'entrée la plus proche, et
« la plus proche » au-dessus de la première borne veut dire **la dernière**.

> **Un 17 sur la table des blessures critiques rendait l'entrée 66** — la pire blessure du jeu, lue à
> voix haute, sans une ligne de journal.

⭐ **Aucune de ces 46 tables n'écrivait un dé juxtaposé correctement.** La fonctionnalité est
documentée dans le guide 40 depuis des mois ; les deux seules tables qui l'essayaient l'écrivaient
mal. *Elle n'avait jamais fonctionné une seule fois.*

⚠️ **Et ma première passe s'est trompée sur sept tables sur neuf.** Elle comptait comme fautives les
entrées **au-delà de la portée du dé** — `test_de_panique` déclare `1d6` et va jusqu'à 20, parce que
le jet de panique **ajoute le stress**, et Table-OS a un champ « Modificateur » exprès. Les
sentinelles `-99` / `99` relèvent du même idiome. *Un contrôle qui accuse à tort se fait désarmer :
il valait mieux le découvrir en lisant deux fichiers qu'après l'avoir livré.*

#### Ce que ça a décidé du module

Le problème n'était **pas de taper du JSON** — c'était que *rien ne relisait ce qu'on avait tapé*. Un
trou de couverture est invisible dans un fichier : les bornes se suivent, chaque entrée est
plausible, et il faudrait tenir la liste des valeurs du dé dans sa tête pour voir ce qui manque.

D'où l'ordre de l'écran : **la bande de couverture d'abord**, les champs ensuite. Une case par
valeur tirable — verte, rouge si personne ne la couvre, ambre si deux entrées se la disputent.
*Un éditeur qui ne montre que ce qu'on a écrit ne vaut pas mieux qu'un éditeur de texte.*

⚠️ **Une valeur, une case — jamais un ruban mis à l'échelle.** Un `d66` n'a pas 56 valeurs entre 11
et 66, il en a 36. Dessiner un intervalle continu mentirait exactement là où la bande doit être
juste : *ce qui n'est pas tirable n'est pas dessiné.*

⭐ **Et le dé se choisit au lieu de se taper.** `1d66` devient **inexprimable** plutôt que rattrapé
après coup — le geste de l'éditeur des tables de butin, pour la même raison. Le champ libre reste
pour les formules qu'aucune liste ne prévoit, et le contrôle veille dessus en nommant la forme
voulue : *un message qui ne dit pas quoi écrire à la place laisse chercher.*

#### ⛔ Le préalable : on ne branche pas une écriture sur un chemin qu'on ne contient pas

Les trois lecteurs de Table-OS composaient leur chemin ainsi :

```ts
path.join(appRoot, 'databases', 'tables', universe, `${tableName}.json`)
```

`universe` et `tableName` **viennent du renderer**, et rien ne les regardait — un `..` sortait du
dossier. C'était une fuite en lecture tant que rien n'écrivait ; le jour où l'Atelier reçoit
`saveTable`, la même forme devient un moyen d'écraser n'importe quel fichier du dépôt.

`cheminDesTables.ts` referme les quatre, et il exige **un seul segment**, pas seulement « sous la
racine » : `strictementSous` accepterait `Alien/secret/tresor`, un dossier imbriqué que
`list-universes` ne montrerait jamais. *Un chemin qu'un seul des deux côtés sait produire est un
chemin qui se perd.*

#### Trois décisions qui se relisent

⚠️ **Une seule lecture de la formule.** `TableEngine.rollDice` portait ses propres expressions
régulières ; le contrôle en aurait eu une seconde copie. *Deux lectures auraient divergé le jour où
l'une accepte `1d66` et pas l'autre* — c'est-à-dire le défaut ci-dessus, mais en pire : le contrôle
aurait alors déclaré **saine** une table que le moteur casse. Un essai croise les deux — trois cents
tirages par formule, tous dans les valeurs annoncées.

⚠️ **L'Atelier prévient, il n'interdit pas.** Une table fautive est enregistrable après
confirmation : le meneur travaille par étapes, et refuser une sauvegarde à moitié faite lui ferait
tout perdre. **La garde du dépôt, elle, refuse ce qui serait livré** — les deux ne protègent pas la
même chose.

⚠️ **Le découpage automatique coupe la LISTE des valeurs, pas l'intervalle.** Couper `d66` en deux au
milieu donnerait `11-38`, et 38 ne peut pas sortir. Le reste va aux **premières** plages : *les
premières entrées d'une table sont les plus banales, c'est là qu'une valeur de plus se remarque le
moins.*

#### Ce qui est gardé, et ce qui ne l'est pas

- **`formeDeLaTable.test.ts`** — 53 essais : lecture de formule, valeurs possibles, contrôle,
  découpage, et le croisement moteur / contrôle.
- **`tablesDuDepot.test.ts`** — balaie les 46 fichiers et refuse une table trouée. Dégradation
  faite : le `1d66` remis, elle nomme le fichier **et le pourcentage**.
- **`cheminDesTables.test.ts`** — 22 essais de confinement, dont celui qui atteint le `package.json`
  du dépôt sans la garde.
- **`tableOs.spec.ts`** — trois essais de bout en bout : la bande réagit au trou, **une table écrite
  dans l'atelier se retrouve dans le pupitre**, et elle se supprime. *Le seul essai qui traverse le
  pont, le confinement et le disque.*

⚠️ **Ce qui n'est pas fait** : l'**import**. Coller le texte brut d'une table de manuel et le voir se
ranger en entrées, puis le passer à l'IA à schéma imposé — la troisième couche de la proposition,
laissée de côté avec David *pour qu'on voie d'abord ce qui manque à l'usage.* Le
`Prompt Aide Création de Table.txt` vit donc toujours dans `databases/tables/MedFan/`.

⚠️ **Et l'IA ne lira pas une photo de page de livre.** `AIService` génère des images, il n'en lit
pas. Cette voie-là reste celle de ChatGPT, ou un chantier OCR à part.

**Ancres** : `logic/formeDeLaTable.ts`, `atelier/AtelierDesTables.tsx`,
`atelier/BandeDeCouverture.tsx`, `TableEngine.ts`, `electron/cheminDesTables.ts`,
`electron/main.ts` (`tables:save-table`, `tables:delete-table`), `TableDashboard.tsx`,
guide 40 § « L'Atelier des tables ».

**Vérifié** : `tsc -b` propre, **4 617 tests** (381 fichiers, 1 ignoré), **177 tests E2E**.
✅ **ÉPROUVÉ EN RÉEL le 2026-09-15** — David : *« j'ai testé c'est bon »*. La ligne de l'import
s'ouvre dans la foulée.

### 63 · ⭐ L'import de l'Atelier — coller un manuel, et laisser le contrôle relire (2026-09-15)

*David, après avoir éprouvé l'Atelier : « ok j'ai testé c'est bon, on passe à la partie Import ».*
La troisième couche de la proposition, laissée de côté exprès pour voir d'abord ce qui manquait à
l'usage.

#### Deux chemins, et deux boutons — pas un réglage

| | Ce que ça fait | Ce que ça exige |
| --- | --- | --- |
| **Ranger tel quel** | Un lecteur déterministe, hors ligne | Rien |
| **Ranger par l'IA** | Répartit titre / ambiance / effet | Un modèle |

⛔ **Le collage ne coupe rien.** Le texte d'une ligne va dans le **titre**, entier. Découper « titre »
et « ambiance » sur un point ou un tiret serait une devinette, et on lirait à voix haute des titres
coupés au milieu. *La répartition est le travail de la passe IA, qui propose et se relit.*

⭐ **Ce qui n'est PAS une devinette** : une ligne sans numéro qui en suit une numérotée appartient à
celle-ci — c'est la forme des manuels, un résultat puis son paragraphe. Elle devient la description.

⛔ **Et le piège qui aurait décalé des tables entières** : `11 — Fuite d'oxygène` **n'est pas une
plage**. Un tiret ne fait une plage que s'il a des **chiffres des deux côtés**. C'est la ponctuation
la plus courante des tables françaises, et six essais la gardent — tiret court, demi-cadratin,
cadratin, point, parenthèse, deux-points.

Le collage lit aussi les tableaux Markdown et les tabulations — les deux formes réelles du
copier-coller depuis une page web et depuis un PDF. Ce qu'il ne sait pas rattacher est **compté et
montré**, jamais avalé : *un import qui jette en silence laisse croire que la table est complète.*

#### ⭐ Ce qui rend la passe IA acceptable, et qui n'est pas dans l'invite

Ce n'est pas la qualité du prompt : c'est que **rien n'est appliqué sans repasser par
`controlerLaTable`**, et que la bande de couverture s'affiche avant qu'on enregistre.

> *Un modèle qui oublie les valeurs 17 à 20 produit une table parfaitement plausible ; la bande la
> montre rouge en une seconde.*

**Le modèle propose, le contrôle relit, l'écran montre.** C'est la seule raison pour laquelle on peut
se permettre de laisser une machine écrire des oracles — et un essai fait exactement ce chemin : une
réponse tronquée à 12 sur un `1d20`, et le constat qui nomme 13 à 20.

⚠️ **Une entrée sans bornes lisibles est écartée, pas rafistolée.** Lui inventer un `min` la
placerait au hasard : *une entrée perdue se voit dans la bande, une entrée déplacée ne se voit nulle
part.*

Le `Prompt Aide Création de Table.txt` de `databases/tables/MedFan/` entre donc dans l'application —
*une consigne qui vit dans un fichier texte qu'on copie à la main est une consigne qu'on finit par ne
plus copier.*

#### ⛔ Deux fois, un essai a eu raison contre moi

**1. Le contrôle accusait les creux d'un dé juxtaposé.** En collant une liste sur un `d66`,
`decouperLaPortee` produit des plages contiguës — 11 à 26, 31 à 46 — qui contiennent douze valeurs
non tirables. Le contrôle les signalait en conseillant « un modificateur ». *Elles sont sans effet :
rien ne tombe dedans, et couvrir large ne coûte rien.* La remarque ne porte plus que sur ce qui sort
**de part et d'autre** de la portée.

**2. L'essai de bout en bout m'a repris sur ce qu'il fallait attendre.** J'avais écrit que coller une
table de `1d20` dans une table de `1d6` ferait apparaître un trou. **Faux** : les six valeurs sont
couvertes par les deux premières entrées, la couverture est *complète*. Le vrai symptôme est
ailleurs — quatorze entrées **hors de portée**. *L'écran avait raison, mon essai avait tort.*

La remarque compte désormais les **entrées** et non seulement les valeurs : « 14 entrées sur 20 » se
lit d'un coup d'œil, « 14 valeurs » ne dit rien.

⛔ **Mais elle reste une `note`, et il faut que ça se sache.** On ne peut pas distinguer par une règle
la table collée sur le mauvais dé de la queue de table prévue pour un modificateur :
`Alien/test_de_panique` déclare `1d6` et a **neuf entrées sur dix** au-dessus de six — parfaitement
voulu. *Tout seuil qui attraperait la première accuserait la seconde.* On compte, on montre, on ne
tranche pas.

#### ⚠️ Une correction à ce que j'avais écrit

Le § 62 disait : *« l'IA ne lira pas une photo de page de livre — `AIService` génère des images, il
n'en lit pas »*. **C'est faux pour une moitié.** `generateJSON` accepte des pièces jointes et les
passe en `inline_data` à Gemini. Deux réserves, qui font que ce n'est pas branché ici :

- **seul le chemin Gemini** les honore — Ollama, Anthropic et les autres les ignorent en silence ;
- **aucun appelant n'emprunte ce chemin** dans tout le dépôt : il n'a jamais été exercé.

*Une capacité déclarée que personne n'appelle n'est pas une capacité, c'est une promesse.* Elle
attend un chantier qui la vérifie.

#### Ce qui est gardé

- **`collageDUneTable.test.ts`** — 30 essais : les six ponctuations, le tableau Markdown, les
  tabulations, le paragraphe rattaché, le d66 dont les bornes doivent être tirables, et le critère
  qui compte : *ce qui sort du collage passe le contrôle.*
- **`miseEnFormeParLIA.test.ts`** — 18 essais sur ce qu'on fait d'une réponse **abîmée** : bornes en
  chaînes, entrée nulle, bornes inversées, tableau nu, réponse vide. La couture d'essai est injectée,
  comme pour `useFonduCroise` : *on éprouve ce qu'on fait de la réponse, pas le modèle.*
- **`tableOs.spec.ts`** — l'import de bout en bout : l'aperçu chiffre avant d'appliquer, il dit la
  ligne non rattachée, et la bande relit derrière. ⚠️ **Seul le chemin déterministe** y est éprouvé :
  une instance d'essai n'a pas de modèle, et *un test qui prétendrait le couvrir donnerait une
  couverture décorative.*

**Ancres** : `logic/collageDUneTable.ts`, `logic/miseEnFormeParLIA.ts`, `atelier/ImportDeTable.tsx`,
`logic/formeDeLaTable.ts` (`hors-portee`), guide 40 § « Importer une table ».

**Vérifié** : `tsc -b` propre, **4 665 tests** (383 fichiers, 1 ignoré), **178 tests E2E**.
⚠️ **Pas encore éprouvé en réel** — et la passe IA ne l'a été par personne.

### 64 · ⭐ Les cinq portes de l'import — dont celle que GM-OS refusait à son propre format (2026-09-15)

*David, après l'import du § 63 : « explique-moi précisément les options de l'import ? Est-ce que je
peux importer des fichiers JSON ? des PDF ? des fichiers MD ? ».* **La réponse était non aux trois.**

#### ⛔ Ce que la question a mis au jour

Il n'y avait **aucun sélecteur de fichier** : tout passait par la zone de collage. Et surtout :

> **L'Atelier écrit du JSON et ne savait pas en lire.**

Le prompt livré dans `databases/tables/MedFan/` fait produire du **JSON** à ChatGPT — c'est le flux
que David emploie depuis toujours. Ce JSON-là ne pouvait entrer que par le disque, à la main.
*Un import qui refuse le format que l'application elle-même produit.*

⭐ **Mesuré avant d'être comblé**, plutôt que supposé : un JSON de table collé donnait **huit entrées
de charabia** —

```
regime = "lignes", 8 entrées :
  11-15  {
  16-24  "name": "Avaries mineures",
  25-33  "dice": "d66",
```

Visible dans l'aperçu, donc jamais destructeur, et parfaitement inutilisable.

#### Les cinq portes

| Porte | Comment |
| --- | --- |
| **Texte collé** | La zone, comme avant |
| **Table JSON** | Reconnue seule, **avec son nom et son dé** |
| **Fichier** `.json` `.md` `.txt` `.csv` | Ouvert, déposé dans la zone |
| **PDF** | Texte extrait par `pdf-parse`, déposé dans la zone |
| **Image** | Bandeau à part — **un seul chemin, le modèle** |

⭐ **`pdf-parse` était déjà là**, dépendance du moteur RAG qui indexe les manuels. *La porte la plus
chère à l'air libre coûtait une ligne de `require`.*

⚠️ **Le texte lu atterrit dans la zone de collage, il n'est pas rangé directement.** *Le meneur voit
ce qui a été lu avant de le ranger* — et un PDF mal extrait se corrige à la main au lieu d'être rangé
de travers.

⚠️ **L'image, elle, n'a nulle part à atterrir.** Elle s'annonce dans un bandeau qui dit « IA
seulement » : *la montrer comme une source parmi les autres ferait croire que « Ranger tel quel » la
lit.*

⭐ **Un JSON importé pose aussi le dé de la table.** Le nom, non, s'il y en a déjà un de tapé — *on ne
remplace pas ce que le meneur a écrit ; on remplace ce qui ferait mentir la bande.* L'essai de bout
en bout a d'abord rougi là-dessus, et il avait raison de le faire.

#### ⚠️ Deux confinements, et ils ne se ressemblent pas

`cheminDesTables.ts` se défend contre une chaîne **arbitraire venue du renderer** — c'est le § 62.
`lectureDeSource.ts` ne se défend de rien, **et c'est délibéré** : son chemin sort d'un
`showOpenDialog`, désigné à la souris par le meneur. *Mais il faut que ce soit vrai, pas supposé* —
d'où un canal IPC qui n'accepte **aucun paramètre de chemin**. Rien à valider parce que rien ne
traverse.

⚠️ **Un refus est une réponse, pas une exception.** « Pas le bon format », « illisible » et « les PDF
sont indisponibles » n'appellent pas le même geste du meneur, et l'écran les distingue.

#### Ce qui est gardé, et ce qui ne l'est pas

- **`collageDUneTable.test.ts`** — 11 essais de plus sur le JSON : tableau nu, bornes en chaînes,
  butin conservé, entrée sans bornes écartée **et montrée**, et le régime forcé à tort qui rend zéro
  entrée *plutôt que du charabia*.
- **`lectureDeSource.test.ts`** — 17 essais sur vrais fichiers temporaires, dont celui qui compte :
  *tout ce que le dialogue propose, le lecteur sait le lire.* Une liste d'extensions recopiée dans le
  dialogue finirait par diverger de celle qui lit.
- **`tableOs.spec.ts`** — le JSON collé de bout en bout : reconnu, nom et dé appliqués, bande
  complète sans qu'on ait rien retapé.

⛔ **Ce qui n'est PAS éprouvé, et il faut que ça se sache :**

1. **Le PDF.** Seul le fait que l'extension prenne la bonne branche est gardé. Fabriquer un PDF dans
   un test reviendrait à écrire un encodeur, et l'éprouver sur un PDF fabriqué par nous ne dirait
   rien des manuels réels — *un jeu d'essai qui ne ressemble pas à la donnée ne garde que lui-même.*
   La branche est celle que le moteur RAG emprunte depuis des mois.
2. **L'image.** Elle part en pièce jointe, et c'est tout ce qu'on garde. `generateJSON` ne l'honore
   que sur le chemin **Gemini** ; les autres fournisseurs **l'ignorent en silence**. Et ce chemin
   n'avait **jamais eu un seul appelant** dans le dépôt. *Une capacité déclarée que personne
   n'appelle n'est pas une capacité, c'est une promesse* — celle-ci attend son premier essai réel.

**Ancres** : `logic/collageDUneTable.ts` (`lireDuJson`), `electron/lectureDeSource.ts`,
`electron/main.ts` (`tables:ouvrir-une-source`), `atelier/ImportDeTable.tsx`,
`logic/miseEnFormeParLIA.ts` (pièces jointes), guide 40 § « Importer une table ».

**Vérifié** : `tsc -b` propre, **4 698 tests** (384 fichiers, 1 ignoré), **179 tests E2E**.
⚠️ **Pas encore éprouvé en réel** — et l'image encore moins que le reste.

### 65 · ⭐ La vision devient locale — et le fil qui manquait depuis toujours (2026-09-15)

*David : « je voudrais éviter d'utiliser Gemini pour mes PDF ou l'image, comment je peux faire ? ».*
La question en contenait deux, et elles n'avaient pas la même réponse.

#### Le PDF n'utilisait déjà pas Gemini

L'extraction est **locale** — `pdf-parse`, dans le processus principal. « Ranger tel quel » l'est
aussi. Un modèle n'intervient que si l'on presse « Ranger par l'IA », et c'est alors **le fournisseur
actif**, pas Gemini en particulier. *Rien à changer : il fallait seulement le dire.*

#### ⭐ L'image, elle, n'avait qu'un chemin — et la machine de David en portait un second

Interrogé sur son Ollama, avant d'écrire une ligne :

```
gemma4:12b   completion, vision, audio, tools, thinking
gemma4:26b   completion, vision, tools, thinking
llama3.2:3b  completion, tools              ← pas de vision
phi3         completion                     ← pas de vision
```

**Deux modèles qui voient, déjà installés.** Ce qui manquait n'était pas un modèle : c'était **un
fil**.

⛔ **Les pièces jointes s'arrêtaient dans `generateJSON`.** Il les servait à Gemini, qu'il traite
lui-même, et **ne les relayait à personne d'autre** — ni `generateText`, ni `executeRequest` n'avaient
de paramètre pour les porter. Plus bas, la branche Ollama composait ses messages en
`{ role, content }`, un type écrit **en toutes lettres à dix endroits**.

> *Un champ qu'aucun type n'accepte ne se perd pas avec fracas : il ne s'écrit simplement jamais.*

Le fil passe maintenant de bout en bout : `generateJSON` → `generateText` → `executeRequest` →
message Ollama, avec `images` en base64 **nu** — un `data:image/png;base64,…` recopié tel quel est
accepté par l'API et rend une description de rien. Et les dix déclarations en ligne sont devenues
**un type nommé**, `MessageOllama`.

#### ⛔ La garde, sans laquelle le correctif serait pire que le défaut

**Un modèle sans capacité `vision` reçoit l'image, l'ignore, et répond quand même.** On obtiendrait
une table inventée de bout en bout — plausible, complète, fausse. Et **la bande de couverture serait
verte**, parce qu'une table inventée est toujours bien formée. *Le mode d'échec le plus cher de ce
dépôt est celui qui ne dit rien, et celui-ci aurait été particulièrement cruel.*

`capaciteDuModele.ts` demande à Ollama ce que le modèle sait faire, **avant** l'envoi, et le bandeau
de l'écran l'affiche dès qu'une image est chargée — pas au moment du clic.

⚠️ **Trois réponses, pas deux.** « Il voit », « il ne voit pas », et **« on ne sait pas »** : un
Ollama plus ancien ne déclare aucune capacité. On refuse **seulement** le cas où l'on sait que non ;
l'incertitude prévient et laisse passer. *Une garde qui refuse ce qui marche finit par être
contournée.*

⚠️ **Et ce n'est pas une question de modèle, mais de code.** Un Claude parfaitement capable de voir
ne verra rien tant que sa branche d'`AIService` ne met pas d'image dans sa requête. Le verdict le dit
avec le remède : *« GM-OS n'envoie pas d'image à anthropic — passez sur Ollama avec un modèle qui
voit, ou sur Gemini. »*

#### Ce qui est gardé, et ce qui ne l'est pas

- **`capaciteDuModele.test.ts`** — 9 essais : les trois réponses, les deux Ollama, Gemini qu'on
  n'interroge pas, et les fournisseurs dont la branche ne transmet rien.
- `MessageOllama` porte la raison de son existence, là où dix déclarations en ligne n'en portaient
  aucune.

⛔ **Ce qui n'est toujours pas éprouvé** : **aucune image n'a jamais été envoyée à un modèle** depuis
ce dépôt, ni ici, ni avant. Le fil est posé, les capacités sont lues, la garde est en place — *et
personne n'a encore vu une table sortir d'une photo.* C'est le premier essai à faire, et il demande
une vraie page de manuel.

**Ancres** : `src/modules/ai/capaciteDuModele.ts`, `src/modules/ai/AIService.ts` (`pieces`, branche
Ollama), `electron/OllamaService.ts` (`MessageOllama`, `capacitesDuModele`),
`electron/preload.ts` (`ollamaCapacites`), `atelier/ImportDeTable.tsx` (le bandeau),
guide 40 § « Importer une table ».

**Vérifié** : `tsc -b` propre, **4 707 tests** (385 fichiers, 1 ignoré), **179 tests E2E**.

### 66 · ⭐ Une jauge qui se vide — le consommable, et les cinq lecteurs qui l'ignoraient (2026-09-15)

*David : « il y a quelque chose qui manque je pense dans Clock-OS, j'ai des jauges qui augmentent,
mais je n'ai pas de jauge qui diminue pour simuler la diminution de consommable. Comment peut-on
faire ? ».*

#### ⚠️ Le mécanisme existait déjà — c'est le SENS qui manquait

Descendre une jauge était possible depuis toujours : shift-clic et clic droit font `−1`, et
`remplirLaJauge` avait été posé le 2026-08-31 pour exactement ce cas — le Voight-Kampff, *« un
instrument qui se vide »*. Rien à construire de ce côté-là.

Ce qui manquait, c'est que **rien autour de la jauge ne savait qu'elle se lit à l'envers**. Quatre
choses se trompaient, chacune en silence :

| Ce qui se trompait | Ce que ça donnait sur des vivres |
|---|---|
| `addTensionClock` écrivait `filledSegments: 0` | des rations **vides** à la création |
| ⛔ `NarrativeClock` : `filledSegments >= totalSegments` | le **plein** hurlait, le **zéro** ne disait rien |
| Clic gauche = `+1` | le geste de la soirée était le geste difficile |
| Le compte rendu consignait `0/6` | se relit « rien ne s'est passé » au lieu de « ils n'ont plus rien » |

> *Un instrument qui crie au mauvais moment est pire qu'un instrument muet : on apprend à ne plus le
> regarder.*

#### ⛔ Ils étaient CINQ, et le cinquième n'aurait été vu qu'à la table

Le comptage des lecteurs a trouvé ce que la demande ne disait pas. `composerCompteARebours`, qui
dessine la jauge sur les **32 pixels de l'Ulanzi**, portait **sa propre** comparaison — `remplis >=
total`, autre orthographe du même jugement. Des rations à zéro seraient restées orange au milieu de
la table pendant que l'écran du meneur criait.

> *Une comparaison recopiée dans un écran est une règle que les quatre autres ne connaîtront jamais.*

D'où `logic/sensDeLaJauge.ts`, pur, et **une garde du dépôt** qui interdit de réécrire la
comparaison ailleurs. ✅ **Elle a fait ses preuves dans l'heure** : elle a pointé `NarrativeClock`
avant que je l'aie corrigé.

#### Les décisions de David

| Question | Tranchée |
|---|---|
| Portée | Le sens **+ l'érosion de fin de scène** |
| Le clic principal sur une jauge qui se vide | **Il consomme** — le geste facile suit le sens de la jauge |

⚠️ **Le geste s'inverse donc selon la jauge, et c'est assumé** : *un geste uniforme qui va dans le
mauvais sens n'est pas plus simple, il est seulement plus régulier.*

⚠️ **Le pas par scène est stocké POSITIF** — c'est le sens qui décide de la direction. Une ration de
moins et un segment de rituel de plus s'écrivent avec le même `1`. *Laisser saisir un signe aurait
créé deux façons d'écrire la même intention, et donc une jauge qui remonte à chaque scène sans que
personne comprenne pourquoi.*

#### ⛔ Ce que l'érosion a révélé : un bouton écrit contre un fait qui a cessé d'être vrai

Le panneau des réserves de table porte un bouton « Fin de scène », posé le 2026-08-15 sous ce
commentaire :

> *« Rien dans l'application ne sait quand une scène se termine : c'est le meneur qui le décide. »*

**C'était vrai ce jour-là. La trame est arrivée le 17**, avec `terminerLaScene`. Depuis un mois,
l'application sait — et l'Impulsion de Dune ne l'écoute pas. Les jauges sont donc branchées sur
**le vrai passage**, jamais sur un second bouton : *deux gestes pour « fin de scène » garantissent
qu'un soir on presse l'un et pas l'autre.*

> ⭐ **La leçon, et elle vaut au-delà de ce chantier** : *un commentaire qui énonce un fait sur le
> reste du système se périme sans prévenir.* Celui-ci était juste, honnête, et faux deux jours plus
> tard — et rien ne l'aurait signalé si l'érosion n'avait pas cherché où se brancher.

⚠️ **Et l'usure n'est pas idempotente, alors que `terminerLaScene` l'est.** Une scène déjà close se
rend telle quelle ; sans garde, recliquer « Terminer » aurait mangé une seconde ration **en
silence**. La garde est éprouvée par dégradation.

⚠️ **L'usure est la seule chose de l'application qui fasse bouger une jauge sans que personne n'ait
cliqué dessus** — d'où l'annonce systématique : *un automatisme muet est indistinguable d'un bogue.*

#### ⭐ Le code couleur, demandé dans la foulée

*David, après avoir essayé : « ça marche, est-ce qu'on pourrait introduire un code couleur (orange,
rouge) quand cela s'épuise ? »*

C'est le prolongement naturel d'`estCritique` : au lieu d'une question fermée — *au bout, oui ou
non ?* — une **distance au bout**, `graviteDeLaJauge`. `critique` s'y ramène toujours à
`estCritique` : *deux définitions du même bout finiraient par ne plus tomber sur le même segment.*

⚠️ **Les seuils sont en FRACTION de la course, pas en segments comptés** — tranché par David sur
comparaison des trois échelles. Orange à mi-course, rouge au dernier quart :

| Total | Calme | Orange | Rouge | Pulsation |
|---|---|---|---|---|
| 4 | 4, 3 | 2 | 1 | 0 |
| 6 | 6, 5, 4 | 3, 2 | 1 | 0 |
| 12 | 12 … 7 | 6 … 4 | 3 … 1 | 0 |

*Compter deux segments avant la fin aurait laissé une jauge de douze muette pendant ses neuf
premiers.*

⚠️ **Dans les deux sens**, également tranché : une alerte des gardes passe à l'orange comme des
vivres. *Deux jauges côte à côte doivent se lire avec la même grammaire de couleur, sinon la couleur
ne veut plus rien dire du tout.* Conséquence assumée : **les jauges existantes changent
d'apparence**, sans qu'aucune donnée ne bouge.

#### ⛔ Deux contraintes de dessin que le calcul ne voyait pas

**1. À zéro, une jauge qui se vide n'a plus AUCUN segment allumé.** Au moment précis où l'alarme
compte, la forme n'a donc rien à teindre : il ne restait que le compte et le cercle qui s'échappe —
et la barre comme les points n'ont pas de cercle. **L'épuisement y aurait été presque muet.** Le
creux prend un rouge sourd (`#7f1d1d`) : *ce n'est pas une jauge éteinte, c'est une jauge
consommée.*

**2. Sur l'Ulanzi, l'orange est DÉJÀ la couleur de repos** (`COULEURS_DU_COMPTE.plein` = `#FF8C1A`).
Un cran de tension orange y serait donc muet pour une horloge sans couleur choisie. *Inventer un
troisième pigment aurait été pire* : à deux pixels de hauteur et à travers une table, un jaune et un
orange ne se distinguent pas, et **une jauge qui prétend dire trois choses en dit zéro**.

> ⭐ **Le gain réel sur les 32 pixels n'est donc pas le troisième cran, c'est le déplacement du
> second** : le rouge arrive au **dernier quart** et non plus au bout. *La table voit venir au lieu
> de constater.* Et une horloge à qui le meneur a donné une couleur, elle, a bien les trois crans —
> elle quitte la sienne pour l'orange.

⚠️ **Le pigment n'est pas dans la logique**, et c'est délibéré : `sensDeLaJauge` ne connaît aucune
couleur, il dit le cran. Trois thèmes CSS et une matrice de 32 pixels n'ont pas la même palette.
*La règle se partage, le pigment non.* En revanche les trois crans sont **les mêmes dans les trois
thèmes** : *un habillage se choisit, une alarme se reconnaît.*

#### Ce qui est gardé

- **`sensDeLaJauge.test.ts`** — 39 essais, dont la migration (une jauge d'hier monte et crie au
  plein), les deux alarmes, le replacement au changement de sens, et **la garde du dépôt**.
- **`usureDeFinDeScene.test.ts`** — 6 essais sur le *branchement*, dont ⛔ la non-double-ponction.
- **La gravité** — 34 essais de plus, dont **les trois échelles complètes** (4, 6 et 12 segments) :
  *elles SONT la décision — si ces tableaux changent, c'est le moment où le meneur voit venir le
  manque qui change.*
- **`compteARebours.test.ts`** — l'échelle sur les 32 pixels, **y compris l'aveu** : une horloge sans
  couleur choisie n'a que deux crans, et un test le fige pour qu'on ne le découvre pas à la table.
- **`clockOs.spec.ts`** — 6 essais de plus à l'écran : elle naît pleine, le clic consomme, le compte
  dit « restants », l'orange à mi-course, le rouge au dernier quart, le creux teinté à zéro.
  ⚠️ *Le câblage cran → pigment ne se vérifie QUE là* : une ligne de rendu qui retombe sur la
  couleur du thème ne lève rien et ne rougit aucun test unitaire.
- **Dégradations passées** : retirer la garde d'idempotence → 1 rouge ; retirer le sens
  d'`estCritique` → 5 rouges ; aplatir la gravité à deux crans → **15 rouges**.

#### ⚠️ Ce qui reste ouvert

⚠️ **Les réserves de table n'écoutent toujours pas la trame.** Leur bouton « Fin de scène » reste
manuel, et leur érosion — l'Impulsion de Dune — ne part pas quand une scène se ferme. **Volontaire,
et à trancher par David** : aligner change le moment où une règle de jeu s'applique dans une
campagne en cours. Le branchement tient en une ligne dans `trameSlice.terminerLaScene`, à côté de
celui des jauges.

⚠️ **Aucune usure n'a encore tourné une soirée entière.** Le calcul et le branchement sont éprouvés ;
ce qu'on ne sait pas, c'est si un pas par scène est le bon grain — une table qui enchaîne huit scènes
courtes videra six rations avant l'entracte.

**Ancres** : `src/modules/clock/logic/sensDeLaJauge.ts` (`graviteDeLaJauge`, `margeAvantLeBout`,
`SEUIL_DE_TENSION`, `SEUIL_D_URGENCE`), `src/modules/clock/components/NarrativeClock.tsx`
(`TEINTES_D_ALERTE`, `TEINTE_DU_CREUX_CONSOMME`), `src/modules/clock/components/ChoixDuSens.tsx`,
`src/store/useClockStore.ts` (`sens`, `pasParScene`, `changerLeSensDeLaJauge`, `reglerLePasParScene`,
`laSceneSeTermine`), `src/modules/session/store/trameSlice.ts` (`terminerLaScene`, la garde
`!scene.termineeLe`), `src/modules/ulanzi/widgets/compteARebours.ts` (`seVide`),
`src/modules/journal/clotureDeSeance.ts` + `libelleDeJauge`.

**Vérifié** : `tsc -b` propre, **4 789 tests** (387 fichiers, 1 ignoré), **185 tests E2E**.

### 67 · ⭐ L'Atelier des calendriers — et le calendrier qui gelait GM-OS (2026-09-15)

*David : « peut-on faire un module d'aide à la création de calendrier fantastique ? ».*

Comme pour l'Atelier des tables, **le comptage d'abord** — et il a de nouveau reshapé la proposition.

#### Ce que le comptage a trouvé avant qu'une ligne soit écrite

**Un seul calendrier existait** : `harptos.json`, livré d'usine. En un mois de construction, jamais
un second. La raison n'était pas le manque d'envie — **il n'existait aucun chemin d'écriture**.
`clock:list-calendars` et `clock:load-calendar`, point.

#### ⛔⛔ Et un calendrier mal formé ne rend pas une date fausse : il GÈLE l'application

`getFantasyDate` avance d'année en année **par soustraction** :

```ts
while (totalSeconds >= daysInYear * secondsPerDay) { totalSeconds -= …; year++; }
```

Sur une année de longueur nulle — **aucun mois**, ou `hoursPerDay: 0` — la condition reste vraie, la
soustraction ne retire rien, **et la boucle ne s'arrête jamais**. *Mesuré : cinquante millions de
tours sans sortir.*

> ⛔ **C'est ce qui a décidé de la forme du module.** Aujourd'hui c'est inatteignable, personne ne
> pouvant écrire un calendrier. **Un écran de création rend ça atteignable au clavier.** Le contrôle
> n'est donc pas le confort de l'Atelier, **il en est la condition** — et la même garde tient dans le
> magasin, parce que les calendriers arrivent aussi par un JSON posé à la main.

⛔ **La dégradation N'A PAS ROUGI : elle a PENDU.** Garde retirée, la suite de tests ne rend jamais la
main — il a fallu tuer vitest de l'extérieur après deux minutes.

> ⭐ **Et c'est la leçon la plus transportable de la journée** : le `timeout` posé sur un test **ne
> sauve de rien**. Une boucle synchrone ne rend pas la main à l'ordonnanceur, donc aucun délai ne
> peut l'interrompre — ni celui de vitest, ni celui d'un navigateur. *Un gel n'est pas une lenteur :
> c'est le seul mode d'échec qu'aucun garde-fou d'exécution ne rattrape.* On ne peut que l'empêcher
> d'entrer.

#### ⛔ Trois familles de champs écrites et lues par personne

| Champ | Ce qu'il disait | Lecteurs |
|---|---|---|
| `currentYear: 1492` + cinq `current*` | « Faerûn, an 1492 » | **zéro** |
| `daysPerWeek` | **requis par le type** | **zéro** — et **absent du seul fichier existant** |

**Mesuré** : choisir Harptos le 2026-09-15 affichait **l'an 56**. La date venait de `timestamp`,
jamais du fichier. *Un champ renseigné que rien ne lit est un mensonge patient : il a l'air d'une
fonctionnalité.* Ils vivent désormais — un E2E vérifie que choisir Harptos pose bien 1492.

⭐ **Et c'est `nomsSansEcrivainNiLecteur` qui l'a dit, tout seul.** Le test a rougi le jour où
`daysOfWeek`, `hoursPerDay`, `minutesPerHour`, `daysPerWeek` et `loadCalendar` ont trouvé un
lecteur, en demandant qu'on retire leurs cinq lignes de tolérance. *Un registre de ce qui ne sert à
rien vaut surtout par le moment où il se vide.*

#### ⚠️ La règle bissextile était codée en dur, à cinq endroits

`year % 4 === 0`, recopié dans `getFantasyDate`, `setFantasyDate` et le pupitre. **Harptos tombait
juste par chance.** Elle se déclare maintenant par calendrier — `0` voulant dire « jamais », ce qui
est une réponse légitime. *Une règle recopiée dans les écrans est une règle que le modèle ne peut
plus changer.*

#### La forme retenue

| Pièce | Ce qu'elle tient |
|---|---|
| `logic/formeDuCalendrier.ts` | Le contrôle, la garde anti-gel, la règle bissextile, la date de départ, la mesure — **pur** |
| `atelier/MesureDeLAnnee.tsx` | La longueur de l'année **en direct**, en tête de l'écran |
| `atelier/AtelierDesCalendriers.tsx` | Composer, déplacer, reprendre, supprimer |
| `logic/propositionDeCalendrier.ts` | L'IA qui propose — *le modèle propose, le contrôle relit, l'écran montre* |
| `electron/cheminDesCalendriers.ts` | Le confinement du chemin |

⭐ **La mesure est en TÊTE, avant les champs.** Une table trouée se voit ; *un calendrier dont
l'année fait 358 jours au lieu de 360 a l'air parfait.* La longueur de l'année est le seul nombre que
l'auteur a en tête, et c'est justement celui qu'aucune saisie ne montre : il est la somme de douze
champs séparés.

#### ⛔ Une fuite de chemin refermée au passage

`clock:load-calendar` composait `path.join(appRoot, 'databases', 'calendars', id + '.json')` avec un
`id` **venu du renderer**, sans rien regarder. `../../package` remontait hors du dossier. C'était une
fuite en lecture ; *le jour où l'Atelier écrit, la même forme écrase n'importe quel fichier du
dépôt.* Même règle que `cheminDesTables.ts` la veille.

⚠️ **Et une duplication que j'ai écrite puis retirée dans la foulée** : la fabrique du nom de fichier
existait des deux côtés du pont. Corrigé par la séparation qui s'imposait — **le renderer produit
l'identifiant, le processus principal valide le chemin**, ce que lui seul peut faire. *Deux règles de
nommage écrites des deux côtés d'un pont finiraient par ne plus tomber sur le même fichier, et
l'écran afficherait un nom que personne n'écrirait.*

#### Ce qui est gardé

- **`formeDuCalendrier.test.ts`** — 36 essais : les deux fautes qui gèlent, le cycle déclarable (dont
  les années négatives), la date de départ, et ⛔ **« Harptos ne porte aucune faute »**.
- **`gelDeLHorloge.test.ts`** — 6 essais sur le magasin, éprouvés par **dégradation qui pend**.
- **`propositionDeCalendrier.test.ts`** — 18 essais : ce qu'on écarte sans rafistoler, et ⛔ le
  calendrier sans mois **laissé arriver jusqu'au contrôle** plutôt que corrigé sur place.
- **`cheminDesCalendriers.test.ts`** — 24 essais de confinement.
- **`clockOs.spec.ts`** — 5 essais de plus à l'écran, dont ⛔ **le refus d'enregistrer** et ⭐ **Harptos
  à 1492**.

#### ⚠️ Ce qui reste ouvert

✅ **`databases/` est dans un filet depuis le soir même** — voir le § 69. Écarté d'abord pour garder
la portée, rouvert par David dans la foulée.

⚠️ **L'IA n'a jamais été appelée pour de vrai.** Le fil, le schéma et le contrôle en aval sont
éprouvés ; *personne n'a encore vu un calendrier sortir d'une phrase.*

✅ **Le jour de la semaine ignorait les jours hors calendrier — CLOS le soir même** par le § 68 :
David a demandé les jours de fête dans la foulée, et la règle est désormais déclarée par calendrier.

**Ancres** : `src/modules/clock/logic/formeDuCalendrier.ts`,
`src/modules/clock/logic/propositionDeCalendrier.ts`, `src/modules/clock/atelier/`,
`src/store/useClockStore.ts` (la garde dans `getFantasyDate`, `dateDeDepart` dans `selectCalendar`),
`electron/cheminDesCalendriers.ts`, `electron/main.ts` (`clock:save-calendar`,
`clock:delete-calendar`), guide 36 § « Créer un calendrier ».

**Vérifié** : `tsc -b` propre, **4 869 tests** (391 fichiers, 1 ignoré), **190 tests E2E**.

### 68 · ⭐ Les jours de fête — et la semaine qu'ils décalaient depuis toujours (2026-09-15, tard)

*David, après l'Atelier des calendriers : « oui je veux pouvoir déclarer des jours de fêtes ».*

Ce « oui » répondait au reste ouvert du § 67 — *le jour de la semaine ignore les jours hors
calendrier*. Mais la demande allait plus loin que le correctif.

#### ⚠️ « Fête » voulait déjà dire quelque chose, et c'était très mince

Une fête était un **mois d'un jour** marqué `isIntercalary` — c'est ainsi qu'Harptos porte ses six.
Et ce drapeau ne faisait **qu'une seule chose** : retirer le numéro du jour dans la date affichée.

Trois conséquences :

| | |
|---|---|
| ⛔ **Aucune fête dans un mois** | « Le 15 de Hammer est la Fête du Marteau » était inexprimable : il aurait fallu couper Hammer en trois mois |
| ⛔ **Une fête consommait un jour de semaine** | Le calcul comptait tous les jours écoulés modulo la semaine — les six fêtes d'Harptos la décalaient de **six jours par an** |
| ⚠️ **Rien ne l'annonçait** | Le nom apparaissait dans la ligne de date parce qu'il *était* le nom du mois. Aucune mise en valeur, rien vers les joueurs, rien au journal |

> ⭐ **Le troisième était le plus grave.** *Une fête qu'on déclare et qui ne se signale jamais n'est
> qu'une étiquette* — le motif que ce dépôt a déjà payé quatre fois : la chaîne complète sans bouton
> au bout.

#### Les décisions de David

| Question | Tranchée |
|---|---|
| La forme | **Une période**, pas un seul jour : « du 12 au 15, les Nuits du Marteau » |
| L'annonce | **Les trois** : l'horloge, l'afficheur de table, et le journal de séance |
| La semaine | **Les jours hors calendrier en sortent**, et c'est **réglable par calendrier** |

#### ⭐ Les fêtes sont portées par le MOIS, pas par le calendrier

Le premier réflexe était `fetes: [{ moisIndex, jour, … }]` sur le calendrier. **Un index se
désynchronise dès qu'on déplace un mois dans l'Atelier** — et l'Atelier a justement des flèches pour
ça : les fêtes de Hammer se seraient retrouvées dans Alturiak **sans que rien ne le signale**.

Attachées au mois, elles le suivent quand il bouge et disparaissent avec lui. *Rendre le défaut
impossible à écrire plutôt que de le signaler* — le principe déjà appliqué au choix du dé dans
l'Atelier des tables.

#### ⚠️ Deux sortes de jours qui se ressemblent, et qu'il ne faut pas confondre

| | Mois `isIntercalary` | Fête déclarée |
|---|---|---|
| Ce que c'est | Un jour **hors calendrier** | **Un jour du mois** qui porte un nom |
| Son numéro | Aucun | Le sien (« 15 Hammer ») |
| Son jour de semaine | **Aucun** | Le sien |

**Les deux coexistent, et c'est voulu.** *Ce ne sont pas deux façons d'écrire la même chose, ce sont
deux choses.* Le contrôle signale quand on les mélange (`fete-dans-un-intercalaire`), et la consigne
de l'IA les distingue explicitement.

#### ⛔ `null` n'est pas une erreur, c'est une réponse

Un jour hors calendrier **n'a aucun jour de semaine**. `rangDansLaSemaine` rend donc `null`, et
l'écran omet la mention au lieu d'en inventer une — ce qu'il faisait.

> *Demander quel jour de la semaine tombe le Milieu d'Hiver n'a pas plus de sens que de demander sa
> position dans un mois.*

⚠️ **Le correctif change ce qu'affichait hier** : le jour de semaine d'une date donnée d'Harptos
n'est plus le même. Il était faux.

#### ⚠️ La fête qualifie la date, elle ne la remplace pas

« 13 Hammer — Nuits du Marteau (2/4) ». *Sans le numéro, le meneur qui compte « nous partons dans
trois jours » perd son repère au milieu de sa propre fête.* Et le rang ne s'affiche que pour une
fête de plusieurs jours : sinon tout serait suivi d'un « (1/1) » qui n'apprend rien.

#### ⛔ Une fête de quatre jours n'écrit qu'UNE entrée de journal

L'annonce compare le **nom** de la fête, pas sa mention. La mention passe de « (1/4) » à « (4/4) » :
la comparer écrirait quatre entrées pour une seule fête. *Entrer dans une fête est un événement ; y
rester n'en est pas un.*

⚠️ Et seulement depuis les **gestes du meneur** — `setTimestamp`, `addTime`, `setFantasyDate`. La
synchronisation entre fenêtres écrit par `setState` et ne passe pas par là : *le hub ne doit pas
consigner ce que le meneur a déjà consigné.*

#### Ce qui est gardé

- **`fetesDuCalendrier.test.ts`** — 44 essais : la forme, les périodes, ⛔ la semaine qui reprend le
  fil après un jour hors calendrier, et le contrôle (des **doutes**, jamais des fautes — *une fête mal
  placée ne casse rien, elle ne tombe simplement jamais*).
- **`annonceDesFetes.test.ts`** — 12 essais, dont ⛔ **la non-répétition** et les trois gestes.
- **`propositionDeCalendrier.test.ts`** — 8 de plus : ce qu'on écarte sans rafistoler, et la consigne
  qui distingue les deux sortes de jours.
- **`clockOs.spec.ts`** — l'**aller-retour complet** : l'écran écrit la fête, le pont la pose sur le
  disque, le pupitre relit le fichier, et la date la retrouve au rang 2/3. *Aucun essai unitaire ne
  traverse tout ça.*
- **Dégradations passées** : les jours hors calendrier recomptés → 2 rouges ; la comparaison par
  mention au lieu du nom → 1 rouge.

#### ⚠️ Deux pièges d'outillage payés en chemin

⛔ **`getByRole(role, { name })` cherche une SOUS-CHAÎNE chez Playwright.** Le bouton des mois
s'appelle « Ajouter », celui des fêtes « Ajouter une fête au mois 1 » : **le premier sélecteur en a
trouvé deux le jour où le second est apparu**, et quatre essais sont tombés d'un coup. *Un sélecteur
par nom se casse quand un autre nom COMMENCE pareil — et rien ne le dit avant l'exécution.*

⚠️ **Une `<option>` dans un `<select>` fermé n'est jamais « visible ».** Mon `waitFor()` — dont le
défaut est l'état *visible* — a tourné trente secondes sur un élément bel et bien présent. Il faut
`{ state: 'attached' }`.

**Ancres** : `src/modules/clock/logic/formeDuCalendrier.ts` (`feteDuJour`, `mentionDeLaFete`,
`rangDansLaSemaine`, `jourDeLaSemaine`, `intercalairesHorsSemaine`), `src/store/useClockStore.ts`
(`annoncerLaFete`, le calcul du jour de semaine), `src/modules/clock/components/ClockVisualizer.tsx`,
`src/modules/ulanzi/widgets/heureDuMonde.ts`, `src/modules/clock/atelier/AtelierDesCalendriers.tsx`,
guide 36 § « Déclarer des jours de fête ».

✅ **Éprouvé en réel le 2026-09-15 au soir** — *« ok ça marche »*.

**Vérifié** : `tsc -b` propre, **4 933 tests** (393 fichiers, 1 ignoré), **191 tests E2E**.

### 69 · ✅ `databases/` entre dans le filet — et le déclencheur qui n'aurait jamais tiré (2026-09-15, tard)

*David : « ok rajoute la database dans une sauvegarde ».*

C'était le reste ouvert signalé trois fois dans la journée. **Le trou était antérieur aux deux
Ateliers** : tant que `databases/` n'était que du contenu livré, un `git checkout` le rendait. Ce qui
a changé, c'est que **David y écrit** — les tables depuis le 14, les calendriers depuis le 15.

> *Un dossier en lecture seule n'a pas besoin de filet ; le jour où quelque chose y écrit, il en a
> besoin **le même jour**.*

#### La mesure d'abord, comme pour les images

**1,3 Mo, 163 fichiers, 158 JSON.** Rien à voir avec les 261 Mo d'images qui avaient imposé un miroir
incrémental. Ici la taille n'impose rien : c'est le **déclencheur** qui a décidé de la forme.

#### ⛔ Ce qui aurait donné un filet qui ne se déclenche jamais

La sauvegarde automatique part **deux minutes après un changement d'état de session**. Or écrire une
table passe par l'IPC et **ne touche aucun magasin Zustand** : ranger `databases/` dans la sauvegarde
automatique aurait produit un filet qui **ne serait jamais parti**.

> ⛔ *Un filet qui ne se déclenche pas est pire qu'un filet absent : on croit l'avoir.*

D'où **deux déclencheurs, et pas un** :

| Quand | Ce qu'il attrape |
|---|---|
| **Après chaque écriture** (`tables:save-table`, `clock:save-calendar`) | Le geste du meneur, tout de suite |
| **Au démarrage** | Ce qui a été édité **à la main, hors de GM-OS** — la seule façon d'écrire là qui ait existé pendant des mois |

#### Les décisions

| Question | Tranchée |
|---|---|
| Un fichier supprimé | **Le miroir le garde** — comme les images le 29/08 : *une suppression accidentelle qui se propage au filet le rend inutile le jour où il servirait* |
| Le périmètre | **Tout `databases/`**, pas seulement tables et calendriers — les 700 Ko de PNJ et de lieux ne coûtent rien, et ils ont pu être édités à la main |
| Où | `userData/backups/databases/` — ⛔ **jamais sous `APP_ROOT`** (R2) |

⭐ **Le miroir reflète l'ARBORESCENCE, pas des identifiants.** Contrairement aux médias — 261 Mo sous
des `m-<uuid>` qu'aucun humain ne sait remettre en place — chaque fichier garde son chemin.
**Restaurer, c'est recopier un dossier**, et le clic droit sur l'indicateur de sauvegarde l'ouvre
déjà. *C'est pourquoi il n'y a pas de bouton de restauration : ce serait un bouton de trop, et il
apporterait le risque d'écraser.*

#### ⚠️ Deux prudences que le module s'impose

**On compare le CONTENU, pas les dates.** Une date de modification se perd à la copie, se décale d'un
système de fichiers à l'autre, et remonte le temps quand on restaure un fichier plus ancien. *Un
miroir qui se fie aux dates finit par croire à jour ce qui ne l'est pas — silencieusement.* Le coût
est nul : la taille écarte la plupart des paires avant qu'on lise un octet.

**Le miroir ne fait jamais échouer l'écriture qu'il suit.** Une copie impossible se consigne et se
tait : *perdre la sauvegarde d'une table est un incident ; perdre la table parce que sa sauvegarde a
levé en serait un bien pire.* Même chose pour le balayage de démarrage, qui ne bloque rien.

#### Ce qui est gardé

- **`miroirDesDonnees.test.ts`** — 21 essais : le confinement (⛔ **R2** et **R3**, éprouvés sur un
  chemin hostile qui ne doit rien écrire dehors), les deux séparateurs qui mènent au même reflet, la
  comparaison par contenu à taille égale, ⛔ **le fichier supprimé dont le reflet survit**, et le
  balayage qui rattrape une édition faite hors de l'application.
- **`clockOs.spec.ts`** — ⭐ **l'essai qu'aucun test unitaire ne peut faire** : le vrai processus
  principal, le vrai disque. Le calendrier écrit par l'Atelier se retrouve dans le miroir du profil,
  **avec sa fête**.
- **Dégradation** : le reflet retiré de `clock:save-calendar` → le calendrier est bien sur le disque
  (essai 16 vert) **et absent du miroir** (essai 17 rouge). *La dégradation a d'abord sembl\é passer
  parce que je l'avais lancée avec `-g` : l'essai qui écrit le calendrier ne tournait pas, et
  l'absence de miroir ne prouvait rien.*

#### ⚠️ Ce qui reste

⚠️ **L'espace ne redescend jamais tout seul** — conséquence assumée du « garde tout ». À 1,3 Mo c'est
théorique, mais un geste de nettoyage explicite, qui dirait ce qu'il s'apprête à supprimer, reste à
écrire (comme pour le miroir des médias, où il est garé depuis le 29/08).

**Ancres** : `electron/miroirDesDonnees.ts`, `electron/main.ts` (`refleterDansLeMiroir`, le balayage
dans `app.whenReady`), guide 91 § « Ce qui est sauvegardé ».

**Vérifié** : `tsc -b` propre, **4 956 tests** (394 fichiers, 1 ignoré), **192 tests E2E**.

### 70 · ⭐ Le générateur d'image sur les indices — et les trois pannes muettes qu'il a révélées (2026-09-16, nuit)

*David : « est-ce que tu peux brancher le générateur d'image IA sur la définition des indices ? ».*

Les deux côtés existaient, et il manquait exactement la couture entre eux. Un indice portait déjà un
`mediaUrl` — mais il ne se remplissait qu'en piochant dans la médiathèque. **Les indices étaient le
seul objet illustrable sans générateur**, alors que les PNJ, les cartes d'atlas et les PJ en avaient
un chacun.

#### ⛔ Ce que le comptage a trouvé, encore une fois

Les trois générateurs existants portaient chacun leur `try / catch / finally`, et **chaque `catch`
faisait `console.error` et rien d'autre** — alors que `gmToast` est importé en tête du même fichier
et sert vingt lignes plus haut.

Clé absente, service indisponible, image rejetée : le meneur cliquait, le voile tournait, s'arrêtait,
et **rien ne se passait**. Trois fois.

> *C'est la panne muette que ce dépôt a déjà payée sur la projection de fiche — quatre mois cassée
> parce qu'un `catch` avalait l'exception.* **Je ne voulais pas ajouter un quatrième muet** : les
> quatre passent désormais par une couture unique, `demanderUneImage`, qui pose le voile, le lève, et
> **dit ce qui a échoué**.

⚠️ **Le message de l'erreur remonte tel quel**, parce qu'il dit quelque chose : `generateImage` lève
« Clé API Gemini manquante », « image trop petite pour être vraie », « Bridge Ollama non disponible ».
*Un toast générique ne vaudrait guère mieux qu'un silence : il dirait qu'on a échoué sans dire quoi
réparer.*

⭐ **Et la couture retire au passage la quadruple copie du `try/catch/finally`.** Ce n'était pas le
but ; c'est ce qui rend la correction durable. *Une règle écrite quatre fois est une règle qui
divergera.*

#### ⭐ Un indice n'est pas un portrait — le registre

Les trois générateurs demandent tous une **illustration**. Un indice, non : c'est **un objet qu'on
pose devant un joueur**.

*Registre tranché par David : la **pièce à conviction**.* Gros plan, fond neutre, éclairage qui
montre la matière et l'usure — ce qu'on photographie pour un dossier, pas ce qu'on peint pour une
couverture.

| | Ce que ça montre |
|---|---|
| Une scène illustrée | **où** l'indice a été trouvé |
| Une pièce à conviction | **l'indice** — que le joueur doit croire pouvoir prendre en main |

⚠️ **On écarte explicitement le texte lisible** (`No readable text`). Ces modèles écrivent des lettres
qui n'en sont pas : un parchemin couvert de faux mots attire l'œil dessus et détruit l'illusion.
*Mieux vaut un document dont on devine l'écriture qu'un document dont on lit le charabia.*

⚠️ **L'invite reste en anglais**, comme les trois autres. Ce n'est pas un choix de style : *changer de
langue pour ce seul générateur donnerait des résultats visiblement moins bons sans que personne ne
sache pourquoi.*

Elle vit dans `logic/inviteDImage.ts`, pure et éprouvée — *parce que c'est le choix d'auteur de ce
chantier, et qu'il mérite d'être lisible ailleurs que noyé dans un gabarit de chaîne.*

#### ⚠️ Le piège d'intégration : deux états pour le même indice

Le formulaire des indices garde l'indice en **état local** ; la génération écrit dans le **magasin**,
par `updateClue`. Sans resynchronisation, **l'image serait bien arrivée — sur l'indice enregistré —
mais le meneur ne l'aurait pas vue**, et il l'aurait crue perdue.

L'écran relit donc l'indice frais et replace son visuel dans le formulaire ouvert.

> C'est une variante du motif habituel : d'ordinaire ce dépôt trouve *plusieurs écrivains pour une
> même donnée* ; ici c'est **deux copies de la même donnée**, dont une seule reçoit l'écriture.

⚠️ **Le bouton refuse un indice non enregistré**, avec son motif dans l'infobulle : la génération
écrirait dans le vide. *Un bouton qui ne fait rien sans dire pourquoi est pire qu'un bouton absent.*

#### Ce qui est gardé

- **`inviteDImage.test.ts`** — 10 essais : le registre, les bornes, la mise à plat, et les
  instructions du meneur qui **remplacent** l'invite au lieu de s'y ajouter.
- **`imageQuiEchoue.test.ts`** — 11 essais, dont ⛔ **les trois chemins existants qui doivent
  désormais parler**, et le message qui dit *pourquoi* et *de quoi*.
- **Dégradation** : le toast retiré de la couture → **5 rouges**, dont un par chemin.

#### ⚠️ Ce qui reste

⚠️ **Aucune image n'a été générée pour de vrai depuis ce chantier.** Le fil, l'invite et la garde sont
en place ; *personne n'a vu sortir une pièce à conviction.* Et c'est le quatrième chemin d'IA en
attente d'écran, avec la photo de manuel, le PDF réel et la composition de calendrier.

**Ancres** : `src/modules/session/logic/inviteDImage.ts`,
`src/modules/session/logic/crossDomainHelpers.ts` (`demanderUneImage`, `handleGenerateClueImage`),
`src/modules/session/components/CluesManager.tsx`, guide 25 § « L'image d'un indice ».

**Vérifié** : `tsc -b` propre, **4 977 tests** (396 fichiers, 1 ignoré), **192 tests E2E**.

### 71 · ⚠️ EN COURS — « je n'arrive pas à taper dans un champ », et la sonde qui nommera le coupable (2026-09-16)

*David : « je n'arrive pas à changer le titre d'un indice. De temps en temps, je n'arrive pas à
modifier un champ texte ».*

⚠️ **Ce chantier n'est pas clos : le défaut n'est PAS corrigé.** Ce qui est livré est un
**instrument**, pas un correctif.

#### Ce que le témoignage a donné, et ce qu'il a coûté de le demander

Trois questions ont rapporté plus que deux heures de lecture :

| Question | Réponse | Ce que ça élimine |
|---|---|---|
| Que se passe-t-il quand tu tapes ? | *« je n'arrive pas à taper, puis après 30 s à 1 min je récupère la main »* | Ce n'est ni un caractère écrasé, ni une perte de focus à chaque frappe |
| Est-ce nouveau ? | **Antérieur à aujourd'hui** | Ce n'est aucun de mes six commits du jour |
| Le reste de l'écran répond-il ? | ⭐ **Oui, normalement** | ⛔ **Le fil d'affichage n'est PAS bloqué** |
| Où encore ? | Autres modules, boîtes de dialogue, la description de l'indice | Ce n'est pas propre aux indices |

#### ⛔ Ma première sonde était la mauvaise, et c'est la leçon du chantier

J'avais supposé un **fil d'affichage bloqué** — la seule explication qui me venait pour « 30 s puis
ça se débloque » — et proposé un `PerformanceObserver` sur les tâches longues. David a approuvé.

**Sa réponse suivante a invalidé l'hypothèse** : le reste de l'écran répond. Un observateur de tâches
longues n'aurait **rien trouvé**, et son silence aurait été lu comme « rien d'anormal ».

> ⛔ *Une mesure fondée sur une hypothèse fausse ne corrige pas l'hypothèse — elle la confirme.*
> **Poser la question qui discrimine AVANT de choisir l'instrument**, jamais après.

#### Les six pistes lues et écartées

| Piste | Pourquoi ce n'est pas elle |
|---|---|
| L'`AIPromptOverlay` que je venais de monter | Il rend `null` tant qu'il est fermé |
| La garde des pastilles (Sound/Light/Music) | `estUneFrappeDePastille` écarte bien `INPUT` et `TEXTAREA` |
| Le vol de focus de la main de cartes | ⚠️ `ref={(n) => n?.focus()}` **se rejoue à chaque rendu** — mais gardé par une carte agrandie, et **tablette seulement** |
| L'état local du formulaire d'indice | L'effet qui le réécrit est gardé par `editingClueId`, remis à `null` aussitôt |
| L'enregistrement | `handleSave` écrit bien le titre saisi |
| Le Spotlight | Ne lit que `Ctrl+K` et les flèches |

#### L'instrument : `sondeDeLaFrappe.ts`

Elle répond à la seule question qui reste : **où va la frappe ?**

| Verdict | Ce que ça veut dire |
|---|---|
| `hors-champ` | La touche est arrivée à la fenêtre, **aucun champ n'avait le focus** |
| `frappe-refusee` | Le champ avait le focus **et sa valeur n'a pas bougé** — avec `defaultPrevented`, `disabled`/`readOnly`, et si le focus a bougé |

⚠️ **En phase de CAPTURE** : un écouteur de bulle ne verrait rien si quelqu'un appelait
`stopPropagation` en chemin — *et c'est précisément l'une des causes qu'on cherche à distinguer. Une
sonde qu'on peut faire taire ne mesure que les cas où elle n'était pas utile.*

⚠️ **Elle écrit dans le journal de débogage PERSISTÉ**, pas dans la console, et elle est **montée au
point d'entrée, sans condition**. Le défaut est intermittent : *un instrument qu'il faut armer
d'avance est un instrument éteint au moment qui compte.* Le journal se lit par l'icône **Terminal**
de la barre latérale, et il survit au rechargement.

⚠️ **Silencieuse tant que les lettres s'inscrivent**, et muette pendant une rafale : *une seconde de
blocage écrirait quarante lignes et noierait la seule qui compte.*

#### Ce qui est gardé

- **`sondeDeLaFrappe.test.ts`** — 16 essais : les trois verdicts, les touches qui n'écrivent rien,
  les raccourcis, les champs muets (case à cocher), l'anti-noyade et le démontage.

#### ⚠️ Ce qui reste — et c'est l'essentiel

⛔ **Le défaut n'est pas corrigé.** La prochaine occurrence doit être suivie d'un coup d'œil au
journal : **la ligne qu'on y trouvera nomme la famille de cause**, et le correctif suivra.

⚠️ **Et si le journal reste vide pendant que le champ refuse**, c'est en soi une information
décisive : la touche n'atteindrait même pas la fenêtre — donc quelque chose entre le système et le
rendu, et il faudrait regarder du côté d'Electron.

**Ancres** : `src/utils/sondeDeLaFrappe.ts`, `src/main.tsx` (le montage).

**Vérifié** : `tsc -b` propre, **4 993 tests** (397 fichiers, 1 ignoré), **192 tests E2E**.

### 4 · Garé par décision, et à ne pas rouvrir sans raison

✅ **Vide au 2026-09-12 au soir.** Sa seule ligne — *Ulanzi D, les boutons physiques* — en est sortie
le jour où sa raison d'être a disparu : voir le § 49.

> ⭐ **Et c'est la leçon de cette case.** Elle disait *« à ne pas rouvrir **sans raison** »*, et la
> raison écrite était un coût d'infrastructure, pas une impossibilité. *Une ligne garée avec son
> motif se rouvre toute seule le jour où le motif tombe ; une ligne garée sans motif ne se rouvre
> jamais.*

### 49 · ⭐ Les trois boutons de l'Ulanzi — le § 4 se vide (2026-09-12)

*Garée le 30/08 pour une raison précise. David a installé un Home Assistant ; la raison n'existait
plus.*

#### Ce qui était écrit, et pourquoi ça comptait

> *« Les boutons ne remontent pas en HTTP. MQTT, donc, ou rien — et un courtier est un service de
> plus à faire vivre, **à démarrer avec GM-OS et à rendre en partant**. »*

⭐ **Le gel ne portait pas sur la faisabilité, mais sur un coût d'exploitation** — et c'est
exactement ce qui l'a rendu réversible. Home Assistant porte déjà Mosquitto, tourne **sans** GM-OS et
n'a **rien à rendre** en partant. Les trois clauses du motif tombent d'un coup.

*Une ligne garée avec son motif se rouvre toute seule le jour où le motif tombe.*

#### ⭐ Le découpage, et la propriété qui en tombe

```
bouton → MQTT → Home Assistant → POST /bouton (secret d'appairage)
       → webContents.send('ulanzi:bouton') → la fenêtre MJ résout le réglage
```

⛔ **Le pont transporte un APPUI, jamais une action.** Le réglage vit dans le magasin persisté de
l'écran ; le processus principal ne le connaît pas et n'a rien à arbitrer. **Même si le secret
fuitait, on ne pourrait déclencher que ce que le meneur a lui-même posé sur ses trois boutons** — là
où un pont qui transporterait un type d'action donnerait la main sur les soixante-six du registre.

*Ce n'était pas le découpage prévu : il est tombé du refus d'apprendre les réglages au principal.*

#### ⛔ Trois refus, parce que le serveur écoute sur `0.0.0.0`

| | |
| --- | --- |
| **Le secret** | celui des tablettes (`pairingManager.verify`, comparaison à temps constant). Rien de neuf à inventer, et `rotate()` révoque le pont avec le reste |
| **L'ordre** | le jeton est jugé **avant** que le corps ne soit lu — un inconnu reçoit `401` quoi qu'il envoie, et n'apprend donc ni les noms des boutons ni la forme attendue. *Une erreur qui renseigne est une erreur qui aide celui qui cherche* |
| **La borne** | 1 Kio, et on coupe la ligne au lieu d'accumuler pour refuser à la fin |

⭐ **Le pré-vol n'est pas un second contrôle, c'est le même appelé deux fois** : `lireLAppui` avec un
corps **vide** dit si la méthode et le jeton passent. *Deux écrivains pour une même décision finissent
toujours par diverger.*

#### La contrainte qui a choisi les gestes

⛔ **Un bouton ne porte aucun argument.** Sur soixante-six actions, la plupart sont inposables :
`map:ping` veut des coordonnées, `storyboard:trigger` un identifiant. Restent six gestes qui se
suffisent — plus le **jet préréglé**, dont l'argument est figé *au moment où l'on règle*, jamais au
moment où l'on appuie.

⚠️ `ulanzi:quart-suivant` et `ulanzi:pause` ont dû **entrer au registre** : les deux gestes vivaient
dans `useUlanziStore`, offerts par le tableau de bord et **par rien d'autre**. *Une cinquième chaîne
complète sans bouton au bout.*

#### Deux erreurs de placement, trouvées par les tests

1. Le panneau était d'abord dans le tableau de bord de l'afficheur — qui vit **dans le cockpit**, donc
   inatteignable sans séance ouverte. *Régler ce que font des boutons est un geste de préparation.*
   Il est passé aux **Paramètres**, à côté des raccourcis clavier.
2. `getByLabel('Bouton droit')` cherche une **sous-chaîne** : il désignait aussi *« Formule du bouton
   droit »* dès qu'un jet était réglé. Les tests passaient **selon leur rang d'exécution**.

#### ⚠️ Et une règle respectée plutôt que contournée

Home Assistant a besoin du jeton, que `GlobalSettingsModal` déclare *« jamais affiché en clair »*.
Le panneau le **copie** sans le montrer : *copier n'est pas afficher*, et la valeur ne traverse aucun
rendu.

#### ⛔ Et le panneau annonçait la mauvaise adresse — trouvé le 13/09

David, après avoir tout branché : *« ça ne marche pas »*, puis
*« `http://192.168.0.211:5173/bouton`, c'est ce qu'il y a dans Paramètres OS »*.

**5173 est le port de Vite.** `remote:get-connection-info` rend deux ports : `port`, où
l'**interface** est servie (Vite en développement, pour le rechargement à chaud), et `mediaPort`,
qui est **toujours** le SyncServer. J'avais pris le premier. Home Assistant postait donc sur Vite,
**qui répondait son `index.html`** : aucune erreur, aucun effet, rien à diagnostiquer.

⭐⭐ **Le commentaire de `main.ts` décrivait ce mode d'échec mot pour mot**, pour le proxy média :
*« jamais celui de Vite, qui ne sert ni /media/ ni /temp/ et répond son index.html à leur place »*.
J'ai pris le mauvais champ **malgré l'avertissement, deux lignes au-dessus**. *Un champ nommé `port`
à côté d'un champ nommé `mediaPort` invite à prendre le premier.*

⚠️ **Et les tests de bout en bout ne pouvaient pas le voir** : ils tournent en **production**, où
les deux ports sont le même. *Un test de bout en bout ne voit que ce que son environnement
distingue* — seule une fonction pure, éprouvée sur le cas du développement, garde ça.

⭐ **Le diagnostic a tenu en deux mesures, sans rien demander à David** : lire `main.log` pour savoir
que GM-OS tournait, puis poster sur `/bouton` avec le vrai jeton lu dans `pairing.json` — `200`,
`{"recu":"milieu"}`. *Le côté GM-OS étant hors de cause, il ne restait qu'un champ à relire.*

#### ✅ Éprouvé en réel le 2026-09-13

David : *« tout fonctionne »*. La chaîne entière — appui sur l'afficheur, MQTT, Home Assistant,
`POST /bouton`, geste dans GM-OS.

⭐ **Les deux craintes notées en P6 étaient infondées, et c'est la mesure qui l'a dit** : l'appui
parvient bien jusqu'à HA, et les boutons **gardent leur défilé natif tout en publiant** — le défilé
des Quarts ne perd rien. *Une crainte écrite est une crainte qu'on peut lever ; une crainte tue
reste vraie pour toujours.*

⚠️ Et deux choses que seule la mise en service a révélées, toutes deux invisibles en test :
**le filtre `payload`** (sans lui chaque pression compte double) et **le mauvais port annoncé**.

**Ancres** : `electron/boutonsDeLUlanzi.ts` (+ 24 tests), `SyncServer.traiterLAppui`,
`utils/portsDuRenderer.ts` (`adresseDuPontDesBoutons`, + 8 tests),
`ulanzi/logic/gestesDesBoutons.ts` (+ 16 tests), `ulanzi/hooks/useBoutonsDeLUlanzi.ts`,
`ulanzi/components/ReglageDesBoutons.tsx`, `e2e/boutonsUlanzi.spec.ts` (11 tests, la chaîne entière
sans Home Assistant).

**Vérifié** : `tsc -b` propre, **4 307 tests** (358 fichiers), **156 tests E2E**.

⚠️ **Ce qui reste à éprouver en séance** — voir § 1 : que l'appui parvienne jusqu'à HA, et qu'il ne
prive pas l'appareil de sa propre navigation.

### 5 · Clos et vérifié dans le code — ce qui ne doit plus être réannoncé

*Ces cinq points ont été présentés comme « à faire » le 31/08 alors qu'ils étaient faits. Les ancres sont
là pour que la vérification prenne dix secondes la prochaine fois.*

| Annoncé comme ouvert | Réalité, vérifiée le 31/08 |
| --- | --- |
| `activeDriver.tactical` non transmis | ✅ `tacticalConfig` est un paramètre — `TacticalNarrativeService.ts:103` |
| `faction` dérivée à `enemy` | ✅ `faction \|\| (isPlayer ? 'player' : 'neutral')` — `useCombatStore.ts:759` |
| Contexte RAG envoyé en double | ✅ `sansPersona: true` + `{ systemOnly, limit: 2 }` — `useTacticalAIStore.ts:176` |
| Unité « cases » en dur | ✅ `${unite}` déclarée par le pilote — **y compris la ligne du soutien direct, corrigée le 31/08** (`d5…`, voir 3a) |
| Axe O — `relu: false` lu par personne | ✅ mention « non relue » et déclaration en un clic — `AIChatPanel.tsx:443` |

**Et pour mémoire, tous les axes A → O du plan IA sont clos**, le Cortex avec eux (ses 5 axes le 22/08,
ses 3 questions les 22-23, ses vigilances le 24).

### 6 · Ce que les soirées du 02 et du 03/09 ont ajouté

*Sept chantiers, **tous nés d'un signalement de David à l'écran**, aucun d'une relecture de code. Rangés
ici pour qu'on cesse de les rechercher, avec leur ancre.*

| Quoi | Ce qu'il y avait dessous | Où |
| --- | --- | --- |
| **L'ambiance d'une séquence s'éteint** quand la suivante prend la main | *« l'ancienne ambiance ne s'arrête pas »*. Deux raisons, aucune n'était un oubli : Ambient-OS n'arrête que ce qu'une **nouvelle scène** n'allume pas, et Sound-OS **empile**. *Une séquence est une parenthèse — pour l'oreille comme pour l'œil.* La musique fait exception, le meneur l'arrête | `storyboard/sonsDuMoment.ts` |
| **Le titre n'était pas en retard, il était perdu** | *« le texte du Titre n'apparaît parfois pas tout de suite »* — seulement sur un moniteur éteint, parce que la séquence **crée** alors la fenêtre. ⛔ **Un message émis avant que la fenêtre ne sache écouter est PERDU** ; rien ne le rejoue. Le principal retient le titre vivant, le rendu le **réclame** en arrivant | `electron/main.ts:487` |
| ⛔ **`tailwindcss-animate` n'avait jamais été installé** | Trouvé en cherchant pourquoi le fondu du titre ne se voyait pas : `animate-in`, `fade-in`, `zoom-in-95`… **125 fois dans 76 fichiers**, produisant zéro règle. *Une classe qui n'existe pas ne prévient pas.* Les fondus d'**entrée** du storyboard n'avaient donc jamais joué — seules les sorties, portées par un style en ligne | `tailwind.config.js` |
| **Les dés échelonnés au pupitre** | Le mode choisi à la main était lu, puis **recouvert par le pilote actif** : deux D12 lançaient des d6. *Septième fois le même motif — le chemin s'arrête avant le moteur* | `dice/DiceBoard.tsx` |
| ⛔ **Tout jet parti d'une tablette était un jet manuel** | La réponse à *« qui d'autre a la même rustine à poser ? »*, et elle a trouvé plus grave : `session.activeDiceConfig` était **déclaré des deux côtés et rempli par personne**. *Un champ que personne n'écrit ne rend pas une erreur, il rend `undefined` — et une carte qui ne s'affiche pas ne se signale pas* | `remote/hooks/useNexusSynchronizer.ts` |
| **L'atelier de thème** | *« un module me permettant de changer les paramètres, couleurs, polices, tailles »*. Les 22 jetons + une échelle de texte, dans les **réglages** et non dans la Forge — *la Forge écrit les règles, le thème est un réglage*. ⛔ **On réécrit les déclarations, jamais le fichier** : un `theme.css` porte 300 lignes de `.rpg-*` que les fiches consomment. Idempotence éprouvée sur les six thèmes réels | `theme/editionDuTheme.ts` |
| **Les épingles du Nexus** | *« dès que je libère les positions, tout se remélange »*. **`x/y` est un point de départ, `fx/fy` une contrainte** : un nœud rendu à d3 sans coordonnées est reposé sur une spirale — *ce n'est pas la simulation qui remélangeait, c'est qu'on lui rendait des inconnus*. Et **une épingle est une décision, l'instantané une capture** : les confondre ferait qu'un déverrouillage épingle tout le graphe | `session/logic/socialNexusUtils.ts` |

**Ce qui entre en catégorie P6 par ces sept lignes** — livré, jamais vu tourner :

- **L'atelier de thème.** Modifier une couleur doit se voir dans l'application **et** dans une fiche de
  personnage ouverte ; et le `theme.css` doit rester lisible après trois allers-retours. *L'idempotence
  est prouvée sur les fichiers du dépôt, pas sur ceux qu'un atelier aura réécrits dix fois.*
- **Les épingles du Nexus.** Poser trois nœuds, verrouiller, déverrouiller, revenir : les trois doivent
  être là et **eux seuls** ; « réinitialiser » doit tout rendre à la simulation.
- **Les dés échelonnés depuis une tablette.** La carte « Système actif » ne s'est **jamais** affichée —
  personne n'a donc jamais vu ce chemin marcher, dans aucun sens.
- **Les 125 classes d'animation** qui jouent enfin, dans 76 fichiers. *Rien ne les avait jamais vues
  jouer* : ce qui se voit maintenant est du neuf, y compris là où personne n'a rien demandé.

### 72 · ⭐ La plage de lecture — une fonctionnalité promise par deux documents et écrite nulle part (2026-09-16)

*David : « est-ce qu'on avait pas dit que dans Music-OS je voulais pouvoir définir une plage dans un
morceau qui se jouerait en boucle ou pas ? ».*

**Son souvenir était juste, et c'est ça qui mérite d'être noté.** Deux documents décrivaient la
fonctionnalité **au présent** :

| Où | Ce qui était écrit |
| --- | --- |
| Guide 71 § 3 | *« Chaque piste peut avoir un point d'entrée et de sortie défini. Le lecteur rebouclera automatiquement entre ces deux points »* |
| `music-os-analysis.md` § 3 | *« Le moteur reboucle instantanément entre ces deux points »* |

Et dans le code : `MusicPad.loopA` / `loopB` déclarés, initialisés à `null` **en cinq endroits**,
**écrits par personne et lus par personne**. Aucun écran ne les posait. Le moteur ne connaissait que
`audioElement.loop`, c'est-à-dire le morceau **entier**.

> ⛔ **Le croisement de deux motifs déjà payés ici.** *Une promesse de guide sans code* — les trois de
> Light-OS, le 07/09 — **et** *un champ déclaré des deux côtés et rempli par personne* — `activeDiceConfig`
> le 03/09, `pad.isActive` avant lui. ⚠️ **Ce qui est neuf, c'est le porteur de la promesse** : ce
> n'était pas une note de travail, c'était le **guide de l'utilisateur**. *Un document qu'on écrit en
> même temps que le plan décrit une intention ; relu six mois plus tard, il se lit comme un état des
> lieux — et il devient la mémoire de celui qui s'en sert.*

#### ⭐ Deux réglages, pas trois — la décision d'auteur

La demande contient déjà une plage **et** un choix (« en boucle ou pas »), soit trois comportements.
Le bouton 🔁 de la platine existait, et il devient la moitié de la réponse : **la plage dit *quoi*
jouer, 🔁 dit *si ça se répète*.**

|  | 🔁 allumé | 🔁 éteint |
| --- | --- | --- |
| **sans plage** | le morceau entier tourne | il joue une fois |
| **avec plage** | la plage tourne | la plage joue une fois, puis s'arrête |

*Quatre comportements sans ajouter un seul contrôle — et surtout sans un troisième réglage qui aurait
pu contredire les deux autres.*

⚠️ **Les points ne s'appellent PAS A et B à l'écran**, bien que les champs persistés se nomment
`loopA`/`loopB` depuis toujours : **les platines s'appellent déjà A et B**. *« Pose B sur la platine
A » est une phrase que personne ne devrait avoir à démêler en séance.* Ce sont **Entrée** et
**Sortie**.

#### ⛔ Là où la boucle ne devait surtout pas vivre

Une boucle se tient en surveillant la position de lecture. Deux endroits évidents, tous deux faux :

- **pas dans un composant** — *un composant démonté n'exécute rien*. C'est mot pour mot la leçon du
  fondu croisé du 30/08, où l'arrêt de la platine sortante vivait dans un `useEffect` du `Mixer` :
  écran de Music-OS fermé, la platine jouait indéfiniment ;
- **pas dans un `requestAnimationFrame`** — il se fige quand la fenêtre passe à l'arrière-plan, ce
  qui est *l'état normal d'un GM-OS qui projette sur un second écran*.

Elle vit donc dans le moteur, sur **deux mécanismes complémentaires** : un `setTimeout` armé pour
l'instant exact de la sortie (précis, ré-armé à chaque lecture, déplacement, bouclage), **et**
`timeupdate` comme filet — émis par l'élément audio lui-même, quatre fois par seconde, sans dépendre
d'aucune horloge d'interface. *Une boucle qui se dégrade à un quart de seconde près vaut mieux
qu'une boucle qui s'arrête.*

#### ⚠️ Les quatre pièges payés en chemin

| | |
| --- | --- |
| **La boucle native et la plage ne peuvent pas coexister** | `audioElement.loop` rembobine vers **zéro**, la plage vers **l'entrée**. Laissés ensemble sur une sortie qui touche la fin du fichier : *deux écrivains pour une même position, et c'est le hasard qui tranche* |
| ⛔ **La plage meurt avec la piste** | `loadTrack` l'efface, et le magasin repose celle du nouveau pad **juste après**. Dans l'autre ordre, une plage 0:10→0:40 restée du morceau précédent ferait boucler trente secondes arbitraires — *sans que le meneur ait le moindre moyen de deviner d'où sortent ces bornes* |
| **La durée n'est pas connue quand on pose la plage** | Les métadonnées d'un fichier fraîchement chargé ne sont pas lues. Le bornage n'a donc rien à border au chargement : il se rejoue sur `loadedmetadata`, **seul endroit possible**. C'est ce qui rattrape *un fichier remplacé sous un pad qui avait gardé ses points* — on borne plutôt que de refuser, **borner rend la plage approximative et visible, refuser la rendrait muette** |
| **Un délai de zéro se replanifie sans fin** | Si la tête ne bouge pas (mise en tampon, piste finie), les rendez-vous s'enchaînent dans la même milliseconde. *Ce qui se replanifie tout seul doit avoir un pas minimal* — 10 ms |

#### ⚠️ Ce que l'écran DIT, et pourquoi

`plageValide` refuse trois cas : un seul point posé, deux points à l'envers, une plage plus courte
que 0,25 s. **Refuser en silence aurait donné un bouton qui ne fait rien** — *le défaut préféré de ce
projet.* Le verdict est donc écrit sous la forme d'onde : `0:12 → 1:45` en vert, **« Pose la
sortie »** ou **« Plage invalide »** en ambre, **« Morceau entier »** quand il n'y en a pas.

Et les points **se posent à la position écoutée**, pas dans un champ de secondes : *on cale une
boucle à l'oreille, pas au chronomètre.* Le geste hérite du pointage du 30/08 — il marche donc à
l'arrêt comme en lecture.

#### Ce qui est gardé

- **`plageDeLecture.test.ts`** — 24 essais sur l'arbitrage seul : les refus, le bornage à la durée,
  la position de départ, le pas minimal.
- **`plageDuPad.test.ts`** — 8 essais sur **le chemin**, et c'est le point : *une donnée correcte que
  personne ne transporte laisse tous les tests au vert et le défaut intact.* Dont ⛔ **l'ordre
  chargement → plage**, vérifié par `invocationCallOrder`, et **les DEUX platines prévenues** quand
  le même pad est chargé des deux côtés (le préchargement le fait couramment).
- **Le comptage des chemins** : `loadTrack` n'a que deux appelants, tous deux dans `loadToDeck` ; et
  `loadToDeck` est le seul passage — pastille, glisser-déposer, clavier, restauration d'instantané.
  *La question « qui d'autre charge une piste ? » avant d'annoncer que c'est fini.*

#### ⚠️ Ce qui reste

⚠️ **La forme d'onde est un décor** — 40 hauteurs en dur, les mêmes pour tous les morceaux
(`Deck.tsx`). Le bandeau vert de la plage se pose dessus et le clic pour se placer fonctionne, mais
**on ne voit pas le son** : poser une plage se fait à l'oreille, jamais à l'œil. Une vraie forme
d'onde reste le seul vrai confort qui manque ici, et elle était déjà listée dans les perspectives v5
de la doc d'analyse.

⚠️ **La plage ne part pas vers les tablettes.** C'est un réglage de production côté meneur ; aucun
écran distant n'a de raison de le connaître. *Écrit ici pour que ce soit un choix et non un oubli.*

**Ancres** : `src/modules/music/logic/plageDeLecture.ts`, `MusicEngine.ts` (`definirLaPlage`,
`surveillerLaSortie`, `bouclerOuFinir`, `appliquerLaBoucleNative`), `useMusicStore.ts`
(`definirLaPlageDuPad`, `loadToDeck`), `components/Deck.tsx`, guide 71 § 3.

**Vérifié** : `tsc -b` propre, **5 052 tests** (401 fichiers, 1 ignoré), dont **48 neufs**.

#### ⛔ Éprouvé en réel le jour même — et la plage a cassé le fondu croisé

*David, une heure plus tard : « le fade out fade in entre A et B ne fonctionne plus », le son
traversant **d'un coup**. Une plage était posée.*

⭐ **Le diagnostic a commencé par disculper le suspect évident.** Neuf essais écrits exprès
traversent `triggerAutoFade` en vrai : la courbe est posée sur les deux gains, **étalée sur la
durée réglée**, rien ne l'écrase par une pose immédiate, et elle part avec une plage de chaque
côté. *Le chemin bouton → moteur était intact — il fallait le prouver avant de chercher
ailleurs.*

⛔⛔ **Et ces essais ont trouvé pourquoi personne n'avait jamais vu ce défaut : le `GainNode`
simulé du banc d'essai n'avait pas de `setValueCurveAtTime`** — *la seule fonction qui trace la
courbe du fondu*. Tout test qui aurait atteint `crossfadeTo` levait un `TypeError`, **ce qui
prouve qu'aucun ne l'atteignait**. Le fondu automatique, cœur du module, n'était couvert par
rien depuis toujours. *Un mock incomplet ne rend pas un test rouge : il rend une zone
inaccessible, et le silence qui suit ressemble à une couverture.*

**La cause** : la plage coupait la platine **sortante** en plein fondu. Arrivée à sa sortie, elle
rembobinait à l'entrée — ou, 🔁 éteint, se mettait en **pause nette**. Le morceau disparaissait
d'un coup pendant que l'autre montait : *ça s'entend exactement comme une bascule.*

> **La plage dit ce qui se joue en écoute normale. Une platine qu'un fondu emmène au silence est
> déjà condamnée — la couper une seconde fois n'aide personne.** La suspension se lève si le
> meneur saisit le crossfader en route (la sortante revient à l'antenne avec sa plage), à
> l'arrêt, et au fondu suivant. *Une suspension qu'on oublie de lever est la minuterie qui
> survit à ce qu'elle devait arrêter, en plus discret.*

⚠️ **Second défaut trouvé en chemin** : `play()` posait `currentTime` **sans la garde que
`seek()` porte** — *une position posée avant que les métadonnées soient lues est ignorée en
silence*. Le morceau démarrait donc à zéro au lieu de l'entrée, une fois sur deux, sans rien
dire.

✅✅ **ÉPROUVÉE EN RÉEL le 2026-09-16.** David : *« ça marche bien »*, puis *« si, j'ai entendu la
boucle repasser »*. La plage a donc été posée, jouée, **entendue reboucler par son point
d'entrée**, et traversée par un fondu croisé. *Le chantier sort de la catégorie P6 le jour de sa
naissance — ce qui n'arrive presque jamais ici.*

⚠️ **Le seul cas encore jamais entendu** : une plage qui **s'arrête seule 🔁 éteint**. C'est le
quatrième carreau de la table des comportements, et le seul dont le chemin
(`bouclerOuFinir` → `pause` + retour à l'entrée) n'a été vérifié que par des tests.

#### ⭐ « Est-ce que tu dois revoir d'autres mécanismes de fade out ? » — la question de David, et sa récolte

*Posée juste après la correction. Elle a trouvé un second chemin.*

⛔ **Le crossfader n'est pas le seul fondu qui emmène une platine au silence.** `stopDeck` et
« tout arrêter » passent par **`fadeOut`**, trois secondes de rampe qui n'ont rien à voir avec le
crossfader — quatre appelants. Une plage qui atteignait sa sortie pendant ce fondu-là coupait le
morceau net. *Même cause, même remède, deux chemins* : la suspension est posée là aussi, et levée
par `annulerLArretDiffere` — le meneur qui relance la platine en plein fondu de sortie, cas que
cette fonction existait déjà pour rattraper.

⚠️ **Appris en écrivant ce test** : `play()` **sort par la porte de derrière quand la platine n'a
pas de source**, *avant* d'annuler l'arrêt différé. Comportement d'origine et non un défaut — mais
il est désormais écrit.

✅ **Les quatre autres moteurs à fondu sont hors de cause, et pour une raison structurelle.**

| Moteur | Comment il boucle | Verdict |
| --- | --- | --- |
| **Ambient-OS** | `AudioBufferSourceNode.loop = true` | ✅ boucle **native**, sample-exacte, indépendante des rampes de gain |
| **Sound-OS** | idem | ✅ |
| **Curation audio** (tactical-ai) | idem, et son fondu croisé n'arrête que l'**ancienne** source | ✅ |
| **Carillon** de Clock-OS | attaque/déclin sur un oscillateur, un coup | ✅ ni boucle ni minuterie |

> ⭐ **Music-OS était seul exposé parce qu'il est le seul dont la boucle est tenue par NOTRE
> minuterie sur un `HTMLAudioElement`**, au lieu d'être portée par Web Audio. Les autres confient
> leur boucle au moteur audio, qui ne sait pas l'interrompre à contretemps. *La plage a introduit
> dans Music-OS un mécanisme que les autres modules n'ont pas — et c'est précisément là que le
> fondu pouvait être coupé.*

Et le trou du banc d'essai était borné : **`setValueCurveAtTime` n'est employé que par le
crossfader**, il ne cachait donc que celui-là.

### 73 · ⭐ « 5 pads c'est parfois peu » — et onze pastilles cachées dans les données (2026-09-16)

*David : « Dans Music-OS 5 pads par scène c'est parfois peu, est-ce que tu pourrais en rajouter
tout en maintenant la lisibilité au mieux ? »*

#### ⛔ Ce n'était pas une limite, c'en était TROIS — dont une qui cachait des données

| Où | Ce que ça plafonnait |
| --- | --- |
| `Array(5)` × 3 dans `useMusicStore` | la **création** d'une playlist |
| `grid-cols-5` | la **mise en page**, figée à cinq colonnes |
| ⛔ **`.slice(0, 5)` × 2** | **l'affichage** — et lui seul ne touchait pas aux données |

`git log -S` tranche : **les playlists avaient SEIZE pastilles**, et la refonte `da7979d2`
(« complete Music OS redesign ») a ramené la création à cinq **en ajoutant la coupe d'affichage**.
Toute playlist née avant gardait donc ses seize pads, **dont onze qu'aucune tuile ne montrait
plus**.

> ⛔⛔ **Et la coupe n'était pas posée partout.** `padDuRaccourci` parcourt **tous** les pads :
> **une pastille invisible avec une touche attribuée jouait toujours**. Le fichier du clavier
> promet pourtant, en toutes lettres, que *« le clavier voit exactement ce que l'écran montre »* —
> c'était vrai sur l'axe des campagnes (30/08), faux sur celui-ci. *Une promesse écrite dans un
> commentaire ne garde qu'un axe : celui auquel pensait celui qui l'a écrite.*

#### ⭐ Le nombre de pastilles n'est plus un réglage, c'est un geste

Tuile **Ajouter** en bout de grille, croix au survol pour retirer. *Une grille fixe force un choix
pour tout le monde : cinq est trop peu pour une taverne, seize est un mur de cases vides pour une
scène de transition.*

⚠️ **Retirer une pastille n'arrête JAMAIS le son.** Si elle jouait, la platine continue — *couper
le son parce qu'on a rangé la grille serait la pire surprise possible en séance.* Et la
confirmation ne se demande que pour une pastille **garnie** : une case vide n'est qu'un
emplacement, une case garnie porte un morceau, un nom, une touche, une scène lumineuse et une
plage de lecture.

#### La lisibilité, puisque c'était la condition posée

**La tuile est un `aspect-square` : le nombre de colonnes est exactement ce qui décide de sa
taille.** Il suit désormais la largeur — cinq colonnes sur un écran moyen (*la mise en page que
David connaît, inchangée*), jusqu'à huit sur un écran large. Motif : sa fenêtre fait ~1700 px, où
cinq colonnes donnent des carrés de 330 px — seize pastilles y feraient **quatre rangées**, et
`MusicDashboard` scrolle d'un seul bloc, donc **le crossfader passerait sous la ligne de
flottaison**. *Une grille qui grandit vers le bas éloigne le geste qu'on fait le plus.*

#### Ce qui est gardé

- **`pastillesSansPlafond.test.tsx`** — 9 essais, dont celui qui tient **les deux bouts ensemble** :
  ce que `padDuRaccourci` trouve doit être à l'écran. *Garder l'un des deux côtés n'aurait rien
  gardé du tout.*
- **Dégradation** : le `.slice(0, 5)` remis → **2 rouges**, dont la promesse clavier/écran.

**Ancres** : `useMusicStore.ts` (`ajouterUnPad`, `retirerUnPad`),
`components/PlaylistManager.tsx`, guide 71 § 4, `music-os-analysis.md`.

**Vérifié** : `tsc -b` propre, **5 061 tests** (402 fichiers, 1 ignoré).
⚠️ **Jamais vu tourner** : personne n'a encore ouvert Music-OS depuis. *Le cas qui compte n'est pas
la tuile d'ajout — c'est la réapparition des anciennes pastilles, qui n'a de témoin que les
données réelles de David.*

### 74 · ⭐ Éditer une pastille — le nom, la couleur, la touche au même endroit (2026-09-16)

*David : « quand j'édite un pad, je veux pouvoir changer le nom, la couleur du pad et assigner une
touche raccourci, est-ce possible ? »*

**Deux des trois existaient déjà — éparpillés.** Le nom derrière un `gmPrompt` du menu de la
tuile ; la touche derrière un **mode global** (Key Learn) à activer dans l'en-tête avant de cliquer
la pastille ; la couleur nulle part. *Un réglage qu'on atteint par trois chemins différents n'est
pas trois fois plus accessible : il est introuvable deux fois sur trois.*

#### ⭐ Le point technique qui a décidé de la forme

**C'est parce que l'éditeur est une boîte que la capture de touche y est sans danger.**
`estUneFrappeDePastille` rend `false` dès qu'une surcouche est ouverte : l'écouteur global de
Music-OS est donc **muet** pendant l'édition. Sans ça, appuyer sur « K » pour l'attribuer aurait
**lancé** la pastille liée à K, en pleine attribution.

> ⚠️ **Et c'est la même raison qui interdit de réutiliser le Key Learn ici** : il attend sa frappe
> sur cet écouteur-là, celui que la boîte fait taire. *Deux mécanismes qui se ressemblent, dont un
> seul peut fonctionner dans ce contexte.* Les deux restent offerts — le mode global attribue **à
> la chaîne**, l'éditeur **une à la fois** et prévient des conflits —, et le guide dit lequel sert
> à quoi plutôt que de laisser deux pages se contredire.

#### Les trois décisions d'auteur

| | |
| --- | --- |
| **La couleur ne s'affiche qu'AU REPOS** | Une pastille qui joue garde le halo d'accent, commun à toutes. *Ce qui sonne doit se repérer d'un coup d'œil, et une couleur par pastille rendrait cet état-là illisible.* |
| **Palette imposée de huit teintes** (tranché avec David) | Un sélecteur libre laisse piocher exactement le piège de Light-OS : `#334155`, contraste 1,6, **invisible**. |
| ⚠️ **On stocke la CLÉ, jamais l'hexadécimal** | `'ambre'` et non `'#f59e0b'` : le jour où le thème change, on corrige la palette et **toutes les pastilles suivent**. Une valeur recopiée dans les données serait gelée pour toujours. |

⚠️ **Les classes Tailwind sont écrites en toutes lettres**, jamais composées à l'exécution :
`border-${teinte}-500` ne produit aucune règle. *C'est la panne de `tailwindcss-animate` du 03/09,
en plus discret — une classe qui n'existe pas ne prévient pas.*

#### ⚠️ Une touche ne commande qu'une pastille

Règle de Light-OS reprise telle quelle. L'éditeur **nomme le détenteur avant d'enregistrer** et la
lui retire à la validation — sinon l'une des deux est muette et **rien ne le dit**.

⭐ **Le conflit se demande à `padDuRaccourci`**, celui-là même que le clavier interroge en séance.
*Deux règles écrites séparément finiraient par diverger, et l'écart ne se verrait qu'au moment où
l'on appuie.* Il sait aussi ce qu'une comparaison naïve ignorerait : deux campagnes différentes ont
le droit à la même touche.

⚠️ **Les frappes tenues avec Ctrl / Alt / Cmd sont refusées à la capture**, parce que la garde
partagée les écarte en séance. *Accepter une touche que le clavier ignorera ensuite serait un
réglage qui ment.*

#### ⛔ Un défaut introduit au chantier 73, et réparé ici

La croix « retirer » posée sur la tuile était en `bottom-2 right-2` — **exactement sous le bouton
« … » du menu**. Deux commandes dans le même coin, dont une inatteignable. Le retrait rejoint le
menu, à côté de « Vider » : *les gestes destructeurs se rangent ensemble, et on ne les rencontre
pas par accident.* (« Vider » garde la case et jette son contenu ; « Retirer » reprend la case.)

#### Ce qui est gardé

**`editeurDePastille.test.tsx`** — 14 essais : le nom vidé qui ne donne pas une pastille sans nom,
la clé de couleur et son retour à « Aucune », la capture, le refus de Ctrl, Échap qui n'attribue
rien, **le vol de touche et son avertissement nommé**, et ⚠️ **la clé de couleur inconnue qui
retombe sur « aucune »** — *rendre `undefined` donnerait une tuile sans bordure ni fond, donc une
pastille invisible.*

**Ancres** : `logic/couleursDePastille.ts`, `components/EditeurDePastille.tsx`,
`ModalProvider.tsx` (variante `music-pad-edit`), `useMusicStore.ts` (`MusicPad.couleur`),
guide 71 § 4.

#### ⛔ Vu à l'écran dans la foulée : « le pad est devenu illisible »

*David, capture à l'appui, une heure après le chantier 73.* Le menu d'une pastille débordait de sa
tuile, sa dernière entrée rognée.

> ⭐ **La cause n'était pas le bouton de trop, c'était le chantier 73.** Le menu a une **hauteur
> fixe** — six lignes de boutons — tandis que la tuile rétrécit avec le nombre de colonnes. Mon
> plafond à huit colonnes l'avait ramenée à ~190 px : la dernière entrée sortait du cadre **sans
> déborder visiblement ni rien signaler**. *Rendre une grille plus dense rétrécit tout ce qui vit
> DANS ses cases — y compris ce qui ne sait pas rétrécir.*

**Trois corrections**, dont une proposée par David :

- **La croix de retrait au milieu en bas de la tuile** (*sa proposition, et la bonne*) : les quatre
  coins sont pris — touche, poignée, scène lumineuse, menu « … » — et **le milieu du bas est le
  seul emplacement libre**. C'est exactement pourquoi ma première tentative l'avait posée *sous* le
  bouton « … ».
- **Six colonnes au plus** (tranché par David) au lieu de huit : ~265 px, le menu tient largement.
- **Le menu défile** au lieu de rogner — un filet, *pour qu'un débordement ne redevienne jamais
  silencieux*.

⚠️ **Le retrait a donc changé de place DEUX fois en deux heures**, et les deux raisons sont
différentes : d'abord inatteignable sous un bouton, ensuite responsable d'un débordement. *Une
commande de plus dans une boîte de taille fixe pousse la dernière dehors.* 2 essais de plus la
gardent hors du menu.

✅ **Vu en passant, signalé, puis retiré sur accord de David** : la tuile affichait
`[identifiant]` sous le nom — pour une pastille née d'une playlist créée au bouton « + », un
**UUID de 36 caractères** qui passait à la ligne. Antérieur à ces chantiers, mais d'autant plus
voyant sur une tuile plus petite. *Un identifiant technique ne dit rien au meneur ; il ne dit
quelque chose qu'à celui qui débogue, et celui-là a la console.* Signalé plutôt que retiré
d'office — **c'est de l'affichage, et la décision lui appartient**.

#### ⭐ Le troisième réglage de la grille, et la question qu'il fallait inverser

*David, capture à l'appui : « les pads sont trop grand, remets comme avant ».* Six colonnes lui
donnaient **253 px** et deux rangées pour huit pastilles, le mixeur repoussé en bas.

> ⛔ **Cinq colonnes, puis huit, puis six : trois réglages en une soirée, et le défaut était dans
> la QUESTION.** Un nombre de colonnes décide de la taille des carrés, donc **le résultat dépend de
> la largeur de la fenêtre** — impossible à régler juste pour tout le monde en une seule valeur.
> `auto-fill` + `minmax` inverse la question : *on énonce la taille voulue, la grille en met autant
> que la largeur permet. Ce qu'on veut tenir stable, c'est la tuile ; le nombre de colonnes n'est
> qu'une conséquence.*

⚠️ **Le piège du `rem` a failli passer une fois de plus** : la racine porte `font-size: 85%`, donc
un `rem` vaut **13,6 px**. `9.5rem` aurait donné des tuiles de 129 px — moitié moins qu'avant, bien
au-delà de la demande. Le plancher est à **11rem ≈ 150 px**, soit ~160 px réels et neuf tuiles par
rangée chez David. *Même piège que la conversion des 1 832 tailles du 05/09.*

#### ⭐ Et la vraie racine du va-et-vient : le menu n'avait pas de taille à lui

Le menu était en `inset-0` — **enfermé dans le carré, donc sa taille dépendait de celle des
pastilles**. C'est ce qui a produit les deux plaintes successives : il rognait sa dernière entrée
quand la grille se densifiait, puis les tuiles assez grandes pour lui étaient *« trop grandes »*.

> **Un menu dont la taille dépend de la vignette qu'il recouvre n'a pas de taille à lui.** Il
> devient une **bulle** (choix de David) : largeur propre, par-dessus les tuiles voisines. Trois
> conséquences à tirer ensemble — la tuile ne rogne plus son contenu, ses deux voiles décoratifs
> portent désormais leurs coins ronds eux-mêmes, et la tuile ouverte monte en `z-index` : *un
> élément ne peut pas sortir de l'ordre de peinture de son parent.*

⚠️ **Les libellés restent en toutes lettres.** Des icônes seules auraient tenu dans une petite
tuile — et auraient aggravé exactement ce que David avait déjà reproché : *trois points ne disent
rien de ce qu'ils cachent.*

✅ **Vu à l'écran : « ça va ».**

**Vérifié** : `tsc -b` propre, **5 077 tests** (403 fichiers, 1 ignoré).

### 75 · ⭐ Le Media Hub — un menu qui passait dessous, et une recherche invisible (nuit du 2026-09-16 au 17)

Deux signalements de David à la suite, sur le même écran. **Les deux sont des fonctionnalités qui
existaient et qu'on ne voyait pas.**

#### ⛔ 1. Le menu de tri passait SOUS les vignettes

*Capture à l'appui : la seconde entrée du menu « Date » recouverte par une carte.*

> **Ce n'était pas le `z-50` du menu qui était faux** — il est correct, mais **enfermé**. Le
> `<header>` porte `backdrop-blur-3xl`, et *un `backdrop-filter` crée un contexte d'empilement* :
> le `z-50` ne peut donc plus rien départager au-dehors. Or chaque vignette est `relative` **sans
> `z-index`** — même couche de peinture que le header, mais **plus loin dans le document**, donc
> peinte par-dessus lui *tout entier*. **Un élément ne peut pas sortir de l'ordre de peinture de
> son parent.**

C'est la **troisième fois de la soirée** que ce principe tranche un défaut — après la bulle du
menu des pastilles et son `z-index` de tuile. Correctif : `z-30` sur le header.

⭐ **Le balayage « qui d'autre ? » a rassuré sur le diagnostic** : des trois autres menus déroulants
du dépôt, **`OraclePanel` porte déjà `z-10` sur son en-tête flouté** — le même correctif, déjà en
place. `HubMessenger` vit dans un panneau `fixed z-[100]` d'une seule colonne, `Select.tsx` est à
`z-[1000]`. *Le Media Hub était l'exception, pas la règle.*

⚠️ **Aucun test, et c'est délibéré** : jsdom ne calcule aucune mise en page, l'ordre d'empilement
y est **inobservable**. Un test vérifiant la présence de la classe passerait pendant que le défaut
reviendrait par un autre chemin — *un contrôle qui se trompe est pire qu'un contrôle absent.* Le
raisonnement est écrit au-dessus de la ligne.

#### ⛔ 2. « Peux-tu rajouter un moteur de recherche ? » — il y en avait un

Il filtrait déjà le nom, les étiquettes et le type. Deux défauts le faisaient passer pour absent :

| | |
| --- | --- |
| ⛔ **Le champ était invisible** | Texte d'invite à `text-app-text/5` — **5 % d'opacité** — et loupe à `/10`. Un rectangle vide sans indice. *Le piège de Light-OS en pire : là-bas le gris « que personne n'a choisi » donnait 1,6 de contraste ; ici on est en dessous.* |
| ⚠️ **Il cherchait à la lettre près** | `sirene` ne trouvait pas *sirène* ; `taverne combat` ne trouvait pas *« combat à la taverne »*. *Une recherche qui échoue sur un accent ne se lit pas comme une recherche stricte : elle se lit comme un fichier perdu.* |

> ⭐ **Une fonctionnalité qu'on ne voit pas est une fonctionnalité absente — et elle coûte plus
> cher qu'une absence : on la redemande, et on cherche à la main en attendant.** C'est le
> deuxième cas du genre en deux heures, après les onze pastilles cachées par un `.slice`.

La comparaison passe dans `components/media/rechercheDeMedia.ts` : accents neutralisés des deux
côtés, **tous les mots exigés, chacun n'importe où** (nom, étiquette ou type, même répartis entre
eux) — *on cherche des morceaux de nom dont on se souvient ; exiger l'ordre, c'est demander de se
rappeler ce qu'on est précisément en train de chercher.* 14 essais.

Le champ affiche désormais le **nombre de résultats** (ambre s'il n'y en a aucun) et une croix pour
effacer : *sans ce nombre, « aucune donnée détectée » accuse la bibliothèque alors que c'est le
filtre qui parle.*

⚠️ **Dixième copie de la désaccentuation dans le dépôt** (`archetypes`, `canevas`,
`structureDeCampagne`, `inventaire`, `rechercheDansLeManuel`…). Inscrit dans le fichier plutôt que
tu — les réunir est un chantier à part.

⚠️ **Non touché, signalé** : la vue « Plus récents » plafonne l'affichage à 50 fichiers, donc le
compte y décrit les vignettes à l'écran et non les correspondances. C'est une vue choisie
explicitement, jamais le défaut.

**Ancres** : `src/components/MediaBrowser.tsx` (header `z-30`, champ de recherche),
`src/components/media/rechercheDeMedia.ts`.

**Vérifié** : `tsc -b` propre, **5 091 tests** (404 fichiers, 1 ignoré).
⚠️ **Jamais vu tourner.**

---

### 76 · ⭐ La refonte de l'interface — un chantier ouvert, rien de commencé (2026-09-17)

**Origine** : David apporte trois maquettes (compteur de rounds, Dice-OS, Image-OS) et demande
*« je voudrais retravailler complètement l'interface et le rendu — tu penses que c'est possible ? »*,
puis *« je ne suis pas graphiste, est-ce qu'une IA spécialisée peut aider ? »*.

⛔ **RIEN N'EST COMMENCÉ.** David joue d'abord une partie sur la version actuelle. Ce § existe pour
que le chantier soit *trouvable*, pas pour annoncer un travail fait.

**Les deux documents**, et ils ne disent pas la même chose :
- `documentation/Architecture/Refonte-Interface.md` — l'état mesuré, les couches visées, les invariants.
- `documentation/Planning/2026-09-17-refonte-interface.md` — les six phases, les tâches, les essais,
  l'intégration, et **les cinq questions posées à David — TOUTES tranchées le jour même** (voir ci-dessous).

#### ⭐ Ce que la mesure a révélé — et j'avais annoncé l'inverse

J'ai d'abord dit à David : *« il n'y a pas de couche sémantique, 100 usages de jetons »*. **Faux.**
J'avais cherché `var(--)` dans le TSX sans voir les alias Tailwind qui portent les mêmes jetons.

| Relevé le 2026-09-17 | |
| --- | ---: |
| Jetons de châssis `app-*` | **4 566** usages, 214 fichiers / 310 |
| `shadow-glow-*` | 330 |
| Palette Tailwind brute | 4 124 |
| Déclarés, jamais employés | `glass-gradient`, `gm-teal`, `gm-orange` |

⭐ **GM-OS a déjà un système de design ; il est adopté à moitié — et ce demi-état trompe.** On voit
des `bg-emerald-500` partout et on conclut qu'il n'y a rien. Le châssis (fond, surface, bordure,
texte) est tokenisé et respecté. Ce qui est écrit en dur, ce sont les couleurs d'**état**
(succès / danger / alerte), le **texte secondaire** — 542 `text-slate-400/500`, soit *l'absence de
`--app-text-muted`* — et la **catégorie**. *Une couleur en dur n'est pas une négligence quand aucun
jeton ne la nomme : c'est le seul mot disponible.*

#### ⭐ La forme du plan vient de là : trois manques à un fichier, un manque à 214

`--etat-*`, `--app-text-muted`, `--elev-*` se posent dans **un seul fichier** et changent toute
l'application en deux soirées, réversibles d'une ligne. Les **primitives** (`src/components/socle/`)
se paient fichier par fichier, sur des semaines. **Les mélanger perdrait la seule propriété qui rend
ce chantier sûr : voir le nouveau rendu en séance réelle AVANT d'engager la migration.**

#### ⭐ L'exigence rappelée par David le soir même — et elle contraint tout le reste

*« Je veux aussi que les thèmes de l'interface, voire même des éléments visuels de l'interface,
s'adaptent avec le jeu. »*

⛔ **J'avais écrit l'inverse.** L'invariant R2 de la première version disait *« le thème de JEU et le
CHÂSSIS restent deux systèmes »* — **c'est faux, et ça l'était déjà dans le code.** `appliquerLeTheme`
compose la palette d'atelier **puis laisse le jeu la recouvrir**, la polarité du jeu l'emporte, son
échelle de texte pose la taille de racine, et ses polices sont posées puis retirées au changement de
campagne. La règle est écrite depuis le 2026-08-23 : **« le jeu gagne, la main surcharge »**.

Ce qui ne se mélange pas, ce ne sont pas les deux thèmes — ce sont les deux **vocabulaires** : les
jetons traversent le pont, le vocabulaire de composants `.rpg-*` reste à l'iframe des fiches.
*J'ai pris une frontière entre deux vocabulaires pour une frontière entre deux systèmes.*

⚠️ **La contrainte qui en découle est la plus difficile à défaire du chantier** : *toute échelle
ajoutée au châssis doit décider, le jour même, si le jeu peut la piloter* (tâche T1.6). Un jeton posé
sans entrée dans `PONT` est un jeton que le jeu ne pourra **jamais** habiller — et le corriger plus
tard veut dire rouvrir chaque module.

#### ⛔ Un défaut trouvé en vérifiant le pont — quatre classes mortes

`PONT` mappe `muted → --app-text-muted`. Mais **aucune des quatre palettes ne définit cette variable**
et **`tailwind.config.js` n'expose aucun alias** — pendant que `JournalDashboard.tsx` emploie
`text-app-text-muted` **quatre fois** (l. 315, 323, 345, 350). Ces classes ne produisent aucune règle :
trois sont rattrapées par un `opacity-50` voisin, **celle de la ligne 350 s'affiche en pleine
intensité** là où on voulait du texte secondaire.

⭐ *Même motif que les 125 `animate-in` sans greffon du 2026-09-03 : une classe qui n'existe pas ne
prévient pas — rien ne casse, il ne se passe simplement rien.* Et c'est la démonstration vivante de la
contrainte ci-dessus : **un jeton branché d'un seul côté du pont est un jeton mort.** Le correctif est
T1.1, et il est plus petit qu'il n'y paraît — le pont est écrit, il manque la valeur et l'alias.

#### ✅ « Des éléments visuels » — les quatre lectures, TOUTES retenues

✅ **TRANCHÉ le soir même : David retient LES QUATRE.** V1 forme, V2 matière, V3 ornement,
V4 iconographie.

**V1 entre en phases 1 et 3** (c'est un jeton, et les primitives doivent le lire *dès leur
écriture*). **V2, V3 et V4 deviennent la phase 6** : elles ont besoin de *fichiers*, donc le dossier
de thème d'un jeu cesse d'être une feuille de style pour devenir un **paquet** — `matieres/`,
`ornements.json`, `icones.json` (§ 8.6 de l'architecture).

⭐ **Aucun IPC nouveau n'est nécessaire, et c'est ce qui rend V2–V4 abordables** : `readDoc` lit déjà
tout fichier texte sous `docs/` — donc les **SVG** et les manifestes — et le protocole `gmos://` sert
déjà n'importe quel fichier local. D'où la décision : *ornements et icônes sont du SVG*, qui hérite
de `currentColor` et suit donc l'accent du jeu au lieu de le contredire.

⭐ **La règle qui rend V4 possible : la surcharge PARTIELLE.** Un jeu déclare les icônes qui lui
importent, le reste retombe sur `lucide-react`. *Quinze icônes bien choisies font un thème ; quatre
cents font un projet mort.*

⚠️ **Deux garde-fous à poser avant la première texture** : le protocole `gmos` sert **n'importe quel
chemin absolu**, or un thème est du contenu déposé — tout chemin venant d'un thème se résout dans le
dossier du jeu et se refuse s'il en sort (même esprit que la liste close des hôtes de polices). Et le
**vocabulaire des fentes d'ornement se fige une fois** : chaque fente ajoutée ensuite invalide les
paquets déjà écrits par les jeux — *la seule décision du chantier qui engage quelqu'un d'autre que
nous.*

#### ✅ Les CINQ questions tranchées le jour même — 2026-09-17

| # | Question | Décision | Ce qu'elle coûte |
| --- | --- | --- | --- |
| **Q1** | Les 4 thèmes d'interface survivent-ils ? | ✅ **Oui, et ils sont un axe INDÉPENDANT du jeu** | Chaque nouvelle échelle reçoit **4 jeux de valeurs** par défaut. Mais le **jeu n'en fournit qu'un** : il se pose par-dessus la palette active, donc le pont reste à une dimension |
| **Q2** | Le thème clair est-il encore voulu ? | ✅ **Oui, explicitement** — *« je veux conserver un thème clair »* | Chaque jeton, halo et seuil validé **deux fois**. C'est la moitié de la phase 1 — et ce n'est plus un héritage, c'est une exigence |
| **Q3** | Les 7 accents `gm-*` face à l'accent unique du jeu ? | ✅ **DÉRIVÉS de l'accent effectif** | Une fonction de dérivation, et ⚠️ **deux garanties au lieu d'une** — voir ci-dessous |
| **Q4** | Jusqu'où va la migration des 214 fichiers ? | ✅ **L1 + L2, puis on rejuge** — 46 fichiers | La garde anti-couleurs-brutes reste **une liste**, jamais un « tout `src/` » |
| **Q5** | Jusqu'où vont « les éléments visuels » ? | ✅ **Les quatre** — V1 forme, V2 matière, V3 ornement, V4 iconographie | V1 en phases 1 et 3 ; V2–V4 deviennent la **phase 6** |

⭐ **Le piège de Q3, et il vaut d'être écrit.** La dérivation doit garantir **deux** choses : assez de
contraste avec le fond *sur les quatre palettes, clair compris*, **et assez de distance entre frères**.
Sept teintes d'une même famille peuvent finir trop proches pour être distinguées — et là on perd le
repère qui dit « tu es dans Music », *c'est-à-dire la seule raison de garder sept accents*.
**Une dérivation qui rend sept fois presque la même couleur ressemble à une dérivation qui marche.**
⚠️ Et `gm-teal` / `gm-orange` ne sont employés **nulle part** : à supprimer plutôt qu'à dériver.

⭐ **Q3 ne crée aucun arbitre nouveau** : l'accent effectif est déjà arbitré par `appliquerLeTheme`
(jeu > main > palette), et la dérivation s'y branche — exactement le mécanisme qui produit
`--app-accent-glow` et `--app-accent-rgb` depuis le 2026-08-24, *parce qu'une valeur recopiée dans une
table que personne ne relit quand l'accent bouge finit toujours par mentir*.

#### Les décisions déjà prises

- **Pas de grand soir**, pas de bibliothèque tierce, **pas de refonte des mises en page** — on
  rhabille.
- **Le premier lot de migration est `combat` + `dice` + `image`** : exactement les trois maquettes
  apportées, 23 fichiers, seuls modules où la comparaison « visé / obtenu » est immédiate.
- **Stitch propose, David tranche, le code transpose.** Son code n'est pas collé : il génère du neuf,
  qui ne connaît ni les magasins ni les vraies données — collé tel quel, il ferait *un 28ᵉ module qui
  ne ressemble pas aux 27 autres*.
- **Le MCP de Stitch est reporté.** Il n'améliore que la lecture des valeurs exactes ; réel mais
  marginal tant qu'on ne boucle pas. ⚠️ Le jour venu : vérifier l'identité du paquet — **deux dépôts
  GitHub portent une description strictement identique**.

#### ⭐ Deux essais du plan que ce dépôt a déjà payés deux fois

- **La garde de contraste** (T0.3) : un nombre WCAG sur chaque paire (texte, fond) des quatre thèmes.
  `#334155` de Light-OS donnait **1,6** ; le champ de recherche du Media Hub était à **5 %**
  d'opacité. *Aucune relecture ne les avait vus ; un nombre les aurait vus tous les deux.*
- **Les captures Playwright** (T0.1) : `toHaveScreenshot` n'est employé **nulle part** dans le dépôt,
  alors que `e2e/tousLesModules.spec.ts` ouvre déjà chaque panneau dans la vraie application.
  ⚠️ Une refonte délibérée les fera **toutes** diverger : leur valeur n'est pas « rien n'a changé »
  mais **« seul ce que je visais a changé »**.

#### ⚠️ Le risque, et il n'est pas dans le code

Les maquettes montrent 5 combattants, des noms courts, des PV à deux chiffres. Le vrai écran tient
11 combattants, un nom de 24 signes et `148/155`. **Une bonne part de leur élégance est un luxe de
place que les vraies données n'accordent pas** — d'où un essai « données hostiles » inscrit au plan.
Et `:root` porte toujours `font-size: 85%` : un `rem` transposé d'une maquette sort 15 % trop petit.

**Ancres** : `src/theme/themeDeLInterface.ts` (unique écrivain des `--app-*`), `tailwind.config.js`
(alias `app-*`, `gm-*`, `shadow-glow-*`), `src/index.css` § `@theme`, `e2e/tousLesModules.spec.ts`.

**État** : ⛔ **non commencé — mais plus rien ne le bloque.** Les cinq questions sont tranchées, la
conception est écrite, et le premier geste est **T0.1** : les captures de référence, une soirée,
aucun pixel changé. Seule la partie que David joue d'abord le précède.

---

### 77 · ⭐ Light-OS — l'audit du catalogue d'effets contre ce que le Hue sait faire (2026-09-17)

**Demande de David**, en marge d'une demande de fusillade : *« peux-tu revoir les différents effets et
t'assurer de leur cohérence en fonction des possibilités du Philips Hue ? »*

⭐ **Six défauts trouvés et corrigés.** Aucun ne cassait quoi que ce soit : ils rendaient seulement
l'effet **moins bon que ce que son code prétendait** — la catégorie que ni les tests ni une relecture
ne voient, et que David voyait sans pouvoir la nommer.

| # | Défaut | Ce qui se passait vraiment |
| --- | --- | --- |
| 1 | ⛔ **`warp` était injoignable** | Codé dans le moteur, nommé **dans les deux langues** (« Saut Spatial » / « Warp Speed »), cité en exemple dans `useLightStore` — et **offert dans aucune liste**. Il manquait *une ligne* |
| 2 | ⛔ **`bri: 0` n'éteint pas une lampe Hue** | Plage réelle **1–254** ; seul `on: false` coupe. Le temps « noir » du `stroboscope` était un temps **faible** — d'où un battement mou. Idem pour la disparition du `fantome` |
| 3 | ⛔ **`disco` tirait un `xy` au hasard** | `[Math.random(), Math.random()]` : hors du triangle une fois sur deux, parfois **invalide** (`x + y > 1`). **Seul effet du catalogue à contourner le calage de gamut** |
| 4 | ⚠️ **Le gyrophare fondait** | 200 ms de fondu pour 300 ms de cycle : les deux tiers du temps en dégradé rouge-violet-bleu. *On ne voyait ni le rouge ni le bleu.* **Un gyrophare claque** |
| 5 | ⚠️ **Le `fantome` fondait plus lentement qu'il ne battait** | Fondu 1 s, battement 800 ms : la commande suivante arrivait avant la fin — *le fondu n'était jamais vu* |
| 6 | ⚠️ **`#808080` est un blanc** | Le gris n'existe pas pour une lampe : même chromaticité que le blanc, seule la luminance diffère. Ce `xy` de `lightning` était **une commande pour rien**, dans un budget qui en tient dix par seconde |

#### ⭐ Le test qui garde la porte — `catalogueDesEffets.test.ts`

Quatre règles lues dans le source, plus une cinquième qui garde le test lui-même :

1. **Tout effet codé est proposé** — c'est elle qui tient `warp`.
2. **Tout effet proposé est jouable** — le `switch` n'a pas de `default` : une porte sur rien ne dirait
   rien.
3. **`bri` reste dans 1–254**, examiné **en position de valeur** uniquement.
4. **Toute couleur est dans le triangle de la lampe** — le gamut C est **recopié** dans le test et non
   importé du moteur : *un test qui importe la constante qu'il vérifie valide le code contre
   lui-même.* Un littéral est accepté s'il tombe dedans (`lumiere-ville` en pose un, légitime).
5. **La tranche examinée contient bien le catalogue.**

⛔ **La cinquième règle existe parce que le piège s'est produit en écrivant le fichier.** Le repère de
fin (`// Apply global brightness`) apparaît **deux fois** dans `HueEngine`, et sa première occurrence
est *avant* la boucle : la tranche était vide, et **deux règles passaient au vert sans rien examiner.**
⭐ *Un test qui ne trouve rien ressemble à un test qui ne trouve rien à redire.*

⚠️ Une règle a aussi crié sur un cas juste avant d'être resserrée — elle attrapait le `0` de
`tick % 2 === 0`. *Un contrôle qui se trompe est pire qu'un contrôle absent* : une règle qui crie sur
un modulo se fait désactiver, puis oublier.

#### ⚠️ Quatre constats NON corrigés, et pourquoi

| Constat | Pourquoi il reste ouvert |
| --- | --- |
| **`applyXyVariance` s'applique APRÈS le calage** (8 effets) | La variance ressort du gamut et se fait re-caler par le pont : *elle n'est pas celle qu'on croit*, surtout sur une couleur saturée. Corriger demande de caler **après** variance — donc de toucher aux huit |
| **Le type d'ampoule n'est jamais lu** | `light.type` est stocké, jamais consulté. Une Hue **blanche** recevant un `xy` renvoie une erreur : sur une installation mixte, chaque effet coloré gaspille des créneaux sur des lampes qui ne peuvent pas obéir |
| ⛔ **Rien ne protège le budget GLOBAL du pont** | `CADENCE_PLANCHER_MS` protège **une** lampe (10 cmd/s). Une scène de 4 lampes à 100 ms en demande **40** au pont qui en tient ~10. *C'est le vrai plafond de tout ce module* |
| ✅ ~~**`stopSoftwareEffect` ne restaure ni `on` ni `bri`**~~ | **FAIT le 2026-09-17 même**, voir ci-dessous |

#### ✅ Le prérequis — l'arrêt rend son état à la lampe (2026-09-17)

*« Fais les prérequis »* — David, le soir même.

⛔ **Le défaut.** Une boucle d'effet écrit `bri`, `xy` et `on` **directement sur le pont**, en
contournant `setLightState` pour ne pas faire rendre React dix fois par seconde. L'arrêter ne faisait
donc que couper la boucle : **la lampe restait là où le dernier battement l'avait laissée.** Choisir
« Fixe » sur un fantôme pouvait rendre une lampe presque éteinte, sur un stroboscope une lampe au
minimum — *sans message, sans erreur : on croyait la lampe cassée.*

⭐ **Ce qui rend la réparation possible est la cause même du défaut.** Puisque la boucle contourne le
magasin, **le magasin a gardé l'état d'avant l'effet**. Il suffit de le renvoyer. *Un état que
personne n'écrit n'est pas perdu si quelqu'un a refusé de l'écraser.*

#### ⛔ Et la restauration est FAUSSE par défaut — ce n'est pas de la prudence

`stopSoftwareEffect` a **neuf appelants**. Un seul doit restaurer : le geste « Fixe » du pied de page,
le seul qui ne soit suivi d'aucune pose d'état. Les huit autres écrivent juste après — une scène, un
flash tactique, une extinction — et y restaurer serait **une commande pour rien** dans un budget qui
en tient dix par seconde.

⚠️ **Deux d'entre eux la poseraient même à l'envers.** `handleColorChange` et `toggleLight` appellent
`setLightState` **avant**, *sans l'attendre* : le magasin n'est pas encore à jour quand l'arrêt
survient. Restaurer y renverrait l'état **précédent** — *la couleur que l'utilisateur vient de choisir
serait effacée par son propre geste.* Un test compte donc les appels restaurants et exige qu'il y en
ait **exactement un** dans toute l'application.

*Quatrième fois dans ce module que des gestes de retour se ressemblent sans viser la même chose.
On ne les aligne pas : on les compte.*

#### ⭐ « Qui d'autre a la même rustine à poser ? » — la racine était ailleurs

Les deux `bri: 0` du matin avaient été corrigés **un par un**. La question a trouvé le vrai coupable :
`brillanceEffective`, qui bornait à **zéro**. Une brillance faible multipliée par un curseur global bas
y arrive toute seule — `setLightState` pouvait donc envoyer `bri: 0` **sans que personne l'ait écrit.**
⚠️ *Deux appelants avaient déjà posé leur `Math.max(1, …)` localement : le signe était là.*

⛔ **Mais un test existant exigeait le zéro** — *« un curseur global à zéro voulait déjà dire rien : on
ne le trahit pas »*. Deux intentions tombaient sur la même valeur :

| Cas | Ce qu'il veut dire | Résultat |
| --- | --- | --- |
| Un curseur **à zéro** | « rien », délibérément | `0` — décision d'auteur conservée |
| Un produit qui **arrondit** à zéro | « aussi faible que possible » | `1` |

*On ne réécrit pas une décision d'auteur parce qu'elle gêne un correctif : on sépare les deux cas
qu'elle confondait.*

⛔ **Ce qui reste vrai et non traité** : `bri: 0` **n'éteint toujours pas**. Le curseur global à zéro ne
fait donc pas ce que son propre test dit qu'il fait — il faudrait un `on: false`. Constat à part.

#### Ce qui est gardé

- `logic/etatARendre.ts` — fonction **pure**, comme les autres `logic/` du module : le moteur ne fait
  que lui lire le magasin. ⚠️ Elle porte la règle physique *« ni couleur ni brillance à une lampe
  qu'on éteint »* — le pont refuse de modifier une ampoule éteinte, et la commande entière échoue.
- L'arrêt de l'effet natif et la restauration voyagent dans **une seule commande**.
- ⭐ **Le vrai stroboscope est désormais possible** : `on: false` pour le temps noir ne risque plus de
  laisser une lampe éteinte. **Non fait** — à voir dans la pièce d'abord, le `bri: 1` actuel suffit
  peut-être.

**Vérifié** : `tsc -b` propre, **5 106 tests au vert** (406 fichiers, 1 ignoré).
⚠️ **Jamais vu dans la pièce.**

#### ✅ La fusillade — et le budget du pont enfin compté (2026-09-17)

⭐ **C'est le premier effet du catalogue qui veuille battre vite ET longtemps**, donc le premier à se
heurter au vrai plafond du module : le pont tient **dix commandes par seconde, toutes lampes
confondues**, et `CADENCE_PLANCHER_MS` ne protège que d'**une** lampe emballée.

**Ce qui la sauve : une fusillade est surtout du silence.** Des rafales courtes, des pauses longues —
le débit *moyen* reste bas même quand la pointe est haute. Un coup occupe **deux battements** (l'éclair,
puis le noir) : à 100 ms le battement, environ trois cents coups/minute. Moins qu'une arme réelle,
assez pour que l'œil lise une rafale.

⭐ **Le plancher de pause se calcule depuis le nombre de lampes qui tirent**, relu **à chaque
battement** : une lampe qui rejoint ou quitte change le partage, et les autres doivent s'en apercevoir.
*Une part calculée une fois ment dès que le nombre de convives change.* Le budget devient un réglage
au lieu d'être un mur.

⭐ **Et aucun chef d'orchestre.** Chaque lampe a sa boucle et son hasard : elles se décalent seules dès
la première pause. *L'œil lit des tirs croisés là où il n'y a que de l'indépendance.*

#### ⛔ L'essai de budget a réfuté ma première conception — deux fois

Le fichier `cadenceDeFusillade.test.ts` **simule** les lampes sur une minute et mesure le débit. Aucun
autre essai du dépôt ne vérifie cette limite. Il a servi immédiatement :

| Tour | Ce qu'il a dit | La cause |
| --- | --- | --- |
| 1 | **11,9 cmd/s à six lampes** (pour dix admises) | Le plancher raisonnait sur une rafale **« de référence »** à trois coups, alors qu'elles vont de deux à cinq. ⭐ *Une moyenne n'acquitte pas les cas au-dessus d'elle.* La pause se calcule désormais sur la longueur **réelle** de la rafale |
| 2 | **10,7 cmd/s à douze lampes** | ⚠️ **Un biais de MESURE, pas un défaut de conception** : la simulation s'arrêtait au milieu d'une rafale et divisait par une durée fixe — elle comptait des commandes sans compter leur pause. *Un biais de mesure ressemble trait pour trait à un défaut de conception, et il envoie corriger le mauvais fichier.* |

#### ⭐ La catégorie qui manquait : le COUP UNIQUE

Les trente-sept effets d'origine sont **tous des boucles** — des ambiances. Or une déflagration, un
impact, un sort qui part sont des **ponctuations** : ça arrive une fois et ça retombe. Le moteur n'en
avait aucune notion.

⚠️ **Et ce n'était pas codable avant le prérequis du matin.** Un coup unique s'arrête tout seul en
**rendant à la lampe l'état qu'elle avait avant** ; tant que l'arrêt ne restaurait rien, une explosion
aurait laissé la pièce dans sa dernière braise. *Le prérequis n'était pas une politesse, c'était la
condition.* Fin de coup unique = **zéro commande de plus** : la restauration EST le dernier état.

#### Les sept effets ajoutés — 37 → 45

| Effet | Type | Pourquoi il marche sur du Hue |
| --- | --- | --- |
| **Déflagration** | ⭐ coup unique | Blanc, orange, braise, plus rien. *Le Hue est médiocre en stroboscopie et excellent en décroissance lente — une explosion est surtout une décroissance* |
| **Impact** | ⭐ coup unique | **Deux commandes** en tout. Une balle qui touche, un sort qui frappe |
| **Fusillade** | boucle | Voir ci-dessus |
| **Panne de courant** | boucle | Grésillement, chute, deux relances ratées, noir. *Une panne qui ne se répète pas serait un coup unique ; celle-ci est une ambiance* |
| **Torche qui faiblit** | boucle longue | La braise baisse sur dix minutes. ⭐ *Personne ne voit que ça descend, et au bout d'une heure tout le monde parle moins fort* |
| **Sonar** | boucle lente | **Deux commandes par cycle de quatre secondes** — le moins cher du catalogue, et l'un des plus efficaces |
| **Sirène lointaine** | boucle lente | L'inverse du gyrophare : *celui-là est dans la pièce, celle-ci au bout de la rue* |
| **Chute de tension** | boucle très lente | Dérive du blanc vers l'ambre sale sur une heure. *Invisible sur l'instant* — là où le Hue est le meilleur |

#### ⭐ La garde de restauration a servi le jour même

Le test qui comptait les appels restaurants est passé à **deux** en ajoutant les coups uniques. Il a
donc forcé à **justifier** le second au lieu de le glisser — puis il a été réécrit pour **nommer ses
deux ayants droit** (le pied de page, et la fin d'un coup unique) plutôt que d'attendre un chiffre.
*Une garde qu'on se contente d'ajuster au nouveau nombre ne garde plus rien.*

**Ancres** : `src/modules/light/logic/cadenceDeFusillade.ts` (+ son essai de budget),
`HueEngine.ts` (le drapeau `fini` des coups uniques, les huit nouveaux `case`), `BulbFooter.tsx`,
`src/locales/{fr,en}/modules.json`.

**Vérifié** : `tsc -b` propre, **5 127 tests au vert** (407 fichiers, 1 ignoré). 45 effets au moteur,
tous joignables — le test du catalogue l'exige.
⚠️ **Jamais vu dans la pièce.** *Ce qui sort vraiment des lampes reste hors de portée de tout test.*

#### ✅ Le budget du pont, pour TOUS les effets — les solistes (2026-09-17)

*« Tu veux dire quoi comme vrai chantier ? »* — puis, sur la conception : *« je pencherais pour le
soliste, mais est-ce vraiment qu'une lampe, ou est-ce qu'on peut en mettre 2 ? »*

**La mesure d'abord.** Douze effets à cadence soutenue dépassent le budget dès quatre lampes :

| Effet | Cadence | Demande à 4 lampes |
| --- | ---: | ---: |
| `stroboscope`, `hyperspace`, `terminal` | 100 ms | **40 cmd/s** |
| `cyber-night`, `reacteur` | 150 ms | 26,7 |
| `tv`, `warp`, `glitch` | 200 ms | 20 |
| `fire`, `candle`, `lightning` | 250 ms | 16 |
| `disco`, `police` | 300 ms | 13,3 |

⚠️ **Ce n'est pas un risque futur, c'est l'état actuel.** Ces effets sont **déjà** dégradés : le pont
accumule du retard, *et un pont en retard ne se voit pas à l'écran — il se voit dans la pièce, une
demi-minute plus tard.*

#### ⭐ Pourquoi des solistes plutôt qu'un ralentissement

L'autre remède — un plancher de cadence qui monterait avec le nombre de lampes — était plus simple à
écrire. Il a été écarté pour une raison de fond : **un stroboscope ralenti cesse d'être un
stroboscope.** Sa nature *est* sa vitesse. On fait donc jouer **moins de lampes, à la bonne vitesse** ;
les autres gardent la couleur que la scène leur a posée — *elles ne font rien, et ne rien faire ne
coûte aucune commande.*

#### ⭐ « Une seule lampe ? » — non : entre une et trois, et ça se déduit

`solistes = intervalle ÷ 100`. La cadence de l'effet décide, ce n'est pas un choix arbitraire :

| Cadence | Solistes | Lecture |
| ---: | ---: | --- |
| 100 ms | **1** | Le stroboscope mange le budget entier à lui seul — la physique ne laisse pas le choix |
| 200 ms | **2** | |
| 300 ms | **3** | Un gyrophare qui rebondit sur trois lampes vaut mieux que sur une |

#### Les trois décisions de conception

- ⭐ **La `fusillade` est EXEMPTÉE.** Son principe *est* le tir croisé sur toutes les lampes, et elle
  allonge déjà ses pauses selon leur nombre. La rationner par-dessus l'étoufferait deux fois —
  *et il n'y a pas de tir croisé à une lampe.*
- **Le choix se refait à CHAQUE battement**, jamais au démarrage : les lampes d'une scène partent
  l'une après l'autre, et la première ne sait pas combien la rejoindront. Celle qui découvre qu'elle
  est en trop s'arrête **en se restaurant** — elle ne s'éteint pas, elle arrête de battre.
- ⚠️ **Le tri des identifiants est ce qui rend le choix STABLE.** Sans lui, la lampe soliste changerait
  à chaque arrivée et elles oscilleraient entre les deux rôles — *ce qui coûterait précisément les
  commandes qu'on veut économiser.*

#### ⛔ Deux angles morts qui se couvraient l'un l'autre

`candle` et `glitch` **partagent le corps** de leur voisin dans le `switch` (`case 'candle': case
'fire':`). Ils manquaient à la table — **et l'essai censé détecter l'oubli ne les voyait pas non plus**,
parce qu'il s'arrêtait à l'absence de `break;`. Une bougie sur quatre lampes serait donc restée à
16 cmd/s, sans que rien ne rougisse.

⭐ *Un analyseur qui ignore ce qu'il ne sait pas lire ressemble à un analyseur qui n'a rien trouvé.*

#### ⚠️ Le risque de cette conception, et ce qui le tient

La table `CADENCE_NOMINALE` **recopie des valeurs qui vivent dans `HueEngine`** — *une seconde
déclaration de la même vérité dérive toujours*, motif payé cinq fois le 2026-08-24. Un essai relit donc
le moteur et exige l'accord **dans les deux sens** : aucune cadence déclarée qui mente, aucun effet
rapide absent de la table.

#### ⭐ La garde de restauration a servi une TROISIÈME fois

Le compte des appels restaurants est passé de 1 à 2 (coups uniques) puis à 3 (solistes) **dans la même
journée**. Les trois fois, il a forcé à *justifier* le nouvel appel au lieu de le glisser. Il nomme
désormais ses ayants droit un par un. *Une garde qu'on se contente d'ajuster au nouveau chiffre ne
garde plus rien.*

**Ancres** : `src/modules/light/logic/solistesDeLEffet.ts` (+ son essai de non-dérive),
`HueEngine.ts` (le contrôle en tête de `loop`).

**Vérifié** : `tsc -b` propre, **5 150 tests au vert** (408 fichiers, 1 ignoré).
⚠️ **Jamais vu dans la pièce** — et c'est ici que ça compte le plus : *une lampe qui cesse de battre
au profit d'une autre est un changement qui se juge à l'œil, pas au calcul.*

#### ⛔ « Est-ce qu'on a un effet incendie ? » — non, et le Feu n'était pas un feu (2026-09-17)

La question de David a déterré mieux qu'une absence.

⛔ **`candle` et `fire` étaient le MÊME effet.** Corps partagé dans le `switch`, même amplitude (±40),
même fondu, même variance de couleur, même cadence. **La seule différence était la couleur de départ
posée par le pied de page** — `#ffb732` contre `#ff4500`. *« Feu » n'était qu'une bougie orange.*

David, en le découvrant : *« feu de camp, bougie et incendie ce n'est pas la même chose »*.

#### ⭐ Trois feux, et ce ne sont pas trois réglages

Les séparer par la seule amplitude en aurait fait trois curseurs du même effet. **Chacun reçoit donc un
geste qui n'appartient qu'à lui** — c'est le geste qu'on reconnaît, pas l'amplitude :

| | Le geste | Ce qu'on reconnaît |
| --- | --- | --- |
| **Bougie** | elle **manque de s'éteindre** puis repart | *ce qu'on reconnaît d'une bougie n'est pas son tremblement, c'est sa fragilité* |
| **Feu de camp** | il **crépite** — une brindille qui claque | le foyer qui avale et rend de l'air |
| **Incendie** | il **s'embrase**, et il **prend** (socle qui monte sur 2–3 min) | la poutre qui cède |

#### ⭐ L'incendie est ADAPTATIF, pas soliste — et c'est l'inverse du stroboscope

Décision de conception assumée : un incendie est **exactement** le moment où l'on veut *toutes* les
lampes dedans. *Sa nature n'est pas sa vitesse, c'est sa texture* — six lampes qui battent à 600 ms
sans être d'accord entre elles ressemblent davantage à un incendie que deux lampes rapides.

⭐ Cela achève les **trois familles** du module, désormais écrites dans `logic/budgetDuPont.ts` :
**soliste** (l'identité est la vitesse), **adaptatif** (l'identité est la texture), **lent** (déjà sous
le budget).

#### ✅ « Explosion » — elle existait, sous un nom qu'on ne cherche pas

La `Déflagration` construite le matin même **était** l'explosion demandée. Redemandée le soir, donc
introuvable : renommée **Explosion** dans les deux langues, avec l'accord de David. *Une fonctionnalité
qu'on ne trouve pas est une fonctionnalité absente* — deuxième fois que ce dépôt paie cette phrase,
après la recherche invisible du Media Hub.

#### ⛔ Deux fautes commises en chemin, et ce qu'elles enseignent

- ⛔ **La constante du budget avait été écrite DEUX FOIS dans la même journée** — `DEBIT_DU_PONT` dans
  la fusillade, `BUDGET_DU_PONT` chez les solistes, par le même auteur, à deux heures d'écart, **après
  avoir dénoncé ce motif dans les deux fichiers**. ⭐ *Une seconde déclaration de la même vérité dérive
  toujours, et savoir qu'elle dérive n'empêche rien.* Réunie dans `logic/budgetDuPont.ts`.
- ⛔ **Un renommage automatique a visé la mauvaise clé et cassé les deux fichiers de traduction.**
  `"fire"` apparaît **quatre fois** dans `modules.json` — un type de dégâts, un état, l'effet lumineux,
  un libellé de fiche. La recherche a trouvé le premier. ⭐ *Une clé de traduction n'est pas unique dans
  un fichier de mille lignes ; un remplacement doit se donner une portée avant de se donner un motif.*
  Réparé à la main, **sans `git checkout`** : ces fichiers portaient tout le travail du jour.

**Ancres** : `HueEngine.ts` (les trois `case` séparés), `logic/budgetDuPont.ts` (la constante et
`cadencePartagee`), `logic/solistesDeLEffet.ts` (`EFFETS_ADAPTATIFS`).

**Vérifié** : `tsc -b` propre, **5 150 tests au vert** (408 fichiers, 1 ignoré). 46 effets.
⚠️ **Jamais vu dans la pièce** — et les trois feux sont précisément ce qui se juge à l'œil.

#### ⛔ « Je ne vois plus mes lumières » — un panneau sans défilement (2026-09-17, le soir)

David lance GM-OS après la journée d'effets et ne voit plus ses lampes. **Elles n'étaient pas perdues :
elles étaient sous la ligne de flottaison.**

⭐ **L'indice était dans la capture d'écran, et ce n'était pas les lampes.** La phrase du bas du panneau
de gauche — *« La pièce y revient quand un son se termine… »* — était **coupée en plein milieu**. Ce
panneau débordait.

⛔ **La cause, en une phrase.** `LightDashboard` est une grille `grid-cols-12 h-full` ; sa rangée était
en `auto`, donc réglée sur **le plus grand de ses deux enfants**. L'`<aside>` n'avait **aucun
`overflow-y-auto`** : son contenu (pont, intensité, voix, trois actions rapides, éclairage normal et son
explication) dépassait la fenêtre, imposait sa hauteur à la rangée, donc au `<main>` d'à côté — et le
`BulbFooter` sortait de l'écran, coupé par l'`overflow-hidden` du châssis.

⭐ ***Un panneau qui ne défile pas ne cache pas seulement sa propre fin : il déforme ce qui est à côté
de lui.***

#### ⚠️ Pourquoi ça n'était jamais arrivé — et l'hypothèse de David était la bonne

Écran 2880×1800, mais Windows à 200 % : l'application ne voit que **1440×900 points**. *« Cela doit
venir de la résolution de l'écran ? »* — oui. La mise en page tenait à 1080p et ne tenait plus là.
**Aucun test ne pouvait le dire** : ils tournent tous sans fenêtre.

#### Les trois correctifs

| | Où | Pourquoi |
| --- | --- | --- |
| `grid-rows-1` | `LightDashboard` | Vaut `minmax(0, 1fr)` : la rangée fait exactement la hauteur disponible, **aucun enfant ne peut plus la pousser**. *Une hauteur qui se règle sur son contenu n'est pas une hauteur, c'est une promesse que le contenu tiendra.* |
| `overflow-y-auto min-h-0` | `Sidebar` | La cause. Le panneau défile au lieu de déborder |
| `shrink-0` | `BulbFooter`, état vide | ⚠️ Trouvé en cherchant : le message « aucune lampe » était le seul du module à pouvoir être écrasé à zéro — *le message qui dirait ce qui ne va pas est justement celui qui disparaîtrait*, et on chercherait la panne ailleurs |

#### ✅ Le défaut était unique — vérifié, pas supposé

Balayage de tous les `.tsx` des modules à la recherche du motif « `col-span-*` + `h-full` sans
`overflow` » : **un seul autre cas**, une boîte vide en pointillés de `ClockDashboard` dont le contenu
tient sur deux lignes. *Pas d'instance dormante ailleurs.*

⚠️ **Ce qui reste vrai** : rien ne garde ce genre de défaut. `tsc` et les 5 150 essais tournent **sans
fenêtre** — une mise en page qui déborde ne les fera jamais rougir. Le seul filet possible serait un
essai Playwright qui **redimensionne la fenêtre** et exige que le pied de page reste visible. Non fait,
et c'est le candidat évident si le motif revient.

**Ancres** : `src/modules/light/LightDashboard.tsx`, `components/Sidebar.tsx`, `components/BulbFooter.tsx`.

**Vérifié** : `tsc -b` propre, **5 150 tests au vert** (408 fichiers, 1 ignoré).
✅ **Confirmé à l'écran le 2026-09-17** — *indirectement, mais sûrement* : David a jugé les trois
feux depuis les tuiles, ce qui suppose le sélecteur d'effet du pied de page — précisément ce que le
débordement lui avait pris.

#### ⛔ « Feu de camp et incendie sont pareil » — ils l'étaient (2026-09-17, le soir)

Première version des trois feux, vue à l'écran par David : **deux d'entre eux étaient indiscernables.**

**Pourquoi**, relevé dans le code plutôt que supposé :

| | Feu de camp | Incendie |
| --- | --- | --- |
| Couleur de départ | `#ff4500` | `#ff5a00` — **quasi la même** |
| Palette | ambre ±0,035 | 6 braises, dont **4 proches de `#ff4500`** |
| Embrasement | 6 % vers un blanc chaud | 7 % vers un blanc chaud — **identique** |
| Amplitude | ±70 | ±90 — *28 % d'écart, invisible sur une lampe* |

⛔ **Et pire** : le socle de l'incendie partait à **110** et montait sur une minute. Pendant les vingt
premières secondes, **l'incendie était plus sombre qu'un feu de camp** — dont la base est la brillance
courante de la lampe, souvent 200 et plus. *L'idée du « feu qui prend » coûtait précisément le moment
où on le déclenche.* Supprimée.

#### ⭐ La faute n'était pas dans les réglages, elle était dans le mécanisme

Les deux effets tiraient **la brillance et la couleur indépendamment, au hasard**, autour d'un orange.

⭐ ***Deux bruits aléatoires autour d'une même teinte donnent le même résultat visuel, quelles que
soient leurs amplitudes.*** J'avais réglé des curseurs là où il fallait changer de principe — et j'avais
écrit dans le commentaire que les trois feux « ne sont pas trois réglages » tout en n'en faisant que ça.

**Le principe qui les sépare** : dans une flamme réelle, la brillance et la couleur ne sont pas deux
variables, c'en est **une seule** — la température. Le cœur est éclatant **et** blanc-jaune ; la fumée
qui retombe est sombre **et** rouge sang. `logic/echelleDuFeu.ts` porte cette corrélation, et
l'incendie ne tire plus qu'une seule valeur.

Le feu de camp, lui, **tient sa bande** (75–175) et ne monte jamais au blanc. *Deux amplitudes
différentes autour de la même moyenne ne se distinguent pas ; deux bandes séparées, si.*

#### L'essai qui garde le mécanisme, pas le réglage

`echelleDuFeu.test.ts` exige notamment que **la table des teintes monte vraiment** du sombre au clair.
⚠️ *Mélanger cette table ne casserait rien d'autre* — aucune erreur, aucun autre essai rouge, juste du
bruit orange qui ressemble à un feu de camp. **C'est exactement le défaut d'origine, et rien ne le
voyait.** Plus un essai de séparation des bandes, mesuré sur 20 000 tirages.

#### ⛔ Trois fois le même piège dans la journée : un repère qui n'est pas unique

En remplaçant le bloc des deux feux, mon marqueur de fin — `/*` — a attrapé un commentaire **à
l'intérieur du cas `lightning`** et a amputé cet effet. Récupéré par `git show HEAD:`.

C'est la **troisième** fois de la journée :

| Le repère | Ce qu'il a cassé |
| --- | --- |
| `// Apply global brightness` | Présent **deux fois** dans `HueEngine` : la tranche examinée par un essai était vide, **deux règles passaient au vert sans rien examiner** |
| `"fire"` | Présent **quatre fois** dans `modules.json` : un renommage a visé un *type de dégâts* et cassé les deux fichiers de traduction |
| `/*` | Présent partout dans un dépôt aussi commenté : a amputé `case 'lightning'` |

⭐ ***Un repère choisi pour sa lisibilité n'est pas un repère choisi pour son unicité.*** Dans ce dépôt,
où tout est commenté et nommé en clair, la lisibilité rend les repères **moins** uniques, pas plus.

**Ancres** : `src/modules/light/logic/echelleDuFeu.ts` (+ ses 8 essais), `HueEngine.ts` (`case 'fire'`,
`case 'incendie'`).

**Vérifié** : `tsc -b` propre, **5 158 tests au vert** (409 fichiers, 1 ignoré).
⚠️ Un premier passage avait rendu **3 erreurs de collecte** et trois fichiers non exécutés ; le passage
suivant est intégralement vert. *C'est la fragilité connue des workers sous charge, pas une régression —
mais elle mérite d'être dite plutôt que tue.*
✅ **CLOS à l'écran le 2026-09-17** — David, après relance : *« ca fonctionne »*.

#### ⛔ « Je ne suis pas convaincu par tous » — deuxième audit, mesuré (2026-09-17, tard)

David après avoir essayé **tout le catalogue** : *« je ne suis pas convaincu par tous, par exemple
respiration, ou alors explosion ne dure pas assez longtemps et à la fin cela doit devenir noir »*.

⭐ **Ses deux exemples étaient littéralement dans le code.** Cette fois l'audit a été fait par un
script qui mesure, pas par une relecture qui juge.

| Effet | Ce qui n'allait pas, mesuré |
| --- | --- |
| **respiration** | période réelle **41,9 s** — un souffle humain en dure 4 à 5 |
| `underwater` | **62,8 s** ; à l'œil, une lampe immobile |
| `radiation`, `arcane` | 18,8 s chacun, même formule |
| `zen` | **377 s** pour ±30 de brillance — 0,5 point par seconde, *l'œil s'adapte plus vite* |
| `foret-profonde` | 251 s **et** deux verts (`#064e3b`/`#14532d`) que rien ne distingue : deux immobilités qui s'additionnaient |
| **explosion** | **1,54 s**, et sa fin **rendait à la lampe l'état d'avant** — donc la lumière revenait |
| `trou-noir` | fondu de **2 s** pour un battement de 1 s : *le fondu n'était jamais vu* |
| `candle` | partait de la brillance de la lampe — sur une lampe à 254, **une bougie qui éclaire la pièce** |

#### ⭐ La faute commune : l'effet empruntait son niveau à la lampe

Neuf effets partaient de `baseBri`, **la brillance courante**. Or le pied de page n'amorce que la
*couleur* avant de lancer un effet, jamais la brillance. Conséquence chiffrée sur `respiration` :

| Lampe à | Part du cycle collée au plafond de 254 |
| --- | --- |
| 150 | 0 % |
| 200 | **31,8 %** |
| 254 | **50 %** |

⭐ ***Un effet qui part de la brillance courante n'a pas une forme, il en a autant qu'il y a de
lampes.*** La règle posée : **l'effet possède sa forme, le curseur possède son niveau.** Chaque effet
déclare sa bande absolue ; l'intensité de la tuile et la brillance globale s'appliquent par-dessus,
dans `brillanceEffective`, et nulle part ailleurs. `baseBri` **n'existe plus** dans la boucle — et un
essai empêche son retour.

⚠️ `baseXy` reste, et la différence n'est pas une nuance : *la couleur est choisie pour l'effet avant
qu'il démarre ; elle n'est pas empruntée à ce que la lampe faisait avant.*

#### ⭐ La seconde faute : une période qu'on ne peut pas relire

`Math.sin(tick * 0.3)` avec un `interval` posé vingt lignes plus bas. ⭐ ***« 0,3 » ne ressemble pas à
quarante secondes*** — et aucun essai ne pouvait le voir, puisque **rien dans ce code ne ressemblait à
une durée**. Quatre souffles vivent maintenant dans `logic/souffle.ts`, en millisecondes lisibles, avec
une asymétrie inspire/expire : *une sinusoïde monte et descend au même rythme, aucun être vivant ne
fait ça.*

Et c'est **moins cher** : des images-clés au lieu d'une courbe échantillonnée. Deux commandes par
cycle au lieu de vingt, `transitiontime` faisant la rampe. *Le pont est médiocre en stroboscopie et
excellent en rampe.*

#### ⭐ Trois fins d'effet, et non deux

`stopSoftwareEffect` prenait un **booléen**. Il y a trois fins : ne rien poser, rendre l'état d'avant,
**éteindre**. Le noir final de l'explosion n'avait nulle part où s'écrire — et `bri: 0` n'éteint pas
une Hue, seul `on: false` le fait. Le type `FinDEffet` les nomme. *Un booléen à deux valeurs pour trois
intentions, c'est la faute que ce module a déjà payée quatre fois.*

⚠️ L'explosion dure désormais **7,45 s** et **laisse la lampe éteinte** — décision de David. C'est la
seule fin du catalogue qui oblige le meneur à un geste pour ranimer la lampe ; un essai vérifie qu'elle
est **la seule**. *Une lampe qui ne revient pas doit être une décision, jamais un effet de bord.*

#### ⛔ Trois gardes prises en défaut le même soir

**1. Une règle bornée par une hypothèse.** « Aucun effet ne fond plus longtemps qu'il n'attend »
existait, **limitée à six effets choisis à la main**, avec pour motif écrit qu'apparier chaque fondu à
son battement était *impossible*. ⭐ **C'était une limite supposée, pas mesurée** : il suffit de lire
les affectations dans l'ordre où elles sont écrites. Généralisée, la règle a trouvé seule le
`trou-noir`. *Une garde bornée par une hypothèse ne garde que ce que l'hypothèse laissait passer.*

**2. Une garde neuve qui ne gardait rien.** Le motif censé détecter l'emprunt de brillance s'est écrit
avec un `\b` interprété comme **caractère retour-arrière** — une expression qui cherchait un caractère
de contrôle. Elle est passée au vert sur un moteur où le défaut avait été **remis exprès**.

⭐ ***Une garde neuve qu'on n'a pas vue rougir au moins une fois n'est pas encore une garde.*** C'est
le même défaut que la tranche vide de la veille — *un contrôle qui ne trouve rien ressemble à un
contrôle qui n'a rien à redire* — et il n'a été vu que parce que les deux défauts ont été réintroduits
volontairement pour voir les règles rougir. Un essai d'auto-contrôle met désormais le détecteur à
l'épreuve à chaque passage.

**3. Un repli devenu faux.** L'analyseur de cadences supposait *« pas de nombre écrit ⇒ 250 ms par
défaut »* — vrai jusqu'au jour où une cinquième façon d'écrire une cadence est apparue. Il a dénoncé
quatre effets lents comme s'ils noyaient le pont. *Un repli est une supposition écrite une fois pour
toutes ; il vieillit comme tout le reste.* On ne l'a pas assoupli : on lui a appris la famille, et il
va lire les vraies valeurs **à la source**.

**Ancres** : `logic/souffle.ts`, `logic/deflagration.ts`, `logic/echelleDuFeu.ts`
(`BANDE_DE_LA_BOUGIE`), `HueEngine.ts` (`FinDEffet`, et la disparition de `baseBri`),
`catalogueDesEffets.test.ts` (les deux règles générales).

**Vérifié** : `tsc -b` propre, **5 191 tests au vert** (411 fichiers, 1 ignoré), dont **197 sur
Light-OS**. Les deux nouvelles règles ont été **vues rougir** sur des défauts réintroduits exprès.
⚠️ **À confirmer à l'écran** : dix effets ont changé de geste, et *ce qui sort vraiment des lampes
reste hors de portée de tout test*.

#### ⚠️ Ce qui reste ouvert sur Light-OS

- ✅ ~~Le budget global n'est tenu que par la fusillade~~ — **CLOS le 2026-09-17 par les solistes**,
  voir ci-dessus. ⚠️ Reste vrai : *le budget est raisonné effet par effet*. Deux effets rapides
  **différents** joués en même temps se partageraient mal les dix commandes — cas rare (une scène joue
  d'ordinaire un seul effet), non traité, à regarder si ça se voit.
- ⚠️ **`applyXyVariance` s'applique après le calage de gamut** (huit effets).
- ⚠️ **Le type d'ampoule n'est jamais lu** — une Hue blanche recevant un `xy` renvoie une erreur.
- ⚠️ **`bri: 0` n'éteint toujours pas** : le curseur global à zéro ne fait pas ce que son propre test
  dit qu'il fait. ✅ Le chemin existe désormais (`FinDEffet: 'eteindre'`), mais **le curseur ne
  l'emprunte pas** — c'est un geste à part, non fait.
- ⚠️ **Les sinusoïdes restantes n'ont pas été touchées, et c'est délibéré** : `aurore` (157 s),
  `abysses` (126 s), `passerelle` (126 s), `neant` (94 s), `alien` (63 s). *Leur geste est ailleurs* —
  un cycle de couleurs, un scintillement, un clignotement — et la brillance n'y est qu'une décoration.
  ⭐ **Lent est une intention ; imperceptible est une panne** : seuls `zen` et `foret-profonde`
  tombaient du mauvais côté, parce qu'ils n'avaient **aucun** autre geste.
- ⚠️ **L'explosion coûte 5 cmd/s le temps de son flash** (200 ms). Au-delà de deux lampes, le pont
  étalera ce flash sur ~100 ms au lieu de le rendre simultané. *Pour un flash c'est supportable ; pour
  une rafale ça ne l'était pas* — d'où la cadence partagée de la fusillade, non appliquée ici.
- ⭐ **Le vrai stroboscope est débloqué, non fait** : `on: false` pour le temps noir ne risque plus de
  laisser une lampe éteinte. À voir dans la pièce d'abord — *les Hue rallument avec une rampe, et à
  10 Hz le remède pourrait être pire que le mal.*

**Ancres** : `src/modules/light/HueEngine.ts` (le `switch` de `loop`), `components/BulbFooter.tsx`
(les listes et `defaultColors`), `src/modules/light/catalogueDesEffets.test.ts`.

**Vérifié** : `tsc -b` propre, **5 098 tests au vert** (405 fichiers, 1 ignoré).
⚠️ **Jamais vu dans la pièce** — six correctifs sur sept touchent ce que l'œil perçoit, et *ce qui
sort vraiment des lampes reste hors de portée de tout test* (catégorie P6).

---

### 78 · ⛔ « Whiteboard OS saccade un peu » — un magasin persisté écrit à CHAQUE `set()` (2026-09-17, nuit)

David, après la soirée d'essais : *« whiteboard os saccade un peu »*. Puis, en apprenant la cause :
*« fais les corrections pour les modules impactés comme Map-OS je suppose ? »* — **l'intuition était
juste, et c'était pire sur la carte.**

#### ⭐ La cause : `partialize` ne décide pas SI l'on écrit, seulement CE QU'ON écrit

Vérifié dans la source installée de Zustand 5.0.12, `node_modules/zustand/esm/middleware.mjs` :

```js
const setItem = () => {
    const state = options.partialize({ ...get() });
    return storage.setItem(options.name, { state, version });
};
api.setState = (state, replace) => { savedSetState(state, replace); return setItem(); };
```

**Il n'y a aucune condition.** Un `set()` qui ne touche qu'un champ volatile sérialise quand même tout
le magasin et l'écrit sur le disque.

⛔ **Et deux modules avaient écrit la croyance inverse, noir sur blanc :**

| Fichier | Ce qu'il affirmait |
| --- | --- |
| `useWhiteboardStore` | *« Les persister causerait des écritures localStorage haute fréquence »* |
| `useMapStore` | *« Projections are NOT persisted to avoid massive performance drops during real-time movement »* |

Les deux avaient retiré des champs de `partialize` **en croyant supprimer l'écriture**. Elle avait lieu
quand même — elle emportait simplement les tracés et les pions à la place.

⭐ ***Une optimisation qui vise la charge quand le coût est la fréquence ne réduit rien ; elle
rassure.*** Et elle laisse derrière elle un commentaire qui décourage de chercher au bon endroit.

#### Ce que ça coûtait, mesuré

Coût du seul `JSON.stringify`, **par mouvement de souris**, sur un tableau blanc :

| Tracés | Points | Par écriture | Charge |
| --- | --- | --- | --- |
| 10 | 600 | 0,08 ms | 15 Ko |
| 40 | 3 200 | 0,38 ms | 77 Ko |
| 100 | 12 000 | **1,75 ms** | 285 Ko |
| 200 | 30 000 | **4,18 ms** | 710 Ko |

Le `localStorage.setItem`, **synchrone et bloquant**, s'ajoute par-dessus. ⭐ *Le coût est proportionnel
à ce qui est déjà dessiné* — d'où « saccade **un peu** » : ça empire à mesure que le tableau se
remplit, et ça repart à neuf quand on l'efface.

⛔ **Sur la carte, c'était trois écritures par mouvement** : `updateToken` faisait **deux** mutations
(les pions, puis les zones de danger rattachées), et `syncToPlayers` en ajoutait une troisième en
projection.

#### ⭐ On payait pour ce que personne ne recevait

`CrossWindowEventService` **jette déjà** toute mise à jour du tableau arrivant moins de **50 ms** après
la précédente (`WB_THROTTLE`). Le réseau ignorait donc environ quatre points sur cinq — mais le magasin
les avait tous sérialisés, écrits sur le disque et notifiés à ses abonnés.

⭐ ***Une limitation posée à l'arrivée ne fait pas d'économie : elle jette du travail déjà payé.***

#### Les trois correctifs

| | Où | Ce que ça change |
| --- | --- | --- |
| **Écriture différée** | `utils/ecritureDifferee.ts` | une seule écriture par fenêtre de **250 ms**, pour les **huit** magasins qui passent par `stockageLocalDuMJ` |
| **Diffusion limitée** | `utils/limiteurDeCadence.ts` + les deux canevas | le tracé et le laser ne partent qu'à la cadence que le réseau consomme déjà |
| **Une mutation au lieu de deux** | `useMapStore.updateToken` | le pion et sa zone rattachée voyagent ensemble |

⭐ **Fenêtre fixe, et surtout pas un « debounce ».** Repousser l'échéance à chaque modification serait
un piège : pendant un glissement de pion de dix secondes, les modifications ne s'arrêtent jamais, donc
**l'écriture n'aurait jamais lieu**. Ici la première modification arme la fenêtre et les suivantes s'y
agglutinent — *le pire cas est borné, et c'est ce qu'on veut d'un dépôt qui a perdu ses campagnes deux
fois.*

Trois filets forcent l'écriture avant la disparition de la fenêtre : `beforeunload`, `pagehide`, et
`visibilitychange` → caché. ⚠️ **Les campagnes ne passent pas par ce chemin** (`PersistenceService`,
IndexedDB) : on y risque au pire un quart de seconde d'un déplacement de pion.

#### ⛔ Un essai de l'an dernier a arrêté un défaut de cette nuit

`persistanceEntreFenetres.test.ts` est devenu rouge — et il avait **raison sur le fond, pas seulement
sur le calendrier**. Mon tampon était posé **au-dessus** du refus d'écriture des fenêtres secondaires :
il acceptait la valeur interdite, la gardait, et **la servait en lecture** pendant 250 ms. Une fenêtre
secondaire qui se réhydrate y aurait relu **sa propre vue partielle** au lieu de celle du MJ — soit
exactement le dégât que cette garde existe pour empêcher.

⭐ ***Ce qui n'a pas le droit d'être écrit n'a pas le droit d'être lu comme s'il l'avait été.*** Le
refus est désormais posé **avant** le tampon, et celui du dessous reste : les deux étages ne se
doublent pas, ils gardent deux chemins — le tampon et le disque.

#### La garde qui aurait crié en septembre

`utils/ecritureHauteFrequence.test.ts` compte les appels à `localStorage.setItem` pendant cent points
d'un trait et cent pas d'un glissement de pion. ⚠️ **Il ne mesure pas une durée** — *un essai qui mesure
une durée devient rouge sur une machine chargée* — il compte les écritures, et elles ne dépendent pas
de la machine.

**Vu rougir** : les deux défauts ont été réintroduits exprès, cinq essais sur sept sont passés au
rouge. *Une garde neuve qu'on n'a pas vue rougir au moins une fois n'est pas encore une garde* — la
leçon de la veille, appliquée le jour même.

#### ⚠️ Ce qui reste ouvert

- **Ce qui n'est pas attrapé** : une coupure de courant ou un plantage du processus perd au pire
  250 ms. Aucun filet ne couvre ça, et c'est assumé.
- **Le redessin du canevas reste complet à chaque point** — il efface et redessine tous les tracés.
  C'est du travail `canvas`, pas du disque, donc bien moins cher ; *mais c'est le prochain coût si la
  saccade persiste sur un très grand tableau.*
- **`syncToPlayers` part à chaque mouvement de pion en projection.** L'écriture est différée, mais la
  diffusion, elle, ne l'est pas. Non traité, à regarder si la projection saccade.
- ⚠️ **Les autres magasins persistés n'ont pas été audités un par un.** Le balayage a cherché les
  écrivains à fréquence de doigt (`onMouseMove`, `onPointerMove`, `requestAnimationFrame`) : les seuls
  trouvés sont le tableau blanc et la carte. Les boucles d'animation d'Ambient-OS écrivent de l'état
  React local, pas un magasin.

**Ancres** : `src/utils/ecritureDifferee.ts`, `src/utils/limiteurDeCadence.ts`,
`src/utils/ecritureReserveeAuMJ.ts` (`viderLesEcrituresDifferees`, les filets),
`src/modules/map/useMapStore.ts` (`updateToken`), `whiteboard/components/DrawingCanvas.tsx` et
`PlayerDrawingCanvas.tsx`.

**Vérifié** : `tsc -b` propre, **5 216 tests au vert** (414 fichiers, 1 ignoré).
⚠️ **À confirmer à l'écran** : c'est David qui a senti la saccade, c'est lui qui peut la clore.

---

### 79 · ⭐ « Les dés en 3D sont affreux » — quatre manques, dont trois ne se règlent pas (2026-09-17, nuit)

David : *« lorsque je jette les dés et que je projette sur Player Hub, les dés en 3D sont affreux »*.
Puis, à la question de la direction visuelle : *« est-ce que je peux choisir le style ? Résine / Verre
ou Métal ? »* — les trois existent désormais, au choix du meneur.

#### ⛔ Ce qui n'allait pas, et pourquoi aucun réglage n'y pouvait rien

| | Ce qu'il y avait |
| --- | --- |
| **Aucun chiffre** | des solides colorés nus avec un liseré blanc — *un dé sans chiffres n'est pas un dé* |
| **L'atterrissage tiré au sort** | `Math.round(Math.random() * 4) * Math.PI / 2` : la face du dessus n'avait **aucun rapport** avec le résultat du jet |
| **Du verre sans rien à réfracter** | `transmission: 0.7`, `roughness: 0.05`, et **ni carte d'environnement ni fond** |
| **Un d100 sphérique** | `SphereGeometry(1.4, 32, 32)` — *une sphère n'est pas un dé* |

⭐ ***Un matériau physique sans environnement n'a rien à réfléchir : il rend du gris.*** La transmission
échantillonne ce qu'il y a derrière l'objet ; derrière, il n'y avait rien. Les deux réglages les plus
coûteux de la scène ne produisaient donc qu'un aplat laiteux — *plus le rendu se voulait physique, plus
il était plat.* S'y ajoutaient une ambiante à 1,2 et une hémisphérique à 1,0 qui, ensemble,
**suppriment le relief**.

#### ⛔ Deux défauts de plus, trouvés en chemin

**1. Le nettoyage détruisait des ressources partagées.** Le démontage appelait `dispose()` sur les
géométries **déclarées au niveau du module**. Au remontage suivant — un simple aller-retour de
projection — elles étaient mortes et plus rien ne s'affichait. ⭐ *Ce qui est partagé par tous ne se
libère pas par un.*

**2. Le d10 n'était pas un trapézoèdre.** Ses « coordonnées standard » (pôles à `1,5 r`, anneau à
`0,5 r`) rendent chaque cerf-volant **plié** : le solide avait **vingt** facettes au lieu de dix. Et les
cinq du bas étaient **enroulées à l'envers**, ce que le code compensait par `side: THREE.DoubleSide`,
commenté *« Safety for visibility »* — *une rustine qui décrivait le symptôme sans nommer la cause.*

⭐ ***Un dé n'a de faces que le jour où on veut écrire dessus.*** Rien ne regardait les faces
auparavant ; rien ne pouvait donc voir que le solide n'en avait pas. La condition de planéité, résolue
plutôt que devinée, donne un rapport exact : `hPôle / hAnneau = 5 + 2√5 ≈ 9,472`.

#### ⭐ On ne réécrit pas les coordonnées, on regroupe par face

Poser des chiffres demande de connaître les **faces**, or three.js ne livre que des **triangles** : un
dodécaèdre arrive en 36 triangles, pas en 12 pentagones. Le réflexe serait de retaper à la main les
sommets des solides de Platon — ⭐ *exactement le genre de table qu'on recopie mal une fois sur deux, et
dont l'erreur ne se voit que sur un dé, en séance.*

On prend donc les géométries de la bibliothèque et on **regroupe leurs triangles par normale**. Le seul
solide écrit à la main reste le d10, et il est désormais couvert par les mêmes essais que les autres —
*c'est lui qui était faux.*

**La numérotation suit la règle des vrais dés** : deux faces opposées font `n + 1`. Sur un dé posé on
voit la face du dessus *et* ses flancs ; un 20 collé à un 19 se remarque. ⚠️ Le d4 en est exempté, et
c'est correct : *le tétraèdre n'a pas de faces opposées.*

#### Ce qui change à l'écran

- **Des chiffres**, peints dans la couleur du dé pour que le contraste survive au code couleur ; les
  `6` et les `9` sont soulignés — *posés sur une table, c'est le même dessin.*
- **Le dé se pose sur sa valeur** : on amène la normale de la face qui porte le résultat vers le ciel,
  avec un lacet aléatoire pour que deux dés ne se figent pas pareil.
- **Une carte d'environnement** (`RoomEnvironment` + `PMREMGenerator`), une ambiante basse, une
  lumière-clé qui porte une ombre, et un **sol qui ne reçoit que l'ombre** — *sans contact au sol, des
  dés « posés » flottent dans le vide.*
- **Des murs invisibles** : *un dé qui sort du cadre est un dé qu'on n'a pas vu tomber.*
- **Un vrai d10** pour le d100, qui compte par dizaines de `00` à `90`.
- **Trois matières au choix** — résine, verre, métal — dans les réglages du pupitre, le sélecteur
  n'apparaissant que si la 3D est active. ⚠️ **Le code couleur ne bouge pas avec le style** : *un style
  est une matière, pas une signification.*

#### ⚠️ Deux pièges nommés dans le code

- **La couleur du dé est peinte DANS la texture**, et le matériau reste blanc. Sinon il faudrait
  multiplier la texture par la couleur — *et un chiffre clair multiplié par un dé coloré cesse d'être
  clair*, alors que cette couleur porte une information (critique, équipement).
- **Le remplissage des UV ne peut pas dépasser 0,5**, et ce n'est pas un curseur de confort : au-delà,
  les sommets débordent dans la case voisine et le dé afficherait des morceaux du chiffre d'à côté. Le
  code refuse la valeur plutôt que de la tolérer.
- **`val` n'est pas toujours un nombre** — les dés Fate rendent un symbole. Un dé dont la valeur n'est
  pas lisible sur son solide se pose sur une face au hasard : *un dé qui ne sait pas quoi montrer doit
  quand même finir sa chute.*

#### ⚠️ Ce qui reste ouvert

- **Le verre est le plus risqué des trois.** La transmission a maintenant un environnement à réfracter,
  mais le fond du rendu reste **transparent** par nécessité — il se superpose au Hub. À juger à l'écran.
- **La physique reste artisanale** : gravité, rebond amorti, murs. Pas de collision entre dés — *deux
  dés peuvent se traverser.* Aucune bibliothèque de physique n'est installée, et en ajouter une pour ça
  serait cher.
- **Le d4 montre sa face du dessus**, alors qu'un vrai d4 se lit au sommet. Simplification assumée.
- **Rien de tout ceci n'est vérifiable par un essai** au-delà de la géométrie : *ce qui sort de la carte
  graphique est hors de portée*, comme les lampes (catégorie P6).

#### ⛔ Deuxième passe : « je ne vois aucune différence entre résine / verre / métal »

David, après avoir essayé : *« ok c'est mieux, sauf que d'une part je voudrais que les dés soient
placés devant la fenêtre de résultat. Deuxièmement je ne vois aucune différence entre résine / verre /
métal »*.

**Il avait raison, et ce n'était pas une affaire de matériau.**

##### ⭐ Le réglage n'arrivait jamais au Hub

Le segment `dice` du synchroniseur portait **trois** champs sur les cinq nécessaires :

```ts
payload.dice = { lastRoll: s.lastRoll, isDiceProjected: s.isDiceProjected, projectionTrigger: s.projectionTrigger };
```

Ni `enable3D` ni `styleDesDes` ne partaient. Le Player Hub gardait donc la valeur lue dans
`localStorage` **à son démarrage**, et rien ne pouvait la changer tant qu'il restait ouvert.

⚠️ **`enable3D` était dans ce cas depuis toujours** : la case « Rendu 3D » du pupitre ne faisait rien
sur un hub déjà ouvert. *Le choix de matière n'a pas créé le défaut, il l'a rendu visible.*

⭐ ***Un réglage qui ne voyage pas jusqu'à l'écran qui l'applique n'est pas un réglage : c'est un
bouton.*** Même famille que les six « le chemin s'arrête avant le moteur » du pupitre de dés, et que les
trois champs manquants du segment du tableau blanc le 2026-09-05.

⛔ **Et le segment était écrit DEUX FOIS** — un littéral pour l'envoi rapide, un autre pour l'envoi
complet. *Une seconde déclaration de la même vérité dérive toujours.* Les deux passent désormais par
`segmentDesDes`, dont le **type de retour** rend un oubli impossible à compiler.

⚠️ Le type ne peut rien contre la duplication, elle : un littéral anonyme affecté à
`Record<string, unknown>` n'oblige à rien. **Seul un essai qui lit la source voit qu'on a recommencé à
côté** — il existe, et il a été **vu rougir** sur le littéral réintroduit exprès.

##### ⭐ Les dés étaient enfermés dans une couche

Le composant demandait `z-[65]`, mais son parent portait `z-[60]`, et `z-index` crée un **contexte
d'empilement**. ⭐ ***Un élément ne peut pas sortir de l'ordre de peinture de son parent*** — ce
`z-[65]` ne décidait donc rien, et les dés passaient sous le panneau de résultat (`z-[70]`).

C'est le même piège que le menu du Media Hub qui passait sous les vignettes. ⚠️ L'enveloppe était en
plus **redondante** avec le composant (tous deux `fixed inset-0 pointer-events-none`) : *deux couches
qui disent la même chose, et c'est celle du dessus qui décide.* Retirée ; les dés sont en `z-[80]`.

**Le panneau ne s'atténue plus** (il tombait à 40 % quand la 3D était active) : cette atténuation
existait **pour laisser voir les dés derrière lui**. Les dés passant devant, sa raison a changé de camp
— *et un panneau pâle sous des dés opaques serait le pire des deux mondes.* Décision de David.

##### Les trois matières s'écartent vraiment

Elles se ressemblaient aussi trop pour être reconnues d'un coup d'œil. Elles diffèrent maintenant sur
les trois axes que l'œil lit en premier :

| | Métal | Transmission | Rugosité |
| --- | --- | --- | --- |
| Résine | 0 | 0 | **0,55** — mate, sous un vernis net |
| Verre | 0 | **0,92** + atténuation teintée | 0,02 |
| Métal | **1** | 0 | **0,14** — reflets nets |

⚠️ **Le métal était à 0,28 de rugosité, et c'est pour ça qu'il ressemblait à du plastique** : *ce qui
dit « métal » à l'œil, ce n'est pas la couleur, c'est la netteté du reflet.* Et le verre reçoit une
**atténuation teintée** par la couleur du dé, sans quoi la transmission lave cette couleur — *or elle
porte une information* (critique, équipement), pas une décoration.

⭐ ***Deux matériaux qui ne diffèrent que par une décimale de rugosité sont le même matériau*** — la
leçon des trois feux de Light-OS, transposée. Un essai exige désormais que chaque paire s'écarte d'au
moins 0,3 sur un de ces axes.

**Ancres** : `src/modules/remote/segmentDesDes.ts` (+ ses essais), `types/remote.types.ts` (le contrat
`dice`), `useNexusSynchronizer.ts` (les deux chemins), `PlayerHub.tsx` (la couche retirée),
`HubDiceDisplay.tsx`, `logic/stylesDeDes.ts`.

**Vérifié** : `tsc -b` propre, `vite build` propre, **5 275 tests au vert** (416 fichiers, 1 ignoré).
Les gardes du segment ont été **vues rougir** sur un littéral réintroduit exprès.
⚠️ **À confirmer à l'écran** — et ⚠️ **le Hub doit être rouvert une fois** pour que la correction du
transport prenne effet sur une fenêtre déjà lancée avant elle.

#### ⭐ Troisième passe : les dés s'effacent, le résultat reste

David : *« les dés doivent disparaître et le résultat doit rester affiché 5 secondes supplémentaires
après »*.

⛔ **L'ancien déroulé n'avait qu'une durée** : `setTimeout(() => setShowDice(false), 5000)` au lancer,
et **tout** disparaissait ensemble. Or le panneau n'apparaît qu'au bout de 1,5 s quand la 3D est
active : *il restait trois secondes et demie pour lire un résultat*, pendant que les dés finissaient de
rouler par-dessus.

##### ⭐ La pose est un événement, pas une durée

Combien de temps met un jet à se poser ? *Ça dépend* — du nombre de dés, des rebonds, du hasard des
vitesses initiales. Une durée fixe couperait les dés en plein vol, ou les laisserait posés à ne rien
faire. **C'est donc la scène 3D qui signale la pose**, et le compte de cinq secondes part de là.

##### ⛔ Un signal qu'on attend doit toujours avoir une échéance

*Un destinataire sans expéditeur ne lève aucune erreur : il attend* — ce dépôt l'a payé sur la tablette,
qui guettait un `dice:result` que personne n'émettait. Il y a donc **deux filets** :

| | Ce qui se passe |
| --- | --- |
| Player Hub, 3D active | les dés se posent vers 2,5 s → le résultat tient jusqu'à ~7,5 s |
| Tablette, ou 3D coupée | personne ne signale → **la fenêtre reste celle d'avant, 5 s** |
| Un dé qui ne se pose jamais | la scène déclare la pose d'office à 4 s ; et même sans elle, le compte armé au lancer ferme |

⭐ ***Un filet qui dégrade vers le comportement existant ne peut pas surprendre*** : au pire, on
retrouve ce qu'on avait. Le compte est **armé dès le lancer** et le signal de pose ne fait que le
*redémarrer* — c'est ce qui rend l'absence de signal inoffensive.

##### ⚠️ Un piège nommé dans le code

Le drapeau « les dés sont posés » se réarme sur **l'identifiant du jet**, pas sur `showDice`. Deux jets
successifs pendant la même fenêtre d'affichage ne font pas repasser `showDice` par `false` : s'y fier
laisserait *le second jet sans dés, sans que rien ne le dise.*

**Ancres** : `src/modules/dice/logic/choregraphieDuJet.ts` (+ ses essais), `DiceBox3D.tsx` (`onRepos`
et son plafond), `useHubSync.ts` (`signalerLesDesPoses`), `PlayerHub.tsx`.

**Vérifié** : `tsc -b` propre, **5 285 tests au vert** (417 fichiers, 1 ignoré). Les essais de
branchement ont été **vus rougir** sur trois câblages défaits exprès.
⚠️ Les essais **ne mesurent pas le temps** — *un essai qui mesure une durée devient rouge sur une
machine chargée* : ils vérifient les valeurs déclarées et le branchement.

#### ⭐ Quatrième passe : les dés ne se traversent plus, et ils restent posés deux secondes

David : *« est-ce que tu peux faire en sorte que les dés ne s'imbriquent pas les uns dans les autres, et
est-ce que tu peux les laisser visibles 2 secondes de plus ? »*

##### ⛔ Les dés ne se voyaient pas entre eux

La chute ne connaissait que **le sol et les murs**. Deux dés lancés au même endroit se traversaient et
finissaient posés l'un DANS l'autre — *la seule chose qu'un vrai dé ne fait jamais.*

Aucun moteur physique n'est installé, et en ajouter un pour ça coûterait bien plus que le problème. On
approche donc chaque dé par une **sphère**, et tout se joue sur son rayon :

| Rayon | Ce que ça donne |
| --- | --- |
| **inscrit** | les coins continuent de se traverser |
| **circonscrit** | les dés se repoussent de loin, avec un vide visible |
| **la moyenne des deux** | un léger jeu, jamais d'imbrication |

⭐ ***Quand la demande est « qu'ils ne s'imbriquent pas », une petite distance vaut mieux qu'un contact
parfait*** : l'erreur penche du côté qui ne se voit pas. ⚠️ La moyenne se calcule **par solide** — 79 %
du rayon circonscrit sur un cube, 90 % sur un icosaèdre : *une constante unique aurait été fausse pour
cinq dés sur six.*

⚠️ **La séparation s'applique aussi aux dés POSÉS**, et c'est le point : un dé qui vient se poser contre
un autre déjà immobile doit encore être repoussé. La limiter aux dés en vol laisserait précisément
l'imbrication finale — *celle qu'on voit.*

##### ⛔ Et ils naissaient déjà imbriqués

L'écart de départ **rétrécissait** quand les dés étaient nombreux : `Math.min(3, 13 / n)`. À dix dés il
tombait à **1,3 — moins que la largeur d'un dé.** La séparation aurait eu à défaire un nœud au lieu
d'éviter un contact.

⭐ ***Ce qu'on empêche pendant la chute, il faut d'abord ne pas le créer au départ.*** L'écart est
désormais un **plancher** : quand la rangée déborde du tapis, on passe à la suivante, les rangées sont
égalisées et chacune est centrée.

##### Les deux secondes

Les dés restent **2 s posés** avant de s'effacer, et le compte des **5 s du résultat** part de
l'effacement — la fenêtre de lecture promise reste entière. *Se poser et disparaître dans le même
instant ne laisse pas voir ce qu'on vient de lancer.*

#### ⛔ Deux gardes de plus prises en défaut, et une mutation qui n'avait pas eu lieu

**1. Un repère cherché dans tout un fichier.** L'essai du maintien cherchait
`clearTimeout(maintienRef.current)` **n'importe où** dans `PlayerHub` — or la chaîne existe aussi dans
`auReposDesDes`. Il restait vert alors que l'annulation avait été retirée de l'effet. ⭐ ***Un repère
cherché dans tout un fichier ne dit rien de l'endroit où il compte*** — quatrième fois de la journée
qu'un repère mal situé mord. L'essai examine maintenant **le bloc de l'effet**, et lui seul.

**2. ⛔ Une mutation qui ne s'est jamais appliquée.** En dégradant le code pour vérifier cette garde,
mon `replace` visait un bloc écrit en `\n` dans un fichier en **CRLF** : il n'a rien remplacé, et
`str.replace` ne dit rien quand il ne trouve rien. L'essai est donc passé au vert **sur du code
intact**, en ayant l'air de valider la garde.

⭐ ***Une mutation qui ne s'applique pas rend un essai vert, et ressemble exactement à une garde qui
marche.*** Toute dégradation volontaire doit désormais **vérifier qu'elle a bien eu lieu** avant de
juger l'essai. ⚠️ Ce dépôt a des **fins de ligne mixtes** — `PlayerHub.tsx` est en CRLF, `DiceBox3D.tsx`
en LF : le détecter à chaque édition n'est pas une précaution, c'est une nécessité.

**3. Un essai qui comptait au lieu de mesurer.** La séparation d'un amas était jugée par
`separerLesDes(...) === 0`, c'est-à-dire *aucune inégalité stricte sur des flottants* — il en reste
toujours. Mesuré : après 600 passes sur dix dés empilés, le pire chevauchement vaut **2,2 × 10⁻¹⁶**.
L'amas était parfaitement démêlé et l'essai le déclarait en échec. ⭐ *Un seuil de comptage sur des
flottants mesure l'arithmétique, pas le phénomène.*

**Ancres** : `src/modules/dice/logic/separationDesDes.ts` (+ ses 24 essais),
`logic/choregraphieDuJet.ts` (`DUREE_DE_MAINTIEN_MS`), `DiceBox3D.tsx` (le rayon de collision par
solide, la séparation dans la boucle), `PlayerHub.tsx`.

**Vérifié** : `tsc -b` propre, **5 310 tests au vert** (418 fichiers, 1 ignoré). Les gardes ont été
**vues rougir** sur des dégradations dont l'application a été contrôlée.

**Ancres** : `src/modules/dice/logic/facesDuDe.ts` (+ ses 30 essais), `logic/stylesDeDes.ts`,
`DiceBox3D.tsx` (réécrit), `useDiceStore.ts` (`styleDesDes`), `DiceBoard.tsx` (le sélecteur).

**Vérifié** : `tsc -b` propre, `vite build` propre — l'import `three/examples/jsm` s'empaquette bien —
et **5 264 tests au vert** (415 fichiers, 1 ignoré).
⚠️ **À confirmer à l'écran** : c'est David qui a vu que c'était affreux, c'est lui qui peut le clore.

---

### 80 · ⭐ Le décor de campagne sur le Player Hub — il existait, et rien ne le laissait revenir (2026-09-17, nuit)

David : *« sur le Player Hub, peux-tu, sans qu'il n'y ait conflit, projeter l'image de base de la
campagne lorsque le Player Hub n'affiche rien ? »*

#### ⭐ La fonctionnalité existait déjà — de bout en bout

Avant d'écrire une ligne, la chaîne a été suivie :

| Étape | État |
| --- | --- |
| Le champ | `Campaign.wallpaperUrl` ✅ |
| Le réglage | Formulaire de campagne → **Ambiance Visuelle** → « Définir l'Image de Campagne » ✅ |
| Le transport | `useNexusSynchronizer` le résout et l'envoie dans `session.activeCampaignWallpaper` ✅ |
| La réception | `applySyncPayload` l'applique au magasin de session ✅ |
| L'affichage | `fondDuPlayerHub` retombe dessus quand rien n'est projeté ✅ |

⚠️ **Et sa campagne ouverte en avait une** — vérifié dans sa sauvegarde automatique de 21 h 29 :
« Anges de Feu » porte `m-e8d0ccd6…`, six autres campagnes sur sept n'en ont aucune.

*Il aurait été facile de construire une seconde fois ce qui existait déjà.* Le défaut était ailleurs.

#### ⛔ Quatre chemins écrivaient « éteins l'écran » là où il fallait « plus rien à montrer »

`useHubSync` posait, à **quatre** endroits :

```ts
setLiveImagePath(data || null);
```

Or arrêter une projection envoie une **chaîne vide** (`ImageService.blackout` → `syncHubData('image', '')`).
`'' || null` vaut `null` — et dans ce module `null` veut dire *« écran éteint »*, pas *« rien à
montrer »*. Le décor ne revenait donc **jamais** après la première projection de la soirée.

⚠️ **Le correctif du 2026-09-13 avait traité le chemin qui avait fait mal, pas la règle.** `FULL_RESET`
posait déjà `undefined` — correctement, et un essai le gardait — pendant que les quatre autres chemins
écrivaient `null`. ⭐ *La question « qui d'autre a la même rustine à poser ? » n'avait pas été posée,
et les essais ne pouvaient pas la poser : ils gardaient la fonction, pas ses appelants.*

⭐ ***Une distinction énoncée dans un commentaire et non tenue par une fonction ne survit pas à son
quatrième appelant.*** Elle vit désormais dans `imageApresMessage`, et les quatre y passent.

#### ⭐ Les deux gestes, tranchés par David

Il a demandé à **garder les deux** : *« oui, garder les deux gestes »*.

| Geste | Ce qu'il fait |
| --- | --- |
| Arrêter une projection, **`Ctrl+0`** | le Hub rend l'**image de la campagne** |
| **`Ctrl+Maj+0`**, et les deux boutons « Éteindre l'écran » d'Image-OS | l'écran des joueurs devient **noir** |

⭐ ***Deux intentions qui produisent le même pixel ne sont pas la même intention.*** Les confondre
donnait un écran noir chaque fois qu'on refermait une image.

⚠️ **Les boutons d'Image-OS ont été rebranchés exprès.** Leur infobulle dit « Éteindre l'écran » : avec
le nouveau repos, `blackout()` ne l'aurait plus tenu. *Un bouton dont le libellé cesse d'être vrai est
pire qu'un bouton absent — on cherche la panne ailleurs.*

#### ⛔ Et j'ai écrasé un fichier d'essais existant

En écrivant les nouveaux essais, j'ai **remplacé** `fondDuPlayerHub.test.ts` au lieu de le compléter :
sept essais du 2026-09-13 ont disparu, dont celui qui garde précisément la distinction
`undefined` / `null`. Récupéré par `git show HEAD:`, puis fusionné.

⭐ ***Un fichier « nouveau » se vérifie avant d'être écrit, pas après.*** C'est la même famille que les
repères non uniques de la veille : *une hypothèse commode — « ce fichier n'existe pas encore » — qui
n'a coûté qu'un `git show` parce qu'il était commité.* S'il avait porté du travail non commité, il
aurait été perdu.

#### ⛔ Deuxième passe : « l'image de fond n'apparaît pas quand je lance le Player Hub »

Le premier correctif réglait le **retour** du décor après une projection. Il ne réglait pas son
apparition **au lancement**, et c'est une autre cause.

Le Hub lisait **un seul champ**, `activeCampaignWallpaper` — et c'est le seul des deux à **ne pas être
persisté** :

| Champ | Persisté ? |
| --- | --- |
| `activeCampaignId` | ✅ |
| `campaigns[].wallpaperUrl` | ✅ |
| `activeCampaignWallpaper` | ⛔ **non** |

Au lancement il vaut donc `null`, et il ne se remplit qu'à l'arrivée d'une synchronisation **complète**.
Pendant ce temps l'écran des joueurs reste vide — alors que tout ce qu'il fallait était déjà sur son
disque.

⭐ ***La même vérité était DÉDUITE d'un côté et ATTENDUE de l'autre.*** Le synchroniseur du meneur
écrit `activeCampaign?.wallpaperUrl || …` : il déduit. Le Hub, lui, attendait qu'on la lui envoie.
*Un écran qui attend ce qu'il peut calculer reste vide aussi longtemps que le réseau met à répondre.*

⚠️ **L'envoyé garde la priorité, et ce n'est pas un détail** : il est **déjà résolu** en adresse
utilisable par n'importe quel écran, là où le repli local rend une **référence média** (`m-…`) qui ne se
résout que dans une fenêtre partageant la base du meneur — le Hub et le projecteur, jamais une tablette
servie depuis une autre origine. *Le repli comble une attente, il ne remplace pas le transport.*

**Ancre** : `papierPeintDeLaCampagne` dans `src/components/hub/fondDuPlayerHub.ts`, branché dans
`useHubSync`.

#### ⛔ Troisième passe : j'avais détourné le bouton qu'il utilise (2026-09-18)

David : *« quand j'arrête de projeter sur Player Hub, je tombe sur un écran noir, il ne revient pas sur
l'image de la campagne »*.

Ce n'était plus le défaut d'origine — c'était **ma décision de la veille**. Ayant introduit le « vrai
noir », j'avais rebranché dessus les **deux boutons rouges d'Image-OS**, au motif que leur infobulle
disait « Éteindre l'écran ». Or ce sont précisément ceux qu'il utilise pour **arrêter une projection**.

⭐ ***Un libellé décrit une intention ; un geste quotidien EST une intention.*** Quand les deux se
contredisent, **c'est le geste qui a raison** — on corrige le libellé, on ne détourne pas le bouton.

| Geste | Ce qu'il fait maintenant |
| --- | --- |
| Boutons rouges **TARGET / ALL**, et `Ctrl+0` | arrêtent la projection — **le décor revient** |
| Bouton **NOIR** (lune), et `Ctrl+Maj+0` | éteignent vraiment l'écran des joueurs |

Les infobulles disent désormais ce que font les boutons, et `noirTotalPartout` — resté sans appelant
après la correction — a été retiré plutôt que laissé en place : *une action déclarée et appelée par
personne est une chaîne complète sans bouton au bout.*

⚠️ Un essai garde maintenant l'attribution des trois boutons, **vu rougir** sur le détournement
réintroduit exprès. *C'est la seule chose qui empêche de refaire le même arbitrage six mois plus tard,
pour la même bonne raison.*

**Ancres** : `src/components/hub/fondDuPlayerHub.ts` (`imageApresMessage`),
`src/modules/image/logic/noircirLePlayerHub.ts`, `useHubSync.ts` (les quatre chemins et `BLACKOUT`),
`useRaccourcisDeNavigation.ts` (`Ctrl+Maj+0`), `useImageStore.ts` (`noirTotal`, `noirTotalPartout`).

**Vérifié** : `tsc -b` propre, **5 329 tests au vert** (418 fichiers, 1 ignoré). Les gardes des quatre
chemins ont été **vues rougir** sur un chemin remis à `|| null`, la mutation ayant été contrôlée.
⚠️ **À confirmer à l'écran** — et ⚠️ **six campagnes sur sept n'ont aucune image de fond** : le décor ne
reviendra que sur celles qui en ont une.

---

### 81 · ⭐ Repartir de zéro sur un jeu ou une campagne — et la Forge qui enrichissait ce qu'on croyait effacé (2026-09-18)

David : *« il m'arrive de vouloir recommencer depuis le début la forge d'un système ou d'une campagne,
mais quand je les efface il reste des résidus qui polluent la tentative suivante. Je voudrais un
mécanisme qui me permette de vraiment tout effacer, en faisant attention à ne pas détruire d'autre
chose. »*

#### ⛔ La cause principale n'était pas un oubli — c'était une fonctionnalité qui faisait son travail

Le dossier `docs/systems/<jeu>/` survivait entièrement à la suppression du pilote. Or **la Forge
Système enrichit un corpus existant au lieu de le doubler** — décision du 2026-08-16, et une bonne
décision — et le slug d'un même nom de jeu retombe sur le même dossier.

Supprimer le pilote puis reforger le même jeu ne repartait donc **jamais** de zéro : la tentative
d'avant était toujours là, mélangée à la nouvelle, sans que rien ne le dise.

⭐ ***La pollution n'était pas un résidu oublié : c'était une fonctionnalité qui faisait son travail sur
une base qu'on croyait effacée.*** C'est pourquoi aucune relecture de `deleteGameDriver` ne l'aurait
trouvée — le défaut n'était pas dans la suppression, il était dans ce qu'elle ne touchait pas.

#### La cause secondaire, elle, était bien un oubli de cascade

| Geste | Ce qu'il nettoyait avant ce jour |
| --- | --- |
| `deleteCampaign` | 8 collections de Session-OS, et rien d'autre |
| `deleteGameDriver` | ⛔ **une ligne** — un `filter` sur `customGameDrivers` |

Ce qui survivait, relevé module par module :

| Cible | Résidus trouvés |
| --- | --- |
| **Campagne** | journal de séance, moments de storyboard, réserves de table, favoris, **butin** (`lootPool` / `lootHistory`, jamais filtrés), combats garés (rangés par `sceneId`), playlists étiquetées |
| **Pilote** | modèle de fiche, bestiaire (`jeuId`), paquets Deck-OS (`systemId`), surcharges de cortex (`systemOverrides`), widgets Ulanzi, journal des lacunes, **et tout le dossier du corpus** |

#### ⚠️ Le piège qui tue un nettoyage écrit à la main

**Music-OS écrit `campagneId`, en français ; tout le reste écrit `campaignId`.**

Une recherche de texte sur `campaignId` — le premier réflexe pour écrire ce genre de cascade — serait
passée à côté sans rien signaler. ⭐ *Un magasin ne se déclare pas par la forme de ses clés.* Même
famille que les cinq lecteurs d'une jauge (§ 66), qui emploient d'autres noms et que seul le comptage
trouve.

#### Ce qui a été construit — un registre, pas une cascade de plus

Le remède n'est pas d'allonger `deleteCampaign` d'un cran à chaque fois qu'on s'aperçoit d'un oubli :
c'est **une liste que l'on ouvre**. Le modèle existe déjà dans le dépôt — `proprietairesDesMedias.ts`,
né après six angles morts qui faisaient supprimer des fichiers encore utilisés.

| Pièce | Ce qu'elle porte |
| --- | --- |
| `src/services/purge/detenteursDeLaCampagne.ts` / `detenteursDuPilote.ts` | **Le registre.** Chaque entrée sait *recenser* et *purger*. Ajouter un module qui retient quelque chose, c'est ajouter une entrée ici |
| `src/services/purge/registreComplet.test.ts` | ⭐ **Le test qui empêche l'oubli suivant** |
| `src/services/purge/PurgeService.ts` | L'orchestration : instantané, disque, magasins, bilan |
| `electron/groupesDuCorpus.ts` (pur) | Range le corpus en lots cochables |
| `electron/cheminDuCorpus.ts` (pur, testé) | **La barrière** : exactement deux segments, racine connue |
| `electron/purgeDesCorpus.ts` | Les canaux `purge:*` — inventaire, quarantaine, dossiers |
| `src/components/purge/DialogueDePurge.tsx` | L'écran, atteint par une **gomme** posée à côté de la corbeille |

⭐ **Le test de complétude lit les sources**, trouve **tous** les magasins persistés, et exige que chacun
soit dans un registre **ou** dans `HORS_PERIMETRE` avec une raison écrite. Il vérifie aussi l'inverse :
pas de fantôme, donc pas de ligne qui continue d'excuser un magasin renommé. *Une liste sans contrôle
n'est qu'une bonne intention datée* — et il a attrapé **six de mes propres approximations** à sa
première exécution : six noms inscrits hors périmètre qui n'étaient pas des magasins persistés.

#### Les deux décisions de David, à ne pas re-débattre

**1 · Au cas par cas dans l'aperçu.** Les lots se cochent un par un. Ce que la Forge refabrique est
coché d'avance ; le manuel source, l'index paginé, le thème et la correspondance des fiches ne le sont
pas. ⭐ *L'inconnu se penche du côté qui ne détruit pas* — le lot fourre-tout, celui qui attrape le PDF
du livre et ses extractions, est décoché par construction.

**2 · Quarantaine et instantané.** Les fichiers sont **déplacés** dans
`docs/_purges/<horodatage>-<nom>/`, arborescence gardée : les remettre est un glisser-déposer, et
personne n'a de mécanisme de restauration à écrire ni à maintenir. La sauvegarde automatique passe
avant. **Rien n'est jamais supprimé.**

#### ⛔ Trois pièges payés en le construisant

| Le piège | Ce qu'il aurait coûté |
| --- | --- |
| **`sauvegarderMaintenant` ne lève jamais et ne rend rien** | Un `try/catch` autour aurait **toujours** laissé passer. On lit le verdict de `fautIlSauvegarder` **avant**, puis on vérifie que `lastBackupAt` a bougé |
| **Le dossier de quarantaine vit sous `docs/`** | L'Oracle aurait continué de citer les fiches « effacées ». Un `.ragignore` (`**`) est posé **avant** le premier déplacement |
| **Session-OS efface les scènes** | Combat-OS, appelé après, ne saurait plus quels combats garés étaient les siens. La cible **fige** les identifiants à l'aperçu |

⭐ ***Un garde-fou qui ne peut pas échouer n'en est pas un.*** Le premier de ces trois est le plus
sournois : le code aurait eu exactement l'air d'un code prudent.

#### Les garde-fous, et pourquoi chacun existe

| Garde | Nature | Ce qu'il empêche |
| --- | --- | --- |
| Campagnes qui jouent le pilote | ⛔ **Barrage**, revérifié à l'exécution | Une campagne vivante dont le jeu disparaît devient injouable |
| Deux pilotes sur le même dossier | ⚠️ **Avertissement**, pas barrage | Vider le corpus d'un autre jeu en silence. *Partager un corpus est parfois exactement ce qu'on a voulu* |
| Modèle de fiche partagé ou intégré | Silencieux — il n'est pas emporté | Supprimer le modèle d'un autre jeu en croyant nettoyer le sien |
| Un module muet au recensement | ⛔ La purge est refusée | Confirmer une liste qui n'était pas la vraie |
| Le nom se retape | Saisie obligatoire | *« je croyais avoir sélectionné l'autre »* — que ni la quarantaine ni la sauvegarde ne rattrapent |

#### ⚠️ Deux choses trouvées au passage

**`estDeLaCampagne` n'est pas un filtre de suppression.** Il rend `true` pour un butin **sans marque** —
une règle d'affichage juste (*un butin d'avant la marque appartient à la campagne qu'on regarde*) qui,
employée dans la cascade, aurait fait disparaître tout le butin non marqué de **toutes** les campagnes.
Le filtre de `deleteCampaign` compare donc l'identifiant, et rien d'autre.

⛔ **`ai:list-dir` ne rend que des FICHIERS** (`e.isFile()`). Son seul appelant s'en sert pour lister les
**dossiers** de campagnes — `corpusDeLaCampagne` dans `ServiceDeCampagne.ts` — et reçoit donc
**toujours une liste vide** : `resoudreCorpusDeCampagne` conclut « dossier à créer » pour un dossier qui
existe. C'est le défaut exact que le commentaire de `RAGService` décrit pour les systèmes, resté en
place de l'autre côté. ⚠️ **Défaut préexistant, NON corrigé** — changer ce canal toucherait la
vérification « déjà forgé » de l'Atelier. La purge passe par un canal neuf, `purge:dossiers`.
**À traiter séparément.**

**Ancres** : `src/services/purge/` (les quatre fichiers), `src/components/purge/DialogueDePurge.tsx`,
`electron/groupesDuCorpus.ts`, `electron/cheminDuCorpus.ts`, `electron/purgeDesCorpus.ts`,
`SessionManager.ts` (`deleteCampaign`, le butin), `CampaignLibrary.tsx` et `TemplateDashboard.tsx`
(la gomme).

**Vérifié** : `tsc -b --force` propre, **5 368 tests au vert** (422 fichiers, 1 ignoré, 4 tests
ignorés), ESLint sans erreur. ⚠️ **Jamais essayé à l'écran** — et dans ce dépôt, c'est là que les
défauts se trouvent. Le premier aperçu sur un vrai corpus est le geste qui juge ce chantier.

---

### 82 · ⭐ 76 % de l'état persisté étaient deux images en base64 (2026-09-18, après-midi)

David : *« est-ce que tu vois d'autres pistes à explorer pour la stabilité et la vitesse ? »*

La réponse n'est pas venue d'une revue de code : elle est venue d'**ouvrir la sauvegarde automatique
et de compter**.

| Poids | Où |
| --- | --- |
| **1 250 Ko** | `clues[50].mediaUrl` — un JPEG entier, en base64 |
| **828 Ko** | `npc.savedEntities[0].avatar` — idem |
| 668 Ko | **tout le reste de l'application** |

Les 51 autres indices portaient sagement un identifiant `m-652dcfa1…`. Un seul portait un mégaoctet.

#### ⛔ Et le code pouvait le refaire

Les quatre fournisseurs de `generateImage` finissaient tous par la même forme :

```ts
const localUrl = await saveAvatar(octets, nom);           // un chemin de fichier
try { await addMedia(fichier, etiquettes); } catch { }    // ⛔ le retour JETÉ
if (localUrl) return localUrl;
return `data:image/jpeg;base64,${base64}`;                // ⛔ le repli muet
```

**`addMedia` rend l'identifiant du média — et les quatre le jetaient.** Les appelants nomment ce
résultat `mediaId` et l'écrivent dans un magasin **persisté**.

⭐ ***C'est le nom de la variable qui a caché le défaut.*** Et rien ne pouvait se plaindre : une data
URI est une image parfaitement valide, elle s'affiche comme les autres.

⚠️ **Ce que ça coûtait au-delà du poids.** Une image sans entrée au Media Hub est **hors du
système** : le miroir des médias ne la sauvegarde pas, `MediaCleanupService` ne la voit ni comme
usage ni comme orphelin, elle n'est pas dédupliquée — et un magasin persisté réécrit **tout** à
chaque `set()`.

#### ⚠️ La réparation existait déjà — j'ai failli en écrire un doublon

En allant poser l'écran, `InlinedMediaPanel` et son service de 242 lignes étaient déjà là, avec la
même forme en deux temps. *La leçon « vérifier que ça n'existe pas avant de le construire » a été
payée à moitié : le service était écrit avant que je ne regarde.*

Il couvrait **huit champs**, dont `clues[].mediaUrl` — il savait donc voir l'indice de 1 250 Ko, et
il n'avait jamais été lancé. Son **angle mort réel** était ailleurs : il ne lisait que le magasin de
session et les favoris. NPC-OS a le sien, et c'est celui que remplit une demande de portrait à l'IA.
Greffé, avec sa subtilité — ⚠️ **la fiche ouverte et sa copie rangée sont DEUX porteurs de la même
image**, et n'en réparer qu'un la ferait revenir au premier rechargement.

#### ✅ Éprouvé en réel le jour même — et l'incident qui a suivi

David a lancé la migration. Le journal le confirme : **2 812 229 → 683 961 octets**, exactement les
−76 % annoncés.

⛔ **Et la sauvegarde automatique a refusé d'écrire, à 17 h 23 puis à 18 h 29 :**

> *« La sauvegarde ferait 683 961 octets contre 2 812 229 pour la précédente. Un rétrécissement de
> plus de moitié qui ne s'explique pas est traité comme une perte, pas comme une sauvegarde. »*

La garde a fait exactement son travail. Mais **le filet est resté en panne plus d'une heure**, et le
meneur n'avait aucun moyen de dire « cette baisse est voulue » : `baisseAttendue` existe, et seule la
purge sait le poser.

⭐ ***Une garde qui protège des données doit avoir une porte pour le cas légitime qu'elle bloque —
sinon ce n'est plus une garde, c'est une impasse.*** Prévenir dans un message ne suffit pas : je
l'avais annoncé à David avant qu'il ne migre, et l'incident a eu lieu quand même.

#### ✅ Le correctif de l'incident, posé le soir même

`InlinedMediaPanel` demande maintenant une sauvegarde **en déclarant la baisse** après une migration
réussie. Un contrôle lit la source de l'écran et tombe si la ligne disparaît — **vu rougir sur
mutation**. Le filet du meneur a été rétabli à 18 h 36 : **683 955 octets**, sur l'état migré.

**Ancres** : `src/modules/ai/rangementDeLImage.ts`, `AIService.ts` (les quatre chemins),
`InlinedMediaMigration.ts` (`ScannableNpc`), `InlinedMediaPanel.tsx` (`baisseAttendue`).

**Vérifié** : une garde lit la source d'`AIService` et refuse le retour d'un repli en data URI —
**vue rougir sur mutation**. 5 377 tests Vitest, 192 E2E.

---

### 83 · ⭐ Le magasin de session sérialisait 1,9 Mo à chaque `set()` (2026-09-18, après-midi)

Même motif que le § 78, mais sur le plus gros magasin de l'application : Zustand appelle `setItem()`
à **chaque** `set()`, sans condition, et les tranches de ce magasin en comptent **163**.

⚠️ **Le coût n'est pas le même que celui du tableau blanc.** Ce magasin écrit dans **IndexedDB**,
donc l'écriture disque est asynchrone. Ce qui bloque, c'est le `JSON.stringify`, sur le fil
principal. L'enveloppe est donc posée **au-dessus** du stockage JSON — posée en dessous, elle
recevrait une chaîne déjà sérialisée et paierait quand même le vrai coût.

#### ⚠️ Une erreur de comptage à ne pas refaire

J'avais annoncé *« un seul magasin emploie l'écriture différée »*. **Faux** : j'avais cherché le nom
de l'outil au lieu de la fabrique qui l'enveloppe. **Huit magasins** passent par `stockageLocalDuMJ()`
— `useBibliothequeDesFiches`, `useClockStore`, `useCombatStore`, `useDiceStore`, `useFavoriteStore`,
`useMapStore`, `useRaccourcisStore`, `useWhiteboardStore`.

#### ⛔ La garde porte AVANT le tampon

`autorise` reprend les **deux** conditions de `gmOnlyStateStorage`, et ce n'est pas une redite : un
tampon qui accepte une écriture interdite la **sert ensuite en lecture** pendant 250 ms. Une
réhydratation tombant dans cette fenêtre y relirait un état qui n'avait pas le droit d'exister —
c'est-à-dire les mocks. *C'est le mécanisme exact de la seconde perte de campagnes.*

Le magasin de session ne peut pas passer par `stockageLocalDuMJ` (il écrit dans IndexedDB), donc son
inscription au registre des filets de fermeture est un **geste séparé** — et un geste séparé s'oublie.
D'où `inscrireUnStockageDiffere`, seul point d'entrée.

#### Quatre essais existants sont passés au rouge, et ils avaient raison

`getItem` sert ce qui attend **avant** d'aller au disque, ce qui court-circuite le seul endroit posant
le drapeau de relecture. Vérifié impossible en production — tant que la base n'est pas relue,
l'écriture est refusée *avant* le tampon, donc il est vide à la première lecture. C'était une
pollution entre essais, par un singleton de module.

⚠️ **Une phrase du dépôt est devenue fausse et a été corrigée** : `ecritureReserveeAuMJ` affirmait
*« jamais une campagne, qui passe par `PersistenceService` et IndexedDB »*. Ce qui rattrape n'est plus
la nature du magasin, ce sont les trois filets de fermeture et la sauvegarde automatique.

**Vérifié** : deux mutations posées — retirer la garde fait tomber les deux essais de refus, oublier
l'inscription en fait tomber huit. 5 381 Vitest, **192 E2E contre une référence prise AVANT**.

---

### 84 · ⭐ Le profilage React — et pourquoi le chantier des sélecteurs n'aura pas lieu (2026-09-18, soir)

97 composants appellent `useSessionOSStore()` sans sélecteur. La déduction était claire : tous se
re-rendent à chaque changement. *Une déduction n'est pas une mesure*, et le chantier qu'elle
justifierait se compte en soirées sur 97 fichiers.

#### ⛔ Deux versions de cette mesure étaient fausses

| Instrument | Ce qu'il disait | Pourquoi |
| --- | --- | --- |
| Attente par `requestAnimationFrame` | **0 ms** | 120 images × 16,67 ms = 2 000 ms des deux côtés — la cadence quantifiait tout |
| Attente par tâche, temps au chronomètre | **0,23 ms** | noyé dans le plancher de `setTimeout` (~5 ms) |
| **`actualDuration` de React** | **2,24 ms** | mesuré **dans** le commit |

⭐ ***Un instrument dont le plancher dépasse le signal ne mesure pas zéro : il ne mesure rien.*** Et
dans un build normal, `actualDuration` est absent — la spec s'ignore **en le disant** plutôt que de
rapporter un 0 rassurant.

#### Le harnais

`GMOS_PROFILAGE=1 npm run build` alias `react-dom/client` vers la variante **profiling** de React, la
seule qui renseigne `actualDuration`. ⚠️ **Sans la variable, le build de production est inchangé.**

La spec installe un faux crochet React DevTools **avant** le chargement — React lit ce crochet à son
initialisation et ne le relit jamais — puis écrit 120 fois une clé que **rien ne lit dans le dépôt**.
Elle mesure aussi sur la **vraie base**, lue en seule lecture dans un profil jetable.

⚠️ La campagne témoin porte 2 entités là où la vraie base en porte 125 : *mesurer sur le témoin
répondrait à une autre question.*

#### Le chiffre, et ce qu'il dit vraiment

Sur la base réelle, pour une clé que personne n'affiche : **79 composants re-rendus, un commit
complet, 2,24 ms entièrement perdus.**

⭐ **Le coût ne dépend PAS du volume de données** — 3,1 ms sur la campagne témoin contre 2,24 sur
125 entités. *Ce n'est pas la donnée qui coûte, c'est la structure.*

`App.tsx` s'abonnait au magasin **entier** pour lire `activeCampaignId`, à la racine de l'arbre.
Corrigé en sélecteur. Gain mesuré : 2,24 → **2,00 ms**, 79 → 76 composants.

**Décevant, et c'est le résultat utile** : `App` se re-rend toujours 121 fois. La cause est ailleurs —
`useNexusSynchronizer.ts:618` s'abonne à **tout** changement de session.

#### La décision

**Le chantier des 97 sélecteurs n'aura pas lieu.** 2 ms par changement, à la fréquence réelle des
écritures de session — quelques-unes par minute, pas soixante par seconde — ne se voient pas en
séance. Ce qui reste à tirer, c'est le fil du synchronisateur : *un abonnement à tout changement, à
la racine, grossit avec l'application.*

⭐ C'est la **deuxième fois de la journée** qu'une mesure contredit une annonce que j'avais faite :
le minuteur de Clock-OS coûtait 0,0004 % du fil principal, et n'a pas été touché non plus.

**Ancres** : `e2e/profilageDesRendus.spec.ts`, `vite.config.ts` (`GMOS_PROFILAGE`), `App.tsx`.

**Vérifié** : 5 381 Vitest, **195 E2E** (192 de référence + 3 de profilage).

---

### 85 · ⭐ La soirée Light-OS — deux effets, les ambiances du meneur, et une liste déroulante qui n'en était plus une (2026-09-18, soir)

Quatre demandes de David dans la soirée, et **chacune a révélé autre chose qu'elle-même.**

| Ce qu'il a demandé | Ce que ça a trouvé |
| --- | --- |
| *« un effet Aube dorée »* | ⛔ Le canal **bleu** décide si une couleur chaude est de l'or ou du blanc |
| *« un module de création d'ambiance ? »* | ⛔ **36 effets sur 47** figent leur palette : le curseur de couleur ne servait à rien sur eux |
| *« de la lumière à travers des stores »* | ⭐ L'illusion vit **entre** les lampes, et c'est sa propre précision qui la rendait possible |
| *« je ne retrouve pas mes copies »* | ⛔ La chaîne était complète, **sans porte pour y revenir** |

#### ⛔ Aube dorée : « pas assez dorée, c'est trop blanc »

Premier jet refusé par David **dans la pièce**. Le chiffre le dit d'un coup d'œil :

| Effet | Canal bleu |
| --- | --- |
| `torche` (`#ff8c21`) | 33 |
| l'or de `lever-soleil` (`#fbbf24`) | 36 |
| ⛔ mon sommet d'aube (`#ffd79a`) | **154** |

⭐ ***Sur une lampe Hue, c'est le bleu qui décide si une couleur chaude se lit comme de l'or ou comme
du blanc chaud.*** Et ça ne se voit pas dans un hexadécimal : `#ffd79a` et `#ff8c21` commencent tous
les deux par `ff`, ils ont l'air de la même famille. **Seule la troisième composante les sépare.**

L'effet lui-même est une lumière **tenue**, et la distinction d'avec `lever-soleil` est écrite dans le
code : l'un *traverse* la nuit vers le jour en cinq minutes, l'autre est le matin déjà installé. *La
précaution que l'affaire `candle`/`fire` a rendue obligatoire.*

#### ⛔ Le fondu qui ne se voyait jamais — un défaut latent sur les 47 effets

`catalogueDesEffets.test.ts` interdit qu'un `transitiontime` dépasse son `interval` : *la commande
suivante arrive avant la fin du fondu, la lampe suit, et la forme voulue n'apparaît jamais.* Mais il
lit la **source**, où la vitesse vaut toujours 1.

Or le curseur de vitesse **divise l'attente sans toucher au fondu**. Mesuré : à ×2, `holy` fondait sur
1 500 ms pour un battement de 750. **L'effet ne cassait pas — il s'aplatissait**, et une platitude
ressemble à un mauvais réglage, pas à un défaut.

⭐ ***Une règle vérifiée là où on la lit, et pas là où la valeur devient vraie, ne garde que la moitié
du chemin.*** Le rabot vit désormais dans la boucle, après la cadence réelle. **Appliqué à tous sur
décision de David.**

#### ⭐ Les ambiances — et pourquoi la teinte se pose APRÈS l'effet

David : *« je me demande si on ne devrait pas faire un module de création d'ambiance ? »*, puis, après
discussion : *« on va commencer par la copie d'un effet existant. »*

La forme est dictée par une mesure : **36 des 47 effets écrivent leur palette en dur**. Poser une
couleur avant de lancer l'effet ne toucherait que les onze qui lisent `baseXy` — *le curseur de couleur
existait déjà et n'avait aucun effet sur les trente-six autres, sans que rien ne le dise.*

Une variante reteinte donc **après** le `switch`, au seul endroit que les 47 traversent.

⛔ **On mélange, on ne remplace pas.** À force pleine un gyrophare devient monochrome, et un gyrophare
monochrome n'est plus un gyrophare : *ce qui fait un effet n'est pas sa teinte, c'est le rapport entre
ses teintes et son rythme.* Force par défaut à 0,7.

⭐ **Et il n'y a rien à recaler après le mélange : le gamut est un TRIANGLE, donc convexe.** Un point
pris entre deux points d'un convexe reste dedans. *Un recalage y serait du code qui ne s'exécute
jamais, et un second endroit où la même couleur se décide* — un test garde l'argument.

⚠️ Deux détails qui auraient coûté cher : la vitesse d'une ambiance **multiplie** celle de la scène au
lieu de la remplacer (*si l'une écrasait l'autre, un des deux curseurs mentirait*), et le comptage du
budget du pont se fait sur la **source** — deux ambiances tirées de `fusillade` coûtent au pont ce que
coûtent deux fusillades.

#### ⭐ Stores : l'illusion vit ENTRE les lampes

*« de la lumière passant à travers des stores (sur 2 ou 3 lumières) ? Si ce n'est pas possible ce
n'est pas grave. »*

Sur une seule lampe, ce ne serait qu'une pulsation de plus : une ampoule éclaire uniformément, il n'y a
ni lame ni ombre portée. ⭐ **C'est la précision « sur 2 ou 3 » qui rend l'effet possible** — chacune se
place à un endroit différent du motif, et la pièce devient inégale.

Le décalage vient de l'identifiant de la lampe par un calcul **stable** — des lames sont régulières, et
une lampe doit retrouver *sa* bande d'une scène à l'autre, là où `fusillade` se décorrèle au hasard.
Étalé par le **nombre d'or** : un pont Hue numérote `1`, `2`, `3`, et un simple modulo mettrait les
trois lampes dans la même bande.

#### ⛔ « Je ne retrouve pas les différentes copies d'un effet »

Le symptôme disait une chose, le défaut en disait une autre. Ses copies **existaient**, elles
**jouaient**, elles se **capturaient** dans une tuile. Mais elles n'étaient atteignables que tout en
haut d'un menu de cinquante entrées, et modifiables que sur une lampe en train de les jouer.

*La chaîne était complète et il n'y avait pas de porte pour y revenir* — le motif que ce dépôt a payé
sept fois, dans l'autre sens cette fois : ce n'est pas le bouton qui manquait au bout, c'est le
**retour**.

Sa réponse a reformulé le problème : *« je pense que la liste déroulante n'est plus adaptée avec 40
items, je pense qu'il faut passer par un écran volant. »* ⭐ ***Une liste déroulante de cinquante
entrées n'est plus une liste, c'est un couloir*** — on y descend, on dépasse ce qu'on cherchait, on
remonte, et rien ne s'y cherche.

L'écran cherche par le nom, par l'identifiant du guide, et — pour une ambiance — **par l'effet dont
elle descend** : taper « torche » ramène la torche *et* la bleue qu'on en a tirée. *Sans ça, une copie
se perd derrière le nom qu'on lui a donné, ce qui était exactement le problème.*

⭐ **Le catalogue est devenu une donnée.** Les 48 effets vivaient en `<option>` dans un `<select>` :
*une liste qui n'existe que sous forme de balises ne peut être lue que par le navigateur.*

#### ⚠️ Quatre contrôles du dépôt m'ont repris, et un que j'ai dû resserrer

| Le contrôle | Ce qu'il a refusé |
| --- | --- |
| `catalogueDesEffets` | Un fondu de 3 000 ms pour un battement de 2 500 — **que mon commentaire défendait** |
| `nomsSansEcrivainNiLecteur` | Mes trois actions de magasin, tant qu'aucun écran ne les appelait |
| `etatARendre` | A exigé que je **décrive** mon nouvel ayant droit au lieu d'ajuster le compte de 2 à 3 |
| David, à l'écran | « pas assez dorée » — et il avait raison, d'un facteur quatre |

⛔ **Et le contrôle que j'ai écrit pour le guide est passé au vert sur sa propre mutation** : il
cherchait le nom d'un effet par `includes`, et « Alerte Rouge MUTEE » contient encore « Alerte Rouge ».
*Un contrôle par sous-chaîne accepte tout ce qui contient ce qu'il cherche.* Il cherche désormais le
nom **en gras**, le contrat que tient la première colonne du tableau — et il rougit.

#### Le guide du meneur

Le § 75 liste désormais les **48 effets un par un**, avec ce que chacun fait *dans la pièce*, les deux
coups uniques, la raison pour laquelle sept effets ne jouent que sur une ou deux lampes, et les onze
effets recolorables. Les descriptions sont **dérivées du moteur**, pas des noms.

⚠️ **Il a décrit l'ancien écran pendant une heure** : la section des ambiances a été réécrite le soir
même, après que l'écran volant l'eut périmée. *Un guide écrit en même temps que le code vieillit à la
vitesse du code.*

**Ancres** : `HueEngine.ts` (`case 'aube-doree'`, `case 'stores'`, le rabot, la teinte),
`logic/varianteDEffet.ts`, `logic/lumiereDesStores.ts`, `logic/rechercheDEffet.ts`,
`logic/catalogueDesEffets.ts`, `components/SelecteurDEffet.tsx`, `useLightStore` (`variantes`).

**Vérifié** : `tsc -b` propre, **5 418 tests Vitest**. ✅ Aube dorée, les ambiances et l'écran volant
**éprouvés à l'écran par David**. ⚠️ **Stores ne l'a pas été** — et c'est le seul dont je ne peux pas
prédire le rendu, puisqu'il ne se juge que sur deux ou trois lampes à la fois.

---

### 86 · ⭐ Le miroir des lampes ne connaissait que GM-OS (2026-09-19, matin)

David : *« je règle souvent les lumières à partir de mon PC, mais parfois aussi à partir de mon
téléphone, est-ce que tu pourrais faire un bouton qui capture l'état actuel de mes lampes ? »*

⭐ **Encore un rapport de bogue déguisé en souhait** — le bouton existait, et s'appelait déjà
« Capturer l'état actuel des lampes ». Il lisait `useLightStore.lights`, **un miroir de ce que GM-OS
avait envoyé**, rafraîchi depuis le pont **uniquement à l'appairage**. Un réglage fait au téléphone
était donc invisible, et la tuile enregistrait une ambiance que plus personne ne voyait. *Un bouton
dont le nom promet ce qu'il ne fait pas est pire qu'un bouton absent : rien ne dit qu'il s'est
trompé.*

#### ⛔ Le pont rend de l'EFFECTIF, le magasin garde du NOMINAL

C'est le piège de toute relecture, et il n'est pas visible à l'œil :

```
bri côté pont = nominal × curseur global × intensité de la tuile
```

Recopier tel quel **rabaisse le nominal d'un cran à chaque lecture** — deux allers-retours et la
scène s'éteint par étapes. `setLightState` en prévenait depuis toujours, en commentaire, sans que
personne ait eu à s'en servir.

⭐ ***La règle tient en une phrase : ou bien le pont répète ce qu'on lui a envoyé — rien n'a bougé,
on garde le nominal — ou bien il dit autre chose, et c'est une valeur de la pièce, qu'on ramène au
nominal en défaisant le curseur global seulement.***

⚠️ L'intensité de la tuile entre dans la **comparaison** (et seulement pour les lampes qu'elle
commande) mais **jamais dans la division** : le nominal du magasin est celui d'un geste direct, c'est
ce qu'affiche le pied de page.

#### ⛔ Deux lampes ne se relisent jamais

| Lampe | Pourquoi | Ce qu'on garde |
| --- | --- | --- |
| Sous **effet logiciel** | sa brillance est l'image d'un battement : la relire fige une bougie sur un creux au hasard | l'état d'avant l'effet |
| **Injoignable** | le pont répète un dernier état connu, parfois vieux de plusieurs jours | le nôtre |

*Le pont fait foi sur ce qu'il voit, pas sur ce qu'il se rappelle.*

#### Ce qui a été livré

- un bouton **« Relire les lampes »** à droite de la barre du haut ;
- la **capture d'une tuile relit le pont avant d'enregistrer** — ce que son nom promettait ;
- `fetchLights()` ne fait plus qu'appeler la relecture : **un seul écrivain pour le miroir**.

**Ancres** : `logic/relireLesLampes.ts` (21 essais, dont un qui **compare la reconnaissance à
`brillanceEffective`** pour que les deux formules ne dérivent pas), `HueEngine.relireLesLampes`,
`components/TopControls.tsx`, `components/SceneGrid.tsx` (`handleCapture`).

**Vérifié** : `tsc -b` propre, suite Vitest verte. ✅ **ÉPROUVÉ À L'ÉCRAN PAR DAVID**, dans la nuit
du 19 au 20/09 — *« tout fonctionne »*. La procédure a porté sur les cinq cas, **dont celui qui
comptait** : curseur global à 50 %, tuile appliquée, cinq relectures d'affilée, et le pourcentage
du pied de page **n'a pas bougé**. *C'est là qu'était toute la difficulté : à 100 % de global, le
nominal et l'effectif sont égaux et la dérive ne se voit pas.*

⚠️ **Et c'est le seul chantier du jour qu'aucun essai automatique ne pourra jamais couvrir** :
l'E2E débranche les appareils exprès (`GMOS_SANS_APPAREILS`). Ce chemin ne se vérifie qu'avec un
pont et une main sur un téléphone.

---

### 87 · ⛔ Light-OS et Sound-OS n'étaient dans AUCUNE sauvegarde — et les y mettre ne suffisait pas (2026-09-19)

Trouvé en cherchant où rattacher les tuiles à une campagne. `construireLaSauvegarde` collectait
**douze** magasins ; ni `light` ni `sound` n'en faisaient partie. Les dix-huit tuiles et les seize
pads par atmosphère — chemins de fichiers, notes MIDI, touches, scènes lumineuses liées — ne
vivaient que dans le `localStorage` d'une application qui a **déjà perdu ses données deux fois**.

⭐ **Cinquième et sixième fois** que cette liste oublie quelque chose, après `entities`/`clues`/
`sessions`, Music-OS, Map-OS et Image-OS. Le fichier le disait déjà lui-même : *« une liste de ce
qu'on sauvegarde, recopiée à la main, oublie toujours quelque chose. »* Elle l'oubliait encore.

#### ⛔ Le contrôle qui se croit posé et ne refuse rien

Partout ailleurs, la garde anti-écrasement est un `?.length` sur une liste. Ici elle ne refusait
rien :

| Magasin | Pourquoi le compte ne dit rien | Le vrai critère |
| --- | --- | --- |
| Light-OS | les **dix-huit** tuiles existent toujours, même neuves | qu'une tuile tienne l'état d'une lampe |
| Sound-OS | la liste n'est **jamais vide** — `removeAtmosphere` recrée « Exploration » | qu'un pad tienne un **fichier** |

⭐ ***La question qui les trouve est « cette liste peut-elle vraiment être vide ? », et la réponse est
presque toujours non quand le magasin fabrique ses cases d'avance.***

#### ⛔ Et le piège était le DÉCLENCHEUR, une seconde fois

Mettre les deux modules dans la charge utile ne suffisait pas : **seul `useSessionOSStore` armait la
sauvegarde**. Capturer une tuile ou ranger seize pads n'écrivait rien — il fallait toucher par
ailleurs à sa campagne, ou fermer l'application. *Même piège que `databases/` le 15/09 : on vérifie
ce qui entre dans le fichier, on oublie de vérifier qui appuie sur le bouton.*

⚠️ **Et la correction évidente aurait été pire que le défaut.** S'abonner aux magasins entiers
paraît plus sûr ; `useLightStore` change à **chaque battement d'effet**, et armer relâche deux
minutes de repos avant d'écrire. Un abonnement large aurait remis le compteur à zéro en permanence,
et **plus aucune sauvegarde ne serait partie pendant une séance**. ⭐ ***Un déclencheur trop sensible
ne déclenche rien.***

#### Trois décisions de frontière

- **Les ambiances du meneur voyagent avec les tuiles** — obligatoire : une tuile peut porter
  `variante:<id>`. *Ce qui est référencé part avec ce qui référence.*
- **Les pads partent au repos** : `isActive` décrit la soirée. *Un pad qui revient allumé six mois
  plus tard, sans qu'aucun son ne sorte, est un mensonge visuel.*
- **Ni volume général, ni sortie audio, ni curseur global** : ils décrivent la pièce où l'on joue.

**Ancres** : `store/SessionService.ts` (`light`, `sound`), `types/schemas.ts` (⚠️ `modules` n'est
**pas** `.passthrough()` — non déclarée, la clé serait écrite puis **jetée à la relecture**),
`light/logic/tuilePorteUnEtat.ts`, `sound/logic/padPorteUnSon.ts`,
`light/logic/donneesDurables.ts` (**une seule liste** pour la charge et pour l'armement),
`session/store/index.ts` (les deux abonnements).

**Trouvé en réparant** : restaurer pouvait rendre **tous les gestes de Sound-OS muets** — les neuf
actions de pad filtrent par `activeAtmosphereId`, et `SoundDashboard` retombe sur la première
atmosphère, *donc la grille a l'air parfaitement normale.*

**Vérifié** : `tsc -b` propre, suite verte, E2E rejoués. ✅ **Le contenu des deux nouvelles clés a
été éprouvé à l'écran par David le jour même** — *« j'ai appliqué les tests cela fonctionne »*.

---

### 88 · ⭐ Les tuiles appartiennent à une campagne, et chacune a ses dix-huit cases (2026-09-19)

Les dix-huit tuiles étaient **partagées par toutes les campagnes** : les ambiances d'*Alien* se
mélangeaient à celles de *Rêves de Dragons*, et rattacher une tuile à l'une la retirait de la
grille de l'autre. *On ne rangeait pas, on rétrécissait.* C'est ce qui bloquait l'idée d'une IA qui
compose des ambiances — **l'obstacle n'était pas le modèle, c'était la place.**

#### La règle n'a pas été recopiée, elle a déménagé

Music-OS avait résolu le même problème le 30/08 — *« étiquette, pas cloison »*. Plutôt qu'un second
classement, la règle est remontée dans `src/logic/rattachementALaCampagne.ts` ;
`playlistsDeLaCampagne.ts` ne fait plus que la rhabiller, **et ses 126 essais passent sans
modification**.

#### ⚠️ Deux règles posées le matin se sont inversées l'après-midi

| Règle, quand les cases étaient partagées | Ce qu'elle devient, une fois les râteliers séparés |
| --- | --- |
| Effacer une tuile **retire** son rattachement | Il **reste** — une case vide rattachée est la case libre de cette campagne |
| Une case vide reste visible **partout** | Elle reste dans **son** râtelier — sinon la grille se remplit des cases libres des autres |

Les deux protégeaient d'un râtelier qui rétrécit. Il ne rétrécit plus, donc les deux sont devenues
des gênes. ⭐ ***Une règle juste peut s'inverser quand ce qu'elle protégeait change de forme.*** Les
trois essais qui les encodaient ont échoué — *ils ont fait exactement leur travail.*

#### Ce qui ne bouge pas, et c'est le point

**Aucune migration, aucun identifiant changé.** Les dix-huit tuiles d'origine gardent
`SCENE_01`…`SCENE_18` et n'ont pas d'étiquette : elles sont **communes**, visibles partout, comme
hier. Les cinq détenteurs d'une référence lumineuse — pads de Sound-OS et Music-OS, pistes
d'Ambient-OS, zones de danger, moments de storyboard — résolvent toujours.

#### Six lecteurs, dont un qui n'est pas un écran

La grille, le sélecteur partagé (Music/Sound/Ambient), la barre latérale, la zone de danger de
Map-OS, le moment de storyboard — **et le clavier**. ⛔ C'est le pire des six : deux campagnes
donnent naturellement la même touche à leur ambiance d'ouverture, la première trouvée l'emporte, et
**la pièce change de couleur devant les joueurs.** Music-OS a payé exactement ce défaut en août :
son clavier était resté le dernier chemin non cloisonné.

#### ⛔ Et la fusion des instantanés — le même geste écrit QUATRE fois

En réparant le snapshot de séance de Light-OS, les trois autres modules d'ambiance avaient le même
trou :

```
set({ scenes })  set({ atmospheres })  set({ playlists })  set({ tracks })
```

Le remplacement en bloc. Rejouer un instantané six mois plus tard effaçait **tout ce qui avait été
rangé depuis** — et depuis que playlists (30/08) puis tuiles (19/09) appartiennent à une campagne,
**à travers les campagnes**. La règle s'écrit désormais une fois : *un instantané ne fait jamais
disparaître un travail qui n'est pas le sien.*

#### ⚠️ Un défaut introduit puis corrigé le même jour

La section de grille avait été écrite comme un **composant déclaré dans le corps de `SceneGrid`** —
un type neuf à chaque rendu, donc React démonte et remonte la section au lieu de la mettre à jour.
Les tuiles portent deux curseurs, et traîner un curseur rend à chaque pixel : **le curseur se serait
arraché de sous la souris au premier mouvement.** C'est une fonction de rendu, pas un composant.

Corrigé aussi : `parseInt(sceneId.split('_')[1])` rendait la campagne au lieu du numéro — une tuile
effacée se serait appelée **« Scene NaN »**.

**Ancres** : `src/logic/rattachementALaCampagne.ts`, `src/logic/fusionDInstantane.ts`,
`light/logic/tuilesDeLaCampagne.ts`, `light/logic/ratelierDeLaCampagne.ts`,
`light/hooks/useTuilesVisibles.ts`, `useLightStore` (`campagneId`, `assignerLaTuile`,
`garnirLeRatelier`), les quatre `logic/instantaneDeSeance.ts`.

**Vérifié** : `tsc -b` propre, suite verte, E2E rejoués. ✅ **ÉPROUVÉ À L'ÉCRAN PAR DAVID** le 2026-09-20 — *« c'est bon »*. Les cinq points de la procédure, **dont les deux qui comptaient** : les curseurs d'une tuile se traînent sans à-coup malgré le découpage en sections, et une même touche dans deux campagnes lance bien celle de la campagne ouverte.

---

### 89 · ⭐ L'IA compose un éclairage pour une scène de la trame (2026-09-19)

La demande d'origine de la journée, revenue en fin de parcours : *« est-ce qu'on pourrait demander à
une IA Ollama de conseiller une ambiance quand on prépare une scène dans la trame ? »*

**Elle compose, elle ne choisit pas parmi l'existant.** C'est là qu'un modèle vaut quelque chose :
une couleur par lampe et un effet parmi quarante-huit. *Avec dix-huit tuiles sous les yeux,
« laquelle convient ? » est une question à laquelle le meneur répond déjà d'un coup d'œil.*

#### ⛔ La validation est le cœur, pas un détail

Un modèle qui invente un nom d'effet ne lève **aucune erreur** : le moteur ne trouve pas son `case`,
la boucle n'est jamais lancée, la lampe reste fixe. *Une ambiance à moitié muette ressemble à une
ambiance ratée, pas à une panne — et on ne s'en aperçoit qu'en séance.*

| Ce que le modèle peut rendre | Ce qu'on en fait |
| --- | --- |
| Un effet qui n'existe pas | `none` — fixe, **sur la couleur demandée**, et l'écran le dit |
| Une couleur qui n'est pas un hexadécimal | la lampe est écartée : *on n'invente pas une teinte* |
| Une lampe inventée | ignorée, **et affichée en orange** dans la proposition |
| Une lampe oubliée | **éteinte**, explicitement — *un oubli silencieux est pire qu'un noir assumé* |

⛔ **On ne demande jamais de coordonnées `xy`** : c'est l'espace CIE avec un gamut par ampoule, un
modèle y répond des nombres plausibles et faux. Il rend un hexadécimal, `hexToXy` fait le reste.

#### L'ordre de l'invite

⭐ *Ce qui décide du COMPTE s'énonce avant ce qui décide du CONTENU* — leçon de la Forge Système.
« Exactement N entrées, une par lampe, dans cet ordre » est la **première** phrase, et la liste est
construite à partir des vraies lampes du pont. On ne donne au modèle que les **identifiants**
d'effet, jamais les noms traduits : *deux chaînes pour une même chose, et il rendra la mauvaise.*

#### Où ça se range, et par quelle porte

- dans la **première case libre du râtelier de la campagne** — jamais le pot commun, qui est au
  meneur. *Il peut la rendre commune ensuite : c'est son geste, pas une décision de l'IA.*
- le **moment de storyboard de la scène est complété**, jamais doublé — deux moments pour une
  scène, ce sont deux portes vers la même chose. `addMoment` rend désormais son identifiant.
- **rien n'est appliqué au pont avant l'enregistrement** : une pièce qui change de couleur un
  dimanche après-midi serait une surprise, pas un service.

**Ancres** : `light/logic/ambianceProposee.ts` (la validation, 25 essais),
`light/logic/proposerUneAmbiance.ts` (l'invite et le schéma imposé au décodeur),
`light/logic/caseLibreDuRatelier.ts`, `light/components/PropositionDAmbiance.tsx`,
`session/components/TrameDashboard.tsx`.

**Vérifié** : `tsc -b` propre, suite verte, E2E rejoués. ✅ **ÉPROUVÉ À L'ÉCRAN PAR DAVID le
2026-09-19** — *« j'ai testé l'IA pour l'ambiance Light-OS, c'est bien »*. Le modèle respecte donc
le compte de lampes et rend des identifiants d'effet que le moteur reconnaît : **la couche de
validation n'a pas eu à rattraper l'invite**, mais elle reste la garde du jour où un modèle changera.

⚠️ **Ce qui n'est toujours pas éprouvé par un essai automatique** : l'aller-retour lui-même.
On peut vérifier ce qu'on fait d'une réponse, pas ce qu'Ollama répond — *une invite qui marche
aujourd'hui n'a aucun harnais qui le dise demain.*

*Le constat écrit le matin — « jamais éprouvé à l'écran » — est périmé depuis le soir même. Les
deux questions qu'il posait sont tranchées : oui au compte exact de lampes, oui aux identifiants
d'effet.*

**Reste ouvert** : « Essayer sur les lampes » **avant** d'enregistrer. Appliquer des états non
enregistrés demanderait de dupliquer `applyScene` — avec son piège connu des effets d'une scène
précédente qui ne s'arrêtent pas — ou de la refactoriser. Le contournement livré est
« Enregistrer puis Jouer ».

---

### 90 · ⛔ Le menu d'une atmosphère était coupé ET derrière les pads (2026-09-19, soir)

David, capture à l'appui : *« quand j'essaie de mettre à jour un label, le cadre est caché derrière
les pads »*. Le menu *Rename / Delete* d'un onglet d'atmosphère.

#### Trois causes empilées, et aucune ne se corrige par un `z-index`

| Où | Ce que ça fait |
| --- | --- |
| `AtmosphereManager`, `overflow-x-auto` | ⛔ En CSS, dès qu'un axe n'est pas `visible`, l'autre passe à `auto`. Le menu qui pend sous une barre de 50 px est donc **découpé**. |
| `SoundDashboard`, `overflow-hidden` | un second ciseau, plus haut |
| Le même, `backdrop-blur-sm` | un **contexte d'empilement** : le `z-50` du menu y est enfermé, et les pads sont peints plus loin dans le document |

⭐ C'est la leçon du Media Hub du 16/09 — *un élément ne peut pas sortir de l'ordre de peinture de
son parent* — mais ⚠️ **là-bas un `z-index` sur le bandeau suffisait ; ici non**, parce qu'un vrai
découpage s'y ajoute. On ne peut pas demander `overflow-x: auto` et `overflow-y: visible` : la
spécification l'interdit.

Le menu vit donc dans un **portail** sur `document.body`, positionné depuis le
`getBoundingClientRect()` de l'onglet au moment du clic. Il échappe aux deux ciseaux et au contexte
d'empilement. **Un seul menu, pas un par onglet** : deux menus identiques empilés se disputeraient
le clic de fermeture.

#### ⛔ Et le garde-fou a été FAUX deux fois avant d'être juste

C'est la vraie leçon de ce chantier, et elle vaut plus que le correctif.

| Essai | Verdict sur le code **fautif** | Pourquoi il ne gardait rien |
| --- | --- | --- |
| `toBeVisible()` | ✅ passait | il ne regarde ni le découpage ni le recouvrement |
| `click()` | ✅ passait | Playwright **fait défiler** l'élément dans son parent jusqu'à le rendre atteignable — *ce que le meneur ne peut pas faire* |
| `elementFromPoint` au centre du bouton | ⛔ **échoue**, en nommant `flex-1 p-8 overflow-y-auto` | il demande ce qui est **peint** à cet endroit, du point de vue de l'œil |

⭐ ***La question juste n'est pas « puis-je l'atteindre ? » mais « qu'est-ce qui est peint à cet
endroit ? ».*** Un test d'interface qui se contente d'atteindre un élément mesure la patience de
l'automate, pas ce que voit le meneur.

⚠️ **Et un troisième faux positif a failli passer** : la première version du test cherchait un
bouton « Renommer » — un libellé que le correctif venait d'introduire. Il échouait donc sur
l'ancien code **pour la mauvaise raison**, et la traduction des libellés (non demandée) a été
retirée pour que la preuve soit propre. *Un garde-fou qui échoue pour la mauvaise raison ne garde
rien.*

**Ancres** : `sound/components/AtmosphereManager.tsx` (le portail, `basculerLeMenu`),
`e2e/soundOs.spec.ts` (le garde-fou, **éprouvé dans les deux sens** : rouge sur le code fautif, vert
sur le correctif).

**Vérifié** : `tsc -b` propre, lint propre, **6 essais E2E de Sound-OS au vert**. ⚠️ **Non vu à
l'écran par David** — mais le défaut, lui, avait été vu par lui d'abord.

---

### 91 · ⭐ Sound-OS rattaché à une campagne — la dernière asymétrie des trois modules d'ambiance (2026-09-19, soir)

David : *« comment puis-je lier Sound-OS à une campagne ? »*. La réponse était **on ne peut pas** :
Music-OS l'avait depuis le 30/08, Light-OS depuis le matin même, Sound-OS non. C'était l'asymétrie
notée le soir dans l'état de reprise, quelques heures avant qu'il ne la demande.

#### Troisième module, toujours pas de copie

La règle de classement vit dans `src/logic/rattachementALaCampagne.ts`, remontée le matin pour
Light-OS. `sound/logic/atmospheresDeLaCampagne.ts` n'ajoute que ce qui lui est propre — et ce qui
lui est propre, c'est surtout **ce qu'il n'a pas**.

#### ⭐ Le clavier de Sound-OS n'avait pas le défaut de Music-OS — il en avait un autre

`KeyboardEngine` ne parcourt **pas** toutes les atmosphères : il ne lit que l'**active**. Le défaut
que Music-OS a payé le 30/08 — *« le clavier était le dernier chemin non cloisonné »* — ne pouvait
donc pas se produire ici, et il n'y avait aucun `padDuRaccourci` à écrire.

⛔ **Mais son repli était `atmospheres[0]`** — la première de la liste **brute**, qui peut désormais
appartenir à une campagne qu'on ne joue pas. Une touche aurait lancé un bruitage d'ailleurs,
**devant les joueurs**, et l'écran n'aurait rien montré d'anormal puisque les onglets, eux, sont
filtrés.

⭐ ***Un repli qui ignore le cloisonnement le perce aussi sûrement qu'une boucle.*** C'est le genre
de trou qu'on ne trouve pas en cherchant « où lit-on la liste ? » mais en demandant **« que se
passe-t-il quand la valeur attendue manque ? »**.

#### ⭐ Un champ neuf change la réponse de fonctions écrites avant lui

`atmospheresApresInstantane` — la fusion des instantanés, écrite le matin même — ne connaissait
**pas** de propriétaire pour Sound-OS, et pour une raison qui était juste à l'heure où elle a été
écrite : les atmosphères n'en avaient pas. Le soir, elles en ont un. Sans y revenir, on aurait
**recréé chez Sound-OS le défaut qu'on venait de refermer chez Music-OS** : restaurer une séance
d'une campagne écrasant le rangement d'une autre.

*Ajouter un champ, c'est rouvrir toutes les fonctions qui décidaient sans lui.*

#### La différence avec Light-OS, et pourquoi elle n'est pas un caprice

| Module | À la création | Pourquoi |
| --- | --- | --- |
| Music-OS, Sound-OS | **rattachée** à la campagne ouverte | une bibliothèque sans fin |
| Light-OS | **commune** | dix-huit cases **partagées** : rattacher d'office ferait disparaître une « Taverne » des autres campagnes |

⭐ *On ne rationne pas ce qui ne coûte rien.*

**Ancres** : `sound/logic/atmospheresDeLaCampagne.ts` (dont `atmosphereDuClavier`),
`sound/hooks/useAtmospheresVisibles.ts`, `useSoundStore` (`campagneId`, `assignerLAtmosphere`,
`addAtmosphere(name, campagneId)`), `sound/KeyboardEngine.ts` (le repli),
`sound/logic/instantaneDeSeance.ts` (le propriétaire), `components/AtmosphereManager.tsx`
(l'interrupteur, recopié de `MusicHeader`).

#### ⛔ Le lendemain : l'interrupteur sortait de l'écran, et Échap ne fermait pas le menu

David, le 20/09 : *« comment je peux lier un pad de Sound-OS sur une campagne ? »* — la réponse est
**qu'un pad ne se lie pas, son atmosphère oui**, mais la question a fait relire l'écran. Deux
défauts, et le second a été trouvé **par le garde-fou écrit pour le premier**.

**1. L'interrupteur était DANS la barre qui défile.** `overflow-x-auto`, `no-scrollbar`, dégradé sur
le bord droit : tout ce qui suivait les onglets partait hors écran dès qu'il y avait assez
d'atmosphères, **sans la moindre barre de défilement pour le dire**. ⚠️ David le voyait encore à
trois — le défaut était **latent**, et l'essai en crée donc **quatre** : *un défaut latent ne se
garde pas au seuil où on l'a trouvé, mais au-delà.* Seuls les onglets défilent désormais.

*Une fonctionnalité qu'on ne voit pas est une fonctionnalité absente* — la leçon du Media Hub,
reproduite le soir même où le portail la refermait deux lignes plus haut.

**2. ⭐ Et l'essai a échoué pour une raison qu'il ne cherchait pas.** Il n'arrivait plus à cliquer
« + » : le menu d'atmosphère porte un **voile plein écran**, et **Échap ne le fermait pas**. Tant
qu'il est là, plus rien n'est cliquable.

⛔ **C'est le portail qui a rendu ce défaut réel.** Avant lui, le voile était enfermé dans un
contexte d'empilement et ne couvrait presque rien : le même défaut existait, **inoffensif par
accident**. ⭐ ***Un correctif qui fait enfin marcher un mécanisme fait aussi marcher ce qu'il avait
de faux.***

Le composant était **dispensé** d'Échap dans `echapFermeLesSurcouches.test.ts`, au motif du « fond
cliquable d'un menu déroulant » — un motif qui disait vrai la veille. Le contrôle mécanique a
refusé la dispense devenue caduque dès que le crochet a été posé. *Une dispense est une affirmation
datée ; elle périme avec ce qu'elle décrit.*

**Vérifié** : `tsc -b` propre, lint propre, **5 565 essais Vitest** au vert, **7 essais E2E de
Sound-OS** dont deux neufs éprouvés **dans les deux sens**. ⚠️ **Non éprouvé à l'écran.**

---

### 92 · ⭐ Essayer une ambiance sur les lampes — le dernier reste de l'IA qui compose (2026-09-20)

David : *« va pour le 1 »*, après que le registre a rendu les quatre restes de Light-OS. C'était le
seul des quatre qui se code.

#### Ce que le contournement coûtait

La veille, regarder une ambiance proposée demandait **« Enregistrer » puis « Jouer »**. Autrement
dit : *occuper une case du râtelier de la campagne pour regarder une ambiance qu'on allait
peut-être refuser*, puis l'effacer. ⭐ **Le prix n'était pas le clic de plus, c'était la case** —
elles sont dix-huit, et le § 88 venait tout juste de les rendre rares en les cloisonnant par
campagne.

#### ⛔ La règle d'hier n'interdisait pas ce bouton, et il fallait le vérifier

Le composant portait ceci depuis la veille : *« Rien n'est appliqué au pont avant l'enregistrement
— une ambiance qui s'allumerait pendant qu'on prépare une scène serait une surprise, pas un
service. »* Lue vite, elle interdit l'essai.

Elle dit en réalité autre chose : **rien ne s'allume *tout seul*.** Un bouton nommé « Essayer »
n'est pas une surprise. ⭐ *Une règle se relit avant d'être invoquée contre un geste qu'elle n'a
jamais visé — et se réécrit pour dire ce qu'elle voulait dire.*

#### ⭐ Le cœur du chantier n'était pas d'allumer, c'était de **rendre la pièce**

Allumer, c'est `applyScene` sans la tuile. Rendre, c'est une question à laquelle **aucune des trois
portes du retour existantes ne répond** — et s'en servir aurait fait un dégât précis.

| Porte | Vise | Ce qu'elle aurait fait après un essai |
| :--- | :--- | :--- |
| Retour automatique | la dernière scène jouée, puis l'éclairage normal | **le noir** |
| Stop All | l'éclairage normal directement | **le noir** |
| Extinction d'urgence | rien : elle éteint | le noir, et c'est son rôle |

⛔ **Les trois visent une scène, et un après-midi de préparation n'en a joué aucune.** Les trois
tombent alors sur `extinguishAll`. *On essaie une ambiance dans une pièce allumée, un dimanche, à
côté de quelqu'un qui lit — le geste s'appelle « Revenir » et il aurait éteint le salon.*

D'où une **quatrième visée**, et le dossier répète depuis un mois qu'il ne faut pas les aligner :
**ce que la pièce montrait juste avant**. Elle ne se confond avec aucune des trois, et c'est ce qui
justifie qu'elle existe.

⭐ **La scène d'abord, le miroir à défaut.** Une scène qui jouait se **rejoue** : elle seule
rallume les *effets*, là où reposer le dernier état d'une bougie la figerait sur l'image d'un
battement.

#### ⛔ La photographie qui suivait son sujet

Le piège le plus discret du chantier, et il a son essai. L'essai pose ses lampes une par une, et
**chaque pose écrit dans le miroir du magasin** (`setLightState` appelle `updateLightState`). Une
photographie qui aurait gardé les objets du magasin se serait mise à jour toute seule — et
« Revenir » aurait rendu **exactement l'ambiance dont on voulait sortir**.

⭐ *Une photographie qui change avec son sujet n'est pas une photographie.* Les états sont copiés.

#### Refactoriser plutôt que dupliquer, comme annoncé

Le reste était écrit en ces termes : *« demande soit de dupliquer `applyScene` — avec son piège des
effets d'une scène précédente qui ne s'arrêtent pas — soit de la refactoriser »*. La boucle qui
parle au pont est sortie dans `poserLesEtats`, employée par les deux chemins : l'ordre des **deux**
messages qu'exige un effet, le répit laissé au pont, la brillance nominale envoyée au travers de
l'intensité — chacun de ces points a déjà coûté une soirée. *Deux écrivains pour une même façon de
parler au pont finissent par diverger.*

⚠️ **Et tout se tait d'abord**, y compris les lampes que l'essai ne mentionne pas — la leçon du
Stop All. Une proposition couvre bien toutes les lampes, mais *une méthode ne se repose pas sur les
bonnes manières de son appelant.*

#### Les trois décisions d'écran

| Question | Réponse | Pourquoi |
| :--- | :--- | :--- |
| « Une autre » pendant un essai ? | la pièce **suit le panneau** | sinon on lit une proposition en en regardant une autre — *un mensonge visuel* |
| Trois essais d'affilée ? | « Revenir » rend la pièce d'avant le **premier** | la photographie n'est prise qu'une fois |
| Fermer la scène en plein essai ? | la pièce est **rendue** | *une porte de sortie qui disparaît avec le panneau n'est pas une porte de sortie* |

⭐ **Et enregistrer pendant un essai rejoue la tuile sous son identifiant.** La pièce ne change pas
d'aspect, mais la grille dit enfin la vérité sur ce qui joue, et les effets se rattachent à la
tuile — donc ses curseurs de vitesse et d'intensité les commandent. *Un essai anonyme n'obéit à
aucun curseur.*

**Ancres** : `light/logic/retourDEssai.ts` (la visée), `HueEngine.poserLesEtats` (l'écrivain
unique), `HueEngine.essayerUneAmbiance` / `rendreLaPieceApresLEssai` / `oublierLEssai`,
`light/components/PropositionDAmbiance.tsx` (le bouton à deux états et le nettoyage au démontage).

**Vérifié** : `tsc -b` propre, **15 essais neufs** dont la garde du retour, éprouvée **rouge sur
le code fautif** — brancher `revenirALEclairageNormal` à la place fait tomber trois essais, dont
*« la pièce n'a pas retrouvé sa brillance : expected 40 to be 200 »*. ⚠️ **Non éprouvé à
l'écran** — et il demande de vraies lampes.

---

### 93 · ⭐ L'atelier d'effets — un effet devient de la DONNÉE (2026-09-20)

David : *« est-ce que tu as créé le module de création d'ambiance ? »* — non, et la question
valait mieux que la réponse. ⭐ **Sa mémoire était exacte** : le magasin porte sa phrase du
2026-09-18 en commentaire, *« je me demande si on ne devrait pas faire un module de création
d'ambiance »*. La réponse d'alors avait été **les variantes**. Il en voulait la moitié qui
manquait.

#### Ce qu'une variante ne sait pas faire

| | Sait | Ne sait pas |
| :--- | :--- | :--- |
| **Variante** | décliner — « la torche, mais bleue et plus lente » | inventer un **geste** |
| **Atelier** | une suite d'étapes qui n'existe nulle part | — |

Un orage lointain — deux éclairs blancs rapprochés, puis vingt secondes de bleu sombre — n'est la
déclinaison d'aucun des quarante-huit. C'est une **suite**, et aucun corps existant n'a cette
forme.

#### ⭐ La décision qui a tout décidé : un effet peut-il être de la donnée ?

Les 48 sont des `case` dans un `switch` — du **code**. Ajouter un effet demandait quatre fichiers
et une règle non écrite sur le rapport fondu/battement : *chaque idée d'ambiance passait donc par
un développeur.*

La réduction qui débloque tout tient en une phrase : **une lampe Hue ne sait qu'obéir à « va à
cette couleur et à cette brillance, en tant de temps »**. Tout le catalogue n'est que des façons
d'enchaîner cet ordre-là. Un effet est donc exprimable en quatre nombres par étape — couleur,
brillance, durée, fondu — **plus le désordre**.

⭐ ***Le désordre n'est pas un ornement, c'est ce qui sépare une suite d'un geste.*** Une bougie
sans lui est un métronome ; à 30 %, c'est une flamme. Les quarante-huit tirent tous au sort
quelque part — **aucun n'est une boucle pure**, et c'est le relevé qui l'a montré.

#### ⭐ Il se joue AVANT le `switch`, et le traverse quand même

L'astuce qui évite de tout recopier : son identifiant (`atelier:…`) ne correspond à **aucun
`case`**, donc le `switch` le laisse passer sans rien faire — et tout ce qui vient **après**
s'applique comme pour les quarante-huit autres : brillance globale, intensité de la tuile,
rabotage du fondu contre la cadence réelle.

*Un effet neuf obéit aux mêmes curseurs que les anciens sans qu'on ait écrit une ligne pour ça.*

#### ⛔ Trois décisions qui auraient pu mal tourner

**1. Adaptatif, jamais soliste.** Un effet rapide du catalogue se rationne en **éteignant des
lampes** (un stroboscope ralenti n'est plus un stroboscope). Appliquer ça ici aurait éteint des
lampes sur un effet que le meneur vient d'écrire, et il aurait cherché longtemps. ⭐ *Ralentir se
voit et s'explique ; une lampe qui ne joue pas ne s'explique pas.* On prend la **cadence
partagée**.

**2. Relu à chaque passage, pas au démarrage.** Sans ça, régler une étape pendant que la lampe la
joue n'aurait **rien fait** — et l'atelier serait devenu un formulaire. *Une couleur ne se juge
pas dans un champ de saisie* : même leçon que le curseur d'intensité du 09/09.

**3. Il écrit `on`, contrairement aux 48.** Une étape à 0 % éteint la lampe — c'est ainsi qu'on
fait un clignotement franc. Sans rallumer explicitement au passage suivant, **la première étape
noire aurait été la dernière de l'effet**.

#### ⭐ Le recensement mécanique a refusé le quatrième ayant droit

`etatARendre.test.ts` compte les appels à `stopSoftwareEffect(id, 'rendreLEtat')` et **exige que
chacun ait son propre `it`**. Un effet d'atelier peut disparaître sous la boucle — supprimé, ou
vidé de ses étapes — ce qui en fait un quatrième. Le contrôle a rougi et a fait écrire la
justification au lieu de laisser bomber le chiffre. *C'est exactement ce que son propre
commentaire annonçait : « une garde qu'on se contente d'ajuster au nouveau chiffre ne garde plus
rien ».*

#### ⚠️ Et un `reset` qui laissait du travail derrière lui

Trouvé en chemin : `useLightStore.reset()` ne vidait **pas** `variantes`. Il n'est appelé que par
les essais — mais deux fichiers d'essais partagent le même magasin dans un worker, et le second
héritait de ce que le premier avait écrit. Les deux champs de travail y entrent.

#### ✨ Et l'IA écrit la suite — demandé dans la foulée

David, le soir même : *« dans créer un effet rajoute la possibilité de se faire aider par l'IA
comme fait précédemment »*. Le patron du § 89 se recopie — schéma imposé au décodeur,
`sansPersona`, validation à part — mais **la nature de la demande change**.

⭐ ***Composer une ambiance, c'était choisir des couleurs ; composer un effet, c'est trouver un
rythme.*** Deux éclairs rapprochés puis vingt secondes de calme : *le meneur sait ce qu'il veut
voir bien avant de savoir en quels nombres ça s'écrit.* C'est le geste le plus cher que le modèle
rende dans Light-OS.

**L'invite dit ce que chaque réglage PRODUIT, pas ce qu'il est.** `fondu = 0` fait un éclair,
`fondu = duree` fait une dérive, `brillance = 0` sur une étape courte fait le noir qui donne le
rythme. *Un modèle à qui l'on décrit un champ rend un champ rempli ; à qui l'on décrit un effet,
il rend un effet.*

⛔ **Et la validation jette là où les bornes repeignent.** `etapeBornee` remplace une couleur
illisible par du blanc — bon pour une saisie humaine, que le meneur voit et corrige. Pour une
sortie de modèle, non : *une étape manquante se voit ; une étape fausse se croit.* Un blanc glissé
au milieu d'un orage passerait pour une intention.

⚠️ **Un `alea` absent vaut 25 et non zéro** : un modèle qui oublie ce champ rendrait une boucle
parfaitement régulière, qui ressemble à une machine. *Le défaut d'un champ oublié doit être celui
qui donne le meilleur résultat, pas celui qui se calcule le plus vite.*

⛔ **On remplace sur accord, jamais d'office** (tranché par David) : l'atelier enregistre en
continu et **n'a pas d'annulation**. Le nom proposé n'est repris que si l'effet porte encore un nom
par défaut — *on ne renomme pas ce que le meneur a nommé.*

**Ancres** : `light/logic/effetDAtelier.ts` (le modèle, `imageDeLEtape`, les bornes),
`light/logic/proposerUnEffet.ts` + `light/logic/effetPropose.ts` (l'IA et son contrôle),
`light/components/AtelierDEffet.tsx` (l'écran), `SelecteurDEffet.tsx` (section **Mes effets** et
la porte d'entrée), `HueEngine` (la branche avant le `switch`), `useLightStore`
(`effetsDAtelier` et ses trois gestes), `donneesDurables.ts` + `schemas.ts` + `SessionService`
(les trois maillons de la sauvegarde).

**Vérifié** : `tsc -b` propre, **46 essais neufs** (20 sur le modèle, 18 sur la validation de ce
que rend l'IA, 7 sur le magasin et la sauvegarde, 1 au recensement).
✅ **ÉPROUVÉ À L'ÉCRAN le 2026-09-20** — David : *« ça marche très bien »*, l'atelier et l'IA qui
écrit la suite. ⚠️ **Non éprouvé à l'écran**, et il demande de vraies
lampes.

---

### 94 · ⛔ Un moment de storyboard ne savait pas quels SONS charger (2026-09-20)

David : *« dans le master storyboard, je ne peux pas choisir le thème sur lequel je veux charger
une ambiance d'Ambient-OS »*. Ce n'était pas un oubli d'écran : **un maillon manquait**.

#### Deux notions, une seule branchée

| | Ce que c'est | Ce que le moment pouvait dire |
| :--- | :--- | :--- |
| **Le thème** (`presets`) | *quels sons* remplissent les huit pistes | ⛔ rien |
| **La scène** (`scenes`) | *à quel volume* ces huit pistes jouent | ✅ `ambientSceneId` |

Un moment ne savait donc régler que le **mélange**, jamais la **matière**. « Tension »
s'appliquait au thème d'une scène précédente — ou à huit emplacements vides.

#### ⛔ Et huit emplacements vides ne produisent aucune erreur

`applyScene` n'allume une piste que si elle porte une adresse. Sans adresse, la boucle **passe** :
pas de `warn`, pas de `catch`, pas de ligne au journal. L'appel réussit, le rapport du moment
disait « Ambiance : joue », et la pièce restait silencieuse.

⭐ ***Une ambiance qui ne sort pas ressemble à une ambiance discrète.*** C'est la forme la plus
coûteuse du silence : elle ne ressemble même pas à une panne.

⚠️ **C'est probablement l'incident sans trace du 13/09**, toujours ouvert au § 1 bis : *« la
séquence de storyboard s'est mal exécutée en séance : pas d'image projetée, lumières éteintes,
**ambiance interrompue** »*. La ligne reste ouverte tant qu'elle n'est pas reproduite — *un
diagnostic plausible n'est pas une reproduction* — mais elle a maintenant un suspect nommé.

#### Les quatre combinaisons, et celle qui a demandé une décision

| Thème | Scène | Ce qui se passe |
| :--- | :--- | :--- |
| — | — | rien |
| ✓ | — | le thème se charge **et démarre** |
| — | ✓ | la scène dose ce qui est déjà chargé — les moments d'avant marchent tels quels |
| ✓ | ✓ | le thème se charge **à l'arrêt**, puis la scène décide |

⭐ **Le thème seul démarre, et c'est un choix de David.** Ambient-OS charge à l'arrêt — juste à
l'écran, où l'on prépare avant de lancer. Mais *un moment de storyboard est un déclenchement :
s'il ne produit aucun son, il passe pour une panne.*

⛔ **Et surtout pas quand une scène suit** : les huit pistes sonneraient une seconde avant que la
scène n'éteigne celles qu'elle ne veut pas. *Un coup de tonnerre au mauvais moment est pire qu'un
silence.*

#### ⭐ Un cinquième sort pour le rapport du moment

Le rapport ne connaissait que `joue`, `introuvable`, `module-absent`, `non-demande`. Aucun ne dit
*« l'appel a réussi et il n'y avait rien à jouer »* — et c'est exactement le cas. D'où
**`sans-matiere`**, qui compte parmi les manques et se lit « **aucun son chargé** ».

⚠️ **Le mot compte autant que le sort** : ni « introuvable » (la scène existe), ni « module non
chargé » (il a répondu). Il manque un **thème**, et c'est cela que le meneur doit lire. *Trois
causes, trois gestes.*

#### ⭐ La capture avait quelque chose à prendre, et on l'ignorait

Le guide et le code disaient tous deux « Ambiance : ⛔ rien à capturer », au motif qu'Ambient-OS
ne retient pas quelle scène est appliquée. C'était vrai — **de la scène**. Le magasin retient en
revanche `themeChargeId` depuis qu'il existe, et personne ne le lisait.

⭐ ***Une capacité déclarée que personne ne lit n'est pas une capacité*** — la même phrase que
les pièces jointes perdues en route vers Ollama, et que la couleur de grille sans écran.

**Ancres** : `storyboard/ambianceDuMoment.ts` (l'ordre des gestes),
`storyboard/logic/rapportDuMoment.ts` (`sans-matiere`), `useStoryboardStore`
(`ambientThemeId` et le bloc 6), `StoryboardDashboard.tsx` (les deux listes, l'avertissement quand
la scène est seule, et la capture du thème).

**Vérifié** : `tsc -b` propre, lint sans rien de neuf, **12 essais neufs**. ⚠️ **Non éprouvé à
l'écran.**

---

### 95 · ⛔ Deux des trois volumes n'existaient pas — et le dosage d'un moment (2026-09-20)

David : *« je voudrais pouvoir définir le volume de Music-OS, Ambient-OS et Sound-OS »* dans un
moment de storyboard. La demande tenait en trois champs ; **la vérification avant de brancher a
rendu tout autre chose.**

#### Ce que le relevé a montré

| Module | Son volume général | État réel |
| :--- | :--- | :--- |
| **Music-OS** | `setMasterVolume` → `musicEngine.setMasterVolume` | ✅ agissait |
| **Sound-OS** | `setMasterVolume` → `set({ masterVolume })` **et rien d'autre** | ⛔ n'agissait sur rien |
| **Ambient-OS** | idem, et **personne ne l'écrivait ni ne le lisait** | ⛔ champ mort |

⛔ **Pour Sound-OS, la chaîne était complète sauf le dernier fil.**
`SoundEngine.setMasterVolume` était écrite, soignée, elle menait même les **voies détournées**
vers les autres enceintes — et elle n'avait **aucun appelant**.

⭐ **Conséquence visible, et elle durait depuis toujours : le curseur de volume du soundboard de
la tablette ne faisait rien.** `remote:sound:volume` → `audioActions.setVolume` →
`useSoundStore.setMasterVolume` → un nombre rangé dans un magasin que rien ne lit. Un réglage
offert à portée de pouce, sur une tablette posée sur la table, **muet**.

⭐ ***C'est le motif « une chaîne complète sans bouton au bout », pris à l'envers : le bouton
existait, c'est le fil qui manquait.*** Huitième occurrence de cette famille dans ce dépôt — et la
première dans ce sens-là.

⚠️ **Ambient-OS était un cran plus loin** : `masterVolume` y était initialisé, **persisté**,
**restauré des instantanés**, envoyé dans `applySnapshot`… et aucun nœud du graphe audio ne le
portait. *Un réglage persisté que personne n'applique coûte plus cher qu'un réglage absent : il se
sauvegarde, il voyage, il se restaure, et il ne fait rien.*

#### ⛔ Le nœud qu'il ne fallait pas réutiliser

Ambient-OS a bien un `masterGain`, mais sa valeur est **1,3 — une compensation de gain**, pas un
réglage. Y multiplier le volume du meneur aurait rendu la constante irrécupérable : *plus personne
n'aurait su ce qui venait du code et ce qui venait de lui.* D'où un `volumeGain` séparé, et un
**troisième facteur** dans le produit que les voies détournées reproduisent.

#### ⭐ Le piège de cette fonctionnalité ne se produit qu'à UNE valeur

« Couper la musique sur ce moment » s'écrit **0**. Or tout ce formulaire range ses champs
facultatifs avec `valeur || undefined` — qui transforme ce zéro en « ne touche à rien ». Le moment
aurait fait **l'inverse exact** de ce qu'on lui demande : la musique à plein volume sur le silence
voulu.

⭐ ***Un défaut qui ne se produit qu'à une seule valeur est un défaut qu'aucune relecture ne
voit.*** L'état de l'écran est donc `number | null`, l'enregistrement emploie `?? undefined`, et un
essai interdit nommément la confusion.

#### Les décisions

| Question | Réponse | Pourquoi |
| :--- | :--- | :--- |
| Saut ou fondu ? | **fondu, réglable par source** (choix de David) | *un saut de niveau s'entend comme une fausse manoeuvre, un fondu comme une intention* — et couper net un bruitage pendant que la musique descend est un geste légitime |
| Quelle courbe ? | **rampe linéaire** | `setTargetAtTime` s'approche sans atteindre : un « coupe le son » finirait à un cheveu de zéro, **et le cheveu s'entend dans une pièce silencieuse** |
| Quand poser ? | **après tout le reste** | un volume posé avant le démarrage d'une musique serait écrasé par elle |
| Le niveau se rend-il ? | **non** | un moment **pose** un niveau, il ne l'emprunte pas. *C'est un réglage, pas une parenthèse* — et le guide le dit |

**Ancres** : `storyboard/volumesDuMoment.ts` (la règle et le piège du zéro),
`sound/SoundEngine.ts` + `useSoundStore` (le fil manquant), `ambient/AmbientEngine.ts`
(`volumeGain`, le troisième facteur) + `useAmbientStore`, `music/MusicEngine.ts` (le fondu),
`useStoryboardStore` (les six champs et le bloc 7), `StoryboardDashboard.tsx` (les trois lignes).

**Vérifié** : `tsc -b` propre, lint sans rien de neuf, **11 essais neufs**. ⚠️ **Non éprouvé à
l'écran** — et le curseur de la tablette mérite un essai à part, puisqu'il est réparé sans avoir
été demandé.

---

### 96 · ⭐ Les étiquettes du Media Hub — empêcher le doublon, et réparer celui qui est là (2026-09-21)

David : *« je voudrais que la gestion des tags dans le Media Hub soit plus intelligente »*. Quatre
lectures possibles, toutes retenues — saisie assistée, étiquetage en lot, propositions
automatiques, filtres plus fins.

#### ⛔ Le défaut qui les engendre tous

Le champ de saisie ne proposait **rien**. Chaque étiquette se retapait de mémoire, donc chaque
frappe était une occasion de créer un quasi-doublon : `taverne`, `tavernes`, `Taverne`. Trois
entrées dans la liste latérale, trois filtres rendant chacun un tiers des fichiers. Et **rien ne
permettait de les fusionner ensuite**.

⭐ ***Un vocabulaire qu'on ne peut pas corriger se corrompt à chaque ajout.*** Les quatre demandes
n'étaient pas quatre fonctionnalités : c'étaient les deux bouts d'un même problème — ce qui
**empêche** le doublon, et ce qui **répare** celui qui existe.

#### Les décisions qui font la différence

| Question | Réponse | Pourquoi |
| :--- | :--- | :--- |
| Les accents ? | **gardés** à l'écriture, ignorés à la comparaison | *une bibliothèque française qui s'écrit sans accents a l'air cassée* — mais `foret` et `forêt` sont la même étiquette |
| Le pluriel ? | le `s` tombe à partir de **quatre** lettres | sinon `bois` devient `boi` et `os` devient `o` |
| Renommer / fusionner / supprimer ? | **un seul geste** | renommer vers une étiquette existante *est* une fusion ; vers rien, *est* une suppression. Trois écrans auraient demandé de savoir d'avance lequel on fait |
| L'exclusion ? | **dans la barre**, pas dans la liste | une liste à cocher demanderait un **troisième état** par étiquette, sur cent étiquettes |
| Un refus en mode OU ? | il s'applique quand même | *dire « sauf les combats » et voir des combats serait un réglage qui ment* |
| L'IA à l'import ? | **non** (choix de David) | le nom du fichier suffit dans neuf cas sur dix, et il est gratuit, instantané, hors ligne |

#### ⭐ Le nom du fichier disait déjà tout

`taverne-nuit-pluie.jpg` porte trois étiquettes, et arrivait dans la bibliothèque sans aucune.
*Le travail était fait, il n'était simplement pas lu.*

⛔ **Mais une proposition préfère TOUJOURS un mot du vocabulaire existant.** Proposer `tavernes`
quand la bibliothèque connaît `taverne`, ce serait fabriquer le doublon qu'on cherche à éviter
— *par automatisme, donc à grande échelle.* Et on propose : on ne pose jamais. *Une étiquette
fausse posée d'office est pire qu'une absence d'étiquette, parce qu'elle se retrouve dans un
filtre.*

#### ⭐ L'avertissement arrive AVANT la validation

« Vouliez-vous dire ? » s'affiche pendant la frappe, quand la saisie est à **une** correction d'une
étiquette connue. *C'est le seul moment où corriger ne coûte rien : après, il faut un second
geste, et personne ne le fait.*

La distance d'édition s'arrête au plafond au lieu de se calculer entièrement — *on ne mesure pas
une ressemblance, on cherche une faute de frappe*, et c'est ce qui la rend tenable sur cent
étiquettes à chaque lettre tapée.

#### ⚠️ Deux gestes de masse, une même prudence

`renommerDansLaBibliotheque` et `appliquerEnLot` rendent **uniquement les médias qui changent** :
*réécrire les deux cents autres pour rien, c'est deux cents écritures IndexedDB et un miroir qui
recopie tout.* Côté magasin, une **seule** transaction et un **seul** `set` — la leçon de
l'import multiple, où trente écritures lancées ensemble étaient la course déjà payée.

⛔ Et un échec au milieu n'arrête pas les autres : le compte rendu porte sur ce qui a
**réellement** été écrit. *Un geste de masse qui s'arrête au milieu sans le dire laisse une
bibliothèque à moitié renommée, ce qui est pire que pas de renommage du tout.*

**Ancres** : `components/media/vocabulaireDesTags.ts` (forme, comparaison, distance, suggestions,
renommage, lot), `components/media/tagsProposes.ts` (le nom du fichier),
`components/media/filtreDeTags.ts` (`#tag`, `-tag`), `stores/useMediaStore` (`appliquerDesTags`),
`components/MediaBrowser.tsx` (barre du lot, sélection, renommage, classement par usage),
`image/components/TacticalDetailPanel.tsx` (la saisie assistée).

**Vérifié** : `tsc -b` propre, lint sans rien de neuf, **57 essais neufs**, **5 703 essais** au
vert (446 fichiers), 29 E2E.
✅ **ÉPROUVÉ À L'ÉCRAN le 2026-09-21** — David : *« ça fonctionne »*.

---

### 97 · ⭐ La boucle d'une vidéo se choisit — le choix à confirmer du 05/09 est tranché (2026-09-21)

David, après avoir éprouvé la projection : *« c'est bien que cela boucle, mais je voudrais avoir
le choix »*. La ligne traînait au § 22 à l'état de **choix à confirmer** depuis seize jours — la
boucle était le comportement d'origine, jamais décidé.

⭐ *Une ligne garée avec son motif se rouvre toute seule le jour où quelqu'un s'en sert.*

#### ⛔ Le défaut à ne pas commettre : DEUX lecteurs

Une vidéo projetée est rendue par **deux** `<video>` distincts — `ProjectorView` pour le moniteur,
`FondProjete` pour l'écran de la table et les tablettes. Ne brancher que le premier aurait donné
le plus absurde des résultats : *le même film tournant en rond d'un côté et s'arrêtant de
l'autre.*

#### ⛔ Et le second lecteur ne peut PAS lire le réglage

Une tablette est sur une autre origine : elle ne lit pas la base du meneur. Elle reçoit une
**adresse déjà résolue**, sans extension — c'est déjà pour cette raison qu'on lui **annonce** la
nature du média depuis le 05/09. La boucle voyage donc par le même pont, dans un message
`video-boucle`, **émis avant** la vidéo : *l'envoyer après laisserait un battement où le réglage
d'avant s'applique.*

⚠️ Et il se **rend** à chaque projection d'image, comme le drapeau voisin : *un réglage qu'on
pose sans jamais le rendre s'applique à la vidéo suivante, qui ne l'a pas demandé.*

#### ⭐ L'absence vaut BOUCLE, et c'est le point qui compte

Toutes les vidéos déjà rangées n'ont pas ce champ. Les lire comme « joue une fois » aurait
changé le comportement de **toutes les ambiances existantes d'un coup**, sans que personne ne
l'ait demandé.

⭐ ***Un champ neuf ne doit jamais rendre faux ce qui marchait avant lui.*** La règle vit dans
`boucleDeLaVideo.ts` — un fichier de six lignes utiles, qui existe uniquement **parce que deux
lecteurs la posent**.

#### La fin d'une vidéo qui ne boucle pas

✅ **Sa dernière image**, figée, jusqu'au Blackout (choix de David). *Rien ne quitte l'écran sans
que le meneur l'ait demandé.* Les deux autres fins envisagées — le noir, ou l'image d'avant —
éteignaient ou changeaient l'écran toutes seules au milieu d'une scène ; la seconde aurait en
prime inventé **un quatrième geste de retour**, ce que Light-OS a appris à ne pas faire sans
raison.

#### ⭐ Le réglage vit sur le MÉDIA, pas sur la pastille

La même vidéo se déclenche depuis Image-OS, depuis un moment de storyboard et depuis une
tablette. *Un réglage posé sur un seul de ces chemins serait un réglage qu'on croit avoir posé.*

**Ancres** : `components/media/boucleDeLaVideo.ts` (la règle), `stores/useMediaStore`
(`boucler`, `basculerLaBoucle`), `image/logic/ImageService.ts` (l'émission),
`session/hooks/useHubSync.ts` (`liveVideoBoucle`), `ProjectorView` et `hub/FondProjete` (les deux
lecteurs), `TacticalDetailPanel` (l'interrupteur).

#### ⛔ Et l'interrupteur était introuvable — corrigé dans la foulée

David, une heure plus tard : *« je ne vois pas comment dire qu'une vidéo ne doit pas se
répéter ? »*. Le réglage existait, au Media Hub, derrière un bouton **`+`** qui n'annonce pas
« détails ». Et surtout : **il avait cherché dans Image-OS**, là où le geste se fait.

⭐ ***Une fonctionnalité qu'on ne voit pas est une fonctionnalité absente*** — la leçon du Media
Hub, dont la recherche est restée invisible à 5 % d'opacité. Une seconde porte est donc posée
**sur la pastille d'Image-OS**, au survol, à côté de l'étoile.

⚠️ **Deux portes, une seule vérité** : le réglage vit toujours sur le média, et les deux écrans
lisent le même champ. *Deux portes vers un même réglage sont un confort ; deux réglages derrière
deux portes sont un défaut.*

⭐ Et c'est la **deuxième fois en deux jours** qu'une porte manque : l'atelier d'effets n'est
atteignable que par une lampe, ce qui reste ouvert.

#### ⛔ La seconde porte était fausse — DEUX identifiants sur un même objet

David, aussitôt après : *« je ne sais pas cliquer sur le bouton de boucle sur le pad »*. Le bouton
était là, visible, et il n'écrivait rien.

⛔ **Un pad d'Image-OS porte deux identifiants.** `media.id` est celui **du pad** ; `media.path`
est celui du **fichier dans le Media Hub** — et c'est `path` que `projectSolo` envoie au
projecteur depuis toujours. L'interrupteur lisait `id` : il cherchait une fiche inexistante,
affichait donc **toujours** « boucle », et le clic écrivait dans le vide. L'erreur partait dans la
console, *que personne ne lit en séance.*

⭐ ***Deux identifiants sur un même objet finissent toujours par être confondus ; celui qui est
juste est celui que le reste du code emploie déjà.***

⚠️ **Et le bouton ne s'affiche plus quand le Media Hub ne connaît pas le fichier** : un pad qui
pointe un fichier libre du disque n'a nulle part où ranger le réglage. *Mieux vaut pas de bouton
qu'un bouton qui n'écrit rien* — ce qui est exactement ce qu'on venait de livrer.

⭐ **Le garde-fou lit la SOURCE**, comme le recensement de `rendreLEtat` : aucun type n'exprime
« cet identifiant-ci et pas celui-là », et *un identifiant confondu ne lève aucune erreur — il
rend simplement `undefined`.* Éprouvé **rouge sur le code fautif** : réinjecter `media.id` fait
tomber deux essais de `pastilleDeBoucle.test.ts`.

**Vérifié** : `tsc -b` propre, lint sans rien de neuf, **10 essais neufs**, **5 713 essais** au
vert (448 fichiers), 29 E2E. ⚠️ **Non éprouvé à l'écran** — et les deux portes doivent l'être,
puisque la seconde était fausse.

---

## La vue d'un coup d'œil

| # | Chantier | État | Le premier geste | Bloqué par |
| --- | --- | --- | --- | --- |
| 1 | **Afficheur Ulanzi** | ✅ **CONSTRUIT le 23/08, ÉPROUVÉ EN RÉEL le 30/08** — trois défauts de restitution trouvés et corrigés | La séance de Blade Runner elle-même | Rien |
| 2 | **Deck-OS — garder la carte** | ✅ **CONSTRUIT et ÉPROUVÉ EN RÉEL le 30/08** — quatrième tas, don entre joueurs, pioche par le joueur, onglet Cartes | — | Rien |
| 3a | **Thème par jeu** | ✅ **LIVRÉ le 24/08** | — *vérifié en réel sur Hadley Hope* | Rien |
| 3b | **Fiche HTML** | ✅ **LIVRÉE SUR LES DEUX ÉCRANS le 28/08** | Étapes 5 et 6 — le `hotspot` et `humanite` par la Forge | Rien |
| 4 | **Sauvegarde des images** | ✅ **ÉPROUVÉE EN RÉEL le 29/08** — aller **et** retour | — | Rien |
| 5 | **Sauvegarde de la bibliothèque des fiches** | ✅ **ÉPROUVÉE EN RÉEL le 29/08** — aller **et** retour | — | Rien |
| 6 | **Loot-OS & le pont vers Table-OS** | ✅ **LIVRÉ le 04/09** — jamais joué en séance (P6) | Tirer sur `fouille_ganger`, verser, distribuer | Rien |
| 7 | **La voix des PNJ de campagne** | ✅ **LIVRÉE le 04/09** — jamais jouée en séance (P6) | Générer la voix d'un PNJ, la retoucher, la rappeler | Rien |
| 9 | **Light-OS, la journée du 07/09** | ✅ **CINQ CHANTIERS, tous vérifiés à l'écran** — vitesse des effets par tuile (§ 29), éclairage normal de la pièce (§ 30), les trois promesses du guide que rien ne tenait (§ 31), la couleur de tuile invisible et les icônes télescopées (§ 32). ⚠️ **Quatre des sept défauts de la journée sont nés dans la journée** : chaque livraison a déplacé quelque chose sur le même carré | — | Rien |
| 10 | **Light-OS, la journée du 09/09** | ✅ **TROIS CHANTIERS, vérifiés à l'écran** — l'intensité par tuile, la brillance par lampe, et le bouton qui arrête une scène sans éteindre la pièce (§ 37), puis trois suggestions prises au mot — **deux** chemins de flash qui ignoraient le curseur global, l'arrêt absent du journal, et Échap (§ 38). ⛔ **Le troisième n'était pas un manque, c'était un geste écrit le 07/09 que rien n'appelait** : quatrième fois en trois jours que la chaîne est complète et que le bouton manque au bout | — | Rien |
| 11 | **L'audit du 09/09 — les trous** | ✅ **TOUT EST TRAITÉ, décisions comprises** (§ 39) : le PDF que la Forge n'a jamais lu, le contrôle du contrat du pont, les neuf clés affichées en clair et leur angle mort, le storyboard qui signait du nom du meneur, le bouton du cockpit, la branche morte des tablettes, et la ligne de journal du moment. ⛔ **Une erreur d'audit corrigée en chemin** : `highlightMapToken` ne « n'avait jamais marché » — *la fonctionnalité existait déjà*, c'était une seconde façon impérative de la demander (§ 39b). La liste d'exceptions du contrôle du pont est **vide** | — | Rien |
| 8 | **Revue des guides, écran par écran** | ✅ **CLOSE le 05/09** — 38 guides, dix lots, **cent deux trouvailles toutes traitées** : réparées, tranchées par David, ou documentées avec leur raison (§§ 12 à 17). ⛔ **Cette ligne a dit « ouverte, réparer N1 » jusqu'au 07/09** alors que N1 était réparé depuis le 04/09 (`NexusService.ts:1642`, fusion par identifiant) et la voie B close le 05/09 au § 17 — *le registre s'est contredit lui-même sur deux lignes distantes de 700, exactement ce qu'il reproche aux autres documents* | — | Rien |
| 12 | **Refonte de l'interface** | ⛔ **OUVERT, RIEN DE COMMENCÉ (17/09)** — trois maquettes apportées par David. ⭐ La mesure a montré que **le système de design existe et est adopté à moitié** : 4 566 jetons `app-*` contre 4 124 classes brutes, qui sont presque toutes des couleurs d'**état** sans jeton pour les nommer. Trois manques se posent dans **un fichier**, le quatrième (les primitives) coûte 214 fichiers — *le plan interdit de les mélanger* (§ 76). ⭐ **Second but, rappelé par David le soir même : l’interface doit s’adapter au JEU** — le pont existe déjà (8 jetons, polarité, polices), il s’agit de l’étendre, et **cette exigence contraint chaque échelle ajoutée** | **T0.1** — les captures Playwright de référence, une soirée, aucun pixel changé | **Rien** — les cinq questions sont tranchées. Seule la partie de David précède |
| 13 | **Light-OS — effets** | ✅ **AUDIT + FUSILLADE + 7 EFFETS + LES SOLISTES le 17/09** — six défauts de cohérence matérielle corrigés (dont `warp` injoignable et `bri: 0` qui n'éteint pas), l'arrêt restaure enfin l'état, ⭐ **la catégorie COUP UNIQUE** est née, et la fusillade **compte le budget du pont** (son essai de simulation a réfuté ma conception deux fois). 37 → **46 effets** (dont ⭐ **trois feux enfin distincts** — la Bougie manque de s'éteindre, le Feu de camp crépite, l'Incendie s'embrase : ils étaient **deux copies d'un même corps**), et ⭐ **le budget du pont est enfin tenu par TOUS les effets** : un effet rapide ne joue que sur 1 à 3 lampes selon sa cadence, les autres gardent la couleur de la scène | — | Rien. ⚠️ **Rien n'a été vu dans la pièce** |
| 14 | **La saccade du tableau blanc** | ✅ **CORRIGÉ le 17/09, sur trois étages** — ⛔ un magasin persisté écrit à **chaque** `set()`, et **deux modules avaient écrit la croyance inverse** dans leur `partialize`. Mesuré : **1,75 ms de `JSON.stringify` et 285 Ko écrits par point** sur un tableau de cent tracés, trois écritures par mouvement de pion sur la carte. ⭐ **Et on payait pour ce que personne ne recevait** : le réseau jetait déjà quatre points sur cinq. Écriture différée (250 ms, trois filets), diffusion limitée à la cadence réellement consommée, et une mutation au lieu de deux (§ 78). ⛔ **Un essai de 2026-08 a trouvé un vrai défaut de mon tampon** : il servait en lecture des écritures que la garde avait refusées | — | Rien. ⚠️ **À confirmer à l'écran** |
| 15 | **Les dés en 3D du Player Hub** | ✅ **REFAITS le 17/09** — ⛔ quatre manques, dont trois qui ne se règlent pas : **aucun chiffre**, une orientation finale **tirée au sort** (donc sans rapport avec le jet), du **verre sans rien à réfracter**, et un **d100 sphérique**. ⭐ Deux défauts trouvés en chemin : le démontage **détruisait les géométries partagées** (plus rien ne s'affichait au remontage), et **le d10 n'était pas un trapézoèdre** — vingt facettes au lieu de dix, dont cinq à l'envers. ⭐ *Un dé n'a de faces que le jour où on veut écrire dessus.* Chiffres, atterrissage sur la valeur, environnement, ombre au sol, et **trois matières au choix du meneur** (§ 79) | — | Rien. ⭐ **2e passe** : ⛔ le réglage **n'arrivait jamais au Hub** (le segment `dice` portait 3 champs sur 5, et il était écrit **deux fois**) — *un réglage qui ne voyage pas jusqu'à l'écran qui l'applique n'est pas un réglage, c'est un bouton* ; et les dés étaient **enfermés** dans une couche `z-[60]` parente. ⭐ **3e passe** : les dés **s'effacent une fois posés** et le résultat tient **5 s de plus** — *la pose est un événement, pas une durée*, avec deux filets qui dégradent vers le comportement d'avant. ⭐ **4e passe** : les dés **ne se traversent plus** (sphères au rayon moyen, calculé par solide, séparation appliquée **aussi aux dés posés**) et le placement de départ ne les fait plus naître imbriqués ; ils restent **2 s posés** avant de s'effacer. ⛔ **Une mutation de contrôle ne s'était jamais appliquée** — fins de ligne mixtes — *et un essai vert sur du code intact ressemble à une garde qui marche*. ⚠️ **À confirmer à l'écran**, le verre en premier |
| 16 | **Le décor de campagne au repos** | ✅ **CORRIGÉ le 17/09** — ⭐ **la fonctionnalité existait de bout en bout** (champ, réglage, transport, réception, affichage) et la campagne ouverte avait bien une image : ⛔ **quatre chemins écrivaient `data || null`**, et arrêter une projection envoie une chaîne vide — donc `null`, donc *écran éteint* au lieu de *rien à montrer*. Le correctif du 13/09 n'avait traité qu'un cinquième chemin. ⭐ **Les deux gestes sont désormais séparés** : `Ctrl+0` rend le décor, `Ctrl+Maj+0` éteint vraiment (§ 80) | — | Rien. ⭐ **2e passe** : il ne revenait toujours pas **au lancement** — le Hub lisait le seul champ **non persisté** des deux, au lieu de déduire le décor de `campaigns[]` qu'il a déjà sur son disque. ⛔ **3e passe** : j'avais **détourné les boutons rouges** qu'il utilise pour arrêter une projection — *un libellé décrit une intention, un geste quotidien EST une intention* ; le noir a désormais son propre bouton. ⚠️ **6 campagnes sur 7 n'ont aucune image de fond** |
| 17 | **Repartir de zéro sur un jeu ou une campagne** | ✅ **CONSTRUIT le 18/09** — ⛔ la cause n'était pas un oubli : le dossier `docs/systems/<jeu>/` survivait, et **la Forge enrichit un corpus existant** — donc reforger ne repartait *jamais* de zéro. `deleteGameDriver` tenait en **une ligne**, `deleteCampaign` ignorait sept modules dont le **butin**. ⭐ Un **registre des détenteurs** et un **test qui lit les sources** et refuse un magasin persisté non déclaré. Aperçu cochable lot par lot, **quarantaine** dans `docs/_purges/` et instantané préalable — rien n'est supprimé (§ 81). ⚠️ **`ai:list-dir` ne rend que des fichiers** : défaut préexistant laissé en place, à traiter | Ouvrir la gomme sur un jeu déjà forgé et lire l'aperçu | Rien. ⚠️ **Rien n'a été vu à l'écran** |
| 18 | **Les images collées dans l'état** | ✅ **CORRIGÉ ET ÉPROUVÉ EN RÉEL le 18/09** — ⛔ **2 078 Ko sur 2 746** de la sauvegarde étaient DEUX images en base64, et les quatre fournisseurs pouvaient les refaire : `addMedia` rendait l'identifiant, **ils le jetaient**, et le repli muet rendait l'image entière. ⭐ *C'est le nom de la variable — `mediaId` — qui a caché le défaut.* La réparation **existait déjà** et n'avait jamais été lancée ; son angle mort était NPC-OS. Migration réelle : **2 812 229 → 683 961 octets** (§ 82). ⛔ **Et la sauvegarde a refusé d'écrire pendant plus d'une heure** — la garde anti-rétrécissement n'a pas de porte pour une baisse légitime | ✅ **Correctif posé le soir même** : la migration déclare la baisse, contrôle vu rougir. Filet rétabli à 18 h 36 | Rien |
| 19 | **L'écriture du magasin de session** | ✅ **DIFFÉRÉE le 18/09** — 163 `set()` sérialisaient chacun l'état durable entier. Une écriture par fenêtre de 250 ms, l'enveloppe **au-dessus** du stockage JSON (le coût est le `stringify`, pas le disque : IndexedDB est asynchrone). ⛔ La garde porte **avant** le tampon, sans quoi une écriture interdite serait servie en lecture. ⚠️ **J'avais annoncé « un seul magasin diffère » : ils sont HUIT** (§ 83) | — | Rien. ⚠️ **Non vu en séance** |
| 20 | **Le chantier des sélecteurs** | ⛔ **N'AURA PAS LIEU, et c'est une décision mesurée** — harnais de profilage React construit (`GMOS_PROFILAGE=1`, `actualDuration`, mesure sur la **vraie base**). Résultat : **79 composants et 2,24 ms** perdus par changement, mais ⭐ **le coût ne dépend pas du volume de données** — c'est la structure, pas la donnée. `App.tsx` s'abonnait au magasin entier pour UN champ : corrigé, gain 2,24 → 2,00 ms seulement. ⛔ **Deux versions de la mesure étaient fausses** (rAF puis chronomètre) (§ 84) | Tirer le fil de `useNexusSynchronizer`, qui s'abonne à TOUT changement | Rien |
| 21 | **Light-OS — la soirée du 18** | ✅ **DEUX EFFETS, LES AMBIANCES ET UN ÉCRAN VOLANT** — ⛔ *« pas assez dorée »* : sur une Hue, c'est le **canal bleu** qui décide entre l'or et le blanc (154 contre 33 pour la torche). ⛔ **36 effets sur 47 figent leur palette**, donc une ambiance reteinte **après** le switch — et on mélange à 70 %, sinon un gyrophare devient monochrome. ⭐ **Stores** : l'illusion vit **entre** les lampes, d'où un décalage stable étalé par le nombre d'or. ⛔ *« je ne retrouve pas mes copies »* — la chaîne était complète **sans porte pour y revenir** : la liste déroulante de 50 entrées devient un **écran volant** qui cherche, y compris par l'effet d'origine d'une copie. Corrigé au passage : le **fondu** n'était raboté que dans la source, pas après le curseur de vitesse (§ 85) | Poser **Stores** sur deux ou trois lampes | Rien. ⚠️ **Stores non vu dans la pièce** |
| 22 | **Light-OS — relire les lampes** | ✅ **LIVRÉ ET ÉPROUVÉ À L'ÉCRAN le 19-20/09** — le miroir ne connaissait que ce que GM-OS avait envoyé, donc un réglage fait au **téléphone** était invisible et la capture enregistrait une ambiance que plus personne ne voyait. ⛔ **Le pont rend de l'EFFECTIF, le magasin garde du NOMINAL** : recopier tel quel éteint une scène par étapes en deux allers-retours. ⛔ Une lampe **sous effet** ou **injoignable** ne se relit jamais (§ 86) | Régler deux lampes au téléphone, puis « Relire les lampes » | Rien. ✅ **Éprouvé à l'écran** (*« tout fonctionne »*) — ⚠️ l'E2E ne pourra jamais le couvrir |
| 23 | **Light-OS et Sound-OS dans la sauvegarde** | ✅ **LIVRÉ et ÉPROUVÉ À L'ÉCRAN le 19/09** (*« j'ai appliqué les tests cela fonctionne »*) — les deux n'étaient dans **aucune** sauvegarde : **5ᵉ et 6ᵉ** oubli de cette liste. ⛔ La garde « un instantané vide n'en remplace jamais un plein » **ne refusait rien** ici (18 tuiles et 1 atmosphère existent toujours). ⛔ Et le piège était le **DÉCLENCHEUR**, comme `databases/` : ⚠️ s'abonner large aurait tué la sauvegarde pendant les séances (§ 87) | Rien | Rien. ⚠️ La **restauration** en répétition reste à essayer |
| 24 | **Les tuiles par campagne** | ✅ **LIVRÉ le 19/09, ÉPROUVÉ À L'ÉCRAN le 20/09** — chaque campagne a ses **18 cases**, plus un pot commun ; aucune migration, aucun identifiant changé. La règle de rattachement a **déménagé** dans `src/logic/` plutôt que d'être recopiée. ⛔ Le **clavier** était le 6ᵉ lecteur, et le pire. ⭐ Deux règles du matin se sont **inversées** l'après-midi. ⛔ La **fusion des instantanés** : le même remplacement en bloc écrit **quatre fois** (§ 88) | Ouvrir une campagne, vérifier les trois sections de la grille, **traîner un curseur de tuile** | Rien. ✅ **Vu à l'écran** |
| 25 | **L'IA compose une ambiance** | ✅ **LIVRÉ ET ÉPROUVÉ À L'ÉCRAN le 19/09** (*« c'est bien »*) — sous le champ *Ambiance* d'une scène de la trame. Elle **compose** lampe par lampe plutôt que de choisir parmi l'existant. ⛔ La **validation est le cœur** : un effet inventé ne lève aucune erreur, il rend une lampe muette. Range dans le râtelier de la campagne, complète le moment de la scène sans le doubler (§ 89) | Light-OS en **mode simulé**, puis une scène → « Proposer une ambiance » | Rien. ⚠️ **Aucun essai automatique ne couvre l'aller-retour avec le modèle** |
| 26 | **Le menu d'une atmosphère** | ✅ **CORRIGÉ le 19/09** — vu par David, capture à l'appui : le cadre était **coupé ET derrière les pads**. Trois causes empilées, dont un `overflow-x-auto` qui découpe aussi en vertical : un `z-index` ne suffisait pas, il a fallu un **portail**. ⭐ Le garde-fou a été **faux deux fois** — `toBeVisible()` et `click()` passaient sur le code fautif ; seul `elementFromPoint` voit ce qui est **peint** (§ 90) | Rien | Rien. ⚠️ Non revu à l'écran |
| 27 | **Sound-OS par campagne** | ✅ **LIVRÉ le 19/09** — demandé par David, et c'était la dernière asymétrie des trois modules d'ambiance. Troisième module à employer la règle partagée, toujours sans copie. ⭐ Son clavier n'avait **pas** le défaut de Music-OS (il ne lit que l'active) mais son **repli** prenait la première de la liste brute. ⭐ Et la fusion d'instantané, écrite le matin sans propriétaire, a dû être rouverte : *ajouter un champ, c'est rouvrir toutes les fonctions qui décidaient sans lui* (§ 91) | Sélectionner une atmosphère, cliquer **Cette campagne**, changer de campagne | Rien. ⚠️ Non vu à l'écran |
| 28 | **Essayer une ambiance sur les lampes** | ✅ **LIVRÉ le 20/09** — le dernier reste de l'IA qui compose. Avant lui il fallait **occuper une case du râtelier pour regarder une ambiance qu'on allait peut-être refuser**. ⛔ Le cœur n'était pas d'allumer mais de **rendre la pièce** : les **trois** portes du retour existantes visent une *scène* et auraient **éteint le salon** un après-midi de préparation. ⭐ Quatrième visée, et une photographie qui **copie** au lieu d'emprunter (§ 92) | Une scène → « Proposer une ambiance » → **Essayer**, puis **Revenir** | Rien. ⚠️ Non éprouvé à l'écran, et il demande de vraies lampes |
| 29 | **L'atelier d'effets** | ✅ **LIVRÉ ET ÉPROUVÉ À L'ÉCRAN le 20/09** (*« ça marche très bien »*) — créer un effet de zéro, là où « Mes ambiances » ne savait que **décliner** un des 48. ⭐ La décision qui débloque tout : **un effet peut être de la donnée** — quatre nombres par étape, plus le désordre, *qui est ce qui sépare une suite d'un geste*. Il se joue **avant le `switch`** et le traverse quand même, donc il obéit aux mêmes curseurs sans une ligne de plus. ⛔ Adaptatif et jamais soliste : *une lampe qui ne joue pas ne s'explique pas* (§ 93) | Écran de choix d'un effet → — | Rien. ✅ **Vu à l'écran** |
| 30 | **Le thème d'ambiance dans un moment** | ✅ **CORRIGÉ le 20/09** — signalé par David : un moment ne savait dire que le **mélange** (la scène), jamais la **matière** (le thème). ⛔ Et une scène sur huit emplacements vides **réussit** sans produire un son : *une ambiance qui ne sort pas ressemble à une ambiance discrète*. Cinquième sort au rapport du moment (`sans-matiere`, lu « aucun son chargé »), et la **capture** du thème, qui existait dans le magasin sans lecteur (§ 94) | Un moment → **Ambiance** → choisir un thème, puis une scène | Rien. ⚠️ Non éprouvé à l'écran |
| 31 | **Le dosage des trois sources** | ✅ **LIVRÉ le 20/09** — demandé par David : régler le volume de Music-OS, Ambient-OS et Sound-OS depuis un moment. ⛔ **Deux des trois volumes n'existaient pas** : `SoundEngine.setMasterVolume` était écrite **sans appelant** (donc le curseur du soundboard de la **tablette** était muet), et Ambient-OS n'avait aucun nœud pour le porter alors qu'il était persisté et restauré. ⭐ Le piège tenait à **une seule valeur** : `0 || undefined` aurait fait l'inverse exact de « coupe le son » (§ 95) | Un moment → **Dosage des sources** → activer une ligne, curseur et fondu | Rien. ⚠️ Non éprouvé à l'écran |
| 32 | **Les étiquettes du Media Hub** | ✅ **LIVRÉ ET ÉPROUVÉ À L'ÉCRAN le 21/09** (*« ça fonctionne »*) — les quatre demandes de David n'étaient pas quatre fonctionnalités mais **les deux bouts d'un même problème** : ce qui empêche le doublon (suggestions, « vouliez-vous dire ? », propositions alignées sur le vocabulaire existant) et ce qui répare celui qui est là (renommer = fusionner = supprimer, en un geste). ⭐ *Un vocabulaire qu'on ne peut pas corriger se corrompt à chaque ajout.* Plus l'étiquetage en lot et le refus `-tag` dans la barre (§ 96) | Media Hub → taper un tag à une lettre près, — | Rien. ✅ **Vu à l'écran** |
| 33 | **La boucle d'une vidéo** | ✅ **LIVRÉ le 21/09** — le « choix à confirmer » du 05/09, rouvert par l'usage. ⛔ **Deux lecteurs** rendent une vidéo projetée, et le second (tablettes) **ne peut pas lire le réglage** : il voyage par le pont, émis avant la vidéo. ⭐ L'absence vaut boucle — *un champ neuf ne doit jamais rendre faux ce qui marchait avant lui*. Sans boucle, le film garde sa dernière image (§ 97) | La pastille d'Image-OS au survol, ou le Media Hub → **Joue une fois**, puis projeter | Rien. ⚠️ Non éprouvé à l'écran |

### Ce que la soirée du 2026-08-23 a fermé

*Consigné ici pour que la question « que reste-t-il ? » cesse de rouvrir ce qui est clos — le § 5 du
document de réconciliation avait fait annoncer trois chantiers déjà faits.*

| Fermé | Comment |
| --- | --- |
| **P1 bis — le pilote RdD** | Redérivé par David, seuil vidé, **78 %** vérifié à l'écran. *C'était le seul reste qui faussait une partie en cours.* |
| **Les trois restes du RAG** | Déjà clos le 23/08 au matin ; le document qui les listait était périmé |
| **Le Cortex** | Ses deux questions : *ne pas fusionner, borner* (mesuré) et **le mode hors carte** (construit) |
| **Axe N.3** | Les cinq modules ont la règle du destructif ; la densité n'est calibrée que sur le combat |
| **Quatre suppressions muettes** | Journal ×2, Oracle, PNJ — confirmations posées |
| **`docs/commun/`** | Créé par David. **Vide** : reste à le remplir de ce qui est transversal |
| **Les fiches Blade Runner** | Zéro `a_regenerer` dans tout le corpus, doublon des Quarts supprimé |

**Ce qu'ils ont en commun, et ce n'est pas un hasard :**

- Les trois posent la **même** question — *qui détient la vérité* : la carte
  gardée sort-elle des trois tas ; qui arbitre les 256 pixels ; `sheetData` ou le
  fichier HTML. C'est le motif que ce projet paie tous les jours.
- Les trois s'appuient sur **la même plomberie, déjà en place** : `SyncServer`,
  `PairingManager`, `netTrust`, `net.fetch`, et le Player Hub sur tablette.
- Deux des trois butent sur **le même trou** : la tablette sait afficher et ne
  sait pas écrire.

---

# 1 · Afficheur Ulanzi / AWTRIX

📄 **Fait foi :** `documentation/Planning/2026-08-23-afficheur-ulanzi.md` (13 sections)
🧠 **Mémoire :** `gm-os-afficheur-ulanzi-awtrix`

**L'idée.** Un afficheur 32 × 8 pixels posé sur la table. La contrainte décide de
tout : à cette taille on affiche **des nombres et des barres, jamais des
phrases**. Vingt idées se ramènent à **quatre widgets**. Miroir contre
instrument : un miroir reflète un module qui existe, un instrument ne reflète
rien et doit donc être poussé depuis quelque part.

**Ce qui est tranché.** Quatre widgets et pas une bibliothèque par jeu · la table
de correspondances **existe déjà dans le pilote**, on ne la réécrit pas · **un
seul arbitre** pour les 256 pixels · on commence par **le compte à rebours seul**
· l'objet garde sa **routine** hors séance et n'est **emprunté** que si l'option
est cochée — donc il faut le **rendre**, y compris quand GM-OS plante.

**⚠️ Le test se fera sur Blade Runner** — corrigé le 2026-08-23 : *« en réalité ma
prochaine partie sera du Blade Runner »*. Ça renforce le plan au lieu de le
retarder, parce que **le compte à rebours y a un sujet natif : le Quart.**

**Ce que l'afficheur montre, et tout vient du corpus vérifié**
(`docs/systems/blade-runner/rules/`) :

- La journée compte **quatre Quarts** (matin, journée, soirée, nuit), 5 à 10 h
  chacun, **un seul lieu visité par Quart**.
- **Le seuil est à trois** : au-delà de 3 Quarts d'affilée sans pause, **1 point
  de stress par Quart supplémentaire** *(4 avec « Bourreau de travail »)*.
- **Les joueurs le notent déjà à la main** sur leur fiche d'Agenda.

Un nombre, un seuil, et une comptabilité que la table tient au crayon : si
l'afficheur prend, **il ne fait pas qu'informer, il retire du travail à la
table**. Un timer abstrait n'aurait jamais pu prouver ça.

**Et c'est la seule jauge de Blade Runner qui appartienne à la TABLE.** Santé,
Sang-froid et Stress appartiennent à chaque personnage ; Promotion, chinyen et
Humanité s'attribuent en fin de session. Les 256 pixels n'ont de place que pour
une chose partagée — le premier test n'a donc pas à trancher *quel* personnage
afficher, et ne doit surtout pas se le voir imposer.

**Les deux natures du § 4 sont natives en Blade Runner :** le Quart est le
**miroir** (s'il ment, c'est un bug) ; **le test de référentiel** est
l'**instrument** — l'idée de David d'*« une jauge verte qui se vide silencieusement
sans que les joueurs sachent pourquoi »* **est** le référentiel, littéralement
(mesure à reproduire « avec une précision millimétrée », dégradation non montrée).

**Les TODO, dans l'ordre :**

1. ✅ **TRANCHÉ le 2026-08-23** — le test aura lieu. David : *« oui, le défilé des
   quarts »*.
2. ✅ **TRANCHÉ** — le Quart se pousse **depuis le cockpit** (« pour l'instant »).
   *GM-OS ne suivait aucun Quart : vérifié, le mot n'existait pas dans `src/` au
   sens de Blade Runner.*
3. ✅ **CONSTRUIT le 2026-08-23** — `src/modules/ulanzi/`, six fichiers, 13 tests
   propres au widget, `tsc -b` propre, **2 286 tests au vert**, appareil rendu à
   sa routine après essai. Voir § 13 du plan.
4. ⏳ **L'ESSAYER EN CONDITIONS** — ouvrir une séance, cocher l'option, avancer
   trois Quarts, voir le rouge au quatrième, prendre une pause, fermer la séance
   et vérifier que l'afficheur **redevient une horloge**. Puis la séance de
   Blade Runner.
5. **La librairie de widgets et son tableau de bord** (§ 13 du plan) — choisir
   par jeu, faire défiler à la cadence voulue. *Remplacera la couture provisoire
   qui teste « blade » dans le nom du jeu.*
6. **Brancher Clock-OS sur l'Ulanzi** — *idée de David, le 2026-08-23, gardée
   pour plus tard.* **Ce serait le premier MIROIR** (§ 4) : le défilé des quarts
   ne reflète aucun moteur, une horloge de tension en reflète un vrai.
   `TensionClock` (`src/store/useClockStore.ts:40`) porte déjà exactement ce
   qu'un widget « compte à rebours » demande — `name`, `totalSegments`,
   `filledSegments` — et le § 8 le classait **premier des usages**.
   ⚠️ **C'est ce branchement qui forcera la librairie du § 12 à exister** : deux
   widgets, donc un choix, donc un tableau de bord. Et deux écrivains vers 256
   pixels, donc l'arbitre.
7. **L'arbitre des 256 pixels** — inutile tant qu'il n'y a qu'un widget ; il ne
   redevient nécessaire que pour les surgissements, qui passent par `/api/notify`.
8. ❓ **À trancher plus tard — les boutons remontent-ils autrement que par MQTT ?**
   Toute la télécommande d'initiative en dépend, et un courtier est un service de
   plus à faire vivre.

> **Ce qui rend ce premier test court, et c'est le constat du 23/08 :** puisque
> aucun moteur ne suit le Quart, le défilé est un **instrument** et non un miroir.
> **Il n'y a rien à brancher** — ni pilote à forger, ni arbitre à écrire. Il
> deviendra un miroir le jour où un pilote Blade Runner déclarera le Quart ; pas
> avant, et surtout pas pour ce test.

> **Le pari du chantier.** Le compte à rebours est le seul widget présent dans
> presque tous les exemples, tous jeux confondus. **S'il ne prend pas à la table,
> les dix-neuf autres ne prendront pas non plus** — et la bibliothèque se
> dessinera seule ensuite, puisqu'on saura quelle jauge on a *voulu* pousser en
> jouant.

**🔧 ✅ RÉGLÉ le 2026-08-23 (`2db76db`) — trouvé en préparant ce test, sans rapport
avec l'afficheur :** deux fiches du corpus Blade Runner traitaient du même sujet —
`gestion-quarts-pauses.md` (**v1**, `a_regenerer: true`, sources **« non
capturées »**) et `structure-temporelle-par-quarts-et-pauses.md` (**v3**, 8 sections
citées du livre). C'était le motif corrigé sur Rêves de Dragons le 21/08 :
**l'Oracle peut répondre depuis celle qui ne cite rien.** La v1 est **supprimée** ;
**vérifié le 2026-08-24 — plus aucun `a_regenerer: true` dans un seul `rules/` du
dépôt**. Rien à reforger avant la séance.

---

# 2 · Deck-OS — garder la carte tirée

📄 **Fait foi :** ce document (aucun plan dédié n'existe encore)
🧠 **Mémoire :** `gm-os-deck-os-cartes-gardees`

**L'idée, mot pour mot (2026-08-23).** *« Je voudrais étendre l'utilisation de
Deck-OS : permettre à mes joueurs de tirer des cartes dans un deck et leur
permettre de garder la carte. »*

**Ce que le code dit aujourd'hui.** `src/types/deck.types.ts` — `DeckSessionState`
connaît **trois** endroits où une carte peut être :

```text
remainingIndices  ·  discardedIndices  ·  currentCardIndex
   la pioche            la défausse        la carte visible
```

**Aucune notion de carte tenue par quelqu'un.** C'est exactement le trou que
l'idée ouvre. Le module vit dans `src/modules/session/` — `DeckLibrary`,
`DeckPlayer`, `useDeckPlayer`, `deckSlice`, `DeckInterpreter` — et les vues
`deck-library` / `deck-player` existent déjà dans `CurrentView`.

**Les TODO, dans l'ordre :**

1. ⛔ **DÉCISION — une carte gardée est-elle un quatrième tas, ou un objet
   d'inventaire ?** Les deux lectures sont défendables et **elles ne mènent pas
   au même code**. Le quatrième tas garde tout dans `DeckSessionState` ;
   l'inventaire rapproche la carte d'un objet possédé — ce que le générateur de
   butin sait déjà faire.
2. ⛔ **DÉCISION — qui détient la vérité quand une carte est en main ?**
   *Si un index peut se trouver à la fois dans `discardedIndices` et dans la main
   d'un joueur, on a deux écrivains pour une même vérité.* Une carte gardée doit
   **sortir** des trois tas, ou n'y avoir jamais été.
3. **Le voyage jusqu'à la tablette du joueur.** « Garder la carte » veut
   probablement dire *qu'elle reste sur l'appareil du joueur* — donc que l'état du
   deck cesse d'être purement local au meneur. **C'est le vrai changement de
   nature**, bien plus que le quatrième tas.

---

# 3 · Thème par jeu & fiche HTML

📄 **Fait foi :** `documentation/Planning/2026-08-23-theme-de-jeu-et-fiche-calque.md`
🧠 **Mémoire :** `gm-os-theme-de-jeu-et-fiche-calque`

**L'idée.** Deux insatisfactions du 2026-08-23 : l'apparence des campagnes, et
celle des fiches de personnage. Le sujet 2 a été **renversé le même jour** — on
n'importe plus la fiche, **on affiche le HTML et on l'alimente**.

**Ce qui est tranché.** Palette libre déclarée dans le pilote · le jeu gagne et
la main surcharge la séance sans jamais écrire dans le pilote · **la fiche EST un
fichier HTML, un par PJ** · elle s'affiche sur les **deux** écrans, en bascule.

**Aucune question ouverte. Le chantier est prêt à partir.**

## 3a · Le thème — ✅ LIVRÉ le 2026-08-24, **son atelier le 2026-09-03**

> ⭐ **Depuis le 03/09, le thème d'un jeu se règle DANS l'application** — onglet des réglages, les 22
> jetons et une échelle de texte, écrits dans le `theme.css` du jeu. Déposer le fichier à la main marche
> toujours : l'atelier ne remplace pas la porte d'entrée, il en ouvre une seconde. Voir § 6.

**Les six étapes sont faites**, et le résultat dépasse le plan : au lieu d'une
palette déclarée dans le pilote, **un jeu dépose `docs/systems/<jeu>/theme/theme.css`
et l'interface suit** — aucun registre, aucun code, aucune recompilation. Quatre
thèmes en place (Alien, NOC, Star Trek, Blade Runner), construits par David sur
son propre SDK de thèmes normalisé.

Ce qui a changé par rapport au plan : on **extrait les 22 jetons** au lieu
d'injecter la CSS, parce que le vocabulaire de composants du SDK est celui d'une
page de livre et n'a pas de correspondant dans le cockpit. Les composants
serviront au chantier 3b, dans l'iframe des fiches.

Détail des pièges rencontrés : mémoire `gm-os-theme-de-jeu-et-fiche-calque`.

### Ce que le plan demandait, pour mémoire

1. **Réconcilier les deux tables de thèmes.** `THEME_PALETTES`
   (`useSessionStore.ts:48`) et `:root[data-theme=…]` (`index.css:184-260`) se
   contredisent, et **chacune n'est lue que pour une moitié d'elle-même** — donc
   aucune n'est jamais visiblement fausse. *Ce pas seul corrige la lueur qui ne
   suit pas l'accent choisi.* **À faire avant tout le reste** : poser une palette
   libre sur deux tables contradictoires, c'est en fabriquer une troisième.
2. **Un seul arbitre** — une fonction écrit les douze variables, `color-scheme`
   compris ; `main.tsx:13-15` cesse d'écrire.
3. **`ThemeDeJeu` dans `ui_config`**, avec `themeColor` en repli. *Rappel :
   `ui_config.themeColor` est un **champ mort** — la Forge le produit, les
   contrôles le valident, `RevueDuPilote` l'affiche, et personne ne l'applique.*
4. **La chaîne de préséance**, avec la distinction **choisi / hérité** dans
   `LayoutConfig` — sans elle, `useLayoutManager` sauvegarde la surcharge et la
   décision « le jeu gagne » s'inverse en silence.
5. **La Forge produit une palette entière** et `controlesDuPilote` la vérifie
   (contraste texte/fond, `clarte` cohérente avec le fond).
6. **Un écran** pour régler la palette d'un jeu à la main.

**Pièges :** `color-scheme` obligatoire sinon les `<select>` natifs se trompent ·
polices en **liste close** (Google Fonts, liste fixe — un nom libre échoue en
silence) · le thème doit passer par la synchronisation vers la tablette.

## 3b · La fiche — étude faite le 2026-08-24, plan d'origine PÉRIMÉ

⚠️ **Le plan ci-dessous a été écrit sur la fiche Alien et ne tient plus.** David
a depuis construit un **gestionnaire de fiches** — un moteur unique qui rend
quatre gabarits déclarés en JSON, avec géométrie, champs typés et bibliothèque
IndexedDB. Il vit dans `docs/fiches/Character_Sheet_Manager.html`.

Ce que ça change :

- **« Détourner `save()` » n'a plus de sens** : il n'y a plus quatre fiches avec
  chacune sa convention, mais un moteur. La couture se publie **une fois**.
- **Le typage et l'auto-déclaration sont acquis** — `text`, `number`, `textarea`,
  `checkbox`, `hotspot`, plus `system` et `schemaVersion`.
- **Le `hotspot` a supprimé le cas de correspondance le plus coûteux** : dix
  bulles portant chacune sa valeur SONT un scalaire.

📄 **Fait foi désormais :**
`documentation/Planning/2026-08-24-correspondance-fiche-blade-runner.md` — la
table écrite à la main sur les 33 champs, comptée, et les six étapes qui restent.

### ✅ La couture est publiée le 2026-08-27 — le blocage est levé

*Il était le seul : aucune fiche n'exposait quoi que ce soit sur `window`, aucune
n'utilisait `postMessage`.* `docs/fiches/Character_Sheet_Manager.html` expose
désormais, **une fois pour les quatre gabarits** :

```js
window.RPGSheet = { version, getData, setData, getTemplate, onChange }
```

…et **le même contrat par `postMessage`** (canal `rpg-sheet` : `hello`, `get`,
`set`, `template`, plus les diffusions `change` et `open`), parce que l'hôte sera
une iframe et que `window.*` ne traverse pas une origine.

**Trois points, et les deux derniers ne se devinent pas :**

| Où | Quoi |
| --- | --- |
| `setByPath` | signale la clé écrite — **tous** les chemins d'édition y passent (champ, case, hotspot, piste, portrait, et l'écriture de l'hôte) : *un seul point, pas cinq* |
| `openCharacter` | annonce l'ouverture, sinon l'hôte ne sait jamais qu'on a changé de PJ |
| le bloc publié | `setData` **redessine les champs** en plus d'écrire — sans ça la donnée est juste et l'écran ment |

**Deux décisions prises en écrivant :**

- **Un lot ne porte qu'une origine** (`sheet` / `host` / `open`). Les changements
  sont groupés sur 60 ms ; avant d'appliquer une écriture de l'hôte, on **vide**
  ce qui restait de la saisie locale. Sans ça l'hôte se voit renvoyer sa propre
  écriture mêlée à celle du joueur, et la réapplique.
- **`getData` rend une copie.** L'hôte qui bricole l'objet reçu ne touche pas la
  fiche.

**Éprouvé, et pas seulement relu :** `electron/coutureDesFiches.test.ts` charge
**le vrai moteur du disque** dans un DOM — seuls les gabarits intégrés sont
remplacés par un gabarit de contrôle, les vrais pesant sept mégaoctets de fonds
de page — crée un personnage par le chemin normal de l'application, puis fait
l'aller-retour complet : écriture de l'hôte → écran redessiné (texte, case,
`select`, hotspots, champ dérivé) → saisie du joueur → remontée → persistance
vérifiée en rouvrant le personnage. **9 tests.** Le premier garde les trois
points ci-dessus présents dans le fichier : *le jour où le GPT régénère la fiche
et emporte la couture, c'est ce test qui le dit.*

### ✅ La table et son contrôle sont faits le 2026-08-28 — étapes 3 et 4

`docs/systems/blade-runner/fiche/correspondance.json` range les **74 clés** de la
fiche : 16 renommages, 17 compositions, 18 champs d'armes, 6 absents motivés.
Déposée à côté du thème, résolue par `resoudreCorpus` — *déposer un fichier
suffit*. Les trois capacités sont dans `src/modules/fiches/`, et
`electron/correspondanceDesFiches.test.ts` regarde **dans les deux sens** :
aucune clé citée qui n'existe pas, **et aucune clé de la fiche qui ne soit
citée**. Détail et décisions : `2026-08-24-correspondance-fiche-blade-runner.md`.

⚠️ **Trouvé en écrivant la table, et c'est le motif du chantier :** le typage des
17 `.level` corrigé le 24/08 l'avait été **dans la fiche autonome**, jamais dans
le gabarit intégré au **moteur** — celui que GM-OS affichera. Quatre jours, deux
fichiers du même dépôt qui se contredisent, aucun test capable de le voir.
Corrigé, et gardé par le contrôle. *Le défaut que l'étape 4 devait empêcher
s'était produit avant qu'elle existe.*

### ⛔ Ce qui reste, et ce qu'il faut savoir avant de s'y mettre

**Le premier geste de l'hôte n'était pas l'iframe, c'était `open`.** Le contrat
`postMessage` de la v1 avait `hello`, `get`, `template`, `set` — et pas de quoi
dire **quel PJ ouvrir** : `openCharacter` n'était appelé que par la barre
latérale du moteur.

### ✅ La couture v2 est publiée le 2026-08-28 — la bibliothèque est ouverte

Quatre verbes de plus, **un seul passage dans le moteur** :
`list`, `openCharacter`, `create`, `backup` — par `window.RPGSheet` **et** par
`postMessage`, comme les quatre premiers. `hello` annonce désormais `version: 2`.
Éprouvés dans `electron/coutureDesFiches.test.ts` : **18 tests** sur le vrai
moteur chargé du disque (9 avant).

**Trois choses tranchées en l'écrivant, dont deux qui ne se devinent pas :**

| | |
| --- | --- |
| **`openCharacter`, jamais `open`** | `open` est **déjà une diffusion** du moteur vers l'hôte, et le garde-fou du gestionnaire jette les messages qui la portent. Un verbe nommé `open` serait ignoré **en silence** — pas refusé : sans réponse, l'hôte attendant pour toujours. Le nom est le même des deux côtés, pour qu'on ne puisse pas se tromper en changeant de chemin. |
| **`openCharacter` lève, il n'alerte plus** | Une `alert()` dans une iframe est un cul-de-sac : l'hôte attend une réponse, pas une boîte que personne ne verra. C'est l'appelant qui décide quoi montrer — la barre latérale alerte, l'hôte reçoit `ok: false`. |
| **`backup` est le contenu, pas le téléchargement** | Une seule fabrication (`contenuDeSauvegarde`) sert le bouton *et* la couture. Deux formats auraient fini par ne plus se restaurer l'un l'autre. L'hôte en reçoit une **copie**, pour la même raison que `getData`. C'est l'étape 1 du chantier n° 5, faite d'avance parce qu'elle tenait dans le même passage. |

**✅ Tranché par David le 2026-08-28 — le moteur garde sa bibliothèque, GM-OS s'y
branche.** Donc : étendre la couture avec `open(id)`, `list` et `create`, et
ranger sur chaque PJ de GM-OS l'identifiant de sa fiche. Le moteur reste
utilisable seul, hors GM-OS.

### ✅ Qui gagne quand les deux bases divergent — tranché le 2026-08-28

**La fiche fait foi. GM-OS s'aligne.** *« C'est la tablette qui gagne »* — donc
l'écran où le joueur remplit sa fiche l'emporte sur ce que le meneur en a fait.

C'est la même règle que la table de correspondance applique déjà aux armes, et
elle a le mérite d'être **énonçable en une phrase** : une règle d'arbitrage qu'on
ne peut pas dire à voix haute finit toujours par être appliquée à moitié.

**Mais elle ne se pose pas silencieusement.** *« Il faut garder un log si
possible »* : chaque divergence écrasée doit laisser une trace — quel PJ, quelle
clé, quelle valeur perdue, quand. Sans ça, un champ écrasé par une resynchro se
découvre en séance, et on ne peut plus dire ce qu'il contenait.

> **Deux choses à décider en écrivant le journal, pas avant :** le rapprochement
> se fait dans le *renderer*, or `auditNotice` (`electron/auditLog.ts`) vit dans
> le process principal et écrit dans `main.log` sous le préfixe `[Sécurité]` —
> il faut soit un chemin IPC vers lui, soit un journal propre à ce sujet. Et un
> journal de divergences doit **tourner**, sinon il grossit à chaque frappe.
>
> Trois précédents disent que c'est ce journal qui fera gagner du temps :
> `~/ollama_debug.log` a tranché toutes les questions de contexte, le journal du
> thème a rendu bruyant un absent muet, et *un refus qui ne laisse aucune trace
> ne vaut pas grand-chose* — la phrase est déjà dans `auditLog.ts`.

⚠️ **La bibliothèque du moteur n'est sauvegardée par personne.** Elle vit sur
l'origine `gmos://`, et la sauvegarde du 28/08 ne couvre que `gmos-state-db`.
Combiné à la règle ci-dessus — *la fiche fait foi* — cela veut dire que **le
magasin qui détient la vérité est le seul qui ne soit pas protégé**. C'est le
chantier n° 5.

### ✅ L'hôte est livré le 2026-08-28 — côté meneur

Une bascule **Fiche du jeu / Formulaire** dans `CharacterSheetEditor`, qui
n'apparaît que si le jeu a une `correspondance.json` : proposer un écran vide
serait pire que ne rien proposer. Quatre modules dans `src/modules/fiches/`,
54 tests, et **aucun ne touche le store** — l'hôte rend ses conclusions par
rappel, et le seul endroit qui écrit reste celui qui écrivait déjà.

| | |
| --- | --- |
| `pontDeLaFiche.ts` | Le contrat par messages en promesses. Vérifie l'**émetteur** (`event.source`, la seule preuve incontrefaisable — le canal seul ne prouve rien), rend la main au bout de 15 s, et corrèle **par identifiant** puisque le moteur diffuse un `change` *avant* de répondre à un `set`. |
| `rapprochementDeLaFiche.ts` | La fiche fait foi. **`16` et `"16"` ne sont pas une divergence** — comparer strictement crierait sur chaque champ numérique à chaque ouverture, et on apprendrait à ignorer le journal. **Remplir n'est pas écraser.** |
| `journalDesDivergences.ts` | Par `appBridge.logger` → `main.log`. Le chemin existait de bout en bout : **aucun IPC nouveau**, et c'est le seul qui survive à la fermeture. Pas `auditNotice` — une donnée écrasée n'est pas un incident de sécurité. |
| `FicheHote.tsx` | L'iframe et la liaison. **GM-OS ne pousse qu'à la création** : semer ailleurs rouvrirait la question de qui gagne à chaque frappe. Une fiche liée disparue n'est pas recréée d'office — ce serait un doublon silencieux. |

`ficheId` est posé sur `PlayerCharacter` : c'est le seul lien entre les deux
bases, et il pointe vers une base que GM-OS ne détient pas. L'iframe est montée
à la première bascule puis **gardée montée et masquée** — elle charge sept
mégaoctets de fonds de page.

### ✅ Le second écran est livré le 2026-08-28 — la tablette a sa fiche

⚠️ **Recadrage de David, et il change la priorité :** *« la fiche HTML n'est pas
un outil du meneur, c'est un outil d'immersion des joueurs, d'où l'importance
qu'ils puissent le voir sur leurs tablettes. »* L'option « la tablette garde son
écran actuel », que j'avais recommandée comme la plus sage, enlevait exactement
ce à quoi la fiche sert. Elle est écartée.

**Le port distinct — `electron/serveurDesFiches.ts`, port 3002.** L'écran du
meneur marche parce que `gmos://media/…` est une **autre origine** que le
cockpit : c'est cette séparation qui impose `postMessage`, et c'est elle qui
protège les données du cockpit d'un HTML régénéré par un GPT. Ajouter `.html` aux
types servis par le `SyncServer` aurait été **une ligne** — et aurait mis la fiche
sur l'origine du Player Hub, avec accès à son stockage. *L'isolation ne vient pas
du protocole, elle vient de la différence d'origine* : un second port la rend à
la tablette pour le même prix.

Le serveur ne sert que deux formes d'adresse — `/fiches/….html` et
`/systems/<jeu>/fiche/….json` (la tablette n'a pas `readDoc`) — ne liste jamais un
dossier, n'écrit jamais, et ne sort jamais de `docs/`. `cheminServi` est pure et
éprouvée seule : *un serveur sur `0.0.0.0` voit passer ce que le réseau lui
envoie, pas ce qu'on avait prévu.*

**⚠️ La bibliothèque du moteur vit PAR APPAREIL**, et ça ne se devine pas : une
base IndexedDB appartient à une origine **et** à un navigateur. Les fiches du
meneur n'existent pas sur la tablette du joueur, et aucun réglage n'y changera
rien. D'où deux modes de liaison dans `FicheHote` :

| Mode | Où | Ce qu'il fait |
| --- | --- | --- |
| `bibliotheque` | Meneur | Choisit dans la bibliothèque du moteur ; l'identifiant se range sur le PJ. |
| `locale` | Tablette | **Rien à choisir.** Sème une fiche depuis ce que GM-OS sait du PJ, et retient son identifiant sur l'appareil. *La vérité reste celle de GM-OS, la tablette la redessine.* |

**Le chemin d'écriture de la tablette est posé** —
`remoteUpdateCharacterSheetData`, calqué sur `remoteUpdateCharacterNarrative` et
**pas** sur `remoteUpdateCharacterVitals` qui ne diffuse rien. Sans lui, un joueur
remplissait sa fiche et **rien n'arrivait** : la pire des issues, parce qu'il ne
l'aurait appris qu'à la séance suivante. `sheetData` s'y **fusionne** et ne se
remplace jamais — la fiche ne connaît que les champs de la table, et remplacer
l'objet entier perdrait tout ce que le meneur tient à côté. Côté réception,
l'action passe par `updateCharacter` et **pas** par la variante `remote`, sinon
elle rediffuserait à l'envoyeur — un aller-retour sans fin.

Restent les étapes 5 et 6 du document de correspondance : la convergence sur le
`hotspot` et le retour de `humanite` par la Forge.

### Le plan d'origine, conservé pour ce qu'il garde de vrai

0. ⚠️ **METTRE LE FICHIER À L'ABRI — trouvé le 2026-08-24.** `alien_character_sheet_v2.html`
   (1,6 Mo, 85 lignes, images embarquées) est posé **à la racine du dépôt et n'est pas suivi par git**.
   C'est la **seule copie** de la matière de tout ce chantier, et un `git clean` la détruirait sans un
   mot. *Le premier geste n'est pas de coder l'hôte, c'est de commiter le fichier* — et de décider où
   vivent les fiches (`docs/fiches/<systeme>/` ?), puisque le plan en veut **une par PJ**.
1. **L'hôte** — une iframe qui affiche le fichier d'un PJ, côté MJ, en bascule.
2. **L'adaptateur** — ⚠️ **détourner `save()` EN PREMIER**, avant d'ajouter quoi
   que ce soit. En iframe sandbox, `localStorage.setItem` **lève**, et l'écriture
   n'a pas de `try/catch` (ligne 78) alors que la lecture en a un (ligne 80) :
   **la fiche s'ouvrirait parfaitement et mourrait à la première frappe.**
   Le fichier n'a **qu'un** écouteur global, donc remplacer `save` capture toute
   la saisie. Masquer aussi *Exporter / Importer / Réinitialiser*.
3. **L'appairage** — normalisation **des deux côtés** (`carriere` ↔ `Carrière`),
   et repli des clés numérotées **aller-retour** : `stress_0..9` est dix booléens
   côté HTML et **un** champ côté GM-OS ; `equip_1..10` est l'`inventory`.
4. **L'épreuve** — modifier dans GM-OS et le voir dans la fiche ; cocher dans la
   fiche et le voir dans `sheetData`. *Les deux sens, ou rien.*
5. ⛔ **Le chemin d'écriture de la tablette** — `remoteUpdateCharacterSheetData`,
   son nom dans `remote.types.ts`, son entrée dans `sessionActions.ts`.
   **Bloquant** pour l'édition côté joueur. Il doit suivre
   `remoteUpdateCharacterNarrative` et **pas** `remoteUpdateCharacterVitals`, qui
   ne diffuse rien du tout.
6. **L'iframe côté tablette**, une fois le retour possible.
7. **L'impression** — offerte, le fichier a déjà son `@media print` paysage.
8. **Le repli** — la peau générée et ses trois briques (octogone, piste, réglé),
   pour les jeux sans fichier HTML.

**Annulé par le renversement**, à ne pas ressortir : `GeometrieDeFiche` ·
la fenêtre Electron cachée · l'extraction du scan · l'éditeur de calque ·
le `ResizeObserver`.

---

## Si on devait en reprendre un

**Le n° 1 — le défilé des quarts.** Il est passé devant le 2026-08-23 : la
décision est prise, **il a une date** (la prochaine séance de Blade Runner), et
il ne coûte qu'une soirée puisqu'il n'a rien à brancher. *Un chantier qui a une
date passe avant un chantier qui n'en a pas.* Il ne lui manque qu'un choix : d'où
se pousse le Quart.

**Le n° 3, section 3a, étape 1**, si on veut du code sans date. Aucune décision
requise, ça corrige un défaut visible aujourd'hui (l'accent et sa lueur ne sont
pas de la même couleur), et c'est borné.

**Le n° 2 ne peut pas commencer** tant que ses deux questions ne sont pas
tranchées : elles mènent à deux codes différents, et se tromper coûterait tout le
module.

---

# 4 · Sauvegarde des images

📄 **Fait foi :** `documentation/Planning/2026-08-27-sauvegarde-automatique.md`, § 7
🧠 **Mémoire :** `gm-os-sauvegarde-automatique`

**Ouvert le 2026-08-28**, découvert en mesurant, pas en cherchant.

**Ce que la mesure dit.** La sauvegarde automatique livrée le 28/08 est une
**sauvegarde de pointeurs**. Une carte de l'atlas porte
`"fileUrl": "m-<uuid>"` — un identifiant, dont les octets vivent ailleurs. Il y a
**trois** bases IndexedDB, et une seule est sauvegardée :

| Base | Contenu | Sauvegardée ? |
| --- | --- | --- |
| `gmos-state-db` | l'état de session | ✅ depuis le 28/08 |
| **`gmos-media-db`** | **les images** (`useMediaStore`) — ~263 Mo | ❌ **par personne** |
| `gmos-fog-data` | le brouillard de guerre | ❌ |

L'export du 7 août fait 498 Ko, porte **0 image** et **29 références**. Celui
d'avril faisait 33,8 Mo parce que les images y étaient encore en base64 dans
l'état : le facteur 66 est un **changement de modèle**, pas une optimisation.

> **Ce n'est pas une régression** — rien ne sauvegardait les images avant non
> plus. Mais restaurer sur un profil neuf rendrait les campagnes complètes avec
> **des cartes mortes**. C'est ce que ce chantier existe pour éviter.

## ✅ CONSTRUIT le 2026-08-29 — un miroir, pas des instantanés

**La mesure a changé la réponse.** Comptés sur la machine de David : **115
images, 261 Mo**, ~2,3 Mo pièce, 506 Go libres. Ma recommandation du 28 — « un
instantané séparé et rare » — coûtait **trois gigaoctets** avec la rotation de
douze, pour des fichiers qui ne changent jamais : *une carte ne change pas, on en
ajoute.* D'où un **miroir** : chaque image écrite **une seule fois**, jamais
réécrite. Premier passage 261 Mo, les suivants ne coûtent que les nouveautés.

**✅ Décision de David : le miroir GARDE TOUT.** Une image supprimée dans GM-OS
reste dans le miroir. *Une suppression accidentelle qui se propage au filet le
rend inutile le jour où il servirait.* Prix assumé : l'espace ne redescend jamais
seul — un geste de nettoyage explicite, qui dira ce qu'il s'apprête à supprimer,
viendra plus tard. Il n'y a donc **aucune rotation** ici, et c'est délibéré : la
rotation existe pour des copies complètes interchangeables ; ici chaque fichier
est unique.

**✅ Décision de David : le brouillard de guerre part avec.** C'était la
troisième base non sauvegardée. Il est copié **à chaque passage** et non une
seule fois — une image ne change pas, un brouillard si, et le figer au premier
passage archiverait une carte entièrement masquée.

| | |
| --- | --- |
| `electron/miroirDesMedias.ts` | Les trois règles du 28/08 tiennent : aucun git, jamais sous `APP_ROOT`, ne touche que ses fichiers. Un seul point fabrique un chemin, valide l'entrée **et** vérifie la sortie. Écriture atomique **et relue** — *une copie tronquée est pire qu'une absence, elle a l'air d'une copie.* |
| `mediasCopies()` | Ce qui rend l'incrément possible. **Sans elle il faudrait relire 261 Mo à chaque passage**, et la sauvegarde de sortie — quatre secondes — n'en aurait jamais le temps. |
| `catalogue.json` | Ce que chaque octet représente. **Fusionné, jamais remplacé** : une image oubliée par GM-OS garde sa fiche, sinon on conserverait un fichier dont on ne saurait plus le nom. |
| `MiroirDesMedias.ts` | Une copie à la fois — 115 blobs en parallèle, c'est un quart de gigaoctet en mémoire pour un travail que le disque sérialise. |

**Les images passent APRÈS l'état de session, jamais avant.** L'état est la
partie irremplaçable et la plus rapide à écrire. Et le miroir **ne lève jamais** :
une image illisible se compte et le passage continue — *un filet qui refuse de
poser la moitié qu'il peut poser ne vaut pas mieux qu'un filet absent.*

### ✅ Le premier passage, mesuré sur le disque le 2026-08-29

**116 fichiers, 260,8 Mo, zéro partiel**, catalogue présent. Par nature : 100
images, 14 sons, 1 vidéo — plus le **brouillard de guerre, 219 Ko**. Le catalogue
nomme chaque octet (`m-94211ee4-…` → `lieu-hotel-artemide.jpg`) : sans lui, une
restauration rendrait des fichiers anonymes.

*Les campagnes de David ne sont plus une sauvegarde de pointeurs.*

### ✅ Le retour, écrit le 2026-08-29

`mediasRestituables()` dit **combien** avant de proposer quoi que ce soit — *un
bouton qui ne dit pas ce qu'il va faire n'est pas cliqué le jour où il faudrait,
et il est cliqué le jour où il ne faudrait pas.* Le bandeau vit dans la
bibliothèque des médias et n'apparaît que si le miroir porte ce qu'elle n'a plus.

**Deux règles, et la seconde est celle qui fait qu'une restauration sert :**

1. **Jamais d'écrasement.** Un média déjà présent est plus récent que la copie.
2. **L'identifiant d'origine est conservé.** `addMedia` en fabrique un neuf, ce
   qui est juste pour un ajout et **ruineux pour une restauration** : une carte
   porte `"fileUrl": "m-<uuid>"`, et remettre les octets sous un autre
   identifiant donnerait un disque plein et des cartes toujours mortes — *le pire
   des résultats, parce qu'il a l'air d'une réussite.* D'où
   `restaurerUnMedia`, qui écrit sous l'identifiant reçu.

Le brouillard se remet **clé par clé et seulement s'il manque** : le remettre en
bloc écraserait ce que le meneur a dévoilé depuis.

✅ **ÉPROUVÉ EN RÉEL par David le 2026-08-29.** Image supprimée, application
relancée, bandeau apparu, image revenue **et réaffichée là où elle servait** —
c'est cette dernière ligne qui prouve que l'identifiant d'origine a été conservé,
et c'était le seul vrai risque.

⚠️ **Le bandeau avait d'abord été posé dans `ImageDashboard`** — Image-OS —
alors que David gère ses médias dans le **Media Hub** (`MediaBrowser`). Il a
supprimé une image et n'a rien vu. *Un filet rangé là où personne ne regarde
n'est pas un filet.* Il vit désormais dans les deux, et dans le Media Hub il est
**juste au-dessus de « Purger le hub global »** : au-dessus du geste après lequel
on en aura précisément besoin.

**Ce qui est déjà acquis et ne sera pas à refaire :** les trois règles de
construction (aucun git · jamais sous `APP_ROOT` · ne supprime que ses propres
fichiers), l'écriture atomique relue, et la rotation. Un instantané des médias
réutilise tout ça — il ne change que **la source** et **la cadence**.

---

# 5 · Sauvegarde de la bibliothèque des fiches

📄 **Fait foi :** ce document, plus `2026-08-27-sauvegarde-automatique.md` pour la
plomberie
🧠 **Mémoire :** `gm-os-sauvegarde-automatique`, `gm-os-fiches-de-personnage`

**Ouvert le 2026-08-28**, à la demande de David : *« rattache sur un chantier de
sauvegarde à part »*. Tenu séparément du n° 4 **parce qu'il n'attend aucune
décision** — le n° 4 est bloqué, celui-ci attend seulement que l'hôte existe.

**Ce qui l'ouvre.** La décision du 28/08 sur le chantier 3b : le moteur de fiches
garde sa bibliothèque, et **la fiche fait foi**. Or cette bibliothèque vit dans
l'IndexedDB de l'origine `gmos://` — pas dans `gmos-state-db`. **Le magasin qui
détient la vérité d'une fiche de personnage serait donc le seul qui ne soit pas
sauvegardé**, dans une application qui a déjà perdu ses campagnes deux fois.

| Base | Contenu | Sauvegardée ? |
| --- | --- | --- |
| `gmos-state-db` | l'état de session | ✅ depuis le 28/08 |
| `gmos-media-db` | les images — ~263 Mo | ❌ chantier n° 4 |
| `gmos-fog-data` | le brouillard de guerre | ❌ chantier n° 4 |
| **la base du moteur de fiches** | **personnages ET gabarits importés** | ❌ **celui-ci** |

**Ce qui rend ce chantier plus facile que le n° 4, et c'est la raison de le
tenir à part :**

- **Le moteur sait déjà s'exporter.** `backup()` rend un JSON
  `character-sheet-manager-backup` avec les gabarits non intégrés et tous les
  personnages, et `restore()` le relit. Il n'y a **rien à inventer** — juste à
  appeler ça depuis la couture plutôt que depuis un bouton.
- **C'est du texte, pas des octets.** Aucun problème de volume, donc aucune
  question de cadence ni de déduplication : c'est précisément ce qui bloque le
  n° 4.
- **La plomberie du 28/08 se réutilise telle quelle** — les trois règles,
  l'écriture atomique relue, la rotation. Comme pour le n° 4, seule **la source**
  change.

**Les TODO, dans l'ordre :**

1. ✅ **FAIT le 2026-08-28 — `backup` est au contrat `postMessage`**, publié dans
   le même passage que `list`, `openCharacter` et `create`.
2. ✅ **FAIT le 2026-08-29 — la copie entre dans la sauvegarde automatique**, sous
   `modules.fiches`, avec la date de sa prise.
3. ✅ **ÉPROUVÉE EN RÉEL le 2026-08-29, ALLER ET RETOUR.**
   **L'aller**, lu dans le fichier : `gmos-auto-2026-08-29T16-12-54.json` porte
   `modules.fiches` — **4 personnages, 69 champs chacun**, gabarit
   *Blade Runner FR*, copie prise à 18h11 et sauvegarde écrite à 18h12 en
   fermant l'application. Zéro gabarit embarqué, comme prévu : les intégrés
   reviennent avec le fichier du moteur.
   **Le retour**, par David : bibliothèque vidée, bouton cliqué, fiches revenues.
   *Une sauvegarde qu'on n'a jamais restaurée n'est pas une sauvegarde* — celle-ci
   l'a été.

### ✅ Construite le 2026-08-29

**Quand la copie est prise — tranché par David.** *Quand une fiche est ouverte
sur l'écran du meneur*, contre l'autre option : une iframe cachée en permanence,
sept mégaoctets tenus en mémoire pour un service rendu deux fois par séance.

| | |
| --- | --- |
| `useBibliothequeDesFiches` | Le magasin de la copie, persisté avec la **garde d'écriture du MJ** — c'est le huitième store à la recevoir. `priseLe` voyage avec le contenu : *une sauvegarde dont on ignore la fraîcheur est pire qu'une sauvegarde absente.* |
| `FicheHote` | Emporte la copie à chaque ouverture et à chaque saisie, groupée sur deux secondes. **Jamais en liaison `locale`** : la bibliothèque d'une tablette n'est qu'un reflet semé depuis GM-OS, et la sauvegarder l'écrirait par-dessus l'original. |
| `construireLaSauvegarde` | La range sous `modules.fiches`. Absente quand aucune fiche n'a jamais été ouverte — le cas normal. |
| couture v2 | `restore` rejoint `backup`. Il **ajoute et remplace par identifiant, il ne vide jamais** : ce qui n'est pas dans la sauvegarde reste en place. |

**⚠️ Le garde-fou qui empêche ce filet de devenir le second mécanisme de perte :
un instantané vide n'en remplace jamais un plein.** Le moteur répond aussi sur un
profil neuf, ou quand la bibliothèque a été vidée à la main — écraser une copie
de quatre personnages par une copie vide archiverait le vide. *C'est le refus de
rétrécissement de la sauvegarde automatique, appliqué ici mot pour mot.* Un
rétrécissement qui ne vide pas passe : c'est une suppression voulue.

**La restauration est offerte là où elle a du sens et nulle part ailleurs** : une
bibliothèque vide alors que GM-OS en garde une copie — le profil neuf, l'appareil
changé. La proposer sur une bibliothèque garnie inviterait à écraser des fiches
vivantes par une copie plus ancienne.

> **Ce que la copie ne voit pas, et il faut le dire :** une fiche modifiée en
> ouvrant le fichier HTML **hors de GM-OS**. La copie date de la dernière fois
> qu'une fiche a été ouverte dans le cockpit, et `priseLe` est là pour qu'on
> puisse le constater.
