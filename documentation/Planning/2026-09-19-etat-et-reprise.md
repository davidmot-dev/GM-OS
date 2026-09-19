# État et reprise — la journée du 2026-09-19, **Light-OS de bout en bout**

> **Base saine.** `tsc -b` propre, **5 553 tests Vitest** (435 fichiers, 1 ignoré) et **193 tests
> E2E** (2 ignorés par condition de machine), branche `feature/tablet-hub-pwa`.
>
> ⚠️ **Une exécution E2E sur deux a montré deux échecs, et ce ne sont pas des régressions.**
> `soundOs › porte seize pads` et `tableOs › des univers sont proposés` sont tombés au premier
> passage, **12 essais n’ont pas tourné derrière**, et les deux **passent en isolation** comme au
> second passage complet. Un worker = une application Electron entière : c’est la machine qui
> lâche, pas le code. *Un harnais qui s’effondre accuse le code qu’il n’a pas exécuté* — même
> leçon que `--maxWorkers=4` pour Vitest. ⚠️ **À rejouer avant de conclure à une régression.**
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md), et elle y vit seule. Ce
> document-ci ne dit que **par quoi reprendre** et **ce qu'il ne faut pas repayer**.
>
> Il prend la suite de [`2026-09-18-etat-et-reprise.md`](./2026-09-18-etat-et-reprise.md).
>
> ✅ **Deux chantiers éprouvés à l'écran** — le contenu des deux nouvelles clés de sauvegarde
> (*« j'ai appliqué les tests cela fonctionne »*) et l'**ambiance composée par l'IA**
> (*« c'est bien »*).
> ⚠️ **Les deux autres ne l'ont pas été** — la relecture du pont (§ 86) et les râteliers par
> campagne (§ 88) —, et c'est le principal reste de la journée.

---

## Ce que la journée a produit

Cinq livraisons, et **une seule demande au départ** : *« est-ce qu'on pourrait demander à une IA de
conseiller une ambiance quand on prépare une scène ? »*. Tout le reste est ce qu'il a fallu ouvrir
pour que cette demande ait un sens.

| § | Chantier | Éprouvé ? |
| --- | --- | --- |
| **86** | Le miroir des lampes ne connaissait que GM-OS — « Relire les lampes » | ⚠️ non |
| **87** | Light-OS et Sound-OS n'étaient dans **aucune** sauvegarde, et rien ne déclenchait | ✅ **oui**, à l'écran |
| **88** | Les tuiles appartiennent à une campagne — râteliers, filtre unique, fusion des instantanés | ⚠️ non |
| **89** | L'IA compose un éclairage pour une scène de la trame | ✅ **oui**, à l'écran |
| **90** | Le menu d'une atmosphère était coupé et derrière les pads — **vu par David** | ⚠️ corrigé, non revu |

⭐ **Le fil de la journée** : la demande d'IA était bloquée non par le modèle mais par **la place**.
Dix-huit tuiles partagées par toutes les campagnes ne laissent nulle part où ranger ce qu'une IA
compose. Il a fallu remonter toute la chaîne — d'abord protéger les tuiles (elles n'étaient
sauvegardées nulle part), puis leur donner un propriétaire, puis un râtelier par campagne.

---

## Par quoi reprendre

**Éprouver à l'écran.** Cinq livraisons empilées sans vérification, c'est exactement la situation où
un défaut en cache un autre. Dans l'ordre d'importance :

1. **Les râteliers** (§ 88) — ouvrir une campagne, vérifier les trois sections de la grille
   (*Cette campagne* / *Communes* / *Campagne disparue*), capturer une tuile, et surtout
   **traîner ses deux curseurs** : c'est le geste que le découpage en sections aurait pu casser.
2. ~~**L'IA** (§ 89)~~ — ✅ **fait le 19/09 au soir**, et les deux questions sont tranchées : le
   modèle respecte le compte de lampes et rend des identifiants que le moteur reconnaît.
3. **La relecture des lampes** (§ 86) — régler deux lampes depuis le téléphone, cliquer
   « Relire les lampes », vérifier que le pied de page montre la vraie pièce.
4. **La restauration** (§ 87) — dans `npm run repetition`, jamais sur le vrai profil.

---

## Ce qu'il ne faut pas repayer

### ⛔ Le pont rend de l'EFFECTIF, le magasin garde du NOMINAL

`bri` côté pont vaut `nominal × curseur global × intensité de la tuile`. Toute relecture qui recopie
tel quel **rabaisse le nominal d'un cran à chaque passage**. La règle est dans
`light/logic/relireLesLampes.ts`, avec un essai qui compare la reconnaissance à `brillanceEffective`
pour que les deux formules ne dérivent jamais.

### ⛔ « Cette liste peut-elle vraiment être vide ? »

La garde *« un instantané vide n'en remplace jamais un plein »* compte les éléments d'une liste. Elle
ne refusait **rien** pour Light-OS (dix-huit tuiles existent toujours) ni pour Sound-OS (la liste
n'est jamais vide). ⭐ *La réponse est presque toujours non quand le magasin fabrique ses cases
d'avance* — et un contrôle qui se croit posé est pire qu'un contrôle absent.

### ⛔ On vérifie ce qui entre dans le fichier, on oublie qui appuie sur le bouton

Mettre un module dans `construireLaSauvegarde` ne suffit pas : il faut que quelque chose **arme**.
Deuxième fois après `databases/` le 15/09.

⚠️ **Et l'armement large est un piège symétrique** : `useLightStore` change à chaque battement
d'effet, et armer relâche deux minutes de repos. S'abonner au magasin entier aurait fait que **plus
aucune sauvegarde ne parte pendant une séance**. *Un déclencheur trop sensible ne déclenche rien.*

### ⛔ Un test d'interface qui *atteint* un élément ne prouve pas qu'on le **voit**

Le menu d'une atmosphère était découpé par deux `overflow` et peint sous les pads. ⚠️ **`toBeVisible()`
et `click()` passaient tous les deux sur le code fautif** : le premier ne regarde ni le découpage ni
le recouvrement, le second **fait défiler** l'élément jusqu'à le rendre atteignable — *ce que le
meneur ne peut pas faire*.

⭐ *La question juste n'est pas « puis-je l'atteindre ? » mais « qu'est-ce qui est peint à cet
endroit ? »* — `document.elementFromPoint`, qui échoue en **nommant** le coupable.

⚠️ Et un troisième faux positif a failli passer : le test cherchait un libellé que le correctif
venait d'introduire, donc il échouait sur l'ancien code **pour la mauvaise raison**.

### ⛔ Un composant déclaré dans le corps d'un autre est un type neuf à chaque rendu

React démonte et remonte toute la section au lieu de la mettre à jour. Sur une grille dont les
tuiles portent des curseurs, **le curseur s'arrache de sous la souris au premier mouvement**.
Introduit et corrigé le même jour ; c'est une fonction de rendu, pas un composant.

### ⭐ Une règle juste peut s'inverser quand ce qu'elle protégeait change de forme

Deux règles posées le matin (effacer rend la case au pot commun ; une case vide reste visible
partout) sont devenues fausses l'après-midi, quand les râteliers ont cessé d'être partagés. **Les
trois essais qui les encodaient ont échoué** — ils ont fait exactement leur travail, et c'est ainsi
qu'on l'a su.

### ⛔ Un effet inventé par une IA ne lève aucune erreur

Le moteur ne trouve pas son `case`, la boucle n'est jamais lancée, la lampe reste fixe. *Une ambiance
à moitié muette ressemble à une ambiance ratée, pas à une panne.* Toute sortie de modèle qui désigne
un effet, une lampe ou une couleur passe par `light/logic/ambianceProposee.ts`.

---

## Ce que la journée a trouvé sans le chercher

| Trouvaille | Où |
| --- | --- |
| Restaurer un instantané pouvait rendre **tous les gestes de Sound-OS muets** — et la grille a l'air normale | § 87 |
| Le même remplacement en bloc écrit **quatre fois** dans les quatre modules d'ambiance | § 88 |
| Le select lumineux du Storyboard lisait `window.useLightStore.getState()` **pendant le rendu** : il ne se rafraîchissait jamais | § 88 |
| `parseInt(sceneId.split('_')[1])` aurait donné une tuile nommée **« Scene NaN »** | § 88 |
| `addMoment` ne rendait pas l'identifiant qu'il venait de créer | § 89 |

---

## ⚠️ Ce qui reste ouvert

- **« Essayer sur les lampes » avant d'enregistrer** une ambiance composée (§ 89). Demande soit de
  dupliquer `applyScene` — avec son piège des effets d'une scène précédente qui ne s'arrêtent pas —
  soit de la refactoriser. Le contournement livré est « Enregistrer puis Jouer ».
- **Les specs E2E des gestes du jour.** La suite est verte, mais **aucune spec existante n'exerce ce
  qui a été ajouté** : elle prouve qu'on n'a rien cassé, pas que le neuf marche. ⚠️ Le chemin du pont
  Hue ne sera jamais couvert — `GMOS_SANS_APPAREILS` débranche le réseau exprès.
- **Sound-OS n'est pas rattaché à une campagne.** Light-OS et Music-OS le sont ; ses atmosphères ne
  le sont pas. Rien ne presse, mais l'asymétrie est désormais la seule qui reste.

---

*Écrit le 2026-09-19. Les guides mis à jour le même jour : **11** (l'IA qui compose), **10**
(la fusion des instantanés), **75** (relecture des lampes, râteliers par campagne), **91**
(les deux modules dans la sauvegarde, et le déclencheur).*
