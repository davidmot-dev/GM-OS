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

## ⭐ Le registre consolidé — 2026-08-31, **tenu à jour le 2026-09-04**

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
> charge. Rejouer avec **`--maxWorkers=4`**. L'étape 3 de `scripts/validate.ps1` appelle la commande sans
> bride ; *un harnais qui s'effondre accuse le code qu'il n'a pas exécuté.*

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
| La **fusion et la scission de scènes** | 21/08 | À la revue de fin de séance. Livrées, jamais employées sur une vraie soirée. |
| L'**aller-retour d'image** d'une ambiance | — | Déclencher un moment de storyboard qui porte une image, la voir partir au projecteur **et revenir**. |
| La **consigne de langue** | — | On sait qu'elle **part** dans l'invite ; pas que le modèle l'**applique**. *Aucun test ne peut attraper cet écart-là.* |
| Le **dépôt des icônes par GM-OS** | 31/08 | ⛔ **La réponse est venue le soir même : non.** `/list?dir=/ICONS` rendait `[]` alors que `gmos_vk` était poussé — cadre noir. Deux causes : le flash s'efface, et **la prise de main peut rater** (un appareil qui démarre refuse les écritures quelques minutes). Le dépôt est devenu une **veille** — voir `2026-08-23-afficheur-ulanzi.md` § 17. Reste à voir en séance : qu'elle répare toute seule un appareil vidé, sans qu'on redémarre GM-OS. |
| Le **journal de contexte d'Ollama** | 22/08 | `~/ollama_debug.log` dit les titres du contexte **et leur poids** depuis le 22/08. À ouvrir après une question : une section vide et une section pleine portaient le même titre, c'est ce qu'il devait corriger. |

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

**Modules passés** : Map-OS, Nexus-OS, Media Hub, Clock-OS, **les quatre modules audio** (04/09). **Suivant** : au choix de David.

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
| ⛔ **A1** | **Le pad d'ambiance de la télécommande charge le silence.** `triggerUniversalPad` appelle `ambientStore.loadTheme`, qui pose `isPlaying: false` sur les huit pistes. Le guide promettait un « Toggle Intelligent » et un « Auto-Play » propres à la télécommande : **ni l'un ni l'autre n'existe**, et le pad fait exactement ce que fait le bouton du PC. | **À trancher.** Un pad de télécommande qui ne produit aucun son est difficile à défendre : soit on joue les pistes qui ont un volume (ce que le guide décrivait), soit on retire les thèmes d'ambiance de l'univers des pads. La première est ~10 lignes dans `sceneActions.ts`. | `remote/actions/sceneActions.ts:61-66` |
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

### 4 · Garé par décision, et à ne pas rouvrir sans raison

- **Ulanzi D — les boutons physiques.** Mesuré le 30/08 : rien en HTTP sur le firmware 0.98. MQTT ou
  rien, et un courtier est un service de plus à faire vivre. *La seule des quatre directions dont le coût
  soit une dépendance d'infrastructure et non du code.*

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
| 8 | **Revue des guides, écran par écran** | 🔄 **OUVERTE le 04/09** — Neuf guides passés, **trente-sept** trouvailles (§§ 12a-12e) — **neuf réparées**, dont **tout le Media Hub**. Plan de la suite : `2026-09-04-revue-des-guides.md` | Réparer N1 — un import de campagne écrase les ambiances de Sound-OS (le § 12c est clos) | Le rythme de David — un module à la fois |

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
