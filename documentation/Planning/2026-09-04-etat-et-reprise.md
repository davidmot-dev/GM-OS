# État et reprise — 2026-09-04

> **Base saine, vérifiée avant d'écrire ceci** : `tsc -b` propre, **3 454 tests au vert**
> (277 fichiers, 1 ignoré), build de production réussi, branche `feature/tablet-hub-pwa`
> poussée à **`c2584d4`**, arbre propre.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md), et elle y vit seule —
> *une liste de restes qui existe à deux endroits en désigne un faux.* Ce document-ci ne dit
> que **par quoi reprendre** et **ce qu'il ne faut pas repayer**.

---

## Ce que ces deux jours ont produit

Quatorze commits sur l'audio le 03/09, puis huit sur le combat dans la nuit du 03 au 04.

| Journée | Ce qui est entré |
| --- | --- |
| **02-03/09, storyboard** | Le son d'une séquence est une parenthèse · le titre n'est plus perdu · le greffon `tailwindcss-animate` posé (125 classes qui ne produisaient rien) |
| **03/09, matin** | Dés échelonnés au pupitre **et** sur tablette · atelier de thème · épingles du Nexus |
| **03/09, Voice-OS** | Sélecteur de micro · porte à hystérésis et maintien · quatre sources de saturation · **transposition refaite en WSOLA** · compression rendue réglable · **débruitage neuronal RNNoise** |
| **03/09, Music-OS** | **Alignement des niveaux** (EBU R 128), mesuré pendant l'écoute |
| **03-04/09, Combat-OS** | **Atelier des adversaires** et son bestiaire · panneau *Fiche* · deux portes vers le bestiaire · export du bestiaire avec le pilote · retrait du déclencheur de rencontres |

---

## 1 · Par quoi reprendre, dans cet ordre

**1. Lancer l'application, et regarder si Voice-OS démarre.**
⚠️ Son contexte audio est désormais **forcé à 48 kHz** (RNNoise l'exige). C'est le changement
le plus profond de la soirée, et le seul qui pourrait se manifester par un **silence** plutôt
que par un défaut de qualité. Si la carte son refuse, le débruitage neuronal se désactive
**en le disant** — mais il faut le voir.

**2. Rejouer deux seuils qui ne veulent plus dire la même chose.**
Le seuil du **ducking** (−40 dB) et celui de la **porte** (−50 dB) portaient sur le signal
compressé ; ils portent maintenant sur la voix brute, mesurée avant les effets. *Un même
nombre n'y veut plus dire la même chose* — si le ducking se déclenche tout le temps, ou plus
du tout, c'est là qu'il faut regarder avant de crier au défaut.

**3. Écouter, dans cet ordre** : le débruitage neuronal sur une vraie voix · le curseur de
compression (40 % est un point de départ, pas une réponse) · la transposition entre −8 et +7
demi-tons · l'alignement des niveaux sur une vraie playlist — **la première écoute d'une
piste n'est pas encore calée, et ce n'est pas un défaut.**

**4. Fabriquer trois adversaires en séance.** Combat-OS → colonne de droite →
**⚔ Fabriquer des adversaires**. Ce qu'il faut regarder : les puces ▲▼ proposent-elles les
bons champs sur *tes* jeux (elles n'ont été éprouvées que sur Dune et une échelle en
lettres), et les échelons en lettres sont-ils bien rangés du meilleur au pire.

---

## 2 · Cinq pièges payés ces deux jours, à ne pas repayer

**⛔ Une sonde qui ne réveille pas le défaut ne prouve rien.** Premier jeu de tests de la
transposition : une **sinusoïde**. L'ancien algorithme les passait tous. Une sinusoïde
retardée reste la même sinusoïde — le défaut ne pouvait pas se manifester. Sur une voyelle,
le même algorithme ondule de 50 %. *Avant de croire un test vert, le passer sur le code qu'il
est censé condamner.*

**⛔ Un test qui vise la mauvaise couche est vert pour de bonnes raisons.** La Fabrique
envoyait deux adversaires quand on en demandait un. Mes tests portaient sur le **magasin** —
qui faisait son travail — alors que le défaut vivait dans **l'état de l'écran**.

**⛔ Un module WebAssembly n'est pas prêt parce qu'il est instancié.** `rnnoise_create`
partait dans `__assert_fail` : il manquait `__wasm_call_ctors`, **qui remplit les tables du
modèle**. Sans lui le réseau existe et ses poids valent zéro, sans un mot.

**⛔ Une norme se recopie, elle ne se réinvente pas.** Les coefficients de pondération K
recalculés « à la manière habituelle » donnaient 1,5293 au lieu de 1,5351 : inaudible, et
pourtant fatal — la mesure n'aurait plus été comparable à celle d'aucun autre outil.

**⛔ L'identifiant se relit, il ne se devine pas.** `addEntity` **ignore** l'identifiant qu'on
lui passe et pose le sien. Un rattachement fabriqué à l'avance aurait pointé vers une fiche
inexistante, en silence.

---

## 3 · Deux choses que j'ai mal faites, et qui me regardent

**J'ai répondu faux à un vrai défaut.** *« Je crée 1 combattant, il m'en envoie 2 »* : j'ai
conclu que le second était un PJ de la scène. Le mécanisme existe — il est réel et
documenté — **mais ce n'était pas ce que David voyait**. Sa capture disait « Tireur 1 » et
« Tireur 2 ». *Un mécanisme qui expliquerait le symptôme n'est pas une preuve qu'il l'explique.*

**J'ai lancé deux pushs concurrents** sur la même branche, et le second a été rejeté sur une
référence périmée. Rien n'a été perdu, mais un push à la fois.

---

*Écrit au terme de la soirée du 2026-09-03, prolongée jusqu'au 04 au matin.*
