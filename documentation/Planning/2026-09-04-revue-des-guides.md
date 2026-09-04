# La revue des guides — le plan à suivre petit à petit

*Ouvert le 2026-09-04. Ce document est **le plan** ; les trouvailles vivent au § 12 du
[registre des chantiers garés](./2026-08-23-chantiers-gares.md). On coche ici, on détaille là-bas.*

---

## Pourquoi cette revue existe

Le 04/09, la documentation a été réparée : 180 liens cassés, 53 orphelins, six guides créés. Mais
un lien réparé ne dit rien de la **vérité** d'une page. La preuve est venue vite : le guide général
affirmait que les campagnes étaient sauvegardées sur GitHub — par le mécanisme même qui avait vidé
l'installation en mars.

D'où cette seconde passe, plus lente et plus dure : **un module à la fois, le guide d'un côté et
son code de l'autre.** Trente-trois guides plus tard, elle a trouvé **quatre-vingt-quinze défauts** — et pas
seulement dans les guides. Les trois quarts sont dans le code.

> ⭐ **La leçon, après trente-trois guides.** *Écrire ce qu'un module fait vraiment est le meilleur
> détecteur de défauts qu'on ait employé sur ce dépôt.* Aucune relecture de code ne les aurait
> trouvés : ils ne se voient qu'en confrontant une promesse à son implémentation.

---

## Le rituel d'une séance

Une séance = **un lot**. Chacun tient en une session, et se termine par un `git push`.

1. **Demander si GM-OS tourne** — avant toute édition dans `src/`.
2. **Lire le guide en entier**, et en extraire les affirmations *falsifiables* : un nombre, un nom
   de bouton, une durée, un « toutes les X ».
3. **Ouvrir le code du module** : le magasin, le tableau de bord, les composants, l'i18n.
4. **Trancher chaque affirmation** : vraie, fausse, ou invérifiable sans l'écran.
5. **Réécrire le guide**, en marquant les corrections d'un ⛔ et les découvertes d'un 🔎. *Une
   correction qu'on efface silencieusement se refait.*
6. **Consigner les défauts de code** au § 12 du registre, avec l'ancre.
7. **Réparer ce qui est petit et sûr** dans la foulée ; laisser le reste au registre.
8. **`npm run validate`**, commit, push.

---

## ✅ Ce qui est fait — 33 guides

| Guide | § | Trouvailles | Réparées |
| --- | --- | --- | --- |
| Map-OS + Brouillard et calques | 12a | 6 | — |
| Nexus-OS | 12b | 8 | — |
| Media Hub | 12c | 8 | **7** |
| Clock-OS | 12d | 5 | 1 |
| Tour de contrôle audio, Ambient-OS, Sound-OS, Music-OS | 12e | 10 | 1 |
| **Lot 1** — Tablet Hub ×2, Projection des dés | 12f | 8 | **4** |
| **Lot 2** — Storyboard, Voice-OS | 12g | 7 | **5** |
| **Lot 3** — Oracle, NotebookLM, Obsidian, synergie | 12h | 7 | **5** |
| **Lot 4** — Cortex, manuel tactique | 12i | 7 | **7** |
| **Lot 5** — Forge, partage de règles, formules | 12j | 8 | **7** |
| **Lot 6** — les quatre satellites du combat | 12k | 8 | **7** |
| **Lot 7** — Table-OS, butin | 12l | 5 | **5** |
| **Lot 8** — Image-OS, Light-OS, Favorite-OS | 12n | 8 | **7** |
| **Lot 10** — `migration-guide`, **archivé** | 12m | — | — |

---

## 🗺️ Voie A — les guides restants

> ✅ **Lots 1 à 8 faits, lot 10 archivé** — le 2026-09-04. Cinquante-huit trouvailles,
> quarante-sept corrigées. Reste **5 guides, en 1 lot** : les petits outils.
>
> ⛔ **La plus grave de toute la revue est au lot 8** : Favorite-OS affirmait qu'une pastille verte
> « confirme que vos données sont en sécurité ». Ni coffre, ni pastille, ni sauvegarde.

