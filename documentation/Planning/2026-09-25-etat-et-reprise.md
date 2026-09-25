# État et reprise — le 2026-09-25, **la carte d'un moment, et la garde qui manquait à la carte**

> **Base saine.** `tsc -b` propre, **5 937 essais Vitest** (463 fichiers, 1 ignoré). Branche
> `feature/tablet-hub-pwa`, **sept commits d'avance sur `origin`, non poussés** — et chacun des
> quatre commits de code du jour compile seul.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md).
>
> Il prend la suite de [`2026-09-22-etat-et-reprise.md`](./2026-09-22-etat-et-reprise.md).

---

## Ce que la journée a produit

| § | Chantier | Éprouvé ? |
| --- | --- | --- |
| **112** | « Inconnue, ignorée » — une lampe dont le nom commençait par une espace | ⚠️ **non** — David a renommé la lampe avant le correctif |
| **113** | La carte d'un moment choisit son écran, et peut arriver révélée | ✅ **oui**, moniteur puis Player Hub |
| **114** | La carte s'en va avec son moment | ✅ **à moitié** — vu par la trace sur le Hub ; le moniteur et le retour d'une carte projetée à la main, non |
| **115** | Le bruitage d'un moment, pris dans toutes les atmosphères | ✅ **la liste** (*« fonctionne bien »*) ; le son d'une atmosphère inactive, non confirmé |
| **116** | La photo prise avant d'attendre — la synchronisation Nexus | — sans symptôme propre |
| **117** | La cible de projection de la carte appartient au MJ | ✅ **oui** (*« ok c'est bon »*) |

Et un commit de données : les **fiches de Cœur de Ténèbre** (trois actes, quinze fiches), forgées le
22/09 et restées hors du dépôt.

⭐ **Trois des six chantiers étaient des défauts cachés sous une demande.** « Un problème de
connexion » était un nom de lampe ; « la liste n'est pas complète » cachait des pads qui changeaient
de son avec l'atmosphère ; « la carte disparaît » était une garde posée sur le voisin et pas sur
elle. *La demande de David désigne l'endroit ; elle ne dit pas la profondeur.*

---

## Par quoi reprendre

1. **Pousser les sept commits** — rien ne l'a été aujourd'hui.
2. **Les deux cas de la carte jamais vus** (§ 114, repris au § 1 du registre) : un moment dont la
   carte part sur un **moniteur**, puis *Arrêter* — l'écran doit devenir noir ; et une carte
   **projetée à la main** avant un moment qui en projette une autre — elle doit revenir sur son
   écran.
3. **Un bruitage d'une atmosphère inactive** (§ 115) — c'est ce son qui doit sortir, et le pad de
   même numéro de l'atmosphère affichée ne doit pas s'allumer.
4. ⚠️ **Le constat laissé ouvert** (§ 1 bis) : une carte projetée sur un moniteur s'affiche dans
   **toutes** les fenêtres de projection ouvertes. Antérieur, jamais signalé ; le corriger fait
   voyager `ecranDeLaCarte` entre fenêtres — un chantier à part, à ne lancer que si David le voit.
5. **Repris du 22/09, rien n'a bougé** : le **compresseur d'Ambient-OS** (décision de David, pas
   prise), les correctifs audio des §§ 106 à 110 jamais éprouvés, la **refonte de l'interface**
   (§ 76, premier geste T0.1), la **restauration** (§ 87, dans `npm run repetition`).

---

## Ce qu'il ne faut pas repayer

### ⭐⭐ Après une hypothèse fausse, la suivante se mesure

La carte du Hub disparaissait au bout d'une seconde. J'ai trouvé un mécanisme **réel** — la
synchronisation Nexus photographiait l'état avant une douzaine d'`await` (§ 116), un essai le
reproduit — et je l'ai annoncé comme **la** cause. David a redémarré : *« ça n'a pas fonctionné »*.

La seconde fois, **une trace plutôt qu'une hypothèse** : un abonnement dans le magasin de la carte,
qui tourne dans **chaque fenêtre**, écrit dans `main.log` qui change la cible ou la carte projetée,
de quoi à quoi, avec la pile. **Un seul essai** a désigné la ligne. *Un mécanisme plausible qui
explique le délai n'est pas une preuve qu'il est à l'œuvre.*

⚠️ **Les numéros de ligne d'une pile en développement sont ceux du code transformé par Vite**, pas
de la source — le chemin des fonctions se lit, les lignes non.

### ⭐ La garde posée sur le voisin

Le tableau blanc avait payé *exactement* ce défaut — le maître adoptait le `projectionTarget` d'une
fenêtre secondaire — et reçu `stripProjectionTarget`, avec un long commentaire. **La carte, trois
lignes plus haut dans le même `switch`, ne l'a jamais reçue.** *Qui d'autre a la même rustine à
poser ?* — la question existait déjà dans ce dépôt ; elle n'avait pas été posée à ce `switch`.

### ⛔ Un identifiant qui n'est unique que dans un contexte

`PAD_01` à `PAD_16` existent **dans chaque atmosphère** de Sound-OS. Retenir le pad sans son
atmosphère, c'était retenir « le troisième de celle qui sera active ». Le même piège guette tout ce
qui est **positionnel** : une case, une platine, un emplacement.

### ⛔ `tsc` ne voit pas un champ facultatif mal orthographié

Les atmosphères portent `campagneId`, pas `campaignId`. Le champ étant facultatif, l'interface
fautive compilait — **c'est l'essai du filtre par campagne qui l'a attrapé**. *Un champ facultatif
mal nommé n'est pas une erreur de type, c'est une donnée absente.*

### ⛔ J'ai modifié `src/` pendant les essais de David — deux fois

Dans la boucle « David essaie → je lis `main.log` → je corrige », l'application tourne
forcément. J'ai enchaîné lecture et correctif sans redemander, une fois après avoir écrit *« je ne
ferai que lire »*. La mémoire `gm-os-demander-avant-editer` le porte désormais : **une réponse
« GM-OS est fermé » vaut jusqu'au prochain essai, pas au-delà.**

### ⚠️ Découper un commit en reconstruisant un fichier : vérifier que chaque commit compile

La carte et les bruitages touchaient les mêmes deux fichiers. Pour deux commits, j'ai reconstruit la
version « carte seule » en défaisant les changements du son — et une recherche de `))}` a accroché
la fin d'une ligne **plus indentée** : deux lignes orphelines, un commit qui ne compilait pas. Une
copie de travail temporaire (`git worktree` + jonction vers `node_modules`) l'a montré ; réparé par
un rebase local, l'arbre final **identique octet pour octet**.

⛔ **Et l'ordre de nettoyage n'est pas indifférent** : retirer la **jonction** `node_modules`
(`rmdir`) **avant** `git worktree remove --force`, sinon la suppression traverse le lien et vide le
vrai dossier.
