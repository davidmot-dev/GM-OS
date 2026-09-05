# État et reprise — 2026-09-05

> **Base saine, vérifiée en fin de soirée** : `npm run validate` complet au vert — `tsc -b`
> propre, **3 652 tests** (302 fichiers, 1 ignoré), build de production et PWA, branche
> `feature/tablet-hub-pwa`, arbre propre et poussé.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md), et elle y vit seule —
> *une liste de restes qui existe à deux endroits en désigne un faux.* Ce document-ci ne dit
> que **par quoi reprendre** et **ce qu'il ne faut pas repayer**.

---

## Ce que ces deux jours ont produit

⭐ **La revue des guides est terminée, voies A et B.** Trente-huit guides relus écran par écran,
**cent deux défauts trouvés, tous traités** — réparés, tranchés par David, ou documentés avec leur
raison. Puis la télécommande a été refaite.

| Journée | Ce qui est entré |
| --- | --- |
| **04/09, voie A** | Les **dix lots, 38 guides**, un archivé — en une journée |
| **04/09 au soir, P1** | L'import de campagne **n'efface plus la SoundBoard** · Map-OS et Favorite-OS entrent dans la sauvegarde · la trame, les paquets et le pilote voyagent enfin dans Nexus |
| **04/09 au soir, P2** | Le brouillard périmé chez les joueurs · les **ambiances arrivent sur la télécommande** |
| **04/09 au soir, P3** | Quatorze points — dont la **coupure du son qui repartait à plein volume**, la reprise lumineuse qui suivait le numéro de piste, la couleur de jauge lue par un style sur trois, et un **dé de fiche relancé à chaque frappe** |
| **04/09 au soir, P3 bis** | **Une jauge de tension peut rester secrète** · les PNJ d'autres campagnes partent **caviardés** · les pions restent libres, par décision |
| **05/09, P4** | Couleur de grille et tamisage **exposés** · `timeMultiplier` retiré · **la cloche du minuteur sonne enfin**, avec son interrupteur · case « archive légère » · le Media Hub prend **plusieurs fichiers** |
| **05/09, télécommande** | **Navigation en colonne, libellés écrits, ligne d'état permanente** · quatre défauts muets · le **tableau blanc réparé** |
| **05/09 au soir, la séance** | Quatre retours de David en jouant : **« Couper le son » qui ne coupait que les bruitages** · le **résultat des dés** qui n'arrivait jamais · les **notes élargies** à la trame, au wiki, aux indices et au coffre Obsidian · la **messagerie** · et les **Chroniques inatteignables** en pleine partie |
| **05/09, le châssis** | L'**Ulanzi rendait la main au premier passage dans chaque module** — un `Suspense` manquant démontait tout le châssis ; trois autres émetteurs tombaient avec lui |
| **05/09, le Markdown** | **Les tableaux ne s'interprétaient nulle part** — `remark-gfm` absent, et six écrans qui reposaient chacun le réglage ; un composant unique, et une garde qui balaie tout `src/` |

---

## 1 · Par quoi reprendre, dans cet ordre

### 1. Ouvrir la télécommande sur la vraie tablette, en paysage.

⭐ **La moitié de ce document a déjà été validée en séance** — David a joué avec la refonte le soir
même, et ses quatre retours sont traités. Ce qui suit reste à juger.

C'est le travail du jour dont le plus **reste** à voir à l'écran, et il touche tout ce qu'on
manipule en séance. Quatre choses à juger, dans cet ordre :

- **La colonne de gauche** (`w-32`, calée sur « Scénario ») : trop large, trop étroite ?
- **La densité des vignettes d'images** — j'ai visé six colonnes sur 1024 px, ce qui est
  peut-être une de trop pour rester lisible à un mètre.
- **Le seuil de 900 px** qui fait basculer en barre du bas : à confirmer sur votre appareil.
- **La ligne d'état** : lancez une musique, une ambiance, un minuteur, un combat — les quatre
  doivent apparaître, et disparaître quand ils s'arrêtent.

⚠️ **« Tout couper » se tient enfoncé 700 ms.** Si le geste vous semble long ou court, c'est un
nombre, pas une conception.

### 2. Dessiner depuis la tablette, avec la gomme.

**C'est le contrôle le plus important de la journée.** Jusqu'à aujourd'hui, tout ce qui partait
d'une tablette était un **crayon blanc d'épaisseur 3** quel que soit le bouton touché — la gomme
dessinait au lieu d'effacer, et sur fond sombre un trait blanc ressemble à un trait voulu.

Le chemin : **Tableau → tracer au crayon rouge épais → prendre la gomme → repasser dessus.** Le
trait doit disparaître sur l'écran du meneur. Puis toucher le **soleil** : le fond doit passer au
clair des deux côtés.

*Mes tests prouvent que le bon outil part et que le canevas le reçoit ; ils ne peuvent pas prouver
le rendu sur le tableau du meneur.*

### 3. Vérifier une jauge de tension secrète, et une jauge ancienne.

**Clock-OS → une jauge → l'œil.** Deux choses à voir, et la seconde compte autant que la première :

- une jauge **créée aujourd'hui naît fermée** et ne doit apparaître ni sur le Player Hub, ni sur les
  tablettes, ni sur l'Ulanzi ;
- **vos jauges existantes n'ont pas bougé** — elles étaient visibles hier, elles le sont encore.

