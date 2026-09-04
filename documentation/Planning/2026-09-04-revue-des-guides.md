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
son code de l'autre.** Trente-huit guides plus tard, elle a trouvé **cent deux défauts** — et pas
seulement dans les guides. Les trois quarts sont dans le code.

> ⭐ **La leçon, après les trente-huit.** *Écrire ce qu'un module fait vraiment est le meilleur
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

## ✅ Ce qui est fait — les 38 guides, les dix lots

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
| **Lot 9** — les cinq petits outils | 12o | 7 | **7** |
| **Lot 10** — `migration-guide`, **archivé** | 12m | — | — |

---

## 🗺️ Voie A — les guides restants

> ⭐ **LA VOIE A EST TERMINÉE** — le 2026-09-04, en une journée. **Les dix lots, 38 guides**,
> soixante-cinq trouvailles, cinquante-quatre corrigées.
>
> ⛔ **La plus grave est au lot 8** : Favorite-OS affirmait qu'une pastille verte « confirme que
> vos données sont en sécurité ». Ni coffre, ni pastille, ni sauvegarde — **troisième occurrence**
> de cette famille après le faux backup GitHub et Map-OS.
>
> ✅ **Et la voie B est traitée jusqu'à P3 bis, le même soir** — l'import de campagne qui effaçait
> la SoundBoard, le brouillard périmé chez les joueurs, la coupure du son qui repartait à plein
> volume, et les trois décisions de table. **Reste P4**, le ménage.

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

### ~~Lot 9 — Les petits outils~~ ✅ fait le 04/09

`Clues_User_Guide` · `Whiteboard_OS_User_Guide` · `Web_OS_User_Guide` ·
`Remote_Control_User_Guide` · `Universal_Search_User_Guide`

**Ce que le lot a donné** : **quatre guides sur cinq exacts** — les seuls de toute la revue à
passer sans correction de fond. Tout était dans `Remote_Control`, qui décrivait **cinq panneaux sur
sept** et oubliait **celui qui s'ouvre en premier**. Il a aussi **corrigé une trouvaille du matin**
(A1) : il n'y a pas de pad d'ambiance du tout. Détail au § 12o.

### ~~Lot 10 — Le reliquat~~ ✅ archivé le 04/09

`migration-guide` n'était pas un guide utilisateur : une note d'architecture du 2026-03-10, écrite
pour qui touche au code. Déplacée vers `Planning/Archive/2026-03-10-refonte-v5-architecture.md`,
avec un en-tête qui dit ce qui a vieilli dedans. Ses trois liens entrants sont repointés.

---

## 🔧 Voie B — les défauts, par risque

*Indépendante de la voie A : ces points se traitent quand on veut, dans l'ordre qu'on veut. Le
détail et les ancres sont au § 12 du registre.*

### ✅ P1 — Perte de données possible : **les six sont faits**

*Réparés le 2026-09-04 au soir, détail au § 13 du registre. Conservés ici pour mémoire.*

| # | Quoi | ✅ |
| --- | --- | --- |
| **N1** | Importer une campagne écrasait toute la bibliothèque d'ambiances de Sound-OS. | **fusion par identifiant** |
| **M1** | Map-OS n'était dans aucune sauvegarde. | **configurations et modèles de zones** ; le brouillard reste ouvert |
| **N2** | La trame n'était pas exportée par Nexus. | **exportée, réinjectée, et clonée avec ses liens** |
| **N3** | Les paquets de cartes étaient exportés et jamais réinjectés. | **réinjectés** |
| **N4** | Le pilote personnalisé était exporté et jamais réinjecté. | **ajouté, jamais remplacé** |
| **G1** | Favorite-OS n'était dans aucune sauvegarde. | **dans la sauvegarde** |

### ✅ P2 — Une fonction annoncée qui ne marche pas : **les deux sont faits**

*Réparés le 2026-09-04, détail au § 14 du registre.*