*L'ordre n'est pas alphabétique : il va du plus risqué au plus tranquille. Un guide faux sur ce que
voient les joueurs coûte une soirée ; un guide faux sur un outil qu'on ouvre deux fois par an,
non.*

### ~~Lot 1 — Ce que les joueurs ont sous les yeux~~ ✅ fait le 04/09

`Tablet_Hub_User_Guide` · `Tablet_Hub_Advanced_Guide` · `Dice_Projection_Guide`

**Pourquoi en premier.** Chaque module passé jusqu'ici a livré la même sorte de trouvaille : *ce
qui part chez les joueurs n'est pas ce que le guide annonce*. Les jauges de Clock-OS sont publiques
par défaut ; les pions de Map-OS sont déplaçables par n'importe qui. Le Tablet Hub est l'endroit où
cette question se pose en entier.

**Ce que le lot a donné** : les **deux** chemins de connexion documentés étaient faux — l'un vers
un écran qui n'existe pas, l'autre vers un port et un chemin erronés. *Le défaut de documentation
le plus coûteux trouvé jusqu'ici : il empêche purement et simplement d'entrer.* Et aucun des six
onglets du Hub n'était décrit. Détail au § 12f.

### ~~Lot 2 — Le code le plus récent~~ ✅ fait le 04/09

`Storyboard_User_Guide` · `Voice_OS_User_Guide`

**Ce que le lot a donné** : ce sont **les guides les plus justes rencontrés jusqu'ici** — écrits
dans la foulée du code. Les trouvailles sont donc plus fines, sauf une : **deux boutons
« Capturer active » du Storyboard visaient des champs qui n'existent pas**, et échouaient en
silence. Détail au § 12g.

### ~~Lot 3 — L'Oracle et le corpus~~ ✅ fait le 04/09

`AI_Oracle_User_Guide` · `AI_Oracle_NotebookLM_Guide` · `Obsidian_User_Guide` ·
`ai-obsidian-synergy`

**Pourquoi ensemble.** Les quatre décrivent la même chaîne : les racines documentaires, le coffre
Obsidian, le plafond RAG, les personas. Séparés, ils se contrediront.

**Ce que le lot a donné** : le pari était qu'ils se contrediraient. C'est pire — **les quatre
décrivaient le mauvais moteur**, affirmant que l'Oracle repose sur NotebookLM alors qu'il parle à
l'un des six fournisseurs configurés. Et **aucun** ne mentionnait l'interrupteur du coffre, seul
mécanisme qui donne vraiment vos notes à l'Oracle. Détail au § 12h.

### ~~Lot 4 — Le Cortex~~ ✅ fait le 04/09

`Cortex_OS_User_Guide` · `Tactical_AI_User_Manual`

**Ce que le lot a donné** : le pari s'est vérifié sur **le premier bouton du panneau**. Les deux
pages décrivaient *Sensors*, et **aucune n'avait raison** — il ne coupe ni les suggestions ni le
seul son, mais **tout le matériel**, sons et lumières. Le manuel a cessé de dupliquer : il renvoie.
Détail au § 12i.

### ~~Lot 5 — Les règles et la Forge~~ ✅ fait le 04/09

`Rule_Engine_Forge_Guide` · `Rule_Sharing_Guide` · `Character_Formula_Guide`

**Ce que le lot a donné** : les deux premiers guides décrivaient un état de l'application
**antérieur au 16/08** — modes « BRAIN / BODY » disparus, modèle « Gemini 1.5 Pro » imposé,
quatre sections de l'éditeur ignorées. Et le guide des formules donnait **deux exemples qui ne
fonctionnent pas**. Détail au § 12j.

### ~~Lot 6 — Le combat~~ ✅ fait le 04/09

