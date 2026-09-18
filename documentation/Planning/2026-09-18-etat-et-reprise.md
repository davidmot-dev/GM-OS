# État et reprise — nuit du 2026-09-17 au 18, **la journée et la soirée du 18**

> **Base saine.** `tsc -b` propre, **5 418 tests Vitest** et **195 tests E2E** (192 de
> référence + 3 de profilage), branche `feature/tablet-hub-pwa`.
>
> ⚠️ **Ce document couvre quatre moments** : la nuit du 17 au 18 (§§ 76 à 80), la purge du matin
> (§ 81), l'après-midi consacrée à la stabilité et à la vitesse (§§ 82 à 84), et la soirée Light-OS
> (§ 85).
>
> ⛔ **Un reste bloquant, et un seul** : le `baisseAttendue` de la migration des images n'est pas
> posé. Voir « Par quoi reprendre ».
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
| `e0718ba1` | `feat(purge)` — tout effacer d'un pilote ou d'une campagne (§ 81) |
| `bcc4a2a0` | `docs` — le registre 81 |
| `28d56f27` | `fix(images)` — une image fabriquée ne repart plus dans l'état persisté (§ 82) |
| `9a05a855` | `perf(session)` — une écriture par fenêtre de 250 ms (§ 83) |
| `d619a059` | `perf(rendus)` — le harnais de profilage React, et la racine qui s'abonnait à tout (§ 84) |
| `5403c3f5` | `fix(sauvegarde)` — la migration déclare sa baisse, et la doc du 18 |
| `afb1e1f1` | `fix(purge)` — la quarantaine sort du dépôt, son `.ragignore` éprouvé |
| `8dd5677d` | `chore(campagne)` — le corpus de Hadley Hope quitte le dépôt, purgé par le meneur |
| `1eb13707` | `feat(light)` — Aube dorée, et le fondu qui ne dépasse plus son battement (§ 85) |
| `0fbe10b5` | `fix(light)` — Aube dorée était trop blanche : c'est le canal **bleu** qui décide |
| `dc48856c` | `feat(light)` — les ambiances du meneur, et l'effet **Stores** |
| `41b307a9` | `docs(light)` — le catalogue des 48 effets dans le guide |
| `21550be6` | `feat(light)` — l'écran volant pour choisir un effet |
| *ce commit* | `docs` — le registre 85, le guide réécrit, et la mise à jour de ce document |

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

## Ce que la journée du 18 a produit

David : *« quand je les efface il reste des résidus qui polluent la tentative suivante. »*

| Quoi | Ce qui est entré |
| --- | --- |
| **Purger un pilote ou une campagne** | ⛔ La cause n'était **pas un oubli** : le dossier `docs/systems/<jeu>/` survivait, et **la Forge enrichit un corpus existant** — donc reforger ne repartait *jamais* de zéro. ⭐ Un **registre des détenteurs** et un **test qui lit les sources**, aperçu cochable lot par lot, **quarantaine** au lieu de suppression (§ 81) |

⭐ **Le motif de la nuit s'est répété une sixième fois** : la demande nommait un symptôme (« des
résidus »), et la cause était une fonctionnalité qui faisait correctement son travail sur une base
qu'on croyait effacée. *Quatre demandes sur cinq cette nuit, et celle-ci : suivre la chaîne avant
d'écrire une ligne reste le geste le plus rentable de ce dépôt.*

---

## Ce que l'après-midi et la soirée du 18 ont produit

David : *« est-ce que tu vois d'autres pistes à explorer pour la stabilité et la vitesse ? »*