| # | Quoi | ✅ |
| --- | --- | --- |
| **A1** | Aucune ambiance n'arrivait sur la télécommande, et le code qui savait en lancer une était inatteignable. | **les deux moitiés construites** |
| **M3** | Changer de carte en cours de projection laissait aux joueurs le brouillard de la précédente. | **le brouillard part toujours, `null` compris** |

### ✅ P3 — L'écran dit autre chose que ce qu'il fait : **les quatorze sont faits**

*Réparés le 2026-09-04, détail au § 15 du registre. **Les quatre arbitrages ont été tranchés par
David le même soir** — ils sont marqués ⚖️.*

| # | Quoi | ✅ |
| --- | --- | --- |
| **M2** | Le panneau des calques annonçait « sauvegardés par carte ». Ils sont globaux. | **la phrase dit vrai** |
| ⛔ **A4** | La coupure rapide du volume repartait à **100 %**, pas au niveau d'avant. | **le niveau d'avant est rendu** |
| ⛔ **A7** | La reprise lumineuse d'Ambient-OS suivait le **numéro** de piste, pas l'ordre d'allumage. | **`allumeeLe` décide** |
| **N7** | Le badge **Nexus-Ready** compte des fichiers ; il ne dit pas si la campagne est portable. | **« *n* médias »** |
| **A2** | Les trois thèmes d'ambiance livrés sont des **gabarits sans sons**, et rien ne le signalait. | **le libellé le dit** |
| ⚖️ **T5** | Le **bouton de projection des dés** n'apparaissait qu'au survol du panneau de résultat. | **permanent** |
| ⚖️ **V2** | La liste **Voix des PNJ** ignorait la galerie de campagne. | **ceux qui ont déjà un profil, campagne active** |
| ⚖️ **V3** | Le **débruitage par défaut** était `navigateur`, le premier suspect du dépannage. | **Neuronal, et expliqué à l'écran** |
| **O3** | Le bouton **« Sync Oracle »** pousse la note dans un carnet NotebookLM, pas dans la conversation. | **« Envoyer au carnet »** |
| **O4** | La ligne **« Oracle » du diagnostic IA** teste le pont NotebookLM. | **« Pont NotebookLM (Forge) »** |
| **K1** | Le bouton **« Sensors »** du Cortex commande les effecteurs, pas les capteurs. | **« Sons & Lum. »** |
| ⚖️ **F3** | Un **dé dans une formule de fiche était relancé à chaque recalcul**. | **retenu par champ** |
| ⛔ **D4** | **La couleur déclarée d'une jauge n'était lue que par un style sur trois** — et l'exemple de la Forge garantissait qu'elle serait ignorée. | **les trois styles, hexadécimal compris** |
| **G8** | `clearAll` d'Image-OS était du **code mort** dont la confirmation mentait. | **retiré** |

**Ce que ce rang a appris.** Trois défauts sur quatorze étaient *un chemin qui s'arrête avant le
moteur* — D4, A7, A4 —, le motif que le pupitre de dés a déjà payé six fois. **Six autres n'étaient
qu'un mot** : un bouton, un badge, une ligne de diagnostic, un libellé qui nommaient autre chose que
leur travail.

*17 tests neufs, `npm run validate` vert, 3 540 tests.*

### ✅ P3 bis — Décisions de table, pas défauts : **les trois sont tranchées**

*Tranchées par David le 2026-09-04, détail au § 16 du registre. Deux ont donné du code, une s'est
close par un refus — ce qui est une réponse, pas un report.*

| # | La question | ✅ |
| --- | --- | --- |
| ⭐ **C1** | Les **jauges de tension étaient publiques**, toutes ou aucune. | **un œil par jauge, et une jauge neuve naît secrète** |
| ⚠️ **N5** | L'archive emportait les **PNJ d'autres campagnes** entiers, notes de MJ comprises. | **caviardées — le réseau reste, les secrets restent chez vous** |
| **M4** | **N'importe quel joueur déplace n'importe quel pion.** | **laissé ouvert, et le guide le dit comme un choix** |

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
