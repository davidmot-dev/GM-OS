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
| ✅ Les **boutons de l'Ulanzi** | 12/09 → **mesurés le 13/09** | **Les deux craintes sont levées** : l'appui parvient à Home Assistant, et les boutons **gardent leur défilé natif tout en publiant** — rien n'est confisqué à l'appareil. Sujets réels : `…/stats/buttonLeft`, `…/stats/buttonSelect` et `…/stats/buttonRight`, **pas** `button1` comme je l'avais écrit. ⭐ **Les trois publient** — et celui du milieu, qui ne fait rien sur l'appareil, est le seul entièrement libre. ⚠️ *J'avais conclu l'inverse sur une capture incomplète : deux sujets vus, le troisième déclaré absent — une absence dans un relévé partiel n'est pas une absence.* ⚠️ **Reste à éprouver** : la chaîne complète jusqu'à GM-OS, et le **filtre `payload`** — AWTRIX publie l'ÉTAT du bouton (enfoncement ET relâchement), donc sans filtre *chaque pression compte double*, ce qui ne se voit qu'à la table |
| Le **matériel débranché puis rebranché** | 12/09 | Écrit le jour même (§ 51) et **jamais éprouvé sur du vrai matériel**. Trois choses à regarder : le nom donné à l'enceinte tient-il après un cycle de débranchement ; une ambiance visée dessus la **retrouve**-t-elle ; et l'alerte d'absence n'apparaît-elle **qu'une fois**. *La signature repose sur l'hypothèse que Windows rend le même libellé au rebranchement — mesurée sur la documentation, pas sur ta machine.* |
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

⚠️ **Vidée le 12/09 au soir, rouverte le soir même.** Les cinq lignes du matin sont sorties par le
haut (§ 47 et § 48), et elle a resservi le jour même — ce qui est exactement ce qu'on lui demande.

⭐ Elle portait cette phrase depuis le matin : *« une case qu'on supprime quand elle se vide ne se
rouvre jamais quand il le faudrait »*. **Il l'a fallu huit heures plus tard.**

| Ce qu'on a vu | Comment le revoir | Pourquoi c'est différé |
| --- | --- | --- |
| ⚠️ **Échap ne ferme pas les Paramètres**, et le modal avale alors tous les clics — constaté en écrivant `e2e/nommerLeMateriel.spec.ts` | Ouvrir les Paramètres, presser Échap : rien ne se passe. Le bouton « Fermer les paramètres », lui, marche | **C'est le défaut de la Médiathèque du § 47, sur un autre écran.** *Une famille de défauts ne se referme pas écran par écran* — la traiter demande de savoir combien de surcouches sont dans ce cas, ce qui n'a pas été compté |
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

**Ancres** : `electron/boutonsDeLUlanzi.ts` (+ 24 tests), `SyncServer.traiterLAppui`,
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
5. **La librairie de widgets et son tableau de bord** (§ 12 du plan) — choisir
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