| Quoi | Ce qui est entré |
| --- | --- |
| **Les images collées dans l'état** | ⛔ **2 078 Ko sur 2 746** de la sauvegarde étaient DEUX images en base64, et les quatre fournisseurs pouvaient les refaire. ✅ **Migré en réel : 2 812 229 → 683 961 octets** (§ 82) |
| **L'écriture du magasin de session** | ⭐ Une écriture par fenêtre de 250 ms au lieu d'une par `set()` — ils étaient 163 (§ 83) |
| **Le chantier des sélecteurs** | ⛔ **N'aura pas lieu, et c'est une décision mesurée** : harnais de profilage React construit, 2,24 ms perdus par changement, mais le coût ne vient pas du volume (§ 84) |
| Le minuteur de Clock-OS | ⛔ **Non corrigé** : mesuré à 0,0004 % du fil principal |

⭐ **Le motif de la journée : deux fois sur quatre, la mesure a contredit l'annonce que j'avais
faite.** Le minuteur et les sélecteurs étaient des intuitions raisonnables et fausses ; les images en
base64 n'étaient pas une intuition du tout — elles sont venues d'avoir **ouvert le fichier de
sauvegarde et compté**.

---

## ⛔ L'incident de 17 h 23 — une garde sans porte de sortie

La migration des images a parfaitement fonctionné. **Et la sauvegarde automatique a refusé d'écrire
pendant plus d'une heure**, à 17 h 23 puis à 18 h 29 :

> *« La sauvegarde ferait 683 961 octets contre 2 812 229 pour la précédente. Un rétrécissement de
> plus de moitié qui ne s'explique pas est traité comme une perte, pas comme une sauvegarde. »*

La garde a fait exactement son travail — c'est elle qui protège contre une perte silencieuse. Mais
`baisseAttendue` existe **et seule la purge sait le poser** : le meneur n'avait aucun moyen de dire
« cette baisse est voulue ».

⭐ ***Une garde qui protège des données doit avoir une porte pour le cas légitime qu'elle bloque —
sinon ce n'est plus une garde, c'est une impasse.***

⚠️ **Et prévenir ne remplace pas un mécanisme.** J'avais annoncé le rétrécissement à David **avant**
qu'il ne migre, en nommant la garde et le drapeau. L'incident a eu lieu quand même. *Un avertissement
dans une conversation est une note de bas de page que personne ne relit au moment où elle compte.*

### Ce qui a été fait, et ce qui reste

Le déblocage a demandé **trois messages**, parce que mon premier conseil était faux : j'avais dit
« sortez le fichier », alors que la garde compare à la **plus récente restante** — et les seize
l'étaient toutes. Les 12 récentes faisaient 2,7 Mo, les 4 plus anciennes 1,5 Mo, et 684 Ko fait moins
de la moitié des deux. *Sortir un fichier à la fois était une partie perdue d'avance.*

Les seize sont désormais rangées dans `Security_Backup_GMOS/Avant-migration/` — la garde ne descend
pas dans les sous-dossiers, donc elles ne bloquent plus et **rien n'est perdu**.

⛔ **LE CORRECTIF DE FOND N'EST PAS POSÉ.** La migration doit déclarer elle-même la baisse, comme le
fait la purge :

```ts
sessionBackupManager.sauvegarderMaintenant('après le rapatriement des images', { baisseAttendue: true });
```

Une ligne, au seul endroit qui **sait** que le rétrécissement est légitime. Sans elle, le prochain
meneur qui migre retombera exactement dans cette heure.

---

## Ce que la soirée Light-OS a produit

Quatre demandes de David, et **chacune a révélé autre chose qu'elle-même** (§ 85).

| Quoi | Ce qui est entré |
| --- | --- |
| **Aube dorée** | ✅ Éprouvée à l'écran, au second essai. ⛔ Le premier était « trop blanc » : sur une Hue, c'est le **canal bleu** qui décide entre l'or et le blanc chaud |
| **Le fondu** | ⛔ Un défaut latent sur les **47 effets** : le curseur de vitesse divisait l'attente sans toucher au fondu, et les effets accélérés s'**aplatissaient** |
| **Les ambiances** | ✅ Éprouvées à l'écran. Dupliquer un effet, le reteinter, le re-rythmer — la teinte se pose **après** le switch, parce que 36 effets sur 47 écrivent leur palette |
| **Stores** | ⚠️ **Non vu dans la pièce.** L'illusion vit **entre** les lampes : à poser sur deux ou trois |
| **L'écran volant** | ✅ Éprouvé à l'écran. La liste déroulante dépassait 50 entrées — *ce n'était plus une liste, c'était un couloir* |