### 4. Écouter la cloche du minuteur.

Elle n'existait nulle part : le moteur était écrit en entier et personne ne l'appelait. Lancez un
minuteur de dix secondes. ⚠️ **Elle se tait quand le son général est coupé** — c'est voulu, pas un
défaut.

### 4 bis. Les quatre ajouts du soir, dans l'ordre où ils se cassent.

**Couper le son** doit couper les *trois* sources — bruitage, musique, ambiance — et **laisser les
images et les lumières**. **Le résultat d'un jet** doit apparaître sur la tablette, y compris pour
un jet lancé au pupitre, et s'effacer seul au bout de quinze secondes.

**L'onglet Messages** : écrire à un joueur depuis la tablette, et vérifier qu'il le **reçoit
vraiment**. ⚠️ C'est le point le plus fragile de la soirée : le chemin naïf aurait fait apparaître
le message dans le fil du cockpit *sans jamais l'envoyer*. Vérifiez donc sur la tablette du joueur,
pas sur la vôtre.

**Le coffre Obsidian**, sixième vue des Notes : la liste de vos 2 272 notes transite **en une
fois** à l'ouverture de l'onglet — c'est le temps de réponse qu'il faut juger. Puis ouvrir une note.

### 5. Poser une couleur de grille, et régler le tamisage du Focus.

Deux réglages dont **toute la chaîne existait sauf le bouton au bout**. Map-OS → Grille → Couleur
(le blanc reste le défaut, rien n'a bougé sur vos cartes). Puis allumer **Focus Chat** : un curseur
apparaît à côté du bouton, entre 5 % et 60 %.

---

## 2 · Trois pièges payés aujourd'hui, à ne pas repayer

**⛔ Un littéral anonyme n'oblige à rien.** Le segment du tableau blanc portait **quatre** des sept
champs que son type déclare, au milieu d'un crochet de 550 lignes. Ajouter les trois champs aurait
soigné le symptôme ; **c'est le type de retour qui soigne la cause** — `segmentDuTableau` promet
`RemoteSyncData['whiteboard']`, et retirer un champ ne compile plus. *Vérifié en dégradant le code :
`TS2741`.* La règle était déjà écrite dans l'en-tête de `remote.types.ts`, **trois champs plus
haut**, et le défaut vivait juste en dessous.

**⛔ « Réglage déclaré, jamais offert » n'est pas un diagnostic — c'en est trois.** La couleur de
grille et le tamisage avaient toute leur chaîne et il manquait un bouton : deux après-midi. Mais
`timeMultiplier` **n'avait que son nom** — personne ne le lit, aucune boucle ne fait avancer
l'horloge fantastique, et l'exposer aurait demandé d'écrire l'accélération du temps. Les ranger
ensemble dans le registre était juste comme relevé et **faux comme plan**. *On ne le voit qu'en
ouvrant le code, jamais en relisant la liste.*

**⛔ Un destinataire sans expéditeur attend, et il n'a l'air de rien.** Sur les quatre retours du
soir, **trois étaient un chaînon manquant entre deux moitiés qui existaient déjà** : l'écran de
résultat des dés guettait un message que personne n'émet ; la messagerie avait tout son mécanisme
et aucun transport ; la vue des Chroniques était classée « des deux côtés » sans porte du côté
partie. *Aucun type, aucun test unitaire ne voit ça — c'est en jouant qu'on le trouve.*

**⛔ Un nom plus large que le geste est une promesse qu'on tient par hasard.** J'ai renommé « STOP
ALL SOUNDS » en « Tout couper » en le promouvant dans la ligne d'état, **sans vérifier ce qu'il
coupait**. Il ne coupait que les bruitages. *Renommer, c'est promettre.*

**⛔ Un effet de bord n'a rien à faire dans un réducteur.** Le réflexe, pour la cloche, était
d'appeler `playChime()` dans `tickTimer`, là où le zéro se produit. *Un `set` de Zustand est un
calcul d'état* : chaque test du minuteur aurait fait sonner une cloche. Elle sonne depuis le
battement, en comparant l'avant et l'après — ce qui la rend aussi insensible à un double montage.

---

## 3 · Une chose que j'ai mal faite

**J'ai compté seize P3 là où il y en avait quatorze**, et « trois défauts qui n'étaient qu'un mot »
là où il y en avait six. L'erreur est passée dans le registre, dans le plan et dans un message de
commit ; elle a été corrigée dans les deux documents, pas dans le commit. *Un chiffre écrit dans un
registre se relit comme une mesure.*

**Et je n'avais pas contrôlé le tableau blanc** avant que David ne le demande. La passe de densité
avait touché cinq panneaux sur sept, et c'est celui que je n'avais pas ouvert qui portait le défaut
le plus coûteux de la tablette.

**J'ai noyé la question qui protège les données.** La règle est de demander si GM-OS tourne **avant
toute édition**, et je l'ai posée en première des quatre questions d'une carte dont les trois autres
portaient sur des choix d'interface — c'est-à-dire dans un contexte où l'on répond aux quatre d'un
geste. *Une consigne noyée est une consigne perdue*, et c'est une leçon que ce dépôt a déjà payée
ailleurs. Elle se pose seule.

---

*Écrit au terme de la journée du 2026-09-05, complété le soir même après la séance de David.*