`Combat_Dynamic_UI_User_Guide` · `combat_os_cohesion_guide` · `Smart_Damage_Calculator_Guide` ·
`NPC_Live_Generator_User_Guide`

**Ce que le lot a donné** : le motif y est **des tableaux inventés** — deux statuts automatiques
qui n'existent pas, une coloration des ressources par nom qui n'existe pas, et un moteur d'images
(« Gemini / Imagen-3 ») qui n'est pas celui du code. Détail au § 12k.

### ~~Lot 7 — Les tables et le butin~~ ✅ fait le 04/09

`Table_OS_User_Guide` · `Loot_Module_Guide`

**Ce que le lot a donné** : peu, et pour une bonne raison — la moitié de ces pages avait été
écrite le matin même avec le pont vers le butin. Le vieux fond de Table-OS a rendu **le jet
manuel**, qui n'était documenté nulle part. Détail au § 12l.

### ~~Lot 8 — L'image et la lumière~~ ✅ fait le 04/09

`Image_OS_User_Guide` · `Light_OS_User_Guide` · `Favorite_OS_User_Guide`

**Ce que le lot a donné** : ⛔ **la trouvaille la plus grave de toute la revue.** Favorite-OS
annonçait une synchronisation avec un « coffre central » et une pastille verte qui *« confirme que
vos données sont en sécurité »* — **ni coffre, ni pastille, et le module n'est dans aucune
sauvegarde.** Troisième occurrence de cette famille après le faux backup GitHub et Map-OS. Détail
au § 12n.

### Lot 9 — Les petits outils

`Clues_User_Guide` · `Whiteboard_OS_User_Guide` · `Web_OS_User_Guide` ·
`Remote_Control_User_Guide` · `Universal_Search_User_Guide`

**Pourquoi en fin.** Surface réduite, enjeu faible. Mais `Remote_Control` mérite un œil : c'est là
qu'on a trouvé le pad d'ambiance qui charge le silence.

### ~~Lot 10 — Le reliquat~~ ✅ archivé le 04/09

`migration-guide` n'était pas un guide utilisateur : une note d'architecture du 2026-03-10, écrite
pour qui touche au code. Déplacée vers `Planning/Archive/2026-03-10-refonte-v5-architecture.md`,
avec un en-tête qui dit ce qui a vieilli dedans. Ses trois liens entrants sont repointés.

---

## 🔧 Voie B — les 36 défauts ouverts, par risque

*Indépendante de la voie A : ces points se traitent quand on veut, dans l'ordre qu'on veut. Le
détail et les ancres sont au § 12 du registre.*

### P1 — Perte de données possible

| # | Quoi | Coût estimé |
| --- | --- | --- |
| **N1** | Importer une campagne **écrase toute la bibliothèque d'ambiances de Sound-OS**. Les playlists, deux lignes plus bas, fusionnent proprement : *le bon code est déjà là, à côté du mauvais*. | Petit |
| **M1** | **Map-OS n'est dans aucune sauvegarde** — brouillard, pions, configurations de carte, modèles de zones. | Moyen (le brouillard relève du miroir des médias, pas de l'instantané JSON) |
| **N2** | La **trame** (actes et scènes) n'est pas exportée par Nexus. | Petit |
| **N3** | Les **paquets de cartes** sont exportés et jamais réinjectés. | Petit |
| **N4** | Le **pilote personnalisé** est exporté et jamais réinjecté. | Petit |
| **G1** | **Favorite-OS n'est dans aucune sauvegarde** — ni automatique, ni export manuel. Ses dossiers sont du travail de préparation. | Petit |

### P2 — Une fonction annoncée qui ne marche pas

| # | Quoi | Coût |
| --- | --- | --- |
| **A1** | Le **pad d'ambiance de la télécommande charge le silence** (`loadTheme` ne joue rien). | ~10 lignes |
| **M3** | Soupçon : **changer de carte en cours de projection** laisserait aux joueurs le brouillard de la carte précédente. ⛔ **À vérifier à l'écran d'abord.** | Trente secondes de test |