⭐ **Le motif de la soirée** : *« je ne retrouve pas mes copies »* décrivait un symptome, pas le
défaut. Les copies existaient, jouaient et se capturaient — **il n'y avait pas de porte pour y
revenir.** C'est le motif des sept « chaînes complètes sans bouton au bout », mais dans l'autre sens :
ce n'est pas le bouton qui manquait, c'est le retour.

---

## 1 · Par quoi reprendre

### ⚠️ EN TÊTE : **STORES** N'A PAS ÉTÉ VU DANS LA PIÈCE

C'est le seul chantier de la journée que personne n'a jugé, et le seul dont je ne peux pas prédire le
rendu — il ne se juge **que sur deux ou trois lampes à la fois**, puisque l'illusion vit dans l'écart
entre elles. Sur une seule, il fonctionne mais ne montre rien de ce pour quoi il existe.

⚠️ **Et le rabot de fondu touche les 47 effets.** Les effets accélérés devraient avoir repris du
relief ; si l'un paraît différent de ce qu'il était, c'est là qu'il faut regarder.

### ✅ LE `baisseAttendue` DE LA MIGRATION EST POSÉ

Corrigé le 18 au soir, une fois GM-OS fermé. `InlinedMediaPanel` demande désormais une sauvegarde en
déclarant la baisse, après une migration réussie — c'est le seul endroit qui **sache** que le
rétrécissement est légitime, puisqu'il vient de le provoquer.

Un contrôle lit la source de l'écran et tombe si la ligne disparaît. **Vu rougir sur mutation.**

⚠️ **Le filet du meneur a été rétabli le soir même** : sauvegarde de fermeture à 18 h 36,
**683 955 octets**, sur l'état migré. Les seize anciennes dorment dans
`Security_Backup_GMOS/Avant-migration/`.

### ✅ LA PURGE A ÉTÉ OUVERTE À L'ÉCRAN

David l'a essayée le 18 au soir. ⚠️ **Aucun dossier `docs/_purges/` n'a été créé** : l'aperçu a donc été lu sans que rien ne soit purgé sur le disque — ce qui est exactement le geste recommandé pour un premier essai. *Le chemin d'écriture de la quarantaine, lui, n'a encore jamais servi en réel.*

### ⚠️ LA PURGE N'A JAMAIS ÉTÉ OUVERTE À L'ÉCRAN

Le premier geste qui la juge : ouvrir la **gomme** sur un jeu déjà forgé — onglet **Pilotes** du
tableau des modèles — et **lire l'aperçu sans rien purger**. Il ne touche à rien, et il dira d'un coup
si les lots correspondent au dossier réel et si les comptes des modules ont un sens.

⚠️ **Le lot « Manuel source et documents de la racine » est décoché par construction.** Si vous le
cochez, c'est le PDF du livre et ses extractions qui partent en quarantaine — récupérables dans
`docs/_purges/`, mais autant le savoir avant.

### ⚠️ Rien de tout cela n'a été joué en séance

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

### ⛔ Une garde qui bloque un cas légitime doit avoir une porte

La garde anti-rétrécissement de la sauvegarde a refusé d'écrire pendant plus d'une heure après la
migration des images — à raison, puisqu'elle ne pouvait pas savoir que la baisse de 76 % était voulue.
`baisseAttendue` existe, et **seule la purge sait le poser**.

⚠️ **J'avais prévenu David avant qu'il ne migre**, en nommant la garde et le drapeau. L'incident a eu
lieu quand même. ⭐ *Un avertissement dans une conversation est une note de bas de page que personne ne
relit au moment où elle compte — prévenir ne remplace pas un mécanisme.*

