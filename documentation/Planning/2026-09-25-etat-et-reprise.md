# État et reprise — le 2026-09-25, **la carte d'un moment, la garde qui manquait à la carte, et une trame qui se range**

> **Base saine.** `tsc -b` propre, **5 979 essais Vitest** (467 fichiers, 1 ignoré), la validation
> d'avant l'envoi au vert. Branche `feature/tablet-hub-pwa`, **tout est poussé**.
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
| **118** | La carte sur UN moniteur — le constat du § 1 bis, corrigé le soir | ⚠️ non — il faut deux moniteurs de projection ouverts |
| **119** | Les titres en lettres espacées d'un PDF (« Anges de Feu ») | ✅ **oui** — les captures suivantes portent *Starting Scene* |
| **120** | Ranger le graphe de la trame — cinq essais | ✅ **oui** (*« ok c'est bien »*) |
| **121** | Le pupitre de l'écran du bas du Zenbook Duo | ✅ **oui** (*« ok ça fonctionne bien »*) |

Et un commit de données : les **fiches de Cœur de Ténèbre** (trois actes, quinze fiches), forgées le
22/09 et restées hors du dépôt.

⭐ **Trois des six chantiers étaient des défauts cachés sous une demande.** « Un problème de
connexion » était un nom de lampe ; « la liste n'est pas complète » cachait des pads qui changeaient
de son avec l'atmosphère ; « la carte disparaît » était une garde posée sur le voisin et pas sur
elle. *La demande de David désigne l'endroit ; elle ne dit pas la profondeur.*

---

## Par quoi reprendre

1. **Rendre lisibles les actes d'« Anges de Feu »** si ce n'est pas fait : Forge de la trame →
   Anges de Feu → *Rendre ces titres lisibles* (§ 119).
2. **Les deux cas de la carte jamais vus** (§ 114, repris au § 1 du registre) : un moment dont la
   carte part sur un **moniteur**, puis *Arrêter* — l'écran doit devenir noir ; et une carte
   **projetée à la main** avant un moment qui en projette une autre — elle doit revenir sur son
   écran.
3. **Un bruitage d'une atmosphère inactive** (§ 115) — c'est ce son qui doit sortir, et le pad de
   même numéro de l'atmosphère affichée ne doit pas s'allumer.
4. **La carte sur un moniteur, avec deux moniteurs de projection ouverts** (§ 118) : elle ne doit
   apparaître que sur celui qu'on a choisi.
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

### ⛔ J'ai modifié `src/` pendant les essais de David — trois fois

Dans la boucle « David essaie → je lis `main.log` → je corrige », l'application tourne
forcément. J'ai enchaîné lecture et correctif sans redemander, une fois après avoir écrit *« je ne
ferai que lire »*, et une troisième fois sur le graphe, le soir, **après** avoir noté la règle. La mémoire `gm-os-demander-avant-editer` le porte désormais : **une réponse
« GM-OS est fermé » vaut jusqu'au prochain essai, pas au-delà.**

### ⭐⭐ Une chronologie ne s'obtient pas d'une physique ; elle se pose

Le graphe de la trame était une simulation de forces : elle ne connaît ni avant ni après. Cinq essais
dans la soirée pour le ranger (§ 120) — et le plus instructif est le quatrième : *une enquête ouverte
EST une étoile*, et la forcer dans une grille fabriquait les croisements. **La forme d'une
disposition doit venir de la forme de la donnée**, pas d'un gabarit.

⚠️ **Et au cinquième, je ne savais pas si la mesure ou le choix était en cause.** Le rangement écrit
désormais dans le journal ce qu'il a visé et obtenu. *Une question qu'on se pose deux fois mérite une
ligne de journal.*

### ⛔ Garder ce qui borne, rendre lisible ce qui s'affiche

Les titres du PDF d'« Anges de Feu » (§ 119) servaient **deux maîtres** : la Forge — qui nomme les
fiches par acte et y retrouve les scènes — et la trame, qui les montre. Nettoyer à la source aurait
fait écarter **toutes** les scènes à la reforge. Le titre du livre reste en coulisse, le titre
lisible va à l'écran. *Avant de changer une valeur, chercher tous ceux qui la comparent.*

### ⛔ Deux fenêtres de la même origine partagent leur stockage

Le pupitre de l'écran du bas (§ 121) aurait été servi, en développement, par la même origine que la
fenêtre MJ — et aurait partagé le `localStorage` des campagnes. Trouvé **avant** d'écrire, parce que
la question était déjà posée par les pertes d'août : *qui d'autre écrit ici ?* Réponse : une session
à part (`persist:pupitre`).

### ⚠️ Découper un commit en reconstruisant un fichier : vérifier que chaque commit compile

La carte et les bruitages touchaient les mêmes deux fichiers. Pour deux commits, j'ai reconstruit la
version « carte seule » en défaisant les changements du son — et une recherche de `))}` a accroché
la fin d'une ligne **plus indentée** : deux lignes orphelines, un commit qui ne compilait pas. Une
copie de travail temporaire (`git worktree` + jonction vers `node_modules`) l'a montré ; réparé par
un rebase local, l'arbre final **identique octet pour octet**.

⛔ **Et l'ordre de nettoyage n'est pas indifférent** : retirer la **jonction** `node_modules`
(`rmdir`) **avant** `git worktree remove --force`, sinon la suppression traverse le lien et vide le
vrai dossier.