### P3 — L'écran dit autre chose que ce qu'il fait

| # | Quoi |
| --- | --- |
| **M2** | Le panneau des calques annonce « sauvegardés par carte ». Ils sont globaux. |
| **A4** | La coupure rapide du volume remonte à **100 %**, pas au niveau d'avant. |
| **A7** | La reprise lumineuse d'Ambient-OS suit le **numéro** de piste, pas l'ordre d'allumage. |
| **N7** | Le badge **Nexus-Ready** compte des fichiers ; il ne dit pas si la campagne est portable. |
| **A2** | Les trois thèmes d'ambiance livrés sont des **gabarits sans sons**, et rien ne le signale. |
| **T5** | Le **bouton de projection des dés est introuvable** : invisible jusqu'au survol du panneau de résultat, et absent tant qu'aucun jet n'a été fait. |
| **V2** | La liste **Voix des PNJ** de Voice-OS ignore la galerie de campagne — elle ne lit que le mémo de NPC-OS. |
| **V3** | Le **débruitage par défaut** est `navigateur`, que le dépannage désigne comme le premier suspect des fins de phrase coupées. |
| **O3** | Le bouton **« Sync Oracle »** pousse la note dans un carnet NotebookLM — il n'alimente **pas** la conversation. Nom à revoir. |
| **O4** | La ligne **« Oracle » du diagnostic IA** teste le pont NotebookLM, pas la conversation. |
| **K1** | Le bouton **« Sensors »** du Cortex commande les **effecteurs** (sons, lumières), pas les capteurs. Le nom invite à l'erreur. |
| **F3** | Un **dé dans une formule de fiche est relancé à chaque recalcul** : le résultat change dès qu'on touche un autre champ. |
| **D4** | **La couleur déclarée d'une jauge n'est presque jamais appliquée** — et l'exemple que la Forge produit garantit qu'elle sera ignorée. |
| **G8** | `clearAll` d'Image-OS est du **code mort**, et sa confirmation ment sur ce qu'elle efface. |

### P3 bis — Décisions de table, pas défauts

| # | La question posée à David |
| --- | --- |
| **C1** | Les **jauges de tension sont publiques**, toutes ou aucune. Faut-il une jauge secrète ? |
| **M4** | **N'importe quel joueur déplace n'importe quel pion**, y compris vos monstres. À restreindre ? |
| **N5** | L'archive d'une campagne **emporte les PNJ d'autres campagnes** liés par une relation, notes de MJ comprises. À caviarder ? |

### P4 — Ménage

| # | Quoi |
| --- | --- |
| **M5 · C4 · A10** | ⭐ **Trois réglages déclarés qu'aucun écran n'offre** — couleur de grille, accélération du temps, rapport de tamisage. *Une seule passe : on les expose, ou on les retire.* |
| **C3** | `ChimeEngine` : une cloche entièrement écrite, sans aucun appelant. La fin d'un minuteur mériterait un son. |
| **M6** | Les effets magiques ne sont pas persistés — probablement voulu, mais rien ne le dit. |
| **N6** | `includeSounds` déclaré et jamais lu ; `includeAssets` lu mais jamais passé. |
| **N8** | L'export Nexus emporte **toutes** les ambiances et playlists, campagne ou pas. |
| **H8** | Le Media Hub n'importe **qu'un fichier à la fois**. |
| **A3 · A5 · A6 · A8** | Documentés, rien à coder. |

---

## 📌 En reprenant ce plan

*Trois choses à faire avant de choisir un lot.*

1. **Ouvrir le § 12 du registre** — c'est là que vivent les trouvailles, pas ici.
2. **Vérifier ce qui a déjà été réparé** dans le code avant de l'annoncer comme restant. Le
   2026-08-31, cinq chantiers déjà faits ont été annoncés comme ouverts.
3. **Demander si GM-OS tourne.**