Et le déblocage a demandé trois messages parce que mon premier conseil était faux : la garde compare à
la **plus récente restante**, pas à un fichier en particulier. *Quand on conseille de retirer « le »
fichier qui bloque, il faut d'abord vérifier qu'il n'y en a pas seize.*

### ⛔ Un instrument dont le plancher dépasse le signal ne mesure pas zéro, il ne mesure rien

Deux rédactions du profilage des rendus ont rendu **0 ms** et **0,23 ms** avant qu'une troisième ne
donne 2,24 ms. La première attendait une image (16,67 ms de plancher), la seconde une tâche (~5 ms) ;
seule `actualDuration`, mesurée **dans** le commit par React lui-même, voyait quelque chose.

⭐ *Un zéro qui veut dire « je n'ai rien mesuré » ne doit jamais pouvoir se lire « il n'y a rien à
mesurer ».* La spec refuse désormais de rapporter un chiffre quand le build n'est pas celui du
profilage : elle s'ignore en le disant.

### ⚠️ Vérifier qu'un outil n'existe pas, même quand on croit inventer

`InlinedMediaPanel` et son service de 242 lignes étaient déjà là, avec la même forme en deux temps que
ce que j'écrivais. Je l'ai vu en allant **poser l'écran**, pas avant. *La leçon du 17 a été payée à
moitié : le service était écrit quand je l'ai découvert, et il a fallu le supprimer.*

Ce qui restait à faire n'était pas de le reconstruire mais de trouver **pourquoi il n'avait pas
attrapé les deux images** : il n'avait jamais été lancé, et il ne lisait pas le magasin de NPC-OS.

### ⛔ Un garde-fou qui ne peut pas échouer n'en est pas un

`sessionBackupManager.sauvegarderMaintenant()` **ne lève jamais et ne rend rien** : un refus comme un
échec se journalisent, et l'appelant reçoit le même `undefined` que pour une réussite.

Un `try/catch` autour aurait donc *toujours* laissé passer — et le code aurait eu exactement l'air d'un
code prudent. On demande son verdict au juge (`fautIlSauvegarder`, pur et public) **avant**, puis on
vérifie que `lastBackupAt` a bougé, ce que seule une écriture réussie fait.

⭐ *Avant d'envelopper un appel dans un filet, vérifier qu'il sait tomber dedans.*

### ⛔ Un filtre d'affichage n'est pas un filtre de suppression

`estDeLaCampagne` rend `true` pour un butin **sans marque** — règle juste, et voulue : *un butin d'avant
la marque appartient à la campagne qu'on regarde.* Réutilisée dans la cascade de suppression, la même
ligne aurait fait disparaître tout le butin non marqué de **toutes** les campagnes.

⭐ *La fonction était à portée de main, bien nommée, et déjà employée dix lignes plus haut — c'est
précisément ce qui la rendait dangereuse.*

### ⭐ Un magasin ne se déclare pas par la forme de ses clés

**Music-OS écrit `campagneId`, en français ; tout le reste écrit `campaignId`.** Une recherche de texte
sur `campaignId` — le premier réflexe pour écrire une cascade de nettoyage — serait passée à côté sans
rien signaler.

C'est pourquoi le registre des détenteurs est une **liste explicite**, et pourquoi un test lit les
sources pour exiger que chaque magasin persisté s'y déclare ou se déclare hors périmètre avec une
raison. ⚠️ Il a attrapé **six** de mes propres approximations à sa première exécution.

### ⚠️ Un dossier de quarantaine posé sous `docs/` est un dossier que l'Oracle indexe

Déplacer les fiches d'un corpus vers `docs/_purges/` sans rien d'autre les aurait laissées **citables** :
on aurait déplacé le problème, littéralement. Le `.ragignore` est donc écrit **avant** le premier
déplacement — *l'exclusion doit exister avant le fichier qu'elle exclut, pas après.*

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
